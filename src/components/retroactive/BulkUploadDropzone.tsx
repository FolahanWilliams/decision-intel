'use client';

/**
 * BulkUploadDropzone — drag-and-drop entry point for the retroactive
 * audit-mode bulk-upload flow. Locked 2026-05-21 (Adaptation #1).
 *
 * Posts a multipart FormData payload to /api/retroactive/bulk-upload —
 * the server parses each file, classifies role (memo/outcome/mixed),
 * extracts entities + dates, runs the bulk-pairing engine, and returns
 * a `BulkPairingResult` the parent renders via RetroactivePairingReview.
 *
 * Caps mirror the server: 30 files / 50MB total / 100B min per file.
 */

import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, FileText, FolderUp, Loader2, Upload, X } from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import {
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
  FILE_TYPE_LABELS,
} from '@/lib/constants/file-types';
import type { BulkPairingResult } from '@/lib/retroactive/types';

const MAX_FILES = 30;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const MIN_FILE_BYTES = 100;

interface FileErrorLine {
  filename: string;
  reason: string;
}

export interface BulkUploadDropzoneProps {
  /** Fires when the server returns a parsed BulkPairingResult. */
  onResult: (result: BulkPairingResult, errors: FileErrorLine[]) => void;
  /** Disabled while parent is processing the result. */
  disabled?: boolean;
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function fileExtensionLower(name: string): string {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i).toLowerCase();
}

function isAcceptedFile(f: File): boolean {
  if ((SUPPORTED_MIME_TYPES as readonly string[]).includes(f.type)) return true;
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(fileExtensionLower(f.name));
}

export function BulkUploadDropzone({ onResult, disabled }: BulkUploadDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  const addFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      const accepted: File[] = [];
      const rejections: string[] = [];
      for (const f of incoming) {
        if (!isAcceptedFile(f)) {
          rejections.push(`${f.name}: unsupported type`);
          continue;
        }
        if (f.size < MIN_FILE_BYTES) {
          rejections.push(`${f.name}: too small (<${MIN_FILE_BYTES} bytes)`);
          continue;
        }
        accepted.push(f);
      }
      const next = [...files, ...accepted];
      if (next.length > MAX_FILES) {
        setError(`Capped at ${MAX_FILES} files per upload.`);
        return;
      }
      const nextBytes = next.reduce((acc, f) => acc + f.size, 0);
      if (nextBytes > MAX_TOTAL_BYTES) {
        setError(`Total upload exceeds ${MAX_TOTAL_BYTES / 1024 / 1024} MB.`);
        return;
      }
      if (rejections.length > 0) setError(rejections.join(' · '));
      setFiles(next);
    },
    [files]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled || isUploading) return;
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles, disabled, isUploading]
  );

  const handleFilePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      addFiles(Array.from(e.target.files));
      // Reset the input so picking the same file twice still fires onChange.
      e.target.value = '';
    },
    [addFiles]
  );

  const removeFile = useCallback((idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const submit = useCallback(async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      for (const f of files) fd.append('files', f);
      const res = await fetch('/api/retroactive/bulk-upload', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        // canonical res.json() body-parse exception class — surface
        // the API's diagnostic when present, otherwise the status.
        throw new Error(body?.error ?? `Upload failed (HTTP ${res.status})`);
      }
      const json = (await res.json()) as {
        pairing: BulkPairingResult;
        fileErrors: FileErrorLine[];
      };
      onResult(json.pairing, json.fileErrors ?? []);
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [files, onResult]);

  return (
    <AccentCard
      accent="primary"
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderUp size={16} color="var(--accent-primary)" />
          <span>Bulk upload historical decisions</span>
        </span>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
        Drop up to {MAX_FILES} files (≤ {MAX_TOTAL_BYTES / 1024 / 1024} MB total). Memos and their
        outcome documents can be uploaded together — the pairing engine matches them by entity
        overlap, temporal proximity, and content similarity.
      </p>

      <div
        onDragEnter={e => {
          e.preventDefault();
          if (!disabled && !isUploading) setIsDragging(true);
        }}
        onDragLeave={e => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          textAlign: 'center',
          cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
          background: isDragging
            ? 'color-mix(in srgb, var(--accent-primary) 6%, var(--bg-card))'
            : 'var(--bg-secondary)',
          transition: 'border-color 150ms, background 150ms',
          opacity: disabled || isUploading ? 0.6 : 1,
        }}
      >
        <Upload
          size={28}
          color="var(--text-muted)"
          style={{ margin: '0 auto 8px', display: 'block' }}
        />
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
          Drop files or click to browse
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          {FILE_TYPE_LABELS}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={SUPPORTED_EXTENSIONS.join(',')}
          onChange={handleFilePick}
          style={{ display: 'none' }}
          disabled={disabled || isUploading}
        />
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {files.length} file{files.length === 1 ? '' : 's'} queued
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {formatBytes(totalBytes)} / {MAX_TOTAL_BYTES / 1024 / 1024} MB
            </span>
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              maxHeight: 240,
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {files.map((f, idx) => (
              <li
                key={`${f.name}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderBottom: idx === files.length - 1 ? 'none' : '1px solid var(--border-color)',
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <FileText size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {f.name}
                  </span>
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {formatBytes(f.size)}
                  </span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    disabled={isUploading}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      color: 'var(--text-muted)',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'color-mix(in srgb, var(--error) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--error) 25%, transparent)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setFiles([]);
            setError(null);
          }}
          disabled={isUploading || files.length === 0}
          style={{
            padding: '8px 14px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontSize: 13,
            cursor: isUploading || files.length === 0 ? 'not-allowed' : 'pointer',
            opacity: isUploading || files.length === 0 ? 0.5 : 1,
          }}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isUploading || files.length === 0 || disabled}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: isUploading || files.length === 0 || disabled ? 'not-allowed' : 'pointer',
            opacity: isUploading || files.length === 0 || disabled ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isUploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Parsing + pairing…</span>
            </>
          ) : (
            <>
              <Upload size={14} />
              <span>Run pairing engine</span>
            </>
          )}
        </button>
      </div>
    </AccentCard>
  );
}
