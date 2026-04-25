/**
 * Pre-submit redaction scanner for paste flows (3.2).
 *
 * Pure client-side, no LLM call. Surfaces likely-PII tokens BEFORE the
 * memo enters the pipeline so an enterprise paster (CSO, M&A counsel,
 * Sankore-style buyer) can opt to scrub identifying material in one
 * click. Without this, the procurement objection is "I'm not pasting
 * a real CIM into your tool until I know what you do with the names."
 *
 * What it catches:
 *   1. Emails               — RFC-ish pattern, ASCII-conservative
 *   2. Phone numbers        — US/UK/EU/Nigerian common shapes
 *   3. SSN / UK NI numbers  — XXX-XX-XXXX  +  AB123456C
 *   4. Financial totals ≥1M — $50M, $1.2 billion, ₦120B, £5,000,000
 *   5. Company entity names — anything ending in Ltd/Inc/LLC/GmbH/Pty/
 *                              Plc/AG/SA/NV/Corp/etc., plus the standard
 *                              "[CapitalisedWord]+ Inc." style.
 *   6. Person names         — heuristic only: capitalised first-last
 *                              pairs that aren't sentence starters or
 *                              known corporate / geographic terms.
 *
 * Person names are the noisiest category — false positives are
 * unavoidable without an NER model — so the modal lets the user
 * deselect any false hit before redacting.
 *
 * The scanner is intentionally NOT 100% precise. Missing a name is
 * better than a heavyweight ML pipeline that ships in the bundle.
 * This is a pre-submit safety net, not a compliance filter.
 */

export type RedactionCategory = 'email' | 'phone' | 'ssn' | 'amount' | 'entity' | 'name';

export interface RedactionHit {
  category: RedactionCategory;
  value: string;
  /** Index into the original text where this hit starts. */
  start: number;
  end: number;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Phone — accepts US (+1 (415) 555-0100), UK (+44 20 7946 0958), EU,
// Nigerian (+234 803 123 4567). Loose: 7+ digits with optional country
// code, spaces, dashes, dots, or parens. Avoids matching plain numeric
// strings (years, financial figures) by requiring at least one phone-y
// separator OR a leading +.
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3,4}[\s.-]\d{3,4}(?:[\s.-]\d{3,4})?/g;

// US SSN  XXX-XX-XXXX  + UK NI number  AB123456C
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b|\b[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b/g;

// Financial totals ≥ £/$/€/₦/¥ 1,000,000. Either a magnitude letter
// (M/B/T) or seven-plus digits with grouping commas.
const AMOUNT_RE =
  /(?:[$£€₦¥]|USD|GBP|EUR|NGN|JPY)\s?\d+(?:[.,]\d+)?\s?(?:million|billion|trillion|m|bn?|tn?|k)\b|(?:[$£€₦¥]|USD|GBP|EUR|NGN|JPY)\s?\d{1,3}(?:,\d{3}){2,}(?:\.\d+)?|\b\d+(?:[.,]\d+)?\s?(?:million|billion|trillion)\b/gi;

// Company entity suffixes — once we see one we capture the prior 1-5
// capitalised words as the company name. ", Inc" pattern is the most
// frequent in actual decks, hence allow optional comma.
const ENTITY_RE =
  /\b((?:[A-Z][A-Za-z0-9&'’.-]+(?:\s+(?:&\s+|of\s+|the\s+)?)?){1,5}),?\s+(?:Inc|LLC|L\.L\.C\.|Ltd|Limited|GmbH|Pty|Plc|PLC|AG|SA|N\.V\.|NV|Corp|Corporation|Co\.|Company|S\.A\.|S\.A\.R\.L|S\.r\.l|S\.p\.A|BV|B\.V\.|AB|AS|ApS|Oy|S\.L\.|S\.L|Pvt|Pvt\.|Holdings|Group|Trust|Fund|Capital|Partners|Ventures|Bank|PLC\.|Limited\.)(?=[\s.,;:!?\]\)\}'\"]|$)/g;

// Person-name heuristic: two consecutive Capitalised words, neither a
// known stop word, neither immediately preceded by a sentence-starter
// boundary that would make it a normal phrase. We post-filter against
// a deny-list of capitalised non-name terms (common geographies, common
// corporate words, days/months).
const NAME_RE = /\b([A-Z][a-z]{1,15})\s+([A-Z][a-z]{1,20})\b/g;

const NAME_DENYLIST = new Set(
  [
    // Days / months
    'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday',
    'January','February','March','April','May','June','July','August','September','October','November','December',
    // Geographies / regions (super common in strategy memos)
    'New York','San Francisco','Hong Kong','Cape Town','Buenos Aires','Tel Aviv',
    'United States','United Kingdom','South Africa','Saudi Arabia','New Zealand',
    'North America','South America','Latin America','East Africa','West Africa',
    'Middle East','South Asia','East Asia','South East','Southeast Asia',
    // Corporate / strategy boilerplate (capitalised)
    'Annual Report','Board Members','Executive Summary','Capital Markets',
    'Private Equity','Public Markets','Free Cash','Cash Flow','Working Capital',
    'Risk Management','Asset Management','Wealth Management','Investment Banking',
    'Investment Strategy','Decision Quality','Decision Intel','Bias Genome',
    'Strategic Plan','Strategic Review','Market Entry','Pre Mortem','Pre Mortem',
    'Growth Strategy','Growth Capital','Working Group','Audit Committee',
    'Steering Committee','Board Members','Board Member','Investment Committee',
    // Common multi-word capitalised non-names found in pasted decks
    'Decision Intel','EU AI','UK White','SEC Reg','Basel III','Reserve Bank',
    'Central Bank','National Bank','Private Placement','Special Situations',
    'Limited Partner','General Partner',
  ].map(s => s.toLowerCase())
);

function inDenylist(first: string, last: string): boolean {
  return NAME_DENYLIST.has(`${first} ${last}`.toLowerCase());
}

function dedupeOverlapping(hits: RedactionHit[]): RedactionHit[] {
  // Sort by start, then by length desc — keep the longest match at any
  // overlap so "Sankore Investments" wins over "Sankore" + "Investments".
  const sorted = [...hits].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - b.start - (a.end - a.start);
  });
  const out: RedactionHit[] = [];
  let cursor = -1;
  for (const h of sorted) {
    if (h.start >= cursor) {
      out.push(h);
      cursor = h.end;
    }
  }
  return out;
}

function collectMatches(
  text: string,
  re: RegExp,
  category: RedactionCategory,
  matchValue: (m: RegExpExecArray) => string = m => m[0]
): RedactionHit[] {
  const out: RedactionHit[] = [];
  let m: RegExpExecArray | null;
  // Reset lastIndex so callers can pass module-level globals safely.
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) {
    const value = matchValue(m).trim();
    if (!value) continue;
    out.push({
      category,
      value,
      start: m.index,
      end: m.index + m[0].length,
    });
    if (m.index === re.lastIndex) re.lastIndex += 1; // safety
  }
  return out;
}

export interface ScanResult {
  hits: RedactionHit[];
  /** Counts grouped by category — drives the modal's "5 names · 3 amounts" line. */
  counts: Record<RedactionCategory, number>;
}

export function scanForPii(text: string): ScanResult {
  if (!text || typeof text !== 'string') {
    return {
      hits: [],
      counts: { email: 0, phone: 0, ssn: 0, amount: 0, entity: 0, name: 0 },
    };
  }

  const all: RedactionHit[] = [
    ...collectMatches(text, EMAIL_RE, 'email'),
    ...collectMatches(text, PHONE_RE, 'phone'),
    ...collectMatches(text, SSN_RE, 'ssn'),
    ...collectMatches(text, AMOUNT_RE, 'amount'),
    ...collectMatches(text, ENTITY_RE, 'entity'),
    ...collectMatches(text, NAME_RE, 'name', m => {
      const [first, last] = [m[1], m[2]];
      if (inDenylist(first, last)) return '';
      return `${first} ${last}`;
    }),
  ].filter(h => h.value.length > 0);

  const hits = dedupeOverlapping(all);

  const counts: Record<RedactionCategory, number> = {
    email: 0,
    phone: 0,
    ssn: 0,
    amount: 0,
    entity: 0,
    name: 0,
  };
  for (const h of hits) counts[h.category] += 1;

  return { hits, counts };
}

const PLACEHOLDER_PREFIX: Record<RedactionCategory, string> = {
  email: 'EMAIL',
  phone: 'PHONE',
  ssn: 'ID',
  amount: 'AMOUNT',
  entity: 'ENTITY',
  name: 'NAME',
};

/**
 * Replace each selected hit with a stable placeholder of the form
 * `[CATEGORY_N]`. Re-uses the same N when the same value occurs more
 * than once so a CSO can still read the structure of the redacted memo.
 *
 * Returns both the new text and a map of placeholder → original value
 * (the caller may want to log this client-side for audit).
 */
export function applyRedactions(
  text: string,
  hitsToRedact: RedactionHit[]
): { redactedText: string; placeholderMap: Record<string, string> } {
  if (hitsToRedact.length === 0) {
    return { redactedText: text, placeholderMap: {} };
  }

  // Sort by start descending so we rewrite from the end and indices stay valid.
  const ordered = [...hitsToRedact].sort((a, b) => b.start - a.start);

  // Stable per-value numbering: the first time we see a given value, assign
  // it the next index in its category; subsequent occurrences get the same.
  const numbering = new Map<string, number>();
  const counters: Record<RedactionCategory, number> = {
    email: 0,
    phone: 0,
    ssn: 0,
    amount: 0,
    entity: 0,
    name: 0,
  };
  const placeholderMap: Record<string, string> = {};

  // Pre-pass to build numbering in document order (start asc) so the
  // numbers feel natural to a reader.
  const inOrder = [...hitsToRedact].sort((a, b) => a.start - b.start);
  for (const h of inOrder) {
    const key = `${h.category}:${h.value.toLowerCase()}`;
    if (numbering.has(key)) continue;
    counters[h.category] += 1;
    numbering.set(key, counters[h.category]);
    const placeholder = `[${PLACEHOLDER_PREFIX[h.category]}_${counters[h.category]}]`;
    placeholderMap[placeholder] = h.value;
  }

  let out = text;
  for (const h of ordered) {
    const key = `${h.category}:${h.value.toLowerCase()}`;
    const n = numbering.get(key) ?? 0;
    const placeholder = `[${PLACEHOLDER_PREFIX[h.category]}_${n}]`;
    out = out.slice(0, h.start) + placeholder + out.slice(h.end);
  }

  return { redactedText: out, placeholderMap };
}

export const REDACTION_CATEGORY_LABEL: Record<RedactionCategory, string> = {
  email: 'Email addresses',
  phone: 'Phone numbers',
  ssn: 'Government IDs',
  amount: 'Financial totals',
  entity: 'Company names',
  name: 'Person names',
};
