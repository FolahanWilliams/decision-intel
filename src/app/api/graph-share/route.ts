/**
 * Graph Share API (A2 deep, locked 2026-04-27)
 *
 * POST   /api/graph-share — Create a shareable link for the user's org graph.
 *                           Snapshots the graph-network report at share-time
 *                           so the public viewer is frozen-in-time, not live.
 * DELETE /api/graph-share?id=xxx — Revoke a share link (sharer-only).
 *
 * Public read endpoint lives at /api/graph-share/[token] — no auth required;
 * returns the snapshot or a 410/404/401 status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { logAudit } from '@/lib/audit';
import { generateGraphReport, type GraphNetworkReport } from '@/lib/reports/graph-report';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

const log = createLogger('GraphShare');

const DEFAULT_EXPIRY_DAYS = 30;
const MAX_EXPIRY_DAYS = 365;

const CreateSchema = z.object({
  /** Optional expiry in days. Default 30; max 365; null = never expires. */
  expiresInDays: z.number().int().min(1).max(MAX_EXPIRY_DAYS).nullable().optional(),
  /** When TRUE, the public viewer hides bias-type labels — keeps DQI counts +
   *  risk levels but replaces specific bias names with [BIAS_N] placeholders. */
  isRedacted: z.boolean().optional(),
  /** Optional password gate (≥4 chars). Stored as bcrypt hash. */
  password: z.string().min(4).max(100).optional(),
  /** Time range for the snapshot in days. Default 90; matches the
   *  /dashboard/decision-graph default. */
  timeRangeDays: z.number().int().min(7).max(720).optional(),
});

/**
 * Walk the GraphNetworkReport snapshot and replace any bias-type-named
 * labels with [BIAS_N] placeholders. Preserves counts, risk levels, and
 * structural patterns — those are what a procurement reader actually
 * needs to see.
 */
function redactSnapshot(report: GraphNetworkReport): GraphNetworkReport {
  // We replace the LABELS of bias_pattern nodes + the bias names embedded in
  // anti-pattern descriptions. counts + severity scores stay visible.
  const seen = new Map<string, string>();
  let counter = 0;

  const placeholderFor = (label: string): string => {
    if (seen.has(label)) return seen.get(label)!;
    counter++;
    const ph = `[BIAS_${counter}]`;
    seen.set(label, ph);
    return ph;
  };

  return {
    ...report,
    topNodes: report.topNodes.map(n =>
      n.type === 'bias_pattern' ? { ...n, label: placeholderFor(n.label) } : n
    ),
    antiPatterns: report.antiPatterns.map(p => ({
      ...p,
      // Best-effort regex masking: replace any snake_case bias-type-looking
      // tokens in the description string with the same placeholder, so a
      // description like "confirmation_bias compounds with groupthink" reads
      // "[BIAS_1] compounds with [BIAS_2]". Avoids leaking labels while
      // preserving the procurement-relevant prose structure.
      description: p.description.replace(/\b[a-z]+_[a-z_]+\b/g, m => placeholderFor(m)),
      recommendation: p.recommendation.replace(/\b[a-z]+_[a-z_]+\b/g, m => placeholderFor(m)),
    })),
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit — sharers shouldn't be machine-scripting share URLs.
  // Reasonable: 10 shares per user per hour.
  const rate = await checkRateLimit(user.id, '/api/graph-share', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  });
  if (!rate.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Parse + validate
  let body: z.infer<typeof CreateSchema>;
  try {
    const raw = await req.json().catch(() => ({}));
    body = CreateSchema.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Resolve user → orgId. Personal-scope graphs (no org) are also shareable;
  // we fall back to userId-scoped data for those.
  let orgId: string | null = null;
  let sharerLabel = 'Personal graph';
  try {
    const member = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      select: {
        orgId: true,
        organization: { select: { name: true } },
      },
    });
    if (member?.orgId) {
      orgId = member.orgId;
      sharerLabel = member.organization?.name ?? 'Team';
    }
  } catch (err) {
    log.warn('Org lookup during graph-share create failed:', err);
  }

  // Generate the snapshot. For personal-scope, we skip the report and
  // store an empty-but-honest snapshot — the public viewer renders an
  // empty state in that case rather than fabricating data.
  let snapshot: GraphNetworkReport | null = null;
  if (orgId) {
    try {
      snapshot = await generateGraphReport(
        orgId,
        user.id,
        body.timeRangeDays ?? 90
      );
    } catch (err) {
      log.error('Snapshot generation failed during graph-share create:', err);
      return NextResponse.json(
        { error: 'Could not snapshot your graph. Please retry.' },
        { status: 503 }
      );
    }
  }

  // Apply redaction if requested
  const finalSnapshot =
    snapshot && body.isRedacted ? redactSnapshot(snapshot) : snapshot;

  // Hash password if provided
  let passwordHash: string | undefined;
  if (body.password) {
    passwordHash = await bcrypt.hash(body.password, 10);
  }

  // Compute expiresAt
  const expiresInDays =
    body.expiresInDays === undefined ? DEFAULT_EXPIRY_DAYS : body.expiresInDays;
  const expiresAt =
    expiresInDays === null
      ? null
      : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  // Create the row
  let link;
  try {
    link = await prisma.graphShareLink.create({
      data: {
        userId: user.id,
        orgId,
        snapshot:
          (finalSnapshot ?? { metrics: { nodeCount: 0, edgeCount: 0 } }) as Prisma.InputJsonValue,
        sharerLabel,
        isRedacted: body.isRedacted ?? false,
        expiresAt,
        password: passwordHash ?? null,
      },
    });
  } catch (err) {
    log.error('GraphShareLink create failed:', err);
    return NextResponse.json(
      { error: 'Could not create share link. Please retry.' },
      { status: 503 }
    );
  }

  // Audit log
  logAudit({
    action: 'GRAPH_SHARE_CREATED',
    resource: 'GraphShareLink',
    resourceId: link.id,
    details: {
      orgId,
      isRedacted: link.isRedacted,
      hasPassword: !!passwordHash,
      expiresAt: link.expiresAt?.toISOString() ?? null,
      timeRangeDays: body.timeRangeDays ?? 90,
    },
  }).catch(err => log.warn('GRAPH_SHARE_CREATED audit-log write failed:', err));

  return NextResponse.json({
    id: link.id,
    token: link.token,
    expiresAt: link.expiresAt,
    isRedacted: link.isRedacted,
    hasPassword: !!passwordHash,
    /** Convenience: client constructs the public URL itself. */
    publicPath: `/shared/graph/${link.token}`,
  });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing share link ID' }, { status: 400 });
  }

  let link;
  try {
    link = await prisma.graphShareLink.findUnique({
      where: { id },
      select: { id: true, userId: true, token: true, revokedAt: true },
    });
  } catch (err) {
    log.error('GraphShareLink lookup failed:', err);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 503 });
  }

  if (!link || link.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (link.revokedAt) {
    return NextResponse.json({ ok: true, alreadyRevoked: true });
  }

  try {
    await prisma.graphShareLink.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  } catch (err) {
    log.error('GraphShareLink revoke failed:', err);
    return NextResponse.json({ error: 'Could not revoke' }, { status: 503 });
  }

  logAudit({
    action: 'GRAPH_SHARE_REVOKED',
    resource: 'GraphShareLink',
    resourceId: id,
    details: { token: link.token },
  }).catch(err => log.warn('GRAPH_SHARE_REVOKED audit-log write failed:', err));

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  // Owner-list of share links (used by the share modal to surface
  // existing links so the user doesn't create duplicates).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const links = await prisma.graphShareLink.findMany({
      where: { userId: user.id, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        token: true,
        sharerLabel: true,
        isRedacted: true,
        expiresAt: true,
        viewCount: true,
        lastViewedAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ links });
  } catch (err) {
    log.error('GraphShareLink list failed:', err);
    return NextResponse.json({ error: 'List failed' }, { status: 503 });
  }
}
