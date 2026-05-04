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
    // VOICE_LLM_MODEL is the canonical env var. Format: "provider/model"
    // matching Vercel AI Gateway's slug convention.
    //
    // Default `google/gemini-3-flash-preview` — uses the LiveKit native
    // Google plugin (@livekit/agents-plugin-google). 50-70% faster than
    // gpt-4o-mini at lower cost (~$0.075/$0.30 per 1M tokens) and Google
    // has reliable native context caching that survives across turns.
    //
    // Routing logic (in agent.ts buildLlmPlugin):
    //   - `google/<model>` → Google plugin natively (uses GOOGLE_API_KEY)
    //   - anything else → LiveKit OpenAI plugin via Vercel AI Gateway
    //     (uses AI_GATEWAY_API_KEY + AI_GATEWAY_BASE_URL)
    //
    // Verified-working slugs:
    //   - google/gemini-3-flash-preview  ← default, fastest + cheapest
    //   - google/gemini-2.5-flash         older but stable
    //   - openai/gpt-4o-mini              fallback when Google quota issues
    //   - openai/gpt-4o                   stronger, ~10× cost
    //
    // Known-broken (the LiveKit OpenAI plugin's streaming parser doesn't
    // match these providers' OpenAI-compat format via AI Gateway):
    //   - xai/grok-* (Grok)
    //   - deepseek/* (DeepSeek)
    // Use Anthropic plugin for Claude when we need it (not yet wired).
    //
    // GROK_MODEL kept as a deprecated fallback for envs that still
    // have it set (won't work, will hit the broken-list boot warning).
    model: process.env.VOICE_LLM_MODEL || process.env.GROK_MODEL || 'google/gemini-3-flash-preview',
    // GOOGLE_API_KEY is required when model is google/*. The require_()
    // call would crash boot if missing, but we only need it conditionally
    // — read here as a plain env, validated at LLM-plugin build time
    // in agent.ts. Same pattern for AI_GATEWAY_API_KEY (required only
    // when model is non-google).
    googleApiKey: process.env.GOOGLE_API_KEY ?? '',
    aiGatewayApiKey: process.env.AI_GATEWAY_API_KEY ?? '',
    aiGatewayBaseUrl: process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1',
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
