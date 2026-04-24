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
  role: string;
  tagline: string;
  priceMonthly: number | null;
  priceAnnual: number | null;
  customPrice?: string;
  /** Shown under the price — one calm anchor line (annual equivalent or similar). */
  anchor?: string;
  highlights: Array<{ label: string; strong?: boolean }>;
  cta: { label: string; href?: string; action?: 'checkout-pro' | 'checkout-team' | 'contact' };
  badge?: string;
  featured?: boolean;
}

function buildTiers(_cycle: BillingCycle): Tier[] {
  // Card order matters for mobile (1 col) and tablet (2 col) — the featured
  // tier must land above the fold. Free stays first as the familiar CVR
  // entry; Strategy (featured) sits second so it's visible on every device
  // without scroll; Individual is third as the fallback path; Enterprise
  // anchors the right end. The comparison table below mirrors this order.
  return [
    {
      id: 'free',
      name: 'Free',
      role: 'Just exploring',
      tagline: 'See what we flag on your first memo. No card needed.',
      priceMonthly: 0,
      priceAnnual: 0,
      anchor: 'Forever free · upgrade any time',
      highlights: [
        { label: '4 audits per month', strong: true },
        { label: 'Core DQI + bias detection' },
        { label: 'Boardroom Simulation (limited)' },
        { label: 'Export to PDF' },
      ],
      cta: { label: 'Sign up free', href: '/login' },
    },
    {
      id: 'team',
      name: 'Strategy',
      role: 'Corporate strategy team',
      tagline: 'For teams producing multiple board-level memos a quarter.',
      priceMonthly: 2499,
      priceAnnual: null,
      anchor: '$24,990/year · ~10× cheaper than one consulting week',
      highlights: [
        { label: 'Unlimited audits, 15 seats', strong: true },
        { label: 'Shared Decision Knowledge Graph', strong: true },
        { label: 'Decision Rooms + team consensus' },
        { label: 'Slack, Drive, Email integrations' },
        { label: 'Compliance mapping + audit logs' },
        { label: 'Team DQI analytics' },
      ],
      cta: { label: 'Start 30-day pilot', action: 'checkout-team' },
      badge: 'Most popular',
      featured: true,
    },
    {
      id: 'pro',
      name: 'Individual',
      role: 'Solo strategy operator',
      tagline: 'The career-defining edge for a Head of Strategy, CorpDev lead, or M&A operator.',
      priceMonthly: 249,
      priceAnnual: 2490,
      anchor: '$2,490/year (save ~16%) on annual',
      highlights: [
        { label: '15 audits per month', strong: true },
        { label: 'Full DQI + 30+ cognitive biases' },
        { label: 'Boardroom Simulation + Forgotten Questions' },
        { label: 'Personal Decision History' },
        { label: 'Calibration dashboard' },
      ],
      cta: { label: 'Start Individual', action: 'checkout-pro' },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      role: 'Fortune 500 strategy function',
      tagline: 'Multi-division workflows, compliance SLAs, and a deployment partner.',
      priceMonthly: null,
      priceAnnual: null,
      customPrice: 'Custom',
      anchor: 'Annual · negotiated per seat',
      highlights: [
        { label: 'Unlimited team seats', strong: true },
        { label: 'SSO + SCIM + custom taxonomy' },
        { label: 'Multi-division management' },
        { label: 'Signed DPA + audit-log retention SLA' },
        { label: 'EU-region hosting option' },
        { label: 'Everything in Strategy' },
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
      'mailto:team@decision-intel.com?subject=Decision%20Intel%20Enterprise%20Inquiry';
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

      {/* Regulatory trust band */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 10,
            padding: '14px 20px',
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            borderRadius: 10,
            fontSize: 13.5,
            lineHeight: 1.55,
            color: C.slate600,
            textAlign: 'center',
          }}
        >
          <span>
            <span style={{ fontWeight: 600, color: C.slate900 }}>
              Decision Provenance Record
            </span>{' '}
            on every audit · mapped to EU AI Act Art. 14, Basel III ICAAP, and SEC AI disclosure.
          </span>
          <Link
            href="/security"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: C.green,
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            See the mapping
            <ArrowRight size={13} />
          </Link>
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

            const isFeatured = !!tier.featured;
            return (
              <div
                key={tier.id}
                style={{
                  background: C.white,
                  color: C.slate900,
                  border: isFeatured ? `2px solid ${C.green}` : `1px solid ${C.slate200}`,
                  borderRadius: 20,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  position: 'relative',
                  boxShadow: isFeatured
                    ? '0 12px 36px rgba(22,163,74,0.14)'
                    : '0 4px 18px rgba(15,23,42,0.05)',
                }}
              >
                {tier.badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -13,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: C.green,
                      color: C.white,
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '5px 14px',
                      borderRadius: 999,
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                      boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tier.badge}
                  </div>
                )}

                {/* Role chip */}
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: isFeatured ? C.green : C.slate500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  {tier.role}
                </div>

                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.slate900,
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {tier.name}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span
                    style={{
                      fontSize: 40,
                      fontWeight: 800,
                      color: C.slate900,
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {priceLabel}
                  </span>
                  {priceSuffix && (
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: C.slate400,
                      }}
                    >
                      {priceSuffix}
                    </span>
                  )}
                </div>
                {tier.anchor && (
                  <div
                    style={{
                      fontSize: 12,
                      color: C.slate400,
                      marginTop: -6,
                    }}
                  >
                    {tier.anchor}
                  </div>
                )}

                <p
                  style={{
                    fontSize: 13.5,
                    color: C.slate600,
                    lineHeight: 1.55,
                    margin: '2px 0 4px',
                  }}
                >
                  {tier.tagline}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tier.highlights.map(h => (
                    <div
                      key={h.label}
                      style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13.5 }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          background: C.greenLight,
                          color: C.green,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <span
                        style={{
                          color: h.strong ? C.slate900 : C.slate600,
                          fontWeight: h.strong ? 600 : 500,
                          lineHeight: 1.5,
                        }}
                      >
                        {h.label}
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
                        padding: '14px 18px',
                        borderRadius: 12,
                        background: isFeatured ? C.green : C.white,
                        border: isFeatured ? 'none' : `1px solid ${C.slate200}`,
                        color: isFeatured ? C.white : C.slate900,
                        fontSize: 14,
                        fontWeight: 700,
                        textDecoration: 'none',
                        boxShadow: isFeatured ? '0 6px 20px rgba(22,163,74,0.28)' : 'none',
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
                        padding: '14px 18px',
                        borderRadius: 12,
                        background: isFeatured ? C.green : C.white,
                        border: isFeatured ? 'none' : `1px solid ${C.slate200}`,
                        color: isFeatured ? C.white : C.slate900,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: checkoutLoading === tier.id ? 'wait' : 'pointer',
                        opacity: checkoutLoading === tier.id ? 0.7 : 1,
                        boxShadow: isFeatured ? '0 6px 20px rgba(22,163,74,0.28)' : 'none',
                      }}
                    >
                      {checkoutLoading === tier.id ? 'Redirecting…' : tier.cta.label}
                      {checkoutLoading !== tier.id && <ArrowRight size={14} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust band — mirrors the landing page pricing section */}
        <div
          style={{
            maxWidth: 1160,
            margin: '40px auto 0',
            padding: '20px 24px',
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            alignItems: 'center',
          }}
        >
          {[
            { label: 'SOC 2 ready', sub: 'AES-256-GCM + TLS 1.3' },
            { label: 'Signed DPA', sub: 'on any paid tier' },
            { label: 'No training on your data', sub: 'ever, by contract' },
            { label: 'Decision Provenance Record', sub: 'signed + hashed on every audit' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: C.greenLight,
                  color: C.green,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <Check size={12} strokeWidth={3} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.slate900, lineHeight: 1.3 }}>
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: C.slate500,
                    lineHeight: 1.35,
                    marginTop: 1,
                  }}
                >
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Design-partner program — quiet, procurement-coded strip.
            Not a pricing tier: a separate cohort referenced under the
            main cards so CSOs arriving via warm intro know the path
            exists without crowding the primary tiers. */}
        <div
          style={{
            maxWidth: 1160,
            margin: '20px auto 0',
            padding: '18px 22px',
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            borderRadius: 14,
            display: 'flex',
            gap: 18,
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 4,
              }}
            >
              Design Partner Program &middot; 5 seats
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900, lineHeight: 1.4 }}>
              $1,999/mo locked for 12 months. 20% off Strategy list.
            </div>
            <div style={{ fontSize: 12.5, color: C.slate500, marginTop: 3, lineHeight: 1.5 }}>
              Fortune 500 corporate strategy teams shaping the Recognition-Rigor Framework. Decision
              Provenance Record bundled on every audit. Direct Slack line to the founder.
            </div>
          </div>
          <Link
            href="/design-partner"
            onClick={() => trackEvent('pricing_page_design_partner_clicked', {})}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              background: C.white,
              border: `1px solid ${C.slate200}`,
              color: C.slate900,
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 10,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            See the program <ArrowRight size={13} />
          </Link>
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
                <div style={{ textAlign: 'center', color: C.green }}>Strategy</div>
                <div style={{ textAlign: 'center' }}>Individual</div>
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
                    <CellValue value={row.team} />
                    <CellValue value={row.pro} />
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

      {/* Mobile responsive — rules moved to globals.css (.pricing-cards-grid).
          Inline <style> blocks with @media queries trigger a Next.js 16.2 SWC
          compiler hang — see fix in commit for details. */}
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
