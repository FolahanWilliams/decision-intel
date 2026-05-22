'use client';

/**
 * /dashboard/decisions/retroactive — Adaptation #1, the Sankore-killer.
 *
 * Three-step wizard for backfilling historical CLOSED decisions:
 *   1. Bulk upload (≤30 historical docs)
 *   2. Review pairing engine output (memo + outcome pairs by confidence band)
 *   3. Per-pair container form (kind + outcome metrics)
 *
 * Each confirmed pair calls POST /api/containers with isRetroactive=true
 * and outcomeOnCreate, which atomically creates the container + outcome
 * row + recomputes container metrics. The Bias Genome / Decision DNA /
 * Knowledge Graph propagation fires when the memo doc is then attached
 * and the audit pipeline runs on it — the outcome row is already there
 * to ground the recalibration, so the loop closes on day one (the "no
 * 90-day wait" requirement of the locked retroactive mode).
 *
 * Locked 2026-05-21.
 */

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock3 } from 'lucide-react';
import { BulkUploadDropzone } from '@/components/retroactive/BulkUploadDropzone';
import { RetroactivePairingReview } from '@/components/retroactive/RetroactivePairingReview';
import { RetroactiveContainerForm } from '@/components/retroactive/RetroactiveContainerForm';
import { AccentCard } from '@/components/ui/AccentCard';
import type { BulkPair, BulkPairingResult } from '@/lib/retroactive/types';

type WizardStep = 'upload' | 'review';

interface FileErrorLine {
  filename: string;
  reason: string;
}

export default function RetroactiveDecisionsPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('upload');
  const [result, setResult] = useState<BulkPairingResult | null>(null);
  const [fileErrors, setFileErrors] = useState<FileErrorLine[]>([]);
  const [activePair, setActivePair] = useState<BulkPair | null>(null);
  const [confirmedPairIds, setConfirmedPairIds] = useState<Set<string>>(new Set());
  const [createdContainerIds, setCreatedContainerIds] = useState<string[]>([]);

  const handleResult = useCallback((next: BulkPairingResult, errors: FileErrorLine[]) => {
    setResult(next);
    setFileErrors(errors);
    setStep('review');
  }, []);

  const handleCreatePair = useCallback((pair: BulkPair) => {
    setActivePair(pair);
  }, []);

  const handleDismissPair = useCallback((pairId: string) => {
    setConfirmedPairIds(prev => {
      const next = new Set(prev);
      next.add(pairId);
      return next;
    });
  }, []);

  const handleContainerCreated = useCallback(
    (containerId: string) => {
      if (activePair) {
        setConfirmedPairIds(prev => {
          const next = new Set(prev);
          next.add(activePair.pairId);
          return next;
        });
      }
      setCreatedContainerIds(prev => [...prev, containerId]);
      setActivePair(null);
    },
    [activePair]
  );

  const resetWizard = () => {
    setResult(null);
    setFileErrors([]);
    setConfirmedPairIds(new Set());
    setCreatedContainerIds([]);
    setStep('upload');
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <Link
            href="/dashboard/decisions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              marginBottom: 8,
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Decisions</span>
          </Link>
          <h1
            className="page-header"
            style={{
              fontSize: 'var(--fs-page-h1-platform)',
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: 6,
            }}
          >
            Retroactive audit mode
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              maxWidth: 720,
              lineHeight: 1.6,
            }}
          >
            Bulk-upload historical CLOSED decisions — memos + their outcome documents — and the
            pairing engine reconstructs them as retroactive containers. The Bias Genome, Decision
            DNA, and Knowledge Graph populate against real longitudinal data immediately, with no
            90-day forward-calibration wait.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          padding: 12,
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
          fontSize: 13,
        }}
      >
        <StepPill n={1} label="Upload" state={step === 'upload' ? 'active' : 'done'} />
        <StepPill
          n={2}
          label="Review pairing"
          state={
            step === 'upload'
              ? 'pending'
              : confirmedPairIds.size === (result?.pairs.length ?? 0) && result
                ? 'done'
                : 'active'
          }
        />
        <StepPill
          n={3}
          label={`Containers created · ${createdContainerIds.length}`}
          state={createdContainerIds.length > 0 ? 'done' : 'pending'}
        />
      </div>

      {step === 'upload' && <BulkUploadDropzone onResult={handleResult} disabled={false} />}

      {step === 'review' && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fileErrors.length > 0 && (
            <AccentCard
              accent="warning"
              title={
                <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {fileErrors.length} file{fileErrors.length === 1 ? '' : 's'} failed to parse
                </span>
              }
            >
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {fileErrors.map((e, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <strong>{e.filename}</strong>{' '}
                    <span style={{ color: 'var(--text-muted)' }}>· {e.reason}</span>
                  </li>
                ))}
              </ul>
            </AccentCard>
          )}

          <RetroactivePairingReview
            result={result}
            onCreatePair={handleCreatePair}
            onDismissPair={handleDismissPair}
            confirmedPairIds={confirmedPairIds}
          />

          {createdContainerIds.length > 0 && (
            <AccentCard
              accent="primary"
              title={
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                  }}
                >
                  <CheckCircle2 size={14} color="var(--success)" />
                  <span>
                    {createdContainerIds.length} retroactive container
                    {createdContainerIds.length === 1 ? '' : 's'} created
                  </span>
                </span>
              }
            >
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Each container is live in the kanban. Attach the memo document to trigger the audit
                pipeline — the outcome is already on the container, so recalibration runs against
                KNOWN reality on day one.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/decisions')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Open Decisions kanban →
                </button>
                <button
                  type="button"
                  onClick={resetWizard}
                  style={{
                    padding: '8px 14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Upload another batch
                </button>
              </div>
            </AccentCard>
          )}
        </div>
      )}

      {activePair && result && (
        <RetroactiveContainerForm
          pair={activePair}
          batchId={result.batchId}
          onClose={() => setActivePair(null)}
          onCreated={handleContainerCreated}
        />
      )}
    </div>
  );
}

function StepPill({
  n,
  label,
  state,
}: {
  n: number;
  label: string;
  state: 'pending' | 'active' | 'done';
}) {
  const stateColor =
    state === 'done'
      ? 'var(--success)'
      : state === 'active'
        ? 'var(--accent-primary)'
        : 'var(--text-muted)';
  const Icon = state === 'done' ? CheckCircle2 : Clock3;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-card)',
        border: `1px solid ${state === 'pending' ? 'var(--border-color)' : stateColor}`,
        color: stateColor,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <Icon size={14} />
      <span>
        Step {n} · {label}
      </span>
    </div>
  );
}
