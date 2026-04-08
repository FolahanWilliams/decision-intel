/**
 * Pilot Interest Capture — POST /api/pilot-interest
 *
 * Captures inbound pilot interest from the public case-study library CTAs
 * and from other marketing surfaces. Writes to `AnalyticsEvent` (no new
 * table needed at pilot scale) and fires a Slack webhook if configured.
 *
 * Public. No auth. Email + optional case slug/company, rate-limited by IP
 * through the same middleware as the rest of the marketing API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { sendNewsletterWelcome } from '@/lib/notifications/email';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { z } from 'zod';

const log = createLogger('PilotInterest');

const PilotInterestSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address.' }).max(254),
  caseSlug: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  source: z.string().max(100).optional(),
});

async function notifySlack(payload: {
  email: string;
  caseSlug?: string;
  company?: string;
  referer: string | null;
}): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;

  const caseLine = payload.caseSlug
    ? `• case: *${payload.company ?? payload.caseSlug}* (${payload.caseSlug})`
    : '• source: direct';
  const text = [
    `:inbox_tray: *New pilot interest*`,
    `• email: \`${payload.email}\``,
    caseLine,
    payload.referer ? `• referer: ${payload.referer}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    // Fire-and-forget; never block the response on Slack.
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    log.warn('Slack webhook failed', { error: err });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP — public endpoint, prevent abuse
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = await checkRateLimit(ip, '/api/pilot-interest', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      failMode: 'open', // Don't block leads on DB errors
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = PilotInterestSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return apiError({ error: first?.message ?? 'Invalid request', status: 400 });
    }

    const { email, caseSlug, company, source } = parsed.data;
    const referer = req.headers.get('referer');

    try {
      const { prisma } = await import('@/lib/prisma');
      await prisma.analyticsEvent.create({
        data: {
          name: 'pilot_interest_submitted',
          properties: {
            email,
            caseSlug: caseSlug ?? null,
            company: company ?? null,
            source: source ?? 'case_study_cta',
            referer: referer ?? null,
          } as object,
        },
      });
    } catch (err: unknown) {
      // Never fail the user-facing submission due to analytics persistence issues.
      // Log the error but continue — the Slack notification is the critical path.
      log.warn('Failed to persist pilot interest to AnalyticsEvent', {
        error: err instanceof Error ? err.message : String(err),
        code: (err as { code?: string }).code,
      });
    }

    // Fire-and-forget Slack ping; don't await the promise chain longer than needed.
    void notifySlack({ email, caseSlug, company, referer });

    // Send welcome email for newsletter subscriptions (fire-and-forget)
    if (source?.startsWith('newsletter_')) {
      void sendNewsletterWelcome(email);
    }

    return apiSuccess({ data: { ok: true } });
  } catch (err) {
    log.error('Failed to record pilot interest', { error: err });
    return apiError({
      error: 'Submission failed',
      status: 500,
      cause: err instanceof Error ? err : undefined,
    });
  }
}
