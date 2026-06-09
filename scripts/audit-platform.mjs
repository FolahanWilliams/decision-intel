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
 *   SEMANTIC (added 2026-05-11 after the WelcomeModal v3.5-drift miss)
 *     - onboarding-persona-drift: sign-up / welcome / persona-gating
 *       files that define a role taxonomy without referencing the v3.5
 *       HXC personas (fractional_cso / midmarket_corp_dev /
 *       smaller_fund_gp / pe_backed_founder). The structural checks
 *       above pass clean on a welcome modal that's technically valid
 *       but semantically out-of-date against CLAUDE.md GTM locks; this
 *       check catches that drift class.
 *     - locked-count-drift (added 2026-05-17 after the M-1 "cascade
 *       COMPLETE" claim was false for 2 days): founder-USED data /
 *       teaching surfaces hardcoding a stale matrix dimension
 *       (`20×20` / `20x20` / `21×21` — canonical is 22×22) or the
 *       deprecated `30+ (cognitive) bias(es)/taxonomy` / fictional
 *       "Twenty biases plus" / "20-base" split. The count-drift lint
 *       regex (`/(\d{1,3})\s+(biases|frameworks|…)/i`) is structurally
 *       BLIND to these (`×` is not whitespace; "cognitive" sits
 *       between the number and "biases"), which is exactly why M-1
 *       stayed PARTIAL while the gates were green. History / derivation
 *       comments are skipped.
 *     - static-asset-next-link (added 2026-05-17 after the /demo
 *       WeWorkProofPanel 404): next/link <Link> pointing at a static
 *       public/ asset (.pdf/.docx/…) RSC-prefetches a non-route → a
 *       404 that console-spams on the surface it's mounted on. Plain
 *       <a> on the same href is correct and is NOT flagged.
 *     - blocking-await-pipeline-path (added 2026-05-17 after the
 *       Friction-#4 news-sync P0): a >=20s blocking timeout AWAITED
 *       sequentially in src/lib/{agents,intelligence,synthesis,copilot}
 *       froze the whole audit pipeline platform-wide. Bounded timeouts
 *       that are elements of an `await Promise.allSettled([...])`
 *       fan-out (no leading `await`) are parallel and NOT flagged.
 *       Encodes the "structure-passes-but-runtime-hangs" miss the
 *       structural checks above are blind to by design.
 *     - sequential-io-loop-pipeline-path (added 2026-05-17, the
 *       unbounded sibling of the above): a `for…of`/`.forEach`/`while`
 *       on the audit path whose body `await`s a Prisma/LLM/fetch call
 *       — N serial round-trips (the 2026-05-17 news-sync's 210 serial
 *       upserts + 11 serial Gemini batches). `Promise.all`/
 *       `batchProcess` concurrency + `for await (…stream)` consumption
 *       are NOT flagged; inline `// audit-allow-sequential` opts out a
 *       deliberately-serial loop.
 *     - tailwind-literal-palette (added 2026-05-17 after IntelligenceBrief
 *       shipped a washed-out box past the dark-mode check): literal
 *       Tailwind palette colours (`text-red-400` / `bg-blue-500` /
 *       `text-emerald-400`) on a platform component — a FIXED hue that
 *       ignores the light-only theme. The `<prop>-<colour>-<NNN>` shape
 *       cannot match the legit shadcn token family (no numeric suffix),
 *       so it's precise by construction. viz / marketing / dpr / demo /
 *       glass allowlisted; dark-severity-card interiors + an
 *       `intentional-dark` file-header opt out.
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
      rel.includes('docs/platform-audits/') ||
      // Test files reference retired routes intentionally — they verify
      // the redirect, the not-in-sitemap exclusion, the 404 etc.
      rel.endsWith('.test.ts') ||
      rel.endsWith('.test.tsx')
    ) {
      continue;
    }
    const lines = readLines(file);
    if (!lines) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip line-level comments mentioning the route in a "retired" /
      // "redirected" / "308 to X" / "→ X" context — those are intentional.
      if (
        /retired|redirect|folded|deprecated|deleted|legacy|historical|30\d\s+to\b|→\s*\//i.test(
          line
        )
      )
        continue;
      for (const route of RETIRED_ROUTES) {
        // Match as an href value (quote-delimited) or in a markdown link.
        const re = new RegExp(`['"\`(]${route.replace(/\//g, '\\/')}(?=['"\\s)?#])`, '');
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
    let inBlockComment = false; // tracks multi-line /* ... */ blocks
    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];

      // Apply block-comment state BEFORE matching. A line that opens
      // a `/*` block (without closing it on the same line) is in-comment
      // for everything AFTER the `/*`; a line that closes a `*/` block
      // is in-comment for everything BEFORE the `*/`.
      let workingLine = rawLine;
      if (inBlockComment) {
        const closeIdx = workingLine.indexOf('*/');
        if (closeIdx === -1) {
          // Entire line is inside a block comment — skip.
          continue;
        }
        // Strip up to and including the `*/`.
        workingLine = workingLine.slice(closeIdx + 2);
        inBlockComment = false;
      }
      // Now strip inline `/* ... */` (open + close on same line) — match
      // non-greedy so multiple inline comments on the same line work.
      workingLine = workingLine.replace(/\/\*[\s\S]*?\*\//g, '');
      // Strip JSX comments `{/* ... */}` — same shape, just braces.
      workingLine = workingLine.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
      // Strip line comments (after the inline-block strip so `// /* */`
      // doesn't get mis-handled).
      workingLine = workingLine.replace(/\/\/.*$/, '');
      // If the line opened a block comment that did NOT close on the same
      // line, flip state ON and strip everything from `/*` onward (the
      // line may still have code before the `/*`).
      const openIdx = workingLine.indexOf('/*');
      if (openIdx !== -1) {
        workingLine = workingLine.slice(0, openIdx);
        inBlockComment = true;
      }
      // Strip JSX-block-comment OPEN without close on the same line
      // (e.g. `{/* multi-line jsx comment`).
      const jsxOpenIdx = workingLine.indexOf('{/*');
      if (jsxOpenIdx !== -1 && !workingLine.includes('*/}')) {
        workingLine = workingLine.slice(0, jsxOpenIdx);
        inBlockComment = true;
      }

      for (const p of NATIVE_DIALOG_PATTERNS) {
        if (p.test(workingLine)) {
          findings.push({
            category: 'critical',
            severity: 'high',
            rule: 'native-browser-dialog',
            file: rel,
            line: i + 1,
            snippet: rawLine.trim().slice(0, 140),
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
  // Founder-context.ts is a giant template-literal chat preamble that
  // mentions class names in narrative prose ("text-white classes break
  // light theme..."). Not styling, just description.
  'src/app/api/founder-hub/founder-context.ts',
  // Dialog primitive backdrop uses bg-black/10 — load-bearing.
  'src/components/ui/dialog.tsx',
  // Glass-effect components legitimately use bg-white/N + border-white/N
  // to create translucent overlays on top of any background.
  'src/components/ui/GlassMicroInteractions.tsx',
  'src/components/ui/LiquidGlassAdvanced.tsx',
  // Demo page has its own slate palette intentional for the consumer-
  // facing paste-audit flow (not platform theme territory).
  'src/app/demo/',
];

function checkDarkModeTokens(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!rel.startsWith('src/')) continue;
    if (!/\.(tsx?|jsx?)$/.test(rel)) continue;
    if (rel.includes('.test.') || rel.includes('.spec.')) continue;
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
      // Skip when the SAME element sets its own colored background via a
      // CSS variable or explicit hex (`bg-[var(--accent-primary)]`,
      // `bg-[#16A34A]`): white text / a white/N overlay on a solid
      // colored surface is correct contrast in light theme, NOT a
      // dark-mode token. Same intent as the severity-wrapper skip above
      // — extended to the CSS-var-driven colored-button pattern (the
      // 2026-05-17 WelcomeModal false-positive class).
      if (/bg-\[var\(--/.test(line) || /bg-\[#[0-9a-fA-F]{3,8}\]/.test(line)) continue;
      // Skip the translucent icon-/avatar-chip idiom: a small fixed box
      // (`w-N h-N`) + `rounded*` + low-opacity `bg-white/≤25`. Per the
      // CLAUDE.md dark-token-sweep lock, low-α white overlays are a
      // legitimate tint-on-colour pattern, not a dark-mode surface; a
      // real violation (`bg-zinc-900` panel, `text-gray-400` body) never
      // takes this shape. Bounds the rule instead of chasing one FP via
      // an ever-growing regex (the codebase's anti-over-fit philosophy).
      if (
        /\bbg-white\/(?:[0-9]|1[0-9]|2[0-5])\b/.test(line) &&
        /\brounded(?:-|\b)/.test(line) &&
        /\bw-\d{1,2}\b/.test(line) &&
        /\bh-\d{1,2}\b/.test(line)
      ) {
        continue;
      }

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
              'Replace with CSS-variable styling (var(--text-primary) / var(--bg-card) etc). Product is light-theme only per CLAUDE.md.',
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
    // LiquidGlassEffect uses position: fixed for a cursor-light bloom
    // overlay — visual effect, not a modal.
    if (rel.includes('src/components/ui/LiquidGlassEffect.tsx')) continue;

    const lines = readLines(file);
    if (!lines) continue;
    // Check for the intentional-modal-pattern marker in the header.
    if (lines.slice(0, 40).join('\n').includes('intentional-modal-pattern')) continue;
    const full = lines.join('\n');
    // Quick early-exit if file has no fixed-positioned content.
    if (!/position:\s*['"]fixed['"]/.test(full)) continue;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/position:\s*['"]fixed['"]/.test(line)) continue;
      // Look in the next 12 lines for inset: 0 or top + left + zIndex.
      const window = lines.slice(i, Math.min(i + 14, lines.length)).join('\n');
      const isModalShape =
        (/inset:\s*0/.test(window) || (/top:\s*0/.test(window) && /left:\s*0/.test(window))) &&
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
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december',
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
      // Skip lines marked retired / deleted / removed / etc. on the
      // SAME line OR within a 3-line comment window (catches multi-
      // line comments like `{/* Container roll-up widget (Phase 3
      // P3.5 — replaces deleted UnifiedDecisionsFeed). */}` where the
      // skip-keyword and the referenced symbol land on different lines).
      const contextWindow = lines
        .slice(Math.max(0, i - 2), Math.min(lines.length, i + 3))
        .join('\n');
      if (
        /retired|deleted|removed|legacy|deprecated|replaces? (the )?(legacy|prior|old)|historical comment|@history\b/i.test(
          contextWindow
        )
      )
        continue;
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

// ─── checkOnboardingPersonaCoherence ─────────────────────────────────────
//
// Flags SEMANTIC drift in onboarding / sign-up / persona-gating files.
// The earlier structural checks (modal-shape / native-dialog / dark-tokens)
// catch HOW a modal is built; they don't catch WHAT IT SAYS. The
// 2026-05-11 audit found WelcomeModal had stayed on the pre-v3.5 broad role
// taxonomy (cso / ma / bizops / pe_vc / other) for ~7 days after v3.5
// shipped the HXC narrowing (fractional_cso / midmarket_corp_dev /
// smaller_fund_gp / pe_backed_founder / other) in PHASE_1_PERSONAS at
// src/lib/constants/icp.ts. ("other" is full-access + generic overview,
// cohort-tagged out of Vohra — NOT waitlisted; access-policy amended
// 2026-05-19. This check verifies HXC-persona references in gate files;
// it does not assert any waitlist behaviour.)
//
// The fix shape: for any file that LIVES IN an onboarding / welcome /
// sign-up directory AND defines a role/persona taxonomy (enum, array of
// labels, type union), verify the file references at least one of the
// canonical HXC persona ids. If it doesn't, flag it as potentially
// outdated against the v3.5 lock.
//
// This is a heuristic — a downstream cascade file (TOUR_STEPS_BY_ROLE in
// OnboardingTour, COPY in role-empty-states, bundlesForRole in
// sample-bundles) legitimately uses the legacy 5-role enum because the
// auto-derive helper phase1PersonaToOnboardingRole feeds it. The check
// distinguishes those by looking for the legacy enum INSIDE files that
// also gate sign-up (the modal layer) vs files that consume the derived
// role downstream (everything else).

const HXC_PERSONA_IDS = [
  'fractional_cso',
  'midmarket_corp_dev',
  'smaller_fund_gp',
  'pe_backed_founder',
];
const HXC_PERSONA_LABELS = [
  'fractional cso',
  'mid-market corp dev',
  'smaller-fund gp',
  'pe-backed founder',
];

// Explicit list of sign-up GATE files — files where the user picks a role
// for the first time, OR where that choice is persisted. Downstream
// consumers (OnboardingTour / sample-bundles / role-empty-states /
// FirstRunInlineWalkthrough / useOnboardingRole / RoleSamplePicker)
// legitimately use the legacy 5-role enum via the phase1PersonaToOnboardingRole
// bridge and are excluded by omission. When a new gate ships (e.g., a
// dedicated /signup form), add its path here.
const ONBOARDING_GATE_FILES = [
  'src/components/ui/WelcomeModal.tsx',
  'src/components/onboarding/Phase1PersonaModal.tsx',
  'src/app/api/onboarding/route.ts',
];

// ─── SEMANTIC: dead founder-pass guard ─────────────────────────────────
// verifyFounderPass() (the canonical in src/lib/utils/founder-auth.ts)
// returns a FounderAuthResult OBJECT — always truthy. A guard shaped
// `if (!verifyFounderPass(...))` therefore NEVER fires, silently leaving
// the route unauthenticated. The 2026-06-09 security sweep found FOUR
// LLM routes (argument-builder, grade-recall, sparring generate/grade)
// with exactly this dead guard — every one effectively open to the
// internet. The legitimate patterns this check must NOT flag:
//   - `!verifyFounderPass(...).ok`            (correct object guard)
//   - files defining a LOCAL boolean wrapper `function verifyFounderPass`
//     (content / outreach routes alias the canonical as checkFounderPass)
//   - aliased imports (`verifyFounderPass as checkFounderPass`)
function checkDeadFounderPassGuard(files) {
  const findings = [];
  const importRe =
    /import\s*\{[^}]*\bverifyFounderPass\b(?!\s+as\s)[^}]*\}\s*from\s*['"]@\/lib\/utils\/founder-auth['"]/;
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!rel.startsWith('src/')) continue;
    if (rel.endsWith('founder-auth.ts')) continue;
    const lines = readLines(file);
    if (!lines) continue;
    const content = lines.join('\n');
    if (!importRe.test(content)) continue; // not importing the canonical unaliased
    if (/function\s+verifyFounderPass\s*\(/.test(content)) continue; // local wrapper shadows it
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/!\s*verifyFounderPass\s*\(/.test(line)) continue;
      // Allow the correct `.ok` guard. NOTE: a paren-balanced regex breaks on
      // nested call args (`verifyFounderPass(req.headers.get('x'))`), so the
      // allow-test is the simple presence of `).ok` on the guard line — the
      // observed bug class is single-line guards.
      if (line.includes(').ok')) continue;
      findings.push({
        category: 'critical',
        severity: 'critical',
        rule: 'dead-founder-pass-guard',
        file: rel,
        line: i + 1,
        snippet: line.trim().slice(0, 140),
        suggestion:
          'verifyFounderPass returns an OBJECT (always truthy) — `!verifyFounderPass(...)` never fires and the route is unauthenticated. Guard on `.ok`: `if (!verifyFounderPass(x).ok)`.',
      });
    }
  }
  return findings;
}

function checkOnboardingPersonaCoherence(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!ONBOARDING_GATE_FILES.includes(rel)) continue;
    const lines = readLines(file);
    if (!lines) continue;
    const text = lines.join('\n');
    const textLower = text.toLowerCase();

    // Heuristic: does the file reference any HXC persona id or label,
    // or the canonical PHASE_1_PERSONAS export, or the bridge helper?
    const referencesHxc =
      HXC_PERSONA_IDS.some(id => text.includes(id)) ||
      HXC_PERSONA_LABELS.some(label => textLower.includes(label)) ||
      text.includes('PHASE_1_PERSONAS') ||
      text.includes('Phase1PersonaId') ||
      text.includes('phase1PersonaToOnboardingRole');

    if (!referencesHxc) {
      // Find the first taxonomy-defining line to anchor the finding.
      let line = 0;
      for (let i = 0; i < lines.length; i++) {
        if (
          /type\s+\w*(Role|Persona)\w*\s*=/.test(lines[i]) ||
          /const\s+(ROLES|PERSONAS)/.test(lines[i])
        ) {
          line = i + 1;
          break;
        }
      }
      findings.push({
        category: 'stale',
        severity: 'high',
        rule: 'onboarding-persona-drift',
        file: rel,
        line: line || 1,
        snippet: line ? lines[line - 1].trim().slice(0, 140) : '',
        suggestion:
          'Onboarding gate file defines a role taxonomy without referencing v3.5 HXC personas. Import from PHASE_1_PERSONAS in @/lib/constants/icp, or use phase1PersonaToOnboardingRole to bridge the legacy 5-role enum.',
      });
    }
  }
  return findings;
}

// Founder-USED data / teaching surfaces where a stale count is a
// credibility hit (the founder rehearses investor answers from these).
// Conservative explicit allowlist — mirrors ONBOARDING_GATE_FILES.
const LOCKED_COUNT_DRIFT_FILES = [
  'src/lib/data/competitive-positioning.ts',
  'src/lib/data/positioning-frameworks.ts',
  'src/lib/data/founder-school/lessons.ts',
  'src/lib/data/founder-school/visualizations.ts',
  'src/lib/data/founder-school/research-foundations.ts',
  'src/components/founder-hub/path-to-100m/data/category-pitch.ts',
  // Added 2026-05-21 (audit Section 1) — these 3 founder-USED tabs
  // were OUTSIDE the original M-1 / U-3.1 scope and silently hardcoded
  // '20×20' / '20x20' / '400' for 8+ days. The lock's narrow allowlist
  // was the structural reason the U-3.1b "checkLockedCountDrift returns
  // ZERO" claim was a false-negative for this class — same shape as
  // the lock the M-1 cascade was already meant to close.
  'src/components/founder-hub/ScoringEngineTab.tsx',
  'src/components/founder-hub/CorePipelineTab.tsx',
  'src/components/founder-hub/start-here/founder-hub-map-data.ts',
  // Added 2026-05-22 (nightly audit Section 1) — hyphenated framework-
  // count literals ('17-framework', '18-framework') escape the
  // lint-counts regex (which requires whitespace between digit and
  // noun, like '17 frameworks'). Four founder-USED files silently
  // carried stale 17/18-framework moat claims after FRC Nigeria lifted
  // the canonical count to 19 — same regex-blind class as bias-count
  // hyphens. SEMANTIC check is the only structural defence.
  'src/components/founder-hub/closing-lab/closing-lab-data.ts',
  'src/components/founder-hub/path-to-100m/data/failure-modes.ts',
  'src/components/founder-hub/path-to-100m/data/ninety-day-actions.ts',
  'src/components/founder-hub/education/education-room-data.ts',
  // Added 2026-06-09 (nightly audit Section 1) — four files carried the
  // deprecated '30+ bias(es)/taxonomy' phrasing in LIVE user-visible
  // strings (a marketing showcase detail, a verbatim founder rehearsal
  // script, two Slack response texts, an LLM system prompt — LLM prompt
  // strings are user-visible prose per the 2026-05-29 lock). All four
  // were OUTSIDE this allowlist, so checkLockedCountDrift was a false
  // negative for them — the exact class the 2026-05-21 entry documents.
  // Literals migrated to ${BIAS_COUNT} interpolation in the same commit.
  'src/components/marketing/CategoryGapShowcase.tsx',
  'src/components/founder-hub/path-to-100m/data/killer-responses.ts',
  'src/app/api/integrations/slack/commands/route.ts',
  'src/app/api/founder-hub/sparring/generate-questions/route.ts',
  // NOTE: education-room-data.ts IS deliberately INCLUDED here for the
  // hyphenated-framework class — those are ASSERT-the-count flashcard
  // canonicalAnswers (the founder rehearses "17-framework regulatory
  // map" verbatim in investor meetings). The '30+ cognitive biases' /
  // bias-count carve-out below the file pattern set was specifically
  // for the deprecation-TEACHING bias-deck cards; framework prose is
  // not a deprecation-teaching surface — it's literal moat assertion.
];

// Stale-count patterns the count-drift lint regex is structurally blind
// to (`×` is not whitespace; "cognitive" sits between number + "biases";
// hyphens between number + noun like '17-framework' are structurally
// blind to /\d+\s+frameworks/ too).
const LOCKED_COUNT_PATTERNS = [
  {
    re: /\b2[01]\s*[×x]\s*2[01]\b/,
    what: 'stale matrix dimension (canonical: 22×22 via MATRIX_DIMENSION)',
  },
  {
    re: /\b30\+\s*(cognitive\s+)?(biases|bias|taxonomy)\b/i,
    what: 'deprecated "30+ bias(es)/taxonomy" (canonical: ${BIAS_COUNT}-bias via BIAS_EDUCATION)',
  },
  {
    re: /twenty\s+biases\s+plus/i,
    what: 'fictional "Twenty biases plus N" split (no such split exists)',
  },
  { re: /\b20-base\b/i, what: 'fictional "20-base + extra-scope" split (no such split exists)' },
  // Hyphenated framework-count drift (locked 2026-05-22 nightly audit).
  // Canonical = getAllRegisteredFrameworks().length (currently 19, was 17
  // before the 2026-04-29 ISA 2007 ship + FRC Nigeria addition). Both
  // 17-framework and 18-framework are now historically stale. Skip the
  // canonical phrasing '${FRAMEWORK_COUNT}-framework' via the standard
  // comment/derivation marker pattern below.
  {
    re: /\b1[78]-framework[s]?\b/i,
    what: 'stale framework count (canonical: ${FRAMEWORK_COUNT}-framework via getAllRegisteredFrameworks)',
  },
];

// Lines that legitimately mention the stale strings: derivation /
// history / methodology-version / meta-comments. Documented non-fixes
// per the M-1 lock — never re-flag these.
const LOCKED_COUNT_SKIP_MARKERS = [
  'Derived —',
  'M-1 regression',
  'extended from 20×20',
  'stale per CR-3',
  'deprecated per CR-3',
  'the engine ran 22×22',
  'regression had',
  'methodology-version',
  '2.2.0',
  'deprecated',
  // 2026-05-22 nightly audit — comment markers explaining the hyphenated
  // framework-count drift class. Skip lines that EXPLAIN why a literal
  // exists (audit trail) rather than ASSERT a stale count.
  'hyphenated framework',
  'stale 17',
  '17→18',
  'lift the canonical',
];

function checkLockedCountDrift(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!LOCKED_COUNT_DRIFT_FILES.includes(rel)) continue;
    const lines = readLines(file);
    if (!lines) continue;
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();
      // Skip comment lines + documented history/derivation markers.
      // SKIP_MARKERS match is case-INSENSITIVE because the deprecation-
      // teaching flashcard uses 'DEPRECATED' (uppercase) verbatim — the
      // 2026-05-22 nightly audit caught this false-positive class when
      // education-room-data.ts was added to LOCKED_COUNT_DRIFT_FILES for
      // the hyphenated-framework class.
      const rawLower = raw.toLowerCase();
      if (
        trimmed.startsWith('//') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('/*') ||
        LOCKED_COUNT_SKIP_MARKERS.some(m => rawLower.includes(m.toLowerCase()))
      ) {
        continue;
      }
      for (const { re, what } of LOCKED_COUNT_PATTERNS) {
        if (re.test(raw)) {
          findings.push({
            category: 'stale',
            severity: 'high',
            rule: 'locked-count-drift',
            file: rel,
            line: i + 1,
            snippet: trimmed.slice(0, 140),
            suggestion: `Regex-blind ${what}. Derive: import MATRIX_DIMENSION from @/lib/ontology/interaction-matrix, BIAS_COUNT from BIAS_EDUCATION, FRAMEWORK_COUNT from getAllRegisteredFrameworks() — interpolate, never literal. If genuinely fixed history-prose, add a skip marker comment.`,
          });
          break; // one finding per line is enough
        }
      }
    }
  }
  return findings;
}

// Static assets in public/ MUST be a plain <a>, never next/link <Link>.
// next/link RSC-prefetches the href as a route; a static .pdf/.docx has
// no route, so the prefetch 404s and console-spams on the surface it's
// mounted on. This exact class shipped on /demo via WeWorkProofPanel
// (caught 2026-05-17). Plain <a> on a static-ext href is correct and
// is NOT flagged — only <Link> is.
const STATIC_ASSET_HREF =
  /href=["']\/[^"']+\.(pdf|docx|xlsx|xls|csv|zip|png|jpg|jpeg|svg|txt)["']/i;
function checkStaticAssetLink(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!rel.endsWith('.tsx') || rel.includes('scripts/audit-platform')) continue;
    const lines = readLines(file);
    if (!lines) continue;
    if (!lines.some(l => /from ['"]next\/link['"]/.test(l))) continue;
    for (let i = 0; i < lines.length; i++) {
      if (!/<Link\b/.test(lines[i])) continue;
      // Scan the <Link …> opening tag (multi-line) for a static-asset href.
      for (let j = i; j < Math.min(i + 14, lines.length); j++) {
        const m = lines[j].match(STATIC_ASSET_HREF);
        if (m) {
          findings.push({
            category: 'critical',
            severity: 'high',
            rule: 'static-asset-next-link',
            file: rel,
            line: j + 1,
            snippet: lines[j].trim().slice(0, 140),
            suggestion: `next/link <Link> points at a static public asset (.${m[1]}) — it RSC-prefetches a non-route → 404 console-spam. Use a plain <a href target="_blank" rel="noopener noreferrer">, never <Link>, for public/ files.`,
          });
          break;
        }
        if (j > i && lines[j].includes('>')) break; // opening tag closed
      }
    }
  }
  return findings;
}

// A long blocking timeout AWAITED sequentially on the audit critical
// path froze the whole pipeline 60s platform-wide (the 2026-05-17
// news-sync P0). Bounded timeouts that are ELEMENTS of an
// `await Promise.allSettled([...])` fan-out are fine (parallel) — those
// lines have no leading `await`, so this high-precision rule skips them.
const PIPELINE_PATH = /^src\/lib\/(agents|intelligence|synthesis|copilot)\//;
// Matches BOTH the canonical `withTimeout(` and the `withTimeout as
// utilTimeout` alias call site (the alias is what the 2026-05-17
// news-sync P0 line actually used — a behavior test caught that a
// `[wW]ithTimeout`-only pattern would never fire on the real bug).
const BLOCKING_AWAIT =
  /^\s*(?:const\s+\w+\s*=\s*)?await\s+(?:withTimeout|utilTimeout|utilWithTimeout)\s*\(/;
const BIG_BUDGET_MS = /\b(?:[2-9]\d|\d{3,})_?000\b/; // >= 20_000 ms
function checkBlockingAwaitOnPipelinePath(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!PIPELINE_PATH.test(rel) || rel.endsWith('.test.ts')) continue;
    const lines = readLines(file);
    if (!lines) continue;
    for (let i = 0; i < lines.length; i++) {
      if (!BLOCKING_AWAIT.test(lines[i])) continue;
      // Budget may be on this line or the next few (multi-line call args).
      const span = lines.slice(i, Math.min(i + 4, lines.length)).join(' ');
      if (BIG_BUDGET_MS.test(span)) {
        findings.push({
          category: 'critical',
          severity: 'high',
          rule: 'blocking-await-pipeline-path',
          file: rel,
          line: i + 1,
          snippet: lines[i].trim().slice(0, 140),
          suggestion: `>=20s blocking timeout awaited on the audit critical path. Non-fatal enrichment must NEVER block the pipeline — background it (Promise.race vs a small wait budget) or move it into the bounded parallel fan-out. See the "Friction audit #4" CLAUDE.md lock.`,
        });
      }
    }
  }
  return findings;
}

// Sequential I/O inside a loop on the audit critical path is the
// unbounded sibling of the blocking-timeout class: a `for…of` /
// `.forEach` / `while` whose body `await`s a Prisma/LLM/fetch call
// runs N round-trips serially (the 2026-05-17 news-sync had this exact
// shape — 210 serial upserts + 11 serial Gemini batches). The
// blocking-await check above only catches a >=20s `withTimeout`; this
// catches the unbounded-loop form. Correct concurrency
// (`Promise.all`/`Promise.allSettled`/`batchProcess`) and stream
// consumption (`for await (… of result.stream)`) are NOT flagged.
// Indentation-based body detection is reliable post the repo-wide
// prettier pass (2-space, enforced).
const LOOP_HEAD = /^(\s*)(?:for\s*\(|while\s*\(|[\w.]+\.forEach\s*\()/;
const FOR_AWAIT_HEAD = /^\s*for\s+await\s*\(/;
const AWAIT_IO =
  /\bawait\s+[^;]*\b(?:prisma\.\w+\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany|findFirst|findUnique|findMany|count|aggregate|groupBy)|fetch\(|generateText\(|generateChat\(|streamText\(|streamChat\()/;
const SAFE_CONCURRENCY = /\b(?:Promise\.all|Promise\.allSettled|batchProcess|p[Mm]ap|mapLimit)\b/;
function checkSequentialIoLoopOnPipelinePath(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!PIPELINE_PATH.test(rel) || rel.endsWith('.test.ts')) continue;
    const lines = readLines(file);
    if (!lines) continue;
    for (let i = 0; i < lines.length; i++) {
      const head = lines[i].match(LOOP_HEAD);
      if (!head || FOR_AWAIT_HEAD.test(lines[i]) || SAFE_CONCURRENCY.test(lines[i])) continue;
      // Inline opt-out: a deliberately-sequential loop annotates itself.
      if (
        /audit-allow-sequential/.test(lines[i]) ||
        (i > 0 && /audit-allow-sequential/.test(lines[i - 1]))
      )
        continue;
      const headIndent = head[1].length;
      // Walk the loop body by indentation (prettier-normalised 2-space).
      for (let j = i + 1; j < Math.min(i + 80, lines.length); j++) {
        const ln = lines[j];
        if (ln.trim() === '') continue;
        const indent = ln.length - ln.trimStart().length;
        if (indent <= headIndent) break; // loop body ended
        if (SAFE_CONCURRENCY.test(ln)) break; // body delegates to bounded concurrency
        if (AWAIT_IO.test(ln)) {
          findings.push({
            category: 'critical',
            severity: 'high',
            rule: 'sequential-io-loop-pipeline-path',
            file: rel,
            line: j + 1,
            snippet: ln.trim().slice(0, 140),
            suggestion: `await I/O (Prisma/LLM/fetch) inside a loop on the audit critical path runs N serial round-trips. Use the canonical batchProcess helper at a concurrency cap, or Promise.all over a bounded map. If genuinely sequential-by-design, add an inline \`// audit-allow-sequential\` marker. See the "Friction audit #4" CLAUDE.md lock.`,
          });
          break; // one finding per loop is enough
        }
      }
    }
  }
  return findings;
}

// Literal Tailwind palette colours (`text-red-400`, `bg-blue-500`,
// `text-emerald-400`, `bg-red-500/10` …) on a platform component are the
// IntelligenceBrief washout class: a FIXED hue that ignores the light
// theme + CLAUDE.md's "use var(--…) / shadcn token, never literal
// palette" rule. The regex shape `<prop>-<colour>-<NNN>` CANNOT match
// the legitimate shadcn token family (`text-foreground`,
// `text-muted-foreground`, `bg-muted`, `border-border`, `bg-secondary`,
// `text-destructive` — no numeric palette suffix), so this is precise
// by construction. Reuses the dark-mode allowlist (viz / marketing /
// dpr / demo / glass legitimately use rich or literal palettes), the
// dark-severity-card interior skip, comment skip, and the
// `intentional-dark` / `light-theme-exempt` file-header opt-out.
const TW_LITERAL_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|divide|from|to|via)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:300|400|500|600|700)\b/;
function checkTailwindLiteralPalette(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!rel.startsWith('src/')) continue;
    if (!/\.(tsx?|jsx?)$/.test(rel)) continue;
    if (rel.includes('.test.') || rel.includes('.spec.')) continue;
    if (rel.includes('scripts/audit-platform')) continue;
    if (DARK_TOKEN_ALLOWED_PREFIXES.some(p => rel.startsWith(p))) continue;
    // Marketing has design license for rich / literal palettes (CLAUDE.md:
    // "marketing pages use hardcoded color constants ... intentional, NOT a
    // bug"). Mirror checkHardcodedHex, which skips the marketing tree wholesale
    // — the check's own header already names marketing as allowlisted, but the
    // DARK_TOKEN_ALLOWED_PREFIXES list only covers specific marketing files, so
    // CaseStudyCard / CaseStudyGallery leaked through. This is a platform
    // washout check; marketing is out of scope by design.
    if (rel.includes('src/components/marketing/')) continue;
    if (rel.includes('src/app/(marketing)/')) continue;
    const lines = readLines(file);
    if (!lines) continue;
    const fileHeader = lines.slice(0, 30).join('\n');
    if (/light-theme-exempt|intentional-dark/.test(fileHeader)) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*[/*]/.test(line)) continue; // comment
      // Interior of a dark-wrapped severity card legitimately uses
      // literal palette (CLAUDE.md visualization light-theme audit rule).
      if (/bg-(red|amber|yellow|emerald|rose|violet)-9\d\d/.test(line)) continue;
      if (TW_LITERAL_PALETTE.test(line)) {
        findings.push({
          category: 'visual',
          severity: 'medium',
          rule: 'tailwind-literal-palette',
          file: rel,
          line: i + 1,
          snippet: line.trim().slice(0, 140),
          suggestion:
            'Literal Tailwind palette colour on a platform surface ignores the light-only theme (the IntelligenceBrief washout class). Use a CSS var inline (var(--error)/var(--info)/var(--text-secondary)/color-mix(...)) or the shadcn token family (text-foreground / text-muted-foreground / bg-muted / border-border). viz/marketing/dpr/demo are allowlisted; a deliberate dark section opts out with an intentional-dark file-header marker.',
        });
      }
    }
  }
  return findings;
}

// ─── Hardcoded countdown literals (added 2026-05-28) ────────────────────
// Closes Critical-9.1 from the 2026-05-28 nightly audit + Tip 2 forward-
// looking discipline. The 2026-05-08 ship of SparringRehearsalBalance.tsx
// hardcoded "T-32 days" in JSX user-visible text. The 2026-05-12, -15,
// -17, -20, -22, -25, -26, -27 nightly audits ALL ran AFTER this surface
// shipped — and none caught it because the count-drift lint regex
// `\d+\s+(biases|frameworks|cases|...)` cannot match "T-N days" patterns
// (no canonical noun follows the number). Today (2026-05-28) the founder
// was T-12 from Strategy World London BAFTA but the daily-use Founder OS
// surface lied about T-32. The fix (commit 2fa5549) routed the JSX
// through `getHighestPriorityUpcomingEvent` + `daysUntil` from event-prep
// SSOT.
//
// This check catches future drift of the SAME class: any user-visible
// JSX / .ts string that hardcodes "T-N days" (or "T-N day", "T-N hours",
// "T-N minutes") instead of computing from a SSOT. Skips comments (//,
// /* */, JSX {/* */}), skips JSDoc lines (lines whose stripped content
// starts with `*`), skips .test.ts files, skips chat-context prose where
// the literal is referencing a HISTORICAL date (the recently-shipped
// section).
const HARDCODED_COUNTDOWN =
  /\bT\s*[-–—]\s*\d{1,3}\s+(?:day|days|hour|hours|minute|minutes|week|weeks)\b/i;
// Allowed surfaces (specific historical / training cases):
//   - founder-context.ts chat preamble (template literal narrating past ships)
//   - founder-school lessons (curriculum references to historical T-N moments)
//   - sales-toolkit + positioning-frameworks (rehearsal scripts that quote
//     example phrases the founder practises saying)
const HARDCODED_COUNTDOWN_ALLOWED_PREFIXES = [
  'src/app/api/founder-hub/founder-context.ts',
  'src/lib/data/founder-school/',
  'src/lib/data/sales-toolkit.ts',
  'src/lib/data/positioning-frameworks.ts',
  'src/lib/data/positioning-copilot.ts',
  'src/lib/data/competitive-positioning.ts',
  // Test fixtures legitimately hardcode example countdowns.
  'src/lib/outreach/target-research.test.ts',
];
function checkHardcodedCountdown(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!rel.startsWith('src/')) continue;
    if (rel.includes('scripts/')) continue;
    if (rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) continue;
    if (HARDCODED_COUNTDOWN_ALLOWED_PREFIXES.some(p => rel.startsWith(p))) continue;
    const lines = readLines(file);
    if (!lines) continue;
    let inBlockComment = false;
    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];

      // Block-comment + JSX-comment state machine (same shape as
      // checkNativeDialogs above).
      let workingLine = rawLine;
      if (inBlockComment) {
        const closeIdx = workingLine.indexOf('*/');
        if (closeIdx === -1) continue;
        workingLine = workingLine.slice(closeIdx + 2);
        inBlockComment = false;
      }
      workingLine = workingLine.replace(/\/\*[\s\S]*?\*\//g, '');
      workingLine = workingLine.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
      workingLine = workingLine.replace(/\/\/.*$/, '');
      const openIdx = workingLine.indexOf('/*');
      if (openIdx !== -1) {
        workingLine = workingLine.slice(0, openIdx);
        inBlockComment = true;
      }
      const jsxOpenIdx = workingLine.indexOf('{/*');
      if (jsxOpenIdx !== -1 && !workingLine.includes('*/}')) {
        workingLine = workingLine.slice(0, jsxOpenIdx);
        inBlockComment = true;
      }
      // Strip JSDoc-style ` * `-prefixed lines (the line after a comment-
      // strip starts with `*` followed by whitespace — that's a JSDoc
      // continuation line, stripped at compile).
      if (/^\s*\*(\s|$)/.test(workingLine)) continue;

      if (HARDCODED_COUNTDOWN.test(workingLine)) {
        findings.push({
          category: 'critical',
          severity: 'high',
          rule: 'hardcoded-countdown',
          file: rel,
          line: i + 1,
          snippet: rawLine.trim().slice(0, 140),
          suggestion:
            'Replace with a live countdown derived from a SSOT (e.g. `daysUntil(event)` from @/lib/data/event-prep). Hardcoded "T-N days" silently drifts off-truth — caught 20 days late on the BAFTA prep surface 2026-05-28.',
        });
      }
    }
  }
  return findings;
}

// ─── Non-responsive grid layout (added 2026-05-28) ──────────────────────
// Closes Improvement #5 (mobile experience sweep) by catching the
// drift class that broke the founder OS surfaces in past audits: a
// `gridTemplateColumns: '1fr 1fr 1fr'` style declaration in JSX with
// NO `@media (max-width: 700px)` (or similar) override at any level
// of the component. On a 6.7" phone, fixed N-column grids overflow
// horizontally + force horizontal scroll — the BAFTA hallway demo
// fails on a phone.
//
// Catches:
//   - `gridTemplateColumns: '1fr 1fr'` (or 1fr 1fr 1fr, etc.)
//   - `grid-template-columns: 1fr 1fr` style
//   - Tailwind `grid-cols-N` without a `sm:` / `md:` override on the
//     same element (separate concern — not flagged here yet)
//
// Allows:
//   - `repeat(auto-fit, minmax(...))` patterns (intrinsically responsive)
//   - Files with a sibling `<style>` block containing `@media`
//   - Files marked with `// audit-allow-fixed-grid` header comment
//   - Files under viz / dpr / marketing legacy palette directories
//     where intentional fixed grids are part of the design intent
const FIXED_GRID_PATTERN = /gridTemplateColumns:\s*['"`]\s*(?:1fr\s+){1,5}1fr\s*['"`]/;
const RESPONSIVE_HINT = /@media[^{]*\b(?:max-width|min-width)\b|repeat\(\s*auto-fit/;
const MOBILE_BREAKPOINT_ALLOWED_PREFIXES = [
  'src/components/visualizations/',
  'src/components/dpr/',
  'src/components/marketing/',
  'src/app/(marketing)/',
  'src/app/dpr-render/',
  'src/components/founder-hub/',
];
function checkFixedGridResponsiveness(files) {
  const findings = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (!rel.startsWith('src/')) continue;
    if (MOBILE_BREAKPOINT_ALLOWED_PREFIXES.some(p => rel.startsWith(p))) continue;
    if (rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) continue;
    const text = readLines(file)?.join('\n');
    if (!text) continue;
    // Per-file allow comment.
    if (/audit-allow-fixed-grid/.test(text)) continue;
    // Per-file responsive-hint short-circuit: if the file has ANY
    // @media query OR an auto-fit grid, assume the author considered
    // mobile.
    if (RESPONSIVE_HINT.test(text)) continue;
    const lines = readLines(file);
    if (!lines) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (FIXED_GRID_PATTERN.test(line)) {
        findings.push({
          category: 'critical',
          severity: 'medium',
          rule: 'fixed-grid-not-responsive',
          file: rel,
          line: i + 1,
          snippet: line.trim().slice(0, 140),
          suggestion:
            'Fixed N-column grid on a platform surface — will overflow on phone. Use `repeat(auto-fit, minmax(220px, 1fr))` OR wrap the consumer in a `<style>` block with a `@media (max-width: 700px)` collapsing rule. CSOs demo from phones at BAFTA-style events; fixed grids break the demo.',
        });
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
    ...checkDeadFounderPassGuard(files),
    ...checkOnboardingPersonaCoherence(files),
    ...checkLockedCountDrift(files),
    ...checkStaticAssetLink(files),
    ...checkBlockingAwaitOnPipelinePath(files),
    ...checkSequentialIoLoopOnPipelinePath(files),
    ...checkTailwindLiteralPalette(files),
    ...checkHardcodedCountdown(files),
    ...checkFixedGridResponsiveness(files),
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
  lines.push(
    `\n⚠ platform-audit: ${findings.length} finding${findings.length === 1 ? '' : 's'}.\n`
  );
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
