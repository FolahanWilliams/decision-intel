/**
 * Accountability Sprint · Kristian Marcus 1-on-1 — brief SSOT (2026-06-01).
 *
 * What this is: a 4-week startup accountability sprint that collapsed into an
 * exclusive 1-on-1 advisory session (the founder was the only sign-up, and the
 * host is travelling in during a tube strike to run it anyway — a strong
 * invested-mentor signal). The host, Kristian Marcus, is a Product Manager at
 * InsurX (London insurtech, Lloyd's market) with an engineer → ops → founder →
 * insurtech-PM arc. InsurX is the SAME company shape as Decision Intel aimed at
 * a different market: it brings algorithmic discipline to the analog, gut-feel,
 * relationship-driven Lloyd's risk market; DI brings auditable discipline to the
 * analog, gut-feel, relationship-driven M&A / strategy decision market.
 *
 * Why this brief is centred on HIM (not a generic accountability goal): the
 * value is the mentor, not the spreadsheet. He has already solved DI's hardest
 * GTM problem — getting traditional, skeptical institutions to trust an
 * algorithm with decisions they used to make on instinct (40+ Lloyd's brokers
 * and insurers onto InsurX). This brief is the extraction plan.
 *
 * Naming: the TAB LABEL is role-neutral ("Accountability Sprint") per the
 * CLAUDE.md no-named-prospects discipline for the shipped bundle; the brief
 * CONTENT names Kristian / InsurX exactly like the LRQA / Cornerstone briefs
 * name their subjects internally. He is a personal mentor, not a confidential
 * prospect, but the label stays event-based for consistency + audit-safety.
 *
 * Forward-looking: this is a living brief. After each weekly session, update
 * SESSION_LOG + the relationship-play notes. Strategy stays aligned with the
 * locked GTM: HXC-persona wedge (fractional CSO / mid-market corp dev / smaller-
 * fund GP / PE-backed founder), discovery-led, ego-safe "audit unaudited
 * reasoning, never call the thinking flawed", and NO premature enterprise-pilot
 * chase.
 */

export interface SprintMeta {
  event: string;
  host: string;
  hostRole: string;
  hostCompany: string;
  when: string;
  where: string;
  format: string;
  cost: string;
  oneLiner: string;
}

export const SPRINT_META: SprintMeta = {
  event: 'Startup Accountability Sprint — collapsed into a 1-on-1',
  host: 'Kristian Marcus',
  hostRole:
    'Product Manager (ex-Operations) at InsurX · engineer → ops → founder (FLTR) → insurtech PM',
  hostCompany:
    'InsurX — London insurtech, Lloyd’s market. "Smart-follow" tech connecting brokers + insurers; Atomico / Lloyd’s Lab backed; 40+ institutions onboarded.',
  when: 'Tomorrow, 6:30pm London',
  where: 'The Hoxton Hotel, Shoreditch (in person — he’s training in despite the tube strike)',
  format:
    '4-week sprint (weekly in-person + WhatsApp accountability between). For you it is a 1-on-1 advisory session — treat it as such.',
  cost: '£20 for the 4 weeks (a commitment signal, not the value)',
  oneLiner:
    'He already solved my hardest problem — getting skeptical institutions to trust an algorithm — so tonight is about his playbook and the start of a four-week relationship, not a pitch and not a generic goal.',
};

/** The mindset reframe to walk in with. */
export const READ_THE_ROOM =
  'A seasoned B2B product manager is getting on a train during a tube strike to run a "group" event for one person. He is not doing it for the £20 ticket — he saw the profile, clocked the hustle, and decided you are worth his evening. So this is not a workshop and not a generic accountability spreadsheet: it is an exclusive 1-on-1 with someone who works out of the Lloyd’s building, scales financial technology, and has run the exact founder gauntlet you are entering. Your job is to mine his playbook and make him want to keep investing across the four weeks — not to "set a goal" anyone could set.';

export interface RunSheetItem {
  moment: string;
  move: string;
  line: string;
}

/**
 * First-viewport run sheet for tomorrow. The long brief below is the strategy;
 * this is the "20 minutes before the meeting" operating card.
 */
export const TOMORROW_RUN_SHEET: RunSheetItem[] = [
  {
    moment: 'Open',
    move: 'Thank him, then earn the room with the InsurX ↔ DI parallel.',
    line: 'You have already cracked my hardest problem — getting skeptical institutions to trust an algorithm — and that is what I want to learn from you tonight.',
  },
  {
    moment: 'Mine first',
    move: 'Lead with institutional trust, then empower-don’t-threaten positioning.',
    line: 'Where did trust actually flip at InsurX — proof point, product moment, person, or packaging?',
  },
  {
    moment: 'Use artifacts',
    move: 'CV / thesis / live app are support, not the opener.',
    line: 'If it helps, I brought the one-page version of my background and can show the product in sixty seconds — but I would rather get your teardown first.',
  },
  {
    moment: 'Week 1',
    move: 'Show the deliverables are already drafted, then ask him to tear them apart.',
    line: 'I drafted the discovery script and leave-behind already — can you pressure-test whether this would land with a skeptical institutional buyer?',
  },
  {
    moment: 'Late',
    move: 'Float the InsurX stint as a learning shape, never as a job ask.',
    line: 'Is there a light, two-day-a-week shape where I could get close enough to your institutional-trust playbook to apply it back to Decision Intel?',
  },
  {
    moment: 'Close',
    move: 'Leave with one weekly commitment + one way he can hold you accountable.',
    line: 'By next week I will have run the BAFTA discovery script and logged the exact language buyers use — I will send you the debrief before the next session.',
  },
];

/** The opener that earns instant respect — the InsurX <-> DI parallel. */
export const RESONANCE = {
  opener:
    'Kristian — thanks for making the trip despite the strikes. I dug into InsurX’s smart-follow tech, and we are actually solving the identical problem in two different rooms. You take the Lloyd’s market — analog, relationship-driven, people who trust their own underwriting gut — and give it algorithmic discipline so risk decisions get faster and more consistent. I am doing the same thing for M&A and corporate strategy: making the reasoning behind high-stakes decisions auditable before capital gets committed. You have already cracked my hardest problem — getting traditional, skeptical institutions to trust an algorithm — and that is what I want to learn from you tonight.',
  map: [
    {
      insurx:
        'Codifies insurers’ risk appetites so underwriters quote/bind fast without human referral.',
      di: 'Codifies behavioral risk patterns so executives audit a strategy memo without the bias they cannot see.',
      takeaway:
        'Both turn tacit, gut-level expert judgment into structured, faster, more consistent decisions.',
    },
    {
      insurx:
        'Onboarded 40+ traditional brokers + insurers — institutions that trust instinct — onto an algorithm.',
      di: 'Needs CSOs / M&A heads / GPs who view their intuition as their edge to trust a reasoning audit.',
      takeaway:
        'He has the institutional-trust playbook DI needs most. This is the crown-jewel extraction.',
    },
    {
      insurx:
        'Before InsurX he built FLTR (a B2C self-improvement app) while running a real-estate operation.',
      di: 'You are a builder-by-nature founder who keeps retreating into the code instead of chasing users.',
      takeaway:
        'He lived the engineer → distribution pivot. Get the personal trigger that pulled him out of build-mode.',
    },
  ],
};

export type ExtractionPriority = 'lead' | 'secondary';

export interface ExtractionTarget {
  id: string;
  title: string;
  whyHim: string;
  questions: string[];
  priority: ExtractionPriority;
}

/** What to actually pull out of him — ranked by his unique edge. Lead with A + B. */
export const EXTRACTION_TARGETS: ExtractionTarget[] = [
  {
    id: 'institutional_trust',
    title: 'A · The institutional-trust playbook (his crown jewel)',
    whyHim:
      'InsurX got 40+ Lloyd’s institutions to let an algorithm shape decisions they used to make on instinct. That is the entire DI GTM problem, already solved by the person across the table.',
    questions: [
      'InsurX got 40+ Lloyd’s brokers and insurers to let an algorithm shape decisions they used to make on instinct. What actually broke the resistance — a person, a single proof point, a pricing move, or one "aha" moment inside the product? Where did the trust actually flip?',
    ],
    priority: 'lead',
  },
  {
    id: 'empower_not_threaten',
    title: 'B · "Empower, don’t threaten" positioning (your exact ego problem)',
    whyHim:
      'Maps 1:1 to DI’s locked framing — "we audit unaudited reasoning, we do not call your thinking flawed." He has had to make smart-follow feel like it sharpens an underwriter’s judgment, not grades it.',
    questions: [
      'When you pitch smart-follow to a veteran underwriter, how do you make it feel like it sharpens their judgment instead of grading it? I have the same wall — a strategy director hears "bias audit" and feels accused before they have seen anything.',
    ],
    priority: 'lead',
  },
  {
    id: 'pm_friction_teardown',
    title: 'C · A live PM friction teardown (your stated blocker, his day job)',
    whyHim:
      'You told him the engine is built and the real hurdle is translation / packaging. That is literally a product manager’s daily job. Cash it in with the live app open.',
    questions: [
      'If you spent 20 minutes as Decision Intel’s PM: in the first 60 seconds a busy strategy director spends with this, where do they decide it is an asset versus another piece of homework? Tear the onboarding apart.',
    ],
    priority: 'secondary',
  },
  {
    id: 'pricing_packaging',
    title: 'D · Pricing + packaging into traditional B2B',
    whyHim:
      'InsurX monetises subscriptions / platform fees from conservative institutions — exactly the buyer psychology DI is pricing against (£249 individual vs a team pilot).',
    questions: [
      'How did you structure the offer so a traditional institution could say yes without a six-month procurement fight? Where did you start them — small and frictionless, or full-platform?',
    ],
    priority: 'secondary',
  },
  {
    id: 'engineer_to_distribution',
    title: 'E · The engineer → distribution pivot (personal; the reason you are here)',
    whyHim:
      'He left engineering, ran ops, and chased users for his own startup (FLTR). He already told you that you are "a builder by nature" — he was too.',
    questions: [
      'You left engineering to chase users for FLTR while running a whole real-estate operation. What was the specific trigger that got you out of build-mode? I keep retreating into the code because it is where I feel competent.',
    ],
    priority: 'secondary',
  },
  {
    id: 'fundability',
    title: 'F · Fundability read (soft, only if it flows)',
    whyHim:
      'He sits inside an Atomico-backed insurtech and the Founders-of-the-Future / NEF+ London ecosystem. Not your ICP — but a read on fundability + who is worth talking to, earned over the four weeks.',
    questions: [
      'From inside a VC-backed insurtech — what did your team have that made you fundable at seed, and what would you want to see from someone like me before you would intro them? (Ask in week 3-4, not tonight.)',
    ],
    priority: 'secondary',
  },
];

// =============================================================================
// THE QUESTION BANK — 8 focused, branched questions for the 2-3 hour session.
// The EXTRACTION_TARGETS above are the ranked FRAME (what to mine + why him).
// This is the actual CONVERSATION ENGINE: each question is built to branch —
// depending on his answer, you have the next move already loaded, so the talk
// can run deep for hours without stalling. Lead with Q1 + Q3 (his crown jewel +
// your ego wall = targets A + B); save Q7 + Q8 for the close, once he's been
// mining-rich. Let each branch breathe — you have the time; don't rush to Q8.
// =============================================================================

export const QUESTION_BANK_INTRO =
  'You have 2-3 hours — these 8 are the spine of the conversation, not a checklist to race through. Each one is built to BRANCH: ask it, listen, then follow the matching branch wherever his answer goes. Lead with Q1 + Q3 (the institutional-trust playbook + the ego wall — targets A + B). Q4 is the highest-ROI 20 minutes (his day job = your blocker). Q7 + Q8 are the close: only once he has been mining-rich do you turn the lens onto your own next 7 days and lock the accountability metric.';

export interface QuestionBranch {
  cue: string;
  follow: string;
}

export interface SprintQuestion {
  n: number;
  theme: string;
  links: string;
  priority: ExtractionPriority;
  question: string;
  why: string;
  branches: QuestionBranch[];
  capture: string;
}

export const QUESTION_BANK: SprintQuestion[] = [
  {
    n: 1,
    theme: 'The trust-flip moment',
    links: 'Deepens A · institutional trust',
    priority: 'lead',
    question:
      'Take me to the single hardest "no" you turned into a "yes" at InsurX — one specific institution. What was the actual sequence that flipped them?',
    why: 'The institutional-trust playbook is the one thing only he can give you, and a specific story carries more than any framework. The flip mechanism is what you copy.',
    branches: [
      {
        cue: 'If he points to ONE person / an internal champion',
        follow:
          '"How did you spot that person before you knew they would champion you — what was the tell that they were the believer in a skeptical room?" → this is your "who do I find first inside a target firm" answer.',
      },
      {
        cue: 'If it was a single proof point / a data moment',
        follow:
          '"What was the proof, and how did you manufacture credibility BEFORE you had your own track record?" → maps straight onto your 143-case corpus and the cold-start problem.',
      },
      {
        cue: 'If it was inside the product (an "aha" in a demo)',
        follow:
          '"What exactly did they see in the first session that made it click — and how long did that take?" → that is the shape of your 60-second live audit. Show it if it pulls.',
      },
    ],
    capture:
      'The literal mechanism that flipped trust — person, proof, or product moment. Copy it.',
  },
  {
    n: 2,
    theme: 'Push vs pull · #1 vs #40',
    links: 'Deepens A · institutional trust',
    priority: 'lead',
    question:
      'How different did it feel getting institutions #1 to #3 onto InsurX versus #10 to #40 — and what specifically turned pushing-a-boulder into momentum?',
    why: 'Tells you what to optimise for NOW (the painful first references) versus what compounds later. You are at #0; he is at #40.',
    branches: [
      {
        cue: 'If references / word-of-mouth flipped it',
        follow:
          '"How did you engineer the first reference — did you deliberately over-serve customer #1, or did you get lucky?" → this is your free-pilot-for-a-testimonial play.',
      },
      {
        cue: 'If a category or regulatory tailwind pulled them in',
        follow:
          '"How did you ride it without sounding like you were just surfing a trend?" → your EU-AI-Act tailwind, kept ego-safe.',
      },
      {
        cue: 'If it is STILL all push at 40',
        follow:
          '"Then what would you do differently if you restarted at zero?" → the honest contrarian answer is often the most valuable one in the room.',
      },
    ],
    capture:
      'The inflection — what turned push into pull, and roughly when (which customer number).',
  },
  {
    n: 3,
    theme: 'The ego wall, in his exact words',
    links: 'Deepens B · empower, don’t threaten',
    priority: 'lead',
    question:
      'When a veteran underwriter pushes back with some version of "an algorithm can’t price MY book" — what is the literal sentence you say back?',
    why: 'This is your exact wall: a strategy director hears "bias audit" and feels accused before they have seen anything. Steal his de-escalation phrasing word for word.',
    branches: [
      {
        cue: 'If he reframes as augmentation ("it sharpens you, it doesn’t replace you")',
        follow:
          '"Give me the exact words — I want to A/B them against my line, which is ‘we audit the reasoning, never the person.’"',
      },
      {
        cue: 'If he lets them win a demo (proves it on THEIR book)',
        follow:
          '"How do you set that up so the win feels like their win, not your tool’s?" → the demo psychology that disarms ego.',
      },
      {
        cue: 'If he finds the believers and ignores the blockers',
        follow:
          '"How do you spot the early-adopter underwriter versus the one who will never move — what’s the tell?" → that tell is your wedge-persona targeting filter.',
      },
    ],
    capture: 'The verbatim de-escalation line. Write it down exactly — do not paraphrase it.',
  },
  {
    n: 4,
    theme: 'What he cut from the pitch',
    links: 'Deepens C · your stated blocker, his day job',
    priority: 'lead',
    question:
      'The engine is built; my real blocker is translation. When you carried InsurX’s genuinely complex tech to a broker who does not care how it works — what did you cut from the pitch, and what was the ONE thing you led with?',
    why: 'He is a product manager — translation and packaging is literally his day job, and it is your stated #1 hurdle. This is the highest-ROI 20 minutes of the night.',
    branches: [
      {
        cue: 'If he led with the outcome, not the mechanism',
        follow:
          '"How did you find the outcome that actually landed — did you guess it, or did you hear it from customers first?" → your discovery script is exactly this machine.',
      },
      {
        cue: 'If it was a single hero number',
        follow: '"Which number — and why that one over all the others you could have used?"',
      },
      {
        cue: 'If it was a live demo',
        follow:
          '"Walk me through the 60-second version — what do you show first?" → open the live app here and run a real audit if the conversation pulls there.',
      },
    ],
    capture: 'The one thing he led with + the first thing he cut. Both matter equally.',
  },
  {
    n: 5,
    theme: 'The first yes without a procurement fight',
    links: 'Deepens D · pricing + packaging',
    priority: 'secondary',
    question:
      'How did you get a conservative institution to say yes without a six-month procurement fight — did you start them small and frictionless, or full-platform, and what was the price-point psychology at the front door?',
    why: 'You are pricing £249 individual versus a team pilot into the same buyer-psychology he has already navigated. Get the entry-point shape.',
    branches: [
      {
        cue: 'If a free / cheap pilot converted into paid',
        follow:
          '"What was the conversion mechanic — what had to be TRUE inside the pilot for them to pay?"',
      },
      {
        cue: 'If land-small-and-expand',
        follow:
          '"What triggered the expansion — usage, a single result, or a new stakeholder showing up?"',
      },
      {
        cue: 'If a champion spent discretionary budget',
        follow:
          '"Whose budget was it, and how small did the number have to be to skip procurement entirely?" → that is your "personal budget, pre-team" wedge, validated.',
      },
    ],
    capture: 'The entry-point shape + the price threshold that lets a buyer skip procurement.',
  },
  {
    n: 6,
    theme: 'The distribution-pivot trigger',
    links: 'Deepens E · the personal reason you are here',
    priority: 'secondary',
    question:
      'You left engineering to chase users for FLTR while running a whole real-estate operation. What was the specific moment you realised that building MORE was not the bottleneck — and how did you physically force yourself out of the code?',
    why: 'He already told you you are "a builder by nature." He was too. You keep retreating into the code because it is where you feel competent — get his escape hatch.',
    branches: [
      {
        cue: 'If an external forcing function (a deadline, a person, money running out)',
        follow: '"How would I manufacture that same forcing function for myself this summer?"',
      },
      {
        cue: 'If a single realisation / metric',
        follow: '"What was the number or the moment that finally made it undeniable?"',
      },
      {
        cue: 'If it was slow and painful',
        follow:
          '"What habit actually stuck — what did your week look like once you had switched?" → that becomes your sprint time-protection blocks.',
      },
    ],
    capture: 'His escape-from-build-mode trigger — and the move to manufacture your own.',
  },
  {
    n: 7,
    theme: 'His read on your next 7 days',
    links: 'Synthesis · turn the lens onto you',
    priority: 'secondary',
    question:
      'Put yourself in my exact shoes: 16, this engine already built, a free summer, and a room full of M&A heads and CSOs at BAFTA in 8 days. What do your literal next 7 days look like?',
    why: 'Forces him from advisor-in-general to operator-on-YOUR-problem. His answer is your week-1 plan, pressure-tested by someone who has run this gauntlet.',
    branches: [
      {
        cue: 'If discovery-first',
        follow:
          '"Then tear apart the discovery script I brought — would it actually land on that floor?" → pull out Deliverable 1 and hand it over.',
      },
      {
        cue: 'If "build one undeniable reference"',
        follow:
          '"Which single prospect would you chase, and how would you over-serve them to get the testimonial?"',
      },
      {
        cue: 'If content / brand-first',
        follow:
          '"Which channel, and what would the first post be?" → your 2008-crisis bias research is the expert-not-engineer angle.',
      },
    ],
    capture: 'His version of your next 7 days — then note the deltas against your own plan.',
  },
  {
    n: 8,
    theme: 'The accountability metric',
    links: 'Close · sets up the four weeks',
    priority: 'secondary',
    question:
      'Over these four weeks, what is the ONE thing you would want me to report each week so you can tell I am actually executing versus just being busy?',
    why: 'This is how you convert a one-night host into a recurring advisor who has watched you ship. Letting HIM pick the metric makes him invested in the outcome.',
    branches: [
      {
        cue: 'If conversations / discovery count',
        follow:
          '"Done — I will send you a weekly debrief with the verbatim pain-language. First one lands right after BAFTA."',
      },
      {
        cue: 'If pilots / revenue',
        follow:
          '"Honest recalibration: enterprise pilots will not close in four weeks; the realistic week-4 metric is 1-2 individual operators committing. Does that hold up to you?" → this shows strategic discipline (your goal-correction #1), not lack of ambition.',
      },
      {
        cue: 'If learning velocity / something softer',
        follow: '"How would you want me to make that measurable, so it is not just a vibe?"',
      },
    ],
    capture: 'The metric HE chose — that is your weekly WhatsApp post for the next four weeks.',
  },
];

export interface GoalCorrection {
  title: string;
  detail: string;
}

/** The 4-week goal to bring — and the two corrections that raise his respect. */
export const GOAL = {
  recommended:
    'Use these four weeks to crack the value-translation problem — turn a sophisticated reasoning engine into a frictionless, high-trust offer — and run 8–10 real discovery conversations with my actual buyer (fractional CSOs, mid-market corp-dev heads, smaller-fund partners), converting the 1–2 strongest into a free 30-day pilot.',
  corrections: [
    {
      title: 'Kill "2 enterprise team pilots by week 4"',
      detail:
        'Enterprise procurement does not move in 4 weeks and chasing it now is off-strategy. The wedge is INDIVIDUAL operators who pay personally. Tell him: "I am deliberately not chasing enterprise pilots yet — the realistic wedge is individual operators with personal budget; I want your read on whether that sequencing is right." It shows strategic discipline, not lack of ambition.',
    },
    {
      title: 'Your week 1 trump card: BAFTA in 8 days',
      detail:
        'Strategy World London at BAFTA is June 9–10 — a room full of your exact buyers. Frame it: "My week 1 is not cold outreach into a void; I have the highest-signal CSO event of my quarter next week. Week 1 is walking in with a tight discovery script, a clean leave-behind, and a way to capture conversations. Week 2’s check-in is the debrief." Concrete, founder-specific, and gives him something real to hold you to.',
    },
  ],
};

export interface WeekPlan {
  week: string;
  phase: string;
  objective: string;
  metric: string;
}

/** The full 4-week plan — DI-aligned (HXC wedge, discovery-led, BAFTA catalyst). */
export const FOUR_WEEK_PLAN: WeekPlan[] = [
  {
    week: 'Week 1',
    phase: 'Value translation + BAFTA prep',
    objective:
      'Strip the engineering backend out of the pitch. Map the product to the financial losses an M&A partner actually loses sleep over. Walk into BAFTA (June 9-10) with a discovery script + a jargon-free leave-behind + a way to log conversations.',
    metric:
      'Discovery script + leave-behind locked; BAFTA conversations logged with the exact pain-language used.',
  },
  {
    week: 'Week 2',
    phase: 'Friction audit + discovery loop',
    objective:
      'Debrief BAFTA with Kristian. Run the rest of the 8-10 discovery calls. Identify the exact moment in an executive’s day where DI feels like an asset, not homework. Capture the vocabulary they use (if they say "deal-killer", DI says "deal-killer").',
    metric:
      '8-10 discovery conversations complete; pain-vocabulary captured; the strongest 2-3 prospects identified.',
  },
  {
    week: 'Week 3',
    phase: 'Positioning + brand',
    objective:
      'Rewrite the landing + outreach copy using the exact words from weeks 1-2. Publish 1-2 structured LinkedIn posts analysing a real deal failure (e.g. Winner’s Curse), backed by your 2008-crisis bias research — expert, not engineer.',
    metric:
      'Positioning copy refreshed from real buyer language; 1-2 high-signal LinkedIn posts live.',
  },
  {
    week: 'Week 4',
    phase: 'Pilot conversion',
    objective:
      'Reach back to everyone who gave feedback. Offer a low-friction, zero-IT-integration free 30-day pilot in exchange for a testimonial. Secure 1-2 individual-operator commitments to drop their next real strategy paper into the platform.',
    metric: '1-2 individual pilots committed (NOT enterprise team pilots).',
  },
];

/** Week-1 commitments he explicitly asked you to bring. */
export const WEEK_ONE = {
  commitments: [
    'A discovery script — 4-5 questions that extract how deal teams catch bias today (and the language they use), ready to run live at BAFTA.',
    'A one-line, jargon-free leave-behind — the specimen audit / one-pager a CSO can forward internally, stripped of all engineering vocabulary.',
    'A logged set of BAFTA conversations — names, the exact words they used for the pain, and one follow-up each.',
  ],
  timeProtection: [
    'A weekday evening block for outreach + follow-ups (out-of-office work, no coding).',
    'A weekend block for synthesis + positioning.',
    'BAFTA itself as the week-1 engine. ~6 focused hours/week ring-fenced — distribution time protected from build time, which is the whole point of the sprint.',
  ],
};

export interface GiveMove {
  move: string;
  detail: string;
}

/** What to GIVE him so he keeps investing — a mentee who only extracts is forgettable. */
export const GIVE: GiveMove[] = [
  {
    move: 'Be impressive without trying',
    detail:
      'A live platform, a custom multi-node AI pipeline, and published research on cognitive bias in the 2008 financial crisis. Let those land naturally — they are the proof you operate above your years.',
  },
  {
    move: 'Be visibly coachable',
    detail:
      'Take his feedback by hand in a notebook. Mentors invest more in people they can see recording and acting on their advice.',
  },
  {
    move: 'The real gift is execution',
    detail:
      'The whole sprint is the uncomfortable between-session work. Show up to week 2 having DONE week 1. Nothing earns a builder-mentor’s continued time like a mentee who ships the homework.',
  },
];

export interface LogisticsItem {
  item: string;
  detail: string;
}

export const LOGISTICS: LogisticsItem[] = [
  {
    item: 'Live app open, codebase closed',
    detail:
      'Have a sample memo ready to run a real 60-second audit live if he is curious — the working product beats any screenshot. Do not pitch it; show it only if the conversation pulls there.',
  },
  {
    item: 'Bring the CV — but as support, not the headline',
    detail:
      'Your CV is founder-framed (Decision Intel as lead Founder/CEO) and genuinely strong — and the i-Fitness finance internship (rated Excellent by a finance line manager, "the mindset for a future career in finance and the business world") is a real credibility bridge into Kristian’s fintech world. So bring it. But do NOT open by sliding a resume across the table (that flips you from founder-peer to job applicant). Lead with the conversation + the InsurX parallel, let the 2008-crisis thesis carry the intellectual proof, show the live app if it pulls there — and have the CV as the one-page "full picture" he can hold and scan while advising.',
  },
  { item: 'A dedicated notebook', detail: 'Write his feedback by hand (see GIVE).' },
  { item: 'Arrive 6:25', detail: 'Be the one already there when he walks in off the train.' },
  {
    item: 'On your age',
    detail:
      'Do not lead with it, do not hide it. He is already invested. If it comes up, own it as the edge — you are native to the generation that grew up expecting decisions to be augmented — then steer straight back to the work.',
  },
];

/** This is NOT a pitch — guardrails so the session stays extraction + relationship. */
export const GUARDRAILS = [
  'He is a MENTOR, not a buyer / prospect / design-partner. Do not pitch him as a customer. The goal is his playbook + a relationship.',
  'Do not over-disclose internal strategy (named prospects, the Path-to-£100M math, the exit thesis). Share the product + the GTM problem, not the confidential internals.',
  'Lead with the problem + the InsurX parallel, never with jargon (DPR / DQI / R²F). This is a warm room — you can use the real vocabulary once he is leaning in, but the parallel earns the lean-in first.',
];

/** The four-week relationship play — the real prize. */
export const RELATIONSHIP_PLAY =
  'The sprint runs a WhatsApp accountability chat for the full four weeks — that is the asset. Most people post a checkbox update. You post a crisp weekly progress note + ONE sharp question that uses his expertise, and over four weeks you convert a one-night host into a recurring B2B advisor who has watched you execute. That is when the network ask becomes earned — not tomorrow (too soon), but week 3-4, after he has seen you deliver: "As I make progress, I would value your read on who in your world is worth me talking to." Insurance buyers are not your ICP, but he sits inside the Atomico-backed, Founders-of-the-Future London ecosystem; the doors he can open are operators + fundability insight, unlocked by execution, not by asking on day one.';

// =============================================================================
// WEEK-1 DELIVERABLES — bring these to the meeting tomorrow.
// Kristian asked for the Week-1 commitments; showing up with them ALREADY
// DRAFTED (not promised) proves execution AND turns the session into a working
// PM teardown of the real artifacts (his day job = translation/packaging, which
// is the founder's stated blocker). All copy is jargon-free for the cold-context
// BAFTA floor + ego-safe (audit unaudited reasoning, never "your thinking is
// flawed") + tuned to the 4 HXC personas.
// =============================================================================

export interface DiscoveryQuestion {
  q: string;
  listenFor: string;
}

/**
 * Mom-Test discovery script — past-tense, behaviour-not-opinion, no pitch until
 * the pivot. Run it live at BAFTA (T-8d) + on every discovery call.
 */
export const DISCOVERY_SCRIPT = {
  opener:
    'At the event, connect-not-pitch: "What are you working on?" → listen → "I am working on something in strategic decision-making — mind if I ask how your team handles one thing?"',
  deflection:
    'Keep it research, not a pitch: "I am trying to figure out whether a problem I keep seeing is actually real — can I get your take for two minutes?" (You are asking for advice, not selling. The artefact sells later.)',
  questions: [
    {
      q: 'Walk me through the last big strategic memo or deal paper your team put in front of a committee — how did it actually get pressure-tested before the decision?',
      listenFor:
        'The real process (or the lack of one). Is it structured, or gut-feel + whoever-is-loudest? This is the gap DI fills.',
    },
    {
      q: 'When a deal or initiative went sideways, where did the original reasoning turn out to be off — and looking back, was that visible in the memo at the time?',
      listenFor:
        'The pain, in their words. Capture the exact phrase they use ("deal-killer", "we talked ourselves into it") — that becomes your copy.',
    },
    {
      q: 'Who in the room is actually responsible for catching a blind spot before capital is committed — and how do they do it today?',
      listenFor:
        'Who owns it = who the buyer is. "Nobody, really" is the strongest possible answer for you.',
    },
    {
      q: 'When a strategic call goes wrong, what does it actually cost — in money, or in credibility with the board or your LPs?',
      listenFor:
        'The stakes + the loss-framing. A named, specific loss is what makes the audit worth paying for.',
    },
    {
      q: 'If you could see the questions your committee or CEO will ask before the meeting, what would that change for you?',
      listenFor:
        'Tests the value without pitching. A leaning-in answer is your green light to the pivot.',
    },
  ] as DiscoveryQuestion[],
  pivot:
    'Only after the last question, and only if there is real signal: "Based on what you said about [their pain, in their words], I think I have built something you should see — can I send you a 60-second audit on your next memo?"',
  captureRule:
    'Log every conversation the same night: name, the verbatim pain-language, who owns blind-spot-catching, the cost of a bad call, and one follow-up. The vocabulary you collect rewrites your positioning in week 3.',
};

export interface LeaveBehindVariant {
  persona: string;
  line: string;
}

/**
 * The one-line, jargon-free hook a prospect can forward to a colleague. Core
 * line + a per-persona variant. NO "DPR / DQI / R²F / multi-node pipeline".
 */
export const LEAVE_BEHIND = {
  coreLine:
    'Decision Intel runs a 60-second audit on a strategic memo or deal paper and flags the reasoning blind spots — the bias patterns behind most failed deals — before the committee commits. Most memos pass clean; the ones that do not are the ones that destroy value.',
  variants: [
    {
      persona: 'Mid-market corp dev / M&A head',
      line: 'It flags the bias patterns behind the 70-90% of deals that miss their synergies — before the IC meeting, not in the post-mortem.',
    },
    {
      persona: 'Fractional CSO',
      line: 'So you walk into every client board meeting having already caught what the room will challenge — across all your engagements.',
    },
    {
      persona: 'Smaller-fund GP',
      line: 'It catches the thesis blind spots before the capital call, and leaves a record your LPs can actually see.',
    },
    {
      persona: 'PE-backed founder / CEO',
      line: 'It pressure-tests the strategic call before you take it to your sponsor — so you walk in already knowing where they will push.',
    },
  ] as LeaveBehindVariant[],
};

/** The one-pager copy — the leave-behind artefact / the script for what you say. */
export const ONE_PAGER = {
  headline: 'Decision Intel — the reasoning audit platform.',
  subhead:
    'Most tools audit your data. We audit your reasoning — and catch the fatal blind spots in a strategic memo before the committee does.',
  problem:
    '70-90% of M&A deals miss their projected synergies. Most failures trace back to bias patterns that were visible in the original memo — but that nobody named at the time.',
  whatYouGet: [
    'A scan for the reasoning blind spots + decision noise in the memo (not just the data).',
    'The questions your CEO, board, or committee is most likely to ask — before the meeting.',
    'A single decision-quality score, with the breakdown behind it.',
    'A shareable, audit-committee-ready record of how the call was reasoned.',
  ],
  proof:
    '143 audited real-world corporate decisions behind the engine — the same lens that catches the WeWork-class blind spots, run on your memo in 60 seconds.',
  cta: 'Send me your next strategic memo — I will run the 60-second audit and walk you through it. No slides.',
  egoSafeFooter:
    'It audits the reasoning, never the person. Most memos pass clean — the value is catching the rare one that would have cost you, before it does.',
};

// =============================================================================
// INTERNSHIP CONSIDERATION — a live ~2-day/week stint inside InsurX.
// Context: school ended ~2026-06-01; the founder is free for the summer (~2
// months), so the opportunity-cost objection that made this a "no" is gone.
// Updated position: a LIGHT, deliberately-scoped, DI-subordinate stint is a
// good move — IF it stays a DI multiplier, not a comfortable place to hide
// from the scary distribution work. Do NOT lead the meeting with the ask.
// =============================================================================

export const INTERNSHIP_CONSIDERATION = {
  verdict:
    'Lean yes — a light ~2-day/week stint inside InsurX is a good move now that the summer is free. The deciding fact changed: the only thing that made it a bad idea was hours you could not spare; a free summer + 2 days a week makes it additive to Decision Intel, not competitive with it.',
  realPrize:
    'Be precise about WHY. The strong reason is the institutional-trust playbook: InsurX is the one company that has already solved DI’s #1 go-to-market blocker — getting skeptical institutions to trust an algorithm. Watching that daily, and A/B-ing it against your own DI sales motion in real time, is a multiplier almost nothing else gives you. "See how a company makes decisions generally" is a bonus, not the headline — InsurX’s decision workflows (underwriting) are not your buyers’ (strategy memos / IC decks). Go in optimising for the trust playbook.',
  operatingRules: [
    '2 days, hard cap. DI gets the other five — and the deep blocks. Your first-customer push off BAFTA is the priority; the internship fills around it, never the reverse.',
    'Go in with a weekly learning objective, like you did at i-Fitness — one question tied to a real DI problem (how does InsurX win this trust / package this / handle this objection).',
    'Keep an "InsurX → DI application log": every week, one thing you learned + how you applied it to DI’s go-to-market that same week. That log is the whole game — it makes the learning compound into DI instead of staying a hobby, and it is your early-warning system if it stops.',
    'Use it to deepen the Kristian relationship (still the bigger long-game asset). Being inside makes you more useful to him and him more invested in you.',
  ],
  caution:
    'The one caution that survives the free summer: this is still your highest-leverage customer-acquisition window of the year — no school, a room full of buyers at BAFTA in 8 days. The failure mode is no longer "no time" — it is COMFORT. An interesting insurtech is an easier place to feel productive than chasing your own first paying customer. If DI’s distribution work ever slips BECAUSE the internship is the more comfortable thing, that is the signal to dial it back immediately.',
  howToFloat:
    'For tomorrow: do NOT lead with the internship ask — establish the founder-peer dynamic and run the extraction first. Then, late and lightly, float it as a learning question, not a job request: "Honestly, the thing I’d value most is getting close enough to how you win institutional trust to apply it to my own market — is there a light, 2-day-a-week shape to that this summer that wouldn’t get in the way of me running Decision Intel?" Get the real parameters (hours, what you’d actually see, how close to the trust problem you’d sit) before committing. Decide after you have the real shape, not before.',
};

/** Update after each weekly session. Starts empty. */
export interface SessionNote {
  date: string;
  takeaways: string[];
  commitmentsForNextWeek: string[];
}

export const SESSION_LOG: SessionNote[] = [];
