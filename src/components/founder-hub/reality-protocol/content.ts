/**
 * 66-Day Protocol content SSOT (2026-06-14).
 *
 * The founder-private "choose reality" check-in tracker — the behavioural
 * scaffolding behind the personal operating plan ("The 66-Day Protocol",
 * docs/66-day-protocol.md). Two ~15-second check-ins a day grow a tree to full
 * bloom at day 66.
 *
 * LOAD-BEARING INVARIANTS (the entire point of the design — do not change):
 *   - The tree grows from SHOWING UP (check-ins), not from being perfect.
 *   - A slip is logged honestly but NEVER resets the tree or progress. There
 *     is no streak counter — the abstinence-violation trap ("the day's ruined,
 *     what's the point") is the real enemy, and a reset-counter manufactures it.
 *   - Exactly ONE morning question and ONE night mark in the FAST ritual.
 *     Friction is the enemy; the check-in must take ~15 seconds. No in-app AI
 *     chat (at the urge moment you want fewer screens and a faster action, not
 *     a conversation).
 *   - An OPTIONAL evening reflection (founder-decided 2026-06-15) adds
 *     descriptive multi-factor ratings + a note + a tomorrow intention + a
 *     read-only DETERMINISTIC trend view — so progress is visible and
 *     motivating. It is SEPARATE from the fast marks and NEVER feeds the tree:
 *     skipping it never reduces progress, the ratings never grade or gate the
 *     tree, and synthesis is trend math, never an AI coach. The check-in ritual
 *     above is untouched; this is an additive, opt-in layer that retires at 66.
 *   - Day 66 = graduation. The tool is built to retire, not to run forever.
 *
 * Verses are KJV (public domain). Translation choice is deliberate: the slip
 * anchor ("a just man falleth seven times, and riseth up again", Prov 24:16)
 * is quoted in KJV throughout the plan, so the pool stays KJV for consistency.
 *
 * Deterministic, no I/O. Edit the protocol copy here; every consumer imports.
 */

// ─────────────────────────────────────────────────────────────────────
// THE PROTOCOL — dates + cadence (the date anchor is load-bearing)
// ─────────────────────────────────────────────────────────────────────

/** Start of the 66-day window. 14 Jun + 66 days lands on 19 Aug 2026 — the
 *  day school resumes, the real finish line the founder chose. Hold the date
 *  loosely: a slip on day 37 does not break the alignment (falling and rising
 *  is part of the build). */
export const PROTOCOL_START_ISO = '2026-06-14';

/** The window length. Anchored on Lally et al. (2010): 66 days was the AVERAGE
 *  time to automaticity (range 18-254), not a deadline. The bloom is a marker. */
export const PROTOCOL_TOTAL_DAYS = 66;

/** Two check-ins a day (morning + night) → the full-bloom target. */
export const CHECKINS_TO_BLOOM = PROTOCOL_TOTAL_DAYS * 2;

/** The single morning question — and only one. The whole point: make the
 *  danger zone explicit BEFORE you're standing in it, while you're clear,
 *  instead of negotiating with yourself at 9pm when you've already lost. */
export const MORNING_QUESTION =
  'Where are you most likely to want to escape today — and what will you do instead?';

export const MORNING_PLACEHOLDER = 'e.g. 9pm in bed → read; phone stays in the hall';

// ─────────────────────────────────────────────────────────────────────
// THE TREE — growth stage labels (purely cosmetic; progress is the truth)
// ─────────────────────────────────────────────────────────────────────

export interface TreeStage {
  /** Lower bound of `progress` (0-1) at which this label applies. */
  min: number;
  label: string;
}

/** Ordered ascending by `min`. `stageLabelFor(progress)` picks the last entry
 *  whose `min` ≤ progress. */
export const TREE_STAGES: ReadonlyArray<TreeStage> = [
  { min: 0, label: 'A seed in the soil' },
  { min: 0.001, label: 'Sprouting' },
  { min: 0.1, label: 'Taking root' },
  { min: 0.3, label: 'Growing' },
  { min: 0.55, label: 'Strong and steady' },
  { min: 0.8, label: 'Beginning to blossom' },
  { min: 1, label: 'In full bloom' },
];

// ─────────────────────────────────────────────────────────────────────
// VERSES (KJV, public domain)
// ─────────────────────────────────────────────────────────────────────

export interface ProtocolVerse {
  ref: string;
  text: string;
}

export const VERSES: ReadonlyArray<ProtocolVerse> = [
  {
    ref: 'Lamentations 3:22-23',
    text: "It is of the Lord's mercies that we are not consumed... they are new every morning: great is thy faithfulness.",
  },
  {
    ref: 'Proverbs 25:28',
    text: 'He that hath no rule over his own spirit is like a city that is broken down, and without walls.',
  },
  {
    ref: '2 Timothy 1:7',
    text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.',
  },
  {
    ref: '1 Corinthians 10:13',
    text: 'God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape.',
  },
  {
    ref: 'Romans 12:2',
    text: 'Be not conformed to this world: but be ye transformed by the renewing of your mind.',
  },
  {
    ref: 'Galatians 5:22-23',
    text: 'But the fruit of the Spirit is love, joy, peace... meekness, temperance: against such there is no law.',
  },
  {
    ref: '1 Corinthians 6:12',
    text: 'All things are lawful unto me, but all things are not expedient... I will not be brought under the power of any.',
  },
  {
    ref: 'Psalm 119:9',
    text: 'Wherewithal shall a young man cleanse his way? by taking heed thereto according to thy word.',
  },
  {
    ref: 'Galatians 6:9',
    text: 'And let us not be weary in well doing: for in due season we shall reap, if we faint not.',
  },
  {
    ref: 'Proverbs 24:16',
    text: 'For a just man falleth seven times, and riseth up again.',
  },
  {
    ref: 'Psalm 1:3',
    text: 'He shall be like a tree planted by the rivers of water, that bringeth forth his fruit in his season.',
  },
  {
    ref: 'Romans 13:14',
    text: 'Put ye on the Lord Jesus Christ, and make not provision for the flesh, to fulfil the lusts thereof.',
  },
  {
    ref: '2 Corinthians 5:17',
    text: 'If any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
  },
  {
    ref: 'Joshua 1:9',
    text: 'Be strong and of a good courage; be not afraid... for the Lord thy God is with thee whithersoever thou goest.',
  },
  {
    ref: 'Isaiah 40:31',
    text: 'They that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles.',
  },
  {
    ref: 'Philippians 4:8',
    text: 'Whatsoever things are true... whatsoever things are pure... think on these things.',
  },
  {
    ref: 'James 1:12',
    text: 'Blessed is the man that endureth temptation: for when he is tried, he shall receive the crown of life.',
  },
  {
    ref: 'Psalm 119:11',
    text: 'Thy word have I hid in mine heart, that I might not sin against thee.',
  },
  {
    ref: '1 Peter 5:8',
    text: 'Be sober, be vigilant; because your adversary... walketh about, seeking whom he may devour.',
  },
  {
    ref: 'Philippians 4:13',
    text: 'I can do all things through Christ which strengtheneth me.',
  },
  {
    ref: 'Hebrews 12:1',
    text: 'Let us lay aside every weight, and the sin which doth so easily beset us, and let us run with patience the race.',
  },
  { ref: 'Romans 6:14', text: 'For sin shall not have dominion over you.' },
  {
    ref: 'Galatians 5:1',
    text: 'Stand fast therefore in the liberty wherewith Christ hath made us free, and be not entangled again.',
  },
  {
    ref: 'Matthew 6:33',
    text: 'Seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
  },
  {
    ref: 'Proverbs 3:5-6',
    text: 'Trust in the Lord with all thine heart... and he shall direct thy paths.',
  },
  {
    ref: 'Colossians 3:2',
    text: 'Set your affection on things above, not on things on the earth.',
  },
  {
    ref: 'Micah 7:8',
    text: 'Rejoice not against me, O mine enemy: when I fall, I shall arise.',
  },
  {
    ref: '1 John 5:4',
    text: 'Whatsoever is born of God overcometh the world: and this is the victory... even our faith.',
  },
  {
    ref: 'Psalm 46:1',
    text: 'God is our refuge and strength, a very present help in trouble.',
  },
  {
    ref: '1 Corinthians 9:27',
    text: 'But I keep under my body, and bring it into subjection.',
  },
  { ref: 'Ephesians 6:10', text: 'Be strong in the Lord, and in the power of his might.' },
  {
    ref: 'Proverbs 4:23',
    text: 'Keep thy heart with all diligence; for out of it are the issues of life.',
  },
  {
    ref: 'Romans 8:37',
    text: 'In all these things we are more than conquerors through him that loved us.',
  },
  {
    ref: 'Psalm 51:10',
    text: 'Create in me a clean heart, O God; and renew a right spirit within me.',
  },
  {
    ref: 'Philippians 1:6',
    text: 'He which hath begun a good work in you will perform it until the day of Jesus Christ.',
  },
  {
    ref: 'Jeremiah 17:8',
    text: 'He shall be as a tree planted by the waters... her leaf shall be green; and shall not be careful in the year of drought.',
  },
  {
    ref: 'Isaiah 41:10',
    text: 'Fear thou not; for I am with thee... I will strengthen thee; yea, I will help thee.',
  },
  {
    ref: '2 Corinthians 12:9',
    text: 'My grace is sufficient for thee: for my strength is made perfect in weakness.',
  },
  {
    ref: 'Psalm 37:5',
    text: 'Commit thy way unto the Lord; trust also in him; and he shall bring it to pass.',
  },
  {
    ref: '1 Corinthians 15:58',
    text: 'Be ye stedfast, unmoveable, always abounding in the work of the Lord... your labour is not in vain.',
  },
];

/** Refs (into VERSES) of the "rising" verses surfaced on a slip night — the
 *  reframe is the point: one fall is not the end. Prov 24:16 leads. */
export const RISING_VERSE_REFS: ReadonlyArray<string> = [
  'Proverbs 24:16',
  'Micah 7:8',
  'Lamentations 3:22-23',
  'Psalm 51:10',
  'Galatians 6:9',
  'Philippians 1:6',
];

// ─────────────────────────────────────────────────────────────────────
// THE PLAN — the reference that lives WITH the tool (collapsed by default)
// ─────────────────────────────────────────────────────────────────────

export interface Keystone {
  title: string;
  body: string;
  /** An applicable KJV anchor verse — "Thy word have I hid in mine heart"
   *  (Ps 119:11): the word kept close to guard in the moment. */
  verse: { ref: string; text: string };
}

/** The four keystones of the plan (§4 of the 66-Day Protocol). Read once,
 *  then run. Re-reading is not progress; the check-in is. */
export const KEYSTONES: ReadonlyArray<Keystone> = [
  {
    title: 'Cut the on-ramp, not just the destination',
    body: 'The phone does not come to the bed — it charges across the room at night, and social media gets a hard cap: 30 minutes a day, intentional not infinite. The feed is the on-ramp to the escape, so it is far cheaper to never start the chain than to break it at link four.',
    verse: {
      ref: 'Romans 13:14',
      text: 'Put ye on the Lord Jesus Christ, and make not provision for the flesh, to fulfil the lusts thereof.',
    },
  },
  {
    title: 'Kill the in-the-moment decision',
    body: 'The real pull is not having to decide what is next. So pre-decide: before the vulnerable window the next action is already chosen — a book, training, a build task, a walk. The morning question above IS this keystone.',
    verse: {
      ref: 'Daniel 1:8',
      text: 'But Daniel purposed in his heart that he would not defile himself.',
    },
  },
  {
    title: 'Rebuild the purpose engine',
    body: 'The streak that worked was not resistance, it was engagement — scripture, momentum, direction, and the urges went quiet on their own. The daily check-in ritual is the structural version of that.',
    verse: {
      ref: 'Matthew 6:33',
      text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
    },
  },
  {
    title: 'The slip protocol',
    body: 'A slip costs ten minutes. The belief that the day is ruined costs the day, and triggers the binge. So a slip is one data point: log it honestly, return to baseline immediately. No ruined-day tax, no reset.',
    verse: {
      ref: 'Proverbs 24:16',
      text: 'For a just man falleth seven times, and riseth up again.',
    },
  },
];

/** The scope of the protocol — not only porn. Escape in every form, with the
 *  feed as the on-ramp, and the explicit social-media target. "Stayed on track"
 *  at the night check-in means BOTH. The WHY is already carried by the loop +
 *  keystone 1; this just names the two concrete commitments. */
export const PROTOCOL_SCOPE =
  'This is not only about porn. The real target is escape in every form, and social media is the on-ramp to most of it. So there are two commitments, and "stayed on track" means both: the escape stays at zero, and social media stays under 30 minutes a day — intentional, not infinite. Cut the on-ramp and the whole chain rarely even starts.';

// ─────────────────────────────────────────────────────────────────────
// SCRIPTURE ANCHORS — a real, applicable KJV verse per part of the page
// ─────────────────────────────────────────────────────────────────────
//
// "Thy word have I hid in mine heart, that I might not sin against thee"
// (Psalm 119:11). The word kept close, section by section, to guard in the
// moment. Every text below is KJV, quoted accurately (ellipses preserve the
// real wording, never paraphrase). One SSOT; the tab renders these.

export interface AnchorVerse {
  ref: string;
  text: string;
}

export const ANCHOR_VERSES: Record<string, AnchorVerse> = {
  // The diagnosis — escape is a failure of self-rule; the walls are down.
  diagnosis: {
    ref: 'Proverbs 25:28',
    text: 'He that hath no rule over his own spirit is like a city that is broken down, and without walls.',
  },
  // The two commitments — not mastered by anything; the on-ramp capped.
  commitments: {
    ref: '1 Corinthians 6:12',
    text: 'All things are lawful unto me, but all things are not expedient... but I will not be brought under the power of any.',
  },
  // The loop — the escalation chain, named exactly.
  loop: {
    ref: 'James 1:14-15',
    text: 'But every man is tempted, when he is drawn away of his own lust, and enticed. Then when lust hath conceived, it bringeth forth sin.',
  },
  // What you are really building — a new creature; identity construction.
  identity: {
    ref: '2 Corinthians 5:17',
    text: 'If any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
  },
  // The Prince & King — you reap what you sow; trajectories compound.
  trajectory: {
    ref: 'Galatians 6:7',
    text: 'Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap.',
  },
  // Person A vs B — fruit comes from abiding/doing, not mere avoidance.
  person: {
    ref: 'John 15:5',
    text: 'He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.',
  },
  // Replace the time — the swept, empty house ends worse; fill the vacuum.
  replacement: {
    ref: 'Luke 11:25-26',
    text: 'And when he cometh, he findeth it swept and garnished... and the last state of that man is worse than the first.',
  },
  // The anti-goal — redeem the time; do not lose it to a thousand nights.
  antiGoal: {
    ref: 'Ephesians 5:16',
    text: 'Redeeming the time, because the days are evil.',
  },
  // The counter-voice — they think it strange you no longer run with them.
  counterVoice: {
    ref: '1 Peter 4:4',
    text: 'They think it strange that ye run not with them to the same excess of riot, speaking evil of you.',
  },
  // The cost of inaction — count the cost before you build the tower.
  cost: {
    ref: 'Luke 14:28',
    text: 'Which of you, intending to build a tower, sitteth not down first, and counteth the cost?',
  },
  // Episodic future thinking — the joy set before him powered the enduring.
  futureThinking: {
    ref: 'Hebrews 12:2',
    text: 'Looking unto Jesus... who for the joy that was set before him endured the cross, despising the shame.',
  },
  // The urge moment — there is always a way of escape.
  urge: {
    ref: '1 Corinthians 10:13',
    text: 'God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape.',
  },
  // The two-week wall — the strength returns; mount up, do not faint.
  energy: {
    ref: 'Isaiah 40:31',
    text: 'They that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary.',
  },
  // Accountability — won in the light, with another, not in isolation.
  accountability: {
    ref: 'James 5:16',
    text: 'Confess your faults one to another, and pray one for another, that ye may be healed.',
  },
  // The reason scripture anchors every part of this page.
  word: {
    ref: 'Psalm 119:11',
    text: 'Thy word have I hid in mine heart, that I might not sin against thee.',
  },
};

/**
 * Milestone reveals — the surprise that waits at a threshold, NOT a countdown.
 *
 * LOAD-BEARING (the founder's two constraints, held together): something novel
 * should be there at the grounds he names, AND "counting the days is counting
 * to fail." The resolution: each reveal is INVISIBLE until reached — no "N days
 * to go" anywhere, nothing to count toward. It fires the FIRST time the tree's
 * own day count (`state.dayNumber`, the show-up number already on screen — NOT
 * a new counter, NOT a clean-streak) crosses the threshold, then never nags
 * again. It is a moment, not a badge: a ground-crossing he becomes someone at,
 * never a streak to protect (the abstinence-violation trap the whole plan
 * avoids). KJV verses, quoted accurately. The day-66 reveal frames the close as
 * a sending, not a finish line — the tool retires, he does not (rule #5).
 */
export type MilestoneKind = 'ground' | 'threshold';
export interface ProtocolMilestone {
  /** Reveals the first time `dayNumber` reaches this. Sorted ascending. */
  day: number;
  kind: MilestoneKind;
  eyebrow: string;
  title: string;
  /** Body paragraphs. */
  lines: string[];
  verse: AnchorVerse;
}

export const PROTOCOL_MILESTONES: ReadonlyArray<ProtocolMilestone> = [
  {
    day: 14,
    kind: 'ground',
    eyebrow: 'New ground',
    title: 'Two weeks in.',
    lines: [
      'This is further than before. The roots are down now — you cannot see them, but the tree can no longer be pulled up the way it could on day three.',
      'There is no streak here to guard, and everything to keep building. You are not avoiding a thing; you are becoming someone. Whatever tomorrow holds, today already proved the man who shows up for two weeks is real. He is you.',
    ],
    verse: {
      ref: 'Jeremiah 17:7-8',
      text: 'Blessed is the man that trusteth in the LORD... For he shall be as a tree planted by the waters, and that spreadeth out her roots by the river, and shall not see when heat cometh, but her leaf shall be green.',
    },
  },
  {
    day: PROTOCOL_TOTAL_DAYS,
    kind: 'threshold',
    eyebrow: 'The threshold',
    title: 'Sixty-six days. The scaffolding comes off.',
    lines: [
      'This was never a finish line. You did not grow a tree — you became someone who tends one. The tool can retire now; you do not.',
      'Read the whole arc back, then plant the next thing. The discipline that built these days is yours to carry into everything else. Go in peace, and keep going.',
    ],
    verse: {
      ref: 'Numbers 6:24-26',
      text: 'The LORD bless thee, and keep thee: The LORD make his face shine upon thee, and be gracious unto thee: The LORD lift up his countenance upon thee, and give thee peace.',
    },
  },
];

/**
 * The reveal to surface now: the highest threshold already reached that has not
 * been seen, or null. Pure — `seen` is the list of milestone `day`s dismissed.
 * Returns the LARGEST reached-unseen so a fresh device past several thresholds
 * shows the most recent ground, not an old one. Dismissing one marks every
 * lower threshold seen too (caller), so an earlier reveal never trails a later.
 */
export function milestoneToReveal(
  dayNumber: number,
  seen: ReadonlyArray<number>
): ProtocolMilestone | null {
  let best: ProtocolMilestone | null = null;
  for (const m of PROTOCOL_MILESTONES) {
    if (dayNumber >= m.day && !seen.includes(m.day)) {
      if (best === null || m.day > best.day) best = m;
    }
  }
  return best;
}

/** The set of `day`s to mark seen when `shown` is dismissed — it + everything
 *  below it, so a lower reveal can never appear after a higher one. */
export function milestoneDaysAtOrBelow(shownDay: number): number[] {
  return PROTOCOL_MILESTONES.filter(m => m.day <= shownDay).map(m => m.day);
}

/** The anti-goal — one paragraph, because the founder responds to it (§6). */
export const ANTI_GOAL =
  'Version B does not lose the throne in a battle. There is no villain and no catastrophe. He loses it to roughly a thousand ordinary nights where reality was slightly boring and the easy route was right there, each costing almost nothing. Think about the interest rate on a thousand small escapes. That is what produces the smart, articulate, still-talking-about-the-company 30-year-old who never became dangerous. Not explosion. Erosion. The scary part is not that it is hard. It is that it is easy and nearly invisible.';

/**
 * The counter-voice — the opposite view someone will press on you: that none of
 * this is that deep, that you should ease off and rejoin the crowd. Named here
 * so it stops landing as doubt and starts reading as the predictable social
 * mechanism it is. The discipline (load-bearing): name the pull WITHOUT tipping
 * into contempt — discernment, not disdain. A crab-pull wants you lower; a real
 * friend wants you whole. The two-trap framing keeps it from becoming a license
 * to look down on people or climb alone (the failure mode of this very idea).
 */
export const COUNTER_VOICE = {
  title: 'The voices that want you average',
  body: 'When you start to climb — cutting the escape, building, aiming higher than the people around you — some of them will not cheer. They will pull. Not always from malice: your climb is a quiet indictment of their stasis, and it is easier to close the gap by dragging you down than by climbing themselves. It is the crab bucket — one crab leaving threatens what the whole bucket believes is possible. "It is not that deep" is not an analysis; it is an anaesthetic. It is built to make caring feel embarrassing, because if caring is embarrassing then their not-caring gets to feel like wisdom instead of what it usually is: resignation in a nicer coat.',
  /** The lines they use, translated — each one is their own ceiling, projected
   *  onto you. (Quoted speech keeps the natural contraction; the read does not.) */
  translations: [
    {
      line: "It's not that deep.",
      meaning: 'Your caring makes my not-caring uncomfortable.',
    },
    {
      line: "You're doing too much, you're being extra.",
      meaning: 'You are making the gap visible, and I would rather you did not.',
    },
    {
      line: "You're 16, relax, live a little.",
      meaning: 'I coasted at your age and I need you to as well, so my coasting feels normal.',
    },
    {
      line: 'Nobody actually lives like that.',
      meaning: 'I do not, so to me it cannot be real.',
    },
  ],
  /** Discernment, not contempt — the guardrail on the whole idea. */
  discernment:
    'Two traps, and most people fall into one. The first is internalising it — letting "not that deep" sand down your edge until you are back in the bucket, relieved to be understood again. The second is the opposite: deciding everyone is a crab, looking down on people, climbing alone and bitter. The way through is discernment, not contempt. Not every "take it easy" is a pull-down — some of it is real love that does not want you cruel to yourself, or burnt out. The test is simple: a crab-pull wants you LOWER; a real friend wants you WHOLE. Keep the few who want you whole close — this is what the accountability person is for — and let the rest pull at air.',
  /** The close — let the trajectory be the answer; the road is narrow by design. */
  close:
    'So do not argue with the crowd, do not try to convert them, and do not take their ceiling as your own. You can be average and understood, or exceptional and misunderstood — feeling the pull is just the toll on the second road, and feeling it means you are actually on it. Let the trajectory be the whole answer. The narrow road is narrow precisely because most will not walk it; being thought strange for not running with them is the named, expected cost of the climb, not a sign you are doing it wrong.',
} as const;

/**
 * The cost of inaction — what the feed actually costs (2026-06-16). Gives the
 * social-media ≤30-min commitment its WHY. Built on the REAL science from the
 * "Cost of Inaction" report (opportunity-cost neglect + Ward et al. 2017
 * proximity drain + attention residue), with the dollar figures deliberately
 * REFUSED as facts — the report's $-to-the-cent numbers are false precision
 * (arbitrary rate × assumed hours × fictional salary ramp). The ONE vivid
 * figure kept (`compounding`) is hedged exactly like the 21-day myth + the
 * "attributed to Einstein" line: the number is invented, the SHAPE is real.
 * (Founder-chosen "honest + one vivid figure".)
 */
export const COST_OF_INACTION = {
  title: 'What the feed actually costs',
  body: 'When people price their phone, they name the bill — the data plan, the fifty a month. That is opportunity-cost neglect: the explicit cost is concrete, so it dominates, and the real cost — the time — is abstract, so you round it to zero. But the time IS the price. Two or three hours a day pulled into a feed is not "free because the phone is already paid for." It is the most expensive thing you own, spent on the one product engineered to give nothing back. The cost was never the money. It is the compounding.',
  /** The one vivid figure — kept for motivation, hedged: invented number, real shape. */
  compounding:
    'Put a number on it, knowing the number is invented: value the hours at even a modest rate, pour them into building and skill instead, compound the gap across a career, and the difference between the man who reclaimed three hours a day and the man who fed them to the scroll runs comfortably into seven figures. Do not quote the figure — it is a fiction stacked on arbitrary assumptions. But the SHAPE is not a fiction. Erosion compounds exactly like interest, just pointed the wrong way.',
  /** The real, replicated anchor — proximity drains you even unused. */
  proximity:
    'And it taxes you even when you are not on it. Ward and colleagues (2017): people scored measurably lower on memory and problem-solving with their phone merely face-down on the desk — silenced, untouched — than with it in another room. Suppressing the automatic pull to check it burns the exact resource you need to think. This is why the phone leaves the room, not just the hand: the cost is paid by its presence, not only its use.',
  /** Attention residue — even a glance has a long tail. */
  residue:
    'Even a glance has a tail. Switching back from a distraction does not snap you back — the mind keeps idling on the interrupted thing, and the climb back to real depth takes far longer than the glance did. A feed checked "for one second" quietly costs the next twenty minutes of your actual mind.',
  /** The close — the antidote is structure, and you already hold most of it. */
  close:
    'So the antidote is not willpower, it is structure — and you already hold most of it. Phone in another room (the cost of presence, paid down). One person who knows (the pledge that makes quitting public). The only layer you have not set is a real stake on failure. You do not need more discipline. You need the easy path and the right path to be the same path.',
} as const;

/**
 * Episodic Future Thinking — the move that beats the urge (2026-06-16). The one
 * genuinely net-new, fully-defensible technique from the report: vividly
 * simulating the future self lowers delay discounting (a vague future is
 * discounted steeply, a vivid one barely at all). It is the concrete version of
 * the urge-question "what would the person I am building do" + the King/Prince
 * viz — instead of asking it abstractly, you SEE him. Used at the morning
 * question and the urge moment.
 */
export const EFT_TECHNIQUE = {
  title: 'See him — the move that beats the urge',
  body: 'The urge wins because its reward is vivid and now, while the future you are building for is abstract and far. So do not argue with the urge — out-vivid it. Instead of "I should not," picture HIM: the man at the end of these 66 days, and the years past them — what he has built, how his mind moves, who is around him, how it feels to be him. Hold it for ten seconds until it is real. The brain discounts a vague future steeply and a vivid one barely at all; making him concrete is what tips the scale.',
  /** The one-line cue for the morning question + the urge moment. */
  cue: 'At the morning question and the moment the urge hits: do not picture the thing you are resisting. Picture the King you are becoming, in detail — then ask what he does next.',
} as const;

/** The slip-night reframe shown inline after a slip is logged. */
export const SLIP_REFRAME =
  'One data point. The day is not ruined and your tree did not reset. Tomorrow you simply continue.';

/** What the evidence actually says — the honest research footing (§3). Kept
 *  short on purpose; the full version lives in docs/66-day-protocol.md. */
export const RESEARCH_NOTE =
  'The "21 days" rule is a myth (Maxwell Maltz, 1960, misread). The "66 days" is real but averaged — Lally et al. (2010): mean 66 days to automaticity, range 18-254, and missing a single day did not derail it. That last finding is what runs the slip rule: one miss is not a reset.';

// ─────────────────────────────────────────────────────────────────────
// THE DIAGNOSIS — what this actually is (the most motivating frame)
// ─────────────────────────────────────────────────────────────────────

/** The "same muscle" reframe (§1). The single most useful framing for the
 *  founder specifically: the 9pm relapse and the founder move of building
 *  another framework instead of running the real work are the SAME avoidance
 *  reflex — so this is not a side-quest from the company. */
export const DIAGNOSIS_REFRAME =
  'This is not a lust problem. It is an attention, boredom, and avoidance problem — the urge shows up when you are idle and slightly bored, and the second and third time are not even about pleasure, they are about not returning to reality. The deepest cut: the 9pm relapse and reaching for another framework instead of running the real work are the same reflex. So this is not a side-quest from the company. Win the 9pm rep and you are training the exact capacity the work depends on.';

/** Commonly attributed to Albert Einstein. The attribution is apocryphal (no
 *  primary source), so we display the honest "attributed to" hedge — same
 *  spirit as the 21-day-myth honesty above. The line still resonates, and this
 *  is a private motivational surface, so it earns its place. */
export const INSANITY_QUOTE = {
  text: 'Insanity is doing the same thing over and over again and expecting different results.',
  attribution: 'attributed to Albert Einstein',
} as const;

// ─────────────────────────────────────────────────────────────────────
// THE LOOP — the diagnosed escape cycle (rendered as a dynamic viz)
// ─────────────────────────────────────────────────────────────────────

export interface LoopStage {
  short: string;
  full: string;
  /** The on-ramp. Porn is the MIDDLE of the loop, not the start — the chain
   *  begins at the phone, so this is the leverage point: cut it here. */
  leverage?: boolean;
  /** Visual band: 'buildup' (the slide in) | 'damage' (the cost after escape). */
  band: 'buildup' | 'damage';
}

export const LOOP_STAGES: ReadonlyArray<LoopStage> = [
  {
    short: 'Idle + bored',
    full: 'Idle time — boredom, a little loneliness or uncertainty',
    band: 'buildup',
  },
  {
    short: 'Phone → feed',
    full: 'Phone → social media — the on-ramp',
    leverage: true,
    band: 'buildup',
  },
  {
    short: 'Attention fragments',
    full: 'Dopamine-seeking; attention fragments',
    band: 'buildup',
  },
  {
    short: 'The urge',
    full: 'The urge appears — the brain wins a negotiation, not a battle ("why not")',
    band: 'buildup',
  },
  { short: 'Escape', full: 'Escape', band: 'damage' },
  { short: 'Guilt', full: 'Guilt → reduced motivation', band: 'damage' },
  {
    short: 'Standards drop',
    full: "More feed, more escape; the day's standards quietly drop",
    band: 'damage',
  },
];

/** The leverage-point lesson the viz exists to make obvious. */
export const LOOP_LEVERAGE_NOTE =
  'Porn is not the start of the loop — it is the middle. The chain begins at the phone. Cut the on-ramp (phone out of the bedroom) and the loop never gets going.';

// ─────────────────────────────────────────────────────────────────────
// REPLACE THE TIME — the rewiring mechanism (build the King)
// ─────────────────────────────────────────────────────────────────────

/** The core growth mechanism the founder named: rewiring is not subtraction,
 *  it is REPLACEMENT. Removing the escape leaves a vacuum that pulls the old
 *  behaviour back; you crowd it out by pouring the reclaimed time into
 *  stimulating, useful, genuinely NEW things that build who you are becoming.
 *  This is the King's-inputs side of the Prince/King trajectory. */
export const REPLACEMENT_PRINCIPLE =
  'Removing the escape leaves a vacuum — and a vacuum pulls the old behaviour straight back. Rewiring is not subtraction, it is REPLACEMENT. Take the reclaimed time and attention and pour it into stimulating, useful, genuinely new things that build who you are becoming. You do not white-knuckle the urge away; you crowd it out by being busy becoming the King. Meaning out-competes escape every time.';

/** The King's inputs — the menu you replace the reclaimed time with. Weighted
 *  toward growth + new + stimulating (not just "distract yourself"): the daily
 *  fill AND the pre-decided urge-moment swap. */
export const CONSTRUCTION_SWAPS: ReadonlyArray<string> = [
  'Build or ship something on Decision Intel',
  'Learn a new skill — a course, a hard topic',
  'Read a real book (strategy, investing, scripture)',
  'Train hard — lift, run, pushups',
  'Create — write, record, design, play guitar',
  'Study — SAT, or something that stretches you',
  'Get outside and move; let the mind wander',
  'Have a real conversation — call a friend',
  'Voice-note the idea you keep avoiding',
  'Plan tomorrow before the day plans you',
];

// ─────────────────────────────────────────────────────────────────────
// THE URGE-MOMENT PROTOCOL — read this when tempted (System 2 online)
// ─────────────────────────────────────────────────────────────────────
//
// Distilled from the GPT + Claude conversations. The point is NOT to start a
// conversation (an AI confidant at the urge moment is just another screen to
// consume — the same avoidance in a nicer outfit). The point is a fast READ
// that pulls the slow, deliberate mind (System 2) back online: the urge runs
// on System 1, and System 1 loses its grip the moment you make it answer a
// real question. Read top to bottom, honestly, then act.

export interface UrgeTruth {
  title: string;
  body: string;
}

export const URGE_PROTOCOL = {
  /** First thing you see — permission to pause, and the calming fact, with the
   *  concrete timeframe (the most actionable anchor: a wave you can outlast,
   *  not a force you must defeat). */
  opener:
    'Stop. You do not have to do anything right now. Breathe, and read this slowly before you touch anything. The urge is a wave: it crests within minutes and passes on its own if you do not feed it — the spike is usually gone inside ten or fifteen. You are not trying to defeat it. You only have to outlast it.',

  /** HALT — the setup check you run BEFORE negotiating with the urge. Most of
   *  the time it is not really the escape you want; it is one of four states
   *  wearing a mask. Name the real state and the urge often just dissolves. */
  halt: 'First, check the setup. The urge almost always fires when you are Hungry, Angry, Lonely, or Tired — at night, in bed, alone, drained. Often it is not really about the escape at all; it is one of those four wearing a mask. Fix the actual state — eat, sleep, get up, call someone — and the urge frequently dissolves on its own.',

  /** Move first — the physical discharge that comes BEFORE any thinking. At
   *  peak charge you cannot reason your way calm; burn it down with the body
   *  for 30-60s, THEN read on. (Full menu + the why: `DISCHARGE_FIRST`.) */
  moveFirst:
    'If the charge is high, move your body before you read another word — leave the bed, 20 push-ups, cold water, step outside. Thirty seconds drops the activation to where the rest of this can actually reach you.',

  /** The decision-auditor questions. Answering them honestly, in order, is what
   *  forces System 2 online — and that alone usually dissolves the pull. */
  questions: [
    'What am I feeling right now — and what am I unwilling to feel? Boredom, restlessness, loneliness, uncertainty, the gap between who I am and who I want to be?',
    'What am I actually avoiding? What is the real task in front of me that I do not want to face?',
    'Is this a reality decision, or an escape decision?',
    'What would the person I am building toward do right now?',
    'How will tomorrow morning feel if I do this — and how will it feel if I do not?',
  ],

  /** The truths that hold under pressure. Behavioural economics + your own
   *  evidence, not willpower — these stay true no matter how you feel. */
  truths: [
    {
      title: 'The pleasure is a lie System 1 is telling you.',
      body: 'By the second and third time it does not even feel good — you said so yourself. Those reps were never about pleasure; they were about not returning to reality. So the "this will feel good" story is already false before you start.',
    },
    {
      title: 'This is the discount curve snapping.',
      body: 'Right now the near reward looks enormous and the cost looks like nothing. In an hour you will ask "why did I do that." That later question is your real preference talking — the version of you that is not being hijacked. Side with him.',
    },
    {
      title: 'You are not the customer. You are the product.',
      body: 'The feed and the on-ramp were engineered by people whose job is to harvest your attention and sell it. Resisting is not depriving yourself — it is refusing to be farmed. You know their motives. Act like someone who knows.',
    },
    {
      title: 'It is the same muscle.',
      body: 'This urge and the urge to build another framework instead of doing the real work are the same flinch: reach for the thing that removes the need to face something hard. Win this rep and you are training the exact capacity the whole company depends on.',
    },
    {
      title: 'The cost is erosion, not explosion.',
      body: 'One night is almost nothing. The interest rate on a thousand of them is the prince who never became king. You think in compounding — so apply it honestly to this.',
    },
  ] as ReadonlyArray<UrgeTruth>,

  /** The close — the one action, and the reassurance that opening this already
   *  was the hard part. */
  close:
    'The urge passes whether you feed it or not — but only one of those leaves you stronger tomorrow. Put the phone across the room and do the one thing you already chose. Opening this instead of the feed was the hard part, and you already did it.',

  /** If already mid-slip — read THIS instead of spiralling (the AVE reframe). */
  slipNote:
    'Already slipped? Then this is the most important moment, not the worst one. A slip costs ten minutes; the belief that "the day is ruined" costs the whole day and turns one into four. Mark it honestly below and continue — a just man falleth seven times, and riseth up again.',
} as const;

// ─────────────────────────────────────────────────────────────────────
// WHAT YOU ARE REALLY BUILDING — identity construction, not abstinence
// ─────────────────────────────────────────────────────────────────────
//
// The deepest reframe from the conversation: this is not a porn tracker. The
// tree does not represent abstinence — it represents IDENTITY CONSTRUCTION,
// and the system rewards BECOMING THE PERSON, not merely avoiding the
// behaviour. That is already true of the design (the tree grows from showing
// up; a slip never kills it). Surfaced here as reading + dynamic visualisation,
// NEVER as new trackers — the daily ritual stays one morning question + one
// night mark.

/** The headline identity reframe. */
export const IDENTITY_FRAME =
  'This is not a porn tracker. The tree does not stand for abstinence — it stands for who you are becoming. The real objective is a world-class mind; the escape is just one obstacle on the path. So the tree grows from SHOWING UP, and a slip never kills it: you did not become the old person, you made one poor decision.';

/** The tree-metaphor choice, three rows. Each day is a quiet vote between the
 *  two columns. (Seed/Stimulus · Compounding/Consumption · Growth/Escape.) */
export const CHOICE_TRIAD: ReadonlyArray<{ build: string; escape: string }> = [
  { build: 'Seed', escape: 'Stimulus' },
  { build: 'Compounding', escape: 'Consumption' },
  { build: 'Growth', escape: 'Escape' },
];

/** The Prince & King — two trajectories that compound apart. Every day's
 *  actions nudge one of them; the gap is invisible day to day and enormous
 *  over years. This is a VISUALISATION of why the small daily choice matters —
 *  NOT a tracked second timeline competing with the tree. */
export const TRAJECTORY = {
  kingLabel: 'The King',
  kingInputs: ['read', 'train', 'build', 'reflect', 'connect', 'pray'],
  princeLabel: 'The Prince',
  princeInputs: ['scroll', 'avoid', 'escape', 'consume'],
  caption:
    'Not because you are bad — because trajectories compound. The prince who never became king does not lose the throne in a battle. He loses it to a thousand ordinary nights.',
} as const;

/** Person A / Person B — why the tree rewards becoming the person, not merely
 *  avoiding the behaviour (the argument against a naive streak counter). */
export const PERSON_CONTRAST = {
  a: {
    label: 'Abstains, but empty',
    body: 'No escape — but all day scrolling, no purpose, no growth, no mission. A streak counter would reward this. It should not.',
  },
  b: {
    label: 'Builds, slips once',
    body: 'Reads, trains, builds, studies, prays, creates — and slips once after forty days. A streak counter would call this failure. It is not.',
  },
  verdict:
    'The system rewards becoming the person, not merely avoiding the behaviour. That is why your tree grows from engagement and honesty, and a slip is just data — never a reset.',
} as const;

// ─────────────────────────────────────────────────────────────────────
// THE TWO-WEEK WALL — energy surplus, discharge-first, accountability
// ─────────────────────────────────────────────────────────────────────
//
// Added 2026-06-15 from the founder's own report ("I can hit one or two weeks
// easy, then I become restless, full of energy I don't know what to do with")
// + the analysis that followed. The genuinely new finding vs the energy-only
// frame: the 2-week restlessness is the DRIVE returning (a milestone, not a
// warning) AND partly un-numbed feeling surfacing — so the move is not to
// DRAIN the surplus (a treadmill) but to DISCHARGE then FORGE it (invest it).
// All reading + copy — NO new tracked input, no AI, no second mark. Stays
// inside every load-bearing invariant above.

/** The two-week wall reframe — the most important thing to understand about
 *  the post-acute phase, and the thing the founder is living right now. */
export const ENERGY_SURPLUS = {
  title: 'The two-week wall',
  body: 'You can hit one or two weeks clean easily — then it gets harder, not easier: restless, full of energy you do not know what to do with. Understand this clearly, because it is the whole game: that is not the urge winning. It is your drive coming back online. For years the valve was always open, so you never had to HOLD your own charge; now it is returning all at once. And some of it is not even energy — it is the boredom, loneliness, and feeling you used to numb, surfacing to be felt for the first time. The restlessness is the gap between the old regulator being gone and the new life not yet load-bearing. Standing in that gap is not the obstacle. It is the work — the only place the new system ever gets built.',
  /** The forge-not-sink reframe — the reframe that changes the fight. */
  reframe:
    'So do not try to DRAIN the surplus — burning it off is a treadmill. INVEST it. That full, restless feeling is capital: the first time you are holding your own charge instead of spending it. Learning to hold it and aim it is the entire skill of the King. Forge, do not sink.',
} as const;

/** Discharge-first — the physical reset that precedes any thinking or forge.
 *  At peak charge System 1 is driving and your good arguments cannot reach it;
 *  30-60s of physical discharge drops the activation to where reasoning works.
 *  This is a physiological reset, NOT a distraction. Then pick a forge. */
export const DISCHARGE_FIRST: ReadonlyArray<string> = [
  'Leave the room — out of the bed, off the couch',
  '20 push-ups, or one hard 60-second set',
  'Cold water on the face, or a cold shower',
  'Walk outside — actually outside, not the hallway',
  'Three slow breaths, then move',
];

export const DISCHARGE_NOTE =
  'When the charge spikes you cannot reason your way calm — the urge runs on System 1 and your best arguments cannot reach it yet. So move the body FIRST: thirty to sixty seconds of physical discharge drops the activation to where thinking works again. A physiological reset, not a distraction. THEN pick a forge from the list below. Discharge, then build.';

/** Accountability — the single highest-leverage move, and the one thing a
 *  solo tree cannot do. The prior plan argued for privacy; this reverses it.
 *  Secrecy is part of the fuel; shame dies in the light. ONE human, not a
 *  broadcast. Won in relationship, not isolation (James 5:16). */
export const ACCOUNTABILITY = {
  title: 'The one thing the tree cannot do',
  body: 'This tool keeps you honest with yourself. What it cannot do is put you in the light with someone else — and that is the single most powerful move there is, because secrecy is part of the fuel. The privacy of the act is what protects it; shame dies the moment it is spoken to a person you respect. You do not need to broadcast it. You need ONE human — a mentor, an older brother, someone in your faith — who knows, and who you can text "rough night, still in the fight" without it becoming an event. The app holds you accountable to yourself; the person holds you accountable to someone else. You need both. This is won in relationship, not in isolation.',
} as const;

// ─────────────────────────────────────────────────────────────────────
// THE EVENING REFLECTION — optional, descriptive, never feeds the tree
// ─────────────────────────────────────────────────────────────────────
//
// Added 2026-06-15 (founder-decided, "richer daily score" — he wants to SEE
// the rebirth: visible progress on how his mind is growing is what motivates
// him, and that is a real, evidence-backed motivator). The discipline that
// keeps this from becoming a quantified-self spiral / a displacement:
//   - It is OPTIONAL and SEPARATE from the fast morning/night marks. Skipping
//     it never reduces progress and never blocks the daily ritual.
//   - The ratings are DESCRIPTIVE self-observations ("how was it"), NOT grades.
//     They NEVER feed the tree, never gate progress, never start a streak. The
//     tree still grows ONLY from showing up; a slip still grows it.
//   - Synthesis is DETERMINISTIC trend math (reflection-trends.ts), never an
//     in-app AI coach. Correlations require a real sample floor before showing.
//   - It retires at day 66 with the rest of the tool.

/** The factors of the evening reflection. Each is a 1-REFLECTION_SCALE_MAX
 *  DESCRIPTIVE rating (low → high anchors), never a grade. `id` MUST match the
 *  nullable column name on FounderOsRealityReflection + the field the route
 *  reads — a new factor is a new column + a new SSOT entry in lockstep. */
export interface ReflectionFactor {
  id: 'mind' | 'energy' | 'intention';
  label: string;
  /** Anchor at the bottom of the scale (value 1). */
  low: string;
  /** Anchor at the top of the scale (value REFLECTION_SCALE_MAX). */
  high: string;
  help: string;
}

// 1-10 (bumped from 1-5 on 2026-06-15 — the founder found the day varies more
// than five points capture). No migration: the Int? columns already hold 1-10,
// and the selector + sparkline + API validation all derive from this SSOT.
export const REFLECTION_SCALE_MAX = 10;

export const REFLECTION_FACTORS: ReadonlyArray<ReflectionFactor> = [
  {
    id: 'mind',
    label: 'Mind',
    low: 'Foggy, scattered',
    high: 'Clear, sharp',
    help: 'How clear and focused was your thinking today?',
  },
  {
    id: 'energy',
    label: 'Energy',
    low: 'Flat, drained',
    high: 'Charged, alive',
    help: 'How was your drive — and did you hold it and aim it, or did it run you?',
  },
  {
    id: 'intention',
    label: 'Intention',
    low: 'Pulled around',
    high: 'Deliberate',
    help: 'Did you run the day, or did the feed and the easy escape run you?',
  },
];

/** The framing for the reflection surface — descriptive, not a report card. */
export const REFLECTION_INTRO =
  'Optional, and separate from the check-in above. Rate the day as you actually noticed it — not how well you performed — and leave a line for yourself. None of this touches the tree; it is here so you can watch your mind grow over the 66 days.';

/** The two free-text prompts. `note` is the honest play-by-play; `tomorrow` is
 *  the if-then formed from today (Gollwitzer — a plan built from real data). */
export const REFLECTION_NOTE_PROMPT = 'How was today — your mind, your day? What did you notice?';
export const REFLECTION_TOMORROW_PROMPT =
  'One thing for tomorrow (e.g. "spent too long on the feed — phone stays in the hall after 8")';

/** The honest framing of the trend view — it shows the arc, it does not judge
 *  it, and it never claims a pattern off a handful of days. */
export const REFLECTION_TREND_NOTE =
  'Your own data, over time. The lines show the arc; they do not grade it. A pattern only shows once there is enough of it to mean something — noise dressed as insight is worse than nothing.';
