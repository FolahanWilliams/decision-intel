'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Quote, AlertTriangle } from 'lucide-react';

interface BiasEvidence {
  type: string;
  severity: string;
  confidence: number | null;
  excerpt: string | null;
  explanation: string | null;
  suggestion: string | null;
}

interface RootCause {
  biasType: string;
  contributionScore: number;
  evidence: string;
  causalStrength: number;
  severity: string;
}

export function EvidenceTrail({
  biases,
  rootCauses,
}: {
  biases: BiasEvidence[];
  rootCauses: RootCause[];
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const rootCauseMap = new Map<string, RootCause>();
  rootCauses.forEach(rc => rootCauseMap.set(rc.biasType, rc));

  const severityColor: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...biases].sort(
    (a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {sorted.map((bias, idx) => {
        const isExpanded = expandedIdx === idx;
        const color = severityColor[bias.severity] || '#888';
        const rootCause = rootCauseMap.get(bias.type);

        return (
          <div
            key={idx}
            style={{
              border: '1px solid var(--liquid-border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <button
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                textAlign: 'left',
              }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: 500, flex: 1 }}>
                {formatBiasName(bias.type)}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  background: `${color}15`,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {bias.severity}
              </span>
              {bias.confidence != null && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {Math.round(bias.confidence * 100)}%
                </span>
              )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--liquid-border)' }}>
                {/* Excerpt */}
                {bias.excerpt && (
                  <div
                    style={{
                      margin: '12px 0',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.03)',
                      borderLeft: `3px solid ${color}`,
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Quote size={12} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Source Text
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                      &ldquo;{bias.excerpt}&rdquo;
                    </p>
                  </div>
                )}

                {/* Explanation */}
                {bias.explanation && (
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '2px' }}>
                      Explanation
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {bias.explanation}
                    </p>
                  </div>
                )}

                {/* Suggestion */}
                {bias.suggestion && (
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '2px' }}>
                      Mitigation Suggestion
                    </p>
                    <p style={{ fontSize: '12px', color: '#22c55e', lineHeight: 1.5 }}>
                      {bias.suggestion}
                    </p>
                  </div>
                )}

                {/* Root cause attribution */}
                {rootCause && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(249, 115, 22, 0.06)',
                      border: '1px solid rgba(249, 115, 22, 0.12)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <AlertTriangle size={12} style={{ color: '#f97316' }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#f97316' }}>
                        Root Cause Attribution
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: rootCause.contributionScore > 0 ? '#ef4444' : '#22c55e',
                          marginLeft: 'auto',
                        }}
                      >
                        {rootCause.contributionScore > 0 ? '+' : ''}
                        {(rootCause.contributionScore * 100).toFixed(0)}% contribution
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {rootCause.evidence}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Causal strength: {(rootCause.causalStrength * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatBiasName(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
