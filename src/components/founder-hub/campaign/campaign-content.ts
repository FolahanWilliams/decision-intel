/**
 * The Build — Faith OS campaign / progression SSOT (2026-06-01).
 *
 * A gamification LAYER over the founder's real mission, grounded in Scripture
 * as a business manual. Founder-private only (never the customer product).
 *
 * Design rules (load-bearing — these are why it doesn't become a dopamine casino):
 *   1. XP rewards ONLY controllable INPUTS (showing up, doing the motion) —
 *      never outcomes you don't control (a reply, a paid deal). That is the
 *      Faith OS anti-prosperity guardrail AND the research's intrinsic-motivation
 *      finding in one rule: faithfulness is the XP; outcomes are celebrated as
 *      badges/milestones when they come, held with open hands ("well done, good
 *      and faithful servant" — Matt 25:21; Prov 16:9).
 *   2. No leaderboards / social comparison — solo founder, N=1. The research's
 *      sustained-motivation levers are autonomy + mastery + progress + quests +
 *      instant feedback; those are what this uses.
 *   3. A broken streak is "released", never shame. No dark patterns, no FOMO.
 *   4. Everything DERIVES from already-logged data — no new tables, honest points.
 *
 * Levels are the Scripture builder arcs; each carries a real operating principle
 * (the Bible as a business manual, not only devotion).
 */

// ─── XP rules — INPUTS ONLY (the controllable, faithful work) ────────────

/** Per-action XP. Every entry is something the founder DOES, not an outcome.
 *  Conversions / replies / IRR are deliberately absent — those are badges. */
export const XP = {
  checkin: 10, // logged a daily checkin at all (showed up)
  sfcZeroDay: 10, // a day with zero short-form content
  deepWorkHour: 4, // per hour of deep work
  deepReadingHour: 6, // per hour of deep reading
  threeCommitted: 4, // committed one of the day's three to the Lord (Prov 16:3)
  threeDone: 8, // finished one of your OWN committed priorities (an input, not an outcome)
  reflection: 8, // evening reflection logged
  reading: 12, // a Scripture reading-plan passage marked
  prayer: 8, // a prayer-journal entry
  weeklyReview: 40, // the Sunday review
  periodGoal: 8, // set a weekly/quarterly rock
  contentLog: 15, // long-form encoded via active recall
  skillComplete: 100, // an irreplaceable skill acquired
  dmLogged: 20, // a wedge DM SENT + logged (the core motion; richly rewarded)
  auditRun: 15, // ran an audit on a memo
} as const;

// ─── Level arcs — the Scripture builders, each an operating principle ────

export interface LevelArc {
  level: number;
  /** Builder name. */
  name: string;
  /** The season in one phrase. */
  season: string;
  scriptureRef: string;
  /** The operating principle — the Bible as a business manual. */
  principle: string;
  /** Cumulative XP to ENTER this level. */
  xpThreshold: number;
}

export const LEVEL_ARCS: ReadonlyArray<LevelArc> = [
  {
    level: 1,
    name: 'Joshua',
    season: 'Begin — be strong and courageous',
    scriptureRef: 'Joshua 1:9',
    principle:
      'Starting is an act of courage, not certainty. Cross the river before you can see the far bank — show up, every day, scared or not.',
    xpThreshold: 0,
  },
  {
    level: 2,
    name: 'Nehemiah',
    season: 'Build the wall — work with one hand, guard with the other',
    scriptureRef: 'Nehemiah 4:6,9',
    principle:
      'Execute under opposition: "so we built the wall." Pray AND set a guard — faith and rigor together. Refuse the distraction: "I am doing a great work and cannot come down."',
    xpThreshold: 500,
  },
  {
    level: 3,
    name: 'Joseph',
    season: 'Steward the small — faithful in the hidden seasons',
    scriptureRef: 'Genesis 39:2-4',
    principle:
      'Be excellent in the prison before the palace. Faithfulness with little — the unglamorous daily reps no one sees — is what gets entrusted with much.',
    xpThreshold: 1500,
  },
  {
    level: 4,
    name: 'Daniel',
    season: 'Excellence + integrity in a secular arena',
    scriptureRef: 'Daniel 6:3-4',
    principle:
      'An "excellent spirit" that makes the room stop scanning — and lines decided BEFORE the pressure comes (Dan 1:8). Integrity is set in advance, not in the moment.',
    xpThreshold: 3500,
  },
  {
    level: 5,
    name: 'Solomon',
    season: 'Ask for wisdom — discern over the deal',
    scriptureRef: '1 Kings 3:9',
    principle:
      'Of everything you could ask for, ask for a discerning heart. Decision quality is the asset — "in an abundance of counselors there is safety" (Prov 11:14).',
    xpThreshold: 7000,
  },
  {
    level: 6,
    name: 'Esther',
    season: 'For such a time as this — courage at the gate',
    scriptureRef: 'Esther 4:14',
    principle:
      'The high-stakes ask, made with prepared courage. Count the cost, then walk in — the room you were given a platform for is the room you step into (the pitch, the embed, the close).',
    xpThreshold: 12000,
  },
  {
    level: 7,
    name: 'Paul',
    season: 'Finish the race — keep the faith',
    scriptureRef: '2 Timothy 4:7',
    principle:
      'The long compounding arc. "I have fought the good fight, finished the race, kept the faith." Endurance is the whole game; the harvest comes in due season (Gal 6:9).',
    xpThreshold: 20000,
  },
];

// ─── Quests — the real motion, framed as missions ───────────────────────

export type QuestCadence = 'daily' | 'weekly' | 'campaign';

export interface QuestDef {
  id: string;
  cadence: QuestCadence;
  label: string;
  /** The verse this mission runs on — Bible as manual. */
  scriptureRef: string;
  /** XP awarded when complete (daily/weekly only; campaign milestones are badges). */
  xp?: number;
}

export const DAILY_QUESTS: ReadonlyArray<QuestDef> = [
  {
    id: 'set_three',
    cadence: 'daily',
    label: "Set today's three",
    scriptureRef: 'Ps 90:12',
    xp: 15,
  },
  {
    id: 'commit_three',
    cadence: 'daily',
    label: 'Commit them to the Lord',
    scriptureRef: 'Prov 16:3',
    xp: 10,
  },
  {
    id: 'checkin',
    cadence: 'daily',
    label: 'Log your checkin (SFC-zero + pillars)',
    scriptureRef: '1 Cor 6:12',
    xp: 10,
  },
  {
    id: 'reading',
    cadence: 'daily',
    label: "Read today's Proverb / passage",
    scriptureRef: 'Ps 1:2-3',
    xp: 12,
  },
  {
    id: 'prayer',
    cadence: 'daily',
    label: 'Pray it through (ACTS)',
    scriptureRef: 'Phil 4:6-7',
    xp: 8,
  },
  {
    id: 'reflection',
    cadence: 'daily',
    label: 'Close the day — what moved, what blocked',
    scriptureRef: 'Lam 3:40',
    xp: 10,
  },
];

export const WEEKLY_QUESTS: ReadonlyArray<QuestDef> = [
  {
    id: 'week_three',
    cadence: 'weekly',
    label: "Set the week's three intentions",
    scriptureRef: 'Hab 2:2',
    xp: 20,
  },
  {
    id: 'dms',
    cadence: 'weekly',
    label: 'Send 5 wedge DMs (and log them)',
    scriptureRef: 'Prov 13:4',
    xp: 100,
  },
  {
    id: 'review',
    cadence: 'weekly',
    label: 'The Sunday review — 20 minutes',
    scriptureRef: 'Lam 3:40',
    xp: 40,
  },
  {
    id: 'checkin_5',
    cadence: 'weekly',
    label: 'Check in 5 of 7 days',
    scriptureRef: 'Prov 27:23',
    xp: 30,
  },
  {
    id: 'sabbath',
    cadence: 'weekly',
    label: 'Take the Sabbath — stop, trust, rest',
    scriptureRef: 'Mark 2:27',
    xp: 25,
  },
];

/** Weekly DM target — the wedge motion's heartbeat (GTM v3.5: 5-10/week). */
export const WEEKLY_DM_TARGET = 5;

// ─── Campaign milestones — the boss-fights (real gates; badges, not XP) ──

export interface CampaignMilestoneDef {
  id: string;
  label: string;
  /** Plain-language objective. */
  detail: string;
  scriptureRef: string;
  /** The target count the progress bar fills toward. */
  target: number;
  /** Which input the progress is measured in (for the UI label). */
  unit: string;
}

export const CAMPAIGN_MILESTONES: ReadonlyArray<CampaignMilestoneDef> = [
  {
    id: 'first_dm',
    label: 'Open the motion',
    detail: 'Log your first wedge DM. The motion only exists once it is running.',
    scriptureRef: 'Zech 4:10',
    target: 1,
    unit: 'DM logged',
  },
  {
    id: 'thirty_dms',
    label: 'The persistent ask',
    detail:
      'Log 30 wedge DMs. Pattern-match across enough conversations to know if the motion works.',
    scriptureRef: 'Luke 18:1',
    target: 30,
    unit: 'DMs logged',
  },
  {
    id: 'kill_floor',
    label: 'Clear the month-4 floor',
    detail:
      'Convert 5 paid Individuals — the Phase-1 kill floor. Below this by month 4 = halt-and-pivot.',
    scriptureRef: 'Gal 6:9',
    target: 5,
    unit: 'paid customers',
  },
  {
    id: 'graduation',
    label: 'Phase-1 graduation',
    detail: '8-12 paid retained 90+ days by month 6 — the wedge is real.',
    scriptureRef: 'Matt 25:21',
    target: 8,
    unit: 'retained customers',
  },
  {
    id: 'streak_30',
    label: 'Reset the baseline',
    detail:
      'A 30-day SFC-zero streak — the dopaminergic baseline reset that makes everything else possible.',
    scriptureRef: '1 Cor 6:12',
    target: 30,
    unit: 'day streak',
  },
];

// ─── Badges — meaningful unlocks (derived from real thresholds) ──────────

export interface BadgeDef {
  id: string;
  label: string;
  /** How it unlocks, in plain language. */
  how: string;
  scriptureRef: string;
}

export const BADGES: ReadonlyArray<BadgeDef> = [
  {
    id: 'first_steps',
    label: 'First Steps',
    how: 'Logged your first checkin',
    scriptureRef: 'Josh 1:9',
  },
  {
    id: 'week_streak',
    label: 'Faithful Week',
    how: '7-day SFC-zero streak',
    scriptureRef: 'Dan 1:8',
  },
  {
    id: 'month_streak',
    label: 'Baseline Reset',
    how: '30-day SFC-zero streak',
    scriptureRef: '1 Cor 6:12',
  },
  {
    id: 'first_dm',
    label: 'Motion Opened',
    how: 'Logged your first wedge DM',
    scriptureRef: 'Zech 4:10',
  },
  { id: 'ten_dms', label: 'On the Wall', how: '10 wedge DMs logged', scriptureRef: 'Neh 4:6' },
  {
    id: 'fifty_dms',
    label: 'The Persistent',
    how: '50 wedge DMs logged',
    scriptureRef: 'Luke 18:1',
  },
  { id: 'first_paid', label: 'First Fruits', how: 'First paid customer', scriptureRef: 'Prov 3:9' },
  {
    id: 'first_review',
    label: 'Examined Ways',
    how: 'First Sunday review',
    scriptureRef: 'Lam 3:40',
  },
  {
    id: 'reader',
    label: 'Tree by Water',
    how: '30 Scripture passages read',
    scriptureRef: 'Ps 1:3',
  },
  {
    id: 'pray_er',
    label: 'Without Ceasing',
    how: '50 prayers journalled',
    scriptureRef: '1 Thess 5:17',
  },
  {
    id: 'first_skill',
    label: 'Skilled Worker',
    how: 'First irreplaceable skill acquired',
    scriptureRef: 'Prov 22:29',
  },
  {
    id: 'highlight_master',
    label: 'The One Thing',
    how: '14 Highlights hit',
    scriptureRef: 'Luke 10:42',
  },
];

// ─── Proverbs operating principles — the Bible as a business manual ──────

export interface OperatingPrinciple {
  scriptureRef: string;
  text: string;
  /** How it applies to the actual work. */
  application: string;
}

/** A curated rotation of Proverbs-as-operating-principles, mapped to the real
 *  work: planning, counsel, diligence, integrity, communication (outreach),
 *  patience, humility. The "principle of the day" reads one of these. */
export const OPERATING_PRINCIPLES: ReadonlyArray<OperatingPrinciple> = [
  {
    scriptureRef: 'Proverbs 16:3',
    text: 'Commit your work to the LORD, and your plans will be established.',
    application:
      'Plan with full rigor, then roll the outcome onto God and start. The three you set today are the work; the result is His.',
  },
  {
    scriptureRef: 'Proverbs 11:14',
    text: 'Where there is no guidance, a people falls, but in an abundance of counselors there is safety.',
    application:
      'The noise-jury principle — your own product. Before a big call, get decorrelated counsel; do not trust the inside view alone.',
  },
  {
    scriptureRef: 'Proverbs 18:17',
    text: 'The one who states his case first seems right, until the other comes and examines him.',
    application:
      'The red-team principle. In every memo and every pitch, steelman the other side before you commit.',
  },
  {
    scriptureRef: 'Proverbs 13:4',
    text: 'The soul of the sluggard craves and gets nothing, while the soul of the diligent is richly supplied.',
    application:
      'The DMs do not send themselves. Diligence is the daily reps — five to ten, every week, logged.',
  },
  {
    scriptureRef: 'Proverbs 27:23',
    text: 'Know well the condition of your flocks, and give attention to your herds.',
    application:
      'Know your numbers cold — the ledger, the runway, the funnel. Attention to the real state, not the story you prefer.',
  },
  {
    scriptureRef: 'Proverbs 16:9',
    text: 'The heart of man plans his way, but the LORD establishes his steps.',
    application:
      'High agency on the plan, open hands on the outcome. The only posture that survives a closed door.',
  },
  {
    scriptureRef: 'Proverbs 15:1',
    text: 'A soft answer turns away wrath, but a harsh word stirs up anger.',
    application:
      'Outreach + objection-handling: lead with the buyer’s pain in their words, never accusation. Tone is leverage.',
  },
  {
    scriptureRef: 'Proverbs 21:5',
    text: 'The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty.',
    application:
      'Compounding beats sprinting. Steady disciplined reps over six months, not a heroic week then collapse.',
  },
  {
    scriptureRef: 'Proverbs 10:9',
    text: 'Whoever walks in integrity walks securely, but he who makes his ways crooked will be found out.',
    application:
      'Procurement-grade honesty: never overclaim (SOC 2, Brier, "signed"). The honest disclosure is the moat.',
  },
  {
    scriptureRef: 'Proverbs 19:21',
    text: 'Many are the plans in the mind of a man, but it is the purpose of the LORD that will stand.',
    application:
      'Hold the roadmap loosely. Run the experiment, watch the tripwires, let the evidence — not the ego — pick the path.',
  },
  {
    scriptureRef: 'Proverbs 24:27',
    text: 'Prepare your work outside; get everything ready for yourself in the field, and after that build your house.',
    application:
      'Sequence matters: the wedge funds the bridge, the bridge unlocks the ceiling. Do the foundation before the upside.',
  },
  {
    scriptureRef: 'Proverbs 22:29',
    text: 'Do you see a man skillful in his work? He will stand before kings.',
    application:
      'Deliberate practice on the irreplaceable skill. Excellence is what gets you the room with the F500 GC.',
  },
];

/** Deterministic principle-of-the-day from the local date (no RNG, SSR-safe). */
export function principleForDate(iso: string): OperatingPrinciple {
  const [y, m, d] = iso.split('-').map(Number);
  const dayNum = (y || 2026) * 372 + (m || 1) * 31 + (d || 1);
  return OPERATING_PRINCIPLES[dayNum % OPERATING_PRINCIPLES.length];
}
