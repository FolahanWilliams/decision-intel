'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { Loader2, CheckCircle, X, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { LivePipelineGraph, PIPELINE_NODE_LABELS } from './LivePipelineGraph';

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
}

interface AnalysisProgressContextType {
  activeAnalysis: ActiveAnalysis | null;
  startTracking: (documentId: string, filename: string) => void;
  updateProgress: (progress: number, step: string) => void;
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

  const updateProgress = useCallback((progress: number, step: string) => {
    setActiveAnalysis(prev =>
      prev && prev.status === 'analyzing' ? { ...prev, progress, currentStep: step } : prev
    );
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

  return (
    <AnalysisProgressContext.Provider
      value={{
        activeAnalysis,
        startTracking,
        updateProgress,
        completeTracking,
        errorTracking,
        dismiss,
        updateNodeState,
        updateBiasCount,
        updateNoiseScore,
      }}
    >
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
    } catch {
      return false;
    }
  });

  const setExpanded = useCallback((value: boolean) => {
    setExpandedState(value);
    try {
      localStorage.setItem('di-pipeline-expanded', String(value));
    } catch {
      /* ignore */
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
};

function findPipelineLabel(stepName: string): string | null {
  // Direct match
  if (STEP_TO_LABEL[stepName]) return STEP_TO_LABEL[stepName];
  // Fuzzy: check if any label is contained in the step name
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

  const panelWidth = 'min(640px, 90vw)';

  // When complete, mark all nodes complete
  const nodeStates = isComplete
    ? Object.fromEntries(PIPELINE_NODE_LABELS.map(l => [l, 'complete' as const]))
    : activeAnalysis.nodeStates || {};

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
        background: 'rgba(5, 5, 5, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-color)',
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
        <LivePipelineGraph
          nodeStates={nodeStates}
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
            <span>{activeAnalysis.currentStep}</span>
            <span>{Math.round(activeAnalysis.progress)}%</span>
          </div>

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
