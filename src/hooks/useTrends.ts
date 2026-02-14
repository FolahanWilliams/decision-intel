import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

interface TrendDataPoint {
    date: string;
    score: number;
    noise: number;
    volume: number;
}

interface BiasDistItem {
    name: string;
    value: number;
}

interface TrendStats {
    totalAnalyses: number;
    avgScore: number;
    highScore: number;
    lowScore: number;
    latestScore: number;
    avgNoise: number;
    totalBiases: number;
    trend: number;
}

interface TrendsData {
    trendData: TrendDataPoint[];
    biasDistribution: BiasDistItem[];
    stats: TrendStats;
    range: string;
    startDate: string;
    endDate: string;
}

/**
 * SWR hook for trends data.
 * Caches per range key (e.g., '1M', '3M', 'ALL').
 */
export function useTrends(range: string) {
    const { data, error, isLoading, mutate } = useSWR<TrendsData>(
        `/api/trends?range=${range}`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 15000,
        }
    );

    return {
        trends: data ?? null,
        isLoading,
        error,
        mutate,
    };
}
