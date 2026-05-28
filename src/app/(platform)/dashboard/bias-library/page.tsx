/**
 * /dashboard/bias-library — in-platform reference for the 22-bias R²F
 * taxonomy.
 *
 * Shipped 2026-05-28 as honorable-mention #5 from the 2026-05-28 nightly
 * audit. Public /taxonomy is the marketing-side surface; this is the
 * IN-PRODUCT reference panel users reach while running audits ("what
 * does Inside-View Dominance mean again?"). Pulls from the canonical
 * BIAS_EDUCATION SSOT — every detail (academic citation, debiasing
 * techniques, related biases, real-world example) renders verbatim from
 * the taxonomy, never duplicated.
 *
 * UX:
 *   - Searchable + filterable list of all canonical biases
 *   - Group by category (Judgment / Group Dynamics / Overconfidence /
 *     Loss Aversion / Framing / Memory / Cognitive / Social / Cognitive
 *     Heuristic)
 *   - Filter chips by difficulty (easy / moderate / hard)
 *   - Click → side drawer with full academic citation + DOI link + all
 *     debiasing techniques + related biases (clickable to navigate
 *     within the drawer) + cross-link to /case-studies and /taxonomy
 *
 * Why this matters: a user running an audit on Tuesday afternoon
 * cannot pause to read a 12,000-word /taxonomy page. They need the
 * one-screen reference + the academic anchor for their audit committee
 * defence. This page is that.
 */

import type { Metadata } from 'next';
import { BiasLibraryContent } from '@/components/dashboard/bias-library/BiasLibraryContent';

export const metadata: Metadata = {
  title: 'Bias Library · Decision Intel',
  description:
    'In-platform reference for the 22-bias Recognition-Rigor Framework taxonomy — searchable, filterable, with academic citations and debiasing techniques.',
};

export default function BiasLibraryPage() {
  return (
    <main style={{ padding: '24px 24px 96px' }}>
      <BiasLibraryContent />
    </main>
  );
}
