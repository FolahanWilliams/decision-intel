/**
 * Stitch 2-N source documents into ONE decision-audit input (locked 2026-07-02).
 *
 * Sometimes a single filing isn't the whole decision — it's 2-3 official
 * documents (an S-1 + its 424B4 amendment; an 8-K announcement + the deal
 * exhibit) that together ARE the decision. This stitches them so the pipeline
 * audits them as ONE decision, pulling THOROUGHLY from every source: each
 * document gets a FAIR share of the total scan budget, distilled (via
 * `distillForAudit`) to its most reasoning-dense content when over its share —
 * so document 3 is as well-represented as document 1, never truncated to the
 * first. The distiller keeps the reasoning (risk factors, MD&A, strategy,
 * forward-looking) and drops boilerplate/tables, so each source contributes its
 * substance, not its filler.
 *
 * Pure — no I/O, no LLM. The stitched output carries clear source boundaries +
 * a synthesis header so every detector (bias, strategic-nodes, resilience,
 * forgotten-questions) and the DPR treat it as one decision drawn from N sources.
 */

import { distillForAudit } from '@/lib/agents/content-distiller';

export interface DecisionSource {
  /** Display name — the filename or a label ("Google 2004 424B4"). */
  name: string;
  content: string;
}

export interface StitchedSourceSummary {
  name: string;
  /** How many chars of this source survived into the audited input. */
  charsUsed: number;
  /** True when this source was distilled to fit its budget share. */
  distilled: boolean;
}

export interface StitchedDecision {
  /** The combined, labeled, per-doc-budgeted content the pipeline audits. */
  content: string;
  /** Per-source summary for provenance. */
  sources: StitchedSourceSummary[];
  /** True when any source was distilled to fit its share. */
  anyDistilled: boolean;
}

/** Total content budget for a stitched decision — headroom below the pipeline's
 *  ~200K scan cap so the header + source labels fit. */
export const STITCH_TOTAL_BUDGET = 180_000;
/** A fair floor so a short source isn't starved when stitched with a long one. */
export const MIN_PER_SOURCE = 12_000;

/**
 * Combine N decision sources into one audit input. One source passes through as
 * a normal single-doc audit (no stitching header). Two+ sources each get a fair,
 * floored share of the budget, distilled to their reasoning, and are labeled
 * with clear boundaries under a synthesis header.
 */
export function stitchDecisionSources(
  sources: DecisionSource[],
  totalBudget: number = STITCH_TOTAL_BUDGET
): StitchedDecision {
  const clean = sources
    .map(s => ({ name: (s.name || 'Untitled source').trim(), content: (s.content || '').trim() }))
    .filter(s => s.content.length > 0);

  if (clean.length === 0) return { content: '', sources: [], anyDistilled: false };

  if (clean.length === 1) {
    // Single source — distill to the full budget, no stitching header: behaves
    // exactly like a normal single-doc audit.
    const d = distillForAudit(clean[0].content, totalBudget);
    return {
      content: d.content,
      sources: [{ name: clean[0].name, charsUsed: d.content.length, distilled: d.distilled }],
      anyDistilled: d.distilled,
    };
  }

  // Fair per-source budget: an equal share, floored so no source is starved.
  const perSource = Math.max(MIN_PER_SOURCE, Math.floor(totalBudget / clean.length));

  const parts: string[] = [];
  const summaries: StitchedSourceSummary[] = [];
  let anyDistilled = false;

  clean.forEach((s, i) => {
    const d = distillForAudit(s.content, perSource);
    if (d.distilled) anyDistilled = true;
    parts.push(`=== SOURCE ${i + 1} OF ${clean.length} · ${s.name} ===\n${d.content}`);
    summaries.push({ name: s.name, charsUsed: d.content.length, distilled: d.distilled });
  });

  const header =
    `[This decision is audited from ${clean.length} source documents, stitched into one record: ` +
    `${clean.map((s, i) => `(${i + 1}) ${s.name}`).join(', ')}. ` +
    `Treat them as ONE decision — synthesise across ALL sources; a single finding may draw on more than one.]\n\n`;

  return { content: header + parts.join('\n\n'), sources: summaries, anyDistilled };
}
