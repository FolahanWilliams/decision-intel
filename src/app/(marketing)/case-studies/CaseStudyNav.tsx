import Link from 'next/link';
import { Brain } from 'lucide-react';

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  white: '#FFFFFF',
  green: '#16A34A',
  greenDark: '#15803D',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate600: '#475569',
  slate900: '#0F172A',
} as const;

/** Minimal marketing nav reused across the case-study library routes. */
export function CaseStudyNav() {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: C.navy,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <Brain size={24} style={{ color: C.green }} />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: C.white,
              letterSpacing: '-0.02em',
            }}
          >
            Decision Intel
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link
            href="/case-studies"
            style={{
              fontSize: 14,
              color: '#CBD5E1',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Case Studies
          </Link>
          <Link
            href="/"
            style={{
              fontSize: 14,
              color: '#CBD5E1',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Home
          </Link>
          <Link
            href="/demo"
            style={{
              fontSize: 14,
              color: C.white,
              textDecoration: 'none',
              fontWeight: 600,
              background: C.green,
              padding: '8px 16px',
              borderRadius: 8,
            }}
          >
            Request a pilot
          </Link>
        </div>
      </div>
    </nav>
  );
}

export const BRAND_COLORS = C;
