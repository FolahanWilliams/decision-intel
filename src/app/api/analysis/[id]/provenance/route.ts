/**
 * GET /api/analysis/:id/provenance  (1.1 deep)
 *
 * Returns the assembled ProvenanceRecordData JSON for the analysis.
 * Owner / org-member access only via the visibility resolver.
 *
 * Used by the in-page DprPreviewCard so the analyst can see the eight
 * key DPR fields without downloading the full PDF.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { resolveAnalysisAccess } from '@/lib/utils/document-access';
import { assembleProvenanceRecordData } from '@/lib/reports/provenance-record-data';

const log = createLogger('ProvenancePreview');

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await resolveAnalysisAccess(id, user.id);
    if (!access) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const data = await assembleProvenanceRecordData(id);
    return NextResponse.json(data);
  } catch (err) {
    log.error('provenance preview failed:', err as Error);
    return NextResponse.json({ error: 'Failed to assemble provenance data' }, { status: 500 });
  }
}
