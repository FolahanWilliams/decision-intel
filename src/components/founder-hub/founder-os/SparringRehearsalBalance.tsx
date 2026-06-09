'use client';

/**
 * SparringRehearsalBalance — HXC-persona rehearsal balance widget for
 * FounderOSTab (5.2 lock 2026-05-08).
 *
 * Strategy World London is the highest-signal CSO event of the next 90
 * days (June 9-10 BAFTA per CLAUDE.md GTM v3.5 §2 + EventPrepCard SSOT).
 * The Sparring Room's HXC default + 4 wedge personas shipped 2026-05-07
 * wedge-batch-3, but the founder doesn't see "you've rehearsed
 * fractional_cso 3× this week and skipped midmarket_corpdev_head" —
 * which is exactly the rebalancing signal the pre-event prep window needs.
 *
 * The countdown text renders LIVE from getHighestPriorityUpcomingEvent +
 * daysUntil (SSOT in src/lib/data/event-prep.ts). Do NOT reintroduce
 * hardcoded "T-N days" strings — the prior version had "T-32" literals
 * that silently drifted 20 days off-truth between the 2026-05-08 lock
 * and the 2026-05-28 nightly audit catch.
 *
 * This widget reads localStorage['di-sparring-room-history-v1'], filters
 * to the last 7 days, buckets reps per HXC persona, surfaces the
 * gap-with-recommendation in one tile.
 *
 * Pure read-side — never writes. Renders null when no history exists
 * (graceful empty state with a "start your first rep" CTA so the widget
 * doesn't yell at someone who hasn't run Sparring yet).
 */

import { useEffect, useState } from 'react';
import { Swords, ArrowRight } from 'lucide-react';
import { getHighestPriorityUpcomingEvent, daysUntil } from '@/lib/data/event-prep';

const HISTORY_KEY = 'di-sparring-room-history-v1';

// The four Phase 1 HXC personas locked in v3.5 (mirrors PHASE_1_HXC_PERSONAS
// in icp.ts; mirrors BUYER_PERSONAS tier='phase1_hxc' in sparring-room-data).
// Hardcoded here (not imported) because Sparring's HistoryEntry uses string
// keys — the widget only needs to match the four ids without round-tripping
// through the Sparring data file.
const HXC_PERSONAS: Array<{
  id: 'fractional_cso' | 'midmarket_corp_dev' | 'smaller_fund_gp' | 'pe_backed_founder';
  shortLabel: string;
  archetype: string;
}> = [
  { id: 'fractional_cso', shortLabel: 'Fractional CSO', archetype: 'Marcus' },
  { id: 'midmarket_corp_dev', shortLabel: 'Mid-mkt corp dev', archetype: 'Damien' },
  { id: 'smaller_fund_gp', shortLabel: 'Smaller-fund GP', archetype: 'Aisha' },
  { id: 'pe_backed_founder', shortLabel: 'PE-backed founder', archetype: 'Henrik' },
];

interface SparringHistoryEntry {
  sessionId?: string;
  dateISO?: string;
  personaId?: string;
  mode?: string;
  salesDqi?: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface PersonaStat {
  personaId: string;
  shortLabel: string;
  archetype: string;
  reps7d: number;
  latestGrade: 'A' | 'B' | 'C' | 'D' | 'F' | null;
  latestDqi: number | null;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function readHistory(mountTime: number): PersonaStat[] {
  if (typeof window === 'undefined') return [];
  let entries: SparringHistoryEntry[] = [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) entries = parsed as SparringHistoryEntry[];
  } catch {
    // Private-mode Safari, unparseable JSON — empty state is correct.
    return [];
  }

  const cutoff = mountTime - SEVEN_DAYS_MS;
  return HXC_PERSONAS.map(p => {
    const matching = entries.filter(e => e.personaId === p.id);
    const recent = matching.filter(e => {
      if (!e.dateISO) return false;
      const ts = new Date(e.dateISO).getTime();
      return Number.isFinite(ts) && ts >= cutoff;
    });
    // Latest grade looks at ALL history (not just 7d) — gives a recency
    // signal even when the last rep was older than the rebalance window.
    const sortedAll = matching
      .filter(e => e.dateISO)
      .sort((a, b) => new Date(b.dateISO!).getTime() - new Date(a.dateISO!).getTime());
    const latest = sortedAll[0];
    return {
      personaId: p.id,
      shortLabel: p.shortLabel,
      archetype: p.archetype,
      reps7d: recent.length,
      latestGrade: latest?.grade ?? null,
      latestDqi: typeof latest?.salesDqi === 'number' ? latest.salesDqi : null,
    };
  });
}

function gradeColor(g: 'A' | 'B' | 'C' | 'D' | 'F' | null): string {
  switch (g) {
    case 'A':
      return 'var(--success)';
    case 'B':
      return 'var(--accent-primary)';
    case 'C':
      return 'var(--warning)';
    case 'D':
      return 'var(--severity-high)';
    case 'F':
      return 'var(--error)';
    default:
      return 'var(--text-muted)';
  }
}

function jumpToSparringRoom() {
  if (typeof window === 'undefined') return;
  // The Founder Hub page listens for `founder-hub-navigate` and flips
  // activeTab. Mirrors the chat-nav pattern documented in CLAUDE.md.
  window.dispatchEvent(
    new CustomEvent('founder-hub-navigate', { detail: { tabId: 'sparring_room' } })
  );
}

export function SparringRehearsalBalance() {
  const [mountTime] = useState(() => Date.now());
  const [stats, setStats] = useState<PersonaStat[] | null>(null);

  useEffect(() => {
    setStats(readHistory(mountTime));
  }, [mountTime]);

  if (!stats) return null;

  // Live countdown to the highest-priority upcoming event (canonical
  // SSOT in src/lib/data/event-prep.ts EVENTS). Prior versions of this
  // surface hardcoded "T-32 days" in the empty-state + focus-block JSX
  // which silently drifted 20 days off-truth between the 2026-05-08 lock
  // date and the actual event countdown. Render dynamically so the
  // surface stays accurate every day without code edits.
  const upcomingEvent = getHighestPriorityUpcomingEvent(new Date(mountTime));
  const daysToEvent = upcomingEvent ? daysUntil(upcomingEvent, new Date(mountTime)) : null;
  const eventLabel = upcomingEvent
    ? daysToEvent !== null && daysToEvent < 0
      ? // multi-day event currently running (daysUntil keys off startDate → negative)
        `${upcomingEvent.name} is happening now`
      : daysToEvent === 0
        ? `${upcomingEvent.name} is TODAY`
        : `${upcomingEvent.name} is T-${daysToEvent} days`
    : null;

  const totalReps = stats.reduce((acc, s) => acc + s.reps7d, 0);
  const isEmpty = totalReps === 0 && stats.every(s => s.latestGrade === null);

  // Recommendation: persona with fewest reps in last 7d (ties broken by
  // longest-ago latest grade — i.e. cold-start personas surface above
  // recently-rehearsed-but-zero-this-week personas).
  const sortedByGap = [...stats].sort((a, b) => {
    if (a.reps7d !== b.reps7d) return a.reps7d - b.reps7d;
    if (a.latestGrade === null && b.latestGrade !== null) return -1;
    if (b.latestGrade === null && a.latestGrade !== null) return 1;
    return 0;
  });
  const focusPick = sortedByGap[0];

  return (
    <div style={cardStyle}>
      <div style={headerRow}>
        <div style={eyebrow}>
          <Swords size={11} /> HXC rehearsal balance · last 7 days
        </div>
        <button type="button" onClick={jumpToSparringRoom} style={openLink}>
          Open Sparring Room
          <ArrowRight size={11} strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      {isEmpty ? (
        <div style={emptyStateBody}>
          <strong style={{ color: 'var(--text-primary)' }}>No HXC reps logged yet.</strong>{' '}
          {eventLabel ? (
            <>
              {eventLabel} ({upcomingEvent!.venue}) &mdash; the highest-signal CSO event of the next
              90 days. Run your first rep against <code>{HXC_PERSONAS[0].shortLabel}</code> before
              your next live engagement.
            </>
          ) : (
            <>
              Run your first rep against <code>{HXC_PERSONAS[0].shortLabel}</code> before your next
              live engagement.
            </>
          )}
        </div>
      ) : (
        <>
          <div style={statRow}>
            {stats.map(s => (
              <div key={s.personaId} style={statTile}>
                <div style={statLabel}>{s.shortLabel}</div>
                <div style={statBigRow}>
                  <span style={statRepCount}>{s.reps7d}</span>
                  <span style={statRepUnit}>{s.reps7d === 1 ? 'rep' : 'reps'}</span>
                </div>
                <div style={statSecondary}>
                  {s.latestGrade ? (
                    <>
                      latest{' '}
                      <span style={{ color: gradeColor(s.latestGrade), fontWeight: 700 }}>
                        {s.latestGrade}
                      </span>
                      {s.latestDqi !== null ? <> · DQI {s.latestDqi}</> : null}
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      not rehearsed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={focusBlock}>
            <strong style={{ color: 'var(--accent-primary)' }}>Focus next:</strong>{' '}
            {focusPick.reps7d === 0 ? (
              <>
                <code>{focusPick.shortLabel}</code> ({focusPick.archetype}-archetype) has{' '}
                <strong>0 reps</strong> in the last 7 days
                {focusPick.latestGrade
                  ? ` (latest grade ${focusPick.latestGrade})`
                  : ' and no prior rehearsal'}
                .{eventLabel ? ` ${eventLabel} ` : ' '}&mdash; balanced rep across all 4 HXC
                personas before the BAFTA hallway, not 4× <code>{stats[0].shortLabel}</code> and 0×
                everyone else.
              </>
            ) : (
              <>
                <code>{focusPick.shortLabel}</code> is your lowest-rep persona this week (
                {focusPick.reps7d}). Run 1-2 more reps before your next live engagement.
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── styles ────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: '12px 14px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderLeft: '3px solid #6366F1', // indigo — same as the Sparring Room's tab accent
  borderRadius: 'var(--radius-md)',
  fontSize: 11.5,
  lineHeight: 1.5,
  color: 'var(--text-primary)',
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 10,
  flexWrap: 'wrap',
};

const eyebrow: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#6366F1',
};

const openLink: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  background: 'color-mix(in srgb, #6366F1 12%, transparent)',
  border: '1px solid #6366F1',
  borderRadius: 'var(--radius-sm, 6px)',
  fontSize: 10.5,
  fontWeight: 700,
  color: '#6366F1',
  cursor: 'pointer',
  letterSpacing: '-0.005em',
};

const emptyStateBody: React.CSSProperties = {
  fontSize: 11.5,
  color: 'var(--text-secondary)',
  lineHeight: 1.55,
};

const statRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 8,
  marginBottom: 10,
};

const statTile: React.CSSProperties = {
  padding: '8px 10px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm, 6px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const statLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  letterSpacing: '-0.005em',
};

const statBigRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 4,
};

const statRepCount: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: 'var(--text-primary)',
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1,
};

const statRepUnit: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--text-muted)',
};

const statSecondary: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--text-secondary)',
  letterSpacing: '-0.005em',
};

const focusBlock: React.CSSProperties = {
  fontSize: 11.5,
  color: 'var(--text-primary)',
  lineHeight: 1.55,
  paddingTop: 8,
  borderTop: '1px dashed var(--border-color)',
};
