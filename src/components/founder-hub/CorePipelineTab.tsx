'use client';

import { Zap, Brain, Target, CheckCircle, FileText, Users } from 'lucide-react';
import { card, sectionTitle, label, badge } from '@/components/founder-hub/shared-styles';

export function CorePipelineTab() {
  return (
    <div>
      {/* Pipeline Diagram */}
      <div style={card}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#f59e0b' }} /> Decision Knowledge Graph · Analysis Engine
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

ANALYSIS (Parallel Fan-Out — 7 nodes)
  ├── [Bias Detective]         ── 20 cognitive biases + 11 investment-specific
  ├── [Noise Judge]            ── Statistical noise & variance scoring
  ├── [Verification]           ── Fact checking + compliance mapping
  ├── [Deep Analysis]          ── Linguistic, strategic & cognitive diversity
  ├── [Simulation]             ── Decision twin simulation + memory recall
  ├── [RPD Recognition]        ── Klein pattern matching + expert heuristics
  └── [Forgotten Questions]    ── Unknown-unknowns surface detection

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
                '12 nodes in LangGraph DAG — preprocessing (sequential) → analysis (7-way parallel fan-out) → synthesis (sequential)',
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
