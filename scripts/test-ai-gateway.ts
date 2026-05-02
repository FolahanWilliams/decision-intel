/**
 * Smoke test for the Vercel AI Gateway integration (Phase 1, locked
 * 2026-05-02).
 *
 * Verifies that:
 *   1. AI_GATEWAY_API_KEY is present in the local environment.
 *   2. The `ai` package is installed and importable.
 *   3. The gateway provider at src/lib/ai/providers/gateway.ts compiles
 *      and responds end-to-end via at least one Gateway-routed model.
 *   4. Token usage telemetry surfaces correctly through our wrapper.
 *
 * Mirrors the founder's pasted quickstart (`streamText` with
 * `'openai/gpt-5.4'`) but tests TWO model families to prove the
 * Gateway's multi-provider routing works (the whole point of the
 * migration):
 *   - `openai/gpt-5.4`  — the model from the quickstart paste
 *   - `google/gemini-3.1-flash-lite` — proves Gemini still routes via
 *     the same gateway, easing future Phase-2 surface migration
 *
 * Run with: `npm run test:gateway`
 *
 * Exit codes:
 *   0 — both calls succeeded
 *   1 — AI_GATEWAY_API_KEY missing
 *   2 — model call failed (typically: invalid model id, gateway 403/429,
 *       or network)
 */

// Load env vars in Next.js precedence order: .env.local overrides .env
// (dotenv/config alone only loads .env). The Vercel AI Gateway docs +
// `vercel env pull` both write to .env.local, so we honor that here.
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { generateText, streamText } from '../src/lib/ai/providers/gateway';

const PROMPT = 'In 2-3 sentences, explain the Recognition-Rigor Framework (R²F) — Decision Intel\'s synthesis of Kahneman & Klein. Be specific.';

async function runStreamingTest(model: string): Promise<{
  success: boolean;
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}> {
  process.stdout.write(`\n─── streamText test · ${model} ───\n`);

  try {
    const result = streamText(PROMPT, { model });

    let text = '';
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
      text += chunk;
    }

    const usage = await result.usage;
    process.stdout.write(
      `\n→ tokens · in=${usage.inputTokens ?? '?'} out=${usage.outputTokens ?? '?'} total=${usage.totalTokens ?? '?'}\n`
    );

    return {
      success: true,
      text,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
    };
  } catch (err) {
    process.stdout.write(`\n✗ FAILED: ${(err as Error).message}\n`);
    return { success: false, text: '' };
  }
}

async function runGenerateTest(model: string): Promise<boolean> {
  process.stdout.write(`\n─── generateText test · ${model} ───\n`);

  try {
    const result = await generateText(PROMPT, { model });
    process.stdout.write(result.text);
    process.stdout.write(
      `\n→ ${result.latencyMs}ms · tokens in=${result.inputTokens ?? '?'} out=${result.outputTokens ?? '?'}\n`
    );
    return true;
  } catch (err) {
    process.stdout.write(`\n✗ FAILED: ${(err as Error).message}\n`);
    return false;
  }
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    process.stderr.write(
      '✗ AI_GATEWAY_API_KEY is not set after loading .env.local.\n'
    );

    // Common failure mode: case-sensitivity typo when the var was added in
    // the Vercel dashboard (e.g. `Ai_GATEWAY_API_KEY` with lowercase i).
    // Surface near-matches so the founder spots the typo without having to
    // manually grep .env.local. We only print key names, never values.
    const TARGET = 'AI_GATEWAY_API_KEY';
    const similar = Object.keys(process.env).filter(k => {
      if (k === TARGET) return false;
      const upper = k.toUpperCase();
      return upper === TARGET || upper.includes('GATEWAY') || upper.includes('AI_GATEWAY');
    });

    if (similar.length > 0) {
      process.stderr.write(
        '\n  Possible typo — these similarly-named env vars ARE set:\n'
      );
      for (const k of similar) {
        process.stderr.write(`    · ${k}\n`);
      }
      process.stderr.write(
        `\n  If one of those is the gateway key, rename it to ${TARGET} in your\n` +
          '  Vercel dashboard → Settings → Environment Variables, then re-run\n' +
          '  `vercel env pull .env.local` and `npm run test:gateway`.\n'
      );
    } else {
      process.stderr.write(
        '\n  No similarly-named vars found. Add AI_GATEWAY_API_KEY to .env.local\n' +
          '  (or to your Vercel project → Settings → Environment Variables, then\n' +
          '  pull with `vercel env pull .env.local`).\n'
      );
    }

    process.exit(1);
  }

  process.stdout.write(
    'Vercel AI Gateway smoke test · Phase 1 of the multi-model migration\n'
  );
  process.stdout.write(
    `Key length: ${process.env.AI_GATEWAY_API_KEY.length} chars (not echoed for safety)\n`
  );

  // 1) streamText against the model the founder's quickstart specified.
  const streamResult = await runStreamingTest('openai/gpt-5.4');

  // 2) generateText against a Gemini model routed through the gateway —
  // proves we keep model parity with current pipeline IF we choose to
  // route Gemini through the gateway in Phase 2/3.
  const geminiResult = await runGenerateTest('google/gemini-3.1-flash-lite');

  process.stdout.write('\n─── Summary ───\n');
  process.stdout.write(`openai/gpt-5.4 (streamText)            : ${streamResult.success ? 'OK' : 'FAILED'}\n`);
  process.stdout.write(`google/gemini-3.1-flash-lite (generate): ${geminiResult ? 'OK' : 'FAILED'}\n`);

  if (!streamResult.success || !geminiResult) {
    process.stdout.write(
      '\nOne or more calls failed. Check (a) AI_GATEWAY_API_KEY is valid, (b) the model id matches what your gateway plan supports, (c) you have sufficient quota.\n'
    );
    process.exit(2);
  }

  process.stdout.write(
    '\n✓ Phase 1 integration verified. Ready for staged migration of non-pipeline surfaces (Phase 2).\n'
  );
}

main().catch(err => {
  process.stderr.write(`\nUnhandled error: ${(err as Error).stack ?? err}\n`);
  process.exit(2);
});
