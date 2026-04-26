/**
 * Decision Provenance Record — document-scoped API.
 *
 * POST  /api/documents/[id]/provenance-record
 *   Assembles the provenance record for the most recent analysis on this
 *   document, persists it (upsert), and returns the record data JSON.
 *   The client then uses the JSON with DecisionProvenanceRecordGenerator
 *   to produce the PDF client-side (jsPDF lives in the browser).
 *
 * GET   /api/documents/[id]/provenance-record
 *   Returns the stored record for this document's most recent analysis,
 *   or 404 if no record has been generated yet.
 *
 * Auth: Supabase session required. Must own the document OR be a member
 * of the document's org (matches the doc detail route's access rule).
 *
 * Renamed from /defense-packet on 2026-04-22 — "provenance" maps directly
 * onto EU AI Act Article 14 record-keeping, SEC AI disclosure language,
 * and Basel III ICAAP documentation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createLogger } from '@/lib/utils/logger';
import { assembleProvenanceRecordData } from '@/lib/reports/provenance-record-data';
import { DecisionProvenanceRecordGenerator } from '@/lib/reports/decision-provenance-record-generator';
import { getUserPlan, getOrgPlan } from '@/lib/utils/plan-limits';
import { buildDocumentAccessWhere } from '@/lib/utils/document-access';
import { notifyExternalDprDownload } from '@/lib/notifications/dpr-share-alert';

const log = createLogger('ProvenanceRecordRoute');

async function getAuthorizedAnalysisId(documentId: string): Promise<
  | {
      ok: true;
      analysisId: string;
      userId: string;
      orgId: string | null;
      documentOwnerUserId: string;
    }
  | { ok: false; status: number; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return { ok: false, status: 401, error: 'Unauthorized' };

  // RBAC (3.5): visibility-aware. The DPR includes the full audit packet,
  // so the same access bar as analysis-export applies.
  const access = await buildDocumentAccessWhere(documentId, user.id);
  const doc = await prisma.document.findFirst({
    where: access.where,
    select: { id: true, userId: true, orgId: true },
  });
  if (!doc) return { ok: false, status: 404, error: 'Document not found' };

  const analysis = await prisma.analysis.findFirst({
    where: { documentId: documentId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (!analysis)
    return { ok: false, status: 409, error: 'Document has no completed analysis yet.' };

  return {
    ok: true,
    analysisId: analysis.id,
    userId: user.id,
    orgId: doc.orgId,
    documentOwnerUserId: doc.userId,
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthorizedAnalysisId(id);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const url = new URL(req.url);
    const format = url.searchParams.get('format');
    // Client-Safe Export Mode (DPR v2 #5) — opt-in via ?clientSafe=1 on
    // the export URL. When enabled, entity names, amounts, and person
    // names in the rendered meta strip + summary + reviewer notes are
    // replaced with stable placeholders so the artefact can be shared
    // with an LP, regulator, or third-party assurance firm without
    // leaking the underlying competitive intelligence.
    const clientSafe = url.searchParams.get('clientSafe') === '1';

    // format=pdf: assemble → stream a signed PDF. Same plan gate + audit
    // log as /api/compliance/audit-packet/[analysisId]; doc-scoped surface
    // so the document-list row only needs doc.id.
    if (format === 'pdf') {
      const effectivePlan = auth.orgId
        ? await getOrgPlan(auth.orgId)
        : await getUserPlan(auth.userId);
      if (effectivePlan === 'free') {
        return NextResponse.json(
          {
            error: 'UPGRADE_REQUIRED',
            message: 'Decision Provenance Record export requires the Pro plan or higher.',
            requiredPlan: 'pro',
          },
          { status: 402 }
        );
      }

      const data = await assembleProvenanceRecordData(auth.analysisId);
      const generator = new DecisionProvenanceRecordGenerator();
      const doc = generator.generate(data, { clientSafe });
      const pdfArrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
      const pdfBytes = new Uint8Array(pdfArrayBuffer);

      const safeName = data.meta.filename
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-z0-9-_]+/gi, '-')
        .slice(0, 64);
      const filename = `DPR-${safeName}-${data.analysisId.slice(0, 8)}.pdf`;

      try {
        await prisma.auditLog.create({
          data: {
            userId: auth.userId,
            orgId: auth.orgId ?? 'personal',
            action: 'dpr.export',
            resource: 'analysis',
            resourceId: auth.analysisId,
            details: {
              inputHash: data.inputHash,
              promptFingerprint: data.promptFingerprint,
              filename,
              schemaVersion: data.schemaVersion,
              biasCount: data.meta.biasCount,
              overallScore: data.meta.overallScore,
              channel: 'documents.provenance-record',
            },
          },
        });
      } catch (auditErr) {
        log.warn('AuditLog write failed on DPR pdf export (non-fatal):', auditErr);
      }

      // External-share alert: fire-and-forget email to FOUNDER_EMAIL when the
      // downloader is NOT the original document owner. This is the highest-
      // value conversion signal in the product (es_8 metric #3, es_10).
      // Helper handles the self-download skip + missing-FOUNDER_EMAIL skip
      // internally and never throws.
      void notifyExternalDprDownload({
        resourceType: 'document',
        resourceId: id,
        rootId: auth.analysisId,
        downloaderUserId: auth.userId,
        originalAuditorUserId: auth.documentOwnerUserId,
        filename,
        context: auth.orgId ? `Org-scoped (orgId: ${auth.orgId})` : 'Personal account',
        inputHash: data.inputHash,
      });

      return new NextResponse(pdfBytes as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Dpr-Input-Hash': data.inputHash,
          'X-Dpr-Prompt-Fingerprint': data.promptFingerprint,
          'Cache-Control': 'private, no-store',
        },
      });
    }

    // Default: return the persisted JSON record.
    const record = await prisma.decisionProvenanceRecord.findUnique({
      where: { analysisId: auth.analysisId },
    });
    if (!record)
      return NextResponse.json(
        { error: 'No provenance record has been generated yet.' },
        { status: 404 }
      );

    return NextResponse.json({ record });
  } catch (err) {
    log.error('GET provenance-record failed:', err);
    return NextResponse.json({ error: 'Failed to load provenance record.' }, { status: 500 });
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthorizedAnalysisId(id);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const data = await assembleProvenanceRecordData(auth.analysisId);

    // Persist (upsert) — one record per analysis.
    const persisted = await prisma.decisionProvenanceRecord.upsert({
      where: { analysisId: auth.analysisId },
      create: {
        analysisId: data.analysisId,
        documentId: data.documentId,
        userId: data.userId,
        orgId: data.orgId,
        promptFingerprint: data.promptFingerprint,
        inputHash: data.inputHash,
        modelLineage: data.modelLineage as unknown as Prisma.InputJsonValue,
        judgeVariance: data.judgeVariance as unknown as Prisma.InputJsonValue,
        citations: data.citations as unknown as Prisma.InputJsonValue,
        regulatoryMapping: data.regulatoryMapping as unknown as Prisma.InputJsonValue,
        pipelineLineage: data.pipelineLineage as unknown as Prisma.InputJsonValue,
        schemaVersion: data.schemaVersion,
        generatedAt: data.generatedAt,
      },
      update: {
        promptFingerprint: data.promptFingerprint,
        inputHash: data.inputHash,
        modelLineage: data.modelLineage as unknown as Prisma.InputJsonValue,
        judgeVariance: data.judgeVariance as unknown as Prisma.InputJsonValue,
        citations: data.citations as unknown as Prisma.InputJsonValue,
        regulatoryMapping: data.regulatoryMapping as unknown as Prisma.InputJsonValue,
        pipelineLineage: data.pipelineLineage as unknown as Prisma.InputJsonValue,
        schemaVersion: data.schemaVersion,
        generatedAt: data.generatedAt,
      },
    });

    log.info(`Provenance record generated for analysis ${auth.analysisId} (doc ${id})`);

    // Return both the persisted row and the full assembled data (with
    // meta) so the client can hand `data` straight to the PDF generator.
    return NextResponse.json({ record: persisted, data });
  } catch (err) {
    log.error('POST provenance-record failed:', err);
    return NextResponse.json({ error: 'Failed to generate provenance record.' }, { status: 500 });
  }
}
