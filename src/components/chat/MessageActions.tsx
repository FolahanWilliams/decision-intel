'use client';

import { useState } from 'react';
import { Copy, Bookmark, BookmarkCheck, RefreshCw, Check } from 'lucide-react';

interface MessageActionsProps {
  content: string;
  messageId: string;
  role: 'user' | 'assistant';
  isBookmarked: boolean;
  onToggleBookmark: (messageId: string) => void;
  onRetry?: () => void;
}

export function MessageActions({
  content,
  messageId,
  role,
  isBookmarked,
  onToggleBookmark,
  onRetry,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  };

  return (
    <div
      className="message-actions"
      style={{
        position: 'absolute',
        top: '-4px',
        right: role === 'user' ? '12px' : undefined,
        left: role === 'assistant' ? '48px' : undefined,
        display: 'flex',
        gap: '2px',
        padding: '2px 4px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 5,
        opacity: 0,
        transition: 'opacity 0.15s',
        pointerEvents: 'auto',
      }}
    >
      <button
        onClick={handleCopy}
        title="Copy message"
        aria-label="Copy message"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: copied ? 'var(--success)' : 'var(--text-muted)',
          display: 'flex',
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
      <button
        onClick={() => onToggleBookmark(messageId)}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark message'}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark message'}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: isBookmarked ? 'var(--warning)' : 'var(--text-muted)',
          display: 'flex',
        }}
      >
        {isBookmarked ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
      </button>
      {role === 'assistant' && onRetry && (
        <button
          onClick={onRetry}
          title="Retry response"
          aria-label="Retry response"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--text-muted)',
            display: 'flex',
          }}
        >
          <RefreshCw size={12} />
        </button>
      )}
    </div>
  );
}
