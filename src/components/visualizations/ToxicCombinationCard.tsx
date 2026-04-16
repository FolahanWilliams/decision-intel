'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Zap,
  Users,
  Clock,
  DollarSign,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ContextFactors {
  monetaryStakes: string;
  dissentAbsent: boolean;
  timePressure: boolean;
  unanimousConsensus: boolean;
  participantCount: number;
  confidenceSpread: number | null;
}

interface MitigationStep {
  title: string;
  description: string;
  owner: string;
  timing: string;
  priority: string;
}

interface MitigationPlaybook {
  patternLabel: string;
  summary: string;
  steps: MitigationStep[];
  researchBasis: string;
}

interface ToxicCombination {
  id: string;
  biasTypes: string[];
  contextFactors: ContextFactors;
  toxicScore: number;
  patternLabel: string | null;
  historicalFailRate: number | null;
  sampleSize: number;
  status: string;
  mitigationNotes: string | null;
  mitigationPlaybook?: MitigationPlaybook;
  estimatedRiskAmount?: number;
  dealTicketSize?: number;
}

interface ToxicCombinationCardProps {
  combinations: ToxicCombination[];
  onAcknowledge?: (id: string) => void;
  onMitigate?: (id: string, notes: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBiasType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getSeverityColor(score: number): {
  bg: string;
  border: string;
  text: string;
  badge: string;
} {
  if (score >= 80) {
    return {
      bg: 'bg-red-950/40',
      border: 'border-red-500/50',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-300',
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-orange-950/30',
      border: 'border-orange-500/40',
      text: 'text-orange-400',
      badge: 'bg-orange-500/20 text-orange-300',
    };
  }
  return {
    bg: 'bg-yellow-950/20',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-300',
  };
}

function getContextIcons(context: ContextFactors) {
  const icons: Array<{ icon: typeof Clock; label: string; active: boolean }> = [
    {
      icon: DollarSign,
      label: `Stakes: ${context.monetaryStakes}`,
      active: context.monetaryStakes !== 'low' && context.monetaryStakes !== 'unknown',
    },
    {
      icon: Users,
      label: context.dissentAbsent ? 'No dissent' : 'Dissent present',
      active: context.dissentAbsent,
    },
    {
      icon: Clock,
      label: context.timePressure ? 'Time pressure' : 'No urgency',
      active: context.timePressure,
    },
    {
      icon: Zap,
      label: context.unanimousConsensus ? 'Unanimous' : 'Diverse views',
      active: context.unanimousConsensus,
    },
  ];
  return icons.filter(i => i.active);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ToxicCombinationCard({
  combinations,
  onAcknowledge,
  onMitigate,
}: ToxicCombinationCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mitigationInput, setMitigationInput] = useState<string>('');

  if (combinations.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="h-5 w-5 text-red-400" />
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Toxic Combinations
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
          {combinations.length} detected
        </span>
      </div>

      {combinations.map(combo => {
        const colors = getSeverityColor(combo.toxicScore);
        const isExpanded = expandedId === combo.id;
        const contextIcons = getContextIcons(combo.contextFactors);

        return (
          <div
            key={combo.id}
            className={`rounded-lg border ${colors.border} ${colors.bg} p-4 transition-all`}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : combo.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`h-4 w-4 ${colors.text}`} />
                  {combo.patternLabel ? (
                    <span className={`font-semibold ${colors.text}`}>{combo.patternLabel}</span>
                  ) : (
                    <span className={`font-medium ${colors.text}`}>Compound Risk Pattern</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                    Score: {Math.round(combo.toxicScore)}
                  </span>
                  {combo.status === 'acknowledged' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                      Acknowledged
                    </span>
                  )}
                  {combo.status === 'mitigated' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">
                      Mitigated
                    </span>
                  )}
                </div>

                {/* Bias types */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {combo.biasTypes.map(bt => (
                    <span
                      key={bt}
                      className="text-xs px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10"
                    >
                      {formatBiasType(bt)}
                    </span>
                  ))}
                </div>

                {/* Context amplifiers */}
                {contextIcons.length > 0 && (
                  <div className="flex gap-3 mt-2">
                    {contextIcons.map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-1 text-xs text-zinc-400">
                        <Icon className="h-3 w-3" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="text-zinc-500 hover:text-zinc-300 ml-2 mt-1">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
                {combo.historicalFailRate != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-zinc-300">
                      Historical failure rate:{' '}
                      <strong className="text-red-400">
                        {Math.round(combo.historicalFailRate * 100)}%
                      </strong>
                      {combo.sampleSize > 0 && (
                        <span className="text-zinc-500 ml-1">
                          (based on {combo.sampleSize} past decisions)
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Dollar Impact Estimation */}
                {combo.estimatedRiskAmount != null && combo.dealTicketSize != null && (
                  <div className="flex items-center gap-2 text-sm bg-red-950/30 rounded p-2 border border-red-500/20">
                    <DollarSign className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <span className="text-zinc-300">
                      Estimated risk:{' '}
                      <strong className="text-red-400">
                        ${(combo.estimatedRiskAmount / 1_000_000).toFixed(1)}M
                      </strong>
                      <span className="text-zinc-500 ml-1">
                        ({Math.round((combo.historicalFailRate ?? 0) * 100)}% failure rate on $
                        {(combo.dealTicketSize / 1_000_000).toFixed(0)}M deal)
                      </span>
                    </span>
                  </div>
                )}

                {/* Mitigation Playbook */}
                {combo.mitigationPlaybook && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm font-semibold text-cyan-300">
                        Mitigation Playbook
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3">{combo.mitigationPlaybook.summary}</p>
                    <div className="space-y-2">
                      {combo.mitigationPlaybook.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-3 text-xs">
                          <span
                            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step.priority === 'critical'
                                ? 'bg-red-500/30 text-red-300'
                                : step.priority === 'high'
                                  ? 'bg-orange-500/20 text-orange-300'
                                  : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-zinc-200">{step.title}</div>
                            <div className="text-zinc-500 mt-0.5">{step.description}</div>
                            <div className="flex gap-2 mt-1 text-[10px]">
                              <span className="text-zinc-600">{step.owner.replace('_', ' ')}</span>
                              <span className="text-zinc-700">·</span>
                              <span className="text-zinc-600">
                                {step.timing.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-zinc-600 italic">
                      {combo.mitigationPlaybook.researchBasis}
                    </div>
                  </div>
                )}

                {combo.mitigationNotes && (
                  <div className="text-sm text-zinc-400 bg-white/5 rounded p-2">
                    <strong className="text-zinc-300">Mitigation notes:</strong>{' '}
                    {combo.mitigationNotes}
                  </div>
                )}

                {/* Actions */}
                {combo.status === 'active' && (
                  <div className="flex gap-2 mt-2">
                    {onAcknowledge && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onAcknowledge(combo.id);
                        }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Acknowledge
                      </button>
                    )}
                    {onMitigate && (
                      <div className="flex gap-1.5 flex-1">
                        <input
                          type="text"
                          placeholder="Mitigation notes..."
                          value={mitigationInput}
                          onChange={e => setMitigationInput(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="flex-1 text-xs px-3 py-1.5 rounded bg-white/5 border border-white/10 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-green-500/50"
                        />
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (mitigationInput.trim()) {
                              onMitigate(combo.id, mitigationInput.trim());
                              setMitigationInput('');
                            }
                          }}
                          className="text-xs px-3 py-1.5 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors whitespace-nowrap"
                        >
                          Mitigate
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
