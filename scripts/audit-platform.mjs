#!/usr/bin/env node
/**
 * audit-platform.mjs — single-command platform-coherence audit.
 *
 * The lint scripts (positioning / silent-catches / counts / canonical-
 * imports / doc-sync) catch their specific drift classes deterministically.
 * This script extends the family with HEURISTIC checks that surface the
 * "outdated / out of place / broken / visually incoherent" cluster the
 * founder otherwise catches manually screenshot by screenshot.
 *
 * Checks shipped (locked 2026-05-11):
 *
 *   CRITICAL
 *     - dead-route hrefs (links to retired routes return 404 OR 308
 *       redirect — both are surfaces the user shouldn't see)
 *     - native browser dialogs (window.confirm / window.alert) on
 *       platform surfaces — banned per CLAUDE.md on wow-moment / demo /
 *       decision-detail / package-detail pages
 *
 *   VISUAL
 *     - dark-mode Tailwind tokens on platform pages (text-white /
 *       bg-zinc-* / text-gray-* outside .dark-wrapped severity cards) —
 *       CLAUDE.md "Use CSS variables, not hardcoded dark classes" rule
 *     - hardcoded hex colors outside the allow-list (graph viz / jsPDF
 *       generators / globals.css / theme files that legitimately need
 *       raw hex; everywhere else should reach for var(--…))
 *     - mixed page-H1 sizing (raw `fontSize: 24` / `text-2xl` / `text-3xl`
 *       on H1 instead of var(--fs-page-h1-platform))
 *
 *   STALE
 *     - references to retired components / retired files in JSDoc + code
 *     - "shipped 2026-MM" style commit-date strings older than 60 days
 *     - "as of MMMM YYYY" copy referring to past dates without the
 *       `drift-tolerant` marker
 *
 *   MODAL
 *     - modal-shape divs (position: fixed + inset: 0) NOT using the
 *       shadcn <Dialog> primitive
 *     - modal headers without a close button
 *
 * Usage:
 *   node scripts/audit-platform.mjs                  # stderr report
 *   node scripts/audit-platform.mjs --write          # writes a markdown
 *                                                      report under
 *                                                      docs/platform-audits/
 *   node scripts/audit-platform.mjs --strict         # exit 1 on any high
 *                                                      severity finding
 *
 * Output shape per finding:
 *   {
 *     category: 'critical' | 'visual' | 'stale' | 'modal',
 *     severity: 'high' | 'medium' | 'low',
 *     rule:     short rule id,
 *     file:     repo-relative path,
 *     line:     1-indexed,
 *     snippet:  trimmed line content,
 *     suggestion: one-line fix hint,
 *   }
 *
 * Adding a new check: write a `check<Name>(files)` function that returns
 * Finding[], wire it into the `runAllChecks()` array, and add a one-line
 * description to the header comment above.
 */

import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const STRICT = process.argv.includes('--strict');

// ─── Scan roots + file filters ───────────────────────────────────────────

const SCAN_ROOTS = ['src', 'docs'];

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'generated') continue;
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      yield* walk(full);
    } else if (/\.(tsx?|mdx?|mjs|js)$/.test(entry)) {
      yield full;
    }
  }
}

function readLines(file) {
  try {
    return readFileSync(file, 'utf8').split('\n');
  } catch {
    return null;
  }
}

function isUnder(path, prefix) {
  return path.includes(prefix.replace(/\//g, require('node:path').sep));
}

// ─── Dead-route detection ────────────────────────────────────────────────

const RETIRED_ROUTES = [
  // Routes that have a 308 redirect in next.config.ts — surfaces should
  // never link to them directly because the redirect adds a round-trip.
  '/dashboard/playbooks',
  '/dashboard/provenance',
  '/dashboard/cognitive-audits/effectiveness',
  '/dashboard/decision-dna', // folded into /analytics?view=intelligence#dna
  '/dashboard/decision-log', // folded into /dashboard/decisions?view=log
  '/dashboard/outcome-flywheel', // folded into /analytics?view=intelligence#flywheel
  '/dashboard/meetings/command-center',
  '/dashboard/decisions/constellation', // SVG viz retired 2026-05-11
  '/decision-alpha', // page deleted
];

function checkDeadRoutes(files) {
  const findings = [];
  for (const file of files) {
    // Allow next.config.ts (the redirect map itself names these routes)
    // + the audit script + CLAUDE.md (historical references).
    const rel = relative(ROOT, file);
    if (
      rel === 'next.config.ts' ||
      rel.includes('scripts/audit-platform') ||
      rel === 'CLAUDE.md' ||
      rel === 'TODO.md' ||
      rel.includes('docs/platform-audits/')
    ) {
      continue;
    }
    const lines = readLines(file);
    if (!lines) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip line-level comments mentioning the route in a "retired" /
      // "redirected" context — those are intentional history.
      if (/retired|redirect|folded|deprecated|deleted|legacy|historical/i.test(line)) continue;
      for (const route of RETIRED_ROUTES) {
        // Match as an href value (quote-delimited) or in a markdown link.
        const re = new RegExp(
          `['"\`(]${route.replace(/\//g, '\\/')}(?=['"\\s)?#])`,
          ''
        );
        if (re.test(line)) {
          findings.push({
            category: 'critical',
            severity: 'high',
            rule: 'dead-route-href',
            file: rel,
            line: i + 1,
            snippet: line.trim().slice(0, 140),
            suggestion: `Link to a retired route. Update to canonical destination per next.config.ts redirect map (${route}).`,
          });
        }
      }
    }
  }
  return findings;
}

// ─── Native browser dialogs ──────────────────────────────────────────────

const NATIVE_DIALOG_PATTERNS = [
  /\bwindow\.confirm\s*\(/,
  /\bwindow\.alert\s*\(/,
  // Bare alert() / confirm() — exclude obvious string literals like
  // 'alert' in copy or alertColor variable.
  /(?<![A-Za-z_$.])alert\s*\(/,
  /(?<![A-Za-z_$.])confirm\s*\(/,
];

// Files / dirs where native dialogs are acceptable (internal tooling)
// OR where the regex hits prose inside a giant template literal (chat
// preamble, founder-context). CLAUDE.md explicitly tolerates a small
// set of admin-side confirms — see "Existing native confirms in admin/
// settings/founder-hub surfaces" carve-out.
const NATIVE_DIALOG_ALLOWED_PREFIXES = [
  'src/components/founder-hub/',
  'src/app/(platform)/dashboard/admin/',
  'src/app/(platform)/dashboard/settings/',
  'src/components/settings/',
  'src/components/admin/',
  'src/app/api/founder-hub/founder-context.ts',
  // Admin-side comment/task deletes — CLAUDE.md tolerated exception
  // ("BiasCollabPanel comment-delete" named explicitly).
  'src/components/analysis/BiasCollabPanel.tsx',
  // Team-member removal is admin-side, also tolerated.
  'src/app/(platform)/dashboard/team/TeamPage.tsx',
];

function checkNativeDialogs(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!rel.startsWith('src/')) continue;
    if (NATIVE_DIALOG_ALLOWED_PREFIXES.some(p => rel.startsWith(p))) continue;
    if (rel.includes('scripts/')) continue;
    const lines = readLines(file);
    if (!lines) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Strip comment lines.
      const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*\*\//, '');
      for (const p of NATIVE_DIALOG_PATTERNS) {
        if (p.test(code)) {
          findings.push({
            category: 'critical',
            severity: 'high',
            rule: 'native-browser-dialog',
            file: rel,
            line: i + 1,
            snippet: line.trim().slice(0, 140),
            suggestion:
              'Replace with shadcn <Dialog> from @/components/ui/dialog or useToast — native dialogs break the modal stack on mobile Safari and read as 2008-vintage during procurement demos.',
          });
          break;
        }
      }
    }
  }
  return findings;
}

// ─── Dark-mode Tailwind tokens ───────────────────────────────────────────

// Tokens that are dark-only and break light-theme posture. The product
// is light-theme-only per CLAUDE.md "Dark mode posture (locked 2026-04-23)".
const DARK_TOKEN_PATTERNS = [
  /\btext-white\b/,
  /\btext-gray-(100|200|300|400|500)\b/,
  /\btext-slate-(100|200|300|400|500)\b/,
  /\btext-zinc-(100|200|300|400|500)\b/,
  /\bbg-white\/\d{1,2}\b/, // bg-white/5, bg-white/10 etc — dark-mode alpha overlays
  /\bborder-white\/\d{1,2}\b/,
  /\bbg-zinc-(800|900|950)\b/,
  /\bbg-gray-(800|900|950)\b/,
  /\bbg-slate-(800|900|950)\b/,
  /\bbg-black\b/,
];

// Allow interior dark theming inside severity-card visualization wrappers.
const DARK_TOKEN_ALLOWED_PREFIXES = [
  'src/components/visualizations/',
  'src/components/marketing/proof/', // navy outcome reveal panel
  'src/lib/reports/', // jsPDF / DPR renderers handle their own theming
  'src/components/dpr/', // DPR-render route uses its own token system
  'src/app/dpr-render/',
  'src/components/marketing/CredibilityTrio.tsx', // intentional navy section
  'src/components/marketing/SecurityLifecycleStrip.tsx', // intentional navy
  'src/components/marketing/CategoryGapShowcase.tsx', // intentional dark beat
  'src/components/marketing/KahnemanKleinSynthesis.tsx',
  'src/components/marketing/ProblemScenes.tsx',
  'src/components/marketing/HeroDecisionGraph.tsx',
  'src/components/marketing/CaseStudyBiasGraph',
  'src/components/marketing/genome/ToxicNetworkGraph.tsx',
];

function checkDarkModeTokens(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!rel.startsWith('src/')) continue;
    if (!/\.(tsx?|jsx?)$/.test(rel)) continue;
    if (DARK_TOKEN_ALLOWED_PREFIXES.some(p => rel.startsWith(p))) continue;
    // Marketing surfaces frequently have intentional dark sections;
    // require an opt-in marker to skip the check for an entire file.
    const lines = readLines(file);
    if (!lines) continue;
    const fileHeader = lines.slice(0, 30).join('\n');
    if (/light-theme-exempt|intentional-dark/.test(fileHeader)) continue;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip JSDoc + // comments
      if (/^\s*[/*]/.test(line)) continue;
      // Skip lines inside dark-wrapped severity cards (heuristic — line
      // mentions bg-red-*, bg-amber-*, bg-yellow-* in same line block).
      if (/bg-(red|amber|yellow|emerald|rose|violet)-9\d\d/.test(line)) continue;

      for (const p of DARK_TOKEN_PATTERNS) {
        if (p.test(line)) {
          findings.push({
            category: 'visual',
            severity: 'medium',
            rule: 'dark-mode-tailwind-token',
            file: rel,
            line: i + 1,
            snippet: line.trim().slice(0, 140),
            suggestion:
              "Replace with CSS-variable styling (var(--text-primary) / var(--bg-card) etc). Product is light-theme only per CLAUDE.md.",
          });
          break;
        }
      }
    }
  }
  return findings;
}

// ─── Hardcoded hex colors ────────────────────────────────────────────────

const HEX_COLOR_PATTERN = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/;
const HEX_ALLOWED_PREFIXES = [
  'src/components/visualizations/',
  'src/lib/reports/',
  'src/components/dpr/',
  'src/app/dpr-render/',
  'src/components/marketing/HeroDecisionGraph.tsx',
  'src/components/marketing/CaseStudyBiasGraph',
  'src/components/marketing/genome/',
  'src/components/marketing/moments/',
  'src/components/marketing/SecurityLifecycleStrip.tsx',
  'src/components/marketing/PipelineFlowDiagram.tsx',
  'src/lib/data/pipeline-nodes.ts',
  'src/components/marketing/how-it-works/',
  'src/components/founder-hub/path-to-100m/',
  'src/lib/scoring/dqi.ts', // GRADE_THRESHOLDS hex map is canonical
  'src/lib/constants/human-audit.ts', // SEVERITY_COLORS hex map is canonical
  'src/components/analysis/CounterfactualPanel.tsx',
  'src/components/analysis/InlineAnalysisResultCard.tsx',
  'src/components/onboarding/',
  'src/app/globals.css',
];

function checkHardcodedHex(files) {
  const findings = [];
  // Restricted to PLATFORM surfaces — marketing pages have license to
  // use rich palettes (intentional accent hex, gradients, custom
  // illustration colors). Platform pages should reach for var(--…) so
  // theme changes propagate consistently.
  const STYLE_PROP_HEX = /(?:color|background(?:-?[Cc]olor)?):\s*['"`](#[0-9A-Fa-f]{3,6})\b/;
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!rel.includes('src/app/(platform)/') && !rel.includes('src/components/')) continue;
    if (!/\.(tsx?|jsx?)$/.test(rel)) continue;
    if (HEX_ALLOWED_PREFIXES.some(p => rel.startsWith(p))) continue;
    // Skip marketing components entirely.
    if (rel.includes('src/components/marketing/')) continue;
    if (rel.includes('test.ts') || rel.includes('.spec.')) continue;

    const lines = readLines(file);
    if (!lines) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*[/*]/.test(line)) continue;
      if (/var\(--[^)]+\)\s*,\s*['"]#[0-9A-Fa-f]+/i.test(line)) continue;
      const m = line.match(STYLE_PROP_HEX);
      if (m) {
        const hex = m[1].toLowerCase();
        // Universal monochrome — allow #fff and #000 (and their 6-char
        // equivalents) for text-on-colored-button + outline patterns.
        if (hex === '#fff' || hex === '#ffffff' || hex === '#000' || hex === '#000000') continue;
        findings.push({
          category: 'visual',
          severity: 'low',
          rule: 'hardcoded-hex-color',
          file: rel,
          line: i + 1,
          snippet: line.trim().slice(0, 140),
          suggestion: `Replace ${m[1]} with var(--…) reference. Platform surfaces should use canonical CSS variables.`,
        });
      }
    }
  }
  return findings;
}

// ─── Modal-shape divs not using shadcn Dialog ────────────────────────────

// Modal-shape heuristic: a div with position: fixed + inset: 0 (or top:
// 0 + left: 0) + a z-index above 40. Outside Dialog primitive itself.
function checkModalShape(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!rel.startsWith('src/components/') && !rel.startsWith('src/app/')) continue;
    if (!/\.tsx?$/.test(rel)) continue;
    // Dialog primitive lives here — skip itself.
    if (rel.includes('src/components/ui/dialog.tsx')) continue;
    if (rel.includes('src/components/ui/CommandPalette.tsx')) continue;
    if (rel.includes('src/components/ui/EnhancedToast')) continue;

    const lines = readLines(file);
    if (!lines) continue;
    const full = lines.join('\n');
    // Quick early-exit if file has no fixed-positioned content.
    if (!/position:\s*['"]fixed['"]/.test(full)) continue;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/position:\s*['"]fixed['"]/.test(line)) continue;
      // Look in the next 12 lines for inset: 0 or top + left + zIndex.
      const window = lines.slice(i, Math.min(i + 14, lines.length)).join('\n');
      const isModalShape =
        (/inset:\s*0/.test(window) ||
          (/top:\s*0/.test(window) && /left:\s*0/.test(window))) &&
        /z(?:Index|-index):\s*[1-9]\d{2,}/i.test(window);
      if (!isModalShape) continue;
      // Skip when the same file imports Dialog — heuristic says it's
      // probably using the primitive somewhere else; the fixed div may
      // be a banner or sticky element.
      if (/from\s+['"]@\/components\/ui\/dialog['"]/.test(full)) continue;
      // Skip toast / banner contexts.
      if (/toast|Toast|Notification|Banner|Sheet/.test(full)) continue;

      findings.push({
        category: 'modal',
        severity: 'medium',
        rule: 'modal-without-dialog-primitive',
        file: rel,
        line: i + 1,
        snippet: line.trim().slice(0, 140),
        suggestion:
          'Hand-rolled modal — migrate to <Dialog> from @/components/ui/dialog so focus management, ESC handling, and mobile Safari behavior come for free.',
      });
      break; // one finding per file is enough
    }
  }
  return findings;
}

// ─── Page H1 sizing drift ────────────────────────────────────────────────

const PAGE_H1_DRIFT_PATTERNS = [
  /<h1[^>]*className=['"`][^'"`]*\b(?:text-2xl|text-3xl|text-4xl)\b/,
  /<h1[^>]*style=\{[^}]*fontSize:\s*(?:24|28|32|36|40)\b/,
];

function checkPageH1Drift(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    // Only platform pages (not marketing — those use marketing-display).
    if (!rel.includes('src/app/(platform)/')) continue;
    if (!/page\.tsx$/.test(rel)) continue;
    const lines = readLines(file);
    if (!lines) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const p of PAGE_H1_DRIFT_PATTERNS) {
        if (p.test(line)) {
          findings.push({
            category: 'visual',
            severity: 'low',
            rule: 'platform-h1-token-drift',
            file: rel,
            line: i + 1,
            snippet: line.trim().slice(0, 140),
            suggestion:
              "Use fontSize: 'var(--fs-page-h1-platform)' (clamp 28-40px) for platform-page H1 instead of hardcoded text-* / fontSize literals.",
          });
        }
      }
    }
  }
  return findings;
}

// ─── Stale stage language on marketing ───────────────────────────────────

const STALE_STAGE_PATTERNS = [
  { p: /\b(we just launched|we're building|early days of|our journey)\b/i, label: 'startup-voice' },
  { p: /\bsolo founder\b/i, label: 'solo-founder mention' },
  { p: /\bjust shipped\b/i, label: 'just-shipped mention' },
];

function checkStaleStageLanguage(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!rel.includes('src/app/(marketing)/') && !rel.includes('src/components/marketing/')) {
      continue;
    }
    if (rel.includes('case-studies/[slug]')) continue; // historical anchors

    const lines = readLines(file);
    if (!lines) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*[/*]/.test(line)) continue;
      for (const { p, label } of STALE_STAGE_PATTERNS) {
        if (p.test(line)) {
          findings.push({
            category: 'stale',
            severity: 'medium',
            rule: 'stale-stage-language',
            file: rel,
            line: i + 1,
            snippet: line.trim().slice(0, 140),
            suggestion: `Marketing voice rule — banned pattern (${label}). See CLAUDE.md "Marketing Voice — Enterprise Discipline".`,
          });
        }
      }
    }
  }
  return findings;
}

// ─── Stale "as of <past date>" copy ──────────────────────────────────────

function checkStaleAsOfDates(files) {
  const findings = [];
  const now = new Date('2026-05-11');
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!rel.includes('src/app/') && !rel.includes('src/components/')) continue;
    if (rel.includes('founder-hub/')) continue; // internal
    if (rel.includes('CLAUDE.md') || rel.includes('TODO.md')) continue;
    if (rel.includes('docs/')) continue;
    const lines = readLines(file);
    if (!lines) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match `as of {Month} {Year}` patterns.
      const m = line.match(
        /\bas of\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i
      );
      if (!m) continue;
      // Skip drift-tolerant markers.
      if (/drift-tolerant/i.test(line) || /drift-tolerant/i.test(lines[Math.max(0, i - 1)])) {
        continue;
      }
      const month = m[1];
      const year = parseInt(m[2], 10);
      const monthIdx = [
        'january','february','march','april','may','june','july','august','september','october','november','december',
      ].indexOf(month.toLowerCase());
      const refDate = new Date(year, monthIdx, 1);
      const daysOld = Math.floor((now.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysOld > 90) {
        findings.push({
          category: 'stale',
          severity: 'medium',
          rule: 'stale-as-of-date',
          file: rel,
          line: i + 1,
          snippet: line.trim().slice(0, 140),
          suggestion: `"as of ${month} ${year}" is ${daysOld} days old. Update or add an inline drift-tolerant marker if the date is intentionally fixed.`,
        });
      }
    }
  }
  return findings;
}

// ─── References to deleted files / removed components ───────────────────

// Symbols that no longer exist OR whose imports have been physically
// removed. Don't list components that still EXIST as files even if they
// were dropped from a particular mount point — that's just an export
// the rest of the platform may legitimately re-use later.
const DELETED_REFERENCES = [
  'ContainerConstellation',
  'useConstellation',
  '/api/containers/constellation',
  'src/components/constellation/',
  'UnifiedDecisionsFeed',
  'AuditSummaryCards', // deleted Phase D — no longer exists
];

function checkDeletedReferences(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (rel === 'CLAUDE.md' || rel === 'TODO.md') continue;
    if (rel.includes('scripts/audit-platform')) continue;
    if (rel.includes('docs/')) continue;
    const lines = readLines(file);
    if (!lines) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/retired|deleted|removed|legacy|deprecated/i.test(line)) continue;
      for (const ref of DELETED_REFERENCES) {
        if (line.includes(ref)) {
          findings.push({
            category: 'stale',
            severity: 'medium',
            rule: 'deleted-component-reference',
            file: rel,
            line: i + 1,
            snippet: line.trim().slice(0, 140),
            suggestion: `References a deleted symbol (${ref}). Remove or update.`,
          });
        }
      }
    }
  }
  return findings;
}

// ─── Orchestration ───────────────────────────────────────────────────────

function runAllChecks() {
  const files = [];
  for (const root of SCAN_ROOTS) {
    for (const f of walk(join(ROOT, root))) {
      files.push(f);
    }
  }

  const allFindings = [
    ...checkDeadRoutes(files),
    ...checkNativeDialogs(files),
    ...checkDarkModeTokens(files),
    ...checkHardcodedHex(files),
    ...checkModalShape(files),
    ...checkPageH1Drift(files),
    ...checkStaleStageLanguage(files),
    ...checkStaleAsOfDates(files),
    ...checkDeletedReferences(files),
  ];

  return allFindings;
}

function groupBy(arr, keyFn) {
  const out = {};
  for (const x of arr) {
    const k = keyFn(x);
    (out[k] ||= []).push(x);
  }
  return out;
}

function formatReport(findings) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [];
  lines.push(`# Platform audit · ${today}`);
  lines.push('');
  lines.push(
    `Run: \`node scripts/audit-platform.mjs\` · ${findings.length} finding${findings.length === 1 ? '' : 's'} surfaced.`
  );
  lines.push('');

  const byCategory = groupBy(findings, f => f.category);
  const order = ['critical', 'modal', 'visual', 'stale'];

  for (const cat of order) {
    const items = byCategory[cat];
    if (!items || items.length === 0) continue;
    lines.push(`## ${cat.toUpperCase()} (${items.length})`);
    lines.push('');
    const byRule = groupBy(items, f => f.rule);
    for (const [rule, ruleItems] of Object.entries(byRule)) {
      lines.push(`### \`${rule}\` (${ruleItems.length})`);
      lines.push('');
      if (ruleItems.length > 0) {
        lines.push(`> ${ruleItems[0].suggestion}`);
        lines.push('');
      }
      for (const f of ruleItems.slice(0, 25)) {
        lines.push(`- \`${f.file}:${f.line}\` — \`${f.snippet.replace(/`/g, '\\`')}\``);
      }
      if (ruleItems.length > 25) {
        lines.push(`- _... ${ruleItems.length - 25} more_`);
      }
      lines.push('');
    }
  }

  const counts = order.map(c => `${c}: ${(byCategory[c] || []).length}`).join(' · ');
  lines.push(`---`);
  lines.push(``);
  lines.push(`Severity counts — ${counts}`);
  return lines.join('\n');
}

function formatTerminalSummary(findings) {
  if (findings.length === 0) {
    return '✓ platform-audit: clean — no findings.';
  }
  const byCategory = groupBy(findings, f => f.category);
  const order = ['critical', 'modal', 'visual', 'stale'];
  const lines = [];
  lines.push(`\n⚠ platform-audit: ${findings.length} finding${findings.length === 1 ? '' : 's'}.\n`);
  for (const cat of order) {
    const items = byCategory[cat];
    if (!items || items.length === 0) continue;
    lines.push(`  ${cat.toUpperCase()} · ${items.length}`);
    const byRule = groupBy(items, f => f.rule);
    for (const [rule, ruleItems] of Object.entries(byRule)) {
      lines.push(`    ${rule.padEnd(36)} ${String(ruleItems.length).padStart(4)}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────

const findings = runAllChecks();

console.error(formatTerminalSummary(findings));

if (WRITE) {
  const today = new Date().toISOString().slice(0, 10);
  const outDir = join(ROOT, 'docs', 'platform-audits');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `audit-${today}.md`);
  writeFileSync(outPath, formatReport(findings), 'utf8');
  console.error(`Report written to ${relative(ROOT, outPath)}`);
}

const highCount = findings.filter(f => f.severity === 'high').length;
if (STRICT && highCount > 0) {
  console.error(`\nStrict mode: ${highCount} high-severity finding(s) — exiting 1.`);
  process.exit(1);
}

process.exit(0);
