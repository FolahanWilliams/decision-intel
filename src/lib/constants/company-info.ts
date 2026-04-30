/**
 * Single source of truth for the legal-entity, founder, and stage facts
 * that appear on every procurement-facing surface.
 *
 * Created 2026-04-26 alongside the persona-audit P0 fixes — the audit
 * caught (a) the privacy policy missing a named data controller (GDPR
 * Art 13(1)(a)) and (b) no /about page disclosing the legal entity, so
 * a Fortune 500 procurement reviewer had nowhere to verify the
 * vendor's existence before signing. Rather than scatter strings across
 * three pages, every consumer reads from here.
 *
 * IMPORTANT — placeholders below are flagged with TODO comments. The
 * founder must replace before any Fortune 500 procurement conversation:
 *   - LEGAL_ENTITY_NAME (the actual incorporated name)
 *   - REGISTERED_OFFICE_LINES (the registered address)
 *   - JURISDICTION (the state / country of incorporation)
 *
 * Stage language: per CLAUDE.md "Marketing Voice — Enterprise Discipline"
 * we do NOT use "pre-seed", "we're building", or "we just launched".
 * The honest + procurement-grade frame is "design-partner phase" —
 * accurate (we run a structured design-partner program), enterprise
 * voice, no apology.
 */

/**
 * The incorporated legal entity name. TODO(founder): replace with the
 * actual incorporated name (e.g., "Decision Intel Ltd", "Decision Intel
 * Inc", "Decision Intel Technologies Pty Ltd") before any Fortune 500
 * procurement conversation.
 */
export const LEGAL_ENTITY_NAME = 'Decision Intel';

/**
 * Jurisdiction of incorporation — the controlling-law shorthand a GC
 * looks for first. TODO(founder): replace placeholder with actual
 * jurisdiction once the entity is established.
 */
export const JURISDICTION = 'United Kingdom (formation pending)';

/**
 * Registered office address. TODO(founder): replace with the actual
 * registered office once the entity is established. Until then, the
 * placeholder is honest about the pre-incorporation state — better than
 * a fabricated address.
 */
export const REGISTERED_OFFICE_LINES: string[] = [
  'Address to be confirmed on incorporation',
  'Founder is currently UK-resident; legal entity formation in progress.',
];

export const FOUNDED_YEAR = '2024';

/**
 * Stage descriptor — used on /about and the /privacy controller block.
 * Accurate, enterprise-voiced, no startup apology.
 */
export const COMPANY_STAGE = 'Design-partner phase';

/**
 * Founder display name + title — used on /about. TODO(founder):
 * confirm spelling and title preference before launch.
 */
export const FOUNDER_NAME = 'Folahan Williams';
export const FOUNDER_TITLE = 'Founder';

/**
 * Procurement contact — the email address a Fortune 500 vendor-risk
 * team should write to with diligence questions. Currently the
 * shared inbox; can split if volume requires.
 */
export const PROCUREMENT_CONTACT_EMAIL = 'team@decision-intel.com';
export const SECURITY_CONTACT_EMAIL = 'security@decision-intel.com';
export const PRIVACY_CONTACT_EMAIL = 'team@decision-intel.com';

/**
 * Compliance / Data Protection contact — the named counterparty a Fortune
 * 500 GC or audit-committee chair looks for when executing a DPA, raising
 * a sub-processor objection, or routing a GDPR Art 22 contestation.
 *
 * Margaret persona finding (2026-04-30): /about lists a procurement email
 * but no NAMED individual responsible for compliance. F500 GCs need a
 * counterparty before signing.
 *
 * Until the team scales beyond the founder, the founder IS the compliance
 * counterparty. That's honest and procurement-grade — a 24h response SLA
 * from the CEO is stronger than a generic inbox.
 *
 * TODO(founder): when a dedicated DPO / Head of Compliance is hired,
 * update COMPLIANCE_CONTACT_NAME + COMPLIANCE_CONTACT_TITLE here; every
 * surface (/about, /privacy, ToS sub-processor block) picks up the change.
 */
export const COMPLIANCE_CONTACT_NAME = FOUNDER_NAME;
export const COMPLIANCE_CONTACT_TITLE = `${FOUNDER_TITLE} & CEO`;
export const COMPLIANCE_CONTACT_EMAIL = 'compliance@decision-intel.com';
export const COMPLIANCE_RESPONSE_SLA = '24-hour acknowledgement, 5-business-day substantive response';

/**
 * Short founder narrative — surfaces on /about and (compressed) on the
 * landing-page credibility strip if needed. Lagos-anchored per
 * CLAUDE.md "Lead the story with Lagos/Nigeria — it's the narrative
 * edge."
 */
export const FOUNDER_NARRATIVE_SHORT =
  'Born in the United States, raised between Lagos and the United Kingdom, currently UK-resident. Building Decision Intel from the European market with Pan-African market literacy as a substrate, not a footnote.';

/**
 * Design-Partner Program seat counts (locked 2026-04-26 P1 #31 —
 * Elena persona caught the 4-vs-5 drift). The program offers
 * `DESIGN_PARTNER_SEATS_TOTAL` total seats (year-1 capped); when one
 * fills, decrement `DESIGN_PARTNER_SEATS_AVAILABLE` here and every
 * surface picks up the change. Surfaces consuming these constants:
 *   - src/app/(marketing)/page.tsx (final CTA strip)
 *   - src/app/(marketing)/pricing/PricingPageClient.tsx (design-partner block)
 *   - src/app/(marketing)/design-partner/DesignPartnerClient.tsx (header chip)
 *   - src/app/(marketing)/design-partner/page.tsx (metadata)
 *   - src/components/marketing/MarketingNav.tsx (mega-menu featured)
 *   - src/components/marketing/BookDemoCTA.tsx (rotating chip)
 */
export const DESIGN_PARTNER_SEATS_TOTAL = 5;
export const DESIGN_PARTNER_SEATS_AVAILABLE = 4;
