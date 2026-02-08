import { InstitutionalMemoryResult } from '@/types';
import { History, AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';

interface InstitutionalMemoryWidgetProps {
    memory: InstitutionalMemoryResult;
}

export function InstitutionalMemoryWidget({ memory }: InstitutionalMemoryWidgetProps) {
    if (!memory) return null;

    const getOutcomeIcon = (outcome: string) => {
        switch (outcome) {
            case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-success" />;
            case 'FAILURE': return <XCircle className="w-4 h-4 text-error" />;
            default: return <AlertTriangle className="w-4 h-4 text-warning" />;
        }
    };

    return (
        <div className="card animate-fade-in mt-6 border-l-4 border-l-purple-500">
            <div className="card-header flex items-center gap-2 pb-2 border-b border-border/50">
                <History className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Institutional Memory</h3>
                <span className="ml-auto text-xs font-mono text-muted bg-surface-hover px-2 py-0.5 rounded-full">
                    Recall: {memory.recallScore}%
                </span>
            </div>

            <div className="card-body space-y-4 pt-4">
                {/* Strategic Advice */}
                <div className="bg-surface-hover/50 p-3 rounded-md text-sm italic text-muted border border-border/50">
                    "{memory.strategicAdvice}"
                </div>

                {/* Similar Cases List */}
                <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-muted">Similar Past Decisions</h4>
                    {memory.similarEvents.length === 0 ? (
                        <p className="text-sm text-muted">No similar historical cases found.</p>
                    ) : (
                        memory.similarEvents.map((event, idx) => (
                            <div key={idx} className="group relative bg-surface p-3 rounded-md border border-border hover:border-purple-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-3 h-3 text-muted" />
                                        <span className="text-sm font-medium truncate max-w-[180px]">{event.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs">
                                        {getOutcomeIcon(event.outcome)}
                                        <span className={
                                            event.outcome === 'SUCCESS' ? 'text-success' :
                                                event.outcome === 'FAILURE' ? 'text-error' : 'text-warning'
                                        }>{event.outcome}</span>
                                    </div>
                                </div>

                                <div className="text-xs text-muted mb-2">
                                    {event.date} • {Math.round(event.similarity * 100)}% Match
                                </div>

                                <div className="text-xs bg-surface-hover p-2 rounded text-foreground/80">
                                    <span className="font-semibold text-purple-400">Lesson:</span> {event.lessonLearned}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
