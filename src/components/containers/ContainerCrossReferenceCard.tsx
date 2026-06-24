'use client';

/**
 * ContainerCrossReferenceCard — renders the latest cross-reference run
 * findings on the container detail page.
 *
 * Reads from container.latestCrossReference.findings (which can be
 * either the legacy bare array shape OR the wrapped {findings, summary}
 * shape — normalized inline). Each finding shows severity-coded
 * conflict type + per-claim evidence quotes with deep-links to the
 * underlying documents.
 *
 * Phase 3 P3.2 — closes the procurement-grade gap where conflicts
 * existed but didn't render.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GitCompareArrows, AlertCircle } from 'lucide-react';
import { severityColor } from '@/lib/utils/severity';
import type {
  ContainerCrossReferenceRun,
  ContainerCrossReferenceFinding,
} from '@/types/containers';

interface ContainerCrossReferenceCardProps {
  run: ContainerCrossReferenceRun | null;
  /** Map containerId/documentId hover-tooltip to a friendly filename. */
  documentMap?: Record<string, { filename: string }>;
}

/**
 * Normalize the on-disk findings shape — the cross-reference agent
 * carries an optional summary wrapper; older rows may be a bare array.
 * Mirrors the legacy extractCrossReferenceFindings utility behaviour.
 */
function extractFindings(
  raw: ContainerCrossReferenceRun['findings']
): ContainerCrossReferenceFinding[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && 'findings' in raw && Array.isArray(raw.findings)) {
    return raw.findings;
  }
  return [];
}

function severityRank(s: string): number {
  if (s === 'critical') return 4;
  if (s === 'high') return 3;
  if (s === 'medium') return 2;
  return 1;
}

export function ContainerCrossReferenceCard({
  run,
  documentMap,
}: ContainerCrossReferenceCardProps) {
  // Capture mount time once via lazy useState init — Date.now() at render
  // would violate react-hooks/purity. Minute-level precision is fine for
  // an "as of Xh ago" label.
  const [mountTime] = useState(() => Date.now());
  const findings = useMemo(
    () =>
      run
        ? extractFindings(run.findings)
            .slice()
            .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
        : [],
    [run]
  );
  if (!run) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          color: 'var(--text-muted)',
          fontSize: 'var(--fs-sm)',
          textAlign: 'center',
        }}
      >
        <GitCompareArrows
          size={20}
          style={{ display: 'block', margin: '0 auto 8px', color: 'var(--text-muted)' }}
        />
        No cross-reference run yet. Click <strong>Cross-reference</strong> above when ≥2 documents
        are analyzed to surface conflicts across the container.
      </div>
    );
  }

  const runDate = new Date(run.runAt);
  const ageHours = Math.round((mountTime - runDate.getTime()) / (1000 * 60 * 60));
  const ageLabel =
    ageHours < 1
      ? 'just now'
      : ageHours < 24
        ? `${ageHours}h ago`
        : `${Math.round(ageHours / 24)}d ago`;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 'var(--fs-2xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            Cross-document review
          </div>
          <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600 }}>
            {run.conflictCount === 0
              ? 'No conflicts flagged'
              : `${run.conflictCount} conflict${run.conflictCount === 1 ? '' : 's'} flagged`}{' '}
            {run.highSeverityCount > 0 && (
              <span style={{ color: 'var(--error)', fontVariantNumeric: 'tabular-nums' }}>
                · {run.highSeverityCount} high+
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            fontSize: 'var(--fs-2xs)',
            color: 'var(--text-muted)',
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          As of {ageLabel}
          <div style={{ fontSize: 'var(--fs-3xs)', marginTop: 2, fontStyle: 'italic' }}>
            {run.modelVersion}
          </div>
        </div>
      </div>

      {findings.length === 0 ? (
        <div
          style={{
            padding: 12,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(34, 197, 94, 0.04)',
            borderLeft: '3px solid var(--success)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          The cross-reference agent compared the latest analyses on every member document and found
          no contradicting claims. Re-run when new documents land.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {findings.map((finding, i) => (
            <FindingRow key={i} finding={finding} documentMap={documentMap} />
          ))}
        </div>
      )}
    </div>
  );
}

function FindingRow({
  finding,
  documentMap,
}: {
  finding: ContainerCrossReferenceFinding;
  documentMap?: Record<string, { filename: string }>;
}) {
  const sevColor = severityColor(finding.severity);
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${sevColor}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
          marginBottom: 6,
        }}
      >
        <AlertCircle size={14} style={{ color: sevColor, flexShrink: 0, marginTop: 3 }} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{finding.summary}</span>
            <span
              style={{
                fontSize: 'var(--fs-3xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: sevColor,
                fontWeight: 600,
              }}
            >
              {finding.severity}
            </span>
            <span
              style={{
                fontSize: 'var(--fs-3xs)',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                textTransform: 'lowercase',
              }}
            >
              {finding.type.replace(/_/g, ' ')}
            </span>
          </div>
          <p
            style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {finding.whyItMatters}
          </p>
        </div>
      </div>

      {finding.claims.length > 0 && (
        <div
          style={{
            marginLeft: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {finding.claims.map((claim, i) => {
            const filename =
              claim.documentName || documentMap?.[claim.documentId]?.filename || 'Document';
            return (
              <div
                key={i}
                style={{
                  padding: 8,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <Link
                  href={`/documents/${claim.documentId}`}
                  style={{
                    fontSize: 'var(--fs-2xs)',
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  {filename} →
                </Link>
                <p
                  style={{
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-secondary)',
                    margin: '4px 0 0',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  &ldquo;{claim.excerpt}&rdquo;
                </p>
              </div>
            );
          })}
        </div>
      )}

      {finding.resolutionQuestion && (
        <div
          style={{
            marginTop: 8,
            marginLeft: 22,
            padding: 8,
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(22, 163, 74, 0.04)',
            borderLeft: '2px solid var(--accent-primary)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-primary)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--fs-3xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--accent-primary)',
              fontWeight: 600,
              marginRight: 6,
            }}
          >
            Resolve
          </span>
          {finding.resolutionQuestion}
        </div>
      )}
    </div>
  );
}
