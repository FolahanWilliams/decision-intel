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

/** Cartesia speed parameter accepts either a named preset or a number.
 *  Our persona profiles store numeric speed (-0.1 to 0.15); map onto
 *  the named presets the plugin prefers for portability. */
function mapSpeed(numeric: number): 'slow' | 'normal' | 'fast' {
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
    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx: JobContext) => {
    const startedAt = Date.now();

    // Connect to the room — audio only, we don't need to subscribe to
    // video tracks even though the founder may share screen later.
    await ctx.connect(undefined, AutoSubscribe.AUDIO_ONLY);

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
      speed: mapSpeed(voiceContext.voiceProfile.speed),
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

    await session.start({
      agent,
      room: ctx.room,
    });

    // Greet the founder so they know the session is live. The persona's
    // voice rule + voice-mode addendum keep the greeting in character.
    const greetingHint =
      personaId === 'skeptical_investor'
        ? "I've read your context. What are we pressure-testing?"
        : personaId === 'cognitive_psychologist'
          ? 'I have your context loaded. What decision are we examining?'
          : personaId === 'business_strategist'
            ? "I've reviewed the context. What strategic question are we testing?"
            : "I'm here. What are we working on?";

    session.generateReply({ instructions: `Greet briefly: "${greetingHint}"` });
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
