'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { GitCompareArrows, Plus, X, FileText, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useDocuments } from '@/hooks/useDocuments';

interface ComparisonDoc {
    id: string;
    filename: string;
    score: number | null;
    noiseScore: number | null;
    biasCount: number;
    biasTypes: string[];
    factCheckScore: number | null;
    riskLevel: string | null;
}

export default function ComparePage() {
    const { documents, isLoading } = useDocuments(true, 1, 100);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [comparisonDocs, setComparisonDocs] = useState<ComparisonDoc[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const fetchVersionRef = useRef(0);

    // Derive loading from whether we have the right number of docs fetched
    const loadingDetails = selectedIds.length >= 2 && comparisonDocs.length !== selectedIds.length;

    // Fetch full details for selected documents
    useEffect(() => {
        if (selectedIds.length === 0) return;

        const version = ++fetchVersionRef.current;

        Promise.all(
            selectedIds.map((id) =>
                fetch(`/api/documents/${id}`)
                    .then((r) => r.json())
                    .catch(() => null)
            )
        ).then((results) => {
            if (version !== fetchVersionRef.current) return;
            const docs: ComparisonDoc[] = results
                .filter(Boolean)
                .map((r) => {
                    const analysis = r.document?.analyses?.[0] || r.analyses?.[0] || {};
                    const biases = analysis.biases || [];
                    return {
                        id: r.document?.id || r.id,
                        filename: r.document?.filename || r.filename || 'Unknown',
                        score: analysis.overallScore ?? null,
                        noiseScore: analysis.noiseScore ?? null,
                        biasCount: biases.length,
                        biasTypes: biases.map((b: { biasType: string }) => b.biasType),
                        factCheckScore: analysis.factCheck?.score ?? null,
                        riskLevel: analysis.overallScore != null
                            ? analysis.overallScore >= 70 ? 'Low' : analysis.overallScore >= 40 ? 'Medium' : 'High'
                            : null,
                    };
                });
            setComparisonDocs(docs);
        });
    }, [selectedIds]);

    const addDocument = (id: string) => {
        if (selectedIds.length >= 4 || selectedIds.includes(id)) return;
        setSelectedIds((prev) => [...prev, id]);
        setPickerOpen(false);
    };

    const removeDocument = (id: string) => {
        setSelectedIds((prev) => {
            const next = prev.filter((x) => x !== id);
            if (next.length === 0) setComparisonDocs([]);
            return next;
        });
    };

    const availableDocs = useMemo(
        () => documents.filter((d) => d.status === 'complete' && !selectedIds.includes(d.id)),
        [documents, selectedIds]
    );

    // Compute shared & diverging biases
    const biasAnalysis = useMemo(() => {
        if (comparisonDocs.length < 2) return null;
        const allBiasArrays = comparisonDocs.map((d) => new Set(d.biasTypes));
        const shared = [...allBiasArrays[0]].filter((b) => allBiasArrays.every((s) => s.has(b)));
        const unique = comparisonDocs.map((d) => ({
            id: d.id,
            filename: d.filename,
            biases: d.biasTypes.filter((b) => !shared.includes(b)),
        }));
        return { shared, unique };
    }, [comparisonDocs]);

    const metrics = [
        { key: 'score', label: 'Decision Quality', format: (v: number | null) => v != null ? `${v}/100` : '—', higherBetter: true },
        { key: 'noiseScore', label: 'Noise Score', format: (v: number | null) => v != null ? `${v}/100` : '—', higherBetter: false },
        { key: 'biasCount', label: 'Biases Detected', format: (v: number | null) => v != null ? String(v) : '—', higherBetter: false },
        { key: 'factCheckScore', label: 'Fact-Check Score', format: (v: number | null) => v != null ? `${v}/100` : '—', higherBetter: true },
        { key: 'riskLevel', label: 'Risk Level', format: (v: string | null) => v || '—', higherBetter: false },
    ];

    return (
        <div style={{ padding: 'var(--spacing-xl)', maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <GitCompareArrows size={24} style={{ color: 'var(--accent-primary)' }} />
                <div>
                    <h1 style={{ fontSize: '18px', margin: 0 }}>Compare Documents</h1>
                    <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
                        Select up to 4 analysed documents to compare side by side
                    </p>
                </div>
            </div>

            {/* Document selector chips */}
            <div className="flex flex-wrap gap-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>
                {selectedIds.map((id) => {
                    const doc = comparisonDocs.find((d) => d.id === id) || documents.find((d) => d.id === id);
                    return (
                        <div
                            key={id}
                            className="flex items-center gap-sm"
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                padding: '6px 12px',
                                fontSize: '13px',
                            }}
                        >
                            <FileText size={14} style={{ color: 'var(--accent-primary)' }} />
                            <span>{doc?.filename || 'Loading...'}</span>
                            <button
                                onClick={() => removeDocument(id)}
                                aria-label={`Remove ${doc?.filename || 'document'}`}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
                {selectedIds.length < 4 && (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setPickerOpen(!pickerOpen)}
                            className="flex items-center gap-xs"
                            style={{
                                background: 'var(--bg-tertiary)',
                                border: '1px dashed var(--border-color)',
                                padding: '6px 12px',
                                fontSize: '13px',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            <Plus size={14} /> Add document
                        </button>
                        {pickerOpen && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    marginTop: '4px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    width: '320px',
                                    maxHeight: '240px',
                                    overflowY: 'auto',
                                    zIndex: 20,
                                }}
                            >
                                {isLoading && (
                                    <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                        Loading documents...
                                    </div>
                                )}
                                {!isLoading && availableDocs.length === 0 && (
                                    <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                        No analysed documents available
                                    </div>
                                )}
                                {availableDocs.map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => addDocument(d.id)}
                                        className="flex items-center gap-sm"
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            background: 'transparent',
                                            border: 'none',
                                            borderBottom: '1px solid var(--border-color)',
                                            color: 'var(--text-primary)',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.filename}</span>
                                        {d.score != null && (
                                            <span style={{ fontSize: '12px', color: d.score >= 70 ? 'var(--success)' : d.score >= 40 ? 'var(--warning)' : 'var(--error)' }}>
                                                {d.score}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Empty state */}
            {selectedIds.length < 2 && (
                <div
                    className="flex flex-col items-center justify-center"
                    style={{
                        padding: 'var(--spacing-2xl)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        textAlign: 'center',
                    }}
                >
                    <GitCompareArrows size={40} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 'var(--spacing-md)' }} />
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Select at least 2 documents to compare
                    </p>
                    <p className="text-muted" style={{ fontSize: '12px' }}>
                        View score deltas, shared biases, and diverging analysis results
                    </p>
                </div>
            )}

            {/* Comparison table */}
            {comparisonDocs.length >= 2 && !loadingDetails && (
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', minWidth: '160px' }}>
                                        Metric
                                    </th>
                                    {comparisonDocs.map((doc) => (
                                        <th key={doc.id} style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--border-color)', minWidth: '150px' }}>
                                            <Link href={`/documents/${doc.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '13px' }}>
                                                {doc.filename}
                                            </Link>
                                        </th>
                                    ))}
                                    {comparisonDocs.length === 2 && (
                                        <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', minWidth: '120px' }}>
                                            Delta
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.map((metric) => {
                                    const values = comparisonDocs.map((d) => (d as Record<string, unknown>)[metric.key]);
                                    const numericValues = values.filter((v): v is number => typeof v === 'number');
                                    const best = metric.higherBetter
                                        ? Math.max(...numericValues)
                                        : Math.min(...numericValues);

                                    return (
                                        <tr key={metric.key}>
                                            <td style={{ padding: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                                                {metric.label}
                                            </td>
                                            {comparisonDocs.map((doc) => {
                                                const val = (doc as Record<string, unknown>)[metric.key];
                                                const isBest = typeof val === 'number' && val === best && numericValues.length > 1;
                                                return (
                                                    <td key={doc.id} style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: isBest ? 600 : 400, color: isBest ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                                        {metric.format(val as number | string | null)}
                                                    </td>
                                                );
                                            })}
                                            {comparisonDocs.length === 2 && (
                                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                                    <DeltaCell values={numericValues} higherBetter={metric.higherBetter} />
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bias comparison */}
            {biasAnalysis && (
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>Bias Comparison</h3>

                    {biasAnalysis.shared.length > 0 && (
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <div className="flex items-center gap-xs" style={{ fontSize: '12px', color: 'var(--warning)', marginBottom: '8px' }}>
                                <AlertTriangle size={14} />
                                <span style={{ fontWeight: 600 }}>Shared Biases ({biasAnalysis.shared.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-xs">
                                {biasAnalysis.shared.map((bias) => (
                                    <span
                                        key={bias}
                                        style={{
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            color: 'var(--warning)',
                                        }}
                                    >
                                        {bias}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {biasAnalysis.unique.filter((d) => d.biases.length > 0).map((doc) => (
                        <div key={doc.id} style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                Unique to <strong>{doc.filename}</strong>
                            </div>
                            <div className="flex flex-wrap gap-xs">
                                {doc.biases.map((bias) => (
                                    <span
                                        key={bias}
                                        style={{
                                            background: 'var(--bg-tertiary)',
                                            border: '1px solid var(--border-color)',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        {bias}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {biasAnalysis.shared.length === 0 && (
                        <div className="flex items-center gap-xs" style={{ fontSize: '12px', color: 'var(--success)' }}>
                            <CheckCircle size={14} />
                            <span>No shared biases across selected documents</span>
                        </div>
                    )}
                </div>
            )}

            {loadingDetails && selectedIds.length >= 2 && (
                <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Loading comparison data...
                </div>
            )}
        </div>
    );
}

function DeltaCell({ values, higherBetter }: { values: number[]; higherBetter: boolean }) {
    if (values.length !== 2) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    const delta = values[0] - values[1];
    if (delta === 0) return <span style={{ color: 'var(--text-muted)' }}>—</span>;

    const isPositive = higherBetter ? delta > 0 : delta < 0;
    const color = isPositive ? 'var(--success)' : 'var(--error)';
    const icon = delta > 0 ? <ArrowRight size={12} style={{ transform: 'rotate(-45deg)' }} /> : <ArrowRight size={12} style={{ transform: 'rotate(45deg)' }} />;

    return (
        <span className="flex items-center gap-xs" style={{ color, fontSize: '12px', fontWeight: 600 }}>
            {icon} {delta > 0 ? '+' : ''}{delta}
        </span>
    );
}
