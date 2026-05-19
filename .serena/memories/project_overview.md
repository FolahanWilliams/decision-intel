# Decision Intel — Project Overview

Decision intelligence platform for corporate strategy teams. Users upload strategic memos / board decks / market-entry recommendations and get a 60-second audit that scores cognitive biases, predicts steering-committee objections, and adds every decision to a Decision Knowledge Graph.

**Primary buyer:** CSO / Head of Corp Strategy. Secondary: M&A. NOT PE/VC.

**Phase:** Refinement & consolidation. 200+ components, 70+ API routes. Pre-revenue, targeting first design partner before raise. Push back on scope creep.

**Founder:** Solo, 16yo, Nigeria-based. Advised by ex-Wiz scaler.

## Tech stack

- Next.js 16 App Router + React 19 + TypeScript 5.9
- Postgres (Supabase) via Prisma 7.5 (1,487 lines, 61 models)
- Google Gemini (primary) + Anthropic Claude (fallback)
- LangGraph 12-node pipeline (`src/lib/agents/`)
- Tailwind 4 + shadcn/ui + Framer Motion + Lucide
- Supabase Auth (Google OAuth)
- Stripe (subs + per-deal)
- Vercel serverless

## Authoritative docs

- `/Users/folahan/decision-intel/CLAUDE.md` — full conventions, vocabulary lock, voice rules, file registry
- `/Users/folahan/decision-intel/TODO.md` — active priorities + known bugs + tech debt
- `/Users/folahan/.claude/CLAUDE.md` — global behavioral standards
- `/Users/folahan/.claude/projects/-Users-folahan-decision-intel/memory/MEMORY.md` — auto-memory index

Always read CLAUDE.md + TODO.md at the start of every substantial task.
