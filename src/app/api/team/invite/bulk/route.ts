/**
 * Bulk Team Invite API
 *
 * POST /api/team/invite/bulk — Invite several teammates in one request.
 *
 * A 5-12 person strategy team onboards all at once; one-at-a-time invites are
 * friction at the exact adoption moment. This processes a list of emails,
 * stops cleanly at the plan's seat cap, and reports a per-email result so the
 * admin can see exactly who was invited vs. skipped (and why).
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { checkTeamSizeLimit } from '@/lib/utils/plan-limits';
import { generateShareToken } from '@/lib/utils/share-token';
import { PLANS } from '@/lib/stripe';
import { logAudit } from '@/lib/audit';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

const log = createLogger('TeamInviteBulk');

/** Hard cap on emails per bulk request — well above any single-team seat cap. */
const MAX_BULK_EMAILS = 50;

const BulkInviteSchema = z.object({
  emails: z.array(z.string()).min(1).max(MAX_BULK_EMAILS),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

const emailShape = z.string().email();

type SkipReason = 'invalid_email' | 'self' | 'already_member' | 'already_invited' | 'seat_limit';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Bulk is heavier than a single invite — tighter window.
  const rateLimitResult = await checkRateLimit(user.id, '/api/team/invite/bulk', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
  });
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    );
  }

  try {
    const body = await req.json();
    const { emails, role } = BulkInviteSchema.parse(body);

    // Must be owner or admin — load org for the invite email.
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id, role: { in: ['owner', 'admin'] } },
      include: { organization: { select: { id: true, name: true } } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    const orgId = membership.orgId;

    // Normalize: lowercase, trim, dedupe (preserve first-seen order).
    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const raw of emails) {
      const email = raw.trim().toLowerCase();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      normalized.push(email);
    }

    // Pre-load existing members + pending invites for this org in one pass each.
    const [members, pendingInvites] = await Promise.all([
      prisma.teamMember.findMany({ where: { orgId }, select: { email: true } }),
      prisma.teamInvite.findMany({
        where: { orgId, status: 'pending' },
        select: { email: true },
      }),
    ]);
    const memberEmails = new Set(members.map(m => m.email.toLowerCase()));
    const pendingEmails = new Set(pendingInvites.map(i => i.email.toLowerCase()));

    // Seat headroom — pending invites already count toward `used`. This is a
    // best-effort gate to avoid obviously over-inviting; the AUTHORITATIVE seat
    // boundary is the atomic, org-row-locked check at invite/accept (a pending
    // invite is not a consumed seat until accepted, and any excess pending
    // invites are blocked there).
    const seatCheck = await checkTeamSizeLimit(orgId);
    let remaining = Math.max(0, seatCheck.limit - seatCheck.used);

    const created: { email: string; id: string }[] = [];
    const skipped: { email: string; reason: SkipReason }[] = [];

    for (const email of normalized) {
      if (!emailShape.safeParse(email).success) {
        skipped.push({ email, reason: 'invalid_email' });
        continue;
      }
      if (email === user.email?.toLowerCase()) {
        skipped.push({ email, reason: 'self' });
        continue;
      }
      if (memberEmails.has(email)) {
        skipped.push({ email, reason: 'already_member' });
        continue;
      }
      if (pendingEmails.has(email)) {
        skipped.push({ email, reason: 'already_invited' });
        continue;
      }
      if (remaining <= 0) {
        skipped.push({ email, reason: 'seat_limit' });
        continue;
      }

      let invite;
      try {
        invite = await prisma.teamInvite.create({
          data: {
            orgId,
            email,
            role,
            invitedByUserId: user.id,
            token: generateShareToken(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      } catch (createErr) {
        // A concurrent invite can win the (orgId, email) unique race between
        // our pre-check and this insert. Treat the collision as an
        // already-invited skip rather than 500-ing the whole batch.
        if (
          createErr instanceof Prisma.PrismaClientKnownRequestError &&
          createErr.code === 'P2002'
        ) {
          skipped.push({ email, reason: 'already_invited' });
          continue;
        }
        throw createErr;
      }
      remaining -= 1;
      pendingEmails.add(email); // guard against duplicate rows within this batch
      created.push({ email, id: invite.id });

      // Fire-and-forget invite email (per-invite, mirrors the single-invite route).
      import('@/lib/notifications/email')
        .then(({ notifyTeamInvite }) =>
          notifyTeamInvite(
            email,
            (user.user_metadata as Record<string, string> | undefined)?.full_name ||
              user.email ||
              'A teammate',
            membership.organization?.name || 'a team',
            invite.token
          )
        )
        .catch(err => log.error('Bulk invite email failed:', err));

      await logAudit({
        action: 'TEAM_MEMBER_INVITED',
        resource: 'team_invite',
        resourceId: invite.id,
        orgId,
        details: { email, role, bulk: true },
      });
    }

    log.info(`Bulk invite: ${created.length} sent, ${skipped.length} skipped for org ${orgId}`);

    return NextResponse.json(
      {
        created,
        skipped,
        seats: {
          plan: seatCheck.plan,
          planName: PLANS[seatCheck.plan].name,
          used: seatCheck.used + created.length,
          limit: seatCheck.limit,
        },
      },
      { status: created.length > 0 ? 201 : 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    log.error('Failed to process bulk invite:', error);
    return NextResponse.json({ error: 'Failed to send invites' }, { status: 500 });
  }
}
