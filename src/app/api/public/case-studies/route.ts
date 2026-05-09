/**
 * Public Case Studies API — anonymized case studies for marketing.
 *
 * Returns case studies from ShareLinks marked with isCaseStudy=true.
 * No auth required. Anonymized: no filenames, user names, or raw excerpts.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('PublicCaseStudies');

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

export async function GET() {
  try {
    const shareLinks = await prisma.shareLink.findMany({
      where: {
        isCaseStudy: true,
        revokedAt: null,
      },
      select: {
        token: true,
        createdAt: true,
        analysis: {
          select: {
            overallScore: true,
            noiseScore: true,
            summary: true,
            biases: {
              select: {
                biasType: true,
                severity: true,
              },
            },
            outcome: {
              select: {
                outcome: true,
                impactScore: true,
                confirmedBiases: true,
              },
            },
            // DecisionContainer membership lookup re-lands in Phase 2 of
            // the refactor. Anonymised case-study cards fall back to a
            // generic "Investment — Diversified" label until the join
            // path Document → ContainerDoc → Container is rewired.
            document: {
              select: { documentType: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const caseStudies = shareLinks.map(link => {
      const { analysis } = link;
      // Container metadata (sector, dealType) re-introduced in Phase 2.
      // Until then anonymised cards label by documentType only.
      const docType = analysis.document?.documentType;
      const label = docType
        ? docType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : 'Strategic Decision';

      // Count biases by severity
      const biasCounts: Record<string, number> = {};
      const severityCounts: Record<string, number> = { high: 0, medium: 0, low: 0 };
      for (const b of analysis.biases) {
        biasCounts[b.biasType] = (biasCounts[b.biasType] || 0) + 1;
        const sev = b.severity?.toLowerCase() || 'medium';
        if (sev in severityCounts) {
          severityCounts[sev]++;
        }
      }

      return {
        token: link.token,
        label,
        dqiScore: analysis.overallScore,
        noiseScore: analysis.noiseScore,
        totalBiases: analysis.biases.length,
        severityCounts,
        topBiasTypes: Object.entries(biasCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([type, count]) => ({ type, count })),
        outcome: analysis.outcome
          ? {
              status: analysis.outcome.outcome,
              impactScore: analysis.outcome.impactScore,
              confirmedBiasCount: Array.isArray(analysis.outcome.confirmedBiases)
                ? analysis.outcome.confirmedBiases.length
                : 0,
            }
          : null,
        publishedAt: link.createdAt,
      };
    });

    return NextResponse.json(
      { caseStudies, count: caseStudies.length },
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    log.error('Failed to fetch case studies:', err);
    return NextResponse.json({ caseStudies: [], count: 0 }, { headers: CACHE_HEADERS });
  }
}
