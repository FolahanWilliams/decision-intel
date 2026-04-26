/**
 * Founder School — per-lesson dynamic visualisations.
 *
 * Every lesson in lessons.ts gets a matching visualisation here so the Founder
 * School reads like the rest of the Founder Hub (positioning / research / sales
 * tabs) rather than a wall of prose. The LessonVisualization component renders
 * these configs into pure-SVG / CSS-grid diagrams that the founder can scan at
 * a glance.
 *
 * Ten archetypes are supported; each lesson picks the one that best fits the
 * concept being taught.
 */

export type LessonViz =
  | ChainViz
  | QuadrantsViz
  | FlywheelViz
  | WeightBarsViz
  | FunnelViz
  | SwimlanesViz
  | TimelineViz
  | PyramidViz
  | CompoundViz
  | RadialNetworkViz
  | StepperViz
  | MatrixViz;

export interface ChainViz {
  type: 'chain';
  caption?: string;
  steps: Array<{ label: string; detail?: string; emphasis?: boolean }>;
}

export interface QuadrantsViz {
  type: 'quadrants';
  caption?: string;
  axes: { x: [string, string]; y: [string, string] };
  /** 4 cells in reading order: TL, TR, BL, BR */
  cells: Array<{ label: string; detail?: string; tone?: 'good' | 'bad' | 'neutral' | 'warn' }>;
  highlight?: 0 | 1 | 2 | 3;
}

export interface FlywheelViz {
  type: 'flywheel';
  caption?: string;
  centerLabel: string;
  /** 3-6 nodes, rendered clockwise from top */
  nodes: Array<{ label: string; detail?: string }>;
}

export interface WeightBarsViz {
  type: 'weightBars';
  caption?: string;
  /** Values don't need to sum to 100 — they're rendered as horizontal bars */
  bars: Array<{ label: string; value: number; unit?: string; accent?: string; detail?: string }>;
}

export interface FunnelViz {
  type: 'funnel';
  caption?: string;
  stages: Array<{ label: string; value?: string; detail?: string }>;
}

export interface SwimlanesViz {
  type: 'swimlanes';
  caption?: string;
  left: { title: string; accent?: string; points: string[] };
  right: { title: string; accent?: string; points: string[] };
}

export interface TimelineViz {
  type: 'timeline';
  caption?: string;
  events: Array<{ when: string; label: string; detail?: string; emphasis?: boolean }>;
}

export interface PyramidViz {
  type: 'pyramid';
  caption?: string;
  /** Order: top → bottom. Top is narrowest. */
  tiers: Array<{ label: string; detail?: string }>;
}

export interface CompoundViz {
  type: 'compound';
  caption?: string;
  xLabel?: string;
  yLabel?: string;
  /** Points along the compounding curve, 4-8 entries */
  points: Array<{ t: number; v: number; note?: string }>;
}

export interface RadialNetworkViz {
  type: 'radialNetwork';
  caption?: string;
  center: string;
  /** 4-8 orbit nodes */
  nodes: Array<{ label: string; emphasis?: boolean; detail?: string }>;
  /** Optional extra edges between orbit nodes (by index pair) */
  edges?: Array<[number, number]>;
}

export interface StepperViz {
  type: 'stepper';
  caption?: string;
  orientation?: 'horizontal' | 'vertical';
  steps: Array<{ num: number; label: string; detail?: string; wow?: boolean }>;
}

export interface MatrixViz {
  type: 'matrix';
  caption?: string;
  rows: string[];
  cols: string[];
  /** heat: 0-3 (0 = empty cell, 3 = hottest) */
  cells: Array<{ row: number; col: number; label?: string; heat: 0 | 1 | 2 | 3 }>;
}

/** Map of lessonId → visualisation config. Filled by the sections below. */
export const LESSON_VIZ: Record<string, LessonViz> = {};

// ─── Enterprise Sales ────────────────────────────────────────────────────────

const VIZ_ENTERPRISE_SALES: Record<string, LessonViz> = {
  es_1: {
    type: 'chain',
    caption: 'The enterprise sale is an organisational-behaviour change, not a tool swap.',
    steps: [
      { label: 'Awareness', detail: 'CSO hears "decision auditing" for the first time.' },
      { label: 'Interest', detail: 'A memo goes badly — pain becomes nameable.' },
      { label: 'Champion forms', detail: 'VP Strategy owns the "we need rigour here" narrative.' },
      {
        label: 'Economic buyer approves',
        detail: 'CSO signs because DI de-risks the board cycle.',
        emphasis: true,
      },
      { label: 'New behaviour', detail: 'Every board-bound memo runs through DI pre-committee.' },
    ],
  },
  es_2: {
    type: 'radialNetwork',
    caption: 'Your champion is the internal narrator — not the user, not the buyer.',
    center: 'Champion\n(VP Strategy / Sr. M&A Analyst)',
    nodes: [
      {
        label: 'Economic buyer (CSO)',
        emphasis: true,
        detail: "Signs — needs champion's evidence.",
      },
      { label: 'End user (analyst)', detail: 'Runs the audits weekly.' },
      { label: 'Procurement', detail: 'Gates on SOC2 + MSA.' },
      { label: 'Legal', detail: 'Reviews data-handling.' },
      { label: 'IT / Security', detail: 'Gates on encryption + SSO.' },
      { label: 'Board audit committee', detail: 'Sees the DQI output downstream.' },
    ],
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
  },
  es_3: {
    type: 'swimlanes',
    caption: 'Champion loves you. Economic buyer signs. Never confuse the two.',
    left: {
      title: 'Champion (VP Strategy / Sr. Analyst)',
      accent: '#16A34A',
      points: [
        'Has felt the pain of a bad memo',
        'Wants rigour as their internal advantage',
        'Runs the weekly audits',
        'Builds the evidence pack',
        "Sells you internally in rooms you're not in",
      ],
    },
    right: {
      title: 'Economic buyer (CSO / COO)',
      accent: '#0F172A',
      points: [
        'Owns strategic-planning budget',
        'Has never used the tool',
        "Signs on champion's evidence",
        'Wants a defensible DQI trend for quarterly review',
        'Decides once per year; champion decides every week',
      ],
    },
  },
  es_4: {
    type: 'funnel',
    caption: 'A discovery call that closes is 80% questions about their pain.',
    stages: [
      {
        label: 'Opening',
        value: '2 min',
        detail: '"Tell me about the last memo that landed badly."',
      },
      { label: 'Pain discovery', value: '15 min', detail: 'Draw out specific failure stories.' },
      {
        label: 'Cost of inaction',
        value: '10 min',
        detail: 'What does the next one cost if it repeats?',
      },
      {
        label: 'Positioning mirror',
        value: '8 min',
        detail: 'Reflect DI language back to their pain.',
      },
      {
        label: 'The ask',
        value: '5 min',
        detail: 'Design partner — 6 months, $2K/mo, roadmap input.',
      },
    ],
  },
  es_5: {
    type: 'pyramid',
    caption: 'Your proposal is for the approval chain above your champion.',
    tiers: [
      { label: 'CSO / COO', detail: 'Risk + ROI + 6-month success criteria.' },
      { label: 'CFO', detail: 'Cost justification + budget line.' },
      { label: 'Legal + Procurement', detail: 'MSA, DPA, security questionnaire.' },
      { label: 'IT / Security', detail: 'SOC2 posture, encryption, data handling.' },
      { label: 'Your champion', detail: "The only reader you've actually met." },
    ],
  },
  es_6: {
    type: 'chain',
    caption: 'Procurement kills deals that arrive unprepared. Prepare before the pilot.',
    steps: [
      { label: 'Pre-call', detail: 'Draft MSA, DPA, security FAQ all ready.' },
      { label: 'Pilot agreement', detail: '6 months, $2K/mo, roadmap input.' },
      { label: 'Security review', detail: 'SOC2 posture + encryption docs.' },
      { label: 'Legal red-lines', detail: "Accept standard changes; flag the 3 you won't." },
      { label: 'Countersign', detail: 'Days, not months.', emphasis: true },
    ],
  },
  es_7: {
    type: 'quadrants',
    caption: 'Design partners pay. Free trials burn attention. Choose the right frame.',
    axes: { x: ['Low commitment', 'High commitment'], y: ['Low value', 'High value'] },
    cells: [
      { label: 'Free trial', detail: '0% conversion — attention cost is real.', tone: 'bad' },
      { label: 'Paid pilot', detail: 'Good, but no co-build framing.', tone: 'neutral' },
      { label: 'Case study only', detail: 'No commitment — no signal.', tone: 'bad' },
      {
        label: 'Design partner',
        detail: '$2K/mo · 6 sessions · roadmap input · case study.',
        tone: 'good',
      },
    ],
    highlight: 3,
  },
};

// ─── Fundraising ─────────────────────────────────────────────────────────────

const VIZ_FUNDRAISING: Record<string, LessonViz> = {
  fr_1: {
    type: 'pyramid',
    caption: 'At pre-seed, investors are buying the founder, not the product.',
    tiers: [
      {
        label: 'Founder insight',
        detail: '16 yrs old · built DI solo · understands cognitive bias at CSO depth.',
      },
      {
        label: 'Unfair advantage',
        detail: 'Wiz advisor (0 → $32B) — enterprise-GTM signal no peer can replicate.',
      },
      {
        label: 'Execution speed',
        detail: '12-node pipeline shipped · 200+ components · 70+ routes.',
      },
      {
        label: 'Real problem',
        detail: '$200M+ deals fail from bias · no competitor owns "decision quality".',
      },
      { label: 'Traction hook', detail: 'First design partner in flight; content flywheel live.' },
    ],
  },
  fr_2: {
    type: 'quadrants',
    caption: 'Three signals move pre-seed. Hit all three and the cheque arrives.',
    axes: { x: ['Replicable', 'Unfair'], y: ['Low signal', 'High signal'] },
    cells: [
      { label: 'Domain insight', detail: 'Earned, but MBAs claim it too.', tone: 'neutral' },
      { label: 'Wiz advisor', detail: '0→$32B enterprise GTM — not replicable.', tone: 'good' },
      { label: 'Execution speed', detail: 'Ship-rate is visible in GitHub.', tone: 'good' },
      { label: 'Age (16) + Nigeria', detail: 'Genuinely rare — lead with it.', tone: 'good' },
    ],
    highlight: 3,
  },
  fr_3: {
    type: 'stepper',
    caption: 'The four-sentence fundraising narrative.',
    orientation: 'vertical',
    steps: [
      {
        num: 1,
        label: 'Problem',
        detail:
          '$Bn strategic decisions made with cognitive processes riddled with bias — no software audits for this.',
      },
      {
        num: 2,
        label: 'Why now',
        detail:
          'LLMs can read a 40-page memo, flag bias, predict board objections at £0.30–0.50 per audit. New in 2024.',
      },
      {
        num: 3,
        label: 'Us',
        detail:
          '12-node LangGraph pipeline · 135-case library · per-org outcome-calibrated DQI. Category-creator position.',
      },
      {
        num: 4,
        label: 'Moat',
        detail:
          'Outcome loop compounds per customer. 12 months in = DQI specifically tuned to their decisions.',
        wow: true,
      },
    ],
  },
  fr_4: {
    type: 'weightBars',
    caption: 'Conservative Year-1 projection — believable > ambitious.',
    bars: [
      { label: '3 design partners × $2K', value: 72, unit: 'K ARR' },
      { label: '1 paid pilot × $8K', value: 96, unit: 'K ARR' },
      {
        label: 'Year-1 ending ARR',
        value: 36,
        unit: 'K',
        accent: '#16A34A',
        detail: 'Net of churn — the number you bring to investors.',
      },
      { label: 'COGS (API)', value: 3.6, unit: 'K', accent: '#EF4444' },
      { label: 'Gross margin (blended)', value: 90, unit: '%', accent: '#16A34A' },
    ],
  },
  fr_5: {
    type: 'funnel',
    caption: 'Run a tight process. 10 meetings in 2 weeks create perceived momentum.',
    stages: [
      {
        label: 'Target list',
        value: '15-20',
        detail: 'Africa/emerging · B2B SaaS pre-seed · AI infra.',
      },
      { label: 'Warm intros', value: '10-12', detail: 'Through Wiz advisor — 10× cold email.' },
      {
        label: 'First meetings',
        value: '8-10',
        detail: 'Cluster in 2 weeks — creates momentum narrative.',
      },
      { label: 'Second meetings', value: '4-6', detail: 'DD-lite — product demo + model.' },
      { label: 'Term sheets', value: '1-2', detail: 'Best one leads. Others fill.' },
    ],
  },
  fr_6: {
    type: 'weightBars',
    caption: 'Five terms that actually matter at pre-seed SAFE.',
    bars: [
      {
        label: 'Valuation cap',
        value: 5,
        unit: 'M post',
        accent: '#16A34A',
        detail: '$3-6M normal for Africa-based AI; higher with US signals.',
      },
      { label: 'Board seats', value: 0, unit: '', detail: 'Observer at most at pre-seed.' },
      { label: 'Pro-rata', value: 1, unit: 'only to exercisers' },
      { label: 'Info rights', value: 1, unit: 'quarterly ok' },
      { label: 'Instrument', value: 1, unit: 'SAFE > priced', accent: '#0EA5E9' },
    ],
  },
  fr_7: {
    type: 'chain',
    caption: 'Diligence should take days, not weeks. Prepare the folder first.',
    steps: [
      { label: 'GitHub repo', detail: 'Clear README, working demo, no stale branches.' },
      { label: 'Demo video', detail: '5 minutes — upload → score reveal → counterfactual.' },
      { label: 'Reference list', detail: 'Wiz advisor + any design-partner contacts.' },
      { label: 'Cap table', detail: 'Just you today — keep it clean.' },
      {
        label: 'Incorporation',
        detail: 'Delaware C-Corp holding above Nigeria OpCo.',
        emphasis: true,
      },
    ],
  },
};

// ─── Brand & Distribution ────────────────────────────────────────────────────

const VIZ_BRAND_DISTRIBUTION: Record<string, LessonViz> = {
  bd_1: {
    type: 'flywheel',
    caption: 'Distribution compounds. Start the flywheel 18 months before you need it.',
    centerLabel: 'Known by the CSO\nbefore the first call',
    nodes: [
      { label: 'Publish daily', detail: 'LinkedIn · case study · framework.' },
      { label: 'ICP follows', detail: '1 CSO at a time.' },
      { label: 'Inbound warm intros', detail: 'Champions surface themselves.' },
      { label: 'Design partner lands', detail: 'Case study written.' },
      { label: 'Case study republishes', detail: 'Next ICP finds you.' },
    ],
  },
  bd_2: {
    type: 'weightBars',
    caption: 'Trust = (Credibility + Reliability + Intimacy) / Self-Orientation.',
    bars: [
      {
        label: 'Credibility — you know the Kahneman lineage cold',
        value: 85,
        unit: '%',
        accent: '#16A34A',
      },
      { label: 'Reliability — you show up daily', value: 70, unit: '%', accent: '#16A34A' },
      {
        label: 'Intimacy — the 16-yr-old in Nigeria building DI',
        value: 90,
        unit: '%',
        accent: '#16A34A',
      },
      {
        label: 'Self-orientation — keep under this line',
        value: 20,
        unit: '% max',
        accent: '#EF4444',
        detail: 'Every "look what we built" post raises this. Kill on sight.',
      },
    ],
  },
  bd_3: {
    type: 'radialNetwork',
    caption: 'Own the mental category. Every post reinforces the same frame.',
    center: 'Decision Intel\n"decision quality"',
    nodes: [
      { label: 'Bias in corporate strategy', emphasis: true },
      { label: 'Noise in exec judgement' },
      { label: 'DQI — the score for decisions' },
      { label: 'Toxic combinations' },
      { label: 'Pre-mortem as hygiene' },
      { label: 'Outcome calibration' },
    ],
  },
  bd_4: {
    type: 'compound',
    caption: 'A framework post compounds for years. A trend post fades in 3 days.',
    xLabel: 'Months since published',
    yLabel: 'Cumulative reach',
    points: [
      { t: 0, v: 5, note: 'Framework post goes live' },
      { t: 1, v: 12 },
      { t: 3, v: 30, note: 'First CSO inbound' },
      { t: 6, v: 55 },
      { t: 12, v: 90, note: 'Still driving warm intros' },
      { t: 18, v: 120, note: 'Forwarded by 2 new CSOs' },
    ],
  },
  bd_5: {
    type: 'swimlanes',
    caption: 'Generic thought leadership entertains. Specific bias autopsies convert.',
    left: {
      title: 'Generic ("7 tips for…")',
      accent: '#94A3B8',
      points: [
        'Broad advice',
        'Skimmed, not saved',
        'Zero forward rate',
        'No ICP filter',
        'Compounds to nothing',
      ],
    },
    right: {
      title: 'Specific ("Boeing 737 MAX — the 3 biases that compounded")',
      accent: '#16A34A',
      points: [
        'Named company, named biases',
        'CSO recognises own pattern',
        'Forwarded to CEO',
        'Case study → warm intro',
        'Compounds for years',
      ],
    },
  },
  bd_6: {
    type: 'matrix',
    caption: 'Where your ICP actually spends attention.',
    rows: ['Reach', 'Trust', 'ICP density', 'Conversion'],
    cols: ['LinkedIn', 'Newsletter', 'Events', 'Twitter/X'],
    cells: [
      { row: 0, col: 0, heat: 3 },
      { row: 0, col: 1, heat: 1 },
      { row: 0, col: 2, heat: 1 },
      { row: 0, col: 3, heat: 2 },
      { row: 1, col: 0, heat: 2 },
      { row: 1, col: 1, heat: 3 },
      { row: 1, col: 2, heat: 3 },
      { row: 1, col: 3, heat: 0 },
      { row: 2, col: 0, heat: 3 },
      { row: 2, col: 1, heat: 3 },
      { row: 2, col: 2, heat: 3 },
      { row: 2, col: 3, heat: 0 },
      { row: 3, col: 0, heat: 2 },
      { row: 3, col: 1, heat: 3 },
      { row: 3, col: 2, heat: 3 },
      { row: 3, col: 3, heat: 0 },
    ],
  },
  bd_7: {
    type: 'stepper',
    caption: 'The three phases of the distribution flywheel.',
    orientation: 'horizontal',
    steps: [
      {
        num: 1,
        label: 'Now → first customer',
        detail: 'Daily post · 1,000 ICP-filtered LinkedIn followers.',
      },
      {
        num: 2,
        label: 'First customer → seed',
        detail: 'Case-study content · warm intros from your own audience.',
        wow: true,
      },
      {
        num: 3,
        label: 'Seed → Series A',
        detail: 'Speaking slots (ACG, Intralinks) · industry recognition.',
      },
    ],
  },
};

// ─── Unit Economics ──────────────────────────────────────────────────────────

const VIZ_UNIT_ECONOMICS: Record<string, LessonViz> = {
  ue_1: {
    type: 'weightBars',
    caption: 'Three numbers every investor checks in the first 10 minutes.',
    bars: [
      {
        label: 'Gross margin (blended)',
        value: 90,
        unit: '%',
        accent: '#16A34A',
        detail: 'Survives diligence. The 97% ghost-user figure does not.',
      },
      {
        label: 'Target ACV — Strategy tier',
        value: 30,
        unit: 'K/yr',
        accent: '#0EA5E9',
        detail: '$2,499/mo · fair-use 250 audits · team seats.',
      },
      { label: 'Days to first revenue', value: 90, unit: 'day target', accent: '#F59E0B' },
    ],
  },
  ue_2: {
    type: 'funnel',
    caption: 'CAC is calculable pre-revenue. Know it before investors ask.',
    stages: [
      { label: 'Hours of outreach / prospect', value: '10 hrs' },
      { label: 'Prospect → discovery', value: '20%' },
      { label: 'Discovery → pilot', value: '50%' },
      { label: 'Pilot → paid', value: '30%' },
      {
        label: 'Implied CAC',
        value: '~$10K',
        detail: 'Content-led channels cut this to near-zero.',
      },
    ],
  },
  ue_3: {
    type: 'compound',
    caption: 'LTV = ACV × gross margin × (1/churn). 10% churn → 10× multiplier.',
    xLabel: 'Years of retention',
    yLabel: 'Cumulative gross profit (per customer)',
    points: [
      { t: 1, v: 27, note: '$30K × 90% · Year 1' },
      { t: 2, v: 54 },
      { t: 3, v: 81 },
      { t: 5, v: 135, note: 'Base case crosses $100K' },
      { t: 7, v: 180 },
      { t: 10, v: 270, note: 'LTV at 10% churn' },
    ],
  },
  ue_4: {
    type: 'weightBars',
    caption: 'Payback period — the VC metric that governs growth capital.',
    bars: [
      { label: 'CAC', value: 10, unit: 'K', accent: '#EF4444' },
      {
        label: 'Monthly contribution ($2,499 × 90%)',
        value: 2.25,
        unit: 'K / mo',
        accent: '#16A34A',
      },
      {
        label: 'Payback period',
        value: 4.5,
        unit: 'months',
        accent: '#0EA5E9',
        detail: 'Sub-6 is elite. Justifies aggressive CAC spend at Series A.',
      },
    ],
  },
  ue_5: {
    type: 'quadrants',
    caption: 'Rule of 40 — growth rate + op margin ≥ 40.',
    axes: { x: ['Slow growth', 'Fast growth'], y: ['Low margin', 'High margin'] },
    cells: [
      { label: 'SaaS in trouble', detail: '<40 = kill or restructure.', tone: 'bad' },
      { label: 'Mature SaaS', detail: '30% growth · 40% margin = 70.', tone: 'neutral' },
      { label: 'Burn-rich growth', detail: '100% growth · -30% margin = 70.', tone: 'warn' },
      {
        label: 'Decision Intel @ $1M',
        detail: '100% growth · 40% margin = 140. Elite.',
        tone: 'good',
      },
    ],
    highlight: 3,
  },
  ue_6: {
    type: 'compound',
    caption: 'Runway rule: raise at 12 months remaining, never below 6.',
    xLabel: 'Months',
    yLabel: 'Cash remaining',
    points: [
      { t: 0, v: 100, note: 'Close of pre-seed' },
      { t: 6, v: 70 },
      { t: 12, v: 45, note: 'Start Seed process here' },
      { t: 18, v: 20, note: 'Danger zone — raising from weakness' },
      { t: 24, v: 5, note: 'Too late' },
    ],
  },
  ue_7: {
    type: 'stepper',
    caption: 'A believable 3-year model: drivers, not outputs.',
    orientation: 'vertical',
    steps: [
      {
        num: 1,
        label: 'New customers by channel',
        detail: 'Warm intro / content / cold — each with its own CAC.',
      },
      {
        num: 2,
        label: 'Churn by tier',
        detail: 'Annual %. Design partners > Individual > Strategy > Enterprise.',
      },
      {
        num: 3,
        label: 'ACV by tier',
        detail: 'Individual $3K · Strategy $30K · Enterprise $150K.',
      },
      {
        num: 4,
        label: 'COGS (Gemini API + infra)',
        detail: '£0.30-0.50/audit · 17 LLM calls each · factor flywheel costs.',
      },
      {
        num: 5,
        label: 'Gross profit → op margin',
        detail: 'Show all three scenarios — bull, base, bear.',
        wow: true,
      },
    ],
  },
};

// ─── Decision Quality ────────────────────────────────────────────────────────

const VIZ_DECISION_QUALITY: Record<string, LessonViz> = {
  dq_1: {
    type: 'radialNetwork',
    caption: 'The biases that hit founders hardest — the ones your product catches in others.',
    center: 'Founder\n(solo, conviction-heavy)',
    nodes: [
      {
        label: 'Confirmation bias',
        emphasis: true,
        detail: 'You seek validation, not disconfirmation.',
      },
      {
        label: 'Overconfidence',
        emphasis: true,
        detail: "Conviction is rewarded — until it isn't.",
      },
      {
        label: 'Sunk cost',
        emphasis: true,
        detail: '"We\'ve already built this" drives bad calls.',
      },
      { label: 'Availability', detail: 'Recent investor feedback skews your roadmap.' },
      { label: 'Anchoring', detail: 'First quote from a prospect becomes your ceiling.' },
      { label: 'Optimism bias', detail: 'Timelines always feel 2× shorter than they are.' },
    ],
  },
  dq_2: {
    type: 'timeline',
    caption: 'The pre-mortem: write the failure story before the decision.',
    events: [
      { when: 'T-0', label: 'Pre-decision', detail: 'Optimism is loud. Risks are invisible.' },
      {
        when: 'T+0',
        label: 'Imagine failure',
        detail: '"It\'s 12 months later and this decision failed. Why?"',
        emphasis: true,
      },
      { when: 'T+1', label: 'List causes', detail: 'Force the brain from defence → diagnosis.' },
      {
        when: 'T+2',
        label: 'Rank by plausibility',
        detail: 'Top 3 become your must-monitor list.',
      },
      { when: 'T+3', label: 'Decide', detail: 'Often: same decision, better guardrails.' },
    ],
  },
  dq_3: {
    type: 'weightBars',
    caption: 'Reference-class base rates you should actually know.',
    bars: [
      {
        label: 'Pre-seed close — time to term sheet',
        value: 4.5,
        unit: 'months median',
        accent: '#0EA5E9',
      },
      { label: 'Enterprise deal cycle', value: 12, unit: 'months median', accent: '#F59E0B' },
      { label: 'Pilot → paid conversion', value: 30, unit: '%' },
      { label: 'Year-1 SaaS GRR', value: 85, unit: '% baseline' },
      {
        label: 'Your instinct vs. reality',
        value: 150,
        unit: '% too optimistic',
        accent: '#EF4444',
      },
    ],
  },
  dq_4: {
    type: 'stepper',
    caption: 'Decision-journal template — one entry per significant call.',
    orientation: 'vertical',
    steps: [
      { num: 1, label: 'Decision', detail: 'What you chose.' },
      { num: 2, label: 'Context', detail: 'What you knew at the time.' },
      { num: 3, label: 'Options considered', detail: 'Including the ones you rejected.' },
      { num: 4, label: 'Why this one', detail: 'Your reasoning chain.' },
      {
        num: 5,
        label: 'What would prove me wrong',
        detail: "The disconfirmer you'd accept.",
        wow: true,
      },
    ],
  },
  dq_5: {
    type: 'quadrants',
    caption: 'Outcome quality = decision quality + luck. Never conflate them.',
    axes: { x: ['Bad decision', 'Good decision'], y: ['Bad outcome', 'Good outcome'] },
    cells: [
      {
        label: 'Deserved outcome',
        detail: "Good process · lucky result. Don't over-learn.",
        tone: 'neutral',
      },
      {
        label: 'Earned outcome',
        detail: 'Good process · good result. Repeat the process.',
        tone: 'good',
      },
      {
        label: 'Deserved failure',
        detail: 'Bad process · bad result. Fix the process.',
        tone: 'bad',
      },
      {
        label: 'Lucky escape',
        detail: 'Bad process · good result. Most dangerous cell.',
        tone: 'warn',
      },
    ],
  },
  dq_6: {
    type: 'matrix',
    caption: 'Match the rigour to the reversibility. Save cognition for Category 4.',
    rows: ['Low cost', 'High cost'],
    cols: ['Reversible', 'Irreversible'],
    cells: [
      { row: 0, col: 0, label: 'Just decide', heat: 0 },
      { row: 0, col: 1, label: 'Slow down · outside input', heat: 2 },
      { row: 1, col: 0, label: 'Decide carefully · review date', heat: 1 },
      { row: 1, col: 1, label: 'Full deliberation · pre-mortem', heat: 3 },
    ],
  },
  dq_7: {
    type: 'flywheel',
    caption: 'Quarterly 45-min audit of your own decisions.',
    centerLabel: 'Your bias profile\nover time',
    nodes: [
      { label: 'List 5 biggest decisions' },
      { label: 'Identify dominant bias each' },
      { label: "Note what you'd do differently" },
      { label: 'Pattern across all 5' },
      { label: 'One change for next quarter' },
    ],
  },
};

// ─── GTM Strategy ────────────────────────────────────────────────────────────

const VIZ_GTM_STRATEGY: Record<string, LessonViz> = {
  gtm_1: {
    type: 'pyramid',
    caption: 'Your ICP is narrower than you think. Cut until you can name 50 companies.',
    tiers: [
      { label: 'Buyer persona', detail: 'CSO / Head of Corporate Strategy. Secondary: M&A VP.' },
      { label: 'Revenue band', detail: '$500M+ · active strategic-review cadence.' },
      { label: 'Pain trigger', detail: '≥1 memo landed badly in last 24 months.' },
      { label: 'Geography', detail: 'US + UK first. EU second. Emerging last.' },
      { label: 'Decision surface', detail: '40-60 strategic recommendations / year.' },
    ],
  },
  gtm_2: {
    type: 'radialNetwork',
    caption: 'Beachhead: corporate strategy + M&A at $500M-$2B mid-market. Expand outward.',
    center: 'Beachhead\nCorp strategy + M&A\n$500M-$2B revenue',
    nodes: [
      {
        label: 'Large-cap strategy',
        emphasis: true,
        detail: 'Year 2 — once you have 5 mid-market references.',
      },
      { label: 'Strategy consultancies', detail: 'White-label DI as their audit tool.' },
      { label: 'BizOps / FP&A', detail: 'Tertiary — decision-support desks.' },
      { label: 'Sales forecasting', detail: 'Tertiary — forecast-quality audits.' },
      { label: 'PE-backed portcos', detail: 'Good bridge — high-frequency, real budget.' },
      {
        label: 'PE / VC funds',
        detail: 'Explicitly NOT target — small budgets, relationship-driven.',
      },
    ],
  },
  gtm_3: {
    type: 'funnel',
    caption: 'First 10 customers — almost never from cold outreach.',
    stages: [
      {
        label: 'Warm intros via Wiz advisor',
        value: '~4',
        detail: 'Highest-trust channel. Ask directly for 3 names.',
      },
      {
        label: 'LinkedIn inbound (ICP followers)',
        value: '~3',
        detail: 'Content flywheel. Starts after post #60.',
      },
      {
        label: 'Speaking in ICP communities',
        value: '~2',
        detail: 'ACG, Corporate Strategy Director forums.',
      },
      { label: '2nd-degree intros', value: '~1', detail: 'Former contacts in adjacent roles.' },
      {
        label: 'Cold outreach',
        value: '0-1',
        detail: 'Last resort — 10× conversion worse than warm.',
      },
    ],
  },
  gtm_4: {
    type: 'swimlanes',
    caption: 'PLG works for Slack. Not for a tool the board approves.',
    left: {
      title: 'PLG (Slack, Notion, Figma)',
      accent: '#94A3B8',
      points: [
        'User = buyer',
        'No contract required',
        'No security review',
        'No C-suite approval',
        'Usage-driven expansion',
      ],
    },
    right: {
      title: 'Decision Intel — enterprise by structure',
      accent: '#16A34A',
      points: [
        'Buyer (CSO) ≠ user (analyst)',
        'MSA + DPA required',
        'SOC2 + encryption gated',
        'Board audit committee sees output',
        'Expansion via team seats',
      ],
    },
  },
  gtm_5: {
    type: 'flywheel',
    caption: 'Your GTM motion — advisor-led + content inbound. No SDR, no CRM.',
    centerLabel: 'Design partner\nclosed',
    nodes: [
      { label: 'Content publishes daily', detail: 'Bias autopsies + framework posts.' },
      { label: 'ICP follows / subscribes', detail: 'CSO, Corp Strategy Dir, M&A VP.' },
      { label: 'Wiz advisor warm intro', detail: 'Highest-trust channel.' },
      { label: 'Discovery call', detail: '80% questions, 20% positioning.' },
      { label: 'Design-partner ask', detail: '6 months · $2K/mo · roadmap input.' },
    ],
  },
  gtm_6: {
    type: 'weightBars',
    caption: 'Price to value, not to cost. Founders systematically undercharge.',
    bars: [
      {
        label: 'Cost of one failed $200M acquisition',
        value: 40,
        unit: 'M destroyed',
        accent: '#EF4444',
      },
      { label: 'DI — Strategy tier (fair-use)', value: 30, unit: 'K / year', accent: '#16A34A' },
      { label: 'DI — Enterprise', value: 150, unit: 'K / year', accent: '#0EA5E9' },
      { label: 'Per-audit marginal cost (DI)', value: 0.5, unit: '£ / audit' },
      {
        label: 'Your price-to-value ratio',
        value: 0.075,
        unit: '% of risk',
        detail: 'At 0.075%, the price conversation is easy.',
      },
    ],
  },
  gtm_7: {
    type: 'stepper',
    caption: 'The design-partner pitch — co-build, not sell.',
    orientation: 'vertical',
    steps: [
      {
        num: 1,
        label: 'Exclusivity frame',
        detail: '"5 companies shaping the future of strategic decision quality."',
      },
      {
        num: 2,
        label: 'What they get',
        detail: 'Unlimited audits · weekly sessions with founder · guaranteed roadmap input.',
      },
      {
        num: 3,
        label: 'What they give',
        detail: '$2K/mo · 6-month commitment · case-study consent.',
      },
      {
        num: 4,
        label: 'Why it works',
        detail:
          'Exclusivity signals value · co-build makes them builders · $2K is sub-procurement.',
      },
      {
        num: 5,
        label: 'Close',
        detail: '"You in?" — the ask comes naturally, not as a close.',
        wow: true,
      },
    ],
  },
};

// ─── Leadership ──────────────────────────────────────────────────────────────

const VIZ_LEADERSHIP: Record<string, LessonViz> = {
  ldr_1: {
    type: 'stepper',
    caption: "Monthly advisor update — drip value, don't batch asks.",
    orientation: 'vertical',
    steps: [
      { num: 1, label: 'Progress (2 sentences)', detail: 'What shipped since last call.' },
      { num: 2, label: 'Biggest blocker (1 sentence)', detail: 'Specific enough to act on.' },
      {
        num: 3,
        label: '2-3 decisions you want their take on',
        detail: 'Draw on their Wiz pattern-matching.',
      },
      {
        num: 4,
        label: 'One ask',
        detail: 'Intro · intro · intro. Their network is the lever.',
        wow: true,
      },
      { num: 5, label: 'Report back next month', detail: 'Show their input mattered.' },
    ],
  },
  ldr_2: {
    type: 'quadrants',
    caption: 'Culture = observable behaviours, not aspirational values.',
    axes: { x: ['Aspirational', 'Observable'], y: ['Low specificity', 'High specificity'] },
    cells: [
      { label: '"We value excellence"', detail: 'Means nothing. Kill on sight.', tone: 'bad' },
      { label: '"We ship, then test"', detail: 'Specific + observable. Real.', tone: 'good' },
      { label: '"We move fast"', detail: 'Aspirational + vague. Avoid.', tone: 'warn' },
      { label: '"We disagree in writing"', detail: 'Observable + specific. Keep.', tone: 'good' },
    ],
    highlight: 3,
  },
  ldr_3: {
    type: 'funnel',
    caption: 'First hire — whoever makes you 10× more effective, not 10% better.',
    stages: [
      {
        label: 'Only you can do it',
        detail: 'Investor relationships · strategic vision · design-partner calls.',
      },
      { label: 'You + Claude', detail: 'Architecture · content · outreach drafts.' },
      { label: 'Automatable today', detail: 'Builds · deploys · reminders.' },
      {
        label: 'First-hire gap',
        detail: 'Enterprise-sales motion specialist — owns DP pipeline while you build.',
      },
    ],
  },
  ldr_4: {
    type: 'flywheel',
    caption: 'The 20-person company of one. Minimise "only me" bucket.',
    centerLabel: 'Founder\nleverage ratio',
    nodes: [
      { label: 'Claude → implementation' },
      { label: 'Automation → ops' },
      { label: 'Advisor → strategy' },
      { label: 'Content → brand' },
      { label: 'Only you → vision + relationships' },
    ],
  },
  ldr_5: {
    type: 'weightBars',
    caption: 'Founder psychology — tools that work in bad weeks.',
    bars: [
      {
        label: 'Separate decision quality from outcome quality',
        value: 90,
        unit: '% leverage',
        accent: '#16A34A',
      },
      { label: 'Weekly review — 3 wins · 1 loss · 1 different', value: 75, unit: '%' },
      { label: '10-year test — will this matter in a decade?', value: 80, unit: '%' },
      { label: 'Physical reset — the loop is rarely fixed by more thinking', value: 70, unit: '%' },
      {
        label: 'Emotional regulation at 16 compounds for 40 years',
        value: 100,
        unit: '% moat',
        accent: '#0EA5E9',
      },
    ],
  },
  ldr_6: {
    type: 'matrix',
    caption: "Stakeholders have different currencies. Don't cross-pay.",
    rows: ['Investors', 'Advisors', 'Design partners'],
    cols: ['Momentum', 'Specifics', 'Exclusivity', 'Roadmap visibility'],
    cells: [
      { row: 0, col: 0, heat: 3, label: 'Need' },
      { row: 0, col: 1, heat: 2 },
      { row: 0, col: 2, heat: 0 },
      { row: 0, col: 3, heat: 1 },
      { row: 1, col: 0, heat: 1 },
      { row: 1, col: 1, heat: 3, label: 'Need' },
      { row: 1, col: 2, heat: 1 },
      { row: 1, col: 3, heat: 1 },
      { row: 2, col: 0, heat: 1 },
      { row: 2, col: 1, heat: 2 },
      { row: 2, col: 2, heat: 3, label: 'Need' },
      { row: 2, col: 3, heat: 3, label: 'Need' },
    ],
  },
  ldr_7: {
    type: 'compound',
    caption: 'Learning velocity at 16 compounds for 40 years. Systematise it.',
    xLabel: 'Years from today',
    yLabel: 'Relative knowledge compounding',
    points: [
      { t: 0, v: 10 },
      { t: 2, v: 25, note: 'First-raise fluency' },
      { t: 5, v: 55, note: 'Category-creator in "decision quality"' },
      { t: 10, v: 120, note: 'Advisor to other founders' },
      { t: 20, v: 280 },
      { t: 40, v: 650, note: 'Your unfair asset by decade-3' },
    ],
  },
};

// ─── Platform Foundations (Company Bible) ────────────────────────────────────

const VIZ_PLATFORM_FOUNDATIONS: Record<string, LessonViz> = {
  pf_1: {
    type: 'timeline',
    caption: 'The Heuristics & Biases research lineage — 1974 → DI taxonomy.',
    events: [
      {
        when: '1974',
        label: 'Tversky & Kahneman',
        detail: '"Judgment under Uncertainty" — Science. Founding paper.',
        emphasis: true,
      },
      {
        when: '1982',
        label: 'Kahneman, Slovic, Tversky',
        detail: 'Academic canon collection — Cambridge UP.',
      },
      { when: '2002', label: 'Kahneman wins Nobel', detail: 'Prospect Theory enters economics.' },
      {
        when: '2005',
        label: 'Malmendier & Tate',
        detail:
          '"CEO Overconfidence and Corporate Investment" — applies bias research to public-company CEOs.',
      },
      {
        when: '2011',
        label: 'Thinking, Fast and Slow',
        detail: 'Layperson synthesis. System 1 / System 2.',
      },
      {
        when: '2026',
        label: 'Decision Intel taxonomy',
        detail: 'DI-B-001 → DI-B-020 + 30+ scope. Published at /taxonomy.',
        emphasis: true,
      },
    ],
  },
  pf_2: {
    type: 'swimlanes',
    caption: 'Bias is the average error. Noise is the variance. We measure both.',
    left: {
      title: 'Bias (everyone else)',
      accent: '#94A3B8',
      points: [
        'Average error',
        'Single-judge detection',
        'Cloverpop, McKinsey, ChatGPT',
        'Well-catalogued since 1974',
        'Commoditising fast',
      ],
    },
    right: {
      title: 'Noise (only DI measures)',
      accent: '#16A34A',
      points: [
        'Cross-judge variance',
        '3 independent LLM judges',
        'Std-dev across verdicts',
        'Kahneman 2021 canonical',
        'Architecturally defensible moat',
      ],
    },
  },
  pf_3: {
    type: 'weightBars',
    caption: 'DQI — the six components and their locked weights (GRADE_THRESHOLDS in dqi.ts).',
    bars: [
      {
        label: 'Bias profile',
        value: 28,
        unit: '%',
        accent: '#EF4444',
        detail: 'Kahneman-Sibony: largest error source.',
      },
      {
        label: 'Noise',
        value: 18,
        unit: '%',
        accent: '#F59E0B',
        detail: 'Kahneman 2021 — same weight class as bias.',
      },
      {
        label: 'Logical coherence',
        value: 18,
        unit: '%',
        accent: '#0EA5E9',
        detail: 'Howard-Matheson argument-validity.',
      },
      { label: 'Evidence grounding', value: 13, unit: '%', accent: '#0EA5E9' },
      {
        label: 'Pre-mortem robustness',
        value: 13,
        unit: '%',
        accent: '#16A34A',
        detail: 'Klein 2007 — failure-mode coverage.',
      },
      {
        label: 'Stakeholder coverage',
        value: 10,
        unit: '%',
        accent: '#16A34A',
        detail: 'Mercier-Sperber argumentative theory.',
      },
    ],
  },
  pf_4: {
    type: 'stepper',
    caption: 'Pre-mortem + Red Team — operationalised adversarial cognition.',
    orientation: 'vertical',
    steps: [
      {
        num: 1,
        label: 'Klein (2007) — pre-mortem',
        detail: '"Imagine it failed. Write why." Prospective-hindsight shift.',
      },
      {
        num: 2,
        label: 'Mitchell et al (1989)',
        detail: 'Research behind why prospective hindsight works.',
      },
      {
        num: 3,
        label: 'Mercier & Sperber (2017)',
        detail: 'Reasoning evolved for argumentation — red teams beat solo thinking.',
      },
      { num: 4, label: 'DI pre-mortem node', detail: 'Generates failure scenarios on every memo.' },
      {
        num: 5,
        label: 'DI Red Team node',
        detail:
          'Synthesises single most-damaging objection against weakest load-bearing assumption.',
        wow: true,
      },
    ],
  },
  pf_5: {
    type: 'flywheel',
    caption: "The outcome loop — Tetlock's calibration research applied to corporate strategy.",
    centerLabel: 'Per-org\ncalibrated DQI',
    nodes: [
      { label: 'Memo audited — DQI assigned' },
      { label: 'Decision made' },
      { label: 'Customer reports outcome' },
      { label: 'Brier score — predicted vs actual' },
      { label: 'Bayesian update — per-org weights shift' },
      { label: 'Next memo scored sharper' },
    ],
  },
  pf_6: {
    type: 'matrix',
    caption: '20×20 bias-interaction matrix — why combinations are multiplicatively worse.',
    rows: ['Confirmation', 'Overconfidence', 'Sunk cost', 'Anchoring'],
    cols: ['Confirmation', 'Overconfidence', 'Sunk cost', 'Anchoring'],
    cells: [
      { row: 0, col: 0, heat: 0 },
      { row: 0, col: 1, heat: 3, label: 'Kodak 2012' },
      { row: 0, col: 2, heat: 2, label: 'Blockbuster' },
      { row: 0, col: 3, heat: 1 },
      { row: 1, col: 0, heat: 3 },
      { row: 1, col: 1, heat: 0 },
      { row: 1, col: 2, heat: 2, label: 'Nokia' },
      { row: 1, col: 3, heat: 1 },
      { row: 2, col: 0, heat: 2 },
      { row: 2, col: 1, heat: 2 },
      { row: 2, col: 2, heat: 0 },
      { row: 2, col: 3, heat: 1 },
      { row: 3, col: 0, heat: 1 },
      { row: 3, col: 1, heat: 1 },
      { row: 3, col: 2, heat: 1 },
      { row: 3, col: 3, heat: 0 },
    ],
  },
  pf_7: {
    type: 'chain',
    caption: "The 12-node LangGraph pipeline — why this isn't a ChatGPT wrapper.",
    steps: [
      { label: 'GDPR anonymiser', detail: 'Strips PII before any external call.' },
      { label: 'Structurer', detail: 'Parses memo into sections.' },
      { label: 'Intelligence gatherer', detail: 'Pulls external context.' },
      { label: 'Bias detector', detail: 'Flags 30+ taxonomy matches.' },
      { label: '3-judge noise', detail: 'Parallel noise measurement.', emphasis: true },
      { label: 'Logical coherence', detail: 'Argument-validity check.' },
      { label: 'Pre-mortem', detail: 'Generates failure scenarios.' },
      { label: 'Red Team', detail: 'Strongest adversarial objection.', emphasis: true },
      { label: 'Fact-check', detail: 'Quantitative-claim verification.' },
      { label: 'Compliance mapper', detail: 'Cross-links 17 frameworks (G7 + EU + GCC + African).' },
      { label: 'Compound-risk scorer', detail: 'Applies 20×20 matrix.' },
      { label: 'Verdict synthesiser', detail: 'DQI + exec summary.', emphasis: true },
    ],
  },
  pf_8: {
    type: 'radialNetwork',
    caption:
      '17 regulatory frameworks across G7 / EU / GCC / African markets — each gates a category of customer or removes a procurement objection. The Pan-African coverage is the moat layer no US-incumbent has.',
    center: 'DI flags\n(every one carries a citation across 17 frameworks)',
    nodes: [
      {
        label: 'EU AI Act · Art 14',
        emphasis: true,
        detail: 'Aug 2026 enforcement. Record-keeping + human oversight on high-risk systems.',
      },
      {
        label: 'SOC 2 Type II',
        emphasis: true,
        detail: 'Trust services criteria. Procurement gate on every regulated buyer.',
      },
      {
        label: 'GDPR Art 22',
        emphasis: true,
        detail: 'EU automated-decision rights. Live since 2018.',
      },
      { label: 'SOX §404', detail: 'Public-company materiality. CFO approval gate.' },
      { label: 'Basel III Pillar 2', detail: 'Bank ICAAP qualitative-decision documentation.' },
      { label: 'NIST AI RMF', detail: 'US federal anchor. Govern / Map / Measure / Manage.' },
      { label: 'SEC AI Disclosure', detail: 'Proposed 2024, evolving 2026.' },
      { label: 'UK AI White Paper', detail: 'FCA / ICO / CMA principles-based regime.' },
      {
        label: 'NDPR (Nigeria)',
        emphasis: true,
        detail: 'Pan-African anchor. Nigeria Data Protection Regulation.',
      },
      { label: 'CBN (Nigeria)', detail: 'Central Bank risk-governance recordkeeping.' },
      { label: 'WAEMU', detail: 'West African Economic and Monetary Union banking framework.' },
      {
        label: 'PoPIA §71 (SA)',
        emphasis: true,
        detail: 'South Africa automated-decision rights — parallel to GDPR Art 22.',
      },
      { label: 'CMA Kenya', detail: 'Capital Markets Authority — Kenyan regulated entities.' },
      { label: 'BoG / CBE / SARB', detail: 'Central banks Ghana / Egypt / South Africa.' },
      { label: 'BoT FinTech', detail: 'Bank of Tanzania FinTech sandbox + supervisory regime.' },
    ],
  },
  pf_9: {
    type: 'pyramid',
    caption: 'The 135-case library — why this is a training prior, not marketing.',
    tiers: [
      {
        label: 'Cross-decision intelligence',
        detail: '"Your memo matches 12 historical cases; 9 of 12 produced negative outcomes."',
      },
      { label: 'Bias Genome', detail: 'Failure-lift leaderboard computed from the library.' },
      {
        label: '135 Tier-2 cases',
        detail: 'Each with pre-decision memo, biases, red flags, counter-exemplars.',
      },
      {
        label: 'Pattern families (Finkelstein)',
        detail: 'Kodak-pattern, Blockbuster-pattern, Nortel-pattern.',
      },
      { label: 'Primary-source citations', detail: 'Every case hand-verified. Not LLM-generated.' },
    ],
  },
};

Object.assign(
  LESSON_VIZ,
  VIZ_ENTERPRISE_SALES,
  VIZ_FUNDRAISING,
  VIZ_BRAND_DISTRIBUTION,
  VIZ_UNIT_ECONOMICS,
  VIZ_DECISION_QUALITY,
  VIZ_GTM_STRATEGY,
  VIZ_LEADERSHIP,
  VIZ_PLATFORM_FOUNDATIONS
);

export function getLessonViz(lessonId: string): LessonViz | null {
  return LESSON_VIZ[lessonId] ?? null;
}
