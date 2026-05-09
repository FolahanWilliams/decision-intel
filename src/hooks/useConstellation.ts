'use client';

/**
 * Hook fetching the Decision Pipeline Constellation data.
 * Mirrors useContainers shape — SWR-backed for fresh-on-focus reads.
 */

import useSWR from 'swr';
import type { ConstellationResponse } from '@/app/api/containers/constellation/route';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load constellation');
  return res.json() as Promise<ConstellationResponse>;
};

export function useConstellation() {
  const { data, error, isLoading, mutate } = useSWR<ConstellationResponse>(
    '/api/containers/constellation',
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  return {
    nodes: data?.nodes ?? [],
    links: data?.links ?? [],
    linkTypeCounts: data?.linkTypeCounts ?? {
      precedes: 0,
      spawned_from: 0,
      depends_on: 0,
      parent_of: 0,
    },
    isLoading,
    error,
    refresh: mutate,
  };
}
