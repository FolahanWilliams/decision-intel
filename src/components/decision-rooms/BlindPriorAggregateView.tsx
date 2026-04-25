'use client';

import { useMemo } from 'react';
import { Activity, Quote, AlertTriangle, Target, ChartBar, Scale } from 'lucide-react';
import type { BlindPriorAggregate } from '@/lib/learning/blind-prior-aggregate';

interface Props {
  aggregate: BlindPriorAggregate;
  phase: 'revealed' | 'outcome_logged';
}

export function BlindPriorAggregateView({ aggregate, phase }: Props) {
  const totalRiskCount = useMemo(
    () => aggregate.topRisks.reduce((s, r) => s + r.count, 0),
    [aggregate.topRisks]
  );
  const maxRiskCount = aggregate.topRisks[0]?.count ?? 0;
  const maxBucket = useMemo(
    () => Math.max(1, ...aggregate.confidenceHistogram.map(b => b.count)),
    [aggregate.confidenceHistogram]
  );

  const agreementLabel = useMemo(() => {
    const s = aggregate.topRisksAgreement;
    if (s >= 0.6) return 'Strong agreement';
    if (s >= 0.35) return 'Moderate agreement';
    if (s >= 0.15) return 'Mild overlap';
    return 'Low overlap';
  }, [aggregate.topRisksAgreement]);

  const stdDevLabel = useMemo(() => {
    if (aggregate.stdDevConfidence < 8) return 'Tight cluster';
    if (aggregate.stdDevConfidence < 15) return 'Moderate spread';
    if (aggregate.stdDevConfidence < 25) return 'Wide spread';
    return 'Highly divided';
  }, [aggregate.stdDevConfidence]);

  if (aggregate.count === 0) {
    return (
      <div
        className="card"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
            No priors were submitted before reveal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Headline metrics */}
      <div className="card" style={{ background: 'var(--bg-card)' }}>
        <div className="card-header">
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>
            Anonymised aggregate · {aggregate.count} prior{aggregate.count === 1 ? '' : 's'}
          </h3>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
            Names are never attached unless the participant opted in to share identity.
          </p>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            <Stat
              icon={<Target size={13} />}
              label="Mean confidence"
              value={`${aggregate.meanConfidence}%`}
              hint={`Median ${aggregate.medianConfidence}%`}
              tint="var(--accent-primary)"
            />
            <Stat
              icon={<Activity size={13} />}
              label="Spread (σ)"
              value={`${aggregate.stdDevConfidence}pt`}
              hint={stdDevLabel}
              tint="#eab308"
            />
            <Stat
              icon={<Scale size={13} />}
              label="Risk overlap"
              value={`${(aggregate.topRisksAgreement * 100).toFixed(0)}%`}
              hint={agreementLabel}
              tint="#3b82f6"
            />
            {phase === 'outcome_logged' && aggregate.meanBrier !== null && (
              <Stat
                icon={<ChartBar size={13} />}
                label="Mean Brier"
                value={aggregate.meanBrier.toFixed(3)}
                hint="Lower = better calibrated"
                tint="#a855f7"
              />
            )}
          </div>
        </div>
      </div>

      {/* Confidence histogram */}
      <div className="card" style={{ background: 'var(--bg-card)' }}>
        <div className="card-header">
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 14 }}>
            Confidence distribution
          </h3>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 6,
            }}
          >
            {aggregate.confidenceHistogram.map(bucket => {
              const pct = bucket.count / maxBucket;
              return (
                <div key={`${bucket.from}-${bucket.to}`}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginBottom: 2,
                    }}
                  >
                    <span>
                      {bucket.from}–{bucket.to === 100 ? '100' : bucket.to}%
                    </span>
                    <span>{bucket.count}</span>
                  </div>
                  <div
                    style={{
                      height: 14,
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct * 100}%`,
                        height: '100%',
                        background:
                          bucket.from >= 60
                            ? 'var(--accent-primary)'
                            : bucket.from >= 40
                            ? '#3b82f6'
                            : bucket.from >= 20
                            ? '#eab308'
                            : '#ef4444',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top risk frequency */}
      <div className="card" style={{ background: 'var(--bg-card)' }}>
        <div className="card-header">
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 14 }}>
            Risks raised
          </h3>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
            {totalRiskCount} risk statement{totalRiskCount === 1 ? '' : 's'} across {aggregate.count}{' '}
            participant{aggregate.count === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          {aggregate.topRisks.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
              No risks were flagged.
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
              {aggregate.topRisks.slice(0, 12).map(r => {
                const pct = r.count / maxRiskCount;
                return (
                  <li key={r.risk}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          textTransform: 'capitalize',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.risk}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          fontWeight: 700,
                          minWidth: 36,
                          textAlign: 'right',
                        }}
                      >
                        ×{r.count}
                      </div>
                    </div>
                    <div
                      style={{
                        height: 6,
                        marginTop: 4,
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(8, pct * 100)}%`,
                          height: '100%',
                          background: pct > 0.66 ? '#ef4444' : pct > 0.33 ? '#eab308' : '#3b82f6',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                    {r.attributedTo.length > 0 && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        Flagged by: {r.attributedTo.join(', ')}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Shared rationales */}
      {aggregate.sharedRationales.length > 0 && (
        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <div className="card-header">
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 14 }}>
              Voluntary rationales
            </h3>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
              Only participants who opted in to share are listed.
            </p>
          </div>
          <div className="card-body" style={{ paddingTop: 0, display: 'grid', gap: 12 }}>
            {aggregate.sharedRationales.map((r, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-md)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}
                >
                  <Quote size={12} />
                  <span>
                    {r.name ? r.name : 'Anonymous'} · confidence {r.confidencePercent}%
                  </span>
                </div>
                <p
                  style={{
                    margin: '6px 0 0',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
                >
                  {r.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best-calibrated participant */}
      {phase === 'outcome_logged' && aggregate.bestCalibrated && (
        <div
          className="card"
          style={{
            background: 'rgba(168,85,247,0.08)',
            borderColor: 'rgba(168,85,247,0.25)',
          }}
        >
          <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertTriangle size={16} color="#a855f7" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                  Best-calibrated participant
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {aggregate.bestCalibrated.name ?? 'Anonymous'} · prior{' '}
                  {aggregate.bestCalibrated.confidencePercent}% · Brier{' '}
                  {aggregate.bestCalibrated.brierScore.toFixed(3)} (
                  {aggregate.bestCalibrated.brierCategory ?? 'unscored'})
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tint: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: tint,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginTop: 4,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>
    </div>
  );
}
