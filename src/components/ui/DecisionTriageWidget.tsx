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

function getScoreColor(score: number): string {
  if (score >= 5) return 'text-red-400';
  if (score >= 3) return 'text-orange-400';
  if (score >= 1.5) return 'text-yellow-400';
  return 'text-zinc-400';
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
    <div className="mb-lg">
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert size={16} className="text-red-400" />
            Decisions Needing Attention
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
              {triage.decisions.length} of {triage.totalPending}
            </span>
          </h3>
        </div>
        <div className="card-body p-0">
          <div className="divide-y divide-white/5">
            {triage.decisions.map(d => {
              const RiskIcon = getRiskIcon(d.topRiskFactor);
              return (
                <Link
                  key={d.analysisId}
                  href={`/documents/${d.documentId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className={`flex-shrink-0 ${getScoreColor(d.triageScore)}`}>
                    <RiskIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-200 truncate">{d.filename}</div>
                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                      <span>{d.topRiskFactor}</span>
                      {d.toxicComboCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                          {d.toxicComboCount} toxic combo{d.toxicComboCount > 1 ? 's' : ''}
                        </span>
                      )}
                      <span>{d.biasCount} biases</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-mono font-medium ${getScoreColor(d.triageScore)}`}
                    >
                      {d.triageScore.toFixed(1)}
                    </span>
                    <ChevronRight size={14} className="text-zinc-600" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
