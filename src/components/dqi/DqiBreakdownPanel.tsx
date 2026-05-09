'use client';

/**
 * DqiBreakdownPanel — clickable explainability surface for the DQI score.
 *
 * Locked 2026-05-09 (founder ask). Built FROM THE BUYER'S SEAT (Head of
 * Corp Dev / PE Deal Partner / GP / fractional CSO). When they click
 * their DQI score, they want to know: "what in MY document drove this
 * score, and what should I do?" — not "what's the methodology version"
 * or "what's the weight on biasLoad."
 *
 * Architecture:
 * - 7 component cards, each with:
 *   - Plain-language name (no snake_case, no internal jargon)
 *   - 1-line "what this measures" description
 *   - Score 0-100 with severity colour
 *   - Weight contribution shown as a percentage
 *   - breakdownItems: per-element rows with label + impact + evidence
 *     excerpt (the document passage or the contributor that drove this
 *     row's contribution)
 * - Methodology footer in plain language
 *
 * Data layer (commit f86143f, 2026-05-09): every component populates
 * breakdownItems. This UI just renders them.
 *
 * Mounted on /documents/[id] (document-detail DQI badge) and /dashboard/
 * deals/[id] (composite DQI hero) — see commit 3.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Brain,
  Activity,
  CheckSquare,
  Workflow,
  Scale,
  Compass,
  Combine,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import type { DQIResult, DQIComponent } from '@/lib/scoring/dqi';

// ─── Buyer-facing component metadata ─────────────────────────────────────────
//
// Translates the engineering names into language a Corp Dev / PE Deal
// Partner reads as their own. Each entry carries:
//   key: the DQIResult.components key
//   displayName: short header (replaces the engineer-facing "Bias Load" etc.)
//   description: 1-line plain-language explanation the buyer reads first
//   icon: visual anchor for the card
//   actionHint: "what to do" line shown when the component scores below 60
//
// Forward-looking rule: when a new component lands, add a META entry in
// the same commit. Never expose a component without buyer-facing copy.

interface ComponentMeta {
  key: keyof DQIResult['components'];
  displayName: string;
  description: string;
  icon: typeof Brain;
  actionHint: string;
}

const COMPONENT_META: ComponentMeta[] = [
  {
    key: 'biasLoad',
    displayName: 'Cognitive biases detected',
    description:
      'How many cognitive biases the audit found in your reasoning, weighted by severity.',
    icon: Brain,
    actionHint:
      'Address the highest-severity biases first. Each one has a recommended mitigation in the bias detail.',
  },
  {
    key: 'noiseLevel',
    displayName: 'Reasoning consistency',
    description:
      'How consistently independent expert judges scored your memo. Wide disagreement is a signal — it means the memo is interpretable two different ways.',
    icon: Activity,
    actionHint:
      'Tighten the load-bearing claims so two different readers reach the same conclusion. Vague language is the usual culprit.',
  },
  {
    key: 'evidenceQuality',
    displayName: 'Evidence quality',
    description:
      "Whether the claims in your memo are backed by verifiable evidence — or contradicted by what's in the public record.",
    icon: CheckSquare,
    actionHint:
      "Re-check the contradicted claims before the committee meeting. They're the ones an auditor will catch.",
  },
  {
    key: 'processMaturity',
    displayName: 'Decision process',
    description:
      'How rigorous the decision process was — was dissent captured, was a prior recorded, will the outcome be tracked?',
    icon: Workflow,
    actionHint:
      'Capture at least one written counter-argument before the IC vote. Record what you expect the outcome to be. Set an outcome check-in date.',
  },
  {
    key: 'complianceRisk',
    displayName: 'Regulatory exposure',
    description:
      'Audit-detected risk patterns against the regulatory frameworks in scope. Not legal determinations — just where an auditor would look.',
    icon: Scale,
    actionHint:
      'Bring the flagged provisions to your GC or compliance officer before relying on the memo. The DPR cross-references each flag.',
  },
  {
    key: 'historicalAlignment',
    displayName: 'Historical pattern match',
    description:
      'How closely your decision pattern resembles successful or failed historical decisions in our 143-case reference library.',
    icon: Compass,
    actionHint:
      'Cross-reference the matched failures in /bias-genome — see which specific cases (WeWork, AOL-Time Warner, HP-Autonomy, etc.) match your bias profile.',
  },
  {
    key: 'compoundRisk',
    displayName: 'Compound failure patterns',
    description:
      "Named failure patterns where two or more biases combine to produce known catastrophic outcomes (Synergy Mirage, Winner's Curse, Yes Committee, etc.).",
    icon: Combine,
    actionHint:
      'Apply the pattern-specific mitigation playbook. Critical patterns are deal-blocking signals — bring the remediation steps to the committee.',
  },
];

// ─── Severity → colour mapping (matches platform palette) ────────────────────

function severityColorForScore(score: number): {
  bar: string;
  bg: string;
  text: string;
} {
  if (score >= 85)
    return { bar: 'var(--success)', bg: 'rgba(22,163,74,0.08)', text: 'var(--success)' };
  if (score >= 70) return { bar: 'var(--info)', bg: 'rgba(59,130,246,0.08)', text: 'var(--info)' };
  if (score >= 55)
    return { bar: 'var(--warning)', bg: 'rgba(245,158,11,0.08)', text: 'var(--warning)' };
  if (score >= 40)
    return {
      bar: 'var(--severity-high)',
      bg: 'rgba(249,115,22,0.08)',
      text: 'var(--severity-high)',
    };
  return { bar: 'var(--error)', bg: 'rgba(220,38,38,0.08)', text: 'var(--error)' };
}

function gradeBand(grade: string): string {
  if (grade === 'A') return 'Excellent — committee-ready';
  if (grade === 'B') return 'Good — minor tightening before committee';
  if (grade === 'C') return 'Workable — material gaps to close before committee';
  if (grade === 'D') return 'Below threshold — significant rework needed';
  return 'Failing — do not present in current form';
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export interface DqiBreakdownPanelProps {
  /** The full DQIResult from computeDQI. */
  dqi: DQIResult;
  /** Controlled open state. */
  open: boolean;
  /** Called when the dialog should close. */
  onOpenChange: (open: boolean) => void;
  /** Optional context label — e.g., document filename or deal name. */
  contextLabel?: string;
}

export function DqiBreakdownPanel({
  dqi,
  open,
  onOpenChange,
  contextLabel,
}: DqiBreakdownPanelProps) {
  const overallColors = severityColorForScore(dqi.score);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="dqi-panel-content"
        style={{
          maxWidth: 920,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 0,
        }}
      >
        {/* Header — overall score + grade band */}
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: overallColors.bg,
          }}
        >
          <DialogHeader>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <DialogTitle style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                  How your score is computed
                </DialogTitle>
                <DialogDescription style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {contextLabel
                    ? `For: ${contextLabel}`
                    : 'Decision Quality Index — full breakdown'}
                </DialogDescription>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 800,
                    color: overallColors.text,
                    lineHeight: 1,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {dqi.score}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    marginTop: 4,
                  }}
                >
                  Grade {dqi.grade}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 13.5,
                color: 'var(--text-primary)',
                fontWeight: 500,
              }}
            >
              {gradeBand(dqi.grade)}
            </div>
          </DialogHeader>
        </div>

        {/* Body — 7 component cards */}
        <div style={{ padding: '20px 28px 24px' }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              marginBottom: 14,
            }}
          >
            What goes into your score
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {COMPONENT_META.map(meta => {
              const component = dqi.components[meta.key];
              if (!component) return null;
              return <ComponentCard key={meta.key} meta={meta} component={component} />;
            })}
          </div>

          {/* Methodology footer */}
          <div
            style={{
              marginTop: 24,
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <Info size={13} style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-muted)' }} />
            <div>
              Score computed using Decision Intel methodology v{dqi.methodologyVersion}. Each
              component above is weighted, then summed to your overall score. The weight you see
              next to each card is the percentage that component contributes to the final number.
              Same memo audited again will produce the same score — no judgment calls in the math.
            </div>
          </div>
        </div>
      </DialogContent>

      <style jsx global>{`
        .dqi-panel-content {
          width: calc(100vw - 32px);
        }
      `}</style>
    </Dialog>
  );
}

// ─── Per-component card ──────────────────────────────────────────────────────

function ComponentCard({ meta, component }: { meta: ComponentMeta; component: DQIComponent }) {
  const [expanded, setExpanded] = useState(false);
  const colors = severityColorForScore(component.score);
  const Icon = meta.icon;
  const weightPct = Math.round(component.weight * 100);
  const hasBreakdown = (component.breakdownItems?.length ?? 0) > 0;
  const showActionHint = component.score < 60;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Card header — clickable to expand */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        disabled={!hasBreakdown}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: hasBreakdown ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          color: 'inherit',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: colors.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} style={{ color: colors.text }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {meta.displayName}
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: colors.text,
                fontFamily: 'var(--font-mono, monospace)',
                lineHeight: 1,
              }}
            >
              {component.score}
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                {' '}
                / 100
              </span>
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {meta.description}
          </div>
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              Contributes {weightPct}% to your score
            </span>
            {hasBreakdown && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                {expanded ? 'Hide details' : 'Show details'}
                {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </span>
            )}
          </div>

          {/* Score progress bar */}
          <div
            style={{
              marginTop: 8,
              height: 4,
              background: 'var(--bg-secondary)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${component.score}%`,
                height: '100%',
                background: colors.bar,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </button>

      {/* Expanded breakdown */}
      {expanded && hasBreakdown && (
        <div
          style={{
            padding: '4px 16px 16px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
          }}
        >
          {component.detail && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginTop: 12,
                marginBottom: 12,
                fontStyle: 'italic',
              }}
            >
              {component.detail}
            </div>
          )}

          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            What drove this score
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {component.breakdownItems!.map((item, idx) => (
              <BreakdownRow key={`${idx}-${item.label}`} item={item} />
            ))}
          </div>

          {showActionHint && (
            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                background: 'var(--bg-card)',
                border: `1px solid ${colors.bar}`,
                borderLeft: `3px solid ${colors.bar}`,
                borderRadius: 6,
                fontSize: 12.5,
                color: 'var(--text-primary)',
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                What to do
              </div>
              {meta.actionHint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Breakdown row ───────────────────────────────────────────────────────────

function BreakdownRow({ item }: { item: NonNullable<DQIComponent['breakdownItems']>[number] }) {
  const isPositive = item.impact > 0;
  const isNegative = item.impact < 0;
  const accentColor = isNegative
    ? 'var(--error)'
    : isPositive
      ? 'var(--success)'
      : 'var(--text-muted)';

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 6,
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: item.evidence ? 6 : 0,
        }}
      >
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
          }}
        >
          {item.label}
        </span>
        {item.impact !== 0 && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: accentColor,
              fontFamily: 'var(--font-mono, monospace)',
              flexShrink: 0,
            }}
          >
            {isPositive ? '+' : ''}
            {item.impact.toFixed(1)}
          </span>
        )}
      </div>
      {item.evidence && (
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            paddingLeft: 0,
          }}
        >
          {item.evidence}
        </div>
      )}
    </div>
  );
}
