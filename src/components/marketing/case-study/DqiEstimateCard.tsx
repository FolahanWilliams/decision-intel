import { formatBiasName } from '@/lib/utils/labels';
import type { CaseDqiEstimate } from '@/lib/data/case-studies/types';

const GRADE_COLORS: Record<CaseDqiEstimate['grade'], { ring: string; label: string }> = {
  A: { ring: '#22c55e', label: 'Excellent' },
  B: { ring: '#84cc16', label: 'Good' },
  C: { ring: '#eab308', label: 'Fair' },
  D: { ring: '#f97316', label: 'Poor' },
  F: { ring: '#ef4444', label: 'Critical' },
};

/** Primary-source DQI estimate (Tier 2 cases). Replaces the simulated hero
 *  card when the case carries a canonical grade. */
export function DqiEstimateCard({ dqi }: { dqi: CaseDqiEstimate }) {
  const meta = GRADE_COLORS[dqi.grade];

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        border: '1px solid #1E293B',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 4px 24px rgba(15, 23, 42, 0.12)',
      }}
    >
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Grade ring */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            border: `4px solid ${meta.ring}`,
            background: 'rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: meta.ring,
              lineHeight: 1,
            }}
          >
            {dqi.grade}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginTop: 4 }}>
            {dqi.score}/100
          </span>
        </div>

        {/* Copy */}
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#16A34A',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            Decision Quality Index · {meta.label}
          </div>
          <div style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.55, marginBottom: 10 }}>
            {dqi.rationale}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {dqi.topBiases.slice(0, 3).map(b => (
              <span
                key={b}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(139, 92, 246, 0.18)',
                  color: '#C4B5FD',
                  padding: '3px 10px',
                  borderRadius: 999,
                }}
              >
                {formatBiasName(b)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
