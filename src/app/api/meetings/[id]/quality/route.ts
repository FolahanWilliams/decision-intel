/**
 * GET /api/meetings/[id]/quality — Compute decision quality prediction for a meeting
 *
 * Returns a quality prediction based on stored speaker biases, key decisions,
 * and available summary data. Note: predictions computed on-demand have reduced
 * confidence because the full MeetingSummary (agenda, outcomes, openQuestions)
 * is not persisted — only the executive summary text is stored.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { predictDecisionQuality } from '@/lib/meetings/quality-predictor';
import type { SpeakerBiasProfile, KeyDecision, MeetingSummary } from '@/lib/meetings/intelligence';

const log = createLogger('QualityAPI');

function parseSpeakerBiases(raw: unknown): SpeakerBiasProfile[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is SpeakerBiasProfile =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).speaker === 'string'
  );
}

function parseKeyDecisions(raw: unknown): KeyDecision[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is KeyDecision =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).text === 'string'
  );
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let meeting;
    try {
      meeting = await prisma.meeting.findFirst({
        where: { id, userId: user.id },
        select: {
          id: true,
          status: true,
          summary: true,
          speakerBiases: true,
          keyDecisions: true,
        },
      });
    } catch (dbError: unknown) {
      const code = (dbError as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Schema drift in quality prediction query');
        return NextResponse.json(
          { error: 'Meeting data not available — schema migration required.' },
          { status: 503 }
        );
      }
      throw dbError;
    }

    if (!meeting) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (meeting.status !== 'analyzed' && meeting.status !== 'complete') {
      return NextResponse.json({ error: 'Meeting has not been analyzed yet' }, { status: 422 });
    }

    const speakerBiases = parseSpeakerBiases(meeting.speakerBiases);
    const keyDecisions = parseKeyDecisions(meeting.keyDecisions);

    // Reconstruct a partial MeetingSummary from stored data.
    // Only the executive summary text is persisted; agenda, outcomes, etc. are empty.
    // This reduces confidence in risk-discussion and engagement signals.
    const partialSummary: MeetingSummary = {
      executive: meeting.summary ?? '',
      agenda: [],
      outcomes: [],
      nextSteps: [],
      openQuestions: [],
      sentiment: 'neutral',
      engagementScore: 50,
    };

    const prediction = predictDecisionQuality(partialSummary, speakerBiases, keyDecisions);

    return NextResponse.json({
      meetingId: meeting.id,
      prediction,
      dataCompleteness: 'partial',
      note: 'On-demand prediction uses stored data only. Pipeline-time predictions (logged during analysis) use the full meeting summary for higher accuracy.',
    });
  } catch (error) {
    log.error('Quality prediction API failed:', error);
    return NextResponse.json({ error: 'Failed to compute quality prediction' }, { status: 500 });
  }
}
