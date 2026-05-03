/**
 * Decision Intel — voice mode agent entrypoint (LiveKit Agents v1.3.x).
 *
 * Architecture:
 *   Browser ─── WebRTC audio ──→ LiveKit Cloud ──→ this worker
 *                                                       │
 *                                  Deepgram Nova-3 STT ─┤
 *                                  Grok 4.3 (AI Gateway, OpenAI-compat)
 *                                  Cartesia Sonic-2 TTS
 *                                                       │
 *   Browser ←── WebRTC audio ── LiveKit Cloud ←─────────┘
 *
 * On every new room: read persona id from room metadata, fetch the
 * assembled system prompt from the main app (FOUNDER_CONTEXT + persona
 * systemPrompt + voice mode addendum + recent meetings), build the
 * voice pipeline with the persona's Cartesia voice + speed, start.
 *
 * Deployment: Railway. See ../README.md for the deployment recipe.
 *
 * v1.3.x notes vs the prior 0.7.x scaffold:
 *   - `pipeline.VoicePipelineAgent(...)` → `voice.AgentSession(...)` + `voice.Agent(...)`
 *   - `agent.start(room, participant)` → `session.start({ agent, room })`
 *   - `agent.say(text)` → `session.generateReply({ instructions: '...' })`
 *   - `chatCtx.append({ role: ChatRole.SYSTEM, text })` →
 *     `chatCtx.addMessage({ role: 'system', content: text })`
 *   - VAD + plugin construction patterns unchanged
 */

import {
  AutoSubscribe,
  cli,
  defineAgent,
  llm,
  voice,
  WorkerOptions,
  type JobContext,
  type JobProcess,
} from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as cartesia from '@livekit/agents-plugin-cartesia';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { loadVoiceContext, resolveVoiceId } from './contextLoader.js';
import { SessionMetrics } from './metrics.js';

interface RoomMetadata {
  personaId?: string;
  createdAt?: number;
}

function parseRoomMetadata(raw: string | undefined | null): RoomMetadata {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as RoomMetadata;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (err) {
    // Bad metadata JSON should never happen — token endpoint always
    // produces valid stringified JSON. Log loudly if it does so we can
    // diagnose without falling back silently.
    // eslint-disable-next-line no-console
    console.warn('[voice-worker] room metadata not valid JSON, falling back to defaults:', err);
    return {};
  }
}

/** Cartesia speed parameter is model-dependent — the API contract
 *  changed between sonic-2 and sonic-3:
 *
 *    sonic-3:  speed must be a NUMBER in [0.6, 2.0]; 1.0 = neutral.
 *              The plugin's own validation only fires a warning when
 *              speed IS a number AND out of range — passing a string
 *              like 'normal' silently sends invalid data and Cartesia
 *              rejects with an opaque "returned error".
 *    sonic-2-2025-03-07: speed accepts named presets via the legacy
 *              experimental-controls API version ('fastest' | 'fast'
 *              | 'normal' | 'slow' | 'slowest').
 *    sonic-2 (bare): speed not supported at all.
 *
 *  Our persona profiles store numeric speed (-0.1 to 0.15) which is
 *  the LiveKit/Cartesia native scale. Map on read:
 *    - sonic-3 family: 1.0 + persona_speed, clamped to [0.6, 2.0].
 *      So persona 0   → 1.0 (neutral); persona 0.15 → 1.15; -0.1 → 0.9.
 *    - other models: named preset by sign of persona_speed.
 *
 *  Detection by substring on the model name keeps this future-proof
 *  for sonic-3 patches like 'sonic-3-2025-XX-XX' or 'sonic-3-preview'.
 */
function mapSpeed(numeric: number, model: string): number | 'slow' | 'normal' | 'fast' {
  if (model.includes('sonic-3')) {
    const value = 1.0 + numeric;
    return Math.max(0.6, Math.min(2.0, value));
  }
  if (numeric < -0.05) return 'slow';
  if (numeric > 0.05) return 'fast';
  return 'normal';
}

export default defineAgent({
  /**
   * Prewarm: load Silero VAD once per worker process so the per-session
   * cold start is sub-100ms. VAD is the gatekeeper for voice activity
   * detection + interruption handling.
   */
  prewarm: async (proc: JobProcess) => {
    // Connectivity probe — runs once per worker process boot. The rtc-node
    // Rust engine hits https://<livekit-host>/settings/regions BEFORE
    // attempting to dial signaling. From inside a Railway container that
    // request was failing with reqwest's "error sending request for url"
    // (couldn't even get a response), but the same URL returns HTTP/2 200
    // from a developer laptop. We need to know which side is broken: the
    // container's network egress, or the rtc-node Rust HTTP/TLS stack
    // specifically. Node's built-in fetch uses OpenSSL + Undici (totally
    // separate from rtc-node's rustls + reqwest), so a Node fetch result
    // pins the failure cleanly.
    try {
      const probeHost = new URL(config.livekit.url.replace(/^ws/, 'http')).host;
      const probeUrl = `https://${probeHost}/settings/regions`;
      const t0 = Date.now();
      const res = await fetch(probeUrl, {
        method: 'GET',
        // 8s timeout — well under the worker init timeout (10s).
        signal: AbortSignal.timeout(8000),
      });
      const body = await res.text();
      // eslint-disable-next-line no-console
      console.log(
        `[voice-worker] connectivity probe — url=${probeUrl} status=${res.status} bodyBytes=${body.length} elapsedMs=${Date.now() - t0}`
      );
    } catch (probeErr) {
      const e = probeErr as { name?: string; message?: string; cause?: unknown };
      // eslint-disable-next-line no-console
      console.error(
        '[voice-worker] connectivity probe FAILED — Node fetch cannot reach LiveKit regions endpoint',
        '\n  name:', e?.name,
        '\n  message:', e?.message,
        '\n  cause:', typeof e?.cause === 'object' ? JSON.stringify(e.cause, Object.getOwnPropertyNames(e.cause as object)) : e?.cause
      );
      // Don't throw — let the worker continue to boot so we can compare
      // probe failure vs ctx.connect failure for the same session. If the
      // probe fails we expect ctx.connect to fail too with the matching
      // pattern; if the probe succeeds and ctx.connect still fails, the
      // bug is in the rtc-node Rust client.
    }

    // Cold-start prewarm — establish DNS resolution + TLS handshake
    // for the three downstream API endpoints (Cartesia TTS, Deepgram
    // STT, AI Gateway LLM) at worker boot, so the first session's
    // first turn doesn't pay the connection-setup cost. ~50-200ms
    // saved per provider per first turn — adds up to roughly 0.5s
    // off the time-to-first-audio for a fresh user. HEAD requests
    // touch zero API quota beyond the trivial connection overhead.
    // Promise.allSettled so a failure on any one provider doesn't
    // block the others (or the worker boot).
    const prewarmEndpoints = [
      { name: 'cartesia', url: 'https://api.cartesia.ai' },
      { name: 'deepgram', url: 'https://api.deepgram.com' },
      { name: 'ai-gateway', url: config.llm.baseUrl },
    ];
    await Promise.allSettled(
      prewarmEndpoints.map(async ({ name, url }) => {
        const t0 = Date.now();
        try {
          const res = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(3000),
          });
          // eslint-disable-next-line no-console
          console.log(
            `[voice-worker] api prewarm ${name} — url=${url} status=${res.status} elapsedMs=${Date.now() - t0}`
          );
        } catch (warmErr) {
          // Non-fatal: if a provider is reachable from this worker on
          // the actual session call but blocks HEAD requests (some do),
          // session-time TLS still has to handshake. Logged so we know
          // which provider didn't warm.
          // eslint-disable-next-line no-console
          console.warn(
            `[voice-worker] api prewarm ${name} skipped — ${(warmErr as Error).message} (session-time will pay full TLS cost for this provider)`
          );
        }
      })
    );

    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx: JobContext) => {
    const startedAt = Date.now();

    // Log the assignment URL the rtc-node engine will dial. The Railway
    // log row for an entry-function failure truncates the underlying
    // cause after the colon (`failed to retrieve regio...`), so we need
    // to capture (a) the URL in case it's malformed, (b) the FULL error
    // chain (message + stack + cause) ourselves before re-throwing.
    const assignedUrl = (ctx.info as { url?: string } | undefined)?.url ?? '<no-url-in-ctx.info>';
    // eslint-disable-next-line no-console
    console.log(
      `[voice-worker] entry start — jobId=${ctx.job.id} room=${(ctx.room.name ?? 'unknown-room')} assignedUrl=${assignedUrl}`
    );

    // Re-run the connectivity probe HERE in the entry function. The
    // prewarm probe runs in the worker process; entry runs in a child
    // job process spawned per dispatch (LiveKit Agents architecture).
    // If the entry-process probe also succeeds but ctx.connect still
    // fails, the bug is locked into the rtc-node Rust client (reqwest
    // + rustls cannot do what Node fetch can in the SAME process).
    try {
      const probeUrl = `https://${new URL(assignedUrl.replace(/^ws/, 'http')).host}/settings/regions`;
      const t0 = Date.now();
      const res = await fetch(probeUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      });
      const body = await res.text();
      // eslint-disable-next-line no-console
      console.log(
        `[voice-worker] entry-process probe — url=${probeUrl} status=${res.status} bodyBytes=${body.length} elapsedMs=${Date.now() - t0}`
      );
    } catch (probeErr) {
      const e = probeErr as { name?: string; message?: string; cause?: unknown };
      // eslint-disable-next-line no-console
      console.error(
        '[voice-worker] entry-process probe FAILED — Node fetch cannot reach LiveKit regions endpoint from job process',
        '\n  name:', e?.name,
        '\n  message:', e?.message,
        '\n  cause:', typeof e?.cause === 'object' ? JSON.stringify(e.cause, Object.getOwnPropertyNames(e.cause as object)) : e?.cause
      );
    }

    // Connect to the room with SUBSCRIBE_ALL (NOT AUDIO_ONLY).
    //
    // AUDIO_ONLY in @livekit/agents v1.3.x has a hidden trap: it
    // sets the underlying room.connect's autoSubscribe to false,
    // then iterates EXISTING remote participants and subscribes to
    // their audio tracks once. The founder joins AFTER ctx.connect
    // runs (worker is dispatched before founder publishes mic), so
    // the iteration is over an empty set, the room-level
    // autoSubscribe is off, and the founder's mic publishes into
    // the room with subscribed=false. STT then receives zero audio
    // frames and turns=0 forever.
    //
    // SUBSCRIBE_ALL sets room-level autoSubscribe=true, which
    // auto-subscribes to ANY new published track from the founder
    // (or any future participant). The founder doesn't publish
    // video, so SUBSCRIBE_ALL is functionally equivalent to
    // AUDIO_ONLY for our use case but actually works for late-
    // joining participants.
    //
    // Verified via room snapshot log on 2026-05-04: with
    // AUDIO_ONLY, founder's mic showed kind=KIND_AUDIO source=
    // SOURCE_MICROPHONE subscribed=FALSE. Switching to
    // SUBSCRIBE_ALL fixes the subscription.
    try {
      await ctx.connect(undefined, AutoSubscribe.SUBSCRIBE_ALL);
    } catch (err) {
      // Print the full error structure so the Railway log carries the
      // underlying region-fetch / signaling cause that pino truncates
      // when the worker harness logs the bare exception.
      const e = err as { message?: string; stack?: string; cause?: unknown; name?: string };
      // eslint-disable-next-line no-console
      console.error(
        '[voice-worker] ctx.connect failed — full error chain follows',
        '\n  name:', e?.name,
        '\n  message:', e?.message,
        '\n  cause:', typeof e?.cause === 'object' ? JSON.stringify(e.cause, Object.getOwnPropertyNames(e.cause as object)) : e?.cause,
        '\n  assignedUrl:', assignedUrl,
        '\n  stack:', e?.stack
      );
      throw err; // re-throw so the worker harness still records the failure
    }

    // Wait for the founder to actually join. Until then there's no one
    // to talk to and Cartesia/Deepgram should not be billed.
    const participant = await ctx.waitForParticipant();

    const meta = parseRoomMetadata(ctx.room.metadata);
    const personaId = meta.personaId ?? 'default';

    // Pull system prompt parts from the main app. Single source of truth
    // for FOUNDER_CONTEXT lives there; if this fetch fails we cannot
    // safely run voice mode (would degrade to a generic chatbot without
    // grounding) — disconnect the room cleanly with a logged error.
    let voiceContext;
    try {
      voiceContext = await loadVoiceContext(personaId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[voice-worker] failed to load voice context:', err);
      await ctx.room.disconnect();
      return;
    }

    const voiceId = resolveVoiceId(voiceContext.voiceProfile);

    // eslint-disable-next-line no-console
    console.log(
      `[voice-worker] session start — room=${(ctx.room.name ?? 'unknown-room')} persona=${voiceContext.label} voiceId=${voiceId} participant=${participant.identity}`
    );

    // Concatenate the system-prompt parts (FOUNDER_CONTEXT + persona
    // prompt + voice addendum + recent meetings) into a single
    // `instructions` string for the v1.3.x Agent API. The previous
    // ChatContext.append pattern was 0.7.x-only; v1.3.x prefers
    // `instructions` on the Agent + an optional ChatContext seed.
    const instructions = voiceContext.systemPromptParts
      .map(p => p.content)
      .join('\n\n');

    // Optional initial chat context — empty for now since we have no
    // prior turns to seed. The Agent's `instructions` carries the
    // system prompt; chatCtx is for prior conversation history when
    // we wire text→voice handoff in a follow-up.
    const initialChatCtx = new llm.ChatContext();

    const sttPlugin = new deepgram.STT({
      apiKey: config.deepgram.apiKey,
      model: 'nova-3',
      smartFormat: true,
      interimResults: true,
    });

    const llmPlugin = new openai.LLM({
      apiKey: config.llm.apiKey,
      baseURL: config.llm.baseUrl,
      model: config.llm.model,
      temperature: 0.6,
    });

    const ttsPlugin = new cartesia.TTS({
      apiKey: config.cartesia.apiKey,
      model: config.cartesia.model,
      voice: voiceId,
      // mapSpeed picks the right type per model — number for sonic-3,
      // named preset for sonic-2 family. Passing a string preset to
      // sonic-3 makes Cartesia reject every synthesis with no useful
      // error body in the plugin output (just "Cartesia returned
      // error" repeating), which was the symptom the founder hit on
      // 2026-05-04 after switching CARTESIA_MODEL=sonic-3.
      speed: mapSpeed(voiceContext.voiceProfile.speed, config.cartesia.model),
    });

    const vad = ctx.proc.userData.vad as silero.VAD;

    // v1.3.x AgentSession owns the voice loop (VAD + STT + LLM + TTS).
    // Interruptions are enabled by default in v1.3.x (turnHandling.
    // interruption.enabled defaults to true), so no explicit option
    // needed — the founder can barge in mid-response naturally.
    const session = new voice.AgentSession({
      vad,
      stt: sttPlugin,
      llm: llmPlugin,
      tts: ttsPlugin,
    });

    const agent = new voice.Agent({
      instructions,
      chatCtx: initialChatCtx,
    });

    const metrics = new SessionMetrics((ctx.room.name ?? 'unknown-room'), voiceContext.personaId);

    // Hard session timeout — safety net if the JWT TTL is somehow
    // bypassed. Disconnects the room cleanly at 30 min and logs the
    // final session metrics for the Railway log stream.
    const sessionTimeout = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(`[voice-worker] hard timeout reached — disconnecting room=${(ctx.room.name ?? 'unknown-room')}`);
      metrics.log('hard-timeout');
      void ctx.room.disconnect();
    }, config.sessionTimeoutMs);

    // Final-summary log on disconnect — gives the founder per-session
    // cost visibility in the Railway log stream until the persistent
    // dashboard ships.
    ctx.room.once('disconnected', () => {
      clearTimeout(sessionTimeout);
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      // eslint-disable-next-line no-console
      console.log(
        `[voice-worker] session end — room=${(ctx.room.name ?? 'unknown-room')} elapsedSec=${elapsed}`
      );
      metrics.log('end');
    });

    // Verbose track-event logging so we can pin "no audio" / "STT got
    // zero seconds" symptoms. The most diagnostic question is: does
    // the agent SEE the founder's mic track being published? If not,
    // STT never gets audio and turns=0. Logged before session.start
    // so we capture the trackPublished event whether it arrives early
    // or late.
    type TrackPubInfo = { sid?: string; name?: string; kind?: number };
    type ParticipantInfo = { identity?: string; trackPublications?: Map<string, TrackPubInfo> };
    ctx.room.on('trackPublished', (publication: TrackPubInfo, participant: ParticipantInfo) => {
      // eslint-disable-next-line no-console
      console.log(
        `[voice-worker] trackPublished — participantIdentity=${participant.identity} ` +
          `trackSid=${publication.sid} trackName=${publication.name} kind=${publication.kind}`
      );
    });
    ctx.room.on('trackSubscribed', (_track: unknown, publication: TrackPubInfo, participant: ParticipantInfo) => {
      // eslint-disable-next-line no-console
      console.log(
        `[voice-worker] trackSubscribed — participantIdentity=${participant.identity} ` +
          `trackSid=${publication.sid} trackName=${publication.name} kind=${publication.kind}`
      );
    });

    // Snapshot of remote participants + their tracks RIGHT NOW so we
    // know the room state at session-start time. If founder's mic
    // isn't here yet, the trackPublished/Subscribed logs above will
    // catch it when it arrives.
    const remoteSnapshot = Array.from(ctx.room.remoteParticipants.values()).map(p => ({
      identity: p.identity,
      tracks: Array.from(p.trackPublications.values()).map(pub => ({
        sid: pub.sid,
        name: pub.name,
        kind: pub.kind,
        subscribed: pub.subscribed,
      })),
    }));
    // eslint-disable-next-line no-console
    console.log(
      `[voice-worker] room snapshot at session.start — ${JSON.stringify(remoteSnapshot)}`
    );

    // Wrap session.start in try/catch so plugin-init failures surface
    // with their plugin name + error chain. A silent failure here means
    // the room shows "connected" on both sides but no STT/LLM/TTS ever
    // fires, and the only signal is "no audio." Make that loud.
    try {
      await session.start({
        agent,
        room: ctx.room,
      });
      // eslint-disable-next-line no-console
      console.log(
        `[voice-worker] session.start completed — pipeline ready (vad+stt+llm+tts wired). room=${(ctx.room.name ?? 'unknown-room')}`
      );
    } catch (startErr) {
      const e = startErr as { name?: string; message?: string; stack?: string; cause?: unknown };
      // eslint-disable-next-line no-console
      console.error(
        '[voice-worker] session.start FAILED — pipeline never initialized',
        '\n  name:', e?.name,
        '\n  message:', e?.message,
        '\n  cause:', typeof e?.cause === 'object' ? JSON.stringify(e.cause, Object.getOwnPropertyNames(e.cause as object)) : e?.cause,
        '\n  cartesiaModel:', config.cartesia.model,
        '\n  cartesiaVoiceId:', voiceId,
        '\n  llmModel:', config.llm.model,
        '\n  llmBaseUrl:', config.llm.baseUrl,
        '\n  sttModel: nova-3',
        '\n  stack:', e?.stack
      );
      // Disconnect so the browser sees a clean error instead of a
      // silent-empty-room timeout.
      await ctx.room.disconnect();
      return;
    }

    // Greet the founder so they know the session is live. The persona's
    // voice rule + voice-mode addendum keep the greeting in character.
    const greetingText =
      personaId === 'skeptical_investor'
        ? "I've read your context. What are we pressure-testing?"
        : personaId === 'cognitive_psychologist'
          ? 'I have your context loaded. What decision are we examining?'
          : personaId === 'business_strategist'
            ? "I've reviewed the context. What strategic question are we testing?"
            : "I'm here. What are we working on?";

    // Use session.say() instead of session.generateReply() for the
    // greeting. Two reasons this is the right shape:
    //
    //   1. session.say(text) feeds the literal string straight into
    //      Cartesia for synthesis — no LLM round-trip. Grok via AI
    //      Gateway was returning empty greetings (the OpenAI plugin
    //      either doesn't parse Grok's streaming format correctly OR
    //      Grok interprets `Greet briefly: "..."` as instructions
    //      not a target response and emits nothing). Empty LLM output
    //      → empty Cartesia input → "Invalid transcript: Your initial
    //      transcript is empty" rejection → no audio. session.say()
    //      sidesteps that entire failure surface.
    //
    //   2. The greeting text is fixed per persona and chosen for the
    //      product voice — there's no benefit to letting the LLM
    //      regenerate it on every session start. addToChatCtx=true so
    //      subsequent LLM turns know the agent already greeted.
    //
    // Subsequent turns (founder speaks → STT → LLM → TTS) still go
    // through the normal AgentSession pipeline. If that path also
    // returns empty from Grok, we'd need to debug separately, but
    // the greeting failure was the immediately blocking symptom.
    try {
      session.say(greetingText, { addToChatCtx: true });
      // eslint-disable-next-line no-console
      console.log(`[voice-worker] greeting dispatched via session.say() — text="${greetingText}" room=${(ctx.room.name ?? 'unknown-room')}`);
    } catch (sayErr) {
      const e = sayErr as { name?: string; message?: string; stack?: string; cause?: unknown };
      // eslint-disable-next-line no-console
      console.error(
        '[voice-worker] session.say FAILED — greeting never synthesized.',
        '\n  name:', e?.name,
        '\n  message:', e?.message,
        '\n  cause:', typeof e?.cause === 'object' ? JSON.stringify(e.cause, Object.getOwnPropertyNames(e.cause as object)) : e?.cause,
        '\n  cartesiaVoiceId:', voiceId,
        '\n  stack:', e?.stack
      );
    }
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
