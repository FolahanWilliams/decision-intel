/**
 * Founder Hub — voice/brain-dump INTAKE action vocabulary (SSOT, pure, no I/O).
 *
 * The founder dumps his day (via Wispr Flow voice → paste) into one panel; an
 * LLM extracts a batch of PROPOSED actions; the founder confirms/edits/drops
 * each; the client then executes the confirmed ones against the EXISTING
 * founder-os / founder-hub write endpoints. This module is the single source of
 * truth for: the action union, each type's editable fields (drives the generic
 * review card AND the LLM's expected output), and `toRequest` (type → existing
 * endpoint + body) which is the ONLY place that knows how to map an action to a
 * write call.
 *
 * Load-bearing discipline: this is CONFIRM-BEFORE-WRITE. Nothing here writes;
 * `toRequest` only describes the call. The ledgers it feeds (conversion ledger →
 * month-4 kill checkpoint, Vohra cohort, the campaign) are too load-bearing to
 * accept a silent misparse — the review gate is the integrity guarantee.
 *
 * Extensibility: add a 9th action = add an `IntakeActionType` + an entry in
 * `INTAKE_ACTION_META`. The parser, review card, and executor all read this map.
 */

import { FUNNEL_STAGE_IDS, type FunnelStageId } from '@/lib/outreach/conversion-ledger';
import { WEDGE_PERSONAS } from '@/lib/data/event-prep';

export type IntakeActionType =
  | 'daily_goal'
  | 'complete_goal'
  | 'daily_reflection'
  | 'faith_checkin'
  | 'sat_session'
  | 'meeting_log'
  | 'prospect_create'
  | 'prospect_advance';

export const INTAKE_ACTION_TYPES: IntakeActionType[] = [
  'daily_goal',
  'complete_goal',
  'daily_reflection',
  'faith_checkin',
  'sat_session',
  'meeting_log',
  'prospect_create',
  'prospect_advance',
];

export type FieldValue = string | number | boolean | null;

export interface FieldSpec {
  key: string;
  label: string;
  kind: 'text' | 'textarea' | 'select' | 'bool' | 'number';
  options?: { value: string; label: string }[];
  optional?: boolean;
  placeholder?: string;
}

/** A single proposed write, awaiting the founder's confirm/edit/drop. */
export interface ProposedAction {
  /** Stable client id for the review list (assigned at normalize time). */
  id: string;
  type: IntakeActionType;
  /** Editable values keyed by FieldSpec.key. */
  fields: Record<string, FieldValue>;
  /** For target-bound types (complete_goal / prospect_advance): the matched row id. */
  targetId?: string | null;
  /** True when the target could not be resolved unambiguously — founder must pick. */
  needsPick?: boolean;
  /** Candidate rows to choose from when needsPick. */
  candidates?: { id: string; label: string }[];
  /** Parser's note about an assumption / ambiguity (shown muted on the row). */
  note?: string;
}

export interface IntakeActionMeta {
  type: IntakeActionType;
  label: string;
  /** Lucide icon name resolved by the panel. */
  icon: string;
  /** Accent role for the review row stripe. */
  accent: 'primary' | 'success' | 'info' | 'warning';
  fields: FieldSpec[];
  /** Target-bound types reference an existing row (complete a goal / advance a prospect). */
  needsTarget?: boolean;
  /** Word for the target kind, used in the "pick which X" UI. */
  targetNoun?: string;
  summarize: (a: ProposedAction) => string;
  toRequest: (
    a: ProposedAction,
    ctx: { today: string; nowIso: string }
  ) => { method: 'POST' | 'PATCH'; path: string; body: Record<string, unknown> };
}

const PERSONA_OPTIONS: { value: string; label: string }[] = [
  ...WEDGE_PERSONAS.map(p => ({ value: p.id, label: p.label })),
  { value: 'other', label: 'Other' },
];

const STAGE_OPTIONS: { value: string; label: string }[] = FUNNEL_STAGE_IDS.map(id => ({
  value: id,
  label: id.replace(/_/g, ' '),
}));

// ── small field readers (defensive — fields are LLM-sourced + user-edited) ──
function str(a: ProposedAction, key: string): string {
  const v = a.fields[key];
  return typeof v === 'string' ? v.trim() : '';
}
function strOrNull(a: ProposedAction, key: string): string | null {
  const s = str(a, key);
  return s ? s : null;
}
function bool(a: ProposedAction, key: string): boolean {
  return a.fields[key] === true;
}
function num(a: ProposedAction, key: string): number | undefined {
  const v = a.fields[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

export const INTAKE_ACTION_META: Record<IntakeActionType, IntakeActionMeta> = {
  daily_goal: {
    type: 'daily_goal',
    label: 'Add to Today’s Three',
    icon: 'Target',
    accent: 'primary',
    fields: [
      { key: 'text', label: 'Goal', kind: 'text', placeholder: 'a finishable priority' },
      {
        key: 'intention',
        label: 'If-then (optional)',
        kind: 'text',
        optional: true,
        placeholder: 'if it is 7pm, then…',
      },
      { key: 'isHighlight', label: 'Highlight', kind: 'bool', optional: true },
    ],
    summarize: a => `Add goal: ${str(a, 'text') || '(empty)'}`,
    toRequest: (a, ctx) => ({
      method: 'POST',
      path: '/api/founder-os/daily-goals',
      body: {
        date: ctx.today,
        text: str(a, 'text'),
        intention: strOrNull(a, 'intention') ?? undefined,
        isHighlight: bool(a, 'isHighlight'),
      },
    }),
  },
  complete_goal: {
    type: 'complete_goal',
    label: 'Mark a goal done',
    icon: 'CheckCircle2',
    accent: 'success',
    needsTarget: true,
    targetNoun: 'goal',
    fields: [],
    summarize: a => `Mark goal done${a.fields.matchedLabel ? `: ${a.fields.matchedLabel}` : ''}`,
    toRequest: a => ({
      method: 'PATCH',
      path: '/api/founder-os/daily-goals',
      body: { id: a.targetId, status: 'done' },
    }),
  },
  daily_reflection: {
    type: 'daily_reflection',
    label: 'Evening reflection',
    icon: 'Moon',
    accent: 'info',
    fields: [
      { key: 'moved', label: 'What moved', kind: 'textarea', optional: true },
      { key: 'blocked', label: 'What blocked', kind: 'textarea', optional: true },
    ],
    summarize: () => 'Log evening reflection',
    toRequest: (a, ctx) => ({
      method: 'POST',
      path: '/api/founder-os/daily-reflections',
      body: { date: ctx.today, moved: strOrNull(a, 'moved'), blocked: strOrNull(a, 'blocked') },
    }),
  },
  faith_checkin: {
    type: 'faith_checkin',
    label: 'Faith OS check-in',
    icon: 'Sun',
    accent: 'warning',
    fields: [
      { key: 'sfcZero', label: 'SFC-zero (clean focus)', kind: 'bool', optional: true },
      { key: 'prayer', label: 'Prayer', kind: 'bool', optional: true },
      { key: 'scripture', label: 'Scripture', kind: 'bool', optional: true },
      { key: 'exercise', label: 'Exercise', kind: 'bool', optional: true },
      { key: 'meditation', label: 'Meditation', kind: 'bool', optional: true },
      { key: 'notes', label: 'Notes', kind: 'textarea', optional: true },
    ],
    summarize: () => 'Log daily check-in',
    toRequest: (a, ctx) => ({
      method: 'POST',
      path: '/api/founder-os/checkins',
      body: {
        date: ctx.today,
        sfcZero: bool(a, 'sfcZero'),
        prayer: bool(a, 'prayer'),
        scripture: bool(a, 'scripture'),
        exercise: bool(a, 'exercise'),
        meditation: bool(a, 'meditation'),
        notes: strOrNull(a, 'notes') ?? undefined,
      },
    }),
  },
  sat_session: {
    type: 'sat_session',
    label: 'Log SAT session',
    icon: 'GraduationCap',
    accent: 'info',
    fields: [
      { key: 'minutes', label: 'Minutes', kind: 'number', optional: true },
      { key: 'attempted', label: 'Questions attempted', kind: 'number', optional: true },
      { key: 'correct', label: 'Correct', kind: 'number', optional: true },
    ],
    summarize: a => {
      const m = num(a, 'minutes');
      return `Log SAT session${m ? ` (${m} min)` : ''}`;
    },
    toRequest: (a, ctx) => ({
      method: 'POST',
      path: '/api/founder-os/sat/sessions',
      body: {
        date: ctx.today,
        minutes: num(a, 'minutes'),
        attempted: num(a, 'attempted'),
        correct: num(a, 'correct'),
        completed: true,
      },
    }),
  },
  meeting_log: {
    type: 'meeting_log',
    label: 'Log a meeting',
    icon: 'Users',
    accent: 'primary',
    fields: [
      { key: 'person', label: 'Who', kind: 'text', placeholder: 'name' },
      { key: 'company', label: 'Company', kind: 'text', optional: true },
      { key: 'notes', label: 'Notes', kind: 'textarea', optional: true },
      { key: 'learnings', label: 'Learnings', kind: 'textarea', optional: true },
      { key: 'nextSteps', label: 'Next steps', kind: 'textarea', optional: true },
    ],
    summarize: a => `Log meeting: ${str(a, 'person') || '(unnamed)'}`,
    toRequest: (a, ctx) => ({
      method: 'POST',
      path: '/api/founder-hub/meetings',
      body: {
        mode: 'log',
        meetingType: 'other',
        status: 'completed',
        happenedAt: ctx.nowIso,
        prospectName: strOrNull(a, 'person'),
        prospectCompany: strOrNull(a, 'company'),
        notes: str(a, 'notes'),
        learnings: str(a, 'learnings'),
        nextSteps: str(a, 'nextSteps'),
      },
    }),
  },
  prospect_create: {
    type: 'prospect_create',
    label: 'New prospect',
    icon: 'UserPlus',
    accent: 'primary',
    fields: [
      { key: 'name', label: 'Name', kind: 'text', placeholder: 'name' },
      { key: 'company', label: 'Company', kind: 'text', optional: true },
      { key: 'title', label: 'Title', kind: 'text', optional: true },
      {
        key: 'persona',
        label: 'Persona',
        kind: 'select',
        options: PERSONA_OPTIONS,
        optional: true,
      },
      { key: 'stage', label: 'Stage', kind: 'select', options: STAGE_OPTIONS, optional: true },
    ],
    summarize: a =>
      `New prospect: ${str(a, 'name') || '(unnamed)'}${str(a, 'company') ? ` @ ${str(a, 'company')}` : ''}`,
    toRequest: a => ({
      method: 'POST',
      path: '/api/founder-hub/outreach/prospects',
      body: {
        name: str(a, 'name'),
        company: strOrNull(a, 'company'),
        title: strOrNull(a, 'title'),
        persona: str(a, 'persona') || 'other',
        source: 'linkedin_dm',
        stage: isStage(str(a, 'stage')) ? str(a, 'stage') : 'dm_sent',
        notes: strOrNull(a, 'notes') ?? undefined,
      },
    }),
  },
  prospect_advance: {
    type: 'prospect_advance',
    label: 'Advance a prospect',
    icon: 'ArrowRightCircle',
    accent: 'success',
    needsTarget: true,
    targetNoun: 'prospect',
    fields: [
      { key: 'stage', label: 'To stage', kind: 'select', options: STAGE_OPTIONS },
      { key: 'notes', label: 'Notes', kind: 'textarea', optional: true },
    ],
    summarize: a =>
      `Advance ${a.fields.matchedLabel ?? 'prospect'} → ${str(a, 'stage').replace(/_/g, ' ') || '?'}`,
    toRequest: a => ({
      method: 'PATCH',
      path: `/api/founder-hub/outreach/prospects/${a.targetId}`,
      body: { stage: str(a, 'stage'), notes: strOrNull(a, 'notes') ?? undefined },
    }),
  },
};

export function isStage(v: string): v is FunnelStageId {
  return (FUNNEL_STAGE_IDS as readonly string[]).includes(v);
}

export function isIntakeActionType(v: unknown): v is IntakeActionType {
  return typeof v === 'string' && INTAKE_ACTION_TYPES.includes(v as IntakeActionType);
}

export { PERSONA_OPTIONS, STAGE_OPTIONS };
