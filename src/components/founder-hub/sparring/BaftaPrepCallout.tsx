'use client';

/**
 * BaftaPrepCallout — Strategy World London / highest-priority-event prep
 * cadence banner on the Sparring Room tab (ship 2026-05-15, audit §5.4).
 *
 * Reads the EXISTING Sparring history (the same array SparringTrendViz
 * consumes) + the event-prep SSOT. No new data model, no API. Pure
 * presentational. Self-hides when there is no upcoming event inside the
 * prep window — mirrors EventPrepCard's HIDE-after-90-days posture.
 *
 * Surfaces, for the founder drilling before the event:
 *   (a) which Phase-1-HXC ("BAFTA") personas were drilled this week,
 *   (b) latest DQI + trend per persona,
 *   (c) the recommended next-rep persona + the weakest dimension to
 *       focus on, and the prep-arc step for the current week,
 *   (d) drill-gap analysis (5B ship 2026-05-26) — event-primary HXC
 *       personas materially under-allocated in the last 14 days of
 *       reps, so the founder doesn't rehearse the wrong wedge before
 *       a calendar-gated room.
 *
 * Visual pattern intentionally matches EventPrepCard (sibling surface):
 * inline borderTop accent, CSS-var palette, monospace countdown.
 */

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  BUYER_PERSONAS,
  GRADING_DIMENSIONS,
} from '@/components/founder-hub/sparring/sparring-room-data';
import {
  getHighestPriorityUpcomingEvent,
  daysUntil,
  hasEventEnded,
  formatEventCountdown,
  ACTION_CADENCE,
} from '@/lib/data/event-prep';
import { prefillConversionLedger } from '@/lib/outreach/ledger-prefill';

/** Minimal structural contract — the full HistoryEntry lives (twice) in
 *  SparringRoomTab + SparringTrendViz; this is a read-only subset so we
 *  don't add a third drift copy. SparringRoomTab's HistoryEntry is
 *  structurally assignable to this. */
interface SparringRep {
  personaId: string;
  dateISO: string;
  salesDqi: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions?: Record<string, number>;
}

interface Props {
  history: SparringRep[];
}

/** Out-of-prep-window cutoff. Matches EventPrepCard HIDE_AFTER_DAYS. */
const HIDE_AFTER_DAYS = 90;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type Trend = 'up' | 'down' | 'flat' | 'new' | 'none';

interface PersonaRow {
  id: string;
  label: string;
  isPrimaryAtEvent: boolean;
  drilledThisWeek: number;
  totalReps: number;
  latestDqi: number | null;
  lastGrade: SparringRep['grade'] | null;
  lastDateMs: number | null;
  trend: Trend;
}

function trendGlyph(t: Trend): { glyph: string; color: string; label: string } {
  switch (t) {
    case 'up':
      return { glyph: '↑', color: 'var(--success)', label: 'improving' };
    case 'down':
      return { glyph: '↓', color: 'var(--error)', label: 'declining' };
    case 'flat':
      return { glyph: '→', color: 'var(--text-secondary)', label: 'flat' };
    case 'new':
      return { glyph: '•', color: 'var(--text-secondary)', label: 'first rep' };
    default:
      return { glyph: '—', color: 'var(--text-muted)', label: 'not drilled' };
  }
}

export function BaftaPrepCallout({ history }: Props) {
  // Capture "now" once at mount (react-hooks/purity — Date.now() is
  // impure during render; minute-level precision is fine for a
  // countdown/cadence banner that doesn't need to tick). Mirrors the
  // EducationRoomTab purity-fix pattern in CLAUDE.md. Hook runs before
  // any conditional return per rules-of-hooks.
  const [nowMs] = useState(() => Date.now());
  const today = new Date(nowMs);

  const event = getHighestPriorityUpcomingEvent(today);
  if (!event) return null;
  const days = daysUntil(event, today);
  // Use hasEventEnded (keyed on endDate), NOT days < 0 (keyed on startDate) —
  // otherwise this whole callout vanishes on day 2 of a multi-day event while
  // the conference is still running (e.g. Strategy World London, Jun 9-10).
  if (days > HIDE_AFTER_DAYS || hasEventEnded(event, today)) return null;

  const weeksUntil = Math.max(0, Math.min(6, Math.ceil(days / 7)));
  const weekAgoMs = nowMs - WEEK_MS;
  const twoWeeksAgoMs = nowMs - 2 * WEEK_MS;

  // The 4 Phase-1-HXC personas ARE the wedge the founder will meet at
  // the highest-signal CSO event. event.primaryPersonas marks the two
  // with the highest density at THIS specific event.
  const hxcPersonas = BUYER_PERSONAS.filter(p => p.tier === 'phase1_hxc');
  const primarySet = new Set<string>(event.primaryPersonas as readonly string[]);

  const rows: PersonaRow[] = hxcPersonas.map(p => {
    const reps = history
      .filter(h => h.personaId === p.id)
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    const last = reps[reps.length - 1];
    const prev = reps[reps.length - 2];
    let trend: Trend = 'none';
    if (reps.length >= 2 && last && prev) {
      const diff = last.salesDqi - prev.salesDqi;
      trend = diff >= 4 ? 'up' : diff <= -4 ? 'down' : 'flat';
    } else if (reps.length === 1) {
      trend = 'new';
    }
    return {
      id: p.id,
      label: p.label,
      isPrimaryAtEvent: primarySet.has(p.id),
      drilledThisWeek: reps.filter(h => Date.parse(h.dateISO) >= weekAgoMs).length,
      totalReps: reps.length,
      latestDqi: last ? last.salesDqi : null,
      lastGrade: last ? last.grade : null,
      lastDateMs: last ? Date.parse(last.dateISO) : null,
      trend,
    };
  });

  // Weakest dimension across HXC reps in the last 14 days (with dims).
  const dimSums = new Map<string, { sum: number; n: number }>();
  for (const h of history) {
    if (!h.dimensions) continue;
    if (Date.parse(h.dateISO) < twoWeeksAgoMs) continue;
    if (!hxcPersonas.some(p => p.id === h.personaId)) continue;
    for (const [dimId, score] of Object.entries(h.dimensions)) {
      const cur = dimSums.get(dimId) ?? { sum: 0, n: 0 };
      cur.sum += score;
      cur.n += 1;
      dimSums.set(dimId, cur);
    }
  }
  let weakestDimLabel: string | null = null;
  let weakestDimMean = Infinity;
  for (const [dimId, agg] of dimSums) {
    if (agg.n < 1) continue;
    const mean = agg.sum / agg.n;
    if (mean < weakestDimMean) {
      weakestDimMean = mean;
      weakestDimLabel = GRADING_DIMENSIONS.find(d => d.id === dimId)?.label ?? dimId;
    }
  }

  // Recommended next rep: least-drilled this week first; within that,
  // event-primary personas first; then lowest latest DQI (undrilled =
  // highest need); then stalest last-rep.
  const recommended = [...rows].sort((a, b) => {
    if (a.drilledThisWeek !== b.drilledThisWeek) return a.drilledThisWeek - b.drilledThisWeek;
    if (a.isPrimaryAtEvent !== b.isPrimaryAtEvent) return a.isPrimaryAtEvent ? -1 : 1;
    const aDqi = a.latestDqi ?? -1;
    const bDqi = b.latestDqi ?? -1;
    if (aDqi !== bDqi) return aDqi - bDqi;
    return (a.lastDateMs ?? 0) - (b.lastDateMs ?? 0);
  })[0];

  // 5B drill-gap analysis (locked 2026-05-26). The audit asked for
  // "drill these 2 personas more — they're underrepresented in
  // last-fortnight reps" — distinct from the single-persona "Focus
  // next rep" block above. Surfaces the BROADER allocation gap:
  // event-primary personas with materially-low share of recent reps.
  // Self-hides when there's not enough signal or no gap exists.
  const recentHxcReps = history.filter(
    h => Date.parse(h.dateISO) >= twoWeeksAgoMs && hxcPersonas.some(p => p.id === h.personaId)
  );
  const totalRecentHxcReps = recentHxcReps.length;

  interface PersonaShare {
    id: string;
    label: string;
    isPrimaryAtEvent: boolean;
    count: number;
    sharePct: number;
  }
  const personaShares: PersonaShare[] = rows.map(r => {
    const count = recentHxcReps.filter(h => h.personaId === r.id).length;
    return {
      id: r.id,
      label: r.label,
      isPrimaryAtEvent: r.isPrimaryAtEvent,
      count,
      sharePct: totalRecentHxcReps > 0 ? (count / totalRecentHxcReps) * 100 : 0,
    };
  });

  // With 4 HXC personas, even-allocation share is 25%. Flag any
  // event-primary persona running below 20% (materially under-allocated)
  // OR with 0 reps in 14d (critical — the wedge persona the founder
  // will MOST meet at the event has zero recent rehearsal).
  const UNDER_DRILL_PCT = 20;
  const underDrilled: PersonaShare[] = personaShares
    .filter(s => s.isPrimaryAtEvent && (s.count === 0 || s.sharePct < UNDER_DRILL_PCT))
    .sort((a, b) => {
      // Zero-rep personas first (most critical gap), then by lowest share.
      if ((a.count === 0) !== (b.count === 0)) return a.count === 0 ? -1 : 1;
      return a.sharePct - b.sharePct;
    });

  // Render the balance check ONLY when (a) at least 2 recent reps to
  // establish a baseline distribution and (b) there's an actual gap.
  // 2 reps is a minimum signal floor — below that, share percentages
  // are statistical noise (one rep at 100% / one rep at 0%).
  const showDrillGap = totalRecentHxcReps >= 2 && underDrilled.length > 0;

  const prepStep = ACTION_CADENCE.prepArc.reduce((best, cur) =>
    Math.abs(cur.weeksBeforeEvent - weeksUntil) < Math.abs(best.weeksBeforeEvent - weeksUntil)
      ? cur
      : best
  );

  const urgencyColor =
    days <= 7 ? 'var(--error)' : days <= 21 ? 'var(--warning)' : 'var(--text-secondary)';

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: '3px solid var(--accent-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              marginBottom: 4,
            }}
          >
            Event prep · rehearsal cadence
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {event.name}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
            {event.venue} · {event.startDate}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 28,
              fontWeight: 700,
              color: urgencyColor,
              lineHeight: 1,
            }}
          >
            {formatEventCountdown(event, today)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            week {weeksUntil} of the prep arc
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: '8px 12px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>This week (T-{weeksUntil}w):</strong>{' '}
        {prepStep.action}
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 10,
        }}
      >
        {rows.map(r => {
          const t = trendGlyph(r.trend);
          const drilled = r.drilledThisWeek > 0;
          return (
            <div
              key={r.id}
              style={{
                border: `1px solid ${drilled ? 'var(--border-color)' : 'var(--warning)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                background: drilled ? 'var(--bg-secondary)' : 'rgba(245, 158, 11, 0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {r.label}
                </span>
                {r.isPrimaryAtEvent && (
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'var(--accent-primary)',
                      background: 'rgba(22, 163, 74, 0.10)',
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 7px',
                    }}
                  >
                    primary here
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: drilled ? 'var(--text-secondary)' : 'var(--warning)',
                  marginBottom: 4,
                }}
              >
                {drilled ? `Drilled ${r.drilledThisWeek}× this week` : 'Not drilled this week'}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                }}
              >
                {r.latestDqi != null ? (
                  <>
                    <span>
                      Last DQI{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>{r.latestDqi}</strong>
                      {r.lastGrade ? ` · ${r.lastGrade}` : ''}
                    </span>
                    <span title={t.label} style={{ color: t.color, fontWeight: 700 }}>
                      {t.glyph}
                    </span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>No reps yet</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showDrillGap && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.30)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12.5,
            color: 'var(--text-primary)',
            lineHeight: 1.5,
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <strong>Rep balance · last 14 days:</strong>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              {totalRecentHxcReps} rep{totalRecentHxcReps === 1 ? '' : 's'} across the HXC wedge.
              Event-primary persona{underDrilled.length === 1 ? '' : 's'} under {UNDER_DRILL_PCT}%
              share —
            </span>
          </div>
          <ul style={{ margin: '0 0 6px 18px', padding: 0, color: 'var(--text-primary)' }}>
            {underDrilled.map(s => (
              <li key={s.id} style={{ marginBottom: 3 }}>
                <strong>{s.label}</strong>
                {' · '}
                <span style={{ color: 'var(--warning)' }}>
                  {s.count === 0
                    ? 'no reps in 14 days'
                    : `${s.count} of ${totalRecentHxcReps} (${s.sharePct.toFixed(0)}%)`}
                </span>
              </li>
            ))}
          </ul>
          <div style={{ color: 'var(--text-secondary)' }}>
            BAFTA primaries should each carry roughly equal rehearsal load — these will have the
            highest density in the room.
          </div>
        </div>
      )}

      {recommended && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            background: 'rgba(22, 163, 74, 0.07)',
            border: '1px solid rgba(22, 163, 74, 0.22)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12.5,
            color: 'var(--text-primary)',
            lineHeight: 1.5,
          }}
        >
          <strong>Focus your next rep:</strong>{' '}
          <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
            {recommended.label}
          </span>{' '}
          (
          {recommended.drilledThisWeek === 0
            ? 'not drilled this week'
            : `lowest recent DQI of the wedge`}
          )
          {weakestDimLabel ? (
            <>
              {' '}
              — weakest dimension across the wedge this fortnight is{' '}
              <strong>{weakestDimLabel}</strong>; run the <em>networking-event · in-person</em> mode
              and target it under 30-second-hook pressure.
            </>
          ) : (
            <>
              {' '}
              — run the <em>networking-event · in-person</em> mode (BAFTA is a cocktail-hour event;
              the verbatim phrasing has to fire under 30-second-hook pressure).
            </>
          )}
          {/* 3C cross-link 2026-05-26: rehearsal → ledger handoff. The
           * recommended.id is a BUYER_PERSONA.id; the IDs are aligned
           * with WEDGE_PERSONA.id (verified) so the ledger panel
           * pre-selects on the same string. */}
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={() => prefillConversionLedger({ persona: recommended.id })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                background: 'transparent',
                border: '1px solid rgba(22, 163, 74, 0.32)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--accent-primary)',
                cursor: 'pointer',
              }}
              aria-label={`Log a real ${recommended.label} prospect in the conversion ledger`}
            >
              <ArrowUpRight size={12} /> Log a real {recommended.label} prospect →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
