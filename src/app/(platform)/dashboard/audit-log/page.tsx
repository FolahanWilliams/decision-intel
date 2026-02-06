import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ShieldCheck, Download, Search } from 'lucide-react';
import { format } from 'date-fns';

async function getAuditLogs() {
    const { userId } = await auth();
    if (!userId) return [];

    return await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
}

export default async function AuditLogPage() {
    const logs = await getAuditLogs();

    return (
        <div className="container py-8">
            <header className="mb-8">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <ShieldCheck size={20} />
                    <span className="text-sm font-medium">GOVERNANCE & COMPLIANCE</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
                <p className="text-muted-foreground mt-2">
                    Track all access, analysis, and export events for compliance verification.
                </p>
            </header>

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
                                        No audit events recorded yet.
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
            </div>
        </div>
    );
}
