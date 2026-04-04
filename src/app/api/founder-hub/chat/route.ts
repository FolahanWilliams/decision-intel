/**
 * POST /api/founder-hub/chat — Founder-only AI chat
 *
 * Gemini chat endpoint with all Founder Hub content baked into the
 * system prompt. Separate from the user-facing /api/chat to avoid
 * leaking founder-internal content (moat assessment, competitor
 * responses, pricing rationale, sales playbook).
 *
 * Auth: requires NEXT_PUBLIC_FOUNDER_HUB_PASS in x-founder-pass header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { formatSSE } from '@/lib/sse';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';
import { FOUNDER_CONTEXT } from '../founder-context';

const log = createLogger('FounderHubChat');
const ENCODER = new TextEncoder();

// ─── Gemini Setup (cached at module scope) ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedModel: any = null;

function getModel() {
  if (cachedModel) return cachedModel;
  const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');
  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
    generationConfig: { maxOutputTokens: 4096 },
  });
  cachedModel = model;
  return model;
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth: verify founder password
  const founderPass = process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS;
  if (!founderPass) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  const headerPass = req.headers.get('x-founder-pass') || '';
  if (!safeCompare(headerPass, founderPass)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const model = getModel();

    // Build Gemini history with founder context as system prompt
    const geminiHistory = history.map(m => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: FOUNDER_CONTEXT }] },
        {
          role: 'model',
          parts: [
            {
              text: "Understood. I'm your Decision Intel strategic advisor. I will answer in clear prose without markdown bold, em dashes, or section headers, and lead with the answer rather than preamble.",
            },
          ],
        },
        ...geminiHistory,
      ],
    });

    const result = await chat.sendMessageStream(message);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(ENCODER.encode(formatSSE({ type: 'chunk', text })));
            }
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
    log.error('Founder chat error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
