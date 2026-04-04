import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Lazily initialize the Stripe client — only throws when actually called,
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

export const PLANS = {
  free: {
    name: 'Starter',
    description: 'One-time diagnostic — see hidden bias and noise in your strategic documents',
    analysesPerMonth: 3,
    maxPages: 10,
    biasTypes: 5,
    maxTeamMembers: 3,
  },
  pro: {
    name: 'Professional',
    description:
      'For individual decision-makers running strategic documents through the bias engine',
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    analysesPerMonth: 50,
    maxPages: 100,
    biasTypes: 20,
    maxTeamMembers: 10,
  },
  team: {
    name: 'Team',
    description: 'For executive teams and decision committees managing project portfolios',
    priceId: process.env.STRIPE_TEAM_PRICE_ID || '',
    analysesPerMonth: 250,
    maxPages: 200,
    biasTypes: 20,
    maxTeamMembers: 50,
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For organizations managing multiple teams with dedicated decision workflows',
    analysesPerMonth: Infinity,
    maxPages: Infinity,
    biasTypes: 20,
    maxTeamMembers: Infinity,
  },
} as const;

export type PlanType = keyof typeof PLANS;

export const DEAL_AUDIT_TIERS = [
  { id: 'small',  label: 'Emerging',   maxTicket: 10_000_000,   price: 499,   priceId: process.env.STRIPE_DEAL_SMALL_PRICE_ID || '' },
  { id: 'mid',    label: 'Growth',     maxTicket: 50_000_000,   price: 1499,  priceId: process.env.STRIPE_DEAL_MID_PRICE_ID || '' },
  { id: 'large',  label: 'Core',       maxTicket: 200_000_000,  price: 2999,  priceId: process.env.STRIPE_DEAL_LARGE_PRICE_ID || '' },
  { id: 'mega',   label: 'Flagship',   maxTicket: Infinity,     price: 4999,  priceId: process.env.STRIPE_DEAL_MEGA_PRICE_ID || '' },
] as const;

export type DealAuditTierId = typeof DEAL_AUDIT_TIERS[number]['id'];

export function getDealAuditTier(ticketSize: number): typeof DEAL_AUDIT_TIERS[number] {
  return DEAL_AUDIT_TIERS.find(t => ticketSize <= t.maxTicket) || DEAL_AUDIT_TIERS[DEAL_AUDIT_TIERS.length - 1];
}
