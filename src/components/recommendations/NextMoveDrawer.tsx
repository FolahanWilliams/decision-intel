'use client';

/**
 * NextMoveDrawer — slide-over drawer with the full priority queue +
 * cross-decision insights. Opens from the strip's "More" button.
 *
 * Three sections per the v1 scope:
 *   1. Priority queue — ranked top-N recommendations by category.
 *   2. Cross-decision insights — the unique-to-constellation
 *      narrative-relationship layer (paper Ch 5 Strategy Stack).
 *   3. Quiet signals — outcome-closure + missing-doc nudges that
 *      aren't on fire today but compound the data moat.
 *
 * Locked 2026-05-10.
 */

import { useEffect, useRef } from 'react';
import { X, ArrowRight, GitBranch, Network } from 'lucide-react';
import Link from 'next/link';
import type {
  CrossDecisionPattern,
  NextMoveRecommendation,
} from '@/lib/recommendations/recommendation-types';
import {
  NEXT_MOVE_CATEGORIES,
  type NextMoveCategoryId,
} from '@/lib/recommendations/next-move-categories';
import { ValidityClassChip } from './ValidityClassChip';

const SEVERITY_BORDER: Record<'critical' | 'high' | 'medium' | 'low', string> = {
  critical: 'var(--error)',
  high: 'var(--severity-high)',
  medium: 'var(--warning)',
  low: 'var(--info)',
};

const QUIET_CATEGORIES: ReadonlySet<NextMoveCategoryId> = new Set([
  'outcome_closure',
  'missing_required_artefact',
]);

const PATTERN_TYPE_META: Record<
  CrossDecisionPattern['patternType'],
  { label: string; Icon: typeof Network }
> = {
  thesis_cascade: { label: 'Thesis cascade', Icon: GitBranch },
  shared_assumption: { label: 'Shared assumption', Icon: Network },
  platform_contagion: { label: 'Platform contagion', Icon: Network },
  lineage_drift: { label: 'Lineage drift', Icon: GitBranch },
};

interface NextMoveDrawerProps {
  recommendations: NextMoveRecommendation[];
  crossDecisionPatterns: CrossDecisionPattern[];
  onClose: () => void;
}

export function NextMoveDrawer({
  recommendations,
  crossDecisionPatterns,
  onClose,
}: NextMoveDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes the drawer.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Group recommendations by quiet vs not-quiet.
  const loud = recommendations.filter(r => !QUIET_CATEGORIES.has(r.categoryId));
  const quiet = recommendations.filter(r => QUIET_CATEGORIES.has(r.categoryId));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Next move recommendations"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 520,
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slide-in 0.2s ease-out',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 'var(--fs-md)',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Recommendations
            </h3>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-muted)',
              }}
            >
              {recommendations.length} ranked · {crossDecisionPatterns.length} cross-decision
              pattern
              {crossDecisionPatterns.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', flex: 1 }}>
          {/* Priority queue */}
          {loud.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <SectionHeader label="Priority queue" count={loud.length} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {loud.map(rec => (
                  <RecommendationCard key={rec.id} rec={rec} />
                ))}
              </div>
            </section>
          )}

          {/* Cross-decision insights */}
          {crossDecisionPatterns.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <SectionHeader
                label="Cross-decision insights"
                count={crossDecisionPatterns.length}
                hint="Patterns the kanban can't show — narrative-relationship layer."
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {crossDecisionPatterns.map((p, i) => (
                  <CrossDecisionInsightCard key={`${p.patternType}_${i}`} pattern={p} />
                ))}
              </div>
            </section>
          )}

          {/* Quiet signals */}
          {quiet.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <SectionHeader
                label="Quiet signals"
                count={quiet.length}
                hint="Not on fire today, but compound the data moat."
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {quiet.map(rec => (
                  <RecommendationCard key={rec.id} rec={rec} dimmed />
                ))}
              </div>
            </section>
          )}

          {recommendations.length === 0 && crossDecisionPatterns.length === 0 && (
            <p
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '40px 0',
              }}
            >
              No recommendations to surface right now.
            </p>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

function SectionHeader({ label, count, hint }: { label: string; count: number; hint?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginBottom: hint ? 2 : 0,
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </h4>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          {count}
        </span>
      </div>
      {hint && (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  dimmed = false,
}: {
  rec: NextMoveRecommendation;
  dimmed?: boolean;
}) {
  const cat = NEXT_MOVE_CATEGORIES[rec.categoryId];
  const border = SEVERITY_BORDER[rec.severity];
  return (
    <div
      style={{
        opacity: dimmed ? 0.85 : 1,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${border}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: border,
          }}
        >
          {cat.label}
        </span>
        <ValidityClassChip validityClass={rec.validityClass} size="xs" showLabel={false} />
      </div>
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-primary)',
          lineHeight: 1.5,
        }}
      >
        {rec.detailedLabel}
      </p>
      <details style={{ marginBottom: 8 }}>
        <summary
          style={{
            cursor: 'pointer',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            listStyle: 'none',
          }}
        >
          Why this fires →
        </summary>
        <p
          style={{
            margin: '6px 0 0',
            padding: '8px 10px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            fontFamily: 'var(--font-mono, ui-monospace, "SF Mono", monospace)',
          }}
        >
          {rec.whyTrace}
        </p>
      </details>
      <Link
        href={rec.ctaHref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 'var(--fs-xs)',
          fontWeight: 600,
          color: 'var(--accent-primary)',
          textDecoration: 'none',
        }}
      >
        {rec.ctaVerb}
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function CrossDecisionInsightCard({ pattern }: { pattern: CrossDecisionPattern }) {
  const meta = PATTERN_TYPE_META[pattern.patternType];
  const Icon = meta.Icon;
  const border = SEVERITY_BORDER[pattern.severity];
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${border}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6,
        }}
      >
        <Icon size={12} style={{ color: border }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: border,
          }}
        >
          {meta.label}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            marginLeft: 'auto',
          }}
        >
          {pattern.containerIds.length} decisions
        </span>
      </div>
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-primary)',
          fontWeight: 500,
        }}
      >
        &ldquo;{pattern.assumptionLabel}&rdquo;
      </p>
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        Affected: {pattern.containerNames.slice(0, 3).join(' · ')}
        {pattern.containerNames.length > 3 ? ` + ${pattern.containerNames.length - 3} more` : ''}
      </p>
      <Link
        href={`/dashboard/decisions/${pattern.containerIds[0]}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 'var(--fs-xs)',
          fontWeight: 600,
          color: 'var(--accent-primary)',
          textDecoration: 'none',
        }}
      >
        Open primary decision
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}
