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
import { getOrgPlan } from '@/lib/utils/plan-limits';
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

    const created: { email: string; id: string; token: string }[] = [];
    const skipped: { email: string; reason: SkipReason }[] = [];

    // Classify every email against the non-seat checks OUTSIDE the transaction
    // (these don't mutate seats). What's left is the seat-consuming candidate set.
    const candidates: string[] = [];
    for (const email of normalized) {
      if (!emailShape.safeParse(email).success) {
        skipped.push({ email, reason: 'invalid_email' });
      } else if (email === user.email?.toLowerCase()) {
        skipped.push({ email, reason: 'self' });
      } else if (memberEmails.has(email)) {
        skipped.push({ email, reason: 'already_member' });
      } else if (pendingEmails.has(email)) {
        skipped.push({ email, reason: 'already_invited' });
      } else {
        candidates.push(email);
      }
    }

    // Consume seats ATOMICALLY: lock the org row, re-count used (members +
    // pending invites) inside the transaction, and create invites only up to
    // the LIVE headroom. The prior best-effort gate let two concurrent bulks
    // both read the same headroom and both over-invite; locking the org row
    // serializes them (mirrors the authoritative gate in invite/accept).
    // Interactive transactions don't auto-retry, so mutating the outer
    // skipped/created arrays inside the callback is safe (runs exactly once).
    const plan = await getOrgPlan(orgId);
    const seatLimit = PLANS[plan].maxTeamMembers;
    let usedBefore = 0;

    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Organization" WHERE id = ${orgId} FOR UPDATE`;
      const [memberCount, pendingCount] = await Promise.all([
        tx.teamMember.count({ where: { orgId } }),
        tx.teamInvite.count({ where: { orgId, status: 'pending' } }),
      ]);
      usedBefore = memberCount + pendingCount;
      let headroom = Number.isFinite(seatLimit)
        ? Math.max(0, seatLimit - usedBefore)
        : candidates.length;

      for (const email of candidates) {
        if (headroom <= 0) {
          skipped.push({ email, reason: 'seat_limit' });
          continue;
        }
        try {
          const invite = await tx.teamInvite.create({
            data: {
              orgId,
              email,
              role,
              invitedByUserId: user.id,
              token: generateShareToken(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
          created.push({ email, id: invite.id, token: invite.token });
          headroom -= 1;
        } catch (createErr) {
          // A concurrent invite can win the (orgId, email) unique race between
          // our pre-check and this insert. Treat the collision as an
          // already-invited skip rather than failing the whole batch.
          if (
            createErr instanceof Prisma.PrismaClientKnownRequestError &&
            createErr.code === 'P2002'
          ) {
            skipped.push({ email, reason: 'already_invited' });
            continue;
          }
          throw createErr;
        }
      }
    });

    // Post-commit, fire-and-forget: emails + audit logs for the created set.
    // Kept OUTSIDE the transaction so network/email latency never holds the
    // org-row lock open.
    const inviterName =
      (user.user_metadata as Record<string, string> | undefined)?.full_name ||
      user.email ||
      'A teammate';
    const orgName = membership.organization?.name || 'a team';
    for (const c of created) {
      import('@/lib/notifications/email')
        .then(({ notifyTeamInvite }) => notifyTeamInvite(c.email, inviterName, orgName, c.token))
        .catch(err => log.error('Bulk invite email failed:', err));
      await logAudit({
        action: 'TEAM_MEMBER_INVITED',
        resource: 'team_invite',
        resourceId: c.id,
        orgId,
        details: { email: c.email, role, bulk: true },
      });
    }

    log.info(`Bulk invite: ${created.length} sent, ${skipped.length} skipped for org ${orgId}`);

    return NextResponse.json(
      {
        created: created.map(({ email, id }) => ({ email, id })),
        skipped,
        seats: {
          plan,
          planName: PLANS[plan].name,
          used: usedBefore + created.length,
          limit: Number.isFinite(seatLimit) ? seatLimit : Number.MAX_SAFE_INTEGER,
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
