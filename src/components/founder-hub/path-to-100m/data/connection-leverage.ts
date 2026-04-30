/**
 * Connection-leverage referral scripts — Mr. Reiner + Mr. Gabe.
 *
 * Locked 2026-04-30 in GTM Plan v3.2 Round 3. The honest reality at v3.2:
 * zero warm intros to F500 corp dev today, but two connections bracket the
 * world we need — Mr. Reiner (Wiz advisor → US enterprise SaaS / cybersecurity
 * / governance acquirers) and Mr. Gabe / Gabriel Osamor (CEO of Megasuto →
 * UK investor-side network, met Apr 23 2026).
 *
 * Discipline: every warm intro = 20-min audit on a real memo, NOT a sales
 * pitch (the artefact does the persuasion). 4-line follow-up to introducer
 * after every intro. Track in Founder Hub Outreach Hub. Pattern-match across
 * 10+ before declaring the motion working.
 *
 * Source of truth: src/lib/constants/icp.ts CONNECTION_LEVERAGE_ASKS exports
 * the prose summary; this module breaks the asks into actionable scripts +
 * follow-up cadences for the Founder Hub Path-to-£100M-Exits surface.
 */

export interface ReferralAsk {
  /** Stable id used for state persistence + analytics tags. */
  id: string;
  /** The advisor / introducer the founder is approaching. */
  advisor: string;
  /** One-line context on the advisor's network and what they're best for. */
  networkContext: string;
  /** The literal cold-context ask — paste-ready into a LinkedIn DM, email, or
   *  in-person conversation. ≤120 words; ends with a 20-min audit-on-real-memo
   *  CTA, never an open-ended "advice / feedback" lead (low conversion). */
  primaryAsk: string;
  /** 8-week target output for this ask. */
  outputTarget: string;
  /** A secondary follow-up ask, surfaced ONLY after the primary lands. */
  secondaryAsk: string;
  /** What "good" looks like in the next-step conversation when the intro happens. */
  followUpDiscipline: string;
}

export const CONNECTION_LEVERAGE_REFERRALS: ReferralAsk[] = [
  {
    id: 'reiner_us_corp_dev',
    advisor: 'Mr. Reiner (senior Wiz advisor)',
    networkContext:
      'US enterprise SaaS, cybersecurity, governance + compliance practitioners. Best for warm intros to S&P 500 / Fortune 500 strategy / M&A / corp dev directors who would benefit from a 20-min discovery audit. Wiz-network-adjacent acquirers (LRQA, IBM watsonx.governance arm, Big-4 governance practices) are also reachable through this graph.',
    primaryAsk:
      'Mr. Reiner — I\'m running 20-minute audits on real strategic memos with corporate strategy and corp dev leaders to sharpen the platform before opening Design Foundation pilots. Who in your network runs strategy, M&A, or corp dev at a US F500 / S&P 500 — and would benefit from a 60-second audit on a real memo? I\'m looking for 3-5 warm intros to people who\'d give me honest 20-minute feedback even if they\'re not buying. Anonymized WeWork S-1 specimen DPR attached for context — that\'s what they\'d see in the call.',
    outputTarget: '3-5 US-side warm intros within 8 weeks; convert ≥1 to design-partner / paid Individual subscriber.',
    secondaryAsk:
      'After the primary lands: "Any US-based seed funds you\'d suggest given my profile + traction? I\'m targeting Conviction (Sarah Guo), Cyberstarts (Gili Raanan), Elad Gil, Index Ventures (UK), Neo (Ali Partovi) — would value your read on which would be the best first conversation given Wiz\'s GTM trajectory."',
    followUpDiscipline:
      'After every intro Mr. Reiner makes: send him a 4-line follow-up within 48 hours — who you met, what you learned, what\'s next. Builds his referral muscle; introducers who hear back ship more intros.',
  },
  {
    id: 'gabe_uk_csos',
    advisor: 'Mr. Gabe (Gabriel Osamor, CEO of Megasuto)',
    networkContext:
      'UK investor-side network — Megasuto helps investors receive capital. Best for warm intros to UK FTSE / mid-market CSOs, heads of strategic planning, heads of corporate development at companies his investor clients have invested in or sit on the board of. Apr 23 2026 meeting: greenlit DI to focus on first 5 paid customers + waitlist before pursuing investors; affirmed customers-before-investors discipline.',
    primaryAsk:
      'Mr. Gabe — building on our Apr 23 conversation, I\'m focused on the first 5 paid Individual customers as you suggested. The UK companies your investor clients have invested in — do any of them have a CSO, head of strategic planning, or head of corporate development who\'d be the right person to give me 20 minutes of feedback on a 60-second audit? I\'m not pitching them to buy — I\'m collecting honest feedback on the audit to sharpen the product before I open Design Foundation pilots in the summer. Anonymized WeWork DPR attached for context.',
    outputTarget: '3-5 UK-side warm intros within 8 weeks; pattern-match the discovery responses against the wedge-buyer Goldner script.',
    secondaryAsk:
      'Post-graduation (after 5 paid Individual customers fire): "Mr. Gabe, as the Design Foundation cohort opens (5 founding pilots at £1,999/mo, 12-month commitment), would you be open to making 1-2 introductions to the right UK corporate strategy team — someone where you\'d pre-vet the fit?"',
    followUpDiscipline:
      'Same 4-line follow-up cadence as Mr. Reiner. Include in the follow-up: which Goldner question pattern surfaced (e.g. "the four-tool graveyard came up unprompted in 2 of 3 conversations — confirms Pattern B"). The pattern-match feedback gives Mr. Gabe useful data to pass back to his investor clients.',
  },
];

/** Per-week cadence for executing the referral motion alongside the 1-1-1
 *  LinkedIn primary traffic source. Capped at 2 intros/week to protect bandwidth
 *  for the actual 20-min audit conversations. */
export const REFERRAL_CADENCE = {
  weeklyOutreach:
    '1× LinkedIn DM-loop post anchored to a famous bias case-study (Kodak / Blockbuster / Nokia / WeWork / Theranos / Wirecard). 2× warm-intro asks per week from Reiner + Gabe queue. 5× follow-up audit conversations per week (whichever land from the previous weeks).',
  patternMatchThreshold:
    'After 10+ intro conversations, sit down with the saved Goldner discovery notes and look for the pattern. If 5+ conversations describe the same pain unprompted (e.g. "the four-tool graveyard," "the question my CEO asked I didn\'t see coming"), that\'s the pattern to sell to per Goldner Rule 3. If no pattern emerges by intro #15, pause and re-question whether the wedge segmentation is right.',
  killCriterionAlignment:
    'Tied to the kill criterion in icp.ts KILL_CRITERION_DORMANT_FLYWHEEL: if 6 months of warm-intro outreach produces fewer than 5 paid Individual subscribers OR no consistent pain pattern emerges, pause the GTM motion rather than scale a broken motion.',
} as const;
