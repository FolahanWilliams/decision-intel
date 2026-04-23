/**
 * GET    /api/founder-hub/meetings/[id]  — single record detail
 * PATCH  /api/founder-hub/meetings/[id]  — update post-meeting fields
 * DELETE /api/founder-hub/meetings/[id]  — remove (no soft-delete)
 *
 * Auth: x-founder-pass header.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

const log = createLogger('FounderMeetingDetail');

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

const ALLOWED_STATUS = new Set(['prep', 'ready', 'completed', 'cancelled']);
const ALLOWED_OUTCOMES = new Set([
  'progressed',
  'stalled',
  'closed_won',
  'closed_lost',
  'rescheduled',
  'no_show',
  'other',
]);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!verify(_req)) return apiError({ error: 'Unauthorized', status: 401 });
  try {
    const meeting = await prisma.founderMeeting.findUnique({ where: { id } });
    if (!meeting) return apiError({ error: 'Not found', status: 404 });
    return apiSuccess({ data: { meeting } });
  } catch (err) {
    log.error('Failed to load meeting:', err);
    return apiError({ error: 'Failed to load meeting', status: 500 });
  }
}

interface PatchBody {
  scheduledAt?: string | null;
  happenedAt?: string | null;
  notes?: string | null;
  learnings?: string | null;
  nextSteps?: string | null;
  outcome?: string | null;
  status?: string;
  prospectName?: string | null;
  prospectRole?: string | null;
  prospectCompany?: string | null;
}

function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return apiError({ error: 'Invalid JSON', status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
  if (body.learnings !== undefined) data.learnings = body.learnings?.trim() || null;
  if (body.nextSteps !== undefined) data.nextSteps = body.nextSteps?.trim() || null;
  if (body.prospectName !== undefined) data.prospectName = body.prospectName?.trim() || null;
  if (body.prospectRole !== undefined) data.prospectRole = body.prospectRole?.trim() || null;
  if (body.prospectCompany !== undefined) data.prospectCompany = body.prospectCompany?.trim() || null;

  const scheduled = toDate(body.scheduledAt);
  if (scheduled !== undefined) data.scheduledAt = scheduled;
  const happened = toDate(body.happenedAt);
  if (happened !== undefined) data.happenedAt = happened;

  if (body.outcome !== undefined) {
    if (body.outcome === null || body.outcome === '') {
      data.outcome = null;
    } else if (ALLOWED_OUTCOMES.has(body.outcome)) {
      data.outcome = body.outcome;
    } else {
      return apiError({ error: 'Invalid outcome', status: 400 });
    }
  }

  if (body.status !== undefined) {
    if (!ALLOWED_STATUS.has(body.status)) {
      return apiError({ error: 'Invalid status', status: 400 });
    }
    data.status = body.status;
    // Stamp happenedAt when transitioning to completed if the caller
    // didn't pass one explicitly. Keeps the log honest — every
    // completed row has a date the UI can sort by.
    if (body.status === 'completed' && happened === undefined && !data.happenedAt) {
      data.happenedAt = new Date();
    }
  }

  if (Object.keys(data).length === 0) {
    return apiError({ error: 'No fields to update', status: 400 });
  }

  try {
    const meeting = await prisma.founderMeeting.update({ where: { id }, data });
    return apiSuccess({ data: { meeting } });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2025') return apiError({ error: 'Not found', status: 404 });
    log.error('Failed to update meeting:', err);
    return apiError({ error: 'Failed to update meeting', status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!verify(_req)) return apiError({ error: 'Unauthorized', status: 401 });
  try {
    await prisma.founderMeeting.delete({ where: { id } });
    return apiSuccess({ data: { deleted: true } });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2025') return apiError({ error: 'Not found', status: 404 });
    log.error('Failed to delete meeting:', err);
    return apiError({ error: 'Failed to delete meeting', status: 500 });
  }
}
