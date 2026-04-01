'use client';

import { DQIBadge } from '@/components/ui/DQIBadge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

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
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failure':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'partial_success':
      return <CheckCircle className="w-4 h-4 text-yellow-500" />;
    default:
      return <Clock className="w-4 h-4" style={{ color: '#94A3B8' }} />;
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
    <div
      className="relative rounded-2xl p-6 flex flex-col gap-4 transition-shadow hover:shadow-md"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Header: Label + DQI */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: '#16A34A' }}
          >
            Case Study
          </span>
          <h3 className="text-lg font-semibold mt-1" style={{ color: '#0F172A' }}>
            {study.label}
          </h3>
        </div>
        <DQIBadge score={study.dqiScore} size="sm" showGrade />
      </div>

      {/* Bias Summary */}
      <div className="flex items-center gap-3 text-sm">
        <span style={{ color: '#475569' }}>{study.totalBiases} biases detected</span>
        <div className="flex items-center gap-1.5">
          {study.severityCounts.high > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-600">{study.severityCounts.high}</span>
            </span>
          )}
          {study.severityCounts.medium > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-yellow-600">{study.severityCounts.medium}</span>
            </span>
          )}
          {study.severityCounts.low > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-600">{study.severityCounts.low}</span>
            </span>
          )}
        </div>
      </div>

      {/* Top Bias Types */}
      <div className="flex flex-wrap gap-1.5">
        {study.topBiasTypes.map(b => (
          <span
            key={b.type}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              color: '#475569',
            }}
          >
            {b.type}
          </span>
        ))}
      </div>

      {/* Outcome */}
      {study.outcome && (
        <div
          className="flex items-center gap-2 text-sm pt-3"
          style={{ borderTop: '1px solid #E2E8F0' }}
        >
          <OutcomeIcon status={study.outcome.status} />
          <span style={{ color: '#475569' }}>{outcomeLabel(study.outcome.status)}</span>
          {study.outcome.confirmedBiasCount > 0 && (
            <span className="ml-auto" style={{ color: '#94A3B8' }}>
              {study.outcome.confirmedBiasCount}/{study.totalBiases} confirmed
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      <a
        href={`/shared/${study.token}?case=true`}
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors mt-auto"
        style={{ color: '#16A34A' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#15803D')}
        onMouseLeave={e => (e.currentTarget.style.color = '#16A34A')}
      >
        See the Full Analysis <span aria-hidden="true">&rarr;</span>
      </a>
    </div>
  );
}
