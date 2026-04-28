'use client';

/**
 * SparringRoomTab — sales-practice live-rep surface (locked 2026-04-28).
 *
 * The reading + rehearsal loop that pairs with Closing Lab. Workflow:
 *   1. Pick a buyer persona × scenario mode.
 *   2. Generate scenario — opener line + 3 buyer questions in their voice.
 *   3. Hit "Start prep" — 5-second countdown, then questions reveal.
 *   4. Open Wispr Flow externally, give your full speech in your voice.
 *   5. Paste the transcript back, hit "Grade me."
 *   6. Read the sales-DQI scorecard + buyer-perspective simulation +
 *      framework-grounded improvements + the verbatim phrase you SHOULD
 *      have used (ready to read aloud and rehearse).
 *   7. Go again. The history pane tracks your sales DQI trend.
 *
 * Pattern lifted from Nexus Tracker MindForge (impromptu-speaking module),
 * extended for B2B sales conversations with named DI buyer personas and
 * the Maalouf + Satyam + DI-discipline grading rubric.
 *
 * Wispr Flow note: the founder uses Wispr Flow externally for voice
 * transcription (system-wide voice→text). We don't add transcription to
 * the web app; we accept the pasted transcript. Keeps the surface
 * lightweight and works on any device that has Wispr Flow installed.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Mic,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Clock,
  Brain,
  Trophy,
  Quote,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import {
  BUYER_PERSONAS,
  SCENARIO_MODES,
  GRADING_DIMENSIONS,
  findPersonaById,
  findScenarioById,
  type BuyerPersonaId,
  type ScenarioMode,
  type SparringSessionResult,
  type GradingDimensionId,
} from './sparring/sparring-room-data';
import { Target } from 'lucide-react';
import { SparringTrendViz } from './sparring/SparringTrendViz';

interface Props {
  founderPass: string;
}

type FlowStep = 'setup' | 'brief' | 'recording' | 'reviewing' | 'results';

interface ScenarioBrief {
  openerLine: string;
  questions: string[];
  scenarioFraming: string;
  isMock?: boolean;
}

interface HistoryEntry {
  sessionId: string;
  dateISO: string;
  personaId: BuyerPersonaId;
  mode: ScenarioMode;
  salesDqi: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  isWarmContext: boolean;
  /** Per-dimension scores 0-5. Optional for back-compat with v1 entries
   * (entries from before 2026-04-28 trend-viz extension lack this field). */
  dimensions?: Record<GradingDimensionId, number>;
  /** Filler-word count from the rep — used for "delivery cleanliness" trend. */
  fillerCount?: number;
}

// v2: extended HistoryEntry shape (added dimensions + fillerCount). Old v1
// entries still load (dimensions undefined → trend viz handles gracefully).
const HISTORY_KEY = 'di-sparring-room-history-v1';
const MAX_HISTORY = 50;

// ─── Component ─────────────────────────────────────────────────────

export function SparringRoomTab({ founderPass }: Props) {
  const [step, setStep] = useState<FlowStep>('setup');
  const [personaId, setPersonaId] = useState<BuyerPersonaId>('mid_market_pe_associate');
  const [mode, setMode] = useState<ScenarioMode>('cold_first_meeting');
  const [isWarmContext, setIsWarmContext] = useState<boolean>(false);
  const [brief, setBrief] = useState<ScenarioBrief | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [result, setResult] = useState<SparringSessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [prepCountdown, setPrepCountdown] = useState<number>(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load history on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw) as HistoryEntry[]);
    } catch {
      // localStorage in private-mode Safari, unparseable JSON, etc.
    }
  }, []);

  const persistHistory = useCallback((next: HistoryEntry[]) => {
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next.slice(-MAX_HISTORY)));
    } catch {
      // localStorage full or unavailable.
    }
  }, []);

  const generateBrief = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/founder-hub/sparring/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-founder-pass': founderPass },
        body: JSON.stringify({ personaId, mode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Could not generate scenario');
      }
      const data = (await res.json()) as ScenarioBrief;
      setBrief(data);
      setStep('brief');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate scenario');
    } finally {
      setBusy(false);
    }
  }, [founderPass, personaId, mode]);

  const startPrep = useCallback(() => {
    setPrepCountdown(5);
  }, []);

  // Countdown effect.
  useEffect(() => {
    if (prepCountdown <= 0) return;
    const id = setTimeout(() => {
      setPrepCountdown(c => {
        const next = c - 1;
        if (next === 0) setStep('recording');
        return next;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [prepCountdown]);

  const submitTranscript = useCallback(async () => {
    if (!brief || transcript.trim().length < 30) {
      setError('Need at least 30 characters of transcript before grading.');
      return;
    }
    setStep('reviewing');
    setBusy(true);
    setError(null);

    // Compute recent-history context (last 5 reps' rolling per-dimension
    // averages) so the grader can identify recurring weakness patterns.
    const recentDimensionAverages: Partial<Record<GradingDimensionId, number>> = {};
    const recentWithDims = history.slice(-5).filter(h => h.dimensions);
    if (recentWithDims.length > 0) {
      const sums: Partial<Record<GradingDimensionId, { sum: number; count: number }>> = {};
      for (const h of recentWithDims) {
        if (!h.dimensions) continue;
        for (const [dim, score] of Object.entries(h.dimensions) as Array<
          [GradingDimensionId, number]
        >) {
          if (!sums[dim]) sums[dim] = { sum: 0, count: 0 };
          sums[dim]!.sum += score;
          sums[dim]!.count += 1;
        }
      }
      for (const [dim, agg] of Object.entries(sums) as Array<
        [GradingDimensionId, { sum: number; count: number }]
      >) {
        recentDimensionAverages[dim] = agg.sum / agg.count;
      }
    }

    try {
      const res = await fetch('/api/founder-hub/sparring/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-founder-pass': founderPass },
        body: JSON.stringify({
          personaId,
          mode,
          questions: brief.questions,
          transcript,
          isWarmContext,
          recentDimensionAverages,
          totalRepsCompleted: history.length,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Grading request failed' }));
        throw new Error(err.error || 'Grading failed');
      }
      const data = (await res.json()) as SparringSessionResult;
      setResult(data);

      // Append to history (v2 shape — dimensions + fillerCount captured for trend viz).
      const entry: HistoryEntry = {
        sessionId:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : String(Date.now()),
        dateISO: new Date().toISOString(),
        personaId,
        mode,
        salesDqi: data.salesDqi,
        grade: data.grade,
        isWarmContext,
        dimensions: data.dimensions,
        fillerCount: data.fillerCount,
      };
      persistHistory([...history, entry]);

      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grading failed');
      setStep('recording');
    } finally {
      setBusy(false);
    }
  }, [brief, transcript, founderPass, personaId, mode, isWarmContext, history, persistHistory]);

  const goAgain = useCallback(() => {
    setBrief(null);
    setTranscript('');
    setResult(null);
    setError(null);
    setPrepCountdown(0);
    setStep('setup');
  }, []);

  /** Apply the AI's nextRepSetup recommendation and jump straight back to setup. */
  const goAgainWithRecommendation = useCallback(() => {
    if (result?.nextRepSetup) {
      setPersonaId(result.nextRepSetup.recommendedPersonaId);
      setMode(result.nextRepSetup.recommendedMode);
    }
    goAgain();
  }, [result, goAgain]);

  const persona = findPersonaById(personaId);
  const scenario = findScenarioById(mode);

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

      {step === 'setup' && (
        <SetupCard
          personaId={personaId}
          mode={mode}
          isWarmContext={isWarmContext}
          onPersonaChange={setPersonaId}
          onModeChange={setMode}
          onWarmChange={setIsWarmContext}
          onStart={generateBrief}
          busy={busy}
        />
      )}

      {step === 'brief' && brief && persona && scenario && (
        <BriefCard
          brief={brief}
          persona={persona}
          scenarioLabel={scenario.label}
          isWarmContext={isWarmContext}
          prepCountdown={prepCountdown}
          onPrep={startPrep}
          onProceed={() => setStep('recording')}
          onCancel={goAgain}
        />
      )}

      {step === 'recording' && brief && persona && scenario && (
        <RecordingCard
          brief={brief}
          persona={persona}
          scenarioLabel={scenario.label}
          transcript={transcript}
          onTranscriptChange={setTranscript}
          onSubmit={submitTranscript}
          onBack={() => setStep('brief')}
          busy={busy}
        />
      )}

      {step === 'reviewing' && <ReviewingCard />}

      {step === 'results' && result && persona && scenario && (
        <ResultsCard
          result={result}
          persona={persona}
          scenarioLabel={scenario.label}
          isWarmContext={isWarmContext}
          onGoAgain={goAgain}
          onGoAgainWithRec={goAgainWithRecommendation}
        />
      )}

      <SparringTrendViz history={history} />

      <HistoryPanel history={history} onClear={() => persistHistory([])} />
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────

function Hero() {
  return (
    <div
      style={{
        padding: 18,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.10), rgba(22, 163, 74, 0.05))',
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
          color: '#6366F1',
          marginBottom: 6,
        }}
      >
        Sparring Room · Live Sales Reps
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
        Practice the conversation. Get graded on a sales-DQI rubric. Hear the buyer&rsquo;s thought.
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
        Closing Lab gave you the frameworks. The Sparring Room makes you live them. Pick a buyer
        persona, pick a scenario mode (including <strong>networking events in-person</strong>),
        generate 3 questions in their voice, then record yourself answering with Wispr Flow and
        paste the transcript back. The AI grades you on 11 dimensions — Maalouf 4 + Satyam 3 + DI
        discipline 2 + <strong>Kahneman loss-aversion framing</strong> + fundamentals — simulates
        the buyer&rsquo;s internal monologue right after you finish, and hands you the verbatim
        phrase you should have used so you can rehearse it before the next call.
      </p>
    </div>
  );
}

// ─── Setup ─────────────────────────────────────────────────────────

interface SetupProps {
  personaId: BuyerPersonaId;
  mode: ScenarioMode;
  isWarmContext: boolean;
  onPersonaChange: (id: BuyerPersonaId) => void;
  onModeChange: (m: ScenarioMode) => void;
  onWarmChange: (b: boolean) => void;
  onStart: () => void;
  busy: boolean;
}

function SetupCard(props: SetupProps) {
  const persona = findPersonaById(props.personaId)!;
  const scenario = findScenarioById(props.mode)!;
  return (
    <div
      style={{
        padding: 18,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div className="section-heading">Step 1 · Pick your buyer + scenario</div>

      <div>
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginBottom: 6,
            display: 'block',
          }}
        >
          Buyer persona
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {BUYER_PERSONAS.map(p => {
            const isActive = p.id === props.personaId;
            return (
              <button
                key={p.id}
                onClick={() => props.onPersonaChange(p.id)}
                style={{
                  padding: '8px 12px',
                  background: isActive ? p.color : 'var(--bg-elevated)',
                  border: `1px solid ${isActive ? p.color : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {p.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>· {p.archetype}</span>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
          {persona.rolePlayIntro}
        </div>
      </div>

      <div>
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginBottom: 6,
            display: 'block',
          }}
        >
          Scenario mode
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SCENARIO_MODES.map(s => {
            const isActive = s.id === props.mode;
            return (
              <button
                key={s.id}
                onClick={() => props.onModeChange(s.id)}
                style={{
                  padding: '8px 12px',
                  background: isActive ? '#6366F1' : 'var(--bg-elevated)',
                  border: `1px solid ${isActive ? '#6366F1' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
          {scenario.description}
        </div>
      </div>

      <label
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={props.isWarmContext}
          onChange={e => props.onWarmChange(e.target.checked)}
          style={{ accentColor: '#6366F1' }}
        />
        <span>
          Warm context (this buyer has had a prior meeting and earned exposure to DI&rsquo;s locked
          vocabulary). When unchecked, locked vocabulary on a cold buyer is graded as a discipline
          failure.
        </span>
      </label>

      <button
        onClick={props.onStart}
        disabled={props.busy}
        style={{
          padding: '12px 18px',
          background: '#16A34A',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: props.busy ? 'wait' : 'pointer',
          opacity: props.busy ? 0.6 : 1,
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.15s',
        }}
      >
        {props.busy ? 'Generating…' : 'Generate scenario'} <ArrowRight size={14} />
      </button>
    </div>
  );
}

// ─── Brief ─────────────────────────────────────────────────────────

interface BriefProps {
  brief: ScenarioBrief;
  persona: ReturnType<typeof findPersonaById> & object;
  scenarioLabel: string;
  isWarmContext: boolean;
  prepCountdown: number;
  onPrep: () => void;
  onProceed: () => void;
  onCancel: () => void;
}

function BriefCard(props: BriefProps) {
  return (
    <div
      style={{
        padding: 18,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div className="section-heading">Step 2 · The scenario brief</div>

      <div
        style={{
          padding: 12,
          background: 'rgba(99, 102, 241, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.20)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          color: 'var(--text-primary)',
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#6366F1',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 4,
          }}
        >
          Setting
        </div>
        {props.brief.scenarioFraming}
        {props.isWarmContext && (
          <span style={{ fontSize: 11, marginLeft: 8, color: '#16A34A', fontWeight: 700 }}>
            · Warm context
          </span>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          Buyer&rsquo;s opener
        </div>
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--bg-elevated)',
            borderLeft: `3px solid ${props.persona?.color ?? '#6366F1'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            lineHeight: 1.5,
          }}
        >
          {props.brief.openerLine}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          The 3 questions they ask
        </div>
        <ol
          style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {props.brief.questions.map((q, i) => (
            <li key={i} style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {q}
            </li>
          ))}
        </ol>
      </div>

      <div
        style={{
          padding: 12,
          background: 'rgba(245, 158, 11, 0.06)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: '#D97706' }}>Your move:</strong> Open Wispr Flow on your machine.
        When you click <em>Start prep</em> below, you get 5 seconds to read the questions one more
        time, then the recording prompt appears. Speak your full answer in your voice — aim for
        60-120 seconds. Wispr Flow transcribes; you paste the transcript back.
      </div>

      {props.prepCountdown > 0 ? (
        <div
          style={{
            padding: '24px 16px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '2px solid rgba(99, 102, 241, 0.40)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            fontSize: 36,
            fontWeight: 800,
            color: '#6366F1',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {props.prepCountdown}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={props.onPrep}
            style={{
              padding: '12px 18px',
              background: '#6366F1',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Clock size={14} /> Start prep (5s) → Record
          </button>
          <button
            onClick={props.onProceed}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Skip prep <ArrowRight size={14} />
          </button>
          <button
            onClick={props.onCancel}
            style={{
              padding: '12px 14px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Recording (transcript paste) ──────────────────────────────────

interface RecordingProps {
  brief: ScenarioBrief;
  persona: ReturnType<typeof findPersonaById> & object;
  scenarioLabel: string;
  transcript: string;
  onTranscriptChange: (t: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  busy: boolean;
}

function RecordingCard(props: RecordingProps) {
  const wordCount = useMemo(
    () => props.transcript.trim().split(/\s+/).filter(Boolean).length,
    [props.transcript]
  );
  const enoughText = wordCount >= 8;

  return (
    <div
      style={{
        padding: 18,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div className="section-heading">Step 3 · Speak with Wispr Flow, paste the transcript</div>

      <div
        style={{
          padding: 12,
          background: 'rgba(99, 102, 241, 0.06)',
          borderLeft: '3px solid #6366F1',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Mic size={14} style={{ color: '#6366F1' }} />
          <strong style={{ color: '#6366F1' }}>Reminder of the 3 questions:</strong>
        </div>
        <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--text-primary)' }}>
          {props.brief.questions.map((q, i) => (
            <li key={i} style={{ marginBottom: 2 }}>
              {q}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginBottom: 6,
            display: 'block',
          }}
        >
          Pasted transcript ({wordCount} words)
        </label>
        <textarea
          value={props.transcript}
          onChange={e => props.onTranscriptChange(e.target.value)}
          placeholder="Open Wispr Flow on your machine. Hit your record shortcut. Answer all 3 questions out loud, in your voice — pretend the buyer is sitting across the desk. When you stop speaking, Wispr drops the transcript. Paste it here."
          rows={10}
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
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={props.onSubmit}
          disabled={!enoughText || props.busy}
          style={{
            padding: '12px 18px',
            background: enoughText ? '#16A34A' : 'var(--bg-elevated)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: enoughText ? '#fff' : 'var(--text-muted)',
            fontSize: 14,
            fontWeight: 700,
            cursor: enoughText && !props.busy ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s',
          }}
        >
          <Brain size={14} /> {props.busy ? 'Grading…' : 'Grade me'}
        </button>
        <button
          onClick={props.onBack}
          style={{
            padding: '12px 14px',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Back to brief
        </button>
        {!enoughText && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            (need at least ~8 words of transcript)
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Reviewing (loading state) ─────────────────────────────────────

function ReviewingCard() {
  return (
    <div
      style={{
        padding: 32,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}
    >
      <Brain
        size={32}
        style={{ color: '#6366F1', marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }}
      />
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
        Grading your rep…
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        Running 11-dimension Sales DQI · simulating the buyer&rsquo;s internal monologue · drafting
        the verbatim phrase you should have used.
      </div>
    </div>
  );
}

// ─── Results ───────────────────────────────────────────────────────

interface ResultsProps {
  result: SparringSessionResult;
  persona: ReturnType<typeof findPersonaById> & object;
  scenarioLabel: string;
  isWarmContext: boolean;
  onGoAgain: () => void;
  onGoAgainWithRec: () => void;
}

function ResultsCard(props: ResultsProps) {
  const r = props.result;
  const gradeColor =
    r.grade === 'A'
      ? '#16A34A'
      : r.grade === 'B'
        ? '#22C55E'
        : r.grade === 'C'
          ? '#EAB308'
          : r.grade === 'D'
            ? '#F97316'
            : '#DC2626';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* DQI hero */}
      <div
        style={{
          padding: 18,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 96,
              height: 96,
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
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: gradeColor,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {r.salesDqi}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: gradeColor,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: 2,
              }}
            >
              Sales DQI
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              Grade · {props.persona.label} · {props.scenarioLabel}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: gradeColor, lineHeight: 1 }}>
              {r.grade}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginTop: 4,
                maxWidth: 480,
                lineHeight: 1.5,
              }}
            >
              {r.feedback}
            </div>
          </div>
        </div>
        <button
          onClick={props.onGoAgain}
          style={{
            padding: '10px 16px',
            background: '#6366F1',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <RotateCcw size={13} /> Go again
        </button>
      </div>

      {/* Buyer perspective */}
      <div
        style={{
          padding: 16,
          background: `linear-gradient(135deg, ${props.persona.color}10, transparent)`,
          border: `1px solid ${props.persona.color}40`,
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: props.persona.color,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Quote size={12} /> What {props.persona.archetype} is thinking after your answer
        </div>
        <div
          style={{
            fontSize: 14,
            color: 'var(--text-primary)',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}
        >
          {r.buyerThought}
        </div>
      </div>

      {/* Dimension grid */}
      <div
        style={{
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div className="section-heading" style={{ marginBottom: 12 }}>
          10 dimensions · scored 0-5
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {GRADING_DIMENSIONS.map(dim => {
            const score = r.dimensions[dim.id] ?? 0;
            const sourceColor =
              dim.source === 'maalouf'
                ? '#DC2626'
                : dim.source === 'satyam'
                  ? '#0EA5E9'
                  : dim.source === 'di_discipline'
                    ? '#16A34A'
                    : dim.source === 'kahneman'
                      ? '#F59E0B'
                      : '#A78BFA';
            return <DimensionRow key={dim.id} dim={dim} score={score} sourceColor={sourceColor} />;
          })}
        </div>
      </div>

      {/* Strengths + Improvements */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}
        className="results-twocol"
      >
        <div
          style={{
            padding: 16,
            background: 'rgba(22, 163, 74, 0.06)',
            border: '1px solid rgba(22, 163, 74, 0.20)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="section-heading" style={{ color: '#16A34A', marginBottom: 10 }}>
            <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />
            Strengths · keep doing this
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {r.strengths.map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#16A34A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: 2,
                  }}
                >
                  {s.framework}
                </span>
                {s.point}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: 16,
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.20)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="section-heading" style={{ color: '#D97706', marginBottom: 10 }}>
            <Lightbulb size={12} style={{ display: 'inline', marginRight: 4 }} />
            Improvements · rehearse the verbatim phrase
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {r.improvements.map((imp, i) => (
              <div key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#D97706',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: 2,
                  }}
                >
                  {imp.framework}
                </span>
                <div style={{ color: 'var(--text-primary)', marginBottom: 6 }}>{imp.point}</div>
                <div
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    borderLeft: '3px solid #16A34A',
                    borderRadius: 4,
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  &ldquo;{imp.exactPhrase}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mechanical analytics */}
      <div
        style={{
          padding: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <Stat label="Words" value={String(r.wordCount)} />
        <Stat label="Sentences" value={String(r.sentenceCount)} />
        <Stat
          label="Filler words"
          value={String(r.fillerCount)}
          tone={r.fillerCount > 8 ? 'warn' : 'ok'}
          detail={r.fillerWords.slice(0, 6).join(', ')}
        />
        {r.bannedVocabularyHits.length > 0 && (
          <Stat
            label="Banned vocabulary detected"
            value={String(r.bannedVocabularyHits.length)}
            tone="error"
            detail={r.bannedVocabularyHits.join(', ')}
          />
        )}
        {r.lockedVocabularyHits.length > 0 && (
          <Stat
            label="DI locked vocabulary used"
            value={String(r.lockedVocabularyHits.length)}
            tone={props.isWarmContext ? 'ok' : 'warn'}
            detail={r.lockedVocabularyHits.join(', ')}
          />
        )}
      </div>

      {/* ── Actionable insights — coach not judge ────────────────────── */}

      {r.confidenceBuild && (
        <div
          style={{
            padding: 14,
            background: 'rgba(99, 102, 241, 0.06)',
            borderLeft: '3px solid #6366F1',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#6366F1',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}
          >
            Confidence build · what genuinely worked
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {r.confidenceBuild}
          </div>
        </div>
      )}

      {r.patternFlag && (
        <div
          style={{
            padding: 14,
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.30)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#D97706',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertCircle size={11} /> Pattern flag · across your recent reps
          </div>
          <div
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}
          >
            {r.patternFlag.pattern}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: 6,
            }}
          >
            <strong>Root cause:</strong> {r.patternFlag.rootCause}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <strong style={{ color: '#16A34A' }}>Breakthrough move:</strong>{' '}
            {r.patternFlag.breakthroughMove}
          </div>
        </div>
      )}

      {r.nextSessionFocus && r.nextSessionFocus.length > 0 && (
        <div
          style={{
            padding: 14,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            className="section-heading"
            style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Target size={12} /> Next session · focus areas
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 10,
            }}
          >
            {r.nextSessionFocus.map((focus, i) => {
              const dim = GRADING_DIMENSIONS.find(d => d.id === focus.dimensionId);
              const sourceColor =
                dim?.source === 'maalouf'
                  ? '#DC2626'
                  : dim?.source === 'satyam'
                    ? '#0EA5E9'
                    : dim?.source === 'di_discipline'
                      ? '#16A34A'
                      : dim?.source === 'kahneman'
                        ? '#F59E0B'
                        : dim?.source === 'jolt'
                          ? '#6366F1'
                          : dim?.source === 'cialdini'
                            ? '#EC4899'
                            : dim?.source === 'sandler'
                              ? '#14B8A6'
                              : '#A78BFA';
              return (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `3px solid ${sourceColor}`,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{ fontSize: 11, fontWeight: 700, color: sourceColor, marginBottom: 6 }}
                  >
                    {dim?.label || focus.dimensionId}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: 8,
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)' }}>Why it matters:</strong>{' '}
                    {focus.whyItMatters}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <strong style={{ color: '#16A34A' }}>Concrete action:</strong>{' '}
                    {focus.concreteAction}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {r.drillPlan && r.drillPlan.length > 0 && (
        <div
          style={{
            padding: 14,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            className="section-heading"
            style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <CheckCircle2 size={12} /> Drill plan · before your next rep
          </div>
          <ol
            style={{
              margin: 0,
              paddingLeft: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {r.drillPlan.map((d, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: 10,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    flexShrink: 0,
                    borderRadius: '50%',
                    background: '#16A34A20',
                    color: '#16A34A',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 2,
                    }}
                  >
                    {d.action}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {d.location}{' '}
                    <span style={{ marginLeft: 8, fontVariantNumeric: 'tabular-nums' }}>
                      · ~{d.estimatedMinutes} min
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {r.nextRepSetup && (
        <div
          style={{
            padding: 14,
            background:
              'linear-gradient(135deg, rgba(22, 163, 74, 0.08), rgba(99, 102, 241, 0.04))',
            border: '1px solid rgba(22, 163, 74, 0.25)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#16A34A',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 4,
              }}
            >
              Coach recommends · your next rep
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 4,
              }}
            >
              {(() => {
                const recPersona = BUYER_PERSONAS.find(
                  p => p.id === r.nextRepSetup.recommendedPersonaId
                );
                const recMode = SCENARIO_MODES.find(m => m.id === r.nextRepSetup.recommendedMode);
                return `${recPersona?.label || r.nextRepSetup.recommendedPersonaId} · ${recMode?.label || r.nextRepSetup.recommendedMode}`;
              })()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {r.nextRepSetup.rationale}
            </div>
          </div>
          <button
            onClick={props.onGoAgainWithRec}
            style={{
              padding: '10px 16px',
              background: '#16A34A',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            Use this setup <ArrowRight size={13} />
          </button>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 760px) {
          .results-twocol {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}

function DimensionRow(props: {
  dim: (typeof GRADING_DIMENSIONS)[number];
  score: number;
  sourceColor: string;
}) {
  const pct = (props.score / 5) * 100;
  return (
    <div
      style={
        {
          padding: 10,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          title: props.dim.excellentLooks,
        } as React.CSSProperties
      }
      title={`Excellent (5/5): ${props.dim.excellentLooks}\nPoor (1/5): ${props.dim.poorLooks}`}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)' }}>
          {props.dim.label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: props.sourceColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {props.score}/5
        </span>
      </div>
      <div
        style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: props.sourceColor,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <div
        style={{
          fontSize: 9.5,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginTop: 4,
        }}
      >
        {props.dim.source.replace('_', ' ')}
      </div>
    </div>
  );
}

function Stat(props: {
  label: string;
  value: string;
  tone?: 'ok' | 'warn' | 'error';
  detail?: string;
}) {
  const color =
    props.tone === 'error' ? '#DC2626' : props.tone === 'warn' ? '#D97706' : 'var(--text-primary)';
  return (
    <div style={{ minWidth: 120 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 2,
        }}
      >
        {props.label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {props.value}
      </div>
      {props.detail && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{props.detail}</div>
      )}
    </div>
  );
}

// ─── History ───────────────────────────────────────────────────────

function HistoryPanel(props: { history: HistoryEntry[]; onClear: () => void }) {
  if (props.history.length === 0) return null;
  const recent = [...props.history].slice(-12).reverse();
  const avg = props.history.reduce((s, h) => s + h.salesDqi, 0) / props.history.length;
  const lastFive = props.history.slice(-5);
  const trend =
    lastFive.length >= 2 ? lastFive[lastFive.length - 1].salesDqi - lastFive[0].salesDqi : 0;

  return (
    <div
      style={{
        padding: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div className="section-heading" style={{ margin: 0 }}>
          <Trophy size={12} style={{ display: 'inline', marginRight: 4 }} /> Session history ·{' '}
          {props.history.length} reps
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Avg <strong style={{ color: 'var(--text-primary)' }}>{Math.round(avg)}</strong>
          </span>
          {trend !== 0 && (
            <span
              style={{
                fontSize: 11,
                color: trend > 0 ? '#16A34A' : '#DC2626',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <TrendingUp size={11} /> {trend > 0 ? '+' : ''}
              {trend} last 5
            </span>
          )}
          <button
            onClick={props.onClear}
            style={{
              padding: '4px 8px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
              color: 'var(--text-muted)',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recent.map(entry => {
          const persona = findPersonaById(entry.personaId);
          const scenario = findScenarioById(entry.mode);
          const gradeColor =
            entry.grade === 'A'
              ? '#16A34A'
              : entry.grade === 'B'
                ? '#22C55E'
                : entry.grade === 'C'
                  ? '#EAB308'
                  : entry.grade === 'D'
                    ? '#F97316'
                    : '#DC2626';
          return (
            <div
              key={entry.sessionId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 10px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
              }}
            >
              <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 70 }}>
                {new Date(entry.dateISO).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                {new Date(entry.dateISO).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span
                style={{
                  minWidth: 32,
                  fontSize: 14,
                  fontWeight: 700,
                  color: gradeColor,
                  textAlign: 'center',
                }}
              >
                {entry.grade}
              </span>
              <span
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                {entry.salesDqi}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>{persona?.label}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{scenario?.label}</span>
              {entry.isWarmContext && (
                <span
                  style={{ fontSize: 10, color: '#16A34A', fontWeight: 700, marginLeft: 'auto' }}
                >
                  warm
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
