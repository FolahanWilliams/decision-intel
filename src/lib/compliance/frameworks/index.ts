/**
 * Regulatory Frameworks Registry
 *
 * Central registry of all regulatory frameworks. The regulatory-graph.ts
 * engine calls getAllRegisteredFrameworks() to discover available frameworks.
 */

import type { RegulatoryFramework } from '../regulatory-graph';
import { FCA_CONSUMER_DUTY } from './fca-consumer-duty';
import { SOX_FRAMEWORK } from './sox';
import { BASEL3_FRAMEWORK } from './basel3';
import { EU_AI_ACT_FRAMEWORK } from './eu-ai-act';
import { GDPR_ART22_FRAMEWORK } from './gdpr-automated-decisions';
import { SEC_REG_D_FRAMEWORK } from './sec-reg-d';
import { LPOA_FRAMEWORK } from './lpoa';

export { FCA_CONSUMER_DUTY } from './fca-consumer-duty';
export { SOX_FRAMEWORK } from './sox';
export { BASEL3_FRAMEWORK } from './basel3';
export { EU_AI_ACT_FRAMEWORK } from './eu-ai-act';
export { GDPR_ART22_FRAMEWORK } from './gdpr-automated-decisions';
export { SEC_REG_D_FRAMEWORK } from './sec-reg-d';
export { LPOA_FRAMEWORK } from './lpoa';

/**
 * Returns all registered regulatory frameworks.
 * Called by the regulatory graph engine for cross-framework assessment.
 */
export function getAllRegisteredFrameworks(): RegulatoryFramework[] {
  return [
    FCA_CONSUMER_DUTY,
    SOX_FRAMEWORK,
    BASEL3_FRAMEWORK,
    EU_AI_ACT_FRAMEWORK,
    GDPR_ART22_FRAMEWORK,
    SEC_REG_D_FRAMEWORK,
    LPOA_FRAMEWORK,
  ];
}
