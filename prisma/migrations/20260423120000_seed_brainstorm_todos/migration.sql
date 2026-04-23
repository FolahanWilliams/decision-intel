-- Seed the 2026-04-23 brainstorm open items as FounderTodo rows so the
-- founder's To-Do tab (where they actually check things) carries every
-- action from TODO.md (which is Claude's working doc, not the founder's).
--
-- Categories prefixed in square brackets for scannability — [Pipeline],
-- [Fundraise], [Hiring], [Brand], [Pitch deck], [LinkedIn], [Decision],
-- [Engineering]. No tags column; the prefix IS the tag.
--
-- ON CONFLICT (id) DO NOTHING — idempotent on replay. Stable IDs mean
-- re-running the migration (or running the standalone
-- scripts/seed-founder-todos.ts after a fresh DB) never duplicates.

INSERT INTO "FounderTodo" ("id", "title", "done", "pinned", "dueDate", "createdAt", "updatedAt")
VALUES
  -- ─── Pipeline (pinned) ──────────────────────────────────────────
  (
    'todo-20260423-pipeline-first-design-partner',
    '[Pipeline] Land first paying design partner — outreach via advisor (Wiz) network. Only milestone before fundraise.',
    false, true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'todo-20260423-pipeline-linkedin-daily',
    '[Pipeline] Post 1 case study per day on LinkedIn. Use Content Studio → Generate LinkedIn Post, or wait for daily email from /api/cron/daily-linkedin.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),

  -- ─── Fundraise (pinned) ─────────────────────────────────────────
  (
    'todo-20260423-fundraise-preseed',
    '[Fundraise] Pre-seed / seed fundraise — target first paying design partner + 2–3 reference logos before kickoff.',
    false, true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),

  -- ─── Hiring ─────────────────────────────────────────────────────
  (
    'todo-20260423-hiring-gtm-cofounder',
    '[Hiring] Find GTM / enterprise-sales co-founder or advisor.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'todo-20260423-hiring-bd-contractor',
    '[Hiring] Ask Wiz advisor for intro to a senior BD contractor (90-day engagement, referral fee + small retainer). Distribution, not product, is the bottleneck to first logo.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),

  -- ─── Brand ──────────────────────────────────────────────────────
  (
    'todo-20260423-brand-rrf-signature',
    '[Brand] Add "Recognition-Rigor Framework · Decision Intel" tagline under Gmail signature (small italic, below name). Vocabulary ownership by usage = current trademark strategy.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),

  -- ─── Pitch deck ─────────────────────────────────────────────────
  (
    'todo-20260423-deck-slide2-lineage',
    '[Pitch deck · slide 2] Rewrite moat slide as lineage, not list: "R²F is the pipeline → DPR is the signed artifact → DQI is the score → Bias Genome is the cross-org dataset → Causal Learning is how the DQI gets sharper." Investors hear architecture, not a feature list.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'todo-20260423-deck-slide2-anatomy-viz',
    '[Pitch deck · slide 2] Screenshot AnatomyOfACallGraph from /how-it-works (2× pixel density, stage=5, ~60% deck width). One visual, five surfaces — landing + how-it-works + deck + LinkedIn carousel + mobile bubble.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'todo-20260423-deck-slide7-execution-strength',
    '[Pitch deck · slide 7] Rehearse "Most pre-seeds are toys. We have shipped the full reasoning stack — the next 12 months are customer acquisition, not feature build." Reframes 200+ components / 70+ API routes as execution strength. Rehearse in the chat widget this week.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'todo-20260423-deck-slide10-dp-capacity',
    '[Pitch deck · slide 10] Replace feature chart with Design Partner capacity strip (5 seats × $1,999/mo × 12 = $119,940 ARR, first-right-of-refusal at list Year 2). Use the DesignPartners tab capacity viz as a screenshot source.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'todo-20260423-deck-velocity-question',
    '[Pitch deck · age framing] Slide 2 ends with the velocity-math question: "What do you expect the velocity to be when I am full-time in SF in 18 months?" Flips the age objection from a silent diligence discount into a public thesis.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),

  -- ─── LinkedIn ───────────────────────────────────────────────────
  (
    'todo-20260423-linkedin-rrf-carousel',
    '[LinkedIn] Build R²F anatomy carousel: render AnatomyOfACallGraph size=600 with stage looping 1→5 (5 slides + 1 hero). Caption each with the capability full name (Knowledge Graph / AI Boardroom / Reasoning Audit / What-if / Outcome Loop). Export as PNG, schedule for next Friday 09:00.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),

  -- ─── Founder decisions (gated) ──────────────────────────────────
  (
    'todo-20260423-decision-dpr-only-tier',
    '[Decision · revenue] DPR-only tier at $99/mo — survey top 3 pipeline contacts first: "instead of, or in addition to, Strategy?" If 2/3 "in addition" → ship. If 2/3 "instead" → skip. Full spec in TODO.md (Stripe product, plan flag, gating rules).',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'todo-20260423-decision-dark-strip',
    '[Decision · scope] Strip the dead .dark CSS layer (~800+ LOC + overrides across ~30 components). NOT shipping now — revisit only at pre-seed close OR if a design partner asks for dark mode.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),

  -- ─── Engineering (shovel-ready, deferred) ───────────────────────
  (
    'todo-20260423-eng-chrome-docs-rail',
    '[Engineering] Chrome extension Google Docs right-rail — live DQI as you type, debounced 5s, only audits changed passages. Reuses /api/passages/re-audit. Multi-day build — Docs DOM is complex.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'todo-20260423-eng-precommit-room-ui',
    '[Engineering] Pre-commitment Decision Room weakest-claims UI. decisionType=''pre_commitment'' entry point shipped; still missing the dedicated red-team room view that surfaces only the bottom-2 DQI-component excerpts. ~300 LOC.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'todo-20260423-eng-passage-paywall',
    '[Engineering] Passage-level audit paid tier — /api/passages/re-audit is currently free with 20/hr rate limit. Once Stripe product config lands, gate beyond N/month behind Strategy tier.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'todo-20260423-eng-simulate-ceo-paywall',
    '[Engineering] Simulate-CEO $29 one-off paywall — free with 3/day/IP today; wire Stripe one-off + redirect so the 4th simulation goes through checkout. "I paid $29 to find out what my CEO would ask" only works with the friction.',
    false, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO NOTHING;
