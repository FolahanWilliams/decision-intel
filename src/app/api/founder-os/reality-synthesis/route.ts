/**
 * POST /api/founder-os/reality-synthesis — the 66-Day Protocol synthesis.
 *
 * Reads the founder's accumulated check-ins + reflections, assembles the corpus
 * (pure, in synthesis.ts), and returns a retrospective AI synthesis: the arc,
 * 3-5 data-grounded patterns, and exactly ONE forward nudge drawn from his own
 * words. RETROSPECTIVE + on-demand — NOT the banned urge-moment chatbot.
 *
 * Discipline:
 *  - Honest N-floor: below SYNTHESIS_MIN_DAYS of reflection it returns
 *    `status: 'too_early'` and synthesizes nothing.
 *  - Founder-scoped (authenticateFounderOs) + the founder-hub LLM cost cap.
 *  - Mock fallback (deterministic, from the corpus) when AI_GATEWAY_API_KEY is
 *    missing OR the model returns an unparseable payload — never garbage.
 *  - Reads only; never writes a check-in/reflection, never touches the tree.
 *
 * Body: { capstone?: boolean } — capstone shifts the framing to the day-66 close.
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { checkFounderHubLlmRateLimit } from '@/lib/utils/founder-auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_FOUNDER_HUB } from '@/lib/ai/gateway-models';
import {
  assembleCorpus,
  isSynthesisReady,
  reflectionDayCount,
  buildSynthesisPrompt,
  parseSynthesis,
  mockSynthesis,
  SYNTHESIS_MIN_DAYS,
  type SynthesisCheckinRow,
  type SynthesisReflectionRow,
} from '@/components/founder-hub/reality-protocol/synthesis';

const log = createLogger('FounderOsRealitySynthesis');

export const dynamic = 'force-dynamic';

function hasKey(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

export async function POST(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  // Cost cap — one AI call per request, same throttle as the founder-hub chat.
  if (!(await checkFounderHubLlmRateLimit('reality-synthesis'))) {
    return apiError({ error: 'Rate limit exceeded — try again in a minute.', status: 429 });
  }

  let capstone = false;
  try {
    const body = (await request.json().catch(() => ({}))) as { capstone?: unknown };
    capstone = body?.capstone === true;
  } catch {
    // canonical req.json() body-parse exception — no body is fine (defaults).
  }

  // Fetch the full corpus. Schema-drift-tolerant: pre-migration envs fail soft.
  let checkins: SynthesisCheckinRow[] = [];
  let reflections: SynthesisReflectionRow[] = [];
  try {
    const [c, r] = await Promise.all([
      prisma.founderOsRealityCheckin.findMany({
        where: { userId: auth.userId },
        orderBy: [{ date: 'asc' }],
      }),
      prisma.founderOsRealityReflection.findMany({
        where: { userId: auth.userId },
        orderBy: [{ date: 'asc' }],
      }),
    ]);
    checkins = c.map(row => ({
      date: row.date,
      kind: row.kind as SynthesisCheckinRow['kind'],
      escapePlan: row.escapePlan,
      stayedOnTrack: row.stayedOnTrack,
    }));
    reflections = r.map(row => ({
      date: row.date,
      mind: row.mind,
      energy: row.energy,
      intention: row.intention,
      note: row.note,
      tomorrow: row.tomorrow,
    }));
  } catch (err) {
    // @schema-drift-tolerant — pre-migration tables; fail soft to too-early.
    log.warn('corpus fetch failed:', err);
    return apiSuccess({ data: { status: 'too_early', daysLogged: 0, needed: SYNTHESIS_MIN_DAYS } });
  }

  const daysLogged = reflectionDayCount(reflections);
  if (!isSynthesisReady(reflections)) {
    return apiSuccess({
      data: { status: 'too_early', daysLogged, needed: SYNTHESIS_MIN_DAYS },
    });
  }

  const corpus = assembleCorpus(checkins, reflections);

  // No key → deterministic mock (honest, built straight from the corpus).
  if (!hasKey()) {
    return apiSuccess({
      data: { status: 'ok', synthesis: mockSynthesis(corpus), daysLogged, usedMock: true },
    });
  }

  try {
    const prompt = buildSynthesisPrompt(corpus, capstone);
    const { text } = await generateText(prompt, { model: MODEL_FOUNDER_HUB, temperature: 0.4 });
    const parsed = parseSynthesis(text);
    if (parsed) {
      return apiSuccess({ data: { status: 'ok', synthesis: parsed, daysLogged, usedMock: false } });
    }
    log.warn('model payload unparseable — falling back to deterministic mock');
  } catch (err) {
    log.warn('synthesis generation failed — falling back to deterministic mock:', err);
  }

  return apiSuccess({
    data: { status: 'ok', synthesis: mockSynthesis(corpus), daysLogged, usedMock: true },
  });
}
