/**
 * entityExtractor — pure regex-based entity extraction for the bulk
 * pairing engine. Locked 2026-05-21.
 *
 * Pulls three classes of entities from document content:
 *   - Organizations (capitalized 2+ word sequences ending in
 *     Inc / Ltd / Corp / Capital / Holdings / Partners / Group / Ventures /
 *     Fund / etc.)
 *   - Amounts ($X million / $X billion / X% IRR / X.Xx MOIC)
 *   - Project codenames ("Project X" / "Operation X" — common conventions
 *     in IC memos + retrospectives)
 *
 * Pure function. No LLM. Used by pairBulkDocuments + the bulk-upload
 * endpoint to seed entity-overlap scores.
 *
 * Also infers a document date from filename + first 500 chars of content
 * (very common patterns: "Q3 2018", "2018-09", "September 2018").
 */

import type { UploadedHistoricalDoc } from './types';

const ORG_SUFFIXES = [
  'Inc',
  'Incorporated',
  'Ltd',
  'Limited',
  'LLC',
  'LLP',
  'Corp',
  'Corporation',
  'Capital',
  'Holdings',
  'Partners',
  'Group',
  'Ventures',
  'Fund',
  'Funds',
  'Investments',
  'Management',
  'Advisors',
  'Brothers',
  'Bank',
  'Trust',
  'Estate',
  'Industries',
  'Technologies',
  'Solutions',
  'Resources',
  'Energy',
  'Pharmaceuticals',
];

const ORG_REGEX = new RegExp(
  `\\b([A-Z][A-Za-z'&-]+(?:\\s+[A-Z][A-Za-z'&-]+){0,4}\\s+(?:${ORG_SUFFIXES.join('|')}))\\b`,
  'g'
);

const AMOUNT_REGEXES = [
  /\$\s*[\d.,]+\s*(?:million|billion|m|b|M|B)\b/g, // $50M / $1.2 billion
  /£\s*[\d.,]+\s*(?:million|billion|m|b)\b/gi,
  /€\s*[\d.,]+\s*(?:million|billion|m|b)\b/gi,
  /₦\s*[\d.,]+\s*(?:million|billion|m|b)\b/gi,
  /\b\d+(?:\.\d+)?%\s*(?:irr|moic|return)\b/gi, // 28% IRR
  /\b\d+(?:\.\d+)?x\s+moic\b/gi, // 3.2x MOIC
];

const PROJECT_CODENAME_REGEX =
  /\b(?:Project|Operation|Initiative)\s+([A-Z][A-Za-z0-9-]+)(?:\s+(?:[A-Z][A-Za-z0-9-]+))?/g;

// ──────────────────────────────────────────────────────────────────────
// Date inference
// ──────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const MONTH_INDEX: Record<string, number> = Object.fromEntries(
  MONTH_NAMES.map((m, i) => [m, i + 1])
);

interface DateCandidate {
  iso: string;
  confidence: number;
}

/** Infer a date from the filename + opening content. Returns the
 *  best-confidence candidate or undefined. */
export function inferDocumentDate(filename: string, content: string): string | undefined {
  const candidates: DateCandidate[] = [];
  const haystack = `${filename}\n${content.slice(0, 800)}`;

  // ISO-like YYYY-MM-DD or YYYY-MM or YYYY/MM
  const isoMatches = haystack.matchAll(/\b(20\d{2})[-/](\d{1,2})(?:[-/](\d{1,2}))?\b/g);
  for (const m of isoMatches) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = m[3] ? Number(m[3]) : 1;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
    candidates.push({
      iso: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      confidence: 0.9,
    });
  }

  // "September 2018" / "Sep 2018" / "2018 September"
  const monthYearRegex = new RegExp(`\\b(${MONTH_NAMES.join('|')})\\s+(20\\d{2})\\b`, 'gi');
  const monthYearMatches = haystack.matchAll(monthYearRegex);
  for (const m of monthYearMatches) {
    const mo = MONTH_INDEX[m[1].toLowerCase()];
    const y = Number(m[2]);
    if (!mo || !y) continue;
    candidates.push({
      iso: `${y}-${String(mo).padStart(2, '0')}-01`,
      confidence: 0.75,
    });
  }

  // Q1 2018 / Q3 2020
  const quarterMatches = haystack.matchAll(/\bQ([1-4])\s+(20\d{2})\b/g);
  for (const m of quarterMatches) {
    const q = Number(m[1]);
    const y = Number(m[2]);
    const month = (q - 1) * 3 + 1;
    candidates.push({
      iso: `${y}-${String(month).padStart(2, '0')}-01`,
      confidence: 0.65,
    });
  }

  // Bare year — last resort
  const yearMatches = haystack.matchAll(/\b(20\d{2})\b/g);
  for (const m of yearMatches) {
    const y = Number(m[1]);
    if (y < 2000 || y > 2030) continue;
    candidates.push({
      iso: `${y}-06-01`, // assume mid-year for bare-year mentions
      confidence: 0.3,
    });
  }

  if (candidates.length === 0) return undefined;
  // Return the highest-confidence candidate
  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates[0].iso;
}

// ──────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────

/** Extract organizations, amounts, and project codenames from a
 *  document content. Returns deduped arrays. */
export function extractEntities(content: string): UploadedHistoricalDoc['entities'] {
  const organizations = new Set<string>();
  const amounts = new Set<string>();
  const projectCodenames = new Set<string>();

  const orgMatches = content.matchAll(ORG_REGEX);
  for (const m of orgMatches) {
    organizations.add(m[1].trim());
  }

  for (const re of AMOUNT_REGEXES) {
    const matches = content.matchAll(re);
    for (const m of matches) {
      amounts.add(m[0].trim());
    }
  }

  const codeMatches = content.matchAll(PROJECT_CODENAME_REGEX);
  for (const m of codeMatches) {
    if (m[1]) projectCodenames.add(`Project ${m[1]}`);
  }

  return {
    organizations: Array.from(organizations).slice(0, 30),
    amounts: Array.from(amounts).slice(0, 30),
    projectCodenames: Array.from(projectCodenames).slice(0, 15),
  };
}

// Re-exports for tests
export { ORG_SUFFIXES as ORG_SUFFIXES_EXPORTED };
