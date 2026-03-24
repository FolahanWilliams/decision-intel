/**
 * Journal Email Ingestion API
 *
 * POST /api/journal/ingest — Accept forwarded emails as journal entries
 *
 * No Supabase auth required. Secured by shared secret (JOURNAL_INGEST_SECRET)
 * in the Authorization header. This enables email forwarding rules like:
 * "forward all emails matching 'decision' to journal@decision-intel.com"
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toPrismaStringArray } from '@/lib/utils/prisma-json';
import { createLogger } from '@/lib/utils/logger';
import { isDecisionMessage, extractDecisionFrame } from '@/lib/integrations/slack/handler';

const log = createLogger('JournalIngestRoute');

/**
 * Extract decision statements from email body using Slack handler patterns.
 */
function extractDecisions(content: string): string[] {
  const decisions: string[] = [];

  const segments = content
    .split(/[.\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const segment of segments) {
    if (isDecisionMessage(segment)) {
      decisions.push(segment);
    }
  }

  const frame = extractDecisionFrame(content);
  if (frame?.decisionStatement && !decisions.includes(frame.decisionStatement)) {
    decisions.unshift(frame.decisionStatement);
  }

  return decisions;
}

/**
 * Verify the shared secret from the Authorization header.
 * Expected format: "Bearer <JOURNAL_INGEST_SECRET>"
 */
function verifyIngestSecret(request: NextRequest): boolean {
  const secret = process.env.JOURNAL_INGEST_SECRET;
  if (!secret) {
    log.error('JOURNAL_INGEST_SECRET not configured');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return false;

  // Constant-time comparison to prevent timing attacks
  const provided = Buffer.from(parts[1]);
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;

  try {
    return crypto.timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
}

/**
 * Resolve a userId from the sender's email address.
 * Looks up TeamMember records to find the associated userId.
 * Returns null if no matching user is found.
 */
async function resolveUserIdFromEmail(email: string): Promise<string | null> {
  try {
    const member = await prisma.teamMember.findFirst({
      where: { email: email.toLowerCase() },
      select: { userId: true },
    });
    return member?.userId || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify shared secret (no Supabase auth)
    if (!verifyIngestSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { from, subject, body: emailBody, messageId } = body;

    if (!from || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: from, subject, body' },
        { status: 400 }
      );
    }

    // Resolve userId from sender email
    const userId = await resolveUserIdFromEmail(from);
    if (!userId) {
      log.warn(`No user found for email: ${from}`);
      return NextResponse.json(
        { error: 'No user account found for sender email' },
        { status: 422 }
      );
    }

    // Extract decision statements
    const extractedDecisions = extractDecisions(emailBody);

    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        source: 'email_forward',
        sourceRef: messageId || null,
        title: subject,
        content: emailBody,
        extractedDecisions: toPrismaStringArray(extractedDecisions),
        participants: toPrismaStringArray([]),
        processedAt: extractedDecisions.length > 0 ? new Date() : null,
        status: extractedDecisions.length > 0 ? 'processed' : 'pending',
      },
    });

    log.info(
      `Email journal entry ingested: ${entry.id} from ${from} (decisions: ${extractedDecisions.length})`
    );
    return NextResponse.json(
      {
        id: entry.id,
        extractedDecisions,
        status: entry.status,
      },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022')) {
      log.debug('JournalEntry table not available (schema drift)');
      return NextResponse.json({
        id: 'schema-drift-noop',
        extractedDecisions: [],
        status: 'pending',
      });
    }
    log.error('Failed to ingest email journal entry:', msg);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
