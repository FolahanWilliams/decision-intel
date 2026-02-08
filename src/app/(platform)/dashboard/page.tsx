'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, Loader2, Brain, Scale, Shield, BarChart3, FileCheck, Trash2, Search, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { SSEReader } from '@/lib/sse';
import { RiskTrendChart } from './RiskTrendChart';

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
  const [showFilters, setShowFilters] = useState(false);

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
      {/* Header */}
      <header className="flex items-center justify-between mb-xl relative z-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(245, 158, 11, 0.3)'
            }}>
              Decision Intel
            </span>
          </h1>
          <p className="text-secondary text-lg">Audit infrastructure for cognitive bias and noise</p>
        </div>
        <nav className="flex gap-md">
          {/* Add user profile or other nav items here later */}
        </nav>
      </header>

      {/* Upload Zone */}
      <div
        className={`upload-zone mb-xl relative overflow-hidden transition-all duration-300 ${isDragOver ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-800 hover:border-neutral-700'}`}
        style={{
          backdropFilter: 'blur(10px)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--border-color)',
          background: isDragOver ? 'rgba(245, 158, 11, 0.05)' : 'rgba(20, 20, 20, 0.4)'
        }}
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
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-lg w-full max-w-md mx-auto relative z-10">
            {/* Progress bar */}
            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 ease-out box-shadow-glow"
                style={{ width: `${currentProgress}%`, boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}
              />
            </div>

            {/* Step list */}
            <div className="flex flex-col gap-3 w-full">
              {analysisSteps.map((step, idx) => (
                <div
                  key={step.name}
                  className="flex items-center gap-3 animate-fade-in"
                  style={{
                    animationDelay: `${idx * 0.1}s`,
                    opacity: step.status === 'pending' ? 0.3 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                    ${step.status === 'complete' ? 'bg-emerald-500/20 text-emerald-500' :
                      step.status === 'running' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                        'bg-neutral-800 text-neutral-600'}
                  `}>
                    {step.status === 'running' ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : step.status === 'complete' ? (
                      <CheckCircle size={12} />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className={`text-sm ${step.status === 'running' ? 'text-amber-500 font-medium' : step.status === 'complete' ? 'text-emerald-400' : 'text-neutral-500'}`}>
                    {step.name}
                    {step.status === 'running' && '...'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-12 relative z-10">
            <div className="w-16 h-16 rounded-full bg-neutral-900/50 flex items-center justify-center border border-neutral-800 group-hover:border-amber-500/50 transition-colors">
              <Upload size={24} className="text-neutral-400 group-hover:text-amber-500 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium text-lg mb-2">
                Drop your decision document here
              </p>
              <p className="text-sm text-neutral-500">
                or click to browse • PDF, TXT, MD, DOC, DOCX
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Risk Trend & Error Message */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 card">
          <div className="card-header pb-2">
            <h3 className="flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-500" />
              Decision Quality Trend
            </h3>
          </div>
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
        </div>

        {/* Error Message Area */}
        {error && (
          <div className="card border-red-500/50 bg-red-500/10 h-fit">
            <div className="card-body flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <span className="text-red-400 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Recently uploaded / Saved documents */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3>Your Documents</h3>
          <div className="flex items-center gap-md">
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 36px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  width: 200
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-ghost flex items-center gap-sm ${showFilters ? 'active' : ''}`}
              style={{ fontSize: '12px', padding: '8px 12px', background: showFilters ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}
            >
              <Filter size={14} />
              Filter
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-md">
              <span className="text-xs text-muted">Status:</span>
              {(['all', 'complete', 'analyzing', 'pending'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '11px', padding: '4px 10px', textTransform: 'capitalize' }}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card-body">
          {loadingDocs ? (
            <div className="flex items-center justify-center gap-md" style={{ padding: 'var(--spacing-xl)' }}>
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-muted">Loading documents...</span>
            </div>
          ) : uploadedDocs.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: 'var(--spacing-xl)' }}>
              No documents yet. Upload your first document above.
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: 'var(--spacing-xl)' }}>
              No documents match your search or filter.
            </div>
          ) : (
            <div className="flex flex-col gap-md">
              {filteredDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between animate-fade-in"
                  style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    animationDelay: `${idx * 0.05}s`
                  }}
                >
                  <div className="flex items-center gap-md">
                    <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                    <span>{doc.filename}</span>
                  </div>
                  <div className="flex items-center gap-md">
                    {doc.status === 'analyzing' && (
                      <span className="badge badge-analyzing flex items-center gap-sm">
                        <Loader2 size={12} className="animate-spin" />
                        Analyzing
                      </span>
                    )}
                    {doc.status === 'complete' && (
                      <>
                        <span className="badge badge-complete flex items-center gap-sm">
                          <CheckCircle size={12} />
                          Complete
                        </span>
                        {doc.score !== undefined && (
                          <span style={{
                            fontWeight: 600,
                            color: doc.score >= 70 ? 'var(--success)' : doc.score >= 40 ? 'var(--warning)' : 'var(--error)'
                          }}>
                            {Math.round(doc.score)}%
                          </span>
                        )}
                        <Link href={`/documents/${doc.id}`} className="btn btn-ghost" style={{ fontSize: '0.75rem' }}>
                          View Details →
                        </Link>
                      </>
                    )}
                    {/* Delete Button */}
                    <button
                      onClick={() => setDeleteModal({ open: true, docId: doc.id, filename: doc.filename })}
                      className="btn btn-ghost"
                      style={{ padding: '6px', color: 'var(--text-muted)' }}
                      title="Delete document"
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: 400, width: '90%' }}>
            <div className="card-header">
              <h3 className="flex items-center gap-sm">
                <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
                Delete Document
              </h3>
            </div>
            <div className="card-body">
              <p className="mb-lg">
                Are you sure you want to delete <strong>{deleteModal.filename}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center gap-md justify-end">
                <button
                  onClick={() => setDeleteModal({ open: false, docId: '', filename: '' })}
                  className="btn btn-ghost"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn"
                  style={{ background: 'var(--error)', color: '#fff' }}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      {/* Features - Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        {[
          { icon: <FileText size={20} />, title: "Rapid Ingestion", desc: "Upload PDFs, meeting notes, memos, and emails for instant analysis.", color: "indigo" },
          { icon: <Brain size={20} />, title: "Bias Detection", desc: "AI-powered detection of 15 cognitive biases with severity scoring.", color: "amber" },
          { icon: <CheckCircle size={20} />, title: "Actionable Insights", desc: "Get specific recommendations to improve decision quality.", color: "emerald" }
        ].map((feature, i) => (
          <div key={i} className="card group hover:-translate-y-1 transition-transform duration-300">
            <div className="card-body">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors
                ${feature.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500/20' :
                  feature.color === 'amber' ? 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20'}`}>
                {feature.icon}
              </div>
              <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
