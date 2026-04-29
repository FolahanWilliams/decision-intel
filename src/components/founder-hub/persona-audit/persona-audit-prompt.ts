/**
 * Persona-audit prompt v2 — Founder Hub artifact (locked 2026-04-30).
 *
 * The 2026-04-29 v1 persona audit returned 17 findings; ~3 of them
 * were factually wrong (S5 "no African regulators," S8 "no email
 * digest," S15 "compare route hidden"), and 4 of the 5 personas
 * collapsed to the same Sankore voice — weighting one buyer 3×.
 * Several Tier-1 "blockers" were also team-workflow asks that don't
 * fit the current pre-revenue refinement phase.
 *
 * v2 fixes those failure modes via four mandatory disciplines:
 *
 *   1. GREP-BEFORE-ASSERT — every "X is missing" claim cites the
 *      grep command + result. If the feature exists, the finding
 *      reframes as "exists but undiscoverable" (different severity).
 *   2. PERSONA DIVERSITY CAP — ≤1 persona per buyer org. Sankore
 *      counts as one persona, not three (Titi + Chidi + Emeka in
 *      v1 was a category error).
 *   3. PHASE-FIT TAG on every finding — "current refinement phase,"
 *      "post-PMF team scope," "post-Series-A scale" — so the
 *      founder can triage without reading the full body.
 *   4. EVIDENCE TRACE — every finding lists file path + line range
 *      + a one-line snippet. No claims without receipts.
 *
 * Use this file as the reference when launching the next audit.
 * Copy `PERSONA_AUDIT_PROMPT_V2` into the audit task; the data
 * exports below are the structured shape the auditor must return.
 */

export type PhaseFitTag =
  | 'refinement_phase' // ships this quarter, fits current scope
  | 'post_pmf_team_scope' // needs paying customers + 3+ users to validate
  | 'post_series_a_scale' // needs scale to justify the engineering cost
  | 'never_for_di'; // out of category — wrong product for DI

export type FindingSeverity =
  | 'demo_blocker' // breaks the first 60s of a buyer demo
  | 'procurement_blocker' // would prevent passing F500 vendor risk
  | 'first_paid_blocker' // would prevent the first design-partner contract
  | 'high_friction' // daily workflow pain, won't block adoption
  | 'medium_friction' // friction that limits depth-of-use
  | 'polish'; // chrome / discoverability / accessibility

export interface PersonaAuditFinding {
  /** Stable identifier across audit runs; useful for tracking re-emergence. */
  id: string;
  /** One-line title — what the persona felt. */
  finding: string;
  severity: FindingSeverity;
  /** Mandatory phase-fit tag — informs whether the founder ships now or later. */
  phaseFit: PhaseFitTag;
  /** The persona who surfaced the finding. ≤1 per org per audit. */
  persona: string;
  /**
   * Mandatory verification trace — every finding cites the file the
   * auditor inspected + the line range + the grep command they ran.
   * `verifiedAbsent: true` means the auditor confirmed the feature
   * doesn't exist; `verifiedAbsent: false` means "exists but
   * undiscoverable / hard to use" (different severity calculus).
   */
  evidence: {
    grepCommand?: string;
    grepResult?: 'no_match' | 'matches_found' | string;
    filePath?: string;
    lineRange?: string;
    quotedSnippet?: string;
    verifiedAbsent: boolean;
  };
  /** What the founder would actually have to ship to fix this. */
  whatToShip: string;
  /** Why a sharp engineer should reject this without further triage if any. */
  rejectionRationale?: string;
}

export interface PersonaArchetype {
  /** Buyer-voice short name. */
  name: string;
  /** Universal archetype, NEVER a specific firm name. Per the no-named-prospect
   *  lock, "Pan-African fund partner" is allowed; "Sankore partner" is not. */
  archetype: string;
  /** Anchor verbs the persona uses day-to-day — drives prompt voice. */
  dailyVerbs: string[];
  /** What this persona values that the others don't — keeps the audit diverse. */
  uniqueAngle: string;
}

/**
 * Canonical persona set — five archetypes, MUTUALLY EXCLUSIVE buyer
 * orgs. The 2026-04-29 v1 audit had 3 personas inside the same fund;
 * v2 caps each archetype at one voice. If a finding emerges from
 * multiple personas, the auditor consolidates to the strongest voice
 * and notes "Also surfaced by {other persona name}" in the body.
 */
export const PERSONA_ARCHETYPES: PersonaArchetype[] = [
  {
    name: 'F500 Chief Strategy Officer',
    archetype: 'corp_strategy_lead',
    dailyVerbs: ['frame', 'review', 'present', 'delegate', 'track'],
    uniqueAngle:
      'Reports to a board. Owns 6+ divisions worth of strategic memos. Proxy for the F500 CEILING ICP.',
  },
  {
    name: 'Mid-market PE Head of M&A',
    archetype: 'pe_ma_head',
    dailyVerbs: ['screen', 'diligence', 'memo', 'present_to_ic', 'close'],
    uniqueAngle:
      'Runs 6-8 live deals at any time. IC every Thursday. Speed + structured output matter most.',
  },
  {
    name: 'Pan-African fund partner',
    archetype: 'em_fund_partner',
    dailyVerbs: ['screen', 'structure', 'navigate_regulation', 'present_to_lp'],
    uniqueAngle:
      'Multi-currency exposure. African regulatory complexity (CBN, FCCPC, SARB). Cross-border deal structuring. Proxy for the GTM WEDGE ICP.',
  },
  {
    name: 'Senior corporate-development analyst',
    archetype: 'corp_dev_analyst',
    dailyVerbs: ['research', 'model', 'compare', 'pitch_internally'],
    uniqueAngle:
      'Two-hat role: writes the memo + manages the data room. Tool fatigue is real — must save time, not add another login.',
  },
  {
    name: 'F500 General Counsel / audit-committee chair',
    archetype: 'gc_audit_chair',
    dailyVerbs: ['review', 'sign_off', 'document', 'audit_trail', 'cite_regulator'],
    uniqueAngle:
      'Procurement-grade lens. Cares about DPR shape, regulatory citations, audit log, signed artifacts. The buyer who unlocks the F500 contract.',
  },
];

/**
 * The improved audit prompt — copy-paste into the next audit task. The
 * markdown blocks below mirror the disciplines codified above; the
 * auditor returns findings shaped as PersonaAuditFinding[].
 */
export const PERSONA_AUDIT_PROMPT_V2 = `
You are running a pre-emptive customer-exploration audit on Decision Intel
(decision-intel.com / /Users/folahan/decision-intel — Next.js 16 + Prisma 7
+ Supabase + Vercel). Your job: surface the highest-leverage holes from
the perspective of five mutually-exclusive buyer archetypes, with rigorous
verification discipline so the founder doesn't waste a single hour
chasing false positives.

# THE FIVE ARCHETYPES (one persona per archetype, ZERO buyer-org overlap)

1. F500 Chief Strategy Officer — F500 industrial conglomerate, 6+ divisions
2. Mid-market PE Head of M&A — $1-3B AUM US/UK fund, 6-8 live deals
3. Pan-African fund partner — $200M-2B AUM Africa-focused, multi-currency
4. Senior corp-dev analyst — F500 corp-dev team, day-to-day operator
5. F500 General Counsel / audit-committee chair — procurement-grade lens

DO NOT split a single buyer org into multiple personas (in v1 we put
Sankore's partner + analyst + junior all in the audit; that weighted one
voice 3× and produced redundant findings). If the analyst persona surfaces
the same finding the partner did, consolidate to one entry and note
"Also surfaced by {other persona}" in the body.

# THE FOUR DISCIPLINES (every finding must comply)

## 1. GREP-BEFORE-ASSERT
Before claiming "X is missing," run the grep that would prove X exists.
Capture the exact command + result. If the feature exists but is hidden,
the finding reframes as "exists but undiscoverable" — DIFFERENT severity
calculus from "doesn't exist at all."

The 2026-04-29 v1 audit had three false-negative claims that took 30
minutes each to verify:
  - "No email digest" — \`sendWeeklyDigest()\` shipped 04-23
  - "No African regulators" — 12 African frameworks already in registry
  - "Compare route hidden" — exists, just not surfaced from deal context
You will not repeat any of these.

Required for every "missing feature" claim:
  evidence.grepCommand: "rg -n 'sendWeeklyDigest' src/"
  evidence.grepResult:  "no_match"  // or quoted matches
  evidence.verifiedAbsent: true     // false if matches found

## 2. PHASE-FIT TAG
Every finding carries one of:
  - refinement_phase     — fits the current pre-revenue refinement scope
  - post_pmf_team_scope  — needs paying customers + 3+ users to validate
  - post_series_a_scale  — only justified at scale
  - never_for_di         — out of category, wrong product

The founder is solo + pre-revenue. Findings tagged
post_pmf_team_scope or beyond are SUGGESTIONS for the future, not
recommendations for this quarter. The v1 audit dropped Tier-1 "blockers"
that were team-workflow asks — those go in post_pmf_team_scope, not
demo_blocker.

## 3. EVIDENCE TRACE
Every finding cites:
  - filePath:    'src/app/(platform)/dashboard/page.tsx'
  - lineRange:   '93-101'
  - quotedSnippet: the literal lines you read
The founder will spot-check 3 random findings; if any trace is fabricated,
the entire audit is rejected.

## 4. SEVERITY CALIBRATION
Six tiers, with explicit cuts:
  - demo_blocker        — breaks the first 60s of a buyer demo
  - procurement_blocker — would fail F500 vendor-risk review
  - first_paid_blocker  — would prevent the first design-partner contract
  - high_friction       — daily workflow pain, won't block adoption
  - medium_friction     — limits depth-of-use after adoption
  - polish              — chrome, discoverability, accessibility

Reject findings that are MERELY chrome regressions but disguised as
high-friction. Reject findings that the founder said "no" to in the
last 4 audits (check the founder-context.ts audit log).

# CAP: ≤3 FINDINGS PER PERSONA, 12 TOTAL

If you find more, internally rank them and only surface the top 3 per
persona. Quality over quantity. Every finding the founder reads has a
real cost (context window + decision time).

# RETURN FORMAT

Return findings as a JSON array of PersonaAuditFinding (shape exported
from src/components/founder-hub/persona-audit/persona-audit-prompt.ts).
Plus a synthesis section at the end:
  - "Already shipped — false negatives surfaced + retracted before report"
  - "Phase-fit recommendation — what to ship now vs queue for post-Sankore"
  - "Persona overlap audit — where 2+ personas surfaced the same finding"

# WHAT NOT TO DO

  - Don't propose new categories (delegation, approval, ballot mechanics)
    until you've confirmed the existing schemas can't already model them
    via grep on prisma/schema.prisma.
  - Don't suggest renaming nav items or moving routes — those are
    discoverability fixes, surface them as polish severity.
  - Don't pad the report with "nice-to-have" items that didn't pass the
    severity gate. The founder reads every line; respect that cost.
  - Don't name specific prospects (Sankore, Wiz, etc.) in any output —
    use the universal archetype name only. CLAUDE.md's no-named-prospect
    rule applies to audit findings, not just shipped surfaces.

You are not done until every finding passes the four disciplines.
`.trim();

/**
 * Failure modes from the 2026-04-29 v1 audit. The auditor must read
 * these BEFORE generating findings — every false negative below has
 * already cost a session.
 */
export const V1_AUDIT_FAILURE_MODES = [
  {
    failureMode: 'False-negative on "no email digest"',
    rootCause:
      'Auditor did not grep for `sendWeeklyDigest`. The function exists at src/lib/notifications/email.ts:190 and runs every Monday via /api/cron/dispatch.',
    preventionRule:
      'For any "no X" claim, the grep is mandatory. No grep result, no claim.',
  },
  {
    failureMode: 'False-negative on "no African regulators"',
    rootCause:
      'Auditor checked /lib/compliance/ for "GDPR" and "FCA" but not for "NDPR" or "CBN." The registry exports 12 African frameworks already.',
    preventionRule:
      'When asserting jurisdictional gaps, grep the registry by per-region keyword (NDPR, CBN, WAEMU, PoPIA, SARB, BoG, CMA Kenya).',
  },
  {
    failureMode: 'False-negative on "compare route hidden"',
    rootCause:
      'The route exists at /dashboard/compare and the dashboard documents browse has a working multi-select Compare button. The audit said "no sidebar link, no discoverability" — partially true (it IS hidden from deal context), but the underlying route exists and works.',
    preventionRule:
      'Distinguish "doesn\'t exist" from "exists but undiscoverable." Both are valid findings, but the severities differ (rebuild vs. surface).',
  },
  {
    failureMode: 'Persona overlap (3 of 5 personas were Sankore)',
    rootCause:
      'v1 split Sankore into managing-partner / senior-associate / junior-analyst. This weighted one buyer org\'s pain 3× and produced redundant findings (versioning, copilot context, mentorship — all from the same buyer voice).',
    preventionRule:
      'Each persona MUST come from a distinct buyer org. If two personas surface the same finding, consolidate to the strongest voice.',
  },
  {
    failureMode: 'Phase-fit blindness (Tier-1 blockers were team features)',
    rootCause:
      'S1 (delegation), S2 (approval), S3 (IC ballot mechanics), S6 (dashboard pivot) were all enterprise-team features for a platform with zero teams. Building team workflows before having a team to validate is the canonical pre-revenue trap.',
    preventionRule:
      'Tag every finding with phaseFit. The founder triages on the tag before reading the body.',
  },
];

/**
 * Convenience export — the founder copies this into the audit task
 * along with PERSONA_AUDIT_PROMPT_V2 and the failure-mode block above.
 */
export const PERSONA_AUDIT_INVOCATION = `
Run a Persona Audit v2 on Decision Intel using the four disciplines and
the five archetypes codified in src/components/founder-hub/persona-audit/persona-audit-prompt.ts.
Return findings as PersonaAuditFinding[] (shape from that file). Cap at
12 findings total (≤3 per persona). Cite evidence trace on every claim.

Read V1_AUDIT_FAILURE_MODES first — every false negative below has
already cost a session, and you will not repeat any of them.

Then read CLAUDE.md (the no-named-prospect rule, the refinement-phase
rule, the boil-the-ocean exception). Findings must respect these locks.

Format the report as:
  ## Findings (top 12, ranked)
    [for each finding: title, severity tag, phase-fit tag, evidence
     trace, what to ship, rejection rationale if any]
  ## Synthesis
    - False negatives caught + retracted: [...]
    - Phase-fit recommendation: ship now vs queue
    - Persona-overlap consolidations: [...]
`.trim();
