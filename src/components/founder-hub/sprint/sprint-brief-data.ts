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
    item: 'One credible physical artifact',
    detail:
      'A one-pager and/or the financial-crisis research. Gives him something to hold while he advises.',
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

/** Update after each weekly session. Starts empty. */
export interface SessionNote {
  date: string;
  takeaways: string[];
  commitmentsForNextWeek: string[];
}

export const SESSION_LOG: SessionNote[] = [];
