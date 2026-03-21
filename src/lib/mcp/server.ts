/**
 * Model Context Protocol (MCP) Server
 *
 * Real-time bias detection service that AI agents can query before making decisions.
 * Implements the MCP standard for seamless integration with LLM-based systems.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage } from 'http';
import { z } from 'zod';
import { SecurityBiasDetector, SecurityBiasType } from '../security/bias-taxonomy';
import { SecurityCausalModel } from '../causal/engine';
import { createLogger } from '../utils/logger';

const logger = createLogger('MCPServer');

// ─── MCP Protocol Types ──────────────────────────────────────────────────────

interface MCPRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
  timestamp: string;
}

interface MCPResponse {
  id: string;
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
    data?: Record<string, unknown>;
  };
  timestamp: string;
}

interface MCPContext {
  sessionId: string;
  clientId: string;
  permissions: string[];
  metadata: Record<string, unknown>;
}

// ─── Request/Response Schemas ────────────────────────────────────────────────

const BiasCheckRequestSchema = z.object({
  decision: z.object({
    type: z.string(),
    description: z.string(),
    urgency: z.enum(['immediate', 'normal', 'low']),
    context: z.object({
      timeToDecision: z.number().optional(),
      dataPointsConsulted: z.number().optional(),
      teamSize: z.number().optional(),
      automationInvolved: z.boolean().optional(),
      productionSystem: z.boolean().optional(),
      alertVolume: z.number().optional(),
    }),
  }),
  requestNudge: z.boolean().default(true),
  includeCounterfactual: z.boolean().default(false),
});

const CausalAnalysisRequestSchema = z.object({
  scenario: z.enum(['patch_decision', 'secret_rotation', 'incident_response']),
  context: z.record(z.string(), z.unknown()),
  objective: z.string().optional(),
  interventions: z
    .array(
      z.object({
        variable: z.string(),
        value: z.unknown(),
      })
    )
    .optional(),
});

// ─── MCP Server Implementation ───────────────────────────────────────────────

export class MCPServer {
  private wss: WebSocketServer;
  private httpServer: ReturnType<typeof createServer>;
  private biasDetector: SecurityBiasDetector;
  private causalModel: SecurityCausalModel;
  private clients: Map<string, { ws: WebSocket; context: MCPContext }>;
  private requestMetrics: Map<string, { count: number; lastRequest: Date }>;

  constructor(port: number = 8080) {
    this.biasDetector = new SecurityBiasDetector();
    this.causalModel = new SecurityCausalModel();
    this.clients = new Map();
    this.requestMetrics = new Map();

    // Create HTTP server for health checks
    this.httpServer = createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'healthy',
            clients: this.clients.size,
            uptime: process.uptime(),
          })
        );
      } else if (req.url === '/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            totalRequests: Array.from(this.requestMetrics.values()).reduce(
              (sum, m) => sum + m.count,
              0
            ),
            activeClients: this.clients.size,
            requestsPerClient: Array.from(this.requestMetrics.entries()).map(([id, metrics]) => ({
              clientId: id,
              requests: metrics.count,
              lastRequest: metrics.lastRequest,
            })),
          })
        );
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    // Create WebSocket server for MCP protocol
    this.wss = new WebSocketServer({ server: this.httpServer });
    this.setupWebSocketHandlers();

    // Start listening
    this.httpServer.listen(port, () => {
      logger.info(`MCP Server listening on port ${port}`);
    });
  }

  /**
   * Setup WebSocket connection handlers
   */
  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientId = this.generateClientId();
      const context: MCPContext = {
        sessionId: this.generateSessionId(),
        clientId,
        permissions: this.extractPermissions(req),
        metadata: {
          connectedAt: new Date(),
          userAgent: req.headers['user-agent'],
          ip: req.socket.remoteAddress,
        },
      };

      this.clients.set(clientId, { ws, context });
      logger.info(`MCP client connected: ${clientId}`);

      // Send welcome message
      this.sendResponse(ws, {
        id: 'welcome',
        result: {
          sessionId: context.sessionId,
          capabilities: this.getServerCapabilities(),
          version: '1.0.0',
        },
        timestamp: new Date().toISOString(),
      });

      // Handle incoming messages
      ws.on('message', async (data: Buffer) => {
        try {
          const request = JSON.parse(data.toString()) as MCPRequest;
          await this.handleRequest(ws, request, context);
        } catch (error) {
          logger.error('Invalid MCP request:', error);
          this.sendError(ws, 'parse_error', -32700, 'Invalid JSON');
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info(`MCP client disconnected: ${clientId}`);
      });

      // Handle errors
      ws.on('error', error => {
        logger.error(`MCP client error (${clientId}):`, error);
      });
    });
  }

  /**
   * Handle incoming MCP requests
   */
  private async handleRequest(ws: WebSocket, request: MCPRequest, context: MCPContext) {
    // Track metrics
    const metrics = this.requestMetrics.get(context.clientId) || {
      count: 0,
      lastRequest: new Date(),
    };
    metrics.count++;
    metrics.lastRequest = new Date();
    this.requestMetrics.set(context.clientId, metrics);

    try {
      switch (request.method) {
        case 'checkBias':
          await this.handleBiasCheck(ws, request, context);
          break;

        case 'analyzeCausality':
          await this.handleCausalAnalysis(ws, request, context);
          break;

        case 'getNudge':
          await this.handleGetNudge(ws, request, context);
          break;

        case 'recordDecision':
          await this.handleRecordDecision(ws, request, context);
          break;

        case 'getCapabilities':
          this.sendResponse(ws, {
            id: request.id,
            result: this.getServerCapabilities(),
            timestamp: new Date().toISOString(),
          });
          break;

        default:
          this.sendError(ws, request.id, -32601, `Method not found: ${request.method}`);
      }
    } catch (error) {
      logger.error(`Error handling request ${request.method}:`, error);
      this.sendError(ws, request.id, -32603, 'Internal error', { error: String(error) });
    }
  }

  /**
   * Handle bias detection requests
   */
  private async handleBiasCheck(ws: WebSocket, request: MCPRequest, _context: MCPContext) {
    try {
      const params = BiasCheckRequestSchema.parse(request.params);

      // Detect biases
      const biasResults = this.biasDetector.detectBias({
        decisionType: params.decision.type,
        timeToDecision: params.decision.context.timeToDecision || 60,
        dataPointsConsulted: params.decision.context.dataPointsConsulted || 1,
        teamSize: params.decision.context.teamSize || 1,
        automationInvolved: params.decision.context.automationInvolved || false,
        productionSystem: params.decision.context.productionSystem || false,
        alertVolume: params.decision.context.alertVolume,
      });

      // Calculate cognitive risk
      const riskAssessment = this.biasDetector.calculateCognitiveRisk(biasResults);

      // Generate nudges if requested
      let nudges: string[] = [];
      if (params.requestNudge && biasResults.length > 0) {
        nudges = biasResults
          .slice(0, 3) // Top 3 biases
          .map(b => b.nudgeRecommendation);
      }

      // Perform counterfactual analysis if requested
      let counterfactual = null;
      if (params.includeCounterfactual && riskAssessment.primaryBias) {
        const cfContext = new Map<string, number>();
        cfContext.set('decision_urgency', params.decision.urgency === 'immediate' ? 1 : 0);
        cfContext.set('automation_involved', params.decision.context.automationInvolved ? 1 : 0);

        const cfResult = this.causalModel.counterfactual(cfContext, {
          variable: 'automation_involved',
          value: 0,
        });

        counterfactual = {
          recommendation: 'Consider manual review to reduce bias risk',
          impactReduction: Array.from(cfResult.differences.values()),
        };
      }

      // Send response
      this.sendResponse(ws, {
        id: request.id,
        result: {
          biasesDetected: biasResults.map(b => ({
            type: b.biasType,
            confidence: b.confidence,
            severity: b.severity,
            signals: b.signals,
          })),
          cognitiveRisk: {
            level: riskAssessment.overallRisk,
            score: riskAssessment.riskScore,
            primaryBias: riskAssessment.primaryBias,
          },
          nudges,
          counterfactual,
          mitigationPriority: riskAssessment.mitigationPriority,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.sendError(ws, request.id, -32602, 'Invalid parameters', { error: String(error) });
    }
  }

  /**
   * Handle causal analysis requests
   */
  private async handleCausalAnalysis(ws: WebSocket, request: MCPRequest, _context: MCPContext) {
    try {
      const params = CausalAnalysisRequestSchema.parse(request.params);

      // Build context map — coerce values to numbers for causal model
      const contextMap = new Map(
        Object.entries(params.context).map(
          ([k, v]) => [k, typeof v === 'number' ? v : Number(v) || 0] as [string, number]
        )
      );

      // Perform interventions if specified
      const results: Array<{
        intervention: { variable: string; value: number };
        outcomes: Record<string, unknown>;
      }> = [];
      if (params.interventions && params.interventions.length > 0) {
        for (const intervention of params.interventions) {
          const interventionValue =
            typeof intervention.value === 'number'
              ? intervention.value
              : Number(intervention.value) || 0;
          const result = this.causalModel.doIntervention(
            intervention.variable,
            interventionValue,
            new Map(contextMap)
          );

          results.push({
            intervention: { variable: intervention.variable, value: interventionValue },
            outcomes: Object.fromEntries(result),
          });
        }
      }

      // Calculate ATE if objective specified
      let ateAnalysis = null;
      if (params.objective && params.interventions && params.interventions.length > 0) {
        const treatment = params.interventions[0].variable;
        ateAnalysis = this.causalModel.calculateATE(treatment, params.objective);
      }

      // Find optimal intervention
      const optimal = this.causalModel.findOptimalIntervention(
        params.objective || 'business_impact',
        true, // minimize by default
        new Map(),
        params.interventions?.map(i => i.variable) || []
      );

      this.sendResponse(ws, {
        id: request.id,
        result: {
          scenario: params.scenario,
          interventionResults: results,
          ateAnalysis,
          optimalIntervention: {
            action: optimal.bestAction,
            value: optimal.bestValue,
            expectedOutcome: optimal.expectedOutcome,
            tradeoffs: Object.fromEntries(optimal.tradeoffs),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.sendError(ws, request.id, -32602, 'Invalid parameters', { error: String(error) });
    }
  }

  /**
   * Handle nudge generation requests
   */
  private async handleGetNudge(ws: WebSocket, request: MCPRequest, _context: MCPContext) {
    const biasType = request.params?.biasType as SecurityBiasType;
    const severity =
      typeof request.params?.severity === 'string' ? request.params.severity : 'medium';

    // Generate context-aware nudge
    const nudge = this.generateNudge(biasType, severity);

    this.sendResponse(ws, {
      id: request.id,
      result: {
        nudge: nudge.message,
        type: nudge.type,
        actions: nudge.actions,
        timing: nudge.timing,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle decision recording for audit trail
   */
  private async handleRecordDecision(ws: WebSocket, request: MCPRequest, context: MCPContext) {
    const decision = request.params?.decision;
    const biases = request.params?.biasesDetected || [];
    const outcome = request.params?.outcome;

    // In a real implementation, this would persist to database
    logger.info('Decision recorded:', {
      clientId: context.clientId,
      decision,
      biases,
      outcome,
    });

    this.sendResponse(ws, {
      id: request.id,
      result: {
        recorded: true,
        decisionId: this.generateDecisionId(),
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate context-aware nudge
   */
  private generateNudge(
    biasType: SecurityBiasType,
    severity: string
  ): {
    message: string;
    type: 'alert' | 'suggestion' | 'warning' | 'blocker';
    actions: string[];
    timing: 'immediate' | 'delayed' | 'scheduled';
  } {
    const nudgeMap: Record<
      SecurityBiasType,
      {
        message: string;
        type: 'alert' | 'suggestion' | 'warning' | 'blocker';
        actions: string[];
        timing: 'immediate' | 'delayed' | 'scheduled';
      }
    > = {
      [SecurityBiasType.ANCHORING]: {
        message:
          '⚠️ You may be anchoring on initial severity. Consider reviewing additional context.',
        type: 'warning',
        actions: [
          'Review identity permissions',
          'Check data sensitivity',
          'Assess network exposure',
        ],
        timing: 'immediate',
      },
      [SecurityBiasType.AUTOMATION_BIAS]: {
        message:
          '🤖 Automated recommendation detected. Please verify the reasoning before proceeding.',
        type: 'alert',
        actions: ['Review automation logic', 'Check for edge cases', 'Consider manual override'],
        timing: 'immediate',
      },
      [SecurityBiasType.GROUPTHINK]: {
        message: "👥 Quick consensus reached. Assign someone to play devil's advocate.",
        type: 'suggestion',
        actions: [
          "Assign devil's advocate",
          'List alternative approaches',
          'Document dissenting views',
        ],
        timing: 'immediate',
      },
      [SecurityBiasType.LOSS_AVERSION]: {
        message: '💰 Production change hesitation detected. Compare breach cost vs downtime cost.',
        type: 'warning',
        actions: ['Calculate breach impact', 'Estimate downtime cost', 'Review rollback plan'],
        timing: 'delayed',
      },
      [SecurityBiasType.AVAILABILITY]: {
        message: '📰 Recent news may be influencing priority. Check actual exploitation rates.',
        type: 'suggestion',
        actions: [
          'Review threat intelligence',
          'Check environment-specific risk',
          'Consult base rates',
        ],
        timing: 'delayed',
      },
      // Add more bias-specific nudges...
      [SecurityBiasType.CONFIRMATION]: {
        message: '🔍 Single hypothesis focus detected. Consider alternative explanations.',
        type: 'warning',
        actions: [
          'List alternative causes',
          'Seek contradictory evidence',
          'Expand investigation scope',
        ],
        timing: 'immediate',
      },
      [SecurityBiasType.RECENCY]: {
        message: '📅 Focusing on recent alerts. Review historical threat patterns.',
        type: 'suggestion',
        actions: ['Check historical data', 'Review persistent threats', 'Analyze trends'],
        timing: 'delayed',
      },
      [SecurityBiasType.OVERCONFIDENCE]: {
        message: '💭 High confidence detected. Consider requesting peer review.',
        type: 'suggestion',
        actions: ['Request second opinion', 'Document confidence level', 'List assumptions'],
        timing: 'delayed',
      },
      [SecurityBiasType.SUNK_COST]: {
        message: '💸 Past investment influencing decision. Focus on future ROI.',
        type: 'alert',
        actions: ['Calculate future costs', 'Ignore sunk costs', 'Compare alternatives'],
        timing: 'scheduled',
      },
      [SecurityBiasType.HALO_EFFECT]: {
        message: '✨ Vendor reputation may be influencing judgment. Evaluate independently.',
        type: 'suggestion',
        actions: ['Independent evaluation', 'Competitive analysis', 'Proof of concept'],
        timing: 'scheduled',
      },
      [SecurityBiasType.BANDWAGON]: {
        message: '🚂 Following industry trends. Ensure fit for your environment.',
        type: 'suggestion',
        actions: [
          'Environment-specific assessment',
          'Risk-benefit analysis',
          'Custom requirements',
        ],
        timing: 'scheduled',
      },
      [SecurityBiasType.STATUS_QUO]: {
        message: '🔒 Resistance to change detected. Review threat evolution.',
        type: 'warning',
        actions: ['Threat landscape review', 'Architecture assessment', 'Competitive analysis'],
        timing: 'scheduled',
      },
      [SecurityBiasType.FRAMING]: {
        message: '🖼️ Presentation affecting judgment. Review raw data.',
        type: 'suggestion',
        actions: ['Review source data', 'Multiple perspectives', 'Standardize format'],
        timing: 'immediate',
      },
      [SecurityBiasType.DUNNING_KRUGER]: {
        message: '📚 Experience-confidence mismatch. Consider mentorship.',
        type: 'alert',
        actions: ['Seek mentor input', 'Document reasoning', 'Request assistance'],
        timing: 'immediate',
      },
      [SecurityBiasType.CHOICE_OVERLOAD]: {
        message: '🎯 Too many options causing paralysis. Use progressive disclosure.',
        type: 'warning',
        actions: ['Filter top priorities', 'Batch similar items', 'Use decision tree'],
        timing: 'immediate',
      },
    };

    const nudge = nudgeMap[biasType];

    // Adjust type based on severity
    if (severity === 'critical' && nudge.type !== 'blocker') {
      nudge.type = 'blocker';
      nudge.timing = 'immediate';
    }

    return nudge;
  }

  /**
   * Get server capabilities for client discovery
   */
  private getServerCapabilities() {
    return {
      methods: ['checkBias', 'analyzeCausality', 'getNudge', 'recordDecision', 'getCapabilities'],
      biasTypes: Object.values(SecurityBiasType),
      scenarios: ['patch_decision', 'secret_rotation', 'incident_response'],
      features: {
        realTimeBiasDetection: true,
        causalAnalysis: true,
        counterfactualReasoning: true,
        nudgeGeneration: true,
        decisionAudit: true,
      },
      version: '1.0.0',
      maxRequestsPerMinute: 100,
    };
  }

  /**
   * Send response to client
   */
  private sendResponse(ws: WebSocket, response: MCPResponse) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(response));
    }
  }

  /**
   * Send error response
   */
  private sendError(
    ws: WebSocket,
    id: string,
    code: number,
    message: string,
    data?: Record<string, unknown>
  ) {
    this.sendResponse(ws, {
      id,
      error: { code, message, data },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Extract permissions from request headers
   */
  private extractPermissions(_req: IncomingMessage): string[] {
    // const authHeader = req.headers.authorization;
    // In production, this would validate JWT and extract permissions
    return ['read', 'write', 'analyze'];
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique decision ID
   */
  private generateDecisionId(): string {
    return `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: unknown) {
    const messageStr = JSON.stringify(message);
    for (const [, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down MCP server...');

    // Close all client connections
    for (const [, client] of this.clients) {
      client.ws.close(1000, 'Server shutting down');
    }

    // Close WebSocket server
    await new Promise<void>(resolve => {
      this.wss.close(() => resolve());
    });

    // Close HTTP server
    await new Promise<void>(resolve => {
      this.httpServer.close(() => resolve());
    });

    logger.info('MCP server shutdown complete');
  }
}

// ─── Export for API Route ────────────────────────────────────────────────────

let serverInstance: MCPServer | null = null;

export function getMCPServer(): MCPServer {
  if (!serverInstance) {
    serverInstance = new MCPServer(parseInt(process.env.MCP_SERVER_PORT || '8080'));
  }
  return serverInstance;
}

export async function stopMCPServer() {
  if (serverInstance) {
    await serverInstance.shutdown();
    serverInstance = null;
  }
}
