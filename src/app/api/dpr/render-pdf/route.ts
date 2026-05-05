/**
 * DPR PDF renderer — server-side Puppeteer endpoint.
 *
 * Locked 2026-05-05. Thin route wrapper around the shared
 * `renderDprPdf()` helper in src/lib/reports/render-dpr-pdf.ts. Used by:
 *
 *   1. /api/documents/[id]/provenance-record (Phase 4 wire-in)
 *   2. /api/decision-packages/[id]/provenance-record (Phase 4)
 *   3. /api/deals/[id]/provenance-record (Phase 4)
 *   4. /api/public/sample-dpr (Phase 2 — uses renderDprPdf directly)
 *   5. /api/compliance/audit-packet/[analysisId] (Phase 4)
 *   6. The /documents/[id] client-side Export DPR button (Phase 4)
 */

import type { NextRequest } from 'next/server';
import { renderDprPdf } from '@/lib/reports/render-dpr-pdf';
import { createLogger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const log = createLogger('DprRenderPdfRoute');

const VALID_TYPES = ['specimen', 'document', 'package', 'deal'] as const;
type DprType = (typeof VALID_TYPES)[number];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');

  if (!type || !id) {
    return jsonError(400, 'Missing type or id query param.');
  }
  if (!VALID_TYPES.includes(type as DprType)) {
    return jsonError(400, `Invalid type: ${type}. Must be one of ${VALID_TYPES.join(', ')}.`);
  }

  // Phase 1-2: only specimen path is supported. Phase 4 wires document /
  // package / deal with full auth + ownership routing.
  if (type !== 'specimen') {
    return jsonError(
      501,
      `Type "${type}" is not yet implemented. Specimen only. Phase 4 wires document / package / deal paths.`
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${url.protocol}//${url.host}`;

  try {
    const { pdf } = await renderDprPdf({ baseUrl, type: type as DprType, id });
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="dpr-${type}-${id}.pdf"`,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    log.error('DPR PDF rendering failed', { type, id, error: err });
    return jsonError(500, err instanceof Error ? err.message : 'Unknown rendering error');
  }
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
