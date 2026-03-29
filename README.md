<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/LangGraph-1.1-FF6B35?style=for-the-badge" alt="LangGraph" />
  <img src="https://img.shields.io/badge/Prisma-7.5-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/D3.js-7-F9A03C?style=for-the-badge&logo=d3dotjs&logoColor=white" alt="D3.js" />
  <img src="https://img.shields.io/badge/Slack-Integration-4A154B?style=for-the-badge&logo=slack&logoColor=white" alt="Slack" />
</p>

# Decision Intelligence Platform

> **The Cognitive Bias Audit Engine for PE/VC Investment Committees.**
> Quantify decision noise. Eliminate cognitive bias. Protect fund returns.

[![CI/CD](https://github.com/FolahanWilliams/decision-intel/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/FolahanWilliams/decision-intel/actions/workflows/ci-cd.yml)

> **[Book a Demo](https://www.decision-intel.com/demo)** | **[Start Free Trial](https://www.decision-intel.com/login)** | **[View Pricing](#pricing)** | **[Case Studies](https://www.decision-intel.com/#case-studies)**

**[Live Demo](https://www.decision-intel.com/)** | **[Architecture](#architecture)** | **[Getting Started](#getting-started)** | **[Roadmap](#roadmap)**

---

## The Problem

PE/VC investment committees make $50M-$500M capital allocation decisions based on IC memos, CIMs, and pitch decks — documents riddled with cognitive biases that nobody systematically detects. Research by Daniel Kahneman (_Noise: A Flaw in Human Judgment_) reveals that **professionals evaluating identical information routinely reach wildly different conclusions** — a phenomenon called _decision noise_.

**The numbers are stark:**

- A single bad deal costs a fund **1-3x the ticket size** in opportunity cost
- IC members anchored to entry valuations hold losers 40% longer than optimal
- Competitive auctions trigger winner's curse in **65% of cases** (Malmendier & Tate, 2008)
- Confirmation bias in due diligence causes teams to **rubber-stamp rather than stress-test** investment theses

Most investment committees have no way to:

- **Detect** which biases are embedded in their IC memos and deal materials
- **Measure** how much noise exists across their investment decisions
- **Track** which biases actually correlated with poor IRR/MOIC outcomes
- **Build** institutional memory that makes the committee sharper with every deal

## The Solution

**Decision Intel** is an AI-powered cognitive auditing engine purpose-built for PE/VC investment committees. Upload an IC memo, CIM, pitch deck, or due diligence report and get a comprehensive bias audit in under 60 seconds — with **11 PE-specific biases** including anchoring to entry valuation, carry incentive distortion, and winner's curse.

The platform runs documents through a **16-agent analysis pipeline** with deal-stage-specific overlays (screening, due diligence, IC review, closing, portfolio, post-exit) to detect bias, measure noise, simulate IC deliberations, and generate actionable intelligence that protects fund returns. The engine combines **Kahneman-style debiasing** (noise measurement, bias detection, compound scoring) with **Klein's Recognition-Primed Decision framework** (pattern recognition cues, expert heuristics, narrative pre-mortems, mental simulation) — suppressing bias while amplifying expert intuition.

---

## Value Proposition

| For                    | Pain Point                                                       | What We Deliver                                                                          |
| :--------------------- | :--------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **Managing Partners**  | No systematic way to measure IC decision quality                 | Deal-level DQI scoring (0-100), bias pattern tracking across fund vintage                |
| **Deal Partners**      | IC memos anchored to entry thesis, not current fundamentals      | 11 PE-specific biases detected with exact excerpts and coaching suggestions              |
| **Operating Partners** | Post-acquisition execution plans tainted by operational optimism | Boardroom simulation with PE personas (GP, LP Rep, Risk Committee, Sector Expert)        |
| **LP Relations**       | Fund reports cherry-pick metrics and bury underperformers        | LP report analysis detecting survivorship bias, selective reporting, and framing effects |
| **IC Members**         | Groupthink and authority bias silence genuine debate             | Blind IC voting, noise measurement across committee members, dissent tracking            |

**ROI**: A single avoided bad deal saves **$50M-$500M** in capital. The platform pays for itself after one corrected thesis. Organizations using systematic decision hygiene report **up to 60% reduction in decision variance**.

---

## Pricing

| Plan | Price | Best For |
|:-----|:------|:---------|
| **Noise Audit** | Free | Try the bias engine on 3 documents |
| **Individual Partner** | $349/mo | Deal partners running IC memos through the gauntlet |
| **Fund** | $1,999/mo | Full IC team with deal pipeline + Slack integration |
| **Multi-Fund / Enterprise** | From $25K/yr | Multi-fund platforms with SSO + custom taxonomies |

All paid plans include a 14-day free trial. No credit card required to start.

**[View full pricing details](https://www.decision-intel.com/#pricing)**

---

## 30-Day Pilot Program

For qualified PE/VC funds ($100M+ AUM), we offer a guided pilot:

- **Guided onboarding** — we configure taxonomies, bias profiles, and noise benchmarks for your fund strategy
- **50 IC memo analyses** — run your actual memos through the 16-agent pipeline
- **Outcome tracking setup** — connect your deal pipeline so the system starts learning immediately
- **Calibration report** — at 30 days, receive a full report: bias patterns, noise levels, and ROI projections

**[Apply for a pilot](https://www.decision-intel.com/demo)**

---

## Features

### Core Analysis Pipeline

#### Cognitive Bias Detection

Scans documents for **20 distinct cognitive biases** with confidence scores, severity ratings, and exact excerpts:

| Category            | Biases Detected                                                                                                       |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------- |
| **Judgment**        | Confirmation Bias, Anchoring, Availability Heuristic, Framing Effect, Status Quo Bias, Halo Effect, Gambler's Fallacy |
| **Group Dynamics**  | Groupthink, Authority Bias, Bandwagon Effect                                                                          |
| **Overconfidence**  | Overconfidence Bias, Planning Fallacy, Hindsight Bias                                                                 |
| **Risk Assessment** | Loss Aversion, Sunk Cost Fallacy, Selective Perception                                                                |
| **Decision**        | Cognitive Misering, Zeigarnik Effect, Paradox of Choice                                                               |
| **Information**     | Recency Bias                                                                                                          |

Each bias finding includes a scientific explanation, real-world research citations, and **coaching-mode suggestions** for mitigation.

#### Decision Noise Measurement

Implements Kahneman's noise audit methodology using a **Statistical Jury** — three independent AI judges score the same document, and the platform measures:

- **Mean quality score** (0-100)
- **Standard deviation** across judges
- **Variance analysis** with internal vs. market benchmarks
- **Noise category** classification (low/moderate/high/critical)

#### Financial Fact-Checking

Cross-references claims against real-time data sources:

- **Finnhub API** — Stock prices, company metrics, financial statements
- **Google Search Grounding** — Real-time web verification
- **Verdict system** — VERIFIED / CONTRADICTED / UNVERIFIABLE with source attribution
- **Trust score** (0-100%) based on data alignment

#### Compliance Mapping

Automated regulatory alignment checking:

- **FCA Consumer Duty** — Products, price, support, understanding outcomes with framework-specific scoring
- **SOX Compliance** — Sarbanes-Oxley internal controls assessment
- **Basel III** — Banking regulatory capital and risk requirements
- **EU AI Act** — Automated decision risk assessment and transparency requirements
- **SEC disclosure** requirements
- **GDPR readiness** — Automated PII anonymization before analysis
- **Remediation Plans** — Auto-generated remediation steps for failing assessments
- Status output: **PASS / WARN / FAIL** with specific recommendations

#### Pre-Mortem Analysis

Generates failure scenarios _before_ decisions are made:

- Top failure modes with probability estimates
- Preventive measures for each scenario
- Cascading risk identification

#### Klein RPD Framework (Expert Intuition Amplification)

Complements Kahneman-style debiasing with Gary Klein's Recognition-Primed Decision framework — amplifying expert intuition rather than just suppressing bias:

- **Recognition Cues** — Surfaces 3-5 historical deal pattern matches from the knowledge graph with similarity scores and outcome data
- **Expert Heuristics** — AI-generated insights on what an experienced decision-maker with 10+ similar exits would notice
- **Narrative Pre-Mortems** — Vivid "war story" failure scenarios based on historical analogs (supplements bullet-list pre-mortems)
- **RPD Mental Simulator** — Single-option mental simulation where users pick one action and AI simulates outcomes using historical data
- **Personal Calibration Dashboard** — Per-user dashboard at `/calibration` showing decision patterns, recurring biases, calibration score, blind spots, and strength patterns

#### Advanced Analysis Suite

- **Logical Fallacy Detection** — Identifies flawed reasoning patterns
- **SWOT Analysis** — Structured strengths/weaknesses/opportunities/threats
- **Cognitive Blind Spots** — Red-team counter-arguments with verified sources
- **Sentiment Analysis** — Emotional tone scoring across document sections

### Proprietary Scoring & Intelligence Engine

The platform's core differentiator: a deterministic, mathematically rigorous scoring layer that runs **after** LLM analysis. Competitors can call the same LLMs — they cannot replicate the scoring math, the ontology, or the 113-case statistical database.

#### Decision Quality Index (DQI)

A branded **0-100 composite score** (like FICO for decisions) with letter grades (A-F) computed from 5 weighted dimensions:

| Component            | Weight | Measures                                                 |
| :------------------- | :----- | :------------------------------------------------------- |
| **Bias Load**        | 30%    | Severity-weighted bias count vs. document complexity     |
| **Noise Level**      | 20%    | Inter-judge variance from triple-judge noise measurement |
| **Evidence Quality** | 20%    | Fact-check verification rate and source reliability      |
| **Process Maturity** | 15%    | Prior submitted, outcomes tracked, dissent present       |
| **Compliance Risk**  | 15%    | Regulatory framework violation score                     |

Grades: **A** (85-100), **B** (70-84), **C** (55-69), **D** (40-54), **F** (0-39). Surfaced as an SVG badge on every analysis with component breakdown and top improvement recommendation.

#### Compound Scoring Engine

Deterministic post-LLM scoring that transforms raw bias detections into calibrated, context-adjusted risk scores:

- **20x20 Interaction Matrix** — 400 empirically-grounded pairwise interaction weights between all cognitive biases (e.g., confirmation_bias + groupthink = 1.35x amplification)
- **Context Multipliers** — Monetary stakes (1.0-1.6x), absent dissent (+0.25), time pressure (+0.15), group size effects
- **Detectability Weighting** — Hard-to-detect biases (low detectability in the ontology) get 3-8% severity boost when found at high confidence — finding them is more meaningful
- **Historical Correlation** — Cross-references detected bias combinations against the 113-case failure database to compute empirical amplification ratios
- **Confidence Decay** — Sigmoid temporal decay (documents older than 6 months get progressively reduced confidence)
- **Org Calibration** — Per-organization learned weights that adjust severity based on historical outcomes

#### Bayesian Prior Integration

When users submit a **Decision Prior** (pre-analysis belief and confidence), the platform applies formal Bayesian updating:

- **Posterior Confidence** — Research-backed base rates (per bias) combined with LLM detection to produce calibrated posterior probabilities
- **Belief Delta** — Measures how much the analysis should shift the decision-maker's position
- **Information Gain** — KL divergence quantifying the new information in the analysis vs. the prior
- **Per-Bias Adjustment** — Each detected bias gets individual prior/posterior confidence with direction (increased/decreased/unchanged) and reasoning

#### Toxic Combination Detection

Inspired by **Wiz's cloud security graph** — detects when multiple individually-benign biases co-occur with contextual risk factors to create compound decision risk. Surfaces only the **top ~5% of risky decisions**, eliminating alert fatigue:

- **7 Named Patterns**: Echo Chamber, Sunk Ship, Blind Sprint, Yes Committee, Optimism Trap, Status Quo Lock, Recency Spiral
- **Context Amplifiers**: Monetary stakes, absent dissent, time pressure, unanimous consensus, small group size
- **Historical Failure Rates**: Each pattern linked to real-world failure cases with documented outcomes
- **Org Calibration**: Pattern thresholds and severity weights adjust from your organization's actual decision outcomes
- **Actionable Workflow**: Acknowledge, investigate, or mitigate detected patterns with audit trail

#### Bias Interaction Ontology

A proprietary **directed graph** encoding empirically-grounded relationships between cognitive biases:

- **5 Interaction Types**: amplifies, enables, masks, correlates, mitigates — each with weight (0.0-2.0) and academic citation
- **Dual-Process Framework**: Every bias tagged as System 1 (fast/intuitive), System 2 (slow/deliberate), or both (Kahneman)
- **Research-Backed Metadata**: Per-bias prevalence (base rate in organizations: 0.60-0.85), detectability (how hard to find: 0.20-0.55), and cognitive category
- **5 Industry Profiles**: Financial services, healthcare, legal, technology, energy — each with industry-specific additional biases and risk multipliers

#### Cross-Case Correlation Engine

**113 annotated real-world decision failures** sourced from SEC filings, NTSB reports, GAO audits, FDA actions, FCA enforcement, and academic case studies — spanning 8 industries:

| Industry           | Cases | Avg Impact | Catastrophic Rate |
| :----------------- | :---- | :--------- | :---------------- |
| Aerospace          | 9     | 91.1       | 89%               |
| Energy             | 11    | 90.3       | 100%              |
| Government         | 13    | 88.7       | 69%               |
| Automotive         | 7     | 87.3       | 71%               |
| Financial Services | 28    | 85.2       | 79%               |
| Healthcare         | 11    | 84.4       | 73%               |
| Technology         | 23    | 77.3       | 70%               |
| Retail             | 11    | 73.4       | 73%               |

The engine computes:

- **Bias Co-Occurrence Matrix** — Which bias pairs amplify each other (e.g., loss_aversion + planning_fallacy = 1.2x amplification)
- **Industry Risk Profiles** — Per-industry top biases, dominant toxic patterns, context factor distributions
- **Temporal Patterns** — Detection lag shrinking from 43.5 years (1970s) to 0.2 years (2020s)
- **Severity Predictors** — Factors most predictive of catastrophic outcomes, ranked by statistical lift
- **Context Amplifiers** — Which conditions worsen failure severity (very_high_stakes = 1.12x lift)

These correlations feed directly into the compound scoring engine via `computeCorrelationMultiplier()`, giving every analysis the benefit of 113 documented failures.

### Boardroom Simulation (Decision Twin)

A unique **decision simulation engine** that creates virtual boardroom personas and simulates how each would vote on the document's proposals. For PE/VC documents, auto-selects **5 IC-specific personas**: Managing Partner (GP/carry incentive), Operating Partner (execution feasibility), LP Advisory Rep (capital preservation), Sector Specialist (market dynamics), and Risk Committee Chair (tail risk analysis). Produces:

- Individual persona votes (APPROVE / REJECT / ABSTAIN) with reasoning
- Consensus analysis and coalition mapping
- Dissent patterns and minority concerns
- **Custom Personas** — Create fund-specific boardroom personas with configurable risk tolerance, focus areas, and values
- **Causal Intelligence Integration** — Personas are briefed on which biases have historically damaged this org's deals
- **Twin Effectiveness Report** — Tracks which personas' dissent actually correlated with poor outcomes. Shows per-twin dissent accuracy rate, belief delta, and auto-generated narratives (e.g., "The Operational Expert dissented 12 times. 9 of those decisions later failed — 75% accuracy. Trust their warnings.")

### Multi-Touch Decision Attribution

When an outcome is reported, the platform traces backward through the decision knowledge graph to identify which prior analyses influenced the result:

- **BFS Path Tracing** — Walks backward through `influenced_by`, `escalated_from`, `shared_bias`, and `depends_on` edges up to 5 hops
- **Linear Decay Weighting** — Closer decisions get more attribution credit; contribution normalized to 100%
- **Attribution Snapshots** — Persisted in `DecisionAttribution` table for dashboard display
- **Auto-Triggered** — Computed fire-and-forget whenever an outcome is saved
- **API** — `GET /api/decision-graph/attribution?analysisId=xxx` returns enriched paths with source filenames and bias types

### Committee Decision Rooms

Purpose-built for investment committees, board reviews, deal committees, and risk committees:

- **Decision Room Types** — `investment_committee`, `board_review`, `deal_committee`, `risk_committee`, `general`
- **Blind Prior Collection** — Committee members submit independent assessments before group discussion begins (prevents anchoring and groupthink)
- **Consensus Scoring** — When a room is closed, computes consensus strength (0-100) from blind prior convergence, identifies dissenters, and classifies agreement level (strong/moderate/weak/divided)
- **Pre-Meeting Bias Briefing** — Auto-generated from linked analysis: shows top biases, toxic combinations, historical failure rate for similar decisions, and a pre-meeting checklist (assign dissenter, run pre-mortem, review base rates, confirm criteria, collect blind priors)
- **Committee Prior Gap Nudge** — The nudge engine detects when not all committee members have submitted priors and generates "X of Y members haven't submitted" alerts

### Calibration Gamification

Replaces the punitive outcome gate with encouraging progress visualization:

- **Calibration Levels** — Bronze (0-4 outcomes), Silver (5-14, >50% accuracy), Gold (15-29, >60%), Platinum (30+, >70%)
- **Progress Bar** — Visual progress toward next level with "X more outcomes to unlock Gold"
- **Stats Grid** — Outcomes reported, decision accuracy rate, bias detection accuracy
- **Milestone Tracking** — Records calibration milestones (5, 10, 15, 25, 50 outcomes) with accuracy deltas
- **Positive Messaging** — "Each outcome makes your AI smarter" replaces "You must report outcomes"

### Causal AI Layer

Organization-specific **Structural Causal Models (SCM)** that learn which biases actually cause poor outcomes in _your_ organization:

- **Constraint-Based Causal Discovery (PC Algorithm)** — Builds directed acyclic graphs from outcome data using conditional independence tests (chi-squared with Yates' correction). Minimum 20 outcomes to construct a DAG; 50+ for high-confidence causal claims
- **Do-Calculus Interventional Queries** — Pearl-style backdoor adjustment answers "What would happen if we removed confirmation bias?" using `P(Y | do(X)) = Σ_Z P(Y | X, Z) P(Z)` with stratified confounder adjustment
- **Danger Multipliers** — Organization-specific learned weights that amplify bias severity based on historical impact
- **Correlation Fallback** — For organizations with <20 outcomes, gracefully falls back to correlation-based causal weights while building toward full SCM
- **Biological/Physiological Signal Detection** — Winner Effect (success-streak language amplifies overconfidence-family biases ×1.2) and Cortisol/Stress signals (crisis language amplifies System 1 biases ×1.18) detected via NLP pattern matching on document content
- **System 1 vs System 2 Ratio Scoring** — DQI process maturity component penalizes heuristic-dominant decisions (>70% System 1 biases) and rewards deliberative processes

### PE/VC Investment Vertical

Purpose-built cognitive auditing for private equity and venture capital investment committees:

#### Deal Pipeline & Document Intelligence

- **Deal Model** — Full deal lifecycle tracking: screening, due diligence, IC review, closing, portfolio management, and post-exit retrospectives
- **Document Type Classification** — IC memos, CIMs, pitch decks, term sheets, due diligence reports, and LP reports each get specialized bias detection overlays
- **Deal Outcome Tracking** — Record IRR, MOIC, exit type, hold period, and exit value per deal. Feeds the causal learning flywheel to identify which biases correlate with poor returns
- **Deal APIs** — Full CRUD for deals and deal outcomes with Zod validation and org-scoped access control

#### 11 PE-Specific Cognitive Biases

Beyond the standard 20 biases, the investment vertical detects:

1. **Anchoring to Entry Price** — Decisions anchored to original thesis rather than current fundamentals
2. **Confirmation Bias in Thesis Validation** — Selectively seeking evidence confirming the investment thesis
3. **Sunk Cost in Portfolio Holds** — Follow-on decisions driven by amount already invested
4. **Survivorship Bias** — Comparing only to successful exits, ignoring base rate failures
5. **Herd Behavior** — Following peer fund positioning without independent analysis
6. **Disposition Effect** — Exiting winners too early, holding losers too long
7. **Overconfidence in Projections** — Hockey-stick growth without comparable evidence
8. **Narrative Fallacy** — Founder story overriding quantitative analysis
9. **Winner's Curse** — Auction dynamics driving bids above intrinsic value
10. **Management Halo Effect** — "World-class team" justifying stretched valuations
11. **Carry Incentive Distortion** — Pressure to deploy capital influencing deal selection

#### Deal-Stage-Specific Analysis

Each deal stage triggers specialized bias overlays:

- **Screening** — First impression bias, thesis anchoring, availability heuristic
- **Due Diligence** — Confirmation bias in DD findings, sunk cost momentum, vendor DD bias
- **IC Review** — Groupthink, authority bias, social pressure, presentation bias
- **Closing** — Winner's curse, escalation of commitment, anchoring to signed terms
- **Portfolio** — Sunk cost fallacy, disposition effect, status quo bias
- **Post-Exit** — Hindsight bias, outcome bias, survivorship bias, attribution error

### Outcomes-First Workflow (Decision Framing)

Captures decision context _before_ document upload to prevent biases from influencing interpretation:

- **Decision Frames** — Define decision statement, default action, success/failure criteria, and stakeholders upfront
- **Decision Priors (Structured RLHF)** — Records the decision-maker's pre-analysis belief and confidence level
- **Belief Delta Tracking** — Measures how much the analysis shifted the decision-maker's position

### Autonomous Outcome Detection Engine

Three autonomous channels detect decision outcomes without manual reporting — the key friction point that breaks feedback loops in competing platforms:

| Channel              | Source                                  | How It Works                                                                                                                                                  | Confidence Threshold |
| :------------------- | :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------- |
| **Document Upload**  | New documents in same org               | RAG embeddings match new docs to prior pending decisions (>0.70 cosine similarity), then LLM compares against DecisionFrame success/failure criteria          | 0.70                 |
| **Slack Messages**   | Outcome language in decision channels   | Pattern detection for success/failure/mixed signals (e.g., "exceeded expectations", "pulled the plug", "mixed results"), with LLM refinement against criteria | 0.60                 |
| **Web Intelligence** | Daily cron with Google Search grounding | For decisions involving named entities, searches for public outcome signals in news articles. Rate-limited to 10 searches/day                                 | 0.80                 |

All detections create **DraftOutcomes** requiring one-click user confirmation — never auto-submits to the calibration engine. This preserves data quality while eliminating the friction that prevents users from closing the feedback loop.

- **Dashboard Banner** — Expandable notification showing pending draft outcomes with evidence quotes
- **Document Detail Card** — Inline outcome card on each analysis with confirm/dismiss actions
- **Graceful Degradation** — Each channel is independent; if Slack isn't connected or web search is disabled, the others still work

### Behavioral Data Flywheel

A continuous improvement loop that makes the platform smarter over time:

- **Autonomous Outcome Detection** — Three channels (documents, Slack, web) auto-detect outcomes; one-click confirmation feeds the calibration engine
- **Manual Outcome Tracking** — Fallback manual reporting at configurable intervals (30/60/90 days, 6 months, 1 year)
- **Calibration Profiles** — Per-organization learned weights for bias severity, nudge thresholds, and twin accuracy
- **Nudge Effectiveness** — Tracks which coaching interventions actually improved decisions
- **Weekly Recalibration** — Automated cron job recalibrates models based on accumulated outcome data

### Shareable Analysis Links

Password-protected, expiring links for sharing analyses with external stakeholders:

- **Token-based URLs** — `/shared/[token]` for secure external access
- **Password Protection** — Optional password gate on shared links
- **Access Audit Trail** — View count, last viewed, IP address and user-agent logging
- **Revocable** — Revoke access at any time

### Slack Integration

Enterprise-grade Slack integration for real-time decision intelligence — a cognitive coach embedded where decisions actually happen:

#### Core Capabilities

- **OAuth Installation** — Full Slack OAuth flow with encrypted bot token storage (AES-256-GCM), multi-tenant workspace support
- **Decision Detection** — Automatically identifies decisions being made in Slack channels using pattern-matched decision signals (approve, reject, escalate, override, etc.)
- **Pre-Decision Coaching** — Detects deliberation threads ("should we", "thinking about", "considering") and delivers cognitive nudges _before_ the vote
- **Outcome Detection** — Recognizes outcome language in decision channels and creates draft outcomes for one-click confirmation
- **Real-Time Nudges** — Delivers cognitive bias alerts directly in Slack when decisions are detected, with "Helpful" / "Not relevant" feedback buttons that calibrate future nudges

#### Org-Calibrated Nudge Messages

Nudges aren't generic — they're enriched with your organization's actual bias history from outcome data:

- **Before**: "This thread shows anchoring signals."
- **After**: "You mentioned 'initial offer' — Anchoring bias detected. In your org, this bias was confirmed 73% of the time and correlated with 2.1x higher failure rate. What would a fair assessment look like if you hadn't seen the initial number?"
- Falls back to static coaching templates when no org calibration data is available

#### Thread-Aware Bias Accumulation

Each message in a deliberation thread is analyzed for new biases, and only novel biases trigger nudges:

- If message 1 triggers an anchoring nudge and message 2 contains groupthink language, only the groupthink nudge fires — no repeat anchoring alerts
- All detected biases across the thread are accumulated on the `DecisionFrame` record for a complete view of the deliberation's cognitive landscape
- Nudge severity escalates automatically as new biases compound

#### Decision Commitment Detection + Audit Summary Card

When a tracked deliberation thread resolves to a commitment ("let's approve it", "we've decided"), the platform:

1. Creates a `HumanDecision` record linked to the pre-decision context
2. Runs a full cognitive audit via the 16-agent pipeline
3. Posts a rich Block Kit summary card to the Slack thread with:
   - Decision Quality Score (color-coded gauge)
   - Noise Score and bias count
   - Top 3 detected biases with severity indicators
   - One-line summary
   - "View Full Analysis" button linking to the web dashboard

#### Slash Commands (`/di`)

| Command                       | Description                                                                |
| :---------------------------- | :------------------------------------------------------------------------- |
| `/di analyze`                 | Audit the most recent decision in the current channel — posts summary card |
| `/di prior 75% approve`       | Submit your blind prior for the active decision room                       |
| `/di outcome success [notes]` | Report outcome (success, partial_success, failure, too_early)              |
| `/di status`                  | Show calibration level, pending outcomes, and recent decision scores       |
| `/di help`                    | Show all available commands                                                |
| `/outcome [result]`           | Legacy command — backwards compatible                                      |

#### App Home Dashboard

Click the Decision Intel bot in the Slack sidebar to see a live dashboard:

- **Calibration Level** — Bronze/Silver/Gold/Platinum badge based on outcomes reported + accuracy
- **Pending Outcomes** — Count of decisions awaiting outcome reports
- **Recent Decisions** — Last 5 decisions with quality scores
- **Top Decision Twins** — Persona dissent accuracy from twin effectiveness tracking
- **Open Dashboard** button — Direct link to the web app

#### Interactive Feedback Loop

- Nudge buttons (Helpful / Not relevant) update `Nudge.wasHelpful` and trigger graph edge weight adjustments
- Outcome reports via `/di outcome` feed the calibration engine
- Prior submissions via `/di prior` populate Decision Rooms with blind independent assessments

Configure Slack in **Settings → Integrations** with the step-by-step setup guide, connection status indicators, and available slash commands documentation.

### Public API (v1)

RESTful API for programmatic access to the platform:

- **API Key Management** — Create, rotate, and revoke API keys with granular scopes (`analyze`, `documents`, `outcomes`, `insights`)
- **Rate Limiting** — Per-key rate limits (default 100 req/hour)
- **Endpoints** — `/api/v1/analyze`, `/api/v1/documents`, `/api/v1/insights`
- **Usage Tracking** — API call logging with endpoint, method, status code, and response time

### Team Collaboration

Multi-tenant organization support with role-based access:

- **Organizations** — Create teams with slug-based routing
- **Member Management** — Invite members via email with role assignment (admin/member)
- **Team Cognitive Profiles** — Aggregated decision quality metrics across the organization (average quality, noise, top biases)
- **Team Activity Stream** — Organization-scoped activity feed
- **Invitation System** — Token-based invites with expiration

### Batch Upload

Upload and analyze multiple documents simultaneously:

- **Multi-File Upload** — Up to 10 files per batch (10MB each)
- **Job Tracking** — Progress tracking with completed/failed counts per batch
- **Spreadsheet Support** — Extended file format support

### Web Intelligence Layer

Real-time intelligence enrichment from external sources:

- **News & Signals** — 14 RSS feeds across psychology, business, regulatory, industry, and academic sources (HBR, McKinsey, MIT Sloan, SEC EDGAR, FCA, Reuters, BBC Business, SSRN, and more)
- **Research Papers** — Semantic Scholar integration for academic research matching
- **Case Studies** — 113 annotated historical decision failures across 8 industries (Lehman Brothers, Boeing 737 MAX, Fukushima, VW Dieselgate, etc.) matched by bias type, toxic pattern, and industry
- **Macro Context** — FRED economic indicators for market backdrop
- **Intelligence Hub** — Dedicated dashboard page with filterable news grid, research counts, and freshness monitoring

### Decision Replay & Counterfactual Analysis

Step through your analysis like a debugger steps through code. The **Replay** tab decomposes the 16-agent pipeline into a visual timeline, showing exactly how each stage influenced the final score:

- **Score Waterfall** — Horizontal bar chart showing score progression from 100 → final through each analysis stage
- **Step-by-Step Replay** — Expandable cards for each pipeline stage: Document Intelligence → Bias Detection → Noise Analysis → Fact Check → Deep Analysis → Boardroom → Final Score
- **"What-If" Counterfactual Panel** — Click "What if…?" on any step to test scenarios:
  - Remove individual biases and see projected score recovery
  - Override noise score (perfect consistency vs. doubled noise)
  - Toggle fact-check results (all verified vs. all contradicted)
  - Client-side scoring engine calculates projections instantly — no API calls

### Bias Education Library

A comprehensive learning resource for all 20 cognitive biases, accessible at `/dashboard/bias-library`:

- **20 Rich Education Cards** — Each bias includes a real-world business case study (Kodak, Bay of Pigs, Theranos, Concorde, etc.), 3 actionable debiasing techniques, academic references, difficulty rating, and related biases. Includes 4 newly-added biases: Halo Effect, Gambler's Fallacy, Zeigarnik Effect, and Paradox of Choice
- **"Your Detected Biases" Banner** — Aggregates bias detections across all your documents, showing which biases appear most in your decision-making
- **Search & Filter** — Filter by category (Judgment, Group Dynamics, Overconfidence, Risk Assessment, Information) or search by name
- **Integrated Learning** — The BiasDetailModal on document pages now includes a "Learn & Debias" section with real-world examples and debiasing techniques inline

### Second Brain Chat (RAG-Powered)

An intelligent conversational interface at `/dashboard/chat` that uses semantic search to answer questions grounded in your analyzed documents:

- **AI Follow-Up Suggestions** — After each response, the AI generates 2-3 contextual follow-up questions as clickable pills
- **Message Actions** — Hover over any message to copy, bookmark, or retry responses
- **Enhanced Source Attribution** — Expandable source cards showing document name, relevance bar (% match), and decision quality score badge
- **Contextual Empty State** — Time-of-day greeting, document chips for your analyzed files, and contextual starter questions
- **Session Management** — Auto-saved conversations with history browser, document pinning for scoped Q&A, and session import/export

### Unified Activity Feed

A chronological timeline on the dashboard that aggregates all platform activity:

- **Multi-Source Aggregation** — Combines uploads, analysis completions/failures, nudges, and outcome reports into a single feed
- **Filter Chips** — Filter by activity type (All, Uploads, Analyses, Nudges, Outcomes)
- **Cursor Pagination** — Load more events without page reloads
- **Color-Coded Icons** — Each activity type has a distinct icon and color for quick scanning
- **Auto-Refresh** — Feed refreshes every 30 seconds via SWR

### Command Palette

A VS Code-style command palette (`Cmd+K` / `Ctrl+K`) with intelligent search:

- **Grouped Commands** — Recent Documents (last 5, with score badges), Navigation (12 pages), Actions (upload, new chat, shortcuts)
- **Prefix Search** — Type `>` for actions only, `/` for pages only, `@` to search documents by filename
- **Score Indicators** — Recent documents show analysis status icons and score badges
- **Alternative Shortcut** — `Ctrl+Shift+P` opens in action mode (like VS Code)

### Reporting & Export

- **4-Format Export** — PDF, CSV, Markdown, and JSON export from a unified "Share & Export" modal
- **Markdown Reports** — Full analysis with tables, blockquotes, and sections for documentation workflows
- **JSON Export** — Clean, structured data for API integrations and programmatic analysis
- **Quick Share** — Copy executive summary to clipboard, export as Markdown, or open in email client with pre-filled subject and body
- **Audit Trail** — Complete logging of all user actions for compliance
- **Comparative Analysis** — Cross-document trend analysis and benchmarking

### Decision Knowledge Graph

An organizational memory system that maps relationships between decisions, outcomes, people, and biases. Inspired by Wiz's Security Graph for cloud infrastructure, this graph maps decision dependency chains to find failure cascades and compounding organizational risk. **The longer a company uses it, the harder it is to leave** — the graph's value compounds with every decision added.

#### Interactive Visualization

- **D3 Force-Directed Graph** — 5 node types (analysis, human_decision, person, bias_pattern, outcome) with 7 edge types
- **Temporal Playback** — Timeline slider to animate graph evolution week-by-week
- **Path Finding** — BFS/Dijkstra algorithms to trace causal chains between decisions
- **Cluster Drill-Down** — Isolate connected components with failure rates, shared biases, participant overlap
- **Graph Search** — Find nodes by name, type, or pattern with auto-highlight
- **Minimap** — Canvas overview showing viewport position in large graphs
- **Graph Export** — PNG (2x retina), SVG, Graphviz DOT format download
- **Keyboard Navigation** — Arrow keys, Escape, +/- zoom, F fit, / search

#### Intelligence Engine

- **Auto-Inferred Edges** — Shared biases, semantic similarity (via RAG), participant overlap, outcome cascades, temporal sequences, reversals, and **cross-department/cross-silo** edges detected automatically
- **PageRank Centrality** — Iterative power method identifies most influential decision nodes
- **Graph Anti-Pattern Detection** — Echo chamber clusters, cascade failures, bias concentration, isolated high-risk decisions, **knowledge fragmentation** across organizational silos
- **Cascade Risk Scoring** — Multi-factor cluster-level failure risk for pending decisions with **quality escalation chain detection** (degrading score sequences across influenced_by edges)
- **Granger-Causal Temporal Edges** — Temporal edges validated via conditional correlation testing (score correlation + shared bias overlap + temporal proximity) rather than simple time-window heuristics
- **Entity Disambiguation** — Canonical resolution for participant names (Levenshtein + nickname mappings)
- **Predictive Toxicity Alerts** — Organization risk state with trend detection (improving/stable/worsening)

#### Self-Improving Flywheel

- **Outcome-Driven Edge Learning** — Edge strength/confidence adjusts automatically when outcomes are reported
- **Nudge Feedback Loop** — Helpful nudge responses reinforce graph patterns, unhelpful responses weaken them
- **Outcome Contradiction Detection** — Flags biases that contradicted actual outcomes
- **Root Cause Attribution** — Links specific biases to outcomes via CausalEdge data and graph topology

#### Advanced Search & Recommendations

- **Graph-Guided RAG** — Re-ranks semantic search results by graph distance and outcome weighting
- **Decision Recommendations** — "Similar decisions that succeeded avoided these biases"
- **Ensemble Retrieval** — Reciprocal rank fusion combining semantic, graph distance, and bias pattern matching
- **Pre-Decision Context** — Proactive risk signals and related decisions during decision capture

#### Reporting & Cross-Org Intelligence

- **Graph Network Analysis Report** — SNA metrics (density, clustering coefficient, avg path length) with AI-generated executive narrative
- **Temporal Anomaly Alerts** — Z-score based alerts for fragmentation, centralization, bias surges
- **Cross-Org Federated Learning** — Anonymized toxic pattern sharing across consenting organizations
- **Org Benchmarking** — Decision quality, success rate, and graph connectivity compared against peer data
- **Decision Lineage Export** — Compliance-ready audit trails with full provenance chains (JSON + CSV)

#### API Endpoints

| Endpoint                              | Method            | Description                                               |
| :------------------------------------ | :---------------- | :-------------------------------------------------------- |
| `/api/decision-graph`                 | GET               | Full graph (nodes, edges, clusters, stats, anti-patterns) |
| `/api/decision-graph/edges`           | POST/PATCH/DELETE | Create, update, or remove edges                           |
| `/api/decision-graph/stats`           | GET               | Lightweight graph statistics                              |
| `/api/decision-graph/trends`          | GET               | Weekly edge growth with anomaly detection                 |
| `/api/decision-graph/risk-state`      | GET               | Organization risk level with factors                      |
| `/api/decision-graph/root-cause`      | GET               | Bias-to-outcome attribution                               |
| `/api/decision-graph/recommendations` | GET               | Graph-powered decision recommendations                    |
| `/api/decision-graph/context`         | GET               | Pre-decision intelligence context                         |
| `/api/decision-graph/report`          | GET               | Full SNA report with AI narrative                         |
| `/api/decision-graph/lineage`         | GET               | Compliance audit trail export                             |
| `/api/decision-graph/benchmarks`      | GET               | Org performance benchmarks                                |
| `/api/decision-graph/attribution`     | GET               | Multi-touch decision attribution paths                    |

### Meeting Command Center

A live monitoring dashboard for ongoing meetings at `/meetings/command-center`:

- **Speaker Bias Profiles** — Aggregated bias tendencies per speaker across meetings
- **Meeting Health Metrics** — Participation balance, dissent health, decision clarity scoring
- **Quality Prediction** — Predicts meeting outcome quality based on real-time patterns
- **Similar Meeting Matching** — Surfaces past meetings with similar topics and their outcomes

### Human Decision Cognitive Audit

A parallel analysis product that audits spoken and written decisions from multiple channels:

- **Multi-Channel Ingestion** — Manual submission, email, Slack messages, and meeting transcripts
- **Cognitive Audit Pipeline** — Runs the same AI analysis (bias detection, noise, sentiment, SWOT, compliance) on human decisions
- **Nudge Engine** — Behavioral coaching alerts triggered by detected biases with severity levels
- **Effectiveness Tracking** — Measures whether nudges improved subsequent decisions

### Analysis Versioning & Observability

- **Analysis Versions** — Full snapshot history of every analysis version with score deltas
- **Prompt Versioning** — Tracks LLM prompts with SHA-256 hashing for drift detection
- **Failed Analysis Recovery** — Automatic retry queue with configurable max retries and exponential backoff
- **Error Dashboard** — Admin error tracking and retry management

### Privacy & Security

- **GDPR Anonymization** — PII is stripped _before_ any AI analysis (names, emails, companies replaced with tokens)
- **Supabase Authentication** — Enterprise-ready auth with protected routes
- **Rate Limiting** — 5 documents/hour per user (Postgres-based, no Redis dependency)
- **Audit Logging** — Every action recorded for compliance and forensics
- **Encrypted Secrets** — AES-256-GCM encryption for integration tokens (Slack bot tokens)
- **CSRF Protection** — Token-based CSRF prevention
- **API Key Authentication** — Scoped API keys with bcrypt hashing for programmatic access

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js 16 App Router)              │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │Documents │  │Intelligence│  │Second    │  │Settings │ │
│  │  Upload  │  │ Detail   │  │    Hub     │  │ Brain    │  │  Auth   │ │
│  │  Feed    │  │ 10 Tabs   │  │Bias Library│  │  Chat    │  │  GDPR   │ │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘  └────┬─────┘  └────┬────┘ │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐               │
│  │  Team    │  │ Meeting  │  │ Cognitive  │  │ Shared   │               │
│  │ Collab   │  │ Command  │  │  Audits    │  │  Links   │               │
│  │ & Orgs   │  │ Center   │  │ & Nudges   │  │ (Ext.)   │               │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘  └────┬─────┘               │
│       │              │              │               │              │     │
│  ─────┴──────────────┴──────────────┴───────────────┴──────────────┴──── │
│                          SSE Streaming / REST API                        │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────────┐
│                         API LAYER (Route Handlers)                       │
│                                                                         │
│  /upload  /analyze/stream  /documents  /intelligence  /search  /audit   │
│  /activity-feed  /chat  /trends  /stats  /cron/sync  /health           │
│  /v1/analyze  /v1/documents  /v1/insights  /v1/keys                    │
│  /human-decisions  /decision-frames  /decision-priors  /learning       │
│  /decision-graph  /decision-graph/edges  /decision-graph/report        │
│  /team  /integrations/slack  /upload/bulk  /personas  /outcomes        │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────────┐
│                    LangGraph Multi-Agent Pipeline                        │
│                                                                         │
│  ┌─────────────────── PREPROCESSING (Sequential) ───────────────────┐   │
│  │  [GDPR Anonymizer] ──→ [Data Structurer]                        │   │
│  └──────────────────────────────┬───────────────────────────────────┘   │
│                                 │                                       │
│  ┌─────────────────── ANALYSIS (Parallel) ──────────────────────────┐   │
│  │  [Bias Detective]     [Noise Judge x3]    [Fact Checker]         │   │
│  │  [Pre-Mortem]         [Compliance]        [Sentiment]            │   │
│  │  [Intelligence]       [Deep Analysis]     [Verification]         │   │
│  │  [RPD Recognition]                                               │   │
│  └──────────────────────────────┬───────────────────────────────────┘   │
│                                 │                                       │
│  ┌─────────────────── SYNTHESIS ────────────────────────────────────┐   │
│  │  [Risk Scorer] ──→ [Boardroom Simulation]                       │   │
│  └──────────────────────────────┬───────────────────────────────────┘   │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────────┐
│                     EXTERNAL SERVICES & DATA                            │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Google   │  │ Finnhub  │  │ Semantic  │  │ RSS Feeds│  │  FRED   │ │
│  │ Gemini   │  │Financial │  │ Scholar   │  │ (14 src) │  │  Macro  │ │
│  │   API    │  │   API    │  │   API     │  │          │  │  Data   │ │
│  └──────────┘  └──────────┘  └───────────┘  └──────────┘  └─────────┘ │
│  ┌──────────┐  ┌──────────┐                                          │
│  │  Slack   │  │  Stripe  │                                          │
│  │  Events  │  │ Webhooks │                                          │
│  │ Actions  │  │          │                                          │
│  │ Commands │  │          │                                          │
│  │ App Home │  │          │                                          │
│  └──────────┘  └──────────┘                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────────┐
│                    PERSISTENCE (Supabase PostgreSQL)                     │
│                                                                         │
│  Documents │ Analyses │ BiasInstances │ Embeddings (pgvector 1536-dim)  │
│  Deals │ DealOutcomes │ HumanDecisions │ CognitiveAudits │ Nudges     │
│  NewsArticles │ ResearchCache │ CaseStudies │ BoardroomPersonas         │
│  AuditLogs │ UserSettings │ CacheEntries │ RateLimits │ IntelSync      │
│  Organizations │ TeamMembers │ TeamInvites │ TeamCognitiveProfiles      │
│  CausalEdges │ CalibrationProfiles │ DecisionPriors │ DecisionFrames  │
│  DecisionEdges │ ToxicCombinations │ ToxicPatterns                      │
│  ComplianceAssessments │ ShareLinks │ ApiKeys │ BatchUploads             │
│  AnalysisVersions │ PromptVersions │ FailedAnalyses │ NotificationLogs│
│  SlackInstallations │ Meetings │ MeetingTranscripts │ DecisionRooms   │
│  BlindPriors │ DecisionAttributions │ CalibrationMilestones              │
│  DraftOutcomes │ DecisionOutcomes │ WebhookSubscriptions                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Agent Pipeline Detail

```
Document Upload
      │
      ▼
┌─────────────┐     ┌─────────────┐
│    GDPR      │────▶│   Data      │
│  Anonymizer  │     │ Structurer  │
│  (PII strip) │     │ (clean/org) │
└─────────────┘     └──────┬──────┘
                           │
              ┌────────────┼────────────┬────────────┬─────────────┬──────────────┐
              ▼            ▼            ▼            ▼             ▼              ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Bias    │ │  Noise   │ │   Fact   │ │   Pre-   │ │Compliance│ │Sentiment │
        │Detective │ │Judge (x3)│ │ Checker  │ │  Mortem  │ │  Mapper  │ │ Analyzer │
        └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │            │             │              │
              ┌───────────┼────────────┼────────────┼─────────────┼──────────────┘
              ▼            ▼            ▼            ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Deep    │ │Intel-    │ │Verifi-   │ │   RPD    │
        │ Analysis │ │ligence   │ │cation    │ │Recognitn │
        │(SWOT/Red)│ │(News/Res)│ │(Extended)│ │(Klein)   │
        └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │            │
             └────────────┼────────────┴────────────┘
                          ▼
                   ┌─────────────┐
                   │    Risk     │
                   │   Scorer    │
                   │ (Synthesis) │
                   └──────┬──────┘
                          ▼
                   ┌─────────────┐
                   │  Boardroom  │
                   │ Simulation  │
                   │(Decision Twin)│
                   └─────────────┘
```

### Directory Structure

```
src/
├── app/
│   ├── (marketing)/           # Public landing page
│   ├── (platform)/            # Authenticated routes
│   │   └── dashboard/
│   │       ├── page.tsx           # Main dashboard (upload, activity feed, search)
│   │       ├── bias-library/      # Bias Education Library (16 biases with examples)
│   │       ├── chat/              # Second Brain Chat (RAG-powered Q&A)
│   │       ├── compare/           # Side-by-side document comparison
│   │       ├── cognitive-audits/  # Human decision auditing
│   │       ├── intelligence/      # Intelligence Hub (news, macro, research)
│   │       ├── insights/          # Aggregated cross-document insights
│   │       ├── meetings/          # Meeting recordings & transcripts
│   │       │   └── command-center/ # Live meeting health monitoring
│   │       ├── nudges/            # Decision coaching alerts
│   │       ├── decisions/
│   │       │   └── new/           # Decision framing (outcomes-first workflow)
│   │       ├── team/              # Team collaboration & member management
│   │       ├── audit-log/         # Compliance audit trail
│   │       ├── search/            # Semantic search
│   │       └── settings/          # User preferences
│   │   └── calibration/           # Personal calibration dashboard (Klein RPD)
│   │   └── documents/
│   │       └── [id]/              # Document detail (10 analysis tabs)
│   │           └── tabs/
│   │               ├── OverviewTab     # Document content & biases
│   │               ├── ReplayTab       # Decision Replay & counterfactual analysis
│   │               ├── LogicTab        # Logical fallacy detection
│   │               ├── SwotTab         # Interactive SWOT analysis
│   │               ├── NoiseTab        # Decision noise benchmarks
│   │               ├── RedTeamTab      # Counter-arguments & blind spots
│   │               ├── BoardroomTab    # Decision Twin simulation
│   │               ├── SimulatorTab    # What-If scenario testing
│   │               ├── RpdTab          # Klein RPD recognition cues & mental simulation
│   │               └── IntelligenceTab # Relevant news & research
│   │   └── shared/
│   │       └── [token]/           # Password-protected shareable analysis links
│   ├── invite/
│   │   └── [token]/               # Team invitation acceptance
│   ├── api/
│   │   ├── upload/                # File ingestion (PDF/DOCX/TXT, 5MB limit)
│   │   │   └── bulk/              # Batch upload (up to 10 files)
│   │   ├── analyze/
│   │   │   ├── stream/            # SSE streaming analysis
│   │   │   └── simulate/          # Boardroom simulation
│   │   ├── rpd-simulator/         # Klein RPD mental simulation
│   │   ├── calibration/
│   │   │   └── profile/           # Personal calibration profile
│   │   ├── v1/                    # Public API (API key auth)
│   │   │   ├── analyze/           # Programmatic document analysis
│   │   │   ├── documents/         # Document listing
│   │   │   ├── insights/          # Aggregated insights
│   │   │   └── keys/              # API key management
│   │   ├── activity-feed/         # Unified activity feed (multi-source)
│   │   ├── chat/                  # RAG-powered chat with follow-up suggestions
│   │   ├── deals/                 # Deal pipeline CRUD (PE/VC vertical)
│   │   │   └── [id]/outcome/     # Deal outcome recording (IRR/MOIC)
│   │   ├── documents/             # CRUD operations
│   │   ├── human-decisions/       # Cognitive audit ingestion (manual/email/Slack)
│   │   ├── decision-frames/       # Outcomes-first decision framing
│   │   ├── decision-priors/       # Pre-analysis belief capture (RLHF)
│   │   ├── learning/              # Causal weights, accuracy, recalibration
│   │   ├── intelligence/          # News, macro, status endpoints
│   │   ├── integrations/
│   │   │   └── slack/             # OAuth, events, status, uninstall
│   │   ├── team/                  # Members, invites, activity
│   │   ├── personas/              # Custom boardroom persona management
│   │   ├── outcomes/              # Decision outcome tracking
│   │   ├── decision-graph/        # Knowledge graph (11 sub-routes)
│   │   │   ├── edges/             # Edge CRUD (POST/PATCH/DELETE)
│   │   │   ├── stats/             # Lightweight graph stats
│   │   │   ├── trends/            # Weekly trends + anomaly detection
│   │   │   ├── risk-state/        # Org risk level
│   │   │   ├── root-cause/        # Bias-to-outcome attribution
│   │   │   ├── recommendations/   # Graph-powered recommendations
│   │   │   ├── context/           # Pre-decision intelligence
│   │   │   ├── report/            # SNA report + AI narrative
│   │   │   ├── lineage/           # Compliance audit trail export
│   │   │   └── benchmarks/        # Org performance benchmarks
│   │   ├── search/                # Vector similarity search
│   │   ├── audit/                 # Audit log queries
│   │   ├── admin/                 # Error tracking, retry, prompt management
│   │   ├── feedback/              # Bias rating user feedback
│   │   ├── trends/                # Trend analysis
│   │   ├── stats/                 # Dashboard analytics
│   │   ├── cron/                  # Scheduled sync, recalibration, weekly digest
│   │   └── health/                # Health check
│   └── login/                    # Google OAuth login page
├── lib/
│   ├── analysis/                  # LangGraph pipeline orchestration
│   │   └── analyzer.ts            # Main graph builder & execution
│   ├── agents/                    # 15 AI agent node implementations
│   ├── graph/                     # Decision Knowledge Graph
│   │   ├── graph-builder.ts       # 10-step graph construction pipeline
│   │   ├── edge-inference.ts      # Auto-inferred edges (5 algorithms)
│   │   ├── edge-learning.ts       # Outcome/nudge-driven weight adjustment
│   │   ├── centrality.ts          # PageRank, degree, betweenness centrality
│   │   ├── graph-patterns.ts      # Anti-pattern detection (echo chambers, cascades)
│   │   ├── cascade-risk.ts        # Cluster-level failure risk scoring
│   │   ├── entity-resolution.ts   # Participant name disambiguation
│   │   ├── risk-state.ts          # Org-wide predictive risk assessment
│   │   ├── root-cause.ts          # Bias-to-outcome attribution
│   │   ├── counterfactual.ts      # Alternative path analysis
│   │   ├── anomaly-detection.ts   # Temporal anomaly detection
│   │   ├── federated-learning.ts  # Cross-org pattern sharing
│   │   ├── benchmarking.ts        # Org performance benchmarks
│   │   ├── recommendations.ts     # Decision recommendations
│   │   ├── pathfinding.ts         # BFS/Dijkstra path algorithms
│   │   └── graph-export.ts        # PNG/SVG/DOT export utilities
│   ├── learning/                  # Behavioral Data Flywheel
│   │   ├── causal-learning.ts     # Org-specific causal weight discovery
│   │   ├── outcome-scoring.ts     # Accuracy tracking from outcomes
│   │   ├── feedback-loop.ts       # Behavioral calibration loop
│   │   └── constants.ts           # Default weights and thresholds
│   ├── human-audit/               # Human Decision Cognitive Audit
│   │   └── analyzer.ts            # Audit pipeline for spoken/written decisions
│   ├── meetings/                  # Meeting Intelligence
│   │   ├── intelligence.ts        # Speaker bias profiles & decision tracking
│   │   ├── speaker-profiles.ts    # Speaker tendency aggregation
│   │   ├── quality-predictor.ts   # Meeting health & quality prediction
│   │   ├── transcribe.ts          # Transcription processing
│   │   └── process.ts             # Meeting data processing pipeline
│   ├── ai/                        # Multi-model router and providers (Gemini, Claude)
│   ├── analytics/                 # Product event tracking
│   ├── integrations/              # External platform integrations
│   │   └── slack/
│   │       └── handler.ts         # Slack event routing & signature verification
│   ├── compliance/                # Deep Compliance Integration (Moat 5)
│   │   └── fca-consumer-duty.ts   # FCA Consumer Duty framework
│   ├── constants/
│   │   └── bias-education.ts      # Educational content for 16 biases
│   ├── intelligence/              # Context assembly (news + research + cases)
│   ├── news/                      # RSS feed fetching & classification
│   ├── prompts/
│   │   └── registry.ts            # Prompt versioning & drift detection
│   ├── replay/
│   │   └── score-calculator.ts    # Counterfactual score projection engine
│   ├── research/                  # Semantic Scholar paper matching
│   ├── rag/                       # Embeddings & vector search (pgvector)
│   │   ├── embeddings.ts          # Gemini embeddings, semantic search
│   │   └── graph-guided-search.ts # Graph-guided RAG & ensemble retrieval
│   ├── tools/                     # External data (Finnhub, FRED macro)
│   ├── reports/
│   │   ├── pdf-generator.ts       # Full PDF report with jsPDF
│   │   ├── csv-generator.ts       # CSV data export
│   │   ├── markdown-generator.ts  # Markdown report generation
│   │   ├── json-generator.ts      # Structured JSON export
│   │   ├── graph-report.ts        # Graph SNA metrics report
│   │   ├── graph-narrative.ts     # AI-generated executive narrative
│   │   └── lineage-export.ts      # Compliance audit trail export
│   ├── utils/
│   │   ├── api-auth.ts            # API key validation & scope checking
│   │   ├── cache.ts               # Postgres-based caching (TTL)
│   │   ├── csrf.ts                # CSRF token generation
│   │   ├── encryption.ts          # AES-256-GCM token encryption
│   │   ├── error-tracker.ts       # Error aggregation & retry management
│   │   ├── rate-limit.ts          # API rate limiting
│   │   ├── logger.ts              # Structured logging
│   │   ├── file-parser.ts         # PDF/DOCX/TXT parsing
│   │   ├── prisma-json.ts         # Safe JSON serialization for Prisma
│   │   └── resilience.ts          # Timeout & batch utilities
│   ├── schemas/
│   │   └── human-audit.ts         # Zod schemas for human decision validation
│   ├── audit.ts                   # Audit logging utility
│   └── sse.ts                     # Server-Sent Events helpers
├── components/
│   ├── chat/                      # Chat components
│   │   ├── SuggestedQuestions      # AI-generated follow-up question pills
│   │   ├── MessageActions          # Copy, bookmark, retry on hover
│   │   ├── SourceAttribution       # Enhanced source display with relevance bars
│   │   └── ChatEmptyState          # Contextual empty state with starters
│   ├── replay/
│   │   └── CounterfactualPanel     # "What-If" scenario testing UI
│   ├── ui/
│   │   ├── ActivityFeed            # Unified activity timeline
│   │   ├── BiasEducationCard       # Expandable bias education cards
│   │   ├── CommandPalette          # Grouped command palette (⌘K)
│   │   ├── DecisionCheckpoint      # Structured RLHF pre-analysis capture
│   │   ├── ShareModal              # Multi-format export & sharing
│   │   ├── Sidebar                 # Navigation with Bias Library link
│   │   ├── NotificationCenter      # Bell icon with notification dropdown
│   │   ├── ThemeToggle             # Dark/light mode toggle
│   │   ├── DensityProvider         # UI density adjustment
│   │   ├── ReducedMotionProvider   # Accessibility: motion-sensitive users
│   │   ├── ErrorBoundary           # Error boundary wrapper
│   │   ├── Toast                   # Enhanced toast notification system
│   │   ├── OnboardingGuide         # 3-step onboarding
│   │   ├── LoadingSkeleton          # 5 skeleton variants
│   │   ├── LiquidGlassEffect      # Animated glass morphism effects
│   │   └── ...                     # Table, Breadcrumbs, EmptyState, etc.
│   └── visualizations/            # 25+ Recharts/D3-based chart components
│       ├── ExecutiveSummary        # Overall score & key findings
│       ├── BiasTreemap             # Bias distribution visualization
│       ├── CausalGraph             # Causal relationship visualization (D3)
│       ├── RiskHeatMap             # Risk severity matrix
│       ├── DecisionRadar           # Multi-dimension radar chart
│       ├── EnhancedDecisionRadar   # Radar with confidence intervals
│       ├── SentimentGauge          # Emotional tone gauge
│       ├── FactVerificationBar     # Claim verification status
│       ├── ClaimDeviationScatter   # Fact-check deviation scatter plot
│       ├── SwotQuadrant            # SWOT matrix visualization
│       ├── WeightedSwot            # SWOT with importance weighting
│       ├── ComplianceGrid          # Regulatory status grid
│       ├── StakeholderMap          # Stakeholder impact analysis
│       ├── DecisionTimeline        # Decision evolution timeline
│       ├── QualityMetrics          # Noise measurement charts
│       ├── NoiseDecomposition      # Decision noise breakdown
│       ├── BiasNetwork             # Bias relationship graph
│       ├── BlindSpotNetwork        # Cognitive blind spots network
│       ├── BiasHeatmap             # Bias severity heatmap
│       ├── BiasSparkline           # Inline bias trend sparklines
│       ├── CrossImpactMatrix       # Multi-dimensional impact analysis
│       ├── PreMortemScenarioCards   # Failure scenario cards
│       ├── ComparativeAnalysis     # Cross-document comparison
│       └── DocumentTextHighlighter # Bias excerpt highlighting
├── hooks/
│   ├── useActivityFeed.ts         # SWR activity feed with pagination
│   ├── useAnalysisStream.ts       # SSE streaming with progress & retry
│   ├── useChatStream.ts           # Chat SSE with follow-up suggestions
│   ├── useDocuments.ts            # SWR document list with pagination
│   ├── useInsights.ts             # Aggregated cross-analysis insights
│   ├── useIntelligence.ts         # Intelligence status & freshness
│   └── useTrends.ts               # Risk trend data
└── types/
    └── index.ts                   # All TypeScript interfaces
```

---

## Tech Stack

| Layer                   | Technology                    | Purpose                                                          |
| :---------------------- | :---------------------------- | :--------------------------------------------------------------- |
| **Framework**           | Next.js 16 (App Router)       | Full-stack React with server components & route handlers         |
| **Language**            | TypeScript 5.9 (strict mode)  | Type safety across the entire codebase                           |
| **AI Engine**           | Google Gemini (via LangChain) | LLM powering all 16 agent nodes                                  |
| **Orchestration**       | LangGraph 1.1                 | Multi-agent directed graph with parallel execution               |
| **Causal AI**           | Custom SCM Engine             | Structural Causal Models for counterfactual reasoning            |
| **Database**            | Supabase PostgreSQL           | Primary data store with PgBouncer connection pooling             |
| **ORM**                 | Prisma 7.5                    | Type-safe database access with migrations                        |
| **Vector Search**       | pgvector (1536-dim)           | Semantic similarity search for embeddings                        |
| **Authentication**      | Supabase Auth + API Keys      | Google OAuth, protected routes, scoped API key auth              |
| **Encryption**          | AES-256-GCM (Node crypto)     | Integration token encryption (Slack bot tokens)                  |
| **UI Framework**        | React 19 + TailwindCSS 4      | Component-based UI with utility-first styling                    |
| **Component Libraries** | shadcn + Radix UI + Base UI   | Accessible, unstyled UI primitives with CVA variants             |
| **Charts**              | Recharts 3 + D3.js 7          | 25+ custom visualization components including causal graphs      |
| **Animations**          | Framer Motion                 | Page transitions, glass morphism effects, and micro-interactions |
| **Theming**             | next-themes                   | Dark/light mode with system preference detection                 |
| **Document Parsing**    | mammoth + unpdf               | PDF, DOCX, TXT, and spreadsheet ingestion                        |
| **Report Generation**   | jsPDF + AutoTable             | PDF, CSV, Markdown, and JSON export                              |
| **Real-Time**           | SSE (Server-Sent Events)      | Streaming analysis progress                                      |
| **Integrations**        | Slack OAuth                   | Enterprise messaging and decision detection                      |
| **News Syndication**    | rss-parser                    | 14-source RSS feed aggregation                                   |
| **Validation**          | Zod 4                         | Schema validation for all AI pipeline output                     |
| **Date Utilities**      | date-fns 4                    | Human-readable date formatting                                   |
| **Testing**             | Vitest 4 + Coverage V8        | Unit & integration tests with coverage reports                   |
| **Git Hooks**           | Husky 9                       | Pre-commit hooks for code quality                                |
| **Deployment**          | Vercel (serverless)           | Edge-optimized, zero-config deployment                           |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- A **Supabase** project (free tier works) with pgvector extension enabled
- A **Google AI** API key (Gemini access)

### 1. Clone & Install

```bash
git clone https://github.com/FolahanWilliams/decision-intel.git
cd decision-intel
npm install
```

### 2. Environment Setup

Create a `.env` file in the project root:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Authentication (Supabase Auth — Google OAuth)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# AI
GOOGLE_API_KEY="your-gemini-api-key"

# External APIs (optional — enables enhanced fact-checking)
FINNHUB_API_KEY="your-finnhub-key"

# Multi-Model AI Fallback (optional)
ANTHROPIC_API_KEY="your-anthropic-api-key"   # Required for Claude fallback (when AI_FALLBACK_ENABLED=true)
AI_FALLBACK_ENABLED="true"                   # Set to 'true' to enable Gemini → Claude failover

# Slack Integration (optional)
SLACK_CLIENT_ID="your-slack-client-id"
SLACK_CLIENT_SECRET="your-slack-client-secret"
SLACK_SIGNING_SECRET="your-signing-secret"
ENCRYPTION_KEY="your-256-bit-hex-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database (development)
npx prisma db push

# Or run migrations (production)
npm run prisma:migrate
```

### 4. Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### 5. Verify Setup

Visit `http://localhost:3000/api/health` to confirm database connectivity and system status.

---

## Usage

### Analyzing a Document

1. **Sign up** at `/sign-up` and log in
2. **Upload** a document (PDF, DOCX, or TXT — up to 5MB) from the dashboard
3. **Watch** real-time analysis progress via SSE streaming
4. **Explore** results across 10 analysis tabs:
   - **Overview** — Executive summary with overall score
   - **Replay** — Step-by-step pipeline walkthrough with counterfactual "What-If" testing
   - **Logic** — Logical fallacies and reasoning quality
   - **SWOT** — Interactive strengths/weaknesses/opportunities/threats
   - **Noise** — Decision quality benchmarks and variance analysis
   - **Red Team** — Counter-arguments and blind spots
   - **Boardroom** — Simulated decision votes from virtual personas
   - **Simulator** — Scenario planning interface
   - **Intuition** — Klein RPD pattern recognition cues, narrative war stories, and mental simulator
   - **Intelligence** — Relevant news, research papers, and case studies
5. **Share & Export** — Click the Share & Export button to download as PDF, CSV, Markdown, or JSON, or quick-share via clipboard or email

### Decision Replay

On any analyzed document, open the **Replay** tab to:

- See how the score progressed through each pipeline stage (score waterfall chart)
- Expand any step to see its findings, running score, and detection details
- Click **"What if…?"** to test counterfactual scenarios — remove biases, change noise levels, flip boardroom votes — and see projected score changes instantly

### Bias Library

Navigate to `/dashboard/bias-library` to:

- Browse all 20 cognitive biases with real-world examples (Kodak, Bay of Pigs, Theranos, etc.)
- Learn 3 actionable debiasing techniques for each bias
- See which biases have appeared in your own documents
- Filter by category and search by name

### Second Brain Chat

Navigate to `/dashboard/chat` to:

- Ask questions about your analyzed documents using RAG-powered semantic search
- Pin a specific document for focused Q&A
- Get AI-generated follow-up question suggestions after each response
- Bookmark important messages and manage conversation history
- View enhanced source attribution with relevance scores

### Intelligence Hub

Navigate to `/dashboard/intelligence` to:

- Browse categorized news articles from 14 sources
- View research paper counts and case study matches
- Monitor macro-economic indicators (FRED data)
- Trigger manual intelligence sync

### Command Palette

Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) to:

- Search across pages, actions, and recent documents in one place
- Use prefix shortcuts: `>` for actions, `/` for pages, `@` for documents
- Jump to any analyzed document with score badges

### Semantic Search

Use `/dashboard/search` to find similar documents and analyses using vector similarity search powered by pgvector embeddings.

### Browser Extension

Install the Chrome extension from the `/extension/` directory for real-time bias checking:

- **Quick Score** — Click the extension icon for a <5 second bias-only scan of the current page
- **Full Analysis** — Open the side panel for a complete 16-agent pipeline analysis
- **Inline Annotations** — Content script highlights detected biases directly on the page

Load as an unpacked extension in Chrome Developer Mode. See `extension/README.md` for detailed setup.

### A/B Prompt Testing

Navigate to `/dashboard/experiments` to:

- Create experiments with 2-10 prompt variants and custom traffic splits
- Monitor per-variant effectiveness rates, impressions, and belief delta
- Auto-optimize traffic allocation via Thompson sampling
- Declare winners when statistical significance is reached

### Case Study Export

From any analysis, click "Share as Case Study" in the share modal to:

- Generate a permanently shareable, anonymized analysis link
- Brand with DQI badge, bias summary, coaching excerpts, and CTA
- Use for LP reporting, sales collateral, and social proof

---

## Development

### Commands

| Command                   | Description                           |
| :------------------------ | :------------------------------------ |
| `npm run dev`             | Start development server              |
| `npm run build`           | Production build                      |
| `npm run lint`            | Run ESLint                            |
| `npm test`                | Run Vitest test suite                 |
| `npm run prisma:generate` | Regenerate Prisma client              |
| `npm run prisma:migrate`  | Run database migrations               |
| `npm run prisma:studio`   | Open Prisma Studio (visual DB editor) |

### Code Conventions

- All client components must use the `'use client'` directive
- Never read `localStorage` or `window` in `useState` initializers — use `useEffect` to avoid hydration mismatches
- Prisma queries for newer columns must include schema-drift fallback (catch `P2021`/`P2022`, retry with core fields)
- Use `toPrismaJson()` from `@/lib/utils/prisma-json` when writing JSON fields
- Zod schemas validate all AI pipeline output before database persistence

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npx vitest run --coverage
```

Tests cover: agent nodes, analysis pipeline, API routes, hooks, utilities, and caching.

---

## CI/CD Pipeline

### GitHub Actions Workflows

| Workflow                | Trigger                | Actions                                         |
| :---------------------- | :--------------------- | :---------------------------------------------- |
| **CI/CD Pipeline**      | Push & PR              | TypeScript check, ESLint, Vitest, Vercel deploy |
| **Database Migrations** | Schema changes on main | Applies Prisma migrations to production         |
| **Dependency Updates**  | Weekly schedule        | Creates issues for outdated packages            |
| **Jules AI Audit**      | Manual / scheduled     | AI-powered codebase audits via Gemini CLI       |
| **Release Management**  | Version tags           | Generates changelogs & GitHub releases          |

### Required Repository Secrets

| Secret              | Purpose                                      |
| :------------------ | :------------------------------------------- |
| `VERCEL_TOKEN`      | Vercel deployment API token                  |
| `VERCEL_ORG_ID`     | Vercel organization identifier               |
| `VERCEL_PROJECT_ID` | Vercel project identifier                    |
| `DATABASE_URL`      | Production database (pooled connection)      |
| `DIRECT_URL`        | Direct database connection (migrations only) |
| `SLACK_WEBHOOK_URL` | _(Optional)_ Slack notifications             |

### Branch Protection

- Required status checks (TypeScript compilation, tests) before merge
- Required code reviews
- No direct pushes to `main`

---

## Deployment

The platform is **Vercel-native** and optimized for serverless:

- **Stateless API routes** — No server-side sessions, fully compatible with serverless functions
- **PgBouncer connection pooling** — Handles concurrent serverless DB connections via Supabase
- **Postgres-based caching** — No Redis dependency, simplifies infrastructure
- **SSE streaming** — Real-time analysis progress (10MB body size limit configured)
- **Edge-optimized** — Auth middleware runs at the edge for fast auth checks

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments on push.

---

## Platform Traction

Live metrics from the Decision Intel platform:

| Metric | Value |
|:-------|:------|
| **Analyses Run** | Updated live — see [/api/public/outcome-stats](https://www.decision-intel.com/api/public/outcome-stats) |
| **Biases Detected** | Across all IC memos, CIMs, and pitch decks processed |
| **Outcomes Tracked** | Deal outcomes linked back to original bias detections |
| **Detection Accuracy** | Percentage of flagged biases later confirmed by deal outcomes |

These counters are displayed on the [landing page](https://www.decision-intel.com) and powered by the public outcome stats API.

---

## Roadmap

### Shipped

- [x] 16-agent cognitive bias detection pipeline
- [x] Decision noise measurement (Statistical Jury)
- [x] Financial fact-checking (Finnhub + Google Search Grounding)
- [x] GDPR PII anonymization (pre-analysis)
- [x] FCA Consumer Duty compliance mapping
- [x] Boardroom simulation (Decision Twin)
- [x] Web Intelligence Layer (news, research, case studies, macro)
- [x] Intelligence Hub dashboard
- [x] Semantic search (pgvector embeddings)
- [x] 14 interactive visualization components
- [x] SSE real-time streaming analysis
- [x] Full audit trail
- [x] **Decision Replay & Counterfactual Analysis** — Step-by-step pipeline replay with "What-If" scenario testing
- [x] **Bias Education Library** — 16 biases with real-world case studies, debiasing techniques, and academic references
- [x] **Second Brain Chat (RAG)** — AI follow-up suggestions, message actions, enhanced source attribution
- [x] **Unified Activity Feed** — Multi-source chronological timeline on the dashboard
- [x] **Command Palette** — Grouped search with recent documents, prefix filters, and keyboard shortcuts
- [x] **Multi-Format Export** — PDF, CSV, Markdown, and JSON export with unified Share & Export modal
- [x] **Cognitive Audits** — Human decision auditing with bias detection and effectiveness tracking
- [x] **Nudge Engine** — Behavioral coaching alerts based on Thaler's Nudge Theory
- [x] **Meeting Intelligence** — Meeting recording upload with speaker diarization and bias tracking
- [x] **Institutional Memory** — Surface similar past decisions and their outcomes
- [x] **Outcome Tracking** — Report actual decision outcomes and compare against predictions

- [x] **Causal AI Layer** — Structural Causal Models learning org-specific bias→outcome relationships
- [x] **Outcomes-First Workflow** — Decision framing before document upload (success/failure criteria)
- [x] **Structured RLHF** — Pre-analysis belief capture and belief delta tracking
- [x] **Behavioral Data Flywheel** — Continuous calibration from outcome data with weekly recalibration
- [x] **Slack Integration** — Full OAuth flow, decision detection, and real-time nudge delivery
- [x] **Public API (v1)** — RESTful API with scoped API key authentication and rate limiting
- [x] **Team Collaboration** — Multi-tenant organizations with roles, invites, and team cognitive profiles
- [x] **Batch Upload** — Multi-file upload with job tracking
- [x] **Shareable Links** — Password-protected, expiring share links with access audit trail
- [x] **Meeting Command Center** — Live meeting health monitoring and speaker bias profiles
- [x] **Deep Compliance (SOX/Basel III)** — Multi-framework compliance with remediation plans
- [x] **Analysis Versioning** — Full snapshot history and prompt drift detection
- [x] **Custom Boardroom Personas** — Organization-specific persona configuration
- [x] **PE/VC Investment Vertical** — Deal pipeline, document type classification, 11 PE-specific biases, deal-stage overlays, IC simulation with PE personas
- [x] **Deal Pipeline & Outcome Tracking** — Full deal lifecycle (screening → exit) with IRR/MOIC outcome recording that feeds causal AI flywheel
- [x] **Investment-Specific Compound Scoring** — Auto-escalated monetary stakes for deal-linked documents, deal-stage-aware risk weighting
- [x] **Enhanced Public Demo** — Streaming simulation UX with 3 sample documents, DQI badge animation, no login required
- [x] **Data-Backed ROI Calculator** — Live outcome statistics replace hardcoded research baselines when sufficient data exists
- [x] **Case Study Export** — One-click anonymized, branded shareable analyses with permanent links
- [x] **Browser Extension** — Chrome extension with quick-score popup (<5s) and full analysis sidepanel, dedicated API routes
- [x] **A/B Prompt Testing** — Experiment CRUD, Thompson sampling auto-optimization, per-variant effectiveness dashboard
- [x] **Multi-Model Fallback** — Gemini → Claude failover routing with unified response interface
- [x] **Graph Health Monitoring** — Real-time knowledge graph density, isolated nodes, and anti-pattern tracking widget
- [x] **Counterfactual Analysis API** — Alternative decision path computation with narrative explanations
- [x] **Product Analytics** — Lightweight event tracking across conversion funnel with internal analytics API
- [x] **Prompt Versioning** — SHA-256 deduplicated prompt tracking wired to analysis pipeline
- [x] **Klein RPD Framework** — Expert intuition amplification with recognition cues from historical deals, narrative war-story pre-mortems, RPD mental simulator, and personal calibration dashboard

### Planned

- [ ] **Custom Bias Taxonomies** — Let organizations define domain-specific bias categories
- [ ] **Enterprise SSO** — SAML/OIDC integration for large organizations
- [ ] **Multi-language Support** — Document analysis in non-English languages
- [ ] **Decision Playbooks** — Templated analysis configurations for common decision types
- [ ] **Microsoft Teams Integration** — Decision detection and nudge delivery in Teams
- [ ] **Email Integration** — Automated decision detection from email threads
- [ ] **Webhook Notifications** — Configurable webhooks on analysis completion

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please ensure all TypeScript checks pass (`npm run build`) and tests pass (`npm test`) before submitting.

---

## License

This project is proprietary software. All rights reserved.

---

<p align="center">
  <strong>Built to make every decision count.</strong>
</p>
