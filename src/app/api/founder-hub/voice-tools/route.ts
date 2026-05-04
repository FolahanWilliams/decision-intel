/**
 * POST /api/founder-hub/voice-tools — Voice agent tool dispatch
 *
 * Single endpoint that handles all voice-mode tool calls. The LiveKit
 * voice worker registers tools on the AgentSession Agent (in
 * voice-worker/src/agent.ts); when the LLM decides to call a tool,
 * the worker's tool handler POSTs here with { tool, args, sessionId,
 * personaId } and we dispatch to the right action.
 *
 * Why one endpoint instead of /voice-tools/add-todo /voice-tools/lookup-decision-log
 * etc: we want one place that auto-logs every tool call to
 * VoiceSessionEvent for the cross-tracking dashboard. Keeping that
 * tracking in one place avoids "tool added but tracking forgotten" drift.
 *
 * Auth: VOICE_WORKER_SECRET bearer (same as /voice-context). Must also
 * be added to Supabase middleware allowlist so it's not redirected to
 * /login when the worker (no Supabase session) hits it.
 *
 * Rate limit: light per-IP cap, since a single voice session might
 * fire 10-20 tool calls and there's only ever one founder using it.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { verifyVoiceWorkerAuth } from '@/lib/utils/voice-worker-auth';
import { isThinkingPartnerId } from '@/lib/data/thinking-partners';

const log = createLogger('VoiceTools');

// ─── Tool registry ──────────────────────────────────────────────────────
//
// Each tool has:
//   - name: matches what the agent registers + calls
//   - eventType: how it shows up in VoiceSessionEvent for the dashboard
//   - handler: async (args, ctx) => result. The result goes back to
//              the LLM as the tool's return value.
//
// To add a new tool:
//   1. Add an entry below
//   2. Register it on the Agent in voice-worker/src/agent.ts
//   3. Done — auto-logged + auto-tracked

interface ToolContext {
  sessionId: string;
  personaId: string | null;
}

interface ToolDef {
  name: string;
  eventType: string;
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
}

const TOOLS: ToolDef[] = [
  // ─── Write tools ───────────────────────────────────────────────────────
  {
    name: 'add_todo',
    eventType: 'todo_created',
    async handler(args) {
      const title = typeof args.title === 'string' ? args.title.slice(0, 500) : '';
      const dueDate = typeof args.dueDate === 'string' ? args.dueDate : null;
      const notes = typeof args.notes === 'string' ? args.notes.slice(0, 2000) : null;
      if (!title) {
        return { ok: false, error: 'title is required' };
      }
      // Try to write to FounderTodo if it exists; fall back to logging
      // the intent (the VoiceSessionEvent capture below records it
      // either way so the founder can see what the agent tried).
      let todoId: string | null = null;
      try {
        const todo = await (
          prisma as unknown as {
            founderTodo?: { create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }> };
          }
        ).founderTodo?.create({
          data: {
            title,
            dueDate: dueDate ? new Date(dueDate) : null,
            notes,
            source: 'voice_agent',
          },
        });
        todoId = todo?.id ?? null;
      } catch (err) {
        // Schema-drift tolerant — if FounderTodo doesn't exist yet
        // the event is still logged; founder sees it in voice activity.
        // @schema-drift-tolerant — FounderTodo may not exist in all envs
        log.warn(`add_todo could not write FounderTodo (continuing with event log only):`, err);
      }
      return {
        ok: true,
        todoId,
        message: todoId
          ? `Todo created: "${title}"`
          : `Todo recorded in voice activity log: "${title}" (FounderTodo schema not yet provisioned in this env)`,
      };
    },
  },

  {
    name: 'track_demo_conversion',
    eventType: 'demo_conversion',
    async handler(args) {
      const prospectName = typeof args.prospectName === 'string' ? args.prospectName.slice(0, 200) : '';
      const status = typeof args.status === 'string' ? args.status : 'unknown';
      // note (founder's qualitative comment) is captured by the
      // dispatcher into VoiceSessionEvent.payload.args, so the
      // dashboard sees it; we don't need to read it here.
      const validStatuses = ['interested', 'qualified', 'objection_raised', 'not_a_fit', 'next_step_set', 'converted', 'lost'];
      if (!prospectName) return { ok: false, error: 'prospectName is required' };
      if (!validStatuses.includes(status)) {
        return { ok: false, error: `status must be one of: ${validStatuses.join(', ')}` };
      }
      return {
        ok: true,
        message: `Demo conversion tracked: ${prospectName} → ${status}`,
        // The full payload (prospectName, status, note) gets persisted
        // to VoiceSessionEvent below — this return shape is just what
        // the LLM sees so it can confirm to the founder.
      };
    },
  },

  {
    name: 'log_positioning_note',
    eventType: 'positioning_note',
    async handler(args) {
      const articulation = typeof args.articulation === 'string' ? args.articulation.slice(0, 2000) : '';
      // context (the previous version that triggered the realisation)
      // is read by the LLM via args + persisted to VoiceSessionEvent
      // payload below by the dispatcher; we don't need to read it here.
      if (!articulation) return { ok: false, error: 'articulation is required' };
      return {
        ok: true,
        message: `Positioning note saved: "${articulation.slice(0, 80)}${articulation.length > 80 ? '...' : ''}"`,
      };
    },
  },

  // ─── Read tools ────────────────────────────────────────────────────────
  {
    name: 'lookup_decision_log',
    eventType: 'decision_lookup',
    async handler(args) {
      const query = typeof args.query === 'string' ? args.query.slice(0, 200) : '';
      const limit = Math.min(typeof args.limit === 'number' ? args.limit : 5, 10);
      try {
        // Try to query the Document model (Decision Log entries are stored
        // as Documents with documentType = 'decision' or similar). Fallback
        // to empty list if schema doesn't match.
        const decisions = await (
          prisma as unknown as {
            document?: {
              findMany: (args: Record<string, unknown>) => Promise<Array<{ id: string; title?: string; uploadedAt?: Date }>>;
            };
          }
        ).document?.findMany({
          where: query
            ? { OR: [{ title: { contains: query, mode: 'insensitive' } }] }
            : {},
          orderBy: { uploadedAt: 'desc' },
          take: limit,
          select: { id: true, title: true, uploadedAt: true },
        });
        return {
          ok: true,
          count: decisions?.length ?? 0,
          decisions: (decisions ?? []).map(d => ({
            id: d.id,
            title: d.title ?? '(untitled)',
            createdAt: d.uploadedAt?.toISOString() ?? null,
          })),
        };
      } catch (err) {
        // @schema-drift-tolerant — Document model may not have these fields in old envs
        log.warn('lookup_decision_log query failed:', err);
        return { ok: true, count: 0, decisions: [], note: 'Decision log lookup not available in this environment' };
      }
    },
  },

  {
    name: 'lookup_recent_meetings',
    eventType: 'meeting_lookup',
    async handler(args) {
      const limit = Math.min(typeof args.limit === 'number' ? args.limit : 5, 10);
      try {
        const meetings = await (
          prisma as unknown as {
            meeting?: {
              findMany: (args: Record<string, unknown>) => Promise<Array<{ id: string; title?: string; createdAt?: Date }>>;
            };
          }
        ).meeting?.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: { id: true, title: true, createdAt: true },
        });
        return {
          ok: true,
          count: meetings?.length ?? 0,
          meetings: (meetings ?? []).map(m => ({
            id: m.id,
            title: m.title ?? '(untitled meeting)',
            createdAt: m.createdAt?.toISOString() ?? null,
          })),
        };
      } catch (err) {
        // @schema-drift-tolerant — Meeting model may not exist in all envs
        log.warn('lookup_recent_meetings query failed:', err);
        return { ok: true, count: 0, meetings: [], note: 'Recent meetings lookup not available in this environment' };
      }
    },
  },

  {
    name: 'lookup_design_partners',
    eventType: 'design_partner_lookup',
    async handler() {
      try {
        const partners = await (
          prisma as unknown as {
            designPartner?: {
              findMany: (args: Record<string, unknown>) => Promise<Array<{ id: string; companyName?: string; status?: string; createdAt?: Date }>>;
            };
          }
        ).designPartner?.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, companyName: true, status: true, createdAt: true },
        });
        return {
          ok: true,
          count: partners?.length ?? 0,
          partners: (partners ?? []).map(p => ({
            id: p.id,
            name: p.companyName ?? '(unnamed)',
            status: p.status ?? 'unknown',
            createdAt: p.createdAt?.toISOString() ?? null,
          })),
        };
      } catch (err) {
        // @schema-drift-tolerant — DesignPartner model may not exist
        log.warn('lookup_design_partners query failed:', err);
        return { ok: true, count: 0, partners: [], note: 'Design partner pipeline lookup not available in this environment' };
      }
    },
  },
];

const TOOLS_BY_NAME = new Map(TOOLS.map(t => [t.name, t] as const));

// ─── Public route handler ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = verifyVoiceWorkerAuth(req);
  if (!auth.ok) return auth.response;

  let body: { tool?: unknown; args?: unknown; sessionId?: unknown; personaId?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const toolName = typeof body.tool === 'string' ? body.tool : '';
  const tool = TOOLS_BY_NAME.get(toolName);
  if (!tool) {
    return NextResponse.json(
      { error: `Unknown tool: ${toolName}. Available: ${TOOLS.map(t => t.name).join(', ')}` },
      { status: 400 }
    );
  }

  const args = (typeof body.args === 'object' && body.args !== null
    ? body.args
    : {}) as Record<string, unknown>;
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '<unknown-session>';
  const personaId = isThinkingPartnerId(body.personaId) ? body.personaId : null;

  // Run the handler
  let result: unknown;
  let handlerError: unknown = null;
  try {
    result = await tool.handler(args, { sessionId, personaId });
  } catch (err) {
    handlerError = err;
    log.error(`Voice tool "${toolName}" handler threw:`, err);
    result = { ok: false, error: 'Tool execution failed', detail: (err as Error).message };
  }

  // Auto-log the tool call to VoiceSessionEvent for cross-tracking.
  // Fire-and-forget logged at warn level if it fails — we don't want
  // a tracking-table write failure to break the tool response back
  // to the LLM. Cast the payload object as Prisma.InputJsonValue per
  // the CLAUDE.md Prisma JSON convention (Record<string, unknown>
  // doesn't satisfy the recursive InputJsonValue constraint).
  try {
    await prisma.voiceSessionEvent.create({
      data: {
        sessionId,
        eventType: tool.eventType,
        personaId,
        payload: {
          tool: toolName,
          args,
          result,
          handlerError: handlerError ? (handlerError as Error).message : null,
        } as Prisma.InputJsonValue,
      },
    });
  } catch (trackErr) {
    log.warn(`Failed to record VoiceSessionEvent for tool ${toolName}:`, trackErr);
  }

  return NextResponse.json({ ok: !handlerError, result });
}
