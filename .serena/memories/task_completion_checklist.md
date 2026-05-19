# Task Completion Checklist — Decision Intel

Before considering any non-trivial task done:

1. **Type-check**: `npx tsc --noEmit` (fast) — founder doesn't run builds locally, Claude IS the local build gate
2. **Full build if significant**: `npm run build`
3. **No new lint errors**: `npm run lint` if styling/linting touched
4. **Clean up unused imports** — Next.js strict mode treats them as errors
5. **Update CLAUDE.md** in the same commit if: new convention introduced, field renamed, key file created, workflow pattern changed, or a gotcha discovered
6. **Update TODO.md** — mark completed items `[x]` with a short note, add newly-discovered issues as `[ ]`
7. **Commit per logical unit** — don't batch
8. **Rebase onto origin/main before push**: `git fetch origin main && git rebase origin/main`
9. **Explicit filenames in `git add`** — never `-A` or `-u` (drifts local dev-tool files in)
10. **Pre-commit Gemini audit** may be slow — `--no-verify` only when confident
