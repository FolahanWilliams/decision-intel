import { NextResponse } from 'next/server';
import { WizClient, WizConfig } from '@/lib/integrations/wiz/client';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('wiz-api');

// Mock data fallback if Wiz keys are not configured
const mockIssues = [
  {
    id: 'WIZ-001',
    title: 'Critical RCE vulnerability in public-facing service',
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    toxicCombination: true,
    biasDetected: ['anchoring_bias', 'automation_bias'],
    decisionTime: 15,
    assignee: 'Alice Chen',
    createdAt: '2024-03-20T10:30:00Z',
  },
  {
    id: 'WIZ-002',
    title: 'Exposed AWS credentials in application logs',
    severity: 'HIGH',
    status: 'OPEN',
    toxicCombination: false,
    biasDetected: ['loss_aversion'],
    decisionTime: 120,
    assignee: 'Bob Smith',
    createdAt: '2024-03-20T09:15:00Z',
  },
  {
    id: 'WIZ-003',
    title: 'Misconfigured S3 bucket with public read access',
    severity: 'HIGH',
    status: 'RESOLVED',
    toxicCombination: true,
    biasDetected: [],
    decisionTime: 35,
    assignee: 'Carol White',
    createdAt: '2024-03-20T08:00:00Z',
  },
];

export async function GET() {
  try {
    const config: WizConfig = {
      apiUrl: process.env.WIZ_API_URL || '',
      clientId: process.env.WIZ_CLIENT_ID || '',
      clientSecret: process.env.WIZ_CLIENT_SECRET || '',
      tenantId: process.env.WIZ_TENANT_ID || '',
    };

    // If we don't have creds, return demo data
    if (!config.clientId || !config.clientSecret) {
      log.warn('Wiz API credentials not found, returning demo data');
      return NextResponse.json({
        issues: mockIssues,
        isDemo: true,
      });
    }

    const wiz = new WizClient(config);
    const { issues } = await wiz.getIssues({ limit: 10 });

    const formattedIssues = issues.map(issue => ({
      id: issue.id,
      title: issue.title,
      severity: issue.severity,
      status: issue.status,
      // toxicCombination is an object in the Wiz API, cast safely to boolean
      toxicCombination: !!issue.toxicCombination,
      biasDetected: [], // To be enriched if linked to an Analysis
      decisionTime: 0,
      assignee: 'Unassigned',
      createdAt: issue.createdAt,
    }));

    return NextResponse.json({
      issues: formattedIssues,
      isDemo: false,
    });
  } catch (error) {
    log.error('Failed to fetch Wiz issues', error);
    // Graceful fallback on error
    return NextResponse.json({
      issues: mockIssues,
      isDemo: true,
      error: 'Failed to connect to Wiz API',
    });
  }
}
