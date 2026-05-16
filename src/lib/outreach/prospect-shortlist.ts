/**
 * Prospect shortlist — turns the nightly Outreach Intelligence Brief
 * into persona-matched outreach suggestions, each anchored on a PUBLIC
 * famous case from the 143-case library.
 *
 * The ego-threat lock made structural: the case anchor is ALWAYS drawn
 * from the injected `cases` array (ALL_CASES — the public library).
 * There is no prospect-deal input to this module, so it is physically
 * incapable of anchoring on the prospect's own decision. The 1-pager
 * generator (Phase C) consumes these anchors; keeping the constraint
 * in the data flow — not just the prompt — is the point.
 *
 * Discipline (mirrors intel-brief.ts / M-7 / M-3): every function here
 * is PURE + deterministic + unit-tested. No I/O, no LLM, no Prisma.
 * The cron injects ALL_CASES + WEDGE_PERSONAS + DM_TEMPLATES; the read
 * route + panel just render the result.
 */

import type { CaseStudy, Industry as CaseIndustry } from '@/lib/data/case-studies/types';
import { isFailureOutcome } from '@/lib/data/case-studies/types';
import type { WedgePersona, WedgePersonaId, DmTemplate } from '@/lib/data/event-prep';
import type { OutreachIntelItem } from './intel-brief';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OutreachShortlistEntry {
  personaId: WedgePersonaId;
  personaLabel: string;
  /** The intel item's sector label (display). */
  sector: string;
  /** The corp-dev / M&A event that triggered this suggestion. */
  intelHeadline: string;
  intelWhyItMatters: string;
  /** Deal-pattern-level lens, never an accusation. */
  biasAngle: string;
  /** PUBLIC famous case in the persona's industry — never the prospect's own deal. */
  anchorCaseTitle: string;
  anchorCaseCompany: string;
  anchorCaseSlug: string;
  anchorCaseBias: string;
  /** Pre-filled DM opener (persona template, intel reference substituted). */
  dmOpener: string;
}

export const MAX_SHORTLIST_ENTRIES = 8;

// ─── Pure: sector → case-library Industry ────────────────────────────────────

const SECTOR_SYNONYMS: Record<string, CaseIndustry> = {
  technology: 'technology',
  tech: 'technology',
  software: 'technology',
  saas: 'technology',
  ai: 'technology',
  'artificial intelligence': 'technology',
  internet: 'technology',
  semiconductors: 'technology',
  'financial services': 'financial_services',
  financial: 'financial_services',
  finance: 'financial_services',
  fintech: 'financial_services',
  banking: 'financial_services',
  bank: 'financial_services',
  insurance: 'financial_services',
  'asset management': 'financial_services',
  'private equity': 'financial_services',
  healthcare: 'healthcare',
  health: 'healthcare',
  biotech: 'healthcare',
  pharma: 'healthcare',
  pharmaceutical: 'healthcare',
  'life sciences': 'healthcare',
  'medical devices': 'healthcare',
  energy: 'energy',
  oil: 'energy',
  'oil & gas': 'energy',
  'oil and gas': 'energy',
  utilities: 'energy',
  power: 'energy',
  renewables: 'energy',
  automotive: 'automotive',
  auto: 'automotive',
  mobility: 'automotive',
  retail: 'retail',
  consumer: 'retail',
  'consumer goods': 'retail',
  ecommerce: 'retail',
  'e-commerce': 'retail',
  cpg: 'retail',
  aerospace: 'aerospace',
  defense: 'aerospace',
  defence: 'aerospace',
  government: 'government',
  'public sector': 'government',
  entertainment: 'entertainment',
  gaming: 'entertainment',
  media: 'media',
  'media & entertainment': 'media',
  streaming: 'media',
  publishing: 'media',
  'real estate': 'real_estate',
  realestate: 'real_estate',
  property: 'real_estate',
  proptech: 'real_estate',
  telecommunications: 'telecommunications',
  telecom: 'telecommunications',
  telco: 'telecommunications',
  manufacturing: 'manufacturing',
  industrial: 'manufacturing',
  industrials: 'manufacturing',
};

/**
 * Map the brief's free-text sector label to a case-library Industry.
 * Exact key match first, then substring (so "Financial Services &
 * Insurance" still resolves). Returns null when there is no confident
 * mapping — the entry is then skipped rather than mis-anchored.
 */
export function normalizeSectorToIndustry(sector: string): CaseIndustry | null {
  const s = sector.trim().toLowerCase();
  if (!s) return null;
  if (SECTOR_SYNONYMS[s]) return SECTOR_SYNONYMS[s];
  for (const [key, industry] of Object.entries(SECTOR_SYNONYMS)) {
    if (s.includes(key)) return industry;
  }
  return null;
}

// ─── Pure: anchor-case selection ─────────────────────────────────────────────

/**
 * Pick the public anchor case for an industry: prefer failure-class
 * outcomes (the "the bias that killed X" hook lands harder), then
 * highest impactScore, deterministic tiebreak by company. Only ever
 * returns a case from the injected library.
 */
export function pickAnchorCase(industry: CaseIndustry, cases: CaseStudy[]): CaseStudy | null {
  const inIndustry = cases.filter(c => c.industry === industry);
  if (inIndustry.length === 0) return null;
  const failures = inIndustry.filter(c => isFailureOutcome(c.outcome));
  const pool = failures.length > 0 ? failures : inIndustry;
  return [...pool].sort((a, b) => {
    if (b.impactScore !== a.impactScore) return b.impactScore - a.impactScore;
    return a.company.localeCompare(b.company);
  })[0];
}

// ─── Pure: persona match ─────────────────────────────────────────────────────

/**
 * First WEDGE_PERSONA (in array order — fractional_cso is broadest)
 * whose industries include the resolved industry. Array order is the
 * deterministic priority; null when no persona covers the industry.
 */
export function matchPersona(
  industry: CaseIndustry,
  personas: WedgePersona[]
): WedgePersona | null {
  return personas.find(p => (p.industries as string[]).includes(industry)) ?? null;
}

// ─── Pure: opener prefill ────────────────────────────────────────────────────

/**
 * Substitute the intel reference into the persona DM opener's
 * deal/topic placeholders. Leaves {name} + {introducer} + {date} for
 * the founder to fill at send time (human-in-loop). Never invents a
 * name or company.
 */
export function prefillOpener(opener: string, intelHeadline: string): string {
  const ref = intelHeadline.replace(/["“”]/g, '').trim();
  return opener
    .replace(/\{recent-deal-or-thread\}/g, ref)
    .replace(/\{recent-LP-letter or deal-thread\}/g, ref)
    .replace(/\{topic\}/g, ref);
}

// ─── Pure: shortlist assembly ────────────────────────────────────────────────

/**
 * One suggestion per intel item: resolve sector → industry → matched
 * persona → public anchor case → pre-filled opener. Items that don't
 * resolve to all four are SKIPPED (never mis-anchored). Deduped by
 * (personaId + anchorCaseSlug) so the founder doesn't see the same
 * persona/case pairing repeated, capped at MAX_SHORTLIST_ENTRIES.
 */
export function buildProspectShortlist(
  items: OutreachIntelItem[],
  cases: CaseStudy[],
  personas: WedgePersona[],
  dmTemplates: DmTemplate[],
  slugFor: (c: CaseStudy) => string
): OutreachShortlistEntry[] {
  const out: OutreachShortlistEntry[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (out.length >= MAX_SHORTLIST_ENTRIES) break;
    const industry = normalizeSectorToIndustry(item.sector);
    if (!industry) continue;
    const persona = matchPersona(industry, personas);
    if (!persona) continue;
    const anchor = pickAnchorCase(industry, cases);
    if (!anchor) continue;

    const dedupeKey = `${persona.id}::${slugFor(anchor)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const template = dmTemplates.find(t => t.personaId === persona.id);
    const opener = template ? prefillOpener(template.opener, item.headline) : '';

    out.push({
      personaId: persona.id,
      personaLabel: persona.label,
      sector: item.sector,
      intelHeadline: item.headline,
      intelWhyItMatters: item.whyItMatters,
      biasAngle: item.biasAngle,
      anchorCaseTitle: anchor.title,
      anchorCaseCompany: anchor.company,
      anchorCaseSlug: slugFor(anchor),
      anchorCaseBias: anchor.primaryBias,
      dmOpener: opener,
    });
  }

  return out;
}
