'use client';

/**
 * OperationalProxyResolutionCard — Defensibility Vector 1 surface
 * (locked 2026-05-17).
 *
 * The full forced-at-vote 90-day-proxy loop on the decision-detail
 * page, for ALL container kinds once a decision exists (analyzed
 * docs). Three states, mirroring the V2 PremortemDefenceCaptureCard
 * shape:
 *
 *  - CAPTURE  (warning): no falsifiable ≤90-day proxy on record →
 *    the outcome is gated; record one here. Posts to the existing
 *    priors append endpoint (the 2026-05-10 mechanism, unchanged).
 *  - RESOLVE  (warning): proxies came due → record what actually
 *    happened; each resolution Brier-scores the prediction.
 *  - ON RECORD (success): all proxies resolved → read-only, the
 *    embedded calibration record a wrapper cannot reconstruct.
 *
 * Gate/Brier logic lives in @/lib/containers/operational-proxy-gate
 * and is shared verbatim with the server hard-gate + the day-90 cron.
 */

import { useMemo, useState } from 'react';
import { AccentCard } from '@/components/ui/AccentCard';
import { Target, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import {
  parsePriorsForProxies,
  isFalsifiable90DayProxy,
  isProxyDue,
  proxyDueAtMs,
  MIN_PROXY_PREDICTION_CHARS,
} from '@/lib/containers/operational-proxy-gate';

type Conviction = 'low' | 'medium' | 'high' | 'very_high';

export interface OperationalProxyResolutionCardProps {
  containerId: string;
  analyzedDocCount: number;
  /** DecisionContainer.priors JSON (unknown — parsed defensively). */
  priors: unknown;
  onSaved: () => void;
}

const HORIZONS = [30, 60, 90] as const;
const DAY_MS = 86_400_000;

export function OperationalProxyResolutionCard({
  containerId,
  analyzedDocCount,
  priors,
  onSaved,
}: OperationalProxyResolutionCardProps) {
  const parsed = useMemo(() => parsePriorsForProxies(priors), [priors]);
  const hasSnapshot = useMemo(
    () =>
      !!priors &&
      typeof priors === 'object' &&
      'convictionLevel' in (priors as Record<string, unknown>),
    [priors]
  );
  const nowMs = useState(() => Date.now())[0];

  const [prediction, setPrediction] = useState('');
  const [horizon, setHorizon] = useState<number>(90);
  const [confidence, setConfidence] = useState(0.6);
  const [conviction, setConviction] = useState<Conviction>('medium');
  const [convictionRationale, setConvictionRationale] = useState('');
  const [busy, setBusy] = useState(false);
  const [resolvingIdx, setResolvingIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Gate fires only when a decision exists. Empty containers: nothing.
  if (analyzedDocCount === 0) return null;

  const proxies = parsed?.microPredictions ?? [];
  const hasFalsifiable = proxies.some(isFalsifiable90DayProxy);
  const capturedAt = parsed?.capturedAt ?? null;
  const dueIdx = proxies
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => isProxyDue(p, capturedAt, nowMs))
    .map(({ i }) => i);
  const allResolved = proxies.length > 0 && proxies.every(p => p.resolvedAt);

  const captureProxy = async () => {
    if (prediction.trim().length < MIN_PROXY_PREDICTION_CHARS) {
      setError(
        `The proxy must be a substantive, falsifiable prediction (≥ ${MIN_PROXY_PREDICTION_CHARS} characters).`
      );
      return;
    }
    if (!hasSnapshot && convictionRationale.trim().length === 0) {
      setError('A one-line conviction rationale is required for the first priors capture.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // The 2026-05-10 priors POST appends microPredictions; when a
      // snapshot already exists the merge preserves the original
      // conviction (we resend it untouched — never fabricate one).
      const existing = hasSnapshot ? (priors as Record<string, unknown>) : null;
      const res = await fetch(`/api/decisions/${containerId}/priors`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          convictionLevel: existing?.convictionLevel ?? conviction,
          convictionRationale:
            (existing?.convictionRationale as string | undefined) ?? convictionRationale.trim(),
          microPredictions: [{ prediction: prediction.trim(), horizonDays: horizon, confidence }],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null); // canonical body-parse exception
        throw new Error(body?.error ?? 'Failed to record the proxy');
      }
      setPrediction('');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record the proxy');
    } finally {
      setBusy(false);
    }
  };

  const resolveProxy = async (index: number, resolution: 'true' | 'false' | 'partial') => {
    setResolvingIdx(index);
    setError(null);
    try {
      const res = await fetch(`/api/containers/${containerId}/proxy-resolution`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, resolution }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null); // canonical body-parse exception
        throw new Error(body?.error ?? 'Failed to resolve the proxy');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve the proxy');
    } finally {
      setResolvingIdx(null);
    }
  };

  const errorBlock = error && (
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
  );

  // ── ON RECORD — all proxies resolved (success, read-only) ──
  if (allResolved) {
    return (
      <AccentCard
        accent="success"
        title={
          <>
            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            <span>90-day proxies resolved — calibration on the record</span>
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
          The falsifiable proxies logged at the vote were returned to and scored. This is the
          embedded calibration loop — the per-proxy Brier compounds the platform&rsquo;s value to
          you specifically, in a way a prompt wrapper cannot reconstruct.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {proxies.map((p, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--border-color)',
                borderLeft: '3px solid var(--success)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
              }}
            >
              <div
                style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}
              >
                {p.prediction}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 'var(--fs-2xs)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span>Predicted confidence {Math.round(p.confidence * 100)}%</span>
                <span>· Outcome: {p.resolution}</span>
                {typeof p.brierScore === 'number' && <span>· Brier {p.brierScore.toFixed(3)}</span>}
              </div>
            </div>
          ))}
        </div>
      </AccentCard>
    );
  }

  // ── RESOLVE — some proxies came due (warning) ──
  if (hasFalsifiable && dueIdx.length > 0) {
    return (
      <AccentCard
        accent="warning"
        title={
          <>
            <Clock size={16} style={{ color: 'var(--warning)' }} />
            <span>
              {dueIdx.length} operational {dueIdx.length === 1 ? 'proxy is' : 'proxies are'} due —
              record what actually happened
            </span>
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
          You logged these falsifiable predictions at the vote. The horizon has elapsed — return and
          record the outcome. This is the persistent embedded antagonism: the platform makes you
          come back, not a wrapper&rsquo;s opinion you can ignore.
        </p>
        {errorBlock}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dueIdx.map(i => {
            const p = proxies[i];
            return (
              <div
                key={i}
                style={{
                  border: '1px solid var(--border-color)',
                  borderLeft: '3px solid var(--warning)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                  }}
                >
                  {p.prediction}
                </div>
                <div
                  style={{
                    margin: '6px 0 10px',
                    fontSize: 'var(--fs-2xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {p.horizonDays}-day horizon · predicted confidence{' '}
                  {Math.round(p.confidence * 100)}%
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['true', 'partial', 'false'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => resolveProxy(i, r)}
                      disabled={resolvingIdx !== null}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 12px',
                        fontSize: 'var(--fs-xs)',
                        fontWeight: 600,
                        color: r === 'true' ? '#fff' : 'var(--text-primary)',
                        background:
                          r === 'true'
                            ? 'var(--success)'
                            : r === 'partial'
                              ? 'var(--bg-card)'
                              : 'var(--bg-card)',
                        border:
                          r === 'false'
                            ? '1px solid var(--error)'
                            : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: resolvingIdx !== null ? 'wait' : 'pointer',
                      }}
                    >
                      {resolvingIdx === i && <Loader2 size={11} className="animate-spin" />}
                      {r === 'true' ? 'Came true' : r === 'partial' ? 'Partial' : 'Did not'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </AccentCard>
    );
  }

  // ── CAPTURE — no falsifiable proxy on record (warning, gated) ──
  if (!hasFalsifiable) {
    return (
      <AccentCard
        accent="warning"
        title={
          <>
            <Target size={16} style={{ color: 'var(--warning)' }} />
            <span>Log a 90-day operational proxy — required before the outcome</span>
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
          Before this decision&rsquo;s outcome can be logged, record one falsifiable prediction that
          resolves within 90 days — a named, checkable proxy (&ldquo;the CTO is retained through day
          90&rdquo;, &ldquo;the CRM is integrated by Q2&rdquo;). Logged at the vote, scored at
          horizon — that is the calibration loop a wrapper cannot run.
        </p>
        {errorBlock}
        <textarea
          value={prediction}
          onChange={e => setPrediction(e.target.value)}
          placeholder="A named, checkable 90-day prediction — the owner, the milestone, the date"
          rows={2}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: 'var(--fs-sm)',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: 10,
          }}
        />
        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>Horizon</span>
            {HORIZONS.map(h => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                style={{
                  padding: '4px 10px',
                  fontSize: 'var(--fs-2xs)',
                  fontWeight: 600,
                  color: horizon === h ? '#fff' : 'var(--text-secondary)',
                  background: horizon === h ? 'var(--accent-primary)' : 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                {h}d
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
              Confidence {Math.round(confidence * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={confidence}
              onChange={e => setConfidence(parseFloat(e.target.value))}
            />
          </div>
        </div>
        {!hasSnapshot && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <select
              value={conviction}
              onChange={e => setConviction(e.target.value as Conviction)}
              style={{
                padding: '6px 10px',
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-primary)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <option value="low">Conviction: low</option>
              <option value="medium">Conviction: medium</option>
              <option value="high">Conviction: high</option>
              <option value="very_high">Conviction: very high</option>
            </select>
            <input
              type="text"
              value={convictionRationale}
              onChange={e => setConvictionRationale(e.target.value)}
              placeholder="One-line conviction rationale (first capture)"
              style={{
                flex: '1 1 220px',
                padding: '6px 10px',
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-primary)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>
        )}
        <button
          type="button"
          onClick={captureProxy}
          disabled={busy}
          style={{
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
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
          {busy ? 'Recording…' : 'Record proxy — unlock outcome logging'}
        </button>
      </AccentCard>
    );
  }

  // ── TRACKING — proxies on record, none due yet (info, read-only) ──
  const nextDue = proxies
    .filter(p => !p.resolvedAt)
    .map(p => proxyDueAtMs(p, capturedAt))
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b)[0];
  const daysToNext = nextDue ? Math.max(0, Math.ceil((nextDue - nowMs) / DAY_MS)) : null;

  return (
    <AccentCard
      accent="info"
      title={
        <>
          <Target size={16} style={{ color: 'var(--accent-secondary, #6366f1)' }} />
          <span>
            {proxies.length} operational {proxies.length === 1 ? 'proxy' : 'proxies'} tracking
          </span>
        </>
      }
    >
      <p
        style={{
          margin: 0,
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          lineHeight: 1.55,
        }}
      >
        Falsifiable predictions are on the record from the vote.{' '}
        {daysToNext !== null
          ? `Next comes due in ${daysToNext} day${daysToNext === 1 ? '' : 's'} — you'll be asked to record what happened then.`
          : 'They will surface here for resolution at horizon.'}
      </p>
    </AccentCard>
  );
}
