/**
 * Founder Hub intake — parse a free-form day-dump into PROPOSED actions.
 *
 * One structured LLM call: the founder pastes a Wispr-Flow voice transcription
 * (or types) of his day; the model extracts a batch of actions from the SSOT
 * catalog ([intake-actions.ts]); we normalize + entity-match server-side
 * ([intake-parse.ts]) and return them for the founder to confirm/edit/drop.
 *
 * CONFIRM-BEFORE-WRITE: this endpoint writes NOTHING. It only proposes. The
 * client executes confirmed actions against the existing write endpoints. The
 * model is told never to invent — unsupported claims are simply not emitted, and
 * ambiguous entity references are flagged for the founder to resolve.
 *
 * POST { dump: string, context: { openGoals: [{id,text}], prospects: [{id,name,company,stage}] } }
 * Mock fallback (empty + usedMock) when AI_GATEWAY_API_KEY is missing.
 */

import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_FOUNDER_HUB } from '@/lib/ai/gateway-models';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { checkFounderHubLlmRateLimit } from '@/lib/utils/founder-auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { INTAKE_ACTION_TYPES, INTAKE_ACTION_META } from '@/lib/founder-hub/intake/intake-actions';
import {
  normalizeIntakeActions,
  type IntakeContext,
  type RawIntakeAction,
} from '@/lib/founder-hub/intake/intake-parse';

const log = createLogger('IntakeParse');

export const dynamic = 'force-dynamic';

function hasKey(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

function stripFences(text: string): string {
  return text
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();
}

/** The action catalog, derived from the SSOT so the prompt can't drift. */
function catalog(): string {
  return INTAKE_ACTION_TYPES.map(t => {
    const m = INTAKE_ACTION_META[t];
    const fields = m.fields
      .map(f => {
        const opts = f.options ? ` one-of[${f.options.map(o => o.value).join('|')}]` : '';
        return `${f.key}:${f.kind}${f.optional ? '?' : ''}${opts}`;
      })
      .join(', ');
    const tgt = m.needsTarget
      ? ` — include "targetName" = the ${m.targetNoun} the founder named`
      : '';
    return `- ${t} (${m.label}): { ${fields || '(no fields)'} }${tgt}`;
  }).join('\n');
}

function clampContext(raw: unknown): IntakeContext {
  const c = (raw ?? {}) as Partial<IntakeContext>;
  const openGoals = Array.isArray(c.openGoals)
    ? c.openGoals
        .filter(g => g && typeof g.id === 'string' && typeof g.text === 'string')
        .slice(0, 20)
        .map(g => ({ id: g.id, text: String(g.text).slice(0, 280) }))
    : [];
  const prospects = Array.isArray(c.prospects)
    ? c.prospects
        .filter(p => p && typeof p.id === 'string' && typeof p.name === 'string')
        .slice(0, 100)
        .map(p => ({
          id: p.id,
          name: String(p.name).slice(0, 120),
          company: typeof p.company === 'string' ? p.company.slice(0, 120) : null,
          stage: typeof p.stage === 'string' ? p.stage : 'dm_sent',
        }))
    : [];
  const openTodos = Array.isArray(c.openTodos)
    ? c.openTodos
        .filter(t => t && typeof t.id === 'string' && typeof t.title === 'string')
        .slice(0, 50)
        .map(t => ({ id: t.id, title: String(t.title).slice(0, 280) }))
    : [];
  return { openGoals, prospects, openTodos };
}

export async function POST(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  // Cost-burn cap (2026-06-09 security sweep): pass-gated is not enough — the
  // UI credential is bundle-extractable and every call costs real LLM spend.
  if (!(await checkFounderHubLlmRateLimit('intake-parse'))) {
    return apiError({ error: 'Rate limit exceeded — try again in a minute.', status: 429 });
  }
  let body: { dump?: string; context?: unknown };
  try {
    body = (await request.json()) as { dump?: string; context?: unknown };
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }
  const dump = typeof body.dump === 'string' ? body.dump.trim().slice(0, 8000) : '';
  if (dump.length < 4) {
    return apiError({ error: 'Nothing to parse', status: 400 });
  }
  const context = clampContext(body.context);

  if (!hasKey()) {
    return apiSuccess({ data: { actions: [], usedMock: true } });
  }

  const goalList = context.openGoals.map(g => `  ${g.id}="${g.text}"`).join('\n') || '  (none)';
  const prospectList =
    context.prospects
      .map(p => `  ${p.id}="${p.name}${p.company ? ` @ ${p.company}` : ''}" (stage:${p.stage})`)
      .join('\n') || '  (none)';
  const todoList = context.openTodos.map(t => `  ${t.id}="${t.title}"`).join('\n') || '  (none)';

  const prompt = `You are the founder's intake assistant. Convert his free-form day-dump into a JSON batch of actions to log in his Founder Hub. Extract ONLY what he clearly stated — never invent meetings, prospects, goals, or numbers. If something is vague, omit it rather than guess.

ACTION CATALOG (use these exact "type" values and field keys):
${catalog()}

His OPEN GOALS today (match against these for complete_goal — set targetName to what he referenced):
${goalList}

His EXISTING PROSPECTS (if he mentions progress with one of these, use prospect_advance with targetName = the name; if it is a NEW person, use prospect_create):
${prospectList}

His OPEN TO-DOS (if he says he finished one, use todo_complete with targetName = what he referenced; a NEW next-step is todo_add):
${todoList}

Rules:
- Output one action per distinct thing he did/said. Multiple goals → multiple daily_goal actions.
- Map persona/stage/source values to the allowed one-of[...] options; if unsure, omit that field.
- For meetings he had, use meeting_log (person = who). For someone he reached out to for the first time, prospect_create (default stage dm_sent). For an update on an existing prospect, prospect_advance.
- Faith: if he only says he prayed / read scripture WITHOUT specifics, use ONE faith_checkin (booleans). Only use prayer_journal (a specific prayer or answered prayer with content) or reading_progress (a specific passage + reflection) when there is real content — never double-log the same fact as both a checkin boolean AND a journal/reading entry.
- Learning: a study SESSION (time/reps) is sat_session; a SCORED full-length is sat_test (needs a section score); a book/article/paper takeaway is content_log (needs a real takeaway); a skill he wants to DEVELOP is skill_dev.
- Occasional: commitment = a stated personal/public commitment he is making. weekly_review = ONLY when he is explicitly reviewing his week (needs both a week summary AND an internal-locus reflection); never emit it for an ordinary day.
- Put short clarifying context in a per-action "note" only when genuinely ambiguous.
- Today's date is provided by the system; do not output dates.

Return ONLY valid JSON: {"actions":[{"type":"","fields":{},"targetName":"","note":""}]}`;

  try {
    const { text } = await generateText(prompt, { model: MODEL_FOUNDER_HUB, temperature: 0.2 });
    const parsed = JSON.parse(stripFences(text)) as { actions?: RawIntakeAction[] };
    const actions = normalizeIntakeActions(
      Array.isArray(parsed.actions) ? parsed.actions : [],
      context
    );
    return apiSuccess({ data: { actions } });
  } catch (err) {
    log.warn('intake parse failed:', err);
    return apiError({
      error: 'Could not parse the dump — try again or log manually.',
      status: 502,
    });
  }
}
