'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Brain,
  Scale,
  Shield,
  BarChart3,
  FileCheck,
  Trash2,
  Search,
  X,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Clock,
  CloudUpload,
} from 'lucide-react';
import Link from 'next/link';
import { useDocuments } from '@/hooks/useDocuments';
import { useAnalysisStream } from '@/hooks/useAnalysisStream';
import { useNotifications } from '@/components/ui/NotificationCenter';
import { useAnalysisProgress } from '@/components/ui/AnalysisProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('Dashboard');
import { RiskTrendChart } from './RiskTrendChart';
import { ComparativeAnalysis } from '@/components/visualizations/ComparativeAnalysis';
import { OnboardingGuide } from '@/components/ui/OnboardingGuide';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ANALYSIS_STEPS: { name: string; icon: React.ReactNode }[] = [
  { name: 'Preparing document', icon: <FileText size={16} /> },
  { name: 'Detecting cognitive biases', icon: <Brain size={16} /> },
  { name: 'Analyzing decision noise', icon: <Scale size={16} /> },
  { name: 'Fact checking claims', icon: <FileCheck size={16} /> },
  { name: 'Evaluating compliance', icon: <Shield size={16} /> },
  { name: 'Generating risk assessment', icon: <BarChart3 size={16} /> },
  { name: 'Finalizing report', icon: <CheckCircle size={16} /> },
];

type DashboardView = 'upload' | 'browse';

/** Map HTTP status codes and error patterns to user-friendly messages. */
function getDetailedErrorMessage(err: unknown, uploadRes?: Response | null): string {
  if (uploadRes) {
    if (uploadRes.status === 429) {
      return 'Rate limit exceeded. You can analyze up to 5 documents per hour. Please wait before trying again.';
    }
    if (uploadRes.status === 413) {
      return 'File is too large. Please upload a document under 10 MB.';
    }
    if (uploadRes.status === 415) {
      return 'Unsupported file type. Accepted formats: PDF, TXT, MD, DOCX.';
    }
    if (uploadRes.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    if (uploadRes.status >= 500) {
      return 'A server error occurred. Our team has been notified — please try again later.';
    }
  }
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Network error. Check your internet connection and try again.';
  }
  if (err instanceof Error) {
    // Pass through already-specific API messages
    if (err.message.length > 10 && err.message.length < 200) return err.message;
  }
  return 'An unexpected error occurred during document analysis.';
}

export default function Dashboard() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalDrag, setGlobalDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<'uploading' | 'analyzing'>('uploading');
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<DashboardView>('upload');
  const globalDragCounter = useRef(0);

  // Upload confirmation state
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'analyzing' | 'pending'>(
    'all'
  );
  const [showTrend, setShowTrend] = useState(false);
  const [showComparative, setShowComparative] = useState(false);
  const [docsPage, setDocsPage] = useState(1);

  // Delete confirmation state
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    docId: string;
    filename: string;
  }>({
    open: false,
    docId: '',
    filename: '',
  });
  const [deleting, setDeleting] = useState(false);

  const { addNotification } = useNotifications();
  const { startTracking, updateProgress, completeTracking, errorTracking } = useAnalysisProgress();

  // SWR: cached document list with auto-revalidation
  const {
    documents: uploadedDocs,
    total: totalDocs,
    totalPages: docsTotalPages,
    isLoading: loadingDocs,
    mutate: mutateDocs,
  } = useDocuments(true, docsPage);

  // SSE: streaming analysis with typed events, auto-retry, AbortController cleanup
  const {
    startAnalysis,
    cancelAnalysis,
    steps: analysisSteps,
    progress: currentProgress,
    timedOut: streamTimedOut,
  } = useAnalysisStream({
    stepNames: ANALYSIS_STEPS.map(s => s.name),
  });

  // Sync analysis progress to the global floating progress bar
  useEffect(() => {
    if (currentProgress > 0 && analysisSteps.length > 0) {
      const runningStep = analysisSteps.find(s => s.status === 'running');
      updateProgress(currentProgress, runningStep?.name || 'Analyzing...');
    }
  }, [currentProgress, analysisSteps, updateProgress]);

  // Auto-switch to browse view when user has documents
  useEffect(() => {
    if (uploadedDocs.length > 0 && !uploading) {
      setActiveView('upload');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global drag detection — show overlay when dragging files anywhere on the page
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      globalDragCounter.current++;
      if (e.dataTransfer?.types.includes('Files')) {
        setGlobalDrag(true);
      }
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      globalDragCounter.current--;
      if (globalDragCounter.current <= 0) {
        globalDragCounter.current = 0;
        setGlobalDrag(false);
      }
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      globalDragCounter.current = 0;
      setGlobalDrag(false);
      if (e.dataTransfer?.files.length && !uploading) {
        setPendingFile(e.dataTransfer.files[0]);
      }
    };

    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [uploading]);

  // Filtered documents based on search and status
  const filteredDocs = useMemo(() => {
    return uploadedDocs.filter(doc => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [uploadedDocs, searchQuery, statusFilter]);

  // Delete document handler — uses SWR mutate for cache invalidation
  const handleDelete = async () => {
    if (!deleteModal.docId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteModal.docId}`, { method: 'DELETE' });
      if (res.ok) {
        // Optimistically remove from cache, then revalidate
        await mutateDocs(
          current =>
            current
              ? { ...current, documents: current.documents.filter(d => d.id !== deleteModal.docId) }
              : current,
          { revalidate: true }
        );
        setDeleteModal({ open: false, docId: '', filename: '' });
      } else {
        setError('Failed to delete document');
      }
    } catch (err) {
      log.error('Delete failed:', err);
      setError('Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const uploadAndAnalyze = async (file: File) => {
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    setUploadPhase('uploading');

    // Default empty state when SWR cache is undefined (e.g. if the
    // initial fetch failed due to schema drift or network error).
    // Declared outside try/catch so the catch handler can reference it.
    const emptyState = { documents: [], total: 0, page: 1, totalPages: 1 };

    try {
      // Upload file with XHR for progress tracking
      const formData = new FormData();
      formData.append('file', file);

      const uploadData = await new Promise<{ id: string; filename: string; cached?: boolean }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/upload');

          xhr.upload.onprogress = e => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                reject(new Error('Invalid server response'));
              }
            } else {
              let errorMessage: string | undefined;
              try {
                const data = JSON.parse(xhr.responseText);
                errorMessage = data.error;
              } catch {
                /* use status-based message */
              }
              const fakeRes = { status: xhr.status } as Response;
              reject(new Error(errorMessage || getDetailedErrorMessage(null, fakeRes)));
            }
          };

          xhr.onerror = () => reject(new TypeError('Failed to fetch'));
          xhr.send(formData);
        }
      );

      setUploadPhase('analyzing');
      setUploadProgress(0);

      // If the server returned a cached result, skip streaming and
      // directly revalidate the SWR cache so the existing document
      // (with its completed analysis) appears immediately.
      if (uploadData.cached) {
        await mutateDocs(undefined, { revalidate: true });
        return;
      }

      // Optimistically add to SWR cache with analyzing status.
      await mutateDocs(
        current => {
          const base = current ?? emptyState;
          return {
            ...base,
            documents: [
              {
                id: uploadData.id,
                filename: uploadData.filename,
                status: 'analyzing',
                uploadedAt: new Date().toISOString(),
              },
              ...base.documents,
            ],
          };
        },
        { revalidate: false }
      );

      // Stream analysis via the hook (auto-retry, typed events, AbortController cleanup)
      startTracking(uploadData.id, uploadData.filename);
      const finalResult = await startAnalysis(uploadData.id);

      if (finalResult) {
        const score = finalResult?.overallScore as number;
        completeTracking(uploadData.id);
        addNotification({
          type: score < 40 ? 'low_score' : 'analysis_complete',
          title: score < 40 ? 'Low Score Alert' : 'Analysis Complete',
          message: `${uploadData.filename} scored ${score}/100`,
          href: `/documents/${uploadData.id}`,
        });
        // Update SWR cache with the completed result
        await mutateDocs(
          current => {
            const base = current ?? emptyState;
            return {
              ...base,
              documents: base.documents.map(doc =>
                doc.id === uploadData.id ? { ...doc, status: 'complete', score } : doc
              ),
            };
          },
          { revalidate: true }
        );
      } else {
        // Stream ended without a result (timeout, disconnect, or error).
        // Always revalidate so the SWR cache picks up whatever state the
        // server left the document in (complete, error, or still analyzing).
        await mutateDocs(undefined, { revalidate: true });
      }
    } catch (err) {
      log.error('Upload/Analysis error:', err instanceof Error ? err.message : 'Unknown error');
      setError(getDetailedErrorMessage(err));
      errorTracking();

      // Mark as error in SWR cache and revalidate to sync with server state
      await mutateDocs(
        current => {
          const base = current ?? emptyState;
          return {
            ...base,
            documents: base.documents.map(doc =>
              doc.status === 'analyzing' ? { ...doc, status: 'error' } : doc
            ),
          };
        },
        { revalidate: true }
      );
    } finally {
      setUploading(false);
    }
  };

  const retryAnalysis = async (docId: string) => {
    setError(null);
    setUploading(true);
    const emptyState = { documents: [], total: 0, page: 1, totalPages: 1 };

    try {
      await mutateDocs(
        current => {
          const base = current ?? emptyState;
          return {
            ...base,
            documents: base.documents.map(doc =>
              doc.id === docId ? { ...doc, status: 'analyzing' } : doc
            ),
          };
        },
        { revalidate: false }
      );

      const retryDoc = uploadedDocs.find(d => d.id === docId);
      startTracking(docId, retryDoc?.filename || 'Document');
      const finalResult = await startAnalysis(docId);

      if (finalResult) {
        const retryScore = finalResult?.overallScore as number;
        completeTracking(docId);
        addNotification({
          type: retryScore < 40 ? 'low_score' : 'analysis_complete',
          title: retryScore < 40 ? 'Low Score Alert' : 'Analysis Complete',
          message: `${retryDoc?.filename || 'Document'} scored ${retryScore}/100`,
          href: `/documents/${docId}`,
        });
        await mutateDocs(
          current => {
            const base = current ?? emptyState;
            return {
              ...base,
              documents: base.documents.map(doc =>
                doc.id === docId ? { ...doc, status: 'complete', score: retryScore } : doc
              ),
            };
          },
          { revalidate: true }
        );
      } else {
        await mutateDocs(undefined, { revalidate: true });
      }
    } catch (err) {
      log.error('Retry analysis error:', err instanceof Error ? err.message : 'Unknown error');
      setError(getDetailedErrorMessage(err));
      errorTracking();
      await mutateDocs(undefined, { revalidate: true });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setPendingFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setPendingFile(files[0]);
    }
    // Reset so the same file can be re-selected (otherwise onChange won't fire)
    e.target.value = '';
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    const file = pendingFile;
    setPendingFile(null);
    await uploadAndAnalyze(file);
  };

  return (
    <div
      className="container"
      style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}
    >
      {/* Header with view tabs */}
      <div className="flex items-center justify-between mb-xl">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
            Dashboard
          </span>
        </h1>
        <div className="flex items-center gap-xs border border-border p-1">
          <button
            onClick={() => setActiveView('upload')}
            className={`px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-sm ${
              activeView === 'upload'
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-muted hover:text-primary'
            }`}
          >
            <Upload size={14} />
            Upload &amp; Monitor
          </button>
          <button
            onClick={() => setActiveView('browse')}
            className={`px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-sm ${
              activeView === 'browse'
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-muted hover:text-primary'
            }`}
          >
            <Search size={14} />
            Browse &amp; Analyze
          </button>
        </div>
      </div>

      {/* Stats overview row */}
      {uploadedDocs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
          {[
            {
              label: 'Total Documents',
              value: totalDocs,
              icon: <FileText size={16} />,
              iconBg: 'rgba(99, 102, 241, 0.1)',
              iconColor: 'var(--accent-primary)',
            },
            {
              label: 'Analyzed',
              value: uploadedDocs.filter(d => d.status === 'complete').length,
              icon: <CheckCircle size={16} />,
              iconBg: 'rgba(34, 197, 94, 0.1)',
              iconColor: 'var(--success)',
            },
            {
              label: 'Avg Quality',
              value: (() => {
                const scored = uploadedDocs.filter(d => d.score !== undefined);
                return scored.length
                  ? `${Math.round(scored.reduce((a, d) => a + (d.score || 0), 0) / scored.length)}%`
                  : '—';
              })(),
              icon: <TrendingUp size={16} />,
              iconBg: 'rgba(245, 158, 11, 0.1)',
              iconColor: 'var(--warning)',
            },
            {
              label: 'In Progress',
              value: uploadedDocs.filter(d => d.status === 'analyzing' || d.status === 'pending')
                .length,
              icon: <Clock size={16} />,
              iconBg: 'rgba(129, 140, 248, 0.1)',
              iconColor: 'var(--accent-secondary)',
            },
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <div
                className="stat-card-icon"
                style={{ background: stat.iconBg, color: stat.iconColor }}
              >
                {stat.icon}
              </div>
              <div className="stat-card-value">{stat.value}</div>
              <div className="stat-card-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Stream timed out banner */}
      {streamTimedOut && !uploading && (
        <div className="mb-lg p-md bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-sm">
          <AlertTriangle size={18} className="text-warning shrink-0" />
          <span className="text-warning text-sm">
            Analysis is taking longer than expected. The server may still be processing — refresh
            the page or try again.
          </span>
        </div>
      )}

      {/* Error Message - Compact */}
      {error && (
        <div className="mb-lg p-md bg-error/10 border border-error/30 rounded-lg flex items-center gap-sm">
          <AlertTriangle size={18} className="text-error shrink-0" />
          <span className="text-error text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-error/60 hover:text-error">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ═══════ UPLOAD & MONITOR VIEW ═══════ */}
      {activeView === 'upload' && (
        <>
          {/* Onboarding Guide for new users */}
          <OnboardingGuide />

          {/* Upload Confirmation Modal */}
          {pendingFile && !uploading && (
            <div className="card mb-xl border-accent-primary/40 animate-fade-in">
              <div className="card-header" style={{ background: 'rgba(99, 102, 241, 0.06)' }}>
                <h3 className="flex items-center gap-sm text-sm">
                  <FileText size={16} className="text-accent-primary" />
                  Ready to Analyze
                </h3>
              </div>
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-md">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <FileText size={24} className="text-accent-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{pendingFile.name}</p>
                      <p className="text-xs text-muted">
                        {(pendingFile.size / 1024).toFixed(1)} KB ·{' '}
                        {pendingFile.type || pendingFile.name.split('.').pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-sm">
                    <button onClick={() => setPendingFile(null)} className="btn btn-ghost text-sm">
                      Cancel
                    </button>
                    <button
                      onClick={confirmUpload}
                      className="btn btn-primary flex items-center gap-sm"
                    >
                      <Brain size={16} />
                      Start Analysis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Zone - Enhanced with drag feedback */}
          {!uploading && !pendingFile ? (
            <div
              className={`upload-zone mb-xl ${isDragOver ? 'dragover' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload document. Drop a file or click to browse."
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ')
                  document.getElementById('file-input')?.click();
              }}
            >
              <input
                type="file"
                id="file-input"
                hidden
                accept=".pdf,.txt,.md,.docx"
                disabled={uploading}
                onChange={handleFileSelect}
              />
              <div className="flex items-center gap-md">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-lg)',
                    background: isDragOver
                      ? 'rgba(99, 102, 241, 0.15)'
                      : 'rgba(99, 102, 241, 0.08)',
                    border: `1px solid ${isDragOver ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.15)'}`,
                    transition: 'all 0.2s ease',
                    transform: isDragOver ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {isDragOver ? (
                    <CloudUpload size={24} className="text-accent-primary" />
                  ) : (
                    <Upload size={24} className="text-accent-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {isDragOver ? 'Drop to upload' : 'Drop document here or click to browse'}
                  </p>
                  <p className="text-sm text-muted">PDF, TXT, MD, DOCX · Max 10 MB</p>
                </div>
              </div>
            </div>
          ) : uploading ? (
            <div className="card mb-xl">
              <div className="card-body">
                {/* Progress Header — two-phase: uploading then analyzing */}
                <div className="flex items-center justify-between mb-md">
                  <div className="flex items-center gap-sm">
                    {uploadPhase === 'uploading' ? (
                      <CloudUpload size={16} className="text-accent-primary" />
                    ) : (
                      <Loader2 size={16} className="animate-spin text-accent-primary" />
                    )}
                    <span className="text-sm font-medium">
                      {uploadPhase === 'uploading'
                        ? 'Uploading document...'
                        : 'Analyzing document...'}
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {uploadPhase === 'uploading' ? `${uploadProgress}%` : `${currentProgress}%`}
                  </span>
                </div>

                {/* Progress Bar - Enhanced */}
                <div className="progress-bar mb-md">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${uploadPhase === 'uploading' ? uploadProgress : currentProgress}%`,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                {/* Phase indicator */}
                <div className="flex items-center gap-md mb-md text-xs text-muted">
                  <span
                    className={
                      uploadPhase === 'uploading'
                        ? 'text-accent-primary font-medium'
                        : 'text-success'
                    }
                  >
                    {uploadPhase === 'analyzing' ? '✓ ' : ''}Upload
                  </span>
                  <span style={{ color: 'var(--border-hover)' }}>→</span>
                  <span
                    className={uploadPhase === 'analyzing' ? 'text-accent-primary font-medium' : ''}
                  >
                    Analysis
                  </span>
                </div>

                {/* Analysis Steps */}
                <div className="grid grid-cols-3 md:grid-cols-7 gap-xs mt-md">
                  {analysisSteps.map((step, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-1 text-center"
                      title={step.name}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 'var(--radius-full)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background:
                            step.status === 'complete'
                              ? 'rgba(34, 197, 94, 0.15)'
                              : step.status === 'running'
                                ? 'rgba(99, 102, 241, 0.15)'
                                : 'var(--bg-tertiary)',
                          border: `1px solid ${
                            step.status === 'complete'
                              ? 'rgba(34, 197, 94, 0.3)'
                              : step.status === 'running'
                                ? 'rgba(99, 102, 241, 0.4)'
                                : 'var(--border-color)'
                          }`,
                          transition: 'all var(--transition-normal)',
                        }}
                      >
                        {step.status === 'complete' ? (
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                        ) : step.status === 'running' ? (
                          <Loader2
                            size={14}
                            className="animate-spin"
                            style={{ color: 'var(--accent-primary)' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: 'var(--border-hover)',
                            }}
                          />
                        )}
                      </div>
                      <span
                        className="text-xs text-muted hidden md:block"
                        style={{ lineHeight: 1.2, maxWidth: 60 }}
                      >
                        {ANALYSIS_STEPS[i]?.name.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Cancel */}
                <div className="flex justify-end mt-md">
                  <button
                    onClick={() => {
                      cancelAnalysis();
                      setUploading(false);
                    }}
                    className="text-xs text-muted hover:text-error transition-colors"
                  >
                    Cancel analysis
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Currently Analyzing Section */}
          {uploadedDocs.filter(d => d.status === 'analyzing').length > 0 && (
            <div className="mb-xl">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-md">
                <Loader2 size={18} className="animate-spin text-accent-primary" />
                Currently Analyzing
              </h2>
              <div className="space-y-3">
                {uploadedDocs
                  .filter(d => d.status === 'analyzing')
                  .map(doc => (
                    <div
                      key={doc.id}
                      className="card border-accent-primary/30"
                      style={{ background: 'rgba(99, 102, 241, 0.04)' }}
                    >
                      <div className="card-body flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 'var(--radius-md)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(99, 102, 241, 0.1)',
                            }}
                          >
                            <FileText size={18} className="text-accent-primary" />
                          </div>
                          <div>
                            <span className="font-medium text-sm">{doc.filename}</span>
                            <p className="text-xs text-muted mt-0.5">
                              Analysis in progress — results will appear when complete
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar" style={{ width: 80 }}>
                            <div
                              className="progress-bar-fill animate-pulse"
                              style={{ width: '60%' }}
                            />
                          </div>
                          <Loader2
                            size={16}
                            className="animate-spin text-accent-primary shrink-0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Recent Analyses Section */}
          {uploadedDocs.filter(d => d.status === 'complete').length > 0 && (
            <div className="mb-xl">
              <div className="flex items-center justify-between mb-md">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-500" />
                  Recent Analyses
                </h2>
                <button
                  onClick={() => setActiveView('browse')}
                  className="text-sm text-accent-primary hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedDocs
                  .filter(d => d.status === 'complete')
                  .slice(0, 6)
                  .map(doc => (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="card group hover:border-accent-primary/50 transition-all"
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="card-body">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                flexShrink: 0,
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(99, 102, 241, 0.1)',
                              }}
                            >
                              <FileText size={16} className="text-accent-primary" />
                            </div>
                            <span className="font-medium text-sm truncate max-w-[130px]">
                              {doc.filename}
                            </span>
                          </div>
                          {doc.score !== undefined && (
                            <span
                              className="text-sm font-bold shrink-0 ml-2"
                              style={{
                                color:
                                  doc.score >= 70
                                    ? 'var(--success)'
                                    : doc.score >= 40
                                      ? 'var(--warning)'
                                      : 'var(--error)',
                              }}
                            >
                              {Math.round(doc.score)}%
                            </span>
                          )}
                        </div>
                        {doc.score !== undefined && (
                          <div className="progress-bar mb-2">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${doc.score}%`,
                                background:
                                  doc.score >= 70
                                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                    : doc.score >= 40
                                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                      : 'linear-gradient(90deg, #ef4444, #dc2626)',
                              }}
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1 group-hover:text-accent-primary transition-colors">
                            View Analysis <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* Empty state - only show when no documents */}
          {uploadedDocs.length === 0 && !loadingDocs && (
            <div className="card">
              <EmptyState
                icon={Upload}
                title="Upload your first document"
                description="Drop a PDF, TXT, MD, or DOCX file in the upload zone above. Our AI will scan for cognitive biases, decision noise, logical fallacies, and compliance risks."
                badges={['Bias Detection', 'Noise Analysis', 'Fact Checking', 'Compliance']}
                action={{
                  label: 'Choose a File',
                  onClick: () => document.getElementById('file-input')?.click(),
                  icon: Upload,
                }}
              />
            </div>
          )}
        </>
      )}

      {/* ═══════ BROWSE & ANALYZE VIEW ═══════ */}
      {activeView === 'browse' && (
        <>
          {/* Risk Trend - Collapsible (collapsed by default) */}
          {uploadedDocs.some(d => d.score !== undefined) && (
            <div className="card mb-xl">
              <button
                onClick={() => setShowTrend(prev => !prev)}
                className="w-full card-header flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h3 className="flex items-center gap-2 text-base">
                  <BarChart3 size={18} className="text-indigo-500" />
                  Decision Quality Trend
                  <span className="text-xs text-muted font-normal">
                    ({uploadedDocs.filter(d => d.score !== undefined).length} analyzed)
                  </span>
                </h3>
                <ChevronRight
                  size={18}
                  className={`text-muted transition-transform ${showTrend ? 'rotate-90' : ''}`}
                />
              </button>
              {showTrend && (
                <div className="card-body pt-0">
                  <ErrorBoundary sectionName="Risk Trend Chart">
                    <RiskTrendChart
                      data={[...uploadedDocs]
                        .filter(d => d.score !== undefined)
                        .sort(
                          (a, b) =>
                            new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
                        )
                        .map(d => ({
                          date: new Date(d.uploadedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          }),
                          score: d.score || 0,
                        }))}
                    />
                  </ErrorBoundary>
                </div>
              )}
            </div>
          )}

          {/* Comparative Analysis - Collapsible (collapsed by default) */}
          {uploadedDocs.filter(d => d.status === 'complete').length > 1 && (
            <div className="card mb-xl">
              <button
                onClick={() => setShowComparative(prev => !prev)}
                className="w-full card-header flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h3 className="flex items-center gap-2 text-base">
                  <Scale size={18} className="text-indigo-500" />
                  Comparative Intelligence
                  <span className="text-xs text-muted font-normal">Document Benchmark</span>
                </h3>
                <ChevronRight
                  size={18}
                  className={`text-muted transition-transform ${showComparative ? 'rotate-90' : ''}`}
                />
              </button>
              {showComparative && (
                <div className="card-body">
                  <ErrorBoundary sectionName="Comparative Analysis">
                    <ComparativeAnalysis
                      documents={uploadedDocs
                        .filter(d => d.status === 'complete')
                        .map(doc => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- detailed view returns analyses array
                          const a = (doc as any).analyses?.[0];
                          const biasCount = a?.biases?.length ?? 0;
                          const noiseScore = a?.noiseScore ?? 50;
                          return {
                            id: doc.id,
                            title: doc.filename,
                            date: new Date(doc.uploadedAt).toLocaleDateString(),
                            scores: {
                              quality: doc.score || 0,
                              risk: doc.score ? 100 - doc.score : 50,
                              bias: Math.min(biasCount * 10, 100),
                              clarity: Math.max(0, 100 - noiseScore),
                            },
                          };
                        })}
                    />
                  </ErrorBoundary>
                </div>
              )}
            </div>
          )}

          {/* Documents List */}
          <div id="documents" className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-md">
                <h3 className="text-base">Documents</h3>
                {totalDocs > 0 && (
                  <span className="text-xs text-muted">
                    {filteredDocs.length} shown · {totalDocs} total
                  </span>
                )}
              </div>

              {/* Compact Search & Filter */}
              <div className="flex items-center gap-sm">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    aria-label="Search documents"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setDocsPage(1);
                    }}
                    className="pl-8 pr-7 py-1.5 text-sm bg-primary border border-border w-40 focus:w-56 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  aria-label="Filter by status"
                  onChange={e => {
                    setStatusFilter(e.target.value as 'all' | 'complete' | 'analyzing' | 'pending');
                    setDocsPage(1);
                  }}
                  className="px-3 py-1.5 text-sm bg-primary border border-border"
                >
                  <option value="all">All Status</option>
                  <option value="complete">Complete</option>
                  <option value="analyzing">Analyzing</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="card-body p-0">
              {loadingDocs ? (
                <div className="divide-y divide-border">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-md animate-pulse">
                      <div className="flex items-center gap-md">
                        <div className="w-5 h-5 bg-white/10" />
                        <div className="h-4 w-48 bg-white/10" />
                      </div>
                      <div className="flex items-center gap-md">
                        <div className="h-3 w-20 bg-white/10" />
                        <div className="h-7 w-24 bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : uploadedDocs.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documents yet"
                  description="Upload a document to start analyzing for biases, noise, and compliance risks."
                  action={{
                    label: 'Go to Upload',
                    onClick: () => setActiveView('upload'),
                    icon: Upload,
                  }}
                />
              ) : filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center gap-sm p-xl text-center">
                  <Search size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                  <p className="text-sm text-muted">No matches found</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="btn btn-ghost text-sm"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredDocs.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-md hover:bg-secondary/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <div className="flex items-center gap-md min-w-0">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(99, 102, 241, 0.08)',
                          }}
                        >
                          <FileText size={16} className="text-accent-primary" />
                        </div>
                        <span className="truncate text-sm font-medium">{doc.filename}</span>
                      </div>

                      <div className="flex items-center gap-md shrink-0">
                        {doc.status === 'analyzing' && (
                          <span className="flex items-center gap-sm text-xs text-muted">
                            <Loader2 size={12} className="animate-spin" />
                            Analyzing
                          </span>
                        )}

                        {(doc.status === 'error' || doc.status === 'pending') && (
                          <div className="flex items-center gap-sm">
                            {doc.status === 'error' && (
                              <span className="badge badge-critical">Failed</span>
                            )}
                            {doc.status === 'pending' && (
                              <span className="text-xs text-muted">Pending</span>
                            )}
                            <button
                              onClick={() => retryAnalysis(doc.id)}
                              disabled={uploading}
                              className="btn btn-ghost btn-sm flex items-center gap-1 text-xs"
                            >
                              <RefreshCw size={12} />
                              {doc.status === 'error' ? 'Retry' : 'Analyze'}
                            </button>
                          </div>
                        )}

                        {doc.status === 'complete' && (
                          <>
                            {doc.score !== undefined && (
                              <div className="flex items-center gap-2">
                                <div className="progress-bar" style={{ width: 64 }}>
                                  <div
                                    className="progress-bar-fill"
                                    style={{
                                      width: `${doc.score}%`,
                                      background:
                                        doc.score >= 70
                                          ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                          : doc.score >= 40
                                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                            : 'linear-gradient(90deg, #ef4444, #dc2626)',
                                    }}
                                  />
                                </div>
                                <span
                                  className="text-sm font-bold min-w-[36px]"
                                  style={{
                                    color:
                                      doc.score >= 70
                                        ? 'var(--success)'
                                        : doc.score >= 40
                                          ? 'var(--warning)'
                                          : 'var(--error)',
                                  }}
                                >
                                  {Math.round(doc.score)}%
                                </span>
                              </div>
                            )}
                            <Link
                              href={`/documents/${doc.id}`}
                              className="btn btn-primary btn-sm flex items-center gap-2"
                            >
                              <BarChart3 size={14} />
                              View Analysis
                            </Link>
                          </>
                        )}

                        <button
                          onClick={() =>
                            setDeleteModal({ open: true, docId: doc.id, filename: doc.filename })
                          }
                          className="p-1.5 text-muted hover:text-error transition-colors rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Documents Paginator */}
          {docsTotalPages > 1 && (
            <div className="flex items-center justify-center gap-sm mt-md">
              <button
                onClick={() => setDocsPage(p => Math.max(1, p - 1))}
                disabled={docsPage <= 1}
                className="btn btn-ghost text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {docsPage} of {docsTotalPages}
              </span>
              <button
                onClick={() => setDocsPage(p => Math.min(docsTotalPages, p + 1))}
                disabled={docsPage >= docsTotalPages}
                className="btn btn-ghost text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {/* Global drag overlay — appears when dragging files anywhere on the page */}
      {globalDrag && !uploading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(8, 11, 18, 0.85)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--spacing-lg)',
              padding: 'var(--spacing-2xl)',
              border: '2px dashed var(--accent-primary)',
              borderRadius: 'var(--radius-xl)',
              background: 'rgba(99, 102, 241, 0.06)',
            }}
          >
            <CloudUpload size={48} style={{ color: 'var(--accent-primary)' }} />
            <div className="text-center">
              <p className="font-semibold text-lg">Drop your document here</p>
              <p className="text-sm text-muted mt-1">PDF, TXT, MD, DOCX · Max 10 MB</p>
            </div>
          </div>
        </div>
      )}

      {deleteModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete document confirmation"
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 modal-overlay"
          onClick={() => {
            if (!deleting) setDeleteModal({ open: false, docId: '', filename: '' });
          }}
          onKeyDown={e => {
            if (e.key === 'Escape' && !deleting)
              setDeleteModal({ open: false, docId: '', filename: '' });
          }}
        >
          <div
            className="card w-full max-w-sm mx-4 modal-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="card-body">
              <div className="flex items-start gap-sm mb-lg">
                <AlertTriangle size={20} className="text-error shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-xs">Delete Document?</h3>
                  <p className="text-sm text-muted">
                    {deleteModal.filename} will be permanently removed.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-sm">
                <button
                  onClick={() => setDeleteModal({ open: false, docId: '', filename: '' })}
                  className="btn btn-ghost text-sm"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn bg-error text-white text-sm"
                  disabled={deleting}
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
