import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  // Don't crash at import time — only fail when actually used
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  typescript: true,
});

export const PLANS = {
  free: {
    name: 'Free',
    analysesPerMonth: 3,
    maxPages: 10,
    biasTypes: 5,
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    analysesPerMonth: 30,
    maxPages: 50,
    biasTypes: 20,
  },
  team: {
    name: 'Team',
    priceId: process.env.STRIPE_TEAM_PRICE_ID || '',
    analysesPerMonth: 150,
    maxPages: 100,
    biasTypes: 20,
  },
  enterprise: {
    name: 'Enterprise',
    analysesPerMonth: Infinity,
    maxPages: Infinity,
    biasTypes: 20,
  },
} as const;

export type PlanType = keyof typeof PLANS;
