/**
 * /api/recommendations — Constellation Next Move recommendation
 * engine read endpoint.
 *
 * Locked 2026-05-10. Returns the top-N ranked recommendations across
 * all active containers visible to the caller, persona-tuned per the
 * caller's onboarding role, with cross-decision pattern detection
 * applied across the full visible set.
 *
 * Query params:
 *   - persona: optional override; defaults to user's onboarding role.
 *   - limit: top-N to return (default 10, max 50).
 *   - includeLlm: when 'true', upgrades the rule-based output with
 *     deepseek-v4-flash semantic-similarity assumption matching +
 *     persona-tuned why-trace prose. Default 'false' so the strip
 *     paints sub-200ms; the drawer fetches with includeLlm=true to
 *     hydrate the deeper signal layer.
 *
 * Response:
 *   {
 *     recommendations: NextMoveRecommendation[],
 *     crossDecisionPatterns: CrossDecisionPattern[],
 *     computedAt: ISO string,
 *     fromCache: boolean,
 *     llmAugmented: boolean,
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { cacheGet, cacheSet } from '@/lib/utils/cache';
import { classifyValidity, type ValidityClass } from '@/lib/learning/validity-classifier';
import { CONTAINER_MODES } from '@/lib/data/decision-container-modes';
import type {
  CrossDecisionPattern,
  EngineContainer,
  EngineContainerLink,
  EngineInput,
  NextMoveRecommendation,
} from '@/lib/recommendations/recommendation-types';
import { runEngine, cacheKey as buildCacheKey } from '@/lib/recommendations/next-move-engine';
import { detectCrossDecisionPatterns } from '@/lib/recommendations/cross-decision-patterns';
import { enhanceWhyTrace } from '@/lib/recommendations/llm-augmentation';

const log = createLogger('RecommendationsRoute');

const CACHE_TTL_SECONDS = 90; // 90s — short window so signals refresh quickly

type Persona = 'cso' | 'ma' | 'bizops' | 'pe_vc' | 'other';

async function resolvePersona(userId: string, override?: Persona | null): Promise<Persona> {
  if (override) return override;
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { onboardingRole: true },
    });
    const role = settings?.onboardingRole ?? null;
    if (role === 'cso' || role === 'ma' || role === 'bizops' || role === 'pe_vc') {
      return role;
    }
    return 'other';
  } catch {
    return 'other';
  }
}

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
 * Loads the EngineContainer set the engine reads. Every container
 * the user owns OR shares an org with that's status='active'.
 */
async function loadEngineContainers(
  userId: string,
  orgId: string | null
): Promise<EngineContainer[]> {
  const where = orgId
    ? { OR: [{ ownerUserId: userId }, { orgId }], status: 'active' }
    : { ownerUserId: userId, status: 'active' };

  const containers = await prisma.decisionContainer.findMany({
    where,
    select: {
      id: true,
      kind: true,
      name: true,
      decisionFrame: true,
      stageId: true,
      status: true,
      decidedAt: true,
      committeeDate: true,
      compositeDqi: true,
      compositeGrade: true,
      documentCount: true,
      analyzedDocCount: true,
      recurringBiasCount: true,
      conflictCount: true,
      highSeverityConflictCount: true,
      sector: true,
      priors: true,
      outcome: { select: { id: true } },
      documents: {
        select: {
          document: {
            select: {
              id: true,
              documentType: true,
              analyses: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  id: true,
                  toxicCombinations: {
                    select: {
                      patternLabel: true,
                      severity: true,
                      toxicScore: true,
                    },
                  },
                  judgeOutputs: true,
                  structuralAssumptions: {
                    select: {
                      assumption: true,
                      determinantLabel: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    take: 200, // upper bound — beyond this we'd need pagination on the strip
  });

  return containers.map(c => {
    const namedPatternMap = new Map<
      string,
      {
        patternLabel: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        documentCount: number;
      }
    >();
    const structuralAssumptions: string[] = [];
    let validityClass: ValidityClass = 'medium';

    for (const dcd of c.documents) {
      const doc = dcd.document;
      const analysis = doc.analyses[0];
      if (!analysis) continue;
      // Aggregate named-pattern severities across all member docs.
      for (const tc of analysis.toxicCombinations) {
        // patternLabel is nullable in the schema but rows produced by
        // the production pipeline always carry a label — skip the
        // legacy-null edge cases rather than coalescing to a placeholder
        // (which would corrupt the recommendation grouping).
        if (!tc.patternLabel) continue;
        const label = tc.patternLabel;
        const sev =
          (tc.severity as 'critical' | 'high' | 'medium' | 'low' | null) ??
          (tc.toxicScore >= 80
            ? 'critical'
            : tc.toxicScore >= 60
              ? 'high'
              : tc.toxicScore >= 40
                ? 'medium'
                : 'low');
        const existing = namedPatternMap.get(label);
        if (!existing || severityRank(sev) > severityRank(existing.severity)) {
          namedPatternMap.set(label, {
            patternLabel: label,
            severity: sev,
            documentCount: (existing?.documentCount ?? 0) + 1,
          });
        } else {
          existing.documentCount += 1;
        }
      }
      // Structural assumptions — pulled from the StructuralAssumption
      // relation per Dalio determinant. Use the assumption text first;
      // determinantLabel as fallback when assumption text is empty.
      if (analysis.structuralAssumptions) {
        for (const sa of analysis.structuralAssumptions) {
          if (sa.assumption && sa.assumption.trim().length > 0) {
            structuralAssumptions.push(sa.assumption);
          } else if (sa.determinantLabel) {
            structuralAssumptions.push(sa.determinantLabel);
          }
        }
      }
      // Validity class — read persisted band first, fall back to live-compute.
      const judgeOutputs = analysis.judgeOutputs as {
        validityClassification?: { validityClass?: ValidityClass };
      } | null;
      const persistedClass = judgeOutputs?.validityClassification?.validityClass;
      if (persistedClass) {
        if (validityRank(persistedClass) > validityRank(validityClass)) {
          validityClass = persistedClass;
        }
      } else {
        const live = classifyValidity({
          documentType: doc.documentType ?? null,
          industry: c.sector ?? null,
        });
        if (validityRank(live.validityClass) > validityRank(validityClass)) {
          validityClass = live.validityClass;
        }
      }
    }

    // Required-doc shortfall.
    const mode = CONTAINER_MODES[c.kind as 'investment' | 'acquisition' | 'strategic'];
    const attachedTypes = new Set(
      c.documents
        .map(dcd => dcd.document.documentType)
        .filter((t): t is string => typeof t === 'string')
    );
    const missingRequiredDocs: string[] = mode
      ? mode.requiredDocsForCommittee.filter((rd: string) => !attachedTypes.has(rd))
      : [];

    const priors = c.priors as {
      convictionLevel: 'low' | 'medium' | 'high' | 'very_high';
      convictionRationale: string;
      killCriteria: string[];
      capturedAt: string;
    } | null;

    return {
      id: c.id,
      kind: c.kind as 'investment' | 'acquisition' | 'strategic',
      name: c.name,
      decisionFrame: c.decisionFrame,
      stageId: c.stageId,
      status: c.status,
      decidedAt: c.decidedAt,
      committeeDate: c.committeeDate,
      compositeDqi: c.compositeDqi,
      compositeGrade: c.compositeGrade,
      documentCount: c.documentCount,
      analyzedDocCount: c.analyzedDocCount,
      recurringBiasCount: c.recurringBiasCount,
      conflictCount: c.conflictCount,
      highSeverityConflictCount: c.highSeverityConflictCount,
      namedPatterns: Array.from(namedPatternMap.values()),
      hasOutcome: c.outcome !== null,
      missingRequiredDocs,
      validityClass,
      structuralAssumptions: Array.from(new Set(structuralAssumptions)),
      priors,
    } satisfies EngineContainer;
  });
}

async function loadEngineLinks(containerIds: string[]): Promise<EngineContainerLink[]> {
  if (containerIds.length === 0) return [];
  try {
    const links = await prisma.decisionContainerLink.findMany({
      where: {
        OR: [{ fromId: { in: containerIds } }, { toId: { in: containerIds } }],
      },
      select: { fromId: true, toId: true, linkType: true, note: true },
    });
    return links
      .filter(l => containerIds.includes(l.fromId) && containerIds.includes(l.toId))
      .map(l => ({
        fromId: l.fromId,
        toId: l.toId,
        linkType: l.linkType as 'precedes' | 'spawned_from' | 'depends_on' | 'parent_of',
        note: l.note,
      }));
  } catch (err) {
    // @schema-drift-tolerant — older envs without DecisionContainerLink table
    log.warn('loadEngineLinks failed (non-fatal):', err);
    return [];
  }
}

function severityRank(s: 'critical' | 'high' | 'medium' | 'low'): number {
  return s === 'critical' ? 4 : s === 'high' ? 3 : s === 'medium' ? 2 : 1;
}

function validityRank(c: ValidityClass): number {
  return c === 'zero' ? 4 : c === 'low' ? 3 : c === 'medium' ? 2 : 1;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const personaParam = url.searchParams.get('persona') as Persona | null;
  const limitParam = parseInt(url.searchParams.get('limit') || '10', 10);
  const limit = Math.min(50, Math.max(1, isNaN(limitParam) ? 10 : limitParam));
  const includeLlm = url.searchParams.get('includeLlm') === 'true';

  const persona = await resolvePersona(user.id, personaParam);
  const orgId = await resolveOrgId(user.id);

  // Load + build engine input.
  const containers = await loadEngineContainers(user.id, orgId);
  const links = await loadEngineLinks(containers.map(c => c.id));

  const computedAt = new Date();
  const engineInput: EngineInput = {
    containers,
    links,
    recentUserPriority: null, // populated by /api/constellation/priority-capture
    persona,
    computedAt,
  };

  // Cache key incorporates includeLlm — augmented + non-augmented are
  // separate cache entries.
  const baseKey = buildCacheKey(engineInput);
  const cacheKey = `${baseKey}::llm=${includeLlm ? '1' : '0'}::limit=${limit}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as {
        recommendations: NextMoveRecommendation[];
        crossDecisionPatterns: CrossDecisionPattern[];
        computedAt: string;
        llmAugmented: boolean;
      };
      return NextResponse.json({ ...parsed, fromCache: true });
    } catch {
      // Fall through to fresh compute on cache parse failure.
    }
  }

  // Run rule-based engine.
  const recommendations = runEngine(engineInput).slice(0, limit);
  const crossDecisionPatterns = detectCrossDecisionPatterns(containers, links);

  // Optional LLM augmentation — only the top-3 recs get persona-tuned
  // why-trace prose (cost-bounded). Pattern-label canonicalization is
  // deferred to the cross-decision endpoint where blast radius matters
  // more than per-rec wording.
  let llmAugmented = false;
  let augmentedRecommendations = recommendations;
  if (includeLlm && recommendations.length > 0) {
    const topThree = recommendations.slice(0, 3);
    try {
      const traces = await Promise.all(
        topThree.map(rec =>
          enhanceWhyTrace({ recommendation: rec, persona }).catch(err => {
            // Log and fall back to rule-based trace per the
            // intelligent-antagonist defense — never silently fabricate.
            log.warn('enhanceWhyTrace failed for rec:', err);
            return rec.whyTrace;
          })
        )
      );
      augmentedRecommendations = recommendations.map((rec, i) =>
        i < 3 ? { ...rec, whyTrace: traces[i] } : rec
      );
      llmAugmented = true;
    } catch (err) {
      log.warn('LLM augmentation pass failed; returning rule-based output:', err);
    }
  }

  const payload = {
    recommendations: augmentedRecommendations,
    crossDecisionPatterns,
    computedAt: computedAt.toISOString(),
    llmAugmented,
  };

  // Cache fire-and-forget — never block response on cache-write failure.
  cacheSet(cacheKey, JSON.stringify(payload), CACHE_TTL_SECONDS).catch(err =>
    log.warn('cacheSet failed (non-fatal):', err)
  );

  return NextResponse.json({ ...payload, fromCache: false });
}
