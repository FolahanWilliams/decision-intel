/**
 * Display-layer label helpers.
 *
 * The Decision Intel pipeline stores biases, industries, outcomes, toxic
 * combinations, and document types as `snake_case` keys so they round-trip
 * through the LLM, Prisma, aggregation queries, and URL params without
 * ambiguity. Raw snake_case leaks in the UI, though, are ugly and
 * unprofessional ("confirmation_bias" instead of "Confirmation Bias").
 *
 * This module centralizes every "snake_case key → user-visible label"
 * transformation so we have a single place to tune wording, preserve
 * acronyms, and handle known alias maps. It is a strict superset of the
 * existing `getBiasDisplayName` in `./bias-normalize`, which remains the
 * authoritative source for bias display names — this module just wraps
 * its fallback branch so unknown biases still render as Title Case.
 */

import { getBiasDisplayName } from './bias-normalize';

/**
 * Acronyms that should stay uppercase in labels. Keyed by lowercase form.
 * Add sparingly — overrides lose their value if the list bloats.
 */
const ACRONYMS: Record<string, string> = {
  sec: 'SEC',
  ntsb: 'NTSB',
  fda: 'FDA',
  fca: 'FCA',
  sox: 'SOX',
  gdpr: 'GDPR',
  mifid: 'MiFID',
  pe: 'PE',
  vc: 'VC',
  ipo: 'IPO',
  dqi: 'DQI',
  ai: 'AI',
  ml: 'ML',
  api: 'API',
  ceo: 'CEO',
  cfo: 'CFO',
  cto: 'CTO',
  us: 'US',
  uk: 'UK',
  eu: 'EU',
};

/**
 * Convert a raw identifier (`snake_case`, `kebab-case`, or a space-separated
 * phrase) into a Title Case display label. Known acronyms are preserved.
 * Unknown or already-formatted input is returned with sensible casing.
 *
 * Examples:
 *   humanize('confirmation_bias')  → 'Confirmation Bias'
 *   humanize('sec_filing')         → 'SEC Filing'
 *   humanize('real-estate')        → 'Real Estate'
 *   humanize('Already Formatted')  → 'Already Formatted'
 *   humanize('')                   → ''
 */
export function humanize(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .toString()
    .trim()
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const lower = word.toLowerCase();
      if (ACRONYMS[lower]) return ACRONYMS[lower];
      // Keep an apostrophe word like "gambler's" lowercased after the apostrophe.
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Bias display name. Delegates to `getBiasDisplayName` (which consults the
 * canonical `BIAS_CATEGORIES` catalog); on an unknown-key miss, chains
 * through `humanize` so LLM-emitted novelties still render as Title Case
 * instead of leaking raw snake_case to the user.
 */
export function formatBiasName(raw: string | null | undefined): string {
  if (!raw) return '';
  const display = getBiasDisplayName(raw);
  // getBiasDisplayName returns the original input when no catalog entry
  // matches. Detect that branch by presence of underscores / lowercase-only
  // tokens and humanize instead.
  if (display === raw && /[_-]|^[a-z]/.test(display)) {
    return humanize(display);
  }
  return display;
}

/**
 * Toxic combination labels. These are stored as short snake_case handles
 * from the toxic-combinations catalog. A small alias map handles the cases
 * where we want a specific branded name (e.g. "Echo Chamber").
 */
const TOXIC_COMBINATION_ALIASES: Record<string, string> = {
  echo_chamber: 'Echo Chamber',
  sunk_ship: 'Sunk Ship',
  hindsight_trap: 'Hindsight Trap',
  anchor_drift: 'Anchor Drift',
  authority_cascade: 'Authority Cascade',
  groupthink_spiral: 'Groupthink Spiral',
  narrative_lock: 'Narrative Lock',
  planning_blind_spot: 'Planning Blind Spot',
  confirmation_loop: 'Confirmation Loop',
  overconfidence_feedback: 'Overconfidence Feedback',
};

export function formatToxicCombination(raw: string | null | undefined): string {
  if (!raw) return '';
  const key = raw.toString().toLowerCase().trim().replace(/\s+/g, '_');
  return TOXIC_COMBINATION_ALIASES[key] ?? humanize(raw);
}

/**
 * Industry label. Matches the `Industry` union in the case-studies type
 * system plus any ad-hoc sector strings from the deal pipeline.
 */
export function formatIndustry(raw: string | null | undefined): string {
  return humanize(raw);
}

/**
 * Outcome label. Handles the `CaseOutcome` union
 * (`catastrophic_failure`, `partial_success`, etc.).
 */
export function formatOutcome(raw: string | null | undefined): string {
  return humanize(raw);
}

/**
 * Document type label (e.g. `board_memo`, `earnings_call`).
 */
export function formatDocumentType(raw: string | null | undefined): string {
  return humanize(raw);
}
