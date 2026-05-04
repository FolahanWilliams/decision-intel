/**
 * Founder OS long-form content log API.
 *
 * GET /api/founder-os/content-log?limit=50
 *   Returns recent long-form pieces with active-recall summaries (default
 *   50; max 200). Sorted by capturedAt desc.
 *
 * POST /api/founder-os/content-log
 *   Body: { title, source, durationMin, activeRecallSummary }
 *   Creates a new content-log entry. Active-recall summary is required —
 *   no passive logging.
 *
 * DELETE /api/founder-os/content-log?id=...
 *   Deletes a single entry (owner-scoped).
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FounderOsContentLog');

export const dynamic = 'force-dynamic';

const ALLOWED_SOURCES = new Set([
  'YouTube',
  'Book',
  'Paper',
  'Podcast',
  'Long-form article',
  'Other',
]);

interface PostBody {
  title?: string;
  source?: string;
  durationMin?: number;
  activeRecallSummary?: string;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 1), 200);

  try {
    const items = await prisma.founderOsContentLog.findMany({
      where: { userId: auth.userId },
      orderBy: { capturedAt: 'desc' },
      take: limit,
    });
    return apiSuccess({ data: { items } });
  } catch (err) {
    log.warn('list failed:', err);
    return apiSuccess({ data: { items: [] } });
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

  if (!body.title?.trim() || body.title.length > 500) {
    return apiError({ error: 'title required (≤500 chars)', status: 400 });
  }
  if (!body.activeRecallSummary?.trim()) {
    return apiError({ error: 'activeRecallSummary required (write from memory, no peeking)', status: 400 });
  }
  if (!body.source || !ALLOWED_SOURCES.has(body.source)) {
    return apiError({
      error: 'source must be one of: YouTube, Book, Paper, Podcast, Long-form article, Other',
      status: 400,
    });
  }
  const durationMin =
    typeof body.durationMin === 'number' && body.durationMin >= 1 && body.durationMin <= 1000
      ? Math.round(body.durationMin)
      : 30;

  try {
    const item = await prisma.founderOsContentLog.create({
      data: {
        userId: auth.userId,
        title: body.title.trim().slice(0, 500),
        source: body.source,
        durationMin,
        activeRecallSummary: body.activeRecallSummary.trim().slice(0, 4000),
      },
    });
    return apiSuccess({ data: { item } });
  } catch (err) {
    log.warn('create failed:', err);
    return apiError({ error: 'Failed to save content log entry', status: 500 });
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
    // updateMany predicate prevents owner-tampering — if userId doesn't
    // match the row, delete is a no-op rather than a 404 disclosure.
    const result = await prisma.founderOsContentLog.deleteMany({
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
