/**
 * Discovery + tailored-pitch hybrid toolkit (locked 2026-05-01).
 *
 * The single most-load-bearing operational asset for the next 90 days
 * of in-person events + warm-intro conversations. Codifies the GTM Plan
 * v3.3 §7 hybrid motion: discovery FIRST within each conversation
 * (Mom-Test-grade data integrity), then a pitch TAILORED to what they
 * revealed (conversion capture given burn-rate constraints).
 *
 * Why hybrid not pure Mom Test: the founder's burn rate forces the
 * trade. Pure 30-conversation discovery discipline maximises data
 * quality but leaves runway burning. The hybrid preserves data quality
 * (discovery happens first within each conversation, before any pitch)
 * while capturing conversion (after discovery, the pitch is genuinely
 * tailored to what they revealed). Cost: ~10% data-quality erosion as
 * early-conversation pitches anchor framing. Benefit: revenue starts
 * compounding while discovery accumulates.
 *
 * Source-of-truth for: SalesToolkitTab DiscoveryPitchPanel section,
 * docs/discovery-card-v1.md printable phone reference, founder-context
 * AI chat coaching block.
 *
 * Update HERE only when the motion changes. Every consumer reads from
 * these typed exports.
 */

// ─── Types ────────────────────────────────────────────────────────

export type PersonaId = 'cso' | 'ma_corpdev' | 'fund_partner' | 'gc_compliance';

export interface DiscoveryQuestion {
  /** Order in the conversation (1-4). Always asked in this order. */
  order: 1 | 2 | 3 | 4;
  /** The verbatim question. Read it as-is. */
  question: string;
  /** One-line description of why this question is asked here. */
  why: string;
  /** Watch for these signals in the answer (founder-side cues). */
  watchFor: string[];
}

export interface PersonaOpener {
  id: PersonaId;
  label: string;
  /** First-line opener variant per persona. Discovery questions are the same; the OPENER framing varies. */
  opener: string;
  /** One-line discipline note (e.g. "never name Sankore" for fund_partner). */
  disciplineNote?: string;
}

export interface PitchTrigger {
  /**
   * What the buyer revealed (in their words, paraphrased) that triggers
   * this pitch. Trigger is keyed to the SIGNAL, not the persona — same
   * signal across personas pitches the same answer.
   */
  ifRevealed: string;
  /** The pitch — verbatim, ~2 sentences, tailored to the signal. */
  pitch: string;
  /** What NOT to say when this trigger fires. */
  avoid: string;
}

// ─── The 4 discovery questions (verbatim, in order) ──────────────

export const DISCOVERY_QUESTIONS: DiscoveryQuestion[] = [
  {
    order: 1,
    question:
      'Walk me through the last strategic memo, IC deck, or board paper you put together. What was the part you dreaded?',
    why: 'Forces specific instance, not general patterns. Surfaces real pain in their language, not yours. No leading toward our moat.',
    watchFor: [
      'Where the pain physically lived (Slack threads / Google Doc / Confluence / four-tool graveyard)',
      'Whether the pain was about authoring or about reviewing',
      'Energy shift — when they lean in vs. lean back tells you what is real',
      'The 5 words they actually use for the pain (write them verbatim — those are your future marketing copy)',
    ],
  },
  {
    order: 2,
    question:
      'When the CEO, partners, or board pushed back, what was the one question that surprised you?',
    why: 'The surprise question IS the bias-they-missed signal — but they describe it as "the question I didn\'t see coming," not as "bias." Their language, not yours.',
    watchFor: [
      'The category of surprise (regulatory? competitive? unit economics? FX / sovereign? operational?)',
      'Whether they noticed the signal in hindsight or are still defending the original framing',
      'How recent the surprise was (last quarter = warm; last year = cold)',
    ],
  },
  {
    order: 3,
    question:
      "What's the last thing you bought or paid for to make that part less painful — and did it actually work?",
    why: 'Past-behavior question. Forces real spending evidence, not vapor "we\'d pay $X." If they have never paid for anything adjacent, the pain is not fundable yet — that is THE signal.',
    watchFor: [
      'Did they pay? (yes → pain is fundable; no → pain not fundable yet, get them on free tier)',
      'What did they pay for? (consultant time / Cloverpop / McKinsey / internal analyst / nothing)',
      'Did it work? (no → there is a genuine gap they have already validated as worth paying to close)',
      'Price band — anchors your real ARR ceiling, not the fantasy 25% conversion',
    ],
  },
  {
    order: 4,
    question: 'Who else is researching this space? Who should I talk to next?',
    why: 'Every discovery should produce 2 more conversations. Standard Steve Blank customer-development close. Also a generosity test — if they offer 2+ names, they are warmer than they may have signalled.',
    watchFor: [
      'Number of names offered (0 = cold; 1 = polite; 2+ = genuinely engaged)',
      'Whether they offer to make the intro themselves vs. just naming people',
      'Whether the names they offer are in your ICP (CSO / M&A / fund partner / GC) or adjacent',
    ],
  },
];

// ─── Deflection script (used if asked "what do you do?" before Q4) ──

export const DEFLECTION_SCRIPT =
  "I'm researching whether a problem in strategic decision-making is real before I show anyone what I've built. Could I ask you 15 minutes about your work?";

export const DEFLECTION_DISCIPLINE = [
  'Do not extend the sentence. Do not elaborate.',
  'Do not mention DPR, DQI, R²F, "reasoning layer," "60-second audit," or the URL.',
  'Do not hand out a card with decision-intel.com on it. Give personal email instead.',
  'If pushed harder, repeat the line. The deflection is the point.',
];

// ─── Persona-specific openers ────────────────────────────────────

export const PERSONA_OPENERS: PersonaOpener[] = [
  {
    id: 'cso',
    label: 'CSO at FTSE 250 / S&P 500',
    opener:
      "I'm researching how strategic memos get reviewed before the room sees them. Could I ask you about the last one you put together?",
  },
  {
    id: 'ma_corpdev',
    label: 'Head of M&A / Corp Dev',
    opener:
      "I'm researching cross-border deal memos and what the room misses pre-IC. Could I ask you about the last one?",
  },
  {
    id: 'fund_partner',
    label: 'Fund Partner (Sankore-class)',
    opener:
      "I'm researching how IC memos get audited before the partnership votes. Could I ask you about the last one?",
    disciplineNote:
      'Never name Sankore aloud. Never reference "your fund" specifically — keep it abstract. The relationship is private.',
  },
  {
    id: 'gc_compliance',
    label: 'GC / Compliance officer',
    opener:
      "I'm researching how strategic-decision audit trails get produced for audit-committee review. Could I ask about the last one your team had to produce?",
  },
];

// ─── Tailored-pitch playbook ──────────────────────────────────────
//
// Triggers fire AFTER all 4 discovery questions land. The pivot
// sentence: "Based on what you said about [their specific pain in
// their words], I think I have something you should see." Then this
// pitch keyed to the signal.

export const PITCH_TRIGGERS: PitchTrigger[] = [
  {
    ifRevealed: 'The reasoning trail dies in Slack threads / Google Docs / four-tool graveyard',
    pitch:
      'Decision Intel is the system of record for that reasoning trail — every flag carries an excerpt + a regulatory citation; decision history survives team transitions; audit-committee Q&A pulls reasoning in 60 seconds. The artefact is the Decision Provenance Record — hashed and tamper-evident, signed at audit time.',
    avoid:
      'Do not lead with R²F or the 12-node pipeline — they revealed an ARTEFACT pain, pitch the artefact answer.',
  },
  {
    ifRevealed: 'We almost missed [a specific bias / blind spot] in the last memo',
    pitch:
      'The platform runs three professional lenses on every memo — equity-research skeptical, regulator-hostile, contrarian-strategist — and surfaces the bias each lens flags. Your memo would have caught [their blind spot] before the room did, with the academic citation underneath each flag.',
    avoid:
      'Do not lead with the 22-bias taxonomy count — they revealed a SPECIFIC failure mode, pitch the lens answer.',
  },
  {
    ifRevealed: "We can't get the reasoning back when audit committee asks 6 months later",
    pitch:
      'The Decision Provenance Record is the artefact for exactly that moment — hashed and tamper-evident, EU AI Act Article 14 aligned, regulator-grade. Your audit committee gets the full reasoning trail in one PDF. SOX retention, audit-committee-ready cover page, every flag traced to its source.',
    avoid:
      'Do not lead with regulatory tailwinds globally — they revealed a SPECIFIC audit-committee Q&A pain, pitch the DPR artefact answer.',
  },
  {
    ifRevealed: "We're staring down a cross-border deal and the regulatory regime is a mess",
    pitch:
      "That's the cross-border M&A differentiator. The platform maps [their regions] flag-by-flag — NDPR if Nigeria, PoPIA if South Africa, WAEMU if Côte d'Ivoire — alongside EU AI Act + Basel III. Your GC carries one artefact home for the regional + cross-border counterparty review. The Dangote DPR specimen is the artefact to share — anonymised, public.",
    avoid:
      // drift-tolerant — pitch coaching applies regardless of registry count.
      'Do not lead with all 19 frameworks — pitch the SPECIFIC regimes they named in the conversation.',
  },
  {
    ifRevealed: "We've never paid for anything to fix this (Q3 negative answer)",
    pitch:
      "There's a free audit anyone can run on a memo at decision-intel.com — no login, 60 seconds. Want me to walk you through one on the memo you just described, no commitment? See if it surfaces anything you didn't catch first.",
    avoid:
      'Do not ask for paid pilot. The pain is not fundable yet — get them on the free tier and let usage convert. Asking for £249/mo here breaks rapport.',
  },
  {
    ifRevealed:
      'We pay [Cloverpop / McKinsey-grade consultant / internal analyst time] for it (Q3 positive answer)',
    pitch:
      "You're paying for [X]. Decision Intel runs the same kind of audit on a memo in 60 seconds at £249 a month, with the regulatory provenance artefact your GC needs. The structural difference is logging vs. auditing — Cloverpop logs decisions; we audit them with three professional lenses + 19-framework regulatory mapping. Want to see it run on the memo you just described?",
    avoid:
      "Do not deny the alternative is good — they're already a believer. Convert by showing speed + provenance + price differential.",
  },
  {
    ifRevealed: 'Memos are AI-assisted today (the founder writes, AI fills gaps)',
    pitch:
      "That sharpens the positioning. Decision Intel audits the human-AI co-authored artefact — the same biases, the same regulatory exposure, the same procurement-grade DPR. The audit layer doesn't care whether a human or an AI drafted the language; it cares whether the reasoning survives three professional lenses.",
    avoid:
      'Do not pitch as a replacement for their AI assistant — pitch as the audit layer ON TOP of it.',
  },
  {
    ifRevealed: 'Memos are agent-generated today (full agentic execution)',
    pitch:
      "Decision Intel audits the reasoning, whether a human or an agent produced it. Same R²F architecture, same DPR output. The 12-node pipeline accepts any structured artefact — agent prompts + outputs map onto the same audit shape. This is where we're heading; if your team is already there, you're the design partner conversation I want to have.",
    avoid:
      'Do not undersell the architectural fit — agent-generated memos ARE in scope; emphasise that.',
  },
];

// ─── Pain patterns × feature crosswalk ───────────────────────────
//
// Locked 2026-05-05 (Mr. Goldner's 4-Week Traction Plan archaeology). The
// three pain patterns cut ACROSS personas — same pattern arrives from a
// fractional CSO, a mid-market corp dev head, a small-fund GP. Once you
// hear which pattern the prospect described, the demo move is determined:
// you don't have to rehearse all 4 personas × 7 scenarios; you match the
// pattern to its feature and run.
//
// Source: archived 4-Week Traction Plan (April 2026, pre-v3.5). The plan
// itself is superseded (the F500-corp-dev wedge is now narrowed to 4
// buyer-class-continuous personas), but this tactical framework survives
// the supersedure intact because it's persona-agnostic.
//
// Pattern A is the highest-frequency hit on the wedge personas.
// Pattern B is Goldner's "safest starter" move — running the audit on a
//   PAST deal removes future-deal political risk and earns trust.
// Pattern C is the IC-process angle that lands hardest on mid-market PE
//   and small-fund GP personas.

export interface PainPattern {
  /** Stable slug used for UI keys + sales-toolkit cross-reference. */
  id: 'pre_ic_gap' | 'post_close_surprise' | 'ic_friction';
  /** Short label for chips + headlines. */
  label: string;
  /** What the prospect says in their words (verbatim signal phrases). */
  signalPhrases: string[];
  /** The DI feature that addresses this pattern (what to demo). */
  featureWedge: string;
  /** The exact demo move to run when this pattern fires on a live call. */
  demoMove: string;
  /** Pre-existing bias-hook archetypes from the 143-case library that
   * map onto this pattern (anchors the demo in a recognisable case). */
  biasHookAnchors: string[];
  /** Why this pattern is the safest / highest-leverage starter move. */
  starterRationale: string;
}

export const PAIN_PATTERNS: PainPattern[] = [
  {
    id: 'pre_ic_gap',
    label: 'Pattern A · Pre-IC gaps',
    signalPhrases: [
      "We got to IC and realised we hadn't fully validated X.",
      'The reviewer asked a question we should have caught at draft time.',
      "There's a diligence area we always seem to miss.",
      'We re-do the same memo three times before it lands.',
    ],
    featureWedge:
      'Forgotten Questions engine + structural-assumptions audit. The pipeline runs the prospect\'s memo through a 33-question taxonomy of "what would a sceptical reviewer ask" (rooted in Klein\'s pre-mortem + RPD framework + the 22-bias detector taxonomy), surfaces the gaps the IC will catch first, and outputs the questions in the order the room is most likely to ask them.',
    demoMove:
      "Ask if they have a memo handy from a deal where IC pushed back hard. Run it through /demo live — the Forgotten Questions output is what they react to. Watch for the moment they say 'that's exactly what was asked' — that's the wedge.",
    biasHookAnchors: [
      'WeWork S-1 (illusion of validity)',
      'AOL-Time Warner (overconfidence)',
      'Daimler-Chrysler (inside-view dominance)',
    ],
    starterRationale:
      'Highest-frequency pattern on the wedge personas. Mid-market corp dev heads + small-fund GPs name this pain unprompted in 60-70% of discovery calls (per the 4-Week Traction Plan post-mortem). The Forgotten Questions output is the single most demoable feature — they read 5 questions and recognise 2-3 they were asked.',
  },
  {
    id: 'post_close_surprise',
    label: 'Pattern B · Post-close surprises',
    signalPhrases: [
      "The synergies didn't materialise the way the memo said they would.",
      "We integrated and discovered [X] that wasn't in any model.",
      'We had to take a markdown 18 months in.',
      "Looking back, the bias was obvious — we just couldn't see it at the time.",
    ],
    featureWedge:
      "Retrospective audit on a CLOSED deal. Run the audit on a memo from 12-24 months ago where the outcome is known. The DPR surfaces the structural assumptions that didn't hold + the biases that drove them. This is forensic, not predictive — and that's why it's safe.",
    demoMove:
      "Goldner's 'safest starter' move. Ask: 'Do you have an old memo handy — even one from 2 years ago? Send it over right now, I'll run it in the next 60 seconds and show you what we surface.' The retrospective frame removes political risk (no live deal in scope) and the reaction is immediate — they SEE the bias they missed.",
    biasHookAnchors: [
      'Quibi launch (planning fallacy)',
      'Boeing 737 MAX (optimism bias)',
      'Theranos investor decisions (halo effect + authority bias)',
    ],
    starterRationale:
      "Goldner's locked move from the 4-Week Traction Plan: 'safest starter' because the deal is already closed — there's no live political stake. Use this when the prospect is curious but hesitant to commit a live deal to the audit. Retrospective audits convert at higher rates than live audits when the prospect is in evaluation mode.",
  },
  {
    id: 'ic_friction',
    label: 'Pattern C · IC process friction',
    signalPhrases: [
      "IC debates drag because the reasoning in the memo isn't clear.",
      'We argue the same points every meeting and never resolve them.',
      "The senior partner's gut overrides the analysis half the time.",
      "We don't have a way to compare this memo to past decisions.",
    ],
    featureWedge:
      "Noise score (3-frame jury — analyst-skeptical, regulator-hostile, contrarian-strategist) + Decision Knowledge Graph cross-decision comparison. The noise score quantifies how much the audit verdict varies across professional lenses; high stdDev = the memo will be argued at IC because the reasoning is framing-sensitive. The Knowledge Graph surfaces decisions of the same shape from the prospect's history with their realised outcomes.",
    demoMove:
      'Open the demo with the WeWork DPR specimen. Show the noise score panel (analyst-skeptical disagrees with regulator-hostile by 30+ points) and the explanation: "this is the conversation IC is going to have at length. The audit names it before the meeting." For a follow-on demo, run their actual memo through and show whether the same pattern appears.',
    biasHookAnchors: [
      'Long-Term Capital Management (loss aversion mis-framing)',
      'Sears retail strategy (status quo bias)',
      'FTX investor decisions (authority bias)',
    ],
    starterRationale:
      'Highest leverage on mid-market PE associates + small-fund GPs who already have IC infrastructure but feel friction. The noise score is the conversation differentiator — competitors quantify the audit verdict; we quantify the DISAGREEMENT.',
  },
];

// ─── Discipline rules (the do-not list) ──────────────────────────

export const DISCOVERY_DISCIPLINE_RULES = [
  {
    rule: 'Discovery happens FIRST within every conversation. All 4 questions, in order, no exceptions.',
    why: 'The temptation to pitch in Q1-Q2 is the signal you are about to corrupt the data. Hold the line.',
  },
  {
    rule: "Don't pitch in Q1-Q3.",
    why: 'Once you describe the product, every subsequent answer is biased toward what you described. Q4 + the pivot sentence is when pitch happens.',
  },
  {
    rule: 'Talk for less than 25% of the conversation.',
    why: 'You are there to listen. If you are talking more than 25%, you are pitching, not discovering.',
  },
  {
    rule: 'Past behavior, not future opinion.',
    why: 'Never ask "would you pay for X?" — always "what have you paid for to fix this?" (Q3). Future-opinion answers are politeness; past-behavior answers are real.',
  },
  {
    rule: 'Specific instances, not general patterns.',
    why: 'Force the LAST one (Q1, Q2, Q3 all reference "the last"). Generic patterns are aspirational; specific instances are evidence.',
  },
  {
    rule: 'No URL handout. Personal email only.',
    why: 'A card with decision-intel.com biases the next conversation they have about you. Personal email keeps the relationship in your control.',
  },
  {
    rule: 'Send the 4-line follow-up email within 12 hours.',
    why: 'Compounds the relationship. The summary in their words shows you listened. The "one thing you will do" shows you respect their time.',
  },
];

// ─── 4-line follow-up email template ──────────────────────────────

export const FOLLOWUP_EMAIL_TEMPLATE = `Subject: Thanks for [time / context / intro]

[Name],

Quick thanks for the [15 minutes / intro to X / context on Y]. The thing
that landed hardest for me was [one sentence in their words, not yours].

Based on it, I'm going to [one specific thing — sharpen the audit prompt
for X persona / write up the regulatory-mapping decision tree / share the
WeWork DPR with Y].

If you want a free 60-second audit on any memo of your own, the link is
decision-intel.com — no login, no gate. And I'd love to share what I
learn from the next [10 / 30] conversations once the pattern's visible.

— Folahan
`;

// ─── What you will have after 30 conversations ───────────────────

export const WHAT_30_CONVERSATIONS_PRODUCE = [
  'The 5 words buyers use for the pain (your real marketing copy, not a guess).',
  'The price band buyers have already paid for adjacent tools (your real ARR ceiling, not a fantasy 25% conversion).',
  'The surprise-question signal across personas (which biases / blind spots are most-cited; sharpens the pitch).',
  '3-5 of the 30 warm enough to come back to with the tailored-pitch second meeting.',
  'A real conversion rate (5-8% baseline; if higher, the wedge is unusually warm; if lower, the wedge is wrong).',
  'Pattern-match across 10+ before declaring the motion working. If the pattern does not converge, the wedge is wrong, not the questions.',
];
