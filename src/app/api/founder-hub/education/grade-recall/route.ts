/**
 * POST /api/founder-hub/education/grade-recall
 *
 * Grades a user's typed recall answer against the canonical answer of an
 * Education Room card. Returns 0-100 score, letter grade, what landed,
 * what missed, and a coach note for next time.
 *
 * Auth: founder-only.
 * Model: Grok 4.3 (xai/grok-4.3) via Vercel AI Gateway — Phase 2 lock
 * 2026-05-02. Founder-hub AI surfaces use Grok per founder pick (similar
 * pricing to Gemini 3 Flash with reportedly better instruction-following
 * on persona-voice + grading tasks). Single-user surface (founder only),
 * so model variation doesn't cascade across customers.
 * Mock fallback when AI_GATEWAY_API_KEY missing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_FOUNDER_HUB } from '@/lib/ai/gateway-models';
import { getRequiredEnvVar } from '@/lib/env';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import {
  findCard,
  gradeFromRecallScore,
  type RecallGradeResult,
} from '@/components/founder-hub/education/education-room-data';

const log = createLogger('EducationGradeRecall');

interface RequestBody {
  cardId: string;
  /** The user's typed recall attempt. */
  userAnswer: string;
}

const MAX_USER_ANSWER_CHARS = 4000;

function extractJSON(text: string): unknown {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonText = match ? match[1] : text;
  const start = jsonText.indexOf('{');
  const end = jsonText.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found');
  return JSON.parse(jsonText.slice(start, end + 1));
}

// ─── Mock fallback ───────────────────────────────────────────────

function mockResult(canonical: string, userAnswer: string): RecallGradeResult {
  // Naive overlap-based mock score: ~60% if user wrote substantial content.
  const userWords = userAnswer.toLowerCase().split(/\s+/).filter(Boolean);
  const score = userWords.length < 5 ? 20 : userWords.length < 20 ? 50 : 70;
  return {
    score,
    grade: gradeFromRecallScore(score),
    whatLanded: ['Mock response — AI_GATEWAY_API_KEY not set. The grading is illustrative only.'],
    whatMissed: ['Set AI_GATEWAY_API_KEY for real coach-grade feedback.'],
    canonicalAnswer: canonical,
    coachNote:
      'When the gateway key is set, the AI will compare your answer semantically against the canonical and surface specific gaps.',
  };
}

// ─── Handler ─────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const founderPass = req.headers.get('x-founder-pass') || '';
  if (!verifyFounderPass(founderPass)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const card = findCard(body.cardId);
  if (!card) {
    return NextResponse.json({ error: 'Unknown card id' }, { status: 400 });
  }
  if (!body.userAnswer || body.userAnswer.trim().length < 5) {
    return NextResponse.json(
      { error: 'Answer too short — type at least a sentence.' },
      { status: 400 }
    );
  }

  const userAnswer = body.userAnswer.slice(0, MAX_USER_ANSWER_CHARS);

  // Mock fallback when no Gateway key.
  let apiKey: string | null;
  try {
    apiKey = getRequiredEnvVar('AI_GATEWAY_API_KEY');
  } catch {
    apiKey = null;
  }
  if (!apiKey) {
    return NextResponse.json(mockResult(card.canonicalAnswer, userAnswer));
  }

  const prompt = `You are a knowledge-recall coach grading a founder's typed recall of a Decision Intel concept. The founder is studying for live sales conversations — they need to recall this information under pressure.

THE PROMPT THE FOUNDER WAS GIVEN:
"${card.prompt}"

THE CANONICAL ANSWER (ground truth):
"""
${card.canonicalAnswer}
"""

THE FOUNDER'S TYPED RECALL:
"""
${userAnswer}
"""

GRADE the recall on semantic faithfulness to the canonical answer. The founder doesn't need to match wording exactly — they need to capture the LOAD-BEARING concepts in their own voice. The goal is mastery for live conversation use, not verbatim memorisation.

Score 0-100:
  - 90-100: All load-bearing concepts captured + correctly phrased + nuance preserved.
  - 70-89: Most load-bearing concepts captured; minor gaps or slight imprecision.
  - 55-69: About half the load-bearing concepts; missed one important nuance or inverted a meaning.
  - 40-54: Some recognition but missed multiple key concepts or got something materially wrong.
  - <40: Wrong on the central concept, or essentially blank.

Output:
- score: integer 0-100
- whatLanded: array of 1-3 specific concepts the founder GOT RIGHT. Quote a phrase from their answer if possible.
- whatMissed: array of 1-3 specific concepts they missed or got wrong. Be precise — name the specific gap.
- coachNote: ONE sentence the founder should remember next time. Actionable, specific.

Output ONLY valid JSON (no prose, no markdown fence):
{
  "score": 0-100,
  "whatLanded": ["...", "..."],
  "whatMissed": ["...", "..."],
  "coachNote": "..."
}`;

  try {
    const result = await generateText(prompt, {
      model: MODEL_FOUNDER_HUB,
      maxOutputTokens: 1500,
      temperature: 0.3,
    });
    const data = extractJSON(result.text) as {
      score: number;
      whatLanded: string[];
      whatMissed: string[];
      coachNote: string;
    };

    const score = Math.max(0, Math.min(100, Math.round(Number(data.score) || 0)));
    const response: RecallGradeResult = {
      score,
      grade: gradeFromRecallScore(score),
      whatLanded: Array.isArray(data.whatLanded)
        ? data.whatLanded.slice(0, 3).map(s => String(s).slice(0, 300))
        : [],
      whatMissed: Array.isArray(data.whatMissed)
        ? data.whatMissed.slice(0, 3).map(s => String(s).slice(0, 300))
        : [],
      canonicalAnswer: card.canonicalAnswer,
      coachNote: String(data.coachNote || '').slice(0, 400),
    };
    return NextResponse.json(response);
  } catch (err) {
    log.error('Recall grading failed', err);
    return NextResponse.json(mockResult(card.canonicalAnswer, userAnswer));
  }
}
