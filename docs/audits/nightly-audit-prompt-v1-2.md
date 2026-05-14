# Nightly Audit Prompt v1.2 (locked 2026-05-13 — CR-2 ship)

**Supersedes v1.1.** Updates to v1.1 captured here:

1. **Silent-catch baseline corrected**: prompt v1.1 hardcoded `152` as the
   silent-catch baseline reference. Actual baseline as of 2026-05-13 is
   **175** (the const at `scripts/lint-silent-catches.mjs` is the source
   of truth — read it every time, do not trust prompt prose).
2. **Persona-rotation history extended** with the 2026-05-12 + 2026-05-13
   audits so the next run picks fresh personas.
3. **22×22 vs taxonomy-count critical-pickup template** added as a
   recurring drift check (M-1 ship 2026-05-13 extended `INTERACTION_MATRIX`
   to 22×22; any future bias-taxonomy growth must extend the matrix in
   lockstep per the CLAUDE.md "Bias Taxonomy" cascade rule #11).
4. **2 new canonical false-negative classes** added based on the 2026-05-12
   audit's misses (M-2 + M-5 were both partial false negatives because the
   grep targeted the wrong casing).

---

## Pre-flight

Run these checks BEFORE generating any findings:

```bash
# Verify HEAD == origin/main
git fetch origin main
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] && echo "OK" || echo "DRIFT"

# Working tree clean (modulo expected untracked dev-tool dirs)
git status --short | grep -v "^?? \(\.claude\|\.codex\|\.serena\|\.cursorrules\|\.windsurfrules\|docs/superpowers\|playwright-report\|test-results\)"

# All 5 lints at baseline (read each script's const for current values)
npm run lint:positioning
npm run lint:silent-catches  # const SILENT_CATCH_BASELINE = read from scripts/lint-silent-catches.mjs
npm run lint:counts          # const COUNT_BASELINE = read from scripts/lint-counts.mjs
npm run lint:canonical-imports
npm run lint:doc-sync

# tsc clean (e2e/ + voice-worker/ excluded)
npx tsc --noEmit
```

State the current phase in one sentence at the top of the report. As of
2026-05-13: Phase 1 wedge motion (May 2026 – Oct 2026), Vohra HXC PMF
graduation gate live + N-floor hardened (M-2 follow-through 2026-05-13),
T-26d to Strategy World London BAFTA Piccadilly, zero paid customers
yet.

---

## Mandatory Disciplines

### Discipline 1 — grep-before-assert (false-negative prevention)

Before claiming something is missing, grep with **multiple casings**:

```bash
# Example: checking Vohra PMF infrastructure
rg "vohra|veryDisappointed|pmf_survey" src/      # ❌ misses vohraPMFResponse, VohraPMFSurveyModal
rg -i "vohra|verydisappointed|pmf|hxc" src/      # ✓ catches all casings
```

**Canonical false-negative classes** (the 2 the v1.1 audit committed
2026-05-12 + the 5 from v1.0):

- (NEW v1.2) M-2 false negative — claimed Vohra PMF infrastructure
  missing because grep `vohra|veryDisappointed|pmf_survey` returned nothing.
  Actual: `vohraPMFResponse` + `VohraPMFSurveyModal` + `VohraHxcPmfTile`
  all shipped 2026-05-04. Always grep case-insensitively.
- (NEW v1.2) M-5 partial false negative — claimed Algorithm Aversion
  marketing surfaces missing. Actual: Education Room flashcards
  (`bias_algorithm_aversion` + `bias_calibrated_rejection`) ALREADY
  SHIPPED on cognitive_biases deck. Only gap was buyer-facing surfaces
  (pricing FAQ + Sparring scenario). Always check the Education Room
  flashcard inventory before claiming a paper-application is invisible.
- (v1.0) Weekly digest false negative
- (v1.0) African regulators false negative
- (v1.0) Compare route false negative
- (v1.0) Persona overlap (Sankore split into 3 inside-fund personas)
- (v1.0) Phase-fit blindness

### Discipline 2 — evidence trace

Every finding must cite `file:line` + snippet. NO unverified claims.

### Discipline 3 — phase-fit tag

Tag every brainstorm item `[WEDGE]` / `[BRIDGE]` / `[CEILING]` /
`[INFRA]`. Phase tag drives the founder's "ship now vs defer" decision.

### Discipline 4 — auto-implement Section 1 + Section 6 only

Section 1 bug fixes + Section 6 chat-context updates ship as commits.
Everything else (brainstorm / personas / critical pickups) surfaces to
the founder as a triage menu.

### Discipline 5 — pre-execution check (boil-the-ocean compatibility)

Before each auto-fix, re-check against the rules codified earlier in
the session. Trigger words demanding re-check: "named prospects",
"public", "/for/", "marketing surface", "/pricing", "dark mode".

### Discipline 6 — no named-prospects on PUBLIC surfaces

Sankore / LRQA / Mr. Reiner / Mr. Gabe can be named freely in
founder-hub-internal artefacts. NEVER name them in marketing copy,
JSON-LD, source comments shipped to the client bundle, or any URL
visible to non-authed traffic.

### Discipline 7 — backtick balance on giant template literals

`src/app/api/founder-hub/founder-context.ts` is one giant template
literal exported as `FOUNDER_CONTEXT`. Every edit must preserve the
even backtick count. Verify with:

```bash
awk 'BEGIN{c=0} {n=gsub(/`/,"`"); c+=n} END{print "backticks:", c, "(must be even)"}' \
  src/app/api/founder-hub/founder-context.ts
```

### Discipline 8 — AccentCard usage check

When auditing settings or dashboard surfaces, run:

```bash
rg -L '<AccentCard' src/components/{settings,dashboard}/*.tsx
rg 'className="card"' src/components/{settings,dashboard}/
```

If a surface has 3+ cards stacked without AccentCard, flag for
migration (per CLAUDE.md AccentCard discipline).

### Discipline 9 — view-switcher pattern

When collapsing sibling pages into a parent's view-switcher (`?view=X`
URL pattern), prefer the URL-param approach over a child route.
Decision-log → /decisions?view=log is the canonical example (Phase G
2026-05-10).

### Discipline 10 — canonical-import discipline

When extracting a helper, grep `src/lib/utils/` first. The pre-commit
`scripts/lint-canonical-imports.mjs` blocks new local re-implementations
of `formatBiasName` / `severityColor` / `gradeFromScore` / `formatDate` /
`truncate` / `extractIp`. Always check the BANNED list before writing a
new utility.

---

## Recurring Critical-Pickup Templates

These are drift classes that should be re-checked on every audit:

### (NEW v1.2) Matrix-vs-taxonomy parity

`INTERACTION_MATRIX` in `src/lib/ontology/interaction-matrix.ts` MUST
cover every entry in `BIAS_EDUCATION`. The parity test at
`src/lib/ontology/interaction-matrix.test.ts` enforces this. If a
future bias-taxonomy growth ships without matrix extension, flag
immediately — even if tests pass (the parity test is the safety
net; the cascade rule is the discipline).

### (NEW v1.2) Methodology version progression cards

`/r2f-standard#calibration` section shows 7 versions of the methodology
chain (legacy 2.0.0 → seed → 2.1.0 → 2.2.0 → 2.3.0 → 2.4.0 → per-org).
When METHODOLOGY_VERSION advances in `dqi.ts`, the cards in
`R2FStandardClient.tsx` MUST update in lockstep. Three-surface cascade:
const + JSDoc + UI cards.

### Framework-count drift

`getAllRegisteredFrameworks().length` is currently 19 (was 17 pre-2026-04-29
ISA Nigeria 2007 ship). Any hardcoded "17-framework" or "17 frameworks"
on a customer-facing surface is drift.

### Bias-count drift

`Object.keys(BIAS_EDUCATION).length` is currently 22. Any hardcoded
"20 biases" / "20-bias taxonomy" / "30+ cognitive biases" is drift.
The "30+ cognitive biases" phrasing is DEPRECATED (CR-3 lock 2026-05-13).

### Case-count drift

`HISTORICAL_CASE_COUNT = ALL_CASES.length` is currently 143. Any
hardcoded number that differs is drift.

### Silent-catch ratchet

Read `scripts/lint-silent-catches.mjs` line ~151 const
`SILENT_CATCH_BASELINE` for the current value. **As of 2026-05-13: 175.**
Bump only with inline-comment naming the exception class + CLAUDE.md
trajectory update in lockstep.

### Count-drift ratchet

Read `scripts/lint-counts.mjs` for the current const. **As of 2026-05-13: 77.**

---

## Persona-Rotation History

Track which personas have been audited recently to ensure fresh rotation:

- **2026-05-13** (this prompt's drafting context): no audit ran with these
  disciplines yet; the CR-2 ship updates v1.1 → v1.2 + the next nightly
  audit picks a fresh triple from the unused-recently set.
- **2026-05-12 audit** (v1.1): rotated **Damien** (mid-market Head of Corp
  Dev/M&A, Phase 1 HXC) + **Aisha** (smaller-fund GP, Phase 1 HXC) +
  **James** (F500 GC, ceiling anchor).
- **2026-05-07 audit**: rotated **Margaret** (F500 CSO) + **Adaeze**
  (Pan-African fund partner) + **James** (F500 GC).
- **2026-05-02 audit**: rotated **James** (F500 GC) + **Adaeze** (Pan-
  African fund partner) + **Marcus** (fractional CSO).

**Suggested triples for the next 2-3 audits** (mutually-exclusive
archetypes, mix of Phase 1 HXC + expansion):

- **Henrik** (PE-backed founder, Phase 1 HXC) + **Marcus** (fractional CSO,
  Phase 1 HXC) + **Riya** (pre-seed VC associate). Fresh wedge focus.
- **Potomac** (boutique M&A advisor) + **Damien** (mid-market corp dev,
  Phase 1 HXC) + **Adaeze** (Pan-African fund partner). Fresh ceiling
  + expansion mix.
- **Margaret** (F500 CSO) + **Aisha** (smaller-fund GP, Phase 1 HXC) +
  **Henrik** (PE-backed founder, Phase 1 HXC). Cycles back to F500 with
  fresh HXC partners.

---

## Output Structure

Sections 1-10 same as v1.1. Section 1 (bug fixes) + Section 6 (chat
context updates) auto-implement. Sections 2-9 surface as triage menu.

### Section 9 — Critical Pickups

In addition to the audit-specific findings, surface any pickups from the
"Recurring Critical-Pickup Templates" list above that show drift.

### Section 10 — Self-check

Before emitting the report, verify:

- [ ] Pre-flight passed (HEAD == origin/main; lints at baseline; tsc clean)
- [ ] Discipline 1 (grep-before-assert) re-checked on every "missing" claim
- [ ] Section 1 + Section 6 changes pass tsc + 5 lints
- [ ] founder-context.ts backtick balance preserved (even count)
- [ ] Persona triple is mutually exclusive + fresh from rotation history
- [ ] At least one critical-pickup template re-checked
- [ ] No named-prospect leaks to PUBLIC surfaces in any Section 1 fix
- [ ] False-positive self-rate stated explicitly at end of report

---

## Reminder: the audit is bug-fixes-only by default

The audit prompt v1.0 / v1.1 / v1.2 all share the SAME execution
discipline: auto-implement only the obvious bug fixes (Section 1) +
the chat-context updates (Section 6). Everything else surfaces to the
founder as a triage menu. This protects against the audit becoming a
"build a bunch of new features without explicit founder approval"
trap.

If the founder later says "boil the ocean + ship M-X + M-Y", that's
the post-audit follow-up where new features land — but the audit
itself stays disciplined.
