/**
 * Webhook Delivery History
 *
 * GET - List recent deliveries for a webhook subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  // Verify ownership
  const subscription = await prisma.webhookSubscription.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!subscription) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);

  const deliveries = await prisma.webhookDelivery.findMany({
    where: { subscriptionId: id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      event: true,
      statusCode: true,
      durationMs: true,
      attempt: true,
      success: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ deliveries });
}
