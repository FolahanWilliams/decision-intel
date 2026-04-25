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
    maxPages: 10,
    biasTypes: 5,
    maxTeamMembers: 1,
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
    priceIdMonthly: process.env.STRIPE_PRO_PRICE_MONTHLY_ID || 'price_1TLh8pJHs8Ws3oeL7VzAcJgA',
    priceIdAnnual: process.env.STRIPE_PRO_PRICE_ANNUAL_ID || 'price_1TLhBhJHs8Ws3oeLgB24ycVf',
    // Legacy alias points to monthly for existing callers
    priceId: process.env.STRIPE_PRO_PRICE_MONTHLY_ID || 'price_1TLh8pJHs8Ws3oeL7VzAcJgA',
    analysesPerMonth: 15,
    maxPages: 100,
    biasTypes: 30,
    maxTeamMembers: 1,
    retentionDays: 90,
    features: {
      boardroomSimulation: true,
      forgottenQuestions: true,
      personalDecisionHistory: true,
      personalCalibration: true,
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
  team: {
    name: 'Strategy',
    tagline: 'For corporate strategy teams',
    description:
      'Everything Individual has, plus a living Decision Knowledge Graph that connects every strategic memo your team produces.',
    priceMonthly: 2499,
    priceAnnual: null,
    priceIdMonthly: process.env.STRIPE_TEAM_PRICE_ID || '',
    priceIdAnnual: '',
    priceId: process.env.STRIPE_TEAM_PRICE_ID || '',
    analysesPerMonth: Infinity,
    maxPages: 200,
    biasTypes: 30,
    maxTeamMembers: 15,
    retentionDays: 365,
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
      customTaxonomy: false,
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
    biasTypes: 30,
    maxTeamMembers: Infinity,
    /** Default for Enterprise; configurable per Order Form. The
     *  enforce-retention cron uses this value unless an explicit
     *  contract-level override is set on the Org. */
    retentionDays: 360,
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
