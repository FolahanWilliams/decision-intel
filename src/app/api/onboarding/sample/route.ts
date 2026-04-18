import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { createHash } from 'crypto';
import { encryptDocumentContent, isDocumentEncryptionEnabled } from '@/lib/utils/encryption';
import { getSeedCorpus } from '@/lib/demo/corpus';

const log = createLogger('OnboardingSampleRoute');

// Preferred sample filename when the Phoenix seed is present. Kept as a
// constant so existing user docs still match the dedup lookup below.
const PREFERRED_SAMPLE_FILENAME = 'Sample - Project Phoenix Expansion.txt';

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

    // Check for existing sample doc to avoid duplicates. We match on the
    // "(SAMPLE).txt" suffix so this stays correct even if the underlying
    // seed is swapped (e.g. Phoenix renamed, fallback in effect).
    const existing = await prisma.document.findFirst({
      where: {
        userId: user.id,
        OR: [
          { filename: PREFERRED_SAMPLE_FILENAME },
          { filename: { endsWith: '(SAMPLE).txt' } },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ documentId: existing.id, alreadyExists: true });
    }

    // Pull Phoenix entry from the seed corpus — content is synthesized from
    // the same DemoAnalysis used on the /demo marketing page, so the sample
    // always stays in sync with what marketing ships.
    //
    // Safeguard: if Phoenix ever gets renamed or removed from DEMO_ANALYSES,
    // fall back to the first available seed rather than 500-ing a CSO who
    // clicks "Audit Your Own Memo" off a LinkedIn link.
    const corpus = getSeedCorpus();
    const phoenix =
      corpus.find(e => e.demoId === 'demo-phoenix-expansion') ?? corpus[0];
    if (!phoenix) {
      log.error('Demo seed corpus is empty — no fallback available');
      return NextResponse.json({ error: 'Sample document not available' }, { status: 500 });
    }
    if (phoenix.demoId !== 'demo-phoenix-expansion') {
      log.warn('Phoenix seed missing; using fallback seed', {
        fallback: phoenix.demoId,
      });
    }
    const content = phoenix.documentContent;

    const contentHash = createHash('sha256').update(content).digest('hex');
    const encFields = isDocumentEncryptionEnabled() ? encryptDocumentContent(content) : {};

    // Use the Phoenix canonical filename when available; otherwise use the
    // fallback seed's own filename so the user sees a coherent doc title.
    const filename =
      phoenix.demoId === 'demo-phoenix-expansion' ? PREFERRED_SAMPLE_FILENAME : phoenix.filename;

    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        filename,
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
