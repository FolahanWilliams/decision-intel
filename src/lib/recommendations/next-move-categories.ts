/**
 * Constellation Next Move — recommendation category SSOT.
 *
 * Locked 2026-05-10 alongside the full Constellation Next Move ship.
 * Source: 2026-05-10 Deep Research paper "Reasoning In High-Stakes
 * Corporate Development, M&A, and Venture Capital Decisions" (150+
 * sources). Six categories anchored to Ch 2 (Failure-Mode Taxonomy),
 * Ch 5 (Cross-Decision Relationship Layer), and Ch 9 (Calibration /
 * Outcome-Feedback). Every Next Move recommendation surfaced on the
 * constellation maps to exactly one of these categories — the
 * categoryId is the audit trail.
 *
 * Why these six (and not more / not fewer): the paper's chapter
 * structure converged on six failure-mode classes that practitioners
 * actually triage on. Adding a 7th risks dilution; collapsing to five
 * risks losing a load-bearing distinction (the paper's Ch 5 cross-
 * decision relationship layer is structurally different from the
 * Ch 2 single-deal failure modes — both must surface independently).
 *
 * Forward-looking rule: when adding a 7th category, every consumer
 * (engine, persona-framing map, UI legend) updates in lockstep — same
 * drift-class discipline as NAMED_PATTERNS + CONTAINER_MODES.
 */

export type NextMoveCategoryId =
  | 'committee_gate_pressure'
  | 'quality_gate_violation'
  | 'missing_required_artefact'
  | 'outcome_closure'
  | 'cross_decision_pattern'
  | 'lineage_drift';

export interface NextMoveCategory {
  id: NextMoveCategoryId;
  /// Short display label (≤24 chars) for chips, drawer headers.
  label: string;
  /// One-line procurement-grade description for the drawer's expanded
  /// view. Must read as something a F500 GC could quote in an audit-
  /// committee meeting.
  description: string;
  /// Trigger signal in plain language — what the rule-based engine
  /// looks for to fire this category. Used by the "why this fires"
  /// trace.
  triggerSignal: string;
  /// Paper anchor — the chapter / section the category derives from.
  /// Lets the founder trace any recommendation back to the literature.
  paperAnchor: string;
  /// Severity when the category fires. The engine multiplies this by
  /// validity-aware urgency × time-pressure for final ranking.
  baseSeverity: 'critical' | 'high' | 'medium' | 'low';
  /// Whether the category requires LLM augmentation (cross-decision
  /// pattern detection benefits from semantic similarity over plain
  /// rules; the rest are pure-rule).
  requiresLlmAugmentation: boolean;
}

export const NEXT_MOVE_CATEGORIES: Record<NextMoveCategoryId, NextMoveCategory> = {
  committee_gate_pressure: {
    id: 'committee_gate_pressure',
    label: 'Committee gate pressure',
    description:
      'A committee or IC date is approaching with unresolved cross-doc conflicts or critical-severity findings on the artefact under review.',
    triggerSignal:
      'committeeDate ≤ 7 days AND (highSeverityConflictCount > 0 OR critical-severity named pattern fired)',
    paperAnchor: 'Ch 2 — Escalation of Commitment + IC vote performative bias',
    baseSeverity: 'critical',
    requiresLlmAugmentation: false,
  },
  quality_gate_violation: {
    id: 'quality_gate_violation',
    label: 'Quality gate violation',
    description:
      'Composite DQI is below the audit-defensible threshold or a named toxic combination has fired at high+ severity. The reasoning under review will not survive procurement-grade scrutiny in its current state.',
    triggerSignal:
      "compositeDqi < 55 OR named pattern fired at high+ severity (Synergy Mirage / Conglomerate Fallacy / Winner's Curse / Coherent Confidence / Reference-Class Blindness)",
    paperAnchor: 'Ch 2 — Synergy overestimation + Confirmation bias at IC vote',
    baseSeverity: 'high',
    requiresLlmAugmentation: false,
  },
  missing_required_artefact: {
    id: 'missing_required_artefact',
    label: 'Missing required artefact',
    description:
      "A document type required by the container's mode-specific committee gate is not yet attached. The IC / board / steering committee will not approve without it.",
    triggerSignal: 'CONTAINER_MODES[kind].requiredDocs not all attached AND committeeDate is set',
    paperAnchor: 'Ch 1 — Anatomy of the deal lifecycle (artefact bottleneck before committee)',
    baseSeverity: 'medium',
    requiresLlmAugmentation: false,
  },
  outcome_closure: {
    id: 'outcome_closure',
    label: 'Outcome closure',
    description:
      'A decided container is past the typical outcome-resolution window with no closed outcome logged. Logging the outcome — including intermediate proxy predictions — sharpens the per-org Brier-scored calibration profile.',
    triggerSignal:
      'decidedAt ≥ 30 days ago AND outcome row absent (or: micro-prediction horizonDays passed, resolution unrecorded)',
    paperAnchor: 'Ch 9 — Intermediate proxy metrics over decade-long terminal feedback',
    baseSeverity: 'medium',
    requiresLlmAugmentation: false,
  },
  cross_decision_pattern: {
    id: 'cross_decision_pattern',
    label: 'Cross-decision pattern',
    description:
      'A reasoning pattern has been detected across multiple linked containers — a thesis cascade, a shared structural assumption, or a platform-bolt-on contagion. The literature flags this layer as the most dangerous and most-frequently-missed by current decision tooling.',
    triggerSignal:
      'thesis spawned ≥3 active commits (cascade) OR ≥3 containers share a structural assumption (ripple) OR parent_of edge with parent compositeDqi < 60 (platform contagion)',
    paperAnchor: 'Ch 5 — Strategy Stack Theory + assumption-dependence chains',
    baseSeverity: 'high',
    requiresLlmAugmentation: true,
  },
  lineage_drift: {
    id: 'lineage_drift',
    label: 'Lineage drift',
    description:
      'An upstream decision this container depends on has resolved to an outcome that diverges from the forecast that originally justified this container. The downstream reasoning may no longer hold.',
    triggerSignal:
      "depends_on edge's upstream container has outcome logged AND outcome resolution diverges from the forecast",
    paperAnchor: 'Ch 5 — Precedent-binding + lineage drift',
    baseSeverity: 'high',
    requiresLlmAugmentation: true,
  },
};

/**
 * Stable iteration order for UI rendering — committee gate pressure
 * always ranks first when present, cross-decision pattern always
 * surfaces in the dedicated drawer section regardless of severity.
 */
export const NEXT_MOVE_CATEGORY_ORDER: readonly NextMoveCategoryId[] = [
  'committee_gate_pressure',
  'quality_gate_violation',
  'cross_decision_pattern',
  'lineage_drift',
  'missing_required_artefact',
  'outcome_closure',
] as const;

/**
 * Categories that fire only when the paper's cross-decision relationship
 * layer is materialized — they require ≥1 ContainerLink to even be
 * candidates. Used by the engine to skip the LLM call on isolated
 * containers.
 */
export const CROSS_DECISION_CATEGORIES: ReadonlySet<NextMoveCategoryId> = new Set([
  'cross_decision_pattern',
  'lineage_drift',
]);
