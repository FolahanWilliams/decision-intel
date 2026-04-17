'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Shield,
  AlertTriangle,
  Lock,
  Loader2,
  Eye,
  Clock,
  FileText,
  Target,
  Search,
  Activity,
  Heart,
  ArrowRight,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';

interface SharedBias {
  biasType: string;
  severity: string;
  excerpt: string;
  explanation: string;
  suggestion: string;
}

interface SharedAnalysis {
  id: string;
  documentName: string;
  overallScore: number;
  noiseScore: number;
  summary: string;
  biases: SharedBias[];
  factCheck: unknown;
  swotAnalysis: unknown;
  preMortem: unknown;
  sentiment: unknown;
  metaVerdict: string | null;
  createdAt: string;
}

/* ─── Color tokens ──────────────────────────────────────────────────── */

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  red: '#DC2626',
  redLight: '#FEE2E2',
  amber: '#D97706',
  amberLight: '#FEF3C7',
} as const;

/* ─── Grade ring helper (matches DqiEstimateCard) ────────────────── */

const GRADE_META: Array<{ min: number; grade: string; ring: string; label: string }> = [
  { min: 85, grade: 'A', ring: '#22c55e', label: 'Excellent' },
  { min: 70, grade: 'B', ring: '#84cc16', label: 'Good' },
  { min: 55, grade: 'C', ring: '#eab308', label: 'Fair' },
  { min: 40, grade: 'D', ring: '#f97316', label: 'Poor' },
  { min: 0, grade: 'F', ring: '#ef4444', label: 'Critical' },
];

function gradeFor(score: number) {
  for (const t of GRADE_META) if (score >= t.min) return t;
  return GRADE_META[GRADE_META.length - 1];
}

/* ─── Severity helpers for the red-flags block ───────────────────── */

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const SEV_META: Record<string, { bg: string; fg: string; border: string; label: string }> = {
  critical: { bg: '#FEE2E2', fg: '#991B1B', border: '#FCA5A5', label: 'Critical' },
  high: { bg: '#FFEDD5', fg: '#C2410C', border: '#FDBA74', label: 'High' },
  medium: { bg: '#FEF3C7', fg: '#92400E', border: '#FDE68A', label: 'Medium' },
  low: { bg: '#F1F5F9', fg: '#475569', border: '#E2E8F0', label: 'Low' },
};

function formatBiasLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function extractPreviewText(data: unknown, maxLength = 200): string {
  if (!data) return '';
  if (typeof data === 'string') return data.slice(0, maxLength);
  try {
    const str = JSON.stringify(data);
    return str
      .replace(/[{}[\]"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength);
  } catch {
    return '';
  }
}

/* ─── Predicted-questions synthesiser (mirrors LivePredictedQuestions) ─ */

function synthesisedQuestions(analysis: SharedAnalysis): string[] {
  const out: string[] = [];
  const primary = [...analysis.biases].sort(
    (a, b) => (SEV_ORDER[a.severity] ?? 4) - (SEV_ORDER[b.severity] ?? 4)
  )[0];

  if (primary) {
    const name = formatBiasLabel(primary.biasType).toLowerCase();
    out.push(
      `Is there a chance we're underestimating ${name} on this call — and what would change our mind if so?`
    );
    if (primary.suggestion) {
      const stripped = primary.suggestion.replace(/^(A |The )/i, '').replace(/\.$/, '');
      const lower = stripped.charAt(0).toLowerCase() + stripped.slice(1);
      const trimmed = lower.length > 170 ? lower.slice(0, 167) + '…' : lower;
      out.push(
        `Walk me through "${trimmed}" — what's our defensible answer if the board raises it?`
      );
    }
  }

  if (analysis.summary) {
    const firstSentence = analysis.summary.split(/(?<=\.)\s+/)[0]?.replace(/\.$/, '');
    if (firstSentence && firstSentence.length < 200) {
      const lower = firstSentence.charAt(0).toLowerCase() + firstSentence.slice(1);
      out.push(`If we're wrong about "${lower}" — what's the fastest way we'd find out?`);
    }
  }

  out.push(
    `If this memo were re-run in six months with the outcome revealed, what do we think would embarrass us most?`
  );

  return out.slice(0, 4);
}

/* ─── Locked / unlocked "full analysis" sections ─────────────────── */

const LOCKED_SECTIONS: Array<{
  key: keyof SharedAnalysis;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'swotAnalysis',
    title: 'Strategic SWOT',
    description: 'Strengths, weaknesses, opportunities, and threats identified',
    icon: <Target size={14} style={{ color: C.green }} />,
  },
  {
    key: 'factCheck',
    title: 'Fact verification',
    description: 'Claims verified against real-time data sources',
    icon: <Search size={14} style={{ color: C.green }} />,
  },
  {
    key: 'preMortem',
    title: 'Pre-mortem scenarios',
    description: 'Failure modes simulated before they happen',
    icon: <Activity size={14} style={{ color: C.green }} />,
  },
  {
    key: 'sentiment',
    title: 'Sentiment analysis',
    description: 'Emotional tone and objectivity assessment',
    icon: <Heart size={14} style={{ color: C.green }} />,
  },
];

function LockedSectionsTeaser({ analysis }: { analysis: SharedAnalysis }) {
  const available = LOCKED_SECTIONS.filter(s => analysis[s.key] != null);
  if (available.length === 0) return null;
  return (
    <section style={{ marginBottom: 32 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.green,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: 8,
        }}
      >
        Full audit includes
      </div>
      <h2
        style={{
          fontSize: 'clamp(20px, 3vw, 24px)',
          fontWeight: 700,
          color: C.slate900,
          margin: 0,
          marginBottom: 16,
          letterSpacing: '-0.01em',
        }}
      >
        {available.length} more section{available.length === 1 ? '' : 's'} in the full report
      </h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {available.map(section => {
          const preview = extractPreviewText(analysis[section.key]);
          return (
            <div
              key={section.key as string}
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 12,
                padding: '14px 18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {section.icon}
                  <span style={{ fontWeight: 600, fontSize: 14, color: C.slate900 }}>
                    {section.title}
                  </span>
                </div>
                <Lock size={13} style={{ color: C.slate400 }} />
              </div>
              <div style={{ fontSize: 12, color: C.slate500, marginBottom: 10 }}>
                {section.description}
              </div>
              {preview && (
                <div style={{ position: 'relative', height: 40, overflow: 'hidden' }}>
                  <div
                    style={{
                      filter: 'blur(4px)',
                      fontSize: 13,
                      color: C.slate600,
                      lineHeight: 1.55,
                      userSelect: 'none',
                    }}
                  >
                    {preview}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${C.white} 85%)`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UnlockedSections({ analysis }: { analysis: SharedAnalysis }) {
  const sections = LOCKED_SECTIONS.filter(s => analysis[s.key] != null);
  if (sections.length === 0) return null;
  return (
    <section style={{ marginBottom: 32, display: 'grid', gap: 14 }}>
      {sections.map(section => {
        const data = analysis[section.key];
        const content =
          typeof data === 'string'
            ? data
            : JSON.stringify(data, null, 2)
                .replace(/[{}[\]"]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        return (
          <div
            key={section.key as string}
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 14,
              padding: '18px 22px',
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.slate900,
                margin: 0,
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {section.icon}
              {section.title}
            </h3>
            <p
              style={{
                color: C.slate600,
                lineHeight: 1.65,
                margin: 0,
                fontSize: 14,
                whiteSpace: 'pre-wrap',
              }}
            >
              {content}
            </p>
          </div>
        );
      })}
    </section>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */

export default function SharedAnalysisPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<SharedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isCaseStudy, setIsCaseStudy] = useState(searchParams.get('case') === 'true');

  const fetchAnalysis = async (pwd?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/share', window.location.origin);
      url.searchParams.set('token', token);

      const headers: Record<string, string> = {};
      if (pwd) headers['x-share-password'] = pwd;

      const res = await fetch(url.toString(), { headers });
      const data = await res.json();

      if (res.status === 401 && data.requiresPassword) {
        setRequiresPassword(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Failed to load shared analysis');
        setLoading(false);
        return;
      }

      setAnalysis(data.analysis);
      setExpiresAt(data.expiresAt);
      if (data.isCaseStudy) setIsCaseStudy(true);
      if (data.isCaseStudy || isCaseStudy) {
        trackEvent('case_study_viewed');
      }
      trackEvent('share_link_viewed', {
        token,
        isCaseStudy: !!data.isCaseStudy,
        analysisId: data.analysis?.id,
      });
      setRequiresPassword(false);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const formattedExpiry = useMemo(
    () => (expiresAt ? new Date(expiresAt).toLocaleDateString() : null),
    [expiresAt]
  );
  const formattedCreatedAt = useMemo(
    () => (analysis ? new Date(analysis.createdAt).toLocaleDateString() : ''),
    [analysis]
  );

  /* ─── Password gate ──────────────────────────────────────────── */

  if (requiresPassword && !analysis) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.slate50,
          color: C.slate900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: '90%',
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 20,
            padding: 32,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: C.greenLight,
              color: C.green,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Lock size={22} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 6 }}>
            Password-protected audit
          </h2>
          <p style={{ color: C.slate500, margin: 0, marginBottom: 20, fontSize: 14 }}>
            The owner of this link set a password before sending it.
          </p>
          <form
            onSubmit={e => {
              e.preventDefault();
              fetchAnalysis(password);
            }}
          >
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 10,
                color: C.slate900,
                fontSize: 14,
                marginBottom: 12,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!password || loading}
              style={{
                width: '100%',
                padding: '12px',
                background: C.green,
                color: C.white,
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: !password || loading ? 0.5 : 1,
                boxShadow: '0 6px 20px rgba(22,163,74,0.24)',
              }}
            >
              {loading ? 'Unlocking…' : 'View audit'}
            </button>
          </form>
          {error && <p style={{ color: C.red, marginTop: 12, fontSize: 13 }}>{error}</p>}
        </div>
      </div>
    );
  }

  /* ─── Loading ──────────────────────────────────────────────── */

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.slate50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: C.green }} />
      </div>
    );
  }

  /* ─── Error ────────────────────────────────────────────────── */

  if (error || !analysis) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.slate50,
          color: C.slate900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <AlertTriangle size={40} style={{ color: C.red, marginBottom: 14 }} />
          <h2 style={{ marginBottom: 6, fontSize: 22, fontWeight: 700 }}>
            {error || 'Audit not found'}
          </h2>
          <p style={{ color: C.slate500 }}>This link may have expired or been revoked.</p>
        </div>
      </div>
    );
  }

  /* ─── Main render ──────────────────────────────────────────── */

  const meta = gradeFor(Math.round(analysis.overallScore));
  const rankedBiases = [...analysis.biases]
    .sort((a, b) => (SEV_ORDER[a.severity] ?? 4) - (SEV_ORDER[b.severity] ?? 4))
    .slice(0, 5);
  const questions = synthesisedQuestions(analysis);
  const noiseLabel =
    analysis.noiseScore <= 30
      ? 'Low noise — consistent reasoning'
      : analysis.noiseScore <= 60
        ? 'Moderate noise detected'
        : 'High noise — inconsistent reasoning';
  const noiseColor =
    analysis.noiseScore <= 30 ? C.green : analysis.noiseScore <= 60 ? C.amber : C.red;

  return (
    <div style={{ minHeight: '100vh', background: C.slate50, color: C.slate900 }}>
      {/* Case study banner */}
      {isCaseStudy && (
        <div
          style={{
            background: `linear-gradient(90deg, ${C.green} 0%, ${C.green} 100%)`,
            padding: '10px 24px',
            textAlign: 'center',
            color: C.white,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Case study · anonymised decision audit
        </div>
      )}

      {/* Header bar */}
      <div
        style={{
          background: C.white,
          borderBottom: `1px solid ${C.slate200}`,
          padding: '14px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
            }}
          >
            <Shield size={18} style={{ color: C.green }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>Decision Intel</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.slate500,
                marginLeft: 6,
                padding: '2px 8px',
                borderRadius: 999,
                background: C.slate100,
              }}
            >
              {isCaseStudy ? 'Case study' : 'Shared audit'}
            </span>
          </Link>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: 12,
              color: C.slate500,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Eye size={12} /> Read-only
            </span>
            {expiresAt && !isCaseStudy && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> Expires {formattedExpiry}
              </span>
            )}
          </div>
        </div>
      </div>

      <main
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
        {/* Doc title + meta */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.green,
              marginBottom: 10,
            }}
          >
            <Sparkles size={12} /> Decision Quality Index
          </div>
          <h1
            style={{
              fontSize: 'clamp(26px, 4vw, 34px)',
              fontWeight: 800,
              color: C.slate900,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <FileText size={24} style={{ color: C.slate400 }} />
            {analysis.documentName}
          </h1>
          <div style={{ marginTop: 8, fontSize: 13, color: C.slate500 }}>
            Analysed {formattedCreatedAt}
          </div>
        </div>

        {/* Hero: navy gradient DQI card (mirrors DqiEstimateCard) */}
        <section
          style={{
            marginBottom: 32,
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F2A1F 100%)',
            border: `1px solid ${C.navyLight}`,
            borderRadius: 20,
            padding: 28,
            boxShadow: '0 10px 32px rgba(15, 23, 42, 0.22)',
            color: '#E2E8F0',
          }}
        >
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                width: 104,
                height: 104,
                borderRadius: '50%',
                border: `4px solid ${meta.ring}`,
                background: 'rgba(255,255,255,0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                flexShrink: 0,
                boxShadow: `inset 0 0 24px ${meta.ring}26`,
              }}
            >
              <span style={{ fontSize: 42, fontWeight: 800, color: meta.ring, lineHeight: 1 }}>
                {meta.grade}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginTop: 4 }}>
                {Math.round(analysis.overallScore)}/100
              </span>
            </div>
            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: meta.ring,
                  marginBottom: 8,
                }}
              >
                {meta.label}
              </div>
              <p style={{ fontSize: 15, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                {analysis.summary}
              </p>
            </div>
          </div>
        </section>

        {/* Meta verdict */}
        {analysis.metaVerdict && (
          <section
            style={{
              marginBottom: 32,
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 14,
              padding: '18px 22px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 6,
              }}
            >
              Meta verdict
            </div>
            <p style={{ color: C.slate700, lineHeight: 1.65, margin: 0, fontSize: 14 }}>
              {analysis.metaVerdict}
            </p>
          </section>
        )}

        {/* Red flags — numbered alerts */}
        {rankedBiases.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.red,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Shield size={12} /> Platform-detected signals
            </div>
            <h2
              style={{
                fontSize: 'clamp(20px, 3vw, 24px)',
                fontWeight: 700,
                color: C.slate900,
                margin: 0,
                marginBottom: 4,
                letterSpacing: '-0.01em',
              }}
            >
              {analysis.biases.length} red flag{analysis.biases.length === 1 ? '' : 's'} in this
              decision
            </h2>
            <p style={{ fontSize: 13, color: C.slate500, margin: '0 0 16px' }}>
              Each flag below was detected from the document alone — no outcome data, no hindsight.
            </p>

            <div
              style={{
                background: C.white,
                border: `1px solid ${SEV_META[rankedBiases[0].severity]?.border ?? C.slate200}`,
                borderRadius: 16,
                padding: 8,
                boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
              }}
            >
              {rankedBiases.map((bias, i) => {
                const sev = SEV_META[bias.severity] || SEV_META.low;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      padding: '14px 12px',
                      borderBottom:
                        i < rankedBiases.length - 1 ? `1px solid ${C.slate100}` : 'none',
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: sev.bg,
                        color: sev.fg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <AlertTriangle size={10} style={{ marginBottom: 1 }} />
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.slate900 }}>
                          {formatBiasLabel(bias.biasType)}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: sev.fg,
                            background: sev.bg,
                            padding: '2px 8px',
                            borderRadius: 999,
                          }}
                        >
                          {sev.label}
                        </span>
                      </div>
                      {bias.excerpt && (
                        <p
                          style={{
                            fontSize: 13,
                            color: C.slate500,
                            margin: '0 0 4px',
                            fontStyle: 'italic',
                            lineHeight: 1.55,
                          }}
                        >
                          &ldquo;{bias.excerpt}&rdquo;
                        </p>
                      )}
                      <p
                        style={{
                          fontSize: 13,
                          color: C.slate700,
                          margin: '0 0 4px',
                          lineHeight: 1.55,
                        }}
                      >
                        {bias.explanation}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: C.green,
                          fontWeight: 600,
                          margin: 0,
                          lineHeight: 1.55,
                        }}
                      >
                        {bias.suggestion}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Predicted questions */}
        {questions.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MessageSquare size={12} /> CEO / Board Question Simulator
            </div>
            <h2
              style={{
                fontSize: 'clamp(20px, 3vw, 24px)',
                fontWeight: 700,
                color: C.slate900,
                margin: 0,
                marginBottom: 4,
                letterSpacing: '-0.01em',
              }}
            >
              Questions the steering committee will ask
            </h2>
            <p style={{ fontSize: 13, color: C.slate500, margin: '0 0 16px' }}>
              Synthesised from this decision&apos;s primary bias and recommended action.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {questions.map((q, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    background: C.white,
                    border: `1px solid ${C.slate200}`,
                    borderLeft: `4px solid ${C.navy}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      flexShrink: 0,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: C.navy,
                      color: C.green,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  >
                    Q{i + 1}
                  </span>
                  <div
                    style={{
                      fontSize: 14,
                      color: C.slate900,
                      lineHeight: 1.55,
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{q}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Noise score chip */}
        <section
          style={{
            marginBottom: 32,
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 14,
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.slate500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Noise score
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: noiseColor, lineHeight: 1 }}>
            {Math.round(analysis.noiseScore)}
            <span style={{ fontSize: 12, fontWeight: 500, color: C.slate400 }}>/100</span>
          </div>
          <div style={{ fontSize: 13, color: C.slate500 }}>{noiseLabel}</div>
        </section>

        {/* Locked / unlocked extras */}
        {isCaseStudy ? (
          <UnlockedSections analysis={analysis} />
        ) : (
          <LockedSectionsTeaser analysis={analysis} />
        )}

        {/* Bottom CTA — matches DemoCta gradient banner */}
        <section
          style={{
            marginTop: 48,
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #064E3B 100%)',
            borderRadius: 20,
            padding: '40px 32px',
            color: C.white,
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(15, 23, 42, 0.28)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: C.green,
              marginBottom: 12,
            }}
          >
            <Sparkles size={12} />
            Your memo, audited in 60 seconds
          </div>
          <h2
            style={{
              fontSize: 'clamp(22px, 4vw, 32px)',
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              marginBottom: 10,
            }}
          >
            {isCaseStudy
              ? 'This is what Decision Intel produces for every memo.'
              : 'Run the same audit on your next strategic memo.'}
          </h2>
          <p
            style={{
              fontSize: 'clamp(13px, 2vw, 15px)',
              color: '#CBD5E1',
              maxWidth: 520,
              margin: '0 auto 24px',
              lineHeight: 1.55,
            }}
          >
            Same bias framework, same pre-decision discipline. Upload a strategic memo or board deck
            — get the DQI grade, flagged biases, predicted questions, and recommended actions before
            your next meeting.
          </p>
          <div
            style={{
              display: 'inline-flex',
              gap: 10,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: C.green,
                color: C.white,
                fontSize: 14,
                fontWeight: 700,
                padding: '12px 22px',
                borderRadius: 999,
                textDecoration: 'none',
                boxShadow: '0 4px 18px rgba(22, 163, 74, 0.35)',
              }}
            >
              Start free audit
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/case-studies"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.08)',
                color: C.white,
                fontSize: 14,
                fontWeight: 600,
                padding: '12px 22px',
                borderRadius: 999,
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.16)',
              }}
            >
              See more cases
            </Link>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 18 }}>
            Free to start · No credit card required
          </p>
        </section>
      </main>
    </div>
  );
}
