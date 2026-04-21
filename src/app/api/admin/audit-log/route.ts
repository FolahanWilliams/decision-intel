import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { isAdminUserId } from '@/lib/utils/admin';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('AdminAuditLogRoute');

/**
 * GET /api/admin/audit-log
 *
 * Admin-scoped firehose read of the AuditLog table. Supports:
 *   - filter by action, userId, orgId, resource
 *   - substring match on resourceId (?q=)
 *   - date range (?from= + ?to= as ISO timestamps)
 *   - pagination via ?limit + ?offset (defaults 50 / 0, capped at 500)
 *   - CSV export via ?format=csv (capped at 10,000 rows)
 *
 * Non-admins get 403. Admin status is derived from ADMIN_USER_IDS
 * (Supabase UUIDs, comma-separated in the env).
 */

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;
const MAX_CSV_ROWS = 10_000;

interface AuditLogFilter {
  action?: string;
  userId?: string;
  orgId?: string;
  resource?: string;
  q?: string;
  from?: string;
  to?: string;
}

function parseFilter(url: URL): AuditLogFilter {
  const p = url.searchParams;
  return {
    action: p.get('action') || undefined,
    userId: p.get('userId') || undefined,
    orgId: p.get('orgId') || undefined,
    resource: p.get('resource') || undefined,
    q: p.get('q') || undefined,
    from: p.get('from') || undefined,
    to: p.get('to') || undefined,
  };
}

function buildWhere(f: AuditLogFilter) {
  const where: Record<string, unknown> = {};
  if (f.action) where.action = f.action;
  if (f.userId) where.userId = f.userId;
  if (f.orgId) where.orgId = f.orgId;
  if (f.resource) where.resource = f.resource;
  if (f.q) where.resourceId = { contains: f.q, mode: 'insensitive' };
  if (f.from || f.to) {
    const range: Record<string, Date> = {};
    if (f.from) {
      const d = new Date(f.from);
      if (!Number.isNaN(d.getTime())) range.gte = d;
    }
    if (f.to) {
      const d = new Date(f.to);
      if (!Number.isNaN(d.getTime())) range.lte = d;
    }
    if (Object.keys(range).length) where.createdAt = range;
  }
  return where;
}

/** CSV-safe escape — prefixes formula-injection chars with a single quote
 *  so Excel / Google Sheets doesn't auto-execute pasted content. Mirrors
 *  the pattern in /api/audit. */
function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = typeof v === 'string' ? v : JSON.stringify(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return s.includes(',') ||
    s.includes('"') ||
    s.includes('\n') ||
    s.includes('\t') ||
    s.includes(';')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminUserId(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const filter = parseFilter(url);
    const where = buildWhere(filter);
    const format = url.searchParams.get('format') || 'json';

    if (format === 'csv') {
      const rows = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: MAX_CSV_ROWS,
        select: {
          id: true,
          createdAt: true,
          userId: true,
          orgId: true,
          action: true,
          resource: true,
          resourceId: true,
          ipAddress: true,
          details: true,
        },
      });
      const header = 'id,createdAt,userId,orgId,action,resource,resourceId,ipAddress,details\n';
      const body = rows
        .map(r =>
          [
            r.id,
            r.createdAt.toISOString(),
            r.userId,
            r.orgId ?? '',
            r.action,
            r.resource,
            r.resourceId ?? '',
            r.ipAddress ?? '',
            r.details,
          ]
            .map(csvEscape)
            .join(',')
        )
        .join('\n');
      const today = new Date().toISOString().split('T')[0];
      return new NextResponse(header + body, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-log-admin-${today}.csv"`,
        },
      });
    }

    const rawLimit = parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const rawOffset = parseInt(url.searchParams.get('offset') || '0', 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(1, rawLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;
    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          createdAt: true,
          userId: true,
          orgId: true,
          action: true,
          resource: true,
          resourceId: true,
          ipAddress: true,
          userAgent: true,
          details: true,
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      rows,
      total,
      limit,
      offset,
      filter,
    });
  } catch (error) {
    log.error('Admin audit-log read failed:', error);
    return NextResponse.json({ error: 'Failed to read audit log' }, { status: 500 });
  }
}
