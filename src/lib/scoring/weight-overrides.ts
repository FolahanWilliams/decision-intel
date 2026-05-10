/**
 * DQI weight override resolution (locked 2026-05-10 per Tier 2.1).
 *
 * Storage layer for the Dietvorst 2016 algorithm-aversion fix. The
 * `/api/dqi/weights` route handles CRUD; this file handles RESOLUTION
 * (called by every audit-rendering path that needs to know which weights
 * to use). Kept separate from the route file so:
 *   - the resolver can be unit-tested without spinning up Next.js
 *   - other server-side surfaces (analyze/stream pipeline, DPR
 *     assembler, /api/dqi consumer) import without depending on
 *     route-handler exports
 *
 * Precedence:
 *   1. org override (highest — applies to every audit on org-owned containers)
 *   2. user override (caller's solo / cross-org audits)
 *   3. canonical baseline (no override exists)
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { WEIGHTS_CANONICAL, type WEIGHTS as WeightsType } from '@/lib/scoring/dqi';

const log = createLogger('WeightOverrideResolver');

export interface ResolvedWeights {
  effective: typeof WeightsType;
  source: 'canonical' | 'user' | 'org';
  override: {
    id: string;
    scope: string;
    weightsHash: string;
    methodologyVersion: string;
    setAt: Date;
  } | null;
}

/**
 * Resolve the active DQI weight vector for a user. Org override beats
 * user override beats canonical. Returns both the resolved weight vector
 * AND override metadata (id / hash / version / setAt) so consumers can
 * stamp them on persisted analyses + DPR covers for tamper-evidence.
 *
 * `orgIdHint` is optional — when supplied, skips the TeamMember lookup
 * (caller already knows the org). When omitted the resolver queries.
 */
export async function resolveActiveWeightsForUser(
  userId: string,
  orgIdHint?: string | null
): Promise<ResolvedWeights> {
  // Resolve org (caller-provided hint, or look up).
  let orgId: string | null = orgIdHint ?? null;
  if (orgIdHint === undefined) {
    try {
      const m = await prisma.teamMember.findFirst({
        where: { userId },
        select: { orgId: true },
      });
      orgId = m?.orgId ?? null;
    } catch (err) {
      log.warn('TeamMember lookup failed during weight resolution', { err: String(err) });
    }
  }

  // Org first (higher precedence).
  if (orgId) {
    try {
      const orgOverride = await prisma.dqiWeightOverride.findUnique({
        where: { orgId },
      });
      if (orgOverride) {
        return {
          effective: orgOverride.weights as unknown as typeof WeightsType,
          source: 'org',
          override: {
            id: orgOverride.id,
            scope: orgOverride.scope,
            weightsHash: orgOverride.weightsHash,
            methodologyVersion: orgOverride.methodologyVersion,
            setAt: orgOverride.setAt,
          },
        };
      }
    } catch (err) {
      // @schema-drift-tolerant — pre-T2.1 environments may lack the
      // DqiWeightOverride table; fall through to user / canonical.
      log.warn('Org weight override lookup failed (schema drift?)', { err: String(err) });
    }
  }

  // User scope next.
  try {
    const userOverride = await prisma.dqiWeightOverride.findUnique({
      where: { userId },
    });
    if (userOverride) {
      return {
        effective: userOverride.weights as unknown as typeof WeightsType,
        source: 'user',
        override: {
          id: userOverride.id,
          scope: userOverride.scope,
          weightsHash: userOverride.weightsHash,
          methodologyVersion: userOverride.methodologyVersion,
          setAt: userOverride.setAt,
        },
      };
    }
  } catch (err) {
    // @schema-drift-tolerant — same pre-T2.1 fallback
    log.warn('User weight override lookup failed (schema drift?)', { err: String(err) });
  }

  return {
    effective: { ...WEIGHTS_CANONICAL },
    source: 'canonical',
    override: null,
  };
}
