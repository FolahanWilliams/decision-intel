/**
 * GET /api/founder-hub/metrics
 *
 * GTM v3.5 founder-hub real-time metrics endpoint. Aggregates the most
 * important signals for the Phase 1 graduation gate + Phase 2 bridge
 * preparation + the running data-moat health check, all in one fetch.
 *
 * Sections returned (each section is independently fault-tolerant — a
 * failure in one query falls back to nulls / zeros, never throws):
 *   funnel        — Phase 1 acquisition funnel: total + HXC sign-ups,
 *                   demos completed, meetings, paid customers (HXC retained 90d+).
 *   pmf           — Vohra HXC "very disappointed" %, sample size, gate / kill status.
 *   engagement    — audits this week / this month, outcomes closed 90d, micro-deliberation events.
 *   moat          — platform Brier baseline + per-org Brier (if any) + Bias Genome distinct biases.
 *   cadence       — days-since-X tripwires (last audit, last paid customer, last Vohra response).
 *
 * Founder-pass gated (same auth pattern as the rest of /api/founder-hub).
 */

import { NextResponse } from 'next/server';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import { prisma } from '@/lib/prisma';
import { computeHxcCohortMetrics, VOHRA_PMF_KILL_MIN_N } from '@/lib/learning/vohra-pmf';
import {
  PHASE_1_CUSTOMER_BASELINE_MIN,
  PHASE_1_CUSTOMER_BASELINE_MAX,
  PHASE_1_CUSTOMER_STRETCH_MIN,
  PHASE_1_CUSTOMER_STRETCH_MAX,
  PHASE_1_CUSTOMER_KILL_BY_MONTH_4,
} from '@/lib/constants/icp';
import { PLATFORM_BASELINE_SNAPSHOT } from '@/lib/learning/platform-baseline-snapshot';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FounderHubMetrics');

export const dynamic = 'force-dynamic';

const FOUNDER_PASS_HEADER = 'x-founder-pass';
const DAY_MS = 24 * 60 * 60 * 1000;

const DEMO_USER_ID = process.env.DEMO_USER_ID?.trim() ?? null;

interface MetricsResponse {
  funnel: {
    totalSignUps: number;
    hxcSignUps: number;
    nonHxcSignUps: number;
    paidCustomers: number;
    paidHxcCustomersRetained90Days: number;
    demosCompleted: number; // audits run by the public DEMO_USER_ID — proxy for /demo completions
    demosThisWeek: number;
    perPersona: Array<{ persona: string; signUps: number }>;
  };
  pmf: {
    veryDisappointedPct: number;
    sampleSize: number;
    pendingSurveys: number;
    completedSurveys: number;
    graduationGatePassed: boolean;
    killThresholdHit: boolean;
    graduationThreshold: number;
    killThreshold: number;
    /** N-floor: BOTH gates stay dark until sampleSize >= this (M-2). */
    killMinN: number;
    daysSinceLastSurveyResponse: number | null;
    perPersona: Array<{
      personaId: string;
      personaLabel: string;
      respondents: number;
      veryDisappointedPct: number;
    }>;
  };
  engagement: {
    totalAuditsAllTime: number;
    auditsThisWeek: number;
    auditsThisMonth: number;
    auditsByHxcUsersThisWeek: number;
    avgAuditsPerHxcUserThisWeek: number;
    outcomesClosedLast90Days: number;
    outcomeClosureRate: number; // 0-1, closed outcomes / audits 90d
    microDeliberationEvents: number;
    microDeliberationConfirmed: number;
    microDeliberationRefuted: number;
    microDeliberationConfirmationRate: number;
  };
  moat: {
    platformBrierSeed: number;
    platformBrierAccuracy: number;
    platformBrierSampleSize: number;
    perOrgBrierLatest: number | null;
    perOrgBrierSampleSize: number;
    biasGenomeDistinctBiases: number;
    biasGenomeAuditsContributed: number;
  };
  cadence: {
    daysSinceLastAudit: number | null;
    daysSinceLastPaidCustomer: number | null;
    daysSinceLastVohraResponse: number | null;
    daysSinceLastMicroDeliberation: number | null;
  };
  meta: {
    asOf: string;
    weekStart: string; // 7 days ago
    monthStart: string; // 30 days ago
    quarterStart: string; // 90 days ago
  };
}

export async function GET(request: Request) {
  const auth = verifyFounderPass(request.headers.get(FOUNDER_PASS_HEADER));
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.reason === 'not_configured' ? 'Founder pass not configured' : 'Unauthorized' },
      { status: auth.reason === 'not_configured' ? 503 : 401 }
    );
  }

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * DAY_MS);
  const monthStart = new Date(now.getTime() - 30 * DAY_MS);
  const quarterStart = new Date(now.getTime() - 90 * DAY_MS);
  const ninetyDaysAgo = quarterStart;

  // ─── Funnel ──────────────────────────────────────────────────────────────
  const allSignUps = await prisma.userSettings
    .findMany({
      select: { userId: true, phase1Persona: true, phase1HxcEligible: true, createdAt: true },
    })
    .catch(
      () =>
        [] as Array<{
          userId: string;
          phase1Persona: string | null;
          phase1HxcEligible: boolean;
          createdAt: Date;
        }>
    );

  const totalSignUps = allSignUps.length;
  const hxcSignUps = allSignUps.filter(s => s.phase1HxcEligible).length;
  const nonHxcSignUps = totalSignUps - hxcSignUps;

  // Per-persona sign-up distribution (only counts users who self-identified)
  const perPersonaMap = new Map<string, number>();
  for (const s of allSignUps) {
    if (!s.phase1Persona) continue;
    perPersonaMap.set(s.phase1Persona, (perPersonaMap.get(s.phase1Persona) ?? 0) + 1);
  }
  const perPersona = Array.from(perPersonaMap.entries())
    .map(([persona, signUps]) => ({ persona, signUps }))
    .sort((a, b) => b.signUps - a.signUps);

  // Active subscriptions — paid customers
  const activeSubs = await prisma.subscription
    .findMany({
      where: { status: { in: ['active', 'trialing'] } },
      select: { userId: true, createdAt: true, plan: true },
    })
    .catch(() => [] as Array<{ userId: string; createdAt: Date; plan: string }>);

  const paidCustomers = activeSubs.filter(s => s.plan !== 'free').length;
  const ninetyDayCutoff = new Date(now.getTime() - 90 * DAY_MS);
  const hxcUserIds = new Set(allSignUps.filter(s => s.phase1HxcEligible).map(s => s.userId));
  const paidHxcCustomersRetained90Days = activeSubs.filter(
    s => s.plan !== 'free' && hxcUserIds.has(s.userId) && s.createdAt <= ninetyDayCutoff
  ).length;

  // Demos completed — proxy: audits owned by DEMO_USER_ID (public /demo endpoint).
  let demosCompleted = 0;
  let demosThisWeek = 0;
  if (DEMO_USER_ID) {
    demosCompleted = await prisma.analysis
      .count({ where: { document: { userId: DEMO_USER_ID } } })
      .catch(() => 0);
    demosThisWeek = await prisma.analysis
      .count({
        where: { document: { userId: DEMO_USER_ID }, createdAt: { gte: weekStart } },
      })
      .catch(() => 0);
  }

  // ─── PMF (Vohra HXC) ────────────────────────────────────────────────────
  const hxc = await computeHxcCohortMetrics(90).catch(() => null);
  const completedSurveys = hxc?.totalRespondents ?? 0;

  const pendingSurveys = await prisma.vohraPMFResponse
    .count({ where: { completedAt: null } })
    .catch(() => 0);

  const lastSurveyResponse = await prisma.vohraPMFResponse
    .findFirst({
      where: { completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    })
    .catch(() => null);
  const daysSinceLastSurveyResponse = lastSurveyResponse?.completedAt
    ? Math.floor((now.getTime() - lastSurveyResponse.completedAt.getTime()) / DAY_MS)
    : null;

  // ─── Engagement ─────────────────────────────────────────────────────────
  const totalAuditsAllTime = await prisma.analysis.count().catch(() => 0);
  const auditsThisWeek = await prisma.analysis
    .count({ where: { createdAt: { gte: weekStart } } })
    .catch(() => 0);
  const auditsThisMonth = await prisma.analysis
    .count({ where: { createdAt: { gte: monthStart } } })
    .catch(() => 0);

  // Audits completed by HXC users this week (uses Document.userId → UserSettings.phase1HxcEligible)
  const hxcUserIdArray = Array.from(hxcUserIds);
  const auditsByHxcUsersThisWeek =
    hxcUserIdArray.length === 0
      ? 0
      : await prisma.analysis
          .count({
            where: {
              createdAt: { gte: weekStart },
              document: { userId: { in: hxcUserIdArray } },
            },
          })
          .catch(() => 0);
  const avgAuditsPerHxcUserThisWeek =
    hxcUserIds.size === 0 ? 0 : auditsByHxcUsersThisWeek / hxcUserIds.size;

  // Outcomes closed in the last 90 days vs. audits completed in the same window
  const auditsLast90Days = await prisma.analysis
    .count({ where: { createdAt: { gte: ninetyDaysAgo } } })
    .catch(() => 0);
  const outcomesClosedLast90Days = await prisma.decisionOutcome
    .count({ where: { reportedAt: { gte: ninetyDaysAgo } } })
    .catch(() => 0);
  const outcomeClosureRate =
    auditsLast90Days === 0 ? 0 : outcomesClosedLast90Days / auditsLast90Days;

  // Micro-deliberation aggregate (org-agnostic for the founder hub view)
  const microRows = await prisma.microDeliberationOutcome
    .findMany({
      where: { capturedAt: { gte: ninetyDaysAgo } },
      select: { confirmed: true, capturedAt: true },
    })
    .catch(() => [] as Array<{ confirmed: boolean | null; capturedAt: Date }>);
  const microConfirmed = microRows.filter(r => r.confirmed === true).length;
  const microRefuted = microRows.filter(r => r.confirmed === false).length;
  const microJudged = microConfirmed + microRefuted;
  const microConfirmationRate = microJudged === 0 ? 0 : microConfirmed / microJudged;

  // ─── Moat ───────────────────────────────────────────────────────────────
  // Per-org Brier — pull the most recent calibrated outcome's Brier across all orgs as
  // a "best-org-so-far" health signal. Deliberately NOT per-org-specific in the
  // founder hub (no org context needed for the founder's own surface).
  const recentOutcomeWithBrier = await prisma.decisionOutcome
    .findFirst({
      where: { brierScore: { not: null } },
      orderBy: { reportedAt: 'desc' },
      select: { brierScore: true },
    })
    .catch(() => null);
  const brierSampleSize = await prisma.decisionOutcome
    .count({ where: { brierScore: { not: null } } })
    .catch(() => 0);

  // Bias Genome contribution proxy — count distinct bias types observed in
  // all BiasInstance rows on outcome-validated analyses. This compounds as
  // the data moat (Cloverpop-defense per CLAUDE.md External Attack Vectors).
  // Non-throwing; falls back to zero on schema drift.
  let biasGenomeDistinctBiases = 0;
  let biasGenomeAuditsContributed = 0;
  try {
    const validatedAnalyses = await prisma.decisionOutcome.findMany({
      select: { analysisId: true },
    });
    const analysisIds = validatedAnalyses.map(d => d.analysisId);
    biasGenomeAuditsContributed = analysisIds.length;
    if (analysisIds.length > 0) {
      const distinctBiases = await prisma.biasInstance.findMany({
        where: { analysisId: { in: analysisIds } },
        select: { biasType: true },
        distinct: ['biasType'],
      });
      biasGenomeDistinctBiases = distinctBiases.length;
    }
  } catch (err) {
    log.warn('bias genome aggregation failed:', err);
  }

  // ─── Cadence ────────────────────────────────────────────────────────────
  const lastAudit = await prisma.analysis
    .findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
    .catch(() => null);
  const daysSinceLastAudit = lastAudit?.createdAt
    ? Math.floor((now.getTime() - lastAudit.createdAt.getTime()) / DAY_MS)
    : null;

  // Last paid customer = most recent active subscription on a paid plan.
  const lastPaidSub = activeSubs
    .filter(s => s.plan !== 'free')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const daysSinceLastPaidCustomer = lastPaidSub
    ? Math.floor((now.getTime() - lastPaidSub.createdAt.getTime()) / DAY_MS)
    : null;

  const lastMicro = await prisma.microDeliberationOutcome
    .findFirst({ orderBy: { capturedAt: 'desc' }, select: { capturedAt: true } })
    .catch(() => null);
  const daysSinceLastMicroDeliberation = lastMicro?.capturedAt
    ? Math.floor((now.getTime() - lastMicro.capturedAt.getTime()) / DAY_MS)
    : null;

  const response: MetricsResponse = {
    funnel: {
      totalSignUps,
      hxcSignUps,
      nonHxcSignUps,
      paidCustomers,
      paidHxcCustomersRetained90Days,
      demosCompleted,
      demosThisWeek,
      perPersona,
    },
    pmf: {
      veryDisappointedPct: hxc?.veryDisappointedPct ?? 0,
      sampleSize: completedSurveys,
      pendingSurveys,
      completedSurveys,
      graduationGatePassed: hxc?.graduationGatePassed ?? false,
      killThresholdHit: hxc?.killThresholdHit ?? false,
      graduationThreshold: hxc?.graduationThreshold ?? 40,
      killThreshold: hxc?.killThreshold ?? 30,
      killMinN: VOHRA_PMF_KILL_MIN_N,
      daysSinceLastSurveyResponse,
      perPersona: hxc?.cohortBreakdown ?? [],
    },
    engagement: {
      totalAuditsAllTime,
      auditsThisWeek,
      auditsThisMonth,
      auditsByHxcUsersThisWeek,
      avgAuditsPerHxcUserThisWeek,
      outcomesClosedLast90Days,
      outcomeClosureRate,
      microDeliberationEvents: microRows.length,
      microDeliberationConfirmed: microConfirmed,
      microDeliberationRefuted: microRefuted,
      microDeliberationConfirmationRate: microConfirmationRate,
    },
    moat: {
      platformBrierSeed: PLATFORM_BASELINE_SNAPSHOT.meanBrier,
      platformBrierAccuracy: PLATFORM_BASELINE_SNAPSHOT.classificationAccuracy,
      platformBrierSampleSize: PLATFORM_BASELINE_SNAPSHOT.n,
      perOrgBrierLatest: recentOutcomeWithBrier?.brierScore ?? null,
      perOrgBrierSampleSize: brierSampleSize,
      biasGenomeDistinctBiases,
      biasGenomeAuditsContributed,
    },
    cadence: {
      daysSinceLastAudit,
      daysSinceLastPaidCustomer,
      daysSinceLastVohraResponse: daysSinceLastSurveyResponse,
      daysSinceLastMicroDeliberation,
    },
    meta: {
      asOf: now.toISOString(),
      weekStart: weekStart.toISOString(),
      monthStart: monthStart.toISOString(),
      quarterStart: quarterStart.toISOString(),
    },
  };

  // Forward the v3.5 baseline / stretch / kill thresholds to the UI tiles
  // via headers so the consumer can render them without re-importing icp.
  const headers = new Headers();
  headers.set(
    'x-phase-1-baseline',
    `${PHASE_1_CUSTOMER_BASELINE_MIN}-${PHASE_1_CUSTOMER_BASELINE_MAX}`
  );
  headers.set(
    'x-phase-1-stretch',
    `${PHASE_1_CUSTOMER_STRETCH_MIN}-${PHASE_1_CUSTOMER_STRETCH_MAX}`
  );
  headers.set('x-phase-1-kill', String(PHASE_1_CUSTOMER_KILL_BY_MONTH_4));

  return NextResponse.json(response, { headers });
}
