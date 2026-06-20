'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { Loader2, CheckCircle, X, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { PIPELINE_NODE_LABELS } from './LivePipelineGraph';
import { LivePipelineFlow } from '@/components/analysis/LivePipelineFlow';

// ---------------------------------------------------------------------------
// Types & Context
// ---------------------------------------------------------------------------

interface ActiveAnalysis {
  documentId: string;
  filename: string;
  progress: number;
  currentStep: string;
  status: 'analyzing' | 'complete' | 'error';
  nodeStates: Record<string, 'pending' | 'running' | 'complete'>;
  biasCount: number;
  noiseScore: number | null;
  /** Educational description of the currently-running node (e.g.
   *  "Analyzing for 22 cognitive biases with research verification…").
   *  Populated from the SSE per-node `description` field — the data was
   *  already flowing through useAnalysisStream's AnalysisStep but wasn't
   *  surfaced in the UI (Tier-A #2 ship 2026-05-26). Real users
   *  staring at a 60s spinner need to see WHAT is happening, not just a
   *  percentage. */
  currentStepDescription?: string;
  /** ms timestamp when the current step transitioned to 'running'. Used
   *  to surface an elapsed counter ("Bias Detection · 23s elapsed"),
   *  which is the actual anxiety-reducer when a single node takes 15s+. */
  currentStepStartedAt?: number;
}

interface AnalysisProgressContextType {
  activeAnalysis: ActiveAnalysis | null;
  startTracking: (documentId: string, filename: string) => void;
  /** Update progress + step name + optional description. The description
   *  rides on every step transition; when the step name changes, the
   *  elapsed-counter timestamp also resets. */
  updateProgress: (progress: number, step: string, description?: string) => void;
  completeTracking: (documentId: string) => void;
  errorTracking: () => void;
  dismiss: () => void;
  updateNodeState: (label: string, status: 'pending' | 'running' | 'complete') => void;
  updateBiasCount: (count: number) => void;
  updateNoiseScore: (score: number) => void;
}

const AnalysisProgressContext = createContext<AnalysisProgressContextType | undefined>(undefined);

export function AnalysisProgressProvider({ children }: { children: ReactNode }) {
  const [activeAnalysis, setActiveAnalysis] = useState<ActiveAnalysis | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending dismiss timer on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const startTracking = useCallback((documentId: string, filename: string) => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    const initialNodeStates: Record<string, 'pending' | 'running' | 'complete'> = {};
    for (const label of PIPELINE_NODE_LABELS) {
      initialNodeStates[label] = 'pending';
    }
    setActiveAnalysis({
      documentId,
      filename,
      progress: 0,
      currentStep: 'Preparing document',
      status: 'analyzing',
      nodeStates: initialNodeStates,
      biasCount: 0,
      noiseScore: null,
    });
  }, []);

  const updateProgress = useCallback((progress: number, step: string, description?: string) => {
    setActiveAnalysis(prev => {
      if (!prev || prev.status !== 'analyzing') return prev;
      // Reset elapsed-counter timestamp on step transition. When the
      // SSE keeps firing the same step name with updated progress, we
      // preserve the original timestamp so the elapsed clock keeps
      // ticking from when the step ACTUALLY started.
      const stepChanged = step !== prev.currentStep;
      return {
        ...prev,
        progress,
        currentStep: step,
        currentStepDescription: description ?? prev.currentStepDescription,
        currentStepStartedAt: stepChanged ? Date.now() : prev.currentStepStartedAt,
      };
    });
  }, []);

  const completeTracking = useCallback((documentId: string) => {
    // Suspense pause: let the final pipeline node linger at 100% progress
    // before flipping to the completion state — this is where the "wow" happens.
    // The backend result is already in hand; this is pure UX pacing.
    const SUSPENSE_MS = 1200;

    setActiveAnalysis(prev => {
      if (!prev || prev.documentId !== documentId) return prev;
      return { ...prev, progress: 100, currentStep: 'Scoring decision quality...' };
    });

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setActiveAnalysis(current => {
        if (!current || current.documentId !== documentId) return current;
        return { ...current, currentStep: 'Analysis complete', status: 'complete' };
      });
      // Auto-dismiss after 14s of visible completion state
      dismissTimerRef.current = setTimeout(() => {
        setActiveAnalysis(current =>
          current?.documentId === documentId && current.status === 'complete' ? null : current
        );
        dismissTimerRef.current = null;
      }, 14_000);
    }, SUSPENSE_MS);
  }, []);

  const errorTracking = useCallback(() => {
    setActiveAnalysis(prev =>
      prev ? { ...prev, status: 'error', currentStep: 'Analysis failed' } : prev
    );
  }, []);

  const dismiss = useCallback(() => {
    setActiveAnalysis(null);
  }, []);

  const updateNodeState = useCallback(
    (label: string, status: 'pending' | 'running' | 'complete') => {
      setActiveAnalysis(prev =>
        prev ? { ...prev, nodeStates: { ...prev.nodeStates, [label]: status } } : prev
      );
    },
    []
  );

  const updateBiasCount = useCallback((count: number) => {
    setActiveAnalysis(prev => (prev ? { ...prev, biasCount: count } : prev));
  }, []);

  const updateNoiseScore = useCallback((score: number) => {
    setActiveAnalysis(prev => (prev ? { ...prev, noiseScore: score } : prev));
  }, []);

  // Memoize so the context value identity only changes when activeAnalysis
  // changes — not on every provider render. The inline object literal here was
  // re-created each render, re-rendering every consumer (UsageMeter, the audit
  // surfaces) needlessly. Callbacks are all useCallback-stable.
  const contextValue = useMemo(
    () => ({
      activeAnalysis,
      startTracking,
      updateProgress,
      completeTracking,
      errorTracking,
      dismiss,
      updateNodeState,
      updateBiasCount,
      updateNoiseScore,
    }),
    [
      activeAnalysis,
      startTracking,
      updateProgress,
      completeTracking,
      errorTracking,
      dismiss,
      updateNodeState,
      updateBiasCount,
      updateNoiseScore,
    ]
  );

  return (
    <AnalysisProgressContext.Provider value={contextValue}>
      {children}
    </AnalysisProgressContext.Provider>
  );
}

export function useAnalysisProgress() {
  const ctx = useContext(AnalysisProgressContext);
  if (!ctx) throw new Error('useAnalysisProgress must be used within AnalysisProgressProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Floating progress bar UI
// ---------------------------------------------------------------------------

function usePipelineExpanded(): [boolean, (v: boolean) => void] {
  const [expanded, setExpandedState] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('di-pipeline-expanded') === 'true';
    } catch (_err1) {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
      void _err1;
      return false;
    }
  });

  const setExpanded = useCallback((value: boolean) => {
    setExpandedState(value);
    try {
      localStorage.setItem('di-pipeline-expanded', String(value));
    } catch (_err2) {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
      void _err2;
    }
  }, []);

  return [expanded, setExpanded];
}

/**
 * Derives node states from the currentStep by tracking step history internally.
 * When currentStep changes, the previous step becomes 'complete' and the new one 'running'.
 */
function useDerivedNodeStates(activeAnalysis: ActiveAnalysis | null) {
  const prevStepRef = useRef<string | null>(null);
  const { updateNodeState } = useAnalysisProgress();

  useEffect(() => {
    if (!activeAnalysis || activeAnalysis.status !== 'analyzing') {
      prevStepRef.current = null;
      return;
    }

    const currentStep = activeAnalysis.currentStep;
    if (currentStep === prevStepRef.current) return;

    // Mark previous step as complete
    if (prevStepRef.current) {
      // Find the matching pipeline label for the previous step
      const prevLabel = findPipelineLabel(prevStepRef.current);
      if (prevLabel) {
        updateNodeState(prevLabel, 'complete');
      }
    }

    // Mark current step as running
    const currentLabel = findPipelineLabel(currentStep);
    if (currentLabel) {
      updateNodeState(currentLabel, 'running');
    }

    prevStepRef.current = currentStep;
  }, [activeAnalysis, updateNodeState]);
}

/** Map SSE step names to pipeline node labels */
const STEP_TO_LABEL: Record<string, string> = {
  'Privacy Shield': 'Privacy Shield',
  'Document Intelligence': 'Document Intelligence',
  'Bias Detection': 'Bias Detection',
  'Noise Analysis': 'Noise Analysis',
  'Fact & Compliance Check': 'Fact & Compliance Check',
  'Deep Analysis': 'Deep Analysis',
  'Boardroom Simulation': 'Boardroom Simulation',
  'Pattern Recognition': 'Pattern Recognition',
  'Meta Judge': 'Meta Judge',
  'Risk Scoring': 'Risk Scoring',
  // Fallback aliases for the short-form ANALYSIS_STEPS labels the
  // dashboard still passes through useAnalysisStream. Keeps the pipeline
  // graph useful on AnalysisShell even when the stream emits the short
  // names instead of the canonical pipeline node labels.
  'Preparing document': 'Document Intelligence',
  'Detecting cognitive biases': 'Bias Detection',
  'Analyzing decision noise': 'Noise Analysis',
  'Fact checking claims': 'Fact & Compliance Check',
  'Evaluating compliance': 'Fact & Compliance Check',
  'Generating risk assessment': 'Risk Scoring',
  'Finalizing report': 'Meta Judge',
};

/** Map an incoming SSE step name to the canonical pipeline node label.
 *  Exported so any component that shows the LivePipelineGraph can derive
 *  nodeStates from its own step list without re-implementing the fuzzy
 *  matching. */
export function findPipelineLabel(stepName: string): string | null {
  if (STEP_TO_LABEL[stepName]) return STEP_TO_LABEL[stepName];
  for (const label of PIPELINE_NODE_LABELS) {
    if (stepName.toLowerCase().includes(label.toLowerCase())) return label;
  }
  return null;
}

export function AnalysisProgressFloat() {
  const { activeAnalysis, dismiss } = useAnalysisProgress();
  const [expanded, setExpanded] = usePipelineExpanded();

  // Auto-expand the pipeline graph whenever a new analysis begins so the
  // visual pipeline is immediately visible in demos and first-time use.
  const prevDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeAnalysis?.documentId && activeAnalysis.documentId !== prevDocIdRef.current) {
      prevDocIdRef.current = activeAnalysis.documentId;
      if (activeAnalysis.status === 'analyzing') {
        setExpanded(true);
      }
    }
    if (!activeAnalysis) {
      prevDocIdRef.current = null;
    }
  }, [activeAnalysis, setExpanded]);

  // Derive node states from step progression
  useDerivedNodeStates(activeAnalysis);

  if (!activeAnalysis) return null;

  const isComplete = activeAnalysis.status === 'complete';
  const isError = activeAnalysis.status === 'error';
  const isAnalyzing = activeAnalysis.status === 'analyzing';
  const barColor = isComplete
    ? 'var(--success)'
    : isError
      ? 'var(--error)'
      : 'var(--accent-primary)';

  const panelWidth = 'min(720px, 92vw)';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Analysis ${activeAnalysis.status}: ${activeAnalysis.currentStep}`}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 45,
        width: expanded && isAnalyzing ? panelWidth : undefined,
        minWidth: expanded && isAnalyzing ? undefined : '360px',
        maxWidth: expanded && isAnalyzing ? undefined : '480px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg)',
        borderRadius: 12,
        padding: '12px 16px',
        overflow: 'hidden',
        transition: 'height 0.35s ease, width 0.35s ease, max-width 0.35s ease',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: expanded && isAnalyzing ? 12 : 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          {isComplete ? (
            <CheckCircle size={14} style={{ color: 'var(--success)' }} />
          ) : isError ? (
            <FileText size={14} style={{ color: 'var(--error)' }} />
          ) : (
            <Loader2
              size={14}
              className="animate-spin"
              style={{ color: 'var(--accent-primary)' }}
            />
          )}
          <span style={{ fontWeight: 500 }}>
            {isComplete ? (
              <Link
                href={`/documents/${activeAnalysis.documentId}?fresh=1`}
                style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
              >
                {activeAnalysis.filename}
              </Link>
            ) : (
              activeAnalysis.filename
            )}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Expand/collapse toggle – only show during analysis */}
          {isAnalyzing && (
            <button
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'Collapse pipeline view' : 'Expand pipeline view'}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                padding: '2px',
              }}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          )}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '2px',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Expanded pipeline graph */}
      {expanded && isAnalyzing ? (
        <LivePipelineFlow
          progress={activeAnalysis.progress}
          biasCount={activeAnalysis.biasCount}
          noiseScore={activeAnalysis.noiseScore ?? undefined}
        />
      ) : (
        <>
          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={Math.round(activeAnalysis.progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={activeAnalysis.currentStep}
            style={{
              height: '3px',
              background: 'var(--bg-tertiary)',
              marginBottom: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${activeAnalysis.progress}%`,
                background: barColor,
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <span>
              {activeAnalysis.currentStep}
              {isAnalyzing && activeAnalysis.currentStepStartedAt && (
                <ElapsedCounter startedAt={activeAnalysis.currentStepStartedAt} />
              )}
            </span>
            <span>{Math.round(activeAnalysis.progress)}%</span>
          </div>

          {/* Educational caption — Tier-A #2 ship 2026-05-26. The
           * SSE-provided description for the current pipeline node
           * answers the real-user question "what is this thing
           * actually doing?" during the 60s wait. Hidden when no
           * description has arrived yet (early seconds of stream). */}
          {isAnalyzing && activeAnalysis.currentStepDescription && (
            <div
              style={{
                fontSize: 10.5,
                color: 'var(--text-muted)',
                marginTop: 4,
                fontStyle: 'italic',
                lineHeight: 1.4,
                opacity: 0.85,
              }}
            >
              {activeAnalysis.currentStepDescription}
            </div>
          )}

          {isComplete && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                marginTop: 10,
                paddingTop: 10,
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <Link
                href={`/documents/${activeAnalysis.documentId}?fresh=1`}
                style={endStateActionStyle('primary')}
              >
                View report
              </Link>
              <Link
                href={`/documents/${activeAnalysis.documentId}?tab=counterfactual`}
                style={endStateActionStyle('secondary')}
              >
                Run counterfactual
              </Link>
              <button
                type="button"
                onClick={dismiss}
                style={endStateActionStyle('secondary')}
                aria-label="Upload another"
              >
                Upload another
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Live elapsed-second counter for the current pipeline node. Tier-A #2
 * ship 2026-05-26: real users staring at a 60s spinner need confirmation
 * something is still alive when a node sits at the same name for 15-20s
 * (biasDetective, metaJudge). Updates once per second; no-ops once the
 * analysis transitions out of 'analyzing' state. Pure presentational.
 */
function ElapsedCounter({ startedAt }: { startedAt: number }) {
  const [tickMs, setTickMs] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTickMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const seconds = Math.max(0, Math.floor((tickMs - startedAt) / 1000));
  // Don't show 0s — the counter feels noisier than helpful when it
  // briefly says "0s" on every step transition.
  if (seconds < 1) return null;
  return (
    <span
      style={{
        marginLeft: 6,
        fontSize: 10,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: 'var(--text-muted)',
        opacity: 0.7,
      }}
      aria-label={`${seconds} seconds elapsed on this step`}
    >
      · {seconds}s
    </span>
  );
}

const endStateActionStyle = (kind: 'primary' | 'secondary'): React.CSSProperties => ({
  flex: 1,
  padding: '6px 10px',
  borderRadius: 'var(--radius-sm)',
  border: kind === 'primary' ? 'none' : '1px solid var(--border-color)',
  background: kind === 'primary' ? 'var(--accent-primary)' : 'transparent',
  color: kind === 'primary' ? '#fff' : 'var(--text-primary)',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'center',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
});
