#!/usr/bin/env bash
#
# slop-scan wrapper for Decision Intel.
#
# Runs modem-dev/slop-scan v0.3.x against the repo and surfaces a
# tight summary: total findings, real-source count (vendored pdfjs
# bundles filtered), repoScore, scorePerKloc, by-rule breakdown.
#
# Use as the second quality gate alongside `npx tsc --noEmit` after
# any non-trivial ship per the saved memory
# `feedback-slop-scan-as-verification-step.md`. Trigger threshold:
# diff touches >10 files.
#
# The scorePerKloc target is < 4.0 (mature-OSS median 1.48; AI-default
# median 10.90). Below 4.0 = closer to mature-OSS than typical AI-coded.
# Climbing above ~5.0 commit-over-commit means slop is accumulating;
# pause and investigate rather than continuing.

set -euo pipefail

cd "$(dirname "$0")/.."

# slop-scan binary location: install path varies; prefer cached install
# at /tmp/slop-scan-pkg, fall back to npx-resolved path.
SLOP_BIN=""
if [ -x "/tmp/slop-scan-pkg/node_modules/.bin/slop-scan" ]; then
  SLOP_BIN="/tmp/slop-scan-pkg/node_modules/.bin/slop-scan"
else
  echo "Installing slop-scan@0.3.0 to /tmp/slop-scan-pkg (one-time)…" >&2
  rm -rf /tmp/slop-scan-pkg
  mkdir -p /tmp/slop-scan-pkg
  ( cd /tmp/slop-scan-pkg && npm init -y >/dev/null 2>&1 && npm install slop-scan@0.3.0 --silent --no-fund --no-audit )
  SLOP_BIN="/tmp/slop-scan-pkg/node_modules/.bin/slop-scan"
fi

OUT=/tmp/slop-scan-di-latest.json
"$SLOP_BIN" scan . --json > "$OUT"

python3 -c "
import json, sys
with open('$OUT') as f:
    d = json.load(f)

findings = d.get('findings', [])
IGNORE = ('extension/pdf', 'public/pdf', 'public/_next/', 'node_modules/', '.next/')
real = [f for f in findings if not any(f.get('path','').startswith(p) for p in IGNORE)]

s = d.get('summary', {})
spk = s.get('normalized', {}).get('scorePerKloc', 0)
repo = s.get('repoScore', 0)

print(f'Total findings: {len(findings)} ({len(real)} real source after filtering vendored)')
print(f'repoScore:      {repo:.1f}')
print(f'scorePerKloc:   {spk:.2f}  (target <4.0 — closer to mature-OSS median 1.48 than AI-default 10.90)')
print()

from collections import Counter
by_rule = Counter(f.get('ruleId','?') for f in real)
print('By rule (real source):')
for r, n in by_rule.most_common():
    print(f'  {n:4d}  {r}')

print()
if spk < 4.0:
    print('OK: scorePerKloc below 4.0 target.')
elif spk < 5.0:
    print(f'WARN: scorePerKloc {spk:.2f} above target 4.0. Investigate top 1-2 rules.')
else:
    print(f'FAIL: scorePerKloc {spk:.2f} above 5.0. Slop is accumulating; pause and clean up before continuing.')

print()
print(f'Full JSON: $OUT')
"
