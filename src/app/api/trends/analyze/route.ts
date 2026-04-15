import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI, type Tool } from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import { trackApiUsage, estimateCost } from '@/lib/utils/cost-tracker';
import { cacheGet, cacheSet } from '@/lib/utils/cache';
import { hashContent } from '@/lib/utils/resilience';
import { apiError } from '@/lib/utils/api-response';

const log = createLogger('TrendsAnalyzeRoute');

// Helper to get Grounded Model — initialised lazily so the missing-key error
// surfaces at request time with a clear message rather than at module load.
function getMarketAnalystModel() {
  const genAI = new GoogleGenerativeAI(getRequiredEnvVar('GOOGLE_API_KEY'));
  return genAI.getGenerativeModel({
    model: getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview'),
    tools: [{ googleSearch: {} } as Tool],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2, // Low temp for factual analysis
    },
  });
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return apiError({ error: 'Unauthorized', status: 401 });
    }

    // Rate limit: 5 market analyses per hour (LLM-backed, expensive)
    const rateLimitResult = await checkRateLimit(userId, '/api/trends/analyze');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can run up to 5 market analyses per hour.',
          limit: rateLimitResult.limit,
          reset: rateLimitResult.reset,
          remaining: 0,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
    }

    // 1. Gather Context (What is the user interested in?)
    // Fetch last 10 analyses to extract topics/tickers from factCheck
    const recentAnalyses = await prisma.analysis.findMany({
      where: { document: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { factCheck: true, summary: true },
    });

    // Extract topics — the verificationNode stores primaryTopic as
    // a plain string (e.g. "Apple", "Tesla Motors"), not as an object.
    // Also check the legacy primaryCompany.ticker path for backwards compat.
    const topics = new Set<string>();
    recentAnalyses.forEach((a: (typeof recentAnalyses)[number]) => {
      const fc = a.factCheck as Record<string, unknown> | null;
      if (!fc) return;
      // New format: primaryTopic (string)
      if (typeof fc.primaryTopic === 'string' && fc.primaryTopic.trim()) {
        topics.add(fc.primaryTopic.trim());
      }
      // Legacy format: primaryCompany { ticker, name }
      const pc = fc.primaryCompany as { ticker?: string; name?: string } | undefined;
      if (pc?.ticker) topics.add(pc.ticker);
      else if (pc?.name) topics.add(pc.name);
    });

    const activeTopics = Array.from(topics).slice(0, 3); // Top 3

    if (activeTopics.length === 0) {
      // Always include impactAssessment (even if empty) so the frontend's
      // `.impactAssessment.length > 0` guards don't crash on this shape.
      return NextResponse.json({
        summary:
          'No sufficient data to generate market intelligence. Upload a strategic memo that mentions a company or market, then try again.',
        impactAssessment: [],
        searchSources: [],
      });
    }

    // Check response cache — expensive LLM + grounding call, 1 hour TTL
    const cacheKey = `trends:${userId}:${hashContent(activeTopics.join(','))}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      try {
        log.debug('Cache hit for trends/analyze');
        return NextResponse.json(JSON.parse(cached), {
          headers: { 'X-Cache': 'HIT', 'Cache-Control': 'private, max-age=3600' },
        });
      } catch {
        // Corrupted cache entry — fall through to fresh computation
      }
    }

    // 2. Perform Market Analysis (Grounded)
    log.info('Running Market Analysis for: ' + activeTopics.join(', '));
    const model = getMarketAnalystModel();

    const prompt = `
        You are an AI Market Intelligence Analyst.
        Target Companies: ${activeTopics.join(', ')}.

        TASK:
        1. Search for the LATEST major market news, regulatory threats, and macroeconomic trends affecting these companies/sectors.
        2. Focus on "Systemic Risks" and "Tailwinds".
        3. Be brief, executive-style.

        OUTPUT JSON:
        {
            "summary": "Brief market overview (markdown)",
            "impactAssessment": [
                { "category": "Regulatory", "status": "High"|"Medium"|"Low", "details": "string" },
                { "category": "Macro", "status": "High"|"Medium"|"Low", "details": "string" },
                { "category": "Competitor", "status": "High"|"Medium"|"Low", "details": "string" }
            ]
        }
        `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON safely
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      // Fallback if model returns Markdown block
      try {
        const cleanText = responseText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        analysis = JSON.parse(cleanText);
      } catch {
        log.error('Failed to parse Gemini response: ' + responseText.slice(0, 200));
        return apiError({
          error: 'Market analysis returned an unparseable response. Please try again.',
          status: 500,
        });
      }
    }

    // Extract Sources from Grounding Metadata
    const metadata = result.response.candidates?.[0]?.groundingMetadata;
    const searchSources =
      metadata?.groundingChunks
        ?.map((c: { web?: { uri?: string } }) => c.web?.uri)
        .filter((u: unknown): u is string => typeof u === 'string') || [];

    // Track LLM cost (fire and forget)
    trackApiUsage({
      userId,
      provider: 'google',
      operation: 'market_analysis',
      tokens: prompt.length + responseText.length,
      cost: estimateCost(
        getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview'),
        prompt.length,
        responseText.length
      ),
      metadata: { topics: activeTopics },
    });

    logAudit({
      action: 'SEARCH_MARKET_TRENDS',
      resource: 'MarketAnalysis',
      details: { tickers: activeTopics },
    }).catch((err: unknown) => {
      log.warn(
        'Audit log failed (non-critical): ' + (err instanceof Error ? err.message : String(err))
      );
    });

    // Only forward expected fields to the client — the LLM may return
    // arbitrary keys that could break the frontend or leak prompt details.
    const responseBody = {
      summary: typeof analysis.summary === 'string' ? analysis.summary : '',
      impactAssessment: Array.isArray(analysis.impactAssessment) ? analysis.impactAssessment : [],
      searchSources,
    };

    // Cache successful response for 1 hour
    void cacheSet(cacheKey, JSON.stringify(responseBody), 3600);

    return NextResponse.json(responseBody, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'private, max-age=3600' },
    });
  } catch (error) {
    log.error('Market Analyst failed:', error);
    return apiError({
      error: 'Market analysis failed',
      status: 500,
      cause: error instanceof Error ? error : undefined,
    });
  }
}
