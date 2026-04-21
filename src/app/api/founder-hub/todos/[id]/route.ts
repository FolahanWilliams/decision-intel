/**
 * PATCH  /api/founder-hub/todos/[id] — toggle done / pinned, edit title/dueDate
 * DELETE /api/founder-hub/todos/[id] — permanent delete
 *
 * Auth: x-founder-pass header.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

const log = createLogger('FounderTodoItem');

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

interface PatchBody {
  title?: string;
  done?: boolean;
  pinned?: boolean;
  dueDate?: string | null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  const { id } = await params;
  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return apiError({ error: 'Invalid JSON', status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.title === 'string') {
    const t = body.title.trim();
    if (!t || t.length > 400)
      return apiError({ error: 'title must be 1\u2013400 chars', status: 400 });
    data.title = t;
  }
  if (typeof body.done === 'boolean') data.done = body.done;
  if (typeof body.pinned === 'boolean') data.pinned = body.pinned;
  if (body.dueDate === null) data.dueDate = null;
  else if (typeof body.dueDate === 'string')
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  try {
    const todo = await prisma.founderTodo.update({ where: { id }, data });
    return apiSuccess({ data: { todo } });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2025') return apiError({ error: 'To-do not found', status: 404 });
    log.error('Failed to update to-do:', err);
    return apiError({ error: 'Failed to update to-do', status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });
  const { id } = await params;
  try {
    await prisma.founderTodo.delete({ where: { id } });
    return apiSuccess({ data: { ok: true } });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2025') return apiError({ error: 'To-do not found', status: 404 });
    log.error('Failed to delete to-do:', err);
    return apiError({ error: 'Failed to delete to-do', status: 500 });
  }
}
