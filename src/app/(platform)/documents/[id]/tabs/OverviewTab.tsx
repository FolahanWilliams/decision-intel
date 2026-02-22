'use client';

import { BiasInstance } from '@prisma/client';
import { Brain, Lightbulb, ExternalLink } from 'lucide-react';
import { BiasHeatmap } from '@/components/BiasHeatmap';
import { BiasNetwork } from '@/components/visualizations/BiasNetwork';
import { RiskHeatMap } from '@/components/visualizations/RiskHeatMap';
import { DecisionTimeline } from '@/components/visualizations/DecisionTimeline';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ResearchInsight } from '@/types';

interface ExtendedBiasInstance extends BiasInstance {
    researchInsight: ResearchInsight;
}

interface OverviewTabProps {
    documentContent: string;
    biases: BiasInstance[];
    uploadedAt: string;
    analysisCreatedAt?: string;
}

export function OverviewTab({ documentContent, biases, uploadedAt, analysisCreatedAt }: OverviewTabProps) {
    return (
        <div className="flex flex-col gap-lg">
            <ErrorBoundary sectionName="Bias Visualizations">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg h-[500px]">
                    <BiasHeatmap content={documentContent} biases={biases} />
                    <div className="card">
                        <div className="card-header">
                            <h4>Bias Network Map</h4>
                        </div>
                        <div className="card-body h-full">
                            <BiasNetwork biases={biases.map((b, i) => ({ ...b, id: b.id || `bias-${i}`, category: 'cognitive' }))} />
                        </div>
                    </div>
                </div>
            </ErrorBoundary>

            <ErrorBoundary sectionName="Decision Timeline & Risk Map">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mt-lg">
                    <div className="card">
                        <div className="card-header">
                            <h4>Decision Timeline</h4>
                        </div>
                        <div className="card-body">
                            <DecisionTimeline events={[
                                { id: '1', date: new Date(uploadedAt).toLocaleDateString(), title: 'Document Uploaded', description: 'Initial file ingestion.', type: 'info', status: 'completed' },
                                { id: '2', date: analysisCreatedAt ? new Date(analysisCreatedAt).toLocaleDateString() : 'Pending', title: 'AI Audit Completed', description: 'Deep scan for biases and noise.', type: 'decision', status: 'completed' },
                            ]} />
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header">
                            <h4>Risk Landscape</h4>
                        </div>
                        <div className="card-body">
                            <RiskHeatMap risks={biases.map(b => ({
                                category: b.biasType,
                                impact: b.severity === 'critical' ? 90 : b.severity === 'high' ? 70 : b.severity === 'medium' ? 50 : 30,
                                probability: 60
                            }))} />
                        </div>
                    </div>
                </div>
            </ErrorBoundary>

            <div className="card">
                <div className="card-header"><h3 className="flex items-center gap-2"><Brain size={16} /> Bias Details</h3></div>
                <div className="card-body">
                    {biases.length === 0 ? (
                        <div className="text-center p-8 text-muted">No cognitive biases detected.</div>
                    ) : (
                        <div className="space-y-4">
                            {biases.map((bias, i) => (
                                <div key={i} className={`p-4 border bg-card/50 ${bias.severity === 'critical' ? 'border-red-500/20 bg-red-500/5' : 'border-border'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className={`text-xs font-bold uppercase px-2 py-0.5 ${bias.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}`}>{bias.biasType}</span>
                                        </div>
                                        <span className="text-xs text-muted capitalize">{bias.severity} Severity</span>
                                    </div>
                                    <p className="text-sm italic text-slate-300 border-l-2 border-slate-700 pl-3 my-2">&quot;{bias.excerpt}&quot;</p>
                                    <p className="text-sm text-slate-400 mb-3">{bias.explanation}</p>

                                    {(bias as unknown as ExtendedBiasInstance).researchInsight && (
                                        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Lightbulb className="w-4 h-4 text-blue-400" />
                                                <span className="text-xs font-semibold text-blue-300">Scientific Insight</span>
                                            </div>
                                            <a
                                                href={(bias as unknown as ExtendedBiasInstance).researchInsight.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-blue-300 hover:text-blue-200 block mb-1"
                                            >
                                                {(bias as unknown as ExtendedBiasInstance).researchInsight.title} <ExternalLink size={10} className="inline ml-1" />
                                            </a>
                                            <p className="text-xs text-slate-400">{(bias as unknown as ExtendedBiasInstance).researchInsight.summary}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
