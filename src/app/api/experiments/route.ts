/**
 * Experiment CRUD API — create and list A/B experiments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const log = createLogger('ExperimentsAPI');

const CreateExperimentSchema = z.object({
  name: z.string().min(1).max(200),
  nudgeType: z.string().min(1).max(100),
  variants: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        template: z.string().min(1),
        severity: z.string().default('medium'),
      })
    )
    .min(2)
    .max(10),
  trafficSplit: z.record(z.string(), z.number().min(0).max(100)).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const experiments = await prisma.nudgeExperiment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ experiments });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'P2021' || code === 'P2022') {
      return NextResponse.json({ experiments: [] });
    }
    log.error('Failed to list experiments:', err);
    return NextResponse.json({ error: 'Failed to fetch experiments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateExperimentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const { name, nudgeType, variants, trafficSplit } = parsed.data;

  // Default traffic split: equal distribution
  const finalSplit =
    trafficSplit ??
    Object.fromEntries(variants.map(v => [v.id, Math.floor(100 / variants.length)]));

  // Ensure split sums to ~100
  const splitSum = Object.values(finalSplit).reduce((a, b) => a + b, 0);
  if (splitSum < 95 || splitSum > 105) {
    return NextResponse.json(
      { error: 'Traffic split must sum to approximately 100' },
      { status: 400 }
    );
  }

  try {
    const experiment = await prisma.nudgeExperiment.create({
      data: {
        name,
        nudgeType,
        status: 'active',
        variants: JSON.parse(JSON.stringify(variants)),
        trafficSplit: finalSplit,
        startedAt: new Date(),
      },
    });

    return NextResponse.json({ experiment }, { status: 201 });
  } catch (err) {
    log.error('Failed to create experiment:', err);
    return NextResponse.json({ error: 'Failed to create experiment' }, { status: 500 });
  }
}
