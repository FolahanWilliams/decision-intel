'use client';

/**
 * InlinePasteMemoCard — inline paste-a-memo surface on /dashboard.
 *
 * Replaces the upload-zone when the user clicks "Paste text" in the
 * four-doors row so there is literally one surface for the most common
 * non-file ingestion path, with no bounce through
 * /dashboard/cognitive-audits/submit?source=manual (that route still
 * exists for external deep links and for the meeting / email sources
 * that have their own shapes).
 *
 * Uses the same POST /api/human-decisions contract as the full submit
 * page. On success, navigates to the newly-created cognitive-audit.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Loader2, X } from 'lucide-react';
import { RoleSamplePicker } from '@/components/samples/RoleSamplePicker';
import { scanForPii, type ScanResult } from '@/lib/utils/redaction-scanner';
import {
  RedactionPreModal,
  type RedactionTrailContext,
} from '@/components/ui/RedactionPreModal';
import {
  postRedactionTrail,
  savePlaceholderMap,
} from '@/lib/utils/redaction-trail';

interface InlinePasteMemoCardProps {
  onClose: () => void;
  /** Persists the cognitive-audit and navigates to it by default.
   *  Passed as a callback so the parent can intercept (e.g. auto-scroll
   *  the new audit into view without a page change). */
  onSubmitted?: (auditId: string) => void;
  /** Pre-populate the memo body — used by the first-run walkthrough to
   *  drop a role-matched sample into the editor without an extra paste step. */
  initialContent?: string;
  /** When true (and `initialContent` meets the minimum), auto-fire the
   *  audit on mount so the user sees the pipeline run immediately. */
  autoSubmit?: boolean;
}

const MIN_CONTENT_CHARS = 40;
const MAX_CONTENT_CHARS = 100_000;

export function InlinePasteMemoCard({
  onClose,
  onSubmitted,
  initialContent,
  autoSubmit,
}: InlinePasteMemoCardProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Redaction gate (3.2) — when content has PII hits, the user sees the
  // modal first. The scan + open happen on click, not on every keystroke,
  // so paste-fast users don't watch a flicker.
  const [redactScan, setRedactScan] = useState<ScanResult | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);

  const chars = content.trim().length;
  const canSubmit = chars >= MIN_CONTENT_CHARS && chars <= MAX_CONTENT_CHARS;

  async function runSubmit(
    textToSubmit: string,
    trail?: RedactionTrailContext
  ) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/human-decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual', content: textToSubmit }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.id) {
        setError(data?.error ?? 'Submission failed. Please try again.');
        setSubmitting(false);
        return;
      }
      // 3.2 deep — fire-and-forget redaction trail. We attach the
      // human-decision id as the resourceId so the audit row can be
      // followed back to the submission. Originals never leave the
      // browser.
      if (trail) {
        const { placeholderEntries, ...payload } = trail;
        postRedactionTrail({
          ...payload,
          analysisId: data.id,
          source: 'dashboard_paste_human_decision',
        });
        if (placeholderEntries.length > 0) {
          savePlaceholderMap(data.id, placeholderEntries);
        }
      }
      if (onSubmitted) {
        onSubmitted(data.id);
      } else {
        router.push(`/dashboard/cognitive-audits/${data.id}`);
      }
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
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
    await runSubmit(trimmed);
  }

  // 4.2 deep — auto-submit path used by FirstRunInlineWalkthrough.
  // Fires once on mount when both initialContent and autoSubmit are set
  // and the content meets the minimum. Sample memos are pre-redacted
  // (synthetic data, no real PII) so we skip the redaction modal.
  useEffect(() => {
    if (!autoSubmit) return;
    if (!initialContent) return;
    if (initialContent.trim().length < MIN_CONTENT_CHARS) return;
    void runSubmit(initialContent.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              Same pipeline as a file upload. 60-second audit, R²F framework, signed record.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to file upload"
          className="btn btn-ghost btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <X size={14} />
          Back to upload
        </button>
      </div>

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
        placeholder="Paste your memo, board-deck excerpt, or market-entry recommendation here. Minimum 40 characters; the pipeline runs end-to-end on the content you paste."
        rows={10}
        aria-label="Memo content"
        disabled={submitting}
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="btn btn-primary btn-sm flex items-center gap-2"
            style={{ minWidth: 160 }}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Running audit…
              </>
            ) : (
              <>
                <BrainCircuit size={14} /> Run the audit
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 10,
            padding: '8px 12px',
            fontSize: 12,
            color: 'var(--error)',
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.22)',
            borderRadius: 'var(--radius-md, 8px)',
          }}
        >
          {error}
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
            await runSubmit(redacted, trail);
          }}
          onSkip={async trail => {
            const t = pendingText;
            setRedactScan(null);
            setPendingText(null);
            if (t) await runSubmit(t, trail);
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
