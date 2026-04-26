/**
 * GET /api/documents/[id]/diff?against=otherDocId  (2.3 deep)
 *
 * Returns a line-level textual diff between the focal document and
 * another document the caller can see. Both documents must belong to
 * the same version chain (root + descendants) — cross-chain diffs are
 * deliberately blocked because the comparison only makes sense within
 * a single memo's history.
 *
 * RBAC: visibility-aware via buildDocumentAccessWhere on both sides.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { buildDocumentAccessWhere } from '@/lib/utils/document-access';
import { getDocumentContent } from '@/lib/utils/encryption';
import { computeTextDiff, collapseUnchanged } from '@/lib/utils/text-diff';

const log = createLogger('DocumentDiff');

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const against = url.searchParams.get('against');
    if (!against) {
      return NextResponse.json({ error: 'against=otherDocId is required' }, { status: 400 });
    }
    if (against === id) {
      return NextResponse.json({ error: 'Cannot diff a document against itself' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessA = await buildDocumentAccessWhere(id, user.id);
    const accessB = await buildDocumentAccessWhere(against, user.id);

    const [docA, docB] = await Promise.all([
      prisma.document.findFirst({
        where: accessA.where,
        select: {
          id: true,
          filename: true,
          versionNumber: true,
          versionLabel: true,
          parentDocumentId: true,
          content: true,
          contentEncrypted: true,
          contentIv: true,
          contentTag: true,
          contentKeyVersion: true,
        },
      }),
      prisma.document.findFirst({
        where: accessB.where,
        select: {
          id: true,
          filename: true,
          versionNumber: true,
          versionLabel: true,
          parentDocumentId: true,
          content: true,
          contentEncrypted: true,
          contentIv: true,
          contentTag: true,
          contentKeyVersion: true,
        },
      }),
    ]);

    if (!docA || !docB) {
      return NextResponse.json({ error: 'One or both documents not found' }, { status: 404 });
    }

    // Same chain check — root id of A must match root id of B.
    const rootA = docA.parentDocumentId ?? docA.id;
    const rootB = docB.parentDocumentId ?? docB.id;
    if (rootA !== rootB) {
      return NextResponse.json(
        { error: 'Documents are not in the same version chain' },
        { status: 400 }
      );
    }

    // Decide direction: lower versionNumber = before, higher = after.
    const before = (docA.versionNumber ?? 1) <= (docB.versionNumber ?? 1) ? docA : docB;
    const after = before === docA ? docB : docA;

    const beforeText = getDocumentContent(before as Parameters<typeof getDocumentContent>[0]);
    const afterText = getDocumentContent(after as Parameters<typeof getDocumentContent>[0]);

    const diff = computeTextDiff(beforeText, afterText);
    const collapsed = collapseUnchanged(diff.segments, 2);

    return NextResponse.json({
      before: {
        id: before.id,
        filename: before.filename,
        versionNumber: before.versionNumber ?? 1,
        versionLabel: before.versionLabel ?? null,
      },
      after: {
        id: after.id,
        filename: after.filename,
        versionNumber: after.versionNumber ?? 1,
        versionLabel: after.versionLabel ?? null,
      },
      stats: diff.stats,
      segments: collapsed,
    });
  } catch (err) {
    log.error('diff GET failed:', err as Error);
    return NextResponse.json({ error: 'Failed to compute diff' }, { status: 500 });
  }
}
