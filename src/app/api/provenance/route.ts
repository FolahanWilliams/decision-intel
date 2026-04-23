/**
 * GET /api/provenance
 *
 * List recent Decision Provenance Records for the authenticated user's
 * scope. Returns the canonical archive view used by /dashboard/provenance.
 *
 * Scope:
 *   - If the user belongs to an org, records are scoped to that org.
 *   - Otherwise, records are scoped to the user's own analyses.
 *
 * Query params:
 *   - limit     — default 50, clamped to [1, 200]
 *   - since     — ISO timestamp; only records generated after this date
 *
 * The response is deliberately thin — this page is a manifest, not a
 * rehydration surface. Per-record detail lives on /documents/[id].
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ProvenanceArchive');

export const dynamic = 'force-dynamic';

interface ListItem {
  id: string;
  analysisId: string;
  documentId: string;
  filename: string;
  overallScore: number;
  biasCount: number;
  inputHashShort: string;
  promptFingerprintShort: string;
  generatedAt: string;
  regulatoryFrameworkIds: string[];
}

interface RegulatoryFrameworkEntry {
  id?: unknown;
  frameworks?: Array<{ id?: unknown }>;
}

function shortHash(h: string | null | undefined): string {
  if (!h) return '—';
  if (h === 'UNAVAILABLE' || h === 'FILE_NOT_AVAILABLE') return h;
  return `${h.slice(0, 10)}…${h.slice(-6)}`;
}

function collectFrameworkIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids = new Set<string>();
  for (const entry of raw as RegulatoryFrameworkEntry[]) {
    if (!entry || typeof entry !== 'object') continue;
    if (Array.isArray(entry.frameworks)) {
      for (const fw of entry.frameworks) {
        if (fw && typeof fw.id === 'string') ids.add(fw.id);
      }
    }
  }
  return Array.from(ids).sort();
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const limitRaw = Number.parseInt(url.searchParams.get('limit') ?? '50', 10);
    const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 50));
    const sinceRaw = url.searchParams.get('since');
    const since = sinceRaw ? new Date(sinceRaw) : null;

    // Resolve org scope. Users without an org see only their own records.
    let orgId: string | null = null;
    try {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
        select: { orgId: true },
      });
      orgId = membership?.orgId ?? null;
    } catch (err) {
      log.warn('teamMember lookup failed on provenance list:', err);
    }

    const where = orgId ? { OR: [{ orgId }, { userId: user.id }] } : { userId: user.id };
    const whereWithSince =
      since && !Number.isNaN(since.getTime())
        ? { AND: [where, { generatedAt: { gte: since } }] }
        : where;

    const records = await prisma.decisionProvenanceRecord.findMany({
      where: whereWithSince,
      orderBy: { generatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        analysisId: true,
        documentId: true,
        inputHash: true,
        promptFingerprint: true,
        generatedAt: true,
        regulatoryMapping: true,
        analysis: {
          select: {
            overallScore: true,
            document: { select: { filename: true } },
            _count: { select: { biases: true } },
          },
        },
      },
    });

    const items: ListItem[] = records.map(r => ({
      id: r.id,
      analysisId: r.analysisId,
      documentId: r.documentId,
      filename: r.analysis.document.filename,
      overallScore: Math.round(r.analysis.overallScore),
      biasCount: r.analysis._count.biases,
      inputHashShort: shortHash(r.inputHash),
      promptFingerprintShort: shortHash(r.promptFingerprint),
      generatedAt: r.generatedAt.toISOString(),
      regulatoryFrameworkIds: collectFrameworkIds(r.regulatoryMapping),
    }));

    return NextResponse.json({ items, orgScoped: Boolean(orgId) });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift on provenance list:', code);
      return NextResponse.json({ items: [], orgScoped: false });
    }
    log.error('GET /api/provenance failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
