/**
 * Wedge conversion ledger — stage transition / notes / delete
 * (locked 2026-05-18). Founder-only (x-founder-pass). Stage moves are
 * validated against the conversion-ledger SSOT `isValidStageTransition`
 * (never inline the rule) and stamp the matching per-stage timestamp.
 * Schema-drift-tolerant.
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass as checkFounderPass } from '@/lib/utils/founder-auth';
import { logAudit, type AuditAction } from '@/lib/audit';
import {
  isFunnelStageId,
  isValidStageTransition,
  stageTimestampField,
  type FunnelStageId,
} from '@/lib/outreach/conversion-ledger';

const log = createLogger('WedgeProspect');
const FOUNDER_USER_ID = 'founder';

function verifyFounderPass(req: NextRequest): boolean {
  return checkFounderPass(req.headers.get('x-founder-pass')).ok;
}

function isSchemaDrift(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && (e.code === 'P2021' || e.code === 'P2022')
  );
}

/** Which audit action a transition INTO this stage records. */
function auditActionForStage(stage: FunnelStageId): AuditAction {
  if (stage === 'converted') return 'PROSPECT_CONVERTED';
  if (stage === 'lost') return 'PROSPECT_LOST';
  return 'PROSPECT_STAGE_ADVANCED';
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyFounderPass(req)) {
    return apiError({ error: 'Unauthorized', status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null); // canonical req-body-parse exception
  if (!body || typeof body !== 'object') {
    return apiError({ error: 'Invalid request body', status: 400 });
  }

  try {
    const existing = await prisma.wedgeProspect.findFirst({
      where: { id, userId: FOUNDER_USER_ID },
    });
    if (!existing) {
      return apiError({ error: 'Prospect not found', status: 404 });
    }

    const data: Prisma.WedgeProspectUpdateInput = {};
    let transitioned: FunnelStageId | null = null;

    if (body.stage !== undefined) {
      if (!isFunnelStageId(body.stage)) {
        return apiError({ error: 'Unknown stage', status: 400 });
      }
      const from = existing.stage;
      const to = body.stage as FunnelStageId;
      if (!isFunnelStageId(from)) {
        // Legacy/corrupt row — allow re-anchoring to a valid stage.
        data.stage = to;
        data[stageTimestampField(to)] = new Date();
        transitioned = to;
      } else if (from === to) {
        // No-op stage; notes/lostReason-only edit falls through below.
      } else if (!isValidStageTransition(from, to)) {
        return apiError({
          error: `Illegal transition ${from} → ${to} (forward-only; lost from any active; terminal stays terminal)`,
          status: 409,
        });
      } else {
        data.stage = to;
        data[stageTimestampField(to)] = new Date();
        transitioned = to;
      }
    }

    if (typeof body.notes === 'string') {
      data.notes = body.notes.trim() || null;
    }
    if (typeof body.lostReason === 'string') {
      data.lostReason = body.lostReason.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return apiError({ error: 'Nothing to update', status: 400 });
    }

    const updated = await prisma.wedgeProspect.update({
      where: { id },
      data,
    });

    if (transitioned) {
      await logAudit({
        action: auditActionForStage(transitioned),
        resource: 'WedgeProspect',
        resourceId: id,
        details: { from: existing.stage, to: transitioned },
      }).catch(err => log.warn('audit prospect transition failed', err));
    }
    return apiSuccess({ data: { prospect: updated } });
  } catch (e) {
    if (isSchemaDrift(e)) {
      // @schema-drift-tolerant — table not migrated yet.
      log.warn('wedgeProspect.update — table absent (pre-migration)', e);
      return apiError({
        error: 'Conversion ledger not yet provisioned (migration pending)',
        status: 503,
      });
    }
    log.error('update prospect failed', e);
    return apiError({ error: 'Could not update prospect', status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyFounderPass(req)) {
    return apiError({ error: 'Unauthorized', status: 401 });
  }
  const { id } = await params;
  try {
    const existing = await prisma.wedgeProspect.findFirst({
      where: { id, userId: FOUNDER_USER_ID },
      select: { id: true },
    });
    if (!existing) {
      return apiError({ error: 'Prospect not found', status: 404 });
    }
    await prisma.wedgeProspect.delete({ where: { id } });
    await logAudit({
      action: 'PROSPECT_DELETED',
      resource: 'WedgeProspect',
      resourceId: id,
    }).catch(err => log.warn('audit PROSPECT_DELETED failed', err));
    return apiSuccess({ data: { deleted: true } });
  } catch (e) {
    if (isSchemaDrift(e)) {
      // @schema-drift-tolerant — table not migrated yet.
      log.warn('wedgeProspect.delete — table absent (pre-migration)', e);
      return apiError({
        error: 'Conversion ledger not yet provisioned (migration pending)',
        status: 503,
      });
    }
    log.error('delete prospect failed', e);
    return apiError({ error: 'Could not delete prospect', status: 500 });
  }
}
