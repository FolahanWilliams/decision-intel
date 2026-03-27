'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  BarChart3,
  FileText,
  AlertTriangle,
  ArrowRight,
  Users,
  Brain,
  Target,
  TrendingUp,
  Scale,
  Gavel,
  Lightbulb,
  Skull,
  Loader2,
} from 'lucide-react';
import { DEMO_ANALYSES, type DemoAnalysis } from './data';

type DemoTab = 'overview' | 'biases' | 'logic' | 'swot' | 'noise' | 'compliance' | 'premortem' | 'boardroom';

const TABS: { id: DemoTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
  { id: 'biases', label: 'Biases', icon: <Brain size={14} /> },
  { id: 'logic', label: 'Logic', icon: <Scale size={14} /> },
  { id: 'swot', label: 'SWOT', icon: <Lightbulb size={14} /> },
  { id: 'noise', label: 'Noise', icon: <Target size={14} /> },
  { id: 'compliance', label: 'Compliance', icon: <Gavel size={14} /> },
  { id: 'premortem', label: 'Pre-Mortem', icon: <Skull size={14} /> },
  { id: 'boardroom', label: 'Boardroom', icon: <Users size={14} /> },
];

const sevColor = (severity: string) =>
  severity === 'critical'
    ? '#ef4444'
    : severity === 'high'
      ? '#f97316'
      : severity === 'medium'
        ? '#eab308'
        : '#22c55e';

const statusColor = (status: string) =>
  status === 'compliant' ? '#22c55e' : status === 'partial' ? '#eab308' : '#ef4444';

const statusLabel = (status: string) =>
  status === 'compliant' ? 'Compliant' : status === 'partial' ? 'Partial' : 'Non-Compliant';

export default function DemoPage() {
  const router = useRouter();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<DemoTab>('overview');
  const [loadingSample, setLoadingSample] = useState(false);

  const analysis = DEMO_ANALYSES[selectedIdx];

  const scoreColor =
    analysis.overallScore >= 70 ? '#22c55e' : analysis.overallScore >= 40 ? '#eab308' : '#ef4444';
  const noiseColor =
    analysis.noiseScore <= 30 ? '#22c55e' : analysis.noiseScore <= 60 ? '#eab308' : '#ef4444';

  const handleTryNow = useCallback(async () => {
    setLoadingSample(true);
    try {
      const res = await fetch('/api/onboarding/sample', { method: 'POST' });
      const data = await res.json();
      if (data.documentId) {
        router.push(`/documents/${data.documentId}`);
        return;
      }
    } catch {
      // Fall through to login
    }
    // If not logged in or API failed, redirect to login
    router.push('/login');
    setLoadingSample(false);
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e2e8f0' }}>
      {/* Header */}
      <div
        style={{
          background: '#111111',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}
          >
            <Shield size={18} style={{ color: '#fff' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              <span style={{ color: '#fff' }}>Decision</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>Intel</span>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: '9999px',
                background: 'rgba(234, 179, 8, 0.1)',
                color: '#eab308',
                fontWeight: 600,
                letterSpacing: '0.03em',
              }}
            >
              INTERACTIVE DEMO
            </span>
            <button
              onClick={handleTryNow}
              disabled={loadingSample}
              style={{
                fontSize: 13,
                padding: '6px 16px',
                borderRadius: '8px',
                background: '#fff',
                color: '#000',
                fontWeight: 600,
                border: 'none',
                cursor: loadingSample ? 'wait' : 'pointer',
                opacity: loadingSample ? 0.7 : 1,
              }}
            >
              {loadingSample ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
                </span>
              ) : (
                'Try Your Own Document'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Example Selector */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
            Select a case study
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {DEMO_ANALYSES.map((a, idx) => (
              <button
                key={a.id}
                onClick={() => { setSelectedIdx(idx); setActiveTab('overview'); }}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: idx === selectedIdx
                    ? '1px solid rgba(255,255,255,0.3)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: idx === selectedIdx ? 'rgba(255,255,255,0.06)' : '#111111',
                  color: idx === selectedIdx ? '#fff' : '#94a3b8',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <FileText size={14} />
                {a.shortName}
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: `${a.overallScore >= 70 ? '#22c55e' : a.overallScore >= 40 ? '#eab308' : '#ef4444'}15`,
                    color: a.overallScore >= 70 ? '#22c55e' : a.overallScore >= 40 ? '#eab308' : '#ef4444',
                    fontWeight: 700,
                  }}
                >
                  {a.overallScore}/100
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Document Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.4 }}>
            {analysis.documentName}
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Analyzed by Decision Intel &middot; {new Date(analysis.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Score Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
            marginBottom: 28,
          }}
        >
          <ScoreCard label="DECISION QUALITY" value={`${analysis.overallScore}`} sub="/100" color={scoreColor} />
          <ScoreCard label="NOISE SCORE" value={`${analysis.noiseScore}`} sub="High inconsistency" color={noiseColor} />
          <ScoreCard label="BIASES DETECTED" value={`${analysis.biases.length}`} sub={`${analysis.biases.filter(b => b.severity === 'critical').length} critical`} color="#ef4444" />
          <ScoreCard
            label="BOARD VERDICT"
            value={analysis.simulation.overallVerdict}
            sub={`${analysis.simulation.twins.filter(t => t.vote === 'REJECT').length} of ${analysis.simulation.twins.length} reject`}
            color={analysis.simulation.overallVerdict === 'REJECT' ? '#ef4444' : '#eab308'}
            smallValue
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 24,
            overflowX: 'auto',
            paddingBottom: 2,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#fff' : '#64748b',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #fff' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab analysis={analysis} />}
        {activeTab === 'biases' && <BiasesTab analysis={analysis} />}
        {activeTab === 'logic' && <LogicTab analysis={analysis} />}
        {activeTab === 'swot' && <SwotTab analysis={analysis} />}
        {activeTab === 'noise' && <NoiseTab analysis={analysis} />}
        {activeTab === 'compliance' && <ComplianceTab analysis={analysis} />}
        {activeTab === 'premortem' && <PreMortemTab analysis={analysis} />}
        {activeTab === 'boardroom' && <BoardroomTab analysis={analysis} />}

        {/* Known Outcome Banner (when available) */}
        {analysis.outcome && (
          <div
            style={{
              marginTop: 32,
              padding: '20px 24px',
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <TrendingUp size={16} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', letterSpacing: '0.03em' }}>
                KNOWN OUTCOME
              </span>
            </div>
            <p style={{ color: '#e2e8f0', fontSize: 14, margin: '0 0 6px', lineHeight: 1.6 }}>
              {analysis.outcome.what}
            </p>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
              {analysis.outcome.when} &middot; {analysis.outcome.impact}
            </p>
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            marginTop: 48,
            textAlign: 'center',
            padding: '40px 24px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            This was a demo. Now try it on your own documents.
          </h3>
          <p
            style={{
              color: '#64748b',
              fontSize: 14,
              marginBottom: 24,
              maxWidth: 500,
              margin: '0 auto 24px',
            }}
          >
            Upload any strategic document &mdash; board memo, M&amp;A rationale, investment thesis, market
            analysis &mdash; and get a comprehensive cognitive bias audit in minutes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleTryNow}
              disabled={loadingSample}
              style={{
                padding: '12px 28px',
                borderRadius: 10,
                background: '#fff',
                color: '#000',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                cursor: loadingSample ? 'wait' : 'pointer',
              }}
            >
              {loadingSample ? 'Loading...' : 'Try with Sample Document'}{' '}
              <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
            </button>
            <Link
              href="/login"
              style={{
                padding: '12px 28px',
                borderRadius: 10,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Sign Up Free
            </Link>
          </div>
          <p style={{ color: '#475569', fontSize: 11, marginTop: 16 }}>
            No credit card required &middot; 3 free analyses &middot; 14-day trial on paid plans
          </p>
        </div>

        <p
          style={{
            color: '#334155',
            fontSize: 11,
            textAlign: 'center',
            marginTop: 32,
            lineHeight: 1.6,
          }}
        >
          Demo analyses are generated by Decision Intel&apos;s cognitive bias detection engine to demonstrate
          product capabilities. They are not financial or investment advice.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Tab Components ──────────────────────────────────────────────────

function OverviewTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <>
      <Section icon={<BarChart3 size={16} />} title="Executive Summary">
        <p style={{ color: '#cbd5e1', lineHeight: 1.8, margin: 0, fontSize: 14 }}>
          {analysis.summary}
        </p>
      </Section>
      <Section
        icon={<AlertTriangle size={16} style={{ color: '#ef4444' }} />}
        title="Meta Verdict"
        borderColor="rgba(239, 68, 68, 0.2)"
      >
        <p style={{ color: '#cbd5e1', lineHeight: 1.8, margin: 0, fontSize: 14 }}>
          {analysis.metaVerdict}
        </p>
      </Section>

      {/* Quick stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <MiniCard label="Logical Fallacies" value={`${analysis.logicalFallacies.length} found`} color="#f97316" />
        <MiniCard
          label="SWOT Balance"
          value={`${analysis.swot.weaknesses.length + analysis.swot.threats.length} risks vs ${analysis.swot.strengths.length + analysis.swot.opportunities.length} positives`}
          color={analysis.swot.weaknesses.length + analysis.swot.threats.length > analysis.swot.strengths.length + analysis.swot.opportunities.length ? '#ef4444' : '#22c55e'}
        />
        <MiniCard
          label="Compliance"
          value={`${analysis.compliance.frameworks.filter(f => f.status === 'non_compliant').length} non-compliant`}
          color="#ef4444"
        />
        <MiniCard
          label="Pre-Mortem Risks"
          value={`${analysis.preMortem.scenarios.length} scenarios`}
          color="#eab308"
        />
      </div>
    </>
  );
}

function BiasesTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <Section icon={<Brain size={16} />} title={`Cognitive Biases Detected (${analysis.biases.length})`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {analysis.biases.map((bias, idx) => (
          <div
            key={idx}
            style={{
              background: '#0a0a0a',
              borderRadius: 10,
              padding: 18,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
                {bias.biasType.replace(/_/g, ' ')}
              </span>
              <SeverityBadge severity={bias.severity} />
              <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
                {Math.round(bias.confidence * 100)}% confidence
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 10px', fontStyle: 'italic', lineHeight: 1.6, borderLeft: `2px solid ${sevColor(bias.severity)}30`, paddingLeft: 12 }}>
              &ldquo;{bias.excerpt}&rdquo;
            </p>
            <p style={{ color: '#cbd5e1', fontSize: 13, margin: '0 0 10px', lineHeight: 1.7 }}>
              {bias.explanation}
            </p>
            <p style={{ color: 'rgba(34, 197, 94, 0.8)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              <strong>Recommendation:</strong> {bias.suggestion}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function LogicTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <Section icon={<Scale size={16} />} title={`Logical Fallacies (${analysis.logicalFallacies.length})`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {analysis.logicalFallacies.map((f, idx) => (
          <div
            key={idx}
            style={{
              background: '#0a0a0a',
              borderRadius: 10,
              padding: 18,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{f.name}</span>
              <SeverityBadge severity={f.severity} />
              <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
                Logic Score: {f.score}/100
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 10px', fontStyle: 'italic', lineHeight: 1.6, borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: 12 }}>
              &ldquo;{f.excerpt}&rdquo;
            </p>
            <p style={{ color: '#cbd5e1', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
              {f.explanation}
            </p>
            {/* Score bar */}
            <div style={{ marginTop: 12, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ height: '100%', width: `${f.score}%`, borderRadius: 2, background: f.score >= 60 ? '#22c55e' : f.score >= 35 ? '#eab308' : '#ef4444', transition: 'width 0.3s' }} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SwotTab({ analysis }: { analysis: DemoAnalysis }) {
  const { swot } = analysis;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 16 }}>
        <SwotQuadrant title="Strengths" items={swot.strengths} color="#22c55e" />
        <SwotQuadrant title="Weaknesses" items={swot.weaknesses} color="#ef4444" />
        <SwotQuadrant title="Opportunities" items={swot.opportunities} color="#6366f1" />
        <SwotQuadrant title="Threats" items={swot.threats} color="#f97316" />
      </div>
      <Section icon={<Lightbulb size={16} />} title="Strategic Advice">
        <p style={{ color: '#cbd5e1', lineHeight: 1.8, margin: 0, fontSize: 14 }}>
          {swot.strategicAdvice}
        </p>
      </Section>
    </>
  );
}

function NoiseTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <>
      <Section icon={<Target size={16} />} title="Decision Noise Analysis">
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Decision noise measures inconsistency in the document&apos;s reasoning. A high noise score means
          the same facts could lead to wildly different conclusions depending on who reads it and when.
        </p>
        {/* Noise gauge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: analysis.noiseScore <= 30 ? '#22c55e' : analysis.noiseScore <= 60 ? '#eab308' : '#ef4444', lineHeight: 1 }}>
              {analysis.noiseScore}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>/ 100</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <StatPill label="Mean" value={analysis.noiseStats.mean.toString()} />
              <StatPill label="Std Dev" value={analysis.noiseStats.stdDev.toFixed(1)} />
              <StatPill label="Variance" value={analysis.noiseStats.variance.toFixed(0)} />
            </div>
            {/* Benchmark comparison */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {analysis.noiseBenchmarks.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', width: 120, flexShrink: 0 }}>{b.label}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: '100%', width: `${Math.min(b.value, 100)}%`, borderRadius: 3, background: i === 0 ? (b.value <= 30 ? '#22c55e' : b.value <= 60 ? '#eab308' : '#ef4444') : 'rgba(255,255,255,0.2)', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', width: 30, textAlign: 'right' }}>{b.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function ComplianceTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <>
      <Section icon={<Gavel size={16} />} title="Compliance Assessment">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {analysis.compliance.frameworks.map((fw, idx) => (
            <div
              key={idx}
              style={{
                background: '#0a0a0a',
                borderRadius: 10,
                padding: 18,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{fw.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '3px 10px',
                      borderRadius: 12,
                      background: `${statusColor(fw.status)}15`,
                      color: statusColor(fw.status),
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {statusLabel(fw.status)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: statusColor(fw.status) }}>{fw.score}/100</span>
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {fw.findings.map((finding, fi) => (
                  <li key={fi} style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 16, background: 'rgba(239, 68, 68, 0.06)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.15)' }}>
          <p style={{ color: '#e2e8f0', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
            <strong style={{ color: '#ef4444' }}>Overall Risk Assessment:</strong> {analysis.compliance.overallRisk}
          </p>
        </div>
      </Section>
    </>
  );
}

function PreMortemTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <Section icon={<Skull size={16} />} title="Pre-Mortem Analysis">
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
        Imagine it&apos;s 2 years from now and this decision has failed spectacularly. What went wrong?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {analysis.preMortem.scenarios.map((s, idx) => (
          <div
            key={idx}
            style={{
              background: '#0a0a0a',
              borderRadius: 10,
              padding: 18,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{s.title}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 10px',
                    borderRadius: 12,
                    background: 'rgba(234, 179, 8, 0.1)',
                    color: '#eab308',
                    fontWeight: 700,
                  }}
                >
                  {Math.round(s.probability * 100)}% likely
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 10px',
                    borderRadius: 12,
                    background: `${s.impact === 'catastrophic' ? '#ef4444' : s.impact === 'severe' ? '#f97316' : '#eab308'}15`,
                    color: s.impact === 'catastrophic' ? '#ef4444' : s.impact === 'severe' ? '#f97316' : '#eab308',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {s.impact}
                </span>
              </div>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function BoardroomTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <Section icon={<Users size={16} />} title="Boardroom Simulation \u2014 Decision Twins">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {analysis.simulation.twins.map((twin, idx) => {
          const voteColor =
            twin.vote === 'REJECT' ? '#ef4444' : twin.vote === 'CONDITIONAL APPROVE' ? '#eab308' : '#22c55e';
          return (
            <div
              key={idx}
              style={{
                background: '#0a0a0a',
                borderRadius: 10,
                padding: 16,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{twin.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{twin.role}</div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: `${voteColor}15`,
                    color: voteColor,
                    fontWeight: 700,
                  }}
                >
                  {twin.vote}
                </span>
              </div>
              {/* Confidence bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '100%', width: `${twin.confidence * 100}%`, borderRadius: 2, background: voteColor }} />
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{Math.round(twin.confidence * 100)}% confidence</div>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                {twin.rationale}
              </p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─── Shared UI Components ────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
  borderColor = 'rgba(255,255,255,0.08)',
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <div
      style={{
        background: '#111111',
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: 24,
        marginBottom: 16,
      }}
    >
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#fff',
        }}
      >
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function ScoreCard({
  label,
  value,
  sub,
  color,
  smallValue,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  smallValue?: boolean;
}) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '18px 14px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: smallValue ? 24 : 38, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function MiniCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        padding: '3px 10px',
        borderRadius: 12,
        background: `${sevColor(severity)}15`,
        color: sevColor(severity),
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {severity}
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span style={{ fontSize: 10, color: '#64748b' }}>{label} </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{value}</span>
    </div>
  );
}

function SwotQuadrant({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 18,
        borderTop: `3px solid ${color}`,
      }}
    >
      <h4 style={{ fontSize: 13, fontWeight: 700, color, margin: '0 0 12px', letterSpacing: '0.03em' }}>
        {title}
      </h4>
      <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <li key={i} style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.6 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
