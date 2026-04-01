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
import bcrypt from 'bcryptjs';

const log = createLogger('ShareLink');

const CreateShareSchema = z.object({
  analysisId: z.string().min(1),
  expiresInDays: z.number().min(1).max(90).default(7),
  password: z.string().min(4).max(100).optional(),
  isCaseStudy: z.boolean().optional().default(false),
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
    const { analysisId, expiresInDays, password, isCaseStudy } = CreateShareSchema.parse(body);

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

    // Hash password if provided using bcrypt
    let passwordHash: string | null = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 12); // 12 rounds for good security/performance balance
    }

    const link = await prisma.shareLink.create({
      data: {
        analysisId,
        userId: user.id,
        orgId: analysis.document.orgId,
        expiresAt: isCaseStudy ? null : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        password: passwordHash,
        isCaseStudy,
      },
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/shared/${link.token}${isCaseStudy ? '?case=true' : ''}`;

    log.info(
      `Share link created for analysis ${analysisId} by ${user.id}${isCaseStudy ? ' (case study)' : ''}`
    );
    return NextResponse.json(
      {
        token: link.token,
        url: shareUrl,
        expiresAt: link.expiresAt,
        isCaseStudy: link.isCaseStudy,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    log.error('Failed to create share link:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Check if this is an access history request
  if (searchParams.get('access') === 'true' && searchParams.get('linkId')) {
    return getShareLinkAccessHistory(req);
  }

  const token = searchParams.get('token');
  // Accept password from header to avoid exposing it in query params,
  // server logs, browser history, and referrer headers.
  // Falls back to query param for backward compatibility.
  const password = req.headers.get('x-share-password') || searchParams.get('password');

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

    if (link.expiresAt && link.expiresAt < new Date()) {
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

      let passwordValid = false;

      // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
      if (link.password.startsWith('$2')) {
        // bcrypt hash
        passwordValid = await bcrypt.compare(password, link.password);
      } else if (link.password.length === 64) {
        // Legacy SHA-256 hash (64 hex characters)
        const { createHash } = await import('crypto');
        const hash = createHash('sha256').update(password).digest('hex');
        passwordValid = hash === link.password;

        // If valid, transparently upgrade to bcrypt
        if (passwordValid) {
          const newHash = await bcrypt.hash(password, 12);
          prisma.shareLink
            .update({
              where: { id: link.id },
              data: { password: newHash },
            })
            .catch(err => log.warn('Failed to upgrade password hash:', err));
          log.info(`Upgraded share link ${link.token} from SHA-256 to bcrypt`);
        }
      }

      if (!passwordValid) {
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

    // Update view count and create access log atomically (fire and forget)
    prisma
      .$transaction([
        prisma.shareLink.update({
          where: { id: link.id },
          data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
        }),
        prisma.shareLinkAccess.create({
          data: {
            shareLinkId: link.id,
            ipAddress: clientIp.slice(0, 45), // Limit IP length for IPv6 compatibility
            userAgent: req.headers.get('user-agent')?.slice(0, 256) || null,
          },
        }),
      ])
      .catch(err => log.warn('Share link tracking failed:', err));

    // Generate ETag based on analysis updated timestamp and view count
    const etag = `"${analysis.id}-${analysis.updatedAt.getTime()}-${link.viewCount}"`;

    // Check If-None-Match header for conditional request
    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304, // Not Modified
        headers: {
          ETag: etag,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    const responseData = {
      analysis: {
        id: analysis.id,
        documentName: analysis.document.filename,
        overallScore: analysis.overallScore,
        noiseScore: analysis.noiseScore,
        summary: analysis.summary,
        biases: analysis.biases.map(b => ({
          biasType: b.biasType,
          severity: b.severity,
          excerpt:
            link.isCaseStudy && b.excerpt.length > 100
              ? b.excerpt.slice(0, 100) + '...'
              : b.excerpt,
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
      isCaseStudy: link.isCaseStudy,
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', // Cache for 60s, serve stale for 5min
        ETag: etag,
        Vary: 'Accept-Encoding', // Ensure proper caching with compression
      },
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

/**
 * GET /api/share?linkId=xxx&access=true — View access logs for a share link (owner only)
 */
export async function getShareLinkAccessHistory(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const linkId = searchParams.get('linkId');

  if (!linkId) {
    return NextResponse.json({ error: 'Missing linkId parameter' }, { status: 400 });
  }

  try {
    // Verify ownership
    const link = await prisma.shareLink.findUnique({
      where: { id: linkId },
      select: { userId: true },
    });

    if (!link || link.userId !== user.id) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    // Fetch access history
    const accesses = await prisma.shareLinkAccess.findMany({
      where: { shareLinkId: linkId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 accesses
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ accesses });
  } catch (error) {
    log.error('Failed to fetch share link access history:', error);
    return NextResponse.json({ error: 'Failed to fetch access history' }, { status: 500 });
  }
}
