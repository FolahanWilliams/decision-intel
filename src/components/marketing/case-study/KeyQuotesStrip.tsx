import { Quote } from 'lucide-react';
import type { CaseKeyQuote } from '@/lib/data/case-studies/types';

/** Pullquote strip — primary-source quotes from stakeholders.
 *  Each card shows the quote, speaker, and source+date attribution. */
export function KeyQuotesStrip({ quotes }: { quotes: CaseKeyQuote[] }) {
  if (!quotes.length) return null;

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
        In Their Own Words
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
        Primary-source quotes
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {quotes.map((q, i) => (
          <figure
            key={i}
            style={{
              margin: 0,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              padding: '24px 22px 20px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Quote
              size={44}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: '#F1F5F9',
                pointerEvents: 'none',
              }}
            />
            <blockquote
              style={{
                margin: 0,
                fontSize: 16,
                lineHeight: 1.55,
                color: '#0F172A',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                position: 'relative',
                paddingBottom: 14,
              }}
            >
              &ldquo;{q.text}&rdquo;
            </blockquote>
            <figcaption
              style={{
                borderTop: '1px solid #F1F5F9',
                paddingTop: 12,
              }}
            >
              {q.speaker && (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0F172A',
                    marginBottom: 2,
                  }}
                >
                  {q.speaker}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.45 }}>
                {q.source}
                {q.date ? ` · ${q.date}` : ''}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
