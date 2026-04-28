'use client';
import { useState, useMemo } from 'react';
import {
  BarChart3,
  Target,
  Brain,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  WEIGHTS,
  GRADE_THRESHOLDS,
  SYSTEM1_BIASES,
  METHODOLOGY_VERSION,
  computeSyntheticDQI,
  computeHistoricalPercentile,
} from '@/lib/scoring/dqi';
import {
  ALL_CASES,
  HISTORICAL_CASE_COUNT,
  isFailureOutcome,
  isSuccessOutcome,
} from '@/lib/data/case-studies';
import {
  card,
  sectionTitle,
  label,
  badge,
  formatBias,
  OUTCOME_COLORS,
  OUTCOME_LABELS,
} from './shared-styles';
import type { CaseOutcome } from '@/lib/data/case-studies/types';

// ---------------------------------------------------------------------------
// Component weight colors
// ---------------------------------------------------------------------------

const COMPONENT_COLORS: Record<string, string> = {
  biasLoad: '#ef4444',
  noiseLevel: '#f59e0b',
  evidenceQuality: '#3b82f6',
  processMaturity: '#22c55e',
  complianceRisk: '#8b5cf6',
  historicalAlignment: '#06b6d4',
};

const COMPONENT_LABELS: Record<string, string> = {
  biasLoad: 'Bias Load',
  noiseLevel: 'Noise Level',
  evidenceQuality: 'Evidence Quality',
  processMaturity: 'Process Maturity',
  complianceRisk: 'Compliance Risk',
  historicalAlignment: 'Historical Alignment',
};

const COMPONENT_DESCRIPTIONS: Record<string, string> = {
  biasLoad:
    "Starts at 100. Subtracts severity-weighted penalties per detected bias: critical=-20, high=-12, medium=-6, low=-2. Uses square-root diminishing returns so many moderate biases don't overwhelm a few critical ones.",
  noiseLevel:
    'Based on judge panel standard deviation. stdDev of 0 → score 100, stdDev of 30+ → score 0. +5 bonus for having 3+ independent judges. Lower inter-judge variance = better decision quality.',
  evidenceQuality:
    'Weighted combination: (verification rate × 60) + (40 - contradictions found × 8). Higher fact-check verification and fewer contradictions = higher score.',
  processMaturity:
    'Baseline 40. +20 for dissent present, +15 for prior submitted, +15 for outcome tracked, +10 for 3-12 participants, +10 for 1000+ word analysis. System 1 ratio >70%: -8 penalty; <40%: +5 bonus.',
  complianceRisk:
    'Score = 100 - riskScore. Violations reduce the score: each violation subtracts from the base. More frameworks checked without violations = higher confidence.',
  historicalAlignment:
    'Starts at 70. Matched failure patterns: -8 each. Correlation multiplier >1.0: -(multiplier-1.0)×30 penalty. Success patterns: +10 each. Beneficial damping: +(1-damping)×20 bonus. This component uses the case study database.',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gradeColorForScore(score: number): string {
  for (const t of GRADE_THRESHOLDS) {
    if (score >= t.min) return t.color;
  }
  return GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1].color;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DqiMethodologyTab() {
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'success' | 'failure'>('all');

  // Pre-compute case study benchmarks
  const caseRankings = useMemo(
    () =>
      ALL_CASES.map(c => ({
        company: c.company,
        dqi: computeSyntheticDQI(c),
        outcome: c.outcome,
        year: c.year,
      })).sort((a, b) => b.dqi - a.dqi),
    []
  );

  const filteredCases = caseRankings.filter(c => {
    if (outcomeFilter === 'success') return isSuccessOutcome(c.outcome as CaseOutcome);
    if (outcomeFilter === 'failure') return isFailureOutcome(c.outcome as CaseOutcome);
    return true;
  });

  const weightEntries = Object.entries(WEIGHTS) as Array<[string, number]>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Section 1: Header Card ─────────────────────────────────────── */}
      <div style={{ ...card, borderLeft: '3px solid #16A34A' }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-primary, #fff)',
            marginBottom: 6,
          }}
        >
          DQI Methodology v{METHODOLOGY_VERSION}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted, #71717a)', lineHeight: 1.6 }}>
          The Decision Quality Index is like a{' '}
          <span style={{ color: '#16A34A', fontWeight: 600 }}>Lighthouse Score for decisions</span>{' '}
          — a single 0-100 score with a fully published methodology. It quantifies how well a
          decision process manages cognitive biases, evidence quality, noise, process maturity,
          compliance risk, and historical pattern alignment.
        </div>
      </div>

      {/* ── Section 2: Component Weight Breakdown ──────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <BarChart3 size={18} />
          6-Component Scoring Model
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {weightEntries.map(([key, weight]) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
                  {COMPONENT_LABELS[key]}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: COMPONENT_COLORS[key] }}>
                  {Math.round(weight * 100)}%
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 4,
                  background: 'var(--border-primary, #222)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${weight * 100}%`,
                    borderRadius: 4,
                    background: COMPONENT_COLORS[key],
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: How Each Component Scores (Accordion) ───────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <Target size={18} />
          How Each Component Scores
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {weightEntries.map(([key, weight]) => {
            const isExpanded = expandedComponent === key;
            return (
              <div key={key}>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedComponent(isExpanded ? null : key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--border-primary, #222)' : 'transparent',
                    border: 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isExpanded ? (
                      <ChevronDown size={16} color="var(--text-muted, #71717a)" />
                    ) : (
                      <ChevronRight size={16} color="var(--text-muted, #71717a)" />
                    )}
                    <span
                      style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #fff)' }}
                    >
                      {COMPONENT_LABELS[key]}
                    </span>
                  </div>
                  <span style={badge(COMPONENT_COLORS[key])}>{Math.round(weight * 100)}%</span>
                </button>
                {isExpanded && (
                  <div
                    style={{
                      padding: '8px 12px 12px 38px',
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: 'var(--text-muted, #71717a)',
                    }}
                  >
                    {COMPONENT_DESCRIPTIONS[key]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: How Case Studies Feed the Score ──────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <AlertTriangle size={18} />
          How Case Studies Affect Your Score
        </div>

        {/* Visual flow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 16,
          }}
        >
          <div style={badge('#16A34A')}>{HISTORICAL_CASE_COUNT} Case Studies</div>
          <span style={{ color: 'var(--text-muted, #71717a)', fontSize: 18 }}>→</span>
          <div
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #16A34A30',
              background: '#16A34A10',
              fontSize: 13,
              fontWeight: 600,
              color: '#16A34A',
            }}
          >
            Correlation Engine
          </div>
          <span style={{ color: 'var(--text-muted, #71717a)', fontSize: 18 }}>→</span>
          <div
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #06b6d430',
              background: '#06b6d410',
              fontSize: 13,
              fontWeight: 600,
              color: '#06b6d4',
            }}
          >
            Historical Alignment (10% of DQI)
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            fontSize: 13,
            lineHeight: 1.65,
            color: 'var(--text-muted, #71717a)',
          }}
        >
          <p style={{ margin: 0 }}>
            When your document is analyzed, the detected biases are compared against our database of{' '}
            {HISTORICAL_CASE_COUNT} real-world failure and success case studies.
          </p>
          <p style={{ margin: 0 }}>
            If your bias pattern matches known failure patterns (like overconfidence + anchoring in
            Yahoo&apos;s $40B mistake), the Historical Alignment score{' '}
            <span style={{ color: '#ef4444', fontWeight: 600 }}>decreases</span>.
          </p>
          <p style={{ margin: 0 }}>
            If your pattern matches success patterns with active mitigation (like Apple&apos;s
            managed cannibalization), the score{' '}
            <span style={{ color: '#22c55e', fontWeight: 600 }}>increases</span>.
          </p>
        </div>
      </div>

      {/* ── Section 5: Case Study DQI Rankings ─────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <TrendingUp size={18} />
          Case Study DQI Benchmarks
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['all', 'success', 'failure'] as const).map(f => (
            <button
              key={f}
              onClick={() => setOutcomeFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid',
                borderColor: outcomeFilter === f ? '#16A34A' : 'var(--border-primary, #222)',
                background: outcomeFilter === f ? '#16A34A20' : 'transparent',
                color: outcomeFilter === f ? '#16A34A' : 'var(--text-muted, #71717a)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? 'All' : f === 'success' ? 'Successes' : 'Failures'}
            </button>
          ))}
        </div>

        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 0.6fr 0.8fr 1fr 0.8fr',
            gap: 8,
            padding: '8px 0',
            borderBottom: '1px solid var(--border-primary, #222)',
          }}
        >
          <span style={label}>Company</span>
          <span style={label}>Year</span>
          <span style={label}>DQI</span>
          <span style={label}>Outcome</span>
          <span style={label}>Percentile</span>
        </div>

        {/* Table rows */}
        {filteredCases.map((c, i) => {
          const scoreColor = gradeColorForScore(c.dqi);
          const percentile = computeHistoricalPercentile(c.dqi);
          const outcomeColor = OUTCOME_COLORS[c.outcome as CaseOutcome] ?? '#71717a';
          return (
            <div
              key={`${c.company}-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.6fr 0.8fr 1fr 0.8fr',
                gap: 8,
                padding: '8px 0',
                borderBottom: '1px solid var(--border-primary, #222)',
                fontSize: 13,
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--text-primary, #fff)', fontWeight: 500 }}>
                {c.company}
              </span>
              <span style={{ color: 'var(--text-muted, #71717a)' }}>{c.year}</span>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 13,
                  background: `${scoreColor}18`,
                  color: scoreColor,
                }}
              >
                {c.dqi}
              </span>
              <span style={badge(outcomeColor)}>
                {OUTCOME_LABELS[c.outcome as CaseOutcome] ?? c.outcome}
              </span>
              <span style={{ color: 'var(--text-muted, #71717a)', fontSize: 12 }}>
                {percentile}th
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Section 6: System 1 vs System 2 Classification ─────────────── */}
      <div style={card}>
        <div style={sectionTitle}>
          <Brain size={18} />
          System 1 vs System 2 Bias Classification
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
          {/* System 1 column */}
          <div
            style={{
              padding: 14,
              borderRadius: 8,
              border: '1px solid #f59e0b30',
              background: '#f59e0b08',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#f59e0b',
                marginBottom: 10,
              }}
            >
              System 1 (Heuristic)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Array.from(SYSTEM1_BIASES).map(b => (
                <span key={b} style={badge('#f59e0b')}>
                  {formatBias(b)}
                </span>
              ))}
            </div>
          </div>

          {/* System 2 column */}
          <div
            style={{
              padding: 14,
              borderRadius: 8,
              border: '1px solid #3b82f630',
              background: '#3b82f608',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#3b82f6',
                marginBottom: 10,
              }}
            >
              System 2 (Deliberative)
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted, #71717a)' }}>
              All other detected biases (confirmation, groupthink, sunk cost, planning fallacy,
              etc.) are classified as deliberative System 2 biases.
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--border-primary, #222)',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--text-muted, #71717a)',
          }}
        >
          <strong style={{ color: 'var(--text-primary, #fff)' }}>Scoring impact:</strong> When
          &gt;70% of detected biases are System 1:{' '}
          <span style={{ color: '#ef4444', fontWeight: 600 }}>-8 process maturity penalty</span>.
          When &lt;40% are System 1:{' '}
          <span style={{ color: '#22c55e', fontWeight: 600 }}>+5 deliberative bonus</span>.
        </div>
      </div>

      {/* ── Section 7: Grade Thresholds ────────────────────────────────── */}
      <div style={card}>
        <div style={sectionTitle}>Grade Scale</div>

        <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden' }}>
          {GRADE_THRESHOLDS.map((t, i) => {
            const nextMin = i > 0 ? GRADE_THRESHOLDS[i - 1].min : 101;
            const rangeLabel = `${t.min}-${nextMin - 1}`;
            return (
              <div
                key={t.grade}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  textAlign: 'center',
                  background: `${t.color}20`,
                  borderRight:
                    i < GRADE_THRESHOLDS.length - 1
                      ? '1px solid var(--border-primary, #222)'
                      : 'none',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: t.color }}>{t.grade}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)', marginTop: 2 }}>
                  {rangeLabel}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted, #71717a)',
                    marginTop: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {t.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
