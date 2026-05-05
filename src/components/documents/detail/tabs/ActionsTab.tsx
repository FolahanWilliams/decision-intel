/**
 * ActionsTab — "What do I fix before the room sees it?"
 *
 * The doing tab. Renders:
 *   1. Lifecycle timeline (where you are in the decision loop)
 *   2. Priority Roadmap — top-3 prioritized fixes as numbered cards
 *   3. Hardening question chips — copy-to-clipboard reviewer questions
 *   4. Inline co-edit launchpad (rewrite a flagged passage → re-audit)
 *   5. Outcome logging anchor — "after this decision plays out, log it
 *      to compound calibration on you specifically"
 *
 * Not a passive findings list — every card has a verb attached.
 */

'use client';

import { useMemo, useState } from 'react';
import { Copy, Check, ArrowUpRight, FileText } from 'lucide-react';
import type { BiasInstance } from '@/types';
import {
  SeverityEdgeCard,
  LifecycleTimeline,
  type Severity,
  type LifecycleStage,
} from '../primitives';
import { formatBiasName } from '@/lib/utils/labels';
import {
  getHardeningQuestion,
  type HardeningQuestion,
} from '@/lib/reports/dpr-hardening-questions';

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

export interface ActionsTabProps {
  biases: BiasInstance[];
  /** Current decision lifecycle stage. */
  lifecycleStage: LifecycleStage;
  auditedAt?: string | null;
  decidedAt?: string | null;
  outcomeAt?: string | null;
  calibratedAt?: string | null;
  outcomeDueAt?: string | null;
  /** Click handler — when a priority fix is clicked, parent jumps PDF to bias. */
  onBiasClick?: (bias: BiasInstance) => void;
  /** Render the inline co-edit panel as a child slot — keeps the existing
   *  InlineCoEditPanel component live without re-implementing it here. */
  coEditSlot?: React.ReactNode;
  /** Render the outcome reporter as a child slot — same logic; reuse the
   *  existing OutcomeReporter / DraftOutcomeCard logic. */
  outcomeReporterSlot?: React.ReactNode;
  /** Map of taxonomyId per biasType (e.g. confirmation_bias -> DI-B-001). */
  taxonomyIdByType?: Record<string, string>;
}

export function ActionsTab(props: ActionsTabProps) {
  const {
    biases,
    lifecycleStage,
    auditedAt,
    decidedAt,
    outcomeAt,
    calibratedAt,
    outcomeDueAt,
    onBiasClick,
    coEditSlot,
    outcomeReporterSlot,
    taxonomyIdByType,
  } = props;

  const top3 = useMemo(
    () =>
      [...biases]
        .sort((a, b) => {
          const sa = SEVERITY_RANK[a.severity?.toLowerCase()] ?? 0;
          const sb = SEVERITY_RANK[b.severity?.toLowerCase()] ?? 0;
          if (sb !== sa) return sb - sa;
          return (b.confidence ?? 0) - (a.confidence ?? 0);
        })
        .slice(0, 3),
    [biases]
  );

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Lifecycle */}
      <LifecycleTimeline
        current={lifecycleStage}
        auditedAt={auditedAt}
        decidedAt={decidedAt}
        outcomeAt={outcomeAt}
        calibratedAt={calibratedAt}
        outcomeDueAt={outcomeDueAt}
      />

      {/* Priority Roadmap */}
      <div style={{ display: 'grid', gap: 10 }}>
        <SectionEyebrow label="Priority roadmap · before the room sees it" />
        {top3.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md, 8px)',
              fontStyle: 'italic',
            }}
          >
            No findings to act on. Either the memo is clean — or the audit is still in flight.
          </div>
        ) : (
          top3.map((bias, i) => (
            <PriorityFixCard
              key={bias.id}
              index={i + 1}
              bias={bias}
              taxonomyId={taxonomyIdByType?.[bias.biasType]}
              hardening={getHardeningQuestion(bias.biasType)}
              onJump={onBiasClick ? () => onBiasClick(bias) : undefined}
            />
          ))
        )}
      </div>

      {/* Inline co-edit launchpad — slot in existing InlineCoEditPanel */}
      {coEditSlot && (
        <div style={{ display: 'grid', gap: 10 }}>
          <SectionEyebrow label="Rewrite a flagged passage · re-audit live" />
          <SeverityEdgeCard severity="info">{coEditSlot}</SeverityEdgeCard>
        </div>
      )}

      {/* Outcome reporter — slot in existing OutcomeReporter */}
      {outcomeReporterSlot && (
        <div style={{ display: 'grid', gap: 10 }}>
          <SectionEyebrow
            label={
              lifecycleStage === 'audited' || lifecycleStage === 'decided'
                ? 'After the decision plays out · log the outcome'
                : 'Outcome record'
            }
          />
          <SeverityEdgeCard severity="low">
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 12.5,
                lineHeight: 1.55,
                color: 'var(--text-secondary)',
              }}
            >
              Logging the outcome closes the calibration loop — the platform learns YOUR
              specific bias patterns, and the per-org Brier score sharpens against your
              decision history. This is the moat that compounds quarter over quarter.
            </p>
            {outcomeReporterSlot}
          </SeverityEdgeCard>
        </div>
      )}
    </div>
  );
}

/* ---------------- Priority fix card (numbered) ---------------- */

interface PriorityFixCardProps {
  index: number;
  bias: BiasInstance;
  taxonomyId?: string;
  hardening: HardeningQuestion;
  onJump?: () => void;
}

function PriorityFixCard({ index, bias, taxonomyId, hardening, onJump }: PriorityFixCardProps) {
  const severity = (bias.severity?.toLowerCase() ?? 'low') as Severity;
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(hardening.question);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — silent (user can copy by selecting text) */
    }
  };

  return (
    <SeverityEdgeCard severity={severity} onClick={onJump}>
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '-0.025em',
              lineHeight: 1,
            }}
          >
            {index.toString().padStart(2, '0')}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {taxonomyId && (
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontFamily: 'ui-monospace, monospace',
                  marginBottom: 2,
                }}
              >
                {taxonomyId}
              </div>
            )}
            <h4
              style={{
                margin: 0,
                fontSize: 14.5,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.005em',
                fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
              }}
            >
              Fix {formatBiasName(bias.biasType)}
            </h4>
          </div>
        </div>
        {onJump && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            jump to passage <ArrowUpRight size={12} />
          </span>
        )}
      </header>

      {/* Suggestion (the recommendation what-to-do) */}
      {bias.suggestion && (
        <p
          style={{
            margin: '0 0 14px',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--text-primary)',
          }}
        >
          {bias.suggestion}
        </p>
      )}

      {/* Hardening question chip */}
      <div
        style={{
          padding: '12px 14px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderLeft: '2px solid var(--info)',
          borderRadius: 'var(--radius-sm, 4px)',
          display: 'grid',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--info)',
            }}
          >
            Reviewer should ask
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy hardening question"
            title="Copy question"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              fontSize: 10.5,
              fontWeight: 600,
              color: copied ? 'var(--severity-low)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
              letterSpacing: '0.04em',
            }}
            onMouseEnter={e => {
              if (!copied) e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              if (!copied) e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'copied' : 'copy'}
          </button>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            lineHeight: 1.55,
            color: 'var(--text-primary)',
            fontWeight: 500,
          }}
        >
          {hardening.question}
        </p>
        {hardening.rationale && (
          <p
            style={{
              margin: 0,
              fontSize: 11.5,
              fontStyle: 'italic',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            {hardening.rationale}
          </p>
        )}
      </div>

      {/* Excerpt (the source passage) */}
      {bias.excerpt && (
        <details
          style={{
            marginTop: 10,
            fontSize: 11.5,
            color: 'var(--text-muted)',
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: 600,
              letterSpacing: '0.04em',
              padding: '4px 0',
            }}
          >
            Show flagged passage
          </summary>
          <blockquote
            style={{
              margin: '6px 0 0',
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              borderLeft: '2px solid var(--text-muted)',
              borderRadius: 'var(--radius-sm, 4px)',
              fontSize: 12,
              fontStyle: 'italic',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}
          >
            <FileText
              size={11}
              style={{ display: 'inline', marginRight: 6, verticalAlign: 'baseline' }}
            />
            &ldquo;{bias.excerpt}&rdquo;
          </blockquote>
        </details>
      )}
    </SeverityEdgeCard>
  );
}

/* ---------------- Section eyebrow ---------------- */

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
    </div>
  );
}
