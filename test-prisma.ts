import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('Prisma initialized');
  try {
    await prisma.$connect();
    console.log('Connected');
  } catch(e) {
    console.error(e);
  }
}
main();
