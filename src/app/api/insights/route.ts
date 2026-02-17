import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('InsightsRoute');

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // All queries scoped to user's documents
        const userDocIds = prisma.document.findMany({
            where: { userId },
            select: { id: true },
        });

        const docIds = (await userDocIds).map(d => d.id);

        if (docIds.length === 0) {
            return NextResponse.json({ empty: true });
        }

        // Run all aggregation queries in parallel
        const [
            analyses,
            biasDistribution,
            severityCounts,
        ] = await Promise.all([
            // Full analyses with JSON fields for radar, sentiment, compliance, SWOT, fact-check
            prisma.analysis.findMany({
                where: { documentId: { in: docIds } },
                select: {
                    id: true,
                    documentId: true,
                    overallScore: true,
                    noiseScore: true,
                    factCheck: true,
                    compliance: true,
                    sentiment: true,
                    logicalAnalysis: true,
                    swotAnalysis: true,
                },
            }),

            // Bias type distribution (grouped)
            // Using $queryRaw tagged template (parameterized) — safe against SQL injection.
            prisma.$queryRaw<{ biasType: string; count: bigint }[]>`
                SELECT bi."biasType", COUNT(*)::bigint as count
                FROM "BiasInstance" bi
                JOIN "Analysis" a ON bi."analysisId" = a.id
                JOIN "Document" d ON a."documentId" = d.id
                WHERE d."userId" = ${userId}
                GROUP BY bi."biasType"
                ORDER BY count DESC
            `,

            // Severity distribution
            prisma.$queryRaw<{ severity: string; count: bigint }[]>`
                SELECT bi."severity", COUNT(*)::bigint as count
                FROM "BiasInstance" bi
                JOIN "Analysis" a ON bi."analysisId" = a.id
                JOIN "Document" d ON a."documentId" = d.id
                WHERE d."userId" = ${userId}
                GROUP BY bi."severity"
            `,
        ]);

        const n = analyses.length;

        // --- 1. Decision Health Radar (6 axes) ---
        let totalOverall = 0, totalNoise = 0, totalFact = 0, totalLogic = 0, totalCompliance = 0, totalSentiment = 0;
        let factCount = 0, logicCount = 0, complianceCount = 0, sentimentCount = 0;

        // --- 4. Fact Verification Funnel ---
        let verified = 0, contradicted = 0, unverifiable = 0;

        // --- 5. Sentiment ---
        let sentimentLabel = 'Neutral';

        // --- 6. Compliance ---
        const regulationMap = new Map<string, { pass: number; warn: number; fail: number }>();

        // --- 3. SWOT aggregation ---
        const swotAgg = { strengths: new Map<string, number>(), weaknesses: new Map<string, number>(), opportunities: new Map<string, number>(), threats: new Map<string, number>() };

        // --- 7. Score distribution ---
        const scoreBuckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 0-10, 10-20, ..., 90-100

        // --- 8. Scatter data ---
        const scatterData: { id: string; overallScore: number; noiseScore: number }[] = [];

        for (const a of analyses) {
            totalOverall += a.overallScore;
            totalNoise += a.noiseScore;

            // Score distribution
            const bucket = Math.min(9, Math.floor(a.overallScore / 10));
            scoreBuckets[bucket]++;

            // Scatter
            scatterData.push({ id: a.documentId, overallScore: a.overallScore, noiseScore: a.noiseScore });

            // Fact check
            const fc = a.factCheck as { score?: number; verifications?: { verdict?: string }[] } | null;
            if (fc?.score != null) { totalFact += fc.score; factCount++; }
            if (fc?.verifications) {
                for (const v of fc.verifications) {
                    const vd = (v.verdict || '').toUpperCase();
                    if (vd === 'VERIFIED') verified++;
                    else if (vd === 'CONTRADICTED') contradicted++;
                    else unverifiable++;
                }
            }

            // Logic
            const la = a.logicalAnalysis as { score?: number } | null;
            if (la?.score != null) { totalLogic += la.score; logicCount++; }

            // Compliance
            const comp = a.compliance as { riskScore?: number; regulations?: { name?: string; status?: string }[] } | null;
            if (comp?.riskScore != null) { totalCompliance += (100 - comp.riskScore); complianceCount++; }
            if (comp?.regulations) {
                for (const r of comp.regulations) {
                    const name = r.name || 'Unknown';
                    if (!regulationMap.has(name)) regulationMap.set(name, { pass: 0, warn: 0, fail: 0 });
                    const entry = regulationMap.get(name)!;
                    const status = (r.status || '').toUpperCase();
                    if (status === 'COMPLIANT') entry.pass++;
                    else if (status === 'NON_COMPLIANT') entry.fail++;
                    else entry.warn++;
                }
            }

            // Sentiment
            const sent = a.sentiment as { score?: number; label?: string } | null;
            if (sent?.score != null) { totalSentiment += sent.score; sentimentCount++; }
            if (sent?.label) sentimentLabel = sent.label;

            // SWOT
            const swot = a.swotAnalysis as { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] } | null;
            if (swot) {
                for (const s of swot.strengths || []) swotAgg.strengths.set(s, (swotAgg.strengths.get(s) || 0) + 1);
                for (const w of swot.weaknesses || []) swotAgg.weaknesses.set(w, (swotAgg.weaknesses.get(w) || 0) + 1);
                for (const o of swot.opportunities || []) swotAgg.opportunities.set(o, (swotAgg.opportunities.get(o) || 0) + 1);
                for (const t of swot.threats || []) swotAgg.threats.set(t, (swotAgg.threats.get(t) || 0) + 1);
            }
        }

        // Helper: top N from map
        const topN = (m: Map<string, number>, limit = 5) =>
            [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([text]) => text);

        const payload = {
            empty: false,

            // 1. Radar
            radar: {
                quality: n > 0 ? Math.round(totalOverall / n) : 0,
                consistency: n > 0 ? Math.round(100 - totalNoise / n) : 0,
                factAccuracy: factCount > 0 ? Math.round(totalFact / factCount) : 0,
                logic: logicCount > 0 ? Math.round(totalLogic / logicCount) : 0,
                compliance: complianceCount > 0 ? Math.round(totalCompliance / complianceCount) : 0,
                objectivity: sentimentCount > 0 ? Math.round(Math.abs(totalSentiment / sentimentCount)) : 0,
            },

            // 2. Bias treemap
            biasTreemap: biasDistribution.map(b => ({
                name: b.biasType,
                count: Number(b.count),
            })),
            biasSeverity: Object.fromEntries(
                severityCounts.map(s => [s.severity, Number(s.count)])
            ),

            // 3. SWOT
            swot: {
                strengths: topN(swotAgg.strengths),
                weaknesses: topN(swotAgg.weaknesses),
                opportunities: topN(swotAgg.opportunities),
                threats: topN(swotAgg.threats),
            },

            // 4. Fact verification
            factVerification: { verified, contradicted, unverifiable },

            // 5. Sentiment
            sentiment: {
                score: sentimentCount > 0 ? Math.round(totalSentiment / sentimentCount) : 0,
                label: sentimentLabel,
            },

            // 6. Compliance grid
            complianceGrid: [...regulationMap.entries()].map(([name, counts]) => ({
                name,
                ...counts,
            })),

            // 7. Score distribution
            scoreDistribution: scoreBuckets.map((count, i) => ({
                range: `${i * 10}-${i * 10 + 10}`,
                count,
            })),

            // 8. Scatter
            scatterData,

            // Summary stats
            totalAnalyses: n,
            totalBiases: biasDistribution.reduce((sum, b) => sum + Number(b.count), 0),
        };

        return NextResponse.json(payload);
    } catch (error) {
        log.error('Error:', error);
        return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
    }
}
