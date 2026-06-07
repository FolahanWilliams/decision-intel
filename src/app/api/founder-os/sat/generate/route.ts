/**
 * SAT Prep — AI drill/vocab generator (founder-private).
 *
 * Generates targeted practice for a DIAGNOSED weak skill. This is the drill
 * layer ONLY — official Bluebook/Khan/released tests remain the sole source of
 * the projected score (AI questions are off-distribution at the 1550 ceiling).
 * Nothing here is persisted as a test result; misses are logged by the client
 * to /api/founder-os/sat/error-log.
 *
 * POST { kind: 'drill' | 'vocab', section?, skill?, skillLabel?, count?, exclude? }
 * Vocab is generated HARD (1550-ceiling) with full substrate (IPA / synonyms /
 * antonyms / related / cloze) and dedups against `exclude` (words you already have).
 * Mock fallback when AI_GATEWAY_API_KEY is missing, so the surface works
 * without credentials (mirrors the education grade-recall route).
 */

import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_CHEAP } from '@/lib/ai/gateway-models';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { SAT_VOCAB_GEN } from '@/components/founder-hub/sat/sat-content';

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
  ipa?: string;
  mnemonic?: string;
  etymology?: string;
  synonyms?: string[];
  antonyms?: string[];
  relatedWords?: string[];
  exampleSentence?: string;
  clozeSentence?: string;
}

function strArr(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map(x => x.trim())
    .slice(0, max);
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
  // Hard, 1550-ceiling words with full substrate — so the surface is GOOD even
  // without an API key (no more mid-level "underscore"-tier filler).
  return [
    {
      word: 'tenuous',
      definition: 'Very weak or slight; lacking a sound basis.',
      partOfSpeech: 'adjective',
      ipa: '/ˈtɛn.ju.əs/',
      mnemonic: 'Think "thin" — a tenuous argument is stretched thin to the point of snapping.',
      etymology: 'Latin tenuis "thin".',
      synonyms: ['flimsy', 'precarious', 'shaky'],
      antonyms: ['robust', 'sound'],
      relatedWords: ['tenuity', 'attenuate'],
      exampleSentence: 'The prosecution rested on a tenuous chain of circumstantial details.',
      clozeSentence: 'The prosecution rested on a _____ chain of circumstantial details.',
    },
    {
      word: 'sanguine',
      definition: 'Optimistic or confident, especially in a difficult situation.',
      partOfSpeech: 'adjective',
      ipa: '/ˈsæŋ.ɡwɪn/',
      mnemonic: 'From "blood" (sanguis) — a hearty, ruddy, cheerful temperament.',
      etymology: 'Latin sanguis "blood" (the cheerful humour in medieval physiology).',
      synonyms: ['hopeful', 'buoyant', 'upbeat'],
      antonyms: ['gloomy', 'pessimistic'],
      relatedWords: ['sanguinity'],
      exampleSentence: 'Despite the losses, the founder remained sanguine about the next quarter.',
      clozeSentence: 'Despite the losses, the founder remained _____ about the next quarter.',
    },
    {
      word: 'cogent',
      definition: 'Clear, logical, and convincing.',
      partOfSpeech: 'adjective',
      ipa: '/ˈkoʊ.dʒənt/',
      mnemonic: '"Co-" + "agent": an argument that acts on you and compels agreement.',
      etymology: 'Latin cogere "to compel".',
      synonyms: ['compelling', 'persuasive', 'incisive'],
      antonyms: ['unconvincing', 'incoherent'],
      relatedWords: ['cogency'],
      exampleSentence: 'She gave a cogent rebuttal that left the committee with no real objection.',
      clozeSentence: 'She gave a _____ rebuttal that left the committee with no real objection.',
    },
    {
      word: 'circumspect',
      definition: 'Cautious; mindful of consequences before acting.',
      partOfSpeech: 'adjective',
      ipa: '/ˈsɜːr.kəm.spekt/',
      mnemonic: '"Circum-" (around) + "spect" (look): looking all around before you step.',
      etymology: 'Latin circumspicere "to look around".',
      synonyms: ['prudent', 'wary', 'judicious'],
      antonyms: ['rash', 'reckless'],
      relatedWords: ['circumspection'],
      exampleSentence:
        'A circumspect negotiator, he revealed his position only after hearing theirs.',
      clozeSentence: 'A _____ negotiator, he revealed his position only after hearing theirs.',
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
    exclude?: string[];
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
    const exclude = strArr(body.exclude, 200).map(w => w.toLowerCase());
    const excludeSet = new Set(exclude);
    const dedupe = (ws: VocabWord[]) => ws.filter(w => !excludeSet.has(w.word.toLowerCase()));
    // Mock is GOOD now (hard words); dedupe it too, but never return nothing.
    const mockFallback = () => {
      const m = dedupe(mockVocab());
      return m.length ? m.slice(0, count) : mockVocab().slice(0, count);
    };
    if (!hasKey()) return apiSuccess({ data: { words: mockFallback() } });
    const prompt = `You are a digital SAT verbal expert. Generate ${count} HARD, 1550-ceiling SAT vocabulary words — nuanced, mid-to-advanced academic words a strong reader still has to reason about in context.
TARGET TIER (aim at this difficulty): ${SAT_VOCAB_GEN.targetExamples.join(', ')}.
TOO EASY — never output these or anything at their common level: ${SAT_VOCAB_GEN.tooEasyExamples.join(', ')}.${
      exclude.length
        ? `\nALREADY KNOWN — exclude all of these and close variants: ${exclude.slice(0, 120).join(', ')}.`
        : ''
    }
The modern digital SAT tests words IN CONTEXT (shades of meaning), not obscure archaic recall — pick high-utility academic words, NOT antiquated words the test has dropped.
For each word: a concise definition, part of speech, IPA pronunciation, a memorable mnemonic, a short etymology, 2-4 synonyms, 1-3 antonyms, 2-3 related words, one example sentence in an SAT register, and a cloze version of that exact sentence with the target word replaced by exactly "_____".
Return ONLY valid JSON: {"words":[{"word":"","definition":"","partOfSpeech":"","ipa":"","mnemonic":"","etymology":"","synonyms":[],"antonyms":[],"relatedWords":[],"exampleSentence":"","clozeSentence":""}]}`;
    try {
      const { text } = await generateText(prompt, { model: MODEL_CHEAP, temperature: 0.6 });
      const parsed = JSON.parse(stripFences(text)) as { words?: VocabWord[] };
      const words = Array.isArray(parsed.words)
        ? dedupe(
            parsed.words
              .filter(w => w && typeof w.word === 'string' && typeof w.definition === 'string')
              .map(w => ({
                word: w.word.trim().slice(0, 80),
                definition: w.definition.trim().slice(0, 1000),
                partOfSpeech: typeof w.partOfSpeech === 'string' ? w.partOfSpeech : undefined,
                ipa: typeof w.ipa === 'string' ? w.ipa : undefined,
                mnemonic: typeof w.mnemonic === 'string' ? w.mnemonic : undefined,
                etymology: typeof w.etymology === 'string' ? w.etymology : undefined,
                synonyms: strArr(w.synonyms, 6),
                antonyms: strArr(w.antonyms, 4),
                relatedWords: strArr(w.relatedWords, 4),
                exampleSentence:
                  typeof w.exampleSentence === 'string' ? w.exampleSentence : undefined,
                clozeSentence: typeof w.clozeSentence === 'string' ? w.clozeSentence : undefined,
              }))
          ).slice(0, count)
        : [];
      return apiSuccess({ data: { words: words.length ? words : mockFallback() } });
    } catch (err) {
      log.warn('vocab gen failed:', err);
      return apiSuccess({ data: { words: mockFallback() } });
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
