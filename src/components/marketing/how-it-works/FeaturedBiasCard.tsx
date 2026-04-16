import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  violet: '#7C3AED',
  violetLight: 'rgba(124, 58, 237, 0.08)',
};

interface FeaturedBiasCardProps {
  taxonomyId: string;
  biasKey: string;
  label: string;
  description: string;
  example: {
    title: string;
    company: string;
    year: string;
  };
}

export function FeaturedBiasCard({
  taxonomyId,
  biasKey,
  label,
  description,
  example,
}: FeaturedBiasCardProps) {
  return (
    <Link
      href={`/taxonomy#${biasKey}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '22px 22px 18px',
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        textDecoration: 'none',
        color: C.slate900,
        transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = C.violet;
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = C.slate200;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            padding: '3px 8px',
            borderRadius: 5,
            background: C.violetLight,
            color: C.violet,
            letterSpacing: '0.02em',
          }}
        >
          {taxonomyId}
        </span>
        <ArrowUpRight size={14} style={{ color: C.slate400 }} />
      </div>

      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: C.slate900,
          lineHeight: 1.25,
        }}
      >
        {label}
      </div>

      <p
        style={{
          fontSize: 13,
          color: C.slate600,
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {description}
      </p>

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 12,
          borderTop: `1px dashed ${C.slate200}`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: C.slate900 }}>
          {example.company}
          <span style={{ color: C.slate400, fontWeight: 500, marginLeft: 6 }}>· {example.year}</span>
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: C.slate400,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          See the case
        </span>
      </div>
    </Link>
  );
}
