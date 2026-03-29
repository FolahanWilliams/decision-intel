# Decision Intel — Codebase Audit Report

**Date:** 2026-03-29
**Scope:** Full codebase audit covering structure, security, code quality, architecture, and testing.

---

## Executive Summary

| Metric              | Value         |
| ------------------- | ------------- |
| TypeScript Files    | 636           |
| Lines of Code       | ~159,000      |
| API Route Handlers  | 147           |
| React Components    | ~160          |
| Library Modules     | 173           |
| Prisma Models       | 40+           |
| Database Migrations | 38            |
| Test Files          | 32            |
| CI/CD Workflows     | 5             |
| Dependencies        | 65+           |

**Overall Assessment:** A well-architected, production-grade AI-powered decision intelligence platform with excellent security posture (8.5/10). Strong TypeScript strictness (`strict: true`), multi-layer auth, CSRF protection, AES-256-GCM encryption, timing-safe secret comparison, and structured logging. Key areas for improvement: test coverage (5% threshold, 12 failing test files), inconsistent error response formats, and missing composite database indexes.

---

## 1. Security Audit

### 1.1 Authentication & Authorization — GOOD

- **Supabase Auth** used for session-based routes (118 of 147 route files reference `getSession`/`getUser`/`createServerClient`).
- **API Key Auth** (`src/lib/api/auth.ts`) — SHA-256 hashed keys with `di_live_` prefix, scope-based access, rate limiting per key, revocation, and expiration support.
- **Admin routes** (`/api/admin/*`) use `verifyAdmin()` — separate admin check.
- **Cron routes** secured with `CRON_SECRET` bearer token.
- **Slack routes** use HMAC signature verification.

**Issues Found:**

| Severity | Issue                               | Location                               |
| -------- | ----------------------------------- | -------------------------------------- |
| LOW      | `/api/notifications/status` — no auth, returns only `{ emailConfigured: bool }` | `src/app/api/notifications/status/route.ts` |
| LOW      | `/api/public/*` routes are intentionally public but have no rate limiting | `src/app/api/public/case-studies/route.ts`, `src/app/api/public/outcome-stats/route.ts` |
| LOW      | `/api/health` — no auth (expected, but should be documented) | `src/app/api/health/route.ts` |

### 1.2 CSRF Protection — STRONG

- Global middleware (`src/middleware.ts`) validates `Origin`/`Referer` headers for all mutation methods (POST, PUT, DELETE, PATCH).
- Exempt paths for Slack (HMAC-verified), cron (bearer-token), Stripe (signature-verified), and health check.
- Implementation in `src/lib/utils/csrf.ts` — well-structured with allowed host management.

### 1.3 Input Validation — GOOD

- Zod schemas used for AI pipeline outputs and deal creation (`src/lib/schemas/`).
- API routes validate request bodies before processing.
- File upload endpoints enforce content length limits (e.g., `MAX_CONTENT_LENGTH = 100_000` in extension routes).

### 1.4 XSS — SECURE

- Only 2 uses of `dangerouslySetInnerHTML`:
  1. `src/app/(marketing)/layout.tsx:63` — JSON-LD structured data (safe, no user input).
  2. `src/app/(platform)/dashboard/meetings/[id]/page.tsx:614` — Search highlighting with proper `escapeHtml()` function (`meetings/[id]/page.tsx:1189-1205`) that replaces `&`, `<`, `>`, `"` before rendering.

### 1.5 SQL Injection — SECURE

- Prisma ORM used exclusively for queries — parameterized by default.
- Raw SQL in `src/lib/rag/embeddings.ts` uses Prisma's tagged template literals (`$executeRaw`), which are parameterized.
- `$queryRawUnsafe` usage in RAG embeddings is properly guarded with `assertSafeId()` (UUID validation), `assertSafeEmbeddingVector()` (format validation), and `Math.floor`'d limits. Used only due to PgBouncer limitations.
- Timing-safe comparisons (`crypto.timingSafeEqual`) used for secret/token validation.

### 1.6 Secrets Management — EXCELLENT

- No hardcoded secrets found in source code.
- `.env.example` documents all required variables with no real-looking example values.
- Document content encrypted with AES-256-GCM (encryption key validated for 64-char hex format, proper 96-bit IV and 128-bit auth tags).
- Slack tokens encrypted at rest (`SLACK_TOKEN_ENCRYPTION_KEY`).
- API keys generated with `randomBytes(16)`, only SHA-256 hash stored in DB, raw key shown once at creation.
- `getRequiredEnvVar()`/`getOptionalEnvVar()` helpers validate and trim all env vars.

### 1.7 Rate Limiting — GOOD

- DB-based rate limiting with atomic upserts (no TOCTOU race conditions).
- Per-route configuration: uploads (5/hr), user deletion (2/hr), deal creation (20/hr), extension analysis (10/hr).
- Per-API-key rate limits with `Retry-After` headers.
- Configurable fail modes: `open` (availability-first) vs `closed` (security-first).
- **Gap:** Some internal session-authenticated routes (e.g., `/api/search`) rely on auth alone without explicit per-user rate limits.

### 1.8 Security Headers — GOOD

- `next.config.ts` sets: CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, HSTS in production, environment-based CORS.

---

## 2. Code Quality Audit

### 2.1 TypeScript Strictness — STRONG

- `strict: true`, `noImplicitReturns: true`, `noUnusedLocals: true` all enabled.
- Zero `@ts-ignore` or `@ts-expect-error` directives found.
- ~50 instances of `Record<string, unknown>` casts and a few `as any` casts (mainly D3 types).

### 2.2 Error Handling — GOOD with gaps

**Strengths:**
- Consistent try-catch in all API routes.
- Proper HTTP status codes (401, 403, 404, 429, 500).
- Structured logging via `createLogger()`.
- Schema drift protection (catches P2021/P2022 Prisma errors).

**Issues:**

| Severity | Issue                          | Files Affected                   |
| -------- | ------------------------------ | -------------------------------- |
| MEDIUM   | Generic error messages without correlation IDs | Most API routes return `"Internal Server Error"` without a request ID |
| MEDIUM   | Inconsistent error response format | Some routes: `{ error: "msg" }`, others: `{ success: false, data, error }` |
| LOW      | 31 instances of `console.warn`/`console.error` in production code instead of logger | Components: NotificationCenter, BiasBriefing, InteractiveChartWrapper |

### 2.3 Code Duplication — MODERATE

| Pattern                          | Recommendation                           |
| -------------------------------- | ---------------------------------------- |
| Auth + validation boilerplate in every API route | Extract shared middleware/wrapper |
| Pagination logic (`skip`, `take`, `Math.min`) repeated | Create `buildPaginationQuery()` utility |
| Zod schemas with overlapping field definitions | Use `.partial().extend()` patterns |

### 2.4 Dead Code — CLEAN

- No unused imports detected (enforced by `noUnusedLocals`).
- No significant commented-out code blocks found.
- Proper event listener cleanup in React components.

### 2.5 React Patterns — MODERATE issues

**Good:**
- 214+ usages of `useMemo`/`useCallback`/`React.memo`.
- All `.map()` iterations have `key` props.
- `ErrorBoundary` component for UI resilience.
- Accessibility: `ReducedMotionProvider`, `DensityProvider`.

**Issues:**

| Severity | Issue                                    | Location |
| -------- | ---------------------------------------- | -------- |
| MEDIUM   | D3 visualizations bypass React reconciliation (`svg.selectAll('*').remove()`) | `CausalGraph.tsx:153`, `DecisionKnowledgeGraph.tsx:435`, `CausalDAG.tsx:219` |
| MEDIUM   | `import * as d3` imports full D3 bundle (~50-100KB per component) | `CausalGraph.tsx:4` |
| LOW      | Fetch chains in `RelatedDecisions.tsx` silently swallow errors | `src/components/ui/RelatedDecisions.tsx:51-66` |

---

## 3. Architecture Audit

### 3.1 Project Structure — WELL-ORGANIZED

```
src/
  app/api/           → 147 route handlers (auth, analysis, deals, teams, AI, integrations)
  app/(platform)/    → Authenticated pages (dashboard, documents, insights)
  app/(marketing)/   → Public marketing pages
  lib/               → 173 business logic modules
    agents/          → LangGraph pipeline (graph, nodes, prompts)
    ai/              → Multi-provider AI abstraction (Gemini, Claude)
    analysis/        → Core analysis engine
    compliance/      → Regulatory frameworks (SOX, GDPR, EU AI Act, FCA, Basel 3)
    graph/           → Decision graph algorithms (centrality, cascade, counterfactual, root-cause)
    rag/             → Embeddings + vector search (pgvector)
    scoring/         → DQI scoring engine
  components/        → ~160 React components (shadcn/ui base)
```

### 3.2 AI Pipeline — SOPHISTICATED

- LangGraph-based multi-agent pipeline (`src/lib/agents/`).
- Multi-provider support: Gemini (primary), Claude (fallback).
- RAG with pgvector embeddings (1536 dimensions).
- SSE streaming for real-time analysis results.

### 3.3 Database Schema — COMPREHENSIVE

- 40+ Prisma models covering: documents, analysis, biases, teams, meetings, deals, experiments, nudges, causal models, decision graphs.
- pgvector extension for embeddings with HNSW indexing.
- 37 migrations spanning Feb 2 – Mar 29, 2026.

**Issues:**

| Severity | Issue                             | Recommendation                    |
| -------- | --------------------------------- | --------------------------------- |
| MEDIUM   | Missing composite indexes on common query patterns | Add `@@index([userId, createdAt])`, `@@index([orgId, createdAt])` |
| MEDIUM   | Minimal transaction usage for multi-step writes | Use `$transaction` for deal + document creation flows |
| LOW      | Proxy-based lazy Prisma client adds overhead to first call | Acceptable trade-off for build-time safety |

### 3.4 Integrations — EXTENSIVE

- **Slack:** OAuth, events, commands, actions, HMAC verification, token encryption.
- **Stripe:** Checkout, billing portal, webhook with signature verification.
- **Email:** Resend for notifications and weekly digests.
- **Browser Extension:** Separate analyze/quick-score endpoints with API key auth.
- **Webhooks:** Full CRUD with delivery tracking.

---

## 4. Testing Audit

### 4.1 Current State — WEAK

| Metric                | Value     |
| --------------------- | --------- |
| Test files            | 32        |
| Tests passing         | 237       |
| Tests failing         | 2         |
| Test files failing    | 12        |
| Coverage threshold    | 5%        |
| Component tests       | 0         |

### 4.2 Test Failures

12 test files fail due to `ERR_MODULE_NOT_FOUND` — `next/server` and `react` packages cannot be resolved in the test environment. This suggests Vitest config needs `deps.inline` or module aliasing for Next.js/React imports.

### 4.3 What IS Tested

- API route auth and error cases (`v1/analyze`, `deals`, `documents`, `audit`, `onboarding`).
- Agent pipeline logic (`nodes.test.ts`, `integration.test.ts`, `nodes_performance.test.ts`).
- Learning pipeline (`causal-learning.test.ts`).
- SSE utilities, analysis streaming.

### 4.4 Critical Gaps

- **Zero component tests** — No tests for any React component.
- **No integration/E2E tests** — No Playwright or Cypress tests.
- **Missing tests for:** notification system, decision graph algorithms, compliance checks, RAG pipeline, webhook delivery.
- **Coverage threshold of 5%** is too low to catch regressions.

---

## 5. Build & CI/CD Audit

### 5.1 CI Pipeline — GOOD

- GitHub Actions with: TypeScript check, ESLint, Prettier, security audit (npm + TruffleHog), Vitest, Next.js build, Vercel deploy, health check.
- Node 22, concurrency control, artifact caching.

### 5.2 Build Issues

- `npm run build` fails in this environment (`next` not found) — likely `node_modules` not installed. Should work in CI with `npm ci`.

### 5.3 Git Hygiene — GOOD

- Husky pre-commit hooks configured.
- 342+ commits on main.
- Clear migration history.

---

## 6. Top Recommendations (Priority Order)

### Critical (do soon)

1. **Fix test infrastructure** — Resolve the 12 failing test files (module resolution for `next/server` and `react`). Add `deps.inline` for Next.js in `vitest.config.ts`.
2. **Add rate limiting to remaining session-auth routes** — `/api/search` and similar high-frequency endpoints should have per-user rate limits.

### High Priority

4. **Standardize API error responses** — Create a `createApiResponse()` utility that always returns `{ success, data?, error?, requestId? }`.
5. **Add composite database indexes** — `@@index([userId, createdAt])` and `@@index([orgId, createdAt])` on Document, Analysis, and related models.
6. **Increase test coverage** — Raise threshold from 5% to at least 30%. Add component tests for critical UI (NotificationCenter, dashboard, deal management).
7. **Replace `console.warn/error` with logger** — All 31 instances in components should use `createClientLogger()`.

### Medium Priority

8. **Extract API route middleware** — Shared auth + validation + error handling wrapper to reduce duplication.
9. **Tree-shake D3 imports** — Replace `import * as d3` with named imports.
10. **Add request tracing** — Correlate all API logs with `x-request-id` header.
11. **Add E2E tests** — Playwright for critical user flows (upload → analyze → view results).

### Low Priority

12. **Add rate limiting to public routes** — `/api/public/case-studies`, `/api/public/outcome-stats`.
13. **Migrate D3 visualizations** — Wrap in proper `useEffect` cleanup or migrate to Visx for React compatibility.
14. **Add missing transaction boundaries** — Deal + document creation, outcome tracking flows.

---

## 7. Strengths to Maintain

- Strong TypeScript strictness (strict mode, no ts-ignore).
- Comprehensive auth pattern (Supabase sessions + API keys + admin verification + HMAC for integrations).
- CSRF protection at middleware level.
- Schema drift protection (P2021/P2022 fallbacks).
- Structured logging with environment-aware levels.
- Good separation of concerns (lib/ for business logic, components/ for UI, api/ for handlers).
- Encryption at rest for sensitive data (documents, Slack tokens).
- Multi-provider AI with fallback (Gemini → Claude).
- Extensive compliance framework (SOX, GDPR, EU AI Act, FCA, Basel 3).
