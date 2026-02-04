'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, FileText, AlertTriangle, CheckCircle,
    Loader2, ChevronRight, Lightbulb, Download, Table,
    Terminal, PlayCircle, Info, RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { SSEReader } from '@/lib/sse';

interface BiasInstance {
    id?: string;
    biasType: string;
    severity: string;
    excerpt: string;
    explanation: string;
    suggestion: string;
    found?: boolean; // Used in simulation results
}

interface Analysis {
    id: string;
    overallScore: number;
    noiseScore: number;
    summary: string;
    createdAt: string;
    biases: BiasInstance[];
    // Extended fields
    noiseStats?: { mean: number; stdDev: number; variance: number };
    factCheck?: { score: number; flags: string[] };
    compliance?: { status: 'PASS' | 'FLAGGED'; details: string };
}

interface Document {
    id: string;
    filename: string;
    fileType: string;
    fileSize: number;
    content: string;
    uploadedAt: string;
    status: string;
    analyses: Analysis[];
}

const SEVERITY_COLORS: Record<string, string> = {
    low: 'var(--severity-low)',
    medium: 'var(--severity-medium)',
    high: 'var(--severity-high)',
    critical: 'var(--severity-critical)'
};

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBias, setSelectedBias] = useState<BiasInstance | null>(null);
    const [editableContent, setEditableContent] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<Analysis | null>(null);
    const [streamLogs, setStreamLogs] = useState<{ msg: string, type: 'info' | 'bias' | 'success' }[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const res = await fetch(`/api/documents/${resolvedParams.id}`);
                if (!res.ok) throw new Error('Document not found');
                const data = await res.json();
                setDocument(data);
                setEditableContent(data.content);
                if (data.analyses?.[0]?.biases?.[0]) {
                    setSelectedBias(data.analyses[0].biases[0]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load document');
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [resolvedParams.id]);

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                    <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                </div>
            </div>
        );
    }

    if (error || !document) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="card">
                    <div className="card-body flex flex-col items-center gap-md">
                        <AlertTriangle size={48} style={{ color: 'var(--error)' }} />
                        <p style={{ color: 'var(--error)' }}>{error || 'Document not found'}</p>
                        <Link href="/" className="btn btn-primary">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const analysis = document.analyses?.[0];
    const biases = analysis?.biases || [];

    const handleExport = async () => {
        if (!document || !analysis) return;

        try {
            const { PdfGenerator } = await import('@/lib/reports/pdf-generator');
            const generator = new PdfGenerator();
            generator.generateReport({
                filename: document.filename,
                analysis: analysis
            });
            showToast('PDF report generated successfully', 'success');
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            showToast('Failed to generate PDF report', 'error');
        }
    };

    const handleCsvExport = async () => {
        if (!document || !analysis) return;

        try {
            const { CsvGenerator } = await import('@/lib/reports/csv-generator');
            const generator = new CsvGenerator();
            generator.generateReport(document.filename, analysis);
            showToast('CSV export generated successfully', 'success');
        } catch (error) {
            console.error('Failed to generate CSV:', error);
            showToast('Failed to generate CSV report', 'error');
        }
    };

    const runSimulation = async () => {
        if (!editableContent.trim()) return;
        setIsSimulating(true);
        setStreamLogs([{ msg: 'Initializing simulation environment...', type: 'info' }]);
        setScanProgress(5);

        try {
            const res = await fetch('/api/analyze/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editableContent })
            });

            if (!res.ok) throw new Error('Simulation failed');
            const data = await res.json();

            setSimulationResult(data);
            setScanProgress(100);
            setStreamLogs(prev => [...prev, { msg: 'Simulation complete. Score Delta calculated.', type: 'success' }]);
            showToast('Simulation complete', 'success');
        } catch (err) {
            showToast('Simulation failed', 'error');
        } finally {
            setIsSimulating(false);
        }
    };

    const runLiveScan = async () => {
        if (!document) return;
        setIsScanning(true);
        setStreamLogs([{ msg: 'Establishing secure stream...', type: 'info' }]);
        setScanProgress(0);

        try {
            const response = await fetch('/api/analyze/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: document.id })
            });

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Failed to start stream');

            const decoder = new TextDecoder();
            const sseReader = new SSEReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                sseReader.processChunk(chunk, (update: any) => {
                    if (update.type === 'bias' && update.result.found) {
                        setStreamLogs(prev => [...prev, {
                            msg: `DETECTED: ${update.biasType} (${update.result.severity.toUpperCase()})`,
                            type: 'bias'
                        }]);
                    } else if (update.type === 'noise') {
                        setStreamLogs(prev => [...prev, { msg: `NOISE ANALYSIS: ${Math.round(update.result.score)}% intensity`, type: 'info' }]);
                    } else if (update.type === 'complete') {
                        setStreamLogs(prev => [...prev, { msg: 'Audit successfully committed to ledger.', type: 'success' }]);
                        setDocument(prev => prev ? { ...prev, analyses: [update.result, ...prev.analyses], status: 'complete' } : null);
                    }

                    if (typeof update.progress === 'number') {
                        setScanProgress(update.progress);
                    }
                });
            }
        } catch (err) {
            showToast('Live scan failed', 'error');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
            {/* Header */}
            <header className="flex items-center justify-between mb-xl">
                <div className="flex items-center gap-md">
                    <Link href="/dashboard" className="btn btn-ghost">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-md mb-sm">
                            <FileText size={24} style={{ color: 'var(--accent-primary)' }} />
                            <h1>{document.filename}</h1>
                        </div>
                        <p>
                            Uploaded {new Date(document.uploadedAt).toLocaleString()} •
                            {(document.fileSize / 1024).toFixed(1)} KB
                        </p>
                    </div>
                </div>
                <span className={`badge badge-${document.status}`} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    {document.status === 'complete' && <CheckCircle size={14} style={{ marginRight: 6 }} />}
                    {document.status}
                </span>
                <div className="flex gap-sm ml-md">
                    <button
                        onClick={runLiveScan}
                        disabled={isScanning}
                        className="btn btn-primary flex items-center gap-sm"
                        style={{ background: 'var(--accent-secondary)', borderColor: 'var(--accent-secondary)' }}
                    >
                        {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Terminal size={16} />}
                        LIVE SCAN
                    </button>
                    {analysis && (
                        <>
                            <button
                                onClick={handleExport}
                                className="btn btn-secondary flex items-center gap-sm"
                                style={{ fontSize: '0.875rem' }}
                            >
                                <Download size={16} />
                                Export PDF
                            </button>
                            <button
                                onClick={handleCsvExport}
                                className="btn btn-secondary flex items-center gap-sm"
                                style={{ fontSize: '0.875rem' }}
                            >
                                <Table size={16} />
                                Export CSV
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Analysis Summary */}
            {analysis && (
                <div className="grid grid-2 lg:grid-4 mb-xl gap-md">
                    {/* 1. Decision Quality */}
                    <div className="card animate-fade-in">
                        <div className="card-body text-center p-md">
                            <div className="text-xs text-muted uppercase tracking-wider mb-sm">Decision Quality</div>
                            <div style={{
                                fontSize: '2.5rem', fontWeight: 800,
                                color: analysis.overallScore >= 70 ? 'var(--success)' :
                                    analysis.overallScore >= 40 ? 'var(--warning)' : 'var(--error)'
                            }}>
                                {Math.round(analysis.overallScore)}
                            </div>
                            <div className="text-xs text-muted">out of 100</div>
                        </div>
                    </div>

                    {/* 2. Noise & Variance */}
                    <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="card-body text-center p-md">
                            <div className="text-xs text-muted uppercase tracking-wider mb-sm">Noise Risk</div>
                            <div style={{
                                fontSize: '2.5rem', fontWeight: 800,
                                color: analysis.noiseScore <= 30 ? 'var(--success)' :
                                    analysis.noiseScore <= 60 ? 'var(--warning)' : 'var(--error)'
                            }}>
                                {Math.round(analysis.noiseScore)}%
                            </div>
                            <div className="text-xs text-muted">
                                {analysis.noiseStats ? `σ=${analysis.noiseStats.stdDev} (3 Judges)` : 'Unknown Variance'}
                            </div>
                        </div>
                    </div>

                    {/* 3. Logical Fact Check */}
                    <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="card-body text-center p-md">
                            <div className="text-xs text-muted uppercase tracking-wider mb-sm">Truth Score</div>
                            <div style={{
                                fontSize: '2.5rem', fontWeight: 800,
                                color: (analysis.factCheck?.score || 0) >= 80 ? 'var(--success)' : 'var(--warning)'
                            }}>
                                {analysis.factCheck ? Math.round(analysis.factCheck.score) : '--'}%
                            </div>
                            <div className="text-xs text-muted">
                                {analysis.factCheck?.flags.length || 0} Flags Detected
                            </div>
                        </div>
                    </div>

                    {/* 4. Bias & Compliance */}
                    <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <div className="card-body text-center p-md">
                            <div className="text-xs text-muted uppercase tracking-wider mb-sm">Compliance</div>
                            <div className={`badge ${analysis.compliance?.status === 'FLAGGED' ? 'badge-critical' : 'badge-success'}`} style={{ fontSize: '1.25rem', margin: '0.5rem 0' }}>
                                {analysis.compliance?.status || 'PENDING'}
                            </div>
                            <div className="text-xs text-muted">
                                {biases.length} Biases Detected
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary & Live Stream */}
            <div className="grid grid-3 mb-xl">
                <div className="col-span-2">
                    {analysis?.summary ? (
                        <div className="card h-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
                            <div className="card-header">
                                <h3>Executive Summary</h3>
                            </div>
                            <div className="card-body">
                                <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{analysis.summary}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="card h-full flex items-center justify-center p-xl">
                            <p className="text-muted">Initiate LIVE SCAN to generate audit summary.</p>
                        </div>
                    )}
                </div>

                {/* Scan Terminal */}
                <div className="card animate-fade-in" style={{ animationDelay: '0.4s', background: '#050505' }}>
                    <div className="card-header" style={{ background: '#111' }}>
                        <h3 className="flex items-center gap-sm text-xs">
                            <Terminal size={14} /> LIVE_SCAN_FEED
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: 'var(--spacing-md)', fontSize: '10px', height: '200px', overflowY: 'auto', fontFamily: 'monospace' }}>
                        {isScanning || isSimulating ? (
                            <div className="mb-md">
                                <div style={{ height: '2px', background: '#222', width: '100%', marginBottom: '4px' }}>
                                    <div style={{ height: '100%', background: 'var(--accent-primary)', width: `${scanProgress}%`, transition: 'width 0.3s' }} />
                                </div>
                                <div className="text-muted">TASK_PROGRESS: {scanProgress}%</div>
                            </div>
                        ) : null}
                        {streamLogs.map((log, i) => (
                            <div key={i} style={{ marginBottom: '4px', color: log.type === 'bias' ? 'var(--error)' : log.type === 'success' ? 'var(--success)' : 'var(--text-secondary)' }}>
                                <span style={{ color: '#444' }}>[{new Date().toLocaleTimeString([], { hour12: false })}]</span> {log.msg}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Biases & Simulator */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 350px', gap: 'var(--spacing-lg)' }}>
                {/* Left Column: Editor/Simulator */}
                <div className="flex flex-col gap-lg">
                    <div className="card">
                        <div className="card-header justify-between">
                            <h3 className="flex items-center gap-sm">
                                <Info size={16} /> &quot;WHAT-IF&quot; SIMULATOR (MODIFIABLE)
                            </h3>
                            <button
                                onClick={runSimulation}
                                disabled={isSimulating}
                                className="btn btn-secondary"
                                style={{ padding: '2px 8px', fontSize: '10px' }}
                            >
                                {isSimulating ? <Loader2 size={12} className="animate-spin" /> : <PlayCircle size={12} />}
                                SIMULATE SCAN
                            </button>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <textarea
                                value={editableContent}
                                onChange={(e) => setEditableContent(e.target.value)}
                                style={{
                                    width: '100%',
                                    minHeight: '400px',
                                    background: '#0a0a0a',
                                    color: '#eee',
                                    border: 'none',
                                    padding: '24px',
                                    fontSize: '14px',
                                    lineHeight: '1.8',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Simulation Result Overlay (if active) */}
                    {simulationResult && (
                        <div className="card" style={{ borderColor: 'var(--accent-secondary)', background: 'rgba(10, 132, 255, 0.05)' }}>
                            <div className="card-header justify-between" style={{ background: 'rgba(10, 132, 255, 0.1)' }}>
                                <h3 style={{ color: 'var(--accent-secondary)' }}>SIMULATION_DELTA_RESULT</h3>
                                <button onClick={() => setSimulationResult(null)} className="btn btn-ghost" style={{ padding: 0 }}><RefreshCw size={12} /></button>
                            </div>
                            <div className="card-body grid grid-3">
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PROJECTED_DQ_IDX</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{Math.round(simulationResult.overallScore)}</div>
                                    <div style={{ fontSize: '10px', color: simulationResult.overallScore > (analysis?.overallScore || 0) ? 'var(--success)' : 'var(--error)' }}>
                                        {simulationResult.overallScore > (analysis?.overallScore || 0) ? '+' : ''}{Math.round(simulationResult.overallScore - (analysis?.overallScore || 0))}pts improvement
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BIAS_COUNT</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{simulationResult.biases.filter(b => b.found !== false).length}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>NOISE_LEVEL</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{Math.round(simulationResult.noiseScore)}%</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Bias List */}
                <div className="flex flex-col gap-lg">
                    {/* Scores in sidebar for simulation comparison */}
                    <div className="card">
                        <div className="card-body p-md flex justify-around">
                            <div className="text-center">
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>CURRENT_DQ</div>
                                <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{analysis ? Math.round(analysis.overallScore) : '--'}</div>
                            </div>
                            <div className="text-center">
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>CURRENT_NOISE</div>
                                <div style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>{analysis ? Math.round(analysis.noiseScore) : '--'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ alignSelf: 'start', width: '100%' }}>
                        <div className="card-header">
                            <h3>Detected Biases</h3>
                        </div>
                        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {biases.length > 0 ? biases.map((bias, idx) => (
                                <div
                                    key={bias.id}
                                    onClick={() => setSelectedBias(bias)}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        borderBottom: idx < biases.length - 1 ? '1px solid var(--border-color)' : 'none',
                                        cursor: 'pointer',
                                        background: selectedBias?.id === bias.id ? 'rgba(255, 159, 10, 0.1)' : 'transparent',
                                        borderLeft: selectedBias?.id === bias.id ? '3px solid var(--accent-primary)' : '3px solid transparent'
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <span style={{ fontWeight: 500, fontSize: '13px' }}>{bias.biasType}</span>
                                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <span className={`badge badge-${bias.severity}`} style={{ marginTop: 'var(--spacing-xs)', fontSize: '9px' }}>
                                        {bias.severity}
                                    </span>
                                </div>
                            )) : (
                                <div className="p-xl text-center text-muted text-xs">NO_DATA_AVAILABLE</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bias Detail Lightbox (at bottom or floating) */}
            {selectedBias && (
                <div className="card mt-xl">
                    <div className="card-header flex items-center justify-between">
                        <div className="flex items-center gap-md">
                            <AlertTriangle
                                size={20}
                                style={{ color: SEVERITY_COLORS[selectedBias.severity] }}
                            />
                            <h3>{selectedBias.biasType}</h3>
                        </div>
                        <button onClick={() => setSelectedBias(null)} className="btn btn-ghost" style={{ padding: 0 }}>CLOSE</button>
                    </div>
                    <div className="card-body grid grid-2">
                        <div>
                            <h4 className="text-xs text-muted mb-sm">EXCERPT</h4>
                            <blockquote style={{ padding: 'var(--spacing-md)', background: '#000', borderLeft: `4px solid ${SEVERITY_COLORS[selectedBias.severity]}`, fontSize: '12px' }}>
                                &quot;{selectedBias.excerpt}&quot;
                            </blockquote>
                        </div>
                        <div>
                            <h4 className="text-xs text-muted mb-sm">ANALYSIS & RECOMMENDATION</h4>
                            <p className="mb-md" style={{ fontSize: '13px' }}>{selectedBias.explanation}</p>
                            <div style={{ padding: 'var(--spacing-md)', background: 'rgba(48, 209, 88, 0.05)', border: '1px solid var(--success)' }}>
                                <div className="flex items-center gap-sm mb-xs">
                                    <Lightbulb size={16} style={{ color: 'var(--success)' }} />
                                    <span className="text-xs font-bold text-success uppercase">Correction</span>
                                </div>
                                <p style={{ fontSize: '13px' }}>{selectedBias.suggestion}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No biases */}
            {biases.length === 0 && analysis && (
                <div className="card animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <div className="card-body flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-2xl)' }}>
                        <CheckCircle size={64} style={{ color: 'var(--success)' }} />
                        <h3 style={{ color: 'var(--success)' }}>No Cognitive Biases Detected!</h3>
                        <p style={{ textAlign: 'center', maxWidth: 500 }}>
                            This document appears to demonstrate sound decision-making practices
                            without significant cognitive bias patterns.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
