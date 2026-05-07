/**
 * Fractionation of Expertise — R²F paper-application #1 (locked
 * 2026-05-07, Tier-1 ship completing the 10-paper sprint to 8 of 10).
 *
 * The 2009 Kahneman & Klein paper "Conditions for Intuitive Expertise:
 * A Failure to Disagree" reaches a finding that the platform's existing
 * Feedback Adequacy detector (paper-app #6) DOES NOT capture: an expert's
 * validity is not uniform across their domain. A clinical psychologist
 * is high-validity on short-term mood prediction and zero-validity on
 * long-term life outcomes. A fund partner can be calibrated on Series A
 * SaaS but completely uncalibrated on emerging-market consumer rollups.
 * Same person, same job title, dramatically different track record per
 * sub-domain.
 *
 * The 2009 paper calls this "the fractionation of expertise" — and the
 * actionable consequence is that "based on my experience" carries
 * different weight depending on which sub-domain the experience covers.
 *
 * The Feedback Adequacy detector (#6) computes one verdict per author
 * across all decisions they have closed. This module computes the
 * SUB-DOMAIN-SPECIFIC verdict — the closed-outcome track record FOR THE
 * DECISION CLASS THIS MEMO BELONGS TO — and contrasts it with the
 * author's track record on OTHER classes.
 *
 * The procurement-grade output answers a question Margaret-class CSO and
 * Adaeze-class fund partner both said the existing Feedback Adequacy
 * verdict left ambiguous: "your feedback is sparse — sparse FOR WHICH
 * decision class?" Now the answer is named explicitly.
 *
 * Verdict bands:
 *
 *   class_calibrated         — adequate this-class outcomes
 *                              (≥10 in 18 months). Per Kahneman & Klein
 *                              2009, this-class experience IS calibrated;
 *                              the memo's experience claims carry weight.
 *
 *   broadly_calibrated       — adequate aggregate outcomes BUT the
 *                              majority sit OUTSIDE the current decision
 *                              class. The author has a track record, but
 *                              not on this kind of decision.
 *
 *   fractionated_uncalibrated — sparse / cold-start on THIS class
 *                              despite adequate or sparse signal on
 *                              ANOTHER class. The classic Kahneman-Klein
 *                              fractionation pattern: senior expert,
 *                              wrong sub-domain.
 *
 *   broadly_cold_start       — sparse / cold-start across all classes.
 *                              Nothing to draw on; treat all experience
 *                              claims as cold-start. Equivalent to
 *                              feedback-adequacy.cold_start.
 *
 *   cannot_assess            — schema-drift fallback. Honest, never
 *                              fabricated.
 *
 * Pure function — wraps a single Prisma query. Deterministic for the
 * same input. Fault-tolerant via the same try/catch posture as
 * feedback-adequacy.ts.
 *
 * Wires through three surfaces (mirroring the established pattern):
 *   (a) /api/analysis/[id]/insights — extends AnalysisInsightsResponse
 *       with `fractionationOfExpertise` so the document-detail UI can
 *       render it as a 5th SignalBlock alongside Validity / Outside View
 *       / Author Calibration / Confidence Calibration.
 *   (b) DPR cover R²F strip set — renders as a §4.7 strip below
 *       Confidence Calibration.
 *   (c) PaperApplicationsCard — surfaces the verdict on the live audit
 *       page with the same band as the DPR cover (no drift).
 *
 * Locked: 2026-05-07.
 */

import type { PrismaClient } from '@prisma/client';
import type { FeedbackAdequacyVerdict } from './feedback-adequacy';

const log = (...args: unknown[]) => {
  if (process.env.DEBUG_FRACTIONATION) {
    console.warn('[fractionation-of-expertise]', ...args);
  }
};

/** Decision class taxonomy — derived from the platform's documentType
 *  enum + industry hints. Six classes cover the Phase 1 wedge personas'
 *  decision space cleanly (M&A heads, fund GPs, fractional CSOs,
 *  PE-backed founders). When new documentTypes land, extend the
 *  DOC_TYPE_TO_CLASS map below. */
export type DecisionClass =
  | 'ma_integration' // M&A / IC memo / CIM / due diligence
  | 'capital_deployment' // VC / pitch deck / term sheet / fund deployment
  | 'market_entry' // geographic / sector / new product launch
  | 'long_horizon_strategy' // multi-year strategic plans / macro forecasts
  | 'operations' // budget / cost / hiring / vendor / ops review / incident
  | 'unknown'; // fallback when documentType doesn't map

const DOC_TYPE_TO_CLASS: Record<string, DecisionClass> = {
  ic_memo: 'ma_integration',
  cim: 'ma_integration',
  due_diligence: 'ma_integration',
  pitch_deck: 'capital_deployment',
  term_sheet: 'capital_deployment',
  lp_report: 'capital_deployment',
  market_entry: 'market_entry',
  multi_year_strategy: 'long_horizon_strategy',
  long_horizon_strategy: 'long_horizon_strategy',
  macro_forecast: 'long_horizon_strategy',
  budget_review: 'operations',
  hiring_decision: 'operations',
  vendor_review: 'operations',
  ops_review: 'operations',
  incident_response: 'operations',
};

export type FractionationVerdict =
  | 'class_calibrated'
  | 'broadly_calibrated'
  | 'fractionated_uncalibrated'
  | 'broadly_cold_start'
  | 'cannot_assess';

export interface FractionationClassRow {
  decisionClass: DecisionClass;
  outcomes: number;
  recentOutcomes: number;
  verdict: FeedbackAdequacyVerdict;
}

export interface FractionationOfExpertise {
  verdict: FractionationVerdict;
  /** The decision class detected for THIS memo. */
  detectedClass: DecisionClass;
  /** Outcomes the user has closed within this-class in past 18 months. */
  thisClassRecentOutcomes: number;
  /** Total this-class outcomes (lifetime). */
  thisClassTotalOutcomes: number;
  /** Per-class breakdown of the user's outcome history. Surfaces in the
   *  DPR appendix + PaperApplicationsCard tooltip so a procurement reader
   *  can see the full pattern. */
  classBreakdown: FractionationClassRow[];
  /** The strongest other-class verdict (most outcomes), used when the
   *  detector wants to surface "but you have a track record on X" copy. */
  strongestOtherClass: FractionationClassRow | null;
  /** Procurement-grade single-sentence note. */
  note: string;
}

const RECENCY_WINDOW_DAYS = 18 * 30;
const ADEQUATE_FLOOR = 10;
const SPARSE_FLOOR = 3;

/** Map a documentType string onto a DecisionClass. Conservative fallback:
 *  unknown documentTypes return 'unknown' rather than guessing. */
export function classifyDecisionClass(documentType: string | null | undefined): DecisionClass {
  if (!documentType) return 'unknown';
  const normalized = documentType.toLowerCase().trim();
  return DOC_TYPE_TO_CLASS[normalized] ?? 'unknown';
}

/** Compute the fractionation verdict.
 *
 *  Algorithm:
 *    1. Pull every closed outcome on the user's analyses (bounded 200,
 *       same as feedback-adequacy).
 *    2. Group by decision class via documentType → DecisionClass.
 *    3. Compute per-class verdict using the same adequacy floors as
 *       feedback-adequacy.ts (10 = adequate, 3 = sparse, <3 = cold).
 *    4. Compare this-class verdict against other-class verdicts to
 *       produce the fractionation band.
 *
 *  Failure-mode posture: same try/catch + 'unknown' fallback as
 *  feedback-adequacy.ts. Never crashes the DPR path.
 */
export async function getFractionationOfExpertise(
  prismaClient: PrismaClient,
  userId: string,
  options: {
    documentType: string | null;
    recencyWindowDays?: number;
  }
): Promise<FractionationOfExpertise> {
  const recencyDays = options.recencyWindowDays ?? RECENCY_WINDOW_DAYS;
  const recencyCutoff = new Date(Date.now() - recencyDays * 24 * 60 * 60 * 1000);
  const detectedClass = classifyDecisionClass(options.documentType);

  let outcomes: Array<{
    reportedAt: Date;
    documentType: string | null;
  }> = [];

  try {
    // @schema-drift-tolerant — same posture as getFeedbackAdequacy.
    const rows = await prismaClient.decisionOutcome.findMany({
      where: {
        analysis: {
          document: { userId },
        },
      },
      select: {
        reportedAt: true,
        analysis: {
          select: {
            document: {
              select: {
                documentType: true,
              },
            },
          },
        },
      },
      orderBy: { reportedAt: 'desc' },
      take: 200,
    });

    outcomes = rows.map(r => ({
      reportedAt: r.reportedAt,
      documentType: r.analysis?.document?.documentType ?? null,
    }));
  } catch (err) {
    log('lookup failed', err instanceof Error ? err.message : err);
    return {
      verdict: 'cannot_assess',
      detectedClass,
      thisClassRecentOutcomes: 0,
      thisClassTotalOutcomes: 0,
      classBreakdown: [],
      strongestOtherClass: null,
      note: 'Fractionation of expertise cannot be assessed — outcome lookup unavailable on this audit. Per Kahneman & Klein (2009), expert intuition is sub-domain-specific; without a per-class track record we cannot tell whether the author has the relevant calibration for this decision class. Treat experience-based claims with cold-start scrutiny.',
    };
  }

  // Group outcomes by decision class
  const classCounts = new Map<DecisionClass, { total: number; recent: number }>();
  for (const o of outcomes) {
    const cls = classifyDecisionClass(o.documentType);
    const existing = classCounts.get(cls) ?? { total: 0, recent: 0 };
    existing.total += 1;
    if (o.reportedAt >= recencyCutoff) existing.recent += 1;
    classCounts.set(cls, existing);
  }

  // Build class breakdown rows
  const classBreakdown: FractionationClassRow[] = [];
  for (const [decisionClass, counts] of classCounts.entries()) {
    classBreakdown.push({
      decisionClass,
      outcomes: counts.total,
      recentOutcomes: counts.recent,
      verdict:
        counts.recent >= ADEQUATE_FLOOR
          ? 'adequate'
          : counts.recent >= SPARSE_FLOOR
            ? 'sparse'
            : 'cold_start',
    });
  }
  // Sort by outcome count descending so the dominant class surfaces first
  classBreakdown.sort((a, b) => b.outcomes - a.outcomes);

  const thisClassRow =
    classBreakdown.find(r => r.decisionClass === detectedClass) ??
    ({
      decisionClass: detectedClass,
      outcomes: 0,
      recentOutcomes: 0,
      verdict: 'cold_start' as FeedbackAdequacyVerdict,
    } satisfies FractionationClassRow);

  const otherClasses = classBreakdown.filter(r => r.decisionClass !== detectedClass);
  const strongestOtherClass =
    otherClasses.length > 0 && otherClasses[0].outcomes > 0 ? otherClasses[0] : null;

  // Verdict band selection
  const totalRecent = classBreakdown.reduce((sum, r) => sum + r.recentOutcomes, 0);
  let verdict: FractionationVerdict;
  if (totalRecent < SPARSE_FLOOR) {
    verdict = 'broadly_cold_start';
  } else if (thisClassRow.verdict === 'adequate') {
    verdict = 'class_calibrated';
  } else if (
    thisClassRow.verdict === 'cold_start' &&
    strongestOtherClass &&
    strongestOtherClass.verdict !== 'cold_start'
  ) {
    verdict = 'fractionated_uncalibrated';
  } else if (
    thisClassRow.verdict === 'sparse' &&
    strongestOtherClass &&
    strongestOtherClass.verdict === 'adequate'
  ) {
    verdict = 'fractionated_uncalibrated';
  } else if (totalRecent >= ADEQUATE_FLOOR) {
    verdict = 'broadly_calibrated';
  } else {
    verdict = 'broadly_cold_start';
  }

  return {
    verdict,
    detectedClass,
    thisClassRecentOutcomes: thisClassRow.recentOutcomes,
    thisClassTotalOutcomes: thisClassRow.outcomes,
    classBreakdown,
    strongestOtherClass,
    note: buildNote(verdict, detectedClass, thisClassRow, strongestOtherClass),
  };
}

function buildNote(
  verdict: FractionationVerdict,
  detectedClass: DecisionClass,
  thisClass: FractionationClassRow,
  strongestOther: FractionationClassRow | null
): string {
  const classLabel = decisionClassLabel(detectedClass);
  switch (verdict) {
    case 'class_calibrated':
      return `Author has ${thisClass.recentOutcomes} closed-loop outcomes on ${classLabel} decisions in the past 18 months — adequate calibration FOR THIS CLASS. Per Kahneman & Klein (2009), this-class experience is the only experience that carries weight; the memo's experience claims can be trusted at face value within this sub-domain.`;
    case 'broadly_calibrated': {
      const otherClause = strongestOther
        ? ` Strongest track record sits on ${decisionClassLabel(strongestOther.decisionClass)} (${strongestOther.outcomes} outcomes).`
        : '';
      return `Author has aggregate closed-loop outcomes but only ${thisClass.recentOutcomes} on ${classLabel} specifically. Per Kahneman & Klein (2009), expert intuition is sub-domain-specific; experience on adjacent classes does NOT transfer automatically.${otherClause} Treat ${classLabel} experience claims with the scrutiny of a fresh learner.`;
    }
    case 'fractionated_uncalibrated': {
      const otherClause = strongestOther
        ? `${strongestOther.outcomes} closed-loop outcomes on ${decisionClassLabel(strongestOther.decisionClass)} (${strongestOther.verdict})`
        : 'a track record on other classes';
      return `Fractionation pattern detected: author has ${otherClause}, but only ${thisClass.recentOutcomes} on ${classLabel} in the past 18 months. Per Kahneman & Klein (2009), this is the canonical "senior expert, wrong sub-domain" pattern — the author's confidence draws on adjacent-class experience that does NOT calibrate ${classLabel}-class judgment. Cross-check experience claims against external base rates.`;
    }
    case 'broadly_cold_start':
      return `Author has insufficient closed-loop outcomes across all decision classes (${thisClass.recentOutcomes} this-class · cold start globally). Per Kahneman & Klein (2009), expert intuition requires repeated rapid feedback; without it, "based on my experience" carries no informational weight beyond external base rates. Log past decision outcomes to begin building per-class calibration.`;
    case 'cannot_assess':
      return 'Fractionation of expertise cannot be assessed — outcome lookup unavailable.';
  }
}

/** Surface a one-word band label for the DPR strip + UI eyebrow. */
export function fractionationVerdictLabel(verdict: FractionationVerdict): string {
  switch (verdict) {
    case 'class_calibrated':
      return 'Class-calibrated';
    case 'broadly_calibrated':
      return 'Broadly calibrated';
    case 'fractionated_uncalibrated':
      return 'Fractionated · uncalibrated';
    case 'broadly_cold_start':
      return 'Broadly cold-start';
    case 'cannot_assess':
      return 'Cannot assess';
  }
}

/** Human-readable decision-class label for surfaces. */
export function decisionClassLabel(cls: DecisionClass): string {
  switch (cls) {
    case 'ma_integration':
      return 'M&A / IC';
    case 'capital_deployment':
      return 'Capital deployment';
    case 'market_entry':
      return 'Market entry';
    case 'long_horizon_strategy':
      return 'Long-horizon strategy';
    case 'operations':
      return 'Operations';
    case 'unknown':
      return 'Unclassified';
  }
}
