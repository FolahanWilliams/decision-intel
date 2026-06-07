/**
 * SAT Prep — settings (test dates for the countdown). Founder-private.
 *
 * GET  /api/founder-os/sat/settings              → { settings | null }
 * POST { benchmarkTestDate?, targetTestDate? }   → upsert (YYYY-MM-DD or null to clear)
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SatSettings');

export const dynamic = 'force-dynamic';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

function cleanDate(v: unknown): string | null {
  return typeof v === 'string' && DATE_RX.test(v) ? v : null;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }
  try {
    const settings = await prisma.satSettings.findUnique({ where: { userId: auth.userId } });
    return apiSuccess({ data: { settings } });
  } catch (err) {
    log.warn('get failed:', err);
    return apiSuccess({ data: { settings: null } });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }
  let body: { benchmarkTestDate?: string | null; targetTestDate?: string | null };
  try {
    body = await request.json();
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }
  const benchmarkTestDate = body.benchmarkTestDate === null ? null : cleanDate(body.benchmarkTestDate);
  const targetTestDate = body.targetTestDate === null ? null : cleanDate(body.targetTestDate);

  try {
    const settings = await prisma.satSettings.upsert({
      where: { userId: auth.userId },
      create: { userId: auth.userId, benchmarkTestDate, targetTestDate },
      update: {
        ...(body.benchmarkTestDate !== undefined ? { benchmarkTestDate } : {}),
        ...(body.targetTestDate !== undefined ? { targetTestDate } : {}),
      },
    });
    return apiSuccess({ data: { settings } });
  } catch (err) {
    log.warn('upsert failed:', err);
    return apiError({ error: 'Failed to save settings', status: 500 });
  }
}
