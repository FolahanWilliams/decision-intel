/**
 * Bias-Fingerprint → Playbook Suggestion (M6.1)
 *
 * Maps a detected bias fingerprint to the playbook(s) most likely to
 * counteract that specific combination. Pure function, no database — the
 * mapping is rule-based so it runs cheaply at render time on the document
 * detail page.
 *
 * Scoring:
 *   per-playbook match score = Σ (bias overlap × severity weight × confidence)
 *
 * Plus a small bonus when the detected bias cluster matches a *named*
 * toxic combination that the playbook explicitly targets (encoded as the
 * `TOXIC_PLAYBOOK_MAP` below, drawn from the 18 named toxic patterns in
 * `src/lib/learning/toxic-combinations.ts`).
 *
 * The three highest-scoring playbooks are returned with a human-readable
 * rationale suitable for direct UI rendering in the "Act on this" panel.
 */

import { BUILT_IN_PLAYBOOKS, type PlaybookTemplate } from './templates';
import type { BiasInstance } from '@/types';

export interface PlaybookSuggestion {
  /** Stable identifier: "builtin_N" where N = index in BUILT_IN_PLAYBOOKS */
  id: string;
  playbook: PlaybookTemplate;
  /** 0–100 match strength */
  matchScore: number;
  /** Count of bias overlaps between detected biases and the playbook's biasFocus */
  overlapCount: number;
  /** Human-readable sentence for the UI */
  rationale: string;
  /** If the fingerprint matched a named toxic combo, surface the combo name */
  matchedToxicCombo?: string;
}

interface SuggestContext {
  industry?: string | null;
  documentType?: string | null;
}

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Named toxic combinations to the playbook category that specifically
 * counteracts them. Each entry: bias keys (all must be present in the
 * detection) → the playbook category that should be prioritized.
 *
 * Drawn from the 18 toxic patterns catalogued in
 * `src/lib/learning/toxic-combinations.ts`. We only encode the combos
 * that have a strong single-playbook counter; for ambiguous combos the
 * base scoring handles suggestion ranking naturally.
 */
const TOXIC_PLAYBOOK_MAP: Array<{
  name: string;
  biases: string[];
  preferredCategory: string;
  bonus: number;
}> = [
  {
    name: 'Echo Chamber',
    biases: ['authority_bias', 'groupthink', 'confirmation_bias'],
    preferredCategory: 'board_review', // Devil's Advocate persona
    bonus: 25,
  },
  {
    name: 'Overconfidence Spiral',
    biases: ['overconfidence_bias', 'planning_fallacy'],
    preferredCategory: 'strategic_planning', // Reference-class forecasting
    bonus: 20,
  },
  {
    name: 'Anchored Groupthink',
    biases: ['anchoring_bias', 'groupthink'],
    preferredCategory: 'investment_committee', // Bear Case + Value Skeptic
    bonus: 20,
  },
  {
    name: 'Sunk Cost Escalation',
    biases: ['sunk_cost_fallacy', 'loss_aversion'],
    preferredCategory: 'strategic_planning',
    bonus: 20,
  },
  {
    name: 'Winner\u2019s Curse',
    biases: ['overconfidence_bias', 'anchoring_bias', 'confirmation_bias'],
    preferredCategory: 'm_and_a',
    bonus: 25,
  },
  {
    name: 'Availability Cascade',
    biases: ['availability_heuristic', 'recency_bias', 'bandwagon_effect'],
    preferredCategory: 'risk_assessment',
    bonus: 20,
  },
  {
    name: 'Halo Effect Escalation',
    biases: ['halo_effect', 'authority_bias', 'confirmation_bias'],
    preferredCategory: 'custom', // Hiring playbook has category 'custom'
    bonus: 20,
  },
];

/**
 * Normalize a bias type string to the same snake_case form used in
 * BIAS_EDUCATION and TOXIC_PLAYBOOK_MAP.
 */
function normalize(biasType: string | undefined | null): string {
  if (!biasType) return '';
  return biasType
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z_]/g, '');
}

/**
 * Main entry point — suggest the top-N playbooks for a set of detected
 * biases, optionally filtered by document context.
 */
export function suggestPlaybooksForBiases(
  biases: Pick<BiasInstance, 'biasType' | 'severity' | 'confidence'>[],
  context: SuggestContext = {},
  limit = 3
): PlaybookSuggestion[] {
  if (!biases || biases.length === 0) return [];

  // Build a map: normalized-bias-type → max (severity × confidence)
  // If a bias appears multiple times, keep the strongest occurrence.
  const detectedMap = new Map<string, number>();
  for (const b of biases) {
    const key = normalize(b.biasType);
    if (!key) continue;
    const severity = (b.severity || 'low').toLowerCase();
    const sevWeight = SEVERITY_WEIGHT[severity] ?? 1;
    const confidence = typeof b.confidence === 'number' ? b.confidence : 0.5;
    const weight = sevWeight * confidence;
    const existing = detectedMap.get(key) ?? 0;
    if (weight > existing) detectedMap.set(key, weight);
  }

  const detectedKeys = new Set(detectedMap.keys());

  // Check every named toxic combination — if the detected bias set is a
  // superset of the combo's required biases, the preferred category gets
  // a bonus AND we remember the combo name for the rationale string.
  const toxicBonusMap = new Map<string, { combo: string; bonus: number }>();
  for (const combo of TOXIC_PLAYBOOK_MAP) {
    if (combo.biases.every(b => detectedKeys.has(b))) {
      const prev = toxicBonusMap.get(combo.preferredCategory);
      if (!prev || combo.bonus > prev.bonus) {
        toxicBonusMap.set(combo.preferredCategory, { combo: combo.name, bonus: combo.bonus });
      }
    }
  }

  // Score every playbook by overlap × severity × confidence + bonuses
  const scored = BUILT_IN_PLAYBOOKS.map((playbook, index): PlaybookSuggestion => {
    let score = 0;
    let overlapCount = 0;
    const matchedBiases: string[] = [];

    for (const focusBias of playbook.biasFocus) {
      const key = normalize(focusBias);
      if (detectedMap.has(key)) {
        const weight = detectedMap.get(key)!;
        score += weight * 5; // base 5 points per matched bias-weight-unit
        overlapCount += 1;
        matchedBiases.push(key);
      }
    }

    // Context filter: small penalty when the document type or industry
    // clearly mismatches (never zero out — cross-industry playbooks still
    // have value, just less).
    if (playbook.industry && context.industry && playbook.industry !== context.industry) {
      score *= 0.7;
    }
    if (
      playbook.documentType &&
      context.documentType &&
      playbook.documentType !== context.documentType
    ) {
      score *= 0.8;
    }

    // Apply toxic combo bonus if this playbook's category matches
    const toxicBonus = toxicBonusMap.get(playbook.category);
    if (toxicBonus) {
      score += toxicBonus.bonus;
    }

    return {
      id: `builtin_${index}`,
      playbook,
      matchScore: Math.round(score * 10) / 10,
      overlapCount,
      matchedToxicCombo: toxicBonus?.combo,
      rationale: buildRationale(playbook, matchedBiases, toxicBonus?.combo, overlapCount),
    };
  });

  // Drop zero-overlap suggestions (a playbook with no detected bias overlap
  // at all isn't a suggestion, it's noise)
  const nonZero = scored.filter(s => s.overlapCount > 0);

  // Sort by score desc, then by overlap count as tiebreaker
  nonZero.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return b.overlapCount - a.overlapCount;
  });

  return nonZero.slice(0, limit);
}

/**
 * Human-readable sentence explaining WHY this playbook was suggested.
 * Rendered directly in the "Act on this" panel so users understand the
 * recommendation without opening the playbook detail.
 */
function buildRationale(
  playbook: PlaybookTemplate,
  matchedBiases: string[],
  toxicCombo: string | undefined,
  overlapCount: number
): string {
  const topBias = matchedBiases[0]?.replace(/_/g, ' ') ?? 'bias pattern';

  if (toxicCombo) {
    return `Detected "${toxicCombo}" pattern. This playbook's persona roles (${playbook.personaConfig.roles
      .slice(0, 2)
      .map(r => r.name)
      .join(', ')}) are specifically designed to counteract it.`;
  }

  if (overlapCount >= 3) {
    return `${overlapCount} of this playbook's ${playbook.biasFocus.length} target biases were detected, including ${topBias}. Running it will surface structured challenges from ${playbook.personaConfig.roles.length} persona roles.`;
  }

  return `Detected ${topBias}${
    overlapCount > 1
      ? ` (and ${overlapCount - 1} other matching bias${overlapCount > 2 ? 'es' : ''})`
      : ''
  }. The "${playbook.personaConfig.roles[0]?.name ?? 'primary'}" persona in this playbook is specifically framed to challenge it.`;
}
