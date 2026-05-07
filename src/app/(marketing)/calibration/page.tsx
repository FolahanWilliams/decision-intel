import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/**
 * /calibration — permanent redirect to /r2f-standard#calibration.
 *
 * Item 2 lock 2026-05-07. The calibration evidence (Brier 0.258 over the
 * 143-case library, Tetlock-anchored scale, methodology version
 * progression, reproducibility seed) lives as a section on the existing
 * /r2f-standard page rather than as a separate page — calibration IS
 * R²F evidence, not a separate moat. The /calibration route exists so
 * an investor diligence email or DM can carry a single short URL that
 * lands on the right anchor.
 *
 * Why merge instead of separate page (founder decision 2026-05-07):
 *   1. Page-proliferation discipline — the marketing surface count is
 *      already at the discoverability ceiling.
 *   2. Conceptual unity — Brier 0.258 is procurement-grade evidence the
 *      R²F methodology works; splitting them implies independent
 *      concepts when they aren't.
 *   3. Drift surface — one page = one place to maintain. Two pages =
 *      "did we update the Brier in both places?" drift class waiting
 *      to happen.
 */

export const metadata: Metadata = {
  title: 'Calibration baseline · Decision Intel',
  description:
    'Procurement-grade calibration evidence for the Decision Intel reasoning audit platform — Brier baseline across the historical case library with reproducibility seed.',
  // Investor-diligence URL — keep indexable so a Reiner / Gabe DM that
  // lands here can be found via search if needed. The 308 redirect
  // signals canonical to crawlers.
  robots: 'index, follow',
};

export default function CalibrationRedirect() {
  redirect('/r2f-standard#calibration');
}
