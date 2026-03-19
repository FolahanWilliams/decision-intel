/**
 * Types for Human Cognitive Auditing (Product B)
 *
 * These types define the data structures for auditing human decisions
 * using the same engine that audits AI decisions (Product A).
 */

import type {
  BiasDetectionResult,
  ComplianceResult,
  LogicalAnalysisResult,
  SwotAnalysisResult,
} from '@/types';

// ─── Decision Source Types ───────────────────────────────────────────────────

export type DecisionSource = 'slack' | 'meeting_transcript' | 'email' | 'jira' | 'manual';

export type DecisionType =
  | 'triage'
  | 'escalation'
  | 'approval'
  | 'override'
  | 'strategic'
  | 'vendor_eval';

export type NudgeType =
  | 'anchor_alert'
  | 'dissent_prompt'
  | 'base_rate_reminder'
  | 'pre_mortem_trigger'
  | 'noise_check'
  | 'shallow_verification';

export type NudgeSeverity = 'info' | 'warning' | 'critical';

export type NudgeChannel = 'dashboard' | 'slack' | 'email';

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface HumanDecisionInput {
  source: DecisionSource;
  sourceRef?: string;
  channel?: string;
  decisionType?: DecisionType;
  participants?: string[];
  content: string;
  linkedAnalysisId?: string;
}

export interface SlackMessageInput {
  teamId: string;
  channelId: string;
  channelName: string;
  messageTs: string;
  threadTs?: string;
  userId: string;
  text: string;
  participants?: string[];
}

export interface MeetingTranscriptInput {
  title: string;
  date: string;
  participants: string[];
  transcript: string;
  meetingType?: 'board' | 'incident_response' | 'vendor_review' | 'strategic_planning' | 'general';
}

// ─── Cognitive Audit Results ─────────────────────────────────────────────────

export interface CognitiveAuditResult {
  decisionQualityScore: number; // 0-100
  noiseScore: number; // 0-100
  sentimentScore?: number; // -1 to 1
  summary: string;

  biasFindings: BiasDetectionResult[];
  noiseStats?: {
    mean: number;
    stdDev: number;
    variance: number;
  };
  complianceResult?: ComplianceResult;
  preMortem?: {
    failureScenarios: string[];
    preventiveMeasures: string[];
  };
  logicalAnalysis?: LogicalAnalysisResult;
  swotAnalysis?: SwotAnalysisResult;
  sentimentDetail?: {
    score: number;
    label: 'Positive' | 'Negative' | 'Neutral';
  };

  // Human-specific analysis
  teamConsensusFlag: boolean;
  dissenterCount: number;

  // Visualizations
  biasWebImageUrl?: string | null;
  preMortemImageUrl?: string | null;
}

// ─── Nudge Types ─────────────────────────────────────────────────────────────

export interface NudgeDefinition {
  nudgeType: NudgeType;
  triggerReason: string;
  message: string;
  severity: NudgeSeverity;
  channel: NudgeChannel;
}

export interface NudgeTriggerContext {
  /** Current decision being analyzed */
  decision: HumanDecisionInput;
  /** Audit results for the current decision */
  auditResult: CognitiveAuditResult;
  /** Historical context for the user/team */
  history?: {
    recentDecisionCount: number;
    recentEscalationRate?: number;
    historicalBaseRate?: number;
    avgSeverityLastN?: number;
    lastNSeverities?: string[];
  };
}

export const NUDGE_TEMPLATES: Record<NudgeType, { icon: string; template: string }> = {
  anchor_alert: {
    icon: '\u{1F4A1}',
    template:
      "You've assessed {count} consecutive incidents with the same severity as the first. Consider reassessing independently.",
  },
  dissent_prompt: {
    icon: '\u{1F504}',
    template:
      "Unanimous agreement detected. Assigning a Devil's Advocate role to [{person}] for this decision.",
  },
  base_rate_reminder: {
    icon: '\u{1F4CA}',
    template:
      'Historical base rate for this alert type: {baseRate}% true positive. Your current escalation rate: {currentRate}%.',
  },
  pre_mortem_trigger: {
    icon: '\u{26A0}\u{FE0F}',
    template:
      'Before finalizing, consider: What would have to be true for this decision to fail catastrophically?',
  },
  noise_check: {
    icon: '\u{1F4C8}',
    template:
      'Alert consistency score: {consistencyScore}/100. Similar incidents received severity scores ranging from {low} to {high}.',
  },
  shallow_verification: {
    icon: '\u{1F9E0}',
    template:
      'This decision shows signs of shallow analysis relative to its stakes. Verify key assumptions against the available evidence before finalizing.',
  },
};

// ─── Team Aggregation Types ──────────────────────────────────────────────────

export interface TeamBiasAggregate {
  biasType: string;
  frequency: number;
  avgSeverity: number;
}

export interface TeamCognitiveProfileData {
  avgDecisionQuality: number;
  avgNoiseScore: number;
  totalDecisions: number;
  topBiases: TeamBiasAggregate[];
  consistencyTrend?: Array<{ date: string; score: number }>;
  nudgeEffectiveness?: {
    sent: number;
    acknowledged: number;
    helpfulRate: number;
  };
}

// ─── Slack Integration Types ─────────────────────────────────────────────────

export interface SlackWebhookPayload {
  type: string;
  event?: {
    type: string;
    channel: string;
    user: string;
    text: string;
    ts: string;
    thread_ts?: string;
  };
  challenge?: string;
  token?: string;
  team_id?: string;
}

export interface SlackNudgePayload {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  thread_ts?: string;
}

// ─── Slack OAuth Types ──────────────────────────────────────────────────────

export interface SlackOAuthResponse {
  ok: boolean;
  error?: string;
  access_token?: string;
  token_type?: string;
  scope?: string;
  bot_user_id?: string;
  app_id?: string;
  team?: {
    id: string;
    name: string;
  };
  authed_user?: {
    id: string;
    scope?: string;
    access_token?: string;
  };
}

export interface SlackInstallationStatus {
  connected: boolean;
  teamName?: string;
  teamId?: string;
  installedAt?: string;
  scopes?: string[];
  status?: string;
}

export interface SlackBlock {
  type: 'section' | 'divider' | 'context' | 'actions';
  text?: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements?: Array<Record<string, any>>;
}
