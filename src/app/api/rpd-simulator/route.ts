import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { getDocumentContent } from '@/lib/utils/encryption';
import { searchSimilarWithOutcomes } from '@/lib/rag/embeddings';
import { buildRpdSimulatorPrompt } from '@/lib/agents/prompts';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { parseJSON } from '@/lib/utils/json';
import { smartTruncate } from '@/lib/utils/resilience';
import { RpdSimulationResult } from '@/types';

const log = createLogger('RpdSimulator');

const MAX_INPUT_CHARS = 25000;
const LLM_TIMEOUT_MS = 90000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`LLM timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

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

    const rateLimitResult = await checkRateLimit(userId, '/api/rpd-simulator');
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

    const { documentId, chosenAction } = body;
    if (!documentId || !chosenAction) {
      return NextResponse.json(
        { error: 'documentId and chosenAction are required' },
        { status: 400 }
      );
    }

    if (typeof chosenAction !== 'string' || chosenAction.length > 500) {
      return NextResponse.json(
        { error: 'chosenAction must be a string under 500 characters' },
        { status: 400 }
      );
    }

    // Verify ownership
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const docContent = smartTruncate(getDocumentContent(doc), MAX_INPUT_CHARS);

    // RAG search for historical analogs
    let historicalContext = '';
    try {
      const similar = await searchSimilarWithOutcomes(docContent, userId, 5);
      historicalContext = similar
        .map((d, i) => {
          const outcomeStr = d.outcome
            ? `\n  Outcome: ${d.outcome.result}${d.outcome.lessonsLearned ? ` — ${d.outcome.lessonsLearned}` : ''}`
            : '';
          return `Case ${i + 1}: "${d.filename}" (similarity: ${(d.similarity * 100).toFixed(0)}%)${outcomeStr}\n  Content excerpt: ${d.content.slice(0, 400)}`;
        })
        .join('\n\n');
    } catch (ragError) {
      log.warn('RAG search failed for RPD simulator:', ragError instanceof Error ? ragError.message : String(ragError));
    }

    // Build and execute the LLM call
    const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');

    const model = genAI.getGenerativeModel({
      model: modelName,
      tools: [{ googleSearch: {} } as Parameters<typeof genAI.getGenerativeModel>[0]['tools'] extends (infer T)[] ? T : never],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    const prompt = buildRpdSimulatorPrompt();

    const result = await withTimeout(
      model.generateContent([
        prompt,
        `Document Context:\n<input_text>\n${docContent}\n</input_text>`,
        `Chosen Action: "${chosenAction}"`,
        `Historical Cases (via Vector Search):\n${historicalContext || 'No similar historical cases found.'}`,
      ]),
      LLM_TIMEOUT_MS
    );

    const text = result.response?.text ? result.response.text() : '';
    const data = parseJSON(text);

    const rpdSimulation = data?.rpdSimulation as RpdSimulationResult | undefined;

    if (!rpdSimulation) {
      log.warn('RPD Simulator: No simulation result returned from LLM');
      return NextResponse.json(
        { error: 'Failed to generate mental simulation. Please try again.' },
        { status: 500 }
      );
    }

    // Ensure chosenAction is preserved
    rpdSimulation.chosenAction = chosenAction;

    log.info(
      `RPD Simulation complete for document ${documentId}. ` +
        `Recommendation: ${rpdSimulation.recommendation}, ` +
        `Confidence: ${rpdSimulation.mentalSimulation?.confidenceLevel ?? 'N/A'}`
    );

    return NextResponse.json({ result: rpdSimulation });
  } catch (error) {
    log.error('RPD Simulator error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'An error occurred during mental simulation. Please try again.' },
      { status: 500 }
    );
  }
}
