# Pitch Deck Brief · EquityMatch Pre-Seed Application · 2026-05-08

> **Hand this entire document to a fresh Claude Code session.** It is
> self-contained: every locked vocabulary item, every honesty repair,
> every banned phrase, and every slide-by-slide brief is here. The next
> session should NOT re-derive from CLAUDE.md — read this file end to
> end, then produce the deliverable in the format specified at the
> bottom.
>
> **Supersedes** `docs/pitch-deck-narrative.md` (PE/VC-narrowed, pre-v3.5,
> pre-2026-05-08-pain-pivot — kept in repo for historical reference only).

---

## 1 · Context

Decision Intel is applying to **EquityMatch** for pre-seed.
- Founder: Folahan Williams. 16. Solo technical founder. Lagos (home) + UK (current residence). Stanford / UC Berkeley target Nov 2027 (NOT a near-term constraint).
- Phase: refinement / refining for first paid pilots. Phase 1 wedge = month 1 of 6 (May 2026).
- Strategy World London T-32 (June 9-10 BAFTA) — the reason the deck has to be tight by next week.

EquityMatch deck rules (constraints — non-negotiable):
- ≤ 12 slides
- Less written copy = better
- Investor knows nothing on first read — make their life easy
- Catch their eye in 30 seconds
- Energy + confidence in delivery

Output structure (12 slides, in this order — these are EquityMatch's required topics):
1. Headline
2. Problem
3. Solution
4. Product
5. Market size (TAM / SAM / SOM)
6. Market adoption
7. Market fit / KPIs
8. Business model
9. Competitors + competitive advantage
10. Funding ask + use of proceeds
11. Team
12. Contact

---

## 2 · Locked vocabulary (do not paraphrase)

These strings are protected. Treat them like proper nouns. Do not invent synonyms in shipped slides.

| Item | Canonical phrase | Source |
| --- | --- | --- |
| Category claim | **Decision Intel is the reasoning audit platform.** | `POSITIONING_HERO_PRIMARY` in `src/lib/constants/icp.ts` |
| Contrast sub-head | **Most tools audit your data. We audit your reasoning — and catch the fatal blind spots in strategic memos before the committee does.** | `POSITIONING_HERO_CONTRAST` |
| Pain framing (pitch-deck slide 2) | **Capital eroded by unaudited reasoning in strategic decisions.** | `POSITIONING_PAIN_FRAMING` (locked 2026-05-08) |
| Money-line (rehearsable) | **Reasoning is never objectively sound; it is either audited or unaudited.** | `POSITIONING_PAIN_PHILOSOPHICAL_CLAIM` |
| Asymmetric-tail body | **Most strategic memos pass cleanly. The ones that don't are the ones that destroy value.** | `POSITIONING_ASYMMETRIC_TAIL_BODY` |
| Cloverpop defensive line | **Cloverpop logs decisions; Decision Intel audits them.** | `COMPETITIVE_DEFENSIVE_LINES[0]` |
| IBM watsonx defensive line | **IBM audits the model; Decision Intel audits the human reasoning.** | `COMPETITIVE_DEFENSIVE_LINES[1]` |
| IP framework | **Recognition-Rigor Framework (R²F)** | Kahneman debiasing × Klein RPD synthesis |
| Artefact | **Decision Provenance Record (DPR)** — hashed + tamper-evident (NOT signed) | DPR generator |
| Score | **Decision Quality Index (DQI)** | `src/lib/scoring/dqi.ts` |
| Bias count | **22 biases** (DI-B-001 → DI-B-022) | `src/lib/constants/bias-education.ts` |
| Framework count | **19 regulatory frameworks** across G7 / EU / GCC / African markets | `getAllRegisteredFrameworks().length` |
| Case library | **143 audited corporate decisions** | `HISTORICAL_CASE_COUNT` in `src/lib/data/case-studies/index.ts` |
| Pipeline | **12-node LangGraph pipeline** | `src/lib/agents/graph.ts` |
| Margins | **~90% blended gross margins** (NEVER claim 97% — won't survive due diligence) | CLAUDE.md margin lock 2026-04-18 |
| Per-audit cost | **£0.30-0.50** per audit on Gemini paid tier 1, ~17 LLM calls | CLAUDE.md model policy |

### Banned phrases on every slide

Per `BANNED_VOCABULARY` in `icp.ts` — flag and rewrite if any of these appear:

- `decision intelligence platform` — Gartner-crowded
- `decision hygiene` — Kahneman's term
- `boardroom strategic decision` — audience-narrowing
- `company knowledge base` — dilutes the decision-specific moat
- `AI decision tool` / `AI-powered decision platform` — generic SaaS tells
- `native reasoning layer` — failed Pursey 15-second test
- **`bad strategic decisions`** — accusatory (locked deprecated 2026-05-08)
- **`unaudited decisions`** alone without "reasoning" — drops IP differentiator
- `collaborator` / `collaborative` / `medium` / `protect outcomes`

### Em-dash discipline

Cap one em dash per slide. Replace surplus em dashes with commas, periods, or middle dots `·`.

---

## 3 · Honesty repairs (do NOT overclaim)

These five honesty disciplines are locked across CLAUDE.md + GTM v3.5 §0. Every slide must respect them.

1. **Sankore is NOT confirmed.** Reframe as "target first reference-grade pilot, in active scoping" or "design-partner pilot in active scoping with a London-based fund." Do NOT name Sankore on the deck. Do NOT use the word "confirmed." Do NOT print "first design partner" without the qualifier.
2. **Brier 0.258 stays inside.** Keep in technical README + DPR cover + /r2f-standard #calibration page. Do NOT lead with the Brier number on the deck or in any cold-context slide. If asked in Q&A, the answer is in `buildPositioningPromptBlock()` — synthetic baseline, methodology v2.0.0-seed, hindsight neutralised, replaced by per-org Brier once outcomes accumulate.
3. **5 candidate seed funds, paths to be activated** — NOT "5 named in priority order." Do NOT print Conviction / Cyberstarts / Elad Gil / Index / Neo names on the deck. Mention "5 candidate funds activated through the advisor network" in speaker notes only if the investor pushes; never on the slide itself.
4. **No £100M arc on the deck or in any investor email.** That figure stays inside Founder Hub Path-to-100M tab. The deck can reference "8-12× ARR strategic acquisition exit" math without an absolute target.
5. **Noise jury = decorrelated samples, not formally independent.** If the slide mentions the 3-frame jury, use "decorrelated samples" language, not "independent." Three professional lenses on the same rubric: equity-research skeptical, regulator-hostile, contrarian-strategist.

### Things NOT yet true (do not claim)

- No paying customers
- No PhD
- No prior exit
- No co-founder
- The advisor is **Mr. Reiner** (NOT Roy Reznik, NOT Raynor — never auto-correct)

### Things that ARE true (lead with these)

- Mr. Reiner advisor — helped take Wiz from startup to $32B (this IS approved on public surfaces per CLAUDE.md founder-bio anchor)
- Published research paper on 2008 financial-crisis bias mechanics
- Financial literacy initiative at school
- Metacognition speech (canonical voice anchor)
- 28 hr/week startup cadence (NOT the deck-cover "16 hr/week" — that's the school-only slice)
- AP system (NOT A-levels) — AP Cyber Security · AP Calculus AB · AP English Language · AP Microeconomics + AP Statistics · Honors Physics next year

---

## 4 · The 12 slides (one-by-one brief)

For each slide: **Headline** (the slide's main string) · **Body** (sub-text, max ~30 words on the slide) · **Visual** (what to render) · **Speaker notes** (what the founder says aloud — keep tight; the slide does most of the work). At end of each slide: a "Banned for this slide" mini-list when something is specifically off-limits beyond the global ban list.

---

### Slide 1 — Headline

**Headline:**
> Decision Intel is the reasoning audit platform.

**Body (sub-head, second line):**
> Most tools audit your data. We audit your reasoning, catching the fatal blind spots in strategic memos before the committee does.

**Visual:** Centered. Display-serif Instrument Serif (matches the landing-page hero). Italic green fragment on "the reasoning audit platform." Small eyebrow above: `FOR DECISIONS WORTH DEFENDING`. NO logo clutter. NO tagline beyond this. Pentagon glyph (the AnatomyOfACallGraph) bottom-right at ~96px as the brand mark.

**Speaker notes (5-10 seconds aloud):**
> "Decision Intel is the reasoning audit platform. Most tools audit your data. We audit the human reasoning behind every high-stakes decision."

**Banned for this slide:** any sub-tagline, any feature lists, "AI-powered" anything, the dollar size of any market figure.

---

### Slide 2 — Problem

**Headline:**
> Capital eroded by unaudited reasoning in strategic decisions.

**Body (3 stat anchors, one line each):**
- McKinsey: only 8% of large strategic moves beat their sector benchmark.
- HBR + KPMG: 70-90% of M&A and venture deals miss their thesis.
- $250M/yr per F500 in value destroyed by avoidable strategic mistakes.

**Visual:** Three stat blocks left to right. Each stat in big mono numerics (Source Serif 4 or JetBrains Mono), source citation tiny italic underneath. NO bias-detection / DI-product imagery yet — the slide is pain only. Soft red top-border on the card (severity-coded).

**Speaker notes (15-20 seconds):**
> "Most strategic memos pass cleanly. The ones that don't are the ones that destroy value. You can't tell the catastrophic memo from the clean memo without auditing both. The reason isn't that executives have flaws. Cognitive biases are the operating system of every human brain. The reason capital gets destroyed is structural: there's no audit step between the memo and the cheque."

**Money-line for end of speaker note (rehearseable):**
> "Reasoning is never objectively sound. It is either audited or unaudited."

**Banned for this slide:** "bad strategic decisions" (banned), "flawed reasoning" (accusatory), "unaudited decisions" alone (drops IP).

---

### Slide 3 — Solution

**Headline:**
> 60-second audit. R²F-graded DQI. Hashed + tamper-evident DPR.

**Body:**
> Upload a strategic memo. We run the Recognition-Rigor Framework — Kahneman's debiasing arbitrated with Klein's Recognition-Primed Decisions in one pipeline — and return a Decision Quality Index, the bias catalogue, and a procurement-grade Decision Provenance Record. Most memos pass. The ones that don't, you fix before the committee sees them.

**Visual:** A single anonymised WeWork DPR cover-page screenshot, rendered medium-large center-stage. Thin caption underneath: "Specimen: 2019 WeWork S-1 audit (anonymised). Public at decision-intel.com/demo." This is the artefact-led pitch (master-KB lesson `es_10` + saved memory `feedback-empathic-mode-first`).

**Speaker notes (20-25 seconds):**
> "The buyer uploads a memo, we return three things in 60 seconds. A DQI score on the rigor of the reasoning. A catalogue of every bias we caught with the verbatim excerpt. And a hashed, tamper-evident PDF the GC can hand to the audit committee. The artefact you're looking at right now is what we ran on the WeWork S-1. The biases were visible from the document alone, before a single share traded."

**Banned for this slide:** "AI-powered" prefix, "12-node pipeline" (too technical for slide 3 — that's slide 4), "decision intelligence" framing.

---

### Slide 4 — Product

**Headline:**
> 12-node pipeline. 22 biases. 19 regulatory frameworks. One DPR.

**Body (4 short bullets, one line each):**
- 22 named biases in a stable taxonomy (DI-B-001 → DI-B-022) with academic citations.
- 12-node LangGraph pipeline arbitrated by a 3-frame noise jury (decorrelated samples across two model families).
- 19-framework regulatory crosswalk: G7 + EU + GCC + African markets (NDPR, CBN, WAEMU, PoPIA, ISA Nigeria 2007).
- DPR cover ships 9 R²F signal blocks: Validity, Reference Class, Feedback Adequacy, Confidence Calibration, Fractionation of Expertise, Decision Rubric, Algorithm Trust, Inside-View, Counterfactual Impact.

**Visual:** Pipeline flow diagram (12 nodes connected) + a small DPR-anatomy strip showing the 9 R²F blocks. Both renderable from `src/components/marketing/how-it-works/PipelineFlowDiagram.tsx` + `DprAnatomyViz.tsx`. Use them as visual references; do not screenshot inline if the deck format is markdown — describe the diagram instead.

**Speaker notes (20 seconds):**
> "The 22-bias taxonomy is stable and published — every flag carries an academic citation a GC can verify. The pipeline runs three professional lenses on every memo: equity-research skeptical, regulator-hostile, contrarian-strategist. Their disagreement IS the noise signal. The regulatory crosswalk is what makes this defensible across cross-border deals — not US-only, which is where Cloverpop and IBM both stop."

**Banned for this slide:** "decorrelated samples" must be the exact phrase — NOT "independent judges." The 19 frameworks must be derived (`getAllRegisteredFrameworks().length`); if the deck format hardcodes the number, mark it "as of audit time."

---

### Slide 5 — Market size (TAM / SAM / SOM)

**Headline:**
> $250M/yr per Fortune 500 in unaudited-reasoning erosion. The reasoning-audit category does not yet exist as a Gartner segment.

**Body:**
- **TAM:** F500 + FTSE 250 + S&P 500 corporate strategy + corp dev = ~$8B/yr in addressable spend on decision tooling + governance + diligence.
- **SAM:** Cross-border M&A + strategic capital allocation specifically (where the 19-framework moat lives) = ~$1.2B/yr.
- **SOM (next 24 months):** £249/mo × 8-12 retained Phase 1 buyers + £1,999-£4,999/mo × 1-3 Phase 2 design-partner pilots + 2-3 F500 ceiling pilots @ £50K-£150K ACV = ~£500K-£1.2M ARR ceiling for the seed runway.

**Visual:** Three nested rings (TAM > SAM > SOM) with the dollar/pound figures inside each. Sober — no neon, no startup confetti. Procurement-grade.

**Speaker notes (15-20 seconds):**
> "We're not creating a category from scratch. The pain is documented across McKinsey, HBR, KPMG. What's new is the reasoning-audit shape of the answer. The category — reasoning-audit-platform — does not exist as a Gartner segment, which means it's ours by usage. Our Phase 1 wedge captures the four buyer-class-continuous personas at £249/mo. Phase 2 is design-partner pilots that produce reference cases. Phase 3 unlocks F500 procurement at £50K-£150K ACV."

**Banned for this slide:** £100M arc figure, "unicorn" framing, "$1.3T eroded annually" (founder doesn't have a verified McKinsey citation for that number — use the verifiable 8% / 70-90% / $250M anchors instead).

**ASK FOUNDER BEFORE LOCKING:** confirm the SOM math is honest given current pipeline. If founder hasn't talked to a F500 ceiling buyer yet, drop the Phase 3 row and lower the SOM ceiling.

---

### Slide 6 — Market adoption (who buys + how)

**Headline:**
> Phase 1 wedge: 4 HXC personas at £249/mo. UK + US.

**Body — the 4 HXC personas (one row each):**
| Persona | Archetype | Why they buy now |
| --- | --- | --- |
| Fractional CSO / strategy consultant | Marcus | 3-5 client engagements × regular memo flow. Personal card. £249 absorbs into retainer billing. |
| Head of Corp Dev / M&A at $50M-$500M scale-up | Damien | Owns the IC memo workflow. Personal-decisive divisional spend up to £5K-£10K/yr without procurement. |
| GP / principal at smaller fund (£5M-£100M AUM) | Aisha | Active deal flow OR LP-governance pressure. GP-level personal-decisive budget. |
| PE-backed founder / CEO | Henrik | Owns the strategic memo workflow. Founder personal card OR company tooling line under board threshold. |

**Body (sequencing — bottom strip):**
> Wedge (months 1-6) → Bridge (months 6-12, design-partner pilot in active scoping) → Ceiling (months 12-24+, F500 corp dev / cross-border M&A @ £50K-£150K ACV).

**Visual:** 4-persona row of cards with the archetype name + 1-line "why now" each. Below: a 3-stage horizontal sequencing timeline (wedge → bridge → ceiling).

**Speaker notes (20 seconds):**
> "We're narrowed to four buyer-class-continuous personas at £249 per month. Junior analysts and roles outside these four auto-redirect to a waitlist at sign-up. The wedge has two functions: cashflow, and the published references that unlock the Fortune 500 ceiling 12-24 months out. The bridge is a design-partner pilot in active scoping with a London-based fund — that's what produces the first reference-grade DPR specimen the F500 procurement gate needs to see."

**Banned for this slide:** the word "Sankore." Names of any specific individual or firm. "Pan-African / EM funds as wedge" — they are NOT the wedge per v3.2 lock; the regulatory map is the moat layer that protects every phase. Junior analysts named anywhere.

---

### Slide 7 — Market fit / KPIs

**Headline:**
> Phase 1 graduation gate: Vohra ≥40% HXC + 8-12 paid retained 90 days.

**Body (bullets):**
- The Vohra "very disappointed" PMF survey, filtered to the 4-persona HXC cohort. ≥40% on N≥5 = green-light Phase 2.
- 8-12 paid Individuals retained 90+ days by month 6 (15-25 stretch).
- Outcome Gate auto-enforced on `phase1HxcEligible=true` users from day one — every audit must close its outcome before the next audit unlocks. Compounds the per-org Brier flywheel that makes the moat structurally non-replicable.
- Kill criterion: <5 paid by month 4 OR Vohra <30% HXC by month 4 = halt scaling, run product-discovery sprint. We don't push harder on the same motion when the early-warning signal is red.

**Visual:** Two stacked rows: the Vohra graduation gate (40%) on top, the customer-count gate (8-12) below. Below that, the kill-criterion in muted red text.

**Speaker notes (15 seconds):**
> "The graduation rule is set. Forty percent very-disappointed on the HXC cohort plus eight to twelve retained customers by month six. If those signals don't fire by month four, the kill criterion triggers and we run a discovery sprint. We don't scale a broken motion."

**Banned for this slide:** any specific "we have N paying users today" number unless it's TRUE at deck-print time. If zero, the slide stays gate-shaped — what we WILL hit, on what timeline.

**ASK FOUNDER BEFORE LOCKING:** current paying-customer count + Vohra HXC % at audit time. If both are zero, this slide is forward-looking only and that's honest.

---

### Slide 8 — Business model

**Headline:**
> £249/mo Individual → £2,499/mo Strategy → Enterprise custom. ~90% blended gross margins.

**Body (3 tiers + economics):**
- **Individual** £249/mo: 15 audits + DPR. Phase 1 wedge tier. Personal-card-decisive.
- **Strategy** £2,499/mo: 250 audits/mo fair-use + team. Months 6-12 bridge tier.
- **Enterprise** custom (£50K-£150K ACV typical): unlimited audits + SLA + custom retention + indemnification. Months 12-24+ ceiling tier.
- **Variable cost:** ~£0.30-£0.50 per audit on Gemini paid tier 1 (~17 LLM calls across 12 nodes). ~90% blended gross margins; high-usage Strategy + Enterprise compress to 70-85% which we volume-floor in contract.

**Visual:** 3-column pricing table. Each tier shows price, audit cap, primary buyer, primary differentiator. Below the table: a single-line economics note.

**Speaker notes (15 seconds):**
> "Three tiers. Wedge to bridge to ceiling. Margins are roughly ninety percent blended at the per-audit cost we run today on Gemini's paid tier. Enterprise compresses to seventy at heavy usage which we floor in contract. Pricing is ratified — Strategy is two thousand four hundred ninety-nine, not four thousand nine hundred ninety-nine the previous PMF report had."

**Banned for this slide:** "97% margins" (overclaim), "$0.03-$0.07 per audit" (legacy stale; current is £0.30-£0.50). "DPR-only $99/mo tier" — not shipped, not approved, not in pricing.

---

### Slide 9 — Competitors + competitive advantage

**Headline:**
> Cloverpop logs decisions. IBM audits the model. We audit the reasoning.

**Body (3-column comparison):**
| | Cloverpop | IBM watsonx.governance | Decision Intel |
| --- | --- | --- | --- |
| What gets audited | Decisions (logged + voted) | AI models (lineage, drift, fairness) | **Human reasoning** in strategic memos |
| Bias detection | None | None | 22-bias taxonomy + R²F |
| Reference-class data | None public | None public | 143-case library + per-org Brier |
| Cross-border regulatory | US-anchored | US/EU-anchored | 19 frameworks: G7 + EU + GCC + African |
| Artefact | Decision log | Model report | Hashed + tamper-evident DPR |

**Body (defensive lines below the table):**
> "Cloverpop logs decisions; Decision Intel audits them."
> "IBM audits the model; Decision Intel audits the human reasoning."

**Visual:** Three columns side-by-side, DI on the right with a green accent border. The two defensive lines bold below the table, italic.

**Speaker notes (20 seconds):**
> "Two incumbents matter, both structurally adjacent. Cloverpop logs decisions and votes — they have the workflow but no bias detection. IBM watsonx audits AI models — model lineage, fairness, drift — but does not audit the human-authored memo. The R²F + 22-bias taxonomy + 143-case reference library + 19-framework cross-border map are the four moat layers neither incumbent can retrofit. The category — reasoning-audit-platform — is ours by usage."

**Banned for this slide:** "no competitors" (false — Cloverpop + IBM ARE competitors); "Cloverpop is dead" (we don't trash competitors, we name the structural gap). Generic "AI startup" framing.

---

### Slide 10 — Funding ask + use of proceeds

**🚨 ASK FOUNDER BEFORE LOCKING THIS SLIDE.** Per CLAUDE.md the deck currently shows $1.5M post-money / ~13% dilution; founder's verbal terms with the active VC partner are 10% post-money cap. ALIGN BEFORE SENDING. Two clean variants below — confirm which to lock.

**Variant A (verbal terms, $200K @ ~10%, $2M post-money):**

**Headline:**
> Raising $200K pre-seed. Network access > capital.

**Body (bullets):**
- $200K post-money SAFE. ~10% post-money cap ($2M post-money).
- Use of proceeds (12-month runway): 40% founder-led GTM + pilots ($80K) · 25% engineering contractors ($50K) · 20% SOC 2 Type I + Type II observation start + AI Verify alignment ($40K) · 15% reference-grade DPR specimens ($30K).
- Pre-seed milestones: 5+ paying Individuals ($15K ARR) · 1+ design-partner pilot signed · 1+ verifiable DPR referral · SOC 2 Type I issued (Q4 2026) with Type II observation underway · 50+ qualified waitlist contacts · seed conversation opens 12-15 months out.
- Customers before investors (Mr. Gabe rule): the seed round opens AFTER the wedge graduation gate fires, not before.

**Variant B (deck-as-currently-drafted, $200K @ ~13%, $1.5M post-money):**
Same body bullets; replace post-money cap line with "~13% post-money cap ($1.5M post-money)."

**Visual:** A single column. Funding ask on top in big mono. Use-of-proceeds as a horizontal bar chart (4 segments × percentage). Milestones below as a checklist. NO valuation chart, NO TAM-vs-ask comparison.

**Speaker notes (20 seconds):**
> "Two hundred thousand pre-seed. The capital matters but it's not why we're raising — the network access through the partner's portfolio CSO and corp-dev relationships compresses time-to-first-customer and time-to-design-partner. Twelve-month runway covers founder-led GTM, contractor engineering, SOC 2 Type One, and three reference-grade DPR specimens. The seed conversation opens twelve to fifteen months out, after the wedge graduation gate fires, not before."

**Banned for this slide:** any seed-fund names (Conviction, Cyberstarts, Elad Gil, Index, Neo). The £100M ARR target. "Series A" or "Series B" plans (decks at this stage live in pre-seed gravity only).

---

### Slide 11 — Team

**Headline:**
> Solo technical founder. Wiz advisor. Lagos + UK.

**Body (3-block structure):**

**Folahan Williams · Founder + Engineer**
- 16 (Stanford / UC Berkeley target Nov 2027 — NOT a near-term plan, just where the long arc points).
- Solo technical founder. Built the entire codebase (200+ components, 12-node pipeline, 19-framework regulatory map).
- Published research on 2008-financial-crisis bias mechanics. Runs a financial-literacy initiative. Delivered a metacognition speech at school.
- Born US, raised between Lagos (home) and the UK (current residence). Bilingual context is the moat for the cross-border M&A ceiling.

**Mr. Reiner · Advisor**
- Helped take Wiz from startup to $32B exit.
- Operating-side advisor. Connection-leverage relationship: warm intros to F500 corp dev / cybersecurity / governance acquirers.

**Hiring next**
- GTM / enterprise-sales co-founder or BD contractor — activated post-seed once the wedge graduation gate fires.

**Visual:** Three columns. Folahan center (largest), Mr. Reiner left, "next hire" right (smaller). Founder photo if available; otherwise, a clean text-only block. No stock photos.

**Speaker notes (20 seconds):**
> "Solo technical founder. Sixteen, raised between Lagos and the UK, US-bound at eighteen. I built every line of the codebase. The advisor — let's call him Mr. Reiner — helped take Wiz from startup to thirty-two billion. Hiring is locked behind the seed; we close customers before we hire. The Mr. Gabe rule. Lagos is the narrative edge — the cross-border regulatory moat in the product is built on the kind of regimes I grew up around."

**Banned for this slide:** any name correction of "Mr. Reiner" → Roy Reznik / Raynor (per saved memory `user-advisor-name-mr-reiner`). Any claim of co-founder, prior exit, PhD, or paying customers.

---

### Slide 12 — Contact

**Headline:**
> Folahan Williams · folahan@decision-intel.com

**Body:**
- decision-intel.com
- Live demo: decision-intel.com/demo (60-second audit, no login)
- Specimen DPR: WeWork (US/global) + Dangote 2014 (Pan-African / EM) — public PDFs at decision-intel.com
- Procurement-grade evidence pack: decision-intel.com/trust

**Visual:** Centered. Match slide 1 typography (Instrument Serif). One QR code for the live demo URL — that's the cold-evidence door for any reader who scrolls back through the deck and wants the artefact in one tap. Pentagon glyph bottom-right matching slide 1.

**Speaker notes (5 seconds):**
> "Decision Intel dot com slash demo. Sixty-second audit, no login. The artefact does the rest of the persuasion."

**Banned for this slide:** social handles (LinkedIn ok; X / TikTok / Instagram NOT). Personal phone. Calendly link unless the founder explicitly approves.

---

## 5 · Q&A backstop (founder rehearses; not on slides)

These four answers are LOCKED in `buildPositioningPromptBlock()` (icp.ts) and the StartHereTab "Defensible investor answer" card. The founder rehearses them verbatim. They do NOT live on the deck — they live in the conversation that follows. Including them here so the next session has them in one place.

**Q: "Where did the 143 case studies come from?"**
> "143 case studies hand-curated from primary sources — SEC filings, court records, biographies, post-mortem investigations — and tagged against our 22-bias DI-B taxonomy. Every case carries the verbatim pre-decision document excerpt so a reader can audit the tag against the source. The corpus is the seed for the platform's reference-class forecaster, not the validation set; per-org Brier-scored recalibration replaces it once design partners' outcomes accumulate."

**Q: "Is the Brier 0.258 number real?"**
> "It's a synthetic baseline — methodology version 2.0.0-seed — from running the published DQI weights over the case-study library with hindsight neutralised on the evidence-quality dimension. Same posture as Tetlock's CIA-analyst baseline before the superforecaster cohort had cumulative outcomes. Per-org Brier replaces it once a customer org has a closed outcome."

**Q: "Have you used Cloverpop / Aera / Quantellia?"**
> "I've studied their public documentation, product surfaces, and customer case studies in depth. I haven't hands-on used them as a paying customer. The differentiation claim is structured around what they describe publicly — logging vs. auditing, single-judge vs. R²F, no validity-aware DQI shift, no cross-border regulatory map — not against private knowledge of their internals."

**Q: "Three independent AI judges — aren't they correlated?"**
> "Decorrelated samples, not formally independent — the standard noise-audit framing (Kahneman et al. 2021). Three frames, three different model architectures, plus random-seed stochasticity. Different professional lenses on the same rubric: equity-research skeptical, GC + Basel III ICAAP regulatory-hostile, Kahneman & Lovallo 2003 reference-class contrarian. Their disagreement IS the noise signal."

---

## 6 · Output format + assembly instructions

**Recommended deliverable shape (lift these into the next Claude Code session):**

1. **Primary output:** a single Markdown file at `docs/pitch-deck-equitymatch-pre-seed.md` with 12 sections (one per slide), each containing:
   - `## Slide N — [Topic]`
   - `**Headline:**` block
   - `**Body:**` block
   - `**Visual:**` direction
   - `**Speaker notes:**` block (italic)

2. **Optional secondary output:** a Marp-flavoured Markdown variant at `docs/pitch-deck-equitymatch-pre-seed.marp.md` that exports cleanly to PDF via `npx @marp-team/marp-cli` — this gives the founder a one-command rendered deck without leaving the repo. Front-matter:
   ```yaml
   ---
   marp: true
   theme: default
   class: lead
   paginate: true
   ---
   ```
3. **Asset references (do NOT generate — point at existing):**
   - WeWork DPR specimen: `public/dpr-sample-wework.pdf`
   - Dangote DPR specimen: `public/dpr-sample-dangote.pdf`
   - Pipeline flow diagram: `src/components/marketing/how-it-works/PipelineFlowDiagram.tsx`
   - Anatomy pentagon: `src/components/marketing/AnatomyOfACallGraph.tsx`
   - Calibration baseline: `src/lib/learning/platform-baseline-snapshot.ts`

**ASK THE FOUNDER before generating** (these have honest disagreements in the canonical sources):

1. **Slide 10 dilution:** $200K @ ~10% (verbal terms with active VC) OR $200K @ ~13% (deck-as-currently-drafted)? Per CLAUDE.md they need to align BEFORE sending to a partner.
2. **Slide 7 paying-customer count:** what's true at deck-print time? If non-zero, lead with it. If zero, the slide stays gate-shaped (forward-looking only).
3. **Slide 11 founder photo:** include or skip?
4. **EquityMatch context:** is the deck for an EquityMatch screening application, or for an EquityMatch-introduced investor partner? The audience determines whether to lean more on artefact (live demo, DPR specimen) or more on financials.
5. **Brier number on slide 4:** keep "143-case calibration baseline" only (current draft), or add the Brier 0.258 number? Per honesty repair #2 the Brier stays inside, but EquityMatch is a sophisticated investor audience and the number IS real — founder's call.

---

## 7 · Voice + delivery rules

EquityMatch's own constraints (from their PDF):
- **≤ 12 slides** — non-negotiable. Do NOT exceed.
- **Less is more** — every slide audited for word count. If a sentence isn't load-bearing, cut it.
- **Investor knows nothing** — every term resolves on first read or it dies.
- **30-second eye-catch** — slide 1 + slide 2 must do all the heavy lifting in the first half-minute.
- **Energy + confidence** — speaker notes should be rehearseable in the founder's own voice (16-yo Lagos + UK, AP-system, metacognition speech as the canonical voice anchor).

DI-specific delivery rules (from CLAUDE.md voice locks):
- Calm CSO 1:1 voice. Never critique the buyer's judgment. Frame as additive rigor, not a report card.
- Lead with gain, not deficit (slide 2 is the only deficit-led slide; everything else is gain).
- Em dashes capped at 1 per slide.
- Procurement-grade vocabulary (the test: every word is something a F500 CSO, GC, or CFO could say aloud in a procurement meeting without flinching).
- Lagos is the narrative edge — lead with it on slide 11.

---

## 8 · Final assembly checklist (next Claude Code session runs this BEFORE submitting)

Before producing the final deck file, verify each item:

- [ ] All 12 slides present, in EquityMatch's required order
- [ ] Slide 1 = locked H1 verbatim
- [ ] Slide 2 = locked PAIN_FRAMING ("Capital eroded by unaudited reasoning in strategic decisions")
- [ ] Slide 9 = both Cloverpop + IBM defensive lines verbatim
- [ ] No Sankore / Wiz-network / seed-fund names on any slide
- [ ] No "bad strategic decisions" / "unaudited decisions" alone / "AI-powered" / "decision intelligence platform" anywhere
- [ ] Em-dash count ≤ 1 per slide
- [ ] Margins claim reads "~90% blended" (NEVER 97%)
- [ ] Per-audit cost reads £0.30-0.50 (NEVER $0.03-0.07)
- [ ] Bias count reads 22 (DI-B-001 → DI-B-022); framework count reads 19; case library reads 143
- [ ] Methodology version on Brier reference reads 2.0.0-seed (if Brier referenced at all)
- [ ] "Mr. Reiner" never auto-corrected to Roy Reznik / Raynor
- [ ] Slide 10 dilution figure CONFIRMED with founder before locking
- [ ] Speaker notes per slide ≤ 25 seconds aloud (count words at ~150 wpm)
- [ ] Founder rehearsed Q&A backstop — all four answers verbatim from this brief

---

**End of brief. Hand this to a fresh Claude Code session. Ask it to produce `docs/pitch-deck-equitymatch-pre-seed.md` and (optionally) the Marp variant. The next session should NOT re-derive from CLAUDE.md — every locked vocabulary item, every honesty repair, every banned phrase is in this document.**
