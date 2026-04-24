/**
 * GET  /api/founder-hub/meetings  — list (ordered by effective date desc)
 * POST /api/founder-hub/meetings  — create a meeting record (from
 *                                    MeetingPrepCard after the prep
 *                                    plan finishes streaming)
 *
 * Auth: x-founder-pass header. No org scope — founder-only resource.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

const log = createLogger('FounderMeetings');

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

// Accepted values — mirrors the meeting-prep route's MEETING_TYPES and
// the MeetingsLogTab filter chips. Keep these three lists in sync.
const ALLOWED_TYPES = new Set([
  'cso_discovery',
  'vc_pitch',
  'vc_fundraise_first',
  'advisor_intro',
  'design_partner_review',
  'reference_call',
  'content_collab',
  'other',
]);
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

export async function GET(req: NextRequest) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  try {
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');
    const limit = Math.min(
      Math.max(1, Number.parseInt(url.searchParams.get('limit') ?? '200', 10) || 200),
      500
    );

    const where = statusFilter && ALLOWED_STATUS.has(statusFilter) ? { status: statusFilter } : {};

    // Order by effective date: happenedAt for completed rows,
    // scheduledAt for ready/prep rows, createdAt as final fallback. We
    // sort in JS after fetching since Postgres COALESCE in orderBy is
    // awkward through Prisma — the rows are bounded (≤500), cheap.
    const rows = await prisma.founderMeeting.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const sorted = [...rows].sort((a, b) => {
      const aDate = a.happenedAt ?? a.scheduledAt ?? a.createdAt;
      const bDate = b.happenedAt ?? b.scheduledAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    return apiSuccess({ data: { meetings: sorted } });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      // Schema drift — table not migrated yet. Return empty so the UI
      // doesn't block on a cold DB.
      return apiSuccess({ data: { meetings: [] } });
    }
    log.error('Failed to list meetings:', err);
    return apiError({ error: 'Failed to load meetings', status: 500 });
  }
}

interface CreateBody {
  /**
   * 'prep' (default) — MeetingPrepCard path, requires the four prep
   *   fields (linkedInInfo / meetingContext / founderAsk / prepPlan).
   * 'log' — MeetingsLogTab "Log a past meeting" path. Prep fields are
   *   optional; what-happened / outcomes / future content is supplied
   *   via notes / learnings / nextSteps instead.
   */
  mode?: 'prep' | 'log';
  meetingType?: string;
  prospectName?: string;
  prospectRole?: string;
  prospectCompany?: string;
  linkedInInfo?: string;
  meetingContext?: string;
  founderAsk?: string;
  prepPlan?: string;
  /** What happened in the meeting — raw recap. Only used in 'log' mode. */
  notes?: string;
  /** Outcomes — decisions, commitments, takeaways. Only used in 'log' mode. */
  learnings?: string;
  /** The future — follow-ups and next steps. Only used in 'log' mode. */
  nextSteps?: string;
  /** Free-text outcome picker value (progressed / stalled / etc.). */
  outcome?: string;
  scheduledAt?: string | null;
  /** When the meeting actually happened. Populated for logged past meetings. */
  happenedAt?: string | null;
  status?: string;
}

export async function POST(req: NextRequest) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return apiError({ error: 'Invalid JSON', status: 400 });
  }

  const mode = body.mode === 'log' ? 'log' : 'prep';
  const meetingType = (body.meetingType ?? 'other').trim();
  const linkedInInfo = (body.linkedInInfo ?? '').trim();
  const meetingContext = (body.meetingContext ?? '').trim();
  const founderAsk = (body.founderAsk ?? '').trim();
  const prepPlan = (body.prepPlan ?? '').trim();
  const notes = (body.notes ?? '').trim();
  const learnings = (body.learnings ?? '').trim();
  const nextSteps = (body.nextSteps ?? '').trim();

  if (!ALLOWED_TYPES.has(meetingType)) {
    return apiError({ error: 'Invalid meetingType', status: 400 });
  }

  if (mode === 'prep') {
    // MeetingPrepCard flow — all four prep fields required.
    if (linkedInInfo.length < 40) {
      return apiError({ error: 'linkedInInfo is required (40 chars minimum)', status: 400 });
    }
    if (meetingContext.length < 20) {
      return apiError({ error: 'meetingContext is required (20 chars minimum)', status: 400 });
    }
    if (founderAsk.length < 15) {
      return apiError({ error: 'founderAsk is required (15 chars minimum)', status: 400 });
    }
    if (prepPlan.length < 100) {
      return apiError({ error: 'prepPlan is required (full generated plan)', status: 400 });
    }
  } else {
    // Log-a-past-meeting flow — at least one of the three post-meeting
    // text fields must carry something, otherwise there's no content.
    // Prospect name OR a non-empty body is enough to create the row.
    const hasProspect = Boolean(body.prospectName?.trim());
    const hasBody = notes.length > 0 || learnings.length > 0 || nextSteps.length > 0;
    if (!hasProspect && !hasBody) {
      return apiError({
        error: 'Add a prospect name OR at least one of: what happened, outcomes, next steps.',
        status: 400,
      });
    }
  }

  const defaultStatus = mode === 'log' ? 'completed' : 'prep';
  const status = body.status && ALLOWED_STATUS.has(body.status) ? body.status : defaultStatus;
  const scheduledAt =
    body.scheduledAt && !Number.isNaN(new Date(body.scheduledAt).getTime())
      ? new Date(body.scheduledAt)
      : null;
  const happenedAt =
    body.happenedAt && !Number.isNaN(new Date(body.happenedAt).getTime())
      ? new Date(body.happenedAt)
      : mode === 'log'
        ? new Date() // default to "now" for logged past meetings
        : null;
  const outcome = body.outcome && ALLOWED_OUTCOMES.has(body.outcome) ? body.outcome : null;

  try {
    const meeting = await prisma.founderMeeting.create({
      data: {
        meetingType,
        prospectName: body.prospectName?.trim() || null,
        prospectRole: body.prospectRole?.trim() || null,
        prospectCompany: body.prospectCompany?.trim() || null,
        linkedInInfo: mode === 'prep' ? linkedInInfo : linkedInInfo || null,
        meetingContext: mode === 'prep' ? meetingContext : meetingContext || null,
        founderAsk: mode === 'prep' ? founderAsk : founderAsk || null,
        prepPlan: mode === 'prep' ? prepPlan : prepPlan || null,
        notes: notes || null,
        learnings: learnings || null,
        nextSteps: nextSteps || null,
        outcome,
        scheduledAt,
        happenedAt,
        status,
        source: mode,
      },
    });
    return apiSuccess({ data: { meeting } });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      return apiError({
        error: 'Meeting log not yet migrated. Run prisma migrate deploy.',
        status: 503,
      });
    }
    log.error('Failed to create meeting:', err);
    return apiError({ error: 'Failed to create meeting', status: 500 });
  }
}
