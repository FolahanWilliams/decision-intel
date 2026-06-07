/**
 * SAT Prep — official test result API (founder-private).
 *
 * The ONLY source of the projected score: real Bluebook/Khan/released/real-SAT
 * scores on the 200-800 scale. Never the in-app AI questions (off-distribution
 * at the 1550 ceiling). The Progress dashboard reads exclusively from here.
 *
 * GET    /api/founder-os/sat/tests  → results (most recent first)
 * POST   { date, source?, section?, rwScore?, mathScore?, rwCorrect?, rwTotal?,
 *          mathCorrect?, mathTotal?, durationMin?, notes? }
 * DELETE ?id=...
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SatTests');

export const dynamic = 'force-dynamic';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const SOURCES = new Set(['bluebook', 'khan', 'released', 'real_sat']);
const SECTIONS = new Set(['full', 'rw', 'math']);

interface PostBody {
  date?: string;
  source?: string;
  section?: string;
  rwScore?: number | null;
  mathScore?: number | null;
  rwCorrect?: number | null;
  rwTotal?: number | null;
  mathCorrect?: number | null;
  mathTotal?: number | null;
  durationMin?: number | null;
  notes?: string | null;
}

/** SAT section scores are 200-800 in steps of 10. */
function cleanScore(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  if (!Number.isFinite(n)) return null;
  const clamped = Math.min(800, Math.max(200, n));
  return Math.round(clamped / 10) * 10;
}
function cleanCount(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }
  try {
    const tests = await prisma.satTestResult.findMany({
      where: { userId: auth.userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
    return apiSuccess({ data: { tests } });
  } catch (err) {
    log.warn('list failed:', err);
    return apiSuccess({ data: { tests: [] } });
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

  const source =
    typeof body.source === 'string' && SOURCES.has(body.source) ? body.source : 'bluebook';
  const section =
    typeof body.section === 'string' && SECTIONS.has(body.section) ? body.section : 'full';
  const rwScore = cleanScore(body.rwScore);
  const mathScore = cleanScore(body.mathScore);
  if (rwScore === null && mathScore === null) {
    return apiError({ error: 'at least one of rwScore / mathScore required', status: 400 });
  }
  const totalScore = rwScore !== null && mathScore !== null ? rwScore + mathScore : null;
  const notes =
    typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim().slice(0, 2000) : null;

  try {
    const test = await prisma.satTestResult.create({
      data: {
        userId: auth.userId,
        date,
        source,
        section,
        rwScore,
        mathScore,
        totalScore,
        rwCorrect: cleanCount(body.rwCorrect),
        rwTotal: cleanCount(body.rwTotal),
        mathCorrect: cleanCount(body.mathCorrect),
        mathTotal: cleanCount(body.mathTotal),
        durationMin: cleanCount(body.durationMin),
        notes,
      },
    });
    return apiSuccess({ data: { test } });
  } catch (err) {
    log.warn('create failed:', err);
    return apiError({ error: 'Failed to log test', status: 500 });
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
    await prisma.satTestResult.deleteMany({ where: { id, userId: auth.userId } });
    return apiSuccess({ data: { deleted: true } });
  } catch (err) {
    log.warn('delete failed:', err);
    return apiError({ error: 'Failed to delete test', status: 500 });
  }
}
