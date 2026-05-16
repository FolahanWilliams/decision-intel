/**
 * /api/containers/[id] — read / update / delete a single DecisionContainer.
 *
 * Read returns ContainerDetail with full member doc roster + latest
 * cross-reference + outcome + aggregated bias signature. Update accepts
 * a partial mode-aware patch (validated against CONTAINER_MODES for
 * stageId). Delete is soft-archive only — hard-delete is reserved for
 * an admin path that doesn't exist yet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import {
  getContainerMode,
  validateStageTransition,
  type DecisionContainerKind,
} from '@/lib/data/decision-container-modes';
import { aggregateAnalyses, type AnalyzedDocument } from '@/lib/scoring/container-aggregation';
import type {
  ContainerDetail,
  ContainerUpdateInput,
  ContainerDocumentRef,
  ContainerCrossReferenceFinding,
} from '@/types/containers';

const log = createLogger('ContainerDetailRoute');

async function resolveOrgId(userId: string): Promise<string | null> {
  try {
    const m = await prisma.teamMember.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    return m?.orgId ?? null;
  } catch {
    return null;
  }
}

async function loadContainerForUser(containerId: string, userId: string, orgId: string | null) {
  return prisma.decisionContainer.findFirst({
    where: {
      id: containerId,
      OR: [{ orgId: orgId ?? undefined }, { ownerUserId: userId }],
    },
    include: {
      documents: {
        orderBy: { position: 'asc' },
        include: {
          document: {
            select: {
              id: true,
              filename: true,
              documentType: true,
              fileType: true,
              fileSize: true,
              uploadedAt: true,
              status: true,
              deletedAt: true,
              analyses: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  id: true,
                  overallScore: true,
                  noiseScore: true,
                  summary: true,
                  createdAt: true,
                  biases: {
                    select: { biasType: true, severity: true },
                  },
                  toxicCombinations: {
                    select: { patternLabel: true, severity: true, toxicScore: true },
                  },
                },
              },
            },
          },
        },
      },
      outcome: true,
      crossReferences: {
        orderBy: { runAt: 'desc' },
        take: 1,
      },
    },
  });
}

// ─── GET — detail ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await resolveOrgId(user.id);
    const row = await loadContainerForUser(id, user.id, orgId);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Build the AnalyzedDocument shape for aggregation (mirrors
    // recomputeContainerMetrics — we keep one path canonical).
    const docs: AnalyzedDocument[] = row.documents
      .filter(m => m.document.deletedAt == null)
      .map(m => {
        const a = m.document.analyses[0] ?? null;
        return {
          documentId: m.document.id,
          filename: m.document.filename,
          documentType: m.document.documentType,
          latestAnalysis: a
            ? {
                id: a.id,
                overallScore: a.overallScore,
                biases: a.biases.map(b => ({
                  biasType: b.biasType,
                  severity: b.severity ?? 'medium',
                })),
              }
            : null,
          toxicCombinations:
            a?.toxicCombinations.map(c => ({
              patternLabel: c.patternLabel ?? 'unknown',
              severity: c.severity ?? 'medium',
              toxicScore: c.toxicScore,
            })) ?? [],
        };
      });

    const aggregation = aggregateAnalyses(docs);

    const memberRefs: ContainerDocumentRef[] = row.documents.map(m => ({
      id: m.id,
      containerId: row.id,
      documentId: m.documentId,
      role: m.role,
      position: m.position,
      addedAt: m.addedAt.toISOString(),
      document: {
        id: m.document.id,
        filename: m.document.filename,
        documentType: m.document.documentType,
        fileType: m.document.fileType,
        fileSize: m.document.fileSize,
        uploadedAt: m.document.uploadedAt.toISOString(),
        status: m.document.status,
        latestAnalysis: m.document.analyses[0]
          ? {
              id: m.document.analyses[0].id,
              overallScore: m.document.analyses[0].overallScore,
              noiseScore: m.document.analyses[0].noiseScore,
              summary: m.document.analyses[0].summary,
              createdAt: m.document.analyses[0].createdAt.toISOString(),
              biasCount: m.document.analyses[0].biases.length,
            }
          : null,
      },
    }));

    const latestCr = row.crossReferences[0] ?? null;

    const detail: ContainerDetail = {
      id: row.id,
      orgId: row.orgId,
      ownerUserId: row.ownerUserId,
      kind: row.kind as DecisionContainerKind,
      name: row.name,
      decisionFrame: row.decisionFrame,
      stageId: row.stageId,
      status: row.status,
      decidedAt: row.decidedAt?.toISOString() ?? null,
      committeeDate: row.committeeDate?.toISOString() ?? null,
      fundName: row.fundName,
      vintage: row.vintage,
      dealType: row.dealType,
      ticketSize: row.ticketSize != null ? Number(row.ticketSize) : null,
      currency: row.currency,
      targetCompany: row.targetCompany,
      sector: row.sector,
      exitDate: row.exitDate?.toISOString() ?? null,
      compositeDqi: row.compositeDqi,
      compositeGrade: row.compositeGrade,
      documentCount: row.documentCount,
      analyzedDocCount: row.analyzedDocCount,
      recurringBiasCount: row.recurringBiasCount,
      conflictCount: row.conflictCount,
      highSeverityConflictCount: row.highSeverityConflictCount,
      crossRefConflictCount: latestCr?.conflictCount ?? 0,
      crossRefHighSeverityCount: latestCr?.highSeverityCount ?? 0,
      updatedAt: row.updatedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      // 2026-05-10 priors + cultural-pairing extensions. Both fields
      // are JSONB on Prisma; cast through unknown to the typed shape
      // declared on ContainerSummary. Null when not yet captured.
      priors: (row.priors as ContainerDetail['priors']) ?? null,
      culturalPairingRisk:
        (row.culturalPairingRisk as ContainerDetail['culturalPairingRisk']) ?? null,
      premortemDefence:
        (row.premortemDefence as ContainerDetail['premortemDefence']) ?? null,
      documents: memberRefs,
      outcome: row.outcome
        ? {
            id: row.outcome.id,
            containerId: row.outcome.containerId,
            summary: row.outcome.summary,
            metrics: row.outcome.metrics as Record<string, unknown>,
            realisedDqi: row.outcome.realisedDqi,
            brierScore: row.outcome.brierScore,
            reportedAt: row.outcome.reportedAt.toISOString(),
            reportedByUserId: row.outcome.reportedByUserId,
          }
        : null,
      latestCrossReference: latestCr
        ? {
            id: latestCr.id,
            containerId: latestCr.containerId,
            runAt: latestCr.runAt.toISOString(),
            modelVersion: latestCr.modelVersion,
            documentSnapshot: latestCr.documentSnapshot as Array<{
              documentId: string;
              analysisId: string;
            }>,
            findings: latestCr.findings as unknown as
              | ContainerCrossReferenceFinding[]
              | { findings: ContainerCrossReferenceFinding[]; summary?: string },
            conflictCount: latestCr.conflictCount,
            highSeverityCount: latestCr.highSeverityCount,
            status: latestCr.status as 'running' | 'complete' | 'error',
            errorMessage: latestCr.errorMessage,
          }
        : null,
      aggregation: {
        allBiases: aggregation.allBiases,
        namedPatterns: aggregation.namedPatterns,
        criticalPatternCount: aggregation.criticalPatternCount,
        highPatternCount: aggregation.highPatternCount,
      },
    };

    return NextResponse.json(detail);
  } catch (error) {
    log.error('GET /api/containers/[id] failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── PATCH — update ─────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await resolveOrgId(user.id);
    const existing = await prisma.decisionContainer.findFirst({
      where: { id, OR: [{ orgId: orgId ?? undefined }, { ownerUserId: user.id }] },
      select: { id: true, kind: true, ownerUserId: true, stageId: true, decidedAt: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = (await request.json().catch(() => null)) as ContainerUpdateInput | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const updates: Prisma.DecisionContainerUpdateInput = {};
    if (typeof body.name === 'string' && body.name.trim().length > 0)
      updates.name = body.name.trim();
    if (body.decisionFrame !== undefined)
      updates.decisionFrame = body.decisionFrame?.trim() || null;
    if (body.stageId && body.stageId !== existing.stageId) {
      const kind = existing.kind as DecisionContainerKind;
      const mode = getContainerMode(kind);

      // V5 — rigid stage-gated schema. Fetch the attached doc types so
      // the committee-gate doc requirement can be enforced. Schema-drift-
      // tolerant: a transient join-query failure falls back to the legacy
      // "valid stage id" check (fail-open on a UX gate, not a security
      // boundary — the client also guides with the same pure validator).
      let attachedDocTypes: string[] = [];
      let docLookupOk = true;
      try {
        const rows = await prisma.decisionContainerDocument.findMany({
          where: { containerId: id },
          select: { document: { select: { documentType: true, deletedAt: true } } },
        });
        attachedDocTypes = rows
          .filter(r => r.document.deletedAt == null)
          .map(r => r.document.documentType)
          .filter((d): d is string => d != null);
      } catch (err) {
        docLookupOk = false;
        log.warn('Stage-transition doc lookup failed; falling back to id-only check:', err);
      }

      if (docLookupOk) {
        const verdict = validateStageTransition({
          kind,
          fromStageId: existing.stageId,
          toStageId: body.stageId,
          attachedDocTypes,
        });
        if (!verdict.allowed) {
          return NextResponse.json(
            { error: verdict.reason ?? 'Stage transition not allowed', code: 'STAGE_TRANSITION_BLOCKED' },
            { status: 400 }
          );
        }
      } else if (!mode.stages.find(s => s.id === body.stageId)) {
        return NextResponse.json(
          { error: `Invalid stageId for kind ${existing.kind}` },
          { status: 400 }
        );
      }

      updates.stageId = body.stageId;
      // When the stage moves past the committee gate for the first time,
      // stamp decidedAt.
      const stage = mode.stages.find(s => s.id === body.stageId);
      if (
        (stage?.phase === 'committee_gate' || stage?.phase === 'post_committee') &&
        !existing.decidedAt
      ) {
        updates.decidedAt = new Date();
      }
    }
    if (body.status === 'active' || body.status === 'archived') updates.status = body.status;
    if (body.fundName !== undefined) updates.fundName = body.fundName?.trim() || null;
    if (body.vintage !== undefined) updates.vintage = body.vintage ?? null;
    if (body.dealType !== undefined) updates.dealType = body.dealType?.trim() || null;
    if (body.ticketSize !== undefined) {
      updates.ticketSize = body.ticketSize != null ? new Prisma.Decimal(body.ticketSize) : null;
    }
    if (body.currency) updates.currency = body.currency;
    if (body.targetCompany !== undefined)
      updates.targetCompany = body.targetCompany?.trim() || null;
    if (body.sector !== undefined) updates.sector = body.sector?.trim() || null;
    if (body.committeeDate !== undefined) {
      updates.committeeDate = body.committeeDate ? new Date(body.committeeDate) : null;
    }
    if (body.exitDate !== undefined) {
      updates.exitDate = body.exitDate ? new Date(body.exitDate) : null;
    }
    if (body.visibility) updates.visibility = body.visibility;
    if (body.decidedAt !== undefined) {
      updates.decidedAt = body.decidedAt ? new Date(body.decidedAt) : null;
    }

    const updated = await prisma.decisionContainer.update({
      where: { id },
      data: updates,
    });

    await logAudit({
      action: 'CONTAINER_UPDATED',
      resource: 'decision_container',
      resourceId: id,
      details: { fields: Object.keys(updates) },
    }).catch(err => log.warn('Audit log for container update failed:', err));

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (error) {
    log.error('PATCH /api/containers/[id] failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── DELETE — archive (soft) ────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await resolveOrgId(user.id);
    const existing = await prisma.decisionContainer.findFirst({
      where: { id, OR: [{ orgId: orgId ?? undefined }, { ownerUserId: user.id }] },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.decisionContainer.update({
      where: { id },
      data: { status: 'archived' },
    });

    await logAudit({
      action: 'CONTAINER_ARCHIVED',
      resource: 'decision_container',
      resourceId: id,
    }).catch(err => log.warn('Audit log for container archive failed:', err));

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('DELETE /api/containers/[id] failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
