import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

export interface HumanDecisionNudge {
  id: string;
  nudgeType: string;
  message: string;
  severity: string;
  channel?: string;
  triggerReason?: string | null;
  acknowledgedAt: string | null;
  wasHelpful?: boolean | null;
  outcomeNotes?: string | null;
  createdAt?: string;
}

export interface HumanDecisionSummary {
  id: string;
  source: string;
  channel: string | null;
  decisionType: string | null;
  status: string;
  participants: string[];
  createdAt: string;
  cognitiveAudit: {
    id: string;
    decisionQualityScore: number;
    noiseScore: number;
    sentimentScore: number | null;
    summary: string;
    biasFindings: unknown;
    noiseStats?: unknown;
    complianceResult?: unknown;
    preMortem?: unknown;
    logicalAnalysis?: unknown;
    sentimentDetail?: unknown;
    teamConsensusFlag: boolean;
    dissenterCount: number;
  } | null;
  nudges: HumanDecisionNudge[];
}

interface HumanDecisionsResponse {
  decisions: HumanDecisionSummary[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * SWR hook for fetching human decisions with cognitive audit data.
 */
export function useHumanDecisions(page = 1, limit = 20) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  const url = `/api/human-decisions?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<HumanDecisionsResponse>(url, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return {
    decisions: data?.decisions ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
    mutate,
  };
}

/**
 * SWR hook for fetching a single human decision with full audit details.
 */
export function useHumanDecision(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<HumanDecisionSummary>(
    id ? `/api/human-decisions/${id}` : null,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  return { decision: data ?? null, isLoading, error, mutate };
}

export interface NudgeSummary {
  id: string;
  nudgeType: string;
  message: string;
  severity: string;
  channel: string;
  triggerReason: string | null;
  acknowledgedAt: string | null;
  wasHelpful: boolean | null;
  outcomeNotes: string | null;
  createdAt: string;
  humanDecision: {
    id: string;
    source: string;
    channel: string | null;
    decisionType: string | null;
    createdAt: string;
  };
}

interface NudgesResponse {
  nudges: NudgeSummary[];
}

/**
 * SWR hook for fetching nudges.
 */
export function useNudges(unacknowledgedOnly = false, limit = 50) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (unacknowledgedOnly) params.set('unacknowledged', 'true');
  const url = `/api/nudges?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<NudgesResponse>(url, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return {
    nudges: data?.nudges ?? [],
    isLoading,
    error,
    mutate,
  };
}
