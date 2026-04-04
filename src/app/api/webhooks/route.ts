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

/**
 * Block webhook URLs pointing to private/internal networks (SSRF prevention).
 */
function isPrivateHostname(hostname: string): boolean {
  // Localhost variants
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;

  // AWS metadata endpoint
  if (hostname === '169.254.169.254') return true;

  // Private IPv4 ranges
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 0) return true; // 0.0.0.0/8
  }

  return false;
}

function validateWebhookUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid URL';
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return 'URL must use http or https';
  }
  if (isPrivateHostname(parsed.hostname)) {
    return 'URL must not point to a private or internal network address';
  }
  return null;
}

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

  // Validate URL (blocks private/internal addresses to prevent SSRF)
  const urlError = validateWebhookUrl(url);
  if (urlError) {
    return NextResponse.json({ error: urlError }, { status: 400 });
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
