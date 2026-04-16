'use client';

import Link from 'next/link';

const C = {
  navy: '#0F172A',
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  red: '#DC2626',
  amber: '#F59E0B',
};

const OUTCOME_DOT: Record<string, string> = {
  catastrophic_failure: C.red,
  failure: C.amber,
  partial_failure: C.amber,
  partial_success: C.green,
  success: C.green,
  exceptional_success: C.green,
};

interface CaseEntry {
  slug: string;
  company: string;
  year: number;
  outcome: string;
}

interface CaseSelectorProps {
  cases: CaseEntry[];
  activeSlug: string;
}

export function CaseSelector({ cases, activeSlug }: CaseSelectorProps) {
  return (
    <div
      style={{
        borderBottom: `1px solid ${C.slate200}`,
        background: C.white,
        position: 'sticky',
        top: 64,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: C.slate400,
            whiteSpace: 'nowrap',
          }}
        >
          Choose a case
        </span>
        <div
          style={{
            display: 'flex',
            gap: 6,
            flex: 1,
            overflowX: 'auto',
            paddingBottom: 2,
            scrollbarWidth: 'thin',
          }}
        >
          {cases.map(c => {
            const active = c.slug === activeSlug;
            return (
              <Link
                key={c.slug}
                href={`/proof?case=${c.slug}`}
                scroll={false}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: active ? C.navy : C.slate100,
                  color: active ? C.white : C.slate600,
                  border: `1px solid ${active ? C.navy : C.slate200}`,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: OUTCOME_DOT[c.outcome] || C.slate400,
                    flexShrink: 0,
                  }}
                  aria-hidden
                />
                {c.company}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: active ? 'rgba(255,255,255,0.6)' : C.slate400,
                  }}
                >
                  {c.year}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
