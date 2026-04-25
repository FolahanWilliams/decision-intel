'use client';

import { useCallback, useEffect, useState } from 'react';
import { Layers, AlertTriangle, ChevronDown, Globe } from 'lucide-react';

type StructuralAssumption = {
  determinantId: string;
  determinantLabel?: string;
  category?: string;
  assumption: string;
  defensibility: 'well_supported' | 'partially_supported' | 'unsupported' | 'contradicted';
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidenceFromMemo?: string;
  hardeningQuestion?: string;
};

type StructuralAudit = {
  structuralAssumptions: StructuralAssumption[];
  summary: string;
  framework: 'dalio-18-determinants';
  generatedAt: string;
};

interface Props {
  analysisId: string;
  /**
   * When true, automatically run the audit on mount. When false, render a
   * "Run structural audit" button and only fetch on click. Defaults true.
   */
  autoRun?: boolean;
}

const SEVERITY_STYLES: Record<
  StructuralAssumption['severity'],
  { badge: string; border: string; dot: string }
> = {
  critical: {
    badge: 'bg-red-500/15 text-red-300',
    border: 'border-red-500/40',
    dot: 'bg-red-400',
  },
  high: {
    badge: 'bg-orange-500/15 text-orange-300',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
  },
  medium: {
    badge: 'bg-amber-500/15 text-amber-300',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  low: {
    badge: 'bg-blue-500/10 text-blue-300',
    border: 'border-blue-500/20',
    dot: 'bg-blue-400',
  },
};

const DEFENSIBILITY_LABELS: Record<StructuralAssumption['defensibility'], string> = {
  well_supported: 'Well supported',
  partially_supported: 'Partially supported',
  unsupported: 'Unsupported',
  contradicted: 'Contradicted by memo',
};

const CATEGORY_LABELS: Record<string, string> = {
  cycles: 'Cycles (debt, currency, inflation)',
  power: 'Power (economic, trade, reserve currency)',
  fundamentals: 'Fundamentals (education, innovation, infrastructure)',
  internal: 'Internal (governance, civility, wealth gaps)',
  external: 'External (geology, nature)',
};

export function StructuralAssumptionsPanel({ analysisId, autoRun = true }: Props) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; data: StructuralAudit }
    | { status: 'error'; message: string }
  >(autoRun ? { status: 'loading' } : { status: 'idle' });
  const [expanded, setExpanded] = useState(true);

  const runAudit = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const res = await fetch(`/api/analysis/${analysisId}/structural-assumptions`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Audit failed (${res.status})`);
      }
      const data = (await res.json()) as StructuralAudit;
      setState({ status: 'ready', data });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Structural audit failed',
      });
    }
  }, [analysisId]);

  useEffect(() => {
    if (autoRun) {
      void runAudit();
    }
  }, [autoRun, runAudit]);

  const assumptions =
    state.status === 'ready' ? state.data.structuralAssumptions : [];
  const hasFindings = assumptions.length > 0;

  return (
    <div className="card mt-lg">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full card-header flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
          <div className="text-left">
            <h3 className="text-base flex items-center gap-2">
              Structural Assumptions
              {state.status === 'ready' && hasFindings && (
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                  {assumptions.length} flagged
                </span>
              )}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Dalio 18-determinant macro lens — the structural bets this memo is making, beyond cognitive bias
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="card-body">
          {state.status === 'idle' && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted">
                Run a macro-layer audit across 18 rise-and-fall determinants (debt cycle, currency cycle, reserve-currency status, governance, infrastructure, trade).
              </p>
              <button
                onClick={runAudit}
                className="button button-primary"
                style={{ fontSize: 13 }}
              >
                Run structural audit
              </button>
            </div>
          )}

          {state.status === 'loading' && (
            <div className="flex items-center gap-3 py-4">
              <Globe size={16} className="animate-pulse" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm text-muted">
                Running Dalio structural audit across 18 determinants…
              </span>
            </div>
          )}

          {state.status === 'error' && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm" style={{ color: 'var(--severity-high)' }}>
                {state.message}
              </p>
              <button onClick={runAudit} className="button button-secondary" style={{ fontSize: 13 }}>
                Retry
              </button>
            </div>
          )}

          {state.status === 'ready' && (
            <div className="space-y-4">
              {state.data.summary && (
                <p
                  className="text-sm"
                  style={{
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-elevated)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid var(--accent-primary)',
                  }}
                >
                  {state.data.summary}
                </p>
              )}

              {!hasFindings ? (
                <div className="text-sm text-muted">
                  No meaningful structural exposures detected in this memo.
                </div>
              ) : (
                <div className="space-y-3">
                  {assumptions.map((a, i) => {
                    const styles = SEVERITY_STYLES[a.severity];
                    return (
                      <div
                        key={`${a.determinantId}-${i}`}
                        className={`liquid-glass p-4 border ${styles.border}`}
                      >
                        <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 ${styles.badge}`}>
                              {a.determinantLabel ?? a.determinantId}
                            </span>
                            <span className={`text-xs capitalize ${styles.badge} px-1.5 py-0.5`}>
                              {a.severity}
                            </span>
                            {a.category && (
                              <span className="text-[10px] uppercase tracking-wider text-muted">
                                {CATEGORY_LABELS[a.category] ?? a.category}
                              </span>
                            )}
                          </div>
                          <span
                            className="text-[10px] uppercase tracking-wider text-muted"
                            title="How defensible the memo's evidence makes this assumption"
                          >
                            {DEFENSIBILITY_LABELS[a.defensibility]}
                          </span>
                        </div>

                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {a.assumption}
                        </p>

                        {a.evidenceFromMemo && (
                          <blockquote
                            className="mt-2 pl-3 text-xs italic"
                            style={{
                              color: 'var(--text-muted)',
                              borderLeft: `2px solid var(--border-color)`,
                            }}
                          >
                            &ldquo;{a.evidenceFromMemo}&rdquo;
                          </blockquote>
                        )}

                        {a.hardeningQuestion && (
                          <div
                            className="mt-3 flex items-start gap-2 text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <AlertTriangle size={12} className={`mt-0.5 ${styles.dot.replace('bg-', 'text-')}`} />
                            <div>
                              <span className="font-medium">Harden with: </span>
                              {a.hardeningQuestion}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-[11px] text-muted mt-2">
                Framework: Dalio 18 rise-and-fall determinants. This is a structural-layer audit, separate from the Kahneman + Klein cognitive-bias pass — it asks what the plan is implicitly betting on about the world, not about the reasoner.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
