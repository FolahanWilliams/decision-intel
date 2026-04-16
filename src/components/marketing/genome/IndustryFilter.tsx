'use client';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
};

export interface IndustryOption {
  key: string; // 'all' or an Industry union value
  label: string;
  count: number;
}

interface IndustryFilterProps {
  options: IndustryOption[];
  value: string;
  onChange: (next: string) => void;
}

export function IndustryFilter({ options, value, onChange }: IndustryFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter by industry"
      style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        marginBottom: 20,
      }}
    >
      {options.map(opt => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 999,
              background: active ? C.slate900 : C.white,
              color: active ? C.white : C.slate600,
              border: `1px solid ${active ? C.slate900 : C.slate200}`,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: active ? 'rgba(255,255,255,0.6)' : C.slate400,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {opt.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
