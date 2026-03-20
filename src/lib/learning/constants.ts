/**
 * Shared constants for the behavioral data flywheel.
 *
 * Separated from feedback-loop.ts to avoid pulling server-side
 * dependencies (Prisma) into client components.
 */

/** Static defaults for risk scorer bias severity weights */
export const DEFAULT_BIAS_SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 50,
  high: 30,
  medium: 15,
  low: 5,
};

/** Static defaults for counterfactual score calculator */
export const DEFAULT_COUNTERFACTUAL_WEIGHTS: Record<string, number> = {
  critical: 8,
  high: 5,
  medium: 3,
  low: 1,
};
