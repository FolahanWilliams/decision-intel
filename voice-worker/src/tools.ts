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

      console.error(
        `[voice-worker] tool ${toolName} HTTP error: ${res.status} ${res.statusText} elapsedMs=${elapsed} body=${body.slice(0, 200)}`
      );
      // Return a string the LLM can read + recover from (don't throw —
      // throwing breaks the tool-call cycle).
      return `Tool error (${res.status}): ${body.slice(0, 150) || res.statusText}`;
    }
    const data = (await res.json()) as { ok?: boolean; result?: unknown };

    console.log(
      `[voice-worker] tool ${toolName} ok=${data.ok} elapsedMs=${elapsed} args=${JSON.stringify(args).slice(0, 200)}`
    );
    // Return result as a JSON string so the LLM can parse it. Keeps
    // schema flexibility per-tool without imposing a rigid response
    // shape.
    return JSON.stringify(data.result ?? data);
  } catch (err) {
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
            description:
              'Short, action-oriented todo title (e.g., "Email Mr. Reiner re: Sankore intro by Thursday")',
          },
          dueDate: {
            type: 'string',
            description:
              'Optional ISO date string (YYYY-MM-DD) if the founder named a specific deadline',
          },
          notes: {
            type: 'string',
            description: 'Optional context — what the founder said about why this matters',
          },
        },
        required: ['title'],
      },
      execute: args => callVoiceTool('add_todo', args, ctx),
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
            enum: [
              'interested',
              'qualified',
              'objection_raised',
              'not_a_fit',
              'next_step_set',
              'converted',
              'lost',
            ],
            description: 'The outcome / signal level of this demo or conversation',
          },
          note: {
            type: 'string',
            description:
              'Brief note — what specifically did the prospect say or do that maps to this status?',
          },
        },
        required: ['prospectName', 'status'],
      },
      execute: args => callVoiceTool('track_demo_conversion', args, ctx),
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
            description:
              'What was the previous (less-sharp) version, or what triggered the realisation?',
          },
        },
        required: ['articulation'],
      },
      execute: args => callVoiceTool('log_positioning_note', args, ctx),
    }),

    lookup_decision_log: llm.tool({
      description:
        'Search the founder’s decision log / past audited memos. Use when the founder asks "what did I say about X?" or "have we looked at this kind of decision before?". Returns up to 10 matching entries with id + title + date.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Optional search string — keywords from the title (e.g., "Sankore", "Series A")',
          },
          limit: {
            type: 'number',
            description: 'Max entries to return (default 5, max 10)',
          },
        },
      },
      execute: args => callVoiceTool('lookup_decision_log', args, ctx),
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
      execute: args => callVoiceTool('lookup_recent_meetings', args, ctx),
    }),

    lookup_design_partners: llm.tool({
      description:
        "Get the current design-partner pipeline (name + status + date). Use when the founder asks 'what's the status with Sankore?' or 'how's the design partner pipeline?'.",
      parameters: {
        type: 'object',
        properties: {},
      },
      execute: args => callVoiceTool('lookup_design_partners', args, ctx),
    }),

    // ─── Phase-2-extended write tools ─────────────────────────────────
    log_outreach_event: llm.tool({
      description:
        "Log an outreach event with a specific person — when the founder reports they made an intro, got a reply, met someone, etc. Distinct from add_todo (which is for FUTURE work) — this captures a PAST interaction. Event types: 'intro_made' (founder asked someone to intro them), 'replied' (target responded to outreach), 'met' (in-person or call happened), 'no_response' (outreach ignored), 'rescheduled' (meeting moved), 'lost_contact' (gave up), 'note' (general remark).",
      parameters: {
        type: 'object',
        properties: {
          personName: {
            type: 'string',
            description: 'Name of the person involved (e.g., "Mr. Reiner", "Adaeze at Conviction")',
          },
          eventType: {
            type: 'string',
            enum: [
              'intro_made',
              'replied',
              'met',
              'no_response',
              'rescheduled',
              'lost_contact',
              'note',
            ],
            description: 'What happened in this outreach interaction',
          },
          note: {
            type: 'string',
            description: 'Brief context — what was said, what came of it, what the next step is',
          },
        },
        required: ['personName', 'eventType'],
      },
      execute: args => callVoiceTool('log_outreach_event', args, ctx),
    }),

    log_meeting: llm.tool({
      description:
        'Log a meeting that just happened or that the founder is recapping. Use when the founder narrates a meeting they had — captures the title, attendees, free-form notes, and any high-stakes decisions raised so the meetings log + decision archaeology stay current.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description:
              "Short title (e.g., 'Sankore investment scoping call', 'Mr. Reiner advisor sync')",
          },
          attendees: {
            type: 'array',
            items: { type: 'string' },
            description: "Names of who was present (e.g., ['Folahan', 'Mr. Reiner'])",
          },
          notes: {
            type: 'string',
            description: 'Free-form notes — what got discussed, what got committed, what surprised',
          },
          decisionsRaised: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Strategic decisions that came up that should be added to the decision log',
          },
        },
        required: ['title'],
      },
      execute: args => callVoiceTool('log_meeting', args, ctx),
    }),

    log_lesson_learned: llm.tool({
      description:
        "Save a lesson learned that's worth remembering. Use when the founder articulates an insight, a pattern they noticed, or a mistake they want to avoid repeating. These accumulate into the Founder Tips Appendix over time.",
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description:
              "Category for the lesson (e.g., 'sales', 'fundraise', 'product', 'positioning', 'general')",
          },
          learning: {
            type: 'string',
            description: "The lesson itself, in the founder's own words",
          },
        },
        required: ['learning'],
      },
      execute: args => callVoiceTool('log_lesson_learned', args, ctx),
    }),

    schedule_followup: llm.tool({
      description:
        "Schedule a follow-up with a specific person on a specific date. Distinct from add_todo (which is general task tracking) — this is specifically for outbound contact follow-ups, so it can drive an outreach reminder cadence later. Use when founder says 'remind me to follow up with X on Y' or 'set a follow-up for Friday with Z'.",
      parameters: {
        type: 'object',
        properties: {
          personName: {
            type: 'string',
            description: 'Person to follow up with',
          },
          dueDate: {
            type: 'string',
            description: 'ISO date string YYYY-MM-DD',
          },
          context: {
            type: 'string',
            description: 'What the follow-up is about — context for future-self',
          },
        },
        required: ['personName', 'dueDate'],
      },
      execute: args => callVoiceTool('schedule_followup', args, ctx),
    }),

    // ─── Phase-2-extended read tools ──────────────────────────────────
    lookup_outreach_status: llm.tool({
      description:
        "Look up recent outreach activity. Optionally filter by person name. Returns the agent's own log_outreach_event entries from the last N days — useful when founder asks 'what's the status with X?' or 'when did I last talk to Y?'.",
      parameters: {
        type: 'object',
        properties: {
          personName: {
            type: 'string',
            description: 'Optional — filter to one person (substring match, case-insensitive)',
          },
          lookbackDays: {
            type: 'number',
            description: 'How far back to look (default 30, max 90)',
          },
        },
      },
      execute: args => callVoiceTool('lookup_outreach_status', args, ctx),
    }),

    lookup_sparring_history: llm.tool({
      description:
        'Get recent Sparring Room rep history (sales DQI scores, dimensions, persona+mode). Use when founder asks about their pitching practice trends. Note: sparring history is currently stored client-side; this tool returns a placeholder until server-side persistence ships.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of recent reps to fetch (default 5, max 10)',
          },
        },
      },
      execute: args => callVoiceTool('lookup_sparring_history', args, ctx),
    }),

    lookup_recent_audits: llm.tool({
      description:
        "Get the founder's most recent strategic memo audits with DQI score + grade + doc title. Use when founder asks 'what was my last audit?' or 'what's the trend on my DQI scores?'.",
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of recent audits to fetch (default 5, max 10)',
          },
        },
      },
      execute: args => callVoiceTool('lookup_recent_audits', args, ctx),
    }),

    capture_novel_idea: llm.tool({
      description:
        'AUTONOMOUS — fire when the conversation has produced a genuinely novel idea, mechanism, analogy, or falsifier the founder should review later. Do NOT ask permission; capture and tell him you did. Reserve for: (a) a causal mechanism articulated for the first time in this conversation, (b) a cross-domain analogy that opened a non-obvious next step, (c) a steelman/red-team that surfaced a real falsifier, (d) a reintegration candidate worth shipping back into Decision Intel as a feature / new bias detector / positioning shift / new persona. Do NOT capture summaries of things the founder already knows, restatements of locked positioning, or generic encouragement. Three or four genuine captures per week is the right cadence; thirty is noise. The founder reviews captures on the Voice Activity dashboard.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description:
              'Tight idea title, 6-12 words, action-oriented (e.g., "DI-B-023 candidate: anchor-shift bias in cross-currency comparables")',
          },
          mechanism: {
            type: 'string',
            description:
              'The causal chain in one sentence — X causes Y because of intermediate steps A and B. The mechanism IS the captured insight; without it the capture is decorative.',
          },
          summary: {
            type: 'string',
            description:
              'Brief context — what the founder was working through when this surfaced, and why it qualified for capture.',
          },
          reintegrationVerdict: {
            type: 'string',
            enum: [
              'ship_to_di',
              'shift_positioning',
              'new_bias_detector',
              'new_persona',
              'side_bet_outside_di',
              'falsifier_to_test',
              'discard_after_review',
            ],
            description:
              'Where this idea lives next. ship_to_di = becomes a feature in Decision Intel. shift_positioning = changes how DI is described to buyers. new_bias_detector = candidate for the bias taxonomy (DI-B-023+). new_persona = candidate for a new voice persona / chat persona. side_bet_outside_di = explore on its own track, not part of DI. falsifier_to_test = a specific test that would validate or kill an existing claim. discard_after_review = capture for memory but the founder will likely drop it.',
          },
          falsifier: {
            type: 'string',
            description:
              'Optional — what evidence in the next 90 days would prove this idea wrong? A capture without a falsifier is a story; a capture WITH one is a hypothesis.',
          },
        },
        required: ['title', 'mechanism', 'reintegrationVerdict'],
      },
      execute: args => callVoiceTool('capture_novel_idea', args, ctx),
    }),
  };
}
