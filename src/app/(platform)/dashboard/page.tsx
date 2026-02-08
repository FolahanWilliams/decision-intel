'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, Loader2, Brain, Scale, Shield, BarChart3, FileCheck, Trash2, Search, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { SSEReader } from '@/lib/sse';
import { RiskTrendChart } from './RiskTrendChart';
import { ComparativeAnalysis, TrendOverlay } from '@/components/visualizations/ComparativeAnalysis';

interface UploadedDoc {
  id: string;
  filename: string;
  status: string;
  score?: number;
  uploadedAt: string;
}

interface AnalysisStep {
  name: string;
  status: 'pending' | 'running' | 'complete';
  icon: React.ReactNode;
}

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
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'analyzing' | 'pending'>('all');
  const [showTrend, setShowTrend] = useState(false);

  // Delete confirmation state
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; docId: string; filename: string }>({
    open: false, docId: '', filename: ''
  });
  const [deleting, setDeleting] = useState(false);

  // Fetch existing documents on page load
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch('/api/documents');
        if (res.ok) {
          const docs = await res.json();
          setUploadedDocs(docs);
        }
      } catch (err) {
        console.error('Failed to fetch documents:', err);
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocuments();
  }, []);

  // Filtered documents based on search and status
  const filteredDocs = useMemo(() => {
    return uploadedDocs.filter(doc => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [uploadedDocs, searchQuery, statusFilter]);

  // Delete document handler
  const handleDelete = async () => {
    if (!deleteModal.docId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteModal.docId}`, { method: 'DELETE' });
      if (res.ok) {
        setUploadedDocs(prev => prev.filter(d => d.id !== deleteModal.docId));
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

      // Add to list with pending status
      setUploadedDocs(prev => [
        { id: uploadData.id, filename: uploadData.filename, status: 'analyzing', uploadedAt: new Date().toISOString() },
        ...prev
      ]);

      // Use streaming endpoint to prevent timeout
      const analyzeRes = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: uploadData.id }),
      });

      // For SSE streams, check if we got a response body
      // Note: SSE always returns 200, errors come through the stream
      if (!analyzeRes.body) {
        throw new Error('No response body from analysis endpoint');
      }

      // Initialize analysis steps
      setAnalysisSteps(ANALYSIS_STEPS.map(s => ({ ...s, status: 'pending' as const })));

      // Read the stream for progress updates
      const reader = analyzeRes.body.getReader();
      const decoder = new TextDecoder();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let finalResult: any = null;
      let streamError: Error | null = null;

      const sseReader = new SSEReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          sseReader.processChunk(chunk, (data: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const update = data as any;

            // Handle step progress updates
            if (update.type === 'step' && update.step) {
              setCurrentProgress(update.progress || 0);
              setAnalysisSteps(prev => prev.map(s => ({
                ...s,
                status: s.name === update.step
                  ? update.status
                  : s.status === 'complete' ? 'complete' : s.status
              })));
            }

            // Check for error messages in the SSE stream
            if (update.type === 'error') {
              streamError = new Error(update.message || 'Analysis failed');
            }

            if (update.type === 'complete' && update.result) {
              finalResult = update.result;
              // Mark all steps complete
              setAnalysisSteps(prev => prev.map(s => ({ ...s, status: 'complete' as const })));
            }
          });
        }
      } catch {
        console.error('Stream read error occurred.');
        streamError = new Error('Connection lost during analysis. Please try again.');
      }

      // Check if we got an error from the stream
      if (streamError) {
        throw streamError;
      }

      // Check if we got a valid result
      if (!finalResult) {
        throw new Error('Analysis completed but no result received');
      }

      // Update status with final result
      setUploadedDocs(prev => prev.map(doc =>
        doc.id === uploadData.id
          ? { ...doc, status: 'complete', score: finalResult?.overallScore }
          : doc
      ));
    } catch (err) {
      console.error('Upload/Analysis error:', err instanceof Error ? err.message : 'Unknown error');
      // Display actual error message (sanitized by backend)
      setError(err instanceof Error ? err.message : 'An error occurred during document analysis');

      // Mark as error in list
      setUploadedDocs(prev => prev.map(doc =>
        doc.status === 'analyzing' ? { ...doc, status: 'error' } : doc
      ));
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
      <header className="flex items-center justify-between mb-xl">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
            Dashboard
          </span>
        </h1>
        <div className="text-sm text-muted">
          {uploadedDocs.length} document{uploadedDocs.length !== 1 ? 's' : ''}
        </div>
      </header>

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
            accept=".pdf,.txt,.md,.doc,.docx"
            onChange={handleFileSelect}
          />
          <div className="flex items-center gap-md">
            <Upload size={32} className="text-accent-primary" />
            <div>
              <p className="font-medium">Drop document here or click to browse</p>
              <p className="text-sm text-muted">PDF, TXT, MD, DOC, DOCX</p>
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

            {/* Current Step Only */}
            {analysisSteps.find(s => s.status === 'running') && (
              <div className="flex items-center gap-sm text-sm">
                <Loader2 size={14} className="animate-spin text-accent-primary" />
                <span>{analysisSteps.find(s => s.status === 'running')?.name}</span>
              </div>
            )}
          </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            <div className="lg:col-span-2 card">
              <div className="card-header">
                <h3>Document Benchmark</h3>
              </div>
              <div className="card-body">
                <ComparativeAnalysis documents={uploadedDocs.filter(d => d.status === 'complete').map(doc => ({
                  id: doc.id,
                  title: doc.filename,
                  date: new Date(doc.uploadedAt).toLocaleDateString(),
                  scores: {
                    quality: doc.score || 0,
                    risk: doc.score ? (100 - doc.score) : 50,
                    bias: 0, // Dashboard doesn't have this data yet, defaulting
                    clarity: 0 // Dashboard doesn't have this data yet, defaulting
                  }
                }))} />
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3>Quality Trend</h3>
              </div>
              <div className="card-body">
                <TrendOverlay data={uploadedDocs
                  .filter(d => d.status === 'complete' && d.score !== undefined)
                  .map(doc => ({
                    date: doc.uploadedAt,
                    score: doc.score || 0,
                    documentId: doc.id
                  }))
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                } />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-md">
            <h3 className="text-base">Documents</h3>
            {uploadedDocs.length > 0 && (
              <span className="text-xs text-muted">
                {filteredDocs.length} of {uploadedDocs.length}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-sm bg-primary border border-border rounded-md w-40 focus:w-56 transition-all"
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
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-sm bg-primary border border-border rounded-md"
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
            <div className="flex items-center justify-center gap-md p-xl">
              <Loader2 size={20} className="animate-spin text-accent-primary" />
              <span className="text-muted">Loading...</span>
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

                    {doc.status === 'complete' && (
                      <>
                        {doc.score !== undefined && (
                          <span
                            className="text-sm font-medium"
                            style={{
                              color: doc.score >= 70 ? 'var(--success)' : doc.score >= 40 ? 'var(--warning)' : 'var(--error)'
                            }}
                          >
                            {Math.round(doc.score)}%
                          </span>
                        )}
                        <Link
                          href={`/documents/${doc.id}`}
                          className="text-sm text-accent-primary hover:underline"
                        >
                          View →
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

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm mx-4">
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
          <p className="text-sm opacity-60">We support PDF, TXT, MD, DOC, and DOCX files</p>
        </div>
      )}
    </div>
  );
}
