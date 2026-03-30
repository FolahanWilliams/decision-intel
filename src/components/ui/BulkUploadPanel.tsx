'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, FileText, Loader2, CheckCircle, AlertTriangle, FolderUp } from 'lucide-react';
import {
  SUPPORTED_MIME_TYPES,
  SUPPORTED_EXTENSIONS,
  FILE_TYPE_LABELS,
} from '@/lib/constants/file-types';

interface FileEntry {
  file: File;
  status: 'queued' | 'uploading' | 'complete' | 'failed';
  error?: string;
}

interface BatchStatus {
  id: string;
  status: string;
  totalFiles: number;
  completed: number;
  failed: number;
  errors: Array<{ filename: string; error: string }>;
}

const MAX_FILES = 10;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = SUPPORTED_MIME_TYPES as readonly string[];
const ACCEPTED_EXTENSIONS = SUPPORTED_EXTENSIONS as readonly string[];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface BulkUploadPanelProps {
  onComplete?: () => void;
}

export function BulkUploadPanel({ onComplete }: BulkUploadPanelProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [batch, setBatch] = useState<BatchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Clear polling interval on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_TYPES.includes(file.type)) {
      return `Unsupported file type: ${ext}`;
    }
    if (file.size > MAX_SIZE) {
      return `File too large (${formatSize(file.size)}, max ${formatSize(MAX_SIZE)})`;
    }
    return null;
  };

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const arr = Array.from(newFiles);
      const remaining = MAX_FILES - files.length;
      if (remaining <= 0) {
        setError(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const toAdd: FileEntry[] = [];
      for (const file of arr.slice(0, remaining)) {
        const validationError = validateFile(file);
        if (validationError) {
          toAdd.push({ file, status: 'failed', error: validationError });
        } else {
          toAdd.push({ file, status: 'queued' });
        }
      }

      if (arr.length > remaining) {
        setError(`Only ${remaining} more file${remaining !== 1 ? 's' : ''} can be added`);
      }

      setFiles(prev => [...prev, ...toAdd]);
      setError(null);
    },
    [files.length]
  );

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const validFiles = files.filter(f => f.status === 'queued');
    if (validFiles.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    for (const entry of validFiles) {
      formData.append('files', entry.file);
    }

    try {
      const res = await fetch('/api/upload/bulk', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Upload failed' }));
        setError(data.error || 'Bulk upload failed');
        setUploading(false);
        return;
      }

      const data = await res.json();
      setBatch({
        id: data.batchId,
        status: 'processing',
        totalFiles: data.totalFiles,
        completed: 0,
        failed: 0,
        errors: [],
      });

      // Poll for status
      const pollStatus = async () => {
        try {
          const statusRes = await fetch(`/api/upload/bulk?batchId=${data.batchId}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const b = statusData.batch || statusData;
            setBatch({
              id: data.batchId,
              status: b.status,
              totalFiles: b.totalFiles || data.totalFiles,
              completed: b.completed || statusData.progress?.completed || 0,
              failed: b.failed || statusData.progress?.failed || 0,
              errors: b.errors || [],
            });

            if (b.status === 'completed' || b.status === 'failed') {
              if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }
              setUploading(false);
              onComplete?.();
            }
          }
        } catch {
          // Polling error — will retry on next interval
        }
      };

      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
      pollRef.current = setInterval(pollStatus, 3000);
      // Also poll immediately
      pollStatus();
    } catch {
      setError('Failed to start bulk upload');
      setUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const validCount = files.filter(f => f.status === 'queued').length;
  const progress = batch
    ? Math.round(((batch.completed + batch.failed) / Math.max(1, batch.totalFiles)) * 100)
    : 0;

  return (
    <div
      className="card mb-lg animate-fade-in"
      style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
    >
      <div className="card-header flex items-center justify-between">
        <h3 className="flex items-center gap-sm text-sm font-semibold">
          <FolderUp size={16} />
          Bulk Upload
          <span className="text-xs text-muted font-normal">Up to {MAX_FILES} files</span>
        </h3>
      </div>
      <div className="card-body">
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-center gap-sm"
            style={{
              padding: '8px 12px',
              background: 'rgba(248, 113, 113, 0.08)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: '#f87171',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            <AlertTriangle size={14} aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Drop zone (only when not uploading) */}
        {!uploading && !batch && (
          <div
            role="button"
            tabIndex={0}
            aria-label={`Drop files here or click to browse. Accepted: ${FILE_TYPE_LABELS}. Maximum 10 MB each.`}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            style={{
              padding: 'var(--spacing-lg)',
              border: '2px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
              marginBottom: files.length > 0 ? 'var(--spacing-md)' : 0,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              hidden
              multiple
              aria-label="Select files to upload"
              accept=".pdf,.txt,.md,.docx,.xlsx,.csv,.html,.htm,.pptx"
              onChange={e => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <Upload
              size={20}
              aria-hidden="true"
              style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }}
            />
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Drop files here or click to browse
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {FILE_TYPE_LABELS} · Max 10 MB each
            </p>
          </div>
        )}

        {/* File queue */}
        {files.length > 0 && !batch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {files.map((entry, idx) => (
              <div
                key={`${entry.file.name}-${idx}`}
                className="flex items-center gap-sm"
                style={{
                  padding: '6px 10px',
                  background:
                    entry.status === 'failed'
                      ? 'rgba(248, 113, 113, 0.06)'
                      : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                }}
              >
                <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: entry.status === 'failed' ? '#f87171' : 'var(--text-primary)',
                  }}
                >
                  {entry.file.name}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', flexShrink: 0 }}>
                  {entry.error || formatSize(entry.file.size)}
                </span>
                {!uploading && (
                  <button
                    onClick={() => removeFile(idx)}
                    aria-label={`Remove ${entry.file.name}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}

            {/* Upload button */}
            <div
              className="flex items-center justify-between"
              style={{ marginTop: 'var(--spacing-sm)' }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {validCount} file{validCount !== 1 ? 's' : ''} ready
              </span>
              <button
                onClick={handleUpload}
                disabled={validCount === 0 || uploading}
                className="btn btn-primary flex items-center gap-xs text-xs"
              >
                <Upload size={14} />
                Upload {validCount > 0 ? `${validCount} File${validCount !== 1 ? 's' : ''}` : ''}
              </button>
            </div>
          </div>
        )}

        {/* Batch progress */}
        {batch && (
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                {batch.status === 'completed' ? (
                  <span className="flex items-center gap-xs" style={{ color: '#34d399' }}>
                    <CheckCircle size={14} />
                    Upload Complete
                  </span>
                ) : batch.status === 'failed' ? (
                  <span className="flex items-center gap-xs" style={{ color: '#f87171' }}>
                    <AlertTriangle size={14} />
                    Upload Failed
                  </span>
                ) : (
                  <span
                    className="flex items-center gap-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                  </span>
                )}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {batch.completed}/{batch.totalFiles} complete
                {batch.failed > 0 && `, ${batch.failed} failed`}
              </span>
            </div>

            {/* Progress bar */}
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Upload progress: ${progress}% complete`}
              style={{
                height: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background:
                    batch.status === 'failed'
                      ? '#f87171'
                      : batch.status === 'completed'
                        ? '#34d399'
                        : '#6366f1',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* Errors */}
            {batch.errors.length > 0 && (
              <div role="alert" aria-live="polite" style={{ marginTop: 'var(--spacing-sm)' }}>
                {batch.errors.map((err, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '11px',
                      color: '#f87171',
                      padding: '2px 0',
                    }}
                  >
                    {err.filename}: {err.error}
                  </div>
                ))}
              </div>
            )}

            {/* Reset */}
            {(batch.status === 'completed' || batch.status === 'failed') && (
              <button
                onClick={() => {
                  setBatch(null);
                  setFiles([]);
                }}
                className="btn btn-ghost text-xs"
                style={{ marginTop: 'var(--spacing-sm)' }}
              >
                Upload More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
