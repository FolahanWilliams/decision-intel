/**
 * GET /api/compliance/audit-packet/[analysisId]
 *
 * Generates a branded, tamper-evident Decision Provenance Record PDF for
 * a single analysis (server-side, plan-gated). Streams the PDF back as
 * a download.
 *
 * URL path kept as /audit-packet/ for backwards compatibility — external
 * integrations and existing deep links shouldn't break on the 2026-04-22
 * rename from "Audit Defense Packet" → "Decision Provenance Record."
 *
 * There is a parallel client-side generator at
 * /api/documents/[id]/provenance-record which produces the same artifact
 * class for design partners (richer data, not plan-gated). Follow-up
 * work will converge the two paths behind one implementation.
 *
 * Auth: user must own the analysis or belong to the same org.
 * Gating: requires Pro tier or higher (matches existing plan-limit pattern).
 * Audit: every export is logged to AuditLog with the record's SHA-256 hash
 *        so a compliance officer can later prove the record was generated
 *        from this specific source data at this specific time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { assessCompliance } from '@/lib/compliance/regulatory-graph';
import {
  AggregatePdfGenerator,
  type ProvenanceRecordInput,
} from '@/lib/reports/aggregate-pdf-generator';
import { getUserPlan, getOrgPlan } from '@/lib/utils/plan-limits';

const log = createLogger('AuditPacketExport');

export const dynamic = 'force-dynamic';

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

    // Fetch analysis + biases + document
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        biases: {
          select: {
            biasType: true,
            severity: true,
            confidence: true,
            excerpt: true,
          },
        },
        document: {
          select: {
            filename: true,
            userId: true,
            orgId: true,
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Ownership check: user owns the source document OR shares the org
    let orgName: string | null = null;
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
    if (analysis.document.orgId) {
      try {
        const org = await prisma.organization.findUnique({
          where: { id: analysis.document.orgId },
          select: { name: true },
        });
        orgName = org?.name ?? null;
      } catch {
        // Organization table may not exist — leave orgName null
      }
    }

    // Plan gating — Pro or higher. Prefer org plan if the analysis lives in an org.
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
        { status: 402 } // Payment Required
      );
    }

    // Run compliance assessment against all registered frameworks
    const assessmentInput = analysis.biases.map(b => ({
      type: b.biasType,
      severity: b.severity,
      confidence: b.confidence ?? 0.5,
    }));
    const assessments = assessCompliance(assessmentInput);

    // Build the packet
    const generator = new AggregatePdfGenerator();
    const input: ProvenanceRecordInput = {
      analysisId,
      documentFilename: analysis.document.filename,
      orgName,
      generatedAt: new Date(),
      overallScore: Math.round(analysis.overallScore),
      biasFindings: analysis.biases.map(b => ({
        biasType: b.biasType,
        severity: b.severity,
        confidence: b.confidence,
        excerpt: b.excerpt,
      })),
      assessments,
    };

    const { doc, filename, hash } = generator.generateProvenanceRecord(input);

    // Get the raw PDF bytes (arraybuffer) for the HTTP response
    const pdfArrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    const pdfBytes = new Uint8Array(pdfArrayBuffer);

    // Audit trail — provable record of export for downstream compliance attestation
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          orgId: analysis.document.orgId ?? 'personal',
          action: 'audit_packet.export',
          resource: 'analysis',
          resourceId: analysisId,
          details: {
            hash,
            filename,
            frameworksTriggered: assessments
              .filter(a => a.triggeredProvisions.length > 0)
              .map(a => a.framework.id),
            biasCount: analysis.biases.length,
            overallScore: Math.round(analysis.overallScore),
          },
        },
      });
    } catch (auditErr) {
      log.warn('Failed to write AuditLog entry (non-fatal):', auditErr);
    }

    log.info(
      `Decision Provenance Record exported: analysis=${analysisId} hash=${hash.slice(0, 12)}… plan=${effectivePlan}`
    );

    // Return the PDF as a streaming download
    return new NextResponse(pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Audit-Packet-Hash': hash,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift during provenance record export:', code);
      return NextResponse.json(
        { error: 'Decision Provenance Record not yet available. Database migration pending.' },
        { status: 503, headers: { 'Retry-After': '300' } }
      );
    }
    log.error('GET /api/compliance/audit-packet/[analysisId] failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
