/**
 * POST /api/founder-hub/sparring/generate-questions
 *
 * Generates a 3-question sales scenario for the Sparring Room. Given a
 * persona × scenario-mode, returns a buyer-voice opener line + 3 questions
 * the buyer would realistically ask in that mode.
 *
 * Auth: founder-only (FOUNDER_HUB_PASS / NEXT_PUBLIC_FOUNDER_HUB_PASS).
 * Rate limit: 50/day per user (this fires on every fresh rep).
 * Model: Grok 4.3 (xai/grok-4.3) via Vercel AI Gateway — Phase 2 lock
 * 2026-05-02. Founder-hub AI surface, single-user. Mock fallback when
 * AI_GATEWAY_API_KEY missing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_FOUNDER_HUB } from '@/lib/ai/gateway-models';
import { getRequiredEnvVar } from '@/lib/env';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass, checkFounderHubLlmRateLimit } from '@/lib/utils/founder-auth';
import {
  findPersonaById,
  findScenarioById,
  findScenarioTemplate,
  MOCK_QUESTIONS,
  type BuyerPersonaId,
  type ScenarioMode,
} from '@/components/founder-hub/sparring/sparring-room-data';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';

const log = createLogger('SparringGenerateQuestions');

// Derived — canonical bias count for the LLM system prompt (LLM prompt strings
// are user-visible prose per the 2026-05-29 lock; the legacy "30+ bias
// taxonomy" phrasing was deprecated 2026-05-13, CR-3).
const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;

interface RequestBody {
  personaId: BuyerPersonaId;
  mode: ScenarioMode;
}

interface ResponseBody {
  openerLine: string;
  questions: string[];
  scenarioFraming: string;
  isMock?: boolean;
}

function extractJSON(text: string): unknown {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonText = match ? match[1] : text;
  const start = jsonText.indexOf('{');
  const end = jsonText.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found');
  return JSON.parse(jsonText.slice(start, end + 1));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth
  const founderPass = req.headers.get('x-founder-pass') || '';
  // SECURITY (2026-06-09): verifyFounderPass returns an OBJECT — `!obj` is always
  // false, so the prior guard NEVER fired and this LLM endpoint was effectively
  // unauthenticated. Guard on `.ok`. Structural check: dead-founder-pass-guard
  // in scripts/audit-platform.mjs.
  if (!verifyFounderPass(founderPass).ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cost-burn cap (2026-06-09 security sweep): pass-gated is not enough — the
  // UI credential is bundle-extractable and every call costs real LLM spend.
  if (!(await checkFounderHubLlmRateLimit('sparring-generate'))) {
    return NextResponse.json(
      { error: 'Rate limit exceeded — try again in a minute.' },
      { status: 429 }
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const persona = findPersonaById(body.personaId);
  const scenario = findScenarioById(body.mode);
  if (!persona || !scenario) {
    return NextResponse.json({ error: 'Unknown persona or mode' }, { status: 400 });
  }

  const template = findScenarioTemplate(body.personaId, body.mode);

  // Mock fallback when no API key.
  let apiKey: string | null;
  try {
    apiKey = getRequiredEnvVar('AI_GATEWAY_API_KEY');
  } catch {
    apiKey = null;
  }
  if (!apiKey) {
    const mock = MOCK_QUESTIONS[body.mode] || MOCK_QUESTIONS.default;
    const response: ResponseBody = {
      openerLine: mock.openerLine,
      questions: mock.questions,
      scenarioFraming: `${persona.label} (${persona.archetype}) · ${scenario.label}. ${scenario.description}`,
      isMock: true,
    };
    return NextResponse.json(response);
  }

  const triggerWordsBlock = persona.triggerWords.length
    ? `\nThis persona will mentally disengage if they hear: ${persona.triggerWords.join(', ')}.`
    : '';
  const nativeVocabBlock = persona.nativeVocabulary.length
    ? `\nThey naturally use words like: ${persona.nativeVocabulary.join(', ')}.`
    : '';
  const objectionsBlock = persona.topSilentObjections.length
    ? `\nTheir top silent objections (NOT verbalised, but driving their questions):\n${persona.topSilentObjections.map(o => `  - ${o}`).join('\n')}`
    : '';

  const prompt = `You are simulating a real buyer for a B2B SaaS sales-practice exercise. Your job is to generate the OPENING LINE the buyer says + 3 questions they ask the salesperson, in the buyer's authentic voice.

CONTEXT — the salesperson is selling Decision Intel, "the reasoning audit platform" (their 2026-05-04 locked category claim). It runs a 60-second audit on strategic memos / IC memos / CIMs, scoring cognitive biases against a ${BIAS_COUNT}-bias taxonomy and producing a Decision Provenance Record (procurement-grade artefact, hashed + tamper-evident). The contrast: most tools audit data; they audit human reasoning — catching the fatal blind spots in strategic memos before the committee does.

THE BUYER YOU ARE SIMULATING:
- Role + company shape: ${persona.rolePlayIntro}
- Primary concern: ${persona.primaryConcern}
- Verbal style: ${persona.verbalStyle}
- Default skepticism level: ${persona.defaultSkepticism}
- Conversion speed: ${persona.conversionSpeed}${nativeVocabBlock}${triggerWordsBlock}${objectionsBlock}

THE SCENARIO MODE:
- Mode: ${scenario.label}
- Description: ${scenario.description}
- The buyer's state of mind: ${scenario.buyerStateOfMind}
- Funnel stage: ${scenario.funnelStage}${template ? `\n- Specific framing: ${template.generatorHint}` : ''}

YOUR TASK — generate this buyer's authentic conversation opener:
1. Generate ONE opening line — the FIRST thing the buyer says when the call starts. Should set tone (skeptical / curious / impatient / warm). Include a brief stage direction in parentheses if it adds realism (e.g., "(taps pen)" or "(checks watch)").
2. Generate 3 QUESTIONS the buyer would realistically ask in this mode. Order them as the buyer would naturally ask — the easy one first, then the harder one, then the hardest. Each question should:
   - Sound like THIS specific persona, not generic
   - Use their native vocabulary
   - NOT trigger their internal eye-roll
   - Probe one of their top silent objections (without verbalising it directly)
   - Be one sentence each, conversational tone

DO NOT use any of these triggers in YOUR generated questions: ${persona.triggerWords.join(', ')}.

Output ONLY valid JSON (no prose, no markdown fence). Format:
{
  "openerLine": "...",
  "questions": ["...", "...", "..."]
}`;

  try {
    const result = await generateText(prompt, {
      model: MODEL_FOUNDER_HUB,
      maxOutputTokens: 1500,
      temperature: 0.7,
    });
    const data = extractJSON(result.text) as { openerLine: string; questions: string[] };

    if (!data.openerLine || !Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error('Malformed response from Gateway');
    }

    const response: ResponseBody = {
      openerLine: data.openerLine,
      questions: data.questions.slice(0, 3),
      scenarioFraming: `${persona.label} (${persona.archetype}) · ${scenario.label}. ${scenario.description}`,
    };
    return NextResponse.json(response);
  } catch (err) {
    log.error('Question generation failed', err);
    // Fall back to mock so the UI stays usable.
    const mock = MOCK_QUESTIONS[body.mode] || MOCK_QUESTIONS.default;
    const response: ResponseBody = {
      openerLine: mock.openerLine,
      questions: mock.questions,
      scenarioFraming: `${persona.label} (${persona.archetype}) · ${scenario.label}. ${scenario.description}`,
      isMock: true,
    };
    return NextResponse.json(response);
  }
}
