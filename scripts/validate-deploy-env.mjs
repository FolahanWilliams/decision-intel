#!/usr/bin/env node
/**
 * Deploy-time environment validator.
 *
 * Runs BEFORE `next build` on Vercel / CI to catch misconfigurations that
 * would otherwise surface as silent demo failures or admin lockouts in
 * production. Local `npm run build` emits the same checks as warnings
 * without failing the build — so Claude / the founder can still build
 * locally without the full env var set.
 *
 * Current checks:
 *   1. ADMIN_USER_IDS entries are valid UUIDs.
 *   2. If DEMO_USER_ID is set, it must appear in ADMIN_USER_IDS (otherwise
 *      the demo endpoint fails once the free-tier quota is exhausted).
 *   3. If DEMO_USER_ID is set without ADMIN_USER_IDS, fail hard — the
 *      plan-bypass is inactive and every visitor after the first four
 *      will hit a quota error.
 *
 * Add a new check here when you introduce any new env var pair that must
 * stay aligned across deploys.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isCI = !!(process.env.CI || process.env.VERCEL || process.env.VERCEL_ENV);

const errors = [];
const warnings = [];

const adminIdsRaw = process.env.ADMIN_USER_IDS?.trim();
const demoUserId = process.env.DEMO_USER_ID?.trim();

if (adminIdsRaw) {
  const entries = adminIdsRaw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const invalid = entries.filter(id => !UUID_RE.test(id));
  if (invalid.length > 0) {
    errors.push(
      `ADMIN_USER_IDS contains ${invalid.length} entry/entries that are not valid UUIDs: ${invalid.join(', ')}`
    );
  }
  if (demoUserId && !entries.includes(demoUserId)) {
    errors.push(
      `DEMO_USER_ID (${demoUserId}) is not present in ADMIN_USER_IDS. The demo endpoint will fail for visitors once the free-tier quota is consumed. Add the demo UUID to ADMIN_USER_IDS.`
    );
  }
} else if (demoUserId) {
  errors.push(
    `DEMO_USER_ID is set but ADMIN_USER_IDS is empty. Plan-bypass is inactive — the first 4 demo audits will succeed, then every subsequent visitor hits a quota error. Add DEMO_USER_ID to ADMIN_USER_IDS.`
  );
}

// Non-blocking hygiene warnings (useful to see, never fatal).
if (process.env.NODE_ENV === 'production' && !adminIdsRaw && !process.env.ADMIN_EMAILS) {
  warnings.push(
    'Neither ADMIN_USER_IDS nor ADMIN_EMAILS is set — admin surfaces (/dashboard/admin/*) will be inaccessible in production.'
  );
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('[validate-deploy-env] OK');
  process.exit(0);
}

for (const w of warnings) console.warn(`[validate-deploy-env] WARN: ${w}`);
for (const e of errors) console.error(`[validate-deploy-env] ERROR: ${e}`);

if (errors.length > 0 && isCI) {
  console.error(
    `[validate-deploy-env] ${errors.length} error(s) — failing the build. Fix the env vars in the Vercel project settings and redeploy.`
  );
  process.exit(1);
}

if (errors.length > 0) {
  console.warn(
    `[validate-deploy-env] ${errors.length} error(s) — continuing because this is a local build. In CI this would fail.`
  );
}

process.exit(0);
