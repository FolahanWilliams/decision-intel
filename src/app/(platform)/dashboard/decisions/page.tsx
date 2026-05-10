'use client';

/**
 * /dashboard/decisions — unified decisions surface (Phase 2 lock + Phase
 * G fold 2026-05-10). Three views accessible from one parent page:
 *
 *   - Kanban (default): workflow-grade containers (investment /
 *     acquisition / strategic) — daily-ops triage board.
 *   - Log: chronological feed of journal entries + cognitive audits.
 *     Folded in 2026-05-10 from the deleted /dashboard/decision-log
 *     standalone route — "still too much cognitive load with all the
 *     pages — is the Decision Log really a necessary standalone page,
 *     can't we just incorporate elements from it into the Decisions
 *     page" (founder audit).
 *   - Constellation: sibling page (heavy SVG, justifies own URL) at
 *     /dashboard/decisions/constellation. Cognitive lineage between
 *     containers — thesis anchors, dependency ripple, escalation chains.
 *
 * Persona-aware kanban defaults via useOnboardingRole: small-fund GP /
 * fractional CSO → investment; mid-market corp dev → acquisition;
 * PE-backed founder / bizops → strategic; other → all modes.
 */

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Filter, Network, Layout, BookOpen, BrainCircuit, ArrowUpRight } from 'lucide-react';
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
import { ErrorBoundary } from '@/components/ErrorBoundary';

type DecisionsView = 'kanban' | 'log';

export default function DecisionsPage() {
  const role = useOnboardingRole();
  const defaultKind = defaultContainerKindForRole(role);
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawView = searchParams.get('view');
  const view: DecisionsView = rawView === 'log' ? 'log' : 'kanban';

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

  const heroSubtitle = useMemo(() => {
    if (view === 'log') {
      return 'Journal entries + cognitive audits — every decision-flavoured artefact, chronologically.';
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
      <div className="page-header" style={{ marginBottom: 12 }}>
        <h1>Decisions</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>{heroSubtitle}</p>
      </div>

      {/* View switcher — Kanban / Log inline; Constellation as sibling
          page link (heavy SVG, justifies its own URL). */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
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
        {/* Constellation peer-pill — locked 2026-05-10 batch 4 #3.
            Visually balanced with Kanban + Log ViewPills (same padding,
            border, font weight). The ArrowUpRight indicator signals this
            view routes to a sibling page rather than swapping the
            ?view= query param — keeps the user oriented when they
            return from the constellation. Hover state mirrors ViewPill
            so the eye reads the 3 views as equally weighted. */}
        <Link
          href="/dashboard/decisions/constellation"
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--accent-primary)';
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent-primary)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-color)';
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
          }}
          title="Open the longitudinal Decision Pipeline Constellation viz (cognitive-lineage between decisions)"
        >
          <Network size={12} />
          Constellation
          <ArrowUpRight size={11} style={{ opacity: 0.6 }} />
        </Link>
      </div>

      {view === 'kanban' && (
        <KanbanView
          kindFilter={kindFilter}
          setKindFilter={setKindFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          containers={containers}
          isLoading={isLoading}
          defaultKind={defaultKind}
        />
      )}

      {view === 'log' && (
        <LogView onLogEntry={() => logFeedRef.current?.openNewEntry()} feedRef={logFeedRef} />
      )}
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
  defaultKind: _defaultKind,
}: {
  kindFilter: DecisionContainerKind | 'all';
  setKindFilter: (k: DecisionContainerKind | 'all') => void;
  statusFilter: 'active' | 'archived';
  setStatusFilter: (s: 'active' | 'archived') => void;
  containers: ReturnType<typeof useContainers>['containers'];
  isLoading: boolean;
  defaultKind: DecisionContainerKind | null | undefined;
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
            Previously opened ContainerFormModal directly, which created a
            divergent flow (3 modals + 1 page = 4 different "new decision"
            entry shapes). Locked 2026-05-10 streamlining batch. */}
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
