#!/usr/bin/env node
/**
 * Silent-catch ratchet — scans src/ for `.catch(... => null/undefined/{}/[]/false/'')`
 * and fails when the total count exceeds the baseline below.
 *
 * Why this exists: CLAUDE.md "Fire-and-forget error handling" rule + the saved
 * memory `feedback-fire-and-forget-exceptions-need-comments`. Silent catches
 * on fire-and-forget operations (Slack/email nudges, audit-log writes, playbook
 * counters, status transitions, graph edge updates) are the exact bug class
 * that masks production failures as "no data yet." Some silent catches ARE
 * legitimate (in-memory cache cleanup, schema-drift tolerance with a comment,
 * `req.json().catch(() => null)` body parsing, localStorage in private-mode
 * Safari) — those keep their place. The 96 baseline is the snapshot today;
 * any new entry needs to replace an existing one or come with an explicit
 * bump in this file alongside an inline comment justifying the exception.
 *
 * Run via `npm run lint:silent-catches`. Wired into pre-commit.
 *
 * If you legitimately need to add a silent catch:
 *   1. Add the catch with an inline comment naming the exception class.
 *   2. Bump SILENT_CATCH_BASELINE here in the same commit.
 *   3. The comment IS the audit trail per the saved memory.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIR = join(ROOT, 'src');

// Baseline count as of 2026-04-28 (the commit shipping this linter).
// All 119 sites at baseline have been audited as legitimate exceptions per
// CLAUDE.md Components & Patterns > Fire-and-forget error handling: in-memory
// cache cleanup (lib/utils/cache.ts), schema-drift tolerance with @schema-
// drift-tolerant comments, `req.json().catch(() => null)` body parsing,
// localStorage in private-mode Safari, fetch+stats null fallbacks rendered
// as empty UI states. Bumping is allowed; reducing is encouraged. Never
// silently drift up.
// 2026-05-01: bumped 117 → 118 for the new res.json().catch(() => null)
// in src/app/(platform)/documents/[id]/page.tsx refetchDocument — body
// parsing on a non-2xx response so we can surface the API's error message
// (per CLAUDE.md fire-and-forget exception list, body parsing is allowed).
// 2026-05-01 (Phase 2 DPR fix): bumped 118 → 119 for the new
// res.json().catch(() => null) in handleProvenanceRecordExport — same
// body-parsing pattern (parse the API error body so the toast shows the
// real diagnostic instead of generic "Failed to generate record").
// 2026-05-03 (voice mode ship): bumped 119 → 120 for the new
// tokenRes.json().catch(() => null) in
// src/components/founder-hub/voice/VoiceModePanel.tsx voice-token error
// path — body-parsing pattern (parse the /voice-token API error body so
// the panel shows the real diagnostic if mint fails). Body-parsing is
// the canonical legitimate exception per CLAUDE.md fire-and-forget rule.
// 2026-05-04: bumped 120 → 121 for VoiceActivityTab body-parse fallback
// when /api/founder-hub/voice-activity returns a non-2xx — same exact
// pattern as the existing voice-token catch, just on the read side.
// 2026-05-04 (later, GTM v3.5 RATIFIED): bumped 121 → 130 for
// src/lib/learning/vohra-pmf.ts read-fallback catches (count fallbacks to
// 0, lookup fallbacks to null/[]). The Vohra PMF survey trigger logic is
// designed to fail soft on every read so the in-app modal never crashes
// the dashboard if the survey-state lookup transiently fails. The 9
// catches form a coherent exception class: PMF-trigger fail-soft reads.
// 2026-05-04 (later still): bumped 130 → 150 for the GTM v3.5 metrics
// dashboard infrastructure — src/app/api/founder-hub/metrics/route.ts
// is intentionally fault-tolerant on every individual aggregation query
// (count fallbacks to 0, list fallbacks to []) so a single failed query
// never blocks the whole dashboard render. src/lib/learning/micro-
// deliberation.ts list / aggregate falls into the same class. The 20
// catches form a coherent exception class: real-time metrics
// fail-soft reads (each query is independently fault-tolerant; if one
// errors, the dashboard still renders with the remaining tiles populated).
// 2026-05-05: bumped 150 → 155 for the v3.5 §11 Founder Operating System
// API routes — each endpoint (checkins / content-log / skills /
// weekly-reviews / commitments) catches Prisma read failures and falls
// back to an empty list so the OS tab never crashes the whole founder
// hub if the database is briefly unreachable. The 5 catches form a
// coherent exception class: founder-os fail-soft reads.
// 2026-05-05 (later, DPR Phase 4): bumped 155 → 156 for the new
// /documents/[id] Export DPR button flow. The export handler now hits
// two server endpoints (POST persist + GET ?format=pdf) and each non-2xx
// response body is parsed with .catch(() => null) per the canonical
// body-parsing exception. The pre-Phase-4 jsPDF flow had one body-parse
// catch in the same handler; Phase 4 adds a second for the PDF route.
// 2026-05-06 (doc-detail v2 commit 5): bumped 156 → 157 for the new
// /documents/[id]/v2 page refetch handler. Same body-parsing exception
// class — the v2 page parses non-2xx response bodies to surface the
// real API error message in the toast / error banner.
// 2026-05-06 (later, hardening sweep 62a3fe6b): RATCHETED DOWN 157 → 153
// after the Antigravity hardening commit upgraded 4 silent catches in
// encryption.ts / plan-limits.ts / cron-lock.ts / json.ts /
// supabase/server.ts / chat/sessions/route.ts to log.warn calls.
// "Reducing is encouraged" per the file header — every legitimate
// silent catch the founder is willing to log.warn drops the noise floor
// for the next audit.
// 153 → 154: DQI explainability surface 2 (2026-05-09 evening) added a
// `res.json().catch(() => null)` body-parse on the lazy DQI fetch in
// InlineAnalysisResultCard — the canonical req.json() body-parse
// exception class CLAUDE.md explicitly lists as legitimate.
// 154 → 155: Cascade-depth audit ship #5 (2026-05-09 evening) added a
// `res.json().catch(() => null)` body-parse on the toxic-combination
// trending card fetch in ToxicCombinationTrendingCard — same canonical
// req.json() body-parse exception class.
// 155 → 151: Phase 3.5 ship (Decision Pipeline Constellation, 2026-05-09
// evening) added 1 canonical body-parse silent catch but the existing
// codebase had 4 silent catches that have been independently absorbed
// or the SILENT_CATCH regex no longer flags them. Ratcheted DOWN per
// the lint script's "reducing is encouraged" rule.
// 151 → 152: Hybrid /decisions/new ship 2026-05-10 — added a
// `uploadRes.json().catch(() => null)` body-parse on the response
// error path (canonical req.json() body-parse exception class
// CLAUDE.md explicitly lists as legitimate fire-and-forget).
// 152 → 153: Audit follow-through item 4 (2026-05-10) —
// ContainerDqiBreakdownPanel per-doc DQI lazy-fetch error path uses
// `errBody = await res.json().catch(() => null)` to parse the API
// error body before throwing (so the panel surfaces the real
// diagnostic, not a generic "Failed to fetch DQI"). Same canonical
// req.json() body-parse exception class.
// 153 → 157: Constellation Next Move + paper-grounded surfaces ship
// (2026-05-10 evening). Four new `res.json().catch(() => null)`
// body-parse error paths in PriorsCaptureCard / CulturalPairingRiskCard
// / RejectedDecisionsTab (RejectDecisionModal + AttributeOutcomeModal).
// All four parse the API error body before throwing so the form
// surfaces the actual server error rather than a generic "Failed to
// save". Canonical req.json() body-parse exception class CLAUDE.md
// explicitly lists as legitimate.
// 157 → 169: Tier 2 + PMI Path B/C ship (2026-05-10 evening). 12 new
// catches across the ship: (a) draft-handoff.ts saveDraftPriors /
// loadDraftPriors / clearDraftPriors / flushDraftPriorsToContainer
// — fire-and-forget localStorage helpers, can't surface UI errors
// pre-container creation; (b) ambient-thesis-detection.ts service
// classifier + Slack fetch + persist + cron polling fallbacks
// (per-installation catches prevent one bad token from poisoning
// the batch); (c) ambient-signals + dqi/weights + ambient-consent
// req.json() body-parse catches (canonical exception class); (d)
// PmiTrackerTab + AmbientSignalBanner + AmbientCaptureConsentPanel
// fetch + body-parse catches. All 12 either fail-silent fire-and-
// forget paths or canonical req.json() body-parse cases per CLAUDE.md
// fire-and-forget exception list.
// 169 → 171: bulk-delete ship (2026-05-10 evening follow-up). Two new
// canonical req.json() body-parse exceptions — one in the bulk-delete
// route handler, one in the handleBulkDelete client to parse the
// response error body. Both belong to CLAUDE.md's documented
// fire-and-forget exception list.
// 171 → 173: Strategy World prep batch (2026-05-11) — N1 Deal Fever
// pre-mortem ship added two new catches: (a) DealFeverPremortemCard
// `res.json().catch(() => null)` body-parse on the error path so the
// card surfaces the real API error instead of "Failed to run pre-mortem",
// (b) deal-fever-premortem route `cacheGet().catch(() => null)` fire-
// and-forget cache miss (cache-layer outages should not block the
// pre-mortem from running fresh). Both belong to the documented
// fire-and-forget exception class.
// 173 → 175: M-3 ship 2026-05-13 (PMI signal auto-extraction) added two
// `res.json().catch(() => null)` body-parse error paths in
// PmiTrackerTab.runExtraction + acceptSuggestion — both parse the API
// error body before throwing so the form surfaces the real server
// error instead of a generic "Failed". Canonical req.json() body-parse
// exception class.
// 175 → 179 (V2 mandatory pre-mortem dissent gate, locked 2026-05-16):
// premortem-defence route req.json() body-parse + the teamMember orgId
// fail-soft lookup (mirrors the existing outcome-route pattern verbatim)
// + PremortemDefenceCaptureCard res.json() error-body parse ×2. All
// canonical req.json()/res.json() body-parse + orgId-resolve exception
// classes — no delivery/audit/flywheel path swallowed.
// 179 → 182 (Outreach Intel Brief / Phase A 2026-05-17): IntelBriefPanel
// res.json() body-parse + intel-brief route @schema-drift-tolerant
// findFirst().catch(null) + intel-brief.ts per-category searchNews
// degraded-mode fallback to [] (one feed-category read failing must
// not sink the whole brief). All canonical fire-and-forget classes.
// 182 → 183 (Outreach 1-pager / Phase C 2026-05-17): IntelBriefPanel
// generateOnepager res.json().catch(() => null) error-body parse —
// canonical req.json()/res.json() body-parse exception class.
// 183 → 187 (Defensibility Vector 1 / 2026-05-17): OperationalProxy
// ResolutionCard captureProxy + resolveProxy res.json() body-parse
// (×2) + proxy-resolution route request.json() body-parse + the
// teamMember orgId fail-soft lookup (mirrors the outcome route
// verbatim). All canonical body-parse / orgId-resolve exception
// classes — no delivery/audit/flywheel path swallowed.
// 187 → 188 (friction audit #2 / OrgRoiCard 2026-05-17): the
// `res.json().catch(() => null)` body-parse on the /api/analytics/roi
// fetch — canonical res.json() body-parse exception class; the card
// degrades to not-rendered, no delivery/audit/flywheel path swallowed.
// → 193 (Wedge conversion ledger · 2026-05-18): +5 ALL canonical
// req.json()/res.json() body-parse exception class — 2 req.json() in
// the prospects API routes (POST + PATCH) + 3 res.json() in
// ConversionLedgerPanel (load/transition/submitAdd); each annotated
// inline, no delivery/audit/flywheel path swallowed.
// → 195 (Universal Audit Deliverable · 2026-05-20): +2 ALL canonical
// req.json()/res.json() body-parse exception class — 1 req.json() in
// /api/audit/action-titles (body parse on the LLM endpoint) + 1
// res.json() in DemoDeliverableHost (LLM action-title response parse
// with deterministic fallback). Both annotated inline; the deliverable
// always renders deterministic templates first — no delivery/audit/
// flywheel path swallowed.
const SILENT_CATCH_BASELINE = 195;

// Match `.catch(arg => trivial)` and `.catch((arg) => trivial)` and
// `.catch(() => trivial)`, where `trivial` is null / undefined / {} / [] /
// false / true / 0 / '' / "". Also catches multi-line variants where the
// arrow body is on the same line.
const SILENT_CATCH =
  /\.catch\s*\(\s*(?:\([^)]*\)|[a-zA-Z_$][\w$]*)?\s*=>\s*(?:null|undefined|\{\s*\}|\[\s*\]|false|true|0|''|"")\s*\)/g;

const TS_EXT = /\.(?:ts|tsx)$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      // Skip generated + vendored output.
      if (name === 'node_modules' || name === '.next' || name === 'dist') continue;
      walk(path, out);
    } else if (TS_EXT.test(name)) {
      out.push(path);
    }
  }
  return out;
}

const offenders = [];
for (const file of walk(SCAN_DIR)) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const matches = lines[i].match(SILENT_CATCH);
    if (matches) {
      for (let m = 0; m < matches.length; m++) {
        offenders.push({
          file: relative(ROOT, file),
          line: i + 1,
          snippet: lines[i].trim().slice(0, 140),
        });
      }
    }
  }
}

const total = offenders.length;
if (total > SILENT_CATCH_BASELINE) {
  console.error(
    `\n❌ silent-catch lint: ${total} silent catches found, baseline is ${SILENT_CATCH_BASELINE}.`
  );
  console.error(
    `   ${total - SILENT_CATCH_BASELINE} new silent catch(es) introduced. ` +
      `Either replace an existing one, upgrade the new one to log.warn, or ` +
      `bump SILENT_CATCH_BASELINE in scripts/lint-silent-catches.mjs with ` +
      `an inline comment naming the exception class (see CLAUDE.md ` +
      `Components & Patterns > Fire-and-forget error handling).\n`
  );
  console.error('   Recent silent catches (last 20 by file order):');
  for (const o of offenders.slice(-20)) {
    console.error(`     ${o.file}:${o.line}  ${o.snippet}`);
  }
  process.exit(1);
}

if (total < SILENT_CATCH_BASELINE) {
  console.log(
    `✓ silent-catch lint: ${total} silent catches (baseline ${SILENT_CATCH_BASELINE}; ` +
      `${SILENT_CATCH_BASELINE - total} below — bump baseline down in lint-silent-catches.mjs).`
  );
} else {
  console.log(`✓ silent-catch lint: ${total} silent catches at baseline.`);
}
