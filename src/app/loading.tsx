"use client";

import { Loader2 } from 'lucide-react';

export default function RootLoading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4">
                <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                <p className="text-xs uppercase tracking-widest font-mono" style={{ color: 'var(--text-muted)' }}>
                    Loading...
                </p>
            </div>
        </div>
    );
}
