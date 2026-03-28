'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, LayoutList, LayoutGrid, FileText, Filter, X } from 'lucide-react';
import { EnhancedEmptyState } from '@/components/ui/EnhancedEmptyState';
import { useDeals } from '@/hooks/useDeals';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { DealFormModal } from '@/components/deals/DealFormModal';
import { DealKanban } from '@/components/deals/DealKanban';
import {
  DEAL_TYPES,
  DEAL_STAGES,
  DEAL_STATUSES,
  SECTORS,
  STAGE_COLORS,
  DEAL_TYPE_COLORS,
  getStageLabel,
  getDealTypeLabel,
  formatTicketSize,
  type DealFilters,
} from '@/types/deals';

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontSize: 12,
  outline: 'none',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  paddingRight: 24,
  minWidth: 120,
};

export default function DealsPage() {
  const { filters: urlFilters, setFilter, clearFilters, hasActiveFilters } = useUrlFilters({
    page: 1,
  });

  // Derive DealFilters from URL state for useDeals
  const dealFilters = useMemo<DealFilters>(() => {
    const f: DealFilters = {};
    if (urlFilters.stage) f.stage = String(urlFilters.stage);
    if (urlFilters.status) f.status = String(urlFilters.status);
    if (urlFilters.dealType) f.dealType = String(urlFilters.dealType);
    if (urlFilters.sector) f.sector = String(urlFilters.sector);
    return f;
  }, [urlFilters.stage, urlFilters.status, urlFilters.dealType, urlFilters.sector]);

  const page = urlFilters.page ?? 1;

  // View toggle state — read from localStorage via useEffect to avoid hydration mismatch
  const [view, setView] = useState<'list' | 'board'>('list');
  useEffect(() => {
    const saved = localStorage.getItem('deals-view') as 'list' | 'board' | null;
    if (saved) setView(saved);
  }, []);

  const [showForm, setShowForm] = useState(false);

  const { deals, total, totalPages, isLoading, mutate } = useDeals(dealFilters, page, 50);

  const setViewAndSave = useCallback((v: 'list' | 'board') => {
    setView(v);
    localStorage.setItem('deals-view', v);
  }, []);

  const updateFilter = useCallback(
    (key: keyof DealFilters, value: string) => {
      setFilter(key, value || undefined);
    },
    [setFilter]
  );

  const hasFilters = hasActiveFilters;

  const handleStageChange = useCallback(
    async (dealId: string, newStage: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/deals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: dealId, stage: newStage }),
        });
        if (!res.ok) return false;
        mutate();
        return true;
      } catch {
        return false;
      }
    },
    [mutate]
  );

  // Stage counts for summary bar
  const stageCounts: Record<string, number> = {};
  for (const deal of deals) {
    stageCounts[deal.stage] = (stageCounts[deal.stage] || 0) + 1;
  }

  return (
    <div className="container" style={{ maxWidth: 1200, padding: '24px 20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Deal Pipeline
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {total} deal{total !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            fontSize: 13,
          }}
        >
          <Plus size={14} /> New Deal
        </button>
      </div>

      {/* Stage summary bar */}
      {deals.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          {DEAL_STAGES.map(stage => {
            const count = stageCounts[stage.value] || 0;
            if (count === 0) return null;
            const color = STAGE_COLORS[stage.value];
            return (
              <div
                key={stage.value}
                style={{
                  padding: '4px 10px',
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {stage.label}: {count}
              </div>
            );
          })}
        </div>
      )}

      {/* Filter bar + View toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />

        <select
          value={dealFilters.stage || ''}
          onChange={e => updateFilter('stage', e.target.value)}
          style={selectStyle}
          aria-label="Filter by stage"
        >
          <option value="">All Stages</option>
          {DEAL_STAGES.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={dealFilters.status || ''}
          onChange={e => updateFilter('status', e.target.value)}
          style={selectStyle}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {DEAL_STATUSES.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={dealFilters.dealType || ''}
          onChange={e => updateFilter('dealType', e.target.value)}
          style={selectStyle}
          aria-label="Filter by deal type"
        >
          <option value="">All Types</option>
          {DEAL_TYPES.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={dealFilters.sector || ''}
          onChange={e => updateFilter('sector', e.target.value)}
          style={selectStyle}
          aria-label="Sort deals by"
        >
          <option value="">All Sectors</option>
          {SECTORS.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            aria-label="Clear all filters"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
            }}
          >
            <X size={12} /> Clear
          </button>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setViewAndSave('list')}
            style={{
              padding: '6px 10px',
              background: view === 'list' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: view === 'list' ? '#6366f1' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="List view"
          >
            <LayoutList size={14} />
          </button>
          <button
            onClick={() => setViewAndSave('board')}
            style={{
              padding: '6px 10px',
              background: view === 'board' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: view === 'board' ? '#6366f1' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Board view"
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                height: 80,
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 10,
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <EnhancedEmptyState
          type="generic"
          title="No deals yet"
          description="Create your first deal to start tracking your pipeline."
          actions={[{ label: 'Create Deal', onClick: () => setShowForm(true), variant: 'primary' }]}
        />
      ) : view === 'board' ? (
        <DealKanban deals={deals} onStageChange={handleStageChange} />
      ) : (
        <>
          {/* List View */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {deals.map(deal => {
              const stageColor = STAGE_COLORS[deal.stage] || '#6b7280';
              const typeColor = DEAL_TYPE_COLORS[deal.dealType] || '#6b7280';
              return (
                <Link
                  key={deal.id}
                  href={`/dashboard/deals/${deal.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className="card"
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      transition: 'border-color 0.15s',
                    }}
                  >
                    {/* Name + target */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {deal.name}
                      </div>
                      {deal.targetCompany && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {deal.targetCompany}
                        </div>
                      )}
                    </div>

                    {/* Deal type badge */}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: typeColor,
                        background: `${typeColor}18`,
                        padding: '3px 8px',
                        borderRadius: 4,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getDealTypeLabel(deal.dealType)}
                    </span>

                    {/* Stage badge */}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: stageColor,
                        background: `${stageColor}18`,
                        padding: '3px 8px',
                        borderRadius: 4,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getStageLabel(deal.stage)}
                    </span>

                    {/* Ticket size */}
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        minWidth: 80,
                        textAlign: 'right',
                      }}
                    >
                      {formatTicketSize(deal.ticketSize, deal.currency)}
                    </span>

                    {/* Doc count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 50 }}>
                      <FileText size={12} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {deal._count?.documents || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
              <button
                onClick={() => setFilter('page', Math.max(1, page - 1))}
                disabled={page <= 1}
                className="btn btn-ghost"
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                Previous
              </button>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setFilter('page', Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="btn btn-ghost"
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Deal Form Modal */}
      <DealFormModal open={showForm} onOpenChange={setShowForm} onSuccess={() => mutate()} />
    </div>
  );
}
