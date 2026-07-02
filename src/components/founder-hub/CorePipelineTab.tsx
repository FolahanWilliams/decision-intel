'use client';

import { Fragment } from 'react';
import { Zap, Brain, Target, CheckCircle, FileText, Users, Cpu } from 'lucide-react';
import { card, sectionTitle, label, badge } from '@/components/founder-hub/shared-styles';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { MATRIX_DIMENSION } from '@/lib/ontology/interaction-matrix';

// Canonical taxonomy count — derives from BIAS_EDUCATION so DI-B-023+ updates
// automatically (CLAUDE.md "Bias Taxonomy" cascade discipline). BIAS_EDUCATION
// is a Record<BiasCategory, ...>, NOT an array — use Object.keys().length per
// the canonical pattern in onepager / how-it-works / bias-genome / pricing.
const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;
// Matrix dimension — derives from interaction-matrix so M-1/DI-B-023+
// extensions lift this surface automatically (founder-USED rehearsal tab).
const MATRIX_LABEL = `${MATRIX_DIMENSION}×${MATRIX_DIMENSION}`;

type ModelTier = 'cheap' | 'main' | 'frontier' | 'none';

// Locked 2026-07-02 (CLAUDE.md "Frontier model-tier upgrade"): the reasoning
// nodes run on frontier models (Opus 4.8 / Sonnet 5 via the Vercel AI Gateway);
// grounded + preprocessing nodes run on Gemini via the gateway. A previous
// legend listed a retired "pro" tier that no longer existed in this map, which
// crashed the render (TIER_META['pro'] was undefined) — replaced by 'frontier'.
const TIER_META: Record<ModelTier, { color: string; label: string; model: string }> = {
  cheap: { color: '#22c55e', label: 'Cheap', model: 'gemini-3.1-flash-lite (gateway)' },
  main: { color: '#3b82f6', label: 'Grounded', model: 'gemini-3-flash (gateway)' },
  frontier: { color: '#a855f7', label: 'Frontier', model: 'Opus 4.8 / Sonnet 5' },
  none: { color: '#71717a', label: 'No LLM', model: 'deterministic math' },
};

const NODE_ROUTING: Array<{ node: string; tier: ModelTier; why: string }> = [
  { node: 'gdprAnonymizer', tier: 'cheap', why: 'Mechanical PII redaction; pattern-matching task' },
  { node: 'structurer', tier: 'cheap', why: 'Sectioning + speaker turns; no judgment required' },
  { node: 'intelligenceGatherer', tier: 'cheap', why: 'Topic + industry extraction; short output' },
  {
    node: 'biasDetective',
    tier: 'main',
    why: `${BIAS_COUNT}-bias taxonomy; needs grounded Google-Search fact-checking, so it stays on Gemini`,
  },
  {
    node: 'noiseJudge',
    tier: 'main',
    why: 'Cross-family jury: Gemini (analyst) + Opus 4.8 (regulator) + Sonnet 5 (contrarian)',
  },
  {
    node: 'verificationNode',
    tier: 'main',
    why: 'Fact-check via grounded search + compliance mapping',
  },
  {
    node: 'deepAnalysisNode',
    tier: 'frontier',
    why: 'Sentiment + logic + SWOT + cognitive diversity — Sonnet 5',
  },
  {
    node: 'simulationNode',
    tier: 'frontier',
    why: 'Boardroom twin simulation; creative reasoning — Sonnet 5',
  },
  {
    node: 'rpdRecognitionNode',
    tier: 'frontier',
    why: 'Klein RPD pattern matching against history — Sonnet 5',
  },
  {
    node: 'forgottenQuestionsNode',
    tier: 'frontier',
    why: 'Unknown-unknowns surfacing (the Fermi killers) — Opus 4.8',
  },
  {
    node: 'metaJudgeNode',
    tier: 'frontier',
    why: 'Final verdict over parallel signals — highest single-call leverage, runs on Opus 4.8',
  },
  {
    node: 'riskScorer',
    tier: 'none',
    why: 'Compound scoring + Bayesian + report assembly (pure math)',
  },
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
  ├── [Bias Detective]         ── ${BIAS_COUNT} cognitive biases + 11 investment-specific
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
          Each node routes to the model that fits the task. Preprocessing and grounded fact-checking
          nodes run on Gemini via the Vercel AI Gateway, where live Google-Search grounding matters;
          the reasoning nodes — deep analysis, boardroom simulation, forgotten questions, and the
          meta-judge verdict — run on frontier models (Sonnet 5, and Opus 4.8 for the
          highest-leverage calls). Override any node via the <code>PIPELINE_MODEL_*</code> env vars,
          or roll the whole pipeline back to Gemini with <code>PIPELINE_FRONTIER_MODELS=off</code>.
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
          {(['cheap', 'main', 'frontier', 'none'] as ModelTier[]).map(t => {
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

          {/* Cross-model jury — locked 2026-05-06. The card below
             previously carried a "TODO upgrade before first customer"
             warning; the upgrade shipped and the card now describes
             the live architecture. Two model families across three
             frames + the random-seed stochastic axis = three
             orthogonal sources of variance the founder-hub reader can
             cite verbatim in investor conversations. */}
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 8,
              background: 'rgba(22,163,74,0.08)',
              border: '1px solid rgba(22,163,74,0.3)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#16A34A',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: 10,
                marginBottom: 4,
              }}
            >
              Live · cross-model jury
            </div>
            Three frames × two model families. Each frame applies the same 0-100 rubric through a
            DIFFERENT professional lens (analyst-skeptical / regulator-hostile /
            contrarian-strategist) AND a different model architecture (Gemini 3 Flash · Grok 4.3 ·
            Gemini 3 Flash). Stochastic variance comes from a per-call random seed, architectural
            variance from the Gemini ↔ Grok split, framing variance from the lens swap.
            <br />
            <strong style={{ color: '#16A34A' }}>Default jury (locked 2026-05-06):</strong>{' '}
            <code style={{ fontSize: 10 }}>
              gemini-3-flash-preview,xai/grok-4.3,gemini-3-flash-preview
            </code>
            <br />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Override via the <code>NOISE_JURY_MODELS</code> env var. The Gemini and Grok arms run
              through separate circuit breakers (`gemini` vs `gateway`) so a single-provider outage
              degrades to single-architecture diversity instead of failing the whole jury.
            </span>
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
              value: `Deterministic compound scoring POST-LLM — ${MATRIX_LABEL} bias interaction matrix, context multipliers, biological signal detection`,
            },
            {
              label: 'Noise Measurement',
              value:
                'Ensemble sampling: 3 independent Gemini instances score same document → mean, stddev, variance decomposition (the moat is the 143-case reference library + R²F arbitration, not the prompts)',
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
