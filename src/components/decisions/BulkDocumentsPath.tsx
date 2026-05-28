'use client';

/**
 * BulkDocumentsPath — multi-doc upload flow for new decision containers.
 *
 * Shipped 2026-05-28 as Improvement #3 from the platform plan. The
 * wedge feature for M&A heads: upload CIM + synergy model + IC memo +
 * counsel review at once, into a single Decision Container, with
 * parallel analysis + automatic cross-doc conflict scan.
 *
 * Flow:
 *   1. User drops 2-6 files into the multi-file dropzone
 *   2. Component auto-suggests container name (from anchor filename),
 *      per-file documentType (synergy model / CIM / IC memo / etc.),
 *      and mode (defaults to defaultContainerKindForRole, can be
 *      overridden)
 *   3. User confirms container name + decision frame + per-file types
 *   4. Submit:
 *      - POST /api/containers → get containerId
 *      - flushDraftPriorsToContainer (if any)
 *      - For each file, POST /api/upload with containerId in parallel
 *        (orchestrated via Promise.allSettled — one file failing
 *        doesn't kill the others)
 *      - Per-file progress shown in real time
 *   5. Redirect to /dashboard/decisions/[id] when all complete
 *
 * Cross-doc conflict detection fires automatically on the detail page
 * once ≥2 docs land — no manual trigger required.
 *
 * Reuses the same /api/upload endpoint as DocumentPath; the orchestration
 * is the only new code path. Concurrency capped at 3 to stay within
 * HTTP/1.1 connection limits and not overwhelm the analysis pipeline.
 */

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Loader2,
  Sparkles,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import { createClientLogger } from '@/lib/utils/logger';
import {
  CONTAINER_MODES,
  CONTAINER_KINDS,
  type DecisionContainerKind,
} from '@/lib/data/decision-container-modes';
import { flushDraftPriorsToContainer } from '@/lib/priors/draft-handoff';

const log = createClientLogger('BulkDocumentsPath');

const MAX_FILES = 6;
const UPLOAD_CONCURRENCY = 3;

const DOCUMENT_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'other', label: 'Other / generic' },
  { value: 'ic_memo', label: 'IC Memo' },
  { value: 'cim', label: 'CIM (Confidential Info Memo)' },
  { value: 'synergy_model', label: 'Synergy Model' },
  { value: 'qofe', label: 'Quality of Earnings' },
  { value: 'integration_plan', label: 'Integration Plan' },
  { value: 'due_diligence', label: 'Due Diligence' },
  { value: 'term_sheet', label: 'Term Sheet' },
  { value: 'pitch_deck', label: 'Pitch Deck' },
];

function stripExtension(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function suggestDocumentType(filename: string): string {
  const name = filename.toLowerCase();
  if (/synerg|merger.*model|merger.*analysis/.test(name)) return 'synergy_model';
  if (/qof?e|quality.*earnings/.test(name)) return 'qofe';
  if (/cim|confidential.*info|info.*memo/.test(name)) return 'cim';
  if (/ic.?memo|investment.*comm|deal.*memo/.test(name)) return 'ic_memo';
  if (/integration.*plan|day.?1|day.?one|pmi/.test(name)) return 'integration_plan';
  if (/diligence|dd[._ -]/.test(name)) return 'due_diligence';
  if (/term.*sheet|loi[._ -]/.test(name)) return 'term_sheet';
  if (/pitch.*deck|investor.*deck/.test(name)) return 'pitch_deck';
  return 'other';
}

type FileStatus = 'queued' | 'uploading' | 'done' | 'error';

interface FileEntry {
  /** Stable id for React keys + status updates. */
  id: string;
  file: File;
  documentType: string;
  status: FileStatus;
  error?: string;
}

interface Props {
  defaultKind: DecisionContainerKind;
  onBack: () => void;
  onCreated: (containerId: string) => void;
}

export function BulkDocumentsPath({ defaultKind, onBack, onCreated }: Props) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<DecisionContainerKind>(defaultKind);
  const [decisionFrame, setDecisionFrame] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-name from the anchor (first) file when the user hasn't typed.
  useEffect(() => {
    if (entries.length > 0 && !name) {
      setName(stripExtension(entries[0]!.file.name));
    }
  }, [entries, name]);

  const handleFiles = (files: File[]) => {
    setError(null);
    const next: FileEntry[] = [];
    for (const f of files) {
      if (next.length + entries.length >= MAX_FILES) break;
      next.push({
        id: `${f.name}-${f.size}-${f.lastModified}-${next.length}`,
        file: f,
        documentType: suggestDocumentType(f.name),
        status: 'queued',
      });
    }
    setEntries(prev => [...prev, ...next]);
    if (files.length + entries.length > MAX_FILES) {
      setError(`Cap is ${MAX_FILES} files per decision. Some files were skipped.`);
    }
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateEntryType = (id: string, documentType: string) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, documentType } : e)));
  };

  const updateEntryStatus = (id: string, status: FileStatus, errMsg?: string) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, status, error: errMsg } : e)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entries.length === 0) {
      setError('Drop at least one file to upload.');
      return;
    }
    if (!name.trim()) {
      setError('Decision name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Step 1: create the container.
      const containerRes = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          name: name.trim(),
          decisionFrame: decisionFrame.trim() || null,
        }),
      });
      const containerJson = await containerRes.json().catch(() => null);
      if (!containerRes.ok) {
        throw new Error(containerJson?.error || 'Failed to create decision');
      }
      const containerId = containerJson.id as string;

      // Flush draft priors (fire-and-forget).
      void flushDraftPriorsToContainer(containerId);

      // Step 2: upload all files in parallel, capped at UPLOAD_CONCURRENCY.
      // Promise.allSettled + per-file slot orchestration. One file failing
      // doesn't kill the others — the user gets a partial-success state
      // they can retry from the detail page.
      const queue = [...entries];
      const inFlight = new Set<string>();
      const results: Array<{ id: string; ok: boolean; error?: string }> = [];

      async function uploadOne(entry: FileEntry) {
        inFlight.add(entry.id);
        updateEntryStatus(entry.id, 'uploading');
        try {
          const formData = new FormData();
          formData.append('file', entry.file);
          formData.append('containerId', containerId);
          formData.append('documentType', entry.documentType);
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (!uploadRes.ok) {
            const body = await uploadRes.json().catch(() => null);
            throw new Error(body?.error || `Upload failed (${uploadRes.status})`);
          }
          updateEntryStatus(entry.id, 'done');
          results.push({ id: entry.id, ok: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Unknown upload error';
          log.warn(`bulk upload failed for ${entry.file.name}`, msg);
          updateEntryStatus(entry.id, 'error', msg);
          results.push({ id: entry.id, ok: false, error: msg });
        } finally {
          inFlight.delete(entry.id);
        }
      }

      // Worker-pool pattern: spin up UPLOAD_CONCURRENCY workers that
      // each pull from the queue until empty.
      const workers: Promise<void>[] = [];
      const startWorker = async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (!next) break;
          await uploadOne(next);
        }
      };
      for (let i = 0; i < UPLOAD_CONCURRENCY; i++) {
        workers.push(startWorker());
      }
      await Promise.all(workers);

      // Even partial success is OK — the container exists + the user
      // can retry failed uploads from the detail page. Surface a soft
      // warning if any failed, but route through to the detail page.
      const failedCount = results.filter(r => !r.ok).length;
      if (failedCount > 0) {
        setError(
          `${failedCount} of ${entries.length} uploads failed. The container exists — open the detail page to retry attaching them.`
        );
        // Brief delay so the user sees the partial state before redirect.
        setTimeout(() => onCreated(containerId), 1500);
      } else {
        onCreated(containerId);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unexpected error creating decision';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          background: 'transparent',
          border: 'none',
          cursor: submitting ? 'not-allowed' : 'pointer',
          padding: 0,
          marginBottom: 16,
        }}
      >
        <ChevronLeft size={12} /> Pick a different path
      </button>

      <AccentCard
        accent="primary"
        thickness={3}
        title={
          <>
            <Upload size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>Bulk upload + audit</span>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-secondary)',
              marginBottom: 12,
              lineHeight: 1.55,
            }}
          >
            Drop up to {MAX_FILES} files for one decision (e.g. CIM + synergy model + IC memo +
            counsel review). All audited in parallel; cross-doc conflict scan fires automatically
            once ≥2 are analyzed.
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const files = Array.from(e.dataTransfer.files ?? []);
              if (files.length > 0) handleFiles(files);
            }}
            onClick={() => !submitting && inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '24px 20px',
              textAlign: 'center',
              cursor: submitting ? 'not-allowed' : 'pointer',
              background: dragOver ? 'rgba(22, 163, 74, 0.04)' : 'var(--bg-secondary)',
              transition: 'border-color 0.15s, background 0.15s',
              marginBottom: 16,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.csv,.pptx,.txt,.md"
              onChange={e => {
                const files = Array.from(e.target.files ?? []);
                if (files.length > 0) handleFiles(files);
                // Clear so the same files can be re-selected after removal.
                if (inputRef.current) inputRef.current.value = '';
              }}
              style={{ display: 'none' }}
              disabled={submitting}
            />
            <Upload
              size={22}
              style={{
                color: 'var(--text-muted)',
                margin: '0 auto 8px',
                display: 'block',
              }}
            />
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, marginBottom: 4 }}>
              {entries.length === 0
                ? 'Drop files here, or click to browse'
                : `Add more files (${MAX_FILES - entries.length} slot${MAX_FILES - entries.length === 1 ? '' : 's'} left)`}
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
              PDF · DOCX · XLSX · CSV · PPTX · TXT · MD
            </div>
          </div>

          {/* File list */}
          {entries.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 18,
              }}
            >
              {entries.map(e => (
                <FileRow
                  key={e.id}
                  entry={e}
                  onRemove={() => removeEntry(e.id)}
                  onTypeChange={t => updateEntryType(e.id, t)}
                  disabled={submitting && e.status !== 'queued'}
                />
              ))}
            </div>
          )}

          {/* Container metadata */}
          {entries.length > 0 && (
            <>
              <FormFieldLabel>Decision name *</FormFieldLabel>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                disabled={submitting}
                style={inputStyle}
              />

              <FormFieldLabel hint="Optional — the line the committee has to vote yes/no on.">
                Decision frame
              </FormFieldLabel>
              <textarea
                value={decisionFrame}
                onChange={e => setDecisionFrame(e.target.value)}
                rows={2}
                disabled={submitting}
                style={{ ...inputStyle, resize: 'vertical' }}
              />

              <FormFieldLabel>Mode</FormFieldLabel>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 6,
                  marginBottom: 14,
                }}
              >
                {CONTAINER_KINDS.map(k => {
                  const m = CONTAINER_MODES[k];
                  const active = kind === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      disabled={submitting}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        background: active ? 'rgba(22, 163, 74, 0.06)' : 'var(--bg-secondary)',
                        color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
                        fontSize: 'var(--fs-xs)',
                        fontWeight: active ? 600 : 500,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {error && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.06)',
                color: 'var(--error)',
                fontSize: 'var(--fs-sm)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onBack} disabled={submitting} style={cancelButtonStyle}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={entries.length === 0 || !name.trim() || submitting}
              style={{
                ...primaryButtonStyle,
                opacity: entries.length === 0 || !name.trim() || submitting ? 0.55 : 1,
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading {entries.filter(e => e.status === 'done').length} of {entries.length}…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Create + run {entries.length} audit{entries.length === 1 ? '' : 's'}
                </>
              )}
            </button>
          </div>
        </form>
      </AccentCard>
    </div>
  );
}

// ─── FileRow ─────────────────────────────────────────────────────────

function FileRow({
  entry,
  onRemove,
  onTypeChange,
  disabled,
}: {
  entry: FileEntry;
  onRemove: () => void;
  onTypeChange: (t: string) => void;
  disabled: boolean;
}) {
  const statusColor: Record<FileStatus, string> = {
    queued: 'var(--text-muted)',
    uploading: 'var(--accent-primary)',
    done: 'var(--success)',
    error: 'var(--error)',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${statusColor[entry.status]}`,
        borderRadius: 'var(--radius-md)',
        flexWrap: 'wrap',
      }}
    >
      {/* Status icon */}
      <div style={{ flexShrink: 0, color: statusColor[entry.status] }}>
        {entry.status === 'uploading' ? (
          <Loader2 size={14} className="animate-spin" />
        ) : entry.status === 'done' ? (
          <CheckCircle size={14} />
        ) : entry.status === 'error' ? (
          <XCircle size={14} />
        ) : (
          <Upload size={14} />
        )}
      </div>

      {/* Filename + size */}
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--fs-sm)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.file.name}
        </div>
        <div style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>
          {(entry.file.size / 1024 / 1024).toFixed(2)} MB
          {entry.error && (
            <>
              {' '}
              · <span style={{ color: 'var(--error)' }}>{entry.error}</span>
            </>
          )}
        </div>
      </div>

      {/* Document-type selector */}
      <select
        value={entry.documentType}
        onChange={e => onTypeChange(e.target.value)}
        disabled={disabled || entry.status !== 'queued'}
        style={{
          padding: '4px 8px',
          fontSize: 'var(--fs-2xs)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          cursor: disabled || entry.status !== 'queued' ? 'not-allowed' : 'pointer',
        }}
      >
        {DOCUMENT_TYPE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Remove button — only when queued */}
      {entry.status === 'queued' && !disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove file"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Styled helpers (mirror DocumentPath's inline styles) ────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--fs-sm)',
  color: 'var(--text-primary)',
  marginBottom: 14,
  fontFamily: 'inherit',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--accent-primary)',
  color: '#fff',
  border: 'none',
  fontSize: 'var(--fs-sm)',
  fontWeight: 600,
};

const cancelButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-color)',
  fontSize: 'var(--fs-sm)',
  fontWeight: 500,
  cursor: 'pointer',
};

function FormFieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label
        style={{
          fontSize: 'var(--fs-xs)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          display: 'block',
          marginBottom: 2,
        }}
      >
        {children}
      </label>
      {hint && (
        <div
          style={{
            fontSize: 'var(--fs-3xs)',
            color: 'var(--text-muted)',
            marginBottom: 4,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
