'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import type { ActivityItem } from '@/app/api/activity-feed/route';

interface ActivityFeedResponse {
  activities: ActivityItem[];
  nextCursor: string | null;
  total: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseActivityFeedOptions {
  types?: string[];
  limit?: number;
}

export function useActivityFeed(options?: UseActivityFeedOptions) {
  const { types, limit = 15 } = options || {};
  const [extraActivities, setExtraActivities] = useState<ActivityItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const typesParam = types?.length ? `&types=${types.join(',')}` : '';
  const url = `/api/activity-feed?limit=${limit}${typesParam}`;

  const { data, error, isLoading, mutate } = useSWR<ActivityFeedResponse>(url, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  const activities = [...(data?.activities || []), ...extraActivities];

  const loadMore = useCallback(async () => {
    const nextCursor = cursor || data?.nextCursor;
    if (!nextCursor) {
      setHasMore(false);
      return;
    }

    try {
      const res = await fetch(`${url}&cursor=${encodeURIComponent(nextCursor)}`);
      const result: ActivityFeedResponse = await res.json();
      setExtraActivities((prev) => [...prev, ...result.activities]);
      setCursor(result.nextCursor);
      if (!result.nextCursor || result.activities.length < limit) {
        setHasMore(false);
      }
    } catch {
      // silently fail
    }
  }, [cursor, data?.nextCursor, url, limit]);

  return {
    activities,
    isLoading,
    error,
    hasMore: hasMore && (data?.nextCursor != null || cursor != null),
    loadMore,
    refresh: mutate,
  };
}
