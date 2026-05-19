'use client';

import { LogicalAnalysisResult } from '@/types';
import { AlertOctagon, Info } from 'lucide-react';

export function FallacyList({ data }: { data: LogicalAnalysisResult }) {
  if (!data || data.fallacies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border">
        <div
          className="w-12 h-12 flex items-center justify-center mb-3"
          style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)' }}
        >
          <Info className="w-6 h-6" style={{ color: 'var(--success)' }} />
        </div>
        <h4 className="font-medium">No Fallacies Detected</h4>
        <p className="text-sm text-muted-foreground">
          The reasoning in this document appears logically sound.
        </p>
      </div>
    );
  }

  // Canonical light-theme severity tokens. Severity→intent preserved:
  // critical=error · high=severity-high · medium=warning · other=info
  // (the original `default` branch was blue/informational, not green —
  // mapped to var(--info) to preserve the visual intent, not var(--success)).
  const severityStyle = (s: string): { text: string; bg: string; border: string } => {
    const v =
      s === 'critical'
        ? 'var(--error)'
        : s === 'high'
          ? 'var(--severity-high)'
          : s === 'medium'
            ? 'var(--warning)'
            : 'var(--info)';
    return {
      text: v,
      bg: `color-mix(in srgb, ${v} 10%, transparent)`,
      border: `color-mix(in srgb, ${v} 20%, transparent)`,
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Detected Fallacies</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Logic Score:</span>
          <span
            className="text-lg font-bold"
            style={{ color: data.score > 80 ? 'var(--success)' : 'var(--warning)' }}
          >
            {data.score}/100
          </span>
        </div>
      </div>

      {data.fallacies.map((f, i) => {
        const sc = severityStyle(f.severity);
        return (
          <div key={i} className="p-4 border bg-card" style={{ borderColor: sc.border }}>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <span
                  className="inline-block px-2 py-0.5 text-xs font-medium mb-1"
                  style={{ color: sc.text, background: sc.bg }}
                >
                  {f.severity}
                </span>
                <h4 className="font-semibold text-foreground">{f.name}</h4>
              </div>
              <AlertOctagon className="w-5 h-5" style={{ color: sc.text }} />
            </div>

            <div className="pl-4 border-l-2 border-border my-3 italic text-muted-foreground text-sm">
              &quot;{f.excerpt}&quot;
            </div>

            <p className="text-sm">
              <span className="font-medium text-foreground">Why it&apos;s fallacious: </span>
              {f.explanation}
            </p>
          </div>
        );
      })}
    </div>
  );
}
