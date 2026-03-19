'use client';

import { MotionConfig } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * Wraps the app with framer-motion's MotionConfig so that
 * `prefers-reduced-motion: reduce` is respected by all motion
 * components (they will skip to the final state instantly).
 */
export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
