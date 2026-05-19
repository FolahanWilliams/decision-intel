# Code Style & Conventions — Decision Intel

## Styling (light theme is canonical)

- Use CSS variables from `src/app/globals.css` — never hardcoded hex or dark-mode Tailwind classes on platform surfaces
- Inline `style={{}}` objects are the dominant pattern, not Tailwind utilities
- Visualization cards can keep dark Tailwind INSIDE severity wrappers (red/amber interiors are correct); only outermost elements must use CSS tokens
- Key tokens: `--bg-card`, `--text-primary/secondary/muted`, `--accent-primary` (#16A34A), `--border-color`, `--severity-*`, `--radius-md` (8px)

## Database

- `Document.uploadedAt` NOT `createdAt` (caused build errors multiple times)
- `Analysis.createdAt` is standard
- Always try-catch Prisma in API routes, handle P2021/P2022 (schema drift)
- New relations need explicit `onDelete: Cascade | SetNull`
- Nullable JSON fields need cast: `as unknown as Record<string, unknown>`

## Security

- Always `safeCompare` from `@/lib/utils/safe-compare` for secrets
- CSRF protection in middleware.ts (Slack/Stripe/cron exempt)
- `keyVersion` stamp on encrypted rows (`Document.contentKeyVersion`, `SlackInstallation.botTokenKeyVersion`)
- Encryption keys: `DOCUMENT_ENCRYPTION_KEY_V{N}` + `*_VERSION` env var

## Components

- Lazy-load heavy components with `dynamic()` from next/dynamic
- `ErrorBoundary` on page-level components
- `EnhancedEmptyState` not legacy `EmptyState` — pass `showBrief` + `briefContext`
- `createLogger('ContextName')` for structured logging
- `apiSuccess()` / `apiError()` from `@/lib/utils/api-response.ts`
- Founder Hub API calls require `founderPass` prop

## Fire-and-forget discipline

Never swallow errors with `.catch(() => {})` on ops affecting delivery / audit / learning flywheel. Use `.catch(err => log.warn('ctx:', err))`.
Acceptable silent catches: in-memory cache cleanup, schema-drift tolerance (commented), `req.json().catch(() => null)` body parsing, UI state fetches.

## Bias taxonomy (locked)

- 20 biases, IDs DI-B-001 through DI-B-020 (`src/lib/constants/bias-education.ts`)
- Referenced by snake_case keys: `confirmation_bias`, `anchoring_bias`
- Published at `/taxonomy` — NEVER renumber

## DQI grade scale (locked)

A 85+, B 70+, C 55+, D 40+, F 0+. Update BOTH `GRADE_THRESHOLDS` in `src/lib/scoring/dqi.ts` AND its JSDoc in the same commit.

## Marketing voice (locked 2026-04-19)

"Every word must be something a Fortune 500 CSO/GC/CFO could say aloud in procurement without flinching."

- Banned: stage-of-company language, apologetic proof, technical jargon (12-node, LangGraph, agents, tokens), startup-cute visuals, loss-first headlines, "AI-powered"
- Allowed: capability-led leads, concrete artefacts, compliance vocabulary (SOC 2, GDPR, EU AI Act), quiet confidence
- Jargon allowed ONLY on `/how-it-works` (bounded by `src/lib/data/pipeline-nodes.ts`)

## Task completion gate

- Run `npx tsc --noEmit` (fast) or `npm run build` (full) before pushing
- Commit per logical unit, not in 12-change batches
- Update CLAUDE.md in the same commit when introducing new conventions/files
