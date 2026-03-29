import useSWR from 'swr';
import { type OrgFingerprint } from '@/lib/learning/fingerprint-engine';

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch fingerprint');
    return r.json();
  });

export function useFingerprint() {
  const { data, error, isLoading, mutate } = useSWR<OrgFingerprint>('/api/fingerprint', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 120_000,
    dedupingInterval: 60_000,
  });

  return {
    fingerprint: data,
    isLoading,
    error,
    mutate,
  };
}
