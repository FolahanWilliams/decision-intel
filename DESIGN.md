# DESIGN.md — Decision Intel platform UI

The design principles that govern every authenticated surface (`/dashboard/*`, `/documents/[id]`, `/decisions/*`, `/dashboard/ask`). Marketing surfaces (`/`, `/how-it-works`, `/pricing`, `/security`) follow the existing marketing voice rules in CLAUDE.md; this file governs what happens AFTER the buyer has signed in or arrived at a deep-link.

## The lens

Every screen is read by ONE of these people:

- **Margaret-class CSO** — Fortune 500 strategic-planning lead. Time-poor. Skim-scrolls before deciding to engage. Already pays $250M/yr to McKinsey; will discount everything that reads as a startup product.
- **Adaeze-class fund partner** — Pan-African or EM-focused fund. Signals decisions in 30 seconds based on whether the artefact looks audit-committee-ready.
- **James-class GC** — Audit-committee gatekeeper. Reads with a procurement questionnaire mental model: where's the data lifecycle, who owns the artefact, what frameworks are mapped.
- **Marcus-class fractional CSO** — Operates across multiple clients. Needs the platform to feel calm on a small screen + give him receipts to pass to his clients.

If a screen wouldn't survive 10 seconds of any of those readers' attention without them silently downgrading their procurement instinct, it fails.

## The four levers (founder ask, 2026-05-01)

Every redesign decision is tested against:

1. **Coherence** — does this visual treatment match the rest of the platform? Same colors, spacing, typography, density.
2. **Easy to understand** — can a cold reader infer what this surface is and why it exists in <5 seconds?
3. **Visually well-crafted** — does it feel intentional, calm, expensive — or amateur, cramped, busy?
4. **Interesting** — does the buyer lean forward and ask "what is this, how do I use it?" — or scroll past?

When two levers conflict, the order is **coherence > easy > well-crafted > interesting**. Never sacrifice coherence for a clever one-off pattern. Never sacrifice clarity for visual ambition.

## First-impression rule (empathic mode)

A cold reader has not earned the platform vocabulary. **DPR / DQI / R²F / Decision Provenance Record / Recognition-Rigor Framework / Bias Genome must NOT appear as first-impression labels** on any platform surface a buyer hits cold (a shared analysis link, a demo run, a fresh-account dashboard).

The pattern: descriptive plain-language label first, technical name parenthesised or revealed on hover.

```
✗ "DPR · v2 · hashed + tamper-evident"
✓ "Audit record · cryptographically hashed"
   (technical name "Decision Provenance Record" appears in the export filename only)

✗ "DQI 73 · B"
✓ "Decision quality · 73 · grade B"

✗ "Reference Class Forecast · STRUGGLES"
✓ "Outside View · Likely outcome · STRUGGLES"
   (Kahneman-Lovallo citation revealed in tooltip)
```

The vocabulary upgrades to platform-native AFTER the user has run their first audit AND has been on the platform >7 days. Track via `firstAuditAt` + `createdAt` on the user row. Until that threshold, render the plain-language variant.

## Information hierarchy

Every detail page (document, decision package, deal, audit) follows a 5-tier hierarchy from top to bottom:

1. **Eyebrow** — page-class label in 11px green caps. ("STRATEGIC MEMO · ANALYZED")
2. **Primary headline** — the artefact's own name. 28-40px, page-display weight.
3. **Status strip** — 4-6 chips: state, owner, audit summary, dates. NEVER more than 6.
4. **Primary signal block** — the headline metric + its citation + its plain-language explanation. ONE block, hero-card sized.
5. **Secondary signal blocks** — R²F panels, biases summary, counterfactual impact. 2-3 columns on desktop, stacked on mobile.
6. **Tabbed deep panels** — the existing tab system holds long-form analysis (SWOT, evidence, simulator, etc.). Below the fold by design.

The page should be readable WITHOUT scrolling for a buyer who only wants the verdict. Below-fold = "I want to dig in."

## Spacing scale (codified from `globals.css`)

| Token | Value | Use |
|---|---|---|
| `--gap-3xs` | 4px | Inline icon-to-text gap, chip internal padding |
| `--gap-2xs` | 8px | Card title-to-meta, button internal gap |
| `--gap-xs` | 12px | Tight stack of related rows (key-value pairs) |
| `--gap-sm` | 16px | Default vertical rhythm inside cards |
| `--gap-md` | 24px | Between cards in a column, between section headings and content |
| `--gap-lg` | 32px | Between major page sections |
| `--gap-xl` | 48px | Between H1-class blocks (rare) |
| `--gap-2xl` | 64px | Page padding top/bottom (hero zones only) |

**Rule:** never invent a new spacing value. If something looks wrong at one of these, the FIX is restructuring, not a custom 18px gap.

## Typography (codified from `globals.css`)

| Token | Size | Weight | Use |
|---|---|---|---|
| `--fs-3xs` | 11px | 600 caps | Eyebrow, status pill text |
| `--fs-2xs` | 12px | 500 | Meta (timestamps, byline) |
| `--fs-xs` | 13px | 400 | Tertiary body (footnotes) |
| `--fs-sm` | 14px | 400 | Default body in dense contexts (chips, table cells) |
| `--fs-base` | 16px | 400 | Default body |
| `--fs-md` | 18px | 500 | Card title, section heading body |
| `--fs-lg` | 20px | 500 | Subsection heading |
| `--fs-xl` | 24px | 600 | Section heading inside long-form |
| `--fs-page-h1-platform` | clamp(28px, 2.2vw, 40px) | 700 | Platform page H1 (the artefact name) |
| `--fs-page-h1-marketing-hero` | clamp(30px, 3vw, 48px) | 700 italic | Marketing hero only (Instrument Serif) |

**Rule:** every heading on every platform surface uses `--fs-page-h1-platform` for H1 and `--fs-md` (18px / 500) for "this card's title." Never raw `text-2xl` or `font-size: 22px`.

## Color usage

The product runs in light theme exclusively (per CLAUDE.md dark-mode posture lock). Colors come from CSS variables in `globals.css`:

- **Accent green** (`--accent-primary`, #16A34A) — primary CTAs, owner-only badges, success states. NEVER for severity or status.
- **Severity scale** (`--success` / `--warning` / `--severity-high` / `--error` / `--info`) — bias severity, framework status, alert levels. Always paired with a label; color alone is not a signal.
- **Neutral text** (`--text-primary` / `--text-secondary` / `--text-muted` / `--text-highlight`) — hierarchical opacity-of-attention. Body uses `--text-primary`; metadata uses `--text-secondary`; "this is auxiliary" uses `--text-muted`.
- **Surface tokens** (`--bg-card` / `--bg-elevated` / `--bg-secondary` / `--bg-tertiary`) — card surface, hover state, subtle inset. Never hardcoded hex.

**Rule (count-discipline-class):** every consumer of severity color imports from `@/lib/constants/human-audit` `SEVERITY_COLORS`. Locally defined `{ critical: '#ef4444' }` maps are forbidden — drift class. The 2026-05-01 SEVERITY_COLORS canonical-import lock is permanent.

## Card tiers

Four card densities, never invent a fifth:

1. **Compact card** — used in a 3-column grid. ~120-160px tall. Single metric + label + sparkline OR chip. Card title 13px, metric 24-28px.
2. **Standard card** — default. Padding `--gap-md`. Title at top (`--fs-md` / 500), body at default size, footer chip row optional. Vertical rhythm `--gap-sm`.
3. **Hero card** — primary signal of the page. Padding `--gap-lg`. Title is contextual (e.g. "Audit verdict"), the metric or signal is rendered at `--fs-2xl` or larger, with a one-sentence explanation directly under it. ONE per page.
4. **Signal block** — the new card type for R²F surfaces (Validity / Reference Class / Feedback Adequacy / Counterfactual Impact / Org Calibration). 2-3 columns on desktop, single column mobile. Each: eyebrow label, band-colored verdict pill, single sentence rationale, tiny footer with the academic citation. Mirrors the DPR cover-page strip aesthetic.

**Rule:** any new card on any platform surface must be one of these four tiers. If the founder asks for a "kind of compact but with more body text" — push back; pick a tier.

## Empty state pattern

ONE canonical shape, used everywhere:

```
[icon, 32px, var(--text-muted)]
[1-line headline, --fs-md / 500, --text-primary]
[1-sentence body, --fs-sm, --text-secondary]
[primary CTA button OR secondary text link]
```

Padding `--gap-lg`. Centered. Maximum width `--container-sm` (480px). The icon should be lucide-react, NEVER emoji.

**Forbidden:** illustrations, animated mascots, multiple CTAs, paragraph-length explanations, multiple icons.

**The Decision Rooms surface in the screenshot violates this** — it's a 200px-tall card with the message "No decision rooms yet. Create one to collect blind independent priors from your team." That's already a one-liner; the visual weight is wrong. Fix: collapse to a 56px-tall row with the icon + line + "+ New Room" button on the right.

## Loading state pattern

**Skeleton, never spinner.** Skeletons match the final layout exactly — same heights, same widths, same vertical rhythm — so the page doesn't reflow when data lands. `PageSkeleton` already exists in `src/components/ui/`; the redesign locks its usage as the only loading pattern on every detail page.

**Forbidden:** centered spinners on a blank page, "Loading..." text strings, skeleton-then-spinner, layout shifts when data arrives.

## Density rules

- **Maximum 3 metrics per row** above the fold. The status chip row in the screenshot has 6 chips ("Avg Quality 30 · Avg Noise 53 · Documents 8 · Analyzed 1 · Status Operational" twice over) — that's a violation. Collapse to 3 max.
- **Card minimum width** on desktop: 280px. Three cards per row at the standard `1280px` content max; two at `980px`; one at `<700px`. The grid auto-flows with `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`.
- **Card maximum width** on desktop: full row at single-column hero density (1200px content max). Never let a single card go wider than the page-content frame.
- **Vertical rhythm:** `--gap-sm` between rows inside a card; `--gap-md` between cards in a column; `--gap-lg` between distinct page sections.

## Motion budget

Animation earns its keep ONLY in these cases:

1. **State change reveals** — when a number goes from `--` to a real value, animate the digits in via `AnimatedNumber` (already exists). 200-400ms.
2. **Severity-pill draws** — when a bias is detected mid-stream, fade in the new pill. 150-250ms.
3. **Skeleton-to-content** — the skeleton fades out while content fades in over the same 200ms window. Use `animate-pulse` on skeleton only.
4. **Hover states** — 150ms ease-out on `transform: translateY(-1px)` or `box-shadow` only. Never on opacity or color.

**Forbidden:** entrance animations on every page mount, parallax, scroll-driven motion (except the existing landing-page ScrollRevealGraph which is marketing-only), hover scale > 1.02, animation longer than 500ms anywhere.

## Procurement-grade signal block (new pattern, 2026-05-01)

The R²F surfaces (Validity Classification / Reference Class Forecast / Feedback Adequacy / Org Calibration / Counterfactual Impact) are the moat artefact. They were rendered as paragraph text on the existing document detail page; the redesign promotes them to a first-class card pattern.

**Anatomy:**

```
┌─ [eyebrow: "OUTSIDE VIEW · REFERENCE CLASS"] ──────────────┐
│                                                             │
│  [verdict-pill, band-colored, 14px / 600 caps]              │
│  [primary metric, --fs-xl / 600, --text-primary]            │
│  [one-sentence rationale, --fs-sm, --text-secondary]        │
│                                                             │
│  ─────────────────────────────────                          │
│  [tiny footer: citation + "v2.1.0-validity"]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Color band (1px left-border) maps to the verdict band. Footer includes the methodology version stamp + academic citation (Kahneman & Lovallo 2003 / Klein 2009 / etc.) so a procurement reader can verify externally.

**This pattern is THE canonical R²F surface for the redesign.** Every R²F instance — DPR cover, document detail page, AI Copilot suggestions, shared analysis links — uses this shape.

## Forbidden patterns (the things that scream amateur)

- **Emoji icons.** Always lucide-react. Period.
- **Sparkles next to AI labels.** Banned per CLAUDE.md Sparkles Icon Discipline. Lucide `Brain` or `Activity` or no icon.
- **`text-white` on light surfaces.** Always `var(--text-primary)`.
- **Hardcoded hex colors.** Always CSS variables.
- **Native `confirm()` / `alert()` on wow-moment surfaces.** Use shadcn Dialog + sonner toasts.
- **Two em-dashes in one paragraph of marketing copy.** One per page max (mirrored from CLAUDE.md em-dash discipline).
- **Card titles that say "Decision Quality Index"** on a cold-context surface. See first-impression rule.
- **Multiple primary CTAs on the same screen.** One primary button per page max. Everything else is secondary or text-link.
- **Status badges that use color alone.** Always color + label.
- **Card width that varies row-by-row** in the same grid. Use `minmax(280px, 1fr)` consistently.
- **Page H1 set with `text-3xl`** instead of `var(--fs-page-h1-platform)`.
- **Empty states with paragraph copy.** One-line headline, one-sentence body, single CTA.

## Mobile rules

Below 700px:
- Right rail collapses to bottom of main column (or behind a vaul drawer if it's >300px tall).
- Tab bar switches to horizontal scroll with `scroll-snap`.
- Card grids collapse to single column.
- Hero card stays full-width.
- Status chip row truncates to 3 items + a "More" affordance.
- Page padding drops from `--gap-xl` to `--gap-md`.

## Decision rules when conflicts arise

1. **If two principles conflict, pick the one closer to "the buyer's procurement instinct."** Example: "interesting" pulls toward animation; "easy to understand" pulls toward stillness. Procurement grade is stillness. Pick stillness.
2. **If a redesign would break a working feature, pause and propose two paths to the founder.** Don't ship a regression in pursuit of polish.
3. **If a CSS variable doesn't exist for what you need, ADD it to `globals.css` first**, document it here, and use it. Never inline-style-with-magic-number.

## Forward-looking rule

When this file changes (a new pattern, a new forbidden, a new card tier), update the corresponding consumers in the same commit. Patterns documented here MUST match what the codebase actually does — drift is the bug.

When a new platform surface is built (a new `/dashboard/X` route, a new tab in an existing page), the developer must answer in the PR description:

1. Which information hierarchy tier does each block belong to?
2. Which card tier are the cards?
3. What's the empty state?
4. What's the loading state?
5. Does it pass the four levers (coherence / easy / well-crafted / interesting)?

If any of these can't be answered cleanly, the surface isn't ready to ship.

---

## Persona-validated layout direction (locked 2026-05-01)

Before continuing the redesign, four buyer personas were each given the full feature set + the current document detail layout and asked to design THEIR ideal structure. The four: Margaret (F500 CSO), Adaeze (Pan-African fund partner), Richard (mid-market PE Head of M&A), James (F500 GC + audit-committee chair). All four converged with surprising consistency on the points below — universal agreement is captured first, divergent points second.

### Universal across all four buyers

**1. The verdict belongs at the top — not a tile row.** All four want a single horizontal verdict band as the FIRST thing on the page. Margaret: "verdict band — grade letter, dollar exposure, one-line recommendation." Adaeze: "DQI 64 (C+), 3 critical biases, 2 sovereign-context flags, IC-ready: NO." Richard: "DQI grade + conflict count + IC-ready pill." James: "document hash + timestamp + methodology version + DPR export button." This replaces the 4-tile metric row entirely.

**2. The three things to fix beats "biases detected: 7."** All four want a top-3 remediation list directly under the verdict band, with verbs, page references, and dollar anchors where DecisionFrame.value is present. Format: "Fix #1: anchoring on 2019 comparables (page 4, ~£X at risk if uncorrected)." This is the action layer; everything else is the defence layer.

**3. The 4-tile metric row above the fold is noise.** Three of four killed it explicitly; the fourth implicitly. Collapse into the verdict band; everything below the band is supporting evidence.

**4. Decision Rooms inline empty state is wrong.** All four hide it until populated. The InlineEmptyRow collapse shipped 2026-05-01 was the right move; extend the same rule to every other empty inline section.

**5. Phase scrub demoted to a quiet pill.** "Before / During / After" is methodology vocabulary; it doesn't earn 60px of vertical real estate above the fold. Move to a corner pill or URL parameter.

**6. View-as toggle: pick a default per role, persist.** Four equal-weight modes (Analyst / CSO / IC / Board) reads as the platform not knowing who its user is. Default to the user's role from onboarding; allow override in settings, not on every page mount.

**7. Featured Counterfactual hero — demote.** All four want it below the fold (or merged into the remediation list as a dollar anchor). Counterfactuals are retrospective; IC-prep is forward-running.

**8. SWOT — kill or deeply demote.** Adaeze: "SWOT on a $42M cross-border rollup is McKinsey-2003." Richard implicitly. The framework reads as 1965, not 2026.

**9. R²F naming is academic for cold-context.** Three of four (all but James, the procurement-grade reader) said "Recognition-Rigor Framework" doesn't land as a category claim outside warm contexts. Margaret: "demote the brand, surface the outputs." Adaeze: "for LP-facing surfaces, lead with the academic citations directly." Richard: "academic-vibes." Decision: keep R²F internally + on warm-context surfaces (DPR cover, Founder Hub), but on the live document detail page, surface the OUTPUTS by their plain-language names (Validity / Outside View / Author Calibration / Bias-fix Impact / Org Calibration). The technical name lives in tooltips and DPR footers.

**10. Mobile = verdict band + three remediation + share button.** All four read these on phones in transit. Mobile is non-negotiable above-the-fold layout; SWOT, noise distribution, simulator, knowledge graph are desktop-only.

### Divergent buyer-specific lenses (each persona unlocks specific surfaces)

**Margaret (F500 CSO)** wants:

- Author calibration line: "SVP has authored 4 prior memos in this domain; 1 outcome logged; Brier 0.31." Changes how every word below it reads.
- Dollar exposure on every bias flag, not just the counterfactual.
- "Send back to author" workflow with annotation + redline tracking.
- Outcome attribution finds her, not the other way around.

**Adaeze (Pan-African fund partner)** wants:

- **Per-jurisdiction sovereign-context strip** for every cross-border deal — first-class panel above the fold, not buried as an "EM overlay." Three columns (Nigeria / Kenya / Egypt) with FX regime, capital-controls, regulator-approval-path, comparable-multiple-decay rows.
- Deal-level composite DQI dominates; per-document is the analyst view.
- Currency-aware monetary displays (deal currency-of-record + USD reference).
- Confidential-deal toggle that disables outcome auto-detection (sovereign NDA constraints).
- LP-grade redaction toggle (Client-Safe Export Mode) surfaced on the page, not buried in API.
- Per-jurisdiction regulatory map showing which African frameworks fired on THIS deal — not a "17 frameworks supported" marketing chip.

**Richard (PE Head of M&A)** wants:

- **Cross-document conflict count is THE second metric after DQI** — surface as a red badge in the verdict band with click-through.
- "Memo Diff Mode" — when v2 lands, show what changed in the audit between v1 and v2.
- Skeptic-persona top-3 questions only on first impression (not all 5 personas × 3 = 15 questions).
- "Comparable deals that died at IC" — pull from 143-case library + firm's own knowledge graph.
- R²F surfaces auto-show on D/F-grade audits, auto-collapse on A/B-grade.
- Default IC view, persist preference.

**James (F500 GC)** wants:

- **Document hash + timestamp + methodology version** as a monospace strip in the verdict band itself (Margaret/Adaeze/Richard call this "small footer info"; James calls it FIRST-orientation content).
- DPR export button as the primary CTA in the page header chip row, not buried below the fold.
- Sub-processor list visible from the page — not buried on /security.
- Retention countdown on the artefact ("retained until 2031-04-12 per Enterprise plan").
- Audit log link directly in the page header, filtered to this document.
- Indemnification / SLA reference at point-of-use.
- Tamper-evidence honesty preserved — never let "private-key signing on roadmap" disappear in marketing copy.
- Regulatory framework mappings as a subtle strip showing 3-5 frameworks materially touched, with click-through to full mapping in DPR appendix. Not 17 chips above the fold.

### The locked above-fold structure (synthesis)

In strict order, top-to-bottom, the document detail page renders:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [VERDICT BAND]                                                          │
│  Memo title (auto-detected category) · DQI 64 / C+ · £600M exposure     │
│  Cross-doc conflicts: 3  ·  Status: NEEDS REVISION                       │
│  SHA-256: a3f2…b91c · v2.1.0 · audit log →    [Export DPR PDF →]         │
├──────────────────────────────────────────────────────────────────────────┤
│  [TOP-3 FIX TILES]   (canonical RemediationChecklist, dollar-anchored)   │
│  Fix #1 · [bias name] · page 4 · ~£X at risk · [excerpt + suggestion]    │
│  Fix #2 · ...                                                            │
│  Fix #3 · ...                                                            │
├──────────────────────────────────────────────────────────────────────────┤
│  [R²F SIGNAL STRIP]   (4 SignalBlocks — plain-language eyebrows)         │
│  Validity · Outside View · Author Calibration · Org Calibration          │
├──────────────────────────────────────────────────────────────────────────┤
│  [SOVEREIGN-CONTEXT STRIP]   (only for cross-border / EM decisions)      │
│  Nigeria · Kenya · Egypt — FX / capital controls / regulator path        │
├──────────────────────────────────────────────────────────────────────────┤
│  [PREDICTED QUESTIONS]   (collapsed; click to expand; default to top-3)  │
│  Skeptic persona's top-3 — most likely to kill the deal at IC            │
├──────────────────────────────────────────────────────────────────────────┤
│  [TAB BAR]   Overview · Evidence · Noise · DQ Chain · Perspectives       │
│  (drop SWOT — Adaeze killed it; methodology lives in /how-it-works)      │
└──────────────────────────────────────────────────────────────────────────┘

Right rail (≥1024px) | Drawer (<1024px):
  - Top-5 biases (clickable, "view all →")
  - Cross-doc conflicts list (deal-context only)
  - Sub-processor + retention accordion (James-grade trust signal)
```

Demoted below-fold or removed:

- Featured Counterfactual hero (merged into Top-3 Fix Tiles)
- Decision Scorecard (consolidated similar-decisions stays on Reference Class card)
- Phase scrub (corner pill)
- 4-tile metric row (replaced by VerdictBand)
- View-as toggle (default to onboarded role)
- Decision Rooms inline section when empty (already collapsed via InlineEmptyRow)

### Cold-context first-link rule

When a shared analysis link is opened by an unauthenticated reader (LP, board chair, audit committee member), the above-fold treatment is identical to the authenticated view EXCEPT:

- All entity names render with `[ENTITY_N]` placeholders if the sharer enabled Client-Safe Redact (DPR carries the redacted PDF separately)
- The DPR export button stays primary
- The R²F strip leads with academic citations directly (Kahneman & Klein 2009 / Kahneman & Lovallo 2003) — no "Recognition-Rigor Framework" branding
- Sub-processor + retention footer always visible (procurement signal)
- NO product marketing chrome, NO Sparkles icons, NO "Powered by Decision Intel" stripe — Adaeze's procurement-grade trust signal collapses if the artefact reads as a SaaS landing page

### What this changes in the redesign sequence

The components built in Phase 1A (SignalBlock / InlineEmptyRow / StatusStrip / MetricTile) all survive but their use shifts:

- **SignalBlock** stays as the canonical R²F card pattern, used in the R²F strip + sovereign-context strip + per-jurisdiction regulatory map
- **InlineEmptyRow** stays for collapsed empty states (Decision Rooms — already shipped)
- **StatusStrip** absorbs the chip-row pattern in the verdict band
- **MetricTile** survives but gets DEMOTED below the fold (it was the wrong-tier card for above-fold; the new tier is VerdictBand)

NEW canonical component to build in Phase 1B: `VerdictBand` — the top-of-page strip carrying memo title + DQI grade + cross-doc conflicts + status pill + audit metadata + DPR export CTA. This replaces the page header chip row + 4-tile metric grid + scattered status indicators in one cohesive card.

This is the locked direction. Every move in the document detail redesign points back to one of the universal 10 points + the locked structure above. If a redesign decision can't trace back, push back before shipping.
