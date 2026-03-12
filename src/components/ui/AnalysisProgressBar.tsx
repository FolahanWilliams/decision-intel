'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Loader2, CheckCircle, X, FileText } from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types & Context
// ---------------------------------------------------------------------------

interface ActiveAnalysis {
    documentId: string;
    filename: string;
    progress: number;
    currentStep: string;
    status: 'analyzing' | 'complete' | 'error';
}

interface AnalysisProgressContextType {
    activeAnalysis: ActiveAnalysis | null;
    startTracking: (documentId: string, filename: string) => void;
    updateProgress: (progress: number, step: string) => void;
    completeTracking: (documentId: string) => void;
    errorTracking: () => void;
    dismiss: () => void;
}

const AnalysisProgressContext = createContext<AnalysisProgressContextType | undefined>(undefined);

export function AnalysisProgressProvider({ children }: { children: ReactNode }) {
    const [activeAnalysis, setActiveAnalysis] = useState<ActiveAnalysis | null>(null);

    const startTracking = useCallback((documentId: string, filename: string) => {
        setActiveAnalysis({
            documentId,
            filename,
            progress: 0,
            currentStep: 'Preparing document',
            status: 'analyzing',
        });
    }, []);

    const updateProgress = useCallback((progress: number, step: string) => {
        setActiveAnalysis((prev) =>
            prev && prev.status === 'analyzing'
                ? { ...prev, progress, currentStep: step }
                : prev
        );
    }, []);

    const completeTracking = useCallback((documentId: string) => {
        setActiveAnalysis((prev) => {
            if (!prev || prev.documentId !== documentId) return prev;
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                setActiveAnalysis((current) =>
                    current?.documentId === documentId && current.status === 'complete' ? null : current
                );
            }, 5000);
            return { ...prev, progress: 100, currentStep: 'Analysis complete', status: 'complete' };
        });
    }, []);

    const errorTracking = useCallback(() => {
        setActiveAnalysis((prev) =>
            prev ? { ...prev, status: 'error', currentStep: 'Analysis failed' } : prev
        );
    }, []);

    const dismiss = useCallback(() => {
        setActiveAnalysis(null);
    }, []);

    return (
        <AnalysisProgressContext.Provider
            value={{ activeAnalysis, startTracking, updateProgress, completeTracking, errorTracking, dismiss }}
        >
            {children}
        </AnalysisProgressContext.Provider>
    );
}

export function useAnalysisProgress() {
    const ctx = useContext(AnalysisProgressContext);
    if (!ctx) throw new Error('useAnalysisProgress must be used within AnalysisProgressProvider');
    return ctx;
}

// ---------------------------------------------------------------------------
// Floating progress bar UI
// ---------------------------------------------------------------------------

export function AnalysisProgressFloat() {
    const { activeAnalysis, dismiss } = useAnalysisProgress();

    if (!activeAnalysis) return null;

    const isComplete = activeAnalysis.status === 'complete';
    const isError = activeAnalysis.status === 'error';
    const barColor = isComplete ? 'var(--success)' : isError ? 'var(--error)' : 'var(--accent-primary)';

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 45,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                padding: '12px 16px',
                minWidth: '360px',
                maxWidth: '480px',
            }}
        >
            <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                <div className="flex items-center gap-sm" style={{ fontSize: '13px' }}>
                    {isComplete ? (
                        <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                    ) : isError ? (
                        <FileText size={14} style={{ color: 'var(--error)' }} />
                    ) : (
                        <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                    )}
                    <span style={{ fontWeight: 500 }}>
                        {isComplete ? (
                            <Link
                                href={`/documents/${activeAnalysis.documentId}`}
                                style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
                            >
                                {activeAnalysis.filename}
                            </Link>
                        ) : (
                            activeAnalysis.filename
                        )}
                    </span>
                </div>
                <button
                    onClick={dismiss}
                    aria-label="Dismiss"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }}
                >
                    <X size={14} />
                </button>
            </div>

            {/* Progress bar */}
            <div
                style={{
                    height: '3px',
                    background: 'var(--bg-tertiary)',
                    marginBottom: '6px',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: `${activeAnalysis.progress}%`,
                        background: barColor,
                        transition: 'width 0.4s ease',
                    }}
                />
            </div>

            <div className="flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>{activeAnalysis.currentStep}</span>
                <span>{Math.round(activeAnalysis.progress)}%</span>
            </div>
        </div>
    );
}
