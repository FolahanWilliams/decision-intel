'use client';

/**
 * PremortemDefenceCaptureCard — V2 mandatory pre-mortem dissent gate
 * (locked 2026-05-16).
 *
 * Sequenced directly after DealFeverPremortemCard on the acquisition
 * decision-detail page. The antagonist fires the brutal questions
 * (that card, danger accent); THIS card (warning accent) makes the
 * sponsor formally answer them in writing before the outcome can be
 * logged. The written exchange persists onto the container and flows
 * into the DPR human-oversight record — the rigor goes ON THE RECORD,
 * not in the sponsor's head. When a complete defence already exists
 * the card flips to a success-accent read-only confirmation (the
 * DPR-visible artefact preview).
 *
 * Pure gate logic (what counts as complete) lives in
 * @/lib/containers/premortem-defence and is shared verbatim with the
 * server hard-gate — never reimplemented here.
 */

import { useState } from 'react';
import { AccentCard } from '@/components/ui/AccentCard';
import {
  ShieldQuestion,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Target,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { MIN_DEFENCE_CHARS } from '@/lib/containers/premortem-defence';
import type { ContainerDetail } from '@/types/containers';

type Pattern = 'deal_fever' | 'winners_curse' | 'synergy_mirage';

interface PremortemQuestion {
  pattern: Pattern;
  question: string;
  evidence: string;
  demand: string;
}

interface PremortemResponse {
  questions: PremortemQuestion[];
  anchorSource: string;
  generatedFor: string;
  generatedAt: string;
  fromCache?: boolean;
}

const PATTERN_LABELS: Record<Pattern, string> = {
  deal_fever: 'Deal Fever / Escalation',
  winners_curse: "Winner's Curse",
  synergy_mirage: 'Synergy Mirage',
};
const PATTERN_ICONS: Record<Pattern, typeof TrendingDown> = {
  deal_fever: TrendingDown,
  winners_curse: Target,
  synergy_mirage: Sparkles,
};
const PATTERN_COLORS: Record<Pattern, string> = {
  deal_fever: 'var(--error)',
  winners_curse: 'var(--severity-high)',
  synergy_mirage: 'var(--warning)',
};

export interface PremortemDefenceCaptureCardProps {
  containerId: string;
  containerName: string;
  premortemDefence: ContainerDetail['premortemDefence'];
  onSaved: () => void;
}

export function PremortemDefenceCaptureCard({
  containerId,
  premortemDefence,
  onSaved,
}: PremortemDefenceCaptureCardProps) {
  const [questions, setQuestions] = useState<PremortemQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Recorded state — read-only confirmation (DPR artefact preview) ──
  if (premortemDefence && premortemDefence.answers.length > 0) {
    return (
      <AccentCard
        accent="success"
        title={
          <>
            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            <span>Pre-mortem defence recorded — on the human-oversight record</span>
          </>
        }
      >
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            lineHeight: 1.55,
          }}
        >
          The sponsor formally answered the antagonist before the outcome could be logged. This
          exchange is part of the tamper-evident Decision Provenance Record — the rigor is on the
          record, not in anyone&rsquo;s head.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {premortemDefence.answers.map((a, i) => {
            const Icon = PATTERN_ICONS[a.pattern];
            return (
              <div
                key={i}
                style={{
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${PATTERN_COLORS[a.pattern]}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 'var(--fs-2xs)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: PATTERN_COLORS[a.pattern],
                    marginBottom: 6,
                  }}
                >
                  <Icon size={12} />
                  {PATTERN_LABELS[a.pattern]}
                </div>
                <div
                  style={{
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                    fontStyle: 'italic',
                  }}
                >
                  {a.question}
                </div>
                <div
                  style={{
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                  }}
                >
                  {a.writtenDefence}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>
          Answered {new Date(premortemDefence.answeredAt).toLocaleDateString()}.
        </div>
      </AccentCard>
    );
  }

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/decisions/${containerId}/deal-fever-premortem`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to load the pre-mortem questions');
      }
      const data = (await res.json()) as PremortemResponse;
      setQuestions(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the pre-mortem');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!questions) return;
    const payload = questions.map((q, i) => ({
      pattern: q.pattern,
      question: q.question,
      writtenDefence: (answers[i] ?? '').trim(),
    }));
    const short = payload.find(p => p.writtenDefence.length < MIN_DEFENCE_CHARS);
    if (short) {
      setError(
        `Answer every question substantively (≥ ${MIN_DEFENCE_CHARS} characters) — this goes on the record the committee and a regulator can read.`
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/containers/${containerId}/premortem-defence`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to record the defence');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record the defence');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccentCard
      accent="warning"
      title={
        <>
          <ShieldQuestion size={16} style={{ color: 'var(--warning)' }} />
          <span>Answer the pre-mortem — required before you can log the outcome</span>
        </>
      }
    >
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          lineHeight: 1.55,
        }}
      >
        The antagonist raised its questions. Before this decision&rsquo;s outcome can be logged, the
        sponsor records a written defence to each one. A wrapper produces an opinion; this puts the
        sponsor&rsquo;s reasoning on the tamper-evident record — exactly what the committee and a
        regulator need to see.
      </p>

      {error && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'flex-start',
            padding: '8px 10px',
            marginBottom: 10,
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.08)',
            color: 'var(--error)',
            fontSize: 'var(--fs-xs)',
          }}
        >
          <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {!questions && (
        <button
          type="button"
          onClick={loadQuestions}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--warning)',
            color: '#1a1300',
            border: 'none',
            fontSize: 'var(--fs-sm)',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldQuestion size={14} />}
          {loading ? 'Loading questions…' : 'Load the pre-mortem questions'}
        </button>
      )}

      {questions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questions.map((q, i) => {
            const Icon = PATTERN_ICONS[q.pattern];
            const val = answers[i] ?? '';
            const ok = val.trim().length >= MIN_DEFENCE_CHARS;
            return (
              <div
                key={i}
                style={{
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${PATTERN_COLORS[q.pattern]}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 'var(--fs-2xs)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: PATTERN_COLORS[q.pattern],
                    marginBottom: 6,
                  }}
                >
                  <Icon size={12} />
                  {PATTERN_LABELS[q.pattern]}
                </div>
                <div
                  style={{
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                    lineHeight: 1.45,
                  }}
                >
                  {q.question}
                </div>
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                  }}
                >
                  Sponsor must produce: {q.demand}
                </div>
                <textarea
                  value={val}
                  onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                  placeholder="Your written defence — the named owner, the mechanism, the milestone…"
                  rows={3}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${ok ? 'var(--success)' : 'var(--border-color)'}`,
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--fs-sm)',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>
            );
          })}
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              cursor: submitting ? 'wait' : 'pointer',
            }}
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            {submitting ? 'Recording…' : 'Record defence — unlock outcome logging'}
          </button>
        </div>
      )}
    </AccentCard>
  );
}
