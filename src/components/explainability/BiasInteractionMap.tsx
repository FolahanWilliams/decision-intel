'use client';

import { useMemo } from 'react';

interface Interaction {
  from: string;
  to: string;
  weight: number;
  direction: string;
  confidence: string;
  mechanism?: string;
  citation?: string;
}

interface Bias {
  type: string;
  severity: string;
  confidence: number | null;
}

export function BiasInteractionMap({
  interactions,
  biases,
}: {
  interactions: Interaction[];
  biases: Bias[];
}) {
  const biasMap = useMemo(() => {
    const map = new Map<string, Bias>();
    biases.forEach(b => map.set(b.type, b));
    return map;
  }, [biases]);

  const severityColor: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };

  // Sort by weight descending (strongest interactions first)
  const sorted = useMemo(
    () => [...interactions].sort((a, b) => b.weight - a.weight),
    [interactions]
  );

  if (sorted.length === 0) return null;

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.map((interaction, idx) => {
          const fromBias = biasMap.get(interaction.from);
          const toBias = biasMap.get(interaction.to);
          const isAmplifying = interaction.direction === 'amplifies';

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                background: isAmplifying
                  ? 'rgba(239, 68, 68, 0.04)'
                  : 'rgba(34, 197, 94, 0.04)',
                border: `1px solid ${isAmplifying ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)'}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              {/* From bias */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '160px' }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: severityColor[fromBias?.severity || 'medium'],
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {formatBiasName(interaction.from)}
                </span>
              </div>

              {/* Arrow with weight */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <div
                  style={{
                    width: `${Math.max(20, (interaction.weight - 1) * 80)}px`,
                    height: '2px',
                    background: isAmplifying ? '#ef4444' : '#22c55e',
                  }}
                />
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    color: isAmplifying ? '#ef4444' : '#22c55e',
                  }}
                >
                  {interaction.weight.toFixed(1)}x
                </span>
                <span style={{ color: isAmplifying ? '#ef4444' : '#22c55e', fontSize: '12px' }}>
                  {isAmplifying ? '\u2192' : '\u21E2'}
                </span>
              </div>

              {/* To bias */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '160px' }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: severityColor[toBias?.severity || 'medium'],
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {formatBiasName(interaction.to)}
                </span>
              </div>

              {/* Mechanism */}
              {interaction.mechanism && (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={interaction.mechanism}
                >
                  {interaction.mechanism}
                </span>
              )}

              {/* Confidence */}
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  padding: '2px 6px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 'var(--radius-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  flexShrink: 0,
                }}
              >
                {interaction.confidence}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
        <LegendItem color="#ef4444" label="Amplifies (weight > 1.0)" />
        <LegendItem color="#22c55e" label="Dampens (weight < 1.0)" />
        {Object.entries(severityColor).map(([sev, color]) => (
          <LegendItem key={sev} color={color} label={sev} dot />
        ))}
      </div>
    </div>
  );
}

function LegendItem({ color, label, dot }: { color: string; label: string; dot?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div
        style={{
          width: dot ? 6 : 12,
          height: dot ? 6 : 2,
          borderRadius: dot ? '50%' : '1px',
          background: color,
        }}
      />
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{label}</span>
    </div>
  );
}

function formatBiasName(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
