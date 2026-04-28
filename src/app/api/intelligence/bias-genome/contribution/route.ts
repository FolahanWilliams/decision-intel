/**
 * GET /api/intelligence/bias-genome/contribution
 *
 * Returns the requesting user's org-specific contribution to the Bias
 * Genome — pairs contributed, top biases the org has flagged, plus
 * global cohort context (totalOrgs in genome, totalDecisions). Used by
 * the BiasGenomeContributionCard on /dashboard/analytics to make the
 * data network effect VISIBLE to contributors (CLAUDE.md "Bias Genome
 * Contribution visibility" deferred follow-up — A3 Tier 2 ship).
 *
 * Privacy posture: only orgs with `Organization.isAnonymized = true`
 * (consent flag) appear in cohort metrics. If the requesting user's
 * org is not consenting, we still surface their own contribution
 * count + top biases (these are their data, returned to them) but
 * the cohort percentile is suppressed.
 *
 * Cache: per-user 5-minute window. The genome rebuilds on a slower
 * cadence; per-user data changes when outcomes are logged or new
 * audits land. SWR consumer can override via mutate after either.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';
import { computeBiasGenome } from '@/lib/learning/bias-genome';

const log = createLogger('BiasGenomeContributionRoute');

interface ContributionResponse {
  // Per-org contribution
  orgId: string | null;
  isAnonymized: boolean;
  pairsContributed: number;
  outcomeValidatedAnalysesCount: number;
  /**
   * Count of DISTINCT bias types this org has contributed
   * outcome-validated signal on. Differs from topContributedBiases
   * which is capped at 5 — this is the full cardinality (D2 lock
   * 2026-04-28). Surfaced as "you've sharpened detection on N cross-org
   * bias patterns" so the contributor sees the breadth of the network
   * effect they're funding, not just the top entries.
   */
  distinctBiasTypesContributed: number;
  topContributedBiases: Array<{
    biasType: string;
    count: number;
    confirmedCount: number;
  }>;

  // Cohort context (from existing genome aggregate)
  cohortTotalOrgs: number;
  cohortTotalDecisions: number;
  /**
   * Optional cohort percentile — only surfaced when the user's org has
   * isAnonymized=true (i.e. they consented to be IN the cohort, so it's
   * fair to compare them against it). Null otherwise. 0-100; 100 = top.
   */
  cohortPercentile: number | null;

  /** ISO timestamp the data was computed; client uses this for freshness UI. */
  computedAt: string;
}

const EMPTY_NON_AUTHED: Pick<
  ContributionResponse,
  'orgId' | 'isAnonymized' | 'distinctBiasTypesContributed'
> = {
  orgId: null,
  isAnonymized: false,
  distinctBiasTypesContributed: 0,
};

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

    // 1. Resolve user → orgId. Personal accounts (no org membership) get
    //    a permissive empty response; the panel hides itself in that case.
    let orgId: string | null = null;
    let isAnonymized = false;
    try {
      const member = await prisma.teamMember.findFirst({
        where: { userId },
        select: {
          orgId: true,
          organization: {
            select: { isAnonymized: true } as Record<string, unknown>,
          },
        },
      });
      orgId = member?.orgId ?? null;
      // The select shape with a custom field cast may return undefined here.
      isAnonymized = Boolean(
        (member?.organization as { isAnonymized?: boolean } | undefined)?.isAnonymized
      );
    } catch (err) {
      if (isSchemaDrift(err)) {
        log.debug('Schema drift on TeamMember/Organization — returning empty contribution');
        return NextResponse.json({
          ...EMPTY_NON_AUTHED,
          pairsContributed: 0,
          outcomeValidatedAnalysesCount: 0,
          topContributedBiases: [],
          cohortTotalOrgs: 0,
          cohortTotalDecisions: 0,
          cohortPercentile: null,
          computedAt: new Date().toISOString(),
        } satisfies ContributionResponse);
      }
      throw err;
    }

    // No org → no contribution to surface; panel hides itself.
    if (!orgId) {
      return NextResponse.json(
        {
          ...EMPTY_NON_AUTHED,
          pairsContributed: 0,
          outcomeValidatedAnalysesCount: 0,
          topContributedBiases: [],
          cohortTotalOrgs: 0,
          cohortTotalDecisions: 0,
          cohortPercentile: null,
          computedAt: new Date().toISOString(),
        } satisfies ContributionResponse,
        {
          headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
        }
      );
    }

    // 2. Org-own contribution metrics. Only counts BiasInstances on
    //    Analyses that have a logged outcome — that's the
    //    "outcome-validated" qualifier the panel surfaces.
    let pairsContributed = 0;
    let outcomeValidatedAnalysesCount = 0;
    let distinctBiasTypesContributed = 0;
    let topContributedBiases: ContributionResponse['topContributedBiases'] = [];

    try {
      const pairsRaw = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT (bi."analysisId", bi."biasType"))::bigint as count
        FROM "BiasInstance" bi
        JOIN "Analysis" a ON a.id = bi."analysisId"
        JOIN "Document" d ON d.id = a."documentId"
        JOIN "DecisionOutcome" do2 ON do2."analysisId" = a.id
        WHERE d."orgId" = ${orgId}
      `;
      pairsContributed = Number(pairsRaw[0]?.count ?? 0);

      const validatedRaw = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT a.id)::bigint as count
        FROM "Analysis" a
        JOIN "Document" d ON d.id = a."documentId"
        JOIN "DecisionOutcome" do2 ON do2."analysisId" = a.id
        WHERE d."orgId" = ${orgId}
      `;
      outcomeValidatedAnalysesCount = Number(validatedRaw[0]?.count ?? 0);

      const topRaw = await prisma.$queryRaw<
        Array<{ biasType: string; count: bigint; confirmed_count: bigint }>
      >`
        SELECT bi."biasType",
               COUNT(*)::bigint as count,
               COUNT(*) FILTER (
                 WHERE bi."biasType" = ANY(do2."confirmedBiases")
               )::bigint as confirmed_count
        FROM "BiasInstance" bi
        JOIN "Analysis" a ON a.id = bi."analysisId"
        JOIN "Document" d ON d.id = a."documentId"
        JOIN "DecisionOutcome" do2 ON do2."analysisId" = a.id
        WHERE d."orgId" = ${orgId}
        GROUP BY bi."biasType"
        ORDER BY count DESC
        LIMIT 5
      `;
      topContributedBiases = topRaw.map(r => ({
        biasType: r.biasType,
        count: Number(r.count),
        confirmedCount: Number(r.confirmed_count),
      }));

      const distinctRaw = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT bi."biasType")::bigint as count
        FROM "BiasInstance" bi
        JOIN "Analysis" a ON a.id = bi."analysisId"
        JOIN "Document" d ON d.id = a."documentId"
        JOIN "DecisionOutcome" do2 ON do2."analysisId" = a.id
        WHERE d."orgId" = ${orgId}
      `;
      distinctBiasTypesContributed = Number(distinctRaw[0]?.count ?? 0);
    } catch (err) {
      // P2021/P2022 → schema drift; surface empty contribution so the
      // dashboard doesn't break on partial migration states.
      if (isSchemaDrift(err)) {
        log.debug('Schema drift on contribution aggregation — empty contribution returned');
      } else {
        log.warn('Contribution aggregation failed:', err);
      }
    }

    // 3. Cohort context. Reuse computeBiasGenome — already returns
    //    totalOrgs + totalDecisions across consenting orgs. This is a
    //    moderately expensive aggregate; the route's cache header
    //    (5min private + SWR) keeps cost bounded per-user.
    let cohortTotalOrgs = 0;
    let cohortTotalDecisions = 0;
    let cohortPercentile: number | null = null;

    try {
      const genome = await computeBiasGenome();
      cohortTotalOrgs = genome.totalOrgs;
      cohortTotalDecisions = genome.totalDecisions;
    } catch (err) {
      if (!isSchemaDrift(err)) {
        log.warn('Cohort aggregation failed (non-fatal — surfacing empty cohort):', err);
      }
    }

    // 4. Cohort percentile — only when the user's org consented (fair
    //    apples-to-apples). Compares this org's pairsContributed against
    //    all other consenting orgs' pairsContributed.
    if (isAnonymized && pairsContributed > 0) {
      try {
        const ranked = await prisma.$queryRaw<Array<{ orgId: string; pairs: bigint }>>`
          SELECT d."orgId" as "orgId",
                 COUNT(DISTINCT (bi."analysisId", bi."biasType"))::bigint as pairs
          FROM "BiasInstance" bi
          JOIN "Analysis" a ON a.id = bi."analysisId"
          JOIN "Document" d ON d.id = a."documentId"
          JOIN "DecisionOutcome" do2 ON do2."analysisId" = a.id
          JOIN "Organization" o ON o.id = d."orgId"
          WHERE o."isAnonymized" = TRUE AND d."orgId" IS NOT NULL
          GROUP BY d."orgId"
        `;
        if (ranked.length > 0) {
          const counts = ranked.map(r => Number(r.pairs));
          const orgsBelow = counts.filter(c => c < pairsContributed).length;
          // Percentile rank: % of consenting orgs the requesting org
          // ranks AT OR ABOVE. 100 = top.
          cohortPercentile = Math.round((orgsBelow / counts.length) * 100);
        }
      } catch (err) {
        if (!isSchemaDrift(err)) {
          log.warn('Cohort percentile failed (suppressed in response):', err);
        }
      }
    }

    const response: ContributionResponse = {
      orgId,
      isAnonymized,
      pairsContributed,
      outcomeValidatedAnalysesCount,
      distinctBiasTypesContributed,
      topContributedBiases,
      cohortTotalOrgs,
      cohortTotalDecisions,
      cohortPercentile,
      computedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
    });
  } catch (err) {
    log.error('bias-genome/contribution failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
