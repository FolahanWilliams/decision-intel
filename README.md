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

> **Quantify Decision Noise. Eliminate Cognitive Bias. Protect Revenue.**

[![CI/CD](https://github.com/FolahanWilliams/decision-intel/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/FolahanWilliams/decision-intel/actions/workflows/ci-cd.yml)

**[Live Demo](https://decision-intel-chi.vercel.app/)** | **[Architecture](#architecture)** | **[Getting Started](#getting-started)** | **[Roadmap](#roadmap)**

---

## The Problem

Cognitive biases and decision noise are invisible taxes on every organization. Research by Daniel Kahneman (*Noise: A Flaw in Human Judgment*) reveals that **professionals evaluating identical information routinely reach wildly different conclusions** — a phenomenon called *decision noise*. This inconsistency silently drains **12-15% of EBITDA** across industries including finance, insurance, healthcare, and legal.

Most organizations have no way to:
- **Detect** which biases are influencing critical decisions
- **Measure** how much variance exists across similar decisions
- **Verify** whether claims in strategic documents align with market reality
- **Prove** regulatory compliance of their decision-making processes

## The Solution

The **Decision Intelligence Platform** (codenamed **NeuroAudit**) is an AI-powered cognitive auditing engine that ingests strategic documents — board papers, investment memos, policy proposals, risk assessments — and runs them through a **15-agent analysis pipeline** to detect bias, measure noise, verify facts, simulate outcomes, and generate actionable intelligence.

Upload a document. Get a complete cognitive audit in under 60 seconds.

---

## Value Proposition

| For | Pain Point | What We Deliver |
|:----|:-----------|:----------------|
| **Executives & Boards** | Decisions driven by gut feel and groupthink | Objective scoring, bias detection, and pre-mortem failure analysis |
| **Investors & Analysts** | No way to quantify management quality from documents | Decision quality score (0-100), noise benchmarks, fact verification |
| **Compliance Officers** | Manual regulatory alignment checks (FCA Consumer Duty, SEC) | Automated compliance mapping with PASS/WARN/FAIL status |
| **Risk Managers** | Blind spots in risk assessments go unnoticed | Red-team analysis, cognitive blind spot detection, scenario simulation |
| **Strategy Teams** | Echo chambers and confirmation bias in planning | SWOT analysis, logical fallacy detection, market reality checks |

**ROI**: Organizations using systematic decision hygiene report **up to 60% reduction in decision variance**, translating to millions in recovered value annually.

---

## Features

### Core Analysis Pipeline

#### Cognitive Bias Detection
Scans documents for **15 distinct cognitive biases** with confidence scores, severity ratings, and exact excerpts:

| Category | Biases Detected |
|:---------|:---------------|
| **Judgment** | Confirmation Bias, Anchoring, Availability Heuristic, Framing Effect, Status Quo Bias |
| **Group Dynamics** | Groupthink, Authority Bias, Bandwagon Effect |
| **Overconfidence** | Overconfidence Bias, Planning Fallacy, Dunning-Kruger Effect |
| **Risk Assessment** | Loss Aversion, Sunk Cost Fallacy, Survivorship Bias |
| **Information** | Recency Bias |

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
- **SEC disclosure** requirements
- **GDPR readiness** — Automated PII anonymization before analysis
- **Remediation Plans** — Auto-generated remediation steps for failing assessments
- Status output: **PASS / WARN / FAIL** with specific recommendations

#### Pre-Mortem Analysis
Generates failure scenarios *before* decisions are made:
- Top failure modes with probability estimates
- Preventive measures for each scenario
- Cascading risk identification

#### Advanced Analysis Suite
- **Logical Fallacy Detection** — Identifies flawed reasoning patterns
- **SWOT Analysis** — Structured strengths/weaknesses/opportunities/threats
- **Cognitive Blind Spots** — Red-team counter-arguments with verified sources
- **Sentiment Analysis** — Emotional tone scoring across document sections

### Boardroom Simulation (Decision Twin)

A unique **decision simulation engine** that creates virtual boardroom personas — CEO, CFO, Risk Officer, Ethics Advisor, Devil's Advocate — and simulates how each would vote on the document's proposals. Produces:
- Individual persona votes (APPROVE / REJECT / ABSTAIN) with reasoning
- Consensus analysis and coalition mapping
- Dissent patterns and minority concerns
- **Custom Personas** — Create organization-specific boardroom personas with configurable risk tolerance, focus areas, and values

### Causal AI Layer

Organization-specific **Structural Causal Models (SCM)** that learn which biases actually cause poor outcomes in *your* organization:
- **Causal Edge Discovery** — Learns relationships between biases and decision quality from outcome data (e.g., "confirmation bias → high noise score")
- **Danger Multipliers** — Organization-specific learned weights that amplify bias severity based on historical impact
- **Counterfactual Reasoning** — "What would the outcome have been if this bias were absent?"

### Outcomes-First Workflow (Decision Framing)

Captures decision context *before* document upload to prevent biases from influencing interpretation:
- **Decision Frames** — Define decision statement, default action, success/failure criteria, and stakeholders upfront
- **Decision Priors (Structured RLHF)** — Records the decision-maker's pre-analysis belief and confidence level
- **Belief Delta Tracking** — Measures how much the analysis shifted the decision-maker's position

### Behavioral Data Flywheel

A continuous improvement loop that makes the platform smarter over time:
- **Outcome Tracking** — Report actual decision outcomes and compare against predictions
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

Enterprise-grade Slack integration for real-time decision intelligence:
- **OAuth Installation** — Full Slack OAuth flow with encrypted bot token storage (AES-256-GCM)
- **Decision Detection** — Automatically identifies decisions being made in Slack channels
- **Real-Time Nudges** — Delivers cognitive bias alerts directly in Slack when decisions are detected
- **Decision Ingestion** — Routes Slack decisions into the cognitive audit pipeline for full analysis

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
- **Case Studies** — Historical decision failures (Enron, Nokia, etc.) matched by bias type
- **Macro Context** — FRED economic indicators for market backdrop
- **Intelligence Hub** — Dedicated dashboard page with filterable news grid, research counts, and freshness monitoring

### Decision Replay & Counterfactual Analysis

Step through your analysis like a debugger steps through code. The **Replay** tab decomposes the 15-agent pipeline into a visual timeline, showing exactly how each stage influenced the final score:

- **Score Waterfall** — Horizontal bar chart showing score progression from 100 → final through each analysis stage
- **Step-by-Step Replay** — Expandable cards for each pipeline stage: Document Intelligence → Bias Detection → Noise Analysis → Fact Check → Deep Analysis → Boardroom → Final Score
- **"What-If" Counterfactual Panel** — Click "What if…?" on any step to test scenarios:
  - Remove individual biases and see projected score recovery
  - Override noise score (perfect consistency vs. doubled noise)
  - Toggle fact-check results (all verified vs. all contradicted)
  - Client-side scoring engine calculates projections instantly — no API calls

### Bias Education Library

A comprehensive learning resource for all 16 cognitive biases, accessible at `/dashboard/bias-library`:

- **16 Rich Education Cards** — Each bias includes a real-world business case study (Kodak, Bay of Pigs, Theranos, Concorde, etc.), 3 actionable debiasing techniques, academic references, difficulty rating, and related biases
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

- **GDPR Anonymization** — PII is stripped *before* any AI analysis (names, emails, companies replaced with tokens)
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
│  │  Feed    │  │ 9 Tabs   │  │Bias Library│  │  Chat    │  │  GDPR   │ │
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
│  ┌──────────┐                                                         │
│  │  Slack   │                                                         │
│  │  OAuth   │                                                         │
│  │  Events  │                                                         │
│  └──────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────────┐
│                    PERSISTENCE (Supabase PostgreSQL)                     │
│                                                                         │
│  Documents │ Analyses │ BiasInstances │ Embeddings (pgvector 1536-dim)  │
│  HumanDecisions │ CognitiveAudits │ Nudges │ DecisionOutcomes           │
│  NewsArticles │ ResearchCache │ CaseStudies │ BoardroomPersonas         │
│  AuditLogs │ UserSettings │ CacheEntries │ RateLimits │ IntelSync      │
│  Organizations │ TeamMembers │ TeamInvites │ TeamCognitiveProfiles      │
│  CausalEdges │ CalibrationProfiles │ DecisionPriors │ DecisionFrames  │
│  ComplianceAssessments │ ShareLinks │ ApiKeys │ BatchUploads             │
│  AnalysisVersions │ PromptVersions │ FailedAnalyses │ NotificationLogs│
│  SlackInstallations │ Meetings │ MeetingTranscripts                    │
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
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Deep    │ │Intel-    │ │Verifi-   │
        │ Analysis │ │ligence   │ │cation    │
        │(SWOT/Red)│ │(News/Res)│ │(Extended)│
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             └────────────┼────────────┘
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
│   │   └── documents/
│   │       └── [id]/              # Document detail (9 analysis tabs)
│   │           └── tabs/
│   │               ├── OverviewTab     # Document content & biases
│   │               ├── ReplayTab       # Decision Replay & counterfactual analysis
│   │               ├── LogicTab        # Logical fallacy detection
│   │               ├── SwotTab         # Interactive SWOT analysis
│   │               ├── NoiseTab        # Decision noise benchmarks
│   │               ├── RedTeamTab      # Counter-arguments & blind spots
│   │               ├── BoardroomTab    # Decision Twin simulation
│   │               ├── SimulatorTab    # What-If scenario testing
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
│   │   ├── v1/                    # Public API (API key auth)
│   │   │   ├── analyze/           # Programmatic document analysis
│   │   │   ├── documents/         # Document listing
│   │   │   ├── insights/          # Aggregated insights
│   │   │   └── keys/              # API key management
│   │   ├── activity-feed/         # Unified activity feed (multi-source)
│   │   ├── chat/                  # RAG-powered chat with follow-up suggestions
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
│   ├── tools/                     # External data (Finnhub, FRED macro)
│   ├── reports/
│   │   ├── pdf-generator.ts       # Full PDF report with jsPDF
│   │   ├── csv-generator.ts       # CSV data export
│   │   ├── markdown-generator.ts  # Markdown report generation
│   │   └── json-generator.ts      # Structured JSON export
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

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Framework** | Next.js 16 (App Router) | Full-stack React with server components & route handlers |
| **Language** | TypeScript 5.9 (strict mode) | Type safety across the entire codebase |
| **AI Engine** | Google Gemini (via LangChain) | LLM powering all 15 agent nodes |
| **Orchestration** | LangGraph 1.1 | Multi-agent directed graph with parallel execution |
| **Causal AI** | Custom SCM Engine | Structural Causal Models for counterfactual reasoning |
| **Database** | Supabase PostgreSQL | Primary data store with PgBouncer connection pooling |
| **ORM** | Prisma 7.5 | Type-safe database access with migrations |
| **Vector Search** | pgvector (1536-dim) | Semantic similarity search for embeddings |
| **Authentication** | Supabase Auth + API Keys | Google OAuth, protected routes, scoped API key auth |
| **Encryption** | AES-256-GCM (Node crypto) | Integration token encryption (Slack bot tokens) |
| **UI Framework** | React 19 + TailwindCSS 4 | Component-based UI with utility-first styling |
| **Component Libraries** | shadcn + Radix UI + Base UI | Accessible, unstyled UI primitives with CVA variants |
| **Charts** | Recharts 3 + D3.js 7 | 25+ custom visualization components including causal graphs |
| **Animations** | Framer Motion | Page transitions, glass morphism effects, and micro-interactions |
| **Theming** | next-themes | Dark/light mode with system preference detection |
| **Document Parsing** | mammoth + unpdf | PDF, DOCX, TXT, and spreadsheet ingestion |
| **Report Generation** | jsPDF + AutoTable | PDF, CSV, Markdown, and JSON export |
| **Real-Time** | SSE (Server-Sent Events) | Streaming analysis progress |
| **Integrations** | Slack OAuth | Enterprise messaging and decision detection |
| **News Syndication** | rss-parser | 14-source RSS feed aggregation |
| **Validation** | Zod 4 | Schema validation for all AI pipeline output |
| **Date Utilities** | date-fns 4 | Human-readable date formatting |
| **Testing** | Vitest 4 + Coverage V8 | Unit & integration tests with coverage reports |
| **Git Hooks** | Husky 9 | Pre-commit hooks for code quality |
| **Deployment** | Vercel (serverless) | Edge-optimized, zero-config deployment |

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
4. **Explore** results across 9 analysis tabs:
   - **Overview** — Executive summary with overall score
   - **Replay** — Step-by-step pipeline walkthrough with counterfactual "What-If" testing
   - **Logic** — Logical fallacies and reasoning quality
   - **SWOT** — Interactive strengths/weaknesses/opportunities/threats
   - **Noise** — Decision quality benchmarks and variance analysis
   - **Red Team** — Counter-arguments and blind spots
   - **Boardroom** — Simulated decision votes from virtual personas
   - **Simulator** — Scenario planning interface
   - **Intelligence** — Relevant news, research papers, and case studies
5. **Share & Export** — Click the Share & Export button to download as PDF, CSV, Markdown, or JSON, or quick-share via clipboard or email

### Decision Replay

On any analyzed document, open the **Replay** tab to:
- See how the score progressed through each pipeline stage (score waterfall chart)
- Expand any step to see its findings, running score, and detection details
- Click **"What if…?"** to test counterfactual scenarios — remove biases, change noise levels, flip boardroom votes — and see projected score changes instantly

### Bias Library

Navigate to `/dashboard/bias-library` to:
- Browse all 16 cognitive biases with real-world examples (Kodak, Bay of Pigs, Theranos, etc.)
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

---

## Development

### Commands

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest test suite |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio (visual DB editor) |

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

| Workflow | Trigger | Actions |
|:---------|:--------|:--------|
| **CI/CD Pipeline** | Push & PR | TypeScript check, ESLint, Vitest, Vercel deploy |
| **Database Migrations** | Schema changes on main | Applies Prisma migrations to production |
| **Dependency Updates** | Weekly schedule | Creates issues for outdated packages |
| **Jules AI Audit** | Manual / scheduled | AI-powered codebase audits via Gemini CLI |
| **Release Management** | Version tags | Generates changelogs & GitHub releases |

### Required Repository Secrets

| Secret | Purpose |
|:-------|:--------|
| `VERCEL_TOKEN` | Vercel deployment API token |
| `VERCEL_ORG_ID` | Vercel organization identifier |
| `VERCEL_PROJECT_ID` | Vercel project identifier |
| `DATABASE_URL` | Production database (pooled connection) |
| `DIRECT_URL` | Direct database connection (migrations only) |
| `SLACK_WEBHOOK_URL` | *(Optional)* Slack notifications |

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

## Roadmap

### Shipped

- [x] 15-agent cognitive bias detection pipeline
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
