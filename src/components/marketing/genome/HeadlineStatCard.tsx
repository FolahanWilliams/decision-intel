import type { LucideIcon } from 'lucide-react';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  red: '#DC2626',
  amber: '#F59E0B',
};

interface HeadlineStatCardProps {
  eyebrow: string;
  value: string;
  label: string;
  supportingLine: string;
  taxonomyId?: string | null;
  tone?: 'danger' | 'warning' | 'info';
  icon?: LucideIcon;
}

export function HeadlineStatCard({
  eyebrow,
  value,
  label,
  supportingLine,
  taxonomyId,
  tone = 'info',
  icon: Icon,
}: HeadlineStatCardProps) {
  const accent =
    tone === 'danger' ? C.red : tone === 'warning' ? C.amber : C.green;

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accent,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={14} style={{ color: accent }} />}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: C.slate400,
          }}
        >
          {eyebrow}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: C.slate900,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {label}
        </span>
        {taxonomyId && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 999,
              background: C.slate100,
              color: C.slate500,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.02em',
            }}
          >
            {taxonomyId}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: accent,
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>

      <div style={{ fontSize: 12.5, color: C.slate500, lineHeight: 1.5 }}>
        {supportingLine}
      </div>
    </div>
  );
}
