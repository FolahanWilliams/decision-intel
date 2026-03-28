/**
 * Test Webhook — Sends a test event to verify the webhook is working
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { prisma } from '@/lib/prisma';
import { createHmac } from 'crypto';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const subscription = await prisma.webhookSubscription.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!subscription) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const testPayload = JSON.stringify({
    event: 'test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook delivery from Decision Intel',
      subscriptionId: subscription.id,
    },
  });

  const signature = createHmac('sha256', subscription.secret).update(testPayload).digest('hex');

  const start = performance.now();
  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let success = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(subscription.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DecisionIntel-Signature': `sha256=${signature}`,
        'X-DecisionIntel-Event': 'test',
        'User-Agent': 'DecisionIntel-Webhook/1.0',
      },
      body: testPayload,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    statusCode = response.status;
    responseBody = await response.text().catch(() => null);
    success = response.ok;
  } catch (err) {
    responseBody = err instanceof Error ? err.message : 'Unknown error';
  }

  const durationMs = Math.round(performance.now() - start);

  // Log the test delivery
  await prisma.webhookDelivery.create({
    data: {
      subscriptionId: subscription.id,
      event: 'test',
      payload: { message: 'Test delivery' },
      statusCode,
      responseBody: responseBody?.slice(0, 2000) ?? null,
      durationMs,
      attempt: 1,
      success,
    },
  });

  return NextResponse.json({
    success,
    statusCode,
    durationMs,
    responseBody: responseBody?.slice(0, 500),
  });
}
