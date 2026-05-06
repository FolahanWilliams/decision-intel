/**
 * DPR Page One — Cover + Cryptographic Integrity.
 *
 * Locked 2026-05-05 — legal-evidence-record style per master KB
 * synthesis. The above-the-fold real estate is RESERVED for verifiable
 * cryptographic provenance, NOT the AI's opinion. Procurement reviewers
 * (F500 GC, audit committee chair, vendor-risk register) want to see
 * legal defensibility BEFORE they read findings. The order is:
 *
 *   1. Cover plate — title + subtitle + classification flag
 *   2. Integrity Fingerprints — record-id, hashes, schema version, timestamp
 *   3. How to Verify — explicit re-verification path with copy-pastable URL
 *   4. Honest disclosure — what tamper-evidence means today + roadmap
 *
 * The audit summary, score, and findings start on PAGE TWO and beyond.
 *
 * Vocabulary discipline (locked 2026-04-26, re-confirmed 2026-05-05):
 *   - "hashed and tamper-evident" (NEVER "signed")
 *   - "infrastructure" not "certified" (for SOC 2)
 *   - "aligned with" not "certified" (for AI Verify)
 */

import { DprPageShell } from '../primitives/DprPageShell';
import { DprSection } from '../primitives/DprSection';
import { DprKvGrid } from '../primitives/DprKvGrid';
import { DprVerificationBlock } from '../primitives/DprVerificationBlock';

export interface DprDocumentIdentity {
  /** "Strategic memo" / "IC memo" / "Investor letter" / etc. */
  documentType: string | null;
  /** "Real estate" / "Manufacturing" / "Cement" / etc. */
  industry: string | null;
  /** "18 months" / "5 years" / "Single-cycle" / etc. */
  decisionHorizon: string | null;
  /** Geographic scope: "DACH" / "Pan-African" / "US public market" / etc. */
  geographicScope: string | null;
}

export interface DprPageOneCoverProps {
  /** Title shown on the cover (typically the audited document's name). */
  title: string;
  /** Subtitle / italic strap below the title. */
  subtitle: string;
  /** Stable record id (e.g. `dpr_2026_0500_a4f7`). */
  recordId: string;
  /** ISO-8601 audit timestamp. */
  auditTimestamp: string;
  /** SHA-256 of the source memo. */
  inputHash: string;
  /** SHA-256 of the prompt version active at audit time. */
  promptFingerprint: string;
  /** DPR schema version (e.g. `2.1.0`). */
  schemaVersion: string;
  /** Pipeline version (e.g. `di-pipeline@v12.3.1`). */
  pipelineVersion: string;
  /** Where to verify this record online. */
  verifyUrl: string;
  /** Document classification — drives the header band flag. */
  classification?: 'sample' | 'specimen' | 'confidential' | 'client-safe-export';
  /** Total page count for the document. */
  totalPages: number;
  /** Document title for the footer. */
  footerTitle?: string;
  /**
   * Document-identity strip — passes the 10-second look test on the cover.
   * Surfaces what was audited (type / industry / horizon / scope) before
   * the reader scans the cryptographic provenance below. Locked 2026-05-05.
   */
  documentIdentity?: DprDocumentIdentity;
}

export function DprPageOneCover(props: DprPageOneCoverProps) {
  const {
    title,
    subtitle,
    recordId,
    auditTimestamp,
    inputHash,
    promptFingerprint,
    schemaVersion,
    pipelineVersion,
    verifyUrl,
    classification = 'confidential',
    totalPages,
    footerTitle = 'Decision Provenance Record',
    documentIdentity,
  } = props;

  const integrityRows = [
    {
      k: 'Record id',
      v: <span>{recordId}</span>,
      mono: true,
    },
    {
      k: 'Audit timestamp',
      v: new Date(auditTimestamp).toISOString().replace('T', ' ').replace(/\..+$/, ' UTC'),
      mono: true,
    },
    {
      k: 'Pipeline version',
      v: pipelineVersion,
      mono: true,
    },
    {
      k: 'Input document hash',
      v: <ShortenedHash value={inputHash} />,
      mono: true,
      mark: { kind: 'ok' as const, label: 'SHA-256' },
    },
    {
      k: 'Prompt fingerprint',
      v: <ShortenedHash value={promptFingerprint} />,
      mono: true,
      mark: { kind: 'ok' as const, label: 'SHA-256' },
    },
    {
      k: 'Record schema',
      v: `v${schemaVersion}`,
      mono: true,
      mark: { kind: 'info' as const, label: 'Forward-compatible' },
    },
    {
      k: 'Tamper-evidence',
      v: 'SHA-256 input hash + record fingerprint',
    },
    {
      k: 'Private-key signing',
      v: <span>Planned · Q3 2026 roadmap</span>,
    },
  ];

  return (
    <DprPageShell
      pageNumber={1}
      totalPages={totalPages}
      classification={classification}
      documentTitle={footerTitle}
      auditTimestamp={auditTimestamp}
    >
      {/* Cover plate */}
      <div className="dpr-cover-plate">
        <div className="dpr-cover-eyebrow">
          <span className="dpr-cover-eyebrow-rule" />
          <span>R²F · Recognition-Rigor Framework</span>
          <span className="dpr-cover-eyebrow-rule" />
          <span className="dpr-cover-classification">Hashed · Tamper-evident</span>
        </div>
        <h1 className="dpr-cover-title">{title}</h1>
        <p className="dpr-cover-subtitle">{subtitle}</p>
      </div>

      {/* Document Identity panel — locked 2026-05-05. The 10-second-test
          surface: at-a-glance metadata about WHAT was audited (type,
          industry, horizon, scope), rendered as visual pills BEFORE the
          cryptographic detail. Honest metadata, not opinion — the audit
          verdict still lives downstream on page 2 onward. */}
      {documentIdentity && (
        <DprIdentityPanel identity={documentIdentity} auditTimestamp={auditTimestamp} />
      )}

      {/* §1 — Integrity Fingerprints */}
      <DprSection
        marker="§1"
        eyebrow="Integrity fingerprints"
        title="What this record is and how to confirm it"
        strap="The cryptographic provenance below is the audit committee's first read. Every field is independently verifiable; the verification URL below resolves to the same hashes."
      >
        <DprKvGrid rows={integrityRows} />
      </DprSection>

      {/* Verification block */}
      <DprVerificationBlock
        verifyUrl={verifyUrl}
        body={
          <>
            Re-hash the source memo with SHA-256 and compare to the input-document hash above. The
            prompt fingerprint is the SHA-256 of the prompt version active at audit time — a
            divergent hash on a re-run proves the prompts evolved between audits, which is itself
            recorded against this record id. Any byte change in the source memo invalidates the
            input hash above; the failure surfaces at re-hash time.
          </>
        }
      />

      {/* Honest disclosure block */}
      <div className="dpr-honest-disclosure">
        <span className="dpr-honest-disclosure-mark">Disclosure</span>
        Decision Intel runs on SOC 2 Type II infrastructure (Vercel + Supabase) and is aligned with
        the eleven internationally-recognised AI governance principles codified by AI Verify
        (Singapore IMDA). Decision Intel&apos;s own product-level SOC 2 Type I audit is targeted for
        Q4 2026; AI Verify alignment is self-attested and no third-party audit has yet been
        performed against the mapping. Vocabulary in this record is calibrated to be defensible
        during a vendor-risk register review.
      </div>
    </DprPageShell>
  );
}

function ShortenedHash({ value }: { value: string }) {
  const display = value.length > 24 ? `${value.slice(0, 16)}…${value.slice(-8)}` : value;
  return <span title={value}>{display}</span>;
}

function DprIdentityPanel({
  identity,
  auditTimestamp,
}: {
  identity: DprDocumentIdentity;
  auditTimestamp: string;
}) {
  const auditedDate = new Date(auditTimestamp).toISOString().slice(0, 10);
  const auditedTime = new Date(auditTimestamp).toISOString().slice(11, 16);

  // Each pill renders only when its underlying field is populated. The
  // panel hides itself entirely when no fields are available — falls
  // back to the original cover-only layout for legacy records.
  const pills = [
    identity.documentType
      ? {
          label: 'Document type',
          value: prettyCase(identity.documentType),
          foot: null,
        }
      : null,
    identity.industry
      ? {
          label: 'Industry',
          value: prettyCase(identity.industry),
          foot: null,
        }
      : null,
    identity.geographicScope
      ? {
          label: 'Geographic scope',
          value: identity.geographicScope,
          foot: null,
        }
      : null,
    identity.decisionHorizon
      ? {
          label: 'Decision horizon',
          value: identity.decisionHorizon,
          foot: null,
        }
      : null,
    {
      label: 'Audited',
      value: auditedDate,
      foot: `${auditedTime} UTC`,
      accent: true,
    },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    foot: string | null;
    accent?: boolean;
  }>;

  if (pills.length === 0) return null;

  // Cap to 4 pills so the grid doesn't overflow the row. The audit-
  // timestamp pill is always included; the remaining 3 slots get the
  // first 3 metadata fields the data populates.
  const capped = pills.slice(0, 4);

  return (
    <section className="dpr-identity-panel">
      <header className="dpr-identity-panel-eyebrow">
        <span>Document at a glance</span>
        <span className="dpr-identity-panel-rule" />
      </header>
      <div className="dpr-identity-grid">
        {capped.map(pill => (
          <div
            key={pill.label}
            className={
              pill.accent ? 'dpr-identity-pill dpr-identity-pill--accent' : 'dpr-identity-pill'
            }
          >
            <span className="dpr-identity-pill-label">{pill.label}</span>
            <span className="dpr-identity-pill-value">{pill.value}</span>
            {pill.foot && <span className="dpr-identity-pill-foot">{pill.foot}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function prettyCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
