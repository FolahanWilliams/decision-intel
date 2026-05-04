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
import * as google from '@livekit/agents-plugin-google';
import * as silero from '@livekit/agents-plugin-silero';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { loadVoiceContext, resolveVoiceId } from './contextLoader.js';
import { SessionMetrics } from './metrics.js';
import { buildTools } from './tools.js';

interface RoomMetadata {
  personaId?: string;
  createdAt?: number;
  /** Optional cross-session memory continuity. Server (voice-token
   *  route) serializes the last ~10 text-chat messages into room
   *  metadata at room-creation time. Worker reads these here at
   *  session start and seeds AgentSession.chatCtx so the LLM has
   *  the prior conversation context — voice picks up where text
   *  chat left off. */
  recentChatMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
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
    // Loud startup warning for known-broken LLM/AI-Gateway combos.
    // The LiveKit OpenAI plugin's streaming parser doesn't match the
    // OpenAI-compat streaming format that some providers emit through
    // Vercel AI Gateway. Symptom: "TTS stream stalled after producing
    // audio, forcing close" + "Cartesia returned error" mid-reply.
    // Verified broken combos via the LiveKit OpenAI plugin + AI Gateway
    // (the OpenAI-compat shim doesn't preserve their streaming format):
    //   - xai/grok-* (Grok)
    //   - deepseek/* (DeepSeek)
    // Verified working:
    //   - google/* (Gemini) — uses NATIVE @livekit/agents-plugin-google,
    //     not the OpenAI shim. Removed from broken list 2026-05-04.
    //   - openai/gpt-4o-mini, openai/gpt-4o
    //   - anthropic/claude-haiku-4-5 (likely; not yet tested in voice)
    const knownBrokenLlmPrefixes = ['xai/', 'deepseek/'];
    if (knownBrokenLlmPrefixes.some(p => config.llm.model.startsWith(p))) {
      // eslint-disable-next-line no-console
      console.warn(
        '\n' +
          '═══════════════════════════════════════════════════════════════════\n' +
          `[voice-worker] ⚠ LLM model ${config.llm.model} is in the known-broken list.\n` +
          '  The LiveKit OpenAI plugin\'s streaming parser does not match this\n' +
          '  provider\'s OpenAI-compat format via Vercel AI Gateway. Symptom:\n' +
          '  "TTS stream stalled" + "Cartesia returned error" mid-reply.\n' +
          '  FIX: in Railway Variables, set VOICE_LLM_MODEL=openai/gpt-4o-mini\n' +
          '  (or remove VOICE_LLM_MODEL/GROK_MODEL so the default kicks in).\n' +
          '═══════════════════════════════════════════════════════════════════\n'
      );
    }

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
      { name: 'ai-gateway', url: config.llm.aiGatewayBaseUrl },
      { name: 'google-ai', url: 'https://generativelanguage.googleapis.com' },
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
      `[voice-worker] session start — room=${(ctx.room.name ?? 'unknown-room')} persona=${voiceContext.label} voiceId=${voiceId} participant=${participant.identity} llmModel=${config.llm.model} cartesiaModel=${config.cartesia.model}`
    );

    // Latency instrumentation: log the size of system prompts being
    // sent to the LLM. Big prompts = slow first-token = perceived lag.
    // After the lean VOICE_FOUNDER_CONTEXT cut, this should report
    // ~2-5KB total instead of the previous ~280KB.
    const promptBytes = voiceContext.systemPromptParts.reduce(
      (sum, p) => sum + (p.content?.length ?? 0),
      0
    );
    // eslint-disable-next-line no-console
    console.log(
      `[voice-worker] system prompt size — ${promptBytes} chars (~${Math.round(promptBytes / 1024)}KB) across ${voiceContext.systemPromptParts.length} blocks`
    );

    // Concatenate the system-prompt parts (FOUNDER_CONTEXT + persona
    // prompt + voice addendum + recent meetings) into a single
    // `instructions` string for the v1.3.x Agent API. The previous
    // ChatContext.append pattern was 0.7.x-only; v1.3.x prefers
    // `instructions` on the Agent + an optional ChatContext seed.
    const instructions = voiceContext.systemPromptParts
      .map(p => p.content)
      .join('\n\n');

    // Initial chat context — seed with recent text-chat history (if
    // provided in room metadata) so voice mode picks up where the
    // last conversation left off. Cross-session memory continuity:
    // founder switches voice on after a long text exchange and the
    // agent already knows what was discussed; or starts a new voice
    // session after a previous one and the prior voice transcript
    // (which auto-flushed to text chat on disconnect) is here too.
    const initialChatCtx = new llm.ChatContext();
    const seedHistory = meta.recentChatMessages ?? [];
    if (seedHistory.length > 0) {
      for (const turn of seedHistory) {
        // Use the v1.3.x ChatContext.addMessage API. Both 'user' and
        // 'assistant' roles are accepted; system prompts ride on
        // Agent({ instructions }) above so we don't duplicate them
        // here.
        initialChatCtx.addMessage({
          role: turn.role,
          content: turn.content,
        });
      }
      // eslint-disable-next-line no-console
      console.log(
        `[voice-worker] seeded chatCtx with ${seedHistory.length} prior messages — memory continuity active`
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(
        `[voice-worker] no prior chat history — voice session starts cold`
      );
    }

    // Latency tuning: drop default endpointing to detect end-of-utterance
    // faster. Default is ~10ms VAD endpointing + 1000ms silence-utterance,
    // which makes the agent wait a full second after the founder stops
    // speaking before the LLM is invoked. Setting endpointing=300ms +
    // utteranceEndMs=600ms cuts ~700ms of dead air per turn while
    // still being safe enough to not chop the tail of a sentence.
    // Tune higher if Deepgram starts cutting words mid-sentence.
    // @see https://developers.deepgram.com/docs/utterance-end
    //
    // Cast through `as never` because the typed STT options interface
    // doesn't expose endpointing/utteranceEndMs in @types but the
    // underlying Deepgram WebSocket API + LiveKit plugin both honor
    // these keys at runtime.
    const sttPlugin = new deepgram.STT({
      apiKey: config.deepgram.apiKey,
      model: 'nova-3',
      smartFormat: true,
      interimResults: true,
      endpointing: 300,
      utteranceEndMs: 600,
    } as never);

    // LLM plugin selection branches on the model slug prefix:
    //   google/<model>  → native Google plugin (uses GOOGLE_API_KEY)
    //   anything else   → LiveKit OpenAI plugin via Vercel AI Gateway
    //
    // Google plugin talks directly to Gemini's native API — bypasses
    // the OpenAI-compat shim that broke Grok/Gemini through the
    // gateway. Faster TTFT (~100-200ms vs 300-500ms) + higher
    // generation rate (~200 tok/s vs ~80) + native context caching.
    let llmPlugin;
    if (config.llm.model.startsWith('google/')) {
      const geminiModel = config.llm.model.slice('google/'.length);
      if (!config.llm.googleApiKey) {
        throw new Error(
          '[voice-worker] GOOGLE_API_KEY missing — required when VOICE_LLM_MODEL starts with "google/". ' +
            'Set it in Railway Variables.'
        );
      }
      llmPlugin = new google.LLM({
        apiKey: config.llm.googleApiKey,
        model: geminiModel as never,
        temperature: 0.6,
      });
    } else {
      if (!config.llm.aiGatewayApiKey) {
        throw new Error(
          '[voice-worker] AI_GATEWAY_API_KEY missing — required when VOICE_LLM_MODEL is non-google. ' +
            'Set it in Railway Variables, or change VOICE_LLM_MODEL to start with "google/".'
        );
      }
      llmPlugin = new openai.LLM({
        apiKey: config.llm.aiGatewayApiKey,
        baseURL: config.llm.aiGatewayBaseUrl,
        model: config.llm.model,
        temperature: 0.6,
      });
    }

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
    //
    // turnHandling.preemptiveGeneration.enabled = false:
    //   v1.3.x defaults preemptive generation ON, which starts LLM
    //   generation BEFORE the founder finishes speaking. Optimistic,
    //   but creates a race-condition class when the founder gives
    //   two utterances close together (e.g. "I want to strengthen my
    //   role positioning" → 2s pause → "Sorry, I meant overall
    //   positioning"). Pre-emptive turn 1 is mid-flight when turn 2's
    //   STT FINAL fires; both turns get speech handles created;
    //   Cartesia receives two synthesis requests racing each other
    //   and errors out; the AgentActivity gets stuck and won't accept
    //   subsequent turns. Verified in Railway logs t=58272 → 60841:
    //   thinking → listening WITH NO SPEAKING state, then immediate
    //   Cartesia error on the next turn. Disabling preemptive
    //   generation makes turn handling strictly serial: STT FINAL
    //   → LLM call → TTS → done → next turn. Predictable, no races.
    //   Cost is ~200-500ms of perceived added latency per turn (the
    //   LLM no longer has a head start), which is the right trade
    //   for a working session over a faster-but-broken one.
    //
    // Interruptions are still enabled by default — the founder can
    // still barge in mid-response naturally; only the speculative
    // LLM-pre-call optimization is off.
    const session = new voice.AgentSession({
      vad,
      stt: sttPlugin,
      llm: llmPlugin,
      tts: ttsPlugin,
      turnHandling: {
        preemptiveGeneration: { enabled: false },
      },
    });

    // Wire the session's error event so STT/LLM/TTS plugin failures
    // surface with their full type + cause. Without this, the Cartesia
    // plugin's "Cartesia returned error" log line carries no body —
    // the actual API error (model unavailable, voice mismatch, empty
    // input, rate limit) gets swallowed and we can only guess. Same
    // for LLM errors when AI Gateway rejects the model slug.
    type SessionErrorPayload = {
      type?: string;
      error?: {
        name?: string;
        message?: string;
        cause?: unknown;
        stack?: string;
        body?: unknown;
        status?: number;
      } | unknown;
    };
    // 'error' is the enum value of voice.AgentSessionEventTypes.Error
    // (string literal). Cast through `as never` because the typed-emitter
    // generic doesn't quite line up at the call site, but the runtime
    // event name is correct per the SDK enum.
    // Per-turn lifecycle logging — pin which step is slow or which
    // turn fails silently. UserInputTranscribed fires when STT
    // finalizes the founder's speech; AgentStateChanged tracks
    // listening → thinking → speaking; SpeechCreated fires when a
    // TTS speech handle is created. Comparing these timestamps shows
    // STT-end → LLM-start → first-audio gap per turn.
    session.on('user_input_transcribed' as never, ((ev: { transcript?: string; isFinal?: boolean }) => {
      if (ev.isFinal) {
        // eslint-disable-next-line no-console
        console.log(
          `[voice-worker] turn — STT FINAL — t=${Date.now()} transcript="${(ev.transcript ?? '').slice(0, 200)}"`
        );
      }
    }) as never);
    session.on('agent_state_changed' as never, ((ev: { oldState?: string; newState?: string }) => {
      // eslint-disable-next-line no-console
      console.log(
        `[voice-worker] turn — AGENT STATE — t=${Date.now()} ${ev.oldState} → ${ev.newState}`
      );
    }) as never);
    session.on('speech_created' as never, ((ev: { source?: string; userInitiated?: boolean }) => {
      // eslint-disable-next-line no-console
      console.log(
        `[voice-worker] turn — SPEECH CREATED — t=${Date.now()} source=${ev.source} userInitiated=${ev.userInitiated}`
      );
    }) as never);

    session.on('error' as never, ((payload: SessionErrorPayload) => {
      const err = payload?.error as Record<string, unknown> | undefined;
      // eslint-disable-next-line no-console
      console.error(
        '[voice-worker] session error event —',
        '\n  type:', payload?.type,
        '\n  errorName:', err?.name,
        '\n  errorMessage:', err?.message,
        '\n  errorBody:', err?.body !== undefined ? JSON.stringify(err.body) : undefined,
        '\n  errorStatus:', err?.status,
        '\n  errorCause:', err?.cause !== undefined ?
          (typeof err.cause === 'object' ? JSON.stringify(err.cause, Object.getOwnPropertyNames(err.cause as object)) : String(err.cause))
          : undefined,
        '\n  errorStack:', err?.stack
      );
    }) as never);

    // Build the tool registry — agent can now READ and WRITE on the
    // founder's behalf (add todos, log demo conversions, look up
    // decision log, fetch recent meetings, check design-partner
    // pipeline status). Tool calls flow through /api/founder-hub/
    // voice-tools which auth-gates with VOICE_WORKER_SECRET and
    // logs every call to VoiceSessionEvent for the cross-tracking
    // dashboard. sessionId + personaId are baked into the tool
    // closures so the server can attribute every event correctly
    // without the LLM having to pass them.
    const tools = buildTools({
      sessionId: ctx.room.name ?? 'unknown-room',
      personaId: voiceContext.personaId,
    });
    // eslint-disable-next-line no-console
    console.log(
      `[voice-worker] tools registered — ${Object.keys(tools).join(', ')}`
    );

    const agent = new voice.Agent({
      instructions,
      chatCtx: initialChatCtx,
      tools,
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
        '\n  llmProvider:', config.llm.model.startsWith('google/') ? 'google-native' : 'ai-gateway',
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
    // Two greeting modes:
    //   - Cold (no memory seed): generic "what are we working on" prompt
    //   - Warm (memory seed): "picking back up" to acknowledge continuity
    // The warm version is short — the actual context is already in the
    // chatCtx above so the agent's first response (when the founder
    // speaks) draws on that history naturally.
    const hasMemory = seedHistory.length > 0;
    const greetingText = hasMemory
      ? personaId === 'skeptical_investor'
        ? "Picking up where we left off. Where do you want to push?"
        : personaId === 'cognitive_psychologist'
          ? "I've got our prior thread. What are we examining now?"
          : personaId === 'business_strategist'
            ? "Carrying over what we were working on. Where do you want to go?"
            : personaId === 'pitch_sharpener'
              ? "Carrying over what you were sharpening. What's the next angle you want me to push on?"
              : "Picking up where we left off. What's next?"
      : personaId === 'skeptical_investor'
        ? "I've read your context. What are we pressure-testing?"
        : personaId === 'cognitive_psychologist'
          ? "I have your context loaded. What decision are we examining?"
          : personaId === 'business_strategist'
            ? "I've reviewed the context. What strategic question are we testing?"
            : personaId === 'pitch_sharpener'
              ? "I'd love to understand what you're building. Want to walk me through the one-liner first?"
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
