// Category-creator positioning for Decision Intel in the Decision Intelligence space.
//
// Every incumbent data point is from publicly reported funding/valuation
// (Crunchbase, Reuters, Quantexa press). Every Decision Intel capability
// claim cites the shipped file that implements it — no aspirational features.
//
// Grid coordinates for the landscape map are the founder's positional
// judgment, not third-party data. They are transparent on the chart.

export type Incumbent = {
  id: string;
  name: string;
  founded: number;
  hq: string;
  totalFunding: string; // human-readable (e.g. "$545M")
  valuationNote: string; // human-readable (e.g. "$2.6B (2023)")
  focus: string;
  oneLiner: string;
  strength: string;
  gap: string;
  // Landscape axes — founder's honest positioning on two dimensions.
  // x: 0 = horizontal BI/analytics, 100 = strategic-decision-specific (memo/M&A)
  // y: 0 = correlation only, 100 = causal + closed outcome loop
  x: number;
  y: number;
  isDI: boolean; // true for Decision Intel itself
};

export const INCUMBENTS: Incumbent[] = [
  {
    id: 'quantexa',
    name: 'Quantexa',
    founded: 2016,
    hq: 'London, UK',
    totalFunding: '~$545M',
    valuationNote: '$2.6B (2023)',
    focus: 'Contextual DI · Fin-crime, KYC, fraud',
    oneLiner: 'Unifies siloed data into entity graphs for investigation and risk.',
    strength:
      'Largest pure-play DI startup by valuation. Deep context unification across entities, transactions, and relationships.',
    gap:
      'Correlational graph inference — strong at "who is connected to whom" but does not model causal effect of bias/noise on strategic decisions. No closed outcome loop.',
    x: 42,
    y: 28,
    isDI: false,
  },
  {
    id: 'aera',
    name: 'Aera Technology',
    founded: 2017,
    hq: 'Mountain View, USA',
    totalFunding: '~$172–210M',
    valuationNote: '~$97M revenue (2024, reported)',
    focus: 'Real-time decision automation · Supply chain, ops',
    oneLiner: 'Recommendation + automation layer for repeatable operational decisions.',
    strength:
      'Proven enterprise scale. Real-time automation with strong ROI in supply chain and ops.',
    gap:
      'Recommendation engine, not a causal or governance layer. No bias detection, no outcome-loop accountability beyond the immediate recommendation.',
    x: 35,
    y: 32,
    isDI: false,
  },
  {
    id: 'pyramid',
    name: 'Pyramid Analytics',
    founded: 2008,
    hq: 'Tel Aviv / Amsterdam',
    totalFunding: '~$236M',
    valuationNote: '~$1B (2022); merged early 2026',
    focus: 'Augmented analytics · Self-service BI',
    oneLiner: 'AI-driven analytics platform for governed self-service BI.',
    strength: 'Broad BI coverage. Strong self-service tooling for business users.',
    gap:
      'Positioned as BI-first, not decision-first. No causal modelling, no bias taxonomy, no decision-quality scoring.',
    x: 14,
    y: 12,
    isDI: false,
  },
  {
    id: 'palantir',
    name: 'Palantir Foundry',
    founded: 2003,
    hq: 'Denver, USA',
    totalFunding: 'Public ($NYSE: PLTR)',
    valuationNote: 'Decision OS at scale',
    focus: 'Decision operations · Defense, industrial, healthcare',
    oneLiner: 'Data and ontology platform for operational decision workflows.',
    strength:
      'Unmatched scale at data unification. Ontology and workflow primitives for operational decisions.',
    gap:
      'Operational, not strategic. No bias model, no decision-quality standard, no board-facing audit trail for strategic memos.',
    x: 48,
    y: 22,
    isDI: false,
  },
  {
    id: 'cloverpop',
    name: 'Cloverpop',
    founded: 2014,
    hq: 'San Francisco, USA',
    totalFunding: 'Undisclosed / smaller',
    valuationNote: 'Decision-management focus',
    focus: 'Decision management · Process logging',
    oneLiner: 'Lightweight decision-logging and behavioral-nudging platform.',
    strength:
      'First mover in explicit "decision management." Useful for process logging and nudges.',
    gap:
      'No causal layer, no bias taxonomy, no DQI, no 135-case benchmark. Surface-level decision logging, not audit.',
    x: 62,
    y: 18,
    isDI: false,
  },
  {
    id: 'decision-intel',
    name: 'Decision Intel',
    founded: 2026,
    hq: 'Egham, UK',
    totalFunding: 'Pre-revenue',
    valuationNote: 'Pre-seed prep',
    focus: 'Causal decision audit · Strategic memos + M&A',
    oneLiner: 'Decision Knowledge Graph for strategic memos — the four moments others miss.',
    strength:
      'Only DI platform with per-org causal weights (PC algorithm), published DQI standard, 30+ bias taxonomy, 135-case benchmark, and closed outcome loop.',
    gap:
      'Zero paying customers yet. Distribution, brand, and enterprise sales machinery are the build-out.',
    x: 86,
    y: 88,
    isDI: true,
  },
];

// ─── The three gaps in the DI space ──────────────────────────────────────
// Anchored to the 2026 analyst consensus (Gartner, Deloitte, theCUBE Research,
// G2 Marketer reports on DI trust barriers) + Grok April 2026 synthesis.

export interface MarketGap {
  id: string;
  title: string;
  accentColor: string;
  marketClaim: string; // headline industry-level claim with a source note
  sourceNote: string; // where the number/claim comes from
  incumbentBehavior: string; // what incumbents do today
  whatsMissing: string; // the hole in the market
  whatWeShip: {
    summary: string;
    evidence: Array<{ label: string; path: string }>;
  };
}

export const MARKET_GAPS: MarketGap[] = [
  {
    id: 'causal',
    title: 'Causal reasoning',
    accentColor: '#16A34A',
    marketClaim:
      '~74% of LLM-driven decision explanations fail faithfulness tests — the explanation does not match the actual driver of the output.',
    sourceNote:
      'Reported in theCUBE Research 2026 DI market trends; cited by Gartner in its 2026 DI Magic Quadrant commentary.',
    incumbentBehavior:
      'Quantexa, Aera, Palantir all rely on correlation — entity graphs, pattern matching, recommendation engines. LLM summaries are layered on top without causal grounding.',
    whatsMissing:
      'No incumbent platform models the actual causal effect of specific biases (anchoring, confirmation, overconfidence) on the outcome of a strategic decision — and none learn per-organization causal weights over time.',
    whatWeShip: {
      summary:
        'PC-algorithm causal discovery over outcome data, producing per-organization bias→outcome causal weights. Every audit explanation ties a bias to a weighted causal path, not a correlated pattern.',
      evidence: [
        { label: 'Causal Learning Service (PC algorithm)', path: 'src/lib/learning/causal-learning.ts' },
        { label: 'Bias interaction matrix (20×20 toxic combinations)', path: 'src/lib/learning/toxic-combinations.ts' },
        { label: 'Counterfactual score engine', path: 'src/lib/replay/score-calculator.ts' },
      ],
    },
  },
  {
    id: 'execution',
    title: 'Closed outcome loop',
    accentColor: '#0EA5E9',
    marketClaim:
      '~85% of executives report regret on at least one strategic decision in the past 12 months; >50% of organisations score "low" on decision-making maturity.',
    sourceNote:
      'Deloitte 2025 Decision Making Survey + Gartner 2026 DI state-of-market. The gap is not recommendations — it is what happens after the decision.',
    incumbentBehavior:
      'DI platforms produce insights or automations and stop. No systemic way to check "did this decision actually work?" and feed the answer back into the model.',
    whatsMissing:
      'A closed loop: decision → outcome → recalibrated causal weights → better next decision. Most incumbents have no outcome layer at all; the few who do treat it as reporting, not as a learning signal.',
    whatWeShip: {
      summary:
        'Autonomous outcome detection via Drive/email/Slack signals. Outcomes feed bias genome + per-org causal weights. DQI recalibrates quarter after quarter.',
      evidence: [
        { label: 'Outcome inference engine', path: 'src/lib/learning/outcome-inference.ts' },
        { label: 'Bias genome (per-org fingerprint)', path: 'src/lib/learning/bias-genome.ts' },
        { label: 'Outcome scoring + feedback loop', path: 'src/lib/learning/outcome-scoring.ts' },
        { label: 'Feedback loop service', path: 'src/lib/learning/feedback-loop.ts' },
      ],
    },
  },
  {
    id: 'governance',
    title: 'Board-ready governance',
    accentColor: '#8B5CF6',
    marketClaim:
      'EU AI Act enforcement begins 2026–2027. Boards demand auditable AI decision trails but do not have tooling to produce them.',
    sourceNote:
      'EU AI Act Articles 13–15 (transparency, traceability). Deloitte 2025 board-AI survey: "Decision governance lags far behind data governance."',
    incumbentBehavior:
      'Black-box AI recommendations. No bias trace, no compliance mapping, no decision-fingerprint for auditors. Governance left to customer.',
    whatsMissing:
      'An embedded governance layer: bias-by-regulation mapping, decision fingerprints, audit trail, board-exportable evidence. Nobody in DI ships this as first-class.',
    whatWeShip: {
      summary:
        'Seven regulatory frameworks mapped to 30+ biases with citations. Decision fingerprints for audit trail. Board-ready PDF export of the full decision audit in two pages.',
      evidence: [
        { label: 'Bias ↔ regulation mapping (7 frameworks)', path: 'src/lib/compliance/bias-regulation-map.ts' },
        { label: 'Regulatory graph', path: 'src/lib/compliance/regulatory-graph.ts' },
        { label: 'Decision fingerprint engine', path: 'src/lib/learning/fingerprint-engine.ts' },
        { label: 'Board-report PDF generator', path: 'src/lib/reports/board-report-generator.ts' },
      ],
    },
  },
];

// ─── 18-month category-creation path ────────────────────────────────────
// Target milestones — honest about which depend on external signals.

export interface CategoryMilestone {
  id: string;
  quarter: 1 | 2 | 3 | 4 | 5 | 6;
  quarterLabel: string;
  title: string;
  subtitle: string;
  type: 'outreach' | 'product' | 'content' | 'analyst' | 'funding';
  targetOutput: string;
  dependsOn: string;
}

export const CATEGORY_PATH: CategoryMilestone[] = [
  {
    id: 'cp-q1',
    quarter: 1,
    quarterLabel: 'Q2 2026 · Apr–Jun',
    title: 'First 3 discovery calls + 2 design partners',
    subtitle: 'Validate the strategic-memo ICP. Evidence before vocabulary.',
    type: 'outreach',
    targetOutput: '3 logged calls, 2 signed LOIs, ≥1 bias pattern confirmed 3× independently.',
    dependsOn: 'Outreach volume (15–20 messages/week). No external dependency.',
  },
  {
    id: 'cp-q2',
    quarter: 2,
    quarterLabel: 'Q3 2026 · Jul–Sep',
    title: 'First paying customer + public causal case study',
    subtitle: '$2,499/mo MRR opens. First case study with real DQI uplift.',
    type: 'product',
    targetOutput: '1 paying Strategy-tier customer, case study published, outcome loop demonstrated on real data.',
    dependsOn: 'Q1 design partner converts. If none convert, re-diagnose ICP before Q3.',
  },
  {
    id: 'cp-q3',
    quarter: 3,
    quarterLabel: 'Q4 2026 · Oct–Dec',
    title: 'Analyst outreach: Gartner + Forrester submissions',
    subtitle: 'Enter the DI Magic Quadrant conversation as "Causal / Governance" entrant.',
    type: 'analyst',
    targetOutput: 'Gartner inquiry call booked. Forrester Wave submission filed. Brand mention in ≥1 analyst blog.',
    dependsOn: '≥1 referenceable customer + published case study. Without a customer, analysts decline the call.',
  },
  {
    id: 'cp-q4',
    quarter: 4,
    quarterLabel: 'Q1 2027 · Jan–Mar',
    title: 'Category content push + conference placement',
    subtitle: 'Own "Causal Decision Audit" as a searchable term.',
    type: 'content',
    targetOutput: '12-post Substack series. 1 conference talk accepted (Gartner Data & Analytics, Forrester Decisions, or Decision Intelligence Summit).',
    dependsOn: 'Analyst signal from Q3. Conference acceptance is gated by speaker track review — not guaranteed.',
  },
  {
    id: 'cp-q5',
    quarter: 5,
    quarterLabel: 'Q2 2027 · Apr–Jun',
    title: 'Seed or seed+ round on category narrative',
    subtitle: '£1–3M at 2–3× pre-revenue valuation, anchored on MRR + analyst signal.',
    type: 'funding',
    targetOutput: '£1M+ closed, lead investor committed, GTM co-founder or head-of-sales onboarding.',
    dependsOn: '£25–50k MRR + named analyst mention. Without both, valuation compresses.',
  },
  {
    id: 'cp-q6',
    quarter: 6,
    quarterLabel: 'Q3 2027 · Jul–Sep',
    title: '$1M ARR + named in analyst report',
    subtitle: 'The category crossing point. "Causal / Governance DI" exists as a sub-category on paper.',
    type: 'analyst',
    targetOutput: '$1M ARR, 10+ paying customers, inclusion in a Gartner or Forrester published report.',
    dependsOn: 'All of the above compounding. This is a goal, not a guarantee.',
  },
];

// ─── Honest scorecard ────────────────────────────────────────────────────
// Where Decision Intel genuinely leads vs. what still needs to be built.

export interface ScorecardItem {
  label: string;
  detail: string;
}

export const LEADING_EDGES: ScorecardItem[] = [
  {
    label: 'Causal depth',
    detail:
      'PC-algorithm structural causal model per organization. No other DI platform ships this as first-class.',
  },
  {
    label: 'Bias taxonomy breadth',
    detail:
      '30+ biases across 7 categories with stable IDs (DI-B-001 to DI-B-020 published). Interaction matrix for toxic combinations.',
  },
  {
    label: 'DQI as published external standard',
    detail:
      'Decision Quality Index with 6 components, A–F grade scale, 135-decision calibration benchmark. Competitors would have to build this from scratch.',
  },
  {
    label: 'Strategic-memo vertical focus',
    detail:
      'No incumbent owns the memo/M&A vertical. Quantexa is KYC, Aera is supply chain, Palantir is ops, Pyramid is BI. Open lane.',
  },
  {
    label: 'Closed outcome loop architecture',
    detail:
      'Outcome inference, bias genome, per-org causal recalibration — shipped. Needs customer data volume to compound.',
  },
  {
    label: 'Regulatory governance layer',
    detail:
      'Seven regulatory frameworks mapped to biases. Decision fingerprints. Board-ready 2-page audit PDF. Category-first.',
  },
];

export const BUILD_OUT: ScorecardItem[] = [
  {
    label: 'Paying customers',
    detail:
      'Zero today → target 5–10 in 6 months. The single largest gap. Nothing else matters until this moves.',
  },
  {
    label: 'GTM co-founder or advisor',
    detail:
      'Solo technical founder. Need operator-level CSO network to convert outreach into calls at scale.',
  },
  {
    label: 'Referenceable case studies',
    detail:
      '135 historical cases are defensible content but not customer proof. Need 2–3 named live case studies by Q4.',
  },
  {
    label: 'Analyst relationships',
    detail:
      'Zero briefings booked. Gartner/Forrester take 6–9 months to warm up. Start in Q3 even without a paid customer in hand.',
  },
  {
    label: 'Brand / search presence',
    detail:
      '"Causal decision audit" and "decision quality index" should rank on page 1 for strategy buyers. Content cadence ≥ 2 pieces/week.',
  },
  {
    label: 'Enterprise sales machinery',
    detail:
      'No SDR, no CRM discipline, no pipeline hygiene. Acceptable solo through 5 customers; blocking past that.',
  },
];

// ─── Category thesis ─────────────────────────────────────────────────────

export const CATEGORY_THESIS = {
  sentence:
    'The DI market has a contextual layer (Quantexa), an automation layer (Aera), and a BI layer (Pyramid). It does not have a causal governance layer for strategic decisions. Decision Intel is the first.',
  theFourMoments: [
    {
      label: 'The Graph',
      body:
        'A Decision Knowledge Graph that compounds: every audit becomes a node, every outcome becomes an edge weight.',
    },
    {
      label: 'Predicted CEO questions',
      body:
        'Steering-committee objections surfaced in 60 seconds — before the board meeting, not in it.',
    },
    {
      label: 'Reasoning audit',
      body:
        '30+ biases scored across 6 DQI components, mapped to 7 regulatory frameworks. Every score traceable.',
    },
    {
      label: 'Outcome loop',
      body:
        'Autonomous outcome detection closes the loop. Causal weights learn your organisation. Quarter after quarter.',
    },
  ],
  whyNow:
    'EU AI Act enforcement 2026–2027. Board pressure on AI accountability at its peak. Agentic systems at superhuman speed without auditability create governance vacuum. DI market $16–20B, projected $50B+ by 2030 — the category is forming now.',
};
