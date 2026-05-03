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
    model: process.env.GROK_MODEL || 'xai/grok-4.3',
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
