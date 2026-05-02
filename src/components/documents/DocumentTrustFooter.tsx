'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { SOC2_RECEIPTS } from '@/lib/constants/trust-copy';
import { PLANS } from '@/lib/stripe';

interface DocumentTrustFooterProps {
  /** Document.uploadedAt — ISO string or Date. */
  uploadedAt: string | Date;
}

type PlanKey = keyof typeof PLANS;
const PLAN_KEYS: readonly PlanKey[] = ['free', 'pro', 'team', 'enterprise'] as const;
function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === 'string' && (PLAN_KEYS as readonly string[]).includes(value);
}

/**
 * Document trust posture surfaced at the top of the doc-detail page —
 * James-class procurement-grade signal. F500 vendor-risk reviewers open
 * intake calls with three questions: who has hands on this data, how
 * long is it kept, and what are the contractual carve-outs. The
 * answers all live in canonical sources (SOC2_RECEIPTS, PLANS,
 * INDEMNIFICATION_*) but the audit committee chair shouldn't have to
 * scroll past the audit findings to reach /security.
 *
 * Sub-processor list = SOC2_RECEIPTS (canonical, SOC 2-attested only).
 * Retention = Document.uploadedAt + PLANS[plan].retentionDays.
 * Plan fetched via /api/billing on mount (mirrors usePlanLabels hook
 * pattern). Loading flicker is acceptable — content is metadata, not
 * action-blocking.
 *
 * Links out to:
 *   - /security#soc2-receipts (full audit metadata for each sub-processor)
 *   - /security#vendor-continuity (indemnification cap + carve-outs)
 *   - /privacy (full processor list including Resend + Cloudflare; the
 *     8-entry list lives there because they aren't all SOC 2-attested)
 *
 * Anchored under the doc-detail page-header chip row, above the
 * 4-state view machine. Subordinate visual weight (small font, muted
 * color) so it's a procurement signal not a hero element.
 */
export function DocumentTrustFooter({ uploadedAt }: DocumentTrustFooterProps) {
  const [plan, setPlan] = useState<PlanKey>('free');
  const [planLoaded, setPlanLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/billing')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled) return;
        if (data?.plan && isPlanKey(data.plan)) {
          setPlan(data.plan);
        }
        setPlanLoaded(true);
      })
      .catch(err => {
        console.warn('[DocumentTrustFooter] /api/billing fetch failed:', err);
        if (!cancelled) setPlanLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const planConfig = PLANS[plan];
  const retentionDays = planConfig.retentionDays;
  const planLabel = planConfig.name;

  const uploadedDate = typeof uploadedAt === 'string' ? new Date(uploadedAt) : uploadedAt;
  const expiresAt = new Date(uploadedDate.getTime() + retentionDays * 86_400_000);
  const daysRemaining = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
  );

  // Show the full SOC2_RECEIPTS list (5 entries: Controller + 4 sub-processors).
  // Strip the parenthetical role qualifier and corporate suffix for compact
  // chip-row display. The Controller row carries status='targeted' so the GC
  // sees the in-flight Type I attestation honestly named, not glossed over.
  const receipts = SOC2_RECEIPTS.map(r => {
    const label = r.party
      .replace(/\s*\([^)]+\)\s*$/, '')
      .replace(/\s+(Inc\.|Ltd\.)$/, '');
    return { label, status: r.status };
  });

  return (
    <div
      className="document-trust-footer"
      style={{
        marginBottom: 'var(--spacing-md)',
        padding: '10px 14px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--fs-2xs)',
        color: 'var(--text-muted)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 18,
        rowGap: 8,
        lineHeight: 1.5,
      }}
    >
      <span
        className="dtf-chip dtf-label"
        style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
      >
        <ShieldCheck size={13} style={{ color: 'var(--accent-primary)' }} aria-hidden />
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
          Trust posture
        </span>
      </span>

      <span className="dtf-chip">
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Sub-processors:</span>{' '}
        {receipts.map((r, i) => (
          <span key={r.label}>
            {i > 0 && <span style={{ opacity: 0.4 }}> · </span>}
            <span>{r.label}</span>
            {r.status === 'targeted' && (
              <span style={{ opacity: 0.7, fontStyle: 'italic' }}> (Type I targeted Q4 2026)</span>
            )}
          </span>
        ))}
      </span>

      <span className="dtf-chip">
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Retained until</span>{' '}
        <span>
          {expiresAt.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
        <span style={{ opacity: 0.4 }}> · </span>
        <span>
          {planLoaded ? `${daysRemaining.toLocaleString()} days remaining` : '… computing'}
        </span>
        <span style={{ opacity: 0.4 }}> · </span>
        <span>{planLabel} plan</span>
      </span>

      <span
        className="dtf-chip dtf-links"
        style={{
          display: 'flex',
          gap: 14,
          marginLeft: 'auto',
          flexShrink: 0,
        }}
      >
        <Link
          href="/security#soc2-receipts"
          style={{
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          SOC 2 receipts
        </Link>
        <Link
          href="/security#vendor-continuity"
          style={{
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Indemnification
        </Link>
        <Link
          href="/privacy#processors"
          style={{
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Full processor list
        </Link>
      </span>

      <style jsx>{`
        @media (max-width: 900px) {
          .document-trust-footer {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .dtf-links {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
