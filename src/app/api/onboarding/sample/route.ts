import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

const log = createLogger('OnboardingSampleRoute');

const SAMPLE_FILENAME = 'Sample - Project Phoenix Expansion.txt';

/**
 * POST /api/onboarding/sample
 * Creates a sample document for the authenticated user so they can
 * experience the analysis pipeline without uploading their own content.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for existing sample doc to avoid duplicates
    const existing = await prisma.document.findFirst({
      where: {
        userId: user.id,
        filename: SAMPLE_FILENAME,
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ documentId: existing.id, alreadyExists: true });
    }

    // Read sample content from repo root
    let content: string;
    try {
      content = readFileSync(join(process.cwd(), 'sample_decision.txt'), 'utf-8');
    } catch {
      log.error('sample_decision.txt not found');
      return NextResponse.json({ error: 'Sample document not available' }, { status: 500 });
    }

    const contentHash = createHash('sha256').update(content).digest('hex');

    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        filename: SAMPLE_FILENAME,
        fileType: 'text/plain',
        fileSize: Buffer.byteLength(content, 'utf-8'),
        content,
        contentHash,
        status: 'uploaded',
      },
    });

    log.info(`Created sample document ${doc.id} for user ${user.id}`);

    return NextResponse.json({ documentId: doc.id, alreadyExists: false });
  } catch (error) {
    log.error('POST /api/onboarding/sample failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
