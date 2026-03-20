# Comprehensive Improvement Plan — Decision Intel

## Scope

This plan covers 7 improvement tracks batched into a single implementation effort:

1. **Architecture & Performance** — SSE reconnection, connection pooling, edge caching, batch embeddings
2. **Security Hardening** — bcrypt passwords, CSRF middleware, CSP headers, share link audit logging
3. **Reliability & Observability** — structured error tracking, enriched health checks, dead letter queue, schema drift monitoring
4. **Analysis Versioning** — store analysis history per document, show score diffs
5. **Export & Bulk Upload** — expose report exports in UI, add batch document upload queue
6. **Prompt Versioning** — track prompt versions per analysis, enable A/B testing
7. **User Feedback Loop** — connect outcome data back to prompt selection and persona weighting

---

## Phase 1: Database Schema Evolution

All schema changes go into a single Prisma migration. Every new column/table needed across all 7 tracks is consolidated here to minimize migration count.

### New Models

```prisma
model AnalysisVersion {
  id            String   @id @default(cuid())
  analysisId    String
  analysis      Analysis @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  version       Int      @default(1)
  overallScore  Float
  noiseScore    Float
  summary       String
  biases        Json     // snapshot of BiasInstance[] at this version
  fullSnapshot  Json     // complete analysis output snapshot
  createdAt     DateTime @default(now())

  @@unique([analysisId, version])
  @@index([analysisId])
}

model PromptVersion {
  id          String   @id @default(cuid())
  name        String   // e.g. "BIAS_DETECTIVE_PROMPT", "SIMULATION_SUPER_PROMPT"
  version     Int
  hash        String   // SHA-256 of prompt content for change detection
  content     String   @db.Text
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@unique([name, version])
  @@index([name, isActive])
}

model FailedAnalysis {
  id          String   @id @default(cuid())
  documentId  String
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  userId      String
  error       String
  errorCode   String?
  input       Json     // serialized pipeline input for retry
  retryCount  Int      @default(0)
  maxRetries  Int      @default(3)
  nextRetryAt DateTime?
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())

  @@index([resolvedAt])
  @@index([nextRetryAt])
}

model ShareLinkAccess {
  id          String   @id @default(cuid())
  shareLinkId String
  shareLink   ShareLink @relation(fields: [shareLinkId], references: [id], onDelete: Cascade)
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([shareLinkId])
}

model BatchUpload {
  id          String   @id @default(cuid())
  userId      String
  orgId       String?
  status      String   @default("pending") // pending, processing, completed, failed
  totalFiles  Int
  completed   Int      @default(0)
  failed      Int      @default(0)
  errors      Json?    // [{filename, error}]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, status])
}
```

### Schema Modifications to Existing Models

```prisma
// Analysis — add version tracking and prompt reference
model Analysis {
  // ... existing fields ...
  version         Int       @default(1)
  promptVersionId String?   // FK to PromptVersion used for this analysis
  versions        AnalysisVersion[]
}

// ShareLink — add access log relation
model ShareLink {
  // ... existing fields ...
  analysis   Analysis @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  accesses   ShareLinkAccess[]
}

// Document — add relation for failed analyses
model Document {
  // ... existing fields ...
  failedAnalyses FailedAnalysis[]
}
```

### Migration Steps

1. Run `npx prisma migrate dev --name add_versioning_observability_batch`
2. Commit the generated `prisma/migrations/` folder
3. Run `npx prisma generate` to update the client

---

## Phase 2: Architecture & Performance

### 2A. SSE Heartbeat & Resumable Streaming

**Files to modify:**
- `src/app/api/analyze/stream/route.ts`
- `src/hooks/useAnalysisStream.ts`
- `src/lib/sse.ts`

**Changes:**

1. **Server — Add heartbeat & event IDs to SSE stream:**
   - Add `formatSSE()` overload accepting an `id` parameter: `id: {eventId}\ndata: {json}\n\n`
   - Emit a `:heartbeat\n\n` comment every 15 seconds during LLM processing gaps
   - Assign monotonically increasing event IDs to each SSE message
   - Track pipeline checkpoint state in `CacheEntry` with key `stream:{documentId}:{userId}`
   - On stream start, check `Last-Event-ID` header; if present, resume from that checkpoint

2. **Client — Reconnect with resume:**
   - Parse `id:` field from SSE events, store latest ID
   - On reconnect, send `Last-Event-ID` header with stored ID
   - Skip already-received events (deduplicate by ID)
   - Show "Reconnecting..." UI state between disconnect and reconnect

### 2B. Database Connection Pooling

**Files to modify:**
- `src/lib/prisma.ts`

**Changes:**
- Add explicit `max` pool size to the `pg.Pool` constructor based on environment:
  - Development: `max: 5`
  - Production (Vercel serverless): `max: 2` per function instance (Supavisor handles upstream pooling)
- Add `idleTimeoutMillis: 30000` and `connectionTimeoutMillis: 10000`
- Log pool stats (total, idle, waiting) in health check

### 2C. Edge Caching for Share Links

**Files to modify:**
- `src/app/api/share/route.ts`

**Changes:**
- Add `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` header to GET response
- Add `ETag` header based on `link.updatedAt` timestamp
- Check `If-None-Match` header and return 304 when unchanged
- This enables Vercel Edge Network and browser caching without code complexity

### 2D. Batch Embedding Generation

**Files to modify:**
- `src/lib/rag/embeddings.ts`

**Changes:**
- Modify `generateEmbeddings()` to accept an array of texts (up to 100 per API call)
- Use Gemini's batch embedding endpoint instead of single-text calls
- Chunk input texts into groups of 100, process groups in parallel (concurrency 3)
- Fall back to single-text mode on batch API failure
- Add batch size metric logging

---

## Phase 3: Security Hardening

### 3A. bcrypt for Share Link Passwords

**Files to modify:**
- `src/app/api/share/route.ts`
- `package.json` (add `bcryptjs` dependency)

**Changes:**
- Replace SHA-256 hashing with `bcrypt.hash(password, 12)` for password creation
- Replace SHA-256 comparison with `bcrypt.compare(password, hash)` for verification
- Add migration path: if stored hash is 64 chars (SHA-256 hex), compare with old method and re-hash on successful match (transparent upgrade)

### 3B. CSRF Protection Middleware

**Files to modify:**
- `src/middleware.ts`
- New file: `src/lib/utils/csrf.ts`

**Changes:**
- Create `validateOrigin(request)` utility:
  - For mutation methods (POST, PUT, DELETE, PATCH), check `Origin` or `Referer` header
  - Compare against `NEXT_PUBLIC_APP_URL` and `localhost` (dev)
  - Exempt: `/api/integrations/slack/events` (Slack sends its own signature), `/api/cron/*` (uses Bearer token), `/api/share` GET (public)
- Integrate into `middleware.ts` before `updateSession()`
- Return 403 with `{ error: 'CSRF validation failed' }` on mismatch

### 3C. Content Security Policy Headers

**Files to modify:**
- `next.config.ts`

**Changes:**
- Add CSP headers via `headers()` config:
  ```
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';  // Next.js requires these
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com;
  frame-ancestors 'none';
  ```
- Add `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`

### 3D. Share Link Access Audit Logging

**Files to modify:**
- `src/app/api/share/route.ts`

**Changes:**
- After successful share link access (GET with valid token), create `ShareLinkAccess` record:
  ```typescript
  prisma.shareLinkAccess.create({
    data: {
      shareLinkId: link.id,
      ipAddress: clientIp,
      userAgent: req.headers.get('user-agent')?.slice(0, 256) || null,
    },
  }).catch(err => log.warn('Share access log failed:', err));
  ```
- Add GET endpoint `/api/share/access?linkId=xxx` for link owners to view access history

---

## Phase 4: Reliability & Observability

### 4A. Structured Error Tracking

**Files to modify:**
- `src/lib/utils/logger.ts`
- New file: `src/lib/utils/error-tracker.ts`

**Changes:**
- Create `ErrorTracker` class that:
  - Captures error context (user ID, route, request metadata)
  - Persists critical errors to `AuditLog` table with action = `'system_error'`
  - Groups errors by fingerprint (error message + stack trace hash) for deduplication
  - Exposes `trackError(error, context)` function
- Integrate into all API route catch blocks: replace standalone `log.error()` with `trackError()` for 5xx errors
- Add `/api/admin/errors` endpoint (admin-only) to view recent system errors

### 4B. Enriched Health Check

**Files to modify:**
- `src/app/api/health/route.ts`

**Changes:**
- Add checks for:
  1. **Database:** `SELECT 1` (existing) + connection pool stats
  2. **LLM Availability:** Lightweight `models.get()` call to Gemini API (cached for 5 min)
  3. **Embedding Service:** Verify embedding model endpoint is reachable
  4. **Storage:** Check Supabase Storage bucket accessibility
  5. **Schema Drift:** Compare expected model fields vs actual DB columns for critical tables (Analysis, Document)
- Return degraded status (200 with warnings) if non-critical services are down
- Return 503 only if database is unreachable

### 4C. Dead Letter Queue for Failed Analyses

**Files to modify:**
- `src/lib/analysis/analyzer.ts`
- `src/app/api/analyze/stream/route.ts`
- New file: `src/app/api/admin/retry-failed/route.ts`

**Changes:**
- On pipeline failure, persist to `FailedAnalysis` table:
  ```typescript
  await prisma.failedAnalysis.create({
    data: {
      documentId,
      userId,
      error: getSafeErrorMessage(err),
      errorCode: err.code || null,
      input: { content: truncatedContent, options },
      nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min initial retry
    },
  });
  ```
- Create `/api/admin/retry-failed` POST endpoint to manually retry failed analyses
- Add automatic retry logic in cron: pick up `FailedAnalysis` where `nextRetryAt < now` and `retryCount < maxRetries`
- Exponential backoff: 5min → 30min → 2hr for retry intervals
- Mark `resolvedAt` when retry succeeds

### 4D. Schema Drift Monitoring

**Files to modify:**
- `src/app/api/health/route.ts`

**Changes:**
- Add a `checkSchemaDrift()` function:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'Analysis' AND table_schema = 'public'
  ```
- Compare returned columns against expected columns from Prisma schema
- Log warnings for missing columns (schema behind) or extra columns (schema ahead)
- Include drift status in health check response

---

## Phase 5: Analysis Versioning & Export

### 5A. Analysis Versioning

**Files to modify:**
- `src/lib/analysis/analyzer.ts`
- `src/app/api/analyze/stream/route.ts`
- `src/app/api/documents/[id]/route.ts`
- New file: `src/app/api/analyses/[id]/versions/route.ts`

**Changes:**

1. **On re-analysis of existing document:**
   - Before overwriting the Analysis record, snapshot current state into `AnalysisVersion`:
     ```typescript
     const existing = await prisma.analysis.findUnique({ where: { documentId }, include: { biases: true } });
     if (existing) {
       await prisma.analysisVersion.create({
         data: {
           analysisId: existing.id,
           version: existing.version,
           overallScore: existing.overallScore,
           noiseScore: existing.noiseScore,
           summary: existing.summary,
           biases: existing.biases.map(b => ({ biasType: b.biasType, severity: b.severity })),
           fullSnapshot: toPrismaJson(existing),
         },
       });
       // Increment version on the Analysis record
       await prisma.analysis.update({ where: { id: existing.id }, data: { version: { increment: 1 } } });
     }
     ```

2. **GET `/api/analyses/[id]/versions`:**
   - Return all versions for a given analysis, ordered by version desc
   - Include score diff between consecutive versions

3. **UI — Version History Panel:**
   - Add a "Version History" tab on the document detail page
   - Show timeline of scores with sparkline
   - Expandable diff showing which biases were added/removed between versions

### 5B. Export UI Integration

**Files to modify:**
- `src/app/(platform)/documents/[id]/page.tsx`
- New file: `src/app/api/analyses/[id]/export/route.ts`

**Changes:**

1. **API endpoint `/api/analyses/[id]/export?format=pdf|csv|json|md`:**
   - Fetch analysis + biases + document metadata
   - Call the appropriate generator from `src/lib/reports/`
   - Return file with correct Content-Type and Content-Disposition headers
   - Rate limit: 10 exports per hour per user

2. **UI — Export Dropdown:**
   - Add dropdown button on document detail page with format options
   - Download file via fetch + blob URL
   - Show loading spinner during generation

### 5C. Bulk Document Upload

**Files to modify:**
- `src/app/api/upload/route.ts` (modify to support batch)
- New file: `src/app/api/upload/batch/route.ts`
- `src/app/(platform)/dashboard/page.tsx`

**Changes:**

1. **POST `/api/upload/batch`:**
   - Accept `FormData` with multiple files (up to 10)
   - Create a `BatchUpload` record to track progress
   - For each file: validate, create Document record, upload to storage
   - Return `batchId` immediately, process analysis asynchronously
   - Rate limit: 2 batch uploads per hour

2. **GET `/api/upload/batch?id=xxx`:**
   - Return batch progress (completed/failed/total)
   - Include per-file status and error messages

3. **UI — Multi-file Upload Zone:**
   - Enable drag-and-drop of multiple files
   - Show per-file progress bars
   - Poll batch status endpoint for completion updates

---

## Phase 6: Prompt Versioning

### 6A. Prompt Registry

**Files to modify:**
- `src/lib/agents/prompts.ts`
- New file: `src/lib/agents/prompt-registry.ts`

**Changes:**

1. **Prompt Registry:**
   ```typescript
   // src/lib/agents/prompt-registry.ts
   import { prisma } from '@/lib/prisma';
   import { hashContent } from '@/lib/utils/resilience';

   const PROMPT_CACHE = new Map<string, { content: string; id: string; version: number }>();

   export async function getActivePrompt(name: string): Promise<{ id: string; content: string; version: number }> {
     // Check in-memory cache first
     if (PROMPT_CACHE.has(name)) return PROMPT_CACHE.get(name)!;

     // DB lookup
     let prompt = await prisma.promptVersion.findFirst({
       where: { name, isActive: true },
       orderBy: { version: 'desc' },
     });

     // If no DB record, seed from hardcoded prompts (backward compat)
     if (!prompt) {
       const hardcoded = getHardcodedPrompt(name);
       prompt = await prisma.promptVersion.create({
         data: { name, version: 1, hash: hashContent(hardcoded), content: hardcoded, isActive: true },
       });
     }

     const result = { id: prompt.id, content: prompt.content, version: prompt.version };
     PROMPT_CACHE.set(name, result);
     return result;
   }
   ```

2. **Integration with Pipeline:**
   - Each agent node calls `getActivePrompt('BIAS_DETECTIVE_PROMPT')` instead of importing the constant
   - Store `promptVersionId` on the Analysis record after completion
   - Clear prompt cache on prompt update

3. **Admin API `/api/admin/prompts`:**
   - GET: List all prompt versions with usage counts
   - POST: Create new version (auto-increments version number, deactivates previous)
   - Supports A/B testing by activating specific versions for specific percentage of users

---

## Phase 7: User Feedback Loop Integration

### 7A. Connect Outcomes to Pipeline

**Files to modify:**
- `src/lib/agents/nodes.ts` (simulationNode)
- `src/lib/agents/prompts.ts` (SIMULATION_SUPER_PROMPT)
- `src/lib/rag/embeddings.ts`

**Changes:**

1. **Outcome-Aware Simulation:**
   - In `simulationNode`, query `DecisionOutcome` for similar past documents:
     ```typescript
     const pastOutcomes = await searchSimilarWithOutcomes(state.originalContent, 5);
     const outcomeContext = pastOutcomes
       .filter(o => o.outcome)
       .map(o => `Document "${o.filename}" (score: ${o.overallScore}): outcome=${o.outcome.outcome}, ` +
         `confirmed biases: ${o.outcome.confirmedBiases?.join(', ') || 'none'}, ` +
         `false positives: ${o.outcome.falsPositiveBiases?.join(', ') || 'none'}`)
       .join('\n');
     ```
   - Inject `outcomeContext` into the simulation prompt as a "Historical Record" section
   - Weight persona votes based on past accuracy (`mostAccurateTwin` field)

2. **Prompt Auto-Tuning:**
   - Track per-prompt-version accuracy:
     ```sql
     SELECT pv.id, pv.version,
       AVG(CASE WHEN do.outcome = 'success' THEN a."overallScore" END) as avg_success_score,
       COUNT(do.id) as outcome_count
     FROM "PromptVersion" pv
     JOIN "Analysis" a ON a."promptVersionId" = pv.id
     JOIN "DecisionOutcome" do ON do."analysisId" = a.id
     GROUP BY pv.id
     ```
   - Surface accuracy metrics in admin dashboard
   - Flag prompts whose analyses correlate with `failure` outcomes

3. **Feedback Weighting in Bias Detection:**
   - Query `BiasInstance.userRating` aggregates per bias type
   - If a bias type has >70% negative ratings across analyses, reduce its severity weight in `riskScorerNode`
   - Log when feedback adjustments are applied

---

## Implementation Order & Dependencies

```
Phase 1: Schema Migration (MUST be first — all other phases depend on new tables)
    │
    ├── Phase 2A: SSE Heartbeat (independent)
    ├── Phase 2B: Connection Pooling (independent)
    ├── Phase 2C: Edge Caching (independent)
    ├── Phase 2D: Batch Embeddings (independent)
    │
    ├── Phase 3A: bcrypt Passwords (independent)
    ├── Phase 3B: CSRF Middleware (independent)
    ├── Phase 3C: CSP Headers (independent)
    ├── Phase 3D: Share Access Logging (depends on Phase 1: ShareLinkAccess model)
    │
    ├── Phase 4A: Error Tracking (independent)
    ├── Phase 4B: Health Check (independent)
    ├── Phase 4C: Dead Letter Queue (depends on Phase 1: FailedAnalysis model)
    ├── Phase 4D: Schema Drift Monitor (independent)
    │
    ├── Phase 5A: Analysis Versioning (depends on Phase 1: AnalysisVersion model)
    ├── Phase 5B: Export UI (independent of schema)
    ├── Phase 5C: Bulk Upload (depends on Phase 1: BatchUpload model)
    │
    ├── Phase 6A: Prompt Registry (depends on Phase 1: PromptVersion model)
    │
    └── Phase 7A: Feedback Loop (depends on Phase 5A + Phase 6A)
```

### Parallelization Strategy

These groups can be implemented in parallel (each by a separate subagent or developer):

**Group A (Infrastructure):** 2A, 2B, 2C, 2D
**Group B (Security):** 3A, 3B, 3C, 3D
**Group C (Reliability):** 4A, 4B, 4C, 4D
**Group D (Features):** 5A, 5B, 5C
**Group E (AI Pipeline):** 6A, 7A (sequential — 7A depends on 6A)

---

## Files Changed Summary

| Phase | New Files | Modified Files |
|-------|-----------|----------------|
| 1 | `prisma/migrations/*` | `prisma/schema.prisma` |
| 2A | — | `src/lib/sse.ts`, `src/hooks/useAnalysisStream.ts`, `src/app/api/analyze/stream/route.ts` |
| 2B | — | `src/lib/prisma.ts` |
| 2C | — | `src/app/api/share/route.ts` |
| 2D | — | `src/lib/rag/embeddings.ts` |
| 3A | — | `src/app/api/share/route.ts`, `package.json` |
| 3B | `src/lib/utils/csrf.ts` | `src/middleware.ts` |
| 3C | — | `next.config.ts` |
| 3D | — | `src/app/api/share/route.ts` |
| 4A | `src/lib/utils/error-tracker.ts` | `src/lib/utils/logger.ts`, multiple API routes |
| 4B | — | `src/app/api/health/route.ts` |
| 4C | `src/app/api/admin/retry-failed/route.ts` | `src/lib/analysis/analyzer.ts`, `src/app/api/analyze/stream/route.ts` |
| 4D | — | `src/app/api/health/route.ts` |
| 5A | `src/app/api/analyses/[id]/versions/route.ts` | `src/lib/analysis/analyzer.ts`, `src/app/api/documents/[id]/route.ts`, document detail page |
| 5B | `src/app/api/analyses/[id]/export/route.ts` | document detail page |
| 5C | `src/app/api/upload/batch/route.ts` | `src/app/(platform)/dashboard/page.tsx` |
| 6A | `src/lib/agents/prompt-registry.ts` | `src/lib/agents/nodes.ts`, `src/lib/agents/prompts.ts` |
| 7A | — | `src/lib/agents/nodes.ts`, `src/lib/rag/embeddings.ts` |

**Total: ~8 new files, ~20 modified files**

---

## Testing Strategy

Each phase should include:

1. **Unit tests** for new utility functions (error-tracker, csrf, prompt-registry, batch embeddings)
2. **Integration tests** for new API endpoints (versions, export, batch upload, retry-failed)
3. **Existing test suite** must pass after each phase (`npm test`)
4. **Manual smoke test** of critical flows:
   - Upload → Analyze → View Results → Export → Share
   - Re-analyze → Version history shows diff
   - Failed analysis → Appears in dead letter queue → Manual retry succeeds

---

## Rollback Plan

- All schema changes are additive (new columns/tables) — no destructive changes
- New columns are nullable or have defaults — existing code continues to work
- Feature flags via environment variables for each major feature:
  - `ENABLE_ANALYSIS_VERSIONING=true`
  - `ENABLE_PROMPT_REGISTRY=true`
  - `ENABLE_BATCH_UPLOAD=true`
  - `ENABLE_DEAD_LETTER_QUEUE=true`
- If a phase causes issues, disable its flag without reverting code
