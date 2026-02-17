import { defineConfig, env } from 'prisma/config';

/**
 * Prisma 7 configuration file.
 *
 * datasource.url is used exclusively by the Prisma CLI (prisma generate,
 * prisma migrate, prisma db push, etc.). It should point to the DIRECT
 * database connection so that migrations bypass any connection pooler
 * (e.g. Supabase Supavisor / PgBouncer) that does not support the
 * prepared statements that Prisma migrate requires.
 *
 * At runtime, Prisma Client uses the pooled DATABASE_URL passed via the
 * PrismaPg driver adapter in src/lib/prisma.ts — keeping serverless
 * connection counts low by routing through the pooler.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
});
