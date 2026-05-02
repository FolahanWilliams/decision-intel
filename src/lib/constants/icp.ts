/**
 * Canonical positioning + ICP constants for Decision Intel.
 *
 * Single source of truth for the locked-vocabulary strings that appear on
 * multiple surfaces: founder-hub chat coaching (founder-context.ts), the
 * Founder Hub Current Positioning Anchor card (StartHereTab.tsx), pricing /
 * about copy that references the wedge, and any future strategic surface
 * that needs to reproduce the locked vocabulary.
 *
 * RULE — when CLAUDE.md "Positioning & Vocabulary" or "ICP — wedge + ceiling"
 * locks change, edit HERE only. Every consumer reads the constants by import,
 * so the chat-coaching prompt + the founder-facing reference card + every
 * downstream surface stay in lockstep automatically.
 *
 * Locked: 2026-04-30 (GTM Plan v3.2). Supersedes the 2026-04-28 Pan-African
 * fund-wedge lock — funds are no longer the GTM wedge; Pan-African coverage is
 * preserved as the cross-border M&A differentiator (moat layer for the F500
 * ceiling buyer). The new wedge is individual UK + US buyers @ £249/mo;
 * Sankore is the design-partner bridge; F500 corp strategy / corp dev M&A is
 * the ceiling.
 */

export const POSITIONING_HERO_PRIMARY = 'The native reasoning layer for every high-stakes call.';

export const POSITIONING_HERO_SECONDARY =
  'The reasoning layer the Fortune 500 needs before regulators start asking.';

export const IP_MOAT_NAME = 'Recognition-Rigor Framework (R²F)';

export const IP_MOAT_DESCRIPTION =
  "Kahneman's debiasing + Klein's Recognition-Primed Decisions, arbitrated in one pipeline.";

export const SPECIMEN_LIBRARY_DESCRIPTION =
  'WeWork S-1 (US/global) + Dangote 2014 Pan-African expansion (Africa / EM). Two production DPRs in public/.';

export const COMPLIANCE_MOAT_REGIONS = 'G7 / EU / GCC / African markets';

export const ICP_AUDIENCE_SUMMARY =
  'Individual CSOs + M&A heads + corp dev directors (UK + US wedge) → Sankore design partner bridge (London summer 2026) → F500 corporate strategy + corp dev M&A teams (ceiling, 12-24+ months).';

/**
 * Decision system of record · positioning extension (locked v3.2).
 *
 * Decision Intel is the system of record for DECISIONS specifically — not
 * slides, not customer interviews, not competitive analysis, not the company
 * knowledge base. Just the decisions + their outcomes + the reasoning trail.
 * Stay narrow: the narrowness is the moat. Never drift into "your full
 * knowledge base" framing — that cedes territory to Notion / Confluence /
 * Drive and dilutes the decision-specific moat.
 */
export const DECISION_SYSTEM_OF_RECORD_VALUE_PROPS: ReadonlyArray<string> = [
  'All your deals and their outcomes live in Decision Intel.',
  'Decision history survives team transitions (CSO leaves; reasoning trail stays).',
  'Audit-committee Q&A pulls up reasoning in 60 seconds — every flagged decision is one click from its DPR.',
  'Future decisions get sharper because the platform learns YOUR specific bias patterns (Brier-scored per-org recalibration).',
  'Replaces the four-tool graveyard (Google Docs / Slack / Confluence / board deck) for the decision-archaeology use case ONLY — never for the broader knowledge base.',
] as const;

/**
 * Wedge — the GTM motion for the next 6 months. Individual buyers @ £249/mo
 * frictionless tier. Personal-card / t-card budget. Zero procurement gate.
 * Locked v3.2 — replaces the previous Pan-African / EM-fund wedge.
 */
export const ICP_WEDGE = {
  label: 'GTM wedge (next 6 months)',
  audience:
    'Individual buyers @ £249/mo — UK + US. CSOs at FTSE 250 / mid-market scale-ups + S&P 500 sub-segments where the CSO has discretionary tooling spend, Heads of M&A / Corporate Development at scale-ups and PE-backed mid-market companies, Heads of Strategic Planning, independent fractional CSOs running multi-client portfolios.',
  whyItWorks:
    'Frictionless. Personal-card / t-card budget. Zero procurement gate. Optimises for word-of-mouth scale (Mr. Reiner principle: WoM is the only marketing channel that scales without paid acquisition). Every delighted Individual subscriber is a referral source if the artefact is good enough to forward.',
  proof:
    '£249/mo Individual tier. Self-serve sign-up. 60-second audit + DPR specimen as the conversion mechanism. Graduation rule (5 paid + 10 raving advocates + 1 verifiable referral via DPR/advocacy) gates the next phase.',
} as const;

/**
 * Pilot bridge — months 6-12. Sankore (London office, Summer 2026 in-person
 * engagement) is the TARGET first reference-grade pilot, in active scoping —
 * not "confirmed" until a Design Foundation MoU is signed. v3.3 §0 honesty
 * repair: the wedge motion runs unchanged if Sankore slips, but Sankore IS
 * load-bearing on the graduation rule's "1+ verifiable referral or warm
 * intro generated via DPR" condition if no Individual graduate produces a
 * shareable DPR by Q4 2026. Sankore IS a fund; the strategic value isn't
 * fund-buyer-budget, it's real fund operational insight + reference-grade
 * artefact production for the references the F500 ceiling buyer requires.
 */
export const ICP_PILOT_BRIDGE = {
  label: 'Pilot bridge (months 6-12)',
  audience:
    'Sankore (London office, Summer 2026 in-person engagement) — target first reference-grade pilot, in active scoping. Plus 1-2 Individual graduates converted to differentiated pilots.',
  whyItWorks:
    'Sankore provides real fund operational insight + reference-grade artefacts; Individual graduates provide reference cases that unlock F500 procurement. Design Foundation rate £1,999/mo (20% off Strategy tier) for first 5 founding cohort customers, OR £20-25K founding-pilot bundle for 12-month commitment with optional equity-warrant + outcome-share clause.',
  output: '1-2 published reference DPR specimens (anonymised, in the WeWork + Dangote pattern).',
} as const;

/**
 * Ceiling — 12-24+ months. F500 corporate strategy / corp dev M&A teams
 * @ £50K-150K ACV, UK + US primary. Cross-border M&A leaders specifically —
 * where the 19-framework regulatory map (Pan-African / EM coverage) becomes
 * a live moat layer Cloverpop and IBM watsonx.governance don't carry.
 */
export const ICP_CEILING = {
  label: 'Revenue ceiling (12-24+ months)',
  audience:
    'F500 Corporate Strategy + Corp Dev M&A teams @ £50K-150K ACV — UK + US primary. Heads of Corporate Development at FTSE 250 / S&P 500 running cross-border acquisitions, Chief Strategy Officers owning the strategic-acquisition memo workflow, audit committee + GC procurement as gate-signers.',
  whyItUnlocks:
    'The R²F + DPR + 19-framework cross-border regulatory map are designed to clear F500 procurement once the wedge has produced 3+ published reference cases. Pan-African / EM coverage (NDPR / CBN / WAEMU / PoPIA / SARB / ISA Nigeria 2007) is the cross-border M&A differentiator no US-only incumbent carries.',
} as const;

/**
 * Avoid — three explicit non-target audiences.
 * (1) Boutique sell-side M&A advisors — no software budget, relationship-driven.
 * (2) Generic small VC / PE funds with no Africa/EM exposure — no procurement need.
 * (3) US-only F500 with zero international M&A exposure — Cloverpop + IBM watsonx
 *     will out-bundle us in their backyard; pick fights where the regulatory moat matters.
 */
export const ICP_AVOID = {
  label: 'Avoid',
  audience:
    'Boutique sell-side M&A advisors (no software budget, relationship-driven, sceptical) + generic small VC funds with no Africa/EM exposure (no procurement need, AUM-per-decision too small) + US-only F500 with zero international M&A exposure.',
  why: 'These three segments lack EITHER the budget structure (boutique advisors) OR the procurement urgency (generic VC) OR the regulatory-moat fit (US-only F500). Pick fights where the cross-border regulatory moat matters and where there is procurement budget.',
} as const;

/**
 * Sequencing — wedge produces references → bridge produces published cases →
 * ceiling unlocks at the £50K-150K ACV procurement gate. v3.2 lock replaces
 * the previous "Year 1 = Pan-African fund wedge" sequencing.
 */
export const ICP_SEQUENCING = [
  'Months 1-6: Individual buyers @ £249/mo (wedge) — UK + US, LinkedIn + warm-intro driven.',
  'Months 6-12: Sankore (target first reference-grade pilot, in active scoping; London summer 2026) + 1-2 Individual graduates @ £1,999/mo Design Foundation rate (bridge) — produces published reference DPRs.',
  'Months 12-24+: F500 corporate strategy + corp dev M&A teams @ £50K-150K ACV (ceiling) — UK + US cross-border M&A specifically.',
  'Year 3+: Audit committees, GCs at regulated entities, BizOps / FP&A within F500.',
] as const;

export const ICP_SEQUENCING_RULE =
  'The wedge generates the cashflow + word-of-mouth that funds the bridge. The bridge generates the published references that unlock the ceiling. Do NOT chase enterprise procurement before the graduation rule fires (5 paid Individual + 10 raving advocates + 1 verifiable referral via DPR).';

/**
 * Graduation rule — the forcing function that gates the wedge → bridge
 * transition. v3.1 softening of "External DPR Share Event" → "1+ verifiable
 * referral or warm intro generated via DPR / advocacy" stays in v3.2 (the
 * original strict event was structurally hard given customer infosec).
 */
export const INDIVIDUAL_FIRST_GRADUATION_RULE = [
  '5 paid Individual subscribers at £249/mo, retained 90+ days',
  '10 raving advocates (NPS 9-10 OR unsolicited public DPR shares — anonymised specimen DPRs count, live-customer DPRs do NOT due to fund / corporate confidentiality)',
  '1+ verifiable referral or warm intro generated via DPR / advocacy',
] as const;

/**
 * Kill criterion — if the wedge doesn't fire by month 6, pause and re-question
 * the motion rather than scale a broken motion. The Cloverpop "manual logging
 * adoption trap" is the canonical risk here.
 */
export const KILL_CRITERION_DORMANT_FLYWHEEL = {
  triggers: [
    'Fewer than 5 paid Individual subscribers after 6 months',
    'DQI flywheel dormant: organisations not closing outcomes per Outcome Gate enforcement',
    'Sankore engagement not producing reference-grade artefacts',
  ],
  action:
    'Pause the GTM motion. Question whether the wedge is wrong vs. whether the product needs sharpening. Reset rather than scale a broken motion.',
} as const;

/**
 * Goldner discovery questions — INDIVIDUAL CSO / M&A HEAD version (the wedge).
 * Mr. Goldner's 4-question pattern, reframed for the new wedge buyer.
 */
export const GOLDNER_DISCOVERY_QUESTIONS_INDIVIDUAL: ReadonlyArray<string> = [
  'Walk me through the last strategic decision you wrote up. Where did the writing happen — Google Doc, Slack threads, Confluence, board deck? And how much of the original reasoning made it through to the final artefact?',
  "What's the question your CEO / board / parent company asked that you didn't see coming?",
  'If you could replay one decision from the last 12 months knowing what you know now — what was the bias hiding in plain sight?',
  "What's the artefact you wish you'd had to defend that decision when it was reviewed?",
] as const;

/**
 * Goldner discovery questions — CORP DEV / CORP STRATEGY M&A version (the
 * ceiling). For when a F500 corp dev or corp strategy M&A lead enters the
 * conversation, typically after the wedge has produced reference cases.
 */
export const GOLDNER_DISCOVERY_QUESTIONS_CORP_DEV: ReadonlyArray<string> = [
  'Walk me through your last cross-border acquisition memo. Where did the diligence + assumption-setting happen, and how did you carry the structural assumptions (sovereign cycle, FX regime, regulatory exposure) into the IC deck?',
  "What's the regulatory question — FCA, SEC, EU AI Act, GDPR, sovereign-context regime — that surfaced AFTER IC approval, when you wished it had surfaced before?",
  'If you could replay one M&A approval from the last 24 months — what was the bias the room missed that the IRR / outcome later exposed?',
  "What's the artefact your audit committee or GC would need to see to approve another deal of similar profile in the next 12 months — and what would it have to contain that today's diligence pack doesn't?",
] as const;

/**
 * Mr. Goldner's 3 rules — universally applicable, never reframed.
 */
export const GOLDNER_3_RULES: ReadonlyArray<string> = [
  'Talk to 10 people before building anything (or before structuring a new GTM motion).',
  'Find the pattern in their answers, not your assumption.',
  'Sell to the pattern, not to the product you wish you had built.',
] as const;

/**
 * Mr. Reiner's principle — the Wiz advisor's word-of-mouth philosophy.
 */
export const MR_REINER_PRINCIPLE =
  "Word-of-mouth is the only marketing channel that scales without paid acquisition. Optimise the Individual tier for shareability — every delighted customer is a referral source if the artefact is good enough to forward. The verifiable-referral graduation rule is the explicit instrumentation of this principle.";

/**
 * Mr. Gabe's principles — captured from the Apr 23 2026 CFO Strategy Call.
 */
export const MR_GABE_PRINCIPLES: ReadonlyArray<string> = [
  'Customers before investors. First 5 pilot customers prove product-market-fit; only then pursue seed.',
  'Waitlist as a credible asset for fundraising and cohort storytelling. Build deliberately.',
  'Defer formal entity registration until first 1-2 pilot revenues fund it.',
  "LinkedIn-led outreach. Don't rely on cold email alone.",
  'Willingness-to-use is the test, not product polish.',
  'Collect honest feedback for storytelling — not for product-feature roadmaps.',
] as const;

/**
 * Sharran 1-1-1 framework — ONE traffic source, ONE conversion mechanism,
 * ONE delivery model. Layered above the rest of the plan, never beneath it.
 */
export const SHARRAN_111 = {
  trafficSource:
    'LinkedIn-led outreach + warm intros from Mr. Reiner and Mr. Gabe. 1× post per week from Folahan, anchored to a famous bias-resonance corporate decision (Kodak / Blockbuster / Nokia / WeWork / Theranos / Wirecard) from the 143-case library.',
  conversionMechanism:
    '20-minute audit on a real strategic memo, no slide deck. The artefact does the persuasion. Outcome: an anonymised live DPR the prospect can keep + a self-serve sign-up to Individual £249/mo on the same call when fit signals are clear.',
  deliveryModel:
    'Self-serve sign-up + Individual £249/mo subscription as the primary first-touch monetisation. Sankore-class Design Foundation pilots and F500 ceiling deals come later; do not split focus.',
} as const;

/**
 * Connection-leverage referral asks — the literal scripts to send Mr. Gabe
 * and Mr. Reiner for warm intros. Captured from GTM Plan v3.2 §8.
 */
export const CONNECTION_LEVERAGE_ASKS = {
  reiner:
    "Mr. Reiner — Wiz network → US enterprise SaaS / cybersecurity / governance acquirers. Primary ask: 'Who in your network runs strategy, M&A, or corp dev at a US F500 — and would benefit from a 60-second audit on a real strategic memo? I'm looking for 3-5 warm intros to people who'd give me honest 20-minute feedback on the audit, even if they're not buying.' Output target: 3-5 US-side warm intros in 8 weeks; convert ≥1 to design-partner / paid Individual.",
  gabe:
    "Mr. Gabe (Gabriel Osamor, CEO of Megasuto) — UK investor-side network → UK CSO + corp dev contacts via his investor relationships. Primary ask: 'The UK companies your investor clients have invested in — do any of them have a CSO, head of strategic planning, or head of corporate development who'd be the right person to give me 20 minutes of feedback on a 60-second audit? I'm not pitching them to buy — I'm collecting honest feedback to sharpen the product before I open Design Foundation pilots.' Output target: 3-5 UK-side warm intros in 8 weeks.",
  discipline:
    "Every warm intro = 20-min audit on a real memo, NOT a sales pitch (the artefact does the persuasion). Send the introducer a 4-line follow-up after every intro. Track in Founder Hub Outreach Hub. Pattern-match across 10+ intros before declaring the motion working.",
} as const;

/**
 * Banned vocabulary — never use as the headline claim. Each entry carries the
 * reason so future-you can judge edge cases instead of just memorising the list.
 * v3.2 added "company knowledge base" — positioning hygiene against generic-KB drift.
 */
export const BANNED_VOCABULARY: ReadonlyArray<{ phrase: string; reason: string }> = [
  {
    phrase: 'decision intelligence platform',
    reason: 'Gartner-crowded (Peak.ai, Cloverpop, Quantellia, Aera).',
  },
  {
    phrase: 'decision hygiene',
    reason: "Kahneman's 2021 Noise term — borrowing it cedes our category vocabulary.",
  },
  {
    phrase: 'boardroom strategic decision',
    reason: 'Audience-narrowing — replaced by "high-stakes call" 2026-04-26.',
  },
  {
    phrase: 'company knowledge base',
    reason:
      "v3.2 lock: dilutes the decision-specific moat into Notion / Confluence / Drive territory. Decision Intel is the decision system of record, NOT the company knowledge base.",
  },
] as const;

/**
 * Cold-context on-ramps — descriptive plain-language phrases for the first
 * 10 seconds of a cold reader's attention. Never lead cold with the locked
 * category vocabulary (R²F / DPR / DQI / "reasoning layer") — the reader
 * hasn't earned the term yet.
 */
export const COLD_CONTEXT_ONRAMPS: ReadonlyArray<string> = [
  '60-second audit on a strategic memo',
  'pre-IC audit layer',
  'strategic memo audits',
  'decision quality auditing',
] as const;

/**
 * Build a chat-prompt-ready ICP block. founder-context.ts pipes this directly
 * into the system prompt so the chat coaching always reflects the latest lock.
 */
export function buildIcpPromptBlock(): string {
  const wedge = `${ICP_WEDGE.label}: ${ICP_WEDGE.audience} ${ICP_WEDGE.whyItWorks}`;
  const bridge = `${ICP_PILOT_BRIDGE.label}: ${ICP_PILOT_BRIDGE.audience} ${ICP_PILOT_BRIDGE.whyItWorks}`;
  const ceiling = `${ICP_CEILING.label}: ${ICP_CEILING.audience} — ${ICP_CEILING.whyItUnlocks}`;
  const avoid = `${ICP_AVOID.label}: ${ICP_AVOID.audience} ${ICP_AVOID.why}`;
  const sequence = ICP_SEQUENCING.join(' ');
  return `${wedge} ${bridge} ${ceiling} ${avoid} Sequencing — ${sequence} ${ICP_SEQUENCING_RULE}`;
}

/**
 * One-line ICP summary for the FOUNDER NOTES section. Derived from the
 * canonical wedge / ceiling / avoid constants so the founder-notes lead
 * cannot drift independently from the MARKET STRATEGY block.
 */
export function buildFounderNotesIcpLine(): string {
  const wedge = `Individual buyers @ £249/mo (UK + US CSOs, M&A heads, corp dev directors, fractional CSOs) is the canonical wedge motion: LinkedIn + warm-intro driven, 60-sec audit + DPR specimen as conversion mechanism, graduation rule = 5 paid + 10 raving + 1 verifiable referral via DPR.`;
  const bridge = `Sankore (London office, Summer 2026 in-person) is the TARGET first reference-grade design-partner pilot, in active scoping (per GTM v3.3 §0 honesty repair — not "confirmed" until a Design Foundation MoU is signed). Plus 1-2 Individual graduates produces the published references that unlock the F500 ceiling.`;
  const ceiling = `${ICP_CEILING.audience.replace(/\.$/, '')} is the 12-24+ month ceiling, unlocked by 3+ published wedge / bridge references.`;
  const avoid = `Avoid: ${ICP_AVOID.audience.replace(/\.$/, '')} — ${ICP_AVOID.why}`;
  return `${wedge} ${bridge} ${ceiling} ${avoid}`;
}
