/**
 * POST /api/founder-hub/sparring/grade
 *
 * Grades a Sparring Room rep. Given the persona × scenario × questions
 * × pasted Wispr Flow transcript, returns a 10-dimension Sales DQI
 * scorecard, 2 strengths, 3 framework-grounded improvements, a
 * buyer-perspective simulation, and filler-word + vocabulary-discipline
 * counts.
 *
 * Auth: founder-only. Rate limit: 50/day per user (matches generate).
 * Model: gemini-3-flash-preview. Mock fallback when no API key.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import {
  findPersonaById,
  findScenarioById,
  GRADING_DIMENSIONS,
  FILLER_WORD_PATTERNS,
  DI_BANNED_VOCABULARY,
  DI_LOCKED_VOCABULARY,
  computeSalesDqi,
  gradeFromDqi,
  type BuyerPersonaId,
  type ScenarioMode,
  type GradingDimensionId,
  type SparringSessionResult,
} from '@/components/founder-hub/sparring/sparring-room-data';

const log = createLogger('SparringGrade');

interface RequestBody {
  personaId: BuyerPersonaId;
  mode: ScenarioMode;
  questions: string[];
  /** The Wispr Flow transcript the founder pasted. */
  transcript: string;
  /** Whether the conversation context is "warm" (founder has earned the locked vocabulary). */
  isWarmContext?: boolean;
  /**
   * Optional rolling-average per-dimension scores from the founder's
   * recent reps (last 5). When provided, the grader can identify
   * patterns ("you've under-scored on loss-aversion-framing in 3 of
   * the last 5 reps — that's a pattern, not a one-off") and surface
   * them in the patternFlag field. Lets the grader act as a longitudinal
   * coach instead of a per-rep judge.
   */
  recentDimensionAverages?: Partial<Record<GradingDimensionId, number>>;
  /** Optional count of reps the founder has completed (>= 3 unlocks pattern detection). */
  totalRepsCompleted?: number;
}

const MAX_TRANSCRIPT_CHARS = 8000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedModel: any = null;

function getModel() {
  if (cachedModel) return cachedModel;
  const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');
  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
    generationConfig: { maxOutputTokens: 2500, temperature: 0.4 },
  });
  cachedModel = model;
  return model;
}

function extractJSON(text: string): unknown {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonText = match ? match[1] : text;
  const start = jsonText.indexOf('{');
  const end = jsonText.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found');
  return JSON.parse(jsonText.slice(start, end + 1));
}

// ─── Mechanical analysis of the transcript ───────────────────────

function countFillers(transcript: string): { count: number; words: string[] } {
  const lower = transcript.toLowerCase();
  const words: string[] = [];
  for (const pattern of FILLER_WORD_PATTERNS) {
    const re = new RegExp(`\\b${pattern.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = lower.match(re);
    if (matches) {
      for (let i = 0; i < matches.length; i++) words.push(pattern);
    }
  }
  return { count: words.length, words };
}

function countWordsAndSentences(transcript: string): { wordCount: number; sentenceCount: number } {
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const sentenceCount = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  return { wordCount, sentenceCount };
}

function detectVocabularyHits(transcript: string, vocabList: string[]): string[] {
  const lower = transcript.toLowerCase();
  const hits: string[] = [];
  for (const phrase of vocabList) {
    const re = new RegExp(`\\b${phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(lower)) hits.push(phrase);
  }
  return hits;
}

// ─── Grading prompt ──────────────────────────────────────────────

function buildGradingPrompt(body: RequestBody, persona: ReturnType<typeof findPersonaById>, scenario: ReturnType<typeof findScenarioById>): string {
  if (!persona || !scenario) throw new Error('Persona or scenario not found');

  const dimensionsBlock = GRADING_DIMENSIONS.map(d =>
    `  - ${d.id} (source: ${d.source}, weight: ${d.weight}): ${d.label}\n      Excellent (5/5): ${d.excellentLooks}\n      Poor (1/5): ${d.poorLooks}`
  ).join('\n');

  const warmContextNote = body.isWarmContext
    ? 'The conversation context is WARM — the buyer has already had at least one prior meeting and has earned exposure to DI\'s locked vocabulary (reasoning layer / R²F / DPR / DQI). Using locked vocabulary HERE is positive.'
    : 'The conversation context is COLD — the buyer has not yet earned exposure to DI\'s platform vocabulary. Using "reasoning layer" / "R²F" / "DPR" without descriptive bridging is a negative; the salesperson should lead with descriptive plain language ("60-second audit", "pre-IC bias detection", "decision quality auditing").';

  // Pattern detection — only enabled when the founder has 3+ reps logged.
  const recentReps = body.totalRepsCompleted ?? 0;
  const recentDims = body.recentDimensionAverages || {};
  const recentTrendBlock = recentReps >= 3 && Object.keys(recentDims).length > 0
    ? `\nLONGITUDINAL CONTEXT — the founder has completed ${recentReps} reps total. Their last-5 rolling average per dimension (where data exists):\n${
        Object.entries(recentDims)
          .map(([dim, avg]) => `  - ${dim}: ${(avg as number).toFixed(1)}/5`)
          .join('\n')
      }\nUse this to detect PATTERNS — if a dimension scored 2/5 here AND the rolling average is also <=2.5, that's a recurring weakness, not a one-off. Surface it in patternFlag with the rootCause + breakthroughMove.`
    : `\nThe founder has completed ${recentReps} reps total — pattern detection is unlocked at 3+ reps. patternFlag should be omitted in this response.`;

  return `You are an elite B2B sales coach. You grade reps with rigor BUT your job is to be a coach, not a judge. Every response must end with a concrete plan the founder can execute, not a list of things they did wrong.

You have deep expertise in:
- Eddie Maalouf's high-ticket-psychology principles (pressure without pressure, authority not trust, pinpoint pain, embody bigger and better)
- Satyam's sales-infrastructure framework (category of one, conviction transmission, sales infrastructure quality, charge more and win anyway)
- Decision Intel's locked vocabulary discipline (the empathic-mode-first rule, reader-temperature vocabulary discipline, banned phrases like "decision intelligence platform" / "decision hygiene" / "boardroom strategic decision")
- Kahneman & Tversky 1979 prospect theory (loss-aversion framing — losses weight ~2-2.5× gains)
- Matt Dixon's JOLT Effect (FOMU calibration / pre-buttal + prescriptive recommendation / quarterbacking)
- Robert Cialdini's Influence (damaging admission / arguing against own interest as authority signal)
- David Sandler's Selling System (mutual disqualification / honest off-ramp as the operational form of pressure-without-pressure)
- Specificity and sales fundamentals

You are grading a sales-practice rep. The salesperson is the FOUNDER of Decision Intel — a "native reasoning layer" platform that runs 60-second audits on strategic memos / IC memos / CIMs and produces a Decision Provenance Record. The founder is 16 years old, solo, technical. They are ${recentReps > 0 ? 'a returning rep practitioner' : 'just starting their rep practice'}.

THE SCENARIO:
- Buyer persona: ${persona.label} (${persona.archetype}). ${persona.rolePlayIntro}
- Buyer's primary concern: ${persona.primaryConcern}
- Buyer's verbal style: ${persona.verbalStyle}
- Buyer's top silent objections: ${persona.topSilentObjections.join(' | ')}
- Buyer's trigger words (would cause internal eye-roll): ${persona.triggerWords.join(', ')}
- Scenario mode: ${scenario.label} — ${scenario.description}
- Founder's objective in this mode: ${scenario.founderObjective}
- ${warmContextNote}${recentTrendBlock}

THE QUESTIONS THE BUYER ASKED (in order):
${body.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

THE FOUNDER'S RESPONSE (transcribed from voice via Wispr Flow):
"""
${body.transcript.slice(0, MAX_TRANSCRIPT_CHARS)}
"""

GRADE THE RESPONSE on each of these 15 dimensions, scoring 0-5 (0 = not addressed, 5 = excellent):
${dimensionsBlock}

REQUIRED OUTPUT — you must produce ALL of the following as a coach, not a judge:

1. dimensions: an object mapping each dimension_id to a 0-5 integer score (all 15 dimensions required).
2. feedback: 2-3 sentence overall headline. Honest, calm, coach-voice. NOT cheerleading. NOT scolding. Lead with what they did well, then name the single most-leveraged improvement.
3. strengths: array of exactly 2 specific strengths. Each is { point: "...", framework: "..." }. Quote a SHORT phrase from the transcript (max 80 chars) when possible. Be SPECIFIC — "engaged the question directly" is too generic; "named NDPR by name in response to Titi's regulatory probe — that landed" is right.
4. improvements: array of exactly 3 specific improvements. Each is { point: "...", framework: "...", exactPhrase: "what they SHOULD have said — verbatim, ready to read aloud" }. The exactPhrase should be a single sentence rehearseable for next time. Pick the THREE highest-leverage misses, not 3 random ones.
5. buyerThought: 2-3 sentences from the BUYER'S perspective immediately after hearing the response. Internal monologue voice. Reflect this specific persona's verbal style + concerns. Do NOT make it polite-fake — reflect what they actually think. Begin with a brief stage-direction in parentheses (e.g. "(measured, considering)" or "(checks watch)").

— ACTIONABLE INSIGHTS (the coach-not-judge upgrade, all required) —

6. nextSessionFocus: array of 2-3 dimensions the founder should LASER on for the next rep. Pick the dimensions where (a) the score was lowest AND (b) the dimension carries the highest weight, OR (c) the dimension is showing as a recurring weakness in recentDimensionAverages. Each item is { dimensionId, whyItMatters, concreteAction }. The whyItMatters explains the BUYER consequence (what happens to the deal if you don't fix this). The concreteAction is one sentence — what to do BEFORE the next rep.

7. drillPlan: array of 2-4 ordered concrete actions the founder should take BEFORE the next rep. Each item is { action, location, estimatedMinutes }. The location must reference a SPECIFIC Founder Hub surface — examples: "Education Room → Buyer Personas deck → ${persona.archetype} cards" / "Closing Lab → Maalouf principle 3 (Authority is Not Trust)" / "Closing Lab → Silent Objections section" / "Sparring Room → same persona × harder mode" / "Founder School → Enterprise Sales lessons 1-3". Don't invent surfaces — only use ones that exist.

8. confidenceBuild: ONE sentence (max 2) naming what was GENUINELY good in this rep. Quote a specific phrase if you can. NOT generic praise like "good effort" — name the move. Why: founders transmit conviction more readily when they know what specifically worked. This is the opposite of the strengths array; strengths are specific tactical wins, confidenceBuild is the "you can do this" foundation.

9. nextRepSetup: object with { recommendedPersonaId, recommendedMode, rationale }. The persona must be one of: ${[
    'mid_market_pe_associate', 'boutique_ma_advisor', 'fractional_cso',
    'f500_cso', 'pan_african_fund_partner', 'gc_audit_committee', 'preseed_vc_associate',
  ].join(' | ')}. The mode must be one of: ${[
    'networking_event_inperson', 'cold_first_meeting', 'skeptical_followup',
    'hot_inbound', 'procurement_evaluation', 'objection_handler', 'live_demo_walkthrough',
  ].join(' | ')}. Rationale logic: if salesDqi >= 80, recommend a HARDER mode (move from cold_first_meeting to skeptical_followup, or change to a higher-skepticism persona like Margaret/James). If 60-79, recommend SAME persona × different mode for skill consolidation. If <60, recommend SAME persona × EASIER mode (or networking_event_inperson if they were doing procurement_evaluation) — meet the founder where they are.

10. patternFlag: ONLY include if recentReps >= 3 AND a clear recurring weakness exists. Object with { pattern, rootCause, breakthroughMove }. The pattern names the recurring under-performance ("you've under-scored on loss-aversion-framing in 3 of last 5 reps"). The rootCause is the deeper "why" (e.g. "you keep framing in upside language because the product genuinely IS upside — but the buyer's loss-averse brain hears upside and discounts"). The breakthroughMove is the ONE concrete change that breaks the pattern. If recentReps < 3 OR no clear pattern exists, OMIT the patternFlag field entirely.

Output ONLY valid JSON (no prose, no markdown fence). Format:
{
  "dimensions": {
    "pressure_without_pressure": 0-5,
    "authority_not_trust": 0-5,
    "pinpoint_pain": 0-5,
    "embody_bigger": 0-5,
    "category_of_one": 0-5,
    "conviction_transmission": 0-5,
    "sales_infra_quality": 0-5,
    "vocabulary_discipline": 0-5,
    "empathic_mode_first": 0-5,
    "loss_aversion_framing": 0-5,
    "specificity_over_vagueness": 0-5,
    "fomu_calibration": 0-5,
    "damaging_admission": 0-5,
    "mutual_disqualification": 0-5,
    "prescriptive_recommendation": 0-5
  },
  "feedback": "...",
  "strengths": [
    { "point": "...", "framework": "..." },
    { "point": "...", "framework": "..." }
  ],
  "improvements": [
    { "point": "...", "framework": "...", "exactPhrase": "..." },
    { "point": "...", "framework": "...", "exactPhrase": "..." },
    { "point": "...", "framework": "...", "exactPhrase": "..." }
  ],
  "buyerThought": "...",
  "nextSessionFocus": [
    { "dimensionId": "...", "whyItMatters": "...", "concreteAction": "..." },
    { "dimensionId": "...", "whyItMatters": "...", "concreteAction": "..." }
  ],
  "drillPlan": [
    { "action": "...", "location": "...", "estimatedMinutes": 8 },
    { "action": "...", "location": "...", "estimatedMinutes": 12 }
  ],
  "confidenceBuild": "...",
  "nextRepSetup": { "recommendedPersonaId": "...", "recommendedMode": "...", "rationale": "..." },
  "patternFlag": { "pattern": "...", "rootCause": "...", "breakthroughMove": "..." }
}`;
}

// ─── Mock fallback ───────────────────────────────────────────────

function mockResult(transcript: string, isWarmContext: boolean): SparringSessionResult {
  const fillers = countFillers(transcript);
  const counts = countWordsAndSentences(transcript);
  const banned = detectVocabularyHits(transcript, DI_BANNED_VOCABULARY);
  const locked = detectVocabularyHits(transcript, DI_LOCKED_VOCABULARY);

  const dims: Record<GradingDimensionId, number> = {
    pressure_without_pressure: 3,
    authority_not_trust: 3,
    pinpoint_pain: 3,
    embody_bigger: 3,
    category_of_one: 3,
    conviction_transmission: 3,
    sales_infra_quality: 3,
    vocabulary_discipline: banned.length > 0 ? 1 : isWarmContext ? 4 : locked.length > 2 ? 2 : 3,
    empathic_mode_first: 3,
    loss_aversion_framing: 3,
    specificity_over_vagueness: 3,
    fomu_calibration: 3,
    damaging_admission: 3,
    mutual_disqualification: 3,
    prescriptive_recommendation: 3,
  };

  const salesDqi = computeSalesDqi(dims);
  return {
    salesDqi,
    grade: gradeFromDqi(salesDqi),
    dimensions: dims,
    feedback:
      "Mock response — GOOGLE_API_KEY not set. The grading is illustrative only. Set GOOGLE_API_KEY to get real coach feedback.",
    strengths: [
      { point: 'Engaged the buyer\'s question directly without spinning.', framework: 'Fundamentals' },
      { point: 'Used a specific reference point.', framework: 'DI Discipline' },
    ],
    improvements: [
      {
        point: 'Lead with the buyer\'s pain in their own vocabulary BEFORE introducing the product.',
        framework: 'DI Discipline (empathic-mode-first)',
        exactPhrase:
          'You\'re trying to make sure the partners stop pushing back on diligence depth — that\'s exactly what this fixes in 60 seconds.',
      },
      {
        point: 'Cut the hedging language. State load-bearing claims as fact, not as belief.',
        framework: 'Maalouf (authority not trust)',
        exactPhrase: 'This catches the bias the room will catch first. That\'s what it does.',
      },
      {
        point: 'Anchor with one specific case the buyer will recognise.',
        framework: 'Fundamentals (specificity)',
        exactPhrase: 'Here\'s the WeWork S-1 audit — same shape as your last memo. Look at flag 3.',
      },
    ],
    buyerThought:
      "(neutral) — 'OK, I see the shape of it. But I'd want to see one work end-to-end on something I recognise before I commit time.'",
    fillerCount: fillers.count,
    fillerWords: fillers.words,
    wordCount: counts.wordCount,
    sentenceCount: counts.sentenceCount,
    bannedVocabularyHits: banned,
    lockedVocabularyHits: locked,
    nextSessionFocus: [
      {
        dimensionId: 'empathic_mode_first',
        whyItMatters: 'Buyers disengage in the first 30 seconds when they hear product-first framing.',
        concreteAction: 'Open your next rep with the BUYER\'s pain in BUYER\'s vocabulary before naming a single feature.',
      },
      {
        dimensionId: 'specificity_over_vagueness',
        whyItMatters: "If the buyer can't repeat one specific thing to a colleague, the deal dies in the next 24 hours.",
        concreteAction: 'Anchor with WeWork S-1 + one named bias + one named regulation per response.',
      },
    ],
    drillPlan: [
      {
        action: 'Drill the Buyer Personas deck for the persona you just rehearsed.',
        location: 'Education Room → Buyer Personas deck → flashcard mode',
        estimatedMinutes: 8,
      },
      {
        action: 'Re-read the Closing Lab section on the persona\'s exact phrase.',
        location: 'Closing Lab → Fastest Converters → exact phrase block',
        estimatedMinutes: 5,
      },
      {
        action: 'Run another rep with the same persona but in a harder scenario mode.',
        location: 'Sparring Room → same persona × procurement evaluation',
        estimatedMinutes: 12,
      },
    ],
    confidenceBuild:
      'You stayed on-topic and didn\'t let the buyer\'s opener push you off your frame. That\'s the foundation everything else builds on.',
    nextRepSetup: {
      recommendedPersonaId: 'mid_market_pe_associate',
      recommendedMode: 'cold_first_meeting',
      rationale: 'Mock recommendation — set GOOGLE_API_KEY for the real coach to recommend based on your dimension scores.',
    },
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

  const persona = findPersonaById(body.personaId);
  const scenario = findScenarioById(body.mode);
  if (!persona || !scenario) {
    return NextResponse.json({ error: 'Unknown persona or mode' }, { status: 400 });
  }

  if (!body.transcript || body.transcript.trim().length < 30) {
    return NextResponse.json(
      { error: 'Transcript too short — need at least 30 characters of actual speech.' },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    return NextResponse.json(
      { error: 'Questions array is required.' },
      { status: 400 }
    );
  }

  // Mechanical analysis (no LLM call needed for these).
  const fillers = countFillers(body.transcript);
  const counts = countWordsAndSentences(body.transcript);
  const banned = detectVocabularyHits(body.transcript, DI_BANNED_VOCABULARY);
  const locked = detectVocabularyHits(body.transcript, DI_LOCKED_VOCABULARY);

  // Mock fallback when no API key.
  let apiKey: string | null;
  try {
    apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
  } catch {
    apiKey = null;
  }
  if (!apiKey) {
    return NextResponse.json(mockResult(body.transcript, body.isWarmContext ?? false));
  }

  const model = getModel();
  const prompt = buildGradingPrompt(body, persona, scenario);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = extractJSON(text) as {
      dimensions: Record<GradingDimensionId, number>;
      feedback: string;
      strengths: Array<{ point: string; framework: string }>;
      improvements: Array<{ point: string; framework: string; exactPhrase: string }>;
      buyerThought: string;
      nextSessionFocus?: Array<{ dimensionId: GradingDimensionId; whyItMatters: string; concreteAction: string }>;
      drillPlan?: Array<{ action: string; location: string; estimatedMinutes: number }>;
      confidenceBuild?: string;
      nextRepSetup?: { recommendedPersonaId: BuyerPersonaId; recommendedMode: ScenarioMode; rationale: string };
      patternFlag?: { pattern: string; rootCause: string; breakthroughMove: string };
    };

    if (!data.dimensions || !data.feedback || !Array.isArray(data.strengths) || !Array.isArray(data.improvements)) {
      throw new Error('Malformed grading response from Gemini');
    }

    // Clamp dimensions to 0-5 integers.
    const dims = {} as Record<GradingDimensionId, number>;
    for (const dim of GRADING_DIMENSIONS) {
      const raw = Number(data.dimensions[dim.id] ?? 0);
      dims[dim.id] = Math.max(0, Math.min(5, Math.round(raw)));
    }

    const salesDqi = computeSalesDqi(dims);

    // Validate next-rep-setup persona/mode against the unions; fall back to
    // the current persona/mode if the AI returns an unknown id.
    const validPersonas: BuyerPersonaId[] = [
      'mid_market_pe_associate', 'boutique_ma_advisor', 'fractional_cso',
      'f500_cso', 'pan_african_fund_partner', 'gc_audit_committee', 'preseed_vc_associate',
    ];
    const validModes: ScenarioMode[] = [
      'networking_event_inperson', 'cold_first_meeting', 'skeptical_followup',
      'hot_inbound', 'procurement_evaluation', 'objection_handler', 'live_demo_walkthrough',
    ];
    const recommendedPersonaId = data.nextRepSetup && validPersonas.includes(data.nextRepSetup.recommendedPersonaId)
      ? data.nextRepSetup.recommendedPersonaId
      : body.personaId;
    const recommendedMode = data.nextRepSetup && validModes.includes(data.nextRepSetup.recommendedMode)
      ? data.nextRepSetup.recommendedMode
      : body.mode;

    const sessionResult: SparringSessionResult = {
      salesDqi,
      grade: gradeFromDqi(salesDqi),
      dimensions: dims,
      feedback: String(data.feedback || '').slice(0, 800),
      strengths: data.strengths.slice(0, 2).map(s => ({
        point: String(s.point || '').slice(0, 300),
        framework: String(s.framework || '').slice(0, 80),
      })),
      improvements: data.improvements.slice(0, 3).map(i => ({
        point: String(i.point || '').slice(0, 300),
        framework: String(i.framework || '').slice(0, 80),
        exactPhrase: String(i.exactPhrase || '').slice(0, 400),
      })),
      buyerThought: String(data.buyerThought || '').slice(0, 600),
      fillerCount: fillers.count,
      fillerWords: fillers.words,
      wordCount: counts.wordCount,
      sentenceCount: counts.sentenceCount,
      bannedVocabularyHits: banned,
      lockedVocabularyHits: locked,
      nextSessionFocus: Array.isArray(data.nextSessionFocus)
        ? data.nextSessionFocus.slice(0, 3).map(f => ({
            dimensionId: f.dimensionId,
            whyItMatters: String(f.whyItMatters || '').slice(0, 300),
            concreteAction: String(f.concreteAction || '').slice(0, 300),
          }))
        : [],
      drillPlan: Array.isArray(data.drillPlan)
        ? data.drillPlan.slice(0, 4).map(d => ({
            action: String(d.action || '').slice(0, 200),
            location: String(d.location || '').slice(0, 200),
            estimatedMinutes: Math.max(1, Math.min(60, Math.round(Number(d.estimatedMinutes) || 10))),
          }))
        : [],
      confidenceBuild: String(data.confidenceBuild || '').slice(0, 400),
      nextRepSetup: {
        recommendedPersonaId,
        recommendedMode,
        rationale: String(data.nextRepSetup?.rationale || '').slice(0, 400),
      },
      ...(data.patternFlag && data.patternFlag.pattern
        ? {
            patternFlag: {
              pattern: String(data.patternFlag.pattern).slice(0, 300),
              rootCause: String(data.patternFlag.rootCause || '').slice(0, 400),
              breakthroughMove: String(data.patternFlag.breakthroughMove || '').slice(0, 400),
            },
          }
        : {}),
    };

    return NextResponse.json(sessionResult);
  } catch (err) {
    log.error('Grading failed', err);
    return NextResponse.json(mockResult(body.transcript, body.isWarmContext ?? false));
  }
}
