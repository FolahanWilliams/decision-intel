'use client';

import { useEffect, useMemo, useState } from 'react';
import { Brain, Check, X } from 'lucide-react';
import type { SatVocab } from './sat-types';
import {
  SAT_VOCAB_QUIZ_TYPES,
  SAT_VOCAB_QUIZ_TYPE_IDS,
  type SatVocabQuizType,
} from './sat-content';
import { pickAdaptiveQuizType } from './sat-calibration';

interface Props {
  headers: Record<string, string>;
  vocab: SatVocab[];
  onChanged: () => void;
}

const CONFIDENCE = [
  { v: 0, label: 'Guess' },
  { v: 1, label: 'Unsure' },
  { v: 2, label: 'Likely' },
  { v: 3, label: 'Certain' },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  SAT_VOCAB_QUIZ_TYPES.map(t => [t.id, t.label])
);

type Mode = SatVocabQuizType | 'recall';

interface Question {
  cardId: string;
  mode: Mode;
  stem: string; // the cloze sentence / the word / the definition
  promptLabel: string;
  choices: string[]; // MCQ options (empty for recall)
  answer: string; // the correct choice (recall: the definition to reveal)
}

/** Replace the first whole-word occurrence of `word` with a blank. Null if absent. */
function deriveCloze(sentence: string | null, word: string): string | null {
  if (!sentence) return null;
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  if (!re.test(sentence)) return null;
  return sentence.replace(re, '_____');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample<T>(pool: T[], n: number): T[] {
  return shuffle(pool).slice(0, n);
}

/** Build an adaptive question for a card, given the rest of the collection. */
function buildQuestion(card: SatVocab, others: SatVocab[]): Question {
  const otherWords = Array.from(new Set(others.map(o => o.word))).filter(w => w !== card.word);
  const otherDefs = Array.from(new Set(others.map(o => o.definition))).filter(
    d => d !== card.definition
  );
  const clozeText = card.clozeSentence || deriveCloze(card.exampleSentence, card.word);

  const eligible: SatVocabQuizType[] = SAT_VOCAB_QUIZ_TYPE_IDS.filter(t => {
    if (t === 'cloze') return Boolean(clozeText) && otherWords.length >= 3;
    if (t === 'definition') return otherDefs.length >= 3;
    if (t === 'reverse') return otherWords.length >= 3;
    if (t === 'synonym') return card.synonyms.length >= 1 && otherWords.length >= 3;
    if (t === 'antonym') return card.antonyms.length >= 1 && otherWords.length >= 3;
    return false;
  });

  const mode = pickAdaptiveQuizType(eligible, card.failedTypes, card.totalReviews);

  if (!mode) {
    // Graceful fallback: recall-before-reveal self-grade (too few cards / no substrate).
    return {
      cardId: card.id,
      mode: 'recall',
      stem: card.word,
      promptLabel: 'Recall the meaning, then reveal',
      choices: [],
      answer: card.definition,
    };
  }

  if (mode === 'cloze') {
    const choices = shuffle([card.word, ...sample(otherWords, 3)]);
    return {
      cardId: card.id,
      mode,
      stem: clozeText as string,
      promptLabel: 'Which word fits the blank?',
      choices,
      answer: card.word,
    };
  }
  if (mode === 'definition') {
    const choices = shuffle([card.definition, ...sample(otherDefs, 3)]);
    return {
      cardId: card.id,
      mode,
      stem: card.word,
      promptLabel: 'Pick the definition',
      choices,
      answer: card.definition,
    };
  }
  if (mode === 'reverse') {
    const choices = shuffle([card.word, ...sample(otherWords, 3)]);
    return {
      cardId: card.id,
      mode,
      stem: card.definition,
      promptLabel: 'Which word means this?',
      choices,
      answer: card.word,
    };
  }
  // synonym / antonym
  const correct = mode === 'synonym' ? card.synonyms[0] : card.antonyms[0];
  const choices = shuffle([correct, ...sample(otherWords, 3)]);
  return {
    cardId: card.id,
    mode,
    stem: card.word,
    promptLabel: mode === 'synonym' ? 'Pick the closest in meaning' : 'Pick the opposite',
    choices,
    answer: correct,
  };
}

export function SatVocabReview({ headers, vocab, onChanged }: Props) {
  const dueCards = useMemo(
    () => vocab.filter(c => !c.nextDue || new Date(c.nextDue) <= new Date()),
    [vocab]
  );
  const reviewCard = dueCards[0] ?? null;

  const [question, setQuestion] = useState<Question | null>(null);
  const [startMs, setStartMs] = useState(0);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false); // recall mode

  // Build the question when the due card changes (effect, not render — keeps render pure).
  useEffect(() => {
    if (!reviewCard) {
      setQuestion(null);
      return;
    }
    const others = vocab.filter(c => c.id !== reviewCard.id);
    setQuestion(buildQuestion(reviewCard, others));
    setStartMs(Date.now());
    setConfidence(null);
    setPicked(null);
    setRevealed(false);
    // Only rebuild when the card identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewCard?.id]);

  async function submit(correct: boolean) {
    if (!reviewCard || !question) return;
    const responseMs = Date.now() - startMs;
    await fetch('/api/founder-os/sat/vocab', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: reviewCard.id,
        correct,
        confidence: confidence ?? 1,
        responseMs,
        quizType: question.mode === 'recall' ? null : question.mode,
      }),
    }).catch(() => {
      // canonical fire-and-forget — reconciles on the next fetchAll()
    });
    onChanged();
  }

  if (!reviewCard || !question) return null;

  const answered = picked !== null;
  const isCorrect = answered && picked === question.answer;

  return (
    <div style={{ ...cardStyle, borderTop: '3px solid var(--success)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 'var(--fs-2xs)',
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        <Brain size={14} style={{ color: 'var(--success)' }} />
        <span>{dueCards.length} due · adaptive review</span>
        {question.mode !== 'recall' && (
          <span style={chip}>{TYPE_LABEL[question.mode] ?? question.mode}</span>
        )}
        {reviewCard.failedTypes.includes(question.mode) && (
          <span style={{ ...chip, color: 'var(--warning)', borderColor: 'var(--warning)' }}>
            weak angle
          </span>
        )}
      </div>

      <div style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)', marginBottom: 4 }}>
        {question.promptLabel}
      </div>
      <div
        style={{
          fontSize:
            question.mode === 'definition' || question.mode === 'recall'
              ? 'var(--fs-lg)'
              : 'var(--fs-md)',
          fontWeight: question.mode === 'reverse' ? 500 : 700,
          color: 'var(--text-primary)',
          lineHeight: 1.45,
          marginBottom: 12,
        }}
      >
        {question.stem}
      </div>

      {/* Confidence (commit before answering — the calibration loop) */}
      {!answered && question.mode !== 'recall' && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)', marginBottom: 4 }}>
            How sure are you?
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CONFIDENCE.map(c => (
              <button
                key={c.v}
                onClick={() => setConfidence(c.v)}
                style={{
                  ...pill,
                  ...(confidence === c.v
                    ? {
                        background: 'var(--accent-primary)',
                        color: '#fff',
                        borderColor: 'var(--accent-primary)',
                      }
                    : {}),
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MCQ choices */}
      {question.mode !== 'recall' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {question.choices.map(choice => {
            const isAnswer = choice === question.answer;
            const isPicked = choice === picked;
            let bg = 'var(--bg-secondary)';
            let border = 'var(--border-color)';
            if (answered && isAnswer) {
              bg = 'color-mix(in srgb, var(--success) 14%, transparent)';
              border = 'var(--success)';
            } else if (answered && isPicked && !isAnswer) {
              bg = 'color-mix(in srgb, var(--error) 14%, transparent)';
              border = 'var(--error)';
            }
            return (
              <button
                key={choice}
                disabled={answered}
                onClick={() => setPicked(choice)}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${border}`,
                  background: bg,
                  color: 'var(--text-primary)',
                  fontSize: 'var(--fs-sm)',
                  cursor: answered ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {answered && isAnswer && <Check size={14} style={{ color: 'var(--success)' }} />}
                {answered && isPicked && !isAnswer && (
                  <X size={14} style={{ color: 'var(--error)' }} />
                )}
                {choice}
              </button>
            );
          })}
        </div>
      )}

      {/* Recall fallback */}
      {question.mode === 'recall' &&
        (!revealed ? (
          <button onClick={() => setRevealed(true)} style={secondaryBtn}>
            Reveal
          </button>
        ) : (
          <p
            style={{
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-secondary)',
              margin: '4px 0 10px',
            }}
          >
            {reviewCard.definition}
          </p>
        ))}

      {/* Result + explanation */}
      {answered && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              color: isCorrect ? 'var(--success)' : 'var(--error)',
              marginBottom: 4,
            }}
          >
            {isCorrect ? 'Correct' : `Not quite — ${reviewCard.word}`}
          </div>
          <p style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-secondary)', margin: '2px 0' }}>
            <strong>{reviewCard.word}</strong>
            {reviewCard.partOfSpeech ? ` · ${reviewCard.partOfSpeech}` : ''} —{' '}
            {reviewCard.definition}
          </p>
          {reviewCard.exampleSentence && (
            <p
              style={{
                fontSize: 'var(--fs-3xs)',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                margin: '2px 0',
              }}
            >
              &ldquo;{reviewCard.exampleSentence}&rdquo;
            </p>
          )}
          <button onClick={() => submit(isCorrect)} style={{ ...primaryBtn, marginTop: 8 }}>
            Next →
          </button>
        </div>
      )}

      {/* Recall self-grade (no MCQ correctness signal) */}
      {question.mode === 'recall' && revealed && !answered && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button onClick={() => submit(false)} style={secondaryBtn}>
            Missed
          </button>
          <button onClick={() => submit(true)} style={primaryBtn}>
            Got it
          </button>
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
};
const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '6px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--accent-primary)',
  background: 'var(--accent-primary)',
  color: '#fff',
  fontSize: 'var(--fs-sm)',
  fontWeight: 600,
  cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '6px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  cursor: 'pointer',
};
const pill: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--fs-3xs)',
  cursor: 'pointer',
};
const chip: React.CSSProperties = {
  padding: '1px 8px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--fs-3xs)',
};
