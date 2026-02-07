import { NextRequest, NextResponse } from 'next/server';
import { logAudit, AuditLogParams } from '@/lib/audit';

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as AuditLogParams;
        await logAudit(body);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Audit Log Error:', error);
        return NextResponse.json({ error: 'Failed to log audit event' }, { status: 500 });
    }
}
