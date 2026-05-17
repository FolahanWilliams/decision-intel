/**
 * GET /api/analytics/roi — the persistent per-org ROI surface
 * (core-flow friction audit #2, locked 2026-05-17).
 *
 * The retention/moat thesis is "embeddedness with MEASURABLE ROI" and
 * Phase-1 graduation is scored on the pilot seeing it. The 2026-05-17
 * audit found the product had NO live ROI surface (DiscoveryGradeImpact
 * was dead code; analytics rendered metrics, never a value narrative).
 *
 * This route is single-responsibility and CONSUMES the canonical
 * computations — it never re-implements them:
 *   • value-at-stake: the day-1, non-outcome-gated `ticket × failRate`
 *     aggregate via the decision-roi SSOT (the founder constraint —
 *     real value with zero longitudinal data).
 *   • getQuarterlyImpact (outcome-scoring.ts) — same canonical the
 *     Flywheel route calls; consumed verbatim.
 *   • getOrgBrierStats (brier-scoring.ts) vs PLATFORM_BASELINE_SNAPSHOT
 *     — staged with honest sparse bands by buildOrgRoiSummary.
 *
 * Auth + org-resolve mirror /api/outcomes/flywheel verbatim.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getQuarterlyImpact } from '@/lib/learning/outcome-scoring';
import { getOrgBrierStats } from '@/lib/learning/brier-scoring';
import { PLATFORM_BASELINE_SNAPSHOT } from '@/lib/learning/platform-baseline-snapshot';
import {
  computeValueAtStake,
  buildOrgRoiSummary,
  type DecisionRoiInput,
} from '@/lib/learning/decision-roi';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('AnalyticsRoiAPI');

/** Bound the value-at-stake scan — Phase-1 scale never has many active
 *  containers; the cap guards pathological growth, not normal load. */
const MAX_CONTAINERS = 200;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve org context (mirrors /api/outcomes/flywheel verbatim).
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // @schema-drift-tolerant — TeamMember may be unmigrated on legacy envs.
    }

    // ── Day-1 value-at-stake: the org's audited decisions that carry a
    // ticket size + a flagged pattern with a historical cohort. Queried
    // via the join model (the established pattern); grouped per
    // container in code so we pick the single top toxic-combination.
    const roiInputs: DecisionRoiInput[] = [];
    try {
      const rows = await prisma.decisionContainerDocument.findMany({
        where: {
          container: {
            status: 'active',
            ticketSize: { not: null },
            OR: [{ orgId: orgId ?? undefined }, { ownerUserId: user.id }],
          },
        },
        select: {
          containerId: true,
          container: { select: { name: true, ticketSize: true, currency: true } },
          document: {
            select: {
              analyses: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  toxicCombinations: {
                    orderBy: { toxicScore: 'desc' },
                    select: {
                      patternLabel: true,
                      historicalFailRate: true,
                      sampleSize: true,
                      toxicScore: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: MAX_CONTAINERS * 8, // a container can have multiple member docs
      });

      // Group by container; the top pattern is the highest-toxicScore
      // combination across the container's member docs' latest analyses
      // that carries a historical cohort.
      const byContainer = new Map<
        string,
        {
          name: string;
          ticketSize: number | null;
          currency: string;
          top: { label: string; failRate: number; sample: number; score: number } | null;
        }
      >();

      for (const r of rows) {
        let entry = byContainer.get(r.containerId);
        if (!entry) {
          entry = {
            name: r.container.name,
            ticketSize: r.container.ticketSize != null ? Number(r.container.ticketSize) : null,
            currency: r.container.currency || 'USD',
            top: null,
          };
          byContainer.set(r.containerId, entry);
        }
        const combos = r.document.analyses[0]?.toxicCombinations ?? [];
        for (const c of combos) {
          if (
            typeof c.historicalFailRate !== 'number' ||
            c.historicalFailRate <= 0 ||
            c.sampleSize <= 0 ||
            !c.patternLabel
          ) {
            continue;
          }
          if (!entry.top || c.toxicScore > entry.top.score) {
            entry.top = {
              label: c.patternLabel,
              failRate: c.historicalFailRate,
              sample: c.sampleSize,
              score: c.toxicScore,
            };
          }
        }
      }

      for (const e of byContainer.values()) {
        roiInputs.push({
          name: e.name,
          ticketSize: e.ticketSize,
          currency: e.currency,
          topPatternFailRate: e.top?.failRate ?? null,
          topPatternLabel: e.top?.label ?? null,
          cohortSampleSize: e.top?.sample ?? null,
        });
      }
    } catch (err) {
      // @schema-drift-tolerant — DecisionContainer / ToxicCombination may
      // be unmigrated. computeValueAtStake handles the empty case
      // honestly (shows the "add ticket sizes" nudge), so degrade
      // rather than 500.
      log.warn('value-at-stake query failed (degrading to empty):', String(err));
    }

    const valueAtStake = computeValueAtStake(roiInputs);

    // ── Canonical longitudinal pieces — consumed, never recomputed.
    const quarterly = await getQuarterlyImpact(orgId, user.id);

    let brier = { count: 0, avg: 0 };
    if (orgId) {
      try {
        const stats = await getOrgBrierStats(prisma, orgId);
        brier = { count: stats.count, avg: stats.avg };
      } catch (err) {
        // @schema-drift-tolerant — brierScore column may be unmigrated.
        log.warn('org Brier stats failed (calibration shows unlocks state):', String(err));
      }
    }

    const summary = buildOrgRoiSummary({
      valueAtStake,
      quarterly: {
        estimatedSavings: quarterly.estimatedSavings,
        currency: quarterly.currency,
        improvedDecisions: quarterly.improvedDecisions,
        totalDecisions: quarterly.totalDecisions,
      },
      brier,
      baselineBrier: PLATFORM_BASELINE_SNAPSHOT.meanBrier,
    });

    return NextResponse.json(summary);
  } catch (error) {
    log.error('Analytics ROI API failed:', error);
    return NextResponse.json({ error: 'Failed to load ROI summary' }, { status: 500 });
  }
}
