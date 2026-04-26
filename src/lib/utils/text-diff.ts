/**
 * Minimal line-level text diff (2.3 deep).
 *
 * Computes a Myers-style LCS diff between two strings, returning an
 * array of segments tagged 'add' | 'remove' | 'context'. Pure JS, no
 * dependencies — the memo diff viewer doesn't need full git-grade
 * fidelity, just a clean side-by-side rendering of what changed
 * between v1 and v2.
 *
 * Strategy:
 *   - Tokenise both inputs by line.
 *   - Build the LCS table on a windowed slice (max 2000 lines/side) so
 *     a 50-page memo doesn't blow memory.
 *   - Walk back the table to emit the diff.
 *
 * For very large inputs we fall back to a head-tail trim — same lines
 * at the top + bottom collapse to a 'context' marker.
 */

export type DiffSegmentType = 'add' | 'remove' | 'context';

export interface DiffSegment {
  type: DiffSegmentType;
  text: string;
  /** 1-based line index in the source side ('remove') or target side ('add'). */
  lineNumber?: number;
}

const MAX_LINES_PER_SIDE = 2000;

function tokenise(s: string): string[] {
  if (!s) return [];
  return s.replace(/\r\n/g, '\n').split('\n');
}

/**
 * Compute the LCS length table for two arrays. O(m * n) memory; we
 * cap inputs at MAX_LINES_PER_SIDE to bound this.
 */
function buildLcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i < m; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (a[i] === b[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }
  return dp;
}

function backtrack(a: string[], b: string[], dp: number[][]): DiffSegment[] {
  const out: DiffSegment[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out.unshift({ type: 'context', text: a[i - 1], lineNumber: i });
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      out.unshift({ type: 'remove', text: a[i - 1], lineNumber: i });
      i -= 1;
    } else {
      out.unshift({ type: 'add', text: b[j - 1], lineNumber: j });
      j -= 1;
    }
  }
  while (i > 0) {
    out.unshift({ type: 'remove', text: a[i - 1], lineNumber: i });
    i -= 1;
  }
  while (j > 0) {
    out.unshift({ type: 'add', text: b[j - 1], lineNumber: j });
    j -= 1;
  }
  return out;
}

export interface TextDiffResult {
  segments: DiffSegment[];
  stats: {
    added: number;
    removed: number;
    unchanged: number;
    truncated: boolean;
  };
}

export function computeTextDiff(before: string, after: string): TextDiffResult {
  const aFull = tokenise(before);
  const bFull = tokenise(after);
  const truncated = aFull.length > MAX_LINES_PER_SIDE || bFull.length > MAX_LINES_PER_SIDE;
  const a = aFull.slice(0, MAX_LINES_PER_SIDE);
  const b = bFull.slice(0, MAX_LINES_PER_SIDE);

  const dp = buildLcsTable(a, b);
  const segments = backtrack(a, b, dp);

  let added = 0;
  let removed = 0;
  let unchanged = 0;
  for (const s of segments) {
    if (s.type === 'add') added += 1;
    else if (s.type === 'remove') removed += 1;
    else unchanged += 1;
  }

  if (truncated) {
    segments.push({
      type: 'context',
      text: `… diff truncated at ${MAX_LINES_PER_SIDE} lines per side. Inspect full memos directly to compare beyond this window.`,
    });
  }

  return { segments, stats: { added, removed, unchanged, truncated } };
}

/**
 * Collapse long runs of unchanged lines so the rendered diff stays
 * readable. Preserves up to `context` lines on each side of any change
 * cluster; collapses the rest into a single sentinel segment with the
 * count of lines hidden.
 */
export function collapseUnchanged(segments: DiffSegment[], context = 2): DiffSegment[] {
  const out: DiffSegment[] = [];
  let runStart = -1;
  let i = 0;
  while (i < segments.length) {
    const s = segments[i];
    if (s.type !== 'context') {
      out.push(s);
      runStart = -1;
      i += 1;
      continue;
    }
    // Find the length of this context run.
    let runEnd = i;
    while (runEnd < segments.length && segments[runEnd].type === 'context') runEnd += 1;
    const runLen = runEnd - i;
    if (runLen <= context * 2 + 1) {
      // Short enough to keep verbatim.
      for (let k = i; k < runEnd; k += 1) out.push(segments[k]);
    } else {
      // Tail of previous change cluster.
      if (out.length > 0) {
        for (let k = 0; k < context; k += 1) out.push(segments[i + k]);
      }
      const hidden = runLen - context * 2;
      out.push({
        type: 'context',
        text: `… ${hidden} unchanged line${hidden === 1 ? '' : 's'} …`,
      });
      // Head of next change cluster.
      if (runEnd < segments.length) {
        for (let k = runEnd - context; k < runEnd; k += 1) out.push(segments[k]);
      }
    }
    runStart = -1;
    i = runEnd;
  }
  void runStart;
  return out;
}
