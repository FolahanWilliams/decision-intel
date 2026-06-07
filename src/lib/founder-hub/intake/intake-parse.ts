/**
 * Founder Hub intake — pure normalization + entity matching (no I/O, unit-tested).
 *
 * Turns the LLM's loose extracted batch into validated, typed `ProposedAction`s:
 * drops unknown types, coerces each field to its declared kind, and resolves the
 * target row for target-bound actions (complete_goal / prospect_advance) against
 * the founder's existing rows — flagging `needsPick` (with candidates) whenever a
 * mention is ambiguous or unmatched rather than guessing. The review gate then
 * lets the founder resolve it. Never invents a target id.
 */

import {
  INTAKE_ACTION_META,
  isIntakeActionType,
  type FieldValue,
  type IntakeActionType,
  type ProposedAction,
} from './intake-actions';

export interface IntakeContextGoal {
  id: string;
  text: string;
}
export interface IntakeContextProspect {
  id: string;
  name: string;
  company: string | null;
  stage: string;
}
export interface IntakeContext {
  openGoals: IntakeContextGoal[];
  prospects: IntakeContextProspect[];
}

/** Loose shape the LLM returns (everything optional — we validate hard here). */
export interface RawIntakeAction {
  type?: unknown;
  fields?: Record<string, unknown>;
  /** The mentioned goal/prospect text to match for target-bound actions. */
  targetName?: unknown;
  note?: unknown;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Fuzzy name match: a query matches a candidate if either contains the other's
 *  normalized form, or they share a distinctive (≥3-char) token. Returns the ids
 *  of all matches (caller decides single vs ambiguous). */
export function matchByName(query: string, candidates: { id: string; name: string }[]): string[] {
  const q = norm(query);
  if (!q) return [];
  const qTokens = new Set(q.split(' ').filter(t => t.length >= 3));
  const hits: string[] = [];
  for (const c of candidates) {
    const n = norm(c.name);
    if (!n) continue;
    if (n.includes(q) || q.includes(n)) {
      hits.push(c.id);
      continue;
    }
    const nTokens = n.split(' ').filter(t => t.length >= 3);
    if (nTokens.some(t => qTokens.has(t))) hits.push(c.id);
  }
  return hits;
}

/** Coerce a raw value to the FieldSpec kind. */
function coerceField(kind: string, raw: unknown): FieldValue {
  if (kind === 'bool') return raw === true || raw === 'true' || raw === 1;
  if (kind === 'number') {
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return typeof raw === 'string' ? raw.trim().slice(0, 4000) : raw == null ? null : String(raw);
}

function buildFields(type: IntakeActionType, raw: Record<string, unknown> | undefined) {
  const out: Record<string, FieldValue> = {};
  const specs = INTAKE_ACTION_META[type].fields;
  for (const spec of specs) {
    const v = raw?.[spec.key];
    if (v === undefined) continue;
    out[spec.key] = coerceField(spec.kind, v);
  }
  return out;
}

/**
 * Normalize + match a raw LLM batch into reviewable actions. Pure: deterministic
 * ids (`act-<i>`), no Math.random, so it's testable and resume-safe.
 */
export function normalizeIntakeActions(
  raw: RawIntakeAction[],
  context: IntakeContext
): ProposedAction[] {
  if (!Array.isArray(raw)) return [];
  const out: ProposedAction[] = [];

  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    if (!isIntakeActionType(r?.type)) continue;
    const type = r.type;
    const meta = INTAKE_ACTION_META[type];
    const fields = buildFields(type, r.fields);
    const note = typeof r.note === 'string' ? r.note.trim().slice(0, 280) || undefined : undefined;
    const action: ProposedAction = { id: `act-${i}`, type, fields, note };

    if (meta.needsTarget) {
      const mention =
        typeof r.targetName === 'string' && r.targetName.trim()
          ? r.targetName.trim()
          : typeof fields.text === 'string'
            ? fields.text
            : typeof fields.name === 'string'
              ? fields.name
              : '';

      if (type === 'complete_goal') {
        const cands = context.openGoals.map(g => ({ id: g.id, name: g.text }));
        const hits = matchByName(mention, cands);
        if (hits.length === 1) {
          action.targetId = hits[0];
          action.fields.matchedLabel = labelFor(hits[0], cands);
        } else {
          action.needsPick = true;
          action.candidates = cands.map(c => ({ id: c.id, label: c.name }));
          action.note = hits.length
            ? 'Multiple goals match — pick one.'
            : mention
              ? `Couldn't match "${mention}" — pick the goal.`
              : 'Pick which goal to complete.';
        }
      } else if (type === 'prospect_advance') {
        const cands = context.prospects.map(p => ({
          id: p.id,
          name: `${p.name}${p.company ? ` @ ${p.company}` : ''}`,
        }));
        const hits = matchByName(mention, cands);
        if (hits.length === 1) {
          action.targetId = hits[0];
          action.fields.matchedLabel = labelFor(hits[0], cands);
        } else {
          action.needsPick = true;
          action.candidates = cands.map(c => ({ id: c.id, label: c.name }));
          action.note = hits.length
            ? 'Multiple prospects match — pick one.'
            : mention
              ? `Couldn't match "${mention}" — pick the prospect.`
              : 'Pick which prospect to advance.';
        }
      }
    }

    out.push(action);
  }

  return out;
}

function labelFor(id: string, cands: { id: string; name: string }[]): string {
  return cands.find(c => c.id === id)?.name ?? '';
}

/** Resolve a needsPick action once the founder chooses a candidate. Pure. */
export function resolvePick(action: ProposedAction, targetId: string): ProposedAction {
  const label = action.candidates?.find(c => c.id === targetId)?.label ?? '';
  return {
    ...action,
    targetId,
    needsPick: false,
    note: undefined,
    fields: { ...action.fields, matchedLabel: label },
  };
}

/** An action is executable iff every target-bound type has a resolved targetId. */
export function isActionReady(action: ProposedAction): boolean {
  const meta = INTAKE_ACTION_META[action.type];
  if (meta.needsTarget) return Boolean(action.targetId) && !action.needsPick;
  // create/log types need at least the primary text field non-empty.
  const primary = meta.fields[0];
  if (!primary || primary.optional) return true;
  const v = action.fields[primary.key];
  return typeof v === 'string' ? v.trim().length > 0 : v != null;
}
