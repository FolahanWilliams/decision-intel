/**
 * Share Link API
 *
 * POST   /api/share — Create a shareable link for an analysis
 * GET    /api/share?token=xxx — Fetch shared analysis (public, no auth)
 * DELETE /api/share?id=xxx — Revoke a share link
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const log = createLogger('ShareLink');

const CreateShareSchema = z.object({
  analysisId: z.string().min(1),
  expiresInDays: z.number().min(1).max(90).default(7),
  password: z.string().min(4).max(100).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { analysisId, expiresInDays, password } = CreateShareSchema.parse(body);

    // Verify user owns the document associated with this analysis
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { document: { select: { userId: true, orgId: true } } },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    if (analysis.document.userId !== user.id) {
      // Check if user is in the same org
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
      });
      if (!membership || membership.orgId !== analysis.document.orgId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (password) {
      const { createHash } = await import('crypto');
      passwordHash = createHash('sha256').update(password).digest('hex');
    }

    const link = await prisma.shareLink.create({
      data: {
        analysisId,
        userId: user.id,
        orgId: analysis.document.orgId,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        password: passwordHash,
      },
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/shared/${link.token}`;

    log.info(`Share link created for analysis ${analysisId} by ${user.id}`);
    return NextResponse.json(
      { token: link.token, url: shareUrl, expiresAt: link.expiresAt },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    log.error('Failed to create share link:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const password = searchParams.get('password');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  // Rate limit public share lookups to prevent brute-force token enumeration
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimit = await checkRateLimit(clientIp, '/api/share:GET', {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    failMode: 'closed',
  });
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const link = await prisma.shareLink.findUnique({ where: { token } });

    if (!link) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (link.revokedAt) {
      return NextResponse.json({ error: 'This share link has been revoked' }, { status: 410 });
    }

    if (link.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This share link has expired' }, { status: 410 });
    }

    // Check password if set
    if (link.password) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password required', requiresPassword: true },
          { status: 401 }
        );
      }
      const { createHash } = await import('crypto');
      const hash = createHash('sha256').update(password).digest('hex');
      if (hash !== link.password) {
        return NextResponse.json(
          { error: 'Invalid password', requiresPassword: true },
          { status: 401 }
        );
      }
    }

    // Fetch the analysis with document info
    const analysis = await prisma.analysis.findUnique({
      where: { id: link.analysisId },
      include: {
        document: { select: { filename: true } },
        biases: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis no longer exists' }, { status: 404 });
    }

    // Increment view count (fire and forget)
    prisma.shareLink
      .update({
        where: { id: link.id },
        data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
      })
      .catch(err => log.warn('View count update failed:', err));

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        documentName: analysis.document.filename,
        overallScore: analysis.overallScore,
        noiseScore: analysis.noiseScore,
        summary: analysis.summary,
        biases: analysis.biases.map(b => ({
          biasType: b.biasType,
          severity: b.severity,
          excerpt: b.excerpt,
          explanation: b.explanation,
          suggestion: b.suggestion,
        })),
        factCheck: analysis.factCheck,
        swotAnalysis: analysis.swotAnalysis,
        preMortem: analysis.preMortem,
        sentiment: analysis.sentiment,
        metaVerdict: analysis.metaVerdict,
        createdAt: analysis.createdAt,
      },
      sharedBy: link.userId,
      expiresAt: link.expiresAt,
    });
  } catch (error) {
    log.error('Failed to fetch shared analysis:', error);
    return NextResponse.json({ error: 'Failed to fetch shared analysis' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing share link ID' }, { status: 400 });
    }

    const link = await prisma.shareLink.findUnique({ where: { id } });
    if (!link || link.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.shareLink.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Failed to revoke share link:', error);
    return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 });
  }
}
