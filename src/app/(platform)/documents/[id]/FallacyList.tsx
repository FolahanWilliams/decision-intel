'use client';

import { LogicalAnalysisResult } from '@/types';
import { AlertOctagon, Info } from 'lucide-react';

export function FallacyList({ data }: { data: LogicalAnalysisResult }) {
    if (!data || data.fallacies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-xl">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                    <Info className="w-6 h-6 text-emerald-500" />
                </div>
                <h4 className="font-medium">No Fallacies Detected</h4>
                <p className="text-sm text-muted-foreground">The reasoning in this document appears logically sound.</p>
            </div>
        );
    }

    const severityColor = (s: string) => {
        switch (s) {
            case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detected Fallacies</h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Logic Score:</span>
                    <span className={`text-lg font-bold ${data.score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {data.score}/100
                    </span>
                </div>
            </div>

            {data.fallacies.map((f, i) => (
                <div key={i} className={`p-4 rounded-lg border ${severityColor(f.severity).split(' ')[2]} bg-card`}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider mb-1 ${severityColor(f.severity)}`}>
                                {f.severity}
                            </span>
                            <h4 className="font-semibold text-foreground">{f.name}</h4>
                        </div>
                        <AlertOctagon className={`w-5 h-5 ${severityColor(f.severity).split(' ')[0]}`} />
                    </div>

                    <div className="pl-4 border-l-2 border-border my-3 italic text-muted-foreground text-sm">
                        &quot;{f.excerpt}&quot;
                    </div>

                    <p className="text-sm">
                        <span className="font-medium text-foreground">Why it&apos;s fallacious: </span>
                        {f.explanation}
                    </p>
                </div>
            ))}
        </div>
    );
}
