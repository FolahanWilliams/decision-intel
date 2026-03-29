'use client';

import { useState } from 'react';
import {
  Layers,
  Radio,
  TrendingDown,
  Unplug,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

interface AntiPattern {
  patternType: string;
  severity: number;
  description: string;
  recommendation: string;
  affectedNodes: number;
  nodeIds?: string[];
}

interface CrossSiloAlertCardsProps {
  antiPatterns: AntiPattern[];
  onExplorePattern?: (nodeIds: string[]) => void;
}

const PATTERN_CONFIG: Record<string, { icon: typeof Layers; label: string; accentClass: string }> =
  {
    knowledge_fragmentation: {
      icon: Layers,
      label: 'Knowledge Fragmentation',
      accentClass: 'purple',
    },
    echo_chamber_cluster: {
      icon: Radio,
      label: 'Echo Chamber',
      accentClass: 'amber',
    },
    cascade_failure: {
      icon: TrendingDown,
      label: 'Cascade Failure',
      accentClass: 'red',
    },
    isolated_high_risk: {
      icon: Unplug,
      label: 'Isolated High Risk',
      accentClass: 'orange',
    },
    bias_concentration: {
      icon: AlertTriangle,
      label: 'Bias Concentration',
      accentClass: 'yellow',
    },
    reversal_chain: {
      icon: TrendingDown,
      label: 'Reversal Chain',
      accentClass: 'red',
    },
  };

function getSeverityStyle(severity: number) {
  if (severity >= 70) return { border: 'border-red-500/30', bg: 'bg-red-500/5', dot: 'bg-red-400' };
  if (severity >= 40)
    return { border: 'border-amber-500/30', bg: 'bg-amber-500/5', dot: 'bg-amber-400' };
  return { border: 'border-green-500/30', bg: 'bg-green-500/5', dot: 'bg-green-400' };
}

export function CrossSiloAlertCards({ antiPatterns, onExplorePattern }: CrossSiloAlertCardsProps) {
  const significant = antiPatterns.filter(p => p.severity >= 30);

  if (significant.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Structural Risks &amp; Cross-Silo Alerts
        </span>
      </div>
      <div className="card-body space-y-2">
        {significant
          .sort((a, b) => b.severity - a.severity)
          .map((pattern, i) => (
            <AlertCard key={i} pattern={pattern} onExplore={onExplorePattern} delay={i * 60} />
          ))}
      </div>
    </div>
  );
}

function AlertCard({
  pattern,
  onExplore,
  delay,
}: {
  pattern: AntiPattern;
  onExplore?: (nodeIds: string[]) => void;
  delay: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = PATTERN_CONFIG[pattern.patternType] ?? {
    icon: AlertTriangle,
    label: pattern.patternType.replace(/_/g, ' '),
    accentClass: 'amber',
  };
  const Icon = config.icon;
  const style = getSeverityStyle(pattern.severity);

  const accentColors: Record<string, { icon: string; label: string }> = {
    purple: { icon: 'text-purple-400', label: 'text-purple-300' },
    amber: { icon: 'text-amber-400', label: 'text-amber-300' },
    red: { icon: 'text-red-400', label: 'text-red-300' },
    orange: { icon: 'text-orange-400', label: 'text-orange-300' },
    yellow: { icon: 'text-yellow-400', label: 'text-yellow-300' },
  };
  const accent = accentColors[config.accentClass] ?? accentColors.amber;

  return (
    <div
      className={`rounded-lg border ${style.border} ${style.bg} overflow-hidden transition-all duration-200`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        onClick={() => setExpanded(p => !p)}
        aria-expanded={expanded}
        className="w-full text-left p-3 flex items-start gap-3"
      >
        {/* Severity dot */}
        <div className="flex-shrink-0 mt-0.5">
          <div className={`w-2 h-2 rounded-full ${style.dot}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon size={14} className={accent.icon} />
            <span className={`text-xs font-semibold capitalize ${accent.label}`}>
              {config.label}
            </span>
            <span className="text-[10px] text-zinc-500 ml-auto">
              severity {pattern.severity} &bull; {pattern.affectedNodes} nodes
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">{pattern.description}</p>
        </div>

        <div className="flex-shrink-0 text-zinc-500">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-0 ml-5 space-y-2">
          <div className="p-2 rounded bg-zinc-800/50 border border-zinc-700/50">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <span className="font-semibold text-zinc-300">Recommendation: </span>
              {pattern.recommendation}
            </p>
          </div>
          {onExplore && pattern.nodeIds && pattern.nodeIds.length > 0 && (
            <button
              onClick={e => {
                e.stopPropagation();
                onExplore(pattern.nodeIds!);
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink size={11} />
              Explore affected decisions
            </button>
          )}
        </div>
      )}
    </div>
  );
}
