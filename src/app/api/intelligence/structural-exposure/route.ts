/**
 * GET /api/intelligence/structural-exposure  (1.3a deep)
 *
 * Org-level rollup of every persisted Dalio structural-assumption finding.
 * Powers the StructuralExposureCard on /dashboard/analytics and the
 * Sankore-style "show me my exposure across the determinants" view.
 *
 * Per-determinant numbers:
 *   - flagCount       — how many analyses flagged it
 *   - avgSeverityIdx  — mean severity index 0..3 (low..critical)
 *   - defensibilityMix — counts by well_supported / partially / unsupported / contradicted
 *   - emShare         — share of flags that occurred under emerging-market context
 *
 * RBAC: scopes by the visibility resolver — only counts assumptions on
 * analyses whose parent document the caller can read.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { buildDocumentAccessFilter } from '@/lib/utils/document-access';
import { DALIO_DETERMINANTS, DETERMINANT_CATEGORIES } from '@/lib/constants/dalio-determinants';

const log = createLogger('StructuralExposure');

const SEVERITY_INDEX: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

interface DefensibilityMix {
  well_supported: number;
  partially_supported: number;
  unsupported: number;
  contradicted: number;
}

interface DeterminantRollup {
  determinantId: string;
  label: string;
  category: string | null;
  flagCount: number;
  uniqueAnalyses: number;
  avgSeverityIdx: number;
  topSeverity: 'low' | 'medium' | 'high' | 'critical';
  defensibilityMix: DefensibilityMix;
  emShare: number;
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Restrict to assumptions on analyses whose parent doc the caller can read.
    const { where: docFilter } = await buildDocumentAccessFilter(user.id);

    const rows = await prisma.structuralAssumption
      .findMany({
        where: {
          analysis: {
            document: docFilter,
          },
        },
        select: {
          determinantId: true,
          determinantLabel: true,
          category: true,
          severity: true,
          defensibility: true,
          marketContext: true,
          analysisId: true,
        },
      })
      .catch(() => []);

    if (rows.length === 0) {
      return NextResponse.json({
        rollup: [],
        totals: {
          flags: 0,
          uniqueAnalyses: 0,
          emFlags: 0,
          dmFlags: 0,
        },
      });
    }

    const rollupMap = new Map<
      string,
      {
        flagCount: number;
        analysisIds: Set<string>;
        sevSum: number;
        topSev: number;
        defensibility: DefensibilityMix;
        emFlags: number;
        category: string | null;
        label: string;
      }
    >();

    let emFlags = 0;
    let dmFlags = 0;
    const allAnalysisIds = new Set<string>();

    for (const r of rows) {
      const id = r.determinantId;
      const sev = SEVERITY_INDEX[r.severity] ?? 0;
      const defKey = (r.defensibility as keyof DefensibilityMix) || 'unsupported';
      const isEm = r.marketContext === 'emerging_market';
      const isDm = r.marketContext === 'developed_market';
      if (isEm) emFlags += 1;
      if (isDm) dmFlags += 1;
      allAnalysisIds.add(r.analysisId);

      const existing = rollupMap.get(id);
      const determinantLabel =
        DALIO_DETERMINANTS[id]?.label ?? r.determinantLabel ?? id.replace(/_/g, ' ');
      const determinantCategory = DALIO_DETERMINANTS[id]?.category ?? r.category ?? null;
      if (existing) {
        existing.flagCount += 1;
        existing.analysisIds.add(r.analysisId);
        existing.sevSum += sev;
        if (sev > existing.topSev) existing.topSev = sev;
        if (defKey in existing.defensibility) existing.defensibility[defKey] += 1;
        if (isEm) existing.emFlags += 1;
      } else {
        rollupMap.set(id, {
          flagCount: 1,
          analysisIds: new Set([r.analysisId]),
          sevSum: sev,
          topSev: sev,
          defensibility: {
            well_supported: defKey === 'well_supported' ? 1 : 0,
            partially_supported: defKey === 'partially_supported' ? 1 : 0,
            unsupported: defKey === 'unsupported' ? 1 : 0,
            contradicted: defKey === 'contradicted' ? 1 : 0,
          },
          emFlags: isEm ? 1 : 0,
          category: determinantCategory,
          label: determinantLabel,
        });
      }
    }

    const SEV_LABELS = ['low', 'medium', 'high', 'critical'] as const;
    const rollup: DeterminantRollup[] = Array.from(rollupMap.entries())
      .map(([determinantId, agg]) => ({
        determinantId,
        label: agg.label,
        category: agg.category,
        flagCount: agg.flagCount,
        uniqueAnalyses: agg.analysisIds.size,
        avgSeverityIdx: agg.flagCount === 0 ? 0 : agg.sevSum / agg.flagCount,
        topSeverity: SEV_LABELS[agg.topSev] ?? 'low',
        defensibilityMix: agg.defensibility,
        emShare: agg.flagCount === 0 ? 0 : agg.emFlags / agg.flagCount,
      }))
      .sort((a, b) => {
        if (b.flagCount !== a.flagCount) return b.flagCount - a.flagCount;
        return b.avgSeverityIdx - a.avgSeverityIdx;
      });

    return NextResponse.json({
      rollup,
      totals: {
        flags: rows.length,
        uniqueAnalyses: allAnalysisIds.size,
        emFlags,
        dmFlags,
      },
      categories: DETERMINANT_CATEGORIES,
    });
  } catch (err) {
    log.error('structural-exposure GET failed:', err as Error);
    return NextResponse.json({ error: 'Failed to load structural exposure' }, { status: 500 });
  }
}
