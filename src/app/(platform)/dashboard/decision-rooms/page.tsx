'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Users,
  Target,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Room {
  id: string;
  title: string;
  status: 'open' | 'closed' | 'archived';
  createdBy: string;
  decisionType: string | null;
  consensusScore: number | null;
  biasBriefing: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  _count: { participants: number; blindPriors: number };
}

interface RoomsResponse {
  rooms: Room[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch decision rooms');
    return r.json();
  });

const DECISION_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  investment_committee: { bg: 'rgba(99, 102, 241, 0.15)', text: 'rgb(129, 140, 248)' },
  board_review: { bg: 'rgba(139, 92, 246, 0.15)', text: 'rgb(167, 139, 250)' },
  deal_committee: { bg: 'rgba(59, 130, 246, 0.15)', text: 'rgb(96, 165, 250)' },
  risk_committee: { bg: 'rgba(245, 158, 11, 0.15)', text: 'rgb(251, 191, 36)' },
  general: { bg: 'rgba(156, 163, 175, 0.12)', text: 'rgb(156, 163, 175)' },
};

function formatDecisionType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type FilterTab = 'all' | 'open' | 'closed' | 'archived';

export default function DecisionRoomsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, error, isLoading } = useSWR<RoomsResponse>(
    `/api/decision-rooms?page=${page}&limit=${limit}`,
    fetcher
  );

  const filteredRooms =
    data?.rooms?.filter(room => (activeTab === 'all' ? true : room.status === activeTab)) ?? [];

  const totalRooms = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'closed', label: 'Closed' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <ErrorBoundary sectionName="Decision Rooms">
      <div style={{ padding: 'var(--spacing-xl)', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 'var(--spacing-xl)' }}
        >
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Decision Rooms
            </h1>
            {!isLoading && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {totalRooms} room{totalRooms !== 1 ? 's' : ''} total
              </p>
            )}
          </div>
          <a
            href="/dashboard/documents"
            className="flex items-center gap-sm"
            style={{
              padding: '8px 16px',
              background: 'var(--accent-primary)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            Create Room
          </a>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-xl)' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 500,
                border: '1px solid',
                borderColor:
                  activeTab === tab.key ? 'var(--accent-primary)' : 'var(--glass-border)',
                background: activeTab === tab.key ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center" style={{ padding: 80 }}>
            <Loader2
              size={24}
              style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }}
            />
            <span style={{ marginLeft: 10, color: 'var(--text-muted)', fontSize: 14 }}>
              Loading rooms...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            className="flex items-center gap-md"
            style={{
              padding: 'var(--spacing-md)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'rgb(248, 113, 113)',
              fontSize: 14,
            }}
          >
            <AlertTriangle size={18} />
            Failed to load decision rooms. Please try again later.
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredRooms.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              border: '1px dashed var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
            }}
          >
            <p style={{ fontSize: 15, marginBottom: 6 }}>No decision rooms yet.</p>
            <p style={{ fontSize: 13 }}>
              Create one from a document analysis to enable blind prior voting.
            </p>
          </div>
        )}

        {/* Room Cards Grid */}
        {!isLoading && !error && filteredRooms.length > 0 && (
          <div className="grid grid-2" style={{ gap: 'var(--spacing-md)' }}>
            {filteredRooms.map(room => {
              const typeColors =
                DECISION_TYPE_COLORS[room.decisionType ?? 'general'] ??
                DECISION_TYPE_COLORS.general;
              const isOpen = room.status === 'open';
              const biasCount = room.biasBriefing ? Object.keys(room.biasBriefing).length : 0;

              return (
                <div
                  key={room.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)',
                    transition: 'border-color 0.15s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
                >
                  {/* Title row */}
                  <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        marginRight: 8,
                      }}
                    >
                      {room.title}
                    </h3>
                    {room.decisionType && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: typeColors.bg,
                          color: typeColors.text,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDecisionType(room.decisionType)}
                      </span>
                    )}
                  </div>

                  {/* Status + stats row */}
                  <div className="flex items-center gap-md" style={{ marginBottom: 10 }}>
                    {/* Status indicator */}
                    <span
                      className="flex items-center gap-sm"
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: isOpen ? 'rgb(74, 222, 128)' : 'rgb(96, 165, 250)',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: isOpen ? 'rgb(74, 222, 128)' : 'rgb(96, 165, 250)',
                          display: 'inline-block',
                        }}
                      />
                      {isOpen ? 'Blind' : 'Revealed'}
                    </span>

                    {/* Participants */}
                    <span
                      className="flex items-center gap-sm"
                      style={{ fontSize: 12, color: 'var(--text-muted)' }}
                    >
                      <Users size={13} />
                      {room._count.participants}
                    </span>

                    {/* Priors */}
                    <span
                      className="flex items-center gap-sm"
                      style={{ fontSize: 12, color: 'var(--text-muted)' }}
                    >
                      <Target size={13} />
                      {room._count.blindPriors}
                    </span>
                  </div>

                  {/* Bottom row: consensus, bias, date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-md">
                      {/* Consensus score (closed rooms only) */}
                      {room.status === 'closed' && room.consensusScore != null && (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color:
                              room.consensusScore > 70
                                ? 'rgb(74, 222, 128)'
                                : room.consensusScore > 40
                                  ? 'rgb(250, 204, 21)'
                                  : 'rgb(248, 113, 113)',
                          }}
                        >
                          {Math.round(room.consensusScore)}% consensus
                        </span>
                      )}

                      {/* Bias badge */}
                      {biasCount > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: '1px 7px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: 'rgb(251, 191, 36)',
                            fontWeight: 500,
                          }}
                        >
                          {biasCount} bias{biasCount !== 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDate(room.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <div
            className="flex items-center justify-center gap-md"
            style={{ marginTop: 'var(--spacing-xl)' }}
          >
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-sm"
              style={{
                padding: '6px 12px',
                fontSize: 13,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--glass-border)',
                background: 'transparent',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-sm"
              style={{
                padding: '6px 12px',
                fontSize: 13,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--glass-border)',
                background: 'transparent',
                color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
