/**
 * outcomeExtractor — pure deterministic parser that scans document
 * content for outcome signals and produces a draft outcome.
 * Locked 2026-05-21 (adaptation #1).
 *
 * Two tiers:
 *   - Tier 1 (this module): regex + named-entity + keyword matching.
 *     Free, fast, deterministic. Catches obvious outcomes (deal closed,
 *     fund returned, project abandoned, IRR hit/missed).
 *   - Tier 2 (LLM augmentation, in the API route): deepseek-v4-flash
 *     via Vercel AI Gateway with structured JSON output. Falls back to
 *     Tier 1 on any failure.
 *
 * Honest math discipline: verbatim quotes are LITERAL SUBSTRINGS of
 * the source text. Never fabricated. When the regex tier finds no
 * outcome signal, returns null (caller treats as "unknown" — never
 * makes up an outcome).
 */

import type { ExtractedOutcomeDraft, OutcomeDirection, OutcomeVerdict } from './types';

// ──────────────────────────────────────────────────────────────────────
// Pattern catalogue — outcome signals across decision classes
// ──────────────────────────────────────────────────────────────────────

interface OutcomePattern {
  /** Plain-language label for the user-facing extraction trace. */
  label: string;
  /** Regex pattern. `i` flag, multiline-safe. */
  regex: RegExp;
  /** Inferred direction when this fires. */
  direction: OutcomeDirection;
  /** Inferred verdict when this fires. */
  verdict: OutcomeVerdict;
  /** Per-hit confidence contribution. Multiple hits stack additively
   *  up to a cap. */
  confidence: number;
  /** Decision classes this pattern applies to. */
  appliesTo: ReadonlyArray<'investment' | 'acquisition' | 'strategic' | 'any'>;
}

const OUTCOME_PATTERNS: ReadonlyArray<OutcomePattern> = [
  // ── Positive outcomes ──────────────────────────────────────────────
  {
    label: 'Exit / sale completed',
    regex:
      /\b(?:the\s+(?:company|position|investment|deal|stake)\s+(?:was\s+)?(?:exited|sold|acquired))\b|\b(?:exit(?:ed)?\s+at\s+\$?[\d.,]+\s*(?:million|billion|m|b|k)\b)/i,
    direction: 'positive',
    verdict: 'value_created',
    confidence: 0.4,
    appliesTo: ['investment', 'acquisition', 'any'],
  },
  {
    label: 'IRR / MOIC target hit or exceeded',
    regex:
      /\b(?:irr\s+(?:of|reached|delivered|hit|achieved)\s+[\d.]+%|moic\s+(?:of|reached)\s+[\d.]+x|delivered\s+(?:a\s+)?(?:return|irr)\s+of\s+[\d.]+%)/i,
    direction: 'positive',
    verdict: 'value_created',
    confidence: 0.35,
    appliesTo: ['investment', 'any'],
  },
  {
    label: 'Fund returned at or above target',
    regex:
      /\b(?:fund\s+returned\s+[\d.]+%|target(?:ed)?\s+returns?\s+(?:of\s+)?[\d.]+%\s+(?:were\s+)?(?:achieved|delivered|exceeded|hit))/i,
    direction: 'positive',
    verdict: 'value_created',
    confidence: 0.3,
    appliesTo: ['investment', 'any'],
  },
  {
    label: 'Synergies realised / value created',
    regex:
      /\b(?:synerg(?:ies|y)\s+(?:were\s+|are\s+)?(?:fully\s+|partially\s+)?realised|value\s+(?:was\s+)?created|integration\s+(?:was\s+)?successful)\b/i,
    direction: 'positive',
    verdict: 'value_created',
    confidence: 0.3,
    appliesTo: ['acquisition', 'any'],
  },
  {
    label: 'Strategic initiative launched + scaled',
    regex:
      /\b(?:initiative\s+(?:was\s+)?(?:launched|scaled)|launch\s+generated\s+\$?[\d.,]+\s*(?:million|billion|m|b)|expansion\s+(?:was\s+)?successful)\b/i,
    direction: 'positive',
    verdict: 'value_created',
    confidence: 0.3,
    appliesTo: ['strategic', 'any'],
  },

  // ── Negative outcomes ──────────────────────────────────────────────
  {
    label: 'Write-down / impairment',
    regex:
      /\b(?:wrote\s+down\s+(?:the\s+)?(?:deal|investment|position|stake)|impair(?:ed|ment)|loss(?:es)?\s+of\s+\$?[\d.,]+\s*(?:million|billion|m|b))\b/i,
    direction: 'negative',
    verdict: 'value_destroyed',
    confidence: 0.5,
    appliesTo: ['investment', 'acquisition', 'any'],
  },
  {
    label: 'Deal failed / no value',
    regex:
      /\b(?:deal\s+(?:was\s+)?(?:abandoned|terminated|cancelled|failed)|acquisition\s+(?:was\s+)?(?:abandoned|terminated|reversed))\b/i,
    direction: 'negative',
    verdict: 'value_destroyed',
    confidence: 0.5,
    appliesTo: ['acquisition', 'any'],
  },
  {
    label: 'Synergies missed',
    regex:
      /\b(?:synerg(?:ies|y)\s+(?:were\s+)?(?:not\s+realised|missed|undelivered|failed\s+to\s+materialise)|projected\s+synergies?\s+(?:were\s+)?(?:not\s+)?achieved)\b/i,
    direction: 'negative',
    verdict: 'value_destroyed',
    confidence: 0.4,
    appliesTo: ['acquisition', 'any'],
  },
  {
    label: 'IRR / MOIC missed',
    regex:
      /\b(?:irr\s+(?:was\s+|came\s+in\s+|fell\s+)?below\s+(?:the\s+)?(?:target|hurdle)|fund\s+(?:returned|delivered)\s+(?:only\s+)?[\d.]+%\s+against\s+(?:a\s+)?target\s+of\s+[\d.]+%|underperform(?:ed|ance))\b/i,
    direction: 'negative',
    verdict: 'value_destroyed',
    confidence: 0.4,
    appliesTo: ['investment', 'any'],
  },
  {
    label: 'Project / initiative abandoned',
    regex:
      /\b(?:project\s+(?:was\s+)?(?:abandoned|wound\s+down|killed|shut\s+down)|initiative\s+(?:was\s+)?(?:abandoned|paused\s+indefinitely|terminated))\b/i,
    direction: 'negative',
    verdict: 'value_destroyed',
    confidence: 0.45,
    appliesTo: ['strategic', 'any'],
  },
  {
    label: 'Bankruptcy / portfolio loss',
    regex:
      /\b(?:portfolio\s+company\s+(?:went\s+)?bankrupt|chapter\s+11|insolven(?:cy|t)|total\s+loss)\b/i,
    direction: 'negative',
    verdict: 'value_destroyed',
    confidence: 0.55,
    appliesTo: ['investment', 'any'],
  },

  // ── Mixed outcomes ─────────────────────────────────────────────────
  {
    label: 'Partial realisation',
    regex:
      /\b(?:partially\s+realised|mixed\s+(?:outcome|results)|some\s+(?:value|synergies)\s+(?:were\s+)?(?:captured|realised)\s+but)\b/i,
    direction: 'mixed',
    verdict: 'value_neutral',
    confidence: 0.3,
    appliesTo: ['any'],
  },
  {
    label: 'Below target but positive',
    regex:
      /\b(?:returned\s+[\d.]+%\s+(?:vs|versus|against)\s+(?:a\s+)?target\s+of\s+[\d.]+%\s+(?:short|below)|underperformed\s+(?:target|expectations)\s+but)\b/i,
    direction: 'mixed',
    verdict: 'value_neutral',
    confidence: 0.3,
    appliesTo: ['investment', 'any'],
  },

  // ── Too-early signals ──────────────────────────────────────────────
  {
    label: 'Too early to tell',
    regex:
      /\b(?:too\s+early\s+to\s+(?:tell|say|assess|judge)|outcome\s+(?:remains|is)\s+pending|results\s+(?:not\s+yet\s+)?available|currently\s+ongoing)\b/i,
    direction: 'too_early',
    verdict: 'too_early_to_tell',
    confidence: 0.25,
    appliesTo: ['any'],
  },
];

// ──────────────────────────────────────────────────────────────────────
// Metric extraction — pulls structured numeric outcome data
// ──────────────────────────────────────────────────────────────────────

interface MetricPattern {
  label: string;
  regex: RegExp;
}

const METRIC_PATTERNS: ReadonlyArray<MetricPattern> = [
  {
    label: 'IRR',
    regex: /\birr\s+(?:of\s+)?(\d+(?:\.\d+)?%)/i,
  },
  {
    label: 'MOIC',
    regex: /\bmoic\s+(?:of\s+)?(\d+(?:\.\d+)?x)/i,
  },
  {
    label: 'Realized synergy %',
    regex: /\b(\d+(?:\.\d+)?%)\s+(?:of\s+)?(?:projected\s+|expected\s+)?synerg/i,
  },
  {
    label: 'Exit / sale amount',
    regex: /\bexit(?:ed)?\s+at\s+\$?([\d.,]+)\s*(million|billion|m|b)\b/i,
  },
  {
    label: 'Write-down amount',
    regex: /\bwrote\s+down\s+\$?([\d.,]+)\s*(million|billion|m|b)\b/i,
  },
  {
    label: 'Fund return %',
    regex: /\bfund\s+returned\s+(\d+(?:\.\d+)?%)/i,
  },
  {
    label: 'Time to exit (months)',
    regex: /\b(?:exited|sold)\s+(?:after|in)\s+(\d+)\s+months?\b/i,
  },
];

// ──────────────────────────────────────────────────────────────────────
// Quote extraction — find the literal sentence around a regex match
// ──────────────────────────────────────────────────────────────────────

const SENTENCE_BOUNDARY = /(?<=[.!?])\s+(?=[A-Z])/;

function extractSentenceAround(content: string, matchIndex: number): string {
  // Find the sentence boundary nearest before + after the match
  const before = content.slice(0, matchIndex);
  const after = content.slice(matchIndex);

  // Walk back to the last sentence end before the match
  const sentencesBefore = before.split(SENTENCE_BOUNDARY);
  const lastSentenceStart =
    sentencesBefore.length > 0 ? sentencesBefore[sentencesBefore.length - 1] : '';

  // Walk forward to the next sentence end after the match
  const sentencesAfter = after.split(SENTENCE_BOUNDARY);
  const firstSentenceEnd = sentencesAfter.length > 0 ? sentencesAfter[0] : '';

  const combined = (lastSentenceStart + firstSentenceEnd).trim();
  // Cap at 300 chars to keep quotes readable
  return combined.length > 300 ? combined.slice(0, 297) + '...' : combined;
}

// ──────────────────────────────────────────────────────────────────────
// Public API — pure deterministic extractor (Tier 1)
// ──────────────────────────────────────────────────────────────────────

export interface ExtractorInput {
  sourceDocumentId: string;
  content: string;
  /** Container kind — narrows which patterns apply. */
  kind: 'investment' | 'acquisition' | 'strategic';
}

/**
 * Run the deterministic regex tier against a document. Returns null if
 * no outcome signals found — caller treats as "no extraction, user
 * fills in manually." Never fabricates an outcome.
 *
 * Pure function — same input → same output. No I/O, no network, no
 * LLM. Used as Tier 1 + as the fallback when the LLM tier fails.
 */
export function extractOutcomeDraftDeterministic(
  input: ExtractorInput
): ExtractedOutcomeDraft | null {
  const { sourceDocumentId, content, kind } = input;
  if (!content || content.length < 30) return null;

  // Collect all matches across patterns
  type Hit = {
    pattern: OutcomePattern;
    matchIndex: number;
    matchText: string;
  };
  const hits: Hit[] = [];
  for (const p of OUTCOME_PATTERNS) {
    if (!p.appliesTo.includes(kind) && !p.appliesTo.includes('any')) continue;
    // Global scan with reset
    const re = new RegExp(
      p.regex.source,
      p.regex.flags.includes('g') ? p.regex.flags : p.regex.flags + 'g'
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      hits.push({ pattern: p, matchIndex: m.index, matchText: m[0] });
      if (re.lastIndex === m.index) re.lastIndex++; // avoid infinite loop on zero-width
    }
  }

  if (hits.length === 0) return null;

  // Aggregate direction by confidence-weighted vote
  const directionTallies: Record<OutcomeDirection, number> = {
    positive: 0,
    negative: 0,
    mixed: 0,
    too_early: 0,
  };
  const verdictTallies: Record<OutcomeVerdict, number> = {
    value_created: 0,
    value_destroyed: 0,
    value_neutral: 0,
    too_early_to_tell: 0,
    unknown: 0,
  };
  for (const h of hits) {
    directionTallies[h.pattern.direction] += h.pattern.confidence;
    verdictTallies[h.pattern.verdict] += h.pattern.confidence;
  }

  // Pick the winner
  const direction = pickMax(directionTallies) as OutcomeDirection;
  const verdict = pickMax(verdictTallies) as OutcomeVerdict;

  // Extract verbatim quotes — one per fired pattern, dedup by quote
  const quoteSet = new Set<string>();
  const evidenceQuotes: string[] = [];
  for (const h of hits.slice(0, 5)) {
    const quote = extractSentenceAround(content, h.matchIndex);
    if (quote && !quoteSet.has(quote)) {
      quoteSet.add(quote);
      evidenceQuotes.push(quote);
    }
  }

  // Extract structured metrics
  const draftMetrics: ExtractedOutcomeDraft['draftMetrics'] = [];
  for (const mp of METRIC_PATTERNS) {
    const m = mp.regex.exec(content);
    if (!m) continue;
    const value = m[2] ? `${m[1]}${m[2]}` : m[1];
    const sourceQuote = extractSentenceAround(content, m.index);
    draftMetrics.push({ label: mp.label, value, sourceQuote });
  }

  // Compose draft narrative — single-line plain-language summary
  const draftNarrative = composeDraftNarrative(direction, hits, draftMetrics);

  // Confidence — capped sum of hit confidences. Multi-hit patterns
  // boost confidence; single low-confidence pattern stays low.
  const totalConfidence = Math.min(
    0.95,
    hits.reduce((acc, h) => acc + h.pattern.confidence, 0)
  );

  return {
    sourceDocumentId,
    evidenceQuotes,
    direction,
    verdict,
    draftNarrative,
    draftMetrics,
    extractionConfidence: totalConfidence,
    extractionTier: 'regex',
    extractedAt: new Date().toISOString(),
  };
}

function pickMax<K extends string>(tallies: Record<K, number>): K {
  let winner: K | null = null;
  let max = -1;
  for (const key of Object.keys(tallies) as K[]) {
    if (tallies[key] > max) {
      max = tallies[key];
      winner = key;
    }
  }
  return winner as K;
}

function composeDraftNarrative(
  direction: OutcomeDirection,
  hits: Array<{ pattern: OutcomePattern; matchText: string }>,
  metrics: ExtractedOutcomeDraft['draftMetrics']
): string {
  const topLabels = Array.from(new Set(hits.map(h => h.pattern.label))).slice(0, 3);
  const metricsLabels = metrics.slice(0, 2).map(m => `${m.label} ${m.value}`);

  const verdictPhrase = {
    positive: 'Decision delivered value',
    negative: 'Decision destroyed value',
    mixed: 'Mixed outcome',
    too_early: 'Too early to assess',
  }[direction];

  const signalsClause = topLabels.length > 0 ? ` (${topLabels.join(', ')})` : '';
  const metricsClause = metricsLabels.length > 0 ? `. Metrics: ${metricsLabels.join(', ')}` : '';

  return `${verdictPhrase}${signalsClause}${metricsClause}.`;
}

/**
 * Quick role-detection helper — given a document's content, classify
 * whether it looks more like a MEMO (decision document) or an OUTCOME
 * doc (retrospective / performance report). Used by the bulk uploader
 * to triage incoming files before pairing.
 *
 * Returns role + confidence 0-1.
 */
export function detectDocumentRole(content: string): {
  role: 'memo' | 'outcome' | 'mixed' | 'unknown';
  confidence: number;
} {
  if (!content || content.length < 50) {
    return { role: 'unknown', confidence: 0 };
  }

  const lower = content.toLowerCase();

  // Memo signals — pre-decision language
  const memoSignals = [
    /\b(?:executive\s+summary|recommendation|we\s+recommend)\b/i,
    /\b(?:thesis|investment\s+thesis|deal\s+rationale)\b/i,
    /\b(?:expected\s+(?:returns|synergies|outcomes)|projected\s+(?:irr|moic|revenue))\b/i,
    /\b(?:risks?\s+(?:include|to\s+consider|identified))\b/i,
    /\b(?:proceeds?\s+(?:to|with)\s+(?:investment|acquisition|decision)|approval\s+requested)\b/i,
    /\b(?:ic\s+memo|investment\s+memo|board\s+memo|board\s+deck)\b/i,
    /\b(?:committee\s+(?:approval|review|vote))\b/i,
  ];

  // Outcome signals — post-decision language
  const outcomeSignals = [
    /\b(?:post-mortem|retrospective|lessons\s+learned)\b/i,
    /\b(?:actual\s+(?:returns|irr|moic|outcome|performance))\b/i,
    /\b(?:vs\.?\s+(?:projected|expected|target))\b/i,
    /\b(?:realised|realized|delivered|achieved|missed)\s+(?:returns?|synerg(?:ies|y)|target)/i,
    /\b(?:exit(?:ed)?|sold|wrote\s+down|impaired|abandoned)\b/i,
    /\b(?:performance\s+review|portfolio\s+update|fund\s+(?:performance|return)\s+report)\b/i,
    /\b(?:year-(?:one|two|three)\s+(?:results|performance|review))\b/i,
  ];

  let memoHits = 0;
  let outcomeHits = 0;
  for (const re of memoSignals) {
    if (re.test(lower)) memoHits++;
  }
  for (const re of outcomeSignals) {
    if (re.test(lower)) outcomeHits++;
  }

  // Both → mixed (a doc that talks about the decision AND its outcome)
  if (memoHits >= 2 && outcomeHits >= 2) {
    return {
      role: 'mixed',
      confidence: Math.min(0.85, 0.3 + (memoHits + outcomeHits) * 0.07),
    };
  }
  if (memoHits === 0 && outcomeHits === 0) {
    return { role: 'unknown', confidence: 0 };
  }

  // Score by ratio
  const total = memoHits + outcomeHits;
  if (memoHits > outcomeHits) {
    return {
      role: 'memo',
      confidence: Math.min(0.92, 0.4 + memoHits * 0.1 + (memoHits / total) * 0.2),
    };
  }
  return {
    role: 'outcome',
    confidence: Math.min(0.92, 0.4 + outcomeHits * 0.1 + (outcomeHits / total) * 0.2),
  };
}

// Re-exports for tests
export { OUTCOME_PATTERNS as OUTCOME_PATTERNS_EXPORTED };
export { METRIC_PATTERNS as METRIC_PATTERNS_EXPORTED };
