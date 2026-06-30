import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ContentDistiller');

/**
 * DISTILL-TO-REASONING (2026-06-30).
 *
 * The audit pipeline truncates every node's input to MAX_INPUT_CHARS. For a
 * strategic memo (the core use case) that is the whole document — no change.
 * But for a real filing / CIM (a SpaceX S-1 is ~1.5M chars), the FIRST
 * MAX_INPUT_CHARS is the cover page + boilerplate, and the reasoning we actually
 * audit (risk factors, MD&A, the strategy narrative) never reaches the bias
 * detective. The founder's filing scored DQI 0 because the audit read the cover.
 *
 * This reduces an over-budget document to its most REASONING-DENSE content,
 * deterministically — NOT via an LLM (an LLM asked to "trim and return the doc"
 * would truncate its own output, the exact bug the anonymizer just had, plus it
 * would cost + be unpredictable). It drops boilerplate (financial-statement
 * tables, the TOC, signature/exhibit blocks) and keeps the prose carrying
 * forward-looking / argumentative reasoning, in document order.
 *
 * Pure + total: same input → same output, never throws, never returns empty for
 * non-empty input. Documents already within budget pass through unchanged.
 */

export interface DistillationResult {
  /** The content to audit (distilled when over budget, else the original). */
  content: string;
  /** True when the document was reduced. */
  distilled: boolean;
  originalChars: number;
  keptChars: number;
  /** User-facing note when distilled, else null. */
  note: string | null;
}

// Forward-looking / argumentative / strategic-finance language — the reasoning
// the R²F pipeline audits. Substrings so tenses/inflections all match.
const REASONING_RE =
  /\b(believ|expect|anticipat|intend|plan|project|estimat|assum|depend|risk|could|may|might|would|should|strateg|growth|opportunit|competit|advantage|threat|uncertain|material|potential|adversely|assurance|ability|failure|forecast|outlook|thesis|rational|because|therefore|however|despite|invest|return|margin|synerg|acqui|valuation|we will|we aim|our goal)/i;

// High-value section headers in strategic memos / filings.
const SECTION_HEADER_RE =
  /(risk factors|management.s discussion|md&a|prospectus summary|our business|our strateg|our company|competit|growth strateg|business overview|investment thesis|recommendation|executive summary|market opportunit|forward.looking|use of proceeds|why now)/i;

/** Pure-boilerplate blocks (financial tables, TOC dot-leaders, etc.) → drop. */
function isBoilerplate(block: string): boolean {
  const t = block.trim();
  if (t.length === 0) return true;
  // Table-of-contents dot leaders across multiple lines: "Item 1 ..... 14"
  const lines = t.split('\n');
  if (
    lines.length > 2 &&
    lines.filter(l => /\.{4,}\s*\d+\s*$/.test(l)).length >= lines.length / 2
  ) {
    return true;
  }
  // Mostly digits / currency / punctuation (financial-statement rows) with
  // little prose. Prose like "Revenue grew to $5.2B, up 40%" stays (alpha ~0.6).
  if (t.length > 40) {
    const alpha = (t.match(/[a-zA-Z]/g) || []).length;
    const numericPunct = (t.match(/[\d$%.,()\-]/g) || []).length;
    if (alpha / t.length < 0.35 && numericPunct / t.length > 0.45) return true;
  }
  return false;
}

/** Reasoning-density score for a block (higher = keep). */
function scoreBlock(block: string): number {
  let score = 0;
  if (SECTION_HEADER_RE.test(block)) score += 50;
  const matches = block.match(new RegExp(REASONING_RE.source, 'gi'));
  score += matches ? matches.length : 0;
  // Modest bonus for substantive prose length (capped — don't reward bloat).
  score += Math.min(5, Math.floor(block.length / 400));
  return score;
}

export function distillForAudit(content: string, budget: number): DistillationResult {
  const originalChars = content?.length ?? 0;
  if (!content || originalChars <= budget) {
    return {
      content: content ?? '',
      distilled: false,
      originalChars,
      keptChars: originalChars,
      note: null,
    };
  }

  // Split into blocks on blank lines; fall back to single lines for documents
  // with no paragraph structure.
  let blocks = content.split(/\n\s*\n/).filter(b => b.trim().length > 0);
  if (blocks.length < 4) {
    blocks = content.split(/\n/).filter(b => b.trim().length > 0);
  }

  const scored = blocks.map((block, idx) => ({
    block,
    idx,
    boiler: isBoilerplate(block),
    score: scoreBlock(block),
  }));
  // Prefer non-boilerplate; if everything looks like boilerplate, fall back to
  // the full set so we never return empty.
  const nonBoiler = scored.filter(s => !s.boiler);
  const pool = nonBoiler.length > 0 ? nonBoiler : scored;

  // Greedily take the highest-scoring blocks up to budget, then restore
  // document order so the kept reasoning reads in sequence.
  const ranked = [...pool].sort((a, b) => b.score - a.score || a.idx - b.idx);
  const kept: typeof ranked = [];
  let chars = 0;
  for (const s of ranked) {
    const cost = s.block.length + 2;
    if (chars + cost > budget) {
      // A single block bigger than the whole budget → take a head slice so we
      // still audit something substantive rather than nothing.
      if (kept.length === 0) {
        kept.push({ ...s, block: s.block.slice(0, budget) });
        chars = budget;
      }
      continue;
    }
    kept.push(s);
    chars += cost;
  }
  kept.sort((a, b) => a.idx - b.idx);

  const distilledContent = kept.map(k => k.block).join('\n\n') || content.slice(0, budget);
  const keptChars = distilledContent.length;
  const pct = Math.max(1, Math.round((keptChars / originalChars) * 100));
  const note =
    `Audited the most reasoning-dense ${Math.round(keptChars / 1000)}K of ${Math.round(originalChars / 1000)}K characters ` +
    `(${pct}%); set aside boilerplate, financial tables, and exhibits.`;

  log.info(`Distilled ${originalChars} → ${keptChars} chars for audit (budget ${budget}).`);
  return { content: distilledContent, distilled: true, originalChars, keptChars, note };
}
