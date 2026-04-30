'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Network,
  Lock,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Activity,
  Layers,
  Shield,
  ArrowRight,
  EyeOff,
} from 'lucide-react';
import type { GraphNetworkReport } from '@/lib/reports/graph-report';

// Public shared-graph viewer (A2 deep, locked 2026-04-27).
//
// Buyer scenario: a CFO opens a Decision Knowledge Graph URL his CSO sent
// him on his phone before the audit committee meeting. He has 90 seconds.
// He wants to know: (1) "what's the score?" (2) "what's the top thing
// flagged?" (3) "is the team doing the work?" — all answerable in one
// scroll without any auth context.
//
// Snapshot semantics: the API returns a frozen-in-time GraphNetworkReport
// captured when the share link was created. Subsequent audits the sharer
// runs do NOT show up here (the trust property the sharer needs to send
// the link without anxiety).
//
// Redacted mode: when the sharer enabled redact at create-time, bias-type
// labels are replaced with [BIAS_N] but counts + severity stay visible.
// We surface a banner on the page so the reader knows what they're seeing.

interface SharedGraphPayload {
  snapshot: GraphNetworkReport;
  sharerLabel: string;
  isRedacted: boolean;
  createdAt: string;
  expiresAt: string | null;
  viewCount: number;
}

interface PasswordChallenge {
  requiresPassword: true;
  sharerLabel: string;
  isRedacted: boolean;
}

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  green: '#16A34A',
  amber: '#F59E0B',
  red: '#EF4444',
  slate900: '#0F172A',
  slate700: '#334155',
  slate500: '#64748B',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  white: '#FFFFFF',
};

/**
 * Snapshot-time calibration band — N1 lock 2026-04-30.
 *
 * Renders ABOVE the graph content so the public viewer answers
 * "is this org's reasoning calibrated?" the moment the page loads.
 * Two visual variants:
 *
 *   org branch (cal.source === 'org')     — green band; shows the org's
 *                                            per-decision Brier + outcomes
 *                                            count + band label.
 *   platform_seed branch                   — slate band; shows the seed
 *                                            baseline + classification
 *                                            accuracy with the explicit
 *                                            "before customer outcomes
 *                                            accumulate" framing.
 *
 * Both variants are SAFE to render to anonymous viewers — the data is
 * derived from public case-study fields (seed) or aggregated org Brier
 * (no per-decision details exposed).
 */
function CalibrationBand({
  calibration,
}: {
  calibration: NonNullable<GraphNetworkReport['calibration']>;
}) {
  const isOrg = calibration.source === 'org';
  const accent = isOrg ? C.green : C.slate500;
  const tint = isOrg ? 'rgba(22, 163, 74, 0.06)' : 'rgba(148, 163, 184, 0.10)';
  const border = isOrg ? 'rgba(22, 163, 74, 0.25)' : 'rgba(148, 163, 184, 0.30)';
  const label = isOrg
    ? `${calibration.outcomesClosed} outcome${calibration.outcomesClosed === 1 ? '' : 's'} logged`
    : 'Platform calibration baseline';
  const number =
    calibration.meanBrierScore !== null && calibration.meanBrierScore !== undefined
      ? calibration.meanBrierScore.toFixed(3)
      : null;
  const accuracyPct =
    typeof calibration.classificationAccuracy === 'number'
      ? Math.round(calibration.classificationAccuracy * 100)
      : null;

  return (
    <div
      style={{
        background: tint,
        borderBottom: `1px solid ${border}`,
        padding: '12px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          gap: 14,
          fontSize: 13,
          color: C.slate700,
          lineHeight: 1.5,
        }}
      >
        <Activity size={14} style={{ color: accent, flexShrink: 0, alignSelf: 'center' }} />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: accent,
          }}
        >
          {isOrg ? 'Audited with calibration' : 'Calibration baseline'}
        </span>
        {number && (
          <span style={{ color: C.slate900 }}>
            Brier <strong style={{ fontWeight: 700 }}>{number}</strong>
            {calibration.brierCategory && (
              <span style={{ color: C.slate500 }}> ({calibration.brierCategory})</span>
            )}
          </span>
        )}
        <span style={{ color: C.slate500 }}>· {label}</span>
        {accuracyPct !== null && calibration.classificationCounts && (
          <span style={{ color: C.slate500 }}>
            · <strong style={{ color: C.slate900 }}>{accuracyPct}%</strong> classification accuracy
            ({calibration.classificationCounts.correct} of{' '}
            {calibration.classificationCounts.scored})
          </span>
        )}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 12,
        padding: '18px 20px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          color: accent ?? C.slate500,
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 12, color: C.slate500, marginTop: 8, lineHeight: 1.5 }}>{sub}</div>
      )}
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const isHigh = /high|critical|elev/i.test(risk);
  const isMed = /medium|moderate/i.test(risk);
  const color = isHigh ? C.red : isMed ? C.amber : C.green;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: `${color}15`,
        color,
        border: `1px solid ${color}40`,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      <Shield size={11} />
      {risk}
    </span>
  );
}

export default function SharedGraphPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [data, setData] = useState<SharedGraphPayload | null>(null);
  const [challenge, setChallenge] = useState<PasswordChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);

  // Password unlock state
  const [pwInput, setPwInput] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const loadShared = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/graph-share/${token}`);
      if (res.status === 401) {
        const body = (await res.json()) as PasswordChallenge;
        setChallenge(body);
        setData(null);
      } else if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError({
          status: res.status,
          message: body.error ?? `Failed to load (${res.status})`,
        });
      } else {
        const body = (await res.json()) as SharedGraphPayload;
        setData(body);
        setChallenge(null);
      }
    } catch (err) {
      setError({
        status: 500,
        message:
          err instanceof Error ? err.message : 'Network error while loading the shared graph.',
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadShared();
  }, [loadShared]);

  const handleUnlock = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token || !pwInput) return;
      setUnlocking(true);
      setPwError(null);
      try {
        const res = await fetch(`/api/graph-share/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwInput }),
        });
        if (res.status === 401) {
          setPwError('Incorrect password.');
          return;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setPwError(body.error ?? 'Could not unlock.');
          return;
        }
        const body = (await res.json()) as SharedGraphPayload;
        setData(body);
        setChallenge(null);
      } catch (err) {
        setPwError(err instanceof Error ? err.message : 'Could not unlock.');
      } finally {
        setUnlocking(false);
      }
    },
    [token, pwInput]
  );

  // Loading
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.slate100,
        }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: C.green }} />
      </div>
    );
  }

  // Password challenge
  if (challenge) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.slate100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <form
          onSubmit={handleUnlock}
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 16,
            padding: 28,
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Lock size={20} style={{ color: C.green }} />
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.navy }}>
              Password required
            </h1>
          </div>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: 13,
              color: C.slate700,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: C.navy }}>{challenge.sharerLabel}</strong> shared a Decision
            Knowledge Graph snapshot with you. Enter the password they sent to view it.
          </p>
          <input
            type="password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            placeholder="Password"
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${C.slate200}`,
              borderRadius: 10,
              fontSize: 14,
              marginBottom: 12,
            }}
            autoFocus
          />
          {pwError && (
            <div
              role="alert"
              style={{
                fontSize: 12,
                color: C.red,
                marginBottom: 12,
              }}
            >
              {pwError}
            </div>
          )}
          <button
            type="submit"
            disabled={unlocking || !pwInput}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: C.green,
              color: C.white,
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: unlocking || !pwInput ? 'not-allowed' : 'pointer',
              opacity: unlocking || !pwInput ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {unlocking ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            {unlocking ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>
      </div>
    );
  }

  // Error
  if (error || !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.slate100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 16,
            padding: 32,
            maxWidth: 480,
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          }}
        >
          <AlertTriangle size={32} style={{ color: C.amber, marginBottom: 12 }} />
          <h1
            style={{
              margin: '0 0 8px',
              fontSize: 18,
              fontWeight: 700,
              color: C.navy,
            }}
          >
            {error?.status === 410
              ? 'This shared graph is no longer available'
              : error?.status === 404
                ? 'Shared graph not found'
                : 'Could not load the shared graph'}
          </h1>
          <p
            style={{
              margin: '0 0 20px',
              fontSize: 13,
              color: C.slate700,
              lineHeight: 1.6,
            }}
          >
            {error?.message ??
              'The link may be expired, revoked, or incorrect. Ask the sender for a new one.'}
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              background: C.green,
              color: C.white,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Visit Decision Intel <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  const r = data.snapshot;
  const decisionNodes = r.nodeTypeDistribution?.['analysis'] ?? 0;
  const outcomeNodes = r.nodeTypeDistribution?.['outcome'] ?? 0;
  const biasNodes = r.nodeTypeDistribution?.['bias_pattern'] ?? 0;
  const totalNodes = r.metrics?.nodeCount ?? 0;
  const isEmptySnapshot = totalNodes === 0;

  return (
    <div style={{ minHeight: '100vh', background: C.slate100 }}>
      {/* Watermark header */}
      <header
        style={{
          background: C.navy,
          color: C.white,
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Network size={20} style={{ color: C.green }} />
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#94A3B8',
                }}
              >
                Shared snapshot
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.white }}>
                {data.sharerLabel} · Decision Knowledge Graph
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 11,
              color: '#94A3B8',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span>
              Captured{' '}
              {new Date(data.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span>·</span>
            <span>
              {data.viewCount} view{data.viewCount === 1 ? '' : 's'}
            </span>
            {data.expiresAt && (
              <>
                <span>·</span>
                <span>
                  Expires{' '}
                  {new Date(data.expiresAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* N1 lock 2026-04-30 — Snapshot-time calibration band. Sits
          ABOVE the graph content so the partner / CFO / regulator
          opening this link sees the org's calibration before any
          numbers below. Frozen at share-creation time; mutates with
          subsequent outcomes only on a new share. */}
      {r.calibration && <CalibrationBand calibration={r.calibration} />}

      {/* Redaction notice */}
      {data.isRedacted && (
        <div
          style={{
            background: '#FEF3C7',
            borderBottom: `1px solid ${C.amber}40`,
            padding: '10px 24px',
          }}
        >
          <div
            style={{
              maxWidth: 1080,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: '#92400E',
              fontWeight: 600,
            }}
          >
            <EyeOff size={13} />
            Client-Safe Redact mode active. Specific bias names are hidden; counts and severity
            levels remain visible.
          </div>
        </div>
      )}

      {/* Body */}
      <main
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '32px 24px 40px',
        }}
      >
        {isEmptySnapshot && (
          <div
            style={{
              background: C.white,
              border: `1px dashed ${C.slate200}`,
              borderRadius: 12,
              padding: '32px 28px',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            <Network size={32} style={{ color: C.slate500, marginBottom: 12 }} />
            <h2
              style={{
                margin: '0 0 6px',
                fontSize: 16,
                fontWeight: 700,
                color: C.navy,
              }}
            >
              The graph is just getting started
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: C.slate700,
                lineHeight: 1.6,
                maxWidth: 480,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {data.sharerLabel} has shared their Decision Knowledge Graph workspace, but no audited
              decisions are in the snapshot yet. Decisions, biases, and outcomes will appear here as
              the team audits more strategic memos and logs their outcomes.
            </p>
          </div>
        )}
        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <StatTile
            label="Decisions"
            value={decisionNodes.toLocaleString()}
            sub="audited strategic memos"
            icon={<Layers size={14} />}
            accent={C.green}
          />
          <StatTile
            label="Outcomes logged"
            value={outcomeNodes.toLocaleString()}
            sub="loop closed; calibration live"
            icon={<TrendingUp size={14} />}
            accent="#3B82F6"
          />
          <StatTile
            label="Bias patterns"
            value={biasNodes.toLocaleString()}
            sub="detected across the timeline"
            icon={<Activity size={14} />}
            accent="#A855F7"
          />
          <StatTile
            label="Network density"
            value={`${(r.metrics.density * 100).toFixed(1)}%`}
            sub={`${r.metrics.nodeCount} nodes · ${r.metrics.edgeCount} edges`}
            icon={<Network size={14} />}
            accent={C.slate500}
          />
        </div>

        {/* Risk state */}
        <section
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 12,
            padding: 20,
            marginBottom: 28,
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 8,
              flexWrap: 'wrap',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: C.navy,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Risk state
            </h2>
            <RiskBadge risk={r.riskState.overallRisk} />
          </div>
          <div
            style={{
              fontSize: 13,
              color: C.slate700,
              marginBottom: 12,
              lineHeight: 1.5,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Risk score {r.riskState.riskScore.toFixed(1)} · trend {r.riskState.trend}
          </div>
          {r.riskState.factors.length > 0 && (
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 13,
                color: C.slate700,
                lineHeight: 1.6,
              }}
            >
              {r.riskState.factors.slice(0, 5).map((f, i) => (
                <li key={i}>
                  <strong style={{ color: C.navy }}>{f.factor}.</strong> {f.description}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Top influential nodes */}
        {r.topNodes.length > 0 && (
          <section
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 28,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <h2
              style={{
                margin: '0 0 12px',
                fontSize: 14,
                fontWeight: 700,
                color: C.navy,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Most influential nodes
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 10,
              }}
            >
              {r.topNodes.slice(0, 6).map(n => (
                <div
                  key={n.id}
                  style={{
                    border: `1px solid ${C.slate200}`,
                    borderRadius: 8,
                    padding: 12,
                    background: C.slate100,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.slate500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 4,
                    }}
                  >
                    {n.type.replace(/_/g, ' ')}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.navy,
                      lineHeight: 1.3,
                      marginBottom: 6,
                    }}
                  >
                    {n.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.slate500,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    PageRank {n.pageRank.toFixed(3)} · degree {n.degree}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Anti-patterns */}
        {r.antiPatterns.length > 0 && (
          <section
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 28,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <h2
              style={{
                margin: '0 0 12px',
                fontSize: 14,
                fontWeight: 700,
                color: C.navy,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Structural anti-patterns
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {r.antiPatterns.slice(0, 5).map((p, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: `3px solid ${p.severity >= 0.7 ? C.red : p.severity >= 0.4 ? C.amber : C.slate500}`,
                    paddingLeft: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.navy,
                      marginBottom: 4,
                    }}
                  >
                    {p.patternType}
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        color: C.slate500,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      severity {(p.severity * 100).toFixed(0)}% · {p.affectedNodes} nodes
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: C.slate700, lineHeight: 1.5 }}>
                    {p.description}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.slate700,
                      lineHeight: 1.5,
                      marginTop: 4,
                      fontStyle: 'italic',
                    }}
                  >
                    Recommended: {p.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA footer */}
        <section
          style={{
            background: C.navy,
            color: C.white,
            borderRadius: 16,
            padding: '28px 32px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: C.green,
              marginBottom: 10,
            }}
          >
            Decision Intel
          </div>
          <h3
            style={{
              margin: '0 0 8px',
              fontSize: 22,
              fontWeight: 800,
              color: C.white,
              lineHeight: 1.3,
            }}
          >
            Build your own Decision Knowledge Graph.
          </h3>
          <p
            style={{
              margin: '0 0 18px',
              fontSize: 14,
              color: '#CBD5E1',
              lineHeight: 1.6,
              maxWidth: 540,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Every audited memo, every logged outcome, compounding into a calibration moat your team
            owns. Start free — no card required.
          </p>
          <Link
            href="/login?mode=signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: C.green,
              color: C.white,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)',
            }}
          >
            Start your trial <ArrowRight size={14} />
          </Link>
        </section>
      </main>
    </div>
  );
}
