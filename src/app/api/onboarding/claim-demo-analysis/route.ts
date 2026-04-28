/**
 * POST /api/onboarding/claim-demo-analysis
 *
 * Transfers ownership of a demo audit (Document.userId === DEMO_USER_ID) to
 * the authenticated user, so the wow-moment audit they ran at /demo lives
 * in their own account after sign-up.
 *
 * Semantics: MOVE (not copy). The Document.userId field is updated atomically
 * via updateMany with a predicate, ensuring two simultaneous claims on the
 * same demo audit can't both succeed. The original demo URL stops working
 * (the analysis is no longer attached to DEMO_USER_ID) — that's intentional
 * per the founder's "MOVE not COPY" decision: demo space stays clean, mental
 * model stays simple, the visitor's audit is exclusively theirs after claim.
 *
 * Window: 24h from Document.createdAt. Matches the /api/demo/run rate-limit
 * window (1 audit per IP per 24h) — anything older has already aged out of
 * the demo space's working set anyway.
 *
 * Audit log: emits CLAIM_DEMO_ANALYSIS so the trail is auditable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const log = createLogger('ClaimDemoAnalysis');

const ClaimSchema = z.object({
  // Either an analysis ID or a document ID is acceptable; we resolve to the
  // document. Demo /api/demo/run returns both in its response.
  analysisId: z.string().min(1).optional(),
  documentId: z.string().min(1).optional(),
});

const CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Demo configuration
  const demoUserId = process.env.DEMO_USER_ID?.trim();
  if (!demoUserId) {
    log.warn('Claim attempted but DEMO_USER_ID is not configured');
    return NextResponse.json(
      { error: 'Demo claim is not configured on this deployment.' },
      { status: 503 }
    );
  }

  // 3. Parse + validate
  let body: z.infer<typeof ClaimSchema>;
  try {
    const raw = await req.json();
    body = ClaimSchema.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!body.analysisId && !body.documentId) {
    return NextResponse.json({ error: 'analysisId or documentId is required' }, { status: 400 });
  }

  // 4. Resolve to documentId. Demo audits have one Document per analysis.
  //    Document timestamp field is `uploadedAt` (NOT `createdAt`) per CLAUDE.md
  //    "Document model uses uploadedAt" gotcha.
  let resolvedDocumentId: string;
  let docCreatedAt: Date;
  try {
    if (body.documentId) {
      const doc = await prisma.document.findFirst({
        where: { id: body.documentId },
        select: { id: true, userId: true, uploadedAt: true },
      });
      if (!doc) {
        return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
      }
      if (doc.userId !== demoUserId) {
        // Already claimed by someone else, or never a demo audit. We don't
        // disclose which case to avoid leaking ownership info to non-owners.
        return NextResponse.json({ error: 'This audit is no longer claimable.' }, { status: 410 });
      }
      resolvedDocumentId = doc.id;
      docCreatedAt = doc.uploadedAt;
    } else {
      const analysis = await prisma.analysis.findFirst({
        where: { id: body.analysisId! },
        include: {
          document: { select: { id: true, userId: true, uploadedAt: true } },
        },
      });
      if (!analysis?.document) {
        return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
      }
      if (analysis.document.userId !== demoUserId) {
        return NextResponse.json({ error: 'This audit is no longer claimable.' }, { status: 410 });
      }
      resolvedDocumentId = analysis.document.id;
      docCreatedAt = analysis.document.uploadedAt;
    }
  } catch (err) {
    log.error('Claim lookup failed:', err);
    return NextResponse.json({ error: 'Could not verify audit. Please retry.' }, { status: 503 });
  }

  // 5. Window check (24h)
  const ageMs = Date.now() - docCreatedAt.getTime();
  if (ageMs > CLAIM_WINDOW_MS) {
    return NextResponse.json(
      {
        error:
          'This demo audit is older than 24 hours and can no longer be claimed. Run a new audit from your dashboard to keep it in your account.',
      },
      { status: 410 }
    );
  }

  // 6. Atomic transfer with predicate. updateMany returns count; only flips
  // ownership if the row STILL belongs to DEMO_USER_ID at write time —
  // protects against two simultaneous claims on the same demo audit.
  let transferred = 0;
  try {
    const result = await prisma.document.updateMany({
      where: {
        id: resolvedDocumentId,
        userId: demoUserId,
      },
      data: {
        userId: user.id,
      },
    });
    transferred = result.count;
  } catch (err) {
    log.error('Claim transfer failed:', err);
    return NextResponse.json({ error: 'Could not claim audit. Please retry.' }, { status: 503 });
  }

  if (transferred === 0) {
    // Race lost — another claim already moved the row.
    return NextResponse.json(
      { error: 'This audit was just claimed by someone else.' },
      { status: 409 }
    );
  }

  // 7. Audit log (fire-and-forget, log on failure per CLAUDE.md fire-and-
  // forget discipline).
  logAudit({
    action: 'CLAIM_DEMO_ANALYSIS',
    resource: 'Document',
    resourceId: resolvedDocumentId,
    details: {
      claimedBy: user.id,
      ageMs,
      analysisId: body.analysisId ?? null,
    },
  }).catch(err => log.warn('CLAIM_DEMO_ANALYSIS audit-log write failed:', err));

  log.info(
    `Demo audit ${resolvedDocumentId} claimed by ${user.id} (age ${Math.round(ageMs / 1000)}s)`
  );

  return NextResponse.json({
    ok: true,
    documentId: resolvedDocumentId,
  });
}
