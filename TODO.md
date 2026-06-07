# TODO — Decision Intel

Claude reads this file at the start of every session via the `@TODO.md` auto-include at the bottom of CLAUDE.md. Update it as tasks complete or new ones surface. **Discipline**: keep "Recently Completed" capped at ~7 days; older entries belong in git log, not here. Long-form ship-log prose belongs in `docs/CLAUDE-archive-2026-Q2.md`, not here.

## Active Priorities

- [ ] Land first paying design partner (outreach via advisor network)
- [ ] **Founder-side: run 5 retroactive post-mortems to MINT LOGOS (SF-advisor motion, locked 2026-06-05).** Lead the cold DM with the retro ask, not "audit your next memo": _"Not pitching software — let me run my audit over two deals you've already closed, one you feel good about and one that went sideways. Free, you keep the output."_ Forensic-not-predictive removes their risk; the paired good/bad is the unlock; **each retro = a case study + a real logo + closed-outcome data that seeds the Bias Genome.** Five of these = a deck that sells itself + clears the wedge→bridge reference gate. Target the deal-team wedge personas (corp dev / GP / PE-backed founder); boutique sell-side advisors are a strong FREE logo channel even though they're an ICP_AVOID paid wedge. Scripts: `DM_TEMPLATES` openers in `event-prep.ts` (already updated to lead with the retro) + the `post_close_surprise` trigger in `discovery-pitch-toolkit.ts`.
- [ ] Post 1 case study per day on LinkedIn (use Content Studio → Generate LinkedIn Post, or wait for daily email from `/api/cron/daily-linkedin`)
- [ ] Pre-seed/seed fundraise: target first paying design partner + 2-3 reference logos before kickoff
- [ ] Find GTM / enterprise-sales co-founder or advisor
- [ ] **Founder-side: add "Recognition-Rigor Framework · Decision Intel" tagline under your Gmail signature** (small italic, below your name). Every email reply then carries the vocabulary. Vocabulary ownership by usage is the current trademark strategy.
- [ ] **Founder-side: rewrite slide 2 of the pitch deck as lineage, not list.** Current moat slide names six phrases: Four Moments · R²F · DPR · DQI · Bias Genome · Causal Learning. Investors hear "feature list." Rewrite as architecture: _"R²F is the pipeline → DPR is the signed artifact → DQI is the score → Bias Genome is the cross-org dataset → Causal Learning is how the DQI gets sharper over time."_ Each claim inherits from the last; investors hear architecture instead of features.
- [ ] **Founder-side: reuse the R²F "anatomy of a call" pentagon on pitch deck + LinkedIn.** Component lives at [src/components/marketing/AnatomyOfACallGraph.tsx](src/components/marketing/AnatomyOfACallGraph.tsx) and already renders on the landing overlay + /how-it-works. Pitch deck slide 2: screenshot at 2x pixel density, drop into the deck. LinkedIn static carousel: render `stage` 1→5 across 5 slides + 1 hero, caption each with the capability's `full` name. One visual, five surfaces, one brand moment.
- [ ] **Founder-decision: strip the dead `.dark` CSS layer (~800+ LOC in globals.css, scoped `.dark` overrides across ~30 components).** Light-theme-only is locked 2026-04-23. Keeping `.dark` costs near zero maintenance; stripping it buys a cleaner codebase but risks days of regression surface on a product with no pilot users to catch edge cases. **Do not rush** — revisit when (a) pre-seed closes and engineering bandwidth frees up, OR (b) a design partner explicitly asks for dark mode. Currently NOT shipping; listed here so context survives the freeze.

## Deferred Follow-ups

### Awaiting founder decision

- [ ] **Founder Hub tab navigation discoverability.** All 28 founder-hub tabs are reachable only via AI-chat dispatched events, not a direct UI rail. Sales Toolkit, Competitive Positioning, LRQA brief, Three Gaps Differentiator, Unicorn Roadmap — all production-ready, all hidden. Decision: either (a) add a collapsible left-rail tab list to `/dashboard/founder-hub/page.tsx` that renders each tab as a lazy-loaded panel, OR (b) keep the chat-only model and beef up chat suggestions ("Want to see your Sales Toolkit?").
- [ ] **CopilotChat + ResolveDecisionModal dark-theming verdict** — both components use `bg-zinc-900 / text-zinc-300` styling on a light-only platform per CLAUDE.md "locked light-theme-only 2026-04-23." Either (a) the chat surface is intentionally dark for contrast (Discord/Slack/Linear pattern), in which case document the exception in CLAUDE.md, OR (b) it's drift, in which case migrate to `var(--bg-card)` + `var(--text-primary)`.
- [ ] **Pricing Enterprise quote builder promotion** — `/pricing/quote` IS linked from the Enterprise card but as a small slate500 secondary text under the primary "Talk to the founder" CTA. Promote to a sibling CTA (two equal-weight buttons) so a procurement-led prospect who wants to self-serve a quote sees the path immediately? Or does self-serve quoting weaken the founder-conversation moat?

### Content + voice

- [ ] **Em-dash discipline sweep on marketing copy.** Em-dash count: landing 28, /security 14, /pricing + /privacy 11 each, /about 5. CLAUDE.md caps at 1 per page. Content-voice work, not a runtime bug. One sitting where the founder rewrites each marketing page replacing em dashes with commas / periods / parentheticals. Approx 1 hour total.
- [ ] **Two new specimen DPRs for ICP expansion.** Current: WeWork (US/global) + Dangote (Pan-African). Recommended next: (a) **TikTok Shop India market entry** — covers FEMA, MeitY tech policy velocity, sectoral caps; warms India PE + SG/India tech corp dev. (b) **Sub-Saharan bank digital-wallet acquisition** (KCB / Equity / I&M cross-border consolidation under CMA Kenya + CBK + AML/CFT) — warms African banking M&A advisors. Generated via `scripts/generate-legal-pdfs.mjs`. ~1 week each.

### Discoverability + UX

- [ ] **/demo unauth save-to-account hook timing** — when an unauth visitor pastes a memo and the audit completes, the conversion CTA sits below the fold. The actual conversion moment is the moment the visitor SEES their DQI grade — that's where the "Save this audit · 2 clicks · no card" chip should render, anchored to the ScoreReveal card itself.
- [ ] **Pre-filled "Compare Selected" hint on Documents browse** — when 2-3 docs are picked the "Compare Selected" button appears, but the empty-state of Documents browse doesn't surface that comparison-of-versions IS one of the moat features. Small "Pick 2-3 memos to compare" tooltip in the table header column.
- [ ] **Onboarding role enum cascade audit** — the 2026-04-25 pe_vc addition touched 8+ files. Worth one ~30min sweep: `rg -nP "Role\\s*=\\s*'(cso|ma|bizops|other)'" src/` and verify each call-site has been extended for pe_vc.
- [ ] **/security hero count derivation audit** — the hero subhead at `/security` reads "17 frameworks." Verify all sites that render a framework count derive from `getAllRegisteredFrameworks().length` (lines 463, 927, 999 in security/page.tsx already do; the hero subhead `<p>` should too).
- [ ] **MarketingNav + MeetingsLogTab style-block consolidation.** `MarketingNav.tsx` has 3 `<style>` blocks; `MeetingsLogTab.tsx` has 2. CLAUDE.md mobile-style discipline says one scoped block at component bottom is canonical. Mechanical refactor; ~30 min each.

### Larger builds (multi-day)

- [ ] **Chrome extension Google Docs right-rail.** When a user has a Google Doc open, persistent right-rail shows live DQI updates as they type (debounced 5s, only audits changed passages). Reuses `/api/passages/re-audit`. Scope: modify [extension/](extension/) to (a) detect Google Docs URLs, (b) extract editable text from the Docs DOM periodically, (c) post changed passages, (d) render a collapsible DQI chip in an iframe'd right-rail. Multi-day build (Google Docs' DOM is complex; extension-context auth is non-trivial).
- [ ] **Pre-commitment Decision Room weakest-claims UI.** The `decisionType: 'pre_commitment'` convention + entry point are shipped. Still missing: a dedicated room view that shows ONLY the analysis excerpts corresponding to the lowest-scoring DQI components, with invited teammates asked to attack them. Scope: compute bottom-2 DQI components from `Analysis.overallScore` breakdown, filter `biases` to just those tied to those components, render `PreCommitmentRoomView` with red-team framing. ~300 LOC.
- [ ] **HumanDecision lookup by analysisId.** The PhaseDuringPanel on `/documents/[id]?phase=during` currently always renders the "log a decision" stub. To surface the linked HumanDecision when one exists, `/api/human-decisions` needs to accept an `analysisId` or `documentId` query param.
- [ ] **Passage-level audit paid tier.** `/api/passages/re-audit` is currently free with a 20/hr user rate limit. Once Stripe product config is in place, gate beyond N passage audits/month behind the Strategy tier.
- [ ] **Simulate-CEO $29 one-off paywall.** The endpoint shipped 2026-04-23 is free with a 3/day/IP rate limit. Wire a Stripe one-off product + redirect flow so the 4th simulation per IP goes through checkout instead of rate-limiting out. LinkedIn-viral artifact — "I paid $29 to find out what my CEO would ask" — only works with actual $29 friction.

## Technical Debt

- [ ] Marketing pages use hardcoded color constants (`C.navy`, `C.green`) — this is intentional (light-theme-only pages), NOT a bug. Do not convert to CSS variables.
- [x] ~~`riskScorerNode` refactor into composable sub-functions~~ — SHIPPED 2026-05-20. Pure-math helpers + async loaders + Bayesian wrapper extracted to `src/lib/scoring/risk-compiler.ts` (28 unit tests). `riskScorerNode` is now a thin ~70-line orchestration shell. Score-neutral (held-out dqi-distribution-check byte-identical).
- [ ] **Dashboard three-view full refactor (B6-full)** — `src/app/(platform)/dashboard/page.tsx` is 2,200+ LOC with Upload (670 LOC, ~25 state deps) and Browse (440 LOC, ~15 state deps) views inlined. B6-lite (2026-04-15) extracted Analytics + wired `?view=` URL sync; still TODO: extract UploadView + BrowseView into `_views/` with either prop-drilling or a new DashboardContext. Dedicated 2-3h session; regression surface on the most-used page is high.
- [ ] **Design-system polish — remaining pages** — Phase 1-4 of the app-wide unification shipped 2026-04-15. Still TODO: page-level polish for Decision Journal, Playbooks, Settings, Team, Decision Rooms, Cognitive Audits, Outcome Flywheel, Decision Quality, Experiments, Meetings. Each needs: (a) audit of hardcoded off-palette hex/rgba accents, (b) page header aligned to the shared `.page-header` rhythm, (c) consistent widget stack rhythm via `mb-lg` wrappers. ~1.5-2h per page. Skip unless the page is on a demo path.

## Known Bugs

(none currently open — see git log for the running cleanup history)

## Feature Ideas (Backlog)

- [ ] Real-time meeting bias detection (Phase 1: prototype with simulated transcript feed) — saved in Founder Hub Tips Section 7
- [ ] WeWork S-1 excerpt as default demo document
- [ ] "Decision Score" — external-facing credit score for organizational decision quality
- [ ] Analyst certification program (revenue opportunity)
- [ ] CRM integration for auto-pulling deal outcomes (Salesforce, HubSpot)

## Recently Completed (2026-06-07)

**Argument Builder — the one MindForge principle, ported into the Sparring Room (full prose in CLAUDE.md "Argument Builder" lock).** Claim → Evidence → Counterargument → Rebuttal reasoning drill.

- [x] A second Sparring Room surface (toggle: Live reps | Argument Builder) — no new tab. Trains investor-Q&A / pitch defence; the grader is hardest on a weak (non-steelman) counterargument.
- [x] Pure SSOT [argument-builder.ts](src/components/founder-hub/sparring/argument-builder.ts) (5 categories + 4-part scaffold + 4-dim rubric + readiness + normalize + mock, 7 vitest) · endpoint [/api/founder-hub/argument-builder](src/app/api/founder-hub/argument-builder/route.ts) (generate + grade, Grok, mock fallback) · [ArgumentBuilder.tsx](src/components/founder-hub/sparring/ArgumentBuilder.tsx) (0-100 + sub-score bars + steelman verdict + model answer + score trend) mounted in SparringRoomTab.
- [x] Honest scoping: most of MindForge already lives in DI (Sparring grader / generation effect / campaign XP / FOUNDER_CONTEXT); only the Claim→Evidence→Counter→Rebuttal scaffold was additive. Analogy Engine + Summary Challenge evaluated lower-leverage and NOT built (recorded).
- [x] Gates: tsc + eslint clean · 7/7 argument vitest · 5 lints (silent-catches 236→238 documented) · prettier · slop 3.30.

**Founder Hub brain-dump intake (founder "boil the ocean" — friction-killer for tab/field sprawl; full prose in CLAUDE.md "Founder Hub brain-dump intake" lock).** One day-dump → AI proposes a batch → confirm/edit/drop → logged across founder-os surfaces.

- [x] **Confirm-before-write (load-bearing):** the parse endpoint writes nothing; nothing saves until the founder confirms. Ambiguous entity refs (which goal/prospect?) → `needsPick` with candidates, never guessed. Protects the conversion-ledger / Vohra / campaign signals from a silent misparse.
- [x] SSOT [intake-actions.ts](src/lib/founder-hub/intake/intake-actions.ts) (8 action types + per-type meta incl. `toRequest` = the only type→endpoint→body map) + pure [intake-parse.ts](src/lib/founder-hub/intake/intake-parse.ts) (normalize + `matchByName` + `resolvePick` + `isActionReady`, 15 vitest) + parse endpoint (one Grok call, catalog derived from SSOT, mock fallback) + [DailyDumpPanel](src/components/founder-hub/intake/DailyDumpPanel.tsx) (generic review card + client executor dispatching to the EXISTING write endpoints) mounted on Start Here.
- [x] **18 daily-fill actions across 5 review clusters** (8 → 15 → 18 on 2026-06-07): Goals & day (daily_goal · complete_goal · period_goal · commitment · daily_reflection · weekly_review) · Work (meeting_log · todo_add · todo_complete) · Outreach (prospect_create · prospect_advance) · Faith OS (faith_checkin · prayer_journal · reading_progress) · Learning (sat_session · sat_test · content_log · skill_dev). `isActionReady` now requires every non-optional field. No schema change; no new audio infra (Wispr-paste is the voice path).
- [x] **Merge question answered**: don't merge action TYPES (1 action = 1 endpoint keeps confirm/result honest); the compression is (a) review-UX grouping by cluster + (b) parse rules that avoid double-logging the same fact (bare prayer/scripture → one checkin, not also a journal/reading entry).
- [x] Gates: tsc clean · eslint clean · 18/18 intake vitest · 5 lints (silent-catches 231→236, documented) · prettier · slop-scan.
- [ ] **Founder note:** voice path is Wispr Flow → paste (zero infra). Wiring the in-app LiveKit voice worker to feed the intake directly is a clean future follow-up — say the word.

**SAT Prep v3 — vocab engine (founder "fix low-level words + sloppy SR + tie in my old Forge/WordForge"; full prose in CLAUDE.md "SAT Prep v3 — vocab engine" sub-lock).** Scoped via AskUserQuestion: full adaptive engine, MindForge deliberately skipped.

- [x] **FOUNDER ACTION: a 3rd SAT migration — `npx prisma migrate deploy` now picks up all three** (`20260607120000_sat_prep` + `_v2` + new `20260607140000_sat_vocab_engine`; additive substrate + SR-richness columns on `SatVocabCard`, zero-risk).
- [x] Word quality: hard difficulty floor + easy-word exclusion + dedup against existing words (`SAT_VOCAB_GEN` SSOT) + full substrate (IPA/synonyms/antonyms/related/cloze) + upgraded 4-word hard mock. No more "underscore".
- [x] Honest SR WITHOUT forking `applySm2`: pure `effectiveQuality(correct, confidence, responseMs)` → smarter SM-2 quality input (wrong+confident→0, correct+unsure→3, certain→5, fast→+1, slow→floor 3) + response-time EMA + per-quiz-type failure memory. 15 new vitest (44 total).
- [x] Multi-type adaptive review (context cloze + definition both ways + synonym/antonym; weak-angle targeting via `failedTypes`; confidence + response-time capture; graceful recall fallback). Richer cards (IPA, relation chips, your-own-mnemonic, reveal-on-demand AI hint).
- [x] Deliberately skipped (recorded, founder-confirmed): MindForge (off-target for SAT R&W; comms training lives in Sparring/Education), the RPG combat economy (inputs-only XP lock), the knowledge graph.
- [x] Gates: tsc clean · 44/44 sat vitest · 5 lints (silent-catches 231 unchanged) · prettier · slop-scan.

**SAT Prep v2 — all-improvements boil-the-ocean (founder "boil the ocean, goal is consistency + 1550"; full prose in CLAUDE.md "SAT Prep v2" sub-lock).** All 4 improvement bundles, autonomous, 3 commits, gates green.

- [x] **FOUNDER ACTION: `npx prisma migrate deploy`** now picks up TWO migrations (`20260607120000_sat_prep` + `20260607130000_sat_prep_v2`) — additive, zero-risk.
- [x] **Active error loop** — misses become SM-2 spaced-review cards (new Review tab: recall→self-grade→reschedule) + "Explain this miss" Grok tutor (caches on the row, never fabricates the question).
- [x] **Real-test miss capture** — Test Log per-skill tap grid (`official_test`) so weak-areas + Brier are built on REAL Bluebook questions, not just AI drills.
- [x] **Per-skill calibration + Brier-trend sparkline** in Progress (+9 vitest, 29 total).
- [x] **Consistency engine** — editable test-date countdown (SatSettings), SAT wired into The Build campaign as inputs-only XP (guardrail extended), Start Here daily reminder card (Gollwitzer if-then framing). `SAT_LEARNING_SCIENCE` SSOT (6 anchors).
- [x] Deferred (founder-gated, recorded): per-question drill timing · cron email nudge · voice SAT-tutor persona. Each with rationale in the lock.
- [x] Gates: tsc 0 non-e2e · 42/42 vitest (campaign 13 + calibration 29) · positioning · counts 73 · canonical-imports · silent-catches 218→231 (documented) · prettier · slop-scan 3.25.

**SAT Prep v1 — founder-private study surface (founder-directed "afternoon" build; full prose in CLAUDE.md "SAT Prep" lock 2026-06-07).**

- [x] **FOUNDER ACTION: run `npx prisma migrate deploy`** lock-step with the deploy — migration `20260607120000_sat_prep` (4 new additive tables only, zero-risk; pre-migration the routes fail-soft to empty).
- [x] **FOUNDER ACTION: register for the SAT** — September (live-conditions benchmark) + November (the score that counts); Stanford superscores. Note: UC Berkeley is test-blind, so this is for Stanford + test-requiring privates only.
- [x] 4 Prisma models (`SatErrorLogEntry` + `SatDailySession` + `SatTestResult` + `SatVocabCard`) + pure SSOT (`sat-content.ts`: digital-SAT skill taxonomy, root causes, score targets, XP, study-plan phases) + pure tested math (`sat-calibration.ts`: Brier calibration / weak-area ranking / projected score / streak, 20 vitest).
- [x] 5 routes under `/api/founder-os/sat/` (error-log · sessions · tests · vocab w/ SM-2 reuse · AI-generate w/ mock fallback) + shell `SatPrepTab.tsx` + 4 surfaces (Daily Training · Official Test Log · Progress & Calibration · Vocab Bank). Tab registered in the founder-hub Foundations cluster (`sat_prep`).
- [x] Load-bearing architecture: official tests = sole projected-score source; AI drills = targeted-reps-only (never the score); confidence-tagged Brier calibration loop; XP rewards inputs only. Companion plan at `docs/sat-study-plan.md`.
- [x] Gates green: tsc clean (0 non-e2e errors) · 20/20 vitest · 4 lints (positioning · counts 73 · canonical-imports · silent-catches 226, +8 documented) · prettier · slop-scan 3.26.

**Tailwind-literal-palette backlog cleared to 0 (full prose in CLAUDE.md "Tailwind-literal-palette washout" lock · Progress 2026-06-07).** Migrated ForgottenQuestionsTab's 3 blue usages → `var(--info)` (last platform doc-detail washout) + aligned `checkTailwindLiteralPalette` with its documented marketing-skip intent (the 12 CaseStudyCard/Gallery findings were marketing-by-rule). 14 → 0. Corrected the stale "14 = all false positives" note.

## Recently Completed (2026-06-06)

**Enforcement-gate / concurrency-race sweep + the full analysis-quota reservation fix. Full prose in CLAUDE.md "Count-then-create race discipline + analysis-quota reservation (locked 2026-06-06)".**

- [x] **FOUNDER ACTION:** run `npx prisma migrate deploy` lock-step with the deploy — one additive migration (`20260606120000_analysis_quota_reservation`, new `AnalysisReservation` table only, zero-risk; pre-migration code fails-open to the legacy check).
- [x] Sentry production-noise filter (commit `fda9fa8`) — the `Object Not Found Matching Id … MethodName:update, ParamCount` UnhandledRejection on /how-it-works is browser-extension noise (grep-confirmed no first-party source); added `ignoreErrors` + `denyUrls` to `instrumentation-client.ts`.
- [x] 3 parallel bidirectional grep-before-assert audits: **authz inner-gates (50+ routes) CLEAN · fail-open commerce CLEAN · tenant isolation CLEAN.** Only real findings were count-then-create races.
- [x] Seat-cap races (commit `64f639b`) — `team/invite` + `team/invite/bulk` now lock the Organization row `FOR UPDATE` and re-count inside one interactive transaction; seat cap is atomic at BOTH invite + accept layers.
- [x] **Analysis-quota cost race (full reservation fix, founder-approved)** — `reserveAnalysisSlot`/`releaseAnalysisSlot` + `AnalysisReservation` reserve the slot under a per-user advisory lock BEFORE the ~£0.40 pipeline (the Analysis row only existed after, so a lock there couldn't un-spend the money). Streaming route (5 release points) + shared `analyzeDocument` (`finally`). Unlimited bypass; schema-drift fails open; TTL sweeps crash-orphans.
- [x] Score-neutral verified: held-out `dqi-distribution-check` byte-identical (hashes unchanged), no methodology bump. Gates green: tsc · full vitest 1472 pass (8 new reservation tests) · 4 lints (positioning · silent-catches 218 · counts 73 · canonical-imports) · prettier.

**Second concurrency sweep — JSON read-modify-write + check-then-act races (3 parallel bidirectional agents). Full prose in CLAUDE.md "Sibling race classes hardened (2026-06-06, second sweep)".**

- [x] Verified-and-DROPPED false positives: ripple-alerts "over-fetch" (the detector USES `decisionFrame` + `outcome.summary`), bias-comments fire-and-forget (documented-intentional codebase-wide pattern), edge-inference/blind-prior-brier loops (idiomatic + bounded). Grep-before-assert caught the ripple one.
- [x] Fixed 3 JSON read-modify-write data-loss races (priors microPredictions append, pmi-signals POST+PATCH, proxy-resolution) — each now locks the `DecisionContainer` row `FOR UPDATE` + re-reads inside a `$transaction` before re-applying the existing pure helper.
- [x] Fixed 2 blind-prior check-then-act races (reveal, distribute) — atomic guarded `updateMany` (precondition in WHERE, `count===0 → 409`); reveal no longer double-sends emails/audit under a concurrent reveal.
- [x] UTC quota-boundary hardening (`startOfCurrentMonthUtc()` in plan-limits.ts) — local-time month boundary drifted on non-UTC hosts (prod is UTC, so quota-neutral today). Gates green: tsc · 1472 vitest · 4 lints · prettier.

## Recently Completed (2026-06-05)

**Strategy 12-seat tier — Tier A (integrity) + Tier B (admin polish). Refinement-grade hardening of the shipped tier; no schema migration, no speculative team features (the deeper team-only differentiators stay deferred per the GTM "build FROM Sankore feedback" lock). Full prose in CLAUDE.md "Team seat administration + audit trail (locked 2026-06-05)".**

- [x] **Accept-time seat enforcement (Tier A).** [/api/team/invite/accept](src/app/api/team/invite/accept/route.ts) now does an atomic member-count + insert inside one `$transaction` against the org's CURRENT plan cap → closes the count→insert double-accept race AND the downgrade hole (a stale Strategy-era invite can't push a since-downgraded org past its new cap). Members are never auto-removed on downgrade — growth is blocked, the over-limit state is surfaced.
- [x] **Seat-usage meter (Tier A).** `/api/team` GET returns `seats {plan,used,limit}`; TeamPage renders a color-coded `SeatMeter` at the top of the Members tab + disables the Invite button when full. Reads the cap from `PLANS.team.maxTeamMembers` — no hardcoded "12".
- [x] **Team-admin audit trail (Tier B).** 5 new `AuditAction` values wired into invite/accept/role-change/remove/revoke; `logAudit` gained an optional `orgId` so org-level rows survive in the Team Activity feed + AdminAuditLog even after the actor leaves. Team Activity `ACTION_LABELS` render all 5.
- [x] **Bulk invite (Tier B).** New [/api/team/invite/bulk](src/app/api/team/invite/bulk/route.ts) (owner/admin, 5/hr, dedupe + seat-headroom stop, per-email `{created,skipped}` w/ reasons) + a single ↔ multiple toggle in the invite modal.
- [x] Fixed a stale comment in the invite route (seat-tier comment said "Starter 3 / Professional 10 / Team 50" → corrected to Free/Individual 1 / Strategy 12 / Enterprise ∞).
- [x] Gates green: tsc clean (src/) · 4 lints clean (positioning · silent-catches 218 no-new · counts 73 · canonical-imports) · prettier · slop-scan under 4.0.

**Enforcement-gate atomicity sweep + nightly-audit prompt v1.3 (the "why did the audit miss this?" follow-up).**

- [x] **Webhook cap race** ([/api/webhooks](src/app/api/webhooks/route.ts)) — count-then-create wrapped in a transaction + per-user `pg_advisory_xact_lock`; `MAX_WEBHOOKS_PER_USER` const.
- [x] **Seat accept-gate properly race-safe** — the prior count+insert-in-a-transaction was NOT atomic under READ COMMITTED; added `SELECT … FOR UPDATE` on the Organization row so concurrent accepts serialize. Bulk-invite handles the `(orgId,email)` P2002 collision as a skip, not a 500.
- [x] **Nightly-audit prompt → v1.3** ([docs/nightly-audit-prompt.md](docs/nightly-audit-prompt.md)) — folded the split v1.1-full + v1.2-delta into one self-contained doc; made grep-before-assert BIDIRECTIONAL ("X is enforced/atomic" needs a write-path trace); added Discipline 11 (enforcement-gate / invariant trace) + two Section-1 bug categories (enforcement-gate integrity; load-bearing route with zero tests); baselines now "read the const."

**Superforecasting / Tetlock calibration leg + AOM — founder-approved "boil the oceans" narration cascade + one cited engine backfill. Full prose in CLAUDE.md "Superforecasting / Tetlock calibration leg lock 2026-06-05".**

- [x] Mapped the Superforecasting essay against SHIPPED code (grep-before-assert; the prior session had the wrong engine path). ~90% already ships — leverage is NARRATION, not a build.
- [x] **icp.ts SSOT**: `POSITIONING_CALIBRATION_LEG` (Tetlock as the measurement THIRD leg on R²F, not a rename) + `POSITIONING_ACTIVE_OPEN_MINDEDNESS` (the shipped Intelligent Antagonist) + `SUPERFORECASTING_DO_NOT_QUOTE`, wired into `buildPositioningPromptBlock()`.
- [x] **Cascade**: founder-context.ts chat block (zero backticks, balance verified) + 3 Education `r2f_framework` flashcards + 1 Sparring calibration-claim-probe scenario + a public /r2f-standard "What Brier scores, and what it doesn't" callout.
- [x] **Engine backfill** ([bayesian-priors.ts](src/lib/scoring/bayesian-priors.ts)): the 6 taxonomy biases that silently fell to 0.5 (incl. illusion_of_validity + inside_view_dominance) got real cited base rates + a 11-test coverage-invariant suite. Scope-safe: prior-gated path only, no-prior DQI byte-identical (held-out check confirms), no methodology bump.
- [x] **Refused under "boil the oceans"**: the extremizing-the-aggregate aggregator. It assumes independent private info; on a decorrelated-not-independent jury it could DEGRADE calibration — I'd argued it could backfire, so shipping it would contradict my own analysis. Recorded as a founder-gated deferred boundary, not roadmap-confident.
- [x] Gates green: tsc clean (src/) · 5 lints clean (positioning · counts 73 · silent-catches 218 · canonical-imports · doc-sync) · prettier.

## Recently Completed (2026-06-01)

**Faith OS "Today's Three" — daily-priority goal setting (founder-approved "boil the ocean"; full prose in CLAUDE.md "Faith OS Today's Three lock 2026-06-01").**

- [x] Researched the science of daily goal-setting (Locke & Latham goal-setting theory; working-memory limits Cowan 2001; the Rule of 3; Gollwitzer implementation intentions + Oettingen WOOP/MCII; Buffett 5/25; Keller's The ONE Thing; Knapp's daily Highlight) — synthesis: the optimal number of daily priorities is THREE.
- [x] Schema: additive `FounderOsDailyGoal` model + migration `20260601120000_founder_os_daily_goals` (new table only, zero-risk). **FOUNDER ACTION: run `npx prisma migrate deploy` lock-step with the deploy** — same pattern as every FounderOs\* model.
- [x] API: [/api/founder-os/daily-goals](src/app/api/founder-os/daily-goals/route.ts) GET/POST/PATCH/DELETE — `authenticateFounderOs` dual-gate; the cap of three enforced server-side (rejects the 4th active goal); one Highlight/day enforced; status done stamps completedAt.
- [x] Teaching SSOT in [faith-os/content.ts](src/components/founder-hub/faith-os/content.ts) (DAILY_THREE_PRINCIPLES / \_COMMIT / \_RITUAL / WHY_THREE) — each principle paired with its scriptural frame; pure math [faith-os/daily-three.ts](src/components/founder-hub/faith-os/daily-three.ts) (streak/completion/highlight-hit/heatmap) + 13 vitest.
- [x] UI: `DailyThreeSection` mounted in FaithOSTab after the spiritual checkin — the three slots (specific + finishable), if-then intention per goal, Highlight star, done/carry/release/edit, "Commit to the Lord" (Prov 16:3), a stat strip (show-up streak + 30-day completion + Highlight-hit) + 30-day heatmap + a "Why three?" research-and-scripture panel.
- [x] Gates green: tsc clean · 20/20 faith-os vitest (13 new + 7 existing) · positioning clean · counts 73 · canonical-imports clean · silent-catches 212 (+2 canonical body-parse class, bumped + documented) · prettier clean · slop-scan 3.23 (< 4.0).

**Faith OS "Today's Three" — DEEPEN + tracking/weekly-review (founder-approved boil-the-ocean follow-up; full prose in CLAUDE.md "Deepen + tracking layer" sub-lock 2026-06-01). Modified existing surfaces only — NO new tab (founder-directed: improve Start Here, never spawn a parallel one).**

- [x] Cascade: new `FounderOsPeriodGoal` model (week + quarter, ≤3 cap server-enforced) → `CascadeSection` above Today's Three; each daily goal can be linked to "serve" a weekly intention (`linkedPeriodGoalId`, soft ref). Pure keys/labels in [faith-os/period-goals.ts](src/components/founder-hub/faith-os/period-goals.ts) (8 vitest).
- [x] Evening reflection: new `FounderOsDailyReflection` model (moved/blocked, upsert) + `EveningReflectionCard` (Knapp reflect step + Lam 3:40). Time-block the Highlight (`scheduledFor`) + one-tap "Carry to tomorrow".
- [x] Tracking: `WeeklyThreeExecutionPanel` auto-pulled into the existing Founder OS Sunday review (completion + Highlight-hit + 7-day strip + Δ vs last week + the week's intentions). Discipline→execution correlation tile (SFC-zero days vs other; honest signal floor of 3 days). Pure `summarizeWeek` + `computeDisciplineExecutionCorrelation` (daily-three.ts, +7 vitest).
- [x] **FOUNDER ACTION: run `npx prisma migrate deploy`** — TWO additive migrations this session (`20260601120000_founder_os_daily_goals` + `20260601130000_founder_os_period_goals_reflections`), new tables + nullable columns only, zero-risk.
- [x] Saved durable rule to CLAUDE.md Session Workflow (0a): read the relevant md / access-model BEFORE proposing — `/dashboard` = customer surface, `/dashboard/founder-hub` = founder-private; never propose founder-only surfaces on the customer dashboard.
- [x] Gates green: tsc clean · 35/35 faith-os vitest · 4 lints clean (positioning · counts 73 · canonical-imports · silent-catches 217, +5 documented) · prettier · slop-scan 3.23.

**The Build — Faith OS gamification layer (founder-approved after a gamification-psychology research pass; full prose in CLAUDE.md "The Build" lock 2026-06-01). Founder-private only; the customer product is never gamified.**

- [x] Recommendation taken: Faith-arc spine (7 Scripture builder arcs Joshua→Paul) + mission-control mechanics + the Bible as a business manual. Serves consistency / output / mind / faith in one layer.
- [x] Load-bearing rule: **XP rewards inputs only (the controllable work), never outcomes** — satisfies the anti-prosperity guardrail AND the research's intrinsic-motivation finding. Outcomes → milestones/badges. No leaderboards (solo). Engine test asserts outcomes never change XP.
- [x] NO new tables — XP/level/quests/milestones/badges all DERIVE from already-logged FounderOs\* + WedgeProspect data. Pure SSOT [campaign-content.ts](src/components/founder-hub/campaign/campaign-content.ts) + pure engine [campaign-engine.ts](src/components/founder-hub/campaign/campaign-engine.ts) (13 vitest) + aggregation API [/api/founder-os/campaign](src/app/api/founder-os/campaign/route.ts) (fails-open) + [CampaignCockpit](src/components/founder-hub/campaign/CampaignCockpit.tsx) mounted at the top of the EXISTING Start Here (no new tab).
- [x] Gates green: tsc clean · 13/13 campaign vitest · 4 lints clean (positioning · counts 73 · canonical-imports · silent-catches 218, +1 documented) · prettier · slop-scan 3.24. No migration this ship.

**Accountability Sprint cluster — Kristian Marcus 1-on-1 mentor brief + 4-week plan + server-side founder-hub gate (full prose in CLAUDE.md "Accountability Sprint tab + server-side founder-hub gate" lock 2026-06-01).**

- [x] [AccountabilitySprintTab](src/components/founder-hub/AccountabilitySprintTab.tsx) (commits `0b870fb` → `088ee46`, 2026-06-01) — new founder-hub-internal tab in the Go-to-Market cluster. The 4-week startup-accountability sprint collapsed into an exclusive 1-on-1 advisory session (founder was the only sign-up; host travels in during a tube strike to run it anyway = invested-mentor signal). Pure-data SSOT at [sprint-brief-data.ts](src/components/founder-hub/sprint/sprint-brief-data.ts).
- [x] Three dynamic visualisations at [SprintVizzes.tsx](src/components/founder-hub/sprint/SprintVizzes.tsx) (ConvergenceViz = InsurX↔DI parallel; SprintArcViz = 4-week arc with BAFTA T-8d marker; ExtractionLadderViz = 5 ranked extraction targets) — data-driven from the SSOT so they cannot drift from the brief content.
- [x] Week-1 deliverables (commit `579d4fd`): discovery script + leave-behind one-pager. Tomorrow run sheet (commit `4851a33`): literal hours of the first meeting laid out. Internship-consideration section + refined CV guidance (commit `9cbc413`): post-mentor career-path discussion WITHOUT leading with it (the prize is the relationship, NOT the internship; explicit caution against the comfort trap). 8 branched questions (commit `088ee46`) for the 2-3hr session.
- [x] Server-side founder-hub access gate (commit `5a6205a`) — new [src/app/(platform)/dashboard/founder-hub/layout.tsx](<src/app/(platform)/dashboard/founder-hub/layout.tsx>) async server component gates the ENTIRE founder-hub segment via `isAdminUserId()` BEFORE the page or any nested brief renders. Before this ship the hub was protected only by Supabase platform auth + a CLIENT-SIDE password compared against `NEXT_PUBLIC_FOUNDER_HUB_PASS` (which inlines into the bundle shipped to every browser). SAFE-BY-DEFAULT — falls through to the client password gate when `ADMIN_USER_IDS` is unset so the founder is never locked out. Bootstrap via `/api/admin/whoami`.
- [x] Sidebar Decisions cluster flatten (commit `0d2681f`) — removed the interim nested 'Decisions' collapsible cluster (2026-05-06 Option-B lock); Documents + Decisions + AI Copilot now sit FLAT under Act. Mobile drawer opacity fix (commit `cab31ff`) — switched to solid opaque (kills the periwinkle text cast).
- [x] i-Fitness finance internship credential (commit `5a74ec6`) — CLAUDE.md founder-credentials section sharpened with the verified Jul-Aug 2025 finance-function stint (line manager Ridwan Bello, rated Excellent). Pairs with the published 2008-financial-crisis honors thesis + Finding Finance student-led initiative + ABRSM grades as the externally-assessed credentials list.
- [x] Gates green at the 2026-06-02 nightly audit: tsc clean · 4 lints clean (positioning · silent-catches 218 · counts 73 · canonical-imports) · prettier clean · platform-audit: 0 CRITICAL / 0 MODAL / 0 STALE / 0 SEMANTIC (only the documented VISUAL backlog: 772 hex + 14 tailwind-literal-palette).

## Recently Completed (2026-05-25)

**.env.example drift — audit-queue item #5 closed (21 operator-facing env vars now declared).**

- [x] Audited every `process.env.<NAME>` read across `src/` + `voice-worker/` + `scripts/` (84 distinct vars). Compared against declarations in both `.env.example` + `voice-worker/.env.example`. 38 vars were missing.
- [x] Triaged the 38: 21 are load-bearing operator-facing config (LiveKit / voice-worker / app URLs / founder-hub / Storage buckets / Slack webhook / Stripe legacy / Sentry / Puppeteer / Debug toggles / Email mirror); 17 are correctly excluded (10 runtime-provided like NODE*ENV / VERCEL*\_ / GITHUB\_\_; 2 test fixtures in encryption.test.ts; 5 maintenance-script-only).
- [x] Added 19 entries to main `.env.example` grouped by existing sections (Auth section: NEXT*PUBLIC_APP_URL + NEXT_PUBLIC_SITE_URL + SUPABASE*\*\_BUCKET; new Voice Mode section: LIVEKIT_API_KEY + LIVEKIT_API_SECRET + LIVEKIT_URL + VOICE_WORKER_SECRET; Slack: SLACK_WEBHOOK_URL; Email: NEXT_PUBLIC_EMAIL_INBOUND_DOMAIN; Admin: FOUNDER_HUB_PASS + NEXT_PUBLIC_FOUNDER_HUB_PASS; Optional: SENTRY_AUTH_TOKEN + PUPPETEER_EXECUTABLE_PATH + DEBUG_FEEDBACK_ADEQUACY + DEBUG_FRACTIONATION; Stripe: STRIPE_DEAL_PRICE_ID legacy fallback).
- [x] Added VOICE_LLM_MODEL canonical (was previously read by `voice-worker/src/config.ts` line 62 but undeclared) to `voice-worker/.env.example` + marked GROK_MODEL as DEPRECATED fallback with boot-warning context.
- [x] Re-audited: 0 operator-facing vars missing; 16 remaining are exactly the runtime-provided / test / script entries excluded by design.
- [x] Gates green: tsc clean · 1328/1328 vitest · 4 lints clean (positioning + silent-catches 199 + counts 73 + canonical-imports).

**Silent-catch lint multi-line awareness — closes documented blind spot (full prose in CLAUDE.md silent-catch ratchet trajectory `198 → 199`).**

- [x] Read `scripts/lint-silent-catches.mjs`. The regex already supported multi-line (`\s*` between tokens; `[^)]*` for arg) — only the scanner mode was line-by-line. Switched to whole-file matching with line-number derivation from the match index.
- [x] Surveyed the codebase: only 1 multi-line catch was structurally invisible. Located it at [src/app/api/cron/enforce-retention/route.ts:304-306](src/app/api/cron/enforce-retention/route.ts) — FK-cascade-cleanup-before-retry on `prisma.$executeRaw`. Triaged as legitimate: when the cleanup DELETE fails, the subsequent `prisma.document.delete` retry will ALSO fail with P2003 and surface via the outer try/catch — the error is not actually swallowed, it surfaces one level up with the same diagnostic.
- [x] Annotated the offender inline with the exception-class reasoning + bumped `SILENT_CATCH_BASELINE` 198 → 199 + updated CLAUDE.md prose to match (doc-sync lock).
- [x] Flipped the previously-recorded "Residual blind spot (recorded, not yet fixed)" in CLAUDE.md (Friction audit #4 follow-through, 2026-05-17) to **RESOLVED**.
- [x] Gates green: tsc clean · 1328/1328 vitest · 4 lints clean (positioning + silent-catches 199 + counts 73 + canonical-imports) · prettier clean · slop-scan under 4.0 trip-wire.

**Encryption key resolution fail-closed — audit hardening (full prose in CLAUDE.md "Encryption key resolution fail-closed 2026-05-25").**

- [x] Read [src/lib/utils/encryption.ts](src/lib/utils/encryption.ts) `getCurrentKeyVersion` (lines 87-101). Verified the audit's claim: the function returned a version number without verifying a key for it actually resolved, opening two silent-downgrade windows.
- [x] Fix A — when `*_VERSION` is explicit, verify the resolved key exists; throw with "Misconfigured rotation — set the V{N} key BEFORE bumping the version env" + remediation hint. Replaces a 2-step failure (return → generic downstream throw) with a 1-step diagnostic fail-closed throw.
- [x] Fix B — when NO keys configured at all, throw at `getCurrentKeyVersion` instead of returning `LEGACY_VERSION`. Closes the silent-downgrade window for future callers that use the version stamp before checking the key.
- [x] Preserved the unparseable-VERSION fall-through-to-probe path (robust against operator typos that don't change substance).
- [x] 8 new regression tests in [encryption.test.ts](src/lib/utils/encryption.test.ts) — happy path / misconfigured rotation document + slack / no-keys-at-all / unparseable-version probe-fallback / version-unset probe / legacy-alias-as-v1 / end-to-end encryptDocumentContent.
- [x] Gates green: tsc clean · 1328/1328 vitest (+8 new) · 4 lints clean (positioning + silent-catches 198 + counts 73 + canonical-imports) · prettier clean · slop-scan under 4.0 trip-wire.

**BiasTask PATCH authorization-matrix lock — false-positive audit response (full prose in CLAUDE.md "BiasTask PATCH authorization-matrix lock 2026-05-25").**

- [x] Read [src/app/api/bias-tasks/[id]/route.ts](src/app/api/bias-tasks/[id]/route.ts) PATCH handler end-to-end. The 2026-05-24 security audit claimed the outer gate is "effectively `if (false)` for any org member" and that title / description / dueAt gate "only on the outer check." Verified the claim is wrong — every per-field write carries an explicit `isCreator || isOrgAdmin` (or stricter) inner gate at lines 127, 136, 146 + 88 + 107 + 163.
- [x] Authored [bias-task-patch.test.ts](src/app/api/bias-tasks/[id]/bias-task-patch.test.ts) — 24-test authorization-matrix lock covering: auth floor (401/404/400-bad-body) · outer tenant-isolation gate (random user 403, null-orgId task 403) · false-positive proof block (org-member-without-creator/assignee/admin returns 403 on every per-field edit) · creator full-edit matrix · assignee narrow matrix (status + resolutionNote only) · org admin full matrix · status validation.
- [x] Inline-commented the outer gate with the design rationale + pointer to the test suite. Future audits that re-flag the same shape have a standing contradiction.
- [x] Gates green: tsc clean · 1320/1320 vitest · 4 lints clean (positioning + silent-catches 198 + counts 73 + canonical-imports) · prettier clean · slop-scan under 4.0.

## Recently Completed (2026-05-24)

**Sankore Adaptation #3 — fund_launch container mode (founder-approved same-day follow-up to Adaptation #2; full prose in CLAUDE.md "Fund-launch container mode — Adaptation #3 lock 2026-05-24").**

- [x] SSOT: `DecisionContainerKind` union extended to 5 kinds + FUND_LAUNCH_MODE entry + `CONTAINER_KINDS` array + `ContainerOutcomeShape.shape` union extended with `fund_realisation`. Pure additive; no Prisma migration.
- [x] 6-stage lifecycle: thesis_development → target_market_sizing → fee_structure → anchor_lp_commitments (committee gate) → regulatory_filing → go_to_market. Required docs for anchor-LP-commitments gate: thesis_memo + fund_prospectus + lp_ask_deck.
- [x] New `fund_realisation` outcome shape: realised_aum_pct (primary) + final_close_months + anchor_lp_count + total_lp_count + realised_fund_irr + realised_dpi + realised_tvpi + verdict.
- [x] 4 new doc subtypes added to INVESTMENT_DOCUMENT_TYPES + DOC_TYPE_OVERLAYS for each: thesis_memo, fund_prospectus, lp_ask_deck, regulatory_filing. Each overlay names canonical failure patterns (Optimism Trap, Anchoring Trap, Echo Chamber, Halo Effect, Yes Committee, Sunk Ship, Deadline Panic).
- [x] 68/68 vitest assertions lock the 5-mode contract (was 58 at 4-mode lock; +10 new assertions for fund_launch shape, helpers, cross-mode invariants).
- [x] Sample bundle: PE_PAN_AFRICAN_AGRICULTURE_FUND_LAUNCH (synthetic anonymised Sub-Saharan agriculture-vintage fund-launch thesis memo with embedded Anchoring / Optimism / Recency / Confirmation / Halo biases, expected DQI 46).
- [x] 4-mode → 5-mode drift sweep: founder-context.ts chat preamble + Sankore brief FiveAdaptations #3 status flip (queued → shipped, liveRoute added) + useContainers.ts JSDoc + AiNativeMatrix.tsx diSource.
- [x] Gates green: tsc clean · 1278/1278 vitest · 4 lints clean (positioning + silent-catches 198 + counts 73 + canonical-imports) · prettier clean · slop-scan under 4.0 trip-wire.

**Sankore Adaptation #2 — real_estate_development container mode (founder-approved boil-the-ocean follow-up to Adaptation #1; full prose in CLAUDE.md "Real-estate development container mode — Adaptation #2 lock 2026-05-24").**

- [x] SSOT: `DecisionContainerKind` union extended to 4 kinds + REAL_ESTATE_DEVELOPMENT_MODE entry + `CONTAINER_KINDS` array + `ContainerOutcomeShape.shape` union extended with `dev_yield`. Pure additive; no Prisma migration.
- [x] 6-stage lifecycle: site_acquisition → entitlement → financing (committee gate) → construction → leasing → stabilization. Required docs for financing-close: site_analysis + financial_pro_forma + regulatory_checklist.
- [x] New `dev_yield` outcome shape: realised_irr (primary) + equity_multiple + cost_overrun_pct + schedule_overrun_months + stabilized_noi + months_to_stabilization + verdict.
- [x] 5 new doc subtypes added to INVESTMENT_DOCUMENT_TYPES + DOC_TYPE_OVERLAYS for each: site_analysis, financial_pro_forma, regulatory_checklist, contractor_selection, appraisal. Each overlay names canonical failure patterns (Optimism Trap, Anchoring Trap, Sunk Ship, Yes Committee).
- [x] 58/58 vitest assertions lock the 4-mode contract (was 36 at 3-mode lock; +22 new assertions for real-estate-development shape, helpers, cross-mode invariants).
- [x] Sample bundle: PE_LAGOS_MIXED_USE_DEVELOPMENT (synthetic anonymised 14-storey Victoria Island development memo with embedded Anchoring / Optimism / Sunk Cost / Recency biases, expected DQI 47).
- [x] 3-mode → 4-mode drift sweep: founder-context.ts chat preamble + Sankore brief FiveAdaptations status flip (queued → shipped, liveRoute added) + useContainers.ts JSDoc + AiNativeMatrix.tsx diSource + RejectedDecisionsTab.tsx kind state type.
- [x] Gates green: tsc clean · 1268/1268 vitest · 4 lints clean (positioning + silent-catches 198 + counts 73 + canonical-imports) · prettier clean · slop-scan under 4.0 trip-wire.

**AEO audit em-dash discipline sweep (follow-up to commit fcc8ad62).**

- [x] FAQ page: 9 user-visible em-dashes → 1 (kept canonical positioning beat at line 115). Swept to commas/colons/periods.
- [x] Glossary page: 5 user-visible em-dashes → 1 (kept bias-interaction-matrix definition at line 145).
- [x] Compare page: 3 user-visible em-dashes → 1 (kept IBM differentiator at line 154).
- [x] All other AEO checks clean: counts derive from canonical exports, robots.ts 18-bot allow-list internally consistent with disallow paths, JSON-LD validates, sitemap aligned, MarketingNav structure preserved.

## Recently Completed (2026-05-23)

**Retroactive audit mode — Adaptation #1, the Sankore-killer (founder-approved boil-the-ocean ship 2026-05-21; full prose in CLAUDE.md "Retroactive audit mode — Adaptation #1 lock 2026-05-21").**

- [x] Schema: additive Prisma migration `20260521120000_retroactive_audit_mode` adds `DecisionContainer.isRetroactive Boolean @default(false)` + `retroactiveMetadata Json?` + sparse index. Schema-drift-tolerant — pre-2026-05-21 rows default false + behave as forward containers.
- [x] Pure helpers: outcomeExtractor (12+ regex outcome patterns + METRIC_PATTERNS for IRR/MOIC/synergy/exit/write-down/fund-return/time-to-exit; verbatim-quote validation; `detectDocumentRole` classifier), entityExtractor (org/amount/codename regex + inferDocumentDate ranked ISO > month-year > quarter > bare-year), bulkPairing (confidence = 0.5×entity + 0.25×temporal + 0.25×content; greedy stable matching; mixed-role docs self-pair at 0.9). 49 vitest cases pass.
- [x] APIs: `/api/retroactive/extract-outcome` (Tier 1 regex always; Tier 2 deepseek-v4-flash via Vercel AI Gateway with verbatim-quote validation; Tier 1 verdict locked when confidence ≥0.6) + `/api/retroactive/bulk-upload` (multipart, 30 files / 50MB / 5 bulks/hr/user / 60s timeout; per-file parseFile → detectDocumentRole → extractEntities → inferDocumentDate → encrypted Document.create → pairBulkDocuments).
- [x] Container API extension: `/api/containers` POST accepts `isRetroactive` + `retroactiveMetadata` + `outcomeOnCreate`; integrity gate enforces metadata + summary; auto-creates `DecisionContainerOutcome` row in same flow; stamps historical `decidedAt`; recomputes container metrics on day one. New audit-log actions `CONTAINER_RETROACTIVE_CREATED` + `CONTAINER_RETROACTIVE_BULK_UPLOAD`.
- [x] UI (3-step wizard at `/dashboard/decisions/retroactive`): `BulkUploadDropzone` (drag-and-drop with caps mirrored from server) + `RetroactivePairingReview` (4 confidence bands with expandable signals + dismiss/create per pair) + `RetroactiveContainerForm` (modal with kind picker + dynamic metric fields from `mode.outcomeShape.fields` + outcomeDraft pre-fill).
- [x] Discoverability: "Backfill historical" sibling button on `/dashboard/decisions` header + CommandPalette `decisions-retroactive` entry + SankoreBrief `FiveAdaptations` live-route CTA via new optional `ProductAdaptation.liveRoute` field. Adaptation #1 status flipped `in-progress` → `shipped`.
- [x] Gates green: tsc clean · 1259/1259 vitest · 4 lints clean (positioning + silent-catches 195→198 +3 canonical body-parse class · counts 73 · canonical-imports) · prettier clean · slop-scan under 4.0 trip-wire.

**"No 90-day wait" property locked**: outcome row is created at container-create time, so when the memo is then attached + audited, the existing `/api/analyze/stream` recalibration trigger reads the outcome row + grounds recalibration against KNOWN reality. Vector 1 (operational-proxy calibration loop, shipped 2026-05-17) closes on day one for historical decisions — the proxy IS the outcome and it's already settled.

## Recently Completed (2026-05-20)

**Universal Audit Deliverable — McKinsey-grade interactive format across /demo + /documents/[id]** (founder-approved "boil the ocean" build after the Deep Research synthesis + NotebookLM master-KB query). Replaces the text-heavy stacked sections on /demo with a Pyramid-Principle / SCQA / MECE-bucket interactive deliverable: 5 buckets (reasoning risks → stress test → historical analogs → counterfactuals → provenance), each led by an action-titled headline and rendered through 8 universal components (ActionTitle, ValueSuppressingPalette, FindingCard, ProgressiveDrawer, ComparativeMatrix, ScenarioSlider, SourceLink, AccordionReasoning). Action titles are LLM-augmented via deepseek-v4-flash through Vercel AI Gateway (`/api/audit/action-titles`) with strict word-cap / digit / banned-vocab / count-drift validation + deterministic template fallback that ALWAYS produces a valid title. /documents/[id] gets the Executive view (deliverable) as default + Analyst view toggle preserving the legacy 5-tab layout — same underlying AnalysisResult feeds both. Optional ticket-size input on /demo turns abstract DQI-lift into honest per-finding exposure (`ticket × historical_base_rate_of_pattern`, no fabricated $). 27 vitest cases lock the composer + validator + value-at-stake math. Banned per Quantellia Trap: dense network graphs replaced with modular grids + side-drawer drill-down; per Choice Paradox: /demo uses a single primary CTA ("Audit your next memo with the team"). Forward-looking rule: when a new analysis-result field needs presentation, extend the composer in `buildAuditDeliverable.ts` to map it into the appropriate MECE bucket — never add a 6th bucket without re-validating the MECE invariant + extending action-title templates + validation in lockstep. Both views share the same component library; new universal primitives go under `src/components/deliverable/`.

`riskScorerNode` refactor — closes the canonical CLAUDE.md / TODO technical-debt item ("hard to test and debug today"). The ~370-line inline node was split into a new pure-math + Prisma-orchestration module at [src/lib/scoring/risk-compiler.ts](src/lib/scoring/risk-compiler.ts) with 28 vitest assertions ([risk-compiler.test.ts](src/lib/scoring/risk-compiler.test.ts)) locking the extracted helpers' math + clamp/round ordering + default-value semantics. `riskScorerNode` itself is now a ~70-line orchestration shell that pulls helpers via dynamic import. Score-neutral by design — held-out dqi-distribution-check byte-identical pre/post refactor (only timestamps differ), 170/170 scoring + agents tests pass. Calibration helpers (`buildCalibrationHeadline`, `buildCalibrationInsight`, `CALIBRATION_UNLOCK`) moved to the new module so the pipeline produces depth across 7 surfaces without a 1,200-line monolith. Forward-looking rule: when a future audit needs a riskScorerNode tweak, edit the pure helpers in `risk-compiler.ts` + extend the unit suite in lockstep; the orchestration shell composes them in a fixed 8-step sequence (severity weights → causal multipliers → compound deductions → Bayesian → pure penalties → feedback → compose → calibration), never reorder without a regression plan + a fresh dqi-distribution-check parity run.

**Deferred (founder decision):** Audit 1 #4 speculative pipeline execution (`gdprAnonymizer → [structurer, intelligenceGatherer] → 8 parallel` instead of `gdprAnonymizer → structurer → intelligenceGatherer → 8 parallel`). The refactor is score-neutral by `dqi-distribution-check` (synthetic memos through `computeDQI`), but a graph-topology change moves `intelligenceNode`'s LLM extraction from post-structurer text to post-anonymizer-but-pre-structurer text — a real behavioral change in LLM input that can't be validated by the synthetic check. Per the founder-gate on pipeline changes + META rule #8 (verify behavior, not structure), shipping that without held-out parity is a coin-flip. The ~4-8s /demo speedup is real but the DQI-drift risk isn't worth absorbing silently. Surface as a separate founder-routed decision when a real held-out parity run is feasible.

## Recently Completed (2026-05-19)

Meta Judge P0 + demo-hardening sweep (commits `2e570aa8` + `55420f24`): grounded+JSON-mime 400 on gemini-2.5-pro killed the metaJudge on every audit (masked by the 200+fallback) — fixed scoped, grep-verified zero-DQI. Plus scholar dead-time 25s→6s + retry-storm 3→1 + grounded+JSON-mime observability guard.

Onboarding access amendment (founder-directed, "boil the ocean") — full prose in CLAUDE.md "WelcomeModal v3.5 HXC-first merge → AMENDMENT 2026-05-19". `Other`/non-wedge sign-ups NO LONGER waitlisted: they get FULL platform access + a real generic-overview value-prop, via the SAME completion flow as HXC personas. `WelcomeModal` + legacy `Phase1PersonaModal` collapsed (deleted `handleOtherSubmit` / `other_thanks` step / `step` machine). `hxcEligible:false` tag UNCHANGED (cohort discriminator preserving Vohra ≥40%-HXC graduation integrity — access ≠ cohort; the strategy/wedge/Vohra gate are all unchanged). Lockstep cascade: icp.ts + onboarding-route comment + founder-context.ts (5 chat-coaching clauses) + CLAUDE.md (4 clause fixes + dated amendment) + audit-platform comment. No migration (plumbing was already correct). tsc clean.

## Recently Completed (2026-05-18)

Cognitive-entrenchment wedge asset — the one net-new signal extracted from the external Grok corp-dev/M&A market-research eval (its "evolve to Deal Lifecycle Orchestrator / narrowness is a weakness" headline was evaluated and rejected as the incumbent graveyard). Full prose in CLAUDE.md "Cognitive-entrenchment wedge asset (locked 2026-05-18)".

- [x] 5-surface founder-facing wedge cascade, NO pipeline/schema/taxonomy change: event-prep.ts BiasHook (GE–Alstom anchor) + discovery-pitch-toolkit.ts PitchTrigger + painSignalCue + sparring-room-data.ts midmarket_corp_dev objection scenario + education-room-data.ts bias_cognitive_entrenchment flashcard + founder-context.ts key-objection + routing rule.
- [x] Ego-threat discipline locked into every surface (never call the team biased; agree experience is real → name the pattern + cite Kahneman & Klein 2009 → flip to "the audit protects the experience").
- [x] NAMED_PATTERNS promotion deliberately deferred + surfaced as a founder-routed decision (pipeline-gated 10-surface cascade; already structurally caught by DI-B-022 + the Reference-Class Blindness toxic combo).
- [x] Gates green: tsc clean · 5 lint gates · slop-scan under trip-wire.

/demo cold-paste conversion-surface friction polish (the surface every wedge DM points a stranger at; no pipeline/copy-meaning/flow change).

- [x] Live word counter on the paste textarea + Run-button gate now mirrors the real /api/demo/run server bounds exactly (50–4000 words) — removes two silent post-round-trip dead-ends (a sub-50 400 and an over-4000 413) on the conversion surface; the client previously only gated `<15 chars`.
- [x] PasteAuditResults: Sparkles → trust icons (BookmarkPlus on the Save eyebrow, Swords on the hostile-objections section) per the locked Sparkles-discipline on the cold-conversion surface; local `titleCase` → canonical `formatBiasName` so wow-moment bias names match the taxonomy (drift-class fix, META #5).
- [x] CLAUDE.md C4 lock RE-CORRECTED: grep-proved DiscoveryGradeImpactCard is live on /demo:573 + /dashboard:1616 (the 2026-05-17 "ZERO mounts / dead code" claim was itself a false-negative grep — multi-line import evaded the single-line pattern). Forward rule sharpened to cover both directions + multi-line imports. decision-roi.ts:8 stale comment flagged for back-fill on next touch.
- [ ] Founder decision surfaced (not shipped): /demo hero subhead leads with DQI/Knowledge-Graph jargon on the coldest surface (violates the locked cold-context vocabulary rule); + the section-order tradeoff for DM-warmed traffic. See session notes.

## Recently Completed (2026-05-16)

Test-coverage cascade — full prose in CLAUDE.md "Coverage-gap cascade + threshold ratchet (locked 2026-05-16)".

- [x] Audited repo test coverage; identified the scoring engine / R²F detectors / outcome-recalibration flywheel / revenue+security gates as the high-risk untested layers.
- [x] Shipped 12 new suites, 122 tests (Tier 1 pure: compound-engine, weight-overrides, validity-classifier, reference-class-forecast, calibrated-rejection, decision-rubric, algorithm-aversion, redaction-scanner · Tier 2/3 Prisma-mocked: recalibration, outcome-gate, plan-limits, document-access). Full suite 1012 passing across 74 files.
- [x] Ratcheted vitest coverage thresholds 30 → 50/40/48/50 (stmts/branch/funcs/lines) against measured 53.08/43.30/51.23/53.67.
- [x] Gates green: tsc clean · lint:positioning/silent-catches(175)/counts(77)/canonical-imports all pass.

Older entries trimmed per the ~7-day discipline. Full prose lives in CLAUDE.md session locks + git log.
