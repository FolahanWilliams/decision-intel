import Link from 'next/link';
import Image from 'next/image';

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
          maxWidth: 1280,
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
          <Image
            src="/logo.png"
            alt="Decision Intel"
            width={28}
            height={28}
            style={{ borderRadius: 6, objectFit: 'cover' }}
          />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <Link
            href="/how-it-works"
            className="nav-link-hide-mobile"
            style={{
              fontSize: 14,
              color: '#CBD5E1',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            How It Works
          </Link>
          <Link
            href="/proof"
            className="nav-link-hide-mobile"
            style={{
              fontSize: 14,
              color: '#CBD5E1',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Proof
          </Link>
          <Link
            href="/bias-genome"
            className="nav-link-hide-mobile"
            style={{
              fontSize: 14,
              color: '#CBD5E1',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Bias Genome
          </Link>
          <Link
            href="/case-studies"
            className="nav-link-hide-mobile"
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
              fontSize: 13,
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
              fontSize: 13,
              color: C.white,
              textDecoration: 'none',
              fontWeight: 600,
              background: C.green,
              padding: '7px 14px',
              borderRadius: 8,
              whiteSpace: 'nowrap',
            }}
          >
            Request a pilot
          </Link>
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .nav-link-hide-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

export const BRAND_COLORS = C;
