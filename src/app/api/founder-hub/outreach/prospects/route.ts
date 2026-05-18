/**
 * Wedge conversion ledger — list + create (locked 2026-05-18).
 *
 * GTM v3.5 Phase-1 motion mandate: "track conversion religiously."
 * Founder-only surface (x-founder-pass). One WedgeProspect row per
 * tracked prospect; the stage/persona/source enums are validated here
 * against the conversion-ledger + event-prep SSOTs (forward-compat
 * strings in the DB). Schema-drift-tolerant — pre-migration envs return
 * an empty list / a clear 503 rather than a 500.
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass as checkFounderPass } from '@/lib/utils/founder-auth';
import { logAudit } from '@/lib/audit';
import {
  isProspectSource,
  isFunnelStageId,
  stageTimestampField,
  type FunnelStageId,
} from '@/lib/outreach/conversion-ledger';
import { WEDGE_PERSONAS } from '@/lib/data/event-prep';

const log = createLogger('WedgeProspects');
const FOUNDER_USER_ID = 'founder';

function verifyFounderPass(req: NextRequest): boolean {
  return checkFounderPass(req.headers.get('x-founder-pass')).ok;
}

const VALID_PERSONAS = new Set<string>([...WEDGE_PERSONAS.map(p => p.id), 'other']);

/** True for the Prisma "table/column not migrated yet" error codes. */
function isSchemaDrift(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    (e.code === 'P2021' || e.code === 'P2022')
  );
}

export async function GET(req: NextRequest) {
  if (!verifyFounderPass(req)) {
    return apiError({ error: 'Unauthorized', status: 401 });
  }
  try {
    const prospects = await prisma.wedgeProspect.findMany({
      where: { userId: FOUNDER_USER_ID },
      orderBy: { updatedAt: 'desc' },
    });
    return apiSuccess({ data: { prospects } });
  } catch (e) {
    if (isSchemaDrift(e)) {
      // @schema-drift-tolerant — WedgeProspect table not migrated yet.
      log.warn('wedgeProspect table absent (pre-migration) — returning empty', e);
      return apiSuccess({ data: { prospects: [], schemaPending: true } });
    }
    log.error('list prospects failed', e);
    return apiError({ error: 'Could not load prospects', status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyFounderPass(req)) {
    return apiError({ error: 'Unauthorized', status: 401 });
  }

  const body = await req.json().catch(() => null); // canonical req-body-parse exception
  if (!body || typeof body !== 'object') {
    return apiError({ error: 'Invalid request body', status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2) {
    return apiError({ error: 'Prospect name is required', status: 400 });
  }
  const persona = typeof body.persona === 'string' ? body.persona : '';
  if (!VALID_PERSONAS.has(persona)) {
    return apiError({ error: 'Unknown persona', status: 400 });
  }
  const source = isProspectSource(body.source) ? body.source : 'linkedin_dm';
  // A new prospect normally enters at dm_sent; allow an explicit later
  // entry stage (e.g. a warm intro that opens directly at audit_booked).
  const stage: FunnelStageId = isFunnelStageId(body.stage) ? body.stage : 'dm_sent';

  const now = new Date();
  const tsField = stageTimestampField(stage);

  try {
    const created = await prisma.wedgeProspect.create({
      data: {
        userId: FOUNDER_USER_ID,
        name,
        company: typeof body.company === 'string' ? body.company.trim() || null : null,
        title: typeof body.title === 'string' ? body.title.trim() || null : null,
        persona,
        source,
        stage,
        anchorCaseSlug:
          typeof body.anchorCaseSlug === 'string' ? body.anchorCaseSlug.trim() || null : null,
        artifactId:
          typeof body.artifactId === 'string' ? body.artifactId.trim() || null : null,
        notes: typeof body.notes === 'string' ? body.notes.trim() || null : null,
        // Stamp the entry-stage timestamp at create time.
        [tsField]: now,
      },
    });
    await logAudit({
      action: 'PROSPECT_CREATED',
      resource: 'WedgeProspect',
      resourceId: created.id,
      details: { persona, source, stage },
    }).catch(err => log.warn('audit PROSPECT_CREATED failed', err));
    return apiSuccess({ data: { prospect: created } });
  } catch (e) {
    if (isSchemaDrift(e)) {
      // @schema-drift-tolerant — table not migrated yet; tell the caller plainly.
      log.warn('wedgeProspect.create — table absent (pre-migration)', e);
      return apiError({
        error: 'Conversion ledger not yet provisioned (migration pending)',
        status: 503,
      });
    }
    log.error('create prospect failed', e);
    return apiError({ error: 'Could not create prospect', status: 500 });
  }
}
