/**
 * SAT Prep — "explain this miss" tutor (founder-private).
 *
 * The in-tab tutor layer your lesson teachers can't be: a Socratic explanation
 * of WHY a question was missed on a given skill, the trap, and how to recognise
 * it next time. Operates on the founder's OWN logged miss (the real question is
 * the input) — never fabricates a question or a score.
 *
 * POST { id }                         → explain a logged miss (caches on the row)
 * POST { skill, section?, note? }     → explain an ad-hoc concept (ephemeral)
 *
 * Uses MODEL_FOUNDER_HUB (Grok 4.3, the founder-hub default — instruction-
 * following matters for tutoring). Mock fallback when AI_GATEWAY_API_KEY missing.
 */

import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_FOUNDER_HUB } from '@/lib/ai/gateway-models';
import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { SAT_SKILL_BY_ID } from '@/components/founder-hub/sat/sat-content';

const log = createLogger('SatExplain');

export const dynamic = 'force-dynamic';

function hasKey(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

function mock(skillLabel: string): string {
  return `Mock explanation (AI_GATEWAY_API_KEY not set) for "${skillLabel}". Set the key for a real Socratic walk-through of the concept, the trap answer, and how to spot it next time.`;
}

export async function POST(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }
  let body: { id?: string; skill?: string; section?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }

  let skill = typeof body.skill === 'string' ? body.skill : '';
  let section = body.section === 'rw' ? 'Reading & Writing' : 'Math';
  let note = typeof body.note === 'string' ? body.note.slice(0, 1500) : '';
  let entryId: string | null = null;

  if (typeof body.id === 'string') {
    const entry = await prisma.satErrorLogEntry.findUnique({ where: { id: body.id } });
    if (!entry || entry.userId !== auth.userId) {
      return apiError({ error: 'Not found', status: 404 });
    }
    if (entry.explanation) {
      return apiSuccess({ data: { explanation: entry.explanation, cached: true } });
    }
    entryId = entry.id;
    skill = entry.skill;
    section = entry.section === 'rw' ? 'Reading & Writing' : 'Math';
    note = entry.note ?? '';
  }

  const skillLabel = SAT_SKILL_BY_ID[skill]?.label ?? skill ?? 'this skill';

  if (!hasKey()) {
    return apiSuccess({ data: { explanation: mock(skillLabel), cached: false } });
  }

  const prompt = `You are a patient, sharp digital-SAT tutor. A student missed a ${section} question on the skill "${skillLabel}".
${note ? `Here is the question / what they wrote: """${note}"""` : 'No question text was captured.'}
Explain, in 4-6 plain sentences:
1. The single concept being tested.
2. Why the tempting wrong answer is tempting (the trap) — name the System-1 shortcut it baits.
3. The one habit or check that catches it next time.
Be concrete and Socratic, not generic. Do NOT invent the question if none was given — speak to the skill generally.`;

  try {
    const { text } = await generateText(prompt, { model: MODEL_FOUNDER_HUB, temperature: 0.4 });
    const explanation = text.trim().slice(0, 3000);
    if (entryId && explanation) {
      await prisma.satErrorLogEntry
        .update({ where: { id: entryId }, data: { explanation } })
        .catch(e => log.warn('cache explanation failed:', e));
    }
    return apiSuccess({ data: { explanation, cached: false } });
  } catch (err) {
    log.warn('explain failed:', err);
    return apiSuccess({ data: { explanation: mock(skillLabel), cached: false } });
  }
}
