import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { RelatedDecisions } from '@/components/ui/RelatedDecisions';
import { RootCauseSection } from '@/components/ui/RootCauseSection';
import { ScoreReveal } from '@/components/ui/ScoreReveal';
import { SectionMiniNav } from '@/components/ui/SectionMiniNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const DETAIL_SECTIONS = [
  { id: 'section-scores', label: 'Scores' },
  { id: 'section-summary', label: 'Summary' },
  { id: 'section-biases', label: 'Biases' },
  { id: 'section-graph', label: 'Graph' },
  { id: 'section-root-cause', label: 'Root Cause' },
  { id: 'section-related', label: 'Related' },
];

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getAnalysis(id: string, userId: string) {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        document: true,
        biases: true,
      },
    });

    if (!analysis) return null;

    // Check if user has access
    if (analysis.document.userId !== userId) {
      const membership = await prisma.teamMember.findFirst({
        where: { userId },
      });

      if (!membership || membership.orgId !== analysis.document.orgId) {
        return null;
      }
    }

    return analysis;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }
}

export default async function CognitiveAuditDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const analysis = await getAnalysis(id, user.id);

  if (!analysis) {
    notFound();
  }

  return (
    <ErrorBoundary sectionName="Cognitive Audit Detail">
      <SectionMiniNav sections={DETAIL_SECTIONS} />
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 'clamp(24px, 4vw, 30px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            Cognitive Audit Detail
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{analysis.document.filename}</p>
        </div>

        {/* Overall Scores */}
        <section id="section-scores">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            style={{ marginBottom: 32 }}
          >
            <div
              style={{
                padding: 24,
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <ScoreReveal score={analysis.overallScore} label="Overall Score" showGrade />
              {analysis.recalibratedDqi && typeof analysis.recalibratedDqi === 'object' && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    background:
                      (analysis.recalibratedDqi as Record<string, unknown>).delta &&
                      Number((analysis.recalibratedDqi as Record<string, unknown>).delta) > 0
                        ? 'rgba(22,163,74,0.08)'
                        : 'rgba(239,68,68,0.08)',
                    fontSize: 12,
                    color:
                      (analysis.recalibratedDqi as Record<string, unknown>).delta &&
                      Number((analysis.recalibratedDqi as Record<string, unknown>).delta) > 0
                        ? 'var(--success)'
                        : 'var(--error)',
                  }}
                >
                  Recalibrated:{' '}
                  {String((analysis.recalibratedDqi as Record<string, unknown>).recalibratedScore)}
                  /100 (
                  {Number((analysis.recalibratedDqi as Record<string, unknown>).delta) > 0
                    ? '+'
                    : ''}
                  {String((analysis.recalibratedDqi as Record<string, unknown>).delta)} after
                  outcome)
                </div>
              )}
            </div>

            <div
              style={{
                padding: 24,
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <ScoreReveal score={analysis.noiseScore} label="Noise Score" duration={1200} />
            </div>

            <div
              style={{
                padding: 24,
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                Biases Detected
              </h3>
              <p style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)' }}>
                {analysis.biases.length}
              </p>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section id="section-summary">
          <div
            style={{
              padding: 24,
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              marginBottom: 32,
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 16,
              }}
            >
              Summary
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{analysis.summary}</p>
          </div>
        </section>

        {/* Detected Biases */}
        <section id="section-biases">
          {analysis.biases.length > 0 && (
            <div
              style={{
                padding: 24,
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 16,
                }}
              >
                Detected Biases
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {analysis.biases.map(bias => (
                  <div
                    key={bias.id}
                    style={{
                      padding: 16,
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <h3 style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {bias.biasType}
                      </h3>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 12,
                          fontWeight: 500,
                          ...(bias.severity === 'critical' && {
                            background: 'rgba(239,68,68,0.15)',
                            color: 'var(--error)',
                          }),
                          ...(bias.severity === 'high' && {
                            background: 'rgba(234,88,12,0.15)',
                            color: 'var(--severity-high)',
                          }),
                          ...(bias.severity === 'medium' && {
                            background: 'rgba(217,119,6,0.15)',
                            color: 'var(--warning)',
                          }),
                          ...(bias.severity === 'low' && {
                            background: 'rgba(22,163,74,0.15)',
                            color: 'var(--success)',
                          }),
                        }}
                      >
                        {bias.severity}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
                      {bias.explanation}
                    </p>

                    {bias.excerpt && (
                      <blockquote
                        style={{
                          paddingLeft: 16,
                          borderLeft: '2px solid var(--border-hover)',
                          color: 'var(--text-muted)',
                          fontSize: 14,
                          fontStyle: 'italic',
                        }}
                      >
                        &ldquo;{bias.excerpt}&rdquo;
                      </blockquote>
                    )}

                    {bias.suggestion && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: 12,
                          background: 'rgba(2,132,199,0.08)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(2,132,199,0.2)',
                        }}
                      >
                        <p style={{ color: 'var(--info)', fontSize: 14 }}>
                          <strong>Suggestion:</strong> {bias.suggestion}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Decision Graph Links */}
        <section id="section-graph">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 32,
              marginBottom: 16,
            }}
          >
            <Link
              href={`/dashboard/decision-graph?highlight=${id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 'var(--radius-lg)',
                fontSize: 14,
                fontWeight: 500,
                background: 'rgba(2,132,199,0.08)',
                color: 'var(--info)',
                border: '1px solid rgba(2,132,199,0.2)',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              View in Decision Graph
            </Link>
          </div>
        </section>

        {/* Root Cause Attribution */}
        <section id="section-root-cause">
          {analysis.document.orgId && (
            <RootCauseSection analysisId={id} orgId={analysis.document.orgId} />
          )}
        </section>

        {/* Related Decisions from Knowledge Graph */}
        <section id="section-related">
          <RelatedDecisions analysisId={id} />
        </section>
      </div>
    </ErrorBoundary>
  );
}
