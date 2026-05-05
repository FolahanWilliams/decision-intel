/**
 * Document detail v2 — tab barrel.
 *
 * Locked 2026-05-05. Five opinionated tabs answering one buyer question
 * each:
 *   Findings     — Where is the reasoning weak?
 *   Actions      — What do I fix before the room sees it?
 *   Stress       — Will this hold up under pressure?
 *   Perspectives — How does each stakeholder read this?
 *   Regulatory   — Which frameworks does this trigger?
 *
 * The remaining 4 tabs land in commits 2-4 of the refactor.
 */

export { FindingsTab } from './FindingsTab';
export type { FindingsTabProps, FindingsTabToxicCombination } from './FindingsTab';

export { ActionsTab } from './ActionsTab';
export type { ActionsTabProps } from './ActionsTab';

export { StressTestTab } from './StressTestTab';
export type {
  StressTestTabProps,
  StressTestSubTab,
  StressTestSlot,
} from './StressTestTab';

export { PerspectivesTab } from './PerspectivesTab';
export type { PerspectivesTabProps, PerspectiveLens } from './PerspectivesTab';

export { RegulatoryTab } from './RegulatoryTab';
export type {
  RegulatoryTabProps,
  RegulatoryTabFrameworkTrigger,
  RegulatoryTabSovereignContext,
} from './RegulatoryTab';
