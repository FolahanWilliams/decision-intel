'use client';

import { useState, useMemo } from 'react';
import { Search, BarChart3 } from 'lucide-react';
import { ALL_CASES } from '@/lib/data/case-studies';
import type { CaseStudy, Industry } from '@/lib/data/case-studies/types';
import {
  card,
  sectionTitle,
  label,
  badge,
  formatBias,
  formatIndustry,
  OUTCOME_COLORS,
  OUTCOME_LABELS,
} from '../shared-styles';

const INDUSTRIES: { value: string; label: string }[] = [
  { value: '', label: 'All Industries' },
  ...(
    [
      'financial_services',
      'technology',
      'healthcare',
      'energy',
      'automotive',
      'retail',
      'aerospace',
      'government',
      'entertainment',
      'media',
      'real_estate',
      'telecommunications',
      'manufacturing',
    ] as Industry[]
  ).map(i => ({ value: i, label: formatIndustry(i) })),
];

const OUTCOMES = [
  { value: '', label: 'All Outcomes' },
  { value: 'catastrophic_failure', label: 'Catastrophic Failure' },
  { value: 'failure', label: 'Failure' },
  { value: 'partial_failure', label: 'Partial Failure' },
  { value: 'partial_success', label: 'Partial Success' },
  { value: 'success', label: 'Success' },
  { value: 'exceptional_success', label: 'Exceptional Success' },
];

interface Props {
  onSelectCase: (c: CaseStudy) => void;
}

export function CaseStudyPicker({ onSelectCase }: Props) {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [outcome, setOutcome] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ALL_CASES.filter(c => {
      if (industry && c.industry !== industry) return false;
      if (outcome && c.outcome !== outcome) return false;
      if (q && !c.company.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [search, industry, outcome]);

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid var(--border-primary, #222)',
    background: 'var(--bg-primary, #0a0a0a)',
    color: 'var(--text-primary, #fff)',
    fontSize: 12,
    outline: 'none',
    minWidth: 140,
  };

  return (
    <div style={card}>
      <div style={sectionTitle}>
        <BarChart3 size={18} style={{ color: '#F97316' }} />
        Case Study Visuals ({ALL_CASES.length})
      </div>
      <p style={{ ...label, marginBottom: 12, textTransform: 'none' as const, fontSize: 12 }}>
        Select a case study to generate downloadable bias graphs and knowledge graphs for social
        media posts.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            minWidth: 180,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--border-primary, #222)',
            background: 'var(--bg-primary, #0a0a0a)',
          }}
        >
          <Search size={14} style={{ color: 'var(--text-muted, #71717a)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company or title..."
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary, #fff)',
              fontSize: 12,
              outline: 'none',
              width: '100%',
            }}
          />
        </div>
        <select value={industry} onChange={e => setIndustry(e.target.value)} style={selectStyle}>
          {INDUSTRIES.map(i => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
        <select value={outcome} onChange={e => setOutcome(e.target.value)} style={selectStyle}>
          {OUTCOMES.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)', marginBottom: 8 }}>
        {filtered.length} case{filtered.length !== 1 ? 's' : ''} found
      </div>

      {/* Case study list */}
      <div
        style={{
          maxHeight: 400,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {filtered.map(c => {
          const outcomeColor = OUTCOME_COLORS[c.outcome] ?? '#94A3B8';
          return (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-primary, #222)',
                background: 'var(--bg-primary, #0a0a0a)',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover, #444)')}
              onMouseLeave={e =>
                (e.currentTarget.style.borderColor = 'var(--border-primary, #222)')
              }
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary, #fff)',
                    marginBottom: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {c.company}{' '}
                  <span style={{ color: 'var(--text-muted, #71717a)', fontWeight: 400 }}>
                    ({c.year})
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary, #a1a1aa)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {c.title}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={badge(outcomeColor)}>{OUTCOME_LABELS[c.outcome] ?? c.outcome}</span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted, #71717a)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.biasesPresent.length} biases
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onSelectCase(c);
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: '1px solid #F9731940',
                    background: '#F9731915',
                    color: '#F97316',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Analyze
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'var(--text-muted, #71717a)',
              fontSize: 13,
            }}
          >
            No case studies match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
