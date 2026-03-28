'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Shield,
  AlertTriangle,
  Lock,
  Loader2,
  BarChart3,
  Eye,
  Clock,
  FileText,
  Target,
  Search,
  Activity,
  Heart,
  ArrowRight,
} from 'lucide-react';
import { DQIBadge } from '@/components/ui/DQIBadge';
import { trackEvent } from '@/lib/analytics/track';

interface SharedAnalysis {
  id: string;
  documentName: string;
  overallScore: number;
  noiseScore: number;
  summary: string;
  biases: Array<{
    biasType: string;
    severity: string;
    excerpt: string;
    explanation: string;
    suggestion: string;
  }>;
  factCheck: unknown;
  swotAnalysis: unknown;
  preMortem: unknown;
  sentiment: unknown;
  metaVerdict: string | null;
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractPreviewText(data: unknown, maxLength = 200): string {
  if (!data) return '';
  if (typeof data === 'string') return data.slice(0, maxLength);
  try {
    const str = JSON.stringify(data);
    return str
      .replace(/[{}\[\]"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength);
  } catch {
    return '';
  }
}

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
    icon: <Target size={14} style={{ color: '#6366f1' }} />,
  },
  {
    key: 'factCheck',
    title: 'Fact Verification',
    description: 'Claims verified against real-time data sources',
    icon: <Search size={14} style={{ color: '#6366f1' }} />,
  },
  {
    key: 'preMortem',
    title: 'Pre-Mortem Scenarios',
    description: 'Failure scenarios simulated before they happen',
    icon: <Activity size={14} style={{ color: '#6366f1' }} />,
  },
  {
    key: 'sentiment',
    title: 'Sentiment Analysis',
    description: 'Emotional tone and objectivity assessment',
    icon: <Heart size={14} style={{ color: '#6366f1' }} />,
  },
];

function LockedSectionsTeaser({ analysis }: { analysis: SharedAnalysis }) {
  const available = LOCKED_SECTIONS.filter(s => analysis[s.key] != null);
  if (available.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 12,
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        Full Analysis Includes
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {available.map(section => {
          const preview = extractPreviewText(analysis[section.key]);
          return (
            <div
              key={section.key}
              style={{
                background: '#1a1a2e',
                border: '1px solid #2d2d44',
                borderRadius: 12,
                padding: '16px 20px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {section.icon}
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{section.title}</span>
                </div>
                <Lock size={12} style={{ color: '#475569' }} />
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                {section.description}
              </div>
              {preview && (
                <div
                  style={{
                    position: 'relative',
                    height: 48,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      filter: 'blur(5px)',
                      fontSize: 13,
                      color: '#cbd5e1',
                      lineHeight: 1.6,
                      userSelect: 'none',
                    }}
                  >
                    {preview}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(26, 26, 46, 0) 0%, #1a1a2e 85%)',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnlockedSections({ analysis }: { analysis: SharedAnalysis }) {
  const sections = LOCKED_SECTIONS.filter(s => analysis[s.key] != null);
  if (sections.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      {sections.map(section => {
        const data = analysis[section.key];
        const content = typeof data === 'string'
          ? data
          : JSON.stringify(data, null, 2)
              .replace(/[{}\[\]"]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
        return (
          <div
            key={section.key}
            style={{
              background: '#1a1a2e',
              border: '1px solid #2d2d44',
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {section.icon}
              {section.title}
            </h3>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7, margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>
              {content}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

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
      if (pwd) url.searchParams.set('password', pwd);

      const res = await fetch(url.toString());
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

  // Format dates — must be called before any early returns (Rules of Hooks)
  const formattedExpiry = useMemo(
    () => (expiresAt ? new Date(expiresAt).toLocaleDateString() : null),
    [expiresAt]
  );
  const formattedCreatedAt = useMemo(
    () => (analysis ? new Date(analysis.createdAt).toLocaleDateString() : ''),
    [analysis]
  );

  // Password gate
  if (requiresPassword && !analysis) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0f0f23',
          color: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: 400, width: '90%', textAlign: 'center' }}>
          <Lock size={40} style={{ color: '#6366f1', marginBottom: 16 }} />
          <h2 style={{ marginBottom: 8 }}>Password Protected</h2>
          <p style={{ color: '#94a3b8', marginBottom: 24 }}>
            This shared analysis requires a password to view.
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
                background: '#1a1a2e',
                border: '1px solid #2d2d44',
                borderRadius: 8,
                color: '#e2e8f0',
                fontSize: 14,
                marginBottom: 12,
              }}
            />
            <button
              type="submit"
              disabled={!password || loading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: !password || loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Unlocking...' : 'View Analysis'}
            </button>
          </form>
          {error && <p style={{ color: '#ef4444', marginTop: 12, fontSize: 13 }}>{error}</p>}
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0f0f23',
          color: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: '#6366f1' }} />
      </div>
    );
  }

  // Error
  if (error || !analysis) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0f0f23',
          color: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <AlertTriangle size={40} style={{ color: '#ef4444', marginBottom: 16 }} />
          <h2 style={{ marginBottom: 8 }}>{error || 'Analysis not found'}</h2>
          <p style={{ color: '#94a3b8' }}>This link may have expired or been revoked.</p>
        </div>
      </div>
    );
  }

  const scoreColor =
    analysis.overallScore >= 70 ? '#22c55e' : analysis.overallScore >= 40 ? '#eab308' : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f23', color: '#e2e8f0' }}>
      {/* Case Study Banner */}
      {isCaseStudy && (
        <div
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
            padding: '14px 24px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
            Case Study — Anonymized Decision Audit
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{ background: '#1a1a2e', borderBottom: '1px solid #2d2d44', padding: '12px 24px' }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: '#6366f1' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              <span style={{ color: '#fff' }}>Decision</span>
              <span style={{ color: '#6366f1', marginLeft: 4 }}>Intel</span>
            </span>
            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
              {isCaseStudy ? 'Case Study' : 'Shared Analysis'}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12,
              color: '#64748b',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye size={12} /> Read-only
            </span>
            {expiresAt && !isCaseStudy && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> Expires {formattedExpiry}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* Document Info + Score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FileText size={20} style={{ color: '#94a3b8' }} />
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{analysis.documentName}</h1>
            </div>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
              Analyzed {formattedCreatedAt}
            </p>
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {isCaseStudy ? (
              <DQIBadge score={analysis.overallScore} size="lg" showGrade animate />
            ) : (
              <>
                <div style={{ fontSize: 42, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                  {Math.round(analysis.overallScore)}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>/ 100</div>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        <div
          style={{
            background: '#1a1a2e',
            border: '1px solid #2d2d44',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <BarChart3 size={16} style={{ color: '#6366f1' }} /> Executive Summary
          </h3>
          <p style={{ color: '#cbd5e1', lineHeight: 1.7, margin: 0, fontSize: 14 }}>
            {analysis.summary}
          </p>
        </div>

        {/* Meta Verdict */}
        {analysis.metaVerdict && (
          <div
            style={{
              background: '#1a1a2e',
              border: '1px solid #2d2d44',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Meta Verdict</h3>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7, margin: 0, fontSize: 14 }}>
              {analysis.metaVerdict}
            </p>
          </div>
        )}

        {/* Biases */}
        {analysis.biases.length > 0 && (
          <div
            style={{
              background: '#1a1a2e',
              border: '1px solid #2d2d44',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              Cognitive Biases Detected ({analysis.biases.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analysis.biases.map((bias, idx) => {
                const sevColor =
                  bias.severity === 'high'
                    ? '#ef4444'
                    : bias.severity === 'medium'
                      ? '#eab308'
                      : '#22c55e';
                return (
                  <div
                    key={idx}
                    style={{
                      background: '#0f0f23',
                      borderRadius: 8,
                      padding: 16,
                      border: '1px solid #2d2d44',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {bias.biasType.replace(/_/g, ' ')}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: `${sevColor}18`,
                          color: sevColor,
                          fontWeight: 600,
                        }}
                      >
                        {bias.severity}
                      </span>
                    </div>
                    <p
                      style={{
                        color: '#94a3b8',
                        fontSize: 13,
                        margin: '0 0 6px',
                        fontStyle: 'italic',
                      }}
                    >
                      &ldquo;{bias.excerpt}&rdquo;
                    </p>
                    <p style={{ color: '#cbd5e1', fontSize: 13, margin: '0 0 6px' }}>
                      {bias.explanation}
                    </p>
                    <p style={{ color: '#6366f1', fontSize: 13, margin: 0 }}>{bias.suggestion}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Noise Score */}
        <div
          style={{
            background: '#1a1a2e',
            border: '1px solid #2d2d44',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Noise Score</div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 20,
                color:
                  analysis.noiseScore <= 30
                    ? '#22c55e'
                    : analysis.noiseScore <= 60
                      ? '#eab308'
                      : '#ef4444',
              }}
            >
              {Math.round(analysis.noiseScore)}/100
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {analysis.noiseScore <= 30
                ? 'Low noise — consistent reasoning'
                : analysis.noiseScore <= 60
                  ? 'Moderate noise detected'
                  : 'High noise — inconsistent reasoning'}
            </div>
          </div>
        </div>

        {/* ── Sections: unlocked for case studies, teaser otherwise ── */}
        {isCaseStudy ? (
          <UnlockedSections analysis={analysis} />
        ) : (
          <LockedSectionsTeaser analysis={analysis} />
        )}

        {/* ── Footer CTA ─────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 48,
            padding: '32px 24px',
            background: isCaseStudy
              ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, #1a1a2e 40%, rgba(26, 26, 46, 0) 100%)'
              : 'linear-gradient(180deg, #1a1a2e 0%, rgba(26, 26, 46, 0) 100%)',
            borderRadius: 16,
            border: '1px solid #2d2d44',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Shield size={20} style={{ color: '#6366f1' }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>
              {isCaseStudy ? (
                <>
                  <span style={{ color: '#94a3b8' }}>Powered by </span>
                  <span style={{ color: '#fff' }}>Decision</span>
                  <span style={{ color: '#6366f1', marginLeft: 4 }}>Intel</span>
                </>
              ) : (
                <>
                  <span style={{ color: '#fff' }}>Decision</span>
                  <span style={{ color: '#6366f1', marginLeft: 4 }}>Intel</span>
                </>
              )}
            </span>
          </div>
          <p
            style={{
              color: '#94a3b8',
              fontSize: 14,
              lineHeight: 1.6,
              maxWidth: 420,
              margin: '0 auto 20px',
            }}
          >
            Detect cognitive biases, simulate boardroom outcomes, and track decision quality over
            time.
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            {isCaseStudy ? 'Try Decision Intel' : 'Audit Your Own Decisions'}
            <ArrowRight size={16} />
          </a>
          <p style={{ color: '#475569', fontSize: 12, marginTop: 12 }}>
            Free to start &middot; No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
