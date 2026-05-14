'use client';

/**
 * PmiTrackerTab — post-close PMI signal tracker (Path B + thin Path C,
 * locked 2026-05-10).
 *
 * Architecture: PMI is the TARGET of the audit, not a new product
 * domain. This tab closes the audit loop by:
 *   1. Capturing the IC memo's predicted PMI metrics (synergy realisation,
 *      talent retention, integration cost vs forecast, etc.)
 *   2. Observing actuals as they land (90/180/365 day horizons)
 *   3. Computing per-signal Brier scores so the per-org calibration
 *      feedback loop incorporates PMI ground truth
 *
 * Mounted on /dashboard/decisions/[id] when container.kind ===
 * 'acquisition'. Renders empty-state when no signals captured. Does NOT
 * compete with M&A Worx / Midaxo on integration project management —
 * no assignees, no Gantt, no task tracking. Just claim → predicted →
 * observed → Brier.
 *
 * Paper anchor: Ch 7 (PMI is where value destruction fires) + Ch 11
 * (ex-post scorecards devolve into rationalization theatre absent
 * automatic comparison — we make the comparison rule-based + Brier-
 * scored).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccentCard } from '@/components/ui/AccentCard';
import {
  TrendingUp,
  Target,
  Loader2,
  Plus,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Sparkles,
  X,
} from 'lucide-react';

type PmiSignalKey =
  | 'synergy_realisation_pct'
  | 'talent_retention_pct'
  | 'integration_cost_vs_forecast'
  | 'day_one_milestone_hit_rate'
  | 'customer_retention_pct'
  | 'revenue_growth_vs_forecast';

const SIGNAL_LABELS: Record<PmiSignalKey, string> = {
  synergy_realisation_pct: 'Synergy realisation',
  talent_retention_pct: 'Key-talent retention',
  integration_cost_vs_forecast: 'Integration cost vs forecast',
  day_one_milestone_hit_rate: 'Day-1 milestone hit rate',
  customer_retention_pct: 'Customer retention',
  revenue_growth_vs_forecast: 'Revenue growth vs forecast',
};

const SIGNAL_PROXY_HINTS: Record<PmiSignalKey, string> = {
  synergy_realisation_pct: '% of projected synergies achieved by horizon',
  talent_retention_pct: '% of identified key talent retained at horizon',
  integration_cost_vs_forecast: '1.0 = on forecast; < 1.0 means under-spent (good)',
  day_one_milestone_hit_rate: '% of day-1 integration milestones hit by 90d',
  customer_retention_pct: '% of acquired customer base retained at horizon',
  revenue_growth_vs_forecast: '1.0 = on forecast; > 1.0 means beat forecast (good)',
};

interface PmiSignal {
  key: PmiSignalKey;
  proxy: string;
  horizonDays: 90 | 180 | 365;
  predictedConfidence: number;
  observedValue?: number;
  observedAt?: string;
  brierScore?: number;
  resolution?: 'hit' | 'miss' | 'partial' | 'unmeasured';
}

interface PmiSignalsBlob {
  signals: PmiSignal[];
  capturedAt: string;
  capturedByUserId: string;
  lastUpdatedAt?: string;
}

/**
 * Suggestion shape returned by /api/decisions/[id]/pmi-signals/extract.
 * Mirrors ExtractedPmiSignal in src/lib/pmi/extract-from-memo.ts —
 * intentionally duplicated here as a client-side type so the tab can
 * compile without a server-only import. When the extract schema
 * evolves, update both surfaces in lockstep.
 */
interface ExtractedSignalSuggestion {
  key: PmiSignalKey;
  quote: string;
  proxy: string;
  horizonDays: 90 | 180 | 365;
  predictedConfidence: number;
  rationale: string;
}

interface ExtractResponse {
  containerId: string;
  sourceDocument?: {
    id: string;
    filename: string;
    documentType: string | null;
  };
  signals: ExtractedSignalSuggestion[];
  llmSucceeded: boolean;
  contentChars: number;
}

const RESOLUTION_COLORS: Record<NonNullable<PmiSignal['resolution']>, string> = {
  hit: 'var(--success)',
  partial: 'var(--warning)',
  miss: 'var(--error)',
  unmeasured: 'var(--text-muted)',
};

const RESOLUTION_LABELS: Record<NonNullable<PmiSignal['resolution']>, string> = {
  hit: 'Hit',
  partial: 'Partial',
  miss: 'Miss',
  unmeasured: 'Unmeasured',
};

export interface PmiTrackerTabProps {
  containerId: string;
  containerName: string;
}

export function PmiTrackerTab({ containerId, containerName }: PmiTrackerTabProps) {
  const [blob, setBlob] = useState<PmiSignalsBlob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draftKey, setDraftKey] = useState<PmiSignalKey>('synergy_realisation_pct');
  const [draftProxy, setDraftProxy] = useState('');
  const [draftHorizon, setDraftHorizon] = useState<90 | 180 | 365>(180);
  const [draftConfidence, setDraftConfidence] = useState(0.7);
  const [busyKey, setBusyKey] = useState<PmiSignalKey | null>(null);

  // M-3 (locked 2026-05-13) — auto-extract suggestion state. Suggestions
  // never persist directly; the user accepts each via the canonical
  // POST /pmi-signals path so the audit log + Brier flow stay intact.
  const [extracting, setExtracting] = useState(false);
  const [suggestions, setSuggestions] = useState<ExtractedSignalSuggestion[] | null>(null);
  const [extractSource, setExtractSource] = useState<ExtractResponse['sourceDocument'] | null>(
    null
  );
  const [acceptingKey, setAcceptingKey] = useState<PmiSignalKey | null>(null);

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch(`/api/decisions/${containerId}/pmi-signals`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to load PMI signals');
      }
      const data = (await res.json()) as { pmiSignals: PmiSignalsBlob | null };
      setBlob(data.pmiSignals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [containerId]);

  useEffect(() => {
    void fetchSignals();
  }, [fetchSignals]);

  const addSignal = async () => {
    if (!draftProxy.trim()) {
      setError('Proxy required (the IC memo claim being tracked)');
      return;
    }
    setError(null);
    setAdding(true);
    try {
      const res = await fetch(`/api/decisions/${containerId}/pmi-signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          signal: {
            key: draftKey,
            proxy: draftProxy.trim(),
            horizonDays: draftHorizon,
            predictedConfidence: draftConfidence,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to add signal');
      }
      const data = (await res.json()) as { pmiSignals: PmiSignalsBlob };
      setBlob(data.pmiSignals);
      setDraftProxy('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add signal');
    } finally {
      setAdding(false);
    }
  };

  const runExtraction = async () => {
    setExtracting(true);
    setError(null);
    setSuggestions(null);
    setExtractSource(null);
    try {
      const res = await fetch(`/api/decisions/${containerId}/pmi-signals/extract`, {
        method: 'POST',
        credentials: 'include',
      });
      const body = (await res.json().catch(() => null)) as ExtractResponse | { error?: string } | null;
      if (!res.ok) {
        const errMsg =
          body && 'error' in body && typeof body.error === 'string'
            ? body.error
            : 'Extraction failed';
        throw new Error(errMsg);
      }
      const data = body as ExtractResponse;
      setSuggestions(data.signals);
      setExtractSource(data.sourceDocument ?? null);
      if (data.signals.length === 0 && data.llmSucceeded) {
        // LLM ran but found no committed PMI metrics — surface this
        // honestly so the user knows manual entry is needed (and that
        // their memo may need more concrete commitments).
        setError(
          'No concrete PMI commitments found in the memo. Add signals manually below.'
        );
      } else if (data.signals.length === 0 && !data.llmSucceeded) {
        // Gateway error or parse failure — fall back to manual.
        setError('Auto-extraction unavailable right now. Add signals manually below.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const acceptSuggestion = async (suggestion: ExtractedSignalSuggestion) => {
    setAcceptingKey(suggestion.key);
    setError(null);
    try {
      const res = await fetch(`/api/decisions/${containerId}/pmi-signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          signal: {
            key: suggestion.key,
            proxy: suggestion.proxy,
            horizonDays: suggestion.horizonDays,
            predictedConfidence: suggestion.predictedConfidence,
          },
        }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errBody?.error ?? 'Failed to accept suggestion');
      }
      const data = (await res.json()) as { pmiSignals: PmiSignalsBlob };
      setBlob(data.pmiSignals);
      // Drop the accepted suggestion from the preview list. Other
      // suggestions remain so the user can review them one at a time.
      setSuggestions(prev => (prev ? prev.filter(s => s.key !== suggestion.key) : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept suggestion');
    } finally {
      setAcceptingKey(null);
    }
  };

  const dismissSuggestion = (key: PmiSignalKey) => {
    setSuggestions(prev => (prev ? prev.filter(s => s.key !== key) : null));
  };

  const dismissAllSuggestions = () => {
    setSuggestions(null);
    setExtractSource(null);
  };

  const editSuggestionIntoDraft = (suggestion: ExtractedSignalSuggestion) => {
    setDraftKey(suggestion.key);
    setDraftProxy(suggestion.proxy);
    setDraftHorizon(suggestion.horizonDays);
    setDraftConfidence(suggestion.predictedConfidence);
    // Drop from preview; the draft form is now editable for this signal.
    setSuggestions(prev => (prev ? prev.filter(s => s.key !== suggestion.key) : null));
  };

  const observe = async (key: PmiSignalKey, observedValue: number) => {
    setBusyKey(key);
    setError(null);
    try {
      const res = await fetch(`/api/decisions/${containerId}/pmi-signals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key, observedValue }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to record observation');
      }
      const data = (await res.json()) as { pmiSignals: PmiSignalsBlob };
      setBlob(data.pmiSignals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record observation');
    } finally {
      setBusyKey(null);
    }
  };

  const aggregate = useMemo(() => {
    if (!blob) return null;
    const measured = blob.signals.filter(s => s.brierScore !== undefined);
    if (measured.length === 0) return null;
    const meanBrier = measured.reduce((acc, s) => acc + (s.brierScore ?? 0), 0) / measured.length;
    const hits = measured.filter(s => s.resolution === 'hit').length;
    const misses = measured.filter(s => s.resolution === 'miss').length;
    return {
      meanBrier: Math.round(meanBrier * 1000) / 1000,
      measuredCount: measured.length,
      totalCount: blob.signals.length,
      hits,
      misses,
    };
  }, [blob]);

  return (
    <AccentCard
      accent="info"
      title={
        <>
          <TrendingUp size={16} style={{ color: 'var(--info)' }} />
          <span>PMI Tracker — closing the audit loop</span>
        </>
      }
    >
      <p
        style={{
          margin: '0 0 16px',
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        Track the PMI metrics the IC memo committed to. Each signal compares the memo&rsquo;s
        predicted confidence against the observed actual at horizon, feeding the per-org Brier
        calibration. Per paper Ch 11: ex-post scorecards devolve into rationalisation theatre absent
        automatic comparison &mdash; we make the comparison rule-based + Brier- scored so{' '}
        {containerName} delivers what was promised, or doesn&rsquo;t, on the record.
      </p>

      {/* Aggregate summary */}
      {aggregate && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '10px 12px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 16,
            flexWrap: 'wrap',
            fontSize: 'var(--fs-xs)',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {aggregate.measuredCount}/{aggregate.totalCount} measured
          </span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
            {aggregate.hits} hit{aggregate.hits !== 1 ? 's' : ''}
          </span>
          <span style={{ color: 'var(--error)', fontWeight: 600 }}>
            {aggregate.misses} miss{aggregate.misses !== 1 ? 'es' : ''}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            Mean Brier:{' '}
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
              {aggregate.meanBrier.toFixed(3)}
            </span>
          </span>
        </div>
      )}

      {loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--text-muted)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          <Loader2 size={14} className="animate-spin" /> Loading PMI signals…
        </div>
      )}

      {/* Existing signals */}
      {!loading && blob && blob.signals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {blob.signals.map(signal => {
            const isBusy = busyKey === signal.key;
            const band = signal.resolution ?? 'unmeasured';
            const color = RESOLUTION_COLORS[band];
            return (
              <div
                key={signal.key}
                style={{
                  padding: '12px',
                  border: `1px solid var(--border-color)`,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    marginBottom: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  <Target size={14} style={{ color, flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 'var(--fs-sm)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {SIGNAL_LABELS[signal.key]}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--fs-2xs)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: `color-mix(in srgb, ${color} 12%, transparent)`,
                      color,
                      fontWeight: 600,
                    }}
                  >
                    {RESOLUTION_LABELS[band]}
                  </span>
                  <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                    {signal.horizonDays}d horizon
                  </span>
                </div>
                <p
                  style={{
                    margin: '0 0 8px',
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  IC memo claim: &ldquo;{signal.proxy}&rdquo;
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    fontSize: 'var(--fs-2xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>
                    Predicted:{' '}
                    <strong style={{ color: 'var(--text-secondary)' }}>
                      {(signal.predictedConfidence * 100).toFixed(0)}%
                    </strong>
                  </span>
                  {signal.observedValue !== undefined ? (
                    <>
                      <span>·</span>
                      <span>
                        Observed:{' '}
                        <strong style={{ color: 'var(--text-secondary)' }}>
                          {(signal.observedValue * 100).toFixed(0)}%
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Brier:{' '}
                        <strong
                          style={{
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono, monospace)',
                          }}
                        >
                          {(signal.brierScore ?? 0).toFixed(3)}
                        </strong>
                      </span>
                    </>
                  ) : (
                    <ObserveControl
                      disabled={isBusy}
                      onObserve={v => void observe(signal.key, v)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-extract from IC memo (M-3, locked 2026-05-13) */}
      <div
        style={{
          padding: '12px',
          marginBottom: 12,
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: suggestions || extracting ? 12 : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto' }}>
            <Sparkles size={14} style={{ color: 'var(--accent-secondary, #6366f1)' }} />
            <div>
              <div
                style={{
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 2,
                }}
              >
                Auto-extract PMI signals from IC memo
              </div>
              <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                Reads the latest analyzed IC memo / synergy model / integration plan and
                proposes signals to track. Every suggestion needs your accept &mdash; nothing
                persists until you confirm.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void runExtraction()}
            disabled={extracting}
            style={{
              padding: '6px 12px',
              background: extracting ? 'var(--bg-elevated)' : 'transparent',
              border: '1px solid var(--accent-secondary, #6366f1)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              color: extracting ? 'var(--text-muted)' : 'var(--accent-secondary, #6366f1)',
              cursor: extracting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            {extracting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Extracting&hellip;
              </>
            ) : (
              <>
                <Sparkles size={12} />
                {suggestions ? 'Re-extract' : 'Extract from memo'}
              </>
            )}
          </button>
        </div>

        {suggestions && suggestions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontSize: 'var(--fs-2xs)',
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span>
                {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'}
                {extractSource?.filename ? ` from ${extractSource.filename}` : ''}
                {' · review each before persisting'}
              </span>
              <button
                type="button"
                onClick={dismissAllSuggestions}
                style={{
                  padding: '2px 6px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: 'var(--fs-2xs)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Dismiss all
              </button>
            </div>
            {suggestions.map(suggestion => {
              const isAccepting = acceptingKey === suggestion.key;
              return (
                <div
                  key={suggestion.key}
                  style={{
                    padding: 10,
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    borderLeft: '3px solid var(--accent-secondary, #6366f1)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      marginBottom: 4,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {SIGNAL_LABELS[suggestion.key]}
                    </span>
                    <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                      {suggestion.horizonDays}d &middot;{' '}
                      {(suggestion.predictedConfidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{suggestion.quote}&rdquo;
                  </p>
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: 'var(--fs-2xs)',
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    {suggestion.rationale}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => void acceptSuggestion(suggestion)}
                      disabled={isAccepting || acceptingKey !== null}
                      style={{
                        padding: '4px 10px',
                        background:
                          isAccepting || acceptingKey !== null
                            ? 'var(--bg-elevated)'
                            : 'var(--accent-primary)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--fs-2xs)',
                        fontWeight: 600,
                        color:
                          isAccepting || acceptingKey !== null ? 'var(--text-muted)' : '#fff',
                        cursor: isAccepting || acceptingKey !== null ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {isAccepting ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <CheckCircle size={10} />
                      )}
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => editSuggestionIntoDraft(suggestion)}
                      disabled={acceptingKey !== null}
                      style={{
                        padding: '4px 10px',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--fs-2xs)',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        cursor: acceptingKey !== null ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissSuggestion(suggestion.key)}
                      disabled={acceptingKey !== null}
                      style={{
                        padding: '4px 10px',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--fs-2xs)',
                        color: 'var(--text-muted)',
                        cursor: acceptingKey !== null ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <X size={10} />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add-signal form */}
      <div
        style={{
          padding: '12px',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          <Lightbulb size={12} /> Add PMI signal to track
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select
            value={draftKey}
            onChange={e => setDraftKey(e.target.value as PmiSignalKey)}
            style={{
              padding: '6px 10px',
              fontSize: 'var(--fs-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
          >
            {(Object.keys(SIGNAL_LABELS) as PmiSignalKey[]).map(k => (
              <option key={k} value={k}>
                {SIGNAL_LABELS[k]}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={draftProxy}
            onChange={e => setDraftProxy(e.target.value.slice(0, 240))}
            placeholder={`Verbatim claim from IC memo (${SIGNAL_PROXY_HINTS[draftKey]})`}
            style={{
              padding: '6px 10px',
              fontSize: 'var(--fs-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
            }}
          />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
              Horizon:
              <select
                value={draftHorizon}
                onChange={e => setDraftHorizon(Number(e.target.value) as 90 | 180 | 365)}
                style={{
                  marginLeft: 6,
                  padding: '2px 6px',
                  fontSize: 'var(--fs-xs)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>365 days</option>
              </select>
            </label>
            <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
              IC memo confidence:
              <input
                type="range"
                min="0.1"
                max="0.99"
                step="0.05"
                value={draftConfidence}
                onChange={e => setDraftConfidence(Number(e.target.value))}
                style={{ marginLeft: 6, verticalAlign: 'middle' }}
              />
              <span style={{ marginLeft: 6, color: 'var(--text-secondary)' }}>
                {(draftConfidence * 100).toFixed(0)}%
              </span>
            </label>
          </div>
          <button
            type="button"
            onClick={addSignal}
            disabled={adding || !draftProxy.trim()}
            style={{
              padding: '8px 14px',
              background:
                adding || !draftProxy.trim() ? 'var(--bg-elevated)' : 'var(--accent-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              color: adding || !draftProxy.trim() ? 'var(--text-muted)' : '#fff',
              cursor: adding || !draftProxy.trim() ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-start',
            }}
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Track signal
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            margin: '12px 0 0',
            fontSize: 'var(--fs-xs)',
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {!loading && (!blob || blob.signals.length === 0) && (
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          No PMI signals tracked yet. Add the first claim from the IC memo above — typically synergy
          realisation, key-talent retention, integration cost vs forecast, or day-1 milestone hit
          rate.
        </p>
      )}
    </AccentCard>
  );
}

function ObserveControl({
  disabled,
  onObserve,
}: {
  disabled: boolean;
  onObserve: (value: number) => void;
}) {
  const [value, setValue] = useState<number>(0.5);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        style={{
          padding: '4px 10px',
          background: 'var(--accent-primary)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--fs-2xs)',
          fontWeight: 600,
          color: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <CheckCircle size={11} />
        Record observation
      </button>
    );
  }

  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <input
        type="number"
        step="0.05"
        min="0"
        max="2"
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        style={{
          width: 64,
          padding: '2px 6px',
          fontSize: 'var(--fs-2xs)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
        }}
      />
      <button
        type="button"
        onClick={() => onObserve(value)}
        disabled={disabled}
        style={{
          padding: '2px 8px',
          background: 'var(--accent-primary)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--fs-2xs)',
          fontWeight: 600,
          color: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{
          padding: '2px 8px',
          background: 'transparent',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--fs-2xs)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
    </span>
  );
}
