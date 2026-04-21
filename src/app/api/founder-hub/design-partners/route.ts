/**
 * GET  /api/founder-hub/design-partners  — list applications (optional status filter)
 *
 * Auth: x-founder-pass header.
 *
 * Returns a lightweight shape tuned for the Founder Hub triage UI. Also
 * returns a `capacity` object so the UI can render the "3 of 5 seats
 * filled" strip without a second roundtrip.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

const log = createLogger('FounderDesignPartners');

const MAX_SEATS = 5;

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

export async function GET(req: NextRequest) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status');

  try {
    const where = statusFilter ? { status: statusFilter } : {};
    const [applications, acceptedCount] = await Promise.all([
      prisma.designPartnerApplication.findMany({
        where,
        orderBy: [{ submittedAt: 'desc' }],
      }),
      prisma.designPartnerApplication.count({ where: { status: 'accepted' } }),
    ]);

    return apiSuccess({
      data: {
        applications,
        capacity: {
          filled: acceptedCount,
          total: MAX_SEATS,
          open: Math.max(0, MAX_SEATS - acceptedCount),
        },
      },
    });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      return apiSuccess({
        data: {
          applications: [],
          capacity: { filled: 0, total: MAX_SEATS, open: MAX_SEATS },
        },
      });
    }
    log.error('Failed to list design partner applications:', err);
    return apiError({ error: 'Failed to load applications', status: 500 });
  }
}
