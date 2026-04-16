import { Users } from 'lucide-react';
import type { CaseStakeholder } from '@/lib/data/case-studies/types';

const POSITION_META: Record<
  CaseStakeholder['position'],
  { label: string; fg: string; bg: string; border: string }
> = {
  advocate: { label: 'Advocate', fg: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
  dissenter: { label: 'Dissenter', fg: '#15803D', bg: '#DCFCE7', border: '#86EFAC' },
  overruled: { label: 'Overruled', fg: '#92400E', bg: '#FEF3C7', border: '#FCD34D' },
  silent: { label: 'Silent', fg: '#475569', bg: '#F1F5F9', border: '#CBD5E1' },
  unknown: { label: 'Unknown', fg: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
};

/** Named stakeholders and their positions on the decision. The core insight
 *  the platform surfaces — who said what, who was overruled, who stayed silent
 *  — is usually the single strongest signal of governance quality. */
export function StakeholderGrid({ stakeholders }: { stakeholders: CaseStakeholder[] }) {
  if (!stakeholders.length) return null;

  return (
    <section style={{ marginBottom: 48 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#16A34A',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Users size={12} />
        Who Was in the Room
      </div>
      <h2
        style={{
          fontSize: 'clamp(20px, 3vw, 24px)',
          fontWeight: 700,
          color: '#0F172A',
          margin: 0,
          marginBottom: 4,
          letterSpacing: '-0.01em',
        }}
      >
        Stakeholders and positions
      </h2>
      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px' }}>
        Who advocated, who dissented, who was overruled, and who stayed silent —
        the most reliable single signal of decision-process quality.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        {stakeholders.map((s, i) => {
          const pos = POSITION_META[s.position];
          return (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderLeft: `4px solid ${pos.border}`,
                borderRadius: 12,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                  {s.name}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: pos.bg,
                    color: pos.fg,
                    padding: '3px 8px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pos.label}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: s.notes ? 6 : 0 }}>
                {s.role}
              </div>
              {s.notes && (
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                  {s.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
