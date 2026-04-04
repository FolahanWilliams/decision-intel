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

/**
 * Block webhook URLs pointing to private/internal networks (SSRF prevention).
 */
function isPrivateHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
  if (hostname === '169.254.169.254') return true;
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }
  return false;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    let parsed: URL;
    try {
      parsed = new URL(body.url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 });
    }
    if (isPrivateHostname(parsed.hostname)) {
      return NextResponse.json(
        { error: 'URL must not point to a private or internal network address' },
        { status: 400 }
      );
    }
    updates.url = body.url;
  }

  if (body.events !== undefined) {
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ error: 'At least one event required' }, { status: 400 });
    }
    const invalid = body.events.filter(
      (e: string) => !(WEBHOOK_EVENTS as readonly string[]).includes(e)
    );
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
