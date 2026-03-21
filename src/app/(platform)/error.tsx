'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-6 text-center px-6 max-w-lg">
        <div
          className="flex items-center justify-center w-16 h-16"
          style={{
            background: 'rgba(248, 113, 113, 0.1)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
          }}
        >
          <AlertTriangle size={28} style={{ color: 'var(--error)' }} />
        </div>

        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Something went wrong
        </h1>

        {error.message && (
          <p
            className="text-sm px-4 py-3 w-full font-mono"
            style={{
              color: 'var(--text-muted)',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer"
            style={{
              color: 'var(--bg-primary)',
              background: 'var(--accent-primary)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
            }}
          >
            <RotateCcw size={16} />
            Try again
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: 'var(--text-secondary)',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
