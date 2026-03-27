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

  const body = await request.json();
  const { url, events } = body as { url?: string; events?: string[] };

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // Validate URL
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
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

  // Limit subscriptions per user
  const existingCount = await prisma.webhookSubscription.count({
    where: { userId: auth.userId },
  });

  if (existingCount >= 10) {
    return NextResponse.json(
      { error: 'Maximum 10 webhook subscriptions per user' },
      { status: 400 }
    );
  }

  // Generate signing secret
  const secret = `whsec_${randomBytes(32).toString('hex')}`;

  const subscription = await prisma.webhookSubscription.create({
    data: {
      orgId: auth.userId!, // Use userId as orgId fallback
      userId: auth.userId!,
      url,
      events,
      secret,
    },
  });

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
