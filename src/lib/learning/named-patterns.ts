/**
 * Named Toxic Patterns — pure-data catalogue.
 *
 * Extracted from `toxic-combinations.ts` so client components can
 * import NAMED_PATTERNS without webpack pulling in `@prisma/client` +
 * the rest of the server-side detection module. The detection engine
 * still lives in `toxic-combinations.ts` and re-exports from here so
 * existing import paths keep working.
 *
 * Locked 2026-05-09 evening — fixes the Vercel webpack build failure
 * where ToxicCombinationTrendingCard + BiasDetailModal (client
 * components) were trying to bundle Prisma into the client.
 *
 * **Cascade discipline**: when adding a new named pattern, edit
 * `NAMED_PATTERNS` here AND BIAS_DETECTIVE_PROMPT TOXIC COMBINATIONS
 * section in `src/lib/agents/prompts.ts` AND any required-bias entries
 * in BIAS_EDUCATION + Education Room flashcard. See CLAUDE.md "M&A
 * Workflow Native" lock for the full cascade.
 */

import type { ContextFactors } from './toxic-combinations-types';

export interface NamedPattern {
  label: string;
  description: string;
  biasTypes: string[]; // all must be present
  contextRequired: Partial<ContextFactors>;
  baseScore: number; // 0-100 starting score before calibration
}

/**
 * The canonical named-pattern catalogue. 13 patterns as of 2026-05-09
 * evening (10 cross-domain + 3 M&A-specific: Synergy Mirage, Conglomerate
 * Fallacy, Winner's Curse).
 */
export const NAMED_PATTERNS: NamedPattern[] = [
  {
    label: 'The Echo Chamber',
    description:
      'Groupthink + confirmation bias with no dissenting voices creates a self-reinforcing belief loop where challenging evidence is dismissed. In M&A specifically: an IC where the deal team converged before the CIM landed and is now rationalising every diligence finding into the original thesis.',
    biasTypes: ['groupthink', 'confirmation_bias'],
    contextRequired: { dissentAbsent: true },
    baseScore: 85,
  },
  {
    label: 'The Sunk Ship',
    description:
      'Sunk cost fallacy + anchoring bias with high monetary stakes leads to doubling down on failing strategies because of prior investment. In M&A specifically: deal-escalation language ("we have already spent $X on diligence and advisor fees") justifies continued bidding past intrinsic value, or rationalises proceeding despite material negative diligence findings. Lockheed Martin reach-forward losses are the canonical anchor.',
    biasTypes: ['sunk_cost_fallacy', 'anchoring_bias'],
    contextRequired: { monetaryStakes: 'high' },
    baseScore: 80,
  },
  {
    label: 'The Blind Sprint',
    description:
      'Time pressure + availability heuristic + overconfidence leads to fast decisions based on easily recalled (but not necessarily relevant) information.',
    biasTypes: ['availability_heuristic', 'overconfidence_bias'],
    contextRequired: { timePressure: true },
    baseScore: 75,
  },
  {
    label: 'The Yes Committee',
    description:
      'Authority bias + groupthink with unanimous consensus means the most senior voice dominates and no one challenges the decision. In M&A specifically: an IC memo that reads as a rubber-stamp justification of a CEO or sponsor\'s pet acquisition with zero documented dissent — the committee acted as a ratifying body rather than an adversarial audit. Microsoft-Nokia is the canonical \\$249B-evaporation anchor.',
    biasTypes: ['groupthink', 'authority_bias'],
    contextRequired: { unanimousConsensus: true },
    baseScore: 82,
  },
  {
    label: 'The Optimism Trap',
    description:
      'Overconfidence + confirmation bias + high stakes: decision-makers selectively gather supporting evidence while being overly confident in a high-stakes bet.',
    biasTypes: ['overconfidence_bias', 'confirmation_bias'],
    contextRequired: { monetaryStakes: 'high' },
    baseScore: 78,
  },
  // ─── M&A-specific named patterns (locked 2026-05-09) ───────────────────────
  // The 3 patterns below are first-class M&A failure modes. They harden the
  // existing 22-bias taxonomy into the most-cited M&A-specific failure shapes
  // (per the 2026-05-08 NotebookLM corporate-strategy synthesis + the
  // 143-case library frequency ranking). Pair with the M&A document-type
  // overlays in `src/lib/prompts/investment-vertical.ts` so that uploads
  // classified as ic_memo / cim / qofe / synergy_model / integration_plan
  // automatically surface these patterns when the underlying biases co-occur.
  {
    label: 'The Synergy Mirage',
    description:
      'Overconfidence in projections + planning fallacy: revenue or cost synergy claims projected with hockey-stick precision but lacking a named operational mechanism, named accountable executive, or measurable 90-day milestone. The canonical M&A failure mode — McKinsey + KPMG research finds 70-90% of acquisitions fail to realise projected synergies. Fires when synergy figures appear in the memo without the BCG integration-best-practices triad of (mechanism, owner, milestone). Benchmark against historical realized-synergy rates from the case library.',
    biasTypes: ['overconfidence_bias', 'planning_fallacy'],
    contextRequired: { monetaryStakes: 'high' },
    baseScore: 88,
  },
  {
    label: 'The Conglomerate Fallacy',
    description:
      'Illusion of validity + halo effect: a far-adjacency acquisition justified primarily by the target\'s growth or brand momentum rather than by core operational overlap or a defensible "why us as parent" thesis (Porter parenting advantage). The narrative coherence of the target\'s success story produces high acquirer-side confidence, while the lack of operational fit is rationalised away. Bed Bath & Beyond + Container Store, AOL + Time Warner, Daimler + Chrysler are the canonical anchors.',
    biasTypes: ['illusion_of_validity', 'halo_effect'],
    contextRequired: {},
    baseScore: 84,
  },
  {
    label: "The Winner's Curse",
    description:
      'Anchoring bias + overconfidence with auction-dynamic language: the bid is driven by fear of losing the deal rather than intrinsic value. Fires on phrases like "preempting competitor B," "strategic necessity," "competitive process," "we cannot let X get this asset" — these signal that competitive dynamics, not fundamentals, are driving valuation. The acquirer who wins is statistically the acquirer who most overpaid. WeWork S-1, Quibi, the post-2010 SPAC wave are anchor cases.',
    biasTypes: ['anchoring_bias', 'overconfidence_bias'],
    contextRequired: { monetaryStakes: 'high', timePressure: true },
    baseScore: 86,
  },
  {
    label: 'The Status Quo Lock',
    description:
      'Status quo bias + anchoring + absent dissent: the team defaults to "how we\'ve always done it" with nobody pushing for change.',
    biasTypes: ['status_quo_bias', 'anchoring_bias'],
    contextRequired: { dissentAbsent: true },
    baseScore: 70,
  },
  {
    label: 'The Recency Spiral',
    description:
      'Recency bias + availability heuristic under time pressure: recent events disproportionately drive urgent decisions.',
    biasTypes: ['recency_bias', 'availability_heuristic'],
    contextRequired: { timePressure: true },
    baseScore: 72,
  },
  {
    label: 'The Golden Child',
    description:
      'Halo effect + confirmation bias + authority bias: a charismatic leader or prestigious brand creates an aura that blinds the team to red flags.',
    biasTypes: ['halo_effect', 'confirmation_bias', 'authority_bias'],
    contextRequired: {},
    baseScore: 82,
  },
  {
    label: 'The Doubling Down',
    description:
      "Gambler's fallacy + overconfidence + sunk cost: the belief that losses must reverse leads to escalating commitment on a losing position.",
    biasTypes: ['gamblers_fallacy', 'overconfidence_bias', 'sunk_cost_fallacy'],
    contextRequired: { monetaryStakes: 'high' },
    baseScore: 85,
  },
  {
    label: 'The Deadline Panic',
    description:
      'Zeigarnik effect + planning fallacy under time pressure: incomplete-task anxiety compresses timelines and drives rushed decisions to achieve closure.',
    biasTypes: ['zeigarnik_effect', 'planning_fallacy'],
    contextRequired: { timePressure: true },
    baseScore: 78,
  },
];

// ─── Pure-function pattern matcher (locked 2026-05-09 evening) ─────────────
//
// Used by the riskScorerNode to compute `firedPatternLabels` IN-PIPELINE so
// the compound-engine's PATTERN_PAIR_OVERRIDES amplifications (Synergy Mirage
// 1.75× / Winner's Curse 1.55× / Conglomerate Fallacy 1.65× / Sunk Ship 1.55×
// / Yes Committee 1.55×) fire on live audits rather than only on retroactive
// toxic-combination detection persistence.
//
// Mirrors the `matchesContext` + biasTypes-subset logic in
// `toxic-combinations.ts:detectToxicCombinations` but pure-function — no
// Prisma calls, no I/O, no DB persistence. Same input → same output.
//
// The detection engine in `toxic-combinations.ts` STILL runs after the
// audit completes for analytics + persistence to the ToxicCombination table.
// This function is the in-flight signal-extraction path used by the live
// pipeline.

interface PatternMatchInput {
  /** Detected bias type keys, lowercased + snake_case (matches NAMED_PATTERNS biasTypes). */
  biasTypes: string[];
  /** Best-effort ContextFactors from in-flight audit state. Fields not derivable from
   *  pipeline state default to neutral values (timePressure: false, etc.) — the matcher
   *  reads conservatively (null/false favours non-match). */
  context: Partial<ContextFactors>;
}

/**
 * Match a context object against a pattern's `contextRequired` partial.
 * Returns true when EVERY required key in `required` is satisfied by `context`.
 * Mirrors `toxic-combinations.ts:matchesContext` semantics.
 */
function matchesContext(
  required: Partial<ContextFactors>,
  context: Partial<ContextFactors>
): boolean {
  for (const [key, requiredValue] of Object.entries(required)) {
    if (requiredValue === undefined) continue;
    const actual = (context as Record<string, unknown>)[key];
    // Tolerant equality — for monetaryStakes the matcher accepts the
    // required value OR a stricter band ('high' required → 'very_high'
    // also matches; same upgrade direction the persisted detector uses).
    if (key === 'monetaryStakes') {
      const ladder = ['unknown', 'low', 'medium', 'high', 'very_high'];
      const reqIdx = ladder.indexOf(String(requiredValue));
      const actIdx = ladder.indexOf(String(actual));
      if (actIdx < reqIdx || reqIdx === -1 || actIdx === -1) return false;
      continue;
    }
    if (actual !== requiredValue) return false;
  }
  return true;
}

/**
 * Pure-function pattern matcher. Returns the labels of all named patterns
 * whose biasTypes are fully present AND whose contextRequired is satisfied.
 *
 * Deterministic — same input → same output.
 *
 * Used in:
 * - src/lib/agents/nodes.ts:riskScorerNode (live pipeline, before
 *   computeCompoundScore is invoked) — feeds `firedPatternLabels` into
 *   the compound engine so PATTERN_PAIR_OVERRIDES amplifications fire on
 *   real audits.
 * - Future: any caller that needs in-flight named-pattern detection
 *   without a Prisma round-trip (DPR rendering shortcuts, simulate-ceo
 *   pre-flight, etc.).
 */
export function matchNamedPatterns(input: PatternMatchInput): string[] {
  const biasSet = new Set(input.biasTypes.map(t => t.toLowerCase()));
  const matched: string[] = [];
  for (const pattern of NAMED_PATTERNS) {
    // ALL required biases must be present.
    const allBiasesPresent = pattern.biasTypes.every(bt => biasSet.has(bt.toLowerCase()));
    if (!allBiasesPresent) continue;
    // Context must satisfy contextRequired.
    if (!matchesContext(pattern.contextRequired, input.context)) continue;
    matched.push(pattern.label);
  }
  return matched;
}
