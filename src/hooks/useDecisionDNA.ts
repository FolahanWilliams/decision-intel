import useSWR from 'swr';
import { type DecisionStyleProfile } from '@/lib/copilot/types';

export interface AgentEffectivenessData {
  accuracyRate: number;
  avgImpact: number;
  sampleSize: number;
  helpfulCount: number;
}

export interface OutcomeHistoryItem {
  outcome: string;
  impactScore: number | null;
  reportedAt: string;
  helpfulAgents: string[];
  lessonsLearned: string | null;
  sessionTitle: string;
}

export interface DecisionVelocityItem {
  deliberationHours: number;
  outcome: string | null;
}

export interface BiasTimelineItem {
  biasType: string;
  month: string;
  count: number;
}

export interface DecisionDNAPayload {
  decisionStyle: DecisionStyleProfile | null;
  agentEffectiveness: Record<string, AgentEffectivenessData> | null;
  outcomeHistory: OutcomeHistoryItem[];
  decisionVelocity: DecisionVelocityItem[];
  biasTimeline: BiasTimelineItem[];
  totals: {
    totalDecisions: number;
    totalOutcomes: number;
    successRate: number;
    avgImpact: number;
  };
}

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch decision DNA');
    return r.json();
  });

export function useDecisionDNA() {
  const { data, error, isLoading, mutate } = useSWR<DecisionDNAPayload>(
    '/api/decision-dna',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60_000,
      dedupingInterval: 30_000,
    }
  );

  return {
    dna: data,
    isLoading,
    error,
    mutate,
  };
}
