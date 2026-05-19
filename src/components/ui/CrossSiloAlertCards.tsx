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

// CSS-var seed per severity band (light-theme safe); tints via color-mix.
function getSeverityStyle(severity: number): { seed: string } {
  if (severity >= 70) return { seed: 'var(--error)' };
  if (severity >= 40) return { seed: 'var(--severity-high)' };
  return { seed: 'var(--success)' };
}

export function CrossSiloAlertCards({ antiPatterns, onExplorePattern }: CrossSiloAlertCardsProps) {
  const significant = antiPatterns.filter(p => p.severity >= 30);

  if (significant.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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

  // CSS-var seed per accent (light-theme safe) — not literal palette.
  const accentSeeds: Record<string, string> = {
    purple: 'var(--accent-secondary)',
    amber: 'var(--warning)',
    red: 'var(--error)',
    orange: 'var(--warning)',
    yellow: 'var(--warning)',
  };
  const accentSeed = accentSeeds[config.accentClass] ?? accentSeeds.amber;

  return (
    <div
      className="rounded-lg border overflow-hidden transition-all duration-200"
      style={{
        animationDelay: `${delay}ms`,
        borderColor: `color-mix(in srgb, ${style.seed} 30%, transparent)`,
        background: `color-mix(in srgb, ${style.seed} 5%, transparent)`,
      }}
    >
      <button
        onClick={() => setExpanded(p => !p)}
        aria-expanded={expanded}
        className="w-full text-left p-3 flex items-start gap-3"
      >
        {/* Severity dot */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: style.seed }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon size={14} style={{ color: accentSeed }} />
            <span className="text-xs font-semibold capitalize" style={{ color: accentSeed }}>
              {config.label}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              severity {pattern.severity} &bull; {pattern.affectedNodes} nodes
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{pattern.description}</p>
        </div>

        <div className="flex-shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-0 ml-5 space-y-2">
          <div className="p-2 rounded bg-muted border border-border">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Recommendation: </span>
              {pattern.recommendation}
            </p>
          </div>
          {onExplore && pattern.nodeIds && pattern.nodeIds.length > 0 && (
            <button
              onClick={e => {
                e.stopPropagation();
                onExplore(pattern.nodeIds!);
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors"
              style={{ color: 'var(--info)' }}
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
