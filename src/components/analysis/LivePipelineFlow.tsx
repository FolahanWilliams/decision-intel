'use client';

/**
 * LivePipelineFlow — the live, progress-driven analysis visualization.
 *
 * Replaces the legacy dark `LivePipelineGraph` (2026-06-19). Two problems it
 * fixes: (1) the old graph was dark-themed (rgba-white fills + cyan glow) and
 * read as a muddy dark grid on the light dashboard; (2) it keyed node state on
 * three mismatched label vocabularies (9 stream steps vs 10 ad-hoc graph
 * labels vs 12 canonical nodes), so most nodes never lit — it "didn't update".
 *
 * This mirrors the /how-it-works `PipelineFlowDiagram` visual language (three
 * light zone columns over the canonical 12-node manifest, ending in the DQI
 * output) and is driven ENTIRELY by the stream's reliable, monotonic
 * `progress` (10→90% as nodes complete, 100 at the end). Node lighting is a
 * pure function of progress, so it always advances correctly regardless of how
 * the backend names its step events. Reduced-motion-safe.
 */

import {
  Shield,
  Layers,
  Radar,
  Brain,
  Scale,
  CheckCircle2,
  Microscope,
  Users,
  Eye,
  HelpCircle,
  Gavel,
  Calculator,
  Check,
  Loader2,
} from 'lucide-react';
import {
  PIPELINE_NODES,
  ZONES,
  type PipelineNode,
  type PipelineZone,
} from '@/lib/data/pipeline-nodes';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const ICONS: Record<PipelineNode['iconName'], typeof Shield> = {
  Shield,
  Layers,
  Radar,
  Brain,
  Scale,
  CheckCircle2,
  Microscope,
  Users,
  Eye,
  HelpCircle,
  Gavel,
  Calculator,
};

const ZONE_ORDER: PipelineZone[] = ['preprocessing', 'analysis', 'synthesis'];

type NodeStatus = 'pending' | 'running' | 'complete';

export interface LivePipelineFlowProps {
  /** Overall progress 0-100 from the analysis stream (the single driver). */
  progress: number;
  /** Biases detected so far — badge on the Bias Detective node. */
  biasCount?: number;
  /** Noise score if known — badge on the Noise Judge node. */
  noiseScore?: number;
}

function NodeCard({
  node,
  status,
  badge,
  reduced,
}: {
  node: PipelineNode;
  status: NodeStatus;
  badge?: string;
  reduced: boolean;
}) {
  const Icon = ICONS[node.iconName];
  const isComplete = status === 'complete';
  const isRunning = status === 'running';

  const border = isComplete
    ? 'var(--success)'
    : isRunning
      ? 'var(--accent-primary)'
      : 'var(--border-color)';
  const accent = isComplete
    ? 'var(--success)'
    : isRunning
      ? 'var(--accent-primary)'
      : 'var(--text-muted)';

  return (
    <div
      title={node.label}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        background: isRunning
          ? 'color-mix(in srgb, var(--accent-primary) 8%, var(--bg-card))'
          : 'var(--bg-card)',
        border: `1px solid ${border}`,
        borderRadius: 10,
        opacity: status === 'pending' ? 0.55 : 1,
        boxShadow: isComplete || isRunning ? '0 1px 3px rgba(15,23,42,0.05)' : 'none',
        transition: 'border-color 0.4s ease, background 0.4s ease, opacity 0.4s ease',
        minWidth: 0,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 26,
          height: 26,
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isComplete
            ? 'color-mix(in srgb, var(--success) 14%, transparent)'
            : isRunning
              ? 'color-mix(in srgb, var(--accent-primary) 14%, transparent)'
              : 'var(--bg-secondary)',
          color: accent,
        }}
      >
        {isComplete ? (
          <Check size={14} />
        ) : isRunning && !reduced ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Icon size={14} />
        )}
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: isRunning || isComplete ? 600 : 500,
          color: status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {node.label}
      </span>
      {badge && (
        <span
          style={{
            marginLeft: 'auto',
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--accent-primary)',
            background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
            borderRadius: 999,
            padding: '1px 6px',
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export function LivePipelineFlow({ progress, biasCount, noiseScore }: LivePipelineFlowProps) {
  const reduced = useReducedMotion();
  const total = PIPELINE_NODES.length;
  const complete = progress >= 100;
  // Mirror the backend progress formula: progress = (completed/total)*80 + 10.
  const frac = complete ? 1 : Math.max(0, Math.min(1, (progress - 10) / 80));
  const litCount = Math.round(frac * total);

  const statusFor = (globalIndex: number): NodeStatus => {
    if (globalIndex < litCount) return 'complete';
    if (!complete && globalIndex === litCount) return 'running';
    return 'pending';
  };

  const badgeFor = (node: PipelineNode): string | undefined => {
    if (node.id === 'biasDetective' && biasCount != null && biasCount > 0) return String(biasCount);
    if (node.id === 'noiseJudge' && noiseScore != null) return `${noiseScore}%`;
    return undefined;
  };

  // Stable global index per node (canonical execution order).
  const indexed = PIPELINE_NODES.map((node, i) => ({ node, i }));

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 14,
        alignItems: 'flex-start',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {ZONE_ORDER.map(zone => {
        const nodes = indexed.filter(x => x.node.zone === zone);
        const isAnalysis = zone === 'analysis';
        return (
          <div
            key={zone}
            style={{
              flex: isAnalysis ? '2 1 240px' : '1 1 150px',
              minWidth: isAnalysis ? 240 : 150,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 2,
              }}
            >
              {ZONES[zone].label}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isAnalysis ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                gap: 8,
              }}
            >
              {nodes.map(({ node, i }) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  status={statusFor(i)}
                  badge={badgeFor(node)}
                  reduced={reduced}
                />
              ))}
            </div>

            {/* DQI output terminal, anchored under Synthesis */}
            {zone === 'synthesis' && (
              <div
                style={{
                  marginTop: 4,
                  padding: '10px 12px',
                  borderRadius: 10,
                  textAlign: 'center',
                  border: `1px solid ${complete ? 'var(--success)' : 'var(--border-color)'}`,
                  background: complete
                    ? 'color-mix(in srgb, var(--success) 8%, var(--bg-card))'
                    : 'var(--bg-secondary)',
                  opacity: complete ? 1 : 0.7,
                  transition: 'all 0.4s ease',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: 'var(--text-muted)',
                  }}
                >
                  OUTPUT
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: complete ? 'var(--success)' : 'var(--text-secondary)',
                    marginTop: 2,
                  }}
                >
                  DQI · 0–100 · A–F
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
