# TODO — Decision Intel

Claude reads this file at the start of every session. Update it as tasks are completed or new ones are discovered.

## Active Priorities
- [ ] Land first paying design partner (outreach via advisor network)
- [ ] Post 1 case study per day on LinkedIn (use Content Studio → Generate LinkedIn Post, or wait for daily email from `/api/cron/daily-linkedin`)
- [ ] Polish the first 60 seconds of the demo (upload → pipeline animation → score reveal)
- [ ] Set `FOUNDER_EMAIL` env var on Vercel to activate daily LinkedIn post emails

## Known Bugs
- [ ] Decision Graph on `/dashboard/decision-graph` — verify D3 rendering works correctly after recent layout changes
- [ ] Test Outcome Gate flow end-to-end (submit outcome → recalibrated DQI appears on analysis detail page)
- [ ] Verify Google Drive auto-compare works with updated files (24h cooldown + content hash comparison)

## Technical Debt
- [ ] Marketing pages use hardcoded color constants (`C.navy`, `C.green`) — this is intentional (light-theme-only pages), NOT a bug. Do not convert to CSS variables.

## Feature Ideas (Backlog)
- [ ] E3: Real-time meeting bias detection (Phase 1: prototype with simulated transcript feed) — saved in Founder Hub Tips Section 7
- [ ] WeWork S-1 excerpt as default demo document
- [ ] "Decision Score" — external-facing credit score for organizational decision quality
- [ ] Analyst certification program (revenue opportunity)
- [ ] CRM integration for auto-pulling deal outcomes (Salesforce, HubSpot)

## Recently Completed
- [x] TODO.md created + `.claude/settings.json` with type-check hook
- [x] Daily LinkedIn post cron (`/api/cron/daily-linkedin`) — auto-generates and emails case study posts
- [x] Legacy `EmptyState` migrated to `EnhancedEmptyState` on dashboard page
- [x] Missing `onDelete: SetNull` added to `Nudge.humanDecision` relation
- [x] Composite indexes added: `Meeting[userId, status]`, `HumanDecision[userId, createdAt]`, `JournalEntry[userId, createdAt]`
- [x] LinkedIn post generator in Content Studio
- [x] Interactive knowledge graphs on all case study pages
- [x] Decision Graph clipping fixed on landing page
- [x] Sidebar consolidation (10 items, 3 groups)
- [x] Score reveal animation with grade badge
- [x] Free tier raised to 4 analyses/month
- [x] Upgrade button fixed (fallback to /#pricing)
- [x] Settings page streamlined (6 tabs)
- [x] Decision Quality inlined into Analytics
- [x] Decision Replay with outcome reveal
- [x] Bias taxonomy published (DI-B-001 through DI-B-020)
- [x] Compliance posture page (SOC2, ISO 27001, GDPR, EU AI Act)
- [x] Slack → Decision Room auto-bridge
- [x] Outcome → DQI recalibration loop
- [x] Google Drive auto-compare with content hash detection
- [x] CLAUDE.md created with full project context + sub-agent strategy
