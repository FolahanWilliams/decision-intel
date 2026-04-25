/**
 * GET /api/founder-hub/content/weekly-brief
 *
 * Generates a 5-post content brief for the current week, one per brand pillar,
 * ready to draft from the Content Studio. Each brief includes platform, hook,
 * key points, and CTA — all grounded in Folahan's real positioning.
 *
 * Auth: x-founder-pass header.
 */

import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import { FOUNDER_CONTEXT } from '../../founder-context';

const log = createLogger('WeeklyBrief');

function verify(req: NextRequest): boolean {
  return verifyFounderPass(req.headers.get('x-founder-pass')).ok;
}

export interface PostBrief {
  id: string;
  day: string;
  pillar:
    | 'decision_science'
    | 'founder_journey'
    | 'enterprise_ai'
    | 'market_insight'
    | 'social_proof';
  pillarLabel: string;
  platform: string;
  contentType: 'linkedin_post' | 'twitter_thread' | 'newsletter' | 'blog_post';
  headline: string;
  angle: string;
  hook: string;
  keyPoints: string[];
  cta: string;
}

const BRAND_PILLARS = `
BRAND PILLARS (one post per pillar):

1. decision_science — Educational authority. Teach something counterintuitive about how smart teams still make bad decisions. Use real frameworks (Kahneman, Tetlock, Klein). The reader should feel smarter. No product pitch.

2. founder_journey — Human connection. The improbable story: 16 years old, solo, Nigeria, building for Fortune 500 boardrooms. Behind-the-build moments, lessons learned, uncomfortable truths about the process. Authentic and specific.

3. enterprise_ai — Technical credibility. Specific take on AI's role in M&A, due diligence, boardroom decisions. Not "AI will change everything" — a precise, contrarian observation about where AI actually works and where it fails in enterprise decision-making.

4. market_insight — Provocation. Pick a famous bad deal or decision (Boeing MAX, WeWork, Quibi, Microsoft-Nokia, Softbank Vision Fund). Run an autopsy. Show which cognitive bias caused it. Make the reader uncomfortable because they recognise the pattern in their own org.

5. social_proof — Credibility signal. A hook from a case study, a quantified finding from an audit, or a "what we found in a real board memo" reveal. Never fabricate data — frame as illustrative or hypothetical if not from a real audit.

FOLAHAN'S UNIQUE ANGLES (weave these in — they are differentiating):
- 16-year-old building for F1000 boardrooms: the contrast is the story
- Solo founder running what normally takes a team of 10
- Nigeria-based with global enterprise ambition — represent a new generation of African tech founders
- Advised by a consultant who helped take Wiz from startup to $32B
- No direct competitor exists in "decision quality auditing" — the real competition is "do nothing"`;

const SYSTEM_PROMPT = `${FOUNDER_CONTEXT}

${BRAND_PILLARS}

You are acting as a B2B content strategist and ghostwriter for Folahan Williams, the founder of Decision Intel.

Generate a 5-post content brief for this week — one post per brand pillar, spread across Monday through Friday. Every post must:
- Be grounded in Decision Intel's actual capabilities (DQI score, 20-bias taxonomy, 12-node pipeline, conviction score, forgotten-questions detector)
- Position Folahan as a genuine expert, not a product pusher
- Have a hook that would make a corporate strategy director stop scrolling
- Be specific — no generic "AI is changing everything" or "here's why decisions matter"
- Mix platforms: at least 3 LinkedIn posts, 1 Twitter/X thread, 1 Newsletter or Blog piece

Return ONLY a JSON array of exactly 5 objects. Each object must have these exact keys:
- id: "brief_1" through "brief_5"
- day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday"
- pillar: one of the 5 pillar IDs above
- pillarLabel: human-readable name (e.g. "Decision Science")
- platform: "LinkedIn" | "Twitter/X" | "Newsletter" | "Blog"
- contentType: "linkedin_post" | "twitter_thread" | "newsletter" | "blog_post"
- headline: 8-12 word title for the piece
- angle: 1-2 sentences on the strategic angle
- hook: the literal opening sentence (25-40 words), ready to copy
- keyPoints: array of exactly 3 bullet points — the key ideas to cover
- cta: the closing question or call-to-action (1 sentence)

No markdown, no explanation — raw JSON array only.`;

export async function GET(req: NextRequest) {
  if (!verify(req)) return apiError({ error: 'Unauthorized', status: 401 });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return apiError({ error: 'AI not configured', status: 503 });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || 'gemini-3.1-flash-lite',
    });

    const result = await model.generateContent(SYSTEM_PROMPT);
    const text = result.response.text().trim();
    const cleaned = text
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    let briefs: PostBrief[];
    try {
      briefs = JSON.parse(cleaned);
      if (!Array.isArray(briefs)) throw new Error('Not an array');
    } catch {
      log.error('Failed to parse weekly brief JSON', { raw: text.slice(0, 500) });
      return apiError({ error: 'Failed to parse AI response', status: 500 });
    }

    return apiSuccess({ data: { briefs } });
  } catch (err) {
    log.error('Failed to generate weekly brief', err);
    return apiError({ error: 'Failed to generate weekly brief', status: 500 });
  }
}
