import { FileText, Calendar } from 'lucide-react';

const C = {
  paper: '#FDFCF8',
  paperBorder: '#E7E3D8',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  red: '#DC2626',
  amber: '#F59E0B',
};

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  board_memo: 'Board Memo',
  press_release: 'Press Release',
  earnings_call: 'Earnings Call Transcript',
  internal_memo: 'Internal Memo',
  sec_filing: 'SEC Filing',
  public_statement: 'Public Statement',
  strategy_document: 'Strategy Document',
  risk_assessment: 'Risk Assessment',
  financial_report: 'Financial Report',
  investor_deck: 'Investor Deck',
};

interface PreDecisionDocumentProps {
  document: string;
  source: string;
  date: string;
  documentType: string;
  /** Count of flags shown next to the document. Each maps to a numbered marker [1] [2] [3]
   * in the right-side FlaggedAnalysisPanel so the reader can scan across visually. */
  flagCount: number;
}

export function PreDecisionDocument({
  document,
  source,
  date,
  documentType,
  flagCount,
}: PreDecisionDocumentProps) {
  const typeLabel = DOCUMENT_TYPE_LABEL[documentType] ?? 'Document';

  return (
    <div
      style={{
        background: C.paper,
        border: `1px solid ${C.paperBorder}`,
        borderRadius: 12,
        boxShadow:
          '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.05)',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Document header */}
      <div
        style={{
          padding: '18px 24px 14px',
          borderBottom: `1px dashed ${C.paperBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={16} style={{ color: C.slate600 }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.slate700,
            }}
          >
            {typeLabel}
          </span>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(220, 38, 38, 0.08)',
            border: `1px solid rgba(220, 38, 38, 0.2)`,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: C.red,
          }}
        >
          <Calendar size={10} />
          {date}
        </div>
      </div>

      {/* Document body — monospace for paper-ish feel */}
      <div style={{ padding: '24px 28px', flex: 1, position: 'relative' }}>
        {/* Numbered flag markers, rendered as a left rail above the text */}
        {flagCount > 0 && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 24,
              left: 0,
              bottom: 24,
              width: 4,
              background:
                'linear-gradient(180deg, rgba(220, 38, 38, 0.0) 0%, rgba(220, 38, 38, 0.25) 50%, rgba(220, 38, 38, 0.0) 100%)',
            }}
          />
        )}
        <p
          style={{
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            fontSize: 13.5,
            lineHeight: 1.75,
            color: C.slate900,
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}
        >
          {document}
        </p>
      </div>

      {/* Source attribution */}
      <div
        style={{
          padding: '12px 24px',
          borderTop: `1px dashed ${C.paperBorder}`,
          fontSize: 11,
          color: C.slate400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span>{source}</span>
        <span>
          {flagCount > 0 && (
            <>
              <strong style={{ color: C.red, fontWeight: 700 }}>{flagCount}</strong> red flag
              {flagCount === 1 ? '' : 's'} detectable at decision time →
            </>
          )}
        </span>
      </div>
    </div>
  );
}
