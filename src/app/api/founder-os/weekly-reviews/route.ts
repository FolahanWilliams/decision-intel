/**
 * Founder OS weekly review API.
 *
 * GET /api/founder-os/weekly-reviews?limit=26
 *   Returns recent weekly reviews (default 26 = ~6 months). Sorted by
 *   weekStartDate desc.
 *
 * POST /api/founder-os/weekly-reviews
 *   Body: { weekStartDate, topLongForm, oneSkillNote?, internalLocusReflection }
 *   Upserts the review for that week (unique [userId, weekStartDate]).
 *
 * DELETE /api/founder-os/weekly-reviews?id=...
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FounderOsWeeklyReviews');

export const dynamic = 'force-dynamic';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

interface PostBody {
  weekStartDate?: string;
  topLongForm?: string;
  oneSkillNote?: string;
  internalLocusReflection?: string;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get('limit') ?? '26', 10) || 26, 1),
    200
  );

  try {
    const reviews = await prisma.founderOsWeeklyReview.findMany({
      where: { userId: auth.userId },
      orderBy: { weekStartDate: 'desc' },
      take: limit,
    });
    return apiSuccess({ data: { reviews } });
  } catch (err) {
    log.warn('list failed:', err);
    return apiSuccess({ data: { reviews: [] } });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }

  if (!body.weekStartDate || !DATE_RX.test(body.weekStartDate)) {
    return apiError({ error: 'weekStartDate (YYYY-MM-DD) required', status: 400 });
  }
  if (!body.topLongForm?.trim()) {
    return apiError({ error: 'topLongForm required', status: 400 });
  }
  if (!body.internalLocusReflection?.trim()) {
    return apiError({ error: 'internalLocusReflection required', status: 400 });
  }

  try {
    const review = await prisma.founderOsWeeklyReview.upsert({
      where: { userId_weekStartDate: { userId: auth.userId, weekStartDate: body.weekStartDate } },
      create: {
        userId: auth.userId,
        weekStartDate: body.weekStartDate,
        topLongForm: body.topLongForm.trim().slice(0, 4000),
        oneSkillNote: body.oneSkillNote?.trim().slice(0, 2000) ?? null,
        internalLocusReflection: body.internalLocusReflection.trim().slice(0, 4000),
      },
      update: {
        topLongForm: body.topLongForm.trim().slice(0, 4000),
        oneSkillNote: body.oneSkillNote?.trim().slice(0, 2000) ?? null,
        internalLocusReflection: body.internalLocusReflection.trim().slice(0, 4000),
      },
    });
    return apiSuccess({ data: { review } });
  } catch (err) {
    log.warn('upsert failed:', err);
    return apiError({ error: 'Failed to save weekly review', status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return apiError({ error: 'id query param required', status: 400 });

  try {
    const result = await prisma.founderOsWeeklyReview.deleteMany({
      where: { id, userId: auth.userId },
    });
    if (result.count === 0) {
      return apiError({ error: 'Not found', status: 404 });
    }
    return apiSuccess({ data: { deleted: true } });
  } catch (err) {
    log.warn('delete failed:', err);
    return apiError({ error: 'Failed to delete', status: 500 });
  }
}
