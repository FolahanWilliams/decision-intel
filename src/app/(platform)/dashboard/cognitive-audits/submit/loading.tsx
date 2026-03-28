'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 'var(--spacing-lg, 1.5rem)',
      }}
    >
      <Loader2 className="animate-spin" style={{ width: 36, height: 36, color: 'var(--text-secondary, #6b7280)' }} />
      <p style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '0.875rem' }}>Loading audit submission...</p>
    </div>
  );
}
