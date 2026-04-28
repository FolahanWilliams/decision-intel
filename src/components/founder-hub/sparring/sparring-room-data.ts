/**
 * Sparring Room — sales-practice SSOT.
 *
 * The Founder Hub's reading + rehearsal loop. Closing Lab gives you the
 * frameworks. Sparring Room makes you LIVE them: AI generates a buyer
 * scenario + 3 questions, you record your voice via Wispr Flow externally
 * and paste the transcript back, the AI grades you on a 10-dimension
 * sales-DQI rubric grounded in Maalouf, Satyam, and DI's locked vocabulary
 * discipline, plus a buyer-perspective simulation showing what the buyer
 * is actually thinking after your answer.
 *
 * Pattern lifted from Nexus Tracker MindForge (impromptu speaking module),
 * extended for B2B sales conversations against named DI buyer personas.
 *
 * Locked: 2026-04-28. When new persona research, NotebookLM synthesis,
 * or refined grading rubrics arrive, update HERE only — every component
 * in SparringRoomTab pulls from these typed exports.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type BuyerPersonaId =
  | 'mid_market_pe_associate'
  | 'boutique_ma_advisor'
  | 'fractional_cso'
  | 'f500_cso'
  | 'pan_african_fund_partner'
  | 'gc_audit_committee'
  | 'preseed_vc_associate';

export type ScenarioMode =
  | 'cold_first_meeting'
  | 'skeptical_followup'
  | 'hot_inbound'
  | 'procurement_evaluation'
  | 'objection_handler'
  | 'live_demo_walkthrough';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface BuyerPersona {
  id: BuyerPersonaId;
  label: string;
  archetype: string;
  /** Title + company shape for the role-play introduction. */
  rolePlayIntro: string;
  /** What they care about above all else — the meta-objective. */
  primaryConcern: string;
  /** Verbal style: how they talk, what tone they use. */
  verbalStyle: string;
  /** Their default skepticism level. */
  defaultSkepticism: 'low' | 'medium' | 'high' | 'very_high';
  /** Vocabulary they use natively (for AI to match in question generation). */
  nativeVocabulary: string[];
  /** Vocabulary that will trigger their internal eye-roll if you use it. */
  triggerWords: string[];
  /** Top 3 silent objections they bring to a first call. */
  topSilentObjections: string[];
  /** Their ticket-size mental model — what they typically pay for. */
  ticketBand: string;
  /** Whether they're a "fastest converter" (close in 30-day window) or "trap" (12-18 month). */
  conversionSpeed: 'fast' | 'medium' | 'slow';
  /** Accent color for UI. */
  color: string;
}

export interface ScenarioContext {
  id: ScenarioMode;
  label: string;
  description: string;
  /** What the founder is trying to accomplish in this scenario. */
  founderObjective: string;
  /** What the buyer is most likely doing during this. */
  buyerStateOfMind: string;
  /** The conversation phase this represents (cold → procurement). */
  funnelStage: 'awareness' | 'consideration' | 'evaluation' | 'closing';
  /** Recommended difficulty for this scenario type. */
  recommendedDifficulty: DifficultyLevel;
  iconName: string;
}

export interface GradingDimension {
  /** Stable key used in API responses + UI grouping. */
  id: GradingDimensionId;
  label: string;
  /** Which framework this dimension comes from. */
  source: 'maalouf' | 'satyam' | 'di_discipline' | 'fundamentals';
  /** What a 5/5 looks like in 1 sentence. */
  excellentLooks: string;
  /** What a 1/5 looks like in 1 sentence. */
  poorLooks: string;
  /** Weight in the composite Sales DQI (0-1, sum to 1.0). */
  weight: number;
}

export type GradingDimensionId =
  // Maalouf 4
  | 'pressure_without_pressure'
  | 'authority_not_trust'
  | 'pinpoint_pain'
  | 'embody_bigger'
  // Satyam 3
  | 'category_of_one'
  | 'conviction_transmission'
  | 'sales_infra_quality'
  // DI discipline 2
  | 'vocabulary_discipline'
  | 'empathic_mode_first'
  // Fundamentals 1
  | 'specificity_over_vagueness';

export interface SparringSessionResult {
  /** Composite 0-100 sales DQI. */
  salesDqi: number;
  /** Letter grade. A: 85+ / B: 70+ / C: 55+ / D: 40+ / F: <40. */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Per-dimension scores 0-5. */
  dimensions: Record<GradingDimensionId, number>;
  /** 2-3 sentence headline feedback. */
  feedback: string;
  /** 2 specific framework-grounded strengths. */
  strengths: Array<{ point: string; framework: string }>;
  /** 3 specific framework-grounded improvements. */
  improvements: Array<{ point: string; framework: string; exactPhrase: string }>;
  /** Buyer-perspective simulation — what the buyer is thinking. */
  buyerThought: string;
  /** Filler-word count (um, uh, like, you know, basically, literally, actually, so, right, I mean). */
  fillerCount: number;
  fillerWords: string[];
  /** Estimated word count and sentence count. */
  wordCount: number;
  sentenceCount: number;
  /** Detected DI-banned vocabulary uses (decision intelligence platform / decision hygiene / boardroom strategic decision / etc.) */
  bannedVocabularyHits: string[];
  /** Detected DI-locked vocabulary uses (reasoning layer / R²F / DPR / etc.) — only counts as positive in WARM contexts. */
  lockedVocabularyHits: string[];
}

// ─── Buyer Personas ────────────────────────────────────────────────

export const BUYER_PERSONAS: BuyerPersona[] = [
  {
    id: 'mid_market_pe_associate',
    label: 'Mid-market PE associate',
    archetype: 'Adaeze',
    rolePlayIntro:
      'Vice President at a $400M-AUM mid-market PE fund, 4 years deep into deal cycle. Just closed her first lead deal six months ago. Has discretionary $5-50K corporate-card authority for tools that make her IC memos sharper.',
    primaryConcern:
      'Will this make my next IC memo defensible enough that the partners stop questioning my judgement on diligence depth?',
    verbalStyle:
      'Crisp, direct, references specific deals casually ("the Lagos consumer rollup we looked at last quarter…"), interrupts to ask sharp clarifying questions, uses "thesis" and "memo" naturally.',
    defaultSkepticism: 'medium',
    nativeVocabulary: ['IC memo', 'thesis', 'diligence', 'returns', 'thesis violation', 'concentration', 'cycle', 'vintage'],
    triggerWords: [
      'AI-powered',
      'revolutionary',
      'next-generation',
      'leveraging AI',
      'decision intelligence platform',
      '12-node pipeline',
      'LangGraph',
    ],
    topSilentObjections: [
      'I have ChatGPT and a notion of how this should work — why pay you?',
      'My partner will laugh if I tell him a 16-year-old is auditing our memos.',
      'Is this just another vendor I will burn three weeks evaluating before passing?',
    ],
    ticketBand: '$249-499/mo Individual or $2,499/mo Strategy if she can sell internally',
    conversionSpeed: 'fast',
    color: '#16A34A',
  },
  {
    id: 'boutique_ma_advisor',
    label: 'Boutique sell-side M&A advisor',
    archetype: 'Potomac',
    rolePlayIntro:
      'Managing Director at a 12-person boutique sell-side M&A firm, 18-year career, ex-Goldman associate. Their deals close in 6-9 months and the CIM quality determines the buyer pool — every blind spot in the model becomes a price haircut at term sheet.',
    primaryConcern:
      'Can I get my associate to spot the bias gap in a CIM before our client sees the buyer questions and we lose 5% of EV on the term sheet?',
    verbalStyle:
      'Slow, measured, formal but warm. Asks "walk me through" questions. Patient on the call but their patience is a test — they will close the conversation politely if you waste 5 minutes.',
    defaultSkepticism: 'medium',
    nativeVocabulary: ['CIM', 'EV', 'multiple', 'comp', 'buyer pool', 'EBITDA bridge', 'normalisation', 'walkaway', 'process letter'],
    triggerWords: [
      'AI-powered',
      'reasoning layer',
      'R²F',
      'DPR',
      '12-node pipeline',
      'next-generation governance',
      'category-defining',
    ],
    topSilentObjections: [
      'My associates already do this in Excel. What am I actually saving?',
      'Is this just dressed-up checklist software?',
      'My buyer will ask if you store our data — what is your answer in one sentence?',
    ],
    ticketBand: '$2,499-4,999/mo Strategy tier across 3-5 partners',
    conversionSpeed: 'fast',
    color: '#0EA5E9',
  },
  {
    id: 'fractional_cso',
    label: 'Solo fractional CSO',
    archetype: 'Marcus',
    rolePlayIntro:
      'Independent fractional Chief Strategy Officer working with 4 mid-market CEO clients simultaneously. Ex-MBB (Bain or McKinsey, 7 years). Charges $30-60K/quarter per client for board-prep and strategic-memo work.',
    primaryConcern:
      'My credibility is my product. If a client questions one of my recommendations, can I show them I stress-tested it with something more rigorous than my own brain?',
    verbalStyle:
      'High-bandwidth, fast-talking, drops MBB framings ("the 2x2 here is…"), confident. Uses "obviously" and "clearly" too often when actually unsure.',
    defaultSkepticism: 'medium',
    nativeVocabulary: ['MECE', '2x2', 'thesis', 'recommendation', 'so-what', 'frame', 'pyramid principle', 'sanity check'],
    triggerWords: [
      'consultant',
      'consulting tool',
      'systematic decision-making',
      'rubber-stamp',
      'commodity',
    ],
    topSilentObjections: [
      'Will my clients see this as me cheating with AI?',
      'How is this different from Asking Claude to critique my deck?',
      'Will the brand association make me look less senior?',
    ],
    ticketBand: '$249/mo Individual, scaling to one Strategy seat across 3 clients',
    conversionSpeed: 'fast',
    color: '#8B5CF6',
  },
  {
    id: 'f500_cso',
    label: 'Fortune 500 Chief Strategy Officer',
    archetype: 'Margaret',
    rolePlayIntro:
      'Chief Strategy Officer at a $30B Fortune 500 industrial company, 12 years tenure, reports directly to the CEO. Strategy team of 14. Every memo she ships has board exposure. SOC 2, EU AI Act, and procurement vendor-risk register are baseline.',
    primaryConcern:
      'Will my GC and my CISO let me pilot this without a 6-month vendor-risk review? And will the board see this as a real audit layer or as me hiding behind AI?',
    verbalStyle:
      'Calm, deliberate, uses long pauses, asks one question at a time and waits. Vocabulary is precise — "audit committee" not "board", "recommendation" not "memo", never says "thesis" outside PE context.',
    defaultSkepticism: 'high',
    nativeVocabulary: [
      'audit committee',
      'recommendation',
      'steering committee',
      'risk register',
      'GC',
      'CFO',
      'CISO',
      'enterprise standards',
      'procurement bar',
    ],
    triggerWords: [
      'AI-powered',
      'leveraging AI',
      'pre-seed',
      'startup',
      'we just launched',
      'we are a young company',
      'pilot phase',
      'design partner',
      'building',
    ],
    topSilentObjections: [
      'You are 16. I cannot put your name in front of my CEO.',
      'You have no SOC 2 attestation, just infrastructure inheritance from Vercel.',
      'How long will you be in business — what happens to my data when you exit or fold?',
    ],
    ticketBand: '$50-150K/yr Enterprise after 3+ pilot references',
    conversionSpeed: 'slow',
    color: '#EAB308',
  },
  {
    id: 'pan_african_fund_partner',
    label: 'Pan-African fund partner',
    archetype: 'Titi',
    rolePlayIntro:
      'Partner at a $600M Pan-African PE fund based in Lagos, deploys across Nigeria / Kenya / Ghana / South Africa. 9-year track record. Reports to LPs in London, Singapore, and Abu Dhabi. Strict NDPR + CBN + WAEMU compliance posture.',
    primaryConcern:
      'When my LP committee in Singapore asks "how did you decide on the Nairobi fintech bet over the Lagos consumer brand," I need a defensible artefact. Does this give me one that holds up under NDPR + CBN scrutiny?',
    verbalStyle:
      'Warm but business-first. Switches between English and Pidgin/Yoruba reference points casually. Asks ABOUT family before asking about product. Will close the conversation in two minutes if you waste her time after the warm-up.',
    defaultSkepticism: 'medium',
    nativeVocabulary: [
      'NDPR',
      'CBN',
      'WAEMU',
      'PoPIA',
      'CMA Kenya',
      'LP letter',
      'IC memo',
      'EM',
      'sovereign cycle',
      'naira',
      'cedi',
    ],
    triggerWords: [
      'developing markets',
      'frontier',
      'underbanked',
      'we will localise later',
      'African market opportunity',
      'leapfrog',
    ],
    topSilentObjections: [
      'You said you cover Pan-African regulators — but does the audit actually map to ISA 2007 or just NDPR?',
      'My LP will ask about data residency — Vercel + Supabase US is not enough.',
      'I do not want to be a reference for a US-shaped product that pivots to F500 the moment the wedge closes.',
    ],
    ticketBand: '$5K-25K/yr design partner, scaling to $50K+ as fund grows',
    conversionSpeed: 'medium',
    color: '#DC2626',
  },
  {
    id: 'gc_audit_committee',
    label: 'GC at regulated entity',
    archetype: 'James',
    rolePlayIntro:
      'General Counsel at a $5B regulated financial-services company. Reports to the audit committee chair. Career-long focus on regulatory exposure, not business growth. Every new vendor gets a 90-day vendor-risk review.',
    primaryConcern:
      'EU AI Act Article 14 enforcement is August 2026. I need a defensible record of human oversight on every decision-support output. Does this produce one — and will my regulator recognise the format?',
    verbalStyle:
      'Sharp, formal, asks for written follow-up to every verbal claim. Uses regulator vocabulary natively. Notices every overclaim instantly.',
    defaultSkepticism: 'very_high',
    nativeVocabulary: [
      'EU AI Act',
      'Article 14',
      'Article 15',
      'Annex III',
      'Basel III Pillar 2',
      'ICAAP',
      'SOC 2 Type II',
      'GDPR Art 22',
      'data subject rights',
      'sub-processor',
    ],
    triggerWords: [
      'compliant',
      'certified',
      'fully compliant',
      'guarantees',
      'eliminates risk',
      'we are SOC 2 certified',
    ],
    topSilentObjections: [
      'You are claiming SOC 2 Type II infrastructure but you have no audit attestation of your own.',
      'AI Verify alignment is self-assessment. Your marketing says "aligned" — but a regulator hears "claims to be."',
      'Your DPR says hashed and tamper-evident — what happens when private-key signing actually ships?',
    ],
    ticketBand: 'Veto holder on F500 Margaret-class deals; not a buyer himself',
    conversionSpeed: 'slow',
    color: '#475569',
  },
  {
    id: 'preseed_vc_associate',
    label: 'Pre-seed VC associate',
    archetype: 'Riya',
    rolePlayIntro:
      'Associate at a $100M pre-seed/seed B2B SaaS fund. 2 years in, sourcing for the partner. Sees 50 founders/month. Decision authority is "should we put this in the partner meeting" — partner makes the actual call.',
    primaryConcern:
      'Is this venture-scale? And do I look smart bringing this to my partner — does it survive the 60-second elevator question without me having to defend it?',
    verbalStyle:
      'Polite but pattern-matching mode the entire call. Asks 3 questions in a row. Will give vague feedback and ghost if not interested.',
    defaultSkepticism: 'medium',
    nativeVocabulary: ['ARR', 'GTM', 'wedge', 'TAM', 'NDR', 'CAC', 'magic number', 'product-market fit', 'ICP'],
    triggerWords: [
      'lifestyle',
      'consulting',
      'small market',
      'feature not product',
      'Cloverpop is similar',
      'AI wrapper',
    ],
    topSilentObjections: [
      'Is this a wrapper that gets eaten by GPT-5 with vision in 6 months?',
      'Why is the founder 16 and where is the co-founder?',
      'TAM is too narrow if it is just F500 strategy teams.',
    ],
    ticketBand: 'Not a buyer — an investor pathway',
    conversionSpeed: 'medium',
    color: '#A78BFA',
  },
];

// ─── Scenario Modes ────────────────────────────────────────────────

export const SCENARIO_MODES: ScenarioContext[] = [
  {
    id: 'cold_first_meeting',
    label: 'Cold first meeting',
    description:
      "You've just been introduced. The buyer is curious but skeptical. They've read one line about you. Now they want to hear it in your voice.",
    founderObjective:
      'Land the descriptive plain-language hook (no platform vocabulary), make the buyer lean forward, earn the second meeting.',
    buyerStateOfMind:
      "Pattern-matching against 50 other tools. Will close conversation in 5 min if framing is generic. Looking for the one phrase that surprises them.",
    funnelStage: 'awareness',
    recommendedDifficulty: 'beginner',
    iconName: 'Target',
  },
  {
    id: 'skeptical_followup',
    label: 'Skeptical follow-up',
    description:
      'Second meeting. They heard the first pitch. They have specific objections. Now they are testing whether you fold or sharpen.',
    founderObjective:
      'Handle the silent objection BEFORE they verbalise it. Show conviction without defensiveness. Close on the next concrete step.',
    buyerStateOfMind:
      'They are testing. They want to see if your story changes when pushed. They are ready to disqualify you on flinch.',
    funnelStage: 'consideration',
    recommendedDifficulty: 'intermediate',
    iconName: 'Shield',
  },
  {
    id: 'hot_inbound',
    label: 'Hot inbound',
    description:
      'They reached out. They saw a LinkedIn post or got a warm intro. They want depth — what does this actually do, in concrete terms?',
    founderObjective:
      'Match their energy. Lead with the artefact (specimen DPR), not the product tour. Convert the inbound to a discovery call within 7 minutes.',
    buyerStateOfMind:
      'Already half-sold. Looking for a reason to stay sold. Will be disappointed if you tour a product instead of running the audit live.',
    funnelStage: 'consideration',
    recommendedDifficulty: 'beginner',
    iconName: 'Zap',
  },
  {
    id: 'procurement_evaluation',
    label: 'Procurement evaluation',
    description:
      "Third or fourth meeting. The GC + CISO + procurement lead are on the call. Every claim has to survive their notes. They are not the champion — the CSO is. But they are the veto holder.",
    founderObjective:
      'Survive the questionnaire. Honest disclosure on SOC 2 / data residency / DPA. Show that you welcome the audit instead of dodging it. Hand the champion ammunition.',
    buyerStateOfMind:
      'Their job is to find a reason to say no. Vague answers are reasons. Specific answers with documentation links are not.',
    funnelStage: 'evaluation',
    recommendedDifficulty: 'advanced',
    iconName: 'Lock',
  },
  {
    id: 'objection_handler',
    label: 'Live objection handling',
    description:
      'They just raised one of the 5 silent objections. You have 30 seconds to answer it without making it bigger.',
    founderObjective:
      'Answer literally what they asked. Then redirect to the conversation that should follow. Never say "great question."',
    buyerStateOfMind:
      'They are watching whether you spin or answer. Spinning loses the deal in this turn.',
    funnelStage: 'evaluation',
    recommendedDifficulty: 'advanced',
    iconName: 'Brain',
  },
  {
    id: 'live_demo_walkthrough',
    label: 'Live demo / specimen audit',
    description:
      'They have asked to see it work. You are running a 7-minute live audit on a specimen (WeWork S-1 or Dangote 2014 expansion plan).',
    founderObjective:
      "Narrate the artefact. Don't tour the UI — tour what the buyer sees. End with the procurement-grade artefact (specimen DPR) sitting on their screen.",
    buyerStateOfMind:
      "Watching for whether the artefact actually does what your verbal pitch claimed. Skepticism resolves or hardens here.",
    funnelStage: 'evaluation',
    recommendedDifficulty: 'intermediate',
    iconName: 'Presentation',
  },
];

// ─── Grading Rubric ───────────────────────────────────────────────

export const GRADING_DIMENSIONS: GradingDimension[] = [
  // ── Maalouf 4 ──
  {
    id: 'pressure_without_pressure',
    label: 'Pressure without pressure',
    source: 'maalouf',
    excellentLooks:
      "Buyer feels the urgency to move but cannot point to anywhere you pushed them. Naturally references other conversations or scarcity (5 design-partner seats, 4 left).",
    poorLooks:
      "Either flat (no urgency at all) or visibly pushy ('limited time', 'last chance'). Both fail.",
    weight: 0.10,
  },
  {
    id: 'authority_not_trust',
    label: 'Authority, not trust',
    source: 'maalouf',
    excellentLooks:
      "Speaks AS the category creator, not someone hoping to be trusted. References work as fact, not as a request for buy-in. No 'I believe' or 'I think' on the load-bearing claims.",
    poorLooks:
      "Hedging language. 'I think we can help.' 'Hopefully this is useful.' Reads as asking for permission to be the expert.",
    weight: 0.10,
  },
  {
    id: 'pinpoint_pain',
    label: 'Pinpoint pain',
    source: 'maalouf',
    excellentLooks:
      "Names the SPECIFIC pain in the buyer's vocabulary, not generic strategy-team pain. Buyer should think 'wait, how did they know that.'",
    poorLooks:
      "Generic pain ('strategic decisions are hard'). The buyer hears it and disengages — they came in with a SPECIFIC pain and you missed it.",
    weight: 0.10,
  },
  {
    id: 'embody_bigger',
    label: 'Embody bigger and better',
    source: 'maalouf',
    excellentLooks:
      "Speaks from a category-creator position. Uses pause and pacing as power. Talks about other conversations naturally. Reads as someone the buyer should chase, not someone chasing the buyer.",
    poorLooks:
      "Eager. Over-explains. Rushes. 'Oh and another thing we can do is…' — every additional capability dilutes authority.",
    weight: 0.10,
  },

  // ── Satyam 3 ──
  {
    id: 'category_of_one',
    label: 'Category of one',
    source: 'satyam',
    excellentLooks:
      "Frames DI as not-comparable. Names what the existing category does AND fails to do. Makes Cloverpop / IBM watsonx / Aera feel like a different problem.",
    poorLooks:
      "Compares directly. 'We are like Cloverpop but better' is the worst-case framing — invites the buyer to cost-compare.",
    weight: 0.10,
  },
  {
    id: 'conviction_transmission',
    label: 'Conviction transmission',
    source: 'satyam',
    excellentLooks:
      "The voice carries belief. The buyer feels that you've seen this work before. No softening on the load-bearing claims. Anchored in something specific (a case study, a referenced mechanism, a regulator citation).",
    poorLooks:
      "Tentative on the core claim. Softens when challenged. 'Maybe' / 'we think' / 'possibly' on the highest-stakes lines.",
    weight: 0.12,
  },
  {
    id: 'sales_infra_quality',
    label: 'Sales infrastructure quality',
    source: 'satyam',
    excellentLooks:
      "The conversation has structure: discovery → diagnosis → mechanism → proof → ask. Each step lands cleanly. No skipping discovery to pitch features.",
    poorLooks:
      "Pitch first, discover later. Or rambling — the buyer cannot tell what step you're on. Or no specific ask at the end ('we should talk again sometime').",
    weight: 0.08,
  },

  // ── DI discipline 2 ──
  {
    id: 'vocabulary_discipline',
    label: 'Vocabulary discipline',
    source: 'di_discipline',
    excellentLooks:
      "Uses the right vocab for reader temperature. Cold context → descriptive plain-language hooks (60-second audit, pre-IC bias detection). Warm context → locked vocabulary (reasoning layer, R²F, DPR). NEVER uses banned phrases (decision intelligence platform, decision hygiene, boardroom strategic decision).",
    poorLooks:
      "Drops 'reasoning layer' or 'R²F' on a cold buyer who has no context. Or uses 'decision intelligence platform' (Gartner-crowded). Or 'decision hygiene' (Kahneman's term — borrowing it cedes our category vocabulary).",
    weight: 0.08,
  },
  {
    id: 'empathic_mode_first',
    label: 'Empathic-mode-first framing',
    source: 'di_discipline',
    excellentLooks:
      "Leads with what the BUYER is trying to do, not what DI does. Lands the buyer's pain in the buyer's words BEFORE introducing the product. Buyer feels seen.",
    poorLooks:
      "Product-first framing. 'We have a 12-node pipeline.' 'Our DPR is hashed and tamper-evident.' Buyer hears: 'they don't see me yet, they want to talk about themselves.'",
    weight: 0.10,
  },

  // ── Fundamentals 1 ──
  {
    id: 'specificity_over_vagueness',
    label: 'Specificity over vagueness',
    source: 'fundamentals',
    excellentLooks:
      "Concrete examples land in every paragraph. Names a specific case (WeWork S-1, Dangote 2014, McKinsey 8% statistic), a specific bias (overconfidence, narrative fallacy), a specific regulation (EU AI Act Article 14, NDPR). The buyer can repeat the line back to a colleague.",
    poorLooks:
      "Vague throughout. 'Better outcomes.' 'Strategic clarity.' 'Improved decision-making.' The buyer cannot repeat anything specific to a colleague.",
    weight: 0.12,
  },
];

// Sanity check — weights should sum to 1.0 (within float epsilon).
// Disabled at runtime because it'd panic the build if this file is imported
// during a refactor. Verify by hand when editing weights.

// ─── Filler Word Detection ────────────────────────────────────────

/** Patterns to detect filler words. Whole-word matching, case-insensitive. */
export const FILLER_WORD_PATTERNS = [
  'um',
  'uh',
  'like',
  'you know',
  'basically',
  'literally',
  'actually',
  'so',
  'right',
  'I mean',
  'kind of',
  'sort of',
];

// ─── DI Vocabulary Lists ──────────────────────────────────────────

/** Banned vocabulary — any of these in the transcript flags a vocabulary_discipline penalty. */
export const DI_BANNED_VOCABULARY = [
  'decision intelligence platform',
  'decision hygiene',
  'boardroom strategic decision',
  'AI-powered',
  'next-generation',
  'revolutionary',
  'leveraging AI',
  'game-changer',
  'pre-seed',
  'we just launched',
  'we are a young company',
  'pilot phase',
  'early days',
];

/** Locked DI vocabulary — counts as positive in WARM contexts only. */
export const DI_LOCKED_VOCABULARY = [
  'reasoning layer',
  'native reasoning layer',
  'recognition-rigor framework',
  'r²f',
  'r2f',
  'decision provenance record',
  'dpr',
  'decision quality index',
  'dqi',
  'decision knowledge graph',
  'decision archaeology',
  'four-tool graveyard',
];

// ─── Scenario Templates (Persona × Mode) ──────────────────────────

export interface ScenarioTemplate {
  /** Persona doing the asking. */
  personaId: BuyerPersonaId;
  /** Conversation mode. */
  mode: ScenarioMode;
  /** What the AI should know about this specific persona×mode combination
   * when generating the 3 questions. Mostly nuance about what kinds of
   * questions are realistic at this funnel stage with this persona.
   */
  generatorHint: string;
}

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  // Cold first meeting per persona
  {
    personaId: 'mid_market_pe_associate',
    mode: 'cold_first_meeting',
    generatorHint:
      'Adaeze just got the warm intro. She has 20 minutes between Zoom calls. She wants to know in plain language what this does, what makes it different from her existing process, and whether her partners will laugh at her if she pilots it.',
  },
  {
    personaId: 'f500_cso',
    mode: 'cold_first_meeting',
    generatorHint:
      'Margaret has been told this could help her strategy team. She is curious but cautious. She will probe whether you understand F500-shape pain (audit committee, GC, CISO, vendor-risk register) before she invests another minute.',
  },
  {
    personaId: 'pan_african_fund_partner',
    mode: 'cold_first_meeting',
    generatorHint:
      'Titi got the intro from a mutual contact. She does the warm-up first (family, where you grew up). Then she pivots to: how does this work in MY world (NDPR, CBN, naira FX, LP committee in Singapore). She is testing whether you actually understand Pan-African ops or if you have just slapped "African market" into your deck.',
  },
  {
    personaId: 'boutique_ma_advisor',
    mode: 'cold_first_meeting',
    generatorHint:
      "Potomac has seen 100 vendors. He is patient on the call but his patience is a test. He wants to know what this actually does in 60 seconds and whether his associate could use it without him babysitting it.",
  },
  {
    personaId: 'fractional_cso',
    mode: 'cold_first_meeting',
    generatorHint:
      'Marcus is high-bandwidth and confident. He will drop MBB framings to test whether you can keep up. He is worried this makes him look less senior — so he will probe how you frame the consultant×AI angle.',
  },
  {
    personaId: 'preseed_vc_associate',
    mode: 'cold_first_meeting',
    generatorHint:
      "Riya is in pattern-match mode. She wants to know wedge / GTM / TAM / why-now / why-you in the first 5 minutes. She'll ghost you if any of those answers are vague.",
  },

  // Skeptical follow-up per persona
  {
    personaId: 'mid_market_pe_associate',
    mode: 'skeptical_followup',
    generatorHint:
      'Adaeze brought it to her partner. The partner pushed back: ChatGPT can do this, why pay you, the founder is 16. She wants ammunition for the next partner conversation — sharper than what you said in the first meeting.',
  },
  {
    personaId: 'f500_cso',
    mode: 'skeptical_followup',
    generatorHint:
      'Margaret discussed this with her CISO. The CISO raised SOC 2 (do you have your own attestation, not infrastructure inheritance), data residency, and vendor risk. Margaret wants to know if you can answer those questions cleanly before she puts another meeting on her calendar.',
  },
  {
    personaId: 'pan_african_fund_partner',
    mode: 'skeptical_followup',
    generatorHint:
      'Titi shared the first call notes with her IC partner. The partner asked: ISA 2007? Or just NDPR? And what about ISA Nigeria current code? She is testing whether your "Pan-African regulatory" claim is depth or marketing surface.',
  },
  {
    personaId: 'gc_audit_committee',
    mode: 'skeptical_followup',
    generatorHint:
      "James is now reviewing everything. He found 'SOC 2 Type II infrastructure' on your site and pulled the AI Verify Foundation FAQ that says self-assessment is not certification. He is testing whether you over-claim under questioning.",
  },

  // Hot inbound per persona
  {
    personaId: 'fractional_cso',
    mode: 'hot_inbound',
    generatorHint:
      'Marcus saw a LinkedIn post about R²F. He DMd: "I want to see this run on a specimen — pick one." He is in buying mode but will close the conversation if you tour the product instead of running the audit live.',
  },
  {
    personaId: 'mid_market_pe_associate',
    mode: 'hot_inbound',
    generatorHint:
      'Adaeze asked for a 7-minute live audit on the WeWork S-1 PDF you sent. She wants to see DI in action on something she recognises before talking pricing.',
  },

  // Procurement evaluation per persona
  {
    personaId: 'f500_cso',
    mode: 'procurement_evaluation',
    generatorHint:
      'Margaret has GC + CISO + procurement on this call. They have your sample DPR and your security page open. They are firing questions about data lifecycle, sub-processors, encryption key rotation, EU AI Act mapping, and disaster recovery RPO/RTO.',
  },
  {
    personaId: 'gc_audit_committee',
    mode: 'procurement_evaluation',
    generatorHint:
      'James is leading the procurement call. He is firing 60-second questions in sequence with no warm-up. Every honest answer earns him another question. Every dodge is logged. He has read your privacy page and has follow-ups on Art 13 disclosures.',
  },

  // Objection handler per persona
  {
    personaId: 'mid_market_pe_associate',
    mode: 'objection_handler',
    generatorHint:
      'Adaeze just said: "Honestly, I have ChatGPT. Why pay you?" You have 30 seconds. Don\'t panic, don\'t spin, don\'t say "great question."',
  },
  {
    personaId: 'pan_african_fund_partner',
    mode: 'objection_handler',
    generatorHint:
      'Titi just said: "I worry you\'ll close 5 wedge cases and pivot to F500 next year. Where does that leave my fund?" You have 30 seconds.',
  },
  {
    personaId: 'f500_cso',
    mode: 'objection_handler',
    generatorHint:
      'Margaret just said: "I cannot put a 16-year-old\'s name in front of my CEO." You have 30 seconds.',
  },
  {
    personaId: 'gc_audit_committee',
    mode: 'objection_handler',
    generatorHint:
      'James just said: "Your DPR says \'tamper-evident\' but your roadmap admits private-key signing isn\'t shipped. That\'s an overclaim — explain." You have 30 seconds.',
  },

  // Live demo walkthrough per persona
  {
    personaId: 'boutique_ma_advisor',
    mode: 'live_demo_walkthrough',
    generatorHint:
      "Potomac is screen-sharing your demo. You're running a 7-minute audit on the WeWork S-1. He is silent — watching for whether the artefact actually does what your pitch claimed.",
  },
  {
    personaId: 'pan_african_fund_partner',
    mode: 'live_demo_walkthrough',
    generatorHint:
      "Titi wants the Dangote 2014 expansion plan walkthrough. She knows the deal — she'll catch any factual error instantly. Tour the artefact, not the UI.",
  },
];

// ─── Mock fallbacks for when GOOGLE_API_KEY is missing ───────────

/** Mock question set — used when API key is missing. Keeps the UI testable
 * without burning Gemini budget during local dev / CI. */
export const MOCK_QUESTIONS: Record<string, { questions: string[]; openerLine: string }> = {
  default: {
    openerLine:
      "(buyer leans back, taps pen) — 'Look, I've heard pitches like this before. Walk me through it.'",
    questions: [
      'In your own words, what does this actually do for me — not for "strategy teams" generally, for ME?',
      'How is this different from what I already do with my analyst and ChatGPT?',
      'What would I need to see in the first 30 days to decide this is worth keeping?',
    ],
  },
  cold_first_meeting: {
    openerLine: "'Got 15 minutes. What is this?'",
    questions: [
      'What is this in plain language — no jargon, no acronyms?',
      'Who is it actually for — be specific?',
      'Why now — why is this conversation worth having today versus next quarter?',
    ],
  },
  objection_handler: {
    openerLine: "'Honestly, I'm skeptical. Convince me.'",
    questions: [
      'Why should I believe you over the three other vendors I have already met this month?',
      'What specifically does this do that ChatGPT cannot?',
      'What is the biggest reason this might NOT work for someone in my role?',
    ],
  },
};

// ─── Helpers ───────────────────────────────────────────────────────

export function findPersonaById(id: BuyerPersonaId): BuyerPersona | undefined {
  return BUYER_PERSONAS.find(p => p.id === id);
}

export function findScenarioById(id: ScenarioMode): ScenarioContext | undefined {
  return SCENARIO_MODES.find(s => s.id === id);
}

export function findScenarioTemplate(
  personaId: BuyerPersonaId,
  mode: ScenarioMode
): ScenarioTemplate | undefined {
  return SCENARIO_TEMPLATES.find(t => t.personaId === personaId && t.mode === mode);
}

export function gradeFromDqi(salesDqi: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (salesDqi >= 85) return 'A';
  if (salesDqi >= 70) return 'B';
  if (salesDqi >= 55) return 'C';
  if (salesDqi >= 40) return 'D';
  return 'F';
}

/** Compute composite Sales DQI from per-dimension scores 0-5. */
export function computeSalesDqi(
  dimensions: Record<GradingDimensionId, number>
): number {
  let total = 0;
  for (const dim of GRADING_DIMENSIONS) {
    const raw = dimensions[dim.id] ?? 0;
    const normalized = (raw / 5) * 100;
    total += normalized * dim.weight;
  }
  return Math.round(total);
}
