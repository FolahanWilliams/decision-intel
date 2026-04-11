'use client';

import { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  DECISION_ALPHA_ANALYSES,
  getLeaderboard,
  getAlphaStatistics,
} from '@/lib/data/decision-alpha';
import type { PublicCompanyAnalysis } from '@/lib/data/decision-alpha';
import { formatBias } from './shared-styles';

// ─── Styles ──────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  background: 'var(--bg-secondary, #111)',
  border: '1px solid var(--border-primary, #222)',
  marginBottom: 16,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--text-primary, #fff)',
  marginBottom: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const bodyText: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary, #b4b4bc)',
  lineHeight: 1.65,
};

const subLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  color: 'var(--text-muted, #71717a)',
  marginBottom: 4,
  marginTop: 10,
};

// ─── Grade Colors ────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
};

function gradeBadge(grade: string, score: number): React.ReactNode {
  const color = GRADE_COLORS[grade] ?? '#71717a';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 700,
        background: `${color}15`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {grade} ({score})
    </span>
  );
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'medium':
      return '#eab308';
    case 'low':
      return '#84cc16';
    default:
      return '#71717a';
  }
}

function returnIndicator(val: number | undefined): React.ReactNode {
  if (val === undefined) return <Minus size={12} style={{ color: '#71717a' }} />;
  const color = val > 0 ? '#22c55e' : val < 0 ? '#ef4444' : '#71717a';
  const Icon = val > 0 ? ArrowUpRight : val < 0 ? ArrowDownRight : Minus;
  return (
    <span
      style={{
        color,
        fontWeight: 600,
        fontSize: 13,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Icon size={12} />
      {val > 0 ? '+' : ''}
      {val.toFixed(1)}%
    </span>
  );
}

// ─── Expanded Analysis Card ──────────────────────────────────────────────────

function AnalysisDetail({ analysis }: { analysis: PublicCompanyAnalysis }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        background: 'var(--bg-tertiary, #0a0a0a)',
        border: '1px solid var(--border-primary, #222)',
        marginTop: 8,
        marginBottom: 12,
      }}
    >
      {/* Summary */}
      <div style={subLabel}>Summary</div>
      <div style={{ ...bodyText, marginBottom: 16 }}>{analysis.summary}</div>

      {/* DQI Component Breakdown */}
      <div style={subLabel}>DQI Component Breakdown</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {(
          [
            ['Bias Load', analysis.dqiComponents.biasLoad, '28%'],
            ['Noise Level', analysis.dqiComponents.noiseLevel, '18%'],
            ['Evidence Quality', analysis.dqiComponents.evidenceQuality, '18%'],
            ['Process Maturity', analysis.dqiComponents.processMaturity, '13%'],
            ['Compliance Risk', analysis.dqiComponents.complianceRisk, '13%'],
            ['Historical Alignment', analysis.dqiComponents.historicalAlignment, '10%'],
          ] as [string, number, string][]
        ).map(([name, score, weight]) => (
          <div
            key={name}
            style={{
              padding: 10,
              borderRadius: 6,
              background: 'var(--bg-secondary, #111)',
              border: '1px solid var(--border-primary, #222)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-muted, #71717a)', marginBottom: 4 }}>
              {name} ({weight})
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: GRADE_COLORS[score >= 70 ? 'B' : score >= 55 ? 'C' : 'D'] ?? '#71717a',
              }}
            >
              {score}
            </div>
          </div>
        ))}
      </div>

      {/* Bias Excerpts */}
      <div style={subLabel}>Detected Biases with Excerpts</div>
      {analysis.biasExcerpts.map((be, i) => (
        <div
          key={i}
          style={{
            padding: 12,
            borderRadius: 6,
            background: 'var(--bg-secondary, #111)',
            border: `1px solid ${severityColor(be.severity)}25`,
            marginBottom: 8,
            borderLeft: `3px solid ${severityColor(be.severity)}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: severityColor(be.severity),
                textTransform: 'uppercase',
              }}
            >
              {be.severity}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
              {formatBias(be.biasType)}
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              color: 'var(--text-secondary, #b4b4bc)',
              padding: '8px 12px',
              borderRadius: 4,
              background: 'var(--bg-tertiary, #0a0a0a)',
              marginBottom: 8,
              borderLeft: '2px solid var(--border-primary, #333)',
            }}
          >
            &ldquo;{be.excerpt}&rdquo;
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #71717a)', lineHeight: 1.6 }}>
            {be.explanation}
          </div>
        </div>
      ))}

      {/* Toxic Combinations */}
      {analysis.toxicCombinations.length > 0 && (
        <>
          <div style={subLabel}>Toxic Combinations Detected</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {analysis.toxicCombinations.map(tc => (
              <span
                key={tc}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: '#ef444415',
                  color: '#ef4444',
                  border: '1px solid #ef444430',
                }}
              >
                <AlertTriangle size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                {tc}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Beneficial Patterns */}
      {analysis.beneficialPatterns.length > 0 && (
        <>
          <div style={subLabel}>Beneficial Patterns</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {analysis.beneficialPatterns.map(bp => (
              <span
                key={bp}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: '#22c55e15',
                  color: '#22c55e',
                  border: '1px solid #22c55e30',
                }}
              >
                {bp}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Stock Performance */}
      {analysis.stockPerformance && (
        <>
          <div style={subLabel}>Stock Performance</div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-muted, #71717a)' }}>
              Price at filing:{' '}
              <span style={{ color: 'var(--text-primary, #fff)', fontWeight: 600 }}>
                ${analysis.stockPerformance.priceAtFiling.toLocaleString()}
              </span>
            </div>
            {analysis.stockPerformance.return6mo !== undefined && (
              <div style={{ fontSize: 12, color: 'var(--text-muted, #71717a)' }}>
                6mo return: {returnIndicator(analysis.stockPerformance.return6mo)}
                {analysis.stockPerformance.sp500Return6mo !== undefined && (
                  <span style={{ marginLeft: 4, fontSize: 11, color: '#71717a' }}>
                    (S&P: {analysis.stockPerformance.sp500Return6mo > 0 ? '+' : ''}
                    {analysis.stockPerformance.sp500Return6mo}%)
                  </span>
                )}
              </div>
            )}
            {analysis.stockPerformance.return12mo !== undefined && (
              <div style={{ fontSize: 12, color: 'var(--text-muted, #71717a)' }}>
                12mo return: {returnIndicator(analysis.stockPerformance.return12mo)}
                {analysis.stockPerformance.sp500Return12mo !== undefined && (
                  <span style={{ marginLeft: 4, fontSize: 11, color: '#71717a' }}>
                    (S&P: {analysis.stockPerformance.sp500Return12mo > 0 ? '+' : ''}
                    {analysis.stockPerformance.sp500Return12mo}%)
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Content Angles */}
      <div style={subLabel}>Content Angles for Content Studio</div>
      <ul style={{ margin: 0, paddingLeft: 18, marginBottom: 12 }}>
        {analysis.contentAngles.map((angle, i) => (
          <li
            key={i}
            style={{
              fontSize: 12,
              color: 'var(--text-secondary, #b4b4bc)',
              marginBottom: 4,
              lineHeight: 1.5,
            }}
          >
            {angle}
          </li>
        ))}
      </ul>

      {/* Lessons Learned */}
      <div style={subLabel}>Key Insights</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {analysis.lessonsLearned.map((lesson, i) => (
          <li
            key={i}
            style={{
              fontSize: 12,
              color: 'var(--text-secondary, #b4b4bc)',
              marginBottom: 4,
              lineHeight: 1.5,
            }}
          >
            {lesson}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DecisionAlphaTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const leaderboard = getLeaderboard();
  const stats = getAlphaStatistics();

  return (
    <div>
      {/* Hero Card */}
      <div style={card}>
        <div style={sectionTitle}>
          <TrendingUp size={18} style={{ color: '#06b6d4' }} />
          Decision Alpha: Bias Signals from Public Markets
        </div>
        <div style={{ ...bodyText, marginBottom: 16 }}>
          Decision Alpha applies the DQI engine to public CEO communications — annual shareholder
          letters, earnings call transcripts, and SEC filings. By analyzing the cognitive bias
          signatures in how leaders communicate their strategic decisions, we can score decision
          quality and correlate it with company performance. This is the same engine used for IC
          memos and board documents — now applied to the most scrutinized documents in public
          markets.
        </div>

        {/* Stat Badges */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'CEOs Analyzed', value: stats.totalAnalyses, color: '#06b6d4' },
            {
              label: 'Average DQI',
              value: stats.avgDqi,
              color: stats.avgDqi >= 70 ? '#22c55e' : stats.avgDqi >= 55 ? '#eab308' : '#f97316',
            },
            { label: 'Avg Biases / Filing', value: stats.avgBiasesPerAnalysis, color: '#8b5cf6' },
            {
              label: 'Toxic Combos Found',
              value: stats.topToxicCombos.reduce((sum, [, c]) => sum + c, 0),
              color: '#ef4444',
            },
          ].map(s => (
            <div
              key={s.label}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                background: `${s.color}08`,
                border: `1px solid ${s.color}20`,
                textAlign: 'center',
                minWidth: 120,
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-muted, #71717a)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CEO DQI Leaderboard */}
      <div style={card}>
        <div style={sectionTitle}>
          <BarChart3 size={18} style={{ color: '#06b6d4' }} />
          CEO Decision Quality Leaderboard
        </div>
        <div style={{ ...bodyText, marginBottom: 16 }}>
          Ranked by Decision Quality Index (DQI). Click any row to expand the full bias analysis.
        </div>

        {/* Header Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 1fr 80px 100px 80px 1fr',
            gap: 8,
            padding: '8px 12px',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-muted, #71717a)',
            borderBottom: '1px solid var(--border-primary, #222)',
          }}
        >
          <div>#</div>
          <div>CEO</div>
          <div>Company</div>
          <div>Ticker</div>
          <div>DQI</div>
          <div>Biases</div>
          <div>Top Toxic Combo</div>
        </div>

        {/* Leaderboard Rows */}
        {leaderboard.map((analysis, _idx) => {
          const isExpanded = expandedId === analysis.id;
          return (
            <div key={analysis.id}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : analysis.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 1fr 80px 100px 80px 1fr',
                  gap: 8,
                  padding: '12px 12px',
                  fontSize: 13,
                  color: 'var(--text-secondary, #b4b4bc)',
                  borderBottom: isExpanded ? 'none' : '1px solid var(--border-primary, #222)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  borderRadius: isExpanded ? '8px 8px 0 0' : 0,
                  background: isExpanded ? 'var(--bg-tertiary, #0a0a0a)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!isExpanded)
                    (e.currentTarget as HTMLDivElement).style.background =
                      'var(--bg-tertiary, #0a0a0a)';
                }}
                onMouseLeave={e => {
                  if (!isExpanded)
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-muted, #71717a)' }}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
                  {analysis.ceoName}
                </div>
                <div>{analysis.company}</div>
                <div style={{ fontWeight: 600 }}>{analysis.ticker}</div>
                <div>{gradeBadge(analysis.dqiGrade, analysis.dqiScore)}</div>
                <div style={{ textAlign: 'center' }}>{analysis.biasesPresent.length}</div>
                <div>
                  {analysis.toxicCombinations.length > 0 ? (
                    <span style={{ color: '#ef4444', fontSize: 12 }}>
                      <AlertTriangle
                        size={11}
                        style={{ verticalAlign: 'middle', marginRight: 4 }}
                      />
                      {analysis.toxicCombinations[0]}
                    </span>
                  ) : (
                    <span style={{ color: '#22c55e', fontSize: 12 }}>None detected</span>
                  )}
                </div>
              </div>
              {isExpanded && <AnalysisDetail analysis={analysis} />}
            </div>
          );
        })}
      </div>

      {/* Headline Hooks */}
      <div style={card}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#f59e0b' }} />
          Headline Hooks for Content
        </div>
        <div style={{ ...bodyText, marginBottom: 12 }}>
          Pre-written hooks for LinkedIn, Twitter, and blog content. Use these in Content Studio
          with the &quot;Decision Alpha&quot; pillar.
        </div>
        {DECISION_ALPHA_ANALYSES.map(a => (
          <div
            key={a.id}
            style={{
              padding: 12,
              borderRadius: 6,
              background: 'var(--bg-tertiary, #0a0a0a)',
              border: '1px solid var(--border-primary, #222)',
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: '#06b6d4', marginBottom: 4 }}>
              {a.ceoName} / {a.ticker}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary, #b4b4bc)', lineHeight: 1.5 }}>
              {a.headlineHook}
            </div>
          </div>
        ))}
      </div>

      {/* Methodology Notes */}
      <div style={card}>
        <div style={sectionTitle}>
          <Brain size={18} style={{ color: '#8b5cf6' }} />
          Methodology: DQI for CEO Communications
        </div>
        <div style={bodyText}>
          <strong style={{ color: 'var(--text-primary, #fff)' }}>What we analyze:</strong> The
          linguistic and cognitive patterns in CEO public communications — annual letters, earnings
          calls, SEC filings. The same 20-bias detection engine and 20x20 compound scoring matrix
          used for IC memos is applied to these public documents.
        </div>
        <div style={{ ...bodyText, marginTop: 12 }}>
          <strong style={{ color: 'var(--text-primary, #fff)' }}>Scoring adjustments:</strong>{' '}
          Public CEO communications lack certain signals available in internal documents (committee
          process, dissent presence, prior submissions). The Process Maturity component is therefore
          scored based on linguistic indicators: acknowledgment of uncertainty, consideration of
          alternatives, explicit error attribution, and stakeholder diversity referenced. Evidence
          Quality relies on specificity of claims vs. vague assertions.
        </div>
        <div style={{ ...bodyText, marginTop: 12 }}>
          <strong style={{ color: 'var(--text-primary, #fff)' }}>Important caveat:</strong> CEO
          letters are crafted communications, often reviewed by legal and IR teams. Detected biases
          may reflect strategic narrative choices rather than genuine cognitive biases. However,
          research shows that CEO communication patterns correlate with actual decision-making style
          (Hambrick &amp; Mason, 1984; Chatterjee &amp; Hambrick, 2007). The signal is in the
          pattern across multiple filings, not any single excerpt.
        </div>
      </div>

      {/* Roadmap Preview */}
      <div style={card}>
        <div style={sectionTitle}>
          <Target size={18} style={{ color: '#06b6d4' }} />
          Decision Alpha Roadmap
        </div>
        {[
          {
            phase: 'Phase 1 (Current)',
            desc: '4 curated CEO analyses (Buffett, Musk, Huang, Zuckerberg). Content generation via Content Studio. Proof-of-concept for DQI on public markets.',
            color: '#22c55e',
          },
          {
            phase: 'Phase 2',
            desc: 'Automated EDGAR scraper for 10-K filings. S&P 500 quarterly analysis. Public DQI Leaderboard page. 6 additional CEOs (Bezos, Dimon, Cook, Jassy, Pichai, Nadella).',
            color: '#eab308',
          },
          {
            phase: 'Phase 3',
            desc: 'Historical backtesting: 2015-2025 filings mapped to stock performance. "Decision Alpha" correlation dataset. Accuracy metrics published.',
            color: '#f97316',
          },
          {
            phase: 'Phase 4',
            desc: 'API for quant funds and alternative data providers. Alert service for portfolio managers. Bloomberg/FactSet integration.',
            color: '#8b5cf6',
          },
        ].map(p => (
          <div
            key={p.phase}
            style={{
              padding: 12,
              borderRadius: 6,
              background: 'var(--bg-tertiary, #0a0a0a)',
              border: '1px solid var(--border-primary, #222)',
              marginBottom: 8,
              borderLeft: `3px solid ${p.color}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 4 }}>
              {p.phase}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #b4b4bc)', lineHeight: 1.5 }}>
              {p.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
