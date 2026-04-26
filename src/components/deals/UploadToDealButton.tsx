'use client';

/**
 * One-click upload that pre-binds the file to a Deal (3.1).
 *
 * Renders a button that opens a hidden file input. On select, POSTs to
 * /api/upload with FormData { file, dealId }, then mutate()s the parent
 * deal hook so the new doc shows up. The actual analysis pipeline
 * continues to run via the existing /api/analyze/stream worker — this
 * component does NOT trigger analysis directly. The pattern matches how
 * the dashboard upload component does it today, so behaviour is uniform.
 */

import { useRef, useState, useCallback } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/EnhancedToast';

interface Props {
  dealId: string;
  dealName: string;
  /** Called after the upload succeeds so the parent can refresh its data. */
  onUploaded?: () => void;
  variant?: 'primary' | 'secondary';
}

export function UploadToDealButton({ dealId, dealName, onUploaded, variant = 'primary' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('dealId', dealId);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || `Upload failed (${res.status})`, 'error');
          return;
        }
        showToast(`Uploaded to ${dealName}. Analysis running.`, 'success');
        onUploaded?.();
      } catch {
        showToast('Upload failed. Please try again.', 'error');
      } finally {
        setUploading(false);
        // Reset the input so re-selecting the same file fires onChange.
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [dealId, dealName, onUploaded, showToast]
  );

  const isPrimary = variant === 'primary';

  return (
    <>
      <button
        onClick={handleClick}
        disabled={uploading}
        className={isPrimary ? 'btn btn-primary' : 'btn btn-outline'}
        style={{
          padding: isPrimary ? '8px 16px' : '6px 12px',
          fontSize: 12.5,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          cursor: uploading ? 'wait' : 'pointer',
        }}
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {uploading ? 'Uploading…' : `Upload to ${dealName}`}
      </button>
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        style={{ display: 'none' }}
        accept=".pdf,.docx,.txt,.md"
      />
    </>
  );
}
