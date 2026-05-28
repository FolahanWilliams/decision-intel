/**
 * Faith OS prayer + reflection journal API (2026-05-28).
 *
 * GET    /api/founder-os/prayer-journal?kind=supplication&answered=false&limit=100
 *   Lists the founder's journal entries, newest first. Optional filters:
 *   `kind` (adoration|confession|thanksgiving|supplication|reflection),
 *   `answered` (true|false — only meaningful for supplication).
 *
 * POST   /api/founder-os/prayer-journal
 *   Body: { kind, body, title?, scriptureRef? } → creates an entry.
 *
 * PATCH  /api/founder-os/prayer-journal
 *   Body: { id, body?, title?, scriptureRef?, answered?, answeredNote? }
 *   Edits an entry. When `answered` flips true, stamps answeredAt; when it
 *   flips false, clears answeredAt + answeredNote.
 *
 * DELETE /api/founder-os/prayer-journal?id=...
 *
 * Dual-gated by founder pass + Supabase user.id, same as every founder-os
 * route. The journal is identity-grounding, never a success metric.
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FounderOsPrayerJournal');

export const dynamic = 'force-dynamic';

const KINDS = new Set(['adoration', 'confession', 'thanksgiving', 'supplication', 'reflection']);

interface PostBody {
  kind?: string;
  title?: string;
  body?: string;
  scriptureRef?: string;
}

interface PatchBody {
  id?: string;
  title?: string;
  body?: string;
  scriptureRef?: string;
  answered?: boolean;
  answeredNote?: string;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get('kind');
  const answeredParam = url.searchParams.get('answered');
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get('limit') ?? '200', 10) || 200, 1),
    500
  );

  const where: { userId: string; kind?: string; answered?: boolean } = { userId: auth.userId };
  if (kind && KINDS.has(kind)) where.kind = kind;
  if (answeredParam === 'true') where.answered = true;
  if (answeredParam === 'false') where.answered = false;

  try {
    const entries = await prisma.founderOsPrayerJournal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return apiSuccess({ data: { entries } });
  } catch (err) {
    // @schema-drift-tolerant — pre-migration envs return empty rather than 500.
    log.warn('list failed:', err);
    return apiSuccess({ data: { entries: [] } });
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

  const kind = typeof body.kind === 'string' && KINDS.has(body.kind) ? body.kind : 'reflection';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (text.length < 1) {
    return apiError({ error: 'body required', status: 400 });
  }
  const title =
    typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 300) : null;
  const scriptureRef =
    typeof body.scriptureRef === 'string' && body.scriptureRef.trim()
      ? body.scriptureRef.trim().slice(0, 120)
      : null;

  try {
    const entry = await prisma.founderOsPrayerJournal.create({
      data: {
        userId: auth.userId,
        kind,
        title,
        body: text.slice(0, 8000),
        scriptureRef,
      },
    });
    return apiSuccess({ data: { entry } });
  } catch (err) {
    log.warn('create failed:', err);
    return apiError({ error: 'Failed to save journal entry', status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }

  if (!body.id || typeof body.id !== 'string') {
    return apiError({ error: 'id required', status: 400 });
  }

  // Ownership check before mutating — never trust the id alone.
  let existing: { id: string } | null;
  try {
    existing = await prisma.founderOsPrayerJournal.findFirst({
      where: { id: body.id, userId: auth.userId },
      select: { id: true },
    });
  } catch (err) {
    log.warn('ownership lookup failed:', err);
    return apiError({ error: 'Could not verify entry. Please retry.', status: 503 });
  }
  if (!existing) {
    return apiError({ error: 'Not found', status: 404 });
  }

  const data: {
    title?: string | null;
    body?: string;
    scriptureRef?: string | null;
    answered?: boolean;
    answeredNote?: string | null;
    answeredAt?: Date | null;
  } = {};

  if (typeof body.title === 'string') data.title = body.title.trim().slice(0, 300) || null;
  if (typeof body.body === 'string' && body.body.trim().length >= 1)
    data.body = body.body.trim().slice(0, 8000);
  if (typeof body.scriptureRef === 'string')
    data.scriptureRef = body.scriptureRef.trim().slice(0, 120) || null;
  if (typeof body.answered === 'boolean') {
    data.answered = body.answered;
    if (body.answered) {
      data.answeredAt = new Date();
      if (typeof body.answeredNote === 'string')
        data.answeredNote = body.answeredNote.slice(0, 8000) || null;
    } else {
      data.answeredAt = null;
      data.answeredNote = null;
    }
  } else if (typeof body.answeredNote === 'string') {
    data.answeredNote = body.answeredNote.slice(0, 8000) || null;
  }

  try {
    const entry = await prisma.founderOsPrayerJournal.update({
      where: { id: body.id },
      data,
    });
    return apiSuccess({ data: { entry } });
  } catch (err) {
    log.warn('update failed:', err);
    return apiError({ error: 'Failed to update journal entry', status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return apiError({ error: 'id required', status: 400 });
  }

  try {
    // deleteMany scoped to userId so a stranger's id can never match.
    const result = await prisma.founderOsPrayerJournal.deleteMany({
      where: { id, userId: auth.userId },
    });
    if (result.count === 0) {
      return apiError({ error: 'Not found', status: 404 });
    }
    return apiSuccess({ data: { deleted: true } });
  } catch (err) {
    log.warn('delete failed:', err);
    return apiError({ error: 'Failed to delete journal entry', status: 500 });
  }
}
