/**
 * Pairwise Bias Interaction Matrix
 *
 * Dense matrix encoding how each pair of cognitive biases interact.
 * Weights are derived from behavioral economics research.
 *
 * Weight interpretation:
 * - 1.0 = neutral (no significant interaction)
 * - >1.0 = amplifying (biases reinforce each other)
 * - <1.0 = dampening (one bias reduces the other's effect)
 *
 * Matrix shape: 22×22 (DI-B-001 through DI-B-022). Extended from 20×20
 * to 22×22 on 2026-05-13 (M-1 ship — closes the silent moat hole that
 * had been live since the 2026-04-30 paper-application sprint added
 * DI-B-021 (illusion_of_validity) + DI-B-022 (inside_view_dominance) to
 * the BIAS_EDUCATION taxonomy without extending the matrix). Weights
 * for the two new biases are anchored on CLAUDE.md "DI-B-021 paper
 * application" + "Coherent Confidence" toxic combination locks plus
 * "DI-B-022 paper application" + "Reference-Class Blindness" toxic
 * combination locks (Kahneman & Klein 2009; Kahneman & Lovallo 2003
 * HBR "Delusions of Success"). Methodology version bumped 2.2.0 → 2.4.0
 * to reflect the engine-epoch change. Historical audits that fire
 * IV/ID + another bias will recompute against the new matrix on
 * re-render; the regression test at dqi-distribution-check.test.ts
 * covers the score-shift envelope.
 */

export interface InteractionEntry {
  weight: number;
  direction: 'amplifies' | 'dampens' | 'neutral';
  confidence: 'high' | 'medium' | 'low';
}

const A = (w: number, c: 'high' | 'medium' | 'low' = 'medium'): InteractionEntry => ({
  weight: w,
  direction: 'amplifies',
  confidence: c,
});
const D = (w: number, c: 'high' | 'medium' | 'low' = 'medium'): InteractionEntry => ({
  weight: w,
  direction: 'dampens',
  confidence: c,
});
const N: InteractionEntry = { weight: 1.0, direction: 'neutral', confidence: 'low' };

// Abbreviated bias keys for readability
type B = string;
const CB: B = 'confirmation_bias';
const AB: B = 'anchoring_bias';
const AH: B = 'availability_heuristic';
const GT: B = 'groupthink';
const AU: B = 'authority_bias';
const BE: B = 'bandwagon_effect';
const OC: B = 'overconfidence_bias';
const HB: B = 'hindsight_bias';
const PF: B = 'planning_fallacy';
const LA: B = 'loss_aversion';
const SC: B = 'sunk_cost_fallacy';
const SQ: B = 'status_quo_bias';
const FE: B = 'framing_effect';
const SP: B = 'selective_perception';
const RB: B = 'recency_bias';
const CM: B = 'cognitive_misering';
const HE: B = 'halo_effect';
const GF: B = 'gamblers_fallacy';
const ZE: B = 'zeigarnik_effect';
const PC: B = 'paradox_of_choice';
// DI-B-021 + DI-B-022 added 2026-05-13 (M-1 ship).
const IV: B = 'illusion_of_validity';
const ID: B = 'inside_view_dominance';

/**
 * Full 22×22 interaction matrix.
 * INTERACTION_MATRIX[biasA][biasB] = how biasB affects biasA
 */
export const INTERACTION_MATRIX: Record<string, Record<string, InteractionEntry>> = {
  [CB]: {
    [CB]: N,
    [AB]: A(1.3, 'high'),
    [AH]: A(1.2),
    [GT]: A(1.5, 'high'),
    [AU]: A(1.2),
    [BE]: A(1.2),
    [OC]: A(1.4, 'high'),
    [HB]: A(1.3, 'medium'),
    [PF]: A(1.1),
    [LA]: A(1.2),
    [SC]: A(1.3),
    [SQ]: A(1.2),
    [FE]: A(1.3, 'high'),
    [SP]: A(1.5, 'high'),
    [RB]: A(1.2),
    [CM]: A(1.1),
    [HE]: A(1.3, 'high'),
    [GF]: N,
    [ZE]: N,
    [PC]: N,
    // CB amplified by IV (narrative-driven confirmation) — 1.4 high per
    // CLAUDE.md "Coherent Confidence" toxic combo lock.
    [IV]: A(1.4, 'high'),
    // CB amplified by ID (inside view locks confirmation around the
    // chosen narrative without reference class) — 1.3 high.
    [ID]: A(1.3, 'high'),
  },
  [AB]: {
    [CB]: A(1.4, 'high'),
    [AB]: N,
    [AH]: A(1.2),
    [GT]: A(1.1),
    [AU]: A(1.2),
    [BE]: N,
    [OC]: A(1.3, 'high'),
    [HB]: A(1.2),
    [PF]: A(1.3),
    [LA]: A(1.2),
    [SC]: A(1.3),
    [SQ]: A(1.2),
    [FE]: A(1.3, 'high'),
    [SP]: A(1.1),
    [RB]: A(1.3),
    [CM]: A(1.2),
    [HE]: N,
    [GF]: N,
    [ZE]: N,
    [PC]: A(1.2),
    // Narrative coherence anchors on its own internal coherence — A(1.1).
    [IV]: A(1.1),
    // Inside view anchors on its own projections — A(1.2).
    [ID]: A(1.2),
  },
  [AH]: {
    [CB]: A(1.2),
    [AB]: A(1.1),
    [AH]: N,
    [GT]: A(1.1),
    [AU]: N,
    [BE]: A(1.2),
    [OC]: A(1.2),
    [HB]: A(1.3),
    [PF]: A(1.1),
    [LA]: A(1.2),
    [SC]: N,
    [SQ]: N,
    [FE]: A(1.3, 'high'),
    [SP]: A(1.2),
    [RB]: A(1.4, 'high'),
    [CM]: A(1.3, 'high'),
    [HE]: N,
    [GF]: A(1.1),
    [ZE]: N,
    [PC]: N,
    [IV]: N,
    [ID]: N,
  },
  [GT]: {
    [CB]: A(1.4, 'high'),
    [AB]: A(1.1),
    [AH]: A(1.1),
    [GT]: N,
    [AU]: A(1.4, 'high'),
    [BE]: A(1.3, 'high'),
    [OC]: A(1.3),
    [HB]: A(1.1),
    [PF]: A(1.2),
    [LA]: A(1.1),
    [SC]: A(1.2),
    [SQ]: A(1.2),
    [FE]: A(1.1),
    [SP]: A(1.3),
    [RB]: N,
    [CM]: A(1.2),
    [HE]: A(1.2),
    [GF]: N,
    [ZE]: N,
    [PC]: N,
    // Groupthink locks around the coherent narrative — A(1.3 high).
    [IV]: A(1.3, 'high'),
    // Group commits to the inside view collectively — A(1.2).
    [ID]: A(1.2),
  },
  [AU]: {
    [CB]: A(1.2),
    [AB]: A(1.2),
    [AH]: N,
    [GT]: A(1.3, 'high'),
    [AU]: N,
    [BE]: A(1.3),
    [OC]: A(1.2),
    [HB]: N,
    [PF]: N,
    [LA]: N,
    [SC]: A(1.1),
    [SQ]: A(1.1),
    [FE]: A(1.2),
    [SP]: A(1.2),
    [RB]: N,
    [CM]: A(1.2),
    [HE]: A(1.2),
    [GF]: N,
    [ZE]: N,
    [PC]: N,
    // Authority narratives are accepted as coherent — A(1.2).
    [IV]: A(1.2),
    // Authority figures' inside view becomes the team's — A(1.1).
    [ID]: A(1.1),
  },
  [BE]: {
    [CB]: A(1.2),
    [AB]: N,
    [AH]: A(1.3),
    [GT]: A(1.3, 'high'),
    [AU]: A(1.3),
    [BE]: N,
    [OC]: A(1.1),
    [HB]: N,
    [PF]: N,
    [LA]: A(1.1),
    [SC]: N,
    [SQ]: A(1.1),
    [FE]: A(1.2),
    [SP]: A(1.1),
    [RB]: A(1.3),
    [CM]: A(1.1),
    [HE]: A(1.1),
    [GF]: N,
    [ZE]: N,
    [PC]: A(1.2),
    [IV]: N,
    [ID]: N,
  },
  [OC]: {
    [CB]: A(1.3, 'high'),
    [AB]: A(1.2),
    [AH]: A(1.1),
    [GT]: A(1.2),
    [AU]: A(1.1),
    [BE]: N,
    [OC]: N,
    [HB]: A(1.3, 'high'),
    [PF]: A(1.6, 'high'),
    [LA]: D(0.8),
    [SC]: A(1.2),
    [SQ]: D(0.9),
    [FE]: A(1.1),
    [SP]: A(1.2, 'medium'),
    [RB]: A(1.1),
    [CM]: A(1.2),
    [HE]: A(1.2),
    [GF]: A(1.3, 'high'),
    [ZE]: A(1.1),
    [PC]: N,
    // OC amplified by IV — canonical "Coherent Confidence" pattern,
    // 1.5 high per CLAUDE.md DI-B-021 paper application lock.
    [IV]: A(1.5, 'high'),
    // OC amplified by ID — canonical "Reference-Class Blindness"
    // pattern, 1.5 high per CLAUDE.md DI-B-022 paper application lock.
    [ID]: A(1.5, 'high'),
  },
  [HB]: {
    [CB]: A(1.3),
    [AB]: A(1.2),
    [AH]: A(1.2),
    [GT]: N,
    [AU]: N,
    [BE]: N,
    [OC]: A(1.3, 'high'),
    [HB]: N,
    [PF]: A(1.2),
    [LA]: N,
    [SC]: A(1.2),
    [SQ]: N,
    [FE]: A(1.2),
    [SP]: A(1.3),
    [RB]: A(1.2),
    [CM]: N,
    [HE]: A(1.2),
    [GF]: N,
    [ZE]: N,
    [PC]: N,
    // Hindsight reconstructs past narrative as coherent — A(1.2).
    [IV]: A(1.2),
    // Hindsight strengthens the inside view ("we always knew") — A(1.2).
    [ID]: A(1.2),
  },
  [PF]: {
    [CB]: A(1.2),
    [AB]: A(1.3),
    [AH]: A(1.1),
    [GT]: A(1.2),
    [AU]: N,
    [BE]: N,
    [OC]: A(1.4, 'high'),
    [HB]: A(1.1),
    [PF]: N,
    [LA]: N,
    [SC]: A(1.3),
    [SQ]: N,
    [FE]: A(1.1),
    [SP]: N,
    [RB]: A(1.2),
    [CM]: A(1.2),
    [HE]: N,
    [GF]: A(1.2),
    [ZE]: A(1.4, 'high'),
    [PC]: N,
    // PF amplified by IV (narrative confidence → optimistic planning) — A(1.3).
    [IV]: A(1.3, 'high'),
    // PF amplified by ID — canonical Kahneman & Lovallo 2003 pattern;
    // 1.6 high per CLAUDE.md DI-B-022 paper application lock.
    [ID]: A(1.6, 'high'),
  },
  [LA]: {
    [CB]: A(1.1),
    [AB]: A(1.2),
    [AH]: A(1.2),
    [GT]: N,
    [AU]: N,
    [BE]: N,
    [OC]: D(0.9),
    [HB]: N,
    [PF]: N,
    [LA]: N,
    [SC]: A(1.5, 'high'),
    [SQ]: A(1.3, 'high'),
    [FE]: A(1.4, 'high'),
    [SP]: A(1.1),
    [RB]: A(1.2),
    [CM]: A(1.1),
    [HE]: N,
    [GF]: N,
    [ZE]: A(1.2),
    [PC]: A(1.3),
    [IV]: N,
    [ID]: N,
  },
  [SC]: {
    [CB]: A(1.3),
    [AB]: A(1.3),
    [AH]: N,
    [GT]: A(1.2),
    [AU]: A(1.1),
    [BE]: N,
    [OC]: A(1.2),
    [HB]: A(1.2),
    [PF]: A(1.3),
    [LA]: A(1.5, 'high'),
    [SC]: N,
    [SQ]: A(1.3),
    [FE]: A(1.2),
    [SP]: A(1.1),
    [RB]: N,
    [CM]: A(1.1),
    [HE]: N,
    [GF]: A(1.2),
    [ZE]: N,
    [PC]: N,
    // Coherent narrative justifies escalation despite mounting costs — A(1.2).
    [IV]: A(1.2),
    // Inside view dismisses reference-class base rates of failure → A(1.3).
    [ID]: A(1.3),
  },
  [SQ]: {
    [CB]: A(1.2),
    [AB]: A(1.2),
    [AH]: N,
    [GT]: A(1.2),
    [AU]: A(1.1),
    [BE]: A(1.1),
    [OC]: D(0.9),
    [HB]: N,
    [PF]: N,
    [LA]: A(1.3, 'high'),
    [SC]: A(1.3),
    [SQ]: N,
    [FE]: A(1.1),
    [SP]: A(1.1),
    [RB]: N,
    [CM]: A(1.2, 'high'),
    [HE]: N,
    [GF]: N,
    [ZE]: D(0.85),
    [PC]: A(1.4, 'high'),
    [IV]: N,
    [ID]: N,
  },
  [FE]: {
    [CB]: A(1.3),
    [AB]: A(1.3, 'high'),
    [AH]: A(1.2),
    [GT]: N,
    [AU]: A(1.2),
    [BE]: A(1.1),
    [OC]: N,
    [HB]: A(1.1),
    [PF]: N,
    [LA]: A(1.4, 'high'),
    [SC]: A(1.1),
    [SQ]: A(1.1),
    [FE]: N,
    [SP]: A(1.3),
    [RB]: A(1.1),
    [CM]: A(1.2),
    [HE]: A(1.1),
    [GF]: N,
    [ZE]: N,
    [PC]: A(1.2),
    // Framing supports the coherent narrative — A(1.2).
    [IV]: A(1.2),
    [ID]: N,
  },
  [SP]: {
    [CB]: A(1.5, 'high'),
    [AB]: A(1.1),
    [AH]: A(1.2),
    [GT]: A(1.3),
    [AU]: A(1.2),
    [BE]: N,
    [OC]: A(1.2),
    [HB]: A(1.2),
    [PF]: N,
    [LA]: A(1.1),
    [SC]: N,
    [SQ]: N,
    [FE]: A(1.2),
    [SP]: N,
    [RB]: A(1.2),
    [CM]: A(1.3),
    [HE]: A(1.3),
    [GF]: N,
    [ZE]: N,
    [PC]: N,
    // Narrative locks what gets perceived — A(1.3) high.
    [IV]: A(1.3, 'high'),
    // Inside view sets the perceptual frame — A(1.2).
    [ID]: A(1.2),
  },
  [RB]: {
    [CB]: A(1.2),
    [AB]: A(1.3),
    [AH]: A(1.3, 'high'),
    [GT]: N,
    [AU]: N,
    [BE]: A(1.2),
    [OC]: A(1.1),
    [HB]: A(1.2),
    [PF]: A(1.1),
    [LA]: A(1.1),
    [SC]: N,
    [SQ]: N,
    [FE]: A(1.1),
    [SP]: A(1.2),
    [RB]: N,
    [CM]: A(1.2),
    [HE]: N,
    [GF]: A(1.2),
    [ZE]: N,
    [PC]: N,
    [IV]: N,
    [ID]: N,
  },
  [CM]: {
    [CB]: A(1.1),
    [AB]: A(1.2),
    [AH]: A(1.3, 'high'),
    [GT]: A(1.2),
    [AU]: A(1.2),
    [BE]: A(1.1),
    [OC]: A(1.1),
    [HB]: N,
    [PF]: A(1.2),
    [LA]: A(1.1),
    [SC]: A(1.1),
    [SQ]: A(1.2, 'high'),
    [FE]: A(1.1),
    [SP]: A(1.2),
    [RB]: A(1.2),
    [CM]: N,
    [HE]: N,
    [GF]: N,
    [ZE]: A(1.2),
    [PC]: A(1.3, 'high'),
    // Coherent narrative IS cognitive miserliness manifesting — A(1.2).
    [IV]: A(1.2),
    // Inside view IS the cognitive shortcut over reference-class search — A(1.2).
    [ID]: A(1.2),
  },
  [HE]: {
    [CB]: A(1.3, 'high'),
    [AB]: N,
    [AH]: N,
    [GT]: A(1.2),
    [AU]: A(1.2),
    [BE]: A(1.1),
    [OC]: A(1.2),
    [HB]: A(1.2),
    [PF]: N,
    [LA]: N,
    [SC]: N,
    [SQ]: N,
    [FE]: A(1.1),
    [SP]: A(1.3, 'high'),
    [RB]: N,
    [CM]: N,
    [HE]: N,
    [GF]: N,
    [ZE]: N,
    [PC]: N,
    // HE amplified by IV — coherent narrative strengthens halo, 1.3
    // high per CLAUDE.md DI-B-021 paper application lock.
    [IV]: A(1.3, 'high'),
    [ID]: N,
  },
  [GF]: {
    [CB]: N,
    [AB]: N,
    [AH]: A(1.1),
    [GT]: N,
    [AU]: N,
    [BE]: N,
    [OC]: A(1.3, 'high'),
    [HB]: A(1.1),
    [PF]: A(1.2),
    [LA]: N,
    [SC]: A(1.2),
    [SQ]: N,
    [FE]: N,
    [SP]: N,
    [RB]: A(1.2),
    [CM]: N,
    [HE]: N,
    [GF]: N,
    [ZE]: N,
    [PC]: N,
    [IV]: N,
    [ID]: N,
  },
  [ZE]: {
    [CB]: N,
    [AB]: N,
    [AH]: N,
    [GT]: N,
    [AU]: N,
    [BE]: N,
    [OC]: A(1.1),
    [HB]: N,
    [PF]: A(1.4, 'high'),
    [LA]: A(1.2),
    [SC]: N,
    [SQ]: D(0.85),
    [FE]: N,
    [SP]: N,
    [RB]: N,
    [CM]: A(1.2),
    [HE]: N,
    [GF]: N,
    [ZE]: N,
    [PC]: N,
    [IV]: N,
    [ID]: A(1.1),
  },
  [PC]: {
    [CB]: N,
    [AB]: A(1.2),
    [AH]: N,
    [GT]: N,
    [AU]: N,
    [BE]: A(1.2),
    [OC]: N,
    [HB]: N,
    [PF]: N,
    [LA]: A(1.3),
    [SC]: N,
    [SQ]: A(1.4, 'high'),
    [FE]: A(1.2),
    [SP]: N,
    [RB]: N,
    [CM]: A(1.3, 'high'),
    [HE]: N,
    [GF]: N,
    [ZE]: N,
    [PC]: N,
    [IV]: N,
    [ID]: N,
  },
  // ─── DI-B-021: Illusion of Validity ────────────────────────────────
  // Added 2026-05-13 (M-1 ship). Weights anchored on CLAUDE.md
  // "Coherent Confidence" toxic combo: IV+OC=1.5, IV+CB=1.4, IV+HE=1.3,
  // IV+AU=1.3 per the DI-B-021 paper application lock.
  [IV]: {
    [CB]: A(1.4, 'high'),
    [AB]: A(1.2),
    [AH]: A(1.2),
    [GT]: A(1.3, 'high'),
    [AU]: A(1.3, 'high'),
    [BE]: A(1.1),
    [OC]: A(1.5, 'high'),
    [HB]: A(1.2),
    [PF]: A(1.1),
    [LA]: N,
    [SC]: A(1.2),
    [SQ]: N,
    [FE]: A(1.2),
    [SP]: A(1.3, 'high'),
    [RB]: A(1.1),
    [CM]: A(1.2),
    [HE]: A(1.3, 'high'),
    [GF]: N,
    [ZE]: N,
    [PC]: N,
    [IV]: N,
    // Inside view AND illusion of validity = locked narrative without
    // reference class — 1.4 high per CLAUDE.md DI-B-022 lock.
    [ID]: A(1.4, 'high'),
  },
  // ─── DI-B-022: Inside-View Dominance ───────────────────────────────
  // Added 2026-05-13 (M-1 ship). Weights anchored on CLAUDE.md
  // "Reference-Class Blindness" toxic combo: ID+PF=1.6, ID+OC=1.5,
  // ID+IV=1.4, ID+CB=1.3 per the DI-B-022 paper application lock
  // (Kahneman & Lovallo 2003 HBR "Delusions of Success").
  [ID]: {
    [CB]: A(1.3, 'high'),
    [AB]: A(1.2),
    [AH]: A(1.1),
    [GT]: A(1.2),
    [AU]: A(1.1),
    [BE]: N,
    [OC]: A(1.5, 'high'),
    [HB]: A(1.2),
    [PF]: A(1.6, 'high'),
    [LA]: N,
    [SC]: A(1.3, 'high'),
    [SQ]: N,
    [FE]: A(1.2),
    [SP]: A(1.2),
    [RB]: A(1.1),
    [CM]: A(1.2),
    [HE]: N,
    [GF]: N,
    [ZE]: A(1.1),
    [PC]: N,
    [IV]: A(1.4, 'high'),
    [ID]: N,
  },
};

/**
 * Get the interaction weight between two biases.
 * Returns 1.0 if either bias is not in the matrix.
 */
export function getInteractionWeight(biasA: string, biasB: string): number {
  return INTERACTION_MATRIX[biasA]?.[biasB]?.weight ?? 1.0;
}

/**
 * Get the strongest interactions for a given bias, sorted by weight.
 */
export function getStrongestInteractions(
  biasType: string,
  topN: number = 5
): Array<{ bias: string; weight: number; direction: string }> {
  const row = INTERACTION_MATRIX[biasType];
  if (!row) return [];

  return Object.entries(row)
    .filter(([key, entry]) => key !== biasType && entry.weight !== 1.0)
    .map(([key, entry]) => ({
      bias: key,
      weight: entry.weight,
      direction: entry.direction,
    }))
    .sort((a, b) => Math.abs(b.weight - 1) - Math.abs(a.weight - 1))
    .slice(0, topN);
}

/**
 * Canonical bias keys covered by the matrix. Use this for matrix-coverage
 * assertions in tests / regression scripts.
 */
export const MATRIX_BIAS_KEYS = [
  CB,
  AB,
  AH,
  GT,
  AU,
  BE,
  OC,
  HB,
  PF,
  LA,
  SC,
  SQ,
  FE,
  SP,
  RB,
  CM,
  HE,
  GF,
  ZE,
  PC,
  IV,
  ID,
] as const;

/** Convenience: matrix dimension (22 as of 2026-05-13). */
export const MATRIX_DIMENSION = MATRIX_BIAS_KEYS.length;

/**
 * Total pairwise weights in the matrix (MATRIX_DIMENSION²). Used in
 * founder-rehearsal surfaces ("484 empirically-grounded pairwise
 * weights" instead of stale literal 400 / 441). Derive — never literal —
 * so a 23rd bias landing in BIAS_EDUCATION + MATRIX_BIAS_KEYS lifts
 * every consumer automatically (per the M-1 / U-3.1 cascade
 * discipline). Previously redefined locally in
 * src/lib/data/positioning-frameworks.ts; promoted to canonical
 * 2026-05-21 to close the drift class.
 */
export const MATRIX_COMBINATIONS = MATRIX_DIMENSION * MATRIX_DIMENSION;
