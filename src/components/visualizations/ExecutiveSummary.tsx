'use client';

import { AlertTriangle, Brain, Activity, Sparkles } from 'lucide-react';

interface ExecutiveSummaryProps {
  overallScore: number;
  noiseScore: number;
  biasCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  verdict?: 'APPROVED' | 'REJECTED' | 'MIXED';
}

const GRADE_META: Array<{ min: number; grade: string; ring: string; label: string }> = [
  { min: 85, grade: 'A', ring: '#22c55e', label: 'Excellent' },
  { min: 70, grade: 'B', ring: '#84cc16', label: 'Good' },
  { min: 55, grade: 'C', ring: '#eab308', label: 'Fair' },
  { min: 40, grade: 'D', ring: '#f97316', label: 'Poor' },
  { min: 0, grade: 'F', ring: '#ef4444', label: 'Critical' },
];

function getGradeMeta(score: number) {
  for (const t of GRADE_META) {
    if (score >= t.min) return t;
  }
  return GRADE_META[GRADE_META.length - 1];
}

const VERDICT_META: Record<string, { bg: string; fg: string; ring: string; copy: string }> = {
  APPROVED: { bg: 'rgba(34,197,94,0.18)', fg: '#86efac', ring: 'rgba(34,197,94,0.35)', copy: 'Approved' },
  REJECTED: { bg: 'rgba(239,68,68,0.18)', fg: '#fca5a5', ring: 'rgba(239,68,68,0.35)', copy: 'Review Required' },
  MIXED: { bg: 'rgba(234,179,8,0.18)', fg: '#fde68a', ring: 'rgba(234,179,8,0.35)', copy: 'Proceed with Caution' },
};

const RISK_COLOR: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export function ExecutiveSummary({
  overallScore,
  noiseScore,
  biasCount,
  riskLevel,
  summary,
  verdict,
}: ExecutiveSummaryProps) {
  const meta = getGradeMeta(Math.round(overallScore));
  const verdictMeta = verdict ? VERDICT_META[verdict] : null;
  const riskColor = RISK_COLOR[riskLevel] || '#94a3b8';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F2A1F 100%)',
        border: '1px solid #1E293B',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 10px 32px rgba(15, 23, 42, 0.22)',
        color: '#E2E8F0',
      }}
    >
      {/* Eyebrow + verdict pill */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#16A34A',
          }}
        >
          <Sparkles size={12} />
          Executive summary
        </div>
        {verdictMeta && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '5px 12px',
              borderRadius: 999,
              background: verdictMeta.bg,
              color: verdictMeta.fg,
              border: `1px solid ${verdictMeta.ring}`,
            }}
          >
            {verdictMeta.copy}
          </span>
        )}
      </div>

      {/* Hero row: grade ring + top-line copy */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: `4px solid ${meta.ring}`,
            background: 'rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            flexShrink: 0,
            boxShadow: `inset 0 0 24px ${meta.ring}26`,
          }}
        >
          <span style={{ fontSize: 40, fontWeight: 800, color: meta.ring, lineHeight: 1 }}>
            {meta.grade}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#94A3B8',
              marginTop: 4,
              letterSpacing: '0.04em',
            }}
          >
            {Math.round(overallScore)}/100
          </span>
        </div>

        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: meta.ring,
              marginBottom: 6,
            }}
          >
            Decision Quality Index · {meta.label}
          </div>
          <p
            style={{
              fontSize: 15,
              color: '#CBD5E1',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {summary}
          </p>
        </div>
      </div>

      {/* Stat tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginTop: 20,
        }}
      >
        <StatTile
          icon={<Brain size={18} />}
          value={biasCount.toString()}
          label="Cognitive biases"
          tone="#A78BFA"
        />
        <StatTile
          icon={<Activity size={18} />}
          value={noiseScore.toFixed(1)}
          label="Noise score"
          tone="#38BDF8"
        />
        <StatTile
          icon={<AlertTriangle size={18} />}
          value={riskLevel}
          label="Risk level"
          tone={riskColor}
          capitalize
        />
      </div>
    </div>
  );
}

function StatTile({
  icon,
  value,
  label,
  tone,
  capitalize,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone: string;
  capitalize?: boolean;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${tone}1F`,
          color: tone,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#F8FAFC',
            lineHeight: 1.1,
            textTransform: capitalize ? 'capitalize' : undefined,
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: 11,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginTop: 2,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
