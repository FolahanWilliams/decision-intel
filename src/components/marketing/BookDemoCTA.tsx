'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Check } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';

/**
 * Book-a-design-partner-call CTA.
 *
 * Three variants for different surfaces on the marketing site and the
 * post-analysis product reveal:
 *
 *   - `hero`   — full card with eyebrow + headline + sub + big green
 *                pill button + supporting chips. Used as the primary
 *                conversion beat below CategoryGapShowcase and as one of
 *                two tracks in the landing final CTA.
 *   - `inline` — medium pill button + short tagline in a single row.
 *                Used inside the post-reveal `InlineAnalysisResultCard`
 *                and anywhere we want a single-line "book a call"
 *                affordance without the marketing framing.
 *   - `nav`    — compact accent pill for the sticky landing nav.
 *                Sits next to "Try the Demo" so visitors can choose the
 *                product-led path or the human-led path.
 *
 * Booking URL comes from NEXT_PUBLIC_DEMO_BOOKING_URL (Calendly link).
 * Falls back to /pricing#design-partner if the env var is not set so the
 * button never dead-ends.
 *
 * Every click is tracked via `trackEvent('book_demo_click', { source })`
 * so the funnel is observable from day one.
 */

const FALLBACK_HREF = '/pricing#design-partner';

function getBookingHref(): { href: string; external: boolean } {
  const url = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL;
  if (url && url.length > 0) {
    return { href: url, external: true };
  }
  return { href: FALLBACK_HREF, external: false };
}

interface Props {
  /** Visual variant — see JSDoc above. */
  variant: 'hero' | 'inline' | 'nav';
  /** Analytics source label so we can slice `book_demo_click` by surface. */
  source: string;
  /** Optional headline override (hero variant only). */
  heading?: string;
  /** Optional sub-headline override (hero variant only). */
  sub?: string;
  /** Optional button-label override. */
  label?: string;
}

const C = {
  navy: '#0F172A',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenBorder: '#86EFAC',
} as const;

export function BookDemoCTA({ variant, source, heading, sub, label }: Props) {
  const { href, external } = getBookingHref();
  const onClick = () => trackEvent('book_demo_click', { source });

  const LinkProps = external
    ? { href, target: '_blank' as const, rel: 'noopener noreferrer' }
    : { href };

  if (variant === 'nav') {
    return (
      <Link
        {...LinkProps}
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: C.green,
          background: 'transparent',
          border: `1px solid ${C.greenBorder}`,
          padding: '7px 14px',
          borderRadius: 8,
          textDecoration: 'none',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = C.greenLight;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Calendar size={13} strokeWidth={2.25} />
        {label ?? 'Book a call'}
      </Link>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          padding: '14px 18px',
          background: C.slate50,
          border: `1px solid ${C.greenBorder}`,
          borderRadius: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.slate900,
              lineHeight: 1.4,
              marginBottom: 2,
            }}
          >
            {heading ?? 'Want to walk through this live?'}
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.slate600,
              lineHeight: 1.4,
            }}
          >
            {sub ?? '30 minutes with the founder. Bring a recent memo, leave with the audit.'}
          </div>
        </div>
        <Link
          {...LinkProps}
          onClick={onClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: C.white,
            background: C.green,
            padding: '9px 18px',
            borderRadius: 8,
            textDecoration: 'none',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <Calendar size={13} strokeWidth={2.4} />
          {label ?? 'Book a 30-min call'}
          <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  // variant === 'hero'
  return (
    <>
      <style>{`
        @media (max-width: 759px) {
          .book-demo-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .book-demo-hero-chips {
            order: 2;
          }
        }
      `}</style>
      <div
        style={{
          background: `linear-gradient(135deg, ${C.white} 0%, ${C.greenLight} 100%)`,
          border: `1px solid ${C.greenBorder}`,
          borderRadius: 20,
          padding: 'clamp(24px, 4vw, 36px)',
          boxShadow: '0 4px 24px rgba(22, 163, 74, 0.08)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 28,
          alignItems: 'center',
        }}
        className="book-demo-hero-grid"
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: C.green,
              background: C.white,
              border: `1px solid ${C.greenBorder}`,
              padding: '4px 10px',
              borderRadius: 999,
              marginBottom: 14,
            }}
          >
            <Calendar size={11} strokeWidth={2.4} />
            Design partner programme
          </div>
          <h3
            style={{
              fontSize: 'clamp(22px, 2.6vw, 30px)',
              fontWeight: 800,
              color: C.slate900,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              margin: '0 0 10px',
            }}
          >
            {heading ?? 'Run your next strategic memo through the platform. Leave with the audit.'}
          </h3>
          <p
            style={{
              fontSize: 'clamp(13px, 1.25vw, 15px)',
              color: C.slate600,
              lineHeight: 1.6,
              margin: '0 0 18px',
              maxWidth: 560,
            }}
          >
            {sub ??
              'Thirty minutes with the founder. No slides. We run one of your recent memos through the causal graph, the outcome flywheel, and the framework mapper, live on the call.'}
          </p>
          <Link
            {...LinkProps}
            onClick={onClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 15,
              fontWeight: 700,
              color: C.white,
              background: C.green,
              padding: '13px 24px',
              borderRadius: 10,
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(22, 163, 74, 0.28)',
            }}
          >
            <Calendar size={15} strokeWidth={2.4} />
            {label ?? 'Book a 30-min design partner call'}
            <ArrowRight size={15} />
          </Link>
        </div>

        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
          className="book-demo-hero-chips"
        >
          {[
            '30 minutes · no slides',
            'Live on your own strategic memo',
            'You leave with the audit + the Decision Provenance Record',
            'Five design-partner seats · four still open',
          ].map(chip => (
            <li
              key={chip}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: C.white,
                border: `1px solid ${C.greenBorder}`,
                borderRadius: 10,
                padding: '10px 14px',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: C.green,
                  color: C.white,
                  flexShrink: 0,
                  marginTop: 1,
                }}
                aria-hidden
              >
                <Check size={12} strokeWidth={3} />
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.slate900,
                  lineHeight: 1.45,
                }}
              >
                {chip}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/**
 * Tiny helper for raw-button contexts (e.g. footer links) where we want
 * the booking href resolved but no surrounding chrome. Exports the same
 * tracking behaviour.
 */
export function useBookDemoLink(source: string) {
  const { href, external } = getBookingHref();
  return {
    href,
    external,
    onClick: () => trackEvent('book_demo_click', { source }),
  };
}
