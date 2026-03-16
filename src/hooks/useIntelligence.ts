import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`Request failed (${r.status})`);
    return r.json();
  });

export interface IntelligenceStatus {
  freshness: 'fresh' | 'stale' | 'empty';
  hoursOld: number;
  lastSyncAt: string | null;
  lastDataAt: string | null;
  counts: {
    articles: number;
    articlesTotal: number;
    research: number;
    caseStudies: number;
  };
  lastSync: {
    status: string;
    articlesAdded: number;
    feedsProcessed: number;
    durationMs: number;
  } | null;
}

export function useIntelligenceStatus() {
  const { data, error, isLoading, mutate } = useSWR<IntelligenceStatus>(
    '/api/intelligence/status',
    fetcher,
    { refreshInterval: 5 * 60 * 1000 } // Refresh every 5 minutes
  );

  return {
    status: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
