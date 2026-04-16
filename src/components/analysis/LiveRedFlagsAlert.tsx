'use client';

import { AlertTriangle, Shield } from 'lucide-react';
import { BiasInstance } from '@/types';
import { formatBiasName } from '@/lib/utils/labels';

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const SEVERITY_META: Record<
  string,
  { chip: string; chipBg: string; chipBorder: string; badgeBg: string; badgeFg: string }
> = {
  critical: {
    chip: '#991B1B',
    chipBg: '#FEE2E2',
    chipBorder: '#FCA5A5',
    badgeBg: '#FEE2E2',
    badgeFg: '#991B1B',
  },
  high: {
    chip: '#C2410C',
    chipBg: '#FFEDD5',
    chipBorder: '#FDBA74',
    badgeBg: '#FFEDD5',
    badgeFg: '#C2410C',
  },
  medium: {
    chip: '#92400E',
    chipBg: '#FEF3C7',
    chipBorder: '#FDE68A',
    badgeBg: '#FEF3C7',
    badgeFg: '#92400E',
  },
  low: {
    chip: '#475569',
    chipBg: '#F1F5F9',
    chipBorder: '#E2E8F0',
    badgeBg: '#F1F5F9',
    badgeFg: '#475569',
  },
};

interface LiveRedFlagsAlertProps {
  biases: BiasInstance[];
  /** Maximum number of flags to render. Default 5. */
  limit?: number;
  /** Click handler — opens bias detail modal. */
  onSelect?: (bias: BiasInstance) => void;
}

/** Live-product counterpart to DemoRedFlagsAlert. Ranks biases by severity and
 *  renders them as numbered alerts with the same visual language the marketing
 *  demo uses — so the hand-off from /demo/[slug] to /documents/[id] is seamless. */
export function LiveRedFlagsAlert({ biases, limit = 5, onSelect }: LiveRedFlagsAlertProps) {
  const ranked = [...biases]
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))
    .slice(0, limit);

  if (ranked.length === 0) return null;

  // Color the outer card based on the top-severity flag.
  const topSeverity = SEVERITY_META[ranked[0].severity] || SEVERITY_META.low;

  return (
    <section style={{ marginBottom: 32 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#DC2626',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Shield size={12} />
        Platform-detected signals
      </div>
      <h2
        style={{
          fontSize: 'clamp(20px, 3vw, 24px)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0,
          marginBottom: 4,
          letterSpacing: '-0.01em',
        }}
      >
        {biases.length} red flag{biases.length === 1 ? '' : 's'} in this decision
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
        Each flag below was detected from the document alone — no outcome data, no hindsight.
      </p>

      <div
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${topSeverity.chipBorder}`,
          borderRadius: 16,
          padding: 8,
          boxShadow: `0 4px 16px ${topSeverity.chipBg}66`,
        }}
      >
        {ranked.map((bias, i) => {
          const meta = SEVERITY_META[bias.severity] || SEVERITY_META.low;
          const isClickable = !!onSelect;
          return (
            <button
              key={bias.id || i}
              onClick={isClickable ? () => onSelect(bias) : undefined}
              disabled={!isClickable}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '14px 12px',
                borderBottom: i < ranked.length - 1 ? '1px solid var(--border-color)' : 'none',
                background: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: isClickable ? 'pointer' : 'default',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                if (isClickable) e.currentTarget.style.background = 'var(--bg-elevated)';
              }}
              onMouseLeave={e => {
                if (isClickable) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: meta.badgeBg,
                  color: meta.badgeFg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <AlertTriangle size={10} style={{ marginBottom: 1 }} />
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {formatBiasName(bias.biasType)}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: meta.badgeFg,
                      background: meta.badgeBg,
                      padding: '2px 8px',
                      borderRadius: 999,
                    }}
                  >
                    {bias.severity}
                  </span>
                  {bias.confidence != null && (
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        marginLeft: 'auto',
                      }}
                    >
                      {Math.round(bias.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                  }}
                >
                  {bias.suggestion || bias.explanation}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: meta.chip,
                    marginTop: 6,
                  }}
                >
                  Detectable at decision time
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
