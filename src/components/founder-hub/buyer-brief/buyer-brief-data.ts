/**
 * Buyer Brief — SSOT for the "know their world like an insider" founder-hub tab.
 *
 * Why this exists: on a first call a pre-revenue founder has no brand trust. The
 * fastest way to earn it is to show you genuinely understand the searcher's
 * world — the SBA mechanics, the QoE, the broken-deal math, the 3 a.m. fear —
 * BEFORE you ever mention the product. This is the field-fluency reference: who
 * they are, the words they use (with plain definitions so you actually know
 * them), the numbers to know cold (tagged by confidence so you never misquote),
 * what "good" looks like to them, their journey, and how to turn all of it into
 * credibility on the call.
 *
 * Sourced from the ETA sales-playbook research pack (Stanford GSB 2024, IBBA Q3
 * 2025, SBA.gov, Yale 2025, Searchfunder / Acquiring Minds voice-of-customer).
 * Confidence tags are load-bearing: [hard] safe in front of buyers · [soft]
 * single-origin, ATTRIBUTE it · the do-not-quote list is honesty discipline.
 */

export const BUYER_ONE_LINER =
  'A smart, lonely, time-poor operator whose single nightmare is signing a personal guarantee on a deal with a flaw they were too close — or too tired — to see. You are the disciplined second mind for the moment the LOI is signed and the clock is running.';

export interface BuyerTrait {
  title: string;
  body: string;
}

export const WHO_THEY_ARE: BuyerTrait[] = [
  {
    title: 'The background',
    body: "Usually ex-consultants (MBB), ex-bankers, or MBAs (HBS / Stanford GSB / Booth). Self-image is built on analytical horsepower — they are 'numbers people' and proud of it.",
  },
  {
    title: 'The tension that matters',
    body: "Confidence in the spreadsheet, deep self-doubt in the chair. First-time-CEO imposter syndrome runs ~70%. They are negotiating with their own money for the first time, and a diligence specialist notes first-timers are 'terrible at saying this isn't accurate or we have to adjust the price.' So: frame the audit as what elite operators DO (an edge), never as remediation for flawed judgment.",
  },
  {
    title: 'The asymmetry they live with',
    body: 'Investors share the upside; the searcher personally guarantees the downside. That asymmetry is the 3 a.m. thought. It is why the audit is leverage they WANT (insurance on a personal guarantee + collateral for the raise), not a bias-check they resent.',
  },
];

export const EMOTIONAL_ARC =
  "They call the journey 'grueling, frustrating, and lonely' — not exciting. Months of demoralizing search → the dopamine of a deal that 'feels right' → the cold sweat of diligence → deciding ALONE → the dread of the deal that dies. Speak to that arc and you sound like someone who has been in the room, not someone selling software.";

/** Their fears, close to their own words — say these back and they feel seen. */
export const FEARS_VERBATIM: string[] = [
  "Overpaying on fake earnings: 'by convincing you of $500k of fake EBITDA they've defrauded you out of $2M.'",
  'Fake recurring revenue / hidden churn dressed up as a stable base.',
  'Off-income-statement capex — deferred maintenance and under-investment propping up the margin.',
  "The career-ending mistake: 'you grind, sweat, cry, just to close it down in a year… that will sit with you for the rest of your life.'",
  'Broken-deal costs — personal cash gone on a deal that dies in diligence.',
];

export interface VocabTerm {
  term: string;
  /** Plain, accurate definition so you actually understand it. */
  def: string;
  /** Optional: how to deploy it on a call to sound fluent. */
  onCall?: string;
}

/** USE these — the insider vocabulary, with definitions so you know what each means. */
export const INSIDER_VOCAB: VocabTerm[] = [
  {
    term: 'CIM / CIP',
    def: "Confidential Information Memorandum — the broker's marketing document for the business being sold. The 'pitch deck' for the company, written to make it look good.",
    onCall:
      "Ask 'how many CIMs are you working through a month?' — instantly signals you know the funnel.",
  },
  {
    term: 'LOI / IOI',
    def: 'Letter of Intent — the (usually non-binding) offer that opens exclusivity and starts the diligence clock. An IOI is the looser, earlier expression of interest before it.',
  },
  {
    term: 'QoE (Quality of Earnings)',
    def: "A financial-diligence report (Big-4 or boutique) that normalizes and verifies the target's reported earnings — checks whether the EBITDA is real. Costs $8–15k for a $1–10M deal.",
    onCall:
      "The framing line: 'you pay $10–15k for a QoE to audit the seller's numbers — who audits your reasoning about them?'",
  },
  {
    term: 'Proof of Cash',
    def: "A diligence procedure that ties reported revenue to actual bank deposits. The searcher's mantra: 'the seller will lie, but banks don't.'",
  },
  {
    term: 'SDE vs EBITDA',
    def: "SDE (Seller's Discretionary Earnings) = EBITDA + the owner's salary and perks, used for smaller owner-operated businesses. EBITDA is used for larger ones. The multiple applies to one or the other depending on deal size.",
  },
  {
    term: 'Add-backs',
    def: 'Adjustments that INCREASE reported earnings to get to "adjusted EBITDA" (owner perks, "one-time" costs, run-rate). Sellers inflate them; the lender rejects aggressive ones and the debt-service math breaks at close.',
  },
  {
    term: 'Personal guarantee (PG)',
    def: 'On an SBA loan, owners of 20%+ sign an UNLIMITED personal guarantee — it cannot be negotiated away. Self-funded buyers hold 50–70%, so they guarantee the whole note; the home is collateral at ≥25% equity.',
    onCall: "Naming the PG specifically is the single sharpest 'I get your stakes' move.",
  },
  {
    term: 'SBA 7(a)',
    def: 'The loan program behind most self-funded acquisitions. Acquisition cap is $5M; min 10% equity injection (≥5% real cash); ~9–11.5% rate on a 10-year term.',
  },
  {
    term: 'Customer concentration',
    def: 'When a large share of revenue sits with a few customers or one cyclical end-market. A top-tier deal-killer — if one account leaves, the business craters.',
  },
  {
    term: 'Set-off against the seller note',
    def: 'If the seller financed part of the price (a seller note), the buyer can deduct damages from reps-&-warranties breaches against the note payments. A key downside protection searchers prize.',
  },
  {
    term: 'NWC peg',
    def: 'Net Working Capital peg — the agreed level of working capital delivered at close; a true-up adjusts the price if actual NWC misses it. A common place sellers quietly claw value back.',
  },
  {
    term: 'Deal-breakers vs unsavory facts',
    def: 'The judgment skill: separating findings that should KILL a deal from the merely-imperfect facts you accept and price in. Knowing the difference is what separates a pro from a panicker.',
  },
  {
    term: 'Deal fever',
    def: 'The escalation-of-commitment bias — as search capital and personal money burn, a searcher rationalizes red flags to avoid killing a deal they have fallen for. Worse AFTER they have spent on QoE.',
  },
  {
    term: 'Broken-deal costs',
    def: 'The diligence + legal spend on a deal that dies (~$15–50k each). For a self-funded searcher it comes out of personal cash — every dead LOI is a direct hit.',
  },
];

/** AVOID these — they mark you as an outsider / a generic SaaS vendor. */
export const AVOID_VOCAB: string[] = [
  '"synergies" · "leverage our platform" · "AI-powered insights" · "digital transformation"',
  '"fix your bias" · "your blind spots" · "audit your judgment" (as correction) · "decision coaching"',
  '"due diligence software" — they pay specialists for JUDGMENT, not a tool that replaces it',
  'Overselling certainty — "never miss a fatal flaw." They know you cannot spot fraud pre-LOI; claiming it marks you as naive.',
];

export interface KnowColdNumber {
  stat: string;
  value: string;
  confidence: 'hard' | 'soft' | 'attribute';
  note?: string;
}

/** The numbers to know cold — tagged so you never quote a wrong one to an analytical buyer. */
export const KNOW_COLD_NUMBERS: KnowColdNumber[] = [
  {
    stat: 'Deal size (self-funded)',
    value: '$1–10M EV (most $2–7M), targeting $500k–$2.5M EBITDA/SDE',
    confidence: 'hard',
  },
  {
    stat: 'Multiples (IBBA Q3 2025)',
    value: '~2.5x SDE at $0.5–1M · 3x at $1–2M · 4x EBITDA at $2–5M · 6.5x at $5M+',
    confidence: 'hard',
  },
  {
    stat: 'SBA 7(a) acquisition cap',
    value: '$5M (NOT $10M — the $10M is a cumulative limit only when stacking a 504 loan)',
    confidence: 'hard',
    note: 'Quote $5M. The $10M misquote is the fastest way to lose a sophisticated searcher.',
  },
  {
    stat: 'LOIs to close',
    value: '3.6 signed LOIs on average before closing one (Stanford 2024)',
    confidence: 'hard',
  },
  {
    stat: 'QoE / broken-deal cost',
    value: 'QoE $8–15k (up to $25–30k messy) · legal $15–50k · reserve ~$50k for broken deals',
    confidence: 'hard',
    note: 'The ~$50k broken-deal reserve is a practitioner rule of thumb — soft.',
  },
  {
    stat: 'Search duration / opp. cost',
    value:
      '53% close ≤12mo, 74% ≤18mo · self-funded pay themselves $0 · ~$300–500k salary forgone over the search',
    confidence: 'hard',
  },
  {
    stat: 'CIM funnel',
    value: '~1,000–3,000 sourced → 50–100 seriously reviewed → ~3.6 LOIs → 1 close',
    confidence: 'soft',
    note: 'The "evaluate 100+ to find one" shape is hard; the precise funnel numbers are soft.',
  },
  {
    stat: 'EBITDA overstatement',
    value:
      '57% of deals had SDE overstated 5%+, 19% by >25% — >25% is the common walk-away threshold',
    confidence: 'attribute',
    note: 'One CPA / diligence firm (225+ engagements). ATTRIBUTE it ("one diligence firm found…"), never present as a study.',
  },
  {
    stat: 'Failure outcomes (Stanford 2024)',
    value:
      '31% of acquired companies produce a loss · ~10.5% go to zero · ~37% of searches never acquire',
    confidence: 'hard',
  },
  {
    stat: 'Realized returns',
    value: 'Lead with Yale 2025 ~2.5x realized — NOT the 4.5x aggregate index',
    confidence: 'hard',
    note: 'Sophisticated buyers know the index overstates it; the 2.5x realized is the credible number.',
  },
];

/** What "good" looks like to them — speak their best practices back. */
export const WHAT_GOOD_LOOKS_LIKE: string[] = [
  'Front-loaded, evidence-based diligence — disciplined enough to WALK AWAY.',
  'A Proof of Cash ("the seller will lie, but banks don\'t").',
  'Knowing deal-breakers from merely-unsavory facts.',
  'Protecting the downside — a seller note subject to set-off, reps & warranties, escrow.',
  'Above all: NOT falling in love with the first deal.',
];

export interface JourneyStage {
  stage: string;
  feels: string;
  diFit: string;
}

/** The journey, stage by stage — what they feel + where you genuinely fit. */
export const JOURNEY_STAGES: JourneyStage[] = [
  {
    stage: 'Sourcing',
    feels: 'Demoralizing grind — hundreds of teasers, most junk.',
    diFit:
      'Low. They are not paying for a tool here; they are hunting. Stay in touch, do not pitch.',
  },
  {
    stage: 'Screening a CIM',
    feels: 'Hopeful but wary — is this the one, or another broker dressing-up?',
    diFit:
      'High. The audit ranks the 3–5 claims to verify FIRST, so they spend diligence cost only on targets that survive.',
  },
  {
    stage: 'LOI signed',
    feels: 'Dopamine + dread — the clock is running and the PG is now real.',
    diFit:
      'Peak. The moment of maximum fear + a live deadline — sell here. The free audit on the live memo.',
  },
  {
    stage: 'Diligence / raise',
    feels: 'Cold sweat — pressure-testing alone, pitching investors who grill the thesis.',
    diFit:
      'High. The boardroom simulation is the IC they do not have; the record makes a first-timer look institutional to a family office.',
  },
  {
    stage: 'Deciding',
    feels: 'The loneliest moment — no one to say "are you sure?"',
    diFit: 'Peak. You are the second set of eyes. Catch the flaw before they sign.',
  },
  {
    stage: 'Operating',
    feels: 'First-time CEO, no board, often no industry experience.',
    diFit:
      'Medium. Hold their calibration record + audit the big reasoning calls (pricing, restructuring, capex) — NEVER an SMB-ops console.',
  },
];

/** Community clichés — drop one correctly and you sound like an insider. */
export const INSIDER_PHRASES: string[] = [
  '"You submit 3 LOIs before you close one."',
  '"A deal dies 3 times before it closes."',
  '"The seller will lie, but banks don\'t." (Proof of Cash)',
  '"Deal-breakers vs unsavory facts."',
  '"Don\'t fall in love with the first deal."',
];

export interface CredibilityMove {
  move: string;
  how: string;
}

/** How to turn the field knowledge into trust ON the call. */
export const CREDIBILITY_MOVES: CredibilityMove[] = [
  {
    move: 'Name their stakes in their words',
    how: 'Reference the unlimited PG on the SBA note reaching their home — not "the risk." Specificity is the proof you live in their world.',
  },
  {
    move: 'Use one insider term correctly',
    how: 'Ask about Proof of Cash, the NWC peg, or set-off against the seller note. One term used right beats ten generic claims.',
  },
  {
    move: 'Quote a number they know is true',
    how: 'The 3.6 LOIs to close, the 37% who never acquire, ~10.5% go to zero (Stanford). They have felt these; naming them says "I have studied your world."',
  },
  {
    move: 'Show you respect the judgment, not replace it',
    how: '"Your judgment is the edge — that is why protecting it matters." Amplify, never audit-as-correction.',
  },
  {
    move: 'Admit the limit — that IS the credibility',
    how: 'Say plainly you cannot spot fraud pre-LOI. Refusing to oversell certainty is what makes a skeptic believe your next, real finding.',
  },
];

/** Honesty discipline — carry into every call. */
export const DO_NOT_QUOTE: string[] = [
  'SBA acquisition cap is $5M, not $10M.',
  'Returns: Yale ~2.5x realized, not the 4.5x index.',
  'The "57% / 19% EBITDA overstated" figure is one diligence firm\'s data — attribute it, never "a study."',
  '"70–90% of M&A fails" is a stakes stat — never claim deals fail BECAUSE of the biases the audit catches (correlation, not proven causation).',
  'Never oversell certainty ("never miss a fatal flaw") — you cannot spot fraud pre-LOI, and saying so is itself the credibility move.',
];
