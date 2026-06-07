/**
 * SAT Prep — AI drill/vocab generator (founder-private).
 *
 * Generates targeted practice for a DIAGNOSED weak skill. This is the drill
 * layer ONLY — official Bluebook/Khan/released tests remain the sole source of
 * the projected score (AI questions are off-distribution at the 1550 ceiling).
 * Nothing here is persisted as a test result; misses are logged by the client
 * to /api/founder-os/sat/error-log.
 *
 * POST { kind: 'drill' | 'vocab', section?, skill?, skillLabel?, count? }
 * Mock fallback when AI_GATEWAY_API_KEY is missing, so the surface works
 * without credentials (mirrors the education grade-recall route).
 */

import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_CHEAP } from '@/lib/ai/gateway-models';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SatGenerate');

export const dynamic = 'force-dynamic';

interface DrillQuestion {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}
interface VocabWord {
  word: string;
  definition: string;
  partOfSpeech?: string;
  mnemonic?: string;
  etymology?: string;
  exampleSentence?: string;
}

function hasKey(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

function stripFences(text: string): string {
  return text
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();
}

function mockDrill(skillLabel: string): DrillQuestion[] {
  return [
    {
      prompt: `Mock drill (AI_GATEWAY_API_KEY not set) on "${skillLabel}". Set the key for real targeted questions. Which option is correct?`,
      choices: ['Correct option', 'Distractor A', 'Distractor B', 'Distractor C'],
      correctIndex: 0,
      explanation: 'Illustrative only — configure AI_GATEWAY_API_KEY for genuine SAT-style drills.',
    },
  ];
}
function mockVocab(): VocabWord[] {
  return [
    {
      word: 'ostensible',
      definition: 'Stated or appearing to be true, but not necessarily so.',
      partOfSpeech: 'adjective',
      mnemonic: '"Osten-" sounds like "shown" — shown on the surface, not the reality beneath.',
      exampleSentence:
        'The ostensible reason for the meeting was budget; the real one was politics.',
    },
  ];
}

export async function POST(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }
  let body: {
    kind?: string;
    section?: string;
    skill?: string;
    skillLabel?: string;
    count?: number;
  };
  try {
    body = await request.json();
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }
  const kind = body.kind === 'vocab' ? 'vocab' : 'drill';
  const section = body.section === 'rw' ? 'Reading & Writing' : 'Math';
  const skillLabel =
    typeof body.skillLabel === 'string' && body.skillLabel.trim()
      ? body.skillLabel.trim().slice(0, 80)
      : 'general practice';
  const count = Math.min(5, Math.max(1, Math.round(Number(body.count) || 3)));

  // ── vocab ──────────────────────────────────────────────────────────
  if (kind === 'vocab') {
    if (!hasKey()) return apiSuccess({ data: { words: mockVocab() } });
    const prompt = `You are a digital SAT verbal expert. Generate ${count} SAT-relevant vocabulary words (high-utility, words-in-context style — NOT obscure archaic words the modern digital SAT has dropped).
For each: a concise definition, part of speech, a memorable mnemonic, a short etymology, and one example sentence in an SAT register.
Return ONLY valid JSON: {"words":[{"word":"","definition":"","partOfSpeech":"","mnemonic":"","etymology":"","exampleSentence":""}]}`;
    try {
      const { text } = await generateText(prompt, { model: MODEL_CHEAP, temperature: 0.6 });
      const parsed = JSON.parse(stripFences(text)) as { words?: VocabWord[] };
      const words = Array.isArray(parsed.words)
        ? parsed.words
            .filter(w => w && typeof w.word === 'string' && typeof w.definition === 'string')
            .slice(0, count)
        : [];
      return apiSuccess({ data: { words: words.length ? words : mockVocab() } });
    } catch (err) {
      log.warn('vocab gen failed:', err);
      return apiSuccess({ data: { words: mockVocab() } });
    }
  }

  // ── drill ──────────────────────────────────────────────────────────
  if (!hasKey()) return apiSuccess({ data: { questions: mockDrill(skillLabel) } });
  const prompt = `You are a digital SAT (post-2024 adaptive) item writer. Generate ${count} ${section} multiple-choice questions targeting the skill "${skillLabel}".
Rules:
- Match real digital SAT difficulty, phrasing, and answer-choice logic (plausible distractors that mirror common errors).
- ${section === 'Reading & Writing' ? 'Include a short self-contained passage or sentence as context where the skill requires it.' : 'State the problem cleanly; use realistic numbers.'}
- Exactly 4 choices; exactly one correct.
- Each explanation is one sentence naming WHY the right answer is right and the trap in the tempting wrong one.
Return ONLY valid JSON: {"questions":[{"prompt":"","choices":["","","",""],"correctIndex":0,"explanation":""}]}`;
  try {
    const { text } = await generateText(prompt, { model: MODEL_CHEAP, temperature: 0.5 });
    const parsed = JSON.parse(stripFences(text)) as { questions?: DrillQuestion[] };
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions
          .filter(
            q =>
              q &&
              typeof q.prompt === 'string' &&
              Array.isArray(q.choices) &&
              q.choices.length === 4 &&
              typeof q.correctIndex === 'number' &&
              q.correctIndex >= 0 &&
              q.correctIndex < 4
          )
          .slice(0, count)
      : [];
    return apiSuccess({
      data: { questions: questions.length ? questions : mockDrill(skillLabel) },
    });
  } catch (err) {
    log.warn('drill gen failed:', err);
    return apiSuccess({ data: { questions: mockDrill(skillLabel) } });
  }
}
