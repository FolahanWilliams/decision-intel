/**
 * Feedback Adequacy — operationalises Kahneman & Klein's (2009) second
 * condition for trustworthy intuition.
 *
 * The 2009 paper "Conditions for Intuitive Expertise: A Failure to
 * Disagree" (American Psychologist 64(6)) reaches one of the most
 * actionable conclusions in decision research: intuitive judgments can
 * only be trusted when TWO conditions hold simultaneously.
 *
 *   1. The environment is HIGH-VALIDITY — there is a learnable, stable
 *      relationship between observable cues and decision outcomes
 *      (medicine, firefighting, chess all qualify; M&A, market entry,
 *      long-horizon strategy do not).
 *
 *   2. The decision-maker has had ADEQUATE OPPORTUNITY TO LEARN — that
 *      is, repeated exposure to outcomes, with rapid and unequivocal
 *      feedback so the cue→outcome mapping can actually be acquired.
 *      Without this, "experience" produces no expertise; the person
 *      simply has years of exposure to ambiguous feedback.
 *
 * The biasDetective + structuralAssumptions + noiseJudge pipeline already
 * audits the FIRST condition (validity-aware scoring locked 2026-04-29).
 * This module audits the SECOND. It asks, for the user submitting a
 * given memo: have they actually closed the feedback loop on enough
 * decisions of this kind that "based on my experience" carries any
 * informational weight?
 *
 * The mechanism is a quantitative lookup against the user's own
 * `DecisionOutcome` history — count, recency, mean Brier — bucketed
 * onto a four-band verdict (adequate / sparse / cold_start / unknown).
 * The verdict feeds two surfaces:
 *
 *   - Decision Provenance Record. A new "Feedback Adequacy" section on
 *     the cover page tells a procurement reader, in one sentence,
 *     whether the author of the memo has the closed-loop history their
 *     experience claims rely on.
 *
 *   - Pipeline prompt context (deferred to a follow-up wiring). When
 *     `verdict !== 'adequate'`, the biasDetective is told to treat
 *     experience-based justifications ("based on my 20 years in this
 *     sector...", "we've seen this pattern before...") with
 *     additional scrutiny — they may be illusion-of-validity in
 *     disguise.
 *
 * Cold-start posture: when a user has zero closed outcomes (the
 * default state during the first weeks of platform use), the verdict
 * is `cold_start` and the rendered note is honest: "no closed-loop
 * outcome history yet — intuition claims cannot be calibrated against
 * this user's track record." This is NOT a punishment; it is the
 * procurement-grade way to surface the gap and motivate outcome
 * logging (which is why the Outcome Gate exists).
 *
 * Locked: 2026-04-30 (paper-application sprint, item #6 of 10).
 */

import type { PrismaClient } from '@prisma/client';

const log = (...args: unknown[]) => {
  if (process.env.DEBUG_FEEDBACK_ADEQUACY) {
    // eslint-disable-next-line no-console
    console.warn('[feedback-adequacy]', ...args);
  }
};

/** Verdict bands. Tuned to the Tetlock/CIA/superforecaster anchors and
 *  the platform-baseline n=143 reference: 'adequate' is the threshold
 *  at which a user's per-domain Brier becomes statistically meaningful;
 *  'sparse' is the band where a signal exists but the variance is too
 *  high to weight intuition; 'cold_start' is the explicit "no track
 *  record" answer. 'unknown' is the schema-drift fallback. */
export type FeedbackAdequacyVerdict = 'adequate' | 'sparse' | 'cold_start' | 'unknown';

export interface FeedbackAdequacy {
  verdict: FeedbackAdequacyVerdict;
  /** Total closed outcomes on this user's analyses, ever. */
  closedOutcomes: number;
  /** Closed outcomes within the recency window (default 18 months — long
   *  enough to capture an M&A / strategy cycle but short enough that
   *  ancient feedback doesn't masquerade as current calibration). */
  recentClosedOutcomes: number;
  /** Days since the most-recent outcome was logged, or null if none. */
  daysSinceLastOutcome: number | null;
  /** Mean Brier across closed outcomes (lower = better calibrated).
   *  Null when no Brier-scored outcomes exist (a user can log an
   *  outcome without the analysis having a DQI to compare against). */
  meanBrier: number | null;
  /** Per-decision-domain match count when a domain hint is supplied —
   *  e.g., for an M&A memo, how many of the user's closed outcomes
   *  were on M&A decisions specifically. Domain filtering is best-
   *  effort string-match on Document.documentType + Document.industry;
   *  returns the raw total when no domain hint is available. */
  domainMatchCount: number | null;
  /** Domain hint that was used for filtering, if any. */
  domainHint: string | null;
  /** Single-sentence procurement-grade note. Renders verbatim in the
   *  DPR cover page and the Decision DNA preview surface. Always
   *  populated — the cold-start path produces a specific note rather
   *  than an empty string. */
  note: string;
}

/** Recency window for "recent" outcomes. 18 months covers a typical
 *  M&A IC cycle + due-diligence-to-close + first-year performance;
 *  older outcomes are still counted in the total but flagged as
 *  potentially-stale calibration. */
const RECENCY_WINDOW_DAYS = 18 * 30;

/** Adequacy bands. Tuned conservatively — 10 closed outcomes within
 *  18 months is the floor at which per-domain Brier becomes a usable
 *  signal (the platform-baseline drift test at n=143 has tight
 *  confidence; n<10 has wide error bars). 3 is the floor at which a
 *  user can claim ANY closed-loop calibration. <3 is cold-start. */
const ADEQUATE_FLOOR = 10;
const SPARSE_FLOOR = 3;

/** Fetch the user's feedback-adequacy verdict and accompanying metrics.
 *
 *  Failure-mode posture: this function is wrapped in a try/catch by
 *  every caller (DPR data assembler, prompt-context builder). Schema
 *  drift, network blips, or missing-table errors return verdict
 *  'unknown' with a transparent note rather than crashing. The DPR
 *  honesty discipline applies — a procurement reader gets "lookup
 *  failed; treat as cold start" rather than fabricated data.
 *
 *  Cost / latency: a single Prisma query against `DecisionOutcome`
 *  joined to `Analysis` and `Document`, filtered by the user. Fast
 *  enough to invoke synchronously inside the DPR assembly path
 *  (already does Promise.all over 3 lookups; this becomes the 4th).
 */
export async function getFeedbackAdequacy(
  prismaClient: PrismaClient,
  userId: string,
  options?: {
    /** Optional domain hint — usually the document's `documentType` or
     *  `industry`. Lower-cased for matching; null disables filtering. */
    domainHint?: string | null;
    /** Override the recency window (in days). Defaults to 18 months. */
    recencyWindowDays?: number;
  }
): Promise<FeedbackAdequacy> {
  const recencyDays = options?.recencyWindowDays ?? RECENCY_WINDOW_DAYS;
  const recencyCutoff = new Date(Date.now() - recencyDays * 24 * 60 * 60 * 1000);
  const domainHint = options?.domainHint?.toLowerCase().trim() || null;

  let outcomes: Array<{
    reportedAt: Date;
    brierScore: number | null;
    documentType: string | null;
  }> = [];

  try {
    // @schema-drift-tolerant — DecisionOutcome / Analysis / Document
    // schema may lag behind app code on legacy envs. The catch below
    // produces verdict='unknown' rather than crashing the DPR path.
    // Document.industry is not in the live schema today; documentType
    // is the only domain hint we can pull cleanly. When industry lands
    // on Document (deferred), extend the select + the domain-match
    // filter below in the same commit.
    const rows = await prismaClient.decisionOutcome.findMany({
      where: {
        analysis: {
          document: { userId },
        },
      },
      select: {
        reportedAt: true,
        brierScore: true,
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
      take: 200, // bounded; >200 closed outcomes for a single user is rare
    });

    outcomes = rows.map(r => ({
      reportedAt: r.reportedAt,
      brierScore: r.brierScore,
      documentType: r.analysis?.document?.documentType ?? null,
    }));
  } catch (err) {
    log('lookup failed', err instanceof Error ? err.message : err);
    return {
      verdict: 'unknown',
      closedOutcomes: 0,
      recentClosedOutcomes: 0,
      daysSinceLastOutcome: null,
      meanBrier: null,
      domainMatchCount: null,
      domainHint,
      note: 'Feedback-adequacy lookup unavailable on this audit (likely transient or schema drift). Treat as cold-start: experience-based intuition claims should be supported by external base rates rather than this user’s track record.',
    };
  }

  if (outcomes.length === 0) {
    return {
      verdict: 'cold_start',
      closedOutcomes: 0,
      recentClosedOutcomes: 0,
      daysSinceLastOutcome: null,
      meanBrier: null,
      domainMatchCount: domainHint ? 0 : null,
      domainHint,
      note: 'No closed-loop outcome history yet for this user. Per Kahneman & Klein (2009), expert intuition requires repeated rapid feedback in the relevant domain; without that, experience-based justifications carry no informational weight beyond external base rates. Log past decision outcomes to begin building this calibration.',
    };
  }

  const recent = outcomes.filter(o => o.reportedAt >= recencyCutoff);
  const briers = outcomes.map(o => o.brierScore).filter((s): s is number => typeof s === 'number');
  const meanBrier =
    briers.length > 0 ? Math.round((briers.reduce((a, b) => a + b, 0) / briers.length) * 10_000) / 10_000 : null;

  let domainMatchCount: number | null = null;
  if (domainHint) {
    domainMatchCount = recent.filter(o => {
      const t = (o.documentType ?? '').toLowerCase();
      return t.includes(domainHint);
    }).length;
  }

  const lastOutcomeMs = outcomes[0].reportedAt.getTime();
  const daysSinceLastOutcome = Math.round((Date.now() - lastOutcomeMs) / (24 * 60 * 60 * 1000));

  // Verdict band selection. Domain match takes precedence when a hint
  // was supplied — a user with 50 closed outcomes overall but 1 in the
  // current domain is sparse for THIS memo, not adequate.
  const effectiveCount = domainMatchCount ?? recent.length;

  let verdict: FeedbackAdequacyVerdict;
  if (effectiveCount >= ADEQUATE_FLOOR) verdict = 'adequate';
  else if (effectiveCount >= SPARSE_FLOOR) verdict = 'sparse';
  else verdict = 'cold_start';

  const recencyClause =
    daysSinceLastOutcome !== null && daysSinceLastOutcome > 365
      ? ` Most recent outcome logged ${Math.round(daysSinceLastOutcome / 30)} months ago — calibration may be stale.`
      : '';
  const brierClause =
    meanBrier !== null
      ? ` Mean Brier ${meanBrier.toFixed(3)} across ${briers.length} scored outcomes (${brierBand(meanBrier)}).`
      : ' No Brier-scored outcomes yet (DQI predictions need to align with logged outcomes for calibration to compute).';

  // Reachable verdicts at this point: 'adequate' | 'sparse' | 'cold_start'.
  // The 'unknown' band is the catch-block early-return above and never
  // reaches this code path.
  let note: string;
  if (verdict === 'adequate') {
    note = `${effectiveCount} closed-loop outcomes${
      domainHint ? ` on ${domainHint} decisions in the past 18 months` : ' in the past 18 months'
    }. Per Kahneman & Klein (2009), this is sufficient closed-loop feedback for experience-based intuition claims to carry calibrated weight.${brierClause}${recencyClause}`;
  } else if (verdict === 'sparse') {
    note = `Only ${effectiveCount} closed-loop outcomes${
      domainHint ? ` on ${domainHint} decisions in the past 18 months` : ' in the past 18 months'
    } — too few for calibrated intuition by Kahneman & Klein’s (2009) standard. Experience-based justifications in this memo should be cross-checked against external base rates.${brierClause}${recencyClause}`;
  } else {
    // cold_start
    note = `Only ${effectiveCount} relevant closed-loop outcomes${
      domainHint ? ` on ${domainHint} decisions` : ''
    } in this user’s history${
      outcomes.length > 0 ? ` (${outcomes.length} total across all decision types)` : ''
    }. Per Kahneman & Klein (2009), this is insufficient closed-loop feedback for intuition to be calibrated; treat experience-based claims with the same scrutiny as a cold-start audit.${brierClause}${recencyClause}`;
  }

  return {
    verdict,
    closedOutcomes: outcomes.length,
    recentClosedOutcomes: recent.length,
    daysSinceLastOutcome,
    meanBrier,
    domainMatchCount,
    domainHint,
    note,
  };
}

function brierBand(score: number): string {
  if (score <= 0.13) return 'superforecaster band';
  if (score <= 0.23) return 'CIA-analyst band';
  if (score <= 0.35) return 'motivated-amateur band';
  return 'coin-flip band';
}
