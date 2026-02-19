
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ShieldCheck, Download, Search, FileText, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import AuditFilters from './AuditFilters';
import Link from 'next/link';

// Helper to get logs with filters
async function getAuditLogs(
    userId: string,
    page: number = 1,
    action?: string,
    search?: string
) {
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { userId };

    if (action) {
        where.action = action;
    }

    if (search) {
        where.OR = [
            { resource: { contains: search, mode: 'insensitive' } },
            // Note: details is JSON, simple contains might not work for all DBs, 
            // but Prisma supports filters on JSON. For simplicity, searching resource or action here.
            { action: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip
        }),
        prisma.auditLog.count({ where })
    ]);

    return { logs, total, totalPages: Math.ceil(total / pageSize) };
}

export default async function AuditLogPage({
    searchParams
}: {
    searchParams: Promise<{ page?: string, action?: string, search?: string }>
}) {
    const { userId } = await auth();
    if (!userId) return <div>Unauthorized</div>;

    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;
    const { logs, totalPages } = await getAuditLogs(userId, page, resolvedParams.action, resolvedParams.search);

    return (
        <div className="container py-8">
            <header className="mb-8">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <ShieldCheck size={20} />
                            <span className="text-sm font-medium">GOVERNANCE & COMPLIANCE</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
                        <p className="text-muted-foreground mt-2">
                            Track all access, analysis, and export events for compliance verification.
                        </p>
                    </div>
                    <a
                        href="/api/audit?export=csv"
                        download
                        className="btn btn-secondary flex items-center gap-2 mt-1"
                        style={{ flexShrink: 0 }}
                    >
                        <Download size={14} />
                        Export CSV
                    </a>
                </div>
            </header>

            <AuditFilters />

            <div className="card">
                <div className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Resource</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No audit events found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {format(log.createdAt, 'MMM d, yyyy HH:mm:ss')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {log.action === 'EXPORT_PDF' && <Download size={14} className="text-blue-500" />}
                                                {log.action === 'SCAN_DOCUMENT' && <Search size={14} className="text-green-500" />}
                                                {log.action === 'VIEW_DOCUMENT' && <FileText size={14} className="text-orange-500" />}
                                                {log.action === 'LOGIN' && <LogIn size={14} className="text-purple-500" />}
                                                <span className="font-medium text-sm">{log.action}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="badge badge-secondary text-xs">
                                                {log.resource}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                                            {JSON.stringify(log.details)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                        <Link
                            href={`?page=${Math.max(1, page - 1)}`}
                            className={`btn btn-ghost ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                        >
                            Previous
                        </Link>
                        <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                        <Link
                            href={`?page=${Math.min(totalPages, page + 1)}`}
                            className={`btn btn-ghost ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                        >
                            Next
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
