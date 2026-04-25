# Weeks 9–12 Deep Plan

**Status:** Drafted 2026-04-25, immediately after the Weeks 1–8 deep ship.
**Scope:** Replaces the lean "Weeks 9–12" section in the original 12-week plan.

---

## Calibration up front

Two memories now bind every item below:

1. **`feedback-boil-the-ocean.md`** — boil-the-ocean rule overrides CLAUDE.md anti-scope-creep on planned work. No "ship the lean version" / "v1 with X deferred" allowed on roadmap items.
2. **`feedback-claude-timing-multiplier.md`** — Claude is ≈20× human-team capacity. Plan estimates in "weeks" are anchors, not budgets. The actual budget is the founder's calendar window.

The original Weeks 9–12 lean plan also had two PE/VC-coloured items (4.2 onboarding role-fork with `pe_vc` track + 4.5 deal-based pricing). Per CLAUDE.md the primary buyer is **CSO / Head of Corporate Strategy** (M&A secondary, BizOps tertiary). PE/VC is **not** a target. Both items are reshaped below to their CSO/M&A-facing versions; nothing PE/VC-coded remains in the deep plan.

Five items, ordered by **Sankore-leverage and procurement value**:

1. **4.1 Decision Rooms · pre-IC blind-prior platform** (HIGHEST LEVERAGE — Marcus called this "the feature I'd pay for immediately"; also the natural anti-groupthink fit for Titi)
2. **4.4 Decision Package** (extends 3.1 cross-doc into a packaged decision unit)
3. **4.3 Role-anchored sample library** (every persona surface in the demo + onboarding flow has the right artefact)
4. **4.2 Role-anchored onboarding** (CSO + M&A first-runs that survive procurement scrutiny — no PE/VC track)
5. **4.5 Pricing depth** (annual prepay, M&A per-deal handle, custom enterprise quotes — no PE/VC tier)

---

## 4.1 Decision Rooms · Pre-IC Blind-Prior Platform

**The pitch in one line:** Before any committee meeting, every participant submits their probability + top-3 risks blind. The room reveals an anonymised aggregation alongside the DQI score, and the platform computes Brier-per-participant once the outcome lands.

**Why this is the deep moat:** Marcus (M&A persona) explicitly called this "the feature I'd pay for immediately." It's the single most differentiated steering-committee artefact in the entire roadmap — no competitor in the decision-quality space (Cloverpop, Palantir, IBM Watson, McKinsey Decision Analytics) ships a blind-prior aggregation tied to subsequent outcome calibration. It also lands cleanly on Titi's pillar 5 (Community / governance) — the Sankore IC needs anti-groupthink mechanics, not just analysis.

### Schema

```prisma
model DecisionRoom {                         // already exists; extending
  // existing fields preserved
  blindPriorDeadline DateTime?               // when the survey closes
  blindPriorRevealedAt DateTime?             // when aggregate reveal fired
  blindPriorOutcomeFrame String?             // human-readable frame ("Should we sign Project Atlas at $40M?")
}

model DecisionRoomBlindPrior {               // new
  id                  String        @id @default(cuid())
  roomId              String
  participantUserId   String
  /// 0–100. The participant's subjective probability the decision succeeds.
  confidencePercent   Int
  /// Free-text top-3 risks they want surfaced. Stored as array of strings (≤3, ≤200 chars each).
  topRisks            String[]
  /// Optional one-sentence private rationale. Surfaced in aggregate only when the participant opts in.
  privateRationale    String?       @db.Text
  /// Whether the participant agreed to share rationale + name in the reveal. Defaults false.
  shareRationale      Boolean       @default(false)
  shareIdentity       Boolean       @default(false)
  submittedAt         DateTime      @default(now())
  /// Brier score computed once the linked outcome is logged (higher confidence + correct = lower Brier).
  brierScore          Float?
  brierCalculatedAt   DateTime?
  room                DecisionRoom  @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@unique([roomId, participantUserId])
  @@index([roomId])
  @@index([participantUserId])
}
```

### Surfaces

- **`/dashboard/decision-rooms/[id]`** — full per-room detail page (was: 142-byte redirect to `/dashboard/meetings?tab=rooms`).
  - Header strip: room title, decision frame, deadline countdown, participant roster.
  - Three states by phase: `collecting` (survey live), `revealed` (aggregate visible), `outcome_logged` (Brier per participant).
  - Survey state: send-link button (per participant) + reminder cron + status pill per participant.
  - Reveal state: anonymised distribution viz (histogram of confidencePercent, weighted bubble of top-risks frequency, optional named rationales for participants who opted in), variance + agreement metrics (stdDev of confidence, Jaccard on top-risks), DQI overlay alongside.
  - Outcome state: Brier-per-participant table, calibration curve, "your prior was closest to actual" recognition chip.
- **`POST /api/decision-rooms/[id]/blind-priors/distribute`** — fires per-participant magic-link emails with a one-time signed token (no login required to submit; survey lives behind the token).
- **`GET /shared/blind-prior/[token]`** — public, token-gated submission view. Procurement-grade: token is single-use + 14-day max + audit-logged. Participant submits without seeing other participants' inputs.
- **`POST /api/decision-rooms/[id]/blind-priors/reveal`** — owner-only, dispatches anonymised aggregate to all participants + audit-logs the reveal event.
- **Outcome integration:** when a `DecisionOutcome` lands on the linked Analysis, the existing `recalibrateFromOutcome` hook computes Brier per participant and stamps `brierScore` + `brierCalculatedAt`.

### Compliance hooks

- DPR section ("Decision-room blind-prior aggregation") added to provenance-record-data.ts. The Sankore IC can hand this to the LP / fund administrator as part of the DPR — "we ran a blind-prior survey before vote, here are the results, here's the calibration once outcome landed." This is a regulatory-tailwind moment that maps to **Basel III Pillar 2 ICAAP** (qualitative-decision documentation) + **EU AI Act Art. 14** (human-oversight documentation) + the new African registers (FRC Nigeria Principle 1.1 board-effectiveness, CMA Kenya s.2 board decision-making).
- Activity-feed integration: blind-prior submitted / reveal fired / Brier landed events surface in the existing activity feed.

### Notifications

- Slack DM on survey distribution (uses existing Slack install path).
- Email fallback when no Slack (mirrors the bias-comment mention path).
- Cron-driven reminder email at deadline-12h for un-submitted participants.

### Acceptance gates

- [ ] Deadline + reveal are atomic (no participant sees aggregate before reveal fires).
- [ ] Token survey path is RBAC-isolated (no doc content leaks via token).
- [ ] Brier per participant matches hand-calculated reference on a 5-participant test fixture.
- [ ] DPR section renders the blind-prior aggregation when present, omits gracefully when absent (no regression on rooms without survey).

**Estimated calendar window in human-team weeks:** 2–3.
**Actual budget for this Claude session:** within a single working day if the rest of Weeks 9–12 doesn't ship that day; prefer to ship 4.1 in isolation so the next session starts from green.

---

## 4.4 Decision Package

**Concept:** A *Decision Package* is a named bundle of related documents (memo + model + counsel review + IC deck) that constitutes a single decision. Cross-reference + composite DQI already runs at the **Deal** level (3.1 deep) — the Decision Package generalises this to non-Deal decisions (board recommendations, market-entry recs, RFP responses) where there's no Deal row to anchor on.

**Why this is the depth move:** Today, a CSO uploading a board recommendation has no concept of "this is one decision composed of three documents" — they upload three docs separately, the audit runs per-doc, and there's no aggregation. The Deal page solves this for M&A; Decision Package solves it for everyone else.

### Schema

```prisma
model DecisionPackage {
  id                  String          @id @default(cuid())
  orgId               String?
  ownerUserId         String
  name                String
  /// Optional decision frame — "Should we enter the Brazilian market in 2026?"
  decisionFrame       String?         @db.Text
  /// Status: drafting | under_review | decided | superseded
  status              String          @default("drafting")
  decidedAt           DateTime?
  /// Composite DQI computed across the latest analysis of every doc in the package.
  compositeDqi        Float?
  compositeGrade      String?
  /// Cached counts for the package hero card.
  documentCount       Int             @default(0)
  analyzedDocCount    Int             @default(0)
  recurringBiasCount  Int             @default(0)
  conflictCount       Int             @default(0)
  highSeverityConflictCount Int       @default(0)
  /// Visibility — same three-state model as Document.
  visibility          String          @default("team")
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  documents           DecisionPackageDocument[]
  outcome             DecisionPackageOutcome?
  crossReferences     DecisionPackageCrossReference[]

  @@index([orgId])
  @@index([ownerUserId])
  @@index([status])
}

model DecisionPackageDocument {                  // join-table to keep Document core clean
  id                  String         @id @default(cuid())
  packageId           String
  documentId          String
  /// Free-text role label per doc — "memo" / "model" / "counsel review" / "deck".
  role                String?
  /// Sort order in the package.
  position            Int            @default(0)
  addedAt             DateTime       @default(now())
  package             DecisionPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)

  @@unique([packageId, documentId])
  @@index([packageId, position])
}

model DecisionPackageCrossReference {            // mirror of DealCrossReference, scoped to package
  id                  String          @id @default(cuid())
  packageId           String
  runAt               DateTime        @default(now())
  modelVersion        String          @default("gemini-3-flash-preview")
  documentSnapshot    Json
  findings            Json
  conflictCount       Int             @default(0)
  highSeverityCount   Int             @default(0)
  status              String          @default("complete")
  errorMessage        String?
  package             DecisionPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)

  @@index([packageId, runAt])
}

model DecisionPackageOutcome {
  id                  String          @id @default(cuid())
  packageId           String          @unique
  /// Plain-English outcome (e.g. "Decision approved; market entry deferred 12 months").
  summary             String          @db.Text
  /// 0-100 outcome quality from the recalibrator (post-decision DQI vs DQI at decision time).
  realisedDqi         Float?
  brierScore          Float?
  reportedAt          DateTime        @default(now())
  reportedByUserId    String
  package             DecisionPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
}
```

### Surfaces

- **`/dashboard/decisions/[id]`** — package detail page. Same shape as the deal-detail page but for non-deal decisions:
  - Composite DQI hero (computed via `aggregateDeal`-equivalent helper extracted into a shared `aggregateAnalyses` utility — refactor 3.1's helper rather than duplicate).
  - Cross-reference card (extends 3.1's `CrossReferenceCard` to accept a package source).
  - Document list with role labels + per-doc DQI + reorder controls.
  - Outcome reporter mounted directly on the package page.
- **`POST /api/decision-packages`** — create package + optionally add documents in same call.
- **`PATCH /api/decision-packages/[id]`** — update name / decisionFrame / status / visibility.
- **`POST /api/decision-packages/[id]/documents`** — add an existing document (must be visible to caller via the RBAC resolver).
- **`POST /api/decision-packages/[id]/cross-reference`** — re-run the cross-doc agent across the package set.
- **Auto-trigger** — when an analysis completes for a doc that belongs to ≥1 package, fire the package cross-ref agent in the background (mirror the existing deal hook in `/api/analyze/stream`).
- **Sidebar entry** — new "Decisions" nav item in the **Reflect** group (sits next to Analytics and Playbooks). Sub-nav appears when on `/dashboard/decisions/*`.

### Cross-cutting integrations

- DPR generator picks up `DecisionPackage` as a valid root entity (alongside Analysis). The DPR for a package compresses every member-doc's lineage into one record — procurement-grade.
- Activity feed surfaces package_created / package_decided / package_outcome_logged events.
- Visibility resolver applies to the package itself; member-doc visibility is filtered through the same RBAC resolver so a private doc inside a team package never leaks to teammates.

### Acceptance gates

- [ ] Composite DQI math is identical to the deal-level math (single shared helper).
- [ ] Cross-reference agent runs on the same input shape as the deal version (re-use `runCrossReferenceAgent`).
- [ ] Adding a private doc to a team package does NOT widen its visibility (the doc stays private; the package is "team" but the resolver still hides the doc from non-grantees).
- [ ] Sidebar entry only renders when the user has at least one package OR has the create-permission.

---

## 4.3 Role-Anchored Sample Library

**Concept:** Every persona surface (demo, onboarding, dashboard sample picker) has the right artefact pre-loaded. Today the demo paste flow has Microsoft-Nokia / WeWork / Phoenix; that's solid for the broad audience but doesn't help a bank-regulator-focused buyer or an EM-investing CSO see themselves on the surface.

**Why this is depth, not just "more samples":** A sample is a procurement signal. The first paste a CSO makes determines whether they buy. The 8 EM cases shipped in 1.3b deep prove we can write decision-grade material. The deep ship of 4.3 is **role-routed sample selection** — the WelcomeModal already captures role; the demo + onboarding surfaces should pick the matching sample bundle.

### What ships

- **3 samples per primary buyer role** (CSO, M&A, BizOps), each at decision-grade quality matching the EM case file standard. Total: 9 new sample memos.
  - **CSO bundle:**
    - "Should we enter Brazil in 2026?" — Pan-LATAM market-entry recommendation with FX-cycle exposure.
    - "Q4 board recommendation: defer the Phoenix product" — sunk-cost + escalation vs. graceful-deferral framing.
    - "Should we acquire the regulatory consultancy that's been advising us?" — conflict-of-interest + cycle-aware acquisition.
  - **M&A bundle:**
    - "Project Atlas — preliminary IC memo" — synergy-assumption + integration-risk edge case.
    - "Bank-regulatory M&A diligence note" — Basel III ICAAP overlay with capital-allocation rigor.
    - "Reverse-merger IC memo with cross-border exposure" — multi-jurisdiction governance variance.
  - **BizOps bundle:**
    - "Should we re-platform billing?" — buy-vs-build decision with vendor lock-in framing.
    - "FY26 budget memo: increase R&D spend by 30%" — overconfidence on R&D yield curves.
    - "Should we shutter the EMEA hub?" — sunk-cost vs. rationalisation tension.
- **`SAMPLE_BUNDLES` constant** in `src/lib/data/sample-bundles.ts`. Each bundle entry: `{ slug, role, title, summary, content, expectedBiases[], expectedDqi, hookCopy }`. The `content` is the actual paste-able memo body (~600-1200 words each, decision-grade).
- **Role-routed picker** on the demo paste flow + dashboard upload zone. WelcomeModal-captured role → SampleAuditCard variants → one-click load.
- **`/case-studies/sample/[slug]` route** — public, indexable, lists each sample with the platform's pre-populated audit so visitors can see the result before pasting their own.

### Acceptance gates

- [ ] Each sample passes a manual rigor check: real cycle-aware structural assumption flagged, real toxic-combination surfaced, real cited-comparable used in the hypothetical analysis.
- [ ] Demo paste flow + dashboard sample picker route correctly off WelcomeModal.role.
- [ ] No "PE/VC" track is exposed (per CLAUDE.md positioning).

---

## 4.2 Role-Anchored Onboarding (CSO + M&A only)

**Concept:** The lean plan called for adding a `pe_vc` track. **Cut entirely** — PE/VC is not a target buyer per CLAUDE.md. The deep version goes the opposite direction: deepen the existing CSO + M&A tracks so the first 60 seconds of either onboarding feels procurement-grade.

### What ships

- **WelcomeModal** stays at four roles (cso / ma / bizops / other). No `pe_vc` addition.
- **OnboardingTour** (currently generic) forks by captured role:
  - **CSO tour** — Board Report view, Counterfactual panel, Decision Provenance Record preview, Outcome flywheel.
  - **M&A tour** — Deals page, Compare-deals view, Cross-document cross-reference card, Composite Deal DQI hero.
  - **BizOps tour** — Decision Log, Outcome Flywheel, Decision Package surface (4.4 above).
- **First-run "your first audit" walkthrough** — when a fresh org has zero analyses, the dashboard renders an inline tour that invites pasting a role-matched sample (4.3 above). Clicking through runs the real pipeline; the analyst lands on the document detail with a callout strip pointing at each major surface (DPR preview, redaction trail, market-context chip, structural assumptions, bias collab).
- **Empty-state copy** is role-specific across `/dashboard`, `/dashboard/deals`, `/dashboard/decision-log`, `/dashboard/analytics`. Generic empty states removed.

### Acceptance gates

- [ ] No `pe_vc` track exists anywhere (search the codebase before shipping).
- [ ] First-run audit walkthrough is dismissable AND resumable from the Founder Hub if dismissed.
- [ ] Each role's tour renders in <3s on a fresh org (no LLM calls; all data is pre-baked).

---

## 4.5 Pricing Depth (CSO/M&A native, no PE/VC tier)

**Concept:** The lean plan called for "deal-based pricing for PE/VC" with per-active-deal billing. **Restructured** — keep deal-based as a pricing handle that already exists on Strategy/Enterprise, but no separate PE/VC tier. The depth moves are **annual prepay**, **M&A per-deal handle as a custom overage** (not a tier), **custom enterprise quote builder**, and **renewal-grade billing infrastructure**.

### What ships

- **Annual prepay** option on Individual + Strategy with a 17% discount (2 months free), payable via Stripe annual subscription. Existing monthly subscriptions can switch mid-cycle with prorated credit.
- **M&A per-deal handle** — Strategy + Enterprise customers can purchase additional `Active Deal` slots beyond their fair-use cap. Priced as a custom overage, billed on the next invoice. NOT a separate tier.
- **Custom Enterprise Quote Builder** — `/dashboard/settings/billing/enterprise-quote` (admin only) where the buyer enters seats / deals / custom-retention-window / SLA tier, and the page generates a PDF quote with a one-click "Send to Stripe Sales" handler.
- **Invoice surface** — `/dashboard/settings/billing` shows last 6 invoices with PDF download (Stripe Invoice API), upcoming charge preview, and a per-tier usage breakdown.
- **Volume floor on Enterprise** — current Enterprise tier has no floor; the deep ship adds a configurable per-org volume floor (e.g. min 100 audits / quarter) so renewal pricing isn't open-ended. Existing customers grandfather in.

### Acceptance gates

- [ ] No `pe_vc` plan key exists in `src/lib/stripe.ts`.
- [ ] Annual prepay round-trips through Stripe (test mode) including mid-cycle swap with proration.
- [ ] Enterprise quote PDF carries the Decision Provenance Record provenance footer (we sign every artefact).

---

## Cross-cutting acceptance gates

For every item above, before commit/push:

- `npx tsc --noEmit` clean
- New endpoints respect `buildDocumentAccessFilter` / `resolveAnalysisAccess` (3.5 deep precedent).
- New schema additions have a hand-authored migration SQL file (Supabase shadow-DB workaround pattern from prior deep ships).
- New activity / nudge / audit-log events register in the existing tables (no new notification infrastructure).
- DPR generator picks up new event types so the procurement-grade trail is end-to-end.

---

## Sequencing recommendation

1. **4.1 Decision Rooms** first — highest Sankore-leverage and most differentiated.
2. **4.4 Decision Package** second — sits cleanly on top of 3.1's existing infrastructure.
3. **4.3 Sample library** third — content work, parallelisable with 4.4 implementation.
4. **4.2 Onboarding** fourth — depends on 4.3 (samples need to exist before the role-routed tour can use them).
5. **4.5 Pricing** last — billing infrastructure work is intentionally last so it doesn't block product depth.

---

## What is explicitly OUT of the deep plan

- PE/VC onboarding track (CLAUDE.md positioning)
- PE/VC-specific pricing tier (same)
- LP-reportable DPR auto-generation (waits until first paid PE/VC pilot — manual for now)
- WhatsApp / multi-language / PPP pricing (handled deal-by-deal for Sankore; not list pricing)
- Calendar integration / DealCloud / Pitchbook push (post-pilot integrations)
- Slack `/di audit` slash command (Q3, requires Slack-app re-architecture)
- Cross-org bias-genome insights (gated on 3+ paid pilots — real data first)

---

## When this plan is shipped

We move to a **Phase 5 plan** — post-Sankore-pilot priorities, sequenced against actual feedback from the meeting. That plan is intentionally not pre-written; the right shape depends on what Titi says.
