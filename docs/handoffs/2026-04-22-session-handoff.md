# Session Handoff — 2026-04-22

Context preload for the next Claude Code session. Written at the close of a long refinement session so the next one starts with full context without re-reading 40k tokens of transcript.

## What shipped this session (commits, newest first)

| Commit      | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| next commit | Holistic lint + Prettier sweep across the whole repo. 3 real ESLint errors fixed (DesignPartnersTab setState-in-effect, TodoTab Date.now-during-render, HeroDecisionGraph setState-in-effect). 200 files reformatted by Prettier. Repo is fully green: `npm run lint`, `npm run format:check`, `npx tsc --noEmit` all clean.                                                                                                                                                                                |
| `5c40239`   | **AI Verify Principle Mapping** — new `/regulatory/ai-verify` page mapping every Decision Provenance Record field onto the 11 AI Verify principles (Singapore IMDA, aligned with EU + OECD). Print-to-PDF button via `window.print()` + print-optimized CSS. `/security` gained an AI Verify alignment strip; landing Security beat got a one-line chip. **Language discipline locked: "aligned with," NEVER "fully compliant" or "certified by" — AI Verify is self-assessment, no certification exists.** |
| `bfaee2b`   | One-liner locked + moat-stack deep-dives seeded. Primary: _"The native reasoning layer for every boardroom strategic decision."_ Secondary (cold outreach): _"The reasoning layer the Fortune 500 needs before regulators start asking."_ 4 pinned FounderTodo rows seeded via migration with the deferred moat-stack work (regulatory tailwind / R²F / Decision Knowledge Graph / outcome-calibrated DQI).                                                                                                 |
| `b6a7340`   | Audit Defense Packet → **Decision Provenance Record (DPR)** rename across 23 files + DB rename migration + regulatory-tailwinds section on /security and /design-partner.                                                                                                                                                                                                                                                                                                                                   |
| `a10a0b7`   | Founder Hub: Design Partners tab (5-seat triage UI) + plain To-Do tab + Thursday 2026-04-23 UK funding-CEO meeting context.                                                                                                                                                                                                                                                                                                                                                                                 |
| `00e1785`   | Design-partner program: /design-partner page (noindex) + POST /api/design-partner/apply + MSA + one-pager + Stripe setup.                                                                                                                                                                                                                                                                                                                                                                                   |
| `5ef2ea8`   | Decision Provenance Record v1 (née Audit Defense Packet) — Prisma model, jsPDF generator, /api/documents/[id]/provenance-record, ShareModal button.                                                                                                                                                                                                                                                                                                                                                         |
| `b9dc87d`   | Landing + R²F vocabulary lock — native-system-of-record H1, Recognition-Rigor Framework named on Kahneman × Klein synthesis beat.                                                                                                                                                                                                                                                                                                                                                                           |
| `e990100`   | Fundraise-critical safety fixes (validate-deploy-env script, ADMIN_USER_IDS UUID validation, pricing reorder, outcome flywheel sampling confidence).                                                                                                                                                                                                                                                                                                                                                        |

## What's locked (do not drift)

**One-liner.** Primary: _"The native reasoning layer for every boardroom strategic decision."_ Secondary: _"The reasoning layer the Fortune 500 needs before regulators start asking."_ Full ruleset in `CLAUDE.md` → "One-liner (LOCKED 2026-04-22)." Banned framings: "collaborative," "collaborator," "medium," "protect outcomes," "fully compliant."

**R²F — Recognition-Rigor Framework.** Kahneman's rigor (System 2 debiasing: biasDetective + noiseJudge + statisticalJury) + Klein's recognition (System 1 amplification: rpdRecognition + forgottenQuestions + pre-mortem), arbitrated by metaJudge. Anchor citation: 2009 Kahneman-Klein paper _"Conditions for Intuitive Expertise: a failure to disagree."_ Trademark filing deferred until pre-seed close (funds tight) — vocabulary owned by usage alone.

**Decision Provenance Record (DPR).** The signed, hashed 4-page PDF artifact. Language discipline: "aligned with" AI Verify's 11 principles, NEVER "certified" or "fully compliant." Two generator paths coexist for now (older `/api/compliance/audit-packet` Pro-gated server-side PDF + newer `/api/documents/[id]/provenance-record` design-partner client-side); convergence scheduled.

**Regulatory Tailwinds section in CLAUDE.md + founder-context.** Named tailwinds with dates/status. Framing rule: lead with what's in force or calendared. Never cite "the FTC is thinking about…" framing.

## Design-partner cohort state

- 5 seats, $1,999/mo locked for 12 months (20% off $2,499 Strategy list).
- First right of refusal at $2,499 for Year 2.
- 0 applications received as of handoff.
- Server-side 5-seat capacity guard in place in `/api/founder-hub/design-partners/[id]/route.ts`.
- Thursday 2026-04-23 meeting with UK funding CEO — prep bullets live in founder-context.ts under "Upcoming meetings that matter." Decision Intel one-pager ready to forward: `docs/positioning/design-partner-one-pager.md`.

## What's parked in the Founder Hub To-Do (pinned)

Four moat-stack deep-dives. Open `/dashboard/founder-hub?tab=todo` on the next deploy to see them. Each row carries the full proof-required action list in the title so context isn't lost:

1. **Regulatory tailwind** (20/60 on moat radar, user's #1 priority) — file EU AI Act + SEC AI + UK DSIT public comments; apply to NIST AI Safety Consortium + AI Verify Foundation; publish /regulatory page + RegulatoryAnchor model; ship AI Verify plugin (4-6 week review cycle).
2. **Kahneman × Klein synthesis** (40/85) — R²F whitepaper to SSRN + arxiv + /rrf/whitepaper.pdf; 3 side-by-side historical audits (Kahneman-only vs Klein-only vs R²F); academic advisor review.
3. **Decision Knowledge Graph** (55/75) — publish /decision-graph 8-edge-type methodology; add Graph Depth metric to Unicorn Roadmap; build live-graph CSO demo viewer; document partner-integration API.
4. **Outcome-calibrated DQI** (35/70) — seed calibration from 135-case library; ship Calibration Confidence chip on every analysis; add outcome-reporting MSA clause (≥60% reporting rate); weight outcomes by inverse reporting probability.

## Brainstorm items 6-27 — deferred to next session

See the original audit message that seeded this sequence. Items 1-5 are complete (positioning refactor, R²F, Decision Provenance Record, design-partner cohort, one-liner). Items 6-27 cover:

6. Unified before/during/after timeline on `/documents/[id]`
7. Collapse `/dashboard/cognitive-audits/submit` into main dashboard upload
8. Sidebar 3-cluster reorganization (Act / Reflect / Together)
9. Inline post-upload reveal → live co-edit
10. Founder Hub: persistent AMA chat pane
11. Landing ScrollRevealGraph: bind constellation to real audit events
12. Typographic rhythm unification across platform + marketing
13. Replace 5 reagraph canvases' fit retry with IntersectionObserver
14. Wider use of `.liquid-glass` class
15. Dark mode: decide or remove
16. Landing page: kill one visual, see if anything breaks
17. Live memo co-authoring: DI as a Google Docs right-rail
18. "Simulate my CEO" standalone offering
19. Weekly digest email from Decision Knowledge Graph
20. Decision Room for pre-commitment phase
    21-27. Founder-specific tips (not implementation work — save for 1-on-1 advisory, not coding)
    28-34. Critical things the founder didn't mention (DR story, demo silent-fail checks, ADMIN_USER_IDS safety, etc. — **#29, #30, #32 already shipped in `e990100`**)

**My recommendation for the next session's first task: #6 (unified before/during/after timeline on `/documents/[id]`).** Ties tightly to the DPR we just shipped (DPR is the "before" artifact; outcome-reported Brier chip is the "after"). Highest UX consolidation leverage.

## Gotchas the next session should know

- **`npm run lint` + `npm run format` + `npx tsc --noEmit` all pass as of handoff. The repo is fully green.** If any of those go red on the next session's first run, it's a regression from that session's work — not debt inherited from this one.
- **Never `git add -A` or `-u`** in this repo (per `.claude/settings.json` / `.mcp.json` etc. getting auto-modified by tooling). Stage files explicitly. Pattern: `git add path1 path2 path3` before every commit.
- **Before pushing**, stash `.claude/settings.json` + `.mcp.json`, rebase onto `origin/main`, push, pop the stash. See the session's commit flow for the pattern.
- **Pre-commit hook** runs `npm run audit:ai` (Gemini). Slow. `--no-verify` is OK when changes are tested.
- **Lint + Prettier sweeps are now holistic by default** (new memory `feedback-holistic-lint-prettier.md`). Don't scope to touched files; fix pre-existing issues in the same session.
- **Hard policy: "aligned with" NEVER "fully compliant" or "certified by"** when discussing AI Verify or any governance framework without an active audit engagement. If a design-partner GC later reviews and signs off, we upgrade — not before.
- **Two DPR generators coexist** (server-side `/api/compliance/audit-packet` Pro-gated + client-side `/api/documents/[id]/provenance-record` design-partner). Convergence is scheduled. Do not delete either path without a migration plan.

## Live demo URLs worth knowing

- `/regulatory/ai-verify` — AI Verify principle mapping (procurement-grade, print-to-PDF ready)
- `/design-partner` — 5-seat application page (robots noindex — warm-intro-only)
- `/security` — full posture + tailwinds + AI Verify alignment
- `/pricing` — Free → Strategy (featured) → Individual → Enterprise + design-partner strip
- `/dashboard/founder-hub?tab=design_partners` — triage UI for inbound applications
- `/dashboard/founder-hub?tab=todo` — plain task list with 4 moat-stack rows seeded

## Handoff closes

Repo green. One-liner locked. DPR shipped + renamed. AI Verify alignment live. Design partner program ready for Thursday. Moat-stack work parked. Items 6-27 ready for next session.
