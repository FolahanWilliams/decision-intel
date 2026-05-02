#!/usr/bin/env node
/**
 * Silent-catch ratchet — scans src/ for `.catch(... => null/undefined/{}/[]/false/'')`
 * and fails when the total count exceeds the baseline below.
 *
 * Why this exists: CLAUDE.md "Fire-and-forget error handling" rule + the saved
 * memory `feedback-fire-and-forget-exceptions-need-comments`. Silent catches
 * on fire-and-forget operations (Slack/email nudges, audit-log writes, playbook
 * counters, status transitions, graph edge updates) are the exact bug class
 * that masks production failures as "no data yet." Some silent catches ARE
 * legitimate (in-memory cache cleanup, schema-drift tolerance with a comment,
 * `req.json().catch(() => null)` body parsing, localStorage in private-mode
 * Safari) — those keep their place. The 96 baseline is the snapshot today;
 * any new entry needs to replace an existing one or come with an explicit
 * bump in this file alongside an inline comment justifying the exception.
 *
 * Run via `npm run lint:silent-catches`. Wired into pre-commit.
 *
 * If you legitimately need to add a silent catch:
 *   1. Add the catch with an inline comment naming the exception class.
 *   2. Bump SILENT_CATCH_BASELINE here in the same commit.
 *   3. The comment IS the audit trail per the saved memory.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIR = join(ROOT, 'src');

// Baseline count as of 2026-04-28 (the commit shipping this linter).
// All 119 sites at baseline have been audited as legitimate exceptions per
// CLAUDE.md Components & Patterns > Fire-and-forget error handling: in-memory
// cache cleanup (lib/utils/cache.ts), schema-drift tolerance with @schema-
// drift-tolerant comments, `req.json().catch(() => null)` body parsing,
// localStorage in private-mode Safari, fetch+stats null fallbacks rendered
// as empty UI states. Bumping is allowed; reducing is encouraged. Never
// silently drift up.
// 2026-05-01: bumped 117 → 118 for the new res.json().catch(() => null)
// in src/app/(platform)/documents/[id]/page.tsx refetchDocument — body
// parsing on a non-2xx response so we can surface the API's error message
// (per CLAUDE.md fire-and-forget exception list, body parsing is allowed).
// 2026-05-01 (Phase 2 DPR fix): bumped 118 → 119 for the new
// res.json().catch(() => null) in handleProvenanceRecordExport — same
// body-parsing pattern (parse the API error body so the toast shows the
// real diagnostic instead of generic "Failed to generate record").
const SILENT_CATCH_BASELINE = 119;

// Match `.catch(arg => trivial)` and `.catch((arg) => trivial)` and
// `.catch(() => trivial)`, where `trivial` is null / undefined / {} / [] /
// false / true / 0 / '' / "". Also catches multi-line variants where the
// arrow body is on the same line.
const SILENT_CATCH = /\.catch\s*\(\s*(?:\([^)]*\)|[a-zA-Z_$][\w$]*)?\s*=>\s*(?:null|undefined|\{\s*\}|\[\s*\]|false|true|0|''|"")\s*\)/g;

const TS_EXT = /\.(?:ts|tsx)$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      // Skip generated + vendored output.
      if (name === 'node_modules' || name === '.next' || name === 'dist') continue;
      walk(path, out);
    } else if (TS_EXT.test(name)) {
      out.push(path);
    }
  }
  return out;
}

const offenders = [];
for (const file of walk(SCAN_DIR)) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const matches = lines[i].match(SILENT_CATCH);
    if (matches) {
      for (let m = 0; m < matches.length; m++) {
        offenders.push({
          file: relative(ROOT, file),
          line: i + 1,
          snippet: lines[i].trim().slice(0, 140),
        });
      }
    }
  }
}

const total = offenders.length;
if (total > SILENT_CATCH_BASELINE) {
  console.error(
    `\n❌ silent-catch lint: ${total} silent catches found, baseline is ${SILENT_CATCH_BASELINE}.`
  );
  console.error(
    `   ${total - SILENT_CATCH_BASELINE} new silent catch(es) introduced. ` +
      `Either replace an existing one, upgrade the new one to log.warn, or ` +
      `bump SILENT_CATCH_BASELINE in scripts/lint-silent-catches.mjs with ` +
      `an inline comment naming the exception class (see CLAUDE.md ` +
      `Components & Patterns > Fire-and-forget error handling).\n`
  );
  console.error('   Recent silent catches (last 20 by file order):');
  for (const o of offenders.slice(-20)) {
    console.error(`     ${o.file}:${o.line}  ${o.snippet}`);
  }
  process.exit(1);
}

if (total < SILENT_CATCH_BASELINE) {
  console.log(
    `✓ silent-catch lint: ${total} silent catches (baseline ${SILENT_CATCH_BASELINE}; ` +
      `${SILENT_CATCH_BASELINE - total} below — bump baseline down in lint-silent-catches.mjs).`
  );
} else {
  console.log(`✓ silent-catch lint: ${total} silent catches at baseline.`);
}
