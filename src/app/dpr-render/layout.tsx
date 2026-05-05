/**
 * DPR rendering layout — print-only, no app chrome.
 *
 * The /dpr-render/* routes are the McKinsey-grade single source of truth
 * for the Decision Provenance Record. Locked 2026-05-05 — see CLAUDE.md
 * "DPR architecture lock 2026-05-05" for the architectural rationale
 * (HTML/CSS via Next.js + Puppeteer for server PDF + window.print() for
 * client export, replacing the prior 1,696-LOC jsPDF generator).
 *
 * This layout deliberately omits MarketingNav, the platform sidebar, the
 * bottom CTA, and every piece of app chrome — the route is consumed in
 * three contexts:
 *
 *   1. Browser preview during development (open the URL directly)
 *   2. window.print() from the client-side Export DPR button (the user's
 *      browser opens this URL in a new tab and triggers print)
 *   3. Puppeteer server-side via /api/dpr/render-pdf — the headless
 *      browser navigates to this URL and exports page.pdf()
 *
 * Print stylesheet + screen stylesheet are co-located in dpr.css so the
 * browser preview matches the printed output 1:1 (no surprise reflows).
 *
 * Auth: per-route check inside [type]/[id]/page.tsx — specimen routes
 * are public (rate-limited at the API layer), document/package/deal
 * routes require Supabase auth + ownership verification.
 */

import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/source-serif-4/700.css';
import '@fontsource/source-serif-4/400-italic.css';
import './dpr.css';

export const metadata = {
  title: 'Decision Provenance Record · Decision Intel',
  description:
    'Hashed and tamper-evident evidence record. Decision Intel · Recognition-Rigor Framework.',
  robots: { index: false, follow: false },
};

export default function DprRenderLayout({ children }: { children: React.ReactNode }) {
  return <div className="dpr-document-root">{children}</div>;
}
