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
  repeat,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Optional additional CSS transition delay (ms) for staggered reveals. */
  delay?: number;
  /** If true, subtly re-reveals on every entry (not just first). */
  repeat?: boolean;
}) {
  const ref = useScrollReveal<HTMLDivElement>({ repeat });
  const mergedStyle: CSSProperties = delay
    ? { ...style, transitionDelay: `${delay}ms` }
    : (style ?? {});
  const baseClass = repeat ? 'scroll-reveal scroll-reveal-subtle' : 'scroll-reveal';
  return (
    <div
      ref={ref}
      className={className ? `${baseClass} ${className}` : baseClass}
      style={mergedStyle}
    >
      {children}
    </div>
  );
}
