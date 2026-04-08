# CLAUDE.md — Decision Intel

## What This Project Is

Decision Intel is an AI-powered cognitive bias auditing platform for high-stakes decision teams. Users upload strategic documents (IC memos, M&A proposals, board papers) and get a comprehensive bias audit in under 60 seconds. The primary vertical is PE/VC investment committees; the expansion path is enterprise M&A/strategy/risk teams.

**Current phase: Refinement & consolidation.** The product has 200+ components and 70+ API routes — more features than most Series A companies. The priority is polishing the core flow (upload → analyze → review → track outcomes) to attract pilot users and raise pre/seed funding. Push back on scope creep. If a change doesn't make the first 60 seconds of a demo better, it probably shouldn't be the priority.

## Founder Context

- Solo technical founder, 16 years old, based in Nigeria
- Advised by a senior consultant who helped take Wiz from startup to $32B
- The codebase IS the company — any senior full-stack engineer can onboard in weeks
- Pre-revenue; working toward first paid design partner before raising
- 97% gross margins ($0.03-0.07 API cost per analysis)
- Uses Claude Code multiple times daily (4-5 sessions, 1-2 hours each). Context between sessions matters a lot.
- No running bug tracker — bugs surface in conversation or via CI/CD failures.
- Does NOT run `npm run build` locally — relies on Vercel CI to catch build errors. **Claude should always run `npm run build` or at minimum `npx tsc --noEmit` before pushing significant changes.**
- Was unaware of the Gemini pre-commit hook. It may fail or be slow — use `--no-verify` if it blocks and the changes are tested.
- No pilot users yet. Actively outreaching to PE/VC firms and M&A teams via advisor network.
- Raising pre-seed/seed in the next 6 months. Needs a GTM/enterprise-sales co-founder or advisor.
- No direct competitor in "decision quality auditing" — the closest is Cloverpop (decision management, not bias detection). The real competition is "do nothing" — teams don't audit their decision processes at all.
- Current priorities: (1) land first paying customer, (2) build brand visibility via Content Studio, (3) polish demo flow.
- All features should stay — nothing should be cut, but features should be consolidated and surfaced contextually rather than via separate nav items.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5.9
- **Database:** PostgreSQL (Supabase) via Prisma 7.5
- **AI:** Google Gemini (primary), Anthropic Claude (fallback via AI_FALLBACK_ENABLED)
- **Pipeline:** LangGraph 12-node sequential+parallel agent pipeline
- **UI:** Tailwind CSS 4 + shadcn/ui + Lucide icons + Framer Motion
- **Auth:** Supabase Auth (Google OAuth)
- **Payments:** Stripe (subscriptions + per-deal audit pricing)
- **Deployment:** Vercel (serverless)
- **Monitoring:** Sentry + custom AuditLog + structured logging

## Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build (Next.js)
npm run lint         # ESLint
npm run test         # Vitest (unit tests, excludes e2e/)
npx playwright test  # E2E tests
npx prisma migrate dev  # Run pending migrations
npx prisma generate  # Regenerate Prisma client
```

**Pre-commit hook:** Runs `npm run audit:ai` (Gemini architectural audit). Can be bypassed with `--no-verify` but should generally be fixed instead.

## Project Structure

```
src/
├── app/
│   ├── (marketing)/     # Public pages: landing, case-studies, taxonomy, privacy, terms
│   ├── (platform)/      # Authenticated dashboard (all under /dashboard/*)
│   │   ├── dashboard/   # 25+ page routes
│   │   └── documents/   # Document detail page with analysis tabs
│   ├── api/             # 70+ API routes
│   ├── login/           # Auth
│   └── shared/          # Public share links
├── components/          # 200+ React components
│   ├── ui/              # Core design system (shadcn + custom)
│   ├── founder-hub/     # 16 tab components for Founder Hub
│   ├── analysis/        # Analysis display components
│   ├── settings/        # IntegrationMarketplace, AuditLogInline
│   └── ...              # Domain-grouped components
├── lib/
│   ├── agents/          # LangGraph pipeline (nodes.ts, graph.ts, prompts.ts)
│   ├── ai/              # Model router + Gemini/Claude providers
│   ├── compliance/      # 7 regulatory frameworks
│   ├── scoring/         # DQI computation (dqi.ts — 792 lines)
│   ├── learning/        # Causal learning, outcome scoring, bias genome
│   ├── replay/          # Score decomposition + counterfactual engine
│   ├── integrations/    # Slack, Google Drive, email, webhooks
│   ├── constants/       # Bias taxonomy (bias-education.ts), case studies
│   └── utils/           # Logger, cache, encryption, rate-limit, etc.
├── hooks/               # 20+ custom React hooks
├── types/               # TypeScript interfaces
└── middleware.ts        # CSRF, session management
```

## Critical Conventions — READ THESE

### Styling
- **Use CSS variables with fallbacks**, not hardcoded hex colors or dark-mode Tailwind classes:
  ```tsx
  // ✅ Correct
  style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}

  // ❌ Wrong — breaks in light theme
  className="text-white bg-white/5 border-white/10"
  ```
- Full token system defined in `src/app/globals.css` (297 lines). Key tokens:
  - Backgrounds: `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-card`, `--bg-elevated`
  - Text: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-highlight`
  - Accent: `--accent-primary` (#16A34A green), `--accent-secondary`, `--accent-tertiary`
  - Severity: `--success`, `--warning`, `--error`, `--info`, `--severity-high`, `--severity-critical`
  - Borders: `--border-color`, `--border-active`, `--border-hover`
  - Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--liquid-shadow`
  - Radius: `--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (12px), `--radius-xl` (16px), `--radius-full` (9999px)
- Dark mode uses `.dark` class via next-themes. Both themes are fully supported.
- Inline `style={{}}` objects are the dominant pattern (not Tailwind utilities). Follow the existing pattern.

### Database
- **Document model uses `uploadedAt`**, NOT `createdAt`, for the creation timestamp. This has caused build errors multiple times — always double-check.
- **Analysis model uses `createdAt`** (standard Prisma).
- Always handle schema drift: wrap Prisma queries in try-catch, check for P2021/P2022 error codes.
- Use `onDelete: Cascade` or `onDelete: SetNull` on all new relations — never leave onDelete unspecified.
- The `recalibratedDqi` field on Analysis is a nullable JSON field (added April 2026).
- **Prisma JSON fields need explicit casting.** When writing objects to nullable JSON columns (e.g., `biasBriefing`, `recalibratedDqi`), arrays with inferred types cause `InputJsonValue` errors. Fix: cast with `as unknown as Record<string, unknown>`.

### Security
- **Always use `safeCompare` from `@/lib/utils/safe-compare`** for secret comparisons. Never write a local implementation — a buggy duplicate was the cause of a critical auth bypass that was fixed.
- CSRF protection is in middleware.ts. Slack/Stripe/cron paths are exempt.
- Document encryption uses AES-256-GCM via `DOCUMENT_ENCRYPTION_KEY`.
- Slack tokens encrypted with `SLACK_TOKEN_ENCRYPTION_KEY`.

### Components & Patterns
- Lazy-load heavy components with `dynamic()` from `next/dynamic` (see Founder Hub page for pattern).
- Use `ErrorBoundary` wrapper on all page-level components.
- Use `EnhancedEmptyState` (not legacy `EmptyState`) for empty states. Always pass `showBrief` and `briefContext` for intelligence brief integration.
- Use `AnimatedNumber` from `@/components/ui/AnimatedNumber` for animating numeric values.
- Use `createLogger('ContextName')` for structured logging in API routes and lib code.
- Standardized API responses: use `apiSuccess()` and `apiError()` from `@/lib/utils/api-response.ts`.
- **Unused imports cause build failures.** Next.js strict mode treats them as errors. Always clean up imports after refactoring (e.g., removing `Suspense, lazy` when switching to `dynamic()`).
- **Founder Hub API calls require `founderPass` prop.** Any component calling `/api/founder-hub/*` must receive and pass the `founderPass` string via props from the hub page.
- **Case study slugs:** Use `getSlugForCase()` from `src/lib/data/case-studies/slugs.ts` for URL-safe slugs. Case study URLs: `/case-studies/{slug}`.
- **Landing page hero graph:** `src/components/marketing/HeroDecisionGraph.tsx` — interactive D3-like knowledge graph. The `CaseStudyBiasGraph` at `src/components/marketing/CaseStudyBiasGraph.tsx` is the simpler radial bias web used on case study cards and detail pages.

### Bias Taxonomy
- 20 biases with stable taxonomy IDs: DI-B-001 through DI-B-020 (defined in `src/lib/constants/bias-education.ts`).
- These IDs are permanent and published at `/taxonomy`. Never renumber or reassign them.
- Biases are referenced by snake_case string keys (e.g., `confirmation_bias`, `anchoring_bias`).

### Plan Limits & Billing
- Free tier: 4 analyses/month (defined in `src/lib/stripe.ts` → `PLANS.free.analysesPerMonth`)
- Limit enforced by `checkAnalysisLimit()` in `src/lib/utils/plan-limits.ts`
- Stripe price IDs may not be configured yet. Upgrade buttons must fall back gracefully to `/#pricing` when `PLANS.pro.priceId` is empty.

### Integrations
- **Slack:** 7 slash commands, thread monitoring, auto-creates CopilotSession + DecisionRoom after audits. Handler in `src/app/api/integrations/slack/events/route.ts`.
- **Google Drive:** OAuth + Changes API polling via cron. Dedup by `sourceRef` (Google file ID). Detects updated files by content hash comparison. 24h cooldown between re-analyses.
- **Email:** Unique address per user (`analyze+{token}@in.decision-intel.com`). Token-based auth.

## When to Push Back

Claude should push back on requests that:
1. **Add new top-level routes** — the sidebar already has 10 items and 25+ dashboard routes. Consolidate instead.
2. **Add features before the core flow is polished** — upload → analyze → review → track outcomes is the only flow that matters for pilot users.
3. **Skip error handling or schema drift protection** — every Prisma query in an API route needs a try-catch with P2021/P2022 fallback.
4. **Use hardcoded dark-mode colors** — always use CSS variables.
5. **Create duplicate utility functions** — check `src/lib/utils/` first. Especially `safe-compare.ts`, `cache.ts`, `rate-limit.ts`, `encryption.ts`.
6. **Make changes that break the build without testing** — run `npx tsc --noEmit` after significant changes.
7. **Add scope beyond what was asked** — the founder is in refinement phase. Don't add docstrings, comments, or refactoring that wasn't requested.

## When to Ask Questions

Claude should ask the founder before:
1. **Creating new database models or fields** — schema changes require migrations and affect production.
2. **Modifying the analysis pipeline** (`src/lib/agents/`) — this is the core product. Even small changes can affect DQI scores across all users.
3. **Changing pricing, plan limits, or billing logic** — revenue-sensitive.
4. **Deleting any route or component** — may have external links, bookmarks, or Slack deep links pointing to it.
5. **Making changes visible to end users** (copy, labels, flow changes) — the founder has specific positioning and language preferences.

## Session Workflow

Claude Code sessions should follow this pattern for best results:

0. **Read TODO.md first.** Check `TODO.md` at the start of every session for known bugs, active priorities, and pending tasks. Update it as tasks are completed or new issues are discovered.
1. **Start small.** One focused task per session beats a mega-batch across 20 files. Context quality degrades past ~15 file modifications.
2. **Build-check before pushing.** Always run `npx tsc --noEmit` (fast, type-errors only) or `npm run build` (full build) before committing. The founder doesn't run builds locally — Claude IS the local build check.
3. **Commit after each logical unit.** Don't batch 12 changes into one commit. Ship fix → commit → next fix → commit.
4. **Don't rediscover — read CLAUDE.md.** The conventions here (CSS variables, `uploadedAt` not `createdAt`, `safeCompare` import) have all been learned the hard way.
5. **Pre-commit hook note:** There is a Gemini AI audit hook in `.husky/pre-commit` that runs `npm run audit:ai`. It can be slow. If it blocks and the changes are reviewed, use `--no-verify`.
6. **Keep CLAUDE.md current — proactively, not at session end.** Whenever a change introduces a new convention, renames a field, adds a critical file, changes a workflow pattern, or discovers a gotcha that cost time — update CLAUDE.md **in the same commit** as that change. Don't wait until the session ends. Don't ask permission. Just include the CLAUDE.md edit alongside the code change. Examples: adding a new Prisma field → update the Database section. Creating a new shared utility → add it to Key Files. Discovering a build error caused by a naming convention → add it to Critical Conventions. The goal is that the next session (which has zero memory of this one) starts with every lesson already learned.

## Sub-Agent Strategy

Use the right model for the right job. Never use Opus for tasks Haiku can handle.

**Exploration (Haiku, 3 in parallel):**
Use Haiku sub-agents for all read-only codebase exploration — file reading, grep searches, structure mapping, "find all places X is used" pattern analysis. Haiku reads files and reports back just as accurately as Opus. Launch up to 3 in parallel for maximum speed. Always specify `model: "haiku"` and `subagent_type: "Explore"` for these.

**Planning (Opus, main thread):**
Do implementation planning in the main conversation thread, not in sub-agents. The main thread has the full conversation context, user intent, and prior decisions. Delegating planning to a sub-agent loses this context and produces generic results. The one exception: use a Plan sub-agent (Opus) for very complex multi-file architectural decisions where a fresh perspective helps.

**Implementation (Opus, main thread, direct edits):**
Never delegate code implementation to sub-agents. Always edit files directly in the main thread. The main thread has the conversation history, knows what was tried, and can make judgment calls. Sub-agents writing code produce lower-quality output because they lack this context.

**Verification (Sonnet or direct Bash):**
For mechanical checks — type-checking, test runs, build verification, counting occurrences — use direct Bash commands (preferred) or Sonnet sub-agents if parallel checking is needed. These tasks don't need Opus-level reasoning.

## Key Files Quick Reference

| Purpose | File |
|---------|------|
| Plan definitions & limits | `src/lib/stripe.ts` |
| Plan limit enforcement | `src/lib/utils/plan-limits.ts` |
| DQI scoring engine | `src/lib/scoring/dqi.ts` (792 lines) |
| Analysis pipeline graph | `src/lib/agents/graph.ts` |
| Pipeline node implementations | `src/lib/agents/nodes.ts` (2,297 lines) |
| Pipeline prompts | `src/lib/agents/prompts.ts` |
| Bias taxonomy & education | `src/lib/constants/bias-education.ts` |
| Founder Hub AI context | `src/app/api/founder-hub/founder-context.ts` |
| CSS design tokens | `src/app/globals.css` |
| Sidebar navigation | `src/components/ui/Sidebar.tsx` |
| Command palette | `src/components/ui/CommandPalette.tsx` |
| Platform layout | `src/app/(platform)/layout.tsx` |
| Prisma schema | `prisma/schema.prisma` (1,487 lines, 61 models) |
| Middleware (CSRF, sessions) | `src/middleware.ts` |
| Document detail page | `src/app/(platform)/documents/[id]/page.tsx` |
| Settings page | `src/app/(platform)/dashboard/settings/SettingsForm.tsx` |
| Analytics page | `src/app/(platform)/dashboard/analytics/page.tsx` |

## Environment Variables

Required for development: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_API_KEY`.

Optional: `FOUNDER_EMAIL` (for daily LinkedIn post emails via `/api/cron/daily-linkedin`).

See `.env.example` for the full list with descriptions.

## Git Workflow

- Branch naming: `feature/...`, `fix/...`, `audit/...`
- Commit style: conventional commits (`feat:`, `fix:`, `refactor:`)
- **Always rebase onto main before pushing:** `git fetch origin main && git rebase origin/main` before every push. This keeps history linear and PRs clean. Never push without rebasing first.
- Pre-commit hook runs AI audit (can be slow). Use `--no-verify` only when confident.
- Push with `-u origin <branch>` for new branches.
- CI/CD: GitHub Actions (`.github/workflows/ci-cd.yml`)
