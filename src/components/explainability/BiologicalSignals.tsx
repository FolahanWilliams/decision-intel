'use client';

import { AlertTriangle, Activity } from 'lucide-react';

interface Signal {
  type: 'winner_effect' | 'cortisol';
  detected: boolean;
  indicators: string[];
  delta: number;
}

const SIGNAL_INFO: Record<
  string,
  { title: string; icon: typeof AlertTriangle; color: string; description: string }
> = {
  winner_effect: {
    title: 'Winner Effect',
    icon: Activity,
    color: '#f97316',
    description:
      'Success-driven language patterns suggest elevated testosterone/dopamine response, which amplifies overconfidence and risk-taking biases.',
  },
  cortisol: {
    title: 'Stress/Cortisol Response',
    icon: AlertTriangle,
    color: '#ef4444',
    description:
      'Crisis or urgency language patterns suggest elevated cortisol levels, which shifts cognition toward System 1 (fast, heuristic) processing.',
  },
};

export function BiologicalSignals({ signals }: { signals: Signal[] }) {
  const detected = signals.filter(s => s.detected);

  if (detected.length === 0) {
    return (
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        No biological signal patterns detected in this decision.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {detected.map(signal => {
        const info = SIGNAL_INFO[signal.type];
        if (!info) return null;
        const Icon = info.icon;

        return (
          <div
            key={signal.type}
            style={{
              padding: '14px',
              background: `${info.color}08`,
              border: `1px solid ${info.color}25`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Icon size={16} style={{ color: info.color }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: info.color }}>
                {info.title} Detected
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  color: info.color,
                  marginLeft: 'auto',
                }}
              >
                {signal.delta >= 0 ? '+' : ''}
                {signal.delta.toFixed(1)} pts
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {info.description}
            </p>

            {signal.indicators.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                    fontWeight: 500,
                  }}
                >
                  Matched indicators:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {signal.indicators.map((indicator, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: `${info.color}12`,
                        border: `1px solid ${info.color}20`,
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
