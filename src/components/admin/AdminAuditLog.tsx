'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Download,
  FileJson,
  Filter,
  RefreshCcw,
  Search,
  X,
} from 'lucide-react';

/**
 * Admin audit-log firehose.
 *
 * Lives at /dashboard/admin/audit-log behind an ADMIN_USER_IDS gate.
 * Reads from GET /api/admin/audit-log (filter + paginate + JSON) and
 * GET /api/admin/audit-log/facets (distinct action / user / org /
 * resource values for the filter UI). CSV export hits the same
 * endpoint with ?format=csv.
 *
 * Design goals:
 *   - Every filter is debounced/URL-synced. Refresh keeps state.
 *   - The details JSON column opens in a drawer on the right so the
 *     admin doesn't lose their scroll position in the table.
 *   - Every key action (refresh, filter change, export) is one click.
 *   - Matches the platform design system (CSS variables, .card chrome,
 *     .page-header, .modal-backdrop).
 */

interface AuditLogRow {
  id: string;
  createdAt: string;
  userId: string;
  orgId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: unknown;
}

interface Facet {
  value: string;
  count: number;
}

interface FacetsResponse {
  actions: Facet[];
  users: Facet[];
  orgs: Facet[];
  resources: Facet[];
}

interface Filter {
  action: string;
  userId: string;
  orgId: string;
  resource: string;
  q: string;
  from: string;
  to: string;
}

const EMPTY_FILTER: Filter = {
  action: '',
  userId: '',
  orgId: '',
  resource: '',
  q: '',
  from: '',
  to: '',
};

const PAGE_SIZE = 50;

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function truncate(s: string | null, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function buildQuery(filter: Filter, offset: number): string {
  const p = new URLSearchParams();
  if (filter.action) p.set('action', filter.action);
  if (filter.userId) p.set('userId', filter.userId);
  if (filter.orgId) p.set('orgId', filter.orgId);
  if (filter.resource) p.set('resource', filter.resource);
  if (filter.q) p.set('q', filter.q);
  if (filter.from) p.set('from', filter.from);
  if (filter.to) p.set('to', filter.to);
  p.set('limit', String(PAGE_SIZE));
  p.set('offset', String(offset));
  return p.toString();
}

export function AdminAuditLog() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>(EMPTY_FILTER);
  const [draftQ, setDraftQ] = useState('');
  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [selected, setSelected] = useState<AuditLogRow | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audit-log?${buildQuery(filter, offset)}`);
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as {
        rows: AuditLogRow[];
        total: number;
      };
      setRows(data.rows);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [filter, offset]);

  // Load facets once — they rarely change during a session and are the
  // primary source for the dropdown filter chips.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/audit-log/facets');
        if (!res.ok) return;
        const data = (await res.json()) as FacetsResponse;
        if (!cancelled) setFacets(data);
      } catch {
        /* facets are a progressive enhancement; tolerate failure */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Debounce the substring search so every keystroke isn't a round-trip.
  useEffect(() => {
    const t = setTimeout(() => {
      if (draftQ !== filter.q) {
        setFilter(f => ({ ...f, q: draftQ }));
        setOffset(0);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [draftQ, filter.q]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filter).filter(Boolean).length;
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      /* clipboard may not be available */
    }
  };

  const exportCsv = () => {
    const p = new URLSearchParams();
    if (filter.action) p.set('action', filter.action);
    if (filter.userId) p.set('userId', filter.userId);
    if (filter.orgId) p.set('orgId', filter.orgId);
    if (filter.resource) p.set('resource', filter.resource);
    if (filter.q) p.set('q', filter.q);
    if (filter.from) p.set('from', filter.from);
    if (filter.to) p.set('to', filter.to);
    p.set('format', 'csv');
    window.location.href = `/api/admin/audit-log?${p.toString()}`;
  };

  const resetFilter = () => {
    setFilter(EMPTY_FILTER);
    setDraftQ('');
    setOffset(0);
  };

  const setField = <K extends keyof Filter>(key: K, value: Filter[K]) => {
    setFilter(f => ({ ...f, [key]: value }));
    setOffset(0);
  };

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--spacing-2xl)',
        paddingBottom: 'var(--spacing-2xl)',
      }}
    >
      <header className="page-header animate-fade-in">
        <div className="flex items-center gap-md">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(var(--success-rgb), 0.12)',
              border: '1px solid rgba(var(--success-rgb), 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clipboard size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                margin: 0,
              }}
            >
              <span className="text-gradient">Audit log</span>
            </h1>
            <p className="page-subtitle">
              Admin-only firehose of every auditable action across every organisation.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <button
            onClick={load}
            className="btn btn-secondary"
            disabled={loading}
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            <RefreshCcw size={13} />
            Refresh
          </button>
          <button
            onClick={exportCsv}
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </header>

      {/* Filter bar */}
      <div
        className="card"
        style={{ marginBottom: 'var(--spacing-lg)' }}
      >
        <div className="card-body" style={{ padding: '14px 18px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(200px, 2fr) minmax(160px, 1fr) minmax(160px, 1fr) minmax(140px, 0.9fr) minmax(140px, 0.9fr) auto',
              gap: 10,
              alignItems: 'center',
            }}
            className="admin-audit-log-filter-grid"
          >
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                value={draftQ}
                onChange={e => setDraftQ(e.target.value)}
                placeholder="Search resourceId…"
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 32px',
                  fontSize: 13,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md, 8px)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <select
              value={filter.action}
              onChange={e => setField('action', e.target.value)}
              style={selectStyle()}
            >
              <option value="">All actions</option>
              {facets?.actions.map(f => (
                <option key={f.value} value={f.value}>
                  {f.value} · {f.count}
                </option>
              ))}
            </select>

            <select
              value={filter.resource}
              onChange={e => setField('resource', e.target.value)}
              style={selectStyle()}
            >
              <option value="">All resources</option>
              {facets?.resources.map(f => (
                <option key={f.value} value={f.value}>
                  {f.value} · {f.count}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filter.from}
              onChange={e => setField('from', e.target.value)}
              aria-label="From date"
              style={selectStyle()}
            />
            <input
              type="date"
              value={filter.to}
              onChange={e => setField('to', e.target.value)}
              aria-label="To date"
              style={selectStyle()}
            />

            <button
              onClick={resetFilter}
              disabled={activeFilterCount === 0}
              style={{
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 600,
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md, 8px)',
                color:
                  activeFilterCount === 0
                    ? 'var(--text-muted)'
                    : 'var(--text-primary)',
                cursor: activeFilterCount === 0 ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <X size={12} />
              Clear
              {activeFilterCount > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    fontSize: 10,
                    fontWeight: 800,
                    background: 'var(--accent-primary)',
                    color: 'var(--text-on-accent, #fff)',
                    borderRadius: 999,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Secondary filters — chip-style active-state display */}
          {(filter.userId || filter.orgId) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginTop: 10,
                paddingTop: 10,
                borderTop: '1px dashed var(--border-color)',
              }}
            >
              <Filter size={12} style={{ color: 'var(--text-muted)' }} />
              {filter.userId && (
                <FilterChip
                  label={`user = ${truncate(filter.userId, 12)}`}
                  onClear={() => setField('userId', '')}
                />
              )}
              {filter.orgId && (
                <FilterChip
                  label={`org = ${truncate(filter.orgId, 12)}`}
                  onClear={() => setField('orgId', '')}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Result summary row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        <div>
          {loading
            ? 'Loading…'
            : error
              ? `Error: ${error}`
              : total === 0
                ? 'No audit events match'
                : `Showing ${offset + 1}–${Math.min(offset + rows.length, total)} of ${total.toLocaleString()}`}
        </div>
        <div>
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12.5,
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                {[
                  { key: 'time', label: 'Time', width: '170px' },
                  { key: 'action', label: 'Action', width: '180px' },
                  { key: 'resource', label: 'Resource', width: '120px' },
                  { key: 'resourceId', label: 'Resource ID', width: '220px' },
                  { key: 'actor', label: 'Actor', width: '180px' },
                  { key: 'org', label: 'Org', width: '160px' },
                  { key: 'ip', label: 'IP', width: '120px' },
                  { key: 'details', label: '', width: '80px' },
                ].map(col => (
                  <th
                    key={col.key}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      width: col.width,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && !error && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 'var(--spacing-2xl)',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                    }}
                  >
                    No audit events match the current filter.
                  </td>
                </tr>
              )}
              {rows.map(row => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onClick={() => setSelected(row)}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={cellStyle()}>
                    <div style={{ color: 'var(--text-primary)' }}>
                      {formatTime(row.createdAt)}
                    </div>
                  </td>
                  <td style={cellStyle()}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(var(--success-rgb), 0.08)',
                        color: 'var(--accent-primary)',
                        border: '1px solid rgba(var(--success-rgb), 0.2)',
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        fontFamily:
                          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                      }}
                    >
                      {row.action}
                    </span>
                  </td>
                  <td style={cellStyle()}>
                    <span
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 11.5,
                      }}
                    >
                      {row.resource}
                    </span>
                  </td>
                  <td style={cellStyle()}>
                    {row.resourceId && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          copyId(row.resourceId!);
                        }}
                        title={row.resourceId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '2px 8px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 6,
                          fontSize: 11,
                          fontFamily:
                            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          maxWidth: 200,
                        }}
                      >
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {copiedId === row.resourceId ? 'Copied' : truncate(row.resourceId, 18)}
                        </span>
                      </button>
                    )}
                  </td>
                  <td style={cellStyle()}>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setField('userId', row.userId);
                      }}
                      title={row.userId}
                      style={actorChipStyle()}
                    >
                      {truncate(row.userId, 14)}
                    </button>
                  </td>
                  <td style={cellStyle()}>
                    {row.orgId && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setField('orgId', row.orgId!);
                        }}
                        title={row.orgId}
                        style={actorChipStyle()}
                      >
                        {truncate(row.orgId, 14)}
                      </button>
                    )}
                  </td>
                  <td style={cellStyle()}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      {row.ipAddress ?? ''}
                    </span>
                  </td>
                  <td style={cellStyle()}>
                    {row.details != null && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        <FileJson size={11} />
                        details
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div
        style={{
          marginTop: 'var(--spacing-md)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          disabled={offset === 0 || loading}
          style={pageBtnStyle(offset === 0 || loading)}
        >
          <ChevronLeft size={13} /> Prev
        </button>
        <button
          onClick={() => setOffset(offset + PAGE_SIZE)}
          disabled={offset + rows.length >= total || loading}
          style={pageBtnStyle(offset + rows.length >= total || loading)}
        >
          Next <ChevronRight size={13} />
        </button>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            style={{ justifyContent: 'flex-end', padding: 0, zIndex: 100 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              style={{
                width: 'min(520px, 100vw)',
                height: '100vh',
                background: 'var(--bg-card)',
                borderLeft: '1px solid var(--border-color)',
                overflow: 'auto',
                padding: 'var(--spacing-xl)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 'var(--spacing-lg)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    Audit event
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      fontFamily:
                        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                    }}
                  >
                    {selected.action}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      marginTop: 3,
                    }}
                  >
                    {formatTime(selected.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close detail"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <DetailRow label="Event ID" value={selected.id} copyable onCopy={copyId} copied={copiedId === selected.id} />
              <DetailRow label="Resource" value={selected.resource} />
              <DetailRow
                label="Resource ID"
                value={selected.resourceId ?? '—'}
                copyable={!!selected.resourceId}
                onCopy={selected.resourceId ? copyId : undefined}
                copied={copiedId === selected.resourceId}
              />
              <DetailRow
                label="Actor"
                value={selected.userId}
                copyable
                onCopy={copyId}
                copied={copiedId === selected.userId}
              />
              <DetailRow label="Organisation" value={selected.orgId ?? '—'} />
              <DetailRow label="IP address" value={selected.ipAddress ?? '—'} />
              <DetailRow
                label="User agent"
                value={selected.userAgent ?? '—'}
                wrap
              />

              <div style={{ marginTop: 'var(--spacing-lg)' }}>
                <div className="section-heading" style={{ marginBottom: 6 }}>
                  Details payload
                </div>
                <pre
                  style={{
                    fontSize: 11.5,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: 12,
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto',
                    color: 'var(--text-secondary)',
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                    margin: 0,
                  }}
                >
                  {selected.details != null
                    ? JSON.stringify(selected.details, null, 2)
                    : '— no payload —'}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 4px 3px 10px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      }}
    >
      {label}
      <button
        onClick={onClear}
        aria-label={`Clear ${label}`}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 2,
          display: 'inline-flex',
        }}
      >
        <X size={10} />
      </button>
    </span>
  );
}

function DetailRow({
  label,
  value,
  copyable,
  copied,
  onCopy,
  wrap,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  copied?: boolean;
  onCopy?: (v: string) => void;
  wrap?: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid var(--border-color)',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          paddingTop: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          wordBreak: wrap ? 'break-word' : 'normal',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{value}</span>
        {copyable && onCopy && (
          <button
            onClick={() => onCopy(value)}
            aria-label="Copy"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '3px 7px',
              fontSize: 10,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily:
                'system-ui, -apple-system, "Segoe UI", sans-serif',
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Inline style helpers ─────────────────────────────────────────────

function selectStyle(): React.CSSProperties {
  return {
    padding: '8px 10px',
    fontSize: 13,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md, 8px)',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
  };
}

function cellStyle(): React.CSSProperties {
  return {
    padding: '10px 12px',
    verticalAlign: 'top',
  };
}

function actorChipStyle(): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    background: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: 6,
    fontSize: 11,
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    maxWidth: 160,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
}

function pageBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 600,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md, 8px)',
    color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
}
