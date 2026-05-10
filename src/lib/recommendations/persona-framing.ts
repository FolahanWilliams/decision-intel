/**
 * Constellation Next Move — per-persona framing SSOT.
 *
 * Locked 2026-05-10 alongside the Constellation Next Move ship.
 * Source: 2026-05-10 Deep Research paper Ch 6 ("What 'Auditing
 * Reasoning' Actually Means to Each Buyer Persona"). The paper's
 * core finding: the same underlying audit signal renders as FOUR
 * STRUCTURALLY DISTINCT artefacts depending on the reader's
 * regulatory + fiduciary + institutional position.
 *
 * Per-persona framing is the operational answer. The same set of
 * recommendation categories (committee_gate_pressure / quality_gate_
 * violation / etc.) emit different output language depending on
 * useOnboardingRole. This file is the lookup map; the engine reads
 * the user's role + the category id, returns the persona-tuned
 * template.
 *
 * Each template has three variants:
 *   - tight: ≤ 80 chars for the strip
 *   - regular: 1-2 sentences for the drawer
 *   - detailed: 2-3 sentences with paper-anchored compliance vocabulary
 *               for the click-into-detail view
 *
 * Forward-looking rule: when adding a 5th persona OR a 7th category,
 * extend BOTH dimensions of this map in lockstep with the type system.
 * The Record<Role, Record<NextMoveCategoryId, ...>> shape forces
 * exhaustive coverage at compile time.
 */

import type { NextMoveCategoryId } from './next-move-categories';

/**
 * Role enum mirrors useOnboardingRole. Adding a new role requires
 * extending this map in the same commit (TypeScript catches the gap).
 */
export type RecommendationPersona = 'cso' | 'ma' | 'bizops' | 'pe_vc' | 'other';

export interface PersonaFramingTemplate {
  /// Strip-length wording with substitution slots: {name}, {tNDays},
  /// {dqi}, {grade}, {patternLabel}, {linkedCount}, {assumptionLabel}.
  tight: string;
  regular: string;
  detailed: string;
  /// Optional CTA verb override for the persona — e.g. "Resolve" for
  /// CSO, "Investigate" for an LP-facing GP. Defaults to "Open" if
  /// unset.
  ctaVerb?: string;
}

/**
 * Per-persona × per-category framing map. The detailed variant
 * deliberately uses each persona's native compliance vocabulary
 * (FCA / ISO 31000 for GC; thesis fidelity / style drift for LP;
 * sponsor mandate / synergy realization for PE-CSO; PMI retro /
 * synergy operational for corp dev).
 */
export const PERSONA_FRAMING: Record<
  RecommendationPersona,
  Record<NextMoveCategoryId, PersonaFramingTemplate>
> = {
  // ──────────────────────────────────────────────────────────────────
  // F500 / fractional CSO + audit-committee-facing strategic teams.
  // Per paper Ch 6: compliance defense framing — FCA, ISO 31000, IIA
  // Three Lines, audit-committee Q&A.
  // ──────────────────────────────────────────────────────────────────
  cso: {
    committee_gate_pressure: {
      tight: '{name} · steering committee in {tNDays}d · {patternLabel} unresolved',
      regular:
        '{name} hits steering committee in {tNDays} days with {patternLabel} unresolved. Audit-committee exposure if the memo ships in current state.',
      detailed:
        '{name} reaches the steering-committee gate in {tNDays} days. {patternLabel} fired at high severity and remains unresolved. The current memo will not satisfy ISO 31000 risk-management documentation; resolve before the gate or surface the residual risk explicitly in the memo.',
      ctaVerb: 'Resolve',
    },
    quality_gate_violation: {
      tight: '{name} · DQI {dqi} ({grade}) · {patternLabel}',
      regular:
        '{name} carries a DQI of {dqi} ({grade}) with {patternLabel} flagged. The reasoning will not survive an audit-committee Q&A in its current state.',
      detailed:
        "{name}'s composite DQI of {dqi} ({grade}) sits below the audit-defensible threshold. {patternLabel} is fired at high+ severity. Per ISO 31000 §6.4 risk-treatment guidance, document the residual risk and the team's mitigation plan before the next steering review.",
      ctaVerb: 'Strengthen',
    },
    missing_required_artefact: {
      tight: '{name} needs {patternLabel} for steering review',
      regular:
        '{name} is missing a {patternLabel} required for the steering-committee gate. Without it the chair will defer the vote.',
      detailed:
        "{name}'s file lacks a {patternLabel}, which is required for the committee_gate phase per the SSOT. The chair will defer rather than approve with incomplete documentation. Upload before the meeting or notify the committee of the gap.",
      ctaVerb: 'Upload',
    },
    outcome_closure: {
      tight: '{name} decided · log outcome to sharpen calibration',
      regular:
        '{name} was decided more than 30 days ago with no outcome logged. Closing the loop sharpens your per-org calibration vs the platform baseline.',
      detailed:
        '{name} was decided more than 30 days ago. Logging the outcome — including any intermediate proxy predictions that have resolved — updates the per-org Brier-scored profile. After 3 closed outcomes, your DQI starts calibrating to your specific decision pattern, not the generic 143-case library.',
      ctaVerb: 'Log outcome',
    },
    cross_decision_pattern: {
      tight: '{linkedCount} linked decisions share an assumption',
      regular:
        '{linkedCount} of your active strategic decisions share the assumption: "{assumptionLabel}". If that assumption falsifies, all {linkedCount} go red simultaneously.',
      detailed:
        'Cross-decision pattern detected: {linkedCount} active strategic containers all rest on the assumption "{assumptionLabel}". This is a Strategy-Stack-class fragility — a single macro shift takes down the whole sub-portfolio. Stress-test the foundational assumption before the next steering review or document the correlated risk explicitly in the audit-committee pack.',
      ctaVerb: 'Stress-test',
    },
    lineage_drift: {
      tight: '{name} depends on {assumptionLabel} · upstream resolved differently',
      regular:
        "{name}'s reasoning depends on {assumptionLabel}, which resolved differently than forecast. Re-evaluate the dependent thesis before the next gate.",
      detailed:
        "{name} carries a depends_on edge to a prior decision whose outcome diverges from the forecast that originally justified this thesis. Per audit-committee guidance, dependent decisions must be re-baselined when upstream assumptions falsify. Re-frame {name}'s memo before the next steering review.",
      ctaVerb: 'Re-evaluate',
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // Mid-market corp dev / M&A. Per paper Ch 6: operational synergy
  // retrospective framing — PMI lessons, procurement reviews of
  // seller projections, integration-plan completeness.
  // ──────────────────────────────────────────────────────────────────
  ma: {
    committee_gate_pressure: {
      tight: '{name} · IC in {tNDays}d · {patternLabel} unresolved',
      regular:
        "{name} hits IC review in {tNDays} days with {patternLabel} unresolved. The deal team can't defend the synergy thesis as currently authored.",
      detailed:
        "{name} reaches IC review in {tNDays} days. {patternLabel} fired at high severity and remains unresolved on the synergy claims. Per the BCG/McKinsey post-merger integration literature, deals that pass IC with unresolved synergy conflicts realize 30-50% of revenue synergies and 60-80% of cost synergies — already below the threshold needed to clear the deal's purchase premium.",
      ctaVerb: 'Resolve',
    },
    quality_gate_violation: {
      tight: '{name} · DQI {dqi} ({grade}) · synergy thesis weak',
      regular:
        "{name} carries a DQI of {dqi} ({grade}) with {patternLabel}. The synergy thesis won't survive QofE scrutiny.",
      detailed:
        "{name}'s composite DQI of {dqi} ({grade}) sits below the procurement-defensible threshold for an acquisition memo. {patternLabel} is the primary failure pattern. Per the canonical M&A failure literature (HP-Autonomy, Daimler-Chrysler, AOL-Time Warner anchors), deals that ship to IC with this pattern unaddressed track to the 70-90% failure tail. Strengthen the synergy thesis or kill before IC.",
      ctaVerb: 'Strengthen',
    },
    missing_required_artefact: {
      tight: '{name} needs {patternLabel} before IC',
      regular:
        '{name} is missing a {patternLabel}. The IC will defer rather than approve incomplete diligence.',
      detailed:
        "{name}'s deal file lacks a {patternLabel}, which the deal-mode SSOT marks as required for the IC gate. Per Big-4 M&A diligence-review guidance, ICs that approve without complete diligence carry materially higher post-close write-down risk. Upload before the meeting or formally request a deferral.",
      ctaVerb: 'Upload',
    },
    outcome_closure: {
      tight: '{name} closed · log integration outcome',
      regular:
        '{name} closed more than 30 days ago with no PMI outcome logged. Closing the loop tightens future synergy realization forecasts.',
      detailed:
        "{name} closed more than 30 days ago. Logging the actual integration outcome — synergy realization vs forecast, integration cost vs forecast, customer-churn vs forecast — updates your firm's per-deal Brier-scored calibration. The next deal's synergy claims become more defensible because they're anchored against your own track record, not the industry baseline.",
      ctaVerb: 'Log outcome',
    },
    cross_decision_pattern: {
      tight: '{linkedCount} active deals share an assumption',
      regular:
        '{linkedCount} of your active deals share the assumption: "{assumptionLabel}". If that assumption fails, multiple closes go red.',
      detailed:
        'Cross-deal pattern detected: {linkedCount} active acquisition containers all rest on the assumption "{assumptionLabel}". This is the platform-bolt-on contagion the paper Ch 5 flags as the highest-leverage portfolio failure mode. Per the canonical roll-up failure literature, an unaudited assumption in the platform deal infects every subsequent bolt-on. Stress-test the foundational thesis before the next IC or document the correlated portfolio risk in the LP letter.',
      ctaVerb: 'Stress-test',
    },
    lineage_drift: {
      tight: '{name} depends on {assumptionLabel} · upstream resolved differently',
      regular:
        "{name}'s synergy thesis depends on {assumptionLabel}, which resolved differently than forecast. Re-baseline before the next IC.",
      detailed:
        "{name} carries a depends_on edge to a prior decision whose outcome diverges from the forecast. Dependent acquisition theses must be re-baselined when upstream assumptions falsify — per Big-4 PMI guidance, this is the canonical cause of the integration-phase value destruction that drives the 70-90% M&A failure rate. Re-frame {name}'s synergy model before the next IC.",
      ctaVerb: 'Re-baseline',
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // PE-backed founder / bizops. Per paper Ch 6: sponsor-mandate
  // alignment framing — defensive narrative for the board, synergy
  // realization pathway, deployment-of-capital justification.
  // ──────────────────────────────────────────────────────────────────
  bizops: {
    committee_gate_pressure: {
      tight: '{name} · board in {tNDays}d · {patternLabel} unresolved',
      regular:
        '{name} hits the board in {tNDays} days with {patternLabel} unresolved. Sponsor mandate alignment requires the gap closed first.',
      detailed:
        '{name} reaches the board gate in {tNDays} days. {patternLabel} fired at high severity and remains unresolved. The sponsor mandate explicitly requires diligence completeness before board sign-off; the current memo will not satisfy that standard. Resolve before the board or formally surface the gap to the sponsor in advance.',
      ctaVerb: 'Resolve',
    },
    quality_gate_violation: {
      tight: '{name} · DQI {dqi} ({grade}) · sponsor exposure',
      regular:
        '{name} carries a DQI of {dqi} ({grade}) with {patternLabel}. Sponsor will block deployment until the thesis is strengthened.',
      detailed:
        "{name}'s composite DQI of {dqi} ({grade}) is below the sponsor mandate threshold for capital deployment approvals. {patternLabel} fired at high+ severity. Per the LPA's investment-discipline clauses, the sponsor will defer rather than approve a deployment with this pattern unresolved. Strengthen the thesis or formally request a sponsor exception.",
      ctaVerb: 'Strengthen',
    },
    missing_required_artefact: {
      tight: '{name} needs {patternLabel} for board pack',
      regular:
        '{name} is missing a {patternLabel} required for the board pack. The chair will defer rather than approve incomplete documentation.',
      detailed:
        "{name}'s strategic-decision file lacks a {patternLabel}, required for the board_gate phase per the SSOT. Boards consistently defer rather than approve with incomplete documentation per NACD guidance. Upload before the meeting or formally request the board to defer.",
      ctaVerb: 'Upload',
    },
    outcome_closure: {
      tight: '{name} decided · log outcome to refine sponsor reporting',
      regular:
        '{name} was decided more than 30 days ago with no outcome logged. Closing the loop strengthens your sponsor-facing track record.',
      detailed:
        '{name} was decided more than 30 days ago. Logging the actual outcome — including intermediate proxy predictions resolved — updates your per-decision Brier-scored profile. Sponsor LP reporting carries materially more weight when the GP can demonstrate per-decision calibration improvement quarter-over-quarter, not just terminal IRR.',
      ctaVerb: 'Log outcome',
    },
    cross_decision_pattern: {
      tight: '{linkedCount} active strategic decisions share an assumption',
      regular:
        '{linkedCount} of your active strategic decisions share the assumption: "{assumptionLabel}". A single macro shift takes them all down.',
      detailed:
        'Cross-decision pattern detected: {linkedCount} active strategic containers rest on the assumption "{assumptionLabel}". The Strategy Stack literature flags this as the highest-leverage portfolio failure mode — when the foundational assumption flips, every dependent commit goes red simultaneously. Stress-test the foundational thesis before the next board review and document the correlated risk in the next sponsor update.',
      ctaVerb: 'Stress-test',
    },
    lineage_drift: {
      tight: '{name} depends on {assumptionLabel} · upstream resolved differently',
      regular:
        "{name}'s thesis depends on {assumptionLabel}, which resolved differently than forecast. Re-baseline before the next board review.",
      detailed:
        '{name} carries a depends_on edge to a prior decision whose outcome diverges from the forecast. Dependent strategic theses must be re-baselined when upstream assumptions falsify. Sponsor will expect the re-frame to be surfaced proactively, not discovered post-board.',
      ctaVerb: 'Re-baseline',
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // GP / VC. Per paper Ch 6: thesis-fidelity framing — style drift
  // detection, sourcing-funnel rigor, IC consistency, LP-governance
  // alignment.
  // ──────────────────────────────────────────────────────────────────
  pe_vc: {
    committee_gate_pressure: {
      tight: '{name} · IC in {tNDays}d · {patternLabel} unresolved',
      regular:
        "{name} hits IC in {tNDays} days with {patternLabel} unresolved. The thesis won't hold under partner-meeting scrutiny.",
      detailed:
        '{name} reaches IC in {tNDays} days. {patternLabel} fired at high severity and remains unresolved on the investment thesis. LP-facing reporting requires that ICs document residual risk explicitly when patterns of this severity are present at vote — resolve before the IC or surface the residual risk in the deal memo and the LP update.',
      ctaVerb: 'Resolve',
    },
    quality_gate_violation: {
      tight: '{name} · DQI {dqi} ({grade}) · thesis weak',
      regular:
        "{name} carries a DQI of {dqi} ({grade}) with {patternLabel}. The investment thesis won't survive an LP review.",
      detailed:
        "{name}'s composite DQI of {dqi} ({grade}) is below the thesis-defensibility threshold for an LP-facing memo. {patternLabel} fired at high+ severity. Per the canonical VC failure literature (Theranos, Quibi, FTX anchors), deals that close with this pattern unresolved produce the outlier-loss tail that drives the fund to IRR-band 4. Strengthen the thesis or kill before IC.",
      ctaVerb: 'Strengthen',
    },
    missing_required_artefact: {
      tight: '{name} needs {patternLabel} before IC',
      regular:
        '{name} is missing a {patternLabel}. IC partners will defer rather than vote with incomplete diligence.',
      detailed:
        "{name}'s deal file lacks a {patternLabel} required for the IC gate. Per the LPA's diligence-completeness clauses, deals that pass IC with incomplete documentation carry materially higher LP-claim risk if the deal goes wrong. Upload before the IC or formally request a vote deferral.",
      ctaVerb: 'Upload',
    },
    outcome_closure: {
      tight: '{name} decided · log outcome to demonstrate calibration',
      regular:
        '{name} was decided more than 30 days ago with no intermediate-proxy outcomes logged. Closing the loop demonstrates calibration to LPs.',
      detailed:
        '{name} was decided more than 30 days ago. The terminal outcome is years away (5-10 yr hold), but intermediate proxy predictions you set at IC time have horizon dates passing now. Resolving them — actual integration cost vs forecast, customer-traction milestones, hire-pipeline conversion — produces a per-decision Brier-scored profile that demonstrates calibration improvement to LPs without waiting for the fund to wind up.',
      ctaVerb: 'Log outcome',
    },
    cross_decision_pattern: {
      tight: '{linkedCount} portfolio commits share an assumption',
      regular:
        '{linkedCount} of your portfolio commits share the assumption: "{assumptionLabel}". A macro shift takes them all down simultaneously.',
      detailed:
        'Thesis-cascade pattern detected: {linkedCount} active portfolio commits share the assumption "{assumptionLabel}". Per the paper Ch 5 Strategy Stack analysis, this is the highest-leverage portfolio risk because the underlying assumption is correlated across investments — a single macro shift produces simultaneous losses across the sub-portfolio. Stress-test the foundational thesis before the next IC and surface the correlated risk in the next LP letter.',
      ctaVerb: 'Stress-test',
    },
    lineage_drift: {
      tight: '{name} depends on {assumptionLabel} · upstream resolved differently',
      regular:
        "{name}'s thesis depends on {assumptionLabel}, which resolved differently than forecast. Re-baseline before the next portfolio review.",
      detailed:
        '{name} carries a depends_on edge to a prior decision whose outcome diverges from the forecast. Dependent investment theses must be re-baselined when upstream assumptions falsify. LPs will expect the re-frame surfaced in the quarterly update, not discovered later.',
      ctaVerb: 'Re-baseline',
    },
  },

  // ──────────────────────────────────────────────────────────────────
  // Other / unknown. Default-neutral framing — no procurement-grade
  // vocabulary baked in, since the user hasn't told us their role.
  // ──────────────────────────────────────────────────────────────────
  other: {
    committee_gate_pressure: {
      tight: '{name} · committee in {tNDays}d · {patternLabel} unresolved',
      regular:
        '{name} reaches committee in {tNDays} days with {patternLabel} unresolved. Resolve before the gate or surface the gap.',
      detailed:
        '{name} reaches its committee gate in {tNDays} days. {patternLabel} fired at high severity and remains unresolved. The current memo will not survive committee scrutiny in its current state.',
      ctaVerb: 'Resolve',
    },
    quality_gate_violation: {
      tight: '{name} · DQI {dqi} ({grade}) · {patternLabel}',
      regular:
        '{name} carries a DQI of {dqi} ({grade}) with {patternLabel} flagged. The reasoning needs strengthening before next review.',
      detailed:
        "{name}'s composite DQI of {dqi} ({grade}) is below the audit-defensible threshold. {patternLabel} fired at high+ severity. Strengthen the reasoning or document the residual risk before the next gate.",
      ctaVerb: 'Strengthen',
    },
    missing_required_artefact: {
      tight: '{name} needs {patternLabel}',
      regular:
        '{name} is missing a {patternLabel} required for committee review. Without it the vote will be deferred.',
      detailed:
        "{name}'s file lacks a {patternLabel} required for the committee gate. Upload before the meeting or notify the committee of the gap.",
      ctaVerb: 'Upload',
    },
    outcome_closure: {
      tight: '{name} decided · log outcome',
      regular:
        '{name} was decided more than 30 days ago with no outcome logged. Closing the loop sharpens your calibration profile.',
      detailed:
        '{name} was decided more than 30 days ago. Logging the outcome updates your per-decision calibration profile. After 3 closed outcomes, your DQI starts calibrating to your specific decision pattern.',
      ctaVerb: 'Log outcome',
    },
    cross_decision_pattern: {
      tight: '{linkedCount} linked decisions share an assumption',
      regular:
        '{linkedCount} of your active decisions share the assumption: "{assumptionLabel}". Stress-test the foundational thesis.',
      detailed:
        'Cross-decision pattern detected: {linkedCount} active containers rest on the assumption "{assumptionLabel}". A single macro shift takes them all down simultaneously. Stress-test the foundational assumption before the next review.',
      ctaVerb: 'Stress-test',
    },
    lineage_drift: {
      tight: '{name} depends on {assumptionLabel} · upstream resolved differently',
      regular:
        "{name}'s reasoning depends on {assumptionLabel}, which resolved differently than forecast. Re-evaluate before the next review.",
      detailed:
        '{name} depends on a prior decision whose outcome diverges from the forecast. Dependent decisions must be re-baselined when upstream assumptions falsify.',
      ctaVerb: 'Re-evaluate',
    },
  },
};

/**
 * Substitute template tokens with actual values. Tokens that don't
 * have a substitute fall through unchanged so empty values are visible
 * to the QA reader — never silently render with placeholders intact.
 */
export function substituteFraming(
  template: string,
  values: {
    name?: string;
    tNDays?: number;
    dqi?: number | null;
    grade?: string | null;
    patternLabel?: string;
    linkedCount?: number;
    assumptionLabel?: string;
  }
): string {
  let result = template;
  if (values.name !== undefined) result = result.replace(/\{name\}/g, values.name);
  if (values.tNDays !== undefined) result = result.replace(/\{tNDays\}/g, String(values.tNDays));
  if (values.dqi !== undefined && values.dqi !== null)
    result = result.replace(/\{dqi\}/g, Math.round(values.dqi).toString());
  if (values.grade !== undefined && values.grade !== null)
    result = result.replace(/\{grade\}/g, values.grade);
  if (values.patternLabel !== undefined)
    result = result.replace(/\{patternLabel\}/g, values.patternLabel);
  if (values.linkedCount !== undefined)
    result = result.replace(/\{linkedCount\}/g, String(values.linkedCount));
  if (values.assumptionLabel !== undefined)
    result = result.replace(/\{assumptionLabel\}/g, values.assumptionLabel);
  return result;
}
