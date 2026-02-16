import { NextRequest, NextResponse } from 'next/server';
import { logAudit, AuditLogParams } from '@/lib/audit';
import { auth } from '@clerk/nextjs/server';
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
