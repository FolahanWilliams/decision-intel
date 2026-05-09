'use client';

/**
 * /dashboard/decisions — unified container kanban (Phase 2 lock).
 *
 * Replaces /dashboard/deals + the legacy /dashboard/decisions package
 * grid with one mode-aware board. Persona-aware kanban defaults via
 * useOnboardingRole: small-fund GP / fractional CSO → investment;
 * mid-market corp dev → acquisition; PE-backed founder / bizops →
 * strategic; other → all modes (cross-mode roll-up board).
 */

import { useState, useMemo } from 'react';
import { Plus, Filter } from 'lucide-react';
import { useContainers, defaultContainerKindForRole } from '@/hooks/useContainers';
import { useOnboardingRole } from '@/hooks/useOnboardingRole';
import {
  CONTAINER_KINDS,
  CONTAINER_MODES,
  type DecisionContainerKind,
} from '@/lib/data/decision-container-modes';
import { ContainerKanban } from '@/components/containers/ContainerKanban';
import { ContainerFormModal } from '@/components/containers/ContainerFormModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DecisionsPage() {
  const role = useOnboardingRole();
  const defaultKind = defaultContainerKindForRole(role);

  const [kindFilter, setKindFilter] = useState<DecisionContainerKind | 'all'>(defaultKind ?? 'all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');

  const filters = useMemo(
    () => ({
      kind: kindFilter === 'all' ? undefined : kindFilter,
      status: statusFilter,
    }),
    [kindFilter, statusFilter]
  );

  const { containers, isLoading, mutate } = useContainers(filters, 1, 100);

  const heroSubtitle = useMemo(() => {
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
  }, [kindFilter]);

  return (
    <ErrorBoundary sectionName="Decisions kanban">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1>Decisions</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>{heroSubtitle}</p>
      </div>

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
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
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
          }}
        >
          <Plus size={14} />
          New decision
        </button>
      </div>

      <ContainerKanban
        containers={containers}
        kind={kindFilter === 'all' ? undefined : kindFilter}
        isLoading={isLoading}
      />

      {showCreateModal && (
        <ContainerFormModal
          defaultKind={kindFilter === 'all' ? defaultKind : kindFilter}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            mutate();
          }}
        />
      )}
    </ErrorBoundary>
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
