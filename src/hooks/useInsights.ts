import useSWR from 'swr';

export interface InsightsPayload {
    empty: boolean;
    radar: {
        quality: number;
        consistency: number;
        factAccuracy: number;
        logic: number;
        compliance: number;
        objectivity: number;
    };
    biasTreemap: { name: string; count: number }[];
    biasSeverity: Record<string, number>;
    swot: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    };
    factVerification: { verified: number; contradicted: number; unverifiable: number };
    sentiment: { score: number; label: string };
    complianceGrid: { name: string; pass: number; warn: number; fail: number }[];
    scoreDistribution: { range: string; count: number }[];
    scatterData: { id: string; overallScore: number; noiseScore: number }[];
    totalAnalyses: number;
    totalBiases: number;
    // Performance trajectory
    weeklyTrend: { week: string; avgScore: number; avgNoise: number; count: number }[];
    trendDelta: number;
    // Risk signals
    fallacyFrequency: { name: string; count: number; severity: string }[];
    topFailureScenarios: { text: string; count: number }[];
    // Boardroom consensus
    decisionTwinVotes: { approve: number; reject: number; revise: number; total: number };
    avgBlindSpotGap: number;
    topBlindSpots: string[];
}

const fetcher = (url: string) => fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch insights');
    return r.json();
});

export function useInsights() {
    const { data, error, isLoading, mutate } = useSWR<InsightsPayload>(
        '/api/insights',
        fetcher,
        {
            revalidateOnFocus: false,
            refreshInterval: 60_000, // 60s auto-revalidation
            dedupingInterval: 30_000,
        }
    );

    return {
        insights: data,
        isLoading,
        error,
        mutate,
    };
}
