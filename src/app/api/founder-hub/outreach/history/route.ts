import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

const log = createLogger('OutreachHistory');
const FOUNDER_USER_ID = 'founder';

export async function GET(req: NextRequest) {
  const auth = verifyFounderPass(req.headers.get('x-founder-pass'));
  if (!auth.ok) {
    return apiError({
      error: auth.reason === 'not_configured' ? 'Not configured' : 'Unauthorized',
      status: auth.reason === 'not_configured' ? 503 : 401,
    });
  }

  try {
    const artifacts = await prisma.outreachArtifact.findMany({
      where: { userId: FOUNDER_USER_ID },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        intent: true,
        contactName: true,
        contactTitle: true,
        contactCompany: true,
        generatedMessage: true,
        status: true,
        sentAt: true,
        outcome: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return apiSuccess({ data: artifacts });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('OutreachArtifact table missing — returning empty list', { code });
      return apiSuccess({ data: [] });
    }
    log.error('Failed to list outreach artifacts', err);
    return apiError({ error: 'Failed to load outreach history', status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = verifyFounderPass(req.headers.get('x-founder-pass'));
  if (!auth.ok) {
    return apiError({
      error: auth.reason === 'not_configured' ? 'Not configured' : 'Unauthorized',
      status: auth.reason === 'not_configured' ? 503 : 401,
    });
  }

  let body: { id?: string; status?: string; outcome?: string };
  try {
    body = await req.json();
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }

  const { id, status, outcome } = body;
  if (!id || typeof id !== 'string') {
    return apiError({ error: '`id` is required', status: 400 });
  }

  const allowed = ['draft', 'sent', 'replied', 'closed'];
  if (status && !allowed.includes(status)) {
    return apiError({ error: `status must be one of: ${allowed.join(', ')}`, status: 400 });
  }

  try {
    const updated = await prisma.outreachArtifact.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(status === 'sent' ? { sentAt: new Date() } : {}),
        ...(typeof outcome === 'string' ? { outcome: outcome.slice(0, 2000) } : {}),
      },
    });
    return apiSuccess({ data: updated });
  } catch (err) {
    log.error('Failed to update outreach artifact', err);
    return apiError({ error: 'Failed to update artifact', status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = verifyFounderPass(req.headers.get('x-founder-pass'));
  if (!auth.ok) {
    return apiError({
      error: auth.reason === 'not_configured' ? 'Not configured' : 'Unauthorized',
      status: auth.reason === 'not_configured' ? 503 : 401,
    });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return apiError({ error: '`id` query param required', status: 400 });

  try {
    await prisma.outreachArtifact.delete({ where: { id } });
    return apiSuccess({ data: { ok: true } });
  } catch (err) {
    log.error('Failed to delete outreach artifact', err);
    return apiError({ error: 'Failed to delete artifact', status: 500 });
  }
}
