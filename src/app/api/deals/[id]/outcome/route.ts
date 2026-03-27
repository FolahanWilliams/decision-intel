import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

const log = createLogger('DealOutcomeRoute');

const OutcomeSchema = z.object({
  irr: z.number().min(-1).max(100).optional(),
  moic: z.number().min(0).max(1000).optional(),
  exitType: z.enum(['ipo', 'trade_sale', 'secondary', 'write_off', 'partial_exit']).optional(),
  exitValue: z.number().positive().optional(),
  holdPeriod: z.number().int().positive().max(600).optional(), // months, max 50 years
  notes: z.string().max(5000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve org and verify deal ownership
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // Schema drift
    }

    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: orgId || user.id },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = OutcomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Upsert: one outcome per deal
    const outcome = await prisma.dealOutcome.upsert({
      where: { dealId },
      create: {
        dealId,
        irr: parsed.data.irr,
        moic: parsed.data.moic,
        exitType: parsed.data.exitType,
        exitValue: parsed.data.exitValue,
        holdPeriod: parsed.data.holdPeriod,
        notes: parsed.data.notes,
      },
      update: {
        irr: parsed.data.irr,
        moic: parsed.data.moic,
        exitType: parsed.data.exitType,
        exitValue: parsed.data.exitValue,
        holdPeriod: parsed.data.holdPeriod,
        notes: parsed.data.notes,
      },
    });

    // If exit data provided, update deal status
    if (parsed.data.exitType) {
      await prisma.deal.update({
        where: { id: dealId },
        data: {
          status: parsed.data.exitType === 'write_off' ? 'written_off' : 'exited',
          exitDate: new Date(),
        },
      });
    }

    log.info(`Deal outcome recorded: deal=${dealId}, IRR=${parsed.data.irr}, MOIC=${parsed.data.moic}`);

    return NextResponse.json(outcome, { status: 201 });
  } catch (error) {
    log.error('Failed to create deal outcome:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve org and verify deal ownership
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch {
      // Schema drift
    }

    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: orgId || user.id },
      include: {
        outcome: true,
        documents: {
          select: { id: true, filename: true, documentType: true, status: true },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    log.error('Failed to fetch deal outcome:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
