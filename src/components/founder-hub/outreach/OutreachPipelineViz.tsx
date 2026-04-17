'use client';

import type { OutreachStep } from '@/hooks/useOutreachGeneration';

const STEPS: Array<{ id: OutreachStep; label: string }> = [
  { id: 'parse', label: 'Parse profile' },
  { id: 'analyze', label: 'Analyze context' },
  { id: 'match', label: 'Match positioning' },
  { id: 'draft', label: 'Draft outreach' },
];

interface Props {
  currentStep: OutreachStep;
  error?: string | null;
}

export function OutreachPipelineViz({ currentStep, error }: Props) {
  const currentIdx = STEPS.findIndex(s => s.id === currentStep);
  const isDone = currentStep === 'done';
  const isError = currentStep === 'error';

  return (
    <div style={container}>
      <div style={stepRow}>
        {STEPS.map((step, idx) => {
          const state: 'pending' | 'active' | 'complete' | 'error' =
            isError && idx >= currentIdx
              ? 'error'
              : isDone || idx < currentIdx
                ? 'complete'
                : idx === currentIdx
                  ? 'active'
                  : 'pending';

          return (
            <div key={step.id} style={{ flex: 1, position: 'relative' }}>
              <div style={nodeStyle(state)}>
                <div style={nodeInner(state)}>{idx + 1}</div>
              </div>
              <div style={nodeLabel(state)}>{step.label}</div>
              {idx < STEPS.length - 1 && <div style={connector(state === 'complete')} />}
            </div>
          );
        })}
      </div>

      {error && (
        <div style={errorBanner}>
          <strong>Generation failed:</strong> {error}
        </div>
      )}
    </div>
  );
}

const container: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: 20,
  marginBottom: 16,
};

const stepRow: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  alignItems: 'flex-start',
};

const nodeStyle = (state: 'pending' | 'active' | 'complete' | 'error'): React.CSSProperties => {
  const color =
    state === 'complete'
      ? 'var(--accent-primary)'
      : state === 'active'
        ? 'var(--accent-primary)'
        : state === 'error'
          ? 'var(--error, #EF4444)'
          : 'var(--border-color)';
  return {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: `2px solid ${color}`,
    background: state === 'complete' ? color : 'var(--bg-card)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    transition: 'all 0.3s ease',
    animation: state === 'active' ? 'outreachPulse 1.4s ease-in-out infinite' : undefined,
  };
};

const nodeInner = (state: 'pending' | 'active' | 'complete' | 'error'): React.CSSProperties => ({
  fontSize: 13,
  fontWeight: 700,
  color:
    state === 'complete'
      ? '#fff'
      : state === 'active'
        ? 'var(--accent-primary)'
        : state === 'error'
          ? 'var(--error, #EF4444)'
          : 'var(--text-muted)',
});

const nodeLabel = (state: 'pending' | 'active' | 'complete' | 'error'): React.CSSProperties => ({
  marginTop: 8,
  fontSize: 11,
  fontWeight: 600,
  textAlign: 'center',
  color: state === 'active' || state === 'complete' ? 'var(--text-primary)' : 'var(--text-muted)',
});

const connector = (complete: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: 18,
  left: 'calc(50% + 18px)',
  right: 'calc(-50% + 18px)',
  height: 2,
  background: complete ? 'var(--accent-primary)' : 'var(--border-color)',
  transition: 'background 0.3s ease',
});

const errorBanner: React.CSSProperties = {
  marginTop: 16,
  padding: 12,
  borderRadius: 'var(--radius-md)',
  background: 'var(--error, #EF4444)15',
  border: '1px solid var(--error, #EF4444)30',
  color: 'var(--error, #EF4444)',
  fontSize: 12,
};
