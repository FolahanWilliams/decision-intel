'use client';

/**
 * CrossRefBadge — small per-document cross-reference indicator.
 *
 * Renders "{N} cross-doc flag(s)" with severity-coloured pill on each
 * deal-document card so an analyst scanning the documents tab can see
 * which docs have unresolved conflicts vs which are clean — without
 * having to open the CrossReferenceCard surface.
 *
 * Returns null when no findings reference the document, so it's safe
 * to render unconditionally on every doc card.
 */

import { GitCompare } from 'lucide-react';
import type { DealCrossReferenceFinding } from '@/types/deals';

interface Props {
  documentId: string;
  findings: DealCrossReferenceFinding[];
}

const SEVERITY_RANK: Record<DealCrossReferenceFinding['severity'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function colorFor(maxSeverity: DealCrossReferenceFinding['severity']): {
  fg: string;
  bg: string;
  border: string;
} {
  if (maxSeverity === 'critical' || maxSeverity === 'high') {
    return { fg: '#DC2626', bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.30)' };
  }
  if (maxSeverity === 'medium') {
    return { fg: '#D97706', bg: 'rgba(217,119,6,0.10)', border: 'rgba(217,119,6,0.30)' };
  }
  return { fg: '#2563EB', bg: 'rgba(37,99,235,0.10)', border: 'rgba(37,99,235,0.30)' };
}

export function CrossRefBadge({ documentId, findings }: Props) {
  const matching = findings.filter(f => f.claims.some(c => c.documentId === documentId));
  if (matching.length === 0) return null;

  const maxSeverity = matching.reduce<DealCrossReferenceFinding['severity']>((max, f) => {
    return SEVERITY_RANK[f.severity] > SEVERITY_RANK[max] ? f.severity : max;
  }, 'low');

  const c = colorFor(maxSeverity);
  const label = `${matching.length} cross-doc flag${matching.length === 1 ? '' : 's'}`;

  return (
    <span
      title={`${label} · max severity: ${maxSeverity}. Open Cross-Reference for detail.`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 700,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.border}`,
        padding: '2px 7px',
        borderRadius: 999,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <GitCompare size={10} />
      {matching.length}
    </span>
  );
}
