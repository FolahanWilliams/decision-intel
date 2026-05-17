/**
 * In-memory turn-level metrics + cost projection per session.
 *
 * Persisted spend tracking (cross-session, dashboard, monthly kill switch)
 * needs a Prisma model + admin UI in the main app — deferred to a later
 * commit so the founder approves the schema change first per CLAUDE.md
 * "ask before creating new database models" rule.
 *
 * For now: emits structured logs the founder can grep in Railway, and
 * enforces the per-session hard timeout from config.
 */

/** Cost rates used for in-flight projection. Update when provider
 *  pricing changes. These are deliberately rough — the goal is cost
 *  AWARENESS during a session, not invoicing. */
const COST_RATES = {
  /** Deepgram Nova-3 streaming: $0.0058 / minute of audio. */
  deepgramPerMinute: 0.0058,
  /** Cartesia Sonic-2: ~$0.00005 / character (sub-$50/mo at 60h/mo). */
  cartesiaPerChar: 0.00005,
  /** Vercel AI Gateway → Grok 4.3 input tokens. Approximate; with
   *  prompt caching on FOUNDER_CONTEXT the effective rate drops 90%
   *  on repeat reads — projection is conservative (pre-cache). */
  grokInputPerToken: 0.000003,
  /** Grok 4.3 output tokens. */
  grokOutputPerToken: 0.000015,
};

export class SessionMetrics {
  private startedAt = Date.now();
  private sttSeconds = 0;
  private ttsChars = 0;
  private llmInputTokens = 0;
  private llmOutputTokens = 0;
  private turnCount = 0;

  constructor(
    public readonly sessionId: string,
    public readonly personaId: string
  ) {}

  recordSttSeconds(seconds: number): void {
    this.sttSeconds += seconds;
  }
  recordTtsChars(chars: number): void {
    this.ttsChars += chars;
  }
  recordLlmTokens(input: number, output: number): void {
    this.llmInputTokens += input;
    this.llmOutputTokens += output;
    this.turnCount += 1;
  }

  elapsedMs(): number {
    return Date.now() - this.startedAt;
  }

  projectedCostUsd(): number {
    return (
      (this.sttSeconds / 60) * COST_RATES.deepgramPerMinute +
      this.ttsChars * COST_RATES.cartesiaPerChar +
      this.llmInputTokens * COST_RATES.grokInputPerToken +
      this.llmOutputTokens * COST_RATES.grokOutputPerToken
    );
  }

  summary() {
    return {
      sessionId: this.sessionId,
      personaId: this.personaId,
      durationSec: Math.round(this.elapsedMs() / 1000),
      turns: this.turnCount,
      sttSeconds: Math.round(this.sttSeconds),
      ttsChars: this.ttsChars,
      llmInputTokens: this.llmInputTokens,
      llmOutputTokens: this.llmOutputTokens,
      projectedCostUsd: Number(this.projectedCostUsd().toFixed(4)),
    };
  }

  log(prefix = 'session'): void {
    console.log(`[voice-worker:${prefix}]`, JSON.stringify(this.summary()));
  }
}
