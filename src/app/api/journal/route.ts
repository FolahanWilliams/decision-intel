/**
 * Automated Decision Journal API
 *
 * POST /api/journal — Create a journal entry (email forward, calendar webhook, manual)
 * GET  /api/journal — List journal entries for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { toPrismaStringArray } from '@/lib/utils/prisma-json';
import { createLogger } from '@/lib/utils/logger';
import { isSchemaDrift } from '@/lib/utils/error';
import { isDecisionMessage, extractDecisionFrame } from '@/lib/integrations/slack/handler';

const JournalEntrySchema = z.object({
  source: z.enum(['email_forward', 'calendar_webhook', 'manual', 'slack_digest']),
  sourceRef: z.string().max(500).optional(),
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().min(1, 'Content is required').max(100_000),
  participants: z.array(z.string().max(200)).max(100).optional().default([]),
  scheduledAt: z.string().datetime().optional().nullable(),
});

const log = createLogger('JournalRoute');

/**
 * Extract decision statements from content using the same patterns
 * as the Slack handler (isDecisionMessage + extractDecisionFrame).
 */
function extractDecisions(content: string): string[] {
  const decisions: string[] = [];

  // Split content into sentences/lines and check each
  const segments = content
    .split(/[.\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const segment of segments) {
    if (isDecisionMessage(segment)) {
      decisions.push(segment);
    }
  }

  // Also try frame extraction for a structured decision statement
  const frame = extractDecisionFrame(content);
  if (frame?.decisionStatement && !decisions.includes(frame.decisionStatement)) {
    decisions.unshift(frame.decisionStatement);
  }

  return decisions;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = JournalEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { source, sourceRef, title, content, participants, scheduledAt } = parsed.data;

    // Extract decision statements from content
    const extractedDecisions = extractDecisions(content);

    const entry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        source,
        sourceRef: sourceRef || null,
        title,
        content,
        extractedDecisions: toPrismaStringArray(extractedDecisions),
        participants: toPrismaStringArray(participants),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        processedAt: extractedDecisions.length > 0 ? new Date() : null,
        status: extractedDecisions.length > 0 ? 'processed' : 'pending',
      },
    });

    log.info(`Journal entry created: ${entry.id} by user ${user.id} (source: ${source})`);
    return NextResponse.json(
      {
        id: entry.id,
        extractedDecisions,
        status: entry.status,
      },
      { status: 201 }
    );
  } catch (error) {
    if (isSchemaDrift(error)) {
      log.debug('JournalEntry table not available (schema drift)');
      return NextResponse.json({
        id: 'schema-drift-noop',
        extractedDecisions: [],
        status: 'pending',
      });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to create journal entry:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = request.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;
    const source = url.searchParams.get('source');
    const status = url.searchParams.get('status');

    const where: Record<string, unknown> = { userId: user.id };
    if (source) where.source = source;
    if (status) where.status = status;

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.journalEntry.count({ where }),
    ]);

    // Batch-fetch linked decisions to avoid N+1 queries.
    // linkedDecisionId is a plain string column (no Prisma relation),
    // so we resolve it with a separate query.
    const linkedIds = entries
      .map((e: { linkedDecisionId?: string | null }) => e.linkedDecisionId)
      .filter((id: string | null | undefined): id is string => !!id);

    let linkedDecisionMap: Map<string, Record<string, unknown>> = new Map();
    if (linkedIds.length > 0) {
      try {
        const decisions = await prisma.humanDecision.findMany({
          where: { id: { in: linkedIds } },
          select: { id: true, content: true, status: true },
        });
        linkedDecisionMap = new Map(
          decisions.map((d: { id: string; content: string; status: string }) => [d.id, d])
        );
      } catch {
        // Schema drift — HumanDecision table may not exist yet
      }
    }

    // Attach linked decisions to entries
    const enrichedEntries = entries.map((e: { linkedDecisionId?: string | null }) => ({
      ...e,
      linkedDecision: e.linkedDecisionId
        ? (linkedDecisionMap.get(e.linkedDecisionId) ?? null)
        : null,
    }));

    return NextResponse.json({
      entries: enrichedEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (isSchemaDrift(error)) {
      return NextResponse.json({
        entries: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    }
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to list journal entries:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
