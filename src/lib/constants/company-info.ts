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
 * Short founder narrative — surfaces on /about and (compressed) on the
 * landing-page credibility strip if needed. Lagos-anchored per
 * CLAUDE.md "Lead the story with Lagos/Nigeria — it's the narrative
 * edge."
 */
export const FOUNDER_NARRATIVE_SHORT =
  'Born in the United States, raised between Lagos and the United Kingdom, currently UK-resident. Building Decision Intel from the European market with Pan-African market literacy as a substrate, not a footnote.';
