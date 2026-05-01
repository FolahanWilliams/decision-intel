'use client';

/**
 * InlinePasteMemoCard — inline paste-a-memo surface on /dashboard.
 *
 * Pre-2026-05-01 this component POSTed to `/api/human-decisions` and
 * routed users to the cognitive-audit detail page — the lighter
 * pipeline (DQI + noise + bias JSON + summary). That was wrong for
 * long-form strategic memos: the cognitive-audit pipeline produces
 * NO boardroom simulation, NO reference class forecast, NO
 * counterfactual impact, NO structural assumptions panel, NO DPR
 * PDF, NO Decision Knowledge Graph nodes. The full document pipeline
 * does all of that.
 *
 * 2026-05-01 surgical fix: pasted memos now route through the
 * Document pipeline. Flow:
 *   1. Wrap pasted text as a synthetic File (paste-{ts}.txt).
 *   2. POST FormData to `/api/upload` — creates a real Document row.
 *   3. Drive `/api/analyze/stream` via useAnalysisStream hook —
 *      runs the full 12-node LangGraph pipeline.
 *   4. On completion, redirect to `/documents/[id]` — the rich
 *      document detail page with every panel.
 *
 * The cognitive-audit pipeline (HumanDecision + CognitiveAudit) is
 * preserved for ingest-from-integration sources (Slack threads,
 * email forwards, meetings, journal entries) where short-form is
 * the right shape and the 12-node pipeline would be wasteful. The
 * /dashboard/cognitive-audits/submit page still POSTs to
 * `/api/human-decisions` for those sources; this card no longer
 * does — the manual paste path is now Document-only.
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Loader2, X, CheckCircle2 } from 'lucide-react';
import { RoleSamplePicker } from '@/components/samples/RoleSamplePicker';
import { scanForPii, type ScanResult } from '@/lib/utils/redaction-scanner';
import { RedactionPreModal, type RedactionTrailContext } from '@/components/ui/RedactionPreModal';
import { postRedactionTrail, savePlaceholderMap } from '@/lib/utils/redaction-trail';
import { useAnalysisStream } from '@/hooks/useAnalysisStream';

interface InlinePasteMemoCardProps {
  onClose: () => void;
  /** Optional callback invoked when the upload + analysis completes,
   *  receiving the new documentId. If omitted the card auto-navigates
   *  to `/documents/[id]`. */
  onSubmitted?: (documentId: string) => void;
  /** Pre-populate the memo body — used by the first-run walkthrough. */
  initialContent?: string;
  /** When true (and `initialContent` meets the minimum), auto-fire
   *  the audit on mount. */
  autoSubmit?: boolean;
}

const MIN_CONTENT_CHARS = 40;
const MAX_CONTENT_CHARS = 100_000;

const PIPELINE_STEP_NAMES = [
  'GDPR anonymization',
  'Document structure',
  'Intelligence gathering',
  'Bias detection',
  'Noise scoring',
  'Verification',
  'Deep analysis',
  'Boardroom simulation',
  'Recognition cues (RPD)',
  'Forgotten questions',
  'Meta judge',
  'Risk scoring',
];

export function InlinePasteMemoCard({
  onClose,
  onSubmitted,
  initialContent,
  autoSubmit,
}: InlinePasteMemoCardProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent ?? '');
  const [phase, setPhase] = useState<'editing' | 'uploading' | 'analyzing' | 'done' | 'error'>(
    'editing'
  );
  const [error, setError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  // Redaction gate (3.2) — when content has PII hits, the user sees the
  // modal first.
  const [redactScan, setRedactScan] = useState<ScanResult | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  // Track whether we've already navigated so the SSE-complete callback
  // doesn't re-navigate after the user manually clicks somewhere else.
  const navigatedRef = useRef(false);

  const chars = content.trim().length;
  const canSubmit = chars >= MIN_CONTENT_CHARS && chars <= MAX_CONTENT_CHARS;
  const submitting = phase === 'uploading' || phase === 'analyzing';

  const stream = useAnalysisStream({
    stepNames: PIPELINE_STEP_NAMES,
  });
  const { startAnalysis, steps, progress, error: streamError, result } = stream;

  // When the analysis completes, navigate to the rich document-detail
  // page. The result event always carries the documentId (set when we
  // started the stream).
  useEffect(() => {
    if (!result || !documentId || navigatedRef.current) return;
    navigatedRef.current = true;
    if (onSubmitted) {
      onSubmitted(documentId);
    } else {
      router.push(`/documents/${documentId}`);
    }
  }, [result, documentId, router, onSubmitted]);

  // Surface stream-level errors (transient network or pipeline failure)
  // into the card UI.
  useEffect(() => {
    if (!streamError) return;
    setError(streamError);
    setPhase('error');
  }, [streamError]);

  async function uploadAndAnalyze(textToSubmit: string, trail?: RedactionTrailContext) {
    setError(null);
    setPhase('uploading');

    // Wrap the pasted text as a synthetic .txt file. The /api/upload
    // route accepts any of the supported file types; text/plain is one
    // of them and the file-parser path handles it natively.
    const filename = `paste-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    const file = new File([textToSubmit], filename, { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);

    let uploadData: { id: string; filename: string; cached?: boolean };
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.id) {
        setError(json?.error ?? 'Upload failed. Please try again.');
        setPhase('error');
        return;
      }
      uploadData = json as typeof uploadData;
    } catch {
      setError('Network error during upload. Please try again.');
      setPhase('error');
      return;
    }

    // 3.2 deep — fire-and-forget redaction trail. Originals never leave the browser.
    if (trail) {
      const { placeholderEntries, ...payload } = trail;
      postRedactionTrail({
        ...payload,
        analysisId: uploadData.id,
        source: 'dashboard_paste_document',
      });
      if (placeholderEntries.length > 0) {
        savePlaceholderMap(uploadData.id, placeholderEntries);
      }
    }

    setDocumentId(uploadData.id);

    // If /api/upload returned a cached prior analysis (same content
    // hash, same user), skip the stream — go straight to the document.
    if (uploadData.cached) {
      setPhase('done');
      navigatedRef.current = true;
      if (onSubmitted) {
        onSubmitted(uploadData.id);
      } else {
        router.push(`/documents/${uploadData.id}`);
      }
      return;
    }

    setPhase('analyzing');
    await startAnalysis(uploadData.id);
    // The result-watching useEffect handles navigation on completion.
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    const trimmed = content.trim();
    const scan = scanForPii(trimmed);
    if (scan.hits.length > 0) {
      setPendingText(trimmed);
      setRedactScan(scan);
      return;
    }
    await uploadAndAnalyze(trimmed);
  }

  // 4.2 deep — auto-submit path used by FirstRunInlineWalkthrough.
  useEffect(() => {
    if (!autoSubmit) return;
    if (!initialContent) return;
    if (initialContent.trim().length < MIN_CONTENT_CHARS) return;
    void uploadAndAnalyze(initialContent.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedSteps = steps.filter(s => s.status === 'complete').length;

  return (
    <div
      className="card"
      style={{
        borderLeft: '3px solid var(--accent-primary)',
        padding: '20px 22px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrainCircuit
            size={18}
            strokeWidth={2.25}
            style={{ color: 'var(--accent-primary)' }}
            aria-hidden
          />
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Paste a strategic memo
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Same pipeline as a file upload. R&sup2;F audit, 12 LangGraph nodes, signed DPR, full
              document detail page.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to file upload"
          className="btn btn-ghost btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          disabled={submitting}
        >
          <X size={14} />
          Back to upload
        </button>
      </div>

      {phase === 'editing' && (
        <>
          <div style={{ marginBottom: 14 }}>
            <RoleSamplePicker
              fetchRole={true}
              title="Don't have a memo handy?"
              subtitle="Pick a role-routed sample. Picker reads your onboarding role; you can switch tracks too."
              onSelect={bundle => {
                setContent(bundle.content);
              }}
            />
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste your memo, board-deck excerpt, or market-entry recommendation here. Minimum 40 characters; the full 12-node pipeline runs end-to-end on the content you paste."
            rows={10}
            aria-label="Memo content"
            style={{
              width: '100%',
              minHeight: 180,
              padding: '12px 14px',
              fontSize: 14,
              lineHeight: 1.55,
              fontFamily: 'var(--font-sans, system-ui)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md, 8px)',
              color: 'var(--text-primary)',
              resize: 'vertical',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 10,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {chars < MIN_CONTENT_CHARS
                ? `${MIN_CONTENT_CHARS - chars} more character${MIN_CONTENT_CHARS - chars === 1 ? '' : 's'} to enable audit`
                : `${chars.toLocaleString()} / ${MAX_CONTENT_CHARS.toLocaleString()} characters`}
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn btn-primary btn-sm flex items-center gap-2"
              style={{ minWidth: 160 }}
            >
              <BrainCircuit size={14} /> Run the audit
            </button>
          </div>
        </>
      )}

      {(phase === 'uploading' || phase === 'analyzing') && (
        <div style={{ padding: '8px 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
              {phase === 'uploading'
                ? 'Uploading and encrypting&hellip;'
                : `Running pipeline &middot; ${completedSteps} / ${PIPELINE_STEP_NAMES.length} nodes complete`}
            </span>
          </div>

          {phase === 'analyzing' && (
            <>
              {/* Progress bar */}
              <div
                style={{
                  height: 4,
                  background: 'var(--bg-secondary)',
                  borderRadius: 999,
                  overflow: 'hidden',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(progress, completedSteps ? (completedSteps / PIPELINE_STEP_NAMES.length) * 100 : 4)}%`,
                    background: 'var(--accent-primary)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                {steps.map(step => (
                  <span
                    key={step.name}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 999,
                      background:
                        step.status === 'complete'
                          ? 'rgba(22, 163, 74, 0.10)'
                          : step.status === 'running'
                            ? 'rgba(99, 102, 241, 0.10)'
                            : 'var(--bg-secondary)',
                      color:
                        step.status === 'complete'
                          ? 'var(--accent-primary)'
                          : step.status === 'running'
                            ? 'rgb(79, 70, 229)'
                            : 'var(--text-muted)',
                      border:
                        step.status === 'running'
                          ? '1px solid rgba(99, 102, 241, 0.30)'
                          : '1px solid transparent',
                    }}
                  >
                    {step.status === 'complete' && <CheckCircle2 size={10} />}
                    {step.status === 'running' && (
                      <Loader2 size={10} className="animate-spin" />
                    )}
                    {step.name}
                  </span>
                ))}
              </div>

              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                You&rsquo;ll be redirected to the full document detail page when the audit
                completes. The Decision Provenance Record, boardroom simulation, reference class
                forecast, counterfactual impact, and Knowledge Graph nodes all generate as part of
                this run.
              </p>
            </>
          )}
        </div>
      )}

      {phase === 'error' && error && (
        <div
          role="alert"
          style={{
            marginTop: 4,
            padding: '12px 14px',
            fontSize: 13,
            color: 'var(--error)',
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.22)',
            borderRadius: 'var(--radius-md, 8px)',
          }}
        >
          <strong style={{ fontWeight: 700 }}>Audit failed.</strong> {error}
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={() => {
                setPhase('editing');
                setError(null);
                setDocumentId(null);
                navigatedRef.current = false;
              }}
              className="btn btn-sm"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {redactScan && pendingText && (
        <RedactionPreModal
          isOpen
          text={pendingText}
          scan={redactScan}
          onRedact={async (redacted, trail) => {
            setContent(redacted);
            setRedactScan(null);
            setPendingText(null);
            await uploadAndAnalyze(redacted, trail);
          }}
          onSkip={async trail => {
            const t = pendingText;
            setRedactScan(null);
            setPendingText(null);
            if (t) await uploadAndAnalyze(t, trail);
          }}
          onCancel={() => {
            setRedactScan(null);
            setPendingText(null);
          }}
        />
      )}
    </div>
  );
}
