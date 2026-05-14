/**
 * GTM v3.5 — Vohra/Sean Ellis PMF survey helper.
 *
 * The "very disappointed" 40% threshold is the canonical pre-eminent measure
 * of B2B PMF (Sean Ellis test, operationalised by Rahul Vohra at Superhuman).
 * v3.5 ratifies it as the Phase 1 graduation gate.
 *
 * Filtering is the load-bearing discipline: the score is meaningful ONLY on
 * the HXC (High Expectation Customer) cohort — the four buyer-class-continuous
 * personas in PHASE_1_HXC_PERSONAS. A 40% score on the wrong cohort is noise.
 *
 * Trigger eligibility (locked):
 *   - User has completed ≥2 audits within the last 14 days (reached value
 *     proposition repeatedly, per Vohra's Step 1)
 *   - User has NO completed survey in the last 30 days
 *   - User has NO pending (un-dismissed) survey already
 *
 * Single source of truth — sign-up gating, cron trigger, admin metrics, and
 * the in-app modal all import from here.
 */

import { prisma } from '@/lib/prisma';
import {
  PHASE_1_HXC_PERSONAS,
  VOHRA_PMF_GRADUATION_THRESHOLD,
  VOHRA_PMF_KILL_THRESHOLD,
  isHxcEligible,
  type Phase1PersonaId,
} from '@/lib/constants/icp';

const TRIGGER_AUDIT_COUNT = 2;
const TRIGGER_AUDIT_WINDOW_DAYS = 14;
const RESURVEY_COOLDOWN_DAYS = 30;
const MAX_DISMISSAL_COUNT = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type VohraResponseValue = 'very_disappointed' | 'somewhat_disappointed' | 'not_disappointed';

export interface VohraEligibility {
  eligible: boolean;
  reason: string;
  auditCountInWindow: number;
}

/**
 * Returns whether a user is currently eligible to receive a new Vohra survey.
 * Used by the cron trigger AND by manual-trigger admin tooling.
 */
export async function checkVohraEligibility(userId: string): Promise<VohraEligibility> {
  const windowStart = new Date(Date.now() - TRIGGER_AUDIT_WINDOW_DAYS * DAY_MS);

  // Count audits the user has completed in the trigger window.
  // Analysis has no status field; every Analysis row IS a completed audit
  // (the pipeline only writes the row on success). Filter by Document.userId.
  const auditCountInWindow = await prisma.analysis
    .count({
      where: {
        document: { userId },
        createdAt: { gte: windowStart },
      },
    })
    .catch(() => 0);

  if (auditCountInWindow < TRIGGER_AUDIT_COUNT) {
    return {
      eligible: false,
      reason: `awaiting_audit_volume (have ${auditCountInWindow}, need ${TRIGGER_AUDIT_COUNT})`,
      auditCountInWindow,
    };
  }

  // No completed survey in the cooldown window.
  const cooldownStart = new Date(Date.now() - RESURVEY_COOLDOWN_DAYS * DAY_MS);
  const recentCompleted = await prisma.vohraPMFResponse
    .findFirst({
      where: { userId, completedAt: { gte: cooldownStart } },
      select: { id: true },
    })
    .catch(() => null);
  if (recentCompleted) {
    return {
      eligible: false,
      reason: 'recent_completion_within_cooldown',
      auditCountInWindow,
    };
  }

  // No pending survey already.
  const pending = await prisma.vohraPMFResponse
    .findFirst({
      where: { userId, completedAt: null, dismissedCount: { lt: MAX_DISMISSAL_COUNT } },
      select: { id: true },
    })
    .catch(() => null);
  if (pending) {
    return { eligible: false, reason: 'pending_survey_exists', auditCountInWindow };
  }

  return { eligible: true, reason: 'eligible', auditCountInWindow };
}

/**
 * Creates a pending VohraPMFResponse record. Caller is responsible for
 * having checked eligibility first. Snapshots the user's current persona +
 * HXC eligibility so cohort reporting stays consistent if persona is later
 * edited.
 */
export async function createPendingSurvey(
  userId: string,
  triggerReason: string = 'audits_complete_2_in_14d'
): Promise<{ id: string }> {
  const settings = await prisma.userSettings
    .findUnique({
      where: { userId },
      select: { phase1Persona: true, phase1HxcEligible: true, createdAt: true },
    })
    .catch(() => null);

  const persona = settings?.phase1Persona ?? null;
  const hxcEligibleAtTime = isHxcEligible(persona);
  const daysSinceSignup = settings?.createdAt
    ? Math.floor((Date.now() - settings.createdAt.getTime()) / DAY_MS)
    : 0;

  const auditCountAtTrigger = await prisma.analysis
    .count({
      where: { document: { userId } },
    })
    .catch(() => 0);

  const created = await prisma.vohraPMFResponse.create({
    data: {
      userId,
      triggerReason,
      phase1PersonaAtTime: persona,
      hxcEligibleAtTime,
      auditCountAtTrigger,
      daysSinceSignup,
    },
    select: { id: true },
  });

  return created;
}

export interface PendingSurvey {
  id: string;
  triggeredAt: Date;
  dismissedCount: number;
  forceShow: boolean;
}

/**
 * Returns the user's currently pending (uncompleted) Vohra survey, or null.
 * If the user has dismissed 3+ times, the modal forces visibility (cannot
 * defer further) — `forceShow: true` signals the UI to omit the dismiss CTA.
 */
export async function getPendingSurvey(userId: string): Promise<PendingSurvey | null> {
  const pending = await prisma.vohraPMFResponse
    .findFirst({
      where: { userId, completedAt: null },
      orderBy: { triggeredAt: 'desc' },
      select: { id: true, triggeredAt: true, dismissedCount: true },
    })
    .catch(() => null);
  if (!pending) return null;
  return {
    id: pending.id,
    triggeredAt: pending.triggeredAt,
    dismissedCount: pending.dismissedCount,
    forceShow: pending.dismissedCount >= MAX_DISMISSAL_COUNT,
  };
}

export interface VohraSubmitInput {
  veryDisappointed: VohraResponseValue;
  hxcType?: string;
  mainBenefit?: string;
  improvement?: string;
  referralWillingness?: number;
}

/**
 * Records a user's Vohra survey response. Returns the saved record id.
 * Validates the veryDisappointed value at the API layer.
 */
export async function submitVohraResponse(
  userId: string,
  surveyId: string,
  input: VohraSubmitInput
): Promise<{ id: string }> {
  const updated = await prisma.vohraPMFResponse.update({
    where: { id: surveyId },
    data: {
      completedAt: new Date(),
      veryDisappointed: input.veryDisappointed,
      hxcType: input.hxcType?.slice(0, 500) ?? null,
      mainBenefit: input.mainBenefit?.slice(0, 1000) ?? null,
      improvement: input.improvement?.slice(0, 1000) ?? null,
      referralWillingness: input.referralWillingness ?? null,
    },
    select: { id: true, userId: true },
  });

  // Defence-in-depth: refuse the update if the survey doesn't belong to the user.
  if (updated.userId !== userId) {
    throw new Error('Survey does not belong to authenticated user');
  }

  return { id: updated.id };
}

/**
 * Dismisses a pending Vohra survey, incrementing dismissedCount. The user
 * can dismiss up to 3 times; on the 4th open, the modal cannot be deferred.
 */
export async function dismissPendingSurvey(
  userId: string,
  surveyId: string
): Promise<{ dismissedCount: number; forceNextShow: boolean }> {
  const updated = await prisma.vohraPMFResponse.update({
    where: { id: surveyId },
    data: { dismissedCount: { increment: 1 }, lastDismissedAt: new Date() },
    select: { dismissedCount: true, userId: true },
  });

  if (updated.userId !== userId) {
    throw new Error('Survey does not belong to authenticated user');
  }

  return {
    dismissedCount: updated.dismissedCount,
    forceNextShow: updated.dismissedCount >= MAX_DISMISSAL_COUNT,
  };
}

export interface HxcCohortMetrics {
  totalRespondents: number;
  veryDisappointed: number;
  somewhatDisappointed: number;
  notDisappointed: number;
  veryDisappointedPct: number;
  graduationGatePassed: boolean;
  killThresholdHit: boolean;
  graduationThreshold: number;
  killThreshold: number;
  windowStart: string;
  windowEnd: string;
  cohortBreakdown: Array<{
    personaId: Phase1PersonaId;
    personaLabel: string;
    respondents: number;
    veryDisappointedPct: number;
  }>;
}

/**
 * Minimum cohort size required before the kill-threshold can fire. Below
 * this the variance is too high to act on — surface "awaiting volume"
 * instead of triggering the wedge-discovery reset. Locked v3.5 §2.
 */
export const VOHRA_PMF_KILL_MIN_N = 5;

/**
 * Pure-function aggregator — extracted from computeHxcCohortMetrics so the
 * load-bearing math can be unit-tested without a Prisma fixture. The
 * computation that drives the GTM v3.5 graduation decision is pure: given
 * the filtered responses, it computes the cohort %, gates, and per-persona
 * breakdown deterministically.
 *
 * Caller responsibilities (in computeHxcCohortMetrics):
 *   - Filter responses to HXC-eligible + completed + within window.
 *   - This function does NOT re-filter; it assumes the inputs are already
 *     the right cohort.
 */
export function aggregateHxcCohortMetrics(
  responses: Array<{ veryDisappointed: string | null; phase1PersonaAtTime: string | null }>,
  windowStart: Date,
  windowEnd: Date
): HxcCohortMetrics {
  const veryDisappointed = responses.filter(r => r.veryDisappointed === 'very_disappointed').length;
  const somewhatDisappointed = responses.filter(
    r => r.veryDisappointed === 'somewhat_disappointed'
  ).length;
  const notDisappointed = responses.filter(r => r.veryDisappointed === 'not_disappointed').length;
  const totalRespondents = responses.length;
  const veryDisappointedPct =
    totalRespondents === 0 ? 0 : Math.round((veryDisappointed / totalRespondents) * 100);

  const cohortBreakdown = PHASE_1_HXC_PERSONAS.map(p => {
    const subset = responses.filter(r => r.phase1PersonaAtTime === p.id);
    const subsetVeryDisappointed = subset.filter(
      r => r.veryDisappointed === 'very_disappointed'
    ).length;
    return {
      personaId: p.id,
      personaLabel: p.label,
      respondents: subset.length,
      veryDisappointedPct:
        subset.length === 0 ? 0 : Math.round((subsetVeryDisappointed / subset.length) * 100),
    };
  });

  return {
    totalRespondents,
    veryDisappointed,
    somewhatDisappointed,
    notDisappointed,
    veryDisappointedPct,
    graduationGatePassed:
      totalRespondents >= VOHRA_PMF_KILL_MIN_N &&
      veryDisappointedPct >= VOHRA_PMF_GRADUATION_THRESHOLD,
    killThresholdHit:
      totalRespondents >= VOHRA_PMF_KILL_MIN_N && veryDisappointedPct < VOHRA_PMF_KILL_THRESHOLD,
    graduationThreshold: VOHRA_PMF_GRADUATION_THRESHOLD,
    killThreshold: VOHRA_PMF_KILL_THRESHOLD,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    cohortBreakdown,
  };
}

/**
 * Computes the HXC cohort PMF metrics for the founder-hub Phase 1 dashboard.
 * Filters to HXC-eligible respondents within the given window (default 90 days).
 * Returns the % "very disappointed", graduation-gate status, kill-threshold
 * status, plus per-persona breakdown.
 *
 * Note (locked 2026-05-13 M-2-follow-through): both graduation-gate AND
 * kill-threshold now require N ≥ VOHRA_PMF_KILL_MIN_N (5) before they
 * can fire. The prior implementation only N-gated the kill threshold —
 * which meant the graduation gate could fire on a single "very
 * disappointed" response and declare PMF prematurely. Both are now
 * symmetrically gated.
 */
export async function computeHxcCohortMetrics(windowDays: number = 90): Promise<HxcCohortMetrics> {
  const windowStart = new Date(Date.now() - windowDays * DAY_MS);
  const windowEnd = new Date();

  const responses = await prisma.vohraPMFResponse
    .findMany({
      where: {
        completedAt: { not: null, gte: windowStart },
        hxcEligibleAtTime: true,
      },
      select: { veryDisappointed: true, phase1PersonaAtTime: true },
    })
    .catch(() => []);

  return aggregateHxcCohortMetrics(responses, windowStart, windowEnd);
}

/**
 * Identifies users currently eligible for a Vohra survey. Used by the daily
 * cron. Caps at `limit` to avoid runaway batch sizes.
 */
export async function findEligibleUsers(limit: number = 50): Promise<string[]> {
  // Find users who have completed ≥2 audits in the last 14 days.
  // Analysis has no status field; every Analysis row IS a completed audit.
  const windowStart = new Date(Date.now() - TRIGGER_AUDIT_WINDOW_DAYS * DAY_MS);
  const candidates = await prisma.analysis
    .groupBy({
      by: ['documentId'],
      where: { createdAt: { gte: windowStart } },
      _count: true,
    })
    .catch(() => [] as Array<{ documentId: string; _count: number }>);

  if (candidates.length === 0) return [];

  // Map documentId → userId via the Document table.
  const documentIds = candidates.map(c => c.documentId);
  const documents = await prisma.document
    .findMany({
      where: { id: { in: documentIds } },
      select: { id: true, userId: true },
    })
    .catch(() => [] as Array<{ id: string; userId: string }>);
  const docToUser = new Map(documents.map(d => [d.id, d.userId]));

  // Count per user. Sum the per-document audit counts across all docs the
  // user owns. Defensive: skip rows missing _count or where the document
  // owner cannot be resolved.
  const userAuditCount = new Map<string, number>();
  for (const c of candidates) {
    const userId = docToUser.get(c.documentId);
    if (!userId) continue;
    const count = typeof c._count === 'number' ? c._count : 0;
    userAuditCount.set(userId, (userAuditCount.get(userId) ?? 0) + count);
  }

  const eligibleUsers: string[] = [];
  for (const [userId, count] of userAuditCount.entries()) {
    if (count < TRIGGER_AUDIT_COUNT) continue;
    const eligibility = await checkVohraEligibility(userId);
    if (eligibility.eligible) {
      eligibleUsers.push(userId);
      if (eligibleUsers.length >= limit) break;
    }
  }

  return eligibleUsers;
}
