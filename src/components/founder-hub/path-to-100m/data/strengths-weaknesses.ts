/**
 * StrengthsWeaknessesMatrix consumer data — split out from the
 * monolithic data.ts at F2 lock 2026-04-29 to keep the path-to-100m
 * bundle from regressing on every NotebookLM synthesis edit.
 *
 * Source synthesis: NotebookLM Master KB note `9a249bd8` (External
 * Attack Vectors) + 2026-04-27 strengths/weaknesses thesis. When the
 * synthesis evolves, update HERE only — the consumer renders by
 * importing these typed exports.
 */

import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';

const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;

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
      'Velocity becomes a weakness when it produces breadth without paid validation. If 90 days pass without a paid design partner, velocity is being misallocated — pause shipping, focus 100% on close.',
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
    nbLmCitation:
      'NotebookLM strengths synthesis 2026-04-27 — point 3 + CLAUDE.md ICP lock 2026-04-26',
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
    title: `${FRAMEWORK_COUNT}-framework regulatory map · procurement-grade compliance moat`,
    category: 'compliance',
    evidence: [
      'EU AI Act Art 13/14/15 + Annex III mapped (the anchor tailwind, Aug 2026 enforcement)',
      'Basel III Pillar 2 ICAAP + SOX §404 + SEC Reg D + GDPR Art 22 + Colorado SB24-205 + California SB942',
      '11 internationally-recognised AI Verify Foundation principles — dedicated mapping page at /regulatory/ai-verify',
      `${FRAMEWORK_COUNT} frameworks structurally derived from getAllRegisteredFrameworks().length so copy never drifts (CLAUDE.md count-discipline rule)`,
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
      "Default onboarding requires analyst behavior change (login + manual upload) — Cloverpop's exact failure pattern (per Failure Modes Watchtower)",
      'Founder hours capped at 50-70/week (16-year-old, school commitments, AP load 11th grade Aug 2026 - Jun 2027)',
      'Risk: the "please pilot users" trap — building custom features for free pilots instead of forcing the hard transition to paid Strategy contract',
    ],
    whyItHurts:
      'If the analyst has to change behavior to use DI (vs. their existing email + Slack + Drive workflow), DI becomes shelfware by month three. Adoption is THE adoption metric — without it, even the few paid pilots churn before the data flywheel rotates.',
    countermove: [
      'Integration-first onboarding (Founder School es_9): map the workflow IN the discovery call, set up Google Drive polling or analyze+token@in.decision-intel.com forwarder in 15 minutes BEFORE contract',
      "Make zero behavior change the default — DI runs on the analyst's existing artefact stream (memos arrive in Drive → audit fires automatically → email digest summarises)",
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

