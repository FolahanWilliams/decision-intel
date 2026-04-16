import { useSyncExternalStore } from 'react';

/**
 * useReducedMotion
 *
 * Subscribes to the `prefers-reduced-motion: reduce` media query via
 * useSyncExternalStore. This is the canonical React pattern for external
 * state sources — avoids the `react-hooks/set-state-in-effect` lint error
 * that the previous useEffect-based implementation triggered.
 */

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
