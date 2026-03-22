# Proprietary Model Training Plan — MacBook Pro + MLX

> **Goal:** Train a domain-specialized cognitive auditor model that competitors cannot replicate without your user-generated outcome data.
> **Platform:** MacBook Pro with Apple Silicon (M1/M2/M3/M4)
> **Framework:** Apple MLX + mlx-lm (native Metal acceleration, no CUDA needed)
> **Timeline:** 4-6 weeks from data preparation to A/B testing

---

## Phase 1: Environment Setup (Day 1)

### 1.1 Install MLX and Dependencies

```bash
# Create a dedicated Python environment
python3 -m venv ~/neuroaudit-ml
source ~/neuroaudit-ml/bin/activate

# Install MLX ecosystem
pip install mlx mlx-lm transformers datasets huggingface_hub

# Install data prep tools
pip install pandas jsonlines prisma supabase
```

### 1.2 Choose Your Base Model

| Model | Size | RAM Needed (4-bit) | License | Best For |
|-------|------|---------------------|---------|----------|
| **Llama-3.1-8B-Instruct** | 8B | ~6GB | Meta Community | Best overall quality/size ratio |
| **Mistral-7B-Instruct-v0.3** | 7B | ~5GB | Apache 2.0 | Fast inference, good instruction following |
| **Gemma-2-9B-IT** | 9B | ~7GB | Google Permissive | Strong reasoning, familiar Gemini-like behavior |
| **Phi-3-medium-4k** | 14B | ~10GB | MIT | Best quality if you have 16GB+ RAM |

**Recommendation:** Start with **Llama-3.1-8B-Instruct** — best balance of quality, Apache-compatible license, and Mac performance.

```bash
# Download and quantize the base model
python -m mlx_lm.convert \
  --hf-path meta-llama/Llama-3.1-8B-Instruct \
  --mlx-path ./models/llama-3.1-8b-4bit \
  --quantize --q-bits 4
```

---

## Phase 2: Dataset Creation (Days 2-7)

This is the **most important phase** — your dataset IS your moat. Every example comes from real NeuroAudit analyses and user outcomes.

### 2.1 Export Training Data from Supabase/Prisma

Create a data export script. Save this as `scripts/export-training-data.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface TrainingExample {
  prompt: string;
  response: string;
  metadata: {
    analysisId: string;
    overallScore: number;
    outcomeVerified: boolean;
    userRating?: number;
  };
}

async function exportSFTDataset() {
  // Fetch analyses with outcomes (highest value data)
  const analyses = await prisma.analysis.findMany({
    include: {
      document: { select: { content: true, filename: true } },
      biases: true,
      outcome: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const examples: TrainingExample[] = [];

  for (const analysis of analyses) {
    // Skip analyses without substantial content
    if (!analysis.document.content || analysis.document.content.length < 100) continue;

    // Truncate document to fit context window
    const docContent = analysis.document.content.slice(0, 4000);

    // Build the "ideal" response from your 15-agent pipeline output
    const biasSection = analysis.biases
      .map(b => `- **${b.biasType}** (${b.severity}): ${b.explanation}\n  *Suggestion:* ${b.suggestion}`)
      .join('\n');

    const response = JSON.stringify({
      overallScore: analysis.overallScore,
      noiseScore: analysis.noiseScore,
      summary: analysis.summary,
      biases: analysis.biases.map(b => ({
        biasType: b.biasType,
        severity: b.severity,
        explanation: b.explanation,
        suggestion: b.suggestion,
        confidence: b.confidence,
      })),
      compliance: analysis.compliance,
      preMortem: analysis.preMortem,
      simulation: analysis.simulation,
      metaVerdict: analysis.metaVerdict,
    }, null, 2);

    examples.push({
      prompt: `You are NeuroAudit, a cognitive bias auditor for high-stakes business decisions. Analyze the following document for cognitive biases, decision noise, logical fallacies, and strategic risks. Provide a comprehensive audit.\n\n<document>\n${docContent}\n</document>`,
      response,
      metadata: {
        analysisId: analysis.id,
        overallScore: analysis.overallScore,
        outcomeVerified: !!analysis.outcome,
        userRating: analysis.biases[0]?.userRating ?? undefined,
      },
    });
  }

  // Write JSONL for SFT training
  const sftLines = examples.map(ex => JSON.stringify({
    messages: [
      { role: 'system', content: 'You are NeuroAudit, a specialized cognitive bias auditor.' },
      { role: 'user', content: ex.prompt },
      { role: 'assistant', content: ex.response },
    ],
  }));

  fs.writeFileSync('data/sft_dataset.jsonl', sftLines.join('\n'));
  console.log(`Exported ${examples.length} SFT examples`);

  // Create DPO preference pairs from outcome data
  const dpoExamples = [];
  const outcomeAnalyses = analyses.filter(a => a.outcome);

  for (const analysis of outcomeAnalyses) {
    if (!analysis.outcome) continue;

    const isGoodOutcome = analysis.outcome.outcome === 'success' || analysis.outcome.outcome === 'partial_success';
    const confirmedBiases = analysis.outcome.confirmedBiases || [];
    const falsePositives = analysis.outcome.falsPositiveBiases || [];

    // The "chosen" response emphasizes confirmed biases
    // The "rejected" response includes false positives
    if (confirmedBiases.length > 0 || falsePositives.length > 0) {
      const docContent = analysis.document.content.slice(0, 4000);

      // Build chosen (accurate) and rejected (inaccurate) responses
      const chosenBiases = analysis.biases.filter(b =>
        confirmedBiases.includes(b.biasType)
      );
      const rejectedBiases = analysis.biases.filter(b =>
        falsePositives.includes(b.biasType)
      );

      if (chosenBiases.length > 0 && rejectedBiases.length > 0) {
        dpoExamples.push({
          prompt: `Analyze this document for cognitive biases:\n\n${docContent}`,
          chosen: `Detected biases:\n${chosenBiases.map(b => `- ${b.biasType}: ${b.explanation}`).join('\n')}`,
          rejected: `Detected biases:\n${rejectedBiases.map(b => `- ${b.biasType}: ${b.explanation}`).join('\n')}`,
        });
      }
    }
  }

  fs.writeFileSync('data/dpo_dataset.jsonl', dpoExamples.map(ex => JSON.stringify(ex)).join('\n'));
  console.log(`Exported ${dpoExamples.length} DPO preference pairs`);

  await prisma.$disconnect();
}

exportSFTDataset().catch(console.error);
```

### 2.2 Augment with Synthetic Data (If You Have <500 Examples)

If your real dataset is small, generate synthetic training examples:

```bash
# Use your existing Gemini pipeline to generate synthetic audits
# of publicly available board papers, annual reports, and strategy docs
```

**Sources for synthetic data generation:**
- SEC EDGAR filings (10-K, proxy statements)
- UK Companies House filings
- Public board papers from government agencies
- Academic case studies on decision-making failures
- Your own test documents from development

**Target dataset sizes:**
- **Minimum viable:** 500 SFT examples + 100 DPO pairs
- **Good:** 2,000 SFT + 500 DPO pairs
- **Production-ready:** 5,000+ SFT + 1,000+ DPO pairs

### 2.3 Dataset Quality Checklist

- [ ] Every example has a system prompt identifying the model as NeuroAudit
- [ ] Responses follow the exact JSON schema your frontend expects
- [ ] Bias types match your `normalizeBiasType()` mappings
- [ ] Severity levels match your `SEVERITY_LEVELS` constants
- [ ] Score ranges are 0-100 and consistent
- [ ] No PII in training data (run through your GDPR anonymizer)
- [ ] DPO pairs have clear quality differences (confirmed vs false-positive biases)

---

## Phase 3: Fine-Tuning on MacBook Pro (Days 8-14)

### 3.1 SFT (Supervised Fine-Tuning) with LoRA

LoRA (Low-Rank Adaptation) is critical for Mac training — it keeps memory under 16GB.

```bash
# Run fine-tuning with MLX
python -m mlx_lm.lora \
  --model ./models/llama-3.1-8b-4bit \
  --data ./data \
  --train \
  --iters 500 \
  --batch-size 4 \
  --learning-rate 1e-5 \
  --lora-layers 16 \
  --adapter-path ./adapters/neuroaudit-sft-v1

# Expected time on M3 Pro: ~2-4 hours for 500 iterations
# Expected time on M1/M2: ~4-8 hours for 500 iterations
# RAM usage: ~8-12GB (with 4-bit quantization)
```

**Key hyperparameters to tune:**
| Parameter | Start | Range | Notes |
|-----------|-------|-------|-------|
| `--iters` | 500 | 200-2000 | More data = more iterations |
| `--batch-size` | 4 | 1-8 | Lower if OOM, higher if RAM allows |
| `--learning-rate` | 1e-5 | 5e-6 to 5e-5 | Lower for smaller datasets |
| `--lora-layers` | 16 | 8-32 | More layers = more expressive but slower |

### 3.2 DPO (Direct Preference Optimization) — After SFT

Once SFT produces a reasonable model, refine with DPO using your preference data:

```bash
python -m mlx_lm.lora \
  --model ./models/llama-3.1-8b-4bit \
  --adapter-path ./adapters/neuroaudit-sft-v1 \
  --data ./data/dpo \
  --train \
  --iters 200 \
  --batch-size 2 \
  --learning-rate 5e-6 \
  --lora-layers 16 \
  --adapter-path ./adapters/neuroaudit-dpo-v1
```

### 3.3 Evaluation During Training

Monitor these metrics during training:
- **Training loss:** Should decrease steadily, flatten by ~300 iters
- **Validation loss:** Track on held-out 10% of data — stop if it starts increasing
- **JSON parse rate:** What % of outputs are valid JSON?
- **Bias detection accuracy:** Compare to Gemini outputs on same documents

```bash
# Test the fine-tuned model
python -m mlx_lm.generate \
  --model ./models/llama-3.1-8b-4bit \
  --adapter-path ./adapters/neuroaudit-sft-v1 \
  --max-tokens 2048 \
  --prompt "You are NeuroAudit. Analyze: The board unanimously approved the acquisition..."
```

---

## Phase 4: Agent-Specific Models (Days 15-21)

Instead of one monolithic model, consider training specialized LoRA adapters for your highest-value agents:

### 4.1 Priority Agents for Fine-Tuning

| Agent | Why Fine-Tune? | Training Data Source |
|-------|---------------|---------------------|
| **Bias Detective** | Core value prop — accuracy here = moat | BiasInstance + userRating + confirmedBiases |
| **Noise Judge** | Consistency scoring is domain-specific | noiseScore + noiseBenchmarks |
| **Simulation (Decision Twins)** | Most creative/differentiated node | simulation output + mostAccurateTwin |
| **Risk Scorer** | Final output quality | overallScore + DecisionOutcome |

### 4.2 Per-Agent Training

```bash
# Train Bias Detective adapter
python -m mlx_lm.lora \
  --model ./models/llama-3.1-8b-4bit \
  --data ./data/bias-detective \
  --train \
  --iters 300 \
  --adapter-path ./adapters/bias-detective-v1

# Train Simulation adapter
python -m mlx_lm.lora \
  --model ./models/llama-3.1-8b-4bit \
  --data ./data/simulation \
  --train \
  --iters 300 \
  --adapter-path ./adapters/simulation-v1
```

### 4.3 Integration Pattern

Modify `src/lib/agents/nodes.ts` to support a hybrid model strategy:

```typescript
// In nodes.ts — add model selection logic
async function getModelForAgent(agentName: string): Promise<'gemini' | 'local'> {
  // Check if custom model is available and enabled
  const useCustomModel = process.env.NEUROAUDIT_CUSTOM_MODEL === 'true';
  const availableAgents = (process.env.CUSTOM_MODEL_AGENTS || '').split(',');

  if (useCustomModel && availableAgents.includes(agentName)) {
    return 'local';
  }
  return 'gemini';
}
```

---

## Phase 5: Local Inference Server (Days 22-25)

### 5.1 MLX Inference Server

Run your fine-tuned model as a local API:

```bash
# Start MLX server (compatible with OpenAI API format)
python -m mlx_lm.server \
  --model ./models/llama-3.1-8b-4bit \
  --adapter-path ./adapters/neuroaudit-sft-v1 \
  --port 8080
```

### 5.2 Integration with NeuroAudit

Create a local model client in your codebase:

```typescript
// src/lib/models/local-inference.ts
export async function queryLocalModel(prompt: string, systemPrompt?: string) {
  const res = await fetch('http://localhost:8080/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'neuroaudit-v1',
      messages: [
        { role: 'system', content: systemPrompt || 'You are NeuroAudit.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.3,
    }),
  });
  return res.json();
}
```

### 5.3 Production Hosting Options

| Option | Cost | Latency | Best For |
|--------|------|---------|----------|
| **Local MLX server** | $0 | ~2-5s | Development, demo |
| **Hugging Face Inference Endpoints** | ~$0.06/hr | ~1-3s | Staging, low-traffic |
| **AWS Inferentia / Google Cloud TPU** | ~$0.20/hr | ~0.5-2s | Production |
| **Modal.com** | Pay-per-use | ~1-3s | Serverless, bursty traffic |
| **Replicate** | ~$0.001/run | ~2-5s | Simple deployment |

---

## Phase 6: A/B Testing (Days 26-35)

### 6.1 Set Up A/B Framework

Use your existing `PromptVersion` model to track which model (Gemini vs custom) produced each analysis:

```typescript
// In analyzer.ts — A/B test model selection
const modelVariant = Math.random() < 0.5 ? 'gemini' : 'neuroaudit-v1';
// Store in analysis metadata for comparison
```

### 6.2 Metrics to Compare

| Metric | How to Measure | Target |
|--------|---------------|--------|
| **Bias accuracy** | confirmedBiases / (confirmed + falsePositive) | Custom > Gemini by 5%+ |
| **User ratings** | Average BiasInstance.userRating | Custom >= Gemini |
| **JSON validity** | % of outputs that parse correctly | >99% |
| **Latency** | Time to complete analysis | Custom < 2x Gemini |
| **Outcome prediction** | Does overallScore correlate with DecisionOutcome? | Higher R² for custom |
| **Nudge helpfulness** | Nudge.wasHelpful rate | Custom >= Gemini |

### 6.3 Decision Criteria

Switch fully to custom model when:
- Bias accuracy is 5%+ higher than Gemini for 2+ weeks
- User ratings are equal or higher
- JSON validity is >99%
- Latency is acceptable (<2x Gemini)

Keep Gemini as fallback for:
- Edge cases where custom model output doesn't parse
- New document types not represented in training data
- Rate limiting / scaling overflow

---

## Phase 7: Continuous Improvement Loop (Ongoing)

### 7.1 Auto-Collect New Training Data

Every analysis with user feedback automatically becomes training data:

```
User uploads document
  → Pipeline analyzes
    → User rates biases (userRating)
      → Outcome reported (DecisionOutcome)
        → Export to training dataset
          → Weekly re-training job
```

### 7.2 Weekly Retraining Cadence

```bash
# Cron: Sunday 2 AM — Export new data + retrain
#!/bin/bash
source ~/neuroaudit-ml/bin/activate
cd ~/neuroaudit-model

# Export latest data
npx ts-node scripts/export-training-data.ts

# Run incremental fine-tuning (continue from last checkpoint)
python -m mlx_lm.lora \
  --model ./models/llama-3.1-8b-4bit \
  --adapter-path ./adapters/neuroaudit-sft-latest \
  --data ./data \
  --train \
  --iters 100 \
  --adapter-path ./adapters/neuroaudit-sft-$(date +%Y%m%d)
```

### 7.3 Model Versioning

Track model versions alongside analysis versions:

```
adapters/
  neuroaudit-sft-v1/          # Initial fine-tune
  neuroaudit-sft-v2/          # After 1 month of data
  neuroaudit-dpo-v1/          # First DPO pass
  bias-detective-v1/          # Agent-specific
  simulation-v1/              # Agent-specific
```

---

## Cost & Resource Summary

| Item | Cost | Notes |
|------|------|-------|
| MacBook Pro (you already own) | $0 | M1+ with 16GB+ RAM |
| MLX + mlx-lm | $0 | Open source |
| Base model (Llama 3.1 8B) | $0 | Apache 2.0 license |
| Training time | $0 (your electricity) | ~4-8 hours per training run |
| Hugging Face hosting (optional) | ~$50/mo | For staging |
| Production hosting (optional) | ~$150-300/mo | For production deployment |
| **Total to start** | **$0** | Everything runs locally |

---

## The Moat This Creates

1. **Model moat:** Fine-tuned on YOUR users' real decision outcomes — no public dataset contains this
2. **Data flywheel:** Every analysis improves the model → better analysis → more users → more data
3. **Cost moat:** Lower inference costs long-term vs Gemini API pricing
4. **Latency moat:** Local inference can be faster than API round-trips
5. **IP moat:** The trained adapters are your proprietary weights — trade secret protection
6. **Switching cost:** Organizations that train the model on their data can't take it to a competitor

---

## Quick-Start Checklist

- [ ] Install MLX: `pip install mlx mlx-lm`
- [ ] Download Llama 3.1 8B: `python -m mlx_lm.convert --hf-path meta-llama/Llama-3.1-8B-Instruct --mlx-path ./models/llama-3.1-8b-4bit --quantize`
- [ ] Export 50-100 analyses from Supabase as JSONL
- [ ] Run first LoRA training: 200 iterations, batch size 4
- [ ] Test output quality manually on 10 documents
- [ ] Compare bias accuracy vs Gemini on same documents
- [ ] If quality is close, deploy for A/B testing
- [ ] Set up weekly retraining pipeline
