/**
 * ProvenanceBucket — Bucket 5 of the MECE structure.
 * "How we know" — methodology + corpus + regulatory frameworks +
 * audit-trail hash. The procurement-grade close.
 *
 * Per DR §6 Impute principle: this is the surface that lets the
 * executive view stay clean while the defensibility lives ONE click
 * away. Drawer carries verbatim claim verifications + full methodology
 * details.
 */

'use client';

import { useState } from 'react';
import { Hash, Cpu, ShieldCheck, ExternalLink } from 'lucide-react';
import type { ProvenanceBucket as ProvenanceBucketType } from '@/lib/deliverable/types';
import { ActionTitle } from '../ActionTitle';
import { ProgressiveDrawer } from '../ProgressiveDrawer';
import { CalibrationBaselineChart } from '../charts/CalibrationBaselineChart';
import { RegulatoryFrameworkHeatmap } from '../charts/RegulatoryFrameworkHeatmap';

interface ProvenanceBucketProps {
  bucket: ProvenanceBucketType;
}

export function ProvenanceBucket({ bucket }: ProvenanceBucketProps) {
  const [verificationsOpen, setVerificationsOpen] = useState(false);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ActionTitle eyebrow="How we know">{bucket.actionTitle}</ActionTitle>

      {/* Visual: Tetlock-band calibration chart — positions our Brier
          against published forecasting benchmarks. */}
      <CalibrationBaselineChart
        meanBrier={bucket.calibrationBaseline.meanBrier}
        sampleSize={bucket.calibrationBaseline.sampleSize}
        classificationAccuracy={bucket.calibrationBaseline.classificationAccuracy}
      />

      {/* Methodology + audit-trail strip (2 cards instead of 3 — the
          calibration card was replaced by the chart above). */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        <ProvenanceCard
          icon={<Cpu size={14} />}
          eyebrow="Methodology"
          headline={`v${bucket.methodologyVersion}`}
          body={`${bucket.pipelineNodeCount}-node pipeline · ${bucket.matrixDimension}×${bucket.matrixDimension} interaction matrix`}
        />
        <ProvenanceCard
          icon={<Hash size={14} />}
          eyebrow="Audit trail"
          headline={bucket.auditHashPrefix}
          body="SHA-256 content hash · tamper-evident record"
          monoHeadline
        />
      </div>

      {/* Visual: regulatory framework regional heatmap. */}
      {bucket.regulatoryFrameworks.length > 0 ? (
        <RegulatoryFrameworkHeatmap frameworks={bucket.regulatoryFrameworks} />
      ) : null}

      {/* Claim verifications — drawer trigger when present */}
      {bucket.claimVerifications && bucket.claimVerifications.length > 0 ? (
        <button
          type="button"
          onClick={() => setVerificationsOpen(true)}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '10px 16px',
            background: 'transparent',
            border: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: 8,
            color: 'var(--accent-primary, #16A34A)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ShieldCheck size={14} />
          View {bucket.claimVerifications.length} claim verifications
        </button>
      ) : null}

      <ProgressiveDrawer
        open={verificationsOpen}
        onClose={() => setVerificationsOpen(false)}
        eyebrow="Claim-by-claim verification"
        title="Sources behind the audit's claim checks"
      >
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {(bucket.claimVerifications ?? []).map((v, idx) => (
            <li
              key={idx}
              style={{
                padding: '12px 14px',
                background: 'var(--bg-secondary, #F8FAFC)',
                border: '1px solid var(--border-color, #E2E8F0)',
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary, #0F172A)',
                    flex: 1,
                  }}
                >
                  {v.claim}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: verdictBackground(v.verdict),
                    color: verdictColor(v.verdict),
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {v.verdict}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-secondary, #475569)',
                  lineHeight: 1.55,
                }}
              >
                {v.explanation}
              </div>
              {v.sourceUrl ? (
                <a
                  href={v.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 6,
                    fontSize: 11.5,
                    color: 'var(--accent-primary, #16A34A)',
                    fontWeight: 700,
                  }}
                >
                  Source <ExternalLink size={11} />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </ProgressiveDrawer>
    </section>
  );
}

function ProvenanceCard({
  icon,
  eyebrow,
  headline,
  body,
  monoHeadline = false,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  headline: string;
  body: string;
  monoHeadline?: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 10,
        padding: '12px 16px',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10.5,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-muted, #64748B)',
          marginBottom: 4,
        }}
      >
        {icon}
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: monoHeadline ? 15 : 17,
          fontWeight: 800,
          color: 'var(--text-primary, #0F172A)',
          fontFamily: monoHeadline ? 'var(--font-mono, monospace)' : undefined,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: monoHeadline ? '0.02em' : '-0.015em',
          marginBottom: 4,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-secondary, #475569)',
          lineHeight: 1.5,
        }}
      >
        {body}
      </div>
    </div>
  );
}

function verdictColor(v: string): string {
  if (v === 'VERIFIED') return 'var(--success, #16a34a)';
  if (v === 'CONTRADICTED') return 'var(--severity-critical, #b91c1c)';
  return 'var(--warning, #d97706)';
}

function verdictBackground(v: string): string {
  if (v === 'VERIFIED') return 'rgba(22,163,74,0.12)';
  if (v === 'CONTRADICTED') return 'rgba(185,28,28,0.12)';
  return 'rgba(217,119,6,0.12)';
}
