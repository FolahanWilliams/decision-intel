/**
 * Gateway model assignments — single source of truth for which model
 * id each Phase-2-migrated surface uses. Locked 2026-05-02 alongside
 * Phase 2 surface migration.
 *
 * Model strategy (founder explicit pick):
 *   - Founder-hub AI surfaces  → Grok 4.3 (xai/grok-4.3)
 *     Reason: founder uses Grok for personal AI work; pricing similar
 *     to Gemini 3 Flash with reportedly better instruction-following
 *     on persona-voice + grading tasks. Founder-hub is single-user
 *     (founder only) so model variation doesn't cascade across customers.
 *   - Analytical / reasoning surfaces → Gemini 3 Flash Preview
 *     (google/gemini-3-flash-preview). Mirrors existing pipeline default.
 *   - Cheap-tier / classification / content-gen → Gemini 3.1 Flash Lite
 *     (google/gemini-3.1-flash-lite). Mirrors existing cheap-tier.
 *
 * Phase 3 (pipeline migration) SHIPPED 2026-07-02 with founder-explicit
 * approval (the frontier model-tier upgrade): the REASONING nodes
 * (metaJudge / forgottenQuestions / deepAnalysis / simulation / rpd +
 * two noise-jury arms) route through the gateway to
 * MODEL_FRONTIER_REASONING / MODEL_STRONG_REASONING below via
 * `resolveFrontierModel` in src/lib/agents/nodes.ts (per-node env
 * overrides + PIPELINE_FRONTIER_MODELS=off kill switch = one-env-var
 * rollback to the legacy all-Gemini pipeline). The GROUNDED nodes
 * (biasDetective / verification / noise-benchmark / market enricher)
 * stay on the native Gemini SDK — the gateway doesn't expose Google
 * Search grounding, and live fact-checking is load-bearing there.
 *
 * To change a Phase 2 surface's model: edit the assignment below. The
 * Vercel AI Gateway routes to the underlying provider transparently;
 * cost telemetry surfaces in the Vercel dashboard.
 *
 * To add a NEW gateway-routed surface: import the appropriate
 * MODEL_FOUNDER_HUB / MODEL_ANALYTICAL / MODEL_CHEAP constant; do not
 * inline the model id string at the call site.
 */

/**
 * Founder-hub AI default — used by the chat / content-studio /
 * education-room recall grader / sparring grade + question-generator /
 * meeting-prep / design-partner-prep surfaces. Single-user (founder
 * only), so per-call model choice is a personal preference, not a
 * customer-facing decision.
 */
export const MODEL_FOUNDER_HUB = 'xai/grok-4.3';

/**
 * Analytical / reasoning default — used by Phase-2-migrated surfaces
 * that need stronger reasoning than Flash Lite but don't justify the
 * Pro-tier cost. Mirrors the existing CLAUDE.md "Flash analytical
 * default" lock.
 */
export const MODEL_ANALYTICAL = 'google/gemini-3-flash-preview';

/**
 * Cheap-tier model — used for content generation, classification,
 * passage re-audits, simulate-ceo, news synthesis, and any surface
 * where reasoning quality is less load-bearing than per-call cost.
 * Mirrors the existing CLAUDE.md "Flash lightweight" lock.
 */
export const MODEL_CHEAP = 'google/gemini-3.1-flash-lite';

/**
 * Recommendation-engine model — locked 2026-05-10 alongside the
 * Constellation Next Move ship. Used for: (a) cross-decision semantic
 * similarity on structural assumptions across containers, (b) the
 * "why this fires" trace prose on each ranked recommendation,
 * (c) persona-tuned wording per the four buyer-class framings the
 * 2026-05-10 Deep Research paper Ch 6 mandates.
 *
 * Why DeepSeek-v4-Flash specifically: at $0.14/M input + $0.28/M
 * output (per the Vercel AI Gateway model list 2026-05-10), the per-
 * recommendation cost lands at roughly $0.0001 — sub-cent per render.
 * With Vercel Runtime Cache keyed off a hash of container risk-bands
 * + T-N countdowns + cross-ref counts, most renders are cache hits and
 * the amortised cost is essentially zero. Reasoning quality is plenty
 * for the constrained ranking + wording task; cross-decision pattern
 * detection earns the LLM choice on semantic similarity over native
 * pattern-recognition Flash tier.
 *
 * The intelligent-antagonist UI pattern (paper Ch 8 / Finding #4) is
 * the discipline that protects against this cheap-LLM augmentation
 * inducing automation bias: the user articulates THEIR priority
 * before seeing the system's, and the named gap is the recommendation's
 * actual value — not the recommendation alone.
 */
export const MODEL_RECOMMENDATIONS = 'deepseek/deepseek-v4-flash';

/**
 * Frontier reasoning model — the smartest model in the stack, reserved
 * for the calls where reasoning depth IS the deliverable (locked
 * 2026-07-02, frontier model-tier upgrade; founder ranking: "Opus 4.8
 * is the smartest model, put it where it should be").
 *
 * Pipeline consumers (via FRONTIER_NODE_DEFAULTS in agents/nodes.ts):
 * metaJudge (the final verdict + existential ranking) and
 * forgottenQuestions (the unknown-unknowns surface — the Fermi retro's
 * real hits). Also the regulator_hostile noise-jury arm.
 *
 * Pricing (2026-07): $5/M input, $25/M output. At pipeline volumes this
 * adds roughly $1-2/audit — noise against $8-15k retro pricing.
 *
 * NOTE: Anthropic 4.7+ models REJECT the temperature parameter (400).
 * Route pipeline calls through runModelCall (strips it); direct
 * generateText callers must omit `temperature` for anthropic/* models.
 */
export const MODEL_FRONTIER_REASONING = 'anthropic/claude-opus-4-8';

/**
 * Strong reasoning model — right behind Opus at 60% of the price
 * ($3/M in, $15/M out; intro $2/$10 through 2026-08-31). Used for the
 * buyer-facing reasoning that doesn't need the absolute ceiling:
 * deepAnalysis (SWOT / pre-mortem), simulation (boardroom personas),
 * rpdRecognition (Klein cues), the contrarian_strategist jury arm, and
 * the deliverable action-title prose (the headline language a board
 * forwards — upgraded 2026-07-02 from MODEL_RECOMMENDATIONS/deepseek).
 * Same no-temperature rule as MODEL_FRONTIER_REASONING.
 */
export const MODEL_STRONG_REASONING = 'anthropic/claude-sonnet-5';
