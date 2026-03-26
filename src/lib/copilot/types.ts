/**
 * Decision Copilot — Type Definitions
 *
 * Shared types for the copilot agent swarm: state, context, turns, and agent personas.
 */

import { type CausalWeight } from '@/lib/learning/causal-learning';

// ─── Agent Personas ──────────────────────────────────────────────────────────

export const COPILOT_AGENTS = ['idea_builder', 'devils_advocate', 'scenario_explorer', 'synthesizer'] as const;
export type CopilotAgentType = (typeof COPILOT_AGENTS)[number];

export const AGENT_LABELS: Record<CopilotAgentType, string> = {
  idea_builder: 'Idea Builder',
  devils_advocate: "Devil's Advocate",
  scenario_explorer: 'Scenario Explorer',
  synthesizer: 'Synthesizer',
};

export const AGENT_COLORS: Record<CopilotAgentType, string> = {
  idea_builder: '#3b82f6',      // blue
  devils_advocate: '#ef4444',    // red
  scenario_explorer: '#8b5cf6',  // purple
  synthesizer: '#22c55e',        // green
};

// ─── Copilot Context ─────────────────────────────────────────────────────────

export interface RAGResult {
  documentId: string;
  filename: string;
  score: number;
  similarity: number;
  biases: string[];
  content: string;
  outcomeResult?: string;
}

export interface UserBiasProfile {
  /** Total analyses for this user */
  totalAnalyses: number;
  /** Top biases by frequency: [biasType, count] */
  topBiases: Array<[string, number]>;
  /** Average DQI score across all analyses */
  avgScore: number;
  /** Biases that led to poor outcomes specifically */
  dangerousBiases: string[];
}

export interface OutcomeSummary {
  analysisId: string;
  outcome: string;
  impactScore: number | null;
  lessonsLearned: string | null;
  confirmedBiases: string[];
  reportedAt: string;
}

export interface CopilotContext {
  ragResults: RAGResult[];
  causalWeights: CausalWeight[];
  userProfile: UserBiasProfile;
  recentOutcomes: OutcomeSummary[];
}

// ─── Copilot State (LangGraph) ───────────────────────────────────────────────

export interface CopilotTurnData {
  role: 'user' | 'agent';
  agentType?: CopilotAgentType;
  content: string;
}

export interface CopilotState {
  sessionId: string;
  userId: string;
  orgId: string | null;
  decisionPrompt: string;
  conversationHistory: CopilotTurnData[];
  userMessage: string;
  context: CopilotContext;

  // Agent outputs
  activeAgent: CopilotAgentType;
  agentResponse: string;
  agentSources: RAGResult[];
}

// ─── SSE Event Types ─────────────────────────────────────────────────────────

export interface CopilotAgentStartEvent {
  type: 'agent_start';
  agent: CopilotAgentType;
  label: string;
}

export interface CopilotChunkEvent {
  type: 'chunk';
  text: string;
}

export interface CopilotSourcesEvent {
  type: 'sources';
  sources: Array<{
    documentId: string;
    filename: string;
    similarity: number;
    score: number;
  }>;
}

export interface CopilotDoneEvent {
  type: 'done';
  turnId: string;
  agent: CopilotAgentType;
}

export interface CopilotErrorEvent {
  type: 'error';
  message: string;
}

export type CopilotSSEEvent =
  | CopilotAgentStartEvent
  | CopilotChunkEvent
  | CopilotSourcesEvent
  | CopilotDoneEvent
  | CopilotErrorEvent;
