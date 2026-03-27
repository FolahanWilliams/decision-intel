/**
 * Individual Webhook Subscription Management
 *
 * GET    - Get subscription details
 * PATCH  - Update subscription (events, url, active)
 * DELETE - Delete subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { prisma } from '@/lib/prisma';
import { WEBHOOK_EVENTS } from '@/lib/integrations/webhooks/events';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const subscription = await prisma.webhookSubscription.findFirst({
    where: { id, userId: auth.userId },
    include: {
      _count: { select: { deliveries: true } },
    },
  });

  if (!subscription) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ subscription });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const existing = await prisma.webhookSubscription.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.url !== undefined) {
    try {
      const parsed = new URL(body.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 });
      }
      updates.url = body.url;
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
  }

  if (body.events !== undefined) {
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ error: 'At least one event required' }, { status: 400 });
    }
    const invalid = body.events.filter((e: string) => !(WEBHOOK_EVENTS as readonly string[]).includes(e));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Invalid events: ${invalid.join(', ')}` }, { status: 400 });
    }
    updates.events = body.events;
  }

  if (body.active !== undefined) {
    updates.active = Boolean(body.active);
    if (body.active) {
      updates.failCount = 0; // Reset failures on re-enable
    }
  }

  const updated = await prisma.webhookSubscription.update({
    where: { id },
    data: updates,
  });

  return NextResponse.json({ subscription: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const existing = await prisma.webhookSubscription.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.webhookSubscription.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
