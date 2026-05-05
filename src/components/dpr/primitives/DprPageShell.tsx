/**
 * DPR Page Shell — the printed-page frame.
 *
 * Renders one A4 page with the navy header band, the canvas area for
 * content, and a footer pinned to the bottom 12mm of the page. Children
 * are the page content; the shell handles chrome.
 *
 * Locked 2026-05-05 — see /src/app/dpr-render/dpr.css for the visual
 * tokens this consumes.
 */

import type { ReactNode } from 'react';

export interface DprPageShellProps {
  /** Page number (1-indexed). Renders in the navy band + footer. */
  pageNumber: number;
  /** Total page count for the document. */
  totalPages: number;
  /** Document classification — appears as a chip in the header band. */
  classification?: 'sample' | 'specimen' | 'confidential' | 'client-safe-export';
  /** Document short title — appears in the footer. */
  documentTitle?: string;
  /** Audit timestamp (ISO-8601) — appears in the footer. */
  auditTimestamp?: string;
  /** Whether to skip the header band (used for cover page sometimes). */
  hideBand?: boolean;
  children: ReactNode;
}

const CLASSIFICATION_LABEL: Record<NonNullable<DprPageShellProps['classification']>, string> = {
  sample: 'Sample · for procurement evaluation',
  specimen: 'Specimen · public reference',
  confidential: 'Confidential',
  'client-safe-export': 'Client-safe export',
};

const CLASSIFICATION_FLAG_TONE: Record<
  NonNullable<DprPageShellProps['classification']>,
  string
> = {
  sample: 'dpr-page-band-flag',
  specimen: 'dpr-page-band-flag',
  confidential: 'dpr-page-band-flag',
  'client-safe-export': 'dpr-page-band-flag',
};

export function DprPageShell({
  pageNumber,
  totalPages,
  classification = 'confidential',
  documentTitle = 'Decision Provenance Record',
  auditTimestamp,
  hideBand = false,
  children,
}: DprPageShellProps) {
  const formattedTimestamp = auditTimestamp
    ? new Date(auditTimestamp).toISOString().replace('T', ' ').replace(/\..+$/, ' UTC')
    : '';

  return (
    <article className="dpr-page">
      {!hideBand && (
        <header className="dpr-page-band">
          <span className="dpr-page-band-mark">
            <span>Decision Intel</span>
            <span className="dpr-page-band-mark-rule" />
            <span>Decision Provenance Record</span>
          </span>
          <span className={CLASSIFICATION_FLAG_TONE[classification]}>
            {CLASSIFICATION_LABEL[classification]}
          </span>
        </header>
      )}
      <section className="dpr-page-canvas">{children}</section>
      <footer className="dpr-page-footer">
        <span>{documentTitle}</span>
        <span>
          Page {pageNumber} of {totalPages}
        </span>
        <span>{formattedTimestamp}</span>
      </footer>
    </article>
  );
}
