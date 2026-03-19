import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ActivityFeed');

export interface ActivityItem {
  id: string;
  type: 'upload' | 'analysis_complete' | 'analysis_error' | 'nudge' | 'outcome';
  title: string;
  description: string;
  timestamp: string;
  metadata: {
    documentId?: string;
    documentName?: string;
    score?: number;
    severity?: string;
    nudgeType?: string;
  };
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * GET /api/activity-feed
 * Returns a unified, chronological activity feed from multiple sources.
 * Query params: ?limit=20&cursor=<iso-date>&types=upload,analysis_complete,nudge,outcome
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      MAX_LIMIT
    );
    const cursor = searchParams.get('cursor') || undefined;
    const typesParam = searchParams.get('types');
    const allowedTypes = new Set(
      typesParam ? typesParam.split(',').map((t) => t.trim()) : ['upload', 'analysis_complete', 'analysis_error', 'nudge', 'outcome']
    );

    const cursorDate = cursor ? new Date(cursor) : undefined;
    const activities: ActivityItem[] = [];

    // Resolve org membership for org-scoped queries
    let docWhere: Record<string, unknown> = { userId: user.id };
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      if (membership?.orgId) {
        docWhere = { OR: [{ userId: user.id }, { orgId: membership.orgId }] };
      }
    } catch {
      // Schema drift
    }

    // Fetch from multiple sources in parallel
    const [documents, nudges, outcomes] = await Promise.allSettled([
      // Documents (uploads + analysis completions/errors)
      (allowedTypes.has('upload') || allowedTypes.has('analysis_complete') || allowedTypes.has('analysis_error'))
        ? prisma.document.findMany({
            where: {
              ...docWhere,
              ...(cursorDate ? { uploadedAt: { lt: cursorDate } } : {}),
            },
            orderBy: { uploadedAt: 'desc' },
            take: limit,
            select: {
              id: true,
              filename: true,
              status: true,
              uploadedAt: true,
              analyses: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  overallScore: true,
                  summary: true,
                  createdAt: true,
                  _count: { select: { biases: true } },
                },
              },
            },
          })
        : Promise.resolve([]),

      // Nudges
      allowedTypes.has('nudge')
        ? prisma.nudge.findMany({
            where: {
              targetUserId: user.id,
              ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
              id: true,
              nudgeType: true,
              message: true,
              severity: true,
              createdAt: true,
            },
          }).catch(() => [])
        : Promise.resolve([]),

      // Outcomes
      allowedTypes.has('outcome')
        ? prisma.decisionOutcome.findMany({
            where: {
              userId: user.id,
              ...(cursorDate ? { reportedAt: { lt: cursorDate } } : {}),
            },
            orderBy: { reportedAt: 'desc' },
            take: limit,
            select: {
              id: true,
              outcome: true,
              notes: true,
              reportedAt: true,
              analysisId: true,
            },
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    // Process documents → upload + analysis events
    if (documents.status === 'fulfilled') {
      for (const doc of documents.value as Array<{
        id: string;
        filename: string;
        status: string;
        uploadedAt: Date;
        analyses: Array<{
          id: string;
          overallScore: number;
          summary: string;
          createdAt: Date;
          _count: { biases: number };
        }>;
      }>) {
        // Upload event
        if (allowedTypes.has('upload')) {
          activities.push({
            id: `upload-${doc.id}`,
            type: 'upload',
            title: `Uploaded ${doc.filename}`,
            description: `Document uploaded for analysis`,
            timestamp: doc.uploadedAt.toISOString(),
            metadata: { documentId: doc.id, documentName: doc.filename },
          });
        }

        // Analysis complete/error events
        const analysis = doc.analyses[0];
        if (analysis && doc.status === 'complete' && allowedTypes.has('analysis_complete')) {
          activities.push({
            id: `analysis-${analysis.id}`,
            type: 'analysis_complete',
            title: `Analysis complete: ${doc.filename}`,
            description: `Score: ${Math.round(analysis.overallScore)}/100 · ${analysis._count.biases} biases detected`,
            timestamp: analysis.createdAt.toISOString(),
            metadata: {
              documentId: doc.id,
              documentName: doc.filename,
              score: analysis.overallScore,
            },
          });
        } else if (doc.status === 'error' && allowedTypes.has('analysis_error')) {
          activities.push({
            id: `error-${doc.id}`,
            type: 'analysis_error',
            title: `Analysis failed: ${doc.filename}`,
            description: 'The analysis encountered an error. Try re-scanning.',
            timestamp: doc.uploadedAt.toISOString(),
            metadata: { documentId: doc.id, documentName: doc.filename },
          });
        }
      }
    }

    // Process nudges
    if (nudges.status === 'fulfilled') {
      for (const nudge of nudges.value as Array<{
        id: string;
        nudgeType: string;
        message: string;
        severity: string;
        createdAt: Date;
      }>) {
        activities.push({
          id: `nudge-${nudge.id}`,
          type: 'nudge',
          title: `Nudge: ${nudge.nudgeType.replace(/_/g, ' ')}`,
          description: nudge.message.slice(0, 120) + (nudge.message.length > 120 ? '...' : ''),
          timestamp: nudge.createdAt.toISOString(),
          metadata: { severity: nudge.severity, nudgeType: nudge.nudgeType },
        });
      }
    }

    // Process outcomes
    if (outcomes.status === 'fulfilled') {
      for (const outcome of outcomes.value as Array<{
        id: string;
        outcome: string;
        notes: string | null;
        reportedAt: Date;
        analysisId: string;
      }>) {
        activities.push({
          id: `outcome-${outcome.id}`,
          type: 'outcome',
          title: `Outcome reported: ${outcome.outcome}`,
          description: outcome.notes ? outcome.notes.slice(0, 100) : 'Outcome recorded',
          timestamp: outcome.reportedAt.toISOString(),
          metadata: {},
        });
      }
    }

    // Sort by timestamp DESC, paginate
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const page = activities.slice(0, limit);
    const nextCursor = page.length === limit ? page[page.length - 1].timestamp : null;

    return NextResponse.json({
      activities: page,
      nextCursor,
      total: activities.length,
    });
  } catch (error) {
    log.error('Activity feed error:', error);
    return NextResponse.json({ error: 'Failed to load activity feed' }, { status: 500 });
  }
}
