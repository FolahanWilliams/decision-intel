/**
 * Confidence-band helpers — used by counterfactual / RPD / intervention UI
 * to translate a 0-1 confidence score into a color + a 'high|moderate|low'
 * label.
 *
 * Thresholds (locked):
 *   - high:     c ≥ 0.7
 *   - moderate: 0.4 ≤ c < 0.7
 *   - low:      c < 0.4
 *
 * Hex palette intentionally hardcoded (not CSS-variable) because the
 * counterfactual UI mounts inside dark-themed severity wrappers in
 * several visualization components; CSS variables would re-tint
 * incorrectly in those contexts.
 */

export type ConfidenceBand = 'high' | 'moderate' | 'low';

export function confidenceBand(c: number): ConfidenceBand {
  if (c >= 0.7) return 'high';
  if (c >= 0.4) return 'moderate';
  return 'low';
}

/** Returns 'high' / 'moderate' / 'low' string label. */
export function confidenceLabel(c: number): ConfidenceBand {
  return confidenceBand(c);
}

/** Returns a hex color (#22c55e green / #fbbf24 amber / #ef4444 red). */
export function confidenceColor(c: number): string {
  if (c >= 0.7) return '#22c55e';
  if (c >= 0.4) return '#fbbf24';
  return '#ef4444';
}
