/**
 * GET /api/compliance/audit-packet/[analysisId]
 *
 * Thin server-side wrapper around the canonical Decision Provenance Record
 * pipeline. Streams a signed, hashed PDF for a single analysis.
 *
 * URL path kept stable for backwards compatibility — any external deep
 * link or bookmarked "Audit Defense Packet" URL still resolves. The
 * PDF itself is titled "Decision Provenance Record" per the 2026-04-22
 * rename.
 *
 * Convergence (2026-04-23): previously this route used its own
 * AggregatePdfGenerator.generateProvenanceRecord() path, which produced
 * a thinner artifact than the newer /api/documents/[id]/provenance-record
 * route. Both now flow through assembleProvenanceRecordData() +
 * DecisionProvenanceRecordGenerator so a GC never sees two different
 * artifact shapes depending on which button they clicked.
 *
 * Auth:   Supabase session required; caller must own the analysis or
 *         share its org.
 * Gating: Pro plan or higher (free tier is blocked with a 402 upgrade
 *         hint; matches the prior contract).
 * Audit:  every export writes an AuditLog row stamped with the record's
 *         input-hash + prompt fingerprint so a compliance officer can
 *         later prove the record was generated from this source data at
 *         this specific time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createLogger } from '@/lib/utils/logger';
import { assembleProvenanceRecordData } from '@/lib/reports/provenance-record-data';
import { DecisionProvenanceRecordGenerator } from '@/lib/reports/decision-provenance-record-generator';
import { getUserPlan, getOrgPlan } from '@/lib/utils/plan-limits';

const log = createLogger('DprExport');

export const dynamic = 'force-dynamic';

function safeFilename(raw: string): string {
  return raw
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .slice(0, 64);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisId } = await params;
    if (!analysisId || typeof analysisId !== 'string') {
      return NextResponse.json({ error: 'analysisId is required' }, { status: 400 });
    }

    // Ownership check — resolve analysis → document → (userId | orgId).
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: {
        id: true,
        document: { select: { id: true, userId: true, orgId: true } },
      },
    });
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    if (analysis.document.userId !== user.id) {
      if (!analysis.document.orgId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id, orgId: analysis.document.orgId },
        select: { orgId: true },
      });
      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Plan gate — Pro+ for the server-streamed download. Org plan wins
    // when the analysis lives in an org, so team seats inherit access.
    const effectivePlan = analysis.document.orgId
      ? await getOrgPlan(analysis.document.orgId)
      : await getUserPlan(user.id);
    if (effectivePlan === 'free') {
      return NextResponse.json(
        {
          error: 'UPGRADE_REQUIRED',
          message:
            'Decision Provenance Record export requires the Pro plan or higher. Upgrade to unlock regulator-grade compliance reports.',
          requiredPlan: 'pro',
        },
        { status: 402 }
      );
    }

    // Canonical path: assemble → generate → persist record for archive.
    const data = await assembleProvenanceRecordData(analysisId);

    try {
      await prisma.decisionProvenanceRecord.upsert({
        where: { analysisId: data.analysisId },
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
    } catch (persistErr) {
      // Persistence is best-effort for this route — the canonical "generate
      // and persist" path is the client-side button. If the upsert fails
      // (schema drift during migration window), still serve the PDF.
      log.warn('DPR upsert failed on server export (non-fatal):', persistErr);
    }

    const generator = new DecisionProvenanceRecordGenerator();
    const doc = generator.generate(data);
    const pdfArrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    const pdfBytes = new Uint8Array(pdfArrayBuffer);

    const filename = `DPR-${safeFilename(data.meta.filename)}-${data.analysisId.slice(0, 8)}.pdf`;

    // AuditLog — the "proof the record was generated from this source".
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          orgId: analysis.document.orgId ?? 'personal',
          action: 'dpr.export',
          resource: 'analysis',
          resourceId: analysisId,
          details: {
            inputHash: data.inputHash,
            promptFingerprint: data.promptFingerprint,
            filename,
            schemaVersion: data.schemaVersion,
            biasCount: data.meta.biasCount,
            overallScore: data.meta.overallScore,
            channel: 'compliance.audit-packet',
          },
        },
      });
    } catch (auditErr) {
      log.warn('Failed to write AuditLog entry (non-fatal):', auditErr);
    }

    log.info(
      `DPR exported (compliance channel): analysis=${analysisId} inputHash=${data.inputHash.slice(0, 12)}… plan=${effectivePlan}`
    );

    return new NextResponse(pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Dpr-Input-Hash': data.inputHash,
        'X-Dpr-Prompt-Fingerprint': data.promptFingerprint,
        // Legacy header retained for any external caller that parsed it.
        'X-Audit-Packet-Hash': data.inputHash,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift during DPR export:', code);
      return NextResponse.json(
        { error: 'Decision Provenance Record not yet available. Database migration pending.' },
        { status: 503, headers: { 'Retry-After': '300' } }
      );
    }
    log.error('GET /api/compliance/audit-packet/[analysisId] failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
