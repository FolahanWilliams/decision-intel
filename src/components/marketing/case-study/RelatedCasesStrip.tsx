import Link from 'next/link';
import { ArrowRight, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';
import {
  getCaseById,
  getSlugForCase,
  isFailureOutcome,
  isSuccessOutcome,
} from '@/lib/data/case-studies';
import { formatIndustry } from '@/lib/utils/labels';

/** Cross-linked cases — the "knowledge graph" thesis rendered visually.
 *  Prefers explicit `relatedCases[]` IDs; the detail page falls back to
 *  industry-grouped suggestions when relatedCases is empty. */
export function RelatedCasesStrip({
  ids,
  heading = 'Other decisions with the same pattern',
}: {
  ids: string[];
  heading?: string;
}) {
  const cases = ids.map(getCaseById).filter((c): c is NonNullable<typeof c> => c != null);
  if (!cases.length) return null;

  return (
    <section style={{ marginBottom: 48 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#16A34A',
          marginBottom: 8,
        }}
      >
        Cross-Case Pattern
      </div>
      <h2
        style={{
          fontSize: 'clamp(20px, 3vw, 24px)',
          fontWeight: 700,
          color: '#0F172A',
          margin: 0,
          marginBottom: 20,
          letterSpacing: '-0.01em',
        }}
      >
        {heading}
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 14,
        }}
      >
        {cases.map(c => {
          const slug = getSlugForCase(c);
          const failure = isFailureOutcome(c.outcome);
          const success = isSuccessOutcome(c.outcome);
          const markerColor = failure ? '#DC2626' : success ? '#16A34A' : '#F59E0B';
          const Icon = failure ? AlertTriangle : success ? CheckCircle : BookOpen;

          return (
            <Link
              key={c.id}
              href={`/case-studies/${slug}`}
              className="hover-card"
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px 16px 14px',
                transition: 'transform 160ms ease, box-shadow 160ms ease',
              }}
            >
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                <Icon size={14} style={{ color: markerColor }} />
                <span
                  style={{
                    fontSize: 11,
                    color: '#64748B',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                >
                  {c.year}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#475569',
                    marginLeft: 'auto',
                  }}
                >
                  {formatIndustry(c.industry)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#0F172A',
                  marginBottom: 4,
                  letterSpacing: '-0.005em',
                }}
              >
                {c.company}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#64748B',
                  lineHeight: 1.45,
                  marginBottom: 10,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {c.title}
              </div>
              {c.patternFamily && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#5B21B6',
                    background: '#EDE9FE',
                    padding: '3px 8px',
                    borderRadius: 999,
                    display: 'inline-block',
                    marginBottom: 8,
                  }}
                >
                  {c.patternFamily}
                </div>
              )}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#16A34A',
                  marginTop: 4,
                }}
              >
                View case
                <ArrowRight size={11} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
