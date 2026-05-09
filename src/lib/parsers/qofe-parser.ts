/**
 * QofE (Quality of Earnings) Parser (locked 2026-05-09 evening, M&A
 * hard-layer extension).
 *
 * QofE reports are typically PDF deliverables (Big-4 / boutique
 * transaction-advisory firms). Unlike synergy models which are tabular
 * by nature, QofE adjustments are narrative — sections of prose that
 * walk through "non-recurring" items, owner-comp adjustments, run-rate
 * normalizations, etc.
 *
 * The parser is therefore TEXT-LEVEL pattern detection over the QofE
 * report's extracted text body, not spreadsheet extraction. Mirrors the
 * shape of compound-engine.ts:detectWinnerEffect / detectStressSignals
 * (deterministic regex/keyword scanning) but with QofE-specific red-flag
 * categories anchored in BCG diligence frameworks + Bain "Adjusted EBITDA
 * Reality Check" research.
 *
 * NO LLM CALL. Pure-function. Deterministic.
 *
 * Returns a typed `ParsedQofeData` wrapper persistable to
 * Document.parsedStructuredData under `kind: 'qofe'`. Mirrors the
 * synergy-model `kind: 'synergy_model'` pattern so the same JSONB column
 * hosts both.
 *
 * Used by:
 *   - src/lib/utils/file-parser.ts (called for documentType === 'qofe'
 *     uploads to populate Document.parsedStructuredData + prepend the
 *     STRUCTURED QOFE block to the flattened text)
 *   - Future qofeValidationNode peer of synergyValidationNode (synergy
 *     pattern locked 2026-05-09 hard-layer ship · Proposal 4)
 */

import { scoreQofeAssessment, type QofeAssessment } from './qofe-defensibility';

// ─── Persistable wrapper shape (mirrors ParsedSynergyModelData) ─────────────

export interface ParsedQofeData {
  kind: 'qofe';
  version: 1;
  /** The structured assessment computed at upload time. */
  assessment: QofeAssessment;
  /** Length of the QofE text body the assessment was computed over (chars).
   *  Surfaced so the DPR cover can render confidence bands ("100-page QofE,
   *  scanned 4 red flags" reads more credibly than "scanned but no flags"). */
  bodyLength: number;
  /** ISO timestamp of when the parse ran. */
  parsedAt: string;
}

/**
 * Pure entry point — given the QofE text body, return the parsed-structured
 * wrapper. Returns null when the input is empty or no signal density is
 * detected (very short PDF / image-only PDF where text extraction failed).
 */
export function extractQofeStructure(text: string): ParsedQofeData | null {
  const cleaned = text.trim();
  if (cleaned.length < 200) {
    // Too short to be a real QofE — likely image-only PDF or extraction
    // failure. Skip gracefully.
    return null;
  }
  const assessment = scoreQofeAssessment(cleaned);
  return {
    kind: 'qofe',
    version: 1,
    assessment,
    bodyLength: cleaned.length,
    parsedAt: new Date().toISOString(),
  };
}

// ─── Inline-marker text block (mirrors STRUCTURED SYNERGY MODEL pattern) ────

const BLOCK_START = '=== STRUCTURED QOFE — PARSED PRE-AUDIT ===';
const BLOCK_END = '=== END STRUCTURED QOFE ===';

/**
 * Format the parsed QofE assessment as a procurement-grade text block to
 * prepend to the flattened QofE text content. The structurer +
 * biasDetective consume this as primary evidence (NOT re-derive from the
 * underlying narrative) so the audit grades adjusted-EBITDA defensibility
 * deterministically rather than re-discovering the patterns each run.
 *
 * Mirrors `formatSynergyStructureForAudit` semantics — human-readable, no
 * JSON markers in the audit's reading path, every line carries verdict
 * vocabulary the bias-detective prompt is already trained on.
 */
export function formatQofeAssessmentForAudit(parsed: ParsedQofeData): string {
  const { assessment } = parsed;
  const lines: string[] = [];
  lines.push(BLOCK_START);
  lines.push('');
  lines.push(`PORTFOLIO SUMMARY: ${assessment.summary}`);
  lines.push('');
  lines.push(
    `Adjusted-EBITDA language density: ${(assessment.adjEbitdaInflationSignal * 100).toFixed(0)}%${
      assessment.adjEbitdaInflationSignal >= 0.3
        ? ' (saturated — typical of adjustment-heavy QofE)'
        : assessment.adjEbitdaInflationSignal >= 0.1
          ? ' (moderate)'
          : ' (low — light adjustment activity)'
    }`
  );
  lines.push(
    `Commission signal: ${
      assessment.commissionedBy === 'sell_side'
        ? 'SELL-SIDE — apply Seller-Halo Filter throughout. Sell-side QofE structurally biases toward higher adjusted EBITDA.'
        : assessment.commissionedBy === 'buy_side'
          ? 'BUY-SIDE — defensible baseline. Still subject to confirmation bias when the buyer wants the deal to close.'
          : 'UNKNOWN — treat with buyer-side skepticism.'
    }`
  );
  lines.push('');

  if (assessment.redFlags.length === 0) {
    lines.push('No QofE red flags detected. Apply standard buyer-side scrutiny.');
  } else {
    lines.push(`RED FLAGS DETECTED (${assessment.redFlags.length}):`);
    lines.push('');
    for (const flag of assessment.redFlags) {
      lines.push(
        `- [${flag.severity.toUpperCase()}] ${flag.label}: ${flag.verdict}`
      );
      if (flag.matchedPhrases.length > 0) {
        const samplePhrases = flag.matchedPhrases.slice(0, 3).map(p => `"${p}"`).join(', ');
        lines.push(`    Sample matches: ${samplePhrases}`);
      }
    }
  }

  lines.push('');
  lines.push(BLOCK_END);
  return lines.join('\n');
}

// ─── DPR-cover summary (mirrors summariseSynergyDefensibility) ─────────────

export interface QofeAssessmentSummary {
  detected: boolean;
  redFlagCount: number;
  portfolioSeverity: QofeAssessment['portfolioSeverity'];
  commissionedBy: QofeAssessment['commissionedBy'];
  adjEbitdaInflationSignal: number;
  summary: string;
  /** Top red flags sorted critical → low for DPR cover surfacing. Capped at 4. */
  topRedFlags: Array<{
    label: string;
    severity: QofeAssessment['portfolioSeverity'];
    verdict: string;
  }>;
}

/**
 * Build a QofeAssessmentSummary directly from the persisted ParsedQofeData
 * wrapper (Document.parsedStructuredData). Preferred over text re-extraction
 * because the structured field survives content encryption and doesn't
 * suffer regex-extraction drift. Returns null when the wrapper is for a
 * different document kind or has no detected signal.
 */
export function summariseQofeAssessment(
  parsed: ParsedQofeData | null
): QofeAssessmentSummary | null {
  if (!parsed || parsed.kind !== 'qofe') return null;
  const a = parsed.assessment;

  const severityRank: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const topRedFlags = [...a.redFlags]
    .sort((x, y) => severityRank[x.severity] - severityRank[y.severity])
    .slice(0, 4)
    .map(f => ({
      label: f.label,
      severity: f.severity,
      verdict: f.verdict,
    }));

  return {
    detected: a.redFlags.length > 0 || a.adjEbitdaInflationSignal > 0,
    redFlagCount: a.redFlags.length,
    portfolioSeverity: a.portfolioSeverity,
    commissionedBy: a.commissionedBy,
    adjEbitdaInflationSignal: a.adjEbitdaInflationSignal,
    summary: a.summary,
    topRedFlags,
  };
}
