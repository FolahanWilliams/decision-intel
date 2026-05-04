/**
 * Voice agent tool registry.
 *
 * Each tool defined here is registered on the AgentSession's Agent
 * (in agent.ts). When the LLM decides to call one — say the founder
 * tells the agent "add a todo to email Mr. Reiner Thursday" — the
 * agent invokes the tool's execute() handler, which POSTs to the
 * main app's /api/founder-hub/voice-tools endpoint with
 * VOICE_WORKER_SECRET bearer auth. The API endpoint dispatches to
 * the right handler, writes a VoiceSessionEvent row for the
 * cross-tracking dashboard, and returns the result back to the LLM.
 *
 * Tools to add:
 *   1. Define here with name + description + parameters JSON schema
 *   2. Add a matching entry in /api/founder-hub/voice-tools/route.ts
 *      TOOLS array with the actual handler logic
 *   3. Register it in agent.ts buildTools()
 *
 * The two-side definition (worker + API) is intentional: the worker
 * side controls what the LLM sees (description + schema) while the
 * server side controls what actually happens (DB writes, side
 * effects). Keeps the LLM contract decoupled from the implementation.
 */

import { llm } from '@livekit/agents';
import { config } from './config.js';

interface ToolCallContext {
  sessionId: string;
  personaId: string;
}

/**
 * Calls the main app's voice-tools dispatch endpoint. Single helper
 * shared by all tool execute() handlers — auth + logging + error
 * shape are consistent across tools.
 */
async function callVoiceTool(
  toolName: string,
  args: Record<string, unknown>,
  ctx: ToolCallContext
): Promise<string> {
  const url = `${config.mainApp.url}/api/founder-hub/voice-tools`;
  try {
    const t0 = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.mainApp.workerSecret}`,
      },
      body: JSON.stringify({
        tool: toolName,
        args,
        sessionId: ctx.sessionId,
        personaId: ctx.personaId,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const elapsed = Date.now() - t0;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.error(
        `[voice-worker] tool ${toolName} HTTP error: ${res.status} ${res.statusText} elapsedMs=${elapsed} body=${body.slice(0, 200)}`
      );
      // Return a string the LLM can read + recover from (don't throw —
      // throwing breaks the tool-call cycle).
      return `Tool error (${res.status}): ${body.slice(0, 150) || res.statusText}`;
    }
    const data = (await res.json()) as { ok?: boolean; result?: unknown };
    // eslint-disable-next-line no-console
    console.log(
      `[voice-worker] tool ${toolName} ok=${data.ok} elapsedMs=${elapsed} args=${JSON.stringify(args).slice(0, 200)}`
    );
    // Return result as a JSON string so the LLM can parse it. Keeps
    // schema flexibility per-tool without imposing a rigid response
    // shape.
    return JSON.stringify(data.result ?? data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[voice-worker] tool ${toolName} threw:`, err);
    return `Tool error: ${(err as Error).message}`;
  }
}

/**
 * Build the full tool registry. Called once per session in agent.ts.
 * sessionId + personaId are baked into each tool's closure so the
 * server can attribute every event correctly without the LLM having
 * to pass them.
 */
export function buildTools(ctx: ToolCallContext): llm.ToolContext {
  return {
    add_todo: llm.tool({
      description:
        "Create a todo for the founder. Use when the founder explicitly says they need to do something later (e.g., 'add a todo to email X', 'remind me to follow up'). Do NOT pre-emptively create todos from passing remarks.",
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Short, action-oriented todo title (e.g., "Email Mr. Reiner re: Sankore intro by Thursday")',
          },
          dueDate: {
            type: 'string',
            description: 'Optional ISO date string (YYYY-MM-DD) if the founder named a specific deadline',
          },
          notes: {
            type: 'string',
            description: 'Optional context — what the founder said about why this matters',
          },
        },
        required: ['title'],
      },
      execute: (args) => callVoiceTool('add_todo', args, ctx),
    }),

    track_demo_conversion: llm.tool({
      description:
        "Log a demo conversion / prospect signal during a sales conversation rehearsal or after a real demo. Use when the founder reports something a prospect said or how a demo went. Status options: 'interested' (showed interest), 'qualified' (real budget + timeline), 'objection_raised' (specific blocker), 'not_a_fit' (clear no), 'next_step_set' (concrete follow-up scheduled), 'converted' (signed / agreed), 'lost' (formally passed).",
      parameters: {
        type: 'object',
        properties: {
          prospectName: {
            type: 'string',
            description: "Name of the prospect, person, or company (e.g., 'Mr. Reiner', 'Sankore')",
          },
          status: {
            type: 'string',
            enum: ['interested', 'qualified', 'objection_raised', 'not_a_fit', 'next_step_set', 'converted', 'lost'],
            description: 'The outcome / signal level of this demo or conversation',
          },
          note: {
            type: 'string',
            description: 'Brief note — what specifically did the prospect say or do that maps to this status?',
          },
        },
        required: ['prospectName', 'status'],
      },
      execute: (args) => callVoiceTool('track_demo_conversion', args, ctx),
    }),

    log_positioning_note: llm.tool({
      description:
        "Save a sharper articulation of the product / value / positioning that emerged during the conversation. Use when the founder lands on a way of saying something that sounds clearly better than what they had before. Pitch Sharpener should use this aggressively — that's the deliverable.",
      parameters: {
        type: 'object',
        properties: {
          articulation: {
            type: 'string',
            description: 'The sharper articulation, in the founder’s own words',
          },
          context: {
            type: 'string',
            description: 'What was the previous (less-sharp) version, or what triggered the realisation?',
          },
        },
        required: ['articulation'],
      },
      execute: (args) => callVoiceTool('log_positioning_note', args, ctx),
    }),

    lookup_decision_log: llm.tool({
      description:
        'Search the founder’s decision log / past audited memos. Use when the founder asks "what did I say about X?" or "have we looked at this kind of decision before?". Returns up to 10 matching entries with id + title + date.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Optional search string — keywords from the title (e.g., "Sankore", "Series A")',
          },
          limit: {
            type: 'number',
            description: 'Max entries to return (default 5, max 10)',
          },
        },
      },
      execute: (args) => callVoiceTool('lookup_decision_log', args, ctx),
    }),

    lookup_recent_meetings: llm.tool({
      description:
        "Get the founder's most recent meetings list (title + date + id). Use when the founder asks 'what meetings did I have last week?' or 'what was the last conversation with X?'.",
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'How many recent meetings to fetch (default 5, max 10)',
          },
        },
      },
      execute: (args) => callVoiceTool('lookup_recent_meetings', args, ctx),
    }),

    lookup_design_partners: llm.tool({
      description:
        "Get the current design-partner pipeline (name + status + date). Use when the founder asks 'what's the status with Sankore?' or 'how's the design partner pipeline?'.",
      parameters: {
        type: 'object',
        properties: {},
      },
      execute: (args) => callVoiceTool('lookup_design_partners', args, ctx),
    }),
  };
}
