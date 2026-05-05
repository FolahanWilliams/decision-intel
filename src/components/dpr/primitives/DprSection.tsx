/**
 * DPR Section — typed eyebrow + title + strap pattern used across every
 * DPR section. Lives at the top of every block (Integrity Fingerprints,
 * Methodology, Findings, etc.).
 */

import type { ReactNode } from 'react';

export interface DprSectionProps {
  /** Numbered section marker (e.g. "§1") rendered before the eyebrow. */
  marker?: string;
  /** Eyebrow text — small uppercase label above the title. */
  eyebrow: string;
  /** Section title — display-weight serif. */
  title: string;
  /** Optional one-line strap below the title. */
  strap?: string;
  /** Section body. */
  children: ReactNode;
}

export function DprSection({ marker, eyebrow, title, strap, children }: DprSectionProps) {
  return (
    <section className="dpr-section">
      <div className="dpr-section-eyebrow">
        <span className="dpr-section-eyebrow-rule" />
        {marker ? <span>{marker}</span> : null}
        <span>{eyebrow}</span>
      </div>
      <h2 className="dpr-section-title dpr-display">{title}</h2>
      {strap ? <p className="dpr-section-strap">{strap}</p> : null}
      {children}
    </section>
  );
}
