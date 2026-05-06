/**
 * Client-Safe Scrub — shared text-redaction helper for the DPR.
 *
 * The DPR has two parallel rendering paths:
 *
 *   1. Legacy jsPDF generator at decision-provenance-record-generator.ts
 *      — applies clientSafe scrubbing to meta strip + summary + reviewer
 *      notes via applyClientSafeScrub().
 *   2. McKinsey-grade HTML/CSS DPR at /dpr-render/[type]/[id] — needs the
 *      same scrubbing on per-bias evidence quotes inside finding cards
 *      (the gap CLAUDE.md flagged at the DPR architecture lock).
 *
 * Both paths now share the regex patterns + denylist + masking logic
 * defined here. The legacy generator continues to track per-document
 * mask counts via its own closure-scoped accumulators (so the existing
 * { entitiesMasked, amountsMasked, namesMasked } telemetry stays
 * intact); the McKinsey-grade renderer uses the lower-level
 * `scrubClientSafe(text)` for stateless per-string scrubbing on the
 * server side at render time.
 *
 * Patterns are deliberately mirrored — never edit one without the
 * other. The denylist is the canonical list of phrases that look like
 * person-names but are actually category nouns (e.g. "Audit Committee",
 * "Reserve Bank", "Basel III") and must NOT be masked.
 */

export const CS_ENTITY_RE =
  /\b((?:[A-Z][A-Za-z0-9&'.-]+(?:\s+(?:&\s+|of\s+|the\s+)?)?){1,5}),?\s+(?:Inc|LLC|L\.L\.C\.|Ltd|Limited|GmbH|Pty|Plc|PLC|AG|SA|N\.V\.|NV|Corp|Corporation|Co\.|Company|S\.A\.|S\.A\.R\.L|S\.r\.l|S\.p\.A|BV|B\.V\.|AB|AS|ApS|Oy|S\.L\.|S\.L|Pvt|Pvt\.|Holdings|Group|Trust|Fund|Capital|Partners|Ventures|Bank|Limited\.)(?=[\s.,;:!?\]\)\}'"]|$)/g;

export const CS_AMOUNT_RE =
  /(?:[$£€₦¥]|USD|GBP|EUR|NGN|JPY)\s?\d+(?:[.,]\d+)?\s?(?:million|billion|trillion|m|bn?|tn?|k)\b|(?:[$£€₦¥]|USD|GBP|EUR|NGN|JPY)\s?\d{1,3}(?:,\d{3}){2,}(?:\.\d+)?|\b\d+(?:[.,]\d+)?\s?(?:million|billion|trillion)\b/gi;

export const CS_NAME_RE = /\b([A-Z][a-z]{1,15})\s+([A-Z][a-z]{1,20})\b/g;

export const CS_NAME_DENYLIST = new Set(
  [
    'Decision Intel',
    'Decision Quality',
    'Bias Genome',
    'Recognition Rigor',
    'European Union',
    'United Kingdom',
    'United States',
    'South Africa',
    'New York',
    'San Francisco',
    'Cape Town',
    'Annual Report',
    'Board Members',
    'Audit Committee',
    'Steering Committee',
    'Investment Committee',
    'EU AI',
    'UK White',
    'SEC Reg',
    'Basel III',
    'Reserve Bank',
    'Central Bank',
    'National Bank',
    'General Partner',
    'Limited Partner',
  ].map(s => s.toLowerCase()),
);

export interface ScrubCounters {
  entities: number;
  amounts: number;
  names: number;
}

/**
 * Scrub a single string with the client-safe patterns. Optional
 * `counters` object accumulates running totals across multiple calls
 * (the legacy generator uses this to populate the DPR's clientSafe
 * telemetry block). For one-shot calls (per-evidence-quote scrubbing
 * in finding cards) the counters parameter can be omitted.
 *
 * Order matters: entities first (longer matches), then amounts, then
 * person-names — so the person-name regex doesn't cannibalise the
 * entity tail (e.g. "Acme Holdings" should mask as ENTITY, not as a
 * stray NAME on "Acme Holdings").
 */
export function scrubClientSafe(text: string, counters?: ScrubCounters): string {
  if (!text) return text ?? '';
  let out = text;

  let eIdx = counters?.entities ?? 0;
  out = out.replace(CS_ENTITY_RE, () => {
    eIdx += 1;
    return `[ENTITY_${eIdx}]`;
  });
  if (counters) counters.entities = eIdx;

  let aIdx = counters?.amounts ?? 0;
  out = out.replace(CS_AMOUNT_RE, () => {
    aIdx += 1;
    return `[AMOUNT_${aIdx}]`;
  });
  if (counters) counters.amounts = aIdx;

  let nIdx = counters?.names ?? 0;
  out = out.replace(CS_NAME_RE, (m, first: string, last: string) => {
    const key = `${first} ${last}`.toLowerCase();
    if (CS_NAME_DENYLIST.has(key)) return m;
    nIdx += 1;
    return `[NAME_${nIdx}]`;
  });
  if (counters) counters.names = nIdx;

  return out;
}
