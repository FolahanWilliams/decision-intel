/**
 * GET /api/founder-hub/content/opportunities
 *
 * Scans the Decision Intel product context and returns 5 specific, ready-to-draft
 * content opportunities. Each includes a platform, content type, topic, hook,
 * and why-now rationale. Used by the Content Studio "Scan for ideas" feature.
 *
 * Auth: x-founder-pass header.
 */

import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass as checkFounderPass } from '@/lib/utils/founder-auth';
import { FOUNDER_CONTEXT } from '../../founder-context';

const log = createLogger('ContentOpportunities');

function verifyFounderPass(req: NextRequest): boolean {
  return checkFounderPass(req.headers.get('x-founder-pass')).ok;
}

export interface ContentOpportunity {
  id: string;
  platform: string;
  contentType: 'linkedin_post' | 'twitter_thread' | 'newsletter' | 'blog_post' | 'case_study_hook';
  title: string;
  angle: string;
  hook: string;
  whyNow: string;
}

const SYSTEM_PROMPT = `${FOUNDER_CONTEXT}

You are now acting as a B2B content strategist for Decision Intel. Your job is to surface 5 high-signal content opportunities that would resonate with the target audience (Chief Strategy Officers, Heads of Corporate Strategy, M&A directors, steering-committee members, and Fortune 1000 board-level executives).

Rules:
- Every opportunity must be specific to Decision Intel's actual capabilities (DQI score, bias taxonomy, 12-node pipeline, conviction score, etc.) — no generic "thought leadership" advice
- Each post must position the founder as a genuine expert, not a product pusher
- Prioritise angles that are contrarian, data-backed, or teach something counterintuitive
- Match the founder's voice: direct, confident, technical credibility with strategic clarity
- Mix platforms: include at least one LinkedIn post, one Twitter/X thread, and one longer-form piece
- The "hook" should be the literal opening sentence of the post, ready to use

Return ONLY a JSON array with exactly 5 objects. Each object must have these exact keys:
- id: unique string (e.g. "opp_1")
- platform: one of "LinkedIn" | "Twitter/X" | "Newsletter" | "Blog" | "Case Study"
- contentType: one of "linkedin_post" | "twitter_thread" | "newsletter" | "blog_post" | "case_study_hook"
- title: 8-12 word headline for the piece
- angle: 1-2 sentence explanation of the strategic angle
- hook: the literal opening sentence (25-40 words)
- whyNow: 1 sentence explaining why this is timely

No markdown, no explanation — just the raw JSON array.`;

export async function GET(req: NextRequest) {
  if (!verifyFounderPass(req)) {
    return apiError({ error: 'Unauthorized', status: 401 });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return apiError({ error: 'AI not configured', status: 503 });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(SYSTEM_PROMPT);
    const text = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps the JSON
    const cleaned = text
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    let opportunities: ContentOpportunity[];
    try {
      opportunities = JSON.parse(cleaned);
      if (!Array.isArray(opportunities)) throw new Error('Not an array');
    } catch {
      log.error('Failed to parse opportunities JSON', { raw: text.slice(0, 500) });
      return apiError({ error: 'Failed to parse AI response', status: 500 });
    }

    return apiSuccess({ data: opportunities });
  } catch (err) {
    log.error('Failed to generate content opportunities', err);
    return apiError({ error: 'Failed to generate opportunities', status: 500 });
  }
}
