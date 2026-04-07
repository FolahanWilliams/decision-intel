'use client';

import { useState } from 'react';
import type React from 'react';
import {
  Library,
  AlertTriangle,
  Network,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  card,
  sectionTitle,
  label,
  stat,
  badge,
  formatBias,
  formatIndustry,
  OUTCOME_COLORS,
  OUTCOME_LABELS,
} from '@/components/founder-hub/shared-styles';
import {
  ALL_CASES,
  getCaseStatistics,
  isFailureOutcome,
  isSuccessOutcome,
} from '@/lib/data/case-studies';

export function CaseStudiesTab() {
  const [filter, setFilter] = useState<'all' | 'failures' | 'successes'>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = getCaseStatistics();
  const industries = Object.keys(stats.byIndustry).sort();

  const filteredCases = ALL_CASES.filter(c => {
    if (filter === 'failures' && !isFailureOutcome(c.outcome)) return false;
    if (filter === 'successes' && !isSuccessOutcome(c.outcome)) return false;
    if (industryFilter !== 'all' && c.industry !== industryFilter) return false;
    return true;
  }).sort((a, b) => b.impactScore - a.impactScore);

  const filterBtn = (
    value: 'all' | 'failures' | 'successes',
    labelText: string,
    count: number
  ): React.ReactNode => (
    <button
      key={value}
      onClick={() => setFilter(value)}
      style={{
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: filter === value ? 700 : 500,
        color: filter === value ? '#fff' : 'var(--text-muted, #71717a)',
        background: filter === value ? '#16A34A20' : 'transparent',
        border: filter === value ? '1px solid #16A34A' : '1px solid var(--border-primary, #333)',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {labelText} ({count})
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ ...card, borderLeft: '3px solid #16A34A' }}>
        <h2 style={sectionTitle}>
          <Library size={20} style={{ color: '#16A34A' }} />
          Real-World Case Studies Database
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          Meticulously sourced public company decisions — from catastrophic failures to exceptional
          successes. Each case study maps cognitive biases, toxic combinations, and mitigation
          patterns used by the analysis engine to calibrate risk scoring.
        </p>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { label: 'Total Cases', value: stats.totalCases, color: '#16A34A' },
          { label: 'Failure Cases', value: stats.failureCount, color: '#ef4444' },
          { label: 'Success Cases', value: stats.successCount, color: '#22c55e' },
          { label: 'Industries', value: Object.keys(stats.byIndustry).length, color: '#f59e0b' },
          { label: 'Unique Biases', value: stats.byBias.length, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={card}>
            <p style={label}>{s.label}</p>
            <p style={{ ...stat, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bias Frequency + Pattern Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Top Biases */}
        <div style={card}>
          <h3 style={{ ...sectionTitle, fontSize: 15 }}>
            <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
            Top Biases by Frequency
          </h3>
          {stats.byBias.slice(0, 10).map(([biasName, count]) => {
            const maxCount = stats.byBias[0]?.[1] ?? 1;
            return (
              <div key={biasName} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--text-secondary, #a1a1aa)',
                    marginBottom: 3,
                  }}
                >
                  <span>{formatBias(biasName)}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{count}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: 'var(--bg-tertiary, #1a1a1a)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(count / maxCount) * 100}%`,
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Patterns */}
        <div style={card}>
          <h3 style={{ ...sectionTitle, fontSize: 15 }}>
            <Network size={16} style={{ color: '#8b5cf6' }} />
            Named Patterns
          </h3>
          {stats.byPattern.length > 0 && (
            <>
              <p style={{ ...label, marginBottom: 8 }}>Toxic Combinations</p>
              {stats.byPattern.slice(0, 5).map(([pattern, count]) => (
                <div
                  key={pattern}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--border-primary, #222)',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: '#ef4444' }}>{pattern}</span>
                  <span style={badge('#ef4444')}>{count} cases</span>
                </div>
              ))}
            </>
          )}
          {stats.byBeneficialPattern.length > 0 && (
            <>
              <p style={{ ...label, marginTop: 16, marginBottom: 8 }}>Beneficial Patterns</p>
              {stats.byBeneficialPattern.slice(0, 5).map(([pattern, count]) => (
                <div
                  key={pattern}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--border-primary, #222)',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: '#22c55e' }}>{pattern}</span>
                  <span style={badge('#22c55e')}>{count} cases</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          ...card,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {filterBtn('all', 'All', stats.totalCases)}
        {filterBtn('failures', 'Failures', stats.failureCount)}
        {filterBtn('successes', 'Successes', stats.successCount)}
        <div style={{ marginLeft: 'auto' }}>
          <select
            value={industryFilter}
            onChange={e => setIndustryFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid var(--border-primary, #333)',
              background: 'var(--bg-secondary, #111)',
              color: 'var(--text-primary, #fff)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All Industries</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>
                {formatIndustry(ind)} ({stats.byIndustry[ind]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Case Study Cards */}
      <div style={{ marginTop: 4 }}>
        {filteredCases.map(c => {
          const isExpanded = expandedId === c.id;
          const outcomeColor = OUTCOME_COLORS[c.outcome];

          return (
            <div
              key={c.id}
              style={{
                ...card,
                borderLeft: `3px solid ${outcomeColor}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onClick={() => setExpandedId(isExpanded ? null : c.id)}
            >
              {/* Card Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #fff)' }}
                    >
                      {c.company}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted, #71717a)' }}>
                      {c.year}
                    </span>
                    <span style={badge(outcomeColor)}>{OUTCOME_LABELS[c.outcome]}</span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-secondary, #a1a1aa)',
                      margin: '0 0 8px',
                    }}
                  >
                    {c.title}
                  </p>
                  {/* Bias Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {c.biasesPresent.map(b => (
                      <span
                        key={b}
                        style={{
                          ...badge(c.biasesManaged.includes(b) ? '#22c55e' : '#16A34A'),
                          fontSize: 10,
                        }}
                      >
                        {c.biasesManaged.includes(b) ? '\u2713 ' : ''}
                        {formatBias(b)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right side: Impact */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      justifyContent: 'flex-end',
                    }}
                  >
                    {c.impactDirection === 'positive' ? (
                      <ArrowUpRight size={16} style={{ color: '#22c55e' }} />
                    ) : (
                      <ArrowDownRight size={16} style={{ color: '#ef4444' }} />
                    )}
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: c.impactDirection === 'positive' ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {c.impactScore}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      margin: '2px 0 0',
                      maxWidth: 160,
                    }}
                  >
                    {c.estimatedImpact}
                  </p>
                  {isExpanded ? (
                    <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginTop: 4 }} />
                  ) : (
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', marginTop: 4 }} />
                  )}
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid var(--border-primary, #222)',
                  }}
                >
                  {/* Summary */}
                  <div style={{ marginBottom: 14 }}>
                    <p style={label}>Summary</p>
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--text-secondary, #a1a1aa)',
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {c.summary}
                    </p>
                  </div>

                  {/* Decision Context */}
                  <div style={{ marginBottom: 14 }}>
                    <p style={label}>Decision Context</p>
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--text-secondary, #a1a1aa)',
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {c.decisionContext}
                    </p>
                  </div>

                  {/* Meta Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <p style={label}>Industry</p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>
                        {formatIndustry(c.industry)}
                      </p>
                    </div>
                    <div>
                      <p style={label}>Primary Bias</p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>
                        {formatBias(c.primaryBias)}
                      </p>
                    </div>
                    <div>
                      <p style={label}>Source Type</p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>
                        {formatIndustry(c.sourceType)}
                      </p>
                    </div>
                  </div>

                  {/* Toxic Combinations / Beneficial Patterns */}
                  {(c.toxicCombinations.length > 0 || c.beneficialPatterns.length > 0) && (
                    <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                      {c.toxicCombinations.length > 0 && (
                        <div>
                          <p style={label}>Toxic Combinations</p>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {c.toxicCombinations.map(p => (
                              <span key={p} style={badge('#ef4444')}>
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {c.beneficialPatterns.length > 0 && (
                        <div>
                          <p style={label}>Beneficial Patterns</p>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {c.beneficialPatterns.map(p => (
                              <span key={p} style={badge('#22c55e')}>
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mitigation Factors (success cases) */}
                  {c.mitigationFactors.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={label}>Mitigation Factors</p>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {c.mitigationFactors.map((f, i) => (
                          <li key={i} style={{ fontSize: 12, color: '#22c55e', lineHeight: 1.7 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lessons Learned */}
                  <div style={{ marginBottom: 14 }}>
                    <p style={label}>Lessons Learned</p>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {c.lessonsLearned.map((l, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 12,
                            color: 'var(--text-secondary, #a1a1aa)',
                            lineHeight: 1.7,
                            marginBottom: 4,
                          }}
                        >
                          {l}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Source */}
                  <div>
                    <p style={label}>Source</p>
                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted, #71717a)',
                        margin: 0,
                        fontStyle: 'italic',
                      }}
                    >
                      {c.source}
                    </p>
                  </div>

                  {/* Pre-Decision Evidence */}
                  {c.preDecisionEvidence && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 16,
                        borderRadius: 8,
                        background: 'var(--bg-tertiary, #0a0a0a)',
                        border: '1px solid #16A34A40',
                      }}
                    >
                      <p style={{ ...label, color: '#16A34A', marginBottom: 10 }}>
                        Pre-Decision Evidence — What the Platform Would Have Caught
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                        {c.preDecisionEvidence.documentType.replace(/_/g, ' ').toUpperCase()} —{' '}
                        {c.preDecisionEvidence.date} — {c.preDecisionEvidence.source}
                      </p>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary, #a1a1aa)',
                          lineHeight: 1.7,
                          marginBottom: 12,
                          padding: '10px 14px',
                          borderLeft: '3px solid #16A34A40',
                          background: 'var(--bg-secondary, #111)',
                          borderRadius: 4,
                          fontStyle: 'italic',
                        }}
                      >
                        {c.preDecisionEvidence.document.length > 600
                          ? c.preDecisionEvidence.document.slice(0, 600) + '...'
                          : c.preDecisionEvidence.document}
                      </div>

                      <p style={{ ...label, color: '#ef4444', marginBottom: 6 }}>
                        Detectable Red Flags at Decision Time
                      </p>
                      <ul style={{ margin: '0 0 12px', paddingLeft: 18 }}>
                        {c.preDecisionEvidence.detectableRedFlags.map((flag, i) => (
                          <li key={i} style={{ fontSize: 12, color: '#ef4444', lineHeight: 1.7 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{flag}</span>
                          </li>
                        ))}
                      </ul>

                      <p style={{ ...label, color: '#f59e0b', marginBottom: 6 }}>
                        Biases Flaggable Before Outcome
                      </p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                        {c.preDecisionEvidence.flaggableBiases.map(b => (
                          <span key={b} style={badge('#f59e0b')}>
                            {formatBias(b)}
                          </span>
                        ))}
                      </div>

                      <p style={{ ...label, color: '#22c55e', marginBottom: 6 }}>
                        Hypothetical DI Platform Analysis
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary, #a1a1aa)',
                          lineHeight: 1.7,
                          margin: 0,
                        }}
                      >
                        {c.preDecisionEvidence.hypotheticalAnalysis}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredCases.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: 40 }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              No case studies match the current filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
