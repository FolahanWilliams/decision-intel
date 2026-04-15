import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { createHash } from 'crypto';
import { encryptDocumentContent, isDocumentEncryptionEnabled } from '@/lib/utils/encryption';
import { getSeedCorpus } from '@/lib/demo/corpus';

const log = createLogger('OnboardingSampleRoute');

const SAMPLE_FILENAME = 'Sample - Project Phoenix Expansion.txt';

/**
 * POST /api/onboarding/sample
 * Creates a sample document for the authenticated user so they can
 * experience the analysis pipeline without uploading their own content.
 * Content is synthesized in-process from the demo corpus — no filesystem
 * reads (previously depended on a sample_decision.txt that wasn't shipped).
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

    // Pull Phoenix entry from the seed corpus — content is synthesized from
    // the same DemoAnalysis used on the /demo marketing page, so the sample
    // always stays in sync with what marketing ships.
    const phoenix = getSeedCorpus().find(e => e.demoId === 'demo-phoenix-expansion');
    if (!phoenix) {
      log.error('Phoenix seed entry missing from demo corpus');
      return NextResponse.json({ error: 'Sample document not available' }, { status: 500 });
    }
    const content = phoenix.documentContent;

    const contentHash = createHash('sha256').update(content).digest('hex');
    const encFields = isDocumentEncryptionEnabled() ? encryptDocumentContent(content) : {};

    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        filename: SAMPLE_FILENAME,
        fileType: 'text/plain',
        fileSize: Buffer.byteLength(content, 'utf-8'),
        content,
        ...encFields,
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
