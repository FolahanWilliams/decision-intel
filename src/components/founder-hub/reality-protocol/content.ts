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
 *   - Exactly ONE morning question and ONE night mark. Friction is the enemy;
 *     the check-in must take ~15 seconds. No extra inputs, no "reality score",
 *     no second timeline, no in-app AI chat (at the urge moment you want fewer
 *     screens and a faster action, not a conversation).
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
}

/** The four keystones of the plan (§4 of the 66-Day Protocol). Read once,
 *  then run. Re-reading is not progress; the check-in is. */
export const KEYSTONES: ReadonlyArray<Keystone> = [
  {
    title: 'Cut the on-ramp, not just the destination',
    body: 'The phone does not come to the bed — it charges across the room at night, and social media gets a hard cap: 30 minutes a day, intentional not infinite. The feed is the on-ramp to the escape, so it is far cheaper to never start the chain than to break it at link four.',
  },
  {
    title: 'Kill the in-the-moment decision',
    body: 'The real pull is not having to decide what is next. So pre-decide: before the vulnerable window the next action is already chosen — a book, training, a build task, a walk. The morning question above IS this keystone.',
  },
  {
    title: 'Rebuild the purpose engine',
    body: 'The streak that worked was not resistance, it was engagement — scripture, momentum, direction, and the urges went quiet on their own. The daily check-in ritual is the structural version of that.',
  },
  {
    title: 'The slip protocol',
    body: 'A slip costs ten minutes. The belief that the day is ruined costs the day, and triggers the binge. So a slip is one data point: log it honestly, return to baseline immediately. No ruined-day tax, no reset. A just man falleth seven times, and riseth up again (Proverbs 24:16).',
  },
];

/** The scope of the protocol — not only porn. Escape in every form, with the
 *  feed as the on-ramp, and the explicit social-media target. "Stayed on track"
 *  at the night check-in means BOTH. The WHY is already carried by the loop +
 *  keystone 1; this just names the two concrete commitments. */
export const PROTOCOL_SCOPE =
  'This is not only about porn. The real target is escape in every form, and social media is the on-ramp to most of it. So there are two commitments, and "stayed on track" means both: the escape stays at zero, and social media stays under 30 minutes a day — intentional, not infinite. Cut the on-ramp and the whole chain rarely even starts.';

/** The anti-goal — one paragraph, because the founder responds to it (§6). */
export const ANTI_GOAL =
  'Version B does not lose the throne in a battle. There is no villain and no catastrophe. He loses it to roughly a thousand ordinary nights where reality was slightly boring and the easy route was right there, each costing almost nothing. Think about the interest rate on a thousand small escapes. That is what produces the smart, articulate, still-talking-about-the-company 30-year-old who never became dangerous. Not explosion. Erosion. The scary part is not that it is hard. It is that it is easy and nearly invisible.';

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
  /** First thing you see — permission to pause, and the calming fact. */
  opener:
    'Stop. You do not have to do anything right now. Breathe, and read this slowly before you touch anything. The urge is a wave: it peaks and passes on its own if you do not feed it.',

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
