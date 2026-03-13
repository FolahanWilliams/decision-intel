# Copilot Instructions — Decision Intelligence Platform

## Project Overview

This is a **Next.js 14** application (App Router) with **Prisma ORM**, **Supabase Auth**, a **LangGraph AI pipeline**, and **Supabase Postgres**. The platform audits decision documents by running them through a multi-agent AI pipeline that detects cognitive biases, measures decision noise, checks facts, and produces a risk score.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Lint | `npm run lint` |
| Tests (Vitest) | `npm test` |
| Prisma generate | `npm run prisma:generate` |
| Prisma migrate | `npm run prisma:migrate` |

## Repository Structure

```
src/
  app/
    api/           → Route handlers (upload, analyze/stream, documents, audit)
    (platform)/    → Authenticated pages (dashboard, documents, insights)
  lib/
    analysis/      → LangGraph pipeline (analyzer.ts, nodes)
    agents/        → Individual AI agent nodes
    rag/           → Embeddings and vector search
    utils/         → Shared utilities (logger, error, rate-limit, prisma-json)
  components/
    ui/            → Reusable UI components
    visualizations/ → Charts, gauges, treemaps
  hooks/           → Custom React hooks
prisma/
  schema.prisma    → Database schema
  migrations/      → SQL migrations
```

## Code Conventions

- All client components must include the `'use client'` directive at the top.
- Never read `localStorage` or `window` inside a `useState` initializer — use `useEffect` to avoid React hydration mismatches (error #418).
- Never render `new Date()` directly in JSX — capture timestamps in state via `useEffect` or at event-creation time.
- Prisma queries that select newer/extended columns must include schema-drift fallback: catch `P2021`/`P2022` errors and retry with core fields only. The fallback **must** run in a separate `$transaction` because PostgreSQL poisons the entire transaction block after a column-not-found error.
- Use `toPrismaJson()` from `@/lib/utils/prisma-json` when writing JSON fields to Prisma.
- All AI pipeline output must be validated with **Zod schemas** before database persistence.

## Git Workflow

- **Always rebase onto `origin/main` before every push** — never merge main into a feature branch.
- Use `git push --force-with-lease` (not bare `--force`) after rebasing.
- Before opening or updating a PR verify the branch is not behind main:
  - `git log --oneline origin/main..HEAD` — should show only your commits.
  - `git log --oneline HEAD..origin/main` — should be empty.

```bash
git fetch origin main
git rebase origin/main
git push --force-with-lease -u origin <branch-name>
```

## AI Pipeline Architecture (LangGraph)

The analysis pipeline is a directed graph. A document passes through **sequential preprocessing**, then fans out into **parallel analysis** agents, then converges at the **risk scorer**.

### Execution Flow

1. **Ingestion** — raw document text enters the graph.
2. **Preprocessing (sequential)**
   - `gdprAnonymizer` — redacts PII (`[PERSON_1]`, etc.).
   - `structurer` — cleans formatting and identifies speakers.
3. **Analysis (parallel)**
   - `biasDetective` — detects 15 cognitive biases.
   - `noiseJudge` — runs 3 independent LLM judges; measures score variance.
   - `factChecker` — verifies claims against real-time financial data (FMP API).
   - `preMortem` — generates failure scenarios and preventive measures.
   - `complianceMapper` — checks Consumer Duty regulatory alignment.
   - `sentimentAnalyzer` — scores emotional tone (−1 to 1).
4. **Synthesis** — `riskScorer` aggregates all data into a final JSON report.

### Risk Score Formula

```
Score = Base(NoiseMean) - BiasPenalties - (NoiseStdDev × 4) - (TrustPenalty × 0.2)
```

Base defaults to the noise mean (or 100 when undefined). A noise standard deviation > 10 indicates an ambiguous or poorly-reasoned document.

### State Channels (`GraphState`)

| Channel | Reducer | Purpose |
|---------|---------|---------|
| `documentId` | Overwrite | Unique document identifier |
| `originalContent` | Overwrite | Raw input text |
| `structuredContent` | Overwrite | Cleaned/redacted text for downstream nodes |
| `speakers` | Overwrite | Speakers identified in the text |
| `biasAnalysis` | **Append** | Bias findings (supports multiple detectors) |
| `noiseScores` | **Append** | Scores from the 3 parallel noise judges |
| `noiseStats` | Overwrite | `{ mean, stdDev, variance }` |
| `factCheckResult` | Overwrite | Trust score and verification flags |
| `preMortem` | Overwrite | Failure scenarios and preventive measures |
| `compliance` | Overwrite | Compliance status (`PASS`/`WARN`/`FAIL`) and details |
| `sentimentAnalysis` | Overwrite | Sentiment score and label |
| `finalReport` | Overwrite | Final database-ready JSON object |
| `messages` | **Append** | LangChain conversation history |

## Known Patterns

### JSON Resilience
All agent nodes use a `parseJSON` helper that extracts JSON from "chatty" LLM responses via regex (`/\{[\s\S]*\}/`) and returns safe empty objects on failure.

### SSE Streaming
Analysis results stream via Server-Sent Events at `/api/analyze/stream`. Use `formatSSE()` from `@/lib/sse`.

### Audit Logging
Use `logAudit()` from `@/lib/audit` for user-facing actions (fire-and-forget pattern).

### Schema Drift Protection
Production DB may lag behind the Prisma schema. All read/write paths that reference newer columns must catch `P2021`/`P2022` and fall back to core-only fields in a **new** `$transaction`.

## Safe Refactoring Rules for Agent Nodes (`src/lib/agents/nodes.ts`)

1. **Immutable State** — do NOT remove existing keys from `AuditState` or return objects that violate the interface.
2. **Input Preservation** — if a node fails it MUST return at least its input state keys to prevent graph disconnects.
3. **JSON Safety** — all new LLM calls MUST use the `parseJSON` helper.
4. **Schema Changes** — if `AnalysisResult` changes, update `prisma/schema.prisma` and run `npx prisma migrate dev`.
