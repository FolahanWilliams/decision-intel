


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
    if (!content) return null;

    // Map severity to colors
    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'bg-red-500/30 hover:bg-red-500/50 border-b-2 border-red-500 cursor-help';
            case 'high': return 'bg-orange-500/30 hover:bg-orange-500/50 border-b-2 border-orange-500 cursor-help';
            case 'medium': return 'bg-yellow-500/30 hover:bg-yellow-500/50 border-b-2 border-yellow-500 cursor-help';
            default: return 'bg-blue-500/30 hover:bg-blue-500/50 border-b-2 border-blue-500 cursor-help';
        }
    };

    // We need to construct an array of text segments and bias objects
    let parts: { text: string; bias?: Bias }[] = [{ text: content }];

    biases.forEach(bias => {
        if (!bias.excerpt) return;
        const newParts: { text: string; bias?: Bias }[] = [];

        parts.forEach(part => {
            if (part.bias) {
                newParts.push(part); // Already processed/highlighted
            } else {
                // Try to split this text part by the current bias excerpt
                // Note: String.split(string) replaces ALL occurrences. 
                // To be safer, we might want to split only the first one if we knew position, but we don't.
                // For this MVP, highlighting all occurrences of the exact excerpt phrase is acceptable behavior 
                // (if the phrase appears multiple times, it's likely biased multiple times).
                const split = part.text.split(bias.excerpt);
                if (split.length > 1) {
                    // Found a match (or multiple)
                    split.forEach((fragment, i) => {
                        if (fragment) newParts.push({ text: fragment });
                        if (i < split.length - 1) {
                            newParts.push({ text: bias.excerpt, bias: bias }); // Insert the highlight
                        }
                    });
                } else {
                    newParts.push(part); // No match
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
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-serif p-4 bg-muted/30 rounded-lg">
                    {parts.map((part, i) => (
                        part.bias ? (
                            <div key={i} className="group inline relative">
                                <span className={`px-0.5 rounded-sm transition-colors ${getSeverityColor(part.bias.severity)}`}>
                                    {part.text}
                                </span>
                                {/* Custom CSS Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900/95 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm border border-white/10">
                                    <p className="font-bold text-yellow-400 mb-1">{part.bias.biasType}</p>
                                    <p className="text-gray-300 mb-2">{part.bias.explanation}</p>
                                    <div className="p-2 bg-white/10 rounded">
                                        <span className="font-semibold text-blue-300 block mb-0.5">💡 Suggestion:</span>
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
        </div>
    );
}
