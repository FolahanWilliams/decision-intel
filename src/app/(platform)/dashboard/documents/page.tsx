'use client';

/**
 * /dashboard/documents — standalone documents list page.
 *
 * Locked 2026-05-10 (streamlining batch). Previously the sidebar
 * "Documents" entry pointed at `/dashboard?view=browse` — clicking it
 * left the URL on /dashboard, made the entry feel like a tab not a page,
 * and forced users to scroll past the upload zone to see their list.
 * The fractional CSO who asked "where are my documents" rightly
 * complained that clicking Documents didn't take them there.
 *
 * This page is the proper destination — its own URL, its own header,
 * its own list rendering, no upload zone above. The dashboard's inline
 * Browse view stays in place for users who want a single pane (toggle
 * still works), but the canonical entry point is now `/dashboard/documents`.
 *
 * Per the founder's streamlining mandate: "ruthlessly good at a few
 * things." A documents page should show your documents. Not your
 * upload zone. Not your activity feed. Just the list, with search +
 * filter + sort + multi-select compare. The shared shell pattern
 * (page-header + content) mirrors the document detail surface for
 * cross-surface coherence.
 */

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Upload,
  X,
  Clock,
  GitCompareArrows,
  CheckCircle,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EnhancedEmptyState } from '@/components/ui/EnhancedEmptyState';
import { gradeFromScore } from '@/lib/utils/grade';

type StatusFilter = 'all' | 'complete' | 'analyzing' | 'pending';
type SortKey = 'newest' | 'oldest' | 'scoreHigh' | 'scoreLow' | 'name';

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  scoreHigh: 'Score: High → Low',
  scoreLow: 'Score: Low → High',
  name: 'Name A-Z',
};

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All status',
  complete: 'Complete',
  analyzing: 'Analyzing',
  pending: 'Pending',
};

export default function DocumentsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Debounce search → searchQuery (300ms) so we don't filter on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { documents, total, totalPages, isLoading } = useDocuments(true, page, 25);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documents, searchQuery, statusFilter]);

  const sortedDocs = useMemo(() => {
    const arr = [...filteredDocs];
    switch (sortBy) {
      case 'oldest':
        return arr.sort(
          (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        );
      case 'scoreHigh':
        return arr.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
      case 'scoreLow':
        return arr.sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity));
      case 'name':
        return arr.sort((a, b) => a.filename.localeCompare(b.filename));
      case 'newest':
      default:
        return arr.sort(
          (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
    }
  }, [filteredDocs, sortBy]);

  const goToCompare = () => {
    const ids = Array.from(selectedDocs).slice(0, 3);
    if (ids.length < 2) return;
    router.push(`/dashboard/compare?doc=${ids.join(',')}`);
  };

  return (
    <ErrorBoundary sectionName="Documents">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1>Documents</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
          Every strategic memo you&rsquo;ve uploaded — search, sort, compare 2-3 side-by-side.
        </p>
      </div>

      {/* Toolbar — search / status filter / sort / new upload action */}
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
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search documents…"
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              aria-label="Search documents"
              style={{
                paddingLeft: 32,
                paddingRight: searchInput ? 28 : 12,
                paddingTop: 6,
                paddingBottom: 6,
                fontSize: 'var(--fs-sm)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                width: 240,
              }}
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                }}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            aria-label="Filter by status"
            onChange={e => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            style={{
              padding: '6px 12px',
              fontSize: 'var(--fs-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
          >
            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(k => (
              <option key={k} value={k}>
                {STATUS_LABELS[k]}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            aria-label="Sort documents"
            onChange={e => setSortBy(e.target.value as SortKey)}
            style={{
              padding: '6px 12px',
              fontSize: 'var(--fs-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        <Link
          href="/dashboard"
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
          Upload document
        </Link>
      </div>

      {/* Multi-select compare bar — only renders when 2+ selected */}
      {selectedDocs.size >= 2 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 14px',
            marginBottom: 12,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(22,163,74,0.06)',
            border: '1px solid var(--accent-primary)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--fs-sm)',
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            {selectedDocs.size} selected · compare 2-3 documents side-by-side
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setSelectedDocs(new Set())}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--fs-sm)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={goToCompare}
              disabled={selectedDocs.size > 3}
              style={{
                padding: '6px 12px',
                background: selectedDocs.size > 3 ? 'var(--bg-elevated)' : 'var(--accent-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                color: selectedDocs.size > 3 ? 'var(--text-muted)' : '#fff',
                cursor: selectedDocs.size > 3 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GitCompareArrows size={14} />
              {selectedDocs.size > 3 ? 'Max 3' : 'Compare'}
            </button>
          </div>
        </div>
      )}

      {/* Body — list, empty state, or loading */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <DocumentsListSkeleton />
        ) : documents.length === 0 ? (
          <div style={{ padding: 32 }}>
            <EnhancedEmptyState
              type="documents"
              showBrief
              briefContext="documents"
              actions={[
                {
                  label: 'Upload your first document',
                  onClick: () => router.push('/dashboard'),
                  variant: 'primary',
                  icon: <Upload className="w-4 h-4" />,
                },
              ]}
            />
          </div>
        ) : sortedDocs.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Search size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', margin: 0 }}>
              No matches found
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
                setStatusFilter('all');
              }}
              style={{
                marginTop: 8,
                padding: '6px 14px',
                fontSize: 'var(--fs-sm)',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Select-all header */}
            <div
              style={{
                padding: '10px 16px',
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <input
                type="checkbox"
                aria-label="Select all documents"
                checked={selectedDocs.size === sortedDocs.length && sortedDocs.length > 0}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedDocs(new Set(sortedDocs.map(d => d.id)));
                  } else {
                    setSelectedDocs(new Set());
                  }
                }}
                style={{
                  width: 14,
                  height: 14,
                  accentColor: 'var(--accent-primary)',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                {selectedDocs.size > 0
                  ? `${selectedDocs.size} of ${sortedDocs.length} selected`
                  : `${sortedDocs.length} document${sortedDocs.length === 1 ? '' : 's'}`}
              </span>
              {total > sortedDocs.length && (
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                  · {total} total across all pages
                </span>
              )}
            </div>

            {/* Document rows */}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {sortedDocs.map(doc => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  selected={selectedDocs.has(doc.id)}
                  onToggleSelect={() => {
                    setSelectedDocs(prev => {
                      const next = new Set(prev);
                      if (next.has(doc.id)) next.delete(doc.id);
                      else next.add(doc.id);
                      return next;
                    });
                  }}
                />
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                  Page {page} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    style={{
                      padding: '6px 12px',
                      fontSize: 'var(--fs-sm)',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                      cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    style={{
                      padding: '6px 12px',
                      fontSize: 'var(--fs-sm)',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                      cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

// ─── Row + skeleton ──────────────────────────────────────────────────────

interface DocumentRowProps {
  doc: {
    id: string;
    filename: string;
    status: string;
    score?: number;
    outcomeStatus?: string;
    uploadedAt: string;
  };
  selected: boolean;
  onToggleSelect: () => void;
}

function DocumentRow({ doc, selected, onToggleSelect }: DocumentRowProps) {
  const grade = doc.score != null ? gradeFromScore(doc.score) : null;
  const statusIcon =
    doc.status === 'complete' ? (
      <CheckCircle size={13} style={{ color: 'var(--success)' }} />
    ) : doc.status === 'analyzing' ? (
      <Loader2 size={13} className="animate-spin" style={{ color: 'var(--info)' }} />
    ) : doc.status === 'pending' ? (
      <Clock size={13} style={{ color: 'var(--warning)' }} />
    ) : (
      <AlertCircle size={13} style={{ color: 'var(--text-muted)' }} />
    );

  return (
    <li
      style={{
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto auto auto auto',
          alignItems: 'center',
          gap: 14,
          padding: '12px 16px',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
        }}
      >
        <input
          type="checkbox"
          aria-label={`Select ${doc.filename}`}
          checked={selected}
          onChange={onToggleSelect}
          style={{
            width: 14,
            height: 14,
            accentColor: 'var(--accent-primary)',
            cursor: 'pointer',
          }}
        />
        <Link
          href={`/documents/${doc.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: 'var(--fs-sm)',
            fontWeight: 500,
            minWidth: 0,
          }}
        >
          <FileText size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {doc.filename}
          </span>
        </Link>
        <span
          style={{
            fontSize: 'var(--fs-2xs)',
            color: 'var(--text-muted)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {formatRelativeDate(doc.uploadedAt)}
        </span>
        {doc.outcomeStatus === 'outcome_logged' ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 'var(--fs-2xs)',
              color: 'var(--success)',
              whiteSpace: 'nowrap',
            }}
          >
            <CheckCircle size={13} />
            Outcome
          </span>
        ) : doc.outcomeStatus === 'outcome_overdue' ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 'var(--fs-2xs)',
              color: 'var(--error)',
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={13} />
            Overdue
          </span>
        ) : doc.outcomeStatus === 'pending_outcome' ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 'var(--fs-2xs)',
              color: 'var(--warning)',
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={13} />
            Pending
          </span>
        ) : (
          <span />
        )}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 'var(--fs-2xs)',
            color: 'var(--text-secondary)',
            textTransform: 'capitalize',
          }}
        >
          {statusIcon}
          {doc.status}
        </span>
        {grade ? (
          <span
            style={{
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-elevated)',
              fontSize: 'var(--fs-2xs)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              minWidth: 28,
              textAlign: 'center',
            }}
          >
            {grade}
          </span>
        ) : (
          <span
            style={{
              fontSize: 'var(--fs-2xs)',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            —
          </span>
        )}
      </div>
    </li>
  );
}

function DocumentsListSkeleton() {
  return (
    <div>
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: 'var(--bg-elevated)',
            }}
          />
          <div
            style={{
              width: 240,
              height: 14,
              background: 'var(--bg-elevated)',
              borderRadius: 4,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }} />
          <div
            style={{
              width: 60,
              height: 12,
              background: 'var(--bg-elevated)',
              borderRadius: 4,
            }}
          />
          <div
            style={{
              width: 28,
              height: 18,
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-full)',
            }}
          />
        </div>
      ))}
    </div>
  );
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = Date.now();
  const ms = now - d.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 1) return 'just now';
    return `${hours}h ago`;
  }
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toISOString().slice(0, 10);
}
