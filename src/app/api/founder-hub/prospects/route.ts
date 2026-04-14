/**
 * GET  /api/founder-hub/prospects  — list all non-archived prospects
 * POST /api/founder-hub/prospects  — create a new prospect
 *
 * Auth: x-founder-pass header.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

const log = createLogger('FounderProspects');

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

export async function GET(req: NextRequest) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('status') || 'all';

  try {
    const where =
      filter === 'all'
        ? { status: { not: 'archived' } }
        : filter === 'followup_due'
        ? {
            status: 'cold',
            followUpDue: { lte: new Date() },
          }
        : { status: filter };

    const prospects = await prisma.founderProspect.findMany({
      where,
      orderBy: [{ followUpDue: 'asc' }, { createdAt: 'desc' }],
    });

    return apiSuccess({ data: { prospects } });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      return apiSuccess({ data: { prospects: [] } });
    }
    log.error('Failed to fetch prospects', err);
    return apiError({ error: 'Failed to fetch prospects', status: 500 });
  }
}

interface CreateBody {
  name: string;
  company?: string;
  role?: string;
  linkedInUrl?: string;
  intent: string;
  notes?: string;
  sourceArtifactId?: string;
}

export async function POST(req: NextRequest) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return apiError({ error: 'Invalid JSON', status: 400 });
  }

  if (!body.name?.trim()) return apiError({ error: 'name is required', status: 400 });
  if (!body.intent) return apiError({ error: 'intent is required', status: 400 });

  const followUpDue = new Date();
  followUpDue.setDate(followUpDue.getDate() + 5);

  try {
    const prospect = await prisma.founderProspect.create({
      data: {
        name: body.name.trim(),
        company: body.company?.trim() || null,
        role: body.role?.trim() || null,
        linkedInUrl: body.linkedInUrl?.trim() || null,
        intent: body.intent,
        status: 'cold',
        followUpDue,
        notes: body.notes?.trim() || null,
        sourceArtifactId: body.sourceArtifactId || null,
      },
    });
    return apiSuccess({ data: { prospect } });
  } catch (err) {
    log.error('Failed to create prospect', err);
    return apiError({ error: 'Failed to create prospect', status: 500 });
  }
}
