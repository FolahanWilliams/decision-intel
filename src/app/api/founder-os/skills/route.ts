/**
 * Founder OS skill acquisition tracker API.
 *
 * GET /api/founder-os/skills
 *   Returns all skills for the authenticated founder.
 *
 * POST /api/founder-os/skills
 *   Body: { quarter, skill, whyItMatters?, preAssessment? }
 *   Creates a new skill entry with status='planned'.
 *
 * PATCH /api/founder-os/skills?id=...
 *   Body: { status?, postAssessment? }
 *   Updates a skill's status (planned | in_progress | complete) or
 *   captures the post-assessment when complete.
 *
 * DELETE /api/founder-os/skills?id=...
 *   Owner-scoped delete.
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FounderOsSkills');

export const dynamic = 'force-dynamic';

const ALLOWED_STATUS = new Set(['planned', 'in_progress', 'complete']);

interface PostBody {
  quarter?: string;
  skill?: string;
  whyItMatters?: string;
  preAssessment?: string;
}

interface PatchBody {
  status?: string;
  postAssessment?: string;
  whyItMatters?: string;
  preAssessment?: string;
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  try {
    const skills = await prisma.founderOsSkill.findMany({
      where: { userId: auth.userId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return apiSuccess({ data: { skills } });
  } catch (err) {
    log.warn('list failed:', err);
    return apiSuccess({ data: { skills: [] } });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }

  if (!body.quarter?.trim() || body.quarter.length > 20) {
    return apiError({ error: 'quarter required (e.g. "Q3 2026", ≤20 chars)', status: 400 });
  }
  if (!body.skill?.trim() || body.skill.length > 500) {
    return apiError({ error: 'skill required (≤500 chars)', status: 400 });
  }

  try {
    const skill = await prisma.founderOsSkill.create({
      data: {
        userId: auth.userId,
        quarter: body.quarter.trim(),
        skill: body.skill.trim().slice(0, 500),
        whyItMatters: body.whyItMatters?.trim().slice(0, 2000) ?? null,
        preAssessment: body.preAssessment?.trim().slice(0, 2000) ?? null,
        status: 'planned',
      },
    });
    return apiSuccess({ data: { skill } });
  } catch (err) {
    log.warn('create failed:', err);
    return apiError({ error: 'Failed to create skill', status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return apiError({ error: 'id query param required', status: 400 });

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.status === 'string') {
    if (!ALLOWED_STATUS.has(body.status)) {
      return apiError({ error: 'status must be planned | in_progress | complete', status: 400 });
    }
    updateData.status = body.status;
  }
  if (typeof body.postAssessment === 'string') {
    updateData.postAssessment = body.postAssessment.trim().slice(0, 2000);
  }
  if (typeof body.whyItMatters === 'string') {
    updateData.whyItMatters = body.whyItMatters.trim().slice(0, 2000);
  }
  if (typeof body.preAssessment === 'string') {
    updateData.preAssessment = body.preAssessment.trim().slice(0, 2000);
  }
  if (Object.keys(updateData).length === 0) {
    return apiError({ error: 'No fields to update', status: 400 });
  }

  try {
    const result = await prisma.founderOsSkill.updateMany({
      where: { id, userId: auth.userId },
      data: updateData,
    });
    if (result.count === 0) {
      return apiError({ error: 'Not found', status: 404 });
    }
    return apiSuccess({ data: { updated: true } });
  } catch (err) {
    log.warn('update failed:', err);
    return apiError({ error: 'Failed to update skill', status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return apiError({ error: 'id query param required', status: 400 });

  try {
    const result = await prisma.founderOsSkill.deleteMany({
      where: { id, userId: auth.userId },
    });
    if (result.count === 0) {
      return apiError({ error: 'Not found', status: 404 });
    }
    return apiSuccess({ data: { deleted: true } });
  } catch (err) {
    log.warn('delete failed:', err);
    return apiError({ error: 'Failed to delete', status: 500 });
  }
}
