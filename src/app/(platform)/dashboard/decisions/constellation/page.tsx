'use client';

/**
 * /dashboard/decisions/constellation — Decision Pipeline Constellation
 * (Phase 3.5 ship). Longitudinal/relational visualization mapping
 * cognitive lineage across every DecisionContainer the user can see.
 *
 * Sibling to /dashboard/decisions (the kanban). Same data, different
 * narrative shape: the kanban is daily-ops triage; the constellation
 * is the strategic narrative — temporal decay, escalation chains,
 * thesis-anchor cascades, structural-assumption ripple.
 */

import Link from 'next/link';
import { ChevronLeft, Network, Plus } from 'lucide-react';
import { useState } from 'react';
import { useOnboardingRole } from '@/hooks/useOnboardingRole';
import { defaultContainerKindForRole } from '@/hooks/useContainers';
import { ContainerConstellation } from '@/components/constellation/ContainerConstellation';
import { ContainerFormModal } from '@/components/containers/ContainerFormModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ConstellationPage() {
  const role = useOnboardingRole();
  const defaultKind = defaultContainerKindForRole(role);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <ErrorBoundary sectionName="Decision Pipeline Constellation">
      <div style={{ marginBottom: 12 }}>
        <Link
          href="/dashboard/decisions"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          <ChevronLeft size={12} /> Decisions
        </Link>
      </div>

      <div className="page-header" style={{ marginBottom: 8 }}>
        <h1
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Network size={24} style={{ color: 'var(--accent-primary)' }} />
          Decision Pipeline Constellation
        </h1>
      </div>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--fs-sm)',
          marginBottom: 16,
          maxWidth: 760,
          lineHeight: 1.5,
        }}
      >
        Cognitive lineage across every audited decision in your pipeline. Time on the x-axis, mode
        on the y-axis. Edges map thesis anchors, structural-assumption dependencies, escalation
        chains, and strategic-frame parenthood — surfacing compounding risk the kanban can&rsquo;t
        show.
      </p>

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
        <div style={{ display: 'flex', gap: 6 }}>
          <Link
            href="/dashboard/decisions"
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Kanban view
          </Link>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--accent-primary)',
              background: 'rgba(22, 163, 74, 0.06)',
              color: 'var(--accent-primary)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
            }}
          >
            Constellation
          </span>
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

      <ContainerConstellation />

      {showCreateModal && (
        <ContainerFormModal
          defaultKind={defaultKind}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
          }}
        />
      )}
    </ErrorBoundary>
  );
}
