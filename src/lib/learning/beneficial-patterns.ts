/**
 * Beneficial Pattern Detection — Success-Side Decision Patterns
 *
 * Mirrors the toxic combination system but for positive patterns.
 * Detects when decision-makers are actively managing biases through
 * proven mitigation strategies observed in successful real-world outcomes.
 *
 * These patterns are derived from the success case study database:
 * real-world decisions where biases were present but managed effectively.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BeneficialPattern {
  label: string;
  description: string;
  /** Biases that are typically present but managed */
  managedBiases: string[];
  /** Context conditions that enable the pattern */
  contextRequired: Partial<BeneficialContext>;
  /** 0-100 score indicating how strongly this pattern correlates with success */
  baseScore: number;
  /** Real-world examples */
  exemplars: string[];
}

export interface BeneficialContext {
  dissentEncouraged: boolean;
  externalAdvisors: boolean;
  iterativeProcess: boolean;
  selfCannibalization: boolean;
  publicAccountability: boolean;
}

export interface BeneficialPatternResult {
  pattern: BeneficialPattern;
  matchStrength: number; // 0-1
  matchedBiases: string[];
  matchedContext: string[];
}

// ─── Named Beneficial Patterns ──────────────────────────────────────────────

export const BENEFICIAL_PATTERNS: BeneficialPattern[] = [
  {
    label: 'The Controlled Burn',
    description:
      'Deliberately cannibalizing your own successful product before competitors do. Requires overcoming loss aversion and sunk cost attachment to existing revenue streams by framing self-disruption as existential necessity.',
    managedBiases: ['loss_aversion', 'sunk_cost_fallacy', 'status_quo_bias'],
    contextRequired: { selfCannibalization: true, iterativeProcess: true },
    baseScore: 90,
    exemplars: [
      'Apple iPhone cannibalizing iPod (2007)',
      'Netflix streaming cannibalizing DVD-by-mail (2007)',
      'Adobe Creative Cloud replacing perpetual licenses (2013)',
      'Microsoft embracing Linux and cloud over Windows (2014)',
    ],
  },
  {
    label: "The Outsider's Lens",
    description:
      "Bringing in external perspectives to challenge entrenched assumptions. Works by introducing viewpoints not anchored to the organization's historical decisions, breaking confirmation bias loops.",
    managedBiases: ['confirmation_bias', 'anchoring_bias', 'groupthink'],
    contextRequired: { externalAdvisors: true, dissentEncouraged: true },
    baseScore: 80,
    exemplars: [
      'Microsoft hiring Satya Nadella (outside Windows division) as CEO (2014)',
      'Spotify — tech entrepreneur entering music industry (2008)',
      'Target hiring fashion designers for discount retail (2000)',
    ],
  },
  {
    label: 'The Patient Bet',
    description:
      'Making bold strategic bets validated iteratively rather than through one-shot commitment. Manages overconfidence by requiring evidence at each stage before escalating investment.',
    managedBiases: ['overconfidence_bias', 'planning_fallacy', 'anchoring_bias'],
    contextRequired: { iterativeProcess: true },
    baseScore: 85,
    exemplars: [
      'Amazon AWS — internal tool to public cloud service (2003-2015)',
      'Marvel Studios — phased universe from Iron Man to Avengers (2008-2019)',
      'NVIDIA CUDA — gaming GPU to AI compute platform (2006-2023)',
      'Tesla Gigafactory — phased battery manufacturing scale-up (2014-2020)',
    ],
  },
  {
    label: 'The Honest Mirror',
    description:
      'Actively surfacing and publicly acknowledging uncomfortable truths about your own product, strategy, or organization. Overcomes confirmation bias by forcing confrontation with negative feedback.',
    managedBiases: ['confirmation_bias', 'loss_aversion', 'status_quo_bias'],
    contextRequired: { publicAccountability: true, dissentEncouraged: true },
    baseScore: 82,
    exemplars: [
      'Domino\'s "Our pizza tastes bad" campaign and recipe overhaul (2010)',
      'LEGO admitting diversification failure and returning to core (2004)',
    ],
  },
  {
    label: 'The Platform Leap',
    description:
      'Transitioning from a product business to a platform business despite short-term revenue risk. Requires overcoming anchoring to product-unit economics and status quo distribution models.',
    managedBiases: ['anchoring_bias', 'status_quo_bias', 'loss_aversion'],
    contextRequired: { iterativeProcess: true },
    baseScore: 85,
    exemplars: [
      'NVIDIA GPU gaming to AI compute platform (2012)',
      'Adobe Creative Suite to Creative Cloud (2013)',
      'Amazon retail to AWS platform (2006)',
      'Microsoft Office licenses to Microsoft 365 subscriptions (2014)',
    ],
  },
];

// ─── Detection Logic ────────────────────────────────────────────────────────

/**
 * Check if detected biases and context match any beneficial patterns.
 * Returns matching patterns sorted by match strength.
 */
export function detectBeneficialPatterns(
  detectedBiases: string[],
  context: Partial<BeneficialContext>
): BeneficialPatternResult[] {
  const results: BeneficialPatternResult[] = [];

  for (const pattern of BENEFICIAL_PATTERNS) {
    const matchedBiases = pattern.managedBiases.filter(b =>
      detectedBiases.some(
        d =>
          d.toLowerCase().includes(b.replace(/_/g, ' ').toLowerCase()) ||
          b.includes(d.toLowerCase().replace(/\s+/g, '_'))
      )
    );

    if (matchedBiases.length === 0) continue;

    // Check context conditions
    const matchedContext: string[] = [];
    for (const [key, required] of Object.entries(pattern.contextRequired)) {
      if (required && context[key as keyof BeneficialContext]) {
        matchedContext.push(key);
      }
    }

    // Require at least 2 matching biases OR 1 bias + 1 context condition
    const biasMatch = matchedBiases.length / pattern.managedBiases.length;
    const contextMatch =
      Object.keys(pattern.contextRequired).length > 0
        ? matchedContext.length / Object.keys(pattern.contextRequired).length
        : 0;

    const matchStrength = biasMatch * 0.6 + contextMatch * 0.4;

    if (matchStrength >= 0.3) {
      results.push({
        pattern,
        matchStrength,
        matchedBiases,
        matchedContext,
      });
    }
  }

  return results.sort((a, b) => b.matchStrength - a.matchStrength);
}

/**
 * Get the damping factor for a toxic score when beneficial patterns are present.
 * Returns a multiplier (0.5-1.0) to reduce the toxic score.
 */
export function getBeneficialDampingFactor(beneficialResults: BeneficialPatternResult[]): number {
  if (beneficialResults.length === 0) return 1.0;

  const strongestMatch = beneficialResults[0].matchStrength;
  // Strong beneficial pattern match can reduce toxic score by up to 50%
  return Math.max(0.5, 1.0 - strongestMatch * 0.5);
}
