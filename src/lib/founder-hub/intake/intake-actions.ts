/**
 * Founder Hub — voice/brain-dump INTAKE action vocabulary (SSOT, pure, no I/O).
 *
 * The founder dumps his day (via Wispr Flow voice → paste) into one panel; an
 * LLM extracts a batch of PROPOSED actions; the founder confirms/edits/drops
 * each; the client then executes the confirmed ones against the EXISTING
 * founder-os / founder-hub write endpoints. This module is the single source of
 * truth for: the action union, each type's editable fields (drives the generic
 * review card AND the LLM's expected output), its `cluster` (review grouping),
 * and `toRequest` (type → existing endpoint + body) — the ONLY place that maps
 * an action to a write call.
 *
 * Load-bearing discipline: this is CONFIRM-BEFORE-WRITE. Nothing here writes;
 * `toRequest` only describes the call. The ledgers it feeds (conversion ledger →
 * month-4 kill checkpoint, Vohra cohort, the campaign) are too load-bearing to
 * accept a silent misparse — the review gate is the integrity guarantee.
 *
 * On "merging" actions: we deliberately do NOT merge action types into
 * multi-write super-actions. Each action = exactly one endpoint, so the
 * confirm/edit/drop + per-action result reporting stays honest (no partial-write
 * ambiguity). The compression that helps at scale is the review-UX GROUPING by
 * `cluster`, plus parse rules that avoid double-logging the same fact (e.g. the
 * faith_checkin booleans vs a richer prayer_journal/reading_progress entry).
 *
 * Extensibility: add an action = add an `IntakeActionType` + an entry in
 * `INTAKE_ACTION_META`. The parser, review card, and executor all read this map.
 */

import { FUNNEL_STAGE_IDS, type FunnelStageId } from '@/lib/outreach/conversion-ledger';
import { WEDGE_PERSONAS } from '@/lib/data/event-prep';
import { weekKeyFor, quarterKeyFor } from '@/components/founder-hub/faith-os/period-goals';

export type IntakeActionType =
  | 'daily_goal'
  | 'complete_goal'
  | 'period_goal'
  | 'daily_reflection'
  | 'meeting_log'
  | 'todo_add'
  | 'todo_complete'
  | 'prospect_create'
  | 'prospect_advance'
  | 'faith_checkin'
  | 'prayer_journal'
  | 'reading_progress'
  | 'sat_session'
  | 'sat_test'
  | 'content_log'
  | 'commitment'
  | 'skill_dev'
  | 'weekly_review';

export const INTAKE_ACTION_TYPES: IntakeActionType[] = [
  'daily_goal',
  'complete_goal',
  'period_goal',
  'commitment',
  'daily_reflection',
  'weekly_review',
  'meeting_log',
  'todo_add',
  'todo_complete',
  'prospect_create',
  'prospect_advance',
  'faith_checkin',
  'prayer_journal',
  'reading_progress',
  'sat_session',
  'sat_test',
  'content_log',
  'skill_dev',
];

export type IntakeCluster = 'goals' | 'work' | 'outreach' | 'faith' | 'learning';

/** Ordered cluster metadata — drives the grouped review card. */
export const INTAKE_CLUSTERS: { id: IntakeCluster; label: string }[] = [
  { id: 'goals', label: 'Goals & day' },
  { id: 'work', label: 'Work & follow-ups' },
  { id: 'outreach', label: 'Outreach' },
  { id: 'faith', label: 'Faith OS' },
  { id: 'learning', label: 'Learning' },
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
  /** For target-bound types (complete_goal / prospect_advance / todo_complete): the matched row id. */
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
  /** Review-card grouping. */
  cluster: IntakeCluster;
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

const PERIOD_OPTIONS = [
  { value: 'week', label: 'This week' },
  { value: 'quarter', label: 'This quarter' },
];
const PRAYER_KIND_OPTIONS = [
  { value: 'reflection', label: 'Reflection' },
  { value: 'adoration', label: 'Adoration' },
  { value: 'confession', label: 'Confession' },
  { value: 'thanksgiving', label: 'Thanksgiving' },
  { value: 'supplication', label: 'Supplication' },
];
const CONTENT_SOURCE_OPTIONS = [
  { value: 'Book', label: 'Book' },
  { value: 'Paper', label: 'Paper' },
  { value: 'Long-form article', label: 'Article' },
  { value: 'Podcast', label: 'Podcast' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'Other', label: 'Other' },
];
const SAT_TEST_SOURCE_OPTIONS = [
  { value: 'bluebook', label: 'Bluebook' },
  { value: 'khan', label: 'Khan' },
  { value: 'released', label: 'Released' },
  { value: 'real_sat', label: 'Real SAT' },
];
const SAT_TEST_SECTION_OPTIONS = [
  { value: 'full', label: 'Full' },
  { value: 'rw', label: 'R&W' },
  { value: 'math', label: 'Math' },
];

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
    cluster: 'goals',
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
    cluster: 'goals',
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
  period_goal: {
    type: 'period_goal',
    label: 'Add a week/quarter rock',
    icon: 'CalendarRange',
    accent: 'primary',
    cluster: 'goals',
    fields: [
      { key: 'period', label: 'Period', kind: 'select', options: PERIOD_OPTIONS, optional: true },
      { key: 'text', label: 'Rock', kind: 'text', placeholder: 'the few that matter' },
    ],
    summarize: a => `Add ${str(a, 'period') || 'week'} rock: ${str(a, 'text') || '(empty)'}`,
    toRequest: (a, ctx) => {
      const period = str(a, 'period') === 'quarter' ? 'quarter' : 'week';
      return {
        method: 'POST',
        path: '/api/founder-os/period-goals',
        body: {
          period,
          periodKey: period === 'quarter' ? quarterKeyFor(ctx.today) : weekKeyFor(ctx.today),
          text: str(a, 'text'),
        },
      };
    },
  },
  daily_reflection: {
    type: 'daily_reflection',
    label: 'Evening reflection',
    icon: 'Moon',
    accent: 'info',
    cluster: 'goals',
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
  meeting_log: {
    type: 'meeting_log',
    label: 'Log a meeting',
    icon: 'Users',
    accent: 'primary',
    cluster: 'work',
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
  todo_add: {
    type: 'todo_add',
    label: 'Add a to-do',
    icon: 'ListPlus',
    accent: 'info',
    cluster: 'work',
    fields: [
      { key: 'title', label: 'To-do', kind: 'text', placeholder: 'a next step to remember' },
      { key: 'pinned', label: 'Pin', kind: 'bool', optional: true },
    ],
    summarize: a => `Add to-do: ${str(a, 'title') || '(empty)'}`,
    toRequest: a => ({
      method: 'POST',
      path: '/api/founder-hub/todos',
      body: { title: str(a, 'title'), pinned: bool(a, 'pinned') },
    }),
  },
  todo_complete: {
    type: 'todo_complete',
    label: 'Complete a to-do',
    icon: 'CheckCircle2',
    accent: 'success',
    cluster: 'work',
    needsTarget: true,
    targetNoun: 'to-do',
    fields: [],
    summarize: a => `Complete to-do${a.fields.matchedLabel ? `: ${a.fields.matchedLabel}` : ''}`,
    toRequest: a => ({
      method: 'PATCH',
      path: `/api/founder-hub/todos/${a.targetId}`,
      body: { done: true },
    }),
  },
  prospect_create: {
    type: 'prospect_create',
    label: 'New prospect',
    icon: 'UserPlus',
    accent: 'primary',
    cluster: 'outreach',
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
    cluster: 'outreach',
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
  faith_checkin: {
    type: 'faith_checkin',
    label: 'Faith OS check-in',
    icon: 'Sun',
    accent: 'warning',
    cluster: 'faith',
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
  prayer_journal: {
    type: 'prayer_journal',
    label: 'Prayer journal',
    icon: 'BookHeart',
    accent: 'warning',
    cluster: 'faith',
    fields: [
      {
        key: 'body',
        label: 'Entry',
        kind: 'textarea',
        placeholder: 'the prayer / answered prayer',
      },
      { key: 'kind', label: 'Kind', kind: 'select', options: PRAYER_KIND_OPTIONS, optional: true },
      { key: 'title', label: 'Title', kind: 'text', optional: true },
      { key: 'scriptureRef', label: 'Scripture ref', kind: 'text', optional: true },
      { key: 'answered', label: 'Answered prayer', kind: 'bool', optional: true },
    ],
    summarize: a => `Prayer journal${str(a, 'title') ? `: ${str(a, 'title')}` : ''}`,
    toRequest: a => ({
      method: 'POST',
      path: '/api/founder-os/prayer-journal',
      body: {
        kind: str(a, 'kind') || 'reflection',
        title: strOrNull(a, 'title'),
        body: str(a, 'body'),
        scriptureRef: strOrNull(a, 'scriptureRef'),
        answered: bool(a, 'answered'),
      },
    }),
  },
  reading_progress: {
    type: 'reading_progress',
    label: 'Log Bible reading',
    icon: 'BookOpen',
    accent: 'warning',
    cluster: 'faith',
    fields: [
      { key: 'reference', label: 'Passage', kind: 'text', placeholder: 'e.g. Proverbs 16' },
      { key: 'reflection', label: 'Reflection', kind: 'textarea', optional: true },
    ],
    summarize: a => `Log reading: ${str(a, 'reference') || '(passage)'}`,
    toRequest: a => ({
      method: 'POST',
      path: '/api/founder-os/reading-progress',
      // planId 'adhoc' = a dump-logged read outside a structured plan (upsert key
      // is userId+planId+reference, so re-reading a passage updates the reflection).
      body: {
        planId: 'adhoc',
        reference: str(a, 'reference'),
        reflection: strOrNull(a, 'reflection'),
      },
    }),
  },
  sat_session: {
    type: 'sat_session',
    label: 'Log SAT session',
    icon: 'GraduationCap',
    accent: 'info',
    cluster: 'learning',
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
  sat_test: {
    type: 'sat_test',
    label: 'Log SAT test result',
    icon: 'ClipboardCheck',
    accent: 'info',
    cluster: 'learning',
    fields: [
      {
        key: 'source',
        label: 'Source',
        kind: 'select',
        options: SAT_TEST_SOURCE_OPTIONS,
        optional: true,
      },
      {
        key: 'section',
        label: 'Section',
        kind: 'select',
        options: SAT_TEST_SECTION_OPTIONS,
        optional: true,
      },
      { key: 'rwScore', label: 'R&W score', kind: 'number', optional: true },
      { key: 'mathScore', label: 'Math score', kind: 'number', optional: true },
    ],
    summarize: a => {
      const rw = num(a, 'rwScore');
      const m = num(a, 'mathScore');
      const tot = (rw ?? 0) + (m ?? 0);
      return `Log SAT test${rw != null && m != null ? ` (${tot})` : rw != null ? ` (R&W ${rw})` : m != null ? ` (Math ${m})` : ''}`;
    },
    toRequest: (a, ctx) => ({
      method: 'POST',
      path: '/api/founder-os/sat/tests',
      body: {
        date: ctx.today,
        source: str(a, 'source') || 'bluebook',
        section: str(a, 'section') || 'full',
        rwScore: num(a, 'rwScore'),
        mathScore: num(a, 'mathScore'),
      },
    }),
  },
  content_log: {
    type: 'content_log',
    label: 'Log learning',
    icon: 'NotebookPen',
    accent: 'info',
    cluster: 'learning',
    fields: [
      { key: 'title', label: 'What', kind: 'text', placeholder: 'title / topic' },
      { key: 'activeRecallSummary', label: 'Takeaway (active recall)', kind: 'textarea' },
      {
        key: 'source',
        label: 'Source',
        kind: 'select',
        options: CONTENT_SOURCE_OPTIONS,
        optional: true,
      },
      { key: 'durationMin', label: 'Minutes', kind: 'number', optional: true },
    ],
    summarize: a => `Log learning: ${str(a, 'title') || '(topic)'}`,
    toRequest: a => ({
      method: 'POST',
      path: '/api/founder-os/content-log',
      body: {
        title: str(a, 'title'),
        activeRecallSummary: str(a, 'activeRecallSummary'),
        source: str(a, 'source') || 'Other',
        durationMin: num(a, 'durationMin'),
      },
    }),
  },
  commitment: {
    type: 'commitment',
    label: 'Log a commitment',
    icon: 'Flag',
    accent: 'primary',
    cluster: 'goals',
    fields: [
      {
        key: 'text',
        label: 'Commitment',
        kind: 'textarea',
        placeholder: 'what you are committing to',
      },
      { key: 'title', label: 'Title', kind: 'text', optional: true },
    ],
    summarize: a => `Commit: ${str(a, 'title') || str(a, 'text').slice(0, 48) || '(empty)'}`,
    toRequest: a => ({
      method: 'POST',
      path: '/api/founder-os/commitments',
      body: { text: str(a, 'text'), title: strOrNull(a, 'title') ?? undefined },
    }),
  },
  weekly_review: {
    type: 'weekly_review',
    label: 'Log weekly review',
    icon: 'CalendarCheck',
    accent: 'info',
    cluster: 'goals',
    fields: [
      {
        key: 'topLongForm',
        label: 'The week',
        kind: 'textarea',
        placeholder: 'what mattered this week',
      },
      {
        key: 'internalLocusReflection',
        label: 'What I control (internal locus)',
        kind: 'textarea',
        placeholder: 'what was in my control, what I learned',
      },
      { key: 'oneSkillNote', label: 'One skill note', kind: 'textarea', optional: true },
    ],
    summarize: () => 'Log weekly review',
    toRequest: (a, ctx) => ({
      method: 'POST',
      path: '/api/founder-os/weekly-reviews',
      body: {
        weekStartDate: weekKeyFor(ctx.today),
        topLongForm: str(a, 'topLongForm'),
        internalLocusReflection: str(a, 'internalLocusReflection'),
        oneSkillNote: strOrNull(a, 'oneSkillNote') ?? undefined,
      },
    }),
  },
  skill_dev: {
    type: 'skill_dev',
    label: 'Add a skill goal',
    icon: 'Dumbbell',
    accent: 'info',
    cluster: 'learning',
    fields: [
      {
        key: 'skill',
        label: 'Skill',
        kind: 'text',
        placeholder: 'a skill to develop this quarter',
      },
      { key: 'whyItMatters', label: 'Why it matters', kind: 'textarea', optional: true },
      {
        key: 'quarter',
        label: 'Quarter',
        kind: 'text',
        optional: true,
        placeholder: 'e.g. 2026-Q3',
      },
    ],
    summarize: a => `Add skill goal: ${str(a, 'skill') || '(empty)'}`,
    toRequest: (a, ctx) => ({
      method: 'POST',
      path: '/api/founder-os/skills',
      body: {
        quarter: str(a, 'quarter') || quarterKeyFor(ctx.today),
        skill: str(a, 'skill'),
        whyItMatters: strOrNull(a, 'whyItMatters') ?? undefined,
      },
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
