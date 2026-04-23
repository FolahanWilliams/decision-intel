'use client';

import { useState, useEffect } from 'react';

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
  const [plan, setPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/billing')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!cancelled && data?.plan) setPlan(data.plan);
      })
      .catch(err => console.warn('[usePlanLabels] billing fetch failed:', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
