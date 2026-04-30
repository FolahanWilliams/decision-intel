/**
 * GET /api/intelligence/org-calibration
 *
 * Returns the calling user's org calibration summary — the same shape
 * the DPR cover renders, sourced from `buildOrgCalibration` in
 * `src/lib/reports/provenance-record-data.ts`. Single source of truth:
 * if the org has ≥1 closed outcome, returns per-org Brier stats; else
 * falls back to the platform seed baseline (143-case library).
 *
 * Surfaces consuming this endpoint:
 *   - DealCalibrationChip (B5 lock 2026-04-30) — shows the org's Brier
 *     + delta-vs-seed below the composite Deal DQI on /dashboard/deals/[id].
 *
 * Authentication: requires Supabase session. Personal accounts (no
 * TeamMember row) get the platform-seed fallback so the chip still
 * renders honest evidence.
 *
 * Cache: not cached. Per-org Brier mutates whenever an outcome lands;
 * the endpoint is cheap (one indexed Prisma aggregate).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';
import { buildOrgCalibration } from '@/lib/reports/provenance-record-data';
import { computePlatformCalibrationBaseline } from '@/lib/learning/platform-baseline';

const log = createLogger('OrgCalibrationRoute');

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let orgId: string | null = null;
    try {
      const member = await prisma.teamMember.findFirst({
        where: { userId },
        select: { orgId: true },
      });
      orgId = member?.orgId ?? null;
    } catch (err) {
      if (!isSchemaDrift(err)) {
        log.warn('TeamMember lookup failed; falling back to platform seed:', err);
      }
      orgId = null;
    }

    // buildOrgCalibration handles both branches: orgId resolves → org
    // Brier; null or zero outcomes → platform_seed fallback. The
    // recalibratedDqi argument is per-analysis state and irrelevant for
    // a deal-level chip — pass null to defeat that branch.
    const calibration = await buildOrgCalibration(orgId, null);

    // Compute delta-vs-seed when source is 'org'. Lets the chip render
    // "Brier 0.234 (was 0.258 seed) · improving by 0.024" — Margaret
    // procurement ask: see the trajectory, not just the snapshot.
    let deltaFromSeed: number | null = null;
    if (calibration?.source === 'org' && calibration.meanBrierScore !== null) {
      const seed = computePlatformCalibrationBaseline();
      // Lower Brier = better calibration; positive delta = improvement.
      deltaFromSeed = Math.round((seed.meanBrier - calibration.meanBrierScore) * 1000) / 1000;
    }

    return NextResponse.json({
      calibration,
      deltaFromSeed,
    });
  } catch (err) {
    log.error('org-calibration endpoint failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
