'use client';

import { useState, useCallback } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Crosshair,
  MessageSquare,
  Rocket,
  Target,
  Zap,
} from 'lucide-react';
import { card, sectionTitle, label, badge, tableRow } from './shared-styles';

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
    'all' | 'vc' | 'foundations' | 'category' | 'gtm' | 'strategy' | 'moat'
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
    setExpandedResearch(new Set(['vc', 'foundations', 'category', 'gtm', 'strategy', 'moat']));
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
    { id: 'moat' as const, label: 'Moat Theory' },
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
                      'BUILD THIS: Quick Scan mode — a fast, lightweight bias check (30 seconds) that flags top 2-3 red flags before committing to the full 12-node pipeline (4 minutes). Mirrors how VCs actually work. Reduces adoption friction dramatically.',
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
                startup="The best 12-node pipeline means nothing if you can't get it in front of decision-makers. Distribution strategy matters as much as the product. Conferences, Slack communities, thought leadership content, and referral loops from pilot customers are your channels."
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

      {/* ── Moat Theory ── */}
      {(section === 'all' || section === 'moat') && (
        <>
          <div
            style={{ ...card, borderLeft: '3px solid #06b6d4', marginTop: 16, cursor: 'pointer' }}
            onClick={() => toggleResearchSection('moat')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#06b6d4' }}>Moat Theory</div>
              <ChevronDown
                size={16}
                style={{
                  color: '#06b6d4',
                  transform: expandedResearch.has('moat') ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </div>
          </div>
          {expandedResearch.has('moat') && (
            <div style={{ ...card, borderLeft: '3px solid #06b6d4', marginTop: -8 }}>
              <ResearchCard
                title="Ben Thompson: Aggregation Theory and the Behavioural-Data Moat"
                source="Stratechery"
                type="Long-form Essay Series"
                color="#06b6d4"
                link="https://stratechery.com/aggregation-theory/"
                insight='In commodity-LLM markets the model is not the moat; the calibrated outcome data is. Aggregation Theory says value accrues to whoever owns the demand-side user relationship plus the feedback loop that feeds it. For Decision Intel, every LLM vendor is a substitutable supplier below the behavioural dataset. The 18-month corpus of org-calibrated CausalEdge weights, nudge acceptance rates, outcome-gate resolutions, and calibration scores is the supplier-modularization layer. A competitor with a better Gemini prompt has no path to replicate that loop under 18 months of real customer behaviour. This is why "we use 3 judges and a 20x20 matrix" is a feature story, and "we own the decision outcomes" is the moat story.'
                product="Every product surface must write back to the dataset: Outcome Gate, nudge acceptance, calibration deltas, toxic pattern false-positive rates, org-specific CausalEdge weights. Anything that just calls Gemini without feeding the loop is a commodity feature. Aggregation Theory is why the Copilot AI Assistant must persist CopilotTurns and why the Calibration dashboard must survive as a first-class product, not a nice-to-have."
                startup='Investor pitch reframe: "The model is replaceable. The behavioural dataset is not. We are the aggregator between decision-makers and calibrated outcomes." Map DI to aggregation theory explicitly in the deck: demand side (IC members), internalized distribution (Slack, Drive, Email connectors), modularized supply (any LLM). Every commodity LLM release makes our moat deeper, not shallower.'
                actions={[
                  'Add an "Aggregation Theory" slide to the investor deck mapping DI onto the three layers',
                  'Audit every product surface for write-back to the behavioural dataset; flag surfaces that only read',
                  'In founder essays, lead with "the model is replaceable, the data is not"',
                  'Cross-link to the Methodologies and Principles tab entry for Aggregation Theory',
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

export { PlaybookAndResearch as PlaybookAndResearchTab };
