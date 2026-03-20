/**
 * User Feedback API - Bias Instance Ratings
 *
 * POST /api/feedback/bias-rating - Rate the accuracy of a detected bias
 * GET /api/feedback/bias-rating?analysisId=xxx - Get user ratings for an analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('BiasRating');

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { biasId, rating, feedback } = body;

    if (!biasId || rating === undefined) {
      return NextResponse.json({ error: 'Bias ID and rating are required' }, { status: 400 });
    }

    // Validate rating (1-5 scale)
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Update the bias instance with user rating
    const bias = await prisma.biasInstance.update({
      where: { id: biasId },
      data: { userRating: rating },
      include: {
        analysis: {
          include: {
            document: true,
          },
        },
      },
    });

    // Verify ownership
    if (bias.analysis.document.userId !== user.id) {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
      });

      if (!membership || membership.orgId !== bias.analysis.document.orgId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'bias.rate',
        resource: 'bias',
        resourceId: biasId,
        details: {
          rating,
          feedback,
          biasType: bias.biasType,
          severity: bias.severity,
        },
      },
    });

    // Calculate aggregate feedback stats for this bias type
    const stats = await prisma.biasInstance.aggregate({
      where: {
        biasType: bias.biasType,
        userRating: { not: null },
      },
      _avg: { userRating: true },
      _count: { userRating: true },
    });

    log.info(`Bias ${biasId} rated ${rating}/5 by user ${user.id}`);

    return NextResponse.json({
      message: 'Rating saved successfully',
      bias: {
        id: bias.id,
        biasType: bias.biasType,
        userRating: rating,
      },
      stats: {
        averageRating: stats._avg.userRating || 0,
        totalRatings: stats._count.userRating || 0,
      },
    });
  } catch (error) {
    log.error('Failed to save bias rating:', error);
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
    }

    // Get all biases with ratings for this analysis
    const biases = await prisma.biasInstance.findMany({
      where: { analysisId },
      select: {
        id: true,
        biasType: true,
        severity: true,
        userRating: true,
        confidence: true,
      },
    });

    // Calculate accuracy metrics
    const rated = biases.filter(b => b.userRating !== null);
    const accuracyScore = rated.length > 0
      ? rated.reduce((sum, b) => sum + (b.userRating || 0), 0) / (rated.length * 5) * 100
      : null;

    return NextResponse.json({
      biases,
      metrics: {
        totalBiases: biases.length,
        ratedBiases: rated.length,
        accuracyScore,
        averageRating: rated.length > 0
          ? rated.reduce((sum, b) => sum + (b.userRating || 0), 0) / rated.length
          : null,
      },
    });
  } catch (error) {
    log.error('Failed to fetch bias ratings:', error);
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
  }
}

/**
 * Get aggregated feedback stats for improving bias detection
 */
export async function PUT(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Aggregate feedback by bias type
    const feedbackStats = await prisma.biasInstance.groupBy({
      by: ['biasType', 'severity'],
      where: { userRating: { not: null } },
      _avg: { userRating: true, confidence: true },
      _count: { userRating: true },
    });

    // Find poorly performing bias detections (low ratings)
    const poorPerformers = feedbackStats
      .filter(stat => stat._avg.userRating !== null && stat._avg.userRating < 3)
      .map(stat => ({
        biasType: stat.biasType,
        severity: stat.severity,
        averageRating: stat._avg.userRating,
        averageConfidence: stat._avg.confidence,
        sampleSize: stat._count.userRating,
      }));

    // Find high performing bias detections (high ratings)
    const highPerformers = feedbackStats
      .filter(stat => stat._avg.userRating !== null && stat._avg.userRating >= 4)
      .map(stat => ({
        biasType: stat.biasType,
        severity: stat.severity,
        averageRating: stat._avg.userRating,
        averageConfidence: stat._avg.confidence,
        sampleSize: stat._count.userRating,
      }));

    return NextResponse.json({
      summary: {
        totalBiasTypes: feedbackStats.length,
        totalRatings: feedbackStats.reduce((sum, stat) => sum + (stat._count.userRating || 0), 0),
        overallAverage: feedbackStats.length > 0
          ? feedbackStats.reduce((sum, stat) => sum + (stat._avg.userRating || 0), 0) / feedbackStats.length
          : null,
      },
      poorPerformers,
      highPerformers,
      raw: feedbackStats,
    });
  } catch (error) {
    log.error('Failed to aggregate feedback stats:', error);
    return NextResponse.json({ error: 'Failed to aggregate stats' }, { status: 500 });
  }
}