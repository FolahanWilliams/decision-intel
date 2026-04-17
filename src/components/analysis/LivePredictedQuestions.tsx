'use client';

import { MessageSquare } from 'lucide-react';
import { BiasInstance } from '@/types';
import { formatBiasName } from '@/lib/utils/labels';

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface LivePredictedQuestionsProps {
  biases: BiasInstance[];
  summary: string;
  /** Optional top recommended action from nudges/recommendations. */
  topRecommendation?: string;
}

function primaryBias(biases: BiasInstance[]): BiasInstance | null {
  if (biases.length === 0) return null;
  return [...biases].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4)
  )[0];
}

function lowercaseFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** Live-product counterpart to DemoPredictedQuestions. Synthesises the kind of
 *  questions a steering committee is likely to ask, derived from the document's
 *  own primary bias, top flag, and recommendation — not fabricated. */
function questionsFor({
  biases,
  summary,
  topRecommendation,
}: LivePredictedQuestionsProps): string[] {
  const out: string[] = [];
  const top = primaryBias(biases);

  if (top) {
    const name = formatBiasName(top.biasType).toLowerCase();
    out.push(
      `Is there a chance we're underestimating ${name} risk on this decision — and what would change our mind if so?`
    );
  }

  if (top?.suggestion) {
    const stripped = top.suggestion.replace(/^(A |The )/i, '').replace(/\.$/, '');
    const trimmed = stripped.length > 180 ? stripped.slice(0, 177) + '…' : stripped;
    out.push(
      `Walk me through "${lowercaseFirst(trimmed)}" — what's our defensible answer if the board raises it?`
    );
  }

  if (topRecommendation) {
    const firstSentence = topRecommendation.split(/(?<=\.)\s+/)[0]?.replace(/\.$/, '');
    if (firstSentence) {
      const trimmed =
        firstSentence.length > 160 ? firstSentence.slice(0, 157) + '…' : firstSentence;
      out.push(`What would it cost us to ${lowercaseFirst(trimmed)} before we commit?`);
    }
  } else if (summary) {
    const firstSentence = summary.split(/(?<=\.)\s+/)[0]?.replace(/\.$/, '');
    if (firstSentence && firstSentence.length < 200) {
      out.push(
        `If we're wrong about "${lowercaseFirst(firstSentence)}" — what's the fastest way we'd find out?`
      );
    }
  }

  out.push(
    `If this memo were re-run in six months with the outcome revealed, what do we think would embarrass us most?`
  );

  return out.slice(0, 4);
}

export function LivePredictedQuestions(props: LivePredictedQuestionsProps) {
  const questions = questionsFor(props);
  if (questions.length === 0) return null;

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
          color: 'var(--text-primary)',
          margin: 0,
          marginBottom: 4,
          letterSpacing: '-0.01em',
        }}
      >
        Questions the steering committee will ask
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
        Synthesised from this decision&apos;s primary bias, top flag, and recommended action — so
        you can rehearse before the meeting, not during it.
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        {questions.map((q, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
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
                color: 'var(--text-primary)',
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
