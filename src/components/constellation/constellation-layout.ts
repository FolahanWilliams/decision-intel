/**
 * Layout helpers for the Decision Pipeline Constellation viz. Pure
 * functions — no React, no SVG, just math. Tested independently from
 * the renderer.
 *
 * Anchored on the master KB synthesis (2026-05-09 evening): the viz
 * must NOT be a force-directed physics toy (Quantellia trap). It is
 * structured by:
 *   - X-axis: time (oldest container left, newest right). Drives the
 *     temporal-decay-of-decision-quality narrative.
 *   - Y-axis: kind band (investment top, acquisition middle, strategic
 *     bottom). Lets a small-fund GP scan one band; lets a corp dev head
 *     focus the middle band; lets a fractional CSO scan the bottom.
 *   - Within a band, vertical jitter resolves overlap.
 *
 * Risk-state cues drive opacity + size, NOT position. Position is a
 * stable narrative anchor; risk is the ambient signal layered on top.
 */

import type {
  ConstellationNode,
  ConstellationLink,
} from '@/app/api/containers/constellation/route';
import type { DecisionContainerKind } from '@/lib/data/decision-container-modes';

export interface PositionedNode extends ConstellationNode {
  /** Center X coordinate in the SVG viewBox. */
  x: number;
  /** Center Y coordinate in the SVG viewBox. */
  y: number;
  /** Node radius in SVG units. */
  r: number;
  /** Risk band drives the renderer's color + opacity. */
  riskBand: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  /** T-N committee countdown in days, or null when no date set. */
  daysUntilCommittee: number | null;
  /** True when the node should pulse (T-N <= 7 days OR critical risk). */
  shouldPulse: boolean;
  /** True when the node should fade to background (no risk + no near committee). */
  isQuiet: boolean;
  /**
   * Names of critical assumptions this node `depends_on` (alert-ripple).
   * Non-null when the dependent rests on at least one assumption whose
   * own riskBand has flipped to 'critical'. Drives the outer red
   * rippling ring + the popup callout. The Cornerstone-magnetic moment:
   * a small-fund GP sees four portfolio commits ripple red simultaneously
   * because the macro WAEMU debt-cycle assumption flipped.
   */
  alertRippleSources: string[] | null;
}

export interface PositionedLink extends ConstellationLink {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  /** True when EITHER endpoint is in critical/high band — link inherits. */
  isHotEdge: boolean;
  /**
   * True when this is a `depends_on` edge AND the assumption (toId) has
   * flipped to riskBand=critical. Renders thicker stroke + animated
   * dash-flow + red color override. Pairs with PositionedNode.alertRippleSources
   * for a complete visual ripple chain (assumption → edge → dependent).
   */
  isAlertEdge: boolean;
}

export interface LayoutDimensions {
  width: number;
  height: number;
  /** Inner padding so node edges don't touch the SVG edge. */
  padX: number;
  padY: number;
}

const KIND_BAND_ORDER: DecisionContainerKind[] = ['investment', 'acquisition', 'strategic'];

export interface LayoutFilters {
  kinds: Set<DecisionContainerKind>;
  showQuiet: boolean;
}

/**
 * Compute the risk band from existing per-container signals. The
 * thresholds match the master KB anti-pattern guard: only material
 * signals surface; the rest fades.
 */
export function computeRiskBand(node: ConstellationNode): PositionedNode['riskBand'] {
  if (node.crossRefHighSeverityCount > 0) return 'critical';
  if (node.compositeDqi != null && node.compositeDqi < 40) return 'critical';
  if (node.crossRefConflictCount >= 3) return 'high';
  if (node.compositeDqi != null && node.compositeDqi < 55) return 'high';
  if (node.recurringBiasCount >= 4) return 'medium';
  if (node.compositeDqi != null && node.compositeDqi < 70) return 'medium';
  if (node.compositeDqi != null) return 'low';
  return 'safe';
}

/**
 * Days until committee date (positive = future, negative = past, null
 * when no committeeDate set). Computed against caller-provided `now`
 * so the layout is deterministic in tests.
 */
export function daysUntilCommittee(
  committeeDate: string | null,
  now: Date = new Date()
): number | null {
  if (!committeeDate) return null;
  const d = new Date(committeeDate);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function shouldNodePulse(riskBand: PositionedNode['riskBand'], daysUntil: number | null): boolean {
  if (riskBand === 'critical') return true;
  if (daysUntil != null && daysUntil >= 0 && daysUntil <= 7) return true;
  return false;
}

function isQuietNode(riskBand: PositionedNode['riskBand'], daysUntil: number | null): boolean {
  if (riskBand === 'critical' || riskBand === 'high') return false;
  if (daysUntil != null && daysUntil >= 0 && daysUntil <= 14) return false;
  return riskBand === 'safe' || riskBand === 'low';
}

/**
 * Layout: X = time (createdAt → now), Y = kind band, R = ticket size.
 * Per master KB: position is stable narrative; risk is the ambient cue.
 */
export function layoutConstellation(
  nodes: ConstellationNode[],
  links: ConstellationLink[],
  dims: LayoutDimensions,
  filters: LayoutFilters,
  now: Date = new Date()
): { nodes: PositionedNode[]; links: PositionedLink[] } {
  const filteredNodes = nodes.filter(n => filters.kinds.has(n.kind as DecisionContainerKind));

  if (filteredNodes.length === 0) {
    return { nodes: [], links: [] };
  }

  // Time axis bounds. Pin the right edge to "now" so future committee
  // dates can render past the trailing edge of created-rows.
  const minTs = Math.min(...filteredNodes.map(n => new Date(n.createdAt).getTime()));
  const maxTs = now.getTime();
  const timeRange = Math.max(maxTs - minTs, 1);

  // Three Y-bands (investment top, acquisition middle, strategic bottom).
  const innerWidth = dims.width - dims.padX * 2;
  const innerHeight = dims.height - dims.padY * 2;
  const bandHeight = innerHeight / KIND_BAND_ORDER.length;

  // Stable in-band Y jitter via deterministic hash on container id.
  const jitterFor = (id: string): number => {
    let h = 0;
    for (let i = 0; i < id.length; i += 1) {
      h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
    }
    // Map to [-0.35, 0.35] of band height
    return ((h % 1000) / 1000 - 0.5) * 0.7;
  };

  // Ticket-size derived radius. Strategic mode often has null ticket;
  // fall back to documentCount-derived radius so those nodes stay
  // visible. First pass: positioned without alertRippleSources (filled
  // in the second pass after we know which assumptions are critical).
  const positionedDraft: Omit<PositionedNode, 'alertRippleSources'>[] = filteredNodes.map(n => {
    const ts = new Date(n.createdAt).getTime();
    const x = dims.padX + ((ts - minTs) / timeRange) * innerWidth;
    const bandIndex = KIND_BAND_ORDER.indexOf(n.kind as DecisionContainerKind);
    const bandCenterY = dims.padY + bandIndex * bandHeight + bandHeight / 2;
    const y = bandCenterY + jitterFor(n.id) * bandHeight;

    let r = 8;
    if (n.ticketSize != null) {
      // Log-scale: $1M → 8, $10M → 11, $100M → 14, $1B → 17. Capped.
      const m = Math.max(1, Math.log10(Math.max(n.ticketSize, 1) / 1_000_000) + 1);
      r = Math.min(20, 8 + m * 2);
    } else if (n.documentCount > 0) {
      r = Math.min(16, 8 + n.documentCount);
    }

    const riskBand = computeRiskBand(n);
    const daysUntil = daysUntilCommittee(n.committeeDate, now);
    const shouldPulse = shouldNodePulse(riskBand, daysUntil);
    const quiet = isQuietNode(riskBand, daysUntil);

    return {
      ...n,
      x,
      y,
      r,
      riskBand,
      daysUntilCommittee: daysUntil,
      shouldPulse,
      isQuiet: !filters.showQuiet && quiet,
    };
  });

  // ─── Alert-ripple computation ─────────────────────────────────────
  //
  // For every depends_on link where the ASSUMPTION (toId) has flipped to
  // riskBand=critical, every DEPENDENT (fromId) inherits an alert-ripple
  // visual. Build a map of dependentId → critical assumption names
  // (could be multiple — a node depending on TWO critical assumptions
  // shows both names in the popup).
  const draftMap = new Map(positionedDraft.map(p => [p.id, p]));
  const rippleSourcesByDependent = new Map<string, string[]>();
  for (const l of links) {
    if (l.linkType !== 'depends_on') continue;
    const dependent = draftMap.get(l.fromId);
    const assumption = draftMap.get(l.toId);
    if (!dependent || !assumption) continue;
    if (assumption.riskBand !== 'critical') continue;
    const existing = rippleSourcesByDependent.get(l.fromId) ?? [];
    existing.push(assumption.name);
    rippleSourcesByDependent.set(l.fromId, existing);
  }

  // Second pass: enrich draft with alertRippleSources.
  const positioned: PositionedNode[] = positionedDraft.map(p => ({
    ...p,
    alertRippleSources: rippleSourcesByDependent.get(p.id) ?? null,
  }));

  // Build link list filtered to nodes that survived the filter.
  const nodeMap = new Map(positioned.map(p => [p.id, p]));
  const positionedLinks: PositionedLink[] = links
    .map(l => {
      const from = nodeMap.get(l.fromId);
      const to = nodeMap.get(l.toId);
      if (!from || !to) return null;
      const isHot =
        from.riskBand === 'critical' ||
        from.riskBand === 'high' ||
        to.riskBand === 'critical' ||
        to.riskBand === 'high';
      // Alert edge: depends_on link whose assumption (toId) is critical.
      // The edge becomes the visual conduit between a critical assumption
      // and its dependents — thicker stroke + animated dash-flow.
      const isAlert = l.linkType === 'depends_on' && to.riskBand === 'critical';
      return {
        ...l,
        fromX: from.x,
        fromY: from.y,
        toX: to.x,
        toY: to.y,
        isHotEdge: isHot,
        isAlertEdge: isAlert,
      };
    })
    .filter((l): l is PositionedLink => l !== null);

  return { nodes: positioned, links: positionedLinks };
}

/**
 * Risk-band → CSS variable. Severity tokens; centralised so the renderer
 * never inlines hex.
 */
export function riskBandColor(band: PositionedNode['riskBand']): string {
  switch (band) {
    case 'critical':
      return 'var(--severity-critical)';
    case 'high':
      return 'var(--severity-high)';
    case 'medium':
      return 'var(--warning)';
    case 'low':
      return 'var(--success)';
    case 'safe':
      return 'var(--text-muted)';
  }
}

/**
 * Tint helper — color-mix-based alpha blend. Mirrors the canonical
 * helper used across TeamIntelligenceTab + DecisionAlphaTab.
 */
export function severityTint(color: string, alphaPct: number): string {
  return `color-mix(in srgb, ${color} ${alphaPct}%, transparent)`;
}

/**
 * Kind → label. Y-axis tick labels.
 */
export const KIND_BAND_LABELS: Record<DecisionContainerKind, string> = {
  investment: 'Investment',
  acquisition: 'Acquisition',
  strategic: 'Strategic',
};

export const KIND_BAND_DESCRIPTIONS: Record<DecisionContainerKind, string> = {
  investment: 'VC / growth / late-stage portfolio commits',
  acquisition: 'Corporate development / M&A buy-side',
  strategic: 'Market entry / restructuring / strategic bets',
};

export { KIND_BAND_ORDER };
