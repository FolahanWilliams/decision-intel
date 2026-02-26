'use client';

import { useState, useCallback, useMemo } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, Loader2, Brain, Scale, Shield, BarChart3, FileCheck, Trash2, Search, X, ChevronRight, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useDocuments } from '@/hooks/useDocuments';
import { useAnalysisStream } from '@/hooks/useAnalysisStream';
import { RiskTrendChart } from './RiskTrendChart';
import { ComparativeAnalysis } from '@/components/visualizations/ComparativeAnalysis';
import { OnboardingGuide } from '@/components/ui/OnboardingGuide';


const ANALYSIS_STEPS: { name: string; icon: React.ReactNode }[] = [
  { name: 'Preparing document', icon: <FileText size={16} /> },
  { name: 'Detecting cognitive biases', icon: <Brain size={16} /> },
  { name: 'Analyzing decision noise', icon: <Scale size={16} /> },
  { name: 'Fact checking claims', icon: <FileCheck size={16} /> },
  { name: 'Evaluating compliance', icon: <Shield size={16} /> },
  { name: 'Generating risk assessment', icon: <BarChart3 size={16} /> },
  { name: 'Finalizing report', icon: <CheckCircle size={16} /> },
];

export default function Dashboard() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'analyzing' | 'pending'>('all');
  const [showTrend, setShowTrend] = useState(false);
  const [docsPage, setDocsPage] = useState(1);

  // Delete confirmation state
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; docId: string; filename: string }>({
    open: false, docId: '', filename: ''
  });
  const [deleting, setDeleting] = useState(false);

  // SWR: cached document list with auto-revalidation
  const { documents: uploadedDocs, total: totalDocs, totalPages: docsTotalPages, isLoading: loadingDocs, mutate: mutateDocs } = useDocuments(true, docsPage);

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
          (current) => current ? { ...current, documents: current.documents.filter(d => d.id !== deleteModal.docId) } : current,
          { revalidate: true }
        );
        setDeleteModal({ open: false, docId: '', filename: '' });
      } else {
        setError('Failed to delete document');
      }
    } catch (err) {
      console.error('Delete failed:', err);
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

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        let errorMessage;
        try {
          const errorText = await uploadRes.text();
          try {
            const data = JSON.parse(errorText);
            errorMessage = data.error;
          } catch {
            errorMessage = errorText;
          }
        } catch {
          errorMessage = 'Failed to read error response';
        }
        throw new Error(errorMessage || 'Upload failed');
      }

      const uploadData = await uploadRes.json();

      // Use a default empty state when current is undefined (e.g. if
      // the initial fetch failed due to schema drift or network error).
      const emptyState = { documents: [], total: 0, page: 1, totalPages: 1 };

      // If the server returned a cached result, skip streaming and
      // directly revalidate the SWR cache so the existing document
      // (with its completed analysis) appears immediately.
      if (uploadData.cached) {
        await mutateDocs(undefined, { revalidate: true });
        return;
      }

      // Optimistically add to SWR cache with analyzing status.
      await mutateDocs(
        (current) => {
          const base = current ?? emptyState;
          return { ...base, documents: [{ id: uploadData.id, filename: uploadData.filename, status: 'analyzing', uploadedAt: new Date().toISOString() }, ...base.documents] };
        },
        { revalidate: false }
      );

      // Stream analysis via the hook (auto-retry, typed events, AbortController cleanup)
      const finalResult = await startAnalysis(uploadData.id);

      if (finalResult) {
        // Update SWR cache with the completed result
        await mutateDocs(
          (current) => {
            const base = current ?? emptyState;
            return { ...base, documents: base.documents.map(doc => doc.id === uploadData.id ? { ...doc, status: 'complete', score: finalResult?.overallScore as number } : doc) };
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
      console.error('Upload/Analysis error:', err instanceof Error ? err.message : 'Unknown error');
      setError(err instanceof Error ? err.message : 'An error occurred during document analysis');

      // Mark as error in SWR cache and revalidate to sync with server state
      await mutateDocs(
        (current) => {
          if (!current) return current;
          return { ...current, documents: current.documents.map(doc => doc.status === 'analyzing' ? { ...doc, status: 'error' } : doc) };
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
        (current) => {
          const base = current ?? emptyState;
          return { ...base, documents: base.documents.map(doc => doc.id === docId ? { ...doc, status: 'analyzing' } : doc) };
        },
        { revalidate: false }
      );

      const finalResult = await startAnalysis(docId);

      if (finalResult) {
        await mutateDocs(
          (current) => {
            const base = current ?? emptyState;
            return { ...base, documents: base.documents.map(doc => doc.id === docId ? { ...doc, status: 'complete', score: finalResult?.overallScore as number } : doc) };
          },
          { revalidate: true }
        );
      } else {
        await mutateDocs(undefined, { revalidate: true });
      }
    } catch (err) {
      console.error('Retry analysis error:', err instanceof Error ? err.message : 'Unknown error');
      setError(err instanceof Error ? err.message : 'An error occurred during document analysis');
      await mutateDocs(undefined, { revalidate: true });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadAndAnalyze(files[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadAndAnalyze(files[0]);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
      {/* Simple Header */}
      <div className="mb-xl">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
            Dashboard
          </span>
        </h1>
      </div>

      {/* Onboarding Guide for new users */}
      <OnboardingGuide />

      {/* Upload Zone - Compact */}
      {!uploading ? (
        <div
          className={`upload-zone mb-xl ${isDragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            type="file"
            id="file-input"
            hidden
            accept=".pdf,.txt,.md,.docx"
            onChange={handleFileSelect}
          />
          <div className="flex items-center gap-md">
            <Upload size={32} className="text-accent-primary" />
            <div>
              <p className="font-medium">Drop document here or click to browse</p>
              <p className="text-sm text-muted">PDF, TXT, MD, DOCX</p>
            </div>
          </div>
        </div>
      ) : (
        /* Analysis Progress - Compact */
        <div className="card mb-xl">
          <div className="card-body">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-md">
              <span className="text-sm font-medium">Analyzing document...</span>
              <span className="text-sm text-muted">{currentProgress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-secondary rounded-full overflow-hidden mb-md">
              <div
                className="h-full bg-accent-primary transition-all duration-300"
                style={{ width: `${currentProgress}%` }}
              />
            </div>

            {/* Current Step + Cancel */}
            <div className="flex items-center justify-between">
              {analysisSteps.find(s => s.status === 'running') && (
                <div className="flex items-center gap-sm text-sm">
                  <Loader2 size={14} className="animate-spin text-accent-primary" />
                  <span>{analysisSteps.find(s => s.status === 'running')?.name}</span>
                </div>
              )}
              <button
                onClick={() => { cancelAnalysis(); setUploading(false); }}
                className="text-xs text-muted hover:text-error transition-colors ml-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream timed out banner */}
      {streamTimedOut && !uploading && (
        <div className="mb-lg p-md rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-sm">
          <AlertTriangle size={18} className="text-yellow-500 shrink-0" />
          <span className="text-yellow-400 text-sm">
            Analysis is taking longer than expected. The server may still be processing — refresh the page or try again.
          </span>
        </div>
      )}

      {/* Error Message - Compact */}
      {error && (
        <div className="mb-lg p-md rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-sm">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500/60 hover:text-red-500"
          >
            <X size={16} />
          </button>
        </div>
      )}

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
              .map((doc) => (
                <div
                  key={doc.id}
                  className="card border-accent-primary/30 bg-accent-primary/5"
                >
                  <div className="card-body flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-accent-primary" />
                      <div>
                        <span className="font-medium">{doc.filename}</span>
                        <p className="text-xs text-muted mt-0.5">
                          Analysis in progress... Results will appear here when complete
                        </p>
                      </div>
                    </div>
                    <Loader2 size={18} className="animate-spin text-accent-primary" />
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
            <Link
              href="#documents"
              className="text-sm text-accent-primary hover:underline flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedDocs
              .filter(d => d.status === 'complete')
              .slice(0, 6)
              .map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="card group hover:border-accent-primary transition-all"
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-accent-primary" />
                        <span className="font-medium text-sm truncate max-w-[150px]">
                          {doc.filename}
                        </span>
                      </div>
                      {doc.score !== undefined && (
                        <span
                          className="text-sm font-bold"
                          style={{
                            color: doc.score >= 70 ? 'var(--success)' : doc.score >= 40 ? 'var(--warning)' : 'var(--error)'
                          }}
                        >
                          {Math.round(doc.score)}%
                        </span>
                      )}
                    </div>
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

      {/* Risk Trend - Collapsible */}
      {uploadedDocs.some(d => d.score !== undefined) && (
        <div className="card mb-xl">
          <button
            onClick={() => setShowTrend(!showTrend)}
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
              <RiskTrendChart data={[...uploadedDocs]
                .filter(d => d.score !== undefined)
                .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
                .map(d => ({
                  date: new Date(d.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  score: d.score || 0
                }))
              } />
            </div>
          )}
        </div>
      )}

      {/* Comparative Analysis */}
      {uploadedDocs.filter(d => d.status === 'complete').length > 1 && (
        <div className="mb-xl">
          <div className="flex items-center justify-between mb-md">
            <h2 className="text-lg font-semibold">Comparative Intelligence</h2>
          </div>
          <div className="card">
            <div className="card-header">
              <h3>Document Benchmark</h3>
            </div>
            <div className="card-body">
              <ComparativeAnalysis documents={uploadedDocs.filter(d => d.status === 'complete').map(doc => {
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
                    risk: doc.score ? (100 - doc.score) : 50,
                    bias: Math.min(biasCount * 10, 100),
                    clarity: Math.max(0, 100 - noiseScore)
                  }
                };
              })} />
            </div>
          </div>
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
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search..."
                aria-label="Search documents"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setDocsPage(1); }}
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
              onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'complete' | 'analyzing' | 'pending'); setDocsPage(1); }}
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
                    <div className="w-5 h-5 rounded bg-white/10" />
                    <div className="h-4 w-48 rounded bg-white/10" />
                  </div>
                  <div className="flex items-center gap-md">
                    <div className="h-3 w-20 rounded bg-white/10" />
                    <div className="h-7 w-24 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : uploadedDocs.length === 0 ? (
            <div className="text-center text-muted p-xl">
              No documents yet
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center text-muted p-xl">
              No matches found
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
                    <FileText size={18} className="text-accent-primary shrink-0" />
                    <span className="truncate">{doc.filename}</span>
                  </div>

                  <div className="flex items-center gap-md shrink-0">
                    {doc.status === 'analyzing' && (
                      <span className="flex items-center gap-sm text-sm text-muted">
                        <Loader2 size={12} className="animate-spin" />
                        Analyzing
                      </span>
                    )}

                    {(doc.status === 'error' || doc.status === 'pending') && (
                      <div className="flex items-center gap-sm">
                        {doc.status === 'error' && (
                          <span className="text-xs text-error">Failed</span>
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
                            <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${doc.score}%`,
                                  backgroundColor: doc.score >= 70 ? 'var(--success)' : doc.score >= 40 ? 'var(--warning)' : 'var(--error)'
                                }}
                              />
                            </div>
                            <span
                              className="text-sm font-bold min-w-[36px]"
                              style={{
                                color: doc.score >= 70 ? 'var(--success)' : doc.score >= 40 ? 'var(--warning)' : 'var(--error)'
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
                      onClick={() => setDeleteModal({ open: true, docId: doc.id, filename: doc.filename })}
                      className="p-1.5 text-muted hover:text-error transition-colors"
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

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete document confirmation"
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
          onClick={() => { if (!deleting) setDeleteModal({ open: false, docId: '', filename: '' }); }}
          onKeyDown={(e) => { if (e.key === 'Escape' && !deleting) setDeleteModal({ open: false, docId: '', filename: '' }); }}
        >
          <div className="card w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
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

      {/* Empty state helper - only show when no documents */}
      {uploadedDocs.length === 0 && !loadingDocs && (
        <div className="text-center text-muted mt-xl p-xl">
          <FileText size={48} className="mx-auto mb-md opacity-30" />
          <p className="mb-sm">Upload your first document to get started</p>
          <p className="text-sm opacity-60">We support PDF, TXT, MD, and DOCX files</p>
        </div>
      )}
    </div>
  );
}
