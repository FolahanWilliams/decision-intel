/**
 * /api/founder-hub/content — Content Studio CRUD + Generation
 *
 * POST: Generate content (SSE stream) or save to library
 * GET:  List saved content
 * PATCH: Update content (title, body, status)
 * DELETE: Remove content
 *
 * Auth: x-founder-pass header (same as chat route).
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { formatSSE } from '@/lib/sse';
import { createLogger } from '@/lib/utils/logger';
import { safeCompare } from '@/lib/utils/safe-compare';
import { prisma } from '@/lib/prisma';
import { FOUNDER_CONTEXT } from '../founder-context';

const log = createLogger('FounderContentStudio');
const ENCODER = new TextEncoder();

// ─── Auth helper ────────────────────────────────────────────────────────────

function verifyFounderPass(req: NextRequest): boolean {
  const founderPass = process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS;
  if (!founderPass) return false;
  const headerPass = req.headers.get('x-founder-pass') || '';
  return safeCompare(headerPass, founderPass);
}

// ─── Gemini Setup ───────────────────────────────────────────────────────────

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
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
    generationConfig: { maxOutputTokens: 8192 },
  });
  cachedModel = model;
  return model;
}

// ─── Content-type prompt instructions ───────────────────────────────────────

const CONTENT_INSTRUCTIONS: Record<string, string> = {
  linkedin_post: `Write a LinkedIn post (1300-1800 characters). Structure:
- Strong hook line (first sentence visible before "see more")
- 3-5 short paragraphs with line breaks between them
- First person voice
- Include at least one specific data point or insight from the knowledge base
- End with a clear call-to-action (question, invitation, or challenge)
- Optionally add 3-5 relevant hashtags at the very end
- Use line breaks generously — LinkedIn rewards white space`,

  twitter_thread: `Write a Twitter/X thread of 5-8 tweets. Format:
- Prefix each tweet with "1/", "2/", etc.
- Each tweet MUST be ≤280 characters
- First tweet is a standalone hook that makes people want to read more
- Last tweet is a CTA + brief recap
- Use short, punchy sentences
- One idea per tweet`,

  blog_draft: `Write a blog article draft (800-1200 words). Format in Markdown:
- Title (H1)
- Subtitle (one-liner)
- Introduction paragraph (hook the reader)
- 3-4 H2 sections with substantive content
- Conclusion with CTA
- Target audience: CTOs, PE/VC partners, decision-makers
- Authoritative but accessible tone`,

  snippet: `Write a short-form snippet (2-4 sentences, ≤300 characters total). Requirements:
- Punchy and quotable
- Suitable for email signatures, slide decks, bios, newsletters
- Should stand completely alone without context
- Convey one powerful idea about decision intelligence`,
};

// ─── POST: Generate (SSE) or Save ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!verifyFounderPass(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action } = body;

  // ── Save to library ──
  if (action === 'save') {
    const { contentType, title, body: contentBody, topic, tone, status } = body;
    if (!contentType || !title || !contentBody) {
      return NextResponse.json({ error: 'contentType, title, and body are required' }, { status: 400 });
    }

    try {
      const item = await prisma.founderContent.create({
        data: {
          contentType,
          title: String(title).slice(0, 500),
          body: String(contentBody).slice(0, 100_000),
          topic: topic ? String(topic).slice(0, 500) : null,
          tone: tone || null,
          status: status || 'draft',
        },
      });
      return NextResponse.json({ id: item.id, createdAt: item.createdAt }, { status: 201 });
    } catch (err) {
      log.error('Failed to save content:', err);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
  }

  // ── Generate (SSE stream) ──
  if (action === 'generate') {
    const { contentType, topic, tone, voiceNotes } = body;
    if (!contentType || !CONTENT_INSTRUCTIONS[contentType]) {
      return NextResponse.json(
        { error: 'Invalid contentType. Valid: linkedin_post, twitter_thread, blog_draft, snippet' },
        { status: 400 }
      );
    }

    const typeInstructions = CONTENT_INSTRUCTIONS[contentType];
    const toneLabel = tone || 'authoritative';
    const voiceExtra = voiceNotes ? `\n\nAdditional voice/style notes from the founder:\n${String(voiceNotes).slice(0, 2000)}` : '';
    const topicLine = topic ? `\n\nTopic/angle to write about: ${String(topic).slice(0, 1000)}` : '';

    const systemPrompt = `${FOUNDER_CONTEXT}

You are the founder's personal content writer. Generate social media content that builds thought leadership in decision intelligence and cognitive bias auditing.

CONTENT TYPE INSTRUCTIONS:
${typeInstructions}

VOICE/TONE: ${toneLabel}${voiceExtra}${topicLine}

Write the content now. Output ONLY the content itself — no meta-commentary, no "Here's your post:", no wrapper text.`;

    try {
      const model = getModel();
      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Ready to generate content.' }] },
        ],
      });

      const result = await chat.sendMessageStream(
        topic
          ? `Generate a ${contentType.replace('_', ' ')} about: ${topic}`
          : `Generate a ${contentType.replace('_', ' ')} about decision intelligence`
      );

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
            log.error('Content generation stream error:', err);
            controller.enqueue(
              ENCODER.encode(formatSSE({ type: 'error', message: 'Generation failed.' }))
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
    } catch (err) {
      log.error('Content generation error:', err);
      return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action. Use "generate" or "save".' }, { status: 400 });
}

// ─── GET: List content ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!verifyFounderPass(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);

  const where: Record<string, string> = {};
  if (type) where.contentType = type;
  if (status) where.status = status;

  try {
    const [items, total] = await Promise.all([
      prisma.founderContent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.founderContent.count({ where }),
    ]);

    return NextResponse.json({ items, total });
  } catch (err) {
    log.error('Failed to list content:', err);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

// ─── PATCH: Update content ──────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  if (!verifyFounderPass(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, title, body: contentBody, status } = body;
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (title !== undefined) data.title = String(title).slice(0, 500);
  if (contentBody !== undefined) data.body = String(contentBody).slice(0, 100_000);
  if (status !== undefined) data.status = status;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    await prisma.founderContent.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('Failed to update content:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// ─── DELETE: Remove content ─────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  if (!verifyFounderPass(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
  }

  try {
    await prisma.founderContent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('Failed to delete content:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
