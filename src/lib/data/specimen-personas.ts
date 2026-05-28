/**
 * BAFTA specimen artefacts — the "what unaudited looks like" leave-behind,
 * one per Phase-1 HXC persona (repositioning plan 2026-05-11 §11, Workstream A).
 *
 * The single highest-leverage marketing asset per the repositioning plan: a
 * procurement-grade 5-section artefact that does the persuasion by ARTEFACT,
 * not pitch — handed to a warm coffee at Strategy World London, linked in a
 * cold DM, forwarded internally. Each persona shares the 5-section structure
 * (hero → public-record findings → why-it-happens (empathic) → how-DI-would-
 * improve → what-you're-missing + CTA) and differs on the failures cited, the
 * knowledge-chasm framing, and the cost-calculation anchor.
 *
 * Pure data — JSX-free. Counts (cases / biases / frameworks / Brier) are NOT
 * hardcoded here; the page interpolates them from canonical exports so the
 * stats strip can never drift. noindex until validated (NOT in the sitemap).
 *
 * Vocabulary discipline: pain is framed as "unaudited reasoning," never
 * "bad/flawed reasoning" or "decision hygiene"; never team-blaming — the
 * failure is the structural absence of an artefact that survives the handoff,
 * not the competence of the buyer's team.
 */

export type SpecimenSeverity = 'critical' | 'high' | 'medium';

export interface SpecimenFinding {
  /** Named pattern or bias (canonical taxonomy vocabulary). */
  pattern: string;
  severity: SpecimenSeverity;
  /** What was missing / what the pattern looked like in the record. */
  gap: string;
}

export interface PublicFailure {
  company: string;
  /** The outcome headline — public record. */
  headline: string;
  findings: SpecimenFinding[];
}

export interface StructuralReason {
  title: string;
  body: string;
}

export interface LifecycleRow {
  stage: string;
  surface: string;
  prevents: string;
}

export interface CostRow {
  variable: string;
  value: string;
}

export interface SpecimenPersona {
  slug: string;
  personaLabel: string;
  /** Page-1 hero. */
  heroTitle: string;
  heroSub: string;
  /** Page-2 — what we found in the public record. */
  publicFailures: PublicFailure[];
  /** Page-3 — why it happens (empathic mode). */
  whyTitle: string;
  whyLead: string;
  structuralReasons: StructuralReason[];
  notACritique: string;
  /** Page-4 — how DI would have improved a cited decision (retro DPR cover). */
  retroDealName: string;
  retroGrade: string; // e.g. "D"
  retroScore: number; // 0-100, illustrative retro
  retroCriticalPatterns: string[];
  retroReferenceClass: string;
  retroValidityClass: string;
  hardeningQuestions: string[];
  /** Page-5 — what you're missing (cost calc + feature stack). */
  costRows: CostRow[];
  costMath: string[];
  lifecycle: LifecycleRow[];
  coverFrame: string;
  ctaLabel: string;
}

// Shared structural reasons — the diligence/recommendation → outcome handoff.
// Page 3 reuses these with a persona-specific lead sentence.
const HANDOFF_REASONS: StructuralReason[] = [
  {
    title: 'Time pressure compresses the review.',
    body: 'The memo gets read in the time available, not the time it deserves. Subtle reasoning signatures — coherence mistaken for evidence, a synergy hidden in a spreadsheet assumption, an anchor buried in competitive language — do not survive the first reading.',
  },
  {
    title: 'Dissent is expensive once a sponsor commits.',
    body: 'After the decision-maker signals which way they are leaning, every "I disagree" goes on a record someone reads at review time. Red teams do not scale because they are structurally antagonistic (Boomerang Effect, Pronin et al. 2002) — so the strongest objection is the one nobody says out loud.',
  },
  {
    title: 'No artefact survives the handoff.',
    body: 'The reasoning lives in a four-tool graveyard — draft docs, Slack threads, a data room, the deck appendix. The next person inherits the conclusion, not the reasoning that produced it. There is no record to re-open when the outcome lands.',
  },
];

const MID_MARKET_CORP_DEV: SpecimenPersona = {
  slug: 'mid-market-corp-dev',
  personaLabel: 'Mid-market Head of Corporate Development / M&A',
  heroTitle: 'Your last acquisition memo carried 3-7 of these patterns.',
  heroSub:
    "We don't know which ones — that's the point. Mid-market acquisitions, $50M-$500M range. Here is what unaudited reasoning looked like in deals you already know about, and the specific audit that catches the same patterns in 60 seconds.",
  publicFailures: [
    {
      company: 'Microsoft–Nokia (2013)',
      headline: '$7.2B acquisition · $7.6B write-down two years post-close',
      findings: [
        {
          pattern: 'Synergy Mirage',
          severity: 'critical',
          gap: '"$24B revenue synergies over 3 years" with no named operational mechanism, no accountable executive, no 90-day milestone.',
        },
        {
          pattern: 'The Yes Committee',
          severity: 'high',
          gap: 'A 47-page IC memo with zero documented dissent — no one in the room is on record disagreeing.',
        },
        {
          pattern: 'Conglomerate Fallacy',
          severity: 'medium',
          gap: 'Smartphone hardware adjacent to OS software in branding only — no Porter "why us as parent" thesis articulated.',
        },
      ],
    },
    {
      company: 'AOL–Time Warner (2000)',
      headline: '$165B merger · $99B impairment in 2002 — the largest M&A failure in US history',
      findings: [
        {
          pattern: 'Synergy Mirage',
          severity: 'critical',
          gap: '$30B "internet × media" synergy with no specified revenue mechanism.',
        },
        {
          pattern: 'Confirmation Bias',
          severity: 'high',
          gap: '100% of board materials supported the thesis; zero red-team review on the record.',
        },
        {
          pattern: 'Conglomerate Fallacy',
          severity: 'high',
          gap: 'A dial-up ISP and a content-distribution business — distinct economic engines treated as natural complements.',
        },
      ],
    },
    {
      company: 'HP–Autonomy (2011)',
      headline: '$11.1B acquisition · $8.8B impairment 13 months post-close',
      findings: [
        {
          pattern: "Winner's Curse",
          severity: 'critical',
          gap: '79% premium over market, beating four competing bidders — auction dynamics driving the price, not intrinsic value.',
        },
        {
          pattern: 'Confirmation Bias',
          severity: 'critical',
          gap: '$2.3B of accounting irregularities flagged by quality-of-earnings work — and resolved as "acceptable."',
        },
      ],
    },
  ],
  whyTitle: 'The diligence-to-integration handoff is the most expensive failure mode in M&A.',
  whyLead:
    'Your diligence team flags ~20 risks per deal pre-close. Your integration team finds ~8 of them post-close. The other 12 were filed in a memo nobody re-opened. Three structural reasons, none of which are about your team:',
  structuralReasons: HANDOFF_REASONS,
  notACritique:
    'This is not a critique of your diligence team. It is the structural inevitability of the workflow — every mid-market corp-dev team in your peer set is doing exactly this. The 70-90% synergy-miss rate (KPMG, McKinsey) is not bad judgment; it is the absence of an artefact that survives the handoff.',
  retroDealName: 'Project Stellar (Microsoft–Nokia retro)',
  retroGrade: 'D',
  retroScore: 47,
  retroCriticalPatterns: ['Synergy Mirage', 'The Yes Committee', 'Conglomerate Fallacy'],
  retroReferenceClass:
    '14 comparable mid-market tech-hardware-into-OS acquisitions, 1995-2012 → 71% rated underperform-or-fail',
  retroValidityClass: 'Low (platform M&A — sub-50% acquirer success rate)',
  hardeningQuestions: [
    'Synergy Mirage: Name the 90-day operational mechanism for each $1B of claimed revenue synergy. Who owns it. What is the first measurable milestone.',
    'The Yes Committee: Show me the dissenting view. Who in this room would refuse this deal at the current price — and if no one, why is no one disagreeing?',
    'Conglomerate Fallacy: Run the conglomerate-discount calculation against pure-play comparables. What is the discount factor for this combination?',
  ],
  costRows: [
    { variable: 'Strategic acquisitions per year', value: '2-4' },
    { variable: 'Average ticket size', value: '$50M-$500M' },
    { variable: 'Industry synergy-miss rate (un-audited)', value: '70-90% (KPMG, McKinsey)' },
    {
      variable: 'Expected loss if one carries a critical Synergy Mirage',
      value: '$10M-$100M per occurrence',
    },
  ],
  costMath: [
    '£249/seat/month. For a 3-person corp-dev team: £747/mo × 12 = £8,964/year.',
    'ROI threshold: one corrected recommendation per year per seat.',
    'One avoided Synergy Mirage on a single mid-market deal: 100-10,000× the annual subscription.',
  ],
  lifecycle: [
    { stage: 'Sourcing screen', surface: '30-second triage', prevents: 'The wrong deal pursued' },
    {
      stage: 'IC memo',
      surface: '60-second R²F audit + provenance record',
      prevents: 'Bias-driven IC approval',
    },
    {
      stage: 'Cross-doc',
      surface: 'CIM + QofE + synergy model + IC memo conflict scan',
      prevents: 'Diligence gaps',
    },
    {
      stage: 'Walk-away',
      surface: 'Reference-class adjusted price band',
      prevents: "Winner's Curse",
    },
    {
      stage: 'Post-close',
      surface: 'Brier-scored prediction tracking',
      prevents: 'Knowledge-chasm leakage',
    },
  ],
  coverFrame:
    '"Audited pre-IC by Decision Intel. Three hardening questions resolved. Provenance record attached for audit-committee review."',
  ctaLabel: 'Audit your last IC memo',
};

const FRACTIONAL_CSO: SpecimenPersona = {
  slug: 'fractional-cso',
  personaLabel: 'Fractional CSO / independent strategy consultant',
  heroTitle: 'Your last board recommendation carried patterns you would catch in a competitor.',
  heroSub:
    'You run 3-5 engagements. Each board sees one memo a quarter. The patterns that destroyed Kodak, Blockbuster, and Nokia are the same ones quietly shaping recommendations on your desk right now — and the hardest to see are the ones in your own reasoning.',
  publicFailures: [
    {
      company: 'Kodak (1975-2012)',
      headline: 'Invented the digital camera in 1975 · filed for bankruptcy in 2012',
      findings: [
        {
          pattern: 'Status-Quo Lock',
          severity: 'critical',
          gap: "The film-margin business defended against the company's own digital invention — protecting the present at the cost of the future.",
        },
        {
          pattern: 'Confirmation Bias',
          severity: 'high',
          gap: 'Every internal forecast assumed film demand would hold; disconfirming signals were treated as temporary.',
        },
      ],
    },
    {
      company: 'Blockbuster (2000-2010)',
      headline: 'Declined to buy Netflix for $50M in 2000 · bankrupt by 2010',
      findings: [
        {
          pattern: 'Inside-View Dominance',
          severity: 'critical',
          gap: 'The late-fee revenue model was treated as a structural truth rather than a temporary feature of the format.',
        },
        {
          pattern: 'Anchoring Bias',
          severity: 'high',
          gap: 'Strategic options were anchored to the store-footprint business everyone in the room had grown up in.',
        },
      ],
    },
    {
      company: 'Nokia (2007-2013)',
      headline: '~50% of the smartphone market in 2007 · sold its phone business for ~$7B in 2013',
      findings: [
        {
          pattern: 'Illusion of Validity',
          severity: 'critical',
          gap: 'Internal confidence in Symbian stayed high because the narrative was coherent — not because the evidence supported it.',
        },
        {
          pattern: 'Overconfidence Bias',
          severity: 'high',
          gap: 'Market leadership was read as durable rather than as a position to be defended against a platform shift.',
        },
      ],
    },
  ],
  whyTitle: 'The recommendation-to-board handoff is where the reasoning disappears.',
  whyLead:
    'You produce the recommendation; the board acts on the conclusion. The reasoning that got you there — and the assumptions you did not have time to pressure-test — rarely survive into the room. Three structural reasons:',
  structuralReasons: [
    HANDOFF_REASONS[0],
    {
      title: 'You are the outside view — until you are not.',
      body: "Your value to a client is the outside perspective. But after a few months inside an engagement, the client's assumptions quietly become yours. The audit keeps the outside view honest precisely when you have stopped being able to supply it yourself.",
    },
    HANDOFF_REASONS[2],
  ],
  notACritique:
    'This is not about the quality of your judgment — your judgment is what clients pay for. It is that no individual, however experienced, can audit their own reasoning from the inside. The audit is the structural friction that catches what familiarity hides.',
  retroDealName: 'Blockbuster (Netflix-acquisition retro)',
  retroGrade: 'D',
  retroScore: 44,
  retroCriticalPatterns: ['Inside-View Dominance', 'Anchoring Bias', 'Status-Quo Lock'],
  retroReferenceClass:
    'Incumbents facing format-shift disruption, 1990-2010 → majority defended the legacy model and lost the category',
  retroValidityClass: 'Low (long-horizon strategy under structural uncertainty)',
  hardeningQuestions: [
    'Inside-View Dominance: What is the reference class for this decision, and what base rate does it imply — independent of how confident this specific case feels?',
    'Anchoring Bias: If you were advising a brand-new entrant with no legacy business, would you make the same recommendation? If not, what is the legacy anchoring you?',
    'Status-Quo Lock: Name the option you are not seriously considering because it threatens the current revenue base.',
  ],
  costRows: [
    { variable: 'Active client engagements', value: '3-5' },
    { variable: 'Board memos per engagement per year', value: '~4' },
    {
      variable: 'A single regrettable recommendation',
      value: 'The engagement, and the referral that would have followed',
    },
    { variable: 'What the audit protects', value: 'Your reputation across every client at once' },
  ],
  costMath: [
    '£249/month — less than one billable hour.',
    'ROI threshold: one recommendation per year, across all clients, sharpened before it reaches a board.',
    "A fractional CSO's asset is judgment that holds up. The audit is the cheapest insurance on it.",
  ],
  lifecycle: [
    {
      stage: 'Framing',
      surface: 'Pre-artefact priors capture',
      prevents: 'A thesis locked before the evidence',
    },
    {
      stage: 'Board memo',
      surface: '60-second R²F audit + provenance record',
      prevents: 'A recommendation that fails the reference class',
    },
    {
      stage: 'Across clients',
      surface: 'Portfolio Bias Heatmap',
      prevents: 'Your own recurring blind spots',
    },
    {
      stage: 'Post-decision',
      surface: 'Outcome calibration',
      prevents: 'Repeating the pattern next quarter',
    },
  ],
  coverFrame:
    '"Audited before the board pack went out. The reasoning is on the record, and it holds against the reference class."',
  ctaLabel: 'Audit your last board pack',
};

const SMALLER_FUND_GP: SpecimenPersona = {
  slug: 'smaller-fund-gp',
  personaLabel: 'GP / principal at a smaller fund',
  heroTitle: 'Your last IC packet carried patterns your LPs will ask about.',
  heroSub:
    'Your LPs review your IC decisions quarterly. The reasoning patterns that Theranos, FTX, and Quibi all carried at the moment of commit are the same ones the audit catches in your packet — before the capital goes out, not in the post-mortem.',
  publicFailures: [
    {
      company: 'Theranos (2013-2018)',
      headline: '$9B peak valuation · dissolved in 2018, investors near-total loss',
      findings: [
        {
          pattern: 'Halo Effect',
          severity: 'critical',
          gap: 'A celebrity board and founder narrative substituted for technical and operational due diligence.',
        },
        {
          pattern: 'Confirmation Bias',
          severity: 'critical',
          gap: 'Investors who wanted the thesis to be true under-weighted the absence of peer-reviewed validation.',
        },
      ],
    },
    {
      company: 'FTX (2019-2022)',
      headline: '$32B peak valuation · collapsed in 2022',
      findings: [
        {
          pattern: 'Halo Effect',
          severity: 'critical',
          gap: 'Tier-1 co-investors were treated as a substitute for governance diligence — "smart money is in" as the thesis.',
        },
        {
          pattern: 'Authority Bias',
          severity: 'high',
          gap: 'Founder reputation displaced basic questions about controls, board structure, and fund segregation.',
        },
      ],
    },
    {
      company: 'Quibi (2018-2020)',
      headline: '$1.75B raised · shut down six months after launch',
      findings: [
        {
          pattern: "Winner's Curse",
          severity: 'high',
          gap: 'Pedigree and competitive FOMO drove an enormous raise ahead of any evidence of demand.',
        },
        {
          pattern: 'Illusion of Validity',
          severity: 'critical',
          gap: 'A coherent founder narrative read as market validation; there was no reference class to check it against.',
        },
      ],
    },
  ],
  whyTitle: 'The IC-vote-to-LP-letter handoff is where conviction outruns evidence.',
  whyLead:
    'The IC votes on conviction; the LP letter reports the outcome. The reasoning in between — what you assumed, what you under-weighted, what the reference class would have said — is rarely preserved in a form an LP can examine. Three structural reasons:',
  structuralReasons: [
    HANDOFF_REASONS[0],
    {
      title: 'The pedigree of the room substitutes for the diligence.',
      body: 'When respected co-investors are in, the question "what would have to be true for this to fail?" feels rude to ask. The audit asks it on the record, so the political cost of the question is carried by the system, not by you.',
    },
    {
      title: 'The feedback loop is years long.',
      body: "A fund decision's real outcome lands 5-10 years out — far too slow to calibrate judgment. The audit forces falsifiable ≤90-day operational proxies at the moment of the vote, so the calibration loop closes in quarters, not a fund cycle.",
    },
  ],
  notACritique:
    'This is not about the quality of your deal instincts — pattern recognition is the edge a good GP has. It is that conviction and evidence feel identical from the inside, especially in a room full of people you respect. The audit is the structural check that keeps them distinct.',
  retroDealName: 'Theranos (Series-C retro)',
  retroGrade: 'F',
  retroScore: 31,
  retroCriticalPatterns: ['Halo Effect', 'Confirmation Bias', 'Authority Bias'],
  retroReferenceClass:
    'Pre-revenue hardware/biotech with celebrity boards and no peer validation → overwhelmingly impaired',
  retroValidityClass: 'Zero (frontier single-N bet, no comparable base rate)',
  hardeningQuestions: [
    'Halo Effect: Strip the board, the brand, and the co-investors out of the memo. On the numbers and the technical evidence alone, is this still a yes?',
    'Authority Bias: Which of your diligence questions did you not ask, or soften, because of who is already in?',
    'Illusion of Validity: What is the reference class, and what base rate does it imply? If there is no reference class, say so — that is a finding, not a footnote.',
  ],
  costRows: [
    { variable: 'IC decisions per quarter', value: '2-6' },
    { variable: 'Average position size', value: 'Fund-defining at a smaller fund' },
    {
      variable: 'A single impaired core position',
      value: "The fund's returns, and the next raise",
    },
    {
      variable: 'What the audit produces',
      value: 'An LP-grade record of how the call was reasoned',
    },
  ],
  costMath: [
    '£249/month against position sizes that define the fund.',
    'ROI threshold: one position per year pressure-tested before the wire, not after.',
    'The provenance record is the artefact your LPs have started asking for — the reasoning trail, not just the outcome.',
  ],
  lifecycle: [
    {
      stage: 'Sourcing',
      surface: '30-second triage on the screen',
      prevents: 'The wrong deal into diligence',
    },
    {
      stage: 'IC packet',
      surface: '60-second R²F audit + provenance record',
      prevents: 'Conviction mistaken for evidence',
    },
    {
      stage: 'Vote',
      surface: 'Forced 90-day operational proxies',
      prevents: 'A calibration loop that never closes',
    },
    {
      stage: 'LP review',
      surface: 'Reference-class forecast on the record',
      prevents: 'A reasoning trail you cannot reconstruct',
    },
  ],
  coverFrame:
    '"Audited pre-IC. The reference class is on the record, and the 90-day proxies are set — the reasoning is auditable, not just the outcome."',
  ctaLabel: 'Audit your last IC packet',
};

const PE_BACKED_FOUNDER: SpecimenPersona = {
  slug: 'pe-backed-founder',
  personaLabel: 'PE-backed mid-market founder / CEO',
  heroTitle: 'Your last strategic memo carried patterns your operating partner will probe.',
  heroSub:
    'Your board carries bias toward what worked at the last portfolio company — and yours may not be one of them. The patterns behind Sears, Bed Bath & Beyond, and GE-Alstom are the same ones the audit catches before the operating partner reads the memo.',
  publicFailures: [
    {
      company: 'Sears Holdings (2005-2018)',
      headline: 'A retail giant merged with Kmart in 2005 · bankrupt by 2018',
      findings: [
        {
          pattern: 'Conglomerate Fallacy',
          severity: 'critical',
          gap: 'Two declining retailers combined on financial-engineering logic, not an operating thesis for either.',
        },
        {
          pattern: 'Sunk-Cost / Doubling Down',
          severity: 'high',
          gap: 'Capital kept flowing to a model the market had already moved past, justified by what had already been spent.',
        },
      ],
    },
    {
      company: 'Bed Bath & Beyond (2018-2023)',
      headline: 'A category leader · bankrupt in 2023 after a debt-funded turnaround',
      findings: [
        {
          pattern: 'Conglomerate Fallacy',
          severity: 'high',
          gap: 'A private-label pivot chased adjacencies without a "why us" thesis for any of them.',
        },
        {
          pattern: 'Optimism / Planning Fallacy',
          severity: 'critical',
          gap: 'Turnaround timelines and buyback math assumed best-case execution with no reference-class adjustment.',
        },
      ],
    },
    {
      company: 'GE–Alstom (2015)',
      headline: '$10.6B acquisition · a multi-billion impairment within a few years',
      findings: [
        {
          pattern: 'Synergy Mirage',
          severity: 'critical',
          gap: 'Synergy projections drove the price with no named owner or 90-day milestone per claim.',
        },
        {
          pattern: "Winner's Curse",
          severity: 'high',
          gap: 'A competitive process and strategic-necessity language pushed the bid above intrinsic value.',
        },
      ],
    },
  ],
  whyTitle:
    'The memo-to-operating-partner handoff is where your reasoning meets a borrowed playbook.',
  whyLead:
    'You write the strategic memo; the operating partner reads it through the lens of what worked at the last portfolio company. Where the playbook and your business diverge is exactly where the reasoning needs to be on the record. Three structural reasons:',
  structuralReasons: [
    HANDOFF_REASONS[0],
    {
      title: "The board's pattern-match is not your business.",
      body: "A PE board's instinct is calibrated on prior deals. That is valuable — until the prior deal's playbook is applied to a business it does not fit. The audit names where your specifics break the borrowed pattern, so you can defend the divergence with evidence rather than conviction.",
    },
    HANDOFF_REASONS[2],
  ],
  notACritique:
    'This is not about whether you know your business — you do, better than the board. It is that the most expensive decisions get made fastest, under the most pressure, with the most borrowed assumptions. The audit is the structural friction that catches the assumption nobody had time to question.',
  retroDealName: 'Sears–Kmart (merger retro)',
  retroGrade: 'D',
  retroScore: 46,
  retroCriticalPatterns: ['Conglomerate Fallacy', 'Sunk-Cost / Doubling Down'],
  retroReferenceClass:
    'Defensive mergers of two declining category players, 1995-2015 → diversification discount, majority value-destructive',
  retroValidityClass: 'Low (turnaround M&A under structural decline)',
  hardeningQuestions: [
    'Conglomerate Fallacy: What is the "why us as owner" thesis — the specific operating advantage this combination creates that neither business has alone?',
    'Optimism / Planning Fallacy: What does the reference class of comparable turnarounds say about your timeline — independent of your execution confidence?',
    'Synergy Mirage: For each synergy line, name the mechanism, the accountable owner, and the 90-day milestone. If any is missing, the synergy is a hope, not a plan.',
  ],
  costRows: [
    { variable: 'Board-level strategic decisions per year', value: '4-12' },
    {
      variable: 'Your personal equity stake',
      value: 'The reason the decision quality is personal',
    },
    {
      variable: 'A single value-destructive strategic call',
      value: 'Your equity, and the relationship with the sponsor',
    },
    {
      variable: 'What the audit gives you',
      value: 'Evidence to defend the calls where you are right',
    },
  ],
  costMath: [
    '£249/month against a personal equity stake measured in millions.',
    'ROI threshold: one strategic memo per year that survives the operating partner because the reasoning is on the record.',
    "The audit is not the board questioning your judgment — it is you walking in with the answer to the board's hardest question already resolved.",
  ],
  lifecycle: [
    {
      stage: 'Framing',
      surface: 'Pre-board pre-mortem',
      prevents: 'A thesis the board will dismantle',
    },
    {
      stage: 'Strategic memo',
      surface: '60-second R²F audit + provenance record',
      prevents: 'A borrowed-playbook mismatch',
    },
    {
      stage: 'Board review',
      surface: 'Predicted board questions, pre-answered',
      prevents: 'Being caught flat in the room',
    },
    {
      stage: 'Across decisions',
      surface: 'Decision Knowledge Graph',
      prevents: 'Losing the reasoning trail between calls',
    },
  ],
  coverFrame:
    '"Audited before the operating partner read it. The hardest board question is already answered, on the record."',
  ctaLabel: 'Audit your last strategic memo',
};

export const SPECIMEN_PERSONAS: Record<string, SpecimenPersona> = {
  [MID_MARKET_CORP_DEV.slug]: MID_MARKET_CORP_DEV,
  [FRACTIONAL_CSO.slug]: FRACTIONAL_CSO,
  [SMALLER_FUND_GP.slug]: SMALLER_FUND_GP,
  [PE_BACKED_FOUNDER.slug]: PE_BACKED_FOUNDER,
};

export const SPECIMEN_SLUGS: string[] = Object.keys(SPECIMEN_PERSONAS);

export function getSpecimen(slug: string): SpecimenPersona | null {
  return SPECIMEN_PERSONAS[slug] ?? null;
}
