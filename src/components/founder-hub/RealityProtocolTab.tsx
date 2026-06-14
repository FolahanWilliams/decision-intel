'use client';

/**
 * 66-Day Protocol tab — the founder-private "choose reality" check-in tracker.
 *
 * Two ~15-second check-ins a day grow a tree to full bloom at day 66. The
 * immersive sky+tree hero (RealityTree) is a self-contained illustration; the
 * surrounding cards use platform tokens so the surface sits cleanly inside the
 * light-theme Founder Hub.
 *
 * LOAD-BEARING (mirrors content.ts + tree-growth.ts): one morning question,
 * one night mark, no extra inputs, no in-app AI. A slip is logged honestly and
 * NEVER resets the tree. Friction is the enemy — the check-in must stay fast.
 *
 * Founder-scoped: persists to /api/founder-os/reality-checkin via the
 * x-founder-pass header (same pattern as every other founder-os surface).
 */

import { useState, useEffect, useCallback } from 'react';
import { Sprout, Sunrise, Moon, Check, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import {
  MORNING_QUESTION,
  MORNING_PLACEHOLDER,
  KEYSTONES,
  ANTI_GOAL,
  SLIP_REFRAME,
  RESEARCH_NOTE,
  PROTOCOL_START_ISO,
  DIAGNOSIS_REFRAME,
  INSANITY_QUOTE,
  CONSTRUCTION_SWAPS,
} from './reality-protocol/content';
import {
  computeProtocolState,
  checkinsForDay,
  selectVerse,
  finishIso,
  todayIso,
  type CheckinKind,
} from './reality-protocol/tree-growth';
import { RealityTree, skyInfoFor, REALITY_GOLD } from './reality-protocol/RealityTree';
import { LoopViz } from './reality-protocol/LoopViz';

interface RealityCheckinRow {
  id?: string;
  date: string;
  kind: CheckinKind;
  escapePlan?: string | null;
  stayedOnTrack?: boolean | null;
  note?: string | null;
  verseRef?: string | null;
}

/** Short "14 Jun" style label without colliding with the canonical formatDate
 *  util (canonical-imports lint). Pure, local. */
function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function RealityProtocolTab({ founderPass }: { founderPass: string }) {
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<RealityCheckinRow[]>([]);
  const [today] = useState(() => todayIso());
  const [sky] = useState(() => skyInfoFor(new Date().getHours()));

  const [morningOpen, setMorningOpen] = useState(false);
  const [editingMorning, setEditingMorning] = useState(false);
  const [planText, setPlanText] = useState('');
  const [nightOpen, setNightOpen] = useState(false);
  const [editingNight, setEditingNight] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showContext, setShowContext] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/founder-os/reality-checkin?days=90', {
          headers: { 'x-founder-pass': founderPass },
        });
        if (!res.ok) throw new Error('load failed');
        const json = await res.json();
        if (active && Array.isArray(json?.data?.checkins)) {
          setCheckins(json.data.checkins as RealityCheckinRow[]);
        }
      } catch {
        // Server fails soft to []; a network error just leaves the seed state.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [founderPass]);

  const firePulse = useCallback(() => {
    setPulse(true);
    setTimeout(() => setPulse(false), 850);
  }, []);

  const saveCheckin = useCallback(
    async (payload: {
      kind: CheckinKind;
      escapePlan?: string;
      stayedOnTrack?: boolean;
      verseRef?: string;
    }): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch('/api/founder-os/reality-checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-founder-pass': founderPass },
          body: JSON.stringify({ date: today, ...payload }),
        });
        if (!res.ok) throw new Error('save failed');
        const json = await res.json();
        const saved = json?.data?.checkin as RealityCheckinRow | undefined;
        if (saved) {
          setCheckins(prev => [
            ...prev.filter(c => !(c.date === saved.date && c.kind === saved.kind)),
            saved,
          ]);
          firePulse();
        }
        return true;
      } catch {
        setError('Could not save. Check your connection and try again.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [founderPass, today, firePulse]
  );

  const resetAll = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/founder-os/reality-checkin?all=1', {
        method: 'DELETE',
        headers: { 'x-founder-pass': founderPass },
      });
      if (!res.ok) throw new Error('reset failed');
      setCheckins([]);
      setConfirmReset(false);
      setPlanText('');
      setMorningOpen(false);
      setNightOpen(false);
    } catch {
      setError('Could not reset. Try again.');
    }
  }, [founderPass]);

  const state = computeProtocolState(checkins);
  const dayRec = checkinsForDay(checkins, today);
  const morningDone = Boolean(dayRec.morning);
  const nightDone = Boolean(dayRec.night);
  const slippedToday = nightDone && dayRec.night?.stayedOnTrack === false;

  const verse = selectVerse({
    dateIso: today,
    kind: nightDone ? 'night' : 'morning',
    slipped: slippedToday,
  });

  const doMorning = async () => {
    const mVerse = selectVerse({ dateIso: today, kind: 'morning' });
    const ok = await saveCheckin({
      kind: 'morning',
      escapePlan: planText.trim() || undefined,
      verseRef: mVerse.ref,
    });
    if (ok) {
      setMorningOpen(false);
      setEditingMorning(false);
    }
  };

  const doNight = async (stayedOnTrack: boolean) => {
    const nVerse = selectVerse({ dateIso: today, kind: 'night', slipped: !stayedOnTrack });
    const ok = await saveCheckin({ kind: 'night', stayedOnTrack, verseRef: nVerse.ref });
    if (ok) {
      setNightOpen(false);
      setEditingNight(false);
    }
  };

  // ── styles (platform tokens) ──────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 18,
  };
  const primaryBtn: React.CSSProperties = {
    width: '100%',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '13px 16px',
    fontSize: 15,
    fontWeight: 600,
    cursor: saving ? 'wait' : 'pointer',
    background: 'var(--accent-primary)',
    color: '#fff',
    opacity: saving ? 0.7 : 1,
  };
  const neutralBtn: React.CSSProperties = {
    ...primaryBtn,
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  };
  const doneBox: React.CSSProperties = {
    ...cardStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 600,
  };
  const changeLink: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 600,
    padding: 0,
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>
        Loading your tree…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sprout size={22} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2
              style={{
                fontSize: 'var(--fs-lg, 20px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              66-Day Protocol
            </h2>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              Choose reality. Build the person.
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {sky.label}
        </div>
      </div>

      {/* tree hero */}
      <RealityTree
        progress={state.progress}
        sky={sky}
        dayNumber={state.dayNumber}
        stageLabel={state.stageLabel}
        pulse={pulse}
      />

      {/* progress bar */}
      <div
        style={{
          height: 5,
          background: 'var(--bg-elevated)',
          borderRadius: 99,
          marginTop: 14,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${state.progress * 100}%`,
            background: state.bloom ? 'var(--success)' : REALITY_GOLD,
            borderRadius: 99,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--text-muted)',
          marginTop: 7,
        }}
      >
        <span>{state.totalCheckins} check-ins</span>
        <span>
          {state.cleanCount} on track · {state.slipCount} slips logged
        </span>
      </div>
      <div
        style={{
          textAlign: 'center',
          fontSize: 11.5,
          color: 'var(--text-muted)',
          marginTop: 6,
          letterSpacing: 0.2,
        }}
      >
        Began {shortDate(PROTOCOL_START_ISO)} → blooms ≈ {shortDate(finishIso())}
      </div>

      {/* standing principle — the change/inputs reframe (resonates) */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 14,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 13.5,
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
        }}
      >
        &ldquo;{INSANITY_QUOTE.text}&rdquo;
        <span
          style={{
            display: 'block',
            fontFamily: 'inherit',
            fontStyle: 'normal',
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 4,
          }}
        >
          — {INSANITY_QUOTE.attribution}
        </span>
      </div>

      {/* verse */}
      <div style={{ ...cardStyle, marginTop: 18 }}>
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: 16.5,
            lineHeight: 1.5,
            color: 'var(--text-primary)',
          }}
        >
          &ldquo;{verse.text}&rdquo;
        </div>
        <div style={{ fontSize: 12.5, color: REALITY_GOLD, marginTop: 10, letterSpacing: 0.4 }}>
          {verse.ref}
        </div>
      </div>

      {/* check-ins */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* morning */}
        {morningOpen || editingMorning ? (
          <div style={cardStyle}>
            <div
              style={{
                fontSize: 14.5,
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                marginBottom: 12,
              }}
            >
              {MORNING_QUESTION}
            </div>
            <input
              value={planText}
              onChange={e => setPlanText(e.target.value)}
              placeholder={MORNING_PLACEHOLDER}
              onKeyDown={e => {
                if (e.key === 'Enter') void doMorning();
              }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                fontSize: 14,
                outline: 'none',
                marginBottom: 10,
              }}
            />
            <div className="reality-night-actions" style={{ display: 'flex', gap: 10 }}>
              <button style={primaryBtn} onClick={() => void doMorning()} disabled={saving}>
                Save and take the verse
              </button>
              {editingMorning && (
                <button
                  style={neutralBtn}
                  onClick={() => {
                    setEditingMorning(false);
                    setPlanText('');
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : morningDone ? (
          <div style={doneBox}>
            <Check size={16} style={{ color: 'var(--success)' }} /> Morning check-in done
            <button
              style={changeLink}
              onClick={() => {
                setPlanText(dayRec.morning?.escapePlan ?? '');
                setEditingMorning(true);
              }}
            >
              Change
            </button>
          </div>
        ) : (
          <button style={primaryBtn} onClick={() => setMorningOpen(true)}>
            <Sunrise size={15} style={{ marginRight: 8, verticalAlign: '-2px' }} />
            Morning check-in
          </button>
        )}

        {/* night */}
        {nightOpen || editingNight ? (
          <div style={cardStyle}>
            {dayRec.morning?.escapePlan ? (
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                This morning you planned:{' '}
                <span style={{ color: 'var(--text-primary)' }}>{dayRec.morning.escapePlan}</span>
              </div>
            ) : null}
            <div className="reality-night-actions" style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ ...primaryBtn, background: 'var(--success)' }}
                onClick={() => void doNight(true)}
                disabled={saving}
              >
                Stayed on track
              </button>
              <button style={neutralBtn} onClick={() => void doNight(false)} disabled={saving}>
                I slipped
              </button>
            </div>
            {editingNight && (
              <button
                style={{ ...changeLink, marginTop: 12 }}
                onClick={() => setEditingNight(false)}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        ) : nightDone ? (
          <div style={doneBox}>
            <Check size={16} style={{ color: 'var(--success)' }} /> Night check-in done
            {dayRec.night?.stayedOnTrack === true
              ? ' · stayed on track'
              : dayRec.night?.stayedOnTrack === false
                ? ' · logged honestly'
                : ''}
            <button style={changeLink} onClick={() => setEditingNight(true)}>
              Change
            </button>
          </div>
        ) : (
          <button style={neutralBtn} onClick={() => setNightOpen(true)}>
            <Moon size={15} style={{ marginRight: 8, verticalAlign: '-2px' }} />
            Night check-in
          </button>
        )}
      </div>

      {/* mobile: stack the side-by-side action pairs on a narrow phone */}
      <style>{`
        @media (max-width: 420px) {
          .reality-night-actions { flex-direction: column; }
        }
      `}</style>

      {error && (
        <div style={{ fontSize: 12.5, color: 'var(--error)', marginTop: 10, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* slip reframe */}
      {slippedToday && (
        <div
          style={{
            marginTop: 14,
            padding: '14px 16px',
            borderRadius: 'var(--radius-lg)',
            background: 'color-mix(in srgb, var(--warning) 8%, var(--bg-card))',
            border: '1px solid color-mix(in srgb, var(--warning) 30%, var(--border-color))',
          }}
        >
          <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {SLIP_REFRAME}
          </div>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: 13.5,
              color: REALITY_GOLD,
              marginTop: 8,
            }}
          >
            &ldquo;A just man falleth seven times, and riseth up again.&rdquo; — Proverbs 24:16
          </div>
        </div>
      )}

      {/* the context — diagnosis, the loop, the plan. Open by default (it's the
          "everything you might need" depth); the daily check-in is above it, so
          this never slows the ritual. Collapse it once it's internalised. */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => setShowContext(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {showContext ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          The diagnosis, the loop &amp; the plan
        </button>
        {showContext && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* what this actually is */}
            <div style={{ ...cardStyle, borderLeft: '3px solid var(--accent-primary)' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-primary)',
                  marginBottom: 6,
                }}
              >
                What this actually is
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {DIAGNOSIS_REFRAME}
              </div>
            </div>

            {/* the loop (dynamic viz) */}
            <div style={cardStyle}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 10,
                }}
              >
                The loop you are breaking
              </div>
              <LoopViz />
            </div>

            {/* the four keystones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                }}
              >
                The four keystones
              </div>
              {KEYSTONES.map((k, i) => (
                <div key={i} style={cardStyle}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    {i + 1}. {k.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {k.body}
                  </div>
                </div>
              ))}
            </div>

            {/* when the urge comes — construction swaps */}
            <div style={cardStyle}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 4,
                }}
              >
                When the urge comes
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}
              >
                The next action is already chosen. Pre-decide one of these in the morning, so there
                is nothing to negotiate at 9pm.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CONSTRUCTION_SWAPS.map(s => (
                  <span
                    key={s}
                    style={{
                      fontSize: 12.5,
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 999,
                      padding: '5px 12px',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* the anti-goal */}
            <div style={{ ...cardStyle, borderLeft: '3px solid var(--text-muted)' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                The anti-goal
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {ANTI_GOAL}
              </div>
            </div>

            {/* what the evidence says */}
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
              {RESEARCH_NOTE}
            </div>
          </div>
        )}
      </div>

      {/* reset footer */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        {confirmReset ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Start over and clear all progress?{' '}
            <button
              onClick={() => void resetAll()}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--error)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Yes, reset
            </button>
            {'  ·  '}
            <button
              onClick={() => setConfirmReset(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
