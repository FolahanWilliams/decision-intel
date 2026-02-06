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

// Helper function to get bias definitions for AI reasoning explanation
function getBiasDefinition(biasType: string): string {
    const definitions: Record<string, string> = {
        'Confirmation Bias': 'A cognitive bias where individuals favor information that confirms their pre-existing beliefs while ignoring contradictory evidence. The AI detected linguistic patterns suggesting the author is selectively presenting evidence that supports a predetermined conclusion.',
        'Anchoring Bias': 'The tendency to rely too heavily on the first piece of information encountered (the "anchor") when making decisions. The AI identified initial figures or statements that appear to disproportionately influence subsequent reasoning.',
        'Sunk Cost Fallacy': 'The tendency to continue investing in something because of previously invested resources, rather than future value. The AI detected language justifying continued investment based on past spending rather than prospective returns.',
        'Overconfidence Bias': 'Excessive confidence in one\'s own answers, beliefs, or abilities without adequate evidence. The AI identified absolute language, certainty claims, or dismissal of risks without supporting data.',
        'Groupthink': 'A psychological phenomenon where the desire for harmony leads to irrational decision-making. The AI detected patterns of unanimous agreement, suppression of dissenting views, or pressure to conform.',
        'Authority Bias': 'The tendency to attribute greater accuracy to opinions of an authority figure. The AI identified deference to titles, positions, or status over evidence and logical reasoning.',
        'Bandwagon Effect': 'The tendency to follow trends or adopt beliefs because others do. The AI detected reasoning based on popularity or peer behavior rather than independent analysis.',
        'Loss Aversion': 'The tendency to prefer avoiding losses over acquiring equivalent gains. The AI identified disproportionate focus on potential losses compared to potential gains.',
        'Availability Heuristic': 'Overweighting easily recalled or recent events when making decisions. The AI detected references to memorable or recent events without proportional consideration of base rates.',
        'Hindsight Bias': 'The tendency to believe, after an event occurs, that one would have predicted or expected it. The AI identified post-hoc rationalization or claims of foreknowledge about past outcomes.',
        'Planning Fallacy': 'The tendency to underestimate time, costs, or complexity of future tasks. The AI detected optimistic projections without adequate consideration of potential obstacles.',
        'Status Quo Bias': 'A preference for the current state of affairs and resistance to change. The AI identified language favoring existing conditions without objective comparison to alternatives.',
        'Framing Effect': 'Drawing different conclusions from the same information depending on how it\'s presented. The AI detected selective presentation of information that may influence perception.',
        'Selective Perception': 'Filtering information based on expectations or desires. The AI identified patterns of interpreting data in ways that align with predetermined expectations.',
        'Recency Bias': 'Overweighting recent events over historical patterns. The AI detected disproportionate emphasis on recent data while ignoring longer-term trends.'
    };
    return definitions[biasType] || `${biasType} is a cognitive distortion that can lead to flawed decision-making. The AI detected patterns in the text that match this bias profile.`;
}

// Helper function to explain how the AI detected the bias
function getDetectionMethodology(biasType: string, excerpt: string): string {
    const methods: Record<string, string> = {
        'Confirmation Bias': 'Analyzed text for one-sided evidence presentation, absence of counterarguments, and selective data citation patterns.',
        'Anchoring Bias': 'Identified initial numeric values or statements that subsequent analysis appears tethered to, with insufficient adjustment.',
        'Sunk Cost Fallacy': 'Scanned for references to past investments (time, money, effort) used to justify future decisions rather than forward-looking analysis.',
        'Overconfidence Bias': 'Detected absolute language ("certainly", "definitely", "will"), dismissal of uncertainty, and lack of hedging or risk acknowledgment.',
        'Groupthink': 'Identified consensus language without documented debate, unanimous approval patterns, and absence of dissenting viewpoints.',
        'Authority Bias': 'Found citations of authority figures, titles, or credentials as primary justification rather than evidence-based reasoning.',
        'Bandwagon Effect': 'Detected reasoning based on market trends, competitor actions, or "everyone is doing it" justifications.',
        'Loss Aversion': 'Analyzed risk language asymmetry—identifying disproportionate focus on potential losses vs. equivalent gains.',
        'Availability Heuristic': 'Identified references to recent, memorable, or emotionally salient events without base rate consideration.',
        'Hindsight Bias': 'Detected post-event language claiming predictability ("we knew", "it was obvious", "as expected").',
        'Planning Fallacy': 'Analyzed projections for optimistic bias, absence of contingency buffers, and historical accuracy of similar estimates.',
        'Status Quo Bias': 'Identified resistance language, risk framing of change, and insufficient comparative analysis of alternatives.',
        'Framing Effect': 'Detected selective presentation of statistics, emphasis patterns, and language that could influence perception.',
        'Selective Perception': 'Analyzed interpretation patterns for consistency with stated expectations or desired outcomes.',
        'Recency Bias': 'Compared temporal weighting of evidence—identifying overemphasis on recent vs. historical data.'
    };
    const wordCount = excerpt.split(' ').length;
    return `${methods[biasType] || 'Applied psycholinguistic pattern matching to identify cognitive distortion markers.'} The flagged excerpt (${wordCount} words) triggered this detection with high confidence.`;
}

// Helper function to assess impact based on bias type and severity
function getImpactAssessment(biasType: string, severity: string): string {
    const severityImpacts: Record<string, string> = {
        'low': 'Minor impact on decision quality. May slightly skew perception but unlikely to cause significant harm if addressed.',
        'medium': 'Moderate impact on decision quality. Could lead to suboptimal outcomes if not corrected. Warrants attention in review process.',
        'high': 'Significant impact on decision quality. High probability of leading to flawed conclusions. Requires immediate attention and correction.',
        'critical': 'Severe impact on decision quality. This bias pattern could fundamentally undermine the validity of the analysis and lead to catastrophic outcomes.'
    };

    const biasRisks: Record<string, string> = {
        'Confirmation Bias': 'May cause rejection of valid counterevidence and missed opportunities.',
        'Overconfidence Bias': 'Can lead to inadequate risk preparation and unexpected failures.',
        'Sunk Cost Fallacy': 'May perpetuate losing investments and delay necessary pivots.',
        'Groupthink': 'Suppresses innovation and can lead to catastrophic blind spots.',
        'Hindsight Bias': 'Prevents learning from experience and distorts future planning.',
        'Planning Fallacy': 'Leads to budget overruns, missed deadlines, and resource misallocation.'
    };

    return `${severityImpacts[severity] || severityImpacts['medium']} ${biasRisks[biasType] || 'This bias type can distort judgment and lead to flawed decision-making.'}`;
}

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

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Simulation failed');
            }
            const data = await res.json();

            setSimulationResult(data);
            setScanProgress(100);
            setStreamLogs(prev => [...prev, { msg: 'Simulation complete. Score Delta calculated.', type: 'success' }]);
            showToast('Simulation complete', 'success');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Simulation failed';
            setStreamLogs(prev => [...prev, { msg: `ERROR: ${msg}`, type: 'bias' }]);
            showToast(msg, 'error');
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                    if (update.type === 'error') {
                        throw new Error(update.message || 'Analysis failed during stream');
                    }
                });
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Live scan failed';
            setStreamLogs(prev => [...prev, { msg: `CRITICAL_ERROR: ${msg}`, type: 'bias' }]);
            showToast(msg, 'error');
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

                        {
                            streamLogs.map((log, i) => (
                                <div key={i} style={{ marginBottom: '4px', color: log.type === 'bias' ? 'var(--error)' : log.type === 'success' ? 'var(--success)' : 'var(--text-secondary)' }}>
                                    <span style={{ color: '#444' }}>[{new Date().toLocaleTimeString([], { hour12: false })}]</span> {log.msg}
                                </div>
                            ))
                        }
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

                    {/* Simulation Result - Structured Comparison View */}
                    {simulationResult && (
                        <div className="card" style={{ borderColor: 'var(--accent-secondary)', background: 'rgba(10, 132, 255, 0.03)' }}>
                            <div className="card-header justify-between" style={{ background: 'rgba(10, 132, 255, 0.1)' }}>
                                <h3 className="flex items-center gap-sm" style={{ color: 'var(--accent-secondary)' }}>
                                    <CheckCircle size={16} />
                                    SIMULATION RESULTS
                                </h3>
                                <button onClick={() => setSimulationResult(null)} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }}>
                                    <RefreshCw size={12} /> Clear
                                </button>
                            </div>
                            <div className="card-body" style={{ padding: 'var(--spacing-lg)' }}>
                                {/* Score Comparison - Visual Gauge */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--spacing-xl)',
                                    marginBottom: 'var(--spacing-lg)',
                                    padding: 'var(--spacing-lg)',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    {/* Before Score */}
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>ORIGINAL</div>
                                        <div style={{
                                            fontSize: '2.5rem',
                                            fontWeight: 800,
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {analysis ? Math.round(analysis.overallScore) : '--'}
                                        </div>
                                    </div>

                                    {/* Arrow + Delta */}
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            fontSize: '24px',
                                            color: simulationResult.overallScore > (analysis?.overallScore || 0) ? 'var(--success)' : 'var(--error)'
                                        }}>
                                            →
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            padding: '4px 12px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: simulationResult.overallScore > (analysis?.overallScore || 0) ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: simulationResult.overallScore > (analysis?.overallScore || 0) ? 'var(--success)' : 'var(--error)'
                                        }}>
                                            {simulationResult.overallScore > (analysis?.overallScore || 0) ? '+' : ''}{Math.round(simulationResult.overallScore - (analysis?.overallScore || 0))} pts
                                        </div>
                                    </div>

                                    {/* After Score */}
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>PROJECTED</div>
                                        <div style={{
                                            fontSize: '2.5rem',
                                            fontWeight: 800,
                                            color: simulationResult.overallScore >= 70 ? 'var(--success)' : simulationResult.overallScore >= 40 ? 'var(--warning)' : 'var(--error)'
                                        }}>
                                            {Math.round(simulationResult.overallScore)}
                                        </div>
                                    </div>
                                </div>

                                {/* Metrics Comparison Table */}
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    marginBottom: 'var(--spacing-lg)'
                                }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '11px', color: 'var(--text-muted)' }}>METRIC</th>
                                            <th style={{ textAlign: 'center', padding: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>ORIGINAL</th>
                                            <th style={{ textAlign: 'center', padding: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>PROJECTED</th>
                                            <th style={{ textAlign: 'center', padding: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>CHANGE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '12px 0', fontSize: '13px' }}>Decision Quality Score</td>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{analysis ? Math.round(analysis.overallScore) : '--'}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{Math.round(simulationResult.overallScore)}</td>
                                            <td style={{
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                color: simulationResult.overallScore > (analysis?.overallScore || 0) ? 'var(--success)' : 'var(--error)'
                                            }}>
                                                {simulationResult.overallScore > (analysis?.overallScore || 0) ? '↑' : '↓'} {Math.abs(Math.round(simulationResult.overallScore - (analysis?.overallScore || 0)))}
                                            </td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '12px 0', fontSize: '13px' }}>Cognitive Biases</td>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{analysis?.biases.length || 0}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{simulationResult.biases.filter((b: BiasInstance) => b.found !== false).length}</td>
                                            <td style={{
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                color: simulationResult.biases.filter((b: BiasInstance) => b.found !== false).length < (analysis?.biases.length || 0) ? 'var(--success)' : 'var(--error)'
                                            }}>
                                                {simulationResult.biases.filter((b: BiasInstance) => b.found !== false).length < (analysis?.biases.length || 0) ? '↓' : '↑'} {Math.abs(simulationResult.biases.filter((b: BiasInstance) => b.found !== false).length - (analysis?.biases.length || 0))}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '12px 0', fontSize: '13px' }}>Noise Level</td>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{analysis ? Math.round(analysis.noiseScore) : '--'}%</td>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{Math.round(simulationResult.noiseScore)}%</td>
                                            <td style={{
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                color: simulationResult.noiseScore < (analysis?.noiseScore || 0) ? 'var(--success)' : 'var(--error)'
                                            }}>
                                                {simulationResult.noiseScore < (analysis?.noiseScore || 0) ? '↓' : '↑'} {Math.abs(Math.round(simulationResult.noiseScore - (analysis?.noiseScore || 0)))}%
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Bias Changes Detail */}
                                {simulationResult.biases && simulationResult.biases.length > 0 && (
                                    <div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: 'var(--text-muted)',
                                            marginBottom: 'var(--spacing-sm)',
                                            textTransform: 'uppercase'
                                        }}>
                                            Bias Analysis
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {simulationResult.biases.slice(0, 5).map((bias: BiasInstance, idx: number) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '8px 12px',
                                                        background: 'var(--bg-tertiary)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        borderLeft: `3px solid ${bias.found === false ? 'var(--success)' : SEVERITY_COLORS[bias.severity as keyof typeof SEVERITY_COLORS] || 'var(--warning)'}`
                                                    }}
                                                >
                                                    <span style={{ fontSize: '13px' }}>{bias.biasType}</span>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        padding: '2px 8px',
                                                        borderRadius: 'var(--radius-sm)',
                                                        background: bias.found === false ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                        color: bias.found === false ? 'var(--success)' : 'var(--error)'
                                                    }}>
                                                        {bias.found === false ? '✓ RESOLVED' : 'STILL PRESENT'}
                                                    </span>
                                                </div>
                                            ))}
                                            {simulationResult.biases.length > 5 && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                                    +{simulationResult.biases.length - 5} more biases...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Summary Insight */}
                                <div style={{
                                    marginTop: 'var(--spacing-lg)',
                                    padding: 'var(--spacing-md)',
                                    background: simulationResult.overallScore > (analysis?.overallScore || 0) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: `3px solid ${simulationResult.overallScore > (analysis?.overallScore || 0) ? 'var(--success)' : 'var(--warning)'}`
                                }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: simulationResult.overallScore > (analysis?.overallScore || 0) ? 'var(--success)' : 'var(--warning)' }}>
                                        {simulationResult.overallScore > (analysis?.overallScore || 0) ? '✓ IMPROVEMENTS DETECTED' : '⚠ NEEDS MORE WORK'}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {simulationResult.overallScore > (analysis?.overallScore || 0)
                                            ? `Your edits improved the decision quality by ${Math.round(simulationResult.overallScore - (analysis?.overallScore || 0))} points. ${simulationResult.biases.filter((b: BiasInstance) => b.found === false).length} biases were addressed.`
                                            : `The edits didn't improve the score. Focus on addressing the remaining biases and reducing noise in the document.`
                                        }
                                    </div>
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
                <div className="card mt-xl" style={{ border: `1px solid ${SEVERITY_COLORS[selectedBias.severity]}20` }}>
                    <div className="card-header flex items-center justify-between" style={{ borderBottom: `1px solid ${SEVERITY_COLORS[selectedBias.severity]}30` }}>
                        <div className="flex items-center gap-md">
                            <AlertTriangle
                                size={20}
                                style={{ color: SEVERITY_COLORS[selectedBias.severity] }}
                            />
                            <h3>{selectedBias.biasType}</h3>
                            <span className={`badge badge-${selectedBias.severity}`} style={{ marginLeft: 'var(--spacing-sm)' }}>
                                {selectedBias.severity.toUpperCase()}
                            </span>
                        </div>
                        <button onClick={() => setSelectedBias(null)} className="btn btn-ghost" style={{ padding: 0 }}>CLOSE</button>
                    </div>

                    <div className="card-body" style={{ padding: 0 }}>
                        {/* Section 1: Bias Definition */}
                        <div style={{ padding: 'var(--spacing-lg)', background: 'rgba(99, 102, 241, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="flex items-center gap-sm mb-sm">
                                <Info size={14} style={{ color: 'var(--accent-primary)' }} />
                                <h4 className="text-xs text-muted uppercase">What is {selectedBias.biasType}?</h4>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {getBiasDefinition(selectedBias.biasType)}
                            </p>
                        </div>

                        <div className="grid grid-2">
                            {/* Section 2: Evidence Found */}
                            <div style={{ padding: 'var(--spacing-lg)', borderRight: '1px solid var(--border-color)' }}>
                                <h4 className="text-xs text-muted mb-md uppercase flex items-center gap-sm">
                                    <FileText size={14} />
                                    Evidence Detected
                                </h4>
                                <blockquote style={{
                                    padding: 'var(--spacing-md)',
                                    background: '#0a0a0a',
                                    borderLeft: `4px solid ${SEVERITY_COLORS[selectedBias.severity]}`,
                                    fontSize: '13px',
                                    fontStyle: 'italic',
                                    marginBottom: 'var(--spacing-md)'
                                }}>
                                    &quot;{selectedBias.excerpt}&quot;
                                </blockquote>

                                {/* AI Detection Methodology */}
                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    background: 'rgba(255, 159, 10, 0.05)',
                                    border: '1px solid rgba(255, 159, 10, 0.2)',
                                    borderRadius: 'var(--radius-sm)'
                                }}>
                                    <div className="flex items-center gap-sm mb-sm">
                                        <Terminal size={12} style={{ color: 'var(--warning)' }} />
                                        <span className="text-xs font-bold uppercase" style={{ color: 'var(--warning)' }}>AI Detection Method</span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        {getDetectionMethodology(selectedBias.biasType, selectedBias.excerpt)}
                                    </p>
                                </div>
                            </div>

                            {/* Section 3: AI Analysis */}
                            <div style={{ padding: 'var(--spacing-lg)' }}>
                                <h4 className="text-xs text-muted mb-md uppercase flex items-center gap-sm">
                                    <AlertTriangle size={14} />
                                    AI Analysis
                                </h4>
                                <p className="mb-lg" style={{ fontSize: '13px', lineHeight: 1.6 }}>{selectedBias.explanation}</p>

                                {/* Why This Matters */}
                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: 'var(--radius-sm)',
                                    marginBottom: 'var(--spacing-md)'
                                }}>
                                    <div className="flex items-center gap-sm mb-sm">
                                        <AlertTriangle size={12} style={{ color: 'var(--error)' }} />
                                        <span className="text-xs font-bold uppercase" style={{ color: 'var(--error)' }}>Impact Assessment</span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        {getImpactAssessment(selectedBias.biasType, selectedBias.severity)}
                                    </p>
                                </div>

                                {/* Correction Recommendation */}
                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    background: 'rgba(48, 209, 88, 0.05)',
                                    border: '1px solid var(--success)',
                                    borderRadius: 'var(--radius-sm)'
                                }}>
                                    <div className="flex items-center gap-sm mb-sm">
                                        <Lightbulb size={14} style={{ color: 'var(--success)' }} />
                                        <span className="text-xs font-bold uppercase" style={{ color: 'var(--success)' }}>Recommended Correction</span>
                                    </div>
                                    <p style={{ fontSize: '13px', lineHeight: 1.5 }}>{selectedBias.suggestion}</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Confidence & Methodology Footer */}
                        <div style={{
                            padding: 'var(--spacing-md) var(--spacing-lg)',
                            background: 'var(--bg-secondary)',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div className="flex items-center gap-lg">
                                <div>
                                    <span className="text-xs text-muted">Detection Model: </span>
                                    <span className="text-xs" style={{ color: 'var(--accent-primary)' }}>Gemini 3 Pro</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted">Analysis Type: </span>
                                    <span className="text-xs">Psycholinguistic Pattern Matching</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-md">
                                <span className="text-xs text-muted">Severity assessed based on language intensity and decision impact potential</span>
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
