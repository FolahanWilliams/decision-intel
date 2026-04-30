/**
 * Normalizes raw LLM bias type strings to canonical BiasCategory keys.
 *
 * The LLM outputs human-readable names like "Cognitive Misering" or
 * "Confirmation Bias", but case studies, nudge detection, and aggregation
 * queries use snake_case keys like "cognitive_misering". This function
 * bridges the two so matching, grouping, and display are consistent.
 */

import { BIAS_CATEGORIES, type BiasCategory } from '@/types';

/** Map of lowercase display name → canonical key */
const DISPLAY_NAME_TO_KEY: Record<string, BiasCategory> = {};

/** Map of lowercase key → canonical key (identity, for already-normalized inputs) */
const KEY_TO_KEY: Record<string, BiasCategory> = {};

// Build lookup maps from BIAS_CATEGORIES
for (const [key, meta] of Object.entries(BIAS_CATEGORIES)) {
  const k = key as BiasCategory;
  DISPLAY_NAME_TO_KEY[meta.name.toLowerCase()] = k;
  KEY_TO_KEY[k] = k;
}

// Common LLM variations that don't match the display name exactly
const ALIASES: Record<string, BiasCategory> = {
  'sunk cost fallacy': 'sunk_cost_fallacy',
  'sunk cost': 'sunk_cost_fallacy',
  'planning fallacy': 'planning_fallacy',
  'bandwagon effect': 'bandwagon_effect',
  bandwagon: 'bandwagon_effect',
  'framing effect': 'framing_effect',
  framing: 'framing_effect',
  groupthink: 'groupthink',
  'loss aversion': 'loss_aversion',
  anchoring: 'anchoring_bias',
  overconfidence: 'overconfidence_bias',
  'availability heuristic': 'availability_heuristic',
  availability: 'availability_heuristic',
  'hindsight bias': 'hindsight_bias',
  hindsight: 'hindsight_bias',
  'status quo': 'status_quo_bias',
  'selective perception': 'selective_perception',
  'recency bias': 'recency_bias',
  recency: 'recency_bias',
  'authority bias': 'authority_bias',
  authority: 'authority_bias',
  'confirmation bias': 'confirmation_bias',
  confirmation: 'confirmation_bias',
  'cognitive misering': 'cognitive_misering',
  'cognitive miser': 'cognitive_misering',
  'illusion of validity': 'illusion_of_validity',
  'illusory validity': 'illusion_of_validity',
  'narrative coherence': 'illusion_of_validity',
  'confidence by coherence': 'illusion_of_validity',
  'inside view dominance': 'inside_view_dominance',
  'inside-view dominance': 'inside_view_dominance',
  'inside view bias': 'inside_view_dominance',
  'inside view': 'inside_view_dominance',
  'reference class neglect': 'inside_view_dominance',
  'base rate neglect': 'inside_view_dominance',
  'outside view neglect': 'inside_view_dominance',
};

/**
 * Normalize a raw bias type string to its canonical BiasCategory key.
 *
 * Handles: "Confirmation Bias" → "confirmation_bias"
 *          "confirmation_bias" → "confirmation_bias" (pass-through)
 *          "Sunk Cost" → "sunk_cost_fallacy" (alias)
 *
 * Returns the original string lowercased + underscored if no match found,
 * so unknown bias types still aggregate consistently.
 */
export function normalizeBiasType(raw: string): string {
  if (!raw) return raw;

  const lower = raw.toLowerCase().trim();

  // 1. Already a canonical key?
  if (KEY_TO_KEY[lower]) return KEY_TO_KEY[lower];

  // 2. Match by display name?
  if (DISPLAY_NAME_TO_KEY[lower]) return DISPLAY_NAME_TO_KEY[lower];

  // 3. Match by alias?
  if (ALIASES[lower]) return ALIASES[lower];

  // 4. Fallback: convert to snake_case for consistent aggregation
  return lower.replace(/\s+/g, '_');
}

/**
 * Get the human-readable display name for a bias type.
 * Works with both canonical keys and raw LLM strings.
 */
export function getBiasDisplayName(raw: string): string {
  const key = normalizeBiasType(raw);
  const meta = BIAS_CATEGORIES[key as BiasCategory];
  return meta?.name ?? raw;
}
