import useSWR from 'swr';
import { type BiasGenomeResult } from '@/lib/learning/bias-genome';

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch bias genome');
    return r.json();
  });

interface BiasGenomeResponse {
  genome: BiasGenomeResult;
  orgStats: Array<{ biasType: string; prevalence: number; count: number }>;
}

export function useBiasGenome() {
  const { data, error, isLoading } = useSWR<BiasGenomeResponse>('/api/bias-genome', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 300_000,
    dedupingInterval: 120_000,
  });

  return {
    genome: data?.genome,
    orgStats: data?.orgStats,
    isLoading,
    error,
  };
}
