import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DocumentVersionsRoute');

// GET /api/documents/:id/versions
//   Returns every Document in the same version chain as :id, with each
//   document's most recent Analysis summary (DQI, noise, bias count). Used
//   by the VersionHistoryStrip + VersionDeltaCard on the document detail
//   page.
//
// Auth: ownership OR same-org membership, mirroring /api/documents/[id].
// Soft-deleted versions are excluded.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return apiError({ error: 'Unauthorized', status: 401 });

    // Fetch the requested doc to discover the chain root.
    const focal = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        orgId: true,
        parentDocumentId: true,
        versionNumber: true,
        deletedAt: true,
      },
    });
    if (!focal || focal.deletedAt) {
      return apiError({ error: 'Not found', status: 404 });
    }

    // Access check: ownership or org-membership.
    let hasAccess = focal.userId === user.id;
    if (!hasAccess && focal.orgId) {
      const membership = await prisma.teamMember
        .findFirst({
          where: { userId: user.id, orgId: focal.orgId },
          select: { id: true },
        })
        .catch(() => null);
      hasAccess = !!membership;
    }
    if (!hasAccess) return apiError({ error: 'Forbidden', status: 403 });

    // Resolve the chain root. v1 has parentDocumentId=null; vN has it set
    // to v1's id (we always anchor on root, see Document.parentDocumentId
    // doc on the schema).
    const rootId = focal.parentDocumentId ?? focal.id;

    const chain = await prisma.document.findMany({
      where: {
        OR: [{ id: rootId }, { parentDocumentId: rootId }],
        deletedAt: null,
      },
      orderBy: { versionNumber: 'asc' },
      select: {
        id: true,
        filename: true,
        versionNumber: true,
        parentDocumentId: true,
        uploadedAt: true,
        status: true,
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            overallScore: true,
            noiseScore: true,
            createdAt: true,
            biases: { select: { biasType: true, severity: true } },
          },
        },
      },
    });

    return NextResponse.json({
      rootId,
      currentVersionNumber: focal.versionNumber,
      versions: chain.map(d => ({
        id: d.id,
        filename: d.filename,
        versionNumber: d.versionNumber,
        parentDocumentId: d.parentDocumentId,
        uploadedAt: d.uploadedAt,
        status: d.status,
        latestAnalysis: d.analyses[0]
          ? {
              id: d.analyses[0].id,
              overallScore: d.analyses[0].overallScore,
              noiseScore: d.analyses[0].noiseScore,
              createdAt: d.analyses[0].createdAt,
              biasCount: d.analyses[0].biases.length,
              biases: d.analyses[0].biases,
            }
          : null,
      })),
    });
  } catch (err) {
    log.error('versions GET failed', err as Error);
    return apiError({ error: 'Request failed', status: 500 });
  }
}
