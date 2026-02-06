import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse time range from query params
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '1M';

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (range) {
            case '1W':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1M':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '3M':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'YTD':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'ALL':
            default:
                startDate = new Date(0); // Beginning of time
                break;
        }

        // Fetch all analyses for user within date range
        const analyses = await prisma.analysis.findMany({
            where: {
                document: { userId },
                createdAt: { gte: startDate }
            },
            include: {
                biases: true,
                document: { select: { filename: true, uploadedAt: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Group analyses by date for the chart
        const dailyData: Record<string, { scores: number[]; noise: number[]; volume: number }> = {};

        for (const analysis of analyses) {
            const dateKey = analysis.createdAt.toISOString().split('T')[0];

            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { scores: [], noise: [], volume: 0 };
            }

            dailyData[dateKey].scores.push(analysis.overallScore);
            dailyData[dateKey].noise.push(analysis.noiseScore);
            dailyData[dateKey].volume += 1;
        }

        // Convert to array format for charts
        const trendData = Object.entries(dailyData)
            .map(([date, data]) => ({
                date,
                score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
                noise: Math.round(data.noise.reduce((a, b) => a + b, 0) / data.noise.length),
                volume: data.volume
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Aggregate bias distribution
        const biasCounts: Record<string, number> = {};
        for (const analysis of analyses) {
            for (const bias of analysis.biases) {
                biasCounts[bias.biasType] = (biasCounts[bias.biasType] || 0) + 1;
            }
        }

        const biasDistribution = Object.entries(biasCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)  // Top 8 biases
            .map(([name, value]) => ({ name, value }));

        // Calculate summary stats
        const allScores = analyses.map(a => a.overallScore);
        const allNoise = analyses.map(a => a.noiseScore);

        const stats = {
            totalAnalyses: analyses.length,
            avgScore: allScores.length > 0
                ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
                : 0,
            highScore: allScores.length > 0 ? Math.round(Math.max(...allScores)) : 0,
            lowScore: allScores.length > 0 ? Math.round(Math.min(...allScores)) : 0,
            latestScore: allScores.length > 0 ? Math.round(allScores[allScores.length - 1]) : 0,
            avgNoise: allNoise.length > 0
                ? Math.round(allNoise.reduce((a, b) => a + b, 0) / allNoise.length)
                : 0,
            totalBiases: Object.values(biasCounts).reduce((a, b) => a + b, 0),
            // Calculate trend (comparing first half vs second half)
            trend: (() => {
                if (allScores.length < 2) return 0;
                const mid = Math.floor(allScores.length / 2);
                const firstHalf = allScores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
                const secondHalf = allScores.slice(mid).reduce((a, b) => a + b, 0) / (allScores.length - mid);
                return Math.round((secondHalf - firstHalf) * 10) / 10;
            })()
        };

        return NextResponse.json({
            trendData,
            biasDistribution,
            stats,
            range,
            startDate: startDate.toISOString(),
            endDate: now.toISOString()
        });

    } catch (error) {
        console.error('Error fetching trends:', error);
        return NextResponse.json(
            { error: 'Failed to fetch trends', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
