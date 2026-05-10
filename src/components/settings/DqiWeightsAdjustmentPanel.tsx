'use client';

/**
 * DqiWeightsAdjustmentPanel — user-adjustable DQI weight sliders.
 *
 * Locked 2026-05-10 per Tier 2.1 + Deep Research paper #2 Ch 4 +
 * Dietvorst 2016 follow-up to the 2015 Algorithm Aversion finding.
 *
 * The wedge customer (Kyle-Price-class programmatic operators) rejects
 * "false precision" structured scorecards. Dietvorst 2016 showed people
 * will use imperfect algorithms IF allowed to slightly modify the inputs
 * or weights. This panel is the literature's documented fix surfaced as
 * a calibration UI — sliders auto-rebalance to preserve sum-to-1.0, the
 * canonical baseline stays visible alongside the adjusted vector, and a
 * warning band fires (without blocking) when shifts cross 0.05 / 0.15.
 *
 * Per-component metadata uses the same labels as DqiBreakdownPanel so a
 * user adjusting Bias Load here recognises Bias Load when they later
 * read a DPR cover.
 */

import { useEffect, useMemo, useState } from 'react';
import { AccentCard } from '@/components/ui/AccentCard';
import { Sliders, RotateCcw, CheckCircle, Loader2, AlertTriangle, Info } from 'lucide-react';

type ComponentId =
  | 'biasLoad'
  | 'noiseLevel'
  | 'evidenceQuality'
  | 'processMaturity'
  | 'complianceRisk'
  | 'historicalAlignment'
  | 'compoundRisk';

type WeightVector = Record<ComponentId, number>;

const COMPONENT_ORDER: ComponentId[] = [
  'biasLoad',
  'noiseLevel',
  'evidenceQuality',
  'processMaturity',
  'complianceRisk',
  'historicalAlignment',
  'compoundRisk',
];

const COMPONENT_LABELS: Record<ComponentId, string> = {
  biasLoad: 'Cognitive biases detected',
  noiseLevel: 'Reasoning consistency',
  evidenceQuality: 'Evidence verification',
  processMaturity: 'Decision process',
  complianceRisk: 'Regulatory exposure',
  historicalAlignment: 'Historical pattern match',
  compoundRisk: 'Compound failure patterns',
};

const COMPONENT_HINTS: Record<ComponentId, string> = {
  biasLoad: 'Severity-weighted count of bias flags. Higher weight = bias detection counts more.',
  noiseLevel:
    'Disagreement spread across the 3-frame jury. Higher weight = jury variance counts more.',
  evidenceQuality: 'Fact-check verification rate. Higher weight = evidence rigor counts more.',
  processMaturity:
    'Dissent captured, priors recorded, outcomes tracked. Higher weight = decision-hygiene counts more.',
  complianceRisk:
    'Regulatory framework violations. Higher weight = procurement exposure counts more.',
  historicalAlignment:
    'Match against the 143-case reference-class library. Higher weight = past patterns count more.',
  compoundRisk:
    'Named toxic combinations (Synergy Mirage, etc.). Higher weight = pattern flags count more.',
};

interface ApiActiveResponse {
  active: {
    weights: WeightVector;
    source: 'canonical' | 'user' | 'org';
    override: { weightsHash: string; methodologyVersion: string; setAt: string } | null;
  };
  canonical: WeightVector;
  componentIds: ComponentId[];
  delta: Record<ComponentId, number>;
  maxDelta: number;
  warningBand: 'none' | 'mild' | 'material' | 'severe';
  methodologyVersion: string;
}

const WARNING_COLORS: Record<ApiActiveResponse['warningBand'], string> = {
  none: 'var(--text-muted)',
  mild: 'var(--info)',
  material: 'var(--warning)',
  severe: 'var(--error)',
};

const WARNING_LABELS: Record<ApiActiveResponse['warningBand'], string> = {
  none: 'Canonical baseline',
  mild: 'Slight shift from canonical',
  material: 'Material shift from canonical',
  severe: 'Heavy shift from canonical',
};

function deltaBand(delta: number): 'none' | 'mild' | 'material' | 'severe' {
  const a = Math.abs(delta);
  if (a < 1e-4) return 'none';
  if (a <= 0.05) return 'mild';
  if (a <= 0.15) return 'material';
  return 'severe';
}

function sumWeights(w: WeightVector): number {
  return COMPONENT_ORDER.reduce((acc, k) => acc + w[k], 0);
}

/**
 * Auto-rebalance: when the user shifts slider `target` to `next`, the
 * delta (next - prev) is distributed PROPORTIONALLY across the other
 * components, weighted by their current values. This preserves their
 * relative ratios. If the others sum to 0 the rebalance collapses to
 * equal-share to avoid div-by-zero.
 */
function rebalance(current: WeightVector, target: ComponentId, next: number): WeightVector {
  const clampedNext = Math.max(0, Math.min(1, next));
  const result = { ...current };
  result[target] = clampedNext;

  const otherKeys = COMPONENT_ORDER.filter(k => k !== target);
  const remainingBudget = 1 - clampedNext;
  const othersSum = otherKeys.reduce((acc, k) => acc + current[k], 0);

  if (othersSum < 1e-6) {
    // Edge case — distribute equally across others
    for (const k of otherKeys) {
      result[k] = remainingBudget / otherKeys.length;
    }
  } else {
    for (const k of otherKeys) {
      result[k] = (current[k] / othersSum) * remainingBudget;
    }
  }

  // Snap to exact sum = 1.0 by absorbing residual into target.
  const total = sumWeights(result);
  if (Math.abs(total - 1.0) > 1e-9) {
    result[target] += 1.0 - total;
  }

  return result;
}

export function DqiWeightsAdjustmentPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Server-resolved active weights (the truth as of last fetch).
  const [serverState, setServerState] = useState<ApiActiveResponse | null>(null);
  // Client draft — what the user is currently adjusting. Diverges from
  // serverState during drag, snaps back on save.
  const [draft, setDraft] = useState<WeightVector | null>(null);

  // Initial fetch.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/dqi/weights', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load weights');
        const data = (await res.json()) as ApiActiveResponse;
        if (cancelled) return;
        setServerState(data);
        setDraft(data.active.weights);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load weights');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const draftDelta = useMemo(() => {
    if (!draft || !serverState) return null;
    const delta = {} as Record<ComponentId, number>;
    for (const k of COMPONENT_ORDER) {
      delta[k] = draft[k] - serverState.canonical[k];
    }
    return delta;
  }, [draft, serverState]);

  const draftMaxDelta = useMemo(() => {
    if (!draftDelta) return 0;
    return Math.max(...COMPONENT_ORDER.map(k => Math.abs(draftDelta[k])));
  }, [draftDelta]);

  const draftWarningBand = useMemo(() => deltaBand(draftMaxDelta), [draftMaxDelta]);

  const dirty = useMemo(() => {
    if (!draft || !serverState) return false;
    return COMPONENT_ORDER.some(k => Math.abs(draft[k] - serverState.active.weights[k]) > 1e-6);
  }, [draft, serverState]);

  const handleSlider = (key: ComponentId, next: number) => {
    if (!draft) return;
    setDraft(rebalance(draft, key, next));
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/dqi/weights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ weights: draft }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to save weights');
      }
      // Re-fetch so server state mirrors the new override + source label.
      const refetch = await fetch('/api/dqi/weights', { credentials: 'include' });
      if (refetch.ok) {
        const data = (await refetch.json()) as ApiActiveResponse;
        setServerState(data);
        setDraft(data.active.weights);
      }
      setSaveMessage('Weights saved. Future audits will use this calibration.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save weights');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (resetting) return;
    setResetting(true);
    setError(null);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/dqi/weights', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to reset weights');
      const refetch = await fetch('/api/dqi/weights', { credentials: 'include' });
      if (refetch.ok) {
        const data = (await refetch.json()) as ApiActiveResponse;
        setServerState(data);
        setDraft(data.active.weights);
      }
      setSaveMessage('Reset to canonical baseline.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset weights');
    } finally {
      setResetting(false);
    }
  };

  return (
    <AccentCard
      accent="warning"
      title={
        <>
          <Sliders size={16} style={{ color: 'var(--warning)' }} />
          <span>DQI Weight Calibration</span>
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
        Adjust how much each component contributes to your DQI score. The canonical baseline
        (Dietvorst 2016: people use imperfect algorithms when they can adjust them) stays visible
        alongside your edits — every audit run under custom weights stamps methodology 2.3.0 + the
        weight-vector hash on the DPR cover for procurement-grade provenance.
      </p>

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
          <Loader2 size={14} className="animate-spin" /> Loading current calibration…
        </div>
      )}

      {!loading && serverState && draft && (
        <>
          {/* Header strip — current source + methodology version */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              marginBottom: 16,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-xs)',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: WARNING_COLORS[draftWarningBand],
              }}
            >
              {WARNING_LABELS[draftWarningBand]}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--text-muted)' }}>
              Methodology {serverState.methodologyVersion}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--text-muted)' }}>
              Source:{' '}
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {serverState.active.source === 'canonical'
                  ? 'canonical baseline'
                  : serverState.active.source === 'org'
                    ? 'org override'
                    : 'user override'}
              </span>
            </span>
            {serverState.active.override && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  hash {serverState.active.override.weightsHash}
                </span>
              </>
            )}
          </div>

          {/* Warning band callout */}
          {draftWarningBand === 'material' || draftWarningBand === 'severe' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 12px',
                marginBottom: 16,
                background: `color-mix(in srgb, ${WARNING_COLORS[draftWarningBand]} 8%, transparent)`,
                border: `1px solid ${WARNING_COLORS[draftWarningBand]}`,
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <AlertTriangle
                size={14}
                style={{ color: WARNING_COLORS[draftWarningBand], marginTop: 2, flexShrink: 0 }}
              />
              <span>
                You&rsquo;ve shifted weights <strong>±{draftMaxDelta.toFixed(2)}</strong> from
                canonical. Per-org Brier calibration starts to diverge from the platform-wide
                143-case corpus baseline at this magnitude. Use this when your domain has
                structurally different priors (e.g. low-validity frontier VC, repeat-game tuck-ins)
                — not as a blanket score adjustment.
              </span>
            </div>
          ) : null}

          {/* Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {COMPONENT_ORDER.map(k => {
              const v = draft[k];
              const canon = serverState.canonical[k];
              const d = v - canon;
              const band = deltaBand(d);
              return (
                <div key={k}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        flex: 1,
                      }}
                    >
                      {COMPONENT_LABELS[k]}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontFamily: 'var(--font-mono, monospace)',
                        color: 'var(--text-primary)',
                        minWidth: 48,
                        textAlign: 'right',
                      }}
                    >
                      {(v * 100).toFixed(1)}%
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--fs-2xs)',
                        fontFamily: 'var(--font-mono, monospace)',
                        color: WARNING_COLORS[band],
                        minWidth: 56,
                        textAlign: 'right',
                      }}
                    >
                      {d === 0 ? '±0.00' : `${d > 0 ? '+' : ''}${(d * 100).toFixed(1)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.005"
                    value={v}
                    onChange={e => handleSlider(k, Number(e.target.value))}
                    style={{
                      width: '100%',
                      cursor: 'pointer',
                    }}
                  />
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 'var(--fs-2xs)',
                      color: 'var(--text-muted)',
                      lineHeight: 1.4,
                    }}
                  >
                    Canonical {(canon * 100).toFixed(1)}%. {COMPONENT_HINTS[k]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sum-to-1 verify line (defensive — should always be 1.000) */}
          <div
            style={{
              marginTop: 16,
              padding: '8px 10px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--fs-2xs)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            Σ {sumWeights(draft).toFixed(4)} (must be 1.0000 — auto-rebalanced on every change)
          </div>

          {/* Status + actions */}
          {error && (
            <p
              role="alert"
              style={{
                margin: '12px 0 0',
                fontSize: 'var(--fs-xs)',
                color: 'var(--error)',
              }}
            >
              {error}
            </p>
          )}
          {saveMessage && !error && (
            <p
              style={{
                margin: '12px 0 0',
                fontSize: 'var(--fs-xs)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CheckCircle size={12} /> {saveMessage}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              marginTop: 16,
              flexWrap: 'wrap',
            }}
          >
            {serverState.active.source !== 'canonical' && (
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting || saving}
                style={{
                  padding: '8px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  cursor: resetting || saving ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {resetting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RotateCcw size={14} />
                )}
                Reset to canonical
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              style={{
                padding: '8px 16px',
                background: !dirty || saving ? 'var(--bg-elevated)' : 'var(--accent-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                color: !dirty || saving ? 'var(--text-muted)' : '#fff',
                cursor: !dirty || saving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {dirty ? 'Save calibration' : 'No changes'}
            </button>
          </div>

          {/* Educational footer */}
          <div
            style={{
              marginTop: 16,
              padding: '10px 12px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--fs-2xs)',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
            }}
          >
            <Info size={12} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>
              Per Dietvorst, Simmons &amp; Massey 2015 (J. Exp. Psychol. General,
              doi:10.1037/xge0000033): people erroneously avoid algorithms after seeing them err.
              The 2016 follow-up shows they&rsquo;ll use the same algorithm again if allowed to
              slightly modify it. The fix is not to defend canonical weights as perfect — it&rsquo;s
              to give you the steering wheel.
            </span>
          </div>
        </>
      )}
    </AccentCard>
  );
}
