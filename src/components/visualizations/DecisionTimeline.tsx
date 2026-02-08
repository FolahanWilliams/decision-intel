'use client';

import { Circle, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    type: 'decision' | 'risk' | 'milestone' | 'info';
    status?: 'completed' | 'pending' | 'warning';
}

interface DecisionTimelineProps {
    events: TimelineEvent[];
}

export function DecisionTimeline({ events }: DecisionTimelineProps) {
    const getIcon = (type: string, status?: string) => {
        if (status === 'warning') return <AlertCircle size={16} className="text-orange-400" />;
        if (status === 'completed') return <CheckCircle2 size={16} className="text-emerald-400" />;

        switch (type) {
            case 'decision': return <Circle size={16} className="text-blue-400 fill-blue-400/20" />;
            case 'risk': return <AlertCircle size={16} className="text-red-400" />;
            default: return <Clock size={16} className="text-muted" />;
        }
    };

    return (
        <div className="relative pl-6 border-l border-border/50 space-y-8 my-4">
            {events.map((event, index) => (
                <div key={event.id} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[29px] top-1 bg-background p-1 border border-border rounded-full group-hover:border-accent-primary group-hover:scale-110 transition-all">
                        {getIcon(event.type, event.status)}
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-muted">{event.date}</span>
                            <span className="text-[10px] uppercase tracking-widest text-muted/50 border border-border px-2 rounded-full">
                                {event.type}
                            </span>
                        </div>
                        <h4 className="font-medium text-sm group-hover:text-accent-primary transition-colors">
                            {event.title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-snug">
                            {event.description}
                        </p>
                    </div>
                </div>
            ))}

            {events.length === 0 && (
                <div className="text-center p-4 text-muted text-sm">
                    No timeline events detected.
                </div>
            )}
        </div>
    );
}
