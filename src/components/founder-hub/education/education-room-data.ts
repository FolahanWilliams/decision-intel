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
 * grading-rubric dimensions, the 17 frameworks, the 12-node pipeline,
 * R²F's Kahneman+Klein integration, and the locked positioning claims.
 *
 * Locked: 2026-04-28. When CLAUDE.md positioning vocabulary changes or
 * a new persona / framework / lesson lands, update HERE only — the
 * EducationRoomTab pulls all decks + cards from these typed exports.
 *
 * Total cards as of 2026-04-28: see DECKS array. Aim for ~120-150 cards
 * across 12 decks for a complete first-mastery curriculum.
 */

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
  | 'founder_oneliners';

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
      'The 11-dimension Sales DQI scorecard (Maalouf 4 + Satyam 3 + DI discipline 2 + Kahneman 1 + fundamentals 1).',
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
];

// ─── Cards: DI Vocabulary (20) ──────────────────────────────────────

const DI_VOCABULARY_CARDS: EducationCard[] = [
  {
    id: 'voc_reasoning_layer',
    deckId: 'di_vocabulary',
    prompt: 'What is the canonical category claim for Decision Intel?',
    canonicalAnswer:
      "The native reasoning layer for every high-stakes call. \"Reasoning layer\" is the ownable category anchor. \"Native\" does the \"built for this, not retrofitted\" work. \"High-stakes call\" is the universal noun phrase that lands across all six buyer personas (CSO, head of strategic planning, M&A partner, fund analyst, GC, board director).",
    hint: 'Think category-creator language, not feature-list.',
    difficulty: 'foundation',
    applicationContext: 'You are introducing Decision Intel to a warm-context F500 CSO who has had a prior meeting.',
    source: 'CLAUDE.md One-liner section',
    tag: 'locked',
  },
  {
    id: 'voc_r2f',
    deckId: 'di_vocabulary',
    prompt: 'What does R²F stand for and what does it integrate?',
    canonicalAnswer:
      "Recognition-Rigor Framework. It arbitrates Kahneman's rigor (System 2 debiasing — biasDetective, noiseJudge, statisticalJury) WITH Klein's recognition (System 1 amplification — rpdRecognition, forgottenQuestions, pre-mortem) in one pipeline. No competitor combines both traditions. Anchor citation: Kahneman-Klein 2009 paper \"Conditions for Intuitive Expertise: a failure to disagree.\"",
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
      "The procurement-grade artefact every audit produces. It is hashed and tamper-evident (SHA-256 input hash + record fingerprint). Private-key signing is on the roadmap, NOT shipped today. The artefact carries integrity fingerprints, model lineage, judge variance, academic citations, 17-framework regulatory mapping, pipeline lineage, blind-prior aggregations, and (when applicable) reviewer-decisions HITL log + data-lifecycle footer. Use the EXACT phrase \"hashed and tamper-evident\" — never overclaim \"signed\" until that ships.",
    difficulty: 'core',
    applicationContext: 'A GC asks: "what does your audit actually produce that I can show to a regulator?"',
    source: 'CLAUDE.md DPR vocabulary lock 2026-04-26',
    tag: 'locked',
  },
  {
    id: 'voc_dqi',
    deckId: 'di_vocabulary',
    prompt: 'What is the Decision Quality Index (DQI) and what is its grade scale?',
    canonicalAnswer:
      "DQI is the composite 0-100 score that decomposes the quality of a strategic decision across 6 weighted components. Grade scale: A 85+ / B 70+ / C 55+ / D 40+ / F (<40). The boundaries are canonical and live in src/lib/scoring/dqi.ts → GRADE_THRESHOLDS. Any consumer that maps score-to-grade must import from this canonical source — never re-implement.",
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
    applicationContext: 'Cold opener with a CSO who is tired of reconstructing why a decision was made 6 months ago.',
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
    prompt: 'What is the procurement-friendly category framing alternative to "decision intelligence platform"?',
    canonicalAnswer:
      "\"Native system of record for strategic reasoning.\" This is the procurement-friendly category claim. The softer alternative \"native medium for strategic reasoning\" works on surfaces where \"system of record\" feels over-procurement-coded. Both replace \"decision intelligence platform\" (Gartner-crowded — Peak.ai, Cloverpop, Quantellia, Aera). \"Decision intelligence\" is fine inside a sentence; never as the headline claim.",
    difficulty: 'core',
    applicationContext: 'Procurement-stage call where the GC asks for a clean category descriptor.',
    source: 'CLAUDE.md Positioning + Vocabulary discipline 2026-04-22',
    tag: 'locked',
  },
  {
    id: 'voc_banned_di_platform',
    deckId: 'di_vocabulary',
    prompt: 'Why is "decision intelligence platform" BANNED in marketing leads, and what do you say instead?',
    canonicalAnswer:
      "Gartner-crowded category. Cloverpop, Peak.ai, Quantellia, Aera all claim the same descriptor. Using it locks Decision Intel into a price-comparison frame against incumbents who have more proof. Replacement: \"native reasoning layer\" (warm context) or \"60-second audit on strategic memos\" (cold context). \"Decision intelligence\" is fine as a descriptor INSIDE a sentence, never as the headline claim.",
    difficulty: 'core',
    applicationContext: 'You catch yourself about to say "decision intelligence platform" in a cold meeting.',
    source: 'CLAUDE.md Marketing Voice Enterprise Discipline',
    tag: 'banned',
  },
  {
    id: 'voc_banned_decision_hygiene',
    deckId: 'di_vocabulary',
    prompt: 'Why is "decision hygiene" BANNED, and what is the DI replacement?',
    canonicalAnswer:
      "\"Decision hygiene\" is Daniel Kahneman's term from his 2021 book \"Noise.\" Borrowing it cedes our category vocabulary to a more famous author who already owns the phrase. We don't use the cleaner-than-thou framing either; cleanliness is a corrective frame. Our replacement vocabulary: \"decision archaeology\" (the pain we replace) + \"reasoning audit\" + \"Recognition-Rigor Framework\" (the IP). NEVER use \"decision hygiene\" in any DI material.",
    difficulty: 'core',
    applicationContext: 'A founder peer suggests "you should call this decision hygiene" — you decline.',
    source: 'CLAUDE.md Vocabulary discipline by reader temperature',
    tag: 'banned',
  },
  {
    id: 'voc_banned_boardroom_strategic_decision',
    deckId: 'di_vocabulary',
    prompt: 'Why was "boardroom strategic decision" retired as the H1 noun phrase?',
    canonicalAnswer:
      "It narrowed funds (Sankore — first design partner) and non-board-reporting teams out of the audience. The 2026-04-26 empathic-mode-first review caught the narrowing. Replacement: \"high-stakes call\" — universal noun phrase that lands across all six buyer personas (CSO, head of strategic planning, M&A partner, fund analyst, GC, board director). \"Boardroom\" is only valid in long-form writing where the audience is explicitly F500 board-reporting (e.g., /decision-intel-for-boards). The H1 sweep replaced \"the board will catch first\" with \"the room will catch first\" so the universalisation actually holds.",
    difficulty: 'advanced',
    applicationContext: 'Editing landing page copy. You see "boardroom" in a heading.',
    source: 'CLAUDE.md One-liner re-lock 2026-04-26',
    tag: 'banned',
  },
  {
    id: 'voc_cold_descriptive',
    deckId: 'di_vocabulary',
    prompt: 'For a COLD context (LinkedIn DM, conference 1:1, landing-page above-the-fold for unaware traffic), what is the canonical descriptive bridge?',
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
    prompt: 'For a WARM context (second meeting, pitch deck, design-partner conversation), what category vocabulary do you use?',
    canonicalAnswer:
      '"Native reasoning layer for every high-stakes call." "Recognition-Rigor Framework arbitrating Kahneman + Klein." "Decision Quality Index in 60 seconds." This is the OWNABLE category vocabulary where category creation happens. Warm contexts have earned the term through prior context. Do NOT default to descriptive language here — that under-leverages the category framing.',
    difficulty: 'core',
    applicationContext: 'Second meeting with a CSO who already heard the cold pitch and is now asking for depth.',
    source: 'CLAUDE.md Vocabulary discipline by reader temperature',
    tag: 'warm_locked',
  },
  {
    id: 'voc_135_decisions',
    deckId: 'di_vocabulary',
    prompt: 'What is the canonical historical-decision benchmark number Decision Intel cites?',
    canonicalAnswer:
      '"135 audited corporate decisions" — defensible, internally curated, deduped 2026-04-16 from the prior 146. Always say "135 historical decisions" or "135 audited corporate decisions" — never round to "~100" or "~150" or claim larger numbers. The dataset is the procurement-grade reference for cross-referencing patterns. Use it as the first anchor in any cold pitch ("we have audited 135 corporate decisions across the last decade").',
    difficulty: 'foundation',
    applicationContext: 'Cold pitch to a CSO. You need a single number that makes the work feel real.',
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
    canonicalAnswer:
      '17 frameworks across G7 / EU / GCC / African markets. The count is structurally derived from getAllRegisteredFrameworks().length — never literal a number that can drift. African coverage uniquely strong: NDPR (Nigeria), CBN, FRC Nigeria, WAEMU, CMA Kenya, CBK, BoG, CBE (Egypt), PoPIA s.71 (South Africa), SARB Model Risk, BoT FinTech. This is a structural moat against US-only incumbents.',
    difficulty: 'foundation',
    applicationContext: 'Pan-African fund partner asks "do you actually cover OUR regulators?"',
    source: 'CLAUDE.md positioning + africa-frameworks.ts',
    tag: 'numbers',
  },
  {
    id: 'voc_blended_margin',
    deckId: 'di_vocabulary',
    prompt: 'What is the honest blended margin claim for Decision Intel, and why was the prior "97%" claim wrong?',
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
      "~£0.30-0.50 (~$0.40-0.65) per audit on Gemini paid tier 1. Each audit fires ~17 LLM calls across the 12-node pipeline. Cost-tier routing (Apr 2026) moved gdprAnonymizer/structurer/intelligenceGatherer to gemini-3.1-flash-lite for 15-25% savings. The metaJudge final-verdict node runs on gemini-2.5-pro (the highest-leverage single call — reasoning-quality matters more than cost).",
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
      "Primary concern: \"Will this make my next IC memo defensible enough that the partners stop questioning my judgement on diligence depth?\" Verbatim opener: \"You're trying to make sure your partners stop pushing back on diligence depth — that's exactly what this fixes in 60 seconds. Look at the WeWork S-1 audit; same shape as your last memo.\" Lead with HER specific career-pain (partner pushback), then the artefact, then the comparable-cost frame.",
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
      "Primary concern: \"Can I get my associate to spot the bias gap in a CIM before our client sees buyer questions and we lose 5% of EV on the term sheet?\" Verbatim opener: \"The blind spots in a CIM cost you 5% of EV at term sheet. The audit catches them before the buyer pool sees the deck — your associate runs it, you don't have to.\" Lead with EV-loss anchor (loss aversion), then who runs it (his associate, not him), then the timing.",
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
      "Primary concern: \"My credibility is my product. If a client questions one of my recommendations, can I show them I stress-tested it with something more rigorous than my own brain?\" Verbatim opener: \"Your credibility is your product — when a client pushes back on a recommendation, you need an answer sharper than 'trust me, I'm ex-MBB.' This is the sharper answer in 60 seconds.\" Lead with credibility-as-product framing, NOT the consultant×AI angle (he's worried it makes him look less senior).",
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
    prompt: "Margaret says 'I cannot put a 16-year-old's name in front of my CEO.' Verbatim 30-second response?",
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
    prompt: "Titi says 'I worry you'll close 5 wedge cases and pivot to F500 next year. Where does that leave my fund?' Verbatim 30-second response?",
    canonicalAnswer:
      "\"You should worry about that with US-only vendors. The 17-framework regulatory map covers NDPR, CBN, WAEMU, PoPIA, CMA Kenya — that's not a feature I added because you asked. That's the structural moat. The Dangote DPR carries Pan-African regulatory mapping by default. Pivoting to F500 means killing the moat, which means killing the company. The wedge IS the company. The F500 ceiling is the natural expansion vector — not the replacement.\" Lead with structural commitment (the regulatory map IS the moat), not promise-based reassurance.",
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
      "James = General Counsel at a regulated entity, archetype. Reports to the audit committee chair. Career-long focus on regulatory exposure, not business growth. Every new vendor gets a 90-day vendor-risk review. James is NOT a buyer — he is the VETO HOLDER on Margaret-class deals. The CSO is the champion; James is the gate. Default skepticism: very high. He notices every overclaim instantly — uses regulator vocabulary natively (EU AI Act Article 14, Basel III Pillar 2 ICAAP, GDPR Art 22).",
    difficulty: 'core',
    applicationContext: 'Should you treat James as a primary persona to convert?',
    source: 'sparring-room-data.ts BUYER_PERSONAS',
    tag: 'veto_holder',
  },
  {
    id: 'persona_james_phrase',
    deckId: 'buyer_personas',
    prompt: 'James asks "your DPR says tamper-evident but your roadmap admits private-key signing isn\'t shipped — explain." Verbatim 30-second response?',
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
      "Riya = pre-seed VC associate archetype. Associate at a $100M pre-seed/seed B2B SaaS fund. Sees 50 founders/month. Decision authority is \"should we put this in the partner meeting\" — the PARTNER makes the actual call. Riya is the gatekeeper, not the buyer. She wants to look smart bringing this to her partner — does it survive the 60-second elevator question without her having to defend it?",
    difficulty: 'core',
    applicationContext: 'Differentiating buyer pathways from investor pathways.',
    source: 'sparring-room-data.ts BUYER_PERSONAS',
    tag: 'investor',
  },
  {
    id: 'persona_riya_phrase',
    deckId: 'buyer_personas',
    prompt: 'Riya asks "is this a wrapper that GPT-5 with vision eats in 6 months?" Verbatim 30-second response?',
    canonicalAnswer:
      "\"What GPT-5 doesn't eat: the 135-decision case library, the 17-framework regulatory mapping across G7 / EU / GCC / African markets, the Brier-scored per-org outcome flywheel that recalibrates the DQI for THIS organisation specifically. Wrapper-class products are the prompt; we're the prompt PLUS the procurement-grade artefact PLUS the data flywheel. The architectural moat is the regulatory + outcome data, not the model call.\" Name three specific structural moats. Don't deny the wrapper concern abstractly.",
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
    applicationContext: 'You sense the buyer is interested but not ready to commit — how do you nudge without pushing?',
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
    prompt: 'What is the low-ticket vs. high-ticket distinction in Maalouf\'s framework?',
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
    applicationContext: 'You want to signal you\'re busy without bragging.',
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
      "Satyam #2: name the FAILURE MODE of the category, not the competitor. \"Most decision-intelligence tools score the OUTCOMES — they tell you which decisions worked. We score the REASONING — we catch the bias before the call. That's a structural difference, not a feature comparison.\" Identifies the gap, doesn't bash competitors, leaves the buyer to draw their own conclusion.",
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
    applicationContext: 'Margaret-class CSO asks about company longevity in procurement-stage call.',
    source: 'closing-lab-data.ts',
    tag: 'objection_3',
  },
  {
    id: 'silent_chatgpt_wrapper',
    deckId: 'silent_objections',
    prompt: 'What is the ChatGPT-wrapper objection, and what 3 specific moats answer it?',
    canonicalAnswer:
      "Silent objection: 'This looks like a system prompt around GPT-4 with a UI. Why pay you?' Three structural moats answer: (1) The 135-decision case library (cross-referenced patterns, not just prompt context). (2) The 17-framework regulatory mapping across G7 / EU / GCC / African markets (NDPR, CBN, WAEMU, PoPIA — Cloverpop / IBM watsonx don't cover). (3) The per-org Brier-scored outcome flywheel that recalibrates DQI weights for THIS organisation specifically (data moat that compounds with every audit — Cloverpop's data advantage but in YOUR direction). Plus: ensemble sampling across 3 model judges, NOT a single GPT call.",
    difficulty: 'advanced',
    applicationContext: "Pre-seed investor or Adaeze-class associate asks the wrapper question.",
    source: 'closing-lab-data.ts + CLAUDE.md External Attack Vectors',
    tag: 'objection_4',
  },
  {
    id: 'silent_pan_african_regulatory',
    deckId: 'silent_objections',
    prompt: 'What is the Pan-African regulatory illusion objection, and where does it live structurally?',
    canonicalAnswer:
      "Silent objection: 'You CLAIM Pan-African regulatory coverage but does the audit actually map to ISA 2007 / FRC Nigeria current code, or just NDPR?' The reality: the African-frameworks file (src/lib/compliance/frameworks/africa-frameworks.ts) covers NDPR, CBN, FRC Nigeria, WAEMU, CMA Kenya, CBK, BoG, CBE, PoPIA s.71, SARB Model Risk, BoT FinTech. ISA 2007 + FRC Nigeria current-code mapping: TODO. Until that mapping ships, a Pan-African GC who reads the framework list will catch the gap. Status: TODO.",
    difficulty: 'advanced',
    applicationContext: 'Titi-class fund partner shares brief with her IC partner — IC partner asks the question.',
    source: 'closing-lab-data.ts + CLAUDE.md positioning',
    tag: 'objection_5',
  },
];

// ─── Cards: 11 Sales DQI Grading Dimensions ───────────────────────

const GRADING_DIMENSIONS_CARDS: EducationCard[] = [
  {
    id: 'rubric_pressure_without_pressure',
    deckId: 'grading_dimensions',
    prompt: 'In the Sales DQI rubric, what does "pressure without pressure" measure, and what is excellent vs poor?',
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
    applicationContext: "You feel the urge to soften your strongest claim — STOP.",
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
    prompt: 'In the Sales DQI rubric, what does "vocabulary discipline" measure, and what trips it up?',
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
    applicationContext: "First sentence to a cold buyer — is it about you or them?",
    source: 'sparring-room-data.ts',
    tag: 'di_discipline',
  },
  {
    id: 'rubric_loss_aversion_framing',
    deckId: 'grading_dimensions',
    prompt: 'In the Sales DQI rubric, what does "loss-aversion framing" measure, and what is the academic anchor?',
    canonicalAnswer:
      "Kahneman source — prospect theory. Weight: 0.10. Academic anchor: Kahneman & Tversky 1979 — losses weight ~2-2.5× gains in decision-making. Excellent (5/5): frames value as preventing a SPECIFIC, named loss the buyer is already worrying about — the regrettable strategic mistake, the career-limiting board disclosure, the LP pulling capital, the McKinsey bill that told them what they should have caught themselves. Anchors price against a comparable cost the buyer already accepts. The buyer feels the price IS small relative to what they're already losing without it. Poor (1/5): frames as upside / gain only ('better decisions', 'improved quality'). The buyer hears upside and discounts (status-quo bias + loss aversion: the cost is certain, the gain is hypothetical).",
    difficulty: 'advanced',
    applicationContext: 'Pricing conversation: do you say "you could improve" or "you could prevent X"?',
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
    applicationContext: "Self-grading: can the buyer repeat ONE thing you said to a colleague?",
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
      "Confirmation bias: the tendency to search for, interpret, and recall information that confirms a prior belief while discounting contradicting evidence. In a strategic memo, it shows up as cherry-picked supporting data, dismissive treatment of counter-evidence ('but those cases are different because...'), and recommendation language that assumes the conclusion before laying out the reasoning. The DI audit catches this through the structuralAssumptions node + cross-referencing the memo against the 135-decision case library.",
    difficulty: 'foundation',
    applicationContext: "Reviewing a strategic memo where the conclusion was reached before the analysis.",
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
    applicationContext: "An IC memo that leans heavily on the founder/CEO biography.",
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
      "Availability heuristic: judging probability by how easily examples come to mind. Recent or vivid events feel more likely than they statistically are. In M&A: a recent successful deal in the sector feels like 'the sector is hot' even when the success rate hasn't actually shifted. DI's intelligenceGatherer node pulls statistical base rates from the 135-decision case library and surfaces the gap between 'how this case feels' and 'how similar cases historically performed.'",
    difficulty: 'core',
    applicationContext: 'CSO says "everyone is doing X right now" — but is that statistically true?',
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
    applicationContext: 'A Nigeria-focused fund memo that assumes the team can hedge naira FX risk.',
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
    prompt: 'What is loss aversion (the bias) and how do you BOTH defend against it AND use it in your own sales pitch?',
    canonicalAnswer:
      "Loss aversion (Kahneman & Tversky 1979): losses weight ~2-2.5× gains in decision-making. As a BIAS to defend against: organisations refuse to exit failing markets because exit is framed as 'taking the loss' rather than 'redeploying capital to higher-return opportunities.' DI's audit reframes exit decisions as forward-looking expected-value comparisons. As a SALES TOOL: frame DI's value as preventing a specific named loss (the regrettable strategic mistake, the McKinsey bill, the partner pushback). The buyer's loss-aversion makes the price feel SMALL relative to what they're losing without it. Same psychology, two directions — defense for clients, weapon for your own pitch.",
    difficulty: 'advanced',
    applicationContext: 'You\'re both auditing a CSO\'s exit decision AND pitching them on the audit tool.',
    source: 'bias-education.ts + sparring-room loss_aversion_framing dimension',
    tag: 'kahneman',
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
      "Runs an independent SECOND judgement of the same memo and measures variance against the primary biasDetective output. Academic anchor: Kahneman, Sibony & Sunstein 2021 NOISE — \"the chief enemy of good judgement is not bias, it is NOISE\" (variance between judges who should agree). The noise score is a separate signal from the bias score. High noise + low bias = the memo is provoking inconsistent reads; not necessarily biased but structurally ambiguous. Low noise + high bias = the bias is consistent and easy to flag. The interaction matters.",
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
      "Klein's Recognition-Primed Decision framework. Identifies the situation pattern in the memo (M&A target like 'losing-battle commitment', or market-entry like 'naira-devaluation timing') and pulls historical analogs from the 135-decision case library. Returns: situational pattern + historical analogs ranked by structural similarity + recognition-based recommendation. This is Klein's HALF of R²F — recognition (System 1 amplification). The Kahneman half (debiasing — biasDetective + noiseJudge + statisticalJury) is System 2 rigor. Together they ARE R²F. No competitor combines both.",
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
      "The final-verdict node. Reviews ALL upstream node outputs (structuralAssumptions, biasDetective, noiseJudge, rpdRecognition, forgottenQuestions, pre-mortem, statisticalJury) and produces the integrated DQI score with explanatory narrative. Runs on gemini-2.5-pro (the Pro-tier exception in the model policy) because reasoning quality matters more than cost on the highest-leverage single call in the pipeline. The metaJudge output is what the buyer SEES first in the analysis — the executive summary, the DQI score, the recommendation. Override via GEMINI_MODEL_PRO env var.",
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
      "The DQI decomposes into 6 weighted components (defined in src/lib/scoring/dqi.ts): (1) Bias score (severity-weighted), (2) Structural assumptions score, (3) Noise / inter-judge variance, (4) Pre-mortem coverage (failure modes considered), (5) Recognition score (historical-analog grounding), (6) Statistical / base-rate alignment. Weights are calibrated against the 135-case library. The recalibratedDqi field on Analysis is updated per-org based on Brier-scored outcomes — so the weights drift toward what THIS org actually predicts.",
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
      "A: 85+ / B: 70+ / C: 55+ / D: 40+ / F: <40. Defined in src/lib/scoring/dqi.ts → GRADE_THRESHOLDS. The boundaries are CANONICAL — every consumer that maps score-to-grade MUST import from this canonical source. Re-implementing the same logic in another file is the drift-class bug (caught quick-score.ts:scoreToGrade using the wrong thresholds 90/70/50/30 in the 2026-04-27 slop-scan sweep). When changing boundaries, update both GRADE_THRESHOLDS and the JSDoc at the top of dqi.ts in the same commit.",
    difficulty: 'foundation',
    applicationContext: "Buyer sees a 67/100 — what grade?",
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
      "DQI is calibrated against the 135-decision case library (deduped 2026-04-16 from 146). Each historical case has a known outcome — DQI weights are tuned so that historically-failed decisions score lower and historically-successful ones score higher, with appropriate variance. The Bias Genome page (/bias-genome) surfaces aggregated cohort-level patterns — 'failure lift' = bias failure rate / baseline failure rate. n>=5 for headline rankings; n<3 surfaces with a warning flag.",
    difficulty: 'advanced',
    applicationContext: 'Procurement asks for the validation methodology.',
    source: 'CLAUDE.md Bias Genome + 135 historical decisions lock',
    tag: 'methodology',
  },
];

// ─── Cards: Regulatory Frameworks (8 most invoked) ──────────────

const REGULATORY_FRAMEWORKS_CARDS: EducationCard[] = [
  {
    id: 'reg_eu_ai_act',
    deckId: 'regulatory_frameworks',
    prompt: 'EU AI Act: what is the anchor article DI maps to, and what is the enforcement timeline?',
    canonicalAnswer:
      "Article 14 (human oversight) is the anchor — the DPR maps onto Art 14 record-keeping by design. Also relevant: Art 13 (transparency), Art 15 (accuracy + record-keeping), Annex III (high-risk use cases). Timeline: EU AI Act in force since Aug 2024. Prohibited practices enforceable Feb 2, 2025. General-purpose AI obligations Aug 2, 2025. High-risk decision-support systems Aug 2, 2026 — THE date that anchors most procurement-stage urgency. This is the #1 regulatory tailwind for DI.",
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
    applicationContext: "Bank GC asks 'how do you cover Basel III ICAAP qualitative documentation?'",
    source: 'CLAUDE.md Regulatory Tailwinds + DPR v2 enhancements',
    tag: 'banking',
  },
  {
    id: 'reg_gdpr_art_22',
    deckId: 'regulatory_frameworks',
    prompt: 'GDPR Art 22: what does it require, and how does DI handle it?',
    canonicalAnswer:
      "Article 22: rights of data subjects in automated decision-making — they have the right to meaningful information about the LOGIC involved, plus the right to contest. DPR citations provide that without exposing platform IP. Decision Intel is the PROCESSOR; the customer is the CONTROLLER — the privacy page names the routing explicitly with a 4-step contestation flow (mailto:team@decision-intel.com → 5-day acknowledgment → 30-day controller response → supervisory complaint fallback). Live since 2018. Updated /privacy 2026-04-26 with explicit Art 22 third-party path section.",
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
      "Central Bank of Nigeria (CBN). Covers Nigerian financial-services regulatory rules including the I&E (Investors & Exporters) FX window guidance, banking capital adequacy, and lending standards. Applies to memos involving Nigerian financial entities or NGN-denominated capital allocation. The structuralAssumptions node injects CBN sovereign-context (naira free-float + I&E window dynamics) for Nigeria-mentioning memos automatically.",
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
    applicationContext: 'Memo about a Côte d\'Ivoire consumer rollup.',
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
    applicationContext: 'Pan-African fund partner asks about ISA 2007 coverage in procurement-stage call.',
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
      "Kahneman's side = System 2 debiasing rigor. Implemented by: (1) biasDetective (catches the 30+ named biases), (2) noiseJudge (measures inter-judge variance — Kahneman/Sibony/Sunstein NOISE 2021), (3) statisticalJury (compares against base rates from the 135-case library). Together they implement the rigorous-skepticism layer: 'what's wrong with this reasoning, statistically.'",
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
      "Klein's side = System 1 amplification through pattern recognition. Implemented by: (1) rpdRecognition (Recognition-Primed Decision — pattern-matches the situation to historical analogs in the 135-case library), (2) forgottenQuestions (surfaces what the memo SHOULD be asking but isn't, drawn from analogs), (3) pre-mortem (Klein's failure-imagination technique — imagines the project failed in 18 months and asks why). Together they implement the experiential-pattern layer: 'what would an expert recognise in this situation that the memo is missing?'",
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
    applicationContext: 'Sophisticated investor asks how you handle the tension between the two frameworks.',
    source: 'CLAUDE.md',
    tag: 'integration',
  },
  {
    id: 'r2f_anchor_paper',
    deckId: 'r2f_framework',
    prompt: 'What is the anchor academic paper for the R²F integration claim?',
    canonicalAnswer:
      "Kahneman & Klein 2009 — \"Conditions for Intuitive Expertise: a failure to disagree\" (American Psychologist 64:6, 515-526). The paper itself is two icons of opposing decision-research traditions trying to find common ground. Their conclusion: expert intuition is reliable in domains with regular feedback and stable conditions; unreliable elsewhere. R²F operationalises this: amplify intuition where it's reliable (Klein recognition), debias where it isn't (Kahneman rigor), let the metaJudge arbitrate. The trademark filing on R²F is DEFERRED until pre-seed close; use consistently now so vocabulary is owned by usage alone.",
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
      "Cloverpop scores OUTCOMES (after the fact, structured logging). Aera executes decisions autonomously (agentic). IBM watsonx.governance audits the MODEL (not the human reasoning). Quantellia / Peak.ai are predictive-analytics dashboards. NONE attempt to integrate Kahneman's debiasing tradition WITH Klein's recognition tradition into one pipeline. The R²F claim is the slide-2 pitch-deck claim — the IP moat. Replicating it requires: (a) the academic synthesis (the rare one paper they wrote together), (b) the implementation across 12 pipeline nodes, (c) the validation against 135 cases. Years of work, not a feature ship.",
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
    prompt: 'Name the 3 External Attack Vectors that could derail Decision Intel regardless of execution quality.',
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
    prompt: 'What is the ICP wedge vs ceiling distinction, and why does it matter?',
    canonicalAnswer:
      "WEDGE (next 12 months): Pan-African / EM-focused funds (PE, EM-focused VC, family offices) and Pan-African corporate-development teams. They buy fast (capital-allocation pressure, IC-cycle calendar), are highly susceptible to artifact-led sales (specimen DPRs do the persuasion), and the dual-specimen library + 17-framework regulatory map is uniquely defensible against US-only incumbents. CEILING (12-18 months): Fortune 500 CSOs, audit committees, GCs at regulated entities. R²F + DPR + 17-framework map are designed to clear F500 procurement once the wedge has produced 3+ published reference cases. THE WEDGE GENERATES THE REFERENCES THAT UNLOCK THE CEILING. Don't conflate.",
    difficulty: 'core',
    applicationContext: 'Should you spend Q3 chasing F500 CSOs or Pan-African fund partners?',
    source: 'CLAUDE.md ICP — wedge + ceiling lock 2026-04-26',
    tag: 'strategic',
  },
  {
    id: 'oneliner_avoid_vc_segment',
    deckId: 'founder_oneliners',
    prompt: 'Which PE/VC segment do you EXPLICITLY avoid, and why?',
    canonicalAnswer:
      "Generic US/European VC firms with NO Africa exposure. Why: small AUM-per-decision, relationship-driven without the capital-allocation pressure that makes the audit valuable, sceptical because they have no procurement need for compliance-grade DPRs. The wedge is Pan-African / EM-focused funds with capital-allocation pressure across volatile FX regimes (NGN, KES, GHS, EGP) AND procurement-grade compliance requirements (NDPR, CBN, WAEMU, PoPIA). The 'PE/VC is NOT a target audience' framing applies HERE — to the generic segment, not the EM-fund subset.",
    difficulty: 'advanced',
    applicationContext: 'You get a warm intro to a generic Sand Hill Road VC firm — do you take the meeting?',
    source: 'CLAUDE.md ICP wedge+ceiling',
    tag: 'strategic',
  },
  {
    id: 'oneliner_one_liner_primary',
    deckId: 'founder_oneliners',
    prompt: 'What is the canonical hero one-liner for warm contexts (pitch deck, LinkedIn headline)?',
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
    prompt: 'What is the secondary one-liner for regulatory-tailwind moments (cold outreach, investor narrative)?',
    canonicalAnswer:
      "\"The reasoning layer the Fortune 500 needs before regulators start asking.\" Carries the regulatory tailwind story in one breath. Use it where TENSION beats elegance — cold DMs, VC pitches, LinkedIn replies. NEVER use it as a hero H1. The primary remains 'the native reasoning layer for every high-stakes call.' This secondary is the version that fits the EU AI Act / Aug 2026 / Basel III calendar pressure context.",
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
      "From Founder School lesson es_11 / discovery-call language: \"three things are non-negotiable: (1) workflow mapping in this call, (2) audit-before-meeting requirement (every IC / steering / board meeting has a DI audit attached as part of the prep), (3) outcome-gate enforced at platform level (every audit's outcome must be logged before the next audit fires).\" The data flywheel becomes contractual, not aspirational. Without these, the design partnership is a paid pilot with no compounding value. WITH these, every signed partner accelerates the moat.",
    difficulty: 'advanced',
    applicationContext: 'Closing a design-partner conversation — what are the asks you DON\'T compromise on?',
    source: 'Founder School lesson es_11 + CLAUDE.md Outcome Gate',
    tag: 'strategic',
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
  ...COGNITIVE_BIASES_CARDS,
  ...PIPELINE_NODES_CARDS,
  ...DQI_METHODOLOGY_CARDS,
  ...REGULATORY_FRAMEWORKS_CARDS,
  ...R2F_FRAMEWORK_CARDS,
  ...FOUNDER_ONELINERS_CARDS,
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

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

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


