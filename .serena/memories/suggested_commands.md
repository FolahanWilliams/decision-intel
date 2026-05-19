# Suggested Commands — Decision Intel

## Dev

- `npm run dev` — dev server (port 3000)
- `npm run build` — full production build (run before push)
- `npx tsc --noEmit` — fast type-check (preferred pre-commit gate)
- `npm run lint` — ESLint
- `npm run test` — Vitest (excludes e2e/)
- `npx playwright test` — E2E
- `npx prisma migrate dev` — apply pending migrations
- `npx prisma generate` — regen Prisma client

## Git

- Rebase onto main before every push: `git fetch origin main && git rebase origin/main`
- Pre-commit hook runs `npm run audit:ai` (Gemini audit). Can be slow; `--no-verify` allowed if confident.
- Never `git add -A` or `-u` in this repo — use explicit filenames (local dev-tool files drift in)

## System (Darwin)

- Use Grep/Glob tools, NOT bash grep/find (RTK hook drops exit-3 mutations in permissive mode — 0% token savings via Bash for file ops)
- Use Read tool instead of `cat` / `head` / `tail`

## MCP tools (prefer over raw search)

- code-review-graph: `get_review_context_tool`, `get_impact_radius_tool`, `semantic_search_nodes_tool` (always pass `detail_level: "minimal"` + explicit `limit`)
- Serena: symbolic tools for code structure — `find_symbol`, `get_symbols_overview`, `find_referencing_symbols`
- Context7: library docs

## Rotation + Ops

- `npm run rotate:encryption-key -- --domain document --from 1 --to 2` — batched, idempotent, resumable
