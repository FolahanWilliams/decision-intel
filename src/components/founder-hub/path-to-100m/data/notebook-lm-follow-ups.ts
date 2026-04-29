/**
 * NotebookLmFollowUpLab consumer data — 10 next questions to deepen
 * the path-to-100m surface. Split out from monolithic data.ts at F2
 * lock 2026-04-29.
 *
 * When NotebookLM produces an answer, the corresponding follow-up
 * gets retired here and a new follow-up takes its slot.
 */

export type NotebookLmFollowUp = {
  id: string;
  category: 'positioning' | 'investor' | 'channel' | 'compliance' | 'failure_modes' | 'gtm';
  question: string;
  whyAsk: string;
  expectedOutput: string;
  priority: 'now' | 'soon' | 'later';
};

export const NOTEBOOKLM_FOLLOW_UPS: NotebookLmFollowUp[] = [
  {
    id: 'mckinsey_alliance_model',
    category: 'channel',
    question:
      'What does the McKinsey QuantumBlack alliance commercial model look like end-to-end? Specific partnership terms with comparable partners (Credo AI, C3 AI, Wonderful) — revenue share, per-seat licensing, embedded-license, exclusivity, co-marketing rights. Where is the leverage for a startup partner with one anchor engagement?',
    whyAsk:
      'Wiz advisor → QuantumBlack intro is the highest-ROI advisor ask per the 2026-04-27 synthesis. Walking into the alliance conversation knowing the commercial structure benchmarks gives DI 5× more leverage in negotiation.',
    expectedOutput:
      '3-5 named comparable partnerships with public commercial terms · the negotiation-leverage map for a startup with one anchor engagement · the typical alliance-onboarding timeline at McKinsey · the most-likely deal-killer pattern.',
    priority: 'now',
  },
  {
    id: 'pre_seed_target_funds',
    category: 'investor',
    question:
      'Pre-seed European + US investors most likely to fund a 16-year-old solo founder building enterprise infrastructure with a Pan-African wedge. Name 5 with thesis fit + warm-intro paths + the most recent comparable check they have written. Include thematic tag (enterprise infra, regulatory tailwind, founder-led category creation, EM market entry).',
    whyAsk:
      'Pre-seed Phase 1 conditional probability (50%) is the unicorn-path gate. Knowing 5 named funds with thesis fit + warm-intro paths converts the abstract "raise pre-seed" into specific outreach.',
    expectedOutput:
      '5 named funds (e.g., Air Street, Saxon Advisors, Index Ventures Europe, Greylock seed practice, Creandum) · thesis fit one-liner per fund · most recent enterprise-infra check size · warm-intro path via Wiz advisor / school network / portfolio overlap.',
    priority: 'now',
  },
  {
    id: 'f500_procurement_cycle',
    category: 'gtm',
    question:
      'What is the typical procurement cycle length for a F500 audit committee approving a new SaaS tool, broken down by stage (initial review, security review, legal review, vendor risk register, contract negotiation)? What is the cycle compression we would get from EU AI Act Article 14 timing pressure on Aug 2, 2026?',
    whyAsk:
      'F500 expansion (Q4 2026) is the second-phase conditional probability gate. Knowing the procurement-cycle stages + the EU AI Act compression factor lets DI plan the 90-day pre-emptive procurement-gate clearing strategy.',
    expectedOutput:
      'Stage-by-stage timeline (with median + p90 numbers from public benchmarks) · EU AI Act timing-pressure compression factor (1.5×? 2×? 3×?) · the named procurement gates DI must clear before contract.',
    priority: 'soon',
  },
  {
    id: 'sankore_design_partner_success',
    category: 'gtm',
    question:
      'What does success look like at Day 90 of a Sankore-class design partnership? Specific metrics, measurement owner, artefact deliverables, and the LP-facing reference-case shape we should target for Q4 publication. What are the 3 highest-probability failure modes in the first 90 days?',
    whyAsk:
      'Sankore close + 90-day onboarding is the wedge-proof gate. A success-criteria framework that works for both DI and Sankore is the difference between a published reference case and a churned design partner.',
    expectedOutput:
      'Day-30 / Day-60 / Day-90 metrics framework · measurement-owner mapping · artefact deliverables (DPR sample, anonymised reference case draft, LP-facing brief) · 3 failure modes with countermoves.',
    priority: 'now',
  },
  {
    id: 'cloverpop_disclosed_acvs',
    category: 'failure_modes',
    question:
      "Cloverpop's actual ACV and customer-count progression — find any disclosed numbers from press, court filings, acquisition disclosure (Clearbox Decisions Sept 2025), Crunchbase, or PitchBook. What did their first 10 paid customers look like? What was the typical ACV at acquisition?",
    whyAsk:
      'Cloverpop data-advantage external attack vector requires us to know the depth of their data moat. Knowing their customer count + ACV progression sharpens the wedge-vs-Cloverpop positioning.',
    expectedOutput:
      'Cloverpop customer count over time (estimated from public sources) · first 10 customers archetype · ACV at acquisition · the 2 most-public reference cases.',
    priority: 'soon',
  },
  {
    id: 'eu_ai_act_enforcement_examples',
    category: 'compliance',
    question:
      'EU AI Act Article 14 enforcement examples in 2026 — first DPAs (Data Protection Authorities) to issue guidance, first companies named, first fines. What is the actual procurement-stage urgency on F500 GCs as Aug 2, 2026 approaches?',
    whyAsk:
      'EU AI Act timing pressure is the #1 timing argument for F500 expansion. Concrete enforcement examples make the urgency real, not theoretical.',
    expectedOutput:
      'Named DPAs with published guidance · first 3 companies named in EU AI Act enforcement actions · F500 GC procurement-stage signals (vendor-risk register changes, SOC 2 questionnaire updates) · the actual enforcement intensity by Q3 2026.',
    priority: 'soon',
  },
  {
    id: 'teen_founder_continuity_examples',
    category: 'investor',
    question:
      'Failure modes of teen-founder enterprise companies — concrete examples from the past 10 years (Vitalik Buterin, Palmer Luckey, Patrick Collison early days, OpenAI co-founder paths) and their continuity tripwires. What is the credibility-pattern that survives pre-seed VC due diligence?',
    whyAsk:
      'Founder continuity is the #1 weakness flagged in the strengths-weaknesses synthesis. Knowing the historical pattern of teen-founder enterprise companies sharpens the continuity playbook + the pre-seed deck.',
    expectedOutput:
      '5-7 named teen-founder enterprise examples · their continuity playbook decisions · the 3 patterns that survived pre-seed → Series A → IPO · the 2 patterns that collapsed and why.',
    priority: 'soon',
  },
  {
    id: 'lp_decision_quality_questions',
    category: 'compliance',
    question:
      "What questions will an LP ask the GP about Decision Intel's DPR before they let the GP use it for IC reporting? Specific framework concerns (anti-money laundering, data residency, indemnification, exit rights), specific procurement-grade gates.",
    whyAsk:
      'LP procurement-gate clearing is the long-tail expansion path for Pan-African / EM-fund design partners. Knowing the LP-side concerns lets DI ship the LP-grade DPR variant before the LP asks.',
    expectedOutput:
      '15-20 named LP procurement questions about decision-quality SaaS · 5 most common framework concerns · the gates an LP-grade DPR must clear · the 3 deal-killer patterns.',
    priority: 'later',
  },
  {
    id: 'advisor_cadence_benchmark',
    category: 'gtm',
    question:
      'What is the optimal advisor-cadence pattern for a 16-year-old solo founder with a Wiz-credentialed advisor? Cadence frequency, ask specificity, closed-loop reporting, equity / retainer milestones — drawing on benchmarks from successful founder-advisor relationships in enterprise SaaS.',
    whyAsk:
      'Wiz advisor IS the unfair-network amplifier. Optimising the cadence-quality is the highest-leverage GTM lever. Knowing the benchmark pattern from successful founder-advisor pairs gives concrete improvement actions.',
    expectedOutput:
      'Optimal cadence pattern (frequency, ask specificity, closed-loop reporting, equity / retainer timing) · 3 named successful founder-advisor pairs in enterprise SaaS · the 2 anti-patterns that erode the relationship.',
    priority: 'soon',
  },
  {
    id: 'agentic_shift_telemetry',
    category: 'failure_modes',
    question:
      'The agentic-shift external attack vector — measure the volume of human-authored 40-page strategy memos at F500 organisations 2026 vs 2025. Is the format declining? Where is the leading edge of agentic execution replacing memo-as-decision-artefact?',
    whyAsk:
      'External attack vector #3 (agentic shift) requires active monitoring. The moment the memo format declines faster than the wedge can close, DI must pivot to audit-layer-for-agents. Concrete telemetry sharpens the tripwire.',
    expectedOutput:
      'F500 strategy-memo volume estimate 2025 vs 2026 (with confidence interval) · 5-10 leading-edge agentic-execution examples · the named industries where agentic shift is fastest (likely supply chain, ops) · the named industries where memo format is most durable (likely M&A, fund IC).',
    priority: 'later',
  },
];

// =========================================================================
// SECTION 14 · MARKET REALITY CHECK (NotebookLM 2026-04-28 brutal-critique synthesis)
// =========================================================================

