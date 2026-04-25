/**
 * Shared Prisma client factory for seed scripts run during Vercel deploy.
 *
 * Mirrors the SSL workaround in src/lib/prisma.ts: pg ≥ 8.12 +
 * pg-connection-string ≥ 2.8 reinterpret `sslmode=require|prefer|verify-ca`
 * as `verify-full`, which fails on managed providers (Supabase, Neon,
 * Railway) whose internal CA is not in Node's system trust store. Even when
 * we pass `ssl: { rejectUnauthorized: false }` to Pool, pg-connection-string
 * re-parses the URL and overwrites it.
 *
 * Fix: strip `sslmode` from the URL entirely, then pass the ssl override
 * directly to the Pool. Transport encryption is preserved; only CA chain
 * verification is skipped.
 *
 * If we don't do this, every seed during a Vercel deploy fails with
 * "Error opening a TLS connection: self-signed certificate in certificate
 * chain" (P1011) and the seed-business-data wrapper falls through to its
 * non-fatal warning path — meaning seeds silently never run in prod.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export function createSeedPrismaClient(): { prisma: PrismaClient; pool: Pool } {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  let connectionString = rawUrl;
  let needsSsl = false;

  try {
    const url = new URL(rawUrl);
    const sslMode = url.searchParams.get('sslmode');
    needsSsl = sslMode !== null;
    url.searchParams.delete('sslmode');
    connectionString = url.toString();
  } catch {
    needsSsl = /[?&]sslmode=/.test(rawUrl);
  }

  const pool = new Pool({
    connectionString,
    ...(needsSsl && { ssl: { rejectUnauthorized: false } }),
    connectionTimeoutMillis: 10000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  const prisma = new PrismaClient({ adapter });
  return { prisma, pool };
}
