'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FounderChatWidget } from '@/components/founder-hub/FounderChatWidget';
import { DqiMethodologyTab } from '@/components/founder-hub/DqiMethodologyTab';
import { CorrelationCausalTab } from '@/components/founder-hub/CorrelationCausalTab';
import { ContentStudioTab } from '@/components/founder-hub/ContentStudioTab';
import { MethodologiesAndPrinciplesTab } from '@/components/founder-hub/MethodologiesAndPrinciplesTab';
import {
  Rocket,
  Brain,
  BarChart3,
  Plug,
  Shield,
  BookOpen,
  ChevronRight,
  ChevronDown,
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
  Search,
  X,
  Library,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  Lightbulb,
  Mail,
  HardDrive,
  GraduationCap,
} from 'lucide-react';
import {
  ALL_CASES,
  getCaseStatistics,
  isFailureOutcome,
  isSuccessOutcome,
} from '@/lib/data/case-studies';
import type { CaseOutcome } from '@/lib/data/case-studies';

// ─── Types ──────────────────────────────────────────────────────────────────

type TabId =
  | 'overview'
  | 'pipeline'
  | 'scoring'
  | 'dqi_methodology'
  | 'integrations'
  | 'strategy'
  | 'sales'
  | 'stats'
  | 'playbook'
  | 'methodologies'
  | 'case_studies'
  | 'correlation_causal'
  | 'content_studio';

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Product Overview', icon: <Rocket size={16} /> },
  { id: 'pipeline', label: 'Analysis Pipeline', icon: <Brain size={16} /> },
  { id: 'scoring', label: 'Scoring Engine', icon: <BarChart3 size={16} /> },
  { id: 'dqi_methodology', label: 'DQI Methodology', icon: <Target size={16} /> },
  { id: 'integrations', label: 'Integrations & Flywheel', icon: <Plug size={16} /> },
  { id: 'strategy', label: 'Strategy & Positioning', icon: <Shield size={16} /> },
  { id: 'sales', label: 'Sales Toolkit', icon: <MessageSquare size={16} /> },
  { id: 'stats', label: 'Live Stats', icon: <TrendingUp size={16} /> },
  { id: 'playbook', label: 'Playbook & Research', icon: <BookOpen size={16} /> },
  { id: 'methodologies', label: 'Methodologies & Principles', icon: <GraduationCap size={16} /> },
  { id: 'case_studies', label: 'Case Studies', icon: <Library size={16} /> },
  { id: 'correlation_causal', label: 'Correlation & Causal Graph', icon: <Network size={16} /> },
  { id: 'content_studio', label: 'Content Studio', icon: <Zap size={16} /> },
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
      <div style={{ ...card, borderTop: '3px solid #16A34A' }}>
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
          The Decision Performance OS for M&amp;A &amp; Investment Teams
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary, #b4b4bc)', lineHeight: 1.6 }}>
          Audit every deal thesis for cognitive bias and decision noise. Protect investment outcomes.
          AI-powered cognitive auditing purpose-built for M&amp;A and PE/VC teams.
        </p>
      </div>

      {/* Key Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { value: '20', label: 'Standard Biases', sub: '+ 11 investment-specific' },
          { value: '16', label: 'AI Agent Pipeline', sub: 'Parallel execution' },
          { value: '146', label: 'Case Studies', sub: 'failures + successes' },
          { value: '3', label: 'Outcome Channels', sub: 'Autonomous detection' },
          { value: '2', label: 'AI Providers', sub: 'Gemini + Claude fallback' },
          { value: '4', label: 'Touchpoints', sub: 'Web, Slack, Extension, API' },
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
            Executive teams make high-stakes decisions on documents riddled with cognitive biases
            nobody detects
          </li>
          <li>A single bad strategic decision costs organizations millions in value destruction</li>
          <li>
            Decision-makers anchored to initial assumptions hold failing initiatives 40% longer than
            optimal
          </li>
          <li>
            Competitive pressure and time constraints trigger overconfidence and groupthink in 65%
            of major decisions (Malmendier &amp; Tate, 2008)
          </li>
          <li>
            Confirmation bias in due diligence causes teams to rubber-stamp rather than stress-test
            strategies
          </li>
          <li>
            No organization has a way to track which biases actually correlated with poor outcomes
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
            'Strategy Leaders',
            'No systematic decision quality measurement',
            'Document-level DQI scoring (0-100), bias tracking across projects',
          ],
          [
            'M&A / Decision Owners',
            'Memos anchored to initial assumptions',
            '20 cognitive biases detected with exact excerpts + coaching',
          ],
          [
            'Risk & Compliance',
            'Operational optimism in execution plans',
            'Boardroom simulation with custom personas (Risk, Ops, Finance, Domain)',
          ],
          [
            'Board / Stakeholders',
            'Reports cherry-pick metrics and frame selectively',
            'Document analysis: survivorship bias, selective reporting, framing',
          ],
          [
            'Executive Committees',
            'Groupthink silences genuine debate',
            'Blind voting, noise measurement, dissent tracking',
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
          A single avoided bad decision saves organizations{' '}
          <strong style={{ color: '#22c55e' }}>millions to billions</strong> in value. The platform
          pays for itself after one corrected thesis. Organizations using systematic decision
          hygiene report <strong style={{ color: '#22c55e' }}>up to 60% reduction</strong> in
          decision variance.
        </p>
      </div>

      {/* Recently Shipped */}
      <div style={card}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#8b5cf6' }} /> Recently Shipped
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
            <strong>Slack → Copilot Auto-Trigger</strong> — Auto-creates CopilotSession seeded with
            decision context after every Slack audit. &quot;Continue in Copilot&quot; button in
            Slack messages for seamless handoff.
          </li>
          <li>
            <strong>Intelligence Brief on Empty States</strong> — Contextual org intelligence (top
            dangerous biases, maturity grade, decision stats) replaces generic empty states across 4
            dashboard pages.
          </li>
          <li>
            <strong>Enhanced Slack Commands</strong> — 7 slash commands with rich Block Kit:{' '}
            <code>/di help</code> (categorized), <code>/di score</code> (instant bias check),{' '}
            <code>/di brief</code> (org intelligence), <code>/di status</code> (quality trends),{' '}
            <code>/di analyze</code> (with Copilot link).
          </li>
          <li>
            <strong>Bias Heat Map Enhancement</strong> — Density gutter minimap, confidence-based
            opacity, hover tooltips with excerpts, keyboard navigation (←→ cycle, H toggle).
          </li>
          <li>
            <strong>Enterprise Language Pivot</strong> — Decision types renamed from PE/VC-specific
            to enterprise-neutral (resource allocation, strategic proposal, initiative closure).
          </li>
          <li>
            <strong>Klein RPD Framework</strong> — Expert intuition amplification: pattern
            recognition cues, narrative pre-mortems, RPD mental simulator, personal calibration
            dashboard.
          </li>
          <li>
            <strong>Enhanced Public Demo</strong> — Streaming simulation UX with 3 sample docs, DQI
            badge, no login required at <code>/demo</code>
          </li>
          <li>
            <strong>Case Study Export</strong> — One-click anonymized, branded shareable analyses
            with permanent links for stakeholder reporting
          </li>
          <li>
            <strong>Browser Extension</strong> — Chrome extension with quick-score popup (&lt;5s)
            and full analysis sidepanel
          </li>
          <li>
            <strong>A/B Prompt Testing</strong> — Experiment CRUD with Thompson sampling
            auto-optimization
          </li>
          <li>
            <strong>Multi-Model Fallback</strong> — Gemini → Claude failover routing
          </li>
          <li>
            <strong>Quick Bias Check</strong> — Dashboard modal for instant &lt;5s bias scan via
            paste, shared Gemini utility across extension + platform
          </li>
          <li>
            <strong>Counterfactual Analysis API</strong> — &quot;What-if&quot; decision path
            computation with narrative explanations
          </li>
        </ul>
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
          <Zap size={18} style={{ color: '#f59e0b' }} /> 11-Agent Analysis Pipeline
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
  ├── [Bias Detective]      ── 20 cognitive biases + 11 investment-specific
  ├── [Noise Judge]         ── Statistical noise & variance scoring
  ├── [Verification]        ── Fact checking + compliance mapping
  ├── [Deep Analysis]       ── Linguistic, strategic & cognitive diversity
  ├── [Simulation]          ── Decision twin simulation + memory recall
  └── [RPD Recognition]     ── Klein pattern matching + expert heuristics

SYNTHESIS (Sequential)
  [Meta Judge] ──> [Risk Scorer] ──> END`}
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
            <div style={label}>INVESTMENT-SPECIFIC BIASES (11)</div>
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
            <Users size={16} style={{ color: '#16A34A' }} /> Boardroom Simulation
          </div>
          <ul
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 14,
            }}
          >
            <li>5 role-specific personas auto-selected</li>
            <li>Individual votes: APPROVE / REJECT / REVISE</li>
            <li>Dissent patterns and minority concerns</li>
            <li>Custom personas with configurable risk tolerance</li>
            <li>Twin Effectiveness: tracks which twins&apos; dissent was accurate</li>
            <li>Causal integration: personas briefed on org bias history</li>
          </ul>
        </div>
      </div>

      {/* Technical Architecture Quick Reference */}
      <div style={{ ...card, borderTop: '3px solid #16A34A' }}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#16A34A' }} /> Technical Architecture — Talking Points
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
                '11 agents in LangGraph DAG — preprocessing (sequential) → analysis (parallel fan-out) → synthesis (sequential)',
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
              label: 'Multi-Model Resilience',
              value:
                'Gemini → Claude automatic fallback when AI_FALLBACK_ENABLED=true. Model router at src/lib/ai/model-router.ts',
            },
            {
              label: 'Prompt Versioning',
              value:
                'Every analysis records its promptVersionId via SHA-256 hash deduplication for drift tracking',
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
              <div style={{ fontWeight: 700, color: '#16A34A', marginBottom: 2 }}>{item.label}</div>
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
      <div style={{ ...card, borderTop: '3px solid #16A34A' }}>
        <div style={sectionTitle}>
          <BarChart3 size={18} style={{ color: '#16A34A' }} /> Decision Quality Index (DQI)
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
              <span style={badge('#16A34A')}>{weight}</span>
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
            {TOXIC_PATTERN_DATA.map(p => (
              <ToxicPatternBadge key={p.label} pattern={p} />
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
            <li>10 named patterns (Echo Chamber, Sunk Ship, Blind Sprint, Yes Committee, Optimism Trap, Status Quo Lock, Recency Spiral, Golden Child, Doubling Down, Deadline Panic)</li>
            <li>Context amplifiers: monetary stakes (2x), absent dissent (1.3x), time pressure (1.25x), unanimous consensus (1.2x)</li>
            <li>Org-calibrated: thresholds adjust from your outcome data via CausalEdge weights</li>
            <li>Historical failure &amp; success rates from 146-case database with false-positive damping</li>
            <li><strong>NEW: Mitigation Playbooks</strong> — auto-generated, research-backed debiasing steps per pattern</li>
            <li><strong>NEW: Dollar Impact</strong> — estimated financial risk from deal ticket size × failure rate</li>
            <li><strong>NEW: Trend Sparklines</strong> — per-org toxic score trajectory over time</li>
            <li><strong>NEW: Org Benchmarks</strong> — compare your patterns to anonymized global averages</li>
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
              title: '146 Case Studies',
              desc: '131 failures + 15 successes across 8 industries, with pre-decision evidence',
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
        <ul
          style={{
            fontSize: 13,
            color: 'var(--text-secondary, #b4b4bc)',
            lineHeight: 1.8,
            paddingLeft: 16,
            marginTop: 12,
          }}
        >
          <li>
            <strong>Setup Guide UI:</strong> Step-by-step wizard in Settings → Integrations with
            connection status indicators
          </li>
          <li>
            <strong>Token Expiry Detection:</strong> Automatic detection of revoked/expired tokens
            with markInstallationInactive()
          </li>
          <li>
            <strong>Error Recovery:</strong> Graceful handling of auth failures in nudge delivery
            with structured logging
          </li>
        </ul>
      </div>

      {/* Slack Deep Analysis */}
      <div style={{ ...card, borderTop: '3px solid #4A154B' }}>
        <div style={sectionTitle}>
          <MessageSquare size={18} style={{ color: '#4A154B' }} /> Slack Deep Thread Analysis
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Run <code>/di analyze</code> inside any Slack thread to trigger a full decision analysis.
          The bot fetches all thread messages, combines them with timestamps and speaker attribution,
          and runs the complete analysis pipeline — then posts rich results back to the thread.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              title: 'Thread Fetching',
              desc: 'conversations.replies API with pagination for threads with 100+ messages',
            },
            {
              title: 'Speaker Attribution',
              desc: 'Each message tagged with user + timestamp — detects group dynamics and influence patterns',
            },
            {
              title: 'Full Pipeline',
              desc: 'Creates a Document record and runs the same 11-node analysis pipeline as uploaded docs',
            },
            {
              title: 'In-Thread Results',
              desc: 'Rich Block Kit card posted directly to the thread with score, biases, and dashboard link',
            },
          ].map((item, i) => (
            <div key={i} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{item.title}</div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Forwarding */}
      <div style={{ ...card, borderTop: '3px solid #16A34A' }}>
        <div style={sectionTitle}>
          <Mail size={18} style={{ color: '#16A34A' }} /> Email Forwarding Integration
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Every user gets a unique email address (<code>analyze+token@in.decision-intel.com</code>).
          Forward any document or paste decision text — auto-analyzed with results emailed back.
          Zero setup, works from any email client on any device.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              title: 'Attachment Parsing',
              desc: 'PDF, DOCX, XLSX, CSV, PPTX extracted and analyzed automatically',
            },
            {
              title: 'Body Text Fallback',
              desc: 'No attachment? Email body text is analyzed as a decision document',
            },
            {
              title: 'Confirmation Email',
              desc: 'Immediate reply with link to results in dashboard',
            },
            {
              title: 'Secure Token Auth',
              desc: 'Unique per-user token, Resend webhook HMAC verification, rate + plan limits',
            },
          ].map((item, i) => (
            <div key={i} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{item.title}</div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Google Drive */}
      <div style={{ ...card, borderTop: '3px solid #4285F4' }}>
        <div style={sectionTitle}>
          <HardDrive size={18} style={{ color: '#4285F4' }} /> Google Drive Connector
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Connect Google Drive, select folders to watch. New documents are auto-analyzed every 10
          minutes. For PE/VC firms, deal memos landing in Drive are analyzed before anyone opens them.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              title: 'OAuth 2.0 Connection',
              desc: 'Secure Google OAuth with encrypted refresh token storage (AES-256-GCM)',
            },
            {
              title: 'Folder Watch',
              desc: 'Select specific folders to monitor — only watched folders trigger analysis',
            },
            {
              title: 'Google Docs Support',
              desc: 'Google Docs, Sheets, Slides auto-exported to analyzable format + all standard files',
            },
            {
              title: 'Polling Cron Job',
              desc: 'Drive Changes API polled every 10 min. Deduplication via file ID tracking',
            },
          ].map((item, i) => (
            <div key={i} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{item.title}</div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Browser Extension */}
      <div style={card}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#f59e0b' }} /> Browser Extension (Chrome)
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
            <strong>Quick Score Popup:</strong> &lt;5 second bias-only scan from any webpage. Sends
            to <code>/api/extension/quick-score</code>
          </li>
          <li>
            <strong>Full Analysis Sidepanel:</strong> Complete 11-agent pipeline from the browser.
            Calls <code>/api/extension/analyze</code>
          </li>
          <li>
            <strong>Auth:</strong> API key + user ID via extension options. Rate limited: 30 req/hr
            (quick) / 10 req/hr (full)
          </li>
          <li>
            <strong>Content Script:</strong> Annotates page text with detected biases inline
          </li>
          <li>
            <strong>PDF Support:</strong> Extracts text from PDF tabs for analysis
          </li>
        </ul>
      </div>

      {/* Product Analytics */}
      <div style={card}>
        <div style={sectionTitle}>
          <BarChart3 size={18} style={{ color: '#06b6d4' }} /> Product Analytics
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
            <strong>Client Library:</strong> <code>trackEvent(name, properties)</code> —
            fire-and-forget, no await needed
          </li>
          <li>
            <strong>API Endpoint:</strong> <code>POST /api/analytics/events</code> — stores in
            AnalyticsEvent table, auth optional
          </li>
          <li>
            <strong>Key Events:</strong> demo_viewed, demo_sample_selected, roi_calculator_used,
            case_study_shared, extension_installed, slack_connected, signup_started,
            first_analysis_completed
          </li>
          <li>
            <strong>Schema Drift Safe:</strong> Returns 200 silently if table doesn&apos;t exist
          </li>
        </ul>
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
            <Users size={16} style={{ color: '#16A34A' }} /> Committee Decision Rooms
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

function StrategyAndPositioning() {
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
            '10 named patterns + learned patterns + mitigation playbooks + dollar impact estimation',
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
          [
            'Multi-Model Resilience',
            'Medium',
            'Gemini → Claude fallback. No single provider dependency. Easy to add more.',
          ],
          [
            'A/B Prompt Testing',
            'High',
            'Thompson sampling + effectiveness data per variant. Proprietary optimization data.',
          ],
          [
            'Case Study Export',
            'Low',
            'Simple feature but high conversion value. Social proof for sales.',
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
      <div style={{ ...card, borderLeft: '3px solid #16A34A' }}>
        <div style={sectionTitle}>
          <Rocket size={18} style={{ color: '#16A34A' }} /> The Deepest Moat
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

      {/* ── Toxic Combination Deep-Dive (Moat Narrative) ── */}
      <ToxicCombinationMoatNarrative />

      {/* ── Founder Pitch Script ── */}
      <FounderPitchScript />

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
              <li>11-agent pipeline with deterministic compound scoring on top</li>
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
              what: 'Deal management and pipeline CRM for enterprise and PE/VC. Tracks deal flow, pipeline stages, reporting.',
              gap: 'No cognitive analysis of IC materials. Tracks the deal, not the quality of the decision-making about the deal.',
              response:
                '"DealCloud tracks your pipeline. We audit the decisions your pipeline produces. Upload the strategic document from DealCloud — we score it in 60 seconds."',
              color: '#16A34A',
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
                '"Blueflame reads the documents faster. We read the decision-maker\'s blind spots. Our 11-agent pipeline detects 20 biases they can\'t see."',
              color: '#ef4444',
            },
            {
              name: 'ChatGPT / Claude (direct)',
              what: 'General-purpose LLM. Some firms ask it to "analyze for biases."',
              gap: 'Single model opinion (no noise measurement), no deterministic scoring, no outcome tracking, no org calibration, no domain-specific biases.',
              response:
                '"That\'s one opinion from one model. We use 3 independent judges for noise measurement, a 20x20 bias interaction matrix for compound scoring, and an outcome flywheel that makes us smarter with every decision you make. Plus Chrome extension for real-time checking and Slack for meeting-time coaching."',
              color: '#16A34A',
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

      {/* ── Market Strategy Section ── */}
      <div style={{ ...card, borderTop: '3px solid #22c55e', marginTop: 24 }}>
        <div style={label}>PRIMARY MARKET</div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-primary, #fff)',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          Enterprise Decision Teams
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Any team making high-stakes, document-driven decisions — M&amp;A, corporate strategy, risk
          assessment, vendor selection, product launches. The competitive white space is real. The
          buyer is accessible. PE/VC investment committees are a proven first vertical with
          quantifiable ROI.
        </p>
      </div>

      {/* Sharpened Value Prop */}
      <div style={{ ...card, borderLeft: '3px solid #16A34A' }}>
        <div style={sectionTitle}>
          <Rocket size={18} style={{ color: '#16A34A' }} /> Investor-Ready Positioning
        </div>
        <blockquote
          style={{
            margin: 0,
            padding: '12px 16px',
            borderLeft: '3px solid #16A34A',
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            fontStyle: 'italic',
            background: 'rgba(22, 163, 74, 0.04)',
            borderRadius: '0 8px 8px 0',
          }}
        >
          &quot;Decision Intel is a cognitive bias auditing engine for high-stakes executive teams.
          We analyze strategic documents — board memos, M&amp;A proposals, risk assessments, vendor
          evaluations — to detect the specific biases that destroy organizational value: anchoring
          to initial assumptions, confirmation bias in due diligence, sunk cost in failing
          initiatives, and groupthink in committee decisions. We produce a proprietary Decision
          Quality Index — think FICO score for strategic decisions — and our outcome tracking
          flywheel means the platform gets smarter with every decision an organization makes.&quot;
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
              'Enterprise M&A / Strategy',
              '$10M-10B/decision',
              '1-3 mo',
              'Built for it',
              'CSO / Corp Dev VP',
              'PRIMARY',
            ],
            [
              'PE/VC ICs',
              '$50-500M/deal',
              '1-2 mo',
              'Proven vertical',
              'MP / Head of IC',
              'PROVEN',
            ],
            ['Risk & Compliance', '$10M-1B', '2-4 mo', 'Strong fit', 'CRO / GRC Lead', 'Year 1-2'],
            ['Hedge Funds', '$10M-1B/pos', '3-6 mo', 'Moderate', 'PM / CIO', 'Year 2+'],
            ['Gov/Defense', '$100M-10B', '18-36 mo', 'FedRAMP req', 'Procurement', 'Year 3+'],
            ['Corp Boards', 'Varies', '6-12 mo', 'Expanding', 'Board Secretary', 'Year 3+'],
          ].map(([market, value, cycle, fit, buyer, verdict], i) => {
            const isPrimary = verdict === 'PRIMARY' || verdict === 'PROVEN';
            const verdictColor = isPrimary ? '#22c55e' : verdict === 'No' ? '#ef4444' : '#f59e0b';
            return [
              <div
                key={`m${i}`}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-primary, #222)',
                  fontWeight: isPrimary ? 700 : 400,
                  color: isPrimary ? 'var(--text-primary)' : 'var(--text-secondary)',
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
          <CheckCircle size={18} style={{ color: '#22c55e' }} /> Why This Market Wins
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              title: 'Product Already Built',
              desc: '20 cognitive biases, strategic document analysis, project pipeline tracking, outcome logging, committee rooms with blind prior collection. Works across M&A, strategy, risk, and investment decisions.',
            },
            {
              title: 'Genuine White Space',
              desc: 'Nobody is doing cognitive bias auditing of enterprise decision-making processes. Competitors focus on CRM, pipeline management, or generic AI. We own the decision quality category.',
            },
            {
              title: 'Accessible Buyer',
              desc: 'Strategy teams, M&A groups, and risk committees have decision authority. A VP of Strategy or Head of M&A can greenlight a pilot. PE/VC firms (5-50 people) are the fastest-closing segment.',
            },
            {
              title: 'Cross-Industry Pull',
              desc: 'Cognitive bias is universal. Every industry making high-stakes decisions — finance, healthcare, technology, government — has the same problem. One product, many verticals.',
            },
            {
              title: 'Quantifiable ROI',
              desc: 'A single avoided bad decision saves millions. On a Starter-to-Team subscription, that is 100-1000x ROI. The easiest sales conversation possible.',
            },
            {
              title: 'Academic Backing',
              desc: "Kahneman's Noise, Malmendier & Tate on decision errors, behavioral bias costs organizations billions annually in value destruction. The research is on your side.",
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
          <Rocket size={18} style={{ color: '#f59e0b' }} /> Expansion Markets
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            {
              market: 'PE/VC Investment Committees',
              reason:
                'Proven first vertical with quantifiable ROI ($50M-$500M per avoided bad deal). Product includes 11 investment-specific biases, IC memo analysis, IRR/MOIC outcome tracking. Tight-knit community drives word-of-mouth. Fastest sales cycle (1-2 months).',
            },
            {
              market: 'Hedge Funds',
              reason:
                'High decision volume and alpha erosion is well-documented ($4.3B lost on Ackman-Valeant from disposition effect alone). Single-PM funds need adapted workflow, but multi-manager funds map well to our committee features.',
            },
            {
              market: 'Insurance & Risk',
              reason:
                'Large premium-at-risk decisions with documented bias patterns. Regulatory pressure (NY DFS, Solvency II) creates compliance pull. Longer sales cycle but high contract values.',
            },
            {
              market: 'Government/Defense',
              reason:
                'Massive decision spend ($850B DoD budget alone). FedRAMP certification needed (12-18 months). High-value contracts justify the compliance investment. Year 3+ expansion target.',
            },
            {
              market: 'Corporate Boards',
              reason:
                '85% of leaders report "decision distress." Board memo analysis, strategy paper auditing, and governance workflows are natural extensions of the current product. Growing demand for decision quality governance.',
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
            $0-999
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>
              /month
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
            <li>Starter: Free (3 analyses) → Professional: $349/mo → Team: $999/mo</li>
            <li>Avoid 1 bad decision per year = millions saved</li>
            <li>
              ROI: <strong style={{ color: '#22c55e' }}>100-1000x</strong> the subscription cost
            </li>
            <li>Enterprise: Custom pricing for SSO, unlimited, dedicated support</li>
            <li>Land with Professional, expand to Team seats + Enterprise</li>
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
            <li>Decision intelligence market: $12.2B → $46.4B by 2030</li>
            <li>Enterprise GRC software: $50B+ and growing at 14% CAGR</li>
            <li>PE/VC software vertical: $607B → $995B by 2035</li>
            <li>Fortune 500 + mid-market = 10,000+ addressable organizations</li>
            <li>Cross-industry applicability expands TAM beyond any single vertical</li>
          </ul>
        </div>
      </div>

      {/* Expansion Roadmap */}
      <div style={card}>
        <div style={sectionTitle}>
          <Rocket size={18} style={{ color: '#16A34A' }} /> Expansion Roadmap
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          {[
            {
              year: 'Year 1',
              market: 'Enterprise Decision Teams',
              color: '#22c55e',
              status: 'NOW',
              details:
                'M&A, corporate strategy, risk assessment, vendor evaluation. Board memos, strategy papers, project pipeline. PE/VC as proven first vertical.',
            },
            {
              year: 'Year 2',
              market: 'Financial Services Vertical',
              color: '#3b82f6',
              status: 'NEXT',
              details:
                'Deeper PE/VC penetration, hedge funds, credit committees. Investment-specific biases and IRR/MOIC tracking as differentiators.',
            },
            {
              year: 'Year 3',
              market: 'Government & Insurance',
              color: '#f59e0b',
              status: 'PLANNED',
              details:
                'FedRAMP certification unlocks government. Regulatory compliance pull in insurance. High contract values justify longer sales cycles.',
            },
            {
              year: 'Year 4+',
              market: 'Horizontal Platform',
              color: '#16A34A',
              status: 'VISION',
              details:
                'Decision quality as infrastructure. API-first platform for any organization. Industry-specific bias modules as add-ons.',
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

      {/* GTM Assets (Recently Shipped) */}
      <div style={card}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#8b5cf6' }} /> GTM Assets Now Live
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
            <strong>Interactive Demo at /demo:</strong> Streaming simulation UX with 3 sample docs
            (Nokia, Series B, Phoenix). No login required. Feels like the real product.
          </li>
          <li>
            <strong>Data-Backed ROI Calculator:</strong> Landing page ROI section now pulls from{' '}
            <code>/api/public/outcome-stats</code> — shows real outcome data when ≥10 exist,
            Kahneman baselines otherwise.
          </li>
          <li>
            <strong>Case Study Export:</strong> One-click &quot;Share as Case Study&quot; from any
            analysis. Anonymized, branded, permanent links. Perfect for stakeholder decks and sales
            collateral.
          </li>
          <li>
            <strong>Chrome Extension:</strong> Quick-score popup (&lt;5s) for real-time bias
            checking from any webpage. Full analysis from sidepanel.
          </li>
        </ul>
      </div>
    </div>
  );
}

// ─── Tab Content: Sales Toolkit (Objection Handler + Demo Script) ────────────

// ─── Toxic Pattern Knowledge Base ──────────────────────────────────────────

const TOXIC_PATTERN_DATA = [
  {
    label: 'Echo Chamber',
    biases: ['Groupthink', 'Confirmation Bias'],
    trigger: 'No dissenting voices present',
    why: 'Creates a self-reinforcing belief loop. The group only hears what it already believes, and challenging evidence is dismissed as noise. The absence of dissent is mistaken for agreement.',
    score: 85,
    research: 'Janis (1972) — Groupthink in policy fiascoes; Kahneman & Tversky (1974) — Anchoring',
  },
  {
    label: 'Sunk Ship',
    biases: ['Sunk Cost Fallacy', 'Anchoring Bias'],
    trigger: 'High monetary stakes (>$100K)',
    why: 'Prior investment anchors the team to their original thesis. The more you\'ve spent, the harder it is to walk away — even when new evidence says you should. The anchor makes "double down" feel safer than "cut losses."',
    score: 80,
    research: 'Arkes & Blumer (1985) — Sunk Cost; Thaler (1980) — Mental Accounting',
  },
  {
    label: 'Blind Sprint',
    biases: ['Availability Heuristic', 'Overconfidence Bias'],
    trigger: 'Time pressure present',
    why: 'Under time pressure, the brain shortcuts to easily recalled information (what\'s vivid, not what\'s representative). Overconfidence makes the team feel certain about a decision they haven\'t properly stress-tested.',
    score: 75,
    research: 'Tversky & Kahneman (1973) — Availability; Lichtenstein et al. (1982) — Overconfidence',
  },
  {
    label: 'Yes Committee',
    biases: ['Groupthink', 'Authority Bias'],
    trigger: 'Unanimous consensus reached',
    why: 'The most senior person speaks first and sets the anchor. Authority bias makes juniors defer. Unanimity is mistaken for quality — but Strebulaev\'s Stanford research shows consensus-seeking ICs have LOWER IPO rates.',
    score: 82,
    research: 'Milgram (1963) — Authority Obedience; Strebulaev (Stanford GSB, 2024) — VC consensus',
  },
  {
    label: 'Optimism Trap',
    biases: ['Overconfidence Bias', 'Confirmation Bias'],
    trigger: 'High monetary stakes (>$100K)',
    why: 'Decision-makers selectively gather supporting evidence while being overly confident in a high-stakes bet. They ask "why should we invest?" instead of "why might this fail?" The higher the stakes, the stronger the confirmation pull.',
    score: 78,
    research: 'Kahneman & Lovallo (1993) — Planning Fallacy; Tetlock (2005) — Forecasting',
  },
  {
    label: 'Status Quo Lock',
    biases: ['Status Quo Bias', 'Anchoring Bias'],
    trigger: 'No dissenting voices present',
    why: 'Inaction feels safe because it\'s the default. Anchoring to "how we\'ve always done it" combined with nobody pushing for change creates invisible paralysis. The cost of NOT acting is never calculated.',
    score: 70,
    research: 'Samuelson & Zeckhauser (1988) — Status Quo Bias; Thaler & Sunstein (2008) — Nudge',
  },
  {
    label: 'Recency Spiral',
    biases: ['Recency Bias', 'Availability Heuristic'],
    trigger: 'Time pressure present',
    why: 'Last quarter\'s results dominate the discussion. The most recent data point is the most emotionally salient, drowning out 5-year trends. Under time pressure, there\'s no space to pull up the long view.',
    score: 72,
    research: 'Tversky & Kahneman (1973) — Availability; Taleb (2007) — Narrative Fallacy',
  },
  {
    label: 'Golden Child',
    biases: ['Halo Effect', 'Confirmation Bias', 'Authority Bias'],
    trigger: 'Always active (no context required)',
    why: 'A prestigious brand, charismatic founder, or elite pedigree creates an aura that blinds the team to red flags. Three biases compound: the halo makes everything look good, confirmation bias filters for supporting evidence, and authority bias prevents questioning.',
    score: 82,
    research: 'Thorndike (1920) — Halo Effect; Nisbett & Wilson (1977) — Attribution Errors',
  },
  {
    label: 'Doubling Down',
    biases: ['Gambler\'s Fallacy', 'Overconfidence Bias', 'Sunk Cost Fallacy'],
    trigger: 'High monetary stakes (>$100K)',
    why: 'Three biases create an escalation spiral: the belief that losses must reverse (gambler\'s), confidence that this time will be different (overconfidence), and inability to walk away from prior investment (sunk cost). This is how $10M write-offs become $100M write-offs.',
    score: 85,
    research: 'Staw (1976) — Escalation of Commitment; Brockner (1992) — Entrapment',
  },
  {
    label: 'Deadline Panic',
    biases: ['Zeigarnik Effect', 'Planning Fallacy'],
    trigger: 'Time pressure present',
    why: 'Incomplete-task anxiety (Zeigarnik) creates psychological pressure to close, fast. Combined with planning fallacy (underestimating complexity), the team compresses timelines and makes rushed commitments to achieve the feeling of "done."',
    score: 78,
    research: 'Zeigarnik (1927) — Task Completion; Buehler et al. (1994) — Planning Fallacy',
  },
];

function ToxicPatternBadge({ pattern }: { pattern: typeof TOXIC_PATTERN_DATA[number] }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span style={badge('#ef4444')}>{pattern.label}</span>
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onBlur={() => setTimeout(() => setShowTooltip(false), 200)}
        aria-label={`Learn about ${pattern.label} pattern`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginLeft: -4,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <HelpCircle size={12} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
      </button>
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            width: 320,
            padding: 14,
            background: 'var(--bg-primary, #0a0a0a)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 50,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: 6, fontSize: 13 }}>
            {pattern.label}
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8, fontSize: 11 }}>
              Base score: {pattern.score}/100
            </span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Biases: </span>
            <span style={{ color: 'var(--text-secondary)' }}>{pattern.biases.join(' + ')}</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trigger: </span>
            <span style={{ color: 'var(--text-secondary)' }}>{pattern.trigger}</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Why it&apos;s dangerous: </span>
            <span style={{ color: 'var(--text-secondary)' }}>{pattern.why}</span>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6, marginTop: 4 }}>
            <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: 10 }}>{pattern.research}</span>
          </div>
        </div>
      )}
    </span>
  );
}

// ─── Toxic Combination Moat Narrative ──────────────────────────────────────

function ToxicCombinationMoatNarrative() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ ...card, borderLeft: '3px solid #ef4444' }}>
      <div
        style={{ ...sectionTitle, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <AlertTriangle size={18} style={{ color: '#ef4444' }} /> Why Toxic Combinations Is Your Most Differentiable Feature
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </div>

      {expanded && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 12 }}>
          <p style={{ marginBottom: 16 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Every AI product in decision intelligence can detect individual biases.</strong>{' '}
            That&apos;s table stakes. Feed a document into Claude or GPT, ask &quot;what cognitive biases are present?&quot; and you get a list. That&apos;s a weekend project. What you&apos;ve built is fundamentally different in three ways that compound on each other:
          </p>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ ...badge('#3b82f6'), fontSize: 11 }}>1</span>
              <strong style={{ color: '#60a5fa', fontSize: 14 }}>The Interaction Math, Not the Detection</strong>
            </div>
            <p style={{ marginLeft: 28, marginBottom: 0 }}>
              Individual bias detection is like checking blood pressure. Toxic combination detection is like understanding that{' '}
              <strong style={{ color: 'var(--text-primary)' }}>high blood pressure + high cholesterol + smoking together create cardiac risk 8x worse than any single factor</strong>.
              The nonlinear compounding is where the actual danger lives. Your 10 named patterns encode specific{' '}
              <em>contextual trigger conditions</em>. &quot;The Echo Chamber&quot; isn&apos;t just groupthink + confirmation bias — it&apos;s those biases{' '}
              <strong style={{ color: '#fca5a5' }}>when dissent is absent</strong>. That third variable turns moderate concern into critical alert.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ ...badge('#22c55e'), fontSize: 11 }}>2</span>
              <strong style={{ color: '#4ade80', fontSize: 14 }}>The Org-Specific Calibration Loop (The Real Moat)</strong>
            </div>
            <p style={{ marginLeft: 28, marginBottom: 0 }}>
              Your CausalEdge weights mean the <strong style={{ color: 'var(--text-primary)' }}>same bias pair might be dangerous at Firm A but benign at Firm B</strong>, and your system knows the difference.
              A PE firm with strong dissent culture might show Echo Chamber patterns but still make great decisions — their process compensates. Your system learns this from outcomes and dials down the alert.
              A competitor would need to: (1) convince customers to report outcomes, (2) wait 18+ months for data, (3) build causal inference, (4) calibrate per-org thresholds. That&apos;s not a sprint — it&apos;s a multi-year flywheel with cold-start problems at every stage.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ ...badge('#f59e0b'), fontSize: 11 }}>3</span>
              <strong style={{ color: '#fbbf24', fontSize: 14 }}>False-Positive Damping (The Quiet Killer Feature)</strong>
            </div>
            <p style={{ marginLeft: 28, marginBottom: 0 }}>
              Your system tracks when a pattern was flagged but the decision <strong style={{ color: 'var(--text-primary)' }}>succeeded anyway</strong> — and uses that to reduce the pattern&apos;s effective failure rate.
              Alert fatigue kills every monitoring product. You&apos;ve built anti-alert-fatigue into the scoring math.
              Combined with beneficial pattern damping (dissent encouraged → lower scores, external advisors → lower scores), your system learns not just{' '}
              <em>what&apos;s dangerous</em> but <em>what protective factors make dangerous patterns survivable</em>.
            </p>
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(22, 163, 74, 0.08)', borderRadius: 8, border: '1px solid rgba(22, 163, 74, 0.2)' }}>
            <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: 6, fontSize: 13 }}>
              <Lightbulb size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
              The Bottom Line
            </div>
            <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-primary)' }}>
              Detection is a feature. Calibrated compound risk scoring with mitigation playbooks and dollar quantification is a product category. The pitch isn&apos;t &quot;we detect bias.&quot; The pitch is: &quot;We know which specific combination of biases, in your specific organizational context, with your specific deal dynamics, has historically led to the worst outcomes — and we have a research-backed playbook to prevent it, with a dollar figure attached.&quot; That&apos;s the difference between a thermometer and a cardiologist.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Founder Pitch Script ─────────────────────────────────────────────────

function FounderPitchScript() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ ...card, borderLeft: '3px solid #00d2ff' }}>
      <div
        style={{ ...sectionTitle, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <MessageSquare size={18} style={{ color: '#00d2ff' }} /> Pitch Script: The Toxic Combinations Story
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </div>

      {expanded && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 12 }}>
          {[
            {
              label: 'OPEN (10s)',
              script: '"Every AI tool can flag individual biases. That\'s table stakes now. But here\'s what nobody else does—"',
              note: 'Pause. Let them lean in.',
            },
            {
              label: 'THE ANALOGY (15s)',
              script: '"Detecting a single bias is like checking blood pressure. Useful, but not the full picture. We detect when multiple biases COMBINE with situational factors — time pressure, absent dissent, high stakes — to create compound risk that\'s 8x worse than any single factor. It\'s the difference between a blood pressure reading and a cardiac risk assessment."',
              note: 'The medical analogy is sticky. People remember it.',
            },
            {
              label: 'THE DEMO MOMENT (20s)',
              script: '"[Show toxic combination card] See this? \'The Echo Chamber\' — confirmation bias plus groupthink, triggered by the fact that nobody in this memo disagreed. This pattern has a 45% historical failure rate. On your $50M deal, that\'s $22.5M at risk. And here\'s the 4-step mitigation playbook with the academic research behind each step."',
              note: 'The dollar figure makes it visceral. The playbook makes it actionable. The research makes it credible.',
            },
            {
              label: 'THE MOAT (15s)',
              script: '"And here\'s what makes this impossible to replicate: our system learns which patterns are actually dangerous for YOUR specific organization. Firm A might be immune to Echo Chambers because they have strong dissent culture. Firm B might be devastated by them. We know the difference — because we track outcomes. Every decision you run through the platform makes the next detection more accurate."',
              note: 'Emphasize "YOUR specific organization" — personalization is the moat.',
            },
            {
              label: 'THE CLOSE (10s)',
              script: '"Your competitors are using ChatGPT to get a list of biases. You\'d be using a system that knows which specific combinations, in your specific context, with your specific deal dynamics, have historically led to the worst outcomes — with a dollar figure and a playbook attached."',
              note: '"Thermometer vs. cardiologist." Drop this line if they need one phrase to remember.',
            },
          ].map((step, i) => (
            <div key={i} style={{ marginBottom: 16, paddingLeft: 12, borderLeft: '2px solid rgba(0, 210, 255, 0.2)' }}>
              <div style={{ fontWeight: 700, color: '#00d2ff', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {step.label}
              </div>
              <div style={{ color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: 4 }}>
                {step.script}
              </div>
              <div style={{ fontSize: 11, color: '#f59e0b' }}>
                💡 {step.note}
              </div>
            </div>
          ))}

          <div style={{ padding: '12px 16px', background: 'rgba(0, 210, 255, 0.06)', borderRadius: 8, border: '1px solid rgba(0, 210, 255, 0.15)', marginTop: 8 }}>
            <strong style={{ color: '#00d2ff', fontSize: 12 }}>ONE-LINER FOR INVESTORS:</strong>
            <p style={{ margin: '6px 0 0', color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>
              &quot;We&apos;re building the Wiz of decision intelligence — compound risk scoring for cognitive biases, not cloud vulnerabilities. Same insight: individual findings are noise, combinations are signal.&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

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
              &quot;Swing with confidence. Make bolder strategic bets because you&apos;ve
              stress-tested the decision. Decision Intel gives your team permission to be
              ambitious.&quot;
            </div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Why this works:</strong> Strebulaev
          (Stanford GSB) shows the best decision-makers optimize for bold moves, not risk avoidance.
          Leaders don&apos;t want a safety net — they want a decision quality amplifier. The
          defensive pitch attracts compliance buyers. The offensive pitch attracts strategy leaders.
        </p>
      </div>

      {/* Objection Handler */}
      <div style={{ ...card, borderTop: '3px solid #f59e0b' }}>
        <div style={sectionTitle}>
          <Shield size={18} style={{ color: '#f59e0b' }} /> Objection Handler
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          The exact objections enterprise buyers will raise and your prepared responses.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            {
              objection: '"We already have a good decision process."',
              response:
                "Great — upload your last 3 strategic documents and let's see what the DQI scores look like. Most organizations score 45-65 on their first run. The question isn't whether your process is good — it's whether there are blind spots nobody is catching.",
              tone: 'Curious, not confrontational',
            },
            {
              objection: '"How is this different from just asking ChatGPT?"',
              response:
                "ChatGPT gives you one opinion from one model. We use 3 independent judges to measure noise, a 20x20 bias interaction matrix for compound scoring, 31 domain-specific biases that general models don't know to look for, and an outcome flywheel that makes us smarter with every decision you make. Plus Chrome extension for real-time checking and Slack for meeting-time coaching. It's the difference between asking a friend and hiring a forensic auditor.",
              tone: 'Technical credibility',
            },
            {
              objection: '"Our team would never share strategic documents with an external tool."',
              response:
                'We GDPR-anonymize every document before it touches AI — names, companies, and numbers are tokenized. The PII never leaves the anonymization layer. Plus, you self-host your data on your own Supabase instance. We can do an on-prem demo if that helps.',
              tone: 'Address security directly',
            },
            {
              objection: '"We don\'t have budget for another software tool."',
              response:
                "A single avoided bad decision saves millions. Even if we prevent one strategic error per year, that's a 100-1000x ROI on the subscription. What's the cost of NOT catching the next anchoring bias in your board memo?",
              tone: 'ROI framing',
            },
            {
              objection: '"We tried AI tools before and they weren\'t useful."',
              response:
                "Were they general-purpose AI or purpose-built for high-stakes decisions? We have 20 cognitive biases including domain-specific ones like anchoring to initial estimates, sunk cost in failing initiatives, and groupthink in committee decisions that no general tool detects. Plus, our outcome tracking means we calibrate to YOUR organization's actual decision patterns — not generic advice.",
              tone: 'Specificity wins',
            },
            {
              objection: '"How long until we see value?"',
              response:
                "Upload your first strategic document — you'll have a full bias audit with DQI score in under 60 seconds. The Boardroom Simulation alone usually surfaces something nobody in the room raised. First-day value, not first-quarter value.",
              tone: 'Immediate gratification',
            },
            {
              objection: '"We\'re a small team, we don\'t need this."',
              response:
                'Small teams are actually more vulnerable to groupthink and authority bias — fewer voices means blind spots compound. Our Slack integration embeds cognitive coaching directly in your strategic discussions, no workflow change required. Think of it as a silent partner who only speaks up when they spot a bias.',
              tone: 'Turn weakness into strength',
            },
            {
              objection: '"Can I try it before committing?"',
              response:
                "Absolutely — visit /demo right now. Pick from 3 sample documents and watch the full 11-agent pipeline run in real time with streaming progress. No login, no commitment. Or send us 3 of your own strategic documents and we'll run a free pilot with full DQI scoring and bias reports.",
              tone: 'Zero friction',
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
          <Rocket size={18} style={{ color: '#16A34A' }} /> Demo Script — Step by Step
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Follow this sequence for maximum impact. Total demo time: 8-12 minutes.
        </p>
        {[
          {
            step: 1,
            title: 'Setup (30 sec)',
            action:
              'Open the dashboard. Have a sample strategic document ready — ideally one from a real decision that had a known outcome (good or bad). Alternative: open /demo for a no-login streaming simulation with 3 pre-loaded samples.',
            tip: 'If using their own document, even better. If not, the /demo page has Nokia, Series B, and Phoenix samples with full streaming UX.',
          },
          {
            step: 2,
            title: 'Upload & Analyze (60 sec)',
            action:
              'Drag the document onto the upload zone. Click "Analyze." While the SSE stream runs, narrate what the 11 agents are doing: "Right now, our noise judge is scoring this document for variance, while our bias detective is scanning for 20 cognitive biases..."',
            tip: 'The streaming progress bar is your friend — it creates anticipation.',
          },
          {
            step: 3,
            title: 'DQI Score Reveal (60 sec)',
            action:
              'When the score appears, pause for dramatic effect. "Your document scored 47/100 — that\'s a D grade. Let me show you why."',
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
              'Switch to the Boardroom tab. Show the 5 decision personas voting. "Your Risk Officer voted REJECT because of concentration risk. Your Operations Lead flagged execution timeline as unrealistic. Did anyone on your real team raise these points?"',
            tip: 'This is usually where the prospect goes quiet and starts thinking about their last major decision. Let the silence land.',
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
              'If detected, show the toxic combination card with the auto-generated mitigation playbook. "\'The Echo Chamber\' — confirmation bias plus groupthink in a high-stakes context. This pattern appears in 73% of our historical failure cases. Estimated risk: $22.5M on this deal. Here\'s your 4-step debiasing playbook with research citations."',
            tip: 'The named patterns are memorable and shareable. The dollar impact makes it visceral. The mitigation playbook makes it actionable. Prospects will mention these to colleagues.',
          },
          {
            step: 8,
            title: 'Close (60 sec)',
            action:
              '"Imagine if every strategic document went through this before the decision. How many of your last 10 major decisions would have scored differently?" Offer: free pilot — 3 documents analyzed, no commitment.',
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
                background: '#16A34A',
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
              <div style={{ fontSize: 11, color: '#16A34A', fontStyle: 'italic' }}>
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
              audience: 'Chief Strategy Officer (30 sec)',
              pitch:
                "We're building a cognitive bias auditing engine for strategic decisions. Upload a board memo, get a Decision Quality Score in 60 seconds — think FICO for organizational decisions. Our outcome flywheel means we learn which biases actually cost your organization money, so the platform gets sharper with every decision.",
            },
            {
              audience: 'M&A / Corp Dev Lead (30 sec)',
              pitch:
                'We detect 20 cognitive biases in strategic documents — including anchoring to initial estimates, sunk cost in failing deals, and groupthink in committee decisions. Our Boardroom Simulation creates virtual decision-makers who vote on your thesis. Plus a Chrome extension for real-time bias checking and Slack integration for meeting-time coaching. It usually surfaces the objection nobody in the room raised.',
            },
            {
              audience: 'Board / Executive Sponsor (60 sec)',
              pitch:
                "Decision Intel is the cognitive bias auditing engine for high-stakes executive teams. We sit between analysis and commitment — the one place in the decision workflow where nobody provides quality tools. 11-agent AI pipeline, proprietary Decision Quality Index, and an outcome tracking flywheel. Decision intelligence market is $12.2B going to $46.4B by 2030 — we're creating a new category.",
            },
            {
              audience: 'Technical Audience (30 sec)',
              pitch:
                'LangGraph-based 11-agent pipeline with deterministic compound scoring on top of LLM output. 20x20 bias interaction matrix, Bayesian prior integration, Granger-causal temporal inference for our decision knowledge graph. Not a wrapper — we built the scoring math.',
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

      {/* ─── Challenger Sale playbook ────────────────────────────────────── */}
      <div style={{ ...card, borderLeft: '3px solid #3b82f6' }}>
        <div style={sectionTitle}>
          <Target size={18} style={{ color: '#3b82f6' }} /> The Challenger Sale Playbook
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
          Matt Dixon and Brent Adamson, CEB/Gartner research on 6,000+ reps. Top enterprise performers
          teach the buyer something counterintuitive about their own business, tailor the insight,
          then take control. Decision Intel is a natural Challenger product because the pitch itself
          is a reframe of how buyers think about their own decision process.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', marginBottom: 6 }}>
              1. TEACH
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Lead with the counterintuitive insight, not the product. Example: &quot;Kahneman&apos;s
              insurance underwriter study found 55% variance where people expected 10%. Your IC has
              the same problem and nobody measures it.&quot; The reframe is the hook.
            </div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', marginBottom: 6 }}>
              2. TAILOR
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Translate the insight into the buyer&apos;s vocabulary. For a PE partner: thesis
              confirmation, management halo, winner&apos;s curse. For a corporate strategist: strategic
              drift, groupthink, escalation of commitment. Mirror their language, not yours.
            </div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', marginBottom: 6 }}>
              3. TAKE CONTROL
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Don&apos;t ask &quot;what do you think?&quot; after the demo. Direct the next step:
              &quot;Send me the last three IC memos that went sideways. I will run them through the
              engine and we will reconvene Thursday.&quot; Constructive tension over consensus.
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 8,
            background: 'rgba(59, 130, 246, 0.04)',
            border: '1px dashed rgba(59, 130, 246, 0.25)',
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Why this fits Decision Intel:</strong>{' '}
          Relationship Builders are the worst performers in complex B2B. Challengers close deals
          because they change how the buyer thinks. Our product is a reframe. Lean into it.
        </div>
      </div>

      {/* ─── MEDDPICC qualification checklist ───────────────────────────── */}
      <div style={{ ...card, borderLeft: '3px solid #8b5cf6' }}>
        <div style={sectionTitle}>
          <CheckCircle size={18} style={{ color: '#8b5cf6' }} /> MEDDPICC Qualification Checklist
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
          Score every enterprise opportunity above $50k on these eight dimensions weekly. Deals that
          cannot answer all eight by week 4 should be triaged, not nursed. Originated at PTC (1996),
          extended by Dick Dunkel and Andy Whyte.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            {
              letter: 'M',
              name: 'Metrics',
              prompt:
                'What is the quantified economic impact we are delivering? For DI: $X avoided loss per flagged toxic combination, Y hours saved per IC cycle.',
            },
            {
              letter: 'E',
              name: 'Economic Buyer',
              prompt:
                'Who personally signs the PO? Do we have direct access or only through a champion? If champion-only, this deal will slip.',
            },
            {
              letter: 'D',
              name: 'Decision Criteria',
              prompt:
                'What criteria will the buyer use to compare us to alternatives? Are the criteria written down? Have we influenced them?',
            },
            {
              letter: 'D',
              name: 'Decision Process',
              prompt:
                'Who signs off and in what order? How many committees? What is the realistic close timeline given that process?',
            },
            {
              letter: 'P',
              name: 'Paper Process',
              prompt:
                'Security review, legal redlines, procurement, vendor onboarding. Map every form and signature before the deal is verbally won.',
            },
            {
              letter: 'I',
              name: 'Identify Pain',
              prompt:
                'What specifically hurts today? A bad IC call they still regret? A noisy committee? If the pain is abstract, the deal is not real.',
            },
            {
              letter: 'C',
              name: 'Champion',
              prompt:
                'Is there one internal person who sells for us when we are not in the room and has authority to move the deal forward? Named, not assumed.',
            },
            {
              letter: 'C',
              name: 'Competition',
              prompt:
                'Incumbent, do-nothing, build-it-in-house, and any direct competitor. For DI the most common competitor is do-nothing dressed up as &quot;we have a good process.&quot;',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 160px 1fr',
                gap: 12,
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(139, 92, 246, 0.04)',
                border: '1px solid rgba(139, 92, 246, 0.12)',
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#8b5cf6',
                  textAlign: 'center',
                }}
              >
                {item.letter}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {item.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.prompt}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SPIN discovery script ──────────────────────────────────────── */}
      <div style={{ ...card, borderLeft: '3px solid #f59e0b' }}>
        <div style={sectionTitle}>
          <MessageSquare size={18} style={{ color: '#f59e0b' }} /> SPIN Discovery Script
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
          Neil Rackham&apos;s research on 35,000+ sales calls. Large-ticket sales are won by asking
          a specific sequence of questions that make the buyer articulate their own pain. Use these
          verbatim on the first discovery call.
        </p>
        {[
          {
            stage: 'Situation',
            color: '#f59e0b',
            questions: [
              'Walk me through how your IC reviews a deal today, from memo drafting to final vote.',
              'How many deals did you review last year and how many closed?',
              'Who writes the memo, who reviews it, and how do dissenting views get captured?',
            ],
          },
          {
            stage: 'Problem',
            color: '#f59e0b',
            questions: [
              'When was the last time you greenlit a deal you later regretted? What would you have wanted to see before voting yes?',
              'How do you know when your committee is rubber-stamping versus genuinely debating?',
              'How do you track whether your ICs improve over time?',
            ],
          },
          {
            stage: 'Implication',
            color: '#f59e0b',
            questions: [
              'If one out of every ten yes-votes is actually a bad call, what does that cost this fund over a vintage?',
              'When the noise in your committee is invisible, how do you tell a bold bet from a biased one?',
              'If a competitor firm had a measurable decision quality score and you did not, would LPs eventually ask about it?',
            ],
          },
          {
            stage: 'Need-Payoff',
            color: '#f59e0b',
            questions: [
              'If you could see the bias and noise profile of every IC memo in under 60 seconds, would you run it on the next three deals?',
              'What would it be worth to catch one Echo Chamber pattern before capital was committed?',
              'If your partners saw a rising Decision Quality Index over two quarters, how would that change your LP narrative?',
            ],
          },
        ].map((block, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: block.color,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {block.stage}
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
              }}
            >
              {block.questions.map((q, j) => (
                <li key={j}>{q}</li>
              ))}
            </ul>
          </div>
        ))}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
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
            { value: kpis?.decisionsTracked ?? '—', label: 'Outcomes Tracked', color: '#16A34A' },
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
            <Target size={16} style={{ color: '#16A34A' }} /> Calibration Metrics
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
              <Users size={16} style={{ color: '#16A34A' }} /> Twin Effectiveness (Live)
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

      {/* Demo Funnel (from analytics) */}
      <div style={card}>
        <div style={sectionTitle}>
          <TrendingUp size={16} style={{ color: '#8b5cf6' }} /> Demo &amp; Conversion Funnel
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          Track with <code>trackEvent()</code> from <code>src/lib/analytics/track.ts</code>. Query
          via <code>GET /api/analytics/events?name=demo_viewed</code>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[
            { event: 'hero_cta_clicked', label: 'Hero CTA Click' },
            { event: 'demo_sample_selected', label: 'Sample Selected' },
            { event: 'demo_simulation_started', label: 'Sim Started' },
            { event: 'demo_simulation_completed', label: 'Sim Completed' },
            { event: 'demo_paste_analyzed', label: 'Paste Analyzed' },
            { event: 'roi_calculator_used', label: 'ROI Calculated' },
            { event: 'signup_started', label: 'Signup Started' },
            { event: 'analysis_completed', label: 'Analysis Done' },
            { event: 'quick_scan_completed', label: 'Quick Scan' },
            { event: 'case_study_viewed', label: 'Case Study View' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 8,
                borderRadius: 8,
                background: 'var(--bg-tertiary, #0a0a0a)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                {item.label}
              </div>
              <div
                style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)' }}
              >
                {item.event}
              </div>
            </div>
          ))}
        </div>
      </div>

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
            background: 'rgba(22, 163, 74, 0.06)',
            border: '1px solid rgba(22, 163, 74, 0.12)',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', marginBottom: 3 }}>
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

// ─── Tab Content: Playbook & Research (merged) ─────────────────────────────

function PlaybookAndResearch() {
  const [section, setSection] = useState<
    'all' | 'vc' | 'foundations' | 'category' | 'gtm' | 'strategy'
  >('all');
  const [expandedResearch, setExpandedResearch] = useState<Set<string>>(new Set());

  const toggleResearchSection = useCallback((id: string) => {
    setExpandedResearch(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedResearch(new Set(['vc', 'foundations', 'category', 'gtm', 'strategy']));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedResearch(new Set());
  }, []);

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
      {/* Sales Positioning */}
      <div style={{ ...card, borderTop: '3px solid #f59e0b' }}>
        <div style={sectionTitle}>
          <Target size={18} style={{ color: '#f59e0b' }} /> Sales Positioning
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              persona: 'Strategy Leaders',
              hook: '"How do you measure decision quality today?"',
              pitch:
                'Show DQI scoring across their last 10 major decisions. Highlight the ones with low scores that later underperformed.',
              close: 'Free pilot: upload 3 recent strategic documents and see the scores.',
            },
            {
              persona: 'M&A / Decision Owners',
              hook: '"When was the last time someone challenged the core thesis?"',
              pitch:
                'Demo the Boardroom Simulation on their own document. The "Risk Officer" persona usually surfaces something nobody raised.',
              close: 'Let them see their own blind spots in real-time.',
            },
            {
              persona: 'Risk / Compliance',
              hook: '"How do you document decision rationale for stakeholder reporting?"',
              pitch:
                'Show the compliance mapping + audit trail. Regulatory requirements are a real pain point for regulated organizations.',
              close:
                'Compliance is the "vitamin" that gets you in the door; the bias detection is the "painkiller" that keeps them.',
            },
            {
              persona: 'Board / Stakeholders',
              hook: '"Do your reports pass the survivorship bias test?"',
              pitch:
                'Upload a sample board report — the platform will flag selective reporting, framing effects, and cherry-picked metrics.',
              close: 'Position as decision transparency tool for the entire organization.',
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

      {/* Prioritized Backlog */}
      <div style={card}>
        <div style={sectionTitle}>
          <Rocket size={18} style={{ color: '#16A34A' }} /> Prioritized Backlog
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
            'Longitudinal Bias Tracking',
            'Very High',
            '6h',
            'Track bias drift across project lifecycle. Does confirmation bias increase from screening to follow-on?',
          ],
          [
            'Knowledge Graph Explorer (D3)',
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
            'Jockey/Horse Balance Score',
            'High',
            '3h',
            'Detect when IC memos are 80% team pedigree / 20% fundamentals. Flag imbalanced theses.',
          ],
          [
            'Analytics Dashboard UI',
            'High',
            '4h',
            'Visualize product analytics events, demo funnel conversion',
          ],
          [
            'Extension Chrome Web Store',
            'Very High',
            '6h',
            'Publish extension for frictionless distribution',
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

      {/* Founder Notes */}
      <div style={{ ...card, borderLeft: '3px solid #16A34A' }}>
        <div style={sectionTitle}>
          <BookOpen size={18} style={{ color: '#16A34A' }} /> Founder Notes
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

      {/* ── Research Section ── */}
      <div style={{ ...card, borderTop: '3px solid #8b5cf6', marginTop: 24 }}>
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

      {/* Sub-section pills + expand/collapse */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button
            onClick={expandAll}
            style={{
              padding: '4px 10px',
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid var(--border-primary, #333)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            style={{
              padding: '4px 10px',
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid var(--border-primary, #333)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* ── VC Decision Science ── */}
      {(section === 'all' || section === 'vc') && (
        <>
          <div
            style={{ ...card, borderLeft: '3px solid #16A34A', cursor: 'pointer' }}
            onClick={() => toggleResearchSection('vc')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>
                VC Decision Science
              </div>
              <ChevronDown
                size={16}
                style={{
                  color: '#16A34A',
                  transform: expandedResearch.has('vc') ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </div>
          </div>
          {expandedResearch.has('vc') && (
            <div
              style={{ ...card, borderLeft: '3px solid #16A34A', marginTop: -8, borderTop: 'none' }}
            >
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
                      'Go all-in on enterprise decision teams. Don\'t build 6 features for 4 markets. Your "home run" is one flagship customer that becomes a case study. Accept that some features won\'t land.',
                    actions: [
                      'Rewrite landing page hero from "avoid mistakes" to "make better decisions with confidence"',
                      'Focus pilot outreach on 5 target organizations, not 50',
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
                      "Be embedded in your target communities. Strategy conferences, M&A events, risk management circles. Don't sell from the outside — be part of the ecosystem.",
                    actions: [
                      'Attend 2 industry conferences per quarter',
                      'Launch a "Decision Quality" newsletter for enterprise leaders',
                      'Build a Slack community for decision-makers',
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
                      "Spend 30 min daily reading industry news, academic papers on decision science, and competitor updates. Your Intelligence Hub's 14 RSS feeds should be your own morning briefing too.",
                    actions: [
                      'Rename "Pre-Meeting Bias Briefing" to "Prepared Mind Briefing" in marketing',
                      'Add a "Prepare for Meeting" CTA before committee meetings',
                      'Subscribe to 3 industry newsletters personally',
                    ],
                    color: '#8b5cf6',
                  },
                  {
                    num: 6,
                    principle: 'Fast Lane, Then Slow Lane',
                    summary:
                      'VCs use rapid filtering first ("why NOT invest?" to eliminate red flags), then switch to deep 120-hour due diligence for serious prospects.',
                    product:
                      'BUILD THIS: Quick Scan mode — a fast, lightweight bias check (30 seconds) that flags top 2-3 red flags before committing to the full 11-agent pipeline (4 minutes). Mirrors how VCs actually work. Reduces adoption friction dramatically.',
                    startup:
                      'Apply to your sales process too. Qualify leads fast — "Do you have a decision committee? Do you review strategic documents before major decisions?" If no to either, move on. Don\'t spend 2 hours demoing to someone who doesn\'t have the workflow.',
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
                      'This is your highest-level pitch narrative: "Decision Intel doesn\'t just protect organizational outcomes — it improves the quality of decision-making across the economy." When a biased committee kills a good initiative, innovation is lost. When a biased team backs a bad strategy, resources that could have gone to better opportunities are wasted.',
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
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}
                    >
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
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--text-primary, #fff)',
                        }}
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
                          background: 'rgba(22, 163, 74, 0.06)',
                          border: '1px solid rgba(22, 163, 74, 0.15)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#16A34A',
                            marginBottom: 4,
                          }}
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
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#22c55e',
                            marginBottom: 4,
                          }}
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
                      <div
                        style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 4 }}
                      >
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
              <ResearchCard
                title="Daniel Kahneman: Beyond Cognitive Biases — Reducing Noise"
                source="ClearerThinking Podcast"
                type="Podcast"
                color="#22c55e"
                link="https://podcast.clearerthinking.org/episode/072/"
                insight="Insurance underwriter study: executives expected 10% variability between judges. Actual: 55%. One underwriter prices at $9,500, another at $16,700 for the identical case. Noise is at least as damaging as bias, and organizations almost never measure it."
                product="Your triple-judge noise scoring is a direct implementation of Kahneman's proposed methodology. Use the 10% vs 55% stat in every sales conversation — it's the 'holy shit' moment that makes executives realize they have no idea how much variability exists in their own decision processes."
                startup="Offer a free 'noise audit' of a team's last 5 strategic documents as a top-of-funnel hook. Let them see the problem before pitching the solution."
                actions={[
                  'Use 10% vs 55% stat in opening of every demo',
                  'Build free noise audit landing page',
                  'Create 1-pager: "How Much Noise Is In Your Decisions?"',
                ]}
              />
            </div>
          )}
        </>
      )}

      {/* ── Decision Science Foundations ── */}
      {(section === 'all' || section === 'foundations') && (
        <>
          <div
            style={{ ...card, borderLeft: '3px solid #f59e0b', marginTop: 16, cursor: 'pointer' }}
            onClick={() => toggleResearchSection('foundations')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                Decision Science Foundations
              </div>
              <ChevronDown
                size={16}
                style={{
                  color: '#f59e0b',
                  transform: expandedResearch.has('foundations')
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </div>
          </div>
          {expandedResearch.has('foundations') && (
            <div style={{ ...card, borderLeft: '3px solid #f59e0b', marginTop: -8 }}>
              <ResearchCard
                title='Olivier Sibony: "Decision Hygiene" Framework'
                source="Behavioral Grooves Podcast + Euronews"
                type="Podcast / Interview"
                color="#f59e0b"
                link="https://behavioralgrooves.com/episode/noise-with-olivier-sibony/"
                insight="Kahneman's co-author on Noise, former McKinsey partner. Framework: checklists, premortems, structured independent assessments, and noise audits. Noise audits should be the starting point — orgs need to see how bad the problem is before buying a solution."
                product="Your entire product IS decision hygiene. Sibony's framework validates every feature: structured analysis (bias detection), independent assessments (triple-judge), premortems (Pre-Mortem Architect agent), and noise audits (noise decomposition)."
                startup="His 'noise audit first' approach suggests a powerful sales motion: offer a free noise audit of 5 strategic documents as top-of-funnel. Let prospects SEE the problem before pitching the solution."
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
                product="Klein RPD framework NOW SHIPPED: recognition cues from historical decisions, narrative war-story pre-mortems, RPD mental simulator, and personal calibration dashboard. DI sits at the intersection: structured AI analysis (Kahneman) augmenting expert human judgment (Klein), not replacing it. Dual-framework positioning is live — skeptical leaders can see their intuition amplified, not overridden."
                startup="When leaders push back with 'we trust our judgment,' don't argue. Say: 'We do too. Klein proved expert intuition is powerful. Our RPD framework surfaces the pattern recognition cues an expert with 10+ similar decisions would notice. We amplify your intuition while making sure it's not undermined by noise and bias you can't see.'"
                actions={[
                  '✅ Klein RPD framework shipped: recognition cues, narrative pre-mortems, RPD simulator, calibration dashboard',
                  'Use Kahneman-Klein dual framework in sales: "We suppress bias AND amplify intuition"',
                  'Demo the RPD tab as second wow moment after Boardroom Simulation',
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
                product="DI IS a human-machine hybrid: AI detects biases and measures noise, humans make the final call. Tetlock gives you the language: 'Process beats talent. Our platform ensures your team follows the process that produces better outcomes.'"
                startup="'Process beats talent' in one sentence IS your entire value proposition. Use Tetlock's authority to back this claim."
                actions={[
                  'Add Tetlock citation to product philosophy page',
                  'Use "process beats talent" in pitch decks',
                  'Reference Hybrid Mind tournament results in technical DD',
                ]}
              />
            </div>
          )}
        </>
      )}

      {/* ── Category Creation ── */}
      {(section === 'all' || section === 'category') && (
        <>
          <div
            style={{ ...card, borderLeft: '3px solid #ef4444', marginTop: 16, cursor: 'pointer' }}
            onClick={() => toggleResearchSection('category')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>
                Category Creation
              </div>
              <ChevronDown
                size={16}
                style={{
                  color: '#ef4444',
                  transform: expandedResearch.has('category') ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </div>
          </div>
          {expandedResearch.has('category') && (
            <div style={{ ...card, borderLeft: '3px solid #ef4444', marginTop: -8 }}>
              <ResearchCard
                title='Christopher Lochhead: "How to Become a Category Pirate"'
                source="Lenny's Podcast"
                type="Podcast / Newsletter"
                color="#ef4444"
                link="https://www.lennysnewsletter.com/p/how-to-become-a-category-pirate-christopher"
                insight="The company that creates a category captures 2/3 of the market value. Framework: 'Frame It, Name It, Claim It.' The 'better trap' — competing on being better within an existing category — is death."
                product={
                  'You\'re not building a "better CRM" or a "better DD tool." You\'re creating the category of Investment Decision Quality. Your DQI should become the term PE uses like IRR and MOIC. When someone says "What\'s the DQI on this memo?" in a strategy meeting or IC, you\'ve won. Lochhead calls this "languaging" — weaponizing vocabulary.'
                }
                startup="Frame the problem (Strategic decisions are riddled with undetected bias and noise), name the solution (Decision Quality Index), claim the category (Decision Intel is the decision quality platform for capital allocators). This is your most important strategic task."
                actions={[
                  'Make DQI the centerpiece term in all marketing',
                  'Write a "Category Point of View" document (Lochhead framework)',
                  'PR strategy: get DQI mentioned in PE trade publications',
                  'Blog series: "The Hidden Cost of Decision Noise in Enterprise Decisions"',
                ]}
              />
            </div>
          )}
        </>
      )}

      {/* ── GTM & Sales ── */}
      {(section === 'all' || section === 'gtm') && (
        <>
          <div
            style={{ ...card, borderLeft: '3px solid #3b82f6', marginTop: 16, cursor: 'pointer' }}
            onClick={() => toggleResearchSection('gtm')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>GTM &amp; Sales</div>
              <ChevronDown
                size={16}
                style={{
                  color: '#3b82f6',
                  transform: expandedResearch.has('gtm') ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </div>
          </div>
          {expandedResearch.has('gtm') && (
            <div style={{ ...card, borderLeft: '3px solid #3b82f6', marginTop: -8 }}>
              <ResearchCard
                title="Ray Zhou (Affinity): From College Dropout to SaaS Leader"
                source="Platform Builders Podcast"
                type="Podcast"
                color="#3b82f6"
                link="https://www.heavybit.com/library/podcasts/platform-builders/ep-4-building-affinity-from-college-dropout-to-saas-leader-with-ray-zhou"
                insight="Built Affinity into late-eight-figure revenue CRM for PE/VC. Three lessons: (1) hundreds of problem-first conversations before building features, (2) founder-led onboarding for every early customer, (3) focus on problems closest to core business — tangential solutions get replaced when AI improves."
                product="Decision quality is about as core as it gets for any organization. That's your moat vs. the 'AI assistant' tools that summarize documents — those are tangential, yours is fundamental."
                startup="Personally onboard every pilot customer. Conduct 50+ discovery calls focused on 'how does your team actually make major decisions?' not 'let me show you features.' Zhou's outsider advantage (didn't know the industry) forced better questions — use yours the same way."
                actions={[
                  'Target 50 discovery calls before next feature sprint',
                  'Personally onboard every pilot — no self-serve yet',
                  'Document every onboarding as a playbook for future hires',
                  'Ask: "Walk me through your last major decision" in every call',
                ]}
              />
            </div>
          )}
        </>
      )}

      {/* ── Founder Strategy ── */}
      {(section === 'all' || section === 'strategy') && (
        <>
          <div
            style={{ ...card, borderLeft: '3px solid #16A34A', marginTop: 16, cursor: 'pointer' }}
            onClick={() => toggleResearchSection('strategy')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>
                Founder Strategy
              </div>
              <ChevronDown
                size={16}
                style={{
                  color: '#16A34A',
                  transform: expandedResearch.has('strategy') ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </div>
          </div>
          {expandedResearch.has('strategy') && (
            <div style={{ ...card, borderLeft: '3px solid #16A34A', marginTop: -8 }}>
              <ResearchCard
                title="Peter Thiel: Zero to One — Contrarian Truths"
                source="The Investors Podcast (MI383)"
                type="Podcast Deep Dive"
                color="#16A34A"
                link="https://www.theinvestorspodcast.com/millennial-investing/zero-to-one-lessons-from-peter-thiel-w-shawn-omalley/"
                insight='Contrarian question: "What important truth do very few people agree with you on?" Monopoly framework: dominate a small niche, then expand in concentric circles. Sales and distribution matter as much as product.'
                product={
                  'Your contrarian truth: "Executive teams think their decisions are rational, but they\'re riddled with measurable cognitive noise and bias that nobody audits." Your monopoly niche: enterprise decision quality. Your concentric expansion: Enterprise M&A/Strategy → PE/VC → FinServ → Horizontal.'
                }
                startup="The best 11-agent pipeline means nothing if you can't get it in front of decision-makers. Distribution strategy matters as much as the product. Conferences, Slack communities, thought leadership content, and referral loops from pilot customers are your channels."
                actions={[
                  'Write down your contrarian truth and use it in every pitch',
                  'Map your concentric expansion circles (already in Market Strategy tab)',
                  'Allocate 50% of time to distribution, not just product',
                  'Build referral incentive for pilot customers',
                ]}
              />
            </div>
          )}
        </>
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
      <div style={{ ...card, borderTop: '3px solid #16A34A', marginTop: 12 }}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#16A34A' }} /> Most Actionable Takeaways
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            {
              action: 'Reframe pitch from defensive to offensive',
              detail:
                '"Swing with confidence" not "avoid mistakes." The best teams don\'t want a safety net — they want a decision quality amplifier.',
            },
            {
              action: 'Cite Strebulaev in marketing',
              detail:
                'Academic credibility from Stanford GSB for blind priors and committee rooms. "Stanford research shows consensus-seeking committees underperform."',
            },
            {
              action: 'Build Quick Scan mode',
              detail:
                'Fast lane/slow lane. 30-second red flag scan before 4-minute full analysis. Matches actual decision workflow and reduces friction.',
            },
            {
              action: 'Build longitudinal bias tracking',
              detail:
                'Track bias drift across project lifecycle. The follow-on assessment should be MORE critical than the initial — is it? Nobody else will build this.',
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

// ─── Tab Content: Case Studies ─────────────────────────────────────────────

const OUTCOME_COLORS: Record<CaseOutcome, string> = {
  catastrophic_failure: '#ef4444',
  failure: '#f97316',
  partial_failure: '#eab308',
  partial_success: '#84cc16',
  success: '#22c55e',
  exceptional_success: '#06b6d4',
};

const OUTCOME_LABELS: Record<CaseOutcome, string> = {
  catastrophic_failure: 'Catastrophic Failure',
  failure: 'Failure',
  partial_failure: 'Partial Failure',
  partial_success: 'Partial Success',
  success: 'Success',
  exceptional_success: 'Exceptional Success',
};

function formatIndustry(s: string) {
  return s
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatBias(s: string) {
  return s
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function MethodologiesAndPrinciples() {
  return (
    <ErrorBoundary sectionName="Methodologies & Principles">
      <MethodologiesAndPrinciplesTab />
    </ErrorBoundary>
  );
}

function CaseStudiesTab() {
  const [filter, setFilter] = useState<'all' | 'failures' | 'successes'>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = getCaseStatistics();
  const industries = Object.keys(stats.byIndustry).sort();

  const filteredCases = ALL_CASES.filter(c => {
    if (filter === 'failures' && !isFailureOutcome(c.outcome)) return false;
    if (filter === 'successes' && !isSuccessOutcome(c.outcome)) return false;
    if (industryFilter !== 'all' && c.industry !== industryFilter) return false;
    return true;
  }).sort((a, b) => b.impactScore - a.impactScore);

  const filterBtn = (
    value: 'all' | 'failures' | 'successes',
    labelText: string,
    count: number,
  ): React.ReactNode => (
    <button
      key={value}
      onClick={() => setFilter(value)}
      style={{
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: filter === value ? 700 : 500,
        color: filter === value ? '#fff' : 'var(--text-muted, #71717a)',
        background: filter === value ? '#16A34A20' : 'transparent',
        border: filter === value ? '1px solid #16A34A' : '1px solid var(--border-primary, #333)',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {labelText} ({count})
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ ...card, borderLeft: '3px solid #16A34A' }}>
        <h2 style={sectionTitle}>
          <Library size={20} style={{ color: '#16A34A' }} />
          Real-World Case Studies Database
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          Meticulously sourced public company decisions — from catastrophic failures to exceptional
          successes. Each case study maps cognitive biases, toxic combinations, and mitigation
          patterns used by the analysis engine to calibrate risk scoring.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Cases', value: stats.totalCases, color: '#16A34A' },
          { label: 'Failure Cases', value: stats.failureCount, color: '#ef4444' },
          { label: 'Success Cases', value: stats.successCount, color: '#22c55e' },
          { label: 'Industries', value: Object.keys(stats.byIndustry).length, color: '#f59e0b' },
          { label: 'Unique Biases', value: stats.byBias.length, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={card}>
            <p style={label}>{s.label}</p>
            <p style={{ ...stat, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bias Frequency + Pattern Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Top Biases */}
        <div style={card}>
          <h3 style={{ ...sectionTitle, fontSize: 15 }}>
            <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
            Top Biases by Frequency
          </h3>
          {stats.byBias.slice(0, 10).map(([biasName, count]) => {
            const maxCount = stats.byBias[0]?.[1] ?? 1;
            return (
              <div key={biasName} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--text-secondary, #a1a1aa)',
                    marginBottom: 3,
                  }}
                >
                  <span>{formatBias(biasName)}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{count}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: 'var(--bg-tertiary, #1a1a1a)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(count / maxCount) * 100}%`,
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Patterns */}
        <div style={card}>
          <h3 style={{ ...sectionTitle, fontSize: 15 }}>
            <Network size={16} style={{ color: '#8b5cf6' }} />
            Named Patterns
          </h3>
          {stats.byPattern.length > 0 && (
            <>
              <p style={{ ...label, marginBottom: 8 }}>Toxic Combinations</p>
              {stats.byPattern.slice(0, 5).map(([pattern, count]) => (
                <div
                  key={pattern}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--border-primary, #222)',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: '#ef4444' }}>{pattern}</span>
                  <span style={badge('#ef4444')}>{count} cases</span>
                </div>
              ))}
            </>
          )}
          {stats.byBeneficialPattern.length > 0 && (
            <>
              <p style={{ ...label, marginTop: 16, marginBottom: 8 }}>Beneficial Patterns</p>
              {stats.byBeneficialPattern.slice(0, 5).map(([pattern, count]) => (
                <div
                  key={pattern}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--border-primary, #222)',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: '#22c55e' }}>{pattern}</span>
                  <span style={badge('#22c55e')}>{count} cases</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          ...card,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {filterBtn('all', 'All', stats.totalCases)}
        {filterBtn('failures', 'Failures', stats.failureCount)}
        {filterBtn('successes', 'Successes', stats.successCount)}
        <div style={{ marginLeft: 'auto' }}>
          <select
            value={industryFilter}
            onChange={e => setIndustryFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid var(--border-primary, #333)',
              background: 'var(--bg-secondary, #111)',
              color: 'var(--text-primary, #fff)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All Industries</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>
                {formatIndustry(ind)} ({stats.byIndustry[ind]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Case Study Cards */}
      <div style={{ marginTop: 4 }}>
        {filteredCases.map(c => {
          const isExpanded = expandedId === c.id;
          const outcomeColor = OUTCOME_COLORS[c.outcome];

          return (
            <div
              key={c.id}
              style={{
                ...card,
                borderLeft: `3px solid ${outcomeColor}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onClick={() => setExpandedId(isExpanded ? null : c.id)}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                      {c.company}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted, #71717a)' }}>
                      {c.year}
                    </span>
                    <span style={badge(outcomeColor)}>{OUTCOME_LABELS[c.outcome]}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary, #a1a1aa)', margin: '0 0 8px' }}>
                    {c.title}
                  </p>
                  {/* Bias Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {c.biasesPresent.map(b => (
                      <span
                        key={b}
                        style={{
                          ...badge(c.biasesManaged.includes(b) ? '#22c55e' : '#16A34A'),
                          fontSize: 10,
                        }}
                      >
                        {c.biasesManaged.includes(b) ? '\u2713 ' : ''}
                        {formatBias(b)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right side: Impact */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    {c.impactDirection === 'positive' ? (
                      <ArrowUpRight size={16} style={{ color: '#22c55e' }} />
                    ) : (
                      <ArrowDownRight size={16} style={{ color: '#ef4444' }} />
                    )}
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: c.impactDirection === 'positive' ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {c.impactScore}
                    </span>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0', maxWidth: 160 }}>
                    {c.estimatedImpact}
                  </p>
                  {isExpanded ? <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginTop: 4 }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)', marginTop: 4 }} />}
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-primary, #222)' }}>
                  {/* Summary */}
                  <div style={{ marginBottom: 14 }}>
                    <p style={label}>Summary</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary, #a1a1aa)', lineHeight: 1.7, margin: 0 }}>
                      {c.summary}
                    </p>
                  </div>

                  {/* Decision Context */}
                  <div style={{ marginBottom: 14 }}>
                    <p style={label}>Decision Context</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary, #a1a1aa)', lineHeight: 1.7, margin: 0 }}>
                      {c.decisionContext}
                    </p>
                  </div>

                  {/* Meta Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <p style={label}>Industry</p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>
                        {formatIndustry(c.industry)}
                      </p>
                    </div>
                    <div>
                      <p style={label}>Primary Bias</p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>
                        {formatBias(c.primaryBias)}
                      </p>
                    </div>
                    <div>
                      <p style={label}>Source Type</p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>
                        {formatIndustry(c.sourceType)}
                      </p>
                    </div>
                  </div>

                  {/* Toxic Combinations / Beneficial Patterns */}
                  {(c.toxicCombinations.length > 0 || c.beneficialPatterns.length > 0) && (
                    <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                      {c.toxicCombinations.length > 0 && (
                        <div>
                          <p style={label}>Toxic Combinations</p>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {c.toxicCombinations.map(p => (
                              <span key={p} style={badge('#ef4444')}>{p}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {c.beneficialPatterns.length > 0 && (
                        <div>
                          <p style={label}>Beneficial Patterns</p>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {c.beneficialPatterns.map(p => (
                              <span key={p} style={badge('#22c55e')}>{p}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mitigation Factors (success cases) */}
                  {c.mitigationFactors.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={label}>Mitigation Factors</p>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {c.mitigationFactors.map((f, i) => (
                          <li key={i} style={{ fontSize: 12, color: '#22c55e', lineHeight: 1.7 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lessons Learned */}
                  <div style={{ marginBottom: 14 }}>
                    <p style={label}>Lessons Learned</p>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {c.lessonsLearned.map((l, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 12,
                            color: 'var(--text-secondary, #a1a1aa)',
                            lineHeight: 1.7,
                            marginBottom: 4,
                          }}
                        >
                          {l}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Source */}
                  <div>
                    <p style={label}>Source</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted, #71717a)', margin: 0, fontStyle: 'italic' }}>
                      {c.source}
                    </p>
                  </div>

                  {/* Pre-Decision Evidence */}
                  {c.preDecisionEvidence && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 16,
                        borderRadius: 8,
                        background: 'var(--bg-tertiary, #0a0a0a)',
                        border: '1px solid #16A34A40',
                      }}
                    >
                      <p style={{ ...label, color: '#16A34A', marginBottom: 10 }}>
                        Pre-Decision Evidence — What the Platform Would Have Caught
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                        {c.preDecisionEvidence.documentType.replace(/_/g, ' ').toUpperCase()} — {c.preDecisionEvidence.date} — {c.preDecisionEvidence.source}
                      </p>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary, #a1a1aa)',
                          lineHeight: 1.7,
                          marginBottom: 12,
                          padding: '10px 14px',
                          borderLeft: '3px solid #16A34A40',
                          background: 'var(--bg-secondary, #111)',
                          borderRadius: 4,
                          fontStyle: 'italic',
                        }}
                      >
                        {c.preDecisionEvidence.document.length > 600
                          ? c.preDecisionEvidence.document.slice(0, 600) + '...'
                          : c.preDecisionEvidence.document}
                      </div>

                      <p style={{ ...label, color: '#ef4444', marginBottom: 6 }}>Detectable Red Flags at Decision Time</p>
                      <ul style={{ margin: '0 0 12px', paddingLeft: 18 }}>
                        {c.preDecisionEvidence.detectableRedFlags.map((flag, i) => (
                          <li key={i} style={{ fontSize: 12, color: '#ef4444', lineHeight: 1.7 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{flag}</span>
                          </li>
                        ))}
                      </ul>

                      <p style={{ ...label, color: '#f59e0b', marginBottom: 6 }}>Biases Flaggable Before Outcome</p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                        {c.preDecisionEvidence.flaggableBiases.map(b => (
                          <span key={b} style={badge('#f59e0b')}>{formatBias(b)}</span>
                        ))}
                      </div>

                      <p style={{ ...label, color: '#22c55e', marginBottom: 6 }}>Hypothetical DI Platform Analysis</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary, #a1a1aa)', lineHeight: 1.7, margin: 0 }}>
                        {c.preDecisionEvidence.hypotheticalAnalysis}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredCases.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: 40 }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              No case studies match the current filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Search Results ────────────────────────────────────────────────────────

function SearchResults({
  query,
  tabContent,
}: {
  query: string;
  tabContent: Record<TabId, React.ReactNode>;
}) {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // Render all tab contents and let the browser render them; we overlay a search notice
  return (
    <div>
      <div
        style={{
          ...card,
          borderLeft: '3px solid #16A34A',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Search size={14} style={{ color: '#16A34A', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Showing all tabs filtered by &quot;<strong style={{ color: '#16A34A' }}>{query}</strong>
          &quot; — use{' '}
          <kbd
            style={{
              padding: '1px 5px',
              borderRadius: 4,
              border: '1px solid var(--border-primary, #333)',
              fontSize: 11,
            }}
          >
            Ctrl+F
          </kbd>{' '}
          to jump to matches
        </span>
      </div>
      {TABS.map(tab => (
        <div key={tab.id} style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              padding: '8px 0',
              borderBottom: '1px solid var(--border-primary, #222)',
            }}
          >
            {tab.icon}
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {tab.label}
            </span>
          </div>
          {tabContent[tab.id]}
        </div>
      ))}
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
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

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

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    if (!unlocked) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [unlocked]);

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
              background: '#16A34A',
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
    dqi_methodology: <ErrorBoundary sectionName="DQI Methodology"><DqiMethodologyTab /></ErrorBoundary>,
    integrations: <IntegrationsAndFlywheel />,
    strategy: <StrategyAndPositioning />,
    sales: <SalesToolkit />,
    stats: <LiveStats />,
    playbook: <PlaybookAndResearch />,
    methodologies: <MethodologiesAndPrinciples />,
    case_studies: <CaseStudiesTab />,
    correlation_causal: <ErrorBoundary sectionName="Correlation & Causal"><CorrelationCausalTab /></ErrorBoundary>,
    content_studio: <ErrorBoundary sectionName="Content Studio"><ContentStudioTab founderPass={FOUNDER_PASS} /></ErrorBoundary>,
  };

  // TAB_CONTENT is rendered below after password gate

  return (
    <ErrorBoundary sectionName="Founder Hub">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header + Search */}
        <header style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Rocket size={26} style={{ color: '#16A34A' }} />
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
            {/* Global Search */}
            <div style={{ position: 'relative', width: 260 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #71717a)',
                }}
              />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search content... (⌘K)"
                style={{
                  width: '100%',
                  padding: '8px 32px 8px 30px',
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid var(--border-primary, #333)',
                  background: 'var(--bg-secondary, #111)',
                  color: 'var(--text-primary, #fff)',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 2,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted, #71717a)', margin: 0 }}>
            Your living knowledge board — product features, strategy, sales playbook, and research.
          </p>
        </header>

        {/* Tab Navigation — responsive scrollable strip */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            marginBottom: 24,
            overflowX: 'auto',
            borderBottom: '1px solid var(--border-primary, #222)',
            paddingBottom: 0,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                color:
                  activeTab === tab.id ? 'var(--text-primary, #fff)' : 'var(--text-muted, #71717a)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #16A34A' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
                flexShrink: 0,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {searchQuery ? (
          <SearchResults query={searchQuery} tabContent={TAB_CONTENT} />
        ) : (
          TAB_CONTENT[activeTab]
        )}

        {/* AI Chat Widget */}
        <FounderChatWidget founderPass={FOUNDER_PASS} />
      </div>
    </ErrorBoundary>
  );
}
