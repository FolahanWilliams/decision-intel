'use client';

/**
 * LRQA company snapshot — service lines, scale, recent strategic moves
 * (each with strategic-weight badge + DI relevance). The recent-moves
 * timeline is the most actionable section: every move tells Folahan
 * exactly which DI-LRQA fit story to lead with.
 */

import { Globe, TrendingUp, Building, Sparkles } from 'lucide-react';
import { LRQA_COMPANY } from './lrqa-brief-data';

const STRATEGIC_WEIGHT_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high: '#D97706',
  medium: '#0EA5E9',
};

export function LrqaCompanyMap() {
  return (
    <div>
      {/* Scale + tagline strip */}
      <div
        style={{
          padding: 14,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(14,165,233,0.04))',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: '#16A34A',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 4,
          }}
        >
          {LRQA_COMPANY.tagline}
        </div>
        <div
          style={{
            fontSize: 14,
            color: 'var(--text-primary)',
            lineHeight: 1.55,
            marginBottom: 10,
          }}
        >
          {LRQA_COMPANY.oneLiner}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11 }}>
          {Object.entries(LRQA_COMPANY.scale).map(([k, v]) => (
            <div
              key={k}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--text-secondary)',
              }}
            >
              <Globe size={11} />
              <strong style={{ color: 'var(--text-primary)' }}>{v}</strong>
              <span>· {k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Service lines */}
      <div
        style={{
          padding: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Building size={10} /> 6 service lines
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 6,
          }}
        >
          {LRQA_COMPANY.serviceLines.map(s => (
            <div
              key={s}
              style={{
                padding: '6px 10px',
                fontSize: 11,
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                borderLeft: '2px solid #94A3B8',
                borderRadius: 4,
                lineHeight: 1.45,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Recent strategic moves timeline */}
      <div
        style={{
          padding: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#DC2626',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <TrendingUp size={12} /> Recent strategic moves · 6 months
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LRQA_COMPANY.recentStrategicMoves.map(move => {
            const color = STRATEGIC_WEIGHT_COLORS[move.strategicWeight];
            return (
              <div
                key={move.move}
                style={{
                  padding: 12,
                  background: 'var(--bg-secondary)',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 4,
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      background: `${color}18`,
                      padding: '2px 6px',
                      borderRadius: 3,
                    }}
                  >
                    {move.strategicWeight}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                    }}
                  >
                    {move.date}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 6,
                    lineHeight: 1.45,
                  }}
                >
                  {move.move}
                </div>
                <div
                  style={{
                    padding: 8,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    fontSize: 11,
                    color: 'var(--text-primary)',
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color }}>DI relevance:</strong> {move.diRelevance}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Competitive context */}
      <div
        style={{
          padding: 14,
          background: 'rgba(220,38,38,0.04)',
          border: '1px solid rgba(220,38,38,0.20)',
          borderLeft: '3px solid #DC2626',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: '#DC2626',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Sparkles size={10} /> Competitive context · do NOT over-claim
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {LRQA_COMPANY.competitiveContext.directGlobalCompetitors.map(c => (
            <span
              key={c}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#DC2626',
                background: 'rgba(220,38,38,0.10)',
                padding: '3px 8px',
                borderRadius: 999,
              }}
            >
              {c}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.55 }}>
          {LRQA_COMPANY.competitiveContext.note}
        </div>
      </div>
    </div>
  );
}
