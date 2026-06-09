'use client';

/**
 * VohraHxcPmfTile — load-bearing Phase 1 graduation gate meter on the
 * StartHereTab landing surface.
 *
 * Item locked 2026-05-07. Per the 2026-05-07 nightly audit Section 2:
 * the /api/founder-hub/metrics endpoint shipped 2026-05-04 with full
 * Vohra HXC PMF data + the 40% graduation gate / kill-threshold
 * machinery, but no permanent meter on the landing surface a founder
 * sees first. Without a visible meter, founder ships toward the wrong
 * target.
 *
 * Tile shape:
 *   - Hero metric: "very disappointed" % vs 40% graduation gate.
 *   - Sample size + pending surveys + days since last response.
 *   - Status pill — GATE PASSED (≥40%), ON TRACK (30-39%), KILL
 *     THRESHOLD (<30% with N≥5), TOO EARLY (N<5).
 *   - Click-through to the full Metrics tab for the per-persona
 *     breakdown + the rest of the Phase 1 dashboard.
 *
 * Mounted right after the hero on StartHereTab — between the hero
 * eyebrow and the Current Positioning Anchor card — so it's the first
 * fact a founder reads each morning.
 */

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { getHighestPriorityUpcomingEvent, daysUntil, hasEventEnded } from '@/lib/data/event-prep';

interface PmfPayload {
  veryDisappointedPct: number;
  sampleSize: number;
  pendingSurveys: number;
  completedSurveys: number;
  graduationGatePassed: boolean;
  killThresholdHit: boolean;
  graduationThreshold: number;
  killThreshold: number;
  /** N-floor: BOTH gates stay dark until sampleSize >= this (M-2).
   *  Derived server-side from VOHRA_PMF_KILL_MIN_N — never hardcode
   *  the floor in this client tile. */
  killMinN: number;
  daysSinceLastSurveyResponse: number | null;
}

interface MetricsEnvelope {
  data?: { pmf?: PmfPayload };
}

interface Props {
  onNavigateToMetrics: () => void;
}

type StatusKey = 'gate_passed' | 'on_track' | 'kill_threshold' | 'too_early' | 'unknown';

interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
  body: string;
}

function deriveStatus(pmf: PmfPayload): StatusKey {
  const minSampleForGate = 5;
  if (pmf.sampleSize < minSampleForGate) return 'too_early';
  if (pmf.graduationGatePassed) return 'gate_passed';
  if (pmf.killThresholdHit) return 'kill_threshold';
  return 'on_track';
}

function statusMeta(key: StatusKey, pmf: PmfPayload | null): StatusMeta {
  switch (key) {
    case 'gate_passed':
      return {
        label: 'Graduation gate passed',
        color: 'var(--success)',
        bg: 'color-mix(in srgb, var(--success) 10%, transparent)',
        border: 'color-mix(in srgb, var(--success) 35%, var(--border-color))',
        body: `≥${pmf?.graduationThreshold ?? 40}% of HXC users said "very disappointed". Phase 1 → Phase 2 transition signal is GREEN. Begin Sankore-class engagement scoping with confidence.`,
      };
    case 'on_track':
      return {
        label: 'On track to graduation',
        color: 'var(--info)',
        bg: 'color-mix(in srgb, var(--info) 10%, transparent)',
        border: 'color-mix(in srgb, var(--info) 35%, var(--border-color))',
        body: `Trending toward the ${pmf?.graduationThreshold ?? 40}% Vohra HXC gate without breaching the ${pmf?.killThreshold ?? 30}% kill threshold. Keep the wedge motion running unchanged.`,
      };
    case 'kill_threshold':
      return {
        label: 'Kill threshold hit',
        color: 'var(--error)',
        bg: 'color-mix(in srgb, var(--error) 10%, transparent)',
        border: 'color-mix(in srgb, var(--error) 35%, var(--border-color))',
        body: `Below ${pmf?.killThreshold ?? 30}% Vohra HXC. Per GTM v3.5 kill criterion: HALT scaling. Run a product-discovery sprint with the somewhat-disappointed + not-disappointed cohorts before pushing harder on the same motion.`,
      };
    case 'too_early':
      return {
        label: 'Too early — building sample',
        color: 'var(--warning)',
        bg: 'color-mix(in srgb, var(--warning) 10%, transparent)',
        border: 'color-mix(in srgb, var(--warning) 35%, var(--border-color))',
        body: 'Need N≥5 HXC respondents before the graduation gate fires meaningfully. Every paid Individual sign-up auto-triggers the survey on day 14.',
      };
    case 'unknown':
    default:
      return {
        label: 'Awaiting data',
        color: 'var(--text-muted)',
        bg: 'var(--bg-tertiary)',
        border: 'var(--border-color)',
        body: 'Vohra HXC survey data unavailable. Confirm /api/founder-hub/metrics is reachable; endpoint shipped 2026-05-04.',
      };
  }
}

export function VohraHxcPmfTile({ onNavigateToMetrics }: Props) {
  const [pmf, setPmf] = useState<PmfPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Capture "now" once at mount (react-hooks/purity — Date.now() is
  // impure during render). Hook is unconditional, before the loading
  // early-return, per rules-of-hooks. Minute precision is plenty for a
  // survey-window / event-countdown reminder that doesn't tick.
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/founder-hub/metrics', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as MetricsEnvelope;
        if (!cancelled && json.data?.pmf) setPmf(json.data.pmf);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'fetch failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Loading skeleton — keep the hero shape stable so the StartHereTab
  // layout doesn't jolt when the data arrives.
  if (loading) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '18px 20px',
          marginBottom: 16,
          minHeight: 132,
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-muted)',
          fontSize: 12,
        }}
      >
        Loading Phase 1 graduation gate…
      </div>
    );
  }

  const statusKey: StatusKey = pmf ? deriveStatus(pmf) : 'unknown';
  const meta = statusMeta(statusKey, pmf);
  const StatusIcon =
    statusKey === 'gate_passed'
      ? CheckCircle2
      : statusKey === 'kill_threshold'
        ? AlertTriangle
        : Activity;

  // Width of the progress bar in % toward the 40% gate.
  const progressPct = pmf
    ? Math.min(100, Math.max(0, (pmf.veryDisappointedPct / pmf.graduationThreshold) * 100))
    : 0;

  // Survey-window reminder (audit §5.4 / Tip 2). BOTH gates stay dark
  // until sampleSize >= killMinN; surface that as an actionable nudge
  // tied to the next highest-priority event so the founder sends the
  // survey BEFORE walking into investor conversations there. When the
  // gate is live (sampleSize >= killMinN) the status pill already
  // carries graduation/kill — no reminder noise.
  const needed = pmf ? Math.max(0, pmf.killMinN - pmf.sampleSize) : 0;
  const surveyWindow = (() => {
    if (!pmf || needed <= 0) return null;
    const today = new Date(nowMs);
    const event = getHighestPriorityUpcomingEvent(today);
    const daysToEvent = event ? daysUntil(event, today) : null;
    // Stay anchored to the event THROUGH its run (endDate), not just until its
    // start — otherwise the reminder de-anchors on day 2 of a live multi-day
    // event, dropping the "investors there will ask" urgency on the day it
    // matters most.
    const eventAnchored =
      event != null && daysToEvent != null && !hasEventEnded(event, today) && daysToEvent <= 45;
    const accent = eventAnchored
      ? daysToEvent != null && daysToEvent <= 14
        ? 'var(--error)'
        : 'var(--warning)'
      : 'var(--info)';
    const s = needed === 1 ? '' : 's';
    const pendingClause =
      pmf.pendingSurveys > 0
        ? ` ${pmf.pendingSurveys} survey${pmf.pendingSurveys === 1 ? '' : 's'} already outstanding.`
        : '';
    const body =
      eventAnchored && event && daysToEvent != null
        ? `Graduation gate is dark — n = ${pmf.sampleSize} / ${pmf.killMinN}. ${event.name} is ${daysToEvent > 0 ? `T-${daysToEvent}d` : 'happening now'}; investors and warm intros there will ask whether you have PMF signal. ${needed} more HXC "very disappointed" response${s} unlocks the gate.${pendingClause} Send the Vohra survey to every HXC customer 30+ days in before the event.`
        : `Graduation gate needs n ≥ ${pmf.killMinN} HXC responses (currently ${pmf.sampleSize}). ${needed} more unlock${needed === 1 ? 's' : ''} the gate.${pendingClause}${
            pmf.daysSinceLastSurveyResponse != null && pmf.daysSinceLastSurveyResponse > 14
              ? ` Last response was ${pmf.daysSinceLastSurveyResponse}d ago — cadence is slipping.`
              : ' Keep the survey cadence going.'
          }`;
    return { accent, body };
  })();

  return (
    <section
      aria-labelledby="vohra-pmf-tile-heading"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${meta.color}`,
        borderRadius: 'var(--radius-md, 8px)',
        padding: '18px 20px',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 220px) 1fr',
          gap: 22,
          alignItems: 'flex-start',
        }}
        className="vohra-pmf-tile-grid"
      >
        {/* Hero metric */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: meta.color,
              background: meta.bg,
              border: `1px solid ${meta.border}`,
              padding: '3px 9px',
              borderRadius: 999,
              marginBottom: 10,
            }}
          >
            <StatusIcon size={11} strokeWidth={2.5} aria-hidden />
            {meta.label}
          </div>
          <div
            style={{
              fontSize: 'clamp(40px, 5vw, 56px)',
              fontWeight: 800,
              lineHeight: 1,
              color: meta.color,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              marginBottom: 4,
            }}
          >
            {pmf ? `${Math.round(pmf.veryDisappointedPct)}%` : '—'}
          </div>
          <h3
            id="vohra-pmf-tile-heading"
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Vohra HXC · &ldquo;very disappointed&rdquo;
          </h3>
        </div>

        {/* Status body + progress bar + supporting stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.55,
              color: 'var(--text-primary)',
            }}
          >
            {error
              ? `Could not load metrics: ${error}. Check /api/founder-hub/metrics.`
              : meta.body}
          </p>

          {pmf && pmf.sampleSize >= 1 && (
            <>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  <span>Progress to {pmf.graduationThreshold}% gate</span>
                  <span>
                    {pmf.killThreshold}% kill ↓ · {pmf.graduationThreshold}% gate ↑
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 999,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: `${progressPct}%`,
                      height: '100%',
                      background: meta.color,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 14,
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                }}
              >
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>n = {pmf.sampleSize}</strong> HXC
                  responses
                </span>
                {pmf.pendingSurveys > 0 && (
                  <span>
                    <strong style={{ color: 'var(--text-primary)' }}>{pmf.pendingSurveys}</strong>{' '}
                    pending
                  </span>
                )}
                {pmf.daysSinceLastSurveyResponse !== null && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} strokeWidth={2} aria-hidden />
                    {pmf.daysSinceLastSurveyResponse === 0
                      ? 'Last response today'
                      : pmf.daysSinceLastSurveyResponse === 1
                        ? 'Last response yesterday'
                        : `Last response ${pmf.daysSinceLastSurveyResponse}d ago`}
                  </span>
                )}
              </div>
            </>
          )}

          {surveyWindow && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                padding: '9px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${surveyWindow.accent}`,
                borderRadius: 'var(--radius-sm, 6px)',
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--text-secondary)',
              }}
            >
              <AlertTriangle
                size={13}
                strokeWidth={2}
                aria-hidden
                style={{ flexShrink: 0, marginTop: 2, color: surveyWindow.accent }}
              />
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>Survey window:</strong>{' '}
                {surveyWindow.body}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onNavigateToMetrics}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '7px 12px',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm, 6px)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'opacity 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.92';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = '';
            }}
          >
            Open the full Phase 1 dashboard
            <ChevronRight size={13} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>

      {/* Mobile collapse — single-column below 720px */}
      <style>{`
        @media (max-width: 720px) {
          .vohra-pmf-tile-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  );
}
