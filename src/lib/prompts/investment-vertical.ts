/**
 * Investment Vertical — Specialized Prompts
 *
 * When the system detects investment-related decision types
 * (capital_allocation, investment_thesis, portfolio_exit, m_and_a),
 * these specialized system prompts are injected into the bias detective
 * and noise judge nodes to improve detection accuracy for PE/VC/HF contexts.
 */

export const INVESTMENT_BIAS_DETECTIVE_PROMPT = `You are analyzing an investment decision document. Focus on investment-specific cognitive biases:

1. **Anchoring to Entry Price** — Is the decision anchored to the original investment thesis or entry valuation rather than current fundamentals?
2. **Confirmation Bias in Thesis Validation** — Is the analysis selectively seeking evidence that confirms the existing investment thesis while ignoring contradictory signals?
3. **Sunk Cost in Portfolio Holds** — Is the recommendation to hold or double down driven by the amount already invested rather than forward-looking returns?
4. **Survivorship Bias** — Is the analysis comparing only to successful exits/deals while ignoring the base rate of failures?
5. **Herd Behavior** — Is the thesis following market consensus or peer fund positioning without independent analysis?
6. **Disposition Effect** — Is there pressure to realize gains too early or hold losses too long?
7. **Overconfidence in Projections** — Are revenue/growth projections unrealistically precise or optimistic given comparable base rates?
8. **Narrative Fallacy** — Is a compelling story overriding quantitative analysis?

When detecting biases, always reference specific monetary figures, multiples, or projections from the document to ground your findings.`;

export const INVESTMENT_NOISE_JUDGE_PROMPT = `You are evaluating decision noise in an investment context. Assess:

1. **Valuation Noise** — Would different analysts arrive at materially different valuations (>20% spread) from the same data? Flag if valuation methodology is subjective or cherry-picks comparables.
2. **Timing Noise** — Would this decision change materially if evaluated on a different day, in a different market environment, or at a different point in the fund cycle?
3. **Framing Noise** — Is the investment framed as an opportunity (upside focus) vs a risk management decision (downside focus)? Would reframing change the conclusion?
4. **Committee Noise** — If presented to a different investment committee, would the outcome likely differ? Flag where individual preferences dominate.

Express noise as a percentage (0-100%). Investment decisions below 30% noise are well-structured; above 60% suggests the decision is driven more by judgment variability than by the underlying fundamentals.`;

/** Map decision types to whether they should use investment-specific prompts */
export function isInvestmentDecision(decisionType?: string): boolean {
  return ['capital_allocation', 'investment_thesis', 'portfolio_exit', 'm_and_a'].includes(
    decisionType ?? ''
  );
}

/** Get the appropriate system prompt suffix for investment decisions */
export function getInvestmentPromptSuffix(decisionType?: string): {
  biasPrompt: string;
  noisePrompt: string;
} | null {
  if (!isInvestmentDecision(decisionType)) return null;
  return {
    biasPrompt: INVESTMENT_BIAS_DETECTIVE_PROMPT,
    noisePrompt: INVESTMENT_NOISE_JUDGE_PROMPT,
  };
}
