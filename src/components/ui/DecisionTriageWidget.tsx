'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  DollarSign,
  Clock,
  Brain,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';

interface TriagedDecision {
  analysisId: string;
  documentId: string;
  filename: string;
  overallScore: number;
  triageScore: number;
  topRiskFactor: string;
  biasCount: number;
  toxicComboCount: number;
  monetaryValue: number | null;
  outcomeDueAt: string | null;
}

interface TriageResult {
  decisions: TriagedDecision[];
  totalPending: number;
}

function getRiskIcon(factor: string) {
  if (factor.includes('monetary')) return DollarSign;
  if (factor.includes('deadline')) return Clock;
  if (factor.includes('biases')) return Brain;
  if (factor.includes('Toxic')) return Zap;
  return AlertTriangle;
}

// Risk-band → CSS variable, replacing the prior dark-theme Tailwind
// classes (text-red-400 / text-orange-400 / etc.) that violated the
// CLAUDE.md "use CSS variables, not hardcoded dark-mode classes" rule.
function getScoreColor(score: number): string {
  if (score >= 5) return 'var(--severity-critical)';
  if (score >= 3) return 'var(--severity-high)';
  if (score >= 1.5) return 'var(--warning)';
  return 'var(--text-muted)';
}

export function DecisionTriageWidget() {
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user's org, then triage decisions
    fetch('/api/team')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const orgId = data?.orgId || data?.organization?.id;
        if (!orgId) return null;
        return fetch(`/api/triage?orgId=${orgId}&limit=5`);
      })
      .then(res => (res && res.ok ? res.json() : null))
      .then(data => {
        if (data) setTriage(data);
      })
      .catch(() => setError('Failed to load triage data'))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>{error}</div>
    );
  }
  if (loading || !triage || triage.decisions.length === 0) return null;

  return (
    <AccentCard
      accent="danger"
      className="mb-lg"
      title={
        <>
          <ShieldAlert size={16} style={{ color: 'var(--severity-critical)' }} />
          <span style={{ flex: 1 }}>Decisions needing attention</span>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(239, 68, 68, 0.10)',
              color: 'var(--severity-critical)',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {triage.decisions.length} of {triage.totalPending}
          </span>
        </>
      }
      // Body padding zeroed so the row Links span edge-to-edge
      // (rows carry their own 12px-vertical padding).
      bodyStyle={{ padding: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {triage.decisions.map((d, idx) => {
          const RiskIcon = getRiskIcon(d.topRiskFactor);
          const scoreColor = getScoreColor(d.triageScore);
          return (
            <Link
              key={d.analysisId}
              href={`/documents/${d.documentId}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 18px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                borderTop: idx === 0 ? 'none' : '1px solid var(--border-color)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ flexShrink: 0, color: scoreColor }}>
                <RiskIcon size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.filename}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginTop: 2,
                  }}
                >
                  <span>{d.topRiskFactor}</span>
                  {d.toxicComboCount > 0 && (
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239, 68, 68, 0.10)',
                        color: 'var(--severity-critical)',
                        fontWeight: 600,
                      }}
                    >
                      {d.toxicComboCount} toxic combo{d.toxicComboCount > 1 ? 's' : ''}
                    </span>
                  )}
                  <span>{d.biasCount} biases</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: scoreColor,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {d.triageScore.toFixed(1)}
                </span>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </Link>
          );
        })}
      </div>
    </AccentCard>
  );
}
