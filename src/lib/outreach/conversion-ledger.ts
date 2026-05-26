/**
 * Wedge conversion ledger — pure SSOT (locked 2026-05-18).
 *
 * GTM v3.5 Phase-1 motion mandates: "track conversion religiously —
 * DMs sent, replies, audit booked, audit completed, conversion." The
 * month-4 kill criterion (`<5 paid Individuals by month 4 = halt-and-
 * pivot, regardless of every other metric`) fires whether or not the
 * founder is watching — this module is the instrument that makes the
 * funnel a steerable dashboard instead of a cliff discovered too late.
 *
 * Pure + deterministic — no I/O, no Prisma, no LLM. The API + the
 * ConversionLedgerPanel both consume these functions; the stage
 * legality + metric math live ONLY here (same drift-class discipline as
 * operational-proxy-gate / validateStageTransition — never inline the
 * rules at a call site).
 */

export type FunnelStageId =
  | 'dm_sent'
  | 'replied'
  | 'audit_booked'
  | 'audit_completed'
  | 'converted'
  | 'lost';

export type FunnelStageKind = 'active' | 'won' | 'lost';

export type ProspectSource =
  | 'linkedin_dm'
  | 'event'
  | 'warm_intro'
  | 'inbound'
  | 'intel_brief'
  | 'other';

export interface FunnelStage {
  id: FunnelStageId;
  label: string;
  kind: FunnelStageKind;
  /** Linear funnel order. `lost` is terminal and sits last. */
  order: number;
  /** The WedgeProspect timestamp column stamped when a prospect enters this stage. */
  timestampField:
    | 'dmSentAt'
    | 'repliedAt'
    | 'auditBookedAt'
    | 'auditCompletedAt'
    | 'convertedAt'
    | 'lostAt';
}

export const FUNNEL_STAGES: readonly FunnelStage[] = [
  { id: 'dm_sent', label: 'DM sent', kind: 'active', order: 0, timestampField: 'dmSentAt' },
  { id: 'replied', label: 'Replied', kind: 'active', order: 1, timestampField: 'repliedAt' },
  {
    id: 'audit_booked',
    label: 'Audit booked',
    kind: 'active',
    order: 2,
    timestampField: 'auditBookedAt',
  },
  {
    id: 'audit_completed',
    label: 'Audit completed',
    kind: 'active',
    order: 3,
    timestampField: 'auditCompletedAt',
  },
  {
    id: 'converted',
    label: 'Converted · £249',
    kind: 'won',
    order: 4,
    timestampField: 'convertedAt',
  },
  { id: 'lost', label: 'Lost', kind: 'lost', order: 5, timestampField: 'lostAt' },
] as const;

export const FUNNEL_STAGE_IDS: readonly FunnelStageId[] = FUNNEL_STAGES.map(s => s.id);

export const PROSPECT_SOURCES: readonly { id: ProspectSource; label: string }[] = [
  { id: 'linkedin_dm', label: 'LinkedIn DM' },
  { id: 'event', label: 'Event' },
  { id: 'warm_intro', label: 'Warm intro' },
  { id: 'inbound', label: 'Inbound' },
  { id: 'intel_brief', label: 'Intel brief' },
  { id: 'other', label: 'Other' },
];

const STAGE_BY_ID: Record<FunnelStageId, FunnelStage> = FUNNEL_STAGES.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<FunnelStageId, FunnelStage>
);

export function isFunnelStageId(v: unknown): v is FunnelStageId {
  return typeof v === 'string' && FUNNEL_STAGE_IDS.includes(v as FunnelStageId);
}

export function isProspectSource(v: unknown): v is ProspectSource {
  return typeof v === 'string' && PROSPECT_SOURCES.some(s => s.id === (v as ProspectSource));
}

export function stageTimestampField(stage: FunnelStageId): FunnelStage['timestampField'] {
  return STAGE_BY_ID[stage].timestampField;
}

export function stageLabel(stage: FunnelStageId): string {
  return STAGE_BY_ID[stage]?.label ?? stage;
}

/**
 * A prospect only ever moves FORWARD through the funnel, or to `lost`
 * from any active stage. The honest model:
 *  - same stage → allowed (a notes-only edit is not a transition)
 *  - from a terminal stage (`converted` | `lost`) → blocked (terminal;
 *    a converted/lost prospect is not resurrected — that is a new entry)
 *  - to `lost` from any active stage → allowed (a deal dies from anywhere)
 *  - forward jump among active→won (skipping intermediate stages, e.g. a
 *    warm intro that books an audit without a discrete "reply") → allowed
 *  - backward (`to.order < from.order`) → blocked (you do not un-reply)
 */
export function isValidStageTransition(from: FunnelStageId, to: FunnelStageId): boolean {
  if (!isFunnelStageId(from) || !isFunnelStageId(to)) return false;
  if (from === to) return true;
  const f = STAGE_BY_ID[from];
  const t = STAGE_BY_ID[to];
  // Terminal stages are terminal.
  if (f.kind === 'won' || f.kind === 'lost') return false;
  // Lost is reachable from any active stage.
  if (to === 'lost') return true;
  // Otherwise: strictly forward.
  return t.order > f.order;
}

/** GTM v3.5 Phase-1 kill floor: <5 paid Individuals by month 4 = halt. */
export const PHASE1_KILL_FLOOR = 5;
/** A prospect stuck in an active stage longer than this is "stalled". */
export const STALL_DAYS = 14;

/** GTM v3.5 ratification date — the canonical start of the Phase 1 wedge motion.
 *  When the GTM lock advances to v3.6 / a new phase, edit this in the same
 *  commit as the CLAUDE.md lock change. Every kill-checkpoint / graduation
 *  date downstream derives from this anchor. */
export const PHASE_1_START_ISO = '2026-05-04';

/** Month-4 kill checkpoint per GTM v3.5: 4 months from PHASE_1_START_ISO.
 *  CLAUDE.md: "<5 paid Individuals by month 4 = halt-and-pivot, regardless
 *  of every other metric. NEVER push harder on the same motion when the
 *  early-warning signal is red." Used by the FounderOSTab countdown card
 *  to make this gate visible as a daily discipline tool. */
export const PHASE_1_KILL_CHECKPOINT_ISO = '2026-09-04';

/** Month-6 graduation gate per GTM v3.5: 8-12 paid Individuals retained
 *  90+ days. Surfaced for downstream consumers — the countdown card uses
 *  PHASE_1_KILL_CHECKPOINT_ISO as the primary deadline; this is the next
 *  gate after the kill checkpoint passes. */
export const PHASE_1_GRADUATION_GATE_ISO = '2026-11-04';

export interface ProspectLike {
  stage: string;
  updatedAt: Date | string;
}

export type KillBand = 'at_risk' | 'approaching' | 'on_track';

export interface FunnelMetrics {
  total: number;
  /** Count per stage id (every stage present, 0 when empty). */
  byStage: Record<FunnelStageId, number>;
  active: number;
  converted: number;
  lost: number;
  /** converted / (converted + lost) as a 0-100 pct; 0 when no resolved prospects. */
  conversionRatePct: number;
  /** Active prospects untouched for > STALL_DAYS — the re-engage queue. */
  stalled: number;
  killFloor: number;
  /**
   * Where `converted` sits vs the v3.5 month-4 floor. NOT a date check
   * (the founder reads the month context) — a pure count band so the
   * UI can colour the kill signal. on_track ≥ floor · approaching ≥
   * ceil(floor/2) · at_risk below that.
   */
  killBand: KillBand;
}

function zeroByStage(): Record<FunnelStageId, number> {
  return FUNNEL_STAGE_IDS.reduce(
    (acc, id) => {
      acc[id] = 0;
      return acc;
    },
    {} as Record<FunnelStageId, number>
  );
}

/**
 * Compute the funnel dashboard from the prospect set. Pure: pass `now`
 * for deterministic stall computation (defaults to Date.now()).
 */
export function computeFunnelMetrics(
  prospects: ProspectLike[],
  now: number = Date.now()
): FunnelMetrics {
  const byStage = zeroByStage();
  let converted = 0;
  let lost = 0;
  let active = 0;
  let stalled = 0;
  const stallMs = STALL_DAYS * 24 * 60 * 60 * 1000;

  for (const p of prospects) {
    if (!isFunnelStageId(p.stage)) continue; // defensive: ignore unknown stages
    byStage[p.stage] += 1;
    const kind = STAGE_BY_ID[p.stage].kind;
    if (kind === 'won') converted += 1;
    else if (kind === 'lost') lost += 1;
    else {
      active += 1;
      const updated = new Date(p.updatedAt).getTime();
      if (Number.isFinite(updated) && now - updated > stallMs) stalled += 1;
    }
  }

  const resolved = converted + lost;
  const conversionRatePct = resolved === 0 ? 0 : Math.round((converted / resolved) * 100);

  const approachingFloor = Math.ceil(PHASE1_KILL_FLOOR / 2);
  const killBand: KillBand =
    converted >= PHASE1_KILL_FLOOR
      ? 'on_track'
      : converted >= approachingFloor
        ? 'approaching'
        : 'at_risk';

  return {
    total: prospects.length,
    byStage,
    active,
    converted,
    lost,
    conversionRatePct,
    stalled,
    killFloor: PHASE1_KILL_FLOOR,
    killBand,
  };
}
