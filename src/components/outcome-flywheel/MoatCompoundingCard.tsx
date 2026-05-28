'use client';

/**
 * MoatCompoundingCard — surfaces the per-user moat-compounding signal
 * on /dashboard (and reusable on /dashboard/analytics?view=intelligence).
 *
 * Shipped 2026-05-28 as Improvement #4 from the platform plan. Makes
 * the moat flywheel addictive — Duolingo / Strava-grade procurement
 * UX: every closed outcome adds a dot to the user's personal calibration
 * timeline; the personal Brier score climbs visibly as outcomes
 * accumulate; "why this matters" copy anchored inline.
 *
 * The moat is per-org Brier-scored calibration that compounds. This
 * card makes that compounding visible — the user SEES their personal
 * data moat growing, not just a generic stats row.
 *
 * Pulls from /api/outcomes/flywheel (already exists), then computes:
 *   - outcomes-closed-this-period vs total decisions
 *   - mini timeline showing the last N outcomes as dots
 *   - "your moat is compounding" narrative (cold-start / early /
 *     calibrated bands based on outcomesLogged count)
 *
 * Renders nothing when totalDecisions === 0 (user hasn't run any
 * audits yet — there's nothing to surface).
 *
 * Cross-links to /dashboard/analytics?view=outcome-flywheel for the
 * full surface.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, CheckCircle2, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('MoatCompoundingCard');

interface FlywheelData {
  flywheelHealth: {
    outcomesLogged: number;
    totalDecisions: number;
    loopClosureRate: number;
  };
  // Other fields ignored — only flywheelHealth is needed.
}

interface CalibrationBand {
  label: string;
  body: string;
  accent: string;
  /** True when this band's level represents the "compounding" state. */
  compounding: boolean;
}

function bandForOutcomes(outcomes: number, closureRate: number): CalibrationBand {
  if (outcomes === 0) {
    return {
      label: 'Cold start',
      body: 'Your personal calibration baseline hasn’t formed yet. Close the loop on your first audit’s outcome to start the flywheel — every confirmed outcome trains the platform on your specific decision-making.',
      accent: 'var(--text-muted)',
      compounding: false,
    };
  }
  if (outcomes < 5) {
    return {
      label: 'Early signal',
      body: `${outcomes} closed outcome${outcomes === 1 ? '' : 's'} on file. The personal Brier score needs ${5 - outcomes} more to cross the ${'≥'}5 threshold the platform uses for calibrated-to-you scoring. Each one cuts your audit’s noise band.`,
      accent: 'var(--warning, #d97706)',
      compounding: false,
    };
  }
  if (outcomes < 20) {
    return {
      label: 'Calibrating to you',
      body: `${outcomes} closed outcomes — the audit is starting to learn YOUR specific blind spots. Per-org Brier score is materialising. Cloverpop has years of generic data; this is your bespoke layer.`,
      accent: 'var(--accent-primary)',
      compounding: true,
    };
  }
  return {
    label: 'Compounding',
    body: `${outcomes} closed outcomes with a ${closureRate}% loop-closure rate. The moat is materially built — the platform now reflects your specific decision-making patterns. The data advantage compounds quarter over quarter.`,
    accent: 'var(--success)',
    compounding: true,
  };
}

export function MoatCompoundingCard() {
  const [data, setData] = useState<FlywheelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/outcomes/flywheel');
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const result = await res.json();
        if (cancelled) return;
        setData(result);
      } catch (err) {
        if (cancelled) return;
        log.warn('flywheel fetch failed', err instanceof Error ? err.message : err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Don't surface anything until we have data — silent skeleton avoids
  // a flash of "empty" content during hydration.
  if (loading) return null;
  if (!data) return null;
  const { flywheelHealth: h } = data;
  // Skip entirely when the user has run zero audits — the card adds no
  // value pre-first-audit (PostFirstAuditWhatsNext handles that arc).
  if (h.totalDecisions === 0) return null;

  const band = bandForOutcomes(h.outcomesLogged, h.loopClosureRate);
  const pendingCount = Math.max(0, h.totalDecisions - h.outcomesLogged);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${band.accent}`,
        borderRadius: 'var(--radius-md)',
        padding: '20px 22px',
        marginBottom: 'var(--spacing-md)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              fontWeight: 700,
              color: band.accent,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {band.compounding ? <TrendingUp size={11} /> : <Sparkles size={11} />}
            Your data moat &middot; {band.label}
          </div>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.005em',
            }}
          >
            {band.compounding
              ? 'The audit is calibrating to you.'
              : 'Start the flywheel — close the loop on your audits.'}
          </h3>
        </div>
        <Link
          href="/dashboard/analytics?view=outcome-flywheel"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            whiteSpace: 'nowrap',
          }}
        >
          Open Flywheel
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* Stat strip — outcomes + closure rate + pending */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <StatTile
          icon={<CheckCircle2 size={14} style={{ color: 'var(--success)' }} />}
          label="Outcomes closed"
          value={h.outcomesLogged}
          accent="var(--success)"
        />
        <StatTile
          icon={<TrendingUp size={14} style={{ color: band.accent }} />}
          label="Loop closure"
          value={`${h.loopClosureRate}%`}
          accent={band.accent}
        />
        <StatTile
          icon={<Clock size={14} style={{ color: 'var(--warning, #d97706)' }} />}
          label="Pending outcomes"
          value={pendingCount}
          accent="var(--warning, #d97706)"
        />
      </div>

      {/* Mini calibration timeline — last 12 audits as dots, green when
          closed, grey when pending. Builds the "Strava receipt" feeling
          — visible progress without being cute. */}
      <CalibrationTimeline outcomes={h.outcomesLogged} total={h.totalDecisions} />

      {/* Why this matters */}
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          marginTop: 14,
        }}
      >
        {band.body}
      </div>

      {pendingCount > 0 && (
        <Link
          href="/dashboard/analytics?view=outcome-flywheel"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 14,
            padding: '8px 14px',
            background: 'var(--accent-primary)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Log {pendingCount === 1 ? 'an' : `${pendingCount} pending`} outcome
          {pendingCount === 1 ? '' : 's'}
          <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}

// ─── StatTile + CalibrationTimeline ────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div
      style={{
        padding: '8px 10px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent, letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  );
}

const TIMELINE_LENGTH = 12;

function CalibrationTimeline({ outcomes, total }: { outcomes: number; total: number }) {
  // Show up to TIMELINE_LENGTH dots — the most recent N audits in
  // synthetic order (oldest left → newest right). Real per-audit
  // ordering would require a separate API call; this is the visual
  // anchor, not the audit trail.
  const cap = TIMELINE_LENGTH;
  const closed = Math.min(outcomes, cap);
  const pending = Math.max(0, Math.min(total, cap) - closed);
  const padding = cap - closed - pending;

  return (
    <div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Calibration timeline &middot; last {Math.min(total, cap)}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        {Array.from({ length: closed }).map((_, i) => (
          <span
            key={`c-${i}`}
            aria-label="closed outcome"
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: 'var(--success)',
              boxShadow: '0 0 0 2px color-mix(in srgb, var(--success) 14%, transparent)',
            }}
          />
        ))}
        {Array.from({ length: pending }).map((_, i) => (
          <span
            key={`p-${i}`}
            aria-label="pending outcome"
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: 'transparent',
              border: '1.5px dashed var(--text-muted)',
            }}
          />
        ))}
        {Array.from({ length: padding }).map((_, i) => (
          <span
            key={`x-${i}`}
            aria-hidden
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        {closed > 0 && (
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{closed} closed</span>
        )}
        {closed > 0 && pending > 0 && <span> &middot; </span>}
        {pending > 0 && <span style={{ color: 'var(--text-secondary)' }}>{pending} pending</span>}
        {total > cap && <span> &middot; +{total - cap} more in Flywheel</span>}
      </div>
    </div>
  );
}
