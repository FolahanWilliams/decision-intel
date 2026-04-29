/**
 * Path to $100M ARR — barrel re-exporter (F2 lock 2026-04-29).
 *
 * As of F2 lock 2026-04-29, the per-section data is split into 12
 * sub-modules under `./data/`. Each consumer imports from its specific
 * sub-module so a NotebookLM synthesis edit on (e.g.) role playbooks
 * doesn't ripple-rebuild every other consumer's bundle. This file
 * re-exports the same symbols so any accidental `from './data'` import
 * still resolves.
 *
 * ─── Source-of-truth pointers (consumer ↔ data module) ─────────────
 *   StrengthsWeaknessesMatrix    → ./data/strengths-weaknesses.ts
 *   R2FDeepDive                  → ./data/r2f.ts
 *   CategoryAndPitchLibrary      → ./data/category-pitch.ts
 *   RoleOutreachPlaybooks        → ./data/role-playbooks.ts
 *   KillerResponsesPlaybook      → ./data/killer-responses.ts
 *   InvestorMetricsTracker       → ./data/investor-metrics.ts
 *   FailureModesWatchtower       → ./data/failure-modes.ts
 *   WarmIntroNetworkMap          → ./data/network-nodes.ts
 *   NinetyDayActionPlan          → ./data/ninety-day-actions.ts
 *   NotebookLmFollowUpLab        → ./data/notebook-lm-follow-ups.ts
 *   MarketRealityCheck           → ./data/silent-objections.ts
 *   SimplifiedThirtyDayFunnel    → ./data/simplified-funnel.ts
 *
 * When the synthesis evolves (new design partners closed, new ICP
 * signals, confirmed Cloverpop ACVs, etc.), update the relevant
 * sub-module — this barrel only re-exports. NorthStarHero + PITFALLS
 * are constants composed inline in the consumer (kept there for
 * proximity, not exported).
 */

export type { Strength, Weakness } from './data/strengths-weaknesses';
export { STRENGTHS, WEAKNESSES } from './data/strengths-weaknesses';

export type { RolePlaybook } from './data/role-playbooks';
export { ROLE_PLAYBOOKS } from './data/role-playbooks';

export type { R2FCurrentPillar, R2FMoatLever } from './data/r2f';
export { R2F_CURRENT, R2F_MOAT_LEVERS } from './data/r2f';

export type {
  CategoryDefinition,
  PersonaPitch,
  LanguagePattern,
} from './data/category-pitch';
export {
  CATEGORY_DEFINITION,
  PERSONA_PITCH_LIBRARY,
  LANGUAGE_PATTERNS,
} from './data/category-pitch';

export type { KillerResponse } from './data/killer-responses';
export { KILLER_RESPONSES } from './data/killer-responses';

export type { InvestorMetric } from './data/investor-metrics';
export { INVESTOR_METRICS } from './data/investor-metrics';

export type { FailureMode } from './data/failure-modes';
export { FAILURE_MODES } from './data/failure-modes';

export type { NetworkNode } from './data/network-nodes';
export { NETWORK_NODES } from './data/network-nodes';

export type { NinetyDayAction } from './data/ninety-day-actions';
export { NINETY_DAY_ACTIONS } from './data/ninety-day-actions';

export type { NotebookLmFollowUp } from './data/notebook-lm-follow-ups';
export { NOTEBOOKLM_FOLLOW_UPS } from './data/notebook-lm-follow-ups';

export type { SilentObjection } from './data/silent-objections';
export { SILENT_OBJECTIONS } from './data/silent-objections';

export type { FunnelScreen, FeatureVerdict } from './data/simplified-funnel';
export { SIMPLIFIED_FUNNEL, FEATURE_VERDICTS } from './data/simplified-funnel';

import { STRENGTHS, WEAKNESSES } from './data/strengths-weaknesses';
import { ROLE_PLAYBOOKS } from './data/role-playbooks';
import { R2F_MOAT_LEVERS } from './data/r2f';
import {
  PERSONA_PITCH_LIBRARY,
  LANGUAGE_PATTERNS,
} from './data/category-pitch';
import { KILLER_RESPONSES } from './data/killer-responses';
import { INVESTOR_METRICS } from './data/investor-metrics';
import { FAILURE_MODES } from './data/failure-modes';
import { NETWORK_NODES } from './data/network-nodes';
import { NINETY_DAY_ACTIONS } from './data/ninety-day-actions';
import { NOTEBOOKLM_FOLLOW_UPS } from './data/notebook-lm-follow-ups';
import { SILENT_OBJECTIONS } from './data/silent-objections';
import { SIMPLIFIED_FUNNEL, FEATURE_VERDICTS } from './data/simplified-funnel';

export const SECTION_COUNTS = {
  strengths: STRENGTHS.length,
  weaknesses: WEAKNESSES.length,
  rolePlaybooks: ROLE_PLAYBOOKS.length,
  r2fLevers: R2F_MOAT_LEVERS.length,
  killerResponses: KILLER_RESPONSES.length,
  personaPitches: PERSONA_PITCH_LIBRARY.length,
  languagePatterns: LANGUAGE_PATTERNS.length,
  investorMetrics: INVESTOR_METRICS.length,
  failureModes: FAILURE_MODES.length,
  networkNodes: NETWORK_NODES.length,
  ninetyDayActions: NINETY_DAY_ACTIONS.length,
  notebookLmFollowUps: NOTEBOOKLM_FOLLOW_UPS.length,
  silentObjections: SILENT_OBJECTIONS.length,
  funnelScreens: SIMPLIFIED_FUNNEL.length,
  featureVerdicts: FEATURE_VERDICTS.length,
};
