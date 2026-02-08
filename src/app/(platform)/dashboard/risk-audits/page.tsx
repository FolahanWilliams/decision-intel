'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ShieldAlert, FileText, AlertTriangle, CheckCircle,
    Loader2, TrendingUp, TrendingDown, ArrowRight,
    AlertCircle, Shield, BarChart3, Trash2
} from 'lucide-react';

interface DocumentWithRisk {
    id: string;
    filename: string;
    status: string;
    uploadedAt: string;
    analyses: {
        overallScore: number;
        noiseScore: number;
        biases: { severity: string; biasType: string }[];
        factCheck?: { score: number };
    }[];
}

interface RiskSummary {
    totalDocuments: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    averageScore: number;
    criticalBiases: number;
}

export default function RiskAuditsPage() {
    const [documents, setDocuments] = useState<DocumentWithRisk[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<RiskSummary | null>(null);

    // Delete state
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; docId: string; filename: string }>({
        open: false, docId: '', filename: ''
    });
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchRiskData = async () => {
            try {
                // Optimized: Fetch all data in one request with ?detailed=true
                const res = await fetch('/api/documents?detailed=true');
                if (res.ok) {
                    const docs = await res.json();

                    // Filter for docs that have analysis data
                    // The API now returns the structure we need directly
                    const validDocs = docs.filter((d: any) => d.analyses && d.analyses.length > 0);

                    // Map to expected internal format if needed, or use as is
                    // The API returns analyses: [{ overallScore, noiseScore, ... }]
                    // which matches our DocumentWithRisk interface (mostly)

                    setDocuments(validDocs);

                    // Calculate risk summary
                    const summary = calculateRiskSummary(validDocs);
                    setSummary(summary);
                }
            } catch (err) {
                console.error('Failed to fetch risk data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRiskData();
    }, []);

    const calculateRiskSummary = (docs: DocumentWithRisk[]): RiskSummary => {
        let highRisk = 0, mediumRisk = 0, lowRisk = 0, criticalBiases = 0;
        let totalScore = 0;

        docs.forEach(doc => {
            const analysis = doc.analyses[0];
            if (!analysis) return;

            const score = analysis.overallScore;
            totalScore += score;

            if (score < 40) highRisk++;
            else if (score < 70) mediumRisk++;
            else lowRisk++;

            // Count critical biases
            criticalBiases += analysis.biases.filter(b => b.severity === 'critical' || b.severity === 'high').length;
        });

        return {
            totalDocuments: docs.length,
            highRiskCount: highRisk,
            mediumRiskCount: mediumRisk,
            lowRiskCount: lowRisk,
            averageScore: docs.length > 0 ? Math.round(totalScore / docs.length) : 0,
            criticalBiases
        };
    };

    const getRiskLevel = (score: number): { label: string; color: string; bg: string } => {
        if (score < 40) return { label: 'HIGH RISK', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)' };
        if (score < 70) return { label: 'MEDIUM RISK', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' };
        return { label: 'LOW RISK', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)' };
    };

    // Delete handler
    const handleDelete = async () => {
        if (!deleteModal.docId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/documents/${deleteModal.docId}`, { method: 'DELETE' });
            if (res.ok) {
                setDocuments(prev => prev.filter(d => d.id !== deleteModal.docId));
                // Recalculate summary
                const newDocs = documents.filter(d => d.id !== deleteModal.docId);
                setSummary(calculateRiskSummary(newDocs));
                setDeleteModal({ open: false, docId: '', filename: '' });
            }
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setDeleting(false);
        }
    };

    // Export handler
    const handleExportReport = async () => {
        if (!documents || documents.length === 0 || !summary) return;

        try {
            const { AggregatePdfGenerator } = await import('@/lib/reports/aggregate-pdf-generator');
            const generator = new AggregatePdfGenerator();
            generator.generateRiskReport(documents, summary);
        } catch (err) {
            console.error('Failed to generate report:', err);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                    <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
            {/* Header */}
            <header className="mb-xl">
                <div className="flex items-center gap-md mb-sm">
                    <ShieldAlert size={28} style={{ color: 'var(--accent-primary)' }} />
                    <h1>Risk Audits</h1>
                </div>
                <p className="text-muted">
                    Comprehensive risk assessment across all analyzed documents
                </p>
            </header>

            {/* Risk Summary Cards */}
            {summary && (
                <div className="grid grid-4 mb-xl gap-md">
                    <div className="card animate-fade-in">
                        <div className="card-body text-center p-md">
                            <div className="text-xs text-muted uppercase tracking-wider mb-sm">Total Documents</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                                {summary.totalDocuments}
                            </div>
                            <div className="text-xs text-muted">Analyzed</div>
                        </div>
                    </div>

                    <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="card-body text-center p-md">
                            <div className="text-xs text-muted uppercase tracking-wider mb-sm">Average Score</div>
                            <div style={{
                                fontSize: '2.5rem', fontWeight: 800,
                                color: summary.averageScore >= 70 ? 'var(--success)' :
                                    summary.averageScore >= 40 ? 'var(--warning)' : 'var(--error)'
                            }}>
                                {summary.averageScore}
                            </div>
                            <div className="text-xs text-muted flex items-center justify-center gap-xs">
                                {summary.averageScore >= 50 ? (
                                    <><TrendingUp size={12} style={{ color: 'var(--success)' }} /> Good</>
                                ) : (
                                    <><TrendingDown size={12} style={{ color: 'var(--error)' }} /> Needs Attention</>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="card-body text-center p-md">
                            <div className="text-xs text-muted uppercase tracking-wider mb-sm">High Risk Items</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--error)' }}>
                                {summary.highRiskCount}
                            </div>
                            <div className="text-xs text-muted">Require Action</div>
                        </div>
                    </div>

                    <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <div className="card-body text-center p-md">
                            <div className="text-xs text-muted uppercase tracking-wider mb-sm">Critical Biases</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--warning)' }}>
                                {summary.criticalBiases}
                            </div>
                            <div className="text-xs text-muted">Total Detected</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Risk Distribution */}
            {summary && summary.totalDocuments > 0 && (
                <div className="card mb-xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <div className="card-header">
                        <h3 className="flex items-center gap-sm">
                            <BarChart3 size={18} />
                            Risk Distribution
                        </h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', height: '40px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            {summary.highRiskCount > 0 && (
                                <div style={{
                                    flex: summary.highRiskCount,
                                    background: 'var(--error)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: 600
                                }}>
                                    High ({summary.highRiskCount})
                                </div>
                            )}
                            {summary.mediumRiskCount > 0 && (
                                <div style={{
                                    flex: summary.mediumRiskCount,
                                    background: 'var(--warning)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#000',
                                    fontSize: '12px',
                                    fontWeight: 600
                                }}>
                                    Medium ({summary.mediumRiskCount})
                                </div>
                            )}
                            {summary.lowRiskCount > 0 && (
                                <div style={{
                                    flex: summary.lowRiskCount,
                                    background: 'var(--success)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: 600
                                }}>
                                    Low ({summary.lowRiskCount})
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Documents List */}
            <div className="card animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="card-header">
                    <h3 className="flex items-center gap-sm">
                        <Shield size={18} />
                        Document Risk Assessment
                    </h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {documents.length === 0 ? (
                        <div className="flex flex-col items-center gap-md" style={{ padding: 'var(--spacing-2xl)' }}>
                            <AlertCircle size={48} style={{ color: 'var(--text-muted)' }} />
                            <p className="text-muted text-center">
                                No analyzed documents found.<br />
                                <Link href="/dashboard" style={{ color: 'var(--accent-primary)' }}>
                                    Upload and analyze documents
                                </Link> to see risk assessments.
                            </p>
                        </div>
                    ) : (
                        documents.map((doc, idx) => {
                            const analysis = doc.analyses[0];
                            const risk = getRiskLevel(analysis.overallScore);
                            const biasCount = analysis.biases.length;

                            return (
                                <div
                                    key={doc.id}
                                    style={{
                                        padding: 'var(--spacing-lg)',
                                        borderBottom: idx < documents.length - 1 ? '1px solid var(--border-color)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: risk.bg
                                    }}
                                >
                                    <div className="flex items-center gap-lg">
                                        <div style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--bg-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <FileText size={24} style={{ color: risk.color }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{doc.filename}</div>
                                            <div className="flex items-center gap-md">
                                                <span className="text-xs text-muted">
                                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                                </span>
                                                <span style={{
                                                    fontSize: '10px',
                                                    padding: '2px 8px',
                                                    background: risk.color,
                                                    color: '#fff',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontWeight: 600
                                                }}>
                                                    {risk.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-xl">
                                        <div className="text-center">
                                            <div className="text-xs text-muted">Score</div>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 700,
                                                color: risk.color
                                            }}>
                                                {Math.round(analysis.overallScore)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-muted">Noise</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                                                {Math.round(analysis.noiseScore)}%
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-muted">Biases</div>
                                            <div className="flex items-center gap-xs">
                                                <AlertTriangle size={14} style={{ color: biasCount > 0 ? 'var(--warning)' : 'var(--text-muted)' }} />
                                                <span style={{ fontWeight: 600 }}>{biasCount}</span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/documents/${doc.id}`}
                                            className="btn btn-secondary"
                                            style={{ fontSize: '12px' }}
                                        >
                                            View Details <ArrowRight size={14} />
                                        </Link>
                                        <button
                                            onClick={() => setDeleteModal({ open: true, docId: doc.id, filename: doc.filename })}
                                            className="btn btn-ghost"
                                            style={{ padding: '8px', color: 'var(--text-muted)' }}
                                            title="Delete document"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-3 mt-xl gap-md">
                <Link href="/dashboard" className="card" style={{ textDecoration: 'none' }}>
                    <div className="card-body flex items-center gap-md">
                        <FileText size={24} style={{ color: 'var(--accent-primary)' }} />
                        <div>
                            <div style={{ fontWeight: 600 }}>Upload Document</div>
                            <div className="text-xs text-muted">Add new document for analysis</div>
                        </div>
                    </div>
                </Link>
                <Link href="/dashboard/trends" className="card" style={{ textDecoration: 'none' }}>
                    <div className="card-body flex items-center gap-md">
                        <TrendingUp size={24} style={{ color: 'var(--accent-secondary)' }} />
                        <div>
                            <div style={{ fontWeight: 600 }}>View Trends</div>
                            <div className="text-xs text-muted">Historical analysis patterns</div>
                        </div>
                    </div>
                </Link>
                <div className="card" onClick={handleExportReport} style={{ cursor: 'pointer' }}>
                    <div className="card-body flex items-center gap-md">
                        <CheckCircle size={24} style={{ color: 'var(--success)' }} />
                        <div>
                            <div style={{ fontWeight: 600 }}>Export Report</div>
                            <div className="text-xs text-muted">Generate PDF Summary</div>
                        </div>
                    </div>
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
        </div>
    );
}
