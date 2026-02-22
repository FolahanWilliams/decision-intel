import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';


const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma for serverless environments with Supabase.
// In Prisma 7, the database URL is no longer read from schema.prisma at
// runtime — it must be supplied via a driver adapter.  We use @prisma/adapter-pg
// with the *pooled* DATABASE_URL so that Vercel serverless functions route
// through Supabase Supavisor (PgBouncer), keeping connection counts low.
// The Prisma CLI (migrations) uses DIRECT_URL via prisma.config.ts.
//
// pg ≥ 8.12 changed SSL mode semantics: 'require', 'prefer', and 'verify-ca'
// are now treated as 'verify-full', causing "self-signed certificate in
// certificate chain" errors on managed databases (Supabase, Neon, Railway).
// We create an explicit Pool with rejectUnauthorized:false whenever the
// DATABASE_URL contains an SSL mode, which preserves encryption while
// accepting the provider's internal certificate authority.
const prismaClientSingleton = () => {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  // pg ≥ 8.12 / pg-connection-string ≥ 2.8 changed SSL mode semantics so
  // that 'require', 'prefer', and 'verify-ca' are parsed as 'verify-full'.
  // That causes "self-signed certificate in certificate chain" (P1011) on
  // managed providers (Supabase, Neon, Railway) whose CA isn't in the system
  // trust store.
  //
  // Root cause: even when we pass ssl:{rejectUnauthorized:false} to Pool,
  // pg-connection-string re-parses the sslmode in the connection string and
  // overwrites our ssl config with rejectUnauthorized:true.
  //
  // Fix: strip sslmode from the URL entirely so pg-connection-string never
  // touches the ssl config, then pass ssl:{rejectUnauthorized:false} directly.
  // Transport encryption is still enforced; only CA chain verification is
  // skipped (the provider's internal CA is not in the system trust store).
  let connectionString = rawUrl;
  let needsSsl = false;

  try {
    const url = new URL(rawUrl);
    const sslMode = url.searchParams.get('sslmode');
    needsSsl = sslMode !== null;
    url.searchParams.delete('sslmode');
    connectionString = url.toString();
  } catch {
    // Malformed URL — fall back to the raw string; ssl will not be forced.
    needsSsl = /[?&]sslmode=/.test(rawUrl);
  }

  const pool = new Pool({
    connectionString,
    ...(needsSsl && { ssl: { rejectUnauthorized: false } }),
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper function to test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Gracefully handle shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
