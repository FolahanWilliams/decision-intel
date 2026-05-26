import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Lazily initialize the Stripe client. Only throws when actually called,
 * not at module import / build time.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured. Add it to your environment variables.');
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

/**
 * Feature flags per plan. Used for gating dashboard UI, API endpoints,
 * and upgrade prompts (the Teammate Wall and similar).
 */
export interface PlanFeatures {
  boardroomSimulation: boolean | 'limited';
  forgottenQuestions: boolean;
  personalDecisionHistory: boolean;
  personalCalibration: boolean;
  teamKnowledgeGraph: boolean;
  decisionRooms: boolean;
  slackIntegration: boolean;
  driveIntegration: boolean;
  complianceMapping: boolean;
  customToxicWeights: boolean;
  teamDqiAnalytics: boolean;
  sso: boolean;
  multiDivision: boolean;
  customTaxonomy: boolean;
}

export const PLANS = {
  free: {
    name: 'Free',
    tagline: 'See what we flag',
    description: '4 audits a month on us. No card required.',
    priceMonthly: 0,
    priceAnnual: 0,
    priceIdMonthly: '',
    priceIdAnnual: '',
    // Legacy alias kept for existing callers (checkout route, billing route)
    priceId: '',
    analysesPerMonth: 4,
    /** Page cap raised to Infinity across all tiers 2026-05-26 — the
     *  pipeline handles real documents fine via Gemini 3 Flash's 1M
     *  token context window (~3000 pages of dense text); artificial
     *  page caps were rejecting real CIMs / board decks for zero
     *  benefit. Kept on the schema as Infinity rather than removed
     *  so existing consumers (analytics, comparison tables) don't
     *  break. */
    maxPages: Infinity,
    /** The audit pipeline runs the FULL 22-bias R²F taxonomy on every
     *  call regardless of plan. The biasTypes field used to gate the
     *  UI count ("Free sees 5 of 22") which was deceptive — the
     *  analysis already covered all 22. Aligned to BIAS_COUNT
     *  (22) 2026-05-26 so the field stops lying. */
    biasTypes: 22,
    maxTeamMembers: 1,
    /** Max upload size in MB. Pipeline + parseFile() handle real CIMs
     *  up to several hundred MB cleanly (Gemini 3 Flash 1M context =
     *  ~3000 pages of dense text — practical bottleneck is Vercel
     *  Fluid Compute body size, not model capacity). The per-plan
     *  ladder gives Free enough headroom for a real strategic memo,
     *  Pro a typical CIM, Team a data-room bundle, Enterprise the
     *  platform ceiling. Locked 2026-05-26 (Tier-A cluster + soft-
     *  limit pass after the founder's "stop saving features for an
     *  Enterprise tier we might never sell" call). */
    maxUploadMB: 25,
    /** Days from upload before a document is soft-deleted by the
     *  enforce-retention cron. After soft-delete, a 30-day grace window
     *  applies before hard-purge (DB cascade + storage cleanup). */
    retentionDays: 30,
    features: {
      boardroomSimulation: 'limited',
      forgottenQuestions: false,
      personalDecisionHistory: false,
      personalCalibration: false,
      teamKnowledgeGraph: false,
      decisionRooms: false,
      slackIntegration: false,
      driveIntegration: false,
      complianceMapping: false,
      customToxicWeights: false,
      teamDqiAnalytics: false,
      sso: false,
      multiDivision: false,
      customTaxonomy: false,
    } satisfies PlanFeatures,
  },
  pro: {
    name: 'Individual',
    tagline: 'For the high-stakes strategist',
    description:
      'Walk into your next meeting with the one question the CSO missed. Full audit plus your Personal Decision History.',
    priceMonthly: 249,
    priceAnnual: 2490,
    priceIdMonthly: process.env.STRIPE_PRO_PRICE_MONTHLY_ID || '',
    priceIdAnnual: process.env.STRIPE_PRO_PRICE_ANNUAL_ID || '',
    // Legacy alias points to monthly for existing callers
    priceId: process.env.STRIPE_PRO_PRICE_MONTHLY_ID || '',
    /** Bumped 15 → 100 audits/mo (2026-05-26 soft-limit pass). 15 was
     *  tight for a heavy wedge user — a fractional CSO running 3-5
     *  client engagements with weekly memo flow easily lands at 30-60
     *  audits/month. 100/mo at ~£0.40 per audit = ~£40/month variable
     *  cost on a £249 plan — still healthy margin (~84%). The wedge
     *  motion can't afford to throttle paying users; if 100/mo runs
     *  too hot, raise the price not the limit. */
    analysesPerMonth: 100,
    /** Page cap removed — see free.maxPages comment. */
    maxPages: Infinity,
    biasTypes: 22,
    maxTeamMembers: 1,
    /** Bumped 90 → 365 days (2026-05-26) to align with the
     *  AUDIT_LOG_RETENTION_TIERS Individual='1 year' SLA in
     *  trust-copy.ts. 90 days was forcing a CSO to forget last
     *  quarter's audit when prep'ing this quarter's — that's
     *  the wedge persona's defining workflow. The compliance
     *  artefact retention and the document retention now match. */
    retentionDays: 365,
    /** Bumped from universal 25MB → 100MB (2026-05-26). A real M&A
     *  CIM is 50-150MB; a CSO uploading their actual deal memo
     *  shouldn't hit a wall on the wedge tier. Gemini 3 Flash's 1M
     *  token context handles 100MB documents fine. */
    maxUploadMB: 100,
    features: {
      boardroomSimulation: true,
      forgottenQuestions: true,
      personalDecisionHistory: true,
      personalCalibration: true,
      teamKnowledgeGraph: false,
      // Soft-limit pass 2026-05-26: features that REAL solo users need
      // on the wedge tier — withholding them for an Enterprise tier we
      // might never sell is the displacement-signal trap, not a moat.
      // A solo CSO has their own Slack, their own Drive, their own
      // M&A workflow that benefits from compliance mapping. Decision
      // Rooms work for solo users inviting external advisors (counsel,
      // PE sponsor, board member). All four flipped to true.
      decisionRooms: true,
      slackIntegration: true,
      driveIntegration: true,
      complianceMapping: true,
      // Power-user features that genuinely need a team to justify the
      // setup cost — kept on Strategy/Team tier. customToxicWeights
      // requires team standardisation to be useful; teamKnowledgeGraph
      // is by definition cross-user; teamDqiAnalytics is cross-user.
      customToxicWeights: false,
      teamDqiAnalytics: false,
      sso: false,
      multiDivision: false,
      customTaxonomy: false,
    } satisfies PlanFeatures,
  },
  team: {
    name: 'Strategy',
    tagline: 'For corporate strategy teams',
    description:
      'Everything Individual has, plus a living Decision Knowledge Graph that connects every strategic memo your team produces.',
    priceMonthly: 2499,
    /** Annual prepay (4.5 deep) — 2 months free vs. monthly (~17% off).
     *  $2,499 × 12 = $29,988; annual = $24,990. */
    priceAnnual: 24990,
    priceIdMonthly: process.env.STRIPE_TEAM_PRICE_ID || '',
    priceIdAnnual: process.env.STRIPE_TEAM_PRICE_ANNUAL_ID || '',
    priceId: process.env.STRIPE_TEAM_PRICE_ID || '',
    analysesPerMonth: Infinity,
    /** Page cap removed — see free.maxPages comment. */
    maxPages: Infinity,
    biasTypes: 22,
    /** Bumped 15 → 30 seats (2026-05-26). A real corporate strategy
     *  function plus audit committee plus GC plus external counsel
     *  routinely runs 20+. 15 was undercutting the legitimate Strategy
     *  buyer who wants the WHOLE function on the platform. */
    maxTeamMembers: 30,
    /** Bumped 365 → 1095 days (3y) (2026-05-26) to align with the
     *  AUDIT_LOG_RETENTION_TIERS Strategy='3 years' SLA in
     *  trust-copy.ts. Team buyers running quarterly board cycles
     *  reference 2-3 years of historical memos routinely; 1y was
     *  forcing an artificial gap. */
    retentionDays: 1095,
    /** Bumped from universal 25MB → 250MB (2026-05-26). Strategy
     *  teams routinely upload data-room-scale bundles. 250MB
     *  handles a full diligence pack in a single upload. */
    maxUploadMB: 250,
    features: {
      boardroomSimulation: true,
      forgottenQuestions: true,
      personalDecisionHistory: true,
      personalCalibration: true,
      teamKnowledgeGraph: true,
      decisionRooms: true,
      slackIntegration: true,
      driveIntegration: true,
      complianceMapping: true,
      customToxicWeights: true,
      teamDqiAnalytics: true,
      sso: false,
      multiDivision: false,
      /** Flipped false → true on Strategy (2026-05-26 soft-limit pass).
       *  customTaxonomy is a power-user differentiator — a strategy
       *  team that's standardised on its own bias vocabulary should
       *  be able to extend the 22-bias taxonomy with house-specific
       *  patterns. No reason to withhold for an Enterprise tier we
       *  might never sell. */
      customTaxonomy: true,
    } satisfies PlanFeatures,
  },
  enterprise: {
    name: 'Enterprise',
    tagline: 'For Fortune 500 strategy functions',
    description:
      'Multi-division deployment, SSO, custom taxonomy, dedicated support, SLA. For regulated workflows and multiple business units.',
    priceMonthly: null,
    priceAnnual: null,
    priceIdMonthly: '',
    priceIdAnnual: '',
    priceId: '',
    analysesPerMonth: Infinity,
    maxPages: Infinity,
    biasTypes: 22,
    maxTeamMembers: Infinity,
    /** Bumped 360 → 2555 days (7y) (2026-05-26) to (a) align with the
     *  AUDIT_LOG_RETENTION_TIERS Enterprise='7 years (SOX §404)' SLA
     *  in trust-copy.ts and (b) fix the inversion — the old 360 was
     *  LESS than Strategy's 365, which made no sense. Document
     *  retention now mirrors the audit-log retention SLA so the two
     *  retention artefacts move in lockstep. Configurable per Order
     *  Form for HIPAA / banking / government contracts. */
    retentionDays: 2555,
    /** Platform ceiling. Vercel Fluid Compute body-size limit is the
     *  binding constraint above this — practical for the rare
     *  full-data-room-as-one-upload Enterprise case. */
    maxUploadMB: 500,
    /** Volume floor (4.5 deep). New Enterprise contracts ship with a
     *  configurable per-quarter audit floor so renewal pricing isn't
     *  open-ended. Default 100/quarter; the Order Form / quote builder
     *  captures the actual contract value. Existing customers grandfather
     *  in — no runtime gate enforces this; it's a contract-discipline
     *  artefact surfaced on the Enterprise Quote Builder PDF. */
    volumeFloorAuditsPerQuarter: 100,
    /** M&A per-deal handle (4.5 deep). Strategy + Enterprise customers
     *  can purchase additional active-deal slots beyond the fair-use cap
     *  as a custom overage — NOT a separate plan tier. The handle is
     *  priced per-deal-per-month and captured on the quote builder; the
     *  default unit price below is what the founder lists in pitch decks
     *  but the actual contract figure can flex. */
    dealOverageUnitPriceMonthly: 750,
    features: {
      boardroomSimulation: true,
      forgottenQuestions: true,
      personalDecisionHistory: true,
      personalCalibration: true,
      teamKnowledgeGraph: true,
      decisionRooms: true,
      slackIntegration: true,
      driveIntegration: true,
      complianceMapping: true,
      customToxicWeights: true,
      teamDqiAnalytics: true,
      sso: true,
      multiDivision: true,
      customTaxonomy: true,
    } satisfies PlanFeatures,
  },
} as const;

/**
 * Public Enterprise quote-builder defaults (4.5 deep). Used by the admin
 * /dashboard/settings/billing/enterprise-quote builder to seed the
 * starting numbers. Override per-deal at quote time; never used at
 * runtime to enforce billing.
 */
export const ENTERPRISE_QUOTE_DEFAULTS = {
  /** Per-seat / per-month list price ($/seat/mo); contract typically negotiates a band around this. */
  perSeatMonthly: 119,
  /** Minimum committed seats for a new Enterprise contract. */
  minSeats: 25,
  /** Floor on retention window (days). Order Form can extend; cannot reduce below. */
  minRetentionDays: 360,
  /** Default SLA tier — Standard | Premium | Custom. */
  slaTier: 'Standard' as 'Standard' | 'Premium' | 'Custom',
  /** Per-deal handle list price ($/active-deal/mo) — overage on top of seat fee. */
  perDealMonthly: 750,
  /** Default per-quarter audit floor (volume commitment). */
  volumeFloorAuditsPerQuarter: 100,
} as const;

export type PlanType = keyof typeof PLANS;
export type BillingCycle = 'monthly' | 'annual';

/**
 * Resolve the Stripe price ID for a plan + billing cycle combo.
 * Returns an empty string if not configured.
 */
export function getPriceId(plan: PlanType, cycle: BillingCycle = 'monthly'): string {
  const p = PLANS[plan];
  if (cycle === 'annual') return p.priceIdAnnual || '';
  return p.priceIdMonthly || '';
}

/**
 * Check whether a plan has a specific feature enabled.
 * Returns true for both `true` and `'limited'` values — use
 * `getFeatureAccess()` when you need to distinguish between full
 * and limited access (e.g. to cap simulation runs on the free tier).
 */
export function hasFeature(plan: PlanType, feature: keyof PlanFeatures): boolean {
  const value = PLANS[plan].features[feature];
  return value === true || value === 'limited';
}

/**
 * Return the raw feature-access value for a plan.
 *   - `true`      → fully enabled
 *   - `'limited'` → enabled with caps (e.g. free-tier boardroom simulation)
 *   - `false`     → disabled
 *
 * Use this when the caller needs to apply different limits for
 * limited vs full access. For simple "is it on?" checks, prefer
 * `hasFeature()`.
 */
export function getFeatureAccess(plan: PlanType, feature: keyof PlanFeatures): boolean | 'limited' {
  return PLANS[plan].features[feature];
}

export const DEAL_AUDIT_TIERS = [
  {
    id: 'standard',
    label: 'Full Deal Audit',
    maxTicket: Infinity,
    price: 4999,
    priceId: process.env.STRIPE_DEAL_PRICE_ID || '',
  },
] as const;

export type DealAuditTierId = (typeof DEAL_AUDIT_TIERS)[number]['id'];

export function getDealAuditTier(ticketSize: number): (typeof DEAL_AUDIT_TIERS)[number] {
  return (
    DEAL_AUDIT_TIERS.find(t => ticketSize <= t.maxTicket) ||
    DEAL_AUDIT_TIERS[DEAL_AUDIT_TIERS.length - 1]
  );
}
