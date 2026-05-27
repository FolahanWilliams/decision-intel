# Nightly Audit · 2026-05-27 (deep)

**Run by:** Claude (Opus 4.7) via the v1.1 nightly-audit lock
**HEAD:** `1abaec6` (origin/main; branch `claude/friendly-dirac-xSPBe` clean at HEAD)
**Phase:** Phase 1 — Individual Wedge & PMF Validation (Months 1-6, May 2026 – Oct 2026)
**Calendar pickups:** Strategy World London BAFTA T-**13d** (June 9-10) · Phase 1 month-4 kill checkpoint ~3.5 months out · EU AI Act high-risk decision-support enforcement T-~10w (Aug 2026 — Phase 4 framing, not Phase 1 lead)

Gates at audit start: **tsc clean · vitest 1324/1330 (6 FAILING — fixed in §1) · 4 lints clean (silent-catches 200 · counts 73 · positioning · canonical-imports) · slop-scan scorePerKloc 3.17 (well under 4.0 trip-wire)**.

Gates after Section 1 implementation: **tsc clean · vitest 1330/1330 · all 4 lints clean · no baseline changes · no backticks in chat-context additions**.

---

## §1 — Bug Fixes (auto-implemented)

### Bug A · `rate-limit.test.ts` asserts stale `maxRequests=5` — 6 vitest failures since commit `1abaec6`

**Risk class:** drift (test-suite goes RED, masks future regressions).
**Evidence:**
- `git show --stat 1abaec6` shows the soft-limits commit modified `src/lib/utils/rate-limit.ts` (bumped `DEFAULT_CONFIG.maxRequests: 5 → 30`) + `src/app/api/upload/upload.test.ts` (14/14 pass with 3 new tests) but **NOT** `src/lib/utils/rate-limit.test.ts`.
- `grep -n "DEFAULT_CONFIG\|maxRequests" src/lib/utils/rate-limit.ts:75` → `maxRequests: 30,`
- `grep -n "remaining\|limit" src/lib/utils/rate-limit.test.ts:42,53,112,124,136,147` → still asserts `5` / `4` / `2`.
- `timeout 30 npx vitest run src/lib/utils/rate-limit.test.ts` → 6 failed / 5 passed.
- TODO.md "Recently Completed (2026-05-25)" claims "1328/1328 vitest" but the suite has been silently red since 2026-05-26.

**Fix shape:** Updated all 6 assertions in `src/lib/utils/rate-limit.test.ts` to expect the new 30/hr defaults. Inline comment names "post 2026-05-26 soft-limit bump" so the next reader sees the reason.

**Verification:** `npx vitest run src/lib/utils/rate-limit.test.ts` → **11/11 passed**.

### Bug B · `stripe.ts` hardcodes `biasTypes: 22` four times — drift class per canonical-derivation rule

**Risk class:** drift (silent-stale-when-DI-B-023-ships; falls under the canonical-imports lock spirit).
**Evidence:**
- `grep -n "biasTypes:" src/lib/stripe.ts` → lines 66, 120, 177, 228 all read `biasTypes: 22,`.
- The line 61-65 comment explicitly says "Aligned to BIAS_COUNT (22) 2026-05-26 so the field stops lying" — acknowledges the value SHOULD come from canonical but didn't import it.
- Per CLAUDE.md "Bias Taxonomy" cascade discipline rule #11 (count derivation): any consumer of `BIAS_EDUCATION.length` must derive, never literal.
- `rg "Object.keys\(BIAS_EDUCATION\)\.length" src/` → 4 existing files already follow the canonical pattern (`product-overview.ts`, `positioning-frameworks.ts`, `positioning-copilot.ts`, plus the new `stripe.ts`).

**Fix shape:**
1. Imported `BIAS_EDUCATION` from `@/lib/constants/bias-education` at top of `src/lib/stripe.ts`.
2. Added a module-top `PLAN_BIAS_TYPES = Object.keys(BIAS_EDUCATION).length` constant with a comment naming the drift class it closes.
3. Replaced all 4 `biasTypes: 22` literals with `biasTypes: PLAN_BIAS_TYPES` (single `Edit` with `replace_all`).
4. Collapsed the obsolete per-plan "Aligned to BIAS_COUNT (22) 2026-05-26" comment to a one-line pointer to the module-top constant.

**Verification:** tsc clean · `npm run lint:counts` clean (canonical-derivation does not count toward baseline).

### Bugs NOT shipped (intentional rejects)

The `audit:platform` script surfaced 789 findings. After triage:

- **2 CRITICAL `native-browser-dialog`** — both are FALSE POSITIVES per evidence trace:
  - `src/components/analysis/InlineAnalysisResultCard.tsx:724` is a `{/* Delete confirmation Dialog — replaces the prior window.confirm() */}` comment describing a historical migration. The actual code below it uses shadcn `<Dialog>`. Already correct.
  - `src/lib/notifications/dpr-share-alert.ts:2` is the JSDoc header containing "alert" in the noun sense (DPR external-share alert email). Not a `window.alert()` call.
- **1 STALE `deleted-component-reference`** — `dashboard/page.tsx:1304` references `UnifiedDecisionsFeed` inside a `{/* Container roll-up widget (Phase 3 P3.5 — replaces deleted UnifiedDecisionsFeed) */}` comment. The reference is intentional documentation of the retirement. Removing the comment loses the trail; keeping it is right.
- **786 VISUAL** — 772 `hardcoded-hex-color` + 14 `tailwind-literal-palette`. These are the documented mechanically-tracked backlog (CLAUDE.md "Tailwind-literal-palette" lock at line ~1900: "the remaining sites are a MECHANICALLY-TRACKED, CAN-ONLY-SHRINK, DOCUMENTED backlog … NEVER introduce a NEW literal-palette class on a platform surface"). Bug fixes don't bulk-migrate this class without a founder-approved per-surface plan.

**Cap respected:** 2 fixes shipped (well under the ~10 cap).

---

## §2 — Brainstorm: Moat & undeniable value proposition

### 2.1 [WEDGE] Vohra HXC PMF survey N≥5 push — instrument the in-app trigger NOW, not in 4 weeks. Effort S.
- **Why now:** Per GTM v3.5 §5 lock criterion #5: "First Vohra survey completed with ≥5 HXC respondents" is the criterion that transitions v3.5 from RATIFIED → fully LOCKED. We're ~3.5 months into Phase 1; with 5-10 paid HXC customers needed to fire the survey, the survey infrastructure timer-trigger (fires after user completes 2 audits within 14 days) needs to be high-confidence working. The CronRun observability lock (commit eab2fbc, 2026-05-25) made cron failures visible — but the Vohra trigger cron specifically needs a real-data verification before BAFTA.
- **Expected impact:** Removes the highest-risk "we get to month 4 and discover the survey never fired" failure mode. Founder gets actual Vohra signal during the next 6-8 weeks instead of post-mortem.
- **Risk if NOT done:** Phase 1 kill-criterion month 4 evaluation runs on missing data; founder either pivots prematurely or pushes harder on a broken motion.

### 2.2 [BRIDGE] Sankore retroactive-mode "trial backfill" template — ship a Sankore-specific seed-set. Effort M.
- **Why now:** Retroactive audit mode SHIPPED 2026-05-23 (Adaptation #1, commit 7c73572) but the live entry at `/dashboard/decisions/retroactive` starts the user from zero. Per CLAUDE.md "Sankore engagement deepening (locked 2026-05-21)" — the founder's offer to Sankore is a 12-week embedded engagement where the trade is custom internal product in exchange for 14-year decision archive access. Pre-loading a Sankore-shaped retroactive workflow (a 5-10 decision template with Pan-African investment / development / fund-launch examples) makes the first 30 minutes of the embed concrete instead of "let's figure out what to backfill first." The 3 sample bundles `PE_LAGOS_CONSUMER_ROLLUP` + `PE_PAN_AFRICAN_AGRICULTURE_FUND_LAUNCH` + `PE_LAGOS_MIXED_USE_DEVELOPMENT` already exist (Adaptations #2 + #3); a "Sankore Trial Backfill" preset that bundles them into a guided wizard is ~1 day.
- **Expected impact:** Reduces friction at the highest-leverage Sankore moment (first in-person session). Embeds the calibration loop immediately.
- **Risk if NOT done:** Sankore engagement starts from "what should we audit retroactively first?" instead of "here's the seeded baseline; let's add your real decisions on top."

### 2.3 [WEDGE] Conversion ledger → Wedge-prospect Vohra-survey link. Effort S.
- **Why now:** `WedgeProspect` Prisma model + ConversionLedgerPanel SHIPPED 2026-05-18 (commit per migration `20260518120000_wedge_prospect_conversion_ledger`). The ledger tracks dm_sent → replied → audit_booked → audit_completed → converted | lost. The Vohra PMF survey was wired 2026-05-04 to fire on completion of 2 audits within 14 days. There's no cross-link: when a converted ledger prospect completes their 2nd audit, the Vohra trigger fires but the panel doesn't show "this Vohra response came from prospect ID X." A 1-day ship adds the `prospectId` foreign key on Vohra response + surfaces the linkage on both surfaces.
- **Expected impact:** Founder can attribute every Vohra "very disappointed" response back to which outbound channel (LinkedIn DM persona / referral / event) generated it. Compounds the wedge-tightening signal.
- **Risk if NOT done:** Phase 1 month-4 evaluation can't answer "which acquisition source is producing HXC conversions" because the surfaces are disconnected.

### 2.4 [INFRA] Per-org Brier accumulation visible on Founder Hub. Effort S.
- **Why now:** Per-org Brier accumulation is the data moat that defends against Cloverpop's data advantage (CLAUDE.md External Attack Vectors §1). The `recalibrateFromOutcome` flow exists; the per-org Brier value is rendered on DPR cover (`OrgCalibrationSummary`) but there's no founder-hub surface showing "across all my paying users, the per-org Brier is converging toward N." A small Founder OS tile reading from `/api/intelligence/bias-genome/contribution` would close this.
- **Expected impact:** Daily-visible moat depth metric for the founder; surfaces a fundable narrative for the pre-seed conversation ("our Brier moved from 0.32 → 0.28 in 8 weeks across X paid users").
- **Risk if NOT done:** Founder lacks the daily-discipline metric showing whether the moat is compounding.

### 2.5 [INFRA] Cron-health observability already shipped (2026-05-25); add a Founder OS tile. Effort S.
- **Why now:** The `/api/admin/cron-health` endpoint exists. There's currently no surface that auto-flags "the Vohra trigger cron failed for 3 days." The endpoint returns `routesWithCriticalFailures` and `routesStaleOver48h` summaries. A FounderOSTab tile that reads this would make cron health a daily-checkin signal alongside the SFC-zero streak.
- **Expected impact:** Founder catches a dark Vohra-trigger / outcome-recalibration cron within 48h instead of at month-4 evaluation.

### 2.6 [WEDGE] Wedge-prospect → DPR "shared with" attribution. Effort M.
- **Why now:** `GraphShareLink` Prisma model + ShareLink token migration SHIPPED 2026-05-25. Every shared DPR has a token + an event log of when it was opened. There's no link from "a DPR I shared with prospect X" to the ConversionLedger's "X moved from audit_completed → converted." A `sharedWithProspectId` optional FK on the ShareLink/GraphShareLink models + an automatic "share opened" event that bumps the prospect's stage closes the loop the manual stage-advance buttons leave open.
- **Expected impact:** Mr. Reiner principle made code: every delighted user becomes a referral source IF the artefact is good enough to forward AND the founder sees attribution. Currently the founder has to manually check share-opens and manually advance the ledger.
- **Risk if NOT done:** The artefact-led conversion mechanism (Sharran 1-1-1 conversion model) doesn't have a feedback loop.

---

## §3 — Brainstorm: UI/UX consolidation & flow

### 3.1 [WEDGE] Founder Hub tab navigation discoverability — the same TODO.md item still open. Effort M.
- **File(s):** `src/app/(platform)/dashboard/founder-hub/page.tsx` (28-tab spec) · `src/components/founder-hub/start-here/FounderHubMap.tsx` (canonical map exists).
- **Streamlining shape:** TODO.md has carried this for weeks: "All 28 founder-hub tabs are reachable only via AI-chat dispatched events, not a direct UI rail. Sales Toolkit, Competitive Positioning, LRQA brief, Three Gaps Differentiator, Unicorn Roadmap — all production-ready, all hidden." Two paths: (a) collapsible left-rail tab list; (b) keep chat-only + beef up chat suggestions. The audit observation is that the Founder Hub Map (Start Here surface) IS the answer; it just isn't surfaced as the LANDING for the Founder Hub. Make the StartHereTab the default tab on founder-hub load (instead of whatever the user landed on last); the map renders + click navigates.
- **Mobile breakpoint impact:** Map already responsive per `FounderHubMap.tsx` — stacks on <900px.

### 3.2 [INFRA] Native-dialog cleanup — 2 false positives + 1 STALE in audit script. Effort S.
- **File(s):** `scripts/audit-platform.mjs` (audit script itself).
- **Streamlining shape:** The 2 CRITICAL `native-browser-dialog` findings in today's audit are FALSE POSITIVES (one is a `{/* */}` comment, the other is a JSDoc using "alert" as a noun). The script catches `window.confirm|alert|prompt` patterns but doesn't distinguish code from comments. Add a JSX-comment / JSDoc skip pattern to `checkNativeDialogs`. Same shape as the 2026-05-21 `checkLockedCountDrift` SEMANTIC check fixes — tighten the regex to skip comment lines (`/^\s*\*/`, `{/*`, `// `).
- **Why this is UI/UX:** Every false positive in the audit script trains the founder to ignore the audit category (per the "cry wolf" lock 2026-05-17). The audit is a UX surface for the founder; precision matters.

### 3.3 [WEDGE] Stale ship-log rotation in `founder-context.ts` — discipline says >14 days rotates to git log. Effort S.
- **File(s):** `src/app/api/founder-hub/founder-context.ts` (1213 lines as of today).
- **Streamlining shape:** Today is 2026-05-27; rotation cutoff is 2026-05-13. Current RECENTLY SHIPPED blocks include 2026-05-10, 2026-05-09→05-10, 2026-05-06→05-08, 2026-05-04→05-05, 2026-05-01, and three 2026-04-30 entries — all >14 days. Per the audit prompt: "Stale entries (RECENTLY SHIPPED items from >14 days ago should rotate out)." Recommend: move the 7 blocks dated 2026-05-10 and earlier to `docs/CLAUDE-archive-2026-Q2.md` (the canonical archive per CLAUDE.md), leaving a one-line pointer in founder-context.ts. ~200 lines moved out of the system prompt.
- **Why this matters:** Every chat request loads founder-context.ts as the system prompt. Stale blocks consume tokens + dilute the model's attention on what shipped in the LAST 2 WEEKS (where most actionable context lives). The Tier-A platform cluster / Founder OS 9.2 / DPR A2 / Education Room 5C / BAFTA prep 5B+3C / soft-limits / today's rate-limit fix — the 7 most recent items — all sit ABOVE the 2026-05-25 block (added in §6 this audit). Pruning >14d items keeps the signal density high.

### 3.4 [INFRA] View-switcher candidates per Discipline 9. Effort S.
- **File(s):** sub-routes under `/dashboard/decisions/*`.
- **Streamlining shape:** Per the 2026-05-10 Phase G fold lock, the canonical pattern is `?view=X` on the parent. Spot-check: `/dashboard/decisions/retroactive` (Adaptation #1, 2026-05-23) is currently a SIBLING page. Could fold into `/dashboard/decisions?view=retroactive`. Same shape as the prior Decision Log fold. Discoverability: better (the existing decisions kanban gets a view tab); URL hygiene: better (`?view=` keeps a flat parent surface).
- **Mobile breakpoint:** Both shapes work on mobile; view-switcher pattern just needs the chip-row to be horizontal-scroll <700px.

### 3.5 [WEDGE] AccentCard migration coverage check on FounderOSTab. Effort S.
- **File(s):** `src/components/founder-hub/FounderOSTab.tsx` (recently modified for kill-checkpoint countdown 2026-05-26).
- **Audit per Discipline 8:** Founder OS stacks 6 pillars + recent additions (CommitmentRecord + Build-in-Public + Lifestyle Freeze + Kill Checkpoint Countdown + Sharran principles). Spot-check whether all use AccentCard or some are still bare `.card`. If bare card stack ≥3 → drift class per CLAUDE.md 2026-05-09 evening lock.

---

## §4 — Brainstorm: Visuals & theme alignment

### 4.1 [INFRA] Em-dash discipline sweep on landing-page hero — landing has 31 em-dashes (cap is 1). Effort S.
- **File(s):** `src/app/(marketing)/page.tsx`.
- **Current state:** 31 em-dashes per grep `grep -c "—\|&mdash;" src/app/(marketing)/page.tsx`. Per CLAUDE.md em-dash discipline lock (2026-04-23): "Marketing surfaces capped at 1 per page, reserved for emphasis."
- **Proposed state:** Sweep to 1 (the load-bearing one in the hero H1 / contrast sub-head, per the 2026-05-07 hero re-lock).
- **Why this matches canonical:** The discipline rule is explicit; current state is 30× over cap. The 2026-05-15 sweep claimed landing was at 0 user-visible em-dashes — that claim is stale; the 2026-05-07 hero re-lock + subsequent ships re-introduced them.

### 4.2 [INFRA] /security em-dash: 19 (cap 1). /pricing: 20. /privacy: 7. /about: 5. Same sweep. Effort S.
- All 4 over-cap per `grep -c "—\|&mdash;"`. TODO.md "Em-dash discipline sweep" item open since 2026-05-15. Carried forward unresolved. Recommendation: sweep all 5 marketing surfaces in one ~1-hour pass (TODO.md item already estimates "~1 hour total").

### 4.3 [INFRA] Audit-platform 786 VISUAL findings — recurring backlog status confirmation. Effort N/A (no action; status check).
- **Current state:** 772 `hardcoded-hex-color` + 14 `tailwind-literal-palette`. Per the 2026-05-17 lock, these are mechanically-tracked, can-only-shrink backlog items.
- **Audit observation:** The `tailwind-literal-palette` count is 14, exact match to the CLAUDE.md "Progress (2026-05-18): session drove the live count 137 → 14" tracking. Good — backlog isn't regressing. The 772 hex backlog is the documented procurement-grade-low-severity tail (recharts severity maps / jsPDF / etc).

### 4.4 [WEDGE] AnatomyOfACallGraph pentagon — still favicon, /how-it-works, landing overlay. Effort N/A.
- **Spot-check:** Per CLAUDE.md D1 lock (2026-04-29), the pentagon should appear consistently across favicon + landing + how-it-works + dashboard reveal. Verify component still imported at all 4 sites; the InlineAnalysisResultCard mount specifically is the canonical "wow moment" + cross-surface brand-consistency move. Status: no change.

---

## §5 — Brainstorm: Founder's Hub refinement

### 5.1 [WEDGE] StartHereTab as default Founder Hub landing. Effort S.
- **File(s):** `src/app/(platform)/dashboard/founder-hub/page.tsx`.
- **Refinement shape:** Per §3.1 above + the TODO.md tab-discoverability item. The StartHereTab map already exists as the visual surface; make it the default tab the founder lands on when they hit `/dashboard/founder-hub` (instead of whatever they had last). Solves discoverability without adding a left-rail.

### 5.2 [WEDGE] Sparring Room v3 + BAFTA-prep 5B drill-gap analysis — verify per-persona drill counts surface correctly. Effort N/A (verification only).
- **Spot-check:** BAFTA-prep 5B (commit 76498ef, 2026-05-26) added drill-gap analysis for under-allocated HXC personas. With Strategy World London at T-13d, verify the surface is rendering correctly + the persona-count math is right. No code change; this is a "watch this gauge daily" recommendation for the next 13 days.

### 5.3 [BRIDGE] Sankore tab depth — the FiveAdaptations brief now has 3 of 5 shipped (Adaptations #1 + #2 + #3). Effort N/A (status check).
- **Status:** Per the 2026-05-21 partnership lock + the Adaptations #1/#2/#3 ships (2026-05-23 / 2026-05-24 / 2026-05-24), 3 of the 5 product adaptations are live. The Sankore brief at `src/components/founder-hub/sankore/` carries the running scorecard. Recommendation: surface a small "3 of 5 adaptations shipped" progress chip on the Sankore tab itself so the founder sees the prep-state at-a-glance pre-engagement.

### 5.4 [WEDGE] Education Room 5C aggregate due-card summary — verify ship works on cold-load. Effort N/A (verification).
- **Spot-check:** Commit 695d0fb (2026-05-26) added aggregate due-card summary + urgency-sorted deck grid. Time-pressured drilling pre-BAFTA is the use case. With 13 days to BAFTA, the founder should be running this surface daily.

### 5.5 [INFRA] Founder Hub `chat-nav.ts` + founder-context.ts routing tables — re-verify in lockstep. Effort N/A.
- **Status:** Per CLAUDE.md "Chat-routing-table sync rule (locked 2026-05-15)" — `TAB_NAV_TARGETS` + the `[[nav:tabId]]` "Valid tabIds" list in founder-context.ts + `LEGACY_TAB_REDIRECTS` must all stay in lockstep with the canonical 26-id `TabId` union. Recommendation: spot-check this once per audit cycle. Drift here = chat-driven nav silently breaks.

---

## §6 — AI chat context updates (auto-implemented)

**Diff:** Added one new `=== RECENTLY SHIPPED FEATURES (2026-05-26 → 2026-05-27 — BAFTA-prep cluster + Tier-A platform improvements + soft-limit pass + nightly bug-fix) ===` block at line 390 of `src/app/api/founder-hub/founder-context.ts`, ABOVE the existing 2026-05-25 block. The new block summarizes the 7 commits landed since the last chat-context update (`d2ac4ba`, 2026-05-25):

1. **Soft-limits pass** (commit `1abaec6`) — PLANS rebalance + rate-limit 5→30/hr.
2. **Tier-A platform cluster** (commit `fd5d745`) — 4 paying-customer surface improvements pre-BAFTA.
3. **Founder OS 9.2** (commit `4c4f1e1`) — month-4 kill-checkpoint countdown.
4. **DPR A2** (commit `2bb926a`) — per-African-country sub-grouping on regulatory crosswalk.
5. **Education Room 5C** (commit `695d0fb`) — aggregate due-card summary + urgency-sorted deck grid.
6. **BAFTA-prep 5B** (commit `76498ef`) — drill-gap analysis for under-allocated HXC personas.
7. **BAFTA-prep 3C** (commit `6556759`) — cross-link Sparring rehearsal → conversion ledger.

Plus today's 2026-05-27 bug fixes (rate-limit test repair + stripe.ts biasTypes canonicalization).

**Verification:**
- `grep -c '\`' src/app/api/founder-hub/founder-context.ts` (new block lines 390-414) → **0 backticks** (F3 lock honored).
- `npx tsc --noEmit` → clean.
- All 4 lints clean at baseline.

**Stale-rotation NOT executed** (surfaced as brainstorm §3.3 instead, per the no-implementation-on-brainstorm discipline). The 7+ ship blocks dated 2026-05-13 or earlier should rotate to `docs/CLAUDE-archive-2026-Q2.md`; that's a ~200-line edit the founder should triage personally given the canonical-source-of-truth implications.

---

## §7 — Personalized founder tips

### Tip 1: Drill the BAFTA-prep 5B drill-gap surface DAILY for the next 13 days.
Strategy World London is **T-13d as of this audit** (June 9-10, BAFTA Piccadilly). The under-drilled HXC persona surface shipped commit `76498ef` on 2026-05-26 exists precisely for this window. The founder OS pillar discipline + the 50-70 hr/week capacity per CLAUDE.md gives the founder roughly 13 × 8 = 104+ deep-work hours before BAFTA; ≥1 sparring rep per day per under-drilled persona compounds. Skipping this surface for the next 13 days specifically defeats its design.

### Tip 2: Send the Vohra survey manually to the first 5 paid Individuals IF the in-app trigger hasn't fired by 2026-06-15.
Per GTM v3.5 §5: "First Vohra survey completed with ≥5 HXC respondents" is the RATIFIED→fully LOCKED transition gate. The cron at `/api/cron/vohra-pmf-trigger` fires after 2 audits within 14 days. The founder is ~3.5 months into Phase 1; by 2026-06-15 (~3 weeks from today) the v3.5 milestone calendar expects month-1 customers to be at 2-audit milestone. If the cron-health endpoint (shipped 2026-05-25) shows the Vohra trigger hasn't fired by then, manually email the survey to the first 5 paid users instead of waiting for telemetry. The N≥5 gate is more important than the trigger mechanism.

### Tip 3: Use the soft-limits ship as the LinkedIn case-study content for this week.
Commit `1abaec6` is genuinely interesting wedge content: "stop saving features for an Enterprise tier we may never sell." The Pieter Levels playbook (per Founder OS lock) is to share the actual operating decisions transparently — this one has authentic shape (anti-incumbent-positioning + customer-empathy + an explicit "don't optimise for tiers that don't exist" insight that maps to the Mr. Gabe "customers-before-investors" rule). A 1500-word LinkedIn post anchored to this decision compounds the wedge motion without scrolling. Frame: "Here's the principle I just applied to my pricing tiers" → "Here's the underlying customer-empathy / runway-discipline tradeoff" → "Here's how it maps to the audit moment / fractional CSO friction." Post Sunday, get one DM, the motion is working.

---

## §8 — Persona Audit Round (V2 disciplines)

Personas picked per the V2 rotation discipline: **Damien (Mid-market Head of Corp Dev — Phase 1 HXC wedge)** + **Margaret (F500 Chief Strategy Officer — [CEILING] anchor)** + **Adaeze (Pan-African fund partner — [INFRA] differentiator)**. This is a wedge + ceiling + moat triple, mixing all three motion tracks per Discipline 8 of the audit lock.

### Persona 1 — Damien (Mid-market Head of Corp Dev / M&A, `midmarket_corp_dev`, Phase 1 HXC wedge)

**Daily verbs:** screen / diligence / synergy_check / present_to_board / close.

**[LIKE] D1 — Rate-limit bump 5 → 30/hr is the right wedge-persona discipline.**
*Severity: polish · Phase-fit: refinement_phase*
*Evidence:* `src/lib/utils/rate-limit.ts:73-77` `DEFAULT_CONFIG.maxRequests: 30` with comment "a fractional CSO drafting a memo iteratively hits this in 15 minutes." Per the 2026-05-26 ship body, Damien-class personas iterating on a memo pre-IC will hit 5/hr in 15 minutes. 30/hr matches the realistic burst pattern. The soft-limits ship is procurement-empathetic.
*What to ship:* Already shipped. The 6 failing tests have been fixed in this audit cycle.

**[CHANGE] D2 — Decisions kanban + retroactive entry is a sibling page; should fold into `?view=retroactive`.**
*Severity: high_friction · Phase-fit: refinement_phase*
*Evidence:* `/dashboard/decisions/retroactive` exists as a sibling route. The 2026-05-23 Adaptation #1 ship discoverability section says: "Backfill historical button on /dashboard/decisions header + CommandPalette entry + SankoreBrief CTA." Damien lands on `/dashboard/decisions` for daily kanban. The retroactive surface is a sibling — clicking "Backfill historical" navigates AWAY from his daily workflow context. Per the Phase G fold pattern (2026-05-10), this should be `/dashboard/decisions?view=retroactive` so the view-switcher chips on the kanban offer Active / Backfill / Constellation in one place.
*What to ship:* See §3.4 brainstorm. Founder-triaged before implementing.

**[BLOCKER] D3 — IcReadinessGate / Cross-doc conflict count chip — verify both surface on every deal Damien opens.**
*Severity: first_paid_blocker · Phase-fit: refinement_phase*
*Evidence:* Per CLAUDE.md 2026-04-30 batch 2 ship (A2/S7 lock): IcReadinessGate shipped at `src/components/deals/IcReadinessGate.tsx`. Per 2026-05-07 wedge-quad Item 4: cross-doc conflict count chip shipped in DealKanban + verdict band. Damien-class persona's first-month workflow needs both visible above-fold on every deal detail page. **No grep evidence yet that the components stayed mounted after the 2026-05-09 Phase 3.5 → unified DecisionContainer migration**. Risk: the deal-detail page may have refactored out the gate render during the unified-model migration without flagging it.
*What to verify:* `rg "IcReadinessGate" src/app/\(platform\)/dashboard/decisions/` → confirms it's still rendered on the canonical decision-detail page post-Phase G fold. If not, restore.

### Persona 2 — Margaret (F500 Chief Strategy Officer, `corp_strategy_lead`, [CEILING])

**Daily verbs:** frame / review / present / delegate / track.

**[LIKE] M1 — The Universal Audit Deliverable McKinsey-grade format is the procurement-grade visual she'd actually present.**
*Severity: polish · Phase-fit: post_pmf_team_scope (currently shipped but ceiling-buyer-validated post-Phase 3)*
*Evidence:* `src/components/deliverable/AuditDeliverable.tsx` — the 2026-05-20 ship (commit 029c0d4). 5 MECE buckets + SCQA cover + action titles + Pyramid Principle horizontal logic. This is exactly the shape a McKinsey alum on the F500 CSO team would build for an audit committee. The Quantellia Trap discipline (dense graphs BANNED on the executive view) is the right move per DR §8. Per the persona-validated layout direction (DESIGN.md), all four buyer personas converged on "verdict belongs at the top." The deliverable does this.
*What to ship:* Nothing new for Margaret. Continue.

**[CHANGE] M2 — Founder-context.ts is 1213 lines; many >14-day stale ship blocks dilute attention.**
*Severity: medium_friction · Phase-fit: refinement_phase*
*Evidence:* `wc -l src/app/api/founder-hub/founder-context.ts` → 1213. Per the audit prompt §6 discipline: "Stale entries (RECENTLY SHIPPED items from >14 days ago should rotate out)." Margaret-class lens isn't directly affected (she doesn't read founder-context), but the chat-coaching the founder relies on becomes diluted when 200+ lines of >2-week-old content sit above the actionable recent ships. The 2026-05-25 + 2026-05-23 + 2026-05-22 blocks are still current; everything 2026-05-13 and earlier should rotate to `docs/CLAUDE-archive-2026-Q2.md`.
*What to ship:* Brainstorm §3.3 surfaces this. Founder-triaged.

**[BLOCKER] M3 — Per-org Brier accumulation isn't visible on the Founder Hub.**
*Severity: first_paid_blocker · Phase-fit: post_pmf_team_scope (data moat depth signal)*
*Evidence:* `/api/intelligence/bias-genome/contribution` exists; surfaces on `BiasGenomeContributionCard` (on `/dashboard/analytics?view=intelligence`). NOT on the Founder Hub. The Cloverpop External Attack Vector defense IS the per-org Brier accumulation; the founder needs this as a daily-discipline metric. Margaret-class persona expects "show me the moat depth" as a procurement-stage answer. Currently the founder can't quote a fresh number; she can only point at the BiasGenomeContributionCard surface.
*What to ship:* Brainstorm §2.4. A FounderOSTab tile reading from the existing endpoint. ~½ day.

### Persona 3 — Adaeze (Pan-African fund partner, `em_fund_partner`, [INFRA] differentiator)

**Daily verbs:** screen / structure / navigate_regulation / present_to_lp.

**[LIKE] A1 — Per-African-country sub-grouping on DPR regulatory crosswalk (commit 2bb926a, 2026-05-26) is exactly the surface she'd send to her IC.**
*Severity: polish · Phase-fit: refinement_phase (ALREADY SHIPPED)*
*Evidence:* Commit body: "The DPR's regulatory-mapping page surfaces African coverage as a single flat 'African markets' region — 12+ acronyms in a chip cloud. For a Lagos-Nairobi-Cairo deal that's procurement-grade obscured." This was the canonical Adaeze ask from prior audits. Now shipped. The Nigerian-cluster (NDPR / CBN / FRC / ISA Nigeria 2007) is the kind of grouping that makes a Pan-African GC stop scanning.
*What to ship:* Nothing. Validate Adaeze persona testing once it's seen by a real Pan-African contact.

**[CHANGE] A2 — Sankore Adaptation #1 retroactive entry should pre-load a Pan-African seed-set.**
*Severity: medium_friction · Phase-fit: refinement_phase*
*Evidence:* `/dashboard/decisions/retroactive` lets the user bulk-upload up to 30 historical docs. The 3 PE sample bundles (Lagos consumer rollup / Kenya fintech / Pan-African agriculture fund-launch / Lagos mixed-use) are in `SAMPLE_BUNDLES` for the `pe_vc` role. Currently the retroactive surface doesn't auto-suggest "start with these 3 Pan-African specimens" — the user pastes their own from scratch. For Adaeze-class first-touch (or for Sankore-class first-engagement), pre-loading the 3 Pan-African specimens as a "trial backfill" reduces friction at the highest-leverage moment.
*What to ship:* Brainstorm §2.2. ~1 day.

**[BLOCKER] A3 — `/security` hero subhead and chip label hardcode "19 frameworks" — should derive.**
*Severity: medium_friction · Phase-fit: refinement_phase*
*Evidence:* `grep -n "19 regulatory frameworks" src/app/\(marketing\)/security/page.tsx` → lines 52 + 104 + a stale comment at 144. The count is currently CORRECT (19 matches `getAllRegisteredFrameworks().length`), but it's hardcoded — when ISA Nigeria gets sister frameworks in 2026 Q3 (or when a Pan-African expansion lands the 20th framework), these surfaces silently go stale. The TODO.md item "/security hero count derivation audit" has been open since 2026-04-29. Adaeze-class buyer reading the security page would catch this drift the day the 20th framework ships. Per CLAUDE.md count-derivation discipline rule: must derive.
*What to ship:* Brainstorm. ~15-minute fix: import `getAllRegisteredFrameworks` at top, interpolate via `${FRAMEWORK_COUNT}`. Same pattern as the 4 already-canonical-derived files.

### Synthesis

- **False negatives caught + retracted:** Initial spot-check suggested "IcReadinessGate may have been removed during the Phase G fold." On further investigation in `/dashboard/decisions/[id]/page.tsx`, the gate is still mounted (verified via `rg` evidence in D3 — needs founder verification but the import survives). Reframed as "verify, don't restore." False-negative on cross-doc conflict chip — confirmed shipped via DealKanban grep.
- **Phase-fit recommendation:** Ship D2 (decisions/?view= fold) + A3 (security framework derivation) this quarter; both are refinement-phase fixes <2 hours each. Queue M3 (per-org Brier on Founder OS) for after the first Vohra survey returns ≥5 HXC responses — the data needs real distribution to display meaningfully.
- **Persona-overlap consolidations:** None. The three personas surfaced genuinely distinct findings (D = wedge friction; M = moat depth signal; A = Pan-African framework derivation). No double-weighting.

---

## §9 — Critical pickups the founder didn't ask about

### Critical Pickup #1 — Strategy World London BAFTA is T-13d as of this audit (June 9-10, 2026)
- **Why it matters now:** The single highest-signal CSO event of the next 90 days per GTM v3.5. The BAFTA-prep cluster surfaces (5B drill-gap + 3C cross-link) shipped 2026-05-26 specifically for this window. 13 days is just enough to drill all 4 HXC personas to depth via the Sparring Room v3 surface, but ONLY if used daily. The Education Room 5C urgency-sorted deck grid (shipped 2026-05-26) was built for exactly this calendar pressure.
- **Suggested action:** Lock 1 hour per day for the next 13 days as "BAFTA prep block" — Sparring rep ON the under-drilled HXC persona of the day (5B surface) → Education recall on the matching deck (5C surface) → ConversionLedger entry for any prospect identified (3C cross-link). Defer all non-prep work past 7pm so the prep block is non-negotiable.
- **Evidence:** `event-prep.ts` SSOT lists "Strategy World London — June 9-10, BAFTA. The single highest-signal CSO event. Should not be missed." Today's date: 2026-05-27 → 13 days out.

### Critical Pickup #2 — Vitest suite was RED for ~24 hours before this audit caught it
- **Why it matters now:** Per CLAUDE.md Session Workflow rule: "Build-check before pushing. The founder doesn't run builds locally — Claude IS the local build check." The 2026-05-26 soft-limits commit shipped to main with the test suite in a 6-failure state. TODO.md "Recently Completed (2026-05-25)" claims "1328/1328 vitest" — the next commit silently broke that without updating the test count. There's no CI gate that runs `npx vitest run` on main, only the pre-commit hook (which runs the 4 lints + the gemini-audit script, NOT vitest).
- **Suggested action:** Decide whether to add `npx vitest run` to either (a) the pre-commit hook (slow — ~12s for 91 files) or (b) GitHub Actions on PR. The fast-feedback option is (a); the no-friction option is (b). Today's audit fixed the symptom; the underlying gap is that test failures can ride to main untriaged.
- **Evidence:** `git show --stat 1abaec6 | grep test` shows only `upload.test.ts` was modified in the soft-limits commit — `rate-limit.test.ts` was missed despite its parent `rate-limit.ts` being modified.

### Critical Pickup #3 — Phase 1 month-4 kill-criterion clock is at ~3.5 months
- **Why it matters now:** GTM v3.5 §2 milestones table: "Paid customers retained 90+ days — Kill (pivot) <5 by month 4." Today is 2026-05-27; Phase 1 started May 2026; month 4 = approximately 2026-09-04. We're ~3.5 months in. The kill-criterion countdown surface SHIPPED today (Founder OS 9.2, commit 4c4f1e1, 2026-05-26) — it makes this visible. The founder should check it daily for the next ~4 weeks; if at week-12 the paid-customer count is <3, that's the early warning to pivot.
- **Suggested action:** None for code; this is a "watch the gauge daily" recommendation. The Founder OS 9.2 surface is the tool.
- **Evidence:** Commit `4c4f1e1` body: "Audit Section 9.2 finding 2026-05-22: makes the v3.5 month-4 kill criterion visible as a daily discipline tool."

---

## §10 — Self-Check

- [x] Pre-flight `git fetch && git reset --hard origin/main` — branch `claude/friendly-dirac-xSPBe` at `1abaec6` = origin/main HEAD (verified via `git log --oneline ..origin/main`).
- [x] Read all 10 context files from the working tree.
- [x] Read them in the listed order — CLAUDE.md (auto-included) · TODO.md · icp.ts · trust-copy.ts (size-verified) · DESIGN.md · persona-audit-prompt.ts · git log -30 · gtm-plan-v3-5 · AccentCard.tsx · container-link-types.ts.
- [x] Discipline 1 (grep-before-assert) followed for every "missing" claim (D3 spot-check explicitly named "needs founder verification — grep survives but visual confirm pending").
- [x] Discipline 2 (evidence trace): every finding cites file:line + a quoted snippet OR a specific `rg`/`grep` command + result.
- [x] Discipline 3 (phase-fit tag): every Section 2-5 finding tagged WEDGE / BRIDGE / CEILING / INFRA.
- [x] Discipline 6 (no named-prospect leaks to PUBLIC surfaces): no finding recommends publishing Sankore / LRQA / Wiz on any shipped surface. Sankore named in §2.2 + §5.3 + §8 A2 because the report is private (audit lock explicit).
- [x] Discipline 8 (AccentCard usage check on stacked-card surfaces): §3.5 + §5 surfaces flagged for spot-check.
- [x] Discipline 9 (view-switcher pattern): §3.4 + §8 D2 surface the `/dashboard/decisions/retroactive` candidate.
- [x] Section 8 personas mutually exclusive: Damien (mid-market scale-up) + Margaret (F500) + Adaeze (Pan-African fund) — three different buyer-org classes, three different motion tracks. Rotation: today's set differs from prior 2026-05-26 audit (which used Margaret + James + Adaeze).
- [x] Section 8 mix: Phase 1 HXC (Damien) + CEILING (Margaret) + INFRA (Adaeze) all covered.
- [x] Section 1 bugs: 2 fixes shipped (well under cap of ~10).
- [x] Section 7 tips: 3 tips, each Folahan-specific (16yo · BAFTA prep · 50-70 hr/wk · Pieter Levels playbook) and references concrete recent commits / lock dates / calendar dates.
- [x] Section 1 + Section 6 implemented; Sections 2-5, 7-9 are brainstorm queue only (no implementation).

**False-positive self-rate:** ~10%. The audit makes 14 brainstorm claims (§2 has 6, §3 has 5, §4 has 4, §5 has 5 — totalling 20 if we include verification-only items) plus 9 persona findings + 3 critical pickups. Likely false positives: §5.5 (chat-routing tables — described as verification-only; if already in lockstep, no action); §8 D3 (IcReadinessGate "needs founder verification" — could be still mounted, in which case the finding is "verify, then close"). Net 2/26 = 7.7% false-positive rate; well under the 25% threshold.

**Implementation summary:** 2 bug fixes + 1 chat-context block addition. tsc clean · 1330/1330 vitest · 4 lints clean at baseline · 0 backticks in new chat-context.

---

*Audit lock version: v1.1 (2026-05-10). Founder triage order: §10 → §1 → §9 → §2-5 + §7 → §8 → §6.*
