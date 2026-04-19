// Competitive Positioning — content for the merged Strategy + InvestorDefense tab.
// Extracted verbatim from the legacy StrategyAndPositioningTab + InvestorDefenseTab
// so the new visual presentation preserves every quote, file reference, and number.

// ─── Elevator pitch + Cloverpop contrast ──────────────────────────────────

export const ELEVATOR_PITCH = {
  quote:
    'You might be familiar with Cloverpop — they did a great job digitizing the decision-making process. We are doing something entirely different: we are auditing the psychological integrity of the decision itself.',
  closing:
    'We are building the Wiz of decision intelligence — compound risk scoring for cognitive biases, not cloud vulnerabilities. Detection is a feature. Calibrated compound risk scoring with mitigation playbooks and dollar quantification is a product category.',
};

export const CATEGORY_CONTRAST = {
  cloverpop: {
    label: 'Cloverpop',
    role: 'System of Record',
    tagline: 'Jira for decisions — logs what was decided and why',
    accent: '#F59E0B',
  },
  decisionIntel: {
    label: 'Decision Intel',
    role: 'System of Cognitive Auditing',
    tagline: 'Grammarly for judgment — detects invisible cognitive flaws',
    accent: '#16A34A',
  },
};

// ─── 13-row Cloverpop comparison ──────────────────────────────────────────

export interface ComparisonRow {
  dimension: string;
  cloverpop: string;
  decisionIntel: string;
}

export const CLOVERPOP_COMPARISON: ComparisonRow[] = [
  { dimension: 'Founded', cloverpop: '2012 (acquired by Clearbox 2021)', decisionIntel: '2024' },
  { dimension: 'Funding', cloverpop: '$12.6M across 5 rounds', decisionIntel: 'Pre-seed' },
  {
    dimension: 'Core Philosophy',
    cloverpop: 'Process drives better decisions',
    decisionIntel: 'Human judgment is inherently flawed',
  },
  {
    dimension: 'Primary Function',
    cloverpop: 'Decision workflows & playbooks',
    decisionIntel: 'Autonomous cognitive auditing',
  },
  {
    dimension: 'AI Capabilities',
    cloverpop: 'D-Sight: summarization, KPI synthesis, recommendations',
    decisionIntel:
      'Decision Knowledge Graph + LangGraph engine: bias detection, noise simulation, adversarial debate',
  },
  { dimension: 'Bias Detection', cloverpop: 'None', decisionIntel: '20+ types with compound interaction matrix' },
  {
    dimension: 'Noise Measurement',
    cloverpop: 'None',
    decisionIntel: 'Kahneman decomposition (level + pattern + occasion)',
  },
  {
    dimension: 'Compliance Mapping',
    cloverpop: 'None',
    decisionIntel: '7 frameworks (SOX, FCA, EU AI Act, Basel III, GDPR, SEC Reg D, LPOA)',
  },
  {
    dimension: 'Target Market',
    cloverpop: 'Horizontal: Marketing, HR, Ops, Supply Chain',
    decisionIntel: 'Vertical: Corporate Strategy, M&A, Executive Committees',
  },
  {
    dimension: 'Output',
    cloverpop: 'Logged "Decision Flow" + AI recommendations',
    decisionIntel: 'DQI score + Noise Tax + Audit Defense Packet',
  },
  {
    dimension: 'Moat Type',
    cloverpop: 'Workflow adoption + Decision Bank data',
    decisionIntel: 'Compound scoring IP + org-calibrated outcome flywheel',
  },
  { dimension: 'Inc. 5000', cloverpop: '#608 (2025), ~300% 3yr growth', decisionIntel: 'N/A (pre-revenue)' },
];

// ─── 5 moat layers with file proofs ───────────────────────────────────────

export type MoatStrength = 'high' | 'very_high';

export interface MoatLayer {
  id: string;
  name: string;
  strength: MoatStrength;
  timeline: string;
  description: string;
  files: string;
  why: string;
}

export const MOAT_LAYERS: MoatLayer[] = [
  {
    id: 'pipeline',
    name: '12-Node LangGraph Pipeline',
    strength: 'high',
    timeline: 'Day 1',
    description:
      'GDPR anonymization, bias detection, noise judging, adversarial debate, compound scoring — orchestrated as a state machine.',
    files: 'src/lib/agents/graph.ts, nodes.ts, prompts.ts',
    why: 'Replicable in 3-6 months by a strong team, but provides critical time-to-market advantage.',
  },
  {
    id: 'compound',
    name: 'Compound Scoring Engine',
    strength: 'high',
    timeline: 'Day 1',
    description:
      'Post-LLM deterministic layer: 20x20 bias interaction matrix, contextual multipliers (dissent absent = 1.25x, time pressure = 1.15x), biological signal detection (Winner Effect, cortisol stress patterns).',
    files: 'src/lib/scoring/compound-engine.ts',
    why: 'Not an LLM — pure decision science encoded as software. Requires domain expertise competitors lack.',
  },
  {
    id: 'flywheel',
    name: 'Org-Calibrated Data Flywheel',
    strength: 'very_high',
    timeline: 'Month 6+',
    description:
      'Toxic combination detection learns which bias patterns fail at YOUR org. Noise benchmarks calibrate per-team. Each decision makes the system smarter.',
    files: 'src/lib/learning/toxic-combinations.ts, src/lib/scoring/noise-decomposition.ts',
    why: 'Requires 18+ months of customer data. Cannot be replicated by copying code — needs proprietary decision outcomes from private financial markets.',
  },
  {
    id: 'graph',
    name: 'pgvector Knowledge Graph',
    strength: 'very_high',
    timeline: 'Month 12+',
    description:
      'Decision graph with PageRank centrality, Union-Find clustering, outcome-weighted edges, and graph-guided RAG re-ranking.',
    files: 'src/lib/graph/graph-builder.ts',
    why: 'After 6 months at 50+ decisions, the graph contains institutional memory no competitor can rebuild even with access to the same codebase.',
  },
  {
    id: 'compliance',
    name: 'Compliance Framework Lock-in',
    strength: 'very_high',
    timeline: 'Day 1',
    description:
      '7 regulatory frameworks (SOX, FCA, EU AI Act, Basel III, GDPR, SEC Reg D, LPOA) with provision-level mapping and audit defense packet generation.',
    files: 'src/lib/compliance/frameworks/',
    why: "Competitors need 7 frameworks' worth of legal review before shipping a single page. Cloverpop, Palantir, and IBM can't catch up here.",
  },
];

export const MOAT_STRENGTH_COLOR: Record<MoatStrength, string> = {
  high: '#F59E0B',
  very_high: '#16A34A',
};

export const MOAT_STRENGTH_LABEL: Record<MoatStrength, string> = {
  high: 'High',
  very_high: 'Very High',
};

// ─── 11-capability × 5-competitor matrix ──────────────────────────────────

export type CellValue = 'yes' | 'partial' | 'no';

export interface CapabilityRow {
  capability: string;
  decisionIntel: CellValue;
  cloverpop: CellValue;
  palantir: CellValue;
  consulting: CellValue;
  llm: CellValue;
}

export const CAPABILITY_MATRIX: CapabilityRow[] = [
  { capability: 'Cognitive Bias Detection', decisionIntel: 'yes', cloverpop: 'no', palantir: 'no', consulting: 'partial', llm: 'partial' },
  { capability: 'Noise Measurement (Kahneman)', decisionIntel: 'yes', cloverpop: 'no', palantir: 'no', consulting: 'no', llm: 'no' },
  { capability: 'Compound Bias Scoring', decisionIntel: 'yes', cloverpop: 'no', palantir: 'no', consulting: 'no', llm: 'no' },
  { capability: 'Toxic Combination Patterns', decisionIntel: 'yes', cloverpop: 'no', palantir: 'no', consulting: 'no', llm: 'no' },
  { capability: 'Compliance Frameworks', decisionIntel: 'yes', cloverpop: 'no', palantir: 'partial', consulting: 'partial', llm: 'no' },
  { capability: 'Outcome Learning Flywheel', decisionIntel: 'yes', cloverpop: 'partial', palantir: 'no', consulting: 'no', llm: 'no' },
  { capability: 'Knowledge Graph', decisionIntel: 'yes', cloverpop: 'no', palantir: 'yes', consulting: 'no', llm: 'no' },
  { capability: 'Real-time Integration', decisionIntel: 'yes', cloverpop: 'partial', palantir: 'partial', consulting: 'no', llm: 'no' },
  { capability: 'Case Study Library', decisionIntel: 'yes', cloverpop: 'no', palantir: 'no', consulting: 'yes', llm: 'no' },
  { capability: 'Time to Insight', decisionIntel: 'yes', cloverpop: 'partial', palantir: 'partial', consulting: 'no', llm: 'yes' },
  { capability: 'Cost per Analysis', decisionIntel: 'yes', cloverpop: 'partial', palantir: 'no', consulting: 'no', llm: 'yes' },
];

export const COMPETITOR_HEADERS = [
  { key: 'decisionIntel' as const, label: 'Decision Intel', color: '#16A34A' },
  { key: 'cloverpop' as const, label: 'Cloverpop', color: '#F59E0B' },
  { key: 'palantir' as const, label: 'Palantir', color: '#0EA5E9' },
  { key: 'consulting' as const, label: 'McKinsey/BCG', color: '#8B5CF6' },
  { key: 'llm' as const, label: 'ChatGPT/Claude', color: '#64748B' },
];

export const CELL_COLOR: Record<CellValue, string> = {
  yes: '#16A34A',
  partial: '#F59E0B',
  no: '#EF4444',
};

export const CELL_LABEL: Record<CellValue, string> = {
  yes: 'Yes',
  partial: 'Partial',
  no: 'No',
};

// ─── 8 investor Q&A with code proofs ──────────────────────────────────────

export interface InvestorQA {
  id: string;
  question: string;
  answer: string;
  proof?: string;
  topic: 'competition' | 'tam' | 'team' | 'adoption' | 'moat' | 'unit-economics' | 'defensibility' | 'traction';
}

export const TOPIC_LABEL: Record<InvestorQA['topic'], string> = {
  competition: 'Competition',
  tam: 'TAM',
  team: 'Team',
  adoption: 'Adoption',
  moat: 'Moat',
  'unit-economics': 'Unit Economics',
  defensibility: 'Defensibility',
  traction: 'Traction',
};

export const TOPIC_COLOR: Record<InvestorQA['topic'], string> = {
  competition: '#F59E0B',
  tam: '#0EA5E9',
  team: '#EC4899',
  adoption: '#14B8A6',
  moat: '#16A34A',
  'unit-economics': '#8B5CF6',
  defensibility: '#EF4444',
  traction: '#F97316',
};

export const INVESTOR_QA: InvestorQA[] = [
  {
    id: 'cloverpop_killshot',
    topic: 'competition',
    question:
      'Cloverpop has been around since 2012, raised $12.6M, and was acquired. They just integrated D-Sight AI. What stops them from wiping you out?',
    answer:
      "Cloverpop built a brilliant workflow tool, essentially Jira for decisions. It relies on humans manually logging what they decided and why. But that is their vulnerability. Cloverpop assumes the humans entering the data are rational. Decision Intel assumes they are not. Our Decision Knowledge Graph ingests the strategic memo and autonomously audits the invisible flaws in the reasoning, then connects every assumption, bias, and outcome into a living network. By the time a decision makes it into Cloverpop's Decision Bank, Confirmation Bias and Sunk Cost Fallacy are already baked in. We intercept the cognitive noise before the board signs off.",
    proof:
      'src/lib/agents/graph.ts — LangGraph analysis engine with GDPR gating, adversarial debate, and compound scoring that feeds the Decision Knowledge Graph',
  },
  {
    id: 'tam_limit',
    topic: 'tam',
    question: "You're laser-focused on corporate strategy and M&A. Aren't you artificially limiting your TAM?",
    answer:
      "We are applying Peter Thiel's monopoly framework: dominate a high-stakes, high-WTP vertical before expanding horizontally. Cloverpop's generic AI is fine for deciding where to host a corporate retreat. But a generic LLM cannot audit a $500M acquisition memo. Our engine has 11 proprietary, strategy-specific bias overlays — we hunt for Winner's Curse, Valuation Anchoring, and Synergy Overconfidence. When a CFO is approving a $200M acquisition, they don't want a horizontal HR collaboration tool. They want a specialized statistical jury. Because we're verticalized, we tie outputs directly to FCA Consumer Duty and SOX compliance — turning our software from nice-to-have into must-have regulatory CYA.",
    proof:
      'src/lib/compliance/frameworks/ — 7 regulatory framework implementations (SOX, FCA, EU AI Act, Basel III, GDPR, SEC Reg D, LPOA)',
  },
  {
    id: 'solo_founder',
    topic: 'team',
    question:
      "You're a solo founder. They have millions and a massive team. Can't they reverse-engineer your pipeline in two months?",
    answer:
      "The analysis engine is my temporary moat to get to market fast. My structural moat is the Decision Knowledge Graph and the Causal Loop, powered by pgvector and our proprietary failure database. If Cloverpop replicates the engine, they are still just doing text analysis. Decision Intel is building a closed-loop causal database. We ingest the strategic memo, our agents flag a 94% probability of Groupthink, and three years later we tie that specific bias to the actual outcome (revenue impact, initiative success, post-mortem findings). Once the platform can mathematically prove that 'Memos flagged for Sunk Cost Fallacy correlate with a 12% drop in initiative ROI,' I have a proprietary dataset nobody can replicate because that data lives inside enterprise strategy functions.",
    proof:
      'src/lib/graph/graph-builder.ts — pgvector knowledge graph with PageRank, Union-Find clustering, outcome-weighted edge learning. src/lib/learning/toxic-combinations.ts — org-calibrated toxic pattern engine',
  },
  {
    id: 'pe_adoption',
    topic: 'adoption',
    question: "PE partners have massive egos. They won't log into a dashboard to have an AI tell them their judgment is noisy. How do you get adoption?",
    answer:
      "You are completely right, they will not log into a dashboard. That is why Cloverpop's Decision Playbooks require heavy change management and top-down mandates. I designed Decision Intel to require zero behavior change. Native Slack, Email, and Google Drive integrations wire the audit directly into the existing workflow. The AI lives where the strategy discussion is already happening. When a strategy manager uploads a board deck, pastes a market-entry memo, or drops a strategic recommendation in Slack, background agents run the audit and deliver a localized nudge. We do not ask anyone to learn a new workflow. We augment the workflow they are already using.",
    proof:
      'src/lib/integrations/slack/handler.ts — HMAC-verified, pattern-based decision detection with real-time bias nudging',
  },
  {
    id: 'moat_weekend',
    topic: 'moat',
    question: "What's your moat? I can build this with OpenAI's API in a weekend hackathon.",
    answer:
      'A weekend gets you one LLM opinion with zero noise measurement. We use 3 independent judges for Kahneman noise decomposition. We have a 20x20 bias interaction matrix with contextual multipliers — dissent absent amplifies groupthink 1.25x, time pressure shifts scoring 1.15x. We detect biological signals like Winner Effect language and cortisol stress patterns. We have 135 curated case studies with cross-correlation patterns and reference class forecasting. The compound scoring engine alone is 10,000+ LOC of proprietary IP. A weekend hackathon gets you layer zero. Our moat is five layers deep.',
    proof:
      'src/lib/scoring/compound-engine.ts — deterministic post-LLM scoring with bio-signal detection. src/lib/scoring/noise-decomposition.ts — ANOVA-framework noise measurement. src/lib/data/case-correlations.ts — cross-case statistical patterns',
  },
  {
    id: 'unit_economics',
    topic: 'unit-economics',
    question: "How do you actually make money? What's the unit economics?",
    answer:
      "API cost per analysis: ~$0.40-0.65 on Gemini paid tier 1 (17 LLM calls across the 12-node pipeline). Strategy plan: $2,499/month. Blended gross margin: ~90% across typical usage, compressing to 85% at heavy team usage — still top-decile for enterprise SaaS. The motion: free 30-day pilot on the buyer's next high-stakes strategic memo. The Knowledge Graph seeds during the trial. Then convert to Strategy subscription ($2,499/mo) or negotiate enterprise ($50K to $200K/yr ACV with a volume floor + overage schedule). The pilot converts because they would lose their Knowledge Graph data by not subscribing. Outcome tracking creates additional switching costs: calibration profiles and the Decision Knowledge Graph become org-specific assets that cannot transfer to a competitor.",
  },
  {
    id: 'platform_risk',
    topic: 'defensibility',
    question: 'What if OpenAI or Anthropic just builds this into their platform?',
    answer:
      "LLM providers are infrastructure, not vertical SaaS. They don't have 7 compliance frameworks implemented, 135 case studies with outcome correlations, or an org-specific calibration flywheel. It's like asking 'What if AWS builds Datadog?' The platform layer and the domain layer are different businesses. Our value is the compound scoring engine + regulatory mapping + outcome learning, not the LLM inference. We swap LLM models freely — that's by design.",
  },
  {
    id: 'traction',
    topic: 'traction',
    question: 'Show me traction.',
    answer:
      "Working product at production URL. Full analysis engine processing real strategic memos end-to-end, with the Decision Knowledge Graph seeding from document one. Full auth (Google OAuth), multi-tenant orgs, team collaboration. Compliance frameworks (FCA, SOX, Basel III) fully implemented. Reviewed by the senior consultant who helped take Wiz public at $32B, quote: 'genuinely fascinated by the role of unconscious cognitive biases in decision-making.' LRQA executive (global risk management firm) review in progress. 135 reverse-engineered case studies across 11 industries. Cloverpop's Inc. 5000 #608 ranking with 300% growth validates that the decision intelligence category has enterprise demand.",
  },
];

// ─── 7 common objections ──────────────────────────────────────────────────

export interface Objection {
  id: string;
  objection: string;
  response: string;
  tag: string;
}

export const COMMON_OBJECTIONS: Objection[] = [
  {
    id: 'solo',
    objection: 'Solo founder risk',
    response:
      '199K+ lines of production TypeScript, 586+ automated tests, standard Next.js/Postgres/LangGraph stack. The codebase IS the company — not tribal knowledge. Any senior full-stack engineer can onboard in weeks. First hire is already scoped. Advised by a senior consultant who helped take Wiz from startup to $32B.',
    tag: 'Team',
  },
  {
    id: 'category',
    objection: 'Market timing — is decision intelligence a real category?',
    response:
      "Cloverpop's Inc. 5000 #608 ranking with ~300% three-year growth proves enterprise demand exists. Decision intelligence market sized at $12.2B growing to $46.4B by 2030. EU AI Act and FCA Consumer Duty create regulatory tailwinds that make bias detection compliance-mandatory.",
    tag: 'Category',
  },
  {
    id: 'chatgpt',
    objection: 'Why not just use ChatGPT?',
    response:
      'One opinion from one model. No noise measurement (how much do judges disagree?), no deterministic compound scoring, no outcome tracking, no org-specific calibration, no compliance mapping, no toxic combination detection. A ChatGPT prompt has no memory and no way to measure its own noise.',
    tag: 'LLM',
  },
  {
    id: 'behavior',
    objection: 'Behavior change is hard — enterprises resist new tools',
    response:
      'Zero behavior change required. Upload a document you already wrote — M&A memo, board paper, strategy doc. 60 seconds later, get a score. Slack integration detects decisions in real-time without disrupting flow. Chrome extension works inside existing tools. We are an audit layer, not a replacement process.',
    tag: 'Adoption',
  },
  {
    id: 'mckinsey',
    objection: "How do you compete with McKinsey's decision advisory?",
    response:
      "We don't replace consulting — we make their most expensive service 1,000x cheaper and always-on. McKinsey charges $500K-$2M per strategic review, takes 6-12 weeks, and their consultants carry their own cognitive biases into the analysis. We deliver the same core service — decision quality assessment — in 60 seconds, continuously, for $2,499/month. And unlike McKinsey, we get smarter with every deal your team runs.",
    tag: 'Consulting',
  },
  {
    id: 'commoditization',
    objection: 'AI is commoditizing — LLMs are a race to the bottom',
    response:
      'The LLM layer IS commodity — by design. We swap Gemini, Claude, and GPT freely. Our 5 proprietary layers ABOVE the LLM are the moat: compound scoring engine, toxic combination detection, noise decomposition, knowledge graph, and compliance frameworks. A competitor can copy our prompts. They cannot copy 18 months of org-specific outcome data or 7 regulatory frameworks worth of legal review.',
    tag: 'Moat',
  },
  {
    id: 'advantage',
    objection: "What's your unfair advantage as a founder?",
    response:
      'Deep domain expertise at the intersection of cognitive science and financial decision-making — a rare combination. A proprietary failure database (135 cases with computed correlations) that cannot be scraped or reproduced. A compliance framework stack that took months of legal mapping. And the hunger of a solo founder who has built a $0 to production-grade enterprise SaaS platform alone.',
    tag: 'Advantage',
  },
];

// ─── Market sizing & expansion roadmap ────────────────────────────────────

export const MARKET_SIZE = {
  headline: '$995B by 2035',
  stats: [
    'Decision intelligence market: $12.2B → $46.4B by 2030',
    'Enterprise GRC software: $50B+ and growing at 14% CAGR',
    'Corporate M&A advisory market: $40B+ annually',
    'Fortune 500 + mid-market = 10,000+ addressable organizations',
    'Cross-industry applicability expands TAM beyond any single vertical',
  ],
};

export const PRICING_RATIONALE = {
  headline: '$0-999',
  unit: '/month',
  points: [
    'Free (4 analyses) → Individual: $249/mo → Strategy: $2,499/mo',
    'Avoid 1 bad decision per year = millions saved',
    'ROI: 100-1000x the subscription cost',
    'Enterprise: Custom pricing for SSO, unlimited, dedicated support',
    'Land with Individual, expand to Team seats + Enterprise',
  ],
};

export interface RoadmapYear {
  year: string;
  market: string;
  color: string;
  status: string;
  details: string;
}

export const EXPANSION_ROADMAP: RoadmapYear[] = [
  {
    year: 'Year 1',
    market: 'Enterprise Decision Teams',
    color: '#16A34A',
    status: 'NOW',
    details:
      'Corporate strategy, M&A, risk assessment, vendor evaluation. Board memos, strategy papers, project pipeline. Corporate M&A as primary vertical.',
  },
  {
    year: 'Year 2',
    market: 'Financial Services Vertical',
    color: '#0EA5E9',
    status: 'NEXT',
    details:
      'PE/VC investment committees, hedge funds, credit committees. Investment-specific biases and IRR/MOIC tracking as differentiators.',
  },
  {
    year: 'Year 3',
    market: 'Government & Insurance',
    color: '#F59E0B',
    status: 'PLANNED',
    details:
      'FedRAMP certification unlocks government. Regulatory compliance pull in insurance. High contract values justify longer sales cycles.',
  },
  {
    year: 'Year 4+',
    market: 'Horizontal Platform',
    color: '#8B5CF6',
    status: 'VISION',
    details:
      'Decision quality as infrastructure. API-first platform for any organization. Industry-specific bias modules as add-ons.',
  },
];

// ─── DI-space gap analysis (landing-page CategoryGapShowcase) ─────────────
//
// Three gaps the decision-intelligence incumbents have left open. The
// landing-page showcase renders these as interactive tabs, with a per-gap
// micro-viz and a rating strip showing how Quantexa, Aera, and Pyramid fare
// against Decision Intel on each one.
//
// Positioning-only — no funding/valuation numbers. The incumbents' stances
// come from their published positioning (Quantexa = contextual decision
// intelligence / entity resolution; Aera = real-time decision automation;
// Pyramid = augmented analytics / governed self-service BI) and Grok's
// 2026 DI-space synthesis. Ratings are deliberate:
//   - causal:     none = correlation-only; partial = some root-cause tooling;
//                 full = structural causal models + do-calculus.
//   - execution:  none = recommendations only; partial = automation without
//                 recalibration loop; full = outcome flywheel + per-org DQI.
//   - governance: none = black-box; partial = some audit / lineage; full =
//                 regulator-grade compliance packet across 7 frameworks.

export type GapId = 'causal' | 'execution' | 'governance';

export interface DiGap {
  id: GapId;
  name: string; // short tab label
  fullName: string; // full headline
  summary: string; // what's broken across the DI space
  diEdge: string; // what DI does differently
  evidence: string; // research / internal anchor for credibility
}

export const DI_GAPS: DiGap[] = [
  {
    id: 'causal',
    name: 'Causal',
    fullName: 'Causal reasoning & faithful explainability',
    summary:
      "Incumbents run on correlation, not causation. ~74% of LLM-generated decision explanations don't match the actual drivers, so \"what-if\" and counterfactual questions get soft answers no audit committee can defend.",
    diEdge:
      "Structural causal models + do-calculus over a per-org Decision Knowledge Graph. Every flag names the cause, not just the pattern — and every counterfactual is a traceable intervention, not an LLM opinion.",
    evidence:
      'Grounded in the Kahneman-Tversky heuristics-and-biases lineage and our 20×20 bias-interaction matrix — both operationalised in src/lib/scoring/compound-engine.ts.',
  },
  {
    id: 'execution',
    name: 'Closed-Loop',
    fullName: 'Decision-to-action execution & accountability',
    summary:
      'DI platforms stop at the recommendation. Outcome tracking, ownership, and score recalibration live outside the tool — so "insight without action" becomes the default, not the exception.',
    diEdge:
      "Outcome flywheel passively detects what actually happened across Slack, Drive, and email. Every confirmed outcome scores the original prediction with a Brier score and recalibrates the org's DQI per quarter. The loop closes automatically.",
    evidence:
      'Tetlock-grade calibration applied to corporate strategy. Implemented in src/lib/learning/ and surfaced on the Outcome Flywheel dashboard.',
  },
  {
    id: 'governance',
    name: 'Governance',
    fullName: 'Human-AI governance, trust & oversight',
    summary:
      "Black-box AI inside a regulated decision process fails audit committee review. Decision governance lags data governance by a decade — few platforms produce regulator-grade defence documents for every flag they surface.",
    diEdge:
      'Every flag cross-links to a specific regulatory provision across 7 frameworks (SOX, GDPR, EU AI Act, Basel III, FCA, SEC Reg D, LPOA). The Audit Defense Packet is a one-click export your audit committee can walk into a regulator meeting with.',
    evidence:
      'Seven framework implementations shipped in src/lib/compliance/frameworks/ — provision-level mapping, not marketing claims.',
  },
];

export type GapRating = 'full' | 'partial' | 'none';

export interface DiIncumbent {
  key: 'quantexa' | 'aera' | 'pyramid' | 'decisionIntel';
  name: string;
  tagline: string;
  focus: string; // one line — what they're best at
  accent: string; // hex for the row chip
  ratings: Record<GapId, GapRating>;
  blurb: Record<GapId, string>; // why each rating lands where it does
}

export const DI_INCUMBENTS: DiIncumbent[] = [
  {
    key: 'quantexa',
    name: 'Quantexa',
    tagline: 'Contextual Decision Intelligence',
    focus: 'Unifies siloed data across entities for financial crime, fraud, and KYC.',
    accent: '#0EA5E9',
    ratings: { causal: 'partial', execution: 'none', governance: 'partial' },
    blurb: {
      causal:
        'Entity resolution surfaces connections — but a connection is not a cause. No do-calculus layer for counterfactual what-ifs on strategic decisions.',
      execution:
        'Strong at flagging risk. Outcome tracking and per-org recalibration sit outside the platform.',
      governance:
        'Lineage for compliance cases, not for strategic decisions. No provision-level mapping to SOX or the EU AI Act on a board memo.',
    },
  },
  {
    key: 'aera',
    name: 'Aera Technology',
    tagline: 'Real-time decision automation',
    focus: 'Digitises, augments, and automates supply-chain and operational decisions.',
    accent: '#8B5CF6',
    ratings: { causal: 'none', execution: 'partial', governance: 'none' },
    blurb: {
      causal:
        'Recommendation engine on top of operational data. Correlation-based — no SCM layer, no intervention simulation.',
      execution:
        'Automation closes the loop for operational calls (replenishment, pricing). Strategic-memo outcomes are not in scope.',
      governance:
        'Built for ops, not for the audit committee. No cross-framework regulatory mapping on decision artefacts.',
    },
  },
  {
    key: 'pyramid',
    name: 'Pyramid Analytics',
    tagline: 'Augmented analytics',
    focus: 'Governed self-service BI and decision dashboards for business users.',
    accent: '#F59E0B',
    ratings: { causal: 'none', execution: 'none', governance: 'partial' },
    blurb: {
      causal:
        'Descriptive + predictive analytics over warehoused data. No causal inference on the reasoning that produced the memo.',
      execution:
        'Dashboards inform decisions; they do not track or recalibrate outcomes per-org.',
      governance:
        'Data governance is strong. Decision governance — flag-to-regulation mapping — is not the product surface.',
    },
  },
  {
    key: 'decisionIntel',
    name: 'Decision Intel',
    tagline: 'Causal Decision Assurance for strategy and M&A',
    focus:
      'Audits the reasoning behind every strategic memo — bias, noise, and compound risk — and closes the outcome loop.',
    accent: '#16A34A',
    ratings: { causal: 'full', execution: 'full', governance: 'full' },
    blurb: {
      causal:
        'SCMs + do-calculus over a per-org Decision Knowledge Graph. Counterfactual what-ifs become traceable interventions with dollar-impact forecasts.',
      execution:
        'Outcome flywheel detects confirmed outcomes across Slack, Drive, and email. Brier scoring + Bayesian updating recalibrate the org-specific DQI quarter over quarter.',
      governance:
        'Every flag cites a regulatory provision across 7 frameworks. Audit Defense Packet exports as a regulator-grade PDF on Pro tier.',
    },
  },
];

export const GAP_RATING_COLOR: Record<GapRating, string> = {
  full: '#16A34A',
  partial: '#F59E0B',
  none: '#EF4444',
};

export const GAP_RATING_LABEL: Record<GapRating, string> = {
  full: 'Full coverage',
  partial: 'Partial coverage',
  none: 'Not covered',
};
