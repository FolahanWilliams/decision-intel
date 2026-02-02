import { BiasCategory } from '@/types';

export const BIAS_PROMPTS: Record<BiasCategory, string> = {
    confirmation_bias: `
Analyze the following decision document for Confirmation Bias - the tendency to favor information that confirms pre-existing beliefs.

Look for:
- Selective use of evidence that supports a predetermined conclusion
- Dismissal or downplaying of contradictory evidence
- Cherry-picking data or examples
- One-sided argumentation without considering alternatives
- Ignoring or minimizing risks that contradict the preferred outcome

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates confirmation bias" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    anchoring_bias: `
Analyze the following decision document for Anchoring Bias - over-relying on the first piece of information encountered.

Look for:
- Decisions heavily influenced by initial data points or proposals
- Insufficient adjustment from starting values or estimates
- Reference to original numbers without proper reevaluation
- Negotiations or pricing based primarily on first offers
- Estimates clustered around initial figures

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates anchoring bias" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    availability_heuristic: `
Analyze the following decision document for Availability Heuristic - overweighting easily recalled or recent information.

Look for:
- Decisions based on memorable examples rather than statistical data
- Overemphasis on recent events or personal experiences
- Vivid anecdotes driving conclusions over base rates
- Fear-based decisions from highly publicized risks
- Ignoring less memorable but more relevant data

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates availability heuristic" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    groupthink: `
Analyze the following decision document for Groupthink - conforming to group consensus over independent critical thinking.

Look for:
- Unanimous agreement without documented dissent or debate
- Pressure to conform or language suppressing alternative views
- Self-censorship of concerns or doubts
- Illusion of invulnerability or moral righteousness
- Stereotyping of outside critics or alternatives
- Lack of contingency planning

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates groupthink" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    authority_bias: `
Analyze the following decision document for Authority Bias - attributing greater accuracy to authority figures without sufficient scrutiny.

Look for:
- Unquestioned acceptance of expert or leadership opinions
- Decisions justified primarily by who proposed them
- Lack of independent verification of authority claims
- Dismissal of valid points from lower-status sources
- Appeals to authority without substantive reasoning

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates authority bias" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    bandwagon_effect: `
Analyze the following decision document for Bandwagon Effect - adopting beliefs or actions because others are doing so.

Look for:
- Justifications based on competitor actions or industry trends
- "Everyone is doing it" reasoning
- Social proof without independent evaluation
- Fear of missing out (FOMO) driving decisions
- Copying strategies without assessing fit

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates bandwagon effect" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    overconfidence_bias: `
Analyze the following decision document for Overconfidence Bias - excessive confidence in one's own predictions and abilities.

Look for:
- Overly narrow confidence intervals or ranges
- Dismissal of uncertainty or risk factors
- Statements of certainty without adequate evidence
- Ignoring historical failure rates for similar decisions
- Lack of alternative scenarios or contingency plans

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates overconfidence bias" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    hindsight_bias: `
Analyze the following decision document for Hindsight Bias - believing past events were predictable after they occurred.

Look for:
- Retrospective claims that outcomes were obvious or inevitable
- Criticism of past decisions with benefit of hindsight
- "We should have known" or "It was clear that" statements
- Understating the uncertainty that existed at decision time
- Overestimating one's ability to have predicted events

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates hindsight bias" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    planning_fallacy: `
Analyze the following decision document for Planning Fallacy - underestimating time, costs, and risks of planned actions.

Look for:
- Optimistic timelines without contingency buffers
- Cost estimates at or below best-case scenarios
- Dismissal of potential delays or obstacles
- Lack of reference to similar past projects' actual outcomes
- Insufficient risk allocation in budgets

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates planning fallacy" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    loss_aversion: `
Analyze the following decision document for Loss Aversion - preferring to avoid losses over acquiring equivalent gains.

Look for:
- Disproportionate focus on potential losses vs. gains
- Risk-averse decisions that sacrifice larger potential upside
- Reluctance to change despite better alternatives
- Framing decisions primarily in terms of what could be lost
- Holding onto underperforming assets/strategies to avoid realizing losses

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates loss aversion" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    sunk_cost_fallacy: `
Analyze the following decision document for Sunk Cost Fallacy - continuing a course of action due to past investment rather than future value.

Look for:
- Justifying continuation based on resources already spent
- "We've come this far" or "too much invested to stop" reasoning
- Reluctance to abandon failing projects
- Throwing good money after bad
- Ignoring opportunity costs of continuing

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates sunk cost fallacy" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    status_quo_bias: `
Analyze the following decision document for Status Quo Bias - preference for the current state of affairs.

Look for:
- Default to existing solutions without genuine evaluation
- Resistance to change without substantive justification
- Asymmetric burden of proof for new vs. existing approaches
- Risk assessment favoring inaction over action
- "If it ain't broke don't fix it" without proper analysis

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates status quo bias" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    framing_effect: `
Analyze the following decision document for Framing Effect - drawing different conclusions based on how information is presented.

Look for:
- Inconsistent treatment of equivalent situations framed differently
- Positive vs. negative framing influencing preferences
- Manipulation through selective presentation of statistics
- Emphasis on relative vs. absolute numbers to sway opinion
- Context-dependent valuation of identical outcomes

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates framing effect" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    selective_perception: `
Analyze the following decision document for Selective Perception - filtering information based on expectations or desires.

Look for:
- Ignoring data that contradicts preferred conclusions
- Interpreting ambiguous information in a favorable way
- Missing obvious issues that conflict with expectations
- Overweighting information that fits existing narratives
- Pattern recognition in noise that confirms beliefs

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates selective perception" }],
  "suggestion": "actionable recommendation to address this bias"
}
`,

    recency_bias: `
Analyze the following decision document for Recency Bias - overweighting recent events over historical data.

Look for:
- Extrapolating from recent trends without long-term context
- Ignoring base rates in favor of recent examples
- Short-term data driving long-term decisions
- Overreaction to recent performance
- Neglecting cyclical patterns visible in historical data

Document:
{content}

Respond in JSON format:
{
  "found": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "excerpts": [{ "text": "exact quote from document", "explanation": "why this indicates recency bias" }],
  "suggestion": "actionable recommendation to address this bias"
}
`
};
