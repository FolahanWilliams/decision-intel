'use client';

import { Compass, ArrowRight } from 'lucide-react';
import type { BiasInstance } from '@/types';

// RPD pre-mortem suggestions card (D3 lock 2026-04-28).
//
// The RPD Simulator (G24, 2026-04-27) is reactive — the user types a
// scenario, it analyses. This card makes Klein's recognition-primed
// half of R²F PROACTIVE: when an analysis surfaces a high-uncertainty
// bias pattern, suggest the specific scenarios worth pre-morteming for
// THIS memo. The buyer doesn't have to think of what to test; the audit
// already named the gap.
//
// Mounted on the Overview tab so the suggestions live one click from
// the bias list. Each suggestion stores the action in sessionStorage
// and dispatches a 'navigate-tab' event — the SimulatorTab's
// RPDSimulatorCard checks sessionStorage on mount and pre-fills the
// input. The buyer goes from "biases flagged" → "scenarios worth
// stress-testing" → "the simulator already loaded with my scenario"
// in three clicks.

interface RPDPreMortemSuggestionsCardProps {
  documentId: string;
  biases: BiasInstance[];
}

interface PreMortemSuggestion {
  /** The scenario text written into the simulator input. */
  action: string;
  /** Short user-facing label (button copy). */
  label: string;
  /** Why this scenario is worth testing — one line. */
  rationale: string;
  /** The bias type this maps from, for traceability. */
  triggeredBy: string;
}

// Rule-based bias→scenario mapping. Keeps the suggestions deterministic
// (a buyer doing the same audit twice gets the same suggestions, which
// matters for trust) and avoids an extra LLM call. Each entry is the
// SECOND-ORDER question the bias raises — what would falsify the
// recommendation if this bias is actually present?
const BIAS_PREMORTEM_TEMPLATES: Record<
  string,
  { label: string; action: string; rationale: string }
> = {
  confirmation_bias: {
    label: 'What if our base rate is wrong?',
    action:
      'Proceed with the recommendation as written, but assume our base rate assumption is the opposite of what we anchored on.',
    rationale:
      'The audit flagged confirmation bias — the recommendation may have selected for evidence that supports the conclusion. Stress-test the inverse base rate.',
  },
  anchoring_bias: {
    label: 'What if we re-anchored on the industry median?',
    action:
      'Proceed with the same recommendation, but anchor the financial model on the industry median rather than the comparable transaction we cited.',
    rationale:
      "The audit flagged anchoring on a specific number — the model's outputs cascade from that anchor.",
  },
  overconfidence_bias: {
    label: 'What if our confidence interval is half its width?',
    action:
      'Proceed with the recommendation, but assume the actual variance on every projection is double what we modelled.',
    rationale:
      "Overconfidence flagged — the variance bands are likely too narrow. Test the recommendation under realistic uncertainty.",
  },
  groupthink: {
    label: 'What if a senior dissenter walked in tomorrow?',
    action:
      "Proceed with the recommendation, but a senior partner who wasn't in the original discussion arrives with three reasons it's wrong.",
    rationale:
      'Groupthink flagged — the room may have converged before stress-testing. Imagine the late-arriving dissenter.',
  },
  sunk_cost_fallacy: {
    label: 'What if we ignored what we have already spent?',
    action:
      'Proceed only if the recommendation makes sense for a clean-sheet investor with zero prior commitment to this decision path.',
    rationale:
      "Sunk-cost flagged — the recommendation may be partly justified by money already gone. Test the clean-sheet version.",
  },
  availability_heuristic: {
    label: 'What if our recent reference deal was an outlier?',
    action:
      'Proceed with the recommendation, but assume the recent comparable transaction we cited was a 1-in-20 outlier rather than representative.',
    rationale:
      'Availability flagged — recent salient examples may be over-weighted. Test against the broader distribution.',
  },
  optimism_bias: {
    label: 'What if execution slips by 6 months?',
    action:
      'Proceed with the recommendation, but assume every milestone slips by 6 months and 30% of the synergies never materialise.',
    rationale:
      "Optimism flagged — the execution timeline may be aspirational. Stress-test the realistic-friction version.",
  },
  loss_aversion: {
    label: 'What if the downside scenario is actually the base case?',
    action:
      'Proceed with the recommendation as if the downside scenario in the memo is the median outcome, not the tail.',
    rationale:
      "Loss aversion flagged — the memo may have under-weighted the realistic downside. Test the inverted case.",
  },
  recency_bias: {
    label: 'What if last quarter was the anomaly?',
    action:
      'Proceed with the recommendation, but assume the last quarter of data points were anomalous and the longer-term mean reverts.',
    rationale:
      "Recency flagged — recent data may be over-weighted. Test the longer-horizon mean-reverting version.",
  },
  status_quo_bias: {
    label: 'What if we made the bigger move instead?',
    action:
      'Proceed with the recommendation, but at twice the proposed scope (acquisition size, market entry depth, hire count).',
    rationale:
      "Status-quo flagged — the recommendation may be the conservative-by-default option. Test the more ambitious version.",
  },
};

const MAX_SUGGESTIONS = 3;

function buildSuggestions(biases: BiasInstance[]): PreMortemSuggestion[] {
  // Sort biases by severity (critical → high → medium → low), then take
  // the first MAX_SUGGESTIONS that have templates. Drop duplicates by
  // bias type — if confirmation_bias appears twice we still only emit
  // one pre-mortem for it.
  const SEVERITY_RANK: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  const seen = new Set<string>();
  const ranked = [...biases].sort(
    (a, b) =>
      (SEVERITY_RANK[b.severity ?? 'low'] ?? 0) - (SEVERITY_RANK[a.severity ?? 'low'] ?? 0)
  );
  const out: PreMortemSuggestion[] = [];
  for (const bias of ranked) {
    if (out.length >= MAX_SUGGESTIONS) break;
    if (seen.has(bias.biasType)) continue;
    const template = BIAS_PREMORTEM_TEMPLATES[bias.biasType];
    if (!template) continue;
    seen.add(bias.biasType);
    out.push({
      ...template,
      triggeredBy: bias.biasType,
    });
  }
  return out;
}

export function RPDPreMortemSuggestionsCard({
  documentId,
  biases,
}: RPDPreMortemSuggestionsCardProps) {
  const suggestions = buildSuggestions(biases);
  if (suggestions.length === 0) return null;

  const handleClick = (suggestion: PreMortemSuggestion) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(`rpd-prefill-${documentId}`, suggestion.action);
    } catch {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
    }
    // Dispatch the same event the doc-detail page already uses to switch
    // tabs (the SimulatorTab listens via the perspectives sub-view tabs).
    window.dispatchEvent(
      new CustomEvent('document-detail-navigate', {
        detail: { tab: 'perspectives', subView: 'what-if' },
      })
    );
  };

  return (
    <div
      className="card"
      style={{
        marginTop: 'var(--spacing-md)',
        borderLeft: '3px solid var(--accent-primary)',
      }}
    >
      <div className="card-body">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          <Compass size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Scenarios worth pre-morteming
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            · derived from this memo&apos;s flagged biases
          </span>
        </div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '0 0 var(--spacing-md) 0',
            lineHeight: 1.5,
          }}
        >
          Each pre-mortem stress-tests the recommendation against a specific blind spot the audit
          flagged. Click to load the scenario into the RPD simulator and see what historical
          analogs from the 135-case reference library did.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {suggestions.map(s => (
            <button
              key={s.triggeredBy}
              onClick={() => handleClick(s)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'inherit',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'rgba(22, 163, 74, 0.04)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--bg-elevated)';
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {s.rationale}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginTop: 6,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  triggered by · {s.triggeredBy.replace(/_/g, ' ')}
                </div>
              </div>
              <ArrowRight
                size={14}
                style={{
                  color: 'var(--accent-primary)',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
