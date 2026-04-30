'use client';

/**
 * StartHereTab — dynamic Founder Hub landing page (rebuilt 2026-04-28).
 *
 * Replaces the prior 4-session 2-day study plan with an interactive
 * map of every tab + 5 journey overlays so the founder picks the
 * sequence that matches what they're actually doing right now (pitch
 * prep, market research, outreach execution, post-close reflection,
 * product deep-dive).
 *
 * Persistence: re-uses `di-study-plan-progress-v1` so any progress the
 * founder accumulated under the old 2-day plan carries over as
 * "visited" markers on the map. The active journey is persisted under
 * `di-start-here-journey` so coming back to the tab restores context.
 *
 * The Current Positioning Anchor card stays on top — it's the
 * canonical reference for the locked vocabulary (icp.ts constants
 * locked in C1 the same week) and the 17-framework count derives from
 * the canonical compliance registry per the count-derivation
 * discipline.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';
import {
  CheckCircle2,
  Sparkles,
  Compass,
  ArrowRight,
  Activity,
} from 'lucide-react';
import {
  POSITIONING_HERO_PRIMARY,
  POSITIONING_HERO_SECONDARY,
  IP_MOAT_NAME,
  IP_MOAT_DESCRIPTION,
  SPECIMEN_LIBRARY_DESCRIPTION,
  COMPLIANCE_MOAT_REGIONS,
  ICP_AUDIENCE_SUMMARY,
  BANNED_VOCABULARY,
  COLD_CONTEXT_ONRAMPS,
} from '@/lib/constants/icp';
import {
  PLATFORM_BASELINE_SNAPSHOT,
  PLATFORM_BASELINE_SNAPSHOT_COMPUTED_AT,
} from '@/lib/learning/platform-baseline-snapshot';
import { FounderHubMap } from './start-here/FounderHubMap';
import { JourneySelector } from './start-here/JourneySelector';
import { JourneyDetailStrip } from './start-here/JourneyDetailStrip';
import { JOURNEYS, NODES, type Journey, type TabId } from './start-here/founder-hub-map-data';

// Persistence keys — visited reuses the prior 2-day-plan key so progress
// carries; journey is new for the rebuild.
const VISITED_KEY = 'di-study-plan-progress-v1';
const JOURNEY_KEY = 'di-start-here-journey';

interface VisitedShape {
  completedTabs?: string[];
}

function loadVisited(): Set<TabId> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(VISITED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as VisitedShape;
    const arr = Array.isArray(parsed.completedTabs) ? parsed.completedTabs : [];
    return new Set(arr.filter(t => NODES.some(n => n.id === t)) as TabId[]);
  } catch {
    // localStorage / JSON.parse may throw — silent fallback per CLAUDE.md fire-and-forget exceptions.
    return new Set();
  }
}

function saveVisited(set: Set<TabId>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      VISITED_KEY,
      JSON.stringify({ completedTabs: Array.from(set) } satisfies VisitedShape)
    );
  } catch {
    // localStorage may throw on quota / private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
  }
}

function loadJourney(): Journey | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    if (!raw) return null;
    return JOURNEYS.find(j => j.id === raw) ?? null;
  } catch {
    // localStorage may throw — silent fallback per CLAUDE.md fire-and-forget exceptions.
    return null;
  }
}

function saveJourney(journey: Journey | null) {
  if (typeof window === 'undefined') return;
  try {
    if (journey) localStorage.setItem(JOURNEY_KEY, journey.id);
    else localStorage.removeItem(JOURNEY_KEY);
  } catch {
    // localStorage may throw — silent fallback per CLAUDE.md fire-and-forget exceptions.
  }
}

interface Props {
  onNavigateToTab: (tabId: string) => void;
}

export function StartHereTab({ onNavigateToTab }: Props) {
  const [visited, setVisited] = useState<Set<TabId>>(new Set());
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate persistence once after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount
    setVisited(loadVisited());
    setActiveJourney(loadJourney());
    setHydrated(true);
  }, []);

  const handleNavigate = useCallback(
    (tabId: TabId) => {
      // Visiting a tab marks it visited automatically (the same posture the
      // 2-day plan had — clicking through the tab counted as "done").
      setVisited(prev => {
        if (prev.has(tabId)) return prev;
        const next = new Set(prev);
        next.add(tabId);
        saveVisited(next);
        return next;
      });
      onNavigateToTab(tabId);
    },
    [onNavigateToTab]
  );

  const handleToggleVisited = useCallback((tabId: TabId) => {
    setVisited(prev => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      saveVisited(next);
      return next;
    });
  }, []);

  const handleSelectJourney = useCallback((journey: Journey | null) => {
    setActiveJourney(journey);
    saveJourney(journey);
  }, []);

  const handleResetVisited = useCallback(() => {
    setVisited(new Set());
    saveVisited(new Set());
  }, []);

  // Adaptive quick-jump cards — surface unvisited tabs the founder
  // might want to start with. Uses the active journey's path when
  // available, else falls back to the highest-payoff unvisited nodes
  // from the Start + Go-to-Market clusters.
  const quickJumps = useMemo(() => {
    if (!hydrated) return [];
    const candidates: TabId[] = activeJourney
      ? activeJourney.path
      : [
          'unicorn_roadmap',
          'path_to_100m',
          'overview',
          'category_position',
          'positioning',
          'outreach_hub',
        ];
    const unvisited = candidates.filter(id => !visited.has(id));
    return unvisited
      .slice(0, 4)
      .map(id => NODES.find(n => n.id === id))
      .filter(Boolean) as Array<(typeof NODES)[number]>;
  }, [activeJourney, visited, hydrated]);

  return (
    <div>
      {renderHero()}
      {renderPositioningAnchor()}
      {renderCalibrationCard(onNavigateToTab)}

      <JourneySelector active={activeJourney} onSelect={handleSelectJourney} />

      <FounderHubMap
        activeJourney={activeJourney}
        visited={visited}
        onNavigate={handleNavigate}
        onToggleVisited={handleToggleVisited}
      />

      {activeJourney && (
        <JourneyDetailStrip journey={activeJourney} visited={visited} onNavigate={handleNavigate} />
      )}

      {quickJumps.length > 0 && (
        <div style={quickJumpsWrap}>
          <div style={quickJumpsHeader}>
            <Sparkles size={14} color="var(--accent-primary)" />
            <span style={quickJumpsEyebrow}>
              {activeJourney
                ? `Next four steps in ${activeJourney.label.toLowerCase()}`
                : 'Quick jumps you have not explored yet'}
            </span>
            {visited.size > 0 && (
              <button type="button" onClick={handleResetVisited} style={resetVisitedBtn}>
                Reset progress
              </button>
            )}
          </div>
          <div style={quickJumpsGrid}>
            {quickJumps.map(node => (
              <button
                key={node.id}
                type="button"
                onClick={() => handleNavigate(node.id)}
                style={quickJumpCard}
              >
                <div style={quickJumpLabel}>{node.label}</div>
                <div style={quickJumpBody}>{node.payoff}</div>
                <div style={quickJumpFoot}>
                  Open <ArrowRight size={11} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty-state: founder has visited everything. Still useful to
          show the "switch journey" call so they keep using the map
          rather than treating it as a checklist. */}
      {hydrated && visited.size === NODES.length && (
        <div style={emptyAllVisited}>
          <CheckCircle2 size={18} color="var(--success)" />
          <div>
            <strong>Every tab explored.</strong> Pick a different journey above to revisit the
            sequence in a new context, or browse freely with all connections lit.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────

function renderHero() {
  return (
    <div style={heroStyle}>
      <div style={heroEyebrow}>Start Here</div>
      <h2 style={heroTitle}>The Founder Hub, on one map.</h2>
      <p style={heroSubtitle}>
        Every tab. Every connection. Pick what you&rsquo;re doing right now and the map highlights
        the recommended sequence — pitch prep, market research, outreach execution, reflection on a
        close, or a technical dive into the product. Click any node to jump straight in.
      </p>
    </div>
  );
}

// ─── Current positioning anchor (preserved from prior tab) ──────────

function renderPositioningAnchor() {
  return (
    <div style={anchorStyle}>
      <div style={anchorEyebrow}>
        <Compass size={11} /> Current positioning anchor — locked 2026-04-26
      </div>
      <div style={anchorRow}>
        <strong>Primary hero:</strong> &ldquo;{POSITIONING_HERO_PRIMARY}&rdquo;
      </div>
      <div style={anchorRow}>
        <strong>Secondary (regulatory):</strong> &ldquo;{POSITIONING_HERO_SECONDARY}&rdquo;
      </div>
      <div style={anchorRow}>
        <strong>IP moat:</strong> {IP_MOAT_NAME} — {IP_MOAT_DESCRIPTION}
      </div>
      <div style={anchorRow}>
        <strong>Specimen library:</strong> {SPECIMEN_LIBRARY_DESCRIPTION}
      </div>
      <div style={anchorRow}>
        <strong>Compliance moat:</strong> {getAllRegisteredFrameworks().length} frameworks across{' '}
        {COMPLIANCE_MOAT_REGIONS}.
      </div>
      <div style={anchorRow}>
        <strong>Audience:</strong> {ICP_AUDIENCE_SUMMARY}
      </div>
      <div style={anchorRow}>
        <strong>R²F operationalisation (locked 2026-04-30):</strong> 22-bias taxonomy (DI-B-001
        through DI-B-022) · DQI methodology v2.1.0 with validity-aware structural weight shift ·
        six paper-anchored signals on every DPR cover (Validity Classification → Org Calibration →
        Feedback Adequacy → Reference Class Forecast → Counterfactual Impact → Recommended Action).
        Academic anchors: Kahneman & Klein 2009, Kahneman & Lovallo 2003 HBR, Klein & Mitchell
        1995. Paper-application sprint: 6 of 10 ranked items shipped.
      </div>
      <div style={anchorBanned}>
        <strong>Banned:</strong>{' '}
        {BANNED_VOCABULARY.map((b, i) => (
          <span key={b.phrase}>
            &ldquo;{b.phrase}&rdquo; ({b.reason}){i < BANNED_VOCABULARY.length - 1 ? ', ' : '.'}
          </span>
        ))}{' '}
        Cold-context on-ramps:{' '}
        {COLD_CONTEXT_ONRAMPS.map((onramp, i) => (
          <span key={onramp}>
            &ldquo;{onramp}&rdquo;{i < COLD_CONTEXT_ONRAMPS.length - 1 ? ', ' : ''}
          </span>
        ))}{' '}
        — descriptive, no academic borrowing.
      </div>
    </div>
  );
}

// ─── Platform calibration anchor (F1 lock 2026-04-29) ──────────────
//
// Surfaces the seed Brier baseline so the founder sees the deck-grade
// answer to "show me your outcome calibration" the moment they land on
// the founder hub. Numbers come from PLATFORM_BASELINE_SNAPSHOT — the
// same bundle-safe literals that power the landing-page credibility
// strip; drift between snapshot and live function is caught by
// platform-baseline-snapshot.test.ts.
//
// Click jumps to the InvestorMetricsTracker (rank 17, "Platform
// Calibration Credibility") inside Path to $100M ARR for the full
// metric card.

function renderCalibrationCard(onNavigateToTab: (tabId: string) => void) {
  const baseline = PLATFORM_BASELINE_SNAPSHOT;
  const accuracyPct = Math.round(baseline.classificationAccuracy * 100);
  return (
    <div style={calibrationCardStyle}>
      <div style={calibrationEyebrow}>
        <Activity size={11} /> Platform calibration · investor anchor — F1 lock 2026-04-29
      </div>
      <div className="calibration-card-grid" style={calibrationGrid}>
        <div style={calibrationStat}>
          <div style={calibrationValue}>{baseline.meanBrier.toFixed(3)}</div>
          <div style={calibrationLabel}>Mean Brier ({baseline.meanCategory})</div>
        </div>
        <div style={calibrationStat}>
          <div style={calibrationValue}>{accuracyPct}%</div>
          <div style={calibrationLabel}>
            Classification accuracy · DQI 55 cutoff · {baseline.classificationCounts.correct}/
            {baseline.classificationCounts.scored}
          </div>
        </div>
        <div style={calibrationStat}>
          <div style={calibrationValue}>{baseline.n}</div>
          <div style={calibrationLabel}>Audited corporate decisions</div>
        </div>
      </div>
      <div style={calibrationContext}>
        Seed methodology · published DQI weights applied without hindsight to the case-study
        library. Tetlock superforecasters score Brier ~0.13; CIA analysts ~0.23. Per-org Brier
        replaces this seed once a customer org has ≥1 closed outcome (Outcome Gate Phase 1+2+3
        already enforce the workflow). Snapshot regenerated {PLATFORM_BASELINE_SNAPSHOT_COMPUTED_AT}.
      </div>
      <button
        type="button"
        onClick={() => onNavigateToTab('path_to_100m')}
        style={calibrationCta}
      >
        Open Path to $100M ARR · Investor Metrics Tracker <ArrowRight size={11} />
      </button>
      <style>{`
        @media (max-width: 700px) {
          .calibration-card-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const heroStyle: React.CSSProperties = {
  padding: 18,
  background: 'linear-gradient(135deg, rgba(22,163,74,0.10), rgba(14,165,233,0.06))',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  marginBottom: 14,
};

const heroEyebrow: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#16A34A',
  marginBottom: 6,
};

const heroTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: 'var(--text-primary)',
  margin: 0,
  lineHeight: 1.2,
  letterSpacing: '-0.01em',
};

const heroSubtitle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  marginTop: 8,
  marginBottom: 0,
  lineHeight: 1.6,
  maxWidth: 720,
};

const anchorStyle: React.CSSProperties = {
  marginBottom: 14,
  padding: 12,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderLeft: '3px solid #16A34A',
  borderRadius: 'var(--radius-md)',
  fontSize: 12,
  lineHeight: 1.55,
  color: 'var(--text-primary)',
};

const anchorEyebrow: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#16A34A',
  marginBottom: 6,
};

const anchorRow: React.CSSProperties = {
  marginBottom: 4,
};

const anchorBanned: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 11,
  marginTop: 8,
};

const calibrationCardStyle: React.CSSProperties = {
  marginBottom: 14,
  padding: 14,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderLeft: '3px solid rgb(79, 70, 229)',
  borderRadius: 'var(--radius-md)',
  fontSize: 12,
  color: 'var(--text-primary)',
};

const calibrationEyebrow: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'rgb(79, 70, 229)',
  marginBottom: 10,
};

const calibrationGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
  marginBottom: 10,
};

const calibrationStat: React.CSSProperties = {
  padding: '8px 10px',
  background: 'rgba(99, 102, 241, 0.05)',
  border: '1px solid rgba(99, 102, 241, 0.18)',
  borderRadius: 'var(--radius-sm)',
};

const calibrationValue: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: 'var(--text-primary)',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.01em',
  lineHeight: 1.05,
  marginBottom: 4,
};

const calibrationLabel: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--text-muted)',
  lineHeight: 1.35,
};

const calibrationContext: React.CSSProperties = {
  fontSize: 11.5,
  color: 'var(--text-secondary)',
  lineHeight: 1.55,
  marginBottom: 10,
};

const calibrationCta: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  fontSize: 11.5,
  fontWeight: 600,
  background: 'rgba(99, 102, 241, 0.06)',
  border: '1px solid rgba(99, 102, 241, 0.30)',
  borderRadius: 'var(--radius-sm)',
  color: 'rgb(79, 70, 229)',
  cursor: 'pointer',
};

const quickJumpsWrap: React.CSSProperties = {
  marginTop: 14,
};

const quickJumpsHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
};

const quickJumpsEyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--accent-primary)',
};

const resetVisitedBtn: React.CSSProperties = {
  marginLeft: 'auto',
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  background: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
};

const quickJumpsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 8,
};

const quickJumpCard: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 14px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderLeft: '3px solid var(--accent-primary)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  transition: 'border-color 0.2s, transform 0.15s',
};

const quickJumpLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const quickJumpBody: React.CSSProperties = {
  fontSize: 11.5,
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
};

const quickJumpFoot: React.CSSProperties = {
  marginTop: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--accent-primary)',
};

const emptyAllVisited: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  background: 'rgba(34, 197, 94, 0.06)',
  border: '1px solid rgba(34, 197, 94, 0.2)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 13,
  color: 'var(--text-primary)',
};
