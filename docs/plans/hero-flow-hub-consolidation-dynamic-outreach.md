# Plan — Hero Flow Polish + Founder Hub Consolidation + Dynamic LinkedIn Outreach

**Date:** 2026-04-11
**Branch (proposed):** `feature/hero-hub-outreach`
**Scope:** Three independent tracks, each shippable alone.

---

## Overview

Three tracks, all refinement (no new top-level routes, no schema changes without approval):

- **Track A — 60-second hero flow polish.** Fix the upload→analyze→score-reveal experience so the first 60 seconds of a demo feel inevitable, not "fine." Animation-first, backend syncs to animation (not the other way around).
- **Track B — Founder Hub 17 → 10 tabs.** Merge overlapping tabs, promote Founder Tips into the nav, keep every piece of content. No deletions, just consolidation + visual grouping.
- **Track C — Dynamic LinkedIn outreach generator.** Replace the hardcoded Yumiko/Antler meeting prep with a dynamic system: paste a LinkedIn URL (or raw profile text), pick an intent (connect / pilot / POC / investor), get an audit-backed message + talking points.

All three can ship independently. Recommended order: **C → B → A** (C is the highest GTM lever; B unblocks C's new tab placement; A is pure polish).

---

## Track A — 60-Second Hero Flow Polish

### Goal

The upload → pipeline → score reveal sequence should feel like a SAT score reveal: inevitable, paced, dopamine-tuned. Today it reads real-time from the pipeline stream, which means slow Gemini responses make the animation stutter.

### Core principle

**Animation runs on a fixed timeline. Backend fills in the gaps.** Never wait for the backend to advance the animation. If the pipeline finishes early, the animation still plays out on schedule. If the pipeline is late, the animation waits at the last rendered node, never jumps backward.

### Files touched

- [src/components/analysis/PipelineVisualization.tsx](src/components/analysis/PipelineVisualization.tsx) — the 12-node pipeline graph. Currently ticks forward as SSE events arrive.
- [src/components/analysis/ScoreReveal.tsx](src/components/analysis/ScoreReveal.tsx) (create if missing) — wraps the existing DQI badge + grade rendering with a suspense pause and staged reveal.
- [src/app/(platform)/documents/[id]/page.tsx](<src/app/(platform)/documents/[id]/page.tsx>) — swaps in `<ScoreReveal>` as the post-analysis landing component.
- [src/hooks/useAnalysisStream.ts](src/hooks/useAnalysisStream.ts) — adds a `minNodeDwellMs` floor so each node gets at least 400ms of airtime even if the backend is fast.
- [src/app/globals.css](src/app/globals.css) — adds 3 keyframe animations: `nodeGlow`, `scoreReveal`, `gradeBadgePop`.

### Detailed changes

**A1. Pipeline node pre-scheduling.**

- Keep the existing SSE stream from `/api/analyze/stream`.
- In `useAnalysisStream`, buffer incoming node events into a queue. A separate `setTimeout` loop pulls from the queue on a fixed 400ms cadence. Minimum dwell time = 400ms, maximum = until the next event arrives.
- Result: if Gemini takes 800ms on node 3 and 50ms on node 4, the user sees both nodes for at least 400ms each. No "blink and miss it" on fast nodes.
- Add a "catch-up" mode: if the backend is >2 nodes ahead of the animation, drop the per-node dwell to 200ms until caught up. Prevents the animation from falling embarrassingly far behind.

**A2. Bias count ticker.**

- Replace the current `{biases.length}` render with `<AnimatedNumber value={biases.length} duration={600} />`. Already in `src/components/ui/AnimatedNumber.tsx`.
- When a new bias is detected, trigger a subtle `bg-[var(--severity-high)]/20` flash on the count badge (200ms, ease-out).

**A3. Score reveal suspense pause.**

- After the final pipeline node completes, insert a **1.2s pause** before the score badge appears. This is the "wow" gap.
- During the pause, show a single line: "Scoring decision quality..." with a pulsing cursor.
- Then: grade badge pops in (scale 0.85 → 1.0, 300ms spring), DQI number animates 0 → final (900ms), top 3 biases slide in staggered (each 150ms delay).
- Implementation: `<ScoreReveal>` is a state machine with 4 stages — `pending`, `suspense`, `revealing`, `settled`. Use `framer-motion`'s `AnimatePresence` with `mode="wait"`.

**A4. End state — always an action.**

- The final screen currently shows "Analysis complete." Replace with: `"Your document scored {dqi}. Here's what to do next:"` + 3 buttons: "Review top bias", "Run counterfactual", "Share decision twin".
- The buttons scroll-link to the relevant tabs on the document detail page (no new routes).

**A5. Persistent "analysis in progress" banner.**

- New component: `src/components/analysis/AnalysisProgressBanner.tsx`.
- Mount point: `src/app/(platform)/layout.tsx` — slim banner at top of every dashboard page when an analysis is mid-stream.
- Uses existing `useAnalysisStream` hook, shown only when `status === 'running'`.
- Click → routes to `/documents/{id}`. Prevents "lost thread" when users navigate away mid-analysis.

### Scope discipline for Track A

- **Does not touch** pipeline backend (`src/lib/agents/*`). Pure frontend animation work.
- **Does not touch** DQI scoring. Pure presentation.
- **Does not add new API routes.**
- **Does not change** the existing SSE event format.

### Test plan

- Playwright: upload a sample memo, assert the pipeline visualization renders all 12 nodes in order with >=400ms between renders.
- Playwright: assert the suspense pause (1.2s) fires before the grade badge appears.
- Manual: run an analysis with Gemini in "fast" mode (cache hit) and "slow" mode (cold start) — verify both feel the same from the user's perspective.
- Manual: navigate away mid-analysis, verify the progress banner appears on every dashboard page and is clickable.

---

## Track B — Founder Hub 17 → 10 Tabs

### Goal

Same content. Fewer top-level choices. Match the refinement-phase mandate in CLAUDE.md: "All features should stay — nothing should be cut, but features should be consolidated and surfaced contextually rather than via separate nav items."

### Current state (17 tabs)

As declared in [src/app/(platform)/dashboard/founder-hub/page.tsx](<src/app/(platform)/dashboard/founder-hub/page.tsx>):

1. Product Overview (`overview`)
2. Pipeline Deep Dive (`pipeline`)
3. Scoring Engine (`scoring`)
4. DQI Methodology (`methodology`)
5. Methodologies & Principles (`principles`)
6. Playbook & Research (`playbook`)
7. Strategy & Positioning (`strategy`)
8. Investor Defense (`defense`)
9. Integrations & Flywheel (`flywheel`)
10. Live Stats (`stats`)
11. Case Studies (`cases`)
12. Correlation Matrix (`correlation`)
13. Decision Alpha (`alpha`)
14. Meeting Prep (`meeting_prep`)
15. Sales Toolkit (`sales`)
16. Content Studio (`content`)
17. Experiments (`experiments`)

Founder Tips exists as a component but is not currently in the tab list — promoting it to its own tab as part of this consolidation.

### Target state (10 tabs, visually grouped)

Visual grouping via small left-aligned labels above groups of tab buttons. No nesting, no sub-menus. Just labels:

**Product**

1. **Product Overview** — no change. Includes pipeline section previously on its own tab (accordion inside).
2. **Scoring & Methodology** — merges `scoring` (toxic patterns, 5x risk multipliers) + `methodology` (DQI formula, percentiles). One tab; two accordion sections.
3. **Research & Foundations** — merges `principles` (Kahneman, Sibony, Strebulaev) + `playbook` (research library + cited papers). One tab; the underlying components are kept, rendered in sequence under subheadings.

**Go-to-Market** 4. **Competitive Positioning** — merges `strategy` (moat narrative, market sizing) + `defense` (investor Q&A, kill-shot objections). One tab; two accordion sections labeled "External story" and "Investor defense." 5. **Sales Toolkit** — no change. Existing tab; keep as-is. 6. **Outreach & Meetings** — **replaces** `meeting_prep`. This is where Track C lives (dynamic LinkedIn outreach generator). See Track C below. 7. **Content Studio** — no change.

**Intelligence** 8. **Data Ecosystem** — merges `flywheel` (integrations, data sources) + `stats` (live metrics, usage counters). "What goes in + what comes out" framing. 9. **Case Library** — merges `cases` (14 case studies) + `correlation` (bias correlation matrix) + `alpha` (Decision Alpha index). Three accordion sections: "Historical cases," "Bias correlations," "Decision Alpha leaderboard."

**Tools** 10. **Founder Tools** — merges `experiments` (A/B test dashboard) + Founder Tips (promoted from standalone component). Two accordion sections.

### Files touched

- [src/app/(platform)/dashboard/founder-hub/page.tsx](<src/app/(platform)/dashboard/founder-hub/page.tsx>) — update `TABS` array, add `GROUPS` const, render grouped label + tab buttons.
- [src/components/founder-hub/](src/components/founder-hub/) — **no component deletions.** Each old tab component stays. Merged tabs render multiple existing components sequentially inside a single tab panel, wrapped in `<AccordionSection>` where needed.
- New small component: `src/components/founder-hub/AccordionSection.tsx` — tiny wrapper (header + collapse chevron + Framer `AnimatePresence`), reused across 5 merged tabs.
- Optional: `src/components/founder-hub/TabGroupLabel.tsx` — one-line styled `<span>` for the group labels.

### Consolidation rules (enforce in PR)

- **Zero content loss.** Every paragraph, chart, table, and quote on the current 17 tabs must still render somewhere after consolidation.
- **Zero component deletion.** Merged tabs compose existing components. No rewriting the internals.
- **Every accordion section starts expanded.** Preserves discoverability. Users can collapse if they want.
- **Default tab after consolidation:** `overview` (already set as part of the earlier bug-fix sweep).
- **URL preservation.** Old `?tab=meeting_prep`, `?tab=flywheel`, etc. still resolve — add a `LEGACY_TAB_REDIRECTS` map that maps old slugs to new ones (e.g., `meeting_prep → outreach`, `flywheel → data_ecosystem`). Prevents broken bookmarks.

### Test plan

- Unit: `LEGACY_TAB_REDIRECTS` resolves all 17 old slugs to exactly one new tab each.
- Manual: every accordion section renders its original component without errors.
- Manual: deep-linking via `?tab=X` works for both old and new slugs.
- Manual: sidebar count of top-level items unchanged (this is Founder Hub internal, not the app sidebar).

---

## Track C — Dynamic LinkedIn Outreach Generator

### Goal

Replace the hardcoded Yumiko Oka / Antler meeting prep with a paste-in-a-LinkedIn-URL-get-a-message flow. Four intents supported: **Connect**, **Pilot Customer**, **POC**, **Investor**. Output is a tailored outreach message + 3 talking points + 2 warm-open lines, all informed by the profile and the founder context already stored in `founder-context.ts`.

### User-facing flow

1. Founder opens **Outreach & Meetings** tab (formerly Meeting Prep).
2. Sees two top-level panes:
   - Left: **"New Outreach"** — URL or pasted-text input, intent picker, "Generate" button.
   - Right: **"Recent Outreach"** — list of the last 20 generated prep artifacts (persisted).
3. Clicks **Generate**. A 3-second pipeline visualization runs (mirrors the main analysis hero flow, but smaller):
   - **Step 1:** "Scraping LinkedIn profile..." (if URL) or "Parsing pasted profile..." (if text).
   - **Step 2:** "Analyzing professional context..."
   - **Step 3:** "Matching to founder positioning..."
   - **Step 4:** "Drafting outreach..."
4. Result pane renders:
   - **Message** (editable inline textarea, pre-filled). Copy button.
   - **Talking points** (3 bullets, tailored to intent).
   - **Warm openers** (2 alternate first-line hooks).
   - **Profile summary** (role, company, recent posts/topics, inferred priorities).
   - **Intent-specific callouts** — e.g., for "Pilot," a "Why this person's team fits your ICP" block; for "Investor," a "Their portfolio overlap" block.

### Files touched / created

**Backend**

- **NEW** `src/app/api/founder-hub/outreach/generate/route.ts` — POST endpoint. Takes `{ url?, rawText?, intent, contactName?, contactTitle?, contactCompany? }`. Returns streamed SSE response matching the existing analysis stream pattern so the pipeline viz can reuse the same hook.
- **NEW** `src/lib/outreach/linkedin-parser.ts` — two code paths:
  - If `url` is provided: **first attempt** to fetch via LinkedIn's public oEmbed-ish preview (no login). If that fails (it often will — LinkedIn gates public profiles heavily), fall back to asking the user to paste the profile text. **No scraping with auth cookies, no headless browser.** Gracefully degrade.
  - If `rawText` is provided: pass directly to the LLM extraction step.
- **NEW** `src/lib/outreach/profile-extractor.ts` — Gemini prompt that extracts structured data from raw text: `{ name, role, company, location, tenure, recentTopics[], inferredPriorities[], potentialObjections[] }`. Uses `geminiClient` from `src/lib/ai/gemini-client.ts`.
- **NEW** `src/lib/outreach/message-generator.ts` — four prompt templates keyed by intent:
  - `connect`: warm, curiosity-led, no ask
  - `pilot`: specific value proposition, proof-point-heavy, ends with a 30-day free audit offer
  - `poc`: technical, implementation-focused, proposes a 2-week scoped pilot
  - `investor`: positioning-first, uses the "why now" and "18 months of causal data" hooks from founder-context
- **NEW** `src/app/api/founder-hub/outreach/history/route.ts` — GET (list last 20) + DELETE (remove by id).
- **Read-only use** of [src/app/api/founder-hub/founder-context.ts](src/app/api/founder-hub/founder-context.ts) — the existing founder context (positioning, product specs, moat narrative, raising timeline) is injected into every message-generation prompt so outputs stay on-brand.

**Database**

- **NEW Prisma model** `OutreachArtifact`:

  ```prisma
  model OutreachArtifact {
    id              String   @id @default(cuid())
    userId          String
    intent          String   // "connect" | "pilot" | "poc" | "investor"
    contactName     String?
    contactTitle    String?
    contactCompany  String?
    sourceUrl       String?
    sourceText      String?  @db.Text
    extractedProfile Json    // structured output from profile-extractor
    generatedMessage String  @db.Text
    talkingPoints   Json     // string[]
    warmOpeners     Json     // string[]
    intentCallouts  Json     // intent-specific structured block
    status          String   @default("draft") // draft | sent | replied | closed
    sentAt          DateTime?
    outcome         String?  // short note field for tracking
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt

    user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([userId, createdAt])
    @@index([userId, status])
  }
  ```

- **Requires founder approval** (per CLAUDE.md rule: "ask before creating new database models"). Flagged in the Decision Points section below.

**Frontend**

- **NEW** `src/components/founder-hub/OutreachAndMeetingsTab.tsx` — replaces `MeetingPrepTab`. Top-level container with the two panes.
- **NEW** `src/components/founder-hub/outreach/OutreachComposer.tsx` — the input form (URL field, raw text fallback, intent picker, generate button).
- **NEW** `src/components/founder-hub/outreach/OutreachPipelineViz.tsx` — reuses `<PipelineVisualization>` primitive but with 4 custom node labels. Shares the `useAnalysisStream` hook so we get the Track A timing floor for free.
- **NEW** `src/components/founder-hub/outreach/OutreachResult.tsx` — renders message + talking points + warm openers + profile summary + intent callouts. Includes copy-to-clipboard, "Mark as sent," and "Regenerate with different intent."
- **NEW** `src/components/founder-hub/outreach/OutreachHistory.tsx` — right-pane list of recent artifacts, grouped by status (draft / sent / replied / closed), with inline status chips.
- **NEW** `src/hooks/useOutreachGeneration.ts` — consumes the SSE stream from the generate endpoint.

### Scope discipline for Track C

- **No LinkedIn scraping that requires auth.** Public oEmbed first, paste-text fallback second. Nothing else.
- **No automated sending.** This is a drafting tool, not a sender. Founder copies + sends manually (via LinkedIn, email, etc.).
- **No CRM integration yet.** `status` field + outcome note is the MVP tracker. Syncing to HubSpot / Attio is a later iteration.
- **Reuse the existing analysis pipeline primitives** — `useAnalysisStream`, `PipelineVisualization`, `apiSuccess`/`apiError`, `createLogger`. No new abstractions.

### Test plan

- Vitest: `profile-extractor.ts` given a pasted profile text block → extracts all required fields (snapshot test with a fixture).
- Vitest: `message-generator.ts` → four intent snapshots (connect, pilot, poc, investor), each asserting that the founder context fields (positioning line, moat narrative) appear in the output.
- Playwright: full flow — open Outreach tab → paste sample profile → pick "Pilot" → click Generate → assert pipeline viz runs → assert result pane renders all blocks → click "Mark as sent" → assert status updates.
- Manual: verify that for an ambiguous profile (junior employee at a non-ICP company), the generator suggests "Connect" instead of forcing a pilot pitch.

---

## Risks & Mitigations

- **Track A — animation falls out of sync with backend.** Mitigation: the catch-up mode in A1. Worst case, the user sees the final node dwell longer than 400ms while backend finishes — never a visible jump backward.
- **Track A — suspense pause feels slow on repeat demos.** Mitigation: 1.2s is the target but make it configurable via a `?fast` query param for live demos where the founder has seen it 50 times and wants to skip the pause.
- **Track B — users bookmark old tab slugs.** Mitigation: `LEGACY_TAB_REDIRECTS` map. No 404s, no surprises.
- **Track B — merged tabs become too long to scroll.** Mitigation: accordion sections default open but collapsible. If a merged tab exceeds ~3000px content height, split.
- **Track C — LinkedIn public fetch fails for most URLs.** Mitigation: expected. Paste-text fallback is the real primary path. URL input is a convenience.
- **Track C — generated messages sound generic.** Mitigation: the founder-context injection is the differentiator. Every prompt must include the positioning line, the "why now" hook, and at least one specific detail from the extracted profile. Enforce this with a post-generation validation step that re-prompts if the output is too short or doesn't reference a specific profile fact.
- **Track C — schema migration on production.** Mitigation: `OutreachArtifact` is a new additive model, no existing table touched. Safe migration. But still needs founder approval.

---

## Rollout Order (Recommended)

**Week 1 — Track C (highest GTM lever).**
Day 1–2: Prisma model + approval + migration. Backend endpoints. Profile extractor + message generator with prompt snapshots.
Day 3: Frontend components (composer, pipeline viz reuse, result pane).
Day 4: History pane + status tracking.
Day 5: Polish, test, manual QA on 5 real LinkedIn profiles across 4 intents.

**Week 2 — Track B (unblocks Track C's tab placement long-term).**
Day 1: `AccordionSection` + `TabGroupLabel` components.
Day 2: Update `TABS` array + `GROUPS` const + `LEGACY_TAB_REDIRECTS`.
Day 3: Wire up merged tabs. Verify every original component still renders.
Day 4: Manual QA of all 10 new tabs + deep-link testing.

**Week 3 — Track A (pure polish).**
Day 1: Pipeline node pre-scheduling + bias count ticker.
Day 2: `ScoreReveal` state machine + suspense pause.
Day 3: "End state with action" buttons + AnalysisProgressBanner.
Day 4: Playwright tests + manual demo-speed tuning.

Shorter alternative if velocity matters more than ordering: **C and B in parallel** (they touch disjoint files), **A last**. Risk of parallel work: Track C writes `OutreachAndMeetingsTab.tsx` and Track B writes the new `TABS` array at the same time — need to coordinate by having Track C land first on a stub tab, then Track B wires it into the group structure.

---

## Decision Points (Need Founder Input Before Coding)

These are the choices I can't make alone:

1. **New Prisma model `OutreachArtifact`.** Per CLAUDE.md, any new model requires approval. Do you approve the schema above, or do you want to scope this differently (e.g., store artifacts as JSON on an existing model like `User.outreachArtifacts Json?`)? The dedicated model is cleaner for indexing and status tracking but requires a migration. **Default if approved:** dedicated model with the exact schema above.

2. **LinkedIn URL scraping — scope.** Three options:
   - (a) Public oEmbed attempt + paste-text fallback. No auth cookies. **(Recommended, matches scope discipline.)**
   - (b) Integrate a third-party API like Proxycurl or PhantomBuster. Fast, reliable, costs ~$0.01–0.10 per profile, has ToS implications.
   - (c) Paste-text only. No URL field at all. Simplest, but worse founder UX.

3. **Where in Founder Hub does the new tab live?** Options:
   - (a) Replace `meeting_prep` with `outreach` in the "Go-to-Market" group (in Track B's 10-tab consolidation). **(Recommended.)**
   - (b) Keep a separate "Meetings" tab that's read-only history, and put "Outreach" as its own new tab. Adds a tab instead of replacing one.

4. **Four intents or more?** I'm proposing: Connect / Pilot / POC / Investor. Other candidates worth considering: Advisor ask, Press / journalist, Partnership, Customer success check-in. Adding them is mostly prompt-template work. **Default:** ship with 4, add more in a follow-up when you hit the first case a current intent doesn't fit.

5. **Track A suspense pause duration.** Default is 1.2s. SAT score reveals use ~2s. Grain and Loom use ~0.8s. Gut says 1.2s is the sweet spot but you know your demo cadence better. **Default:** 1.2s, configurable via `?fast=1`.

6. **Track B visual grouping — labels or not?** I'm proposing subtle group labels ("Product," "Go-to-Market," "Intelligence," "Tools"). Alternative: no labels, just ordering. Labels add ~24px of vertical space in the tab nav. **Default:** labels, subtle, `--text-muted` color.

7. **Should Founder Tips stay as its own tab #10, or be merged into `Founder Tools`?** Currently I'm proposing to merge it. If you use Founder Tips as a daily-reference surface, it's worth keeping as its own top-level tab. **Default:** merged into Founder Tools as an accordion section.

---

## What's Explicitly NOT in This Plan

Naming these so there's no scope creep:

- No changes to the analysis pipeline (`src/lib/agents/*`).
- No changes to DQI scoring (`src/lib/scoring/dqi.ts`).
- No new top-level app routes (sidebar count unchanged).
- No new components in the marketing site.
- No changes to Slack, Drive, or email integrations.
- No CRM integration for outreach artifacts (HubSpot/Attio is a later iteration).
- No automatic sending of outreach messages — drafting tool only.
- No new pricing or plan-limit logic.
- No schema changes beyond `OutreachArtifact` (and that requires approval).

---

## Success Criteria

- **Track A:** A first-time viewer watching a live demo reacts with a visible "huh" moment during the score reveal. The pipeline visualization never stutters regardless of Gemini latency.
- **Track B:** Founder Hub has exactly 10 tabs. Every piece of content from the original 17 tabs is still reachable. Zero broken bookmarks. Navigation cognitive load measurably lower (founder's subjective rating).
- **Track C:** Founder can paste a LinkedIn profile and get a usable outreach message in under 15 seconds. The generated message references at least one specific profile detail and at least one founder-context detail. Over 5 real prospects, the message is close enough to ship with <5 min of editing per message.

---
