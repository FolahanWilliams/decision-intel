import { NextRequest, NextResponse } from 'next/server';
import { logAudit, AuditLogParams } from '@/lib/audit';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('AuditRoute');

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await req.json()) as AuditLogParams;
        await logAudit(body);
        return NextResponse.json({ success: true });
    } catch (error) {
        log.error('Audit Log Error:', error);
        return NextResponse.json({ error: 'Failed to log audit event' }, { status: 500 });
    }
}

/** GET /api/audit?export=csv — stream all audit events for the user as a CSV file. */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        if (searchParams.get('export') !== 'csv') {
            return NextResponse.json({ error: 'Only ?export=csv is supported' }, { status: 400 });
        }

        const logs = await prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                action: true,
                resource: true,
                resourceId: true,
                ipAddress: true,
                createdAt: true,
            }
        });

        const escape = (v: string | null | undefined) => {
            const s = v ?? '';
            return s.includes(',') || s.includes('"') || s.includes('\n')
                ? `"${s.replace(/"/g, '""')}"` : s;
        };

        const header = 'id,action,resource,resourceId,ipAddress,createdAt\n';
        const rows = logs.map(l =>
            [l.id, l.action, l.resource, l.resourceId, l.ipAddress, l.createdAt.toISOString()]
                .map(escape).join(',')
        ).join('\n');

        const csv = header + rows;
        const today = new Date().toISOString().split('T')[0];

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="audit-log-${today}.csv"`,
            },
        });
    } catch (error) {
        log.error('Audit CSV Export Error:', error);
        return NextResponse.json({ error: 'Failed to export audit log' }, { status: 500 });
    }
}
