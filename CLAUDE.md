# CLAUDE.md — Decision Intel

## Git Workflow

**Always rebase onto the latest `origin/main` before every push.** This is mandatory — PRs that are "behind main" cause merge conflicts and CI failures. Every push must result in a branch that is strictly ahead of main, never behind.

```bash
# Before EVERY push — no exceptions:
git fetch origin main
git rebase origin/main
# Then push (force-with-lease is safe for rebased feature branches):
git push --force-with-lease -u origin <branch-name>
```

- Never merge main into a feature branch — always rebase onto it.
- If rebase has conflicts, resolve them one commit at a time, then `git rebase --continue`.
- Never use `git push --force` (bare). Use `--force-with-lease` to protect against overwriting others' work.
- Before opening or updating a PR, verify the branch is not behind main: `git log --oneline origin/main..HEAD` should show only your commits, and `git log --oneline HEAD..origin/main` should be empty.
- If your branch has fallen behind (e.g. main received new merges), rebase again before pushing.

### Database Sync Strategy

- **NEVER** run `npx prisma db push` for shared schema changes; always use `npx prisma migrate dev`.
- **ALWAYS** commit the generated `prisma/migrations/` folder to Git with every schema change.
- If you see "Schema drift detected," check if `schema.prisma` is missing Supabase-managed extensions (`pg_graphql`, `pg_stat_statements`, etc.) before agreeing to a reset.
- To baseline an existing database without resetting: delete `prisma/migrations/`, run `npx prisma migrate dev --name initial_base --create-only`, then run `npx prisma migrate resolve --applied initial_base` on each existing database.

## Project Overview

Next.js 14 app (App Router) with Prisma ORM, Supabase Auth, LangGraph AI pipeline, and Supabase Postgres.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Format check:** `npx prettier --check "src/**/*.{ts,tsx}" --ignore-path .gitignore`
- **Format fix:** `npx prettier --write "src/**/*.{ts,tsx}" --ignore-path .gitignore`
- **Tests:** `npm test` (Vitest)
- **Prisma generate:** `npm run prisma:generate`
- **Prisma migrate:** `npm run prisma:migrate`

## Code Formatting

**Always run Prettier on every file you create or modify before committing.** This is mandatory — CI checks formatting and will fail on unformatted code.

```bash
# After editing any .ts or .tsx file:
npx prettier --write "path/to/file.ts"

# Or format all changed files at once:
npx prettier --write $(git diff --name-only --diff-filter=ACMR -- '*.ts' '*.tsx')
```

- Run `npx prettier --write` on every `.ts`/`.tsx` file you touch, **before every commit**.
- If you create a new file, format it immediately after writing.
- Never skip this step — unformatted code will be rejected by CI.

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

## NotebookLM CLI

The `notebooklm` CLI (v0.3.4) is installed via Python 3.12. The binary is at `/Library/Frameworks/Python.framework/Versions/3.12/bin/notebooklm`. Auth state is stored at `~/.notebooklm/storage_state.json`.

**Before running any `notebooklm` command, prepend the PATH:**
```bash
export PATH="/Library/Frameworks/Python.framework/Versions/3.12/bin:$PATH"
```

**Quick verify:** `notebooklm list` should return notebooks. If auth fails, run `notebooklm login`.

The skill file is at `~/.claude/skills/notebooklm/SKILL.md` — refer to it for full command reference.

## Superpowers Workflows

The Superpowers skill library is installed at `~/.claude/skills/superpowers/`. **Proactively use these workflows when appropriate:**

### When to Use Specific Workflows

**Test-Driven Development (TDD)**
- Building new API endpoints, services, or complex business logic
- Refactoring critical code paths
- Any backend feature where correctness is crucial
- User asks for "tests" or mentions TDD/testing first

**Systematic Debugging**
- Complex bugs spanning multiple files
- Performance issues requiring methodical investigation
- "Weird" bugs where the cause isn't obvious
- Race conditions or async issues

**Git Worktrees**
- Working on experimental features that might break the build
- Parallel development of multiple features
- When user wants to preserve main branch stability
- Complex refactors that need isolation

**Subagent-Driven Development**
- Large features touching 5+ files
- When parallelization would speed up development
- Multiple independent components to build
- User asks to "work on multiple things at once"

**Writing/Executing Plans**
- Features requiring 4+ implementation steps
- Complex migrations or refactors
- When user asks "how would you approach this?"
- Before starting any task estimated at >30 minutes

**Code Review Workflows**
- Before committing major features
- When user asks for review or quality check
- After complex refactors
- Before merging to main

**Brainstorming**
- Architecture decisions
- Naming things (the hardest problem!)
- When user says "I'm not sure how to..."
- Design pattern selection

### Available Commands
- `/brainstorm` — Structured ideation session
- `/write-plan` — Create detailed implementation plan
- `/execute-plan` — Execute a written plan systematically

**Note:** These workflows are NOT needed for:
- Simple UI/CSS changes
- Single-file edits
- Trivial bug fixes
- Documentation updates
- Configuration tweaks

## Known Patterns

- **Schema drift protection:** Production DB may lag behind Prisma schema. All write and read paths that use newer columns must catch `P2021`/`P2022` errors and fall back to core-only fields. The fallback MUST run in a separate `$transaction` because PostgreSQL poisons the entire transaction block after a column-not-found error.
- **SSE streaming:** Analysis results stream via Server-Sent Events (`/api/analyze/stream`). Use `formatSSE()` from `@/lib/sse`.
- **Audit logging:** Use `logAudit()` from `@/lib/audit` for user-facing actions (fire-and-forget pattern).
