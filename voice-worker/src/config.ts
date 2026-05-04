/**
 * Worker config — validated on boot. Crashes loudly if a required env
 * is missing rather than failing per-session with confusing errors.
 *
 * Validated env vars are exported as a const object so the rest of the
 * worker can reference them with type safety. Optional vars (the four
 * Cartesia voice overrides) stay readable from process.env at session
 * time so a Railway dashboard tweak takes effect without redeploy.
 */

import 'dotenv/config';

function require_(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`[voice-worker] Required env var missing: ${name}`);
  }
  return v;
}

export const config = {
  livekit: {
    url: require_('LIVEKIT_URL'),
    apiKey: require_('LIVEKIT_API_KEY'),
    apiSecret: require_('LIVEKIT_API_SECRET'),
  },
  mainApp: {
    url: require_('MAIN_APP_URL').replace(/\/$/, ''), // strip trailing slash
    workerSecret: require_('VOICE_WORKER_SECRET'),
  },
  deepgram: {
    apiKey: require_('DEEPGRAM_API_KEY'),
  },
  llm: {
    apiKey: require_('AI_GATEWAY_API_KEY'),
    baseUrl: process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1',
    // VOICE_LLM_MODEL is the canonical env var. GROK_MODEL kept as a
    // deprecated fallback for envs that haven't migrated yet (the
    // worker shipped with GROK_MODEL before we generalised to any AI
    // Gateway provider).
    //
    // Default `openai/gpt-4o-mini` because it's the cheapest LLM that
    // is verified to work with the LiveKit OpenAI plugin's streaming
    // format. Grok 4.3 (`xai/grok-4.3`) returns empty replies through
    // this plugin (the plugin's streaming parser doesn't match Grok's
    // OpenAI-compat response shape). Override via Railway env if you
    // want a different model — any AI Gateway slug works.
    //
    // Verified-working slugs (per the LiveKit OpenAI plugin parser):
    //   - openai/gpt-4o-mini       cheapest, fast
    //   - openai/gpt-4o            stronger, ~10× cost
    //   - anthropic/claude-haiku-4-5  cheap, strong instruction-following
    //   - google/gemini-3-flash-preview  Vercel default for analytical tier
    //
    // Untested with this plugin (may produce empty output):
    //   - xai/grok-4.3
    //   - deepseek/deepseek-chat
    model: process.env.VOICE_LLM_MODEL || process.env.GROK_MODEL || 'openai/gpt-4o-mini',
  },
  cartesia: {
    apiKey: require_('CARTESIA_API_KEY'),
    // Default to sonic-3 — Cartesia's newest model. Two reasons it's
    // the right default over sonic-2 (the prior config):
    //   1. sonic-3 supports the `speed` + emotion control parameters
    //      we send for per-persona prosody. The bare `sonic-2` model
    //      does NOT — passing `speed: 'normal'/'slow'/'fast'` against
    //      sonic-2 makes Cartesia return an error mid-synthesis, the
    //      playback gets interrupted, and the founder hears nothing.
    //      (Per Cartesia changelog at
    //      https://docs.cartesia.ai/developer-tools/changelog, only
    //      sonic-2-2025-03-07 and sonic-3 carry these controls.)
    //   2. sonic-3 has higher voice fidelity than sonic-2 with similar
    //      latency. Newer model = better default for a brand-new
    //      voice mode product.
    // Override via CARTESIA_MODEL env if a specific persona needs
    // a different model (e.g. cost optimisation on sonic-2-2025-03-07
    // for high-volume sessions). NEVER set CARTESIA_MODEL=sonic-2
    // bare — that breaks speed parsing and crashes synthesis.
    model: process.env.CARTESIA_MODEL || 'sonic-3',
  },
  /** Hard cap on a single voice session — matches the JWT TTL minted
   *  by /api/founder-hub/voice-token. The agent loop also enforces this
   *  worker-side as a safety net in case the JWT TTL is bypassed. */
  sessionTimeoutMs: 30 * 60 * 1000,
} as const;
