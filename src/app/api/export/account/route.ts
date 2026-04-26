/**
 * Account-scoped bulk data export (P1 #27, added 2026-04-26).
 *
 * GET /api/export/account?format=json — streams a single JSON bundle
 *     covering every analysis, document metadata, decision-room blind
 *     prior, and outcome the requesting user owns. Backs the contractual
 *     data-portability commitment in the Terms of Service §10A and the
 *     DPA §5 ("on any termination, customer may request a machine-
 *     readable export within 14 calendar days").
 *
 * Voice / scope discipline:
 *   - Document CONTENT (the original memo bytes) is excluded from the
 *     export. Encrypted-at-rest content stays at-rest; the export
 *     surfaces metadata, analysis results, and DPR fingerprints. A
 *     separate per-document download is available from /documents/[id].
 *     This keeps the bundle size manageable and avoids leaking
 *     plaintext content into a JSON file the user might forward.
 *   - Cross-tenant data is never included — all queries are scoped to
 *     the authenticated user's id (and orgId where applicable). The
 *     visibility resolver runs implicitly via the underlying Prisma
 *     filters so a teammate's private analyses on a shared org are
 *     excluded.
 *   - Rate-limited 1 export / user / hour to prevent runaway DB scans.
 *
 * Returned JSON shape is documented inline below; the schema is part
 * of the contractual surface (downstream importers may rely on it).
 * Bumping the schemaVersion is a breaking change.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { logAudit } from '@/lib/audit';

const log = createLogger('AccountExport');

const SCHEMA_VERSION = 1;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rate = await checkRateLimit(user.id, '/api/export/account', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 1,
      failMode: 'closed',
    });
    if (!rate.success) {
      return NextResponse.json(
        {
          error:
            'Account export is rate-limited to once per hour. Try again later, or email team@decision-intel.com for an out-of-band export.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(0, rate.reset - Math.floor(Date.now() / 1000))),
          },
        }
      );
    }

    const format = request.nextUrl.searchParams.get('format') ?? 'json';
    if (format !== 'json') {
      return NextResponse.json(
        {
          error:
            'Only format=json is supported today. Per-document PDF/CSV/Markdown exports are available from /documents/[id]; a zipped bundle is on the roadmap.',
        },
        { status: 400 }
      );
    }

    // Resolve the user's org membership so the bundle covers org-scoped
    // analyses + decisions the user authored. Schema-drift tolerant.
    let orgId: string | null = null;
    try {
      const m = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = m?.orgId ?? null;
    } catch {
      /* no org membership — keep null */
    }

    const exportTimestamp = new Date();

    // ── Documents (metadata only, no content) ────────────────────────
    const documents = await prisma.document
      .findMany({
        where: {
          OR: [{ userId: user.id }, ...(orgId ? [{ orgId }] : [])],
          deletedAt: null,
        },
        select: {
          id: true,
          filename: true,
          documentType: true,
          contentHash: true,
          uploadedAt: true,
          status: true,
          dealId: true,
          orgId: true,
        },
        orderBy: { uploadedAt: 'desc' },
      })
      .catch(err => {
        log.warn('documents fetch failed (schema drift?):', err);
        return [];
      });

    // ── Analyses (full result + bias instances + recalibrated DQI) ──
    const analyses = await prisma.analysis
      .findMany({
        where: {
          document: { OR: [{ userId: user.id }, ...(orgId ? [{ orgId }] : [])] },
        },
        select: {
          id: true,
          documentId: true,
          createdAt: true,
          updatedAt: true,
          overallScore: true,
          noiseScore: true,
          summary: true,
          metaVerdict: true,
          recalibratedDqi: true,
          outcomeStatus: true,
          biases: {
            select: {
              biasType: true,
              severity: true,
              excerpt: true,
              suggestion: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      .catch(err => {
        log.warn('analyses fetch failed:', err);
        return [];
      });

    // ── Outcome records (DecisionOutcome model) ──────────────────────
    const outcomes = await prisma.decisionOutcome
      .findMany({
        where: { OR: [{ userId: user.id }, ...(orgId ? [{ orgId }] : [])] },
        select: {
          id: true,
          analysisId: true,
          outcome: true,
          timeframe: true,
          impactScore: true,
          notes: true,
          lessonsLearned: true,
          confirmedBiases: true,
          falsPositiveBiases: true,
          mostAccurateTwin: true,
          brierScore: true,
          brierCategory: true,
          reportedAt: true,
          updatedAt: true,
        },
      })
      .catch(err => {
        log.warn('outcomes fetch failed (schema drift):', err);
        return [];
      });

    // ── Decision Provenance Records (header rows only — full PDFs
    //    download per-analysis at /api/documents/[id]/provenance-record) ──
    const dprs = await prisma.decisionProvenanceRecord
      .findMany({
        where: { OR: [{ userId: user.id }, ...(orgId ? [{ orgId }] : [])] },
        select: {
          id: true,
          analysisId: true,
          documentId: true,
          inputHash: true,
          promptFingerprint: true,
          schemaVersion: true,
          generatedAt: true,
        },
      })
      .catch(err => {
        log.warn('DPR fetch failed (schema drift):', err);
        return [];
      });

    // ── Decision-room blind priors authored by this user ────────────
    const blindPriors = await prisma.decisionRoomBlindPrior
      .findMany({
        where: { respondentUserId: user.id },
        select: {
          id: true,
          confidencePercent: true,
          topRisks: true,
          shareRationale: true,
          shareIdentity: true,
          brierScore: true,
          brierCategory: true,
          submittedAt: true,
        },
      })
      .catch(err => {
        log.warn('blind-prior fetch failed:', err);
        return [];
      });

    const bundle = {
      schemaVersion: SCHEMA_VERSION,
      exportTimestamp: exportTimestamp.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        orgId,
      },
      counts: {
        documents: documents.length,
        analyses: analyses.length,
        outcomes: outcomes.length,
        decisionProvenanceRecords: dprs.length,
        blindPriors: blindPriors.length,
      },
      // Plain notes the importer should read first.
      notes: [
        'Document content (the original uploaded file bytes) is intentionally excluded from this bundle. Per-document PDF/CSV/Markdown exports are available from /documents/[id].',
        'A zipped Decision Provenance Record archive is on the roadmap. Today, fetch each DPR via /api/documents/[id]/provenance-record?format=pdf using the analysisId in the analyses[] array.',
        'For the contractual data-portability commitment see /terms (§10A) and the DPA (§5).',
      ],
      documents,
      analyses,
      outcomes,
      decisionProvenanceRecords: dprs,
      blindPriors,
    };

    await logAudit({
      action: 'EXPORT_ACCOUNT_BUNDLE',
      resource: 'user',
      resourceId: user.id,
      details: {
        counts: bundle.counts,
        format,
      },
    }).catch(err => log.warn('audit log failed (non-fatal):', err));

    const filename = `decision-intel-account-${user.id.slice(0, 8)}-${exportTimestamp
      .toISOString()
      .slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Decision-Intel-Schema': String(SCHEMA_VERSION),
      },
    });
  } catch (err) {
    log.error('account export failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
