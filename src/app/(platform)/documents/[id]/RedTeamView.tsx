import { CognitiveAnalysisResult } from '@/types';
import { AlertTriangle, ExternalLink, ShieldAlert, EyeOff } from 'lucide-react';

export function RedTeamView({ analysis }: { analysis: CognitiveAnalysisResult }) {
    if (!analysis) return null;

    const { blindSpotGap, blindSpots, counterArguments } = analysis;

    // Color logic for blind spot gap
    const gapColor = blindSpotGap < 50 ? 'text-red-500' : blindSpotGap < 80 ? 'text-yellow-500' : 'text-green-500';
    const gapLabel = blindSpotGap < 50 ? 'Tunnel Vision Detected' : blindSpotGap < 80 ? 'Moderate Diversity' : 'Balanced Perspective';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Score */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="card">
                    <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium">Cognitive Diversity Score</h3>
                        <ShieldAlert className={`h-4 w-4 ${gapColor}`} />
                    </div>
                    <div className="card-body">
                        <div className={`text-2xl font-bold ${gapColor}`}>{blindSpotGap}/100</div>
                        <p className="text-xs text-muted-foreground">{gapLabel}</p>
                        {/* Simple Progress Bar */}
                        <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                            <div
                                className={`h-full ${blindSpotGap < 50 ? 'bg-red-500' : blindSpotGap < 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${blindSpotGap}%`, background: blindSpotGap < 50 ? 'var(--error)' : blindSpotGap < 80 ? 'var(--warning)' : 'var(--success)' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Blind Spots */}
            {blindSpots.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center gap-2">
                            <EyeOff className="h-5 w-5 text-orange-500" />
                            <h3 className="card-title">Blind Spots Identified</h3>
                        </div>
                        <p className="text-sm text-muted">Perspectives completely missing from the document</p>
                    </div>
                    <div className="card-body grid gap-4 md:grid-cols-2">
                        {blindSpots.map((spot, i) => (
                            <div key={i} className="flex flex-col gap-1 p-3 border rounded-lg bg-orange-500/10 border-orange-200 dark:border-orange-900" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                                <span className="font-semibold text-orange-700 dark:text-orange-300">{spot.name}</span>
                                <span className="text-sm text-muted-foreground">{spot.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Counter Arguments */}
            <h3 className="text-lg font-semibold flex items-center gap-2 mt-8">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Red Team Challenges
                <span className="badge ml-2" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{counterArguments.length}</span>
            </h3>

            <div className="grid gap-4">
                {counterArguments.map((arg, i) => (
                    <div key={i} className="card border-l-4 border-l-red-500" style={{ borderLeft: '4px solid var(--error)' }}>
                        <div className="card-body pt-6">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-red-600 dark:text-red-400">{arg.perspective}</h4>
                                    <p className="text-sm text-foreground">{arg.argument}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2 min-w-[100px]">
                                    <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>Confidence: {(arg.confidence * 100).toFixed(0)}%</span>
                                    {arg.sourceUrl && (
                                        <a
                                            href={arg.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs flex items-center gap-1 text-blue-500 hover:underline"
                                            style={{ color: 'var(--accent-primary)' }}
                                        >
                                            View Source <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
