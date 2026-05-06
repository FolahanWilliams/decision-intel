/**
 * Splits FOUNDER_CONTEXT into named sections for per-persona slicing.
 *
 * The full FOUNDER_CONTEXT is 273KB / 902 lines. Sending it on every
 * voice turn was adding ~5-10s of LLM prompt-processing latency to
 * each response (gpt-4o-mini chews through huge prompts before emitting
 * the first token). Voice mode needs depth WITHIN a persona's lens —
 * Cognitive Psychologist doesn't need MARKET STRATEGY, Skeptical
 * Investor doesn't need RESEARCH FOUNDATIONS — but loses its identity
 * if we send a generic 2KB summary.
 *
 * The parser:
 *   1. Splits the context at every `=== HEADING ===` line.
 *   2. Keys each section by the bare heading text (parenthetical
 *      metadata stripped — so "EXECUTION DISCIPLINE (locked 2026-05-01
 *      — read this first, every session)" becomes key "EXECUTION
 *      DISCIPLINE").
 *   3. Keeps the original heading line in the section body so the
 *      LLM still sees the context's own structure.
 *
 * Per-persona section selection happens in `thinking-partners.ts`
 * (each persona declares which sections it wants) and the voice-context
 * API assembles them via `assembleFounderContextSections()`.
 *
 * For the prompt-caching strategy: sections are concatenated in a
 * STABLE order (alphabetical by canonical key, then preamble + sections
 * deterministic per persona) so the LLM-side cache prefix matches across
 * turns within a session, regardless of insertion order in the persona
 * declaration.
 */

const SECTION_HEADER_REGEX = /^=== (.+?) ===$/gm;

/** Strip parenthetical metadata from a header so we can look up by
 *  the canonical short name. "EXECUTION DISCIPLINE (locked ...)" →
 *  "EXECUTION DISCIPLINE". Lowercased and trimmed for case-insensitive
 *  matching against persona declarations. */
function canonicalizeHeader(rawHeader: string): string {
  return rawHeader
    .replace(/\(.*?\)/g, '') // drop parenthetical metadata
    .trim()
    .toLowerCase();
}

export interface FounderContextSection {
  /** The original full heading text including parens, e.g.
   *  "EXECUTION DISCIPLINE (locked 2026-05-01 — read this first, every session)". */
  rawHeader: string;
  /** Canonical key for lookups. Lowercased, parens stripped, trimmed.
   *  e.g. "execution discipline". Personas declare wanted sections
   *  using these keys (case-insensitive — we lowercase on lookup too). */
  canonicalKey: string;
  /** Full text of the section INCLUDING the `=== HEADING ===` line.
   *  We keep the heading so the LLM sees the same structure it would
   *  see in the full context, and so two adjacent sections don't run
   *  into each other in the assembled output. */
  body: string;
}

/**
 * Parse FOUNDER_CONTEXT into a map keyed by canonical header. Idempotent
 * + pure — safe to memoize. Caller is responsible for caching if needed.
 *
 * Sections without a `=== HEADING ===` (e.g. the preamble before the
 * first section) are returned under the special key `__preamble__` so
 * we can still include the introductory "You are the Decision Intel
 * Founder's strategic AI advisor..." opening line if a persona wants it.
 */
export function splitFounderContextSections(context: string): Map<string, FounderContextSection> {
  const sections = new Map<string, FounderContextSection>();

  // Find all section header positions
  const matches: Array<{ rawHeader: string; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  // Reset regex lastIndex (it's a stateful global regex)
  SECTION_HEADER_REGEX.lastIndex = 0;
  while ((m = SECTION_HEADER_REGEX.exec(context)) !== null) {
    matches.push({
      rawHeader: m[1],
      start: m.index,
      end: m.index + m[0].length,
    });
  }

  // Extract preamble (text before the first section header)
  if (matches.length > 0 && matches[0].start > 0) {
    const preambleBody = context.slice(0, matches[0].start).trim();
    if (preambleBody.length > 0) {
      sections.set('__preamble__', {
        rawHeader: '__preamble__',
        canonicalKey: '__preamble__',
        body: preambleBody,
      });
    }
  }

  // Extract each section: from the start of its header to the start
  // of the next header (or end of context for the last section).
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const sectionEnd = next ? next.start : context.length;
    const body = context.slice(current.start, sectionEnd).trim();
    const canonicalKey = canonicalizeHeader(current.rawHeader);
    sections.set(canonicalKey, {
      rawHeader: current.rawHeader,
      canonicalKey,
      body,
    });
  }

  return sections;
}

/**
 * Assemble a persona-specific subset of the founder context.
 *
 * Order is STABLE for prompt-caching purposes:
 *   1. Preamble (if requested) — the "You are the Decision Intel..." opener
 *   2. Sections in the order they appear in the original context
 *      (NOT in the order the persona declared them — keeps the LLM's
 *      cache prefix the same across calls regardless of how the persona
 *      list was authored)
 *
 * If a persona declares a section that doesn't exist (typo, renamed
 * heading), it's silently skipped. Logged at the call site so we can
 * audit drift.
 *
 * @param sections - Output of splitFounderContextSections()
 * @param wantedKeys - Canonical keys (case-insensitive) the persona wants
 * @param includePreamble - Whether to include the pre-first-section preamble
 * @returns Assembled context string + metadata about what was actually included
 */
export function assembleFounderContextSections(
  sections: Map<string, FounderContextSection>,
  wantedKeys: readonly string[],
  includePreamble = true
): { content: string; included: string[]; missing: string[] } {
  const wantedSet = new Set(wantedKeys.map(k => k.toLowerCase().trim()));
  const included: string[] = [];
  const missing: string[] = [];

  // Track which wanted keys we found, so we can report unfound ones
  const found = new Set<string>();

  const parts: string[] = [];

  // 1. Preamble first (if wanted and present)
  if (includePreamble) {
    const preamble = sections.get('__preamble__');
    if (preamble) {
      parts.push(preamble.body);
      included.push('__preamble__');
    }
  }

  // 2. Iterate sections in their ORIGINAL order (preserves cache prefix
  //    stability + matches the document's own structure). The Map
  //    preserves insertion order, which matches the parsing order,
  //    which matches the original document order.
  for (const [key, section] of sections) {
    if (key === '__preamble__') continue;
    if (wantedSet.has(key)) {
      parts.push(section.body);
      included.push(key);
      found.add(key);
    }
  }

  // Report any wanted keys we didn't find
  for (const wanted of wantedSet) {
    if (!found.has(wanted)) {
      missing.push(wanted);
    }
  }

  return {
    content: parts.join('\n\n'),
    included,
    missing,
  };
}
