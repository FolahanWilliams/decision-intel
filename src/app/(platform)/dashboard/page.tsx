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
import { DecisionIQCard } from '@/components/ui/DecisionIQCard';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import useSWR from 'swr';
import { useDocuments } from '@/hooks/useDocuments';
import { useAnalysisStream } from '@/hooks/useAnalysisStream';
import type { OutcomeGateInfo } from '@/hooks/useAnalysisStream';
import { useNotifications } from '@/components/ui/NotificationCenter';
import { useAnalysisProgress } from '@/components/ui/AnalysisProgressBar';
import { EnhancedEmptyState } from '@/components/ui/EnhancedEmptyState';
import { OutcomeGateBanner } from '@/components/ui/OutcomeGate';
import { DraftOutcomeBanner } from '@/components/ui/DraftOutcomeBanner';
import { SampleDataBanner } from '@/components/ui/SampleDataBanner';
import { SampleBadge } from '@/components/ui/SampleBadge';
import { JournalWidget } from '@/components/ui/JournalWidget';
import { DecisionTriageWidget } from '@/components/ui/DecisionTriageWidget';
import { NudgeWidget } from '@/components/dashboard/NudgeWidget';
import { useToast } from '@/components/ui/EnhancedToast';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('Dashboard');
import { OnboardingGuide } from '@/components/ui/OnboardingGuide';
import { WelcomeModal } from '@/components/ui/WelcomeModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BulkUploadPanel } from '@/components/ui/BulkUploadPanel';
import { formatDate } from '@/lib/constants/human-audit';
import { ActivityFeed } from '@/components/ui/ActivityFeed';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { SparklineChart } from '@/components/ui/SparklineChart';
import { useDeals } from '@/hooks/useDeals';
import { DOCUMENT_TYPES } from '@/types/deals';
import { QuickScanModal } from '@/components/ui/QuickScanModal';
import { Zap } from 'lucide-react';

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
      const retryAfter = uploadRes.headers.get('Retry-After');
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds) && seconds > 0) {
          const minutes = Math.ceil(seconds / 60);
          return `Upload limit reached (5 per hour). Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
        }
      }
      return 'Upload limit reached. Please wait before trying again.';
    }
    if (uploadRes.status === 413) {
      return 'File is too large. Please upload a document under 5 MB.';
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
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') === 'browse' ? 'browse' : 'upload';
  const [activeView, setActiveView] = useState<DashboardView>(initialView);
  const globalDragCounter = useRef(0);

  // Upload confirmation state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [selectedDealId, setSelectedDealId] = useState<string>('');

  // Deal list for upload deal selector
  const { deals: dealsList } = useDeals(undefined, 1, 100);

  // Decision Frame context — when user comes from /decisions/new
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [activeFrameStatement, setActiveFrameStatement] = useState<string | null>(null);

  // Search and filter state (debounced for performance on large lists)
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'analyzing' | 'pending'>(
    'all'
  );
  const [docsPage, setDocsPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'scoreHigh' | 'scoreLow' | 'name'>(
    'newest'
  );
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);

  // Welcome modal for first-time users (triggered via ?welcome=true from auth callback)
  const [showWelcome, setShowWelcome] = useState(false);
  const [quickScanOpen, setQuickScanOpen] = useState(false);

  // Handle Stripe checkout redirects (?upgraded=true or ?frameId=...) and welcome flow
  const { showToast } = useToast();

  // Plan usage for upload hint
  const { data: billingData } = useSWR<{
    usage: { analysesThisMonth: number };
    limits: { analysesPerMonth: number };
    planName: string;
  }>('/api/billing', url => fetch(url).then(r => (r.ok ? r.json() : null)), {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      showToast('Welcome to your upgraded plan! Your new limits are now active.', 'success');
      window.history.replaceState({}, '', '/dashboard');
    }
    if (params.get('welcome') === 'true') {
      setShowWelcome(true);
      window.history.replaceState({}, '', '/dashboard');
    }
    const fId = params.get('frameId');
    if (fId) {
      setActiveFrameId(fId);
      setActiveView('upload');
      // Fetch the decision statement for context
      fetch(`/api/decision-frames?id=${fId}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data?.decisionStatement) setActiveFrameStatement(data.decisionStatement);
        })
        .catch(() => {});
      window.history.replaceState({}, '', '/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search input → searchQuery (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
  const {
    startTracking,
    updateProgress,
    completeTracking,
    errorTracking,
    updateBiasCount,
    updateNoiseScore,
  } = useAnalysisProgress();
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const {
    activities,
    isLoading: feedLoading,
    hasMore: feedHasMore,
    loadMore: feedLoadMore,
  } = useActivityFeed({ limit: 12 });

  // SWR: cached document list with auto-revalidation
  const {
    documents: uploadedDocs,
    total: totalDocs,
    totalPages: docsTotalPages,
    isLoading: loadingDocs,
    mutate: mutateDocs,
  } = useDocuments(true, docsPage);

  // Outcome gate state for soft/hard gate UI
  const [outcomeReminder, setOutcomeReminder] = useState<{
    pendingCount: number;
    analysisIds: string[];
  } | null>(null);
  // Legacy hard-gate state — server no longer returns 423, so this only
  // populates on older deployments. Rendered as a dismissible banner, never
  // a blocking modal.
  const [hardGateInfo, setHardGateInfo] = useState<OutcomeGateInfo | null>(null);

  // Bias count accumulator for pipeline graph badges
  const biasCountRef = useRef(0);

  // SSE: streaming analysis with typed events, auto-retry, AbortController cleanup
  const {
    startAnalysis,
    cancelAnalysis,
    steps: analysisSteps,
    progress: currentProgress,
    timedOut: streamTimedOut,
    outcomeGate,
  } = useAnalysisStream({
    stepNames: ANALYSIS_STEPS.map(s => s.name),
    onBiasDetected: () => {
      // Increment bias count in the progress context (called per bias event)
      biasCountRef.current += 1;
      updateBiasCount(biasCountRef.current);
    },
    onNoiseUpdate: score => {
      updateNoiseScore(score);
    },
    onOutcomeReminder: (count, ids) => {
      setOutcomeReminder({ pendingCount: count, analysisIds: ids });
    },
  });

  // Surface hard-gate reminder banner when the hook reports legacy gate info.
  useEffect(() => {
    if (outcomeGate) {
      setHardGateInfo(outcomeGate);
    }
  }, [outcomeGate]);

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

  // Sorted documents based on sort selection
  const sortedDocs = useMemo(() => {
    const docs = [...filteredDocs];
    switch (sortBy) {
      case 'oldest':
        return docs.sort(
          (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        );
      case 'scoreHigh':
        return docs.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
      case 'scoreLow':
        return docs.sort((a, b) => (a.score ?? 101) - (b.score ?? 101));
      case 'name':
        return docs.sort((a, b) => a.filename.localeCompare(b.filename));
      case 'newest':
      default:
        return docs.sort(
          (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
    }
  }, [filteredDocs, sortBy]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedDocs(new Set());
  }, [searchQuery, statusFilter, docsPage]);

  // Batch delete handler
  const handleBatchDelete = async () => {
    if (selectedDocs.size === 0) return;
    setBatchDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedDocs).map(id => fetch(`/api/documents/${id}`, { method: 'DELETE' }))
      );
      setSelectedDocs(new Set());
      mutateDocs();
      showToast(`Deleted ${selectedDocs.size} document(s)`, 'success');
    } catch {
      showToast('Failed to delete some documents', 'error');
    } finally {
      setBatchDeleting(false);
    }
  };

  // Risk summary computed from analyzed documents
  const riskSummary = useMemo(() => {
    let high = 0,
      medium = 0,
      low = 0,
      totalScore = 0,
      scored = 0;
    uploadedDocs.forEach(doc => {
      if (doc.score !== undefined) {
        scored++;
        totalScore += doc.score;
        if (doc.score < 40) high++;
        else if (doc.score < 70) medium++;
        else low++;
      }
    });
    return {
      total: scored,
      high,
      medium,
      low,
      avg: scored > 0 ? Math.round(totalScore / scored) : 0,
    };
  }, [uploadedDocs]);

  // Sparkline data — last 10 scores for mini-chart in KPI cards
  const sparklineData = useMemo(() => {
    return [...uploadedDocs]
      .filter(d => d.score !== undefined)
      .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
      .slice(-10)
      .map(d => d.score || 0);
  }, [uploadedDocs]);

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
      if (activeFrameId) {
        formData.append('frameId', activeFrameId);
      }
      if (selectedDocType) {
        formData.append('documentType', selectedDocType);
      }
      if (selectedDealId) {
        formData.append('dealId', selectedDealId);
      }

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
      // Don't reset progress to 0 — the analysis stream will drive progress from here

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
      biasCountRef.current = 0;
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
      biasCountRef.current = 0;
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
    setSelectedDocType('');
    setSelectedDealId('');
  };

  return (
    <div>
      {/* Welcome modal for first-time users */}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      {/* Header with view tabs */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            <span className="text-gradient">Dashboard</span>
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Decision intelligence overview
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setQuickScanOpen(true)}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#c084fc',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <Zap size={14} />
            Quick Bias Check
          </button>
        </div>
        {/* Only show view switcher when user has documents */}
        {uploadedDocs.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              padding: '3px',
            }}
          >
            <button
              onClick={() => setActiveView('upload')}
              style={{
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: activeView === 'upload' ? 600 : 400,
                borderRadius: 'var(--radius-full)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s',
                background: activeView === 'upload' ? 'var(--bg-active)' : 'transparent',
                color: activeView === 'upload' ? 'var(--text-highlight)' : 'var(--text-muted)',
              }}
            >
              <Upload size={14} />
              Upload &amp; Monitor
            </button>
            <button
              onClick={() => setActiveView('browse')}
              style={{
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: activeView === 'browse' ? 600 : 400,
                borderRadius: 'var(--radius-full)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s',
                background: activeView === 'browse' ? 'var(--bg-active)' : 'transparent',
                color: activeView === 'browse' ? 'var(--text-highlight)' : 'var(--text-muted)',
              }}
            >
              <Search size={14} />
              Browse &amp; Analyze
            </button>
          </div>
        )}
      </div>

      {/* Hero KPI Cards */}
      {uploadedDocs.length > 0 && (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md sm:gap-lg mb-xl"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {[
              {
                label: 'Total Documents',
                value: totalDocs,
                numericValue: totalDocs,
                icon: <FileText size={18} />,
                iconBg: 'var(--bg-card-hover)',
                iconColor: 'var(--text-secondary)',
                sparkColor: 'var(--text-muted)',
              },
              {
                label: 'Analyzed',
                value: uploadedDocs.filter(d => d.status === 'complete').length,
                numericValue: uploadedDocs.filter(d => d.status === 'complete').length,
                icon: <CheckCircle size={18} />,
                iconBg: 'var(--bg-card-hover)',
                iconColor: 'var(--text-secondary)',
                sparkColor: 'var(--text-muted)',
              },
              {
                label: 'Avg Quality',
                value: riskSummary.avg,
                numericValue: riskSummary.avg,
                suffix: '%',
                icon: <TrendingUp size={18} />,
                iconBg: 'var(--bg-card-hover)',
                iconColor: 'var(--text-secondary)',
                sparkColor: 'var(--text-muted)',
                showSparkline: true,
              },
              {
                label: 'Decision IQ',
                value: -1, // Sentinel: replaced by custom component
                numericValue: -1,
                icon: <Brain size={18} />,
                iconBg: 'var(--bg-card-hover)',
                iconColor: 'var(--text-secondary)',
                sparkColor: 'var(--text-muted)',
                isCustom: true,
              },
            ].map(stat => {
              // Decision IQ uses its own self-contained component
              if ((stat as Record<string, unknown>).isCustom) {
                return (
                  <motion.div
                    key={stat.label}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.97 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{
                      y: -4,
                      boxShadow:
                        '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <DecisionIQCard />
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={stat.label}
                  className="stat-card liquid-glass-premium"
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.97 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{
                    y: -4,
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 'var(--spacing-md)' }}
                  >
                    <div
                      className="stat-card-icon"
                      style={{
                        background: stat.iconBg,
                        color: stat.iconColor,
                        marginBottom: 0,
                      }}
                    >
                      {stat.icon}
                    </div>
                    {stat.showSparkline && sparklineData.length >= 2 && (
                      <SparklineChart
                        data={sparklineData}
                        color={stat.sparkColor}
                        width={72}
                        height={28}
                      />
                    )}
                  </div>
                  <div className="stat-card-value" style={{ color: 'var(--text-highlight)' }}>
                    {riskSummary.total > 0 || stat.label === 'Total Documents' ? (
                      <AnimatedNumber
                        value={stat.numericValue}
                        suffix={stat.suffix || ''}
                        duration={900}
                      />
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="stat-card-label">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}

      {/* Stream timed out banner */}
      <AnimatePresence>
        {streamTimedOut && !uploading && (
          <motion.div
            className="mb-lg p-md bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AlertTriangle size={18} className="text-warning shrink-0" />
            <span className="text-warning text-sm">
              Analysis is taking longer than expected. The server may still be processing — refresh
              the page or try again.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message - Compact */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mb-lg p-md bg-error/10 border border-error/30 rounded-lg flex items-center gap-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AlertTriangle size={18} className="text-error shrink-0" />
            <span className="text-error text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-error/60 hover:text-error"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outcome Gate Banner (soft gate — 3-4 pending outcomes) */}
      <AnimatePresence>
        {outcomeReminder && (
          <div className="mb-lg">
            <OutcomeGateBanner
              pendingCount={outcomeReminder.pendingCount}
              pendingAnalysisIds={outcomeReminder.analysisIds}
              onDismiss={() => setOutcomeReminder(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Sample Data Banner — offers seed-in-one-click for cold-start orgs
          and "ready to clear" once user has enough real analyses (M4) */}
      <div className="mb-lg">
        <SampleDataBanner />
      </div>

      {/* Draft Outcome Detection Banner */}
      <div className="mb-lg">
        <DraftOutcomeBanner />
      </div>

      {/* Outcome Gate Banner (hard reminder — 5+ pending outcomes, non-blocking) */}
      {hardGateInfo && (
        <div className="mb-lg">
          <OutcomeGateBanner
            pendingCount={hardGateInfo.pendingCount}
            pendingAnalysisIds={hardGateInfo.pendingAnalysisIds}
            level="hard"
            onDismiss={() => setHardGateInfo(null)}
          />
        </div>
      )}

      {/* Onboarding Guide — persists across view switches */}
      <OnboardingGuide documentCount={totalDocs ?? 0} />

      {/* Decision Triage — top decisions needing attention */}
      <DecisionTriageWidget />

      {/* Active Nudges — unacknowledged behavioral nudges */}
      <ErrorBoundary sectionName="Nudges">
        <NudgeWidget />
      </ErrorBoundary>

      {/* Decision Journal — captured decisions from email/calendar */}
      <div className="mb-lg">
        <ErrorBoundary sectionName="Journal">
          <JournalWidget />
        </ErrorBoundary>
      </div>

      {/* ═══════ UPLOAD & MONITOR VIEW ═══════ */}
      {activeView === 'upload' && (
        <>
          {/* Upload Confirmation Dialog */}
          <Dialog
            open={!!pendingFile && !uploading}
            onOpenChange={(isOpen: boolean) => {
              if (!isOpen) {
                setPendingFile(null);
                setSelectedDocType('');
                setSelectedDealId('');
              }
            }}
          >
            <DialogContent className="sm:max-w-md" showCloseButton>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <FileText size={18} style={{ color: 'var(--text-highlight)' }} />
                  Ready to Analyze
                </DialogTitle>
                <DialogDescription>
                  Review file details and optionally tag before analysis.
                </DialogDescription>
              </DialogHeader>

              {pendingFile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* File preview */}
                  <div
                    className="flex items-center gap-md"
                    style={{
                      padding: 'var(--spacing-md)',
                      background: 'var(--bg-card)',
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={22} className="text-accent-primary" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        className="font-medium text-sm"
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pendingFile.name}
                      </p>
                      <p className="text-xs text-muted">
                        {(pendingFile.size / 1024).toFixed(1)} KB ·{' '}
                        {pendingFile.type || pendingFile.name.split('.').pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Document type + Deal selectors — stacked for clarity */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label
                        className="text-xs text-muted font-medium"
                        style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
                      >
                        Document Type <span className="text-muted">(optional)</span>
                      </label>
                      <select
                        value={selectedDocType}
                        onChange={e => setSelectedDocType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: 8,
                          color: 'var(--text-primary)',
                          fontSize: 13,
                          outline: 'none',
                        }}
                      >
                        <option value="">Select type...</option>
                        {DOCUMENT_TYPES.map(t => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        className="text-xs text-muted font-medium"
                        style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}
                      >
                        Link to Deal <span className="text-muted">(optional)</span>
                      </label>
                      <select
                        value={selectedDealId}
                        onChange={e => setSelectedDealId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: 8,
                          color: 'var(--text-primary)',
                          fontSize: 13,
                          outline: 'none',
                        }}
                      >
                        <option value="">Select deal...</option>
                        {dealsList.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Actions */}
                  <DialogFooter>
                    <button
                      onClick={() => {
                        setPendingFile(null);
                        setSelectedDocType('');
                        setSelectedDealId('');
                      }}
                      className="btn btn-ghost text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmUpload}
                      className="btn btn-primary flex items-center gap-sm"
                    >
                      <Brain size={16} />
                      Start Analysis
                    </button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Decision Frame Context Banner */}
          {activeFrameStatement && (
            <div
              className="card mb-md animate-fade-in"
              style={{
                padding: 'var(--spacing-md)',
                background: 'rgba(22, 163, 74, 0.08)',
                border: '1px solid rgba(22, 163, 74, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
              }}
            >
              <FileText size={16} style={{ color: '#16A34A', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#16A34A',
                    fontWeight: 600,
                    marginBottom: '2px',
                  }}
                >
                  Decision Frame Active
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeFrameStatement}
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveFrameId(null);
                  setActiveFrameStatement(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Upload Zone - Enhanced with drag feedback */}
          <ErrorBoundary sectionName="Upload">
            {!uploading && !pendingFile ? (
              <div
                className={`upload-zone mb-xl liquid-glass-iridescent liquid-glass-shimmer ${isDragOver ? 'dragover' : ''}`}
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
                      background: isDragOver ? 'var(--bg-active-hover)' : 'var(--bg-card-hover)',
                      border: `1px solid ${isDragOver ? 'var(--border-hover)' : 'var(--border-color)'}`,
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
                    <p className="text-sm text-muted">PDF, TXT, MD, DOCX · Max 5 MB</p>
                    {billingData && billingData.limits.analysesPerMonth > 0 && (
                      <p className="text-xs text-muted" style={{ marginTop: '4px' }}>
                        {billingData.usage.analysesThisMonth}/{billingData.limits.analysesPerMonth}{' '}
                        analyses used this month ({billingData.planName})
                      </p>
                    )}
                    {billingData &&
                      billingData.limits.analysesPerMonth > 0 &&
                      billingData.planName?.toLowerCase() === 'starter' &&
                      billingData.usage.analysesThisMonth / billingData.limits.analysesPerMonth >=
                        0.8 && (
                        <Link
                          href="/dashboard/settings"
                          className="text-xs"
                          style={{
                            marginTop: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--warning, #eab308)',
                            fontWeight: 600,
                          }}
                        >
                          <AlertTriangle size={12} />
                          {billingData.usage.analysesThisMonth >=
                          billingData.limits.analysesPerMonth
                            ? 'Limit reached — upgrade to continue analyzing'
                            : 'Approaching limit — upgrade for more analyses'}
                        </Link>
                      )}
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
                      style={{ color: 'var(--text-highlight)' }}
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
                      className={
                        uploadPhase === 'analyzing' ? 'text-accent-primary font-medium' : ''
                      }
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
                                  ? 'rgba(255, 255, 255, 0.10)'
                                  : 'var(--bg-tertiary)',
                            border: `1px solid ${
                              step.status === 'complete'
                                ? 'rgba(34, 197, 94, 0.3)'
                                : step.status === 'running'
                                  ? 'rgba(255, 255, 255, 0.25)'
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
                      className="btn btn-ghost text-xs flex items-center gap-xs"
                      style={{
                        color: 'var(--text-muted)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '6px 12px',
                      }}
                    >
                      <X size={12} />
                      Cancel Analysis
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </ErrorBoundary>

          {/* Bulk Upload */}
          <div className="mt-lg mb-lg">
            <ErrorBoundary sectionName="Bulk Upload">
              <BulkUploadPanel onComplete={() => mutateDocs?.()} />
            </ErrorBoundary>
          </div>

          {/* Currently Analyzing Section */}
          <ErrorBoundary sectionName="Documents">
            {uploadedDocs.filter(d => d.status === 'analyzing').length > 0 && (
              <div className="section">
                <h2 className="section-header flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin text-accent-primary" />
                  Currently Analyzing
                </h2>
                <div className="space-y-3">
                  {uploadedDocs
                    .filter(d => d.status === 'analyzing')
                    .map(doc => (
                      <div
                        key={doc.id}
                        className="card"
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          borderColor: 'rgba(255, 255, 255, 0.15)',
                        }}
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
                                background: 'rgba(255, 255, 255, 0.06)',
                              }}
                            >
                              <FileText size={18} style={{ color: 'var(--text-highlight)' }} />
                            </div>
                            <div>
                              <span className="font-medium text-sm inline-flex items-center gap-2">
                                {doc.filename}
                                {doc.isSample && <SampleBadge size="xs" />}
                              </span>
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
              <div className="section">
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: 'var(--spacing-md)' }}
                >
                  <h2
                    className="section-header flex items-center gap-2"
                    style={{ marginBottom: 0 }}
                  >
                    <CheckCircle size={18} className="text-green-500" />
                    Recent Analyses
                  </h2>
                  <button
                    onClick={() => setActiveView('browse')}
                    className="text-sm text-secondary hover:text-primary hover:underline flex items-center gap-1"
                  >
                    View All <ChevronRight size={14} />
                  </button>
                </div>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.06 } },
                  }}
                >
                  {uploadedDocs
                    .filter(d => d.status === 'complete')
                    .slice(0, 6)
                    .map(doc => (
                      <motion.div
                        key={doc.id}
                        variants={{
                          hidden: { opacity: 0, y: 16 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      >
                        <Link
                          href={`/documents/${doc.id}`}
                          className="card group hover:border-white/20 transition-all"
                          style={{ textDecoration: 'none', display: 'block' }}
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
                                    background: 'rgba(255, 255, 255, 0.06)',
                                  }}
                                >
                                  <FileText size={16} style={{ color: 'var(--text-secondary)' }} />
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
                              <span>{formatDate(doc.uploadedAt)}</span>
                              <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                                View Analysis <ArrowRight size={12} />
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                </motion.div>
              </div>
            )}
          </ErrorBoundary>

          {/* Empty state - only show when no documents */}
          {uploadedDocs.length === 0 && !loadingDocs && (
            <div className="card">
              <EnhancedEmptyState
                type="documents"
                title="Upload your first document"
                description="Drop a PDF, TXT, MD, or DOCX file in the upload zone above. Our AI will scan for cognitive biases, decision noise, logical fallacies, and compliance risks."
                showBrief
                briefContext="documents"
                actions={[{
                  label: 'Choose a File',
                  onClick: () => document.getElementById('file-input')?.click(),
                  variant: 'primary' as const,
                }]}
              />
            </div>
          )}
        </>
      )}

      {/* ═══════ BROWSE & ANALYZE VIEW ═══════ */}
      {activeView === 'browse' && (
        <>
          {/* Activity Feed - Collapsible */}
          <div className="card mb-xl">
            <button
              onClick={() => setShowActivityFeed(prev => !prev)}
              className="w-full card-header flex items-center justify-between hover:bg-white/5 transition-colors"
              aria-expanded={showActivityFeed}
            >
              <h3 className="flex items-center gap-2 text-base">
                <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
                Recent Activity
                {activities.length > 0 && (
                  <span className="text-xs text-muted font-normal">
                    ({activities.length} events)
                  </span>
                )}
              </h3>
              <ChevronRight
                size={18}
                className={`text-muted transition-transform ${showActivityFeed ? 'rotate-90' : ''}`}
              />
            </button>
            {showActivityFeed && (
              <div className="card-body">
                <ErrorBoundary sectionName="Activity Feed">
                  <ActivityFeed
                    activities={activities}
                    isLoading={feedLoading}
                    hasMore={feedHasMore}
                    onLoadMore={feedLoadMore}
                  />
                </ErrorBoundary>
              </div>
            )}
          </div>

          {/* Documents List */}
          <div id="documents" className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-md">
                <h3 className="text-base">Documents</h3>
                {totalDocs > 0 && (
                  <span className="text-xs text-muted">
                    {sortedDocs.length} shown · {totalDocs} total
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
                    value={searchInput}
                    onChange={e => {
                      setSearchInput(e.target.value);
                      setDocsPage(1);
                    }}
                    className="pl-8 pr-7 py-1.5 text-sm bg-primary border border-border w-40 focus:w-56 transition-all"
                  />
                  {searchInput && (
                    <button
                      onClick={() => {
                        setSearchInput('');
                        setSearchQuery('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                      aria-label="Clear search"
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

                <select
                  value={sortBy}
                  aria-label="Sort documents"
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-1.5 text-sm bg-primary border border-border"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="scoreHigh">Score: High→Low</option>
                  <option value="scoreLow">Score: Low→High</option>
                  <option value="name">Name A-Z</option>
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
                <EnhancedEmptyState
                  type="documents"
                  showBrief
                  briefContext="documents"
                  actions={[
                    {
                      label: 'Go to Upload',
                      onClick: () => setActiveView('upload'),
                      variant: 'primary',
                      icon: <Upload className="w-4 h-4" />,
                    },
                  ]}
                />
              ) : sortedDocs.length === 0 ? (
                <div className="flex flex-col items-center gap-sm p-xl text-center">
                  <Search size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                  <p className="text-sm text-muted">No matches found</p>
                  <button
                    onClick={() => {
                      setSearchInput('');
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
                  {/* Select all header */}
                  <div
                    className="flex items-center gap-md p-md"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <input
                      type="checkbox"
                      aria-label="Select all documents"
                      checked={selectedDocs.size === sortedDocs.length && sortedDocs.length > 0}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedDocs(new Set(sortedDocs.map(d => d.id)));
                        } else {
                          setSelectedDocs(new Set());
                        }
                      }}
                      style={{
                        width: 14,
                        height: 14,
                        accentColor: 'var(--accent-primary)',
                        cursor: 'pointer',
                      }}
                    />
                    <span className="text-xs text-muted">
                      {selectedDocs.size > 0
                        ? `${selectedDocs.size} selected`
                        : `${sortedDocs.length} documents`}
                    </span>
                  </div>
                  {sortedDocs.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-md hover:bg-secondary/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <div className="flex items-center gap-md min-w-0">
                        <input
                          type="checkbox"
                          aria-label={`Select ${doc.filename}`}
                          checked={selectedDocs.has(doc.id)}
                          onChange={e => {
                            setSelectedDocs(prev => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(doc.id);
                              else next.delete(doc.id);
                              return next;
                            });
                          }}
                          style={{
                            width: 14,
                            height: 14,
                            accentColor: 'var(--accent-primary)',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        />
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <FileText size={16} style={{ color: 'var(--text-secondary)' }} />
                        </div>
                        <span className="truncate text-sm font-medium inline-flex items-center gap-2">
                          {doc.filename}
                          {doc.isSample && <SampleBadge size="xs" />}
                        </span>
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
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                                  style={{
                                    color:
                                      doc.score < 40
                                        ? 'var(--error)'
                                        : doc.score < 70
                                          ? 'var(--warning)'
                                          : 'var(--success)',
                                    background:
                                      doc.score < 40
                                        ? 'rgba(239, 68, 68, 0.1)'
                                        : doc.score < 70
                                          ? 'rgba(245, 158, 11, 0.1)'
                                          : 'rgba(34, 197, 94, 0.1)',
                                  }}
                                >
                                  {doc.score < 40
                                    ? 'HIGH RISK'
                                    : doc.score < 70
                                      ? 'MEDIUM'
                                      : 'LOW RISK'}
                                </span>
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

                        {deleteModal.open && deleteModal.docId === doc.id ? (
                          <div className="flex items-center gap-xs">
                            <span className="text-xs text-muted">Delete?</span>
                            <button
                              onClick={handleDelete}
                              disabled={deleting}
                              className="px-2 py-0.5 text-xs rounded"
                              style={{
                                background: 'rgba(239,68,68,0.15)',
                                color: 'var(--error)',
                                border: '1px solid rgba(239,68,68,0.3)',
                              }}
                            >
                              {deleting ? <Loader2 size={10} className="animate-spin" /> : 'Yes'}
                            </button>
                            <button
                              onClick={() =>
                                setDeleteModal({ open: false, docId: '', filename: '' })
                              }
                              disabled={deleting}
                              className="px-2 py-0.5 text-xs text-muted rounded"
                              style={{ border: '1px solid var(--border-color)' }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setDeleteModal({ open: true, docId: doc.id, filename: doc.filename })
                            }
                            className="p-1.5 text-muted hover:text-error transition-colors rounded"
                            title="Delete"
                            aria-label={`Delete ${doc.filename}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Batch action bar */}
          {selectedDocs.size > 0 && (
            <div
              className="flex items-center justify-between p-sm mt-sm"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span className="text-sm font-medium">
                {selectedDocs.size} document{selectedDocs.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-sm">
                <button
                  onClick={() => setSelectedDocs(new Set())}
                  className="btn btn-ghost text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={batchDeleting}
                  className="btn btn-sm flex items-center gap-xs text-sm"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--error)',
                  }}
                >
                  {batchDeleting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Delete Selected
                </button>
              </div>
            </div>
          )}

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
            background: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(20px) saturate(150%)',
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
              border: '2px dashed var(--border-hover)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-card-hover)',
              backdropFilter: 'blur(24px) saturate(160%)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <CloudUpload size={48} style={{ color: 'var(--accent-primary)' }} />
            <div className="text-center">
              <p className="font-semibold text-lg">Drop your document here</p>
              <p className="text-sm text-muted mt-1">PDF, TXT, MD, DOCX · Max 5 MB</p>
              {billingData && billingData.limits.analysesPerMonth > 0 && (
                <p className="text-xs text-muted" style={{ marginTop: '4px' }}>
                  {billingData.usage.analysesThisMonth}/{billingData.limits.analysesPerMonth}{' '}
                  analyses used this month ({billingData.planName})
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Scan Panel */}
      <QuickScanModal open={quickScanOpen} onClose={() => setQuickScanOpen(false)} />
    </div>
  );
}
