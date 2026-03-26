'use client';

import Link from 'next/link';
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
  CheckCircle2,
} from 'lucide-react';
import { DEMO_ANALYSIS } from './data';

const sevColor = (severity: string) =>
  severity === 'critical'
    ? '#ef4444'
    : severity === 'high'
      ? '#f97316'
      : severity === 'medium'
        ? '#eab308'
        : '#22c55e';

export default function DemoPage() {
  const analysis = DEMO_ANALYSIS;

  const scoreColor =
    analysis.overallScore >= 70 ? '#22c55e' : analysis.overallScore >= 40 ? '#eab308' : '#ef4444';

  const noiseColor =
    analysis.noiseScore <= 30 ? '#22c55e' : analysis.noiseScore <= 60 ? '#eab308' : '#ef4444';

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
            maxWidth: 900,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <Shield size={18} style={{ color: '#fff' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              <span style={{ color: '#fff' }}>Decision</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>Intel</span>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
              DEMO ANALYSIS
            </span>
            <Link
              href="/login"
              style={{
                fontSize: 13,
                padding: '6px 16px',
                borderRadius: '8px',
                background: '#fff',
                color: '#000',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
            >
              Try Your Own Document
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Document Info + Scores */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FileText size={20} style={{ color: '#64748b' }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
              {analysis.documentName}
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px' }}>
            Original document date: September 2, 2013 &middot; Analyzed by Decision Intel
          </p>

          {/* Score Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            <div
              style={{
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{ fontSize: 11, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}
              >
                DECISION QUALITY
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                {analysis.overallScore}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>/ 100</div>
            </div>
            <div
              style={{
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{ fontSize: 11, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}
              >
                NOISE SCORE
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, color: noiseColor, lineHeight: 1 }}>
                {analysis.noiseScore}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>High inconsistency</div>
            </div>
            <div
              style={{
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{ fontSize: 11, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}
              >
                BIASES DETECTED
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>
                {analysis.biases.length}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>1 critical, 3 high</div>
            </div>
            <div
              style={{
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{ fontSize: 11, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}
              >
                BOARD VERDICT
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444', lineHeight: 1.2 }}>
                REJECT
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>3 of 4 reject</div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <Section icon={<BarChart3 size={16} />} title="Executive Summary">
          <p style={{ color: '#cbd5e1', lineHeight: 1.8, margin: 0, fontSize: 14 }}>
            {analysis.summary}
          </p>
        </Section>

        {/* Meta Verdict */}
        <Section
          icon={<AlertTriangle size={16} style={{ color: '#ef4444' }} />}
          title="Meta Verdict"
          borderColor="rgba(239, 68, 68, 0.2)"
        >
          <p style={{ color: '#cbd5e1', lineHeight: 1.8, margin: 0, fontSize: 14 }}>
            {analysis.metaVerdict}
          </p>
        </Section>

        {/* Cognitive Biases */}
        <Section
          icon={<Brain size={16} />}
          title={`Cognitive Biases Detected (${analysis.biases.length})`}
        >
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
                  <span
                    style={{
                      fontSize: 10,
                      padding: '3px 10px',
                      borderRadius: 12,
                      background: `${sevColor(bias.severity)}15`,
                      color: sevColor(bias.severity),
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {bias.severity}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
                    {Math.round(bias.confidence * 100)}% confidence
                  </span>
                </div>
                <p
                  style={{
                    color: '#94a3b8',
                    fontSize: 13,
                    margin: '0 0 10px',
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                    borderLeft: `2px solid ${sevColor(bias.severity)}30`,
                    paddingLeft: 12,
                  }}
                >
                  &ldquo;{bias.excerpt}&rdquo;
                </p>
                <p
                  style={{
                    color: '#cbd5e1',
                    fontSize: 13,
                    margin: '0 0 10px',
                    lineHeight: 1.7,
                  }}
                >
                  {bias.explanation}
                </p>
                <p
                  style={{
                    color: 'rgba(34, 197, 94, 0.8)',
                    fontSize: 13,
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  <strong>Recommendation:</strong> {bias.suggestion}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Boardroom Simulation */}
        <Section icon={<Users size={16} />} title="Boardroom Simulation \u2014 Decision Twins">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            {analysis.simulation.twins.map((twin, idx) => {
              const voteColor =
                twin.vote === 'REJECT'
                  ? '#ef4444'
                  : twin.vote === 'CONDITIONAL APPROVE'
                    ? '#eab308'
                    : '#22c55e';
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
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>
                        {twin.name}
                      </div>
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
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                    {twin.rationale}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* What the Full Dashboard Shows */}
        <div
          style={{
            marginTop: 48,
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '32px 28px',
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 8,
            }}
          >
            This is just the summary. The full dashboard includes:
          </h3>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
            When you run your own analysis, you get an interactive dashboard with all of these and
            more.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {[
              {
                icon: <Users size={20} />,
                title: 'Interactive Boardroom',
                desc: 'AI Decision Twins debate your strategy from CFO, Risk, Growth, and Strategy perspectives',
              },
              {
                icon: <Target size={20} />,
                title: 'Outcome Tracking',
                desc: 'Log actual outcomes and watch your calibration accuracy improve over time',
              },
              {
                icon: <TrendingUp size={20} />,
                title: 'Decision Knowledge Graph',
                desc: 'See how decisions cascade and compound across your organization',
              },
              {
                icon: <CheckCircle2 size={20} />,
                title: 'Compliance Mapping',
                desc: 'Auto-mapped to FCA Consumer Duty, SOX, Basel III, and EU AI Act frameworks',
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 6 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 48,
            textAlign: 'center',
            padding: '40px 24px',
            borderRadius: 16,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
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
            Upload any strategic document &mdash; board memo, M&amp;A rationale, investment thesis,
            market analysis &mdash; and get a comprehensive cognitive bias audit in minutes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/login"
              style={{
                padding: '12px 28px',
                borderRadius: 10,
                background: '#fff',
                color: '#000',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Start Free{' '}
              <ArrowRight
                size={14}
                style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }}
              />
            </Link>
            <Link
              href="/#pricing"
              style={{
                padding: '12px 28px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              View Pricing
            </Link>
          </div>
          <p style={{ color: '#475569', fontSize: 11, marginTop: 16 }}>
            No credit card required &middot; 3 free analyses &middot; 14-day trial on paid plans
          </p>
        </div>

        {/* Disclaimer */}
        <p
          style={{
            color: '#334155',
            fontSize: 11,
            textAlign: 'center',
            marginTop: 32,
            lineHeight: 1.6,
          }}
        >
          This demo analysis is based on publicly available information about the Microsoft-Nokia
          acquisition. The analysis was generated by Decision Intel&apos;s cognitive bias detection
          engine to demonstrate product capabilities. It is not financial or investment advice.
        </p>
      </div>
    </div>
  );
}

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
        marginBottom: 20,
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
