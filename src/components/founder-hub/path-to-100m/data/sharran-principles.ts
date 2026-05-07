/**
 * Sharran Srivatsaa Operating Principles — typed source of truth for the
 * Sharran integration across PathToHundredMillionTab + FounderOSTab.
 *
 * Locked 2026-05-07 from a 4-question NotebookLM master KB synthesis pass
 * (notebook 809f5104) against the existing video summary source. The KB
 * synthesis re-derived each principle against the founder's actual
 * constraints (16-yo solo, ~28hr/week, pre-revenue, fundraising 6-12mo)
 * rather than generic-pasting Sharran's tactics. Every principle below
 * carries:
 *   - the Sharran framing
 *   - the DI-specific applied framing (cross-referenced to CLAUDE.md
 *     locks: GTM v3.5 wedge motion, $30M+ exit math, External Attack
 *     Vectors, 200+ component reality)
 *   - phase tag — APPLICABLE_NOW / ABOUT_TO_BE_RELEVANT / INAPPLICABLE
 *   - a specific 90-day action when APPLICABLE_NOW
 *
 * Cross-references in the master KB:
 *   - CLAUDE.md "Sharran 1-1-1 framework (locked v3.2)" — the wedge motion
 *   - CLAUDE.md GTM v3.5 (2026-05-04) — Phase 1 wedge/bridge/ceiling
 *   - CLAUDE.md External Attack Vectors — Cloverpop / IBM / Agentic Shift
 *   - PathToHundredMillionTab existing surfaces (StrengthsWeaknessesMatrix,
 *     FailureModesWatchtower, WarmIntroNetworkMap)
 *
 * When updating: keep the "appliedToDi" copy specific (named surfaces +
 * CLAUDE.md anchors) rather than generic. The whole point of running the
 * KB synthesis was to avoid generic-paste; this file is the contract.
 */

export type SharranPrincipleId =
  | 'one_one_one'
  | 'tss_diagnostic'
  | 'exit_mindset'
  | 'a_players'
  | 'lifestyle_freeze'
  | 'wealth_is_who'
  | 'bottlenecks_first';

export type PhaseTag = 'APPLICABLE_NOW' | 'ABOUT_TO_BE_RELEVANT' | 'INAPPLICABLE';

export interface SharranPrinciple {
  id: SharranPrincipleId;
  number: number;
  name: string;
  /** Single-line subhead for the card eyebrow. */
  subhead: string;
  /** Sharran's verbatim mental model (1-2 sentences). */
  sharranFraming: string;
  /** Applied to Decision Intel — KB-derived, specific to current state. */
  appliedToDi: string;
  /** When this principle applies for Folahan specifically. */
  phaseTag: PhaseTag;
  /** Reason for the phase tag — load-bearing for the card's body. */
  phaseRationale: string;
  /** Specific 90-day action when APPLICABLE_NOW. Null when ABOUT_TO_BE_RELEVANT or INAPPLICABLE. */
  ninetyDayAction: string | null;
  /** Optional CTA — links to a sibling DI surface (e.g. another Sharran tool). */
  cta?: { label: string; href?: string; surfaceId?: string };
}

/**
 * The 1-1-1 violation table — load-bearing hero on the Sharran surface.
 * Each row is a specific Phase 1 wedge claim juxtaposed with the actual
 * shipped state per the KB synthesis Q1 response.
 *
 * Procurement-grade voice: name the specific violation + the specific
 * fix. Don't soften.
 */
export interface OneOneOneViolation {
  pillar: 'Traffic' | 'Conversion' | 'Delivery';
  /** What the locked Phase 1 wedge says. */
  claimed: string;
  /** What the platform actually ships today. */
  actualShipped: string;
  /** The specific Phase 1 fix. */
  fix: string;
}

export const ONE_ONE_ONE_VIOLATIONS: OneOneOneViolation[] = [
  {
    pillar: 'Traffic',
    claimed:
      'ONE traffic source — LinkedIn DMs to four HXC personas + 2 London events/month max.',
    actualShipped:
      'N ingestion doors visible to a Phase 1 buyer: manual upload, batch upload (×10), email forwarding, Slack ingestion, meeting transcripts, direct API.',
    fix: 'Hide every ingestion door except the single drag-drop upload box for new Phase 1 sign-ups. Email/Slack/meeting ingest stays in product but lives BEHIND a feature flag until day-14.',
  },
  {
    pillar: 'Conversion',
    claimed:
      'ONE conversion mechanism — 20-min audit on a real strategic memo → £249/mo Individual sign-up.',
    actualShipped:
      'Public pricing menu with 4 tiers (Free / Individual / Strategy / Custom) + roadmap per-deal pricing $499–$4,999. Triggers the exact Paradox of Choice the audit pipeline detects.',
    fix: 'Phase 1 marketing surfaces lead with ONE price-card (£249/mo Individual). Strategy + Enterprise tiers live one page deeper for the procurement reader who explicitly seeks them.',
  },
  {
    pillar: 'Delivery',
    claimed: 'ONE delivery model — self-serve sign-up + Individual £249/mo subscription.',
    actualShipped:
      '200+ components, 70+ API routes, 28-tab Founder Hub, 10 distinct analysis tabs (Overview / Replay / Logic / SWOT / Noise / Red Team / Boardroom / Simulator / Intuition / Intelligence) + Decision Rooms + RSS feeds + Slack bot + D3 force-directed graphs. Phase 4-architected for a Phase 1 buyer.',
    fix: 'First-7-days dashboard = Discovery-Grade single-screen experience: upload → DQI verdict + top-3 fixes + DPR export. Every tab beyond Findings hidden behind a "show advanced" toggle until day-7. The advanced-tab cluster stays as Phase 4 ceiling moat — not deleted, just gated.',
  },
];

export const SHARRAN_PRINCIPLES: SharranPrinciple[] = [
  {
    id: 'one_one_one',
    number: 1,
    name: 'The 1-1-1 Rule + The Curse of Capability',
    subhead: 'ONE traffic / ONE conversion / ONE delivery — and hide the rest.',
    sharranFraming:
      "Smart founders build complex webs simply because they have the intellectual capacity to do so. Complexity chokes scale. Focus on EXACTLY one traffic source, one conversion mechanism, one delivery model. Build to $300K baseline. Beyond that, growth by subtraction, not multiplication.",
    appliedToDi:
      'DI today VIOLATES 1-1-1 in three places (see violation table). The locked Phase 1 wedge motion in CLAUDE.md GTM v3.5 IS 1-1-1 on paper, but the shipped platform is N-N-N — Phase 4-architected for a Phase 1 buyer. The discipline isn\'t "build the wedge" — it\'s HIDE THE PLUMBING for Phase 1 users.',
    phaseTag: 'APPLICABLE_NOW',
    phaseRationale:
      'Every Phase 1 paid sign-up that lands on the current dashboard sees the 28-tab founder-hub-class surface area. The Curse of Capability is actively biting today.',
    ninetyDayAction:
      'Build the Discovery-Grade Dashboard surface for new sign-ups — single upload box + DQI verdict + top-3 fixes + DPR export. Every other tab gated behind a day-7 progressive-disclosure toggle. Ship before Strategy World London June 9-10.',
  },
  {
    id: 'tss_diagnostic',
    number: 2,
    name: 'Traffic / Systems / Skills Diagnostic',
    subhead: 'Founder is the Skills bottleneck — systematize and transfer.',
    sharranFraming:
      'Every service business decomposes into Traffic (filling the funnel), Systems (converting leads), and Skills (delivering the service). In early-stage companies the founder is almost always the bottleneck in Skills. Until the founder can systematize their expertise and transfer the skill, the business cannot scale.',
    appliedToDi:
      'Folahan IS the Skills bottleneck today (sole engineer + sole sales + sole support). But DI is structurally protected: the 12-node pipeline + DPR + Outcome Gate Phases 1+2+3 IS the systematized expertise — transferable to every paid customer without founder presence. The unfinished surfaces (Outcome Gate Phase 4 auto-detection, integration-first onboarding per Founder School lesson es_9) are exactly where Skills-bottleneck risk still lives.',
    phaseTag: 'APPLICABLE_NOW',
    phaseRationale:
      'Phase 1 demos still require founder presence to walk a memo through the audit. Until the Discovery-Grade Dashboard ships, the "Skills" pillar can\'t scale beyond Folahan\'s 28hr/week.',
    ninetyDayAction:
      'Ship Discovery-Grade Dashboard so the audit demos itself in-product without founder voiceover. Founder presence becomes a +1 (warm-intro 20-min calls), not a load-bearing dependency.',
  },
  {
    id: 'exit_mindset',
    number: 3,
    name: 'Exit Mindset + The Valuation Hack',
    subhead:
      'Build as if someone is buying tomorrow. Ask advisors what 5 things lift the valuation by 50%.',
    sharranFraming:
      'Build the business as if someone is going to buy it tomorrow. Regularly package it as if for sale and ask potential buyers what THEY would value it at. If they say $50M, ask exactly what 5 things would raise it to $75M. Those 5 things become the team\'s operational business plan for the next 12 months.',
    appliedToDi:
      'CLAUDE.md $30M+ founder cash exit math already targets specific acquirers (LRQA / IBM watsonx.governance arm / Big-4 governance practice / strategic AI-governance). The Valuation Hack is an actionable mechanic Folahan can run TODAY with Mr. Reiner — using the two pre-built prompt templates (Path-to-Benchmark + Zero-Value Subtraction). The catch: advisors default to VC-coded "scale fast / burn money" advice unless filtered for procurement-buyer logic.',
    phaseTag: 'APPLICABLE_NOW',
    phaseRationale:
      'Mr. Reiner conversations are recurring. The Valuation Hack converts a passive-advisor relationship into a structured operating plan in one ask.',
    ninetyDayAction:
      'Run the Valuation Hack tool with Mr. Reiner using both pre-built prompts (Path-to-Benchmark + Zero-Value). Filter the answers via the advisor-rule: only adopt a "5 things" recommendation if the advisor explains exactly WHY a specific enterprise buyer (Audit Committee Chair / Big-4 acquirer) would pay a premium for those things. The 5 surviving items become Q3-Q4 2026 sprint priorities.',
    cta: { label: 'Run the Valuation Hack →', surfaceId: 'valuation_hack' },
  },
  {
    id: 'a_players',
    number: 4,
    name: 'A-Players + Phantom Equity (DEFERRED to Phase 3)',
    subhead: 'AI-written job description · true value prop · phantom equity.',
    sharranFraming:
      "Don't write generic job descriptions. Use AI to outline every specific stress point + operational failure in your current business — A-players read the chaos and feel the job was written for them. Find their TRUE value prop (Sharran's agents wanted time, not money — \"save you one day a week\" became the pitch). Phantom equity = contractual % of the liquidity event without complicating the cap table.",
    appliedToDi:
      'A-Player recruitment is the ONE Sharran principle the KB synthesis explicitly tagged "LATER" for DI specifically — defer to Phase 3 mid-market scaling. Hiring before PMF validation exhausts the $200K pre-seed runway before the first 5 paid customers land. Phantom-equity worksheet locked but DO NOT USE until Phase 3.',
    phaseTag: 'ABOUT_TO_BE_RELEVANT',
    phaseRationale:
      'Phase 1 graduation gate (≥5 paid Individuals + Vohra ≥40% HXC by month 6) precedes hiring. Phase 2 Sankore design partner (months 6-12) is founder-led. Phase 3 (months 12-24) is when A-player engineer + GTM lead become load-bearing.',
    ninetyDayAction: null,
  },
  {
    id: 'lifestyle_freeze',
    number: 5,
    name: 'Freezing Lifestyle',
    subhead: '14 years flat budget · 50× net worth — keep optionality at every tier.',
    sharranFraming:
      "The number one thing an entrepreneur can do to set themselves up for massive scale: freeze your lifestyle. Sharran kept his family's monthly budget flat for 14 years even as his net worth grew 50×. The flat lifestyle preserves financial optionality — you can make aggressive risk-adjusted investments without compromising your standard of living.",
    appliedToDi:
      'Folahan is structurally pre-locked into "frozen lifestyle" — 16-yo, lives with parents, no personal burn. The implication is FORWARD-LOOKING: when the seed round closes ($1.5-2.5M at £8-15M post-money), the lifestyle frozen at age 19-20 should stay frozen through the Series A and the strategic acquisition. This is also an INVESTOR-NARRATIVE WEAPON — pre-seed VCs love founders who have publicly committed to a frozen lifestyle (signals long-term thinking + low-burn-rate risk + aligned incentives).',
    phaseTag: 'APPLICABLE_NOW',
    phaseRationale:
      'Already frozen by life-stage. The discipline is keeping it frozen as personal income grows post-seed → post-Series-A → post-exit.',
    ninetyDayAction:
      'Add the "14 years frozen / 50× net worth" framing to the pre-seed conversation script. The behavioral commitment ("I will keep my monthly burn within 1.2× pre-seed levels through Series A") becomes a paragraph in every pre-seed term-sheet conversation.',
    cta: { label: 'See the Lifestyle Freeze tracker →', href: '/dashboard/founder-hub' },
  },
  {
    id: 'wealth_is_who',
    number: 6,
    name: 'Wealth is a "Who" Strategy + 10-10 Forever',
    subhead: 'Identify the 10 people you would invest in for the next 10 years.',
    sharranFraming:
      'The biggest misconception about building wealth: treating it as a "what" or "how" problem when it\'s actually a "who" problem. Identify the 10 people you would invest in for the next 10 years. Build deep proximity. Long-term leverage compounds with the right people the way capital compounds with time.',
    appliedToDi:
      'CLAUDE.md Connection-leverage motion already names 3 nodes (Mr. Reiner / Mr. Gabe / Sankore). The KB synthesis identified 7 missing slots — Vendor Continuity Engineer, Governance Coalition Insider, Elite Consulting Channel Partner, F500 GC Validator, Agentic-Shift Technologist, Fractional CSO Evangelist, Behavioral Science Academic Anchor. The 10-10 Forever overlay on WarmIntroNetworkMap surfaces who DI should be cultivating in addition to who DI is already cultivating.',
    phaseTag: 'APPLICABLE_NOW',
    phaseRationale:
      'Each missing slot maps to a specific Phase 1-4 risk that the existing 3 named nodes don\'t cover (e.g. Vendor Continuity Engineer offsets the "16-yo solo" key-person risk in F500 procurement that Mr. Reiner alone can\'t address).',
    ninetyDayAction:
      'For each of the 7 missing slots, name ONE channel to find that person via existing 3 nodes (e.g. ask Mr. Reiner for the Vendor Continuity Engineer; ask Mr. Gabe for the Fractional CSO Evangelist via UK-network portfolio CSOs).',
    cta: { label: 'Open 10-10 Forever roster →', surfaceId: 'ten_ten_forever' },
  },
  {
    id: 'bottlenecks_first',
    number: 7,
    name: 'Find Bottlenecks Before They Find You · 2× Tomorrow Stress Test',
    subhead: 'If the business doubled tomorrow, where exactly would it break?',
    sharranFraming:
      'Great founders anticipate second and third-order consequences. Run a mental simulation: "If my business doubled in size tomorrow, where exactly would it break?" The answer dictates what systems to build today, ensuring you aren\'t scrambling when the market actually rewards your efforts.',
    appliedToDi:
      'The KB synthesis flagged the Agentic Shift (Palantir AIP / Snowflake / autonomous agents replacing memos) as the #1 second-order risk DI is under-prepared for. Other 2× bottlenecks: Outcome Gate Phase 4 auto-detection (10+ paid users triggers manual-logging trap = Cloverpop External Attack Vector); founder-hub tab discoverability (50+ tabs = AI chat can\'t route fast enough); seed-fund pipeline activation (5 candidates need explicit-yes from Reiner / Gabe before Q4 2026).',
    phaseTag: 'APPLICABLE_NOW',
    phaseRationale:
      'Agentic-shift investigation deadline is end of June 2026 per CLAUDE.md. Outcome Gate Phase 4 needs to ship before paid customer #10. Both clocks are running.',
    ninetyDayAction:
      'Run the 2× Tomorrow Stress Test tool with current state numbers. For each bottleneck the tool surfaces, file a NinetyDayActionPlan entry with named owner + tripwire. Re-run quarterly.',
    cta: { label: 'Open 2× Tomorrow Stress Test →', surfaceId: 'two_x_tomorrow' },
  },
];

/**
 * Valuation Hack — pre-built prompts with KB-derived guardrails.
 * Q4 KB synthesis: advisors are valuable proxies for procurement /
 * acquisition committees, but only with two specific prompt templates +
 * counter-pattern guardrails.
 */
export interface ValuationHackPrompt {
  id: 'path_to_benchmark' | 'zero_value_subtraction';
  label: string;
  /** One-line description of when to use this prompt. */
  whenToUse: string;
  /** The verbatim prompt text — copy-paste into a conversation with an advisor. */
  promptTemplate: string;
  /** What signal this prompt extracts. */
  expectedSignal: string;
}

export const VALUATION_HACK_PROMPTS: ValuationHackPrompt[] = [
  {
    id: 'path_to_benchmark',
    label: 'Path-to-Benchmark · the Up-Sell',
    whenToUse:
      'When the goal is to identify what specifically lifts DI from current pre-revenue state to a $10M+ seed valuation. Use with Mr. Reiner / Mr. Gabe / a Big-4 governance partner.',
    promptTemplate:
      'Assume we execute our Phase 1 plan and secure 5 paid £249/mo individual pilots and the Sankore design partner. From the perspective of a Big-4 governance acquirer or a top-tier Series A fund, what are the 3 to 5 specific things that MUST be true about the Brier-scored outcome data or the product architecture to turn that initial traction into a $10M+ seed valuation?',
    expectedSignal:
      'The 3-5 named gaps between today\'s state and acquirer-grade. Each becomes a Q3-Q4 2026 sprint priority IF the advisor explains exactly WHY a specific enterprise buyer would pay a premium.',
  },
  {
    id: 'zero_value_subtraction',
    label: 'Zero-Value Subtraction · the Cut-List',
    whenToUse:
      'Run alongside Path-to-Benchmark. Surfaces the features that look like moats internally but read as zero-value to enterprise procurement. Maps directly to the Phase 1 "hide the plumbing" discipline.',
    promptTemplate:
      'Looking at my current 12-node pipeline, 19-framework regulatory map, and 200+ components, what are the three features or capabilities that an enterprise General Counsel or a Big-4 acquirer would assign absolutely zero value to during procurement or acquisition?',
    expectedSignal:
      'The 3 features to demote BEHIND feature flags for Phase 1 buyers (NOT delete — they may still serve Phase 4 ceiling buyers). Each Zero-Value flag = one less Curse-of-Capability surface for the £249/mo wedge.',
  },
];

export interface ValuationHackGuardrail {
  id: string;
  label: string;
  body: string;
}

export const VALUATION_HACK_GUARDRAILS: ValuationHackGuardrail[] = [
  {
    id: 'vc_scale_default',
    label: 'VC-coded "scale fast / burn money" default',
    body: 'Generalist VC advisors default to "hire a sales team and scale really fast" advice, which violates DI\'s capital-efficiency frontier. If the advisor\'s "5 things" recommend hiring before PMF or aggressive paid acquisition, REJECT — that path exhausts the $200K pre-seed runway before the first 5 paid customers land.',
  },
  {
    id: 'consulting_dismissal',
    label: 'The "consulting dismissal" trap',
    body: 'Some advisors will dismiss Sankore-style hands-on pilots as "just consulting" and recommend abandoning them. This is the trap. Per Y Combinator partners, early hands-on engagements are exactly where the moat is built — they produce the closed-outcome data that Cloverpop\'s data advantage attack vector cannot replicate. REJECT any "5 things" that recommends killing bespoke pilots.',
  },
  {
    id: 'enterprise_buyer_filter',
    label: 'The enterprise-buyer filter',
    body: 'Only adopt a "5 things" recommendation if the advisor can explain exactly WHY a specific enterprise buyer (Audit Committee Chair / F500 General Counsel / Big-4 acquirer) would pay a premium for those things. If they quote generic SaaS metrics (logo count / NDR / "land and expand"), disregard.',
  },
];

/**
 * 2× Tomorrow Stress Test — the input shape + the canonical bottleneck
 * library. The tool takes current-state numbers, doubles them, surfaces
 * the bottleneck table.
 */
export interface StressTestInput {
  id: string;
  label: string;
  /** Default value for the input. */
  defaultValue: number;
  /** Unit displayed next to the number. */
  unit: string;
  /** One-line context for the founder. */
  hint: string;
}

export const STRESS_TEST_INPUTS: StressTestInput[] = [
  {
    id: 'daily_audits',
    label: 'Daily audits across all surfaces',
    defaultValue: 5,
    unit: 'audits/day',
    hint: 'Includes /demo runs, paid Individual audits, deal-attached audits.',
  },
  {
    id: 'paid_customers',
    label: 'Paid Individual customers',
    defaultValue: 0,
    unit: 'paid users',
    hint: 'Phase 1 graduation gate is 8-12 paid retained 90+ days by month 6.',
  },
  {
    id: 'warm_intros_per_week',
    label: 'Warm intros per week',
    defaultValue: 2,
    unit: 'intros/week',
    hint: 'From Mr. Reiner + Mr. Gabe network. Sharran 1-1-1 cap is the discipline rule.',
  },
  {
    id: 'london_events_per_month',
    label: 'London events attended per month',
    defaultValue: 1,
    unit: 'events/month',
    hint: 'Sharran 1-1-1 cap = 2/month maximum (CLAUDE.md GTM v3.5).',
  },
  {
    id: 'founder_hub_tabs',
    label: 'Founder Hub tabs',
    defaultValue: 28,
    unit: 'tabs',
    hint: 'Already at the discoverability ceiling per the brainstorm queue.',
  },
];

export interface StressTestBottleneck {
  /** The metric this bottleneck applies to (matches input id). */
  inputId: string;
  /** The 2× state — what the metric would be at doubled volume. */
  doubledState: string;
  /** The named bottleneck. */
  bottleneck: string;
  /** Severity of the breakage at 2× — drives card color. */
  severity: 'critical' | 'high' | 'medium' | 'manageable';
  /** The pre-emptive build needed today to avoid scrambling at 2×. */
  preEmptiveBuild: string;
}

export const STRESS_TEST_BOTTLENECKS: StressTestBottleneck[] = [
  {
    inputId: 'daily_audits',
    doubledState: 'Higher Gemini cost via paid tier 1 (~£0.30-0.50/audit)',
    bottleneck:
      'Per-audit cost compounds. At 50/day = ~£15/day Gemini bill (manageable). At 500/day = ~£150/day, requires AI Gateway prompt-caching maturation + cost-tier routing audit.',
    severity: 'manageable',
    preEmptiveBuild:
      'Cost-tier routing already shipped (gemini-3.1-flash-lite for cheap nodes). AI Gateway Phase 3 (12-node pipeline migration) is the next ratchet — needs founder-explicit-OK per pipeline-change rule.',
  },
  {
    inputId: 'paid_customers',
    doubledState: 'Paid customer #10+ — manual outcome-logging trap fires',
    bottleneck:
      "Outcome Gate Phase 4 auto-detection isn't built. Without it, the manual-logging trap (Cloverpop External Attack Vector #1) compounds: paid users skip outcome reporting → per-org Brier never accumulates → Cloverpop's data advantage holds.",
    severity: 'critical',
    preEmptiveBuild:
      'Outcome Gate Phase 4 (Drive / Slack / email auto-detection auto-on at signup) MUST ship before paid customer #10. Currently DEFERRED in CLAUDE.md brainstorm queue.',
  },
  {
    inputId: 'warm_intros_per_week',
    doubledState: '4+ warm intros/week — follow-up cadence breaks',
    bottleneck:
      "Founder Hub Outreach Hub centralizes pipeline but doesn't enforce follow-up cadence. At 4+/week the \"did I follow up after the audit?\" thread breaks → warm-intro waste.",
    severity: 'high',
    preEmptiveBuild:
      "Add follow-up cadence enforcement to Outreach Hub: T+0 / T+3d / T+7d / T+14d reminders. Each warm intro auto-creates the cadence; missed reminders surface as a red badge on the founder-hub home.",
  },
  {
    inputId: 'london_events_per_month',
    doubledState: '4+ London events/month — Sharran 1-1-1 cap breach',
    bottleneck:
      'CLAUDE.md GTM v3.5 caps events at 2/month maximum to protect the 1-1-1 traffic-source discipline. Above 2, signal-per-conversation collapses + event-fatigue compounds.',
    severity: 'medium',
    preEmptiveBuild:
      'Stay disciplined at the cap. EventPrepCard already enforces the prep arc (T-6w → T-0). Resist the temptation to add a 3rd event unless one of the locked 5 events drops out.',
  },
  {
    inputId: 'founder_hub_tabs',
    doubledState: '50+ Founder Hub tabs — discoverability collapses',
    bottleneck:
      'Already at the ceiling. At 50+, the AI chat can\'t route founder questions fast enough; founder loses context faster than the chat can recover. This is a Phase 4 reality, not Phase 1.',
    severity: 'high',
    preEmptiveBuild:
      'Stop adding tabs. Consolidation candidates: 3-positioning-tab cluster (CompetitivePositioningTab + PositioningCopilotTab + CategoryPositionTab — 65% overlap). Audit before any new tab ships.',
  },
];

/**
 * 10-10 Forever roster — 7 missing relationship slots beyond the existing
 * Mr. Reiner / Mr. Gabe / Sankore (per Q3 KB synthesis). Each slot maps
 * to a specific Phase 1-4 risk the existing 3 nodes don't cover.
 */
export interface TenTenSlot {
  id: string;
  /** Person-type. */
  role: string;
  /** What this person unlocks for DI. */
  whyItMatters: string;
  /** How to find them via existing nodes (Mr. Reiner / Mr. Gabe / etc.). */
  channelToFind: string;
  /** Cadence target once acquired. */
  cadence: 'monthly' | 'quarterly' | 'annual' | 'ad-hoc';
  /** The phase this person is most load-bearing for. */
  phase: 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4' | 'Cross-phase';
}

export const TEN_TEN_FOREVER_SLOTS: TenTenSlot[] = [
  {
    id: 'vendor_continuity_engineer',
    role: 'Vendor Continuity Engineer',
    whyItMatters:
      "Senior full-stack engineer on 30-day standby to eliminate the '16-yo solo founder' key-person risk during F500 procurement. Procurement reviewers ask 'what happens if the founder gets hit by a bus?' — the named engineer is the answer.",
    channelToFind: 'Ask Mr. Reiner for an introduction via the Wiz network. Target someone who has already shipped enterprise-grade SaaS at scale.',
    cadence: 'quarterly',
    phase: 'Phase 4',
  },
  {
    id: 'governance_coalition_insider',
    role: 'Governance Coalition Insider',
    whyItMatters:
      "Strategic alliances lead at an AI-governance platform (Credo AI–class) who can orchestrate joint procurement packages — DI's decision-tier audits paired with their model-tier audits. Closes the IBM watsonx.governance bundling External Attack Vector.",
    channelToFind: 'Ask Mr. Reiner via Wiz governance contacts. AI Verify Foundation and the LRQA / Ian Spaulding warm intro are also natural channels.',
    cadence: 'quarterly',
    phase: 'Phase 3',
  },
  {
    id: 'elite_consulting_channel',
    role: 'Elite Consulting Channel Partner',
    whyItMatters:
      'Senior leader at McKinsey QuantumBlack / BCG X who can embed DI as a scalable line-item inside their $1M+ strategy engagements. This is the highest-leverage non-acquirer revenue path — every consulting engagement that ships with the DPR is a reference case.',
    channelToFind: 'CLAUDE.md already names QuantumBlack as an untapped network node. Mr. Reiner has consulting-firm relationships via Wiz governance work.',
    cadence: 'monthly',
    phase: 'Phase 3',
  },
  {
    id: 'f500_gc_validator',
    role: 'F500 General Counsel Validator',
    whyItMatters:
      'Enterprise legal chief who battle-tests the DPR against real EU AI Act Article 14 + SEC AI Disclosure scrutiny BEFORE Phase 4. Without this, the procurement-grade claims on /security stay hypothetical until the first F500 deal collapses on a real audit-committee question.',
    channelToFind: 'Ask Mr. Gabe via UK-investor-side portfolio GCs. LRQA / Ian Spaulding warm intro for FTSE 250 GCs.',
    cadence: 'quarterly',
    phase: 'Phase 4',
  },
  {
    id: 'agentic_shift_technologist',
    role: 'Agentic-Shift Technologist',
    whyItMatters:
      "Architecture insider at Palantir AIP / Snowflake / Aera who can guide DI's Structurer Node to natively ingest autonomous-agent decision logs. Closes the agentic-shift External Attack Vector — the path-lock decision in June 2026 needs this person's architectural input.",
    channelToFind: 'Mr. Reiner network for Palantir / Snowflake. Cold outreach via Wiz advisor cred. AI Verify Foundation participants.',
    cadence: 'monthly',
    phase: 'Cross-phase',
  },
  {
    id: 'fractional_cso_evangelist',
    role: 'Fractional CSO Evangelist',
    whyItMatters:
      "Independent strategy advisor whose multi-client portfolio acts as a frictionless word-of-mouth acquisition engine for the £249/mo Phase 1 wedge. ONE evangelist with 5 clients = 5 leveraged sign-ups. Direct fit with the GTM v3.5 fractional-CSO HXC persona.",
    channelToFind: 'Mr. Gabe via UK fractional-CSO network. Strategy World London June 9-10 BAFTA event is the highest-signal venue.',
    cadence: 'monthly',
    phase: 'Phase 1',
  },
  {
    id: 'behavioral_science_anchor',
    role: 'Behavioral Science Academic Anchor',
    whyItMatters:
      "Cognitive psychology / neuroeconomics professor (Stanford Symbolic Systems network) to empirically validate R²F and co-author primary research. Closes the academic-credentials moat layer — no competitor (Cloverpop / Aera / IBM) has this. Also: load-bearing for Folahan's Stanford / Berkeley application November 2027.",
    channelToFind: 'Stanford Symbolic Systems faculty (Folahan applies November 2027 — start the relationship now). Klein / Lovallo / Tetlock collaborators.',
    cadence: 'quarterly',
    phase: 'Cross-phase',
  },
];

/**
 * Lifestyle Freeze investor narrative — the framing for pre-seed conversations.
 * Sharran's 14-year-flat-budget / 50× net worth pattern, mapped onto Folahan's
 * structurally-pre-frozen 16-yo state.
 */
export interface LifestyleFreezeBeat {
  id: string;
  label: string;
  body: string;
}

export const LIFESTYLE_FREEZE_BEATS: LifestyleFreezeBeat[] = [
  {
    id: 'current_state',
    label: 'Where Folahan starts',
    body: '16 years old, lives with parents (Lagos home + UK residence). Personal monthly burn: ~£0. Pre-seed runway need: $200K covers ~12 months + the SOC 2 Type I + 5 paid Individual customers + 1 Sankore-class pilot.',
  },
  {
    id: 'commitment',
    label: 'The commitment',
    body: 'Keep monthly personal burn within 1.2× pre-seed levels through Series A. Even when net worth crosses $1M, $5M, $10M post-strategic-acquisition — the family budget stays flat. Sharran kept his at flat for 14 years through 50× net worth growth.',
  },
  {
    id: 'investor_anchor',
    label: 'The investor-narrative weapon',
    body: 'Pre-seed VCs read frozen-lifestyle commitment as: long-term thinking + low burn-rate risk + aligned incentives. Make this a paragraph in every pre-seed term-sheet conversation: "I have committed to a frozen lifestyle through Series A. Burn-rate risk is structurally low because there is no pressure to take a market salary."',
  },
  {
    id: 'optionality',
    label: 'What this preserves',
    body: 'Optionality at every income tier. When the strategic acquisition lands at $30M+ founder cash exit (CLAUDE.md target), the cash stays optionality — not commitments. Aggressive risk-adjusted investments (Series B-stage acquisition target funds, AI infrastructure, Pan-African expansion) become available without compromising standard of living.',
  },
];
