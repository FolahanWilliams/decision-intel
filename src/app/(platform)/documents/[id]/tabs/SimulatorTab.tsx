'use client';

import { useState, useEffect } from 'react';
import { Info, PlayCircle, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { BiasInstance } from '@prisma/client';
import { useToast } from '@/components/ui/ToastContext';

const SEVERITY_COLORS: Record<string, string> = {
    low: 'var(--severity-low)',
    medium: 'var(--severity-medium)',
    high: 'var(--severity-high)',
    critical: 'var(--severity-critical)'
};

interface SimulationResult {
    overallScore: number;
    noiseScore: number;
    biases: BiasInstance[];
    summary: string;
}

interface SimulatorTabProps {
    documentContent: string;
    documentId: string;
    originalScore?: number;
    originalNoiseScore?: number;
    originalBiasCount: number;
}

export function SimulatorTab({ documentContent, documentId, originalScore, originalNoiseScore, originalBiasCount }: SimulatorTabProps) {
    const draftKey = `simulator_draft_${documentId}`;
    const [editableContent, setEditableContent] = useState(documentContent);

    // Hydration-safe: restore draft from localStorage after mount
    useEffect(() => {
        const saved = localStorage.getItem(draftKey);
        if (saved) setEditableContent(saved);
    }, [draftKey]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
    const { showToast } = useToast();

    // Persist draft
    const handleContentChange = (value: string) => {
        setEditableContent(value);
        // Debounced persist handled in useEffect of parent — here we persist immediately
        setTimeout(() => {
            if (value) localStorage.setItem(draftKey, value);
        }, 500);
    };

    const runSimulation = async () => {
        if (!editableContent.trim()) return;
        setIsSimulating(true);

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
            showToast('Simulation complete', 'success');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Simulation failed';
            showToast(msg, 'error');
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <>
            <div className="card">
                <div className="card-header justify-between">
                    <h3 className="flex items-center gap-sm">
                        <Info size={16} /> &quot;WHAT-IF&quot; SIMULATOR (MODIFIABLE)
                    </h3>
                    <div className="flex items-center gap-sm">
                        <button
                            onClick={() => {
                                setEditableContent(documentContent);
                                localStorage.removeItem(draftKey);
                                setSimulationResult(null);
                            }}
                            className="btn btn-ghost"
                            style={{ padding: '2px 8px', fontSize: '10px' }}
                            title="Discard draft and restore original document"
                        >
                            Reset
                        </button>
                        <button
                            onClick={runSimulation}
                            disabled={isSimulating || !editableContent.trim()}
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '10px' }}
                        >
                            {isSimulating ? <Loader2 size={12} className="animate-spin" /> : <PlayCircle size={12} />}
                            SIMULATE SCAN
                        </button>
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <textarea
                        value={editableContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                        aria-label="Editable document content for simulation"
                        style={{
                            width: '100%',
                            minHeight: '400px',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: 'none',
                            padding: '24px',
                            fontSize: '14px',
                            lineHeight: '1.8',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            outline: 'none'
                        }}
                    />
                    {!editableContent.trim() && (
                        <p className="text-xs text-muted px-6 py-2">
                            Document content is empty — paste or type content to simulate.
                        </p>
                    )}
                </div>
            </div>

            {/* Simulation Results */}
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
                        {/* Score Comparison */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--spacing-xl)',
                            marginBottom: 'var(--spacing-lg)',
                            padding: 'var(--spacing-lg)',
                            background: 'var(--bg-secondary)',
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>ORIGINAL</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                                    {originalScore != null ? Math.round(originalScore) : '--'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: '24px',
                                    color: simulationResult.overallScore > (originalScore || 0) ? 'var(--success)' : 'var(--error)'
                                }}>
                                    →
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    padding: '4px 12px',
                                    background: simulationResult.overallScore > (originalScore || 0) ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    color: simulationResult.overallScore > (originalScore || 0) ? 'var(--success)' : 'var(--error)'
                                }}>
                                    {simulationResult.overallScore > (originalScore || 0) ? '+' : ''}{Math.round(simulationResult.overallScore - (originalScore || 0))} pts
                                </div>
                            </div>
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

                        {/* Metrics Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--spacing-lg)' }}>
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
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{originalScore != null ? Math.round(originalScore) : '--'}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{Math.round(simulationResult.overallScore)}</td>
                                    <td style={{
                                        textAlign: 'center', fontWeight: 600,
                                        color: simulationResult.overallScore > (originalScore || 0) ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {simulationResult.overallScore > (originalScore || 0) ? '↑' : '↓'} {Math.abs(Math.round(simulationResult.overallScore - (originalScore || 0)))}
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px 0', fontSize: '13px' }}>Cognitive Biases</td>
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{originalBiasCount}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{simulationResult.biases.filter((b: BiasInstance) => (b as BiasInstance & { found?: boolean }).found !== false).length}</td>
                                    <td style={{
                                        textAlign: 'center', fontWeight: 600,
                                        color: simulationResult.biases.filter((b: BiasInstance) => (b as BiasInstance & { found?: boolean }).found !== false).length < originalBiasCount ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {simulationResult.biases.filter((b: BiasInstance) => (b as BiasInstance & { found?: boolean }).found !== false).length < originalBiasCount ? '↓' : '↑'} {Math.abs(simulationResult.biases.filter((b: BiasInstance) => (b as BiasInstance & { found?: boolean }).found !== false).length - originalBiasCount)}
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px 0', fontSize: '13px' }}>Noise Level</td>
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{originalNoiseScore != null ? Math.round(originalNoiseScore) : '--'}%</td>
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{Math.round(simulationResult.noiseScore)}%</td>
                                    <td style={{
                                        textAlign: 'center', fontWeight: 600,
                                        color: simulationResult.noiseScore < (originalNoiseScore || 0) ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {simulationResult.noiseScore < (originalNoiseScore || 0) ? '↓' : '↑'} {Math.abs(Math.round(simulationResult.noiseScore - (originalNoiseScore || 0)))}%
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bias Changes */}
            {simulationResult && simulationResult.biases.length > 0 && (
                <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' }}>
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
                                    borderLeft: `3px solid ${(bias as BiasInstance & { found?: boolean }).found === false ? 'var(--success)' : SEVERITY_COLORS[bias.severity as keyof typeof SEVERITY_COLORS] || 'var(--warning)'}`
                                }}
                            >
                                <span style={{ fontSize: '13px' }}>{bias.biasType}</span>
                                <span style={{
                                    fontSize: '10px',
                                    padding: '2px 8px',
                                    background: (bias as BiasInstance & { found?: boolean }).found === false ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    color: (bias as BiasInstance & { found?: boolean }).found === false ? 'var(--success)' : 'var(--error)'
                                }}>
                                    {(bias as BiasInstance & { found?: boolean }).found === false ? '✓ RESOLVED' : 'STILL PRESENT'}
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
            {simulationResult && (
                <div style={{
                    marginTop: 'var(--spacing-lg)',
                    padding: 'var(--spacing-md)',
                    background: simulationResult.overallScore > (originalScore || 0) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    borderLeft: `3px solid ${simulationResult.overallScore > (originalScore || 0) ? 'var(--success)' : 'var(--warning)'}`
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: simulationResult.overallScore > (originalScore || 0) ? 'var(--success)' : 'var(--warning)' }}>
                        {simulationResult.overallScore > (originalScore || 0) ? '✓ IMPROVEMENTS DETECTED' : '⚠ NEEDS MORE WORK'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {simulationResult.overallScore > (originalScore || 0)
                            ? `Your edits improved the decision quality by ${Math.round(simulationResult.overallScore - (originalScore || 0))} points. ${simulationResult.biases?.filter((b: BiasInstance) => (b as BiasInstance & { found?: boolean }).found === false).length || 0} biases were addressed.`
                            : `The edits didn't improve the score. Focus on addressing the remaining biases and reducing noise in the document.`
                        }
                    </div>
                </div>
            )}
        </>
    );
}
