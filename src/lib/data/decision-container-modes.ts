/**
 * DecisionContainer modes — the canonical SSOT for the unified
 * capital-allocation-decision surface. Replaces the prior split between
 * `Deal` (M&A-coded) and `DecisionPackage` (generic-coded) with one
 * model + five workflow modes:
 *
 *   - investment              → VC / growth / late-stage portfolio commitments
 *   - acquisition             → corporate development / M&A buy-side
 *   - strategic               → non-investment strategic decisions (market entry,
 *                               product bet, org restructure, etc.)
 *   - real_estate_development → ground-up or major-reposition development
 *                               (Adaptation #2, locked 2026-05-24): site
 *                               acquisition → entitlement → financing →
 *                               construction → leasing → stabilization
 *   - fund_launch             → launching a new fund vehicle (Adaptation #3,
 *                               locked 2026-05-24): thesis → market sizing →
 *                               fee structure → anchor LP commitments →
 *                               regulatory filing → GTM
 *
 * All five share the same R²F audit pipeline, DPR, composite DQI,
 * cross-doc conflict detection, and Brier-scored outcome calibration.
 * They diverge only on (a) stage labels, (b) required docs at the
 * committee gate, (c) outcome metric shape, (d) committee label.
 *
 * Architecture lock 2026-05-09 — when the container shape changes
 * (new mode, new stage, new required-doc rule), edit THIS file only;
 * every consumer (kanban, committee gate, DPR, outcome capture,
 * marketing pages) reads by import. Same drift-class lock as
 * NAMED_PATTERNS + INVESTMENT_DOCUMENT_TYPES + getAllRegisteredFrameworks.
 *
 * Forward-looking rule: when adding a new container mode, the SSOT
 * entry + the consumers below update in lockstep — same discipline as
 * the bias-taxonomy + named-pattern cascades.
 *
 *   Consumers (Phase 2 + 3 ship targets):
 *   - /api/containers/route.ts                — list/create
 *   - /api/containers/[id]/route.ts           — read/update
 *   - /api/containers/[id]/outcome/route.ts   — outcome capture (mode-aware)
 *   - /api/containers/[id]/cross-reference/route.ts
 *   - /api/containers/[id]/provenance-record/route.ts
 *   - /dashboard/containers/[id]/page.tsx     — unified detail
 *   - /dashboard/containers/page.tsx          — unified kanban
 *   - components/containers/ContainerKanban.tsx
 *   - components/containers/CommitteeReadinessGate.tsx
 *   - components/dpr/* (mode-aware lifecycle strip)
 *   - lib/scoring/container-aggregation.ts    — mirrors deal-aggregation
 *   - app/(marketing)/how-it-works           — Section 4b reads from here
 */

import {
  INVESTMENT_DOCUMENT_TYPES,
  type InvestmentDocumentType,
} from '@/lib/prompts/investment-vertical';

// ─── Type surface ────────────────────────────────────────────────────────────

export type DecisionContainerKind =
  | 'investment'
  | 'acquisition'
  | 'strategic'
  // Real-estate development (Adaptation #2, locked 2026-05-24). The 4th
  // mode in the canonical container taxonomy — site acquisition →
  // entitlement → financing → construction → leasing → stabilization.
  | 'real_estate_development'
  // Fund launch (Adaptation #3, locked 2026-05-24). The 5th mode —
  // thesis → market sizing → fee structure → anchor LP commitments →
  // regulatory filing → GTM.
  | 'fund_launch';

/**
 * The three universal lifecycle phases. Stage IDs are mode-specific
 * (an `acquisition` container's diligence is structurally different
 * from an `investment` container's diligence) but every stage maps
 * onto one of these three universal phases — used by analytics,
 * cross-mode dashboards, and the committee-gate logic.
 */
export type ContainerLifecyclePhase = 'pre_committee' | 'committee_gate' | 'post_committee';

export interface ContainerStage {
  /** Stable id used in DB writes + URL params. Snake_case. */
  id: string;
  /** UI label for the stage. */
  label: string;
  /** Numeric eyebrow ("01", "02", ...) for kanban + lifecycle strip. */
  eyebrow: string;
  /** One-sentence procurement-grade description. */
  description: string;
  /** Universal phase classification — drives committee-gate logic. */
  phase: ContainerLifecyclePhase;
  /** Document types most often attached at this stage. */
  expectedDocTypes: ReadonlyArray<InvestmentDocumentType | 'memo' | 'deck' | 'model' | 'other'>;
  /** Named-pattern labels (from NAMED_PATTERNS) most likely to fire here. */
  likelyPatternLabels: ReadonlyArray<string>;
}

export type OutcomeMetricType = 'percent' | 'currency' | 'number' | 'enum' | 'text' | 'months';

export interface OutcomeMetricField {
  /** Stable key used in JSON outcome blob. Snake_case. */
  key: string;
  label: string;
  type: OutcomeMetricType;
  /** Optional enum options when type === 'enum'. */
  options?: ReadonlyArray<string>;
  /** Whether this metric anchors the success verdict. */
  primary?: boolean;
}

export interface ContainerOutcomeShape {
  /** The shape category — used by Brier-scoring + DPR. */
  shape:
    | 'irr_moic'
    | 'synergy_realisation'
    | 'forecast_hit_rate'
    | 'dev_yield'
    | 'fund_realisation';
  /** Procurement-grade name for the success metric. */
  primaryMetricLabel: string;
  /** Ordered fields rendered in the outcome capture UI. */
  fields: ReadonlyArray<OutcomeMetricField>;
}

export interface ContainerMode {
  kind: DecisionContainerKind;
  /** Singular noun: "Investment" / "Acquisition" / "Strategic Decision". */
  label: string;
  /** Plural for list views. */
  pluralLabel: string;
  /** One-line description for the kind picker on /containers/new. */
  description: string;
  /** Lifecycle stages in canonical order. */
  stages: ReadonlyArray<ContainerStage>;
  /** Stage id new containers default to. */
  defaultStageId: string;
  /** Stage id where R²F audit fires hardest (the committee gate). */
  committeeStageId: string;
  /** UI label for the committee gate ("IC Review" / "Board Review" / etc.). */
  committeeLabel: string;
  /** Required document types before the committee-readiness gate passes. */
  requiredDocsForCommittee: ReadonlyArray<string>;
  /** Most central document type for this mode. */
  primaryDocType: string;
  /** Outcome capture shape (mode-specific metric fields). */
  outcomeShape: ContainerOutcomeShape;
}

// Outcome shape names — extended from 3 to 5 with the real-estate
// `dev_yield` shape (Adaptation #2, 2026-05-24) and the fund-launch
// `fund_realisation` shape (Adaptation #3, 2026-05-24). Note: kept
// inline in ContainerOutcomeShape.shape's union above — the shape
// names are downstream Brier-scoring / DPR consumers' keys.

// ─── Mode definitions ────────────────────────────────────────────────────────

const INVESTMENT_MODE: ContainerMode = {
  kind: 'investment',
  label: 'Investment',
  pluralLabel: 'Investments',
  description:
    'Capital allocation into a portfolio company — VC seed/Series, growth equity, late-stage, secondary.',
  stages: [
    {
      id: 'sourcing',
      label: 'Sourcing',
      eyebrow: '01',
      description: 'Inbound or outbound prospect identified; initial pitch deck reviewed.',
      phase: 'pre_committee',
      expectedDocTypes: ['pitch_deck', 'memo'],
      likelyPatternLabels: ['The Optimism Trap', 'The Recency Spiral'],
    },
    {
      id: 'diligence',
      label: 'Diligence',
      eyebrow: '02',
      description: 'Founder calls, market sizing, reference checks, financial review, legal scan.',
      phase: 'pre_committee',
      expectedDocTypes: ['ic_memo', 'pitch_deck', 'model', 'due_diligence'],
      likelyPatternLabels: ['The Echo Chamber', 'The Blind Sprint', 'The Optimism Trap'],
    },
    {
      id: 'ic_review',
      label: 'IC Review',
      eyebrow: '03',
      description:
        'Investment committee reviews the memo and votes — the audit moment R²F fires hardest on.',
      phase: 'committee_gate',
      expectedDocTypes: ['ic_memo'],
      likelyPatternLabels: [
        'The Yes Committee',
        'The Echo Chamber',
        'The Optimism Trap',
        "The Winner's Curse",
      ],
    },
    {
      id: 'term_sheet',
      label: 'Term Sheet',
      eyebrow: '04',
      description: 'Term sheet issued and negotiated; due diligence confirmatory work.',
      phase: 'post_committee',
      expectedDocTypes: ['term_sheet'],
      likelyPatternLabels: ['The Sunk Ship', 'The Deadline Panic'],
    },
    {
      id: 'closed',
      label: 'Closed',
      eyebrow: '05',
      description: 'Wire sent; investment is live in the portfolio.',
      phase: 'post_committee',
      expectedDocTypes: ['term_sheet'],
      likelyPatternLabels: [],
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      eyebrow: '06',
      description:
        'Active portfolio company — board meetings, follow-on consideration, calibration.',
      phase: 'post_committee',
      expectedDocTypes: ['lp_report', 'memo'],
      likelyPatternLabels: ['The Doubling Down', 'The Golden Child', 'The Sunk Ship'],
    },
    {
      id: 'exited',
      label: 'Exited',
      eyebrow: '07',
      description: 'Position realised — IPO, trade sale, secondary, or write-off.',
      phase: 'post_committee',
      expectedDocTypes: [],
      likelyPatternLabels: [],
    },
  ],
  defaultStageId: 'sourcing',
  committeeStageId: 'ic_review',
  committeeLabel: 'IC Review',
  requiredDocsForCommittee: ['ic_memo', 'pitch_deck'],
  primaryDocType: 'ic_memo',
  outcomeShape: {
    shape: 'irr_moic',
    primaryMetricLabel: 'MOIC',
    fields: [
      { key: 'irr', label: 'IRR', type: 'percent' },
      { key: 'moic', label: 'MOIC (multiple on invested capital)', type: 'number', primary: true },
      {
        key: 'exit_type',
        label: 'Exit type',
        type: 'enum',
        options: ['ipo', 'trade_sale', 'secondary', 'write_off', 'partial_exit', 'still_held'],
      },
      { key: 'exit_value', label: 'Exit value', type: 'currency' },
      { key: 'hold_period_months', label: 'Hold period (months)', type: 'months' },
      { key: 'notes', label: 'What worked / what missed', type: 'text' },
    ],
  },
};

const ACQUISITION_MODE: ContainerMode = {
  kind: 'acquisition',
  label: 'Acquisition',
  pluralLabel: 'Acquisitions',
  description:
    'Corporate development buy-side — strategic acquisition, growth-equity buyout, add-on, or recapitalization.',
  stages: [
    {
      id: 'target_id',
      label: 'Target ID',
      eyebrow: '01',
      description:
        'Target identified through outbound, banker, or thesis search; initial CIM reviewed.',
      phase: 'pre_committee',
      expectedDocTypes: ['cim', 'memo'],
      likelyPatternLabels: ['The Optimism Trap', 'The Conglomerate Fallacy'],
    },
    {
      id: 'diligence',
      label: 'Diligence',
      eyebrow: '02',
      description:
        'QofE, synergy modelling, integration planning, legal + regulatory scan, technical DD.',
      phase: 'pre_committee',
      expectedDocTypes: [
        'cim',
        'qofe',
        'synergy_model',
        'integration_plan',
        'due_diligence',
        'model',
      ],
      likelyPatternLabels: [
        'The Synergy Mirage',
        "The Winner's Curse",
        'The Conglomerate Fallacy',
        'The Echo Chamber',
      ],
    },
    {
      id: 'committee_review',
      label: 'Board / IC Review',
      eyebrow: '03',
      description:
        'Board or investment committee reviews the deal memo and synergy thesis — the audit moment R²F fires hardest on.',
      phase: 'committee_gate',
      expectedDocTypes: ['ic_memo', 'cim', 'synergy_model'],
      likelyPatternLabels: [
        'The Yes Committee',
        'The Synergy Mirage',
        'The Conglomerate Fallacy',
        "The Winner's Curse",
      ],
    },
    {
      id: 'closing',
      label: 'Closing',
      eyebrow: '04',
      description: 'SPA negotiation, regulatory approvals, closing conditions satisfied.',
      phase: 'post_committee',
      expectedDocTypes: ['term_sheet', 'due_diligence'],
      likelyPatternLabels: ['The Sunk Ship', 'The Deadline Panic'],
    },
    {
      id: 'integration',
      label: 'Integration',
      eyebrow: '05',
      description:
        'Day-1 operating model, IT consolidation, cultural integration, synergy capture tracking.',
      phase: 'post_committee',
      expectedDocTypes: ['integration_plan'],
      likelyPatternLabels: ['The Sunk Ship', 'The Doubling Down'],
    },
    {
      id: 'exited',
      label: 'Exited',
      eyebrow: '06',
      description: 'Position exited — divestiture, write-down, or absorbed-and-retired.',
      phase: 'post_committee',
      expectedDocTypes: [],
      likelyPatternLabels: [],
    },
  ],
  defaultStageId: 'target_id',
  committeeStageId: 'committee_review',
  committeeLabel: 'Board / IC Review',
  requiredDocsForCommittee: ['ic_memo', 'cim', 'due_diligence'],
  primaryDocType: 'ic_memo',
  outcomeShape: {
    shape: 'synergy_realisation',
    primaryMetricLabel: 'Synergy realisation %',
    fields: [
      {
        key: 'synergy_realisation_pct',
        label: 'Synergy realisation (% of projected)',
        type: 'percent',
        primary: true,
      },
      { key: 'integration_milestones_hit_pct', label: 'Day-1 milestones hit (%)', type: 'percent' },
      { key: 'talent_retention_pct', label: 'Key-talent retention (% at 12mo)', type: 'percent' },
      {
        key: 'verdict',
        label: 'Verdict',
        type: 'enum',
        options: ['value_created', 'value_neutral', 'value_destroyed', 'too_early_to_tell'],
      },
      { key: 'exit_value', label: 'Realised exit value (if divested)', type: 'currency' },
      { key: 'notes', label: 'What worked / what missed', type: 'text' },
    ],
  },
};

const STRATEGIC_MODE: ContainerMode = {
  kind: 'strategic',
  label: 'Strategic Decision',
  pluralLabel: 'Strategic Decisions',
  description:
    'High-stakes non-investment decision — market entry, product bet, restructure, partnership, exit framing.',
  stages: [
    {
      id: 'drafting',
      label: 'Drafting',
      eyebrow: '01',
      description: 'Decision frame defined; supporting memos and analysis being assembled.',
      phase: 'pre_committee',
      expectedDocTypes: ['memo'],
      likelyPatternLabels: ['The Optimism Trap', 'The Echo Chamber'],
    },
    {
      id: 'under_review',
      label: 'Under Review',
      eyebrow: '02',
      description:
        'Committee or steering group reviewing the recommendation — the audit moment R²F fires hardest on.',
      phase: 'committee_gate',
      expectedDocTypes: ['memo', 'deck'],
      likelyPatternLabels: [
        'The Yes Committee',
        'The Echo Chamber',
        'The Status Quo Lock',
        'The Optimism Trap',
      ],
    },
    {
      id: 'decided',
      label: 'Decided',
      eyebrow: '03',
      description: 'Verdict recorded. Execution begins.',
      phase: 'post_committee',
      expectedDocTypes: [],
      likelyPatternLabels: [],
    },
    {
      id: 'executing',
      label: 'Executing',
      eyebrow: '04',
      description: 'Decision being implemented; outcome forming.',
      phase: 'post_committee',
      expectedDocTypes: ['memo'],
      likelyPatternLabels: ['The Sunk Ship', 'The Doubling Down'],
    },
    {
      id: 'outcome_logged',
      label: 'Outcome logged',
      eyebrow: '05',
      description: 'Post-decision outcome captured; lessons recorded for calibration.',
      phase: 'post_committee',
      expectedDocTypes: [],
      likelyPatternLabels: [],
    },
  ],
  defaultStageId: 'drafting',
  committeeStageId: 'under_review',
  committeeLabel: 'Decision Committee',
  requiredDocsForCommittee: ['memo'],
  primaryDocType: 'memo',
  outcomeShape: {
    shape: 'forecast_hit_rate',
    primaryMetricLabel: 'Forecast hit-rate',
    fields: [
      {
        key: 'forecast_hit',
        label: 'Did the forecast hold?',
        type: 'enum',
        options: ['yes', 'partial', 'no', 'too_early'],
        primary: true,
      },
      { key: 'realised_value', label: 'Realised value (if quantifiable)', type: 'currency' },
      { key: 'time_to_outcome_months', label: 'Time to outcome (months)', type: 'months' },
      { key: 'lessons_learned', label: 'Lessons learned', type: 'text' },
    ],
  },
};

const REAL_ESTATE_DEVELOPMENT_MODE: ContainerMode = {
  kind: 'real_estate_development',
  label: 'Real-Estate Development',
  pluralLabel: 'Real-Estate Developments',
  description:
    'Ground-up or major-reposition real-estate project — site acquisition through stabilization, equity + debt structured around a project IRR + cost-on-completion target.',
  stages: [
    {
      id: 'site_acquisition',
      label: 'Site acquisition',
      eyebrow: '01',
      description:
        'Site or parcel identified; LOI / option-to-purchase negotiated; initial market study + zoning scan.',
      phase: 'pre_committee',
      expectedDocTypes: ['site_analysis', 'memo'],
      likelyPatternLabels: ['The Optimism Trap', 'The Recency Spiral'],
    },
    {
      id: 'entitlement',
      label: 'Entitlement',
      eyebrow: '02',
      description:
        'Zoning approval, planning permission, environmental review, community engagement, design approvals.',
      phase: 'pre_committee',
      expectedDocTypes: ['regulatory_checklist', 'site_analysis', 'memo'],
      likelyPatternLabels: ['The Status Quo Lock', 'The Blind Sprint', 'The Optimism Trap'],
    },
    {
      id: 'financing',
      label: 'Financing close',
      eyebrow: '03',
      description:
        'Investment committee approves the project — construction financing committed, equity raised, pro forma signed off. The audit moment R²F fires hardest on.',
      phase: 'committee_gate',
      expectedDocTypes: ['financial_pro_forma', 'ic_memo', 'appraisal'],
      likelyPatternLabels: [
        'The Yes Committee',
        'The Echo Chamber',
        'The Optimism Trap',
        "The Winner's Curse",
      ],
    },
    {
      id: 'construction',
      label: 'Construction',
      eyebrow: '04',
      description:
        'Active construction — site work, structural, MEP, fit-out; contractor management + budget tracking.',
      phase: 'post_committee',
      expectedDocTypes: ['contractor_selection', 'memo'],
      likelyPatternLabels: ['The Sunk Ship', 'The Doubling Down', 'The Deadline Panic'],
    },
    {
      id: 'leasing',
      label: 'Leasing',
      eyebrow: '05',
      description:
        'Pre-leasing, marketing, lease execution, tenant fit-out toward stabilized occupancy.',
      phase: 'post_committee',
      expectedDocTypes: ['memo'],
      likelyPatternLabels: ['The Optimism Trap', 'The Recency Spiral'],
    },
    {
      id: 'stabilization',
      label: 'Stabilization',
      eyebrow: '06',
      description:
        'Full occupancy reached; stabilized NOI; refinancing or hold/sell decision window.',
      phase: 'post_committee',
      expectedDocTypes: ['memo'],
      likelyPatternLabels: ['The Doubling Down', 'The Sunk Ship'],
    },
  ],
  defaultStageId: 'site_acquisition',
  committeeStageId: 'financing',
  committeeLabel: 'Investment Committee · Financing Close',
  requiredDocsForCommittee: ['site_analysis', 'financial_pro_forma', 'regulatory_checklist'],
  primaryDocType: 'financial_pro_forma',
  outcomeShape: {
    shape: 'dev_yield',
    primaryMetricLabel: 'Realised project IRR',
    fields: [
      {
        key: 'realised_irr',
        label: 'Realised IRR (project-level)',
        type: 'percent',
        primary: true,
      },
      { key: 'equity_multiple', label: 'Equity multiple', type: 'number' },
      {
        key: 'cost_overrun_pct',
        label: 'Cost overrun (% vs financing-close budget)',
        type: 'percent',
      },
      {
        key: 'schedule_overrun_months',
        label: 'Schedule overrun (months vs financing-close plan)',
        type: 'months',
      },
      { key: 'stabilized_noi', label: 'Stabilized NOI', type: 'currency' },
      {
        key: 'months_to_stabilization',
        label: 'Months from financing close to stabilization',
        type: 'months',
      },
      {
        key: 'verdict',
        label: 'Verdict',
        type: 'enum',
        options: ['value_created', 'value_neutral', 'value_destroyed', 'too_early_to_tell'],
      },
      { key: 'notes', label: 'What worked / what missed', type: 'text' },
    ],
  },
};

const FUND_LAUNCH_MODE: ContainerMode = {
  kind: 'fund_launch',
  label: 'Fund Launch',
  pluralLabel: 'Fund Launches',
  description:
    'Launching a new fund vehicle — thesis development through GTM, with anchor LP commitments at the committee gate.',
  stages: [
    {
      id: 'thesis_development',
      label: 'Thesis development',
      eyebrow: '01',
      description:
        'Investment thesis defined: target sector, geography, vintage, vehicle type, return target. Founding GP team forming.',
      phase: 'pre_committee',
      expectedDocTypes: ['thesis_memo', 'memo'],
      likelyPatternLabels: ['The Optimism Trap', 'The Echo Chamber', 'The Recency Spiral'],
    },
    {
      id: 'target_market_sizing',
      label: 'Target market sizing',
      eyebrow: '02',
      description:
        'TAM/SAM/SOM modelled; target LP universe defined; competitive fund landscape mapped.',
      phase: 'pre_committee',
      expectedDocTypes: ['thesis_memo', 'fund_prospectus', 'memo'],
      likelyPatternLabels: ['The Optimism Trap', 'The Conglomerate Fallacy', 'The Recency Spiral'],
    },
    {
      id: 'fee_structure',
      label: 'Fee structure',
      eyebrow: '03',
      description:
        'GP economics finalised: management fee, carry, hurdle rate, GP commit. Promote + waterfall mechanics defined.',
      phase: 'pre_committee',
      expectedDocTypes: ['fund_prospectus', 'memo'],
      likelyPatternLabels: ['The Anchoring Trap', 'The Echo Chamber'],
    },
    {
      id: 'anchor_lp_commitments',
      label: 'Anchor LP commitments',
      eyebrow: '04',
      description:
        'First-close anchor LP commitments — the audit moment R²F fires hardest on. Each anchor LP commit validates the fund thesis under real procurement scrutiny.',
      phase: 'committee_gate',
      expectedDocTypes: ['lp_ask_deck', 'fund_prospectus', 'thesis_memo'],
      likelyPatternLabels: [
        'The Yes Committee',
        'The Echo Chamber',
        'The Optimism Trap',
        "The Winner's Curse",
      ],
    },
    {
      id: 'regulatory_filing',
      label: 'Regulatory filing',
      eyebrow: '05',
      description:
        'Regulatory submissions filed (SEC Form ADV, AIFMD, fund-domicile-specific). Legal structure operational.',
      phase: 'post_committee',
      expectedDocTypes: ['regulatory_filing'],
      likelyPatternLabels: ['The Sunk Ship', 'The Deadline Panic'],
    },
    {
      id: 'go_to_market',
      label: 'Go to market',
      eyebrow: '06',
      description:
        'Fund operational — open to outside LP commitments; deal-sourcing engine running toward final close.',
      phase: 'post_committee',
      expectedDocTypes: ['memo'],
      likelyPatternLabels: ['The Doubling Down', 'The Optimism Trap'],
    },
  ],
  defaultStageId: 'thesis_development',
  committeeStageId: 'anchor_lp_commitments',
  committeeLabel: 'Anchor LP Commitment',
  requiredDocsForCommittee: ['thesis_memo', 'fund_prospectus', 'lp_ask_deck'],
  primaryDocType: 'thesis_memo',
  outcomeShape: {
    shape: 'fund_realisation',
    primaryMetricLabel: 'Realised AUM vs target',
    fields: [
      {
        key: 'realised_aum_pct',
        label: 'Realised AUM (% of target at final close)',
        type: 'percent',
        primary: true,
      },
      {
        key: 'final_close_months',
        label: 'Months from first close to final close',
        type: 'months',
      },
      { key: 'anchor_lp_count', label: 'Anchor LP count (at first close)', type: 'number' },
      { key: 'total_lp_count', label: 'Total LP count (at final close)', type: 'number' },
      { key: 'realised_fund_irr', label: 'Realised fund IRR (long-horizon)', type: 'percent' },
      { key: 'realised_dpi', label: 'DPI (distributions to paid-in)', type: 'number' },
      { key: 'realised_tvpi', label: 'TVPI (total value to paid-in)', type: 'number' },
      {
        key: 'verdict',
        label: 'Verdict',
        type: 'enum',
        options: ['value_created', 'value_neutral', 'value_destroyed', 'too_early_to_tell'],
      },
      { key: 'notes', label: 'What worked / what missed', type: 'text' },
    ],
  },
};

export const CONTAINER_MODES: Record<DecisionContainerKind, ContainerMode> = {
  investment: INVESTMENT_MODE,
  acquisition: ACQUISITION_MODE,
  strategic: STRATEGIC_MODE,
  real_estate_development: REAL_ESTATE_DEVELOPMENT_MODE,
  fund_launch: FUND_LAUNCH_MODE,
};

export const CONTAINER_KINDS: ReadonlyArray<DecisionContainerKind> = [
  'investment',
  'acquisition',
  'strategic',
  'real_estate_development',
  'fund_launch',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the container mode definition. Strict — throws on unknown
 * kind so callers can't silently pass through bad data.
 */
export function getContainerMode(kind: DecisionContainerKind): ContainerMode {
  const mode = CONTAINER_MODES[kind];
  if (!mode) {
    throw new Error(`Unknown DecisionContainer kind: ${kind}`);
  }
  return mode;
}

/**
 * Returns the stage definition for a kind+stageId pair, or undefined
 * when the stageId is unknown for that kind. Caller decides whether
 * to fail or fall back to the default stage.
 */
export function getContainerStage(
  kind: DecisionContainerKind,
  stageId: string
): ContainerStage | undefined {
  return getContainerMode(kind).stages.find(s => s.id === stageId);
}

/**
 * Returns true when the document type is in the required-docs set for
 * the committee gate. Used by CommitteeReadinessGate.
 */
export function isRequiredCommitteeDoc(
  kind: DecisionContainerKind,
  documentType: string | null | undefined
): boolean {
  if (!documentType) return false;
  return getContainerMode(kind).requiredDocsForCommittee.includes(documentType);
}

/**
 * Defensive lookup for INVESTMENT_DOCUMENT_TYPES + the local memo / deck
 * / model / other expansions. Used by validators.
 */
const VALID_DOC_TYPES = new Set<string>([
  ...INVESTMENT_DOCUMENT_TYPES,
  'memo',
  'deck',
  'model',
  'other',
]);

export function isKnownContainerDocType(docType: string): boolean {
  return VALID_DOC_TYPES.has(docType);
}

const PHASE_ORDER: Record<ContainerLifecyclePhase, number> = {
  pre_committee: 0,
  committee_gate: 1,
  post_committee: 2,
};

export interface StageTransitionInput {
  kind: DecisionContainerKind;
  /** Current stage id (may be unknown on legacy rows — leniently handled). */
  fromStageId: string;
  /** Requested next stage id. */
  toStageId: string;
  /** documentType values of the docs currently attached to the container. */
  attachedDocTypes: ReadonlyArray<string>;
}

export interface StageTransitionResult {
  allowed: boolean;
  /** Human, procurement-grade reason when blocked — surfaced verbatim in
   *  the API 400 and the kanban guidance toast. */
  reason?: string;
}

/**
 * V5 — rigid stage-gated decision schema (ship 2026-05-16). The single
 * source of truth for whether a stage move is legal. Pure + deterministic
 * so it is unit-tested AND shared verbatim between the PATCH route
 * (server enforcement) and the kanban (client guidance) — never two
 * implementations that can drift.
 *
 * Rigid, but not broken:
 *   - The committee-gate doc requirement is ENFORCED: a container cannot
 *     enter the committee-gate stage (or any post-committee stage)
 *     unless every `requiredDocsForCommittee` type is attached. This
 *     promotes CommitteeReadinessGate's (previously advisory) gate #1
 *     into a hard gate — you cannot take an under-documented decision to
 *     committee.
 *   - The committee gate cannot be SKIPPED: a pre-committee → post-
 *     committee jump is blocked even when docs are present; the decision
 *     must pass through the committee stage.
 *   - Backward moves (revision kickback, e.g. committee → diligence) and
 *     same-stage no-ops stay ALLOWED — rigidity must not block sending a
 *     decision back for more work.
 */
export function validateStageTransition(input: StageTransitionInput): StageTransitionResult {
  const { kind, fromStageId, toStageId, attachedDocTypes } = input;
  const mode = getContainerMode(kind);

  const toStage = mode.stages.find(s => s.id === toStageId);
  if (!toStage) {
    return {
      allowed: false,
      reason: `"${toStageId}" is not a valid stage for a ${mode.label.toLowerCase()}.`,
    };
  }

  // No-op move is always fine.
  if (fromStageId === toStageId) return { allowed: true };

  const fromStage = mode.stages.find(s => s.id === fromStageId);

  // Committee-gate doc requirement: entering the committee stage OR any
  // post-committee stage requires the full required-doc set.
  if (toStage.phase === 'committee_gate' || toStage.phase === 'post_committee') {
    const attached = new Set(attachedDocTypes);
    const missing = mode.requiredDocsForCommittee.filter(d => !attached.has(d));
    if (missing.length > 0) {
      return {
        allowed: false,
        reason: `Cannot move to ${toStage.label} — ${mode.committeeLabel} requires ${missing.join(', ')} attached first.`,
      };
    }
  }

  // The committee gate cannot be skipped (even with docs present).
  if (fromStage && fromStage.phase === 'pre_committee' && toStage.phase === 'post_committee') {
    return {
      allowed: false,
      reason: `Cannot skip ${mode.committeeLabel} — move through the committee stage before ${toStage.label}.`,
    };
  }

  return { allowed: true };
}

/**
 * Convenience: the canonical next stage in the lifecycle (the stage one
 * position forward in the ordered list). Kanban uses this to highlight
 * the recommended forward move. Returns undefined at the terminal stage.
 */
export function getNextContainerStage(
  kind: DecisionContainerKind,
  stageId: string
): ContainerStage | undefined {
  const stages = getContainerMode(kind).stages;
  const idx = stages.findIndex(s => s.id === stageId);
  if (idx < 0 || idx >= stages.length - 1) return undefined;
  return stages[idx + 1];
}

export { PHASE_ORDER };
