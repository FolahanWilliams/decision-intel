/**
 * Webhook Event Type Definitions
 *
 * Defines all events that can be emitted to webhook subscribers.
 */

export const WEBHOOK_EVENTS = [
  'analysis.completed',
  'outcome.reported',
  'nudge.delivered',
  'toxic_combination.detected',
  'decision_room.updated',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface AnalysisCompletedPayload {
  analysisId: string;
  documentId: string;
  score: number;
  biasCount: number;
  grade: string;
}

export interface OutcomeReportedPayload {
  outcomeId: string;
  analysisId: string;
  outcome: string;
  confidence: number;
}

export interface NudgeDeliveredPayload {
  nudgeId: string;
  type: string;
  severity: string;
  channel: string;
}

export interface ToxicCombinationDetectedPayload {
  analysisId: string;
  pattern: string;
  score: number;
  biasTypes: string[];
}

export interface DecisionRoomUpdatedPayload {
  roomId: string;
  status: string;
}
