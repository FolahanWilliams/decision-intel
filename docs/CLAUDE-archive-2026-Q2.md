# CLAUDE.md Archive — 2026 Q2 ship logs

This file holds the full verbose ship-log prose for completed / superseded architecture phases. CLAUDE.md retains the **forward-looking rules** from each lock so the active conventions still ride in every session's cold-start context. The detailed implementation prose lives here and is read on demand.

**When to read this file:** when you need the history of a sequential refactor (DecisionContainer phases), the original design intent behind a retired surface (Constellation viz), or the full architecture of a one-off ship the founder may reference by name (AI Copilot composer-first follow-up, Phase 2 unified UI, Phase 1 unified model).

**When to update this file:** when a CLAUDE.md section ages past ~30 days AND is stable (no longer active discipline) AND has no forward-looking rules that need staying in CLAUDE.md, move the verbose prose here. Keep CLAUDE.md the canonical live brief.

---

## DecisionContainer Phase 3.5 — Decision Pipeline Constellation (locked 2026-05-09 evening; SVG VIZ RETIRED 2026-05-11)

**RETIREMENT NOTE (2026-05-11):** the standalone SVG constellation viz at `/dashboard/decisions/constellation` was retired 2026-05-11 (founder feedback after the band-label-clipping fix — "remove the viz entirely. also, fully update and improve the decisions page"). The N×N edge visualization across the whole portfolio always read as cluttered; the cognitive-lineage VALUE lives in the per-decision `ContainerLinksPanel` CRUD surface anyway. What stays: (a) `DecisionContainerLink` Prisma model + 4 link types + SSOT at `src/lib/data/container-link-types.ts`, (b) `/api/containers/[id]/links/route.ts` CRUD endpoints, (c) `ContainerLinksPanel` mounted on `/decisions/[id]` (moved from `src/components/constellation/` → `src/components/containers/` in the cleanup). What was deleted: (a) `/dashboard/decisions/constellation/page.tsx`, (b) `src/components/constellation/ContainerConstellation.tsx` + `ContainerNodeDetailPopup.tsx` + `constellation-layout.ts`, (c) `src/hooks/useConstellation.ts`, (d) `/api/containers/constellation/route.ts`. Plus 308 redirect from the old URL → `/dashboard/decisions`, CommandPalette entry removed, NewDecisionModal cross-link updated, founder-context.ts chat preamble updated (3 sites). The `/dashboard/decisions` page now hosts the canonical Intelligent Antagonist surface (`NextMoveContainer` mounts with `showAntagonistPrompt={true}` by default; was suppressed when constellation was the canonical capture point). Decisions page also gained `PortfolioVerdictBand` + `PortfolioSignalTiles` above-fold cluster — see "Session locks 2026-05-11" in CLAUDE.md.

**Original Phase 3.5 design intent:** longitudinal/relational viz that converts the kanban from a daily-ops triage board into a strategic narrative surface. Cornerstone-magnetic, Margaret-class CSO ready, demo-deck-grade. The kanban showed _what's on your plate today_; the constellation showed _how every decision rests on every other_ — temporal decay, escalation chains, thesis-anchor cascades, structural-assumption ripple.

**Master KB synthesis** (notebook `809f5104`, 2026-05-09 evening) drove the design. Three rules locked:

1. **Cognitive lineage, not data lineage** (Palantir Foundry's trap). Edges express thesis-anchors / dependency / parenthood / precedence — never file flow.
2. **Position is stable narrative, risk is the ambient signal** (Quantellia's trap was visual complexity). X = time created, Y = mode band; risk band drives opacity + pulse, not position.
3. **Quiet nodes fade** (Cloverpop's trap was bureaucratic logging). Only nodes with critical risk / T-N ≤ 14d / unresolved conflicts surface at full opacity. Everything else fades to 18%.

**Per-persona signal cluster** (each persona's specific workflow moment, surfaced; everything else hidden):

- **Mid-market corp dev head**: Escalation of Commitment + T-N "Yes Committee" pulse on IC nodes. The synthesis-anchor.
- **Small-fund GP** (Cornerstone-class): thesis `spawned_from` cascade + macro `depends_on` ripple. Master "B2B SaaS in EM" thesis spawned 6 portfolio investments → alert on shared "Debt cycle" assumption ripples through. The magnetic moment: _"show me where our thesis is breaking"_ rendered visually.
- **PE-backed founder**: synergy → integration plan `depends_on` red edge when no named owner.
- **Fractional CSO**: Belief Delta — client's intuition node → CSO's audited strategy node, D-grade to A-grade across engagement.

**Architecture (the files that originally shipped Phase 3.5):**

1. **Schema**: `DecisionContainerLink` Prisma model (migration `20260509235000_decision_container_link`) — `id, fromId, toId, linkType, note, createdAt, createdBy` + unique constraint `(fromId, toId, linkType)` + 3 indexes. Cascade-delete on container delete. Relations on `DecisionContainer.outboundLinks` + `inboundLinks`.
2. **SSOT**: `src/lib/data/container-link-types.ts` `CONTAINER_LINK_TYPES = ['precedes' | 'spawned_from' | 'depends_on' | 'parent_of']` + `CONTAINER_LINK_TYPE_META` (label / description / workflowMoment / edgeColor / edgeStyle per type). Edge colors are CSS-token references; never inline hex.
3. **API (deleted)**: `/api/containers/constellation/route.ts` one-round-trip read returning `{nodes, links, linkTypeCounts}`. `[id]/links/route.ts` GET / POST / DELETE for outbound + inbound links per container, still live.
4. **Layout helpers (deleted)**: `src/components/constellation/constellation-layout.ts` — pure functions, `computeRiskBand(node)` derived the 5-band risk class from existing per-container signals (cross-ref high-severity → critical, DQI < 40 → critical, ≥3 conflicts → high, etc.).
5. **Viz (deleted)**: `src/components/constellation/ContainerConstellation.tsx` — SVG viewBox 960×540, structured 3-band layout, critical-risk + T-N ≤ 7d nodes pulse via SVG `<animate>`, edges curved via Bezier with linkType-specific color + stroke style.
6. **Detail popup (deleted)**: `src/components/constellation/ContainerNodeDetailPopup.tsx` — risk-state signal cluster + decision frame quote + cognitive-lineage chip count + "Open decision →" deep-link.
7. **Link manager (preserved + moved)**: now at `src/components/containers/ContainerLinksPanel.tsx`. Mounted on `/dashboard/decisions/[id]` between cross-reference card and outcome block. Lists outbound + inbound links with severity-tinted left border per linkType + delete button + CreateLinkModal.
8. **Route (deleted)**: `/dashboard/decisions/constellation` — 308 redirect to `/dashboard/decisions`.
9. **CommandPalette (entry removed)**: `decisions-constellation` keyword `constellation / pipeline / longitudinal / graph / lineage / dependencies / thesis / spawned / precedes / depends / parent / cognitive lineage / narrative`.

**Cornerstone-meeting magnetic moment** (the reason Phase 3.5 originally shipped): a 30-min meeting with a small-fund GP where the founder demos a thesis spawned_from 6 portfolio companies, all sharing a `depends_on` edge to "WAEMU debt cycle stable through 2027". When the macro assumption flips, every dependent commit goes red simultaneously. Beats Affinity ("Affinity logs deals; Decision Intel audits them") + Notion ("schema drift, duplicated truth, permission chaos"). The demo can still happen via the ContainerLinksPanel surface on /decisions/[id] — the magnetic moment lives in the CRUD edge list now, not the SVG viz.

**Forward-looking rule** (still live in CLAUDE.md): when adding a 5th link type, every consumer (`CONTAINER_LINK_TYPES` array · `CONTAINER_LINK_TYPE_META` map · ContainerLinksPanel picker · API validation in `isValidLinkType`) updates in lockstep. Same drift-class discipline as `NAMED_PATTERNS` + `CONTAINER_MODES`.

---

## DecisionContainer Phase 2 ship (locked 2026-05-09 evening — unified UI + API + Cornerstone brief)

**Phase 2 lands the consumer surface on top of the Phase 1 foundation.** The unified container model now has a complete API + UI tree; the legacy deal/package shells are fully replaced.

**Files shipped:**

1. **`src/types/containers.ts`** — type surface (ContainerSummary / ContainerDetail / ContainerCrossReferenceFinding + filter / outcome / update payloads). Replaces deleted types/deals.ts.
2. **`src/lib/scoring/container-aggregation.ts`** — mode-agnostic `aggregateAnalyses(documents)` + `recomputeContainerMetrics(containerId)`. Mirrors deleted deal-aggregation. Compute composite DQI + bias signature + named-pattern aggregation across the latest analysis on every member doc; persists cached columns to DecisionContainer.
3. **`src/hooks/useContainers.ts`** — SWR `useContainers(filters, page, limit)` + `useContainer(id)` + `defaultContainerKindForRole(role)`. Replaces deleted useDeals.
4. **`/api/containers/*`** — list + create (`route.ts`); read + update + delete (`[id]/route.ts`); outcome (`[id]/outcome/route.ts`) with mode-aware metrics validation; cross-reference (`[id]/cross-reference/route.ts`) with manual run + history; provenance-record (`[id]/provenance-record/route.ts`) lead-doc forwarding strategy; audit-status (`[id]/audit-status/route.ts`) for per-container Stripe-purchase gating.
5. **Cross-reference auto-trigger restored** on `/api/analyze/stream` — container-scoped lookup (kind = strategic | investment | acquisition) with 30-min cooldown + ≥2-analyzed-docs gate. Mirrors the manual button on the container detail page.
6. **`src/components/containers/{ContainerKanban,CommitteeReadinessGate,ContainerCompositeHero,ContainerFormModal}.tsx`** — mode-aware UI components. Kanban columns reflect SSOT stages when `kind` is set; cross-mode rolls up to universal `pre_committee / committee_gate / post_committee` phases. Gate has 5 advisory checks (required docs / all analyzed / DQI ≥ 55 / no critical patterns / cross-ref clean). Composite hero shows DQI + grade + recurring biases + named patterns + cross-doc conflicts.
7. **`/dashboard/decisions/{page,[id]/page,new/page}.tsx`** — unified dashboard tree with persona-aware default kind via useOnboardingRole. Hero subtitle adapts: "Pre-IC memo audits before Monday partner meeting" (investment) / "Synergy thesis stress-test before the board approves" (acquisition) / "Strategic memo gates before the steering committee" (strategic).
8. **Sidebar + CommandPalette + Onboarding tour** — unified "Decisions" label (replaces "Projects" + "Packages"). Onborda anchor renamed `onborda-nav-decisions`. CommandPalette palette consolidates `deals` + `decision-packages` + `decision-packages-new` into single `decisions` + `decisions-new` entries.
9. **Cornerstone brief surface** — `src/components/founder-hub/cornerstone/{cornerstone-brief-data.ts,CornerstoneBriefTab.tsx}`. Founder-hub tab id `cornerstone` with role-neutral label "Pre-Seed VC · Warm Intro" per the no-named-prospects rule. Six sections: profile + senior-direct framing / 5 integration paths / 3-tier ask hierarchy / meeting prep board / 6 internship goals + measures / follow-up templates.

**Persona-aware kanban defaults** (locked from the Grok-pushback discussion):

- Small-fund GP / fractional CSO → `kind = investment`
- Mid-market corp dev head → `kind = acquisition`
- PE-backed founder / bizops → `kind = strategic`
- "Other" / unknown → no filter (cross-mode roll-up)

**Quality gates at Phase 2 ship**: tsc clean (0 errors); 36/36 SSOT + 8/8 conviction + all existing tests pass; 4 lint gates clean; slop-scan scorePerKloc 2.99.

**Forward-looking rule** (still live in CLAUDE.md): when adding a new container surface (a new sub-route, a new card, a new dashboard widget), the SSOT in `decision-container-modes.ts` + the existing components are the canonical building blocks. Same drift-class lock as `NAMED_PATTERNS` + `INVESTMENT_DOCUMENT_TYPES` + `getAllRegisteredFrameworks`.

---

## DecisionContainer unified model (Phase 1 lock 2026-05-09 evening — architecture refactor)

**The architectural pivot:** the prior split between `Deal` (M&A-coded model with dealType/IRR/MOIC) and `DecisionPackage` (generic-coded model with decisionFrame/status) is replaced with one unified `DecisionContainer` Prisma model + three workflow modes via a `kind` discriminator: `'investment' | 'acquisition' | 'strategic'`. Eight legacy models retired in one migration (`20260509230000_decision_container_unified_model`): Deal, DealOutcome, DealCrossReference, DealAuditPurchase, DecisionPackage, DecisionPackageDocument, DecisionPackageOutcome, DecisionPackageCrossReference.

**Why the refactor:** the v3.5 ICP wedge covers BOTH small-fund GP (VC) AND mid-market corp dev (M&A) personas. The Deal model forced M&A vocabulary on VC users; the DecisionPackage model stripped out investment-specific signal. The unified container handles both via mode-aware stages + outcome shapes + required-doc rules. Same R²F audit pipeline, same DPR, same composite DQI, same Brier-scored outcome calibration across all three modes — they diverge only on stage labels, committee-gate doc requirements, and outcome metric shape. The Bias Genome moat compounds across modes because per-org Brier accumulates on ONE table instead of three.

**SSOT** at `src/lib/data/decision-container-modes.ts` — `CONTAINER_MODES` map keyed by kind, with stages + committee gate + outcome shape per mode. 36 vitest assertions lock the 3-mode contract.

- **Investment**: Sourcing → Diligence → IC Review → Term Sheet → Closed → Portfolio → Exited (committee gate "IC Review", outcome IRR/MOIC).
- **Acquisition**: Target ID → Diligence → Board / IC Review → Closing → Integration → Exited (gate "Board / IC Review", outcome synergy realisation %).
- **Strategic**: Drafting → Under Review → Decided → Executing → Outcome logged (gate "Decision Committee", outcome forecast hit-rate).

**Phase 1 (foundation + demolition):** SSOT + 36 vitest tests + Prisma schema rewrite + clean DROP+CREATE migration (no backfill per founder confirmation 2026-05-09 "no production users yet") + delete 53 legacy consumer files + surgically rewire 14 upstream files (analyzer.ts, agents/nodes.ts + types.ts + graph.ts, analyze/stream/route.ts, upload/route.ts, documents/[id]/route.ts, export/account/route.ts, public/case-studies/route.ts, structural-assumptions/route.ts, stripe/webhook/route.ts, dpr-render/[type]/[id]/page.tsx, decision-brief.ts, plan-limits.ts, fingerprint-engine.ts, causal-learning.ts, toxic-combinations.ts, roi-attribution.ts, dashboard/page.tsx, provenance-record-data.ts) so tsc passes with build green.

**Schema shape:** `DecisionContainer` carries common fields (kind, name, decisionFrame, stageId, status, visibility, decidedAt, committeeDate, ticketSize, currency, targetCompany, sector, exitDate, composite metrics) + investment-specific optional (fundName, vintage) + acquisition-specific optional (dealType). Documents attach via `DecisionContainerDocument` join table (replaces the legacy direct `Document.dealId` FK + the `DecisionPackageDocument` join table — same doc can sit in 0..n containers). Plus `DecisionContainerOutcome` (mode-specific `metrics: Json` blob with shape matching SSOT outcomeShape.fields), `DecisionContainerCrossReference` (replaces both legacy cross-reference tables), `DecisionContainerAuditPurchase` (Stripe pay-per-container; legacy `dealId` metadata still accepted for forward-compat). `DecisionBriefRecord.dealId` renamed → `containerId` (free string ref, no FK).

**Forward-looking rule** (still live in CLAUDE.md): when adding a new container mode (4th kind), the SSOT entry in `decision-container-modes.ts` + every consumer (`/api/containers/*`, ContainerKanban, CommitteeReadinessGate, ContainerCompositeHero, container-aggregation.ts, provenance-record-data.ts assembleProvenanceRecordDataForContainer, marketing parity surfaces) updates in lockstep. Same drift-class discipline as `NAMED_PATTERNS` + `INVESTMENT_DOCUMENT_TYPES` + `getAllRegisteredFrameworks`. When adding a new stage to an existing mode, only the SSOT entry changes — consumers read by import. The committee-gate phase MUST be exactly one stage per mode (vitest enforces this).

---

## AI Copilot composer-first follow-up (locked 2026-05-09 evening — founder feedback rework)

**The Phase E ship** (2026-05-09 evening earlier) replaced the slogan "Your AI advisory team" header + dual-CTA empty state with a no-header composer-first surface. The founder pushback the same evening: "i actually liked the your ai advisory team, go back to that, the problem was the odd layout of the cards, fix the left part bar with new decision and pin a decision, they are poorly formatted." Three rework moves landed:

1. **Header restored**: `src/app/(platform)/dashboard/ask/page.tsx` carries the Sparkles eyebrow + Instrument Serif "Your AI advisory team." H1 + capability line ("Structured decisions · document Q&A with citations · cross-portfolio pattern recall."). The header grounds the surface; the founder's framing of what these agents ARE.

2. **Left rail rebuilt**: was a giant pill-shaped "+ New Decision" + a floating-ghost "Pin a document" with mismatched geometries. Now: unified header card with consistent `--radius-md` + matching widths + green top accent strip on the pin button when a doc is pinned (visual state of "this conversation has a doc grounding" is unmissable).

3. **Empty-state cards rebuilt with AccentCard pattern**: composer card gets a 3px green top accent + green eyebrow ("START A DECISION SESSION"); quick-starter cards get 2px indigo top accents (distinct secondary group); pinned-document hint gets 2px amber accent (contextual nudge semantic). The duplicate inner `<h2>` "Ask, audit, or stress-test a decision." was REMOVED (page header is the source of truth).

**Forward-looking rule** (still live in CLAUDE.md): when a Phase X ship lands and the founder pushes back on one specific element, the right move is the surgical rework that preserves what worked + fixes what didn't — NOT a full re-revert. The Phase E composer-first architecture (drop the prompt-input intermediate mode, single composer entry point) was the right call; the slogan-header drop was wrong. Surgical reverts with diff-of-the-diff awareness keep the velocity.
