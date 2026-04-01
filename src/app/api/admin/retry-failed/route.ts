/**
 * Admin Dead Letter Queue Management
 *
 * POST /api/admin/retry-failed - Manually retry failed analyses
 * GET /api/admin/retry-failed - View pending failed analyses
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { verifyAdmin, ADMIN_DENIED } from '@/lib/utils/admin';

const log = createLogger('RetryFailed');

/**
 * GET /api/admin/retry-failed - List failed analyses pending retry
 */
export async function GET(_req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return ADMIN_DENIED;

    // Fetch failed analyses
    const failed = await prisma.failedAnalysis.findMany({
      where: { resolvedAt: null },
      include: {
        document: {
          select: {
            filename: true,
            userId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      failed: failed.map(f => ({
        id: f.id,
        documentId: f.documentId,
        filename: f.document.filename,
        userId: f.userId,
        error: f.error,
        errorCode: f.errorCode,
        retryCount: f.retryCount,
        maxRetries: f.maxRetries,
        nextRetryAt: f.nextRetryAt,
        createdAt: f.createdAt,
        canRetry: f.retryCount < f.maxRetries,
      })),
      count: failed.length,
    });
  } catch (error) {
    log.error('Failed to fetch failed analyses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/retry-failed - Manually trigger retry for a failed analysis
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return ADMIN_DENIED;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const { failedAnalysisId, retryAll } = body;

    if (retryAll) {
      // Retry all eligible failed analyses.
      // Filter in application code: each record has its own maxRetries value,
      // so we fetch unresolved records and filter by retryCount < maxRetries.
      const allFailed = await prisma.failedAnalysis.findMany({
        where: { resolvedAt: null },
      });
      const eligibleFailed = allFailed.filter(f => f.retryCount < f.maxRetries);

      log.info(`Retrying ${eligibleFailed.length} failed analyses`);

      // Queue them for immediate retry by setting nextRetryAt to now
      await prisma.failedAnalysis.updateMany({
        where: {
          id: { in: eligibleFailed.map(f => f.id) },
        },
        data: {
          nextRetryAt: new Date(),
        },
      });

      return NextResponse.json({
        message: `Queued ${eligibleFailed.length} analyses for retry`,
        count: eligibleFailed.length,
      });
    } else if (failedAnalysisId) {
      // Retry specific failed analysis
      const failed = await prisma.failedAnalysis.findUnique({
        where: { id: failedAnalysisId },
      });

      if (!failed) {
        return NextResponse.json({ error: 'Failed analysis not found' }, { status: 404 });
      }

      if (failed.resolvedAt) {
        return NextResponse.json({ error: 'Analysis already resolved' }, { status: 400 });
      }

      if (failed.retryCount >= failed.maxRetries) {
        return NextResponse.json({ error: 'Max retries exceeded' }, { status: 400 });
      }

      // Queue for immediate retry
      await prisma.failedAnalysis.update({
        where: { id: failedAnalysisId },
        data: {
          nextRetryAt: new Date(),
        },
      });

      // Trigger the actual analysis (optional - could be handled by cron)
      // For immediate processing, you could call the analysis function here

      log.info(`Queued failed analysis ${failedAnalysisId} for retry`);

      return NextResponse.json({
        message: 'Analysis queued for retry',
        id: failedAnalysisId,
      });
    } else {
      return NextResponse.json(
        { error: 'Missing failedAnalysisId or retryAll flag' },
        { status: 400 }
      );
    }
  } catch (error) {
    log.error('Failed to retry analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
