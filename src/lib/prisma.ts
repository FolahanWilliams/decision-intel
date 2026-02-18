import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma for serverless environments with Supabase.
// In Prisma 7, the database URL is no longer read from schema.prisma at
// runtime — it must be supplied via a driver adapter.  We use @prisma/adapter-pg
// with the *pooled* DATABASE_URL so that Vercel serverless functions route
// through Supabase Supavisor (PgBouncer), keeping connection counts low.
// The Prisma CLI (migrations) uses DIRECT_URL via prisma.config.ts.
const prismaClientSingleton = () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
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
