'use client';

import { useEffect, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PersonaLeaderboardEntry {
  name: string;
  accuracy: number;
  timesSelected: number;
}

interface TwinEffectivenessEntry {
  twinName: string;
  dissentCount: number;
  effectiveDissentCount: number;
  effectivenessRate: number;
  avgBeliefDelta: number;
  sampleSize: number;
}

interface TwinReportData {
  personaLeaderboard: PersonaLeaderboardEntry[];
  twinEffectiveness: TwinEffectivenessEntry[];
}

// ─── Narrative Generator ────────────────────────────────────────────────────

function generateNarrative(twin: TwinEffectivenessEntry, accuracy: number | null): string {
  const accuracyStr = accuracy !== null ? ` — selected as most accurate ${accuracy}% of the time` : '';
  if (twin.sampleSize < 3) {
    return `${twin.twinName} has dissented ${twin.dissentCount} time(s). More outcomes needed for reliable insights.`;
  }
  if (twin.effectivenessRate >= 0.7) {
    return `${twin.twinName} is your most reliable dissenter. When they objected, the decision later failed ${Math.round(twin.effectivenessRate * 100)}% of the time${accuracyStr}. Trust their warnings.`;
  }
  if (twin.effectivenessRate >= 0.4) {
    return `${twin.twinName} has a moderate track record — ${twin.effectiveDissentCount} of ${twin.dissentCount} dissents proved correct (${Math.round(twin.effectivenessRate * 100)}%)${accuracyStr}.`;
  }
  return `${twin.twinName} dissented ${twin.dissentCount} times, but only ${twin.effectiveDissentCount} proved correct (${Math.round(twin.effectivenessRate * 100)}%). Their concerns may not align with real risk patterns.`;
}

function getRoleIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('conservative') || lower.includes('fiscal')) return '\u{1F6E1}\uFE0F';
  if (lower.includes('growth') || lower.includes('investor')) return '\u{1F4C8}';
  if (lower.includes('operational') || lower.includes('expert')) return '\u{2699}\uFE0F';
  if (lower.includes('risk') || lower.includes('compliance')) return '\u{26A0}\uFE0F';
  if (lower.includes('contrarian') || lower.includes('devil')) return '\u{1F608}';
  return '\u{1F464}';
}

function getEffectivenessColor(rate: number): string {
  if (rate >= 0.7) return 'var(--color-success, #22c55e)';
  if (rate >= 0.4) return 'var(--color-warning, #eab308)';
  return 'var(--text-muted, #71717a)';
}

// ─── Component ──────────────────────────────────────────────────────────────

interface TwinEffectivenessReportProps {
  orgId?: string;
  timeRange?: string;
  compact?: boolean;
}

export default function TwinEffectivenessReport({
  orgId,
  timeRange = '90d',
  compact = false,
}: TwinEffectivenessReportProps) {
  const [data, setData] = useState<TwinReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ timeRange });
    if (orgId) params.set('orgId', orgId);

    fetch(`/api/outcomes/dashboard?${params}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        setData({
          personaLeaderboard: json.personaLeaderboard ?? [],
          twinEffectiveness: json.twinEffectiveness ?? [],
        });
      })
      .catch(err => {
        console.warn('Failed to fetch twin effectiveness:', err);
        setError('Unable to load twin effectiveness data');
      })
      .finally(() => setLoading(false));
  }, [orgId, timeRange]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            height: 120,
            borderRadius: 12,
            background: 'var(--bg-secondary, #111)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const { personaLeaderboard, twinEffectiveness } = data;

  if (personaLeaderboard.length === 0 && twinEffectiveness.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          border: '1px solid var(--border-primary, #222)',
          borderRadius: 12,
          background: 'var(--bg-secondary, #111)',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'var(--text-secondary, #b4b4bc)', fontSize: 14 }}>
          Report outcomes to unlock twin accuracy insights. Need at least 3 outcomes with twin
          data.
        </p>
      </div>
    );
  }

  // Merge leaderboard accuracy into effectiveness data for richer cards
  const accuracyMap = new Map(personaLeaderboard.map(p => [p.name, p]));

  // Use effectiveness data if available, fall back to leaderboard-only
  const twins: Array<TwinEffectivenessEntry & { accuracy: number | null; timesSelected: number }> =
    twinEffectiveness.length > 0
      ? twinEffectiveness.map(t => ({
          ...t,
          accuracy: accuracyMap.get(t.twinName)?.accuracy ?? null,
          timesSelected: accuracyMap.get(t.twinName)?.timesSelected ?? 0,
        }))
      : personaLeaderboard.map(p => ({
          twinName: p.name,
          dissentCount: 0,
          effectiveDissentCount: 0,
          effectivenessRate: 0,
          avgBeliefDelta: 0,
          sampleSize: p.timesSelected,
          accuracy: p.accuracy,
          timesSelected: p.timesSelected,
        }));

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {twins.slice(0, 3).map(t => (
          <div
            key={t.twinName}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--bg-secondary, #111)',
              border: '1px solid var(--border-primary, #222)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{getRoleIcon(t.twinName)}</span>
            <span style={{ color: 'var(--text-primary, #fff)', fontWeight: 500 }}>
              {t.twinName}
            </span>
            {t.accuracy !== null && (
              <span style={{ color: getEffectivenessColor(t.accuracy / 100), fontWeight: 600 }}>
                {t.accuracy}%
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text-primary, #fff)',
          marginBottom: 16,
        }}
      >
        Decision Twin Effectiveness
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {twins.map(t => {
          const effectiveColor = getEffectivenessColor(t.effectivenessRate);
          const leaderboard = accuracyMap.get(t.twinName);
          const narrative = generateNarrative(t, leaderboard?.accuracy ?? null);

          return (
            <div
              key={t.twinName}
              style={{
                padding: 16,
                borderRadius: 12,
                background: 'var(--bg-secondary, #111)',
                border: '1px solid var(--border-primary, #222)',
                borderTop: `3px solid ${effectiveColor}`,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{getRoleIcon(t.twinName)}</span>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary, #fff)',
                    }}
                  >
                    {t.twinName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted, #71717a)' }}>
                    {t.sampleSize} decision{t.sampleSize !== 1 ? 's' : ''} tracked
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                {t.dissentCount > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: effectiveColor,
                      }}
                    >
                      {Math.round(t.effectivenessRate * 100)}%
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>
                      dissent accuracy
                    </div>
                  </div>
                )}

                {t.accuracy !== null && (
                  <div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: 'var(--text-primary, #fff)',
                      }}
                    >
                      {t.accuracy}%
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>
                      chosen as most accurate
                    </div>
                  </div>
                )}

                {t.avgBeliefDelta > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: 'var(--text-primary, #fff)',
                      }}
                    >
                      {t.avgBeliefDelta > 0 ? '+' : ''}
                      {t.avgBeliefDelta}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>
                      avg belief shift
                    </div>
                  </div>
                )}
              </div>

              {/* Narrative */}
              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: 'var(--text-secondary, #b4b4bc)',
                  margin: 0,
                }}
              >
                {narrative}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
