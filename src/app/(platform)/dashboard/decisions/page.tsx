'use client';

/**
 * /dashboard/decisions — unified decisions surface (Phase 2 lock + Phase
 * G fold 2026-05-10 + portfolio above-fold refactor 2026-05-11).
 *
 * Three views accessible from one parent page:
 *
 *   - Kanban (default): workflow-grade containers (investment /
 *     acquisition / strategic) — daily-ops triage board.
 *   - Log: chronological feed of journal entries + cognitive audits
 *     (Phase G fold 2026-05-10 from the deleted /dashboard/decision-log
 *     standalone route).
 *   - Passed on: Anti-Portfolio per Bessemer model — decisions you
 *     passed on, with eventual outcome attribution.
 *
 * Above-fold cluster (2026-05-11 refactor — translates the doc-detail
 * verdict pattern from a single artefact to the PORTFOLIO):
 *
 *   1. PortfolioVerdictBand — status pill (Audit-ready / Needs
 *      attention / Time-sensitive / Revise before committee) derived
 *      from worst grade × high-severity conflicts × nearest committee
 *      gate, plus 3 stat tiles (active decisions / docs audited / next
 *      gate) and a monospace methodology + freshness metadata strip.
 *   2. PortfolioSignalTiles — top 3 portfolio signals worth acting on
 *      (highest-risk decision · next committee gate · most cross-doc
 *      conflicts). Each tile deep-links to /decisions/[id].
 *   3. NextMoveContainer — paper-grounded recommendation engine. Now
 *      the canonical Intelligent Antagonist surface (the constellation
 *      SVG that previously held that role was retired 2026-05-11).
 *
 * Persona-aware kanban defaults via useOnboardingRole: small-fund GP /
 * fractional CSO → investment; mid-market corp dev → acquisition;
 * PE-backed founder / bizops → strategic; other → all modes.
 */

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Filter, Layout, BookOpen, BrainCircuit, XCircle } from 'lucide-react';
import { useContainers, defaultContainerKindForRole } from '@/hooks/useContainers';
import { useOnboardingRole } from '@/hooks/useOnboardingRole';
import {
  CONTAINER_KINDS,
  CONTAINER_MODES,
  type DecisionContainerKind,
} from '@/lib/data/decision-container-modes';
import { ContainerKanban } from '@/components/containers/ContainerKanban';
import {
  DecisionLogFeed,
  type DecisionLogFeedHandle,
} from '@/components/decisions/DecisionLogFeed';
import { RejectedDecisionsTab } from '@/components/decisions/RejectedDecisionsTab';
import { PortfolioVerdictBand } from '@/components/decisions/PortfolioVerdictBand';
import { PortfolioSignalTiles } from '@/components/decisions/PortfolioSignalTiles';
import { NextMoveContainer } from '@/components/recommendations/NextMoveContainer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type DecisionsView = 'kanban' | 'log' | 'passed';

export default function DecisionsPage() {
  const role = useOnboardingRole();
  const defaultKind = defaultContainerKindForRole(role);
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawView = searchParams.get('view');
  const view: DecisionsView =
    rawView === 'log' ? 'log' : rawView === 'passed' ? 'passed' : 'kanban';

  const [kindFilter, setKindFilter] = useState<DecisionContainerKind | 'all'>(defaultKind ?? 'all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');
  const logFeedRef = useRef<DecisionLogFeedHandle>(null);

  const filters = useMemo(
    () => ({
      kind: kindFilter === 'all' ? undefined : kindFilter,
      status: statusFilter,
    }),
    [kindFilter, statusFilter]
  );

  const { containers, isLoading } = useContainers(filters, 1, 100);

  // Portfolio cluster reads from the UNFILTERED active container set so
  // the above-fold verdict reflects the full pipeline regardless of
  // whether the user has a mode chip active on the kanban. Without this,
  // filtering down to "Acquisitions" would silently hide a critical
  // investment-mode signal that the reader still needs to act on.
  const { containers: portfolioContainers } = useContainers({ status: 'active' }, 1, 200);

  const heroSubtitle = useMemo(() => {
    if (view === 'log') {
      return 'Journal entries + cognitive audits — every decision-flavoured artefact, chronologically.';
    }
    if (view === 'passed') {
      return 'Anti-Portfolio — decisions you passed on, with eventual outcome attribution. Per Bessemer, institutionalize vulnerability.';
    }
    if (kindFilter === 'investment') {
      return 'Pre-IC memo audits before Monday partner meeting';
    }
    if (kindFilter === 'acquisition') {
      return 'Synergy thesis stress-test before the board approves';
    }
    if (kindFilter === 'strategic') {
      return 'Strategic memo gates before the steering committee';
    }
    return 'Every decision audited before commit, regardless of mode';
  }, [view, kindFilter]);

  const setView = (next: DecisionsView) => {
    if (next === 'kanban') {
      router.replace('/dashboard/decisions', { scroll: false });
    } else {
      router.replace(`/dashboard/decisions?view=${next}`, { scroll: false });
    }
  };

  return (
    <ErrorBoundary sectionName="Decisions">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1>Decisions</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>{heroSubtitle}</p>
      </div>

      {/* Above-fold portfolio cluster — translates the doc-detail
          verdict pattern to the portfolio. Renders only when the user
          actually has decisions on the books (each component returns
          null on empty input so cold-start users see the kanban empty
          state below instead of a stack of skeleton cards). */}
      {portfolioContainers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <ErrorBoundary sectionName="Portfolio verdict band">
            <PortfolioVerdictBand containers={portfolioContainers} />
          </ErrorBoundary>
          <ErrorBoundary sectionName="Portfolio signal tiles">
            <PortfolioSignalTiles containers={portfolioContainers} />
          </ErrorBoundary>
        </div>
      )}

      {/* NextMoveContainer — paper-grounded recommendation engine, now
          the canonical Intelligent Antagonist surface after the
          constellation SVG was retired 2026-05-11. Renders above all
          three views so the strip + antagonist prompt stay visible
          regardless of view choice. */}
      <NextMoveContainer />

      {/* View switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <ViewPill
          icon={<Layout size={12} />}
          label="Kanban"
          active={view === 'kanban'}
          onClick={() => setView('kanban')}
        />
        <ViewPill
          icon={<BookOpen size={12} />}
          label="Log"
          active={view === 'log'}
          onClick={() => setView('log')}
        />
        <ViewPill
          icon={<XCircle size={12} />}
          label="Passed on"
          active={view === 'passed'}
          onClick={() => setView('passed')}
        />
      </div>

      {view === 'kanban' && (
        <KanbanView
          kindFilter={kindFilter}
          setKindFilter={setKindFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          containers={containers}
          isLoading={isLoading}
        />
      )}

      {view === 'log' && (
        <LogView onLogEntry={() => logFeedRef.current?.openNewEntry()} feedRef={logFeedRef} />
      )}

      {view === 'passed' && <RejectedDecisionsTab />}
    </ErrorBoundary>
  );
}

// ─── Kanban view ─────────────────────────────────────────────────────────

function KanbanView({
  kindFilter,
  setKindFilter,
  statusFilter,
  setStatusFilter,
  containers,
  isLoading,
}: {
  kindFilter: DecisionContainerKind | 'all';
  setKindFilter: (k: DecisionContainerKind | 'all') => void;
  statusFilter: 'active' | 'archived';
  setStatusFilter: (s: 'active' | 'archived') => void;
  containers: ReturnType<typeof useContainers>['containers'];
  isLoading: boolean;
}) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <KindChip
            label="All modes"
            active={kindFilter === 'all'}
            onClick={() => setKindFilter('all')}
          />
          {CONTAINER_KINDS.map(k => (
            <KindChip
              key={k}
              label={CONTAINER_MODES[k].pluralLabel}
              active={kindFilter === k}
              onClick={() => setKindFilter(k)}
            />
          ))}
          <span
            style={{
              borderLeft: '1px solid var(--border-color)',
              height: 16,
              margin: '0 4px',
            }}
          />
          <KindChip
            label="Active"
            active={statusFilter === 'active'}
            onClick={() => setStatusFilter('active')}
          />
          <KindChip
            label="Archived"
            active={statusFilter === 'archived'}
            onClick={() => setStatusFilter('archived')}
          />
        </div>
        {/* New decision routes to the canonical hybrid create surface
            at /dashboard/decisions/new — same destination ContainerKanban
            empty-state, ContainersWidget, and CommandPalette already use.
            Locked 2026-05-10 streamlining batch. */}
        <Link
          href="/dashboard/decisions/new"
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            color: '#fff',
            border: 'none',
            fontSize: 'var(--fs-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none',
          }}
        >
          <Plus size={14} />
          New decision
        </Link>
      </div>

      <ContainerKanban
        containers={containers}
        kind={kindFilter === 'all' ? undefined : kindFilter}
        isLoading={isLoading}
      />
    </>
  );
}

// ─── Log view ────────────────────────────────────────────────────────────

function LogView({
  onLogEntry,
  feedRef,
}: {
  onLogEntry: () => void;
  feedRef: React.RefObject<DecisionLogFeedHandle | null>;
}) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={onLogEntry}
          className="btn btn-secondary"
          style={{ gap: 6, fontSize: 13 }}
        >
          <Plus size={14} />
          Log entry
        </button>
        <Link
          href="/dashboard/cognitive-audits/submit"
          className="btn btn-primary"
          style={{ gap: 6, fontSize: 13 }}
        >
          <BrainCircuit size={14} />
          Submit audit
        </Link>
      </div>
      <DecisionLogFeed ref={feedRef} />
    </>
  );
}

// ─── Pills + chips ───────────────────────────────────────────────────────

function ViewPill({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 'var(--radius-full)',
        border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        background: active ? 'rgba(22, 163, 74, 0.06)' : 'var(--bg-card)',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        fontSize: 'var(--fs-xs)',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function KindChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 'var(--radius-full)',
        border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        background: active ? 'rgba(22, 163, 74, 0.06)' : 'var(--bg-card)',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        fontSize: 'var(--fs-xs)',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {label}
    </button>
  );
}
