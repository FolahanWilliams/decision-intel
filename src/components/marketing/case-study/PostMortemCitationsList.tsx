import { BookOpen, ExternalLink } from 'lucide-react';
import type { CasePostMortemCitation } from '@/lib/data/case-studies/types';

/** Sourced citations for the case — primary-source discipline marker.
 *  Every factual claim should trace here. */
export function PostMortemCitationsList({
  citations,
}: {
  citations: CasePostMortemCitation[];
}) {
  if (!citations.length) return null;

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
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <BookOpen size={12} />
        Post-Mortem Sources
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
        Where the facts come from
      </h2>

      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gap: 10,
          counterReset: 'citation',
        }}
      >
        {citations.map((c, i) => (
          <li
            key={i}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '14px 18px',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              counterIncrement: 'citation',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#F1F5F9',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#0F172A',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {c.label}
                    <ExternalLink size={12} style={{ color: '#64748B' }} />
                  </a>
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                    {c.label}
                  </span>
                )}
                {c.year && (
                  <span
                    style={{
                      fontSize: 11,
                      color: '#64748B',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  >
                    ({c.year})
                  </span>
                )}
              </div>
              {c.excerpt && (
                <div
                  style={{
                    fontSize: 12,
                    color: '#475569',
                    marginTop: 6,
                    lineHeight: 1.55,
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{c.excerpt}&rdquo;
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
