import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — declared before imports
// ---------------------------------------------------------------------------

let mockRequestBody = '';
const mockHeaders = new Map<string, string>();

vi.mock('next/server', () => ({
  NextRequest: class {
    url: string;
    headers = {
      get: (key: string) => mockHeaders.get(key) || null,
    };
    text: () => Promise<string>;
    constructor(input?: string | URL) {
      this.url =
        typeof input === 'string' ? input : input?.toString() || 'http://localhost/api/stripe/webhook';
      this.text = async () => mockRequestBody;
    }
  },
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      json: async () => body,
      status: init?.status || 200,
      body,
    }),
  },
}));

const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();

vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
    subscriptions: {
      retrieve: (...args: unknown[]) => mockSubscriptionsRetrieve(...args),
    },
  }),
}));

const mockSubscriptionUpsert = vi.fn();
const mockSubscriptionUpdate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      upsert: (...args: unknown[]) => mockSubscriptionUpsert(...args),
      update: (...args: unknown[]) => mockSubscriptionUpdate(...args),
    },
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Import module under test AFTER mocks
// ---------------------------------------------------------------------------

import { POST } from './route';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWebhookRequest() {
  return new NextRequest('http://localhost/api/stripe/webhook');
}

function makeStripeEvent(type: string, dataObject: Record<string, unknown>): unknown {
  return {
    type,
    data: { object: dataObject },
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockHeaders.clear();
  mockHeaders.set('stripe-signature', 'sig_test_123');
  mockRequestBody = '{"test": true}';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

  // Default: constructEvent returns a benign unhandled event
  mockConstructEvent.mockReturnValue({
    type: 'unknown.event',
    data: { object: {} },
  });

  // Default: subscription update resolves
  mockSubscriptionUpdate.mockResolvedValue({});
  mockSubscriptionUpsert.mockResolvedValue({});
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/stripe/webhook', () => {
  // -----------------------------------------------------------------------
  // Signature & config validation
  // -----------------------------------------------------------------------

  it('returns 400 when missing stripe-signature header', async () => {
    mockHeaders.delete('stripe-signature');

    const res = await POST(createWebhookRequest());

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing signature');
  });

  it('returns 400 when STRIPE_WEBHOOK_SECRET env var is not set', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const res = await POST(createWebhookRequest());

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing signature');
  });

  it('returns 400 when constructEvent throws (invalid signature)', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Signature verification failed');
    });

    const res = await POST(createWebhookRequest());

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid signature');
  });

  // -----------------------------------------------------------------------
  // checkout.session.completed
  // -----------------------------------------------------------------------

  describe('checkout.session.completed', () => {
    it('creates subscription with active status', async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent('checkout.session.completed', {
          metadata: { userId: 'user_1', plan: 'pro' },
          customer: 'cus_123',
          subscription: 'sub_456',
        })
      );
      mockSubscriptionsRetrieve.mockResolvedValue({
        status: 'active',
        current_period_end: 1700000000,
      });

      const res = await POST(createWebhookRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith('sub_456');
      expect(mockSubscriptionUpsert).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_456' },
        update: {
          plan: 'pro',
          status: 'active',
          currentPeriodEnd: new Date(1700000000 * 1000),
        },
        create: {
          userId: 'user_1',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_456',
          plan: 'pro',
          status: 'active',
          currentPeriodEnd: new Date(1700000000 * 1000),
        },
      });
    });

    it('creates subscription with trialing status', async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent('checkout.session.completed', {
          metadata: { userId: 'user_2', plan: 'enterprise' },
          customer: 'cus_789',
          subscription: 'sub_101',
        })
      );
      mockSubscriptionsRetrieve.mockResolvedValue({
        status: 'trialing',
        current_period_end: 1700000000,
      });

      const res = await POST(createWebhookRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ status: 'trialing' }),
          create: expect.objectContaining({ status: 'trialing' }),
        })
      );
    });

    it('skips when metadata is incomplete (missing userId)', async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent('checkout.session.completed', {
          metadata: { plan: 'pro' },
          customer: 'cus_123',
          subscription: 'sub_456',
        })
      );

      const res = await POST(createWebhookRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionUpsert).not.toHaveBeenCalled();
      expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled();
    });

    it('defaults plan to pro when metadata.plan is missing', async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent('checkout.session.completed', {
          metadata: { userId: 'user_3' },
          customer: 'cus_999',
          subscription: 'sub_888',
        })
      );
      mockSubscriptionsRetrieve.mockResolvedValue({
        status: 'active',
        current_period_end: 1700000000,
      });

      const res = await POST(createWebhookRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ plan: 'pro' }),
        })
      );
    });
  });

  // -----------------------------------------------------------------------
  // customer.subscription.updated
  // -----------------------------------------------------------------------

  describe('customer.subscription.updated', () => {
    it('updates to active status', async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent('customer.subscription.updated', {
          id: 'sub_200',
          status: 'active',
          cancel_at_period_end: false,
          current_period_end: 1700000000,
        })
      );

      const res = await POST(createWebhookRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionUpdate).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_200' },
        data: {
          status: 'active',
          currentPeriodEnd: new Date(1700000000 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
    });

    it('updates to canceled when cancel_at_period_end is true', async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent('customer.subscription.updated', {
          id: 'sub_300',
          status: 'active',
          cancel_at_period_end: true,
          current_period_end: 1700000000,
        })
      );

      const res = await POST(createWebhookRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionUpdate).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_300' },
        data: {
          status: 'canceled',
          currentPeriodEnd: new Date(1700000000 * 1000),
          cancelAtPeriodEnd: true,
        },
      });
    });

    it('updates to trialing status when subscription is trialing', async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent('customer.subscription.updated', {
          id: 'sub_350',
          status: 'trialing',
          cancel_at_period_end: false,
          current_period_end: 1700000000,
        })
      );

      const res = await POST(createWebhookRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'trialing' }),
        })
      );
    });
  });

  // -----------------------------------------------------------------------
  // customer.subscription.deleted
  // -----------------------------------------------------------------------

  describe('customer.subscription.deleted', () => {
    it('sets status to canceled', async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent('customer.subscription.deleted', {
          id: 'sub_400',
        })
      );

      const res = await POST(createWebhookRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionUpdate).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_400' },
        data: { status: 'canceled' },
      });
    });
  });

  // -----------------------------------------------------------------------
  // invoice.payment_failed
  // -----------------------------------------------------------------------

  describe('invoice.payment_failed', () => {
    it('sets status to past_due', async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent('invoice.payment_failed', {
          subscription: 'sub_500',
        })
      );

      const res = await POST(createWebhookRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionUpdate).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_500' },
        data: { status: 'past_due' },
      });
    });

    it('handles subscription as object with id', async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent('invoice.payment_failed', {
          subscription: { id: 'sub_600' },
        })
      );

      const res = await POST(createWebhookRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionUpdate).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_600' },
        data: { status: 'past_due' },
      });
    });

    it('skips when no subscription ID is present', async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent('invoice.payment_failed', {
          subscription: null,
        })
      );

      const res = await POST(createWebhookRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionUpdate).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Unhandled event & errors
  // -----------------------------------------------------------------------

  it('returns 200 with { received: true } for unhandled event types', async () => {
    mockConstructEvent.mockReturnValue(
      makeStripeEvent('some.random.event', { id: 'obj_123' })
    );

    const res = await POST(createWebhookRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ received: true });
  });

  it('returns 500 on unexpected error', async () => {
    mockConstructEvent.mockReturnValue(
      makeStripeEvent('checkout.session.completed', {
        metadata: { userId: 'user_1', plan: 'pro' },
        customer: 'cus_123',
        subscription: 'sub_456',
      })
    );
    mockSubscriptionsRetrieve.mockRejectedValue(new Error('Stripe API down'));

    const res = await POST(createWebhookRequest());

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('Webhook processing failed');
  });
});
