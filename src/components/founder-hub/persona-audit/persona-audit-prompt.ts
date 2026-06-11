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
 * Canonical persona set — MUTUALLY EXCLUSIVE buyer orgs. The 2026-04-29
 * v1 audit had 3 personas inside the same fund; v2 caps each archetype
 * at one voice. If a finding emerges from multiple personas, the auditor
 * consolidates to the strongest voice and notes "Also surfaced by
 * {other persona name}" in the body.
 *
 * Roster updated 2026-05-10 to align with the GTM v3.5 ratified-2026-05-04
 * Phase 1 HXC wedge lock: junior-analyst tier is auto-redirected by sign-up
 * persona gating, so `corp_dev_analyst` is DEPRECATED (kept here for
 * historical compatibility, NEVER pick for a live audit). The four Phase 1
 * HXC personas (fractional CSO / mid-market corp dev head / smaller-fund GP
 * / PE-backed founder) are the wedge cohort. F500 CSO + GC stay as [CEILING]
 * audit anchors. Pan-African fund partner stays as [INFRA] differentiator
 * (NOT wedge — moat layer per CLAUDE.md v3.2/v3.5 lock).
 *
 * When picking 2-3 personas per audit run, mix Phase 1 HXC + a [CEILING]
 * anchor + the [INFRA] differentiator across runs so coverage spans both
 * wedge and moat motions.
 */
export const PERSONA_ARCHETYPES: PersonaArchetype[] = [
  // ── Phase 1 HXC wedge personas (the four buyer-class-continuous roles) ──
  {
    name: 'Fractional CSO / strategy consultant',
    archetype: 'fractional_cso',
    dailyVerbs: ['draft_memo', 'review_client_strategy', 'present_to_client', 'invoice'],
    uniqueAngle:
      'Solo strategy operator running 3-5 client engagements with regular memo flow. Pays £249/mo personally. Deeply concrete, time-pressured, needs the audit to compress 3hr of memo review into 60 seconds. Phase 1 HXC wedge persona per GTM v3.5.',
  },
  {
    name: 'Mid-market Head of Corp Dev / M&A',
    archetype: 'midmarket_corp_dev',
    dailyVerbs: ['screen', 'diligence', 'synergy_check', 'present_to_board', 'close'],
    uniqueAngle:
      'Runs the deal pipeline at a $50M-$500M revenue scale-up. Pays £249/mo personally pre-team-budget. The most common buyer at the IC-readiness gate. Phase 1 HXC wedge persona per GTM v3.5.',
  },
  {
    name: 'Smaller-fund GP / VC partner',
    archetype: 'smaller_fund_gp',
    dailyVerbs: ['screen_deal', 'read_ic_memo', 'thesis_anchor', 'lp_governance', 'commit'],
    uniqueAngle:
      'GP or principal at a £5M-£100M AUM fund with active deal flow OR LP governance pressure. Reads IC memos in the back of an Uber. The Cornerstone-magnetic persona — cares about thesis-anchor + structural-assumption ripple. Phase 1 HXC wedge per GTM v3.5.',
  },
  {
    name: 'PE-backed founder / CEO',
    archetype: 'pe_backed_founder',
    dailyVerbs: ['prep_board_deck', 'sign_off_strategic_memo', 'brief_sponsor', 'authorise'],
    uniqueAngle:
      '$80M-revenue PE-backed CEO with personal-decisive budget. The synergy-mirage detector is the highest-leverage signal for this persona. Phase 1 HXC wedge per GTM v3.5.',
  },
  // ── [CEILING] expansion personas (revisit at Phase 3+) ─────────────────
  {
    name: 'F500 Chief Strategy Officer',
    archetype: 'corp_strategy_lead',
    dailyVerbs: ['frame', 'review', 'present', 'delegate', 'track'],
    uniqueAngle:
      'Reports to a board. Owns 6+ divisions worth of strategic memos. Proxy for the F500 [CEILING] ICP. Audit now to prevent drift; revisit at months 12-24.',
  },
  {
    name: 'F500 General Counsel / audit-committee chair',
    archetype: 'gc_audit_chair',
    dailyVerbs: ['review', 'sign_off', 'document', 'audit_trail', 'cite_regulator'],
    uniqueAngle:
      'Procurement-grade lens. Cares about DPR shape, regulatory citations, audit log, signed artifacts. The [CEILING] buyer who unlocks the F500 contract.',
  },
  // ── [INFRA] differentiation persona (Phase 4 wedge, [INFRA] moat now) ──
  {
    name: 'Pan-African fund partner',
    archetype: 'em_fund_partner',
    dailyVerbs: ['screen', 'structure', 'navigate_regulation', 'present_to_lp'],
    uniqueAngle:
      'Multi-currency exposure. African regulatory complexity (NDPR, CBN, WAEMU, PoPIA). Cross-border deal structuring. Proxy for the [INFRA] differentiator (NOT the Phase 1 wedge per GTM v3.2/v3.5 — moat layer for cross-border M&A; revisit at Phase 4).',
  },
  // ── DEPRECATED 2026-05-10: junior tier auto-redirected by v3.5 sign-up ─
  {
    name: 'Senior corporate-development analyst',
    archetype: 'corp_dev_analyst',
    dailyVerbs: ['research', 'model', 'compare', 'pitch_internally'],
    uniqueAngle:
      'DEPRECATED per GTM v3.5 sign-up persona gating (2026-05-04): junior-tier corp-dev analysts are outside the marketed wedge + cohort-tagged phase1HxcEligible=false at sign-up (full platform access per the 2026-05-19 access amendment, but excluded from the Vohra HXC cohort) because they have no graduation path to F500 procurement. Do NOT pick this persona for a live audit. Kept for historical comparison only.',
  },
];

/**
 * Build the live persona roster block — derived from PERSONA_ARCHETYPES so
 * the prompt body never drifts from the canonical array. When v3.5 sign-up
 * gating evolved 2026-05-10 the array updated; the prompt body would have
 * stayed stale without this derivation pattern (canonical-derivation
 * discipline per CLAUDE.md count-drift rule, applied to persona names).
 *
 * Active personas only — the deprecated corp_dev_analyst entry is excluded
 * from the prompt body (kept in the array for historical comparison) so a
 * live audit cannot accidentally pick a persona that was retired by v3.5
 * sign-up gating.
 */
const ACTIVE_ARCHETYPES = PERSONA_ARCHETYPES.filter(p => !p.uniqueAngle.startsWith('DEPRECATED'));

const PERSONA_ROSTER_BLOCK = ACTIVE_ARCHETYPES.map(
  (p, i) => `${i + 1}. ${p.name} — ${p.uniqueAngle}`
).join('\n');

/**
 * The improved audit prompt — copy-paste into the next audit task. The
 * markdown blocks below mirror the disciplines codified above; the
 * auditor returns findings shaped as PersonaAuditFinding[].
 *
 * Persona roster is interpolated from PERSONA_ARCHETYPES (active subset)
 * so the prompt body cannot drift from the canonical array — same
 * canonical-derivation discipline as the count-drift / framework-count /
 * bias-count rules per CLAUDE.md.
 */
export const PERSONA_AUDIT_PROMPT_V2 = `
You are running a pre-emptive customer-exploration audit on Decision Intel
(decision-intel.com / /Users/folahan/decision-intel — Next.js 16 + Prisma 7
+ Supabase + Vercel). Your job: surface the highest-leverage holes from
the perspective of mutually-exclusive buyer archetypes (Phase 1 HXC wedge +
[CEILING] anchor + [INFRA] differentiator), with rigorous verification
discipline so the founder doesn't waste a single hour chasing false
positives.

# THE ARCHETYPES (one persona per archetype, ZERO buyer-org overlap; pick 2-3 per audit run)

${PERSONA_ROSTER_BLOCK}

Mix Phase 1 HXC + a [CEILING] anchor + the [INFRA] differentiator across
runs so the audit covers both wedge and moat motions. Rotate which subset
you pick across audit runs — don't run the same triple twice in a row.

DO NOT split a single buyer org into multiple personas (in v1 we put
Sankore's partner + analyst + junior all in the audit; that weighted one
voice 3× and produced redundant findings). If two personas surface the
same finding, consolidate to one entry and note "Also surfaced by
{other persona}" in the body.

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
  - Named prospects (Sankore, LRQA, Mr. Reiner, Mr. Gabe, Wiz, etc.)
    ARE fine in audit output — this report is private (founder-eyes-only)
    and specific names sharpen findings ("LRQA's EiQ overlaps integration
    path #3" beats "an assurance firm's product overlaps…"). What the
    no-named-prospect rule actually forbids is recommending those names
    SHIP into public surfaces (marketing pages, /security copy, JSON-LD,
    code comments that survive into production bundles, commit messages).
    Reject any finding that proposes "build a /sankore page" or "add an
    LRQA testimonial to the pricing page" — that violates the CLAUDE.md
    public-surface lock.

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
    preventionRule: 'For any "no X" claim, the grep is mandatory. No grep result, no claim.',
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
      "v1 split Sankore into managing-partner / senior-associate / junior-analyst. This weighted one buyer org's pain 3× and produced redundant findings (versioning, copilot context, mentorship — all from the same buyer voice).",
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
