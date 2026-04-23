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

const log = createLogger('ProvenanceRecordRoute');

async function getAuthorizedAnalysisId(
  documentId: string
): Promise<
  | { ok: true; analysisId: string; userId: string; orgId: string | null }
  | { ok: false; status: number; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return { ok: false, status: 401, error: 'Unauthorized' };

  // Scope: owner OR same org (mirrors doc detail route).
  let orgId: string | null = null;
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      select: { orgId: true },
    });
    orgId = membership?.orgId ?? null;
  } catch {
    // Schema drift — continue with userId-only scope.
  }

  const doc = await prisma.document.findFirst({
    where: orgId
      ? { id: documentId, OR: [{ userId: user.id }, { orgId }] }
      : { id: documentId, userId: user.id },
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

  return { ok: true, analysisId: analysis.id, userId: user.id, orgId: doc.orgId };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthorizedAnalysisId(id);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const format = new URL(req.url).searchParams.get('format');

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
            message:
              'Decision Provenance Record export requires the Pro plan or higher.',
            requiredPlan: 'pro',
          },
          { status: 402 }
        );
      }

      const data = await assembleProvenanceRecordData(auth.analysisId);
      const generator = new DecisionProvenanceRecordGenerator();
      const doc = generator.generate(data);
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
