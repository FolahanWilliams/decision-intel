# CLAUDE.md — Decision Intel

## Git Workflow

**Always rebase before pushing.** This keeps feature branches linear on top of main and prevents "behind and ahead" divergence on PRs.

```bash
# Before every push:
git fetch origin main
git rebase origin/main
# Then push (force-with-lease is safe for rebased feature branches):
git push --force-with-lease -u origin <branch-name>
```

- Never merge main into a feature branch — always rebase onto it.
- If rebase has conflicts, resolve them one commit at a time, then `git rebase --continue`.
- Never use `git push --force` (bare). Use `--force-with-lease` to protect against overwriting others' work.

## Project Overview

Next.js 14 app (App Router) with Prisma ORM, Clerk auth, LangGraph AI pipeline, and Supabase Postgres.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Tests:** `npm test` (Vitest)
- **Prisma generate:** `npm run prisma:generate`
- **Prisma migrate:** `npm run prisma:migrate`

## Code Conventions

- All client components must use `'use client'` directive.
- Never read `localStorage` or `window` in a `useState` initializer — use `useEffect` to avoid hydration mismatches (React error #418).
- Never render `new Date()` directly in JSX — capture timestamps in state via `useEffect` or at event-creation time.
- Prisma queries selecting extended/newer columns must include schema-drift fallback (catch P2021/P2022, retry with core fields only).
- Use `toPrismaJson()` from `@/lib/utils/prisma-json` when writing JSON fields to Prisma.
- Zod schemas validate all AI pipeline output before database persistence.

## Architecture

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

## Known Patterns

- **Schema drift protection:** Production DB may lag behind Prisma schema. All write and read paths that use newer columns must catch `P2021`/`P2022` errors and fall back to core-only fields. The fallback MUST run in a separate `$transaction` because PostgreSQL poisons the entire transaction block after a column-not-found error.
- **SSE streaming:** Analysis results stream via Server-Sent Events (`/api/analyze/stream`). Use `formatSSE()` from `@/lib/sse`.
- **Audit logging:** Use `logAudit()` from `@/lib/audit` for user-facing actions (fire-and-forget pattern).
