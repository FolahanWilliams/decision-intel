/**
 * ReasoningRisksBucket — Bucket 1 of the MECE structure.
 * "What the audit found" — biases + compound failure patterns combined.
 *
 * Compound patterns lead (the differentiator vs. competitors), then
 * individual biases sorted by severity. Each finding renders as a
 * FindingCard with a ProgressiveDrawer drill-down for the audit trail.
 *
 * The grid is responsive: 2-col at ≥720px, 1-col below.
 */

'use client';

import { useState } from 'react';
import { Brain, GitMerge } from 'lucide-react';
import { formatExposureLabel } from '@/lib/deliverable/valueAtStake';
import type {
  ReasoningRiskFinding,
  ReasoningRisksBucket as ReasoningRisksBucketType,
} from '@/lib/deliverable/types';
import { ActionTitle } from '../ActionTitle';
import { FindingCard } from '../FindingCard';
import { ProgressiveDrawer } from '../ProgressiveDrawer';
import { ValueSuppressingPalette } from '../ValueSuppressingPalette';
import { BiasSeverityScatter } from '../charts/BiasSeverityScatter';

interface ReasoningRisksBucketProps {
  bucket: ReasoningRisksBucketType;
}

export function ReasoningRisksBucket({ bucket }: ReasoningRisksBucketProps) {
  const [active, setActive] = useState<ReasoningRiskFinding | null>(null);

  if (bucket.findings.length === 0) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ActionTitle eyebrow="What the audit found">{bucket.actionTitle}</ActionTitle>
        <CleanState />
      </section>
    );
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ActionTitle eyebrow="What the audit found" accessory={<CountStrip bucket={bucket} />}>
        {bucket.actionTitle}
      </ActionTitle>

      {/* Visual: severity × confidence scatter — interactive, click a
          bubble to open the same drawer as the cards below. */}
      <BiasSeverityScatter findings={bucket.findings} onSelect={f => setActive(f)} />

      <div
        className="deliverable-finding-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 14,
        }}
      >
        {bucket.findings.map(finding => (
          <FindingCard
            key={`${finding.kind}-${finding.id}`}
            title={finding.label}
            eyebrow={
              finding.kind === 'compound_pattern' ? 'Compound failure pattern' : 'Cognitive bias'
            }
            chip={finding.chip}
            body={finding.explanation || undefined}
            excerpt={finding.excerpt || undefined}
            metaRow={
              finding.valueAtStake ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12.5,
                  }}
                >
                  <span
                    style={{
                      color: 'var(--text-muted, #64748B)',
                      fontWeight: 600,
                    }}
                  >
                    Exposure
                  </span>
                  <span
                    style={{
                      color: 'var(--severity-high, #ef4444)',
                      fontWeight: 800,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatExposureLabel(finding.valueAtStake)}
                  </span>
                  <span
                    style={{
                      color: 'var(--text-muted, #64748B)',
                      fontSize: 11,
                    }}
                  >
                    on this ticket
                  </span>
                </div>
              ) : undefined
            }
            onOpenDrawer={() => setActive(finding)}
          />
        ))}
      </div>

      {/* Audit-trail drawer */}
      <ProgressiveDrawer
        open={active !== null}
        onClose={() => setActive(null)}
        eyebrow={
          active?.kind === 'compound_pattern' ? 'Compound failure pattern' : 'Cognitive bias'
        }
        title={active?.label ?? ''}
      >
        {active ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <ValueSuppressingPalette chip={active.chip} />
            {active.explanation ? (
              <DrawerBlock label="Why this fires" body={active.explanation} />
            ) : null}
            {active.excerpt ? (
              <DrawerBlock
                label="Verbatim memo passage"
                body={<em style={{ fontStyle: 'italic' }}>&ldquo;{active.excerpt}&rdquo;</em>}
              />
            ) : null}
            {active.mitigation ? (
              <DrawerBlock label="Recommended mitigation" body={active.mitigation} />
            ) : null}
            {active.participatingBiases && active.participatingBiases.length > 0 ? (
              <DrawerBlock
                label="Constituent biases"
                body={
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                    {active.participatingBiases.map(b => (
                      <li key={b}>{b.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}
            {active.valueAtStake ? (
              <DrawerBlock
                label="Exposure math"
                body={
                  <>
                    <div>
                      Ticket{' '}
                      {formatExposureLabel({
                        ...active.valueAtStake,
                        exposureAmount: active.valueAtStake.ticketAmount,
                      })}{' '}
                      × historical base rate ={' '}
                      <strong style={{ color: 'var(--severity-high, #ef4444)' }}>
                        {formatExposureLabel(active.valueAtStake)}
                      </strong>{' '}
                      potential exposure.
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted, #64748B)',
                        marginTop: 6,
                      }}
                    >
                      Source: {active.valueAtStake.baseRateSource}
                    </div>
                  </>
                }
              />
            ) : null}
          </div>
        ) : null}
      </ProgressiveDrawer>
    </section>
  );
}

function CleanState() {
  return (
    <div
      style={{
        padding: '20px 22px',
        border: '1px dashed var(--border-color, #E2E8F0)',
        borderRadius: 12,
        fontSize: 13.5,
        color: 'var(--text-secondary, #475569)',
        lineHeight: 1.55,
      }}
    >
      No critical reasoning risks surfaced. Review the stress-test and historical-analog buckets for
      adjacent friction worth addressing before the room sees this memo.
    </div>
  );
}

function CountStrip({ bucket }: { bucket: ReasoningRisksBucketType }) {
  const items: Array<{ label: string; value: number; icon: React.ReactNode; color: string }> = [];
  if (bucket.counts.namedPatterns > 0) {
    items.push({
      label: bucket.counts.namedPatterns === 1 ? 'Pattern' : 'Patterns',
      value: bucket.counts.namedPatterns,
      icon: <GitMerge size={11} />,
      color: 'var(--severity-critical, #b91c1c)',
    });
  }
  const totalBiases =
    bucket.counts.critical + bucket.counts.high + bucket.counts.medium + bucket.counts.low;
  if (totalBiases > 0) {
    items.push({
      label: totalBiases === 1 ? 'Bias' : 'Biases',
      value: totalBiases,
      icon: <Brain size={11} />,
      color: 'var(--text-muted, #64748B)',
    });
  }
  if (items.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map(item => (
        <span
          key={item.label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            background: 'var(--bg-secondary, #F8FAFC)',
            border: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 700,
            color: item.color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {item.icon}
          {item.value} {item.label}
        </span>
      ))}
    </div>
  );
}

function DrawerBlock({ label, body }: { label: string; body: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-muted, #64748B)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13.5,
          color: 'var(--text-primary, #0F172A)',
          lineHeight: 1.6,
        }}
      >
        {body}
      </div>
    </div>
  );
}
