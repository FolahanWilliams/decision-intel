import { useState } from 'react';


interface Bias {
    biasType: string;
    severity: string;
    excerpt: string;
    explanation: string;
    suggestion: string;
}

interface BiasHeatmapProps {
    content: string;
    biases: Bias[];
}

export function BiasHeatmap({ content, biases }: BiasHeatmapProps) {
    const [selectedBiasIndex, setSelectedBiasIndex] = useState<number | null>(null);

    // Click outside handler could be added here for polish, but for now simple toggle is fine

    if (!content) return null;

    // Map severity to colors
    const getSeverityColor = (severity: string, isSelected: boolean) => {
        const base = isSelected ? 'ring-2 ring-offset-1 ring-offset-accents-2' : '';
        switch (severity.toLowerCase()) {
            case 'critical': return `${base} bg-red-500/30 hover:bg-red-500/50 border-b-2 border-red-500 cursor-help`;
            case 'high': return `${base} bg-orange-500/30 hover:bg-orange-500/50 border-b-2 border-orange-500 cursor-help`;
            case 'medium': return `${base} bg-yellow-500/30 hover:bg-yellow-500/50 border-b-2 border-yellow-500 cursor-help`;
            default: return `${base} bg-blue-500/30 hover:bg-blue-500/50 border-b-2 border-blue-500 cursor-help`;
        }
    };

    // Construct text segments
    let parts: { text: string; bias?: Bias }[] = [{ text: content }];
    biases.forEach(bias => {
        if (!bias.excerpt) return;
        const newParts: { text: string; bias?: Bias }[] = [];
        parts.forEach(part => {
            if (part.bias) {
                newParts.push(part);
            } else {
                const split = part.text.split(bias.excerpt);
                if (split.length > 1) {
                    split.forEach((fragment, i) => {
                        if (fragment) newParts.push({ text: fragment });
                        if (i < split.length - 1) {
                            newParts.push({ text: bias.excerpt, bias: bias });
                        }
                    });
                } else {
                    newParts.push(part);
                }
            }
        });
        parts = newParts;
    });

    return (
        <div className="card h-full border-l-4 border-l-indigo-500 dark:border-l-indigo-400 shadow-sm flex flex-col">
            <div className="card-header pb-2">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <span className="text-2xl">🔥</span> Cognitive Bias Heatmap
                    </h3>
                    <div className="flex gap-2">
                        <span className="badge badge-error bg-red-500/10 text-red-600 border-red-200">Critical</span>
                        <span className="badge badge-warning bg-orange-500/10 text-orange-600 border-orange-200">High</span>
                        <span className="badge badge-warning bg-yellow-500/10 text-yellow-600 border-yellow-200">Med</span>
                    </div>
                </div>
            </div>
            <div className="card-body flex-1 overflow-y-auto" style={{ maxHeight: '600px' }}>
                <div
                    className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-serif p-4 bg-muted/30 rounded-lg relative"
                    onClick={() => setSelectedBiasIndex(null)} // Click background to deselect
                >
                    {parts.map((part, i) => (
                        part.bias ? (
                            <div
                                key={i}
                                className="group inline relative"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBiasIndex(selectedBiasIndex === i ? null : i);
                                }}
                            >
                                <span className={`px-0.5 rounded-sm transition-all duration-200 ${getSeverityColor(part.bias.severity, selectedBiasIndex === i)}`}>
                                    {part.text}
                                </span>

                                {/* Tooltip - Visible on Hover OR Selection */}
                                <div className={`
                                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 
                                    bg-gray-900/95 text-white text-xs rounded-lg shadow-xl 
                                    transition-all duration-200 pointer-events-none z-50 backdrop-blur-sm border border-white/10
                                    ${selectedBiasIndex === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}
                                `}>
                                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                                        <p className="font-bold text-yellow-400 text-sm">{part.bias.biasType}</p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold
                                            ${part.bias.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                                part.bias.severity === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {part.bias.severity}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 mb-3 italic">"{part.bias.excerpt}"</p>
                                    <p className="text-gray-300 mb-3">{part.bias.explanation}</p>
                                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                                        <span className="font-semibold text-indigo-300 block mb-1 flex items-center gap-1">
                                            <span>💡</span> Suggestion
                                        </span>
                                        {part.bias.suggestion}
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900/95"></div>
                                </div>
                            </div>
                        ) : (
                            <span key={i}>{part.text}</span>
                        )
                    ))}
                </div>
            </div>

            {/* Mobile Hint */}
            <div className="p-2 text-center text-[10px] text-muted border-t border-border bg-secondary/20">
                Tap highlighted text to pin details
            </div>
        </div>
    );
}
