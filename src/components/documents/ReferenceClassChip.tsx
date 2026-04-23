'use client';

/**
 * ReferenceClassChip — compact row above Executive Summary that tells
 * the CSO "this memo resembles N of {corpus} historical cases, M failed
 * at avg X% impact." Links to /case-studies/[slug] for the top match.
 *
 * Data source: computeReferenceClass() over the seed corpus. Renders
 * null when overlap is zero; renders a softer "loose match" banner when
 * only single-bias overlap exists. Never fabricates numbers.
 */

import Link from 'next/link';
import { Telescope, ArrowUpRight } from 'lucide-react';
import { computeReferenceClass } from '@/lib/data/reference-class';

interface ReferenceClassChipProps {
  biasTypes: string[];
}

export function ReferenceClassChip({ biasTypes }: ReferenceClassChipProps) {
  const result = computeReferenceClass(biasTypes, { limit: 3 });

  if (result.matches === 0) return null;

  const { corpusSize, matches, failures, band, failureRate, topMatches } = result;
  const top = topMatches[0];
  const rateLabel = failureRate === null ? null : `${Math.round(failureRate * 100)}% failure rate`;

  const bandLabel = band === 'strong' ? 'reference-class match' : 'loose match';

  return (
    <section
      aria-label="Reference-class forecast"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        padding: '12px 16px',
        background: 'var(--bg-elevated, #fff)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${
          band === 'strong' ? 'var(--accent-primary)' : 'var(--border-hover, var(--border-color))'
        }`,
        borderRadius: 'var(--radius-md, 8px)',
        marginBottom: 'var(--space-md, 16px)',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <Telescope
          size={18}
          strokeWidth={2}
          style={{ color: 'var(--accent-primary)', flexShrink: 0 }}
          aria-hidden
        />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 2,
            }}
          >
            {bandLabel}
          </div>
          <div
            style={{
              fontSize: 'var(--fs-sm, 14px)',
              color: 'var(--text-primary)',
              lineHeight: 1.4,
            }}
          >
            This memo’s bias signature resembles{' '}
            <strong>
              {matches} of {corpusSize}
            </strong>{' '}
            historical cases
            {rateLabel && (
              <>
                {' · '}
                <strong>{failures}</strong> failed ({rateLabel})
              </>
            )}
            .
          </div>
        </div>
      </div>

      {top && (
        <Link
          href={`/case-studies/${top.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            padding: '6px 10px',
            borderRadius: 'var(--radius-full, 9999px)',
            border: '1px solid rgba(22,163,74,0.25)',
            background: 'rgba(22,163,74,0.08)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Closest: {top.company} ({top.year})
          <ArrowUpRight size={12} strokeWidth={2.25} aria-hidden />
        </Link>
      )}
    </section>
  );
}
