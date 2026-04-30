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
