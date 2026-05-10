'use client';

/**
 * NextMoveStrip — single-line recommendation surface above the
 * constellation SVG. Renders the top-1 ranked recommendation; click
 * opens NextMoveDrawer for the full priority queue + cross-decision
 * insights + quiet signals.
 *
 * Locked 2026-05-10. Per Deep Research paper Ch 1 (formalization-
 * reality discontinuity) the strip surfaces recommendations spanning
 * pre-artefact / mid-flight / pre-commit temporal points, not just
 * post-audit findings.
 *
 * Also renders the divergence callout when the user-priority capture
 * disagrees with the algo's top pick — paper Ch 8 intelligent-
 * antagonist defense.
 */

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  CircleAlert,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import type {
  CrossDecisionPattern,
  NextMoveRecommendation,
} from '@/lib/recommendations/recommendation-types';
import { ValidityClassChip } from './ValidityClassChip';
import { NextMoveDrawer } from './NextMoveDrawer';

const SEVERITY_ACCENT: Record<
  'critical' | 'high' | 'medium' | 'low',
  { bg: string; border: string; icon: string }
> = {
  critical: {
    bg: 'color-mix(in srgb, var(--error) 8%, var(--bg-card))',
    border: 'var(--error)',
    icon: 'var(--error)',
  },
  high: {
    bg: 'color-mix(in srgb, var(--severity-high) 8%, var(--bg-card))',
    border: 'var(--severity-high)',
    icon: 'var(--severity-high)',
  },
  medium: {
    bg: 'color-mix(in srgb, var(--warning) 8%, var(--bg-card))',
    border: 'var(--warning)',
    icon: 'var(--warning)',
  },
  low: {
    bg: 'color-mix(in srgb, var(--info) 8%, var(--bg-card))',
    border: 'var(--info)',
    icon: 'var(--info)',
  },
};

interface NextMoveStripProps {
  recommendations: NextMoveRecommendation[];
  crossDecisionPatterns: CrossDecisionPattern[];
  loading: boolean;
  llmAugmented: boolean;
  /// User-priority capture: when present + the userPriorityContainerId
  /// disagrees with the strip's top pick, render a divergence callout.
  userPriorityCapture: {
    userPriorityText: string;
    userPriorityContainerId: string | null;
    divergenceScore: number | null;
  } | null;
  /// Quiet-state copy for empty pipelines / no recommendations.
  emptyStateMessage?: string;
}

export function NextMoveStrip({
  recommendations,
  crossDecisionPatterns,
  loading,
  llmAugmented,
  userPriorityCapture,
  emptyStateMessage = 'Pipeline clear — no recommendations to surface right now. Add a decision or upload a memo to populate the constellation.',
}: NextMoveStripProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const top = recommendations[0];

  // Divergence detection — only fire when (a) a capture exists, (b)
  // the algo has a top pick, (c) the user-priority maps to a *different*
  // container than the algo's top pick.
  const showDivergence =
    userPriorityCapture !== null &&
    top !== undefined &&
    userPriorityCapture.userPriorityContainerId !== null &&
    userPriorityCapture.userPriorityContainerId !== top.containerId;

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          marginBottom: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-muted)',
        }}
      >
        <Loader2 size={14} className="animate-spin" />
        Computing recommendations…
      </div>
    );
  }

  if (!top) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          marginBottom: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        <Lightbulb size={14} style={{ color: 'var(--text-muted)' }} />
        {emptyStateMessage}
      </div>
    );
  }

  const accent = SEVERITY_ACCENT[top.severity];
  const moreCount = Math.max(0, recommendations.length - 1);
  const crossCount = crossDecisionPatterns.length;

  return (
    <>
      {showDivergence && (
        <DivergenceCallout
          userPriorityText={userPriorityCapture!.userPriorityText}
          algoTopName={top.containerName}
          algoTopReason={top.whyTrace}
        />
      )}
      <div
        role="region"
        aria-label="Next move recommendation"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          marginBottom: 16,
          background: accent.bg,
          border: `1px solid ${accent.border}`,
          borderTop: `3px solid ${accent.border}`,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <CircleAlert size={18} style={{ color: accent.icon, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: accent.icon,
              }}
            >
              Next move
            </span>
            <ValidityClassChip validityClass={top.validityClass} size="xs" />
            {llmAugmented && (
              <span
                title="Why-trace prose enhanced via deepseek-v4-flash"
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: 999,
                  color: 'var(--text-muted)',
                  background: 'var(--bg-secondary)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                LLM-tuned
              </span>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--fs-sm)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              lineHeight: 1.45,
            }}
          >
            {top.regularLabel}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Link
            href={top.ctaHref}
            style={{
              padding: '8px 14px',
              background: 'var(--accent-primary)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {top.ctaVerb}
            <ArrowRight size={14} />
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            aria-label={`Open the recommendation drawer (${moreCount} more recommendations${crossCount > 0 ? `, ${crossCount} cross-decision pattern${crossCount === 1 ? '' : 's'}` : ''})`}
          >
            More
            {(moreCount > 0 || crossCount > 0) && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '0 6px',
                  borderRadius: 999,
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
              >
                {moreCount + crossCount}
              </span>
            )}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      {drawerOpen && (
        <NextMoveDrawer
          recommendations={recommendations}
          crossDecisionPatterns={crossDecisionPatterns}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  );
}

function DivergenceCallout({
  userPriorityText,
  algoTopName,
  algoTopReason,
}: {
  userPriorityText: string;
  algoTopName: string;
  algoTopReason: string;
}) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 16px',
        marginBottom: 12,
        background: 'color-mix(in srgb, var(--info) 8%, var(--bg-card))',
        border: '1px solid color-mix(in srgb, var(--info) 30%, var(--border-color))',
        borderTop: '3px solid var(--info)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <AlertTriangle size={16} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--info)',
          }}
        >
          Divergence — your read vs the system&rsquo;s
        </p>
        <p
          style={{
            margin: '0 0 6px',
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-primary)',
            lineHeight: 1.5,
          }}
        >
          You named: <em>&ldquo;{userPriorityText}&rdquo;</em>
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          The system&rsquo;s top pick is <strong>{algoTopName}</strong>. {algoTopReason}
        </p>
      </div>
    </div>
  );
}
