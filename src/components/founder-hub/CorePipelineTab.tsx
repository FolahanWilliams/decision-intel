'use client';

import { Fragment } from 'react';
import { Zap, Brain, Target, CheckCircle, FileText, Users, Cpu } from 'lucide-react';
import { card, sectionTitle, label, badge } from '@/components/founder-hub/shared-styles';

type ModelTier = 'cheap' | 'main' | 'pro' | 'none';

const TIER_META: Record<ModelTier, { color: string; label: string; model: string }> = {
  cheap: { color: '#22c55e', label: 'Cheap', model: 'gemini-3.1-flash-lite' },
  main: { color: '#3b82f6', label: 'Main', model: 'gemini-3-flash-preview' },
  pro: { color: '#8b5cf6', label: 'Pro', model: 'gemini-2.5-pro' },
  none: { color: '#71717a', label: 'No LLM', model: 'deterministic math' },
};

const NODE_ROUTING: Array<{ node: string; tier: ModelTier; why: string }> = [
  { node: 'gdprAnonymizer', tier: 'cheap', why: 'Mechanical PII redaction; pattern-matching task' },
  { node: 'structurer', tier: 'cheap', why: 'Sectioning + speaker turns; no judgment required' },
  { node: 'intelligenceGatherer', tier: 'cheap', why: 'Topic + industry extraction; short output' },
  { node: 'biasDetective', tier: 'main', why: '20-bias taxonomy; needs reasoning + grounded search' },
  { node: 'noiseJudge', tier: 'main', why: 'Multi-instance jury for variance measurement' },
  { node: 'verificationNode', tier: 'main', why: 'Fact-check via search + compliance mapping' },
  { node: 'deepAnalysisNode', tier: 'main', why: 'Sentiment + logic + SWOT + cognitive diversity' },
  { node: 'simulationNode', tier: 'main', why: 'Boardroom twin simulation; creative reasoning' },
  { node: 'rpdRecognitionNode', tier: 'main', why: 'Klein RPD pattern matching against history' },
  { node: 'forgottenQuestionsNode', tier: 'main', why: 'Unknown-unknowns surfacing; creative' },
  { node: 'metaJudgeNode', tier: 'pro', why: 'Final verdict over 7 parallel signals — highest leverage' },
  { node: 'riskScorer', tier: 'none', why: 'Compound scoring + Bayesian + report assembly (pure math)' },
];

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

      {/* Model Routing & Cost Tiers */}
      <div style={card}>
        <div style={sectionTitle}>
          <Cpu size={18} style={{ color: '#16A34A' }} /> Model Routing & Cost Tiers
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Each pipeline node is routed to the cheapest Gemini model that still meets the task&apos;s
          reasoning bar. Cheap-tier nodes cost ~half the main tier; Pro is reserved for the final
          verdict call. Override any tier via <code>GEMINI_MODEL_CHEAP</code>,{' '}
          <code>GEMINI_MODEL_NAME</code>, or <code>GEMINI_MODEL_PRO</code> env vars.
        </p>

        {/* Tier legend */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginBottom: 16,
          }}
        >
          {(['cheap', 'main', 'pro', 'none'] as ModelTier[]).map(t => {
            const meta = TIER_META[t];
            return (
              <div
                key={t}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  background: 'var(--bg-tertiary, #0a0a0a)',
                  borderLeft: `3px solid ${meta.color}`,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: meta.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {meta.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    marginTop: 2,
                  }}
                >
                  {meta.model}
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-node routing table */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.6fr 2.2fr',
            gap: 8,
            fontSize: 12,
          }}
        >
          <div style={{ ...label, marginBottom: 0 }}>Node</div>
          <div style={{ ...label, marginBottom: 0 }}>Tier</div>
          <div style={{ ...label, marginBottom: 0 }}>Why</div>
          {NODE_ROUTING.map(({ node, tier, why }) => {
            const meta = TIER_META[tier];
            return (
              <Fragment key={node}>
                <div
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    fontSize: 12,
                  }}
                >
                  {node}
                </div>
                <div>
                  <span style={badge(meta.color)}>{meta.label}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{why}</div>
              </Fragment>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 10,
            borderRadius: 8,
            background: 'rgba(22,163,74,0.08)',
            border: '1px solid rgba(22,163,74,0.25)',
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: '#16A34A' }}>Per-audit economics:</strong> 3 of 12 nodes on cheap
          tier (~15–25% cost reduction vs all-main). 1 node on Pro (metaJudge — the single
          highest-leverage call). riskScorer runs pure deterministic math with no LLM cost.
        </div>
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

          {/* TODO: Cross-model jury upgrade (activate when first customer lands) */}
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 8,
              background: 'rgba(234,179,8,0.08)',
              border: '1px solid rgba(234,179,8,0.3)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#EAB308',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: 10,
                marginBottom: 4,
              }}
            >
              TODO · upgrade before first customer
            </div>
            Current jury runs 3× same model at temp 0.3 — captures stochastic variance only, not
            Kahneman-style judgment disagreement. Upgrade to cross-model jury by setting{' '}
            <code style={{ fontSize: 10 }}>NOISE_JURY_MODELS</code> env var.
            <br />
            <strong style={{ color: '#16A34A' }}>Cheapest (lower cost than today):</strong>{' '}
            <code style={{ fontSize: 10 }}>gemini-3-flash-preview,gemini-3.1-flash-lite</code>
            <br />
            <strong style={{ color: '#8b5cf6' }}>Full cross-model (adds Pro juror):</strong>{' '}
            <code style={{ fontSize: 10 }}>
              gemini-3-flash-preview,gemini-2.5-pro,gemini-3.1-flash-lite
            </code>
          </div>
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
