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
 * Locked: 2026-05-04 (CATEGORY-CLAIM PIVOT). Supersedes the 2026-04-30 v3.2
 * "native reasoning layer for every high-stakes call" lock. The H1 was
 * failing James Pursey's 15-second test ("can a stranger fully understand
 * the startup in ~15 seconds, leaving zero doubt?") because both "reasoning
 * layer" and "high-stakes call" required the reader to pause and resolve
 * the abstract terms. The new H1 — "Decision Intel is the reasoning audit
 * platform" — claims a fresh ownable category (reasoning-audit-platform
 * doesn't exist as a Gartner category, so we own it by usage), bakes the
 * human-reasoning differentiator into the noun itself (vs BI tools that
 * audit data, vs model-risk tools that audit algorithms), passes Pursey
 * cleanly (3 words, every term resolves immediately), and stays compatible
 * with the existing positioning ecosystem (R²F, DPR, DQI, the moat).
 *
 * The wedge / bridge / ceiling sequencing stays unchanged — only the
 * category claim and surrounding hero copy change.
 */

/**
 * The protected category noun. Treat this string like "R²F" or "DPR" —
 * never substitute synonyms ("reasoning analyser", "reasoning checker",
 * "decision audit platform") in shipped surfaces. The category becomes
 * ownable through CONSISTENT REPETITION; one-off paraphrases dilute the
 * claim. If a surface needs a softer variant for cold contexts where
 * "platform" sounds SaaS-coded, drop "platform" — "the reasoning audit"
 * (without platform) is the only allowed deviation.
 */
export const CATEGORY_CLAIM = 'the reasoning audit platform' as const;

/**
 * Primary H1 — landing-page above-the-fold, pitch deck slide 1, LinkedIn
 * headline. The category-claim move ("Decision Intel is THE [noun]")
 * asserts ownership the way "Stripe is the payments infrastructure for
 * the internet" does — THE not A.
 */
export const POSITIONING_HERO_PRIMARY = 'Decision Intel is the reasoning audit platform.';

/**
 * Sub-head / immediate follow-up — the contrast move. Sharpens the
 * differentiator by explicitly distinguishing from existing categories
 * (BI tools audit data; model-risk tools audit algorithms; we audit the
 * human reasoning). Best deployed as the second sentence on the landing
 * page, NOT as a standalone H1.
 */
export const POSITIONING_HERO_CONTRAST =
  'Most tools audit your data. We audit your reasoning — and catch the fatal blind spots in strategic memos before the committee does.';

/**
 * Asymmetric-tail body copy — the JUSTIFICATION for running the audit
 * on every memo, not just the suspicious ones. Captures the "very much
 * might not but when it does, it's a big thing" insight: most memos
 * pass cleanly, but the catastrophic ones look identical to the clean
 * ones until they're audited. Goes immediately below the contrast
 * sub-head on the landing page.
 */
export const POSITIONING_ASYMMETRIC_TAIL_BODY =
  "Most strategic memos pass cleanly. The ones that don't are the ones that destroy value. You can't tell the catastrophic memo from the clean memo without auditing both — which is why you run the audit on every memo, not just the suspicious ones.";

/**
 * Political-capital framing (locked 2026-05-11 per Tier 3.1 — Deep
 * Research Paper #2 Ch 2 + Ch 10).
 *
 * Paper #2 Ch 2 demolished the "always-on red team" positioning: red
 * teams fail to scale because they're structurally antagonistic; the
 * political / ego cost of dissent is unsustainable in high-velocity
 * sponsor-driven deal environments. Calling DI an "always-on red team"
 * inherits the same failure mode — corp dev professionals would suppress
 * the audit results to protect their relationship with the deal sponsor.
 *
 * The Ch 10 fix: position DI as the antagonist that costs NO political
 * capital. The audit fires structurally before the IC memo crystallises;
 * the corp dev professional shifts from "antagonist trying to kill the
 * sponsor's deal" to "facilitator surfacing a system-generated risk
 * flag." Same dissent, zero ego cost.
 *
 * Layered usage: this is the BUYER-PSYCHOLOGY companion to the existing
 * POSITIONING_HERO_CONTRAST (which is the CATEGORY-DIFFERENTIATOR move,
 * BI vs reasoning audit). On a single surface, use them in sequence:
 *   - POSITIONING_HERO_CONTRAST first → resolves the category question
 *     (this isn't BI, this isn't model-risk-management)
 *   - POSITIONING_POLITICAL_CAPITAL_LINE second → resolves the
 *     buyer-psychology question (this isn't a red team — your champion
 *     doesn't pay an ego tax to use it)
 *
 * Use this line specifically on:
 *   - the corp-dev / fractional-CSO sales pages (mid-market corp dev
 *     head + fractional CSO are the personas Paper #2 named most
 *     directly)
 *   - the AntagonistPrompt / audit reveal copy on /dashboard/decisions
 *   - cold email subject lines for corp-dev-head buyers
 *   - Strategy World London conference pitch (T-30d)
 */
export const POSITIONING_POLITICAL_CAPITAL_LINE =
  'The antagonist that costs you no political capital — fires before the IC memo can hide what the deal sponsor doesn’t want to see.';

/**
 * Secondary H1 — for cold investor / regulatory-tailwind contexts where
 * tension beats elegance. Pairs the category claim with the regulatory
 * urgency. Used in cold investor DMs, VC pitches, "Why Now" deck slides.
 * NOT used as the primary landing H1 — that's POSITIONING_HERO_PRIMARY.
 */
export const POSITIONING_HERO_SECONDARY =
  'The reasoning audit platform the Fortune 500 needs before EU AI Act enforcement begins August 2026.';

export const IP_MOAT_NAME = 'Recognition-Rigor Framework (R²F)';

export const IP_MOAT_DESCRIPTION =
  "Kahneman's debiasing + Klein's Recognition-Primed Decisions, arbitrated in one pipeline.";

export const SPECIMEN_LIBRARY_DESCRIPTION =
  'WeWork S-1 (US/global) + Dangote 2014 Pan-African expansion (Africa / EM). Two production DPRs in public/.';

export const COMPLIANCE_MOAT_REGIONS = 'G7 / EU / GCC / African markets';

export const ICP_AUDIENCE_SUMMARY =
  'Individual CSOs + M&A heads + corp dev directors (UK + US wedge) → Sankore design partner bridge (London summer 2026) → F500 corporate strategy + corp dev M&A teams (ceiling, 12-24+ months).';

/**
 * Pain framing — locked 2026-05-08 (NotebookLM-verified, supersedes the
 * prior "bad strategic decisions" phrasing).
 *
 * The canonical pain phrase for slide 2 of the pitch deck, the landing
 * page problem statement, cold outreach openers, and any surface that
 * names the problem we solve. Synthesised from a master-KB query that
 * ran two evaluations against the 143-case library + Kahneman & Klein
 * 2009 / Kahneman & Lovallo 2003 / Klein 1995 / Mercier & Sperber:
 *
 * - "bad" / "flawed" reasoning loses on buyer psychology — elite
 *   decision-makers (CSO, M&A head, GP, PE-backed founder) view their
 *   intuition as their proprietary edge and reject framing that says
 *   their reasoning is broken. Triggers ego threat at procurement.
 * - "unaudited decisions" alone loses the IP moat — Cloverpop logs
 *   decisions, IBM watsonx audits models. Both can co-opt "we audit
 *   decisions." The word "reasoning" is what legally locks them out.
 * - "unaudited reasoning in strategic decisions" survives both tests:
 *   ego-saving (names a missing process, not broken thinking) AND
 *   IP-defensible (preserves "reasoning" as the category differentiator).
 *
 * Underlying philosophical claim (Mercier & Sperber + K&K 2009):
 * Human reasoning is biologically and evolutionarily flawed by default.
 * Capital is not destroyed because executives have cognitive biases —
 * biases are the OS of the human mind. Capital is destroyed because
 * organizations lack the structural friction (the audit) required to
 * catch and neutralize bias before capital is committed. Reasoning is
 * never objectively "sound"; it is either audited or unaudited.
 */
export const POSITIONING_PAIN_FRAMING =
  'Capital eroded by unaudited reasoning in strategic decisions.';

/**
 * Money-line claim that justifies the audit category. Derived directly
 * from the master-KB synthesis. Use as a follow-up sentence to the
 * pain framing on the pitch-deck pain slide, or as a standalone in
 * investor conversation. Quotable / rehearsable.
 */
export const POSITIONING_PAIN_PHILOSOPHICAL_CLAIM =
  'Reasoning is never objectively sound; it is either audited or unaudited.';

/**
 * Competitive defensive lines — the canonical responses when a buyer or
 * investor names Cloverpop / IBM watsonx as competitive. Locked alongside
 * the pain framing 2026-05-08 because the pain phrase deliberately
 * preserves "reasoning" as the IP differentiator, and these lines are
 * the operational follow-through. Use verbatim.
 */
export const COMPETITIVE_DEFENSIVE_LINES: ReadonlyArray<{
  competitor: string;
  line: string;
  why: string;
}> = [
  {
    competitor: 'Cloverpop',
    line: 'Cloverpop logs decisions; Decision Intel audits them.',
    why: 'Cloverpop is positioned as a decision system of record (logging + voting + accountability) but has no bias detection. The pain framing "unaudited reasoning" is precisely the gap they cannot close without our 22-bias taxonomy + R²F + 143-case corpus.',
  },
  {
    competitor: 'IBM watsonx.governance',
    line: 'IBM audits the model; Decision Intel audits the human reasoning.',
    why: 'IBM watsonx audits AI model behaviour (model lineage, fairness metrics, drift detection). It does NOT audit the human-authored memo or the human reasoning chain that drove the capital-allocation decision. The "human reasoning" qualifier is the procurement-grade differentiator.',
  },
] as const;

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
  'Word-of-mouth is the only marketing channel that scales without paid acquisition. Optimise the Individual tier for shareability — every delighted customer is a referral source if the artefact is good enough to forward. The verifiable-referral graduation rule is the explicit instrumentation of this principle.';

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
  gabe: "Mr. Gabe (Gabriel Osamor, CEO of Megasuto) — UK investor-side network → UK CSO + corp dev contacts via his investor relationships. Primary ask: 'The UK companies your investor clients have invested in — do any of them have a CSO, head of strategic planning, or head of corporate development who'd be the right person to give me 20 minutes of feedback on a 60-second audit? I'm not pitching them to buy — I'm collecting honest feedback to sharpen the product before I open Design Foundation pilots.' Output target: 3-5 UK-side warm intros in 8 weeks.",
  discipline:
    'Every warm intro = 20-min audit on a real memo, NOT a sales pitch (the artefact does the persuasion). Send the introducer a 4-line follow-up after every intro. Track in Founder Hub Outreach Hub. Pattern-match across 10+ intros before declaring the motion working.',
} as const;

/**
 * Banned vocabulary — never use as the headline claim. Each entry carries the
 * reason so future-you can judge edge cases instead of just memorising the list.
 * v3.2 added "company knowledge base"; 2026-05-04 added "AI decision tool" +
 * "AI-powered decision platform" + "decision intelligence" (as headline) per
 * the category-claim pivot. The category we own is "the reasoning audit
 * platform" — every alternative noun phrase that drifts toward the Gartner
 * decision-intelligence category is a banned drift target.
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
    reason:
      'Audience-narrowing — replaced by "high-stakes call" 2026-04-26, then by "strategic memo" 2026-05-04.',
  },
  {
    phrase: 'company knowledge base',
    reason:
      'v3.2 lock: dilutes the decision-specific moat into Notion / Confluence / Drive territory. Decision Intel is the decision system of record, NOT the company knowledge base.',
  },
  {
    phrase: 'AI decision tool',
    reason:
      '2026-05-04: too crowded. Every B2B AI startup calls itself an "AI tool". The category is "the reasoning audit platform"; never let it drift to generic AI-tool framing.',
  },
  {
    phrase: 'AI-powered decision platform',
    reason:
      '2026-05-04: AI-powered prefix is a generic SaaS tell. The platform name carries its differentiator (reasoning audit) without the AI-powered prefix.',
  },
  {
    phrase: 'native reasoning layer',
    reason:
      'Deprecated 2026-05-04. Failed Pursey 15-second test (reader has to define "reasoning layer" before the sentence resolves). Replaced by "the reasoning audit platform" — keeps the human-reasoning differentiator but in a noun phrase a stranger immediately understands.',
  },
  {
    phrase: 'bad strategic decisions',
    reason:
      'Deprecated 2026-05-08 (NotebookLM-verified pain-framing pivot). Accusatory toward elite decision-makers — they view their intuition as their proprietary edge and reject framing that says their reasoning is broken. Replaced by "unaudited reasoning in strategic decisions" (POSITIONING_PAIN_FRAMING) which names a missing process, not broken thinking. Same applies to "flawed strategic decisions" / "wrong strategic decisions" — generic + accusatory.',
  },
  {
    phrase: 'unaudited decisions',
    reason:
      'Banned ALONE (without "reasoning") 2026-05-08. Drops the IP differentiator — Cloverpop (logs decisions) and IBM watsonx (audits models) can both legally claim "we solve unaudited decisions." The word "reasoning" is what locks them out. Always use "unaudited reasoning in strategic decisions" or pair with "reasoning" in the same sentence.',
  },
  {
    phrase: 'always-on red team',
    reason:
      'Deprecated 2026-05-11 (Tier 3.1, Paper #2 Ch 2). Red teams fail structurally because the political/ego cost of dissent in sponsor-driven deal environments is unsustainable — claiming the category inherits that failure mode (corp dev professionals would suppress audit findings to protect sponsor relationships). Replaced by POSITIONING_POLITICAL_CAPITAL_LINE: "the antagonist that costs you no political capital — fires before the IC memo can hide what the deal sponsor doesn’t want to see." Same dissent, zero ego cost.',
  },
  {
    phrase: 'red team',
    reason:
      'Banned 2026-05-11 ONLY when used as DI\'s category claim or as the noun describing DI\'s capability (e.g. "the always-on red team" / "we are the red team"). Same Paper #2 Ch 2 reasoning as "always-on red team" above. STAYS valid when describing a competitor / historical practice / Kyle Price\'s description of the conventional countermeasure — that\'s background context, not a category claim.',
  },
  {
    phrase: 'digital red team',
    reason:
      'Banned 2026-05-11 alongside "always-on red team" — same deprecation reasoning. The "digital" prefix doesn\'t fix the structural antagonism problem.',
  },
] as const;

/**
 * Protected vocabulary — terms that should NEVER be substituted with synonyms
 * in shipped surfaces. The category becomes ownable through consistent
 * repetition; paraphrases dilute the claim. Only allowed deviation: "the
 * reasoning audit" (drop "platform") for cold contexts where SaaS-platform
 * vocabulary sounds heavy. Otherwise the full phrase is canonical.
 */
export const PROTECTED_VOCABULARY: ReadonlyArray<string> = [
  'the reasoning audit platform', // primary category claim (CATEGORY_CLAIM)
  'reasoning audit', // softer variant for cold contexts
  'fatal blind spots', // the load-bearing stake noun in the H1 + sub-head
  'before the committee does', // the time-anchor closing in the contrast sub-head
  'no political capital', // the buyer-psychology load-bearing phrase (Tier 3.1)
  'before the IC memo can hide', // the timing-anchor in the political-capital line
  'R²F', // existing IP moat
  'DPR', // existing artefact noun
  'DQI', // existing scoring metric
] as const;

/**
 * Cold-context on-ramps — descriptive plain-language phrases for the first
 * 10 seconds of a cold reader's attention IN SURFACES TOO SMALL FOR THE FULL
 * H1 (LinkedIn DM character limits, conference 1-line introductions). The
 * primary H1 ("Decision Intel is the reasoning audit platform") passes
 * Pursey's 15-second test on its own, but a 60-character LinkedIn DM
 * subject line can't carry it — that's where these on-ramps live.
 */
export const COLD_CONTEXT_ONRAMPS: ReadonlyArray<string> = [
  '60-second audit on a strategic memo',
  'pre-IC audit',
  'strategic memo audits',
  'reasoning audit',
  'an antagonist that costs no political capital', // Tier 3.1, corp-dev-head cold DM hook
  'audit that fires before the IC memo can hide it', // Tier 3.1, sponsor-driven-deal cold DM hook
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
 * Build a chat-prompt-ready POSITIONING block — the new category-claim
 * vocabulary that the chat persona MUST use when coaching the founder on
 * pitching, drafting cold outreach, or rehearsing investor conversations.
 * Locked 2026-05-04 with the H1 pivot. The prompt makes the chat coaching
 * explicit about WHEN to use the contrast sub-head + asymmetric-tail body.
 */
export function buildPositioningPromptBlock(): string {
  const competitiveLines = COMPETITIVE_DEFENSIVE_LINES.map(
    c => `  - ${c.competitor}: "${c.line}" (why: ${c.why})`
  ).join('\n');
  return [
    `CATEGORY CLAIM (locked 2026-05-04 — replaces the prior "native reasoning layer" lock):`,
    `Primary H1: "${POSITIONING_HERO_PRIMARY}"`,
    `Contrast sub-head (CATEGORY-DIFFERENTIATOR move — use as second sentence on landing / pitch deck; resolves "this isn't BI, isn't model-risk-management"): "${POSITIONING_HERO_CONTRAST}"`,
    `Political-capital line (BUYER-PSYCHOLOGY move — locked 2026-05-11 per Tier 3.1 + Paper #2 Ch 2 + Ch 10; use on corp-dev / fractional-CSO sales pages + AntagonistPrompt + cold corp-dev-head outreach): "${POSITIONING_POLITICAL_CAPITAL_LINE}"`,
    `Layering rule: when both sub-heads fit a surface (e.g. landing page sales section), use them in sequence — contrast first (resolves category question), political-capital second (resolves buyer-psychology question). DO NOT pick "always-on red team" or "digital red team" framings; both banned 2026-05-11 because red teams fail structurally (sponsor-driven deal environments make dissent ego-costly). The political-capital line is the literature-grounded fix.`,
    `Asymmetric-tail body (use as JUSTIFICATION for running the audit on every memo): "${POSITIONING_ASYMMETRIC_TAIL_BODY}"`,
    `Secondary H1 (cold investor / regulatory-tailwind contexts only): "${POSITIONING_HERO_SECONDARY}"`,
    ``,
    `PAIN FRAMING (locked 2026-05-08 — replaces the prior "bad strategic decisions" phrasing per NotebookLM master-KB synthesis):`,
    `Canonical pain phrase: "${POSITIONING_PAIN_FRAMING}"`,
    `Money-line philosophical claim (rehearsable): "${POSITIONING_PAIN_PHILOSOPHICAL_CLAIM}"`,
    ``,
    `Why "unaudited reasoning" beats "bad/flawed reasoning": elite decision-makers (CSO, M&A head, GP, PE-backed founder) view their intuition as their proprietary edge and reject framing that says their reasoning is broken. "Unaudited" names a missing process, not broken thinking — ego-safe + procurement-grade.`,
    ``,
    `Why "unaudited reasoning" beats "unaudited decisions" alone: dropping "reasoning" abandons the IP moat — Cloverpop (logs decisions) and IBM watsonx (audits models) can both legally claim "we audit decisions." The word "reasoning" is what locks them out.`,
    ``,
    `COMPETITIVE DEFENSIVE LINES — use verbatim when buyer / investor names a competitor:`,
    competitiveLines,
    ``,
    `Protected category noun: "${CATEGORY_CLAIM}". Treat like R²F / DPR / DQI — never substitute synonyms in shipped surfaces. Only allowed deviation: "the reasoning audit" (drop "platform") for cold LinkedIn DMs / conference introductions where SaaS-platform vocabulary sounds heavy.`,
    ``,
    `Why this category claim works (Pursey 15-second test): a stranger hears "Decision Intel is the reasoning audit platform" and immediately knows — software (platform) that audits (audit) human thinking (reasoning). Three words; every term resolves immediately. Differentiated from BI tools (which audit data) and model-risk-management tools (which audit algorithms). The category doesn't exist as a Gartner segment, which means it's ours by usage.`,
    ``,
    `Banned drift targets (do not let the category claim drift toward these): ${BANNED_VOCABULARY.map(b => `"${b.phrase}"`).join(', ')}. When the founder uses any of these in rehearsal, correct it on the spot.`,
  ].join('\n');
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

// =============================================================================
// GTM v3.5 — Phase 1 buyer-class-continuous personas (RATIFIED 2026-05-04)
// =============================================================================
// The v3.5 amendment narrows the Phase 1 wedge to FOUR buyer-class-continuous
// personas. The narrowing fixes the Continuity Chasm risk surfaced in the
// PMF-Discipline Deep Research report: junior analysts paying £249 personally
// have no graduation path to F500 procurement, so they collapse the MQL→SQL
// conversion to the 15-21% industry baseline. Buyer-class continuity ensures
// the person validating PMF in Phase 1 is the exact person signing procurement
// in Phase 3.
//
// All four personas share three load-bearing properties:
//  (a) regulatory urgency (LP pressure, audit-committee demand, or active
//      cross-border M&A regulatory exposure);
//  (b) personal-decisive budget (no procurement committee at the wedge price);
//  (c) deal volume sufficient to graduate to Strategy tier within 24-36 months.
//
// HXC = "High Expectation Customer" per Vohra/Superhuman methodology — these
// four personas are the cohort the Vohra "very disappointed" survey filters
// to. The phase-graduation gate is ≥40% on the HXC cohort.
//
// RULE — when v3.5 wedge personas change, edit HERE only. Sign-up persona
// gating, Vohra HXC filter, founder-hub ICP card, chat coaching, and the
// post-survey HXC computation all read from PHASE_1_PERSONAS by import.

export type Phase1PersonaId =
  | 'fractional_cso'
  | 'midmarket_corp_dev'
  | 'smaller_fund_gp'
  | 'pe_backed_founder'
  | 'other';

export interface Phase1Persona {
  id: Phase1PersonaId;
  // Sign-up form label (the radio / dropdown label shown to the user).
  label: string;
  // One-line description visible below the label in the sign-up form.
  description: string;
  // Whether this persona counts for the HXC cohort (the Vohra survey filter).
  // 'other' is FALSE; the four buyer-class-continuous personas are TRUE.
  hxcEligible: boolean;
  // The "buyer-class-continuous" graduation path — what they upgrade INTO
  // at Phase 2 / 3.
  graduationPath: string;
  // Sample DPR specimen to lead with for this persona.
  preferredSpecimen: 'wework' | 'dangote' | 'either';
  // Personal-decisive budget signal — what budget line they pay from.
  budgetSignal: string;
  // Deal volume signal — how many high-stakes calls/year they typically run.
  dealVolumeSignal: string;
}

export const PHASE_1_PERSONAS: ReadonlyArray<Phase1Persona> = [
  {
    id: 'fractional_cso',
    label: 'Fractional CSO / strategy consultant',
    description: 'Independent strategist running 3-5 client engagements with regular memo flow.',
    hxcEligible: true,
    graduationPath:
      'Brings DI to one of their client firms as a Strategy tier (£1,999-£4,999/mo) team-tier engagement. The fractional CSO becomes the internal champion + power user.',
    preferredSpecimen: 'either',
    budgetSignal:
      'Personal card / consulting expense; £249/mo absorbs into existing client retainer billing.',
    dealVolumeSignal:
      '3-5 active engagements × 4-8 strategic memos / year per client = 15-30 memos / year.',
  },
  {
    id: 'midmarket_corp_dev',
    label: 'Head of Corp Dev / M&A at scale-up',
    description:
      'Owns the IC memo workflow at a $50M-$500M revenue company, paying personally pre-team-budget.',
    hxcEligible: true,
    graduationPath:
      'Authorises team-tier purchase at the same firm OR moves to a larger firm and brings the tool. Same buying motion as F500 ceiling at smaller scale.',
    preferredSpecimen: 'wework',
    budgetSignal:
      'Personal card; divisional discretionary spend up to £5K-£10K/yr without procurement.',
    dealVolumeSignal:
      '1-3 acquisitions / year + ongoing build-vs-buy decisions = 6-12 strategic memos / year.',
  },
  {
    id: 'smaller_fund_gp',
    label: 'GP / principal at smaller fund',
    description:
      'Partner at £5M-£100M AUM PE / VC / family-office fund with active deal flow OR LP-governance pressure.',
    hxcEligible: true,
    graduationPath:
      'Fund itself becomes a Strategy-tier customer at Phase 2 / 3. Fund partner refers to portfolio CSOs (LP-pressure-driven governance asks compound through portfolio).',
    preferredSpecimen: 'dangote',
    budgetSignal:
      'Personal-decisive at GP level; fund management fee covers tooling line items <£5K/yr.',
    dealVolumeSignal:
      '4-10 deals / year × 5-7 year hold cycle = 20-70 closed outcomes within 5 years (within Convergence Threshold range).',
  },
  {
    id: 'pe_backed_founder',
    label: 'PE-backed founder / CEO',
    description:
      'Founder at PE-backed mid-market firm, owning the strategic memo and IC-presentation workflow.',
    hxcEligible: true,
    graduationPath:
      'CEO authorises team-tier upgrade for full strategy team. PE sponsor may mandate adoption across portfolio if reference is strong.',
    preferredSpecimen: 'wework',
    budgetSignal:
      'Founder personal card OR company tooling line; under board / investor reporting threshold.',
    dealVolumeSignal:
      '2-6 board-level memos / year + acquisition memos when active = 6-15 memos / year.',
  },
  {
    id: 'other',
    label: 'Other (tell us your role)',
    description:
      'Full platform access with the generic reasoning-audit overview — every feature, no gate. The four roles above are the marketed COLD-CONTEXT wedge, not an access wall: warm / referral traffic (founders trying it, potential referrers) gets in fully.',
    // hxcEligible:false is LOAD-BEARING and intentionally UNCHANGED. It is a
    // COHORT discriminator, not an access gate — it excludes this persona from
    // the Vohra >=40% HXC graduation-gate measurement so the v3.5 wedge PMF
    // signal stays uncontaminated. Access != cohort. Do NOT flip this to true
    // to "let them in" — they are already fully in; flipping it would pollute
    // the graduation metric.
    hxcEligible: false,
    graduationPath:
      'No HXC graduation path — excluded from the Vohra graduation-gate cohort by hxcEligible:false (signal-integrity, not an access restriction). Platform access is unrestricted.',
    preferredSpecimen: 'either',
    budgetSignal: 'Not part of the Phase 1 buyer-wedge cohort (full platform access regardless).',
    dealVolumeSignal:
      'Not part of the Phase 1 buyer-wedge cohort (full platform access regardless).',
  },
];

/**
 * Returns the Phase 1 persona definition for the given id, or undefined.
 * Use this anywhere the user's persona drives display logic (sign-up form,
 * Vohra modal cohort labelling, founder-hub Phase 1 dashboard).
 */
export function getPhase1Persona(id: string | null | undefined): Phase1Persona | undefined {
  if (!id) return undefined;
  return PHASE_1_PERSONAS.find(p => p.id === id);
}

/**
 * Returns true if the given persona id is HXC-eligible (one of the four
 * buyer-class-continuous personas). Used by the Vohra HXC filter and the
 * Phase 1 metrics dashboard.
 */
export function isHxcEligible(id: string | null | undefined): boolean {
  return Boolean(getPhase1Persona(id)?.hxcEligible);
}

/**
 * The HXC subset (the four continuous personas), excluding 'other'. Use
 * this for sign-up gating where you only want to show the four allowed
 * personas, with 'other' rendered separately as an opt-out path.
 */
export const PHASE_1_HXC_PERSONAS: ReadonlyArray<Phase1Persona> = PHASE_1_PERSONAS.filter(
  p => p.hxcEligible
);

/**
 * Maps the v3.5 HXC persona id to the legacy onboardingRole enum used by
 * the downstream personalization cascade (OnboardingTour, sample bundles,
 * role-empty-states, FirstRunInlineWalkthrough). The merged WelcomeModal
 * captures phase1Persona as the canonical signal and derives onboardingRole
 * from it atomically — so the entire cascade keeps working unchanged while
 * sign-up itself reflects the locked HXC narrowing.
 *
 * Mapping rationale:
 *   fractional_cso     → cso       (CSO downstream surfaces: strategic memo + board pack)
 *   midmarket_corp_dev → ma        (M&A workflow overlay: 9 doc types + 5 toxic combos)
 *   pe_backed_founder  → ma        (their primary memo workflow is acquisitions + IC)
 *   smaller_fund_gp    → pe_vc     (PE / VC / fund overlay)
 *   other              → other     (no downstream personalization)
 */
export type OnboardingRoleId = 'cso' | 'ma' | 'bizops' | 'pe_vc' | 'other';

export function phase1PersonaToOnboardingRole(persona: Phase1PersonaId): OnboardingRoleId {
  switch (persona) {
    case 'fractional_cso':
      return 'cso';
    case 'midmarket_corp_dev':
      return 'ma';
    case 'pe_backed_founder':
      return 'ma';
    case 'smaller_fund_gp':
      return 'pe_vc';
    case 'other':
      return 'other';
  }
}

/**
 * Phase-graduation gate per Vohra / Superhuman methodology — locked v3.5.
 * A user-tier reaches PMF when ≥40% of HXC respondents report being "very
 * disappointed" if they could no longer use the product. Below 30% by month 4
 * is the kill criterion.
 */
export const VOHRA_PMF_GRADUATION_THRESHOLD = 40 as const;
export const VOHRA_PMF_KILL_THRESHOLD = 30 as const;

/**
 * Phase 1 customer-count milestones (locked v3.5 — founder ratified 2026-05-04).
 * Baseline = 8-12 paid customers retained 90+ days by month 6.
 * Stretch = 15-25 (graduate to Phase 2 ahead of schedule).
 * Kill = <5 by month 4 (revert to product discovery).
 *
 * The Gemini PMF-Discipline report's 40-customer / £10K MRR target is the
 * Phase 1 STRETCH goal, not the baseline. Pieter Levels-tier velocity assumes
 * an existing audience; v3.5 baseline is calibrated to a solo founder
 * starting cold without paid acquisition.
 */
export const PHASE_1_CUSTOMER_BASELINE_MIN = 8 as const;
export const PHASE_1_CUSTOMER_BASELINE_MAX = 12 as const;
export const PHASE_1_CUSTOMER_STRETCH_MIN = 15 as const;
export const PHASE_1_CUSTOMER_STRETCH_MAX = 25 as const;
export const PHASE_1_CUSTOMER_KILL_BY_MONTH_4 = 5 as const;
