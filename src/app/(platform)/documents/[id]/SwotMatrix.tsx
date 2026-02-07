'use client';

import { SwotAnalysisResult } from '@/types';
import { TrendingUp, TrendingDown, AlertCircle, Target } from 'lucide-react';

export function SwotMatrix({ data }: { data: SwotAnalysisResult }) {
    if (!data) return null;

    const sections = [
        { title: 'Strengths', items: data.strengths, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { title: 'Weaknesses', items: data.weaknesses, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { title: 'Opportunities', items: data.opportunities, icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { title: 'Threats', items: data.threats, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((s) => (
                <div key={s.title} className="p-4 rounded-xl border border-border bg-card/50">
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-lg ${s.bg}`}>
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <h4 className="font-semibold">{s.title}</h4>
                    </div>
                    <ul className="space-y-2">
                        {s.items.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0`} />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
            <div className="md:col-span-2 mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-indigo-500/30">
                <h4 className="text-indigo-400 font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Strategic Advice
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">{data.strategicAdvice}</p>
            </div>
        </div>
    );
}
