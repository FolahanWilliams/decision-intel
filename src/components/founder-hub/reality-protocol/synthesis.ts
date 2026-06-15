/**
 * 66-Day Protocol — the synthesis layer (2026-06-15, founder-approved).
 *
 * The ONE AI surface the protocol design allows, and only because it is the
 * specific gap the original design said to bring back: "if you run it for a few
 * weeks and find a specific gap an AI would genuinely close, bring me the exact
 * gap." The gap is 65 days of rich, honest reflection data that deserves
 * synthesis. This is RETROSPECTIVE — a deliberate, on-demand read of the whole
 * corpus — NOT the banned urge-moment chatbot (which would let "let me discuss
 * my urge with my AI" become another way to not act).
 *
 * LOAD-BEARING discipline (mirrors the rest of the protocol):
 *  - It mirrors HIS OWN data back as patterns; it is a pattern-spotter, never a
 *    coach/therapist/cheerleader. Grounded only in the data. Invents nothing.
 *  - Honest N-floor: below SYNTHESIS_MIN_DAYS of reflection it refuses to
 *    synthesize ("noise dressed as insight is worse than nothing").
 *  - It NEVER feeds the tree, never gates progress, never becomes a daily input.
 *  - It retires at day 66 with the rest of the tool.
 *
 * This module is PURE (no I/O, no Prisma, no fetch). The route does auth + fetch
 * + the gateway call; everything here — assemble / prompt / parse / mock — is
 * deterministic and unit-tested.
 */

import { computeProtocolState, type CheckinKind } from './tree-growth';
import {
  summarizeReflections,
  correlateFactorWithOutcome,
  type FactorTrend,
  type OutcomeCorrelation,
  type ReflectionFactorId,
  type ReflectionLite,
} from './reflection-trends';
import { REFLECTION_FACTORS, REFLECTION_SCALE_MAX } from './content';

/** Below this many DISTINCT reflection days, refuse to synthesize. A handful of
 *  days is a coincidence, not a pattern. */
export const SYNTHESIS_MIN_DAYS = 5;

/** How many of the most-recent qualitative entries to feed the model. Caps the
 *  prompt and keeps the synthesis weighted toward the current arc. */
export const SYNTHESIS_RECENT_CAP = 21;

/** The persisted shape the assembler needs — a superset of ReflectionLite. */
export interface SynthesisReflectionRow extends ReflectionLite {
  note?: string | null;
  tomorrow?: string | null;
}

export interface SynthesisCheckinRow {
  date: string;
  kind: CheckinKind;
  escapePlan?: string | null;
  stayedOnTrack?: boolean | null;
}

export interface SynthesisPattern {
  title: string;
  detail: string;
}

export interface SynthesisNudge {
  /** The pattern in the data that earns the nudge. */
  observation: string;
  /** The single concrete next step, drawn from his own logged words. */
  action: string;
}

export interface SynthesisResult {
  /** 2-3 sentences on the overall trajectory so far. */
  arc: string;
  /** 3-5 specific, data-grounded patterns. */
  patterns: SynthesisPattern[];
  /** Exactly one forward nudge (patterns + ONE nudge — the locked framing). */
  nudge: SynthesisNudge;
}

export interface SynthesisCorpus {
  dayNumber: number;
  totalCheckins: number;
  cleanCount: number;
  slipCount: number;
  reflectionDays: number;
  factorTrends: FactorTrend[];
  correlations: OutcomeCorrelation[];
  /** Recent morning intentions (the escape plan / pre-decided next action). */
  morningPlans: Array<{ date: string; plan: string }>;
  /** Recent evening reflections (note + tomorrow + the ratings). */
  reflections: Array<{
    date: string;
    mind: number | null;
    energy: number | null;
    intention: number | null;
    note: string | null;
    tomorrow: string | null;
  }>;
  /** The nights marked as a slip — the honest data. */
  slipDates: string[];
}

const FACTOR_IDS: ReflectionFactorId[] = REFLECTION_FACTORS.map(f => f.id);
const FACTOR_LABEL: Record<ReflectionFactorId, string> = REFLECTION_FACTORS.reduce(
  (acc, f) => {
    acc[f.id] = f.label;
    return acc;
  },
  {} as Record<ReflectionFactorId, string>
);

/** Distinct reflection days that carry at least one rating OR a note/tomorrow. */
export function reflectionDayCount(reflections: ReadonlyArray<SynthesisReflectionRow>): number {
  const days = new Set<string>();
  for (const r of reflections) {
    const hasRating = [r.mind, r.energy, r.intention].some(v => typeof v === 'number');
    const hasText = Boolean(r.note?.trim() || r.tomorrow?.trim());
    if (hasRating || hasText) days.add(r.date);
  }
  return days.size;
}

/** Enough honest data to find a real pattern? */
export function isSynthesisReady(reflections: ReadonlyArray<SynthesisReflectionRow>): boolean {
  return reflectionDayCount(reflections) >= SYNTHESIS_MIN_DAYS;
}

/** Fold the raw rows into the structured corpus the model reasons over. Pure. */
export function assembleCorpus(
  checkins: ReadonlyArray<SynthesisCheckinRow>,
  reflections: ReadonlyArray<SynthesisReflectionRow>
): SynthesisCorpus {
  const state = computeProtocolState(
    checkins.map(c => ({ date: c.date, kind: c.kind, stayedOnTrack: c.stayedOnTrack }))
  );

  const reflLite: ReflectionLite[] = reflections.map(r => ({
    date: r.date,
    mind: r.mind,
    energy: r.energy,
    intention: r.intention,
  }));
  const checkLite = checkins.map(c => ({
    date: c.date,
    kind: c.kind,
    stayedOnTrack: c.stayedOnTrack,
  }));

  const factorTrends = summarizeReflections(reflLite, FACTOR_IDS);
  const correlations = FACTOR_IDS.map(id =>
    correlateFactorWithOutcome(reflLite, checkLite, id)
  ).filter((c): c is OutcomeCorrelation => c !== null);

  const morningPlans = checkins
    .filter(c => c.kind === 'morning' && c.escapePlan?.trim())
    .map(c => ({ date: c.date, plan: c.escapePlan!.trim() }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-SYNTHESIS_RECENT_CAP);

  const refl = [...reflections]
    .filter(r => {
      const hasRating = [r.mind, r.energy, r.intention].some(v => typeof v === 'number');
      return hasRating || r.note?.trim() || r.tomorrow?.trim();
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-SYNTHESIS_RECENT_CAP)
    .map(r => ({
      date: r.date,
      mind: typeof r.mind === 'number' ? r.mind : null,
      energy: typeof r.energy === 'number' ? r.energy : null,
      intention: typeof r.intention === 'number' ? r.intention : null,
      note: r.note?.trim() || null,
      tomorrow: r.tomorrow?.trim() || null,
    }));

  const slipDates = checkins
    .filter(c => c.kind === 'night' && c.stayedOnTrack === false)
    .map(c => c.date)
    .sort();

  return {
    dayNumber: state.dayNumber,
    totalCheckins: state.totalCheckins,
    cleanCount: state.cleanCount,
    slipCount: state.slipCount,
    reflectionDays: reflectionDayCount(reflections),
    factorTrends,
    correlations,
    morningPlans,
    reflections: refl,
    slipDates,
  };
}

function trendLine(t: FactorTrend): string {
  const label = FACTOR_LABEL[t.id];
  if (t.count === 0) return `${label}: no ratings yet`;
  const avg = t.average !== null ? t.average.toFixed(1) : '—';
  const delta =
    t.delta === null
      ? 'flat / not enough history'
      : t.delta > 0.2
        ? `rising (recent +${t.delta.toFixed(1)})`
        : t.delta < -0.2
          ? `falling (recent ${t.delta.toFixed(1)})`
          : 'steady';
  return `${label}: avg ${avg}/${REFLECTION_SCALE_MAX} over ${t.count} day(s), ${delta}`;
}

function correlationLine(c: OutcomeCorrelation): string {
  const label = FACTOR_LABEL[c.id];
  const high = Math.round(c.highRate * 100);
  const low = Math.round(c.lowRate * 100);
  return `${label}: on high-${label.toLowerCase()} days he stayed on track ${high}% of the time (n=${c.highN}); on low days, ${low}% (n=${c.lowN})`;
}

/** Build the model prompt. `capstone` shifts the framing to the day-66 close. */
export function buildSynthesisPrompt(corpus: SynthesisCorpus, capstone = false): string {
  const trends = corpus.factorTrends.map(trendLine).join('\n');
  const correlations = corpus.correlations.length
    ? corpus.correlations.map(correlationLine).join('\n')
    : 'Not enough paired days yet to correlate a factor with on-track nights.';
  const plans = corpus.morningPlans.length
    ? corpus.morningPlans.map(p => `  ${p.date}: ${p.plan}`).join('\n')
    : '  (none logged)';
  const reflections = corpus.reflections.length
    ? corpus.reflections
        .map(r => {
          const ratings = [
            r.mind !== null ? `mind ${r.mind}` : '',
            r.energy !== null ? `energy ${r.energy}` : '',
            r.intention !== null ? `intention ${r.intention}` : '',
          ]
            .filter(Boolean)
            .join(', ');
          const parts = [
            ratings ? `[${ratings}]` : '',
            r.note ? `note: "${r.note}"` : '',
            r.tomorrow ? `tomorrow: "${r.tomorrow}"` : '',
          ].filter(Boolean);
          return `  ${r.date}: ${parts.join(' · ')}`;
        })
        .join('\n')
    : '  (none logged)';

  return `You are the synthesis layer for Folahan's 66-Day Protocol — a personal log where, twice a day, he records a MORNING intention (where he might want to escape today, and what he'll do instead) and a NIGHT mark (stayed on track, or slipped), plus an optional EVENING reflection: how his Mind / Energy / Intention felt on a 1-${REFLECTION_SCALE_MAX} scale, a free note on the day, and one intention for tomorrow. The protocol replaces an escape pattern (porn + the social feed, driven by boredom and avoidance of hard, uncertain work) with a built life and a world-class mind. He is ${corpus.dayNumber} day(s) in.

YOUR JOB: read the accumulated log below and mirror back the PATTERNS he cannot see day to day. You are a pattern-spotter, NOT a coach, therapist, or cheerleader.

RULES (load-bearing):
- Ground EVERYTHING in the data below. Quote his own words where it sharpens a point. Invent nothing — if a claim is not in the data, do not make it.
- Be specific and honest. If the data is thin or contradictory, SAY SO rather than manufacturing a pattern from a coincidence. Noise dressed as insight is worse than nothing.
- No shame, no moralizing, no clinical or therapy-speak. Plain, direct, respectful — a sharp friend reading his own ledger back to him.
- Notice especially: recurring triggers; the GAP between his "tomorrow" intentions and what the next days actually show; what his best days (high mind/energy, on-track nights) have in common; the ARC over time (is it bending up?); and what he keeps PLANNING but not doing.
- End with EXACTLY ONE forward nudge. It must be drawn from HIS OWN logged words/intentions, not generic advice (e.g. "you've written 'phone in the hall' on four rough nights but it never makes the next morning's plan — make it the standing rule").
${capstone ? '- This is the DAY-66 capstone: the closing read of the whole 66 days. Speak to the arc of the change and what he carries forward off the scaffolding.' : ''}

THE DATA
Engagement: ${corpus.dayNumber} engaged day(s), ${corpus.totalCheckins} check-ins, ${corpus.cleanCount} on-track night(s), ${corpus.slipCount} slip(s).
Slip dates: ${corpus.slipDates.length ? corpus.slipDates.join(', ') : 'none'}.

Factor trends (deterministic):
${trends}

Factor ↔ on-track correlations (only shown when the sample clears the floor):
${correlations}

Morning intentions (most recent ${SYNTHESIS_RECENT_CAP}):
${plans}

Evening reflections (most recent ${SYNTHESIS_RECENT_CAP}):
${reflections}

Return ONLY valid JSON, no prose around it, in exactly this shape:
{"arc":"2-3 sentences on the overall trajectory so far","patterns":[{"title":"short label","detail":"the specific, data-grounded observation, quoting his words where it helps"}],"nudge":{"observation":"the pattern that earns the nudge","action":"the single concrete next step, in his own terms"}}
Give 3 to 5 patterns. Nothing outside the JSON.`;
}

/** Strip markdown code fences a model sometimes wraps JSON in. */
function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function cleanStr(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/** Defensive parse — returns null on any malformed shape (the route then falls
 *  back to the deterministic mock rather than rendering garbage). */
export function parseSynthesis(text: string): SynthesisResult | null {
  let raw: unknown;
  try {
    raw = JSON.parse(stripFences(text));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const arc = cleanStr(o.arc, 600);
  const patternsRaw = Array.isArray(o.patterns) ? o.patterns : [];
  const patterns: SynthesisPattern[] = patternsRaw
    .map(p => {
      const po = (p ?? {}) as Record<string, unknown>;
      return { title: cleanStr(po.title, 120), detail: cleanStr(po.detail, 600) };
    })
    .filter(p => p.title && p.detail)
    .slice(0, 6);
  const nudgeO = (o.nudge ?? {}) as Record<string, unknown>;
  const nudge: SynthesisNudge = {
    observation: cleanStr(nudgeO.observation, 400),
    action: cleanStr(nudgeO.action, 400),
  };
  if (!arc || patterns.length === 0 || !nudge.action) return null;
  return { arc, patterns, nudge };
}

/** Deterministic synthesis used when no AI key is configured — built straight
 *  from the corpus so the surface is honest and useful even with no model. */
export function mockSynthesis(corpus: SynthesisCorpus): SynthesisResult {
  const onTrackRate =
    corpus.cleanCount + corpus.slipCount > 0
      ? Math.round((corpus.cleanCount / (corpus.cleanCount + corpus.slipCount)) * 100)
      : null;
  const risingFactor = corpus.factorTrends.find(t => t.delta !== null && t.delta > 0.2);

  const patterns: SynthesisPattern[] = [];
  patterns.push({
    title: 'Showing up',
    detail: `${corpus.dayNumber} engaged day(s), ${corpus.totalCheckins} check-ins logged${
      onTrackRate !== null ? `, on track ${onTrackRate}% of marked nights` : ''
    }.`,
  });
  if (risingFactor) {
    patterns.push({
      title: `${FACTOR_LABEL[risingFactor.id]} is bending up`,
      detail: `Your ${FACTOR_LABEL[risingFactor.id].toLowerCase()} ratings are higher in recent days than earlier ones.`,
    });
  }
  if (corpus.slipDates.length) {
    patterns.push({
      title: 'Slips are data, not resets',
      detail: `${corpus.slipDates.length} slip(s) logged honestly — the tree kept growing through each.`,
    });
  }

  return {
    arc: `You are ${corpus.dayNumber} day(s) in with ${corpus.reflectionDays} reflection(s) logged. (Set AI_GATEWAY_API_KEY for the full narrative synthesis — this is the deterministic summary.)`,
    patterns,
    nudge: {
      observation: 'Your morning plans are where the day is won or lost.',
      action:
        corpus.morningPlans.length > 0
          ? `Keep naming the specific next action each morning — your last was "${corpus.morningPlans[corpus.morningPlans.length - 1].plan}".`
          : 'Name one specific next action each morning before the vulnerable window.',
    },
  };
}
