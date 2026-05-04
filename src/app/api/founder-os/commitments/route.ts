/**
 * Founder OS commitment API — the "physical record" the founder comes
 * back to when feeling unmotivated.
 *
 * GET /api/founder-os/commitments
 *   Returns all commitments, newest first.
 *
 * POST /api/founder-os/commitments
 *   Body: { text, title? }
 *   Creates a new commitment. Multiple commitments allowed (one at first
 *   sign-up; more added over time as discipline deepens).
 *
 * DELETE /api/founder-os/commitments?id=...
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FounderOsCommitments');

export const dynamic = 'force-dynamic';

interface PostBody {
  text?: string;
  title?: string;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  try {
    const commitments = await prisma.founderOsCommitment.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return apiSuccess({ data: { commitments } });
  } catch (err) {
    log.warn('list failed:', err);
    return apiSuccess({ data: { commitments: [] } });
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

  if (!body.text?.trim()) {
    return apiError({ error: 'text required', status: 400 });
  }

  try {
    const commitment = await prisma.founderOsCommitment.create({
      data: {
        userId: auth.userId,
        text: body.text.trim().slice(0, 4000),
        title: body.title?.trim().slice(0, 200) ?? null,
      },
    });
    return apiSuccess({ data: { commitment } });
  } catch (err) {
    log.warn('create failed:', err);
    return apiError({ error: 'Failed to save commitment', status: 500 });
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
    const result = await prisma.founderOsCommitment.deleteMany({
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
