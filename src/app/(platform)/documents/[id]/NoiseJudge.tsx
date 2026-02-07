import { AnalysisResult, NoiseBenchmark } from '@/types';
import { Activity, TrendingUp, ExternalLink } from 'lucide-react';

export function NoiseJudge({ analysis }: { analysis: AnalysisResult['noiseStats'] & { benchmarks?: NoiseBenchmark[], score: number } }) {
    if (!analysis) return null;

    const { stdDev } = analysis;
    const score = analysis.score;
    const benchmarks = analysis.benchmarks || [];

    // Color logic
    const scoreColor = score > 80 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Score */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="card">
                    <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium">Noise Score (Consistency)</h3>
                        <Activity className={`h-4 w-4 ${scoreColor}`} />
                    </div>
                    <div className="card-body">
                        <div className={`text-2xl font-bold ${scoreColor}`}>{score}/100</div>
                        <p className="text-xs text-muted-foreground">Standard Deviation: {stdDev}</p>
                        <div className="mt-2 text-xs text-muted-foreground">
                            Based on 3 parallel AI audits
                        </div>
                    </div>
                </div>
            </div>

            {/* Market Reality Check Table */}
            {benchmarks.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-500" />
                            <h3 className="card-title">Market Reality Check</h3>
                        </div>
                        <p className="text-sm text-muted">Internal Assumptions vs. External Market Consensus</p>
                    </div>
                    <div className="card-body">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Metric</th>
                                        <th className="px-4 py-3">Document Value</th>
                                        <th className="px-4 py-3">Market Consensus</th>
                                        <th className="px-4 py-3">Variance</th>
                                        <th className="px-4 py-3 rounded-tr-lg">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {benchmarks.map((b, i) => (
                                        <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">{b.metric}</td>
                                            <td className="px-4 py-3">{b.documentValue}</td>
                                            <td className="px-4 py-3">{b.marketValue}</td>
                                            <td className="px-4 py-3">
                                                <span className={`badge ${b.variance === 'High' ? 'badge-error' :
                                                    b.variance === 'Medium' ? 'badge-warning' : 'badge-success'
                                                    }`}>
                                                    {b.variance}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {b.sourceUrl ? (
                                                    <a
                                                        href={b.sourceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                                    >
                                                        Source <ExternalLink size={12} />
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
