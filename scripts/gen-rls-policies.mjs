#!/usr/bin/env node
/**
 * RLS policy generator — Postgres Row-Level Security defense-in-depth for the
 * multi-tenant tables, grounded in prisma/schema.prisma so it can never drift.
 *
 * WHY THIS EXISTS
 * ---------------
 * Today tenant isolation is 100% application-layer: every read/write carries a
 * hand-written `where: { userId | orgId }`. One forgotten clause in any of 300+
 * routes = a cross-customer data leak, with nothing underneath to catch it.
 * Enterprise security reviews fail on exactly this. RLS is the DB-level backstop.
 *
 * THE ARCHITECTURE CONSTRAINT (read before touching the SQL)
 * ---------------------------------------------------------
 * Prisma connects through the Supabase pooler as a privileged role with NO user
 * JWT. So Supabase's native `auth.uid()` RLS does NOT apply to Prisma queries.
 * Real RLS for this app must:
 *   1. Use SESSION VARIABLES (`app.current_user_id` / `app.current_org_id`),
 *      set per-transaction by the Prisma client extension (see
 *      src/lib/db/tenant-context.ts), NOT `auth.uid()`.
 *   2. Use `FORCE ROW LEVEL SECURITY` — the Prisma role owns these tables and
 *      table owners BYPASS plain RLS. Without FORCE, the policies do nothing.
 *   3. FAIL OPEN until the app sets a context. The stage-1 policies allow any
 *      row when no session context is present, so applying them is a NO-OP for
 *      current Prisma queries (which set nothing) — zero outage risk. Protection
 *      turns on only at the enforce stage, after the extension is wired.
 *
 * OUTPUT (prisma/rls/)
 *   01_helpers.sql          – app schema + context-reading functions (idempotent)
 *   02_enable_failopen.sql  – ENABLE + FORCE RLS + fail-open policies  [PASTE NOW — safe]
 *   03_enforce.sql          – tighten: drop the fail-open clause       [PASTE AFTER extension is live]
 *   99_rollback.sql         – disable + drop everything                [instant kill switch]
 *
 * Regenerate with: node scripts/gen-rls-policies.mjs
 *
 * NOTE ON SCOPE: this generates policies for the 82 models that carry a DIRECT
 * tenant column (userId / orgId / organizationId / ownerId). Models scoped only
 * INDIRECTLY through a parent FK (Analysis→Document, BiasInstance→Analysis, …)
 * are listed in INDIRECT_REVIEW below and intentionally NOT auto-generated —
 * their policies need a join subquery and a human review of the parent path.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCHEMA = join(ROOT, 'prisma', 'schema.prisma');
const OUT_DIR = join(ROOT, 'prisma', 'rls');

const TENANT_COLS = ['organizationId', 'orgId', 'userId', 'ownerId'];
const ORG_COLS = new Set(['organizationId', 'orgId']);
const USER_COLS = new Set(['userId', 'ownerId']);

// Tables that look tenant-scoped by a column but are NOT customer-tenant data:
// these are the founder's own private surfaces (single-user, founder-pass gated)
// and the AuditLog. They still get RLS (defense-in-depth, scoped by userId), so
// no special-casing is needed — listed here only for documentation.
const FOUNDER_PRIVATE = new Set([
  'FounderOsCheckin', 'FounderOsContentLog', 'FounderOsSkill', 'FounderOsWeeklyReview',
  'FounderOsCommitment', 'FounderOsPrayerJournal', 'FounderOsReadingProgress',
  'FounderOsDailyGoal', 'FounderOsPeriodGoal', 'FounderOsDailyReflection',
  'FounderOsRealityCheckin', 'FounderOsRealityReflection', 'SatErrorLogEntry',
  'SatSettings', 'SatDailySession', 'SatTestResult', 'SatVocabCard',
  'OutreachArtifact', 'WedgeProspect', 'VohraPMFResponse',
]);

// Indirectly-scoped tables — documented so the runbook can pick them up in a
// reviewed stage 2. NOT generated here (need parent-join policies).
const INDIRECT_REVIEW = [
  'Analysis (→ Document.userId/orgId)',
  'BiasInstance (→ Analysis → Document)',
  'StructuralAssumption (→ Analysis)',
  'AnalysisVersion (→ Analysis)',
  'DecisionEmbedding (→ Document)',
  'MeetingTranscript (→ Meeting)',
  'DecisionContainerDocument / Link / CrossReference / Outcome (→ DecisionContainer)',
  'DecisionRoomBlindPrior (→ DecisionRoom)',
  'CopilotTurn (→ CopilotSession)',
  'DraftOutcome (→ Document/Analysis)',
  'ShareLinkAccess (→ ShareLink)',
  'ApiKeyUsage (→ ApiKey)',
  'WebhookDelivery (→ WebhookSubscription)',
  'CognitiveAudit (→ HumanDecision)',
];

function parseModels(src) {
  const out = [];
  const re = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, name, body] = m;
    const cols = [];
    for (const raw of body.split('\n')) {
      const line = raw.trim();
      const f = line.match(/^(\w+)\s+(\w+)(\?)?/);
      if (!f) continue;
      if (TENANT_COLS.includes(f[1]) && /^(String|Int|BigInt)$/.test(f[2])) {
        cols.push({ name: f[1], nullable: !!f[3] });
      }
    }
    if (cols.length) out.push({ name, cols });
  }
  return out;
}

function tenantPredicate(cols) {
  // A row is visible/writable when its user OR its org matches the request
  // context. Present columns are OR-ed; this correctly covers both individual
  // owners (userId match, orgId NULL) and org members (orgId match).
  const parts = [];
  for (const c of cols) {
    if (USER_COLS.has(c.name)) parts.push(`"${c.name}" = app.current_user_id()`);
    else if (ORG_COLS.has(c.name)) parts.push(`"${c.name}" = app.current_org_id()`);
  }
  return parts.join(' OR ');
}

function header(title, note) {
  return `-- ============================================================================
-- ${title}
-- GENERATED by scripts/gen-rls-policies.mjs from prisma/schema.prisma — DO NOT
-- edit by hand; regenerate instead. ${note}
-- ============================================================================\n\n`;
}

const HELPERS = `${header('01 · RLS context helpers', 'Idempotent. Run once.')}\
-- The "app" schema holds the per-request tenant context, read from session
-- variables that the Prisma client extension sets with SET LOCAL inside each
-- transaction (src/lib/db/tenant-context.ts). current_setting(..., true) =
-- missing_ok, so an unset variable returns NULL rather than erroring.
create schema if not exists app;

create or replace function app.current_user_id() returns text
  language sql stable
  as $$ select nullif(current_setting('app.current_user_id', true), '') $$;

create or replace function app.current_org_id() returns text
  language sql stable
  as $$ select nullif(current_setting('app.current_org_id', true), '') $$;

-- Escape hatch for trusted server paths (cron jobs, migrations, admin tooling,
-- the analysis pipeline) that legitimately operate across tenants. The Prisma
-- extension sets app.bypass_rls = 'on' for those code paths explicitly.
create or replace function app.rls_bypassed() returns boolean
  language sql stable
  as $$ select coalesce(current_setting('app.bypass_rls', true), 'off') = 'on' $$;

-- FAIL-OPEN guard. True when NO tenant context has been set on the connection.
-- Every current Prisma query sets nothing, so while this clause is in the
-- policies the app behaves exactly as it does today. The enforce stage
-- (03_enforce.sql) removes this clause to turn protection on.
create or replace function app.no_tenant_context() returns boolean
  language sql stable
  as $$ select app.current_user_id() is null and app.current_org_id() is null $$;
`;

function buildPolicies({ failOpen }) {
  const src = readFileSync(SCHEMA, 'utf8');
  const models = parseModels(src);
  const title = failOpen
    ? '02 · ENABLE + FORCE RLS · fail-open policies  [SAFE TO APPLY NOW]'
    : '03 · ENFORCE · drop the fail-open clause  [APPLY ONLY AFTER the Prisma extension is live in prod]';
  const note = failOpen
    ? 'Applying this is a no-op for current queries (no context is set → every row passes).'
    : 'This TURNS PROTECTION ON. Verify the tenant-context extension is wired on 100% of query paths first.';

  let sql = header(title, note);
  if (!failOpen) {
    sql += `-- PRECONDITION: src/lib/db/tenant-context.ts must wrap EVERY Prisma query
-- (request handlers set user/org context; cron/pipeline/admin set bypass).
-- If any path reaches the DB without context AND without bypass after this
-- runs, its queries will return zero rows. Roll out table-by-table and watch
-- error rates; 99_rollback.sql is the instant kill switch.\n\n`;
  }

  for (const model of models) {
    const pred = tenantPredicate(model.cols);
    if (!pred) continue;
    const t = `"${model.name}"`;
    const clause = failOpen
      ? `app.rls_bypassed() OR app.no_tenant_context() OR (${pred})`
      : `app.rls_bypassed() OR (${pred})`;
    const tag = FOUNDER_PRIVATE.has(model.name) ? '  -- founder-private (userId-scoped)' : '';
    sql += `alter table ${t} enable row level security;${tag}\n`;
    sql += `alter table ${t} force row level security;\n`;
    sql += `drop policy if exists tenant_isolation on ${t};\n`;
    sql += `create policy tenant_isolation on ${t}\n`;
    sql += `  using (${clause})\n`;
    sql += `  with check (${clause});\n\n`;
  }
  return { sql, count: models.filter(m => tenantPredicate(m.cols)).length };
}

function buildRollback() {
  const src = readFileSync(SCHEMA, 'utf8');
  const models = parseModels(src);
  let sql = header('99 · ROLLBACK · instant kill switch', 'Reverts to pre-RLS behavior immediately.');
  sql += `-- Run this whole file if RLS causes any issue. Drops the policy and
-- disables RLS on every generated table; the helper functions are harmless to
-- leave in place. After this, isolation reverts to application-layer only.\n\n`;
  for (const model of models) {
    if (!tenantPredicate(model.cols)) continue;
    const t = `"${model.name}"`;
    sql += `drop policy if exists tenant_isolation on ${t};\n`;
    sql += `alter table ${t} no force row level security;\n`;
    sql += `alter table ${t} disable row level security;\n`;
  }
  return sql;
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, '01_helpers.sql'), HELPERS);
const stage2 = buildPolicies({ failOpen: true });
writeFileSync(join(OUT_DIR, '02_enable_failopen.sql'), stage2.sql);
const stage3 = buildPolicies({ failOpen: false });
writeFileSync(join(OUT_DIR, '03_enforce.sql'), stage3.sql);
writeFileSync(join(OUT_DIR, '99_rollback.sql'), buildRollback());

const indirectNote =
  '-- Indirectly-scoped tables (need reviewed parent-join policies, NOT generated):\n' +
  INDIRECT_REVIEW.map(s => `--   ${s}`).join('\n') + '\n';
writeFileSync(join(OUT_DIR, '04_indirect_review.todo.sql'), header('04 · Indirect tables · REVIEW REQUIRED', 'Hand-write join policies; do not guess.') + indirectNote);

console.log(`✓ RLS SQL generated in prisma/rls/`);
console.log(`  01_helpers.sql            context functions`);
console.log(`  02_enable_failopen.sql    ${stage2.count} tables · ENABLE+FORCE+fail-open  [paste now, safe]`);
console.log(`  03_enforce.sql            ${stage3.count} tables · tighten to protected     [paste after extension]`);
console.log(`  99_rollback.sql           kill switch`);
console.log(`  04_indirect_review.todo.sql  ${INDIRECT_REVIEW.length} tables need hand-written join policies`);
