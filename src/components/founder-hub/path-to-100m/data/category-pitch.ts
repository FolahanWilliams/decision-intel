/**
 * CategoryAndPitchLibrary consumer data — warm category claim, cold
 * descriptive, 7 persona pitches, 5 protected-revenue language patterns.
 * Split out from monolithic data.ts at F2 lock 2026-04-29.
 *
 * Source synthesis: 2026-04-26 positioning lock + 2026-04-27
 * persona-tailored-explanation + protected-revenue language synthesis.
 */

import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';

const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;

export type LanguagePattern = {
  id: string;
  pattern: string;
  featureFraming: string;
  protectedRevenueFraming: string;
  whyItWorks: string;
  source: string;
};

export type CategoryDefinition = {
  warmCategoryClaim: string;
  coldDescriptive: string;
  whatItIs: string;
  whatItIsNot: string[];
  whatProblemItSolves: string;
  whyItIsPossibleNow: string;
  fourToolGraveyard: string[];
  vocabularyByContext: { context: string; useThisLanguage: string; example: string }[];
};

export const CATEGORY_DEFINITION: CategoryDefinition = {
  warmCategoryClaim: 'The native reasoning layer for every high-stakes call.',
  coldDescriptive: '60-second AI audit on a strategic memo before the room sees it.',
  whatItIs:
    'A native system of record for strategic reasoning. Every memo, IC thesis, board recommendation, fund decision is audited against the Recognition-Rigor Framework — Kahneman debiasing on one side, Klein recognition-primed pattern matching on the other, arbitrated by a Pro-tier meta-judge. The output is a Decision Quality Index, a hashed and tamper-evident Decision Provenance Record, and a counterfactual that names the exact biases the room would catch first.',
  whatItIsNot: [
    'NOT a "decision intelligence platform" in the Cloverpop / Aera / Quantellia / Peak.ai sense — that is operational decision automation, not strategic-reasoning audit',
    'NOT an AI bias checker — bias-detection is one node in a 12-node pipeline, not the product',
    'NOT a meeting / collaboration / decision-logging tool — we are pre-decision, not the decision archive',
    'NOT a competitor to McKinsey / BCG / Bain — we are the audit layer that ships with their analytical work, not the strategy seat',
    'NOT a model-governance tool (IBM watsonx, Credo AI) — we govern the human strategic decision the AI informed, not the model itself',
  ],
  whatProblemItSolves:
    'Strategic decisions die in a four-tool graveyard — Google Docs draft, Slack feedback thread, Confluence writeup, board deck. The WHAT is recorded. The WHY is lost to "decision archaeology" — reconstructing past reasoning from incomplete artefacts. Decision Intel is the missing system of record that audits the reasoning ITSELF in 60 seconds, before the call is made, with the artefact the audit committee asks for after.',
  whyItIsPossibleNow: `Three years ago, no LLM could run a 12-node multi-agent debate, score outputs against a 30+ bias taxonomy, cross-map to ${FRAMEWORK_COUNT} regulatory frameworks, and produce a 4-page tamper-evident DPR in 60 seconds. Now it can. The EU AI Act Article 14 enforcement on Aug 2, 2026 makes the regulatory artefact non-optional. The timing is the answer to the why-now question.`,
  fourToolGraveyard: [
    'Google Docs — the draft (ephemeral, version chaos, no audit trail)',
    'Slack — the feedback thread (signal lost in noise, untraceable)',
    'Confluence — the writeup (read by nobody, indexed by no governance system)',
    'Board deck — the presentation (the WHAT, never the WHY)',
  ],
  vocabularyByContext: [
    {
      context: 'Cold (LinkedIn DM opener, cold email subject line, conference 1:1 introduction)',
      useThisLanguage:
        '"60-second audit on a strategic memo." "Pre-IC audit layer." "Strategic memo audits." Plain-language artefact + timing — never the locked category claim.',
      example:
        '"60-second audit on a strategic memo. Attached: an anonymised Decision Provenance Record on the 2014 Dangote expansion. Worth a 20-minute call?"',
    },
    {
      context: 'Bridge sentence (the cold → warm conversion, 10-second move)',
      useThisLanguage:
        '"We run 60-second audits on strategic memos. The technical name is a reasoning layer — Recognition-Rigor Framework, scored as a Decision Quality Index."',
      example:
        'Use this transition the moment the cold reader leans in. By minute 3 of the meeting they should be using the warm vocabulary — DPR, R²F, DQI — without it sounding foreign.',
    },
    {
      context:
        'Warm (second meeting onward, pitch decks, design-partner conversations, internal Founder Hub)',
      useThisLanguage:
        '"Native reasoning layer for every high-stakes call." "Recognition-Rigor Framework arbitrating Kahneman + Klein." "Decision Quality Index in 60 seconds." "Hashed + tamper-evident Decision Provenance Record."',
      example:
        '"Slide 2: We are the only platform combining Kahneman\'s debiasing methodology with Klein\'s Recognition-Primed Decision framework — suppressing bias while amplifying expert intuition."',
    },
  ],
};

// =========================================================================
// SECTION 6 · KILLER OBJECTION RESPONSES (NotebookLM 2026-04-27 synthesis)
// =========================================================================


export type PersonaPitch = {
  id: string;
  persona: string;
  theirPain: string;
  pitch: string;
  closingMove: string;
};

export const PERSONA_PITCH_LIBRARY: PersonaPitch[] = [
  {
    id: 'cso_vp_strategy',
    persona: 'Chief Strategy Officers (CSO) & VPs of Strategy',
    theirPain:
      'They ship 40-60 recommendations a year. Their biggest fear is a memo landing badly in front of the board because of a blind spot. The post-board "why was this not flagged earlier" question is career-defining.',
    pitch:
      "\"You don't have a process for auditing your own strategic memos before they reach the board, because three years ago it wasn't technically possible. Now it is. Decision Intel is the 60-second hygiene step that happens between your analyst and the committee. We aren't replacing your workflow; we are providing an insurance premium on your strategic-planning cadence. When your analyst runs a memo through our tool, it names the exact biases the room will catch first and generates a Decision Quality Index. It makes your VP of Strategy the adult in the room on every recommendation.\"",
    closingMove:
      'Bring the WeWork S-1 DPR. "This is the audit on a famously biased filing. Apply the same lens to your last quarterly memo — would your steering committee have caught these flags?"',
  },
  {
    id: 'corp_dev_ma',
    persona: 'Corporate Development & M&A Teams',
    theirPain:
      '70-90% of acquisitions fail to create the value the IC voted for, often due to confirmation bias or sunk-cost anchoring during diligence. The post-close partner question that starts with "why didn\'t we see X in Q3" is a career-killing moment.',
    pitch:
      "\"Before a deal thesis reaches IC, it runs through Decision Intel. We flag overconfidence, sunk-cost anchoring, and base-rate neglect — highlighting the exact sentence they live in. Then we pattern-match your memo against our 143-case historical library. Your deal team can walk into IC and say 'we hit the same pattern Kraft-Heinz did on Unilever, and here is how we mitigate it,' with evidence, not analogy. We aren't slowing deals down — we are removing the post-close partner question that starts with why didn't we see X.\"",
    closingMove:
      'Offer to retro-audit 3 dead deals from the last quarter. "If we don\'t flag the exact pattern that killed those deals in 7 minutes each, this is not the right tool for your team."',
  },
  {
    id: 'pan_african_em_fund',
    persona: 'Pan-African / Emerging Market Fund Partners (the wedge)',
    theirPain:
      'High-stakes capital allocation across volatile FX regimes (NGN, KES, GHS, CFA, EGP). Existing tools are US-centric and do not understand local market realities. They evaluate evidence for a living and tune out generic SaaS pitches in 90 seconds.',
    pitch:
      'No slide deck. The Evidence Moment IS the pitch. 90 seconds framing the problem, then a live 7-minute audit on a famous failed document they recognise — the 2014 Dangote Pan-African expansion plan, anonymised. The specimen surfaces Dalio determinants (currency cycles, trade share, governance) and maps to NDPR + CBN + WAEMU + PoPIA + CMA Kenya in a single artefact.',
    closingMove:
      'Ask the partner to bring a redacted IC memo from one of THEIR own deals that went sideways. Run the audit live on the call. "If the audit does not name the exact blind spot that cost the fund money, the tool is not for you."',
  },
  {
    id: 'gc_audit_committee',
    persona: 'General Counsels & Audit Committees (the procurement gatekeepers)',
    theirPain:
      'Unmanaged legal exposure. Reuters-headline risk. Upcoming AI regulation (EU AI Act Aug 2, 2026 enforcement on high-risk decision-support; Basel III ICAAP qualitative-decision documentation; SOX §404 internal controls; GDPR Art 22).',
    pitch:
      '"Decision Intel is the reasoning layer the Fortune 500 needs before regulators start asking. Every bias flag we surface is cross-mapped to 17 global regulatory frameworks. We provide a hashed, tamper-evident Decision Provenance Record for every memo. If you need to satisfy EU AI Act Article 14 record-keeping, or African regimes like NDPR / CBN / WAEMU, your audit committee doesn\'t have to take the tool on faith — they review each flag against its cited regulatory source in a single artefact."',
    closingMove:
      'Hand over the DPR specimen + the Terms appendix + the DPA template. "Send these to your vendor-risk register. We will respond in writing to every question within 48 hours."',
  },
  {
    id: 'pre_seed_investor',
    persona: 'Pre-Seed / Seed Investor',
    theirPain:
      'Pattern-match risk. Founder-continuity risk. Category-clarity risk. They want a clear unicorn-shape ICP with a structural moat, an honest path with conditional probabilities, and a procurement-grade traction signal. They want NOT another "AI for X" pitch.',
    pitch:
      '"Native reasoning layer for every high-stakes call. Recognition-Rigor Framework operationalising 50 years of Nobel-winning behavioral economics. 17-framework regulatory map across G7 / EU / GCC / African markets — EU AI Act Article 14 enforcement is Aug 2, 2026. Our wedge is Pan-African EM funds; our ceiling is Fortune 500 CSOs. Conditional probability of unicorn outcome is 0.79% — 4× the pre-seed B2B baseline. Most likely outcome is Series-B-stage strategic acquisition at $400M-1B by Q4 2029."',
    closingMove:
      'Show them the HonestProbabilityPath conditional-probability slide + the Hard Truth Risks tracker. "Honest math, named tripwires. Your fund will not get this clarity from another pre-seed pitch this quarter."',
  },
  {
    id: 'mckinsey_quantumblack',
    persona:
      'Management Consultant Partner (McKinsey QuantumBlack / BCG GAMMA / Bain Advanced Analytics)',
    theirPain:
      'Generative-AI displacement eating engagement margin. Client question "what is your AI governance answer for EU AI Act Art 14" with no clear answer. Internal partner pressure on margin compression.',
    pitch:
      '"McKinsey provides the strategy. Decision Intel provides the continuous audit and the EU AI Act Article 14 regulatory record. We are not a competitor to your QuantumBlack engagement — we are the artefact that ships with it, signed off by the client\'s audit committee, that proves you delivered governance and not just analytical insight."',
    closingMove:
      'Propose a 90-day co-pilot engagement embedded in one of their live engagements + a joint co-publishable white paper on AI governance for high-stakes decisions.',
  },
  {
    id: 'lrqa_assurance_firm',
    persona: 'Compliance / Risk Firm Executive (LRQA / Bureau Veritas / SGS / Intertek / DNV)',
    theirPain:
      'AI-native disruption eating their existing assurance services. EU AI Act creating a new compliance category they cannot serve fast enough. EM-region client demand without local capacity (LRQA × Partner Africa April 2026).',
    pitch:
      '"You provide global assurance. Decision Intel provides the AI-native reasoning-audit layer that lives inside that assurance — the EU AI Act Article 14 record-keeping artefact your enterprise clients are already required to produce. We are not a competitor to your service revenue; we are the technology layer that makes your existing service line the answer to the EU AI Act question."',
    closingMove:
      'Frame as a category conversation, not a vendor pitch. "What would a 90-day co-pilot inside one of your existing service lines look like?"',
  },
];

// =========================================================================
// SECTION 8 · LANGUAGE PATTERNS · feature → protected revenue
// =========================================================================

export const LANGUAGE_PATTERNS: LanguagePattern[] = [
  {
    id: 'cost_of_inaction',
    pattern: 'The Cost-of-Inaction Pattern',
    featureFraming: 'We detect cognitive biases.',
    protectedRevenueFraming: 'This bias cost you £187k — here is the fix.',
    whyItWorks:
      'Replaces the abstract feature ("we detect biases") with a specific dollar amount on a specific flag. The buyer\'s mind cannot un-see the £187k.',
    source:
      'NotebookLM positioning synthesis 2026-04-27 + Wiz / Snowflake / Datadog / Gong landing-page patterns',
  },
  {
    id: 'counterfactual_lift',
    pattern: 'The Counterfactual-Lift Pattern',
    featureFraming: 'We provide counterfactual scenario modelling.',
    protectedRevenueFraming:
      'If you had removed anchoring bias from your last 20 decisions, your success rate would have been 14% higher — that is $2.3M in avoided losses.',
    whyItWorks:
      'Anchors the value in the buyer\'s OWN decision history. The "your last 20 decisions" framing makes the math feel personal, not generic.',
    source: 'Decision Intel CounterfactualPanel + sales-toolkit ARTIFACT_LED_PITCH_BEATS',
  },
  {
    id: 'dollar_impact',
    pattern: 'The Dollar-Impact Estimation Pattern',
    featureFraming: 'We provide historical failure benchmarking.',
    protectedRevenueFraming: 'Estimated risk: $22.5M based on 45% failure rate on $50M deal.',
    whyItWorks:
      "Ties the percentage benchmark (which is abstract) to the buyer's ticket size (which is concrete). The dollar amount survives every internal forwarding without needing context.",
    source: 'DiscoveryGradeImpactCard + CLAUDE.md "PROTECTED REVENUE" lock 2026-04-27',
  },
  {
    id: 'insurance_premium',
    pattern: 'The Insurance-Premium Pattern',
    featureFraming: 'We offer an AI-powered strategic audit.',
    protectedRevenueFraming:
      'Consulting firms charge you $1M to tell you about cognitive bias — and they have the same biases themselves. We built an AI that does not. This is a £30K/year insurance premium on your strategic-planning cadence.',
    whyItWorks:
      'Anchors against the $300B consulting industry instead of against $50/mo SaaS tools. The "$1M to tell you about bias" line forces the buyer to do the math against their own consulting budget.',
    source:
      'NotebookLM positioning synthesis 2026-04-27 + Founder School lesson gtm_6 (charge more than you think)',
  },
  {
    id: 'protected_revenue_anchor',
    pattern: 'The Protected-Revenue Anchor Pattern',
    featureFraming: 'We protect against bad strategic decisions.',
    protectedRevenueFraming:
      'One avoided £5-15M strategic mistake per quarter pays for the entire team subscription five years over.',
    whyItWorks:
      'Frames the subscription as a protection product, not a software cost. The buyer\'s purchase decision becomes "is one bad call worth more than five years of subscription" — the answer is always yes.',
    source: 'CLAUDE.md PricingPageClient.tsx Strategy-tier protected-value strap (2026-04-27)',
  },
];

// =========================================================================
// SECTION 9 · 17 INVESTOR METRICS TRACKER
// =========================================================================

