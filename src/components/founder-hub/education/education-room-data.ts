/**
 * Education Room — flashcard + recall SSOT.
 *
 * The founder-hub's recollection engine. Reading content (Closing Lab,
 * Sales Toolkit, founder-context) builds familiarity. Recollection under
 * pressure builds mastery. The Education Room is the dynamic surface for
 * that — flashcards (passive recall), text-input recall (active recall,
 * AI-graded), and apply-mode (given a scenario, type how you'd USE the
 * concept).
 *
 * Pattern lifted from Nexus Tracker MindForge (vocab + summary modules
 * with SM-2 spaced repetition), extended for DI's specific knowledge
 * domain — vocabulary discipline, persona-specific verbatim phrases,
 * grading-rubric dimensions, the regulatory-framework registry, the
 * 12-node pipeline, R²F's Kahneman+Klein integration, and the locked
 * positioning claims. drift-tolerant — narrative description.
 *
 * Locked: 2026-04-28. When CLAUDE.md positioning vocabulary changes or
 * a new persona / framework / lesson lands, update HERE only — the
 * EducationRoomTab pulls all decks + cards from these typed exports.
 *
 * Current state (2026-05-02): 16 decks, 173 cards. Was 12 decks/~100 cards
 * at 2026-04-28 lock; expanded with advanced_sales_moves, strategic_thinking,
 * goldner_discovery, and learning_efficiency decks (last added 2026-05-02
 * with the FounderOSPanel ship — 12 cards on Active Recall + Elaborative
 * Encoding + Progressive Summarization + SM-2 + tolerance for boredom +
 * digital asceticism + cognitive offloading + System 1/2 ratio + locus of
 * control + distress tolerance + the compounding-loop synthesis).
 */

import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';

const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;

// ─── Types ──────────────────────────────────────────────────────────

export type DeckId =
  | 'di_vocabulary'
  | 'buyer_personas'
  | 'maalouf_principles'
  | 'satyam_pillars'
  | 'silent_objections'
  | 'grading_dimensions'
  | 'cognitive_biases'
  | 'pipeline_nodes'
  | 'dqi_methodology'
  | 'regulatory_frameworks'
  | 'r2f_framework'
  | 'founder_oneliners'
  | 'advanced_sales_moves'
  | 'strategic_thinking'
  | 'goldner_discovery'
  | 'learning_efficiency';

export type CardDifficulty = 'foundation' | 'core' | 'advanced';
export type CardMode = 'flashcard' | 'recall' | 'apply';

export interface EducationCard {
  /** Stable slug — used as localStorage key for SM-2 state. */
  id: string;
  deckId: DeckId;
  /** Front of card / question prompt. */
  prompt: string;
  /** Back of card / canonical answer. Used as ground truth for AI grading. */
  canonicalAnswer: string;
  /** Optional hint surfaced when user is stuck (don't show on first attempt). */
  hint?: string;
  /** Difficulty level — used for filtering + SM-2 initial easeFactor. */
  difficulty: CardDifficulty;
  /** When does this come up in a real founder conversation? Used as the
   * apply-mode scenario prompt. */
  applicationContext?: string;
  /** Citation: where in the codebase / CLAUDE.md / docs is the canonical source. */
  source?: string;
  /** Optional category tag for sub-grouping inside a deck. */
  tag?: string;
}

export interface EducationDeck {
  id: DeckId;
  label: string;
  description: string;
  /** Lucide icon name — string so the data file stays JSX-free. */
  iconName: string;
  /** Accent color for UI. */
  color: string;
  /** Order on the deck-picker grid. */
  order: number;
}

export interface SM2CardState {
  /** Card slug (matches EducationCard.id). */
  cardId: string;
  /** SM-2 ease factor — starts at 2.5; decreases with poor recall. */
  easeFactor: number;
  /** Number of consecutive successful reviews. */
  repetitions: number;
  /** Days until next review. */
  intervalDays: number;
  /** ISO timestamp of last review. */
  lastReviewed: string;
  /** ISO timestamp of next due date. */
  nextDue: string;
  /** Total times seen. */
  totalReviews: number;
  /** Number of "got it" reviews (quality 4-5). */
  successfulReviews: number;
}

export interface RecallGradeResult {
  /** 0-100 score from AI grading. */
  score: number;
  /** Grade letter. A: 85+ / B: 70+ / C: 55+ / D: 40+ / F: <40. */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** What the user got right. */
  whatLanded: string[];
  /** What the user missed or got wrong. */
  whatMissed: string[];
  /** The canonical answer for comparison. */
  canonicalAnswer: string;
  /** A specific actionable nudge for next time. */
  coachNote: string;
}

// ─── Decks ──────────────────────────────────────────────────────────

export const DECKS: EducationDeck[] = [
  {
    id: 'di_vocabulary',
    label: 'DI Vocabulary',
    description:
      'Locked terms (reasoning layer, R²F, DPR, DQI), banned phrases with cold-context bridges, and the warm/cold reader-temperature discipline.',
    iconName: 'BookOpen',
    color: '#16A34A',
    order: 1,
  },
  {
    id: 'buyer_personas',
    label: 'Buyer Personas',
    description:
      '7 personas (Adaeze / Potomac / Marcus / Margaret / Titi / James / Riya) with verbatim phrases and silent objections.',
    iconName: 'Users',
    color: '#0EA5E9',
    order: 2,
  },
  {
    id: 'maalouf_principles',
    label: 'Maalouf 6 Principles',
    description:
      "Eddie Maalouf's high-ticket-psychology framework — pressure without pressure, authority not trust, embody bigger and better, etc.",
    iconName: 'Target',
    color: '#DC2626',
    order: 3,
  },
  {
    id: 'satyam_pillars',
    label: 'Satyam 5 Pillars',
    description:
      "Satyam's sales-infrastructure framework — category of one, conviction is the variable, sales infrastructure is the weapon.",
    iconName: 'Shield',
    color: '#0EA5E9',
    order: 4,
  },
  {
    id: 'silent_objections',
    label: 'Silent Objections',
    description:
      'The 5 unverbalised concerns that kill deals: DQI trust-me math, NDA hard-purge, founder continuity, ChatGPT-wrapper suspicion, Pan-African regulatory illusion.',
    iconName: 'AlertCircle',
    color: '#DC2626',
    order: 5,
  },
  {
    id: 'grading_dimensions',
    label: 'Sales DQI Rubric',
    description:
      'The 15-dimension Sales DQI scorecard (Maalouf 4 + Satyam 3 + DI discipline 2 + Kahneman 1 + fundamentals 1 + 4 meta-dimensions: JOLT/Sandler/Cohen).',
    iconName: 'CheckSquare',
    color: '#6366F1',
    order: 6,
  },
  {
    id: 'cognitive_biases',
    label: 'Cognitive Biases',
    description:
      "20 named biases from DI's taxonomy (DI-B-001 through DI-B-020). What it is + how it shows up in strategic memos.",
    iconName: 'Brain',
    color: '#A78BFA',
    order: 7,
  },
  {
    id: 'pipeline_nodes',
    label: '12-Node Pipeline',
    description:
      "DI's LangGraph reasoning pipeline node-by-node. What each does + the academic anchor + the procurement-grade artefact.",
    iconName: 'Workflow',
    color: '#16A34A',
    order: 8,
  },
  {
    id: 'dqi_methodology',
    label: 'DQI Methodology',
    description:
      'Component weights, grade boundaries (A 85+ / B 70+ / C 55+ / D 40+ / F), recalibration, Brier score, validation.',
    iconName: 'BarChart3',
    color: '#F59E0B',
    order: 9,
  },
  {
    id: 'regulatory_frameworks',
    label: '17 Regulatory Frameworks',
    description:
      'EU AI Act, Basel III, SEC Reg D, GDPR Art 22, NDPR, CBN, WAEMU, PoPIA, ISA 2007, and the rest. Jurisdiction + key article + DPR mapping.',
    iconName: 'Lock',
    color: '#475569',
    order: 10,
  },
  {
    id: 'r2f_framework',
    label: 'R²F (Kahneman + Klein)',
    description:
      "The Recognition-Rigor Framework — Kahneman's debiasing + Klein's Recognition-Primed Decision arbitrated in one pipeline.",
    iconName: 'Compass',
    color: '#8B5CF6',
    order: 11,
  },
  {
    id: 'founder_oneliners',
    label: 'Founder One-Liners',
    description:
      'The strategic claims you should be able to recite verbatim — moat layers, External Attack Vectors, R²F as IP, Pan-African wedge framing.',
    iconName: 'Quote',
    color: '#EC4899',
    order: 12,
  },
  {
    id: 'advanced_sales_moves',
    label: 'Advanced Sales Moves',
    description:
      'JOLT pre-buttal · Sandler negative reverse · Cialdini arguing-against-self · Voss tactics · age-asymmetry tactics · Brinkmanship (Schelling/Dixit-Nalebuff). Source: NotebookLM 2026-04-28 synthesis.',
    iconName: 'TrendingUp',
    color: '#6366F1',
    order: 13,
  },
  {
    id: 'strategic_thinking',
    label: 'Strategic Thinking',
    description:
      "Dixit & Nalebuff's 5 game-theory anchors for higher-order positioning: look-forward-reason-backward, strategic moves by limiting options, credible commitments, setting category ground rules, cooperation over competition.",
    iconName: 'Compass',
    color: '#8B5CF6',
    order: 14,
  },
  {
    id: 'goldner_discovery',
    label: 'Goldner Discovery',
    description:
      "Mr. Goldner's 3 rules + the 4-question discovery script in dual variants — wedge (Individual CSO / M&A head @ £249/mo) and ceiling (corp dev / corp strategy M&A). Drill before every warm-intro call.",
    iconName: 'MessageCircleQuestion',
    color: '#0EA5E9',
    order: 15,
  },
  {
    id: 'learning_efficiency',
    label: 'Personal R²F Encoding Mirror',
    description:
      "The founder's personal-mind protocol that mirrors the platform's R²F architecture (capture → encode → recall + outcome flywheel). Drill these to operationalise PathToHundredMillion → R²F Deep Dive → 6th lever (encoding mirror) and Founder School ldr_7 (Learning Velocity refined 2026-05-02). Active Recall (Karpicke 2008) · Elaborative Encoding (Bjork 1994) · Progressive Summarization (Tiago Forte) · SM-2 spaced repetition (Wozniak 1990) · long-form vs short-form discipline · tolerance for boredom · digital asceticism · cognitive offloading defense · System 1/2 ratio · internal locus · distress tolerance · the compounding-loop synthesis.",
    iconName: 'Brain',
    color: '#7C3AED',
    order: 16,
  },
];

// ─── Cards: DI Vocabulary (20) ──────────────────────────────────────

const DI_VOCABULARY_CARDS: EducationCard[] = [
  {
    id: 'voc_reasoning_layer',
    deckId: 'di_vocabulary',
    prompt: 'What is the canonical category claim for Decision Intel?',
    canonicalAnswer:
      'The native reasoning layer for every high-stakes call. "Reasoning layer" is the ownable category anchor. "Native" does the "built for this, not retrofitted" work. "High-stakes call" is the universal noun phrase that lands across all six buyer personas (CSO, head of strategic planning, M&A partner, fund analyst, GC, board director).',
    hint: 'Think category-creator language, not feature-list.',
    difficulty: 'foundation',
    applicationContext:
      'You are introducing Decision Intel to a warm-context F500 CSO who has had a prior meeting.',
    source: 'CLAUDE.md One-liner section',
    tag: 'locked',
  },
  {
    id: 'voc_r2f',
    deckId: 'di_vocabulary',
    prompt: 'What does R²F stand for and what does it integrate?',
    canonicalAnswer:
      'Recognition-Rigor Framework. It arbitrates Kahneman\'s rigor (System 2 debiasing — biasDetective, noiseJudge, statisticalJury) WITH Klein\'s recognition (System 1 amplification — rpdRecognition, forgottenQuestions, pre-mortem) in one pipeline. No competitor combines both traditions. Anchor citation: Kahneman-Klein 2009 paper "Conditions for Intuitive Expertise: a failure to disagree."',
    difficulty: 'core',
    applicationContext: 'Investor asks: "what is your IP / why is this defensible?"',
    source: 'CLAUDE.md Positioning section + KahnemanKleinSynthesis component',
    tag: 'locked',
  },
  {
    id: 'voc_dpr',
    deckId: 'di_vocabulary',
    prompt: 'What is the Decision Provenance Record (DPR) and what does it currently provide?',
    canonicalAnswer:
      'The procurement-grade artefact every audit produces. It is hashed and tamper-evident (SHA-256 input hash + record fingerprint). Private-key signing is on the roadmap, NOT shipped today. The artefact carries integrity fingerprints, model lineage, judge variance, academic citations, 17-framework regulatory mapping, pipeline lineage, blind-prior aggregations, and (when applicable) reviewer-decisions HITL log + data-lifecycle footer. Use the EXACT phrase "hashed and tamper-evident" — never overclaim "signed" until that ships.',
    difficulty: 'core',
    applicationContext:
      'A GC asks: "what does your audit actually produce that I can show to a regulator?"',
    source: 'CLAUDE.md DPR vocabulary lock 2026-04-26',
    tag: 'locked',
  },
  {
    id: 'voc_dqi',
    deckId: 'di_vocabulary',
    prompt: 'What is the Decision Quality Index (DQI) and what is its grade scale?',
    canonicalAnswer:
      'DQI is the composite 0-100 score that decomposes the quality of a strategic decision across 6 weighted components. Grade scale: A 85+ / B 70+ / C 55+ / D 40+ / F (<40). The boundaries are canonical and live in src/lib/scoring/dqi.ts → GRADE_THRESHOLDS. Any consumer that maps score-to-grade must import from this canonical source — never re-implement.',
    difficulty: 'foundation',
    applicationContext: 'Founder explaining the score in a discovery call.',
    source: 'CLAUDE.md DQI Grade Boundaries lock + dqi.ts',
    tag: 'locked',
  },
  {
    id: 'voc_decision_archaeology',
    deckId: 'di_vocabulary',
    prompt: 'What is "decision archaeology" and what does it replace?',
    canonicalAnswer:
      'Decision archaeology is the canonical verb for the pain Decision Intel replaces — reconstructing past reasoning from the four-tool graveyard (Google Docs drafts, Slack threads, Confluence writeups, the board deck). It is the name of the manual, painful, lossy work the platform makes obsolete by capturing reasoning at decision-time as a Decision Knowledge Graph that compounds quarter after quarter.',
    difficulty: 'core',
    applicationContext:
      'Cold opener with a CSO who is tired of reconstructing why a decision was made 6 months ago.',
    source: 'CLAUDE.md Vocabulary section',
    tag: 'locked',
  },
  {
    id: 'voc_decision_knowledge_graph',
    deckId: 'di_vocabulary',
    prompt: 'What is the Decision Knowledge Graph and why does it matter to a CSO?',
    canonicalAnswer:
      'The Decision Knowledge Graph is the foundational artefact that grows with every audit — it captures every flagged bias, every recommendation, every outcome, and the causal links between them at an organisation level. Quarter after quarter the graph compounds. The CSO can answer "what biases are most-active in OUR strategy team this quarter" or "how did the Lagos rollup audit relate to the cross-border M&A audit" without manual decision-archaeology. Use the FULL name "Decision Knowledge Graph" — never abbreviate.',
    difficulty: 'core',
    applicationContext: 'Strategy team asks why this would matter beyond the first audit.',
    source: 'CLAUDE.md Positioning section',
    tag: 'locked',
  },
  {
    id: 'voc_native_system_of_record',
    deckId: 'di_vocabulary',
    prompt:
      'What is the procurement-friendly category framing alternative to "decision intelligence platform"?',
    canonicalAnswer:
      '"Native system of record for strategic reasoning." This is the procurement-friendly category claim. The softer alternative "native medium for strategic reasoning" works on surfaces where "system of record" feels over-procurement-coded. Both replace "decision intelligence platform" (Gartner-crowded — Peak.ai, Cloverpop, Quantellia, Aera). "Decision intelligence" is fine inside a sentence; never as the headline claim.',
    difficulty: 'core',
    applicationContext: 'Procurement-stage call where the GC asks for a clean category descriptor.',
    source: 'CLAUDE.md Positioning + Vocabulary discipline 2026-04-22',
    tag: 'locked',
  },
  {
    id: 'voc_banned_di_platform',
    deckId: 'di_vocabulary',
    prompt:
      'Why is "decision intelligence platform" BANNED in marketing leads, and what do you say instead?',
    canonicalAnswer:
      'Gartner-crowded category. Cloverpop, Peak.ai, Quantellia, Aera all claim the same descriptor. Using it locks Decision Intel into a price-comparison frame against incumbents who have more proof. Replacement: "native reasoning layer" (warm context) or "60-second audit on strategic memos" (cold context). "Decision intelligence" is fine as a descriptor INSIDE a sentence, never as the headline claim.',
    difficulty: 'core',
    applicationContext:
      'You catch yourself about to say "decision intelligence platform" in a cold meeting.',
    source: 'CLAUDE.md Marketing Voice Enterprise Discipline',
    tag: 'banned',
  },
  {
    id: 'voc_banned_decision_hygiene',
    deckId: 'di_vocabulary',
    prompt: 'Why is "decision hygiene" BANNED, and what is the DI replacement?',
    canonicalAnswer:
      '"Decision hygiene" is Daniel Kahneman\'s term from his 2021 book "Noise." Borrowing it cedes our category vocabulary to a more famous author who already owns the phrase. We don\'t use the cleaner-than-thou framing either; cleanliness is a corrective frame. Our replacement vocabulary: "decision archaeology" (the pain we replace) + "reasoning audit" + "Recognition-Rigor Framework" (the IP). NEVER use "decision hygiene" in any DI material.',
    difficulty: 'core',
    applicationContext:
      'A founder peer suggests "you should call this decision hygiene" — you decline.',
    source: 'CLAUDE.md Vocabulary discipline by reader temperature',
    tag: 'banned',
  },
  {
    id: 'voc_banned_boardroom_strategic_decision',
    deckId: 'di_vocabulary',
    prompt: 'Why was "boardroom strategic decision" retired as the H1 noun phrase?',
    canonicalAnswer:
      'It narrowed funds (Sankore — first design partner) and non-board-reporting teams out of the audience. The 2026-04-26 empathic-mode-first review caught the narrowing. Replacement: "high-stakes call" — universal noun phrase that lands across all six buyer personas (CSO, head of strategic planning, M&A partner, fund analyst, GC, board director). "Boardroom" is only valid in long-form writing where the audience is explicitly F500 board-reporting (e.g., /decision-intel-for-boards). The H1 sweep replaced "the board will catch first" with "the room will catch first" so the universalisation actually holds.',
    difficulty: 'advanced',
    applicationContext: 'Editing landing page copy. You see "boardroom" in a heading.',
    source: 'CLAUDE.md One-liner re-lock 2026-04-26',
    tag: 'banned',
  },
  {
    id: 'voc_cold_descriptive',
    deckId: 'di_vocabulary',
    prompt:
      'For a COLD context (LinkedIn DM, conference 1:1, landing-page above-the-fold for unaware traffic), what is the canonical descriptive bridge?',
    canonicalAnswer:
      '"60-second audit on a strategic memo." Or "pre-IC audit layer." Or "strategic memo audits." Or "decision quality auditing." Plain language, no acronyms, no platform vocabulary. NEVER lead cold with "reasoning layer" / "R²F" / "DPR" — the reader has not earned the term yet and will scroll past. The bridge sentence that converts cold→warm in two beats: "We run 60-second audits on strategic memos. The technical name is a reasoning layer — Recognition-Rigor Framework, scored as a Decision Quality Index."',
    difficulty: 'core',
    applicationContext: 'Drafting a cold LinkedIn DM to a CSO you have never met.',
    source: 'CLAUDE.md Vocabulary discipline by reader temperature',
    tag: 'cold_bridge',
  },
  {
    id: 'voc_warm_locked',
    deckId: 'di_vocabulary',
    prompt:
      'For a WARM context (second meeting, pitch deck, design-partner conversation), what category vocabulary do you use?',
    canonicalAnswer:
      '"Native reasoning layer for every high-stakes call." "Recognition-Rigor Framework arbitrating Kahneman + Klein." "Decision Quality Index in 60 seconds." This is the OWNABLE category vocabulary where category creation happens. Warm contexts have earned the term through prior context. Do NOT default to descriptive language here — that under-leverages the category framing.',
    difficulty: 'core',
    applicationContext:
      'Second meeting with a CSO who already heard the cold pitch and is now asking for depth.',
    source: 'CLAUDE.md Vocabulary discipline by reader temperature',
    tag: 'warm_locked',
  },
  {
    id: 'voc_135_decisions',
    deckId: 'di_vocabulary',
    prompt: 'What is the canonical historical-decision benchmark number Decision Intel cites?',
    canonicalAnswer:
      '"143 audited corporate decisions" — defensible, internally curated, deduped 2026-04-16 from the prior 146. Always say "143 historical decisions" or "143 audited corporate decisions" — never round to "~100" or "~150" or claim larger numbers. The dataset is the procurement-grade reference for cross-referencing patterns. Use it as the first anchor in any cold pitch ("we have audited 143 corporate decisions across the last decade").',
    difficulty: 'foundation',
    applicationContext:
      'Cold pitch to a CSO. You need a single number that makes the work feel real.',
    source: 'CLAUDE.md Positioning section',
    tag: 'numbers',
  },
  {
    id: 'voc_30_biases',
    deckId: 'di_vocabulary',
    prompt: 'How many cognitive biases does DI claim, and where does the taxonomy live?',
    canonicalAnswer:
      '"30+ cognitive biases" — the canonical claim. The 20 stable taxonomy IDs (DI-B-001 through DI-B-020) are PERMANENT and published at /taxonomy. The "30+" allows for taxonomy growth without re-numbering. Biases referenced by snake_case keys (confirmation_bias, anchoring_bias). Defined in src/lib/constants/bias-education.ts. Never renumber or reassign IDs.',
    difficulty: 'foundation',
    applicationContext: 'Investor asks: "how do you scope cognitive bias detection?"',
    source: 'CLAUDE.md Bias Taxonomy section',
    tag: 'numbers',
  },
  {
    id: 'voc_17_frameworks',
    deckId: 'di_vocabulary',
    prompt: 'How many regulatory frameworks does DI map across, and what is the regional shape?',
    canonicalAnswer: `${FRAMEWORK_COUNT} frameworks across G7 / EU / GCC / African markets. The count is structurally derived from getAllRegisteredFrameworks().length — never literal a number that can drift. African coverage uniquely strong: NDPR (Nigeria), CBN, FRC Nigeria, ISA Nigeria 2007, WAEMU, CMA Kenya, CBK, BoG, CBE (Egypt), PoPIA s.71 (South Africa), SARB Model Risk, BoT FinTech. This is a structural moat against US-only incumbents.`,
    difficulty: 'foundation',
    applicationContext: 'Pan-African fund partner asks "do you actually cover OUR regulators?"',
    source: 'CLAUDE.md positioning + africa-frameworks.ts',
    tag: 'numbers',
  },
  {
    id: 'voc_blended_margin',
    deckId: 'di_vocabulary',
    prompt:
      'What is the honest blended margin claim for Decision Intel, and why was the prior "97%" claim wrong?',
    canonicalAnswer:
      '"~90% blended margin" — Individual typical ~95%, Strategy typical ~95%, Strategy heavy 85-88%, Enterprise 70% without volume floor. The prior "~97%" claim was ghost-user math (assumed everyone was on the cheapest path). Use "~90% blended" in every outward-facing material — pitch deck, investor Q&A, cold email. "97%" will not survive due diligence.',
    difficulty: 'core',
    applicationContext: 'VC asks about unit economics in a pre-seed conversation.',
    source: 'CLAUDE.md Founder Context — pricing hygiene 2026-04-18',
    tag: 'numbers',
  },
  {
    id: 'voc_per_audit_cost',
    deckId: 'di_vocabulary',
    prompt: 'What is the per-audit Gemini API cost, and how many LLM calls does an audit fire?',
    canonicalAnswer:
      '~£0.30-0.50 (~$0.40-0.65) per audit on Gemini paid tier 1. Each audit fires ~17 LLM calls across the 12-node pipeline. Cost-tier routing (Apr 2026) moved gdprAnonymizer/structurer/intelligenceGatherer to gemini-3.1-flash-lite for 15-25% savings. The metaJudge final-verdict node runs on gemini-2.5-pro (the highest-leverage single call — reasoning-quality matters more than cost).',
    difficulty: 'advanced',
    applicationContext: 'CTO asks for the actual operating cost per audit.',
    source: 'CLAUDE.md Founder Context — model policy',
    tag: 'numbers',
  },
  {
    id: 'voc_design_partner_seats',
    deckId: 'di_vocabulary',
    prompt: 'How many design-partner seats are open, and where is that number canonically defined?',
    canonicalAnswer:
      'DESIGN_PARTNER_SEATS_TOTAL = 5, DESIGN_PARTNER_SEATS_AVAILABLE = 4 (as of 2026-04-26 with Sankore as the first signed partner). Lives in src/lib/constants/company-info.ts. Every consumer (landing CTA, pricing block, BookDemoCTA chip) reads from this constant — when a seat fills, decrement the AVAILABLE count and every surface picks up the change.',
    difficulty: 'core',
    applicationContext: 'A CSO asks "is there still room in your design partner program?"',
    source: 'CLAUDE.md Design Partner Seat Counts lock',
    tag: 'numbers',
  },
  {
    id: 'voc_first_design_partner',
    deckId: 'di_vocabulary',
    prompt: 'Who is the first design partner, and what shape of buyer are they?',
    canonicalAnswer:
      'Sankore — a Pan-African PE fund. They are NOT a Fortune 500 board-reporting strategy team — they are a fund. This is why the H1 was de-narrowed from "boardroom strategic decision" to "high-stakes call" in April 2026. CRITICAL: Sankore stays inside the Founder Hub and confidential channels — NEVER ship the name in production HTML, JSON-LD, public marketing copy, or "Sankore-class buyers" coding patterns. Founders can reference the SHAPE of buyer (Pan-African PE fund partner) publicly without naming.',
    difficulty: 'advanced',
    applicationContext: 'You catch yourself about to say "Sankore" in a public LinkedIn post.',
    source: 'CLAUDE.md Marketing Voice — no named-prospect leaks',
    tag: 'discipline',
  },
  {
    id: 'voc_specimen_library',
    deckId: 'di_vocabulary',
    prompt: 'What two specimen DPRs are in the public library, and when do you send each?',
    canonicalAnswer:
      'WeWork S-1 audit (US public-market shape, anonymised 2019 S-1) and Dangote 2014 Pan-African expansion plan (anonymised, with Pan-African regulatory mapping covering NDPR, CBN, WAEMU, PoPIA, CMA Kenya, CBE, Basel III). US/global prospect → WeWork. African / EM-focused fund → Dangote. Cross-border buyer → both, in sequence. Both generated idempotently by scripts/generate-legal-pdfs.mjs.',
    difficulty: 'core',
    applicationContext: 'Cold email to a Pan-African fund partner — which DPR do you attach?',
    source: 'CLAUDE.md Specimen Library + sample-dpr.ts',
    tag: 'specimens',
  },
];

// ─── Cards: Buyer Personas (14) ──────────────────────────────────

const BUYER_PERSONAS_CARDS: EducationCard[] = [
  {
    id: 'persona_adaeze_basics',
    deckId: 'buyer_personas',
    prompt: 'Who is Adaeze, and what is her role + ticket band?',
    canonicalAnswer:
      'Adaeze = mid-market PE associate archetype. Vice President at a $400M-AUM mid-market PE fund, 4 years deep into deal cycle, just closed her first lead deal. Has discretionary $5-50K corporate-card authority. Ticket band: $249-499/mo Individual or $2,499/mo Strategy if she can sell it internally to her partners. Conversion speed: FAST — she is one of the 3 fastest-converter personas.',
    difficulty: 'foundation',
    applicationContext: 'Strategising your wedge persona prioritisation for the next 30 days.',
    source: 'sparring-room-data.ts BUYER_PERSONAS',
    tag: 'fastest_converter',
  },
  {
    id: 'persona_adaeze_phrase',
    deckId: 'buyer_personas',
    prompt: "What is Adaeze's primary concern, and what verbatim phrase do you open with?",
    canonicalAnswer:
      'Primary concern: "Will this make my next IC memo defensible enough that the partners stop questioning my judgement on diligence depth?" Verbatim opener: "You\'re trying to make sure your partners stop pushing back on diligence depth — that\'s exactly what this fixes in 60 seconds. Look at the WeWork S-1 audit; same shape as your last memo." Lead with HER specific career-pain (partner pushback), then the artefact, then the comparable-cost frame.',
    difficulty: 'core',
    applicationContext: 'Cold call with Adaeze. You have 60 seconds for the opener.',
    source: 'closing-lab-data.ts FASTEST_CONVERTERS + sparring-room-data.ts',
    tag: 'fastest_converter',
  },
  {
    id: 'persona_potomac_basics',
    deckId: 'buyer_personas',
    prompt: 'Who is Potomac, and what is his role + ticket band?',
    canonicalAnswer:
      'Potomac = boutique sell-side M&A advisor archetype. Managing Director at a 12-person boutique sell-side M&A firm, 18-year career, ex-Goldman associate. Their deals close in 6-9 months and CIM quality determines buyer pool — every blind spot becomes a price haircut at term sheet. Ticket band: $2,499-4,999/mo Strategy tier across 3-5 partners. Conversion speed: FAST.',
    difficulty: 'foundation',
    applicationContext: 'Targeting M&A advisors as a wedge segment.',
    source: 'sparring-room-data.ts BUYER_PERSONAS',
    tag: 'fastest_converter',
  },
  {
    id: 'persona_potomac_phrase',
    deckId: 'buyer_personas',
    prompt: "What is Potomac's primary concern, and what verbatim opener do you use?",
    canonicalAnswer:
      'Primary concern: "Can I get my associate to spot the bias gap in a CIM before our client sees buyer questions and we lose 5% of EV on the term sheet?" Verbatim opener: "The blind spots in a CIM cost you 5% of EV at term sheet. The audit catches them before the buyer pool sees the deck — your associate runs it, you don\'t have to." Lead with EV-loss anchor (loss aversion), then who runs it (his associate, not him), then the timing.',
    difficulty: 'core',
    applicationContext: 'You have a coffee meeting booked with a boutique M&A MD.',
    source: 'closing-lab-data.ts',
    tag: 'fastest_converter',
  },
  {
    id: 'persona_marcus_basics',
    deckId: 'buyer_personas',
    prompt: 'Who is Marcus, and what is his role + ticket band?',
    canonicalAnswer:
      'Marcus = solo fractional CSO archetype. Independent fractional Chief Strategy Officer with 4 mid-market CEO clients. Ex-MBB (Bain or McKinsey, 7 years). Charges $30-60K/quarter per client. Ticket band: $249/mo Individual, scaling to one Strategy seat across 3 clients. Conversion speed: FAST.',
    difficulty: 'foundation',
    applicationContext: 'Identifying fractional consultants in your network as a wedge.',
    source: 'sparring-room-data.ts BUYER_PERSONAS',
    tag: 'fastest_converter',
  },
  {
    id: 'persona_marcus_phrase',
    deckId: 'buyer_personas',
    prompt: "What is Marcus's primary concern, and what verbatim opener do you use?",
    canonicalAnswer:
      'Primary concern: "My credibility is my product. If a client questions one of my recommendations, can I show them I stress-tested it with something more rigorous than my own brain?" Verbatim opener: "Your credibility is your product — when a client pushes back on a recommendation, you need an answer sharper than \'trust me, I\'m ex-MBB.\' This is the sharper answer in 60 seconds." Lead with credibility-as-product framing, NOT the consultant×AI angle (he\'s worried it makes him look less senior).',
    difficulty: 'core',
    applicationContext: 'Casual conversation with a fractional CSO at a networking event.',
    source: 'closing-lab-data.ts',
    tag: 'fastest_converter',
  },
  {
    id: 'persona_margaret_basics',
    deckId: 'buyer_personas',
    prompt: 'Who is Margaret, and what is her role + ticket band?',
    canonicalAnswer:
      'Margaret = Fortune 500 Chief Strategy Officer archetype. CSO at a $30B Fortune 500 industrial company, 12 years tenure, reports to the CEO. Strategy team of 14. Every memo has board exposure. SOC 2, EU AI Act, vendor-risk register are baseline. Ticket band: $50-150K/yr Enterprise after 3+ pilot references. Conversion speed: SLOW — she is the REVENUE CEILING, not the wedge. Need 3 published wedge cases before she enters procurement.',
    difficulty: 'foundation',
    applicationContext: 'Should you spend Q3 chasing Margaret-class CSOs or wedge personas?',
    source: 'sparring-room-data.ts + CLAUDE.md ICP wedge+ceiling',
    tag: 'ceiling',
  },
  {
    id: 'persona_margaret_phrase',
    deckId: 'buyer_personas',
    prompt:
      "Margaret says 'I cannot put a 16-year-old's name in front of my CEO.' Verbatim 30-second response?",
    canonicalAnswer:
      "\"My name doesn't go in front of your CEO — your DPR does. The DPR is what your audit committee reads. The fact that a teenager built the audit layer is a footnote at best, irrelevant at procurement-stage. What's in front of your CEO is whether your strategy team can produce a defensible reasoning record under EU AI Act Article 14 — and that's what your CEO actually wants to know about.\" Reframe from founder-identity to artefact-defensibility. Don't apologise for age. Don't pivot to advisor credentials.",
    difficulty: 'advanced',
    applicationContext: 'Live objection handling. You have 30 seconds.',
    source: 'closing-lab-data.ts SILENT_OBJECTIONS',
    tag: 'objection_response',
  },
  {
    id: 'persona_titi_basics',
    deckId: 'buyer_personas',
    prompt: 'Who is Titi, and what is her role + ticket band?',
    canonicalAnswer:
      'Titi = Pan-African fund partner archetype. Partner at a $600M Pan-African PE fund based in Lagos, deploys across Nigeria / Kenya / Ghana / South Africa. 9-year track record. Reports to LPs in London, Singapore, Abu Dhabi. Strict NDPR + CBN + WAEMU compliance posture. Ticket band: $5K-25K/yr design partner, scaling to $50K+ as fund grows. Conversion speed: MEDIUM. Pan-African / EM-fund subset is the WEDGE per the 2026-04-26 ICP re-lock.',
    difficulty: 'core',
    applicationContext: 'Why is Titi the wedge persona and not Margaret?',
    source: 'sparring-room-data.ts + CLAUDE.md ICP — wedge + ceiling',
    tag: 'wedge',
  },
  {
    id: 'persona_titi_phrase',
    deckId: 'buyer_personas',
    prompt:
      "Titi says 'I worry you'll close 5 wedge cases and pivot to F500 next year. Where does that leave my fund?' Verbatim 30-second response?",
    canonicalAnswer:
      '"You should worry about that with US-only vendors. The 17-framework regulatory map covers NDPR, CBN, WAEMU, PoPIA, CMA Kenya — that\'s not a feature I added because you asked. That\'s the structural moat. The Dangote DPR carries Pan-African regulatory mapping by default. Pivoting to F500 means killing the moat, which means killing the company. The wedge IS the company. The F500 ceiling is the natural expansion vector — not the replacement." Lead with structural commitment (the regulatory map IS the moat), not promise-based reassurance.',
    difficulty: 'advanced',
    applicationContext: 'Live objection handling with a Pan-African fund partner.',
    source: 'closing-lab-data.ts',
    tag: 'objection_response',
  },
  {
    id: 'persona_james_basics',
    deckId: 'buyer_personas',
    prompt: 'Who is James, and why is he NOT a buyer himself?',
    canonicalAnswer:
      'James = General Counsel at a regulated entity, archetype. Reports to the audit committee chair. Career-long focus on regulatory exposure, not business growth. Every new vendor gets a 90-day vendor-risk review. James is NOT a buyer — he is the VETO HOLDER on Margaret-class deals. The CSO is the champion; James is the gate. Default skepticism: very high. He notices every overclaim instantly — uses regulator vocabulary natively (EU AI Act Article 14, Basel III Pillar 2 ICAAP, GDPR Art 22).',
    difficulty: 'core',
    applicationContext: 'Should you treat James as a primary persona to convert?',
    source: 'sparring-room-data.ts BUYER_PERSONAS',
    tag: 'veto_holder',
  },
  {
    id: 'persona_james_phrase',
    deckId: 'buyer_personas',
    prompt:
      'James asks "your DPR says tamper-evident but your roadmap admits private-key signing isn\'t shipped — explain." Verbatim 30-second response?',
    canonicalAnswer:
      "\"You're right. Tamper-evident today is SHA-256 input hash plus record fingerprint — which means you can prove the artefact wasn't modified after generation, given the input. Cryptographic signing with a Decision Intel private key is on the Q3 2026 roadmap. We chose the plain-language 'tamper-evident' over 'signed' specifically because over-claiming would fail your kind of review. The current shape is enough to satisfy EU AI Act Article 14 record-keeping; the signing layer adds non-repudiation, which is procurement-tier.\" Honest disclosure. Name the timeline. Show you UNDERSTAND why he asked.",
    difficulty: 'advanced',
    applicationContext: 'Procurement evaluation call with a GC asking precision questions.',
    source: 'closing-lab-data.ts SILENT_OBJECTIONS',
    tag: 'objection_response',
  },
  {
    id: 'persona_riya_basics',
    deckId: 'buyer_personas',
    prompt: 'Who is Riya, and what is the asymmetry between her and her partner?',
    canonicalAnswer:
      'Riya = pre-seed VC associate archetype. Associate at a $100M pre-seed/seed B2B SaaS fund. Sees 50 founders/month. Decision authority is "should we put this in the partner meeting" — the PARTNER makes the actual call. Riya is the gatekeeper, not the buyer. She wants to look smart bringing this to her partner — does it survive the 60-second elevator question without her having to defend it?',
    difficulty: 'core',
    applicationContext: 'Differentiating buyer pathways from investor pathways.',
    source: 'sparring-room-data.ts BUYER_PERSONAS',
    tag: 'investor',
  },
  {
    id: 'persona_riya_phrase',
    deckId: 'buyer_personas',
    prompt:
      'Riya asks "is this a wrapper that GPT-5 with vision eats in 6 months?" Verbatim 30-second response?',
    canonicalAnswer:
      "\"What GPT-5 doesn't eat: the 143-decision case library, the 17-framework regulatory mapping across G7 / EU / GCC / African markets, the Brier-scored per-org outcome flywheel that recalibrates the DQI for THIS organisation specifically. Wrapper-class products are the prompt; we're the prompt PLUS the procurement-grade artefact PLUS the data flywheel. The architectural moat is the regulatory + outcome data, not the model call.\" Name three specific structural moats. Don't deny the wrapper concern abstractly.",
    difficulty: 'advanced',
    applicationContext: 'Pre-seed investor call. The wrapper question always comes up.',
    source: 'CLAUDE.md External Attack Vectors',
    tag: 'investor_response',
  },
];

// ─── Cards: Maalouf 6 Principles ─────────────────────────────────

const MAALOUF_PRINCIPLES_CARDS: EducationCard[] = [
  {
    id: 'maalouf_pressure_without_pressure',
    deckId: 'maalouf_principles',
    prompt: 'What is "pressure without pressure" and how do you create it?',
    canonicalAnswer:
      "Maalouf #1: the buyer feels urgency to move WITHOUT being able to point to anywhere you pushed them. Created by referencing other conversations naturally (\"the fund partner I spoke to yesterday\"), surfacing scarcity that's structurally true (5 design-partner seats, 4 left), and letting silence work after a high-impact line. The opposite is being pushy ('limited time', 'last chance') — both flat and pushy fail.",
    difficulty: 'core',
    applicationContext:
      'You sense the buyer is interested but not ready to commit — how do you nudge without pushing?',
    source: 'closing-lab-data.ts MAALOUF_PRINCIPLES',
    tag: 'principle_1',
  },
  {
    id: 'maalouf_authority_not_trust',
    deckId: 'maalouf_principles',
    prompt: 'What does "authority is not trust" mean for the way you speak?',
    canonicalAnswer:
      "Maalouf #2: speak AS the category creator, not as someone hoping to be trusted. References work as fact, not as a request for buy-in. NO 'I think', 'I believe', 'we hope' on load-bearing claims. Authority is conferred when you stop asking for it. Hedging language is the opposite — 'I think we can help' reads as asking for permission to be the expert.",
    difficulty: 'foundation',
    applicationContext: "You're about to say 'I think this might help' — stop and rephrase.",
    source: 'closing-lab-data.ts',
    tag: 'principle_2',
  },
  {
    id: 'maalouf_low_vs_high_ticket',
    deckId: 'maalouf_principles',
    prompt: "What is the low-ticket vs. high-ticket distinction in Maalouf's framework?",
    canonicalAnswer:
      "Maalouf #3: low-ticket is sold on convenience and feature comparison. High-ticket is sold on identity and outcome. A $249/mo product CAN be sold high-ticket if you frame the buyer's IDENTITY as someone who can no longer afford the comparable cost (the partner pushback, the bad memo, the reputational hit). The price tier is the lens; the conversation determines the perceived value.",
    difficulty: 'core',
    applicationContext: 'A buyer asks why your $249/mo tier is worth more than ChatGPT.',
    source: 'closing-lab-data.ts',
    tag: 'principle_3',
  },
  {
    id: 'maalouf_talk_other_opportunities',
    deckId: 'maalouf_principles',
    prompt: 'How do you "talk about other opportunities" without sounding like name-dropping?',
    canonicalAnswer:
      "Maalouf #4: reference other conversations as context, not as social proof. Bad: 'Just last week I spoke to the CSO at [F500 Co.]...' (name-drop, status-display). Good: 'I had a similar conversation with a fund partner in Lagos last week — they were stuck on the same NDPR question. The way we resolved it for them was...' Frames YOU as moving in many high-stakes conversations, signals you're chosen by buyers, makes the current buyer ONE of N rather than the only fish.",
    difficulty: 'advanced',
    applicationContext: "You want to signal you're busy without bragging.",
    source: 'closing-lab-data.ts',
    tag: 'principle_4',
  },
  {
    id: 'maalouf_embody_bigger_better',
    deckId: 'maalouf_principles',
    prompt: 'What does "embody bigger and better" mean for your verbal energy?',
    canonicalAnswer:
      "Maalouf #5: speak from a category-creator position. Pause and pacing as power — let silence do work. The buyer should feel they should chase YOU, not the other way around. Eager, over-explaining, rushing, saying 'oh and another thing we can do is...' is the opposite — every additional capability dilutes authority. Less is more on the call. Restraint is the high-status move.",
    difficulty: 'core',
    applicationContext: 'You feel the urge to explain one more capability — STOP.',
    source: 'closing-lab-data.ts',
    tag: 'principle_5',
  },
  {
    id: 'maalouf_stay_in_business_longer',
    deckId: 'maalouf_principles',
    prompt: 'What does "stay in business longer" mean as a closing principle?',
    canonicalAnswer:
      "Maalouf #6: long-term consistency beats short-term close-rate optimisation. The buyers who matter most will close 6-12 months out. Being there in 12 months is the move that wins those deals. Don't burn the relationship for a fast no-or-yes. The follow-up cadence (Founder Hub Outreach Hub) is the real product. Stay top-of-mind without being a pest. The 14-day → 30-day → 90-day touch sequence is the operational expression of this principle.",
    difficulty: 'core',
    applicationContext: 'Buyer says "not right now, maybe Q3." Do you push or fold?',
    source: 'closing-lab-data.ts',
    tag: 'principle_6',
  },
];

// ─── Cards: Satyam 5 Pillars ──────────────────────────────────────

const SATYAM_PILLARS_CARDS: EducationCard[] = [
  {
    id: 'satyam_category_of_one',
    deckId: 'satyam_pillars',
    prompt: 'What is "category of one" and why is it the most important pillar?',
    canonicalAnswer:
      "Satyam #1: frame Decision Intel as not-comparable. Name what the existing category does AND fails to do. Make Cloverpop / IBM watsonx / Aera feel like a different problem. Most important because direct comparison ('we're like Cloverpop but better') invites the buyer to cost-compare — and incumbents have more case studies, so you lose. Category-of-one breaks the comparison frame and forces the buyer to evaluate DI on its own terms.",
    difficulty: 'foundation',
    applicationContext: "Buyer says 'how is this different from Cloverpop?'",
    source: 'closing-lab-data.ts SATYAM_PILLARS',
    tag: 'pillar_1',
  },
  {
    id: 'satyam_us_vs_them',
    deckId: 'satyam_pillars',
    prompt: 'How do you do "us vs them" framing without being tacky?',
    canonicalAnswer:
      'Satyam #2: name the FAILURE MODE of the category, not the competitor. "Most decision-intelligence tools score the OUTCOMES — they tell you which decisions worked. We score the REASONING — we catch the bias before the call. That\'s a structural difference, not a feature comparison." Identifies the gap, doesn\'t bash competitors, leaves the buyer to draw their own conclusion.',
    difficulty: 'core',
    applicationContext: 'You want to differentiate without sounding defensive.',
    source: 'closing-lab-data.ts',
    tag: 'pillar_2',
  },
  {
    id: 'satyam_conviction_is_the_variable',
    deckId: 'satyam_pillars',
    prompt: 'Why is "conviction is the variable that makes everything else work"?',
    canonicalAnswer:
      "Satyam #3: you can have the best script, the tightest objection handling, the most carefully constructed offer — if the closer doesn't genuinely BELIEVE, none of it lands. Conviction is not performance. Sophisticated buyers read energy. They notice the micro-second of uncertainty before a number is stated, the slight softening when a tough question gets asked. Real conviction transmits — when you say 'this works' and you mean it, the buyer feels it. Build conviction through deep product knowledge, hearing client outcomes, building a personal record of the offer working.",
    difficulty: 'core',
    applicationContext: "You're nervous before a high-stakes pitch — what do you do?",
    source: 'closing-lab-data.ts',
    tag: 'pillar_3',
  },
  {
    id: 'satyam_charge_more_win_anyway',
    deckId: 'satyam_pillars',
    prompt: 'How do you charge MORE than incumbents while having less proof?',
    canonicalAnswer:
      "Satyam #4: through the QUALITY of the sales conversation. Price is a function of perceived value — and perceived value is constructed in real time, in the call, through the quality of diagnosis + specificity of the solution + confidence of the delivery + certainty of outcome. A closer who reflects the buyer's pain back with more precision than the buyer could have articulated, presents a mechanism that makes sense, backs it with relevant proof, and HOLDS the frame on price commands a premium over a competitor with stronger brand. Price is determined by the perceived value created in the conversation. The market rate is just the floor.",
    difficulty: 'advanced',
    applicationContext: "Buyer says 'X competitor is cheaper.' Do you discount?",
    source: 'closing-lab-data.ts',
    tag: 'pillar_4',
  },
  {
    id: 'satyam_infrastructure_is_the_weapon',
    deckId: 'satyam_pillars',
    prompt: 'What 5 components make up "sales infrastructure as the weapon"?',
    canonicalAnswer:
      "Satyam #5: (1) Tight QUALIFICATION — the prospects who hit the calendar are the right ones, properly contextualised. (2) PRE-CALL nurture — buyer arrives having consumed 3 relevant case studies + content that pre-handled their main objection. (3) OBJECTION libraries — the 5 objections that kill most deals are predictable; every closer should have the same tested language. (4) Call REVIEWS with specific feedback — 'at minute 14 you rushed to the pitch before pain was clear' beats 'good call.' (5) METRICS that matter — close rate by rep, cash collected per call, show rate by source, objection frequency by type. A team running on systems beats a team running on talent and vibes.",
    difficulty: 'core',
    applicationContext: 'Investor asks: "what does scaling sales look like for you?"',
    source: 'closing-lab-data.ts',
    tag: 'pillar_5',
  },
];

// ─── Cards: Silent Objections (5) ─────────────────────────────────

const SILENT_OBJECTIONS_CARDS: EducationCard[] = [
  {
    id: 'silent_dqi_trust_me_math',
    deckId: 'silent_objections',
    prompt: 'What is the "DQI trust-me math" silent objection, and what is the real answer?',
    canonicalAnswer:
      "Silent objection: 'You showed me a 67/100 score on a memo. How was that derived? Why should I trust the number?' The real answer: the DQI decomposes into 6 weighted components with explicit formulas in src/lib/scoring/dqi.ts; the per-org Brier-scored recalibration adjusts weights for THIS organisation's outcome history. The CURRENT gap: confidence intervals + suppressed dollar amounts in the demo. Status: in_progress per closing-lab-data.ts SILENT_OBJECTIONS — todo for the founder is to ship CI bands and remove fabricated dollar projections from the demo flow.",
    difficulty: 'advanced',
    applicationContext: "A skeptical CSO asks 'where does the 67 come from?'",
    source: 'closing-lab-data.ts SILENT_OBJECTIONS',
    tag: 'objection_1',
  },
  {
    id: 'silent_no_nda_hard_purge',
    deckId: 'silent_objections',
    prompt: 'What is the NDA hard-purge silent objection, and where does it come from?',
    canonicalAnswer:
      "Silent objection: 'I uploaded a confidential strategic memo. What stops you from training on it / sharing it / keeping it after I leave?' The real answer needs: explicit 7-day NDA hard-purge endpoint (POST /api/deals/[id]/archive — currently TODO), data-lifecycle DPR footer (shipped), schema-encryption (shipped — AES-256-GCM + KMS), and zero-training contractual clause in DPA. Status: TODO. Until the hard-purge endpoint ships, the objection lives.",
    difficulty: 'advanced',
    applicationContext: "GC asks 'what is your data retention posture?'",
    source: 'closing-lab-data.ts',
    tag: 'objection_2',
  },
  {
    id: 'silent_founder_continuity',
    deckId: 'silent_objections',
    prompt: 'What is the "founder continuity" silent objection, and what mitigates it?',
    canonicalAnswer:
      "Silent objection: 'You're 16. You'll go to university in 2 years. What happens to my data and the platform if you walk away?' The mitigation isn't dismissive ('I'll never walk away') — it's structural: (a) Vendor Continuity & Succession Plan one-pager naming the 2 senior advisors who'd take over operationally + the data-portability commitment in the DPA + the KMS-managed encryption keys with rotation independent of any single founder. Status: TODO — the one-pager doesn't exist yet. Until it does, the objection lives.",
    difficulty: 'advanced',
    applicationContext:
      'Margaret-class CSO asks about company longevity in procurement-stage call.',
    source: 'closing-lab-data.ts',
    tag: 'objection_3',
  },
  {
    id: 'silent_chatgpt_wrapper',
    deckId: 'silent_objections',
    prompt: 'What is the ChatGPT-wrapper objection, and what 3 specific moats answer it?',
    canonicalAnswer:
      "Silent objection: 'This looks like a system prompt around GPT-4 with a UI. Why pay you?' Three structural moats answer: (1) The 143-decision case library (cross-referenced patterns, not just prompt context). (2) The 17-framework regulatory mapping across G7 / EU / GCC / African markets (NDPR, CBN, WAEMU, PoPIA — Cloverpop / IBM watsonx don't cover). (3) The per-org Brier-scored outcome flywheel that recalibrates DQI weights for THIS organisation specifically (data moat that compounds with every audit — Cloverpop's data advantage but in YOUR direction). Plus: ensemble sampling across 3 model judges, NOT a single GPT call.",
    difficulty: 'advanced',
    applicationContext: 'Pre-seed investor or Adaeze-class associate asks the wrapper question.',
    source: 'closing-lab-data.ts + CLAUDE.md External Attack Vectors',
    tag: 'objection_4',
  },
  {
    id: 'silent_pan_african_regulatory',
    deckId: 'silent_objections',
    prompt:
      'What is the Pan-African regulatory illusion objection, and where does it live structurally?',
    canonicalAnswer:
      "Silent objection: 'You CLAIM Pan-African regulatory coverage but does the audit actually map to ISA 2007 / FRC Nigeria current code, or just NDPR?' The reality: the African-frameworks file (src/lib/compliance/frameworks/africa-frameworks.ts) covers NDPR, CBN, FRC Nigeria, WAEMU, CMA Kenya, CBK, BoG, CBE, PoPIA s.71, SARB Model Risk, BoT FinTech. ISA 2007 + FRC Nigeria current-code mapping: TODO. Until that mapping ships, a Pan-African GC who reads the framework list will catch the gap. Status: TODO.",
    difficulty: 'advanced',
    applicationContext:
      'Titi-class fund partner shares brief with her IC partner — IC partner asks the question.',
    source: 'closing-lab-data.ts + CLAUDE.md positioning',
    tag: 'objection_5',
  },
];

// ─── Cards: 11 Sales DQI Grading Dimensions ───────────────────────

const GRADING_DIMENSIONS_CARDS: EducationCard[] = [
  {
    id: 'rubric_pressure_without_pressure',
    deckId: 'grading_dimensions',
    prompt:
      'In the Sales DQI rubric, what does "pressure without pressure" measure, and what is excellent vs poor?',
    canonicalAnswer:
      "Maalouf source. Weight: 0.08. Excellent (5/5): buyer feels urgency to move but cannot point to anywhere you pushed them. Naturally references other conversations or scarcity (5 design-partner seats, 4 left). Poor (1/5): either flat (no urgency) or visibly pushy ('limited time', 'last chance'). Both fail.",
    difficulty: 'core',
    applicationContext: 'Self-grading after a sales rep — did you create urgency without pushing?',
    source: 'sparring-room-data.ts GRADING_DIMENSIONS',
    tag: 'maalouf',
  },
  {
    id: 'rubric_authority_not_trust',
    deckId: 'grading_dimensions',
    prompt: 'In the Sales DQI rubric, what does "authority not trust" measure?',
    canonicalAnswer:
      "Maalouf source. Weight: 0.10. Excellent (5/5): speaks AS the category creator, not someone hoping to be trusted. References work as fact. NO 'I think' / 'I believe' on load-bearing claims. Poor (1/5): hedging language. 'I think we can help.' 'Hopefully this is useful.' Reads as asking for permission to be the expert.",
    difficulty: 'core',
    applicationContext: "Catching yourself using 'I think' before a load-bearing claim.",
    source: 'sparring-room-data.ts',
    tag: 'maalouf',
  },
  {
    id: 'rubric_pinpoint_pain',
    deckId: 'grading_dimensions',
    prompt: 'In the Sales DQI rubric, what does "pinpoint pain" measure?',
    canonicalAnswer:
      "Maalouf source. Weight: 0.10. Excellent (5/5): names the SPECIFIC pain in the buyer's vocabulary, not generic strategy-team pain. Buyer thinks 'wait, how did they know that.' Poor (1/5): generic pain ('strategic decisions are hard'). The buyer disengages — they came in with a SPECIFIC pain and you missed it.",
    difficulty: 'core',
    applicationContext: 'Generic vs specific pain framing.',
    source: 'sparring-room-data.ts',
    tag: 'maalouf',
  },
  {
    id: 'rubric_embody_bigger',
    deckId: 'grading_dimensions',
    prompt: 'In the Sales DQI rubric, what does "embody bigger" measure?',
    canonicalAnswer:
      "Maalouf source. Weight: 0.08. Excellent (5/5): speaks from a category-creator position. Uses pause and pacing as power. Talks about other conversations naturally. Reads as someone the buyer should chase. Poor (1/5): eager, over-explaining, rushing. 'Oh and another thing we can do is...' — every additional capability dilutes authority.",
    difficulty: 'core',
    applicationContext: 'Restraint vs over-explanation.',
    source: 'sparring-room-data.ts',
    tag: 'maalouf',
  },
  {
    id: 'rubric_category_of_one',
    deckId: 'grading_dimensions',
    prompt: 'In the Sales DQI rubric, what does "category of one" measure?',
    canonicalAnswer:
      "Satyam source. Weight: 0.08. Excellent (5/5): frames DI as not-comparable. Names what the existing category does AND fails to do. Makes Cloverpop / IBM watsonx / Aera feel like a different problem. Poor (1/5): compares directly. 'We are like Cloverpop but better' is the worst-case framing — invites the buyer to cost-compare.",
    difficulty: 'core',
    applicationContext: "Buyer asks 'how is this different from X?'",
    source: 'sparring-room-data.ts',
    tag: 'satyam',
  },
  {
    id: 'rubric_conviction_transmission',
    deckId: 'grading_dimensions',
    prompt: 'In the Sales DQI rubric, what does "conviction transmission" measure?',
    canonicalAnswer:
      "Satyam source. Weight: 0.10. Excellent (5/5): the voice carries belief. Buyer feels you've seen this work before. No softening on load-bearing claims. Anchored in something specific (case study, mechanism, regulator citation). Poor (1/5): tentative on the core claim. Softens when challenged. 'Maybe' / 'we think' / 'possibly' on the highest-stakes lines.",
    difficulty: 'core',
    applicationContext: 'You feel the urge to soften your strongest claim — STOP.',
    source: 'sparring-room-data.ts',
    tag: 'satyam',
  },
  {
    id: 'rubric_sales_infra_quality',
    deckId: 'grading_dimensions',
    prompt: 'In the Sales DQI rubric, what does "sales infrastructure quality" measure?',
    canonicalAnswer:
      "Satyam source. Weight: 0.08. Excellent (5/5): the conversation has structure: discovery → diagnosis → mechanism → proof → ask. Each step lands cleanly. No skipping discovery to pitch features. Poor (1/5): pitch first, discover later. Or rambling — buyer cannot tell what step you're on. Or no specific ask at the end ('we should talk again sometime').",
    difficulty: 'core',
    applicationContext: 'Self-grading the conversation arc.',
    source: 'sparring-room-data.ts',
    tag: 'satyam',
  },
  {
    id: 'rubric_vocabulary_discipline',
    deckId: 'grading_dimensions',
    prompt:
      'In the Sales DQI rubric, what does "vocabulary discipline" measure, and what trips it up?',
    canonicalAnswer:
      "DI discipline source. Weight: 0.06. Excellent (5/5): uses right vocab for reader temperature. Cold → descriptive plain-language. Warm → locked vocabulary (reasoning layer, R²F, DPR). NEVER uses banned phrases. Poor (1/5): drops 'reasoning layer' or 'R²F' on a cold buyer. Or uses 'decision intelligence platform' (Gartner-crowded). Or 'decision hygiene' (Kahneman's term — borrowing it cedes our category vocabulary).",
    difficulty: 'core',
    applicationContext: "Cold meeting — you're about to say 'reasoning layer' — STOP.",
    source: 'sparring-room-data.ts',
    tag: 'di_discipline',
  },
  {
    id: 'rubric_empathic_mode_first',
    deckId: 'grading_dimensions',
    prompt: 'In the Sales DQI rubric, what does "empathic-mode-first" measure?',
    canonicalAnswer:
      "DI discipline source. Weight: 0.10. Excellent (5/5): leads with what the BUYER is trying to do, not what DI does. Lands the buyer's pain in the buyer's words BEFORE introducing the product. Buyer feels seen. Poor (1/5): product-first framing. 'We have a 12-node pipeline.' 'Our DPR is hashed and tamper-evident.' Buyer hears: 'they don't see me yet.'",
    difficulty: 'core',
    applicationContext: 'First sentence to a cold buyer — is it about you or them?',
    source: 'sparring-room-data.ts',
    tag: 'di_discipline',
  },
  {
    id: 'rubric_loss_aversion_framing',
    deckId: 'grading_dimensions',
    prompt:
      'In the Sales DQI rubric, what does "loss-aversion framing" measure, and what is the academic anchor?',
    canonicalAnswer:
      "Kahneman source — prospect theory. Weight: 0.10. Academic anchor: Kahneman & Tversky 1979 — losses weight ~2-2.5× gains in decision-making. Excellent (5/5): frames value as preventing a SPECIFIC, named loss the buyer is already worrying about — the regrettable strategic mistake, the career-limiting board disclosure, the LP pulling capital, the McKinsey bill that told them what they should have caught themselves. Anchors price against a comparable cost the buyer already accepts. The buyer feels the price IS small relative to what they're already losing without it. Poor (1/5): frames as upside / gain only ('better decisions', 'improved quality'). The buyer hears upside and discounts (status-quo bias + loss aversion: the cost is certain, the gain is hypothetical).",
    difficulty: 'advanced',
    applicationContext:
      'Pricing conversation: do you say "you could improve" or "you could prevent X"?',
    source: 'sparring-room-data.ts (added 2026-04-28)',
    tag: 'kahneman',
  },
  {
    id: 'rubric_specificity_over_vagueness',
    deckId: 'grading_dimensions',
    prompt: 'In the Sales DQI rubric, what does "specificity over vagueness" measure?',
    canonicalAnswer:
      "Fundamentals source. Weight: 0.12 (highest single weight). Excellent (5/5): concrete examples in every paragraph. Names a specific case (WeWork S-1, Dangote 2014, McKinsey 8% statistic), a specific bias (overconfidence, narrative fallacy), a specific regulation (EU AI Act Article 14, NDPR). Buyer can repeat the line back to a colleague. Poor (1/5): vague throughout. 'Better outcomes.' 'Strategic clarity.' 'Improved decision-making.' Buyer cannot repeat anything specific.",
    difficulty: 'core',
    applicationContext: 'Self-grading: can the buyer repeat ONE thing you said to a colleague?',
    source: 'sparring-room-data.ts',
    tag: 'fundamentals',
  },
];

// ─── Cards: Cognitive Biases (10 most common in strategic memos) ──

const COGNITIVE_BIASES_CARDS: EducationCard[] = [
  {
    id: 'bias_confirmation',
    deckId: 'cognitive_biases',
    prompt: 'What is confirmation bias and how does it show up in a strategic memo?',
    canonicalAnswer:
      "Confirmation bias: the tendency to search for, interpret, and recall information that confirms a prior belief while discounting contradicting evidence. In a strategic memo, it shows up as cherry-picked supporting data, dismissive treatment of counter-evidence ('but those cases are different because...'), and recommendation language that assumes the conclusion before laying out the reasoning. The DI audit catches this through the structuralAssumptions node + cross-referencing the memo against the 143-decision case library.",
    difficulty: 'foundation',
    applicationContext:
      'Reviewing a strategic memo where the conclusion was reached before the analysis.',
    source: 'src/lib/constants/bias-education.ts DI-B-001',
    tag: 'foundational',
  },
  {
    id: 'bias_anchoring',
    deckId: 'cognitive_biases',
    prompt: 'What is anchoring bias and what is the canonical example in M&A?',
    canonicalAnswer:
      "Anchoring bias: heavy reliance on the first piece of information offered (the 'anchor') when making decisions. In M&A: the seller's asking price anchors the buyer's negotiation range, even when fundamental valuation suggests a much lower number. Or: the prior comparable transaction multiple anchors the IC's view, even when this deal's structural drivers are different. DI catches this through the noiseJudge node which tests how the recommendation would shift if the initial anchor were removed.",
    difficulty: 'foundation',
    applicationContext: 'A CIM that opens with the seller-stated EBITDA multiple as the framing.',
    source: 'bias-education.ts DI-B-002',
    tag: 'foundational',
  },
  {
    id: 'bias_sunk_cost',
    deckId: 'cognitive_biases',
    prompt: 'What is sunk-cost fallacy and how does it show up in corporate strategy?',
    canonicalAnswer:
      "Sunk-cost fallacy: continuing investment in a failing project because of cumulative prior investment, rather than evaluating future expected value. In corporate strategy: 'we have already spent $40M on this market entry, we cannot pull out now.' The DI audit catches this through the rpdRecognition node (Klein's framework) which identifies the situation pattern as 'losing-battle commitment' and triggers a counter-pre-mortem on the 'continue' option.",
    difficulty: 'foundation',
    applicationContext: 'A failing market-entry where the founder/CSO is rationalising more spend.',
    source: 'bias-education.ts',
    tag: 'foundational',
  },
  {
    id: 'bias_narrative_fallacy',
    deckId: 'cognitive_biases',
    prompt: 'What is narrative fallacy and why is it especially dangerous in IC memos?',
    canonicalAnswer:
      "Narrative fallacy (Taleb): the human tendency to construct compelling stories from ambiguous data, then mistake the story for reality. In IC memos: 'this CEO grew the business 3x in 4 years — they will replicate that here' constructs a causal narrative from past success, ignoring base rates, regression to the mean, and survivor bias. DI's metaJudge final-verdict node specifically tests for narrative-fallacy structure: does the memo argue from anecdote-as-pattern?",
    difficulty: 'core',
    applicationContext: 'An IC memo that leans heavily on the founder/CEO biography.',
    source: 'bias-education.ts',
    tag: 'foundational',
  },
  {
    id: 'bias_overconfidence',
    deckId: 'cognitive_biases',
    prompt: 'What is overconfidence bias and how does the DI noiseJudge address it?',
    canonicalAnswer:
      "Overconfidence: systematic over-estimation of one's own knowledge or predictive accuracy. In strategy: 'we are 90% sure this market entry succeeds' when the base rate of similar entries is 40%. Tetlock's superforecasting research is the academic anchor. DI's noiseJudge node introduces a second independent judge that scores the same memo blind — the variance between judges is itself a signal of memo-overconfidence: a memo that seems certain to one judge but uncertain to another is structurally over-claiming.",
    difficulty: 'core',
    applicationContext: 'A memo with high-precision claims and no calibration discussion.',
    source: 'bias-education.ts + research/foundations Tetlock',
    tag: 'foundational',
  },
  {
    id: 'bias_availability',
    deckId: 'cognitive_biases',
    prompt: 'What is availability heuristic and what is the DI defense?',
    canonicalAnswer:
      "Availability heuristic: judging probability by how easily examples come to mind. Recent or vivid events feel more likely than they statistically are. In M&A: a recent successful deal in the sector feels like 'the sector is hot' even when the success rate hasn't actually shifted. DI's intelligenceGatherer node pulls statistical base rates from the 143-decision case library and surfaces the gap between 'how this case feels' and 'how similar cases historically performed.'",
    difficulty: 'core',
    applicationContext:
      'CSO says "everyone is doing X right now" — but is that statistically true?',
    source: 'bias-education.ts',
    tag: 'foundational',
  },
  {
    id: 'bias_halo_effect',
    deckId: 'cognitive_biases',
    prompt: 'What is the halo effect and where is it most dangerous in B2B sales?',
    canonicalAnswer:
      "Halo effect: an overall impression of an entity influences specific judgments about it. In B2B sales: 'this founder is impressive — therefore the product is good — therefore the unit economics are good — therefore I should invest.' Each step is a separate question, but the halo collapses them. ALSO useful offensively in your own pitch: signal sharpness on ONE dimension (the WeWork S-1 audit specimen) and the buyer transfers that sharpness to other dimensions (the team, the product, the moat). Use it carefully — Kahneman warns it's the bias that builds the strongest false confidence.",
    difficulty: 'advanced',
    applicationContext: 'In your own pitch — what is the ONE artefact that creates the right halo?',
    source: 'bias-education.ts',
    tag: 'foundational',
  },
  {
    id: 'bias_illusion_of_control',
    deckId: 'cognitive_biases',
    prompt: 'What is illusion of control and how does it bias strategic recommendations?',
    canonicalAnswer:
      "Illusion of control: people overestimate their ability to influence outcomes that are largely determined by external factors (FX cycles, regulator decisions, macro shocks). In Pan-African investing: 'we will time the naira devaluation correctly' is a classic illusion of control. DI's structuralAssumptions node (extended 2026-04-26) injects sovereign-context branching for Nigeria, Kenya, Ghana, WAEMU, South Africa, Egypt — surfacing the macro factors the memo is implicitly assuming control over.",
    difficulty: 'core',
    applicationContext:
      'A Nigeria-focused fund memo that assumes the team can hedge naira FX risk.',
    source: 'bias-education.ts + sovereign-context branching',
    tag: 'foundational',
  },
  {
    id: 'bias_planning_fallacy',
    deckId: 'cognitive_biases',
    prompt: 'What is the planning fallacy and what is the DI countermeasure?',
    canonicalAnswer:
      "Planning fallacy (Kahneman): systematic underestimation of time, costs, and risks of future actions, while simultaneously overestimating their benefits. Even when teams know about it abstractly, they don't apply it to their own plans. In strategic memos: the launch timeline, the cost projection, the revenue ramp — all systematically optimistic. DI's pre-mortem node (Klein's framework) imagines the project failed in 18 months and asks 'why' — surfacing planning-fallacy assumptions before they become commitments.",
    difficulty: 'core',
    applicationContext: 'A market-entry memo with an aggressive 6-month launch timeline.',
    source: 'bias-education.ts + pipeline pre-mortem node',
    tag: 'foundational',
  },
  {
    id: 'bias_loss_aversion',
    deckId: 'cognitive_biases',
    prompt:
      'What is loss aversion (the bias) and how do you BOTH defend against it AND use it in your own sales pitch?',
    canonicalAnswer:
      "Loss aversion (Kahneman & Tversky 1979): losses weight ~2-2.5× gains in decision-making. As a BIAS to defend against: organisations refuse to exit failing markets because exit is framed as 'taking the loss' rather than 'redeploying capital to higher-return opportunities.' DI's audit reframes exit decisions as forward-looking expected-value comparisons. As a SALES TOOL: frame DI's value as preventing a specific named loss (the regrettable strategic mistake, the McKinsey bill, the partner pushback). The buyer's loss-aversion makes the price feel SMALL relative to what they're losing without it. Same psychology, two directions — defense for clients, weapon for your own pitch.",
    difficulty: 'advanced',
    applicationContext:
      "You're both auditing a CSO's exit decision AND pitching them on the audit tool.",
    source: 'bias-education.ts + sparring-room loss_aversion_framing dimension',
    tag: 'kahneman',
  },
  {
    id: 'bias_illusion_of_validity',
    deckId: 'cognitive_biases',
    prompt:
      "What is illusion of validity (DI-B-021), what is the Kahneman & Klein 2009 paper's finding about it, and how does the DI audit catch it?",
    canonicalAnswer:
      "Illusion of validity (Kahneman & Klein 2009 'Conditions for Intuitive Expertise: A Failure to Disagree'): subjective confidence comes from the COHERENCE of the story the brain has constructed, not from the strength of the evidence behind that story. The 2009 paper agrees that confidence is decoupled from accuracy — a coherent narrative produces high confidence even when the underlying evidence is thin or misleading. In strategic memos: 'we are certain', 'guaranteed market capture', 'highly predictable cash flows', 'clear path to scale' without external base rates or reference-class comparisons. DI catches it via biasDetective DI-B-021 (rhetorical-certainty scanner) plus validity-aware scoring: in low-validity environments (M&A, market entry, long-horizon strategy), confidence-language is penalised harder than in high-validity environments. The toxic combination 'Coherent Confidence' (Illusion of Validity + Overconfidence + Confirmation/Halo) is the most dangerous pattern in low-validity domains.",
    difficulty: 'advanced',
    applicationContext:
      'Reviewing a memo whose recommendation reads as obviously right because the story is so well-constructed.',
    source: 'bias-education.ts DI-B-021 + Kahneman & Klein 2009',
    tag: 'kahneman_klein',
  },
  {
    id: 'bias_prospective_hindsight',
    deckId: 'cognitive_biases',
    prompt:
      "What is 'prospective hindsight' (Mitchell, Russo, Pennington 1989 / Klein 1995) and why is it the load-bearing instruction in a pre-mortem?",
    canonicalAnswer:
      "Prospective hindsight: the cognitive technique of projecting yourself into a future where an event has ALREADY OCCURRED, then explaining how it happened — instead of asking 'what could go wrong?' in conditional voice. Mitchell, Russo & Pennington (1989) showed this framing produces 25-30% more, and substantially higher-quality, failure-cause insights than the conditional alternative. Klein (1995) operationalised it as the pre-mortem technique: 'we are 1 year in the future; the plan was implemented; the outcome was a TOTAL DISASTER; write the HISTORY of that disaster.' Past tense, fait-accompli framing, no 'might' or 'could'. DI's pre-mortem prompts (3 surfaces in src/lib/agents/prompts.ts) enforce this exact framing — locked 2026-04-30 in the paper-application sprint. The mechanism is that generating an EXPLANATION for a fait-accompli outcome fires causal-reasoning circuits that the conditional 'what if' frame doesn't.",
    difficulty: 'advanced',
    applicationContext:
      "Running a pre-mortem on your own decision in the Founder Hub copilot, OR auditing a memo whose pre-mortem section reads as boilerplate risk-listing.",
    source: 'src/lib/agents/prompts.ts + Klein & Mitchell 1995 + Mitchell, Russo, Pennington 1989',
    tag: 'kahneman_klein',
  },
  {
    id: 'bias_feedback_adequacy',
    deckId: 'cognitive_biases',
    prompt:
      "What is the second condition for trustworthy intuition (Kahneman & Klein 2009), and how does DI's Feedback Adequacy block on the DPR operationalise it?",
    canonicalAnswer:
      "Kahneman & Klein (2009) agree that intuitive judgments can only be trusted when TWO conditions hold: (1) the environment is high-validity (predictable cue→outcome mappings), AND (2) the decision-maker has had ADEQUATE OPPORTUNITY TO LEARN — repeated rapid feedback in that environment. Without condition #2, 'years of experience' produces no actual expertise; the person has years of exposure to ambiguous feedback but no calibrated cue→outcome map. DI's biasDetective + structuralAssumptions audit condition #1; the new Feedback Adequacy block on the DPR cover (locked 2026-04-30) audits condition #2. Verdict bands: 'adequate' (≥10 closed outcomes in domain in past 18 months — sufficient calibration), 'sparse' (3-9 — too few for calibrated weight), 'cold_start' (<3 — no track record yet, treat experience-claims with cold-start scrutiny). The block reads honestly: a procurement reader sees whether the memo's author has the closed-loop history their experience claims rely on. Implementation: src/lib/learning/feedback-adequacy.ts.",
    difficulty: 'advanced',
    applicationContext:
      "Procurement-grade conversations where a buyer asks 'how do you know this audit is right?' — the DPR's Feedback Adequacy block is part of the answer.",
    source: 'src/lib/learning/feedback-adequacy.ts + Kahneman & Klein 2009',
    tag: 'kahneman_klein',
  },
  {
    id: 'bias_reference_class_forecasting',
    deckId: 'cognitive_biases',
    prompt:
      "What is reference-class forecasting (Kahneman & Lovallo 2003), and how does DI's Reference Class Forecast on the DPR cover operationalise it as a procurement signal?",
    canonicalAnswer:
      "Reference-class forecasting (Kahneman & Lovallo 2003 'Delusions of Success', HBR): the technique of stepping out of the inside-view narrative a memo constructs and benchmarking its predicted outcome against a REFERENCE CLASS — a set of historically similar decisions whose outcomes are already known. The 70-90% M&A failure rate in the DI hero copy IS a reference-class statistic. DI now ships this as a MANDATORY block on every DPR cover (locked 2026-04-30): pure-function similarity scoring against the 143-case library returns top-5 historical analogs + matched-class baseline failure rate + a four-band predicted-outcome verdict (succeeds / mixed / struggles / fails / too_small_to_judge). No LLM call — deterministic, runs <5ms. The block answers 'is this audit benchmarked against historical outcomes or generated from inside-view narrative?' with a public-checkable artefact. Implementation: src/lib/learning/reference-class-forecast.ts.",
    difficulty: 'advanced',
    applicationContext:
      "Pitching the DPR to a Pan-African fund partner or F500 GC — 'every audit benchmarks against the 143-case library; the procurement-stage answer is one click.'",
    source: 'src/lib/learning/reference-class-forecast.ts + Kahneman & Lovallo 2003',
    tag: 'kahneman_klein',
  },
  {
    id: 'bias_validity_classifier',
    deckId: 'cognitive_biases',
    prompt:
      "What is the validity-aware DQI shift (locked 2026-04-30, methodology v2.1.0), and what does it actually change about how DI scores a memo?",
    canonicalAnswer:
      "Kahneman & Klein (2009) FIRST condition for trustworthy intuition: the environment must be HIGH-VALIDITY — predictable cue→outcome mappings, rapid feedback (medicine, firefighting, chess all qualify; M&A, market entry, long-horizon strategy do NOT). DI's validity classifier (src/lib/learning/validity-classifier.ts) maps each audit onto one of four bands (high / medium / low / zero) based on documentType + industry + decision horizon. The DQI engine reads the band and applies a STRUCTURAL WEIGHT SHIFT in low- and zero-validity environments: increases historicalAlignment weight (+0.10 in low, +0.20 in zero), increases biasLoad weight, decreases evidenceQuality + processMaturity + complianceRisk weights. The reference-class signal becomes the dominant DQI driver where verifiable facts about the present don't predict outcomes. Methodology version on the result reads '2.1.0' when the shift was applied; '2.0.0-no-validity' for legacy inputs. The DPR cover surfaces the validity band + rationale + methodology version, so a procurement reader can see whether the score in front of them was computed with the validity shift applied.",
    difficulty: 'advanced',
    applicationContext:
      "When a CSO or fund partner asks 'why does your audit score lower than the analyst's confidence reads?' — answer with the validity band + reweight rationale.",
    source:
      'src/lib/learning/validity-classifier.ts + src/lib/scoring/dqi.ts + Kahneman & Klein 2009',
    tag: 'kahneman_klein',
  },
  {
    id: 'bias_inside_view_dominance',
    deckId: 'cognitive_biases',
    prompt:
      "What is inside-view dominance (DI-B-022, Kahneman & Lovallo 2003), and what is the canonical example?",
    canonicalAnswer:
      "Inside-view dominance: reasoning from CASE-SPECIFIC details (we are talented, motivated, on track, this case is special) while ignoring the historical BASE RATE of similar decisions. Kahneman's canonical example (1976 Israeli curriculum-writing team): the team estimated 18 months to completion, even though the most senior member knew that 40% of such projects had previously been abandoned and the rest averaged 8 years. The inside-view narrative completely dominated the outside-view base rate. The team finished in 8 years. DI-B-022 detects: 'this case is special' / 'the comparables don't apply' / 'industry data doesn't reflect our situation' / projections without grounding in a named comparable set. Severity scales: 'critical' when the memo explicitly dismisses an industry base rate; 'high' when it's silent on base rates; 'medium' when it cites comparables but doesn't engage with their distribution; 'low' when one comparable is named but the fuller class is omitted. New compound interactions: + Planning Fallacy (1.6×), + Overconfidence (1.5×), + Illusion of Validity (1.4×). New toxic combination: 'Reference-Class Blindness' (Inside-View Dominance + Planning Fallacy + Overconfidence) — the canonical Kahneman & Lovallo failure pattern.",
    difficulty: 'advanced',
    applicationContext:
      "Reviewing an IC memo that opens with 'this deal is different because…' — the dismissal of comparables is itself the bias. DI-B-022 catches it.",
    source: 'src/lib/constants/bias-education.ts DI-B-022 + Kahneman & Lovallo 2003',
    tag: 'kahneman_klein',
  },
];

// ─── Cards: 12-Node Pipeline (representative 6) ──────────────────

const PIPELINE_NODES_CARDS: EducationCard[] = [
  {
    id: 'pipeline_structural_assumptions',
    deckId: 'pipeline_nodes',
    prompt: 'What does the structuralAssumptions node do, and what is its academic anchor?',
    canonicalAnswer:
      "Identifies the implicit structural assumptions a memo is making about the world (macro / regulatory / sovereign / competitive). For Pan-African / EM markets, it injects sovereign-context branching: Nigeria (naira free-float + CBN I&E window), Kenya (KES managed float), Ghana (cedi + IMF cycle), WAEMU, South Africa, Egypt. Academic anchor: Ray Dalio's Principles for Dealing with the Changing World Order (sovereign cycle dynamics). Currently runs gemini-3-flash-preview. Output: structured list of assumptions with confidence ratings.",
    difficulty: 'core',
    applicationContext: 'Explaining the Pan-African differentiation to a Titi-class fund partner.',
    source: 'src/lib/agents/nodes.ts + prompts.ts buildStructuralAssumptionsPrompt',
    tag: 'pipeline',
  },
  {
    id: 'pipeline_bias_detective',
    deckId: 'pipeline_nodes',
    prompt: 'What does the biasDetective node do and what taxonomy does it use?',
    canonicalAnswer:
      "Detects cognitive biases in the memo against the 30+ bias DI taxonomy (DI-B-001 through DI-B-020 stable IDs + extended set). Returns flagged passages with bias name, severity (high/medium/low), confidence, and explanation. Academic anchor: Kahneman & Tversky's heuristics-and-biases program. The bias names use snake_case keys (confirmation_bias, anchoring_bias). Definitions live in src/lib/constants/bias-education.ts. The flagged passages are what surface in the InlineAnalysisResultCard top-3 biases list.",
    difficulty: 'foundation',
    applicationContext: 'Demoing the 60-second audit — what runs first?',
    source: 'src/lib/agents/nodes.ts',
    tag: 'pipeline',
  },
  {
    id: 'pipeline_noise_judge',
    deckId: 'pipeline_nodes',
    prompt: 'What does the noiseJudge node do, and what is its academic anchor?',
    canonicalAnswer:
      'Runs an independent SECOND judgement of the same memo and measures variance against the primary biasDetective output. Academic anchor: Kahneman, Sibony & Sunstein 2021 NOISE — "the chief enemy of good judgement is not bias, it is NOISE" (variance between judges who should agree). The noise score is a separate signal from the bias score. High noise + low bias = the memo is provoking inconsistent reads; not necessarily biased but structurally ambiguous. Low noise + high bias = the bias is consistent and easy to flag. The interaction matters.',
    difficulty: 'advanced',
    applicationContext: 'Investor asks "why two judges instead of one?"',
    source: 'CLAUDE.md research foundations + nodes.ts',
    tag: 'pipeline',
  },
  {
    id: 'pipeline_rpd_recognition',
    deckId: 'pipeline_nodes',
    prompt: 'What does the rpdRecognition node do, and how does it complete R²F?',
    canonicalAnswer:
      "Klein's Recognition-Primed Decision framework. Identifies the situation pattern in the memo (M&A target like 'losing-battle commitment', or market-entry like 'naira-devaluation timing') and pulls historical analogs from the 143-decision case library. Returns: situational pattern + historical analogs ranked by structural similarity + recognition-based recommendation. This is Klein's HALF of R²F — recognition (System 1 amplification). The Kahneman half (debiasing — biasDetective + noiseJudge + statisticalJury) is System 2 rigor. Together they ARE R²F. No competitor combines both.",
    difficulty: 'core',
    applicationContext: 'Investor asks about IP / why is this defensible.',
    source: 'CLAUDE.md Kahneman×Klein synthesis lock',
    tag: 'pipeline',
  },
  {
    id: 'pipeline_pre_mortem',
    deckId: 'pipeline_nodes',
    prompt: 'What does the pre-mortem node do, and what is its academic anchor?',
    canonicalAnswer:
      "Klein's pre-mortem technique. Imagines the recommendation has been implemented and FAILED 18 months later — then asks 'why did it fail?' Surfaces failure modes the memo's prospective framing missed. Klein's research: pre-mortem analysis increases the ability to identify reasons for future failure by 30%. Output: 5-7 specific failure scenarios ranked by probability + early-warning signal that would indicate each failure mode is materialising.",
    difficulty: 'foundation',
    applicationContext: 'Demoing how DI catches what a normal review misses.',
    source: 'CLAUDE.md research foundations + nodes.ts',
    tag: 'pipeline',
  },
  {
    id: 'pipeline_meta_judge',
    deckId: 'pipeline_nodes',
    prompt: 'What does the metaJudge node do, and why does it run on gemini-2.5-pro?',
    canonicalAnswer:
      'The final-verdict node. Reviews ALL upstream node outputs (structuralAssumptions, biasDetective, noiseJudge, rpdRecognition, forgottenQuestions, pre-mortem, statisticalJury) and produces the integrated DQI score with explanatory narrative. Runs on gemini-2.5-pro (the Pro-tier exception in the model policy) because reasoning quality matters more than cost on the highest-leverage single call in the pipeline. The metaJudge output is what the buyer SEES first in the analysis — the executive summary, the DQI score, the recommendation. Override via GEMINI_MODEL_PRO env var.',
    difficulty: 'advanced',
    applicationContext: 'CTO asks about the model policy and per-audit cost composition.',
    source: 'CLAUDE.md Gemini model policy lock 2026-04-27',
    tag: 'pipeline',
  },
];

// ─── Cards: DQI Methodology (5) ──────────────────────────────────

const DQI_METHODOLOGY_CARDS: EducationCard[] = [
  {
    id: 'dqi_components_weights',
    deckId: 'dqi_methodology',
    prompt: 'What are the 6 components of the DQI score and their weights?',
    canonicalAnswer:
      'The DQI decomposes into 6 weighted components (defined in src/lib/scoring/dqi.ts): (1) Bias score (severity-weighted), (2) Structural assumptions score, (3) Noise / inter-judge variance, (4) Pre-mortem coverage (failure modes considered), (5) Recognition score (historical-analog grounding), (6) Statistical / base-rate alignment. Weights are calibrated against the 143-case library. The recalibratedDqi field on Analysis is updated per-org based on Brier-scored outcomes — so the weights drift toward what THIS org actually predicts.',
    difficulty: 'core',
    applicationContext: 'CSO asks "what does the score actually measure?"',
    source: 'src/lib/scoring/dqi.ts',
    tag: 'methodology',
  },
  {
    id: 'dqi_grade_boundaries',
    deckId: 'dqi_methodology',
    prompt: 'What are the canonical DQI grade boundaries?',
    canonicalAnswer:
      'A: 85+ / B: 70+ / C: 55+ / D: 40+ / F: <40. Defined in src/lib/scoring/dqi.ts → GRADE_THRESHOLDS. The boundaries are CANONICAL — every consumer that maps score-to-grade MUST import from this canonical source. Re-implementing the same logic in another file is the drift-class bug (caught quick-score.ts:scoreToGrade using the wrong thresholds 90/70/50/30 in the 2026-04-27 slop-scan sweep). When changing boundaries, update both GRADE_THRESHOLDS and the JSDoc at the top of dqi.ts in the same commit.',
    difficulty: 'foundation',
    applicationContext: 'Buyer sees a 67/100 — what grade?',
    source: 'src/lib/scoring/dqi.ts + CLAUDE.md DQI Grade Boundaries lock',
    tag: 'methodology',
  },
  {
    id: 'dqi_brier_score',
    deckId: 'dqi_methodology',
    prompt: 'What is the Brier score and how does it close the outcome loop?',
    canonicalAnswer:
      "Brier score: a measure of probabilistic prediction accuracy — the squared difference between predicted probability and actual outcome (0-1, lower is better). After every audit's outcome is logged (the decision worked, partially worked, or failed), DI computes a Brier score for THAT audit's predictions and feeds it into the per-org recalibration. Over time, the org's DQI weights shift toward what actually predicts THIS organisation's outcomes — Cloverpop's data advantage moat, but flowing in DI's direction. Lives in src/lib/learning/brier-scoring.ts (with .test.ts, 20 tests).",
    difficulty: 'core',
    applicationContext: 'CSO asks "how does this learn from our actual outcomes?"',
    source: 'CLAUDE.md Key Files + brier-scoring.ts',
    tag: 'methodology',
  },
  {
    id: 'dqi_recalibration',
    deckId: 'dqi_methodology',
    prompt: 'What is per-org recalibration and where does it live?',
    canonicalAnswer:
      "Outcome-driven DQI recalibration adjusts the per-org component weights based on Brier-scored outcome history. Implementation: src/lib/learning/recalibration.ts → recalibrateFromOutcome(). Triggered by both outcome-logging routes (manual user submission + auto-detection from integrations). Result stored on Analysis.recalibratedDqi (nullable JSON, added April 2026). The 'compounds quarter after quarter' marketing claim is grounded in this recalibration: per-org weights drift toward what actually predicts THIS organisation's outcomes.",
    difficulty: 'advanced',
    applicationContext: 'Investor asks how the data flywheel actually works mechanically.',
    source: 'CLAUDE.md Key Files + recalibration.ts',
    tag: 'methodology',
  },
  {
    id: 'dqi_validation',
    deckId: 'dqi_methodology',
    prompt: 'What is the validation discipline for DQI scoring?',
    canonicalAnswer:
      "DQI is calibrated against the 143-decision case library (deduped 2026-04-16 from 146). Each historical case has a known outcome — DQI weights are tuned so that historically-failed decisions score lower and historically-successful ones score higher, with appropriate variance. The Bias Genome page (/bias-genome) surfaces aggregated cohort-level patterns — 'failure lift' = bias failure rate / baseline failure rate. n>=5 for headline rankings; n<3 surfaces with a warning flag.",
    difficulty: 'advanced',
    applicationContext: 'Procurement asks for the validation methodology.',
    source: 'CLAUDE.md Bias Genome + 143 historical decisions lock',
    tag: 'methodology',
  },
];

// ─── Cards: Regulatory Frameworks (8 most invoked) ──────────────

const REGULATORY_FRAMEWORKS_CARDS: EducationCard[] = [
  {
    id: 'reg_eu_ai_act',
    deckId: 'regulatory_frameworks',
    prompt:
      'EU AI Act: what is the anchor article DI maps to, and what is the enforcement timeline?',
    canonicalAnswer:
      'Article 14 (human oversight) is the anchor — the DPR maps onto Art 14 record-keeping by design. Also relevant: Art 13 (transparency), Art 15 (accuracy + record-keeping), Annex III (high-risk use cases). Timeline: EU AI Act in force since Aug 2024. Prohibited practices enforceable Feb 2, 2025. General-purpose AI obligations Aug 2, 2025. High-risk decision-support systems Aug 2, 2026 — THE date that anchors most procurement-stage urgency. This is the #1 regulatory tailwind for DI.',
    difficulty: 'core',
    applicationContext: 'GC asks about EU AI Act readiness in vendor-risk review.',
    source: 'CLAUDE.md Regulatory Tailwinds 2026-04-22',
    tag: 'eu',
  },
  {
    id: 'reg_basel_iii',
    deckId: 'regulatory_frameworks',
    prompt: 'Basel III Pillar 2 ICAAP: what does it require, and how does DI map to it?',
    canonicalAnswer:
      "Basel III Pillar 2 — the Internal Capital Adequacy Assessment Process. Requires regulated banks to document the qualitative reasoning behind capital decisions, NOT just the quantitative numbers. DPR's Reviewer Decisions / HITL log (page 5 of the v2 DPR) provides exactly this — accepted mitigations, dismissed flags with reasons, dissent log, final sign-off. Live for regulated banks. The DPR attaches a Basel III provision to every flagged bias when the org context is a regulated financial entity.",
    difficulty: 'advanced',
    applicationContext:
      "Bank GC asks 'how do you cover Basel III ICAAP qualitative documentation?'",
    source: 'CLAUDE.md Regulatory Tailwinds + DPR v2 enhancements',
    tag: 'banking',
  },
  {
    id: 'reg_gdpr_art_22',
    deckId: 'regulatory_frameworks',
    prompt: 'GDPR Art 22: what does it require, and how does DI handle it?',
    canonicalAnswer:
      'Article 22: rights of data subjects in automated decision-making — they have the right to meaningful information about the LOGIC involved, plus the right to contest. DPR citations provide that without exposing platform IP. Decision Intel is the PROCESSOR; the customer is the CONTROLLER — the privacy page names the routing explicitly with a 4-step contestation flow (mailto:team@decision-intel.com → 5-day acknowledgment → 30-day controller response → supervisory complaint fallback). Live since 2018. Updated /privacy 2026-04-26 with explicit Art 22 third-party path section.',
    difficulty: 'core',
    applicationContext: 'A subject named in a memo contests how a decision was reached.',
    source: 'CLAUDE.md GDPR Art 22 third-party path',
    tag: 'eu',
  },
  {
    id: 'reg_ndpr',
    deckId: 'regulatory_frameworks',
    prompt: 'NDPR (Nigeria): what is the framework, and why does it matter for the wedge?',
    canonicalAnswer:
      "NDPR (Nigeria Data Protection Regulation) — the Nigerian data-protection framework, similar in shape to GDPR but with NITDA as the supervisory authority. Critical for the Pan-African / EM-fund wedge: Pan-African PE funds based in Lagos handle data subjects (portfolio companies' employees + customers) under NDPR. The DPR carries NDPR provisions for Nigerian-jurisdiction memos. Without NDPR coverage, Titi-class fund partners cannot procure DI under their data-residency posture. This is part of the 17-framework structural moat against US-only competitors.",
    difficulty: 'core',
    applicationContext: 'Pan-African fund partner asks about Nigerian data protection.',
    source: 'src/lib/compliance/frameworks/africa-frameworks.ts',
    tag: 'african',
  },
  {
    id: 'reg_cbn',
    deckId: 'regulatory_frameworks',
    prompt: 'CBN: what does it cover, and what kind of memos does it apply to?',
    canonicalAnswer:
      'Central Bank of Nigeria (CBN). Covers Nigerian financial-services regulatory rules including the I&E (Investors & Exporters) FX window guidance, banking capital adequacy, and lending standards. Applies to memos involving Nigerian financial entities or NGN-denominated capital allocation. The structuralAssumptions node injects CBN sovereign-context (naira free-float + I&E window dynamics) for Nigeria-mentioning memos automatically.',
    difficulty: 'core',
    applicationContext: 'Memo about a Lagos-based fintech expansion.',
    source: 'africa-frameworks.ts + sovereign-context branching',
    tag: 'african',
  },
  {
    id: 'reg_waemu',
    deckId: 'regulatory_frameworks',
    prompt: 'WAEMU: what is the framework, and which countries does it cover?',
    canonicalAnswer:
      "WAEMU (West African Economic and Monetary Union) — covers 8 West African countries that share the CFA franc currency: Benin, Burkina Faso, Côte d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo. Banking + capital markets regulation under the BCEAO (central bank). The CFA-zone peg to the euro is a structural assumption that any WAEMU memo implicitly carries — the structuralAssumptions node surfaces this. Important for Pan-African funds with cross-border WAEMU exposure.",
    difficulty: 'advanced',
    applicationContext: "Memo about a Côte d'Ivoire consumer rollup.",
    source: 'africa-frameworks.ts',
    tag: 'african',
  },
  {
    id: 'reg_popia',
    deckId: 'regulatory_frameworks',
    prompt: 'PoPIA: what is it, and what is the procurement-grade detail to know?',
    canonicalAnswer:
      "Protection of Personal Information Act (South Africa). Africa's GDPR-shape framework. Section 71 specifically governs cross-border transfers of personal information. Critical for any Pan-African fund with South African portfolio companies or LP relationships. The DPR carries PoPIA s.71 cross-border-transfer disclosures when South African entities are involved. The Information Regulator is the supervisory authority.",
    difficulty: 'core',
    applicationContext: 'Memo involving a Cape Town-based portfolio company.',
    source: 'africa-frameworks.ts',
    tag: 'african',
  },
  {
    id: 'reg_isa_2007',
    deckId: 'regulatory_frameworks',
    prompt: 'ISA 2007 (Nigeria): what is it, and what is the current DI gap?',
    canonicalAnswer:
      "Investments and Securities Act 2007 (Nigeria) — the primary statute governing securities markets in Nigeria, administered by the SEC Nigeria. Covers public offerings, private placements, and investor disclosures. The current FRC Nigeria code adds corporate-governance overlays. Current DI gap (per closing-lab silent-objections): the audit framework registry covers NDPR / CBN / FRC Nigeria / WAEMU but does NOT yet map specifically to ISA 2007 sections. Status: TODO. Until ISA 2007 + current FRC Nigeria code mapping ships, the 'Pan-African regulatory illusion' silent objection lives.",
    difficulty: 'advanced',
    applicationContext:
      'Pan-African fund partner asks about ISA 2007 coverage in procurement-stage call.',
    source: 'closing-lab-data.ts SILENT_OBJECTIONS + africa-frameworks.ts',
    tag: 'african',
  },
];

// ─── Cards: R²F Framework (5) ───────────────────────────────────

const R2F_FRAMEWORK_CARDS: EducationCard[] = [
  {
    id: 'r2f_kahneman_side',
    deckId: 'r2f_framework',
    prompt: 'What 3 pipeline nodes implement the KAHNEMAN side of R²F?',
    canonicalAnswer:
      "Kahneman's side = System 2 debiasing rigor. Implemented by: (1) biasDetective (catches the 30+ named biases), (2) noiseJudge (measures inter-judge variance — Kahneman/Sibony/Sunstein NOISE 2021), (3) statisticalJury (compares against base rates from the 143-case library). Together they implement the rigorous-skepticism layer: 'what's wrong with this reasoning, statistically.'",
    difficulty: 'core',
    applicationContext: "Investor asks 'where is the Kahneman in your pipeline?'",
    source: 'CLAUDE.md Kahneman×Klein synthesis lock',
    tag: 'kahneman',
  },
  {
    id: 'r2f_klein_side',
    deckId: 'r2f_framework',
    prompt: 'What 3 pipeline nodes implement the KLEIN side of R²F?',
    canonicalAnswer:
      "Klein's side = System 1 amplification through pattern recognition. Implemented by: (1) rpdRecognition (Recognition-Primed Decision — pattern-matches the situation to historical analogs in the 143-case library), (2) forgottenQuestions (surfaces what the memo SHOULD be asking but isn't, drawn from analogs), (3) pre-mortem (Klein's failure-imagination technique — imagines the project failed in 18 months and asks why). Together they implement the experiential-pattern layer: 'what would an expert recognise in this situation that the memo is missing?'",
    difficulty: 'core',
    applicationContext: "Investor asks 'where is the Klein in your pipeline?'",
    source: 'CLAUDE.md',
    tag: 'klein',
  },
  {
    id: 'r2f_meta_judge_arbitration',
    deckId: 'r2f_framework',
    prompt: 'How does the metaJudge node arbitrate between Kahneman and Klein?',
    canonicalAnswer:
      "The metaJudge runs LAST in the pipeline (gemini-2.5-pro). It receives outputs from BOTH the Kahneman side (biasDetective + noiseJudge + statisticalJury) AND the Klein side (rpdRecognition + forgottenQuestions + pre-mortem) and produces an integrated DQI score with explanatory narrative. When the two sides DISAGREE — e.g., bias-detection says 'high anchoring bias' but recognition says 'this is the right pattern-match' — the metaJudge weighs the disagreement and surfaces it as a noise signal. Disagreement is itself information; consensus across both traditions raises confidence.",
    difficulty: 'advanced',
    applicationContext:
      'Sophisticated investor asks how you handle the tension between the two frameworks.',
    source: 'CLAUDE.md',
    tag: 'integration',
  },
  {
    id: 'r2f_anchor_paper',
    deckId: 'r2f_framework',
    prompt: 'What is the anchor academic paper for the R²F integration claim?',
    canonicalAnswer:
      'Kahneman & Klein 2009 — "Conditions for Intuitive Expertise: a failure to disagree" (American Psychologist 64:6, 515-526). The paper itself is two icons of opposing decision-research traditions trying to find common ground. Their conclusion: expert intuition is reliable in domains with regular feedback and stable conditions; unreliable elsewhere. R²F operationalises this: amplify intuition where it\'s reliable (Klein recognition), debias where it isn\'t (Kahneman rigor), let the metaJudge arbitrate. The trademark filing on R²F is DEFERRED until pre-seed close; use consistently now so vocabulary is owned by usage alone.',
    difficulty: 'advanced',
    applicationContext: 'Investor asks for the IP grounding of your category claim.',
    source: 'CLAUDE.md Positioning + R²F lock',
    tag: 'integration',
  },
  {
    id: 'r2f_competitor_gap',
    deckId: 'r2f_framework',
    prompt: 'Why does NO competitor combine both traditions, and what does that mean for the moat?',
    canonicalAnswer:
      "Cloverpop scores OUTCOMES (after the fact, structured logging). Aera executes decisions autonomously (agentic). IBM watsonx.governance audits the MODEL (not the human reasoning). Quantellia / Peak.ai are predictive-analytics dashboards. NONE attempt to integrate Kahneman's debiasing tradition WITH Klein's recognition tradition into one pipeline. The R²F claim is the slide-2 pitch-deck claim — the IP moat. Replicating it requires: (a) the academic synthesis (the rare one paper they wrote together), (b) the implementation across 12 pipeline nodes, (c) the validation against 143 cases. Years of work, not a feature ship.",
    difficulty: 'advanced',
    applicationContext: "Investor asks 'why hasn't anyone done this before?'",
    source: 'CLAUDE.md Kahneman×Klein synthesis + External Attack Vectors',
    tag: 'moat',
  },
];

// ─── Cards: Founder One-Liners (8) ──────────────────────────────

const FOUNDER_ONELINERS_CARDS: EducationCard[] = [
  {
    id: 'oneliner_external_attack_vectors',
    deckId: 'founder_oneliners',
    prompt:
      'Name the 3 External Attack Vectors that could derail Decision Intel regardless of execution quality.',
    canonicalAnswer:
      "(1) Cloverpop's data advantage: they have years of structured enterprise decision data we don't; if Clearbox (their parent) bolts a Kahneman prompt onto their existing repo, they instantly replicate audit capability with REAL data. (2) IBM watsonx.governance bundling: F500 GCs don't want two governance SKUs; if IBM adds a 'Human Decision Provenance' module, F500 procurement checks the EU AI Act box with IBM by Aug 2026. (3) Agentic shift makes the strategic memo obsolete: Palantir / Databricks / Aera are eliminating human-authored memos via agentic execution; we're building the spell-checker for a format the enterprise is automating away. Defenses: outcome-gate enforcement (Cloverpop), Pan-African wedge (IBM), audit-layer-for-agents long-game pivot (agentic).",
    difficulty: 'advanced',
    applicationContext: 'Investor asks "what could kill this company?"',
    source: 'CLAUDE.md External Attack Vectors lock 2026-04-26',
    tag: 'strategic',
  },
  {
    id: 'oneliner_wedge_vs_ceiling',
    deckId: 'founder_oneliners',
    prompt: 'What is the ICP wedge / bridge / ceiling distinction (v3.2), and why does it matter?',
    canonicalAnswer:
      "WEDGE (next 6 months): Individual buyers @ £249/mo — UK + US CSOs / Heads of M&A / corp dev directors / fractional CSOs. Frictionless, personal-card / t-card budget, zero procurement gate. BRIDGE (months 6-12): Sankore (London office, summer 2026) as the design-partner bridge + 1-2 Individual graduates at £1,999/mo Design Foundation rate or £20-25K founding-pilot bundle. Sankore's strategic value isn't fund-buyer-budget — it's real fund operational insight + reference-grade artefact production. CEILING (12-24+ months): F500 corporate strategy + corp dev M&A teams @ £50K-150K ACV — UK + US primary, cross-border M&A specifically (where the 19-framework regulatory map becomes a live moat layer Cloverpop and IBM watsonx don't carry). THE WEDGE GENERATES THE CASHFLOW + WORD-OF-MOUTH THAT FUNDS THE BRIDGE. THE BRIDGE GENERATES THE PUBLISHED REFERENCES THAT UNLOCK THE CEILING. Do NOT chase enterprise procurement before the graduation rule fires (5 paid Individual + 10 raving + 1 verifiable referral via DPR).",
    difficulty: 'core',
    applicationContext: 'Should you spend Q3 chasing F500 CSOs or Individual buyers? (Answer: Individual.)',
    source: 'CLAUDE.md ICP — wedge + bridge + ceiling lock 2026-04-30 (GTM Plan v3.2)',
    tag: 'strategic',
  },
  {
    id: 'oneliner_avoid_vc_segment',
    deckId: 'founder_oneliners',
    prompt: 'Which segments do you EXPLICITLY avoid (v3.2), and why?',
    canonicalAnswer:
      "Three explicit non-target audiences (v3.2 lock): (1) Boutique sell-side M&A advisors — no software budget, relationship-driven, sceptical. (2) Generic small VC funds with no Africa/EM exposure — no procurement need, AUM-per-decision too small, relationship-driven without the capital-allocation pressure that makes the audit valuable. (3) US-only Fortune 500 with zero international M&A exposure — Cloverpop + IBM watsonx will out-bundle us in their backyard; pick fights where the cross-border regulatory moat matters. Note: Pan-African / EM-focused funds are NOT a wedge in v3.2 (that was the 2026-04-26 lock; v3.2 superseded it with the Individual-tier wedge). Sankore stays as the DESIGN PARTNER bridge — warm-intro accessible, reference-producing — but funds are not the buyer market. Pan-African / EM regulatory coverage is preserved as the cross-border M&A differentiator (moat layer for the F500 ceiling).",
    difficulty: 'advanced',
    applicationContext:
      'You get a warm intro to a generic Sand Hill Road VC firm — do you take the meeting?',
    source: 'CLAUDE.md ICP wedge+ceiling',
    tag: 'strategic',
  },
  {
    id: 'oneliner_one_liner_primary',
    deckId: 'founder_oneliners',
    prompt:
      'What is the canonical hero one-liner for warm contexts (pitch deck, LinkedIn headline)?',
    canonicalAnswer:
      "\"The native reasoning layer for every high-stakes call.\" That is the H1. \"Reasoning layer\" is the ownable category anchor — treat it like the category term. \"Native\" does the 'built for this, not retrofitted' work. \"High-stakes call\" is the universal noun phrase that lands across all six buyer personas. NEVER use 'collaborative' / 'collaborator' / 'medium' / 'protect outcomes' framings. NEVER use 'decision intelligence platform' as the headline claim.",
    difficulty: 'foundation',
    applicationContext: 'Updating your LinkedIn headline.',
    source: 'CLAUDE.md One-liner re-lock 2026-04-26',
    tag: 'positioning',
  },
  {
    id: 'oneliner_secondary_regulatory',
    deckId: 'founder_oneliners',
    prompt:
      'What is the secondary one-liner for regulatory-tailwind moments (cold outreach, investor narrative)?',
    canonicalAnswer:
      '"The reasoning layer the Fortune 500 needs before regulators start asking." Carries the regulatory tailwind story in one breath. Use it where TENSION beats elegance — cold DMs, VC pitches, LinkedIn replies. NEVER use it as a hero H1. The primary remains \'the native reasoning layer for every high-stakes call.\' This secondary is the version that fits the EU AI Act / Aug 2026 / Basel III calendar pressure context.',
    difficulty: 'core',
    applicationContext: 'Drafting a cold email to a F500 GC about EU AI Act readiness.',
    source: 'CLAUDE.md One-liner secondary',
    tag: 'positioning',
  },
  {
    id: 'oneliner_protected_revenue',
    deckId: 'founder_oneliners',
    prompt: 'What is the "protected revenue" framing per the 2026-04-27 positioning shift?',
    canonicalAnswer:
      "Frame the value as protecting £X of revenue per decision, NOT as features. Per-decision dollar impact tied to ticket size beats organisation-wide percentage claims for first-meeting conversion. Canonical anchor: '$22.5M at risk on this $50M decision' for the static demo. Tier framing: the Strategy tier protects 'one avoided £5-15M strategic mistake per quarter pays for the entire team subscription five years over.' Lead with what the tier PROTECTS, not what it INCLUDES. This is the loss-aversion-grounded sales frame at the pricing level.",
    difficulty: 'core',
    applicationContext: 'Pricing-page rewrite or first-meeting framing.',
    source: 'CLAUDE.md Positioning shift to PROTECTED REVENUE 2026-04-27',
    tag: 'positioning',
  },
  {
    id: 'oneliner_outcome_gate_strategic_purpose',
    deckId: 'founder_oneliners',
    prompt: 'Why does outcome-gate enforcement matter strategically (beyond a UX feature)?',
    canonicalAnswer:
      "It is the structural answer to Cloverpop's data advantage. The outcome-gate forces every audit's outcome to be logged before the next audit can run (Phase 1 server-side enforcement, Phase 2 blocking modal, Phase 3 auto-draft prefill — all shipped). Each outcome closure compounds DI's per-org Brier-scored recalibration data — the moat that, over time, makes DI's predictions more accurate for THIS organisation than any incumbent's generic model. Cloverpop has years of decision data WE don't have; outcome-gate enforcement is how DI accumulates equivalent moat-data 10x faster, contractually, in design-partner terms.",
    difficulty: 'advanced',
    applicationContext: 'Investor asks why the outcome-gate is strategic, not just a feature.',
    source: 'CLAUDE.md Outcome Gate Enforcement Phase 1-3 + External Attack Vectors',
    tag: 'strategic',
  },
  {
    id: 'oneliner_design_partner_contract',
    deckId: 'founder_oneliners',
    prompt: 'What 3 contractual asks define a real Decision Intel design partnership?',
    canonicalAnswer:
      'From Founder School lesson es_11 / discovery-call language: "three things are non-negotiable: (1) workflow mapping in this call, (2) audit-before-meeting requirement (every IC / steering / board meeting has a DI audit attached as part of the prep), (3) outcome-gate enforced at platform level (every audit\'s outcome must be logged before the next audit fires)." The data flywheel becomes contractual, not aspirational. Without these, the design partnership is a paid pilot with no compounding value. WITH these, every signed partner accelerates the moat.',
    difficulty: 'advanced',
    applicationContext:
      "Closing a design-partner conversation — what are the asks you DON'T compromise on?",
    source: 'Founder School lesson es_11 + CLAUDE.md Outcome Gate',
    tag: 'strategic',
  },
];

// ─── Cards: 4 new grading dimensions (added 2026-04-28 PM) ──────

const GRADING_DIMENSIONS_V2_CARDS: EducationCard[] = [
  {
    id: 'rubric_fomu_calibration',
    deckId: 'grading_dimensions',
    prompt:
      'In the Sales DQI rubric, what does "FOMU calibration" measure, and what is the academic anchor?',
    canonicalAnswer:
      "JOLT Effect (Matt Dixon) source. Weight: 0.06. FOMU = Fear of Messing Up (the buyer's fear of getting fired for picking the wrong tool — distinct from FOMO, which is fear of missing out on upside). Excellent (5/5): you DETECT the buyer agreeing with the pain ('I get it, biases cost us money') and PIVOT from selling pain to taking risk off the table BEFORE they ask. Pre-buttal pattern: 'I know putting an IC memo into a new AI feels like a massive compliance risk. I wouldn't either. That's why we built [risk-reducer].' Pairs with loss-aversion-framing — use loss aversion for the front half of the call to break status quo; FOMU calibration for the back half to close. Poor (1/5): buyer signals they're sold but you keep DIALING UP fear, driving them into analysis paralysis.",
    difficulty: 'advanced',
    applicationContext:
      "Buyer says 'this could really help' — what's your move in the next 30 seconds?",
    source: 'sparring-room-data.ts (added 2026-04-28 PM)',
    tag: 'jolt',
  },
  {
    id: 'rubric_damaging_admission',
    deckId: 'grading_dimensions',
    prompt:
      'In the Sales DQI rubric, what does "damaging admission" measure, and how does it differ from generic humility?',
    canonicalAnswer:
      "Cialdini Influence + Jason Cohen Naked Business source. Weight: 0.05. Excellent (5/5): you VOLUNTEER a specific weakness or limitation BEFORE the buyer probes for it — and the admission is HYPER-SPECIFIC, not vague humility. 'I'm 16, this is my first paid customer attempt, you'll be onboarded by me directly because there is no one else.' 'If you want an AI that makes the decision for you, this isn't it — ChatGPT guesses, we audit.' Triggers Cialdini's 'trustworthy authority' bias: the buyer realises only an honest expert would name the weakness this clearly. Every subsequent claim becomes more credible by contrast. Generic humility ('we're still learning', 'we have a lot to improve') does NOT trigger this — it reads as weakness. Specific damaging admission triggers authority. Poor (1/5): you camouflage limitations, hedge on age ('I have advisors'), or list 12 capabilities to compensate for the one you don't want named.",
    difficulty: 'advanced',
    applicationContext:
      'Buyer asks about your team size or compares you to McKinsey/Palantir — how do you respond?',
    source: 'sparring-room-data.ts (added 2026-04-28 PM)',
    tag: 'cialdini',
  },
  {
    id: 'rubric_mutual_disqualification',
    deckId: 'grading_dimensions',
    prompt:
      'In the Sales DQI rubric, what does "mutual disqualification" measure, and what failure mode does it prevent?',
    canonicalAnswer:
      "Sandler Selling System source. Weight: 0.05. Excellent (5/5): you EXPLICITLY OUTLINE the conditions under which this is a BAD fit and give the buyer permission to walk away. 'If your IC never gets blindsided post-close, and your team already has a mathematical system of record for why decisions were made, you absolutely do not need this tool.' Negative reverse breaks the comparison frame, signals genuine confidence, and forces the buyer to defend why they DO need it. The exact mechanical execution of 'pressure without pressure' — Maalouf names the principle, Sandler names the move. Prevents the 'unpaid dev shop' failure mode where you say 'yes, we can customise that' to every feature request and the buyer drags you through 12-month procurement cycles for free. Poor (1/5): you agree to everything the buyer floats; you chase the deal too hard; you validate every objection.",
    difficulty: 'advanced',
    applicationContext: "Buyer asks 'can you also do X?' — when is the right answer no?",
    source: 'sparring-room-data.ts (added 2026-04-28 PM)',
    tag: 'sandler',
  },
  {
    id: 'rubric_prescriptive_recommendation',
    deckId: 'grading_dimensions',
    prompt:
      'In the Sales DQI rubric, what does "prescriptive recommendation" measure, and why is it the close move?',
    canonicalAnswer:
      "JOLT Effect + Y Combinator Enterprise Sales School source. Weight: 0.05. Excellent (5/5): once the diagnosis lands, you PRESCRIBE the EXACT next step. 'Other fractional CSOs like you don't start by auditing live client data — they run three dead deals from last year through the pipeline first. Let's set up a 15-minute onboarding next Tuesday for your first dead deal.' Buyer doesn't know how to buy DI; you command the path based on what peers did. Limits exploration, removes choice paralysis, gives a concrete time + concrete action. Pairs with empathic-mode-first — empathic for discovery in the first 15 min; prescriptive to close in the last 10 min. Poor (1/5): you end the call with 'what features are most important to you?' or 'how would you like to proceed?' or 'let me know if you have questions.' Forces the confused buyer to design their own implementation plan; they ghost within 72 hours because they don't know what 'yes' actually means operationally.",
    difficulty: 'advanced',
    applicationContext:
      'Last 3 minutes of the call — buyer is interested. What do you say to convert?',
    source: 'sparring-room-data.ts (added 2026-04-28 PM)',
    tag: 'jolt',
  },
];

// ─── Cards: Advanced Sales Moves deck (16 cards) ────────────────

const ADVANCED_SALES_MOVES_CARDS: EducationCard[] = [
  // 5 framework gaps
  {
    id: 'move_pre_buttal',
    deckId: 'advanced_sales_moves',
    prompt:
      "When and how do you fire the JOLT 'pre-buttal' move on a live call? Give the verbatim phrase.",
    canonicalAnswer:
      "Fire it in the FIRST 2 MINUTES, immediately after introductions, BEFORE the buyer asks about security / founder continuity / ChatGPT-wrapper. Verbatim: 'I know putting an IC memo into a new AI feels like a massive compliance risk. I wouldn't either. That's why your data never trains our models, the architecture is AES-256-GCM at rest, and you can hit our API archive endpoint to trigger a 7-day hard purge the moment an NDA expires. For the pilot, we start by retro-auditing three dead deals from last year so you take zero pipeline risk.' Mechanism: defuses silent FOMU by voicing the buyer's worst fear LOUDER than they would. Once you've named the risk and shown the architectural answer, their analysis-paralysis defence dissolves. Anti-pattern: waiting for them to ask 'what about data security?' — by then you're on the defensive.",
    difficulty: 'advanced',
    applicationContext: 'About to get on a call with Margaret-class F500 CSO or James-class GC.',
    source: 'sales-toolkit.ts SALES_FRAMEWORK_GAPS · jolt_pre_buttal',
    tag: 'jolt',
  },
  {
    id: 'move_negative_reverse',
    deckId: 'advanced_sales_moves',
    prompt: 'What is the Sandler negative-reverse move and when do you fire it?',
    canonicalAnswer:
      "Fire in the first 5 minutes when the buyer is still pattern-matching, OR any time the conversation feels like you're chasing them. Verbatim: 'To be completely honest, if your IC never gets blindsided post-close, and your team already has a mathematical system of record for tracking why strategic decisions were made, you absolutely do not need this tool. We only step in when firms realise their M&A failure rate is bleeding alpha.' Mechanism: breaks the comparison frame; forces the BUYER to defend why they need YOU. Establishes absolute authority by signalling you're not desperate for the logo. Anti-pattern: saying 'yes, we can customise that' to every feature request — triggers the unpaid-dev-shop failure mode.",
    difficulty: 'advanced',
    applicationContext: 'You sense the buyer is about to ghost or de-prioritise.',
    source: 'sales-toolkit.ts SALES_FRAMEWORK_GAPS · sandler_negative_reverse',
    tag: 'sandler',
  },
  {
    id: 'move_arguing_against_self',
    deckId: 'advanced_sales_moves',
    prompt:
      'What is the Cialdini "arguing against your own interest" move and when does it land hardest?',
    canonicalAnswer:
      "Fire when the buyer probes the boundaries of the product, asks if it can replace their analysts, or expresses ChatGPT-wrapper suspicion. Verbatim: 'If you're looking for an AI that makes the strategic decision FOR you, this isn't it. ChatGPT gives you one generative guess, and Aera automates supply chains. We don't replace your expert intuition. We run a 12-node audit on your draft memo, catch the cognitive biases the room will grill you on, and output a Decision Provenance Record. We don't execute the decision; we make sure the human reasoning behind it is defensible.' Mechanism: volunteering a limitation triggers Cialdini's 'trustworthy authority' bias. The buyer realises only an honest expert would name the weakness this clearly. Every subsequent claim becomes more credible. Anti-pattern: listing 12 capabilities to compensate for the one you don't want named.",
    difficulty: 'advanced',
    applicationContext: "Buyer asks 'can this replace my analyst team?'",
    source: 'sales-toolkit.ts SALES_FRAMEWORK_GAPS · cialdini_arguing_against_self',
    tag: 'cialdini',
  },
  {
    id: 'move_artifact_teardown',
    deckId: 'advanced_sales_moves',
    prompt: 'What is the Challenger "artefact-led teardown" move and what does it replace?',
    canonicalAnswer:
      "Replaces the 'let me show you our deck' instinct on hot inbound or procurement-stage calls. Verbatim: 'Consulting firms charge £1M to tell you about cognitive bias, but they suffer from the exact same biases themselves. Look at this WeWork S-1 audit. In 60 seconds, the engine flagged narrative fallacy + overconfidence on TAM + sunk cost. Those three blind spots cost billions. Bring a redacted CIM from a deal of yours that went sideways last year. I'll run the audit live in 7 minutes. If it doesn't flag the exact blind spots that cost you the deal, this product isn't for you.' Mechanism: teaches the buyer something new about their own pain (cognitive bias as quantified revenue erosion) using a specific artefact (WeWork DPR) instead of generic claims. The teaching IS the qualification — buyers who lean in at the WeWork moment self-select. Anti-pattern: opening a slide deck or running a feature tour.",
    difficulty: 'advanced',
    applicationContext: 'Hot inbound — buyer reached out via warm intro and wants to see depth.',
    source: 'sales-toolkit.ts SALES_FRAMEWORK_GAPS · challenger_artifact_teardown',
    tag: 'challenger',
  },
  {
    id: 'move_natural_scarcity',
    deckId: 'advanced_sales_moves',
    prompt:
      'How do you operationalise "natural scarcity" without sounding like a desperate startup?',
    canonicalAnswer:
      "Frame the constraint as STRUCTURALLY TRUE (founder bandwidth + outcome calibration), not marketing scarcity. Verbatim: 'We're onboarding 4 more design partners this quarter. Because the outcome flywheel needs me to map your firm's specific decision pipeline to the 17-framework regulatory engine, I physically don't have capacity for a fifth. If we partner, the ask is that your team commits to 90-day outcome logging so the model recalibrates against your firm's specific failure patterns.' Mechanism: triggers loss-aversion (buyer who hesitates loses the seat) AND establishes the contractual ask early so it's not a surprise at procurement. Anti-pattern: fake scarcity ('limited-time offer', 'only this month') — sophisticated buyers detect this in 5 seconds.",
    difficulty: 'advanced',
    applicationContext: "Buyer says 'we'd want to look at this next quarter.'",
    source: 'sales-toolkit.ts SALES_FRAMEWORK_GAPS · cialdini_natural_scarcity',
    tag: 'cialdini',
  },

  // 6 age-asymmetry tactics
  {
    id: 'move_accusation_audit',
    deckId: 'advanced_sales_moves',
    prompt: 'What is Voss\'s "accusation audit" move and when do you fire it?',
    canonicalAnswer:
      "Fire in the FIRST 2 MINUTES, after introductions, BEFORE any product talk. Mandatory for every Margaret-class F500 CSO and James-class GC conversation. Verbatim: 'Before I show you the engine, I want to address the obvious. I'm 16 years old, and you're managing a multi-billion-dollar strategy team. It would be completely irrational for your audit committee to trust live deal flow to a teenage solo founder, because a data leak would cost you your job. That's exactly why I'm not asking for your live deals. For the pilot we retro-audit three dead decisions from last year — you take zero pipeline risk while we prove the value.' Mechanism: voicing the buyer's worst fear about you LOUDER than they would dare to defuses the unstated, deal-killing elephant in the room. By the time they were going to bring up your age, you've already named it AND shown the architectural answer. Anti-pattern: camouflaging your age — sophisticated buyers detect evasion in 30 seconds.",
    difficulty: 'advanced',
    applicationContext: 'First call with a Margaret-class CSO or James-class GC.',
    source: 'sales-toolkit.ts AGE_ASYMMETRY_TACTICS · voss_accusation_audit',
    tag: 'voss',
  },
  {
    id: 'move_naked_business',
    deckId: 'advanced_sales_moves',
    prompt: 'How do you turn "yes, it\'s just me" into a competitive advantage?',
    canonicalAnswer:
      "Verbatim: 'Yes, it's just me. If you hire McKinsey they'll charge you £1M to tell you about cognitive bias, but they suffer from the exact same biases themselves, and they'll put a 24-year-old associate on your account who runs every recommendation through three layers of management. I wrote every line of the Decision Intel pipeline myself. When you need ISA 2007 mapped into the compliance engine, I don't need board approval — I'll code it and ship it overnight.' Mechanism: frames being a solo teenage founder NOT as a liability to excuse, but as a ruthless competitive advantage massive incumbents structurally cannot match. The age becomes the proof of the speed claim. Anti-pattern: 'yeah I know it's just me but…' — the qualifier already lost the conversation.",
    difficulty: 'advanced',
    applicationContext:
      "Buyer asks 'how big is your team?' or compares you to McKinsey QuantumBlack.",
    source: 'sales-toolkit.ts AGE_ASYMMETRY_TACTICS · cohen_naked_business',
    tag: 'cohen',
  },
  {
    id: 'move_constructive_confrontation',
    deckId: 'advanced_sales_moves',
    prompt: 'What is the Grove/Scott "constructive confrontation" move and when does it land?',
    canonicalAnswer:
      "Fire during the Evidence Moment — running a live audit on a redacted CIM or famous failed deal. Verbatim: 'Your current analysts are rubber-stamping the deal thesis instead of stress-testing it because of authority bias. This isn't a theory — the engine just flagged anchoring-to-entry-price and overconfidence-on-TAM on page 4 of your memo. If this was a live deal, ignoring those two flags would cost you millions. The engine catches what your room is afraid to say to the partner.' Mechanism: challenging a senior executive's core operational process with objective, data-backed friction establishes you as an intellectual peer who cares enough about their revenue to tell them they're wrong. Anti-pattern: diplomatic hedging ('there's a chance the team might want to look at this') — reads as junior-trying-to-please.",
    difficulty: 'advanced',
    applicationContext: 'Mid-call live audit on a memo the buyer brought.',
    source: 'sales-toolkit.ts AGE_ASYMMETRY_TACTICS · grove_radical_candor',
    tag: 'grove',
  },
  {
    id: 'move_perceptual_contrast',
    deckId: 'advanced_sales_moves',
    prompt: "How do you use Cialdini's perceptual contrast to defend the price?",
    canonicalAnswer:
      "Verbatim: 'You can absolutely decline because of my age. But that means walking into your next IC meeting with a £50M allocation on the line, relying on the hope that nobody in the room is suffering from confirmation bias. Or, for £499 per deal, I mathematically eliminate that risk before the memo ever leaves your desk.' Mechanism: forces the buyer to contrast the massive career-ending financial risk against a hyper-specific, quantifiable fee. Both your age AND the price appear as microscopic rounding errors against the deal-size loss anchor. Anti-pattern: discounting on price when the buyer pushes back — the discount IS the signal that the price was made up.",
    difficulty: 'advanced',
    applicationContext: 'Buyer pushes on the £499/deal or £2,499/mo price.',
    source: 'sales-toolkit.ts AGE_ASYMMETRY_TACTICS · cialdini_perceptual_contrast',
    tag: 'cialdini',
  },
  {
    id: 'move_competence_specificity',
    deckId: 'advanced_sales_moves',
    prompt:
      'How does "competence-signalling via extreme specificity" beat the ChatGPT-wrapper question?',
    canonicalAnswer:
      "Verbatim: 'I didn't build a ChatGPT wrapper. ChatGPT gives you one generative guess. I operationalised the 2009 Kahneman-Klein synthesis into a deterministic 12-node pipeline. The engine runs your memo through a 20×20 toxic-combination matrix and maps every flag to EU AI Act Article 14 record-keeping requirements. I built this because I published a paper on the neuro-cognitive roots of the 2008 financial crisis, and I realised the Fortune 500 still has no software to stop those exact same bias cascades from happening today.' Mechanism: true experts don't use buzzwords; they signal elite status by describing the architecture of a problem with such terrifying granular precision that the older buyer instantly realises the teenager has done the deep academic work they haven't. Anti-pattern: vague generic claims ('AI-powered', 'next-generation governance') — specificity is the only credibility-builder against age skepticism.",
    difficulty: 'advanced',
    applicationContext:
      "Buyer asks 'why did you build this?' or hints at ChatGPT-wrapper suspicion.",
    source: 'sales-toolkit.ts AGE_ASYMMETRY_TACTICS · klein_competence_specificity',
    tag: 'klein',
  },
  {
    id: 'move_arguing_against_age',
    deckId: 'advanced_sales_moves',
    prompt: 'How do you apply "arguing against your own interest" specifically to age skepticism?',
    canonicalAnswer:
      "Verbatim: 'If your team already has a mathematically auditable system of record for tracking why strategic decisions were made, this is useless to you. I didn't build an automated analyst. I built a 12-node ensemble audit to catch the exact cognitive biases your humans miss — so you don't get ambushed by the board.' Mechanism: explicitly stating what your product CANNOT do, while limiting your scope, proves you're a calibrated expert rather than a desperate junior trying to score a logo. The age vanishes once authority is established. Anti-pattern: being a 'bobblehead' that says yes to everything — each yes destroys authority by ~10%.",
    difficulty: 'advanced',
    applicationContext: 'CSO asks if you can replace their analyst team or automate strategy.',
    source: 'sales-toolkit.ts AGE_ASYMMETRY_TACTICS · arguing_against_own_interest_age',
    tag: 'cialdini',
  },

  // 5 Voss tactics
  {
    id: 'move_voss_tactical_empathy',
    deckId: 'advanced_sales_moves',
    prompt: 'What is Voss\'s "tactical empathy" move and when do you fire it?',
    canonicalAnswer:
      "Fire when the buyer is anxious about the upload-confidential-data-to-a-teenager risk (Margaret/Titi/James). Verbatim: 'It sounds like the bigger concern isn't whether the audit works — it's whether you can defend the vendor choice to your audit committee if something goes sideways.' Mechanism: naming the buyer's emotional state with surgical precision (Voss's labeling technique) signals you SEE them. They drop their guard because someone finally understands the actual fear. Anti-pattern: skipping straight to the technical answer ('we have AES-256-GCM') without first naming the emotional concern — the technical fix lands 5x harder once the emotion is named first.",
    difficulty: 'advanced',
    applicationContext: 'Margaret/Titi/James seems polite but withdrawn.',
    source: 'sales-toolkit.ts VOSS_TACTICS · voss_tactical_empathy',
    tag: 'voss',
  },
  {
    id: 'move_voss_calibrated_questions',
    deckId: 'advanced_sales_moves',
    prompt: 'What replaces "do you have any questions?" — give the Voss verbatim.',
    canonicalAnswer:
      "Calibrated questions force the buyer to think through the operational details of YES rather than the binary YES/NO. Verbatim: 'How would you explain this to your steering committee? What would they want to see in the first 30 days for this to feel like a win?' Mechanism: 'How' / 'What' questions trigger the buyer to design their own pilot. By the end of the answer, they've sold themselves. Anti-pattern: yes/no questions ('does this make sense?', 'do you want to try a pilot?') — they trigger reflexive caution.",
    difficulty: 'advanced',
    applicationContext: "Buyer says 'we need to think about it' — what do you ask next?",
    source: 'sales-toolkit.ts VOSS_TACTICS · voss_calibrated_questions',
    tag: 'voss',
  },
  {
    id: 'move_voss_mirroring',
    deckId: 'advanced_sales_moves',
    prompt: "What is Voss's mirroring tactic — give a Decision Intel example?",
    canonicalAnswer:
      "Repeat the buyer's last 1-3 words as an upward-inflection question. Example: Buyer: 'We already have something like this.' You: 'Something like this?' Mechanism: prompts them to elaborate. They reveal the real objection (or reveal that 'something like this' was a deflection) without you having to challenge them. Anti-pattern: arguing back ('actually no, our 12-node R²F pipeline is unique because...'). The buyer hears defensiveness and digs in. The mirror invites them to defend their own claim.",
    difficulty: 'advanced',
    applicationContext: "Buyer makes a vague claim that doesn't quite fit.",
    source: 'sales-toolkit.ts VOSS_TACTICS · voss_mirroring',
    tag: 'voss',
  },
  {
    id: 'move_voss_no_strategy',
    deckId: 'advanced_sales_moves',
    prompt: 'How do you handle a free-pilot or discount request without saying NO?',
    canonicalAnswer:
      "Use 'How am I supposed to do that?' Verbatim: Buyer: 'Can you do this for free for the first three months?' You: 'How am I supposed to do that? My cost per audit is £0.30 just on the API call. The £499/deal is calibrated to a margin that lets me keep the lights on for design partners. I want to find a way to make this work — what are you actually trying to solve?' Mechanism: forces the buyer to defend their ask without you saying NO. Triggers the buyer's empathy + creativity. Often they invent a better arrangement than you would have offered. Anti-pattern: saying 'no, we don't discount' — triggers the buyer's reactance.",
    difficulty: 'advanced',
    applicationContext: 'Buyer asks for a discount or free pilot.',
    source: 'sales-toolkit.ts VOSS_TACTICS · voss_no_strategy',
    tag: 'voss',
  },
  {
    id: 'move_voss_labeling',
    deckId: 'advanced_sales_moves',
    prompt: 'What is Voss\'s "labeling" tactic — give the verbatim?',
    canonicalAnswer:
      "Use 'it sounds like' / 'it seems like' / 'it looks like' to name the unstated concern. Verbatim: 'It seems like the procurement timeline is the part that's giving you pause, more than the product itself.' Mechanism: naming the unstated emotion or concern opens the door. Buyer either confirms (you address it) or corrects you (you learn the real concern). Either way, you advance. Anti-pattern: asking 'is something wrong?' or 'do you have concerns?' — both put the burden on the buyer. The label does the work for them.",
    difficulty: 'advanced',
    applicationContext: 'Buyer is polite but their tone says something is off.',
    source: 'sales-toolkit.ts VOSS_TACTICS · voss_labeling',
    tag: 'voss',
  },
];

// ─── Cards: 4 Brinkmanship moves (Schelling / Dixit-Nalebuff) ──

const BRINKMANSHIP_CARDS: EducationCard[] = [
  {
    id: 'brink_evidence_ultimatum',
    deckId: 'advanced_sales_moves',
    prompt: "What is the brinkmanship 'Evidence Moment as ultimatum' move and when do you fire it?",
    canonicalAnswer:
      "Source: Schelling 'The Strategy of Conflict'. Fire when pitching boutique sell-side M&A advisors (Potomac archetype). Verbatim: 'Bring a redacted CIM from a deal you lost last year. I'll run the audit live in 7 minutes. If it doesn't flag the exact blind spots that cost you the deal, this isn't for you — and we don't waste each other's time pretending it might be.' Mechanism: pure brinkmanship — you deliberately put the entire relationship on a 7-minute window. The buyer faces a mutually-bad outcome (no deal, wasted intro) unless they engage with the evidence. Authority transmits through the fact that you're willing to lose them on a single test. Anti-pattern: hedging the ultimatum ('we could try a small audit, see how it feels') — kills the brinkmanship effect.",
    difficulty: 'advanced',
    applicationContext:
      'Cold meeting with a Potomac-class M&A advisor — how do you compress the eval cycle?',
    source: 'sales-toolkit.ts BRINKMANSHIP_MOVES · brinkmanship_evidence_ultimatum',
    tag: 'brinkmanship',
  },
  {
    id: 'brink_honest_off_ramp',
    deckId: 'advanced_sales_moves',
    prompt: 'How do you weaponise the "honest off-ramp" as brinkmanship — give the verbatim?',
    canonicalAnswer:
      "Source: Schelling. Fire when the buyer is dragging the process or lowballing on price. Verbatim: 'To be completely honest, if your IC never gets blindsided post-close and your team already has a perfectly auditable system of record for tracking why strategic decisions were made, you absolutely do not need this tool. We only step in when firms realise their M&A failure rate is bleeding alpha. If that's not your situation, let's both save the time.' Mechanism: by deliberately creating the risk that THEY lose access to YOU, you flip the power dynamic. The buyer has to defend why they want to continue — opposite of having to defend why they should buy. Anti-pattern: following the off-ramp with 'but if you'd like to learn more...' — destroys brinkmanship instantly.",
    difficulty: 'advanced',
    applicationContext: 'Buyer is dragging a procurement cycle — how do you flip the dynamic?',
    source: 'sales-toolkit.ts BRINKMANSHIP_MOVES · brinkmanship_honest_off_ramp',
    tag: 'brinkmanship',
  },
  {
    id: 'brink_no_custom_features',
    deckId: 'advanced_sales_moves',
    prompt: 'Why does brinkmanship require killing lucrative deals that ask for custom features?',
    canonicalAnswer:
      "Source: Schelling commitment principle. Verbatim: 'I'm going to say no to that, even though I know the deal is meaningful. Building bespoke software for one client is a terrible business model — it makes you slower, makes the product weaker for everyone else, and creates a permanent maintenance liability. We sell what's in the published pipeline. If your specific need isn't there, this isn't the right vendor for you yet.' Mechanism: brinkmanship through credible commitment — the buyer cannot extract custom work from you regardless of deal size. By being willing to kill a lucrative deal rather than become an unpaid dev shop, you establish an unmoveable boundary. Anti-pattern: 'we could maybe explore that for the right scope' — once the door is open, the buyer drags you through 6 months of free scoping calls.",
    difficulty: 'advanced',
    applicationContext:
      'Margaret-class CSO offers a £200K deal IF you build a custom Snowflake integration.',
    source: 'sales-toolkit.ts BRINKMANSHIP_MOVES · brinkmanship_no_custom_features',
    tag: 'brinkmanship',
  },
  {
    id: 'brink_natural_scarcity_seats',
    deckId: 'advanced_sales_moves',
    prompt: 'How does brinkmanship apply to your 4 design-partner seats?',
    canonicalAnswer:
      "Source: Cialdini scarcity × Schelling commitment. Verbatim: 'We have 4 design-partner seats open. Because the outcome flywheel needs me to map your firm's specific decision pipeline to the 17-framework regulatory engine, I physically don't have capacity for a fifth. The seats come with strict operational requirements — 90-day outcome logging, audit-before-meeting on every IC, and the engagement is a contractual data flywheel commitment. If those terms don't fit, we hold the seat for someone else.' Mechanism: scarcity is structurally true (founder bandwidth + outcome calibration), not marketing. By tying the seat to non-negotiable operational commitments, you create a deliberate risk: the buyer either accepts your terms or loses access entirely. Anti-pattern: discounting the operational requirements when the buyer pushes back — destroys the scarcity.",
    difficulty: 'advanced',
    applicationContext: "Buyer says 'we'd want to do this next quarter, can you hold a seat?'",
    source: 'sales-toolkit.ts BRINKMANSHIP_MOVES · brinkmanship_natural_scarcity_seats',
    tag: 'brinkmanship',
  },
];

// ─── Cards: 5 Strategic Thinking principles (Dixit & Nalebuff) ──

const STRATEGIC_THINKING_CARDS: EducationCard[] = [
  {
    id: 'strat_look_forward_reason_backward',
    deckId: 'strategic_thinking',
    prompt:
      '"Look forward and reason backward" — how does this principle govern Decision Intel\'s 30-day pivot?',
    canonicalAnswer:
      "Source: Dixit & Nalebuff 'Thinking Strategically'. The primary rule of strategic thinking: look forward to where any early decisions will lead, and use that to reason backward to determine your best present choice. Application: the revenue ceiling is F500 CSOs (12-month procurement + SOC 2 Type II + outcome flywheel). Reasoning backward from that endpoint, the present move is the wedge — mid-market PE/VC associates and boutique M&A advisors who can swipe a corporate card today for £149/mo or £499/deal. The wedge is not a settling — it IS the path to the ceiling. When it bites: whenever you're tempted to chase an F500 logo because the meeting feels prestigious. Reason forward (cycle time, custom-feature pressure) before chasing.",
    difficulty: 'advanced',
    applicationContext:
      'You get a warm intro to a Fortune 100 CSO right now — do you take the meeting?',
    source: 'sales-toolkit.ts STRATEGIC_THINKING_PRINCIPLES · look_forward_reason_backward',
    tag: 'dixit_nalebuff',
  },
  {
    id: 'strat_limit_options',
    deckId: 'strategic_thinking',
    prompt:
      'Why does "limiting your options" make Decision Intel more credible to enterprise buyers?',
    canonicalAnswer:
      "Source: Schelling, Dixit & Nalebuff. A strategic move alters the beliefs and actions of the other party — its distinguishing feature is that you PURPOSEFULLY limit your options. The constraint IS the move. Application: hiding 80% of the 'Cathedral of Code' (RSS feeds, copilot, team benchmarking) and enforcing a strict no-custom-features rule is a deliberate option-limit. It alters buyer perception: it proves Decision Intel is a productized academic synthesis (the 12-node bias auditor as a finished thing), not a flexible dev shop. Credibility comes from what you refuse to do. When it bites: every time a sales conversation pulls you toward 'we could also build...' — the right move is the opposite, trim what's visible, sharpen the boundary.",
    difficulty: 'advanced',
    applicationContext:
      "Buyer asks if you can 'just add a Salesforce integration' — how does limiting your options actually win the deal?",
    source: 'sales-toolkit.ts STRATEGIC_THINKING_PRINCIPLES · strategic_moves_limit_options',
    tag: 'dixit_nalebuff',
  },
  {
    id: 'strat_credible_commitments',
    deckId: 'strategic_thinking',
    prompt:
      'What is a "credible commitment" in the Schelling sense, and what makes Decision Intel\'s data-purge pledge credible?',
    canonicalAnswer:
      "Source: Schelling. If you want to influence a buyer, your promises must carry CREDIBILITY in a strategic sense — backed by something the buyer cannot doubt. Application: as a 16-year-old solo founder, enterprise buyers will inherently doubt your operational maturity. You cannot just promise data is safe. You make a credible commitment by pointing to hardcoded infrastructure: the POST /api/deals/[id]/archive endpoint that triggers a 7-day hard purge upon NDA expiry, AES-256-GCM encryption at rest, the documented Vendor Continuity Plan, the published SLA tiers in the public Enterprise quote PDF. The architecture IS the commitment device — you can't abandon it without abandoning the product. When it bites: every procurement-stage call with a James-class GC or Margaret-class CSO. Credibility is asserted not through founder credentials but through architecture you cannot walk back.",
    difficulty: 'advanced',
    applicationContext: 'GC asks "what guarantees that my data is purged when our NDA expires?"',
    source: 'sales-toolkit.ts STRATEGIC_THINKING_PRINCIPLES · credible_commitments_procurement',
    tag: 'schelling',
  },
  {
    id: 'strat_ground_rules',
    deckId: 'strategic_thinking',
    prompt: 'Why is NOW the strategic window for Decision Intel to set the category ground rules?',
    canonicalAnswer:
      "Source: Dixit & Nalebuff. In some situations, the key time for strategic maneuvering is while the GROUND RULES are being decided — not while playing the game. Application: the enterprise AI governance and decision-intelligence categories are crystallising right now (2026). By positioning Decision Intel explicitly as the 'native reasoning layer' — differentiating from Aera (operational automation) and Cloverpop (decision logging) — you establish the ground rules of the category in your favour BEFORE competitors define them for you. The R²F (Recognition-Rigor Framework) IP claim is the same move applied to the academic anchor: you claim the Kahneman+Klein synthesis territory before someone else does. When it bites: right now. The window closes when one of Cloverpop / IBM watsonx / Aera defines the category. Every published-for-procurement piece of work (DPR, Bias Genome, /how-it-works) is a ground-rule-setting move.",
    difficulty: 'advanced',
    applicationContext:
      'You see a competitor pitch "decision intelligence platform" on LinkedIn — what is the right competitive move?',
    source: 'sales-toolkit.ts STRATEGIC_THINKING_PRINCIPLES · set_ground_rules_category',
    tag: 'dixit_nalebuff',
  },
  {
    id: 'strat_cooperation_coordination',
    deckId: 'strategic_thinking',
    prompt: 'When does cooperation beat competition for Decision Intel — give a specific example?',
    canonicalAnswer:
      "Source: Dixit & Nalebuff. Strategy is not just about outsmarting rivals — it is also about forging strong bonds of cooperation and coordination when it serves your own interests. Application: refuse to compete head-to-head with the $300B consulting industry. Position Decision Intel as a COMPLEMENTARY asset to McKinsey QuantumBlack or LRQA's EiQ — the continuous, EU AI Act Article 14-compliant audit layer that embeds INTO their multi-million-dollar strategy engagements. Same principle for the LRQA / Ian Spaulding warm intro: that's not a sale, it's a COORDINATION BID. Turn potential competitors into massive distribution channels by making yourself the layer they want to integrate. When it bites: whenever you see a strategic vendor that looks like a competitor (LRQA EiQ, McKinsey QuantumBlack, IBM watsonx.governance bundle). Ask: do we beat them, or slot in beside them? The slot-in answer compounds; the beat-them answer requires capital we don't have.",
    difficulty: 'advanced',
    applicationContext:
      'LRQA acquired Partner Africa in April 2026 + has €500M for partnerships. Beat them or slot in?',
    source: 'sales-toolkit.ts STRATEGIC_THINKING_PRINCIPLES · cooperation_coordination',
    tag: 'dixit_nalebuff',
  },
];

// ─── Cards: Goldner Discovery (8 — locked v3.2 2026-04-30) ─────────────────

const GOLDNER_DISCOVERY_CARDS: EducationCard[] = [
  {
    id: 'goldner_3_rules',
    deckId: 'goldner_discovery',
    prompt: "What are Mr. Goldner's 3 rules for customer discovery — recite verbatim?",
    canonicalAnswer:
      "(1) Talk to 10 people before building anything (or before structuring a new GTM motion). (2) Find the pattern in their answers, not your assumption. (3) Sell to the pattern, not to the product you wish you had built.",
    hint: '3 short sentences. The third is about what to sell to.',
    difficulty: 'foundation',
    applicationContext:
      'Use as the framework anchor before any 20-min discovery audit conversation — silently recite the 3 rules to remind yourself you\'re there to find the pattern, not to pitch your assumption.',
    source: 'src/lib/constants/icp.ts GOLDNER_3_RULES · GTM Plan v3.2 §5',
    tag: 'foundation',
  },
  {
    id: 'goldner_when_to_use_which',
    deckId: 'goldner_discovery',
    prompt:
      'Two Goldner discovery scripts exist (wedge-individual and corp-dev-ceiling) — which do you run with which buyer, and why?',
    canonicalAnswer:
      "Wedge-individual script (£249/mo CSO / M&A head / corp dev director / fractional CSO at FTSE 250 / scale-up): leads with the writing surface (four-tool graveyard) → predicted-question gap → bias-hidden-in-plain-sight replay → DPR-as-leave-behind. Corp-dev-ceiling script (F500 corp dev / corp strategy M&A team @ £50K-150K ACV): leads with cross-border acquisition memo + structural assumptions → post-IC regulatory surprise → 24-month replay against IRR → audit-committee artefact requirement. Pick by procurement gate: wedge buyer = no procurement gate (their own card), ceiling = audit committee + GC.",
    difficulty: 'core',
    applicationContext:
      'Before every warm-intro call, decide which script. Mr. Reiner-introduced US prospects with corp dev / strategy titles → likely wedge unless they explicitly mention IC / committee. Mr. Gabe-introduced UK prospects from his investor clients\' portfolio → mostly wedge initially. Sankore-class fund partners → wedge (they\'re a design partner, not the procurement gate).',
    source: 'src/lib/constants/icp.ts GOLDNER_DISCOVERY_QUESTIONS_INDIVIDUAL + _CORP_DEV',
    tag: 'core',
  },
  {
    id: 'goldner_individual_q1',
    deckId: 'goldner_discovery',
    prompt:
      "Wedge-individual script · question 1 — recite verbatim, then explain what you're listening for.",
    canonicalAnswer:
      "VERBATIM: 'Walk me through the last strategic decision you wrote up. Where did the writing happen — Google Doc, Slack threads, Confluence, board deck? And how much of the original reasoning made it through to the final artefact?' LISTENING FOR: the four-tool graveyard pain (the answer will name 2-4 of those tools as places where reasoning went to die). If they describe a clean single-source workflow, that's a NEGATIVE signal — they have process discipline, may not feel the pain. If they describe fragmentation + wishing they had ONE record, that's the wedge.",
    difficulty: 'core',
    applicationContext:
      'Always question 1. Sets the surface. Follow-ups: "Which one did the actual decision rationale end up in?" / "Did anything important get lost between drafts?"',
    source: 'icp.ts GOLDNER_DISCOVERY_QUESTIONS_INDIVIDUAL[0]',
    tag: 'wedge',
  },
  {
    id: 'goldner_individual_q2',
    deckId: 'goldner_discovery',
    prompt: "Wedge-individual script · question 2 — recite verbatim + listening criteria.",
    canonicalAnswer:
      "VERBATIM: 'What's the question your CEO / board / parent company asked that you didn't see coming?' LISTENING FOR: the predicted-question gap. If they describe getting blindsided by a question that — in retrospect — should have been obvious, that's the simulate-CEO + forgotten-questions wedge. The strongest signal: when they laugh nervously and say something like 'oh, the time my CEO asked X and I had nothing.' Don't push for the answer; let the silence sit.",
    difficulty: 'core',
    applicationContext:
      'Question 2. Surfaces predicted-question gap. Follow-ups: "How did you handle it in the moment?" / "If you could replay that meeting with one extra slide, what would it have shown?"',
    source: 'icp.ts GOLDNER_DISCOVERY_QUESTIONS_INDIVIDUAL[1]',
    tag: 'wedge',
  },
  {
    id: 'goldner_individual_q3_q4',
    deckId: 'goldner_discovery',
    prompt:
      "Wedge-individual script · questions 3 + 4 — recite verbatim and name what each surfaces.",
    canonicalAnswer:
      "Q3 VERBATIM: 'If you could replay one decision from the last 12 months knowing what you know now — what was the bias hiding in plain sight?' SURFACES: named-bias resonance (pre-screens whether they self-identify with the R²F frame; if they say 'we anchored on the comp' or 'we got captured by management', that's strong fit). Q4 VERBATIM: 'What's the artefact you wish you'd had to defend that decision when it was reviewed?' SURFACES: DPR-as-leave-behind value. The strongest signal is when they describe wanting an artefact that combines (a) the reasoning trail, (b) the regulatory mapping, (c) the named biases. That artefact IS the DPR.",
    difficulty: 'advanced',
    applicationContext:
      'Q3 + Q4 close the script. Run them only if Q1 + Q2 surfaced strong pain signal. If Q1+Q2 were weak, end the call gracefully and move on — Goldner Rule 2: find the pattern, don\'t force fit.',
    source: 'icp.ts GOLDNER_DISCOVERY_QUESTIONS_INDIVIDUAL[2,3]',
    tag: 'wedge',
  },
  {
    id: 'goldner_corp_dev_q1',
    deckId: 'goldner_discovery',
    prompt: "Corp-dev-ceiling script · question 1 — recite verbatim + listening criteria.",
    canonicalAnswer:
      "VERBATIM: 'Walk me through your last cross-border acquisition memo. Where did the diligence + assumption-setting happen, and how did you carry the structural assumptions (sovereign cycle, FX regime, regulatory exposure) into the IC deck?' LISTENING FOR: cross-border M&A surface area + Dalio determinant blindness (currency cycle, trade share, governance). If the answer reveals that structural assumptions are tracked in a side-doc that doesn't make it into the IC deck, that's the wedge for the 19-framework regulatory map + structural-assumptions audit. Strongest signal: 'we had the data but it wasn't in the room.'",
    difficulty: 'advanced',
    applicationContext:
      'Use ONLY when the buyer is corp dev / corp strategy M&A at F500 with cross-border acquisitions. Frames the problem in their vocabulary (IC deck, sovereign cycle, FX regime). Never lead a wedge buyer with this question — too jargon-y for an Individual-tier first call.',
    source: 'icp.ts GOLDNER_DISCOVERY_QUESTIONS_CORP_DEV[0]',
    tag: 'ceiling',
  },
  {
    id: 'goldner_corp_dev_q2_q3',
    deckId: 'goldner_discovery',
    prompt: "Corp-dev-ceiling script · questions 2 + 3 — verbatim + what each surfaces.",
    canonicalAnswer:
      "Q2 VERBATIM: 'What's the regulatory question — FCA, SEC, EU AI Act, GDPR, sovereign-context regime — that surfaced AFTER IC approval, when you wished it had surfaced before?' SURFACES: post-IC regulatory blindside; the 19-framework regulatory map directly addresses this. Q3 VERBATIM: 'If you could replay one M&A approval from the last 24 months — what was the bias the room missed that the IRR / outcome later exposed?' SURFACES: outcome-validated bias pattern; this is where the per-org Brier-scored recalibration matters. Together Q2 + Q3 establish that DI is for THIS specific problem, not generic decision support.",
    difficulty: 'advanced',
    applicationContext:
      'Run sequentially after Q1. Watch for the IRR/MOIC framing — if they reach for those metrics naturally, they\'re in the buying-power band. If they reach for ROIC / NPV / softer language, they\'re corp strategy not corp dev — pivot the next question accordingly.',
    source: 'icp.ts GOLDNER_DISCOVERY_QUESTIONS_CORP_DEV[1,2]',
    tag: 'ceiling',
  },
  {
    id: 'goldner_corp_dev_q4',
    deckId: 'goldner_discovery',
    prompt: "Corp-dev-ceiling script · question 4 — verbatim + close.",
    canonicalAnswer:
      "VERBATIM: 'What's the artefact your audit committee or GC would need to see to approve another deal of similar profile in the next 12 months — and what would it have to contain that today's diligence pack doesn't?' SURFACES: the DPR procurement requirement in the buyer's voice. Strongest signal: they describe wanting (a) bias provenance, (b) cross-document reconciliation, (c) regulatory mapping, (d) reviewer decisions / dissent log — those are literally the DPR's existing pages. Close: 'I have a sample DPR on a public deal — the Dangote 2014 cross-border expansion. 20 minutes on a real memo of yours, anonymised, and we'll see if it passes your audit committee's bar.'",
    difficulty: 'advanced',
    applicationContext:
      'The closing question. Sets up the 20-minute audit + DPR-on-real-memo offer. Always end with the offer in their voice (the artefact their audit committee needs), not yours (the product features).',
    source: 'icp.ts GOLDNER_DISCOVERY_QUESTIONS_CORP_DEV[3]',
    tag: 'ceiling',
  },
];

// ─── Cards: Learning Efficiency (12) ────────────────────────────────

const LEARNING_EFFICIENCY_CARDS: EducationCard[] = [
  {
    id: 'learn_active_recall',
    deckId: 'learning_efficiency',
    prompt: 'What is Active Recall and why does it beat re-reading on retention tests?',
    canonicalAnswer:
      'Active Recall is the deliberate retrieval of information from memory rather than re-exposure to source material. The mental strain of retrieval — pausing the video / closing the book and writing the concept down from memory — is the load-bearing mechanism. Karpicke 2008 showed retrieval practice produces 2-3× better long-term retention than re-reading or concept-mapping in college students on conceptual material. Re-reading FEELS more productive (fluent processing) but produces an illusion of mastery; recall PROVES mastery. The act of failing to retrieve is also load-bearing — it identifies what you have not actually encoded yet.',
    hint: 'Cue: pause the input source, close eyes, write from memory, then check.',
    difficulty: 'foundation',
    applicationContext: 'Mid-way through a 60-min long-form interview on a successful founder. Pause every 10-15 min to write down the 3 most important claims from memory before resuming.',
    source: 'Karpicke & Roediger 2008 (Science 319:966) + sociotechnical-convergence research paper 2026-05-02',
    tag: 'protocol',
  },
  {
    id: 'learn_elaborative_encoding',
    deckId: 'learning_efficiency',
    prompt: 'What is Elaborative Encoding and what question does it force you to answer?',
    canonicalAnswer:
      'Elaborative Encoding is the deliberate enrichment of a new concept by tying it to existing knowledge — explaining WHY the concept is true in your own words, naming what it reminds you of, and predicting where else it would apply. The forcing question is "why is this true and what does it remind me of?" Bjork & Bjork 1994 desirable-difficulty framework: harder encoding produces more durable retrieval. Pure rote rehearsal builds a brittle surface; elaboration builds a network. For Decision Intel: every new concept should connect to (a) something already in CLAUDE.md, (b) a Decision Intel product feature it sharpens, or (c) a buyer-persona pain it addresses. Three connections per concept beats ten flat facts.',
    hint: 'The test: can you state the new concept in 3 sentences using at least one analogy from your existing knowledge?',
    difficulty: 'core',
    applicationContext: 'Reading a paper on prospective hindsight (Klein & Mitchell 1995). Encoding move: "this is why DI\'s pre-mortem prompts use past-tense framing — past tense forces the brain to generate an explanation as if for an outcome already occurred, which produces 25-30% more failure-cause insights than conditional voice. The connection: this is the operationalisation of R²F #5 in CLAUDE.md."',
    source: 'Bjork & Bjork 1994 (desirable difficulty) + sociotechnical-convergence research paper',
    tag: 'protocol',
  },
  {
    id: 'learn_progressive_summarization',
    deckId: 'learning_efficiency',
    prompt: "What is Progressive Summarization and how do its layers compound?",
    canonicalAnswer:
      'Progressive Summarization (Tiago Forte, Building a Second Brain) is a 4-layer compression system that distills information into progressively concentrated layers without re-reading the whole source: Layer 1 = raw notes / quotes captured during the source. Layer 2 = bold the most important sentences. Layer 3 = highlight the bold passages that survive a second read. Layer 4 = write a 2-3 sentence synthesis of just the highlights. Each layer is added on a separate pass, days or weeks apart. The compounding effect: by Layer 4 the founder retrieves the highest-density 1-2% of the source in seconds, but the deeper layers stay accessible if needed. Ties directly to the SM-2 spaced-repetition system in Education Room — recall sessions reinforce Layer 4 first, drilling deeper on miss.',
    hint: 'Layers: capture → bold → highlight → synthesize. Each on a separate pass.',
    difficulty: 'core',
    applicationContext: 'After watching a 90-min Naval Ravikant interview. Day 1: 30 timestamped bullets. Day 3: bold 10. Week 1: highlight 4 of the 10 bold lines. Month 1: write a 3-sentence synthesis of the 4 highlights. By month 6 the synthesis is recallable in 15 seconds; the bold passages take 60 seconds to retrieve.',
    source: 'Tiago Forte, Building a Second Brain (2022) + sociotechnical-convergence research paper',
    tag: 'protocol',
  },
  {
    id: 'learn_sm2_logic',
    deckId: 'learning_efficiency',
    prompt: 'Why does the SM-2 spaced-repetition algorithm space reviews exponentially instead of evenly?',
    canonicalAnswer:
      'SM-2 (SuperMemo 2, Wozniak 1990) schedules reviews at progressively widening intervals — typically Day 1, Day 6, then multiplying by an ease factor (~2.5×) on each successful recall. The exponential spacing matches the forgetting curve: as a memory consolidates, the interval before retrieval becomes useful (vs. wasted re-exposure) grows exponentially. Reviewing every day after initial encoding wastes attention; reviewing too late causes retrieval failure and wasted re-encoding cost. Each successful recall pushes the next due-date further out (compounding); each failed recall resets to Day 1 (cost of skipping reviews). Education Room implements SM-2 lite: each card tracks easeFactor (starts 2.5, decreases on miss), repetitions (count of consecutive successful reviews), intervalDays (current waiting period), and nextDue (auto-computed). The deck-picker shows due-card count + per-deck mastery percentage.',
    hint: 'Forgetting curve = exponential decay → optimal review schedule = exponential spacing.',
    difficulty: 'core',
    applicationContext: 'Drilling the buyer_personas deck before a Wednesday warm-intro call. Cards last reviewed 2 weeks ago surface first; cards reviewed yesterday do not appear. The system optimizes attention allocation automatically.',
    source: 'Wozniak 1990 SuperMemo 2 algorithm + Education Room SM-2 implementation in education-room-data.ts',
    tag: 'theory',
  },
  {
    id: 'learn_tolerance_for_boredom',
    deckId: 'learning_efficiency',
    prompt: 'Why is tolerance for boredom a foundational protocol for deep work?',
    canonicalAnswer:
      'The modern brain expects instant stimulation. Algorithmic short-form video platforms have trained the dopaminergic baseline upward — the brain demands constant novelty to stay engaged. Tolerance for boredom is the deliberate practice of staying present with low-stimulation work (deep reading, writing, problem-solving) without reaching for a screen. The mechanism: by progressively extending periods of uninterrupted low-stimulation focus, the dopaminergic baseline resets downward, restoring the psychological endurance required to tackle complex, frustrating, ambiguous problems. Without this protocol, deep work is impossible — the brain bails out of high-friction cognitive tasks within minutes because they feel intolerable relative to the SFV-trained baseline. Practical implementation: phone-free morning (no first-look screen), 90-min focused blocks with no notifications, structured boredom (a 20-min walk without earbuds).',
    hint: 'The dopaminergic baseline is set by your last 30 days of consumption. Reset it deliberately.',
    difficulty: 'foundation',
    applicationContext: 'Saturday morning startup time — instead of opening LinkedIn first, sit with one paper for 60 min (silent, no music, no phone). The first 15 min feel restless; minutes 15-60 produce the deepest synthesis of the week.',
    source: 'Cal Newport, Deep Work (2016) + sociotechnical-convergence research paper · neurobiology of SFV addiction studies',
    tag: 'protocol',
  },
  {
    id: 'learn_long_vs_short_form',
    deckId: 'learning_efficiency',
    prompt: 'What is the optimal video length for deep insights, and why?',
    canonicalAnswer:
      'For deep insights into world trends, frameworks, and the characteristics of successful operators: long-form, 30 minutes to 2 hours. While short-form media trains speed and shallow reaction, long-form trains depth, patience, and synthesis. Consuming long, in-depth interviews forces the brain to tolerate effort, ambiguity, and complexity — exactly the System 2 muscle the founder needs. The neurological mechanism: short-form algorithmic content downregulates the Dorsolateral Prefrontal Cortex (DLPFC) and Anterior Cingulate Cortex (ACC) — the seats of executive functioning and conflict resolution. Long-form content does the opposite: sustained attention strengthens neural connectivity in those regions over time. Practical sources: Lex Fridman, Tim Ferriss, The Knowledge Project (Shane Parrish), Acquired podcast, founder interviews on YC channel, BG2 (Brad Gerstner), All-In, Howard Marks memos read aloud. Drop algorithmic SFV (TikTok / Reels / Shorts) entirely.',
    hint: '30-min floor for depth · 90-min sweet spot · 2-hour ceiling before fatigue degrades retention.',
    difficulty: 'foundation',
    applicationContext: 'Walking 45 min to an event — listen to one Acquired podcast episode (typically 90-180 min, split across 2 walks). Encode via Active Recall during the walk back: voice-memo the 3 most important claims before checking the phone.',
    source: 'sociotechnical-convergence research paper 2026-05-02 · fMRI/EEG SFV addiction neuroimaging',
    tag: 'consumption',
  },
  {
    id: 'learn_digital_asceticism',
    deckId: 'learning_efficiency',
    prompt: 'What is Digital Asceticism and how does it differ from a "digital detox"?',
    canonicalAnswer:
      'Digital Asceticism (per the sociotechnical-convergence research paper) is the deliberate, rigorous, structural minimization of digital noise to reclaim cognitive bandwidth — distinct from a temporary detox. A detox is a vacation followed by relapse to baseline; asceticism is a permanent reduction in the consumption surface. Specifically: (a) eliminate algorithmic short-form video platforms (TikTok / Reels / Shorts) — these operate on variable-reward schedules that hijack dopaminergic pathways. (b) remove non-essential push notifications. (c) phone-free morning routines (no screen before deep work). (d) physical environments devoid of digital distractions during work blocks. Why permanent: because the dopaminergic baseline only resets if the lower-stimulation environment becomes the steady state. Asceticism is to the digital environment what a low-glycemic diet is to insulin sensitivity — the discipline IS the result. For a 16-year-old founder targeting Stanford / SF / pre-seed in 2027, this is the protocol that compounds.',
    hint: 'Detox = vacation. Asceticism = steady state.',
    difficulty: 'foundation',
    applicationContext: "Friday evening — instead of unwinding via Instagram Reels (which spikes cortisol + downregulates DLPFC), unwind via a 2-hour deep-read session on a paper that connects to DI's moat (e.g. one of the Kahneman & Klein papers). The discipline becomes the leisure.",
    source: 'sociotechnical-convergence research paper 2026-05-02 (High-Agency Protocols section)',
    tag: 'protocol',
  },
  {
    id: 'learn_cognitive_offloading',
    deckId: 'learning_efficiency',
    prompt: 'What is the "Google Effect" / cognitive offloading and why is it especially dangerous for adolescents?',
    canonicalAnswer:
      'When individuals anticipate that information will be stored externally and instantly accessible (search engines, AI assistants, cloud notes), they fail to internally consolidate the knowledge — the brain offloads the encoding step entirely. This is colloquially the "Google Effect" or digital amnesia. For adults whose neural architecture is already built, this means atrophy of existing skills that can theoretically be rebuilt. For ADOLESCENTS the consequence is structurally worse: by relying on AI for summarization, writing, and problem-solving, they may NEVER build the foundational neural architecture for critical thinking, conceptual understanding, and complex auditing in the first place. The defense: deliberate, asymmetric offloading. Use AI as a system to direct (orchestration), not as an oracle to query (replacement). Always run the encoding pass yourself BEFORE asking the AI for a summary — the encoding is what builds the architecture, the AI summary just confirms or sharpens it.',
    hint: 'Encode first. Query AI second. Never the inverse.',
    difficulty: 'foundation',
    applicationContext: "After a NotebookLM synthesis on the master KB, write down the 3 most important insights from memory BEFORE re-reading the synthesis. The friction is the point — if you can't recall any of it 30 minutes later without the synthesis open, the encoding hasn't happened.",
    source: 'Sparrow et al. 2011 (Google Effects on Memory, Science 333:776) + sociotechnical-convergence research paper',
    tag: 'risk',
  },
  {
    id: 'learn_system1_system2_ratio',
    deckId: 'learning_efficiency',
    prompt: 'What is the System 1 / System 2 ratio and how does Decision Intel measure it on a memo?',
    canonicalAnswer:
      "Per Kahneman (Thinking, Fast and Slow), System 1 is fast / intuitive / pattern-matching cognition. System 2 is slow / deliberate / analytical cognition. Most cognitive biases are System 1 failure modes — heuristics applied where deliberate analysis was warranted. Decision Intel scores process maturity (one of the six DQI components, weight 13%) partly via the System 1 / System 2 ratio of detected biases. A memo where >70% of detected biases are System 1 (anchoring, availability, framing, recency) signals a heuristic-dominant decision process — penalized. A memo where the ratio is balanced or System 2-leaning (with explicit pre-mortem, dissent, base rates, blind priors) is rewarded. For the founder personally: the same ratio applies. If most of your daily knowledge work is System 1 (scrolling feeds, reactive replies, surface skim), the founder brain is not building System 2 capacity. Long-form reading + Active Recall + writing = System 2 amplification.",
    hint: 'System 1 = fast/intuitive (patterns). System 2 = slow/deliberate (analysis). The ratio is auditable.',
    difficulty: 'core',
    applicationContext: 'A founder asks ChatGPT to summarize a 30-page strategy paper without reading it first. That is a System 1 move (cognitive offloading). Reading the paper, writing your own 3-sentence summary from memory, THEN asking ChatGPT to surface what you missed — that is System 2 amplification by AI.',
    source: 'Kahneman 2011 + DQI process-maturity component in src/lib/scoring/dqi.ts',
    tag: 'theory',
  },
  {
    id: 'learn_locus_of_control',
    deckId: 'learning_efficiency',
    prompt: 'What is internal vs external locus of control and why does it matter for high-agency founders?',
    canonicalAnswer:
      "Locus of control (Rotter 1966) is the degree to which an individual believes outcomes are under their own control vs determined by external forces (luck, fate, system, others). Internal locus = 'my outcomes track my actions and discipline.' External locus = 'my outcomes track macro forces, gatekeepers, what's-in-the-air.' For a 16-year-old founder navigating an Age of Displacement scenario (per the sociotechnical-convergence research paper), the macro environment IS chaotic and structurally flawed — but personal capacity to adapt, learn, and exert discipline remains entirely within control. Adopting an internal locus is not denying the macro reality; it is choosing the operating frame that produces action. Frame life as a strategic game of asset and skill allocation. View AI not as a terminator of human potential but as a lever to multiply your own agency. The macro decline is real; your individual response is also real. The two facts are not in tension.",
    hint: "Internal locus = 'my response is the variable I control.' External locus = 'I'm a passenger.' The first compounds; the second collapses.",
    difficulty: 'foundation',
    applicationContext: 'When a peer says "everything is rigged / AI is going to take all the jobs / it doesn\'t matter what we do" — recognize this as external-locus framing. The honest response: the macro is rigged, AND the individual response still determines the individual outcome. Both. Then redirect to action.',
    source: 'Rotter 1966 (locus of control) + sociotechnical-convergence research paper (High-Agency Protocols section)',
    tag: 'mindset',
  },
  {
    id: 'learn_distress_tolerance',
    deckId: 'learning_efficiency',
    prompt: 'Why is distress tolerance a load-bearing protocol and how do you build it deliberately?',
    canonicalAnswer:
      'Distress tolerance is the capacity to operate effectively under stress, ambiguity, and adversity without dropping into avoidance or emotional dysregulation. The Gen Z workforce data (Deloitte: 47% report stress / anxiety most or all the time; Gallup: 1.1-year average tenure for Gen Z first-five-years vs 2.8 for Gen X) signals a generational deficit in this capacity. Modern cultural and educational frameworks have inadvertently sheltered youth from adversity, contributing to fragility. The defense is deliberate exposure: actively seek out difficult challenges (academic, physical, social) and practice operating effectively under stress. Specifics: cold exposure (2-3 min cold shower); physical exercise that progressively pushes effort tolerance; doing the hardest task of the day FIRST; deliberately presenting ideas to senior people who will push back. The compounding: each tolerated friction expands the capacity. Without this, the founder cannot navigate the tumultuous transition phase the macro environment is entering.',
    hint: 'Adversity is a deliberate input variable, not a thing that happens to you.',
    difficulty: 'core',
    applicationContext: 'Pre-event nerves before a Wednesday warm-intro with an F500 GC. Distress tolerance protocol: instead of avoiding the meeting via over-prep, actively rehearse the most difficult question they could ask (e.g. "give me a customer reference I can call today"). The friction of admitting "no live customer references yet" + having a clean honest answer ready expands the tolerance for the actual moment.',
    source: 'Deloitte Gen Z survey + Gallup engagement data + sociotechnical-convergence research paper (High-Agency Protocols section)',
    tag: 'protocol',
  },
  {
    id: 'learn_compounding_loop',
    deckId: 'learning_efficiency',
    prompt: 'How do all 11 learning-efficiency protocols compose into a single compounding loop?',
    canonicalAnswer:
      'The protocols compose hierarchically. (1) Tier 1 / Protect: digital asceticism + tolerance for boredom + distress tolerance reset the dopaminergic + stress baselines. (2) Tier 2 / Acquire: with the baseline reset, long-form content (30-90+ min) becomes consumable; deep reading rebuilds inferential-reasoning circuitry. (3) Tier 3 / Encode: Active Recall + Elaborative Encoding + Progressive Summarization convert consumption into long-term memory. (4) Tier 4 / Retain: SM-2 spaced repetition reinforces the encoded knowledge at exponentially widening intervals; the System 1 / System 2 ratio audit catches drift toward heuristic-dominant cognition. (5) Tier 5 / Deploy: internal locus of control reframes the macro chaos as the operating environment; high-agency action allocates the encoded knowledge into product / pitch / decision artefacts. The compounding: each loop iteration deepens prior tiers. Year 1: capacity to consume a 90-min interview without bailing. Year 3: capacity to synthesize 200 sources into a single defensible thesis. Year 10: capacity to architect a category like Decision Intel. The protocols are not optional — they are the operating system the rest of the founder hub runs on.',
    hint: 'Protect → Acquire → Encode → Retain → Deploy. Each tier feeds the next.',
    difficulty: 'advanced',
    applicationContext: 'Asked by a peer: "if you had to pick ONE habit that compounds the most for an aspiring founder, what would it be?" The honest answer: there is no single habit. There are protocols that compose. The composition itself is the moat.',
    source: 'Synthesis of all 11 learning-efficiency cards + FounderOSPanel Cognitive Sovereignty Stack visualization',
    tag: 'synthesis',
  },
];

// ─── Aggregator + Helpers ───────────────────────────────────────

export const ALL_CARDS: EducationCard[] = [
  ...DI_VOCABULARY_CARDS,
  ...BUYER_PERSONAS_CARDS,
  ...MAALOUF_PRINCIPLES_CARDS,
  ...SATYAM_PILLARS_CARDS,
  ...SILENT_OBJECTIONS_CARDS,
  ...GRADING_DIMENSIONS_CARDS,
  ...GRADING_DIMENSIONS_V2_CARDS,
  ...COGNITIVE_BIASES_CARDS,
  ...PIPELINE_NODES_CARDS,
  ...DQI_METHODOLOGY_CARDS,
  ...REGULATORY_FRAMEWORKS_CARDS,
  ...R2F_FRAMEWORK_CARDS,
  ...FOUNDER_ONELINERS_CARDS,
  ...ADVANCED_SALES_MOVES_CARDS,
  ...BRINKMANSHIP_CARDS,
  ...STRATEGIC_THINKING_CARDS,
  ...GOLDNER_DISCOVERY_CARDS,
  ...LEARNING_EFFICIENCY_CARDS,
];

export function findDeck(id: DeckId): EducationDeck | undefined {
  return DECKS.find(d => d.id === id);
}

export function findCard(id: string): EducationCard | undefined {
  return ALL_CARDS.find(c => c.id === id);
}

export function cardsForDeck(id: DeckId): EducationCard[] {
  return ALL_CARDS.filter(c => c.deckId === id);
}

export function deckCardCount(id: DeckId): number {
  return ALL_CARDS.reduce((n, c) => (c.deckId === id ? n + 1 : n), 0);
}

/** SM-2 lite: update card state after a recall attempt (quality 0-5). */
export function applySm2(prev: SM2CardState | null, quality: number, cardId: string): SM2CardState {
  const now = new Date();
  const nowIso = now.toISOString();
  const prior = prev || {
    cardId,
    easeFactor: 2.5,
    repetitions: 0,
    intervalDays: 0,
    lastReviewed: nowIso,
    nextDue: nowIso,
    totalReviews: 0,
    successfulReviews: 0,
  };

  let easeFactor = prior.easeFactor;
  let repetitions = prior.repetitions;
  let intervalDays = prior.intervalDays;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(prior.intervalDays * easeFactor);
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const nextDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    cardId,
    easeFactor,
    repetitions,
    intervalDays,
    lastReviewed: nowIso,
    nextDue,
    totalReviews: prior.totalReviews + 1,
    successfulReviews: prior.successfulReviews + (quality >= 4 ? 1 : 0),
  };
}

export function gradeFromRecallScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}
