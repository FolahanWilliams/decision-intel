'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface FilterState {
  search?: string;
  status?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
  biasType?: string;
  score?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  [key: string]: string | number | undefined;
}

/**
 * Hook for managing filter state in URL parameters
 * Provides persistent, shareable filter state
 */
export function useUrlFilters(defaults?: Partial<FilterState>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse current filters from URL
  const filters = useMemo<FilterState>(() => {
    const params: FilterState = { ...defaults };

    // Parse all URL params
    searchParams.forEach((value, key) => {
      if (key === 'page' || key === 'limit') {
        params[key] = parseInt(value, 10);
      } else if (key === 'sortOrder') {
        params[key] = value as 'asc' | 'desc';
      } else {
        params[key] = value;
      }
    });

    return params;
  }, [searchParams, defaults]);

  // Update a single filter
  const setFilter = useCallback(
    (key: string, value: string | number | undefined | null) => {
      const newParams = new URLSearchParams(searchParams.toString());

      if (value === undefined || value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }

      // Reset to page 1 when filters change (except when changing page itself)
      if (key !== 'page' && newParams.has('page')) {
        newParams.set('page', '1');
      }

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Update multiple filters at once
  const setFilters = useCallback(
    (updates: Partial<FilterState>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });

      // Reset to page 1 when filters change (except when changing page itself)
      if (!('page' in updates) && newParams.has('page')) {
        newParams.set('page', '1');
      }

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  // Clear specific filters
  const clearFilter = useCallback(
    (...keys: string[]) => {
      const newParams = new URLSearchParams(searchParams.toString());
      keys.forEach(key => newParams.delete(key));
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    const ignoreKeys = ['page', 'limit', 'sortBy', 'sortOrder'];
    for (const [key, value] of searchParams.entries()) {
      if (!ignoreKeys.includes(key) && value) {
        return true;
      }
    }
    return false;
  }, [searchParams]);

  // Get shareable URL
  const getShareableUrl = useCallback(() => {
    const url = new URL(window.location.href);
    return url.toString();
  }, []);

  // Toggle a filter value (useful for checkboxes/toggles)
  const toggleFilter = useCallback(
    (key: string, value: string) => {
      const current = filters[key];
      if (current === value) {
        setFilter(key, undefined);
      } else {
        setFilter(key, value);
      }
    },
    [filters, setFilter]
  );

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    clearFilter,
    hasActiveFilters,
    getShareableUrl,
    toggleFilter,
  };
}

// Helper hook for debounced search
import { useDebounce } from './useDebounce';

export function useSearchFilter(delay = 500) {
  const { filters, setFilter } = useUrlFilters();
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const debouncedSearch = useDebounce(localSearch, delay);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilter('search', debouncedSearch);
    }
  }, [debouncedSearch, filters.search, setFilter]);

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  return {
    search: localSearch,
    setSearch: setLocalSearch,
    urlSearch: filters.search,
  };
}

import { useState, useEffect } from 'react';