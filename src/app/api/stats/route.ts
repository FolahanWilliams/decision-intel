import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('StatsRoute');

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Execute all queries in parallel — all pushed to the database
        const [
            totalDocuments,
            documentsAnalyzed,
            scoreAggregation,
            topBiasesRaw,
            severityRaw,
            recentDocuments
        ] = await Promise.all([
            // 1. Total documents count
            prisma.document.count({
                where: { userId }
            }),

            // 2. Completed documents count
            prisma.document.count({
                where: { userId, status: 'complete' }
            }),

            // 3. Aggregate avg scores + count (O(1) memory instead of O(n))
            prisma.analysis.aggregate({
                where: { document: { userId } },
                _avg: {
                    overallScore: true,
                    noiseScore: true
                },
                _count: true
            }),

            // 4. Top 5 biases by count (raw SQL GROUP BY — no full table scan)
            // Using $queryRaw tagged template (parameterized) — safe against SQL injection.
            prisma.$queryRaw<Array<{ biasType: string; count: bigint }>>`
                SELECT bi."biasType", COUNT(*)::bigint as count
                FROM "BiasInstance" bi
                JOIN "Analysis" a ON a.id = bi."analysisId"
                JOIN "Document" d ON d.id = a."documentId"
                WHERE d."userId" = ${userId}
                GROUP BY bi."biasType"
                ORDER BY count DESC
                LIMIT 5
            `,

            // 5. Severity distribution (raw SQL GROUP BY)
            prisma.$queryRaw<Array<{ severity: string; count: bigint }>>`
                SELECT bi.severity, COUNT(*)::bigint as count
                FROM "BiasInstance" bi
                JOIN "Analysis" a ON a.id = bi."analysisId"
                JOIN "Document" d ON d.id = a."documentId"
                WHERE d."userId" = ${userId}
                GROUP BY bi.severity
            `,

            // 6. Recent documents (already limited to 5)
            prisma.document.findMany({
                where: { userId },
                take: 5,
                orderBy: { uploadedAt: 'desc' },
                include: {
                    analyses: {
                        take: 1,
                        orderBy: { createdAt: 'desc' }
                    }
                }
            })
        ]);

        // Transform severity raw results into the expected shape
        const severityCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
        for (const row of severityRaw) {
            severityCounts[row.severity] = Number(row.count);
        }

        return NextResponse.json({
            overview: {
                totalDocuments,
                documentsAnalyzed,
                avgOverallScore: Math.round(scoreAggregation._avg.overallScore ?? 0),
                avgNoiseScore: Math.round(scoreAggregation._avg.noiseScore ?? 0)
            },
            topBiases: topBiasesRaw.map(b => ({
                name: b.biasType,
                count: Number(b.count)
            })),
            severityDistribution: severityCounts,
            recentDocuments: recentDocuments.map((doc: { id: string; filename: string; status: string; uploadedAt: Date; analyses: { overallScore: number }[] }) => ({
                id: doc.id,
                filename: doc.filename,
                status: doc.status,
                uploadedAt: doc.uploadedAt,
                score: doc.analyses[0]?.overallScore
            }))
        });
    } catch (error) {
        log.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
