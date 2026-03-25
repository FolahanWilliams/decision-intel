import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface GraphTrendWeek {
  week: string;
  edges: number;
  biasEdges: number;
  similarityEdges: number;
}

interface GraphTrendsData {
  weeklyData: GraphTrendWeek[];
  totalEdges: number;
  biasEdges: number;
  weeks: number;
}

export function useGraphTrends(orgId: string | null, weeks = 12) {
  const { data, error, isLoading } = useSWR<GraphTrendsData>(
    orgId ? `/api/decision-graph/trends?orgId=${encodeURIComponent(orgId)}&weeks=${weeks}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return { graphTrends: data ?? null, isLoading, error };
}
