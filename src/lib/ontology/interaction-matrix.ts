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

/**
 * Full 16x16 interaction matrix.
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
