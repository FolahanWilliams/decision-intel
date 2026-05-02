#!/usr/bin/env node
/**
 * Drift-class count ratchet — scans for hardcoded plural-count literals on
 * the canonical-source axes (biases / frameworks / cases / pipeline-nodes /
 * pipeline-models / judges) and fails when the total exceeds the baseline
 * recorded below.
 *
 * Why this exists: between 2026-04-25 and 2026-05-01 the codebase shipped
 * FOUR separate audits each catching the same bug class — a marketing
 * surface or chat preamble carrying a hardcoded "17 frameworks" or
 * "20 biases" while the underlying registry had grown. CLAUDE.md locks
 * the count-derivation rule in five places. This linter is the
 * prophylactic — instead of catching drift retroactively in audit-N, it
 * fails the commit at write-time when a new hardcoded count lands.
 *
 * Pattern mirrors `scripts/lint-silent-catches.mjs`:
 *   - ratchet, not hard-zero (the codebase has many legitimate counts —
 *     content quotes, per-section subset counts, comparison comments,
 *     historical timeline notes in CLAUDE.md, jspdf-rendered numbers,
 *     etc.; the ratchet captures them at baseline).
 *   - new entries must replace an existing one OR derive from the
 *     canonical constant OR carry a `// drift-tolerant — <reason>`
 *     comment on the same / preceding line.
 *
 * Canonical sources (use these instead of literals when possible):
 *   - biases               → BIAS_EDUCATION.length / BIAS_COUNT
 *                            (src/lib/constants/bias-education.ts)
 *   - frameworks           → getAllRegisteredFrameworks().length
 *                            (src/lib/compliance/frameworks/index.ts)
 *   - cases / case studies → HISTORICAL_CASE_COUNT or ALL_CASES.length
 *                            (src/lib/data/case-studies/index.ts)
 *   - pipeline nodes       → PIPELINE_NODES.length
 *                            (src/lib/data/pipeline-nodes.ts)
 *
 * Wired into pre-commit via `npm run lint:counts`.
 *
 * If a new literal is genuinely fixed (historical reference,
 * version-locked artefact, scoped subset count, content quote):
 *   1. Add an inline `// drift-tolerant — <one-line reason>` comment
 *      on the same line OR the line above.
 *   2. The ratchet recognises the marker and skips it.
 *   3. The comment IS the audit trail.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_PATHS = [
  join(ROOT, 'src'),
  join(ROOT, 'CLAUDE.md'),
  join(ROOT, 'TODO.md'),
];

// Baseline as of 2026-05-01 (the commit shipping this linter). Captured
// AFTER the genuinely-stale literals were fixed in the same commit. The
// remaining counted literals are: scoped subset counts (e.g. "10
// frameworks across African markets"), historical timeline references
// in CLAUDE.md / chat preamble, content quotes citing specific case
// studies (e.g. "Musk DQI 41/D: 6 biases detected"), and a small number
// of known-stable canonical references (e.g. "12 pipeline nodes" where
// the 12 IS PIPELINE_NODES.length but the literal is in a content
// string). New count literals must replace one of these or annotate
// with `// drift-tolerant`.
const COUNT_BASELINE = 82;

// Plural nouns we audit. Each must have a canonical source-of-truth in
// the codebase; adding a new noun here requires adding the canonical
// constant + a docs note in CLAUDE.md > Critical Conventions.
const COUNTED_NOUNS = [
  'biases',
  'frameworks',
  'cases',
  'case studies',
  'pipeline nodes',
  'pipeline-nodes',
  'judges',
  'models',
];

// The regex requires a SPACE between the digit and the noun.
// "12-week" / "12-month" / "12mo" / "12am" are NOT counts.
const COUNT_LITERAL = new RegExp(
  String.raw`(?<![\w.-])(\d{1,3})\s+(${COUNTED_NOUNS.join('|')})(?![\w])`,
  'gi'
);

// Canonical-source signals. If any appears within ±CONTEXT_LINES of the
// literal, the literal is the rendered output of a canonical
// interpolation (e.g. `${BIAS_COUNT} biases`).
const CANONICAL_SIGNALS = [
  'BIAS_COUNT',
  'BIAS_EDUCATION',
  'FRAMEWORK_COUNT',
  'getAllRegisteredFrameworks',
  'HISTORICAL_CASE_COUNT',
  'ALL_CASES',
  'PIPELINE_NODES',
  '${',
];
const CONTEXT_LINES = 2;

// Inline opt-out marker. Mirrors @schema-drift-tolerant.
const DRIFT_TOLERANT_MARKER = /drift-tolerant/i;

const SKIP_PATH = /(?:node_modules|\.next|dist|coverage|playwright-report|test-results|\.serena)/;
const TEXT_EXT = /\.(?:ts|tsx|md|mdx|js|mjs)$/;

function walk(target, out = []) {
  let stat;
  try {
    stat = statSync(target);
  } catch {
    return out;
  }
  if (stat.isFile()) {
    if (TEXT_EXT.test(target) && !SKIP_PATH.test(target)) out.push(target);
    return out;
  }
  for (const name of readdirSync(target)) {
    const path = join(target, name);
    if (SKIP_PATH.test(path)) continue;
    try {
      const child = statSync(path);
      if (child.isDirectory()) walk(path, out);
      else if (TEXT_EXT.test(name)) out.push(path);
    } catch {
      // unreadable / symlink loop — skip silently
    }
  }
  return out;
}

const offenders = [];
for (const scanRoot of SCAN_PATHS) {
  const files = walk(scanRoot);
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/\d \w/.test(line)) continue;
      const matches = [...line.matchAll(COUNT_LITERAL)];
      if (matches.length === 0) continue;

      const start = Math.max(0, i - CONTEXT_LINES);
      const end = Math.min(lines.length - 1, i + CONTEXT_LINES);
      const ctx = lines.slice(start, end + 1).join('\n');

      const isCanonical = CANONICAL_SIGNALS.some(sig => ctx.includes(sig));
      const isOptOut =
        DRIFT_TOLERANT_MARKER.test(line) ||
        (i > 0 && DRIFT_TOLERANT_MARKER.test(lines[i - 1]));
      if (isCanonical || isOptOut) continue;

      for (const m of matches) {
        offenders.push({
          file: relative(ROOT, file),
          line: i + 1,
          literal: m[0].trim(),
          snippet: line.trim().slice(0, 140),
        });
      }
    }
  }
}

const total = offenders.length;
if (total > COUNT_BASELINE) {
  console.error(
    `\n❌ count-drift ratchet: ${total} hardcoded count literals found, baseline is ${COUNT_BASELINE}.`
  );
  console.error(
    `   ${total - COUNT_BASELINE} new hardcoded count(s) introduced. Either:`
  );
  console.error(
    '     (a) interpolate from the canonical (e.g. `${BIAS_COUNT} biases`),'
  );
  console.error('     (b) replace with `getAllRegisteredFrameworks().length`,');
  console.error(
    '     (c) add an inline `// drift-tolerant — <reason>` comment on the'
  );
  console.error(
    '         same line / line above naming why the literal is fixed,'
  );
  console.error(
    '     (d) replace an existing offender (so net count stays at baseline),'
  );
  console.error(
    '     (e) bump COUNT_BASELINE in scripts/lint-counts.mjs alongside an'
  );
  console.error(
    '         inline comment naming the new acceptable class — discouraged;'
  );
  console.error(
    '         the right move is almost always (a)-(c).'
  );
  console.error('');
  console.error('   Recent offenders (last 25 by file order):');
  for (const o of offenders.slice(-25)) {
    console.error(
      `     ${o.file}:${o.line}  «${o.literal}»  ${o.snippet.length > 100 ? o.snippet.slice(0, 100) + '…' : o.snippet}`
    );
  }
  console.error('');
  process.exit(1);
}

if (total < COUNT_BASELINE) {
  console.log(
    `✓ count-drift ratchet: ${total} count literals (baseline ${COUNT_BASELINE}; ${COUNT_BASELINE - total} below — bump baseline down in lint-counts.mjs).`
  );
} else {
  console.log(`✓ count-drift ratchet: ${total} count literals at baseline.`);
}
