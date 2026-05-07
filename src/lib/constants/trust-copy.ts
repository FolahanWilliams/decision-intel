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
  'Decision Intel runs on SOC 2 Type II infrastructure (Vercel + Supabase). Our own product-level SOC 2 Type I audit is targeted for Q4 2026, with the Type II observation window opening immediately after. Documents are encrypted with AES-256-GCM at rest and TLS 1.2+ in transit. A GDPR + NDPR anonymization layer strips PII before any AI processing. Pan-African customers: NDPR Art. 12 (Nigeria), PoPIA §71 (South Africa), CMA Kenya, WAEMU, CBK and 7 other African frameworks are mapped flag-by-flag at /security alongside GDPR + EU AI Act + Basel III. Full posture at /security.';

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
    scope:
      'Subscription billing, payment-method storage, and invoicing. No document content flows through Stripe.',
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
/**
 * Audit log retention SLA — locked 2026-05-05 (James persona blocker, deep
 * nightly audit Section 8 B3 + 9.2-adjacent). The /security page documented
 * SOC 2 receipts, DR/BCP, and indemnification but had no explicit
 * retention SLA on the audit log itself — the artefact a F500 GC reads
 * during a vendor-risk review BEFORE getting to indemnification. SOX
 * §404 requires 7-year retention on internal-controls evidence; that's
 * the procurement floor for any Enterprise customer with public-company
 * exposure.
 *
 * The tier shape is the standard SaaS retention ladder: Individual gets
 * the floor (legal-defensible 1y), Strategy gets the typical
 * mid-market 3y, Enterprise gets SOX-aligned 7y. Custom retention
 * (HIPAA, banking, government) is negotiable on Enterprise pilots.
 *
 * Update HERE when (a) the retention shape changes per tier, (b) a new
 * tier with a different floor lands, (c) immutability or export posture
 * changes.
 */
export const AUDIT_LOG_RETENTION_LABEL = 'Audit log retention';
export const AUDIT_LOG_RETENTION_TIERS = [
  {
    tier: 'Individual',
    window: '1 year',
    note: 'Legal-defensible floor for individual-buyer accounts.',
  },
  {
    tier: 'Strategy (team)',
    window: '3 years',
    note: 'Mid-market default for team accounts running quarterly board cycles.',
  },
  {
    tier: 'Enterprise',
    window: '7 years',
    note: 'SOX §404 internal-controls aligned. Custom retention (HIPAA, banking, government) negotiable on pilot agreement.',
  },
];
export const AUDIT_LOG_RETENTION_BODY =
  'Every audit log entry is immutable, append-only, and timestamped at write. Entries are queryable via the AdminAuditLog UI inside the customer account and exportable as a single JSON bundle via the account-data export endpoint (Enterprise tier). The retention window starts at the entry write timestamp; expired entries are archived to cold storage for an additional 90 days before cryptographic destruction. When a customer leaves the platform, the active retention window survives the contract end-date so post-departure regulatory queries can still be answered.';

/**
 * Vendor-risk questionnaire shape — locked 2026-05-05 (James persona ask,
 * deep nightly audit Section 8 B2). The /security page already surfaced
 * SOC 2 receipts in a flat tile shape; a F500 GC running a SIG / VSA /
 * Cloud Security Alliance CAIQ questionnaire works in
 * question→answer→verification triples and circles every gap in red.
 * Reshaping the same data into questionnaire row-shape lets a procurement
 * reviewer copy answers row-for-row into the questionnaire without
 * paraphrasing — which is the speed difference between "vendor cleared
 * Wednesday" and "vendor cleared next quarter" on a procurement queue.
 *
 * The questionnaire blocks below are derived from SOC2_RECEIPTS,
 * AUDIT_LOG_RETENTION_*, INDEMNIFICATION_*, and DR_BCP entries already on
 * the page. The shape is additive — the existing flat receipts grid stays
 * for readers who want to scan; the questionnaire view is the procurement
 * accelerator.
 *
 * Source-of-truth pattern: every entry below should map to a value
 * already exported from this file or already rendered on /security. If a
 * questionnaire row needs a new fact, add the fact to the canonical
 * export FIRST, then reference it in the questionnaire row.
 *
 * Update HERE when SIG / VSA / CAIQ standards change row labels (rare),
 * or when a new question class becomes a recurring procurement blocker.
 */
export interface QuestionnaireRow {
  question: string;
  answer: string;
  verification: string;
  category: 'control' | 'data' | 'incident' | 'continuity' | 'contractual';
}

export const VENDOR_QUESTIONNAIRE_ROWS: QuestionnaireRow[] = [
  {
    question:
      'Are SOC 2 Type II reports issued by an independent registered auditor for the platform infrastructure?',
    answer:
      'Yes. Vercel (application hosting + edge compute) — SOC 2 Type II by Insight Assurance, AICPA-registered, continuous rolling 12-month observation window. Supabase (Postgres + Auth + file storage) — SOC 2 Type II + HIPAA by Prescient Assurance, AICPA-registered, continuous rolling 12-month window. Both reports cover the platform on which Decision Intel runs.',
    verification: 'vercel.com/legal/soc2 · supabase.com/security · trust portals public',
    category: 'control',
  },
  {
    question: 'Does the application processor itself hold a SOC 2 attestation?',
    answer:
      'Decision Intel’s product-level SOC 2 Type I audit is targeted Q4 2026 issuance, with the Type II observation window opening immediately after. Audit firm to be named at engagement (Big-4 or AICPA-listed Tier-1 specialist). In-flight controls already mirror Type II requirements; the gap between today and Type I issuance is documented in the Enterprise pilot agreement.',
    verification: 'Status disclosed in writing on every Enterprise pilot agreement.',
    category: 'control',
  },
  {
    question: 'Is data encrypted at rest and in transit?',
    answer:
      'Yes. AES-256-GCM for documents and audit-log content at rest. TLS 1.2+ for every transit hop (browser to platform, platform to AI providers, platform to sub-processors). A GDPR + NDPR anonymization layer strips PII before any AI processing — the LLM provider never sees raw customer content with identifiers attached.',
    verification: '/privacy data lifecycle section · processor list with sub-processor details',
    category: 'data',
  },
  {
    question: 'What is the audit log retention window?',
    answer:
      'Individual tier: 1 year. Strategy tier (team): 3 years. Enterprise tier: 7 years (SOX §404 internal-controls aligned). Every entry is immutable, append-only, and timestamped at write. Entries are queryable via the customer-facing AdminAuditLog UI and exportable as a single JSON bundle via the Enterprise account-data export endpoint. Custom retention (HIPAA, banking, government) is negotiable on Enterprise pilot agreement.',
    verification:
      '/security audit-log retention SLA section · contractual commitment in pilot agreement.',
    category: 'data',
  },
  {
    question: 'What is the disaster recovery posture (RPO / RTO)?',
    answer:
      'Recovery Point Objective ≤ 15 minutes (Postgres WAL streaming + daily snapshots). Recovery Time Objective < 4 hours. Production region is US (Vercel + Supabase US). EU region is available on Enterprise pilot agreement; multi-region production is on the published roadmap. Annual restore drill is performed and documented; the most recent drill date is disclosed on every Enterprise pilot agreement.',
    verification: '/security DR/BCP section · drill date in pilot agreement.',
    category: 'continuity',
  },
  {
    question: 'What is the security-incident response SLA?',
    answer:
      'Customer notification within 72 hours of confirmed security incident affecting customer data — mirrors GDPR Art. 33 controller-notification timing as the procurement floor. Faster notification (24 hours / 12 hours) is negotiable on Enterprise pilot agreement when the customer’s own regulatory posture requires it. A written incident report is delivered within 7 days of notification, including root cause, scope of affected records, remediation steps, and the controls hardened to prevent recurrence.',
    verification: 'Pilot agreement · incident report template available on request.',
    category: 'incident',
  },
  {
    question: 'What is the standard liability cap?',
    answer:
      '12 months of fees paid by Controller in the 12 months immediately before the claim, excluding (a) breach of confidentiality, (b) wilful misconduct, (c) third-party IP indemnities, and (d) sub-processor data-protection failures where Decision Intel is the engaging Processor. Mutual indemnification cap and uncapped third-party-IP indemnity are negotiable at Enterprise signature.',
    verification: 'Subscription agreement § 12 · Enterprise pilot indemnification schedule.',
    category: 'contractual',
  },
  {
    question: 'Is cyber-liability insurance and errors-and-omissions insurance carried?',
    answer:
      'On the Q1 2027 roadmap. Until carriage is live, Enterprise customers receive a written disclosure of the insurance gap and the contractual commitments that substitute for it (uncapped breach-of-confidentiality, mutual indemnification, escrowed remediation budget on request).',
    verification:
      'Enterprise pilot agreement · insurance gap disclosure clause · roadmap status updated quarterly.',
    category: 'contractual',
  },
  {
    question: 'Where is customer data trained on for AI improvements?',
    answer:
      'Customer document content is never used to train, fine-tune, or evaluate any LLM (Gemini, Claude, or otherwise). Provider terms (Google Cloud Platform + Anthropic) explicitly disclaim training on enterprise inputs. The same commitment is mirrored in the DPA and every pilot agreement. Bias Genome cohort signals are derived from outcome METADATA only (bias type, decision-domain class, predicted-vs-realised quality, time-to-outcome window) — never document content, persona names, or deal terms.',
    verification: 'DPA § Bias Genome ownership · provider terms (GCP + Anthropic enterprise DPA).',
    category: 'data',
  },
  {
    question: 'What is the data portability and exit-assistance posture on contract termination?',
    answer:
      'Customer-owned content (every uploaded artefact + every Decision Provenance Record) is exportable as a single account-data JSON bundle at any time during the contract and within 60 days of termination. Cohort export (anonymised outcome metadata the customer organisation contributed to Bias Genome) is available on quarterly cadence on Enterprise tier. After the 60-day exit window, customer content is cryptographically destroyed; audit log entries follow the retention window above.',
    verification: '/api/export/account · DPA § 5 · pilot agreement termination clause.',
    category: 'data',
  },
];

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
