/**
 * PATCH  /api/founder-hub/prospects/[id]  — update status / notes / dates
 * DELETE /api/founder-hub/prospects/[id]  — archive a prospect
 *
 * Auth: x-founder-pass header.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

const log = createLogger('FounderProspectsId');

const VALID_STATUSES = ['cold', 'warm', 'active', 'converted', 'archived'];

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

interface PatchBody {
  status?: string;
  notes?: string;
  lastContact?: string;
  followUpDue?: string | null;
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

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return apiError({ error: `status must be one of: ${VALID_STATUSES.join(', ')}`, status: 400 });
  }

  try {
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.lastContact !== undefined) data.lastContact = new Date(body.lastContact);
    if (body.followUpDue !== undefined) {
      data.followUpDue = body.followUpDue ? new Date(body.followUpDue) : null;
    }

    const prospect = await prisma.founderProspect.update({
      where: { id },
      data,
    });
    return apiSuccess({ data: { prospect } });
  } catch (err) {
    log.error('Failed to update prospect', { id, err });
    return apiError({ error: 'Failed to update prospect', status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  const { id } = await params;
  try {
    await prisma.founderProspect.update({
      where: { id },
      data: { status: 'archived' },
    });
    return apiSuccess({ data: { ok: true } });
  } catch (err) {
    log.error('Failed to archive prospect', { id, err });
    return apiError({ error: 'Failed to archive prospect', status: 500 });
  }
}
