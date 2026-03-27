/**
 * Decision Copilot — LangGraph Workflow
 *
 * A conversational StateGraph that routes user messages to the appropriate
 * copilot agent persona. Unlike the audit graph (fan-out pipeline),
 * this is a simple router → agent → END loop.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { createLogger } from '@/lib/utils/logger';
import { buildCopilotPrompt, ROUTER_PROMPT } from './prompts';
import { buildCopilotContext } from './context';
import {
  type CopilotAgentType,
  type CopilotTurnData,
  type CopilotContext,
  type RAGResult,
  COPILOT_AGENTS,
} from './types';

const log = createLogger('CopilotGraph');

function getModel() {
  const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');

  return genAI.getGenerativeModel({
    model: modelName,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
    generationConfig: {
      maxOutputTokens: 4096,
    },
  });
}

// ─── Router ──────────────────────────────────────────────────────────────────

/**
 * Determines which agent should respond based on conversation context.
 * Uses LLM routing for nuanced understanding, with keyword fallbacks.
 */
export async function routeToAgent(
  userMessage: string,
  history: CopilotTurnData[],
  forcedAgent?: CopilotAgentType
): Promise<CopilotAgentType> {
  // If user explicitly forced an agent, honor that
  if (forcedAgent && COPILOT_AGENTS.includes(forcedAgent)) {
    return forcedAgent;
  }

  // First turn → always idea_builder
  if (history.length === 0) {
    return 'idea_builder';
  }

  // Keyword-based fast routing (avoids LLM call for obvious cases)
  const lower = userMessage.toLowerCase();

  if (
    /\b(what could go wrong|challenge|critique|flaw|problem|bias|blind spot|devil|push back|attack)\b/.test(
      lower
    )
  ) {
    return 'devils_advocate';
  }
  if (
    /\b(what if|scenario|imagine|suppose|counterfactual|pre-?mortem|future|simulate)\b/.test(lower)
  ) {
    return 'scenario_explorer';
  }
  if (
    /\b(summarize|synthesize|rank|score|decide|recommend|wrap up|final|conclusion|dqi)\b/.test(
      lower
    )
  ) {
    return 'synthesizer';
  }
  if (
    /\b(what would i do|my twin|personal twin|my style|my pattern|how do i usually|my gut|predict me|my history|my track record)\b/.test(
      lower
    )
  ) {
    return 'personal_twin';
  }

  // LLM-based routing for ambiguous messages
  try {
    const model = getModel();
    const lastAgent = history.filter(t => t.role === 'agent').pop()?.agentType;
    const routerInput = `Previous agent: ${lastAgent || 'none'}\nConversation length: ${history.length} turns\nUser's latest message: "${userMessage}"`;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: 'System: ' + ROUTER_PROMPT }] },
        { role: 'model', parts: [{ text: 'Ready to route.' }] },
      ],
    });

    const result = await chat.sendMessage(routerInput);
    const response = result.response.text().trim().toLowerCase();
    const matched = COPILOT_AGENTS.find(a => response.includes(a));
    if (matched) return matched;
  } catch (err) {
    log.warn('LLM routing failed, falling back to previous agent:', err);
  }

  // Fallback: continue with previous agent or idea_builder
  const lastAgentType = history.filter(t => t.role === 'agent').pop()?.agentType;
  return (lastAgentType as CopilotAgentType) || 'idea_builder';
}

// ─── Agent Execution ─────────────────────────────────────────────────────────

/**
 * Runs a copilot agent and streams the response.
 * Returns an async generator that yields text chunks.
 */
export async function* runCopilotAgent(
  agentType: CopilotAgentType,
  decisionPrompt: string,
  userMessage: string,
  context: CopilotContext,
  history: CopilotTurnData[]
): AsyncGenerator<string> {
  const { systemPrompt, userPrompt } = buildCopilotPrompt(
    agentType,
    decisionPrompt,
    userMessage,
    context,
    history
  );

  const model = getModel();

  // Build chat history for multi-turn
  const geminiHistory = [];

  // System context as first exchange
  geminiHistory.push(
    { role: 'user' as const, parts: [{ text: 'System context: ' + systemPrompt }] },
    {
      role: 'model' as const,
      parts: [
        {
          text: 'Understood. I will respond in character as this agent, using the context and conversation history provided.',
        },
      ],
    }
  );

  // Add conversation history
  for (const turn of history) {
    if (turn.role === 'user') {
      geminiHistory.push({ role: 'user' as const, parts: [{ text: turn.content }] });
    } else {
      geminiHistory.push({ role: 'model' as const, parts: [{ text: turn.content }] });
    }
  }

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessageStream(userPrompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

export interface CopilotTurnResult {
  agentType: CopilotAgentType;
  context: CopilotContext;
  sources: RAGResult[];
}

/**
 * Orchestrates a single copilot turn:
 * 1. Builds/reuses context
 * 2. Routes to the right agent
 * 3. Returns metadata (the actual streaming happens via runCopilotAgent)
 */
export async function prepareCopilotTurn(
  userId: string,
  orgId: string | null,
  decisionPrompt: string,
  userMessage: string,
  history: CopilotTurnData[],
  existingContext?: CopilotContext,
  forcedAgent?: CopilotAgentType
): Promise<CopilotTurnResult> {
  // Build context (reuse if provided, otherwise assemble fresh)
  const context = existingContext ?? (await buildCopilotContext(userId, orgId, decisionPrompt));

  // Route to the appropriate agent
  const agentType = await routeToAgent(userMessage, history, forcedAgent);

  return {
    agentType,
    context,
    sources: context.ragResults,
  };
}
