/**
 * Draft Outcomes API
 *
 * GET  /api/outcomes/draft — List pending draft outcomes for user/org
 * PATCH /api/outcomes/draft — Confirm or dismiss a draft outcome
 *
 * Draft outcomes are auto-detected from documents, Slack, and web intelligence.
 * Users confirm or dismiss them — confirmed drafts create real DecisionOutcomes
 * and trigger the recalibration flywheel.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import {
  getPendingDraftOutcomes,
  confirmDraftOutcome,
  dismissDraftOutcome,
} from '@/lib/learning/outcome-inference';

const log = createLogger('DraftOutcomesAPI');

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orgId = req.nextUrl.searchParams.get('orgId');
    const drafts = await getPendingDraftOutcomes(user.id, orgId);

    return NextResponse.json({ drafts, count: drafts.length });
  } catch (err) {
    log.error('Failed to fetch draft outcomes:', err);
    return NextResponse.json({ error: 'Failed to fetch draft outcomes' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { draftId, action } = body;

    if (!draftId || !action) {
      return NextResponse.json(
        { error: 'draftId and action (confirm|dismiss) are required' },
        { status: 400 }
      );
    }

    if (action === 'confirm') {
      const result = await confirmDraftOutcome(draftId, user.id);
      if (!result.success) {
        return NextResponse.json({ error: 'Failed to confirm draft' }, { status: 400 });
      }
      return NextResponse.json({ success: true, outcomeId: result.outcomeId });
    }

    if (action === 'dismiss') {
      const result = await dismissDraftOutcome(draftId);
      if (!result) {
        return NextResponse.json({ error: 'Failed to dismiss draft' }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'action must be "confirm" or "dismiss"' }, { status: 400 });
  } catch (err) {
    log.error('Failed to process draft outcome action:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
