/**
 * Document detail v2 — visual primitives barrel.
 *
 * Locked 2026-05-05. The McKinsey-grade card / meter / pillar primitives
 * the new doc-detail tabs are built on. Mirrors the DPR's visual rhythm
 * (severity-coloured top edges, soft borders, generous whitespace) but
 * uses platform CSS variables (var(--bg-card), var(--severity-*)) so the
 * cards live in the light-theme platform shell, not the DPR document.
 */

export { SeverityEdgeCard, severityToken } from './SeverityEdgeCard';
export type { Severity, SeverityEdgeCardProps } from './SeverityEdgeCard';

export { SeverityMeter } from './SeverityMeter';
export type { SeverityMeterProps } from './SeverityMeter';

export { DqiPill } from './DqiPill';
export type { DqiPillProps } from './DqiPill';

export { R2FPerDocMap } from './R2FPerDocMap';
export type { R2FPerDocMapProps, R2FProtectedItem, R2FSuppressedItem } from './R2FPerDocMap';

export { ToxicCombinationsRadial } from './ToxicCombinationsRadial';
export type {
  ToxicCombinationsRadialProps,
  ToxicCombinationNode,
  ToxicCombinationEdge,
} from './ToxicCombinationsRadial';

export { LifecycleTimeline } from './LifecycleTimeline';
export type { LifecycleTimelineProps, LifecycleStage } from './LifecycleTimeline';
