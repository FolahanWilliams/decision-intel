/**
 * GET /api/founder-hub/founder-school/sources
 *
 * Uses Gemini to curate 5 high-quality learning resources for a specific
 * Founder School lesson — books, articles, papers, talks, and podcasts.
 * Results are formatted with Google Search links so they're always findable.
 *
 * Query params:
 *   trackId   — e.g. "enterprise_sales"
 *   lessonId  — e.g. "es_3"
 *   lessonTitle — e.g. "The Champion Model"
 *
 * Auth: x-founder-pass header.
 */

import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import { FOUNDER_CONTEXT } from '../../founder-context';

const log = createLogger('FounderSchoolSources');

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

export interface Source {
  title: string;
  type: 'Book' | 'Article' | 'Paper' | 'Talk' | 'Podcast' | 'Tool';
  author: string;
  description: string;
  searchUrl: string;
}

export async function GET(req: NextRequest) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get('trackId') || '';
  const lessonTitle = searchParams.get('lessonTitle') || '';
  const lessonId = searchParams.get('lessonId') || '';

  if (!trackId || !lessonTitle) {
    return apiError({ error: 'trackId and lessonTitle are required', status: 400 });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return apiError({ error: 'AI not configured', status: 503 });

  const prompt = `${FOUNDER_CONTEXT}

You are a world-class research curator for a 16-year-old founder building an enterprise AI startup (Decision Intel).
The founder is studying the topic: "${lessonTitle}" (from the ${trackId.replace(/_/g, ' ')} track of their personalized curriculum).

Curate exactly 5 high-quality resources on this topic — the best books, articles, research papers, talks, or podcasts that would give the founder deep, practical knowledge. Prioritize:
1. Primary sources over summaries (original research papers, author's own writing, video talks)
2. Practically applicable content over pure theory
3. B2B / enterprise context where relevant
4. Well-known, verifiable sources (Kahneman, Maister, Christensen, Ries, Thiel, Rachleff, etc.)
5. Diversity of format — aim for mix of book, article, and talk/podcast

Return ONLY a JSON array of exactly 5 objects with these exact keys:
- title: the full title of the resource
- type: "Book" | "Article" | "Paper" | "Talk" | "Podcast" | "Tool"
- author: author or publisher name
- description: 1-2 sentences on exactly what the founder will learn from this resource and why it directly applies to their current stage
- searchQuery: a precise Google search query string to find this exact resource (e.g. "The Challenger Sale book Dixon Adamson")

No markdown, no explanation, no preamble. Raw JSON array only.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash',
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let raw: Array<{
      title: string;
      type: Source['type'];
      author: string;
      description: string;
      searchQuery: string;
    }>;

    try {
      raw = JSON.parse(cleaned);
      if (!Array.isArray(raw)) throw new Error('Not an array');
    } catch {
      log.error('Failed to parse sources JSON', { raw: text.slice(0, 500), lessonId });
      return apiError({ error: 'Failed to parse AI response', status: 500 });
    }

    // Convert searchQuery → Google Search URL (always resolvable, never hallucinated)
    const sources: Source[] = raw.map(s => ({
      title: s.title,
      type: s.type,
      author: s.author,
      description: s.description,
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(s.searchQuery)}`,
    }));

    return apiSuccess({ data: { sources, lessonId, trackId } });
  } catch (err) {
    log.error('Failed to fetch sources', { lessonId, err });
    return apiError({ error: 'Failed to fetch sources', status: 500 });
  }
}
