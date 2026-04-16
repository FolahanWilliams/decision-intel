import { MessageSquare } from 'lucide-react';
import { formatBiasName } from '@/lib/utils/labels';
import type { CaseStudy } from '@/lib/data/case-studies/types';

/** Synthesizes steering-committee/CEO questions from the case's own data —
 *  primary bias, top red flag, and counterfactual — using stable templates.
 *  The goal is to mirror the live product's "predict the questions before
 *  the CEO asks them" feature without fabrication. */

function questionsFor(c: CaseStudy): string[] {
  const out: string[] = [];
  const primary = c.primaryBias ? formatBiasName(c.primaryBias) : null;
  const topFlag = c.preDecisionEvidence?.detectableRedFlags?.[0];
  const cfRec = c.counterfactual?.recommendation;

  if (primary) {
    out.push(
      `Is there a chance we're underestimating ${primary.toLowerCase()} risk on this decision — and what would change our mind if so?`,
    );
  }
  if (topFlag) {
    // Normalise: strip leading "A "/ "The "/ trailing ".", downcase first letter.
    const stripped = topFlag.replace(/^(A |The )/i, '').replace(/\.$/, '');
    const lower = stripped.charAt(0).toLowerCase() + stripped.slice(1);
    out.push(`Walk me through ${lower} — what's our defensible answer if the board raises it?`);
  }
  if (cfRec) {
    const firstSentence = cfRec.split(/(?<=\.)\s+/)[0]?.replace(/\.$/, '');
    if (firstSentence) {
      const lower = firstSentence.charAt(0).toLowerCase() + firstSentence.slice(1);
      out.push(
        `What would it cost us to do ${lower.length > 160 ? lower.slice(0, 157) + '…' : lower} before we commit?`,
      );
    }
  }
  // Always end with a crisp meta-question.
  out.push(
    `If this memo were re-run in six months with the outcome revealed, what do we think would embarrass us most?`,
  );

  return out.slice(0, 4);
}

export function DemoPredictedQuestions({ caseStudy }: { caseStudy: CaseStudy }) {
  const questions = questionsFor(caseStudy);
  if (!questions.length) return null;

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
        <MessageSquare size={12} />
        CEO / Board Question Simulator
      </div>
      <h2
        style={{
          fontSize: 'clamp(20px, 3vw, 24px)',
          fontWeight: 700,
          color: '#0F172A',
          margin: 0,
          marginBottom: 4,
          letterSpacing: '-0.01em',
        }}
      >
        Questions the steering committee would ask
      </h2>
      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
        Predicted from the document&apos;s own signals. In the live product, these
        are generated from your memo — no two runs produce the same list.
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        {questions.map((q, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderLeft: '4px solid #0F172A',
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <span
              aria-hidden
              style={{
                flexShrink: 0,
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: '#0F172A',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              Q{i + 1}
            </span>
            <div
              style={{
                fontSize: 14,
                color: '#0F172A',
                lineHeight: 1.55,
                fontStyle: 'italic',
              }}
            >
              &ldquo;{q}&rdquo;
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
