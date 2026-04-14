'use client';

import {
  Shield,
  Target,
  CheckCircle,
  ChevronRight,
  Rocket,
  Brain,
  TrendingUp,
  Zap,
  BarChart3,
} from 'lucide-react';
import { card, sectionTitle, label, badge, tableRow } from './shared-styles';
import {
  ToxicCombinationMoatNarrative,
  LangGraphPipelineNarrative,
  PromptEngineeringMoatNarrative,
  ComplianceFrameworkMoatNarrative,
  DecisionGraphMoatNarrative,
  OutcomeFlywheelNarrative,
  DrRedTeamNarrative,
  FounderPitchScript,
} from './SalesToolkitTab';

export function StrategyAndPositioningTab() {
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
            '12-Node LangGraph Pipeline',
            'High',
            'GDPR gate, fan-out/fan-in, per-node safety tiers, meta-judge debate, retry+backoff — architecture alone takes weeks to replicate',
          ],
          [
            'Prompt Engineering Corpus',
            'Very High',
            '46K+ LoC of prompts across 11 nodes; 18 months of tuning against real strategy and M&A memos — the corpus is the moat, not the architecture',
          ],
          [
            'Decision Knowledge Graph',
            'High',
            'Multi-type entity resolution + graph-guided RAG (60% semantic / 30% graph distance / 10% outcome boost) + learned edge weights',
          ],
          [
            'Passive Outcome Inference (3-channel)',
            'Very High',
            'Document RAG + Slack pattern-match + web cron with Gemini grounding. Draft-outcomes model = collaborator, not nag. 18-month lead.',
          ],
          [
            'Compliance Framework Mapping',
            'High',
            '7 frameworks (SOX, FCA, EU AI Act, Basel III, GDPR, SEC Reg D, LPOA) → Audit Defense Packet with regulatory subsection citations',
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

      {/* ── Extended Moat Narratives (5 pillars) ── */}
      <LangGraphPipelineNarrative />
      <PromptEngineeringMoatNarrative />
      <ComplianceFrameworkMoatNarrative />
      <DecisionGraphMoatNarrative />
      <OutcomeFlywheelNarrative />
      <DrRedTeamNarrative />

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
              <li>12-node pipeline with deterministic compound scoring on top</li>
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
                '"Blueflame reads the documents faster. We read the decision-maker\'s blind spots. Our 12-node pipeline detects 20 biases they can\'t see."',
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
          buyer is accessible. Corporate strategy and M&amp;A teams are the primary vertical with
          quantifiable ROI and defined budgets.
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
              'Secondary vertical',
              'MP / Head of IC',
              'EXPANSION',
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

      {/* Why Corporate Strategy / M&A Wins */}
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
              desc: 'Strategy teams, M&A groups, and risk committees have decision authority and defined budgets. A VP of Strategy or Head of M&A can greenlight a pilot without board approval. Faster sales cycle than PE/VC firms.',
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
                'Secondary expansion vertical with strong product-market fit. Product includes 11 investment-specific biases, deal memo analysis, IRR/MOIC outcome tracking. Tight-knit community drives word-of-mouth. Note: relationship-driven buying and skepticism of new tools makes this harder as a primary wedge.',
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
            <li>Free (4 analyses) → Professional: $149/mo → Strategy: $2,499/mo</li>
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
            <li>Corporate M&amp;A advisory market: $40B+ annually</li>
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
                'Corporate strategy, M&A, risk assessment, vendor evaluation. Board memos, strategy papers, project pipeline. Corporate M&A as primary vertical.',
            },
            {
              year: 'Year 2',
              market: 'Financial Services Vertical',
              color: '#3b82f6',
              status: 'NEXT',
              details:
                'PE/VC investment committees, hedge funds, credit committees. Investment-specific biases and IRR/MOIC tracking as differentiators.',
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
