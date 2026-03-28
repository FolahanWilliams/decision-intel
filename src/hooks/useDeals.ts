import useSWR from 'swr';
import type { DealSummary, DealDetail, DealFilters } from '@/types/deals';

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

interface DealsResponse {
  data: DealSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DealDetailResponse extends DealDetail {
  outcome: DealDetail['outcome'];
  documents: DealDetail['documents'];
}

/**
 * SWR hook for fetching the deal list with filtering and pagination.
 */
export function useDeals(filters?: DealFilters, page = 1, limit = 50) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filters?.stage) params.set('stage', filters.stage);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.dealType) params.set('dealType', filters.dealType);
  if (filters?.sector) params.set('sector', filters.sector);

  const url = `/api/deals?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<DealsResponse>(url, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return {
    deals: data?.data ?? [],
    total: data?.pagination?.total ?? 0,
    totalPages: data?.pagination?.totalPages ?? 1,
    isLoading,
    error,
    mutate,
  };
}

/**
 * SWR hook for fetching a single deal with outcome and documents.
 * Uses the GET /api/deals/[id]/outcome endpoint.
 */
export function useDeal(id: string | null) {
  const url = id ? `/api/deals/${id}/outcome` : null;

  const { data, error, isLoading, mutate } = useSWR<DealDetailResponse>(url, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return {
    deal: data ?? null,
    isLoading,
    error,
    mutate,
  };
}
