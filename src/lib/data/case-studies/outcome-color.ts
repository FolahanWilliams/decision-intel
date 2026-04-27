/**
 * Case-study outcome color helper — consolidated 2026-04-27 during the
 * slop-scan Phase 3 dedup. Previously copy-pasted in 3 marketing surfaces
 * (CaseStudyCarousel, case-studies/[slug]/page, case-studies/CaseStudyGrid).
 */

import type { CaseStudy } from './types';
import { isFailureOutcome, isSuccessOutcome } from './types';

/** Returns the {bg, fg} hex colors for rendering a case-study outcome
 *  badge. Failure → red, success → green, fallback → amber. */
export function outcomeColor(outcome: CaseStudy['outcome']): { bg: string; fg: string } {
  if (isFailureOutcome(outcome)) return { bg: '#FEE2E2', fg: '#991B1B' };
  if (isSuccessOutcome(outcome)) return { bg: '#DCFCE7', fg: '#166534' };
  return { bg: '#FEF3C7', fg: '#92400E' };
}
