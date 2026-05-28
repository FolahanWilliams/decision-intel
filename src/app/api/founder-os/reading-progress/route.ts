/**
 * Faith OS reading-plan progress API (2026-05-28).
 *
 * GET  /api/founder-os/reading-progress?planId=proverbs
 *   Lists the founder's completed passages, newest first. Optional `planId`
 *   filter ('proverbs' | 'founders-journey').
 *
 * POST /api/founder-os/reading-progress
 *   Body: { planId, reference, reflection? }
 *   Upserts the (planId, reference) read for this founder — idempotent via
 *   the unique [userId, planId, reference] index, so re-marking a passage
 *   read overwrites the reflection + bumps completedAt cleanly. To "un-read"
 *   a passage, DELETE it.
 *
 * DELETE /api/founder-os/reading-progress?planId=...&reference=...
 *
 * Dual-gated by founder pass + Supabase user.id.
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FounderOsReadingProgress');

export const dynamic = 'force-dynamic';

interface PostBody {
  planId?: string;
  reference?: string;
  reflection?: string;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const planId = url.searchParams.get('planId');
  const where: { userId: string; planId?: string } = { userId: auth.userId };
  if (planId) where.planId = planId;

  try {
    const progress = await prisma.founderOsReadingProgress.findMany({
      where,
      orderBy: { completedAt: 'desc' },
    });
    return apiSuccess({ data: { progress } });
  } catch (err) {
    // @schema-drift-tolerant — pre-migration envs return empty rather than 500.
    log.warn('list failed:', err);
    return apiSuccess({ data: { progress: [] } });
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

  const planId = typeof body.planId === 'string' ? body.planId.trim().slice(0, 60) : '';
  const reference = typeof body.reference === 'string' ? body.reference.trim().slice(0, 120) : '';
  if (!planId || !reference) {
    return apiError({ error: 'planId and reference required', status: 400 });
  }
  const reflection =
    typeof body.reflection === 'string' && body.reflection.trim()
      ? body.reflection.trim().slice(0, 8000)
      : null;

  try {
    const entry = await prisma.founderOsReadingProgress.upsert({
      where: {
        userId_planId_reference: { userId: auth.userId, planId, reference },
      },
      create: { userId: auth.userId, planId, reference, reflection },
      update: { reflection, completedAt: new Date() },
    });
    return apiSuccess({ data: { entry } });
  } catch (err) {
    log.warn('upsert failed:', err);
    return apiError({ error: 'Failed to save reading progress', status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const planId = url.searchParams.get('planId');
  const reference = url.searchParams.get('reference');
  if (!planId || !reference) {
    return apiError({ error: 'planId and reference required', status: 400 });
  }

  try {
    const result = await prisma.founderOsReadingProgress.deleteMany({
      where: { userId: auth.userId, planId, reference },
    });
    if (result.count === 0) {
      return apiError({ error: 'Not found', status: 404 });
    }
    return apiSuccess({ data: { deleted: true } });
  } catch (err) {
    log.warn('delete failed:', err);
    return apiError({ error: 'Failed to delete reading progress', status: 500 });
  }
}
