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
    name: 'Noise Audit',
    description: 'One-time diagnostic — see the hidden variance in your IC memos',
    analysesPerMonth: 3,
    maxPages: 10,
    biasTypes: 5,
  },
  pro: {
    name: 'Individual Partner',
    description: 'For a single deal partner running IC memos through the bias engine',
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    analysesPerMonth: 50,
    maxPages: 100,
    biasTypes: 20,
  },
  team: {
    name: 'Fund',
    description: 'For investment committees and deal teams managing full fund portfolios',
    priceId: process.env.STRIPE_TEAM_PRICE_ID || '',
    analysesPerMonth: 250,
    maxPages: 200,
    biasTypes: 20,
  },
  enterprise: {
    name: 'Multi-Fund',
    description: 'For PE/VC platforms managing multiple funds with dedicated IC workflows',
    analysesPerMonth: Infinity,
    maxPages: Infinity,
    biasTypes: 20,
  },
} as const;

export type PlanType = keyof typeof PLANS;
