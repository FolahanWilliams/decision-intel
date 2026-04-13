'use client';

import { useEffect, useRef } from 'react';

/**
 * useScrollReveal — toggles `.is-visible` on the target element when it
 * scrolls into view. Pair with the `.scroll-reveal` CSS class defined in
 * globals.css for a fade + slight translateY animation.
 *
 * Usage:
 *   const ref = useScrollReveal<HTMLDivElement>();
 *   <div ref={ref} className="scroll-reveal">...</div>
 *
 * One-shot by default: once revealed, the observer disconnects so the
 * element stays visible when the user scrolls back up.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  /** Intersection threshold (0–1). Default 0.15 (15% visible). */
  threshold?: number;
  /** Margin in px around the viewport when checking intersection. */
  rootMargin?: string;
  /** If true, keeps observing so element can fade back out. Default false. */
  repeat?: boolean;
}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect users who prefer reduced motion — show immediately.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      el.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible');
            if (!options?.repeat) observer.disconnect();
          } else if (options?.repeat) {
            el.classList.remove('is-visible');
          }
        }
      },
      {
        threshold: options?.threshold ?? 0.15,
        rootMargin: options?.rootMargin ?? '0px 0px -60px 0px',
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.threshold, options?.rootMargin, options?.repeat]);

  return ref;
}
