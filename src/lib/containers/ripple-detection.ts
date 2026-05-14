/**
 * `depends_on` ripple-alert detector — M-7 ship (locked 2026-05-13).
 *
 * Closes the Aisha-persona blocker surfaced in the 2026-05-12 audit
 * (Section 8 A-2): "No proactive depends_on ripple alert when a
 * structural assumption changes status." Until this ship, cross-decision
 * detection only fired when the user opened the recommendations
 * endpoint. The Cornerstone-magnetic moment — "the moment the
 * assumption flips, see every dependent commit as a red banner" —
 * required manual constellation navigation.
 *
 * Pure-function detector. Takes anchor containers (containers OTHER
 * containers depend on) + dependent containers (the containers that
 * declared a depends_on edge) + a link map. Returns RippleAlert[]
 * sorted by severity × recency.
 *
 * NO I/O. NO LLM. NO Prisma. The API endpoint does the data fetch +
 * passes the slices in; this module is the rule-engine.
 *
 * Trigger semantics (v1):
 *   - HIGH-severity ripple: anchor container has been ARCHIVED
 *     (status='archived') since the dependent edge was created. The
 *     anchor's thesis / assumption is no longer the active frame; every
 *     dependent decision is at risk of resting on a stale premise.
 *   - HIGH-severity ripple: anchor has an outcome row WHERE the realised
 *     DQI is materially below predicted (Brier ≥ 0.20) OR the outcome
 *     summary contains failure-class language ("failed", "missed", "did
 *     not achieve", "below target"). This is the "assumption broke in
 *     practice" signal.
 *   - MEDIUM-severity ripple: anchor's outcome row exists but the
 *     realised DQI is in the partial band (Brier 0.10-0.20). Worth
 *     reviewing but not urgent.
 *
 * Self-loops + dismissed ripples are filtered by the API layer, not
 * here — this function is pure detection.
 */

/** Minimal shape of a container we need for ripple detection. */
export interface RippleContainerLite {
  id: string;
  name: string;
  kind: 'investment' | 'acquisition' | 'strategic';
  status: string; // active | archived | etc.
  decisionFrame: string | null;
  outcome?: RippleOutcomeLite | null;
}

/** Minimal shape of an outcome we need for severity classification. */
export interface RippleOutcomeLite {
  summary: string;
  realisedDqi: number | null;
  brierScore: number | null;
  reportedAt: Date | string;
}

/** A depends_on edge from a dependent → anchor. */
export interface DependsOnEdge {
  /** Container that DECLARED the dependency (the "dependent"). */
  fromId: string;
  /** Container the dependent rests on (the "anchor"). */
  toId: string;
  /** Optional free-text note from the edge creator. */
  note?: string | null;
  /** When the edge was created. */
  createdAt: Date | string;
}

export type RippleSeverity = 'high' | 'medium';

export type RippleReason =
  | 'anchor_archived'
  | 'anchor_outcome_failure'
  | 'anchor_outcome_partial';

export interface RippleAlert {
  /** Stable id for dismissal tracking — derived from anchor+dependent. */
  id: string;
  severity: RippleSeverity;
  reason: RippleReason;
  /**
   * The anchor (the container WHOSE ASSUMPTION shifted). When this
   * container's status changes, every dependent ripples.
   */
  anchor: {
    id: string;
    name: string;
    kind: RippleContainerLite['kind'];
    status: string;
    decisionFrame: string | null;
    outcomeSummary?: string;
    realisedDqi?: number | null;
    brierScore?: number | null;
  };
  /**
   * The dependent (the container that originally declared "we depend
   * on the anchor's assumption"). This is the one the user must
   * review.
   */
  dependent: {
    id: string;
    name: string;
    kind: RippleContainerLite['kind'];
  };
  /** The edge note (creator's free-text rationale, when present). */
  edgeNote: string | null;
  /** When the edge was originally declared. */
  edgeCreatedAt: string;
  /**
   * When the ripple actually triggered (anchor archival or outcome
   * reporting). Drives "X hours ago" copy in the UI.
   */
  triggeredAt: string;
  /** Plain-language reason a procurement reader can act on. */
  message: string;
}

/** Regex matching failure-class language in the anchor outcome summary. */
const FAILURE_LANGUAGE = /\b(failed|missed|did not achieve|below target|did not deliver|underperformed|destroyed value|wrote down|writedown|wrote off)\b/i;

const BRIER_FAILURE_THRESHOLD = 0.2;
const BRIER_PARTIAL_THRESHOLD = 0.1;

/**
 * Classify the severity + reason for a single anchor.
 * Returns null when the anchor is in a state that doesn't ripple.
 */
function classifyAnchor(
  anchor: RippleContainerLite
): { severity: RippleSeverity; reason: RippleReason; triggeredAt: string } | null {
  // 1) Archive flip — high severity.
  if (anchor.status === 'archived') {
    // Use anchor outcome's reportedAt if present, else fall back to
    // edge-time semantics in the caller. Pure function — we don't
    // have a separate "archivedAt" field on the container today.
    const ts = anchor.outcome?.reportedAt
      ? new Date(anchor.outcome.reportedAt).toISOString()
      : new Date().toISOString();
    return { severity: 'high', reason: 'anchor_archived', triggeredAt: ts };
  }

  // 2) Outcome row exists — check Brier + summary for failure signal.
  if (anchor.outcome) {
    const brier =
      typeof anchor.outcome.brierScore === 'number' ? anchor.outcome.brierScore : null;
    const summary = anchor.outcome.summary ?? '';
    const failureBySummary = FAILURE_LANGUAGE.test(summary);
    const failureByBrier = brier !== null && brier >= BRIER_FAILURE_THRESHOLD;
    const partialByBrier =
      brier !== null && brier >= BRIER_PARTIAL_THRESHOLD && brier < BRIER_FAILURE_THRESHOLD;

    if (failureBySummary || failureByBrier) {
      return {
        severity: 'high',
        reason: 'anchor_outcome_failure',
        triggeredAt: new Date(anchor.outcome.reportedAt).toISOString(),
      };
    }
    if (partialByBrier) {
      return {
        severity: 'medium',
        reason: 'anchor_outcome_partial',
        triggeredAt: new Date(anchor.outcome.reportedAt).toISOString(),
      };
    }
  }

  // 3) Otherwise — no ripple.
  return null;
}

function buildMessage(
  reason: RippleReason,
  anchor: RippleContainerLite,
  dependent: RippleContainerLite
): string {
  const anchorName = anchor.name;
  const dependentName = dependent.name;
  switch (reason) {
    case 'anchor_archived':
      return `${dependentName} depends on ${anchorName} — but the anchor was archived. Review whether the assumption still holds.`;
    case 'anchor_outcome_failure':
      return `${anchorName} closed below predicted (Brier ≥ ${BRIER_FAILURE_THRESHOLD}). ${dependentName} rests on its assumption — review the dependency before the next gate.`;
    case 'anchor_outcome_partial':
      return `${anchorName} closed partially (Brier in [${BRIER_PARTIAL_THRESHOLD}, ${BRIER_FAILURE_THRESHOLD})). ${dependentName} depends on it — worth a review, not blocking.`;
  }
}

export interface DetectRipplesInput {
  /** Every container the caller (user or org) can see. Keyed by id. */
  containers: Map<string, RippleContainerLite>;
  /** Every depends_on edge in scope. */
  edges: DependsOnEdge[];
  /**
   * Optional set of ripple ids the user has dismissed. Filtered out of
   * the result so dismissed ripples don't re-appear on every poll.
   */
  dismissedIds?: Set<string>;
}

/**
 * Pure detector. Iterates the edges, classifies each anchor, emits a
 * RippleAlert when severity is non-null. Self-edges (fromId === toId)
 * are filtered defensively. Sorted high-severity-first then by recency.
 */
export function detectDependsOnRipples(input: DetectRipplesInput): RippleAlert[] {
  const { containers, edges, dismissedIds } = input;
  const ripples: RippleAlert[] = [];

  for (const edge of edges) {
    if (edge.fromId === edge.toId) continue; // defensive — self-edges meaningless
    const dependent = containers.get(edge.fromId);
    const anchor = containers.get(edge.toId);
    if (!dependent || !anchor) continue; // edge points at unknown container
    // Dependent must be ACTIVE — there's no point alerting about a
    // dependent that's itself archived.
    if (dependent.status !== 'active') continue;

    const classification = classifyAnchor(anchor);
    if (!classification) continue;

    const id = `${edge.toId}::${edge.fromId}::${classification.reason}`;
    if (dismissedIds?.has(id)) continue;

    ripples.push({
      id,
      severity: classification.severity,
      reason: classification.reason,
      anchor: {
        id: anchor.id,
        name: anchor.name,
        kind: anchor.kind,
        status: anchor.status,
        decisionFrame: anchor.decisionFrame,
        outcomeSummary: anchor.outcome?.summary,
        realisedDqi: anchor.outcome?.realisedDqi ?? null,
        brierScore: anchor.outcome?.brierScore ?? null,
      },
      dependent: {
        id: dependent.id,
        name: dependent.name,
        kind: dependent.kind,
      },
      edgeNote: edge.note ?? null,
      edgeCreatedAt: new Date(edge.createdAt).toISOString(),
      triggeredAt: classification.triggeredAt,
      message: buildMessage(classification.reason, anchor, dependent),
    });
  }

  // Sort: high severity first, then most-recently triggered first.
  ripples.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'high' ? -1 : 1;
    return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
  });

  return ripples;
}

/**
 * Convenience: collapse ripples by anchor so the UI can render
 * "anchor X has N dependents at risk" instead of N rows per anchor.
 * Used by the dashboard banner (compact view).
 */
export interface RippleGroup {
  anchorId: string;
  anchorName: string;
  anchorStatus: string;
  topSeverity: RippleSeverity;
  topReason: RippleReason;
  triggeredAt: string;
  dependents: Array<{
    id: string;
    name: string;
    ripple: RippleAlert;
  }>;
}

export function groupRipplesByAnchor(ripples: RippleAlert[]): RippleGroup[] {
  const byAnchor = new Map<string, RippleGroup>();
  for (const r of ripples) {
    let group = byAnchor.get(r.anchor.id);
    if (!group) {
      group = {
        anchorId: r.anchor.id,
        anchorName: r.anchor.name,
        anchorStatus: r.anchor.status,
        topSeverity: r.severity,
        topReason: r.reason,
        triggeredAt: r.triggeredAt,
        dependents: [],
      };
      byAnchor.set(r.anchor.id, group);
    }
    // Upgrade severity if this ripple is higher.
    if (r.severity === 'high' && group.topSeverity !== 'high') {
      group.topSeverity = 'high';
      group.topReason = r.reason;
      group.triggeredAt = r.triggeredAt;
    }
    group.dependents.push({ id: r.dependent.id, name: r.dependent.name, ripple: r });
  }
  // Return sorted high-first then most-recent-anchor-trigger first.
  return Array.from(byAnchor.values()).sort((a, b) => {
    if (a.topSeverity !== b.topSeverity) return a.topSeverity === 'high' ? -1 : 1;
    return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
  });
}
