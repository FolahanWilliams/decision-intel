import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';
import { buildDocumentAccessFilter } from '@/lib/utils/document-access';

const log = createLogger('DealOutcomeRoute');

const OutcomeSchema = z
  .object({
    irr: z.number().min(-1).max(100).optional(),
    moic: z.number().min(0).max(1000).optional(),
    exitType: z.enum(['ipo', 'trade_sale', 'secondary', 'write_off', 'partial_exit']).optional(),
    exitValue: z.number().positive().optional(),
    holdPeriod: z.number().int().positive().max(180).optional(), // months, max 15 years
    notes: z.string().max(5000).optional(),
  })
  .refine(
    data => Object.values(data).some(v => v !== undefined),
    'At least one outcome field must be provided'
  );

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Atomic upsert + deal status update in a single transaction
    const outcome = await prisma.$transaction(async tx => {
      const result = await tx.dealOutcome.upsert({
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

      // If exit data provided, update deal status atomically
      if (parsed.data.exitType) {
        await tx.deal.update({
          where: { id: dealId },
          data: {
            status: parsed.data.exitType === 'write_off' ? 'written_off' : 'exited',
            exitDate: new Date(),
          },
        });
      }

      return result;
    });

    log.info(
      `Deal outcome recorded: deal=${dealId}, IRR=${parsed.data.irr}, MOIC=${parsed.data.moic}`
    );

    return NextResponse.json(outcome, { status: 201 });
  } catch (error) {
    log.error('Failed to create deal outcome:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // RBAC (3.5): the deal-detail view exposes its child documents'
    // metadata + DQI scores. Filter the included docs by the visibility
    // resolver so a private doc attached to a team-visible deal stays
    // hidden from teammates.
    const { where: docVisibilityWhere } = await buildDocumentAccessFilter(user.id);
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, orgId: orgId || user.id },
      include: {
        documents: {
          where: docVisibilityWhere,
          select: {
            id: true,
            filename: true,
            documentType: true,
            status: true,
            // 3.1 deal-centric: include the latest analysis per doc so the
            // deal page can compute composite DQI + bias signature in one
            // payload (avoids N+1 fetches from the client).
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                overallScore: true,
                biases: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Compute composite DQI + bias signature server-side so every consumer
    // (deal page, deal-list cards, analytics) reads the same numbers.
    const { aggregateDeal } = await import('@/lib/scoring/deal-aggregation');
    const latestAnalyses = (deal.documents || [])
      .map(d => {
        const latest = d.analyses?.[0];
        if (!latest) return null;
        const biasArr = Array.isArray(latest.biases)
          ? (latest.biases as Array<{ biasType?: string | null; severity?: string | null }>)
          : [];
        return {
          documentId: d.id,
          analysisId: latest.id,
          overallScore: latest.overallScore,
          biases: biasArr.map(b => ({
            biasType: b?.biasType || 'unknown_bias',
            severity: b?.severity ?? null,
          })),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    const aggregation = aggregateDeal(latestAnalyses);

    // 3.1 deep — most recent cross-reference run if any.
    // @schema-drift-tolerant — pre-3.1 environments simply return null here.
    const crossReference = await prisma.dealCrossReference
      .findFirst({
        where: { dealId },
        orderBy: { runAt: 'desc' },
      })
      .catch(() => null);

    return NextResponse.json({ ...deal, aggregation, crossReference });
  } catch (error) {
    log.error('Failed to fetch deal outcome:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
