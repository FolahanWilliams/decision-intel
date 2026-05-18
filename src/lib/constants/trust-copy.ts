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
 * Evidentiary Standard — Defensibility Vector #4 ("Methodology-as-
 * standard", the switching-cost / FICO-GAAP-of-decision-quality moat).
 * Locked 2026-05-18.
 *
 * The DPR already carries the individual cryptographic pieces; Vector #4
 * is the BINDING of them into one citable construct + the legal-evidence
 * framing (per the CLAUDE.md Defensibility lock: "bind the hashes into
 * the legal-evidence framing, not just the PDF footer"). The composed
 * token itself is produced by the pure helper
 * `composeEvidentiaryStandardFingerprint` in
 * src/lib/reports/evidentiary-standard.ts; THIS file owns the canonical
 * COPY that the contractual + procurement surfaces render verbatim.
 *
 * Honesty discipline: the switching cost is requires-scale (it
 * materialises once a GC has YEARS of trail) — the copy states the
 * MECHANISM by which a method change becomes a documented, regulator-
 * visible event, never that lock-in already exists today. "Hashed +
 * tamper-evident", never "signed" (private-key signing is Q3 2026
 * roadmap — same vocabulary lock as DPR_PROVENANCE_*).
 *
 * Consumers (keep in lockstep — drift here is a procurement-reader
 * red-circle, same class as the SOC 2 / framework-count discipline):
 *   - src/components/dpr/pages/DprPageOneCover.tsx       (cover strap + row)
 *   - src/app/(marketing)/terms/page.tsx                 (§10I, imports the clause)
 *   - scripts/generate-legal-pdfs.mjs                    (DPA PDF + DOCX, verbatim mirror)
 *   - src/app/(marketing)/security/page.tsx              (procurement section)
 *   - src/app/(marketing)/trust/page.tsx                 (procurement bundle)
 *   - src/app/api/founder-hub/founder-context.ts         (chat coach)
 */
export const EVIDENTIARY_STANDARD_LABEL = 'Evidentiary standard';

export const EVIDENTIARY_STANDARD_FINGERPRINT_BODY =
  'Every Decision Provenance Record carries a single evidentiary-standard fingerprint that binds, in one citable token, the DQI methodology version, the SHA-256 hash of the audited document, the prompt fingerprint, the DQI weight-resolution hash, and the record schema. The fingerprint is deterministic: the same decision audited under the same standard produces the same token, so two DPRs are provably from the same engine state by comparing one string.';

export const EVIDENTIARY_STANDARD_CONTINUITY_BODY =
  'Your EU AI Act Article 14 and Basel III Pillar 2 ICAAP audit trail is constructed on these fingerprints. Any change to the audit standard — methodology version, weight resolution, or scoring engine — produces a different fingerprint and is versioned and disclosed against the prior records. The continuity is the point: once an audit committee has built a multi-year reasoning-provenance trail on a consistent evidentiary standard, moving the same decisions to a different audit method is not a silent switch — it is a documented change of evidentiary standard a regulator can see across the record series.';

export const EVIDENTIARY_STANDARD_DPR_STRAP =
  'This fingerprint is the evidentiary standard your reasoning-audit trail is built on. Methodology + input + prompt + weights + schema, bound into one citable token — see the Evidentiary Standard & Audit-Trail Continuity clause in the Terms / DPA.';

/**
 * The verbatim Terms §10I / DPA clause. Terms imports this constant;
 * scripts/generate-legal-pdfs.mjs mirrors it WORD-FOR-WORD with a
 * lockstep comment (the .mjs script cannot import a .ts const — the
 * format-divergence between the two artefacts is the bug class per the
 * existing DPA lockstep lock).
 */
export const EVIDENTIARY_STANDARD_DPA_CLAUSE =
  'Each Decision Provenance Record we produce carries a deterministic evidentiary-standard fingerprint binding the DQI methodology version, the SHA-256 hash of the input document, the prompt fingerprint, the DQI weight-resolution hash, and the record schema. We will not change the evidentiary standard underlying your records without versioning the change and preserving the prior fingerprint series, so that a multi-year reasoning-provenance trail built for EU AI Act Article 14, Basel III Pillar 2 ICAAP, SOX §404, or SEC AI-disclosure purposes remains internally consistent and any change of standard is a disclosed, reconstructable event rather than a silent substitution. On termination, the fingerprint series is included in the data export under §10A so the trail remains independently verifiable after the engagement ends.';

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
  'Standard subscription contracts cap each party’s aggregate liability at 12 months of fees paid by Controller in the 12 months immediately before the claim, excluding (a) breach of confidentiality, (b) wilful misconduct, (c) third-party IP indemnities, and (d) sub-processor data-protection failures where Decision Intel is the engaging Processor. Enterprise customers may negotiate a mutual indemnification cap and an uncapped third-party-IP indemnity at signature.';

/**
 * Cyber-liability + E&O insurance gap disclosure — extracted 2026-05-10
 * (audit batch 2 #3, James persona blocker). The gap was previously
 * inlined in the last sentence of INDEMNIFICATION_BODY, but a F500 GC
 * scanning /trust top-to-bottom would either skim past it or have to
 * search to find it. Procurement-grade transparency is PERFORMATIVE —
 * show it, don't bury it. Now rendered as its own visible callout next
 * to the standard-cap card so the disclosure cannot be missed.
 *
 * Update HERE when (a) carriage actually lands (flip from gap → carry
 * disclosure with policy limits + carrier name), (b) the substitute
 * commitments shift (e.g. uncapped breach-of-confidentiality changes
 * shape), (c) the roadmap timeline slips beyond Q1 2027.
 */
export const INSURANCE_GAP_LABEL = 'Insurance carriage · honest gap disclosure';
export const INSURANCE_GAP_VALUE = 'Cyber-liability + E&O · Q1 2027 roadmap';
export const INSURANCE_GAP_BODY =
  'Cyber-liability + errors-and-omissions insurance carriage is on the Q1 2027 roadmap. Until carriage is live, Enterprise customers receive a written disclosure of the insurance gap and the contractual commitments that substitute for it: uncapped breach-of-confidentiality, mutual indemnification, and an escrowed remediation budget on request. We surface this gap explicitly rather than burying it because procurement-grade transparency is the procurement signal — performative gaps survive vendor-risk register review; hidden gaps do not.';

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

/**
 * Sub-Processor Schedule — the canonical procurement-grade list a F500
 * vendor-risk reviewer needs at first read. Item 2 lock 2026-05-07
 * (James persona BLOCKER from the 2026-05-07 audit Section 8: "F500
 * vendor-risk register opens with 'where does our data physically
 * reside, who touches it, how do we get it back on termination?'").
 *
 * Mirrors and extends the lighter PROCESSORS list on /privacy with the
 * region + service-category + customer-right-to-object fields a
 * Schedule of Sub-Processors needs. Source-of-truth for /trust;
 * /privacy still carries its own simplified list because it serves a
 * different reader (data subject vs. procurement reviewer).
 *
 * Forward-looking rule: when adding a new sub-processor, update both
 * /privacy PROCESSORS + this SUB_PROCESSORS array in the same commit
 * so a procurement reader cross-reading the privacy policy and the
 * sub-processor schedule sees consistent data flows. The
 * change-notification SLA (≥30 days) is contractual via the DPA and
 * cannot be reduced without a customer-acknowledgement re-signature.
 */
export interface SubProcessor {
  /** Vendor / service name. */
  name: string;
  /** What kind of service they provide — drives grouping in the table. */
  category:
    | 'compute'
    | 'database'
    | 'ai_inference'
    | 'email'
    | 'monitoring'
    | 'payment'
    | 'dns_email_routing';
  /** Human-readable category label rendered in the UI. */
  categoryLabel: string;
  /** Region(s) where Customer data physically resides. */
  region: string;
  /** What Customer data the sub-processor touches. */
  dataTouched: string;
  /** Compliance posture (SOC 2 etc) — optional. */
  compliancePosture?: string;
  /** Independent verification path (DPA section, audit report, public docs). */
  verification: string;
}

export const SUB_PROCESSOR_CHANGE_NOTIFICATION_SLA =
  '≥30 days written notice via security@decision-intel.com before activation; Customer right to object in writing within 14 days, with cure path defined per DPA §6.';

export const SUB_PROCESSORS: SubProcessor[] = [
  {
    name: 'Vercel',
    category: 'compute',
    categoryLabel: 'Application hosting + serverless compute',
    region: 'US (primary) · multi-region edge for static assets',
    dataTouched:
      'Application code, environment variables, server-side request handling. No persistent customer content storage.',
    compliancePosture: 'SOC 2 Type II · ISO 27001',
    verification:
      'https://vercel.com/legal/dpa · https://trust.vercel.com (audit reports under NDA).',
  },
  {
    name: 'Supabase',
    category: 'database',
    categoryLabel: 'Authentication + encrypted Postgres',
    region:
      'US (primary production region) · EU residency available on Enterprise design-partner configurations subject to confirmation before signature',
    dataTouched:
      'Customer accounts, user settings, encrypted document content (AES-256-GCM at rest), audit log rows, all platform metadata.',
    compliancePosture: 'SOC 2 Type II · GDPR + UK GDPR DPA',
    verification: 'https://supabase.com/dpa · https://supabase.com/security.',
  },
  {
    name: 'Google AI (Gemini)',
    category: 'ai_inference',
    categoryLabel: 'Primary analysis model',
    region: 'US region · processed under no-training enterprise terms',
    dataTouched:
      'Anonymised document text (PII scrubbed by the GDPR anonymizer node first). No training right; logged on Vercel-side cost-tracker only.',
    compliancePosture: 'Google Cloud DPA · enterprise no-training contractual commitment',
    verification:
      'https://cloud.google.com/terms/data-processing-addendum · per-call cost telemetry on the Vercel AI Gateway dashboard.',
  },
  {
    name: 'Anthropic (Claude)',
    category: 'ai_inference',
    categoryLabel: 'Fallback analysis model',
    region: 'US region · invoked only on Gemini transient errors when AI_FALLBACK_ENABLED',
    dataTouched:
      'Anonymised document text (same anonymizer pre-pass as Gemini). No training right.',
    compliancePosture: 'Anthropic Enterprise Terms · no-training contractual commitment',
    verification: 'https://www.anthropic.com/legal/dpa.',
  },
  {
    name: 'Stripe',
    category: 'payment',
    categoryLabel: 'Subscription + per-deal payment processing',
    region: 'US + EU regional payment infrastructure',
    dataTouched:
      'Billing email, subscription state, payment intent IDs. Decision Intel never sees or stores card numbers; PCI-DSS responsibility lives with Stripe.',
    compliancePosture: 'PCI-DSS Level 1 · SOC 1 + 2',
    verification: 'https://stripe.com/dpa · https://stripe.com/security.',
  },
  {
    name: 'Resend',
    category: 'email',
    categoryLabel: 'Transactional email',
    region: 'US (primary) · EU regional capability on request',
    dataTouched:
      'Customer email address + transactional message content (auth flows, magic links, password resets, account notifications).',
    compliancePosture: 'SOC 2 Type II',
    verification: 'https://resend.com/legal/dpa.',
  },
  {
    name: 'Sentry',
    category: 'monitoring',
    categoryLabel: 'Error + performance telemetry',
    region: 'US (primary)',
    dataTouched:
      'Error stack traces, request metadata, performance spans. PII scrubbers enabled at the SDK layer; no body content captured.',
    compliancePosture: 'SOC 2 Type II · ISO 27001 · GDPR DPA',
    verification: 'https://sentry.io/trust/dpa.',
  },
  {
    name: 'Cloudflare',
    category: 'dns_email_routing',
    categoryLabel: 'DNS + inbound email routing',
    region: 'Global edge · EU + US DNS POPs',
    dataTouched:
      'DNS lookups for decision-intel.com domains; inbound *@decision-intel.com email routing to founder Gmail. No persistent message storage.',
    compliancePosture: 'SOC 2 Type II · ISO 27001 · PCI-DSS · GDPR DPA',
    verification: 'https://www.cloudflare.com/cloudflare-customer-dpa/.',
  },
];

// =============================================================================
// Liability-shift compulsion framing — locked 2026-05-11 per Tier 3.3
// =============================================================================
//
// Paper #2 Ch 9 historical analog: Aviation CRM crossed from "exercise" to
// "continuous practice" via three structural inflection conditions —
// (i) liability shift in motion, (ii) friction collapse unlocked,
// (iii) status reframing. The 1990 FAA Advanced Qualification Program made
// CRM compulsory; that was the inflection moment.
//
// Corporate M&A is at the same inflection. EU AI Act Article 14 enforceable
// August 2026 + Basel III Pillar 2 ICAAP (already live) + SEC AI disclosure
// rulemaking (evolving through 2026) make the audit artefact COMPULSORY, not
// optional. The Why Now pitch slide leads with the compulsion framing rather
// than the regulatory tailwinds being accessory.
//
// Vocabulary discipline: "compulsory" / "auditable" / "defensible record" —
// NOT "compliance theatre" or "checking the box." Procurement readers
// recognise the difference between a real liability shift and a regulatory
// claim padded for marketing.

export interface LiabilityShiftAnchor {
  /** Short label for the slide-3 chip. */
  label: string;
  /** Status — "enforceable Aug 2026" / "live" / "in motion". */
  status: string;
  /** The DPR field that satisfies the obligation. */
  dprMechanism: string;
}

export const LIABILITY_SHIFT_ANCHORS: ReadonlyArray<LiabilityShiftAnchor> = [
  {
    label: 'EU AI Act Article 14',
    status: 'enforceable August 2026',
    dprMechanism:
      "Human oversight + record-keeping mapped onto the DPR's hashed input + judge variance + meta-verdict trail.",
  },
  {
    label: 'Basel III Pillar 2 ICAAP',
    status: 'live for regulated banks',
    dprMechanism:
      'Qualitative decision documentation requirement satisfied by the DPR — every flagged bias attaches a Basel III provision citation.',
  },
  {
    label: 'SEC AI disclosure (proposed)',
    status: 'evolving through 2026',
    dprMechanism:
      "Model lineage + prompt fingerprint + judge variance documented per the DPR's methodology section.",
  },
  {
    label: 'AI Verify Foundation (Singapore IMDA)',
    status: 'aligned to all 11 principles',
    dprMechanism:
      'Every DPR field maps onto the 11 internationally-recognised AI governance principles.',
  },
] as const;

/**
 * The compulsion headline for the Why Now pitch slide + the /security
 * "Regulatory tailwinds" section. Use verbatim — this is the move that
 * shifts the conversation from "nice to have" to "you don't have a
 * choice once August 2026 lands."
 */
export const LIABILITY_SHIFT_COMPULSION_HEADLINE =
  'The audit artefact is becoming compulsory, not optional — and we already produce the artefact your high-stakes decisions need to defend in front of the regulator.';

/**
 * The supporting paragraph for the Why Now slide. Names the three Paper
 * #2 Ch 9 inflection conditions explicitly so a procurement-stage reader
 * sees the structural argument, not just the dates.
 */
export const LIABILITY_SHIFT_COMPULSION_BODY =
  'Aviation Crew Resource Management crossed from "exercise" to compulsory practice in 1990 when the FAA Advanced Qualification Program made it the standard. Corporate M&A is at the same inflection — three structural conditions converging: a liability shift in motion (EU AI Act Article 14 enforceable August 2026 + Basel III Pillar 2 ICAAP live + SEC AI disclosure rulemaking), friction collapse unlocked (sub-cent per render via deepseek-v4-flash through the AI Gateway), and the status reframing of structured decision support from "false precision" to "elite operational hygiene." Decision Intel produces the Decision Provenance Record the August 2026 enforcement deadline calls for, today.';

/**
 * The closing one-liner that converts the compulsion argument to a wedge
 * action. Goes at the bottom of the Why Now slide + the /security
 * tailwinds section.
 */
export const LIABILITY_SHIFT_COMPULSION_CLOSE =
  'Buy the audit before the regulator forces it. The artefact is the same either way; the difference is whether your audit committee is staring at a clean DPR or scrambling to produce one mid-enforcement.';
