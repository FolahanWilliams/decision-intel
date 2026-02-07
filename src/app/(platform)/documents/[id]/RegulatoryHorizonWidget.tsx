import { ComplianceResult } from '@/types';
import { ShieldCheck, ShieldAlert, AlertOctagon, CheckCircle, XCircle, Search, ExternalLink } from 'lucide-react';

interface RegulatoryHorizonWidgetProps {
    compliance: ComplianceResult;
}

export function RegulatoryHorizonWidget({ compliance }: RegulatoryHorizonWidgetProps) {
    if (!compliance) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PASS': return 'text-success';
            case 'FAIL': return 'text-error';
            default: return 'text-warning';
        }
    };

    const getRiskBadgeColor = (level: string) => {
        switch (level) {
            case 'low': return 'badge-success';
            case 'medium': return 'badge-warning';
            case 'high': return 'badge-error';
            case 'critical': return 'badge-critical';
            default: return 'badge-secondary';
        }
    };

    return (
        <div className="card animate-fade-in mb-xl border-t-4 border-t-cyan-500">
            <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {compliance.status === 'PASS' ? <ShieldCheck className="text-success" /> :
                        compliance.status === 'FAIL' ? <AlertOctagon className="text-error" /> :
                            <ShieldAlert className="text-warning" />}
                    <h3>Regulatory Alignment & Compliance</h3>
                </div>
                <div className={`text-xl font-bold ${getStatusColor(compliance.status)}`}>
                    {compliance.status}
                </div>
            </div>

            <div className="card-body">
                {/* Executive Summary */}
                <div className="bg-surface-hover p-4 rounded-md mb-6 border border-border/50">
                    <h4 className="text-xs font-bold uppercase text-muted mb-2">Executive Summary</h4>
                    <p className="text-sm leading-relaxed">{compliance.summary}</p>
                </div>

                <div className="grid grid-2 lg:grid-3 gap-6">
                    {/* Risk Score */}
                    <div className="col-span-1 border-r border-border/50 pr-6">
                        <div className="text-center">
                            <div className="text-4xl font-black mb-1" style={{ color: `hsl(${120 - compliance.riskScore}, 70%, 50%)` }}>
                                {compliance.riskScore}
                            </div>
                            <div className="text-xs text-muted uppercase tracking-wider">Compliance Risk Score</div>
                            <div className="mt-4 text-xs text-muted">
                                Higher score indicates greater regulatory risk exposure.
                            </div>
                        </div>
                    </div>

                    {/* Regulations List */}
                    <div className="col-span-1 lg:col-span-2 space-y-3">
                        <h4 className="text-xs font-bold uppercase text-muted mb-2 flex items-center gap-2">
                            <ShieldCheck size={14} /> Regulatory Frameworks Analyzed
                        </h4>
                        {compliance.regulations.map((reg, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-3 rounded bg-surface border border-border hover:border-cyan-500/30 transition-colors">
                                <div className="mt-1">
                                    {reg.status === 'COMPLIANT' ? <CheckCircle size={16} className="text-success" /> :
                                        reg.status === 'NON_COMPLIANT' ? <XCircle size={16} className="text-error" /> :
                                            <AlertOctagon size={16} className="text-warning" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-sm">{reg.name}</span>
                                        <span className={`badge ${getRiskBadgeColor(reg.riskLevel)} text-[10px]`}>
                                            {reg.riskLevel} Risk
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted">{reg.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Search Queries Footer */}
                {compliance.searchQueries.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-xs text-muted mb-2">
                            <Search size={12} />
                            <span className="uppercase font-semibold">Live Verification Searches Performed</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {compliance.searchQueries.map((query, idx) => (
                                <span key={idx} className="px-2 py-1 rounded bg-surface-hover text-[10px] font-mono border border-border/50 flex items-center gap-1">
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
