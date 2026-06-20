#!/usr/bin/env node
/**
 * Tenant-isolation ratchet — flags Prisma multi-row reads/writes on
 * tenant-scoped models that carry NO visible tenant filter, and fails when the
 * count exceeds the baseline below.
 *
 * WHY THIS EXISTS
 * Tenant isolation today is 100% application-layer: every query must hand-carry
 * `where: { userId | orgId }`. One forgotten clause = a cross-customer leak,
 * with nothing underneath to catch it (there is no DB-level RLS yet — see
 * prisma/rls/ + docs/rls-rollout-runbook.md for the defense-in-depth backstop
 * being rolled out). This gate is the cheap, immediate floor: it cannot
 * retroactively prove the 340 existing filters are correct, but it LOCKS the
 * current state and blocks NEW unguarded queries from landing.
 *
 * WHAT IT FLAGS
 * `prisma.<tenantModel>.<method>(...)` for the SET-returning / SET-mutating
 * methods (findMany, findFirst, updateMany, deleteMany, count, aggregate,
 * groupBy) when neither the call's arguments nor the surrounding window mention
 * a tenant token (userId / orgId / organizationId / ownerId) or a blessed
 * tenant-scoping helper. findUnique / update / delete BY unique id are not
 * flagged — those return a single row that handlers conventionally ownership-
 * check afterwards, and flagging them floods the signal (cry-wolf is the enemy).
 *
 * ESCAPE HATCH (matches the codebase dialect — `// canonical-exception`, etc.)
 *   // tenant-safe: <reason>   on the call line or the line above
 * Use for genuinely global models filtered elsewhere, admin/cron cross-tenant
 * reads, or queries scoped by a helper this linter can't see through.
 *
 * Run via `npm run lint:tenant-isolation`. Intended for pre-commit + CI.
 *
 * To add a guarded query: just include the tenant filter — no baseline change.
 * To add a legitimately-unscoped query: add `// tenant-safe: <reason>` AND, if
 * the regex still can't tell, bump TENANT_ISOLATION_BASELINE with a one-line
 * note. Never silently drift up.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = [join(ROOT, 'src', 'app', 'api'), join(ROOT, 'src', 'lib')];

// Baseline as of 2026-06-20 (the commit shipping this linter). This is a
// RATCHET: the existing sites at baseline are the pre-existing app-layer
// surface that RLS (prisma/rls/) is being rolled out to backstop. Reducing is
// encouraged (add the filter or the escape-hatch comment); never drift up.
// Baseline 72 as of 2026-06-20. Each is a SET read/write on a tenant model with
// no tenant filter visible to the linter. The majority are intentionally
// cross-tenant (admin dashboards, cron jobs, health checks, Slack-by-team-id,
// founder single-user surfaces) — but the set is the triage list for the RLS
// rollout: burn it down by adding `// tenant-safe: <reason>` to the legitimate
// cross-tenant ones and a real filter to any that turn out to be genuine gaps,
// ratcheting this number down as you go.
const TENANT_ISOLATION_BASELINE = 72;

// Prisma client accessors (camelCase) for models with a DIRECT tenant column.
// Source of truth is prisma/schema.prisma; keep in sync via scripts/gen-rls-policies.mjs.
const TENANT_MODELS = new Set(
  [
    'Document', 'LegalHold', 'DocumentAccess', 'DecisionContainer', 'AnalysisReservation',
    'BiasComment', 'BiasTask', 'AuditLog', 'UserSettings', 'VohraPMFResponse',
    'SsoConfiguration', 'TeamMember', 'TeamInvite', 'SlackInstallation', 'Meeting',
    'HumanDecision', 'Nudge', 'TeamCognitiveProfile', 'FounderOsCheckin',
    'FounderOsContentLog', 'FounderOsSkill', 'FounderOsWeeklyReview', 'FounderOsCommitment',
    'FounderOsPrayerJournal', 'FounderOsReadingProgress', 'FounderOsDailyGoal',
    'FounderOsPeriodGoal', 'FounderOsDailyReflection', 'FounderOsRealityCheckin',
    'FounderOsRealityReflection', 'SatErrorLogEntry', 'SatSettings', 'SatDailySession',
    'SatTestResult', 'SatVocabCard', 'MicroDeliberationOutcome', 'DecisionOutcome',
    'BoardroomPersona', 'ShareLink', 'NotificationLog', 'FailedAnalysis', 'GraphShareLink',
    'BatchUpload', 'CalibrationProfile', 'CausalEdge', 'OrgCausalModel', 'DecisionPrior',
    'DecisionFrame', 'RedTeamChallenge', 'DecisionRoom', 'DecisionRoomInvite',
    'RoomParticipant', 'BlindPrior', 'JournalEntry', 'ApiKey', 'ToxicCombination',
    'ToxicPattern', 'DecisionEdge', 'DecisionBriefRecord', 'ContextualBiasPattern',
    'FingerprintWarning', 'ChatSession', 'ApiUsage', 'CopilotSession', 'CopilotOutcome',
    'AnalyticsEvent', 'VoiceSessionEvent', 'Subscription', 'WebhookSubscription',
    'DecisionAttribution', 'DecisionPlaybook', 'PlaybookInvocation', 'CalibrationMilestone',
    'DecisionContainerAuditPurchase', 'ConstellationPriorityCapture', 'RejectedDecision',
    'GoogleDriveInstallation', 'OutreachArtifact', 'WedgeProspect', 'DecisionProvenanceRecord',
    'DqiWeightOverride', 'AmbientThesisSignal',
  ].map(m => m.charAt(0).toLowerCase() + m.slice(1))
);

// SET-returning / SET-mutating methods where a missing tenant filter is a real
// cross-tenant read or over-broad write. by-id findUnique/update/delete excluded.
const RISKY_METHODS = ['findMany', 'findFirst', 'updateMany', 'deleteMany', 'count', 'aggregate', 'groupBy'];

// Tokens / helpers whose presence near the call means "a tenant scope is applied".
const TENANT_TOKENS = [
  'userId', 'orgId', 'organizationId', 'ownerId',
  'accessFilter', 'AccessFilter', 'tenantWhere', 'withTenantContext', 'withRlsBypass',
  'teamMember', 'assertOwnership', 'requireOrgAccess', 'currentUserId', 'session.user',
  // Blessed access-scoping helpers whose return value carries the tenant filter.
  'buildDocumentAccessFilter', 'getAccessibleDocumentIds', 'accessibleDocumentIds',
  'resolveOrgId', 'getOrgIdForUser', 'membership', 'ownerWhere',
];

const ESCAPE = /\/\/\s*tenant-safe:/;

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '__tests__') continue;
      walk(p, acc);
    } else if (/\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p) && !/\.d\.ts$/.test(p)) {
      acc.push(p);
    }
  }
  return acc;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const callRe = /prisma\.([a-zA-Z]+)\.([a-zA-Z]+)\s*\(/g;
const offenders = [];

for (const file of walk(SCAN_DIRS[0]).concat(walk(SCAN_DIRS[1]))) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  let m;
  while ((m = callRe.exec(text)) !== null) {
    const [, model, method] = m;
    if (!TENANT_MODELS.has(model)) continue;
    if (!RISKY_METHODS.includes(method)) continue;

    const callLine = lineOf(text, m.index);
    // Window: the call line, a generous look-back (handlers commonly build the
    // `where`/access filter near the top of the function and use it lower down),
    // and the argument block after.
    const startLine = Math.max(0, callLine - 22);
    const endLine = Math.min(lines.length, callLine + 14);
    const window = lines.slice(startLine, endLine).join('\n');

    if (ESCAPE.test(lines[callLine - 1] || '') || ESCAPE.test(lines[callLine - 2] || '')) continue;
    if (TENANT_TOKENS.some(t => window.includes(t))) continue;

    offenders.push({
      file: relative(ROOT, file),
      line: callLine,
      snippet: `prisma.${model}.${method}(…) — no tenant filter in scope`,
    });
  }
}

const total = offenders.length;
const baseline = Number.isFinite(TENANT_ISOLATION_BASELINE) ? TENANT_ISOLATION_BASELINE : total;

if (!Number.isFinite(TENANT_ISOLATION_BASELINE)) {
  // First run: print the discovered baseline so it can be pinned in this file.
  console.log(`\nℹ tenant-isolation lint: discovered ${total} unguarded tenant queries.`);
  console.log(`  Pin TENANT_ISOLATION_BASELINE = ${total} in scripts/lint-tenant-isolation.mjs.`);
  console.log(`  Offenders:`);
  for (const o of offenders) console.log(`    ${o.file}:${o.line}  ${o.snippet}`);
  process.exit(0);
}

if (total > baseline) {
  console.error(`\n❌ tenant-isolation lint: ${total} unguarded tenant queries, baseline ${baseline}.`);
  console.error(`   ${total - baseline} new query(ies) on a tenant-scoped model with no tenant filter`);
  console.error(`   in scope. Add the \`where: { userId | orgId }\`, route through a scoping helper,`);
  console.error(`   or add \`// tenant-safe: <reason>\` and bump the baseline with a note.\n`);
  for (const o of offenders.slice(-25)) console.error(`     ${o.file}:${o.line}  ${o.snippet}`);
  process.exit(1);
}

if (total < baseline) {
  console.log(`✓ tenant-isolation lint: ${total} unguarded (baseline ${baseline}; ${baseline - total} below — ratchet the baseline down).`);
} else {
  console.log(`✓ tenant-isolation lint: ${total} unguarded queries at baseline.`);
}
