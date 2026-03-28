'use client';

import { useState } from 'react';
import {
  Rocket,
  Brain,
  BarChart3,
  Plug,
  Shield,
  BookOpen,
  ChevronRight,
  Target,
  Users,
  FileText,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Network,
  MessageSquare,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'pipeline' | 'scoring' | 'integrations' | 'moat' | 'playbook';

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Product Overview', icon: <Rocket size={16} /> },
  { id: 'pipeline', label: 'Analysis Pipeline', icon: <Brain size={16} /> },
  { id: 'scoring', label: 'Scoring Engine', icon: <BarChart3 size={16} /> },
  { id: 'integrations', label: 'Integrations & Flywheel', icon: <Plug size={16} /> },
  { id: 'moat', label: 'Competitive Moat', icon: <Shield size={16} /> },
  { id: 'playbook', label: 'Founder Playbook', icon: <BookOpen size={16} /> },
];

// ─── Shared Styles ──────────────────────────────────────────────────────────

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

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  color: 'var(--text-muted, #71717a)',
  marginBottom: 6,
};

const stat: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: 'var(--text-primary, #fff)',
};

const badge = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  background: `${color}15`,
  color,
  border: `1px solid ${color}30`,
});

const tableRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 2fr 2fr',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid var(--border-primary, #222)',
  fontSize: 13,
};

// ─── Tab Content: Product Overview ──────────────────────────────────────────

function ProductOverview() {
  return (
    <div>
      {/* Hero */}
      <div style={{ ...card, borderTop: '3px solid #6366f1' }}>
        <div style={label}>POSITIONING</div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-primary, #fff)',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          The Cognitive Bias Audit Engine for PE/VC Investment Committees
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary, #b4b4bc)', lineHeight: 1.6 }}>
          Quantify decision noise. Eliminate cognitive bias. Protect fund returns. AI-powered
          cognitive auditing purpose-built for high-stakes capital allocation decisions.
        </p>
      </div>

      {/* Key Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { value: '20', label: 'Standard Biases', sub: '+ 11 PE-specific' },
          { value: '15', label: 'AI Agent Pipeline', sub: 'Parallel execution' },
          { value: '113', label: 'Failure Cases', sub: '8 industries' },
          { value: '3', label: 'Outcome Channels', sub: 'Autonomous detection' },
        ].map((m, i) => (
          <div key={i} style={card}>
            <div style={stat}>{m.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
              {m.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* The Problem */}
      <div style={card}>
        <div style={sectionTitle}>
          <AlertTriangle size={18} style={{ color: '#ef4444' }} /> The Problem
        </div>
        <ul
          style={{
            fontSize: 13,
            color: 'var(--text-secondary, #b4b4bc)',
            lineHeight: 1.8,
            paddingLeft: 16,
          }}
        >
          <li>
            PE/VC ICs make $50M-$500M decisions on documents riddled with cognitive biases nobody
            detects
          </li>
          <li>A single bad deal costs 1-3x ticket size in opportunity cost</li>
          <li>IC members anchored to entry valuations hold losers 40% longer than optimal</li>
          <li>
            Competitive auctions trigger winner&apos;s curse in 65% of cases (Malmendier &amp; Tate,
            2008)
          </li>
          <li>
            Confirmation bias in DD causes teams to rubber-stamp rather than stress-test theses
          </li>
          <li>
            No committee has a way to track which biases actually correlated with poor IRR/MOIC
          </li>
        </ul>
      </div>

      {/* Value Prop by Persona */}
      <div style={card}>
        <div style={sectionTitle}>
          <Users size={18} style={{ color: '#3b82f6' }} /> Value by Persona
        </div>
        <div
          style={{
            ...tableRow,
            fontWeight: 700,
            color: 'var(--text-primary, #fff)',
            borderBottom: '2px solid var(--border-primary, #222)',
          }}
        >
          <div>Persona</div>
          <div>Pain Point</div>
          <div>What We Deliver</div>
        </div>
        {[
          [
            'Managing Partners',
            'No systematic IC quality measurement',
            'Deal-level DQI scoring (0-100), bias tracking across vintage',
          ],
          [
            'Deal Partners',
            'IC memos anchored to entry thesis',
            '11 PE biases detected with exact excerpts + coaching',
          ],
          [
            'Operating Partners',
            'Operational optimism in execution plans',
            'Boardroom simulation with PE personas (GP, LP, Risk, Sector)',
          ],
          [
            'LP Relations',
            'Fund reports cherry-pick metrics',
            'LP report analysis: survivorship bias, selective reporting, framing',
          ],
          [
            'IC Members',
            'Groupthink silences genuine debate',
            'Blind IC voting, noise measurement, dissent tracking',
          ],
        ].map(([persona, pain, deliver], i) => (
          <div key={i} style={{ ...tableRow, color: 'var(--text-secondary, #b4b4bc)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary, #fff)' }}>{persona}</div>
            <div>{pain}</div>
            <div>{deliver}</div>
          </div>
        ))}
      </div>

      {/* ROI */}
      <div style={{ ...card, borderLeft: '3px solid #22c55e' }}>
        <div style={sectionTitle}>
          <TrendingUp size={18} style={{ color: '#22c55e' }} /> ROI Story
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary, #b4b4bc)', lineHeight: 1.7 }}>
          A single avoided bad deal saves <strong style={{ color: '#22c55e' }}>$50M-$500M</strong>{' '}
          in capital. The platform pays for itself after one corrected thesis. Organizations using
          systematic decision hygiene report{' '}
          <strong style={{ color: '#22c55e' }}>up to 60% reduction</strong> in decision variance.
        </p>
      </div>
    </div>
  );
}

// ─── Tab Content: Core Analysis Pipeline ────────────────────────────────────

function CorePipeline() {
  return (
    <div>
      {/* Pipeline Diagram */}
      <div style={card}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#f59e0b' }} /> 15-Agent Analysis Pipeline
        </div>
        <pre
          style={{
            fontSize: 12,
            color: 'var(--text-secondary, #b4b4bc)',
            background: 'var(--bg-tertiary, #0a0a0a)',
            padding: 16,
            borderRadius: 8,
            overflow: 'auto',
            lineHeight: 1.6,
          }}
        >
          {`PREPROCESSING (Sequential)
  [GDPR Anonymizer] ──> [Data Structurer] ──> [Intelligence Gatherer]

ANALYSIS (Parallel Fan-Out)
  ├── [Bias Detective]      ── 20 cognitive biases + 11 PE-specific
  ├── [Noise Judge x3]      ── Statistical jury (3 independent models)
  ├── [Fact Checker]        ── Finnhub + Google Search grounding
  ├── [Pre-Mortem]          ── Failure scenarios + preventive measures
  ├── [Compliance Mapper]   ── FCA, SOX, Basel III, EU AI Act
  ├── [Deep Analysis]       ── Logical fallacies, SWOT, blind spots
  ├── [Verification Agent]  ── Cross-reference claims vs real-time data
  └── [Sentiment Analyzer]  ── Emotional tone scoring

SYNTHESIS (Sequential)
  [Meta Judge] ──> [Risk Scorer] ──> [Boardroom Simulation] ──> END`}
        </pre>
      </div>

      {/* Bias Detection */}
      <div style={card}>
        <div style={sectionTitle}>
          <Brain size={18} style={{ color: '#8b5cf6' }} /> Cognitive Bias Detection
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={label}>STANDARD BIASES (20)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {[
                'Confirmation',
                'Anchoring',
                'Availability',
                'Framing',
                'Status Quo',
                'Halo Effect',
                "Gambler's Fallacy",
                'Groupthink',
                'Authority',
                'Bandwagon',
                'Overconfidence',
                'Planning Fallacy',
                'Hindsight',
                'Loss Aversion',
                'Sunk Cost',
                'Selective Perception',
                'Cognitive Misering',
                'Zeigarnik',
                'Paradox of Choice',
                'Recency',
              ].map(b => (
                <span key={b} style={badge('#8b5cf6')}>
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div style={label}>PE-SPECIFIC BIASES (11)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {[
                'Entry Price Anchor',
                'Thesis Confirmation',
                'Sunk Cost Holds',
                'Survivorship',
                'Herd Behavior',
                'Disposition Effect',
                'Projection Overconfidence',
                'Narrative Fallacy',
                "Winner's Curse",
                'Management Halo',
                'Carry Incentive',
              ].map(b => (
                <span key={b} style={badge('#f59e0b')}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Other Pipeline Components */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={card}>
          <div style={sectionTitle}>
            <Target size={16} style={{ color: '#ef4444' }} /> Noise Measurement
          </div>
          <ul
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 14,
            }}
          >
            <li>3 independent AI judges score same document</li>
            <li>Mean score, standard deviation, variance</li>
            <li>Internal vs market benchmarks</li>
            <li>Classification: low / moderate / high / critical</li>
            <li>
              Based on Kahneman&apos;s <em>Noise</em> methodology
            </li>
          </ul>
        </div>
        <div style={card}>
          <div style={sectionTitle}>
            <CheckCircle size={16} style={{ color: '#22c55e' }} /> Fact-Checking
          </div>
          <ul
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 14,
            }}
          >
            <li>Finnhub API — stock prices, financials</li>
            <li>Google Search Grounding — real-time web</li>
            <li>Verdict: VERIFIED / CONTRADICTED / UNVERIFIABLE</li>
            <li>Trust score (0-100%) with source attribution</li>
          </ul>
        </div>
        <div style={card}>
          <div style={sectionTitle}>
            <FileText size={16} style={{ color: '#3b82f6' }} /> Compliance Mapping
          </div>
          <ul
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 14,
            }}
          >
            <li>FCA Consumer Duty — suitability</li>
            <li>SOX — internal controls</li>
            <li>Basel III — regulatory capital</li>
            <li>EU AI Act — automated decision risk</li>
            <li>SEC Reg D — investor protection</li>
            <li>GDPR — PII anonymized before analysis</li>
            <li>Output: PASS / WARN / FAIL + remediation</li>
          </ul>
        </div>
        <div style={card}>
          <div style={sectionTitle}>
            <Users size={16} style={{ color: '#a78bfa' }} /> Boardroom Simulation
          </div>
          <ul
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 14,
            }}
          >
            <li>5 PE-specific IC personas auto-selected</li>
            <li>Individual votes: APPROVE / REJECT / REVISE</li>
            <li>Dissent patterns and minority concerns</li>
            <li>Custom personas with configurable risk tolerance</li>
            <li>Twin Effectiveness: tracks which twins&apos; dissent was accurate</li>
            <li>Causal integration: personas briefed on org bias history</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Placeholder for remaining tabs (Batch 2 & 3) ──────────────────────────

function ScoringEngine() {
  return (
    <div>
      {/* DQI */}
      <div style={{ ...card, borderTop: '3px solid #6366f1' }}>
        <div style={sectionTitle}>
          <BarChart3 size={18} style={{ color: '#6366f1' }} /> Decision Quality Index (DQI)
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Branded 0-100 composite score (like FICO for decisions) with A-F letter grades.
        </p>
        <div
          style={{
            ...tableRow,
            fontWeight: 700,
            color: 'var(--text-primary)',
            gridTemplateColumns: '2fr 1fr 3fr',
            borderBottom: '2px solid var(--border-primary, #222)',
          }}
        >
          <div>Component</div>
          <div>Weight</div>
          <div>Measures</div>
        </div>
        {[
          ['Bias Load', '30%', 'Severity-weighted bias count vs document complexity'],
          ['Noise Level', '20%', 'Inter-judge variance from triple-judge noise measurement'],
          ['Evidence Quality', '20%', 'Fact-check verification rate and source reliability'],
          ['Process Maturity', '15%', 'Prior submitted, outcomes tracked, dissent present'],
          ['Compliance Risk', '15%', 'Regulatory framework violation score'],
        ].map(([comp, weight, measures], i) => (
          <div
            key={i}
            style={{
              ...tableRow,
              color: 'var(--text-secondary)',
              gridTemplateColumns: '2fr 1fr 3fr',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{comp}</div>
            <div>
              <span style={badge('#6366f1')}>{weight}</span>
            </div>
            <div>{measures}</div>
          </div>
        ))}
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          Grades: A (85-100), B (70-84), C (55-69), D (40-54), F (0-39)
        </div>
      </div>

      {/* Compound Scoring */}
      <div style={card}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#f59e0b' }} /> Compound Scoring Engine
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Deterministic post-LLM scoring that transforms raw bias detections into calibrated,
          context-adjusted risk scores. This is proprietary IP — competitors can call the same LLMs
          but cannot replicate the math.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              title: '20x20 Interaction Matrix',
              desc: '400 empirically-grounded pairwise weights (e.g., confirmation + groupthink = 1.35x amplification)',
            },
            {
              title: 'Context Multipliers',
              desc: 'Monetary stakes (1.0-1.6x), absent dissent (+0.25), time pressure (+0.15), group size effects',
            },
            {
              title: 'Detectability Weighting',
              desc: 'Hard-to-detect biases found at high confidence get 3-8% severity boost',
            },
            {
              title: 'Biological Signal Detection',
              desc: 'Winner Effect (success-streak, 1.2x overconfidence) + Cortisol/Stress (crisis language, 1.18x System 1)',
            },
            {
              title: 'Confidence Decay',
              desc: 'Sigmoid temporal decay — documents >6 months get progressively reduced confidence',
            },
            {
              title: 'Org Calibration',
              desc: 'Per-organization learned weights from historical outcomes adjust severity',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{ padding: 12, borderRadius: 8, background: 'var(--bg-tertiary, #0a0a0a)' }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                {item.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toxic Combinations + Bayesian + Causal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={card}>
          <div style={sectionTitle}>
            <AlertTriangle size={16} style={{ color: '#ef4444' }} /> Toxic Combination Detection
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Wiz-inspired: surfaces only top ~5% of risky decisions, eliminating alert fatigue.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {[
              'Echo Chamber',
              'Sunk Ship',
              'Blind Sprint',
              'Yes Committee',
              'Optimism Trap',
              'Status Quo Lock',
              'Recency Spiral',
            ].map(p => (
              <span key={p} style={badge('#ef4444')}>
                {p}
              </span>
            ))}
          </div>
          <ul
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              lineHeight: 1.7,
              paddingLeft: 14,
              marginTop: 8,
            }}
          >
            <li>Context amplifiers: monetary stakes, absent dissent, time pressure</li>
            <li>Org-calibrated: thresholds adjust from your outcome data</li>
            <li>Historical failure rates from 113-case database</li>
          </ul>
        </div>
        <div style={card}>
          <div style={sectionTitle}>
            <Brain size={16} style={{ color: '#8b5cf6' }} /> Bayesian Prior Integration
          </div>
          <ul
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 14,
            }}
          >
            <li>
              <strong>Decision Prior</strong> — capture pre-analysis belief + confidence
            </li>
            <li>
              <strong>Posterior Confidence</strong> — research-backed base rates combined with LLM
              detection
            </li>
            <li>
              <strong>Belief Delta</strong> — measures how much analysis shifted the decision-maker
            </li>
            <li>
              <strong>Information Gain</strong> — KL divergence quantifying new information
            </li>
            <li>
              <strong>Per-Bias Adjustment</strong> — individual prior/posterior with direction +
              reasoning
            </li>
          </ul>
        </div>
      </div>

      {/* Causal AI + Cross-Case */}
      <div style={card}>
        <div style={sectionTitle}>
          <Network size={18} style={{ color: '#22c55e' }} /> Causal AI Layer
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Organization-specific Structural Causal Models that learn which biases actually cause poor
          outcomes in YOUR organization.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            {
              title: 'PC Algorithm',
              desc: 'Constraint-based causal discovery. Min 20 outcomes for DAG, 50+ for high-confidence',
            },
            {
              title: 'Do-Calculus',
              desc: 'Pearl-style interventional queries: "What if we removed confirmation bias?"',
            },
            {
              title: 'Danger Multipliers',
              desc: 'Org-specific learned weights amplifying severity from historical impact',
            },
            {
              title: '113 Failure Cases',
              desc: '8 industries: Financial Services (28), Technology (23), Government (13), Energy (11)',
            },
            {
              title: 'Bio Signals',
              desc: 'Winner Effect (1.2x) + Cortisol/Stress (1.18x) detected via NLP patterns',
            },
            {
              title: 'System 1 vs 2',
              desc: 'DQI penalizes heuristic-dominant decisions (>70% System 1 biases)',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 8,
                background: 'var(--bg-tertiary, #0a0a0a)',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                {item.title}
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntegrationsAndFlywheel() {
  return (
    <div>
      {/* Slack */}
      <div style={{ ...card, borderTop: '3px solid #4A154B' }}>
        <div style={sectionTitle}>
          <MessageSquare size={18} style={{ color: '#4A154B' }} /> Slack Integration
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          A cognitive coach embedded where decisions actually happen. Enterprise-grade with OAuth,
          multi-tenant token encryption, and HMAC signature verification.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              title: 'Decision Detection',
              desc: 'Auto-identifies decisions from message patterns (approve, reject, escalate, override)',
            },
            {
              title: 'Pre-Decision Coaching',
              desc: 'Detects deliberation ("should we", "thinking about") and nudges BEFORE the vote',
            },
            {
              title: 'Org-Calibrated Nudges',
              desc: 'Messages enriched with org bias history: "In your org, anchoring confirmed 73% of the time"',
            },
            {
              title: 'Thread Bias Accumulation',
              desc: 'Tracks biases across thread messages — only nudges for NEW biases, no repeats',
            },
            {
              title: 'Audit Summary Card',
              desc: 'Rich Block Kit card posted when commitment detected: score, biases, summary, link',
            },
            {
              title: '/di Commands',
              desc: 'analyze, prior, outcome, status, help — full Slack-native workflow',
            },
            {
              title: 'App Home Dashboard',
              desc: 'Calibration level, recent decisions, pending outcomes, twin effectiveness',
            },
            {
              title: 'Interactive Feedback',
              desc: 'Helpful/Not relevant buttons calibrate future nudges and adjust graph edge weights',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 8,
                background: 'var(--bg-tertiary, #0a0a0a)',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                {item.title}
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Knowledge Graph */}
      <div style={card}>
        <div style={sectionTitle}>
          <Network size={18} style={{ color: '#3b82f6' }} /> Decision Knowledge Graph
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}
        >
          {[
            {
              title: '8 Edge Types',
              desc: 'influenced_by, escalated_from, reversed, depends_on, similar_to, shared_bias, same_participants, cross_department',
            },
            {
              title: '5 Node Types',
              desc: 'analysis, human_decision, person, bias_pattern, outcome',
            },
            {
              title: '5 Anti-Patterns',
              desc: 'Echo chamber clusters, cascade failures, bias concentration, isolated high-risk, knowledge fragmentation',
            },
            {
              title: 'Multi-Touch Attribution',
              desc: 'BFS path tracing: "Decision A contributed X% to Decision B\'s outcome"',
            },
            {
              title: 'Edge Learning',
              desc: 'Outcome-driven: edge strength adjusts when outcomes are reported',
            },
            {
              title: 'Temporal Inference',
              desc: 'Granger-causality for causal strength between sequential decisions',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 8,
                background: 'var(--bg-tertiary, #0a0a0a)',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                {item.title}
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Flywheel */}
      <div style={{ ...card, borderLeft: '3px solid #22c55e' }}>
        <div style={sectionTitle}>
          <TrendingUp size={18} style={{ color: '#22c55e' }} /> Behavioral Data Flywheel
        </div>
        <pre
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            background: 'var(--bg-tertiary, #0a0a0a)',
            padding: 16,
            borderRadius: 8,
            lineHeight: 1.6,
          }}
        >
          {`Analysis ──> BiasInstance + DecisionOutcome (user feedback)
    │
    ├── Calibration: recalibrateBiasSeverity() [runs on cron]
    │   ├── Confirmation rates per bias type
    │   ├── Failure impact per bias
    │   └── Adjust severity weights 0.5x to 1.5x
    │
    ├── Nudge Suppression: suppress types users mark unhelpful
    │
    ├── Twin Effectiveness: track which personas' dissent was accurate
    │
    └── Autonomous Detection: 3 channels (documents, Slack, web)
        └── DraftOutcomes ──> one-click confirm ──> feeds calibration`}
        </pre>
      </div>

      {/* Committee Rooms + Calibration */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={card}>
          <div style={sectionTitle}>
            <Users size={16} style={{ color: '#a78bfa' }} /> Committee Decision Rooms
          </div>
          <ul
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 14,
            }}
          >
            <li>Types: investment_committee, board_review, deal_committee, risk_committee</li>
            <li>Blind prior collection — independent assessments before group discussion</li>
            <li>Consensus scoring (0-100) computed on room close</li>
            <li>Auto-generated bias briefing from linked analysis</li>
            <li>
              Pre-meeting checklist: dissenter, pre-mortem, base rates, criteria, blind priors
            </li>
            <li>Committee prior gap nudge: alerts when members haven&apos;t submitted</li>
          </ul>
        </div>
        <div style={card}>
          <div style={sectionTitle}>
            <TrendingUp size={16} style={{ color: '#22c55e' }} /> Calibration Gamification
          </div>
          <ul
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 14,
            }}
          >
            <li>
              <span style={badge('#CD7F32')}>Bronze</span> 0-4 outcomes reported
            </li>
            <li>
              <span style={badge('#C0C0C0')}>Silver</span> 5-14 outcomes, &gt;50% accuracy
            </li>
            <li>
              <span style={badge('#FFD700')}>Gold</span> 15-29 outcomes, &gt;60% accuracy
            </li>
            <li>
              <span style={badge('#E5E4E2')}>Platinum</span> 30+ outcomes, &gt;70% accuracy
            </li>
            <li>Progress bar toward next level with encouraging messaging</li>
            <li>Milestone tracking at 5, 10, 15, 25, 50 outcomes</li>
            <li>
              Replaces punitive &quot;you must report&quot; with &quot;each outcome makes AI
              smarter&quot;
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function CompetitiveMoat() {
  return (
    <div>
      {/* Moat Table */}
      <div style={{ ...card, borderTop: '3px solid #22c55e' }}>
        <div style={sectionTitle}>
          <Shield size={18} style={{ color: '#22c55e' }} /> Moat Strength Assessment
        </div>
        <div
          style={{
            ...tableRow,
            fontWeight: 700,
            color: 'var(--text-primary)',
            gridTemplateColumns: '2fr 1fr 3fr',
            borderBottom: '2px solid var(--border-primary, #222)',
          }}
        >
          <div>Capability</div>
          <div>Moat</div>
          <div>Why</div>
        </div>
        {[
          ['Bias Detection (LLM)', 'Low', 'Copyable — just prompting'],
          [
            'Noise Decomposition',
            'Medium',
            'Kahneman framework, well-known but implementation is nuanced',
          ],
          [
            'Compound Scoring Engine',
            'High',
            'Proprietary weights, 20x20 matrix, biological signal detection',
          ],
          [
            'Toxic Combination Patterns',
            'High',
            '7 named patterns + learned patterns from outcomes',
          ],
          [
            'Causal Learning Pipeline',
            'Very High',
            '18+ months per-org outcome data = irreproducible',
          ],
          [
            'Nudge Calibration',
            'Very High',
            'Behavioral feedback loop, org-specific, compounds over time',
          ],
          [
            'Twin Effectiveness Tracking',
            'High',
            'Requires extensive outcome data to validate which dissent matters',
          ],
          [
            'Decision Knowledge Graph',
            'Medium',
            'Graph topology standard; pattern detection + edge learning is unique',
          ],
          [
            '113-Case Failure Database',
            'High',
            'Annotated with biases, SEC filings, NTSB reports — years of curation',
          ],
          [
            'Cross-Org Bias Genome',
            'Very High',
            'Data network effect: more orgs = better calibration for all',
          ],
        ].map(([cap, strength, why], i) => {
          const color =
            strength === 'Very High'
              ? '#22c55e'
              : strength === 'High'
                ? '#3b82f6'
                : strength === 'Medium'
                  ? '#f59e0b'
                  : '#71717a';
          return (
            <div
              key={i}
              style={{
                ...tableRow,
                color: 'var(--text-secondary)',
                gridTemplateColumns: '2fr 1fr 3fr',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cap}</div>
              <div>
                <span style={badge(color)}>{strength}</span>
              </div>
              <div>{why}</div>
            </div>
          );
        })}
      </div>

      {/* Core Thesis */}
      <div style={{ ...card, borderLeft: '3px solid #6366f1' }}>
        <div style={sectionTitle}>
          <Rocket size={18} style={{ color: '#6366f1' }} /> The Deepest Moat
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-primary)' }}>
            Causal learning pipeline + feedback loops.
          </strong>{' '}
          Competitors can copy UI, prompts, and static models. They cannot clone 18 months of
          accumulated behavioral data showing which biases actually matter in YOUR organization.
          Every decision processed makes the platform smarter for THAT org. The switching cost is
          the data itself.
        </p>
      </div>

      {/* Key Differentiators */}
      <div style={card}>
        <div style={sectionTitle}>
          <ChevronRight size={18} style={{ color: '#f59e0b' }} /> vs. Generic AI Wrappers
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>
              Generic LLM Wrapper
            </div>
            <ul
              style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: 14 }}
            >
              <li>Asks Claude/GPT to &quot;analyze bias&quot; (no structure)</li>
              <li>No feedback loop — same quality on day 1 and day 365</li>
              <li>No noise measurement — single model opinion</li>
              <li>No org-specific calibration</li>
              <li>No decision graph or attribution</li>
            </ul>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#22c55e', marginBottom: 6 }}>
              Decision Intel
            </div>
            <ul
              style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: 14 }}
            >
              <li>15-agent pipeline with deterministic compound scoring on top</li>
              <li>Every outcome makes the platform smarter (causal learning)</li>
              <li>Statistical jury with 3 independent judges</li>
              <li>Per-org calibration profiles learned from outcomes</li>
              <li>Knowledge graph with attribution, anti-patterns, edge learning</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Series A Story */}
      <div style={card}>
        <div style={sectionTitle}>
          <TrendingUp size={18} style={{ color: '#3b82f6' }} /> The Series A Story
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          &quot;We&apos;re building the world&apos;s first dataset of which cognitive biases
          actually predict decision failure, segmented by industry, company stage, and decision
          type.&quot; That&apos;s a <strong style={{ color: '#3b82f6' }}>data asset play</strong>,
          not just a SaaS play. Investors should value it differently. The Bias Genome — anonymized
          cross-org bias effectiveness data — becomes exponentially more valuable with each
          participating organization.
        </p>
      </div>
    </div>
  );
}

function FounderPlaybook() {
  return (
    <div>
      {/* Sales Positioning */}
      <div style={{ ...card, borderTop: '3px solid #f59e0b' }}>
        <div style={sectionTitle}>
          <Target size={18} style={{ color: '#f59e0b' }} /> Sales Positioning
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              persona: 'Managing Partners',
              hook: '"How do you measure IC decision quality today?"',
              pitch:
                'Show DQI scoring across their last 10 deals. Highlight the deals with low scores that later underperformed.',
              close: 'Free pilot: upload 3 recent IC memos and see the scores.',
            },
            {
              persona: 'Deal Partners',
              hook: '"When was the last time someone challenged the entry valuation thesis?"',
              pitch:
                'Demo the Boardroom Simulation on their own IC memo. The "Operating Partner" persona usually surfaces something nobody raised.',
              close: 'Let them see their own blind spots in real-time.',
            },
            {
              persona: 'Risk / Compliance',
              hook: '"How do you document decision rationale for LP reporting?"',
              pitch:
                'Show the compliance mapping + audit trail. FCA Consumer Duty is a real pain point for UK-regulated funds.',
              close:
                'Compliance is the "vitamin" that gets you in the door; the bias detection is the "painkiller" that keeps them.',
            },
            {
              persona: 'LP Relations',
              hook: '"Do your fund reports pass the survivorship bias test?"',
              pitch:
                'Upload a sample LP report — the platform will flag selective reporting, framing effects, and cherry-picked metrics.',
              close: 'Position as LP transparency tool, not just IC tool.',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{ padding: 14, borderRadius: 8, background: 'var(--bg-tertiary, #0a0a0a)' }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                {item.persona}
              </div>
              <div style={{ fontSize: 12, color: '#f59e0b', fontStyle: 'italic', marginBottom: 6 }}>
                {item.hook}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {item.pitch}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <strong>Close:</strong> {item.close}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Talking Points */}
      <div style={card}>
        <div style={sectionTitle}>
          <MessageSquare size={18} style={{ color: '#3b82f6' }} /> Key Talking Points
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            {
              point: 'ROI is immediate',
              detail:
                'A single avoided bad deal saves $50M-$500M. The platform pays for itself after one corrected thesis.',
            },
            {
              point: 'Not a replacement — an augmentation',
              detail:
                "We don't tell you what to decide. We show you what you might be missing. Like a spell-checker for cognitive biases.",
            },
            {
              point: 'Gets smarter with you',
              detail:
                'After 50 decisions, we know which biases actually cost YOUR org money. No competitor can replicate 18 months of your calibration data.',
            },
            {
              point: 'Sell to the committee, not the individual',
              detail:
                'Slack integration + cognitive audit of team decisions is the B2B killer feature. Individual bias detection is nice-to-have; team decision auditing is must-have.',
            },
            {
              point: 'The Toxic Combinations are viral',
              detail:
                '"The Echo Chamber", "The Sunk Ship" — memorable, tweetable. Consider publishing a "Taxonomy of Bad Decisions" for thought leadership.',
            },
            {
              point: 'Counterfactual is the ROI story',
              detail:
                '"If you\'d removed anchoring from your last 20 decisions, success rate would have been 14% higher — that\'s $2.3M in avoided losses."',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 8,
                background: 'var(--bg-tertiary, #0a0a0a)',
                display: 'flex',
                gap: 10,
              }}
            >
              <ChevronRight size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.point}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                  — {item.detail}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What to Build Next */}
      <div style={card}>
        <div style={sectionTitle}>
          <Rocket size={18} style={{ color: '#6366f1' }} /> Prioritized Backlog
        </div>
        <div
          style={{
            ...tableRow,
            fontWeight: 700,
            color: 'var(--text-primary)',
            gridTemplateColumns: '2fr 1fr 1fr 3fr',
            borderBottom: '2px solid var(--border-primary, #222)',
          }}
        >
          <div>Feature</div>
          <div>Impact</div>
          <div>Effort</div>
          <div>Why</div>
        </div>
        {[
          [
            'Bias Genome Leaderboard',
            'Extreme',
            '5h',
            'Cross-org benchmarking — "Your confirmation bias rate is 85th percentile." Data network effect.',
          ],
          [
            'Counterfactual UI Slider',
            'High',
            '3h',
            'Interactive: "If we removed anchoring, success probability: 62% → 78%." Board presentation gold.',
          ],
          [
            'Decision Graph Explorer (D3)',
            'Very High',
            '6h',
            'Visual force-directed graph. Makes hidden patterns viscerally obvious.',
          ],
          [
            'Regulatory Compliance Dashboard',
            'High',
            '4h',
            'Compliance mapper exists but no UI. For regulated industries, this alone justifies subscription.',
          ],
          [
            'Decision Confidence Tracker',
            'High',
            '3h',
            'Bayesian belief-update visualization. "Your confidence shifted 72% → 41%." Killer differentiator.',
          ],
          [
            'Org Calibration Dashboard',
            'Very High',
            '4h',
            'Show how platform learned YOUR patterns. Makes switching cost tangible and visible.',
          ],
          [
            'Industry Vertical Bias Profiles',
            'High',
            '4h',
            'PE has different dominant patterns than healthcare. Vertical-specific baselines for new orgs.',
          ],
        ].map(([feat, impact, effort, why], i) => {
          const impactColor =
            impact === 'Extreme' ? '#ef4444' : impact === 'Very High' ? '#22c55e' : '#3b82f6';
          return (
            <div
              key={i}
              style={{
                ...tableRow,
                color: 'var(--text-secondary)',
                gridTemplateColumns: '2fr 1fr 1fr 3fr',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{feat}</div>
              <div>
                <span style={badge(impactColor)}>{impact}</span>
              </div>
              <div style={{ color: 'var(--text-muted)' }}>{effort}</div>
              <div>{why}</div>
            </div>
          );
        })}
      </div>

      {/* Founder Tips */}
      <div style={{ ...card, borderLeft: '3px solid #a78bfa' }}>
        <div style={sectionTitle}>
          <BookOpen size={18} style={{ color: '#a78bfa' }} /> Founder Notes
        </div>
        <ul
          style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: 16 }}
        >
          <li>
            <strong>Your deepest moat is time-to-data, not features.</strong> Frame the first 6
            months as a calibration investment.
          </li>
          <li>
            <strong>The Outcome Gate is controversial AND valuable.</strong> Show calibration
            improvement to make feedback feel rewarding, not punitive.
          </li>
          <li>
            <strong>Consider a &quot;Decision Score&quot; that&apos;s external-facing</strong> —
            like a credit score for organizational decision quality. Creates a new category.
          </li>
          <li>
            <strong>Sell the Bias Genome to investors.</strong> &quot;World&apos;s first dataset of
            which cognitive biases predict failure, by industry and decision type.&quot;
          </li>
          <li>
            <strong>The counterfactual engine is underexposed.</strong> Get it into the UI and the
            sales deck — it&apos;s the ROI story that closes enterprise deals.
          </li>
        </ul>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function FounderHubPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const TAB_CONTENT: Record<TabId, React.ReactNode> = {
    overview: <ProductOverview />,
    pipeline: <CorePipeline />,
    scoring: <ScoringEngine />,
    integrations: <IntegrationsAndFlywheel />,
    moat: <CompetitiveMoat />,
    playbook: <FounderPlaybook />,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Rocket size={26} style={{ color: '#6366f1' }} />
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--text-primary, #fff)',
              margin: 0,
            }}
          >
            Founder Hub
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted, #71717a)', margin: 0 }}>
          Your living knowledge board — product features, moat, pitch narrative, and tactical
          playbook.
        </p>
      </header>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 24,
          overflowX: 'auto',
          borderBottom: '1px solid var(--border-primary, #222)',
          paddingBottom: 0,
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color:
                activeTab === tab.id ? 'var(--text-primary, #fff)' : 'var(--text-muted, #71717a)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {TAB_CONTENT[activeTab]}
    </div>
  );
}
