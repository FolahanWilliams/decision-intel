import Link from 'next/link';
import { format } from 'date-fns';
import { Download, FileText, Fingerprint, ShieldCheck } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { R2FBadge } from '@/components/ui/R2FBadge';

const PAGE_SIZE = 50;

// Short human labels for the framework IDs stored on the regulatoryMapping
// JSON blob. Extend as new frameworks are added to bias-regulation-map.ts.
const FRAMEWORK_LABEL: Record<string, string> = {
  eu_ai_act: 'EU AI Act',
  basel_iii: 'Basel III',
  sec_ai_disclosure: 'SEC AI',
  gdpr: 'GDPR',
  sox_404: 'SOX §404',
  uk_ai_white_paper: 'UK AI',
  colorado_sb24_205: 'CO SB24-205',
  california_sb942: 'CA SB942',
  ai_verify: 'AI Verify',
};

interface RegulatoryFrameworkEntry {
  id?: unknown;
  frameworks?: Array<{ id?: unknown }>;
}

function collectFrameworkIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids = new Set<string>();
  for (const entry of raw as RegulatoryFrameworkEntry[]) {
    if (!entry || typeof entry !== 'object') continue;
    if (Array.isArray(entry.frameworks)) {
      for (const fw of entry.frameworks) {
        if (fw && typeof fw.id === 'string') ids.add(fw.id);
      }
    }
  }
  return Array.from(ids).sort();
}

function shortHash(h: string | null | undefined): string {
  if (!h) return '—';
  if (h === 'UNAVAILABLE' || h === 'FILE_NOT_AVAILABLE') return h;
  return `${h.slice(0, 10)}…`;
}

export default async function ProvenanceArchivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="container py-8">
        <div className="card" style={{ padding: '20px 24px' }}>
          Please sign in to view the provenance archive.
        </div>
      </div>
    );
  }

  // Resolve scope: org if the user belongs to one, otherwise personal.
  let orgId: string | null = null;
  try {
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      select: { orgId: true },
    });
    orgId = membership?.orgId ?? null;
  } catch {
    // Schema drift tolerance — fall back to personal scope.
  }

  const records = await prisma.decisionProvenanceRecord
    .findMany({
      where: orgId ? { OR: [{ orgId }, { userId: user.id }] } : { userId: user.id },
      orderBy: { generatedAt: 'desc' },
      take: PAGE_SIZE,
      select: {
        id: true,
        analysisId: true,
        documentId: true,
        inputHash: true,
        promptFingerprint: true,
        generatedAt: true,
        schemaVersion: true,
        regulatoryMapping: true,
        analysis: {
          select: {
            overallScore: true,
            document: { select: { filename: true } },
            _count: { select: { biases: true } },
          },
        },
      },
    })
    .catch(() => [] as Array<never>);

  return (
    <ErrorBoundary sectionName="Provenance archive">
      <div className="container py-8">
        <div className="page-header">
          <div>
            <h1>
              <span className="text-gradient">Decision Provenance Archive</span>
            </h1>
            <p className="page-subtitle" style={{ maxWidth: 640 }}>
              Every signed DPR generated in this {orgId ? 'org' : 'account'}. One row per audit —
              download a fresh PDF on demand, forward the link to your GC or audit committee.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <R2FBadge size="sm" />
            <Link
              href="/decision-provenance"
              className="btn btn-secondary flex items-center gap-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ShieldCheck size={14} />
              Specimen PDF
            </Link>
          </div>
        </div>

        {records.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '28px 26px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <Fingerprint
              size={28}
              strokeWidth={1.75}
              style={{ margin: '0 auto 10px', color: 'var(--accent-primary)' }}
              aria-hidden
            />
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 4,
              }}
            >
              No Decision Provenance Records yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              Generate a DPR on any completed audit to seed the archive.
            </div>
            <Link href="/dashboard" className="btn btn-secondary flex items-center gap-2" style={{ display: 'inline-flex' }}>
              <FileText size={14} />
              Go to dashboard
            </Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--bg-elevated, #fff)',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <th style={thStyle}>Memo</th>
                  <th style={thStyle}>DQI</th>
                  <th style={thStyle}>Biases</th>
                  <th style={thStyle}>Frameworks</th>
                  <th style={thStyle}>Generated</th>
                  <th style={thStyle}>Input hash</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {records.map(r => {
                  const frameworks = collectFrameworkIds(r.regulatoryMapping);
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                      <td style={tdStyle}>
                        <Link
                          href={`/documents/${r.documentId}`}
                          style={{
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          {r.analysis.document.filename}
                        </Link>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {Math.round(r.analysis.overallScore)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {r.analysis._count.biases}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {frameworks.length === 0 ? (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {frameworks.slice(0, 3).map(id => (
                              <span
                                key={id}
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 'var(--radius-full, 9999px)',
                                  background: 'rgba(22,163,74,0.08)',
                                  color: 'var(--accent-primary)',
                                  border: '1px solid rgba(22,163,74,0.22)',
                                  letterSpacing: '0.02em',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {FRAMEWORK_LABEL[id] ?? id}
                              </span>
                            ))}
                            {frameworks.length > 3 && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  color: 'var(--text-muted)',
                                }}
                              >
                                +{frameworks.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {format(r.generatedAt, 'd MMM yyyy · HH:mm')}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: 12,
                            color: 'var(--text-muted)',
                          }}
                          title={r.inputHash}
                        >
                          {shortHash(r.inputHash)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <a
                          href={`/api/compliance/audit-packet/${r.analysisId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            fontSize: 12,
                          }}
                        >
                          <Download size={12} />
                          PDF
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  padding: '12px 14px',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '14px',
  verticalAlign: 'middle',
};
