'use client';

import { type CopilotAgentType, AGENT_LABELS, AGENT_COLORS } from '@/lib/copilot/types';
import { Lightbulb, ShieldAlert, Telescope, BarChart3, Brain } from 'lucide-react';

const AGENT_ICONS: Record<CopilotAgentType, React.ComponentType<{ className?: string }>> = {
  idea_builder: Lightbulb,
  devils_advocate: ShieldAlert,
  scenario_explorer: Telescope,
  synthesizer: BarChart3,
  personal_twin: Brain,
};

interface AgentBadgeProps {
  agentType: CopilotAgentType;
  size?: 'sm' | 'md';
}

export function AgentBadge({ agentType, size = 'sm' }: AgentBadgeProps) {
  const Icon = AGENT_ICONS[agentType];
  const label = AGENT_LABELS[agentType];
  const color = AGENT_COLORS[agentType];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{
        backgroundColor: `${color}15`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {label}
    </span>
  );
}
