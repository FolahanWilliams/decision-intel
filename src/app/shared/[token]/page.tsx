'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield,
  AlertTriangle,
  Lock,
  Loader2,
  BarChart3,
  Eye,
  Clock,
  FileText,
} from 'lucide-react';

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

export default function SharedAnalysisPage() {
  const { token } = useParams<{ token: string }>();
  const [analysis, setAnalysis] = useState<SharedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

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
            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>Shared Analysis</span>
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
            {expiresAt && (
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
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
              {Math.round(analysis.overallScore)}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>/ 100</div>
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

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: 'center', color: '#475569', fontSize: 12 }}>
          Shared via <strong>Decision Intel</strong> — AI-powered decision auditing
        </div>
      </div>
    </div>
  );
}
