'use client';

import { AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { BiasInstance } from '@/types';
import { SEVERITY_COLORS } from '@/lib/constants/human-audit';
import { formatBiasName } from '@/lib/utils/labels';

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface ActionableNudgesProps {
  biases: BiasInstance[];
}

export function ActionableNudges({ biases }: ActionableNudgesProps) {
  const topBiases = [...biases]
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))
    .slice(0, 3);

  if (topBiases.length === 0) {
    return (
      <div className="card animate-fade-in" style={{ border: '1px solid rgba(52, 211, 153, 0.2)' }}>
        <div className="card-body flex items-center gap-md" style={{ padding: '20px 24px' }}>
          <CheckCircle size={20} style={{ color: '#34d399', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#34d399' }}>
              No significant biases detected
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              This document shows strong analytical rigor with minimal cognitive bias.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h3 className="section-heading">
        <Shield size={14} />
        Top Actionable Findings
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {topBiases.map((bias, i) => {
          const color = SEVERITY_COLORS[bias.severity] || 'var(--text-muted)';
          return (
            <div
              key={bias.id || i}
              className="card"
              style={{
                borderLeft: `3px solid ${color}`,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <AlertTriangle size={13} style={{ color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatBiasName(bias.biasType)}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color,
                    letterSpacing: '0.05em',
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
                      flexShrink: 0,
                    }}
                  >
                    {Math.round(bias.confidence * 100)}% confidence
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {bias.suggestion}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
