/**
 * Webhook Subscriptions CRUD
 *
 * GET  - List all webhook subscriptions for the user's org
 * POST - Create a new webhook subscription
 */

import { NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { WEBHOOK_EVENTS } from '@/lib/integrations/webhooks/events';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { encryptWebhookSecret } from '@/lib/utils/encryption';
import { assertPublicWebhookUrl, SsrfBlockedError } from '@/lib/utils/ssrf';

/** Per-user anti-abuse cap on webhook subscriptions (enforced atomically). */
const MAX_WEBHOOKS_PER_USER = 10;

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const subscriptions = await prisma.webhookSubscription.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { deliveries: true } },
    },
  });

  return NextResponse.json({ subscriptions });
}

export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimitResult = await checkRateLimit(auth.userId!, '/api/webhooks', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
  });
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await request.json();
  const { url, events } = body as { url?: string; events?: string[] };

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // Validate URL (blocks private/internal addresses + DNS-rebinding to prevent
  // SSRF). The canonical guard lives in @/lib/utils/ssrf and is reused by the
  // delivery engine + test route so registration and fetch-time agree.
  try {
    await assertPublicWebhookUrl(url);
  } catch (err) {
    if (err instanceof SsrfBlockedError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // Validate events
  if (!events || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json(
      { error: 'At least one event is required', availableEvents: WEBHOOK_EVENTS },
      { status: 400 }
    );
  }

  const invalidEvents = events.filter(e => !(WEBHOOK_EVENTS as readonly string[]).includes(e));
  if (invalidEvents.length > 0) {
    return NextResponse.json(
      { error: `Invalid events: ${invalidEvents.join(', ')}`, availableEvents: WEBHOOK_EVENTS },
      { status: 400 }
    );
  }

  // Generate signing secret and encrypt for storage
  const secret = `whsec_${randomBytes(32).toString('hex')}`;
  const encryptedSecret = encryptWebhookSecret(secret);

  // Atomic cap enforcement. A plain count-then-create races under Postgres
  // READ COMMITTED (two concurrent POSTs both read N-1 and both insert,
  // exceeding the cap). A per-user advisory xact-lock serializes creates for
  // this user so the count is authoritative inside the transaction.
  let subscription;
  try {
    subscription = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('webhook_subscription'), hashtext(${auth.userId!}))`;

      const existingCount = await tx.webhookSubscription.count({
        where: { userId: auth.userId },
      });
      if (existingCount >= MAX_WEBHOOKS_PER_USER) {
        throw new Error('WEBHOOK_LIMIT');
      }

      return tx.webhookSubscription.create({
        data: {
          orgId: auth.userId!, // Use userId as orgId fallback
          userId: auth.userId!,
          url,
          events,
          secret: encryptedSecret,
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'WEBHOOK_LIMIT') {
      return NextResponse.json(
        { error: `Maximum ${MAX_WEBHOOKS_PER_USER} webhook subscriptions per user` },
        { status: 400 }
      );
    }
    throw err;
  }

  // Return secret only on creation — cannot be retrieved later
  return NextResponse.json(
    {
      subscription: {
        id: subscription.id,
        url: subscription.url,
        events: subscription.events,
        active: subscription.active,
        createdAt: subscription.createdAt,
      },
      secret, // Only returned once
    },
    { status: 201 }
  );
}
