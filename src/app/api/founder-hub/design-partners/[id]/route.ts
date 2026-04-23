/**
 * PATCH /api/founder-hub/design-partners/[id]
 *   Update status / founder notes / call-scheduled timestamp on a single
 *   inbound design-partner application. Used by the Founder Hub triage UI.
 *
 * Auth: x-founder-pass header.
 *
 * Allowed status transitions:
 *   applied → reviewing | scheduled_call | declined | withdrawn
 *   reviewing → scheduled_call | accepted | declined | withdrawn
 *   scheduled_call → accepted | declined | withdrawn
 *   accepted → withdrawn (partner pulls out after acceptance)
 *   declined / withdrawn → reviewing (rare re-open case)
 *
 * The 5-seat capacity check runs on "accepted" transitions only. The UI
 * surfaces "open seats" live, but the API is the authoritative guard.
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import type { PartnerRichProfile } from '@/types/partner-profile';

const log = createLogger('FounderDesignPartnerItem');

const MAX_SEATS = 5;

const VALID_STATUSES = [
  'applied',
  'reviewing',
  'scheduled_call',
  'accepted',
  'declined',
  'withdrawn',
] as const;

type ValidStatus = (typeof VALID_STATUSES)[number];

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

interface PatchBody {
  status?: ValidStatus;
  founderNotes?: string;
  callScheduledAt?: string | null;
  slotOrder?: number | null;
  richProfile?: PartnerRichProfile | null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  const { id } = await params;
  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return apiError({ error: 'Invalid JSON', status: 400 });
  }

  const data: Record<string, unknown> = { reviewedAt: new Date() };

  if (body.status) {
    if (!VALID_STATUSES.includes(body.status))
      return apiError({
        error: `status must be one of ${VALID_STATUSES.join(', ')}`,
        status: 400,
      });
    data.status = body.status;
  }

  if (typeof body.founderNotes === 'string') {
    data.founderNotes = body.founderNotes.trim() || null;
  }

  if (body.callScheduledAt === null) {
    data.callScheduledAt = null;
  } else if (typeof body.callScheduledAt === 'string') {
    data.callScheduledAt = body.callScheduledAt ? new Date(body.callScheduledAt) : null;
  }

  if (body.slotOrder === null) {
    data.slotOrder = null;
  } else if (typeof body.slotOrder === 'number') {
    if (body.slotOrder < 1 || body.slotOrder > MAX_SEATS || !Number.isInteger(body.slotOrder)) {
      return apiError({
        error: `slotOrder must be an integer between 1 and ${MAX_SEATS}.`,
        status: 400,
      });
    }
    data.slotOrder = body.slotOrder;
  }

  if (body.richProfile === null) {
    data.richProfile = Prisma.JsonNull;
  } else if (body.richProfile && typeof body.richProfile === 'object') {
    data.richProfile = body.richProfile as unknown as Prisma.InputJsonValue;
  }

  // Capacity guard: don't accept the 6th seat.
  if (body.status === 'accepted') {
    try {
      const current = await prisma.designPartnerApplication.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!current) return apiError({ error: 'Application not found', status: 404 });
      if (current.status !== 'accepted') {
        const acceptedCount = await prisma.designPartnerApplication.count({
          where: { status: 'accepted' },
        });
        if (acceptedCount >= MAX_SEATS) {
          return apiError({
            error: `Cohort is full — ${MAX_SEATS} of ${MAX_SEATS} seats accepted. Move an existing partner to withdrawn before accepting this one.`,
            status: 409,
          });
        }
      }
    } catch (err) {
      log.error('Capacity guard failed:', err);
      return apiError({ error: 'Could not verify cohort capacity', status: 500 });
    }
  }

  try {
    const application = await prisma.designPartnerApplication.update({
      where: { id },
      data,
    });
    return apiSuccess({ data: { application } });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2025') return apiError({ error: 'Application not found', status: 404 });
    log.error('Failed to update application:', err);
    return apiError({ error: 'Failed to update application', status: 500 });
  }
}
