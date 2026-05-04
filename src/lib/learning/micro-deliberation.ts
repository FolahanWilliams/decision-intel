/**
 * GTM v3.5 — Micro-deliberation outcome helper.
 *
 * The fast-feedback Brier signal that closes Cloverpop's data-advantage
 * attack vector. NotebookLM Q1 + Q3.1 (2026-05-04) converged on the finding
 * that v3.5's "Sankore engineers Brier loops in 12 weeks" claim depends on
 * micro-deliberation outcomes (committee pushback / GC flag / chairman
 * concern — feedback in days), NOT macro outcomes (deal IRR — feedback in
 * years). Without this module, the Phase 2 data-moat math doesn't close.
 *
 * Event types — keep stable so admin queries + Brier aggregation reference
 * a known vocabulary. Add new entries here when extending; never rename
 * an existing one without a rollover migration.
 */

import { prisma } from '@/lib/prisma';

export const MICRO_DELIBERATION_EVENT_TYPES = [
  'committee_pushback',
  'gc_flag',
  'chairman_concern',
  'reviewer_dismissal',
  'predicted_bias_surfaced',
  'cfo_objection',
  'compliance_block',
  'lp_question',
  'audit_committee_query',
  'other',
] as const;

export type MicroDeliberationEventType = (typeof MICRO_DELIBERATION_EVENT_TYPES)[number];

const EVENT_TYPE_LABELS: Record<MicroDeliberationEventType, string> = {
  committee_pushback: 'Committee pushback',
  gc_flag: 'General Counsel flagged',
  chairman_concern: 'Chair raised concern',
  reviewer_dismissal: 'Reviewer dismissed',
  predicted_bias_surfaced: 'Predicted bias surfaced',
  cfo_objection: 'CFO objected',
  compliance_block: 'Compliance blocked',
  lp_question: 'LP asked',
  audit_committee_query: 'Audit committee queried',
  other: 'Other',
};

export function labelForEventType(eventType: string): string {
  if ((MICRO_DELIBERATION_EVENT_TYPES as readonly string[]).includes(eventType)) {
    return EVENT_TYPE_LABELS[eventType as MicroDeliberationEventType];
  }
  return eventType;
}

export function isMicroDeliberationEventType(value: unknown): value is MicroDeliberationEventType {
  return (
    typeof value === 'string' &&
    (MICRO_DELIBERATION_EVENT_TYPES as readonly string[]).includes(value)
  );
}

export interface CaptureInput {
  analysisId: string;
  userId: string;
  orgId?: string | null;
  eventType: MicroDeliberationEventType;
  targetBiasId?: string | null;
  predictedReaction: string;
  actualReaction?: string | null;
  confirmed?: boolean | null;
  predictedConfidence?: number | null;
  happenedAt?: Date | null;
  notes?: string | null;
}

export async function captureMicroDeliberation(input: CaptureInput): Promise<{ id: string }> {
  const created = await prisma.microDeliberationOutcome.create({
    data: {
      analysisId: input.analysisId,
      userId: input.userId,
      orgId: input.orgId ?? null,
      eventType: input.eventType,
      targetBiasId: input.targetBiasId ?? null,
      predictedReaction: input.predictedReaction.slice(0, 4000),
      actualReaction: input.actualReaction?.slice(0, 4000) ?? null,
      confirmed: input.confirmed ?? null,
      predictedConfidence: input.predictedConfidence ?? null,
      happenedAt: input.happenedAt ?? null,
      notes: input.notes?.slice(0, 4000) ?? null,
    },
    select: { id: true },
  });
  return created;
}

export interface MicroDeliberationListItem {
  id: string;
  analysisId: string;
  eventType: string;
  eventTypeLabel: string;
  targetBiasId: string | null;
  predictedReaction: string;
  actualReaction: string | null;
  confirmed: boolean | null;
  predictedConfidence: number | null;
  happenedAt: string | null;
  capturedAt: string;
  notes: string | null;
}

/**
 * List micro-deliberation events for a single analysis. Owner-scoped.
 */
export async function listMicroDeliberationsForAnalysis(
  analysisId: string,
  userId: string,
): Promise<MicroDeliberationListItem[]> {
  const rows = await prisma.microDeliberationOutcome
    .findMany({
      where: { analysisId, userId },
      orderBy: { capturedAt: 'desc' },
      select: {
        id: true,
        analysisId: true,
        eventType: true,
        targetBiasId: true,
        predictedReaction: true,
        actualReaction: true,
        confirmed: true,
        predictedConfidence: true,
        happenedAt: true,
        capturedAt: true,
        notes: true,
      },
    })
    .catch(() => []);

  return rows.map(r => ({
    ...r,
    eventTypeLabel: labelForEventType(r.eventType),
    happenedAt: r.happenedAt ? r.happenedAt.toISOString() : null,
    capturedAt: r.capturedAt.toISOString(),
  }));
}

export interface MicroDeliberationOrgStats {
  totalEvents: number;
  confirmedEvents: number;
  refutedEvents: number;
  pendingEvents: number;
  /// Micro-Brier proxy — confirmed / (confirmed + refuted), bounded 0-1.
  /// 1.0 = every prediction the org has logged DID surface; 0 = none did.
  /// Treat as a calibration health signal, NOT a Sean-Ellis-grade PMF
  /// metric on its own. Compounds alongside the macro DecisionOutcome
  /// Brier score.
  microConfirmationRate: number;
  /// Per-event-type breakdown — surfaces which prediction classes are
  /// best calibrated. E.g., GC flag predictions might fire 80% of the
  /// time while CFO objection predictions might fire 40%.
  byEventType: Array<{
    eventType: string;
    eventTypeLabel: string;
    total: number;
    confirmed: number;
    refuted: number;
    confirmationRate: number;
  }>;
  windowStart: string;
  windowEnd: string;
}

/**
 * Compute org-level micro-deliberation calibration stats. Used by the
 * founder-hub Phase 2 / Phase 3 metrics dashboard alongside the macro
 * DecisionOutcome Brier flywheel.
 */
export async function computeOrgMicroDeliberationStats(
  orgId: string,
  windowDays: number = 90,
): Promise<MicroDeliberationOrgStats> {
  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const windowEnd = new Date();

  const rows = await prisma.microDeliberationOutcome
    .findMany({
      where: { orgId, capturedAt: { gte: windowStart } },
      select: { eventType: true, confirmed: true },
    })
    .catch(() => []);

  const totalEvents = rows.length;
  const confirmedEvents = rows.filter(r => r.confirmed === true).length;
  const refutedEvents = rows.filter(r => r.confirmed === false).length;
  const pendingEvents = totalEvents - confirmedEvents - refutedEvents;
  const judged = confirmedEvents + refutedEvents;
  const microConfirmationRate = judged === 0 ? 0 : confirmedEvents / judged;

  const byEventTypeMap = new Map<string, { total: number; confirmed: number; refuted: number }>();
  for (const r of rows) {
    const cur = byEventTypeMap.get(r.eventType) ?? { total: 0, confirmed: 0, refuted: 0 };
    cur.total += 1;
    if (r.confirmed === true) cur.confirmed += 1;
    if (r.confirmed === false) cur.refuted += 1;
    byEventTypeMap.set(r.eventType, cur);
  }
  const byEventType = Array.from(byEventTypeMap.entries())
    .map(([eventType, agg]) => {
      const judgedHere = agg.confirmed + agg.refuted;
      return {
        eventType,
        eventTypeLabel: labelForEventType(eventType),
        total: agg.total,
        confirmed: agg.confirmed,
        refuted: agg.refuted,
        confirmationRate: judgedHere === 0 ? 0 : agg.confirmed / judgedHere,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    totalEvents,
    confirmedEvents,
    refutedEvents,
    pendingEvents,
    microConfirmationRate,
    byEventType,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
  };
}
