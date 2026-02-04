'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SSEReader } from '@/lib/sse';

interface UploadedDoc {
  id: string;
  filename: string;
  status: string;
  score?: number;
}

export default function Home() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        const data = await uploadRes.json();
        throw new Error(data.error || 'Upload failed');
      }

      const uploadData = await uploadRes.json();

      // Add to list with pending status
      setUploadedDocs(prev => [
        { id: uploadData.id, filename: uploadData.filename, status: 'analyzing' },
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
            
            // Check for error messages in the SSE stream
            if (update.type === 'error') {
              streamError = new Error(update.message || 'Analysis failed');
            }
            
            if (update.type === 'complete' && update.result) {
              finalResult = update.result;
            }
          });
        }
      } catch (readError) {
        console.error('Stream read error:', readError);
        streamError = readError instanceof Error ? readError : new Error('Stream read failed');
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
      setError(err instanceof Error ? err.message : 'Upload failed');
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
      <header className="flex items-center justify-between mb-xl">
        <div>
          <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>
            <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Decision Intel
            </span>
          </h1>
          <p>Audit decisions for cognitive bias and noise</p>
        </div>
        <nav className="flex gap-md">
          <Link href="/dashboard" className="btn btn-secondary">
            Dashboard
          </Link>
        </nav>
      </header>

      {/* Upload Zone */}
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
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-md">
            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            <p>Analyzing document for biases...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-md">
            <Upload size={48} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                Drop your decision document here
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                or click to browse • PDF, TXT, MD, DOC, DOCX
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="card mb-lg" style={{ borderColor: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)' }}>
          <div className="card-body flex items-center gap-md">
            <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
            <span style={{ color: 'var(--error)' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Recently uploaded */}
      {uploadedDocs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Recently Uploaded</h3>
          </div>
          <div className="card-body">
            <div className="flex flex-col gap-md">
              {uploadedDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between animate-fade-in"
                  style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    animationDelay: `${idx * 0.1}s`
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-3 mt-xl">
        <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card-body">
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--spacing-md)'
            }}>
              <FileText size={24} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Document Ingestion</h4>
            <p style={{ fontSize: '0.875rem' }}>
              Upload PDFs, meeting notes, memos, and emails for instant analysis.
            </p>
          </div>
        </div>

        <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-body">
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--spacing-md)'
            }}>
              <AlertTriangle size={24} style={{ color: 'var(--accent-secondary)' }} />
            </div>
            <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Bias Detection</h4>
            <p style={{ fontSize: '0.875rem' }}>
              AI-powered detection of 15 cognitive biases with severity scoring.
            </p>
          </div>
        </div>

        <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="card-body">
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--spacing-md)'
            }}>
              <CheckCircle size={24} style={{ color: 'var(--success)' }} />
            </div>
            <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Actionable Insights</h4>
            <p style={{ fontSize: '0.875rem' }}>
              Get specific recommendations to improve decision quality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
