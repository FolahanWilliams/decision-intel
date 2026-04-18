// 12-month forecast for Decision Intel: Bootstrap lane vs VC lane.
// Quarters are fixed to Folahan's actual calendar starting April 2026.
// Every milestone, risk, and criterion is grounded in the current founder
// context (90% blended margin, pre-revenue, 50 LinkedIn CSOs, solo, 16 y/o).

export type MilestoneLane = 'bootstrap' | 'vc';
export type Confidence = 'high' | 'medium' | 'low';

export interface Milestone {
  id: string;
  lane: MilestoneLane;
  quarter: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  monthRange: string;
  requirements: string[];
  risks: string[];
  criteria: string[];
  confidence: Confidence;
  metricTarget: string;
}

export interface DecisionObjective {
  id: string;
  label: string;
  description: string;
  winner: MilestoneLane | 'tie';
  rationale: string;
}

export interface SequencingPhase {
  phase: string;
  window: string;
  recommendation: string;
  gate: string;
}

export const QUARTER_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Q1 · Apr–Jun 2026',
  2: 'Q2 · Jul–Sep 2026',
  3: 'Q3 · Oct–Dec 2026',
  4: 'Q4 · Jan–Mar 2027',
};

export const LANE_META: Record<
  MilestoneLane,
  { label: string; tagline: string; color: string; bgColor: string }
> = {
  bootstrap: {
    label: 'Bootstrap',
    tagline: 'Revenue-funded, solo, retain optionality',
    color: '#16A34A',
    bgColor: 'rgba(22, 163, 74, 0.12)',
  },
  vc: {
    label: 'VC / Accelerator',
    tagline: 'YC + operator angels, network as the unlock',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.12)',
  },
};

export const BOOTSTRAP_MILESTONES: Milestone[] = [
  {
    id: 'bs-q1',
    lane: 'bootstrap',
    quarter: 1,
    title: '3 discovery calls logged',
    subtitle: "Convert 50 LinkedIn CSOs into 3 live 30-min calls using Goldner's 4 questions.",
    monthRange: 'Apr–Jun 2026',
    metricTarget: '3 calls · ≥1 pattern confirmed 3× independently',
    requirements: [
      'Send 10–15 outbound messages per week using Templates #1 (warm intro) and #2 (cold CSO)',
      'Target 20%+ response rate on warm intros; iterate message if below 15% by week 3',
      'Log each call in the Discovery Call Companion; tag patterns A/B/C/D live during the call',
      'Complete 3 calls by June 30, 2026',
    ],
    risks: [
      'Zero response → ICP or messaging is wrong. Diagnose before increasing volume.',
      'Calls happen but no pattern convergence → the pain you imagine may not generalize.',
      'Founder pulled into product tweaks instead of outreach (the classic procrastination trap).',
    ],
    criteria: [
      'At least one pain pattern confirmed by 3+ independent CSOs',
      'At least one CSO asks about a pilot unprompted',
      'Response rate ≥ 20% on warm intros, ≥ 5% on cold',
    ],
    confidence: 'high',
  },
  {
    id: 'bs-q2',
    lane: 'bootstrap',
    quarter: 2,
    title: '2–3 design partners signed',
    subtitle: 'Signed LOI paper + quotable pain. Free or $1,500/mo — what matters is commitment.',
    monthRange: 'Jul–Sep 2026',
    metricTarget: '3 LOIs signed · 1 at paid tier',
    requirements: [
      'Convert 1-in-5 discovery calls into a pilot offer',
      'Use the Design Partner LOI from Deal-Closer Docs (fair-use clause included)',
      '6-week structured POC with weekly check-ins per POC Playbook',
      'Collect NPS, conversion signal, and one testimonial per partner',
    ],
    risks: [
      'Pilots stall at week 3–4 from stakeholder unavailability (summer + exec travel)',
      'POC reveals ICP mismatch — a CSO may not actually own the pain you expect them to',
      'Free pilots rarely convert — buyer extracts value without signing commitment',
    ],
    criteria: [
      '3 signed LOIs, ideally with at least one at the paid tier ($1,500/mo)',
      'At least one pattern validated at 3+ confirmations in Pattern Dashboard',
      'One public-ready testimonial quote for outbound',
    ],
    confidence: 'medium',
  },
  {
    id: 'bs-q3',
    lane: 'bootstrap',
    quarter: 3,
    title: 'First paying customer — $2,499/mo',
    subtitle: 'One LOI converts to Strategy tier. Revenue line opens. Case study drafted.',
    monthRange: 'Oct–Dec 2026',
    metricTarget: '$2,499+ MRR · 1 referenceable customer',
    requirements: [
      'Convert 1 of 3 design partners to Strategy tier',
      'Hold pricing — no "first-year discount" below $2,499/mo (anchor protection)',
      'Stripe billing live, annual contract signed',
      'Case study drafted with the converted partner (real numbers, not projections)',
    ],
    risks: [
      'Partner pushes for sub-$2,499 pricing and you accept — anchor set for every future deal',
      'Conversion happens but churn in month 2 from unclear ROI',
      'Single-customer concentration — you depend on one account',
    ],
    criteria: [
      '$2,499+ MRR with a paid invoice, 30-day active usage',
      'Customer agrees to take reference calls',
      'Case study published with real DQI uplift / decision reversed / $ saved',
    ],
    confidence: 'medium',
  },
  {
    id: 'bs-q4',
    lane: 'bootstrap',
    quarter: 4,
    title: '5–8 paying customers · £25–50k MRR',
    subtitle: 'Decision point: stay solo on revenue, or raise on traction at a 2–3× valuation.',
    monthRange: 'Jan–Mar 2027',
    metricTarget: '£25k+ MRR · ≥70% gross retention',
    requirements: [
      'Convert remaining 2 design partners + close 3 new referral-driven deals',
      'Hire contract SDR ($2–4k/mo) or land first GTM advisor',
      'Start operator-angel conversations with revenue as the anchor',
    ],
    risks: [
      'Growth plateaus at 3–5 customers → ICP is too narrow; expand or repair',
      'Founder burnout from solo ops + sales + product cycles',
      'Raising gets delayed because revenue keeps you "comfortable"',
    ],
    criteria: [
      '£25k+ MRR, ≥ 70% gross retention',
      '≥ 2 inbound leads per month from referrals or content',
      'Clear path to £100k ARR in 12 months with or without a raise',
    ],
    confidence: 'low',
  },
];

export const VC_MILESTONES: Milestone[] = [
  {
    id: 'vc-q1',
    lane: 'vc',
    quarter: 1,
    title: '3 discovery calls logged',
    subtitle: 'Identical to bootstrap. Discovery is a prerequisite to every accelerator app.',
    monthRange: 'Apr–Jun 2026',
    metricTarget: '3 calls · 1 shortlisted GTM advisor',
    requirements: [
      'Same outbound cadence as bootstrap lane',
      'Additionally: list 5 GTM advisors with current CSO relationships',
      'Draft YC / Antler / Entrepreneur First application narrative (do not submit yet)',
    ],
    risks: [
      'Writing decks instead of doing outreach — this is a common procrastination pattern',
      'Applying to accelerators before 3 calls = rejection on "no customer evidence"',
      'Targeting VCs before product validation',
    ],
    criteria: [
      'Same 3 discovery calls as bootstrap lane',
      'One shortlisted GTM advisor who agrees to a 30-min call',
      'Accelerator application drafted but not submitted',
    ],
    confidence: 'high',
  },
  {
    id: 'vc-q2',
    lane: 'vc',
    quarter: 2,
    title: 'YC S26 app + operator angel intros',
    subtitle: 'Submit with discovery-call evidence attached. 10 warm angel conversations.',
    monthRange: 'Jul–Sep 2026',
    metricTarget: 'YC app submitted · 2 angels "interested"',
    requirements: [
      'Submit YC S26 application with 3 design partner LOIs attached',
      'Reach out to 10 operator angels (ex-CSO, corp strategy founders, ex-McKinsey partners)',
      'Book advisor conversations with 3 shortlisted GTM advisors',
      'Secondary: Antler, Entrepreneur First, Techstars applications',
    ],
    risks: [
      'YC rejects solo founders > 50% of the time — high probability of a "no"',
      'Angel conversations stall without a clear round size, lead, and terms',
      'Applications absorb focus from actual customer conversion',
    ],
    criteria: [
      'YC application submitted by July 15 deadline with real LOIs',
      '≥ 2 operator angel conversations resolving to "interested, show me traction"',
      'One GTM advisor informally agrees to an advisory role',
    ],
    confidence: 'medium',
  },
  {
    id: 'vc-q3',
    lane: 'vc',
    quarter: 3,
    title: 'YC interview OR pre-seed close',
    subtitle: 'Outcome gates everything downstream. One-shot quarter.',
    monthRange: 'Oct–Dec 2026',
    metricTarget: 'YC admission OR £250k+ angel round closed',
    requirements: [
      'YC interview (if accepted) — prep with advisor + 3+ mock interviews',
      'If YC says no: close £250–500k operator angel round at £3–5m post-money',
      'If YC says yes: accept $500k/7% + begin demo-day prep',
      'Formalize GTM advisor with 0.25–0.5% equity grant',
    ],
    risks: [
      'YC accepts but requires US relocation — visa + schooling implications at 16',
      'Angel round stalls at 60% committed — no lead = no close',
      'Valuation anchor set low because pre-revenue (use LOI pipeline as counter-anchor)',
    ],
    criteria: [
      'YC admission OR £250k+ closed at terms ≤ 25% dilution',
      'GTM advisor onboard with clear quarterly deliverables',
      'Board or advisor structure in place (even if informal)',
    ],
    confidence: 'low',
  },
  {
    id: 'vc-q4',
    lane: 'vc',
    quarter: 4,
    title: 'Post-raise scale — 5+ enterprise customers',
    subtitle: 'Contract SDR, outbound volume, demo-day pipeline, seed-extension setup.',
    monthRange: 'Jan–Mar 2027',
    metricTarget: '5+ enterprise customers · £60k+ MRR',
    requirements: [
      'Hire contract SDR ($4–6k/mo) + part-time GTM operator',
      'Scale outbound to 100+ messages/week across SDR + founder',
      'Close 5+ enterprise customers ($2,499+/mo each)',
      'YC demo day (if accepted) — position for seed extension at 2–3× markup',
    ],
    risks: [
      'SDR ramp takes 3 months — burn outpaces revenue',
      'Enterprise sales cycles (6–12 months) mean demo-day pipeline is thin',
      'Running out of cash before next raise closes',
    ],
    criteria: [
      '5+ paying enterprise customers · £60k+ MRR',
      '12+ months of runway post demo-day',
      'Seed extension or Series A conversations started at 2–3× markup',
    ],
    confidence: 'low',
  },
];

export const ALL_MILESTONES: Milestone[] = [...BOOTSTRAP_MILESTONES, ...VC_MILESTONES];

// Decision objectives drive the "what am I optimizing for" toggle.
// Winner is deliberately honest — VC is NOT the answer to every question.
export const DECISION_OBJECTIVES: DecisionObjective[] = [
  {
    id: 'speed',
    label: 'Speed to revenue',
    description: 'How fast to your first paid invoice?',
    winner: 'bootstrap',
    rationale:
      'Bootstrap hits revenue in Q3 without a 3-month fundraising cycle. VC lane spends Q2–Q3 on applications, interviews, and closes instead of selling.',
  },
  {
    id: 'valuation',
    label: 'Dilution efficiency',
    description: 'How much equity do you keep per £ raised?',
    winner: 'bootstrap',
    rationale:
      'Raising post-revenue at £25k MRR commands 2–3× the valuation of pre-revenue. The same £500k costs ~7% instead of ~20%.',
  },
  {
    id: 'network',
    label: 'Warm CSO intros',
    description: 'Qualified buyer intros that compound in your favor.',
    winner: 'vc',
    rationale:
      "YC portfolio alone produces ~50 warm intros to CSOs at portfolio companies. Solo bootstrapping has zero equivalent — this is the single biggest VC unlock.",
  },
  {
    id: 'learning',
    label: 'Rate of learning',
    description: 'How fast do you get correct feedback from experienced operators?',
    winner: 'vc',
    rationale:
      'Accelerators + operator angels put 10–20 experienced operators in active debug-mode on your business. Solo learning is slower and noisier.',
  },
  {
    id: 'optionality',
    label: 'Optionality',
    description: 'Can you still change direction in 6 months?',
    winner: 'bootstrap',
    rationale:
      'Bootstrap preserves all paths — you can still raise later, change ICP, or stay solo. VC locks you into a growth trajectory with board accountability.',
  },
  {
    id: 'credibility',
    label: 'Buyer credibility',
    description: 'Does being "YC-backed" make a CSO take the meeting?',
    winner: 'vc',
    rationale:
      'For a 16-year-old solo founder, institutional backing is the single biggest credibility shortcut with enterprise buyers who otherwise filter on pedigree.',
  },
];

export const SEQUENCING: SequencingPhase[] = [
  {
    phase: 'Now → 60 days',
    window: 'Apr–May 2026',
    recommendation:
      'Outreach only. 2–3 design partners via LOI. Same work for both lanes — you can\'t skip this.',
    gate: '3 discovery calls logged with at least 1 pattern confirmed 3× independently.',
  },
  {
    phase: '60–120 days',
    window: 'Jun–Jul 2026',
    recommendation:
      'Convert 1 design partner to paid. Find a GTM advisor with current CSO relationships.',
    gate: '$2,499/mo signed OR a GTM advisor onboard with a clear deliverable for Q3.',
  },
  {
    phase: '120–180 days',
    window: 'Aug–Oct 2026',
    recommendation:
      'Decision point. 1 paying + 3 design partners → YC. 3 design partners, no paid → operator angels. Nothing → diagnose, don\'t raise.',
    gate:
      'Enough traction to defend a real valuation OR a clear reason to stay bootstrapped for 6 more months.',
  },
];

export const HONEST_TAKE = {
  headline: "It's a timing question, not a binary.",
  keyInsight:
    "The biggest gain from raising isn't money — it's warm intros. At 16, the YC portfolio network is worth 10× the check. You're sales-constrained, not capital-constrained.",
  whatsMissing: [
    '3 logged discovery calls with real CSOs',
    'One GTM advisor with current CSO relationships (Wiz-scale credibility is different from buyer-network credibility)',
    'Clarity on co-founder vs. solo — YC rejects solo founders > 50% of the time',
  ],
  doNotRaiseBefore: [
    'You have 3 logged discovery calls with pattern convergence',
    'You can name the specific CSO pain in their own words',
    'You have at least one LOI or verbal commitment to a pilot',
  ],
};
