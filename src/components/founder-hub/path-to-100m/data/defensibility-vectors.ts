// Defensibility Vectors — the SSOT for "is it just a wrapper?" + the
// 7 non-wrapper vectors + the acqui-hire-vs-scale-binary-is-false
// reframe + the do-not-quote guardrail.
//
// Canonical source: CLAUDE.md "Defensibility — the 'is it just a
// wrapper?' answer" lock (2026-05-16) + memory
// project-defensibility-research-2026-05 + master-KB sources
// `bf1b7a7d` (V1) + `1f0b676f` (curated synthesis). When the lock's
// vector status changes, edit HERE — the DefensibilityVectorsCard +
// the chat-routing (founder-context.ts) both resolve from this frame.
//
// The honest frame (never flatter a non-moat — the founder catches
// flattery): the audit engine IS a replicable prompt-wrapper. The
// company is what accumulates AROUND it that a fast-follower /
// incumbent / model provider cannot trivially reconstruct: the
// enforced decision process, the tamper-evident institutional record,
// and the per-organisation calibration data. The wrapper is the wedge;
// the accumulating decision→outcome graph + the standard the audit
// committee runs on is the company.

export type Buildability = 'immediately_buildable' | 'requires_scale' | 'hybrid';
export type VectorStatus = 'shipped' | 'partial' | 'next' | 'queued';

export interface DefensibilityVector {
  n: number;
  name: string;
  /** The moat class this vector builds (Hamilton Helmer 7 Powers vocabulary where it maps). */
  moatClass: string;
  buildability: Buildability;
  status: VectorStatus;
  /** Commit / lock reference when shipped or partial. */
  ref?: string;
  /** One-line what-it-is. */
  claim: string;
  /** The master-KB sharpening — the specific form that compounds with embeddedness. */
  sharpening: string;
}

export const DEFENSIBILITY_VECTORS: ReadonlyArray<DefensibilityVector> = [
  {
    n: 1,
    name: 'Collapse the calibration loop',
    moatClass: 'Cornered resource (per-org calibration data)',
    buildability: 'immediately_buildable',
    status: 'shipped',
    ref: 'Vector 1 — forced-at-vote 90-day proxy loop (2026-05-17, commit 92d677e3)',
    claim:
      'Force the IC/sponsor to log falsifiable 90-day operational proxies at the vote moment; the Outcome Gate autonomously fires at horizon to score them.',
    sharpening:
      'A wrapper cannot make an executive return at day-90 to admit the synergy timeline was a delusion — that requires persistent embedded antagonism. Collapses the calibration loop from terminal-IRR (5-10yr) to per-proxy 30-90d, which is what makes the Vohra HXC PMF signal testable inside Phase 1.',
  },
  {
    n: 2,
    name: 'Embed into the governance ritual',
    moatClass: 'Process power (the meeting is run FROM the record)',
    buildability: 'immediately_buildable',
    status: 'shipped',
    ref: 'V2 — mandatory pre-mortem dissent gate (2026-05-16, commit 3392eb58)',
    claim:
      'Before a "Go" vote can be logged, the antagonist\'s brutal questions are surfaced and the sponsor must type a written defence into the platform.',
    sharpening:
      "Converts a read-only dashboard into a mandatory write-action capital-deployment gateway. The rigor goes ON the tamper-evident record, not in the sponsor's head — a wrapper produces an opinion you can ignore.",
  },
  {
    n: 3,
    name: 'Cross-org Bias Genome benchmark',
    moatClass: 'Network effect (the real scale-company thesis)',
    buildability: 'requires_scale',
    status: 'queued',
    claim:
      'Federated toxic-combination peer-delta — not "you have optimism bias" but "your deal teams exhibit the Sunk-Ship pattern materially more than the top quartile of peer mid-market funds"; DQI penalises against the peer baseline.',
    sharpening:
      'Requires consenting competitors processing confidential deal flow. The genuine network effect — gated behind the embeddedness the wedge is buying, never on self-serve volume.',
  },
  {
    n: 4,
    name: 'Methodology-as-standard',
    moatClass: 'Switching cost (the FICO/GAAP of decision quality)',
    buildability: 'hybrid',
    status: 'partial',
    ref: 'Vector 4 — evidentiary-standard fingerprint bound into the legal trail (2026-05-18). The scattered hashes are now composed into ONE citable token (composeEvidentiaryStandardFingerprint) on the DPR cover + bound contractually as Terms §10I + DPA §11 + surfaced on /trust + /security, all from the trust-copy SSOT. Status stays `partial`: the switching cost itself is requires-scale — it only materialises once a GC has a multi-year trail.',
    claim:
      'Methodology version + SHA-256 input hashes hardcoded into the DPR. Once a GC builds a 3-year EU AI Act Art 14 / Basel III ICAAP audit trail on those hashes, switching to a cheaper wrapper means explaining to a regulator why they downgraded their evidentiary standard.',
    sharpening:
      'SHIPPED the immediately-buildable half: the scattered cryptographic pieces are composed into ONE deterministic citable evidentiary-standard fingerprint, bound into the legal-evidence framing (Terms §10I + DPA §11), not just a PDF footer — exactly the "bind, not footer" instruction. The switching cost is requires-scale: it materialises once a GC has years of trail, so the vector stays `partial`, not `shipped`.',
  },
  {
    n: 5,
    name: 'Rigid schema enforcement',
    moatClass: 'Process power (the longer they work in it, the more their culture conforms)',
    buildability: 'immediately_buildable',
    status: 'shipped',
    ref: 'V5 — server-side stage-gate (2026-05-16, commit 52d3c33c). Visible guided-workflow UI is a recorded deferred boundary, not an omission.',
    claim:
      'Restrict the workflow from an open text-box to a strict stage-gated schema (Screening → Diligence → IC Review → PMI); ripping it out breaks operational alignment.',
    sharpening:
      'Aligns with the Linear-style-rigid-schema lock + the conversion-mechanism directive. The server gate is the integrity SSOT (validateStageTransition); the visible drag-board is a conscious future "expand" decision, deliberately not built yet.',
  },
  {
    n: 6,
    name: 'Cross-decision dependency graph',
    moatClass: 'Strategy Stack (the relationship layer no competitor surfaces)',
    buildability: 'hybrid',
    status: 'partial',
    ref: 'M-7 per-pair depends_on ripple alert shipped (2026-05-13, commit c93d051a). Portfolio-wide macro-assumption fan-out queued.',
    claim:
      'When a macro assumption flips ("WAEMU cycle stable through 2027"), flag every dependent deal/portfolio company simultaneously — not just per-anchor pairs.',
    sharpening:
      'Builds on DecisionContainerLink (architecture immediately-buildable); impenetrability is requires-scale. The Cornerstone-magnetic moment the smaller-fund-GP HXC persona pulls toward: the morning the assumption flips, see every dependent commit as a red banner.',
  },
  {
    n: 7,
    name: 'Regulatory coalition lock-in',
    moatClass: 'Procurement / counter-positioning (the fiduciary pincer)',
    buildability: 'immediately_buildable',
    status: 'next',
    claim:
      "Embed into a model-governance incumbent's compliance wake (a Credo-AI-class partner program) as the strategic-decision tier to their model tier; the DPR maps into their Art 14 packages.",
    sharpening:
      'CAVEAT: the named partner program + any peer-delta percentages are NotebookLM-surfaced HYPOTHESES — VERIFY the partner program exists before acting; treat illustrative numbers like "42%" as do-not-quote (same discipline as Brier 0.258).',
  },
];

/**
 * The single highest-leverage reframe from the 2026-05-16 lock — the
 * advisor's acqui-hire-vs-scale framing is a false binary at this
 * stage. "Don't let anyone box you in" applies to the advisor's
 * framing too.
 */
export const ACQUIHIRE_BINARY_REFRAME = {
  headline: 'The acqui-hire-vs-scale binary is FALSE at this stage',
  body: 'The same 12-month motion — get deeply embedded in 1-2 orgs, prove measurable ROI, accumulate calibration data — is the dominant strategy under uncertainty: it maximises the acqui-hire valuation AND is the only way to discover whether the scale-company asset is real. The fork is premature optimisation; it only becomes a real decision once embeddedness is proven or not. The differentiator is CONSTRUCTED BY the embeddedness, not invented in the abstract before the wedge.',
  experiment:
    'Run it with explicit tripwires (cannibalisation delta · calibration-latency proof · the embeddedness test). The summer SMART goal — ≥5 users + measurable ROI + a case study by ~July — IS that experiment.',
};

/**
 * Numbers that destroy investor/advisor trust if leaked. The first
 * three are the canonical do-not-quote set; the 4th is the newest
 * (2026-05-16) and not yet muscle-memory. Full list + reasoning lives
 * in memory project-defensibility-research-2026-05.
 */
export const DO_NOT_QUOTE = [
  {
    value: 'Brier 0.258',
    rule: 'Cold-context only banned — stays in the technical README + /bias-genome + DPR cover with the full 2.0.0-seed version-tag honesty; NEVER in a cold moat sentence.',
  },
  {
    value: '~97% margin',
    rule: 'Ghost-user math — won\'t survive due diligence. Use "~90% blended" in every outward-facing material.',
  },
  {
    value: 'The illustrative ~42% peer-delta',
    rule: 'NotebookLM-surfaced hypothesis, NOT a measured number. Do-not-quote until a real federated peer baseline exists. Newest (2026-05-16) — not yet muscle-memory.',
  },
];

/** The rehearsable verbatim answer lives as `different_prompt_wrapper`
 *  in killer-responses.ts (KillerResponsesPlaybook, scenario
 *  how_are_you_different). This card is the visual reference; that is
 *  the spoken script. */
export const WRAPPER_ANSWER_POINTER =
  'Rehearse the verbatim answer: KillerResponsesPlaybook → "How are you different?" → different_prompt_wrapper.';

// =========================================================================
// COMBINATION INGREDIENTS — locked 2026-05-21 after the TT-meeting reframe.
//
// The honest sharpening to the wrapper question: software alone is never
// the moat at solo-founder scale. The moat is the BUNDLE of 5 ingredients,
// only one of which is replicable in time. The wrapper rebuttal in
// killer-responses leads with this table.
// =========================================================================

export interface CombinationIngredient {
  n: number;
  ingredient: string;
  replicable: boolean;
  replicableNote: string;
  whyUnrepeatable: string;
}

export const COMBINATION_INGREDIENTS: ReadonlyArray<CombinationIngredient> = [
  {
    n: 1,
    ingredient: 'Pipeline + UI + ontology + DPR',
    replicable: true,
    replicableNote: 'Yes, in 6-12 months. Code is code.',
    whyUnrepeatable:
      'This is the wrapper. Concede it; do not defend it. The category-grade enterprise version of every system layer is rebuildable by any competent team — including the 22-bias taxonomy, the 19-framework registry, the 12-node pipeline.',
  },
  {
    n: 2,
    ingredient: 'Founder narrative (16 + Lagos + Kahneman research + financial-literacy program)',
    replicable: false,
    replicableNote: 'Identity. Cannot be copied.',
    whyUnrepeatable:
      'The 16-year-old solo founder + Lagos-rooted + published research at 16 on behavioral finance + active middle-school financial-literacy program is structurally unique. A 35-year-old McKinsey alum cannot rebuild this story. Generational change asset.',
  },
  {
    n: 3,
    ingredient: 'Time embedded at a specific firm',
    replicable: false,
    replicableNote: 'Linear time. The competitor cannot compress it.',
    whyUnrepeatable:
      'A 12-week in-person embed at one firm in summer 2026 cannot be replayed by a competitor starting in summer 2027. The relationship, the workflow context, the calibration data — all linear-time accumulating. Sankore (or whoever lands first) is the linchpin.',
  },
  {
    n: 4,
    ingredient: 'Embedded use-cases producing real calibrated data',
    replicable: false,
    replicableNote: 'Requires that specific firm + that specific time. Compounds with #3.',
    whyUnrepeatable:
      "Brier-against-real-firm-outcomes is a procurement claim that requires the firm to have used DI for 6+ months with closed proxies. No amount of synthetic data or scraped published cases substitutes. The platform's value flips from 'theoretical engine' to 'calibrated against a regulated entity' only here.",
  },
  {
    n: 5,
    ingredient: 'Network access via the firm leadership',
    replicable: false,
    replicableNote: 'Relationship capital. Compounds with #3.',
    whyUnrepeatable:
      'Founder-level relationship with a Harvard MBA / ex-Goldman / Pan-African finance leader + her board members (Alithia, Mines, Carbon, Cardinal Stone, Standard Chartered) is the wedge-motion accelerator. Cold outreach to any one would take months; warm-via-anchor-partner is structurally unrepeatable.',
  },
];

/** The single load-bearing claim the COMBINATION_INGREDIENTS table makes:
 *  4 of 5 ingredients are unrepeatable. A competitor with $20M can build
 *  the 1 replicable layer. They cannot build the bundle.
 *
 *  This sharpens the prior "engine vs accumulating asset" framing —
 *  conceding the engine was correct; what we missed was naming exactly
 *  HOW MANY layers below the engine are also outside competitor reach. */
export const COMBINATION_HEADLINE =
  'The moat is the COMBINATION. Software alone is never the moat at solo-founder scale. 4 of 5 ingredients are unrepeatable — the bundle is what compounds.';

/** The Sankore engagement specifically — why it is the single highest-
 *  leverage move toward locking in ingredients #3, #4, and #5
 *  simultaneously. The London-office in-person embed is the linchpin. */
export const SANKORE_AS_LINCHPIN = {
  headline:
    'Sankore is the single highest-leverage move toward locking 3 of 5 unrepeatable ingredients simultaneously',
  body: 'A 12-week in-person embed at Sankore activates ingredient #3 (time embedded), #4 (real calibrated data from the retroactive Bias Genome seed against 30-50 closed Sankore decisions), and #5 (network access to TT + her board). Combined with the existing ingredient #2 (founder narrative), four of five bundle pieces lock in by month 12. Ingredient #1 (the wrapper) was already shipped. The bundle becomes hard to replicate the moment Sankore lands.',
  forwardRule:
    "When a future advisor / VC / corp-dev counter argues 'the engine is a wrapper, that's not a moat' — lead with the COMBINATION_INGREDIENTS table, not with engine defence. The wrapper is ingredient #1; the moat is the bundle.",
};
