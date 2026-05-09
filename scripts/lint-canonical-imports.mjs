#!/usr/bin/env node
/**
 * Canonical-import ratchet — blocks new local re-implementations of
 * functions that have a canonical export.
 *
 * Why this exists: between 2026-04-27 (slop-scan Phase 3 dedup) and
 * 2026-05-09 (Tier 1 hygiene cascade), the codebase shipped 30+
 * hand-rolled copies of formatBiasName / severityColor / gradeFromScore
 * / formatDate / truncate / extractIp. CLAUDE.md memory
 * `feedback-search-canonical-before-extracting` codifies the rule:
 * before writing a small utility, grep for an existing equivalent.
 * This linter is the prophylactic — instead of catching drift
 * retroactively in audit-N, it fails the commit at write-time.
 *
 * The drift class is real and procurement-grade dangerous. The
 * 2026-04-27 sweep caught quick-score.ts:scoreToGrade using 90/70/50/30
 * instead of canonical 85/70/55/40 — the public quick-score endpoint
 * had been returning grade letters that didn't match the rest of the
 * platform. The 2026-05-09 Tier 1.3 sweep caught conviction.ts:getGrade
 * using `score >= 50` for C grade instead of `>= 55`. Same drift
 * class, six months apart.
 *
 * Pattern mirrors `scripts/lint-counts.mjs` and
 * `scripts/lint-silent-catches.mjs`:
 *   - ratchet, not hard-zero (legitimate domain-specific helpers
 *     exist — _brief-shared.ts:formatBiasName uses a custom short-
 *     label catalog; founder-os/InteractiveSfcMatrix:severityColor
 *     takes a numeric score not a string; etc.).
 *   - new entries must replace an existing offender OR carry a
 *     `// canonical-exception — <reason>` comment naming the
 *     domain-specific behaviour that diverges from the canonical.
 *
 * Wired into pre-commit via `npm run lint:canonical-imports`.
 *
 * If a new local function is genuinely needed:
 *   1. Add an inline `// canonical-exception — <one-line reason>`
 *      comment on the same line as `function X(` OR the line above.
 *   2. The ratchet recognises the marker and skips it.
 *   3. The comment IS the audit trail.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_ROOT = join(ROOT, 'src');

// Banned function-name patterns. Each banned name → canonical path the
// caller should import from instead. The detector matches:
//   - `function <name>(`
//   - `export function <name>(`
//   - `const <name> = (`
const BANNED = [
  // Bias name formatting (canonical: @/lib/utils/labels)
  { name: 'formatBiasName', canonical: '@/lib/utils/labels' },
  { name: 'humanizeBias', canonical: '@/lib/utils/labels' },
  { name: 'formatBiasType', canonical: '@/lib/utils/labels' },
  { name: 'formatBiasLabel', canonical: '@/lib/utils/labels' },
  { name: 'humanizeBiasType', canonical: '@/lib/utils/labels' },
  { name: 'formatBiasNameCompact', canonical: '@/lib/utils/labels' },
  // Severity → color (canonical: @/lib/utils/severity)
  { name: 'severityColor', canonical: '@/lib/utils/severity' },
  // Grade-from-score (canonical: @/lib/utils/grade)
  { name: 'gradeFromScore', canonical: '@/lib/utils/grade' },
  { name: 'scoreToGrade', canonical: '@/lib/utils/grade' },
  { name: 'getGrade', canonical: '@/lib/utils/grade' },
  { name: 'dqiGrade', canonical: '@/lib/utils/grade' },
  { name: 'gradeFor', canonical: '@/lib/utils/grade' },
  // Date formatting (canonical: @/lib/utils/format-date)
  { name: 'formatDate', canonical: '@/lib/utils/format-date' },
  { name: 'formatDateTime', canonical: '@/lib/utils/format-date' },
  // String truncation (canonical: @/lib/utils/string)
  { name: 'truncate', canonical: '@/lib/utils/string' },
  // IP extraction (canonical: @/lib/utils/request)
  { name: 'extractIp', canonical: '@/lib/utils/request' },
];

// Files that ARE the canonical sources — banned names defined here are
// the source of truth. Skip detection on these.
const CANONICAL_FILES = new Set([
  'src/lib/utils/labels.ts',
  'src/lib/utils/severity.ts',
  'src/lib/utils/grade.ts',
  'src/lib/utils/format-date.ts',
  'src/lib/utils/string.ts',
  'src/lib/utils/request.ts',
]);

// Inline opt-out marker. Mirrors @schema-drift-tolerant + drift-tolerant
// patterns in the count + silent-catch ratchets.
const CANONICAL_EXCEPTION_MARKER = /canonical-exception/i;

// The detection regex. Matches:
//   function <name>(...)
//   export function <name>(...)
//   const <name> = (...) =>
//   const <name> = function(...)
function buildBanRegex(name) {
  // Use word boundaries so `formatBias` doesn't match `formatBiasName`.
  return new RegExp(
    String.raw`(?:^|\s)(?:export\s+)?(?:async\s+)?(?:function\s+${name}\s*\(|const\s+${name}\s*=\s*(?:\([^)]*\)\s*(?::\s*[^=]+)?\s*=>|function))`
  );
}
const BAN_REGEXES = BANNED.map(b => ({ ...b, regex: buildBanRegex(b.name) }));

// Baseline: legitimate domain-specific exceptions that exist today.
// These files keep their local helpers because the local behaviour
// genuinely differs from canonical:
//   - _brief-shared.ts uses a custom short-label catalog
//     ("Availability" instead of "Availability Heuristic").
//   - shared-styles.ts:formatBias is the brief-surface alias.
//   - DecisionAlphaTab.tsx:severityColor returns hex (uses
//     `${color}25` hex-alpha concatenation that CSS vars don't
//     support; migration requires the severityTint helper).
//   - DecisionRoomDetailClient + CsoPipelineBoard + VersionHistoryStrip
//     use formatDate variants with weekday/no-year/locale-aware shapes.
//   - cross-reference.ts:truncate uses a custom marker.
//   - recent-meetings-context.ts + hallway-brief-generator.ts:truncate
//     collapse whitespace differently from canonical.
//   - quick-score.ts:scoreToGrade — DEPRECATED, will be removed after
//     verifying no consumer depends on the legacy thresholds.
//   - InlineCoEditPanel passages have local helpers in some viz files.
//   - PasteAuditResults.tsx:severityColor uses the marketing-palette
//     intentionally (CLAUDE.md "marketing surfaces with hardcoded
//     palettes should call gradeMetaFromScore(score).color").
//   - misc fingerprint / version-delta / agent code paths.
//
// Entries here are scanned for the inline comment marker first; if the
// marker is present the file is skipped. This list is the ratchet
// fallback — the marker is the preferred opt-out.
const BASELINE_EXCEPTIONS = new Set([
  'src/components/documents/_brief-shared.ts',
  'src/components/founder-hub/shared-styles.ts',
  'src/components/founder-hub/DecisionAlphaTab.tsx',
  'src/components/founder-hub/founder-os/InteractiveSfcMatrix.tsx',
  'src/components/decision-rooms/DecisionRoomDetailClient.tsx',
  'src/components/founder-hub/CsoPipelineBoard.tsx',
  'src/components/analysis/VersionHistoryStrip.tsx',
  'src/components/analysis/RiskScoreCard.tsx',
  'src/components/admin/AdminAuditLog.tsx',
  'src/lib/agents/cross-reference.ts',
  'src/lib/founder-hub/recent-meetings-context.ts',
  'src/lib/reports/hallway-brief-generator.ts',
  'src/components/marketing/demo/PasteAuditResults.tsx',
  'src/lib/utils/version-delta.ts',
  // Legacy file with deprecated thresholds — separate cleanup.
  'src/lib/analysis/quick-score.ts',
  // Fingerprint engine has its own bias-formatting needs.
  'src/lib/analysis/fingerprint-engine.ts',
]);

const SKIP_PATH = /(?:node_modules|\.next|dist|coverage|test-results|\.serena|generated)/;
const SKIP_TEST = /\.(?:test|spec)\.(?:ts|tsx|js|jsx)$/;
const TEXT_EXT = /\.(?:ts|tsx)$/;

function walk(target, out = []) {
  let stat;
  try {
    stat = statSync(target);
  } catch {
    return out;
  }
  if (stat.isFile()) {
    if (TEXT_EXT.test(target) && !SKIP_PATH.test(target) && !SKIP_TEST.test(target)) {
      out.push(target);
    }
    return out;
  }
  for (const name of readdirSync(target)) {
    const path = join(target, name);
    if (SKIP_PATH.test(path)) continue;
    try {
      const child = statSync(path);
      if (child.isDirectory()) walk(path, out);
      else if (TEXT_EXT.test(name) && !SKIP_TEST.test(name)) out.push(path);
    } catch {
      // unreadable — skip silently
    }
  }
  return out;
}

const offenders = [];
for (const file of walk(SCAN_ROOT)) {
  const rel = relative(ROOT, file);
  if (CANONICAL_FILES.has(rel)) continue;
  if (BASELINE_EXCEPTIONS.has(rel)) continue;

  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const ban of BAN_REGEXES) {
      if (!ban.regex.test(line)) continue;
      // Inline opt-out: same-line or line-above marker.
      const isOptOut =
        CANONICAL_EXCEPTION_MARKER.test(line) ||
        (i > 0 && CANONICAL_EXCEPTION_MARKER.test(lines[i - 1]));
      if (isOptOut) continue;
      offenders.push({
        file: rel,
        line: i + 1,
        name: ban.name,
        canonical: ban.canonical,
        snippet: line.trim().slice(0, 140),
      });
    }
  }
}

if (offenders.length > 0) {
  console.error(
    `\n❌ canonical-imports lint: ${offenders.length} local function(s) shadow a canonical export.\n`
  );
  for (const o of offenders) {
    console.error(`   ${o.file}:${o.line}`);
    console.error(`     fn:        ${o.name}`);
    console.error(`     canonical: import { ${o.name} } from '${o.canonical}';`);
    console.error(`     line:      ${o.snippet}`);
    console.error('');
  }
  console.error('Either:');
  console.error('  (a) Replace the local function with the canonical import.');
  console.error(
    "  (b) If the local behaviour genuinely differs (custom palette / collapse"
  );
  console.error(
    '      whitespace / non-canonical thresholds intentional), add an inline'
  );
  console.error(
    "      `// canonical-exception — <reason>` comment on the same line OR the"
  );
  console.error('      line above. The comment IS the audit trail.');
  console.error(
    '  (c) If the file is a domain-specific helper that should stay forever,'
  );
  console.error(
    '      add it to BASELINE_EXCEPTIONS in scripts/lint-canonical-imports.mjs.'
  );
  console.error('');
  process.exit(1);
}

console.log('✓ canonical-imports lint: clean.');
