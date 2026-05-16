/**
 * GET /api/founder-hub/outreach/intel-brief
 *
 * Returns the most recent nightly Outreach Intelligence Brief for the
 * Founder Hub Outreach Hub panel. Read-only; the brief is written by
 * the /api/cron/outreach-intel sub-job.
 *
 * Auth: x-founder-pass header.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass as checkFounderPass } from '@/lib/utils/founder-auth';
import type { OutreachIntelItem } from '@/lib/outreach/intel-brief';
import type { OutreachShortlistEntry } from '@/lib/outreach/prospect-shortlist';

const log = createLogger('OutreachIntelBriefRead');

function verifyFounderPass(req: NextRequest): boolean {
  return checkFounderPass(req.headers.get('x-founder-pass')).ok;
}

export interface OutreachIntelBriefResponse {
  briefDate: string;
  summary: string;
  items: OutreachIntelItem[];
  shortlist: OutreachShortlistEntry[];
  articleCount: number;
  generatedAt: string;
}

export async function GET(req: NextRequest) {
  if (!verifyFounderPass(req)) {
    return apiError({ error: 'Unauthorized', status: 401 });
  }

  try {
    const row = await prisma.outreachIntelBrief
      .findFirst({
        where: { status: 'active' },
        orderBy: { briefDate: 'desc' },
      })
      .catch(() => null); // @schema-drift-tolerant — pre-migration envs return null; panel shows the empty state

    if (!row) {
      return apiSuccess({ data: null });
    }

    const data: OutreachIntelBriefResponse = {
      briefDate: row.briefDate,
      summary: row.summary,
      // Written by our own cron — safe to cast out of the JsonValue
      // (same read-side detail-vs-list cast discipline used across the
      // codebase; the write path is the type-of-record guarantee).
      items: (row.items as unknown as OutreachIntelItem[]) ?? [],
      shortlist: (row.shortlist as unknown as OutreachShortlistEntry[]) ?? [],
      articleCount: row.articleCount,
      generatedAt: row.createdAt.toISOString(),
    };

    return apiSuccess({ data });
  } catch (err) {
    log.error('Failed to read outreach intel brief', err);
    return apiError({ error: 'Failed to load brief', status: 500 });
  }
}
