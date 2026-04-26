// Competitive Positioning — content for the merged Strategy + InvestorDefense tab.
// Extracted verbatim from the legacy StrategyAndPositioningTab + InvestorDefenseTab
// so the new visual presentation preserves every quote, file reference, and number.

// ─── Elevator pitch + Cloverpop contrast ──────────────────────────────────

export const ELEVATOR_PITCH = {
  quote:
    'You might be familiar with Cloverpop — they did a great job digitizing the decision-making workflow. We do something different: we are the native reasoning layer for every high-stakes call. Decision Quality Index in 60 seconds, Decision Provenance Record on every audit, Recognition-Rigor Framework (R²F) — Kahneman\'s debiasing plus Klein\'s Recognition-Primed Decisions, arbitrated in one pipeline.',
  closing:
    'Cloverpop logs decisions. We audit the reasoning behind them. The Decision Provenance Record is hashed, tamper-evident, and mapped to 17 regulatory frameworks across G7, EU, GCC, and African markets — the artefact your audit committee will eventually require evidence of, before regulators start asking.',
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
    role: 'Native reasoning layer',
    tagline: 'R²F audit on every memo — DQI in 60 seconds, DPR on every artefact',
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
  {
    dimension: 'Bias Detection',
    cloverpop: 'None',
    decisionIntel: '20+ types with compound interaction matrix',
  },
  {
    dimension: 'Noise Measurement',
    cloverpop: 'None',
    decisionIntel: 'Kahneman decomposition (level + pattern + occasion)',
  },
  {
    dimension: 'Compliance Mapping',
    cloverpop: 'None',
    decisionIntel:
      '17 frameworks across G7 / EU / GCC / African markets (EU AI Act, SOC 2, GDPR, Basel III, SOX, NDPR, CBN, WAEMU, PoPIA, CMA Kenya, more — derived dynamically from FRAMEWORKS.length)',
  },
  {
    dimension: 'Target Market',
    cloverpop: 'Horizontal: Marketing, HR, Ops, Supply Chain',
    decisionIntel: 'Vertical: Corporate Strategy, M&A, Executive Committees',
  },
  {
    dimension: 'Output',
    cloverpop: 'Logged "Decision Flow" + AI recommendations',
    decisionIntel:
      'Decision Quality Index (A-F + 0-100) + Noise score + Decision Provenance Record (hashed, tamper-evident, 17-framework regulatory mapping)',
  },
  {
    dimension: 'Moat Type',
    cloverpop: 'Workflow adoption + Decision Bank data',
    decisionIntel: 'Compound scoring IP + org-calibrated outcome flywheel',
  },
  {
    dimension: 'Inc. 5000',
    cloverpop: '#608 (2025), ~300% 3yr growth',
    decisionIntel: 'N/A (pre-revenue)',
  },
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
    name: 'Compliance + Pan-African Regulatory Lock-in',
    strength: 'very_high',
    timeline: 'Day 1',
    description:
      '17 regulatory frameworks across G7, EU, GCC, and African markets — EU AI Act Art 14, SOC 2 Type II, GDPR Art 22, Basel III Pillar 2 ICAAP, SOX §404, NDPR, CBN, WAEMU, PoPIA §71, CMA Kenya, SARB Model Risk, and more. Provision-level mapping per flag, hashed + tamper-evident Decision Provenance Record on every audit. The 17-framework count is structurally derived from FRAMEWORKS.length so additions extend the moat automatically.',
    files: 'src/lib/compliance/frameworks/, src/lib/constants/trust-copy.ts',
    why: "Competitors need 17 frameworks' worth of legal + cultural review before shipping a single page. The Pan-African coverage specifically (NDPR, CBN, WAEMU, PoPIA, etc.) is what removes the 'this is a US-only product' procurement objection from African and EM-focused buyers — Cloverpop, Palantir, IBM Watson, and Aera have no defensible answer here.",
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
  {
    capability: 'Cognitive Bias Detection',
    decisionIntel: 'yes',
    cloverpop: 'no',
    palantir: 'no',
    consulting: 'partial',
    llm: 'partial',
  },
  {
    capability: 'Noise Measurement (Kahneman)',
    decisionIntel: 'yes',
    cloverpop: 'no',
    palantir: 'no',
    consulting: 'no',
    llm: 'no',
  },
  {
    capability: 'Compound Bias Scoring',
    decisionIntel: 'yes',
    cloverpop: 'no',
    palantir: 'no',
    consulting: 'no',
    llm: 'no',
  },
  {
    capability: 'Toxic Combination Patterns',
    decisionIntel: 'yes',
    cloverpop: 'no',
    palantir: 'no',
    consulting: 'no',
    llm: 'no',
  },
  {
    capability: 'Compliance Frameworks',
    decisionIntel: 'yes',
    cloverpop: 'no',
    palantir: 'partial',
    consulting: 'partial',
    llm: 'no',
  },
  {
    capability: 'Outcome Learning Flywheel',
    decisionIntel: 'yes',
    cloverpop: 'partial',
    palantir: 'no',
    consulting: 'no',
    llm: 'no',
  },
  {
    capability: 'Knowledge Graph',
    decisionIntel: 'yes',
    cloverpop: 'no',
    palantir: 'yes',
    consulting: 'no',
    llm: 'no',
  },
  {
    capability: 'Real-time Integration',
    decisionIntel: 'yes',
    cloverpop: 'partial',
    palantir: 'partial',
    consulting: 'no',
    llm: 'no',
  },
  {
    capability: 'Case Study Library',
    decisionIntel: 'yes',
    cloverpop: 'no',
    palantir: 'no',
    consulting: 'yes',
    llm: 'no',
  },
  {
    capability: 'Time to Insight',
    decisionIntel: 'yes',
    cloverpop: 'partial',
    palantir: 'partial',
    consulting: 'no',
    llm: 'yes',
  },
  {
    capability: 'Cost per Analysis',
    decisionIntel: 'yes',
    cloverpop: 'partial',
    palantir: 'no',
    consulting: 'no',
    llm: 'yes',
  },
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
  topic:
    | 'competition'
    | 'tam'
    | 'team'
    | 'adoption'
    | 'moat'
    | 'unit-economics'
    | 'defensibility'
    | 'traction';
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
    question:
      "You're laser-focused on corporate strategy and M&A. Aren't you artificially limiting your TAM?",
    answer:
      "We are applying Peter Thiel's monopoly framework: dominate a high-stakes, high-WTP vertical before expanding horizontally. The vertical is broader than it looks — corporate strategy + corporate development + funds (PE, EM-focused VC, family offices) + audit committees + GCs at regulated entities. Cloverpop's generic AI is fine for deciding where to host a corporate retreat; a generic LLM cannot audit a $500M acquisition memo. Our R²F engine has 20-bias taxonomy (DI-B-001 through DI-B-020) with strategy-specific overlays — Winner's Curse, Valuation Anchoring, Synergy Overconfidence — and the 17-framework regulatory map across G7, EU, GCC, and African markets means a Pan-African GC reading our security posture sees NDPR, CBN, WAEMU mapped alongside Basel III and EU AI Act. That's not nice-to-have; that's must-have regulatory CYA. The Pan-African angle alone (which no US incumbent has) opens a beachhead worth $50-150B+ in corporate strategy spend that's structurally underserved.",
    proof:
      'src/lib/compliance/frameworks/ — 17 regulatory framework implementations (FRAMEWORKS.length-derived) including EU AI Act Art 14, SOC 2 Type II, GDPR Art 22, Basel III Pillar 2, SOX §404, NDPR, CBN, WAEMU, PoPIA §71, CMA Kenya, SARB Model Risk, and more',
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
    question:
      "PE partners have massive egos. They won't log into a dashboard to have an AI tell them their judgment is noisy. How do you get adoption?",
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
      "LLM providers are infrastructure, not vertical SaaS. They don't have 17 compliance frameworks implemented (G7, EU, GCC, African markets — including NDPR, CBN, WAEMU, PoPIA), 135 case studies with outcome correlations, two production specimen DPRs (WeWork S-1 + Dangote Pan-African expansion), the per-org Brier-scored recalibration flywheel (Tetlock superforecasting research), or the 20×20 bias interaction matrix with 18 named toxic combinations. It's like asking 'What if AWS builds Datadog?' The platform layer and the domain layer are different businesses. Our value is the R²F engine + 17-framework regulatory mapping + per-org outcome learning + Pan-African geographic moat — not the LLM inference. We swap LLM models freely (locked 2-model policy: gemini-3-flash-preview + gemini-3.1-flash-lite) — that's by design.",
  },
  {
    id: 'traction',
    topic: 'traction',
    question: 'Show me traction.',
    answer:
      "Working product at production URL — full LangGraph 12-node analysis engine processing real strategic memos end-to-end, with the Decision Knowledge Graph seeding from document one. Full auth (Google OAuth via Supabase), multi-tenant orgs, team collaboration, blind-prior decision rooms, deal-level cross-document conflict detection, hashed + tamper-evident Decision Provenance Records. 17 regulatory frameworks fully mapped across G7, EU, GCC, and African markets (EU AI Act, SOC 2 Type II infrastructure, GDPR, Basel III, SOX, NDPR, CBN, WAEMU, PoPIA, CMA Kenya, more). Two production specimen DPRs (WeWork S-1 + Dangote 2014 Pan-African expansion) ship in public/ as cold-call evidence. Reviewed by the senior consultant who helped take Wiz from startup to $32B, quote: 'genuinely fascinated by the role of unconscious cognitive biases in decision-making.' 135 hand-curated case studies across 11 industries (deduplicated, primary-source cited). Cloverpop's Inc. 5000 #608 ranking with 300% growth validates enterprise demand exists for the workflow-tooling adjacent category — we audit the reasoning Cloverpop logs.",
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
    objection: 'Market timing — is this a real category?',
    response:
      "We frame it as the regulatory tailwind moment, not the market-size pitch. EU AI Act in force since Aug 2024 (Article 14 record-keeping for high-risk decision-support systems enforceable Aug 2026, Article 13 transparency, Article 15 accuracy + record-keeping). SEC AI disclosure proposed 2024, evolving through 2026. Basel III Pillar 2 ICAAP live for regulated banks. GDPR Article 22 live since 2018 (automated-decision rights). Colorado SB24-205 (Feb 2026 enforceable). NDPR / CBN / WAEMU / PoPIA on the African side. Every tailwind has a statute, a regulator guidance, or an enforcement date — these are calendars, not predictions. The DPR is the artefact each one will eventually require evidence of. Cloverpop's #608 Inc. 5000 ranking validates workflow tooling adjacent to ours; AI Verify Foundation (IMDA, Singapore, Apache 2.0) gives us 11 internationally-recognised AI governance principles to align with. The category has named enforceable regulations across 17 frameworks — that's the why-now, not a market-size slide.",
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
  headline: 'Regulatory-tailwind market — $995B by 2035 if categorised broadly',
  stats: [
    'Enterprise GRC software: $50B+ and growing at 14% CAGR (commerce-adjacent)',
    'Corporate M&A advisory market: $40B+ annually (deal-side beachhead)',
    'Fortune 500 + mid-market + Pan-African enterprise = 12,000+ addressable orgs',
    'EU AI Act Article 14 enforcement Aug 2026 — compliance is a market trigger, not a feature',
    'African enterprise / EM funds — structurally underserved $50-150B+ corp strategy spend (the moat geography)',
    'Cross-industry applicability expands TAM beyond any single vertical',
  ],
  positioning_note:
    'Lead investor pitches with the REGULATORY TAILWIND moment, not the market-size slide. Every tailwind has a statute, regulator guidance, or enforcement date — calendars, not predictions. The DPR is the artefact each one will eventually require evidence of.',
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
// Three problems the decision-intelligence category has left unsolved. The
// landing-page showcase names each problem without naming specific incumbents
// (category-creator positioning — we lead by defining the problem, not by
// punching down at vendors) and shows the specific Decision Intel
// capabilities that close each gap, plus the measurable outcome each one
// moves.

export type GapId = 'causal' | 'execution' | 'governance';

export interface DiCapability {
  /** Short feature label rendered as a pill. */
  label: string;
  /** One-line description of the capability. */
  detail: string;
  /** Code-path proof-point (file or directory) so the claim is auditable. */
  proofFile?: string;
}

export interface DiGap {
  id: GapId;
  /** Short tab label, e.g. "Causal". */
  name: string;
  /** Full headline rendered inside the active tab body. */
  fullName: string;
  /** The unsolved category problem — stated without naming any vendor. */
  categoryProblem: string;
  /** A concrete, recognisable symptom of the gap. */
  whatFailureLooksLike: string;
  /** Research or internal anchor for credibility. */
  evidence: string;
  /** Narrative sentence describing how DI closes the gap. */
  diApproach: string;
  /** The shipped capabilities that compose the DI solution. */
  diCapabilities: DiCapability[];
  /** A measurable outcome this gap-closure moves. */
  outcomeLift: {
    label: string; // e.g. "Avg DQI lift over 6 months"
    value: string; // e.g. "+12–18 points"
    caption: string; // one-line why this number matters
  };
}

export const DI_GAPS: DiGap[] = [
  {
    id: 'causal',
    name: 'Causal',
    fullName: 'Causal reasoning, not correlation dressed up as insight',
    categoryProblem:
      'Every decision-intelligence platform runs on correlation. Dashboards show that A moves with B; recommendation engines rank by covariance; LLMs hallucinate explanations that sound causal and usually are not.',
    whatFailureLooksLike:
      'Your strategy office can name what happened, but not why. Counterfactual questions like "would this deal still have closed if we had removed the overconfidence paragraph?" get soft answers nobody can defend in front of the audit committee.',
    evidence:
      'Peer-reviewed studies find ~74% of LLM-generated decision explanations fail causal-faithfulness tests. Correlation-only tooling simply cannot answer "what if" questions about a strategic memo.',
    diApproach:
      'Decision Intel treats every strategic memo as a causal artefact. Structural causal models with do-calculus run over a per-org Decision Knowledge Graph, so every flag names a cause. Every counterfactual becomes a traceable intervention with a dollar-impact forecast.',
    diCapabilities: [
      {
        label: 'Decision Knowledge Graph',
        detail:
          'pgvector graph of memos, assumptions, biases, and outcomes with PageRank centrality + outcome-weighted edges.',
        proofFile: 'src/lib/graph/graph-builder.ts',
      },
      {
        label: 'Structural causal models',
        detail:
          'Per-org SCMs with do-calculus interventions. Every counterfactual produces a dollar-impact forecast, not a narrative.',
        proofFile: 'src/lib/causal/',
      },
      {
        label: '20×20 bias interaction matrix',
        detail:
          'Compound-risk scorer names the specific toxic pattern, not just the single bias, and maps it to a historical exemplar.',
        proofFile: 'src/lib/scoring/compound-engine.ts',
      },
      {
        label: 'Counterfactual replay',
        detail:
          'Re-run any past decision with a named bias removed and see the recalculated DQI, narrative, and outcome distribution.',
      },
    ],
    outcomeLift: {
      label: 'Root-cause explainability',
      value: '~74% → >95%',
      caption:
        'Faithful causal explanations on every flag, not hallucinated narratives that look like reasoning.',
    },
  },
  {
    id: 'execution',
    name: 'Close the loop',
    fullName: 'A loop that actually closes: insight, outcome, recalibration',
    categoryProblem:
      'Most decision-intelligence platforms surface recommendations and stop there. The outcome six months later never makes it back into the system that produced the recommendation, so nothing recalibrates and the tool never gets sharper.',
    whatFailureLooksLike:
      '"Insight without action." Teams run an audit, the committee nods, the decision is made, and the actual outcome lives in a separate CRM, a Drive folder, a Slack thread, or a partner\'s head. The system that recommended never learns whether it was right.',
    evidence:
      "Tetlock's 20-year Good Judgment Project showed forecasting skill is trainable only when judgments are scored against actual outcomes with a proper scoring rule. Without a closed loop, decision-support tools cannot sharpen, by construction.",
    diApproach:
      'Decision Intel closes the loop automatically. Outcomes are detected passively across Slack, Drive, and email; every confirmed outcome produces a Brier score against the original DQI; the per-org bias-confidence profile updates based on which flags your team confirmed or dismissed. After 12 months your calibration sits in the superforecaster band (~0.13 average Brier), not the motivated-amateur band where ungrounded LLM auditors drift.',
    diCapabilities: [
      {
        label: 'Passive outcome detection',
        detail:
          'Slack, Drive, and email listeners surface confirmed outcomes without asking anyone to update a field.',
        proofFile: 'src/lib/integrations/',
      },
      {
        label: 'Brier scoring on every outcome',
        detail:
          'Proper scoring rule: (predicted − actual)². Categorised into excellent (≤ 0.10), good (≤ 0.20), fair (≤ 0.35), poor (> 0.35). Tetlock-band thresholds; lower is better.',
        proofFile: 'src/lib/learning/brier-scoring.ts',
      },
      {
        label: 'Per-org bias-confidence profile',
        detail:
          'Confirmed and dismissed flags update a private confidence profile for your organisation; future audits upweight biases your team confirms as real and downweight ones they ship as false positives.',
        proofFile: 'src/lib/learning/outcome-scoring.ts',
      },
      {
        label: 'Toxic-combination learning',
        detail:
          'The flywheel learns which bias patterns actually failed at your org and flags them harder next time.',
        proofFile: 'src/lib/learning/toxic-combinations.ts',
      },
    ],
    outcomeLift: {
      label: 'DQI lift after 4 quarters',
      value: '+12–18 points',
      caption:
        'Measured lift on audits run after outcome-calibration versus the cold-start baseline. Compounds every quarter.',
    },
  },
  {
    id: 'governance',
    name: 'Governance',
    fullName: 'Regulator-grade governance that survives the audit committee',
    categoryProblem:
      'Black-box AI inside a high-stakes decision process fails audit committee review. Decision governance lags data governance by a decade. Few platforms produce regulator-grade defence documents for the flags they surface, and almost none cross-link those flags to the specific regulations they trigger.',
    whatFailureLooksLike:
      '"We can\'t use AI in board memos because our GC doesn\'t know how to defend it in an EU AI Act audit." Strategic decisions stall in limbo: the tool surfaces a flag, the GC asks which regulation it touches, and nobody can answer without a week of legal review.',
    evidence:
      'Every Fortune 500 procurement team vetoes a tool that cannot produce regulator-grade defence documents. The EU AI Act, SOX §404, and GDPR Article 22 each gate different customer categories, and all three are rising, not falling, as AI enters decision workflows.',
    diApproach:
      'Decision Intel delivers governance as product, not documentation. Every flag cross-links to a specific provision across 17 frameworks spanning G7, EU, GCC, and African markets. The Decision Provenance Record exports as a regulator-grade PDF on Pro tier, so a General Counsel can walk into a regulator meeting with the memo, the flags, and the framework citations in a single document.',
    diCapabilities: [
      {
        label: '17 regulatory framework mappers',
        detail:
          'International anchors (SOX §404, GDPR Art. 22, EU AI Act Annex III, Basel III, FCA Consumer Duty, SEC Reg D, LPOA) plus African-market regimes (NDPR, CBN, WAEMU, CMA Kenya, BoG, FRC Nigeria, CBE, PoPIA, SARB, BoT). Provision-level mapping across all 17.',
        proofFile: 'src/lib/compliance/frameworks/',
      },
      {
        label: 'Decision Provenance Record',
        detail:
          'One-click regulator-grade PDF. Every flag, every framework citation, every provision section, exportable in a single document.',
      },
      {
        label: 'Decision Defense timeline',
        detail:
          'Per-decision audit log with cryptographic hash. Reproducibility is a product surface, not a feature request.',
      },
      {
        label: 'Per-org compliance lens',
        detail:
          "Choose your regulatory scope (EU / US / UK / APAC); the pipeline upranks the frameworks you're actually gated by.",
      },
    ],
    outcomeLift: {
      label: 'Time to produce audit-ready defence',
      value: '5 days → 60 seconds',
      caption:
        'Decision Provenance Record exports in real time, replacing the weeks of legal review most teams run today.',
    },
  },
];

export const GAP_RATING_COLOR = {
  full: '#16A34A',
  partial: '#F59E0B',
  none: '#EF4444',
} as const;
