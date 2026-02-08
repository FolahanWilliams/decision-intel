import { ComplianceResult } from '@/types';
import { ShieldCheck, ShieldAlert, AlertOctagon, CheckCircle, XCircle, Search, ExternalLink } from 'lucide-react';

interface RegulatoryHorizonWidgetProps {
    compliance: ComplianceResult;
}

export function RegulatoryHorizonWidget({ compliance }: RegulatoryHorizonWidgetProps) {
    if (!compliance) return null;



    return (
        <div className="card bg-cyan-950/10 border-l-4 border-l-cyan-500 backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.1)] mb-12">
            <div className="card-header flex items-center justify-between pb-4 border-b border-cyan-500/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                        {compliance.status === 'PASS' ? <ShieldCheck /> :
                            compliance.status === 'FAIL' ? <AlertOctagon /> :
                                <ShieldAlert />}
                    </div>
                    <h3 className="text-lg font-semibold text-white">Regulatory Alignment</h3>
                </div>
                <div className={`text-xl font-bold px-4 py-1.5 rounded-full border bg-black/40 ${compliance.status === 'PASS' ? 'text-emerald-400 border-emerald-500/30' :
                    compliance.status === 'FAIL' ? 'text-red-400 border-red-500/30' : 'text-amber-400 border-amber-500/30'
                    }`}>
                    {compliance.status}
                </div>
            </div>

            <div className="card-body pt-6">
                {/* Executive Summary */}
                <div className="bg-cyan-900/20 p-5 rounded-lg mb-8 border border-cyan-500/20">
                    <h4 className="text-xs font-bold uppercase text-cyan-400 tracking-widest mb-3">Executive Summary</h4>
                    <p className="text-sm leading-relaxed text-cyan-100/80">{compliance.summary}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Risk Score */}
                    <div className="col-span-1 lg:border-r border-neutral-800/50 pr-6">
                        <div className="text-center py-4">
                            <div className="relative inline-block">
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-neutral-800"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={351.86}
                                        strokeDashoffset={351.86 - (351.86 * compliance.riskScore) / 100}
                                        className={`${compliance.riskScore > 70 ? 'text-red-500' : compliance.riskScore > 40 ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
                                    />
                                </svg>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                    <div className="text-3xl font-bold text-white">{compliance.riskScore}</div>
                                </div>
                            </div>

                            <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mt-2">Compliance Risk Score</div>
                            <div className="mt-2 text-[10px] text-neutral-500 px-4">
                                Higher score indicates greater regulatory risk exposure.
                            </div>
                        </div>
                    </div>

                    {/* Regulations List */}
                    <div className="col-span-1 lg:col-span-2 space-y-4">
                        <h4 className="text-xs font-bold uppercase text-neutral-500 mb-4 flex items-center gap-2 tracking-widest">
                            <ShieldCheck size={14} /> Regulatory Frameworks Analyzed
                        </h4>
                        {compliance.regulations.map((reg, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-neutral-900/40 border border-neutral-800 hover:border-cyan-500/30 transition-all duration-200">
                                <div className="mt-1 p-1 rounded bg-black/30">
                                    {reg.status === 'COMPLIANT' ? <CheckCircle size={16} className="text-emerald-500" /> :
                                        reg.status === 'NON_COMPLIANT' ? <XCircle size={16} className="text-red-500" /> :
                                            <AlertOctagon size={16} className="text-amber-500" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-sm text-white">{reg.name}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${reg.riskLevel === 'low' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                                            reg.riskLevel === 'medium' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                                'border-red-500/30 text-red-400 bg-red-500/10'
                                            }`}>
                                            {reg.riskLevel} Risk
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-400 leading-relaxed">{reg.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Search Queries Footer */}
                {compliance.searchQueries.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-cyan-500/10">
                        <div className="flex items-center gap-2 text-xs text-cyan-500/70 mb-3">
                            <Search size={12} />
                            <span className="uppercase font-bold tracking-wider">Live Verification Searches Performed</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {compliance.searchQueries.map((query, idx) => (
                                <span key={idx} className="px-3 py-1.5 rounded bg-black/30 text-[10px] font-mono text-cyan-300 border border-cyan-500/20 flex items-center gap-1.5 hover:bg-cyan-500/10 transition-colors cursor-default">
                                    {query} <ExternalLink size={8} className="opacity-50" />
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
