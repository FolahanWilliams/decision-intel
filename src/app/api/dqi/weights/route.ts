/**
 * /api/dqi/weights — User- or org-adjustable DQI weight overrides.
 *
 * Locked 2026-05-10 per Tier 2.1 + Deep Research paper #2 Ch 4 + Dietvorst
 * 2016. Dietvorst, Simmons & Massey 2015 named the Algorithm Aversion
 * failure mode (J. Exp. Psychol. General, doi:10.1037/xge0000033); the
 * 2016 follow-up showed people will use imperfect algorithms IF allowed
 * to slightly modify the inputs or weights. This endpoint is the
 * storage layer for that fix.
 *
 * Scope precedence on resolution (handled by the consumer route):
 *   org override > user override > canonical baseline
 *
 * The endpoint operates on the CALLER's scope:
 *   - GET returns the resolved active weights for the caller (org wins
 *     over user when both exist), plus the canonical baseline + delta.
 *   - PATCH writes to the caller's scope. If the caller is in an org,
 *     PATCH defaults to scope='org' (highest impact). The `scope=user`
 *     query param forces user-scoped override for solo / cross-org
 *     contexts.
 *   - DELETE removes the override at the requested scope (resets to
 *     canonical / lower-scope fallback).
 *
 * Audit log: every PATCH + DELETE writes a DQI_WEIGHTS_SET or
 * DQI_WEIGHTS_RESET row so procurement readers can verify the override
 * trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import {
  WEIGHTS_CANONICAL,
  WEIGHT_COMPONENT_IDS,
  validateUserAdjustableWeights,
  hashWeights,
  computeWeightDeltas,
  maxAbsoluteDelta,
  METHODOLOGY_VERSION_2_3_0,
  type WEIGHTS,
} from '@/lib/scoring/dqi';
import { resolveActiveWeightsForUser } from '@/lib/scoring/weight-overrides';
import { logAudit } from '@/lib/audit';
import { Prisma } from '@prisma/client';

const log = createLogger('DqiWeightsRoute');

type ScopeParam = 'user' | 'org';

async function resolveOrgId(userId: string): Promise<string | null> {
  try {
    const m = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return m?.orgId ?? null;
  } catch {
    return null;
  }
}

/**
 * GET — returns the active weights for the caller. Shape:
 * {
 *   active: { weights, source, override? },
 *   canonical: typeof WEIGHTS,
 *   delta: Record<componentId, signedDelta>,
 *   maxDelta: number,
 *   warningBand: 'none' | 'mild' | 'material' | 'severe',
 *   methodologyVersion: '2.3.0',
 * }
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const active = await resolveActiveWeightsForUser(user.id);
    const delta = computeWeightDeltas(active.effective);
    const max = maxAbsoluteDelta(active.effective);

    // Warning band — blue ≤0.05 / amber ≤0.15 / red >0.15 per the
    // handoff doc. Doesn't BLOCK, just informs the UI surface.
    const warningBand: 'none' | 'mild' | 'material' | 'severe' =
      max < 1e-6 ? 'none' : max <= 0.05 ? 'mild' : max <= 0.15 ? 'material' : 'severe';

    return NextResponse.json({
      active: {
        weights: active.effective,
        source: active.source,
        override: active.override,
      },
      canonical: WEIGHTS_CANONICAL,
      componentIds: WEIGHT_COMPONENT_IDS,
      delta,
      maxDelta: max,
      warningBand,
      methodologyVersion: METHODOLOGY_VERSION_2_3_0,
    });
  } catch (error) {
    log.error('GET /api/dqi/weights failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface PatchBody {
  weights?: Partial<Record<keyof typeof WEIGHTS, number>>;
  scope?: ScopeParam;
}

/**
 * PATCH — write or update the override. Validates server-side against
 * `validateUserAdjustableWeights` before persist. Stamps weightsHash for
 * tamper-evidence + methodology version 2.3.0.
 *
 * Body: { weights: Record<componentId, number>, scope?: 'user' | 'org' }
 * Default scope = 'org' if the caller is in one, else 'user'.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as PatchBody | null;
    if (!body || !body.weights) {
      return NextResponse.json({ error: 'Missing weights' }, { status: 400 });
    }

    const validation = validateUserAdjustableWeights(body.weights);
    if (!validation.valid || !validation.normalised) {
      return NextResponse.json({ error: validation.error ?? 'Invalid weights' }, { status: 400 });
    }

    const orgId = await resolveOrgId(user.id);
    const scope: ScopeParam = body.scope ?? (orgId ? 'org' : 'user');

    if (scope === 'org' && !orgId) {
      return NextResponse.json(
        { error: 'Cannot set org-scoped weights — you are not in an org' },
        { status: 400 }
      );
    }

    const weights = validation.normalised;
    const weightsHash = hashWeights(weights);

    // Persist with upsert keyed off the scope.
    const persisted = await (async () => {
      if (scope === 'org') {
        return prisma.dqiWeightOverride.upsert({
          where: { orgId: orgId! },
          create: {
            scope: 'org',
            orgId: orgId!,
            weights: weights as unknown as Prisma.InputJsonValue,
            weightsHash,
            methodologyVersion: METHODOLOGY_VERSION_2_3_0,
            setByUserId: user.id,
          },
          update: {
            weights: weights as unknown as Prisma.InputJsonValue,
            weightsHash,
            methodologyVersion: METHODOLOGY_VERSION_2_3_0,
            setByUserId: user.id,
          },
        });
      }
      return prisma.dqiWeightOverride.upsert({
        where: { userId: user.id },
        create: {
          scope: 'user',
          userId: user.id,
          weights: weights as unknown as Prisma.InputJsonValue,
          weightsHash,
          methodologyVersion: METHODOLOGY_VERSION_2_3_0,
          setByUserId: user.id,
        },
        update: {
          weights: weights as unknown as Prisma.InputJsonValue,
          weightsHash,
          methodologyVersion: METHODOLOGY_VERSION_2_3_0,
          setByUserId: user.id,
        },
      });
    })();

    await logAudit({
      action: 'DQI_WEIGHTS_SET',
      resource: 'DqiWeightOverride',
      resourceId: persisted.id,
      details: {
        scope,
        weightsHash,
        maxDelta: maxAbsoluteDelta(weights),
        weights,
      },
    });

    return NextResponse.json({
      ok: true,
      override: {
        id: persisted.id,
        scope,
        weightsHash,
        methodologyVersion: persisted.methodologyVersion,
        setAt: persisted.setAt,
      },
      weights,
      delta: computeWeightDeltas(weights),
      maxDelta: maxAbsoluteDelta(weights),
    });
  } catch (error) {
    log.error('PATCH /api/dqi/weights failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE — reset to canonical (or to lower-scope fallback if both
 * scopes existed). Accepts ?scope=user|org; default 'org' when caller
 * is in one.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const scope = (url.searchParams.get('scope') as ScopeParam | null) ?? null;
    const orgId = await resolveOrgId(user.id);
    const targetScope: ScopeParam = scope ?? (orgId ? 'org' : 'user');

    let deletedId: string | null = null;
    if (targetScope === 'org' && orgId) {
      try {
        const deleted = await prisma.dqiWeightOverride.delete({ where: { orgId } });
        deletedId = deleted.id;
      } catch {
        // P2025 = record not found; not an error path
      }
    } else {
      try {
        const deleted = await prisma.dqiWeightOverride.delete({ where: { userId: user.id } });
        deletedId = deleted.id;
      } catch {
        // ignored — already canonical
      }
    }

    if (deletedId) {
      await logAudit({
        action: 'DQI_WEIGHTS_RESET',
        resource: 'DqiWeightOverride',
        resourceId: deletedId,
        details: { scope: targetScope },
      });
    }

    return NextResponse.json({ ok: true, reset: Boolean(deletedId), scope: targetScope });
  } catch (error) {
    log.error('DELETE /api/dqi/weights failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
