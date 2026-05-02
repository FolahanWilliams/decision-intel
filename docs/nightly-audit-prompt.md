# Nightly Audit Prompt v1.0 (locked 2026-05-02)

Copy-paste this prompt into a fresh Claude Code session at the start of an
audit run. It composes with the V2 persona-audit disciplines codified in
[persona-audit-prompt.ts](../src/components/founder-hub/persona-audit/persona-audit-prompt.ts) — that file is the source of truth for the
persona round (Section 8 below); this doc is the wrapper for the broader
codebase + product + positioning audit around it.

The prompt is structured into 10 numbered sections with explicit discipline
rules. Skipping a discipline = invalid output. The founder spot-checks 3
random findings per audit; one fabricated trace rejects the whole report.

---

## How to run this audit

**Default execution context:** the scheduled audit fires, Claude clones
or fetches `main` from `github.com/FolahanWilliams/decision-intel`, and
the working tree contains every file the prompt references —
`CLAUDE.md`, `TODO.md`, `src/lib/constants/icp.ts`,
`src/lib/constants/trust-copy.ts`, `docs/gtm-plan-v3-3-2026-05-01.md`,
`src/components/founder-hub/persona-audit/persona-audit-prompt.ts`,
`DESIGN.md`, plus the full codebase. Filesystem access is assumed.

### Pre-flight: force a fresh checkout (mandatory FIRST step)

Cached/stale clones are the failure mode the 2026-05-02 first run hit —
the scheduled environment had pinned the repo at a snapshot from 6 days
prior, so 5 of 8 context files appeared "missing" when they had
shipped on `origin/main` 4 days earlier. Before doing ANYTHING else,
run this sequence and confirm the output:

```bash
git fetch --all --prune
git checkout main
git reset --hard origin/main
git log -1 --format='HEAD = %h %s (%cd)' --date=short
git rev-parse HEAD
git rev-parse origin/main
```

The last two `rev-parse` lines MUST be identical. If they differ, the
checkout did not refresh — STOP, report which step failed, and do not
proceed. (If the environment can't run `git reset --hard`, the schedule
itself needs to be reconfigured — name the constraint and halt.)

After the freshness check, verify the 8 context files exist by listing
them. If any are missing AFTER a confirmed fresh `origin/main`
checkout, the prompt itself is out of sync with the repo (a real bug,
not a stale-clone bug) — flag in Section 10 and proceed scoped.

### Fallback contexts

For ad-hoc runs (Claude Desktop without a repo clone), upload the 8
files to Project Knowledge once, then run the prompt against that
project. Re-upload only when `git log` shows a new lock landed in
`CLAUDE.md`.

For local Claude Code sessions (CLI / VS Code extension), the working
directory is already current — skip the pre-flight `git reset --hard`
and just run `git fetch --all && git status` to confirm you're not on
a divergent feature branch.

---

## Why this prompt exists

Prior audit runs surfaced consistent failure modes:

- **False positives** — claiming features are missing without grepping (the
  2026-04-29 v1 audit had 3 false negatives that took 30+ min each to verify).
- **Persona overlap** — 3 of 5 personas collapsed into the same buyer voice,
  weighting one org 3× and producing redundant findings.
- **Phase-fit blindness** — Tier-1 "blockers" that were team-workflow asks
  for a pre-revenue solo founder.
- **Bug-vs-brainstorm bleed** — auditor implements a refactor disguised as
  a bug fix, blowing scope past what the founder approved.
- **Generic suggestions** — "improve onboarding," "consolidate UI," "talk to
  customers" — advice that doesn't trace to a specific file or signal.
- **Drift-class blindness** — count literals / hardcoded hex / duplicated
  helpers go unflagged because the auditor doesn't grep for the canonical
  source first.

This prompt's discipline rules close each of those failure modes.

---

## The Prompt (copy-paste below this line into a fresh session)

You are running a **deep nightly audit** on Decision Intel
(`/Users/folahan/decision-intel` — Next.js 16 + React 19 + Prisma 7.8 +
Supabase + Vercel; pre-revenue, solo-founder, refinement phase).

Your job: produce a 10-section evidence-grounded report. Implement the bug
fixes (Section 1) + AI-chat-context updates (Section 6) immediately. Surface
all other sections as a brainstorm queue for the founder to triage.

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
8. `docs/gtm-plan-v3-3-2026-05-01.md` (current GTM lock — the canonical
   plan that supersedes v3.2)

After loading: state in one sentence what phase Decision Intel is in
RIGHT NOW (per CLAUDE.md). If you can't, you haven't read enough.

### Mandatory disciplines (failure = invalid output)

1. **Grep-before-assert.** Every "X is missing" / "Y doesn't exist" claim
   must cite the exact `rg` command + result. The 2026-04-29 audit's three
   biggest misses were:
   - "No email digest" — `sendWeeklyDigest` shipped 04-23
   - "No African regulators" — 12 African frameworks already shipped
   - "Compare route hidden" — exists, just not surfaced from deal context
   Don't repeat these. Format:
   ```
   evidence:
     grepCommand: "rg -n 'sendWeeklyDigest' src/"
     grepResult: "src/lib/notifications/email.ts:190:export async function sendWeeklyDigest"
     verifiedAbsent: false  // exists, finding reframes as discoverability
   ```

2. **Evidence trace.** Every bug + every brainstorm cites `file:line` with
   a quoted snippet of the offending lines. Vague claims ("the X page feels
   cluttered") are auto-rejected. Specific claims ("OverviewTab.tsx:142
   stacks PaperApplicationsCard above RemediationChecklist, inverting
   severity-priority for first-time visitors per the EnhancedEmptyState
   showBrief contract") are valid.

3. **Phase-fit tag.** Tag every brainstorm finding with one of:
   - `[WEDGE]` — fits the next 6 months (individual £249/mo buyers)
   - `[BRIDGE]` — fits months 6-12 (Sankore design partner — naming
     Sankore in audit output is fine per Discipline 6; the ban is on
     PUBLIC surfaces only)
   - `[CEILING]` — fits months 12-24 (F500 corp dev / cross-border M&A)
   - `[INFRA]` — cross-phase platform / observability / security work
   - `[NEVER]` — out-of-category for DI; reject

   `[CEILING]` items during `[WEDGE]` phase are out-of-scope unless they
   structurally enable wedge motion (e.g., the Pan-African regulatory map
   is `[INFRA]` because it's the moat layer that protects every phase).

4. **False-positive cap.** Self-rate your false-positive rate at the
   bottom (Section 10). Above 25% → re-audit before submitting. The bar
   is calibrated against the V1 failure rate (~18% at the time of the
   2026-04-29 audit).

5. **Canonical-import discipline.** Before flagging count drift /
   hardcoded color / duplicated helper, grep for the canonical source.
   Report only when the consumer doesn't import from canonical. Sources of
   truth (this list is exhaustive — DO NOT propose creating new ones):
   - `src/lib/constants/icp.ts` — positioning vocabulary
   - `src/lib/constants/trust-copy.ts` — procurement vocabulary
   - `src/lib/constants/human-audit.ts` — `SEVERITY_COLORS`, `NUDGE_TYPE_LABELS`
   - `src/lib/constants/bias-education.ts` — `BIAS_EDUCATION` (22 entries)
   - `src/lib/scoring/dqi.ts` — `GRADE_THRESHOLDS`, `WEIGHTS`
   - `src/lib/utils/grade.ts` — `dqiColorFor`, `gradeFor`
   - `src/lib/compliance/frameworks/index.ts` — `getAllRegisteredFrameworks` (19)
   - `src/lib/data/case-studies/index.ts` — `HISTORICAL_CASE_COUNT`
   - `src/components/founder-hub/path-to-100m/data.ts` (barrel) — investor
     metrics, network nodes, killer responses, etc.

6. **No named-prospect leaks to PUBLIC / SHIPPED surfaces.** The audit
   output is private (founder-eyes-only), so naming real prospects in
   findings is FINE — Sankore, LRQA, Ian Spaulding, Mr. Reiner, Mr. Gabe
   are all in-scope when they sharpen a finding ("LRQA's EiQ supply-chain
   product overlaps integration path #3 — recommend X before the meeting"
   is more useful than "an assurance firm's product overlaps…").

   What this rule DOES forbid: any finding that recommends shipping a
   named-prospect reference into a PUBLIC surface (marketing pages,
   shipped HTML/JSON-LD, code comments that survive into production
   bundles, commit messages, public-facing docs). If a finding says
   "build a /sankore page" or "add an LRQA testimonial to /security"
   — auto-reject it (per CLAUDE.md no-named-prospects-on-marketing rule).
   The Wiz $32B exit reference IS approved on public surfaces per
   CLAUDE.md (founder bio anchor); other firm names are NOT.

   Quick test: would the founder be comfortable if this finding leaked
   to a procurement reviewer? If yes, name names. If it ships to /security,
   strip them.

7. **No-implementation-on-brainstorm.** Bug fixes (Section 1) + AI chat
   updates (Section 6) implement immediately. Sections 2-5, 7-9 surface
   for founder triage; **DO NOT IMPLEMENT THEM**. The founder is
   explicitly in refinement mode and triages personally.

### Output structure (10 sections, in this exact order)

#### Section 1 — Bug Fixes (you auto-implement these)

For each bug, return:
- `file:line`
- Evidence (1-2 sentences: `tsc` error, `rg` output, Prisma error, or
  test failure)
- Fix shape (what changes)
- Risk class: `data_loss` / `ui_regression` / `drift` / `silent`

What counts as a bug:
- TypeScript errors caught by `npx tsc --noEmit`
- Slop-scan baseline regressions (>0.5 score-per-kloc jump)
- Count-drift literals vs canonical (e.g., "20 biases" hardcoded when
  `BIAS_EDUCATION.length === 22`)
- Hardcoded hex / Tailwind dark-mode classes vs CSS vars (per CLAUDE.md
  Styling lock)
- Stale CLAUDE.md sections that contradict actual code state
- Silent error catches without `@schema-drift-tolerant` marker (per the
  silent-catch ratchet at baseline 119)
- Cross-component drift (≥3 local copies of a constant that should be a
  canonical import)
- Em-dash count-cap violations on marketing surfaces (>1 per page)
- Named-prospect leaks (per the no-named-prospect rule)

What does NOT count as a bug (= goes to Section 3 brainstorm):
- New features
- Refactors touching >2 files
- Layout / visual changes
- Copy edits beyond literal correctness
- Performance optimizations without a profiler trace
- "I think this could be better" without a concrete fix

Cap: ship at most ~10 bug fixes per audit. If more, rank by risk and
defer the bottom half to brainstorm. Bug fixes ship as one commit per
discrete fix (per CLAUDE.md "Commit after each logical unit").

#### Section 2 — Brainstorm: Moat & undeniable value proposition

For each idea:
- Phase tag `[WEDGE]` / `[BRIDGE]` / `[CEILING]` / `[INFRA]`
- One-line claim ("R²F #10 (Calibrated Rejection of Subjective
  Confidence) is the highest-leverage paper application Margaret-class
  CSOs ask for")
- **Why now** — evidence-grounded (competitor move / customer signal /
  regulatory deadline / NotebookLM synthesis date)
- 2-3 sentence expected impact
- Effort: `S` (≤4hr) / `M` (≤2 days) / `L` (>2 days)
- Risk if NOT done

Categories to explore explicitly:
- R²F operationalisation (paper applications #1, #4, #7, #10 are queued
  per CLAUDE.md "Kahneman & Klein paper-application sprint" — name the
  specific paper, not generic "more rigor")
- Outcome Gate enforcement maturation (per CLAUDE.md Phase 1+2+3 ship
  history)
- Decision DNA / per-org Brier flywheel acceleration
- Cloverpop / IBM watsonx / agentic-shift defensive moves (per CLAUDE.md
  External Attack Vectors)
- Pan-African / EM differentiation as `[INFRA]` moat layer (per CLAUDE.md
  v3.2 lock — this is moat, NOT wedge)
- Regulatory-tailwind moves (EU AI Act Aug 2026 deadline)

Anti-patterns to reject in this section:
- "Build a [generic SaaS feature]" (e.g., notifications, dashboards) —
  must connect to a specific moat layer or persona pain
- "Improve [X]" without naming what changes
- Anything that widens exposure to External Attack Vectors per CLAUDE.md

#### Section 3 — Brainstorm: UI/UX consolidation & flow

For each idea:
- Phase tag
- File(s) affected (specific paths)
- Streamlining shape — what consolidates / what merges / what disappears
- User-flow improvement — name the specific persona doing the specific
  task (per Section 8 archetypes)
- Mobile breakpoint impact (per CLAUDE.md mobile locks: doc-detail,
  InlineAnalysisResultCard, founder-hub Ask AI button)

Anti-patterns to flag:
- Tab/page proliferation (28-tab Founder Hub is at the practical limit)
- Modal stacking (>2 modals can render simultaneously per CLAUDE.md
  brainstorm item from 2026-05-01)
- Discovery dead-ends (orphaned features per the Decision DNA pattern
  that shipped 2026-04-27)
- Redundant CTAs (>1 way to do the same task without coordination)
- Heading typography drift (5 of 97 dashboard files use the canonical
  `.section-heading` utility per the 2026-04-29 brainstorm)

What does NOT belong here:
- Pure visual polish (goes to Section 4)
- Adding new pages (goes to Section 2 if it's moat work)

#### Section 4 — Brainstorm: Visuals & theme alignment

Per CLAUDE.md:
- Display-serif Instrument Serif on entry-point + deliverable surfaces
  (landing H1, dashboard headline, /ask H1, document-detail headline)
- Sans-serif Inter for utility / authenticated daily-use surfaces
- Light theme exclusively (`.dark` class is dormant maintenance posture)
- CSS variables not hardcoded hex (per Styling lock)

For each idea:
- File(s)
- Current state (what exists today)
- Proposed state (what should exist)
- Why this matches the canonical aesthetic (must reference DESIGN.md or
  a specific CLAUDE.md typography lock)

Specific surfaces to evaluate:
- AnatomyOfACallGraph pentagon consistency across landing /
  how-it-works / dashboard reveal / favicon (per the 2026-04-29 D1 lock)
- Severity color usage (per `SEVERITY_COLORS` canonical-import discipline
  locked 2026-05-01)
- The 5 visualization components inside severity wrappers (per the
  light-theme audit rule)

#### Section 5 — Brainstorm: Founder's Hub refinement

Evaluate the 28-tab Founder Hub against actual founder usage. Per CLAUDE.md
the consolidation that already happened (Outreach Hub: Pipeline +
Messages + Design Partners merged 2026-04-28).

Specific surfaces to interrogate:
- StartHereTab map discoverability (per the 2026-04-28 dynamic-map lock)
- 28-tab grouping in 5 clusters (Start / Product / Go-to-Market /
  Intelligence / Tools)
- Education Room engagement signals (per the SM-2 spaced repetition
  state in localStorage)
- Sparring Room v3 grade trends (per the DQI uptrend visualization lock)
- AI chat starter prompts per role (per the role-keyed starter arrays
  shipped in batch 2 — 2026-04-30 A8)
- 3-positioning-tab cluster overlap (CompetitivePositioningTab +
  PositioningCopilotTab + CategoryPositionTab — flagged in 2026-04-29
  brainstorm as ~65% overlap, OutreachHub-style consolidation candidate)

For each idea, name the specific tab(s) + file(s) + the consolidation
or refinement shape. Founder spends 50-70 hr/week here; respect that
this is HIS daily surface, not a generic founder-hub product.

#### Section 6 — AI chat context updates (you auto-implement)

Diffs to `src/app/api/founder-hub/founder-context.ts` for any of:
- New positioning lock landed in CLAUDE.md (since the last context update)
- New tab routing rule (founder asks "X" → chat should route to tab Y)
- New banned/locked vocabulary (per CLAUDE.md positioning vocabulary lock)
- New CLAUDE.md sections that should propagate to chat coaching
- Stale entries (RECENTLY SHIPPED items from >14 days ago should rotate
  out)
- POLISH SWEEP LOG entries from since the last audit

Per CLAUDE.md F3 lock: NO BACKTICKS in new content (single quotes for
code refs, `=&gt;` for arrows) so the giant template literal stays
balanced.

Verify by reading the file end-to-end before committing — broken
template literals silently corrupt every chat message until the next
audit.

#### Section 7 — Personalized founder tips (3-5 tips, max)

Discipline:
- Specific to Folahan: 16yo solo, Lagos home + UK residence, US-bound at
  18 (Stanford / UC Berkeley November 2027), 50-70 hr/wk, no co-founder,
  $30M cash exit target, AP system not A-levels, six study halls / week
- Reference REAL signal: the last 5 commits / a recent NotebookLM
  synthesis note ID / a market move dated within the last 14 days / a
  named CLAUDE.md lock / a TODO.md item
- Action-shaped: "Do X by Y because Z" not "consider doing X"
- Avoid generic SaaS-founder advice ("network more", "talk to customers",
  "ship faster", "don't burn out") — these add zero value

Examples of valid tips:
- "Schedule a 30-min NotebookLM synthesis pass on the master KB this
  Sunday before the Monday networking event — fresh quotes from the
  Goldner Discovery deck will inflect Wednesday's Sankore-class warm
  intro"
- "The Outcome Gate Phase 3 auto-prefill ratchet ships data flywheel
  velocity faster than Cloverpop's data advantage compounds — ship the
  hard-default before the next paid pilot, not after"

Examples of invalid tips:
- "Focus on customers" (generic)
- "Don't get distracted by feature work" (already known, in CLAUDE.md)
- "Consider talking to advisors" (no specific action / outcome)

#### Section 8 — Persona audit round (V2 disciplines)

Use `PERSONA_AUDIT_PROMPT_V2` from
`src/components/founder-hub/persona-audit/persona-audit-prompt.ts` —
that file is the canonical source of truth for this section. Pick 2-3
mutually-exclusive archetypes from `PERSONA_ARCHETYPES`:

1. F500 Chief Strategy Officer (Margaret archetype — corp_strategy_lead)
2. Mid-market PE Head of M&A (Richard archetype — pe_ma_head)
3. Pan-African fund partner (Adaeze archetype — em_fund_partner; treat
   as `[CEILING]` moat layer, not wedge — DI is NOT Pan-African-led)
4. Senior corp-dev analyst (Marcus archetype — corp_dev_analyst)
5. F500 General Counsel / audit-committee chair (James archetype —
   gc_audit_chair)

ROTATE which 2-3 you pick across audit runs. Don't run the same triple
twice in a row. Cap: ≤3 findings per persona, 12 total.

Per persona, return as `PersonaAuditFinding[]` shape (per the file). Each
finding carries:
- `[LIKE]` — specific surface they'd value, with file:line evidence
- `[CHANGE]` — specific friction, named against their actual workflow
- `[BLOCKER]` — what kills the deal at procurement / first impression

Plus the synthesis section per the V2 prompt:
- False negatives caught + retracted
- Phase-fit recommendation (ship now vs queue for after first paid pilot
  closes)
- Persona-overlap consolidations

Real prospect/firm names are FINE in this section per Discipline 6 —
this report is private. Use them when they sharpen a finding (specific
LRQA / Sankore / Wiz / Mr. Reiner-network context > generic archetype).

#### Section 9 — Critically important things the founder didn't ask about

Surface UP TO 3 things the founder didn't explicitly mention but you
flagged as load-bearing. Examples that qualify:
- Approaching deadline (regulatory: EU AI Act Aug 2026; fundraise: Q4
  2026 / Q1 2027 seed conversation gate)
- Drift in a load-bearing claim (vocabulary lock at risk of decay; a
  CLAUDE.md section >30 days old that contradicts current code)
- Compounding cost (feature shipping faster than test/observability
  coverage; the 2026-05-01 zod-prisma-types + Renovate locks were the
  response to this exact pattern)
- External attack vector materialising (Cloverpop product release / IBM
  AI announcement / Palantir agentic move)
- A founder constraint you read in CLAUDE.md that's not being respected
  (e.g., "Claude IS the local build check" — has any recent commit
  pushed without `npx tsc --noEmit`?)

Each item carries:
- One-line description
- Why it matters now
- Suggested action (NOT auto-implemented)
- Specific evidence trace

DO NOT pad this section. Three is a ceiling, not a target. Zero is a
valid answer if nothing qualifies.

#### Section 10 — Self-check (mandatory; failure = invalid output)

Run this checklist before submitting:

- [ ] Did I run the pre-flight `git fetch && git reset --hard origin/main`
      and confirm `HEAD == origin/main`? (Cached/stale clones are the
      first failure mode — never trust the working tree without this
      check.)
- [ ] Did I successfully read all 8 context files from the working tree
      at audit start? (If any read failed AFTER a confirmed fresh
      checkout, the prompt is out of sync with the repo — flag it and
      proceed scoped, don't STOP.)
- [ ] Did I read them in the listed order?
- [ ] Did I follow Discipline 1 (grep-before-assert) for every "missing"
      claim?
- [ ] Did I follow Discipline 2 (evidence trace) for every finding?
- [ ] Did I follow Discipline 3 (phase-fit tag) for every Section 2-5
      finding?
- [ ] Did I follow Discipline 6 (no named-prospect leaks) across all 10
      sections?
- [ ] Section 8 personas: are they mutually exclusive (≤1 per buyer
      org)?
- [ ] Section 1 bugs: did I cap at ~10 and rank by risk?
- [ ] Section 7 tips: are they action-shaped + Folahan-specific (not
      generic)?
- [ ] False-positive self-rate: ____% (target <25%; >25% → re-audit)
- [ ] Did I implement Section 1 + Section 6 only? (Sections 2-5, 7-9
      stay as brainstorm.)

If any checkbox fails, fix before submitting.

### After submitting

The founder reads in this order:
1. Section 10 self-check (validates the audit before reading any findings)
2. Section 1 bug fixes (already shipped — confirms or rejects)
3. Section 9 critical pickups (what HE missed)
4. Sections 2-5, 7 brainstorm queue
5. Section 8 persona round
6. Section 6 chat context diff (already shipped)

Founder triages by phase tag + severity. Anything tagged
`post_pmf_team_scope`, `post_series_a_scale`, or `[CEILING]` during a
`[WEDGE]`-phase audit goes to the queue, not the next sprint.

---

## Versioning

- v1.0 (2026-05-02) — initial lock; composes with persona-audit-prompt.ts V2
- Edit this doc, not a copy in chat. The lock travels with the file.

When updating: bump version + add changelog entry above. The discipline
rules and section structure should be backward-compatible across versions
unless a documented audit-failure mode forces a rewrite.
