/**
 * WarmIntroNetworkMap consumer data — 8 network nodes with 3-tier ask
 * hierarchy. Split out from monolithic data.ts at F2 lock 2026-04-29.
 *
 * When a network node closes / cools / re-warms, update HERE.
 */

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

export const NETWORK_NODES: NetworkNode[] = [
  {
    id: 'wiz_advisor',
    name: 'Josh Rainer (Wiz Senior Advisor)',
    role: 'Senior consultant, scaled Wiz from startup to $32B',
    relationship: 'advisor',
    unlocks: [
      'McKinsey alumni network heavily saturated · highest-ROI advisor ask per NotebookLM 2026-04-27',
      'Direct warm line to Cyberstarts (Wiz seed backer) and Index Ventures (Wiz backer) — both already know the Wiz pattern intimately',
      'F500 CSO warm intros via his consulting portfolio overlap',
      'Conviction (Sarah Guo) — likely partner / LP overlap per NotebookLM synthesis',
      'GTM playbook learnings from Wiz first-paid-F500 pattern',
    ],
    ask: {
      tier1:
        'McKinsey QuantumBlack alliances introduction (target: Lieven Van der Veken — Senior Partner, led the Wonderful agentic-AI collaboration; alternative: Head of Alliances, Head of Ecosystem, QuantumBlack London office lead) — highest-ROI per NotebookLM 2026-04-27. Side-door alternative: apply to Credo AI partner program first (McKinsey is launch partner) — bypasses direct from-scratch onboarding friction',
      tier2:
        'Pre-seed warm intros to the 5 named target funds: Cyberstarts, Index Ventures, Conviction (Sarah Guo), Neo Residency (Ali Partovi), and a direct introduction route to Elad Gil',
      tier3:
        'Specific F500 CSO warm intros (one per quarter, named buyer with thesis fit) + operator-stage angel introductions for advisor convertibles',
    },
    status: 'active',
    cadence: 'Monthly 1:1 + ad-hoc check-ins · sharpen ask specificity each meeting',
    notes:
      'Cadence quality matters more than cadence frequency. Specific pre-qualified asks convert 5× better than generic updates. Closed-loop feedback after every intro is non-negotiable. Per NotebookLM 2026-04-27, his Wiz-Cyberstarts-Index relationship is the most direct enterprise-pre-seed-VC route Decision Intel has — use it before going wider.',
    nextStep:
      'Next 1:1: ask explicitly for the McKinsey QuantumBlack alliance intro to Lieven Van der Veken (or apply to Credo AI partner program as the side-door). Pre-qualify with: "I have prepared the R²F architecture overview + the EU AI Act Art 14 mapping + the joint-research angle. Cyberstarts and Index Ventures should be the next two pre-seed conversations — both know the Wiz pattern. Can you make those introductions?"',
  },
  {
    id: 'uk_networking_events',
    name: 'UK Networking Events · in-person CSO + PE/VC + M&A circles',
    role: 'London-based networking events · founder physically in the room · highest signal-to-noise outreach channel for the 30-day fast-converter pivot',
    relationship: 'untapped',
    unlocks: [
      'Direct in-person introductions to mid-market PE/VC associates and boutique M&A partners (the 3 fast-converter archetypes)',
      'Solo / fractional CSO connections in London ex-MBB community',
      'Real-time customer-feedback conversations · 5 minutes of in-person reaction beats 50 LinkedIn DMs',
      'Discovery-call scheduling without the cold-DM friction · "I met you at X, want to walk through this on Tuesday?"',
    ],
    ask: {
      tier1:
        'Attend 2-3 high-density events / month: London PE & VC Networks · M&A Tuesday · The Strategic Advisors London · British Private Equity & Venture Capital Association (BVCA) socials · UK CSO Forum events · ex-McKinsey / BCG / Bain alumni socials · Founders Forum / Slush London',
      tier2:
        'Bring 1-page DPR specimen + the WeWork audit teaser · pitch in 30 seconds, qualify in 90, schedule 20-min call within the week',
      tier3:
        'Build a recurring presence · become known as "the kid who built the bias auditor" in 2-3 specific event communities',
    },
    status: 'untapped',
    cadence:
      'Weekly · 2-3 events / month minimum · the founder being PHYSICALLY in the room is the unlock',
    notes:
      "Per founder direction 2026-04-28: UK is the actual market focus for the 30-day pivot. Founder is in London. In-person beats LinkedIn DM by an order of magnitude for the fast-converter archetypes — they trust someone they've looked in the eye before they swipe a credit card. The Naira pricing reality (£2K/mo Nigerian feels like £5K/mo in real purchasing power) is also why UK is the immediate market — Sankore stays as the summer design-partner wedge, not the immediate revenue source.",
    nextStep:
      'Identify 5 specific events in London for May 2026: list event date + likely attendees + specific 30-second pitch tuned to that audience + 3 follow-up DM templates for post-event. First event by week 2 of May.',
  },
  {
    id: 'extended_family_mckinsey',
    name: 'Extended-family McKinsey connections',
    role: 'Direct family relationships with current / former McKinsey consultants · founder direction 2026-04-28',
    relationship: 'family',
    unlocks: [
      'Warm intros to McKinsey London office partners and consultants (alongside Wiz advisor → QuantumBlack alliance path)',
      "Real ex-MBB fractional CSOs in the founder's extended network · the solo-CSO archetype is most likely buyer in this network",
      "Validation network for the 5 silent objections — family connections will give honest feedback that strangers won't",
      'Long-term: McKinsey alumni who become F500 CSOs over time',
    ],
    ask: {
      tier1:
        'Specific ask: 1-2 introductions to current McKinsey London consultants who would benefit from running their own pre-IC drafts through DI · the associate-archetype price point ($149/mo) is well below their corporate-card threshold',
      tier2:
        'Honest customer-feedback conversation · "I\'m about to pitch this to mid-market PE/VC associates. What would you tell them? What would you push back on?"',
      tier3:
        'Long-term: McKinsey alumni introductions when they leave for fractional CSO careers (ex-MBB → independent advisor pattern)',
    },
    status: 'warm',
    cadence: 'Per-relationship · activate 1 conversation / week starting week 1 of May 2026',
    notes:
      'Per founder direction 2026-04-28: extended-family connections compound when reciprocated. Treat with maximum respect; never burn the closest relationships. This is parallel to the Wiz-advisor → QuantumBlack alliance path — both routes to the same destination, both worth running.',
    nextStep:
      'List the named extended-family connections by name in private notes (NOT in this codebase — privacy). Reach out individually with a specific ask: "Can I get 30 minutes of your honest feedback on this product? I\'m about to pitch to associates and want to stress-test the message."',
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
      tier2:
        'Introduction to senior academic mentors (cognitive science, behavioral economics) for academic-credential stacking',
      tier3: 'Speaking opportunity at Oxford / LSE / Imperial student finance / strategy clubs',
    },
    status: 'warm',
    cadence:
      'Quarterly outreach to school network · annual alumni events · attend whenever possible',
    notes:
      'School network is dormant unless explicitly activated. Most TASIS connections do not yet know about Decision Intel. The activation move is a 1-page school-context update with the 2008 paper + the pre-seed deck attached.',
    nextStep:
      'Draft a school-network update email + send to 5 strongest connections. Goal: 2 warm introductions to Oxford / LSE / Imperial McKinsey London-bound students + 1 academic mentor connection.',
  },
  {
    id: 'sankore_active_conversation',
    name: 'Sankore · summer 2026 design-partner wedge (NOT immediate revenue)',
    role: 'Pan-African fund · summer design-partner wedge for product rigor + Pan-African PE network · NOT primary outbound for the 30-day pivot per founder direction 2026-04-28',
    relationship: 'design_partner',
    unlocks: [
      'First paid design partner (the wedge that proves the wedge)',
      'Pan-African PE network introductions (sponsored conferences, peer GP network)',
      'Q4 2026 anonymised "Bias Autopsy" reference case · target shape: "Across 30 audited deals in the Pan-African industrial / fintech sector, DQI scores improved by X%, mitigating Sunk-Ship toxic combination saved £Y in misallocated capital"',
      'LP-introduction pathway after 12 months of clean DPR usage',
    ],
    ask: {
      tier1:
        'Closed paid design-partner contract on £2,499/mo Strategy + outcome-gate enforcement contractual term · Day-30 target ≥3 audits (habit formation) · Day-60 target ≥50% outcome-reporting rate (flywheel activation) · Day-90 target first External DPR Share Event (board-grade utility — the conversion signal that proves the artefact is being shared with LPs / co-investors / auditors)',
      tier2:
        'Quarterly peer-network introductions (other Pan-African GPs, family offices, EM-focused funds) once Day-90 metric hits',
      tier3:
        'Co-authored anonymised "Bias Autopsy" reference case at Q4 2026 publication (LP-publishable, named-prospect-redacted per CLAUDE.md no-named-prospects rule)',
    },
    status: 'active',
    cadence:
      'Day 1-7: integration-first onboarding (Drive polling or analyze+token@in.decision-intel.com forwarder live in 15 min during discovery call) · weekly Brier-score sync · Day 30 / 60 / 90 metric checkpoints · monthly partner 1:1 with founder',
    notes:
      'Per founder direction 2026-04-28: Sankore is the SUMMER 2026 design-partner wedge — NOT the primary 30-day outbound target. The Naira pricing reality (£2K/mo Nigerian feels like £5K/mo in real purchasing power) means revenue mathematics are weaker for a UK-based founder than focusing on the 3 fast-converter archetypes (mid-market PE/VC associate, boutique M&A advisor, solo fractional CSO). Sankore is essential for product rigor + Pan-African network + Q4 2026 Bias Autopsy reference case. But pitching them now dilutes focus from the validators who will pay £149-£499 in 14-30 days. Per NotebookLM 2026-04-27 Day-90 synthesis: three highest-probability failure modes — (1) Integration shelfware (countermove: integration-first onboarding, zero behavior change); (2) Dormant data flywheel (countermove: enforce 409 Outcome Gate); (3) Unpaid dev shop / scope creep (countermove: "no custom features outside published roadmap" rule). Sankore brief stays INSIDE the Founder Hub per CLAUDE.md no-named-prospects rule.',
    nextStep:
      'Defer active sales outreach to summer 2026 (June-August). Use spring 2026 (May) for: (a) UK fast-converter validation (3 paid customers on £149-£499); (b) ISA 2007 + FRC Nigeria current code shipped in compliance/frameworks; (c) DPR Pan-African specimen refined based on UK-validator feedback. Then approach Sankore in summer 2026 from a position of paid validation + tight regulatory mapping, NOT a position of pre-revenue uncertainty.',
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
      tier1:
        'Integration partnership inside LRQA EiQ — DI as the AI-native reasoning-audit layer for their supply-chain intelligence offering',
      tier2:
        'Introductions to his network of CSOs / M&A leaders (warm intros at the highest possible level)',
      tier3:
        'Advisor-grade strategic perspective + Founder Hub learnings (no formal advisor relationship needed)',
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
    role: 'McKinsey AI consulting arm · embeds 3rd-party tooling in $500K-5M F500 transformation engagements · alliances calendar packs gen-AI partners (Credo AI, C3 AI, Wonderful)',
    relationship: 'untapped',
    unlocks: [
      'Co-sell channel into Fortune 500 CSOs (McKinsey embeds tooling INTO $500K-5M engagements — not reseller, joint procurement) · reduces F500 friction of two separate purchase orders',
      'Category validation as the strategic-decision-tier peer to Credo AI (model tier)',
      'Co-publishable content (joint research, conference talks) elevating both brands',
      'Long-term: F500 CSO direct ARR pull-through over 12-24 months · partner equity-investment pattern is common at this stage',
    ],
    ask: {
      tier1:
        'Direct alliance partnership inside QuantumBlack — entry points (in priority): (a) Lieven Van der Veken — Senior Partner, led Wonderful agentic-AI collaboration (highest-fit entry); (b) Head of Alliances; (c) Head of Ecosystem; (d) QuantumBlack London office lead. Frame as peer-level category conversation, NOT vendor pitch.',
      tier2:
        'Side-door via Credo AI partner program — McKinsey is launch partner; applying to Credo AI first gives streamlined indirect entry into McKinsey alliance ecosystem and bypasses friction of from-scratch consultancy onboarding',
      tier3:
        'Joint co-publishable content — "AI Governance + Decision Provenance: the EU AI Act Art 14 Answer" white paper · then specific F500 CSO co-sell pilot embedded in one of their live engagements',
    },
    status: 'untapped',
    cadence:
      'TBD post-Wiz-advisor introduction · NotebookLM 2026-04-27 confirmed alliance onboarding timeline is not codified but Credo AI side-door is the fastest entry point',
    notes:
      'Per NotebookLM 2026-04-27 master-KB synthesis: McKinsey hesitates to partner with pre-revenue startups, but DI leverage = (a) execution velocity (16-year-old solo shipping at Claude time deters McKinsey from building in-house competitor) + (b) category timing (QuantumBlack governance positioning is crystallizing THIS quarter — be in their vocabulary now). Killer line for the meeting: "McKinsey provides the strategy. Decision Intel provides the continuous audit and the EU AI Act Art 14 regulatory record."',
    nextStep:
      'Run TWO paths in parallel: (1) Activate Wiz-advisor McKinsey path explicitly in next 1:1 — pre-qualify "I want intro to Lieven Van der Veken or QuantumBlack alliances. I have prepared the peer-level category conversation deck + the EU AI Act Art 14 mapping + the joint-research angle. Cost is high, leverage is unique." (2) Apply to Credo AI partner program directly as side-door entry. Whichever responds first is the open door.',
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
      tier1:
        'Track quarterly product release notes + alliance announcements + senior hires (bias-audit + AI ethics)',
      tier2:
        'Monitor for "human decision provenance" or "strategic memo audit" feature additions (IBM watsonx) and "AI bias detection" feature additions (Cloverpop / Clearbox)',
      tier3: 'Evaluate as potential acquirers in the Series B → strategic-acquisition path',
    },
    status: 'cold',
    cadence:
      'Monthly competitive intelligence sweep · feed signals into Failure Modes Watchtower tripwires',
    notes:
      'NEVER initiate engagement. NEVER ask for partnership. Track from the outside. The moment any of them ship a competing feature, it triggers a Failure Modes Watchtower tripwire and the strategic posture shifts.',
    nextStep:
      'Set up a calendar reminder for monthly competitive intelligence sweep. First sweep: end of Q2 2026. Document findings in this network-node entry.',
  },
  {
    id: 'pre_seed_target_funds',
    name: 'Pre-Seed Target Funds (5 named · NotebookLM 2026-04-27)',
    role: 'European + US pre-seed VCs with enterprise-infra + regulatory-tailwind + EM-wedge + founder-led-category-creation thesis fit',
    relationship: 'untapped',
    unlocks: [
      'Pre-seed £4-8M raise at £20-30M pre-money',
      'Strategic VC introductions to thesis-fit co-investors',
      'Operator-angel network access via fund partners',
    ],
    ask: {
      tier1:
        '5 named target funds in priority order: (1) Cyberstarts — Wiz seed backer · direct warm line via Josh Rainer · enterprise-trust + regulatory thesis fit. (2) Index Ventures — Wiz backer · top-tier US/EU presence · uniquely equipped for Pan-African wedge + EU AI Act regulatory moat. (3) Conviction (Sarah Guo) — AI-native fund · backed Baseten, Anthropic · Josh Rainer likely LP/partner overlap. (4) Elad Gil (solo GP) — backed Perplexity, Cognition, Scale AI · explicitly reads cold email when founder arc is unusual · 16-year-old solo + 2008 paper + 190K LOC = exact outlier profile. (5) Neo Residency (Ali Partovi) — first cohort summer 2026 · backed Cursor, Kalshi · selective bet on unusually-exceptional individuals',
      tier2: 'Strategic VC introductions to fund-co co-investors after lead commitment',
      tier3: 'Operator-angel introductions from fund partners after term sheet',
    },
    status: 'untapped',
    cadence:
      'Sequence: Cyberstarts + Index first (both via Josh Rainer warm intros) → Conviction (Sarah Guo) → Neo Residency (apply summer 2026) → Elad Gil (cold email)',
    notes:
      'Per NotebookLM master KB synthesis 2026-04-27. Comparable check sizes: Conviction backed Baseten + Anthropic; Index backed Wiz; Elad Gil writes $250K-$1M solo checks; Neo backed Cursor + Kalshi. The Wiz advisor (Josh Rainer) opens 3 of the 5 doors directly — use that lever first. Elad Gil cold email is the only path that does NOT require the advisor (he reads outlier-profile cold email by design).',
    nextStep:
      'In the next Josh Rainer 1:1 ask explicitly: "Cyberstarts and Index — both knew the Wiz pattern, both fund enterprise infra. Can you make warm introductions?" In parallel, draft the Elad Gil cold email + reference the 2008 paper + the 190K LOC + the R²F intellectual moat in the first sentence. Time-box Neo Residency application to summer 2026 launch.',
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
      tier1:
        'Specific high-leverage warm intros (LRQA pattern — execute exceptionally well, then earn the next ask)',
      tier2: 'Personal-investor cheques for advisor convertibles or pre-seed top-up',
      tier3:
        'Voice-anchoring artefacts (school speech recording, 2008 paper PDF, family permissions for narrative usage)',
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

