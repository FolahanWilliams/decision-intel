/**
 * Founder-chat model registry — the allowlist of models the founder
 * can switch between in the Founder Hub AI chat widget.
 *
 * Every model the user can pick from the UI MUST be listed here.
 * The chat API validates the incoming `modelId` against this list
 * before passing the gateway slug to streamChat — never trust the
 * client-supplied model string directly. (Without validation, a
 * malicious client could route their request through any provider
 * the AI Gateway exposes, including expensive Pro-tier models that
 * blow our cost budget.)
 *
 * Adding a new model:
 *   1. Add an entry below with stable `id`, gateway `slug`, `label`
 *      shown in the picker UI, and `provider` for visual grouping.
 *   2. Verify the slug in the Vercel AI Gateway dashboard — the
 *      gateway routes `provider/model` strings to the underlying
 *      API, and slugs change as providers release new versions.
 *   3. The picker auto-renders the new entry; no UI change needed.
 *
 * Removing a model: keep it in the registry but mark `available: false`
 * so existing localStorage selections gracefully fall back to default
 * instead of failing silently.
 */

export interface FounderChatModel {
  /** Stable id used in localStorage + API requests. NEVER change once
   *  shipped — the localStorage key for the founder's last selection
   *  is built from this id. */
  id: string;
  /** Vercel AI Gateway model slug (`provider/model`). The gateway
   *  routes this to the underlying API. */
  slug: string;
  /** Human-readable label shown in the picker. */
  label: string;
  /** Provider name for visual grouping (xAI / Google / DeepSeek etc). */
  provider: string;
  /** Short pitch shown in the picker tooltip — when to use this model
   *  over the others. Keep under ~80 chars so the tooltip stays compact. */
  description: string;
  /** Whether the model is currently selectable. False = grandfathered
   *  legacy id, kept so localStorage selections don't crash. */
  available: boolean;
}

/**
 * The active model registry. Order matters — picker renders top to
 * bottom in this order. Default model is the FIRST `available: true`
 * entry (Grok 4.3 currently).
 *
 * NOTE: gateway slugs verified against Vercel AI Gateway dashboard
 * 2026-05-04. If a provider releases a new patch (e.g. grok-4.4) and
 * the old slug stops resolving, update the slug here in the same
 * commit as you bump the model.
 */
export const FOUNDER_CHAT_MODELS: readonly FounderChatModel[] = [
  {
    id: 'grok-4.3',
    slug: 'xai/grok-4.3',
    label: 'Grok 4.3',
    provider: 'xAI',
    description: 'Default. Strong instruction-following on persona-voice tasks.',
    available: true,
  },
  {
    id: 'gemini-3-flash',
    slug: 'google/gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    provider: 'Google',
    description: 'Fast + sharp. Same model the analysis pipeline uses.',
    available: true,
  },
  {
    id: 'deepseek-v4-pro',
    slug: 'deepseek/deepseek-chat',
    label: 'DeepSeek V4 Pro',
    provider: 'DeepSeek',
    // Slug verified against the Vercel AI Gateway dashboard 2026-06-02 —
    // `deepseek/deepseek-chat` is the gateway's V4-Pro route. If a more
    // specific 'v4-pro' slug ships later, swap here in the same commit as
    // the dashboard change (per the slug-verification note above).
    description: 'Reasoning-heavy alternative.',
    available: true,
  },
] as const;

export const DEFAULT_FOUNDER_CHAT_MODEL_ID = FOUNDER_CHAT_MODELS[0].id;

/** Lookup by id. Returns the default model when id is unknown — the
 *  picker can't crash on a stale localStorage value or a malformed
 *  request body. */
export function getFounderChatModel(id: string | null | undefined): FounderChatModel {
  if (!id) return FOUNDER_CHAT_MODELS[0];
  const found = FOUNDER_CHAT_MODELS.find(m => m.id === id && m.available);
  return found ?? FOUNDER_CHAT_MODELS[0];
}

/** Type guard for narrowing a string to a known model id. Used in the
 *  chat API request validation to reject arbitrary model strings. */
export function isFounderChatModelId(id: unknown): id is FounderChatModel['id'] {
  if (typeof id !== 'string') return false;
  return FOUNDER_CHAT_MODELS.some(m => m.id === id && m.available);
}
