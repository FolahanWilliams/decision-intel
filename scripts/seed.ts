import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Database Connection Test ---');
  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully.');

    // Simple query to verify schema
    const docCount = await prisma.document.count();
    console.log(`📊 Current document count: ${docCount}`);

  } catch (e) {
    console.error('❌ Database connection failed:');
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database.');
  }
}

main();
