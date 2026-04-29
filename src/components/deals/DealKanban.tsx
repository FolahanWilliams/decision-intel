'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { FileText, MoreHorizontal, Calendar, Activity } from 'lucide-react';
import {
  DEAL_STAGES,
  STAGE_COLORS,
  DEAL_TYPE_COLORS,
  getDealTypeLabel,
  formatTicketSize,
  type DealSummary,
} from '@/types/deals';
import { dqiColorFor } from '@/lib/utils/grade';

// Day-precision relative-date for kanban IC chip. Returns one of:
//   "Today"           — IC is today
//   "Tomorrow"        — IC is tomorrow
//   "in 5d" / "in 3w" — IC is in the future
//   "5d ago"          — IC has passed (deal stuck post-IC)
function formatIcCountdown(icDate: string | null): string | null {
  if (!icDate) return null;
  const target = new Date(icDate);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  // Round to nearest day in local time.
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.round((targetDay - todayDay) / dayMs);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0 && days < 14) return `in ${days}d`;
  if (days >= 14 && days < 60) return `in ${Math.round(days / 7)}w`;
  if (days >= 60) return `in ${Math.round(days / 30)}mo`;
  return `${Math.abs(days)}d ago`;
}


interface DealKanbanProps {
  deals: DealSummary[];
  onStageChange: (dealId: string, newStage: string) => Promise<boolean>;
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({
  deal,
  onStageChange,
}: {
  deal: DealSummary;
  onStageChange: (dealId: string, newStage: string) => Promise<boolean>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', deal.id);
      e.dataTransfer.effectAllowed = 'move';
      setIsDragging(true);
    },
    [deal.id]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const dealTypeColor = DEAL_TYPE_COLORS[deal.dealType] || '#6b7280';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        padding: '10px 12px',
        background: isDragging ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${isDragging ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
        borderRadius: 8,
        cursor: 'grab',
        opacity: isDragging ? 0.6 : 1,
        transition: 'all 0.15s',
        position: 'relative',
      }}
    >
      <Link
        href={`/dashboard/deals/${deal.id}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <div
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}
        >
          {deal.name}
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Deal type badge */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: dealTypeColor,
            background: `${dealTypeColor}18`,
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {getDealTypeLabel(deal.dealType)}
        </span>

        {/* Sector */}
        {deal.sector && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{deal.sector}</span>
        )}

        {/* Ticket size */}
        {deal.ticketSize && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {formatTicketSize(deal.ticketSize, deal.currency)}
          </span>
        )}
      </div>

      {/* Footer row — doc count, IC date, composite DQI. A1 lock 2026-04-29:
          M&A users (Adaeze persona) scan the card for IC date + composite
          score first; both surfaces ship to-glance instead of requiring
          a click into the deal page. */}
      {(deal._count?.documents > 0 ||
        deal.icDate ||
        (deal.compositeDqi !== null && deal.compositeDqi !== undefined)) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 8,
            flexWrap: 'wrap',
          }}
        >
          {deal._count?.documents > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <FileText size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {deal._count.documents} doc{deal._count.documents !== 1 ? 's' : ''}
              </span>
            </span>
          )}
          {deal.icDate &&
            (() => {
              const countdown = formatIcCountdown(deal.icDate);
              if (!countdown) return null;
              const isPast = countdown.endsWith('ago') || countdown === 'Yesterday';
              const isImminent =
                countdown === 'Today' ||
                countdown === 'Tomorrow' ||
                /^in [1-3]d$/.test(countdown);
              const color = isPast
                ? 'var(--error)'
                : isImminent
                  ? 'var(--warning)'
                  : 'var(--text-muted)';
              return (
                <span
                  title={`IC review: ${new Date(deal.icDate as string).toLocaleDateString()}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    color,
                    fontWeight: isImminent || isPast ? 700 : 500,
                  }}
                >
                  <Calendar size={11} />
                  IC {countdown}
                </span>
              );
            })()}
          {deal.compositeDqi !== null && deal.compositeDqi !== undefined && (
            <span
              title="Composite DQI across all analyzed documents in this deal"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                fontWeight: 700,
                color: dqiColorFor(deal.compositeDqi),
              }}
            >
              <Activity size={11} />
              DQI {Math.round(deal.compositeDqi)}
            </span>
          )}
        </div>
      )}

      {/* Mobile fallback: "Move to" menu */}
      <button
        onClick={e => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: 2,
          display: 'flex',
        }}
        aria-label="Move deal to stage"
      >
        <MoreHorizontal size={14} />
      </button>

      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: 28,
            right: 8,
            background: 'var(--liquid-bg, #1a1a2e)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            padding: 4,
            zIndex: 50,
            minWidth: 140,
            backdropFilter: 'blur(12px)',
          }}
        >
          {DEAL_STAGES.filter(s => s.value !== deal.stage).map(stage => (
            <button
              key={stage.value}
              onClick={async e => {
                e.preventDefault();
                setShowMenu(false);
                await onStageChange(deal.id, stage.value);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 10px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 12,
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: 4,
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.background = 'transparent';
              }}
            >
              Move to {stage.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  deals,
  onDrop,
  onStageChange,
}: {
  stage: { value: string; label: string };
  deals: DealSummary[];
  onDrop: (dealId: string, newStage: string) => void;
  onStageChange: (dealId: string, newStage: string) => Promise<boolean>;
}) {
  const [isOver, setIsOver] = useState(false);
  const stageColor = STAGE_COLORS[stage.value] || '#6b7280';

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only reset if leaving the column itself, not a child
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      const dealId = e.dataTransfer.getData('text/plain');
      if (dealId) {
        onDrop(dealId, stage.value);
      }
    },
    [onDrop, stage.value]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        minWidth: 220,
        maxWidth: 280,
        flex: '1 0 220px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderBottom: `2px solid ${stageColor}`,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: stageColor }}>{stage.label}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-muted)',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '1px 6px',
            borderRadius: 10,
          }}
        >
          {deals.length}
        </span>
      </div>

      {/* Cards container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '4px 4px',
          minHeight: 80,
          borderRadius: 8,
          border: isOver ? `1px dashed ${stageColor}` : '1px dashed transparent',
          background: isOver ? `${stageColor}08` : 'transparent',
          transition: 'all 0.15s',
          overflowY: 'auto',
        }}
      >
        {deals.map(deal => (
          <KanbanCard key={deal.id} deal={deal} onStageChange={onStageChange} />
        ))}
      </div>
    </div>
  );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

export function DealKanban({ deals, onStageChange }: DealKanbanProps) {
  const [localDeals, setLocalDeals] = useState<DealSummary[]>(deals);

  // Sync when props change
  if (
    deals !== localDeals &&
    JSON.stringify(deals.map(d => d.id + d.stage)) !==
      JSON.stringify(localDeals.map(d => d.id + d.stage))
  ) {
    setLocalDeals(deals);
  }

  const handleDrop = useCallback(
    async (dealId: string, newStage: string) => {
      const deal = localDeals.find(d => d.id === dealId);
      if (!deal || deal.stage === newStage) return;

      // Optimistic update
      const previousDeals = [...localDeals];
      setLocalDeals(prev => prev.map(d => (d.id === dealId ? { ...d, stage: newStage } : d)));

      const success = await onStageChange(dealId, newStage);
      if (!success) {
        // Revert on failure
        setLocalDeals(previousDeals);
      }
    },
    [localDeals, onStageChange]
  );

  // Group deals by stage
  const dealsByStage: Record<string, DealSummary[]> = {};
  for (const stage of DEAL_STAGES) {
    dealsByStage[stage.value] = localDeals.filter(d => d.stage === stage.value);
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 8,
        minHeight: 400,
      }}
    >
      {DEAL_STAGES.map(stage => (
        <KanbanColumn
          key={stage.value}
          stage={stage}
          deals={dealsByStage[stage.value] || []}
          onDrop={handleDrop}
          onStageChange={onStageChange}
        />
      ))}
    </div>
  );
}
