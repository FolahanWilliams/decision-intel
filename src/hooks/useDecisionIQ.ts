import useSWR from 'swr';

export interface DecisionIQPayload {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    outcomeTrackingRate: number;
    biasAccuracy: number;
    qualityTrend: number;
    nudgeResponsiveness: number;
    dissentHealth: number;
    priorSubmissionRate: number;
  } | null;
  peerBenchmark: number | null;
  totalDecisions: number;
  accuracyImprovement: {
    earlyAccuracy: number;
    recentAccuracy: number;
    improvementPct: number;
    message: string;
  } | null;
  quarterlyImpact: {
    totalDecisions: number;
    improvedDecisions: number;
    estimatedSavings: number | null;
    currency: string;
  } | null;
  trend: number[];
  isPersonal: boolean;
}

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch Decision IQ');
    return r.json();
  });

export function useDecisionIQ() {
  const { data, error, isLoading, mutate } = useSWR<DecisionIQPayload>(
    '/api/decision-iq',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 300_000, // 5 min — matches API cache
      dedupingInterval: 60_000,
    }
  );

  return {
    diq: data,
    isLoading,
    error,
    mutate,
  };
}
