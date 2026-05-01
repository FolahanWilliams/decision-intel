'use client';

import { useDecisionBrief } from '@/hooks/useDecisionBrief';
import {
  FileText,
  AlertTriangle,
  Shield,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { SEVERITY_COLORS } from '@/lib/constants/human-audit';

// RISK_COLORS aliases SEVERITY_COLORS — likelihood + impact use the same
// 4-level severity scale, so kept as a re-export rather than a copy.
const RISK_COLORS = SEVERITY_COLORS;

// 8%-alpha tint of any severity color. SEVERITY_COLORS resolves to CSS
// var() expressions, so the prior `${hex}15` (hex + 1-byte alpha) hack
// no longer applies. color-mix() is the modern equivalent and ships in
// every evergreen browser DI targets.
function severityTint(level: string | undefined, fallback = 'var(--text-muted)'): string {
  const color = (level && SEVERITY_COLORS[level]) || fallback;
  return `color-mix(in srgb, ${color} 8%, transparent)`;
}

const ACTION_CONFIG: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  proceed: { color: '#22c55e', icon: CheckCircle, label: 'Proceed' },
  proceed_with_caution: { color: '#eab308', icon: AlertTriangle, label: 'Proceed with Caution' },
  delay: { color: '#f97316', icon: Clock, label: 'Delay' },
  reject: { color: '#ef4444', icon: XCircle, label: 'Reject' },
};

export function DecisionBriefTab({ dealId }: { dealId: string }) {
  const { brief, isStreaming, streamText, error, generateBrief } = useDecisionBrief(dealId);

  // Empty state
  if (!brief && !isStreaming && !streamText) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px' }}>
        <FileText
          size={48}
          style={{ color: 'var(--text-muted)', marginBottom: 16, opacity: 0.5 }}
        />
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          Decision Brief
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginBottom: 20,
            maxWidth: 400,
            margin: '0 auto 20px',
          }}
        >
          Generate a comprehensive synthesis of all analyzed documents for this deal. The brief
          includes key findings, bias landscape, risk assessment, and a recommendation.
        </p>
        {error && (
          <div
            style={{
              color: '#ef4444',
              fontSize: 12,
              marginBottom: 12,
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 6,
              display: 'inline-block',
            }}
          >
            {error}
          </div>
        )}
        <div>
          <button
            onClick={generateBrief}
            className="btn btn-primary"
            style={{
              padding: '10px 24px',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FileText size={14} /> Generate Decision Brief
          </button>
        </div>
      </div>
    );
  }

  // Streaming state
  if (isStreaming && !brief) {
    return (
      <div style={{ padding: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <RefreshCw size={14} style={{ color: '#16A34A', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 500 }}>
            Generating Decision Brief...
          </span>
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--bg-elevated)',
            borderRadius: 8,
            padding: 16,
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          {streamText || 'Assembling analysis data...'}
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!brief) return null;

  // Rendered brief
  const actionConfig =
    ACTION_CONFIG[brief.recommendation.action] || ACTION_CONFIG.proceed_with_caution;
  const ActionIcon = actionConfig.icon;

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header with regenerate + deal-level DPR export */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Decision Brief
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <a
            href={`/api/deals/${dealId}/provenance-record?format=pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            title="Download deal-level Decision Provenance Record · hashed + tamper-evident PDF covering every analyzed document, the cross-reference findings, and the realised outcome"
            style={{
              padding: '5px 10px',
              fontSize: 11,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
              color: 'var(--accent-primary)',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={11} /> Export Deal DPR
          </a>
          <button
            onClick={generateBrief}
            disabled={isStreaming}
            className="btn btn-ghost"
            style={{
              padding: '5px 10px',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              opacity: isStreaming ? 0.5 : 1,
            }}
          >
            <RefreshCw size={11} /> Regenerate
          </button>
        </div>
      </div>

      {/* Recommendation Card */}
      <div
        style={{
          background: `${actionConfig.color}10`,
          border: `1px solid ${actionConfig.color}30`,
          borderRadius: 10,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ActionIcon size={18} style={{ color: actionConfig.color }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: actionConfig.color }}>
            {actionConfig.label}
          </span>
        </div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-primary)',
            margin: '0 0 8px 0',
            lineHeight: 1.5,
          }}
        >
          {brief.recommendation.rationale}
        </p>
        {brief.recommendation.conditions.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
              CONDITIONS:
            </span>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              {brief.recommendation.conditions.map((c, i) => (
                <li
                  key={i}
                  style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Executive Summary */}
      <Section title="Executive Summary" icon={<FileText size={13} />}>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-primary)',
            lineHeight: 1.6,
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}
        >
          {brief.executiveSummary}
        </p>
      </Section>

      {/* Key Findings */}
      {brief.keyFindings.length > 0 && (
        <Section title="Key Findings" icon={<AlertTriangle size={13} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brief.keyFindings.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '8px 10px',
                  background: 'var(--bg-card)',
                  borderRadius: 6,
                  borderLeft: `3px solid ${SEVERITY_COLORS[f.severity] || 'var(--text-muted)'}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {f.finding}
                  </div>
                  {f.sources.length > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Sources: {f.sources.join(', ')}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: SEVERITY_COLORS[f.severity] || 'var(--text-muted)',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.severity}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Risk Assessment */}
      <Section title="Risk Assessment" icon={<Shield size={13} />}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 4,
            background: severityTint(brief.riskAssessment.overallRisk),
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: RISK_COLORS[brief.riskAssessment.overallRisk] || 'var(--text-muted)',
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: RISK_COLORS[brief.riskAssessment.overallRisk] || 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            {brief.riskAssessment.overallRisk} Risk
          </span>
        </div>
        {brief.riskAssessment.topRisks.length > 0 && (
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-elevated)' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '6px 8px',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    fontSize: 11,
                  }}
                >
                  Risk
                </th>
                <th
                  style={{
                    textAlign: 'center',
                    padding: '6px 8px',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    fontSize: 11,
                  }}
                >
                  Likelihood
                </th>
                <th
                  style={{
                    textAlign: 'center',
                    padding: '6px 8px',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    fontSize: 11,
                  }}
                >
                  Impact
                </th>
              </tr>
            </thead>
            <tbody>
              {brief.riskAssessment.topRisks.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--bg-card-hover)' }}>
                  <td style={{ padding: '6px 8px', color: 'var(--text-primary)' }}>{r.risk}</td>
                  <td
                    style={{
                      padding: '6px 8px',
                      textAlign: 'center',
                      color: SEVERITY_COLORS[r.likelihood] || 'var(--text-muted)',
                    }}
                  >
                    {r.likelihood}
                  </td>
                  <td
                    style={{
                      padding: '6px 8px',
                      textAlign: 'center',
                      color: SEVERITY_COLORS[r.impact] || 'var(--text-muted)',
                    }}
                  >
                    {r.impact}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Bias Landscape */}
      {(brief.biasLandscape.topBiases.length > 0 ||
        brief.biasLandscape.crossDocPatterns.length > 0) && (
        <Section title="Bias Landscape" icon={<AlertTriangle size={13} />}>
          {brief.biasLandscape.topBiases.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {brief.biasLandscape.topBiases.map((b, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: severityTint(b.avgSeverity),
                    color: SEVERITY_COLORS[b.avgSeverity] || 'var(--text-muted)',
                    fontWeight: 500,
                  }}
                >
                  {b.type} ({b.frequency}x)
                </span>
              ))}
            </div>
          )}
          {brief.biasLandscape.crossDocPatterns.length > 0 && (
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                CROSS-DOCUMENT PATTERNS:
              </span>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {brief.biasLandscape.crossDocPatterns.map((p, i) => (
                  <li
                    key={i}
                    style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Document Scorecard */}
      {brief.documentScorecard.length > 0 && (
        <Section title="Document Scorecard" icon={<TrendingUp size={13} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brief.documentScorecard.map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 10px',
                  background: 'var(--bg-card)',
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: d.score >= 70 ? '#22c55e' : d.score >= 40 ? '#eab308' : '#ef4444',
                    background:
                      d.score >= 70
                        ? 'rgba(34, 197, 94, 0.1)'
                        : d.score >= 40
                          ? 'rgba(234, 179, 8, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                    flexShrink: 0,
                  }}
                >
                  {d.score}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d.filename}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {d.keyInsight}
                  </div>
                  {d.topBiases.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                      {d.topBiases.slice(0, 3).map((b, j) => (
                        <span
                          key={j}
                          style={{
                            fontSize: 9,
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: 'var(--bg-card-hover)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {error && (
        <div
          style={{
            color: '#ef4444',
            fontSize: 12,
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--bg-elevated)',
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
          color: 'var(--text-muted)',
        }}
      >
        {icon}
        <span
          style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
