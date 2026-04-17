'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { type CSSProperties, type ReactNode } from 'react';

/**
 * Reveal — drop-in wrapper that fades + lifts its children into view as
 * they scroll into the viewport. Layout-neutral (plain div with your own
 * className/style). Uses `.scroll-reveal` CSS from globals.css.
 *
 * Usage:
 *   <Reveal><section>...</section></Reveal>
 *   <Reveal className="my-grid" style={{ padding: 24 }}>...</Reveal>
 */
export function Reveal({
  children,
  className,
  style,
  delay,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Optional additional CSS transition delay (ms) for staggered reveals. */
  delay?: number;
}) {
  const ref = useScrollReveal<HTMLDivElement>();
  const mergedStyle: CSSProperties = delay
    ? { ...style, transitionDelay: `${delay}ms` }
    : (style ?? {});
  return (
    <div
      ref={ref}
      className={className ? `scroll-reveal ${className}` : 'scroll-reveal'}
      style={mergedStyle}
    >
      {children}
    </div>
  );
}
