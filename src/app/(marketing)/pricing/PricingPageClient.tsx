'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, ChevronDown, Minus } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';
import {
  SOC2_FAQ_ANSWER,
  SOC2_TRUST_BAND_LABEL,
  SOC2_TRUST_BAND_SUB,
  DPR_PROVENANCE_CARD_LABEL,
  DPR_PROVENANCE_CARD_SUB,
} from '@/lib/constants/trust-copy';
import { DESIGN_PARTNER_SEATS_TOTAL } from '@/lib/constants/company-info';
import { ENTERPRISE_QUOTE_DEFAULTS } from '@/lib/stripe';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';

const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;

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
  /**
   * Protected-value strap (locked 2026-04-27 — positioning shift from
   * "selling features" to "selling protected revenue / business
   * outcomes"). Renders as a green-bordered callout above the feature
   * highlights so a CSO / fund partner reads "what this protects" BEFORE
   * "what this includes." Per NotebookLM "highest-ROI positioning"
   * synthesis: per-decision dollar anchor tied to ticket size beats
   * organisation-wide percentage claims.
   */
  protectedValue?: string;
  priceMonthly: number | null;
  priceAnnual: number | null;
  customPrice?: string;
  /** Shown under the price — one calm anchor line (annual equivalent or similar). */
  anchor?: string;
  highlights: Array<{ label: string; strong?: boolean }>;
  cta: { label: string; href?: string; action?: 'checkout-pro' | 'checkout-team' | 'contact' };
  /**
   * Optional sibling CTA — locked 2026-04-30 (B3 lock; Margaret + Titi
   * persona ask). On Enterprise the primary CTA promotes the
   * self-serve quote builder so the buyer sees a real ACV without
   * an email gate; the secondary CTA preserves the talk-to-sales
   * path side-by-side. Rendered as an outlined button below the
   * primary green button. Other tiers omit this; the original
   * secondary text-link pattern is preserved for them.
   */
  secondaryCta?: {
    label: string;
    href?: string;
    action?: 'checkout-pro' | 'checkout-team' | 'contact';
  };
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
      protectedValue:
        'Run one audit. See the dollar impact you would have missed. Decide if it is worth the upgrade.',
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
      protectedValue:
        'One avoided £5-15M strategic mistake per quarter pays for the entire team subscription five years over. The price is a rounding error against a single bad call.',
      priceMonthly: 2499,
      priceAnnual: 24990,
      anchor: '$24,990/year · 2 months free · ~10× cheaper than one consulting week',
      highlights: [
        { label: 'Unlimited audits, 12 seats', strong: true },
        { label: 'Shared Decision Knowledge Graph', strong: true },
        { label: 'Team DQI analytics + cross-user calibration' },
        { label: 'Pre-IC blind-prior voting (Decision Rooms)' },
        { label: '3-year retention · audit-committee aligned' },
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
      protectedValue:
        'One audit catches one mistake on one memo and the annual subscription returns 50× over. The audit you can show your manager when the deal goes sideways.',
      priceMonthly: 249,
      priceAnnual: 2490,
      anchor: '$2,490/year (save ~16%) on annual',
      highlights: [
        { label: '100 audits per month', strong: true },
        { label: `Full DQI + ${BIAS_COUNT}-bias R²F taxonomy`, strong: true },
        { label: 'Every feature except team-only ones', strong: true },
        { label: 'Slack + Drive + Email · Decision Rooms · Compliance mapping' },
        { label: 'Custom toxic weights + taxonomy extensions' },
        { label: '250MB uploads · data-room scale' },
      ],
      cta: { label: 'Start Individual', action: 'checkout-pro' },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      role: 'Fortune 500 strategy function',
      tagline: 'Multi-division workflows, compliance SLAs, and a deployment partner.',
      protectedValue:
        'Audit-defensible decisions across the entire strategy function. The provenance record your audit committee asks for and your General Counsel signs off on, before regulators start asking.',
      priceMonthly: null,
      priceAnnual: null,
      // B3 lock 2026-04-30 (Margaret + Titi persona ask) — surface a real
      // starting ACV BEFORE the customer has to give an email or contact
      // sales. Derived from ENTERPRISE_QUOTE_DEFAULTS so the number stays
      // in lock-step with the quote builder. 25 seats × $119/mo × 12.
      customPrice: 'Custom',
      anchor: 'Tailored to your organization · build your number in 3 minutes',
      highlights: [
        {
          label: `Starts at ${ENTERPRISE_QUOTE_DEFAULTS.minSeats} seats`,
          strong: true,
        },
        { label: 'Unlimited audits and Decision Packages' },
        { label: 'SAML 2.0 / OIDC SSO (coming soon) + custom taxonomy' },
        { label: 'Multi-division management' },
        { label: 'Signed DPA + audit-log retention SLA' },
        { label: 'Everything in Strategy' },
      ],
      cta: { label: 'Get a quote', href: '/pricing/quote' },
      // Sibling secondary CTA — sold side-by-side with the primary
      // self-serve quote builder, not buried in a tiny text link.
      secondaryCta: {
        label: 'Talk to sales',
        action: 'contact' as const,
      },
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
    pro: '100',
    team: 'Unlimited',
    enterprise: 'Unlimited',
  },
  { label: 'Decision Quality Index (DQI)', free: true, pro: true, team: true, enterprise: true },
  {
    // Soft-limit pass 2026-05-26: every tier sees the FULL taxonomy.
    // The audit pipeline runs all 22 detectors regardless of plan;
    // showing "5 of 22" on Free was deceptive UI gating without any
    // actual analysis difference. The wedge motion is "see the value
    // first, then pay" — that requires Free seeing the full taxonomy
    // on the audit it just ran.
    label: 'Cognitive biases detected',
    free: `${BIAS_COUNT} (R²F)`,
    pro: `${BIAS_COUNT} (R²F)`,
    team: `${BIAS_COUNT} (R²F)`,
    enterprise: `${BIAS_COUNT} (R²F)`,
  },
  {
    // Pro and Strategy share upload size 2026-05-27 — upload ceiling
    // is NOT a meaningful Pro→Strategy differentiator. The wedge
    // needs real CIMs; the Strategy tier earns its price on team
    // features, not file size.
    label: 'Max upload size',
    free: '25 MB',
    pro: '250 MB',
    team: '250 MB',
    enterprise: '500 MB',
  },
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
    // Soft-limit pass 2026-05-26: cross-user shared graph genuinely
    // needs a team to populate. Stays Team+ only.
    label: 'Decision Knowledge Graph (cross-user)',
    free: false,
    pro: false,
    team: true,
    enterprise: true,
  },
  {
    // Flipped Pro → true 2026-05-26. A solo CSO inviting external
    // advisors (counsel, board members, PE sponsors) into a single
    // memo's room is a real wedge use-case; withholding it forced
    // those one-off external collaborations to happen off-platform.
    label: 'Decision Rooms (team consensus)',
    free: false,
    pro: true,
    team: true,
    enterprise: true,
  },
  {
    // Flipped Pro → true 2026-05-26. Solo users have their own Slack
    // / Drive / email; withholding integrations to "save them for
    // Team" was the displacement-signal trap, not a moat.
    label: 'Slack, Drive, Email integrations',
    free: false,
    pro: true,
    team: true,
    enterprise: true,
  },
  {
    // Flipped Pro → true 2026-05-26. M&A operators on Individual
    // need compliance mapping for the same regulatory reasons a
    // Strategy team does (Basel III, EU AI Act, NDPR for African
    // deals). Audit logs are a per-account artefact, not a team one.
    label: 'Compliance mapping + audit logs',
    free: false,
    pro: true,
    team: true,
    enterprise: true,
  },
  {
    // Flipped Pro → true 2026-05-27 (soft-limit pass #2). A solo
    // CSO or M&A operator tuning weights for their domain (M&A
    // vs market-entry vs portfolio review) doesn't need a team
    // to do so usefully. Wedge gets the power-user feature.
    label: 'Custom toxic combination weights',
    free: false,
    pro: true,
    team: true,
    enterprise: true,
  },
  {
    // Cross-USER analytics, by definition a team concept.
    label: 'Team DQI analytics',
    free: false,
    pro: false,
    team: true,
    enterprise: true,
  },
  { section: 'Deal & M&A workflows', label: '', free: '', pro: '', team: '', enterprise: '' },
  {
    // Flipped Pro → true 2026-05-26. A solo M&A operator running a
    // multi-doc deal (CIM + QofE + IC memo) needs cross-doc conflict
    // detection structurally — withholding it for Team made the
    // wedge tier strictly weaker than the audit pipeline already
    // delivers for free.
    label: 'Cross-document conflict detection',
    free: false,
    pro: true,
    team: true,
    enterprise: true,
  },
  {
    // Flipped Pro → true 2026-05-26. Composite DQI across a deal's
    // documents is a per-DEAL artefact, not a per-team artefact.
    // A solo PE-backed-founder or mid-market corp-dev head running
    // a deal solo benefits identically.
    label: 'Deal-level composite DQI',
    free: false,
    pro: true,
    team: true,
    enterprise: true,
  },
  {
    // Flipped Pro → true 2026-05-26. The DPR is the procurement-grade
    // leave-behind artefact — the wedge buyer (mid-market corp dev /
    // smaller-fund GP / PE-backed founder) needs this most. The
    // multi-document deal DPR ships across both tiers.
    label: 'Deal-level Decision Provenance Record',
    free: false,
    pro: true,
    team: true,
    enterprise: true,
  },
  {
    // Pre-IC blind-prior voting genuinely needs ≥3 voters to produce
    // meaningful aggregation — kept Team+ only.
    label: 'Pre-IC blind-prior voting (Decision Rooms)',
    free: false,
    pro: false,
    team: true,
    enterprise: true,
  },
  {
    label: 'Active Deal handle (concurrent deal slots)',
    free: false,
    pro: false,
    team: 'Fair use',
    enterprise: 'Configurable',
  },
  { section: 'Enterprise', label: '', free: '', pro: '', team: '', enterprise: '' },
  {
    label: 'SAML 2.0 / OIDC SSO (coming soon)',
    free: false,
    pro: false,
    team: false,
    enterprise: true,
  },
  {
    // Custom taxonomy flipped to Pro 2026-05-27 — INDIVIDUAL
    // customization at the type level. A solo CSO with a
    // specialised domain (fintech regulatory, biotech IP,
    // Pan-African FX) benefits without needing a team. Multi-
    // division stays Enterprise-only — genuine F500 scope
    // (cross-org rollup, divisional permissions).
    label: 'Custom taxonomy extensions',
    free: false,
    pro: true,
    team: true,
    enterprise: true,
  },
  {
    label: 'Multi-division rollup + permissions',
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
  {
    // Strategy seats recalibrated to 12 (2026-05-27). The 30-seat
    // default set 2026-05-26 was overcalibrated — a real mid-market
    // strategy team is 5-12 people; above 12 the customer is
    // structurally an Enterprise prospect. The seat count is what
    // differentiates Strategy from Enterprise; upload size + most
    // per-user features now match Individual.
    label: 'Team seats',
    free: '1',
    pro: '1',
    team: '12',
    enterprise: 'Unlimited',
  },
  {
    label: 'Document retention',
    free: '30 days',
    pro: '1 year',
    team: '3 years',
    enterprise: '7 years (SOX §404)',
  },
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
    q: 'How do I know your scoring is reliable? My team will say "the model can\'t replace a CSO\'s judgment."',
    a: 'That objection is itself a documented cognitive bias \u2014 Algorithm Aversion (Dietvorst, Simmons & Massey 2015, Journal of Experimental Psychology: General, doi:10.1037/xge0000033). Humans are systematically more forgiving of human errors than equivalent algorithm errors; after seeing a forecasting algorithm err once, people prefer human judgment even when the algorithm is statistically superior. Decision Intel does NOT replace your CSO\u2019s judgment \u2014 we audit the reasoning the CSO produces. The DQI is a defensible baseline, not a verdict. Per Dietvorst\u2019s 2016 follow-up, people accept imperfect algorithms IF they can slightly modify the inputs or weights \u2014 which is why every customer can tune the DQI component weights to their domain on the Settings \u2192 Preferences panel (T2.1 ship 2026-05-10; methodology stamp 2.3.0). And the algorithm-aversion detector itself is one of the 10 R\u00b2F detectors we run on every memo \u2014 a CSO who dismisses quantitative analysis through narrative judgment is exhibiting exactly the pattern Decision Intel flags. Reproducible methodology, citable paper, user-tunable weights.',
  },
  {
    q: 'What team features can I not access on Individual?',
    a: 'Individual gets essentially every feature except the ones that genuinely require a team. That includes the full 22-bias R²F taxonomy + custom taxonomy extensions, custom toxic combination weights, Slack / Drive / Email integrations, Decision Rooms (for inviting counsel / board / external advisors into a single memo), compliance mapping, cross-document conflict detection, deal-level Decision Provenance Records, and 250MB uploads (same as Strategy). Strategy adds the four features that ONLY work with a team: the shared Decision Knowledge Graph that compounds across users, team DQI analytics (cross-user calibration views), pre-IC blind-prior voting (which needs ≥3 voters to produce meaningful aggregation), and the team seats themselves (12 included). The split is "what compounds with one user" vs "what compounds with a team" — not artificial gating to drive upgrades.',
  },
  {
    q: 'Do you offer annual discounts?',
    a: 'Individual is $249/mo or $2,490/yr (2 months free). Strategy is $2,499/mo or $24,990/yr (2 months free). Annual prepay swap during a monthly subscription comes with prorated credit. Enterprise is annual by default; talk to us for the order form.',
  },
  {
    q: 'What is your SOC 2 posture?',
    a: SOC2_FAQ_ANSWER,
  },
  {
    q: 'How long are my documents retained, and can I delete them?',
    a: 'Free 30 days · Individual 1 year · Strategy 3 years · Enterprise 7 years (SOX §404 internal-controls aligned · configurable per Order Form for HIPAA / banking / government). Document retention mirrors the audit-log retention SLA so the two compliance artefacts move in lockstep. Every tier has a 30-day soft-delete grace window before permanent purge: recoverable via support during the grace, irrecoverable after. Self-serve Delete button on every document detail page and on the post-upload reveal card. Full retention SLA at /security#retention.',
  },
  {
    q: 'How fast is the first audit after I sign up?',
    a: 'Sign-up is Google OAuth or magic-link email (under 30 seconds). Paste a strategic memo at /demo or upload from /dashboard; the 12-node R²F audit pipeline runs in 60-90 seconds end-to-end on a typical 1,500-4,000 word memo. The Decision Provenance Record PDF generates in another few seconds after that. No vendor-side onboarding call, no implementation engineer, no config wizard required — just the memo. Slack / Drive / Email integrations come later, on your own time.',
  },
  {
    q: 'How does this compare to hiring another senior analyst?',
    a: "A senior strategy analyst is $150-250K/year fully loaded — and they bring the same cognitive biases you're trying to audit out. Decision Intel is a structural antagonist: the 22-bias detector runs on EVERY memo, with verbatim academic citations and verbatim evidence quotes the analyst can't supply for themselves. The Individual tier is $2,490/year — under 2% of a single analyst hire — and a single avoided strategic mistake on one memo returns the annual subscription 50× over. The audit is not better than a senior reviewer; it is a structural addition that catches the patterns the reviewer is also vulnerable to. Hire the analyst AND run the audit on every memo they write.",
  },
  {
    q: 'Can I expense this on a corporate card?',
    a: 'Yes. Individual ($249/mo) sits comfortably within most fractional-CSO and mid-market corp-dev personal-decisive budgets. Strategy ($2,499/mo) typically requires a manager / VP signature and routes through procurement at most F500 / FTSE 250 organisations — we provide a self-serve quote builder at /pricing/quote that produces a non-binding offer letter with the line items procurement teams need. Enterprise is annual + signed Order Form by default.',
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
        body: JSON.stringify({ plan: tierId, cycle }),
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
            <span style={{ fontWeight: 600, color: C.slate900 }}>Decision Provenance Record</span>{' '}
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
            // 4.5 deep — Strategy + Individual both honor the annual
            // toggle. Free + Enterprise are unaffected (Free is always
            // $0, Enterprise is custom-quoted).
            const supportsCycle = tier.id === 'pro' || tier.id === 'team';
            const showPrice = supportsCycle
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
            const priceSuffix = supportsCycle ? (cycle === 'annual' ? '/yr' : '/mo') : '';

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

                {tier.protectedValue && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'rgba(22,163,74,0.06)',
                      border: '1px solid rgba(22,163,74,0.22)',
                      borderLeft: `3px solid ${C.green}`,
                      marginTop: 4,
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: C.green,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        marginBottom: 5,
                      }}
                    >
                      What this protects
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: C.slate900,
                        lineHeight: 1.5,
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {tier.protectedValue}
                    </div>
                  </div>
                )}

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
                  {(tier.cta.action === 'checkout-pro' || tier.cta.action === 'checkout-team') && (
                    <Link
                      href="/design-partner"
                      onClick={() =>
                        trackEvent('pricing_procurement_link_clicked', { tier: tier.id })
                      }
                      style={{
                        display: 'block',
                        marginTop: 10,
                        textAlign: 'center',
                        fontSize: 12.5,
                        color: C.slate500,
                        textDecoration: 'none',
                        lineHeight: 1.5,
                      }}
                    >
                      Need to bring this to procurement?{' '}
                      <span style={{ color: C.green, fontWeight: 600 }}>Talk to the founder →</span>
                    </Link>
                  )}
                  {/* B3 lock 2026-04-30 — Sibling secondary CTA for tiers
                      that opt in (Enterprise: "Talk to sales" beneath the
                      promoted "Get a quote" primary). Outlined slate
                      button so it sits as a real peer to the primary CTA,
                      not a tiny grey text link. */}
                  {tier.secondaryCta &&
                    (tier.secondaryCta.href ? (
                      <Link
                        href={tier.secondaryCta.href}
                        onClick={() =>
                          trackEvent('pricing_secondary_cta_clicked', { tier: tier.id, cycle })
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          width: '100%',
                          marginTop: 10,
                          padding: '12px 18px',
                          borderRadius: 12,
                          background: C.white,
                          border: `1px solid ${C.slate200}`,
                          color: C.slate900,
                          fontSize: 13.5,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        {tier.secondaryCta.label} <ArrowRight size={13} />
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          if (tier.secondaryCta?.action === 'contact') handleContact();
                          else if (tier.secondaryCta?.action === 'checkout-pro')
                            handleCheckout('pro');
                          else if (tier.secondaryCta?.action === 'checkout-team')
                            handleCheckout('team');
                          trackEvent('pricing_secondary_cta_clicked', {
                            tier: tier.id,
                            cycle,
                          });
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          width: '100%',
                          marginTop: 10,
                          padding: '12px 18px',
                          borderRadius: 12,
                          background: C.white,
                          border: `1px solid ${C.slate200}`,
                          color: C.slate900,
                          fontSize: 13.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {tier.secondaryCta.label} <ArrowRight size={13} />
                      </button>
                    ))}
                  {tier.cta.action === 'contact' && (
                    <div
                      style={{
                        marginTop: 10,
                        textAlign: 'center',
                        fontSize: 12,
                        color: C.slate500,
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: C.green, fontWeight: 600 }}>
                        See your number before any contact info.
                      </span>{' '}
                      Live ACV, no email required.
                    </div>
                  )}
                  {/* Enterprise tiers with a quote-builder primary CTA also
                      surface the same "see-your-number" hint so the
                      visible-before-email promise is unambiguous. */}
                  {tier.cta.href === '/pricing/quote' && tier.cta.action !== 'contact' && (
                    <div
                      style={{
                        marginTop: 10,
                        textAlign: 'center',
                        fontSize: 12,
                        color: C.slate500,
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: C.green, fontWeight: 600 }}>
                        See your number before any contact info.
                      </span>{' '}
                      Live ACV, no email required.
                    </div>
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
            { label: SOC2_TRUST_BAND_LABEL, sub: SOC2_TRUST_BAND_SUB },
            {
              label: 'Signed DPA',
              sub: 'on any paid tier',
              href: '/dpa-template.pdf',
              cta: 'Template (PDF) →',
            },
            { label: 'No training on your data', sub: 'ever, by contract' },
            {
              label: DPR_PROVENANCE_CARD_LABEL,
              sub: DPR_PROVENANCE_CARD_SUB,
              href: '/dpr-sample-wework.pdf',
              cta: 'Sample (PDF) →',
            },
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
                {'href' in item && item.href && (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.green,
                      textDecoration: 'none',
                      display: 'inline-block',
                      marginTop: 2,
                    }}
                  >
                    {item.cta}
                  </a>
                )}
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
              Design Partner Program &middot; {DESIGN_PARTNER_SEATS_TOTAL} seats
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

      {/* Workflow cross-link — connects buying-stage readers to the
          workflow tool surface. Shipped 2026-05-27 alongside /use/[slug]. */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 0' }}>
        <div
          style={{
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            borderRadius: 12,
            padding: '28px 28px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.green,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              What can I audit?
            </div>
            <h3
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: C.slate900,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Six workflow-specific audit surfaces.
            </h3>
            <p
              style={{
                fontSize: 14,
                color: C.slate600,
                marginTop: 8,
                marginBottom: 0,
                lineHeight: 1.55,
              }}
            >
              Each workflow runs the same Recognition-Rigor Framework pipeline with overlays
              specific to the artefact class.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 8,
            }}
          >
            {[
              { slug: 'strategic-memo-audit', label: 'Strategic memo' },
              { slug: 'ic-memo-pre-vote-audit', label: 'IC memo' },
              { slug: 'board-deck-pre-presentation-audit', label: 'Board deck' },
              { slug: 'fund-investment-thesis-audit', label: 'Fund thesis' },
              { slug: 'm-and-a-bias-audit', label: 'M&A acquisition' },
              { slug: 'decision-pre-mortem', label: 'Pre-mortem' },
            ].map(w => (
              <Link
                key={w.slug}
                href={`/use/${w.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 12px',
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.slate600,
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                {w.label}
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
            <Link href="/use" style={{ color: C.green, fontWeight: 600, textDecoration: 'none' }}>
              See all workflows →
            </Link>
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
