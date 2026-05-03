/**
 * POST /api/founder-hub/chat — Founder-only AI chat
 *
 * Gemini chat endpoint with all Founder Hub content baked into the
 * system prompt. Separate from the user-facing /api/chat to avoid
 * leaking founder-internal content (moat assessment, competitor
 * responses, pricing rationale, sales playbook).
 *
 * Auth: requires FOUNDER_HUB_PASS (server-only) in x-founder-pass header.
 * Falls back to NEXT_PUBLIC_FOUNDER_HUB_PASS during migration.
 *
 * Accepts either JSON or multipart/form-data (when a file is attached).
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamChat, type GatewayMessage } from '@/lib/ai/providers/gateway';
import { MODEL_FOUNDER_HUB } from '@/lib/ai/gateway-models';
import { formatSSE } from '@/lib/sse';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import { parseFile } from '@/lib/utils/file-parser';
import { FOUNDER_CONTEXT } from '../founder-context';
import { buildRecentMeetingsBlock } from '@/lib/founder-hub/recent-meetings-context';

const log = createLogger('FounderHubChat');
const ENCODER = new TextEncoder();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_TEXT = 80_000; // ~80K chars to leave room for context + history

// Model: Grok 4.3 (xai/grok-4.3) via Vercel AI Gateway — Phase 2 lock
// 2026-05-02. Founder-hub AI Copilot, single-user. Multi-turn chat
// with founder context + (optional) recent-meetings block + chat
// history as a single messages array.

// ─── Parse request body (JSON or FormData) ─────────────────────────────────

interface ParsedBody {
  message: string;
  history: Array<{ role: string; content: string }>;
  fileText: string | null;
  fileName: string | null;
}

async function parseRequestBody(req: NextRequest): Promise<ParsedBody> {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const message = (formData.get('message') as string)?.slice(0, 5000) || '';
    const historyRaw = formData.get('history') as string;
    let history: Array<{ role: string; content: string }> = [];
    try {
      const parsed = JSON.parse(historyRaw || '[]');
      if (Array.isArray(parsed)) {
        history = parsed
          .filter(
            (m: unknown): m is { role: string; content: string } =>
              typeof m === 'object' &&
              m !== null &&
              typeof (m as Record<string, unknown>).role === 'string' &&
              typeof (m as Record<string, unknown>).content === 'string'
          )
          .slice(-20);
      }
    } catch {
      // Invalid history JSON — ignore
    }

    const file = formData.get('file') as File | null;
    let fileText: string | null = null;
    let fileName: string | null = null;

    if (file && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File too large. Maximum size is 10 MB.');
      }
      fileName = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parseFile(buffer, file.type, file.name);
      fileText = parsed.slice(0, MAX_FILE_TEXT);
    }

    return { message, history, fileText, fileName };
  }

  // Default: JSON body
  const body = await req.json();
  const message = typeof body.message === 'string' ? body.message.slice(0, 5000) : '';
  const history: Array<{ role: string; content: string }> = Array.isArray(body.history)
    ? body.history
        .filter(
          (m: unknown): m is { role: string; content: string } =>
            typeof m === 'object' &&
            m !== null &&
            typeof (m as Record<string, unknown>).role === 'string' &&
            typeof (m as Record<string, unknown>).content === 'string'
        )
        .slice(-20)
    : [];

  return { message, history, fileText: null, fileName: null };
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth: verify founder password via server-only FOUNDER_HUB_PASS.
  const auth = verifyFounderPass(req.headers.get('x-founder-pass'));
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.reason === 'not_configured' ? 'Not configured' : 'Unauthorized' },
      { status: auth.reason === 'not_configured' ? 503 : 401 }
    );
  }

  try {
    const { message, history, fileText, fileName } = await parseRequestBody(req);

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Build the user message — prepend file content if attached
    let userMessage = message;
    if (fileText && fileName) {
      userMessage = `[Attached file: ${fileName}]\n\nFile content:\n${fileText}\n\nUser message: ${message}`;
    }

    // Map prior turns to the Gateway-message shape. AI SDK v6 takes
    // {role, content} where role ∈ system|user|assistant — we only see
    // user|assistant from prior turns; assistant is the model voice.
    const priorTurns: GatewayMessage[] = history.map(m => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }));

    // Pull the live recent-meetings block so the mentor knows "where
    // he is right now" without being re-told each session. Silent-fail:
    // an empty string is fine, chat continues without the block.
    const recentMeetingsBlock = await buildRecentMeetingsBlock();

    const messages: GatewayMessage[] = [
      { role: 'system', content: FOUNDER_CONTEXT },
      {
        role: 'system',
        content:
          "You are the founder's decision-quality advisor, not a generic assistant. Lead with the answer; name biases in his framing when they appear; run pre-mortems on high-stakes decisions; push back when the reasoning is thin. When he's rehearsing a CSO or VC pitch, take the skeptical side hard. Clear prose, no markdown bold, no em dashes, no section headers.",
      },
    ];
    if (recentMeetingsBlock) {
      messages.push({ role: 'system', content: recentMeetingsBlock });
    }
    messages.push(...priorTurns);
    messages.push({ role: 'user', content: userMessage });

    const result = streamChat({
      model: MODEL_FOUNDER_HUB,
      messages,
      maxOutputTokens: 4096,
    });

    const stream = new ReadableStream({
      async start(controller) {
        let carry = '';
        const sanitize = (raw: string): string => {
          let s = carry + raw;
          carry = '';
          if (s.endsWith('*') && !s.endsWith('**')) {
            carry = '*';
            s = s.slice(0, -1);
          } else if (s.endsWith('_') && !s.endsWith('__')) {
            carry = '_';
            s = s.slice(0, -1);
          }
          return s
            .replace(/\*\*/g, '')
            .replace(/__/g, '')
            .replace(/[\u2014\u2013]/g, ', ');
        };
        try {
          for await (const chunk of result.textStream) {
            const text = sanitize(chunk);
            if (text) {
              controller.enqueue(ENCODER.encode(formatSSE({ type: 'chunk', text })));
            }
          }
          if (carry) {
            controller.enqueue(ENCODER.encode(formatSSE({ type: 'chunk', text: carry })));
          }
          controller.enqueue(ENCODER.encode(formatSSE({ type: 'done' })));
        } catch (err) {
          log.error('Founder chat stream error:', err);
          controller.enqueue(
            ENCODER.encode(
              formatSSE({ type: 'error', message: 'An error occurred generating the response.' })
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Internal error';
    log.error('Founder chat error:', error);
    return NextResponse.json(
      { error: errMsg },
      { status: errMsg.includes('too large') ? 413 : 500 }
    );
  }
}
