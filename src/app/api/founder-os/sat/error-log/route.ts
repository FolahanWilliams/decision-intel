/**
 * SAT Prep — error log API (founder-private).
 *
 * The heart of the surface: one row per attempted/missed question worth
 * analysing. Confidence (0-3, tagged before answering) × wasCorrect feeds the
 * Brier calibration loop; section/skill feed weak-area weighting; rootCause
 * routes the fix. `source` distinguishes in-app AI drills from official-test
 * misses — both feed analysis, but only SatTestResult feeds the projected score.
 *
 * GET    /api/founder-os/sat/error-log?days=120  → entries (default 120, max 400)
 * POST   { date, section, skill, wasCorrect, rootCause?, confidence?, note?, source? }
 * PATCH  { id, rootCause?, confidence?, note?, wasCorrect? }
 * DELETE ?id=...
 *
 * Founder-scoped, partitioned by Supabase user.id. No audit logging — same as
 * every other /api/founder-os/* route.
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { SAT_ROOT_CAUSE_IDS } from '@/components/founder-hub/sat/sat-content';

const log = createLogger('SatErrorLog');

export const dynamic = 'force-dynamic';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const SECTIONS = new Set(['rw', 'math']);
const SOURCES = new Set(['daily_drill', 'official_test', 'review']);

interface PostBody {
  date?: string;
  section?: string;
  skill?: string;
  wasCorrect?: boolean;
  rootCause?: string | null;
  confidence?: number | null;
  note?: string | null;
  source?: string;
}

interface PatchBody {
  id?: string;
  rootCause?: string | null;
  confidence?: number | null;
  note?: string | null;
  wasCorrect?: boolean;
}

function cleanConfidence(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  if (!Number.isFinite(n) || n < 0 || n > 3) return null;
  return Math.round(n);
}
function cleanRootCause(v: unknown): string | null {
  return typeof v === 'string' && SAT_ROOT_CAUSE_IDS.includes(v as never) ? v : null;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }
  const url = new URL(request.url);
  const days = Math.min(
    Math.max(parseInt(url.searchParams.get('days') ?? '120', 10) || 120, 7),
    400
  );
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  try {
    const entries = await prisma.satErrorLogEntry.findMany({
      where: { userId: auth.userId, date: { gte: cutoff } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return apiSuccess({ data: { entries } });
  } catch (err) {
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
  const date = typeof body.date === 'string' && DATE_RX.test(body.date) ? body.date : null;
  if (!date) return apiError({ error: 'date (YYYY-MM-DD) required', status: 400 });
  if (!body.section || !SECTIONS.has(body.section)) {
    return apiError({ error: "section must be 'rw' or 'math'", status: 400 });
  }
  const skill = typeof body.skill === 'string' ? body.skill.trim().slice(0, 60) : '';
  if (!skill) return apiError({ error: 'skill required', status: 400 });
  if (typeof body.wasCorrect !== 'boolean') {
    return apiError({ error: 'wasCorrect (boolean) required', status: 400 });
  }
  const source =
    typeof body.source === 'string' && SOURCES.has(body.source) ? body.source : 'daily_drill';
  const note =
    typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 2000) : null;

  try {
    const created = await prisma.satErrorLogEntry.create({
      data: {
        userId: auth.userId,
        date,
        section: body.section,
        skill,
        wasCorrect: body.wasCorrect,
        rootCause: cleanRootCause(body.rootCause),
        confidence: cleanConfidence(body.confidence),
        note,
        source,
      },
    });
    return apiSuccess({ data: { entry: created } });
  } catch (err) {
    log.warn('create failed:', err);
    return apiError({ error: 'Failed to log entry', status: 500 });
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
  try {
    const existing = await prisma.satErrorLogEntry.findUnique({ where: { id: body.id } });
    if (!existing || existing.userId !== auth.userId) {
      return apiError({ error: 'Not found', status: 404 });
    }
    const data: Record<string, unknown> = {};
    if (body.rootCause !== undefined) data.rootCause = cleanRootCause(body.rootCause);
    if (body.confidence !== undefined) data.confidence = cleanConfidence(body.confidence);
    if (body.note !== undefined) {
      data.note =
        typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 2000) : null;
    }
    if (typeof body.wasCorrect === 'boolean') data.wasCorrect = body.wasCorrect;
    const entry = await prisma.satErrorLogEntry.update({ where: { id: existing.id }, data });
    return apiSuccess({ data: { entry } });
  } catch (err) {
    log.warn('update failed:', err);
    return apiError({ error: 'Failed to update entry', status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return apiError({ error: 'id required', status: 400 });
  try {
    await prisma.satErrorLogEntry.deleteMany({ where: { id, userId: auth.userId } });
    return apiSuccess({ data: { deleted: true } });
  } catch (err) {
    log.warn('delete failed:', err);
    return apiError({ error: 'Failed to delete entry', status: 500 });
  }
}
