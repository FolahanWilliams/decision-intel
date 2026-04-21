-- Seed the 4 moat-stack deep-dives as pinned FounderTodo rows so the
-- founder's To-Do tab surfaces the strategic work queued behind items
-- 6–27. Rationale is in founder-context.ts :: MOAT_STACK DEEP DIVES.
--
-- ON CONFLICT (id) DO NOTHING — migration is idempotent in case of
-- replay. IDs are stable strings so re-running won't duplicate.

INSERT INTO "FounderTodo" ("id", "title", "done", "pinned", "dueDate", "createdAt", "updatedAt")
VALUES
  (
    'moat-stack-regulatory-tailwind-202604',
    'MOAT: Regulatory tailwind — file EU AI Act + SEC AI + UK DSIT public comments; apply to NIST AI Safety Consortium + AI Verify Foundation; publish /regulatory page + RegulatoryAnchor model',
    false,
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'moat-stack-kahneman-klein-202604',
    'MOAT: Kahneman × Klein synthesis — ship R²F whitepaper (SSRN + arxiv + /rrf/whitepaper.pdf), build 3 side-by-side historical audits (Kahneman-only vs Klein-only vs R²F), secure academic advisor review',
    false,
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'moat-stack-decision-knowledge-graph-202604',
    'MOAT: Decision Knowledge Graph — publish /decision-graph 8-edge-type methodology; add Graph Depth metric to product + Unicorn Roadmap; build live-graph CSO demo viewer; document partner-integration API',
    false,
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'moat-stack-outcome-calibrated-dqi-202604',
    'MOAT: Outcome-calibrated DQI — seed calibration from 135-case library from day one; ship Calibration Confidence chip on every analysis; add outcome-reporting MSA clause (≥60% reporting rate); weight outcomes by inverse reporting probability',
    false,
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO NOTHING;
