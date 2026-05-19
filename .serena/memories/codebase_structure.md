# Codebase Structure — Decision Intel

## High-level tree

```
src/
├── app/
│   ├── (marketing)/     # Public: landing, case-studies, proof, bias-genome, how-it-works, security, privacy, taxonomy, pricing, terms, decision-alpha
│   ├── (platform)/      # Authed /dashboard/*, /documents/[id]
│   ├── api/             # 70+ routes
│   ├── login/
│   └── shared/          # Public share links
├── components/          # 200+ React components
│   ├── ui/              # shadcn + custom primitives
│   ├── founder-hub/     # 22 tabs (rail layout)
│   ├── analysis/        # Analysis display (InlineAnalysisResultCard, CounterfactualPanel, etc.)
│   ├── marketing/       # Landing sections, proof/, genome/, how-it-works/, privacy/
│   ├── visualizations/  # Graph/heat-map/timeline (dark interiors on severity wrappers — intentional)
│   └── settings/
├── lib/
│   ├── agents/          # LangGraph pipeline (nodes.ts 2,297 lines, graph.ts, prompts.ts)
│   ├── ai/              # Model router + Gemini/Claude providers
│   ├── compliance/
│   ├── scoring/         # dqi.ts (792 lines)
│   ├── learning/        # causal-learning, outcome-scoring, brier-scoring, bias-genome
│   ├── replay/
│   ├── integrations/    # Slack, Drive, email, webhooks
│   ├── reports/         # board-report-generator.ts
│   ├── constants/       # bias-education.ts (DI-B-001 through DI-B-020)
│   ├── data/            # pipeline-nodes.ts, bias-genome-seed.ts, case-studies/
│   └── utils/           # logger, cache, encryption, rate-limit, safe-compare, api-response, plan-limits, admin, bias-preview
├── hooks/               # 20+ custom hooks
├── types/
└── middleware.ts        # CSRF, session
```

## Key files

- `src/lib/stripe.ts` — plan defs + limits
- `src/lib/utils/plan-limits.ts` — `checkAnalysisLimit()`
- `src/lib/scoring/dqi.ts` — `GRADE_THRESHOLDS` + weights (JSDoc must match)
- `src/lib/learning/brier-scoring.ts` — outcome calibration (20 tests)
- `src/lib/utils/encryption.ts` — AES-256-GCM + keyVersion rotation protocol
- `src/lib/agents/graph.ts` — pipeline graph
- `src/lib/agents/nodes.ts` — 12 node implementations (riskScorerNode is 1,200 LOC — tech-debt flag)
- `src/app/api/founder-hub/founder-context.ts` — Founder Hub AI context (keep in sync with CLAUDE.md)
- `src/app/globals.css` — 297 lines of design tokens
- `src/components/ui/Sidebar.tsx` — 10 items across 3 groups
- `src/components/ui/CommandPalette.tsx`
- `prisma/schema.prisma` — 1,487 lines, 61 models

## Landing page IA (locked 2026-04-19)

7-section layout — do NOT re-add Stats bar, CredibilityTrio row (except the explicit "Go deeper" rail), PipelineLandingTeaser, OutcomeDetectionViz, Features cards, mid-page BookDemoCTA.

## Sidebar (10 items, 3 groups)

Verify with `src/components/ui/Sidebar.tsx`. Adding new items without removing one violates the consolidation principle.

## Unmapped routes (visible by URL only)

- `/dashboard/compare` (contextual via batch bar — OK)
- `/dashboard/decision-graph`
- `/dashboard/decision-quality`
- `/dashboard/audit-log` (OK — surfaced via Settings + palette)
- `/dashboard/outcome-flywheel`
- `/dashboard/founder-hub` (behind pass — OK)
- `/dashboard/cognitive-audits/effectiveness` (OK — folds into Decision Log chip)
