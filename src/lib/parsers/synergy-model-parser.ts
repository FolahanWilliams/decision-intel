/**
 * Synergy Model Parser (locked 2026-05-09, synergy-parser deepening).
 *
 * Detects synergy-model-shaped spreadsheets and extracts structured
 * synergy line items so the audit pipeline can score each claim on
 * defensibility (mechanism / owner / milestone) and base-rate realisation
 * (BCG/McKinsey 30-50% revenue / 60-80% cost). Without this layer the
 * audit only sees tab-flattened text and cannot reason about row-level
 * synergy claims.
 *
 * Architecture: pure function over an ExcelJS Workbook. No I/O, no LLM,
 * no DB. Returns null when the workbook doesn't look like a synergy
 * model so the caller can fall through to plain-text parsing.
 *
 * Detection heuristic (fail-safe — false negative preferred over false
 * positive, because the fallback is the existing flattened-text path):
 *   - Sheet name matches a synergy keyword (synergy / synergies /
 *     value-creation / cost-savings) OR
 *   - Header row contains "synergy" + a year/run-rate column header
 *
 * Extraction:
 *   - Identifies header row (first row with ≥2 amount-shaped headers)
 *   - For each subsequent row with a string label + ≥1 numeric amount,
 *     emit a SynergyClaim with whatever defensibility evidence the
 *     adjacent cells carry
 *   - Synergy classification (revenue / cost_cogs / cost_opex / capex /
 *     unknown) inferred from the row label + sheet name
 *
 * The output gets serialised inline in the text content with a
 * STRUCTURED_SYNERGY_MODEL block so downstream audit nodes can read
 * the per-claim defensibility data without needing a new state field.
 */

import type ExcelJSType from 'exceljs';
import {
  scoreSynergyClaim,
  aggregateDefensibility,
  type SynergyClaimType,
  type SynergyDefensibilityScore,
  type PortfolioDefensibility,
} from './synergy-defensibility';

export interface SynergyClaim {
  /** Row label / line item name (e.g., "Cross-sell to existing customers"). */
  label: string;
  /** Year-by-year amounts where the parser detected them. */
  amounts: {
    year1?: number;
    year2?: number;
    year3?: number;
    runRate?: number;
  };
  /** Synergy classification inferred from row label + sheet name. */
  type: SynergyClaimType;
  /** Whether the row carries an explicit owner cell value. */
  hasOwner: boolean;
  /** Whether the row carries an explicit operational mechanism. */
  hasMechanism: boolean;
  /** Whether the row carries an explicit measurable milestone. */
  hasMilestone: boolean;
  /** Free-text content of any owner/mechanism/milestone cells, when present. */
  owner?: string;
  mechanism?: string;
  milestone?: string;
  /** Source location for debugging + DPR traceability. */
  source: { sheet: string; row: number };
  /** Defensibility scoring (computed at extraction time). */
  defensibility: SynergyDefensibilityScore;
}

export interface SynergyStructure {
  /** Did the parser detect synergy-model shape? */
  detected: boolean;
  /** Sheets in the workbook with classification. */
  sheets: Array<{ name: string; classification: 'synergy' | 'summary' | 'other' }>;
  /** All synergy line items extracted. */
  claims: SynergyClaim[];
  /** Sum of year-1 amounts across detected claims, when amounts present. */
  totalProjectedYear1: number | null;
  /** Sum of run-rate amounts across detected claims, when amounts present. */
  totalProjectedRunRate: number | null;
  /** Aggregate defensibility across all claims. */
  portfolio: PortfolioDefensibility;
  /** Confidence the file is actually a synergy model. */
  confidence: 'high' | 'medium' | 'low' | 'none';
}

const SYNERGY_SHEET_KEYWORDS = [
  'synergy',
  'synergies',
  'value creation',
  'value-creation',
  'cost savings',
  'cost-savings',
  'cost takeout',
  'opex savings',
  'cogs savings',
  'revenue uplift',
  'cross-sell',
  'cross sell',
];

const SUMMARY_SHEET_KEYWORDS = ['summary', 'overview', 'consolidated', 'roll-up', 'roll up'];

const REVENUE_KEYWORDS = [
  'revenue',
  'cross-sell',
  'cross sell',
  'upsell',
  'up-sell',
  'price',
  'pricing',
  'volume',
  'channel expansion',
  'top-line',
  'top line',
];

const COGS_KEYWORDS = ['cogs', 'cost of goods', 'cost of revenue', 'manufacturing', 'procurement', 'supplier', 'sourcing', 'vendor consolidation'];

const OPEX_KEYWORDS = [
  'opex',
  'operating expense',
  'sg&a',
  'sga',
  'overhead',
  'corporate overhead',
  'consolidation',
  'redundanc',
  'headcount',
  'real estate',
  'rent',
  'travel',
  'marketing',
];

const CAPEX_KEYWORDS = ['capex', 'capital expenditure', 'investment', 'capacity'];

const OWNER_HEADER_KEYWORDS = ['owner', 'sponsor', 'lead', 'accountable', 'champion', 'responsible', 'raci'];
const MECHANISM_HEADER_KEYWORDS = ['mechanism', 'how', 'driver', 'lever', 'initiative', 'action', 'method'];
const MILESTONE_HEADER_KEYWORDS = [
  'milestone',
  'timeline',
  'deadline',
  'target date',
  'completion',
  '90-day',
  '90 day',
  'day 1',
  'day-1',
  'phase',
];

const YEAR_HEADER_PATTERNS = [
  /^year\s*1$|^y1$|^yr\s*1$/i,
  /^year\s*2$|^y2$|^yr\s*2$/i,
  /^year\s*3$|^y3$|^yr\s*3$/i,
  /run.?rate|run.?-?rate|steady.?state/i,
];

function lower(s: string): string {
  return s.trim().toLowerCase();
}

function classifySheet(name: string): 'synergy' | 'summary' | 'other' {
  const n = lower(name);
  if (SYNERGY_SHEET_KEYWORDS.some(k => n.includes(k))) return 'synergy';
  if (SUMMARY_SHEET_KEYWORDS.some(k => n.includes(k))) return 'summary';
  return 'other';
}

function classifyClaim(label: string, sheetName: string): SynergyClaimType {
  const text = `${lower(label)} ${lower(sheetName)}`;
  if (REVENUE_KEYWORDS.some(k => text.includes(k))) return 'revenue';
  if (COGS_KEYWORDS.some(k => text.includes(k))) return 'cost_cogs';
  if (OPEX_KEYWORDS.some(k => text.includes(k))) return 'cost_opex';
  if (CAPEX_KEYWORDS.some(k => text.includes(k))) return 'capex';
  // Sheet-level fallback for ambiguous labels.
  if (lower(sheetName).includes('revenue')) return 'revenue';
  if (lower(sheetName).includes('cost')) return 'cost_opex';
  return 'unknown';
}

function isAmountValue(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function asString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  return null;
}

interface HeaderInfo {
  rowIndex: number;
  yearColumns: { year1?: number; year2?: number; year3?: number; runRate?: number };
  ownerColumns: number[];
  mechanismColumns: number[];
  milestoneColumns: number[];
}

function detectHeader(sheet: ExcelJSType.Worksheet): HeaderInfo | null {
  // Scan first 8 rows for the header row — the first row with ≥2 amount-shaped
  // column headers (Year 1 / Year 2 / Run-rate / etc.). Slightly defensive so
  // a 2-3 line title preamble doesn't confuse the parser.
  const maxRows = Math.min(8, sheet.rowCount);
  for (let r = 1; r <= maxRows; r += 1) {
    const row = sheet.getRow(r);
    const yearColumns: HeaderInfo['yearColumns'] = {};
    const ownerColumns: number[] = [];
    const mechanismColumns: number[] = [];
    const milestoneColumns: number[] = [];
    let yearHits = 0;

    for (let c = 1; c <= sheet.columnCount; c += 1) {
      const cell = row.getCell(c);
      const text = asString(cell.value);
      if (!text) continue;
      const lt = lower(text);

      if (YEAR_HEADER_PATTERNS[0].test(lt)) {
        yearColumns.year1 = c;
        yearHits += 1;
      } else if (YEAR_HEADER_PATTERNS[1].test(lt)) {
        yearColumns.year2 = c;
        yearHits += 1;
      } else if (YEAR_HEADER_PATTERNS[2].test(lt)) {
        yearColumns.year3 = c;
        yearHits += 1;
      } else if (YEAR_HEADER_PATTERNS[3].test(lt)) {
        yearColumns.runRate = c;
        yearHits += 1;
      }

      if (OWNER_HEADER_KEYWORDS.some(k => lt.includes(k))) ownerColumns.push(c);
      if (MECHANISM_HEADER_KEYWORDS.some(k => lt.includes(k))) mechanismColumns.push(c);
      if (MILESTONE_HEADER_KEYWORDS.some(k => lt.includes(k))) milestoneColumns.push(c);
    }

    if (yearHits >= 2) {
      return { rowIndex: r, yearColumns, ownerColumns, mechanismColumns, milestoneColumns };
    }
  }
  return null;
}

function detectSynergyContext(sheet: ExcelJSType.Worksheet): boolean {
  // True if any cell in the first 8 rows contains a synergy keyword. Lets us
  // detect synergy sheets even when the sheet name is something like "Sheet1".
  const maxRows = Math.min(8, sheet.rowCount);
  for (let r = 1; r <= maxRows; r += 1) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= sheet.columnCount; c += 1) {
      const text = asString(row.getCell(c).value);
      if (text && SYNERGY_SHEET_KEYWORDS.some(k => lower(text).includes(k))) {
        return true;
      }
    }
  }
  return false;
}

export function extractSynergyStructure(workbook: ExcelJSType.Workbook): SynergyStructure {
  const sheets: SynergyStructure['sheets'] = [];
  const claims: SynergyClaim[] = [];

  let synergySheetCount = 0;
  let totalY1: number | null = null;
  let totalRunRate: number | null = null;

  workbook.eachSheet(sheet => {
    const classification = classifySheet(sheet.name);
    const isSynergy =
      classification === 'synergy' || (classification === 'other' && detectSynergyContext(sheet));
    sheets.push({ name: sheet.name, classification: isSynergy ? 'synergy' : classification });

    if (!isSynergy) return;
    synergySheetCount += 1;

    const header = detectHeader(sheet);
    if (!header) return;

    const dataStartRow = header.rowIndex + 1;
    for (let r = dataStartRow; r <= sheet.rowCount; r += 1) {
      const row = sheet.getRow(r);
      const labelCell = row.getCell(1);
      const label = asString(labelCell.value);
      if (!label) continue;
      // Skip subtotal rows (heuristic: label contains "total" + has zero column-A
      // text-only rows downstream).
      if (lower(label).startsWith('total') || lower(label) === 'subtotal') continue;

      const amounts: SynergyClaim['amounts'] = {};
      let hasAnyAmount = false;
      const yc = header.yearColumns;
      if (yc.year1 != null) {
        const v = row.getCell(yc.year1).value;
        if (isAmountValue(v)) {
          amounts.year1 = v;
          hasAnyAmount = true;
        }
      }
      if (yc.year2 != null) {
        const v = row.getCell(yc.year2).value;
        if (isAmountValue(v)) {
          amounts.year2 = v;
          hasAnyAmount = true;
        }
      }
      if (yc.year3 != null) {
        const v = row.getCell(yc.year3).value;
        if (isAmountValue(v)) {
          amounts.year3 = v;
          hasAnyAmount = true;
        }
      }
      if (yc.runRate != null) {
        const v = row.getCell(yc.runRate).value;
        if (isAmountValue(v)) {
          amounts.runRate = v;
          hasAnyAmount = true;
        }
      }
      if (!hasAnyAmount) continue;

      const owner =
        header.ownerColumns.map(c => asString(row.getCell(c).value)).find(Boolean) ?? undefined;
      const mechanism =
        header.mechanismColumns.map(c => asString(row.getCell(c).value)).find(Boolean) ?? undefined;
      const milestone =
        header.milestoneColumns.map(c => asString(row.getCell(c).value)).find(Boolean) ?? undefined;

      const type = classifyClaim(label, sheet.name);
      const claimInput = {
        type,
        hasMechanism: Boolean(mechanism && mechanism.length >= 8), // 8 chars filters "TBD" / "—" / blank-equivalents
        hasOwner: Boolean(owner && owner.length >= 2),
        hasMilestone: Boolean(milestone && milestone.length >= 4),
      };
      const defensibility = scoreSynergyClaim(claimInput);

      claims.push({
        label,
        amounts,
        type,
        hasOwner: claimInput.hasOwner,
        hasMechanism: claimInput.hasMechanism,
        hasMilestone: claimInput.hasMilestone,
        owner,
        mechanism,
        milestone,
        source: { sheet: sheet.name, row: r },
        defensibility,
      });

      if (amounts.year1 != null) {
        totalY1 = (totalY1 ?? 0) + amounts.year1;
      }
      if (amounts.runRate != null) {
        totalRunRate = (totalRunRate ?? 0) + amounts.runRate;
      }
    }
  });

  let confidence: SynergyStructure['confidence'];
  if (claims.length === 0) confidence = 'none';
  else if (claims.length >= 5 && synergySheetCount >= 1) confidence = 'high';
  else if (claims.length >= 2) confidence = 'medium';
  else confidence = 'low';

  return {
    detected: claims.length > 0,
    sheets,
    claims,
    totalProjectedYear1: totalY1,
    totalProjectedRunRate: totalRunRate,
    portfolio: aggregateDefensibility(claims.map(c => c.defensibility)),
    confidence,
  };
}

/**
 * JSON-serialisable wrapper around SynergyStructure for persistence in
 * Document.parsedStructuredData (locked 2026-05-09, hard-layer ship).
 * The schema carries a `kind` discriminator so future parsers (qofe,
 * integration_plan) can use the same column with their own structured
 * shapes. Read by the DPR assembler, deal-aggregator, and downstream
 * consumers without re-parsing the original .xlsx.
 */
export interface ParsedSynergyModelData {
  kind: 'synergy_model';
  /** Schema version for forward-compat; bump when shape changes. */
  version: 1;
  structure: SynergyStructure;
  /** When the parse ran — useful for cache invalidation if parsing logic changes. */
  parsedAt: string;
}

/**
 * Build the JSON-persistable wrapper from a SynergyStructure. Always
 * returns null when the structure has zero claims so persistence
 * doesn't fill up with empty rows.
 */
export function toParsedStructuredData(
  structure: SynergyStructure
): ParsedSynergyModelData | null {
  if (!structure.detected || structure.claims.length === 0) return null;
  return {
    kind: 'synergy_model',
    version: 1,
    structure,
    parsedAt: new Date().toISOString(),
  };
}

/**
 * Compact summary surfaced on the DPR cover when a synergy_model is
 * audited. Extracted from Document.parsedStructuredData (preferred)
 * or from the inline STRUCTURED SYNERGY MODEL block in Document.content
 * (fallback for legacy uploads or encryption edge cases).
 */
export interface SynergyDefensibilitySummary {
  /** Whether a synergy block was detected in the content. */
  detected: boolean;
  /** Detection confidence per the parser's heuristic. */
  confidence: 'high' | 'medium' | 'low' | 'none';
  /** Total claim count. */
  totalClaims: number;
  /** % of claims with all three defensibility elements (mechanism + owner + milestone). */
  fullyDefendedPct: number;
  /** One-line procurement-grade portfolio summary. */
  portfolioSummary: string;
  /** Top claims sorted critical → low for DPR cover surfacing. Capped at 5. */
  topClaims: Array<{
    label: string;
    type: SynergyClaimType;
    severity: 'critical' | 'high' | 'medium' | 'low';
    score: number;
    verdict: string;
  }>;
}

const BLOCK_START = '=== STRUCTURED SYNERGY MODEL — PARSED PRE-AUDIT ===';
const BLOCK_END = '=== END STRUCTURED SYNERGY MODEL ===';

/**
 * Build a SynergyDefensibilitySummary directly from the persisted
 * ParsedSynergyModelData wrapper (Document.parsedStructuredData).
 * Preferred over the text-extraction path because the structured field
 * survives content encryption and doesn't suffer regex-extraction drift.
 * Returns null when the wrapper is for a different document kind or
 * has zero claims.
 */
export function summariseSynergyDefensibility(
  parsed: ParsedSynergyModelData | null
): SynergyDefensibilitySummary | null {
  if (!parsed || parsed.kind !== 'synergy_model') return null;
  const { structure } = parsed;
  if (!structure.detected || structure.claims.length === 0) return null;

  const totalClaims = structure.claims.length;
  const fullyDefendedPct = structure.portfolio.fullyDefendedPct;

  const severityRank: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const topClaims = [...structure.claims]
    .sort((a, b) => severityRank[a.defensibility.severity] - severityRank[b.defensibility.severity])
    .slice(0, 5)
    .map(c => ({
      label: c.label,
      type: c.type,
      severity: c.defensibility.severity,
      score: c.defensibility.score,
      verdict: c.defensibility.verdict,
    }));

  return {
    detected: true,
    confidence: structure.confidence,
    totalClaims,
    fullyDefendedPct,
    portfolioSummary: structure.portfolio.summary,
    topClaims,
  };
}

/**
 * Extract a SynergyDefensibilitySummary from the inline-marker block
 * embedded in `Document.content` by `formatSynergyStructureForAudit`.
 * Returns null when no block is detected (the document wasn't a
 * synergy_model upload, or the parser bailed out). Pure function,
 * deterministic, no I/O.
 *
 * Used by DPR assembly (provenance-record-data.ts) so synergy
 * defensibility surfaces on the DPR cover for synergy_model uploads
 * without re-parsing the original .xlsx.
 */
export function extractSynergyDefensibilityFromContent(
  content: string
): SynergyDefensibilitySummary | null {
  const startIdx = content.indexOf(BLOCK_START);
  if (startIdx === -1) return null;
  const endIdx = content.indexOf(BLOCK_END, startIdx);
  if (endIdx === -1) return null;
  const block = content.slice(startIdx, endIdx + BLOCK_END.length);

  const confidenceMatch = block.match(/Detection confidence:\s*(high|medium|low|none)/);
  const confidence = (confidenceMatch?.[1] as SynergyDefensibilitySummary['confidence']) ?? 'low';

  const summaryMatch = block.match(/PORTFOLIO DEFENSIBILITY:\s*(.+)/);
  const portfolioSummary = summaryMatch?.[1]?.trim() ?? '';

  // Extract per-claim lines + their verdicts. The format is:
  //   [N] {label} · type={type} · {amts} · severity={severity} · score={score}/3
  //       Mechanism: ... · Owner: ... · Milestone: ...
  //       Verdict: ...
  const claimRegex =
    /\[(\d+)\]\s+([^·\n]+?)\s+·\s+type=(\w+)\s+·\s+[^·\n]*·\s+severity=(\w+)\s+·\s+score=(\d+)\/3/g;
  const verdictRegex = /Verdict:\s+(.+)/g;
  const claims: Array<{
    label: string;
    type: SynergyClaimType;
    severity: 'critical' | 'high' | 'medium' | 'low';
    score: number;
    verdict: string;
  }> = [];

  const claimMatches = Array.from(block.matchAll(claimRegex));
  const verdictMatches = Array.from(block.matchAll(verdictRegex));
  for (let i = 0; i < claimMatches.length; i += 1) {
    const m = claimMatches[i];
    const v = verdictMatches[i];
    const severity = m[4] as 'critical' | 'high' | 'medium' | 'low';
    if (!['critical', 'high', 'medium', 'low'].includes(severity)) continue;
    claims.push({
      label: m[2].trim(),
      type: m[3] as SynergyClaimType,
      severity,
      score: parseInt(m[5], 10),
      verdict: v?.[1]?.trim() ?? '',
    });
  }

  const totalClaims = claims.length;
  const fullyDefended = claims.filter(c => c.score === 3).length;
  const fullyDefendedPct =
    totalClaims === 0 ? 0 : Math.round((fullyDefended / totalClaims) * 100);

  // Sort by severity (critical first) for the top-5 DPR surface.
  const severityRank: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const topClaims = [...claims]
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    .slice(0, 5);

  return {
    detected: true,
    confidence,
    totalClaims,
    fullyDefendedPct,
    portfolioSummary,
    topClaims,
  };
}

/**
 * Serialise a SynergyStructure as a procurement-grade text block to embed
 * inline in the audit's text content. Downstream nodes (structurer,
 * biasDetective, noiseJudge) read this as plain text but get the per-
 * claim defensibility data without needing a new state field on the
 * audit graph.
 */
export function formatSynergyStructureForAudit(structure: SynergyStructure): string {
  if (!structure.detected) return '';

  const lines: string[] = [];
  lines.push('=== STRUCTURED SYNERGY MODEL — PARSED PRE-AUDIT ===');
  lines.push(`Detection confidence: ${structure.confidence}`);
  lines.push(`Sheets: ${structure.sheets.map(s => `${s.name} (${s.classification})`).join(' · ')}`);
  if (structure.totalProjectedYear1 != null) {
    lines.push(`Total Year-1 projection: ${structure.totalProjectedYear1.toLocaleString()}`);
  }
  if (structure.totalProjectedRunRate != null) {
    lines.push(`Total run-rate projection: ${structure.totalProjectedRunRate.toLocaleString()}`);
  }
  lines.push('');
  lines.push(`PORTFOLIO DEFENSIBILITY: ${structure.portfolio.summary}`);
  lines.push('');
  lines.push(`PER-CLAIM AUDIT (${structure.claims.length} claims):`);

  structure.claims.forEach((c, i) => {
    const amts: string[] = [];
    if (c.amounts.year1 != null) amts.push(`Y1 ${c.amounts.year1.toLocaleString()}`);
    if (c.amounts.year2 != null) amts.push(`Y2 ${c.amounts.year2.toLocaleString()}`);
    if (c.amounts.year3 != null) amts.push(`Y3 ${c.amounts.year3.toLocaleString()}`);
    if (c.amounts.runRate != null) amts.push(`RR ${c.amounts.runRate.toLocaleString()}`);

    lines.push(
      `[${i + 1}] ${c.label} · type=${c.type} · ${amts.join(' / ')} · severity=${c.defensibility.severity} · score=${c.defensibility.score}/3`
    );
    lines.push(
      `    Mechanism: ${c.mechanism ?? '(missing)'} · Owner: ${c.owner ?? '(missing)'} · Milestone: ${c.milestone ?? '(missing)'}`
    );
    lines.push(`    Verdict: ${c.defensibility.verdict}`);
    lines.push(`    Source: ${c.source.sheet} row ${c.source.row}`);
  });

  lines.push('');
  lines.push('=== END STRUCTURED SYNERGY MODEL ===');
  lines.push('');

  return lines.join('\n');
}
