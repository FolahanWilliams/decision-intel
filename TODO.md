# TODO — Decision Intel

Claude reads this file at the start of every session. Update it as tasks are completed or new ones are discovered.

## Active Priorities
- [ ] Land first paying design partner (outreach via advisor network)
- [ ] Post 1 case study per day on LinkedIn (use Content Studio → Generate LinkedIn Post)
- [ ] Polish the first 60 seconds of the demo (upload → pipeline animation → score reveal)

## Known Bugs
- [ ] Decision Graph on `/dashboard/decision-graph` — verify D3 rendering works correctly after recent layout changes
- [ ] Test Outcome Gate flow end-to-end (submit outcome → recalibrated DQI appears on analysis detail page)
- [ ] Verify Google Drive auto-compare works with updated files (24h cooldown + content hash comparison)

## Technical Debt
- [ ] Remaining inline hardcoded colors in marketing pages (case study pages use `C.navy`, `C.green` constants instead of CSS variables)
- [ ] Some pages still use legacy `EmptyState` instead of `EnhancedEmptyState`
- [ ] Missing `onDelete` on several Prisma relations (Nudge.humanDecision, PlaybookInvocation.analysisId, RedTeamChallenge fields)
- [ ] Missing composite database indexes on Meeting, HumanDecision, JournalEntry tables

## Feature Ideas (Backlog)
- [ ] E3: Real-time meeting bias detection (Phase 1: prototype with simulated transcript feed) — saved in Founder Hub Tips Section 7
- [ ] WeWork S-1 excerpt as default demo document
- [ ] "Decision Score" — external-facing credit score for organizational decision quality
- [ ] Analyst certification program (revenue opportunity)
- [ ] CRM integration for auto-pulling deal outcomes (Salesforce, HubSpot)

## Recently Completed
- [x] LinkedIn post generator in Content Studio
- [x] Interactive knowledge graphs on all case study pages
- [x] Sidebar consolidation (10 items, 3 groups)
- [x] Score reveal animation with grade badge
- [x] Free tier raised to 4 analyses/month
- [x] Upgrade button fixed (fallback to /#pricing)
- [x] Settings page streamlined (6 tabs)
- [x] Decision Quality inlined into Analytics
- [x] Decision Replay with outcome reveal
- [x] Bias taxonomy published (DI-B-001 through DI-B-020)
- [x] Compliance posture page (SOC2, ISO 27001, GDPR, EU AI Act)
- [x] CLAUDE.md created with full project context
