'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
  Lock,
  Crosshair,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type TabId =
  | 'overview'
  | 'pipeline'
  | 'scoring'
  | 'integrations'
  | 'moat'
  | 'market'
  | 'sales'
  | 'stats'
  | 'frameworks'
  | 'playbook';

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Product Overview', icon: <Rocket size={16} /> },
  { id: 'pipeline', label: 'Analysis Pipeline', icon: <Brain size={16} /> },
  { id: 'scoring', label: 'Scoring Engine', icon: <BarChart3 size={16} /> },
  { id: 'integrations', label: 'Integrations & Flywheel', icon: <Plug size={16} /> },
  { id: 'moat', label: 'Moat & Competitors', icon: <Shield size={16} /> },
  { id: 'market', label: 'Market Strategy', icon: <Target size={16} /> },
  { id: 'sales', label: 'Sales Toolkit', icon: <MessageSquare size={16} /> },
  { id: 'stats', label: 'Live Stats', icon: <TrendingUp size={16} /> },
  { id: 'frameworks', label: 'Research & Frameworks', icon: <Crosshair size={16} /> },
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

      {/* Technical Architecture Quick Reference */}
      <div style={{ ...card, borderTop: '3px solid #a78bfa' }}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#a78bfa' }} /> Technical Architecture — Talking Points
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Condensed reference for technical conversations (CTOs, technical DD, co-founder
          discussions).
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            {
              label: 'Stack',
              value: 'Next.js 16 (App Router) + Prisma ORM + Supabase Postgres + LangGraph',
            },
            {
              label: 'AI Pipeline',
              value:
                '15 agents in LangGraph DAG — preprocessing (sequential) → analysis (parallel fan-out) → synthesis (sequential)',
            },
            {
              label: 'Scoring Layer',
              value:
                'Deterministic compound scoring POST-LLM — 20x20 bias interaction matrix, context multipliers, biological signal detection',
            },
            {
              label: 'Noise Measurement',
              value:
                'Statistical jury: 3 independent Gemini instances score same document → mean, stddev, variance decomposition',
            },
            {
              label: 'RAG / Embeddings',
              value:
                'Gemini embedding-001 (768-dim) → pgvector cosine similarity for semantic search and document matching',
            },
            {
              label: 'Causal AI',
              value:
                'PC Algorithm for DAG construction, Pearl do-calculus for interventional queries, org-specific danger multipliers',
            },
            {
              label: 'Knowledge Graph',
              value:
                '8 edge types auto-inferred, PageRank centrality, Granger-causal temporal inference, BFS multi-touch attribution',
            },
            {
              label: 'Real-Time',
              value:
                'SSE streaming for analysis, Slack Events API for decision detection, webhook engine for outbound events',
            },
            {
              label: 'Security',
              value:
                'GDPR anonymization pre-analysis, AES-256-GCM token encryption, HMAC-SHA256 Slack verification, bcrypt API keys',
            },
            {
              label: 'Data Moat',
              value:
                'CalibrationProfile per-org learned weights, outcome-driven edge learning, cross-org Bias Genome (anonymized)',
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
              <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: 2 }}>{item.label}</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Content: Scoring Engine ────────────────────────────────────────────

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

      {/* Academic Backing */}
      <div style={{ ...card, borderLeft: '3px solid #8b5cf6' }}>
        <div style={sectionTitle}>
          <Brain size={18} style={{ color: '#8b5cf6' }} /> Academic Validation
        </div>
        <p
          style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 0 }}
        >
          <strong style={{ color: '#8b5cf6' }}>Strebulaev (Stanford GSB, 2024):</strong> VC firms
          pursuing consensus in investment decisions have <strong>lower IPO rates</strong>. Your
          blind prior collection and consensus scoring are directly designed around this finding —
          not a coincidence but an intentional implementation of what the research shows works. Cite
          this when selling Committee Rooms:
          <em>
            {' '}
            &quot;Stanford research shows consensus-seeking ICs underperform. Our blind prior system
            is built to prevent exactly that.&quot;
          </em>
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

      {/* Competitor Landscape */}
      <div style={card}>
        <div style={sectionTitle}>
          <Target size={18} style={{ color: '#f59e0b' }} /> Competitor Landscape — Quick Reference
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          When a prospect mentions one of these tools, here&apos;s your instant response.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            {
              name: 'Affinity',
              what: 'Relationship intelligence CRM for dealmakers. Tracks who-knows-who, auto-logs emails and meetings.',
              gap: 'Zero decision quality analysis. Tells you WHO to talk to, not WHETHER your thesis is biased.',
              response:
                '"Affinity finds the deal. Decision Intel audits the decision to invest. We\'re complementary — plug in after the deal hits IC."',
              color: '#3b82f6',
            },
            {
              name: 'DealCloud (Intapp)',
              what: 'Deal management and pipeline CRM for PE/VC. Tracks deal flow, pipeline stages, fund reporting.',
              gap: 'No cognitive analysis of IC materials. Tracks the deal, not the quality of the decision-making about the deal.',
              response:
                '"DealCloud tracks your pipeline. We audit the decisions your pipeline produces. Upload the IC memo from DealCloud — we score it in 60 seconds."',
              color: '#6366f1',
            },
            {
              name: 'Grata',
              what: 'AI-powered company search and deal sourcing for private markets.',
              gap: 'Entirely focused on finding companies to invest in. Nothing on evaluating whether the investment decision is sound.',
              response:
                '"Grata finds targets. We stress-test the thesis. Different stage of the funnel entirely."',
              color: '#22c55e',
            },
            {
              name: 'Blueflame AI',
              what: 'AI assistant for PE firms — automates CIM summarization, deal screening, data room analysis.',
              gap: "Summarizes and structures data but doesn't detect cognitive biases, measure noise, or track decision outcomes.",
              response:
                '"Blueflame reads the documents faster. We read the decision-maker\'s blind spots. Our 15-agent pipeline detects 20 biases they can\'t see."',
              color: '#ef4444',
            },
            {
              name: 'ChatGPT / Claude (direct)',
              what: 'General-purpose LLM. Some firms ask it to "analyze for biases."',
              gap: 'Single model opinion (no noise measurement), no deterministic scoring, no outcome tracking, no org calibration, no PE-specific biases.',
              response:
                '"That\'s one opinion from one model. We use 3 independent judges for noise measurement, a 20x20 bias interaction matrix for compound scoring, and an outcome flywheel that makes us smarter with every deal you close."',
              color: '#a78bfa',
            },
          ].map((comp, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'var(--bg-tertiary, #0a0a0a)',
                borderLeft: `3px solid ${comp.color}`,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: comp.color, marginBottom: 6 }}>
                {comp.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <strong style={{ color: 'var(--text-primary)' }}>What they do:</strong> {comp.what}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <strong style={{ color: 'var(--text-primary)' }}>What they don&apos;t:</strong>{' '}
                {comp.gap}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: comp.color,
                  fontStyle: 'italic',
                  padding: '8px 12px',
                  background: `${comp.color}08`,
                  borderRadius: 6,
                  border: `1px solid ${comp.color}20`,
                }}
              >
                {comp.response}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Content: Market Strategy ───────────────────────────────────────────

function MarketStrategy() {
  return (
    <div>
      {/* Verdict */}
      <div style={{ ...card, borderTop: '3px solid #22c55e' }}>
        <div style={label}>BEACHHEAD MARKET VERDICT</div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-primary, #fff)',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          PE/VC Investment Committees
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Your product is already built for this market. The competitive white space is real. The
          buyer is accessible. The community dynamics favor rapid word-of-mouth. Everything else
          requires either rebuilding the product, longer sales cycles, or both.
        </p>
      </div>

      {/* Sharpened Value Prop */}
      <div style={{ ...card, borderLeft: '3px solid #6366f1' }}>
        <div style={sectionTitle}>
          <Rocket size={18} style={{ color: '#6366f1' }} /> Investor-Ready Positioning
        </div>
        <blockquote
          style={{
            margin: 0,
            padding: '12px 16px',
            borderLeft: '3px solid #6366f1',
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            fontStyle: 'italic',
            background: 'rgba(99, 102, 241, 0.04)',
            borderRadius: '0 8px 8px 0',
          }}
        >
          &quot;Decision Intel is a cognitive bias auditing engine for PE/VC investment committees.
          We sit between deal sourcing and capital deployment — the one place in the fund workflow
          where nobody is providing decision quality tools. Our 15-agent AI pipeline analyzes IC
          memos, CIMs, and due diligence reports to detect the specific biases that destroy fund
          returns: anchoring to entry price, confirmation bias in thesis validation, sunk cost in
          portfolio holds, and overconfidence in projections. We produce a proprietary Decision
          Quality Index — think FICO score for investment decisions — and our outcome tracking
          flywheel means the platform gets smarter with every deal a fund closes.&quot;
        </blockquote>
      </div>

      {/* Market Comparison */}
      <div style={card}>
        <div style={sectionTitle}>
          <BarChart3 size={18} style={{ color: '#3b82f6' }} /> Market Comparison
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr 1fr',
            gap: 8,
            fontSize: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: 'var(--text-primary)',
              padding: '8px 0',
              borderBottom: '2px solid var(--border-primary, #222)',
            }}
          >
            Market
          </div>
          <div
            style={{
              fontWeight: 700,
              color: 'var(--text-primary)',
              padding: '8px 0',
              borderBottom: '2px solid var(--border-primary, #222)',
            }}
          >
            Value at Risk
          </div>
          <div
            style={{
              fontWeight: 700,
              color: 'var(--text-primary)',
              padding: '8px 0',
              borderBottom: '2px solid var(--border-primary, #222)',
            }}
          >
            Sales Cycle
          </div>
          <div
            style={{
              fontWeight: 700,
              color: 'var(--text-primary)',
              padding: '8px 0',
              borderBottom: '2px solid var(--border-primary, #222)',
            }}
          >
            Product Fit
          </div>
          <div
            style={{
              fontWeight: 700,
              color: 'var(--text-primary)',
              padding: '8px 0',
              borderBottom: '2px solid var(--border-primary, #222)',
            }}
          >
            Buyer Access
          </div>
          <div
            style={{
              fontWeight: 700,
              color: 'var(--text-primary)',
              padding: '8px 0',
              borderBottom: '2px solid var(--border-primary, #222)',
            }}
          >
            Verdict
          </div>
          {[
            [
              'PE/VC ICs',
              '$50-500M/deal',
              '1-2 mo',
              'Built for it',
              'MP / Head of IC',
              'BEACHHEAD',
            ],
            ['Corporate M&A', '$1-10B/deal', '6-12 mo', 'Needs retool', 'Corp Dev VP', 'Year 2-3'],
            ['Hedge Funds', '$10M-1B/pos', '3-6 mo', 'Weak (1 PM)', 'PM / CIO', 'Year 3+'],
            ['Insurance', 'Varies', '12+ mo', 'Wrong problem', 'CUO', 'No'],
            ['Gov/Defense', '$100M-10B', '18-36 mo', 'FedRAMP req', 'Procurement', 'Year 4+'],
            ['Corp Boards', 'Varies', '6-12 mo', 'Too diffuse', 'Board Secretary', 'Year 4+'],
          ].map(([market, value, cycle, fit, buyer, verdict], i) => {
            const isBeachhead = verdict === 'BEACHHEAD';
            const verdictColor = isBeachhead ? '#22c55e' : verdict === 'No' ? '#ef4444' : '#f59e0b';
            return [
              <div
                key={`m${i}`}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-primary, #222)',
                  fontWeight: isBeachhead ? 700 : 400,
                  color: isBeachhead ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {market}
              </div>,
              <div
                key={`v${i}`}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-primary, #222)',
                  color: 'var(--text-secondary)',
                }}
              >
                {value}
              </div>,
              <div
                key={`c${i}`}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-primary, #222)',
                  color: 'var(--text-secondary)',
                }}
              >
                {cycle}
              </div>,
              <div
                key={`f${i}`}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-primary, #222)',
                  color: 'var(--text-secondary)',
                }}
              >
                {fit}
              </div>,
              <div
                key={`b${i}`}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-primary, #222)',
                  color: 'var(--text-secondary)',
                }}
              >
                {buyer}
              </div>,
              <div
                key={`d${i}`}
                style={{ padding: '8px 0', borderBottom: '1px solid var(--border-primary, #222)' }}
              >
                <span style={badge(verdictColor)}>{verdict}</span>
              </div>,
            ];
          })}
        </div>
      </div>

      {/* Why PE/VC Wins */}
      <div style={card}>
        <div style={sectionTitle}>
          <CheckCircle size={18} style={{ color: '#22c55e' }} /> Why PE/VC Wins as Beachhead
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              title: 'Product Already Built',
              desc: '11 PE-specific biases, IC memo analysis, deal pipeline tracking, IRR/MOIC outcome logging, committee rooms with blind prior collection. Zero retooling needed.',
            },
            {
              title: 'Genuine White Space',
              desc: 'Competitors (Affinity, DealCloud, Grata, Blueflame AI) focus on deal sourcing and CRM. Nobody is doing cognitive bias auditing of the actual decision-making process.',
            },
            {
              title: 'Accessible Buyer',
              desc: 'PE firms are 5-50 people. The Managing Partner or Head of IC can greenlight a purchase in a single meeting. No procurement department, no 12-month sales cycle.',
            },
            {
              title: 'Community FOMO',
              desc: 'PE/VC is tight-knit. One flagship fund using Decision Intel creates real fear of missing out among peers. Word-of-mouth is the primary distribution channel.',
            },
            {
              title: 'Quantifiable ROI',
              desc: 'A single avoided bad deal saves $50M-$500M. On a $50-100K annual contract, that is a 500-1000x ROI. The easiest sales conversation possible.',
            },
            {
              title: 'Academic Backing',
              desc: "Kahneman's Noise, Malmendier & Tate on winner's curse (65% of auctions), behavioral bias costs 2x management fees in performance drag. The research is on your side.",
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
                  marginBottom: 4,
                }}
              >
                {item.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Other Markets Don't Work (Yet) */}
      <div style={card}>
        <div style={sectionTitle}>
          <AlertTriangle size={18} style={{ color: '#f59e0b' }} /> Why Not the Others (Yet)
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            {
              market: 'Corporate M&A',
              reason:
                'Highest per-deal value destruction ($8.8B HP-Autonomy, $10B+ Bayer-Monsanto). But buyers are Fortune 500 corp dev teams or advisory firms — 6-12+ month sales cycles, significant product retooling needed. This is your Year 2-3 expansion, not your beachhead.',
            },
            {
              market: 'Hedge Funds',
              reason:
                "High decision volume and alpha erosion is well-documented ($4.3B lost on Ackman-Valeant from disposition effect alone). But funds build proprietary tools, are secretive about process, and often have a single PM deciding — your committee workflow doesn't map.",
            },
            {
              market: 'Insurance Underwriting',
              reason:
                'The "bias" conversation has shifted to algorithmic/ML bias (NY DFS Circular 2024-7). This is fundamentally a different product — fairness-in-AI, not cognitive bias in human decisions.',
            },
            {
              market: 'Government/Defense',
              reason:
                "Jaw-dropping waste ($850B DoD budget, failed audit 7 consecutive years, F-35 cost 3x). But FedRAMP = 12-18 months, procurement = 18-36 months. You'd burn through seed before closing one contract.",
            },
            {
              market: 'Corporate Boards',
              reason:
                '85% of leaders report "decision distress." But who\'s the buyer? What document are you analyzing? Too diffuse. The IC memo workflow doesn\'t translate to quarterly board meetings.',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'var(--bg-tertiary, #0a0a0a)',
              }}
            >
              <ChevronRight size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 3 }} />
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.market}:
                </span>{' '}
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.reason}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing + Market Size */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={card}>
          <div style={sectionTitle}>
            <TrendingUp size={16} style={{ color: '#22c55e' }} /> Pricing Rationale
          </div>
          <div
            style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}
          >
            $50-100K
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>/year</span>
          </div>
          <ul
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 14,
            }}
          >
            <li>Mid-market PE fund: $500M fund size</li>
            <li>Avoid 1 bad deal per vintage = $50-500M saved</li>
            <li>
              ROI: <strong style={{ color: '#22c55e' }}>500-1000x</strong> the subscription cost
            </li>
            <li>Comparable to DealCloud/Affinity pricing tier</li>
            <li>Land at $50K, expand to $100K+ with team seats</li>
          </ul>
        </div>
        <div style={card}>
          <div style={sectionTitle}>
            <BarChart3 size={16} style={{ color: '#3b82f6' }} /> Market Size
          </div>
          <div
            style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}
          >
            $995B
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>
              {' '}
              by 2035
            </span>
          </div>
          <ul
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 14,
            }}
          >
            <li>PE/VC software market: $607B → $995B by 2035</li>
            <li>1,500+ active VC firms globally</li>
            <li>Thousands of PE funds across mid-market and mega-cap</li>
            <li>Decision intelligence market: $12.2B → $46.4B by 2030</li>
            <li>Concentrated enough to be addressable at seed stage</li>
          </ul>
        </div>
      </div>

      {/* Expansion Roadmap */}
      <div style={card}>
        <div style={sectionTitle}>
          <Rocket size={18} style={{ color: '#6366f1' }} /> Expansion Roadmap
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          {[
            {
              year: 'Year 1-2',
              market: 'PE/VC Investment Committees',
              color: '#22c55e',
              status: 'NOW',
              details:
                'Beachhead. Product built. IC memos, deal pipeline, committee rooms. Land 10-20 flagship funds.',
            },
            {
              year: 'Year 2-3',
              market: 'M&A Advisory & Corp Dev',
              color: '#3b82f6',
              status: 'NEXT',
              details:
                'Adjacent. Highest per-deal value destruction. Retool IC memo workflow for deal evaluation memos.',
            },
            {
              year: 'Year 3-4',
              market: 'Broader Financial Services',
              color: '#f59e0b',
              status: 'PLANNED',
              details:
                'Hedge funds, credit committees, insurance. Product adaptations for single-PM and underwriting workflows.',
            },
            {
              year: 'Year 4+',
              market: 'Enterprise Decision Quality',
              color: '#a78bfa',
              status: 'VISION',
              details:
                'Any org making high-stakes, document-driven decisions. Compliance, risk, boards, procurement.',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                borderRadius: 8,
                background: 'var(--bg-tertiary, #0a0a0a)',
                borderTop: `3px solid ${item.color}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>
                  {item.year}
                </span>
                <span style={badge(item.color)}>{item.status}</span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                {item.market}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {item.details}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Content: Sales Toolkit (Objection Handler + Demo Script) ───────────

function SalesToolkit() {
  return (
    <div>
      {/* Pitch Reframe — Strebulaev-Inspired */}
      <div style={{ ...card, borderTop: '3px solid #22c55e', borderLeft: '3px solid #22c55e' }}>
        <div style={sectionTitle}>
          <Rocket size={18} style={{ color: '#22c55e' }} /> Critical Pitch Reframe
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>
              DEFENSIVE (old)
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              &quot;Avoid bad deals. Catch biases. Prevent mistakes.&quot;
            </div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>
              OFFENSIVE (new)
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              &quot;Swing with confidence. Make bolder bets because you&apos;ve stress-tested the
              thesis. Decision Intel gives your IC permission to be ambitious.&quot;
            </div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Why this works:</strong> Strebulaev
          (Stanford GSB) shows the best funds optimize for home runs, not strikeout avoidance. GPs
          don&apos;t want a safety net — they want a decision quality amplifier. The defensive pitch
          attracts compliance buyers. The offensive pitch attracts Managing Partners.
        </p>
      </div>

      {/* Objection Handler */}
      <div style={{ ...card, borderTop: '3px solid #f59e0b' }}>
        <div style={sectionTitle}>
          <Shield size={18} style={{ color: '#f59e0b' }} /> Objection Handler
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          The exact objections PE/VC buyers will raise and your prepared responses.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            {
              objection: '"We already have a good IC process."',
              response:
                "Great — upload your last 3 IC memos and let's see what the DQI scores look like. Most funds score 45-65 on their first run. The question isn't whether your process is good — it's whether there are blind spots nobody is catching.",
              tone: 'Curious, not confrontational',
            },
            {
              objection: '"How is this different from just asking ChatGPT?"',
              response:
                "ChatGPT gives you one opinion from one model. We use 3 independent judges to measure noise, a 20x20 bias interaction matrix for compound scoring, 11 PE-specific biases that general models don't know to look for, and an outcome flywheel that makes us smarter with every deal you close. It's the difference between asking a friend and hiring a forensic auditor.",
              tone: 'Technical credibility',
            },
            {
              objection: '"Our deal team would never share IC memos with an external tool."',
              response:
                'We GDPR-anonymize every document before it touches AI — names, companies, and numbers are tokenized. The PII never leaves the anonymization layer. Plus, you self-host your data on your own Supabase instance. We can do an on-prem demo if that helps.',
              tone: 'Address security directly',
            },
            {
              objection: '"We don\'t have budget for another software tool."',
              response:
                "A single avoided bad deal saves $50-500M. Even if we prevent one thesis error per vintage year, that's a 500-1000x ROI on a $50K subscription. What's the cost of NOT catching the next anchoring bias in your IC memo?",
              tone: 'ROI framing',
            },
            {
              objection: '"We tried AI tools before and they weren\'t useful."',
              response:
                "Were they general-purpose AI or purpose-built for investment decisions? We have 11 PE-specific biases like anchoring to entry price, carry incentive distortion, and winner's curse that no general tool detects. Plus, our outcome tracking means we calibrate to YOUR fund's actual decision patterns — not generic advice.",
              tone: 'Specificity wins',
            },
            {
              objection: '"How long until we see value?"',
              response:
                "Upload your first IC memo — you'll have a full bias audit with DQI score in under 60 seconds. The Boardroom Simulation alone usually surfaces something nobody in the room raised. First-day value, not first-quarter value.",
              tone: 'Immediate gratification',
            },
            {
              objection: '"We\'re a small team, we don\'t need this."',
              response:
                'Small teams are actually more vulnerable to groupthink and authority bias — fewer voices means blind spots compound. Our Slack integration embeds cognitive coaching directly in your deal discussions, no workflow change required. Think of it as a silent partner who only speaks up when they spot a bias.',
              tone: 'Turn weakness into strength',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{ padding: 14, borderRadius: 10, background: 'var(--bg-tertiary, #0a0a0a)' }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>
                {item.objection}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  marginBottom: 6,
                }}
              >
                {item.response}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Tone: {item.tone}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Script */}
      <div style={card}>
        <div style={sectionTitle}>
          <Rocket size={18} style={{ color: '#6366f1' }} /> Demo Script — Step by Step
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Follow this sequence for maximum impact. Total demo time: 8-12 minutes.
        </p>
        {[
          {
            step: 1,
            title: 'Setup (30 sec)',
            action:
              'Open the dashboard. Have a sample IC memo ready — ideally one from a real deal that had a known outcome (good or bad).',
            tip: 'If using their own memo, even better. If not, use the sample Acme Corp memo.',
          },
          {
            step: 2,
            title: 'Upload & Analyze (60 sec)',
            action:
              'Drag the IC memo onto the upload zone. Click "Analyze." While the SSE stream runs, narrate what the 15 agents are doing: "Right now, 3 independent AI judges are scoring this document for noise, while our bias detective is scanning for 31 cognitive biases..."',
            tip: 'The streaming progress bar is your friend — it creates anticipation.',
          },
          {
            step: 3,
            title: 'DQI Score Reveal (60 sec)',
            action:
              'When the score appears, pause for dramatic effect. "Your IC memo scored 47/100 — that\'s a D grade. Let me show you why."',
            tip: 'Most memos score 40-65. If it scores high (80+), pivot to: "This is unusually clean — let me show you what we DID find."',
          },
          {
            step: 4,
            title: 'Bias Walkthrough (2 min)',
            action:
              "Click into the Biases tab. Show 2-3 specific biases with their exact excerpts highlighted. \"See here — 'the initial offer of $50M' — that's anchoring to entry price. Your team is using a number they were given rather than independently valuing the asset.\"",
            tip: 'Always connect the bias to a specific excerpt. Abstract = forgettable. Concrete = compelling.',
          },
          {
            step: 5,
            title: 'Boardroom Simulation (2 min) — THE WOW MOMENT',
            action:
              'Switch to the Boardroom tab. Show the 5 IC personas voting. "Your Risk Committee Chair voted REJECT because of concentration risk. Your Operating Partner flagged execution timeline as unrealistic. Did anyone in your real IC raise these points?"',
            tip: 'This is usually where the prospect goes quiet and starts thinking about their last deal. Let the silence land.',
          },
          {
            step: 6,
            title: 'Noise Score (60 sec)',
            action:
              'Show the Noise tab. "Three independent judges scored this memo. Two gave it 52, one gave it 71. That 19-point spread IS the noise in your decision process — you\'re getting different answers to the same question."',
            tip: 'If noise is low, that\'s also a story: "This is consistent — the issues are real, not random."',
          },
          {
            step: 7,
            title: 'Toxic Combinations (60 sec)',
            action:
              'If detected, show the toxic combination card. "\'The Echo Chamber\' — confirmation bias plus groupthink in a high-stakes context. This pattern appears in 73% of our historical failure cases."',
            tip: 'The named patterns are memorable and shareable. Prospects will mention them to colleagues.',
          },
          {
            step: 8,
            title: 'Close (60 sec)',
            action:
              '"Imagine if every IC memo went through this before the vote. How many of your last 10 deals would have scored differently?" Offer: free pilot — 3 IC memos analyzed, no commitment.',
            tip: "Don't oversell. The product sells itself after the demo. Just get the pilot started.",
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              padding: '12px 0',
              borderBottom: i < 7 ? '1px solid var(--border-primary, #222)' : 'none',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#6366f1',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {item.step}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: 4,
                }}
              >
                {item.action}
              </div>
              <div style={{ fontSize: 11, color: '#6366f1', fontStyle: 'italic' }}>
                Tip: {item.tip}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Pitch Variants */}
      <div style={card}>
        <div style={sectionTitle}>
          <MessageSquare size={18} style={{ color: '#3b82f6' }} /> Elevator Pitches (by Audience)
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            {
              audience: 'PE Managing Partner (30 sec)',
              pitch:
                "We're building a cognitive bias auditing engine for IC memos. Upload a memo, get a Decision Quality Score in 60 seconds — think FICO for investment decisions. Our outcome flywheel means we learn which biases actually cost your fund money, so the platform gets sharper with every deal.",
            },
            {
              audience: 'VC Partner (30 sec)',
              pitch:
                "We detect 31 cognitive biases in investment documents — 11 specific to PE/VC like anchoring to entry price and winner's curse. Our Boardroom Simulation creates virtual IC members who vote on your thesis. It usually surfaces the objection nobody in the room raised.",
            },
            {
              audience: 'Investor (60 sec)',
              pitch:
                "Decision Intel is the cognitive bias auditing engine for PE/VC investment committees. We sit between deal sourcing and capital deployment — the one place in the fund workflow where nobody provides decision quality tools. 15-agent AI pipeline, proprietary Decision Quality Index, and an outcome tracking flywheel. PE/VC software market is $607B going to $995B by 2035 — we're creating a new category in it.",
            },
            {
              audience: 'Technical Audience (30 sec)',
              pitch:
                'LangGraph-based 15-agent pipeline with deterministic compound scoring on top of LLM output. 20x20 bias interaction matrix, Bayesian prior integration, Granger-causal temporal inference for our decision knowledge graph. Not a wrapper — we built the scoring math.',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{ padding: 12, borderRadius: 8, background: 'var(--bg-tertiary, #0a0a0a)' }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>
                {item.audience}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.pitch}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Content: Live Stats ────────────────────────────────────────────────

function LiveStats() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(() => {
    setError(false);
    Promise.all([
      fetch('/api/stats')
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('/api/outcomes/dashboard?timeRange=all')
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([s, d]) => {
      if (!s && !d) {
        setError(true);
      } else {
        setStats(s);
        setDashboardData(d);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchStats fetches from external API and sets state on response
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div style={card}>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          Loading live stats from your database...
        </p>
      </div>
    );
  }

  if (error && !stats && !dashboardData) {
    return (
      <div style={card}>
        <p style={{ color: '#ef4444', textAlign: 'center', padding: 40 }}>
          Failed to load stats.{' '}
          <button
            onClick={fetchStats}
            style={{
              background: 'none',
              border: '1px solid #ef4444',
              color: '#ef4444',
              borderRadius: 6,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Retry
          </button>
        </p>
      </div>
    );
  }

  const s = stats as Record<string, number | string | unknown[]> | null;
  const d = dashboardData as Record<string, unknown> | null;
  const kpis = d?.kpis as Record<string, number> | undefined;

  return (
    <div>
      {/* Hero Stats */}
      <div style={{ ...card, borderTop: '3px solid #22c55e' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={sectionTitle}>
            <TrendingUp size={18} style={{ color: '#22c55e' }} /> Live Product Metrics
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {lastRefreshed && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Updated {lastRefreshed}
              </span>
            )}
            <button
              onClick={fetchStats}
              style={{
                background: 'var(--bg-tertiary, #0a0a0a)',
                border: '1px solid var(--border-primary, #222)',
                color: 'var(--text-secondary)',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Refresh
            </button>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Auto-refreshes every 60s. Pull this up during investor meetings or sales calls.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { value: s?.totalDocuments ?? '—', label: 'Documents Uploaded', color: '#3b82f6' },
            { value: s?.documentsAnalyzed ?? '—', label: 'Analyses Completed', color: '#22c55e' },
            {
              value: s?.avgScore != null ? `${Math.round(s.avgScore as number)}` : '—',
              label: 'Avg Decision Score',
              color: '#f59e0b',
            },
            { value: kpis?.decisionsTracked ?? '—', label: 'Outcomes Tracked', color: '#a78bfa' },
          ].map((m, i) => (
            <div key={i} style={card}>
              <div style={{ ...stat, color: m.color }}>{String(m.value)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Calibration & Accuracy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={card}>
          <div style={sectionTitle}>
            <Target size={16} style={{ color: '#6366f1' }} /> Calibration Metrics
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { label: 'Decision Accuracy Rate', value: `${kpis?.accuracyRate ?? 0}%` },
              { label: 'Bias Detection Accuracy', value: `${kpis?.biasDetectionAccuracy ?? 0}%` },
              { label: 'Avg Impact Score', value: `${kpis?.avgImpactScore ?? 0}/100` },
              {
                label: 'Pending Outcomes',
                value: `${(d as Record<string, unknown>)?.pendingOutcomes ?? 0}`,
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border-primary, #222)',
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={card}>
          <div style={sectionTitle}>
            <Brain size={16} style={{ color: '#8b5cf6' }} /> Top Biases Detected
          </div>
          {Array.isArray(s?.topBiases) ? (
            <div style={{ display: 'grid', gap: 6 }}>
              {(s.topBiases as Array<{ biasType: string; count: number; displayName?: string }>)
                .slice(0, 7)
                .map((b, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--border-primary, #222)',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {b.displayName || b.biasType?.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              No bias data yet. Analyze some documents first.
            </p>
          )}
        </div>
      </div>

      {/* Twin Effectiveness */}
      {Array.isArray((d as Record<string, unknown>)?.twinEffectiveness) &&
        ((d as Record<string, unknown>).twinEffectiveness as unknown[]).length > 0 && (
          <div style={card}>
            <div style={sectionTitle}>
              <Users size={16} style={{ color: '#a78bfa' }} /> Twin Effectiveness (Live)
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 8,
              }}
            >
              {(
                (d as Record<string, unknown>).twinEffectiveness as Array<Record<string, unknown>>
              ).map((t, i) => (
                <div
                  key={i}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: 'var(--bg-tertiary, #0a0a0a)',
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {String(t.twinName)}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {Math.round((t.effectivenessRate as number) * 100)}% accuracy,{' '}
                    {String(t.dissentCount)} dissents
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Usage note */}
      <div style={{ ...card, borderLeft: '3px solid #3b82f6' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Investor meeting tip:</strong> Pull up
          this tab to show real traction. &quot;We&apos;ve analyzed X documents, tracked Y outcomes,
          and our bias detection accuracy is Z%. The platform is actively calibrating to our pilot
          customers&apos; decision patterns.&quot;
        </p>
      </div>
    </div>
  );
}

// ─── Research Card Component ────────────────────────────────────────────────

function ResearchCard({
  title,
  source,
  type,
  color,
  link,
  insight,
  product,
  startup,
  actions,
}: {
  title: string;
  source: string;
  type: string;
  color: string;
  link: string;
  insight: string;
  product: string;
  startup: string;
  actions: string[];
}) {
  return (
    <div style={{ ...card, borderLeft: `3px solid ${color}`, marginTop: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}
          >
            {title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {source} &middot; {type}
          </div>
        </div>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color, textDecoration: 'underline', flexShrink: 0 }}
        >
          Listen/Read
        </a>
      </div>
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: 10,
          fontStyle: 'italic',
        }}
      >
        {insight}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            padding: 8,
            borderRadius: 6,
            background: 'rgba(99, 102, 241, 0.06)',
            border: '1px solid rgba(99, 102, 241, 0.12)',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', marginBottom: 3 }}>
            FOR THE PRODUCT
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {product}
          </div>
        </div>
        <div
          style={{
            padding: 8,
            borderRadius: 6,
            background: 'rgba(34, 197, 94, 0.06)',
            border: '1px solid rgba(34, 197, 94, 0.12)',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', marginBottom: 3 }}>
            FOR THE STARTUP
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {startup}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color, marginBottom: 3 }}>ACTIONS</div>
      {actions.map((a, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 5,
            fontSize: 11,
            color: 'var(--text-secondary)',
            marginBottom: 2,
          }}
        >
          <ChevronRight size={10} style={{ color, flexShrink: 0, marginTop: 2 }} />
          <span>{a}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Tab Content: Research & Frameworks ─────────────────────────────────────

function ResearchFrameworks() {
  const [section, setSection] = useState<
    'all' | 'vc' | 'foundations' | 'category' | 'gtm' | 'strategy'
  >('all');

  const SECTIONS = [
    { id: 'all' as const, label: 'All' },
    { id: 'vc' as const, label: 'VC Decision Science' },
    { id: 'foundations' as const, label: 'Decision Science' },
    { id: 'category' as const, label: 'Category Creation' },
    { id: 'gtm' as const, label: 'GTM & Sales' },
    { id: 'strategy' as const, label: 'Founder Strategy' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ ...card, borderTop: '3px solid #8b5cf6' }}>
        <div style={label}>RESEARCH-TO-ACTION LIBRARY</div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--text-primary, #fff)',
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          Research, Frameworks &amp; Intellectual Foundations
        </h2>
        <p
          style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 0 }}
        >
          Academic research, podcasts, and frameworks mapped to Decision Intel — both as product
          validation and startup strategy. Every source linked to concrete action items.
        </p>
      </div>

      {/* Sub-section pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: section === s.id ? 700 : 500,
              borderRadius: 20,
              border: `1px solid ${section === s.id ? '#8b5cf6' : 'var(--border-primary, #333)'}`,
              background: section === s.id ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
              color: section === s.id ? '#8b5cf6' : 'var(--text-muted, #71717a)',
              cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── VC Decision Science ── */}
      {(section === 'all' || section === 'vc') && (
        <>
          <div style={{ ...card, borderLeft: '3px solid #6366f1' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#6366f1', marginBottom: 12 }}>
              VC Decision Science
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                {
                  num: 1,
                  principle: "Home Runs Matter, Strikeouts Don't",
                  summary:
                    'Only 1 in 20 VC investments hits a home run, but a single winner returns 100x. Failure tolerance is structural, not emotional.',
                  product:
                    "Reframe your pitch from defensive to offensive. DQI doesn't just help avoid bad deals — it gives IC members permission to swing big because they've stress-tested the decision. \"Swing with confidence because you've already audited the thesis.\"",
                  startup:
                    'Go all-in on PE/VC. Don\'t build 6 features for 4 markets. Your "home run" is one flagship fund that becomes a case study. Accept that some features won\'t land.',
                  actions: [
                    'Rewrite landing page hero from "avoid mistakes" to "make better bets with confidence"',
                    'Focus pilot outreach on 5 target funds, not 50',
                  ],
                  color: '#22c55e',
                },
                {
                  num: 2,
                  principle: 'Agree to Disagree',
                  summary:
                    'VC firms pursuing consensus have LOWER IPO rates. The best firms let a single partner with conviction push a deal through. Microsoft M12 has an "anti-veto rule."',
                  product:
                    'Your Committee Decision Rooms with blind prior collection are a direct implementation of this principle. Cite Strebulaev in marketing: "Stanford research shows consensus-seeking committees underperform. Decision Intel\'s blind prior system is designed around this finding." Your consensus scoring quantifies when agreement is genuine vs. groupthink.',
                  startup:
                    "When building your advisory board, don't surround yourself with people who agree with you. Strebulaev's data: productive disagreement correlates with better outcomes.",
                  actions: [
                    'Add Strebulaev citation to Committee Rooms UI/marketing',
                    'Create a "Dissent Quality" metric in consensus scoring',
                    'Blog post: "Why Your IC\'s Consensus Is Killing Your Returns"',
                  ],
                  color: '#3b82f6',
                },
                {
                  num: 3,
                  principle: 'Get Outside Your Four Walls',
                  summary:
                    'VCs maintain 2-3x larger, more diverse LinkedIn networks than corporate executives. Insularity kills innovation.',
                  product:
                    'Your Slack integration puts Decision Intel inside the daily workflow where deals are discussed — not as a standalone app. This is the "inside the walls" play. The cross-department edge type in your knowledge graph detects organizational silos.',
                  startup:
                    "Be embedded in the PE/VC community. ILPA conferences, ACG events, LP/GP networking circles. Don't sell from the outside — be part of the ecosystem.",
                  actions: [
                    'Attend 2 PE/VC conferences per quarter',
                    'Launch a "Decision Quality" newsletter for PE professionals',
                    'Build a Slack community for IC members',
                  ],
                  color: '#f59e0b',
                },
                {
                  num: 4,
                  principle: 'The Jockey vs. The Horse',
                  summary:
                    'The most important VC investment factor is team quality, not business model. The "jockey" matters more than the "horse."',
                  product:
                    'You detect "Management Halo Effect" but could go deeper. Build a Jockey/Horse Balance Score — detect when an IC memo spends 80% on team pedigree and 20% on business fundamentals, or vice versa. Flag imbalanced memos.',
                  startup:
                    "Your codebase IS your jockey credibility: 113 annotated failure cases, 20x20 bias interaction matrix, causal inference. In technical DD, your depth signals you're the right founder for this problem.",
                  actions: [
                    'Add Jockey/Horse Balance Score to bias detection',
                    'Track ratio of team vs. fundamentals language in IC memos',
                    'Prepare "why me" narrative for investor conversations',
                  ],
                  color: '#ef4444',
                },
                {
                  num: 5,
                  principle: 'The Prepared Mind',
                  summary:
                    '"Chance favors only the prepared mind" (Pasteur). Jensen Huang spends 2-3 hours daily studying emerging tech. The best VCs recognize opportunities instantly because they\'ve studied deeply.',
                  product:
                    "Your Boardroom Simulation IS a \"prepared mind\" tool. You're giving IC members a pre-briefing on which biases historically damaged similar deals, what toxic combinations to watch for, and what diverse perspectives would flag. Lean into this framing: you're not auditing documents — you're preparing decision-makers.",
                  startup:
                    "Spend 30 min daily reading PE/VC industry news, academic papers on decision science, and competitor updates. Your Intelligence Hub's 14 RSS feeds should be your own morning briefing too.",
                  actions: [
                    'Rename "Pre-Meeting Bias Briefing" to "Prepared Mind Briefing" in marketing',
                    'Add a "Prepare for IC" CTA before committee meetings',
                    'Subscribe to 3 PE newsletters personally',
                  ],
                  color: '#8b5cf6',
                },
                {
                  num: 6,
                  principle: 'Fast Lane, Then Slow Lane',
                  summary:
                    'VCs use rapid filtering first ("why NOT invest?" to eliminate red flags), then switch to deep 120-hour due diligence for serious prospects.',
                  product:
                    'BUILD THIS: Quick Scan mode — a fast, lightweight bias check (30 seconds) that flags top 2-3 red flags before committing to the full 15-agent pipeline (4 minutes). Mirrors how VCs actually work. Reduces adoption friction dramatically.',
                  startup:
                    'Apply to your sales process too. Qualify leads fast — "Do you have an investment committee? Do you review IC memos?" If no to either, move on. Don\'t spend 2 hours demoing to someone who doesn\'t have the workflow.',
                  actions: [
                    'Build Quick Scan feature (top priority — Strebulaev-backed)',
                    'Add 2-question lead qualification before demos',
                    'Create a "Red Flag Preview" that runs before full analysis',
                  ],
                  color: '#22c55e',
                },
                {
                  num: 7,
                  principle: 'Double Down and Quit',
                  summary:
                    "VCs combat escalation of commitment through structural mechanisms: requiring multiple investors for follow-on rounds, bringing in arm's-length co-investors, requiring partner consensus specifically on follow-ons.",
                  product:
                    "BUILD THIS: Longitudinal Bias Tracking — don't just analyze individual IC memos, track how bias patterns change over the life of a deal. Does confirmation bias increase from initial investment to Series B follow-on? Is the follow-on memo less critical than the initial? This is a unique, hard-to-replicate feature.",
                  startup:
                    "Apply to your own features. Some features you shipped won't get traction. Be willing to kill them rather than doubling down. Measure feature usage monthly.",
                  actions: [
                    'Build deal-level longitudinal bias tracking',
                    'Compare bias severity across deal stages (screening vs IC vs follow-on)',
                    'Set up monthly feature usage analytics',
                  ],
                  color: '#3b82f6',
                },
                {
                  num: 8,
                  principle: 'Sharing the Pie (Incentive Alignment)',
                  summary:
                    'VCs invented vesting schedules in the 1970s. The principle is about aligning incentives across all contributors to prevent short-term behavior.',
                  product:
                    "Your \"Carry Incentive Distortion\" bias is a direct implementation. Go deeper: detect when an IC memo's enthusiasm correlates suspiciously with the deal's impact on a specific partner's carry economics. Track if advocacy intensity changes near fund deadlines.",
                  startup:
                    "When you hire your first team members, offer meaningful equity. Strebulaev's data shows aligned incentives outperform salary-heavy compensation in startups.",
                  actions: [
                    'Enhance carry incentive detection with fund timeline awareness',
                    'Detect deployment pressure signals ("need to put capital to work")',
                    'Design equity plan for first 3 hires',
                  ],
                  color: '#f59e0b',
                },
                {
                  num: 9,
                  principle: 'The Meta-Principle: VC-Backed Companies Shape the Economy',
                  summary:
                    '50% of US IPOs over 50 years were VC-backed. 75% of large public companies. VC-backed companies spend 92 cents of every R&D dollar. When ICs make biased decisions, the ripple effects go far beyond the fund.',
                  product:
                    'This is your highest-level pitch narrative: "Decision Intel doesn\'t just protect fund returns — it improves the quality of capital allocation across the innovation economy." When a biased IC kills a good deal, that startup might never get funded. When a biased IC backs a bad deal, capital that could have gone to a better company is wasted.',
                  startup:
                    'This framing elevates you from "SaaS tool vendor" to "mission-driven company improving how capital flows to innovation." Investors respond to mission, not just TAM.',
                  actions: [
                    'Add this framing to pitch deck\'s "Why This Matters" slide',
                    'Use in PR/press outreach — "improving how capital flows to innovation"',
                    'Blog post: "The Hidden Cost of IC Bias on the Innovation Economy"',
                  ],
                  color: '#ef4444',
                },
              ].map((p, i) => (
                <div key={i} style={{ ...card, borderLeft: `4px solid ${p.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: p.color,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {p.num}
                    </div>
                    <div
                      style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #fff)' }}
                    >
                      {p.principle}
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginBottom: 10,
                      lineHeight: 1.6,
                      fontStyle: 'italic',
                    }}
                  >
                    {p.summary}
                  </p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        background: 'rgba(99, 102, 241, 0.06)',
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                      }}
                    >
                      <div
                        style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 4 }}
                      >
                        FOR THE PRODUCT
                      </div>
                      <div
                        style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}
                      >
                        {p.product}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        background: 'rgba(34, 197, 94, 0.06)',
                        border: '1px solid rgba(34, 197, 94, 0.15)',
                      }}
                    >
                      <div
                        style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}
                      >
                        FOR THE STARTUP
                      </div>
                      <div
                        style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}
                      >
                        {p.startup}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 4 }}>
                      ACTION ITEMS
                    </div>
                    {p.actions.map((a, j) => (
                      <div
                        key={j}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 6,
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          marginBottom: 3,
                        }}
                      >
                        <ChevronRight
                          size={12}
                          style={{ color: p.color, flexShrink: 0, marginTop: 2 }}
                        />
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ResearchCard
            title="Daniel Kahneman: Beyond Cognitive Biases — Reducing Noise"
            source="ClearerThinking Podcast"
            type="Podcast"
            color="#22c55e"
            link="https://podcast.clearerthinking.org/episode/072/"
            insight="Insurance underwriter study: executives expected 10% variability between judges. Actual: 55%. One underwriter prices at $9,500, another at $16,700 for the identical case. Noise is at least as damaging as bias, and organizations almost never measure it."
            product="Your triple-judge noise scoring is a direct implementation of Kahneman's proposed methodology. Use the 10% vs 55% stat in every sales conversation — it's the 'holy shit' moment that makes PE partners realize they have no idea how much variability exists in their own IC."
            startup="Offer a free 'noise audit' of a fund's last 5 IC memos as a top-of-funnel hook. Let them see the problem before pitching the solution."
            actions={[
              'Use 10% vs 55% stat in opening of every demo',
              'Build free noise audit landing page',
              'Create 1-pager: "How Much Noise Is In Your IC?"',
            ]}
          />
        </>
      )}

      {/* ── Decision Science Foundations ── */}
      {(section === 'all' || section === 'foundations') && (
        <div style={{ ...card, borderLeft: '3px solid #f59e0b', marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
            Decision Science Foundations
          </div>
          <ResearchCard
            title='Olivier Sibony: "Decision Hygiene" Framework'
            source="Behavioral Grooves Podcast + Euronews"
            type="Podcast / Interview"
            color="#f59e0b"
            link="https://behavioralgrooves.com/episode/noise-with-olivier-sibony/"
            insight="Kahneman's co-author on Noise, former McKinsey partner. Framework: checklists, premortems, structured independent assessments, and noise audits. Noise audits should be the starting point — orgs need to see how bad the problem is before buying a solution."
            product="Your entire product IS decision hygiene. Sibony's framework validates every feature: structured analysis (bias detection), independent assessments (triple-judge), premortems (Pre-Mortem Architect agent), and noise audits (noise decomposition)."
            startup="His 'noise audit first' approach suggests a powerful sales motion: offer a free noise audit of 5 IC memos as top-of-funnel. Let prospects SEE the problem before pitching the solution."
            actions={[
              'Build free noise audit landing page as lead gen',
              'Quote Sibony in marketing: "decision hygiene"',
              'Position DI as the decision hygiene platform',
            ]}
          />
          <ResearchCard
            title="Gary Klein: Naturalistic Decision Making"
            source="The Decision-Making Studio (Ep. 234)"
            type="Podcast"
            color="#f59e0b"
            link="https://podcasts.apple.com/us/podcast/ep-234-dr-gary-klein/id1054744455?i=1000677192489"
            insight="Klein invented the premortem technique. He and Kahneman were 'collaborative adversaries' — Kahneman trusts systematic processes, Klein trusts expert intuition. The tension between them is the exact tension your product navigates."
            product="DI sits at the intersection: structured AI analysis (Kahneman) augmenting expert human judgment (Klein), not replacing it. This is a nuanced positioning story for skeptical GPs who don't want a machine telling them what to do."
            startup="When GPs push back with 'we trust our judgment,' don't argue. Say: 'We do too. Klein proved expert intuition is powerful. We just make sure it's not undermined by noise and bias you can't see.'"
            actions={[
              'Add Klein citation to premortem feature description',
              'Use Kahneman-Klein framing in sales to skeptical GPs',
              'Position DI as "augmentation" not "replacement"',
            ]}
          />
          <ResearchCard
            title="Annie Duke & Spencer Greenberg: Decision Education"
            source="Decision Education Podcast (Sep 2025)"
            type="Podcast"
            color="#f59e0b"
            link="https://www.annieduke.com/the-decision-education-podcast-with-guest-spencer-greenberg/"
            insight="Knowing the name of a bias doesn't help you overcome it. Awareness alone is nearly useless. What works: precommitment contracts, structured decision processes, and Bayesian updating."
            product="This validates your nudge system and decision architecture (blind priors, premortems) over simple bias reports. The real value isn't detecting biases — it's the structural interventions that make it harder to ACT on bias even when it's present. Diagnostic vs. treatment."
            startup="Don't oversell bias detection in demos. Lead with the decision architecture features: 'We don't just tell you about your biases — we make it structurally harder to act on them.'"
            actions={[
              'Reframe marketing: "detection + intervention" not just "detection"',
              'Emphasize nudge system and blind priors in demos',
              'Blog: "Why Bias Awareness Doesn\'t Work (And What Does)"',
            ]}
          />
          <ResearchCard
            title='Philip Tetlock: "Hybrid Mind" — Human + AI Forecasting'
            source="80,000 Hours Podcast (Oct 2025)"
            type="Podcast"
            color="#f59e0b"
            link="https://80000hours.org/podcast/episodes/prof-tetlock-predicting-the-future/"
            insight="Human-machine hybrids beat both pure AI and pure human judgment in forecasting tournaments. 40 years of data show process matters more than talent — superforecasters aren't smarter, they follow better processes."
            product="DI IS a human-machine hybrid: AI detects biases and measures noise, humans make the final call. Tetlock gives you the language: 'Process beats talent. Our platform ensures your IC follows the process that produces better outcomes.'"
            startup="'Process beats talent' in one sentence IS your entire value proposition. Use Tetlock's authority to back this claim."
            actions={[
              'Add Tetlock citation to product philosophy page',
              'Use "process beats talent" in pitch decks',
              'Reference Hybrid Mind tournament results in technical DD',
            ]}
          />
        </div>
      )}

      {/* ── Category Creation ── */}
      {(section === 'all' || section === 'category') && (
        <div style={{ ...card, borderLeft: '3px solid #ef4444', marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>
            Category Creation
          </div>
          <ResearchCard
            title='Christopher Lochhead: "How to Become a Category Pirate"'
            source="Lenny's Podcast"
            type="Podcast / Newsletter"
            color="#ef4444"
            link="https://www.lennysnewsletter.com/p/how-to-become-a-category-pirate-christopher"
            insight="The company that creates a category captures 2/3 of the market value. Framework: 'Frame It, Name It, Claim It.' The 'better trap' — competing on being better within an existing category — is death."
            product={
              'You\'re not building a "better CRM" or a "better DD tool." You\'re creating the category of Investment Decision Quality. Your DQI should become the term PE uses like IRR and MOIC. When someone says "What\'s the DQI on this memo?" in an IC meeting, you\'ve won. Lochhead calls this "languaging" — weaponizing vocabulary.'
            }
            startup="Frame the problem (IC decisions are riddled with undetected bias and noise), name the solution (Decision Quality Index), claim the category (Decision Intel is the decision quality platform for capital allocators). This is your most important strategic task."
            actions={[
              'Make DQI the centerpiece term in all marketing',
              'Write a "Category Point of View" document (Lochhead framework)',
              'PR strategy: get DQI mentioned in PE trade publications',
              'Blog series: "The Hidden Cost of Decision Noise in PE"',
            ]}
          />
        </div>
      )}

      {/* ── GTM & Sales ── */}
      {(section === 'all' || section === 'gtm') && (
        <div style={{ ...card, borderLeft: '3px solid #3b82f6', marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>
            GTM &amp; Sales
          </div>
          <ResearchCard
            title="Ray Zhou (Affinity): From College Dropout to SaaS Leader"
            source="Platform Builders Podcast"
            type="Podcast"
            color="#3b82f6"
            link="https://www.heavybit.com/library/podcasts/platform-builders/ep-4-building-affinity-from-college-dropout-to-saas-leader-with-ray-zhou"
            insight="Built Affinity into late-eight-figure revenue CRM for PE/VC. Three lessons: (1) hundreds of problem-first conversations before building features, (2) founder-led onboarding for every early customer, (3) focus on problems closest to core business — tangential solutions get replaced when AI improves."
            product="Decision quality in capital allocation is about as core as it gets for a fund. That's your moat vs. the 'AI assistant' tools that summarize documents — those are tangential, yours is fundamental."
            startup="Personally onboard every pilot customer. Conduct 50+ discovery calls focused on 'how does your IC actually work?' not 'let me show you features.' Zhou's outsider advantage (didn't know the industry) forced better questions — use yours the same way."
            actions={[
              'Target 50 discovery calls before next feature sprint',
              'Personally onboard every pilot — no self-serve yet',
              'Document every onboarding as a playbook for future hires',
              'Ask: "Walk me through your last IC meeting" in every call',
            ]}
          />
        </div>
      )}

      {/* ── Founder Strategy ── */}
      {(section === 'all' || section === 'strategy') && (
        <div style={{ ...card, borderLeft: '3px solid #a78bfa', marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>
            Founder Strategy
          </div>
          <ResearchCard
            title="Peter Thiel: Zero to One — Contrarian Truths"
            source="The Investors Podcast (MI383)"
            type="Podcast Deep Dive"
            color="#a78bfa"
            link="https://www.theinvestorspodcast.com/millennial-investing/zero-to-one-lessons-from-peter-thiel-w-shawn-omalley/"
            insight='Contrarian question: "What important truth do very few people agree with you on?" Monopoly framework: dominate a small niche, then expand in concentric circles. Sales and distribution matter as much as product.'
            product={
              'Your contrarian truth: "Investment committees think their decisions are rational, but they\'re riddled with measurable cognitive noise and bias that nobody audits." Your monopoly niche: PE/VC IC decision quality. Your concentric expansion: PE/VC → M&A → FinServ → Enterprise.'
            }
            startup="The best 15-agent pipeline means nothing if you can't get it in front of Managing Partners. Distribution strategy matters as much as the product. Conferences, Slack communities, thought leadership content, and referral loops from pilot customers are your channels."
            actions={[
              'Write down your contrarian truth and use it in every pitch',
              'Map your concentric expansion circles (already in Market Strategy tab)',
              'Allocate 50% of time to distribution, not just product',
              'Build referral incentive for pilot customers',
            ]}
          />
        </div>
      )}

      {/* ── Connecting Thread ── */}
      <div style={{ ...card, borderTop: '3px solid #8b5cf6', marginTop: 16 }}>
        <div style={sectionTitle}>
          <Crosshair size={18} style={{ color: '#8b5cf6' }} /> The Connecting Thread
        </div>
        <p
          style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 0 }}
        >
          Every one of these thinkers is telling you the same thing from a different angle: human
          decision-making is{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            systematically flawed in measurable ways
          </strong>
          , that{' '}
          <strong style={{ color: 'var(--text-primary)' }}>process beats intuition at scale</strong>
          , that the organizations willing to{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            audit their own judgment will outperform
          </strong>{' '}
          those that don&apos;t, and that the company who creates the{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            language for this problem will own the market
          </strong>
          . You&apos;re building that company. DQI is that language.
        </p>
      </div>

      {/* Key Takeaway (always visible) */}
      <div style={{ ...card, borderTop: '3px solid #6366f1', marginTop: 12 }}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#6366f1' }} /> Most Actionable Takeaways
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            {
              action: 'Reframe pitch from defensive to offensive',
              detail:
                '"Swing with confidence" not "avoid mistakes." The best funds don\'t want a safety net — they want a decision quality amplifier.',
            },
            {
              action: 'Cite Strebulaev in marketing',
              detail:
                'Academic credibility from Stanford GSB for blind priors and committee rooms. "Stanford research shows consensus-seeking ICs underperform."',
            },
            {
              action: 'Build Quick Scan mode',
              detail:
                'Fast lane/slow lane. 30-second red flag scan before 4-minute full analysis. Matches actual VC workflow and reduces friction.',
            },
            {
              action: 'Build longitudinal bias tracking',
              detail:
                'Track bias drift across deal lifecycle. The follow-on memo should be MORE critical than the initial — is it? Nobody else will build this.',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{ padding: 12, borderRadius: 8, background: 'var(--bg-tertiary, #0a0a0a)' }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                {item.action}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Content: Founder Playbook ──────────────────────────────────────────

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
          [
            'Quick Scan Mode',
            'Very High',
            '4h',
            'Strebulaev "Fast Lane": 30-sec red flag scan before full 4-min analysis. Matches how VCs actually work (rapid filter → deep dive).',
          ],
          [
            'Longitudinal Bias Tracking',
            'Very High',
            '6h',
            'Strebulaev "Double Down & Quit": track bias drift across deal lifecycle. Does confirmation bias increase from screening to follow-on?',
          ],
          [
            'Jockey/Horse Balance Score',
            'High',
            '3h',
            'Strebulaev "Jockey vs Horse": detect when IC memos are 80% team pedigree / 20% fundamentals. Flag imbalanced theses.',
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

// Password for founder-only access. Set via env var or hardcode for simplicity.
const FOUNDER_PASS = process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS || '';

export default function FounderHubPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [unlocked, setUnlocked] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);

  const handleUnlock = useCallback(() => {
    if (!FOUNDER_PASS) {
      setPassError(true);
      return;
    }
    if (passInput === FOUNDER_PASS) {
      setUnlocked(true);
      setPassError(false);
    } else {
      setPassError(true);
    }
  }, [passInput]);

  // Password gate
  if (!unlocked) {
    return (
      <div
        className="max-w-md mx-auto px-4"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <Lock size={40} style={{ color: 'var(--text-muted, #71717a)', marginBottom: 16 }} />
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary, #fff)',
            marginBottom: 8,
          }}
        >
          Founder Access Only
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted, #71717a)',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          This page is private. Enter the access code to continue.
        </p>
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <input
            type="password"
            value={passInput}
            onChange={e => {
              setPassInput(e.target.value);
              setPassError(false);
            }}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            placeholder="Access code"
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 14,
              borderRadius: 8,
              border: `1px solid ${passError ? '#ef4444' : 'var(--border-primary, #333)'}`,
              background: 'var(--bg-secondary, #111)',
              color: 'var(--text-primary, #fff)',
              outline: 'none',
            }}
            autoFocus
          />
          <button
            onClick={handleUnlock}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Unlock
          </button>
        </div>
        {passError && (
          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>Incorrect access code.</p>
        )}
      </div>
    );
  }

  const TAB_CONTENT: Record<TabId, React.ReactNode> = {
    overview: <ProductOverview />,
    pipeline: <CorePipeline />,
    scoring: <ScoringEngine />,
    integrations: <IntegrationsAndFlywheel />,
    moat: <CompetitiveMoat />,
    market: <MarketStrategy />,
    sales: <SalesToolkit />,
    stats: <LiveStats />,
    frameworks: <ResearchFrameworks />,
    playbook: <FounderPlaybook />,
  };

  return (
    <ErrorBoundary sectionName="Founder Hub">
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

      {/* AI Chat Widget */}
      <FounderChatWidget />
    </div>
    </ErrorBoundary>
  );
}

// ─── Founder Chat Widget ────────────────────────────────────────────────────

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_QUESTIONS = [
  'Elevator pitch for a GP?',
  'How do we beat DealCloud?',
  'What did Strebulaev say?',
  'Demo script for IC meeting',
];

function FounderChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setStreaming(true);

    try {
      const res = await fetch('/api/founder-hub/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-founder-pass': FOUNDER_PASS,
        },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-10),
        }),
      });

      if (!res.ok) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Error: ' + (res.statusText || 'Failed to connect') },
        ]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk' && data.text) {
                assistantContent += data.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                  return updated;
                });
              }
            } catch {
              // malformed SSE line
            }
          }
        }
      } finally {
        reader.cancel();
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ]);
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#6366f1',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          zIndex: 50,
          fontSize: 22,
        }}
        title="Ask the Founder AI"
      >
        <MessageSquare size={22} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 400,
        height: 520,
        borderRadius: 16,
        background: 'var(--bg-secondary, #111)',
        border: '1px solid var(--border-primary, #333)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-primary, #333)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(99, 102, 241, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Founder AI
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          &times;
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '30px 10px',
              color: 'var(--text-muted)',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            Ask me about your product, competitors, sales strategy, market positioning, or research
            frameworks.
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                justifyContent: 'center',
                marginTop: 10,
              }}
            >
              {STARTER_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    borderRadius: 12,
                    border: '1px solid var(--border-primary, #333)',
                    background: 'transparent',
                    color: '#6366f1',
                    cursor: 'pointer',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '8px 12px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user' ? '#6366f1' : 'var(--bg-tertiary, #1a1a1a)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-secondary)',
              fontSize: 12,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.content || (streaming && i === messages.length - 1 ? '...' : '')}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border-primary, #333)',
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask the Founder AI..."
          disabled={streaming}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid var(--border-primary, #333)',
            background: 'var(--bg-tertiary, #0a0a0a)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={streaming || !input.trim()}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            background: input.trim() && !streaming ? '#6366f1' : 'var(--bg-tertiary, #1a1a1a)',
            color: input.trim() && !streaming ? '#fff' : 'var(--text-muted)',
            cursor: streaming ? 'wait' : 'pointer',
          }}
        >
          {streaming ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
