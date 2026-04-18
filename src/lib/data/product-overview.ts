// Product Overview — content extracted from the legacy ProductOverviewTab
// so it can be driven visually. Preserves every hard-coded number, citation,
// and quote verbatim. Update here when product state changes.

export interface ProductMetric {
  value: string;
  label: string;
  sub: string;
  accent: string;
  icon: 'biases' | 'pipeline' | 'cases' | 'outcomes' | 'providers' | 'touchpoints';
}

export const HERO = {
  eyebrow: 'Positioning',
  headline: 'The Decision Performance OS for Corporate Strategy & M&A Teams',
  body: 'Audit every strategic decision for cognitive bias and decision noise. Protect business outcomes. AI-powered cognitive auditing purpose-built for corporate strategy and M&A teams.',
  pillars: [
    { label: 'Decision Knowledge Graph', detail: 'Every audit persists. Compounds quarter over quarter.' },
    { label: 'Predict CEO Questions', detail: '5 role-primed personas simulate the steering-committee grilling.' },
    { label: 'Audit the Reasoning', detail: '12-node pipeline. 30+ biases. Noise decomposition. Structured in 60 seconds.' },
    { label: 'Close the Outcome Loop', detail: 'DQI grade + Tetlock-calibrated tracking. Quarter after quarter.' },
  ],
};

export const PRODUCT_METRICS: ProductMetric[] = [
  { value: '20', label: 'Standard Biases', sub: '+ 11 investment-specific', accent: '#16A34A', icon: 'biases' },
  { value: '12', label: 'Pipeline Nodes', sub: '7-way parallel fan-out', accent: '#0EA5E9', icon: 'pipeline' },
  { value: '135', label: 'Case Studies', sub: 'failures + successes', accent: '#F59E0B', icon: 'cases' },
  { value: '3', label: 'Outcome Channels', sub: 'Autonomous detection', accent: '#8B5CF6', icon: 'outcomes' },
  { value: '2', label: 'AI Providers', sub: 'Gemini + Claude fallback', accent: '#EC4899', icon: 'providers' },
  { value: '6', label: 'Touchpoints', sub: 'Web, Slack, Drive, Email, Extension, API', accent: '#14B8A6', icon: 'touchpoints' },
];

export interface ProblemStatement {
  id: string;
  headline: string;
  detail: string;
  citation?: string;
  severity: 'critical' | 'high' | 'medium';
}

export const PROBLEM_STATEMENTS: ProblemStatement[] = [
  {
    id: 'undetected_bias',
    headline: 'High-stakes decisions are made on documents riddled with cognitive bias nobody detects.',
    detail: 'Executive teams ship strategic memos without any structured bias audit. Every blind spot becomes a board-meeting risk.',
    severity: 'critical',
  },
  {
    id: 'single_decision_cost',
    headline: 'A single bad strategic decision costs organizations millions in value destruction.',
    detail: 'One uncaught bias in a capital-allocation memo can compound into nine-figure write-downs.',
    severity: 'critical',
  },
  {
    id: 'anchoring',
    headline: 'Decision-makers anchored to initial assumptions hold failing initiatives 40% longer than optimal.',
    detail: 'Anchoring bias keeps teams glued to doomed strategies past the point where exit would preserve value.',
    severity: 'high',
  },
  {
    id: 'groupthink',
    headline: 'Time pressure triggers overconfidence and groupthink in 65% of major decisions.',
    detail: 'Under deadline, dissent collapses and teams rubber-stamp rather than stress-test.',
    citation: 'Malmendier & Tate, 2008',
    severity: 'high',
  },
  {
    id: 'confirmation_bias',
    headline: 'Confirmation bias in due diligence turns review into rubber-stamping.',
    detail: 'Peer review is polite. Polite review misses the bias that kills the deal.',
    severity: 'high',
  },
  {
    id: 'no_causal_track',
    headline: 'No organization can track which biases actually correlated with poor outcomes.',
    detail: 'Without the feedback loop, the same biases keep firing on the next quarter\'s memo.',
    severity: 'medium',
  },
];

export interface PersonaRow {
  id: string;
  persona: string;
  pain: string;
  deliverable: string;
  icon: 'strategy' | 'ma' | 'risk' | 'board' | 'exec';
}

export const PERSONA_ROWS: PersonaRow[] = [
  {
    id: 'strategy',
    persona: 'Strategy Leaders',
    pain: 'No systematic decision quality measurement.',
    deliverable: 'Document-level DQI scoring (0-100). Bias tracking across every strategic project.',
    icon: 'strategy',
  },
  {
    id: 'ma',
    persona: 'M&A / Decision Owners',
    pain: 'Memos anchored to initial assumptions.',
    deliverable: '20 cognitive biases detected with exact excerpts + coaching guidance.',
    icon: 'ma',
  },
  {
    id: 'risk',
    persona: 'Risk & Compliance',
    pain: 'Operational optimism in execution plans.',
    deliverable: 'Boardroom simulation with custom personas — Risk, Ops, Finance, Domain.',
    icon: 'risk',
  },
  {
    id: 'board',
    persona: 'Board / Stakeholders',
    pain: 'Reports cherry-pick metrics and frame selectively.',
    deliverable: 'Document analysis for survivorship bias, selective reporting, and framing.',
    icon: 'board',
  },
  {
    id: 'exec',
    persona: 'Executive Committees',
    pain: 'Groupthink silences genuine debate.',
    deliverable: 'Blind voting, noise measurement, dissent tracking.',
    icon: 'exec',
  },
];

export const ROI_NARRATIVE = {
  headline: 'ROI',
  body: 'A single avoided bad decision saves organizations **millions to billions** in value. The platform pays for itself after one corrected thesis. Organizations using systematic decision hygiene report **up to 60% reduction** in decision variance.',
  pricingAnchor: '$2,499/mo Strategy tier · ~97% gross margin · 1 avoided bad thesis > year of subscription',
};

export interface ShippedFeature {
  title: string;
  detail: string;
  category: 'integration' | 'pipeline' | 'ux' | 'intelligence' | 'distribution';
  monthShipped?: string;
}

export const SHIPPED_FEATURES: ShippedFeature[] = [
  {
    title: 'Email Forwarding Integration',
    detail: 'Unique email address per user (analyze+{token}@in.decision-intel.com). Forward documents or paste text, auto-analyzed with results emailed back.',
    category: 'integration',
  },
  {
    title: 'Google Drive Connector',
    detail: 'OAuth 2.0 integration. Watch folders for new documents, auto-analyze every 10 minutes. Folder picker UI in Settings.',
    category: 'integration',
  },
  {
    title: 'Slack Deep Thread Analysis',
    detail: '/di analyze in threads fetches all messages, runs full analysis, posts rich results back. Zero-friction.',
    category: 'integration',
  },
  {
    title: 'Forgotten Questions Node',
    detail: '12th pipeline node surfaces unknown-unknowns: questions the document should address but does not.',
    category: 'pipeline',
  },
  {
    title: 'Free 30-Day Pilot',
    detail: 'Full platform access on a live deal to seed the Knowledge Graph. Converts to Corp Dev subscription ($2,499/mo) at trial end.',
    category: 'distribution',
  },
  {
    title: 'Toxic Mitigation Playbooks',
    detail: 'Auto-generated research-backed debiasing steps for all 10 named patterns with owner, timing, and citations.',
    category: 'intelligence',
  },
  {
    title: 'Dollar Impact Estimation',
    detail: 'Connects toxic combos to deal ticketSize for financial risk estimates (ticketSize × historicalFailRate).',
    category: 'intelligence',
  },
  {
    title: 'Decision Alpha',
    detail: 'Public CEO bias analysis (Buffett, Musk, Huang, Zuckerberg) with DQI leaderboard.',
    category: 'distribution',
  },
  {
    title: 'Investor Defense Tab',
    detail: 'Competitive positioning vs. Cloverpop, moat layers, objection handling with technical proof points.',
    category: 'intelligence',
  },
  {
    title: 'Slack → Copilot Auto-Trigger',
    detail: 'Auto-creates CopilotSession seeded with decision context after every Slack audit. "Continue in Copilot" button for seamless handoff.',
    category: 'integration',
  },
  {
    title: 'Intelligence Brief on Empty States',
    detail: 'Contextual org intelligence (top dangerous biases, maturity grade, decision stats) replaces generic empty states across 4 dashboard pages.',
    category: 'ux',
  },
  {
    title: 'Enhanced Slack Commands',
    detail: '7 slash commands with rich Block Kit: /di help, /di score, /di brief, /di status, /di analyze (with Copilot link).',
    category: 'integration',
  },
  {
    title: 'Bias Heat Map Enhancement',
    detail: 'Density gutter minimap, confidence-based opacity, hover tooltips with excerpts, keyboard navigation (←→ cycle, H toggle).',
    category: 'ux',
  },
  {
    title: 'Enterprise Language Pivot',
    detail: 'Decision types renamed from PE/VC-specific to enterprise-neutral (resource allocation, strategic proposal, initiative closure).',
    category: 'distribution',
  },
  {
    title: 'Klein RPD Framework',
    detail: 'Expert intuition amplification: pattern recognition cues, narrative pre-mortems, RPD mental simulator, personal calibration dashboard.',
    category: 'intelligence',
  },
  {
    title: 'Enhanced Public Demo',
    detail: 'Streaming simulation UX with 3 sample docs, DQI badge, no login required at /demo.',
    category: 'distribution',
  },
  {
    title: 'Case Study Export',
    detail: 'One-click anonymized, branded shareable analyses with permanent links for stakeholder reporting.',
    category: 'distribution',
  },
  {
    title: 'Browser Extension',
    detail: 'Chrome extension with quick-score popup (<5s) and full analysis sidepanel.',
    category: 'integration',
  },
  {
    title: 'A/B Prompt Testing',
    detail: 'Experiment CRUD with Thompson sampling auto-optimization.',
    category: 'pipeline',
  },
  {
    title: 'Multi-Model Fallback',
    detail: 'Gemini → Claude failover routing.',
    category: 'pipeline',
  },
  {
    title: 'Quick Bias Check',
    detail: 'Dashboard modal for instant <5s bias scan via paste. Shared Gemini utility across extension + platform.',
    category: 'ux',
  },
  {
    title: 'Counterfactual Analysis API',
    detail: '"What-if" decision path computation with narrative explanations.',
    category: 'intelligence',
  },
];

export const FEATURE_CATEGORY_LABEL: Record<ShippedFeature['category'], string> = {
  integration: 'Integration',
  pipeline: 'Pipeline',
  ux: 'UX',
  intelligence: 'Intelligence',
  distribution: 'Distribution',
};

export const FEATURE_CATEGORY_COLOR: Record<ShippedFeature['category'], string> = {
  integration: '#0EA5E9',
  pipeline: '#16A34A',
  ux: '#EC4899',
  intelligence: '#8B5CF6',
  distribution: '#F59E0B',
};
