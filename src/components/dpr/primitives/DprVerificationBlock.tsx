/**
 * DPR Verification Block — explicit re-verification path with a copy-
 * pastable URL. Locked 2026-05-05 per master KB synthesis: procurement
 * reviewers expect to see HOW to independently verify the document, not
 * just that it claims to be tamper-evident.
 *
 * The honest-disclosure pattern: the block names what tamper-evidence
 * means TODAY (SHA-256 over canonicalised inputs) and what private-key
 * signing will mean WHEN it ships (Q3 2026 roadmap). Never overclaim.
 */

import type { ReactNode } from 'react';

export interface DprVerificationBlockProps {
  /** The deep-link URL where the record can be re-verified. */
  verifyUrl: string;
  /** Body explanation — the cryptographic verification path in plain English. */
  body: ReactNode;
  /** Optional honest-disclosure footnote (defaults to the locked statement). */
  disclosure?: ReactNode;
}

const DEFAULT_DISCLOSURE = (
  <>
    Tamper-evidence today: SHA-256 over canonicalised inputs. Private-key signing of the record
    itself is on the published roadmap (Q3 2026); the schema is forward-compatible. The record
    fingerprint will become a digital signature without breaking re-verification of older records.
  </>
);

export function DprVerificationBlock({
  verifyUrl,
  body,
  disclosure = DEFAULT_DISCLOSURE,
}: DprVerificationBlockProps) {
  return (
    <aside className="dpr-verification">
      <div className="dpr-verification-head">
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M3 5l1.5 1.5L7 4"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>How to verify this record</span>
      </div>
      <p className="dpr-verification-body">{body}</p>
      <a className="dpr-verification-url dpr-mono" href={verifyUrl}>
        {verifyUrl.replace(/^https?:\/\//, '')}
      </a>
      <p className="dpr-verification-disclosure">{disclosure}</p>
    </aside>
  );
}
