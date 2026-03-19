'use client';

import { useState } from 'react';
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  Bell,
  Target,
  Loader2,
  ChevronDown,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import type { ActivityItem } from '@/app/api/activity-feed/route';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  upload: {
    icon: <Upload size={14} />,
    color: 'var(--accent-secondary)',
    bgColor: 'rgba(10, 132, 255, 0.1)',
  },
  analysis_complete: {
    icon: <CheckCircle size={14} />,
    color: 'var(--success)',
    bgColor: 'rgba(48, 209, 88, 0.1)',
  },
  analysis_error: {
    icon: <AlertTriangle size={14} />,
    color: 'var(--error)',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  nudge: {
    icon: <Bell size={14} />,
    color: 'var(--warning)',
    bgColor: 'rgba(255, 159, 10, 0.1)',
  },
  outcome: {
    icon: <Target size={14} />,
    color: 'var(--text-secondary)',
    bgColor: 'rgba(255, 255, 255, 0.08)',
  },
};

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Uploads', value: 'upload' },
  { label: 'Analyses', value: 'analysis_complete' },
  { label: 'Nudges', value: 'nudge' },
  { label: 'Outcomes', value: 'outcome' },
];

function relativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onFilterChange?: (type: string | null) => void;
}

export function ActivityFeed({
  activities,
  isLoading,
  hasMore,
  onLoadMore,
  onFilterChange,
}: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [loadingMore, setLoadingMore] = useState(false);

  const handleFilter = (value: string) => {
    setActiveFilter(value);
    onFilterChange?.(value === 'all' ? null : value);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await onLoadMore();
    setLoadingMore(false);
  };

  const filtered =
    activeFilter === 'all'
      ? activities
      : activities.filter(
          a =>
            a.type === activeFilter ||
            (activeFilter === 'analysis_complete' && a.type === 'analysis_error')
        );

  return (
    <div>
      {/* Filter chips */}
      <div
        className="flex items-center gap-sm"
        style={{ marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}
      >
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleFilter(opt.value)}
            style={{
              padding: '3px 10px',
              fontSize: '11px',
              borderRadius: '12px',
              border:
                activeFilter === opt.value
                  ? '1px solid rgba(255, 255, 255, 0.3)'
                  : '1px solid var(--border-color)',
              background: activeFilter === opt.value ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: activeFilter === opt.value ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: activeFilter === opt.value ? 600 : 400,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-xl) var(--spacing-lg)',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}
        >
          No activity yet. Upload a document to get started.
        </div>
      )}

      {/* Activity items */}
      {!isLoading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filtered.map(activity => {
            const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.upload;
            const href = activity.metadata.documentId
              ? `/documents/${activity.metadata.documentId}`
              : activity.type === 'nudge'
                ? '/dashboard/nudges'
                : undefined;

            const content = (
              <div
                className="flex items-start gap-md"
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  transition: 'background 0.15s',
                  cursor: href ? 'pointer' : 'default',
                }}
                onMouseEnter={e => {
                  if (href)
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: config.bgColor,
                    color: config.color,
                    flexShrink: 0,
                  }}
                >
                  {config.icon}
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-sm">
                    <span
                      style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}
                    >
                      {activity.title}
                    </span>
                    {activity.metadata.score != null && (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          background:
                            activity.metadata.score >= 70
                              ? 'rgba(48, 209, 88, 0.15)'
                              : activity.metadata.score >= 40
                                ? 'rgba(255, 159, 10, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                          color:
                            activity.metadata.score >= 70
                              ? 'var(--success)'
                              : activity.metadata.score >= 40
                                ? 'var(--warning)'
                                : 'var(--error)',
                        }}
                      >
                        {Math.round(activity.metadata.score)}/100
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      margin: '2px 0 0',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activity.description}
                  </p>
                </div>
                {/* Timestamp */}
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {relativeTime(activity.timestamp)}
                </span>
              </div>
            );

            return href ? (
              <Link
                key={activity.id}
                href={href}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {content}
              </Link>
            ) : (
              <div key={activity.id}>{content}</div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && !isLoading && filtered.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {loadingMore ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ChevronDown size={12} />
            )}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
