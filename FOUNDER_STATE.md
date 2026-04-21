# FOUNDER_STATE.md

> Living context document. Claude reads this at session start and updates it at session end.
> Last updated: 2026-04-11 | Branch: feature/hero-hub-outreach

---

## Who You Are

**Folahan Williams** — 16-year-old solo technical founder, based in Nigeria.
Advised by a senior consultant who helped take Wiz from startup to $32B acquisition.
Pre-revenue. Working toward first paid design partner before raising pre-seed/seed (target: next 6 months).

**Founder's core edge:** moves exceptionally fast with AI (Claude Code, multiple sessions/day), thinks at a strategic level well beyond his age, has a world-class advisor network, and is building brand before product-market fit — the Wiz playbook.

---

## What Decision Intel Is

AI-powered cognitive bias auditing for high-stakes decision teams. Users upload strategic documents (M&A memos, board papers, strategy proposals) and get a comprehensive bias audit in under 60 seconds.

**Primary vertical:** Corporate strategy and M&A teams at $500M+ companies.
**Expansion path:** PE/VC investment committees, financial services.
**Closest competitor:** Cloverpop (decision management, not bias detection). Real competition is "do nothing."
**Unit economics:** 97% gross margin ($0.03–0.07 API cost per analysis).

---

## Active Priorities (ordered)

1. **Land first paying design partner** — target: CSO or strategy director at $500M+ company. Pipeline: active outreach via Founder Hub outreach tab. No signed customers yet.
2. **Build brand visibility** — daily/weekly LinkedIn content via Content Studio. 5 brand pillars: Decision Science, Founder Journey, Enterprise AI, Market Insights, Social Proof.
3. **Polish core demo flow** — upload → analyze → review → track outcomes. This is what closes the first deal.
4. **Raise pre-seed/seed** — 6-month horizon. Need design partner first as proof point.

---

## What's Deployed / What's In-Progress

### Merged to main (deployed on Vercel)

- Core analysis pipeline (12-node LangGraph, Google Gemini primary + Claude fallback)
- DQI scoring engine
- 25+ dashboard routes, 200+ components
- Integrations: Slack, Google Drive, email
- Case studies, taxonomy, compliance frameworks

### On feature/hero-hub-outreach (not yet PR'd to main)

- **Hero flow** — dwell floor, suspense pause, end-state actions
- **Hub consolidation** — 17 tabs → 10 tabs with groups
- **Dynamic LinkedIn outreach** — voice-matched connect/follow-up/meeting messages
- **Prospect Pipeline** — full CRM in Outreach & Meetings tab (cold/warm/active/converted/archived)
- **Weekly Content Brief** — Gemini generates 5-post week plan across 5 brand pillars
- **Content Opportunities scanner** — AI-powered idea detection
- **Founder School** — 7-track mini-MBA with 49 lessons, progress tracking
- **Content Performance Widget** — outcome loop tracking for content ROI

---

## Open Decisions (needs resolution)

- [ ] **NotebookLM integration** — user wants to use NotebookLM for audio lesson overviews and business context notebooks. NotebookLM is NOT yet installed as MCP or skill. Needs setup. Concept: feed Founder School lessons + FOUNDER_STATE to NotebookLM for cinematic audio deep-dives.
- [ ] **PR to main** — feature/hero-hub-outreach contains ~6 sessions of work. Should be PRed and deployed soon.
- [ ] **GTM co-founder / advisor** — founder needs a sales-focused co-founder or enterprise sales advisor.
- [ ] **Delaware C-Corp** — may be required before US investors will sign term sheets on a Nigeria-incorporated entity.

---

## What's Working

- Claude Code + session-start hook for automatic git context injection at session open
- `/ship` command for autonomous commit → rebase → push without manual intervention
- Outreach pipeline: Prospect → ProspectPipeline tracking → OutreachHistory
- Content Studio: WeeklyBrief + ContentOpportunities driving daily LinkedIn cadence
- Wiz advisor relationship: actively engaged, gives strategic guidance on GTM

---

## What's Blocked

- No design partner yet — outreach is live but no signed partners
- NotebookLM skill not installed (user expected it to be available but it's not in MCP config)
- No post-performance data yet (ContentPerformanceWidget just added — needs 2–3 weeks of real data before optimization signals emerge)

---

## Recent Wins (last 2 sessions)

- Built Prospect Pipeline (full CRM in Outreach tab): cold → warm → active → converted lifecycle
- Built Weekly Content Brief: 5-post/week Gemini-generated plan across 5 brand pillars
- Updated outreach voice to match real founder examples (formal salutation, age intro, 5-min ask, warm sign-off)
- Added auto-rebase to /ship command: autonomous push without merge conflicts
- Session-start hook: git state automatically surfaces at every session open

---

## Key Context for Next Session

- **PR when ready:** `git fetch origin main && git rebase origin/main && gh pr create --base main --head feature/hero-hub-outreach`
- **NotebookLM:** user wants this. Need to check if they have it installed differently (CLI? browser extension?). The Python NotebookLM SDK exists — may need MCP setup.
- **Content performance:** first real data won't exist until 2–3 weeks after ContentPerformanceWidget ships. Come back to analyze.
- **Design partner target:** ask founder if they have any specific companies or contacts from the Wiz advisor network. The outreach tab has all the tooling — just need the contacts.
- **Founder School:** lessons are self-contained static data. User can request additions to any track.

---

## Claude Behavior Notes for This Project

- Use `style={{ ... }}` CSS vars, never hardcoded hex or Tailwind dark-mode classes
- `FounderContent` model uses `uploadedAt` — NO, that's `Document`. `FounderContent` uses `createdAt`.
- Always use `safeCompare` from `@/lib/utils/safe-compare` for secret comparisons
- `apiSuccess({ data: { field } })` envelope — clients read `json.data.field`, not `json.field`
- `params` in Next.js 16 route handlers is `Promise<{ id: string }>` — must `await params`
- Schema autonomy granted: can add Prisma models directly, run `npx prisma db push --accept-data-loss`
- Run `npx tsc --noEmit` before committing. Full `npm run build` before PR.
- Prefer `Edit` / `Read` / `Grep` over Bash for file operations
