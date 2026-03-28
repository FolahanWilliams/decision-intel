import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { searchSimilarDocuments } from '@/lib/rag/embeddings';
import { formatSSE } from '@/lib/sse';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const log = createLogger('ChatRoute');

const MAX_MESSAGE_LENGTH = 10_000;
const MAX_HISTORY_LENGTH = 20;
const RAG_RESULT_LIMIT = 5;

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const ChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'message is required')
    .max(MAX_MESSAGE_LENGTH, `Message must be at most ${MAX_MESSAGE_LENGTH} characters`),
  history: z.array(ChatMessageSchema).max(MAX_HISTORY_LENGTH).optional().default([]),
  documentId: z.string().optional(),
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function getModel() {
  const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');

  return genAI.getGenerativeModel({
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
    generationConfig: {
      maxOutputTokens: 4096,
    },
  });
}

function buildSystemPrompt(
  ragContext: Array<{
    filename: string;
    content: string;
    similarity: number;
    score: number;
    biases: string[];
  }>
): string {
  const contextBlocks = ragContext
    .map((doc, i) => {
      const biasStr = doc.biases.length > 0 ? `\nDetected biases: ${doc.biases.join(', ')}` : '';
      return `--- Source ${i + 1}: ${doc.filename} (${Math.round(doc.similarity * 100)}% match, quality score: ${doc.score}/100) ---\n${doc.content}${biasStr}`;
    })
    .join('\n\n');

  return `You are Decision Intel Assistant, an AI that helps users understand their analysed documents, decision-making patterns, and cognitive biases.

You have access to the user's document analyses retrieved via semantic search. Use them to provide grounded, specific answers. Always cite which document(s) you're referencing.

RULES:
- Answer based on the retrieved context below. If the context doesn't contain relevant information, say so honestly.
- When referencing a document, mention its filename.
- Highlight cognitive biases, decision quality scores, and risk factors when relevant.
- Be concise but thorough. Use markdown formatting for readability.
- If the user asks about something not in their documents, you may provide general decision-making guidance but clearly distinguish it from document-specific insights.

${ragContext.length > 0 ? `RETRIEVED CONTEXT:\n${contextBlocks}` : 'No relevant documents were found for this query. Answer based on general decision-making expertise.'}`;
}

/**
 * POST /api/chat
 * RAG-powered conversational Q&A with SSE streaming
 *
 * Body: { message: string, history?: ChatMessage[] }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 30 messages per hour
    const rateLimitResult = await checkRateLimit(userId, '/api/chat', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 30,
      failMode: 'open',
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid request';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const { message, history = [], documentId } = parsed.data;

    // History already validated by Zod schema — take last N entries
    const safeHistory: ChatMessage[] = history.slice(-MAX_HISTORY_LENGTH);

    // 1. RAG retrieval — search for relevant documents (or scope to pinned doc)
    let ragResults: Array<{
      documentId: string;
      filename: string;
      score: number;
      similarity: number;
      biases: string[];
      content: string;
    }> = [];

    try {
      if (documentId && typeof documentId === 'string') {
        // Pinned mode: search all docs then scope to the pinned document
        try {
          const pinned = await searchSimilarDocuments(message, userId, RAG_RESULT_LIMIT * 3);
          ragResults = pinned.filter(r => r.documentId === documentId).slice(0, RAG_RESULT_LIMIT);
        } catch {
          // Embedding search failed — ignore, will fall back below
        }

        // If vector search didn't find the pinned doc, load its embeddings directly
        if (ragResults.length === 0) {
          try {
            const embeddings = await prisma.decisionEmbedding.findMany({
              where: { documentId },
              select: { content: true, metadata: true },
              take: RAG_RESULT_LIMIT,
            });
            const doc = await prisma.document.findUnique({
              where: { id: documentId },
              select: { filename: true },
            });
            ragResults = embeddings.map(e => {
              const meta = e.metadata as Record<string, unknown> | null;
              return {
                documentId,
                filename: doc?.filename || 'Unknown',
                score: (meta?.overallScore as number) || 0,
                similarity: 1.0,
                biases: (meta?.primaryBiases as string[]) || [],
                content: e.content,
              };
            });
          } catch (dbErr) {
            log.warn('Direct embedding fetch for pinned doc failed:', dbErr);
          }
        }
      } else {
        ragResults = await searchSimilarDocuments(message, userId, RAG_RESULT_LIMIT);
      }
    } catch (err) {
      log.warn('RAG retrieval failed, proceeding without context:', err);
    }

    // 2. Build prompt with RAG context
    const systemPrompt = buildSystemPrompt(ragResults);
    const model = getModel();

    // 3. Build Gemini chat history
    const geminiHistory = safeHistory.map(m => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: 'System context: ' + systemPrompt }] },
        {
          role: 'model',
          parts: [
            {
              text: 'Understood. I will answer questions based on the retrieved document analyses and follow the rules provided.',
            },
          ],
        },
        ...geminiHistory,
      ],
    });

    // 4. Stream the response via SSE
    const result = await chat.sendMessageStream(message);
    const encoder = new TextEncoder();

    const sources = ragResults.map(r => ({
      documentId: r.documentId,
      filename: r.filename,
      similarity: r.similarity,
      score: r.score,
    }));

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send sources first
          controller.enqueue(encoder.encode(formatSSE({ type: 'sources', sources })));

          // Stream text chunks
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(formatSSE({ type: 'chunk', text })));
            }
          }

          // Signal completion
          controller.enqueue(encoder.encode(formatSSE({ type: 'done' })));

          // Generate follow-up suggestions (fire-and-forget, non-blocking)
          try {
            const suggestModel = getModel();
            const suggestResult = await suggestModel.generateContent(
              `Based on this conversation, suggest 2-3 short follow-up questions the user might want to ask next. The user's latest question was: "${message}". Return ONLY a JSON array of strings, no other text. Example: ["Question 1?", "Question 2?"]`
            );
            const suggestText = suggestResult.response.text().trim();
            // Extract JSON array from response
            const match = suggestText.match(/\[[\s\S]*\]/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              if (Array.isArray(parsed) && parsed.length > 0) {
                controller.enqueue(
                  encoder.encode(
                    formatSSE({ type: 'suggestions', suggestions: parsed.slice(0, 3) })
                  )
                );
              }
            }
          } catch (suggestErr) {
            log.warn('Failed to generate suggestions:', suggestErr);
            // Non-critical — don't fail the whole response
          }

          // Audit log (fire-and-forget)
          void logAudit({
            action: 'CHAT_MESSAGE',
            resource: 'chat',
            details: {
              messageLength: message.length,
              historyLength: safeHistory.length,
              sourcesReturned: sources.length,
            },
          });
        } catch (err) {
          log.error('Chat stream error:', err);
          controller.enqueue(
            encoder.encode(
              formatSSE({
                type: 'error',
                message: 'An error occurred while generating the response.',
              })
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
    log.error('Chat API error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
