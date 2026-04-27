/**
 * Path to $100M ARR — strategic compass + outreach playbook data.
 *
 * Grounded in NotebookLM Master KB synthesis (note `9a249bd8` external
 * attack vectors, note `75e173e9` Cialdini + buying committee, plus
 * the strengths/weaknesses + 16 investor metrics + positioning +
 * design-partner conviction + market-wedge + McKinsey QuantumBlack
 * synthesis the founder ran 2026-04-27).
 *
 * Single source of truth for the Path to $100M ARR tab. When the
 * synthesis evolves (new design partners closed, new ICP signals,
 * confirmed Cloverpop ACVs, etc.), update HERE — every visualization
 * pulls from these typed exports.
 */

// =========================================================================
// TYPES
// =========================================================================

export type Strength = {
  id: string;
  rank: number;
  title: string;
  category: 'execution' | 'intellectual' | 'narrative' | 'network' | 'compliance';
  evidence: string[];
  whyItMatters: string;
  howToWeaponize: string[];
  tripwire: string;
  nbLmCitation?: string;
};

export type Weakness = {
  id: string;
  rank: number;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  evidence: string[];
  whyItHurts: string;
  countermove: string[];
  next30Days: string;
  tripwire: string;
};

export type RolePlaybook = {
  id: string;
  role: string;
  archetype: string;
  buyerType: 'wedge' | 'expansion' | 'channel' | 'amplifier' | 'capital';
  priority: 'now' | 'q3_2026' | 'q4_2026' | '2027';
  ticketBand: string;
  whatTheyWant: string[];
  whatKeepsThemUp: string[];
  howToReach: {
    coldChannel: string;
    coldOpener: string;
    coldBlunder: string;
    warmIntroPath: string;
  };
  discoveryQuestions: {
    opening: string[];
    rigor: string[];
    decisionGate: string[];
  };
  artefactToLead: string;
  killerPitch: string;
  threePhrasesNeverToSay: string[];
  meetingArc: { minute: string; move: string }[];
  signalsToListenFor: { positive: string[]; negative: string[] };
  followUp: { day: string; artifact: string }[];
  conversionWindow: string;
  whyTheyConvert: string;
  whyTheyDont: string;
  notebookLmFollowUp: string;
};

export type InvestorMetric = {
  id: string;
  category: 'business' | 'product' | 'presentation';
  rank: number;
  name: string;
  whatItIs: string;
  diCurrent: string;
  diTarget12mo: string;
  whyItMatters: string;
  computeMethod: string;
  tripwire: string;
  status: 'on_track' | 'gap' | 'unbuilt';
};

export type FailureMode = {
  id: string;
  trap: string;
  killedCompany: string;
  diagnostic: string;
  diExposure: 'critical' | 'high' | 'medium' | 'low';
  countermove: string[];
  tripwire: string;
  whatToWatch: string;
  evidence: string;
};

export type NetworkNode = {
  id: string;
  name: string;
  role: string;
  relationship: 'family' | 'advisor' | 'school' | 'design_partner' | 'channel' | 'untapped';
  unlocks: string[];
  ask: { tier1: string; tier2: string; tier3: string };
  status: 'active' | 'warm' | 'untapped' | 'cold';
  cadence: string;
  notes: string;
  nextStep: string;
};

export type NinetyDayAction = {
  id: string;
  week: string;
  weekNumber: number;
  category: 'product' | 'gtm' | 'fundraise' | 'data' | 'positioning' | 'authority';
  action: string;
  why: string;
  successCriterion: string;
  blocker: string;
  dependsOn?: string[];
  effort: 'small' | 'medium' | 'large';
};

export type NotebookLmFollowUp = {
  id: string;
  category: 'positioning' | 'investor' | 'channel' | 'compliance' | 'failure_modes' | 'gtm';
  question: string;
  whyAsk: string;
  expectedOutput: string;
  priority: 'now' | 'soon' | 'later';
};

export type LanguagePattern = {
  id: string;
  pattern: string;
  featureFraming: string;
  protectedRevenueFraming: string;
  whyItWorks: string;
  source: string;
};

// =========================================================================
// SECTION 1 · STRENGTHS (5 — distilled from NotebookLM synthesis 2026-04-27)
// =========================================================================

export const STRENGTHS: Strength[] = [
  {
    id: 'execution_velocity',
    rank: 1,
    title: 'Unprecedented technical execution velocity',
    category: 'execution',
    evidence: [
      '12-node LangGraph pipeline + 55 Prisma models + 190,000+ lines of code, solo, at 16',
      'Operating on Claude time — full 12-week human-team roadmap shipped in one session',
      'Tier 1 + Tier 2 brainstorms (8 surfaces) shipped at category-grade depth in two days, 2026-04-27',
      'Slop-scan repoScore 739 → 584 (-21%) in one cleanup sweep; scorePerKloc 3.87 vs mature-OSS median 1.48',
    ],
    whyItMatters:
      "When an enterprise prospect says 'add SOC 2 fields to the DPR' or 'ship a Pan-African specimen,' the answer is yes by next morning. That collapses pilot → contract cycles from 6-12 months (incumbent default) to 4-6 weeks. Procurement teams notice.",
    howToWeaponize: [
      "Open every discovery call with a 7-minute live audit on a memo the prospect recognizes — show, don't tell. The artefact does the persuasion.",
      'On every design-partner call, capture one feature request and ship it before the follow-up call. The "shipped overnight" surprise IS the close.',
      'In the pre-seed pitch deck, anchor "what does Decision Intel ship in 90 days vs Cloverpop ships in 12 months" with concrete examples (DPR v2, Outcome Gate Phase 3, etc.).',
    ],
    tripwire:
      "Velocity becomes a weakness when it produces breadth without paid validation. If 90 days pass without a paid design partner, velocity is being misallocated — pause shipping, focus 100% on close.",
    nbLmCitation: 'NotebookLM strengths synthesis 2026-04-27 — point 1',
  },
  {
    id: 'academic_rigor',
    rank: 2,
    title: 'Academic rigor + R²F intellectual moat',
    category: 'intellectual',
    evidence: [
      'Published research paper on the neuro-cognitive roots of the 2008 financial crisis — verified, sourced in NotebookLM master KB',
      'Recognition-Rigor Framework (R²F) — only platform combining Kahneman debiasing (System 2) with Klein Recognition-Primed Decisions (System 1), arbitrated in one 12-node pipeline',
      'Speech on metacognition delivered at school — canonical voice-anchoring source',
      'Anchor citation: Kahneman-Klein 2009 "Conditions for Intuitive Expertise: A Failure to Disagree"',
    ],
    whyItMatters:
      "Shatters the 'teenager prejudice' before it can form. F500 procurement teams and Fortune 500 CSOs cannot dismiss a 16-year-old who has already published in their field. The 2008 paper is the credibility anchor that makes every other claim land.",
    howToWeaponize: [
      'Lead every cold outreach with the 2008 paper, not the product. The paper is the meeting-secured artefact; the product is the close.',
      'In demos, the Kahneman × Klein synthesis IS slide 2 of the pitch — never bury it. No competitor (Cloverpop, Aera, Palantir, IBM watsonx) combines both traditions.',
      'For investor calls, frame DI as "operationalising 50 years of Nobel-winning behavioral economics" — the IP moat is research-grade, not engineering trivia.',
    ],
    tripwire:
      'Stops working if a competitor (especially Cloverpop post-Clearbox) hires a behavioral-science academic and publishes a paper claiming the same synthesis. Watch their hiring page + Google Scholar quarterly.',
    nbLmCitation: 'NotebookLM strengths synthesis 2026-04-27 — point 2',
  },
  {
    id: 'tri_cultural_wedge',
    rank: 3,
    title: 'Tri-cultural Pan-African wedge (US-born, Lagos-raised, UK-resident, SF-bound)',
    category: 'narrative',
    evidence: [
      '17-framework regulatory map covering NDPR, CBN, FRC Nigeria, WAEMU, CMA Kenya, CBK, BoG, CBE, PoPIA, SARB, BoT — uniquely procurement-grade for Pan-African / EM funds',
      'Dual-anchored specimen library: WeWork S-1 (US public market shape) + Dangote 2014 Pan-African expansion (cross-border industrial expansion shape with NDPR + WAEMU sections)',
      'Sovereign-context branching in structural-assumptions prompt — Nigeria naira free-float + CBN I&E window, Kenya KES managed float, Ghana cedi + IMF cycle, WAEMU CFA-zone peg',
      'Sankore (first design-partner conversation) is a Pan-African fund — proves the wedge is operative, not theoretical',
    ],
    whyItMatters:
      'This is the only moat US-only competitors (Cloverpop, IBM watsonx, Palantir) need 12-18 months of regulatory research to match. Every Pan-African General Counsel can adopt DI without parallel compliance reviews per region — that is a procurement-cycle accelerator no incumbent bundle replaces.',
    howToWeaponize: [
      'For Pan-African / EM-fund prospects, lead with the Dangote DPR and the Lagos roots. The artefact + narrative converge.',
      'For Fortune 500 CSOs with EM exposure (most of them), surface the 17-framework map as a procurement gift — "your in-house counsel will not have to write per-region compliance memos."',
      'In investor decks, frame the wedge as "category-creating geographic moat" — not a niche play. The wedge generates references that unlock the F500 ceiling.',
    ],
    tripwire:
      "If a US incumbent partners with an African legal-services firm to ship a competing compliance map, the wedge starts compressing. Track Cloverpop / IBM watsonx press releases for 'African expansion' or 'EM partnerships' quarterly.",
    nbLmCitation: 'NotebookLM strengths synthesis 2026-04-27 — point 3 + CLAUDE.md ICP lock 2026-04-26',
  },
  {
    id: 'wiz_advisor',
    rank: 4,
    title: 'Wiz-advisor unfair-introduction network',
    category: 'network',
    evidence: [
      'Senior consultant who helped scale Wiz from startup to $32B valuation',
      'McKinsey alumni heavily saturate his network (per NotebookLM McKinsey synthesis 2026-04-27)',
      'TASIS England school network has organic first-degree connections to Oxford / LSE / Imperial — exact pipelines the McKinsey London office recruits from',
      'Strongest possible signal of trust for pre-seed investors (advisor-as-credibility-anchor pattern)',
    ],
    whyItMatters:
      'Warm introductions to F500 CSOs + McKinsey QuantumBlack partners are the single highest-leverage GTM lever a 16-year-old solo founder has. Cold outbound to CSOs converts at <0.5%; warm intros from a Wiz-credentialed advisor convert at 30-50%.',
    howToWeaponize: [
      'In every advisor 1:1, ask for ONE specific intro ranked by ROI. The McKinsey QuantumBlack path is highest-ROI per the 2026-04-27 synthesis.',
      'Send the Wiz advisor a one-pager describing Decision Intel in his vocabulary (cloud security parallels: "DI is to strategic decisions what Wiz is to cloud posture") so he can forward verbatim.',
      'Document every intro he provides and the meeting outcomes — closed-loop feedback strengthens the advisor relationship over time.',
    ],
    tripwire:
      "If 60 days pass with zero intros from the advisor, the relationship has gone passive. Either the asks are unclear, or the advisor doesn't see the wedge — surface this in the next 1:1 directly.",
    nbLmCitation: 'NotebookLM McKinsey synthesis 2026-04-27 + strengths synthesis point 4',
  },
  {
    id: 'compliance_moat',
    rank: 5,
    title: '17-framework regulatory map · procurement-grade compliance moat',
    category: 'compliance',
    evidence: [
      'EU AI Act Art 13/14/15 + Annex III mapped (the anchor tailwind, Aug 2026 enforcement)',
      'Basel III Pillar 2 ICAAP + SOX §404 + SEC Reg D + GDPR Art 22 + Colorado SB24-205 + California SB942',
      '11 internationally-recognised AI Verify Foundation principles — dedicated mapping page at /regulatory/ai-verify',
      '17 frameworks structurally derived from getAllRegisteredFrameworks().length so copy never drifts (CLAUDE.md count-discipline rule)',
    ],
    whyItMatters:
      "Regulatory tailwinds ARE the timing argument for investors. EU AI Act Art 14 record-keeping enforcement on Aug 2, 2026 — every F500 GC is rushing to clear that gate. DI is the artefact that already maps onto the regulator's vocabulary.",
    howToWeaponize: [
      'Slide 3 of every investor deck: pair the three anchor tailwinds (EU AI Act Aug 2026, SEC 2024-2026, Basel III live) with the DPR as the answer.',
      'For regulated-industry F500 prospects (banks, insurance, pharma, energy), lead with the regulatory mapping page rather than the product demo. Compliance is the on-ramp.',
      'For Pan-African funds, the African framework subset (NDPR, CBN, WAEMU, PoPIA, CMA Kenya) is the regional procurement gift no US-only incumbent matches.',
    ],
    tripwire:
      'If EU AI Act enforcement gets pushed beyond Aug 2026 (regulatory delay), the timing pressure compresses. Watch official EU Commission communications + member-state implementations monthly.',
    nbLmCitation: 'CLAUDE.md Regulatory Tailwinds lock 2026-04-22',
  },
];

// =========================================================================
// SECTION 2 · WEAKNESSES (5 — honest, ordered by severity)
// =========================================================================

export const WEAKNESSES: Weakness[] = [
  {
    id: 'cathedral_of_code',
    rank: 1,
    title: 'Cathedral of code · zero outcome data · undervalidated market',
    severity: 'critical',
    evidence: [
      '40+ features shipped, 200+ React components, 70+ API routes — more features than most Series A companies',
      'Zero paying customers as of 2026-04-27',
      'The defensible moat (per-org Brier-scored bias-flywheel) requires logged outcomes; current rotations: zero',
      'NotebookLM Q6 pre-mortem (note `9a249bd8`) named outcome-gate avoidance as the structural failure mode that kills the first paid conversion',
    ],
    whyItHurts:
      "Technical proficiency is masking the core risk: we have built a product nobody has paid to validate. The flywheel claim ('compounds quarter over quarter') is marketing language until at least one design partner closes the first 90-day outcome loop. Without that, every investor conversation defaults to 'where's the traction?' — and there is none.",
    countermove: [
      'Outcome Gate Enforcement (Phase 1 + 2 + 3 shipped 2026-04-27) — the platform now blocks new audits when outcomes are pending past 90 days, with auto-prefilled drafts for one-click resolution',
      'Integration-first onboarding playbook (Founder School lesson es_9) — workflow mapping during the discovery call, Drive polling or email forwarder live in 15 minutes before contract is signed',
      'Stop shipping horizontal features. Until first paid design partner closes, every shipping decision should answer "does this make the first 60 seconds of the demo better or close the first contract faster?"',
    ],
    next30Days:
      'Lock 3 paid design partners on the £2,000/mo Strategy contract (or equivalent) with the Outcome Gate enforced as a contractual term. Force the data flywheel to start rotating.',
    tripwire:
      'If 60 days pass with zero paid pilot signed, this weakness is no longer dormant — it is the active unicorn-killer. Stop building, start closing.',
  },
  {
    id: 'broad_positioning',
    rank: 2,
    title: 'Broad positioning · trying to be everything to everyone',
    severity: 'critical',
    evidence: [
      'Decision Intel surfaces target board governance, risk & compliance, meeting intelligence, document analysis, M&A diligence, fund IC reviews, F500 strategy memos, individual cognitive audits',
      'NotebookLM positioning synthesis 2026-04-27 named "decision-makers in enterprises" as a non-segment',
      'Empirical signal: cold conversion rate near zero — buyers cannot tell if DI is a compliance tool, a productivity app, or an M&A diligence platform',
    ],
    whyItHurts:
      'At pre-seed, "decision-makers in enterprises" is not a customer segment. Selling to everyone means closing nobody. Worse: each surface dilutes the narrative for every other surface — the F500 CSO sees "individual cognitive audits" copy and disqualifies us as not procurement-grade.',
    countermove: [
      'Lock the wedge: Pan-African / EM-focused funds + Pan-African corp dev (CLAUDE.md ICP lock 2026-04-26)',
      'F500 CSO is the 12-18 month revenue ceiling, NOT the immediate ICP — sequence the moves: wedge references → F500 introduction → ceiling expansion',
      'Audit every public surface (landing, /pricing, /demo, /security) for any copy that broadens beyond the wedge or the ceiling. Cut sprawling "for everyone" framings.',
      'Use vocabulary discipline by reader temperature (CLAUDE.md lock): cold = plain language ("60-second audit on a strategic memo"); warm = locked category vocabulary (R²F, DPR, DQI)',
    ],
    next30Days:
      'Strip the landing page and /pricing of any positioning copy that addresses individual users or non-procurement-grade buyers. Every word lands the wedge or the ceiling, nothing else.',
    tripwire:
      'If three different prospects describe DI in three different categories ("it is a compliance tool" / "it is a productivity app" / "it is an audit platform"), the positioning is still broken. Force the description.',
  },
  {
    id: 'workflow_friction',
    rank: 3,
    title: 'Pre-sale workflow friction · infinite-pilot trap risk',
    severity: 'high',
    evidence: [
      'Default onboarding requires analyst behavior change (login + manual upload) — Cloverpop\'s exact failure pattern (per Failure Modes Watchtower)',
      'Founder hours capped at 50-70/week (16-year-old, school commitments, AP load 11th grade Aug 2026 - Jun 2027)',
      'Risk: the "please pilot users" trap — building custom features for free pilots instead of forcing the hard transition to paid Strategy contract',
    ],
    whyItHurts:
      "If the analyst has to change behavior to use DI (vs. their existing email + Slack + Drive workflow), DI becomes shelfware by month three. Adoption is THE adoption metric — without it, even the few paid pilots churn before the data flywheel rotates.",
    countermove: [
      'Integration-first onboarding (Founder School es_9): map the workflow IN the discovery call, set up Google Drive polling or analyze+token@in.decision-intel.com forwarder in 15 minutes BEFORE contract',
      'Make zero behavior change the default — DI runs on the analyst\'s existing artefact stream (memos arrive in Drive → audit fires automatically → email digest summarises)',
      'On free pilots: hard 6-week ceiling, then conversion to paid. No "we will keep extending the pilot." (Founder School es_7 + es_11)',
    ],
    next30Days:
      'Document the integration-first onboarding playbook as a Loom video + written one-pager. Use it on every discovery call. Track time-to-first-audit; under 24 hours is the target.',
    tripwire:
      'If a pilot enters month four without a contract, the deal is in the infinite-pilot trap. Force the conversation: paid contract this week or the pilot ends.',
  },
  {
    id: 'procurement_blockers',
    rank: 4,
    title: 'Critical procurement blockers · client-safe export, DQI explainability, ISA 2007',
    severity: 'high',
    evidence: [
      'Client-Safe Export Mode (DPR v2) shipped 2026-04-26 — partial mitigation; widely usable but needs LP-tested validation',
      'DQI explainability: weights are research-informed estimates without statistical confidence intervals — F500 audit chairs and risk officers will reject heuristic-based financial estimates',
      'Nigerian Investment & Securities Act 2007 framework MISSING from the 17-framework map — critical Sankore-class deal-killer (Enterprise Friction Matrix flagged this 2026-04-26)',
      'EU residency: production runs Vercel + Supabase US; "EU available" is enterprise-conversation only, not provisioned',
    ],
    whyItHurts:
      'Each blocker is a procurement vetoer. A F500 GC reviewing the DPR will reject heuristic dollar estimates without confidence intervals. A Sankore General Counsel will reject DI without ISA 2007. An EU-based prospect will reject US-only data residency. Each is a "no" before the buyer reaches the value conversation.',
    countermove: [
      'Replace static counterfactual dollar impacts with 90% confidence intervals across every customer-facing dollar number',
      'Ship ISA 2007 framework module — additive to the 17-framework map (becomes 18) — needed for Sankore + every other Nigerian fund / corp dev prospect',
      'EU residency: provision Vercel EU + Supabase EU on a roadmap with named quarter; until provisioned, the disclaimer language stays per CLAUDE.md lock',
      'Audit-committee-grade DPR variant: every claim cited, every model named, every framework version-stamped, every figure carries CIs — designed for the F500 audit-chair persona',
    ],
    next30Days:
      'Ship ISA 2007 framework + DQI confidence intervals on counterfactual outputs. Both are mechanical — no design partner approval needed.',
    tripwire:
      'If a procurement reviewer (GC, risk officer, audit chair) flags a fourth blocker we did not anticipate, treat it as a category problem (we are not yet procurement-ready) — pause sales, close the gap, then resume.',
  },
  {
    id: 'continuity_question',
    rank: 5,
    title: 'Founder continuity · 16-year-old solo · no co-founder',
    severity: 'medium',
    evidence: [
      'Solo technical founder, age 16 (10th grade as of April 2026, AP system US school in UK)',
      'Plans to move to San Francisco at 18 for university (Stanford or UC Berkeley target, applications November 2027)',
      'No co-founder; no senior employee; no business operating partner',
      '11th grade AP load Aug 2026 - Jun 2027: AP Cyber Security · AP Calculus AB · AP English Language · AP Microeconomics + AP Statistics · Honors Physics (~250 min/week study halls; effective DI capacity 50-70+ hours/week)',
    ],
    whyItHurts:
      'Investors and design partners will ask: "what happens to Decision Intel if Folahan goes to college and university coursework consumes 60 hours/week?" Without a credible continuity plan, deals stall at the "who runs this in 2027" question.',
    countermove: [
      'Recruit GTM / enterprise-sales co-founder or advisor (CLAUDE.md fundraising context calls this out as a stated need)',
      'Document the operating cadence + the codebase-as-the-company narrative — any senior full-stack engineer can onboard in weeks (this IS the continuity story when framed correctly)',
      'For Stanford / Berkeley application timing: frame Decision Intel as the application centerpiece, not a side project — university accepts 16-year-old solo founder OR university adapts to the company. Founder School lesson ldr_8 is reference material here.',
      'For investor conversations: pre-empt the continuity question with a "continuity playbook" slide — co-founder search status, senior-engineer onboarding plan, advisor escalation tree',
    ],
    next30Days:
      'Draft a 1-page continuity playbook for inclusion in the pre-seed deck. Begin GTM co-founder search via Wiz-advisor network and a small set of operator-stage angels.',
    tripwire:
      'If three investors in a row name continuity as the no-go reason, the playbook is insufficient — escalate to recruiting an interim CEO or part-time GTM lead immediately.',
  },
];

// =========================================================================
// SECTION 3 · ROLE OUTREACH PLAYBOOKS (8 personas — the centerpiece)
// =========================================================================

export const ROLE_PLAYBOOKS: RolePlaybook[] = [
  // -----------------------------------------------------------------------
  // 1. PAN-AFRICAN FUND PARTNER — the wedge buyer
  // -----------------------------------------------------------------------
  {
    id: 'pan_african_fund_partner',
    role: 'Pan-African / EM Fund Partner',
    archetype:
      'Sankore-class · $200M-$2B AUM · capital-allocation pressure across NGN/KES/GHS/EGP/CFA · IC-cycle calendar · procurement-grade compliance need (NDPR, CBN, WAEMU, PoPIA)',
    buyerType: 'wedge',
    priority: 'now',
    ticketBand:
      '£2,000-3,000/mo design partner → £30-50K ARR after 3 IC cycles · expansion path to firm-wide seat after 6 months',
    whatTheyWant: [
      'Edge: a tool that catches blind spots BEFORE the IC vote — the "post-close partner question that starts with why didn\'t we see that in Q3" goes away',
      'Cross-border procurement gift: one tool that handles NDPR + CBN + WAEMU + PoPIA + CMA Kenya — saves their GC from per-region compliance memos',
      'Capital-allocation discipline: structured FX-cycle + sovereign-context analysis on every memo (Nigeria naira free-float, Kenya KES managed float, etc.)',
      'IC artefact: a hashed, tamper-evident DPR for LP reporting — the Client-Safe Export Mode is non-negotiable',
    ],
    whatKeepsThemUp: [
      'A bad call landing badly with the LP base — the Sequoia-LP question "what is your decision quality process?"',
      'FX volatility wiping a thesis they already have committed capital toward',
      'Local regulatory exposure they did not know about (NDPR fine, CBN restriction, WAEMU rule change)',
      'A GP-level mistake that becomes a fund-strategy question at LPAC',
    ],
    howToReach: {
      coldChannel:
        'LinkedIn DM with the Dangote DPR PDF attached, OR a Sankore-style warm intro via the Wiz advisor network (preferred 5×).',
      coldOpener:
        '60-second audit on a strategic memo. Attached: an anonymised Decision Provenance Record on the 2014 Dangote Pan-African expansion plan. Same audit fires on your IC memos in 60 seconds. Worth a 20-minute call to walk you through one of yours?',
      coldBlunder:
        '"Decision intelligence platform powered by AI" — generic SaaS framing reads as US-import noise; the partner deletes the message in 3 seconds. NEVER lead cold with "reasoning layer," R²F, DPR, or DQI as first impressions.',
      warmIntroPath:
        'Wiz advisor → Pan-African fund partners in his network → 30-min framing call → live audit on a redacted IC memo from a deal of theirs that went sideways.',
    },
    discoveryQuestions: {
      opening: [
        '"Walk me through the last IC memo that landed badly. What did the analyst believe was the weakest assumption? Did it survive into the final memo?"',
        '"When a deal goes sideways post-close, who reconstructs the decision rationale? How long does it take?"',
        '"Across the last 12 months, how many IC memos have you written? How many touched FX-volatile jurisdictions?"',
      ],
      rigor: [
        '"If you had a 60-second audit BEFORE every IC vote — naming the 2-3 cognitive biases the room would catch first — which past deal would have ended differently?"',
        '"Your GC currently writes per-region compliance memos. What would change if every IC artefact already mapped to NDPR, CBN, WAEMU, and PoPIA?"',
        '"For the LP report, what is the audit-trail standard? Who is the toughest LP on decision-process documentation?"',
      ],
      decisionGate: [
        '"If we ran a 6-month design partnership — retro-auditing 3 dead deals + your live IC memos — what would the success metric be at month 6?"',
        '"What is your typical SaaS-tool procurement cycle? Who needs to see the DPR specimen before contract signature?"',
        '"If we close a £2,499/mo contract today and you log 10 outcomes by Q3, can we publish an anonymised reference case in Q4?"',
      ],
    },
    artefactToLead:
      'Dangote DPR (public/dpr-sample-dangote.pdf) — the anonymised 2014 Pan-African industrial expansion audit, with NDPR/CBN/WAEMU mapping section.',
    killerPitch:
      'Consulting firms charge you $1M to tell you about cognitive bias — and they have the same biases themselves. We built an AI that does not. For your IC cycle, this is a £30K/year insurance premium on every capital-allocation decision, with the regulatory map your GC already needs.',
    threePhrasesNeverToSay: [
      '"Decision intelligence platform" — Gartner-crowded, codes as Cloverpop / Aera / Quantellia',
      '"AI-powered" alone — buyer hears "ChatGPT wrapper"; the R²F + 12-node architecture differentiation gets lost',
      '"Boardroom strategic decision" — funds do not have boards; the language cues "this is built for F500, not us"',
    ],
    meetingArc: [
      { minute: '0:00-1:30', move: 'Frame: "60-second audit on every memo before IC. Here is one we ran on Dangote 2014."' },
      { minute: '1:30-3:00', move: 'Live audit on a redacted IC memo they brought (or on Dangote DPR if they did not).' },
      { minute: '3:00-5:00', move: 'Walk through 2-3 flagged biases and the regulatory framework cross-mapping.' },
      { minute: '5:00-7:00', move: 'Show DQI + counterfactual + Client-Safe Export Mode for LP reporting.' },
      { minute: '7:00-12:00', move: 'Discovery questions (above) — surface the post-close partner-question pain.' },
      { minute: '12:00-18:00', move: 'Discuss Design Partnership shape: 3 retro-audits + live IC memos for 6 months at £2,499/mo.' },
      { minute: '18:00-20:00', move: 'Close: "Two slots remain in the design-partner cohort. Are you the Pan-African anchor?"' },
    ],
    signalsToListenFor: {
      positive: [
        'They bring a redacted IC memo without being asked',
        'They name a specific past deal that went sideways within the first 5 minutes',
        'They ask about LP-reporting and Client-Safe Export Mode',
        'They reference their fund\'s cross-border IC volume as a number ("we did 12 deals last year across 5 countries")',
      ],
      negative: [
        'They reach for "we already have a process" without naming what the process IS',
        'They ask about pricing in minute 3 (signals procurement-deflection, not engaged buying)',
        'They cannot name the last bad call — usually means they are not the IC decision-maker',
      ],
    },
    followUp: [
      { day: 'T+0 (4 hours after meeting)', artifact: 'Thank-you note + Dangote DPR + the 2008 financial-crisis paper PDF + 1-page summary of what was discussed' },
      { day: 'T+24h', artifact: 'Live audit run on a redacted version of THEIR memo, with the 2-3 biggest flags + counterfactual delta highlighted' },
      { day: 'T+72h', artifact: 'Design-partnership term sheet (1 page): £2,499/mo, 6 months, 3 retro-audits + live IC, weekly Brier-score sync, Outcome Gate enforced contractually' },
      { day: 'T+7d', artifact: 'Single concrete next step: "Either the term sheet works, or we found we are not a fit. Either way I want to know by Friday."' },
    ],
    conversionWindow: '2-3 meetings · 4-6 weeks · paid contract or paid no within 60 days',
    whyTheyConvert:
      'They evaluate evidence for a living. The Dangote DPR + the live audit on their own memo is unfakeable proof that DI catches things their current process misses. The Pan-African regulatory map clears their GC procurement gate in one artefact.',
    whyTheyDont:
      'They are mid-IC-cycle and have no bandwidth to onboard a new tool. OR: their fund AUM is below $200M and they are too small to justify $30K/year. OR: they have been burned by a prior US SaaS vendor who did not understand African regulatory regimes — earn that trust back with the Dangote DPR before talking pricing.',
    notebookLmFollowUp:
      'What does success look like at Day 90 of a Sankore-class design partnership? Specific metrics, owner, artefacts, and the LP-facing reference-case shape we should target for Q4 publication.',
  },

  // -----------------------------------------------------------------------
  // 2. F500 CHIEF STRATEGY OFFICER — the revenue ceiling
  // -----------------------------------------------------------------------
  {
    id: 'f500_cso',
    role: 'Fortune 500 Chief Strategy Officer',
    archetype:
      'Reports to CEO · $50-150M strategy budget · ships 40-60 strategic recommendations / year · audit-committee + board are the ultimate consumers · incumbent advisor: McKinsey / BCG / Bain at $500K-$5M per engagement',
    buyerType: 'expansion',
    priority: 'q4_2026',
    ticketBand: '£50-150K ARR · multi-seat Strategy contract · 12-month auto-renew · enterprise security review',
    whatTheyWant: [
      'A 60-second hygiene step BETWEEN the analyst and the steering committee — names the exact biases the room will catch first',
      'A board-ready DPR artefact for every recommendation — defends the call when audit committee asks "how was this decided"',
      'EU AI Act Art 14 + SOX §404 + Basel III internal-controls coverage out of the box (procurement-grade)',
      'Quantitative DQI score that survives audit-chair scrutiny — confidence intervals, named methodology, version-stamped',
    ],
    whatKeepsThemUp: [
      'A board recommendation landing badly because of a blind spot the analyst missed',
      'The post-board question "why was this not flagged earlier" — career-defining moment',
      'Audit committee asking "what is your strategic-recommendation quality process" — having no answer',
      'A regulator request under EU AI Act Art 14 — having no audit trail for AI-augmented strategic decisions',
    ],
    howToReach: {
      coldChannel:
        'Warm intro from Wiz advisor preferred. Cold-acceptable: targeted LinkedIn DM with WeWork DPR + the 2008 paper, after 3-5 LinkedIn content engagements over 30 days.',
      coldOpener:
        'You ship 40-60 strategic recommendations a year that go to your steering committee. Three years ago there was no way to audit the reasoning behind those memos in 60 seconds — names the biases, scores the rigor, generates a Decision Provenance Record. Now there is. 20-minute call worth your time?',
      coldBlunder:
        '"Disrupting strategy consulting" or "the McKinsey alternative" — CSO defaults to defensive ("our consultants are great"). Do not position AGAINST the consultants in cold; they are the buyer\'s peers. Position WITH consultants in warm conversations.',
      warmIntroPath:
        'Wiz advisor → his McKinsey-alumni network → introductions to F500 CSOs in his coverage portfolio. Per the NotebookLM McKinsey synthesis, this is the highest-ROI advisor ask.',
    },
    discoveryQuestions: {
      opening: [
        '"Walk me through the last strategic memo that landed badly. What was the analyst\'s weakest assumption? Did it survive into the final memo?"',
        '"For your steering committee, what is the average prep time per recommendation? Who is the harshest internal critic?"',
        '"On a typical board-ready memo, what does your team currently do for bias / blind-spot review BEFORE the steering committee sees it?"',
      ],
      rigor: [
        '"If you had a 60-second audit on every memo BEFORE the steering committee — naming the 2-3 biases the room would catch first, with a DQI score and a confidence interval — what would change about your process?"',
        '"For audit committee, what is the standard for documenting strategic-recommendation rationale? When was the last time you had to defend a call from 18 months ago?"',
        '"Under EU AI Act Article 14, you will need record-keeping on AI-augmented strategic decisions starting Aug 2026. What is your current plan?"',
      ],
      decisionGate: [
        '"If we ran a 6-month enterprise pilot — auditing the next 30 strategic memos plus retro-auditing 5 from the last quarter — what would the success metric be at month 6?"',
        '"What is your typical SaaS-tool procurement cycle for an enterprise contract? Who needs to see the DPR + security posture before signature?"',
        '"For the eventual reference case — would you co-publish an anonymised case study at month 12, or is that a non-starter for your industry?"',
      ],
    },
    artefactToLead:
      'WeWork S-1 DPR (public/dpr-sample-wework.pdf) — anonymised 2019 audit on the famously biased filing — surfaces founder-overconfidence, anchoring, and disclosure-asymmetry. Pair with the 2008 paper as the credibility anchor.',
    killerPitch:
      'You don\'t have a process for auditing strategic memos before they reach the board, because three years ago it was not technically possible. Now it is. Decision Intel is the 60-second hygiene step between your analyst and the committee — it makes your VP of Strategy the adult in the room on every recommendation.',
    threePhrasesNeverToSay: [
      '"Replace your consultants" — CSO needs consultants for political cover; never positioned as a competitor',
      '"AI-powered strategic platform" — buzzword bingo; CSO has heard it from 14 vendors this year',
      '"For founders / for individual users" — F500 CSO disqualifies as not procurement-grade in 2 seconds',
    ],
    meetingArc: [
      { minute: '0:00-1:30', move: 'Frame: "Hygiene step between analyst and steering committee. Here is the WeWork S-1 audit."' },
      { minute: '1:30-3:00', move: 'Walk through the WeWork DPR — biases flagged, regulatory mapping, DQI score, audit-committee artefact shape.' },
      { minute: '3:00-5:00', move: 'Live audit on a redacted memo they brought (or offer to do this on the next call if they did not).' },
      { minute: '5:00-12:00', move: 'Discovery questions — surface the steering-committee pain, the audit-committee documentation gap, the EU AI Act Art 14 timing.' },
      { minute: '12:00-18:00', move: 'Position: 6-month enterprise pilot, 30 live memos + 5 retro, security review starts in parallel.' },
      { minute: '18:00-20:00', move: 'Close: "What is the next step on your side? Who else needs to see the WeWork DPR?"' },
    ],
    signalsToListenFor: {
      positive: [
        'They name a specific past memo that went badly within the first 10 minutes',
        'They ask about EU AI Act Art 14 or audit-committee documentation by minute 15',
        'They volunteer the procurement contact unprompted',
        'They mention the audit-committee chair by name',
      ],
      negative: [
        'They keep redirecting to "send me a deck and I will share with the team" — typical procurement-deflection; insist on a second meeting first',
        'They ask "what makes you different from Cloverpop" — answer with the R²F intellectual moat + the 17-framework regulatory map; if they push back further, they may have a Cloverpop bias',
        'They cannot name the audit-committee chair — usually means they are NOT the right buyer; ask for an intro',
      ],
    },
    followUp: [
      { day: 'T+4h', artifact: 'Thank-you + WeWork DPR + the 2008 paper + 1-page summary of the strategic-memo audit pain we surfaced' },
      { day: 'T+48h', artifact: 'Live audit run on a redacted recent memo (if they shared one) OR a famous failed strategic call from their industry' },
      { day: 'T+1w', artifact: 'Enterprise pilot proposal: 6 months, 30 live + 5 retro, security review schedule, success metric, conversion price' },
      { day: 'T+2w', artifact: 'Single concrete next step — "Procurement intro by next Friday or this is not the right time for your org"' },
    ],
    conversionWindow: '4-6 meetings · 12-24 weeks · enterprise procurement timeline · contract by month 6 of conversation',
    whyTheyConvert:
      'The WeWork DPR makes the audit committee comfortable. The R²F intellectual moat (Kahneman + Klein synthesis) survives McKinsey-trained scrutiny. The 17-framework regulatory map clears procurement on first pass. The DPR is the EU AI Act Art 14 answer that nobody else has.',
    whyTheyDont:
      'Continuity question (16-year-old solo founder). Reference-case maturity (no F500 logos yet). Procurement-checkbox gaps (SOC 2 Type II is infrastructure-only; full Type II audit pending). Address each in the 1-page continuity playbook + by-name reference to the wedge cases that will close in 2026.',
    notebookLmFollowUp:
      'What is the typical procurement cycle length for a F500 audit committee approving a new SaaS tool, broken down by stage (initial review, security review, legal review, vendor risk register, contract negotiation)? What is the cycle compression we would get from EU AI Act Art 14 timing pressure?',
  },

  // -----------------------------------------------------------------------
  // 3. F500 M&A HEAD / CORP DEV DIRECTOR
  // -----------------------------------------------------------------------
  {
    id: 'f500_ma_head',
    role: 'F500 M&A Head / Corporate Development Director',
    archetype:
      'Reports to CFO or Strategy · 5-15 deals/year · ticket sizes $50M-$2B · IC cycle every 4-6 weeks · post-close synergy targets are personally tracked · 70-90% of M&A deals fail to create expected value (Harvard / McKinsey baselines)',
    buyerType: 'expansion',
    priority: 'q3_2026',
    ticketBand:
      '£30-80K ARR · per-deal audit pricing for spike-volume firms ($1K-3K per deal) · annual seat for high-cadence corp dev shops',
    whatTheyWant: [
      'Pre-IC bias audit on the deal thesis — confirmation, sunk-cost, base-rate neglect surfaced BEFORE the partner vote',
      'Cross-document conflict detection on the deal room (CIM + financial model + counsel memo + IC deck) — all 4 audited together',
      'Historical-pattern matching against the 135-case library — "this thesis hits the same pattern Kraft-Heinz did on Unilever"',
      'Deal-level composite DQI + tamper-evident DPR for post-close diligence reviews',
    ],
    whatKeepsThemUp: [
      'A deal closing that the team should have killed in IC — career-killing moment',
      'A post-close "why didn\'t we see that in Q3" question from the partner who voted yes',
      'A regulator Q&A under EU Merger Regulation or Hart-Scott-Rodino with no audit trail',
      'An LP / activist-investor letter post-deal asking for the decision-quality documentation',
    ],
    howToReach: {
      coldChannel:
        'LinkedIn DM with the WeWork DPR + a teaser flag from the 2014 Dangote expansion (cross-border M&A precedent). Warm intro via Wiz advisor or via a portfolio CFO who has used DI on a strategy memo.',
      coldOpener:
        'Pre-IC bias audit on the deal thesis in 60 seconds. Cross-document conflict detection across CIM, model, counsel memo, IC deck. Pattern-match against 135 deal-failure cases. Worth a 20-min call before your next IC?',
      coldBlunder:
        '"M&A intelligence platform" — buyer hears Quantexa or DealCloud, defaults to "we already have that." Lead with the bias-audit + the historical-pattern match, NOT the data layer.',
      warmIntroPath:
        'Wiz advisor → portfolio-company CFO or Corp Dev director who has run a memo through DI → intro to peer at a non-portfolio firm.',
    },
    discoveryQuestions: {
      opening: [
        '"Walk me through the last deal where the partner question post-close started with why didn\'t we see X. What was X? When did the team first notice X in the data room?"',
        '"For the average IC cycle, how many days between deal-team thesis lock and partner vote? What is the bias-review step in that window?"',
        '"Of last year\'s deals — what is the synergy realisation vs IC projection? Where do the gaps come from?"',
      ],
      rigor: [
        '"If you had 60-second pre-IC audits on every deal thesis — flagging confirmation bias, sunk-cost anchoring, base-rate neglect — would your IC vote pattern change on any past deal?"',
        '"For cross-document conflict detection — how often does your team find a contradiction between the CIM and the financial model AFTER IC has voted? What does that cost?"',
        '"For the audit committee, what is the standard for documenting deal rationale? When was the last time you had to defend a 2-year-old call?"',
      ],
      decisionGate: [
        '"If we ran a 3-deal pilot — pre-IC audit on every memo plus retro-audit of last year\'s top-5 closed deals — what would the success metric be?"',
        '"For pricing, would per-deal audit ($2K-3K per IC submission) or annual seat ($50K) work better for your cadence?"',
        '"Who needs to see the deal-level DPR before contract — Legal, GC, CFO, audit chair?"',
      ],
    },
    artefactToLead:
      'WeWork S-1 DPR (US public-market shape) for global firms. Dangote 2014 DPR for cross-border / EM-exposure firms. Both surface deal-thesis biases of the kind their IC vote would have caught.',
    killerPitch:
      '70-90% of M&A deals fail to create the value the IC voted for. The pattern is rarely missing data — it is unflagged confirmation bias, sunk-cost anchoring, and base-rate neglect that survived into the final memo. Decision Intel runs the bias audit + cross-doc conflict scan in 60 seconds before IC, and the deal-level DPR is the artefact your audit committee asks for after close.',
    threePhrasesNeverToSay: [
      '"M&A intelligence platform" — generic, gets lumped with Quantexa / DealCloud / DealRoom',
      '"For the M&A team" alone — bypasses the IC voter who is the real buyer; address the IC voter directly',
      '"Replace diligence" — never; we are the LAYER ON TOP of diligence, the bias-audit + reasoning-record-keeping artefact',
    ],
    meetingArc: [
      { minute: '0:00-1:30', move: 'Frame: "Bias audit + cross-doc conflict + DPR for the audit committee."' },
      { minute: '1:30-4:00', move: 'Live audit on a redacted IC deck or on the WeWork S-1 — show 4-doc cross-reference (CIM + model + counsel + IC deck).' },
      { minute: '4:00-7:00', move: 'Walk historical-pattern match: "your thesis hits the same pattern Kraft-Heinz did on Unilever — here is the counterfactual."' },
      { minute: '7:00-12:00', move: 'Discovery — surface the post-close partner-question pain, the IC-cycle bottleneck.' },
      { minute: '12:00-18:00', move: 'Pricing options — per-deal vs annual seat. Pilot shape: 3 deals + 5 retro.' },
      { minute: '18:00-20:00', move: 'Close: "When is the next IC? Can we run the audit on that thesis BEFORE the vote?"' },
    ],
    signalsToListenFor: {
      positive: [
        'They name a specific deal where the IC voter caught a blind spot post-close',
        'They ask about cross-document conflict detection unprompted',
        'They volunteer the audit committee\'s next-meeting date',
        'They reference a specific historical M&A failure and ask "would you have caught this"',
      ],
      negative: [
        'They redirect to "send the deck to procurement" — corp dev rarely owns procurement, this is a deflection',
        'They ask about integration with their existing data room (Datasite, Intralinks) without engaging the bias-audit value — usually means they want a feature, not a tool',
        'They cannot name a recent IC-vote regret — usually means they are too new or not in the deal flow',
      ],
    },
    followUp: [
      { day: 'T+4h', artifact: 'Thank-you + WeWork DPR + cross-doc conflict cheat-sheet (1 page) + the 2008 paper as credibility anchor' },
      { day: 'T+24h', artifact: 'Live audit run on a redacted recent deal thesis (if shared) OR on a public M&A failure in their sector' },
      { day: 'T+1w', artifact: '3-deal pilot proposal — pre-IC audit + 5 retro audits, weekly Brier sync, deal-level DPR for audit committee, $X per deal or $Y annual seat pricing' },
      { day: 'T+2w', artifact: 'Single concrete next step — "Pre-IC audit on your next deal by Friday, or we are not the right tool for this cycle"' },
    ],
    conversionWindow: '3-5 meetings · 8-16 weeks · IC-cycle aligned · paid pilot by month 3 of conversation',
    whyTheyConvert:
      'The 60-second pre-IC audit is genuinely 10× faster than the next 60 seconds of analyst review. The historical-pattern match against the 135-case library is unfakeable. The deal-level DPR is the artefact the audit committee already asks for verbally; we just generate it.',
    whyTheyDont:
      'Their existing diligence-tool stack (Datasite + Intralinks + a custom M&A scorecard) is sticky and they see DI as redundant. Counter: the bias-audit + DPR is NOT in any of those tools; we are layer-on-top, not replacement. Show them.',
    notebookLmFollowUp:
      'What is the per-deal pricing benchmark for M&A AI tools sold to F500 corp dev teams in 2026? Examples (DealRoom, DealCloud, Quantexa) with public ACVs.',
  },

  // -----------------------------------------------------------------------
  // 4. F500 GENERAL COUNSEL / AUDIT COMMITTEE CHAIR
  // -----------------------------------------------------------------------
  {
    id: 'f500_gc_audit_chair',
    role: 'F500 General Counsel / Audit Committee Chair',
    archetype:
      'Procurement gatekeeper · risk-management orientation · EU AI Act Art 14 + SOX + Basel III + GDPR Art 22 are personal worry-list · vendor-risk-register reviews every new SaaS · Reuters-headline allergy',
    buyerType: 'expansion',
    priority: 'q4_2026',
    ticketBand:
      '£80-200K ARR · enterprise-tier pricing · contractual SLAs · DPA + ISO 27001 expectations · multi-year commits common',
    whatTheyWant: [
      'Hashed + tamper-evident DPR for every AI-augmented strategic decision — EU AI Act Art 14 record-keeping by design',
      'Cross-mapping of every flag to a named regulatory provision — auditable, defensible, version-stamped',
      'Client-Safe Export Mode for shareable artefacts (LP, regulator, third-party assurance)',
      'Clear sub-processor list, data-lifecycle disclosure, retention windows, indemnification, exit-assistance, audit rights',
    ],
    whatKeepsThemUp: [
      'A regulator request under EU AI Act Art 14 that the company cannot answer in writing',
      'An audit-committee question "do we have governance on AI-augmented decisions" — having no documented answer',
      'A class-action or short-seller letter citing a strategic-recommendation gap that should have been flagged',
      'Vendor risk: a SaaS tool with weak posture creating a third-party data-breach incident',
    ],
    howToReach: {
      coldChannel:
        'Almost never cold. Reach via the CSO or M&A head once they have engaged. The GC is a procurement gate, not a primary buyer — surface DI to them via the warm internal champion.',
      coldOpener:
        'N/A — do not lead cold to the GC. If absolutely required: "Decision Intel maps onto EU AI Act Article 14 record-keeping by design. 17-framework regulatory map. Would your GC team review the DPR specimen + Terms appendix?"',
      coldBlunder:
        'Leading with bias-detection — the GC does not buy "bias detection," they buy "regulatory record-keeping." Frame the product entirely around EU AI Act Art 14 + SOX + Basel III answers.',
      warmIntroPath:
        'CSO or M&A head champions DI internally → introduces GC into the conversation in meeting 3 → GC reviews DPR specimen + DPA + Terms appendix in parallel with vendor-risk register.',
    },
    discoveryQuestions: {
      opening: [
        '"What is your current plan for EU AI Act Article 14 record-keeping on AI-augmented strategic decisions, given the Aug 2026 enforcement date?"',
        '"For audit-committee questions on strategic-recommendation governance, what is the artefact you can produce in writing?"',
        '"Under SOX §404 and Basel III ICAAP, what is the documented internal-controls process for qualitative strategic decisions?"',
      ],
      rigor: [
        '"If every strategic-recommendation memo carried a hashed + tamper-evident DPR mapping each flag to a named regulatory provision — what would change about your audit-committee posture?"',
        '"For LP / regulator / third-party-assurance shareability, what is your current artefact? How long does it take to produce?"',
        '"For the vendor-risk register, what are the procurement-grade gates we will need to clear (SOC 2, ISO 27001, DPA, sub-processor list, data residency, exit assistance)?"',
      ],
      decisionGate: [
        '"What is the timeline for vendor-risk-register approval if security and legal start in parallel?"',
        '"Who else needs to see the DPR + DPA + Terms appendix before contract?"',
        '"What is the procurement-grade DPA shape we will need? Standard contractual clauses, IDTA, NDPR transfer agreement — which apply?"',
      ],
    },
    artefactToLead:
      'DPR specimen + Terms appendix from the public Enterprise Quote PDF + the /security regulatory-tailwinds page + the /privacy GDPR-Art-13 mandatory-disclosure block. The GC reads regulatory artefacts, not product demos.',
    killerPitch:
      'Decision Intel is the reasoning layer the Fortune 500 needs before regulators start asking. EU AI Act Art 14 record-keeping. Basel III Pillar 2 ICAAP qualitative-decision documentation. SOX §404 internal controls. 17 frameworks mapped flag-by-flag. Hashed and tamper-evident DPR on every audit. Your audit committee does not have to take the tool on faith — they review each flag against its cited regulatory source in a single artefact.',
    threePhrasesNeverToSay: [
      '"AI does the work" — GC hears liability. Frame as "the human decision-maker is in control; AI provides the audit layer they are required to produce anyway."',
      '"It is just for strategic memos" — narrows scope; the GC needs the same governance for M&A theses, fund IC memos, board recommendations',
      '"Cloud-hosted on Vercel + Supabase" without context — leads to data-residency questions; lead with regulatory framework coverage, then technical posture',
    ],
    meetingArc: [
      { minute: '0:00-2:00', move: 'Frame: "EU AI Act Art 14 + SOX + Basel III + GDPR Art 22 + 17-framework map. We are the artefact that satisfies all five."' },
      { minute: '2:00-5:00', move: 'Walk through the DPR cover page → integrity fingerprints → regulatory-mapping section → reviewer-decisions HITL log → data-lifecycle footer.' },
      { minute: '5:00-10:00', move: 'Walk through the Terms appendix — indemnification, SLA, exit assistance, sub-processor change notification, audit rights.' },
      { minute: '10:00-15:00', move: 'Discovery — surface the GC\'s specific framework concerns + vendor-risk-register gates.' },
      { minute: '15:00-20:00', move: 'Procurement timeline — security review, legal review, vendor risk, contract — agreed sequencing.' },
    ],
    signalsToListenFor: {
      positive: [
        'They open the DPR specimen and immediately read the Verification block + sub-processor list',
        'They reference EU AI Act Art 14 by article number unprompted',
        'They ask about indemnification + audit rights + exit assistance in writing',
        'They volunteer to escalate to procurement on a defined timeline',
      ],
      negative: [
        'They focus only on data residency (US vs EU) — usually means they have an EU-only mandate; honour the disclaimer language and offer the EU residency roadmap',
        'They ask "where is your SOC 2 Type II report" — current state is infrastructure-aligned; surface the trust-copy.ts language and the Type II target date',
        'They want a custom DPA without a baseline — this is a deal-killer; point them to the existing DPA template and negotiate from there',
      ],
    },
    followUp: [
      { day: 'T+4h', artifact: 'Thank-you + DPR specimen PDF + Terms appendix + DPA template + sub-processor list + 1-page summary of compliance posture' },
      { day: 'T+48h', artifact: 'Specific responses to each procurement question raised (in writing) + vendor-risk-register draft answers' },
      { day: 'T+1w', artifact: 'Procurement-timeline proposal — security review week 1-2, legal review week 2-3, contract negotiation week 3-4' },
      { day: 'T+2w', artifact: 'Single concrete next step — "Vendor-risk-register sign-off by Friday or we move target sign date to next quarter"' },
    ],
    conversionWindow: '4-8 weeks of procurement-stage work · runs in parallel with the CSO or M&A buying conversation · NOT a separate sales cycle, a separate gate',
    whyTheyConvert:
      'The DPR + Terms appendix is the most procurement-grade vendor artefact they have seen for a SaaS in their inbox this year. The 17-framework map closes the regulatory gap they were already worrying about. The trust-copy.ts vocabulary discipline ("hashed + tamper-evident", not "signed + hashed") signals operational honesty.',
    whyTheyDont:
      'SOC 2 Type II audit not yet complete (infrastructure-aligned today, full audit pending). Address with the trust-copy.ts language + a target completion date.',
    notebookLmFollowUp:
      'What does a F500 vendor-risk-register questionnaire look like in 2026? Top 30 questions an audit-committee chair will ask of a new AI SaaS vendor before sign-off.',
  },

  // -----------------------------------------------------------------------
  // 5. MANAGEMENT CONSULTANT (McKinsey / BCG / Bain)
  // -----------------------------------------------------------------------
  {
    id: 'management_consultant',
    role: 'Management Consultant Partner (McKinsey QuantumBlack / BCG GAMMA / Bain Advanced Analytics)',
    archetype:
      'Sells $500K-$5M strategy / AI-transformation engagements · F500 CSO is their buyer · embeds analytical tools as engagement line items · alliances org actively packages AI tooling with engagements (e.g., McKinsey × Credo AI, McKinsey × C3 AI)',
    buyerType: 'channel',
    priority: 'q3_2026',
    ticketBand:
      'Channel partnership · revenue share or per-seat licensing · DI is line-item in the consulting engagement · indirect ARR from co-sells · long-term: F500 CSO pull-through into direct DI ARR',
    whatTheyWant: [
      'A tool that sharpens their analytical work without competing for the strategy seat',
      'AI governance positioning for the EU AI Act Aug 2026 enforcement that fits their existing engagement vocabulary',
      'A partnership that lets them say "we layer Decision Intel into your strategic-decision process" in client pitches',
      'Co-publishable content (joint research, conference talks, white papers) that elevates both brands',
    ],
    whatKeepsThemUp: [
      'Generative-AI displacement — boutique AI shops eating engagement margin',
      'Client question "what is your AI governance answer for EU AI Act Art 14"',
      'Internal partner pressure on engagement-margin compression',
    ],
    howToReach: {
      coldChannel:
        'Wiz advisor → his McKinsey-alumni network (heavily saturated per NotebookLM 2026-04-27 synthesis) → introduction to a McKinsey QuantumBlack senior partner (target: Lieven Van der Veken or Head of Alliances).',
      coldOpener:
        'For QuantumBlack engagement teams, Decision Intel is the EU AI Act Art 14 record-keeping artefact + the bias-audit layer that fits inside your analytical-transformation engagements. Worth a 30-min peer-level conversation about what an alliance shape would look like?',
      coldBlunder:
        'Pitching as a competitor. Consultants buy AI tooling that AMPLIFIES the engagement, never replaces the analytical seat. Frame DI as "we are the audit layer; you are the strategy."',
      warmIntroPath:
        'Wiz advisor (McKinsey alumni network) → MD-level intro at QuantumBlack → 30-min framing call → category-conversation, not vendor-pitch.',
    },
    discoveryQuestions: {
      opening: [
        '"For your analytical-transformation engagements, how are you currently positioning EU AI Act Article 14 record-keeping for your F500 clients?"',
        '"Inside QuantumBlack engagements, what is the typical AI tooling embedded in the deliverable? How does the alliances org evaluate new partners?"',
        '"Your team\'s view on Cloverpop, Aera, IBM watsonx — what gaps do you see those tools leave in your client engagements?"',
      ],
      rigor: [
        '"If we ran a co-pilot engagement — your strategy partner + DI as the audit-layer artefact — what would the client-facing deliverable look like?"',
        '"For the alliance shape, what is the typical commercial structure (revenue share, per-seat, embedded license, joint marketing)?"',
        '"For the co-publishable angle — joint research, conference talk, white paper — what does QuantumBlack\'s alliances calendar look like?"',
      ],
      decisionGate: [
        '"For a 90-day pilot embedded in one of your live engagements — what would the success metric be?"',
        '"Who else inside QuantumBlack needs to evaluate the partnership before sign?"',
        '"What is the typical alliance-onboarding timeline at McKinsey — 6 weeks, 3 months, longer?"',
      ],
    },
    artefactToLead:
      'A category-conversation deck (peer-level) — NOT a sales deck. The 2008 paper + the R²F intellectual moat + the 17-framework regulatory map. Layer the WeWork DPR as a working artefact later in the conversation.',
    killerPitch:
      'McKinsey provides the strategy. Decision Intel provides the continuous audit and the EU AI Act Article 14 regulatory record. We are not a competitor to the QuantumBlack engagement — we are the artefact that ships with it, signed off by the client\'s audit committee, that proves you delivered governance and not just analytical insight.',
    threePhrasesNeverToSay: [
      '"Disrupt consulting" — instant defensive shutdown; the partner\'s entire P&L is the engagement',
      '"Replace your AI bias review" — never; we are the artefact, they are the process',
      '"Sell directly to your clients" — channel partnerships die when the partner suspects you will end-run them',
    ],
    meetingArc: [
      { minute: '0:00-2:00', move: 'Frame: peer-level category conversation. "We are the audit layer; you are the strategy seat."' },
      { minute: '2:00-7:00', move: 'Walk through the R²F intellectual moat + 17-framework regulatory map + the EU AI Act Art 14 timing argument.' },
      { minute: '7:00-12:00', move: 'Discovery — surface engagement-margin pressure + client-side AI-governance questions.' },
      { minute: '12:00-18:00', move: 'Position: 90-day co-pilot, one live engagement, joint co-publishable deliverable.' },
      { minute: '18:00-25:00', move: 'Discuss alliance commercial structure (rev share / per-seat / embedded license / co-marketing).' },
      { minute: '25:00-30:00', move: 'Close: "What is the next step on the alliances side? Who needs to see this?"' },
    ],
    signalsToListenFor: {
      positive: [
        'They name a current engagement where DI would have fit',
        'They volunteer the alliances org contact unprompted',
        'They reference Credo AI / C3 AI partnership shapes as benchmarks',
        'They ask about co-publishable angles (research papers, conference talks)',
      ],
      negative: [
        'They redirect to "we already have McKinsey internal tooling for that" — usually a defensive close; surface the R²F moat as proof of structural difference',
        'They ask "why would we partner with a 16-year-old founder" — surface the 2008 paper + the Wiz advisor as the credibility anchors',
        'They want exclusivity — typical opening ask; counter with non-exclusive partnership + first-mover co-marketing rights',
      ],
    },
    followUp: [
      { day: 'T+4h', artifact: 'Peer-level thank-you + 2008 paper + R²F architecture overview + 17-framework regulatory map summary' },
      { day: 'T+48h', artifact: 'Co-pilot engagement proposal — 90-day, one live engagement, joint deliverable, alliance commercial structure draft' },
      { day: 'T+1w', artifact: 'Joint co-publishable content draft — "AI governance and decision provenance: the EU AI Act Art 14 answer" white paper outline' },
      { day: 'T+2w', artifact: 'Single concrete next step — "Alliances introduction by Friday or we are evaluating the BCG GAMMA + Bain alliance paths in parallel"' },
    ],
    conversionWindow: '6-12 weeks for partnership agreement · 3-6 months for first co-engagement · long-tail F500 CSO direct ARR pulls through over 12-24 months',
    whyTheyConvert:
      'The R²F intellectual moat survives partner-level scrutiny. The EU AI Act Art 14 regulatory tailwind is timing they can sell to their CSO clients THIS quarter. The co-publishable angle elevates both brands and gives the partner a name-on-paper outcome.',
    whyTheyDont:
      'They internalise the AI tooling (build their own bias-audit pipeline using GPT-4 or Claude) — counter with the R²F architecture defensibility and the multi-year regulatory mapping they cannot replicate without 12-18 months of compliance work.',
    notebookLmFollowUp:
      'What does the McKinsey QuantumBlack alliance commercial model look like end-to-end? Specific partnership terms (Credo AI, C3 AI, Wonderful) — revenue share, per-seat licensing, embedded-license, exclusivity, co-marketing. Where is the leverage for a startup partner with one anchor engagement?',
  },

  // -----------------------------------------------------------------------
  // 6. COMPLIANCE / RISK FIRM EXECUTIVE (LRQA / Bureau Veritas / SGS / Intertek / DNV)
  // -----------------------------------------------------------------------
  {
    id: 'compliance_risk_firm',
    role: 'Compliance / Risk Firm Executive (LRQA-class)',
    archetype:
      'CEO or business-unit lead at a global assurance / risk-management firm · 60K+ clients · 150+ countries · service lines: certification, technical inspection, supply-chain assurance, ESG, cyber assurance · just-acquired or just-built EM-region capability (e.g., LRQA × Partner Africa April 2026)',
    buyerType: 'channel',
    priority: 'q3_2026',
    ticketBand:
      'Channel + integration partnership · technology layer in their service-delivery stack · per-engagement licensing or managed-service revenue · indirect ARR through their existing client base',
    whatTheyWant: [
      'AI-native technology that augments their existing assurance / inspection / supply-chain services',
      'EU AI Act + EM-region regulatory coverage that complements their geographic footprint',
      'A reasoning-audit layer that fits inside their EiQ-style supply-chain intelligence software',
      'Joint-venture or partnership shape that does not threaten their existing service revenue',
    ],
    whatKeepsThemUp: [
      'Disruption from AI-native challengers eating their assurance services',
      'EU AI Act and similar regulations creating new compliance categories they cannot serve fast enough',
      'EM-region client demand for governance services where they do not yet have local capacity',
      'Internal innovation pressure (e.g., LRQA Mission AI Possible internal hackathon) without external partnerships',
    ],
    howToReach: {
      coldChannel:
        'Almost never cold. Reach via warm intro at the highest level (e.g., Ian Spaulding at LRQA via the family relationship). For other firms (BV, SGS, DNV), via Wiz advisor or a client overlap.',
      coldOpener:
        'N/A — these conversations require warm intros at C-level or BU-lead level. The relationship IS the on-ramp.',
      coldBlunder:
        'Pitching as a software vendor. These firms buy partnerships and joint-ventures, not SaaS subscriptions. Frame DI as a technology layer that augments their existing service stack.',
      warmIntroPath:
        'Family / school relationship → C-level intro → category conversation, not vendor pitch → 90-day pilot embedded in one of their existing service lines.',
    },
    discoveryQuestions: {
      opening: [
        '"For your existing assurance / inspection / supply-chain services, where do AI-augmented decision audits fit naturally?"',
        '"With the EU AI Act Article 14 enforcement coming Aug 2026, what is your client-facing positioning?"',
        '"For your recent EM-region acquisitions / partnerships — what governance gap are your clients asking you to close?"',
      ],
      rigor: [
        '"If we ran a co-pilot engagement — DI as the reasoning-audit layer inside one of your service lines (e.g., your supply-chain intelligence offering) — what would the client deliverable look like?"',
        '"For the alliance commercial structure, what is the typical shape (managed service, per-engagement licensing, joint-venture, white-label)?"',
        '"For co-publishable content — joint research, conference talk, regulatory comment — what does the calendar look like?"',
      ],
      decisionGate: [
        '"For a 90-day pilot embedded in one of your live engagements — what would the success metric be?"',
        '"Who else internally needs to evaluate the partnership before sign?"',
        '"What is the typical alliance-onboarding timeline — 6 weeks, 3 months, longer?"',
      ],
    },
    artefactToLead:
      'For LRQA: the LrqaTab brief inside the Founder Hub (already detailed). For other firms: the 17-framework regulatory map + the EU AI Act Art 14 mapping + the R²F architecture overview. NOT a product demo first — a category conversation.',
    killerPitch:
      'You provide global assurance. Decision Intel provides the AI-native reasoning-audit layer that lives inside that assurance — the EU AI Act Article 14 record-keeping artefact your enterprise clients are already required to produce. We are not a competitor to your service revenue; we are the technology layer that makes your existing service line the answer to the EU AI Act question.',
    threePhrasesNeverToSay: [
      '"We will go direct to your clients" — channel partnerships die on this signal',
      '"We replace your assurance work" — never; we layer onto their service',
      '"For 16-year-old solo founders" — disqualifies you from the C-level conversation',
    ],
    meetingArc: [
      { minute: '0:00-2:00', move: 'Frame: peer-level category conversation. "We are the AI-native reasoning-audit layer that fits inside your service stack."' },
      { minute: '2:00-10:00', move: 'Walk through DI architecture + 17-framework regulatory map + the specific fit with their service lines (LRQA = EiQ + Partner Africa).' },
      { minute: '10:00-18:00', move: 'Discovery — surface AI-disruption pressure + EU AI Act timing + EM-region governance gap.' },
      { minute: '18:00-25:00', move: 'Position: 90-day pilot embedded in one of their live engagements, joint co-publishable deliverable, alliance commercial structure draft.' },
      { minute: '25:00-30:00', move: 'Close: "What is the next step internally? Who needs to see this?"' },
    ],
    signalsToListenFor: {
      positive: [
        'They name a specific service line where DI would fit (LRQA EiQ supply-chain intelligence is the canonical example)',
        'They volunteer the alliances or innovation-org contact unprompted',
        'They reference a recent EM-region acquisition or expansion as an integration target',
        'They invite a follow-up meeting with their innovation team within 2 weeks',
      ],
      negative: [
        'They redirect to "we have internal AI capability" — usually defensive; surface R²F architecture as differentiator',
        'They want exclusivity in a region or industry — open countering, but the deal must allow expansion to other categories',
        'They ask for a multi-year exclusive without a paid pilot — typical large-firm posture; counter with 90-day paid pilot first, then exclusivity discussion',
      ],
    },
    followUp: [
      { day: 'T+4h', artifact: 'Peer-level thank-you + 2008 paper + R²F architecture overview + 17-framework regulatory map summary + the integration paths specific to their service lines' },
      { day: 'T+48h', artifact: 'Co-pilot engagement proposal — 90-day, one service line, joint deliverable, alliance commercial structure draft' },
      { day: 'T+1w', artifact: 'Joint co-publishable content draft — e.g., "AI Governance for EM-Region Supply Chains: an LRQA × Decision Intel perspective"' },
      { day: 'T+2w', artifact: 'Single concrete next step — "Alliances introduction by Friday or we are evaluating other channel paths in parallel"' },
    ],
    conversionWindow: '8-16 weeks for partnership agreement · 3-6 months for first co-engagement · long-tail enterprise pull-through over 12-24 months',
    whyTheyConvert:
      'The EU AI Act Art 14 timing pressure on their enterprise clients is real and immediate. Their service line (LRQA EiQ, BV Quality, SGS Risk Management) needs an AI-native augmentation to defend margin against AI-native disruptors. DI fills that gap without competing.',
    whyTheyDont:
      'They build internally (LRQA Mission AI Possible internal hackathon) instead of partnering. Counter: surface the R²F architectural defensibility + the regulatory mapping moat as 12-18 months of work they cannot replicate internally before EU AI Act enforcement.',
    notebookLmFollowUp:
      'What does the typical alliance commercial structure look like for assurance / inspection firms (LRQA, Bureau Veritas, SGS, Intertek, DNV) when they partner with AI-native technology vendors? Specific examples of recent partnerships, terms, and the pull-through revenue model.',
  },

  // -----------------------------------------------------------------------
  // 7. PRE-SEED / SEED VENTURE INVESTOR
  // -----------------------------------------------------------------------
  {
    id: 'pre_seed_seed_investor',
    role: 'Pre-Seed / Seed Venture Investor',
    archetype:
      'Operator-stage angel · Seed-stage VC partner · check size £100K-£2M · thesis fit: enterprise infra, AI-native, regulatory tailwind, founder-led category creation · pre-seed reasonable: pre-revenue with strong design-partner pipeline; seed reasonable: 3-5 paid pilots + early ARR',
    buyerType: 'capital',
    priority: 'now',
    ticketBand:
      'Pre-seed: £4-8M raise · Seed: £24-48M raise · advisor convertibles + operator angels for warm-network access · enterprise-infra-focused funds (e.g., Index, Sequoia, Greylock seed practice, Nordic-focused Creandum) for thesis fit',
    whatTheyWant: [
      'Clear unicorn-shape ICP with structural moat (R²F + Pan-African wedge + 17-framework regulatory map)',
      'Founder profile that survives PE/VC due-diligence (Wiz advisor, 2008 paper, Stanford / Berkeley application target)',
      'Honest 2030 path with conditional probabilities (HonestProbabilityPath: 50% × 35% × 30% × 15% = 0.79% absolute IPO)',
      'Procurement-grade traction signal — at least one paid design partner closed before serious pre-seed conversations',
    ],
    whatKeepsThemUp: [
      'Founder continuity (16-year-old solo, Stanford / Berkeley target Nov 2027)',
      'Time-to-revenue (zero paying customers as of 2026-04-27)',
      'Category clarity (Cloverpop / Aera / IBM watsonx / Palantir competitive surround)',
      'External attack vectors (Cloverpop data advantage, IBM bundling, agentic-shift)',
    ],
    howToReach: {
      coldChannel:
        'Wiz advisor → operator angels in his network → pre-seed VCs in his portfolio overlap. Cold acceptable for thematic-fit pre-seed funds (e.g., Air Street, Saxon Advisors, regulator-tailwind-focused) with a tight 1-pager.',
      coldOpener:
        'Decision Intel: 60-second AI audit on every strategic memo before the board sees it. Recognition-Rigor Framework operationalising 50 years of Nobel-winning behavioral economics. 17-framework regulatory map across G7 / EU / GCC / African markets — EU AI Act Article 14 enforcement is Aug 2, 2026. Worth a pre-seed conversation?',
      coldBlunder:
        '"We are pre-revenue and looking for our first customer" — instant disqualification at pre-seed. Lead with the wedge + the regulatory tailwind + the design-partner pipeline (even if not closed yet).',
      warmIntroPath:
        'Wiz advisor → his McKinsey-alumni-turned-operator-angel network → pre-seed VCs with enterprise-infra thesis.',
    },
    discoveryQuestions: {
      opening: [
        '"Where does Decision Intel sit in your enterprise-infra thesis? What pattern does this remind you of?"',
        '"Your fund\'s view on the AI-governance category — Cloverpop / Aera / IBM watsonx — where do you see the moat forming?"',
        '"For the EU AI Act Article 14 enforcement on Aug 2, 2026 — what is your fund\'s perspective on the timing pressure for F500 buyers?"',
      ],
      rigor: [
        '"For the Pan-African / EM-fund wedge — what is the comparable thesis from your portfolio? What were the indicators of category-defining traction?"',
        '"For founder continuity — what is your standard pattern for 16-year-old solo founders shipping enterprise infra (Stanford / Berkeley target Nov 2027)? What does the continuity playbook need to include?"',
        '"For the unicorn-path conditional probability (50% × 35% × 30% × 15% = 0.79% absolute IPO) — does that math match your pre-seed B2B baseline?"',
      ],
      decisionGate: [
        '"What is your typical pre-seed cycle — meetings, diligence, term sheet, close?"',
        '"What is the tracking question that decides whether you lead or follow?"',
        '"For the design-partner pipeline — what is the threshold (paid pilots, MRR, design-partner LOIs) that converts you from interested to leading?"',
      ],
    },
    artefactToLead:
      'A 12-slide pre-seed deck — H1: native reasoning layer for every high-stakes call · slide 2: R²F intellectual moat (Kahneman + Klein) · slide 3: regulatory tailwinds (EU AI Act Aug 2026, SEC, Basel III) · slide 4: Pan-African wedge + 17-framework map · slides 5-9: product · slide 10: HonestProbabilityPath + 16 metrics · slide 11: continuity playbook · slide 12: ask + use of funds.',
    killerPitch:
      'Decision Intel is the native reasoning layer for every high-stakes call. We catch the cognitive bias McKinsey charges $1M to find — and McKinsey has the same biases themselves. Our wedge is Pan-African EM funds, our ceiling is Fortune 500 CSOs, and our timing is the EU AI Act Article 14 enforcement on Aug 2, 2026. The Recognition-Rigor Framework operationalising Kahneman + Klein gives us a defensible IP moat no incumbent has matched in 16 years of academic debate. Conditional probability of unicorn outcome is 0.79% — 4× the pre-seed B2B baseline. Most likely real outcome is Series-B-stage strategic acquisition at $400M-1B.',
    threePhrasesNeverToSay: [
      '"Disrupting strategy consulting" — investor hears "competing with McKinsey/BCG/Bain"; instant skepticism',
      '"For everyone making decisions" — non-segment, instant disqualification',
      '"Just need our first customer" — pre-seed investors fund teams + thesis, not desperation',
    ],
    meetingArc: [
      { minute: '0:00-2:00', move: 'Frame: native reasoning layer + Pan-African wedge + EU AI Act timing.' },
      { minute: '2:00-10:00', move: 'Pitch deck — slides 1-9 (problem, R²F moat, regulatory tailwind, wedge, product).' },
      { minute: '10:00-18:00', move: 'HonestProbabilityPath conditional-probability slide + 16 investor metrics tracker.' },
      { minute: '18:00-25:00', move: 'Founder continuity playbook + Wiz-advisor unfair-network slide.' },
      { minute: '25:00-30:00', move: 'Ask: £4-8M pre-seed at £20-30M pre-money + use-of-funds (3 paid design partners + GTM hire + ISA 2007 + DQI CIs + EU residency).' },
    ],
    signalsToListenFor: {
      positive: [
        'They reference a comparable thesis from their portfolio',
        'They ask about the design-partner pipeline conversion timeline',
        'They volunteer to introduce to a thematic-fit co-investor',
        'They engage on the conditional-probability math without dismissing the absolute IPO outcome',
      ],
      negative: [
        'They focus exclusively on continuity (16-year-old solo) without engaging the moat — usually a polite no',
        'They ask "what is your TAM?" without engaging the wedge — generic-VC pattern; surface the F500 strategy budget at $50-150M and the wedge-as-reference-generator narrative',
        'They want exclusive access to design-partner data — early ask; counter with reference-case-publishing rights post-close',
      ],
    },
    followUp: [
      { day: 'T+4h', artifact: 'Thank-you + the 12-slide pre-seed deck PDF + the 2008 paper as voice-anchoring proof + the WeWork DPR as product-shape proof' },
      { day: 'T+48h', artifact: 'Specific responses to their diligence questions (in writing) — wedge metrics, design-partner pipeline status, continuity playbook' },
      { day: 'T+1w', artifact: 'Reference-call request — Wiz advisor + 1-2 design-partner conversations (with permission)' },
      { day: 'T+2w', artifact: 'Single concrete next step — "Term sheet by Friday or we close the round with the lead investor on parallel timeline"' },
    ],
    conversionWindow: '4-6 meetings · 6-12 weeks · pre-seed close in 12-16 weeks of process',
    whyTheyConvert:
      'The R²F intellectual moat survives partner-level due diligence. The Pan-African wedge has a clear reference-generator → F500 ceiling sequence. The EU AI Act Aug 2026 timing pressure is a forced clock. The HonestProbabilityPath gives investors honest math (rare at pre-seed). The Wiz advisor is the highest-signal trust anchor.',
    whyTheyDont:
      'Continuity question (16-year-old solo, Stanford Nov 2027). Time-to-revenue (zero paying customers). Procurement-grade gaps (SOC 2 Type II, ISA 2007, DQI CIs). Address each in the continuity playbook + the next-30-days roadmap + the 90-day action plan.',
    notebookLmFollowUp:
      'Pre-seed European + US investors most likely to fund a 16-year-old solo founder building enterprise infrastructure with a Pan-African wedge — name 5 with thesis fit + warm-intro paths, and the most recent comparable check they have written.',
  },

  // -----------------------------------------------------------------------
  // 8. SENIOR STRATEGIC ADVISOR / WIZ-NETWORK OPERATOR
  // -----------------------------------------------------------------------
  {
    id: 'senior_strategic_advisor',
    role: 'Senior Strategic Advisor / Wiz-Network Operator',
    archetype:
      'Wiz-credentialed senior consultant or operator · 1:1 cadence with the founder · McKinsey-alumni network saturation · F500 CSO + pre-seed-VC introductions are the lever · the relationship IS the unfair advantage',
    buyerType: 'amplifier',
    priority: 'now',
    ticketBand:
      'No direct revenue · advisor equity grant or paid retainer (modest) · indirect ARR via the introductions they unlock · long-term: this is the highest-leverage relationship the founder has',
    whatTheyWant: [
      'Specific, pre-qualified asks per 1:1 — never "any introductions" (advisor cannot source against vague asks)',
      'Closed-loop feedback after every intro they make — meeting outcome, deal-stage progression, lessons learned',
      'A 1-pager that describes Decision Intel in their vocabulary (cloud-security parallels: "DI is to strategic decisions what Wiz is to cloud posture")',
      'Real wins to point at — design-partner closes, F500 conversation progress, pre-seed term sheet — that justify their continued time investment',
    ],
    whatKeepsThemUp: [
      'Wasted advisor time — when the founder asks for vague introductions and does not follow up on the ones they make',
      'Reputational risk — when the founder makes a bad impression in a meeting they sourced',
      'Stalled progress — 60+ days between the advisor making an intro and the founder reporting a meaningful outcome',
    ],
    howToReach: {
      coldChannel: 'N/A — relationship already exists.',
      coldOpener: 'N/A — leverage is the relationship cadence.',
      coldBlunder:
        'Asking for "any introductions" without specifying who, why, and what for. The advisor cannot source against generic asks.',
      warmIntroPath: 'Already active.',
    },
    discoveryQuestions: {
      opening: [
        '"Of your active McKinsey-alumni-turned-operator network, who do you think would be the highest-ROI introduction for Decision Intel right now?"',
        '"For the Wiz GTM playbook — what was the first paid F500 customer move? What did the founders learn that DI should learn faster?"',
        '"For pre-seed VCs in your overlap — who has the strongest enterprise-infra-with-regulatory-tailwind thesis right now?"',
      ],
      rigor: [
        '"For the McKinsey QuantumBlack alliance path — based on your network insight, what is the highest-probability entry point (alliances org, specific senior partner, internal champion)?"',
        '"For the Pan-African / EM-fund wedge — given your portfolio breadth, what is the comparable wedge-into-ceiling pattern you have seen succeed?"',
        '"For the founder-continuity question (16-year-old solo, Stanford / Berkeley Nov 2027) — what is your view on the procurement-stage answer and the GTM co-founder search?"',
      ],
      decisionGate: [
        '"For our next 1:1 — what is the single highest-ROI introduction you can make this week, and what should I prepare in advance?"',
        '"For the advisor agreement — should we formalize equity or retainer at this stage, or wait until pre-seed close?"',
        '"For the closed-loop feedback — what is your preferred cadence (after-each-intro, weekly, monthly)?"',
      ],
    },
    artefactToLead:
      'A specific pre-qualified ask: who, why, what for. NOT a generic update. The advisor performs against specific asks 5× better than against general updates.',
    killerPitch:
      'You helped build Wiz from startup to $32B. The DI pattern is similar: a category-defining technical product, a procurement-grade compliance moat, and a wedge that generates references for the F500 ceiling. The single highest-leverage intro you can make this quarter is to QuantumBlack alliances.',
    threePhrasesNeverToSay: [
      '"Any introductions you can make would help" — advisor cannot source against vague asks',
      '"How do I do GTM" — the advisor will help, but only if the founder is doing the operational work themselves',
      '"What should I do next" — pull the agenda, never push it onto the advisor',
    ],
    meetingArc: [
      { minute: '0:00-3:00', move: 'Closed-loop on prior asks — outcomes of prior introductions, deal-stage progression, lessons learned.' },
      { minute: '3:00-12:00', move: 'Specific pre-qualified ask of the meeting — "I want intro to X for Y reason. I have prepared Z. What should I add?"' },
      { minute: '12:00-25:00', move: 'Strategic question — "based on your Wiz GTM lens, what would you do differently in the next 90 days?"' },
      { minute: '25:00-30:00', move: 'Confirm next-meeting agenda + immediate-next-action commitments on both sides.' },
    ],
    signalsToListenFor: {
      positive: [
        'They name the introduction without being asked',
        'They volunteer follow-up actions on their side',
        'They reference a specific Wiz playbook moment as relevant',
        'They invite a higher-cadence schedule (monthly → bi-weekly)',
      ],
      negative: [
        'They redirect every question to "you should figure that out" — usually means the asks are too vague; sharpen them',
        'They have not made an intro in 60+ days — relationship has gone passive; surface this directly in next 1:1',
        'They ask about your school commitments / time allocation — usually a polite signal that they think the venture is a side project; counter with the operating-cadence proof',
      ],
    },
    followUp: [
      { day: 'T+4h', artifact: 'Closed-loop summary of the meeting + the specific next-action commitments + the 1-pager update on Decision Intel progress' },
      { day: 'T+48h', artifact: 'Following up on each introduction made in the meeting — "had the call with X on Friday, here is what came of it"' },
      { day: 'T+1w', artifact: 'Pre-prepared agenda for next meeting — specific asks, closed-loop on prior actions, strategic question' },
    ],
    conversionWindow: 'Ongoing relationship · cadence is the metric, not the conversion · monthly 1:1 + ad-hoc check-ins · 6-month equity / retainer formalization decision',
    whyTheyConvert: 'Already converted — the relationship exists. The lever is the cadence quality + the specific-ask discipline.',
    whyTheyDont:
      'Founder lapses on closed-loop feedback. Founder asks for vague introductions. Founder fails to act on the introductions made (lets the warm thread go cold). Each is a relationship-erosion signal — fix immediately.',
    notebookLmFollowUp:
      'What is the optimal advisor-cadence pattern for a 16-year-old solo founder with a Wiz-credentialed advisor? Cadence frequency, ask specificity, closed-loop reporting, equity / retainer milestones — drawing on benchmarks from successful founder-advisor relationships in enterprise SaaS.',
  },
];

// =========================================================================
// SECTION 4 · R²F DEEP DIVE — current moat + 5 levers to deepen
// =========================================================================

export type R2FCurrentPillar = {
  id: string;
  side: 'kahneman' | 'klein' | 'arbitration';
  label: string;
  pipelineNodes: string[];
  whatItDoes: string;
  whyItMatters: string;
};

export const R2F_CURRENT: R2FCurrentPillar[] = [
  {
    id: 'kahneman_rigor',
    side: 'kahneman',
    label: 'Kahneman side · Rigor (System 2 debiasing)',
    pipelineNodes: ['biasDetective', 'noiseJudge', 'statisticalJury'],
    whatItDoes:
      'Identifies overconfidence, anchoring, sunk-cost, base-rate neglect, framing effects · measures cross-judge variance · catches systemic noise · scores severity using weighted statistical-jury voting.',
    whyItMatters:
      'Suppresses bias before the recommendation reaches the room. The DQI weight on Kahneman-side outputs proves the analyst was not the only sceptic — a multi-judge audit was already on the side of rigor.',
  },
  {
    id: 'klein_recognition',
    side: 'klein',
    label: 'Klein side · Recognition (System 1 pattern matching)',
    pipelineNodes: ['rpdRecognition', 'forgottenQuestions', 'preMortem'],
    whatItDoes:
      'Surfaces historical analogues from the 135-case library · runs narrative "war story" pre-mortems · pattern-matches the deal thesis against prior failures and successes · raises the questions the analyst forgot to ask.',
    whyItMatters:
      'Amplifies the expert intuition that earned the recommendation a seat at the table in the first place. The Klein side IS the message that lands with senior buyers: "your 20 years of pattern recognition is your sharpest asset; we just protect it from occasional blind spots."',
  },
  {
    id: 'meta_arbitration',
    side: 'arbitration',
    label: 'Arbitration · Meta-Judge (the synthesis)',
    pipelineNodes: ['metaJudge'],
    whatItDoes:
      'Arbitrates Kahneman-side rigor signals against Klein-side recognition signals · resolves contradictions deterministically · produces the final mathematical Decision Quality Index (DQI) and the Decision Provenance Record (DPR) artefact.',
    whyItMatters:
      'This is the academic synthesis no competitor (Cloverpop, Aera, IBM watsonx, Palantir) has built. The metaJudge node uses the highest-tier Pro-level model (gemini-2.5-pro) per CLAUDE.md model policy — the only Pro-tier surface in the entire pipeline. Reasoning quality at the synthesis seat matters more than cost.',
  },
];

export type R2FMoatLever = {
  id: string;
  rank: number;
  title: string;
  source: string;
  shortPitch: string;
  whatToBuild: string;
  howItDeepensMoat: string;
  estimatedEffort: 'small' | 'medium' | 'large';
  estimatedCost: string;
  shipBy: string;
};

export const R2F_MOAT_LEVERS: R2FMoatLever[] = [
  {
    id: 'mercier_sperber',
    rank: 1,
    title: 'Add Mercier & Sperber Argumentative Theory of Reason as a third pillar',
    source:
      'Mercier & Sperber, "The Enigma of Reason" (Harvard 2017) + the Interactionist Account of Reason — humans are biased + lazy producing their own reasons but unbiased + demanding evaluating others.',
    shortPitch:
      'Stop selling "bias detection." Start selling "algorithmic adversarial evaluation."',
    whatToBuild:
      'Upgrade the Dr. Red Team / pre-mortem nodes into a multi-agent debate. Pit agents against each other (pre-mortem actively attacks RPD recognition; biasDetective challenges noise-judge severity scoring; statisticalJury voters disagree before the metaJudge resolves). The metaJudge becomes the adversarial referee, not the silent synthesizer.',
    howItDeepensMoat:
      'Replicates the exact adversarial pressure Mercier & Sperber proved is necessary for optimal reasoning. A solo-evaluator AI inherits the same belief-dependent biases as humans; a multi-agent adversarial pipeline does not. Competitors using a single GPT-4 call cannot replicate this without re-architecting their pipeline.',
    estimatedEffort: 'large',
    estimatedCost: '6-10 weeks engineering + ~£0.15-0.25 added per audit (additional Gemini calls)',
    shipBy: 'Q3 2026 — paired with the next DPR-vocabulary lock',
  },
  {
    id: 'environmental_validity',
    rank: 2,
    title: 'Add Environmental Validity weighting to the DQI',
    source:
      'Kahneman & Klein 2009 paper "Conditions for Intuitive Expertise: a failure to disagree" — the entire reconciliation hinges on environmental validity (high-validity environments → trust intuition; low-validity → distrust intuition).',
    shortPitch:
      'Prove to F500 CSOs that DI knows when to trust expertise versus when to override it.',
    whatToBuild:
      'Introduce an Environmental Validity Score node at the start of the pipeline. Operational logistics memo (high-validity, stable patterns, fast feedback) → up-weight Klein-side. M&A market-entry thesis (low-validity, slow feedback, weak base-rates) → up-weight Kahneman-side. The DQI weights become dynamic per memo type, not static.',
    howItDeepensMoat:
      'Static weights are easy to clone. Dynamic environmental-validity weighting is a research-backed feature that requires understanding the 2009 paper at depth. Competitors will try to copy after we publish, but by then we own the academic vocabulary AND the implementation.',
    estimatedEffort: 'medium',
    estimatedCost: '3-4 weeks engineering + minimal added cost (single classification call per memo)',
    shipBy: 'Q2 2026 — ship before Q3 DPR vocabulary refresh',
  },
  {
    id: 'decision_framing_gate',
    rank: 3,
    title: 'Decision Framing Gate · solve the Problem of Relevance',
    source:
      'Kahneman WYSIATI (What You See Is All There Is) + the Frame Problem in cognitive science — how we frame the decision determines the outcome.',
    shortPitch:
      'Stop "upload PDF and click analyze." Force the user to define the decision frame before the audit runs.',
    whatToBuild:
      'A mandatory pre-audit gate that captures: (a) primary goal of the decision · (b) alternatives considered + rejected · (c) the decision-prior (what does the analyst already believe will happen) · (d) the success criterion + observation date. The pipeline then runs framing-blindness detection against the captured prior.',
    howItDeepensMoat:
      'Targets the SETUP of the decision, not just the output. Anti-patterns ("you considered only one alternative", "you did not name a decision-prior", "your success criterion is unfalsifiable") are entirely new findings no competitor surfaces today.',
    estimatedEffort: 'medium',
    estimatedCost: '4-6 weeks engineering + UI work for the framing gate',
    shipBy: 'Q3 2026 — paired with onboarding refactor',
  },
  {
    id: 'provisional_patents',
    rank: 4,
    title: 'File two provisional patents · Statistical Jury Method + Outcome-Linked Decision Twin',
    source:
      'NotebookLM intellectual-moats synthesis 2026-04-27 — recommends provisional patents at ~£3K-8K each before scaling.',
    shortPitch:
      'Legally fortify the methodologies before IBM, Palantir, or a leaner competitor reverse-engineers from public artefacts.',
    whatToBuild:
      'Patent 1 — Statistical Jury Method: weighted bias-severity voting where multiple independent LLM judges vote and severity is calibrated against organisational outcome history. Patent 2 — Outcome-Linked Decision Twin: simulation engine that generates counterfactuals, logs outcomes, retrains causal edges based on whether simulated dissent was accurate.',
    howItDeepensMoat:
      'Provisional patents create a 12-month priority window that can be converted to non-provisional patents once funded. They also become legitimacy artefacts in pre-seed conversations and procurement reviews — a 16-year-old founder with two provisional US patents reads as institutional grade.',
    estimatedEffort: 'small',
    estimatedCost: '£6-16K (two filings × £3-8K each, IP attorney fees)',
    shipBy: 'Q2 2026 — file before pre-seed close so the patents survive the round',
  },
  {
    id: 'institutional_credentials',
    rank: 5,
    title: 'Stack institutional academic credentials',
    source:
      'NotebookLM intellectual-moats synthesis 2026-04-27 — recommends Behavioral Finance (Duke), PE & VC (Bocconi), AI-Powered Decision Intelligence / LangGraph (DeepLearning.AI).',
    shortPitch:
      'Surround Decision Intel with undeniable intellectual authority. Force investors and CSOs to see an applied behavioral scientist, not a 16-year-old hacker.',
    whatToBuild:
      'Complete: (a) Duke Behavioral Finance — for capital-markets vocabulary and anchoring + loss-aversion math · (b) Bocconi PE & VC — for fund-buyer terminology and diligence structures · (c) DeepLearning.AI Decision Intelligence + LangGraph — for the multi-agent architecture credentials.',
    howItDeepensMoat:
      'Credentialism is a procurement signal. F500 GCs, audit-committee chairs, and pre-seed VCs all weight institutional certifications more than they admit. Pair with the 2008 paper as the foundation, and the credential-stack reads as a rigorous applied-research career, not a side project.',
    estimatedEffort: 'small',
    estimatedCost: '£200-1500 per certification + 6-12 weeks of evening time per certification',
    shipBy: 'Rolling — first credential complete Q3 2026',
  },
];

// =========================================================================
// SECTION 5 · CATEGORY DEFINITION (THE WHAT + THE WHY)
// =========================================================================

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
  whyItIsPossibleNow:
    'Three years ago, no LLM could run a 12-node multi-agent debate, score outputs against a 30+ bias taxonomy, cross-map to 17 regulatory frameworks, and produce a 4-page tamper-evident DPR in 60 seconds. Now it can. The EU AI Act Article 14 enforcement on Aug 2, 2026 makes the regulatory artefact non-optional. The timing is the answer to the why-now question.',
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
      context: 'Warm (second meeting onward, pitch decks, design-partner conversations, internal Founder Hub)',
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

export type KillerResponse = {
  id: string;
  scenario: 'not_right_now' | 'confused' | 'too_expensive' | 'we_have_a_process' | 'how_are_you_different';
  buyerSignal: string;
  underlyingRoadblock: string;
  responseCategory: string;
  exactPhrasing: string;
  whyItWorks: string;
  followUpMove: string;
};

export const KILLER_RESPONSES: KillerResponse[] = [
  // -----------------------------------------------------------------------
  // "This isn't for us at the moment"
  // -----------------------------------------------------------------------
  {
    id: 'not_right_now_honest_off_ramp',
    scenario: 'not_right_now',
    buyerSignal: '"This isn\'t for us at the moment."',
    underlyingRoadblock:
      'The JOLT effect — buyer is paralyzed by fear of making a mistake or overwhelmed by competing priorities. They are NOT saying no to the value; they are saying yes to inertia.',
    responseCategory: 'The Honest Off-Ramp · validate then disqualify',
    exactPhrasing:
      '"You might be right. To be completely honest, if your Investment Committee isn\'t experiencing any post-close surprises, and if your team already has a perfect system of record for tracking why decisions were made, you don\'t need this tool."',
    whyItWorks:
      'Enterprise buyers expect you to push. Giving them permission to walk away builds profound trust, while subtly reminding them that they DO have post-close surprises and they DO NOT have a system of record for the why.',
    followUpMove:
      'After the off-ramp, wait. The buyer who is genuinely uninterested will say "yeah, you are probably right." The buyer with latent pain will surface it within 30 seconds.',
  },
  {
    id: 'not_right_now_pings_and_echoes',
    scenario: 'not_right_now',
    buyerSignal: '"This isn\'t for us at the moment." (when off-ramp does not surface clear disinterest)',
    underlyingRoadblock:
      '"Not right now" usually masks a fear of implementation risk OR organizational friction. You must "ping" that fear to see if it echoes back.',
    responseCategory: 'Pings and Echoes · diagnose the real fear',
    exactPhrasing:
      '"I completely understand, and I appreciate your candor. Usually, when partners tell me \'not right now,\' it is because they are worried a new AI tool will slow down their deal velocity, OR they are concerned about the compliance risk. Is it a timing issue for your team, or is it more of an implementation concern?"',
    whyItWorks:
      'You make their unstated fear feel perfectly normal ("other partners feel this way too"), which gives them the psychological safety to admit what is actually holding up the deal.',
    followUpMove:
      'Whichever fear they admit becomes the next 60 seconds of conversation. Address it specifically — never generically.',
  },
  {
    id: 'not_right_now_refrigerator',
    scenario: 'not_right_now',
    buyerSignal: '"This isn\'t for us at the moment." (when timing genuinely is the issue)',
    underlyingRoadblock:
      'Real timing constraints (mid-IC-cycle, year-end close, quarterly board prep). You need to keep the deal alive without burning the relationship.',
    responseCategory: 'Asynchronous Refrigerator · move the deal off the kitchen table without losing the lead',
    exactPhrasing:
      '"No problem. Whenever your next major IC memo is ready for a stress test, let me know. In the meantime, I will leave you with this 60-second audit we ran on the 2014 Dangote expansion — it catches the exact blind spots the market missed."',
    whyItWorks:
      'You hand them a usable artefact (the Dangote DPR or WeWork DPR) that does the persuasion asynchronously. They will read it on their commute. The artefact opens the door for the next conversation without you pushing.',
    followUpMove:
      'Set a calendar reminder for 4-6 weeks out (matching their stated cycle). Reach back out with a NEW artefact (a fresh case study, a relevant regulatory update) — never just "checking in."',
  },

  // -----------------------------------------------------------------------
  // "I'm confused / I don't see the benefit"
  // -----------------------------------------------------------------------
  {
    id: 'confused_vulnerability_reset',
    scenario: 'confused',
    buyerSignal: 'Eyes glaze over · "Can you walk me through that again?" · long silence after a feature explanation',
    underlyingRoadblock:
      'Cognitive load is too high. You have fallen into the founder trap of over-explaining the technology instead of solving their business problem.',
    responseCategory: 'Vulnerability Reset · reset the dynamic from vendor-pitch to peer-conversation',
    exactPhrasing:
      '"I apologize, I think I just fell into the founder trap of over-explaining the technology instead of your problem. Let me take a step back."',
    whyItWorks:
      'Showing vulnerability instantly resets the dynamic from a "vendor pitch" to a peer-to-person conversation. The buyer relaxes; the meeting recovers.',
    followUpMove:
      'Immediately re-anchor on a specific business pain they have already mentioned. "When you said the post-close partner question on the X deal cost you Y — let me show you what we would have flagged before that vote."',
  },
  {
    id: 'confused_5th_grade_anchor',
    scenario: 'confused',
    buyerSignal: 'Buyer cannot articulate the value back to you · "what does this actually do for me?"',
    underlyingRoadblock:
      'Your vocabulary is too technical. Switch from features (R²F, DPR, DQI, 12-node pipeline) to PROTECTED REVENUE.',
    responseCategory: '5th Grade Financial Anchor · feature → protected revenue',
    exactPhrasing:
      '"Let me explain it simply: Consulting firms charge you $1M to tell you about cognitive bias, and they have the same biases themselves. We built an AI that does not. If your team had removed anchoring bias from your last 20 decisions, your success rate would be 14% higher. This is not a software tool; it is a 60-second insurance premium on your strategic-planning cadence."',
    whyItWorks:
      'You replaced a feature explanation with a financial anchor against the $300B consulting industry. The "$1M to tell you about bias" line forces the buyer to do the math against their own consulting budget.',
    followUpMove:
      'Once they nod at the consulting anchor, immediately transition to the live-audit move ("Don\'t take my word for it — let me run the audit on a memo of yours"). Stop talking, start showing.',
  },
  {
    id: 'confused_evidence_challenge',
    scenario: 'confused',
    buyerSignal: 'Words are not landing · the buyer is sceptical but not closing the conversation · they say "show me"',
    underlyingRoadblock:
      'You need to stop talking and let the artefact do the persuasion. Fund buyers and procurement-stage CSOs evaluate evidence for a living; they are allergic to generic pitches.',
    responseCategory: 'Ultimate Evidence Challenge · put your product on the line against their own failed document',
    exactPhrasing:
      '"Don\'t take my word for it. Let\'s do this: bring a redacted IC memo from a deal of yours that went sideways to our next call. I will run the audit live in 7 minutes. If it does not immediately flag the exact blind spots that cost you money, the product is not for you."',
    whyItWorks:
      'Putting your product on the line against THEIR own failed document is the ultimate display of confidence. You shift the buyer from a confused listener into an active participant — they are now invested in seeing what the audit catches.',
    followUpMove:
      'Confirm the next-call date in the same breath. "Tuesday at 2pm — I will block 30 minutes. Bring the memo, redact what you need to. The audit takes 7 minutes; the rest is conversation."',
  },

  // -----------------------------------------------------------------------
  // "How are you different from Cloverpop / Aera / IBM watsonx?"
  // -----------------------------------------------------------------------
  {
    id: 'different_cloverpop',
    scenario: 'how_are_you_different',
    buyerSignal: '"How are you different from Cloverpop?"',
    underlyingRoadblock:
      'Buyer has heard of Cloverpop and is anchoring DI to it — the comparison flattens our category claim. We need to surface the structural difference in one sentence.',
    responseCategory: 'Category Contrast · one-sentence structural difference',
    exactPhrasing:
      '"Cloverpop logs decisions; Decision Intel audits them. They are a logging + collaboration tool relying on humans to manually fill out templates. We are a 12-node Recognition-Rigor reasoning audit — Kahneman + Klein synthesised into one pipeline, with a 30+ bias academic taxonomy and 17-framework regulatory mapping."',
    whyItWorks:
      'Names the structural difference (logging vs auditing) in one sentence, then anchors the depth (R²F, 30+ taxonomy, 17 frameworks) so the buyer cannot collapse us back into the Cloverpop category.',
    followUpMove:
      'Hand over the WeWork or Dangote DPR. "Cloverpop cannot generate this artefact. Their architecture does not have the Klein-side, the regulatory mapping, or the metaJudge synthesis."',
  },
  {
    id: 'different_aera',
    scenario: 'how_are_you_different',
    buyerSignal: '"How are you different from Aera?"',
    underlyingRoadblock:
      'Aera is operational-decision automation (supply chain, demand planning). Buyer is conflating operational with strategic.',
    responseCategory: 'Category Contrast · operational vs strategic',
    exactPhrasing:
      '"Aera automates operational decisions; Decision Intel audits strategic decisions. A COO buys Aera for supply-chain execution. A CSO buys Decision Intel for boardroom memos and IC theses. Different artefact, different buyer, different governance need."',
    whyItWorks:
      'Names the buyer / artefact / governance distinction. The COO vs CSO contrast is sharp enough that procurement teams cannot conflate the categories on the next pass.',
    followUpMove:
      'If the buyer is still mid-comparison, surface the agentic-shift external attack vector framing — "Aera is positioned for the agentic decision-execution future. We are positioned for the strategic-reasoning audit in either future, including agentic systems making capital-allocation calls."',
  },
  {
    id: 'different_ibm_watsonx',
    scenario: 'how_are_you_different',
    buyerSignal: '"How are you different from IBM watsonx.governance?"',
    underlyingRoadblock:
      'Buyer is asking the EU AI Act question. IBM bundles model governance; the buyer is wondering if a one-stop bundle is sufficient.',
    responseCategory: 'Category Contrast · governs the model vs governs the human decision',
    exactPhrasing:
      '"IBM watsonx governs the AI model. Decision Intel governs the human strategic decision the AI informed. Both serve EU AI Act Article 14 record-keeping requirements, but for entirely different artefacts. IBM\'s watsonx tells you the model behaved correctly. Our DPR tells the audit committee the human reasoning behind the decision was rigorous."',
    whyItWorks:
      'Acknowledges IBM directly (no defensive defensiveness), then names the structurally different governance scope. The "different artefacts" framing is procurement-grade because it surfaces what each tool ACTUALLY produces.',
    followUpMove:
      'Surface the Pan-African / EM-fund wedge as the IBM-bundle bypass. "IBM does not sell into Pan-African corp dev or EM-focused funds with our regulatory depth. Win the wedge, expand to F500 with reference cases — by then the bundling argument is already lost on the strategic-reasoning side."',
  },
];

// =========================================================================
// SECTION 7 · PERSONA PITCH LIBRARY (the WHY by buyer persona)
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
      '"You don\'t have a process for auditing your own strategic memos before they reach the board, because three years ago it wasn\'t technically possible. Now it is. Decision Intel is the 60-second hygiene step that happens between your analyst and the committee. We aren\'t replacing your workflow; we are providing an insurance premium on your strategic-planning cadence. When your analyst runs a memo through our tool, it names the exact biases the room will catch first and generates a Decision Quality Index. It makes your VP of Strategy the adult in the room on every recommendation."',
    closingMove:
      'Bring the WeWork S-1 DPR. "This is the audit on a famously biased filing. Apply the same lens to your last quarterly memo — would your steering committee have caught these flags?"',
  },
  {
    id: 'corp_dev_ma',
    persona: 'Corporate Development & M&A Teams',
    theirPain:
      '70-90% of acquisitions fail to create the value the IC voted for, often due to confirmation bias or sunk-cost anchoring during diligence. The post-close partner question that starts with "why didn\'t we see X in Q3" is a career-killing moment.',
    pitch:
      '"Before a deal thesis reaches IC, it runs through Decision Intel. We flag overconfidence, sunk-cost anchoring, and base-rate neglect — highlighting the exact sentence they live in. Then we pattern-match your memo against our 135-case historical library. Your deal team can walk into IC and say \'we hit the same pattern Kraft-Heinz did on Unilever, and here is how we mitigate it,\' with evidence, not analogy. We aren\'t slowing deals down — we are removing the post-close partner question that starts with why didn\'t we see X."',
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
    persona: 'Management Consultant Partner (McKinsey QuantumBlack / BCG GAMMA / Bain Advanced Analytics)',
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
    source: 'NotebookLM positioning synthesis 2026-04-27 + Wiz / Snowflake / Datadog / Gong landing-page patterns',
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
    protectedRevenueFraming:
      'Estimated risk: $22.5M based on 45% failure rate on $50M deal.',
    whyItWorks:
      'Ties the percentage benchmark (which is abstract) to the buyer\'s ticket size (which is concrete). The dollar amount survives every internal forwarding without needing context.',
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
    source: 'NotebookLM positioning synthesis 2026-04-27 + Founder School lesson gtm_6 (charge more than you think)',
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
// SECTION 9 · 16 INVESTOR METRICS TRACKER
// =========================================================================

export const INVESTOR_METRICS: InvestorMetric[] = [
  // Business + Financial Metrics (8)
  {
    id: 'bookings_vs_revenue',
    category: 'business',
    rank: 1,
    name: 'Bookings vs. revenue',
    whatItIs:
      'Bookings = strict contractual obligation for a customer to pay. Revenue = service actually delivered + revenue recognized. Verbal agreements (e.g., Sankore "we are interested") are NEITHER.',
    diCurrent: 'Zero contracted bookings · zero recognized revenue · multiple verbal agreements pending',
    diTarget12mo: '3-5 paid design partners contracted · £180K-£420K bookings · ratable revenue recognition',
    whyItMatters:
      'Investors will ignore "verbal interest" entirely. The first contract is the first real signal — only paid commitments count.',
    computeMethod:
      'Bookings: sum of all signed contract values (annualized for SaaS). Revenue: amount recognized per accounting period.',
    tripwire:
      'If 90 days pass with zero contracted bookings, the conversion conversation is broken. Pause shipping, force the close.',
    status: 'unbuilt',
  },
  {
    id: 'arr_mrr',
    category: 'business',
    rank: 2,
    name: 'Annual Recurring Revenue / Monthly Recurring Revenue',
    whatItIs:
      'ARR = annualized contract value of recurring subscriptions. MRR = monthly value. Excludes one-off services / consulting.',
    diCurrent: '£0 ARR · £0 MRR',
    diTarget12mo: '£70-90K ARR (3 design partners × £2,499/mo) → £950K-1.6M ARR by Q4 2027',
    whyItMatters:
      'ARR / MRR scales 5-10× more than one-off professional-services revenue. Investors weight ARR heavily for SaaS valuations (8-15× ARR multiples at Series A).',
    computeMethod:
      'Sum of (active monthly subscription value) × 12 = ARR. Monthly active subscription value = MRR.',
    tripwire:
      'If MRR plateaus for 3+ months without organic growth, GTM motion is broken. Diagnose: pricing? targeting? friction?',
    status: 'unbuilt',
  },
  {
    id: 'gross_profit',
    category: 'business',
    rank: 3,
    name: 'Gross Profit (and Gross Margin)',
    whatItIs: 'Revenue minus direct cost of revenue (COGS). For SaaS: hosting, third-party APIs, payment processing.',
    diCurrent: 'N/A (zero revenue)',
    diTarget12mo: '~90% blended gross margin · honest math per CLAUDE.md (Individual typical 95%, Strategy typical 95%, Enterprise 70-88%)',
    whyItMatters:
      '90% is elite SaaS territory. It signals that every £1 of incremental revenue funds growth, not COGS. Use the honest blended figure (not the 97% ghost-user math) in every investor conversation.',
    computeMethod: '(Revenue - direct COGS) / Revenue. Direct COGS for DI: ~£0.30-0.50/audit Gemini cost + Vercel + Supabase + Resend + sentry.',
    tripwire:
      'If actual gross margin drops below 75% blended, scale economics are broken. Investigate: new model costs? higher API tier? whale-customer Drive polling?',
    status: 'on_track',
  },
  {
    id: 'tcv_acv',
    category: 'business',
    rank: 4,
    name: 'Total Contract Value / Annual Contract Value',
    whatItIs:
      'TCV = entire contract length value. ACV = annualised contract value (TCV / years).',
    diCurrent: 'Target ACV: £30K (Strategy tier) for design partners; £80-200K for F500 enterprise',
    diTarget12mo: 'ACV growth from £30K (wedge design partners) to £80-150K (F500 expansion) over 18 months',
    whyItMatters:
      'ACV growth signals upsell + procurement-grade positioning. Investors look for ACV expansion as a leading indicator of category-leadership.',
    computeMethod: 'TCV: sum of all multi-year contracted commitments. ACV: TCV / contract length in years.',
    tripwire:
      'If ACV stays at £30K across all contracts, expansion motion is broken. F500 conversations should drive £80K+.',
    status: 'unbuilt',
  },
  {
    id: 'ltv',
    category: 'business',
    rank: 5,
    name: 'Lifetime Value (LTV)',
    whatItIs: 'Net profit generated per customer across the customer\'s entire lifetime.',
    diCurrent: 'N/A (no live customers)',
    diTarget12mo: 'Modeled LTV: £30K ACV × ~90% margin / 10% annual churn = £270K LTV (elite SaaS)',
    whyItMatters:
      'LTV / CAC is the unit-economics story investors fund. £270K LTV against ~£10K CAC = 27× LTV/CAC ratio (target is >3×).',
    computeMethod: '(ACV × Gross Margin) / Annual Churn Rate.',
    tripwire:
      'If actual annual churn exceeds 15%, the LTV story collapses fast. Watch outcome-gate-enforcement adoption + design-partner satisfaction quarterly.',
    status: 'unbuilt',
  },
  {
    id: 'unearned_billings',
    category: 'business',
    rank: 6,
    name: 'Unearned (Deferred) Revenue + Billings',
    whatItIs:
      'Unearned: cash collected but not yet recognized as revenue (e.g., annual prepay). Billings = Revenue + Δ deferred revenue.',
    diCurrent: '£0 unearned · £0 billings',
    diTarget12mo:
      'For F500 customers prepaying annually, deferred revenue + billings becomes the forward-looking SaaS-health indicator',
    whyItMatters:
      'Billings is a stronger forward-looking indicator than revenue alone — it shows what the customer base has committed to, not just what has been recognized.',
    computeMethod: 'Billings = Revenue (period) + (Deferred Revenue end - Deferred Revenue start).',
    tripwire:
      'If billings consistently lag revenue, customers are not pre-paying — usually a contract-length issue (everything is monthly, not annual).',
    status: 'unbuilt',
  },
  {
    id: 'cac',
    category: 'business',
    rank: 7,
    name: 'Customer Acquisition Cost (CAC) — paid + blended',
    whatItIs:
      'Paid CAC: cost of paid acquisition channels per customer acquired. Blended CAC: total sales + marketing spend / customers acquired.',
    diCurrent:
      'Estimated: 100 hours × £100/hr founder time = £10K CAC per design partner (no paid marketing yet)',
    diTarget12mo:
      'Paid CAC <£15K via warm-intro + content motion · payback period ~4-5 months at £30K ACV with 90% margin',
    whyItMatters:
      'Investors look for paid CAC viability. £10-15K CAC against a £270K LTV is exceptional. The sub-12-month payback period is the unit-economics close.',
    computeMethod: 'Paid CAC = Paid Marketing Spend / Customers Acquired (in same period). Blended CAC = (Sales + Marketing Spend) / Customers Acquired.',
    tripwire:
      'If paid CAC exceeds £25K without scaled paid channels, the GTM motion is over-reliant on founder time. Hire a GTM co-founder or paid-acquisition specialist.',
    status: 'gap',
  },
  {
    id: 'gmv_skip',
    category: 'business',
    rank: 8,
    name: 'GMV (Gross Merchandise Value) · NOT APPLICABLE',
    whatItIs: 'Total transaction volume on a marketplace.',
    diCurrent: 'N/A — DI is B2B SaaS, not a marketplace',
    diTarget12mo: 'N/A — never use GMV in DI investor conversations',
    whyItMatters:
      'Skip this metric entirely. Mentioning GMV in a SaaS pitch reads as confused or misleading.',
    computeMethod: 'N/A',
    tripwire: 'Never let an investor anchor on GMV — redirect to ARR / billings / bookings.',
    status: 'on_track',
  },

  // Product + Engagement Metrics (5)
  {
    id: 'active_users',
    category: 'product',
    rank: 9,
    name: 'Active Users (defined by audit velocity + outcome reporting)',
    whatItIs:
      'Define explicitly: NOT vanity logins. For DI, active = audit velocity + outcome reporting rate via the 409 Outcome Gate.',
    diCurrent: '0 active paying users',
    diTarget12mo: '3-5 design-partner orgs × ~20 audits/month + ≥40% outcome-reporting rate',
    whyItMatters:
      'Audit velocity proves the workflow stuck. Outcome reporting proves the data flywheel rotated. Together they prove DI is not shelfware.',
    computeMethod: 'Audits per active user per month + (Outcomes Reported / Audits Run) per quarter.',
    tripwire:
      'If audits per user drop below 5/month sustained, the workflow integration broke (per Cloverpop manual-logging trap) — diagnose immediately.',
    status: 'gap',
  },
  {
    id: 'mom_growth',
    category: 'product',
    rank: 10,
    name: 'MoM Growth — Compounded Monthly Growth Rate (CMGR)',
    whatItIs:
      'Compounded Monthly Growth Rate (not simple averages). CMGR = ((Ending value / Starting value) ^ (1/months)) - 1.',
    diCurrent: 'N/A (no MRR yet)',
    diTarget12mo: 'CMGR >15% on MRR for the first 12 months · slows to 8-12% as base grows · benchmark against pre-seed B2B median',
    whyItMatters:
      'Investors evaluate growth via CMGR to benchmark across cohorts. Simple month-over-month averages over-state growth on small bases.',
    computeMethod: '((End MRR / Start MRR) ^ (1/N months)) - 1, where N = number of months.',
    tripwire:
      'If CMGR drops below 8% sustained for 3 months, growth motion is broken. Diagnose pipeline + close-rate + ACV expansion.',
    status: 'unbuilt',
  },
  {
    id: 'churn',
    category: 'product',
    rank: 11,
    name: 'Churn — Gross + Net Revenue Churn',
    whatItIs:
      'Gross churn: actual MRR lost from cancellations. Net revenue churn: gross churn minus upsells / expansion. Negative net churn is the SaaS gold standard.',
    diCurrent: 'N/A (no live customers)',
    diTarget12mo: 'Annual gross churn 5-10% · net revenue churn near-zero or negative as design partners expand seats',
    whyItMatters:
      'Cancellations grow exponentially with customer base — churn IS the ceiling on company size. Keeping it 5-10% prevents the ceiling from collapsing.',
    computeMethod:
      'Gross Annual Churn = (MRR Lost from Cancellations / MRR Start) × 12. Net Revenue Churn = (MRR Lost - MRR Expansion) / MRR Start × 12.',
    tripwire:
      'If gross annual churn exceeds 12%, the product is shelfware for some segment. Identify the churning segment and address (or deliberately exit it).',
    status: 'unbuilt',
  },
  {
    id: 'burn_rate',
    category: 'product',
    rank: 12,
    name: 'Burn Rate — Net + Gross Burn',
    whatItIs:
      'Net burn: actual cash burned per month (expenses minus revenue). Gross burn: total expenses regardless of revenue.',
    diCurrent: 'Net burn: ~£1-2K/month (founder solo, mostly Gemini API + Vercel + Supabase + domain). Gross burn = Net burn (zero revenue offset).',
    diTarget12mo: 'Maintain net burn under £5K/month pre-revenue · 12+ months runway by pre-seed close · target: 18 months at pre-seed',
    whyItMatters:
      'Long runway = leverage in negotiations. Investors prefer founders who do not need to close THIS quarter.',
    computeMethod: 'Net Burn = Total Expenses - Revenue. Gross Burn = Total Expenses.',
    tripwire:
      'If net burn exceeds £10K/month sustained pre-revenue, runway compresses. Cut: paid tools? unnecessary infrastructure? premature hires?',
    status: 'on_track',
  },
  {
    id: 'downloads_skip',
    category: 'product',
    rank: 13,
    name: 'Downloads · VANITY METRIC, SKIP',
    whatItIs: 'Number of times an app is downloaded.',
    diCurrent: 'N/A (DI is web-based, not a downloadable app)',
    diTarget12mo: 'N/A',
    whyItMatters:
      'Skip entirely. Mentioning downloads in a B2B SaaS pitch (no downloadable app) reads as confused.',
    computeMethod: 'N/A',
    tripwire: 'Never let an investor anchor on downloads — redirect to active users + audit velocity.',
    status: 'on_track',
  },

  // Presentation Metrics (3)
  {
    id: 'cumulative_charts_skip',
    category: 'presentation',
    rank: 14,
    name: 'Cumulative Charts · NEVER USE',
    whatItIs: 'Charts showing total cumulative customers / revenue / users over time.',
    diCurrent: 'N/A',
    diTarget12mo: 'NEVER use cumulative charts in pre-seed or seed decks — they always go up-and-to-the-right even when growth is decelerating.',
    whyItMatters:
      'Cumulative charts visually deceive. Investors who notice the chart trick weight against the founder. Use monthly new users / MRR instead.',
    computeMethod: 'Use Monthly New X (e.g., Monthly New MRR) charts instead.',
    tripwire: 'If a deck draft contains a cumulative chart, replace it before sending. Always.',
    status: 'on_track',
  },
  {
    id: 'chart_tricks_skip',
    category: 'presentation',
    rank: 15,
    name: 'Chart Tricks · NEVER USE',
    whatItIs:
      'Omitting Y-axis, shrinking scales to exaggerate growth, presenting percentage gains without absolute numbers.',
    diCurrent: 'N/A',
    diTarget12mo: 'Always show absolute numbers + Y-axis labelled + scale unmanipulated.',
    whyItMatters:
      'Sophisticated investors spot chart tricks instantly and the trust collapses. Honesty is the multiplier on trust.',
    computeMethod: 'Always: Y-axis labelled, scale 0-baseline, absolute numbers next to percentages.',
    tripwire: 'If a deck draft has a chart without a labelled Y-axis or scaled-from-zero baseline, fix it before sending.',
    status: 'on_track',
  },
  {
    id: 'order_of_operations',
    category: 'presentation',
    rank: 16,
    name: 'Order of Operations — Size BEFORE Growth',
    whatItIs:
      'Investor narrative pattern: introduce SIZE first (bookings, revenue, ARR), then GROWTH (MoM, CMGR, churn), then UNIT ECONOMICS (LTV/CAC, gross margin).',
    diCurrent: 'Pre-revenue — size = zero today. Growth narrative anchored in the wedge + ceiling sequence.',
    diTarget12mo: 'For Q3 2026 pre-seed deck: lead with the £70-90K booked ARR + 3 design partners (size), then growth, then unit economics.',
    whyItMatters:
      'Investors evaluate size BEFORE growth. Leading with growth on a tiny base (e.g., 200% MoM growth from £100 → £300 MRR) reads as desperate.',
    computeMethod: 'Deck slide order: 1) Size (booked ARR + customer count) 2) Growth (CMGR + churn) 3) Unit economics (LTV/CAC + margin).',
    tripwire: 'If a deck draft leads with a growth chart on a sub-£100K-ARR base, restructure to lead with size + thesis instead.',
    status: 'on_track',
  },
];

// =========================================================================
// SECTION 10 · FAILURE MODES WATCHTOWER (6 traps, 3 internal + 3 external)
// =========================================================================

export const FAILURE_MODES: FailureMode[] = [
  {
    id: 'quantellia_consulting_trap',
    trap: 'The Unscalable Consulting Trap',
    killedCompany: 'Quantellia',
    diagnostic:
      'Building highly bespoke, complex decision-orchestration models that require heavy consulting + rapid modelling + education to use. The platform becomes difficult to scale, QA, and secure across organisations.',
    diExposure: 'high',
    countermove: [
      'Force the productized 12-node pipeline as the surface — no per-customer custom pipelines',
      'Bespoke design-partner asks become roadmap items if generally applicable, NOT one-off code paths',
      'Founder School lesson es_7 + es_11 codify the rule: free pilots have a 6-week ceiling, then transition to paid Strategy contract',
    ],
    tripwire:
      'If a design-partner conversation requires "let me build that just for you" within the first 30 days, surface the trade-off explicitly. Either the feature is generally applicable (build into the pipeline) or it is not (decline with a why).',
    whatToWatch:
      'Per-customer custom code paths. Engineering hours spent on bespoke vs productized. If bespoke exceeds 30% of weekly engineering, the trap is engaged.',
    evidence: 'NotebookLM external attack synthesis 2026-04-27 + Founder School lessons es_7 + es_11 + CLAUDE.md anti-scope-creep',
  },
  {
    id: 'cloverpop_adoption_trap',
    trap: 'The Manual-Logging Adoption Trap',
    killedCompany: 'Cloverpop (pre-acquisition)',
    diagnostic:
      'Building a system focused on multi-stakeholder collaboration and decision tracking that relies on humans to manually log decisions and fill out templates. Massive adoption friction. Becomes shelfware by month three.',
    diExposure: 'critical',
    countermove: [
      'Integration-first onboarding (Founder School es_9): map workflow IN the discovery call, set up Drive polling or analyze+token@in.decision-intel.com forwarder in 15 minutes BEFORE contract',
      'Zero behavior change is the default — DI runs on the analyst\'s existing artefact stream',
      'Outcome Gate Phase 3 (shipped 2026-04-27) auto-prefills outcome drafts so the user clicks ONCE to confirm',
    ],
    tripwire:
      'If audits per active user drop below 5/month sustained, integration broke. Diagnose: is the email forwarder firing? is Drive polling stuck? did the analyst manually disable?',
    whatToWatch:
      'Audit velocity per design partner per month. Time from analysis-complete to outcome-logged. Both should be under 24 hours when integration is healthy.',
    evidence: 'NotebookLM Q6 pre-mortem (note `9a249bd8`) + CLAUDE.md Outcome Gate locks + NotebookLM PITFALLS.cloverpop_trap entry',
  },
  {
    id: 'cathedral_of_code',
    trap: 'The Cathedral-of-Code Trap (DI-specific, currently active)',
    killedCompany: 'Many over-engineered AI-native startups',
    diagnostic:
      'Sophisticated technical product without paid validation. 200+ components, 70+ API routes, 190K+ LOC built BEFORE the first paid customer.',
    diExposure: 'critical',
    countermove: [
      'Stop horizontal feature shipping. Until first paid design partner closes, every shipping decision answers: "does this make the first 60 seconds of the demo better OR close the first contract faster?"',
      'Outcome Gate Enforcement (Phase 1 + 2 + 3 shipped 2026-04-27) — design partners contractually commit to logging outcomes, accelerating the data flywheel',
      '90-day target: 3-5 paid design partners on £2,499/mo Strategy contract or per-deal pricing',
    ],
    tripwire:
      'If 60 days pass without a paid pilot signed, this weakness is no longer dormant — it IS the active unicorn-killer. Stop building, start closing.',
    whatToWatch:
      'Days since last paid contract signed. Engineering hours spent on net-new features vs. closing-related work. Founder time on building vs founder time on outbound + meetings.',
    evidence: 'CLAUDE.md "Cathedral of code" section + NotebookLM Q6 pre-mortem (note `9a249bd8`) + Honest Probability Path Hard Truth Risks',
  },
  {
    id: 'cloverpop_data_advantage',
    trap: 'Cloverpop Data Advantage (External Attack Vector #1)',
    killedCompany: 'Cloverpop is the threat, not the killed-by',
    diagnostic:
      'Cloverpop was acquired in September 2025 by Clearbox Decisions specifically to commercialize for enterprise. They have YEARS of structured enterprise decision + outcome data we do not have. If Clearbox simply licenses GPT-4o or Claude to run a Kahneman-style bias prompt over their massive existing repository of logged decisions, they instantly replicate "audit" capability backed by REAL historical data.',
    diExposure: 'critical',
    countermove: [
      'Outcome Gate Enforcement accelerates outcome-data accumulation for design-partner orgs — every gated audit forces the loop closure that builds OUR data moat',
      'Pan-African specimen library (WeWork + Dangote + future co-authored sectoral specimens) compounds in dimensions Cloverpop cannot easily extend',
      'The 17-framework regulatory map across G7 / EU / GCC / African markets is structurally something a US-incumbent would need 12-18 months to match',
    ],
    tripwire:
      'If Clearbox launches "Cloverpop AI Audit" with bias-detection capability before Q3 2026, they have closed the gap. Track Clearbox Decisions press releases monthly.',
    whatToWatch:
      'Clearbox Decisions hiring page (any behavioral-science academic hires?) + Cloverpop product release notes + Google Scholar for "decision intelligence + bias" papers from their team',
    evidence: 'CLAUDE.md External Attack Vectors lock 2026-04-26 + NotebookLM external attack synthesis (note `9a249bd8`)',
  },
  {
    id: 'ibm_watsonx_bundling',
    trap: 'IBM watsonx.governance Bundling (External Attack Vector #2)',
    killedCompany: 'IBM is the threat, not the killed-by',
    diagnostic:
      'IBM launched massive Q1 2026 updates to watsonx.governance explicitly targeting EU AI Risk Assessments + automated compliance accelerators. We argue we audit the human decision and IBM audits the model — but Fortune 500 GCs do NOT want to buy two separate governance SKUs. If IBM adds a basic "Human Decision Provenance" module to their existing entrenched watsonx suite, F500 CSOs and GCs will check the EU AI Act Article 14 compliance box with IBM by August 2026 enforcement deadline.',
    diExposure: 'high',
    countermove: [
      'Pan-African / EM-fund wedge is the bypass — IBM does not sell into Pan-African corp dev or EM-focused fund partners with our regulatory depth',
      'The DPR\'s Pan-African regulatory mapping (NDPR / CBN / WAEMU / PoPIA / CMA Kenya) is something IBM watsonx does NOT cover',
      'Long-term: position Decision Intel as the audit layer that integrates WITH IBM watsonx rather than competes — but only after the wedge is established + references exist',
    ],
    tripwire:
      'If IBM watsonx product roadmap shipping notes mention "human decision provenance" or "strategic memo audit" as a Q2-Q3 2026 feature, the bundle threat is active.',
    whatToWatch:
      'IBM watsonx.governance product release notes + IBM Think conference announcements + IBM partner-program AI governance changes + IBM hiring for "AI ethics + decision audit" roles',
    evidence: 'CLAUDE.md External Attack Vectors lock 2026-04-26 + NotebookLM external attack synthesis (note `9a249bd8`)',
  },
  {
    id: 'agentic_shift',
    trap: 'Agentic Shift Makes Strategic Memo Obsolete (External Attack Vector #3)',
    killedCompany: 'Palantir + Databricks + Aera Technology + Snowflake (the threat is structural)',
    diagnostic:
      'Palantir launched its "Agentic AI Hives" manifesto. Databricks is positioning Unity Catalog as an agent control tower. Aera Technology is deploying autonomous agents that execute supply-chain decisions directly. Snowflake is pitching agents acting over governed data. Our entire product is built around uploading a written "strategic memo" — but the volume of human-authored 40-page strategy memos may plummet as enterprises shift from decision-SUPPORT to decision-EXECUTION via agents.',
    diExposure: 'medium',
    countermove: [
      'The 7-minute live audit motion on specimens (Founder School es_10) does NOT depend on memo format — depends on the bias-detection IP being applicable to ANY structured artefact (IC memos, board decks, agent decision logs, agentic system prompts)',
      'Strategic question to revisit Q3 2026: position Decision Intel as the audit layer FOR agents — agentic systems making capital-allocation decisions need a reasoning audit too',
      'Track the agentic-shift telemetry: is the 12-month-out F500 CSO ICP shrinking the volume of human-authored strategic memos?',
    ],
    tripwire:
      'If two F500 prospects independently mention "agents are doing this for us now" in 2026, the memo format is declining faster than the wedge can close. Pivot to audit-layer-for-agents.',
    whatToWatch:
      'Palantir + Databricks + Aera + Snowflake quarterly earnings calls for agentic-decision case studies. Track F500 CSO LinkedIn posts for "agent-led strategy" framing. NotebookLM monitor for the agentic-shift narrative shift.',
    evidence: 'CLAUDE.md External Attack Vectors lock 2026-04-26 + NotebookLM external attack synthesis (note `9a249bd8`)',
  },
];

// =========================================================================
// SECTION 11 · WARM-INTRO NETWORK MAP
// =========================================================================

export const NETWORK_NODES: NetworkNode[] = [
  {
    id: 'wiz_advisor',
    name: 'Wiz Senior Advisor',
    role: 'Senior consultant, scaled Wiz from startup to $32B',
    relationship: 'advisor',
    unlocks: [
      'McKinsey alumni network (heavily saturated per NotebookLM 2026-04-27 synthesis)',
      'F500 CSO warm intros (his consulting portfolio overlap)',
      'Pre-seed VC introductions (enterprise-infra-with-regulatory-tailwind thesis fit)',
      'GTM playbook learnings from Wiz first-paid-F500 pattern',
    ],
    ask: {
      tier1: 'McKinsey QuantumBlack alliances introduction (target: Lieven Van der Veken or Head of Alliances) — highest-ROI per NotebookLM 2026-04-27',
      tier2: 'Specific F500 CSO warm intros (one per quarter, named buyer with thesis fit)',
      tier3: 'Operator-stage angel introductions for advisor convertibles + small pre-seed checks',
    },
    status: 'active',
    cadence: 'Monthly 1:1 + ad-hoc check-ins · sharpen ask specificity each meeting',
    notes:
      'Cadence quality matters more than cadence frequency. Specific pre-qualified asks convert 5× better than generic updates. Closed-loop feedback after every intro is non-negotiable.',
    nextStep:
      'Next 1:1: ask explicitly for the McKinsey QuantumBlack alliance intro. Pre-qualify with: "I have prepared the R²F architecture overview + the EU AI Act Art 14 mapping + the joint-research angle. Who is the right entry point — alliances org or a specific senior partner?"',
  },
  {
    id: 'tasis_school_network',
    name: 'TASIS England School Network',
    role: 'Organic first-degree connections to Oxford / LSE / Imperial',
    relationship: 'school',
    unlocks: [
      'McKinsey London office recruits heavily from these exact programs (NotebookLM 2026-04-27 synthesis confirmed)',
      'Pre-seed angel investors with university affiliations',
      'Future GTM co-founder candidates (Oxford / LSE / Imperial enterprise-sales orientation)',
      'Academic-credibility amplification for the 2008 paper + R²F authority',
    ],
    ask: {
      tier1: 'Warm intros to McKinsey London office staff (alumni from Oxford / LSE / Imperial)',
      tier2: 'Introduction to senior academic mentors (cognitive science, behavioral economics) for academic-credential stacking',
      tier3: 'Speaking opportunity at Oxford / LSE / Imperial student finance / strategy clubs',
    },
    status: 'warm',
    cadence: 'Quarterly outreach to school network · annual alumni events · attend whenever possible',
    notes:
      'School network is dormant unless explicitly activated. Most TASIS connections do not yet know about Decision Intel. The activation move is a 1-page school-context update with the 2008 paper + the pre-seed deck attached.',
    nextStep:
      'Draft a school-network update email + send to 5 strongest connections. Goal: 2 warm introductions to Oxford / LSE / Imperial McKinsey London-bound students + 1 academic mentor connection.',
  },
  {
    id: 'sankore_active_conversation',
    name: 'Sankore (active design-partner conversation)',
    role: 'Pan-African fund · first wedge buyer · Pan-African PE network',
    relationship: 'design_partner',
    unlocks: [
      'First paid design partner (the wedge that proves the wedge)',
      'Pan-African PE network introductions (sponsored conferences, peer GP network)',
      'Reference case study when 6-month outcomes are logged',
      'LP-introduction pathway after 12 months of clean DPR usage',
    ],
    ask: {
      tier1: 'Closed paid design-partner contract on £2,499/mo Strategy + outcome-gate enforcement contractual term',
      tier2: 'Quarterly peer-network introductions (other Pan-African GPs, family offices, EM-focused funds)',
      tier3: 'Co-authored anonymised reference case at month 6 (LP-publishable, named-prospect-redacted per CLAUDE.md)',
    },
    status: 'active',
    cadence: 'Per-conversation cadence · designed-partner playbook from Founder School lesson gtm_8',
    notes:
      'Sankore brief stays INSIDE the Founder Hub per CLAUDE.md no-named-prospects rule. Public surfaces never name Sankore. The relationship IS the wedge proof.',
    nextStep:
      'Close the contract by Q3 2026 with outcome-gate enforcement as a contractual term. Plan the 90-day onboarding: integration-first, retro-audit 3 dead deals, then live IC memos.',
  },
  {
    id: 'lrqa_ian_spaulding',
    name: 'LRQA / Ian Spaulding',
    role: 'Group CEO · global risk-management firm · 60K+ clients · 150+ countries',
    relationship: 'family',
    unlocks: [
      'Channel partnership inside LRQA EiQ supply-chain intelligence software (highest-fit integration path)',
      'Pan-African expansion via Partner Africa acquisition (April 2026)',
      'C-level introductions in his global network of CSOs / M&A leaders',
      'Advisor-grade strategic perspective from a global assurance executive',
    ],
    ask: {
      tier1: 'Integration partnership inside LRQA EiQ — DI as the AI-native reasoning-audit layer for their supply-chain intelligence offering',
      tier2: 'Introductions to his network of CSOs / M&A leaders (warm intros at the highest possible level)',
      tier3: 'Advisor-grade strategic perspective + Founder Hub learnings (no formal advisor relationship needed)',
    },
    status: 'warm',
    cadence: 'Per-meeting cadence · upcoming meeting Q2/Q3 2026 (active warm intro)',
    notes:
      'LRQA brief inside Founder Hub (LrqaTab) is the canonical preparation surface. NEVER leak the brief publicly per CLAUDE.md no-named-prospects rule. Treat as advisor-grade conversation FIRST, partnership conversation second.',
    nextStep:
      'Execute the LRQA brief 6-section playbook. Lead the meeting with the family-warm-intro context, then the EiQ + Partner Africa fit, then propose a 90-day pilot embedded in one service line.',
  },
  {
    id: 'mckinsey_quantumblack',
    name: 'McKinsey QuantumBlack (target — not yet engaged)',
    role: 'McKinsey AI consulting arm · alliances org actively packaging gen-AI engagements with partners (Credo AI, C3 AI)',
    relationship: 'untapped',
    unlocks: [
      'Co-sell channel into Fortune 500 CSOs (their existing buyer base)',
      'Category validation as the strategic-decision-tier peer to Credo AI (model tier)',
      'Co-publishable content (joint research, conference talks) elevating both brands',
      'Long-term: F500 CSO direct ARR pull-through over 12-24 months',
    ],
    ask: {
      tier1: 'Alliance partnership inside QuantumBlack — DI as the EU AI Act Art 14 record-keeping artefact + bias-audit layer in their AI-transformation engagements',
      tier2: 'Joint co-publishable content — "AI Governance + Decision Provenance: the EU AI Act Art 14 Answer" white paper',
      tier3: 'Specific F500 CSO co-sell pilot embedded in one of their live engagements',
    },
    status: 'untapped',
    cadence: 'TBD post-Wiz-advisor introduction',
    notes:
      'Per NotebookLM 2026-04-27, the Wiz advisor is the highest-ROI path. Target Lieven Van der Veken (Senior Partner at QuantumBlack) or the Head of Alliances. Frame the meeting as a peer-level category conversation, NOT a vendor pitch.',
    nextStep:
      'Activate the Wiz-advisor McKinsey path explicitly in next 1:1. Pre-qualify the ask: "I have prepared a peer-level category conversation deck. Who is the right entry point for QuantumBlack alliances?"',
  },
  {
    id: 'cloverpop_aera_ibm',
    name: 'Cloverpop / Aera / IBM watsonx (track-not-engage)',
    role: 'Competitors',
    relationship: 'untapped',
    unlocks: [
      'Competitive intelligence (NOT engagement)',
      'External attack vector tripwire monitoring',
      'Long-term: potential acquirer set if the most-likely outcome (Series-B-stage strategic acquisition at $400M-1B by Q4 2029) lands',
    ],
    ask: {
      tier1: 'Track quarterly product release notes + alliance announcements + senior hires (bias-audit + AI ethics)',
      tier2: 'Monitor for "human decision provenance" or "strategic memo audit" feature additions (IBM watsonx) and "AI bias detection" feature additions (Cloverpop / Clearbox)',
      tier3: 'Evaluate as potential acquirers in the Series B → strategic-acquisition path',
    },
    status: 'cold',
    cadence: 'Monthly competitive intelligence sweep · feed signals into Failure Modes Watchtower tripwires',
    notes:
      'NEVER initiate engagement. NEVER ask for partnership. Track from the outside. The moment any of them ship a competing feature, it triggers a Failure Modes Watchtower tripwire and the strategic posture shifts.',
    nextStep:
      'Set up a calendar reminder for monthly competitive intelligence sweep. First sweep: end of Q2 2026. Document findings in this network-node entry.',
  },
  {
    id: 'pre_seed_target_funds',
    name: 'Pre-Seed Target Funds (untapped, awaiting NotebookLM follow-up)',
    role: 'European + US pre-seed VCs with enterprise-infra-with-regulatory-tailwind thesis',
    relationship: 'untapped',
    unlocks: [
      'Pre-seed £4-8M raise at £20-30M pre-money',
      'Strategic VC introductions (enterprise-infra co-investors)',
      'Operator-angel network access via fund partners',
    ],
    ask: {
      tier1: 'Pre-seed lead commitment — £2-4M check at £20-30M pre-money',
      tier2: 'Strategic VC introductions to fund-co co-investors',
      tier3: 'Operator-angel introductions from fund partners',
    },
    status: 'untapped',
    cadence: 'Activate post-NotebookLM follow-up (see NotebookLM Follow-Up Lab)',
    notes:
      'NotebookLM follow-up question pending: "Pre-seed European + US investors most likely to fund a 16-year-old solo founder building enterprise infra with a Pan-African wedge — name 5 with thesis fit + warm-intro paths." Ship the question + harvest names + map to network.',
    nextStep:
      'Run the NotebookLM follow-up. Map the resulting 5 fund names to existing network (Wiz advisor, school network, design-partner referrals). Sequence outreach: warm-only first.',
  },
  {
    id: 'family_relationships',
    name: 'Family + Personal Network',
    role: 'Closest relationships (LRQA via family, school via close friends, founder personal trust)',
    relationship: 'family',
    unlocks: [
      'Highest-trust introductions (LRQA Ian Spaulding is a family-warm-intro)',
      'Voice-anchoring credibility (founder personal narrative, 2008 paper, school speech on metacognition)',
      'Personal-investor network for advisor convertibles or operator-angel checks',
    ],
    ask: {
      tier1: 'Specific high-leverage warm intros (LRQA pattern — execute exceptionally well, then earn the next ask)',
      tier2: 'Personal-investor cheques for advisor convertibles or pre-seed top-up',
      tier3: 'Voice-anchoring artefacts (school speech recording, 2008 paper PDF, family permissions for narrative usage)',
    },
    status: 'warm',
    cadence: 'Per-relationship · the LRQA pattern is the template',
    notes:
      'Family relationships compound when reciprocated — execute LRQA exceptionally well, deliver every promised follow-up, and the next family ask becomes natural. Treat with maximum respect; never burn the closest relationships.',
    nextStep:
      'Execute the LRQA meeting and follow-up at category-grade level. Document the outcome. Use the LRQA precedent as the case study for future family-warm-intro asks.',
  },
];

// =========================================================================
// SECTION 12 · 90-DAY ACTION PLAN (May - July 2026)
// =========================================================================

export const NINETY_DAY_ACTIONS: NinetyDayAction[] = [
  // Weeks 1-4 (May 2026)
  {
    id: 'close_3_design_partners',
    week: 'Weeks 1-4 · May 2026',
    weekNumber: 1,
    category: 'gtm',
    action: 'Close 3 paid design partners on £2,499/mo Strategy contract or equivalent',
    why: 'Outcome-gate-enforcement requires contracted partners. Cathedral-of-code trap requires paid validation. Pre-seed deck requires booked ARR.',
    successCriterion: '3 signed contracts · £7,497/mo MRR · outcome-gate enforced contractually · integration-first onboarding live',
    blocker: 'Slow procurement cycles · founder time on inbound vs outbound · advisor-network activation cadence',
    effort: 'large',
  },
  {
    id: 'sankore_close',
    week: 'Weeks 1-2',
    weekNumber: 1,
    category: 'gtm',
    action: 'Close Sankore on contract — first wedge proof',
    why: 'Sankore brief is at-the-ready. Pan-African anchor IS the moat. Closed Sankore unlocks the Pan-African PE network referrals.',
    successCriterion: 'Sankore signed contract · 90-day onboarding plan · 3 retro-audits + live IC pipeline · outcome-gate enforced',
    blocker: 'ISA 2007 framework gap (critical Nigerian regulator). DQI explainability + CIs not yet shipped.',
    dependsOn: ['ship_isa_2007', 'ship_dqi_cis'],
    effort: 'medium',
  },
  {
    id: 'ship_isa_2007',
    week: 'Weeks 1-2',
    weekNumber: 1,
    category: 'product',
    action: 'Ship ISA 2007 (Nigerian Investment & Securities Act 2007) framework module',
    why: 'Sankore-class deal-killer. The Pan-African 17-framework map drops to 18 with this. CLAUDE.md Enterprise Friction Matrix lock 2026-04-26.',
    successCriterion: 'ISA 2007 framework live in getAllRegisteredFrameworks() · DPR specimens regenerated · /security page updated',
    blocker: 'Solo dev time. ISA 2007 statute reading time.',
    effort: 'medium',
  },
  {
    id: 'ship_dqi_cis',
    week: 'Weeks 1-3',
    weekNumber: 1,
    category: 'product',
    action: 'Add 90% confidence intervals on counterfactual dollar outputs',
    why: 'F500 audit chairs reject heuristic-based financial estimates without CIs. DQI explainability is the procurement-gate enabler for F500 expansion.',
    successCriterion: 'CounterfactualPanel renders ±X% CI band · DPR Counterfactual Impact section carries Wilson-CI text · regression tests pass',
    blocker: 'Sample-size requirements (Wilson CI requires N≥10 outcomes for tightest band). Acceptable to ship with low-N caveat.',
    effort: 'medium',
  },

  // Weeks 5-8 (June 2026)
  {
    id: 'mckinsey_quantumblack_intro',
    week: 'Weeks 5-6 · June 2026',
    weekNumber: 5,
    category: 'authority',
    action: 'Activate Wiz advisor → McKinsey QuantumBlack alliance intro',
    why: 'Per NotebookLM McKinsey synthesis 2026-04-27, this is the highest-ROI advisor ask. Channel partnership unlocks F500 CSO direct ARR pull-through.',
    successCriterion: 'First peer-level conversation booked with QuantumBlack senior partner or alliances head · category-conversation deck delivered',
    blocker: 'Advisor-relationship cadence. Specific-ask preparation discipline.',
    effort: 'small',
  },
  {
    id: 'lrqa_meeting_executed',
    week: 'Weeks 5-6',
    weekNumber: 5,
    category: 'authority',
    action: 'Execute LRQA / Ian Spaulding meeting + 48h follow-up playbook',
    why: 'Family-warm-intro at C-level. EiQ + Partner Africa integration paths are uniquely fit. The LRQA precedent becomes the template for future warm-intro briefs.',
    successCriterion: 'Meeting delivered · 48h follow-up cadence executed · second meeting booked OR decline-with-reason logged',
    blocker: 'Single highest-stakes meeting of the quarter. Preparation must be category-grade.',
    effort: 'large',
  },
  {
    id: 'pre_seed_deck_v1',
    week: 'Weeks 5-8',
    weekNumber: 5,
    category: 'fundraise',
    action: 'Draft pre-seed deck v1 — 12 slides + the HonestProbabilityPath + the 16 investor metrics tracker',
    why: 'Once 3 design partners closed + LRQA second meeting + QuantumBlack alliance conversation, the deck is the next leverage point.',
    successCriterion: 'Deck draft v1 reviewed by Wiz advisor · 3 specific revisions complete · ready for warm investor intros',
    blocker: 'Deck writing time. Investor-narrative discipline (size before growth, no chart tricks).',
    dependsOn: ['close_3_design_partners'],
    effort: 'medium',
  },

  // Weeks 9-12 (July 2026)
  {
    id: 'gtm_co_founder_search',
    week: 'Weeks 9-10 · July 2026',
    weekNumber: 9,
    category: 'authority',
    action: 'Launch GTM co-founder / advisor search via Wiz-advisor network + operator-angel list',
    why: 'Founder continuity question is the #1 pre-seed VC objection. GTM co-founder addresses both continuity AND outbound capacity.',
    successCriterion: '5 GTM-co-founder conversations completed · 2 advisor convertibles closed · continuity playbook v1 drafted for pre-seed deck',
    blocker: 'Co-founder economic alignment (equity grant + cash compensation). Founder evaluation discipline.',
    effort: 'large',
  },
  {
    id: 'reference_case_first_publication',
    week: 'Weeks 11-12',
    weekNumber: 11,
    category: 'authority',
    action: 'Publish first anonymised reference case (Sankore-anchored, name-redacted)',
    why: 'Wedge generates references. References unlock F500 ceiling. CLAUDE.md no-named-prospects rule is the discipline gate.',
    successCriterion: 'First anonymised reference case live on /case-studies · LinkedIn announcement drives X content engagements',
    blocker: 'Sankore approval for anonymised publication. Outcome-data accumulation timeline.',
    dependsOn: ['sankore_close'],
    effort: 'medium',
  },
  {
    id: 'pre_seed_lead_term_sheet',
    week: 'Weeks 11-12',
    weekNumber: 11,
    category: 'fundraise',
    action: 'Secure pre-seed lead term sheet · target £2-4M lead at £20-30M pre-money',
    why: 'Pre-seed close by Q4 2026 is the HonestProbabilityPath Phase 1 conditional probability gate. Without it, the path collapses.',
    successCriterion: 'Term sheet from a thesis-fit pre-seed VC · co-investor confirmation · 12-week close timeline',
    blocker: 'Investor due-diligence cycle. Continuity playbook strength. Design-partner reference readiness.',
    dependsOn: ['close_3_design_partners', 'gtm_co_founder_search', 'pre_seed_deck_v1'],
    effort: 'large',
  },

  // Continuous (every week)
  {
    id: 'outcome_gate_telemetry',
    week: 'Continuous',
    weekNumber: 0,
    category: 'data',
    action: 'Monitor outcome-gate telemetry weekly · audit velocity per design partner · time-to-outcome-logged',
    why: 'Cloverpop manual-logging trap is the #1 active failure mode. Audit velocity drop signals integration broke.',
    successCriterion: 'Audits per active user per month >5 sustained · time-from-analysis-to-outcome <48h sustained',
    blocker: 'Manual telemetry today. Automated dashboard would be ideal but is not blocking.',
    effort: 'small',
  },
  {
    id: 'competitive_intelligence_sweep',
    week: 'Continuous · monthly',
    weekNumber: 0,
    category: 'positioning',
    action: 'Monthly competitive intelligence sweep · Cloverpop / Aera / IBM watsonx / Palantir / Quantexa / Snowflake',
    why: 'External attack vectors require active monitoring. The moment any incumbent ships a competing feature, the strategic posture shifts.',
    successCriterion: 'Monthly sweep documented · Failure Modes Watchtower tripwires updated · CLAUDE.md External Attack Vectors section refreshed if needed',
    blocker: 'Time investment (~2-3 hours per month).',
    effort: 'small',
  },
];

// =========================================================================
// SECTION 13 · NOTEBOOKLM FOLLOW-UP LAB (10 high-value next questions)
// =========================================================================

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
      'Cloverpop\'s actual ACV and customer-count progression — find any disclosed numbers from press, court filings, acquisition disclosure (Clearbox Decisions Sept 2025), Crunchbase, or PitchBook. What did their first 10 paid customers look like? What was the typical ACV at acquisition?',
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
      'What questions will an LP ask the GP about Decision Intel\'s DPR before they let the GP use it for IC reporting? Specific framework concerns (anti-money laundering, data residency, indemnification, exit rights), specific procurement-grade gates.',
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
// META · count helpers
// =========================================================================

export const SECTION_COUNTS = {
  strengths: STRENGTHS.length,
  weaknesses: WEAKNESSES.length,
  rolePlaybooks: ROLE_PLAYBOOKS.length,
  r2fLevers: R2F_MOAT_LEVERS.length,
  killerResponses: KILLER_RESPONSES.length,
  personaPitches: PERSONA_PITCH_LIBRARY.length,
  languagePatterns: LANGUAGE_PATTERNS.length,
  investorMetrics: INVESTOR_METRICS.length,
  failureModes: FAILURE_MODES.length,
  networkNodes: NETWORK_NODES.length,
  ninetyDayActions: NINETY_DAY_ACTIONS.length,
  notebookLmFollowUps: NOTEBOOKLM_FOLLOW_UPS.length,
};
