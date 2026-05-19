/**
 * GET /api/founder-hub/non-wedge-roles
 *
 * Returns the aggregation of self-described roles from non-wedge (Other)
 * sign-ups — the discovery signal the access amendment (2026-05-19,
 * commit 1fd98ce9) enabled. Now that non-wedge founders get full access
 * with the generic overview, every "Other" sign-up captures an optional
 * `phase1PersonaRoleDetail` free-text. This endpoint surfaces:
 *
 *  - totalNonWedge          — count of UserSettings with phase1HxcEligible=false
 *  - withRoleDetail         — count of those who filled in the optional role
 *  - topRoles               — top 10 self-described roles by frequency
 *                             (lowercased + trimmed dedup; non-empty only)
 *  - recent                 — last 20 non-wedge sign-ups with role + date
 *
 * Why this matters (per the access-amendment lock + the v3.5 PMF discipline):
 * if 50 "Other" founders sign up and 15 say "VC associate", that is a real
 * persona-expansion signal. Without surfacing it, the data sits in the
 * database invisible. With it, the founder can spot the somewhat-disappointed
 * cohort that v3.5 §3 mitigation #1 calls out (the product-discovery sprint
 * cohort).
 *
 * Auth: founder-pass header (mirrors /api/founder-hub/metrics).
 * Schema-drift tolerant: returns empty payload on P2021/P2022.
 */

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

const log = createLogger('NonWedgeRoles');

const FOUNDER_PASS_HEADER = 'x-founder-pass';

interface NonWedgeRolesResponse {
  totalNonWedge: number;
  withRoleDetail: number;
  /** Top self-described roles by frequency, lowercased+trimmed for grouping. */
  topRoles: Array<{ role: string; count: number }>;
  /** Recent non-wedge sign-ups (last 20). role is the raw string or null. */
  recent: Array<{ role: string | null; signedUpAt: string }>;
}

const EMPTY_RESPONSE: NonWedgeRolesResponse = {
  totalNonWedge: 0,
  withRoleDetail: 0,
  topRoles: [],
  recent: [],
};

export async function GET(req: NextRequest) {
  const auth = verifyFounderPass(req.headers.get(FOUNDER_PASS_HEADER));
  if (!auth.ok) {
    return apiError({
      error: auth.reason === 'not_configured' ? 'Founder pass not configured' : 'Unauthorized',
      status: auth.reason === 'not_configured' ? 503 : 401,
    });
  }

  try {
    // Use phase1HxcEligible:false as the filter (more future-proof than
    // phase1Persona='other' — if a 6th non-HXC persona id is added later,
    // this still catches it). The flag is derived server-side from the
    // persona via isHxcEligible() in /api/onboarding so the data shape is
    // already correct for everyone signed up post-2026-05-04.
    const nonWedge = await prisma.userSettings.findMany({
      where: { phase1HxcEligible: false },
      select: {
        phase1Persona: true,
        phase1PersonaRoleDetail: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const withRoleDetail = nonWedge.filter(
      u => u.phase1PersonaRoleDetail && u.phase1PersonaRoleDetail.trim().length > 0
    );

    // Aggregate by lowercased+trimmed role text for grouping.
    const counts = new Map<string, { displayRole: string; count: number }>();
    for (const u of withRoleDetail) {
      const raw = (u.phase1PersonaRoleDetail ?? '').trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { displayRole: raw, count: 1 });
    }
    const topRoles = Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(({ displayRole, count }) => ({ role: displayRole, count }));

    const recent = nonWedge.slice(0, 20).map(u => ({
      role: u.phase1PersonaRoleDetail?.trim() || null,
      signedUpAt: u.createdAt.toISOString(),
    }));

    const payload: NonWedgeRolesResponse = {
      totalNonWedge: nonWedge.length,
      withRoleDetail: withRoleDetail.length,
      topRoles,
      recent,
    };

    return apiSuccess({ data: payload });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      // @schema-drift-tolerant — pre-v3.5 envs without phase1HxcEligible column
      return apiSuccess({ data: EMPTY_RESPONSE });
    }
    log.error('Failed to fetch non-wedge roles', err);
    return apiError({ error: 'Failed to fetch non-wedge roles', status: 500 });
  }
}
