'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Loader2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface OutcomeData {
  analysisId: string;
  outcome: string;
  timeframe?: string;
  impactScore?: number;
  notes?: string;
  lessonsLearned?: string;
  confirmedBiases?: string[];
  falsPositiveBiases?: string[];
  mostAccurateTwin?: string;
  reportedAt?: string;
}

interface OutcomeReporterProps {
  analysisId: string;
  analysisDate: string;
  biases: Array<{ biasType: string; severity: string }>;
  twins?: Array<{ name: string; vote: string }>;
}

const OUTCOME_OPTIONS = [
  {
    value: 'success',
    label: 'Success',
    icon: CheckCircle,
    color: '#22c55e',
    description: 'Decision achieved intended results',
  },
  {
    value: 'partial_success',
    label: 'Partial',
    icon: TrendingUp,
    color: '#f59e0b',
    description: 'Some goals met, some missed',
  },
  {
    value: 'failure',
    label: 'Failed',
    icon: XCircle,
    color: '#ef4444',
    description: 'Decision did not achieve goals',
  },
  {
    value: 'too_early',
    label: 'Too Early',
    icon: Clock,
    color: '#a1a1aa',
    description: 'Not enough time to evaluate',
  },
] as const;

const TIMEFRAME_OPTIONS = [
  { value: '30_days', label: '30 days' },
  { value: '60_days', label: '60 days' },
  { value: '90_days', label: '90 days' },
  { value: '6_months', label: '6 months' },
  { value: '1_year', label: '1 year' },
] as const;

export function OutcomeReporter({ analysisId, analysisDate, biases, twins }: OutcomeReporterProps) {
  const [existing, setExisting] = useState<OutcomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [recalibrationNote, setRecalibrationNote] = useState<
    | null
    | { status: 'ok'; delta: number; grade: string; recalibratedScore: number }
    | { status: 'failed' }
  >(null);

  // Form state
  const [outcome, setOutcome] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('');
  const [impactScore, setImpactScore] = useState<number>(50);
  const [notes, setNotes] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [confirmedBiases, setConfirmedBiases] = useState<string[]>([]);
  const [falsPositiveBiases, setFalsPositiveBiases] = useState<string[]>([]);
  const [mostAccurateTwin, setMostAccurateTwin] = useState('');

  const fetchExisting = useCallback(async () => {
    try {
      const res = await fetch(`/api/outcomes?analysisId=${analysisId}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setExisting(data);
          setOutcome(data.outcome);
          setTimeframe(data.timeframe || '');
          setImpactScore(data.impactScore ?? 50);
          setNotes(data.notes || '');
          setLessonsLearned(data.lessonsLearned || '');
          setConfirmedBiases(data.confirmedBiases || []);
          setFalsPositiveBiases(data.falsPositiveBiases || []);
          setMostAccurateTwin(data.mostAccurateTwin || '');
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    fetchExisting();
  }, [fetchExisting]);

  const handleSubmit = async () => {
    if (!outcome) return;
    setSaving(true);
    try {
      const res = await fetch('/api/outcomes/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          outcome,
          timeframe: timeframe || undefined,
          impactScore: outcome !== 'too_early' ? impactScore : undefined,
          notes: notes || undefined,
          lessonsLearned: lessonsLearned || undefined,
          confirmedBiases,
          falsPositiveBiases,
          mostAccurateTwin: mostAccurateTwin || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Server returns { outcome, stats, recalibration } — existing state
        // expects the outcome object, not the envelope.
        setExisting(data?.outcome ?? data);
        if (data?.recalibration) {
          if (data.recalibration.status === 'ok') {
            setRecalibrationNote({
              status: 'ok',
              delta: data.recalibration.delta,
              grade: data.recalibration.grade,
              recalibratedScore: data.recalibration.recalibratedScore,
            });
          } else if (data.recalibration.status === 'failed') {
            setRecalibrationNote({ status: 'failed' });
          }
        }
        setExpanded(false);
      }
    } catch (err) {
      console.error('[OutcomeReporter] submit failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleBias = (biasType: string, list: 'confirmed' | 'falsePositive') => {
    if (list === 'confirmed') {
      setConfirmedBiases(prev =>
        prev.includes(biasType) ? prev.filter(b => b !== biasType) : [...prev, biasType]
      );
      setFalsPositiveBiases(prev => prev.filter(b => b !== biasType));
    } else {
      setFalsPositiveBiases(prev =>
        prev.includes(biasType) ? prev.filter(b => b !== biasType) : [...prev, biasType]
      );
      setConfirmedBiases(prev => prev.filter(b => b !== biasType));
    }
  };

  if (loading) return null;

  const daysSinceAnalysis = Math.floor(
    (Date.now() - new Date(analysisDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const outcomeOption = OUTCOME_OPTIONS.find(o => o.value === (existing?.outcome || outcome));

  return (
    <div
      style={{
        border: existing
          ? `1px solid ${outcomeOption?.color || 'var(--liquid-border)'}30`
          : '1px solid var(--liquid-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: existing
          ? `linear-gradient(135deg, ${outcomeOption?.color || 'var(--bg-card-hover)'}08, transparent)`
          : 'var(--bg-secondary)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '14px 18px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={16} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Decision Outcome</span>
          {existing ? (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '10px',
                background: `${outcomeOption?.color}20`,
                color: outcomeOption?.color,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {existing.outcome.replace('_', ' ')}
            </span>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {daysSinceAnalysis < 7
                ? 'Report when ready'
                : `${daysSinceAnalysis} days since analysis — ready to report?`}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Recalibration result banner — shown after a successful submit */}
      {recalibrationNote && (
        <div
          style={{
            padding: '10px 18px',
            fontSize: '12px',
            borderTop: '1px solid var(--liquid-border)',
            background:
              recalibrationNote.status === 'ok'
                ? 'rgba(22, 163, 74, 0.06)'
                : 'rgba(220, 38, 38, 0.06)',
            color:
              recalibrationNote.status === 'ok'
                ? 'var(--accent-primary)'
                : 'var(--severity-high, #DC2626)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {recalibrationNote.status === 'ok' ? (
            <>
              <TrendingUp size={13} />
              <span>
                DQI recalibrated: {recalibrationNote.recalibratedScore}/100 (
                {recalibrationNote.grade}) {recalibrationNote.delta >= 0 ? '+' : ''}
                {recalibrationNote.delta} vs. original. See the comparison in the Replay tab.
              </span>
            </>
          ) : (
            <span>
              Outcome saved, but DQI recalibration failed. The outcome is still in your history —
              refresh or try again.
            </span>
          )}
        </div>
      )}

      {/* Expanded Form */}
      {expanded && (
        <div
          style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Reporting outcomes improves future analysis accuracy. Your feedback teaches the AI which
            biases were real, which personas were most accurate, and what patterns lead to success
            or failure.
          </p>

          {/* Outcome selection */}
          <div>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              What happened?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {OUTCOME_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = outcome === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setOutcome(opt.value)}
                    style={{
                      padding: '10px 8px',
                      background: isSelected ? `${opt.color}15` : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? opt.color + '50' : 'var(--bg-elevated)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon
                      size={18}
                      style={{ color: isSelected ? opt.color : 'var(--text-muted)' }}
                    />
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? opt.color : 'var(--text-secondary)',
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {outcome && outcome !== 'too_early' && (
            <>
              {/* Timeframe */}
              <div>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Evaluation timeframe
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {TIMEFRAME_OPTIONS.map(tf => (
                    <button
                      key={tf.value}
                      onClick={() => setTimeframe(tf.value)}
                      style={{
                        padding: '4px 12px',
                        fontSize: '11px',
                        background: timeframe === tf.value ? 'var(--bg-card-hover)' : 'transparent',
                        border: `1px solid ${timeframe === tf.value ? 'var(--border-hover)' : 'var(--bg-elevated)'}`,
                        borderRadius: '14px',
                        color: timeframe === tf.value ? 'var(--text-primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: timeframe === tf.value ? 600 : 400,
                      }}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Score */}
              <div>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Actual impact score: {impactScore}/100
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={impactScore}
                  onChange={e => setImpactScore(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              {/* Bias verification */}
              {biases.length > 0 && (
                <div>
                  <label
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Which biases proved real?
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {biases.map(bias => {
                      const isConfirmed = confirmedBiases.includes(bias.biasType);
                      const isFalse = falsPositiveBiases.includes(bias.biasType);
                      return (
                        <div
                          key={bias.biasType}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <span
                            style={{ fontSize: '12px', flex: 1, color: 'var(--text-secondary)' }}
                          >
                            {bias.biasType}
                          </span>
                          <button
                            onClick={() => toggleBias(bias.biasType, 'confirmed')}
                            style={{
                              padding: '2px 8px',
                              fontSize: '10px',
                              background: isConfirmed ? 'rgba(239,68,68,0.15)' : 'transparent',
                              border: `1px solid ${isConfirmed ? 'rgba(239,68,68,0.4)' : 'var(--bg-elevated)'}`,
                              borderRadius: '10px',
                              color: isConfirmed ? '#f87171' : 'var(--text-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            Real
                          </button>
                          <button
                            onClick={() => toggleBias(bias.biasType, 'falsePositive')}
                            style={{
                              padding: '2px 8px',
                              fontSize: '10px',
                              background: isFalse ? 'rgba(34,197,94,0.15)' : 'transparent',
                              border: `1px solid ${isFalse ? 'rgba(34,197,94,0.4)' : 'var(--bg-elevated)'}`,
                              borderRadius: '10px',
                              color: isFalse ? '#4ade80' : 'var(--text-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            False +
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Most accurate twin */}
              {twins && twins.length > 0 && (
                <div>
                  <label
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Which persona was most accurate?
                  </label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {twins.map(twin => (
                      <button
                        key={twin.name}
                        onClick={() =>
                          setMostAccurateTwin(twin.name === mostAccurateTwin ? '' : twin.name)
                        }
                        style={{
                          padding: '4px 12px',
                          fontSize: '11px',
                          background:
                            mostAccurateTwin === twin.name ? 'var(--bg-card-hover)' : 'transparent',
                          border: `1px solid ${mostAccurateTwin === twin.name ? 'var(--border-hover)' : 'var(--bg-elevated)'}`,
                          borderRadius: '14px',
                          color:
                            mostAccurateTwin === twin.name
                              ? 'var(--text-primary)'
                              : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontWeight: mostAccurateTwin === twin.name ? 600 : 400,
                        }}
                      >
                        {twin.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes & Lessons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    What happened?
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Brief description of the outcome..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--bg-elevated)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      resize: 'vertical',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Lessons learned
                  </label>
                  <textarea
                    value={lessonsLearned}
                    onChange={e => setLessonsLearned(e.target.value)}
                    placeholder="Key takeaways for future decisions..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--bg-elevated)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit */}
          {outcome && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 20px',
                background: 'var(--accent-primary)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {existing ? 'Update Outcome' : 'Submit Outcome'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
