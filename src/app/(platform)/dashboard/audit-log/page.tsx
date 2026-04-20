import { ErrorBoundary } from '@/components/ErrorBoundary';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Search, FileText, LogIn, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import AuditFilters from './AuditFilters';
import Link from 'next/link';

// Helper to get logs with filters
async function getAuditLogs(userId: string, page: number = 1, action?: string, search?: string) {
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
      { action: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, totalPages: Math.ceil(total / pageSize) };
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; search?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return <div>Unauthorized</div>;

  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const { logs, totalPages } = await getAuditLogs(
    userId,
    page,
    resolvedParams.action,
    resolvedParams.search
  );

  return (
    <ErrorBoundary sectionName="Audit Log">
      <div className="container py-8">
        <div className="page-header">
          <div>
            <h1
              style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}
            >
              <span className="text-gradient">Audit Log</span>
            </h1>
            <p className="page-subtitle" style={{ maxWidth: 640 }}>
              Track all access, analysis, and export events for compliance verification.
            </p>
          </div>
          <a
            href="/api/audit?export=csv"
            download
            className="btn btn-secondary flex items-center gap-2"
            style={{ flexShrink: 0 }}
          >
            <Download size={14} />
            Export CSV
          </a>
        </div>

        <AuditFilters />

        <div className="card">
          {/* Desktop table view */}
          <div className="hidden md:block p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 bg-[var(--bg-card)] z-10">Timestamp</TableHead>
                  <TableHead className="sticky top-0 bg-[var(--bg-card)] z-10">Action</TableHead>
                  <TableHead className="sticky top-0 bg-[var(--bg-card)] z-10">Resource</TableHead>
                  <TableHead className="sticky top-0 bg-[var(--bg-card)] z-10">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <ClipboardList
                          size={40}
                          style={{ color: 'var(--text-muted)', opacity: 0.4 }}
                        />
                        <div>
                          <p className="font-medium mb-1">No audit events found</p>
                          <p className="text-sm">
                            Events will appear here as you interact with the platform.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: (typeof logs)[number]) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {format(log.createdAt, 'MMM d, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.action === 'EXPORT_PDF' && (
                            <Download size={14} className="text-blue-500" />
                          )}
                          {log.action === 'SCAN_DOCUMENT' && (
                            <Search size={14} className="text-green-500" />
                          )}
                          {log.action === 'VIEW_DOCUMENT' && (
                            <FileText size={14} className="text-orange-500" />
                          )}
                          {log.action === 'LOGIN' && (
                            <LogIn size={14} className="text-purple-500" />
                          )}
                          <span className="font-medium text-sm">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="badge badge-secondary text-xs">{log.resource}</span>
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

          {/* Mobile card view */}
          <div className="md:hidden">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 px-4">
                <ClipboardList size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                <div className="text-center">
                  <p className="font-medium mb-1 text-muted-foreground">No audit events found</p>
                  <p className="text-sm text-muted-foreground">
                    Events will appear here as you interact with the platform.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {logs.map((log: (typeof logs)[number]) => (
                  <div key={log.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.action === 'EXPORT_PDF' && (
                          <Download size={14} className="text-blue-500" />
                        )}
                        {log.action === 'SCAN_DOCUMENT' && (
                          <Search size={14} className="text-green-500" />
                        )}
                        {log.action === 'VIEW_DOCUMENT' && (
                          <FileText size={14} className="text-orange-500" />
                        )}
                        {log.action === 'LOGIN' && <LogIn size={14} className="text-purple-500" />}
                        <span className="font-medium text-sm">{log.action}</span>
                      </div>
                      <span className="badge badge-secondary text-xs">{log.resource}</span>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {format(log.createdAt, 'MMM d, yyyy HH:mm:ss')}
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground break-words">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
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
    </ErrorBoundary>
  );
}
