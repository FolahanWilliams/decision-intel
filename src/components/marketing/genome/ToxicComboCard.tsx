import Link from 'next/link';
import { Link2 } from 'lucide-react';
import { formatBiasName } from '@/lib/utils/labels';
import type { ToxicPatternEntry } from '@/lib/data/bias-genome-seed';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  red: '#DC2626',
  redLight: 'rgba(220, 38, 38, 0.08)',
};

export function ToxicComboCard({ pattern }: { pattern: ToxicPatternEntry }) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 14,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: C.redLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Link2 size={14} style={{ color: C.red }} />
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: C.slate400,
              }}
            >
              Toxic combination
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.slate900, marginTop: 2 }}>
              {pattern.name}
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.red,
            fontFamily: 'var(--font-mono, monospace)',
            padding: '4px 8px',
            borderRadius: 6,
            background: C.redLight,
            whiteSpace: 'nowrap',
          }}
        >
          n={pattern.caseCount}
        </span>
      </div>

      <p style={{ fontSize: 13, color: C.slate600, lineHeight: 1.6, margin: 0 }}>
        {pattern.description}
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {pattern.biases.map(b => (
          <span
            key={b}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: 999,
              background: C.slate100,
              color: C.slate600,
              fontSize: 11.5,
              fontWeight: 600,
            }}
          >
            {formatBiasName(b)}
          </span>
        ))}
      </div>

      {pattern.caseExamples.length > 0 && (
        <div
          style={{
            borderTop: `1px dashed ${C.slate200}`,
            paddingTop: 12,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: C.slate400,
              marginBottom: 6,
            }}
          >
            Appears in
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {pattern.caseExamples.map(ex => (
              <Link
                key={ex.slug}
                href={`/case-studies/${ex.slug}`}
                style={{
                  fontSize: 12,
                  color: C.slate600,
                  textDecoration: 'none',
                  fontWeight: 600,
                  padding: '4px 9px',
                  borderRadius: 6,
                  background: C.slate100,
                  whiteSpace: 'nowrap',
                }}
              >
                {ex.company}
                <span style={{ color: C.slate400, fontWeight: 500, marginLeft: 4 }}>
                  · {ex.year}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
