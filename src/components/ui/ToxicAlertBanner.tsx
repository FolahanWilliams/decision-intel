'use client';

import { AlertTriangle } from 'lucide-react';
import { getBiasDisplayName } from '@/lib/utils/bias-normalize';

interface ToxicCombo {
  patternLabel: string | null;
  biasTypes: string[];
  toxicScore: number;
  estimatedRiskAmount?: number;
  dealTicketSize?: number;
}

interface ToxicAlertBannerProps {
  combinations: ToxicCombo[];
  onViewDetails?: () => void;
}

export function ToxicAlertBanner({ combinations, onViewDetails }: ToxicAlertBannerProps) {
  if (!combinations || combinations.length === 0) return null;

  const top = combinations[0];
  const severity = top.toxicScore >= 80 ? 'critical' : top.toxicScore >= 60 ? 'high' : 'moderate';
  const colors = {
    critical: { bg: 'rgba(239, 68, 68, 0.08)', border: '#ef4444', text: '#fca5a5' },
    high: { bg: 'rgba(245, 158, 11, 0.08)', border: '#f59e0b', text: '#fcd34d' },
    moderate: { bg: 'rgba(234, 179, 8, 0.06)', border: '#eab308', text: '#fef08a' },
  };
  const c = colors[severity];

  return (
    <div
      style={{
        background: c.bg,
        borderLeft: `3px solid ${c.border}`,
        padding: '12px 16px',
        marginBottom: 'var(--spacing-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
      role="alert"
    >
      <AlertTriangle size={20} style={{ color: c.border, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}
        >
          Compound Risk: {top.patternLabel || 'Unnamed Pattern'} ({Math.round(top.toxicScore)}/100)
          {top.estimatedRiskAmount != null && (
            <span style={{ marginLeft: '8px', color: '#f87171', fontWeight: 700 }}>
              — ${(top.estimatedRiskAmount / 1_000_000).toFixed(1)}M at risk
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {top.biasTypes.map(bt => (
            <span
              key={bt}
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: c.text,
                fontWeight: 500,
              }}
            >
              {getBiasDisplayName(bt)}
            </span>
          ))}
        </div>
        {combinations.length > 1 && (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '4px',
              display: 'block',
            }}
          >
            +{combinations.length - 1} more pattern{combinations.length > 2 ? 's' : ''} detected
          </span>
        )}
      </div>
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          style={{
            fontSize: '11px',
            color: c.border,
            background: 'none',
            border: `1px solid ${c.border}`,
            padding: '4px 12px',
            cursor: 'pointer',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          View Details
        </button>
      )}
    </div>
  );
}
