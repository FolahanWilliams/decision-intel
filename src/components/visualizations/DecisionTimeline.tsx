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
      case 'decision':
        return <Circle size={16} className="text-orange-400 fill-orange-400/20" />;
      case 'risk':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-muted" />;
    }
  };

  return (
    <div className="relative pl-[30px] border-l border-white/10 space-y-12 my-6">
      {events.map(event => (
        <div key={event.id} className="relative group perspective">
          {/* Timeline Node Icon */}
          <div className="absolute -left-[38px] top-1 bg-black p-[3px] rounded-full border border-white/20 group-hover:border-white group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-300 z-10 shadow-lg">
            {getIcon(event.type, event.status)}
          </div>

          {/* Timeline Content Card */}
          <div className="card p-5 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:shadow-glow transition-all duration-400 ease-out ml-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <span className="text-[11px] font-mono text-muted/80">{event.date}</span>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-muted/70 border border-white/10 px-2.5 py-0.5 rounded-full bg-black/40 shadow-inner">
                  {event.type}
                </span>
              </div>
              <h4 className="font-semibold text-[15px] text-white/90 group-hover:text-white transition-colors tracking-tight">
                {event.title}
              </h4>
              <p className="text-sm text-muted leading-relaxed drop-shadow-sm">
                {event.description}
              </p>
            </div>
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div className="card p-8 text-center text-muted text-sm border-dashed border-white/20">
          <Clock size={20} className="mx-auto mb-2 opacity-30" />
          No timeline events detected yet.
        </div>
      )}
    </div>
  );
}
