'use client';

/**
 * AnalysisShell — unified streaming shell that mirrors the final
 * document-detail tab layout so users never feel a handoff between the
 * 60-second audit and the 15-minute exploration.
 *
 * Render this during live analysis. Tabs are visible but locked, each
 * showing a pending/running/complete status icon derived from pipeline
 * step progress. When streaming completes the user is navigated to the
 * detail page, which mounts the SAME tab bar in its active form.
 */

import {
  Brain,
  CheckCircle,
  Lightbulb,
  Info,
  Link2,
  Users,
  Loader2,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LivePipelineGraph, PIPELINE_NODE_LABELS } from '@/components/ui/LivePipelineGraph';
import { findPipelineLabel } from '@/components/ui/AnalysisProgressBar';

export interface StepStatus {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

interface AnalysisShellProps {
  filename: string;
  currentProgress: number;
  steps: StepStatus[];
  biasCount: number;
  onCancel: () => void;
}

// Group pipeline steps under the tabs they feed.
// This mapping mirrors the detail-page tab layout (TAB_GROUPS in
// /documents/[id]/page.tsx) so the visual hierarchy matches exactly.
const TAB_STAGES: Array<{
  id: string;
  label: string;
  icon: typeof Brain;
  stepIndexes: number[];
}> = [
  { id: 'overview', label: 'Overview', icon: Brain, stepIndexes: [0, 6] },
  { id: 'evidence', label: 'Evidence', icon: CheckCircle, stepIndexes: [1, 3] },
  { id: 'swot', label: 'SWOT', icon: Lightbulb, stepIndexes: [5] },
  { id: 'noise', label: 'Noise', icon: Info, stepIndexes: [2] },
  { id: 'dq-chain', label: 'DQ Chain', icon: Link2, stepIndexes: [4] },
  { id: 'perspectives', label: 'Perspectives', icon: Users, stepIndexes: [5] },
];

function tabStatus(steps: StepStatus[], indexes: number[]): 'pending' | 'running' | 'complete' {
  const relevant = indexes.map(i => steps[i]).filter(Boolean);
  if (relevant.length === 0) return 'pending';
  if (relevant.every(s => s.status === 'complete')) return 'complete';
  if (relevant.some(s => s.status === 'running' || s.status === 'complete')) return 'running';
  return 'pending';
}

export function AnalysisShell({
  filename,
  currentProgress,
  steps,
  biasCount,
  onCancel,
}: AnalysisShellProps) {
  const currentStep = steps.find(s => s.status === 'running');
  const completedCount = steps.filter(s => s.status === 'complete').length;

  // Derive node-label states from the current steps so the LivePipelineGraph
  // below renders the moat visual instead of a generic pip row. Any step
  // label that doesn't map onto a canonical pipeline node is skipped; the
  // fallback aliases live in AnalysisProgressBar.STEP_TO_LABEL so the
  // short ANALYSIS_STEPS names still resolve.
  const nodeStates: Record<string, 'pending' | 'running' | 'complete'> = Object.fromEntries(
    PIPELINE_NODE_LABELS.map(l => [l, 'pending' as const])
  );
  for (const step of steps) {
    if (step.status === 'pending') continue;
    const label = findPipelineLabel(step.name);
    if (!label) continue;
    // "complete" wins over "running" wins over "pending" for the same label
    // (useful when multiple ANALYSIS_STEPS share a pipeline node).
    const current = nodeStates[label];
    const incoming: 'pending' | 'running' | 'complete' =
      step.status === 'error' ? 'pending' : step.status;
    if (incoming === 'complete' || current !== 'complete') {
      if (incoming === 'running' && current === 'complete') continue;
      nodeStates[label] = incoming;
    }
  }

  return (
    <div
      className="card mb-xl animate-fade-in"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      {/* ─── Header: filename + analyzing status ────────────────────────── */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <FileText size={18} style={{ color: 'var(--text-muted)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {filename}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Loader2 size={11} className="animate-spin" />
            Analyzing — {completedCount}/{steps.length} stages complete
          </div>
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-highlight)',
          }}
        >
          {currentProgress}%
        </div>
      </div>

      {/* ─── Locked tab bar (mirrors /documents/[id] layout) ────────────── */}
      <div
        role="tablist"
        aria-label="Analysis tabs (locked during streaming)"
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          overflowX: 'auto',
        }}
      >
        {TAB_STAGES.map(tab => {
          const status = tabStatus(steps, tab.stepIndexes);
          const Icon = tab.icon;
          return (
            <div
              key={tab.id}
              role="tab"
              aria-disabled="true"
              aria-selected={false}
              title={`${tab.label} — ${status}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                fontSize: 13,
                fontWeight: 500,
                color:
                  status === 'complete'
                    ? 'var(--success, #22c55e)'
                    : status === 'running'
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                cursor: 'not-allowed',
                opacity: status === 'pending' ? 0.5 : 1,
                borderBottom:
                  status === 'running'
                    ? '2px solid var(--accent-primary, #16A34A)'
                    : '2px solid transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {status === 'complete' ? (
                <CheckCircle size={14} style={{ color: 'var(--success, #22c55e)' }} />
              ) : status === 'running' ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                  style={{ color: 'var(--accent-primary, #16A34A)' }}
                />
              ) : (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--border-hover)',
                    marginLeft: 3,
                    marginRight: 3,
                  }}
                />
              )}
              <Icon size={14} />
              {tab.label}
            </div>
          );
        })}
      </div>

      {/* ─── Main streaming canvas ──────────────────────────────────────── */}
      <div style={{ padding: '40px 32px', textAlign: 'center' }}>
        {/* Active step narrative */}
        <motion.div
          key={currentStep?.name ?? 'idle'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: 28 }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            Current stage
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--text-highlight)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {currentStep?.name ?? 'Initializing pipeline'}
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ marginLeft: 4, color: 'var(--accent-primary)' }}
            >
              …
            </motion.span>
          </div>
        </motion.div>

        {/* Pipeline viz — same 10-node graph the AnalysisProgressFloat
            shows in its expanded state, embedded inline so the moat is
            visible on every upload, not just in the floating notification. */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 28,
            maxWidth: 640,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <LivePipelineGraph
            nodeStates={nodeStates}
            progress={currentProgress}
            biasCount={biasCount}
          />
        </div>

        {/* Progress bar */}
        <div className="progress-bar" style={{ maxWidth: 520, margin: '0 auto 24px' }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${currentProgress}%`,
              transition: 'width 0.5s ease',
            }}
            role="progressbar"
            aria-valuenow={currentProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Live bias counter — engagement hook */}
        {biasCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            <Sparkles size={14} />
            {biasCount} cognitive bias{biasCount === 1 ? '' : 'es'} detected so far
          </motion.div>
        )}

        {/* Cancel */}
        <div>
          <button
            onClick={onCancel}
            className="btn btn-ghost text-xs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <X size={12} />
            Cancel analysis
          </button>
        </div>
      </div>
    </div>
  );
}
