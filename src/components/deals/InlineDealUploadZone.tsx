'use client';

/**
 * InlineDealUploadZone — C3/S9 lock 2026-04-30.
 *
 * Drop-zone variant of `UploadToDealButton` rendered inline at the top
 * of the deal documents tab. The header CTA stays (`UploadToDealButton`
 * is the primary verb up there); this is the discoverability lift the
 * analyst persona (Chidi) flagged — when you're in the documents tab
 * five clicks deep, you don't want to scroll back to the page header
 * to upload another DD memo. Drag a PDF onto the tab, drop, done.
 *
 * Same backend semantics as UploadToDealButton: POST FormData to
 * /api/upload with { file, dealId }. On success the parent calls
 * `onUploaded()` to mutate the deal-detail SWR cache.
 *
 * Multi-file drops are processed sequentially (one POST per file) so
 * each file streams through the canonical analysis pipeline cleanly
 * rather than racing through a batch endpoint that doesn't exist yet.
 * Bulk-import via folder drag/drop is a future ship; for now this is
 * the inline-equivalent of the existing dashboard upload zone.
 */

import { useCallback, useRef, useState } from 'react';
import { Upload, Loader2, FilePlus } from 'lucide-react';
import { useToast } from '@/components/ui/EnhancedToast';

interface Props {
  dealId: string;
  dealName: string;
  onUploaded?: () => void;
}

const ACCEPTED = '.pdf,.docx,.txt,.md';

export function InlineDealUploadZone({ dealId, dealName, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const { showToast } = useToast();

  const uploadFile = useCallback(
    async (file: File): Promise<boolean> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dealId', dealId);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        showToast(data.error || `Upload failed for ${file.name} (${res.status})`, 'error');
        return false;
      }
      return true;
    },
    [dealId, showToast]
  );

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      setUploading(true);
      setProgress({ done: 0, total: list.length });
      let succeeded = 0;
      for (let i = 0; i < list.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop -- sequential by design (see component header)
        const ok = await uploadFile(list[i]);
        if (ok) succeeded += 1;
        setProgress({ done: i + 1, total: list.length });
      }
      setUploading(false);
      setProgress(null);
      if (succeeded > 0) {
        showToast(
          succeeded === list.length
            ? `${succeeded} document${succeeded === 1 ? '' : 's'} uploaded to ${dealName}. Analysis running.`
            : `${succeeded} of ${list.length} uploaded; the rest failed (see prior toasts).`,
          succeeded === list.length ? 'success' : 'warning'
        );
        onUploaded?.();
      }
    },
    [uploadFile, dealName, onUploaded, showToast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.length) {
        void processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleClick = useCallback(() => inputRef.current?.click(), []);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      await processFiles(files);
      if (inputRef.current) inputRef.current.value = '';
    },
    [processFiles]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        cursor: uploading ? 'wait' : 'pointer',
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        border: dragActive
          ? '2px dashed var(--accent-primary)'
          : '1px dashed var(--border-color)',
        background: dragActive ? 'rgba(22, 163, 74, 0.04)' : 'var(--bg-card)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'all 0.15s',
        marginBottom: 12,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-sm)',
          background: dragActive ? 'rgba(22, 163, 74, 0.10)' : 'var(--bg-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--accent-primary)',
        }}
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : dragActive ? (
          <FilePlus size={16} />
        ) : (
          <Upload size={16} />
        )}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 2,
          }}
        >
          {uploading
            ? progress
              ? `Uploading ${progress.done} of ${progress.total}…`
              : 'Uploading…'
            : dragActive
              ? `Drop to upload to ${dealName}`
              : `Drop a document or click to upload to ${dealName}`}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
          PDF, DOCX, TXT, or Markdown · multi-file drops processed sequentially · analysis
          starts automatically
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
