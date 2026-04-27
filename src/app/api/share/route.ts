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
import { safeCompare } from '@/lib/utils/safe-compare';
import { logAudit } from '@/lib/audit';

const log = createLogger('ShareLink');

// Expiry: callers send EITHER expiresInHours (granular — 1h, 24h boardroom
// share, etc.) OR expiresInDays (legacy — pre-3.3 callers). When neither is
// provided we default to 7 days. expiresInHours wins when both are present.
// `null` on either field means "never expires" (still gated server-side to
// case-study links only — open-public default expiry guards against link rot).
const CreateShareSchema = z.object({
  analysisId: z.string().min(1),
  expiresInHours: z.number().min(1).max(2160).nullable().optional(),
  expiresInDays: z.number().min(1).max(90).optional(),
  password: z.string().min(4).max(100).optional(),
  isCaseStudy: z.boolean().optional().default(false),
  /** Optional viewer-email gate (3.3 deep). */
  requireEmail: z.boolean().optional().default(false),
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
    const { analysisId, expiresInHours, expiresInDays, password, isCaseStudy, requireEmail } =
      CreateShareSchema.parse(body);

    // Resolve effective expiry: hours wins over days; null = never (forced to
    // null on case-study links). If neither was provided, fall back to 7 days
    // so legacy callers stay on the existing default.
    const expiryMs: number | null = (() => {
      if (isCaseStudy) return null;
      if (expiresInHours === null) return null;
      if (typeof expiresInHours === 'number') return expiresInHours * 60 * 60 * 1000;
      const days = expiresInDays ?? 7;
      return days * 24 * 60 * 60 * 1000;
    })();

    // Share-link creation is owner-only (3.5): a teammate who can READ a
    // doc must not be able to externally publish it. Sharing is an
    // explicit grant authority that lives with the document owner — same
    // shape as the visibility editor.
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { document: { select: { userId: true, orgId: true } } },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    if (analysis.document.userId !== user.id) {
      log.warn(
        `Share-link creation denied: ${user.id} is not the owner of doc ${analysis.document.userId} (analysis ${analysisId})`
      );
      return NextResponse.json(
        { error: 'Only the document owner can create share links.' },
        { status: 403 }
      );
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
        expiresAt: expiryMs === null ? null : new Date(Date.now() + expiryMs),
        password: passwordHash,
        isCaseStudy,
        requireEmail: !!requireEmail,
      },
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/shared/${link.token}${isCaseStudy ? '?case=true' : ''}`;

    log.info(
      `Share link created for analysis ${analysisId} by ${user.id}${isCaseStudy ? ' (case study)' : ''}`
    );

    // 3.3 deep — audit trail. Fire-and-forget so it never blocks share creation.
    logAudit({
      action: 'SHARE_LINK_CREATED',
      resource: 'ShareLink',
      resourceId: link.id,
      details: {
        analysisId,
        token: link.token,
        expiresAt: link.expiresAt?.toISOString() ?? null,
        isCaseStudy: link.isCaseStudy,
        hasPassword: !!passwordHash,
      },
    }).catch(err => log.warn('SHARE_LINK_CREATED audit-log write failed:', err));

    // Referrer/funnel attribution lives in AnalyticsEvent so we can answer
    // "shares created → viewed → signup_from_share" without a schema
    // migration on ShareLink itself. Fire-and-forget, never fails creation.
    prisma.analyticsEvent
      .create({
        data: {
          name: 'share_link_created',
          userId: user.id,
          properties: {
            shareLinkId: link.id,
            token: link.token,
            analysisId,
            isCaseStudy: link.isCaseStudy,
            hasPassword: !!passwordHash,
          },
        },
      })
      .catch(() => {
        /* analytics must never break share creation */
      });
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

  // 3.3 deep — owner list view: ?analysisId=X (no token) returns every
  // ShareLink for the analysis the caller owns. Used by the Manage
  // links tab on the ShareModal.
  const listAnalysisId = searchParams.get('analysisId');
  if (listAnalysisId && !searchParams.get('token')) {
    return getShareLinkListForAnalysis(req, listAnalysisId);
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

    // 3.3 deep — recipient-email gate.
    const recipientEmailRaw =
      req.headers.get('x-recipient-email') || searchParams.get('recipient_email');
    const recipientEmail = recipientEmailRaw?.trim().toLowerCase() ?? null;
    if (link.requireEmail) {
      if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
        return NextResponse.json(
          {
            error: 'Email required to view this link',
            requiresEmail: true,
          },
          { status: 401 }
        );
      }
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
        passwordValid = safeCompare(hash, link.password);

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

    // Update view count and create access log atomically (fire and forget).
    // viewerEmail is captured when requireEmail=true was satisfied.
    prisma
      .$transaction([
        prisma.shareLink.update({
          where: { id: link.id },
          data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
        }),
        prisma.shareLinkAccess.create({
          data: {
            shareLinkId: link.id,
            ipAddress: clientIp.slice(0, 45),
            userAgent: req.headers.get('user-agent')?.slice(0, 256) || null,
            viewerEmail: recipientEmail,
          },
        }),
      ])
      .catch(err => log.warn('Share link tracking failed:', err));

    // Generate ETag based on analysis updated timestamp and view count.
    // Use viewCount + 1 because the fire-and-forget increment above has
    // already been dispatched — the next request will see this new count.
    const etag = `"${analysis.id}-${analysis.updatedAt.getTime()}-${link.viewCount + 1}"`;

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

    // 3.3 deep — resolve the sharer's email so the public viewer can
    // render a "Shared by …" watermark. Fall back to a generic label if
    // we can't find a TeamMember row (case studies often won't have one).
    let sharedByEmail: string | null = null;
    try {
      const tm = await prisma.teamMember.findFirst({
        where: { userId: link.userId },
        select: { email: true, displayName: true },
      });
      sharedByEmail = tm?.displayName || tm?.email || null;
    } catch {
      // Schema drift — leave null
    }

    // Audit-trail the view as well — useful for procurement-grade
    // "who-saw-what-when" follow-ups. Fire-and-forget.
    logAudit({
      action: 'SHARE_LINK_VIEWED',
      resource: 'ShareLink',
      resourceId: link.id,
      details: {
        token: link.token,
        analysisId: link.analysisId,
        ipAddress: clientIp.slice(0, 45),
      },
    }).catch(err => log.warn('SHARE_LINK_VIEWED audit-log write failed:', err));

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
      sharedByEmail,
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

    logAudit({
      action: 'SHARE_LINK_REVOKED',
      resource: 'ShareLink',
      resourceId: id,
      details: { token: link.token, analysisId: link.analysisId },
    }).catch(err => log.warn('SHARE_LINK_REVOKED audit-log write failed:', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Failed to revoke share link:', error);
    return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 });
  }
}

/**
 * GET /api/share?linkId=xxx&access=true — View access logs for a share link (owner only)
 */
async function getShareLinkAccessHistory(req: NextRequest) {
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

/**
 * GET /api/share?analysisId=X — owner-only list of every ShareLink the
 * caller has created against the given analysis. Powers the "Manage
 * links" tab on the ShareModal (3.3 deep).
 *
 * Returns active + expired + revoked rows so the owner sees the full
 * history; the UI is responsible for grouping. Each row includes the
 * derived URL so the user can copy it without recomputing.
 */
async function getShareLinkListForAnalysis(req: NextRequest, analysisId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Verify the caller is the document owner — same authority as
    // share-link creation. A teammate with read access cannot enumerate
    // share links for the analysis.
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: { document: { select: { userId: true } } },
    });
    if (!analysis || analysis.document.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const rows = await prisma.shareLink.findMany({
      where: { analysisId, userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        token: true,
        expiresAt: true,
        revokedAt: true,
        viewCount: true,
        lastViewedAt: true,
        isCaseStudy: true,
        createdAt: true,
        password: true, // Just to flag whether one is set; not returned raw.
      },
      take: 50,
    });

    const base = process.env.NEXT_PUBLIC_APP_URL || '';
    const now = Date.now();
    const enriched = rows.map(r => {
      const expired = !!(r.expiresAt && r.expiresAt.getTime() < now);
      const revoked = !!r.revokedAt;
      return {
        id: r.id,
        token: r.token,
        url: `${base}/shared/${r.token}${r.isCaseStudy ? '?case=true' : ''}`,
        expiresAt: r.expiresAt,
        revokedAt: r.revokedAt,
        viewCount: r.viewCount,
        lastViewedAt: r.lastViewedAt,
        isCaseStudy: r.isCaseStudy,
        hasPassword: !!r.password,
        createdAt: r.createdAt,
        status: revoked ? 'revoked' : expired ? 'expired' : 'active',
      };
    });

    return NextResponse.json({ links: enriched });
  } catch (error) {
    log.error('Failed to list share links:', error);
    return NextResponse.json({ error: 'Failed to list share links' }, { status: 500 });
  }
}
