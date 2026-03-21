/**
 * Wiz Platform Integration Client
 *
 * Enterprise-grade integration with Wiz's GraphQL API for security operations.
 * Provides real-time access to security findings, toxic combinations, and
 * automated remediation workflows.
 */

import { z } from 'zod';

// ─── Configuration ───────────────────────────────────────────────────────────

export interface WizConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  apiVersion?: string;
}

// ─── GraphQL Schema Types ────────────────────────────────────────────────────

export const WizIssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
  createdAt: z.string(),
  updatedAt: z.string(),
  description: z.string(),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  resourceType: z.string().optional(),
  cloudProvider: z.enum(['AWS', 'AZURE', 'GCP', 'KUBERNETES']).optional(),
  region: z.string().optional(),
  toxicCombination: z.object({
    attackPath: z.array(z.object({
      nodeId: z.string(),
      nodeType: z.string(),
      risk: z.string()
    })),
    exploitability: z.number(),
    impact: z.number(),
    riskScore: z.number()
  }).optional(),
  affectedResources: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    tags: z.record(z.string(), z.string())
  })).optional(),
  remediation: z.object({
    recommendation: z.string(),
    automatedFix: z.boolean(),
    script: z.string().optional(),
    estimatedTime: z.number().optional()
  }).optional()
});

export const WizControlSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  enabled: z.boolean(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  compliance: z.array(z.object({
    framework: z.string(),
    requirement: z.string(),
    status: z.enum(['PASS', 'FAIL', 'NOT_APPLICABLE'])
  })).optional()
});

export const WizSecurityGraphNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['COMPUTE', 'STORAGE', 'NETWORK', 'IDENTITY', 'DATA']),
  name: z.string(),
  properties: z.record(z.string(), z.any()),
  relationships: z.array(z.object({
    targetId: z.string(),
    type: z.string(),
    properties: z.record(z.string(), z.any()).optional()
  })),
  riskFactors: z.array(z.object({
    type: z.string(),
    severity: z.string(),
    description: z.string()
  })).optional()
});

export type WizIssue = z.infer<typeof WizIssueSchema>;
export type WizControl = z.infer<typeof WizControlSchema>;
export type WizSecurityGraphNode = z.infer<typeof WizSecurityGraphNodeSchema>;

// ─── GraphQL Queries ─────────────────────────────────────────────────────────

const QUERIES = {
  GET_ISSUES: `
    query GetIssues($filters: IssueFilters, $limit: Int, $offset: Int) {
      issues(filters: $filters, limit: $limit, offset: $offset) {
        nodes {
          id
          title
          severity
          status
          createdAt
          updatedAt
          description
          entityId
          entityType
          resourceType
          cloudProvider
          region
          toxicCombination {
            attackPath {
              nodeId
              nodeType
              risk
            }
            exploitability
            impact
            riskScore
          }
          affectedResources {
            id
            name
            type
            tags
          }
          remediation {
            recommendation
            automatedFix
            script
            estimatedTime
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `,

  GET_SECURITY_GRAPH: `
    query GetSecurityGraph($nodeId: ID!) {
      securityGraph(nodeId: $nodeId) {
        node {
          id
          type
          name
          properties
          relationships {
            targetId
            type
            properties
          }
          riskFactors {
            type
            severity
            description
          }
        }
        attackPaths {
          id
          likelihood
          impact
          path {
            nodeId
            nodeType
            action
          }
        }
      }
    }
  `,

  GET_CONTROLS: `
    query GetControls($enabled: Boolean) {
      controls(enabled: $enabled) {
        id
        name
        description
        category
        enabled
        severity
        compliance {
          framework
          requirement
          status
        }
      }
    }
  `,

  GET_TOXIC_COMBINATIONS: `
    query GetToxicCombinations($severity: Severity, $limit: Int) {
      toxicCombinations(severity: $severity, limit: $limit) {
        id
        title
        description
        riskScore
        components {
          vulnerability {
            cve
            cvss
            description
          }
          misconfiguration {
            type
            description
          }
          exposure {
            type
            scope
          }
          identity {
            principal
            permissions
          }
        }
        mitigationSteps
        automatedRemediation
      }
    }
  `
};

const MUTATIONS = {
  UPDATE_ISSUE_STATUS: `
    mutation UpdateIssueStatus($issueId: ID!, $status: IssueStatus!, $notes: String) {
      updateIssueStatus(issueId: $issueId, status: $status, notes: $notes) {
        success
        issue {
          id
          status
          updatedAt
        }
      }
    }
  `,

  TRIGGER_REMEDIATION: `
    mutation TriggerRemediation($issueId: ID!, $automated: Boolean!) {
      triggerRemediation(issueId: $issueId, automated: $automated) {
        success
        jobId
        estimatedTime
        status
      }
    }
  `,

  CREATE_EXCEPTION: `
    mutation CreateException($issueId: ID!, $reason: String!, $expiresAt: DateTime) {
      createException(issueId: $issueId, reason: $reason, expiresAt: $expiresAt) {
        success
        exception {
          id
          issueId
          reason
          createdAt
          expiresAt
        }
      }
    }
  `
};

// ─── Wiz API Client ──────────────────────────────────────────────────────────

export class WizClient {
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(private config: WizConfig) {}

  /**
   * Authenticate with Wiz API using OAuth2 client credentials flow
   */
  private async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return this.accessToken;
    }

    const tokenUrl = `${this.config.apiUrl}/oauth/token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        audience: `${this.config.apiUrl}/api`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Wiz authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000); // Refresh 1 min early

    return this.accessToken!; // We just set it, so it can't be null
  }

  /**
   * Execute a GraphQL query against the Wiz API
   */
  private async graphqlRequest<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const token = await this.authenticate();

    const response = await fetch(`${this.config.apiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-API-Version': this.config.apiVersion || 'v1',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  /**
   * Fetch security issues from Wiz
   */
  async getIssues(params?: {
    severity?: WizIssue['severity'][];
    status?: WizIssue['status'][];
    cloudProvider?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ issues: WizIssue[]; hasMore: boolean }> {
    const filters: Record<string, unknown> = {};

    if (params?.severity) filters.severity = params.severity;
    if (params?.status) filters.status = params.status;
    if (params?.cloudProvider) filters.cloudProvider = params.cloudProvider;

    const result = await this.graphqlRequest<{ issues: { nodes: unknown[]; pageInfo: { hasNextPage: boolean } } }>(
      QUERIES.GET_ISSUES,
      {
        filters,
        limit: params?.limit || 100,
        offset: params?.offset || 0,
      }
    );

    return {
      issues: result.issues.nodes.map((node: unknown) => WizIssueSchema.parse(node)),
      hasMore: result.issues.pageInfo.hasNextPage,
    };
  }

  /**
   * Get security graph for a specific resource
   */
  async getSecurityGraph(nodeId: string): Promise<{
    node: WizSecurityGraphNode;
    attackPaths: Array<{
      id: string;
      likelihood: number;
      impact: number;
      path: Array<{ nodeId: string; nodeType: string; action: string }>;
    }>;
  }> {
    const result = await this.graphqlRequest<{ securityGraph: { node: unknown; attackPaths: Array<{ id: string; likelihood: number; impact: number; path: Array<{ nodeId: string; nodeType: string; action: string }> }> } }>(
      QUERIES.GET_SECURITY_GRAPH,
      { nodeId }
    );

    return {
      node: WizSecurityGraphNodeSchema.parse(result.securityGraph.node),
      attackPaths: result.securityGraph.attackPaths,
    };
  }

  /**
   * Get toxic combinations (high-risk security patterns)
   */
  async getToxicCombinations(params?: {
    severity?: WizIssue['severity'];
    limit?: number;
  }): Promise<Array<{
    id: string;
    title: string;
    riskScore: number;
    components: Record<string, unknown>;
    mitigationSteps: string[];
    automatedRemediation: boolean;
  }>> {
    const result = await this.graphqlRequest<{ toxicCombinations: Array<{ id: string; title: string; riskScore: number; components: Record<string, unknown>; mitigationSteps: string[]; automatedRemediation: boolean }> }>(
      QUERIES.GET_TOXIC_COMBINATIONS,
      {
        severity: params?.severity,
        limit: params?.limit || 50,
      }
    );

    return result.toxicCombinations;
  }

  /**
   * Update issue status with optional notes
   */
  async updateIssueStatus(
    issueId: string,
    status: WizIssue['status'],
    notes?: string
  ): Promise<{ success: boolean; issue: Partial<WizIssue> }> {
    const result = await this.graphqlRequest<{ updateIssueStatus: { success: boolean; issue: Partial<WizIssue> } }>(
      MUTATIONS.UPDATE_ISSUE_STATUS,
      { issueId, status, notes }
    );

    return result.updateIssueStatus;
  }

  /**
   * Trigger automated or manual remediation
   */
  async triggerRemediation(
    issueId: string,
    automated: boolean = false
  ): Promise<{
    success: boolean;
    jobId: string;
    estimatedTime: number;
    status: string;
  }> {
    const result = await this.graphqlRequest<{ triggerRemediation: { success: boolean; jobId: string; estimatedTime: number; status: string } }>(
      MUTATIONS.TRIGGER_REMEDIATION,
      { issueId, automated }
    );

    return result.triggerRemediation;
  }

  /**
   * Create exception for an issue
   */
  async createException(
    issueId: string,
    reason: string,
    expiresAt?: Date
  ): Promise<{
    success: boolean;
    exception: {
      id: string;
      issueId: string;
      reason: string;
      createdAt: string;
      expiresAt?: string;
    };
  }> {
    const result = await this.graphqlRequest<{ createException: { success: boolean; exception: { id: string; issueId: string; reason: string; createdAt: string; expiresAt?: string } } }>(
      MUTATIONS.CREATE_EXCEPTION,
      {
        issueId,
        reason,
        expiresAt: expiresAt?.toISOString(),
      }
    );

    return result.createException;
  }

  /**
   * Subscribe to real-time issue updates via WebSocket
   */
  subscribeToIssues(
    callback: (issue: WizIssue) => void,
    filters?: { severity?: WizIssue['severity'][] }
  ): () => void {
    // WebSocket subscription implementation would go here
    // This is a placeholder for the subscription logic
    const ws = new WebSocket(`${this.config.apiUrl.replace('https', 'wss')}/subscriptions`);

    ws.onopen = async () => {
      const token = await this.authenticate();
      ws.send(JSON.stringify({
        type: 'connection_init',
        payload: { authorization: `Bearer ${token}` }
      }));

      ws.send(JSON.stringify({
        type: 'start',
        payload: {
          query: `
            subscription OnIssueUpdate($filters: IssueFilters) {
              issueUpdated(filters: $filters) {
                id
                title
                severity
                status
                updatedAt
              }
            }
          `,
          variables: { filters }
        }
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'data') {
        const issue = WizIssueSchema.parse(message.payload.data.issueUpdated);
        callback(issue);
      }
    };

    // Return cleanup function
    return () => ws.close();
  }
}

// ─── Webhook Handler ─────────────────────────────────────────────────────────

export interface WizWebhookPayload {
  event: 'issue.created' | 'issue.updated' | 'issue.resolved' | 'control.failed';
  timestamp: string;
  data: WizIssue | WizControl;
  metadata?: {
    triggeredBy?: string;
    automatedAction?: boolean;
  };
}

export class WizWebhookHandler {
  /**
   * Verify webhook signature for security
   */
  static async verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    // Implementation of webhook signature verification
    // This would use HMAC-SHA256 or similar
    const crypto = await import('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }

  /**
   * Process incoming webhook event
   */
  static async processWebhook(
    payload: WizWebhookPayload,
    handlers: {
      onIssueCreated?: (issue: WizIssue) => Promise<void>;
      onIssueUpdated?: (issue: WizIssue) => Promise<void>;
      onIssueResolved?: (issue: WizIssue) => Promise<void>;
      onControlFailed?: (control: WizControl) => Promise<void>;
    }
  ): Promise<void> {
    switch (payload.event) {
      case 'issue.created':
        if (handlers.onIssueCreated && 'severity' in payload.data) {
          await handlers.onIssueCreated(payload.data as WizIssue);
        }
        break;
      case 'issue.updated':
        if (handlers.onIssueUpdated && 'severity' in payload.data) {
          await handlers.onIssueUpdated(payload.data as WizIssue);
        }
        break;
      case 'issue.resolved':
        if (handlers.onIssueResolved && 'severity' in payload.data) {
          await handlers.onIssueResolved(payload.data as WizIssue);
        }
        break;
      case 'control.failed':
        if (handlers.onControlFailed && 'category' in payload.data) {
          await handlers.onControlFailed(payload.data as WizControl);
        }
        break;
    }
  }
}