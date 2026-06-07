/**
 * SAT Prep — pure SSOT (no I/O, no JSX).
 *
 * The methodology + taxonomy the founder-private SAT surface is built on.
 * Everything that could drift (skill tags, root-cause set, score targets, XP
 * rules, the study-plan phases) lives HERE; the API routes, the calibration
 * math, and the UI all read from this file.
 *
 * Design principles baked in (evidence-based, founder is AP-Psych + bias-thesis
 * literate so these are named at the mechanism level):
 *   - Retrieval practice over re-reading (Roediger & Karpicke; the founder's own
 *     Boomerang/overconfidence finding — awareness ≠ improvement).
 *   - Spacing + interleaving (SM-2 on vocab + recurring error patterns).
 *   - Root-cause error analysis, not just "got it wrong".
 *   - Calibration: tag confidence BEFORE answering, Brier-score the gap (the
 *     Decision Intel reasoning-audit lens applied to the test-taker).
 *   - Weak-area-weighted time: minutes flow to the highest-error / lowest-
 *     calibration skills, not equal blocks.
 *   - Math-to-ceiling-then-R&W: lock the trainable section near-perfect first.
 *
 * Source-of-truth discipline: AI-generated drills are for targeted reps on a
 * diagnosed weak skill ONLY. Official Bluebook/Khan/released tests are the sole
 * source of the projected score (AI questions are off-distribution at the 1550
 * ceiling). That split is enforced in the data model (SatTestResult vs the
 * in-app drills) and must never blur.
 */

export type SatSection = 'rw' | 'math';

export const SAT_SECTIONS: Record<SatSection, { id: SatSection; label: string; max: number }> = {
  rw: { id: 'rw', label: 'Reading & Writing', max: 800 },
  math: { id: 'math', label: 'Math', max: 800 },
};

export interface SatSkill {
  id: string;
  section: SatSection;
  /** College Board content domain. */
  domain: string;
  label: string;
}

/**
 * Digital SAT content domains + sub-skills (College Board, post-2024 adaptive
 * format). The error-log `skill` field references `SatSkill.id`. This is the
 * weak-area-weighting axis.
 */
export const SAT_SKILLS: SatSkill[] = [
  // ── Reading & Writing ──────────────────────────────────────────────
  {
    id: 'central_ideas',
    section: 'rw',
    domain: 'Information & Ideas',
    label: 'Central Ideas & Details',
  },
  {
    id: 'command_of_evidence',
    section: 'rw',
    domain: 'Information & Ideas',
    label: 'Command of Evidence',
  },
  { id: 'inferences', section: 'rw', domain: 'Information & Ideas', label: 'Inferences' },
  { id: 'words_in_context', section: 'rw', domain: 'Craft & Structure', label: 'Words in Context' },
  {
    id: 'text_structure_purpose',
    section: 'rw',
    domain: 'Craft & Structure',
    label: 'Text Structure & Purpose',
  },
  {
    id: 'cross_text_connections',
    section: 'rw',
    domain: 'Craft & Structure',
    label: 'Cross-Text Connections',
  },
  {
    id: 'rhetorical_synthesis',
    section: 'rw',
    domain: 'Expression of Ideas',
    label: 'Rhetorical Synthesis',
  },
  { id: 'transitions', section: 'rw', domain: 'Expression of Ideas', label: 'Transitions' },
  {
    id: 'boundaries',
    section: 'rw',
    domain: 'Standard English Conventions',
    label: 'Boundaries (Punctuation)',
  },
  {
    id: 'form_structure_sense',
    section: 'rw',
    domain: 'Standard English Conventions',
    label: 'Form, Structure & Sense (Grammar)',
  },
  // ── Math ───────────────────────────────────────────────────────────
  {
    id: 'linear_equations',
    section: 'math',
    domain: 'Algebra',
    label: 'Linear Equations & Inequalities',
  },
  { id: 'systems', section: 'math', domain: 'Algebra', label: 'Systems of Equations' },
  {
    id: 'nonlinear',
    section: 'math',
    domain: 'Advanced Math',
    label: 'Nonlinear Equations & Functions',
  },
  { id: 'quadratics', section: 'math', domain: 'Advanced Math', label: 'Quadratics & Polynomials' },
  {
    id: 'ratios_rates',
    section: 'math',
    domain: 'Problem-Solving & Data',
    label: 'Ratios, Rates & Proportions',
  },
  {
    id: 'percentages',
    section: 'math',
    domain: 'Problem-Solving & Data',
    label: 'Percentages & Units',
  },
  {
    id: 'statistics',
    section: 'math',
    domain: 'Problem-Solving & Data',
    label: 'Statistics & Probability',
  },
  {
    id: 'geometry',
    section: 'math',
    domain: 'Geometry & Trig',
    label: 'Area, Volume, Lines & Angles',
  },
  {
    id: 'trigonometry',
    section: 'math',
    domain: 'Geometry & Trig',
    label: 'Right Triangles & Trigonometry',
  },
];

export const SAT_SKILL_BY_ID: Record<string, SatSkill> = Object.fromEntries(
  SAT_SKILLS.map(s => [s.id, s])
);

export function skillsForSection(section: SatSection): SatSkill[] {
  return SAT_SKILLS.filter(s => s.section === section);
}

/**
 * Root-cause taxonomy. The single highest-leverage upgrade over generic prep:
 * naming WHY a question was missed routes it to the right fix.
 *   - content_gap → study the concept (drill + flashcard)
 *   - careless    → process discipline (re-read the question, check work)
 *   - misread     → comprehension under time (slow the first read)
 *   - timing      → pacing (the question was right but rushed/abandoned)
 *   - trap        → the test baited a System-1 pattern-match (the calibration gold)
 */
export const SAT_ROOT_CAUSES = [
  {
    id: 'content_gap',
    label: 'Content gap',
    fix: 'Study the concept — drill it + add a flashcard.',
  },
  {
    id: 'careless',
    label: 'Careless',
    fix: 'Process discipline — re-read the prompt, check the work.',
  },
  { id: 'misread', label: 'Misread', fix: 'Comprehension under time — slow the first read.' },
  { id: 'timing', label: 'Timing', fix: 'Pacing — you knew it but rushed or ran out of clock.' },
  {
    id: 'trap',
    label: 'Fell for a trap',
    fix: 'System-1 baited — the highest-ROI pattern to drill.',
  },
] as const;

export type SatRootCause = (typeof SAT_ROOT_CAUSES)[number]['id'];

export const SAT_ROOT_CAUSE_IDS = SAT_ROOT_CAUSES.map(r => r.id);

/** Pre-answer confidence levels (the calibration tag). */
export const SAT_CONFIDENCE_LEVELS = [
  { value: 0, label: 'Pure guess' },
  { value: 1, label: 'Unsure' },
  { value: 2, label: 'Fairly sure' },
  { value: 3, label: 'Certain' },
] as const;

export const SAT_TEST_SOURCES = [
  { id: 'bluebook', label: 'Official Bluebook' },
  { id: 'khan', label: 'Khan Academy (official)' },
  { id: 'released', label: 'Released paper/PDF test' },
  { id: 'real_sat', label: 'Real SAT sitting' },
] as const;

/** Score goal config — the founder's target + the section strategy. */
export const SAT_GOAL = {
  baselinePsat: 1280,
  /** Real PSAT section split (Oct 2025): R&W is the STRONGER half, Math the weaker. */
  baselineRW: 660,
  baselineMath: 620,
  targetTotal: 1550,
  /**
   * Math is the more-trainable section AND the weaker half (620 vs R&W 660), so it is
   * the biggest point reservoir — push it first. Within Math, Advanced Math (PSAT band
   * 470–540) is the standout weakness; Algebra (610–670, 35% of the section) is second.
   */
  mathCeilingTarget: 790,
  rwTarget: 760,
  /** Test cadence: Sept benchmark (live conditions) → Nov score that counts. Stanford superscores. */
  benchmarkMonth: 'September',
  targetMonth: 'November',
  dailyMinutes: 30,
} as const;

/**
 * The real PSAT/NMSQT baseline (grade 10, Oct 8 2025) — the honest starting
 * point the whole plan targets, and the single source of truth for the section
 * split + per-domain bands. The `band` values are the "Knowledge and Skills"
 * performance bands from the score report; lower band = higher ROI. This is
 * REFERENCE: the live weak-area map is still built from logged misses. It tells
 * day-one drilling where to weight before the Bluebook diagnostic refines it.
 *
 * The standout finding: Advanced Math (470–540) sits ~140 pts below every other
 * domain AND is 32.5% of the Math section — the single biggest score lever.
 */
export const SAT_PSAT_BASELINE = {
  date: '2025-10-08',
  total: 1280,
  rw: 660,
  math: 620,
  selectionIndex: 194,
  domains: {
    rw: [
      { domain: 'Craft and Structure', weightPct: 28, band: '680-760', tier: 'strong' },
      { domain: 'Information and Ideas', weightPct: 26, band: '610-670', tier: 'mid' },
      { domain: 'Standard English Conventions', weightPct: 26, band: '610-670', tier: 'mid' },
      { domain: 'Expression of Ideas', weightPct: 20, band: '610-670', tier: 'mid' },
    ],
    math: [
      { domain: 'Advanced Math', weightPct: 32.5, band: '470-540', tier: 'weak' },
      { domain: 'Algebra', weightPct: 35, band: '610-670', tier: 'mid' },
      {
        domain: 'Problem-Solving and Data Analysis',
        weightPct: 20,
        band: '680-760',
        tier: 'strong',
      },
      { domain: 'Geometry and Trigonometry', weightPct: 12.5, band: '680-760', tier: 'strong' },
    ],
  },
} as const;

/**
 * XP rules — INPUTS ONLY. Reward showing up + doing reps + logging analysis,
 * never the projected score or a test result. Same anti-prosperity discipline
 * as the campaign layer (reward faithfulness/effort, never the harvest).
 */
export const SAT_XP = {
  perQuestionAttempted: 2,
  perErrorLogged: 4, // logging a miss with a root cause IS the work — reward it
  perVocabReviewed: 1,
  dailySessionComplete: 30,
  perTestLogged: 25, // logging a real test (the discipline), not the score
} as const;

/**
 * Projected-score colour tiers (out of 1600). Used by the Progress dashboard.
 * Honest: only ever computed from SatTestResult (official), never AI drills.
 */
export const SAT_SCORE_TIERS = [
  { min: 1500, label: 'On target', tone: 'success' as const },
  { min: 1400, label: 'Closing in', tone: 'info' as const },
  { min: 1250, label: 'Building', tone: 'warning' as const },
  { min: 0, label: 'Early', tone: 'muted' as const },
];

export function scoreTier(total: number) {
  return SAT_SCORE_TIERS.find(t => total >= t.min) ?? SAT_SCORE_TIERS[SAT_SCORE_TIERS.length - 1];
}

/**
 * The study-plan phases — backwards-planned from a November target with a
 * September live-conditions benchmark. Surfaced on the Progress tab + mirrored
 * in docs/sat-study-plan.md. Weeks are indicative at 30 min/day; the engine is
 * weak-area-driven, so the *content* of each phase comes from the error log,
 * not a fixed syllabus.
 */
export interface SatPlanPhase {
  id: string;
  title: string;
  window: string;
  focus: string;
  exit: string;
}

export const SAT_PLAN: SatPlanPhase[] = [
  {
    id: 'diagnostic',
    title: 'Diagnostic',
    window: 'Week 1',
    focus:
      'One official Bluebook full-length, timed, real conditions. Log every miss with a root cause + confidence tag. This produces the real R&W↔Math split and the weak-skill map the whole plan targets.',
    exit: 'A baseline score + a populated error log + the top 5 weakest skills named.',
  },
  {
    id: 'math_ceiling',
    title: 'Lock Math toward the ceiling',
    window: 'Weeks 2–6',
    focus:
      'Math is finite, pattern-based, and your biggest point reservoir — it is your WEAKER half (620 vs 660 R&W), and one domain, Advanced Math (PSAT band 470–540), is dragging it down. Lead with Advanced Math, then Algebra (your biggest-weight Math domain, 35%). Drive Math toward the high-700s. Daily 30-min drills on your weakest Math skills (from the log), interleaved. Every miss → root cause → flashcard. Re-test a Bluebook Math section every ~2 weeks to confirm the climb.',
    exit: 'Math practice sections landing 770+ consistently.',
  },
  {
    id: 'rw_grind',
    title: 'Grind R&W + September benchmark',
    window: 'Weeks 6–12',
    focus:
      'Shift weight to R&W (the harder grind): Words in Context, Command of Evidence, Transitions, Boundaries. Keep a thin Math maintenance thread so it does not decay. Sit the September SAT as a real-conditions benchmark — not the score that counts, the rehearsal that exposes timing + nerves you cannot fake at home.',
    exit: 'A real September score + a sharper error log + R&W weak spots isolated.',
  },
  {
    id: 'push',
    title: 'Calibration push → November',
    window: 'Weeks 12–20',
    focus:
      'Hunt your overconfident-and-wrong questions — confidence 2–3 but incorrect are the highest-ROI targets (a baited System-1 pattern). Full-length practice every ~10 days under timed conditions. Tighten pacing. November is the score that counts; Stanford superscores, so a strong Math in Sept + strong R&W in Nov composites in your favour.',
    exit: 'A November sitting at the target band.',
  },
];

/** The fact the founder may not know — reframes the whole effort. */
export const SAT_STRATEGIC_NOTES = [
  'UC Berkeley is test-blind — it will never consider your SAT. This effort is for Stanford + other test-requiring privates.',
  'Stanford superscores: take it in Sept (benchmark) AND Nov (the real push); the best section scores across dates composite.',
  'The digital SAT is adaptive (Bluebook) — question difficulty matters, not just count correct. Only official scoring is the truth.',
  'Vocab is de-emphasised on the digital SAT — it is words-in-context reasoning, not obscure-word recall. Keep the vocab block thin.',
  'National Merit bonus: your JUNIOR-year PSAT (fall 2026) is the qualifying one — the 2025 sophomore Selection Index (194) does not count. The Selection Index double-weights R&W ((2×R&W + Math) / 10), so R&W gains carry extra leverage there (not on the SAT total, where R&W and Math are equal). Same study, two payoffs.',
] as const;

/**
 * Default test-date anchors for the countdown. The founder sets the real dates
 * in the tab (persisted to SatSettings) — these are editable defaults, NOT a
 * hardcoded claim about a specific College Board sitting (international digital
 * SAT dates shift). Format YYYY-MM-DD.
 */
export const SAT_TEST_DATE_DEFAULTS = {
  benchmark: '2026-09-13',
  target: '2026-11-08',
} as const;

/** Daily review cadence — how many due error-cards to clear per session. */
export const SAT_REVIEW_DAILY_TARGET = 8;

/**
 * The learning-science the system operationalises (founder is AP-Psych + bias-
 * thesis literate, so named at the mechanism level). Surfaced lightly so the
 * method is legible, not just asserted.
 */
export const SAT_LEARNING_SCIENCE = [
  {
    principle: 'Retrieval practice',
    source: 'Roediger & Karpicke 2006',
    application:
      'Re-encountering a missed concept and recalling it beats re-reading. Every miss becomes a spaced review card.',
  },
  {
    principle: 'Spacing effect',
    source: 'Cepeda et al. 2006',
    application:
      'Review intervals expand as you get a card right (SM-2). Cards you miss come back sooner.',
  },
  {
    principle: 'Interleaving',
    source: 'Rohrer & Taylor 2007',
    application:
      'Mixing skills within a session beats blocking one skill — the daily drill rotates your weak skills.',
  },
  {
    principle: 'Calibration / metacognition',
    source: 'Kahneman; your own bias thesis',
    application:
      'Tag confidence before answering; the overconfident-and-wrong set is where a baited System-1 pattern lives.',
  },
  {
    principle: 'Implementation intentions',
    source: 'Gollwitzer 1999',
    application:
      'An if-then ("if it is 7pm, then I do my 30-min block") roughly doubles follow-through — pair it with the streak.',
  },
  {
    principle: 'Desirable difficulties',
    source: 'Bjork',
    application:
      'Effortful recall (not recognition) is what sticks — the review surface hides the answer until you have tried.',
  },
] as const;
