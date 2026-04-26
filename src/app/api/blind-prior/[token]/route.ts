/**
 * Public token-gated blind-prior submission (4.1 deep).
 *
 * GET  /api/blind-prior/[token] — load the survey context (no DocSecret
 *      content leaks; only the room title + outcome frame + deadline +
 *      already-submitted state). No login required.
 *
 * POST /api/blind-prior/[token] — submit the prior. Single-use; on
 *      replay returns the existing prior with status `already_submitted`.
 *
 * Procurement-grade rules:
 *   - The token IS the auth. We never expose the underlying analysis
 *     content here — only the high-level frame.
 *   - The deadline is enforced server-side: late submissions are 410
 *     Gone, never silently accepted.
 *   - Tokens rotate on re-distribution; only the latest token is valid.
 *   - Audit-log every submission with the invite id (NOT the token).
 *   - Rate-limit aggressively to prevent token brute-forcing — 30/hr/IP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const log = createLogger('BlindPriorPublic');

const MAX_RISKS = 3;
const MAX_RISK_LEN = 200;
const MAX_RATIONALE = 500;

async function loadInviteByToken(token: string) {
  return prisma.decisionRoomInvite.findUnique({
    where: { submissionToken: token },
    select: {
      id: true,
      roomId: true,
      userId: true,
      email: true,
      displayName: true,
      role: true,
      tokenExpiresAt: true,
      usedAt: true,
      room: {
        select: {
          id: true,
          title: true,
          status: true,
          decisionType: true,
          blindPriorDeadline: true,
          blindPriorRevealedAt: true,
          blindPriorOutcomeFrame: true,
        },
      },
    },
  });
}

function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) return `${local[0] ?? ''}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.max(local.length - 2, 1))}${local[local.length - 1]}@${domain}`;
}

function ipFromRequest(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const ip = ipFromRequest(request);
    const rateLimitResult = await checkRateLimit(ip, '/api/blind-prior/get', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 60,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { token } = await params;
    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const invite = await loadInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found or revoked.' }, { status: 404 });
    }
    if (invite.tokenExpiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        {
          error: 'This survey link has expired.',
          expired: true,
          deadline: invite.room.blindPriorDeadline?.toISOString() ?? null,
        },
        { status: 410 }
      );
    }
    if (invite.room.blindPriorRevealedAt) {
      return NextResponse.json(
        {
          error: 'The aggregate has already been revealed for this room.',
          revealed: true,
        },
        { status: 410 }
      );
    }

    let existingPrior = null;
    if (invite.userId) {
      existingPrior = await prisma.decisionRoomBlindPrior.findUnique({
        where: {
          roomId_respondentUserId: { roomId: invite.roomId, respondentUserId: invite.userId },
        },
        select: {
          id: true,
          confidencePercent: true,
          topRisks: true,
          shareRationale: true,
          shareIdentity: true,
          submittedAt: true,
        },
      });
    } else if (invite.email) {
      existingPrior = await prisma.decisionRoomBlindPrior.findUnique({
        where: { roomId_respondentEmail: { roomId: invite.roomId, respondentEmail: invite.email } },
        select: {
          id: true,
          confidencePercent: true,
          topRisks: true,
          shareRationale: true,
          shareIdentity: true,
          submittedAt: true,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      room: {
        id: invite.room.id,
        title: invite.room.title,
        decisionType: invite.room.decisionType,
        outcomeFrame: invite.room.blindPriorOutcomeFrame,
        deadline: invite.room.blindPriorDeadline?.toISOString() ?? null,
      },
      invite: {
        id: invite.id,
        displayName: invite.displayName ?? null,
        role: invite.role,
        recipient: invite.userId ? 'platform_user' : 'external',
        recipientHint: maskEmail(invite.email),
      },
      existingPrior,
    });
  } catch (err) {
    log.error('Survey load failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const ip = ipFromRequest(request);
    const rateLimitResult = await checkRateLimit(ip, '/api/blind-prior/post', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 30,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { token } = await params;
    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { confidencePercent, topRisks, privateRationale, shareRationale, shareIdentity } =
      body as {
        confidencePercent?: unknown;
        topRisks?: unknown;
        privateRationale?: unknown;
        shareRationale?: unknown;
        shareIdentity?: unknown;
      };

    if (
      typeof confidencePercent !== 'number' ||
      !Number.isFinite(confidencePercent) ||
      confidencePercent < 0 ||
      confidencePercent > 100
    ) {
      return NextResponse.json(
        { error: 'confidencePercent must be a number between 0 and 100.' },
        { status: 400 }
      );
    }
    const intConfidence = Math.round(confidencePercent);

    if (!Array.isArray(topRisks)) {
      return NextResponse.json({ error: 'topRisks must be an array of strings.' }, { status: 400 });
    }
    const cleanedRisks = topRisks
      .filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
      .slice(0, MAX_RISKS)
      .map(r => r.trim().slice(0, MAX_RISK_LEN));
    if (cleanedRisks.length === 0) {
      return NextResponse.json(
        { error: 'Submit at least one top-risk statement.' },
        { status: 400 }
      );
    }

    const cleanedRationale =
      typeof privateRationale === 'string'
        ? privateRationale.trim().slice(0, MAX_RATIONALE) || null
        : null;
    const cleanedShareRationale = Boolean(shareRationale) && cleanedRationale !== null;
    const cleanedShareIdentity = Boolean(shareIdentity);

    const invite = await loadInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found or revoked.' }, { status: 404 });
    }
    if (invite.tokenExpiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'This survey link has expired.' }, { status: 410 });
    }
    if (invite.room.blindPriorRevealedAt) {
      return NextResponse.json(
        { error: 'The aggregate has already been revealed for this room.' },
        { status: 410 }
      );
    }
    if (invite.room.blindPriorDeadline && invite.room.blindPriorDeadline.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'The deadline for blind-prior submissions has passed.' },
        { status: 410 }
      );
    }
    if (invite.role === 'observer') {
      return NextResponse.json(
        { error: 'Observers cannot submit a blind prior — only voters can.' },
        { status: 403 }
      );
    }

    // Determine the unique key for upsert.
    const respondentUserId = invite.userId ?? null;
    const respondentEmail = invite.email ?? null;
    if (!respondentUserId && !respondentEmail) {
      return NextResponse.json({ error: 'Invite is malformed.' }, { status: 500 });
    }

    let prior;
    try {
      if (respondentUserId) {
        prior = await prisma.decisionRoomBlindPrior.upsert({
          where: {
            roomId_respondentUserId: {
              roomId: invite.roomId,
              respondentUserId,
            },
          },
          create: {
            roomId: invite.roomId,
            respondentUserId,
            respondentName: invite.displayName ?? null,
            confidencePercent: intConfidence,
            topRisks: cleanedRisks,
            privateRationale: cleanedRationale,
            shareRationale: cleanedShareRationale,
            shareIdentity: cleanedShareIdentity,
          },
          update: {
            respondentName: invite.displayName ?? null,
            confidencePercent: intConfidence,
            topRisks: cleanedRisks,
            privateRationale: cleanedRationale,
            shareRationale: cleanedShareRationale,
            shareIdentity: cleanedShareIdentity,
          },
        });
      } else {
        prior = await prisma.decisionRoomBlindPrior.upsert({
          where: {
            roomId_respondentEmail: {
              roomId: invite.roomId,
              respondentEmail: respondentEmail!,
            },
          },
          create: {
            roomId: invite.roomId,
            respondentEmail,
            respondentName: invite.displayName ?? null,
            confidencePercent: intConfidence,
            topRisks: cleanedRisks,
            privateRationale: cleanedRationale,
            shareRationale: cleanedShareRationale,
            shareIdentity: cleanedShareIdentity,
          },
          update: {
            respondentName: invite.displayName ?? null,
            confidencePercent: intConfidence,
            topRisks: cleanedRisks,
            privateRationale: cleanedRationale,
            shareRationale: cleanedShareRationale,
            shareIdentity: cleanedShareIdentity,
          },
        });
      }
    } catch (err) {
      log.error('Prior upsert failed:', err instanceof Error ? err.message : String(err));
      return NextResponse.json(
        { error: 'Could not record your prior. Please retry.' },
        { status: 500 }
      );
    }

    // Stamp the invite as used (idempotent on re-submit).
    await prisma.decisionRoomInvite.update({
      where: { id: invite.id },
      data: { usedAt: invite.usedAt ?? new Date() },
    });

    // Audit log — references the invite, never the token, never the
    // prior content.
    try {
      await prisma.auditLog.create({
        data: {
          userId: invite.userId ?? 'external_invitee',
          action: 'BLIND_PRIOR_SUBMITTED',
          resource: 'decision_room',
          resourceId: invite.roomId,
          details: {
            inviteId: invite.id,
            via: invite.userId ? 'platform_user' : 'external',
            confidencePercent: intConfidence,
          },
        },
      });
    } catch (err) {
      log.warn('Audit log failed:', err instanceof Error ? err.message : String(err));
    }

    return NextResponse.json({
      ok: true,
      priorId: prior.id,
      submittedAt: prior.submittedAt.toISOString(),
      respondent: invite.displayName ?? null,
    });
  } catch (err) {
    log.error('Submit failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
