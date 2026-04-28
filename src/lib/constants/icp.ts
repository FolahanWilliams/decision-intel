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
 * downstream surface stay in lockstep automatically. The 2026-04-28 audit
 * caught three founder-context.ts lines (lines 68, 71, 140) that had drifted
 * from the 2026-04-26 ICP re-lock for two days because each surface kept its
 * own copy of the prose. The extraction below is the structural fix for that
 * drift class.
 *
 * Locked: 2026-04-28.
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
  'Corporate strategy + corp dev + funds (PE, EM-focused VC, family offices) + audit committees + GCs. NOT F500-board-narrow.';

/**
 * Wedge — the GTM motion for the next 12 months. Pan-African / EM-focused
 * funds + Pan-African corp dev. The first design partner sits in this subset.
 */
export const ICP_WEDGE = {
  label: 'GTM wedge (current focus)',
  audience:
    'Pan-African / EM-focused funds (PE, EM-focused VC, family offices) and Pan-African corporate development teams.',
  whyItWorks:
    'Funds in this subset buy fast (capital-allocation pressure, IC-cycle calendar), are highly susceptible to artifact-led sales (specimen DPRs do the persuasion), and the dual-specimen library (WeWork + Dangote) + 17-framework regulatory map across G7 / EU / GCC / African markets is uniquely defensible against US-only incumbents.',
  proof:
    '$200M-$2B+ AUM with capital-allocation pressure across volatile FX regimes (NGN / KES / GHS / EGP) plus procurement-grade compliance requirements (NDPR, CBN, WAEMU, PoPIA). Decision Intel was built FOR this subset.',
} as const;

/**
 * Ceiling — the 12-18-month expansion target unlocked by 3+ published wedge
 * reference cases. F500 CSO / audit committee / GC.
 */
export const ICP_CEILING = {
  label: 'Revenue ceiling (12-18 months out)',
  audience: 'Fortune 500 Chief Strategy Officers, audit committees, GCs at regulated entities.',
  whyItUnlocks:
    'The R²F + DPR + 17-framework regulatory map are designed to clear F500 procurement once the wedge has produced 3+ published reference cases.',
} as const;

/**
 * Avoid — generic US/European VC firms with no Africa exposure. The original
 * "PE/VC is NOT a target" warning still applies HERE — small AUM-per-decision,
 * relationship-driven without the capital-allocation pressure that makes the
 * audit valuable, sceptical because they have no procurement need for
 * compliance-grade DPRs.
 */
export const ICP_AVOID = {
  label: 'Avoid',
  audience: 'Generic US/European VC firms with no Africa exposure.',
  why: 'Small AUM-per-decision, relationship-driven without the capital-allocation pressure that makes the audit valuable, sceptical because they have no procurement need for compliance-grade DPRs.',
} as const;

/**
 * Sequencing — the wedge generates the references that unlock the ceiling.
 * Don't conflate the two markets.
 */
export const ICP_SEQUENCING = [
  'Year 1: Pan-African / EM-fund wedge + Pan-African corp-dev (specimen-led artifact sales).',
  'Year 2: F500 CSO + M&A + GC ceiling, once 3+ reference cases publish.',
  'Year 3: BizOps, FP&A, sales forecasting, risk inside F500.',
  'Year 4+: Government, Insurance, Healthcare strategy functions; horizontal platform.',
] as const;

export const ICP_SEQUENCING_RULE =
  'The wedge generates the references that unlock the ceiling — do not conflate the two markets when sequencing.';

/**
 * Banned vocabulary — never use as the headline claim. Each entry carries the
 * reason so future-you can judge edge cases instead of just memorising the list.
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
  const ceiling = `${ICP_CEILING.label}: ${ICP_CEILING.audience} — ${ICP_CEILING.whyItUnlocks}`;
  const avoid = `${ICP_AVOID.label}: ${ICP_AVOID.audience} ${ICP_AVOID.why}`;
  const sequence = ICP_SEQUENCING.join(' ');
  return `${wedge} ${ceiling} ${avoid} Sequencing — ${sequence} ${ICP_SEQUENCING_RULE}`;
}

/**
 * One-line ICP summary for the FOUNDER NOTES section. Derived from the
 * canonical wedge / ceiling / avoid constants so the founder-notes lead
 * cannot drift independently from the MARKET STRATEGY block.
 */
export function buildFounderNotesIcpLine(): string {
  const wedge = `The Pan-African / EM-fund wedge is the canonical Year-1 motion: artifact-led sales (WeWork + Dangote DPR specimens), 17-framework regulatory map (NDPR / CBN / WAEMU / PoPIA + G7/EU/GCC), capital-allocation pressure makes funds buy fast.`;
  const ceiling = `${ICP_CEILING.audience.replace(/\.$/, '')} is the 12-18 month ceiling, unlocked by 3+ published wedge references.`;
  const avoid = `${ICP_AVOID.audience.replace(/\.$/, '')} remains explicitly NOT a target — ${ICP_AVOID.why} Do not pitch generic VC the same way as Pan-African / EM funds; conflating them is the error the 2026-04-26 re-lock corrected.`;
  return `${wedge} ${ceiling} ${avoid}`;
}
