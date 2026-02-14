import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

interface StatsOverview {
    totalDocuments: number;
    documentsAnalyzed: number;
    avgOverallScore: number;
    avgNoiseScore: number;
}

interface StatsData {
    overview: StatsOverview;
    topBiases: Array<{ name: string; count: number }>;
    severityDistribution: Record<string, number>;
    recentDocuments: Array<{
        id: string;
        filename: string;
        status: string;
        uploadedAt: string;
        score?: number;
    }>;
}

/**
 * SWR hook for dashboard statistics.
 * Auto-revalidates every 30 seconds for near-real-time stats.
 */
export function useStats() {
    const { data, error, isLoading, mutate } = useSWR<StatsData>(
        '/api/stats',
        fetcher,
        {
            refreshInterval: 30000, // SWR: revalidate every 30s
            revalidateOnFocus: true,
            dedupingInterval: 10000,
        }
    );

    return {
        stats: data ?? null,
        isLoading,
        error,
        mutate,
    };
}
