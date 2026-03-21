/**
 * Wiz Issues API Route
 *
 * Provides access to Wiz security issues with cognitive bias analysis overlay
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { WizClient } from '@/lib/integrations/wiz/client';
import { SecurityBiasDetector } from '@/lib/security/bias-taxonomy';
import { SecurityScenarios } from '@/lib/causal/engine';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';

const logger = createLogger('WizAPI');

// ─── Request/Response Schemas ────────────────────────────────────────────────

const WizIssuesRequestSchema = z.object({
  severity: z.array(z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])).optional(),
  status: z.array(z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED'])).optional(),
  cloudProvider: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  includeBiasAnalysis: z.boolean().default(true),
  includeCausalAnalysis: z.boolean().default(false),
});

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Initialize Wiz client with environment credentials
 */
function getWizClient(): WizClient {
  const config = {
    apiUrl: process.env.WIZ_API_URL || 'https://api.wiz.io',
    clientId: process.env.WIZ_CLIENT_ID || '',
    clientSecret: process.env.WIZ_CLIENT_SECRET || '',
    tenantId: process.env.WIZ_TENANT_ID || '',
  };

  if (!config.clientId || !config.clientSecret) {
    throw new Error('Wiz API credentials not configured');
  }

  return new WizClient(config);
}

/**
 * Analyze decision context for biases
 */
interface IssueContext {
  severity?: string;
  affectedResources?: Array<{ id: string }>;
  remediation?: { automatedFix?: boolean };
  cloudProvider?: string;
}

async function analyzeDecisionContext(
  issue: IssueContext,
  teamContext?: { teamSize: number; responseTime: number }
): Promise<{
  biasesDetected: string[];
  cognitiveRisk: string;
  nudges: string[];
}> {
  const detector = new SecurityBiasDetector();

  // Simulate decision context based on issue properties
  const context = {
    decisionType: 'incident_response',
    timeToDecision: teamContext?.responseTime || 60,
    dataPointsConsulted: issue.affectedResources?.length || 1,
    teamSize: teamContext?.teamSize || 3,
    automationInvolved: issue.remediation?.automatedFix || false,
    productionSystem: issue.severity === 'CRITICAL',
    alertVolume: 50, // Would come from real-time metrics
  };

  const biasResults = detector.detectBias(context);
  const riskAssessment = detector.calculateCognitiveRisk(biasResults);

  return {
    biasesDetected: biasResults.map(b => b.biasType),
    cognitiveRisk: riskAssessment.overallRisk,
    nudges: biasResults.slice(0, 2).map(b => b.nudgeRecommendation),
  };
}

/**
 * Perform causal analysis for remediation decision
 */
async function analyzeCausality(issue: IssueContext): Promise<{
  recommendation: string;
  reasoning: string;
  alternativeScenarios: Array<{
    action: string;
    outcome?: string;
    risk?: string;
    breachRisk?: number;
    downtime?: number;
    impact?: number;
  }>;
}> {
  const scenarios = new SecurityScenarios();

  // Map Wiz issue to causal analysis context
  const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  };

  const context = {
    vulnerabilitySeverity: issue.severity ? severityMap[issue.severity] || 'medium' : 'medium',
    productionSystem: issue.cloudProvider !== undefined,
    peakTrafficHours: new Date().getHours() >= 9 && new Date().getHours() <= 17,
    dataClassification: issue.severity === 'CRITICAL' ? 'restricted' : 'internal',
  } as const;

  const analysis = scenarios.analyzePatchDecision(context);

  return {
    recommendation: analysis.recommendation,
    reasoning: analysis.reasoning,
    alternativeScenarios: [
      {
        action: 'patch_now',
        breachRisk: analysis.riskComparison.patchNow.breachRisk,
        downtime: analysis.riskComparison.patchNow.downtime,
        impact: analysis.riskComparison.patchNow.totalImpact,
      },
      {
        action: 'patch_later',
        breachRisk: analysis.riskComparison.patchLater.breachRisk,
        downtime: analysis.riskComparison.patchLater.downtime,
        impact: analysis.riskComparison.patchLater.totalImpact,
      },
      {
        action: 'accept_risk',
        breachRisk: analysis.riskComparison.noAction.breachRisk,
        downtime: analysis.riskComparison.noAction.downtime,
        impact: analysis.riskComparison.noAction.totalImpact,
      },
    ],
  };
}

// ─── API Route Handlers ──────────────────────────────────────────────────────

/**
 * GET /api/wiz/issues - Fetch Wiz issues with cognitive analysis
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = WizIssuesRequestSchema.parse({
      severity: searchParams.get('severity')?.split(','),
      status: searchParams.get('status')?.split(','),
      cloudProvider: searchParams.get('cloudProvider'),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      includeBiasAnalysis: searchParams.get('includeBiasAnalysis') !== 'false',
      includeCausalAnalysis: searchParams.get('includeCausalAnalysis') === 'true',
    });

    // Initialize Wiz client
    const wizClient = getWizClient();

    // Fetch issues from Wiz
    const severityValue = params.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | undefined;
    const statusValue = params.status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | undefined;

    const { issues, hasMore } = await wizClient.getIssues({
      severity: severityValue ? [severityValue] : undefined,
      status: statusValue ? [statusValue] : undefined,
      cloudProvider: params.cloudProvider,
      limit: params.limit,
      offset: params.offset,
    });

    // Enhance issues with cognitive analysis
    const enhancedIssues = await Promise.all(
      issues.map(async issue => {
        const enhanced = {
          ...issue,
          biasAnalysis: undefined as Awaited<ReturnType<typeof analyzeDecisionContext>> | undefined,
          causalAnalysis: undefined as Awaited<ReturnType<typeof analyzeCausality>> | undefined,
        };

        // Add bias analysis if requested
        if (params.includeBiasAnalysis) {
          enhanced.biasAnalysis = await analyzeDecisionContext(issue);
        }

        // Add causal analysis if requested
        if (params.includeCausalAnalysis) {
          enhanced.causalAnalysis = await analyzeCausality(issue);
        }

        return enhanced;
      })
    );

    // Log audit event
    await logAudit({
      action: 'VIEW_DOCUMENT', // Using existing action type
      resource: 'wiz_issues',
      details: {
        issueCount: issues.length,
        filters: params,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        issues: enhancedIssues,
        pagination: {
          limit: params.limit,
          offset: params.offset,
          hasMore,
          total: enhancedIssues.length,
        },
        metadata: {
          biasAnalysisEnabled: params.includeBiasAnalysis,
          causalAnalysisEnabled: params.includeCausalAnalysis,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching Wiz issues:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch Wiz issues' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wiz/issues/:id/remediate - Trigger remediation with bias check
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueId, automated = false, bypassBiasCheck = false } = body;

    if (!issueId) {
      return NextResponse.json({ success: false, error: 'Issue ID is required' }, { status: 400 });
    }

    // Initialize clients
    const wizClient = getWizClient();
    const detector = new SecurityBiasDetector();

    // Perform bias check unless bypassed
    if (!bypassBiasCheck) {
      const biasContext = {
        decisionType: 'remediation',
        timeToDecision: 30, // Quick decision
        dataPointsConsulted: 1,
        teamSize: 1,
        automationInvolved: automated,
        productionSystem: true,
      };

      const biases = detector.detectBias(biasContext);
      const risk = detector.calculateCognitiveRisk(biases);

      // Block if critical bias detected
      if (risk.overallRisk === 'critical') {
        return NextResponse.json(
          {
            success: false,
            error: 'Critical cognitive bias detected',
            biases: biases.map(b => ({
              type: b.biasType,
              severity: b.severity,
              nudge: b.nudgeRecommendation,
            })),
            recommendation: 'Please review the decision with your team before proceeding',
          },
          { status: 400 }
        );
      }
    }

    // Trigger remediation
    const result = await wizClient.triggerRemediation(issueId, automated);

    // Store decision audit
    await prisma.auditLog.create({
      data: {
        action: 'wiz_remediation_triggered',
        userId: 'system', // Would come from auth
        resource: 'wiz_issue',
        resourceId: issueId,
        details: {
          automated,
          bypassBiasCheck,
          jobId: result.jobId,
          estimatedTime: result.estimatedTime,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error triggering remediation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to trigger remediation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/wiz/issues/:id/status - Update issue status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueId, status, notes } = body;

    if (!issueId || !status) {
      return NextResponse.json(
        { success: false, error: 'Issue ID and status are required' },
        { status: 400 }
      );
    }

    const wizClient = getWizClient();
    const result = await wizClient.updateIssueStatus(issueId, status, notes);

    // Log the status change
    await logAudit({
      action: 'VIEW_DOCUMENT', // Using existing action type
      resource: 'wiz_issue',
      resourceId: issueId,
      details: { newStatus: status, notes },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error updating issue status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update issue status' },
      { status: 500 }
    );
  }
}
