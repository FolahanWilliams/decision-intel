/**
 * Decision Fingerprint Engine — Contextual Cognitive Profile
 *
 * Detects contextual bias patterns: "Your team over-indexes on anchoring bias
 * in IC memo reviews during Q4." Provides predictive warnings when current
 * analysis conditions match historically bad patterns, and a longitudinal
 * fingerprint view spanning 8+ quarters.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FingerprintEngine');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContextualPattern {
  biasType: string;
  documentType: string | null;
  dealType: string | null;
  quarter: string;
  occurrenceCount: number;
  avgSeverity: number;
  totalAnalyses: number;
  prevalenceRate: number;
  trend: string | null;
}

export interface PredictiveWarning {
  id: string;
  warningType: string;
  message: string;
  severity: string;
  matchedPattern: Record<string, unknown>;
  acknowledged: boolean;
  createdAt: Date;
}

export interface QuarterlyTrend {
  quarter: string;
  avgDecisionQuality: number;
  avgNoiseScore: number;
  totalDecisions: number;
}

export interface OrgFingerprint {
  topPatterns: ContextualPattern[];
  quarterlyPatterns: Record<string, ContextualPattern[]>;
  longitudinalTrend: QuarterlyTrend[];
  activeWarnings: PredictiveWarning[];
  totalAnalysesAllTime: number;
  quartersSpanned: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toQuarter(date: Date): string {
  const year = date.getFullYear();
  const q = Math.ceil((date.getMonth() + 1) / 3);
  return `${year}-Q${q}`;
}

const SEVERITY_SCORES: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// ─── Function 1: computeContextualPatterns ──────────────────────────────────

/**
 * Compute contextual bias patterns for an org by binning BiasInstance records
 * by (biasType, documentType, dealType, quarter). Upserts ContextualBiasPattern.
 */
export async function computeContextualPatterns(orgId: string): Promise<number> {
  try {
    // Fetch bias instances with analysis → document → deal context
    const biasInstances = await prisma.biasInstance.findMany({
      where: {
        analysis: {
          document: { orgId },
        },
      },
      select: {
        biasType: true,
        severity: true,
        analysis: {
          select: {
            id: true,
            createdAt: true,
            document: {
              select: {
                documentType: true,
                deal: {
                  select: { dealType: true },
                },
              },
            },
          },
        },
      },
    });

    if (biasInstances.length === 0) {
      log.info(`No bias instances found for org ${orgId}`);
      return 0;
    }

    // Count total analyses per bin for prevalence denominator
    const analysisBins = new Map<string, Set<string>>();
    const biasBins = new Map<
      string,
      { count: number; severitySum: number; analysisIds: Set<string> }
    >();

    for (const bi of biasInstances) {
      const docType = bi.analysis.document.documentType ?? null;
      const dealType = bi.analysis.document.deal?.dealType ?? null;
      const quarter = toQuarter(bi.analysis.createdAt);
      const biasType = bi.biasType.toLowerCase().replace(/\s+/g, '_');

      // Track unique analyses per context bin (denominator)
      const contextKey = `${docType}::${dealType}::${quarter}`;
      if (!analysisBins.has(contextKey)) analysisBins.set(contextKey, new Set());
      analysisBins.get(contextKey)!.add(bi.analysis.id);

      // Track bias occurrences per full bin
      const fullKey = `${biasType}::${contextKey}`;
      if (!biasBins.has(fullKey)) {
        biasBins.set(fullKey, { count: 0, severitySum: 0, analysisIds: new Set() });
      }
      const bin = biasBins.get(fullKey)!;
      bin.count++;
      bin.severitySum += SEVERITY_SCORES[bi.severity] ?? 1;
      bin.analysisIds.add(bi.analysis.id);
    }

    // Compute prevalence and upsert
    let upserted = 0;

    for (const [fullKey, bin] of biasBins.entries()) {
      const [biasType, docType, dealType, quarter] = fullKey.split('::');
      const contextKey = `${docType}::${dealType}::${quarter}`;
      const totalAnalyses = analysisBins.get(contextKey)?.size ?? 1;
      const prevalenceRate = bin.analysisIds.size / totalAnalyses;
      const avgSeverity = bin.severitySum / bin.count;

      // Compute trend by comparing to previous quarter
      const trend = await computeTrend(
        orgId,
        biasType,
        docType === 'null' ? null : docType,
        dealType === 'null' ? null : dealType,
        quarter,
        prevalenceRate
      );

      const resolvedDocType = docType === 'null' ? null : docType;
      const resolvedDealType = dealType === 'null' ? null : dealType;

      try {
        // Upsert via findFirst + create/update to handle nullable compound keys
        const existing = await prisma.contextualBiasPattern.findFirst({
          where: {
            orgId,
            biasType,
            documentType: resolvedDocType,
            dealType: resolvedDealType,
            quarter,
          },
          select: { id: true },
        });

        if (existing) {
          await prisma.contextualBiasPattern.update({
            where: { id: existing.id },
            data: {
              occurrenceCount: bin.count,
              avgSeverity: Math.round(avgSeverity * 100) / 100,
              totalAnalyses,
              prevalenceRate: Math.round(prevalenceRate * 1000) / 1000,
              trend,
            },
          });
        } else {
          await prisma.contextualBiasPattern.create({
            data: {
              orgId,
              biasType,
              documentType: resolvedDocType,
              dealType: resolvedDealType,
              quarter,
              occurrenceCount: bin.count,
              avgSeverity: Math.round(avgSeverity * 100) / 100,
              totalAnalyses,
              prevalenceRate: Math.round(prevalenceRate * 1000) / 1000,
              trend,
            },
          });
        }
        upserted++;
      } catch (upsertErr) {
        log.warn(`Failed to upsert pattern ${fullKey}:`, upsertErr);
      }
    }

    log.info(`Computed ${upserted} contextual bias patterns for org ${orgId}`);
    return upserted;
  } catch (error) {
    log.error('Failed to compute contextual patterns:', error);
    return 0;
  }
}

async function computeTrend(
  orgId: string,
  biasType: string,
  documentType: string | null,
  dealType: string | null,
  currentQuarter: string,
  currentRate: number
): Promise<string> {
  try {
    // Parse current quarter to find previous
    const [yearStr, qStr] = currentQuarter.split('-Q');
    const year = parseInt(yearStr, 10);
    const q = parseInt(qStr, 10);
    const prevQ = q === 1 ? 4 : q - 1;
    const prevYear = q === 1 ? year - 1 : year;
    const prevQuarter = `${prevYear}-Q${prevQ}`;

    const prev = await prisma.contextualBiasPattern.findFirst({
      where: { orgId, biasType, documentType, dealType, quarter: prevQuarter },
      select: { prevalenceRate: true },
    });

    if (!prev) return 'stable';

    const delta = currentRate - prev.prevalenceRate;
    if (delta > 0.05) return 'increasing';
    if (delta < -0.05) return 'decreasing';
    return 'stable';
  } catch {
    return 'stable';
  }
}

// ─── Function 2: generatePredictiveWarnings ─────────────────────────────────

/**
 * Generate predictive warnings when current analysis conditions match
 * historically problematic patterns (prevalence > 40%).
 */
export async function generatePredictiveWarnings(
  analysisId: string,
  orgId: string,
  documentType: string,
  dealType?: string
): Promise<PredictiveWarning[]> {
  try {
    const currentQuarter = toQuarter(new Date());

    // Find patterns where this document/deal type has high bias prevalence
    const matchingPatterns = await prisma.contextualBiasPattern.findMany({
      where: {
        orgId,
        prevalenceRate: { gt: 0.4 },
        OR: [
          // Same document type
          { documentType },
          // Same deal type (if provided)
          ...(dealType ? [{ dealType }] : []),
          // Same quarter last year (seasonality)
          {
            quarter: getLastYearQuarter(currentQuarter),
            documentType,
          },
        ],
      },
      orderBy: { prevalenceRate: 'desc' },
      take: 10,
    });

    if (matchingPatterns.length === 0) return [];

    const warnings: PredictiveWarning[] = [];

    for (const pattern of matchingPatterns) {
      const pctStr = `${Math.round(pattern.prevalenceRate * 100)}%`;
      const contextParts: string[] = [];
      if (pattern.documentType) contextParts.push(`${pattern.documentType} reviews`);
      if (pattern.dealType) contextParts.push(`${pattern.dealType} deals`);
      if (pattern.quarter) contextParts.push(`during ${pattern.quarter}`);
      const contextStr = contextParts.join(' for ') || 'this context';

      const isSeasonalMatch = pattern.quarter === getLastYearQuarter(currentQuarter);
      const warningType = isSeasonalMatch ? 'seasonal' : 'contextual_pattern';

      const severity =
        pattern.prevalenceRate >= 0.7
          ? 'critical'
          : pattern.prevalenceRate >= 0.5
            ? 'warning'
            : 'info';

      const message = isSeasonalMatch
        ? `Seasonal pattern: ${pctStr} prevalence of ${pattern.biasType.replace(/_/g, ' ')} in ${contextStr} last year. Watch for recurrence.`
        : `${pctStr} prevalence of ${pattern.biasType.replace(/_/g, ' ')} in ${contextStr}. ${pattern.trend === 'increasing' ? 'This pattern is trending upward.' : ''}`;

      try {
        const created = await prisma.fingerprintWarning.create({
          data: {
            orgId,
            analysisId,
            warningType,
            message: message.trim(),
            severity,
            matchedPattern: JSON.parse(
              JSON.stringify({
                biasType: pattern.biasType,
                documentType: pattern.documentType,
                dealType: pattern.dealType,
                quarter: pattern.quarter,
                prevalenceRate: pattern.prevalenceRate,
                trend: pattern.trend,
              })
            ) as Prisma.InputJsonValue,
          },
        });

        warnings.push({
          id: created.id,
          warningType: created.warningType,
          message: created.message,
          severity: created.severity,
          matchedPattern: created.matchedPattern as Record<string, unknown>,
          acknowledged: created.acknowledged,
          createdAt: created.createdAt,
        });
      } catch (createErr) {
        log.warn('Failed to create fingerprint warning:', createErr);
      }
    }

    if (warnings.length > 0) {
      log.info(`Generated ${warnings.length} predictive warning(s) for analysis ${analysisId}`);
    }

    return warnings;
  } catch (error) {
    log.error('Failed to generate predictive warnings:', error);
    return [];
  }
}

function getLastYearQuarter(quarter: string): string {
  const [yearStr, qPart] = quarter.split('-');
  return `${parseInt(yearStr, 10) - 1}-${qPart}`;
}

// ─── Function 3: getOrgFingerprint ──────────────────────────────────────────

/**
 * Assemble the full org fingerprint: contextual patterns, longitudinal trends,
 * and active warnings.
 */
export async function getOrgFingerprint(orgId: string): Promise<OrgFingerprint> {
  try {
    // Get last 8 quarters of contextual patterns
    const now = new Date();
    const eightQuartersAgo = new Date(now);
    eightQuartersAgo.setMonth(eightQuartersAgo.getMonth() - 24);
    const startQuarter = toQuarter(eightQuartersAgo);

    const patterns = await prisma.contextualBiasPattern.findMany({
      where: {
        orgId,
        quarter: { gte: startQuarter },
      },
      orderBy: [{ quarter: 'desc' }, { prevalenceRate: 'desc' }],
    });

    // Group by quarter
    const quarterlyPatterns: Record<string, ContextualPattern[]> = {};
    for (const p of patterns) {
      if (!quarterlyPatterns[p.quarter]) quarterlyPatterns[p.quarter] = [];
      quarterlyPatterns[p.quarter].push({
        biasType: p.biasType,
        documentType: p.documentType,
        dealType: p.dealType,
        quarter: p.quarter,
        occurrenceCount: p.occurrenceCount,
        avgSeverity: p.avgSeverity,
        totalAnalyses: p.totalAnalyses,
        prevalenceRate: p.prevalenceRate,
        trend: p.trend,
      });
    }

    // Top patterns by prevalence (most recent 2 quarters)
    const recentQuarters = Object.keys(quarterlyPatterns).sort().reverse().slice(0, 2);
    const topPatterns = patterns
      .filter(p => recentQuarters.includes(p.quarter))
      .sort((a, b) => b.prevalenceRate - a.prevalenceRate)
      .slice(0, 10)
      .map(p => ({
        biasType: p.biasType,
        documentType: p.documentType,
        dealType: p.dealType,
        quarter: p.quarter,
        occurrenceCount: p.occurrenceCount,
        avgSeverity: p.avgSeverity,
        totalAnalyses: p.totalAnalyses,
        prevalenceRate: p.prevalenceRate,
        trend: p.trend,
      }));

    // Longitudinal trend from TeamCognitiveProfile (quarterly windows)
    const longitudinalTrend: QuarterlyTrend[] = [];
    try {
      const profiles = await prisma.teamCognitiveProfile.findMany({
        where: {
          orgId,
          periodStart: { gte: eightQuartersAgo },
        },
        orderBy: { periodStart: 'asc' },
        select: {
          periodStart: true,
          avgDecisionQuality: true,
          avgNoiseScore: true,
          totalDecisions: true,
        },
      });

      for (const profile of profiles) {
        longitudinalTrend.push({
          quarter: toQuarter(profile.periodStart),
          avgDecisionQuality: profile.avgDecisionQuality,
          avgNoiseScore: profile.avgNoiseScore,
          totalDecisions: profile.totalDecisions,
        });
      }
    } catch {
      // TeamCognitiveProfile data unavailable
    }

    // Active warnings (unacknowledged)
    const warnings = await prisma.fingerprintWarning.findMany({
      where: {
        orgId,
        acknowledged: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const activeWarnings: PredictiveWarning[] = warnings.map(w => ({
      id: w.id,
      warningType: w.warningType,
      message: w.message,
      severity: w.severity,
      matchedPattern: w.matchedPattern as Record<string, unknown>,
      acknowledged: w.acknowledged,
      createdAt: w.createdAt,
    }));

    // Total analyses all time
    const totalAnalysesAllTime = await prisma.analysis.count({
      where: { document: { orgId } },
    });

    return {
      topPatterns,
      quarterlyPatterns,
      longitudinalTrend,
      activeWarnings,
      totalAnalysesAllTime,
      quartersSpanned: Object.keys(quarterlyPatterns).length,
    };
  } catch (error) {
    log.error('Failed to get org fingerprint:', error);
    return {
      topPatterns: [],
      quarterlyPatterns: {},
      longitudinalTrend: [],
      activeWarnings: [],
      totalAnalysesAllTime: 0,
      quartersSpanned: 0,
    };
  }
}
