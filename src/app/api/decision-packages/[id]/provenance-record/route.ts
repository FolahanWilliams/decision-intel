/**
 * Decision Package · Provenance Record (4.4 deep).
 *
 * GET /api/decision-packages/[id]/provenance-record — JSON summary by
 *     default; `?format=pdf` streams the procurement-grade PDF.
 *
 * RBAC: gated through the package access resolver. The PDF aggregates
 * per-doc lineage (input hashes, prompt fingerprints) into a single
 * record so a GC can hand one artefact to a regulator covering the
 * full decision.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { resolvePackageAccess } from '@/lib/utils/decision-package-access';
import { assembleProvenanceRecordDataForPackage } from '@/lib/reports/provenance-record-data';
import { renderDprPdf } from '@/lib/reports/render-dpr-pdf';
import { logAudit } from '@/lib/audit';

const log = createLogger('DecisionPackageProvenance');

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const format = request.nextUrl.searchParams.get('format') ?? 'json';
    const clientSafe = request.nextUrl.searchParams.get('clientSafe') === '1';

    const pkg = await resolvePackageAccess(id, user.id);
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const data = await assembleProvenanceRecordDataForPackage(id);

    if (format === 'pdf') {
      // Phase 4 wire-in: render via the shared HTML/CSS Puppeteer flow
      // (CLAUDE.md DPR architecture lock 2026-05-05).
      const reqUrl = request.nextUrl;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${reqUrl.protocol}//${reqUrl.host}`;
      const renderUrl = `${baseUrl}/dpr-render/package/${id}${clientSafe ? '?clientSafe=1' : ''}`;
      const { pdf } = await renderDprPdf({
        baseUrl,
        type: 'package',
        id,
        authCookieHeader: request.headers.get('cookie') ?? undefined,
        renderUrlOverride: renderUrl,
      });

      await logAudit({
        action: 'EXPORT_PDF',
        resource: 'decision_package_provenance',
        resourceId: id,
        details: { packageName: pkg.name, memberCount: data.packageContext?.members.length ?? 0 },
      });

      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="dpr-${pkg.name.replace(/[^a-z0-9-]/gi, '_').slice(0, 60)}.pdf"`,
        },
      });
    }

    // JSON summary path — used by the in-app preview / future client view.
    return NextResponse.json({
      ok: true,
      packageContext: data.packageContext,
      meta: data.meta,
      citations: data.citations,
      regulatoryMapping: data.regulatoryMapping,
      blindPriorAggregates: data.blindPriorAggregates,
      promptFingerprint: data.promptFingerprint,
      inputHash: data.inputHash,
      schemaVersion: data.schemaVersion,
      generatedAt: data.generatedAt.toISOString(),
    });
  } catch (err) {
    log.error('Provenance failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
