#!/usr/bin/env node
/**
 * Positioning linter — scans marketing-facing surfaces for retired
 * vocabulary that has leaked back in. Source of truth for the banned
 * list is CLAUDE.md: "Vocabulary to AVOID" plus the Marketing Voice
 * Discipline section. Every entry here traces to a line in CLAUDE.md;
 * when a term is added or retired there, update this file in the same
 * commit.
 *
 * Exits 1 on the first match so it can block a pre-commit hook. Run
 * locally with `node scripts/lint-positioning.mjs`.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

// Only scan surfaces a real visitor can hit. Founder-Hub-only data files
// (positioning-copilot, positioning-frameworks, category-position,
// competitive-positioning, founder-school/**) sit behind Supabase +
// FOUNDER_HUB_PASS — stage-of-company vocabulary is legitimate there.
const SCAN_ROOTS = ['src/app/(marketing)', 'src/components/marketing', 'src/lib/data/case-studies'];

// Paths that must never be flagged even if they fall inside SCAN_ROOTS.
const SKIP_SUFFIXES = [
  'scripts/lint-positioning.mjs',
  'src/app/api/founder-hub/founder-context.ts',
  'CLAUDE.md',
  'TODO.md',
];

/**
 * Each rule:
 *   pattern  — RegExp applied against file contents.
 *   label    — error prefix.
 *   allowIn  — optional array of path prefixes where the phrase is OK
 *              (matches via startsWith on the repo-relative path).
 */
const BANNED = [
  // PE/VC-coded. CLAUDE.md lists "thesis" as banned; narrowed to the
  // specific PE phrasing so natural case-study prose ("strategic thesis",
  // "thesis confirmation" as a bias name) doesn't false-positive.
  {
    pattern: /\binvestment thesis\b/i,
    label: 'investment thesis (PE-coded)',
  },
  { pattern: /\binvestment memo\b/i, label: 'investment memo (PE-coded)' },
  {
    pattern: /\binvestment committee\b/i,
    label: 'investment committee (PE-coded)',
  },
  {
    pattern: /\b(LPs?|limited partners?)\b/i,
    label: 'LP / limited partner (PE-coded)',
  },

  // Retired positioning labels. These are banned even inside historical
  // case-study prose — "a decision intelligence platform would have
  // flagged X" anchors us to the Gartner-crowded category we deliberately
  // walked away from on 2026-04-22.
  {
    pattern: /\bdecision intelligence platform\b/i,
    label: '"decision intelligence platform" (Gartner-crowded; use "native reasoning layer")',
  },
  {
    pattern: /\bhuman-AI governance (system|layer)?\b/i,
    label: '"human-AI governance" (retired 2026-04-22)',
  },

  // Stage-of-company language banned on marketing surfaces.
  { pattern: /\bpre-seed\b/i, label: 'pre-seed (stage-of-company banned)' },
  {
    pattern: /\bseed-stage\b/i,
    label: 'seed-stage (stage-of-company banned)',
  },
  {
    pattern: /\bpre-revenue\b/i,
    label: 'pre-revenue (stage-of-company banned)',
  },
  {
    pattern: /\b(we just launched|we're building|early days of|our journey)\b/i,
    label: 'startup-founder voice (banned on marketing)',
  },

  // Vague / cliché — narrowed to marketing self-description so bias
  // descriptions that use these as adjectives ("revolutionary technology"
  // as a framing-effect bias) don't false-positive.
  {
    pattern: /\brevolutionary (platform|product|AI|approach|solution|tool|technology platform)\b/i,
    label: 'revolutionary X (vague marketing cliché)',
  },
  {
    pattern: /\bnext-generation (platform|AI|tool|product|solution|approach)\b/i,
    label: 'next-generation X (vague marketing cliché)',
  },
  { pattern: /\bgame-changer\b/i, label: 'game-changer (vague)' },
  { pattern: /\bleveraging AI\b/i, label: 'leveraging AI (vague)' },

  // Model-name leaks on public surfaces. Internal /dashboard tooling may
  // reference these; this scan only hits marketing roots.
  {
    pattern: /\bGemini (2|3)\.?\d*(\s+(Flash|Pro))?\b/,
    label: 'Gemini model-name leak',
  },
  {
    pattern: /\b(Anthropic\s+)?Claude\s+(Opus|Sonnet|Haiku)\b/i,
    label: 'Claude model-name leak',
  },

  // Technical jargon — allowed only in /how-it-works (where the full
  // pipeline can be named and the reader has opted into depth).
  {
    pattern: /\b12-node pipeline\b/i,
    label: '"12-node pipeline" (jargon — allowed only in /how-it-works)',
    allowIn: ['src/app/(marketing)/how-it-works', 'src/components/marketing/how-it-works'],
  },
  {
    pattern: /\bLangGraph\b/,
    label: 'LangGraph (jargon — allowed only in /how-it-works)',
    allowIn: ['src/app/(marketing)/how-it-works', 'src/components/marketing/how-it-works'],
  },
  {
    pattern: /\b3 independent AI judges\b/i,
    label: '"3 independent AI judges" (jargon — allowed only in /how-it-works)',
    allowIn: ['src/app/(marketing)/how-it-works', 'src/components/marketing/how-it-works'],
  },
];

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      yield* walk(full);
    } else if (/\.(tsx?|mdx?)$/.test(entry)) {
      yield full;
    }
  }
}

function shouldSkip(fullPath) {
  const rel = relative(ROOT, fullPath);
  return SKIP_SUFFIXES.some(suffix => rel === suffix || rel.endsWith(suffix));
}

function allowedFor(rule, fullPath) {
  if (!rule.allowIn) return false;
  const rel = relative(ROOT, fullPath);
  return rule.allowIn.some(dir => rel.startsWith(dir));
}

function lineFor(content, index) {
  return content.slice(0, index).split('\n').length;
}

const violations = [];

for (const root of SCAN_ROOTS) {
  const absRoot = join(ROOT, root);
  for (const file of walk(absRoot)) {
    if (shouldSkip(file)) continue;
    let content;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const rule of BANNED) {
      if (allowedFor(rule, file)) continue;
      const match = rule.pattern.exec(content);
      if (match) {
        violations.push({
          file: relative(ROOT, file),
          line: lineFor(content, match.index),
          label: rule.label,
          snippet: content
            .slice(Math.max(0, match.index - 28), match.index + match[0].length + 28)
            .replace(/\n/g, ' '),
        });
      }
      rule.pattern.lastIndex = 0;
    }
  }
}

if (violations.length === 0) {
  console.log('✓ positioning-lint: clean');
  process.exit(0);
}

console.error('✗ positioning-lint: banned vocabulary detected\n');
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}`);
  console.error(`    ${v.label}`);
  console.error(`    …${v.snippet}…\n`);
}
console.error(
  `${violations.length} violation(s). Fix in the same commit or carve out a scoped allowIn rule in scripts/lint-positioning.mjs.\n`
);
process.exit(1);
