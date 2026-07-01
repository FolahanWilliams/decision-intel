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
import { Brain, GitMerge, ExternalLink } from 'lucide-react';
import { formatExposureLabel } from '@/lib/deliverable/valueAtStake';
import { severityColor } from '@/lib/utils/severity';
import {
  STRATEGIC_NODE_CLASS_LABEL,
  type DetectedStrategicNode,
  type StrategicNodeClass,
} from '@/lib/deliverable/strategic-nodes';
import type {
  ReasoningRiskFinding,
  ReasoningRisksBucket as ReasoningRisksBucketType,
  ReferenceClassEntry,
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

  // Compound (toxic-combination) patterns that carry a buyer-facing consequence
  // lead as full-width RISK PATHWAYS — the "combination → outcome" moment a
  // buyer actually reads for. Everything else (biases + any pattern with no
  // canonical narrative) renders in the contributing-biases grid below.
  const pathways = bucket.findings.filter(f => f.kind === 'compound_pattern' && !!f.consequence);
  const gridFindings = bucket.findings.filter(
    f => !(f.kind === 'compound_pattern' && !!f.consequence)
  );
  const hasStructural = !!(bucket.strategicExposure && bucket.strategicExposure.length > 0);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ActionTitle eyebrow="What the audit found" accessory={<CountStrip bucket={bucket} />}>
        {bucket.actionTitle}
      </ActionTitle>

      {/* STRUCTURAL RISK LEADS — what could end the decision. The Fermi
          lesson: rank the company-enders (concentration / valuation / key-
          person) above the cognitive-bias tags; the biases below explain
          WHY the room would miss the structural risk, not replace it. */}
      {hasStructural && <StrategicAttackPath nodes={bucket.strategicExposure!} />}

      {/* The reasoning below is demoted from headline to explanation. */}
      {hasStructural && (pathways.length > 0 || gridFindings.length > 0) && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted, #64748B)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            paddingTop: 14,
          }}
        >
          Why the room would miss it · the reasoning
        </div>
      )}

      {/* Visual: severity × confidence scatter — interactive, click a
          bubble to open the same drawer as the cards below. */}
      <BiasSeverityScatter findings={bucket.findings} onSelect={f => setActive(f)} />

      {/* Risk pathways — the compound patterns, outcome-led + full width. */}
      {pathways.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pathways.map(finding => (
            <CompoundRiskCard
              key={`pathway-${finding.id}`}
              finding={finding}
              onOpenDrawer={() => setActive(finding)}
            />
          ))}
        </div>
      )}

      {gridFindings.length > 0 && pathways.length > 0 && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted, #64748B)',
            marginTop: 4,
          }}
        >
          Contributing biases
        </div>
      )}

      {gridFindings.length > 0 && (
        <div
          className="deliverable-finding-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 14,
          }}
        >
          {gridFindings.map(finding => (
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
              referenceClass={finding.referenceClass}
              onOpenDrawer={() => setActive(finding)}
            />
          ))}
        </div>
      )}

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
            {active.fix ? <DrawerBlock label="What to do" body={active.fix} /> : null}
            {(active.participatingBiasLabels ?? active.participatingBiases)?.length ? (
              <DrawerBlock
                label="Constituent biases"
                body={
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                    {(active.participatingBiasLabels ?? active.participatingBiases ?? []).map(b => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}
            {active.referenceClass && active.referenceClass.length > 0 ? (
              <DrawerBlock
                label="Where this has appeared before"
                body={<ReferenceClassList entries={active.referenceClass} />}
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

function ReferenceClassList({ entries }: { entries: ReferenceClassEntry[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {entries.map(c => (
          <a
            key={c.id}
            href={`/case-studies/${c.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              fontSize: 13,
              color: 'var(--text-secondary, #475569)',
              textDecoration: 'none',
              lineHeight: 1.45,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                flexShrink: 0,
                marginTop: 6,
                background: c.direction === 'negative' ? '#ef4444' : '#16a34a',
              }}
            />
            <span>
              <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{c.company}</strong> (
              {c.year}) · {c.estimatedImpact}
              <ExternalLink
                size={11}
                style={{
                  marginLeft: 4,
                  verticalAlign: 'middle',
                  color: 'var(--text-muted, #64748B)',
                }}
              />
            </span>
          </a>
        ))}
      </div>
      <p
        style={{ margin: 0, fontSize: 11.5, color: 'var(--text-muted, #64748B)', lineHeight: 1.45 }}
      >
        A reference class — where this reasoning risk has shown up before — not a claim that it
        caused this memo&rsquo;s outcome.
      </p>
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

/**
 * CompoundRiskCard — a toxic-combination rendered as a RISK PATHWAY the way a
 * buyer reads it: lead with the business OUTCOME (consequence) + the exposure,
 * demote the pattern name to an eyebrow, then the story — how it compounds, why
 * it's credible, what to do. This is the differentiator surface: not "we found
 * a bias", but "here's how these combine into a specific outcome, and how to
 * close it".
 */
function CompoundRiskCard({
  finding,
  onOpenDrawer,
}: {
  finding: ReasoningRiskFinding;
  onOpenDrawer: () => void;
}) {
  const accent = severityColor(finding.chip.severity);
  const biasChain = finding.participatingBiasLabels ?? [];
  return (
    <div
      style={{
        border: '1px solid var(--border-color, #E2E8F0)',
        borderLeft: `4px solid ${accent}`,
        borderRadius: 12,
        padding: '18px 20px',
        background: 'var(--bg-card, #fff)',
        display: 'flex',
        flexDirection: 'column',
        gap: 13,
      }}
    >
      {/* Eyebrow — the mechanism name, demoted. */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted, #64748B)',
          }}
        >
          <GitMerge size={12} />
          Compound risk · {finding.label}
        </span>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: accent,
          }}
        >
          {finding.chip.severity}
        </span>
      </div>

      {/* LEAD — the business outcome. */}
      {finding.consequence ? (
        <div
          style={{
            fontSize: 16.5,
            fontWeight: 700,
            color: 'var(--text-primary, #0F172A)',
            lineHeight: 1.4,
          }}
        >
          {finding.consequence}
        </div>
      ) : null}

      {/* Exposure. */}
      {finding.valueAtStake ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--severity-high, #ef4444)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            ~{formatExposureLabel(finding.valueAtStake)}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted, #64748B)' }}>
            at risk on this ticket
          </span>
        </div>
      ) : null}

      {/* How it compounds. */}
      {finding.explanation || biasChain.length > 0 ? (
        <Beat label="How it compounds">
          {biasChain.length > 0 ? (
            <span style={{ fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
              {biasChain.join(' + ')} reinforce each other.{' '}
            </span>
          ) : null}
          {finding.explanation}
        </Beat>
      ) : null}

      {/* Why it's credible. */}
      {finding.referenceClass?.length || finding.valueAtStake ? (
        <Beat label="Why it's credible">
          {finding.referenceClass && finding.referenceClass.length > 0 ? (
            <ReferenceClassList entries={finding.referenceClass} />
          ) : null}
          {finding.valueAtStake ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)', marginTop: 6 }}>
              Base rate: {finding.valueAtStake.baseRateSource}
            </div>
          ) : null}
        </Beat>
      ) : null}

      {/* What to do. */}
      {finding.fix ? <Beat label="What to do">{finding.fix}</Beat> : null}

      <button
        type="button"
        onClick={onOpenDrawer}
        style={{
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontSize: 12.5,
          fontWeight: 700,
          color: 'var(--accent-primary, #16A34A)',
        }}
      >
        See the full audit trail →
      </button>
    </div>
  );
}

function Beat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-muted, #64748B)',
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--text-secondary, #475569)', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

/**
 * StrategicAttackPath — the cross-class "attack path". The differentiator: not
 * "we found biases", but "here is how the governance STRUCTURE, the deal
 * EXECUTION pressure, and the INFORMATION gaps multiplied a normal bias into the
 * outcome — and what your own process concealed from the room." Ego-safe: the
 * structure is the villain, not the person.
 */
function StrategicAttackPath({ nodes }: { nodes: DetectedStrategicNode[] }) {
  const order: StrategicNodeClass[] = ['structural', 'execution', 'informational'];
  const groups = order
    .map(cls => ({ cls, items: nodes.filter(n => n.class === cls) }))
    .filter(g => g.items.length > 0);
  const concealed = nodes.filter(n => n.conceals);

  return (
    <div
      style={{
        border: '1px solid var(--border-color, #E2E8F0)',
        borderLeft: '4px solid var(--severity-critical, #b91c1c)',
        borderRadius: 12,
        padding: '18px 20px',
        background: 'var(--bg-secondary, #F8FAFC)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <GitMerge size={14} style={{ color: 'var(--severity-critical, #b91c1c)' }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted, #64748B)',
          }}
        >
          Structural risk · what could end this decision
        </span>
      </div>

      <p
        style={{ margin: 0, fontSize: 14, color: 'var(--text-primary, #0F172A)', lineHeight: 1.5 }}
      >
        These are the conditions that end the company — concentration, capital structure, key-person
        dependency — not the biases. Each is survivable alone; together they form the path a normal
        bias turns into a write-down, and it&rsquo;s the <strong>structure</strong>, not the people,
        that lets them compound.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map(({ cls, items }) => (
          <div key={cls}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--severity-critical, #b91c1c)',
                marginBottom: 6,
              }}
            >
              {STRATEGIC_NODE_CLASS_LABEL[cls]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(n => (
                <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 13.5, color: 'var(--text-primary, #0F172A)' }}>
                    <strong>{n.label}.</strong>{' '}
                    <span style={{ color: 'var(--text-secondary, #475569)' }}>{n.amplifies}</span>
                  </div>
                  {n.evidence ? (
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-muted, #64748B)',
                        fontStyle: 'italic',
                      }}
                    >
                      &ldquo;{n.evidence}&rdquo;
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {concealed.length > 0 ? (
        <div
          style={{
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            paddingTop: 12,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-muted, #64748B)',
              marginBottom: 6,
            }}
          >
            What your process may have concealed from the room
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            {concealed.slice(0, 4).map(n => (
              <li key={n.id} style={{ fontSize: 13, color: 'var(--text-secondary, #475569)' }}>
                {n.conceals}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
