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

/**
 * Persona ids — locked v3.5 HXC wedge personas (mirrors the four
 * `phase1_hxc`-tagged personas in sparring-room-data.ts and the
 * PHASE_1_HXC_PERSONAS export in icp.ts). Re-aligned 2026-05-08
 * during the discovery-toolkit refresh — replaces the prior
 * `cso / ma_corpdev / fund_partner / gc_compliance` set which mixed
 * Phase 1 wedge with Phase 4 ceiling.
 *
 * The `gc_compliance` persona is now treated as Phase 4 procurement-
 * pull (per CLAUDE.md GTM v3.5 §1) and removed from the Phase 1
 * cold-discovery surface; the four below ARE the Phase 1 wedge
 * cold-DM targets.
 */
export type PersonaId =
  | 'fractional_cso'
  | 'midmarket_corp_dev'
  | 'smaller_fund_gp'
  | 'pe_backed_founder';

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
  /** Archetype name (matches Sparring Room — "Marcus" / "Damien" / "Aisha" / "Henrik"). */
  archetype: string;
  /** First-line opener variant per persona. The 4 Mom-Test discovery
   *  questions in DISCOVERY_QUESTIONS are still asked in fixed order
   *  AFTER the opener; this opener is the cold-context invitation. */
  opener: string;
  /** Sharpened per-persona discovery question (≤25 words, NotebookLM
   *  synthesis 2026-05-08 against master KB). Surfaces the unaudited-
   *  reasoning pain in the persona's specific language WITHOUT naming
   *  the platform. Use as the LEAD-IN question once the conversation
   *  is open — it sharpens the Mom-Test 4 with persona-specific framing
   *  rather than replacing them. */
  discoveryQuestion: string;
  /** What to listen for in the answer — 1-2 phrases that cue you the
   *  persona has just signalled the unaudited-reasoning pain. */
  painSignalCue: string[];
  /** The bridge sentence to pitch IF the cue fires. Converts cold →
   *  warm in two beats: their pain in their words → "we run reasoning
   *  audits — the technical name is a reasoning layer, scored as a
   *  Decision Quality Index." */
  bridgeSentence: string;
  /** Master-KB anchor — which case studies / primary research the
   *  per-persona discovery question pulls from. Sourced from the
   *  2026-05-08 NotebookLM synthesis. */
  kbAnchor: string;
  /** One-line discipline note (e.g. "never name Sankore" for
   *  smallfund_gp). */
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

/**
 * v3.5 HXC wedge personas — locked 2026-05-04 ICP + 2026-05-08
 * NotebookLM-synthesised discovery questions + bridge sentences.
 *
 * Each entry carries (a) the cold-context opener (the line that goes
 * IN the LinkedIn DM / cold email / conference 1:1 introduction) and
 * (b) the SHARPER per-persona discovery question to ask once the
 * conversation is open. The 4 fixed Mom-Test questions in
 * DISCOVERY_QUESTIONS are still asked in fixed order; the per-persona
 * `discoveryQuestion` is the lead-in that sharpens the framing for
 * THIS persona's specific pain language.
 *
 * Bridge sentences are deliberately uniform in shape ("Based on what
 * you said about X, we run reasoning audits — the technical name is
 * a reasoning layer, scored as a Decision Quality Index") so the
 * founder can rehearse one pattern across all four personas.
 *
 * NotebookLM synthesis source: master KB notebook 809f5104 query
 * 2026-05-08, anchored in (a) the 143-case library WeWork "Echo
 * Chamber" + Nokia "Yes Committee" failure patterns, (b) Mercier &
 * Sperber argumentative theory of reasoning, (c) Kahneman & Lovallo
 * 2003 "Delusions of Success" + Planning Fallacy, (d) Klein 1995
 * pre-mortem framework, (e) Deep Research PMF findings on LP
 * governance pressure on smaller fund GPs.
 */
export const PERSONA_OPENERS: PersonaOpener[] = [
  {
    id: 'fractional_cso',
    label: 'Fractional CSO / strategy consultant',
    archetype: 'Marcus',
    opener:
      "I'm researching how strategic memos get reviewed before the room sees them. Could I ask you about the last one you put together for a client?",
    discoveryQuestion:
      'Walk me through your last client strategy deliverable. When the board reviewed it, what was the one question that surprised you?',
    painSignalCue: [
      'They challenged our base assumptions',
      "They asked for comparables we didn't have",
    ],
    bridgeSentence:
      'Based on what you said about the board catching that blind spot, we run reasoning audits on strategic memos before the room sees them — the technical name is a reasoning layer, scored as a Decision Quality Index.',
    kbAnchor:
      "Kahneman's 'Inside View' theory — strategists build a coherent narrative but fail to anticipate the 'Outside View' pushback. GTM v3.3 Hybrid Discovery Toolkit pattern.",
  },
  {
    id: 'midmarket_corp_dev',
    label: 'Head of Corp Dev / M&A at scale-up',
    archetype: 'Damien',
    opener:
      "I'm researching how mid-market deal teams audit IC packs pre-vote. Could I ask you about the last diligence process you ran?",
    discoveryQuestion:
      "In your last M&A diligence process, how did you formally document the deal team's dissenting views before the investment committee vote?",
    painSignalCue: [
      "We didn't really",
      'Everyone just nodded along once the sponsor liked it',
      "Every deal is different but we run the same diligence template / my team's been doing this 20 years, they don't miss this",
    ],
    bridgeSentence:
      'Because you mentioned the team acting like an echo chamber, we run reasoning audits on M&A diligence packs to formalize that dissent — the technical name is a reasoning layer, scored as a Decision Quality Index.',
    kbAnchor:
      "Mercier & Sperber argumentative theory (isolated teams suppress dissent to justify prior intuitions) + 143-case library WeWork 'Echo Chamber' + Nokia 'Yes Committee' failure patterns.",
  },
  {
    id: 'smaller_fund_gp',
    label: 'GP / principal at smaller fund',
    archetype: 'Aisha',
    opener:
      "I'm researching how smaller-fund GPs document conviction for their LPs. Could I ask you about your last contrarian investment?",
    discoveryQuestion:
      'When you make a contrarian investment, how do you document your conviction so LPs see institutional rigor rather than just your gut feel?',
    painSignalCue: ['LPs are demanding more process', "It's hard to put the narrative on paper"],
    bridgeSentence:
      'Because LPs are demanding that verifiable process to back up your intuition, we run reasoning audits on investment memos — the technical name is a reasoning layer, scored as a Decision Quality Index.',
    kbAnchor:
      'Deep Research PMF findings: fund partners view their gut feel as their proprietary edge (high ego threat), but LPs are actively demanding institutionalized, repeatable decision frameworks.',
    disciplineNote:
      'Never name a specific fund (Sankore or any prospect) aloud. Keep the framing abstract — "smaller-fund GPs" / "your fund" / "LP-governance pressure" — never the firm name. The relationship is private.',
  },
  {
    id: 'pe_backed_founder',
    label: 'PE-backed founder / CEO',
    archetype: 'Henrik',
    opener:
      "I'm researching how PE-backed CEOs prep board decks. Could I ask you about your last major strategic pivot — what the sponsor pushed back on?",
    discoveryQuestion:
      "Think about your last major strategic pivot. What was the one underlying assumption the PE board tore apart that you didn't see coming?",
    painSignalCue: ['Market sizing', 'We were too optimistic on the timeline'],
    bridgeSentence:
      'Since you mentioned the board tearing apart that timeline assumption, we run reasoning audits on board decks to catch those gaps first — the technical name is a reasoning layer, scored as a Decision Quality Index.',
    kbAnchor:
      "Kahneman & Lovallo 'Planning Fallacy' (founders defaulting to extreme optimism + base-rate neglect) + Klein 1995 pre-mortem framework (surfacing what the room forgot to ask).",
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
  {
    ifRevealed:
      'Every deal looks unique to us, but we reach for the same playbook each time / our team has seen hundreds of these, the experience IS the process',
    pitch:
      'That is the most expensive pattern in M&A and it has a name. Kahneman & Klein (2009) showed practitioner intuition is sharpest in high-validity, repeat-game environments and weakest in exactly the low-validity, single-N decisions a strategic acquisition is — the "this one is special" instinct and the rigid playbook are the same reasoning failing in two directions at once. Decision Intel does not second-guess your team\'s experience; it makes the inside-view dominance visible at draft time and anchors the "this case is different" claim against the historical reference class, so the experience is applied where it actually has validity and audited where it does not.',
    avoid:
      'Do not call their team biased or inexperienced — that is the ego-threat that kills the deal. Name the PATTERN (cognitive entrenchment / inside-view dominance), cite the 2009 paper, and frame the audit as protecting the experience, not overruling it.',
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
      "Retrospective audit on a CLOSED deal — lead with TWO: one the prospect feels good about (ego-safe, proves it isn't a hit-piece) and one that went sideways (where the value detonates). Run the audit on memos from 12-24 months ago where the outcome is known. The DPR surfaces the structural assumptions that didn't hold + the biases that drove them. Forensic, not predictive — and that's why it's safe.",
    demoMove:
      "Goldner's 'safest starter' move, sharpened (SF advisor 2026-06-05): 'Not pitching software — let me run it over two deals you've already closed, one you feel good about and one that went sideways. Free, you keep the output.' The PAIRED ask + the retrospective frame remove all political risk (no live deal in scope); the reaction is immediate — they SEE the bias they missed.",
    biasHookAnchors: [
      'Quibi launch (planning fallacy)',
      'Boeing 737 MAX (optimism bias)',
      'Theranos investor decisions (halo effect + authority bias)',
    ],
    starterRationale:
      "Goldner's locked move from the 4-Week Traction Plan: 'safest starter' because the deal is already closed — no live political stake; retro audits convert higher than live audits when the prospect is in evaluation mode. STRATEGIC REFRAME (the logo-minting engine, SF advisor 2026-06-05): this is not just the safest CONVERSION move — every retro post-mortem MINTS A LOGO. They keep the output, they get a no-risk look, you walk away with a case study + a real logo + the proprietary closed-outcome data that seeds the Bias Genome moat (the single highest-leverage moat move per the Sankore retroactive-seed lock). Five of these = a deck that sells itself. It is the wedge→bridge reference-generation engine, not a per-prospect tactic. Boutique sell-side advisors are a strong FREE channel here even though they stay in ICP_AVOID as a paid wedge — mint logos there, not revenue. Canonical: RETRO_POSTMORTEM_COLD_OPEN in icp.ts.",
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

// ─── ETA wedge · live sales-call script (locked 2026-06-28) ──────────
//
// The ICP pivot (2026-06-26) made the ETA / owner-operator layer the
// Phase-1 wedge (independent sponsor / self-funded searcher / serial
// acquirer). The cold-discovery Mom-Test motion above still governs the
// FIRST touch (DM / event / warm intro); the PERSONA_OPENERS above are
// the older bridge-phase personas (their ETA migration is a separately
// recorded follow-up). THIS is the warmer, current-wedge motion: the
// live sales call once a searcher has agreed to bring a CIM they're
// actively looking at. Same discovery-first discipline (listen > talk),
// plus the live-audit aha moment + the referral-at-the-finding close.
//
// LOCK-CLEAN GUARDRAILS baked into every line (the four things a
// sophisticated searcher's skepticism punishes — pull any of them and
// the next finding stops being believed):
//   1. Lead SELF-VALUE ("catch YOUR blind spot / walk in prepared"),
//      never "a record investors trust" — at pre-revenue the output is
//      not a trusted third-party artefact yet (credibility/trust-gap
//      discipline; earned later, not claimed now).
//   2. Quantify the STAKES, not a fabricated multiple — value-at-stake
//      on THIS deal's ticket, never "pays for itself 50x" (false
//      precision, same class as the retired 70-90%-fail headline).
//   3. Name a RISK INDICATOR to pressure-test, never declare the deal a
//      "disaster" or assert causation (epistemic-honesty lock — the
//      restraint is what makes the finding land with a skeptic).
//   4. Ask for the REFERRAL at the aha moment, right after a real
//      finding lands — that IS the referral moment, not the contract.

export interface EtaCallStep {
  step: 1 | 2 | 3 | 4;
  label: string;
  /** The verbatim line(s) to say on the call. Lock-clean. */
  say: string;
  /** Why this step works / what it is doing. */
  why: string;
  /** The guardrail — what NOT to say, mapped to a named lock. */
  avoid: string;
}

export const ETA_CALL_SCRIPT: EtaCallStep[] = [
  {
    step: 1,
    label: 'Dig for the anxiety',
    say: "How many CIMs or broker decks are you working through right now? When you open one, what's the thing you most worry you'll miss — knowing it's your own name on the personal guarantee, not a fund's?",
    why: 'Specific-instance, past-behavior discovery (their real pipeline, their named fear). The personal-guarantee reference surfaces the asymmetric-risk anxiety without you asserting it. Write down the blind spot in THEIR words — it is your live-audit target in step 3.',
    avoid:
      "Do not pitch yet. Do not say 'software' / 'AI' / 'reasoning layer'. You are finding out whether the pain is real and specific, not selling.",
  },
  {
    step: 2,
    label: 'Reframe — the missing second set of eyes',
    say: 'A PE fund has a floor of analysts to tear a CIM apart and an investment committee to pressure-test the thesis before anyone signs. As a self-funded searcher you do all of that alone — there is no second set of eyes between you and the personal guarantee. That gap is what I work on.',
    why: 'Names the structural asymmetry (the operator IS the IC) without ego-threat — it is not "you miss things," it is "you have no one to ask." Sets up the audit as the missing process, not a judgment on their thinking.',
    avoid:
      'Do not say their judgment is flawed or that they are inexperienced — that is the ego-threat that kills it. The frame is "a process you are missing," never "thinking you got wrong."',
  },
  {
    step: 3,
    label: 'Live audit on THEIR real CIM (the aha)',
    say: "Bring a CIM you are actually looking at and let's run it now. — Here: the deck calls the revenue diversified, but the audit flags that the three largest accounts sit in the same cyclical end-market. That is a customer-concentration risk worth pressure-testing in diligence before you anchor on the LOI price. It is not a verdict on the deal — it is the first thing I would verify.",
    why: 'The live audit on THEIR real deal is the leading indicator that predicts whether they convert — not a generic demo. The finding lands because it is their deal. The risk-indicator framing ("worth pressure-testing," "first thing I would verify") is what a skeptic believes.',
    avoid:
      'Do not overclaim — never "this just saved you from a disaster" or assert the deal is dead. Name the indicator + what to verify. The restraint IS the close; the moment you over-sell, a sophisticated searcher stops trusting the next finding.',
  },
  {
    step: 4,
    label: 'Referral first, then the no-brainer close',
    say: "[The instant the finding lands] — who else in your search group is staring at CIMs this week? They should run their current one through this too. — And for you: it is £249 a month, or you can run a single live deal through it on its own. If it stops you anchoring on one bad LOI, the exposure it just flagged on this one deal already dwarfs either price. Want me to get you set up so you can run tonight's pipeline through it?",
    why: "The referral ask fires at the aha moment (the finding), not the contract — that is when they are most convinced. The close offers BOTH the subscription AND the per-deal on-ramp (the per-deal option matches the searcher's episodic value and lowers the yes-threshold during a search plateau). Value-at-stake on THIS deal, never a fabricated multiple.",
    avoid:
      'Do not claim a made-up ROI ("pays for itself for 50 years"). Anchor to the real exposure the audit just flagged on this deal. Do not force subscription-only — offer per-deal; for a searcher mid-search it converts better.',
  },
];

export interface EtaBrokerTell {
  /** The tell, named (mirrors the acquisition_thesis overlay). */
  tell: string;
  /** Plain-language version — what to actually say on the call. */
  plain: string;
  /** The bias / pattern the audit maps it to, so you can name it. */
  mapsTo: string;
}

// Live-call ammunition — the seller-narrative tells the audit now flags on
// an acquisition_thesis upload (mirrors the SELLER-DECK / BROKER-NARRATIVE
// TELLS block in investment-vertical.ts; edit both in lockstep). Every tell
// is a risk indicator to PRESSURE-TEST, never an accusation the seller lied.
export const ETA_BROKER_TELLS: EtaBrokerTell[] = [
  {
    tell: 'Smoothed cyclicality',
    plain:
      'Steady-growth line over a business that is actually seasonal or cyclical — ask for the period-by-period numbers, not the CAGR.',
    mapsTo: 'Survivorship + Anchoring',
  },
  {
    tell: "Diversification that isn't",
    plain:
      '"Diversified revenue" whose own named customers all sit in one cyclical end-market or one channel.',
    mapsTo: 'Illusion of Validity + Halo Effect',
  },
  {
    tell: 'Growth-opportunity-as-owed',
    plain:
      '"Untapped white space / just needs a motivated owner" priced into today\'s multiple — that growth is work YOU would have to create and fund.',
    mapsTo: 'Overconfidence + Inside-View Dominance',
  },
  {
    tell: 'Owner-dependency masked as turnkey',
    plain:
      '"Absentee-ready / turnkey" where the seller\'s relationships and tribal knowledge actually carry the revenue and there is no management layer underneath.',
    mapsTo: 'Inside-View Dominance (DI-B-022)',
  },
  {
    tell: 'Add-back inflation',
    plain:
      '"Adjusted EBITDA" leaning on add-backs that recur — the SBA/lender rejects them and the debt-service math breaks at close.',
    mapsTo: 'Anchoring + Optimism',
  },
  {
    tell: 'Hockey-stick detached from actuals',
    plain:
      'A projection inflecting sharply upward with no mechanism tying it to the trailing 3-year actuals.',
    mapsTo: 'Planning Fallacy + Optimism',
  },
  {
    tell: 'Deferred-capex-as-margin',
    plain:
      'High margins partly produced by under-investment — "well-maintained / low-capex" with no capex schedule hides a liability you inherit at close.',
    mapsTo: 'Optimism + Sunk Ship',
  },
];

export const ETA_CALL_PRINCIPLES: string[] = [
  'Lead self-value — "catch YOUR blind spot / walk in prepared," never "a record investors already trust." The trust is earned once you have a track record, not claimed on call one.',
  'Quantify the stakes, not a multiple — anchor to the exposure on THIS deal\'s ticket. Never "pays for itself 50x" (a fabricated number is the first thing a sharp searcher discounts).',
  'Name a risk indicator to verify, never declare the deal a disaster — the restraint is what makes a skeptic believe the finding.',
  'Ask for the referral the instant a real finding lands — the aha moment is the referral moment, not the contract moment.',
  'Offer the per-deal on-ramp alongside the subscription — episodic searchers say yes faster to a single live-deal run than to a recurring fee during a dry spell.',
  'On hesitation, take risk OFF the table — NEVER dial up FOMO. JOLT: 56% of lost deals trace to fear-of-messing-up, not status-quo bias; pushing "you\'ll miss this deal" on a buyer already terrified of the personal guarantee INCREASES the loss. Pivot to "run it on a deal you\'ve already closed first — zero risk, just see if it would have caught anything."',
  'LEAD COLD WITH THE RETRO, not the live deal (Josh/Reiner 2026-06-29, the $80M-lost-claims move). A cold prospect will NOT upload a live CIM under LOE to a stranger; a dead deal carries zero confidentiality fear, the cost is already known and felt, and it is emotionally pre-loaded. The forward live-deal audit (fundraising leverage) is the WARM move, once the retro has shown it works.',
  'Retro honesty guardrail: say "here is what was flaggable in hindsight, before anyone knew how it turned out," never "here is why your deal failed." You cannot prove the bias CAUSED the outcome (the epistemic-honesty lock); a sharp ETA catches the overclaim and you lose the room. Flaggable-in-hindsight is both devastating and defensible.',
  'Pitch EFFICIENCY KPIs, never OUTCOME KPIs, at the wedge (see EFFICIENCY_KPIS). Taktile shows "approval rate up, review time down" because it runs thousands of fast-resolving operational decisions; you run ONE acquisition every 12-24 months with an outcome years out (n=1). Promise what is measurable NOW (hours saved on CIMs, deals killed before diligence, diligence spend avoided, time CIM-to-decision); the outcome-loop / calibration KPIs are the long-game MOAT, never a number you put on a buyer this week.',
  '"What do you do that I cannot do myself?" is objectivity + speed, NOT labor. Taktile answers it with "a suite of agents that do the work for you" — do NOT copy that; you do not do the diligence. Your answer: "after six weeks on a deal you are the least objective person in the room to judge it; nobody reliably red-teams their own conviction. This is the structured challenge an institutional IC gives, in 60 seconds, that a solo buyer otherwise never gets."',
];

// ── The DECISION COST discovery sequence ────────────────────────────────────
// Locked 2026-06-28 — NotebookLM master-KB `809f5104` synthesis, cross-validated
// against the Mom Test + JOLT + the ETA wedge, sharpening the GPT/Cowork
// discovery flow with the failure modes they missed.
//
// The job-to-be-done reframe (founder's crystallization): nobody buys a
// "reasoning audit"; they buy confidence they are not missing something before
// committing irreversible capital. This sequence makes the searcher RATIONALIZE
// their own DECISION COST (months + fees bled on dead deals + the regret of the
// late miss), THEN reveals DI as the IC they don't have. Run it BEFORE the pitch
// (ETA_CALL_SCRIPT is the pitch half). Lock-clean throughout: Mom-Test
// facts-not-opinions, ego-safe (unaudited-not-flawed), the conditional close
// never invents a savings rate, and the JOLT safety-net governs every hesitation.
export interface DiscoveryStage {
  stage: number;
  label: string;
  /** The verbatim question(s) to ask — facts + past pain, never opinions. A
   *  reveal stage carries the line to SAY instead. */
  ask: string[];
  /** Whether this is a question stage or a thing you say (reveal / close). */
  kind: 'ask' | 'say';
  /** What it surfaces + why it works. */
  extracts: string;
  /** The Mom Test / JOLT / ego-safe discipline for this stage. */
  guardrail: string;
}

export const DECISION_COST_DISCOVERY: DiscoveryStage[] = [
  {
    stage: 0,
    label: 'Qualify — is the pain acute?',
    kind: 'ask',
    ask: [
      "What's the last thing you paid for, or tried, to catch deal-killers earlier in diligence — and did it actually work?",
    ],
    extracts:
      'Mom Test qualification. If they have never tried to solve "catch it earlier" (a second advisor, a checklist, a search-group buddy), the pain is not acute yet — note it and do not force the sell. If they HAVE tried, the pain is real and you have found your wedge.',
    guardrail:
      'Facts about past behaviour, never "would you pay for...". A polite disqualify on a non-fit protects your time AND your discovery data.',
  },
  {
    stage: 1,
    label: 'The funnel (just listen)',
    kind: 'ask',
    ask: [
      'In a typical month, how many CIMs or broker decks do you work through?',
      'How many get to serious diligence?',
      'How many LOIs have you written?',
      'How many have actually closed?',
    ],
    extracts:
      'Their real funnel — the denominator. Most of what they review dies, and each death cost them. This sets up the decision-cost maths in stage 2.',
    guardrail: 'Write the numbers down. Do not react, do not pitch, do not teach.',
  },
  {
    stage: 2,
    label: 'Quantify the decision cost (let THEM total it)',
    kind: 'ask',
    ask: [
      'Walk me through the last deal you had under LOI that fell apart in diligence — what was the exact moment you realised you had to walk?',
      'Between legal, the QofE, advisor time, travel, and your own time, how much did you burn before you pulled the plug?',
      'And how many of those have there been?',
    ],
    extracts:
      'They say the number out loud. Broken-deal spend runs ~$50k/searcher in the research — it dwarfs $249/mo, but only if THEY total it. Self-persuasion creates urgency; being told creates resistance. Let the silence sit after they answer.',
    guardrail:
      'Never total it for them — prompt the categories (legal / QofE / travel / your own time) and let them add it up. Do not flinch at the number.',
  },
  {
    stage: 3,
    label: 'The killer question — "the clues were already there"',
    kind: 'ask',
    ask: [
      'When you finally killed that deal, what was the one red flag that surprised you most — and looking back, were the clues already sitting there in the original CIM or the first management meeting?',
    ],
    extracts:
      'The realisation: the gap was not a lack of DATA, it was interpretation, time, or a second opinion. This is the exact gap DI fills — and it lands ego-safe ("you were too close to see it," never "you missed it because you are a poor analyst"). Surface it in THEIR words; do not say it for them.',
    guardrail:
      'Let them reach the conclusion themselves. The instant you say "see, you were biased / overconfident" you trigger ego threat and lose them. Their judgment is their edge — you protect it, you never indict it.',
  },
  {
    stage: 4,
    label: 'The regret (the emotional stakes)',
    kind: 'ask',
    ask: [
      "What's the most expensive thing you've ever missed — or watched another searcher miss?",
      "If you'd seen it on day one instead of week six, what would have changed?",
    ],
    extracts:
      'Fear of messing up (FOMU) — the JOLT finding that 56% of lost deals are fear-of-failure, not status-quo bias. With their own name on the personal guarantee, this is a painkiller, not a vitamin. Now they are emotionally invested.',
    guardrail:
      'Their words, said safely in the third person ("another searcher") if it lets them be honest. Match the fear, never amplify it into a sales-y "imagine the disaster".',
  },
  {
    stage: 5,
    label: 'The honest reveal (self-value, no over-claim)',
    kind: 'say',
    ask: [
      "A PE fund never bets on one person's conviction — there's an investment committee that attacks the thesis before a dollar moves. Solo, you do all of that alone. Decision Intel is that second set of eyes: it pressure-tests the thinking behind a deal in 60 seconds and surfaces the blind spot you're standing too close to see, before you've burned the diligence. It doesn't make the call for you — it's the committee you don't have.",
    ],
    extracts:
      'Self-value (the IC you lack), the mechanism stated honestly (it surfaces; you decide), and zero claim that DI is smarter than them. This is the "institutional discipline, solo" anchor.',
    guardrail:
      'Never "we catch what you can\'t" or "we prevent bad deals." It is the process / second opinion you are missing — full stop. Pre-revenue, you cannot claim DI is already trusted by capital partners.',
  },
  {
    stage: 6,
    label: 'The retro-led close + the founding offer',
    kind: 'say',
    ask: [
      "Bring me a deal you already walked away from, or one you regret — not a live one, so there's no confidentiality worry. I'll run a 60-second audit and show you what was flaggable in hindsight, before anyone knew how it turned out. If it surfaces something you'd have wanted to see earlier, that's the whole pitch. Then, once you trust it, you run it on the deal in front of you, where the same audit doubles as your prep to look sharp to investors. It's $249 a month, or a single live deal on its own.",
    ],
    extracts:
      "LEAD with the RETRO (a dead deal), never the live deal, on a cold first-touch: no confidentiality fear, the cost is already felt, and it is the reciprocity reveal (Josh's $80M move). The forward live-deal audit is the WARM follow-on (also their investor-prep leverage). Conditional value, their number, never a fabricated rate.",
    guardrail:
      'Retro honesty: "what was flaggable in hindsight, before the outcome was known" — NEVER "why your deal failed" (causation overclaim, the epistemic-honesty lock). The retro IS the risk-off-the-table move on hesitation; never dial up FOMO. Per-deal on-ramp ($499-$4,999) is the lower-threshold alternative to the subscription.',
  },
];

// The irresistible cold-open offer — LEAD WITH THE RETRO (locked 2026-06-29,
// Josh/Reiner: the $80M-lost-claims reciprocity move). Updated from the prior
// "Live + Retro" framing, which led with the live deal: a cold prospect will not
// upload a live CIM under LOE to a stranger, so the RETRO (a dead deal) is the
// cold lead — zero confidentiality fear, the cost is already felt, nothing to
// sell, only to reveal. The forward live-deal audit (fundraising leverage) is
// the WARM follow-on once trust exists. You cannot pitch third-party trust
// ("family offices love our audits") yet — pitch SELF-VALUE + RISK REVERSAL.
// Edit in lockstep with the stage-6 close above.
export const ETA_FOUNDING_OFFER = {
  headline: 'The retro audit (the cold-open offer)',
  lines: [
    'Bring me a deal you already walked away from, or one you regret. I run a 60-second audit, free, and show you what was flaggable in hindsight, before anyone knew how it turned out (never "why it failed" — what was visible at the time).',
    'No live CIM, no confidentiality worry on a dead deal, no risk. The cost is already yours; this just reveals what a second set of eyes would have caught.',
    'Then, once you have seen it work, you run it on the live deal in front of you, where the same audit doubles as your prep to look sharp to investors. It is $249 a month, or a single live deal on its own.',
  ],
  whyIrresistible:
    'Zero commitment AND zero confidentiality fear (it is a dead deal), and the cost is already known and felt, so there is nothing to sell, only to reveal (Josh\'s $80M-lost-claims reciprocity move). It is the investment committee a solo searcher lacks, and even a "no" leaves them with a record they keep. Self-value + risk reversal, never a trust-claim you cannot back yet.',
  founding:
    'Founding-customer terms: locked price, a direct line to the founder, and you shape the product. The first ~30 closed outcomes you log become a calibration record only YOU can build — your reference library for every future deal.',
} as const;

// Efficiency / decision-cost KPIs (the WEDGE metrics, measurable NOW) vs the
// outcome-loop / calibration KPIs (the long-game MOAT). Locked 2026-06-29
// (Reiner/Josh KPI lesson). The trap to avoid: Taktile shows OUTCOME KPIs
// (approval rate up, review time down) because it runs thousands of fast-
// resolving operational decisions; DI runs ONE acquisition every 12-24 months
// with an outcome years out (n=1). Promise only what is measurable this week;
// never put a number on the outcome-loop moat for a buyer at the wedge.
export const EFFICIENCY_KPIS = {
  wedge: {
    label: 'Wedge KPIs — measurable now, what you promise',
    items: [
      'Hours saved evaluating each CIM',
      'Deals killed before expensive diligence',
      'Diligence spend avoided on rejected deals',
      'Assumptions surfaced before the LOI',
      'Time from CIM to a go / no-go decision',
    ],
  },
  moat: {
    label: 'Outcome-loop KPIs — the long-game moat, NOT a number you quote this week',
    items: [
      'Decision outcomes tracked + lessons captured',
      'Confidence calibration, before vs after, over time',
      'Repeated mistakes avoided across deals',
      'The per-firm reference-class library that compounds',
    ],
  },
  discipline:
    'Lead the WEDGE KPIs on a call (immediately measurable). Name the MOAT KPIs as the direction, never as a number — DI cannot produce Taktile-style outcome statistics at n=1 with an outcome years out, and promising a measurement you cannot deliver is the credibility-killer.',
} as const;
