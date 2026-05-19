Verify, commit, rebase onto main, and push all current changes to the remote branch.

Steps:

1. Run `git status` to show exactly what will be committed
2. Run `npx tsc --noEmit` to confirm no TypeScript errors — do NOT proceed if there are new errors introduced by the current changes
3. If types are clean, stage all changes: `git add -A`
4. Write a conventional commit message based on what actually changed (feat/fix/refactor/chore prefix). Be specific — reference the components or routes touched
5. Commit with the message (include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`)
6. **Rebase onto latest main before pushing:**
   - Run `git fetch origin main`
   - Run `git rebase origin/main`
   - If the rebase reports conflicts: open each conflicted file, read both sides, resolve by keeping the correct logic (prefer our changes for features we just wrote; prefer main's changes for anything unrelated), then `git add` the resolved files and `git rebase --continue`
   - If the rebase introduces TypeScript errors after conflicts: run `npx tsc --noEmit` again and fix them before continuing
   - Never abort the rebase and force-push — always resolve conflicts properly
7. Push to the current branch: `git push -u origin HEAD`
8. If no open PR exists for this branch, offer to create one with `gh pr create`
9. Report the branch URL and confirm the push succeeded
