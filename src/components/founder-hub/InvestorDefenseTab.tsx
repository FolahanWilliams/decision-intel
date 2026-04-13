'use client';

import React, { useState } from 'react';
import {
  Crosshair,
  Shield,
  Target,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  BarChart3,
  MessageSquare,
} from 'lucide-react';

// ─── Local Styles ────────────────────────────────────────────────────────────

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

const lbl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: 6,
};

const bodyText: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary, #a1a1aa)',
  lineHeight: 1.7,
};

const codeBadge: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontFamily: 'monospace',
  background: 'rgba(22, 163, 74, 0.1)',
  color: '#16A34A',
  border: '1px solid rgba(22, 163, 74, 0.2)',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function InvestorDefenseTab() {
  return (
    <div>
      <PositioningStatement />
      <CloverpopComparison />
      <InvestorQA />
      <CompetitorMatrix />
      <MoatLayers />
      <CommonObjections />
    </div>
  );
}

// ─── Section 1: Positioning Statement ────────────────────────────────────────

function PositioningStatement() {
  return (
    <div style={{ ...card, borderLeft: '3px solid #16A34A' }}>
      <div style={sectionTitle}>
        <Crosshair size={18} style={{ color: '#16A34A' }} />
        Your Elevator Pitch
      </div>
      <blockquote
        style={{
          ...bodyText,
          fontSize: 15,
          fontStyle: 'italic',
          color: 'var(--text-primary, #fff)',
          borderLeft: '3px solid #16A34A',
          paddingLeft: 16,
          margin: '0 0 16px 0',
          lineHeight: 1.8,
        }}
      >
        &ldquo;You might be familiar with Cloverpop — they did a great job digitizing the
        decision-making process. We are doing something entirely different: we are auditing the
        psychological integrity of the decision itself.&rdquo;
      </blockquote>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            padding: 14,
            borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <div style={{ ...lbl, color: '#f59e0b' }}>Cloverpop</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
            System of Record
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #a1a1aa)', marginTop: 4 }}>
            Jira for decisions — logs what was decided and why
          </div>
        </div>
        <div
          style={{
            padding: 14,
            borderRadius: 8,
            background: 'rgba(22, 163, 74, 0.06)',
            border: '1px solid rgba(22, 163, 74, 0.2)',
          }}
        >
          <div style={{ ...lbl, color: '#16A34A' }}>Decision Intel</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
            System of Cognitive Auditing
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #a1a1aa)', marginTop: 4 }}>
            Grammarly for judgment — detects invisible cognitive flaws
          </div>
        </div>
      </div>
      <p style={{ ...bodyText, margin: 0 }}>
        We&apos;re building the Wiz of decision intelligence — compound risk scoring for cognitive
        biases, not cloud vulnerabilities. Detection is a feature. Calibrated compound risk scoring
        with mitigation playbooks and dollar quantification is a product category.
      </p>
    </div>
  );
}

// ─── Section 2: Cloverpop Comparison ─────────────────────────────────────────

const COMPARISON_ROWS: Array<{ dim: string; cloverpop: string; di: string }> = [
  { dim: 'Founded', cloverpop: '2012 (acquired by Clearbox 2021)', di: '2024' },
  { dim: 'Funding', cloverpop: '$12.6M across 5 rounds', di: 'Pre-seed' },
  {
    dim: 'Core Philosophy',
    cloverpop: 'Process drives better decisions',
    di: 'Human judgment is inherently flawed',
  },
  {
    dim: 'Primary Function',
    cloverpop: 'Decision workflows & playbooks',
    di: 'Autonomous cognitive auditing',
  },
  {
    dim: 'AI Capabilities',
    cloverpop: 'D-Sight: summarization, KPI synthesis, recommendations',
    di: 'Decision Knowledge Graph + LangGraph engine: bias detection, noise simulation, adversarial debate',
  },
  { dim: 'Bias Detection', cloverpop: 'None', di: '20+ types with compound interaction matrix' },
  {
    dim: 'Noise Measurement',
    cloverpop: 'None',
    di: 'Kahneman decomposition (level + pattern + occasion)',
  },
  {
    dim: 'Compliance Mapping',
    cloverpop: 'None',
    di: '7 frameworks (SOX, FCA, EU AI Act, Basel III, GDPR, SEC Reg D, LPOA)',
  },
  {
    dim: 'Target Market',
    cloverpop: 'Horizontal: Marketing, HR, Ops, Supply Chain',
    di: 'Vertical: Corporate Strategy, M&A, Executive Committees',
  },
  {
    dim: 'Output',
    cloverpop: 'Logged "Decision Flow" + AI recommendations',
    di: 'DQI score + Noise Tax + Audit Defense Packet',
  },
  {
    dim: 'Moat Type',
    cloverpop: 'Workflow adoption + Decision Bank data',
    di: 'Compound scoring IP + org-calibrated outcome flywheel',
  },
  { dim: 'Inc. 5000', cloverpop: '#608 (2025), ~300% 3yr growth', di: 'N/A (pre-revenue)' },
];

function CloverpopComparison() {
  return (
    <div style={{ ...card, borderLeft: '3px solid #f59e0b' }}>
      <div style={sectionTitle}>
        <Target size={18} style={{ color: '#f59e0b' }} />
        Cloverpop / Clearbox — Deep Comparison
      </div>
      <p style={{ ...bodyText, marginBottom: 16 }}>
        Cloverpop is the most visible incumbent in &ldquo;Decision Intelligence.&rdquo; Founded
        2012, raised $12.6M, acquired by Clearbox Decisions in 2021. Ranked #608 on the 2025 Inc.
        5000 with ~300% three-year revenue growth. They are a legitimate company — but they solve a
        fundamentally different problem.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 1fr',
            gap: 0,
            fontSize: 12,
            minWidth: 600,
          }}
        >
          {/* Header */}
          <div
            style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-muted, #71717a)' }}
          >
            Dimension
          </div>
          <div
            style={{ padding: '8px 10px', fontWeight: 700, color: '#f59e0b', textAlign: 'center' }}
          >
            Cloverpop (Clearbox)
          </div>
          <div
            style={{ padding: '8px 10px', fontWeight: 700, color: '#16A34A', textAlign: 'center' }}
          >
            Decision Intel
          </div>
          {/* Rows */}
          {COMPARISON_ROWS.map((row, i) => (
            <React.Fragment key={row.dim}>
              <div
                style={{
                  padding: '8px 10px',
                  fontWeight: 600,
                  color: 'var(--text-primary, #fff)',
                  borderTop: '1px solid var(--border-primary, #222)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}
              >
                {row.dim}
              </div>
              <div
                style={{
                  padding: '8px 10px',
                  color: 'var(--text-secondary, #a1a1aa)',
                  borderTop: '1px solid var(--border-primary, #222)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}
              >
                {row.cloverpop}
              </div>
              <div
                style={{
                  padding: '8px 10px',
                  color: 'var(--text-primary, #fff)',
                  borderTop: '1px solid var(--border-primary, #222)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}
              >
                {row.di}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: Investor Q&A ─────────────────────────────────────────────────

const QA_ITEMS: Array<{ q: string; a: string; proof?: string }> = [
  {
    q: 'Cloverpop has been around since 2012, raised $12.6M, and was acquired. They just integrated D-Sight AI. What stops them from wiping you out?',
    a: "Cloverpop built a brilliant workflow tool, essentially Jira for decisions. It relies on humans manually logging what they decided and why. But that is their vulnerability. Cloverpop assumes the humans entering the data are rational. Decision Intel assumes they are not. Our Decision Knowledge Graph ingests the strategic memo and autonomously audits the invisible flaws in the reasoning, then connects every assumption, bias, and outcome into a living network. By the time a decision makes it into Cloverpop's Decision Bank, Confirmation Bias and Sunk Cost Fallacy are already baked in. We intercept the cognitive noise before the board signs off.",
    proof:
      'src/lib/agents/graph.ts — LangGraph analysis engine with GDPR gating, adversarial debate, and compound scoring that feeds the Decision Knowledge Graph',
  },
  {
    q: "You're laser-focused on corporate strategy and M&A. Aren't you artificially limiting your TAM?",
    a: "We are applying Peter Thiel's monopoly framework: dominate a high-stakes, high-WTP vertical before expanding horizontally. Cloverpop's generic AI is fine for deciding where to host a corporate retreat. But a generic LLM cannot audit a $500M acquisition memo. Our engine has 11 proprietary, strategy-specific bias overlays — we hunt for Winner's Curse, Valuation Anchoring, and Synergy Overconfidence. When a CFO is approving a $200M acquisition, they don't want a horizontal HR collaboration tool. They want a specialized statistical jury. Because we're verticalized, we tie outputs directly to FCA Consumer Duty and SOX compliance — turning our software from nice-to-have into must-have regulatory CYA.",
    proof:
      'src/lib/compliance/frameworks/ — 7 regulatory framework implementations (SOX, FCA, EU AI Act, Basel III, GDPR, SEC Reg D, LPOA)',
  },
  {
    q: "You're a solo founder. They have millions and a massive team. Can't they reverse-engineer your pipeline in two months?",
    a: "The analysis engine is my temporary moat to get to market fast. My structural moat is the Decision Knowledge Graph and the Causal Loop, powered by pgvector and our proprietary failure database. If Cloverpop replicates the engine, they are still just doing text analysis. Decision Intel is building a closed-loop causal database. We ingest the strategic memo, our agents flag a 94% probability of Groupthink, and three years later we tie that specific bias to the actual outcome (revenue impact, initiative success, post-mortem findings). Once the platform can mathematically prove that 'Memos flagged for Sunk Cost Fallacy correlate with a 12% drop in initiative ROI,' I have a proprietary dataset nobody can replicate because that data lives inside enterprise strategy functions.",
    proof:
      'src/lib/graph/graph-builder.ts — pgvector knowledge graph with PageRank, Union-Find clustering, outcome-weighted edge learning. src/lib/learning/toxic-combinations.ts — org-calibrated toxic pattern engine',
  },
  {
    q: "PE partners have massive egos. They won't log into a dashboard to have an AI tell them their judgment is noisy. How do you get adoption?",
    a: "You are completely right, they will not log into a dashboard. That is why Cloverpop's Decision Playbooks require heavy change management and top-down mandates. I designed Decision Intel to require zero behavior change. Native Slack, Email, and Google Drive integrations wire the audit directly into the existing workflow. The AI lives where the strategy discussion is already happening. When a strategy manager uploads a board deck, pastes a market-entry memo, or drops a strategic recommendation in Slack, background agents run the audit and deliver a localized nudge. We do not ask anyone to learn a new workflow. We augment the workflow they are already using.",
    proof:
      'src/lib/integrations/slack/handler.ts — HMAC-verified, pattern-based decision detection with real-time bias nudging',
  },
  {
    q: "What's your moat? I can build this with OpenAI's API in a weekend hackathon.",
    a: 'A weekend gets you one LLM opinion with zero noise measurement. We use 3 independent judges for Kahneman noise decomposition. We have a 20x20 bias interaction matrix with contextual multipliers — dissent absent amplifies groupthink 1.25x, time pressure shifts scoring 1.15x. We detect biological signals like Winner Effect language and cortisol stress patterns. We have 146 curated case studies with cross-correlation patterns and reference class forecasting. The compound scoring engine alone is 10,000+ LOC of proprietary IP. A weekend hackathon gets you layer zero. Our moat is five layers deep.',
    proof:
      'src/lib/scoring/compound-engine.ts — deterministic post-LLM scoring with bio-signal detection. src/lib/scoring/noise-decomposition.ts — ANOVA-framework noise measurement. src/lib/data/case-correlations.ts — cross-case statistical patterns',
  },
  {
    q: "How do you actually make money? What's the unit economics?",
    a: "API cost per analysis: $0.03-0.07 using Gemini Flash. Strategy plan: $2,499/month. That is ~97% gross margin. The motion: free 30-day pilot on the buyer's next high-stakes strategic memo. The Knowledge Graph seeds during the trial. Then convert to Strategy subscription ($2,499/mo) or negotiate enterprise ($50K to $200K/yr ACV). The pilot converts because they would lose their Knowledge Graph data by not subscribing. Outcome tracking creates additional switching costs: calibration profiles and the Decision Knowledge Graph become org-specific assets that cannot transfer to a competitor.",
  },
  {
    q: 'What if OpenAI or Anthropic just builds this into their platform?',
    a: "LLM providers are infrastructure, not vertical SaaS. They don't have 7 compliance frameworks implemented, 146 case studies with outcome correlations, or an org-specific calibration flywheel. It's like asking 'What if AWS builds Datadog?' The platform layer and the domain layer are different businesses. Our value is the compound scoring engine + regulatory mapping + outcome learning, not the LLM inference. We swap LLM models freely — that's by design.",
  },
  {
    q: 'Show me traction.',
    a: "Working product at production URL. Full analysis engine processing real strategic memos end-to-end, with the Decision Knowledge Graph seeding from document one. Full auth (Google OAuth), multi-tenant orgs, team collaboration. Compliance frameworks (FCA, SOX, Basel III) fully implemented. Reviewed by the senior consultant who helped take Wiz public at $32B, quote: 'genuinely fascinated by the role of unconscious cognitive biases in decision-making.' LRQA executive (global risk management firm) review in progress. 146 reverse-engineered case studies across 8 industries. Cloverpop's Inc. 5000 #608 ranking with 300% growth validates that the decision intelligence category has enterprise demand.",
  },
];

function QAItem({ item }: { item: (typeof QA_ITEMS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        background: 'var(--bg-tertiary, #0a0a0a)',
        border: '1px solid var(--border-primary, #222)',
      }}
    >
      <div
        style={{ display: 'flex', gap: 8, cursor: 'pointer', alignItems: 'flex-start' }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ ...lbl, color: '#ef4444', marginBottom: 4 }}>INVESTOR</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary, #fff)',
              lineHeight: 1.5,
            }}
          >
            &ldquo;{item.q}&rdquo;
          </div>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 12, marginLeft: 22 }}>
          <div style={{ ...lbl, color: '#16A34A', marginBottom: 4 }}>YOUR ANSWER</div>
          <p style={{ ...bodyText, margin: '0 0 8px 0' }}>{item.a}</p>
          {item.proof && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(22, 163, 74, 0.06)',
                border: '1px solid rgba(22, 163, 74, 0.15)',
                fontSize: 11,
                color: '#16A34A',
                marginTop: 8,
              }}
            >
              <strong>Technical proof:</strong> <span style={codeBadge}>{item.proof}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InvestorQA() {
  return (
    <div style={{ ...card, borderLeft: '3px solid #ef4444' }}>
      <div style={sectionTitle}>
        <MessageSquare size={18} style={{ color: '#ef4444' }} />
        Ruthless Investor Q&A — Simulated
      </div>
      <p style={{ ...bodyText, marginBottom: 16 }}>
        8 tough questions investors will ask, with battle-tested answers grounded in your actual
        codebase. Click each to expand.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {QA_ITEMS.map((item, i) => (
          <QAItem key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─── Section 4: Competitor Matrix ────────────────────────────────────────────

type CellValue = 'yes' | 'partial' | 'no';

const CELL_STYLES: Record<CellValue, { bg: string; color: string; text: string }> = {
  yes: { bg: 'rgba(22,163,74,0.1)', color: '#16A34A', text: 'Yes' },
  partial: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', text: 'Partial' },
  no: { bg: 'rgba(239,68,68,0.08)', color: '#ef4444', text: 'No' },
};

const MATRIX_ROWS: Array<{
  cap: string;
  di: CellValue;
  cp: CellValue;
  pa: CellValue;
  mc: CellValue;
  llm: CellValue;
}> = [
  { cap: 'Cognitive Bias Detection', di: 'yes', cp: 'no', pa: 'no', mc: 'partial', llm: 'partial' },
  { cap: 'Noise Measurement (Kahneman)', di: 'yes', cp: 'no', pa: 'no', mc: 'no', llm: 'no' },
  { cap: 'Compound Bias Scoring', di: 'yes', cp: 'no', pa: 'no', mc: 'no', llm: 'no' },
  { cap: 'Toxic Combination Patterns', di: 'yes', cp: 'no', pa: 'no', mc: 'no', llm: 'no' },
  { cap: 'Compliance Frameworks', di: 'yes', cp: 'no', pa: 'partial', mc: 'partial', llm: 'no' },
  { cap: 'Outcome Learning Flywheel', di: 'yes', cp: 'partial', pa: 'no', mc: 'no', llm: 'no' },
  { cap: 'Knowledge Graph', di: 'yes', cp: 'no', pa: 'yes', mc: 'no', llm: 'no' },
  { cap: 'Real-time Integration', di: 'yes', cp: 'partial', pa: 'partial', mc: 'no', llm: 'no' },
  { cap: 'Case Study Library', di: 'yes', cp: 'no', pa: 'no', mc: 'yes', llm: 'no' },
  { cap: 'Time to Insight', di: 'yes', cp: 'partial', pa: 'partial', mc: 'no', llm: 'yes' },
  { cap: 'Cost per Analysis', di: 'yes', cp: 'partial', pa: 'no', mc: 'no', llm: 'yes' },
];

function CellBadge({ value }: { value: CellValue }) {
  const s = CELL_STYLES[value];
  const Icon = value === 'yes' ? CheckCircle : value === 'no' ? XCircle : AlertTriangle;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        background: s.bg,
        color: s.color,
        fontSize: 10,
        fontWeight: 600,
      }}
    >
      <Icon size={10} />
      {s.text}
    </span>
  );
}

function CompetitorMatrix() {
  const cols = ['Decision Intel', 'Cloverpop', 'Palantir', 'McKinsey/BCG', 'ChatGPT/Claude'];
  const colColors = ['#16A34A', '#f59e0b', '#3b82f6', '#8b5cf6', '#94A3B8'];
  return (
    <div style={card}>
      <div style={sectionTitle}>
        <BarChart3 size={18} style={{ color: '#3b82f6' }} />
        Competitor Capability Matrix
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '180px repeat(5, 1fr)',
            gap: 0,
            fontSize: 11,
            minWidth: 700,
          }}
        >
          {/* Header */}
          <div style={{ padding: 8, fontWeight: 700, color: 'var(--text-muted)' }}>Capability</div>
          {cols.map((c, i) => (
            <div
              key={c}
              style={{ padding: 8, fontWeight: 700, color: colColors[i], textAlign: 'center' }}
            >
              {c}
            </div>
          ))}
          {/* Rows */}
          {MATRIX_ROWS.map((row, i) => (
            <React.Fragment key={row.cap}>
              <div
                style={{
                  padding: 8,
                  fontWeight: 600,
                  color: 'var(--text-primary, #fff)',
                  borderTop: '1px solid var(--border-primary, #222)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {row.cap}
              </div>
              {([row.di, row.cp, row.pa, row.mc, row.llm] as CellValue[]).map((val, j) => (
                <div
                  key={j}
                  style={{
                    padding: 8,
                    borderTop: '1px solid var(--border-primary, #222)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CellBadge value={val} />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section 5: Moat Layers ──────────────────────────────────────────────────

const MOAT_ITEMS: Array<{
  name: string;
  strength: string;
  color: string;
  timeline: string;
  desc: string;
  files: string;
  why: string;
}> = [
  {
    name: '12-Node LangGraph Pipeline',
    strength: 'High',
    color: '#f59e0b',
    timeline: 'Day 1',
    desc: 'GDPR anonymization, bias detection, noise judging, adversarial debate, compound scoring — orchestrated as a state machine.',
    files: 'src/lib/agents/graph.ts, nodes.ts, prompts.ts',
    why: 'Replicable in 3-6 months by a strong team, but provides critical time-to-market advantage.',
  },
  {
    name: 'Compound Scoring Engine',
    strength: 'High',
    color: '#f59e0b',
    timeline: 'Day 1',
    desc: 'Post-LLM deterministic layer: 20x20 bias interaction matrix, contextual multipliers (dissent absent = 1.25x, time pressure = 1.15x), biological signal detection (Winner Effect, cortisol stress patterns).',
    files: 'src/lib/scoring/compound-engine.ts',
    why: 'Not an LLM — pure decision science encoded as software. Requires domain expertise competitors lack.',
  },
  {
    name: 'Org-Calibrated Data Flywheel',
    strength: 'Very High',
    color: '#16A34A',
    timeline: 'Month 6+',
    desc: 'Toxic combination detection learns which bias patterns fail at YOUR org. Noise benchmarks calibrate per-team. Each decision makes the system smarter.',
    files: 'src/lib/learning/toxic-combinations.ts, src/lib/scoring/noise-decomposition.ts',
    why: 'Requires 18+ months of customer data. Cannot be replicated by copying code — needs proprietary decision outcomes from private financial markets.',
  },
  {
    name: 'pgvector Knowledge Graph',
    strength: 'Very High',
    color: '#16A34A',
    timeline: 'Month 12+',
    desc: 'Decision graph with PageRank centrality, Union-Find clustering, outcome-weighted edges, and graph-guided RAG re-ranking.',
    files: 'src/lib/graph/graph-builder.ts',
    why: 'After 6 months at 50+ decisions, the graph contains institutional memory no competitor can rebuild even with access to the same codebase.',
  },
  {
    name: 'Compliance Framework Lock-in',
    strength: 'Very High',
    color: '#16A34A',
    timeline: 'Day 1',
    desc: '7 regulatory frameworks (SOX, FCA, EU AI Act, Basel III, GDPR, SEC Reg D, LPOA) with provision-level mapping and audit defense packet generation.',
    files: 'src/lib/compliance/frameworks/',
    why: "Competitors need 7 frameworks' worth of legal review before shipping a single page. Cloverpop, Palantir, and IBM can't catch up here.",
  },
];

function MoatItem({ item }: { item: (typeof MOAT_ITEMS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 8,
        border: '1px solid var(--border-primary, #222)',
        background: 'var(--bg-tertiary, #0a0a0a)',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ color: 'var(--text-muted)' }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #fff)', flex: 1 }}
        >
          {item.name}
        </span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            background: `${item.color}15`,
            color: item.color,
            border: `1px solid ${item.color}30`,
          }}
        >
          {item.strength}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted, #71717a)' }}>{item.timeline}</span>
      </div>
      {open && (
        <div style={{ marginTop: 10, marginLeft: 22 }}>
          <p style={{ ...bodyText, margin: '0 0 6px 0' }}>{item.desc}</p>
          <div style={{ marginBottom: 4 }}>
            <span style={codeBadge}>{item.files}</span>
          </div>
          <p style={{ fontSize: 12, color: '#16A34A', fontStyle: 'italic', margin: 0 }}>
            {item.why}
          </p>
        </div>
      )}
    </div>
  );
}

function MoatLayers() {
  return (
    <div style={{ ...card, borderLeft: '3px solid #16A34A' }}>
      <div style={sectionTitle}>
        <Lock size={18} style={{ color: '#16A34A' }} />
        Your Actual Moat — 5 Layers Deep
      </div>
      <p style={{ ...bodyText, marginBottom: 16 }}>
        Each layer is verified in your codebase. Click to expand with file references.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MOAT_ITEMS.map(item => (
          <MoatItem key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─── Section 6: Common Objections ────────────────────────────────────────────

const OBJECTIONS: Array<{ objection: string; response: string }> = [
  {
    objection: 'Solo founder risk',
    response:
      '199K+ lines of production TypeScript, 586+ automated tests, standard Next.js/Postgres/LangGraph stack. The codebase IS the company — not tribal knowledge. Any senior full-stack engineer can onboard in weeks. First hire is already scoped. Advised by a senior consultant who helped take Wiz from startup to $32B.',
  },
  {
    objection: 'Market timing — is decision intelligence a real category?',
    response:
      "Cloverpop's Inc. 5000 #608 ranking with ~300% three-year growth proves enterprise demand exists. Decision intelligence market sized at $12.2B growing to $46.4B by 2030. EU AI Act and FCA Consumer Duty create regulatory tailwinds that make bias detection compliance-mandatory.",
  },
  {
    objection: 'Why not just use ChatGPT?',
    response:
      'One opinion from one model. No noise measurement (how much do judges disagree?), no deterministic compound scoring, no outcome tracking, no org-specific calibration, no compliance mapping, no toxic combination detection. A ChatGPT prompt has no memory and no way to measure its own noise.',
  },
  {
    objection: 'Behavior change is hard — enterprises resist new tools',
    response:
      'Zero behavior change required. Upload a document you already wrote — M&A memo, board paper, strategy doc. 60 seconds later, get a score. Slack integration detects decisions in real-time without disrupting flow. Chrome extension works inside existing tools. We are an audit layer, not a replacement process.',
  },
  {
    objection: "How do you compete with McKinsey's decision advisory?",
    response:
      "We don't replace consulting — we make their most expensive service 1,000x cheaper and always-on. McKinsey charges $500K-$2M per strategic review, takes 6-12 weeks, and their consultants carry their own cognitive biases into the analysis. We deliver the same core service — decision quality assessment — in 60 seconds, continuously, for $2,499/month. And unlike McKinsey, we get smarter with every deal your team runs.",
  },
  {
    objection: 'AI is commoditizing — LLMs are a race to the bottom',
    response:
      'The LLM layer IS commodity — by design. We swap Gemini, Claude, and GPT freely. Our 5 proprietary layers ABOVE the LLM are the moat: compound scoring engine, toxic combination detection, noise decomposition, knowledge graph, and compliance frameworks. A competitor can copy our prompts. They cannot copy 18 months of org-specific outcome data or 7 regulatory frameworks worth of legal review.',
  },
  {
    objection: "What's your unfair advantage as a founder?",
    response:
      'Deep domain expertise at the intersection of cognitive science and financial decision-making — a rare combination. A proprietary failure database (146 cases with computed correlations) that cannot be scraped or reproduced. A compliance framework stack that took months of legal mapping. And the hunger of a solo founder who has built a $0 to production-grade enterprise SaaS platform alone.',
  },
];

function CommonObjections() {
  return (
    <div style={{ ...card, borderLeft: '3px solid #3b82f6' }}>
      <div style={sectionTitle}>
        <Shield size={18} style={{ color: '#3b82f6' }} />
        Common Objections — Quick Reference
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {OBJECTIONS.map((obj, i) => (
          <div
            key={i}
            style={{
              padding: 14,
              borderRadius: 10,
              background: 'var(--bg-tertiary, #0a0a0a)',
              borderLeft: '3px solid #3b82f6',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>
              &ldquo;{obj.objection}&rdquo;
            </div>
            <div style={{ ...bodyText, margin: 0 }}>{obj.response}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
