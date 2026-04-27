'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * usePersistedChecks — localStorage-backed `Record<string, boolean>` that
 * respects React 19's `react-hooks/set-state-in-effect` rule.
 *
 * The usual `useEffect + setState` pattern for localStorage hydration is
 * banned in React 19. `useSyncExternalStore` is the compliant primitive.
 * SSR snapshot returns an empty object so hydration matches.
 */

const listeners = new Map<string, Set<() => void>>();

function emit(key: string) {
  listeners.get(key)?.forEach(l => l());
}

function subscribe(key: string, callback: () => void): () => void {
  const set = listeners.get(key) ?? new Set();
  set.add(callback);
  listeners.set(key, set);
  if (typeof window !== 'undefined') {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) callback();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      set.delete(callback);
      window.removeEventListener('storage', onStorage);
    };
  }
  return () => {
    set.delete(callback);
  };
}

function readSnapshot(key: string): string {
  if (typeof window === 'undefined') return '{}';
  try {
    return localStorage.getItem(key) ?? '{}';
  } catch {
    return '{}';
  }
}

export function usePersistedChecks(storageKey: string): {
  checks: Record<string, boolean>;
  toggle: (id: string) => void;
} {
  const raw = useSyncExternalStore(
    cb => subscribe(storageKey, cb),
    () => readSnapshot(storageKey),
    () => '{}'
  );

  let parsed: Record<string, boolean> = {};
  try {
    parsed = JSON.parse(raw) as Record<string, boolean>;
  } catch {
    parsed = {};
  }

  const toggle = useCallback(
    (id: string) => {
      if (typeof window === 'undefined') return;
      let current: Record<string, boolean> = {};
      try {
        current = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Record<string, boolean>;
      } catch {
        current = {};
      }
      const next = { ...current, [id]: !current[id] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // localStorage may throw on quota / private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
      }
      emit(storageKey);
    },
    [storageKey]
  );

  return { checks: parsed, toggle };
}
