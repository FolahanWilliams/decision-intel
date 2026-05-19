Pull the latest changes from the remote and orient for the session.

Steps:

1. Run `git fetch origin` to get the latest remote state
2. Run `git status` to check for any local uncommitted changes
3. If the working tree is clean, run `git pull origin main --ff-only` to fast-forward
4. If there are local changes, report them clearly and ask the user whether to stash and pull, or continue working from the current state
5. Run `git log --oneline -5` to show the last 5 commits so we both know where we are
6. Run `gh pr list --author "@me" --state open` to surface any open PRs (especially pending audit branches)
7. Briefly summarise what's changed since the last session based on the recent commits
