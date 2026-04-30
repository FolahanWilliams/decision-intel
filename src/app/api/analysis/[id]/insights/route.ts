/**
 * GET /api/analysis/[id]/insights
 *
 * Returns the three Kahneman-Klein-anchored signals for the document-
 * detail UI: validity classification + reference-class forecast +
 * feedback adequacy. Each is also rendered on the DPR cover; this
 * endpoint is the live-audit equivalent for the OverviewTab UI cards.
 *
 * Performance: feedback adequacy hits Prisma; reference-class forecast
 * is pure function over the in-memory case library; validity
 * classification is read from judgeOutputs (or live-computed for legacy
 * analyses). Fast enough to be invoked on every document-detail render
 * without measurable cost — typical response < 50ms.
 *
 * Access: user must own the document OR be in the document's org.
 *
 * Locked: 2026-04-30 (paper-application sprint UI surfacing).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { resolveAnalysisAccess } from '@/lib/utils/document-access';
import {
  classifyValidity,
  type ValidityClassification,
} from '@/lib/learning/validity-classifier';
import {
  getReferenceClassForecast,
  type ReferenceClassForecast,
} from '@/lib/learning/reference-class-forecast';
import {
  getFeedbackAdequacy,
  type FeedbackAdequacy,
} from '@/lib/learning/feedback-adequacy';

const log = createLogger('AnalysisInsightsAPI');

export interface AnalysisInsightsResponse {
  analysisId: string;
  validityClassification: ValidityClassification;
  referenceClassForecast: ReferenceClassForecast;
  feedbackAdequacy: FeedbackAdequacy;
  /** Source of the validity classification — 'persisted' when the
   *  pipeline stored it on judgeOutputs at audit-completion time,
   *  'live' when computed at request time (legacy fallback). The UI
   *  surfaces this so a procurement reader can tell whether the band
   *  in front of them was the one the audit was originally scored
   *  against. */
  validitySource: 'persisted' | 'live';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Access check via the standard analysis gate
  const access = await resolveAnalysisAccess(id, user.id);
  if (!access) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
  }

  // Fetch the rows we need
  let analysis: {
    id: string;
    judgeOutputs: unknown;
    biases: Array<{ biasType: string }>;
    document: {
      userId: string;
      documentType: string | null;
    };
  } | null;
  try {
    analysis = await prisma.analysis.findFirst({
      where: { id },
      select: {
        id: true,
        judgeOutputs: true,
        biases: {
          select: { biasType: true },
        },
        document: {
          select: {
            userId: true,
            documentType: true,
          },
        },
      },
    });
  } catch (err) {
    log.warn('analysis lookup failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Analysis lookup failed' }, { status: 503 });
  }
  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
  }

  const documentType = analysis.document.documentType ?? null;
  const biasTypes = Array.from(new Set(analysis.biases.map(b => b.biasType))).filter(Boolean);

  // Validity classification — persisted-first, live-compute fallback
  const persistedValidity = (
    analysis.judgeOutputs as { validityClassification?: ValidityClassification | null } | null
  )?.validityClassification;
  const validityClassification =
    persistedValidity ??
    classifyValidity({
      documentType,
      industry: null,
    });
  const validitySource: 'persisted' | 'live' = persistedValidity ? 'persisted' : 'live';

  // Reference-class forecast — pure function, deterministic
  const referenceClassForecast = getReferenceClassForecast({
    biasTypes,
    industry: null,
    documentType,
  });

  // Feedback adequacy — uses the document owner's user id, not the requesting user
  // (the procurement signal is "did THIS author have enough closed-loop history",
  // not "does the reviewer".)
  const feedbackAdequacy = await getFeedbackAdequacy(prisma, analysis.document.userId, {
    domainHint: documentType,
  });

  const body: AnalysisInsightsResponse = {
    analysisId: analysis.id,
    validityClassification,
    referenceClassForecast,
    feedbackAdequacy,
    validitySource,
  };

  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' },
  });
}
