/**
 * GTM v3.5 — Micro-deliberation outcome API.
 *
 * GET /api/micro-deliberation?analysisId=...
 *   List the user's logged micro-deliberation events for one analysis.
 *
 * POST /api/micro-deliberation
 *   Body: { analysisId, eventType, targetBiasId?, predictedReaction,
 *           actualReaction?, confirmed?, predictedConfidence?,
 *           happenedAt? (ISO), notes? }
 *   Records a single micro-deliberation event tied to an analysis.
 *   Server-side validates that the analysis belongs to the authenticated
 *   user before writing.
 *
 * Designed for fast capture during / immediately after an IC discussion or
 * board review meeting. Solo founder using DI on their own memo: ~30 seconds
 * per event. Sankore-style design partner team: 5-10 events per IC vote.
 */

import { authenticateApiRequest } from '@/lib/utils/api-auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import {
  captureMicroDeliberation,
  isMicroDeliberationEventType,
  listMicroDeliberationsForAnalysis,
} from '@/lib/learning/micro-deliberation';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('MicroDeliberationApi');

export const dynamic = 'force-dynamic';

interface PostBody {
  analysisId?: string;
  eventType?: string;
  targetBiasId?: string | null;
  predictedReaction?: string;
  actualReaction?: string | null;
  confirmed?: boolean | null;
  predictedConfidence?: number | null;
  happenedAt?: string | null;
  notes?: string | null;
}

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (auth.error || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const analysisId = url.searchParams.get('analysisId');
  if (!analysisId) {
    return apiError({ error: 'analysisId query param required', status: 400 });
  }

  try {
    const events = await listMicroDeliberationsForAnalysis(analysisId, auth.userId);
    return apiSuccess({ data: { events } });
  } catch (err) {
    log.warn('list failed:', err);
    return apiSuccess({ data: { events: [] } });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (auth.error || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const limit = await checkRateLimit(auth.userId, 'micro-deliberation', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 60,
    failMode: 'closed',
  });
  if (!limit.success) {
    return apiError({ error: 'Too many submissions; try again later', status: 429 });
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }

  if (!body.analysisId || typeof body.analysisId !== 'string') {
    return apiError({ error: 'analysisId required', status: 400 });
  }
  if (!isMicroDeliberationEventType(body.eventType)) {
    return apiError({
      error:
        'eventType must be one of: committee_pushback | gc_flag | chairman_concern | reviewer_dismissal | predicted_bias_surfaced | cfo_objection | compliance_block | lp_question | audit_committee_query | other',
      status: 400,
    });
  }
  if (!body.predictedReaction || typeof body.predictedReaction !== 'string') {
    return apiError({ error: 'predictedReaction required', status: 400 });
  }
  if (
    body.predictedConfidence != null &&
    (typeof body.predictedConfidence !== 'number' ||
      body.predictedConfidence < 0 ||
      body.predictedConfidence > 1)
  ) {
    return apiError({ error: 'predictedConfidence must be a number 0-1', status: 400 });
  }

  // Defence-in-depth: confirm the analysis belongs to the authenticated user
  // by following Document.userId. Don't write a row to an analysis the caller
  // doesn't own.
  const analysis = await prisma.analysis
    .findUnique({
      where: { id: body.analysisId },
      select: {
        id: true,
        document: { select: { userId: true, orgId: true } },
      },
    })
    .catch(() => null);
  if (!analysis || analysis.document.userId !== auth.userId) {
    return apiError({ error: 'Analysis not found or access denied', status: 404 });
  }

  let happenedAt: Date | null = null;
  if (body.happenedAt) {
    const parsed = new Date(body.happenedAt);
    if (Number.isNaN(parsed.getTime())) {
      return apiError({ error: 'happenedAt must be a valid ISO timestamp', status: 400 });
    }
    happenedAt = parsed;
  }

  try {
    const created = await captureMicroDeliberation({
      analysisId: body.analysisId,
      userId: auth.userId,
      orgId: analysis.document.orgId ?? null,
      eventType: body.eventType,
      targetBiasId: body.targetBiasId ?? null,
      predictedReaction: body.predictedReaction,
      actualReaction: body.actualReaction ?? null,
      confirmed: body.confirmed ?? null,
      predictedConfidence: body.predictedConfidence ?? null,
      happenedAt,
      notes: body.notes ?? null,
    });
    return apiSuccess({ data: { id: created.id } });
  } catch (err) {
    log.warn('capture failed:', err);
    return apiError({ error: 'Capture failed', status: 500 });
  }
}
