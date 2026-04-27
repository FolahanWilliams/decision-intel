/**
 * Design Partner Applications — POST /api/design-partner/apply
 *
 * Public, rate-limited endpoint for inbound applications to the 5-seat
 * design-partner cohort. Persists to DesignPartnerApplication, fires a
 * Slack webhook + founder email notification, and returns a booking link
 * (NEXT_PUBLIC_DEMO_BOOKING_URL, falling back to a static page anchor).
 *
 * Rate limits: 3 applications per IP per 24h. Prevents spam without
 * blocking a legitimate applicant re-submitting after a typo.
 *
 * Design note: deliberately no auth — design partners arrive via warm
 * intros from the founder's advisor network and hit /design-partner
 * directly. Gating the form behind a login would add friction without
 * protecting anything valuable.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { extractIp } from '@/lib/utils/request';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { sendEmail } from '@/lib/notifications/email';
import { z } from 'zod';

const log = createLogger('DesignPartnerApply');

const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_PER_IP = 3;

const ApplicationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().min(2).max(200),
  role: z.string().trim().min(2).max(120),
  linkedInUrl: z.string().trim().url().max(400).optional().or(z.literal('')),
  industry: z.enum(['banking', 'insurance', 'pharma', 'aerospace', 'energy', 'mna', 'other']),
  teamSize: z.enum(['1-5', '6-15', '16-50', '51-200', '200+']),
  memoCadence: z.string().trim().max(200).optional().or(z.literal('')),
  currentStack: z.string().trim().max(400).optional().or(z.literal('')),
  whyNow: z.string().trim().min(40).max(2000),
  source: z.enum(['warm-intro', 'linkedin', 'press', 'direct', 'other']).optional(),
});

async function notifySlack(payload: {
  name: string;
  company: string;
  role: string;
  industry: string;
  email: string;
}): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;
  const text = [
    ':handshake: *New design partner application*',
    `• *${payload.name}* — ${payload.role} at ${payload.company}`,
    `• industry: ${payload.industry}`,
    `• email: \`${payload.email}\``,
  ].join('\n');
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    log.warn('Slack webhook failed:', err);
  }
}

async function notifyFounder(app: {
  name: string;
  email: string;
  company: string;
  role: string;
  industry: string;
  teamSize: string;
  whyNow: string;
}): Promise<void> {
  const founderEmail = process.env.FOUNDER_EMAIL;
  if (!founderEmail) {
    log.warn('FOUNDER_EMAIL not configured — skipping founder notification.');
    return;
  }
  const subject = `Design partner application — ${app.name} @ ${app.company}`;
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;color:#0F172A;">
      <h2 style="color:#16A34A;margin:0 0 12px;">New design partner application</h2>
      <table style="border-collapse:collapse;font-size:14px;line-height:1.6;">
        <tr><td style="color:#64748B;padding:2px 12px 2px 0;">Name</td><td>${app.name}</td></tr>
        <tr><td style="color:#64748B;padding:2px 12px 2px 0;">Role</td><td>${app.role}</td></tr>
        <tr><td style="color:#64748B;padding:2px 12px 2px 0;">Company</td><td>${app.company}</td></tr>
        <tr><td style="color:#64748B;padding:2px 12px 2px 0;">Industry</td><td>${app.industry}</td></tr>
        <tr><td style="color:#64748B;padding:2px 12px 2px 0;">Team size</td><td>${app.teamSize}</td></tr>
        <tr><td style="color:#64748B;padding:2px 12px 2px 0;">Email</td><td><a href="mailto:${app.email}">${app.email}</a></td></tr>
      </table>
      <h3 style="margin:24px 0 8px;font-size:14px;color:#64748B;text-transform:uppercase;letter-spacing:0.08em;">Why now</h3>
      <p style="white-space:pre-wrap;font-size:14px;line-height:1.65;">${app.whyNow}</p>
      <p style="margin-top:24px;font-size:12px;color:#64748B;">Triage in the Founder Hub → Design Partners tab.</p>
    </div>
  `;
  const text = `New design partner application\n\nName: ${app.name}\nRole: ${app.role}\nCompany: ${app.company}\nIndustry: ${app.industry}\nTeam size: ${app.teamSize}\nEmail: ${app.email}\n\nWhy now:\n${app.whyNow}`;
  await sendEmail({ to: founderEmail, subject, html, text });
}

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = extractIp(req);
  const limit = await checkRateLimit(`design-partner-apply:${ip}`, '/api/design-partner/apply', {
    windowMs: WINDOW_MS,
    maxRequests: MAX_PER_IP,
    failMode: 'closed',
  });
  if (!limit.success) {
    return apiError({
      error:
        "You've submitted a few applications recently. Email team@decision-intel.com if you need another route in.",
      status: 429,
    });
  }

  // Parse + validate
  const body = await req.json().catch(() => null);
  if (!body) return apiError({ error: 'Invalid JSON body.', status: 400 });

  const parsed = ApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError({
      error: parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
      status: 400,
    });
  }
  const app = parsed.data;

  // Persist
  let applicationId: string;
  try {
    const created = await prisma.designPartnerApplication.create({
      data: {
        name: app.name,
        email: app.email.toLowerCase(),
        company: app.company,
        role: app.role,
        linkedInUrl: app.linkedInUrl || null,
        industry: app.industry,
        teamSize: app.teamSize,
        memoCadence: app.memoCadence || null,
        currentStack: app.currentStack || null,
        whyNow: app.whyNow,
        source: app.source ?? null,
      },
      select: { id: true },
    });
    applicationId = created.id;
  } catch (err) {
    log.error('DesignPartnerApplication persist failed:', err);
    return apiError({
      error:
        'Could not save your application right now. Email team@decision-intel.com as a fallback.',
      status: 500,
    });
  }

  // Notifications — fire-and-forget so a delivery hiccup never swallows
  // the applicant's successful submission.
  notifySlack({
    name: app.name,
    company: app.company,
    role: app.role,
    industry: app.industry,
    email: app.email,
  }).catch(err => log.warn('Slack notify failed:', err));

  notifyFounder({
    name: app.name,
    email: app.email,
    company: app.company,
    role: app.role,
    industry: app.industry,
    teamSize: app.teamSize,
    whyNow: app.whyNow,
  }).catch(err => log.warn('Founder notify failed:', err));

  // Booking link — Calendly if configured, static anchor fallback
  const bookingUrl = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL || null;

  log.info(`Design partner application ${applicationId} from ${app.company} (${app.industry})`);

  return apiSuccess({
    data: {
      applicationId,
      bookingUrl,
      message:
        "Application received. You'll hear back within 2 business days with next steps for the intro call.",
    },
  });
}
