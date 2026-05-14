/**
 * POST /api/decisions/[id]/pmi-signals/extract
 *
 * Auto-extract PMI signal SUGGESTIONS from the container's most-recently
 * analyzed IC memo / synergy model / integration plan via deepseek-v4-flash
 * (Vercel AI Gateway). Returns suggestions; does NOT persist. The user
 * accepts / edits / overrides via PmiTrackerTab, then POSTs to the
 * canonical /pmi-signals endpoint to persist with full audit-log
 * coverage.
 *
 * Locked 2026-05-13 (M-3 ship). Closes the Tier 2.2 deferred follow-up:
 * "IC-memo PMI signal auto-extraction via deepseek-v4-flash (currently
 * the user types signals in by hand; LLM extraction would pre-populate
 * from IC memo content)".
 *
 * Architecture rule: this is an ASSIST endpoint. Authoritative capture
 * stays on POST /pmi-signals so the audit trail + idempotency + Brier
 * computation flow through one canonical path.
 *
 * Scoped to acquisition-mode containers only — mirrors the canonical
 * route's kind-check; returns 400 on other modes.
 *
 * Rate-limited 10/hr/user (gateway-cost protection on a non-essential
 * accelerator surface). Fail-soft: on extractor error the endpoint
 * returns `{ signals: [], llmSucceeded: false }` and the UI degrades
 * to the manual-entry flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { getDocumentContent } from '@/lib/utils/encryption';
import { extractPmiSignalsFromMemo } from '@/lib/pmi/extract-from-memo';

const log = createLogger('PmiExtractRoute');

/**
 * Document type priority for PMI extraction. Earlier in the list = better
 * match. The route picks the highest-priority analyzed document attached
 * to the container; falls back to most-recent analyzed doc if no
 * preferred type is attached.
 */
const PREFERRED_DOC_TYPES: ReadonlyArray<string> = [
  'ic_memo',
  'synergy_model',
  'integration_plan',
];

async function resolveOrgId(userId: string): Promise<string | null> {
  try {
    const m = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return m?.orgId ?? null;
  } catch {
    // canonical schema-drift / fail-soft — fallback to user-scoped lookup.
    return null;
  }
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit per-user: 10 extractions / hour (gateway-cost ceiling
    // on a non-essential accelerator surface; manual entry is unlimited).
    const rate = await checkRateLimit(user.id, 'pmi-extract', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
    });
    if (!rate.success) {
      const resetInMs = rate.reset - Date.now();
      return NextResponse.json(
        {
          error: `Rate limit exceeded — 10/hr. Try again in ${Math.max(1, Math.ceil(resetInMs / 60000))} min.`,
        },
        { status: 429 }
      );
    }

    const orgId = await resolveOrgId(user.id);

    const container = await prisma.decisionContainer.findFirst({
      where: {
        id,
        OR: orgId ? [{ ownerUserId: user.id }, { orgId }] : [{ ownerUserId: user.id }],
      },
      select: {
        id: true,
        kind: true,
        name: true,
      },
    });

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }
    if (container.kind !== 'acquisition') {
      return NextResponse.json(
        { error: 'PMI signal extraction is scoped to acquisition-mode containers' },
        { status: 400 }
      );
    }

    // Fetch container documents + their latest analysis. Done as a
    // separate query so the join-table relation type is concrete.
    const joinRows = await prisma.decisionContainerDocument.findMany({
      where: { containerId: container.id },
      select: {
        document: {
          select: {
            id: true,
            filename: true,
            documentType: true,
            content: true,
            contentEncrypted: true,
            contentIv: true,
            contentTag: true,
            contentKeyVersion: true,
            analyses: {
              select: { id: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const analyzedDocs = joinRows.map(r => r.document).filter(d => d.analyses.length > 0);

    if (analyzedDocs.length === 0) {
      return NextResponse.json(
        {
          error:
            'No analyzed documents on this container yet. Upload + analyze an IC memo / synergy model / integration plan first.',
        },
        { status: 400 }
      );
    }

    // Pick the best-fit analyzed document: prefer ic_memo > synergy_model
    // > integration_plan; fall back to most-recent analyzed doc.
    let pickedDoc = analyzedDocs.find(d =>
      d.documentType ? PREFERRED_DOC_TYPES.includes(d.documentType) : false
    );
    if (!pickedDoc) {
      // Most-recent analyzed doc by analysis createdAt.
      pickedDoc = [...analyzedDocs].sort(
        (a, b) =>
          (b.analyses[0]?.createdAt.getTime() ?? 0) - (a.analyses[0]?.createdAt.getTime() ?? 0)
      )[0];
    }
    if (!pickedDoc) {
      // Defensive — shouldn't happen given the early-return above.
      return NextResponse.json(
        { error: 'Could not resolve a memo for extraction' },
        { status: 500 }
      );
    }

    // Decrypt + read the document content (sync; encryption module
    // handles AES-256-GCM + key-version resolution).
    let content: string;
    try {
      content = getDocumentContent({
        content: pickedDoc.content,
        contentEncrypted: pickedDoc.contentEncrypted,
        contentIv: pickedDoc.contentIv,
        contentTag: pickedDoc.contentTag,
        contentKeyVersion: pickedDoc.contentKeyVersion,
      });
    } catch (err) {
      log.error('decrypt failed during PMI extraction', { err, documentId: pickedDoc.id });
      return NextResponse.json(
        { error: 'Document content unavailable (decryption fetch failed)' },
        { status: 500 }
      );
    }

    const result = await extractPmiSignalsFromMemo({
      content,
      documentType: pickedDoc.documentType,
      containerName: container.name,
    });

    // Audit log the EXTRACTION (separate action from PMI_SIGNAL_RECORDED
    // which fires on accept). Procurement readers can distinguish
    // "system suggested" from "user committed".
    await logAudit({
      action: 'PMI_SIGNAL_EXTRACT_ATTEMPTED',
      resource: 'DecisionContainer',
      resourceId: container.id,
      details: {
        documentId: pickedDoc.id,
        documentType: pickedDoc.documentType ?? 'unknown',
        signalCount: result.signals.length,
        llmSucceeded: result.llmSucceeded,
        contentChars: result.contentChars,
      },
    });

    return NextResponse.json({
      containerId: container.id,
      sourceDocument: {
        id: pickedDoc.id,
        filename: pickedDoc.filename,
        documentType: pickedDoc.documentType,
      },
      ...result,
    });
  } catch (error) {
    log.error('POST /pmi-signals/extract failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
