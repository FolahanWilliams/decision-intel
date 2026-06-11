'use client';

/**
 * /dashboard/decisions/[id] — unified container detail page (Phase 2).
 *
 * Replaces /dashboard/deals/[id] + the legacy decision-package detail
 * with a mode-aware shell. Layout: ContainerCompositeHero (composite
 * metrics + bias signature) above CommitteeReadinessGate (5-gate
 * checklist) above member-document list with per-doc DQI tiles.
 */

import { use, useState } from 'react';
import { useToast } from '@/components/ui/EnhancedToast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  ChevronLeft,
  FileText,
  Download,
  GitCompareArrows,
  CheckCircle2,
  Send,
  AlertOctagon,
  AlertTriangle,
} from 'lucide-react';
import { useContainer } from '@/hooks/useContainers';
import { ContainerCompositeHero } from '@/components/containers/ContainerCompositeHero';
import { ContainerTopFixesCard } from '@/components/containers/ContainerTopFixesCard';
import { CommitteeReadinessGate } from '@/components/containers/CommitteeReadinessGate';
import { PriorsCaptureCard } from '@/components/containers/PriorsCaptureCard';
import { PmiTrackerTab } from '@/components/containers/PmiTrackerTab';
import { DealFeverPremortemCard } from '@/components/containers/DealFeverPremortemCard';
import { PremortemDefenceCaptureCard } from '@/components/containers/PremortemDefenceCaptureCard';
import { OperationalProxyResolutionCard } from '@/components/containers/OperationalProxyResolutionCard';
import { CulturalPairingRiskCard } from '@/components/containers/CulturalPairingRiskCard';
import { ContainerOutcomeCaptureModal } from '@/components/containers/ContainerOutcomeCaptureModal';
import { checkPremortemDefenceGate } from '@/lib/containers/premortem-defence';
import { checkOperationalProxyGate } from '@/lib/containers/operational-proxy-gate';
import { ContainerCrossReferenceCard } from '@/components/containers/ContainerCrossReferenceCard';
import { ContainerLinksPanel } from '@/components/containers/ContainerLinksPanel';
import { AnatomyOfACallGraph } from '@/components/marketing/AnatomyOfACallGraph';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { dqiColorFor } from '@/lib/utils/grade';

export default function ContainerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { container, isLoading, error, mutate } = useContainer(id);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const { showToast } = useToast();

  if (isLoading) {
    // Layout-matched skeleton (DESIGN.md loading-state pattern): back-link strip,
    // page H1, composite hero, then the card stack — no reflow when data lands.
    return (
      <div style={{ padding: 24 }} aria-busy="true">
        <Skeleton className="h-4 w-[140px]" style={{ marginBottom: 16 }} />
        <Skeleton className="h-8 w-[320px]" style={{ marginBottom: 20 }} />
        <Skeleton style={{ height: 150, borderRadius: 'var(--radius-xl)', marginBottom: 20 }} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          <Skeleton style={{ height: 260, borderRadius: 'var(--radius-xl)' }} />
          <Skeleton style={{ height: 260, borderRadius: 'var(--radius-xl)' }} />
        </div>
      </div>
    );
  }

  if (error || !container) {
    return (
      <div style={{ padding: 24 }}>
        <Link
          href="/dashboard/decisions"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            fontSize: 'var(--fs-sm)',
            marginBottom: 12,
          }}
        >
          <ChevronLeft size={14} />
          All decisions
        </Link>
        <div
          style={{
            padding: 16,
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--error)',
          }}
        >
          {error?.message ?? 'Decision not found.'}
        </div>
      </div>
    );
  }

  const exportPdf = async () => {
    window.location.href = `/api/containers/${container.id}/provenance-record?format=pdf`;
  };

  const triggerCrossRef = async () => {
    try {
      const res = await fetch(`/api/containers/${container.id}/cross-reference`, {
        method: 'POST',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        showToast(json?.error ?? 'Cross-reference failed', 'error');
        return;
      }
      mutate();
      showToast('Cross-reference complete', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cross-reference failed', 'error');
    }
  };

  return (
    <ErrorBoundary sectionName="Decision detail">
      <Link
        href="/dashboard/decisions"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--accent-primary)',
          textDecoration: 'none',
          fontSize: 'var(--fs-sm)',
          marginBottom: 12,
        }}
      >
        <ChevronLeft size={14} />
        All decisions
      </Link>

      <div
        className="page-header"
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 4,
            }}
          >
            <h1 style={{ margin: 0 }}>{container.name}</h1>
            {/* Cross-doc conflict chip — Improvement #3 lock 2026-05-28.
                Renders prominently when the latest cross-ref run has
                conflicts. Mirrors VerdictBand chip styling from the
                doc-detail page. */}
            {container.latestCrossReference && container.latestCrossReference.conflictCount > 0 && (
              <a
                href="#cross-reference"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  color:
                    container.latestCrossReference.highSeverityCount > 0
                      ? 'var(--error)'
                      : container.latestCrossReference.conflictCount >= 3
                        ? 'var(--warning)'
                        : 'var(--info)',
                  background: `color-mix(in srgb, ${
                    container.latestCrossReference.highSeverityCount > 0
                      ? 'var(--error)'
                      : container.latestCrossReference.conflictCount >= 3
                        ? 'var(--warning)'
                        : 'var(--info)'
                  } 12%, transparent)`,
                  border: `1px solid ${
                    container.latestCrossReference.highSeverityCount > 0
                      ? 'var(--error)'
                      : container.latestCrossReference.conflictCount >= 3
                        ? 'var(--warning)'
                        : 'var(--info)'
                  }`,
                }}
              >
                {container.latestCrossReference.highSeverityCount > 0 ? (
                  <AlertOctagon size={12} />
                ) : (
                  <AlertTriangle size={12} />
                )}
                {container.latestCrossReference.conflictCount} cross-doc conflict
                {container.latestCrossReference.conflictCount === 1 ? '' : 's'}
                {container.latestCrossReference.highSeverityCount > 0 && (
                  <> · {container.latestCrossReference.highSeverityCount} high</>
                )}
              </a>
            )}
          </div>
          {container.decisionFrame && (
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--fs-sm)',
                marginTop: 4,
                fontStyle: 'italic',
              }}
            >
              {container.decisionFrame}
            </p>
          )}
        </div>

        {/* Header action row — Improvement #3 lock 2026-05-28. Promotes
            Export DPR to the procurement-grade "Forward to committee"
            action (mirrors the doc-detail page's primary action shipped
            today). Cross-reference button is a secondary action when
            ≥2 docs are analyzed. */}
        {container.analyzedDocCount > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexShrink: 0,
              alignItems: 'center',
            }}
          >
            {container.analyzedDocCount >= 2 && (
              <button
                type="button"
                onClick={triggerCrossRef}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Re-run cross-document conflict detection across all analyzed members"
              >
                <GitCompareArrows size={13} strokeWidth={2.25} />
                Re-scan conflicts
              </button>
            )}
            <button
              type="button"
              onClick={exportPdf}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
              }}
              title="Export composite Decision Provenance Record for this decision"
            >
              <Send size={13} strokeWidth={2.25} />
              Forward to committee
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: 16,
          alignItems: 'flex-start',
        }}
        className="container-detail-grid"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Pre-artefact priors capture (locked 2026-05-10) — only
              surfaces when the container has no priors AND zero
              analyzed docs. Per Deep Research paper Ch 1, the actual
              cognitive commitment is forged BEFORE the audit lands;
              capturing priors gives the audit something honest to
              compare against, not just the engineered IC narrative. */}
          {container.priors === null && container.analyzedDocCount === 0 && (
            <PriorsCaptureCard
              containerId={container.id}
              containerName={container.name}
              onSaved={() => mutate()}
            />
          )}

          {/* Cultural-pairing risk capture (locked 2026-05-10) — only
              surfaces when the container is acquisition-mode AND no
              cultural-pairing risk has been captured yet. Per paper
              Ch 10, cross-border M&A failures are dominated by
              cultural reasoning failure, not financial mathematics. */}
          {container.kind === 'acquisition' && container.culturalPairingRisk === null && (
            <CulturalPairingRiskCard
              containerId={container.id}
              containerName={container.name}
              onSaved={() => mutate()}
            />
          )}

          {/* PMI Tracker — Path B + thin Path C (locked 2026-05-10).
              Closes the audit loop by tracking the PMI metrics the IC
              memo committed to. Mounts on acquisition-mode containers
              with at least one analyzed doc (i.e. past target-ID stage)
              so the tracker shows up when there's an audit to validate
              against. Per paper Ch 7 + Ch 11. NOT a project-management
              surface — claim/predicted/observed/Brier only. */}
          {container.kind === 'acquisition' && container.analyzedDocCount > 0 && (
            <PmiTrackerTab containerId={container.id} containerName={container.name} />
          )}

          {/* Deal Fever pre-mortem — N1 ship 2026-05-11. Kyle-Price
              overlay (Roblox Head of Corp Dev / master KB source #23).
              Mounts on acquisition-mode containers with at least one
              analyzed doc — the user clicks to fire 3 brutal questions
              targeted at Deal Fever / Winner's Curse / Synergy Mirage.
              NOT auto-fire (cost discipline + the click is a conscious
              "I'm inviting dissent" moment for the corp dev professional). */}
          {container.kind === 'acquisition' && container.analyzedDocCount > 0 && (
            <DealFeverPremortemCard containerId={container.id} containerName={container.name} />
          )}

          {/* V2 — mandatory pre-mortem dissent gate. Sequenced right
              after the antagonist: the sponsor records a written defence
              before the outcome can be logged; the exchange flows into
              the DPR. Same acquisition + analyzed gate as the pre-mortem
              card; the card itself flips to a read-only confirmation
              once a complete defence exists. */}
          {container.kind === 'acquisition' && container.analyzedDocCount > 0 && (
            <PremortemDefenceCaptureCard
              containerId={container.id}
              containerName={container.name}
              premortemDefence={container.premortemDefence}
              onSaved={() => mutate()}
            />
          )}

          {/* Defensibility Vector 1 — forced-at-vote 90-day proxy loop
              (locked 2026-05-17). ALL kinds once a decision exists
              (analyzed docs). Capture-if-missing → resolve-when-due →
              on-record; the gate blocks outcome logging until a
              falsifiable ≤90-day proxy is captured. */}
          {container.analyzedDocCount > 0 && (
            <OperationalProxyResolutionCard
              containerId={container.id}
              analyzedDocCount={container.analyzedDocCount}
              priors={container.priors}
              onSaved={() => mutate()}
            />
          )}

          <ContainerCompositeHero container={container} />

          {/* Top-3 Fix Tiles at the container level (locked 2026-05-10
              batch 3 #3, DESIGN.md persona-validated layout direction
              universal point #2). Mirrors RemediationChecklist pattern
              from doc-detail; surfaces critical/high named patterns
              (Synergy Mirage / Conglomerate Fallacy / Winner's Curse /
              etc.) + recurring biases as actionable fix tiles ranked
              by severity. Renders nothing when no patterns + no biases
              flagged (early-stage container with clean single doc). */}
          <ContainerTopFixesCard container={container} />

          {/* Anatomy-of-a-Call brand anchor (locked 2026-05-10 batch 2 #1).
              Quiet 5-layer constellation tying this decision to the same
              R²F surface the buyer saw on the landing / how-it-works
              pages. Per CLAUDE.md anatomy-of-a-call lock: 'one visual,
              five surfaces, one brand moment.' Container detail is the
              6th surface where it belongs. Stage=5 (fully composed) +
              size=72 keeps it as a quiet anchor, not a hero. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <AnatomyOfACallGraph stage={5} size={72} captionOverride={null} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span
                style={{
                  fontSize: 'var(--fs-3xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                }}
              >
                Audited · 5 layers
              </span>
              <span
                style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                Knowledge graph · Boardroom · Reasoning audit · What-if · Outcome loop — every angle
                of this decision, in one record.
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 600 }}>
                Documents ({container.documentCount})
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={triggerCrossRef}
                  disabled={container.analyzedDocCount < 2}
                  title={
                    container.analyzedDocCount < 2
                      ? 'Cross-reference requires ≥2 analyzed documents'
                      : 'Run cross-doc cross-reference'
                  }
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color:
                      container.analyzedDocCount < 2 ? 'var(--text-muted)' : 'var(--text-primary)',
                    fontSize: 'var(--fs-xs)',
                    cursor: container.analyzedDocCount < 2 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <GitCompareArrows size={12} />
                  Cross-reference
                </button>
                <button
                  type="button"
                  onClick={exportPdf}
                  disabled={container.analyzedDocCount === 0}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 600,
                    cursor: container.analyzedDocCount === 0 ? 'not-allowed' : 'pointer',
                    opacity: container.analyzedDocCount === 0 ? 0.5 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Download size={12} />
                  Export DPR
                </button>
              </div>
            </div>
            {container.documents.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--fs-sm)',
                }}
              >
                No documents attached yet. Upload a memo to start the audit.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {container.documents.map(m => {
                  const a = m.document.latestAnalysis;
                  const dqiColor = a ? dqiColorFor(a.overallScore) : 'var(--text-muted)';
                  return (
                    <Link
                      key={m.id}
                      href={`/documents/${m.documentId}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 10,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
                          {m.document.filename}
                        </div>
                        <div
                          style={{
                            fontSize: 'var(--fs-2xs)',
                            color: 'var(--text-muted)',
                            marginTop: 2,
                          }}
                        >
                          {m.document.documentType ?? 'document'} ·{' '}
                          {m.document.status === 'analyzed' ? 'analyzed' : m.document.status}
                          {a ? ` · ${a.biasCount} biases` : ''}
                        </div>
                      </div>
                      {a && (
                        <div
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-card)',
                            color: dqiColor,
                            fontSize: 'var(--fs-xs)',
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums',
                            flexShrink: 0,
                          }}
                        >
                          {Math.round(a.overallScore)}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div id="cross-reference" style={{ scrollMarginTop: 72 }}>
            <ContainerCrossReferenceCard run={container.latestCrossReference} />
          </div>

          <ContainerLinksPanel containerId={container.id} />

          <OutcomeBlock
            outcome={container.outcome}
            onCaptureClick={() => {
              // V2 client guard — mirrors the server hard-gate via the
              // shared pure predicate so the sponsor gets a clear nudge
              // instead of a raw 400. Non-acquisition / empty pass.
              const gate = checkPremortemDefenceGate({
                kind: container.kind,
                analyzedDocCount: container.analyzedDocCount,
                premortemDefence: container.premortemDefence,
              });
              if (!gate.allowed) {
                showToast(gate.reason ?? 'Record the pre-mortem defence first.', 'warning');
                return;
              }
              // Vector 1 client guard — same shared pure predicate as
              // the server hard-gate so the sponsor gets a clear nudge,
              // not a raw 400. Empty containers pass.
              const proxyGate = checkOperationalProxyGate({
                analyzedDocCount: container.analyzedDocCount,
                priors: container.priors,
              });
              if (!proxyGate.allowed) {
                showToast(
                  proxyGate.reason ?? 'Log a falsifiable 90-day operational proxy first.',
                  'warning'
                );
                return;
              }
              setShowOutcomeModal(true);
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CommitteeReadinessGate container={container} />
        </div>
      </div>

      {showOutcomeModal && (
        <ContainerOutcomeCaptureModal
          containerId={container.id}
          containerKind={container.kind}
          containerName={container.name}
          initialSummary={container.outcome?.summary}
          initialMetrics={container.outcome?.metrics}
          onClose={() => setShowOutcomeModal(false)}
          onSaved={() => {
            setShowOutcomeModal(false);
            mutate();
          }}
        />
      )}

      <style jsx>{`
        @media (max-width: 900px) {
          :global(.container-detail-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </ErrorBoundary>
  );
}

function OutcomeBlock({
  outcome,
  onCaptureClick,
}: {
  outcome: NonNullable<ReturnType<typeof useContainer>['container']>['outcome'];
  onCaptureClick: () => void;
}) {
  if (!outcome) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 600 }}>Outcome</h2>
          <button
            type="button"
            onClick={onCaptureClick}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              border: 'none',
              color: '#fff',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 size={12} />
            Log outcome
          </button>
        </div>
        <p
          style={{
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-muted)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Closing the loop sharpens your DQI calibration AND contributes to the Bias Genome
          cross-org learning surface. Capture how the decision actually played out vs. the original
          thesis.
        </p>
      </div>
    );
  }

  const reportedDate = new Date(outcome.reportedAt).toLocaleDateString();
  const metricEntries = Object.entries(outcome.metrics).filter(([, v]) => v != null && v !== '');

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div>
          <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 600, marginBottom: 2 }}>Outcome</h2>
          <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
            Reported {reportedDate}
            {outcome.realisedDqi != null && ` · realised DQI ${Math.round(outcome.realisedDqi)}`}
            {outcome.brierScore != null && ` · Brier ${outcome.brierScore.toFixed(3)}`}
          </div>
        </div>
        <button
          type="button"
          onClick={onCaptureClick}
          style={{
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: 'var(--fs-xs)',
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
      </div>
      <p
        style={{
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          marginBottom: metricEntries.length > 0 ? 12 : 0,
          lineHeight: 1.5,
        }}
      >
        {outcome.summary}
      </p>
      {metricEntries.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 8,
          }}
        >
          {metricEntries.map(([key, value]) => (
            <div
              key={key}
              style={{
                padding: 8,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                fontSize: 'var(--fs-xs)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--fs-3xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 2,
                }}
              >
                {key.replace(/_/g, ' ')}
              </div>
              <div
                style={{
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {String(value)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
