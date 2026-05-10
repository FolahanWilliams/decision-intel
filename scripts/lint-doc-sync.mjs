#!/usr/bin/env node
/**
 * Doc-sync lint — fails when CLAUDE.md prose drifts from the canonical
 * const value of a ratchet baseline by more than 2.
 *
 * Why this exists: the 2026-05-10 deep nightly audit caught CLAUDE.md
 * prose claiming "silent-catch baseline 155" while the const at
 * scripts/lint-silent-catches.mjs:102 had drifted to 152. Per the
 * silent-catch ratchet's own forward-looking discipline lock:
 *
 *   "if they diverge by >2, the audit reports that as a CLAUDE.md
 *    staleness bug."
 *
 * Single-source-of-truth via discipline failed twice in a month
 * (2026-04-28 → 2026-05-05 → 2026-05-10). Single-source-of-truth via
 * automation makes the drift impossible to land. This script enforces
 * the rule structurally — every commit that bumps a baseline const
 * MUST bump the prose in CLAUDE.md within ±2.
 *
 * Forward-looking rule: when adding a new ratchet linter (e.g.
 * lint-css-tokens, lint-banned-imports), add the BASELINES entry
 * below + the prose pattern that mentions the canonical baseline.
 *
 * Wired into pre-commit via `npm run lint:doc-sync`.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const CLAUDE_MD = join(ROOT, 'CLAUDE.md');
const TOLERANCE = 2;

/**
 * Each entry pairs a ratchet baseline with the prose pattern that
 * should mention it in CLAUDE.md. The script extracts both values and
 * fails when |const - prose| > TOLERANCE.
 *
 * `constFile` — script path containing the canonical const.
 * `constPattern` — regex with a single capture group for the integer.
 * `proseLabel` — human-readable label for error messages.
 * `prosePattern` — regex matching the prose claim; first capture group
 *   is the integer the prose asserts.
 *
 * Multiple prose mentions are allowed; the script checks the LAST
 * occurrence (most recent in the trajectory line). If a single prose
 * pattern matches multiple distinct numbers (e.g. trajectory chain
 * "→ 154 → 155 → 153"), only the FINAL number in the chain is
 * compared against the const.
 */
const BASELINES = [
  {
    name: 'silent-catch ratchet',
    constFile: 'scripts/lint-silent-catches.mjs',
    constPattern: /SILENT_CATCH_BASELINE\s*=\s*(\d{1,4})/,
    proseLabel: 'silent-catch baseline',
    /**
     * Matches the canonical CLAUDE.md prose line:
     *   "Actual baseline as of 2026-05-10 = **153**"
     * Extracts the final number on that line.
     */
    prosePattern: /Actual baseline as of [\d-]+\s*=\s*\*\*(\d{1,4})\*\*/,
  },
  {
    name: 'count-drift ratchet',
    constFile: 'scripts/lint-counts.mjs',
    constPattern: /COUNT_BASELINE\s*=\s*(\d{1,4})/,
    proseLabel: 'count-drift baseline',
    /**
     * Matches the canonical CLAUDE.md prose line that surfaces in
     * Quality-gates references — e.g. "counts at baseline 80". This is
     * a softer match (no asterisks) but unique because the lint is
     * "counts at baseline N". The final occurrence wins.
     */
    prosePattern: /counts\s+at\s+baseline\s+(\d{1,4})/i,
  },
];

function readConstValue(entry) {
  const path = join(ROOT, entry.constFile);
  const src = readFileSync(path, 'utf-8');
  const match = src.match(entry.constPattern);
  if (!match) {
    throw new Error(
      `[doc-sync] could not extract const from ${entry.constFile} using pattern ${entry.constPattern}`
    );
  }
  return Number(match[1]);
}

function readProseValue(claudeMd, entry) {
  // Find ALL matches; the script asserts against the LAST one (most
  // recent in any trajectory chain).
  const re = new RegExp(entry.prosePattern, 'gi');
  const matches = [...claudeMd.matchAll(re)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1];
  return Number(last[1]);
}

function main() {
  let claudeMd;
  try {
    claudeMd = readFileSync(CLAUDE_MD, 'utf-8');
  } catch (err) {
    console.error(`[doc-sync] failed to read CLAUDE.md: ${err.message}`);
    process.exit(1);
  }

  const failures = [];

  for (const entry of BASELINES) {
    let constValue;
    try {
      constValue = readConstValue(entry);
    } catch (err) {
      failures.push({
        name: entry.name,
        kind: 'const-missing',
        message: err.message,
      });
      continue;
    }

    const proseValue = readProseValue(claudeMd, entry);
    if (proseValue === null) {
      failures.push({
        name: entry.name,
        kind: 'prose-missing',
        message: `[doc-sync] could not find ${entry.proseLabel} prose in CLAUDE.md (pattern: ${entry.prosePattern})`,
        constValue,
      });
      continue;
    }

    const drift = Math.abs(constValue - proseValue);
    if (drift > TOLERANCE) {
      failures.push({
        name: entry.name,
        kind: 'drift',
        constValue,
        proseValue,
        drift,
      });
    }
  }

  if (failures.length === 0) {
    console.log(
      `✓ doc-sync lint: ${BASELINES.length} ratchet baselines in sync with CLAUDE.md prose (tolerance ±${TOLERANCE}).`
    );
    process.exit(0);
  }

  console.error('❌ doc-sync lint: CLAUDE.md prose has drifted from canonical const value(s).');
  console.error('');
  for (const f of failures) {
    if (f.kind === 'drift') {
      console.error(
        `  • ${f.name}: const=${f.constValue} vs prose=${f.proseValue} (drift ${f.drift} > ${TOLERANCE} tolerance)`
      );
    } else {
      console.error(`  • ${f.name}: ${f.message}`);
    }
  }
  console.error('');
  console.error(
    '  Fix: update the CLAUDE.md prose to match the canonical const value, then re-commit.'
  );
  console.error(
    '  See CLAUDE.md silent-catch ratchet lock — every baseline bump must update (i) the const, (ii) the trajectory comment, (iii) the CLAUDE.md prose in lockstep.'
  );
  process.exit(1);
}

main();
