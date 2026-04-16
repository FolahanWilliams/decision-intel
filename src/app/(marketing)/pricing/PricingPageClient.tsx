'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, ChevronDown, Minus } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';

type BillingCycle = 'monthly' | 'annual';

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#F0FDF4',
  greenBorder: '#BBF7D0',
};

interface Tier {
  id: 'free' | 'pro' | 'team' | 'enterprise';
  name: string;
  tagline: string;
  priceMonthly: number | null;
  priceAnnual: number | null;
  customPrice?: string;
  highlights: string[];
  cta: { label: string; href?: string; action?: 'checkout-pro' | 'checkout-team' | 'contact' };
  badge?: string;
  featured?: boolean;
}

function buildTiers(_cycle: BillingCycle): Tier[] {
  return [
    {
      id: 'free',
      name: 'Free',
      tagline: 'See what we flag',
      priceMonthly: 0,
      priceAnnual: 0,
      highlights: [
        '4 audits per month',
        'Core DQI + bias detection',
        'Boardroom Simulation (limited)',
        'Export to PDF',
      ],
      cta: { label: 'Sign up free', href: '/login' },
    },
    {
      id: 'pro',
      name: 'Individual',
      tagline: 'For the high-stakes strategist',
      priceMonthly: 249,
      priceAnnual: 2490,
      highlights: [
        '15 audits per month',
        'Full DQI + 30+ cognitive biases',
        'Boardroom Simulation + Forgotten Questions',
        'Personal Decision History',
        'Personal Calibration Dashboard',
      ],
      cta: { label: 'Start Individual', action: 'checkout-pro' },
    },
    {
      id: 'team',
      name: 'Strategy',
      tagline: 'For corporate strategy teams',
      priceMonthly: 2499,
      priceAnnual: null,
      highlights: [
        'Unlimited audits, 15 seats',
        'Shared Decision Knowledge Graph',
        'Decision Rooms + team consensus',
        'Slack, Drive, Email integrations',
        'Compliance mapping + audit logs',
        'Team DQI analytics',
      ],
      cta: { label: 'Start 30-day pilot', action: 'checkout-team' },
      badge: 'Most popular for teams',
      featured: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'For Fortune 500 strategy functions',
      priceMonthly: null,
      priceAnnual: null,
      customPrice: 'Custom',
      highlights: [
        'Everything in Strategy',
        'Unlimited seats + multi-division',
        'SSO + custom taxonomy',
        'Dedicated support + SLA',
        'Annual contract pricing',
      ],
      cta: { label: 'Contact sales', action: 'contact' },
    },
  ];
}

const COMPARISON_ROWS: Array<{
  label: string;
  section?: string;
  free: string | boolean;
  pro: string | boolean;
  team: string | boolean;
  enterprise: string | boolean;
}> = [
  { section: 'Core analysis', label: '', free: '', pro: '', team: '', enterprise: '' },
  {
    label: 'Audits per month',
    free: '4',
    pro: '15',
    team: 'Unlimited',
    enterprise: 'Unlimited',
  },
  { label: 'Decision Quality Index (DQI)', free: true, pro: true, team: true, enterprise: true },
  { label: 'Cognitive biases detected', free: '5', pro: '30+', team: '30+', enterprise: '30+' },
  {
    label: 'Boardroom Simulation',
    free: 'Limited',
    pro: true,
    team: true,
    enterprise: true,
  },
  { label: 'Forgotten Questions engine', free: false, pro: true, team: true, enterprise: true },
  { label: 'Export to PDF', free: true, pro: true, team: true, enterprise: true },
  { section: 'Personal workflow', label: '', free: '', pro: '', team: '', enterprise: '' },
  {
    label: 'Personal Decision History',
    free: false,
    pro: true,
    team: true,
    enterprise: true,
  },
  {
    label: 'Personal Calibration Dashboard',
    free: false,
    pro: true,
    team: true,
    enterprise: true,
  },
  { section: 'Team features', label: '', free: '', pro: '', team: '', enterprise: '' },
  {
    label: 'Decision Knowledge Graph (cross-user)',
    free: false,
    pro: false,
    team: true,
    enterprise: true,
  },
  {
    label: 'Decision Rooms (team consensus)',
    free: false,
    pro: false,
    team: true,
    enterprise: true,
  },
  {
    label: 'Slack, Drive, Email integrations',
    free: false,
    pro: false,
    team: true,
    enterprise: true,
  },
  {
    label: 'Compliance mapping + audit logs',
    free: false,
    pro: false,
    team: true,
    enterprise: true,
  },
  {
    label: 'Custom toxic combination weights',
    free: false,
    pro: false,
    team: true,
    enterprise: true,
  },
  {
    label: 'Team DQI analytics',
    free: false,
    pro: false,
    team: true,
    enterprise: true,
  },
  { section: 'Enterprise', label: '', free: '', pro: '', team: '', enterprise: '' },
  { label: 'SSO', free: false, pro: false, team: false, enterprise: true },
  {
    label: 'Multi-division + custom taxonomy',
    free: false,
    pro: false,
    team: false,
    enterprise: true,
  },
  {
    label: 'Dedicated support + SLA',
    free: false,
    pro: false,
    team: false,
    enterprise: true,
  },
  { label: 'Team seats', free: '1', pro: '1', team: '15', enterprise: 'Unlimited' },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Can I upgrade or downgrade at any time?',
    a: 'Yes. Upgrades apply immediately and are prorated. Downgrades take effect at the end of your current billing period. Your Personal Decision History and Knowledge Graph data travel with you.',
  },
  {
    q: 'What happens to my data if I upgrade from Individual to Strategy?',
    a: 'Your Personal Decision History stays yours by default. During team onboarding, you explicitly opt in (per user) to merge your memos into the team Decision Knowledge Graph. If you decline, your private memos stay private and your seat still counts against the team plan.',
  },
  {
    q: 'How does the 30-day pilot work?',
    a: 'Strategy includes a 30-day pilot. No card required to start. During the pilot, your team\u2019s Knowledge Graph hydrates from each user\u2019s Personal Decision History as they opt in. At the end of the pilot, you either subscribe or revert cleanly with your personal data intact.',
  },
  {
    q: 'What team features can I not access on Individual?',
    a: 'Individual is intentionally solo: no Decision Rooms, no shared Knowledge Graph, no Slack/Drive/Email integrations, no compliance mapping, no custom toxic combination weights. These are team-only features that unlock on Strategy.',
  },
  {
    q: 'Do you offer annual discounts?',
    a: 'Individual is $249/mo or $2,490/yr (save ~16%). Strategy is billed monthly at $2,499. Enterprise is negotiated annually.',
  },
  {
    q: 'Are you SOC 2 compliant?',
    a: 'We run on SOC 2 certified infrastructure (Supabase, Vercel). Documents are encrypted with AES-256-GCM at rest and TLS 1.3 in transit. A GDPR anonymization layer strips PII before any AI processing.',
  },
];

export function PricingPageClient() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const tiers = buildTiers(cycle);

  const handleCheckout = async (tierId: 'pro' | 'team') => {
    setCheckoutLoading(tierId);
    trackEvent('pricing_page_cta_clicked', { tier: tierId, cycle });
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: tierId, cycle: tierId === 'pro' ? cycle : 'monthly' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      // Fallback: send to login if Stripe not available
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleContact = () => {
    trackEvent('pricing_page_cta_clicked', { tier: 'enterprise', cycle: 'n/a' });
    window.location.href =
      'mailto:folahanwilliams@gmail.com?subject=Decision%20Intel%20Enterprise%20Inquiry';
  };

  return (
    <div style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 40px' }}>
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.green,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}
          >
            Pricing
          </p>
          <h1
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: C.slate900,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
            }}
          >
            Pricing that matches the stakes of your decisions.
          </h1>
          <p
            style={{
              fontSize: 18,
              color: C.slate600,
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Start free. Upgrade to Individual when you want the career-defining edge. Bring your
            team on Strategy when judgment needs to compound across the function.
          </p>
        </div>

        {/* Billing toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 32,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: 4,
              background: C.slate100,
              borderRadius: 10,
              border: `1px solid ${C.slate200}`,
            }}
          >
            {(['monthly', 'annual'] as BillingCycle[]).map(option => (
              <button
                key={option}
                onClick={() => setCycle(option)}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: cycle === option ? C.white : 'transparent',
                  color: cycle === option ? C.slate900 : C.slate500,
                  boxShadow: cycle === option ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {option === 'monthly' ? 'Monthly' : 'Annual'}
                {option === 'annual' && (
                  <span style={{ color: C.green, marginLeft: 6, fontSize: 11 }}>Save 16%</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tier cards */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
          className="pricing-cards-grid"
        >
          {tiers.map(tier => {
            const showPrice =
              tier.id === 'pro'
                ? cycle === 'annual'
                  ? tier.priceAnnual
                  : tier.priceMonthly
                : tier.priceMonthly;
            const priceLabel =
              tier.customPrice ??
              (showPrice === 0
                ? '$0'
                : showPrice !== null && showPrice !== undefined
                  ? `$${showPrice.toLocaleString()}`
                  : '');
            const priceSuffix =
              tier.id === 'pro'
                ? cycle === 'annual'
                  ? '/yr'
                  : '/mo'
                : tier.id === 'team'
                  ? '/mo'
                  : tier.id === 'free'
                    ? ''
                    : '';

            return (
              <div
                key={tier.id}
                style={{
                  background: tier.featured ? C.slate900 : C.white,
                  color: tier.featured ? C.white : C.slate900,
                  border: tier.featured ? `1px solid ${C.slate900}` : `1px solid ${C.slate200}`,
                  borderRadius: 16,
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  position: 'relative',
                  boxShadow: tier.featured
                    ? '0 12px 32px rgba(15, 23, 42, 0.18)'
                    : '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                {tier.badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: C.green,
                      color: C.white,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 999,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tier.badge}
                  </div>
                )}

                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: tier.featured ? C.white : C.slate900,
                      marginBottom: 4,
                    }}
                  >
                    {tier.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: tier.featured ? 'rgba(255,255,255,0.65)' : C.slate500,
                      lineHeight: 1.5,
                    }}
                  >
                    {tier.tagline}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: tier.featured ? C.white : C.slate900,
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {priceLabel}
                  </span>
                  {priceSuffix && (
                    <span
                      style={{
                        fontSize: 14,
                        color: tier.featured ? 'rgba(255,255,255,0.55)' : C.slate500,
                      }}
                    >
                      {priceSuffix}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tier.highlights.map(h => (
                    <div
                      key={h}
                      style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13 }}
                    >
                      <Check
                        size={14}
                        style={{
                          color: tier.featured ? '#22c55e' : C.green,
                          flexShrink: 0,
                          marginTop: 3,
                        }}
                      />
                      <span
                        style={{
                          color: tier.featured ? 'rgba(255,255,255,0.88)' : C.slate600,
                          lineHeight: 1.5,
                        }}
                      >
                        {h}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                  {tier.cta.href ? (
                    <Link
                      href={tier.cta.href}
                      onClick={() =>
                        trackEvent('pricing_page_cta_clicked', { tier: tier.id, cycle })
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: tier.featured ? C.green : C.slate900,
                        color: C.white,
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      {tier.cta.label} <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        if (tier.cta.action === 'checkout-pro') handleCheckout('pro');
                        else if (tier.cta.action === 'checkout-team') handleCheckout('team');
                        else if (tier.cta.action === 'contact') handleContact();
                      }}
                      disabled={checkoutLoading === tier.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: tier.featured ? C.green : C.slate900,
                        color: C.white,
                        fontSize: 14,
                        fontWeight: 600,
                        border: 'none',
                        cursor: checkoutLoading === tier.id ? 'wait' : 'pointer',
                        opacity: checkoutLoading === tier.id ? 0.7 : 1,
                      }}
                    >
                      {checkoutLoading === tier.id ? 'Redirecting...' : tier.cta.label}
                      {checkoutLoading !== tier.id && <ArrowRight size={14} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detailed comparison */}
      <section
        style={{
          background: C.slate50,
          borderTop: `1px solid ${C.slate200}`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px' }}>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: C.slate900,
              textAlign: 'center',
              marginBottom: 8,
              letterSpacing: '-0.01em',
            }}
          >
            Full feature comparison
          </h2>
          <p
            style={{
              fontSize: 15,
              color: C.slate500,
              textAlign: 'center',
              marginBottom: 40,
            }}
          >
            Every capability, every tier.
          </p>

          <div
            style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              borderRadius: 16,
              border: `1px solid ${C.slate200}`,
              background: C.white,
            }}
          >
          <div
            style={{
              minWidth: 720,
              background: C.white,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                background: C.slate50,
                borderBottom: `1px solid ${C.slate200}`,
                padding: '14px 20px',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: C.slate500,
              }}
            >
              <div>Feature</div>
              <div style={{ textAlign: 'center' }}>Free</div>
              <div style={{ textAlign: 'center' }}>Individual</div>
              <div style={{ textAlign: 'center', color: C.green }}>Strategy</div>
              <div style={{ textAlign: 'center' }}>Enterprise</div>
            </div>

            {COMPARISON_ROWS.map((row, i) => {
              if (row.section) {
                return (
                  <div
                    key={`section-${i}`}
                    style={{
                      padding: '16px 20px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: C.green,
                      background: C.slate50,
                      borderTop: i > 0 ? `1px solid ${C.slate200}` : 'none',
                    }}
                  >
                    {row.section}
                  </div>
                );
              }

              return (
                <div
                  key={`row-${i}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                    padding: '14px 20px',
                    fontSize: 13,
                    color: C.slate600,
                    borderTop: `1px solid ${C.slate100}`,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ color: C.slate900, fontWeight: 500 }}>{row.label}</div>
                  <CellValue value={row.free} />
                  <CellValue value={row.pro} />
                  <CellValue value={row.team} />
                  <CellValue value={row.enterprise} />
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: '80px 24px' }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: C.slate900,
            textAlign: 'center',
            marginBottom: 32,
            letterSpacing: '-0.01em',
          }}
        >
          Frequently asked questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQ.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={item.q}
                style={{
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: C.white,
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '16px 20px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 15,
                    fontWeight: 600,
                    color: C.slate900,
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      color: C.slate400,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                    }}
                  />
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 20px 16px',
                      fontSize: 14,
                      color: C.slate600,
                      lineHeight: 1.7,
                    }}
                  >
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ background: C.slate50, borderTop: `1px solid ${C.slate200}` }}>
        <div
          style={{
            maxWidth: 720,
            margin: '0 auto',
            padding: '64px 24px',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: C.slate900,
              marginBottom: 12,
              letterSpacing: '-0.01em',
            }}
          >
            Start with Free. Upgrade when the stakes go up.
          </h2>
          <p style={{ fontSize: 15, color: C.slate600, marginBottom: 24, lineHeight: 1.6 }}>
            4 audits a month on us. No card. No commitment.
          </p>
          <Link
            href="/login"
            onClick={() => trackEvent('pricing_page_final_cta_clicked', {})}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              background: C.green,
              color: C.white,
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 10,
              textDecoration: 'none',
            }}
          >
            Sign up free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 1024px) {
          .pricing-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .pricing-cards-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <div style={{ textAlign: 'center' }}>
        <Check size={16} style={{ color: C.green }} />
      </div>
    );
  }
  if (value === false) {
    return (
      <div style={{ textAlign: 'center' }}>
        <Minus size={14} style={{ color: C.slate400 }} />
      </div>
    );
  }
  return (
    <div style={{ textAlign: 'center', fontSize: 13, color: C.slate600, fontWeight: 500 }}>
      {value}
    </div>
  );
}
