/**
 * Target Research — pure-function workbench helpers for pre-event prep.
 *
 * Shipped 2026-05-27 for Strategy World London (BAFTA, June 9-10, T-13d).
 * Operationalises the T-2w to T-1w prep-arc actions named in
 * src/lib/data/event-prep.ts ACTION_CADENCE.prepArc:
 *   - "Pull the published attendee list. Filter to the 4 wedge personas."
 *   - "Match each name to industry → canonical bias hook from 143-case library."
 *   - "Send first wave of 10 DMs (highest-priority names)."
 *
 * Architecture:
 *   1. classifyByRole — role-string heuristic → wedge persona id
 *   2. pickBiasHook   — persona + optional industry → canonical bias hook
 *      from the persona's own canonicalBiasHooks (per event-prep SSOT)
 *   3. generateOpener — DM template + persona's hook + prospect name →
 *      ready-to-edit opener string
 *   4. researchProspect — composes 1+2+3 in one call for the workbench
 *      so the UI just maps over parsed input → ResearchedProspect[]
 *
 * All helpers are PURE — no I/O, no LLM, deterministic. The classifier is
 * keyword-based by design so the founder can sanity-check why a given
 * row was tagged as persona X.
 *
 * Honesty: when the role doesn't match any wedge pattern, we tag 'other'
 * and skip the opener generation rather than fabricate one. The
 * workbench surfaces 'other' rows as flagged for manual review — they're
 * not ledger candidates without explicit persona override.
 */

import { WEDGE_PERSONAS, DM_TEMPLATES } from '@/lib/data/event-prep';
import type { WedgePersonaId, BiasHook } from '@/lib/data/event-prep';

export type PersonaIdOrOther = WedgePersonaId | 'other';

/** Result of classifying one attendee. */
export interface ResearchedProspect {
  /** Original name (trimmed). */
  name: string;
  /** Original company string, or null if not provided. */
  company: string | null;
  /** Original title/role string, or null if not provided. */
  title: string | null;
  /** Matched wedge persona, or 'other' if no pattern fits. */
  persona: PersonaIdOrOther;
  /** Plain-language explanation of why this persona was picked. */
  personaReason: string;
  /** Picked canonical bias hook from the persona's library; null for 'other'. */
  biasHook: BiasHook | null;
  /** Pre-drafted DM opener with {name} substituted; null for 'other'. */
  opener: string | null;
  /** Generic-fallback substitutions remaining in the opener (e.g.
   *  `{recent-deal-or-thread}`) so the founder can see what still needs
   *  editing per-prospect before sending. */
  pendingSubstitutions: string[];
}

// ─── 1. Role classifier ────────────────────────────────────────────────

/** Keyword patterns per persona. Order matters — first match wins, so
 *  more-specific patterns must come before generic ones. */
const ROLE_PATTERNS: Array<{
  persona: WedgePersonaId;
  matches: RegExp;
  why: string;
}> = [
  {
    persona: 'midmarket_corp_dev',
    matches:
      /\b(corp(orate)?\s*dev(elopment)?|(director|head|vp|svp|lead)[\s,]+(of\s+)?m\s*&?\s*a|m\s*&?\s*a[\s,]+(lead|head|director)|vp[\s,]+m\s*&?\s*a|svp[\s,]+(corp|m\s*&?\s*a))\b/i,
    why: 'Role names a corp-dev or M&A function — the canonical mid-market head buyer.',
  },
  {
    persona: 'fractional_cso',
    matches:
      /\b(fractional\s+(cso|cstrategy|cmo|chief)|fractional\s+(chief\s+)?strategy|strategy\s+(consultant|advisor|fractional)|independent\s+(strategy|cso))\b/i,
    why: 'Role names a fractional / consultant strategy role — multi-client memo cadence.',
  },
  {
    persona: 'smaller_fund_gp',
    matches:
      /\b(general\s+partner|gp\b|managing\s+partner|founding\s+partner|principal\s+at|partner\s+at\s+\w+\s+(capital|ventures|fund|partners)|portfolio\s+partner)\b/i,
    why: 'Role names a fund partner / GP / principal — IC-memo cadence with LP scrutiny.',
  },
  {
    persona: 'pe_backed_founder',
    matches:
      /\b(ceo|chief\s+executive|founder\s*&?\s*(ceo|coo)|managing\s+director|chief\s+operating)\b/i,
    why: 'Role names a CEO / founder / MD — likely PE-backed mid-market operating cadence.',
  },
  // Catch-all for chief-strategy-officer at established companies (typically
  // F500 ceiling, not Phase 1 wedge — but still close enough to fractional_cso
  // for opener purposes; the founder can re-classify manually.
  {
    persona: 'fractional_cso',
    matches:
      /\b(chief\s+strategy\s+officer|cso\b|head\s+of\s+strategic\s+planning|svp\s+strategy|vp\s+strategy)\b/i,
    why: 'Role names a CSO / strategy head — closest persona match is fractional_cso (the same memo-cadence template fits).',
  },
];

/** Company-name patterns that bias toward a persona. Applied AFTER the
 *  role classifier as a tiebreaker / fallback (e.g. role missing). */
const COMPANY_PATTERNS: Array<{
  persona: WedgePersonaId;
  matches: RegExp;
  why: string;
}> = [
  {
    persona: 'smaller_fund_gp',
    matches: /\b(capital|ventures|partners|fund|management|holdings)\b/i,
    why: 'Company name reads as a fund / capital allocator.',
  },
];

/**
 * Classify a single attendee by role (primary) + company (fallback).
 * Returns 'other' when no pattern fits.
 */
export function classifyByRole(
  role: string | null | undefined,
  company?: string | null | undefined
): { persona: PersonaIdOrOther; why: string } {
  const roleStr = (role ?? '').trim();
  const companyStr = (company ?? '').trim();

  if (roleStr.length > 0) {
    for (const p of ROLE_PATTERNS) {
      if (p.matches.test(roleStr)) {
        return { persona: p.persona, why: p.why };
      }
    }
  }

  if (companyStr.length > 0) {
    for (const p of COMPANY_PATTERNS) {
      if (p.matches.test(companyStr)) {
        return {
          persona: p.persona,
          why: `${p.why} Role string did not match a wedge pattern; classified by company.`,
        };
      }
    }
  }

  return {
    persona: 'other',
    why:
      roleStr.length > 0 || companyStr.length > 0
        ? 'Role / company did not match any of the 4 wedge personas. Flag for manual review.'
        : 'No role or company provided. Add one to enable classification.',
  };
}

// ─── 2. Bias-hook picker ────────────────────────────────────────────────

/**
 * Pick a canonical bias hook for a persona. Picks the first hook in the
 * persona's `canonicalBiasHooks` list (which is ordered by the SSOT's
 * implicit ranking). Returns null if the persona has no hooks (the
 * 'other' branch).
 *
 * Industry parameter is reserved for future ranking refinement — today
 * we use the first hook because the wedge personas already have an
 * industry-balanced 3-hook list each.
 */
export function pickBiasHook(
  personaId: PersonaIdOrOther,
  _industryHint?: string | null
): BiasHook | null {
  if (personaId === 'other') return null;
  const persona = WEDGE_PERSONAS.find(p => p.id === personaId);
  if (!persona || persona.canonicalBiasHooks.length === 0) return null;
  return persona.canonicalBiasHooks[0]!;
}

// ─── 3. Opener generator ────────────────────────────────────────────────

/** Find unsubstituted {placeholder} tokens in a template string. */
function findPendingSubstitutions(text: string): string[] {
  const matches = text.match(/\{[^}]+\}/g);
  if (!matches) return [];
  // Dedup + return without braces for cleaner UI display.
  return Array.from(new Set(matches)).map(m => m.slice(1, -1));
}

/**
 * Generate a DM opener for a researched prospect.
 *
 * Substitutes:
 *   {name} → prospect first name (if name has a space) or whole name
 *
 * Leaves these tokens for the founder to edit per-prospect:
 *   {topic} {recent-deal-or-thread} {recent-LP-letter or deal-thread}
 *   {recent-quarterly-or-news}
 *
 * Returns null when no template exists for the persona ('other').
 */
export function generateOpener(
  personaId: PersonaIdOrOther,
  name: string
): { text: string; pendingSubstitutions: string[] } | null {
  if (personaId === 'other') return null;
  const template = DM_TEMPLATES.find(t => t.personaId === personaId);
  if (!template) return null;

  const firstName = name.trim().split(/\s+/)[0] || name.trim();
  const text = template.opener.replace(/\{name\}/g, firstName);
  return {
    text,
    pendingSubstitutions: findPendingSubstitutions(text),
  };
}

// ─── 4. Composed entry point ────────────────────────────────────────────

export interface ResearchInput {
  name: string;
  company?: string | null;
  title?: string | null;
}

/** Compose classify + pick + generate into one call. The workbench
 *  maps over parsed input → ResearchedProspect[]. */
export function researchProspect(input: ResearchInput): ResearchedProspect {
  const name = input.name.trim();
  const company = input.company?.trim() || null;
  const title = input.title?.trim() || null;

  const { persona, why } = classifyByRole(title, company);
  const biasHook = pickBiasHook(persona);
  const opener = generateOpener(persona, name);

  return {
    name,
    company,
    title,
    persona,
    personaReason: why,
    biasHook,
    opener: opener?.text ?? null,
    pendingSubstitutions: opener?.pendingSubstitutions ?? [],
  };
}

// ─── 5. Input parser ────────────────────────────────────────────────────

/**
 * Parse a multi-line attendee paste into ResearchInput[].
 *
 * Accepted line shapes (in order of preference — first parse that fits
 * is used):
 *   "Name, Title, Company"
 *   "Name | Title | Company"
 *   "Name - Title at Company"
 *   "Name (Title, Company)"
 *   "Name — Company"  (no title — common LinkedIn export shape)
 *   "Name"             (bare name — title/company empty)
 *
 * Blank lines and lines starting with # are skipped.
 */
export function parseAttendeeInput(raw: string): ResearchInput[] {
  const lines = raw.split(/\r?\n/);
  const out: ResearchInput[] = [];

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (line.length === 0 || line.startsWith('#')) continue;

    // 1. "Name (Title, Company)" — check FIRST since this format has a
    // comma INSIDE the parens (would otherwise be mis-parsed by the
    // comma-separated branch).
    const parenMatch = line.match(/^(.+?)\s*\(([^,]+),\s*(.+?)\)$/);
    if (parenMatch) {
      out.push({
        name: parenMatch[1]!.trim(),
        title: parenMatch[2]!.trim(),
        company: parenMatch[3]!.trim(),
      });
      continue;
    }

    // 2. "Name - Title at Company" or "Name — Title at Company"
    const dashAtMatch = line.match(/^(.+?)\s+[-—]\s+(.+?)\s+at\s+(.+)$/i);
    if (dashAtMatch) {
      out.push({
        name: dashAtMatch[1]!.trim(),
        title: dashAtMatch[2]!.trim(),
        company: dashAtMatch[3]!.trim(),
      });
      continue;
    }

    // 3. Comma-separated
    if (line.includes(',')) {
      const [name, title, company] = line.split(',').map(s => s.trim());
      if (name && name.length >= 2) {
        out.push({ name, title: title || null, company: company || null });
        continue;
      }
    }

    // 4. Pipe-separated
    if (line.includes('|')) {
      const [name, title, company] = line.split('|').map(s => s.trim());
      if (name && name.length >= 2) {
        out.push({ name, title: title || null, company: company || null });
        continue;
      }
    }

    // 5. "Name — Company" (LinkedIn-export shape without role)
    const dashCompanyMatch = line.match(/^(.+?)\s+[-—]\s+(.+)$/);
    if (dashCompanyMatch) {
      out.push({
        name: dashCompanyMatch[1]!.trim(),
        title: null,
        company: dashCompanyMatch[2]!.trim(),
      });
      continue;
    }

    // 6. Bare name
    if (line.length >= 2) {
      out.push({ name: line, title: null, company: null });
    }
  }

  return out;
}

// ─── 6. Summary helper for the prep brief ───────────────────────────────

export interface ResearchSummary {
  total: number;
  byPersona: Record<PersonaIdOrOther, number>;
  ready: number; // count with a valid opener (persona !== 'other')
  needsReview: number; // count tagged 'other'
}

export function summarizeResearch(researched: ResearchedProspect[]): ResearchSummary {
  const byPersona: Record<PersonaIdOrOther, number> = {
    fractional_cso: 0,
    midmarket_corp_dev: 0,
    smaller_fund_gp: 0,
    pe_backed_founder: 0,
    other: 0,
  };
  for (const r of researched) {
    byPersona[r.persona] += 1;
  }
  return {
    total: researched.length,
    byPersona,
    ready: researched.length - byPersona.other,
    needsReview: byPersona.other,
  };
}
