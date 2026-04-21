/**
 * GET  /api/founder-hub/todos  — list all to-dos (pinned first, then open, then done)
 * POST /api/founder-hub/todos  — create a new to-do
 *
 * Auth: x-founder-pass header.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';

const log = createLogger('FounderTodos');

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

export async function GET(req: NextRequest) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  try {
    // Pinned + open first, then open (un-pinned) by newest, then done at the
    // bottom (most-recently-completed first).
    const todos = await prisma.founderTodo.findMany({
      orderBy: [{ done: 'asc' }, { pinned: 'desc' }, { createdAt: 'desc' }],
    });
    return apiSuccess({ data: { todos } });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      return apiSuccess({ data: { todos: [] } });
    }
    log.error('Failed to list to-dos:', err);
    return apiError({ error: 'Failed to load to-dos', status: 500 });
  }
}

interface CreateBody {
  title?: string;
  pinned?: boolean;
  dueDate?: string | null;
}

export async function POST(req: NextRequest) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return apiError({ error: 'Invalid JSON', status: 400 });
  }

  const title = body.title?.trim();
  if (!title) return apiError({ error: 'title is required', status: 400 });
  if (title.length > 400)
    return apiError({ error: 'title must be 400 characters or fewer', status: 400 });

  try {
    const todo = await prisma.founderTodo.create({
      data: {
        title,
        pinned: !!body.pinned,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });
    return apiSuccess({ data: { todo } });
  } catch (err) {
    log.error('Failed to create to-do:', err);
    return apiError({ error: 'Failed to create to-do', status: 500 });
  }
}
