'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, FileText } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-[50vh]">
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
          Dashboard Error
        </h1>

        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          The dashboard encountered an issue loading. This is usually temporary &mdash; try
          refreshing the page.
        </p>

        {error.digest && (
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            Error ID: {error.digest}
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
            Reload Dashboard
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
            <FileText size={16} />
            View Documents
          </Link>
        </div>
      </div>
    </div>
  );
}
