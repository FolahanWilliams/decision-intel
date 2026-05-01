# Decision Intel — Current Product State (2026-05-01)

Canonical reference for what Decision Intel actually IS, what it DOES, and what's been shipped. Sources: CLAUDE.md + recent commit log. **Supersedes earlier product-overview docs in NotebookLM.**

## One-liner (re-locked 2026-04-26)

> **The native reasoning layer for every high-stakes call.**

Secondary (cold outreach + investor moments):

> **The reasoning layer the Fortune 500 needs before regulators start asking.**

## What it is

A decision intelligence audit platform for corporate strategy + corp dev + M&A teams. Users paste / upload / forward by email a strategic memo, IC memo, board deck, or market-entry recommendation. Within ~60 seconds, a 12-node LangGraph audit pipeline produces a Decision Quality Index (DQI), bias detection, noise judgment, and a Decision Provenance Record (DPR) PDF.

## Core flow (the only flow that matters for pilots)

1. **Upload** — drag-drop a file, paste text, forward via email, or connect Slack/Drive
2. **Analyze** — 12-node pipeline runs (~£0.30-0.50 cost per audit)
3. **Review** — read the audit on the document detail page
4. **Outcome** — log what actually happened (Outcome Gate enforced for design-partner orgs)

## What gets produced (the deliverable surface)

- **DQI score** 0-100 with grade A/B/C/D/F. Six weighted dimensions: evidence quality, bias load, process maturity, historical alignment, compliance risk, narrative coherence.
- **Bias detection** — 22 cognitive biases from a stable taxonomy (DI-B-001 through DI-B-022). Each flagged passage carries severity (low/medium/high/critical), confidence score, suggested fix, and verbatim excerpt.
- **Noise score** — three-frame jury (analyst-skeptical / regulator-hostile / contrarian-strategist) measures inter-rater variance. High variance = framing-sensitive quality.
- **Recognition-Rigor Framework (R²F) — the IP moat:**
  - **Validity Classification** (Kahneman & Klein 2009): high / medium / low / zero validity domain
  - **Reference Class Forecast** (Kahneman & Lovallo 2003): top-5 historical analogs from a 143-case library, base-rate failure prediction
  - **Feedback Adequacy** (Kahneman & Klein 2009): has the author had enough closed-loop feedback to be calibrated?
  - **Counterfactual Impact**: top-3 bias scenarios with expected DQI improvement + dollar anchor
  - **Org Calibration**: per-org Brier-scored recalibration over time
- **Decision Provenance Record (DPR)** — exportable PDF, hashed + tamper-evident (SHA-256 input hash + record fingerprint; private-key signing on Q3 2026 roadmap). Carries: cover with R²F signals, model lineage, judge variance, 19 regulatory framework mappings, reviewer-decisions / HITL log, data lifecycle footer with named sub-processors. Client-Safe Export Mode redacts entity names with `[ENTITY_N]` placeholders for sharing with LP / regulator / third-party assurance.
- **Predicted board questions** — 5-persona boardroom simulation (CEO / CFO / Skeptic / Champion / Compliance), each generates 3 questions they'd ask
- **Pre-mortem (Klein)** — prospective-hindsight projection: "the plan failed; here's the history of why" in past tense (25-30% more failure-cause insights vs conditional voice)
- **What-if simulator** — counterfactual ROI: "if you'd caught bias X, the DQI would be Y"
- **Decision Rooms** — collect blind independent priors from team before review
- **Decision Knowledge Graph** — every audited decision compounds; future audits cite past decisions
- **Decision DNA** — per-user calibration profile: most-triggered biases, belief delta over time, follow-success rate
- **Cross-document conflict detection** (deals only) — finds contradictions across CIM + IC memo + counsel memo + financial model
- **Bias Genome** — per-bias failure rates from 143 historical cases; cross-org cohort comparison
- **19 regulatory frameworks** mapped (EU AI Act / Basel III / GDPR Art 22 / SEC AI / NDPR / CBN / WAEMU / PoPIA / SARB / ISA Nigeria 2007 / + 9 others)

## Pricing (locked 2026-04-15)

- **Free** — 4 audits/mo
- **Individual £249/mo** — 15 audits, the GTM wedge tier
- **Strategy £2,499/mo** — fair-use 250 audits/mo + team
- **Enterprise** — custom (volume floor + overage)
- Per-audit cost: ~£0.30-0.50 (~17 LLM calls across 12 nodes)
- Blended margin: ~90% (NOT 97% — that was ghost-user math)
- Calibration baseline: Brier 0.258 over 143-case library (synthetic seed, methodology v2.0.0-seed)

## ICP — re-locked v3.3 (2026-05-01)

**GTM wedge (next 6 months):** Individual buyers @ £249/mo — UK + US

Personas:
- **CSOs at FTSE 250 / mid-market scale-ups** + S&P 500 sub-segments where the CSO has discretionary tooling spend
- **Heads of M&A / Corporate Development at scale-ups and PE-backed mid-market**
- **Heads of Strategic Planning** reporting up to a CSO
- **Independent fractional CSOs** running multi-client portfolios

Frictionless tier — personal-card / t-card budget, zero procurement gate. Optimises for word-of-mouth scale (Mr. Reiner principle: WoM is the only marketing channel that scales without paid acquisition). Conversion: 60-second audit + DPR specimen → self-serve sign-up to Individual tier.

**Graduation rule** (gates wedge → bridge transition): 5 paid Individual subscribers retained 90+ days + 10 raving advocates (anonymised specimen-DPR shares count; live-customer DPRs do NOT due to fund / corporate confidentiality) + 1+ verifiable referral or warm intro generated via DPR / advocacy.

**Pilot bridge (months 6-12):** Sankore (London office, summer 2026 target reference-grade pilot, in active scoping). Plus 1-2 Individual graduates converted to differentiated pilots. Design Foundation rate £1,999/mo for first 5 founding cohort customers, OR £20-25K founding-pilot bundle for 12-month commitment.

**Revenue ceiling (12-24+ months out):** Fortune 500 corporate strategy + corp dev M&A teams @ £50K-150K ACV — UK + US primary. Cross-border M&A leaders specifically — where the 19-framework regulatory map (Pan-African / EM coverage: NDPR / CBN / WAEMU / PoPIA / SARB / ISA Nigeria 2007) becomes a live moat layer Cloverpop and IBM watsonx.governance don't carry.

**Avoid:** boutique sell-side M&A advisors (no software budget) · generic small VC funds with no Africa/EM exposure · US-only Fortune 500 with zero international M&A exposure (Cloverpop + IBM watsonx will out-bundle us in their backyard).

## External attack vectors (locked 2026-04-26)

1. **Cloverpop's data advantage** — Cloverpop has years of structured enterprise decision data we don't have yet. If Clearbox licenses GPT-4o / Claude to run a Kahneman-style bias prompt over their existing repository, they instantly replicate "audit" capability backed by REAL historical data. **Defense:** Outcome Gate enforcement accelerates outcome-data accumulation; per-org Brier flywheel; 17-framework regulatory map.
2. **IBM watsonx.governance bundling** — IBM bundles a basic "Human Decision Provenance" module into watsonx.governance and F500 GCs check the EU AI Act Article 14 compliance box with IBM by August 2026 enforcement. **Defense:** Pan-African / EM-fund wedge bypasses (IBM doesn't sell into Pan-African corp dev with our depth); cross-border regulatory mapping IBM watsonx doesn't cover.
3. **Agentic shift** — Palantir / Databricks / Aera deploy autonomous agents that execute decisions directly, the volume of human-authored 40-page strategy memos plummets. **Defense:** the bias-detection IP applies to ANY structured artefact (IC memos, board decks, agent decision logs, agentic system prompts). Pivot to "audit layer for agents" if memo format declines faster than expected.

## Recent ships (April-May 2026)

- **Outcome Gate enforcement (Phase 1-3)** — Organization.enforceOutcomeGate flag + auto-draft prefill via PATCH /api/outcomes/draft
- **Sovereign-context overlay** — per-jurisdiction signals for Nigeria / Kenya / Egypt / South Africa cross-border deals
- **Decision Knowledge Graph share flow** — public token-gated viewer at /shared/graph/[token]
- **Decision DNA** — per-user calibration profile surfaced at /dashboard/decision-dna
- **Bias Genome contribution panel** — surfaces per-org distinct biases contributed
- **DPR v2 enhancements** — Reviewer Decisions / HITL log, Data Lifecycle footer, Client-Safe Export Mode
- **Kahneman-Klein 2009 paper-application sprint** — Validity Classifier + Reference Class Forecast + Feedback Adequacy + Inside-View Dominance bias (DI-B-022) + Illusion of Validity bias (DI-B-021); methodology version v2.1.0
- **3-frame noise jury** — analyst-skeptical / regulator-hostile / contrarian-strategist (vs prior single-prompt 3-call jury)
- **DPR DOCX redline-ready** — F500 GC redline workflows now supported
- **GTM v3.3 honesty repairs** — noise-jury reframe / Brier transparency / Sankore reframed as target / seed-fund list reframed as candidates / £100M arc kept inside Founder Hub only

## What's NOT shipped yet (current gaps)

- No paying customer
- No Sankore signed pilot (active scoping; summer 2026 target)
- No SOC 2 Type I (targeted Q4 2026; current posture: Vercel + Supabase Type II infrastructure)
- DPR private-key signing (roadmap; current is SHA-256 hashed + tamper-evident)
- Multi-region production (US only; EU as Enterprise-conversation residency, not production today)
- Cyber-liability + E&O insurance (Q1 2027 roadmap)

## Tech state (high-level)

- 200+ React components, 70+ API routes
- Next.js 16 App Router + React 19 + TypeScript 5.9 + Prisma 7.8 + Supabase Postgres
- LangGraph 12-node audit pipeline (gemini-3-flash-preview default + gemini-3.1-flash-lite cheap-tier + gemini-2.5-pro reserved for metaJudge)
- Anthropic Claude fallback (claude-sonnet-4-20250514) when AI_FALLBACK_ENABLED=true
- 22 biases · 19 regulatory frameworks · 143 historical cases · 12 pipeline nodes
- Per-audit cost ~£0.30-0.50; blended margin ~90%
- Hosted on Vercel + Supabase + Sentry + Stripe + Cloudflare DNS
