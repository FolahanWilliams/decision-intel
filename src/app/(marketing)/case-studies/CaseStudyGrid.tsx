'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';
import { isFailureOutcome, isSuccessOutcome, type CaseStudy } from '@/lib/data/case-studies';
import { outcomeColor } from '@/lib/data/case-studies/outcome-color';
import { trackEvent } from '@/lib/analytics/track';
import { formatIndustry, formatOutcome, formatBiasName } from '@/lib/utils/labels';

interface GridCase {
  slug: string;
  company: string;
  title: string;
  year: number;
  industry: string;
  outcome: CaseStudy['outcome'];
  primaryBias: string;
  lessonPreview: string;
  hasDeepAnalysis: boolean;
  biasCount: number;
  toxicCount: number;
  impactScore: number;
  estimatedImpact: string;
}

interface CaseStudyGridProps {
  cases: GridCase[];
  industries: string[];
}

type OutcomeFilter = 'all' | 'failure' | 'success';
type DepthFilter = 'all' | 'deep';

const C = {
  navy: '#0F172A',
  green: '#16A34A',
  slate200: '#E2E8F0',
  slate500: '#64748B',
  slate700: '#334155',
} as const;

export function CaseStudyGrid({ cases, industries }: CaseStudyGridProps) {
  const [industry, setIndustry] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all');
  const [depthFilter, setDepthFilter] = useState<DepthFilter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return cases.filter(c => {
      if (industry !== 'all' && c.industry !== industry) return false;
      if (outcomeFilter === 'failure' && !isFailureOutcome(c.outcome)) return false;
      if (outcomeFilter === 'success' && !isSuccessOutcome(c.outcome)) return false;
      if (depthFilter === 'deep' && !c.hasDeepAnalysis) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!c.company.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [cases, industry, outcomeFilter, depthFilter, query]);

  return (
    <div>
      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 24,
          padding: 16,
          background: '#FFFFFF',
          border: `1px solid ${C.slate200}`,
          borderRadius: 12,
        }}
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search company or title…"
          style={{
            flex: '1 1 100%',
            minWidth: 0,
            padding: '10px 14px',
            border: `1px solid ${C.slate200}`,
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
          }}
          aria-label="Search case studies"
        />
        <select
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            padding: '10px 14px',
            border: `1px solid ${C.slate200}`,
            borderRadius: 8,
            fontSize: 13,
            background: '#FFFFFF',
            cursor: 'pointer',
          }}
          aria-label="Filter by industry"
        >
          <option value="all">All industries</option>
          {industries.map(ind => (
            <option key={ind} value={ind}>
              {formatIndustry(ind)}
            </option>
          ))}
        </select>
        <select
          value={outcomeFilter}
          onChange={e => setOutcomeFilter(e.target.value as OutcomeFilter)}
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            padding: '10px 14px',
            border: `1px solid ${C.slate200}`,
            borderRadius: 8,
            fontSize: 13,
            background: '#FFFFFF',
            cursor: 'pointer',
          }}
          aria-label="Filter by outcome"
        >
          <option value="all">All outcomes</option>
          <option value="failure">Failures only</option>
          <option value="success">Successes only</option>
        </select>
        <select
          value={depthFilter}
          onChange={e => setDepthFilter(e.target.value as DepthFilter)}
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            padding: '10px 14px',
            border: `1px solid ${C.slate200}`,
            borderRadius: 8,
            fontSize: 13,
            background: '#FFFFFF',
            cursor: 'pointer',
          }}
          aria-label="Filter by depth"
        >
          <option value="all">All cases</option>
          <option value="deep">Deep analysis only</option>
        </select>
      </div>

      <div style={{ fontSize: 13, color: C.slate500, marginBottom: 16 }}>
        Showing {filtered.length} of {cases.length} cases
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {filtered.map(c => {
          const color = outcomeColor(c.outcome);
          return (
            <Link
              key={c.slug}
              href={`/case-studies/${c.slug}`}
              className="hover-card"
              onClick={() =>
                trackEvent('case_study_grid_click', {
                  slug: c.slug,
                  company: c.company,
                  industry: c.industry,
                  hasDeepAnalysis: c.hasDeepAnalysis,
                })
              }
              style={{
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                color: 'inherit',
                background: '#FFFFFF',
                border: `1px solid ${C.slate200}`,
                borderRadius: 16,
                padding: 20,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Outcome accent strip */}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: '0 0 auto 0',
                  height: 3,
                  background: isFailureOutcome(c.outcome)
                    ? '#DC2626'
                    : isSuccessOutcome(c.outcome)
                      ? C.green
                      : '#F59E0B',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    background: color.bg,
                    color: color.fg,
                    padding: '3px 8px',
                    borderRadius: 999,
                  }}
                >
                  {formatOutcome(c.outcome)}
                </span>
                {isFailureOutcome(c.outcome) ? (
                  <AlertTriangle size={12} color="#DC2626" />
                ) : isSuccessOutcome(c.outcome) ? (
                  <CheckCircle size={12} color={C.green} />
                ) : (
                  <BookOpen size={12} color="#F59E0B" />
                )}
                <span style={{ fontSize: 11, color: C.slate500 }}>{c.year}</span>
                {c.hasDeepAnalysis && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 10,
                      fontWeight: 700,
                      background: '#EDE9FE',
                      color: '#5B21B6',
                      padding: '3px 8px',
                      borderRadius: 999,
                      textTransform: 'uppercase',
                    }}
                  >
                    Deep
                  </span>
                )}
              </div>

              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.navy,
                  margin: 0,
                  marginBottom: 4,
                  letterSpacing: '-0.01em',
                }}
              >
                {c.company}
              </h3>
              <p style={{ fontSize: 13, color: C.slate500, margin: '0 0 10px' }}>{c.title}</p>

              {c.primaryBias && (
                <div style={{ fontSize: 11, color: C.slate700, marginBottom: 8 }}>
                  <strong>Primary bias:</strong> {formatBiasName(c.primaryBias)}
                </div>
              )}

              {c.lessonPreview && (
                <p
                  style={{
                    fontSize: 12,
                    color: C.slate500,
                    margin: '0 0 14px',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1,
                  }}
                >
                  {c.lessonPreview}
                </p>
              )}

              {/* Stats footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingTop: 12,
                  borderTop: `1px solid ${C.slate200}`,
                  marginTop: 'auto',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isFailureOutcome(c.outcome) ? '#DC2626' : C.slate500,
                  }}
                >
                  {c.biasCount} bias{c.biasCount !== 1 ? 'es' : ''}
                </span>
                {c.toxicCount > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#EA580C',
                    }}
                  >
                    {c.toxicCount} toxic
                  </span>
                )}
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    background: '#F1F5F9',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${c.impactScore}%`,
                      height: '100%',
                      background: isFailureOutcome(c.outcome) ? '#DC2626' : C.green,
                      borderRadius: 2,
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: C.slate500, flexShrink: 0 }}>
                  {c.impactScore}/100
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: C.slate500,
            fontSize: 14,
          }}
        >
          No cases match these filters. Try clearing the search or broadening the filters.
        </div>
      )}
    </div>
  );
}
