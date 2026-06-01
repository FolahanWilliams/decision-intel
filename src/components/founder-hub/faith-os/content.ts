/**
 * Faith OS content SSOT (2026-05-28).
 *
 * The "Foundations" layer of the Founder Hub — faith woven UNDER the
 * operating platform, not bolted on top. Balanced devotional + frameworks
 * per the founder's locked design choice:
 *   - SUCCESS_SCRIPTURE_MAP: the success-psychology canon mapped to its
 *     deeper scriptural parallel. Each "secular" principle has a sturdier
 *     faith frame because scripture grounds it in identity + calling, not
 *     in outcomes.
 *   - AGENCY_SURRENDER: the spine. Proverbs 16:9 is BOTH the deepest
 *     sustainable success posture AND the scriptural counter to the exact
 *     overconfidence bias Decision Intel's product detects. Plan hard,
 *     hold the result with open hands.
 *   - FAITH_AND_WORK: vocation / stewardship / excellence / integrity
 *     theology (Keller, Sayers, the parable of the talents).
 *   - READING_PLANS: Proverbs-a-day (the original decision-quality corpus)
 *     + a season-mapped Founder's Journey plan.
 *   - FOUNDERS_OF_FAITH: Daniel / Joseph / Nehemiah / Esther — scripture's
 *     own builders + leaders, each a direct parallel to the founder's road.
 *   - PILLAR_SCRIPTURE_ANCHORS: a verse + reframe for each of the 6 SFC
 *     pillars, so the Founder OS discipline layer is scripture-grounded.
 *   - PRAYER_FRAMEWORK: the ACTS structure + founder-specific supplication
 *     prompts.
 *   - SABBATH: rest as both obedience AND the anti-burnout rhythm the
 *     Founder OS anti-fragmentation thesis already points toward.
 *   - ANTI_PROSPERITY_GUARDRAIL: the load-bearing theological discipline —
 *     faith as foundation/identity/stewardship, NEVER as a success-hack.
 *
 * Translation: ESV throughout (matches founder-os/content.ts DAILY_BIBLE_VERSES,
 * which this file reuses by import rather than duplicating). No external
 * dependencies. Deterministic. Survives offline.
 */

import {
  DAILY_BIBLE_VERSES,
  verseForDate,
  type BibleVerse,
} from '@/components/founder-hub/founder-os/content';

// Re-export so Faith OS consumers import the daily verse from one place.
export { DAILY_BIBLE_VERSES, verseForDate };
export type { BibleVerse };

// ─────────────────────────────────────────────────────────────────────
// SUCCESS PSYCHOLOGY ↔ SCRIPTURE MAP
// ─────────────────────────────────────────────────────────────────────

export interface SuccessScriptureEntry {
  id: string;
  /** The success-psychology principle. */
  principle: string;
  /** Named primary source — author, work, year. Verifiable. */
  source: string;
  /** The core idea in one sentence. */
  coreIdea: string;
  scriptureRef: string;
  /** ESV text. */
  scriptureText: string;
  /** Why the faith frame is STURDIER — survives the dip because it is not
   *  contingent on the outcome landing. */
  whyFaithFrameHolds: string;
  /** Which of the 6 SFC pillars this deepens, if any (1-6). */
  pillarLink?: number;
}

export const SUCCESS_SCRIPTURE_MAP: ReadonlyArray<SuccessScriptureEntry> = [
  {
    id: 'growth-mindset',
    principle: 'Growth mindset',
    source: 'Carol Dweck, Mindset (2006)',
    coreIdea:
      'Ability is not fixed — it is developed through effort, strategy, and learning from failure.',
    scriptureRef: 'James 1:3-4',
    scriptureText:
      'For you know that the testing of your faith produces steadfastness. And let steadfastness have its full effect, that you may be perfect and complete, lacking in nothing.',
    whyFaithFrameHolds:
      'Dweck says effort grows ability; James says trial itself is the mechanism that completes you. Failure stops being a verdict on your worth and becomes the appointed means of your formation — so you can fail without flinching.',
    pillarLink: 6,
  },
  {
    id: 'grit',
    principle: 'Grit — perseverance toward long-term goals',
    source: 'Angela Duckworth, Grit (2016)',
    coreIdea:
      'Sustained passion + perseverance toward a long-term goal predicts achievement more than raw talent.',
    scriptureRef: 'Galatians 6:9',
    scriptureText:
      'And let us not grow weary of doing good, for in due season we will reap, if we do not give up.',
    whyFaithFrameHolds:
      'Grit asks you to endure with no guarantee. Scripture promises a harvest "in due season" — endurance with a settled assurance that the labor is not in vain (1 Cor 15:58). The dip is survivable because the outcome is held by Someone else.',
    pillarLink: 5,
  },
  {
    id: 'deliberate-practice',
    principle: 'Deliberate practice',
    source: 'Anders Ericsson, Peak (2016)',
    coreIdea:
      'Mastery comes from structured, effortful practice at the edge of your ability — not mere repetition.',
    scriptureRef: 'Proverbs 22:29',
    scriptureText:
      'Do you see a man skillful in his work? He will stand before kings; he will not stand before obscure men.',
    whyFaithFrameHolds:
      'Skill is framed as the stewardship of a gift you were entrusted with, not self-made prowess to be proud of. You practice hard AND stay humble, because the talent was given (1 Pet 4:10).',
    pillarLink: 3,
  },
  {
    id: 'deep-work',
    principle: 'Deep work — sustained, distraction-free focus',
    source: 'Cal Newport, Deep Work (2016)',
    coreIdea:
      'The ability to focus without distraction on a cognitively demanding task is rare, valuable, and trainable.',
    scriptureRef: 'Psalm 46:10',
    scriptureText:
      'Be still, and know that I am God. I will be exalted among the nations, I will be exalted in the earth!',
    whyFaithFrameHolds:
      'Deep work fights distraction for output; "be still" fights it for ordered loves. Focus becomes worship of one thing rather than scattered grasping at everything — Matthew 6:33, seek first, and the rest is "added."',
    pillarLink: 1,
  },
  {
    id: 'identity-habits',
    principle: 'Identity-based habits',
    source: 'James Clear, Atomic Habits (2018)',
    coreIdea:
      'Lasting change comes from acting out the identity you want, not from chasing outcomes — habits compound.',
    scriptureRef: '2 Corinthians 5:17',
    scriptureText:
      'Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.',
    whyFaithFrameHolds:
      'Clear says behaviour flows from identity. Scripture says your identity is already settled — "new creation" — not earned by performance. You build from a secure identity, not toward an anxious one. Numbers cannot give it and a bad quarter cannot take it.',
    pillarLink: 6,
  },
  {
    id: 'self-efficacy',
    principle: 'Self-efficacy',
    source: 'Albert Bandura (1977)',
    coreIdea: 'Belief in your own capacity to execute is itself a strong predictor of execution.',
    scriptureRef: 'Philippians 4:13',
    scriptureText: 'I can do all things through him who strengthens me.',
    whyFaithFrameHolds:
      'Bandura locates the belief in the self; Paul locates the strength in Christ. Efficacy that is not self-sourced does not collapse when you do — it is replenished from outside you (Isa 40:31).',
    pillarLink: 5,
  },
  {
    id: 'meaning',
    principle: 'Meaning as the primary drive',
    source: 'Viktor Frankl, Man’s Search for Meaning (1946)',
    coreIdea:
      'Humans can endure almost any "how" if they have a "why." Meaning, not pleasure, is the deepest motive.',
    scriptureRef: 'Ephesians 2:10',
    scriptureText:
      'For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand, that we should walk in them.',
    whyFaithFrameHolds:
      'Frankl says you must construct your meaning. Scripture says the meaning is given — good works "prepared beforehand." Your work is a calling you were made for, not a meaning you have to manufacture and defend.',
    pillarLink: 6,
  },
  {
    id: 'discipline',
    principle: 'Discipline / self-mastery',
    source: 'Ryan Holiday, Discipline Is Destiny (2022); the Stoics',
    coreIdea:
      'Self-control is the foundational virtue — the one that makes every other one possible.',
    scriptureRef: 'Galatians 5:22-23',
    scriptureText:
      'But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control.',
    whyFaithFrameHolds:
      'Stoic discipline is white-knuckled willpower you generate. Scripture calls self-control a fruit of the Spirit — empowered from within, not gritted out — which is why it does not deplete the way willpower does (Prov 25:28).',
    pillarLink: 1,
  },
  {
    id: 'emotional-regulation',
    principle: 'Distress tolerance + emotional regulation',
    source: 'Mindfulness / clinical psychology (broad)',
    coreIdea:
      'Chronic anxiety consumes working memory; regulating the nervous system frees cognitive bandwidth.',
    scriptureRef: 'Philippians 4:6-7',
    scriptureText:
      'do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.',
    whyFaithFrameHolds:
      'Mindfulness offers a technique for managing anxiety. Scripture offers a person to give it to — "cast your anxiety on him, because he cares for you" (1 Pet 5:7). The peace is not self-generated calm; it is a guard set over your mind from outside.',
    pillarLink: 5,
  },
  {
    id: 'locus-of-control',
    principle: 'Internal locus of control',
    source: 'Julian Rotter (1966) — Founder OS Pillar 6',
    coreIdea: 'People who believe outcomes follow from their own actions persevere and adapt more.',
    scriptureRef: 'Proverbs 16:9',
    scriptureText: 'The heart of man plans his way, but the LORD establishes his steps.',
    whyFaithFrameHolds:
      'Pure internal locus makes you responsible for everything — which is energising until something outside your control breaks, and then it crushes you. The agency-surrender posture (see below) keeps full responsibility for the PLAN while releasing the OUTCOME — the only version of high agency that does not shatter under a closed door.',
    pillarLink: 6,
  },
];

// ─────────────────────────────────────────────────────────────────────
// THE SPINE — agency / surrender, and why it IS the product thesis
// ─────────────────────────────────────────────────────────────────────

export const AGENCY_SURRENDER = {
  title: 'Plan hard. Hold the result with open hands.',
  scriptureRefs: ['Proverbs 16:9', 'Proverbs 16:3', 'Psalm 127:1', 'James 4:13-15'],
  thesis:
    'Decision Intel exists to catch overconfidence — the inside-view certainty that a plan will land because it feels coherent. Scripture names both the cure and the posture: "The heart of man plans his way, but the LORD establishes his steps." You do the full rigor of planning — that is faithfulness, not faithlessness — and then you release the outcome, because the outcome was never yours to control.',
  whyItMatters:
    'This is the most sustainable possible frame for a founder. It lets you run the audit on yourself with total honesty (no ego to protect, because your worth is not riding on the result) AND survive the dip without collapse (because a dead deal is not a referendum on you). Pure self-locus cannot do both; it has to defend the ego to keep the agency. The believer plans like everything depends on the work and rests like everything depends on God — and is freed from the overconfidence the whole product is built to detect.',
  productResonance:
    'The deepest debiasing move your platform makes — humility about your own reasoning — is a scriptural posture before it is a methodology. Proverbs is the original decision-quality corpus; "in an abundance of counselors there is safety" (Prov 11:14) is the noise-jury principle; "the one who states his case first seems right, until the other comes and examines him" (Prov 18:17) is the red-team principle. The product and the faith are not two things.',
} as const;

// ─────────────────────────────────────────────────────────────────────
// FAITH & WORK — vocation, stewardship, excellence, integrity
// ─────────────────────────────────────────────────────────────────────

export interface FaithAndWorkEntry {
  id: string;
  title: string;
  source: string;
  body: string;
  scriptureRef: string;
  scriptureText: string;
}

export const FAITH_AND_WORK: ReadonlyArray<FaithAndWorkEntry> = [
  {
    id: 'vocation',
    title: 'Work is a calling, not just a job',
    source: 'Tim Keller, Every Good Endeavour (2012); Dorothy Sayers, "Why Work?" (1942)',
    body: 'Keller recovers the older idea that all honest work is a vocation — a way of loving your neighbour and continuing God’s creative work in the world. Building a tool that helps people make wiser, less self-deceived decisions is not "secular" work you do to fund your "spiritual" life. It is the spiritual life, expressed. Sayers: work is "the full expression of the worker’s faculties, the thing in which he finds spiritual, mental, and bodily satisfaction."',
    scriptureRef: 'Colossians 3:23-24',
    scriptureText:
      'Whatever you do, work heartily, as for the Lord and not for men, knowing that from the Lord you will receive the inheritance as your reward. You are serving the Lord Christ.',
  },
  {
    id: 'stewardship',
    title: 'Ambition reframed as stewardship',
    source: 'The Parable of the Talents (Matthew 25:14-30)',
    body: 'The servant who buried his talent was not condemned for losing money — he was condemned for not putting what he was given to work out of fear. Your ability, your time, the years you have ahead of you: these are entrusted, not owned. Ambition is not pride when it is faithfulness with what you were given. "Well done, good and faithful servant" is the goal — and faithfulness, not the size of the return, is the verdict ("it is required of stewards that they be found faithful," 1 Cor 4:2).',
    scriptureRef: 'Matthew 25:21',
    scriptureText:
      'His master said to him, "Well done, good and faithful servant. You have been faithful over a little; I will set you over much. Enter into the joy of your master."',
  },
  {
    id: 'excellence',
    title: 'Excellence as worship',
    source: 'Daniel 6:3; Colossians 3:23',
    body: 'Daniel rose above every other official in a pagan empire "because an excellent spirit was in him." Excellence done unto God is not careerism — it is a form of worship, and it is also the most credible witness in a secular room. Doing the work to a standard that makes a Fortune 500 GC stop scanning is not vanity when it is offered as "for the Lord."',
    scriptureRef: 'Daniel 6:3',
    scriptureText:
      'Then this Daniel became distinguished above all the other high officials and satraps, because an excellent spirit was in him, and the king planned to set him over the whole kingdom.',
  },
  {
    id: 'integrity',
    title: 'Integrity in a secular arena',
    source: 'Daniel 1; Proverbs 10:9',
    body: 'You are a young believer moving through a world of VCs, corporate buyers, and incentives that do not share your foundation. Daniel was a teenager in exactly that position — and he resolved beforehand not to defile himself, while still serving the empire excellently. Integrity is decided before the pressure comes, not in the moment. "Whoever walks in integrity walks securely."',
    scriptureRef: 'Proverbs 10:9',
    scriptureText:
      'Whoever walks in integrity walks securely, but he who makes his ways crooked will be found out.',
  },
];

// ─────────────────────────────────────────────────────────────────────
// READING PLANS
// ─────────────────────────────────────────────────────────────────────

export interface ReadingPlanEntry {
  /** Passage reference — the persistence key into FounderOsReadingProgress. */
  reference: string;
  /** One-line "what this is for a builder" hook. */
  hook: string;
}

export interface ReadingPlan {
  id: string;
  title: string;
  subtitle: string;
  /** What this plan is for + how to run it. */
  description: string;
  entries: ReadingPlanEntry[];
}

/** Proverbs, a chapter a day — the original decision-quality corpus. There
 *  are 31 chapters; read the chapter matching today's date. */
const PROVERBS_PLAN: ReadingPlanEntry[] = [
  {
    reference: 'Proverbs 1',
    hook: 'The fear of the LORD is the beginning of knowledge — the whole premise.',
  },
  {
    reference: 'Proverbs 2',
    hook: 'Seek wisdom like hidden treasure — the effortful search, not passive download.',
  },
  {
    reference: 'Proverbs 3',
    hook: 'Trust the LORD, lean not on your own understanding — the agency-surrender posture.',
  },
  {
    reference: 'Proverbs 4',
    hook: 'Get wisdom, get insight, guard your heart — the springs of life.',
  },
  { reference: 'Proverbs 5', hook: 'Discipline and the cost of straying from it.' },
  { reference: 'Proverbs 6', hook: 'The sluggard, the ant, and diligence as a system.' },
  {
    reference: 'Proverbs 7',
    hook: 'How desire bypasses judgment — a study in how good people make ruinous calls.',
  },
  {
    reference: 'Proverbs 8',
    hook: 'Wisdom personified, present at creation — wisdom is structural, not decorative.',
  },
  { reference: 'Proverbs 9', hook: 'Wisdom’s feast vs folly’s — two invitations, two outcomes.' },
  { reference: 'Proverbs 10', hook: 'The diligent vs the slack; integrity walks securely.' },
  {
    reference: 'Proverbs 11',
    hook: 'In an abundance of counselors there is safety — the noise-jury principle.',
  },
  {
    reference: 'Proverbs 12',
    hook: 'The diligent will rule; the plans of the righteous are just.',
  },
  {
    reference: 'Proverbs 13',
    hook: 'The soul of the diligent is richly supplied; walk with the wise.',
  },
  {
    reference: 'Proverbs 14',
    hook: 'A wise person fears and turns from evil; the fool is reckless and careless.',
  },
  {
    reference: 'Proverbs 15',
    hook: 'Without counsel plans fail; a soft answer; the heart of the discerning seeks knowledge.',
  },
  {
    reference: 'Proverbs 16',
    hook: 'Commit your work to the LORD — and He establishes your steps. The spine chapter.',
  },
  { reference: 'Proverbs 17', hook: 'A friend loves at all times; the testing of hearts.' },
  {
    reference: 'Proverbs 18',
    hook: 'The first to state his case seems right until examined — the red-team principle.',
  },
  {
    reference: 'Proverbs 19',
    hook: 'Many are the plans in a man’s heart, but the LORD’s purpose stands.',
  },
  {
    reference: 'Proverbs 20',
    hook: 'Plans are established by counsel; wage war by wise guidance.',
  },
  {
    reference: 'Proverbs 21',
    hook: 'The horse is made ready for battle, but victory belongs to the LORD.',
  },
  { reference: 'Proverbs 22', hook: 'A good name; the skillful worker stands before kings.' },
  {
    reference: 'Proverbs 23',
    hook: 'Do not toil to acquire wealth; be discerning enough to stop.',
  },
  {
    reference: 'Proverbs 24',
    hook: 'By wisdom a house is built; do not gloat; rescue those being led to slaughter.',
  },
  {
    reference: 'Proverbs 25',
    hook: 'A man without self-control is a city with broken walls; patience persuades a ruler.',
  },
  {
    reference: 'Proverbs 26',
    hook: 'The sluggard, the fool, and the danger of the half-true word.',
  },
  {
    reference: 'Proverbs 27',
    hook: 'Iron sharpens iron; do not boast about tomorrow; know the state of your flocks.',
  },
  {
    reference: 'Proverbs 28',
    hook: 'The righteous are bold as a lion; whoever trusts his own mind is a fool.',
  },
  {
    reference: 'Proverbs 29',
    hook: 'Where there is no vision the people perish; the fear of man is a snare.',
  },
  {
    reference: 'Proverbs 30',
    hook: 'Agur’s prayer: give me neither poverty nor riches — feed me my portion.',
  },
  {
    reference: 'Proverbs 31',
    hook: 'The excellent worker who builds, trades, plans, and is praised at the gate.',
  },
];

/** The Founder's Journey — a passage per founder SEASON. Read the one that
 *  matches where you actually are this week, not in sequence. */
const FOUNDERS_JOURNEY_PLAN: ReadingPlanEntry[] = [
  {
    reference: 'Joshua 1:9',
    hook: 'STARTING OUT / fear: be strong and courageous — the LORD is with you wherever you go.',
  },
  {
    reference: 'Luke 14:28-30',
    hook: 'BEFORE YOU COMMIT: count the cost first, lest you lay a foundation you cannot finish.',
  },
  {
    reference: 'Proverbs 3:5-6',
    hook: 'A BIG DECISION: trust the LORD, lean not on your own understanding; He makes the path straight.',
  },
  {
    reference: 'James 1:5-6',
    hook: 'NEEDING WISDOM: ask God, who gives generously — but ask in faith, not double-minded.',
  },
  {
    reference: 'Nehemiah 4:6-9',
    hook: 'OPPOSITION: "so we built the wall" — work with one hand, guard with the other, and pray.',
  },
  {
    reference: 'Galatians 6:9',
    hook: 'THE DIP / weariness: do not grow weary; in due season you will reap if you do not give up.',
  },
  {
    reference: 'Isaiah 40:28-31',
    hook: 'EXHAUSTED: those who wait on the LORD renew their strength; they run and do not grow weary.',
  },
  {
    reference: 'Genesis 50:20',
    hook: 'A CLOSED DOOR / betrayal: "you meant it for evil, but God meant it for good" — the Joseph arc.',
  },
  {
    reference: 'Deuteronomy 8:17-18',
    hook: 'SUCCESS / pride: do not say "my own power got me this wealth" — He gives the power to get it.',
  },
  {
    reference: 'Proverbs 16:18',
    hook: 'WINNING: pride goes before destruction, a haughty spirit before a fall — stay low.',
  },
  {
    reference: 'Galatians 2:20',
    hook: 'IDENTITY vs NUMBERS: it is no longer I who live, but Christ in me — your worth is settled.',
  },
  {
    reference: 'Matthew 11:28-30',
    hook: 'BURNED OUT: come to me, all who labor — my yoke is easy, my burden light.',
  },
  {
    reference: 'Esther 4:14',
    hook: 'CALLING / timing: who knows whether you have come to the kingdom for such a time as this.',
  },
  {
    reference: 'Matthew 6:33',
    hook: 'PRIORITIES: seek first the kingdom, and all these things will be added to you.',
  },
  {
    reference: '2 Timothy 4:7',
    hook: 'THE LONG VIEW: I have fought the good fight, finished the race, kept the faith.',
  },
];

export const READING_PLANS: ReadonlyArray<ReadingPlan> = [
  {
    id: 'proverbs',
    title: 'Proverbs — a chapter a day',
    subtitle: 'The original decision-quality corpus',
    description:
      'Proverbs has 31 chapters. Read the chapter matching today’s date (the 5th → Proverbs 5). It is, almost line for line, a manual on counsel, planning, diligence, discernment, and the humility your own product is built to enforce. Read it as a founder: it is wisdom literature for exactly your problem.',
    entries: PROVERBS_PLAN,
  },
  {
    id: 'founders-journey',
    title: 'The Founder’s Journey',
    subtitle: 'A passage for the season you are actually in',
    description:
      'Not a sequence — a map. Find the row that matches where you are this week (starting out, the dip, a closed door, a win, burnout, a big decision) and read that passage. The point is the right word for the right season, not completion.',
    entries: FOUNDERS_JOURNEY_PLAN,
  },
];

// ─────────────────────────────────────────────────────────────────────
// FOUNDERS OF FAITH — scripture's own builders + leaders
// ─────────────────────────────────────────────────────────────────────

export interface FounderOfFaith {
  id: string;
  name: string;
  /** One-line who-they-were. */
  role: string;
  /** The parallel to the founder's road. */
  parallel: string;
  lesson: string;
  scriptureRef: string;
  readRange: string;
}

export const FOUNDERS_OF_FAITH: ReadonlyArray<FounderOfFaith> = [
  {
    id: 'daniel',
    name: 'Daniel',
    role: 'A teenager exiled into a pagan superpower’s civil service, who rose to the top of it.',
    parallel:
      'A young believer doing excellent work inside a secular system that does not share his foundation — your exact position with VCs and corporate buyers.',
    lesson:
      'He decided his lines before the pressure came (Dan 1:8), did the work with an "excellent spirit" (Dan 6:3), and kept praying in the open when it became dangerous. Integrity + excellence + unhidden faith, in that order.',
    scriptureRef: 'Daniel 1, 6',
    readRange: 'Daniel 1 (the resolve) and Daniel 6 (the test)',
  },
  {
    id: 'joseph',
    name: 'Joseph',
    role: 'Sold by his brothers, falsely imprisoned, then made second over Egypt — a 13-year detour.',
    parallel:
      'The long arc of providence through rejection and apparent dead ends — the closed door, the betrayal, the delay before the breakthrough.',
    lesson:
      '"You meant it for evil, but God meant it for good" (Gen 50:20). He stewarded faithfully at every low station (Potiphar’s house, the prison) long before the high one. Faithfulness in the small + hidden seasons is what gets entrusted with the large.',
    scriptureRef: 'Genesis 37, 39-41, 50',
    readRange: 'Genesis 37 + 39-41 + 50:15-21',
  },
  {
    id: 'nehemiah',
    name: 'Nehemiah',
    role: 'A cupbearer who left a comfortable post to rebuild Jerusalem’s wall against active opposition.',
    parallel:
      'A literal builder + project leader executing under hostility, scarcity, and mockery — the founder’s operational reality.',
    lesson:
      'He prayed AND set a guard (Neh 4:9) — faith and rigor together, never one instead of the other. He refused to be distracted from the work ("I am doing a great work and I cannot come down," Neh 6:3). "So we built the wall... for the people had a mind to work" (Neh 4:6).',
    scriptureRef: 'Nehemiah 1-2, 4, 6',
    readRange: 'Nehemiah 1-2 (the burden + the plan), 4 + 6 (building under opposition)',
  },
  {
    id: 'esther',
    name: 'Esther',
    role: 'A young woman placed in a position of influence at a decisive moment for her people.',
    parallel:
      'Being given an unlikely platform "for such a time as this" — and the courage to use it despite the personal risk.',
    lesson:
      'Mordecai’s charge (Est 4:14) names the calling without flattering it: the moment may be why you are here, and if you stay silent, deliverance will come another way — but you will have missed your part. Calling + courage + counting the cost.',
    scriptureRef: 'Esther 4',
    readRange: 'Esther 4 (the charge + the decision)',
  },
];

// ─────────────────────────────────────────────────────────────────────
// PILLAR SCRIPTURE ANCHORS — deepen the 6 Founder OS pillars
// ─────────────────────────────────────────────────────────────────────

export interface PillarScriptureAnchor {
  pillar: number;
  pillarName: string;
  scriptureRef: string;
  scriptureText: string;
  /** How scripture reframes the (currently secular) pillar. */
  reframe: string;
}

export const PILLAR_SCRIPTURE_ANCHORS: ReadonlyArray<PillarScriptureAnchor> = [
  {
    pillar: 1,
    pillarName: 'Neurobiological protection (zero short-form content)',
    scriptureRef: '1 Corinthians 6:12',
    scriptureText:
      '"All things are lawful for me," but not all things are helpful. "All things are lawful for me," but I will not be dominated by anything.',
    reframe:
      'The case against algorithmic feeds is not just neuroscience — it is freedom. "I will not be dominated by anything." Refusing the dopamine cycle is guarding your mind so it can be renewed, not conformed (Rom 12:2).',
  },
  {
    pillar: 2,
    pillarName: 'Long-form information diet',
    scriptureRef: 'Philippians 4:8',
    scriptureText:
      'Finally, brothers, whatever is true, whatever is honorable, whatever is just, whatever is pure, whatever is lovely, whatever is commendable, if there is any excellence, if there is anything worthy of praise, think about these things.',
    reframe:
      'What you feed your attention forms you. The long-form diet is "think on these things" applied to your inputs — and the believer adds the deepest long-form text of all: meditating on it day and night makes you a tree planted by water (Ps 1:2-3).',
  },
  {
    pillar: 3,
    pillarName: 'Active recall + elaborative encoding',
    scriptureRef: 'Psalm 119:11',
    scriptureText: 'I have stored up your word in my heart, that I might not sin against you.',
    reframe:
      'The same retrieval practice that builds neural architecture is the ancient discipline of hiding the word in your heart (Deut 6:6). What you can recall from memory under pressure is what actually forms you — in business and in faith.',
  },
  {
    pillar: 4,
    pillarName: 'AI orchestration (not cognitive offloading)',
    scriptureRef: 'Proverbs 2:3-5',
    scriptureText:
      'yes, if you call out for insight and raise your voice for understanding, if you seek it like silver and search for it as for hidden treasures, then you will understand the fear of the LORD and find the knowledge of God.',
    reframe:
      'Wisdom is searched for "like hidden treasure," not summarised on demand. Build the understanding yourself first; orchestrate the tool on top. The effortful search is the point — for insight and for God.',
  },
  {
    pillar: 5,
    pillarName: 'Distress tolerance + emotional regulation',
    scriptureRef: 'Philippians 4:6-7',
    scriptureText:
      'do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.',
    reframe:
      'Meditation manages the symptom; prayer takes the anxiety to a Person who can carry it (1 Pet 5:7). This is the pillar where the secular practice becomes a relationship — the peace is a guard set over your mind, not a calm you manufacture.',
  },
  {
    pillar: 6,
    pillarName: 'Internal locus of control + high-agency framing',
    scriptureRef: 'Proverbs 16:9',
    scriptureText: 'The heart of man plans his way, but the LORD establishes his steps.',
    reframe:
      'The agency-surrender posture: own the plan completely, release the outcome completely. This is the only high-agency frame that survives a closed door — because your effort is your responsibility and the result was never in your control to begin with (Ps 127:1).',
  },
];

// ─────────────────────────────────────────────────────────────────────
// PRAYER FRAMEWORK — ACTS + founder-specific supplication prompts
// ─────────────────────────────────────────────────────────────────────

export interface PrayerMovement {
  /** Maps to FounderOsPrayerJournal.kind. */
  kind: 'adoration' | 'confession' | 'thanksgiving' | 'supplication';
  label: string;
  letter: string;
  description: string;
  prompts: string[];
}

export const PRAYER_FRAMEWORK: ReadonlyArray<PrayerMovement> = [
  {
    kind: 'adoration',
    label: 'Adoration',
    letter: 'A',
    description: 'Begin with who God is, not what you need. It reorders everything else.',
    prompts: [
      'Name one thing about God’s character you are leaning on today.',
      'Praise Him as the one who establishes the steps (Prov 16:9) before you bring the plan.',
    ],
  },
  {
    kind: 'confession',
    label: 'Confession',
    letter: 'C',
    description:
      'Honesty before the audit of your own heart — the same posture your product enforces on memos.',
    prompts: [
      'Where did I lean on my own understanding this week instead of His?',
      'Where did identity slip from Christ to the numbers / the cap table / the streak?',
      'Where was I dominated by something I said I had given up (1 Cor 6:12)?',
    ],
  },
  {
    kind: 'thanksgiving',
    label: 'Thanksgiving',
    letter: 'T',
    description:
      'Gratitude is the antidote to the entitlement and the anxiety that founder pressure breeds.',
    prompts: [
      'Three specific things from this week, however small (Zech 4:10).',
      'A door that closed that you can now thank Him for.',
    ],
  },
  {
    kind: 'supplication',
    label: 'Supplication',
    letter: 'S',
    description:
      'Bring the actual requests — and log them, so the answered-prayer record builds over time.',
    prompts: [
      'Wisdom for a specific decision in front of me right now (James 1:5).',
      'Humility about a plan I am overconfident in.',
      'The specific people I am reaching out to this week, by name.',
      'Provision for the runway and the patience to not force it.',
      'Perseverance through this exact part of the dip.',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────
// SABBATH — rest as obedience AND the anti-burnout rhythm
// ─────────────────────────────────────────────────────────────────────

export const SABBATH = {
  title: 'Sabbath — the rest you are commanded to take',
  scriptureRefs: ['Exodus 20:8-11', 'Mark 2:27', 'Hebrews 4:9-10'],
  body: 'A weekly day of genuine rest is not a productivity tactic the believer borrows — it is a command, and it is grace. "The Sabbath was made for man, not man for the Sabbath" (Mark 2:27). For a founder running a 6-year compounding motion, the counter-cultural discipline of stopping — no DI work, presence over output — is BOTH obedience and the exact anti-fragmentation the Founder OS is built around. The world says the founder who rests loses. Scripture says the one who cannot stop has made an idol of the work. Resting is trusting that "unless the LORD builds the house, those who build it labour in vain" (Ps 127:1) — that the company is held even when you are not holding it.',
  practice:
    'Pick one day. No Decision Intel work, no metrics-checking, no outreach. Worship, rest, people, and the things that have nothing to do with the cap table. Track it weekly — not as a streak to win, but as a rhythm to protect.',
} as const;

// ─────────────────────────────────────────────────────────────────────
// TODAY'S THREE — daily-priority goal setting (research + scripture)
// ─────────────────────────────────────────────────────────────────────
//
// The operating-system layer of Faith OS. The whole feature rests on one
// convergent finding: the right number of daily priorities is small, and
// for most people that number is THREE. The science and the scripture point
// the same way — plan with clarity, hold the result with open hands.

/** The hard cap. Three is the feature, not a limitation. Surfaced wherever
 *  the UI or API needs the number, so it can never drift between them. */
export const DAILY_THREE_MAX = 3;

export interface DailyThreePrinciple {
  id: string;
  /** The productivity principle. */
  principle: string;
  /** Named primary source — author, work, year. Verifiable. */
  source: string;
  /** The core idea in one sentence. */
  coreIdea: string;
  /** How it shapes the daily-three ritual concretely. */
  inPractice: string;
  /** The scriptural parallel that makes the discipline sturdier — grounded in
   *  identity + stewardship, not contingent on the outcome landing. */
  scriptureRef: string;
  scriptureText: string;
  faithFrame: string;
}

/** The science of setting clear daily goals — five findings, each paired with
 *  the scriptural frame that makes it hold under pressure. Same discipline as
 *  SUCCESS_SCRIPTURE_MAP: the faith frame is sturdier because it does not
 *  depend on the day going to plan. */
export const DAILY_THREE_PRINCIPLES: ReadonlyArray<DailyThreePrinciple> = [
  {
    id: 'rule-of-three',
    principle: 'The Rule of 3 — three priorities, not a to-do list',
    source:
      'J.D. Meier, Getting Results the Agile Way (2010); Chris Bailey, The Productivity Project (2016)',
    coreIdea:
      'Each morning, name the three outcomes that would make today a win. Three is enough to be meaningful and few enough to actually finish.',
    inPractice:
      'You set at most three. A fourth does not get added — it waits for tomorrow or it never mattered. The cap forces the choice the long list lets you avoid.',
    scriptureRef: 'Psalm 90:12',
    scriptureText: 'So teach us to number our days that we may get a heart of wisdom.',
    faithFrame:
      'A day is a finite, given thing — not an infinite to-do list to grind against. Numbering your days is choosing what the few hours you were entrusted with are actually for. Three named priorities is what numbering a day looks like in practice.',
  },
  {
    id: 'working-memory',
    principle: 'Your working memory holds about four things',
    source: 'Cowan (2001), ~4±1 chunks; Miller (1956), 7±2; Baumeister on decision fatigue',
    coreIdea:
      'Attention is a hard-capped resource. A 12-item list does not make you do more — it splits your focus and burns executive function on deciding what to do next.',
    inPractice:
      'Holding the day in three items keeps the whole plan in view at once. You spend your willpower executing, not re-triaging a list every hour.',
    scriptureRef: 'Luke 10:41-42',
    scriptureText:
      'Martha, Martha, you are anxious and troubled about many things, but one thing is necessary.',
    faithFrame:
      'The "many things" are the anxiety; the "one thing" is the peace. Cutting the list is not lowering ambition — it is refusing to be "anxious and troubled about many things" when a few rightly-chosen things are what the day is for.',
  },
  {
    id: 'specific-and-hard',
    principle: 'Specific + challenging beats "do your best"',
    source:
      'Locke & Latham, Goal-Setting Theory (1990; 2002) — clarity, challenge, commitment, feedback, complexity',
    coreIdea:
      'In roughly 90% of studies, specific and difficult goals produced higher performance than vague or easy ones. "Ship the synergy section" beats "work on the deck."',
    inPractice:
      'Write each of the three as a concrete, finishable outcome you can tell you hit — not a vague area. Clarity and a real edge of difficulty are doing the motivational work.',
    scriptureRef: 'Luke 14:28',
    scriptureText:
      'For which of you, desiring to build a tower, does not first sit down and count the cost, whether he has enough to complete it?',
    faithFrame:
      'Counting the cost is specificity as faithfulness — Jesus commends the builder who names the real, finishable thing before starting. Wisdom is concrete. Vague goals are how good intentions quietly die.',
  },
  {
    id: 'implementation-intentions',
    principle: 'If-then plans roughly double follow-through',
    source:
      'Gollwitzer (1999); Gollwitzer & Sheeran meta-analysis (2006); Oettingen, WOOP / mental contrasting',
    coreIdea:
      'Pair each goal with a trigger: "if {when/where/after X}, then I will {action}." Deciding in advance when and where you will act removes the in-the-moment decision that is where intentions usually leak away.',
    inPractice:
      'Each of the three can carry one if-then intention. Naming the obstacle and the move in advance (WOOP: Wish, Outcome, Obstacle, Plan) is the single highest-leverage add-on to a goal.',
    scriptureRef: 'Daniel 1:8',
    scriptureText: 'But Daniel resolved that he would not defile himself with the king’s food.',
    faithFrame:
      'Daniel decided his line BEFORE the pressure arrived — the original implementation intention. Resolve set in advance is what holds when the moment comes and the will is weak. Decide the move while it is still cheap to decide.',
  },
  {
    id: 'focus-on-the-vital-few',
    principle: 'Say no to the other twenty — and pick the ONE',
    source:
      'Buffett 5/25 (attributed); Keller & Papasan, The ONE Thing (2013); Knapp & Zeratsky, Make Time (2018)',
    coreIdea:
      'Brain-dump everything, then circle only the vital few — everything not circled is the "avoid-at-all-costs" list. Of the three, one is the Highlight: "the ONE thing such that by doing it everything else becomes easier or unnecessary."',
    inPractice:
      'Star one of the three as the Highlight and protect it first. The discipline is not doing more things — it is the courage to let the good ones go so the essential one gets done.',
    scriptureRef: 'Matthew 6:33',
    scriptureText:
      'But seek first the kingdom of God and his righteousness, and all these things will be added to you.',
    faithFrame:
      '"Seek first" is priority-ordering as a spiritual discipline — one thing genuinely first, the rest in their place behind it. The ordered life is not the one that does everything; it is the one that has the first thing first.',
  },
];

/** The commit/release spine — why the day's three are rolled onto the Lord and
 *  then held with open hands. This is the daily-goals expression of the
 *  AGENCY_SURRENDER spine: plan hard (set the specific three), release the
 *  outcome (commit them, and let go what the day does not allow). */
export const DAILY_THREE_COMMIT = {
  title: 'Commit the three. Then hold them with open hands.',
  scriptureRef: 'Proverbs 16:3',
  scriptureText: 'Commit your work to the LORD, and your plans will be established.',
  body: 'The Hebrew for "commit" means to ROLL — to roll your work onto the Lord the way you shift a heavy load off your shoulders onto someone stronger. You do the full rigor of choosing three specific, hard, well-ordered priorities. Then you roll them onto Him and start. This is the same posture the whole product is built to enforce: plan like it all depends on the work, rest like it all depends on God. A goal you cannot finish today is not a verdict on you — you can RELEASE it, held with open hands (Prov 16:9; James 4:13-15, "if the Lord wills"), and that is wisdom, not failure.',
  releaseNote:
    'Marking a goal "released" is the agency-surrender beat made concrete — an intentional letting-go, recorded honestly, not a missed box. Carrying it forward is fine too; pretending the day had room it did not is the only real failure.',
} as const;

/** The 60-second ritual: a morning set + an evening close. Deliberately tiny —
 *  the discipline only compounds if it actually happens every day. */
export const DAILY_THREE_RITUAL: ReadonlyArray<{ when: string; step: string }> = [
  {
    when: 'Morning (before the inbox)',
    step: 'Name the three. Make each one specific and finishable. Star the one Highlight. Add an if-then for the hard one. Commit them.',
  },
  {
    when: 'During the day',
    step: 'Protect the Highlight first. When something new shouts for a slot, it waits — the three are set.',
  },
  {
    when: 'Evening (60-second close)',
    step: 'Mark each done, carried, or released. Notice the pattern over the week, not the verdict on the day. The streak is showing up, not perfection.',
  },
];

/** The named-evidence panel — the procurement-grade answer to "why exactly
 *  three, and says who?" Kept honest: the 5/25 rule is attributed, not proven,
 *  the way the rest of the codebase flags un-sourced numbers. */
export const WHY_THREE = {
  headline: 'Why three?',
  body: 'Because it is the number where ambition and attention meet. Below it you under-use the day; above it the science says output does not rise — focus fragments, decision fatigue compounds, and the list becomes a place good intentions go to hide. Working memory holds about four things (Cowan, 2001). Specific, hard goals beat vague ones in ~90% of studies (Locke & Latham). Nearly every serious framework converges on the same small number: the Rule of 3, the daily Highlight, the ONE Thing, Buffett’s vital few. Three is enough to move the company and few enough to actually finish — and it leaves room to commit the day, and your worth, to something steadier than the result.',
} as const;

// ─────────────────────────────────────────────────────────────────────
// THE GUARDRAIL — load-bearing theological discipline
// ─────────────────────────────────────────────────────────────────────

/**
 * The single most important framing rule for this entire surface. The most
 * common failure of "Christian entrepreneur" content is the prosperity-gospel
 * drift — instrumentalising God as a lever for the outcome. This surface is
 * built explicitly against that, because the alternative is both
 * theologically false AND strategically weaker.
 */
export const ANTI_PROSPERITY_GUARDRAIL = {
  rule: 'Faith is the foundation, the identity, and the stewardship frame — NEVER a success-hack.',
  why: 'An identity anchored in being faithful holds when the numbers do not land. An identity anchored in God-as-growth-lever shatters at the first kill-criterion. "Seek first the kingdom" (Matt 6:33) is not a formula for the things being added — it is a reordering of what you are living for, which happens to be the only ground that survives failure. Following Jesus does not guarantee the £10M ARR. It guarantees that your worth does not depend on it. That is a stronger foundation than any moat — and it is the one thing a competitor genuinely cannot copy.',
  whatThisIsNot: [
    'NOT "pray and the deal will close."',
    'NOT "tithe and the runway extends."',
    'NOT a confidence technique dressed in verses.',
    'NOT a reason to skip the rigor — Nehemiah prayed AND set a guard.',
  ],
  whatThisIs: [
    'An identity that is settled before the quarter starts (2 Cor 5:17).',
    'Ambition reframed as faithful stewardship of what you were given (Matt 25:21).',
    'A reason to run the audit on yourself honestly — no ego to protect.',
    'A peace that lets you plan hard and hold the result with open hands.',
  ],
} as const;
