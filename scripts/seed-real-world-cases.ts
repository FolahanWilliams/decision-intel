/**
 * Seed Script: Populates CaseStudy table with real-world public company cases.
 *
 * Sources verified, named case studies from the static data files into the
 * Prisma CaseStudy table for RAG matching, public gallery, and intelligence context.
 *
 * Usage: npx tsx scripts/seed-real-world-cases.ts
 * Requires: DATABASE_URL environment variable
 */

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

// Import all case studies from the unified index
import { ALL_CASES } from '../src/lib/data/case-studies';

async function main() {
  console.log(`\n🔬 Seeding ${ALL_CASES.length} real-world case studies...\n`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const caseStudy of ALL_CASES) {
    try {
      const existing = await prisma.caseStudy.findFirst({
        where: {
          company: caseStudy.company,
          title: caseStudy.title,
        },
      });

      const data = {
        title: caseStudy.title,
        company: caseStudy.company,
        industry: caseStudy.industry,
        outcome: caseStudy.outcome,
        year: caseStudy.year,
        summary: caseStudy.summary,
        lessons: caseStudy.lessonsLearned.join('\n\n'),
        biasTypes: caseStudy.biasesPresent,
        impactDirection: caseStudy.impactDirection,
        impactScore: caseStudy.impactScore,
        estimatedImpact: caseStudy.estimatedImpact,
        biasesManaged: caseStudy.biasesManaged,
        mitigationFactors: caseStudy.mitigationFactors,
        beneficialPatterns: caseStudy.beneficialPatterns,
        survivorshipBiasRisk: caseStudy.survivorshipBiasRisk,
        source: caseStudy.source,
        sourceType: caseStudy.sourceType,
        decisionContext: caseStudy.decisionContext,
      };

      if (existing) {
        await prisma.caseStudy.update({
          where: { id: existing.id },
          data,
        });
        updated++;
        console.log(`  ✏️  Updated: ${caseStudy.company} — ${caseStudy.title}`);
      } else {
        await prisma.caseStudy.create({ data });
        created++;
        console.log(`  ✅ Created: ${caseStudy.company} — ${caseStudy.title}`);
      }
    } catch (err) {
      errors++;
      console.error(`  ❌ Error: ${caseStudy.company} — ${(err as Error).message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors:  ${errors}`);
  console.log(`   Total:   ${ALL_CASES.length}\n`);

  // Print statistics
  const failureCount = ALL_CASES.filter(c =>
    ['catastrophic_failure', 'failure', 'partial_failure'].includes(c.outcome)
  ).length;
  const successCount = ALL_CASES.filter(c =>
    ['success', 'exceptional_success', 'partial_success'].includes(c.outcome)
  ).length;

  const industries = new Set(ALL_CASES.map(c => c.industry));
  const biases = new Set(ALL_CASES.flatMap(c => c.biasesPresent));

  console.log(`📈 Database Statistics:`);
  console.log(`   Failure cases:  ${failureCount}`);
  console.log(`   Success cases:  ${successCount}`);
  console.log(`   Industries:     ${industries.size}`);
  console.log(`   Unique biases:  ${biases.size}`);
  console.log();
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
