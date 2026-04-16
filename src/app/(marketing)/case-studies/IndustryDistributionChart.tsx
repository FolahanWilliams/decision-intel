import { formatIndustry } from '@/lib/utils/labels';

export interface IndustryCount {
  industry: string;
  count: number;
}

const C = {
  navy: '#0F172A',
  green: '#16A34A',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
} as const;

/** Horizontal bar chart of case distribution by industry.
 *  Dark-surface version for use inside the navy hero. */
export function IndustryDistributionChart({
  counts,
  surface = 'dark',
}: {
  counts: IndustryCount[];
  surface?: 'dark' | 'light';
}) {
  if (!counts.length) return null;

  const sorted = [...counts].sort((a, b) => b.count - a.count);
  const max = sorted[0]?.count ?? 1;

  const isDark = surface === 'dark';
  const labelColor = isDark ? '#CBD5E1' : C.slate600;
  const countColor = isDark ? '#FFFFFF' : C.navy;
  const trackColor = isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9';
  const barColor = isDark
    ? 'linear-gradient(90deg, #16A34A 0%, #22D3EE 100%)'
    : 'linear-gradient(90deg, #16A34A 0%, #059669 100%)';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        columnGap: 14,
        rowGap: 8,
        alignItems: 'center',
      }}
    >
      {sorted.map(({ industry, count }) => (
        <div
          key={industry}
          style={{ display: 'contents' }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: labelColor,
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {formatIndustry(industry)}
          </div>
          <div
            style={{
              height: 8,
              background: trackColor,
              borderRadius: 4,
              overflow: 'hidden',
              minWidth: 80,
            }}
          >
            <div
              style={{
                width: `${(count / max) * 100}%`,
                height: '100%',
                background: barColor,
                borderRadius: 4,
              }}
            />
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: countColor,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              textAlign: 'right',
              minWidth: 20,
            }}
          >
            {count}
          </div>
        </div>
      ))}
    </div>
  );
}
