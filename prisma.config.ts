import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 configuration file.
 *
 * datasource.url is used exclusively by the Prisma CLI (prisma migrate,
 * prisma db push, etc.). It should point to the DIRECT database connection
 * so that migrations bypass any connection pooler (e.g. Supabase Supavisor /
 * PgBouncer) that does not support the prepared statements Prisma migrate
 * requires.
 *
 * We use process.env directly (not the env() helper) so that `prisma generate`
 * — which runs during `npm install` / Vercel build and does not need a live DB
 * connection — does not throw when DIRECT_URL is absent in the build environment.
 *
 * At runtime, Prisma Client uses the pooled DATABASE_URL passed via the
 * PrismaPg driver adapter in src/lib/prisma.ts.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL ?? '',
  },
});
