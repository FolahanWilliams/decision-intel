/**
 * Experiment Detail API — get results and update status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { createClient } from '@/utils/supabase/server';
import { getExperimentResults, autoOptimizeExperiment } from '@/lib/nudges/ab-testing';
import { z } from 'zod';

const log = createLogger('ExperimentDetailAPI');

const UpdateSchema = z.object({
  status: z.enum(['active', 'paused', 'completed']).optional(),
  trafficSplit: z.record(z.string(), z.number().min(0).max(100)).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const experiment = await prisma.nudgeExperiment.findUnique({
      where: { id },
    });

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    // Compute per-variant results
    const results = await getExperimentResults(id);

    return NextResponse.json({ experiment, results });
  } catch (err) {
    log.error('Failed to fetch experiment:', err);
    return NextResponse.json({ error: 'Failed to fetch experiment' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  try {
    const data: Record<string, unknown> = {};
    if (parsed.data.status) {
      data.status = parsed.data.status;
      if (parsed.data.status === 'completed') {
        data.endedAt = new Date();
      }
    }
    if (parsed.data.trafficSplit) {
      data.trafficSplit = parsed.data.trafficSplit;
    }

    const experiment = await prisma.nudgeExperiment.update({
      where: { id },
      data,
    });

    return NextResponse.json({ experiment });
  } catch (err) {
    log.error('Failed to update experiment:', err);
    return NextResponse.json({ error: 'Failed to update experiment' }, { status: 500 });
  }
}

/**
 * POST /api/experiments/[id] — trigger auto-optimization (Thompson sampling)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await autoOptimizeExperiment(id);
    const results = await getExperimentResults(id);
    const experiment = await prisma.nudgeExperiment.findUnique({ where: { id } });

    return NextResponse.json({ experiment, results, optimized: true });
  } catch (err) {
    log.error('Failed to optimize experiment:', err);
    return NextResponse.json({ error: 'Failed to optimize' }, { status: 500 });
  }
}
