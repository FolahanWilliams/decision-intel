/**
 * Analytics Queries
 *
 * SQL-level cohort, funnel, and per-user queries over the AnalyticsEvent
 * table. This module is the "warehouse" layer — `track.ts` writes events,
 * `queries.ts` reads them for dashboards, experiments, and admin views.
 *
 * Pure functions, server-only. No caching here — the caller decides.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface QueryWindow {
  since?: Date;
  until?: Date;
}

export interface FunnelStepResult {
  step: string;
  users: number;
  dropoffPct: number; // relative to previous step; 0 for the first step
}

export interface FunnelResult {
  steps: FunnelStepResult[];
  totalEntered: number;
  totalCompleted: number;
  conversionPct: number;
}

/**
 * Ordered funnel: count distinct users who fire step N strictly after step
 * N-1 (by createdAt). The first step is any user who fires that event in the
 * window. Subsequent steps require the user to have completed all prior steps
 * in order.
 */
export async function getFunnel(
  steps: string[],
  window: QueryWindow = {}
): Promise<FunnelResult> {
  if (steps.length === 0) {
    return { steps: [], totalEntered: 0, totalCompleted: 0, conversionPct: 0 };
  }

  const where: Prisma.AnalyticsEventWhereInput = {
    name: { in: steps },
    userId: { not: null },
    ...(window.since || window.until
      ? {
          createdAt: {
            ...(window.since ? { gte: window.since } : {}),
            ...(window.until ? { lte: window.until } : {}),
          },
        }
      : {}),
  };

  const events = await prisma.analyticsEvent.findMany({
    where,
    select: { name: true, userId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // For each user, walk through their events in order and record which step
  // index they reached. Then count distinct users per step.
  const userProgress = new Map<string, number>(); // userId -> highest step index reached (0-based)

  for (const ev of events) {
    if (!ev.userId) continue;
    const nextExpected = (userProgress.get(ev.userId) ?? -1) + 1;
    if (nextExpected >= steps.length) continue;
    if (ev.name === steps[nextExpected]) {
      userProgress.set(ev.userId, nextExpected);
    }
  }

  const counts = new Array(steps.length).fill(0);
  for (const reached of userProgress.values()) {
    for (let i = 0; i <= reached; i++) counts[i]++;
  }

  const stepResults: FunnelStepResult[] = steps.map((step, i) => ({
    step,
    users: counts[i],
    dropoffPct:
      i === 0 || counts[i - 1] === 0
        ? 0
        : Math.round(((counts[i - 1] - counts[i]) / counts[i - 1]) * 10000) / 100,
  }));

  const totalEntered = counts[0] ?? 0;
  const totalCompleted = counts[counts.length - 1] ?? 0;
  const conversionPct =
    totalEntered === 0 ? 0 : Math.round((totalCompleted / totalEntered) * 10000) / 100;

  return { steps: stepResults, totalEntered, totalCompleted, conversionPct };
}

export interface CohortRetentionBucket {
  dayOffset: number;
  retained: number;
  retentionPct: number;
}

export interface CohortRetentionResult {
  cohortSize: number;
  buckets: CohortRetentionBucket[];
}

/**
 * Day-bucketed retention: given a cohort event (e.g. "user.created") and a
 * retention event (e.g. "analysis_complete"), count what fraction of the
 * cohort fired the retention event within each dayOffset bucket.
 */
export async function getCohortRetention(
  cohortEvent: string,
  retentionEvent: string,
  dayBuckets: number[],
  window: QueryWindow = {}
): Promise<CohortRetentionResult> {
  const cohortEvents = await prisma.analyticsEvent.findMany({
    where: {
      name: cohortEvent,
      userId: { not: null },
      ...(window.since || window.until
        ? {
            createdAt: {
              ...(window.since ? { gte: window.since } : {}),
              ...(window.until ? { lte: window.until } : {}),
            },
          }
        : {}),
    },
    select: { userId: true, createdAt: true },
  });

  // First occurrence of cohortEvent per user
  const cohortMap = new Map<string, Date>();
  for (const ev of cohortEvents) {
    if (!ev.userId) continue;
    const existing = cohortMap.get(ev.userId);
    if (!existing || ev.createdAt < existing) {
      cohortMap.set(ev.userId, ev.createdAt);
    }
  }

  if (cohortMap.size === 0) {
    return { cohortSize: 0, buckets: dayBuckets.map(d => ({ dayOffset: d, retained: 0, retentionPct: 0 })) };
  }

  const retentionEvents = await prisma.analyticsEvent.findMany({
    where: {
      name: retentionEvent,
      userId: { in: Array.from(cohortMap.keys()) },
    },
    select: { userId: true, createdAt: true },
  });

  // For each user, the day-offset of their first retention event relative
  // to their cohort date.
  const userDayOffset = new Map<string, number>();
  for (const ev of retentionEvents) {
    if (!ev.userId) continue;
    const cohortDate = cohortMap.get(ev.userId);
    if (!cohortDate) continue;
    const offset = Math.floor((ev.createdAt.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24));
    if (offset < 0) continue;
    const current = userDayOffset.get(ev.userId);
    if (current === undefined || offset < current) {
      userDayOffset.set(ev.userId, offset);
    }
  }

  const sortedBuckets = [...dayBuckets].sort((a, b) => a - b);
  const buckets: CohortRetentionBucket[] = sortedBuckets.map(dayOffset => {
    const retained = Array.from(userDayOffset.values()).filter(o => o <= dayOffset).length;
    return {
      dayOffset,
      retained,
      retentionPct: Math.round((retained / cohortMap.size) * 10000) / 100,
    };
  });

  return { cohortSize: cohortMap.size, buckets };
}

/**
 * Per-user event stream (most recent first). Useful for debugging onboarding
 * and powering a future "user timeline" admin view.
 */
export async function getEventsByUser(userId: string, limit = 200) {
  return prisma.analyticsEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, name: true, properties: true, sessionId: true, createdAt: true },
  });
}

/**
 * Count of distinct users who fired a given event in a window. Cheap primitive
 * for dashboards that just want "how many people did X this week".
 */
export async function getEventUserCount(name: string, window: QueryWindow = {}): Promise<number> {
  const rows = await prisma.analyticsEvent.findMany({
    where: {
      name,
      userId: { not: null },
      ...(window.since || window.until
        ? {
            createdAt: {
              ...(window.since ? { gte: window.since } : {}),
              ...(window.until ? { lte: window.until } : {}),
            },
          }
        : {}),
    },
    select: { userId: true },
    distinct: ['userId'],
  });
  return rows.length;
}
