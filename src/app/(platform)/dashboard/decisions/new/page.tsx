'use client';

/**
 * /dashboard/decisions/new — hybrid create surface (locked 2026-05-10).
 *
 * Two paths in one page:
 *   - Document path: user uploads memo / IC deck / model / synergy
 *     spreadsheet → we create the container + attach the doc + redirect
 *     to the detail page where the audit pipeline streams live.
 *   - Manual path: user picks the mode + fills in name / decision frame /
 *     committee date → creates an empty container they'll attach docs to
 *     later.
 *
 * Replaces the prior thin-wrapper that just rendered <ContainerFormModal>
 * full-screen — that surface was both barebones (no upload entry point)
 * AND brittle (the founder hit an internal error on Create that the
 * generic /api/containers fallback obscured; that route now surfaces
 * the actual error message in development for diagnosis).
 *
 * Pipeline preview at the bottom anchors the user — the same audit runs
 * regardless of path. Constellation cross-link surfaces the "where it'll
 * fit" framing the founder asked for.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  PenLine,
  Loader2,
  Network,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  CONTAINER_MODES,
  CONTAINER_KINDS,
  type DecisionContainerKind,
} from '@/lib/data/decision-container-modes';
import { useOnboardingRole } from '@/hooks/useOnboardingRole';
import { defaultContainerKindForRole } from '@/hooks/useContainers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AccentCard } from '@/components/ui/AccentCard';
import { ContainerFormModal } from '@/components/containers/ContainerFormModal';

type Path = 'pick' | 'document' | 'manual';

// Map common upload extensions / filename hints → suggested document
// type. The bias-detective + structurer nodes use documentType to pick
// the right overlay (synergy_model / qofe / ic_memo / cim / etc.). We
// never AUTO-set the type; we only suggest it.
function suggestDocumentType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('synergy') || lower.includes('synergies')) return 'synergy_model';
  if (lower.includes('qofe') || lower.includes('quality of earnings')) return 'qofe';
  if (lower.includes('integration')) return 'integration_plan';
  if (lower.includes('ic ') || lower.includes('ic_') || lower.includes('committee'))
    return 'ic_memo';
  if (lower.includes('cim') || lower.includes('confidential information')) return 'cim';
  if (lower.includes('term') && lower.includes('sheet')) return 'term_sheet';
  if (lower.includes('pitch')) return 'pitch_deck';
  if (lower.includes('diligence') || lower.includes('dd ')) return 'due_diligence';
  return 'other';
}

// Strip a file extension off a filename so we can use it as a default
// container name (the user can override before submit).
function stripExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

export default function NewDecisionPage() {
  const router = useRouter();
  const role = useOnboardingRole();
  const defaultKind = defaultContainerKindForRole(role);

  const [path, setPath] = useState<Path>('pick');

  return (
    <ErrorBoundary sectionName="New decision">
      <div style={{ marginBottom: 12 }}>
        <Link
          href="/dashboard/decisions"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          <ChevronLeft size={12} /> Decisions
        </Link>
      </div>

      <div className="page-header" style={{ marginBottom: 8 }}>
        <h1>New decision</h1>
      </div>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--fs-sm)',
          marginBottom: 24,
          maxWidth: 720,
        }}
      >
        Start from a document and let the audit pipeline run, or set up the decision manually and
        attach documents later. Same R²F audit either way — same DPR, same DQI, same cross-doc
        conflict surfacing.
      </p>

      {path === 'pick' && (
        <PathPicker
          onPickDocument={() => setPath('document')}
          onPickManual={() => setPath('manual')}
        />
      )}

      {path === 'document' && (
        <DocumentPath
          defaultKind={defaultKind}
          onBack={() => setPath('pick')}
          onCreated={id => router.push(`/dashboard/decisions/${id}`)}
        />
      )}

      {path === 'manual' && (
        <div>
          <button
            type="button"
            onClick={() => setPath('pick')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginBottom: 16,
            }}
          >
            <ChevronLeft size={12} /> Pick a different path
          </button>
          <ContainerFormModal
            defaultKind={defaultKind}
            onClose={() => setPath('pick')}
            onCreated={id => router.push(`/dashboard/decisions/${id}`)}
          />
        </div>
      )}

      {/* Pipeline preview + constellation cross-link — anchors the user
          regardless of which path they pick. Same audit runs either way;
          the viz is a contextual reminder of what's about to happen. */}
      {path === 'pick' && <PipelinePreview />}
    </ErrorBoundary>
  );
}

// ─── Path picker ─────────────────────────────────────────────────────────

function PathPicker({
  onPickDocument,
  onPickManual,
}: {
  onPickDocument: () => void;
  onPickManual: () => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}
    >
      <PathCard
        accent="primary"
        icon={<FileText size={18} style={{ color: 'var(--accent-primary)' }} />}
        eyebrow="Recommended"
        title="Start from a document"
        description="Upload a memo, IC deck, synergy model, or CIM. The full audit pipeline kicks off automatically — biases, named patterns, DQI score, DPR — and the decision is auto-created from the analysis."
        bullets={[
          'Auto-detects document type (synergy model, QofE, IC memo, etc.)',
          'Audit pipeline streams in real time on the detail page',
          'Cross-doc conflict detection fires once a second doc is added',
        ]}
        cta="Upload + audit"
        onClick={onPickDocument}
      />

      <PathCard
        accent="info"
        icon={<PenLine size={18} style={{ color: 'var(--accent-secondary, #6366f1)' }} />}
        eyebrow="Manual setup"
        title="Set up manually"
        description="Pick the mode (investment / acquisition / strategic), name the decision, and define the committee date. Attach documents and run the audit when ready."
        bullets={[
          'Skip the audit until you have docs ready to attach',
          'Useful when the decision frame is locked but the deck is still drafting',
          'Same fields as the document path — just on your timeline',
        ]}
        cta="Set up manually"
        onClick={onPickManual}
      />
    </div>
  );
}

function PathCard({
  accent,
  icon,
  eyebrow,
  title,
  description,
  bullets,
  cta,
  onClick,
}: {
  accent: 'primary' | 'info';
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  cta: string;
  onClick: () => void;
}) {
  return (
    <AccentCard
      accent={accent}
      thickness={3}
      title={
        <>
          {icon}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 'var(--fs-3xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.10em',
                color:
                  accent === 'primary'
                    ? 'var(--accent-primary)'
                    : 'var(--accent-secondary, #6366f1)',
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              {eyebrow}
            </div>
            <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600 }}>{title}</div>
          </div>
        </>
      }
    >
      <p
        style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          marginBottom: 12,
        }}
      >
        {description}
      </p>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {bullets.map(b => (
          <li
            key={b}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              fontSize: 'var(--fs-2xs)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <CheckCircle
              size={11}
              style={{
                color:
                  accent === 'primary'
                    ? 'var(--accent-primary)'
                    : 'var(--accent-secondary, #6366f1)',
                flexShrink: 0,
                marginTop: 3,
              }}
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background:
            accent === 'primary' ? 'var(--accent-primary)' : 'var(--accent-secondary, #6366f1)',
          color: '#fff',
          border: 'none',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {cta}
        <ChevronRight size={14} />
      </button>
    </AccentCard>
  );
}

// ─── Document-driven path ────────────────────────────────────────────────

interface DocumentPathProps {
  defaultKind: DecisionContainerKind | undefined;
  onBack: () => void;
  onCreated: (containerId: string) => void;
}

function DocumentPath({ defaultKind, onBack, onCreated }: DocumentPathProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<DecisionContainerKind>(defaultKind ?? 'strategic');
  const [documentType, setDocumentType] = useState<string>('other');
  const [decisionFrame, setDecisionFrame] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Whenever a new file lands, suggest a default name + documentType.
  // The user can always override.
  useEffect(() => {
    if (file) {
      setName(prev => prev || stripExtension(file.name));
      setDocumentType(prev => (prev === 'other' ? suggestDocumentType(file.name) : prev));
    }
  }, [file]);

  const handleFile = (next: File | null) => {
    setError(null);
    setFile(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Pick a file to upload first.');
      return;
    }
    if (!name.trim()) {
      setError('Decision name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Step 1 — create the container so we have an id to attach the
      // upload to.
      const containerRes = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          name: name.trim(),
          decisionFrame: decisionFrame.trim() || null,
        }),
      });
      const containerJson = await containerRes.json();
      if (!containerRes.ok) {
        throw new Error(containerJson?.error || 'Failed to create decision');
      }
      const containerId = containerJson.id as string;

      // Step 2 — upload the doc with containerId so the join row gets
      // created + composite metrics recompute. The audit pipeline runs
      // inside /api/upload's analyze stream automatically.
      const formData = new FormData();
      formData.append('file', file);
      formData.append('containerId', containerId);
      formData.append('documentType', documentType);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok) {
        // Container exists; the user can still attach the doc later
        // from the detail page. Surface the error but redirect anyway
        // so they're not stuck.
        const uploadErr =
          uploadJson?.error ||
          `Upload failed (${uploadRes.status}). Decision created — attach the document from the detail page.`;
        setError(uploadErr);
        setTimeout(() => onCreated(containerId), 2000);
        return;
      }

      onCreated(containerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create decision');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-muted)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginBottom: 16,
        }}
      >
        <ChevronLeft size={12} /> Pick a different path
      </button>

      <AccentCard
        accent="primary"
        thickness={3}
        title={
          <>
            <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>Upload + audit</span>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {/* Drop zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '32px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(22, 163, 74, 0.04)' : 'var(--bg-secondary)',
              transition: 'border-color 0.15s, background 0.15s',
              marginBottom: 20,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.csv,.pptx,.txt,.md"
              onChange={e => handleFile(e.target.files?.[0] ?? null)}
              style={{ display: 'none' }}
            />
            {file ? (
              <div>
                <CheckCircle
                  size={20}
                  style={{
                    color: 'var(--accent-primary)',
                    margin: '0 auto 6px',
                    display: 'block',
                  }}
                />
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 2 }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB · click to change
                </div>
              </div>
            ) : (
              <div>
                <Upload
                  size={20}
                  style={{
                    color: 'var(--text-muted)',
                    margin: '0 auto 8px',
                    display: 'block',
                  }}
                />
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, marginBottom: 4 }}>
                  Drop a file here, or click to browse
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                  PDF · DOCX · XLSX · CSV · PPTX · TXT · MD
                </div>
              </div>
            )}
          </div>

          {file && (
            <>
              {/* Name + decision frame */}
              <FormField label="Decision name" required>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </FormField>

              <FormField
                label="Decision frame"
                hint="The line the committee has to vote yes/no on. Optional — derived from the audit if blank."
              >
                <textarea
                  value={decisionFrame}
                  onChange={e => setDecisionFrame(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </FormField>

              {/* Mode picker */}
              <FormField label="Mode">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 6,
                  }}
                >
                  {CONTAINER_KINDS.map(k => {
                    const m = CONTAINER_MODES[k];
                    const active = kind === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                          background: active ? 'rgba(22, 163, 74, 0.06)' : 'var(--bg-secondary)',
                          color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
                          fontSize: 'var(--fs-xs)',
                          fontWeight: active ? 600 : 500,
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </FormField>

              {/* Document-type picker */}
              <FormField
                label="Document type"
                hint="Drives the bias-detective overlay. Auto-detected from the filename — override if wrong."
              >
                <select
                  value={documentType}
                  onChange={e => setDocumentType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="other">Other / generic</option>
                  <option value="ic_memo">IC Memo</option>
                  <option value="cim">CIM (Confidential Info Memo)</option>
                  <option value="synergy_model">Synergy Model</option>
                  <option value="qofe">Quality of Earnings</option>
                  <option value="integration_plan">Integration Plan</option>
                  <option value="due_diligence">Due Diligence</option>
                  <option value="term_sheet">Term Sheet</option>
                  <option value="pitch_deck">Pitch Deck</option>
                </select>
              </FormField>
            </>
          )}

          {error && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.06)',
                color: 'var(--error)',
                fontSize: 'var(--fs-sm)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onBack} disabled={submitting} style={cancelButtonStyle}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || !name.trim() || submitting}
              style={{
                ...primaryButtonStyle,
                opacity: !file || !name.trim() || submitting ? 0.55 : 1,
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating + uploading…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Create + run audit
                </>
              )}
            </button>
          </div>
        </form>
      </AccentCard>
    </div>
  );
}

// ─── Pipeline preview + constellation cross-link ─────────────────────────

function PipelinePreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
      <AccentCard
        accent="muted"
        title={
          <>
            <Sparkles size={16} style={{ color: 'var(--text-muted)' }} />
            <span>What the audit pipeline does</span>
          </>
        }
      >
        <p
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            margin: '0 0 14px 0',
          }}
        >
          Same R²F audit fires regardless of the path you pick. The pipeline runs in 60 seconds and
          produces a hashed, tamper-evident Decision Provenance Record on every audit.
        </p>
        <PipelineSteps />
      </AccentCard>

      <AccentCard
        accent="info"
        title={
          <>
            <Network size={16} style={{ color: 'var(--accent-secondary, #6366f1)' }} />
            <span style={{ flex: 1 }}>Where it&apos;ll fit</span>
            <Link
              href="/dashboard/decisions/constellation"
              style={{
                fontSize: 11,
                color: 'var(--accent-secondary, #6366f1)',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Open constellation <ChevronRight size={12} />
            </Link>
          </>
        }
      >
        <p
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          The new decision lands on the Decision Pipeline Constellation alongside your existing
          investments, acquisitions, and strategic decisions. Once it&apos;s created, link it to a
          parent thesis (<code>spawned_from</code>) or a structural assumption (
          <code>depends_on</code>) so dependency cascades fire when the assumption shifts.
        </p>
      </AccentCard>
    </div>
  );
}

function PipelineSteps() {
  // Lightweight inline pipeline preview — text + chevrons. The full
  // 12-node viz lives on /how-it-works (marketing); this is a tighter
  // user-facing reminder of what's about to happen.
  const steps = [
    { name: 'Anonymize', detail: 'Strip PII before any LLM sees the doc' },
    { name: 'Detect biases', detail: '22-bias R²F taxonomy' },
    { name: 'Score DQI', detail: 'Composite quality grade' },
    { name: 'Cross-doc check', detail: 'Conflicts against existing docs' },
    { name: 'Sign DPR', detail: 'Hashed, tamper-evident record' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
      }}
    >
      {steps.map((step, i) => (
        <div key={step.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: 'var(--fs-2xs)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
            }}
            title={step.detail}
          >
            {i + 1}. {step.name}
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Form primitives ─────────────────────────────────────────────────────

function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 'var(--fs-2xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--error)', marginLeft: 4 }}>*</span>}
      </div>
      {children}
      {hint && (
        <p
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            marginTop: 4,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  fontFamily: 'inherit',
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  cursor: 'pointer',
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--accent-primary)',
  border: 'none',
  color: '#fff',
  fontSize: 'var(--fs-sm)',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};
