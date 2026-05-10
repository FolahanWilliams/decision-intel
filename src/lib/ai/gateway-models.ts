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
 * Phase 3 (pipeline migration) is OUT OF SCOPE here — the analysis
 * pipeline + metaJudge gemini-2.5-pro grounding lock + the 3-frame
 * noise jury all stay on src/lib/ai/providers/gemini.ts direct API
 * until founder-explicit-OK + a regression-test plan.
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
