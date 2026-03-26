/**
 * Bias-type color mapping for Detective Mode.
 * Assigns distinct, visually distinguishable colors to each bias type
 * using evenly-spaced HSL hues with consistent saturation and lightness.
 */

const BIAS_COLOR_PALETTE = [
  { bg: 'rgba(59,130,246,0.18)', text: '#60a5fa', border: '#3b82f6', underline: '#3b82f6' }, // blue
  { bg: 'rgba(168,85,247,0.18)', text: '#c084fc', border: '#a855f7', underline: '#a855f7' }, // purple
  { bg: 'rgba(236,72,153,0.18)', text: '#f472b6', border: '#ec4899', underline: '#ec4899' }, // pink
  { bg: 'rgba(239,68,68,0.18)', text: '#f87171', border: '#ef4444', underline: '#ef4444' }, // red
  { bg: 'rgba(249,115,22,0.18)', text: '#fb923c', border: '#f97316', underline: '#f97316' }, // orange
  { bg: 'rgba(234,179,8,0.18)', text: '#facc15', border: '#eab308', underline: '#eab308' }, // yellow
  { bg: 'rgba(34,197,94,0.18)', text: '#4ade80', border: '#22c55e', underline: '#22c55e' }, // green
  { bg: 'rgba(20,184,166,0.18)', text: '#2dd4bf', border: '#14b8a6', underline: '#14b8a6' }, // teal
  { bg: 'rgba(6,182,212,0.18)', text: '#22d3ee', border: '#06b6d4', underline: '#06b6d4' }, // cyan
  { bg: 'rgba(99,102,241,0.18)', text: '#818cf8', border: '#6366f1', underline: '#6366f1' }, // indigo
  { bg: 'rgba(244,63,94,0.18)', text: '#fb7185', border: '#f43f5e', underline: '#f43f5e' }, // rose
  { bg: 'rgba(132,204,22,0.18)', text: '#a3e635', border: '#84cc16', underline: '#84cc16' }, // lime
  { bg: 'rgba(217,119,6,0.18)', text: '#fbbf24', border: '#d97706', underline: '#d97706' }, // amber
  { bg: 'rgba(139,92,246,0.18)', text: '#a78bfa', border: '#8b5cf6', underline: '#8b5cf6' }, // violet
  { bg: 'rgba(16,185,129,0.18)', text: '#34d399', border: '#10b981', underline: '#10b981' }, // emerald
  { bg: 'rgba(251,146,60,0.18)', text: '#fdba74', border: '#fb923c', underline: '#fb923c' }, // light orange
  { bg: 'rgba(56,189,248,0.18)', text: '#7dd3fc', border: '#38bdf8', underline: '#38bdf8' }, // sky
  { bg: 'rgba(192,132,252,0.18)', text: '#d8b4fe', border: '#c084fc', underline: '#c084fc' }, // light purple
  { bg: 'rgba(74,222,128,0.18)', text: '#86efac', border: '#4ade80', underline: '#4ade80' }, // light green
  { bg: 'rgba(253,164,175,0.18)', text: '#fda4af', border: '#fb7185', underline: '#fb7185' }, // light rose
];

export interface BiasColorSet {
  bg: string;
  text: string;
  border: string;
  underline: string;
}

// Cache to ensure consistent color assignment within a session
const biasColorCache = new Map<string, BiasColorSet>();
let nextColorIndex = 0;

export function getBiasColor(biasType: string): BiasColorSet {
  const cached = biasColorCache.get(biasType);
  if (cached) return cached;

  const color = BIAS_COLOR_PALETTE[nextColorIndex % BIAS_COLOR_PALETTE.length];
  nextColorIndex++;
  biasColorCache.set(biasType, color);
  return color;
}

/**
 * Get all assigned colors (for legend rendering).
 * Only returns colors for biases that have been assigned.
 */
export function getAssignedBiasColors(): Map<string, BiasColorSet> {
  return new Map(biasColorCache);
}

/**
 * Reset color assignments (useful for testing or component unmount).
 */
export function resetBiasColors(): void {
  biasColorCache.clear();
  nextColorIndex = 0;
}
