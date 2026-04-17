import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { formatDocumentType } from '@/lib/utils/labels';
import type { CaseStudy } from '@/lib/data/case-studies/types';

/** Top banner for the demo route — makes clear this is a historical
 *  reconstruction, not a real-time analysis of a fresh upload. Then
 *  renders a product-style "document meta" bar showing what was analyzed. */
export function DemoPageHeader({
  caseStudy,
  caseSlug,
}: {
  caseStudy: CaseStudy;
  caseSlug: string;
}) {
  const deep = caseStudy.preDecisionEvidence;
  if (!deep) return null;

  return (
    <div>
      {/* Reconstruction banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderBottom: '1px solid rgba(22, 163, 74, 0.2)',
          padding: '14px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              background: '#16A34A',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            Live Product Demo
          </span>
          <span style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.4 }}>
            Every flag below was detectable from a{' '}
            <strong style={{ color: '#FFFFFF' }}>pre-{caseStudy.year}</strong> document — no
            hindsight. This is exactly what Decision Intel would have output if it had run on the
            original memo.
          </span>
        </div>
      </div>

      {/* Back link + document meta */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '32px 24px 24px',
        }}
      >
        <Link
          href={`/case-studies/${caseSlug}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: '#64748B',
            textDecoration: 'none',
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={14} />
          Back to case study
        </Link>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={22} style={{ color: '#475569' }} />
          </div>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#64748B',
                marginBottom: 4,
              }}
            >
              {formatDocumentType(deep.documentType)} · {deep.date}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: 2,
                lineHeight: 1.3,
              }}
            >
              {caseStudy.company} — {caseStudy.title}
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{deep.source}</div>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#ECFDF5',
              color: '#15803D',
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={14} />
            Analyzed in 58s
          </div>
        </div>
      </div>
    </div>
  );
}
