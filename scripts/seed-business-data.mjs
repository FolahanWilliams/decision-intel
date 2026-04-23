#!/usr/bin/env node
/**
 * Runs on every Vercel build after `prisma migrate deploy`. Seeds
 * business-critical, version-controlled records (design-partner pilot
 * prospects, etc.) that should live in Git rather than being hand-entered
 * in the UI. Each seed is idempotent and create-only by default, so this
 * script never overwrites edits the founder made via the Founder Hub UI.
 *
 * Failure modes:
 *   - DB unreachable (P1001, ECONNREFUSED, ETIMEDOUT) → loud warning, exit 0.
 *     The deploy continues; the seed retries on the next deploy.
 *   - DATABASE_URL missing (e.g. local dev without env) → skip, exit 0.
 *   - Actual seed-script failure → loud warning, exit 0. Business-data
 *     seeds should never block a product deploy.
 *
 * Why non-fatal: the 11-hr build-hang postmortem burned on "one more thing
 * can fail the build." Business data is not production-critical for the
 * build artifact. If Sankore doesn't land on this deploy, it lands on the
 * next one.
 */

import { spawnSync } from 'node:child_process';

const SEEDS = [
  {
    name: 'sankore-partner',
    path: 'scripts/seed-sankore-partner.ts',
  },
  {
    name: 'gabe-meeting',
    path: 'scripts/seed-gabe-meeting.ts',
  },
];

if (!process.env.DATABASE_URL) {
  console.log('[seed-business-data] DATABASE_URL not set — skipping all seeds.');
  process.exit(0);
}

let hadError = false;

for (const seed of SEEDS) {
  console.log(`[seed-business-data] running ${seed.name}...`);
  const res = spawnSync('npx', ['--no-install', 'tsx', seed.path], {
    stdio: 'pipe',
    encoding: 'utf8',
    env: process.env,
  });

  const stdout = res.stdout ?? '';
  const stderr = res.stderr ?? '';
  process.stdout.write(stdout);
  process.stderr.write(stderr);

  if (res.status === 0) {
    console.log(`[seed-business-data] ${seed.name} ok.\n`);
    continue;
  }

  const combined = stdout + '\n' + stderr;
  const isConnectionError = /P1001|Can't reach database server|ECONNREFUSED|ETIMEDOUT/i.test(
    combined
  );

  if (isConnectionError) {
    console.warn(
      `\n[seed-business-data] WARNING: DB unreachable during ${seed.name}. ` +
        `Continuing build. Re-deploy once the DB is reachable.\n`
    );
  } else {
    console.warn(
      `\n[seed-business-data] WARNING: ${seed.name} failed. Continuing build ` +
        `(business-data seeds never block deploys). Fix and re-deploy.\n`
    );
    hadError = true;
  }
}

if (hadError) {
  console.warn(
    '[seed-business-data] One or more seeds failed. Check logs above; the build continues.'
  );
}

process.exit(0);
