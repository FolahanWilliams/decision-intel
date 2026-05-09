/**
 * SWR hooks for DecisionContainer surfaces (Phase 2 — replaces deleted
 * src/hooks/useDeals.ts). One hook fits all three modes (investment /
 * acquisition / strategic) — UI consumers pass a `kind` filter when
 * they want a mode-scoped view (e.g. ContainerKanban defaulting to
 * acquisition mode for a mid-market corp dev user).
 */

import useSWR from 'swr';
import type {
  ContainerSummary,
  ContainerDetail,
  ContainerListResponse,
  ContainerFilters,
} from '@/types/containers';
import type { DecisionContainerKind } from '@/lib/data/decision-container-modes';

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

interface UseContainersResult {
  containers: ContainerSummary[];
  pagination: ContainerListResponse['pagination'] | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

export function useContainers(
  filters?: ContainerFilters,
  page = 1,
  limit = 50
): UseContainersResult {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filters?.kind) params.set('kind', filters.kind);
  if (filters?.stageId) params.set('stageId', filters.stageId);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.sector) params.set('sector', filters.sector);
  if (filters?.ticketSizeMin != null) params.set('ticketSizeMin', String(filters.ticketSizeMin));
  if (filters?.ticketSizeMax != null) params.set('ticketSizeMax', String(filters.ticketSizeMax));

  const { data, error, isLoading, mutate } = useSWR<ContainerListResponse>(
    `/api/containers?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    containers: data?.data ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    error: error ?? null,
    mutate,
  };
}

interface UseContainerResult {
  container: ContainerDetail | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

export function useContainer(id: string | null | undefined): UseContainerResult {
  const { data, error, isLoading, mutate } = useSWR<ContainerDetail>(
    id ? `/api/containers/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    container: data ?? null,
    isLoading,
    error: error ?? null,
    mutate,
  };
}

/**
 * Convenience helper — given a HXC role, returns the most-relevant
 * container kind to default the kanban filter to. Per the Phase 2
 * persona-aware kanban-defaults lock.
 *
 * - Small-fund GP / fractional CSO → investment
 * - Mid-market corp dev head / PE-backed founder → acquisition
 * - Other / unknown → undefined (show all modes)
 */
export function defaultContainerKindForRole(
  role: string | null | undefined
): DecisionContainerKind | undefined {
  if (role === 'pe_vc' || role === 'cso') return 'investment';
  if (role === 'ma') return 'acquisition';
  if (role === 'bizops') return 'strategic';
  return undefined;
}
