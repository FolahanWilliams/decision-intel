import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
