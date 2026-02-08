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
        <div className="card bg-purple-500/5 hover:bg-purple-500/10 border-l-4 border-l-purple-500 backdrop-blur-sm transition-all duration-300">
            <div className="card-header flex items-center gap-3 pb-3 border-b border-purple-500/20">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                    <History className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Institutional Memory</h3>
                <span className="ml-auto text-xs font-mono text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                    Recall: {memory.recallScore}%
                </span>
            </div>

            <div className="card-body space-y-6 pt-6">
                {/* Strategic Advice */}
                <div className="bg-purple-900/40 p-4 rounded-lg text-sm italic text-purple-200 border border-purple-500/30 shadow-[0_4px_10px_rgba(168,85,247,0.1)]">
                    "{memory.strategicAdvice}"
                </div>

                {/* Similar Cases List */}
                <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-widest font-bold text-neutral-500 mb-4">Similar Past Decisions</h4>
                    {memory.similarEvents.length === 0 ? (
                        <p className="text-sm text-neutral-500 italic text-center py-4">No similar historical cases found.</p>
                    ) : (
                        memory.similarEvents.map((event, idx) => (
                            <div key={idx} className="group relative bg-neutral-900/50 p-4 rounded-lg border border-neutral-800 hover:border-purple-500/50 hover:bg-neutral-800/50 transition-all duration-300">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded bg-neutral-800 text-neutral-400 group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                                            <FileText className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium text-neutral-200 truncate max-w-[200px]">{event.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">
                                        {getOutcomeIcon(event.outcome)}
                                        <span className={
                                            event.outcome === 'SUCCESS' ? 'text-emerald-400' :
                                                event.outcome === 'FAILURE' ? 'text-red-400' : 'text-amber-400'
                                        }>{event.outcome}</span>
                                    </div>
                                </div>

                                <div className="text-xs text-neutral-500 mb-3 flex items-center gap-2">
                                    <span>{event.date}</span>
                                    <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                                    <span className="text-purple-400">{Math.round(event.similarity * 100)}% Match</span>
                                </div>

                                <div className="text-xs bg-black/40 p-3 rounded border border-neutral-800/50 text-neutral-300 group-hover:border-purple-500/20 transition-colors">
                                    <span className="font-semibold text-purple-400 uppercase tracking-wide text-[10px] block mb-1">Lesson Learned</span>
                                    {event.lessonLearned}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
