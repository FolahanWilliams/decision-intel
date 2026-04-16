import { Quote } from 'lucide-react';

/** Renders the uploaded-document excerpt as if it were visible in the product
 *  alongside the analysis. The subtle highlight treatment implies the platform
 *  is surfacing the raw text that produced the flags. */
export function DemoDocumentExcerpt({
  document,
  source,
  date,
}: {
  document: string;
  source: string;
  date: string;
}) {
  return (
    <section style={{ marginBottom: 32 }}>
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
        <Quote size={12} />
        Uploaded Document
      </div>
      <h2
        style={{
          fontSize: 'clamp(18px, 2.5vw, 22px)',
          fontWeight: 700,
          color: '#0F172A',
          margin: 0,
          marginBottom: 14,
          letterSpacing: '-0.01em',
        }}
      >
        The excerpt the platform analyzed
      </h2>

      <div
        style={{
          background: 'linear-gradient(180deg, #FFFBEB 0%, #FEF9C3 100%)',
          border: '1px solid #FDE68A',
          borderLeft: '4px solid #D97706',
          borderRadius: 14,
          padding: '20px 24px',
          position: 'relative',
        }}
      >
        <blockquote
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.7,
            color: '#0F172A',
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          &ldquo;{document}&rdquo;
        </blockquote>
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px dashed #D97706',
            fontSize: 12,
            color: '#92400E',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 700 }}>Source:</span>
          <span>{source}</span>
          <span>·</span>
          <span
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {date}
          </span>
        </div>
      </div>
    </section>
  );
}
