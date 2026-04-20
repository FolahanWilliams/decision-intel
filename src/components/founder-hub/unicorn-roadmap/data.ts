/**
 * Unicorn Roadmap — structured data layer.
 *
 * All content rendered by the tab lives here as typed constants so the
 * viz components stay presentational. Source: LLM Council founder
 * roadmap (2026-04-20) reconciled with CLAUDE.md positioning + Claude's
 * refined synthesis. Dates are absolute (pro memory rule).
 */

export type MilestoneTrack = 'founder' | 'business' | 'fundraising' | 'product';

export type Milestone = {
  id: string;
  quarter: string;
  date: string;
  track: MilestoneTrack;
  title: string;
  detail: string;
  status: 'locked' | 'in_progress' | 'next' | 'later';
};

export const TIMELINE: Milestone[] = [
  {
    id: 'q2-2026-authority',
    quarter: 'Q2 2026',
    date: '2026-06-30',
    track: 'founder',
    title: 'Authority anchor',
    detail:
      'LinkedIn repositioned as a publisher of decision-audit work, not a founder. 4 primary-source reconstructions published. Advisor endorsement live on pitch deck + site.',
    status: 'in_progress',
  },
  {
    id: 'q2-2026-demo',
    quarter: 'Q2 2026',
    date: '2026-06-30',
    track: 'product',
    title: '60-second demo locked',
    detail:
      'Upload → DQI → top-3 biases → counterfactual → share under 8s end-to-end. No feature drift; everything else stays in codebase.',
    status: 'in_progress',
  },
  {
    id: 'q2-2026-partners',
    quarter: 'Q2 2026',
    date: '2026-06-30',
    track: 'business',
    title: '2–3 design partners signed',
    detail:
      'Paid pilots via advisor intros at $5–15K for 90 days. CSOs at $1B+ companies with active steering-committee pain.',
    status: 'next',
  },
  {
    id: 'q3-2026-case',
    quarter: 'Q3 2026',
    date: '2026-09-30',
    track: 'business',
    title: 'First case study live',
    detail:
      '20+ audited real decisions across pilots. One anonymised case study with outcome data (time-to-approval, objections caught). Becomes the reference document.',
    status: 'later',
  },
  {
    id: 'q3-2026-cofounder',
    quarter: 'Q3 2026',
    date: '2026-09-30',
    track: 'founder',
    title: 'GTM co-founder closed',
    detail:
      'Equity partner (15–25%) with enterprise-sales scar tissue. Non-negotiable before seed raise.',
    status: 'later',
  },
  {
    id: 'q4-2026-preseed',
    quarter: 'Q4 2026',
    date: '2026-12-31',
    track: 'fundraising',
    title: 'Pre-seed closed ($500K–$2M)',
    detail:
      'Enterprise-infra micro-VCs + scouts. 3–5 case studies + $5–20K MRR. Margin math at honest 80–88% blended.',
    status: 'later',
  },
  {
    id: 'q4-2026-api',
    quarter: 'Q4 2026',
    date: '2026-12-31',
    track: 'product',
    title: 'Knowledge Graph API beta',
    detail:
      'REST endpoints for decisions, biases, outcomes. First Salesforce/HubSpot connector. Second revenue line.',
    status: 'later',
  },
  {
    id: 'q2-2027-seed',
    quarter: 'Q2 2027',
    date: '2027-06-30',
    track: 'fundraising',
    title: 'Seed round ($3–5M)',
    detail:
      '10+ paying customers. First VP Sales. International expansion budget (EU AI Act-aligned residency).',
    status: 'later',
  },
  {
    id: 'q4-2027-series-a',
    quarter: 'Q4 2027',
    date: '2027-12-31',
    track: 'fundraising',
    title: 'Series A ($10–20M)',
    detail:
      '$2–5M ARR. Category leadership (named in two analyst reports). Vertical expansion path locked (healthcare or financial services).',
    status: 'later',
  },
  {
    id: 'y2028-category',
    quarter: '2028–2030',
    date: '2030-12-31',
    track: 'business',
    title: 'Category infrastructure',
    detail:
      '500–2,000 customers. $50–500M ARR. Decision-audit becomes compliance checkbox for listed companies. Unicorn mark.',
    status: 'later',
  },
];

/* ─── Moats ─────────────────────────────────────────────────────────── */

export type Moat = {
  id: string;
  name: string;
  oneLiner: string;
  proofRequired: string;
  currentStrength: number; // 0–100
  targetStrength: number; // where we need to be by Q4 2026
  color: string;
};

export const MOATS: Moat[] = [
  {
    id: 'synthesis',
    name: 'Kahneman × Klein synthesis',
    oneLiner: 'The only pipeline combining debiasing with Recognition-Primed Decision — no competitor has this.',
    proofRequired:
      'Published whitepaper (framework name + taxonomy), 3 side-by-side historical audits where Kahneman-alone misses what the synthesis catches.',
    currentStrength: 40,
    targetStrength: 85,
    color: '#16A34A',
  },
  {
    id: 'graph',
    name: 'Decision Knowledge Graph',
    oneLiner:
      'Time-series causal graph of decisions + biases + outcomes that compounds per-org. Year 3 > Year 2 > Year 1.',
    proofRequired:
      'First org with 50+ audited decisions showing measurable calibration lift. API surface exposed for partner integrations.',
    currentStrength: 55,
    targetStrength: 75,
    color: '#0EA5E9',
  },
  {
    id: 'outcome-loop',
    name: 'Outcome-calibrated DQI',
    oneLiner:
      'Brier-scored feedback loop recalibrating bias taxonomy per org. Generic competitors stay generic.',
    proofRequired:
      '100+ closed outcome loops across pilots showing >15% calibration improvement vs baseline.',
    currentStrength: 35,
    targetStrength: 70,
    color: '#7C3AED',
  },
  {
    id: 'regulation',
    name: 'Regulatory tailwind',
    oneLiner:
      'EU AI Act Art. 14 + emerging SEC disclosure rules on AI governance create mandatory decision-audit demand by 2027–28.',
    proofRequired:
      'Filed comments on two regulations. Named in one policy brief or analyst report on decision-audit category.',
    currentStrength: 20,
    targetStrength: 60,
    color: '#F59E0B',
  },
];

/* ─── Sprint board (12 weeks) ──────────────────────────────────────── */

export type SprintTask = {
  id: string;
  week: number;
  lane: 'positioning' | 'product' | 'pipeline' | 'content' | 'founder';
  title: string;
  detail: string;
  effort: 'S' | 'M' | 'L';
};

export const SPRINTS: SprintTask[] = [
  // Weeks 1–2 · Positioning lock-in
  {
    id: 's1',
    week: 1,
    lane: 'positioning',
    title: 'Rewrite LinkedIn bio + hero one-liner',
    detail:
      'Drop "Building Decision Intel, pre-revenue". Replace with capability-led line anchored to Kahneman × Klein synthesis.',
    effort: 'S',
  },
  {
    id: 's2',
    week: 1,
    lane: 'founder',
    title: 'Email advisor for 5 CSO intros',
    detail:
      'Three personas: active-problem CSO, process-minded CFO/GC, scale-up COO. Send Section 4.2 of the playbook.',
    effort: 'S',
  },
  {
    id: 's3',
    week: 2,
    lane: 'positioning',
    title: 'Lock pitch-deck slide 2 (the moat slide)',
    detail:
      'Two-column synthesis viz. No competitor names on the slide — keep the no-rival claim factual, not defensive.',
    effort: 'M',
  },
  {
    id: 's4',
    week: 2,
    lane: 'content',
    title: 'Publish first primary-source reconstruction',
    detail:
      'Pick one S-1 (WeWork, Peloton, Casper) — run the real pipeline, publish the output with methodology footnote.',
    effort: 'L',
  },
  // Weeks 3–4 · Demo + intros
  {
    id: 's5',
    week: 3,
    lane: 'product',
    title: 'Time the 60-second demo end-to-end',
    detail:
      'Record 10 runs on 10 different memos. Median time must be <8s. Fix anything over.',
    effort: 'M',
  },
  {
    id: 's6',
    week: 3,
    lane: 'pipeline',
    title: 'Run first 2 intro calls',
    detail:
      'Script: advisor intro → 5-min demo → "does this resonate?" close. Debrief with advisor same day.',
    effort: 'M',
  },
  {
    id: 's7',
    week: 4,
    lane: 'pipeline',
    title: 'Send design-partner 1-pager to warm leads',
    detail:
      '$10K flat / 90 days / 20 audits / case-study commitment. One page. No legal prose.',
    effort: 'S',
  },
  {
    id: 's8',
    week: 4,
    lane: 'content',
    title: 'Second reconstruction + repost on X',
    detail:
      'Amplify off LinkedIn. X audience index is higher for VCs; LinkedIn higher for CSOs. Post both.',
    effort: 'M',
  },
  // Weeks 5–6 · First close
  {
    id: 's9',
    week: 5,
    lane: 'pipeline',
    title: 'Close Design Partner #1',
    detail:
      'Signed contract + first invoice. If no close, price-reduce to $5K or narrow scope to 1 division.',
    effort: 'L',
  },
  {
    id: 's10',
    week: 5,
    lane: 'product',
    title: 'Ship board-report PDF v2',
    detail:
      'Add Kahneman × Klein synthesis section. This is the artefact that makes the audit real to their board.',
    effort: 'M',
  },
  {
    id: 's11',
    week: 6,
    lane: 'founder',
    title: 'Film CSO-reaction video',
    detail:
      'Real CSO, their real memo, your audit, their face on seeing the output. 90 seconds. This closes your next 20 calls.',
    effort: 'M',
  },
  {
    id: 's12',
    week: 6,
    lane: 'content',
    title: 'Third reconstruction — failed case where synthesis matters',
    detail:
      'Pick one where Kahneman alone misses (RPD recognition would catch). Shows the moat, not just the product.',
    effort: 'L',
  },
  // Weeks 7–9 · Second partner + onboarding
  {
    id: 's13',
    week: 7,
    lane: 'pipeline',
    title: 'Onboard DP #1 — first 3 real audits',
    detail:
      'Live 30-min walk-through on audit #1. They run #2 + #3 solo. Any friction = product fix same week.',
    effort: 'L',
  },
  {
    id: 's14',
    week: 7,
    lane: 'founder',
    title: 'Draft GTM co-founder spec',
    detail:
      'Profile: 5–10y enterprise sales, 1 logo-led close at Series A. 15–25% equity range. Advisor network = sourcing.',
    effort: 'S',
  },
  {
    id: 's15',
    week: 8,
    lane: 'pipeline',
    title: 'Close Design Partner #2',
    detail:
      'Via referral from DP #1 or second-tier advisor intro. Lock by end of week 8.',
    effort: 'L',
  },
  {
    id: 's16',
    week: 9,
    lane: 'content',
    title: 'Publish DP #1 outcome teaser',
    detail:
      '"We audited 5 real decisions in 30 days. Here\'s what we learned." No logo yet. Seeds inbound.',
    effort: 'M',
  },
  // Weeks 10–12 · Case-study + pre-seed prep
  {
    id: 's17',
    week: 10,
    lane: 'pipeline',
    title: 'Case-study draft with DP #1',
    detail:
      'Quantified: #decisions audited, #objections caught before board, time-to-approval delta.',
    effort: 'L',
  },
  {
    id: 's18',
    week: 11,
    lane: 'founder',
    title: 'First GTM co-founder conversations',
    detail:
      '3–5 candidates from advisor + Series A operator networks. Coffee only — no pitch yet.',
    effort: 'L',
  },
  {
    id: 's19',
    week: 11,
    lane: 'product',
    title: 'Ship Knowledge Graph export',
    detail:
      'CSV + JSON of decisions/biases/outcomes per org. First enterprise buyer ask, usually.',
    effort: 'M',
  },
  {
    id: 's20',
    week: 12,
    lane: 'positioning',
    title: 'Lock pre-seed pitch deck',
    detail:
      '9 slides. Margin math at honest 80–88% (not 95%). Traction slide carries DP #1 + #2 outcomes.',
    effort: 'L',
  },
];

/* ─── Design partner funnel ────────────────────────────────────────── */

export type FunnelStage = {
  id: string;
  label: string;
  target: number;
  current: number;
  subtitle: string;
};

export const FUNNEL: FunnelStage[] = [
  { id: 'intros', label: 'Warm intros sourced', target: 10, current: 2, subtitle: 'From advisor + referrals' },
  { id: 'calls', label: 'Discovery calls booked', target: 7, current: 2, subtitle: '15–30 min, script-led' },
  { id: 'demos', label: '60-sec demos delivered', target: 5, current: 0, subtitle: 'With on-screen recording' },
  { id: 'pilots', label: 'Paid pilots signed', target: 3, current: 0, subtitle: '$5–25K / 90 days' },
  { id: 'refs', label: 'Public references', target: 2, current: 0, subtitle: 'Named logo + case study' },
];

/* ─── Authority tracker ─────────────────────────────────────────────── */

export type AuthoritySignal = {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  direction: 'up' | 'down';
  compounding: boolean;
};

export const AUTHORITY_SIGNALS: AuthoritySignal[] = [
  { id: 'posts', label: 'Primary-source reconstructions published', current: 0, target: 12, unit: 'posts', direction: 'up', compounding: true },
  { id: 'cso-calls', label: 'CSO / CFO / GC calls (this quarter)', current: 0, target: 15, unit: 'calls', direction: 'up', compounding: false },
  { id: 'advisor-intros', label: 'Warm intros from advisor network', current: 2, target: 10, unit: 'intros', direction: 'up', compounding: true },
  { id: 'inbound', label: 'Inbound inquiries from content', current: 0, target: 8, unit: 'inquiries', direction: 'up', compounding: true },
  { id: 'citations', label: 'Citations / mentions in industry media', current: 0, target: 3, unit: 'mentions', direction: 'up', compounding: true },
  { id: 'podcast', label: 'Podcast / conference appearances', current: 0, target: 4, unit: 'features', direction: 'up', compounding: true },
];

/* ─── Pitfall radar ────────────────────────────────────────────────── */

export type Pitfall = {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium';
  likelihood: 'likely' | 'possible' | 'watch';
  mitigation: string;
  tripwire: string;
};

export const PITFALLS: Pitfall[] = [
  {
    id: 'solo',
    name: 'Staying solo past month 6',
    severity: 'critical',
    likelihood: 'likely',
    mitigation: 'Start GTM co-founder sourcing week 7. Equity partner, 15–25%. Non-negotiable before seed.',
    tripwire: 'If no co-founder conversations booked by week 10, escalate to advisor weekly until solved.',
  },
  {
    id: 'feature-bloat',
    name: 'Building before closing',
    severity: 'critical',
    likelihood: 'likely',
    mitigation: 'Every new line of code must close a pilot in flight. Written rule: no new route / model / feature until DP #1 signs.',
    tripwire: 'If weekly PR count > 10 and DP #0 not signed, freeze repo for 2 weeks. Sell only.',
  },
  {
    id: 'age',
    name: 'Age anxiety bleeding into copy',
    severity: 'high',
    likelihood: 'possible',
    mitigation: 'Study actual Fortune 500 earnings-call transcripts, not marketing pages. Short, blunt, dollar-specific.',
    tripwire: 'If founder uses the word "procurement" or "defensible" in a customer call, that\'s the tell.',
  },
  {
    id: 'incumbents',
    name: 'Salesforce/Microsoft bolt-on',
    severity: 'high',
    likelihood: 'possible',
    mitigation: 'Outrun on depth: 5+ years of per-org Knowledge Graph data no incumbent can replicate from cold start.',
    tripwire: 'If Einstein or Copilot ships a "decision audit" feature, accelerate API partnership plays.',
  },
  {
    id: 'pricing',
    name: 'Pricing collapses in negotiation',
    severity: 'high',
    likelihood: 'possible',
    mitigation: 'Hold the line on $10K minimum pilot. Discount only via narrowed scope (1 division), never via price floor.',
    tripwire: 'Two pilots closed below $5K = pricing reset needed. Re-anchor before DP #3.',
  },
  {
    id: 'regulation',
    name: 'Regulatory window closes without capture',
    severity: 'medium',
    likelihood: 'watch',
    mitigation: 'File comments on EU AI Act Art. 14 implementing acts. Build policy-brief relationships in Q3 2026.',
    tripwire: 'If a competitor is quoted in an analyst report on decision-audit before you, that\'s the signal.',
  },
  {
    id: 'margin',
    name: 'Margin overclaim in VC DD',
    severity: 'medium',
    likelihood: 'likely',
    mitigation: 'Lead with honest 80–88% blended. Model unit economics per tier. Show margin improving with volume concentration.',
    tripwire: 'If a partner pushes on the math and founder stumbles, revise deck within 48h.',
  },
  {
    id: 'security',
    name: 'CSO security review blocks pilot',
    severity: 'medium',
    likelihood: 'possible',
    mitigation: 'SOC 2 Type II audit on the calendar by Q3 2026. 1-page security summary ready for any inbound ask.',
    tripwire: 'Two pilots stalled at security review = SOC 2 accelerate.',
  },
  {
    id: 'burn',
    name: 'Personal burnout / sleep debt',
    severity: 'high',
    likelihood: 'likely',
    mitigation: 'Hard stop at 11pm local. Sleep is a decision-quality input — the product is literally about this.',
    tripwire: 'Three nights under 6h in one week = mandatory rest day, no code, no calls.',
  },
  {
    id: 'peers',
    name: 'Isolation from peer network',
    severity: 'medium',
    likelihood: 'possible',
    mitigation: 'Join 1–2 young-founder cohorts (Z Fellows, Contrary, HF0). Two peer calls per week minimum.',
    tripwire: 'If a month passes without speaking to another 16–22-year-old technical founder, fix that week.',
  },
];

/* ─── Operating cadence ────────────────────────────────────────────── */

export type CadenceBlock = {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  slot: 'morning' | 'midday' | 'evening';
  duration: string;
  label: string;
  detail: string;
  category: 'sell' | 'build' | 'learn' | 'rest';
};

export const CADENCE: CadenceBlock[] = [
  { day: 'Mon', slot: 'morning', duration: '30m', label: 'Advisor call', detail: 'Week ahead + positioning review', category: 'sell' },
  { day: 'Mon', slot: 'midday', duration: '2h', label: 'Sales outreach', detail: 'Warm intros, follow-ups, DP comms', category: 'sell' },
  { day: 'Mon', slot: 'evening', duration: '30m', label: 'Read HBR / FT', detail: 'One CSO-relevant article, note one insight', category: 'learn' },
  { day: 'Tue', slot: 'morning', duration: '2h', label: 'Content creation', detail: 'Primary-source reconstruction, LinkedIn + X', category: 'sell' },
  { day: 'Tue', slot: 'midday', duration: '1h', label: 'Demo rehearsal', detail: 'Record 60s demo, review with advisor', category: 'sell' },
  { day: 'Tue', slot: 'evening', duration: '1h', label: 'Founder School', detail: 'Self-taught enterprise sales or cognitive-science lesson', category: 'learn' },
  { day: 'Wed', slot: 'morning', duration: '3h', label: 'Customer calls', detail: '2–3 intro or pilot calls, back-to-back', category: 'sell' },
  { day: 'Wed', slot: 'midday', duration: '1h', label: 'Debrief', detail: 'Insights to Positioning Memo, file product tickets', category: 'sell' },
  { day: 'Thu', slot: 'morning', duration: '3h', label: 'Product polish', detail: 'Only items gating pilots in flight', category: 'build' },
  { day: 'Thu', slot: 'evening', duration: '30m', label: 'Peer call', detail: 'Young-founder network check-in', category: 'learn' },
  { day: 'Fri', slot: 'morning', duration: '2h', label: 'Pipeline review', detail: 'Funnel math, intros, pitch-deck iteration', category: 'sell' },
  { day: 'Fri', slot: 'midday', duration: '2h', label: 'Deep work', detail: 'Kahneman × Klein paper draft OR deal desk', category: 'build' },
  { day: 'Sat', slot: 'morning', duration: '1h', label: 'Customer call', detail: 'DP onboarding or prospect discovery', category: 'sell' },
  { day: 'Sat', slot: 'evening', duration: '—', label: 'Hard stop', detail: 'No code, no Slack. Reset for week.', category: 'rest' },
  { day: 'Sun', slot: 'morning', duration: '1h', label: 'Week planning', detail: 'Sprint-board review, next-week sequencing', category: 'learn' },
  { day: 'Sun', slot: 'midday', duration: '—', label: 'Rest', detail: 'Sleep debt is decision-quality debt.', category: 'rest' },
];

/* ─── Fundraising readiness checklist ──────────────────────────────── */

export type ReadinessCheck = {
  id: string;
  area: 'traction' | 'product' | 'team' | 'story' | 'financials';
  label: string;
  required: string;
  done: boolean;
};

export const READINESS: ReadinessCheck[] = [
  { id: 'r1', area: 'traction', label: '2–5 design partners auditing real decisions', required: '10+ audits per partner', done: false },
  { id: 'r2', area: 'traction', label: 'First outcome data captured', required: '"We implemented X, board approved in one round"', done: false },
  { id: 'r3', area: 'traction', label: 'One published case study', required: 'Anonymised or with logo permission', done: false },
  { id: 'r4', area: 'traction', label: '$5–20K MRR', required: 'Pilots converted to subscription', done: false },
  { id: 'r5', area: 'financials', label: 'Margin math validated', required: '80–88% blended, documented per tier', done: false },
  { id: 'r6', area: 'product', label: '60-second demo flawless', required: '<8s end-to-end on 10 different memos', done: false },
  { id: 'r7', area: 'product', label: 'Knowledge Graph API beta', required: 'REST endpoints + one partner integration', done: false },
  { id: 'r8', area: 'story', label: '9-slide pitch deck locked', required: 'Vision/Moat/Proof/Market/Model/Traction/Team/Roadmap/Use', done: false },
  { id: 'r9', area: 'story', label: 'Kahneman × Klein whitepaper published', required: 'Framework named, taxonomy documented', done: false },
  { id: 'r10', area: 'team', label: 'GTM co-founder closed', required: '15–25% equity, enterprise-sales background', done: false },
  { id: 'r11', area: 'team', label: 'Advisor endorsement on record', required: 'Signed quote on deck + site', done: false },
  { id: 'r12', area: 'story', label: 'CSO-reaction video captured', required: '90-second clip of real buyer on real output', done: false },
];

/* ─── Competitive map ──────────────────────────────────────────────── */

export type Competitor = {
  id: string;
  name: string;
  x: number; // 0–100 — breadth (narrow tool → infrastructure)
  y: number; // 0–100 — depth (correlation only → causal reasoning)
  note: string;
  isUs?: boolean;
};

export const COMPETITORS: Competitor[] = [
  { id: 'us', name: 'Decision Intel', x: 72, y: 88, note: 'Reasoning infrastructure + causal synthesis', isUs: true },
  { id: 'cloverpop', name: 'Cloverpop', x: 25, y: 18, note: 'Decision management, not reasoning audit' },
  { id: 'palantir', name: 'Palantir Foundry', x: 92, y: 55, note: 'Data provenance, not reasoning provenance' },
  { id: 'ibm', name: 'IBM Watson', x: 65, y: 25, note: 'Correlation surfaces, no causal lens' },
  { id: 'anthropic', name: 'Anthropic / OpenAI', x: 45, y: 45, note: 'Generic reasoning — could enter in 12–18m' },
  { id: 'consultancies', name: 'McKinsey / BCG', x: 35, y: 70, note: 'Manual, non-repeatable, not infra' },
];

/* ─── Executive memo (the one-pager) ───────────────────────────────── */

export type MemoSection = {
  id: string;
  eyebrow: string;
  heading: string;
  body: string;
};

export const EXECUTIVE_MEMO: MemoSection[] = [
  {
    id: 'ceiling',
    eyebrow: 'Realistic ceiling',
    heading: '$1B by 2029–2030, if you execute.',
    body: 'Not because the product can\'t do it — because B2B enterprise GTM can\'t compress below that without a miracle logo. A bigger ceiling ($5–10B by 2032) exists if (1) regulation triggers mandatory decision audit, and (2) you extend beyond corporate strategy into clinical, litigation, and policy verticals.',
  },
  {
    id: 'moat',
    eyebrow: 'The real moat',
    heading: 'Kahneman × Klein is the asset. Everything else is product.',
    body: 'Every hour on the synthesis framework compounds. Publish it as a named paper, run historical audits where Kahneman-alone misses what synthesis catches, and the moat becomes defensible. This is slide 2 of every deck for the next 5 years.',
  },
  {
    id: 'month-one-thing',
    eyebrow: 'The one thing this month',
    heading: 'Capture a real CSO on video reacting to their own memo audited.',
    body: '90 seconds of footage. Not a demo, not a scripted testimonial — their memo, your output, their face on first viewing. That clip closes your next 20 calls. Everything else is noise until this exists.',
  },
  {
    id: 'ways-to-fail',
    eyebrow: 'How you fail',
    heading: 'Solo past month 6. Building before closing. Incumbent bolt-on.',
    body: 'The number-one killer of technical-founder companies: staying solo. Start GTM co-founder sourcing week 7. Every hour in the codebase before DP #1 signs is negative expected value. Salesforce and Microsoft can ship "decision audit" as a feature in 18 months — outrun them on depth, not breadth.',
  },
  {
    id: 'founder',
    eyebrow: 'What to change about yourself',
    heading: 'Overspend on polish. Build toys when you should sell. Isolate.',
    body: 'You rewrote the landing three times this session. CSOs will not notice beat 7 vs beat 8. Study earnings-call transcripts, not marketing pages — the vocabulary is shorter and dollar-specific. Find two 16–22-year-old technical-founder peers this month. Sleep 7h nightly; decision quality drops 40% below that and your product is literally about this.',
  },
  {
    id: 'where-council-wrong',
    eyebrow: 'Where the playbook is wrong',
    heading: 'Title yourself less. Drop "Palantir for Reasoning" from customer copy. Realistic DP #1 is week 16, not week 10.',
    body: '"Chief Decision Scientist" compounds the age problem. Remove yourself from the front and let the outputs speak. "Palantir for Reasoning" is politically radioactive to half your buyers — keep for VCs, cut from customer-facing. Margin claim at 90% dies in DD; lead with honest 80–88%. Advisor is filter + endorsement, not closer.',
  },
];
