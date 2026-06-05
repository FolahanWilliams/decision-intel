# Nightly Audit Prompt v1.3 (locked 2026-06-05)

**Self-contained.** This file folds the former v1.1 full prompt + the v1.2
delta (`docs/audits/nightly-audit-prompt-v1-2.md`) into ONE copy-paste
document, and adds the enforcement-gate / transactional-correctness
discipline (the class that slipped past every prior run — see "Why this
prompt exists" #7). Copy everything below "The Prompt" into a fresh Claude
Code session at the start of an audit run. It composes with the V2
persona-audit disciplines codified in
[persona-audit-prompt.ts](../src/components/founder-hub/persona-audit/persona-audit-prompt.ts) —
that file is the source of truth for the persona round (Section 8); this
doc is the wrapper for the broader codebase + product + positioning audit
around it.

The prompt is structured into 10 numbered sections with explicit discipline
rules. Skipping a discipline = invalid output. The founder spot-checks 3
random findings per audit; one fabricated trace rejects the whole report.

---

## How to run this audit

**Default execution context:** the scheduled audit fires, Claude clones
or fetches `main` from `github.com/FolahanWilliams/decision-intel`, and
the working tree contains every file the prompt references. Filesystem
access is assumed.

### Pre-flight: force a fresh checkout (mandatory FIRST step)

Cached/stale clones are the failure mode the 2026-05-02 first run hit —
the scheduled environment had pinned the repo at a 6-day-old snapshot, so
5 of 8 context files appeared "missing" when they had shipped on
`origin/main` 4 days earlier. Before doing ANYTHING else, run this and
confirm the output:

```bash
git fetch --all --prune
git checkout main
git reset --hard origin/main
git log -1 --format='HEAD = %h %s (%cd)' --date=short
git rev-parse HEAD
git rev-parse origin/main
```

The last two `rev-parse` lines MUST be identical. If they differ, the
checkout did not refresh — STOP, report which step failed, do not proceed.

Then verify the lints + types are at baseline BEFORE generating findings
(read each script's const for the current value — do NOT trust any number
quoted in this prompt; baselines ratchet):

```bash
npm run lint:positioning
npm run lint:silent-catches   # SILENT_CATCH_BASELINE — read scripts/lint-silent-catches.mjs
npm run lint:counts           # COUNT_BASELINE — read scripts/lint-counts.mjs
npm run lint:canonical-imports
npm run lint:doc-sync
NODE_OPTIONS='--max-old-space-size=3584' npx tsc --noEmit   # e2e/ + voice-worker/ excluded
```

If `node_modules` is absent (fresh container), run `npm install` first or
tsc reports every import as missing — that is an environment state, not a
finding.

After the freshness check, list the 8 context files to confirm they
exist. If any are missing AFTER a confirmed fresh `origin/main` checkout,
the prompt itself is out of sync with the repo (a real bug, not a
stale-clone bug) — flag in Section 10 and proceed scoped.

### Fallback contexts

For ad-hoc runs (Claude Desktop without a repo clone), upload the context
files to Project Knowledge once; re-upload when `git log` shows a new lock
landed in `CLAUDE.md`. For local CLI / VS Code sessions the working dir is
already current — skip the `git reset --hard` and just run
`git fetch --all && git status` to confirm you're not on a divergent
feature branch.

---

## Why this prompt exists

Prior audit runs surfaced consistent failure modes. Each discipline below
closes one:

1. **False positives** — claiming features are missing without grepping
   (the 2026-04-29 v1 audit had 3 false negatives, each 30+ min to verify;
   the 2026-05-12 run added 2 more — M-2 + M-5 — from wrong-casing greps).
2. **Persona overlap** — 3 of 5 personas collapsed into one buyer voice.
3. **Phase-fit blindness** — Tier-1 "blockers" that were team-workflow
   asks for a pre-revenue solo founder.
4. **Bug-vs-brainstorm bleed** — auditor implements a refactor disguised
   as a bug fix, blowing scope past what the founder approved.
5. **Generic suggestions** — "improve onboarding," "consolidate UI" —
   advice that doesn't trace to a specific file or signal.
6. **Drift-class blindness** — count literals / hardcoded hex / duplicated
   helpers go unflagged because the auditor doesn't grep the canonical
   source first.
7. **Enforcement-gate blindness (added v1.3).** The audit's entire bug
   surface (Section 1) was static / lint-shaped — tsc, count-drift,
   hex, em-dash, silent-catch, AccentCard. So a _semantic_ invariant
   violation is invisible to it. The 2026-06-05 team-seat review found a
   missing accept-time seat check, a non-atomic count-then-insert (not
   race-safe under READ COMMITTED), and a downgrade hole — none of which
   any prior nightly audit could have caught, because **you cannot grep
   for a check that isn't there.** Absence of code is invisible to text
   search; the only instrument is enumerating the invariant and tracing
   every write path. Discipline 1 (now bidirectional) + Discipline 11 +
   the Section 1 "enforcement-gate integrity" category close this.

---

## The Prompt (copy-paste below this line into a fresh session)

You are running a **deep nightly audit** on Decision Intel
(`/Users/folahan/decision-intel` — Next.js 16 + React 19 + Prisma 7.8 +
Supabase + Vercel; pre-revenue, solo-founder, refinement phase).

Your job: produce a 10-section evidence-grounded report. Implement the bug
fixes (Section 1) + AI-chat-context updates (Section 6) immediately.
Surface all other sections as a brainstorm queue for the founder to triage.

### Context to load FIRST (do not skip)

Read these in order before producing any output. Token budget: ~30k for
context, 70k for findings + implementation.

1. `CLAUDE.md` (full — the canonical source of truth for everything)
2. `TODO.md` (current priorities + DEFERRED items)
3. `src/lib/constants/icp.ts` (positioning + wedge/bridge/ceiling lock)
4. `src/lib/constants/trust-copy.ts` (procurement-grade vocabulary lock)
5. `DESIGN.md` (persona-validated layout direction)
6. `src/components/founder-hub/persona-audit/persona-audit-prompt.ts`
   (V2 audit disciplines — read `V1_AUDIT_FAILURE_MODES` carefully)
7. `git log --oneline -30` (recent ship history — DO NOT propose work that
   already shipped in the last 7 days)
8. `docs/gtm-plan-v3-5-2026-05-04.md` (current GTM lock — RATIFIED
   2026-05-04; supersedes v3.4 DRAFT entirely + v3.3 selectively on wedge
   motion / ICP sequencing / regulatory-tailwind timing / graduation
   rules; v3.3 honesty repairs all carry forward unchanged)
9. `src/components/ui/AccentCard.tsx` (visual-distinction primitive —
   locked 2026-05-09; the canonical card pattern for any surface stacking
   ≥3 cards)
10. `src/lib/data/container-link-types.ts` (Phase 3.5 cognitive-lineage
    SSOT — drives the Decision Pipeline Constellation viz)

After loading: state in one sentence what phase Decision Intel is in RIGHT
NOW (per CLAUDE.md). If you can't, you haven't read enough.

### Mandatory disciplines (failure = invalid output)

1. **Grep-before-assert — BIDIRECTIONAL (sharpened v1.3).**
   - **Absence claims.** Every "X is missing" / "Y doesn't exist" claim
     must cite the exact `rg` command + result, grepping with MULTIPLE
     CASINGS (the 2026-05-12 M-2 miss claimed Vohra PMF was missing because
     `rg "vohra|veryDisappointed|pmf_survey"` returned nothing — but
     `vohraPMFResponse` / `VohraPMFSurveyModal` shipped 2026-05-04; always
     `rg -i`). Canonical false-negative classes: weekly digest, African
     regulators, compare route (v1.0); Vohra PMF, Algorithm-Aversion
     marketing (v1.2 M-2/M-5); DiscoveryGradeImpactCard "dead code"
     (2026-05-17 — a multi-line import evaded a single-line grep, so a
     LIVE surface was wrongly called dead). Format:

     ```
     evidence:
       grepCommand: "rg -in 'vohra|verydisappointed|pmf|hxc' src/"
       grepResult: "src/...VohraPMFSurveyModal.tsx:1:..."
       verifiedAbsent: false  // exists, finding reframes as discoverability
     ```

   - **Enforcement / correctness claims (NEW v1.3).** The inverse direction
     is now policed too. If you claim a gate / limit / invariant IS
     enforced ("seats are capped," "the outcome gate fires," "this is
     atomic"), you must cite the SAME evidence rigor: a trace of EVERY
     write path that could violate it, not just the one obvious call site.
     A grep that finds `checkTeamSizeLimit` and concludes "seats are
     enforced ✓" is exactly the wrong conclusion — that check existed at
     invite time while the bug lived at accept time. "X is enforced" is an
     absence claim in disguise (you're asserting the ABSENCE of an
     unguarded path); treat it with the same burden of proof.

2. **Evidence trace.** Every bug + every brainstorm cites `file:line` with
   a quoted snippet of the offending lines. Vague claims ("the X page feels
   cluttered") are auto-rejected. Specific claims
   ("OverviewTab.tsx:142 stacks PaperApplicationsCard above
   RemediationChecklist, inverting severity-priority for first-time
   visitors per the EnhancedEmptyState showBrief contract") are valid.

3. **Phase-fit tag.** Tag every brainstorm finding with one of:
   - `[WEDGE]` — fits the next 6 months (Phase 1 HXC: fractional CSO,
     mid-market corp dev head, smaller-fund GP, PE-backed founder, all
     @ £249/mo Individual)
   - `[BRIDGE]` — months 6-12 (Sankore design partner @ £1,999/mo
     founding-pilot — naming Sankore in audit output is fine per
     Discipline 6; the ban is on PUBLIC surfaces only)
   - `[CEILING]` — months 12-24 (F500 corp dev / cross-border M&A
     @ £50K-150K ACV)
   - `[INFRA]` — cross-phase platform / observability / security /
     data-integrity work
   - `[NEVER]` — out-of-category for DI; reject

   `[CEILING]` items during the `[WEDGE]` phase are out-of-scope unless
   they structurally enable wedge motion (the Pan-African regulatory map
   is `[INFRA]` because it's the moat layer that protects every phase).

4. **False-positive cap.** Self-rate your false-positive rate at the bottom
   (Section 10). Above 25% → re-audit before submitting. The bar is
   calibrated against the V1 failure rate (~18% at the 2026-04-29 audit).

5. **Canonical-import discipline.** Before flagging count drift / hardcoded
   color / duplicated helper / one-off card shell, grep for the canonical
   source. Report only when the consumer doesn't import from canonical.
   Sources of truth (exhaustive — DO NOT propose creating new ones):
   - `src/lib/constants/icp.ts` — positioning vocabulary
   - `src/lib/constants/trust-copy.ts` — procurement vocabulary
   - `src/lib/constants/human-audit.ts` — `SEVERITY_COLORS`, `NUDGE_TYPE_LABELS`
   - `src/lib/constants/bias-education.ts` — `BIAS_EDUCATION` (22 entries)
   - `src/lib/scoring/dqi.ts` — `GRADE_THRESHOLDS`, `WEIGHTS`
   - `src/lib/utils/grade.ts` — `dqiColorFor`, `gradeFor`
   - `src/lib/utils/severity.ts` — `severityColor` (canonical wrapper)
   - `src/lib/utils/labels.ts` — `formatBiasName` / `humanizeBias` / etc.
   - `src/lib/compliance/frameworks/index.ts` — `getAllRegisteredFrameworks`
   - `src/lib/data/case-studies/index.ts` — `HISTORICAL_CASE_COUNT`
   - `src/lib/data/decision-container-modes.ts` — `CONTAINER_MODES` SSOT
   - `src/lib/data/container-link-types.ts` — `CONTAINER_LINK_TYPES`
   - `src/components/ui/AccentCard.tsx` — visual-distinction primitive
   - `src/components/founder-hub/path-to-100m/data.ts` (barrel) — investor
     metrics, network nodes, killer responses, etc.

   The pre-commit `scripts/lint-canonical-imports.mjs` blocks new local
   re-implementations of `formatBiasName` / `severityColor` /
   `gradeFromScore` / `formatDate` / `truncate` / `extractIp`. Check the
   BANNED list before writing any new utility.

6. **No named-prospect leaks to PUBLIC / SHIPPED surfaces.** The audit
   output is private (founder-eyes-only), so naming real prospects in
   findings is FINE — Sankore, LRQA, Ian Spaulding, Mr. Reiner, Mr. Gabe,
   Cornerstone, Kristian Marcus are in-scope when they sharpen a finding.
   What this rule FORBIDS: a finding that recommends shipping a named
   prospect into a PUBLIC surface (marketing pages, shipped HTML/JSON-LD,
   source comments that survive into the production bundle, commit
   messages, public docs). "Build a /sankore page" / "add an LRQA
   testimonial to /security" → auto-reject (per the CLAUDE.md
   no-named-prospects-on-marketing rule). The Wiz $32B exit reference IS
   approved on public surfaces per CLAUDE.md (founder bio anchor); other
   firm names are NOT. Quick test: would the founder be comfortable if
   this leaked to a procurement reviewer? If yes, name names. If it ships
   to /security, strip them.

7. **No-implementation-on-brainstorm.** Bug fixes (Section 1) + AI chat
   updates (Section 6) implement immediately. Sections 2-5, 7-9 surface
   for founder triage; **DO NOT IMPLEMENT THEM.** The founder is in
   refinement mode and triages personally. (If the founder later says
   "boil the ocean + ship M-X," that's the post-audit follow-up — the
   audit itself stays disciplined.)

8. **AccentCard usage check.** When auditing a tab/page that stacks ≥3
   cards in a column:

   ```bash
   rg -L '<AccentCard' src/components/{settings,dashboard}/*.tsx
   rg 'className="card"' src/components/{settings,dashboard}/
   ```

   Bare `.card` shells in a 3+ stack are a drift class per the CLAUDE.md
   AccentCard lock — flag for migration (honoring the documented carve-outs:
   skeletons, viz-internal cards, already-left-bar-accented items).

9. **View-switcher pattern recognition.** Umbrella sibling pages collapse
   into a parent surface via `?view=X` query params, not child routes
   (Decision Log → `/dashboard/decisions?view=log`, Phase G 2026-05-10).
   Flag any sibling page that's a thin wrapper around content that could
   fold into a parent's view switcher.

10. **Backtick balance on the founder-context template literal.**
    `src/app/api/founder-hub/founder-context.ts` is one giant template
    literal exported as `FOUNDER_CONTEXT`. Every edit (esp. Section 6)
    must preserve an EVEN backtick count — use single quotes for code refs
    and `=&gt;` for arrows. Verify:

    ```bash
    awk 'BEGIN{c=0}{n=gsub(/`/,"`");c+=n}END{print "backticks:",c,"(even?)"}' \
      src/app/api/founder-hub/founder-context.ts
    ```

11. **Enforcement-gate / invariant trace (NEW v1.3 — the load-bearing one).**
    For every limit / cap / quota / authz boundary / state-machine gate
    you encounter, do NOT stop at "the check exists." Enumerate the
    invariant in one sentence, then trace EVERY mutation path against it.
    Three concrete heuristics, all grep-seedable:
    - **Two-sided enforcement.** Any cap checked at _creation_ must also be
      re-checked at the _state transition that consumes it_ (invite→accept,
      draft→publish) AND on the _event that lowers the cap_ (plan
      downgrade). The seat bug: `checkTeamSizeLimit` ran at invite, never
      at accept, and never reconciled on downgrade.
    - **Count-then-write atomicity.** Any `.count()` (or `findFirst`
      existence check) followed by a `.create()` / `.update()` that
      depends on it, OUTSIDE a single locked transaction, is a race
      finding — a plain Prisma `$transaction([...])` array is NOT enough
      (READ COMMITTED lets two txns both read the pre-state). The fix is a
      row lock (`SELECT ... FOR UPDATE`) or an advisory lock inside an
      interactive transaction. Seed it:

      ```bash
      rg -n "\.count\(|findFirst" src/app/api | rg -v test   # cross-ref each with a nearby .create(
      rg -n "\$transaction\(\[" src/app/api                  # array-form txns are not atomicity guarantees
      ```

    - **Authz matrix.** For every mutation route, verify each per-field
      write is gated by the role it requires (the BiasTask PATCH lock at
      `src/app/api/bias-tasks/[id]/route.ts` models the per-field matrix;
      there is no systematic sweep — spot-check team / billing /
      document-access / outcome routes per run).

### Output structure (10 sections, in this exact order)

#### Section 1 — Bug Fixes (you auto-implement these)

For each bug, return: `file:line` · Evidence (1-2 sentences: tsc error, rg
output, Prisma error, or test failure) · Fix shape · Risk class
(`data_loss` / `ui_regression` / `drift` / `silent` / `integrity`).

What counts as a bug:

- TypeScript errors caught by `npx tsc --noEmit`
- Slop-scan baseline regressions (>0.5 score-per-kloc jump)
- Count-drift literals vs canonical (e.g. "20 biases" when
  `BIAS_EDUCATION.length === 22`; "17 frameworks" when
  `getAllRegisteredFrameworks().length === 19`). The "30+ cognitive
  biases" phrasing is DEPRECATED (CR-3 lock).
- Hardcoded hex / Tailwind dark-mode + literal-palette classes vs CSS
  vars (per the Styling lock + the `tailwind-literal-palette` backlog)
- Stale CLAUDE.md sections that contradict actual code state
- Silent error catches without `@schema-drift-tolerant` marker (read the
  `SILENT_CATCH_BASELINE` const for the current ceiling — do not trust a
  number in this prompt)
- Cross-component drift (≥3 local copies of a constant that should be a
  canonical import)
- Em-dash count-cap violations on marketing surfaces (>1 user-visible per
  page; JS/JSX comments are exempt)
- Named-prospect leaks (per Discipline 6)
- Bare `.card` shells stacked ≥3-deep instead of AccentCard (Discipline 8)
- Vitest config drift (a new sub-app with its own `node_modules` not
  excluded — per the 2026-05-10 voice-worker fix)
- **(NEW v1.3) Enforcement-gate integrity.** A cap/limit/authz checked at
  creation but NOT re-checked at the consuming transition or on the
  limit-lowering event; a `.count()`→`.create()`/`.update()` outside an
  atomic lock (count-then-write race); an array-form `$transaction` relied
  on for atomicity it doesn't provide. These ship as bug fixes when the
  fix is local (add the missing check / add a `FOR UPDATE` lock); a
  cross-cutting authz rework (>2 files) goes to brainstorm.
- **(NEW v1.3) Load-bearing mutation route with zero test coverage.** Any
  route under `src/app/api/{team,stripe,billing,webhooks}` or any
  outcome-gate / seat / document-access / member-create path with no
  matching `.test.ts`. Flag it (and, if a clean unit test is ≤~30 LOC,
  ship the test as the "fix"); the coverage-cascade lock (2026-05-16)
  covered scoring / R²F / flywheel / plan-limits but NOT the team or
  webhook routes — that gap is why the seat bugs had no failing test.

What does NOT count (= Section 3 brainstorm): new features · refactors
touching >2 files · layout/visual changes · copy edits beyond literal
correctness · perf optimizations without a profiler trace · "could be
better" without a concrete fix.

Cap: ship at most ~10 bug fixes per audit. If more, rank by risk
(`integrity` / `data_loss` first) and defer the bottom half to brainstorm.
One commit per discrete fix.

#### Section 2 — Brainstorm: Moat & undeniable value proposition

Per idea: phase tag · one-line claim · **Why now** (evidence-grounded:
competitor move / customer signal / regulatory deadline / NotebookLM
synthesis date) · 2-3 sentence expected impact · Effort `S`/`M`/`L` · Risk
if NOT done. Categories to explore: R²F operationalisation (name the
specific paper — Fractionation of Expertise #1, Improper Linear Models #4,
Algorithm Aversion #7 are shipped; the remaining queued items are edge
cases) · Outcome Gate Phase 4 data-flywheel acceleration · Decision DNA /
per-org Brier flywheel · Cloverpop / IBM watsonx / agentic-shift defensive
moves (per External Attack Vectors) · Pan-African / EM as `[INFRA]` moat
(NOT wedge — Phase 4 wedge timing only) · EU AI Act Aug 2026 tailwind ·
Decision Pipeline Constellation extensions · anything that lifts the Vohra
≥40% HXC PMF graduation signal. Reject: "build a generic SaaS feature"
without a moat/persona link; "improve X" without naming what changes;
anything that widens External-Attack-Vector exposure.

#### Section 3 — Brainstorm: UI/UX consolidation & flow

Per idea: phase tag · file(s) · streamlining shape (what consolidates /
merges / disappears) · user-flow improvement (name the specific Section 8
persona doing the specific task) · mobile breakpoint impact (per the
doc-detail / InlineAnalysisResultCard / founder-hub Ask-AI mobile locks).
Flag: tab/page proliferation (sidebar is at 7 post-Phase-G; Founder Hub at
its practical tab limit) · modal stacking (>2 simultaneous) · discovery
dead-ends · redundant CTAs · `.section-heading` typography drift ·
view-switcher candidates (Discipline 9) · bare-`.card` ≥3 stacks
(Discipline 8). Not here: pure visual polish (Section 4); new pages
(Section 2 if moat).

#### Section 4 — Brainstorm: Visuals & theme alignment

Per CLAUDE.md: Instrument Serif on entry-point/deliverable surfaces; Inter
for utility; light theme only (`.dark` dormant); CSS vars not hex;
AccentCard top-stripe (semantic accent) on ≥3 stacks. Per idea: file(s) ·
current state · proposed state · why it matches the canonical aesthetic
(cite DESIGN.md or a specific typography / AccentCard / severity-color
lock). Evaluate: AnatomyOfACallGraph pentagon consistency (landing /
how-it-works / dashboard reveal / favicon) · `SEVERITY_COLORS`
canonical-import usage · the `tailwind-literal-palette` migration backlog
(run `npm run audit:platform` for the live count) · AccentCard coverage
gaps.

#### Section 5 — Brainstorm: Founder's Hub refinement

Evaluate the Founder Hub tabs against actual founder usage (he spends
50-70 hr/wk here — this is HIS daily surface, not a generic product).
Interrogate: StartHereTab map discoverability · the 5-cluster grouping ·
Education Room SM-2 engagement signals · Sparring Room v3 grade trends +
the Phase-1 HXC tier alignment · per-role AI chat starter prompts ·
Thinking Partners persona/voice switcher · the 3-positioning-tab cluster
overlap (CompetitivePositioningTab + PositioningCopilotTab +
CategoryPositionTab — ~65% overlap, consolidation candidate; note these
are composed BY REFERENCE inside the live PositioningHubTab per its
"consolidation not reduction" lock — do NOT propose deleting them) ·
Sharran Operating Principles + Path-to-$100M surfaces · the new
Accountability Sprint / Faith OS / campaign surfaces. Name specific
tab(s) + file(s) + the consolidation shape.

#### Section 6 — AI chat context updates (you auto-implement)

Diffs to `src/app/api/founder-hub/founder-context.ts` for: new positioning
lock in CLAUDE.md · new tab routing rule (founder asks "X" → route to tab
Y; reconcile against ALL THREE routing tables — `LEGACY_TAB_REDIRECTS`,
`TAB_NAV_TARGETS` in `chat-nav.ts`, and the `[[nav]]` valid-tabId list
here) · new banned/locked vocabulary · new CLAUDE.md sections that should
propagate to coaching · stale RECENTLY-SHIPPED entries >14 days old (rotate
out) · POLISH SWEEP LOG entries since the last audit · outdated route refs
(e.g. `/dashboard/decision-log` → `/dashboard/decisions?view=log`). NO
BACKTICKS in new content (Discipline 10). Verify backtick balance + read
the file end-to-end before committing — a broken template literal silently
corrupts every chat message until the next audit.

#### Section 7 — Personalized founder tips (3-5 max)

Specific to Folahan: 16yo solo, Lagos home + UK residence, US-bound at 18
(Stanford / UC Berkeley, applies Nov 2027), 50-70 hr/wk, no co-founder,
$30M cash-exit target, AP system (not A-levels), six study halls/week,
verified i-Fitness finance internship + published 2008-crisis honors
thesis. Reference REAL signal (the last 5 commits / a NotebookLM synthesis
note ID / a market move within 14 days / a named CLAUDE.md lock / a TODO
item). Action-shaped ("Do X by Y because Z"), not "consider X." Reject
generic SaaS-founder advice ("network more," "talk to customers," "ship
faster," "don't burn out"). Valid example: "Strategy World London (BAFTA,
June 9-10) is T-N days — drill the EventPrepCard mid-market-corp-dev DM
template twice this week before the highest-signal CSO event of the next
90 days."

#### Section 8 — Persona audit round (V2 disciplines)

Use `PERSONA_AUDIT_PROMPT_V2` from
`src/components/founder-hub/persona-audit/persona-audit-prompt.ts` (the
canonical source). Roster (revised 2026-05-10 for the v3.5 HXC wedge —
junior corp-dev analyst DROPPED per sign-up gating):

**Phase 1 HXC wedge (the four buyer-class-continuous personas):**

1. **Fractional CSO** (Marcus — `fractional_cso`) — solo operator, 3-5
   client engagements, £249/mo personal. Time-pressured; needs the audit
   to compress 3hr of memo review into 60s.
2. **Mid-market Head of Corp Dev / M&A** (Damien — `midmarket_corpdev_head`)
   — deal pipeline at a $50M-$500M-revenue scale-up, personal pre-team
   budget. The most common buyer at the IC-readiness gate.
3. **Smaller-fund GP / VC partner** (Aisha — `smallfund_gp`) — £5M-£100M
   AUM, active deal flow OR LP-governance pressure. Reads IC memos in the
   back of an Uber; cares about thesis-anchor + structural-assumption
   ripple.
4. **PE-backed founder / CEO** (Henrik — `pebacked_founder`) — $80M-revenue,
   personal-decisive budget. The synergy-mirage detector is the
   highest-leverage signal for him.

**`[CEILING]` expansion (audit now to prevent drift):**

5. **F500 Chief Strategy Officer** (Margaret — `corp_strategy_lead`) —
   board-reporting, 6+ divisions. Procurement-grade lens.
6. **F500 General Counsel / audit-committee chair** (James —
   `gc_audit_chair`) — DPR shape, regulatory citations, audit log,
   indemnification cap, Sub-Processor Schedule.

**`[INFRA]` differentiation (Phase 4 wedge, moat now):**

7. **Pan-African fund partner** (Adaeze — `em_fund_partner`) — multi-
   currency, NDPR/CBN/WAEMU/PoPIA. Moat differentiation, NOT current
   wedge — audit for moat depth, not immediate revenue.

ROTATE 2-3 per run; don't repeat the previous triple; mix Phase-1 HXC +
a `[CEILING]` anchor + the `[INFRA]` differentiator across runs. Cap ≤3
findings/persona, 12 total. Each finding: `[LIKE]` (surface they'd value,
file:line) · `[CHANGE]` (specific friction vs their workflow) · `[BLOCKER]`
(what kills the deal at procurement / first impression). Plus the V2
synthesis: false negatives caught + retracted · phase-fit recommendation
(ship now vs queue post-first-pilot) · persona-overlap consolidations.
Real firm names are FINE here (private report) when they sharpen a finding.

**Persona-rotation history** (don't repeat the last triple):

- 2026-05-13: Henrik + Marcus + Riya (suggested, fresh wedge)
- 2026-05-12: Damien + Aisha + James
- 2026-05-07: Margaret + Adaeze + James
- 2026-05-02: James + Adaeze + Marcus

Suggested fresh triples: (a) Margaret + Aisha + Henrik · (b) Damien +
Adaeze + Marcus · (c) Potomac (boutique M&A advisor) + Henrik + James.

#### Section 9 — Critically important things the founder didn't ask about

UP TO 3 (three is a ceiling, not a target; zero is valid). Each: one-line
description · why it matters NOW · suggested action (NOT auto-implemented)
· specific evidence trace. Qualifying classes: approaching deadline (EU AI
Act Aug 2026; Q4 2026/Q1 2027 seed gate; Strategy World London) · drift in
a load-bearing claim (a CLAUDE.md section >30 days old contradicting code;
a vocabulary lock decaying) · compounding cost (feature velocity
outrunning test/observability coverage — the zod-prisma-types + Renovate

- vitest-exclude + coverage-cascade + cron-observability locks were all
  this pattern; the 2026-06-05 enforcement-gate bugs are the newest
  instance — load-bearing routes shipping without tests or atomicity review)
  · External Attack Vector materialising · a founder constraint not being
  respected ("Claude IS the local build check" — did any recent commit push
  without `npx tsc --noEmit`?) · Vohra ≥40% HXC PMF signal decay (kill
  criterion fires at month 4).

Always re-check the recurring drift templates: matrix-vs-taxonomy parity
(`INTERACTION_MATRIX` must cover every `BIAS_EDUCATION` key — the parity
test enforces it) · methodology-version progression cards on
`/r2f-standard#calibration` (const + JSDoc + UI in lockstep when
`METHODOLOGY_VERSION` advances) · framework / bias / case count drift
(read the canonical lengths) · the silent-catch + count-drift ratchets
(read the consts).

#### Section 10 — Self-check (mandatory; failure = invalid output)

- [ ] Pre-flight `git reset --hard origin/main` ran; `HEAD == origin/main`?
- [ ] All 10 context files read from the working tree (fresh checkout)?
- [ ] Read in the listed order?
- [ ] Discipline 1 applied BIDIRECTIONALLY — absence claims grepped
      case-insensitively AND every "X is enforced/atomic" claim backed by
      a write-path trace?
- [ ] Discipline 2 (evidence trace) on every finding?
- [ ] Discipline 3 (phase-fit tag) on every Section 2-5 finding?
- [ ] Discipline 6 (no named-prospect leaks) across all 10 sections?
- [ ] Discipline 8 (AccentCard) on stacked-card surfaces?
- [ ] Discipline 9 (view-switcher) on sibling pages?
- [ ] Discipline 11 (enforcement-gate trace) — did I enumerate ≥1
      enforcement invariant and trace ALL its write paths this run, and
      sweep `.count()`→`.create()` for atomicity?
- [ ] Section 8 personas mutually exclusive (≤1 per buyer org) + rotated
      from the previous triple + mix of wedge + moat?
- [ ] Section 1 capped at ~10, ranked by risk (`integrity`/`data_loss`
      first)?
- [ ] Section 6 changes: backtick balance preserved (even count) + tsc +
      5 lints pass?
- [ ] Section 7 tips action-shaped + Folahan-specific (not generic)?
- [ ] False-positive self-rate stated: \_\_\_\_% (target <25%; >25% →
      re-audit)?
- [ ] Implemented Section 1 + Section 6 ONLY (Sections 2-5, 7-9 stay
      brainstorm)?

If any checkbox fails, fix before submitting.

### After submitting

Founder reads: (1) Section 10 self-check → (2) Section 1 bug fixes
(already shipped) → (3) Section 9 critical pickups → (4) Sections 2-5, 7
brainstorm → (5) Section 8 personas → (6) Section 6 chat diff. Triage is
by phase tag + severity; `[CEILING]` items during a `[WEDGE]` phase go to
the queue, not the next sprint.

---

## Versioning

- **v1.0 (2026-05-02)** — initial lock; composes with persona-audit-prompt.ts V2.
- **v1.1 (2026-05-08 → refresh 2026-05-10)** — GTM canonical v3.3 → v3.5;
  added context files #9 (AccentCard) + #10 (container-link-types) +
  Disciplines 8 (AccentCard) + 9 (view-switcher); persona roster
  overhauled for the v3.5 HXC wedge (dropped junior corp-dev analyst;
  added fractional CSO / smaller-fund GP / PE-backed founder; broadened
  PE Head of M&A → Mid-market Head of Corp Dev/M&A).
- **v1.2 (2026-05-13, CR-2)** — silent-catch baseline corrected (stop
  hardcoding it — read the const); 22×22 matrix-vs-taxonomy parity +
  methodology-version-cards critical-pickup templates; M-2/M-5
  case-insensitive false-negative classes; Discipline 7 (backtick balance)
  - 10 (canonical-import) formalized; persona-rotation history.
- **v1.3 (2026-06-05)** — **folds v1.1 + v1.2 into this single
  self-contained doc** (the prior full-prompt + separate delta-file split
  was itself a smell). Adds the enforcement-gate / transactional-
  correctness discipline that every prior run was structurally blind to:
  - Discipline 1 made BIDIRECTIONAL — "X is enforced/atomic" now carries
    the same write-path-trace burden as "X is missing."
  - Discipline 11 (enforcement-gate / invariant trace) — two-sided
    enforcement + count-then-write atomicity + authz-matrix heuristics.
  - Section 1 gains two bug categories: enforcement-gate integrity, and
    load-bearing mutation route with zero test coverage.
  - "Why this prompt exists" #7 documents the 2026-06-05 team-seat miss
    (missing accept-time check + non-atomic count-then-insert + downgrade
    hole) as the failure mode this version closes.
  - All hardcoded baseline numbers replaced with "read the const."
    The former `docs/audits/nightly-audit-prompt-v1-2.md` is now historical
    (its content lives here).

Edit this doc, not a copy in chat. The lock travels with the file. When
updating: bump version + add a changelog entry above. Discipline rules +
section structure stay backward-compatible across versions unless a
documented audit-failure mode forces a rewrite.
