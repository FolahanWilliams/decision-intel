'use client';

/**
 * EducationRoomTab — flashcard + recall + apply mastery surface.
 *
 * The founder-hub's recollection engine. Reading content (Closing Lab,
 * Sales Toolkit, founder-context) builds familiarity. Recollection under
 * pressure builds mastery. The Education Room is the dynamic surface for
 * that.
 *
 * Three modes:
 *   1. Flashcard — passive recall. See prompt, flip card, self-grade.
 *      SM-2 spaced repetition tracks card mastery over time.
 *   2. Recall — active recall. See prompt, type your answer in the
 *      founder's own voice, AI grades against the canonical with
 *      what-landed / what-missed / coach-note feedback.
 *   3. Apply — application drill. See prompt + a scenario context,
 *      type how you would USE the concept in that specific scenario.
 *      AI grades application quality.
 *
 * Pattern lifted from Nexus Tracker MindForge (vocab + summary modules
 * with SM-2 spaced repetition), extended for DI's specific knowledge
 * domain — vocabulary discipline, persona-specific verbatim phrases,
 * grading-rubric dimensions, the 17 frameworks, the 12-node pipeline,
 * R²F's Kahneman+Klein integration, and the locked positioning claims.
 *
 * Locked: 2026-04-28.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Users,
  Target,
  Shield,
  AlertCircle,
  CheckSquare,
  Brain,
  Workflow,
  BarChart3,
  Lock,
  Compass,
  Quote,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  DECKS,
  ALL_CARDS,
  cardsForDeck,
  applySm2,
  type DeckId,
  type EducationCard,
  type SM2CardState,
  type RecallGradeResult,
} from './education/education-room-data';

interface Props {
  founderPass: string;
}

type FlowStep = 'deck_picker' | 'mode_picker' | 'card' | 'recall_input' | 'recall_results';
type StudyMode = 'flashcard' | 'recall' | 'apply';

const SM2_STATE_KEY = 'di-education-room-sm2-v1';
const SESSION_KEY = 'di-education-room-session-v1';

// ─── Icon resolver ─────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof BookOpen> = {
  BookOpen, Users, Target, Shield, AlertCircle, CheckSquare,
  Brain, Workflow, BarChart3, Lock, Compass, Quote,
};
function getIcon(name: string): typeof BookOpen {
  return ICON_MAP[name] || BookOpen;
}

// ─── Component ─────────────────────────────────────────────────────

export function EducationRoomTab({ founderPass }: Props) {
  const [step, setStep] = useState<FlowStep>('deck_picker');
  const [activeDeck, setActiveDeck] = useState<DeckId | null>(null);
  const [mode, setMode] = useState<StudyMode>('flashcard');
  const [cardQueue, setCardQueue] = useState<EducationCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [recallResult, setRecallResult] = useState<RecallGradeResult | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sm2States, setSm2States] = useState<Record<string, SM2CardState>>({});
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, gotIt: 0, almost: 0, missed: 0 });

  // Load SM-2 state on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SM2_STATE_KEY);
      if (raw) setSm2States(JSON.parse(raw) as Record<string, SM2CardState>);
    } catch {
      // localStorage in private-mode Safari, unparseable JSON, etc.
    }
    try {
      const sess = localStorage.getItem(SESSION_KEY);
      if (sess) setSessionStats(JSON.parse(sess));
    } catch {
      // ignore
    }
  }, []);

  const persistSm2 = useCallback((next: Record<string, SM2CardState>) => {
    setSm2States(next);
    try {
      localStorage.setItem(SM2_STATE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const persistSession = useCallback((next: typeof sessionStats) => {
    setSessionStats(next);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const startDeck = useCallback((deckId: DeckId, studyMode: StudyMode) => {
    const cards = cardsForDeck(deckId);
    // Sort: due cards first (by nextDue ascending), then unseen, then reviewed-and-not-due.
    const now = Date.now();
    const ranked = [...cards].sort((a, b) => {
      const sa = sm2States[a.id];
      const sb = sm2States[b.id];
      const aDue = sa ? new Date(sa.nextDue).getTime() : 0;
      const bDue = sb ? new Date(sb.nextDue).getTime() : 0;
      const aIsDue = !sa || aDue <= now;
      const bIsDue = !sb || bDue <= now;
      if (aIsDue && !bIsDue) return -1;
      if (!aIsDue && bIsDue) return 1;
      return aDue - bDue;
    });
    setActiveDeck(deckId);
    setMode(studyMode);
    setCardQueue(ranked);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setUserAnswer('');
    setRecallResult(null);
    setError(null);
    setStep(studyMode === 'flashcard' ? 'card' : 'recall_input');
  }, [sm2States]);

  const currentCard = cardQueue[currentCardIndex] || null;

  const recordReview = useCallback((quality: number) => {
    if (!currentCard) return;
    const updated = applySm2(sm2States[currentCard.id] || null, quality, currentCard.id);
    persistSm2({ ...sm2States, [currentCard.id]: updated });
    persistSession({
      reviewed: sessionStats.reviewed + 1,
      gotIt: sessionStats.gotIt + (quality >= 4 ? 1 : 0),
      almost: sessionStats.almost + (quality === 3 ? 1 : 0),
      missed: sessionStats.missed + (quality < 3 ? 1 : 0),
    });
  }, [currentCard, sm2States, persistSm2, sessionStats, persistSession]);

  const advance = useCallback(() => {
    if (currentCardIndex + 1 >= cardQueue.length) {
      setStep('deck_picker');
      setActiveDeck(null);
      setCardQueue([]);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setUserAnswer('');
      setRecallResult(null);
    } else {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setUserAnswer('');
      setRecallResult(null);
      if (mode !== 'flashcard') setStep('recall_input');
    }
  }, [currentCardIndex, cardQueue.length, mode]);

  const submitRecall = useCallback(async () => {
    if (!currentCard) return;
    if (userAnswer.trim().length < 5) {
      setError('Type at least a sentence before submitting.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/founder-hub/education/grade-recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-founder-pass': founderPass },
        body: JSON.stringify({ cardId: currentCard.id, userAnswer }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Grading failed' }));
        throw new Error(err.error || 'Grading failed');
      }
      const data = (await res.json()) as RecallGradeResult;
      setRecallResult(data);

      // Translate score → SM-2 quality 0-5.
      const quality = data.score >= 85 ? 5 : data.score >= 70 ? 4 : data.score >= 55 ? 3 : data.score >= 40 ? 2 : 1;
      recordReview(quality);

      setStep('recall_results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grading failed');
    } finally {
      setBusy(false);
    }
  }, [currentCard, userAnswer, founderPass, recordReview]);

  const flashcardSelfGrade = useCallback((quality: number) => {
    recordReview(quality);
    advance();
  }, [recordReview, advance]);

  const exitDeck = useCallback(() => {
    setStep('deck_picker');
    setActiveDeck(null);
    setCardQueue([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setUserAnswer('');
    setRecallResult(null);
    setError(null);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Hero />

      {error && (
        <div
          style={{
            padding: 12,
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.30)',
            borderRadius: 'var(--radius-md)',
            color: '#DC2626',
            fontSize: 13,
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {step === 'deck_picker' && (
        <DeckPicker sm2States={sm2States} onStart={startDeck} sessionStats={sessionStats} />
      )}

      {step === 'card' && currentCard && (
        <FlashcardCard
          card={currentCard}
          deckId={activeDeck!}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(!isFlipped)}
          onSelfGrade={flashcardSelfGrade}
          onExit={exitDeck}
          progress={{ current: currentCardIndex + 1, total: cardQueue.length }}
          sm2State={sm2States[currentCard.id] || null}
        />
      )}

      {step === 'recall_input' && currentCard && (
        <RecallInputCard
          card={currentCard}
          deckId={activeDeck!}
          mode={mode}
          userAnswer={userAnswer}
          onAnswerChange={setUserAnswer}
          onSubmit={submitRecall}
          onExit={exitDeck}
          busy={busy}
          progress={{ current: currentCardIndex + 1, total: cardQueue.length }}
        />
      )}

      {step === 'recall_results' && currentCard && recallResult && (
        <RecallResultsCard
          card={currentCard}
          deckId={activeDeck!}
          result={recallResult}
          userAnswer={userAnswer}
          onNext={advance}
          onExit={exitDeck}
          isLast={currentCardIndex + 1 >= cardQueue.length}
        />
      )}

      <SessionStatsPanel sessionStats={sessionStats} sm2States={sm2States} />
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────

function Hero() {
  return (
    <div
      style={{
        padding: 18,
        background:
          'linear-gradient(135deg, rgba(139, 92, 246, 0.10), rgba(22, 163, 74, 0.05))',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#8B5CF6',
          marginBottom: 6,
        }}
      >
        Education Room · Mastery through recollection
      </div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}
      >
        Reading builds familiarity. Recall under pressure builds mastery.
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginTop: 8,
          marginBottom: 0,
          lineHeight: 1.6,
          maxWidth: 800,
        }}
      >
        12 decks across {ALL_CARDS.length} cards covering DI&rsquo;s entire knowledge surface — vocabulary discipline, the 7 buyer personas with verbatim phrases, Maalouf 6 + Satyam 5 + 11-dim Sales DQI rubric, the 5 silent objections with status, the 17 regulatory frameworks, the 12-node pipeline, R²F&rsquo;s Kahneman+Klein integration. Three modes per deck: <strong>Flashcard</strong> (passive recall, self-graded with SM-2 spaced repetition), <strong>Recall</strong> (active recall, AI-graded against the canonical answer), and <strong>Apply</strong> (scenario application drills).
      </p>
    </div>
  );
}

// ─── Deck Picker ───────────────────────────────────────────────────

function DeckPicker(props: {
  sm2States: Record<string, SM2CardState>;
  sessionStats: { reviewed: number; gotIt: number; almost: number; missed: number };
  onStart: (deckId: DeckId, mode: StudyMode) => void;
}) {
  const [hoveredDeck, setHoveredDeck] = useState<DeckId | null>(null);
  const [mode, setMode] = useState<StudyMode>('flashcard');

  // Compute per-deck mastery: % of cards with successful repetitions >= 1.
  const deckMastery = useMemo(() => {
    const out: Record<DeckId, { mastered: number; due: number; total: number }> = {} as Record<DeckId, { mastered: number; due: number; total: number }>;
    const now = Date.now();
    for (const deck of DECKS) {
      const cards = cardsForDeck(deck.id);
      let mastered = 0;
      let due = 0;
      for (const c of cards) {
        const st = props.sm2States[c.id];
        if (st && st.successfulReviews >= 2) mastered += 1;
        if (!st || new Date(st.nextDue).getTime() <= now) due += 1;
      }
      out[deck.id] = { mastered, due, total: cards.length };
    }
    return out;
  }, [props.sm2States]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mode selector */}
      <div
        style={{
          padding: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div className="section-heading" style={{ marginBottom: 10 }}>
          1 · Pick study mode
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {([
            { id: 'flashcard', label: 'Flashcard', desc: 'Flip & self-grade. Fast.' },
            { id: 'recall', label: 'Recall', desc: 'Type the answer. AI-graded against canonical.' },
            { id: 'apply', label: 'Apply', desc: 'Use the concept in a real scenario. AI-graded.' },
          ] as const).map(m => {
            const isActive = m.id === mode;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  flex: '1 1 200px',
                  padding: '12px 14px',
                  background: isActive ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-elevated)',
                  border: `1px solid ${isActive ? '#8B5CF6' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#8B5CF6' : 'var(--text-primary)', marginBottom: 2 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {m.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deck grid */}
      <div
        style={{
          padding: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div className="section-heading" style={{ marginBottom: 10 }}>
          2 · Pick a deck ({ALL_CARDS.length} cards across {DECKS.length} decks)
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {[...DECKS].sort((a, b) => a.order - b.order).map(deck => {
            const Icon = getIcon(deck.iconName);
            const stats = deckMastery[deck.id];
            const isHovered = hoveredDeck === deck.id;
            return (
              <button
                key={deck.id}
                onClick={() => props.onStart(deck.id, mode)}
                onMouseEnter={() => setHoveredDeck(deck.id)}
                onMouseLeave={() => setHoveredDeck(null)}
                style={{
                  padding: 12,
                  background: isHovered ? `${deck.color}10` : 'var(--bg-elevated)',
                  border: `1px solid ${isHovered ? deck.color : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  minHeight: 130,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={16} style={{ color: deck.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {deck.label}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {deck.description}
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {stats.total} cards · {stats.mastered} mastered
                  </span>
                  {stats.due > 0 && (
                    <span style={{ color: deck.color, fontWeight: 700 }}>
                      {stats.due} due
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Flashcard Card ────────────────────────────────────────────────

function FlashcardCard(props: {
  card: EducationCard;
  deckId: DeckId;
  isFlipped: boolean;
  onFlip: () => void;
  onSelfGrade: (quality: number) => void;
  onExit: () => void;
  progress: { current: number; total: number };
  sm2State: SM2CardState | null;
}) {
  const deck = DECKS.find(d => d.id === props.deckId)!;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CardHeader deck={deck} progress={props.progress} sm2State={props.sm2State} onExit={props.onExit} />

      <div
        onClick={props.onFlip}
        style={{
          padding: 24,
          minHeight: 220,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          transition: 'all 0.2s',
        }}
      >
        {!props.isFlipped ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: deck.color, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={12} /> Front · click to flip
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, flex: 1, display: 'flex', alignItems: 'center' }}>
              {props.card.prompt}
            </div>
            {props.card.hint && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Hint available — flip to see canonical answer + hint.
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <EyeOff size={12} /> Back · canonical answer
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, flex: 1 }}>
              {props.card.canonicalAnswer}
            </div>
            {props.card.applicationContext && (
              <div style={{ marginTop: 8, padding: 8, background: 'var(--bg-elevated)', borderRadius: 4, fontSize: 12, color: 'var(--text-secondary)', borderLeft: `3px solid ${deck.color}` }}>
                <strong>When this comes up:</strong> {props.card.applicationContext}
              </div>
            )}
          </>
        )}
      </div>

      {props.isFlipped && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <SelfGradeButton color="#DC2626" label="Missed" quality={1} onClick={props.onSelfGrade} />
          <SelfGradeButton color="#F59E0B" label="Almost" quality={3} onClick={props.onSelfGrade} />
          <SelfGradeButton color="#16A34A" label="Got it" quality={5} onClick={props.onSelfGrade} />
        </div>
      )}
    </div>
  );
}

function SelfGradeButton(props: { color: string; label: string; quality: number; onClick: (q: number) => void }) {
  return (
    <button
      onClick={() => props.onClick(props.quality)}
      style={{
        flex: 1,
        padding: '10px 14px',
        background: `${props.color}15`,
        border: `1px solid ${props.color}`,
        borderRadius: 'var(--radius-md)',
        color: props.color,
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {props.label}
    </button>
  );
}

// ─── Recall Input ──────────────────────────────────────────────────

function RecallInputCard(props: {
  card: EducationCard;
  deckId: DeckId;
  mode: StudyMode;
  userAnswer: string;
  onAnswerChange: (s: string) => void;
  onSubmit: () => void;
  onExit: () => void;
  busy: boolean;
  progress: { current: number; total: number };
}) {
  const deck = DECKS.find(d => d.id === props.deckId)!;
  const wordCount = props.userAnswer.trim().split(/\s+/).filter(Boolean).length;
  const isApply = props.mode === 'apply';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CardHeader deck={deck} progress={props.progress} sm2State={null} onExit={props.onExit} />

      <div
        style={{
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: deck.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {isApply ? 'Apply · use this in scenario' : 'Recall · type the answer in your own words'}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {props.card.prompt}
        </div>

        {isApply && props.card.applicationContext && (
          <div
            style={{
              padding: 10,
              background: 'rgba(99, 102, 241, 0.06)',
              borderLeft: '3px solid #6366F1',
              borderRadius: 4,
              fontSize: 12,
              color: 'var(--text-primary)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: '#6366F1' }}>Scenario:</strong> {props.card.applicationContext}
          </div>
        )}

        <textarea
          value={props.userAnswer}
          onChange={e => props.onAnswerChange(e.target.value)}
          placeholder={isApply
            ? "How would you USE this concept in the scenario above? Type your answer as if speaking to the buyer."
            : "Type the answer in your own voice. Don't aim for verbatim — aim for the load-bearing concepts."
          }
          rows={8}
          style={{
            width: '100%',
            padding: 12,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            resize: 'vertical',
          }}
        />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={props.onSubmit}
            disabled={wordCount < 2 || props.busy}
            style={{
              padding: '10px 16px',
              background: wordCount >= 2 ? '#8B5CF6' : 'var(--bg-elevated)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: wordCount >= 2 ? '#fff' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 700,
              cursor: wordCount >= 2 && !props.busy ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Brain size={13} /> {props.busy ? 'Grading…' : 'Submit for grading'}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {wordCount} words {wordCount < 2 && '· need at least a sentence'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Recall Results ────────────────────────────────────────────────

function RecallResultsCard(props: {
  card: EducationCard;
  deckId: DeckId;
  result: RecallGradeResult;
  userAnswer: string;
  onNext: () => void;
  onExit: () => void;
  isLast: boolean;
}) {
  const deck = DECKS.find(d => d.id === props.deckId)!;
  const r = props.result;
  const gradeColor =
    r.grade === 'A' ? '#16A34A' :
    r.grade === 'B' ? '#22C55E' :
    r.grade === 'C' ? '#EAB308' :
    r.grade === 'D' ? '#F97316' : '#DC2626';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Score header */}
      <div
        style={{
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${gradeColor}22, ${gradeColor}05)`,
            border: `3px solid ${gradeColor}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 800, color: gradeColor, lineHeight: 1 }}>
            {r.score}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: gradeColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
            Grade {r.grade}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: deck.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {deck.label} · recall
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.4 }}>
            {props.card.prompt}
          </div>
          <div
            style={{
              padding: '8px 10px',
              background: 'rgba(139, 92, 246, 0.08)',
              borderLeft: '3px solid #8B5CF6',
              borderRadius: 4,
              fontSize: 12,
              color: 'var(--text-primary)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: '#8B5CF6' }}>Coach note:</strong> {r.coachNote}
          </div>
        </div>
      </div>

      {/* Landed + Missed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="recall-twocol">
        <div
          style={{
            padding: 14,
            background: 'rgba(22, 163, 74, 0.06)',
            border: '1px solid rgba(22, 163, 74, 0.20)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="section-heading" style={{ color: '#16A34A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={12} /> What landed
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {r.whatLanded.length === 0 && <li style={{ color: 'var(--text-muted)' }}>(nothing — see what you missed)</li>}
            {r.whatLanded.map((p, i) => <li key={i} style={{ marginBottom: 4 }}>{p}</li>)}
          </ul>
        </div>

        <div
          style={{
            padding: 14,
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.20)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="section-heading" style={{ color: '#D97706', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <XCircle size={12} /> What you missed
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {r.whatMissed.length === 0 && <li style={{ color: 'var(--text-muted)' }}>(nothing — solid recall)</li>}
            {r.whatMissed.map((p, i) => <li key={i} style={{ marginBottom: 4 }}>{p}</li>)}
          </ul>
        </div>
      </div>

      {/* Canonical answer (collapsed/expandable could come later — render full for now) */}
      <details
        style={{
          padding: 12,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--text-primary)' }}>
          Canonical answer (compare to yours)
        </summary>
        <div style={{ marginTop: 8, lineHeight: 1.6, color: 'var(--text-primary)' }}>
          {r.canonicalAnswer}
        </div>
        <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Your answer was:
          </div>
          <div style={{ lineHeight: 1.5, fontStyle: 'italic' }}>{props.userAnswer}</div>
        </div>
      </details>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={props.onNext}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: '#8B5CF6',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {props.isLast ? 'Finish session' : 'Next card'} <ArrowRight size={13} />
        </button>
        <button
          onClick={props.onExit}
          style={{
            padding: '12px 14px',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Exit deck
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .recall-twocol {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Card header (deck + progress + sm2 state) ────────────────────

function CardHeader(props: {
  deck: { label: string; color: string; iconName: string };
  progress: { current: number; total: number };
  sm2State: SM2CardState | null;
  onExit: () => void;
}) {
  const Icon = getIcon(props.deck.iconName);
  const reps = props.sm2State?.repetitions ?? 0;
  const masteryPct = props.sm2State && props.sm2State.totalReviews > 0
    ? Math.round((props.sm2State.successfulReviews / props.sm2State.totalReviews) * 100)
    : null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        padding: '8px 12px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={14} style={{ color: props.deck.color }} />
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{props.deck.label}</span>
        <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          · {props.progress.current} of {props.progress.total}
        </span>
        {reps > 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            · seen {reps}× {masteryPct !== null && `· ${masteryPct}% mastery`}
          </span>
        )}
      </div>
      <button
        onClick={props.onExit}
        style={{
          padding: '4px 10px',
          background: 'transparent',
          border: '1px solid var(--border-color)',
          borderRadius: 4,
          color: 'var(--text-muted)',
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        Exit
      </button>
    </div>
  );
}

// ─── Session Stats ────────────────────────────────────────────────

function SessionStatsPanel(props: {
  sessionStats: { reviewed: number; gotIt: number; almost: number; missed: number };
  sm2States: Record<string, SM2CardState>;
}) {
  const totalCards = ALL_CARDS.length;
  const cardsTouched = Object.keys(props.sm2States).length;
  const masteredCards = Object.values(props.sm2States).filter(s => s.successfulReviews >= 2).length;
  const masteryPct = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
  return (
    <div
      style={{
        padding: 14,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      <div style={{ minWidth: 140 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
          Total mastery
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#8B5CF6', fontVariantNumeric: 'tabular-nums' }}>
          {masteredCards} / {totalCards}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{masteryPct}% across all decks</div>
      </div>
      <div style={{ minWidth: 120 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
          Cards touched
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {cardsTouched}
        </div>
      </div>
      <div style={{ minWidth: 120 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
          Reviewed (lifetime)
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {props.sessionStats.reviewed}
        </div>
      </div>
      <div style={{ minWidth: 120 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
          Got it
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>
          {props.sessionStats.gotIt}
        </div>
      </div>
      <div style={{ minWidth: 120 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
          Almost
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F59E0B', fontVariantNumeric: 'tabular-nums' }}>
          {props.sessionStats.almost}
        </div>
      </div>
      <div style={{ minWidth: 120 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
          Missed
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
          {props.sessionStats.missed}
        </div>
      </div>
    </div>
  );
}
