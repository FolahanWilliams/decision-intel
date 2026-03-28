# Areas for Improvement

A comprehensive audit of the Decision Intelligence Platform codebase, identifying security vulnerabilities, architectural issues, code quality concerns, and opportunities for enhancement.

> **Audit Remediation (2026-03-28):** Items marked **RESOLVED** were addressed in the codebase audit remediation pass. Additional hardening applied: Prisma schema relations/cascades/indexes, Zod schema bounds for all AI pipeline scores, rate limiting on unprotected endpoints, org creation race condition fix, Zod validation detail suppression, stream processing timeout, AbortController cleanup in hooks, and ErrorBoundary wrappers on all platform pages.

---

## 1. Critical Security Issues

### 1.1 GDPR Anonymizer Fails Open — PII Leakage Risk

**Severity:** CRITICAL
**File:** `src/lib/agents/nodes.ts:373-381`

**STATUS: RESOLVED (2026-03-28)** — The GDPR anonymizer now fails closed. On error, it sets `anonymizationStatus: 'failed'` and the graph's conditional edge (`shouldContinueAfterAnonymization`) blocks the pipeline from reaching any LLM nodes. Content never reaches external APIs if anonymization fails.

---

### 1.2 PII Sent to Gemini Before Anonymization

**Severity:** HIGH
**File:** `src/lib/agents/graph.ts:101-112`

**STATUS: RESOLVED (2026-03-28)** — A conditional edge (`shouldContinueAfterAnonymization`) now gates the pipeline. If anonymization fails, the graph routes directly to the end node, preventing any PII from reaching LLM APIs.

---

### 1.3 Fact Checker Returns Score 0 on Failure (Improved, But Still Problematic)

**Severity:** MEDIUM
**File:** `src/lib/agents/nodes.ts:498-501`

**STATUS: RESOLVED (2026-03-28)** — The risk scorer now uses `factCheck.score ?? 50` (nullish coalescing) instead of `|| 100`. A null/undefined score defaults to 50 (neutral), not 100 (perfect trust). A score of 0 is preserved as 0.

---

### 1.4 Prompt Injection via Unsanitized Financial Data

**Severity:** MEDIUM
**File:** `src/lib/agents/nodes.ts:439-469`

**STATUS: RESOLVED (2026-03-28)** — All external data is now wrapped with `sanitizeForPrompt()` which escapes `&`, `<`, `>`, `"`, and `'` characters. Financial data is enclosed in XML-delimited blocks to prevent prompt injection.

---

### 1.5 Rate Limiting Fails Open

**Severity:** LOW
**File:** `src/lib/utils/rate-limit.ts:122-131`

On any Postgres error, rate limiting allows the request through:

```ts
} catch (error) {
    console.error('Rate limit check error:', error);
    return { success: true, ... };
}
```

This is a reasonable availability trade-off for most use cases, but should be documented as an explicit design decision and monitored.

**Recommendation:** Add monitoring/alerting for rate limit failures. Consider a configurable `fail-open` vs `fail-closed` strategy per route.

---

## 2. Architectural Issues

### 2.1 Oversized Document Detail Page Component

**File:** `src/app/(platform)/documents/[id]/page.tsx` (~79KB)

This single file contains all analysis result rendering, SSE streaming logic, and 8+ interactive widget components. It is difficult to maintain, test, and reason about.

**Recommendation:** Extract into smaller, focused components:
- `AnalysisStreamManager` (SSE connection and state)
- `BiasResultsPanel`
- `NoiseJudgePanel`
- `FactCheckPanel`
- `CompliancePanel`
- `DecisionTwinPanel`
- `RiskScoreOverview`

---

### 2.2 No Error Boundaries in Analysis Views

**File:** `src/app/(platform)/documents/[id]/page.tsx`

**STATUS: RESOLVED (2026-03-28)** — `ErrorBoundary` component (`src/components/ErrorBoundary.tsx`) wraps all major page content components across 30+ platform pages. Individual analysis tabs (Overview, Noise, SWOT, Boardroom, RedTeam) are also wrapped.

---

### 2.3 Fallback Timeout Mismatch in Analyzer

**File:** `src/lib/analysis/analyzer.ts:366-367`

When streaming fails and the analyzer falls back to `.invoke()`, the timeout is set to 25 seconds:

```ts
setTimeout(() => reject(new Error("Analysis timed out after 25 seconds")), 25000)
```

However, the API route sets `maxDuration = 300` (5 minutes), and individual LLM nodes use 90-second timeouts. The 25-second fallback timeout will almost certainly expire before the graph completes, making the fallback effectively useless for any real analysis.

**Recommendation:** Align the fallback timeout with the expected graph execution time (e.g., 240 seconds).

---

### 2.4 Lazy Singleton Graph Instance May Leak Across Requests

**File:** `src/lib/analysis/analyzer.ts:246-255`

**STATUS: RESOLVED (2026-03-28)** — The compiled graph is stateless by design. The singleton pattern is now implemented as a lazy initializer that caches the compiled graph instance, which holds no mutable state.

---

### 2.5 `messages` State Field in Graph Is Unused

**File:** `src/lib/agents/graph.ts:80-83`

**STATUS: RESOLVED (2026-03-28)** — The unused `messages` field and `BaseMessage` import have been removed from the graph state.

---

## 3. Code Quality

### 3.1 122 Console Statements in Production Code

**STATUS: RESOLVED (2026-03-28)** — A structured logger (`src/lib/utils/logger.ts`) with configurable log levels (debug, info, warn, error) controlled via `LOG_LEVEL` env var is used throughout the codebase. Only ~7 console statements remain, all in appropriate contexts (e.g., startup messages).

---

### 3.2 All Safety Settings Disabled on Gemini Models

**File:** `src/lib/agents/nodes.ts:46-49, 74-79`

**STATUS: RESOLVED (2026-03-28)** — Safety settings are now context-appropriate per node. Nodes processing user-uploaded financial/legal documents (which may contain sensitive terms) use relaxed settings, while other nodes use stricter defaults.

---

### 3.3 Duplicated Model Initialization

**File:** `src/lib/agents/nodes.ts:32-83`

**STATUS: RESOLVED (2026-03-28)** — Model initialization uses a lazy singleton pattern. Model names are centralized via `GEMINI_MODEL_NAME` env var with consistent defaults across all files (health check, trends, graph narrative, cost tracking).

---

### 3.4 Duplicated Grounding Metadata Extraction

**File:** `src/lib/agents/nodes.ts` (lines 208-209, 301-304, 476-479, 669-672)

The pattern for extracting search sources from grounding metadata is copy-pasted four times:

```ts
const metadata = result.response.candidates?.[0]?.groundingMetadata;
const searchSources: string[] = metadata?.groundingChunks
    ?.map((c: { web?: { uri?: string } }) => c.web?.uri)
    .filter((u: unknown): u is string => typeof u === 'string') || [];
```

**Recommendation:** Extract into a `extractSearchSources(response)` utility function.

---

### 3.5 `as any` Type Assertion in Database Write

**File:** `src/lib/analysis/analyzer.ts:164-165`

```ts
} as any
```

The Prisma create call uses `as any` to bypass TypeScript checking on the analysis data shape. While documented as "schema drift protection," this disables type safety for the most critical data persistence operation.

**Recommendation:** Keep the `as any` for the schema drift use case, but add Zod validation *before* the database write to ensure the data shape is valid at runtime.

---

## 4. CI/CD Pipeline

### 4.1 `continue-on-error: true` on Critical Quality Jobs

**File:** `.github/workflows/ci-cd.yml:88, 92, 114, 152`

ESLint, Prettier, npm audit, and test jobs all use `continue-on-error: true`, meaning the pipeline passes even when:
- TypeScript errors exist (though `tsc --noEmit` does fail the job)
- Linting violations are present
- Tests fail
- Known security vulnerabilities exist

**Recommendation:** Remove `continue-on-error` from the test job at minimum — tests should block deployment. Consider creating a separate "informational" pipeline for lint/format that doesn't block, while keeping tests and security as hard gates.

---

### 4.2 Build Does Not Depend on Tests

**File:** `.github/workflows/ci-cd.yml:160`

The build job depends on `[quality, security]` but not `test`. Production deployment depends on `[build, test]`, so tests don't need to pass before building, but the test job runs in parallel. If tests fail, the build artifact has already been created.

This is a minor concern since deploy-production does gate on tests, but it means build artifacts may be uploaded for code that doesn't pass tests.

**Recommendation:** Add `test` to the build job's `needs` array to prevent building untested code.

---

### 4.3 No Test Coverage Reporting

The pipeline runs tests but does not collect or report coverage metrics. There's no coverage threshold enforcement.

**Recommendation:** Add `vitest --coverage` with a minimum threshold (e.g., 60%) and upload coverage reports as artifacts. Consider integrating with Codecov or similar.

---

## 5. Testing

### 5.1 Low Test Coverage for Critical Paths

**46 total tests across 9 files.** Key untested areas:

- **API routes** (`/api/analyze`, `/api/upload`, `/api/documents`) — no unit tests for request validation, auth, or error handling
- **Rate limiting** — no tests for the Postgres-based rate limiter
- **SSE streaming end-to-end** — the `useAnalysisStream` hook has no tests
- **PDF/CSV report generation** — no tests for export functionality
- **Frontend components** — zero component tests for any visualization or page component
- **Auth middleware** — no tests for Supabase Auth integration or extension API key auth

**Recommendation:** Prioritize testing for API routes (they are the system boundary) and the rate limiter. Add integration tests for the SSE streaming pipeline.

---

### 5.2 Performance Tests Lack Meaningful Assertions

**File:** `src/lib/agents/nodes_performance.test.ts`

The performance test measures execution time but the assertions only check that the result is defined, not that it meets performance budgets.

**Recommendation:** Add performance budget assertions (e.g., `expect(duration).toBeLessThan(5000)`).

---

## 6. Operational Concerns

### 6.1 No Structured Error Tracking

Errors are logged to `console.error` but there is no integration with an error tracking service (Sentry, Datadog, etc.). In a production deployment, errors in serverless functions are ephemeral and hard to debug.

**Recommendation:** Integrate an error tracking service, especially for the AI pipeline nodes which can fail in subtle ways (malformed JSON from LLM, safety blocks, timeouts).

---

### 6.2 No Health Metrics Beyond Basic Health Check

**STATUS: RESOLVED (2026-03-28)** — The `/api/health` endpoint now reports comprehensive metrics: database connection pool stats, LLM API health (with cached probe), Supabase Storage connectivity, cache backend stats, and schema drift detection. Returns appropriate HTTP status codes (200/503) based on service health.

---

### 6.3 Redis Cache Is Optional With No Fallback Monitoring

**File:** `src/lib/utils/cache.ts`

When `REDIS_URL` is not set, caching silently falls back to no-op. There's no way to know from logs or metrics whether caching is active.

**Recommendation:** Log once at startup whether caching is enabled. Add cache hit/miss counters to the health endpoint.

---

## Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 1 | 1 | 2 | 1 |
| Architecture | — | 1 | 3 | 1 |
| Code Quality | — | — | 3 | 2 |
| CI/CD | — | 1 | 1 | 1 |
| Testing | — | 1 | 1 | — |
| Operations | — | 1 | 2 | — |

**Top 5 priorities:**
1. Fix GDPR anonymizer fail-open behavior (PII leakage)
2. Guard against PII reaching LLM APIs when anonymization fails
3. Add error boundaries to the analysis results UI
4. Remove `continue-on-error` from test job in CI/CD
5. Introduce structured logging to replace 122 console statements
