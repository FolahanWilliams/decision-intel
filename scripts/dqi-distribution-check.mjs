#!/usr/bin/env node
/**
 * DQI distribution check report — procurement deliverable (P4 ship 2026-05-11).
 *
 * Runs the held-out-sample DQI regression check and emits a Markdown
 * report you can attach to procurement responses. When a buyer asks
 * "how do I know your score is accurate?", point them at the latest
 * report + the vitest test suite that runs in CI on every commit.
 *
 * Usage:
 *   node scripts/dqi-distribution-check.mjs                # stdout
 *   node scripts/dqi-distribution-check.mjs --out FILE     # write to FILE
 *
 * Default output path when --out is not supplied:
 *   docs/dqi-distribution-checks/dqi-distribution-check-<DATE>.md
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outArg = outIdx >= 0 ? args[outIdx + 1] : null;

// Use tsx to execute the TS module directly — keeps the report generator
// in the canonical TS module instead of duplicating the logic in JS.
const repoRoot = resolve(import.meta.dirname, '..');
const runnerScript = `
import { runDistributionCheck, formatDistributionReportMarkdown } from '${join(repoRoot, 'src/lib/scoring/dqi-distribution-check.ts').replace(/\\\\/g, '/')}';
const report = runDistributionCheck();
process.stdout.write(formatDistributionReportMarkdown(report));
`;

const result = spawnSync('npx', ['tsx', '-e', runnerScript], {
  cwd: repoRoot,
  encoding: 'utf8',
});

if (result.status !== 0) {
  console.error('DQI distribution check failed:');
  console.error(result.stderr);
  process.exit(result.status ?? 1);
}

const markdown = result.stdout;

if (outArg) {
  const outPath = resolve(outArg);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, markdown, 'utf8');
  console.log(`Wrote distribution check report to ${outPath}`);
} else {
  // Default: write to a dated file in docs/dqi-distribution-checks/
  const today = new Date().toISOString().slice(0, 10);
  const outDir = join(repoRoot, 'docs', 'dqi-distribution-checks');
  const outPath = join(outDir, `dqi-distribution-check-${today}.md`);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, markdown, 'utf8');
  console.log(`Wrote distribution check report to ${outPath}`);
  console.log('');
  console.log(markdown);
}
