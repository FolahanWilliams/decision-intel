'use client';

import { DQIBadge } from '@/components/ui/DQIBadge';
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

export interface CaseStudy {
  token: string;
  label: string;
  dqiScore: number;
  noiseScore: number;
  totalBiases: number;
  severityCounts: { high: number; medium: number; low: number };
  topBiasTypes: { type: string; count: number }[];
  outcome: {
    status: string;
    impactScore: number | null;
    confirmedBiasCount: number;
  } | null;
  publishedAt: string;
}

function OutcomeIcon({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'failure':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'partial_success':
      return <CheckCircle className="w-4 h-4 text-yellow-400" />;
    default:
      return <Clock className="w-4 h-4 text-zinc-400" />;
  }
}

function outcomeLabel(status: string): string {
  switch (status) {
    case 'success':
      return 'Biases Confirmed — Outcome Positive';
    case 'failure':
      return 'Biases Confirmed — Outcome Negative';
    case 'partial_success':
      return 'Partial — Mixed Outcome';
    default:
      return 'Pending Outcome';
  }
}

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-lg p-6 flex flex-col gap-4 hover:border-white/20 transition-colors">
      {/* Header: Label + DQI */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
            Case Study
          </span>
          <h3 className="text-lg font-semibold text-white mt-1">{study.label}</h3>
        </div>
        <DQIBadge score={study.dqiScore} size="sm" showGrade />
      </div>

      {/* Bias Summary */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-zinc-400">{study.totalBiases} biases detected</span>
        <div className="flex items-center gap-1.5">
          {study.severityCounts.high > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-400">{study.severityCounts.high}</span>
            </span>
          )}
          {study.severityCounts.medium > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-yellow-400">{study.severityCounts.medium}</span>
            </span>
          )}
          {study.severityCounts.low > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-400">{study.severityCounts.low}</span>
            </span>
          )}
        </div>
      </div>

      {/* Top Bias Types */}
      <div className="flex flex-wrap gap-1.5">
        {study.topBiasTypes.map((b) => (
          <span
            key={b.type}
            className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300"
          >
            {b.type}
          </span>
        ))}
      </div>

      {/* Outcome */}
      {study.outcome && (
        <div className="flex items-center gap-2 text-sm border-t border-white/5 pt-3">
          <OutcomeIcon status={study.outcome.status} />
          <span className="text-zinc-300">{outcomeLabel(study.outcome.status)}</span>
          {study.outcome.confirmedBiasCount > 0 && (
            <span className="text-zinc-500 ml-auto">
              {study.outcome.confirmedBiasCount}/{study.totalBiases} confirmed
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      <a
        href={`/shared/${study.token}?case=true`}
        className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors mt-auto"
      >
        View Full Analysis <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
