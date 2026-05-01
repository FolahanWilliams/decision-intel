/**
 * _brief-shared — helpers shared across the document view-state components
 * (DiscoveryHookView / RehearsalView / DecisionBriefView).
 *
 * Locked 2026-05-01 to satisfy the slop-scan canonical-import discipline:
 * formatBiasName / severityColor / formatExposure / buildCostOfIgnoring /
 * deriveDocumentType / SEVERITY_RANK were copy-pasted across all three
 * view components. Extracting here keeps slop-scan scorePerKloc below the
 * 4.0 trip-wire and ensures any future bias-label addition or severity
 * tweak only needs one edit.
 */

import type { BiasInstance } from '@/types';
import { SEVERITY_COLORS } from '@/lib/constants/human-audit';

export const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const BIAS_LABELS: Record<string, string> = {
  confirmation_bias: 'Confirmation Bias',
  anchoring_bias: 'Anchoring',
  sunk_cost_fallacy: 'Sunk Cost',
  overconfidence_bias: 'Overconfidence',
  narrative_fallacy: 'Narrative Fallacy',
  optimism_bias: 'Optimism Bias',
  planning_fallacy: 'Planning Fallacy',
  groupthink: 'Groupthink',
  authority_bias: 'Authority Bias',
  bandwagon_effect: 'Bandwagon Effect',
  hindsight_bias: 'Hindsight Bias',
  availability_heuristic: 'Availability',
  recency_bias: 'Recency Bias',
  status_quo_bias: 'Status Quo',
  loss_aversion: 'Loss Aversion',
  framing_effect: 'Framing',
  halo_effect: 'Halo Effect',
  illusion_of_control: 'Illusion of Control',
  illusion_of_validity: 'Illusion of Validity',
  inside_view_dominance: 'Inside-View Dominance',
  selection_bias: 'Selection Bias',
  survivorship_bias: 'Survivorship Bias',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  strategic_memo: 'strategic memo',
  ic_memo: 'IC memo',
  board_deck: 'board deck',
  market_entry: 'market-entry recommendation',
  counsel_memo: 'counsel memo',
  cim: 'CIM',
  pitch_deck: 'pitch deck',
  financial_model: 'financial model',
};

export function formatBiasName(key: string): string {
  return (
    BIAS_LABELS[key] ??
    key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  );
}

export function severityColor(severity: string): string {
  const k = severity?.toLowerCase() ?? '';
  if (k === 'critical') return SEVERITY_COLORS.critical;
  if (k === 'high') return SEVERITY_COLORS.high;
  if (k === 'medium') return SEVERITY_COLORS.medium;
  return SEVERITY_COLORS.low;
}

/** Bias rank for top-N selection. severity × confidence. */
export function rankBias(b: BiasInstance): number {
  const sev = SEVERITY_RANK[b.severity?.toLowerCase()] ?? 0;
  const conf = b.confidence ?? 0.7;
  return sev * conf;
}

export function deriveDocumentType(
  documentType: string | null | undefined,
  fallback = 'strategic memo'
): string {
  if (documentType && DOC_TYPE_LABELS[documentType]) return DOC_TYPE_LABELS[documentType];
  return fallback;
}

/** Compact monetary formatter — 600M / 1.2B / 25K. */
export function formatExposure(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  let formatted: string;
  if (abs >= 1_000_000_000) formatted = `${(amount / 1_000_000_000).toFixed(1)}B`;
  else if (abs >= 1_000_000) formatted = `${(amount / 1_000_000).toFixed(1)}M`;
  else if (abs >= 1_000) formatted = `${(amount / 1_000).toFixed(0)}K`;
  else formatted = amount.toFixed(0);
  return `${currency}${formatted}`;
}

/** Severity-weighted cost-of-ignoring estimate.
 *  When DecisionFrame.value is unavailable, falls back to qualitative
 *  bands so we never fabricate dollar numbers. */
export function buildCostOfIgnoring(
  exposure: { amount: number; currency: string } | undefined,
  topBiases: BiasInstance[]
): { display: string; calibrated: boolean } {
  const severityWeight = topBiases.reduce(
    (sum, b) => sum + (SEVERITY_RANK[b.severity?.toLowerCase()] ?? 0),
    0
  );
  if (!exposure || !Number.isFinite(exposure.amount)) {
    if (severityWeight >= 8) return { display: 'Material risk', calibrated: false };
    if (severityWeight >= 4) return { display: 'Notable risk', calibrated: false };
    return { display: 'Minor risk', calibrated: false };
  }
  const pct = Math.min(40, Math.max(5, severityWeight * 4));
  const at_risk = exposure.amount * (pct / 100);
  return { display: `${formatExposure(at_risk, exposure.currency)} at risk`, calibrated: true };
}

/** Per-bias DQI uplift if user "fixes" it in the What-If simulator.
 *  Heuristic: severity weight × confidence × 8 score points. Caps at +25. */
export function biasUplift(b: BiasInstance): number {
  const sev = SEVERITY_RANK[b.severity?.toLowerCase()] ?? 0;
  const conf = b.confidence ?? 0.7;
  return Math.min(25, Math.round(sev * conf * 8));
}
