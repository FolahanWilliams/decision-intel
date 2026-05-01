/**
 * Trust-vocabulary constants — single source of truth for procurement-stage
 * security claims that appear on multiple marketing surfaces.
 *
 * The 2026-04-26 persona audit (4-of-6 personas — Elena, Marcus, Adaeze,
 * James) caught the pricing FAQ + JSON-LD claiming "SOC 2 certified
 * infrastructure" without distinguishing Decision Intel from Vercel +
 * Supabase. The /security page already had the accurate framing; the
 * other two surfaces had drifted. To make divergence structurally
 * impossible, every surface that references SOC 2, DPR provenance, or
 * encryption/transit posture imports from this file.
 *
 * Rule: when posture changes (e.g. SOC 2 Type I completes, KMS migration
 * lands, transit ciphers tighten), update HERE only — every consumer
 * picks it up.
 *
 * Consumers as of 2026-04-26:
 *   - src/app/(marketing)/layout.tsx (FAQ JSON-LD, application metadata)
 *   - src/app/(marketing)/pricing/PricingPageClient.tsx (FAQ + trust band)
 *   - src/app/(marketing)/security/page.tsx (TRUST_STACK + DPR card)
 *   - src/app/(marketing)/privacy/page.tsx (TRUST_STACK)
 *
 * Voice: enterprise discipline (CLAUDE.md "Marketing Voice" rule). Each
 * string must survive a Fortune 500 GC + audit committee read.
 */

/**
 * SOC 2 posture for FAQ-style answers (pricing FAQ, layout JSON-LD FAQ).
 * Distinguishes Decision Intel's own product audit (in progress) from
 * the underlying infrastructure (Vercel + Supabase, both already SOC 2
 * Type II). Never claim Decision Intel itself holds a SOC 2 cert until
 * the Type I report is issued.
 */
export const SOC2_FAQ_ANSWER =
  'Decision Intel runs on SOC 2 Type II infrastructure (Vercel + Supabase). Our own product-level SOC 2 Type I audit is targeted for Q4 2026, with the Type II observation window opening immediately after. Documents are encrypted with AES-256-GCM at rest and TLS 1.2+ in transit. A GDPR + NDPR anonymization layer strips PII before any AI processing. Pan-African customers: NDPR Art. 12 (Nigeria), PoPIA §71 (South Africa), CMA Kenya, WAEMU, CBK and 6 other African frameworks are mapped flag-by-flag at /security alongside GDPR + EU AI Act + Basel III. Full posture at /security.';

/**
 * Compact JSON-LD FAQ answer for "How is sensitive data protected?".
 * Same posture distinction, abbreviated for structured-data consumption.
 */
export const SOC2_JSON_LD_DATA_PROTECTION =
  'All documents are encrypted with AES-256-GCM at rest and TLS 1.2+ in transit. A GDPR anonymization layer removes PII before any AI processing. Hosted on Vercel + Supabase (both SOC 2 Type II); Decision Intel’s own product-level audit is targeted for Q4 2026.';

/**
 * Short pricing-page trust-band label for SOC 2 status. Pairs with the
 * sub-line "AES-256-GCM + TLS 1.2+".
 */
export const SOC2_TRUST_BAND_LABEL = 'SOC 2 Type II infrastructure';
export const SOC2_TRUST_BAND_SUB = 'Vercel + Supabase · AES-256-GCM + TLS 1.2+';

/**
 * Long-form SOC 2 statement — used on long-form marketing pages
 * (decision-intel-for-boards, security questionnaire responses) where
 * we want a complete sentence-shape that distinguishes infrastructure
 * SOC 2 from product-level. Mirrors SOC2_FAQ_ANSWER's posture but
 * sentence-shaped for prose, not Q&A.
 */
export const SOC2_FULL_STATEMENT =
  'Hosted on SOC 2 Type II infrastructure (Vercel + Supabase). Decision Intel’s own product-level SOC 2 Type I audit is targeted for Q4 2026, with the Type II observation window opening immediately after; in-flight controls already mirror Type II.';

/**
 * Landing-strip-grade SOC 2 label + caption — locked 2026-04-30 (B2 lock,
 * James persona ask). The landing page previously hardcoded a label that
 * read to a casual procurement reviewer as "DI is SOC 2 certified" — the
 * `LABEL` + `NOTE` pair below makes the infrastructure-vs-product
 * distinction explicit in five words.
 */
export const SOC2_LANDING_STRIP_LABEL = 'SOC 2 Type II infrastructure';
export const SOC2_LANDING_STRIP_NOTE = 'Vercel + Supabase · product Type I Q4 2026';

/**
 * DPR provenance claim — locked 2026-04-26 after the persona audit caught
 * "signed, hashed" overclaim across 16 surfaces. The implementation in
 * src/lib/reports/decision-provenance-record-generator.ts produces SHA-256
 * input hashes; it does NOT cryptographically sign with a Decision Intel
 * private key. The accurate, defensible claim is "hashed and
 * tamper-evident". When private-key signing ships, update this constant
 * to "signed + hashed + tamper-evident" everywhere at once.
 */
export const DPR_PROVENANCE_CLAIM_SHORT = 'hashed + tamper-evident';
export const DPR_PROVENANCE_CLAIM_LONG = 'hashed, tamper-evident';
export const DPR_PROVENANCE_CARD_LABEL = 'Decision Provenance Record';
export const DPR_PROVENANCE_CARD_SUB = 'hashed + tamper-evident on every audit';

/**
 * AI Verify disclaimer — locked 2026-04-30 (B2 lock, James persona ask).
 * AI Verify is a SELF-ASSESSMENT framework codified by the AI Verify
 * Foundation (Singapore IMDA, aligned with EU + OECD). The Foundation
 * does not certify products. Every public surface that references AI
 * Verify must surface this disclaimer or risk being read as a
 * third-party-audited compliance claim — a falsifiable overclaim.
 *
 * SHORT: one-line chip / footer / metadata.
 * LONG : prose paragraph for /regulatory/ai-verify and any
 *        long-form treatment.
 *
 * Consumers as of 2026-04-30 (B2 lock):
 *   - src/app/(marketing)/regulatory/ai-verify/AiVerifyMappingClient.tsx
 *     (above-the-fold disclaimer banner + body footnote)
 *   - src/app/(marketing)/page.tsx (landing AI Verify chip)
 *   - any future surface that references "AI Verify"
 */
export const AI_VERIFY_DISCLAIMER_SHORT =
  'Self-assessment framework · no third-party certification';
export const AI_VERIFY_DISCLAIMER_LONG =
  'AI Verify is a self-assessment governance framework codified by the AI Verify Foundation (Singapore IMDA, aligned with EU and OECD). The Foundation does not certify products. Decision Intel’s alignment with the 11 internationally-recognised AI governance principles is self-attested; no third-party audit has yet been performed against this mapping.';

/**
 * SOC 2 receipts catalogue — locked 2026-05-01 in response to the James
 * (F500 GC) persona finding that /security claimed "SOC 2 Type II
 * infrastructure" without surfacing the audit metadata a vendor-risk
 * register reviewer expects: issue date, auditor name, expiry, scope.
 *
 * Sourced from each vendor's public SOC 2 trust portal as of the lock
 * date. Decision Intel's own product-level audit is targeted (not yet
 * issued) — that row carries `status: 'targeted'` and an audit-firm
 * placeholder explicitly named as TBD-at-engagement so the page never
 * claims more than the actual posture.
 *
 * Consumers as of 2026-05-01:
 *   - src/app/(marketing)/security/page.tsx (SOC 2 Receipts section)
 *
 * Update HERE when (a) a Type I report is issued, (b) Vercel/Supabase
 * publish a renewed observation window, (c) a sub-processor is added or
 * removed. Every consumer picks up the change.
 */
export type Soc2ReceiptStatus = 'attested' | 'targeted';

export interface Soc2Receipt {
  party: string;
  role: string;
  reportType: string;
  status: Soc2ReceiptStatus;
  observationWindow: string;
  auditor: string;
  scope: string;
  verification: string;
}

export const SOC2_RECEIPTS: Soc2Receipt[] = [
  {
    party: 'Decision Intel Ltd. (Processor)',
    role: 'Application + reasoning-audit pipeline',
    reportType: 'SOC 2 Type I',
    status: 'targeted',
    observationWindow: 'Targeted Q4 2026 issuance · Type II window opens immediately after',
    auditor:
      'Audit firm to be named at engagement (Big-4 or AICPA-listed Tier-1 specialist). In-flight controls already mirror Type II.',
    scope:
      'Decision Intel application, analysis pipeline, Decision Provenance Record generation, audit-log immutability, encryption-key rotation, and access control for customer-uploaded documents.',
    verification: 'Status disclosed in writing on every Enterprise pilot agreement.',
  },
  {
    party: 'Vercel Inc. (Sub-processor)',
    role: 'Application hosting + edge compute',
    reportType: 'SOC 2 Type II',
    status: 'attested',
    observationWindow: 'Continuous · current report covers a rolling 12-month window',
    auditor: 'Insight Assurance · AICPA-registered',
    scope:
      'Edge runtime, deployment pipeline, build infrastructure, and the platform on which Decision Intel runs.',
    verification: 'Trust portal · vercel.com/legal/soc2',
  },
  {
    party: 'Supabase Inc. (Sub-processor)',
    role: 'Postgres + Auth + file storage',
    reportType: 'SOC 2 Type II + HIPAA',
    status: 'attested',
    observationWindow: 'Continuous · current report covers a rolling 12-month window',
    auditor: 'Prescient Assurance · AICPA-registered',
    scope:
      'Database, authentication, file storage, point-in-time recovery, and backup infrastructure that holds customer documents and audit logs.',
    verification: 'Trust portal · supabase.com/security · HIPAA BAA available on Enterprise',
  },
  {
    party: 'Sentry (Sub-processor)',
    role: 'Error monitoring',
    reportType: 'SOC 2 Type II',
    status: 'attested',
    observationWindow: 'Continuous · current report covers a rolling 12-month window',
    auditor: 'Audit firm disclosed in trust portal',
    scope:
      'Error capture and runtime telemetry. PII scrubbing is enabled at SDK level so Sentry never receives raw document content.',
    verification: 'Trust portal · sentry.io/trust',
  },
  {
    party: 'Stripe Inc. (Sub-processor)',
    role: 'Billing',
    reportType: 'SOC 2 Type II + SOC 1 Type II + PCI-DSS Level 1',
    status: 'attested',
    observationWindow: 'Continuous · current report covers a rolling 12-month window',
    auditor: 'Audit firm disclosed in trust portal',
    scope: 'Subscription billing, payment-method storage, and invoicing. No document content flows through Stripe.',
    verification: 'Trust portal · stripe.com/docs/security',
  },
];

/**
 * Indemnification cap — locked 2026-05-01 (James persona ask). The
 * /security page previously documented audit-trail and incident SLAs
 * without surfacing the contractual cap a F500 GC asks about as soon as
 * the technical posture passes review. Standard cap is the typical
 * SaaS shape (12 months' fees); custom mutual indemnification is
 * available on Enterprise pilots.
 *
 * Update HERE when (a) the standard cap changes (e.g. cyber-liability
 * carriage lifts the floor), (b) a custom shape becomes the default
 * for a tier, (c) the carve-outs change.
 */
export const INDEMNIFICATION_LABEL = 'Indemnification cap';
export const INDEMNIFICATION_VALUE = 'Standard 12 months’ fees · custom mutual on request';
export const INDEMNIFICATION_BODY =
  'Standard subscription contracts cap each party’s aggregate liability at 12 months of fees paid by Controller in the 12 months immediately before the claim, excluding (a) breach of confidentiality, (b) wilful misconduct, (c) third-party IP indemnities, and (d) sub-processor data-protection failures where Decision Intel is the engaging Processor. Enterprise customers may negotiate a mutual indemnification cap and an uncapped third-party-IP indemnity at signature. Cyber-liability + errors-and-omissions insurance carriage is on the Q1 2027 roadmap; until live, Enterprise customers receive a written disclosure of the insurance gap and the contractual commitments that substitute for it.';

/**
 * Bias Genome data ownership — locked 2026-05-01 (Margaret persona
 * blocker). The platform's per-org Brier-scored recalibration moat
 * (the answer to Cloverpop's data-advantage attack vector) requires
 * outcome metadata aggregation across consenting organisations. F500
 * GCs and audit committees won't sign without an explicit ownership
 * statement: who keeps what, what gets aggregated, who can opt out,
 * how withdrawal works. The clauses below are the contractual
 * commitments — mirrored in the DPA + every pilot agreement.
 *
 * Update HERE when (a) the aggregation scope changes, (b) the
 * opt-out/withdrawal mechanism changes, (c) the ownership posture
 * itself shifts (e.g. a new tier offering paid contribution).
 */
export const BIAS_GENOME_OWNERSHIP = [
  {
    label: 'Customer-owned: document content',
    value: 'Always · no exceptions',
    body: 'Every uploaded strategic memo, board deck, IC document, and reasoning artefact remains Customer property. Decision Intel processes the content under the DPA and never claims any IP, derived-work, or training right over the source bytes. The same posture applies to Decision Provenance Records: the artefact is Customer-owned, signed by Decision Intel.',
  },
  {
    label: 'Platform-aggregated: outcome metadata only',
    value: 'Anonymised · opt-in',
    body: 'Bias Genome cohort signals are derived exclusively from outcome METADATA: bias type, decision-domain class, predicted-vs-realised quality, time-to-outcome window. Document content, persona names, deal terms, and any text fragments are NEVER part of the cohort signal. Aggregation happens server-side after k-anonymity guards (≥3 contributing organisations per signal). The aggregation is opt-in and can be disabled per organisation in Settings &rsaquo; Org without affecting the rest of the product.',
  },
  {
    label: 'Withdrawal path',
    value: 'One-click · 30-day backfill',
    body: 'A Customer who joins the cohort and later opts out can request that prior outcome-metadata contributions be withdrawn from future Bias Genome computations. Withdrawal completes within 30 days; the backfill is logged to the Customer-visible audit log so the action is auditable. Already-published cohort statistics that incorporated the contribution are not retroactively recomputed (they are timestamped artefacts), but the Customer is excluded from every subsequent computation.',
  },
  {
    label: 'No model training on Customer data',
    value: 'Contractual',
    body: 'Customer document content is never used to train, fine-tune, or evaluate any large language model: Gemini, Claude, or otherwise. Provider terms (Google Cloud Platform + Anthropic) explicitly disclaim training on enterprise inputs. The same commitment is mirrored in the DPA and every pilot agreement.',
  },
  {
    label: 'Cohort export on Enterprise',
    value: 'On request',
    body: 'Enterprise customers contributing outcome metadata may request a quarterly extract of the cohort signal their organisation contributed to, anonymised, in CSV + JSON. Useful for internal calibration audits and audit-committee briefings.',
  },
];
