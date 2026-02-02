import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get total documents for user
        const totalDocuments = await prisma.document.count({
            where: { userId }
        });

        // Get documents by status for user
        const documentsAnalyzed = await prisma.document.count({
            where: { userId, status: 'complete' }
        });

        // Get all analyses with biases for user's documents
        const analyses = await prisma.analysis.findMany({
            where: {
                document: { userId }
            },
            include: { biases: true }
        });

        // Calculate average scores
        const avgOverallScore = analyses.length > 0
            ? analyses.reduce((sum: number, a: any) => sum + a.overallScore, 0) / analyses.length
            : 0;

        const avgNoiseScore = analyses.length > 0
            ? analyses.reduce((sum: number, a: any) => sum + a.noiseScore, 0) / analyses.length
            : 0;

        // Count biases by type
        const biasCounts: Record<string, number> = {};
        const severityCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };

        for (const analysis of analyses) {
            for (const bias of analysis.biases) {
                biasCounts[bias.biasType] = (biasCounts[bias.biasType] || 0) + 1;
                severityCounts[bias.severity] = (severityCounts[bias.severity] || 0) + 1;
            }
        }

        // Sort biases by count
        const topBiases = Object.entries(biasCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Get recent documents for user
        const recentDocuments = await prisma.document.findMany({
            where: { userId },
            take: 5,
            orderBy: { uploadedAt: 'desc' },
            include: {
                analyses: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        return NextResponse.json({
            overview: {
                totalDocuments,
                documentsAnalyzed,
                avgOverallScore: Math.round(avgOverallScore),
                avgNoiseScore: Math.round(avgNoiseScore)
            },
            topBiases,
            severityDistribution: severityCounts,
            recentDocuments: recentDocuments.map((doc: any) => ({
                id: doc.id,
                filename: doc.filename,
                status: doc.status,
                uploadedAt: doc.uploadedAt,
                score: doc.analyses[0]?.overallScore
            }))
        });
    } catch (error: any) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats', details: error.message },
            { status: 500 }
        );
    }
}
