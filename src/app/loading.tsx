'use client';

import { Loader2 } from 'lucide-react';

export default function RootLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        <p className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
          Loading...
        </p>
      </div>
    </div>
  );
}
