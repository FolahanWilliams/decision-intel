#!/usr/bin/env node
// Wraps `prisma migrate deploy` so that a transient database-unreachable
// error (P1001) does not hard-fail the Vercel build. Any other prisma
// migration error (bad migration, schema conflict, etc.) is still fatal.
//
// Why: Supabase free-tier databases pause after inactivity. If the DB is
// asleep at the exact moment Vercel runs `npm run build`, the build fails
// on migrate deploy even though migrations are not strictly required for
// the build artifact. This wrapper logs a loud warning and continues, so
// the next deploy on a live DB will still apply the pending migrations.
//
// Failure modes preserved (non-zero exit):
//   - P3006 / P3009 / any migration error that isn't purely connection
//   - missing env vars, auth failures, etc.

import { spawnSync } from 'node:child_process';

const res = spawnSync('npx', ['--no-install', 'prisma', 'migrate', 'deploy'], {
  stdio: 'pipe',
  encoding: 'utf8',
  env: process.env,
});

const stdout = res.stdout ?? '';
const stderr = res.stderr ?? '';
process.stdout.write(stdout);
process.stderr.write(stderr);

if (res.status === 0) {
  process.exit(0);
}

const combined = stdout + '\n' + stderr;
const isConnectionError = /P1001|Can't reach database server|ECONNREFUSED|ETIMEDOUT/i.test(
  combined
);

if (isConnectionError) {
  console.warn(
    '\n[prisma-migrate-safe] WARNING: Database was unreachable (P1001). ' +
      'Continuing build without applying migrations. Re-deploy once the ' +
      'database is reachable to apply any pending migrations.\n'
  );
  process.exit(0);
}

process.exit(res.status ?? 1);
