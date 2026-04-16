'use client';

import { useState } from 'react';
import { BarChart3, Zap, AlertTriangle, Brain, Network, HelpCircle } from 'lucide-react';
import { card, sectionTitle, badge, tableRow } from '@/components/founder-hub/shared-styles';

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
    why: "Under time pressure, the brain shortcuts to easily recalled information (what's vivid, not what's representative). Overconfidence makes the team feel certain about a decision they haven't properly stress-tested.",
    score: 75,
    research:
      'Tversky & Kahneman (1973) — Availability; Lichtenstein et al. (1982) — Overconfidence',
  },
  {
    label: 'Yes Committee',
    biases: ['Groupthink', 'Authority Bias'],
    trigger: 'Unanimous consensus reached',
    why: "The most senior person speaks first and sets the anchor. Authority bias makes juniors defer. Unanimity is mistaken for quality — but Strebulaev's Stanford research shows consensus-seeking ICs have LOWER IPO rates.",
    score: 82,
    research:
      'Milgram (1963) — Authority Obedience; Strebulaev (Stanford GSB, 2024) — VC consensus',
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
    why: "Last quarter's results dominate the discussion. The most recent data point is the most emotionally salient, drowning out 5-year trends. Under time pressure, there's no space to pull up the long view.",
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
    biases: ["Gambler's Fallacy", 'Overconfidence Bias', 'Sunk Cost Fallacy'],
    trigger: 'High monetary stakes (>$100K)',
    why: "Three biases create an escalation spiral: the belief that losses must reverse (gambler's), confidence that this time will be different (overconfidence), and inability to walk away from prior investment (sunk cost). This is how $10M write-offs become $100M write-offs.",
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

function ToxicPatternBadge({ pattern }: { pattern: (typeof TOXIC_PATTERN_DATA)[number] }) {
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
            <span
              style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8, fontSize: 11 }}
            >
              Base score: {pattern.score}/100
            </span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Biases:{' '}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>{pattern.biases.join(' + ')}</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Trigger:{' '}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>{pattern.trigger}</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Why it&apos;s dangerous:{' '}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>{pattern.why}</span>
          </div>
          <div
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6, marginTop: 4 }}
          >
            <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: 10 }}>
              {pattern.research}
            </span>
          </div>
        </div>
      )}
    </span>
  );
}

// ─── Tab Content: Scoring Engine ────────────────────────────────────────────

export function ScoringEngineTab() {
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
            <li>
              10 named patterns (Echo Chamber, Sunk Ship, Blind Sprint, Yes Committee, Optimism
              Trap, Status Quo Lock, Recency Spiral, Golden Child, Doubling Down, Deadline Panic)
            </li>
            <li>
              Context amplifiers: monetary stakes (2x), absent dissent (1.3x), time pressure
              (1.25x), unanimous consensus (1.2x)
            </li>
            <li>Org-calibrated: thresholds adjust from your outcome data via CausalEdge weights</li>
            <li>
              Historical failure &amp; success rates from 135-case database with false-positive
              damping
            </li>
            <li>
              <strong>NEW: Mitigation Playbooks</strong> — auto-generated, research-backed debiasing
              steps per pattern
            </li>
            <li>
              <strong>NEW: Dollar Impact</strong> — estimated financial risk from deal ticket size ×
              failure rate
            </li>
            <li>
              <strong>NEW: Trend Sparklines</strong> — per-org toxic score trajectory over time
            </li>
            <li>
              <strong>NEW: Org Benchmarks</strong> — compare your patterns to anonymized global
              averages
            </li>
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
              title: '135 Case Studies',
              desc: '120 failures + 15 successes across 11 industries, with pre-decision evidence',
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
