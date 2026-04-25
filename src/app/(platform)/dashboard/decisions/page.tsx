import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { buildPackageAccessFilter } from '@/lib/utils/decision-package-access';
import { CreatePackageButton } from '@/components/decisions/CreatePackageButton';

const STATUS_LABEL: Record<string, string> = {
  drafting: 'Drafting',
  under_review: 'Under review',
  decided: 'Decided',
  superseded: 'Superseded',
};
const STATUS_TINT: Record<string, string> = {
  drafting: '#3b82f6',
  under_review: '#eab308',
  decided: '#16A34A',
  superseded: '#94a3b8',
};

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function dqiTint(score: number | null): string {
  if (score == null) return 'var(--text-muted)';
  if (score >= 85) return 'var(--success, #10b981)';
  if (score >= 70) return 'var(--accent-primary, #16A34A)';
  if (score >= 55) return 'var(--warning, #d97706)';
  if (score >= 40) return 'var(--severity-high, #ef4444)';
  return 'var(--severity-critical, #b91c1c)';
}

export default async function DecisionPackagesListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) redirect('/login?next=/dashboard/decisions');

  const access = await buildPackageAccessFilter(user.id);
  const packages = await prisma.decisionPackage
    .findMany({
      where: access.where,
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        decisionFrame: true,
        status: true,
        compositeDqi: true,
        compositeGrade: true,
        documentCount: true,
        analyzedDocCount: true,
        recurringBiasCount: true,
        conflictCount: true,
        highSeverityConflictCount: true,
        ownerUserId: true,
        visibility: true,
        updatedAt: true,
        decidedAt: true,
      },
    })
    .catch(() => [] as never[]);

  return (
    <ErrorBoundary sectionName="Decision Packages">
      <div style={{ padding: 'var(--spacing-xl)', maxWidth: 1240, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <div style={{ flex: 1, minWidth: 280 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              <Package size={12} /> Decision Packages
            </div>
            <h1 className="page-header" style={{ margin: 0, color: 'var(--text-primary)' }}>
              Strategic decisions, packaged.
            </h1>
            <p
              style={{
                margin: '8px 0 0',
                color: 'var(--text-secondary)',
                fontSize: 14,
                maxWidth: 720,
                lineHeight: 1.5,
              }}
            >
              A Decision Package bundles the documents that compose a single decision — memo, model,
              counsel review, IC deck. Composite DQI + cross-document conflict detection runs across
              the bundle, not the individual files. Mirror of the deal page, for non-deal contexts.
            </p>
          </div>
          <CreatePackageButton />
        </div>

        {packages.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-xl)',
              textAlign: 'center',
            }}
          >
            <Package size={28} style={{ color: 'var(--text-muted)' }} />
            <h2
              style={{
                margin: '12px 0 6px',
                color: 'var(--text-primary)',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              No decision packages yet
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 480, margin: '0 auto' }}>
              Bundle 2+ analyzed documents that constitute a single strategic decision. The package
              page renders composite DQI + recurring biases + cross-document conflicts in one view.
            </p>
            <div style={{ marginTop: 18, display: 'inline-block' }}>
              <CreatePackageButton />
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 14,
            }}
          >
            {packages.map(p => {
              const isOwner = p.ownerUserId === user.id;
              const tint = STATUS_TINT[p.status] ?? '#94a3b8';
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/decisions/${p.id}`}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)',
                    transition: 'border-color 0.15s ease, transform 0.15s ease',
                  }}
                  onMouseEnter={undefined}
                  onMouseLeave={undefined}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: `${tint}22`,
                        border: `1px solid ${tint}55`,
                        color: tint,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                    {!isOwner && (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Shared
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                      marginBottom: 4,
                    }}
                  >
                    {p.name}
                  </div>
                  {p.decisionFrame && (
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--text-muted)',
                        fontSize: 12,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {p.decisionFrame}
                    </p>
                  )}
                  <div
                    style={{
                      marginTop: 10,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 6,
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>
                      <strong style={{ color: dqiTint(p.compositeDqi), fontSize: 14 }}>
                        {p.compositeDqi != null ? Math.round(p.compositeDqi) : '—'}
                      </strong>
                      {p.compositeDqi != null && (
                        <span style={{ marginLeft: 4 }}>
                          {p.compositeGrade ? `· ${p.compositeGrade}` : ''}
                        </span>
                      )}
                      <span style={{ marginLeft: 6 }}>composite DQI</span>
                    </span>
                    <span>
                      {p.analyzedDocCount}/{p.documentCount} analyzed
                    </span>
                    <span>{p.recurringBiasCount} recurring biases</span>
                    <span
                      style={{
                        color:
                          p.highSeverityConflictCount > 0
                            ? '#DC2626'
                            : p.conflictCount > 0
                            ? '#D97706'
                            : 'var(--text-muted)',
                      }}
                    >
                      {p.conflictCount > 0 ? (
                        <>
                          <AlertTriangle size={11} style={{ verticalAlign: 'middle' }} />{' '}
                          {p.conflictCount} conflict{p.conflictCount === 1 ? '' : 's'}
                        </>
                      ) : (
                        'No conflicts logged'
                      )}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: '1px solid var(--border-color)',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}
                  >
                    Updated {formatDate(p.updatedAt)}
                    {p.decidedAt ? ` · decided ${formatDate(p.decidedAt)}` : ''}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
