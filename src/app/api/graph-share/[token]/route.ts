/**
 * Public read endpoint for shared graph snapshots.
 *
 * GET /api/graph-share/[token] — no auth required. Returns the snapshot or
 * a 404/410/401 status. View counter increments on each successful load.
 *
 * Password-gated shares require POST { password } to unlock; we surface a
 * 401 with `requiresPassword: true` on bare GET, then accept the password
 * via POST and return the snapshot on match.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import bcrypt from 'bcryptjs';
import type { GraphNetworkReport } from '@/lib/reports/graph-report';

const log = createLogger('GraphSharePublic');

interface SharedGraphResponse {
  snapshot: GraphNetworkReport;
  sharerLabel: string;
  isRedacted: boolean;
  createdAt: string;
  expiresAt: string | null;
  viewCount: number;
}

async function loadByToken(token: string) {
  return prisma.graphShareLink.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      sharerLabel: true,
      snapshot: true,
      isRedacted: true,
      expiresAt: true,
      revokedAt: true,
      password: true,
      viewCount: true,
      createdAt: true,
    },
  });
}

function statusFor(link: NonNullable<Awaited<ReturnType<typeof loadByToken>>>) {
  if (link.revokedAt) {
    return { status: 410, error: 'This shared graph has been revoked.' as string };
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    return { status: 410, error: 'This shared graph has expired.' };
  }
  return null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  let link;
  try {
    link = await loadByToken(token);
  } catch (err) {
    log.error('GraphShareLink lookup failed:', err);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 503 });
  }

  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const stale = statusFor(link);
  if (stale) {
    return NextResponse.json({ error: stale.error }, { status: stale.status });
  }

  if (link.password) {
    return NextResponse.json(
      {
        requiresPassword: true,
        sharerLabel: link.sharerLabel,
        isRedacted: link.isRedacted,
      },
      { status: 401 }
    );
  }

  // Increment viewCount fire-and-forget; never block the read on the
  // counter update.
  prisma.graphShareLink
    .update({
      where: { id: link.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    })
    .catch(err => log.warn('GraphShareLink view-counter increment failed:', err));

  const response: SharedGraphResponse = {
    snapshot: link.snapshot as unknown as GraphNetworkReport,
    sharerLabel: link.sharerLabel,
    isRedacted: link.isRedacted,
    createdAt: link.createdAt.toISOString(),
    expiresAt: link.expiresAt?.toISOString() ?? null,
    viewCount: link.viewCount + 1,
  };

  return NextResponse.json(response, {
    headers: {
      // Snapshot is immutable; safe to cache aggressively at the edge.
      // 5min browser, 1hr CDN with revalidation.
      'Cache-Control': 'public, s-maxage=3600, max-age=300, stale-while-revalidate=1800',
    },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  // Password-unlock path. We accept the password via POST so it doesn't
  // land in browser history / referrer headers.
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (!body.password || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }

  let link;
  try {
    link = await loadByToken(token);
  } catch (err) {
    log.error('GraphShareLink lookup (POST) failed:', err);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 503 });
  }

  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const stale = statusFor(link);
  if (stale) {
    return NextResponse.json({ error: stale.error }, { status: stale.status });
  }

  if (!link.password) {
    // No password gate; the client can just call GET. We still return the
    // snapshot to keep the unlock flow uniform on the client side.
  } else {
    const match = await bcrypt.compare(body.password, link.password).catch(() => false);
    if (!match) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }
  }

  prisma.graphShareLink
    .update({
      where: { id: link.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    })
    .catch(err => log.warn('GraphShareLink view-counter increment (POST) failed:', err));

  const response: SharedGraphResponse = {
    snapshot: link.snapshot as unknown as GraphNetworkReport,
    sharerLabel: link.sharerLabel,
    isRedacted: link.isRedacted,
    createdAt: link.createdAt.toISOString(),
    expiresAt: link.expiresAt?.toISOString() ?? null,
    viewCount: link.viewCount + 1,
  };

  return NextResponse.json(response);
}
