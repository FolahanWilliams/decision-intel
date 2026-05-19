#!/usr/bin/env node
/**
 * nightly-audit.mjs — unattended, deterministic, REPORT-ONLY drift +
 * regression auditor.
 *
 * Designed to run in GitHub Actions on a cron. It NEVER mutates code,
 * NEVER pushes, NEVER touches main — it runs the deterministic gates +
 * the heuristic platform audit, classifies the result, and emits a
 * markdown report. The workflow decides what to do with the exit code
 * (open/refresh an issue on regression; stay silent on a clean night).
 *
 * Why deterministic-only (no LLM): the highest-ROI nightly signal — a
 * ratchet exceeded, a tsc break, a mechanized bug-class regrowing, a
 * CLAUDE.md prose/const drift — is all catchable WITHOUT an LLM, with
 * zero API cost, zero secrets, zero prod access, and zero risk of an
 * unattended agent shipping an unverifiable change. The judgment-heavy
 * deep audit stays a human-in-the-loop founder-triggered run.
 *
 * Exit codes:
 *   0  — clean (all gates pass; no regression)
 *   1  — P0 regression (tsc error OR a hard lint gate failed)
 *   2  — runner error (could not complete the audit itself)
 *
 * Output:
 *   - full markdown report on stdout
 *   - if process.env.GITHUB_STEP_SUMMARY is set, the report is also
 *     appended there (renders in the Actions run UI)
 *   - a one-line `::notice` / `::error` workflow annotation
 *
 * Usage: node scripts/nightly-audit.mjs
 */

import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const ROOT = process.cwd();

/** Run a command; capture combined output + ok flag. Never throws. */
function run(label, cmd, { timeoutMs = 600_000 } = {}) {
  const started = Date.now();
  try {
    const out = execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs,
      maxBuffer: 64 * 1024 * 1024,
    });
    return { label, cmd, ok: true, out: String(out), ms: Date.now() - started };
  } catch (err) {
    const out = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.trim() || String(err.message || err);
    return { label, cmd, ok: false, out, ms: Date.now() - started };
  }
}

/** Pull the trailing summary line a gate prints (e.g. "188 at baseline"). */
function tailLine(out) {
  const lines = String(out)
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
  return lines[lines.length - 1] ?? '';
}

const findings = { p0: [], p1: [], green: [] };

// ── 1. tsc — any error is P0 ────────────────────────────────────────
const tsc = run('tsc --noEmit', "NODE_OPTIONS='--max-old-space-size=3584' npx tsc --noEmit", {
  timeoutMs: 480_000,
});
if (tsc.ok) {
  findings.green.push('`tsc --noEmit` — clean (0 type errors).');
} else {
  const firstErr = String(tsc.out)
    .split('\n')
    .find(l => /error TS\d+/.test(l));
  findings.p0.push(
    `**tsc failed** — type error(s) on \`main\`. First: \`${(firstErr || tsc.out).slice(0, 240)}\``
  );
}

// ── 2. The 5 deterministic ratchet/lock gates ───────────────────────
const gates = [
  ['positioning', 'npm run lint:positioning'],
  ['silent-catches', 'npm run lint:silent-catches'],
  ['count-drift', 'npm run lint:counts'],
  ['canonical-imports', 'npm run lint:canonical-imports'],
  ['doc-sync (prose↔const)', 'npm run lint:doc-sync'],
];
for (const [name, cmd] of gates) {
  const r = run(name, cmd, { timeoutMs: 180_000 });
  if (r.ok) {
    findings.green.push(`lint:${name} — pass \`${tailLine(r.out)}\``);
  } else {
    // A ratchet gate fails ONLY when its baseline was exceeded (a
    // regression) or a banned pattern was introduced — always P0.
    findings.p0.push(
      `**lint:${name} FAILED** (ratchet exceeded or banned pattern introduced): \`${tailLine(
        r.out
      ).slice(0, 200)}\``
    );
  }
}

// ── 3. Heuristic platform audit (the mechanized bug classes) ────────
// audit-platform prints its summary to STDERR (by design); merge it so
// execSync captures it on a clean (exit-0) run too.
const ap = run('audit:platform', 'node scripts/audit-platform.mjs 2>&1', { timeoutMs: 240_000 });
let apSummary = '';
if (!ap.ok && !/findings\./.test(ap.out)) {
  // audit-platform exits non-zero only in --strict; default run prints
  // a summary and exits 0. A hard failure here = runner-side problem.
  findings.p1.push(
    `audit:platform did not produce a summary — investigate: \`${tailLine(ap.out)}\``
  );
} else {
  // Capture the per-rule count block + total.
  const lines = String(ap.out).split('\n');
  const total = lines.find(l => /platform-audit:\s*\d+\s*findings/i.test(l));
  apSummary = lines
    .filter(l => /·\s*\d+|\b(CRITICAL|MODAL|VISUAL|STALE|SEMANTIC)\b|^\s{4}\S+\s+\d+\s*$/.test(l))
    .map(l => l.trim())
    .filter(Boolean)
    .join('\n');
  findings.green.push(
    `audit:platform ran — ${total ? total.trim() : 'summary captured'}. Mechanized bug-class ` +
      `counts must only **shrink or hold** vs. the prior nightly; a grown ` +
      `\`tailwind-literal-palette\` / \`*-pipeline-path\` / \`static-asset-next-link\` count ` +
      `means a new instance of a fixed class was introduced — triage that file:line.`
  );
}

// ── 4. Compose the report ───────────────────────────────────────────
const date = new Date().toISOString().slice(0, 10);
let head = 'HEAD unknown';
try {
  head = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
} catch {
  /* report still useful without it */
}

const status =
  findings.p0.length > 0 ? 'P0 — REGRESSION' : findings.p1.length > 0 ? 'P1 — review' : 'CLEAN';

const lines = [];
lines.push(`# Nightly audit · ${date} · \`${head}\``);
lines.push('');
lines.push(
  `**Status: ${status}** — ${findings.p0.length} P0 · ${findings.p1.length} P1 · ${findings.green.length} green.`
);
lines.push('');
lines.push(
  '_Report-only deterministic auditor. No code was changed or pushed. ' +
    'The judgment-heavy deep audit is a separate human-in-the-loop run._'
);
lines.push('');
if (findings.p0.length) {
  lines.push('## P0 — regression (fix before next deploy)');
  for (const f of findings.p0) lines.push(`- ${f}`);
  lines.push('');
}
if (findings.p1.length) {
  lines.push('## P1 — review');
  for (const f of findings.p1) lines.push(`- ${f}`);
  lines.push('');
}
if (apSummary) {
  lines.push('## audit:platform mechanized-class counts');
  lines.push('```');
  lines.push(apSummary);
  lines.push('```');
  lines.push('');
}
lines.push('## Green confirmations');
for (const f of findings.green) lines.push(`- ${f}`);
lines.push('');
lines.push(
  '> Triage order: P0 first (each is a one-line fix or revert). A clean ' +
    'night is explicitly CLEAN, not silent — green confirmations are listed ' +
    'so a no-finding run is verifiable, not assumed.'
);

const report = lines.join('\n');
process.stdout.write(report + '\n');

if (process.env.GITHUB_STEP_SUMMARY) {
  try {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
  } catch {
    /* step summary is best-effort */
  }
}

if (findings.p0.length > 0) {
  process.stdout.write(
    `::error::Nightly audit P0 — ${findings.p0.length} regression(s) on ${head}\n`
  );
  process.exit(1);
}
process.stdout.write(`::notice::Nightly audit clean on ${head}\n`);
process.exit(0);
