import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma for serverless environments with Supabase
// Using connection pooler (port 6543) for better serverless compatibility
const prismaClientSingleton = () => {
  return new PrismaClient({
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
    // Simple query to test connection
    // Using $queryRawUnsafe because PgBouncer doesn't support prepared statements
    await prisma.$queryRawUnsafe(`SELECT 1`);
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
