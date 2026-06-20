'use client';

import { useBilling } from './useBilling';

export interface PlanLabels {
  plan: string;
  isTeamPlan: boolean;
  isLoading: boolean;
  /** What to call the Knowledge Graph concept in UI copy based on plan. */
  knowledgeGraphLabel: string;
  knowledgeGraphShortLabel: string;
  /** Descriptive one-liner for the Knowledge Graph page / empty states. */
  knowledgeGraphDescription: string;
}

/**
 * Hook that fetches the user's plan and returns the right label for
 * "Knowledge Graph" concepts in the dashboard UI.
 *
 * Pro users see "Personal Decision History" (their solo journey).
 * Team/Enterprise users see "Decision Knowledge Graph" (team-wide).
 *
 * Used by dashboard empty states, the Decision Graph page, and any
 * component that needs to render plan-aware copy.
 */
export function usePlanLabels(): PlanLabels {
  // Routes through the shared `useBilling` SWR hook so this no longer fires its
  // own `/api/billing` request — every consumer dedupes to one.
  const { plan, isLoading } = useBilling();

  const isTeamPlan = plan === 'team' || plan === 'enterprise';

  return {
    plan,
    isTeamPlan,
    isLoading,
    knowledgeGraphLabel: isTeamPlan ? 'Decision Knowledge Graph' : 'Personal Decision History',
    knowledgeGraphShortLabel: isTeamPlan ? 'Knowledge Graph' : 'Decision History',
    knowledgeGraphDescription: isTeamPlan
      ? 'Every strategic memo your team produces, connected by assumption, bias, and outcome. Today\u2019s decision always inherits yesterday\u2019s lessons.'
      : 'Every memo you audit, tracked over time. See how your judgment compounds and where the same bias patterns keep showing up.',
  };
}
