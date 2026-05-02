/**
 * MarketRealityCheck consumer data — 5 silent objections with current
 * ship status (shipped / in-progress / todo) so the founder always
 * sees the gap. Split out from monolithic data.ts at F2 lock 2026-04-29.
 */

export type SilentObjection = {
  id: string;
  rank: number;
  buyerThinks: string;
  whyItKills: string;
  fixThisWeek: string;
  status: 'shipped' | 'in_progress' | 'planned' | 'deferred';
  shipBy: string;
};

export const SILENT_OBJECTIONS: SilentObjection[] = [
  {
    id: 'dqi_trust_me_math',
    rank: 1,
    buyerThinks:
      "\"You're charging £2,499/mo to tell me my memo is a 'D' based on a weighting formula you invented. Where are the confidence intervals? My CFO will laugh me out of the room if I take heuristic dollar estimates to procurement.\"",
    whyItKills:
      'Audit committees and CFOs reject black-box financial estimates by definition. Heuristic-based USD numbers fail procurement on first pass.',
    fixThisWeek:
      'REMOVE hard counterfactual dollar amounts ("$2.3M in avoided losses", "£187k cost") from every user-facing surface. Replace with directional language: "Estimated DQI improvement · pre-validation phase · confidence intervals shipping when outcome-data validates." Add v0.x label to DQI methodology sections. Keep DQI score itself (academically grounded) — only the dollar counterfactuals come off.',
    status: 'in_progress',
    shipBy: 'This week — code change',
  },
  {
    id: 'cathedral_no_nda_purge',
    rank: 2,
    buyerThinks:
      '"You have an AI boardroom simulator and 14 RSS feeds, but I can\'t bulk-delete confidential target data when a deal dies or an NDA expires. This kid built 40 cool features but doesn\'t understand that data lifecycle governance is my actual job."',
    whyItKills:
      'M&A partners and GCs care more about NDA-expiry hard-purge than the 12-node pipeline. A 30-day soft-delete is catastrophic exposure. Without it they will not upload pipeline data.',
    fixThisWeek:
      'Build POST /api/deals/:id/archive endpoint for 7-day NDA-expiry hard purges. Add bulk-delete CSV upload (NDA expiry dates → automated purge schedule). Stop building new AI nodes; hide vanity surfaces (RSS feeds, extra dashboards) from procurement-stage demo views.',
    status: 'planned',
    shipBy: 'Next week — real infra change',
  },
  {
    id: 'continuity_solo_founder',
    rank: 3,
    buyerThinks:
      '"He\'s a genius but he\'s 16 and operating solo. What happens to my SLA when he has AP exams next May or leaves for Stanford? Zero technical continuity if he gets busy."',
    whyItKills:
      'Cannot sell "system of record for strategic reasoning" if the system itself is viewed as a fragile single-point-of-failure startup.',
    fixThisWeek:
      "DEFERRED until first design-partner sign per founder direction 2026-04-28. Solo / individual / fractional CSO targets in the 30-day window do NOT raise this objection — they're buying a personal tool, not enterprise SLA. Re-activate when Sankore / first F500 conversation enters procurement stage.",
    status: 'deferred',
    shipBy: 'When first design-partner conversation enters procurement stage',
  },
  {
    id: 'chatgpt_wrapper_suspicion',
    rank: 4,
    buyerThinks:
      '"This 3-judge statistical jury is just three Gemini API calls with different temperatures. My internal dev team could build this in a weekend with LangChain. I\'m not paying a premium for a UI wrapped around a foundation model."',
    whyItKills:
      "If they suspect we're a wrapper, they defer to existing Microsoft Copilot or Palantir AIP rollout instead of onboarding a new vendor.",
    fixThisWeek:
      'Rename "3-judge statistical jury" → "ensemble sampling" across all user-facing surfaces (lib/agents prompts, UI copy, /how-it-works, DPR sections, marketing pages). Move 100% of defensive messaging away from the LLM pipeline. Anchor exclusively on (a) the 143-case reference library and (b) the R²F Kahneman × Klein academic synthesis. The moat is historical pattern-matching + future outcome data, NOT the prompts.',
    status: 'in_progress',
    shipBy: 'This week — codebase rename',
  },
  {
    id: 'pan_african_regulatory_illusion',
    rank: 5,
    buyerThinks:
      "\"You pitched a 17-framework compliance map for African funds, but you completely missed Nigerian SEC's Investment & Securities Act 2007, and you're referencing the outdated 2018 FRC Nigeria code. You claim you understand my market — you don't actually know my regulators.\"",
    whyItKills:
      "For a licensed firm like Sankore, regulatory mapping isn't marketing — it's a legal requirement. Incomplete coverage breaks trust permanently. One missing primary regulator turns the wedge into an outsider misstep.",
    fixThisWeek:
      'ISA 2007 (Nigerian Investment & Securities Act) framework module SHIPPED 2026-04-29 in africa-frameworks.ts; lifted the count to 19. Remaining work: confirm FRC Nigeria code reflects post-2018 revisions, and audit each African framework citation in DPR generator against current statute text. Less critical for the immediate UK-focused 30-day pivot, but already-procurement-ready for the Sankore summer design-partner conversation.',
    status: 'shipped',
    shipBy: 'Shipped 2026-04-29',
  },
];

// =========================================================================
// SECTION 15 · SIMPLIFIED 30-DAY CONVERSION FUNNEL
// =========================================================================

