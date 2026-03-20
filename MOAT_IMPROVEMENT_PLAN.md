# NeuroAudit — Moat Improvement Plan

> **Generated:** 2026-03-20
> **Scope:** Concrete, code-grounded recommendations to transform Decision Intel from an "AI wrapper" into a defensibly differentiated platform.

---

## Executive Summary

Your platform has strong foundations: a 10-node LangGraph pipeline (`src/lib/agents/graph.ts`), 6-type nudge engine (`src/lib/nudges/engine.ts`), outcome tracking (`DecisionOutcome` model), and counterfactual simulation (`src/lib/replay/score-calculator.ts`). However, the core intelligence relies on Gemini API calls orchestrated through LangGraph with public data sources (Finnhub, Google Search, RSS). Any incumbent with engineering resources could replicate 80% of this by wiring their own LLM calls.

Below are **5 concrete moat upgrades**, each mapped to specific files, schemas, and implementation paths in your codebase.

---

## Moat 1: Causal AI Layer for Simulator & Pre-Mortem

### The Problem

Your `simulationNode` in `src/lib/agents/nodes.ts` and `CounterfactualPanel` (`src/components/replay/CounterfactualPanel.tsx`) currently rely on Gemini to *narratively generate* scenarios. The score calculator (`src/lib/replay/score-calculator.ts`) uses hardcoded linear weights:

```typescript
// Current approach — static severity weights
const BIAS_SEVERITY_WEIGHTS = { critical: 50, high: 30, medium: 15, low: 5 };
// Counterfactual = remove bias → recover points
```

This is a **correlation-based approximation**, not causal reasoning. It cannot answer "Would removing this bias *actually* have changed the outcome?" — it can only estimate points recovered.

### The Upgrade

Integrate a **Directed Acyclic Graph (DAG)** causal model between your existing analysis nodes and the scoring layer.

#### Implementation Path

1. **New module: `src/lib/causal/graph.ts`**
   - Define a `CausalDAG` class encoding relationships between variables: `biasPresent → noiseScore → decisionQuality → outcome`
   - Use observational data from your existing `DecisionOutcome` table (which already tracks `confirmedBiases`, `falsPositiveBiases`, `impactScore`) to learn edge weights
   - Implement Pearl's **do-calculus** for interventional queries: `P(outcome | do(removeBias=X))`

2. **Upgrade `src/lib/replay/score-calculator.ts`**
   - Replace hardcoded `BIAS_SEVERITY_WEIGHTS` with causal effect estimates derived from your outcome data
   - The `calculateCounterfactualScore()` function should query the causal graph for interventional effects rather than using static deductions

3. **Upgrade `simulationNode` in `src/lib/agents/nodes.ts`**
   - Before generating Gemini-based twin deliberations, run causal inference to identify the **true drivers** (not just correlated factors)
   - Pass causal driver rankings into the `SIMULATION_SUPER_PROMPT` so twins deliberate on causally validated variables

4. **New Prisma model: `CausalEdge`**
   ```prisma
   model CausalEdge {
     id          String   @id @default(cuid())
     orgId       String?
     fromVar     String   // e.g., "confirmation_bias"
     toVar       String   // e.g., "noise_score"
     strength    Float    // learned from outcome data
     confidence  Float    // sample size confidence
     sampleSize  Int
     updatedAt   DateTime @updatedAt
     createdAt   DateTime @default(now())
     @@unique([orgId, fromVar, toVar])
     @@index([orgId])
   }
   ```

#### Why This Is Defensible

- Causal graphs are **organization-specific** — they learn from *your users'* decision patterns, not generic training data
- Competitors cannot replicate your causal model without your longitudinal outcome data
- Provides auditable, explainable reasoning trails that enterprise governance demands (vs. LLM "just trust me" outputs)

#### Libraries to Consider

- **`causality`** (Python, callable via API route) or **`@anthropic-ai/sdk`** with structured causal prompting
- **`dagitty`** (JavaScript DAG library) for client-side causal graph visualization
- Integrate into the existing `BiasNetwork` force-directed graph (`src/components/visualizations/BiasNetwork.tsx`) to show causal vs. correlational relationships

---

## Moat 2: Proprietary Behavioral Data Flywheel

### The Problem

Your external data sources (Finnhub, Google Search, Semantic Scholar, RSS in `src/lib/agents/nodes.ts`) are publicly available. Any competitor can use the same APIs.

### What You Already Have (Untapped Gold)

Your schema already captures high-value proprietary signals that most competitors don't:

| Data Point | Model | Current State |
|---|---|---|
| Bias confirmation/rejection | `DecisionOutcome.confirmedBiases`, `falsPositiveBiases` | Captured but not used for model training |
| Nudge effectiveness | `Nudge.wasHelpful`, `acknowledgedAt` | Captured but not aggregated |
| Twin accuracy | `DecisionOutcome.mostAccurateTwin` | Captured but not fed back into persona calibration |
| Team cognitive patterns | `TeamCognitiveProfile.topBiases`, `nudgeEffectiveness` | Captured but snapshot-only |
| Noise consistency over time | `CognitiveAudit.noiseScore` per decision | Available but not trended |
| User bias override patterns | `BiasInstance.userRating` | Partially implemented |

### The Upgrade

Build a **closed-loop learning system** that uses this proprietary data to continuously improve accuracy.

#### Implementation Path

1. **New module: `src/lib/learning/feedback-loop.ts`**

   ```typescript
   // Aggregate outcome data to recalibrate bias severity weights
   export async function recalibrateBiasSeverity(orgId?: string) {
     // Query all DecisionOutcomes with confirmedBiases
     // Calculate: for each biasType, what % were confirmed vs. false positive?
     // Adjust severity weights: high false-positive rate → downweight
     // Store calibrated weights in CausalEdge or new CalibrationProfile model
   }

   // Aggregate nudge effectiveness to tune nudge thresholds
   export async function recalibrateNudgeThresholds(orgId?: string) {
     // Query Nudge records where wasHelpful is not null
     // For each nudgeType: helpfulness rate, acknowledgment rate
     // Adjust thresholds in nudge engine accordingly
   }
   ```

2. **Upgrade `src/lib/nudges/engine.ts`**
   - Load org-specific calibration data before generating nudges
   - If an org consistently marks "Anchor Alert" nudges as unhelpful, reduce sensitivity
   - If "Pre-Mortem Trigger" nudges correlate with better outcomes, lower the trigger threshold

3. **New API route: `src/app/api/learning/recalibrate/route.ts`**
   - Cron-triggered (weekly) recalibration job
   - Aggregates all outcome data, nudge feedback, and bias ratings
   - Updates org-specific calibration profiles

4. **New Prisma model: `CalibrationProfile`**
   ```prisma
   model CalibrationProfile {
     id              String   @id @default(cuid())
     orgId           String?
     profileType     String   // "bias_severity" | "nudge_threshold" | "twin_weight"
     calibrationData Json     // org-specific learned weights
     sampleSize      Int
     lastCalibratedAt DateTime
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt
     @@unique([orgId, profileType])
     @@index([orgId])
   }
   ```

#### Why This Is Defensible

- Every decision processed makes your model *more accurate for that specific organization*
- Competitors starting fresh have zero calibration data — they're back to generic weights
- Creates a **switching cost**: leaving NeuroAudit means losing your organization's learned decision profile
- The `DecisionOutcome` → `CalibrationProfile` → improved analysis loop is a classic data flywheel

---

## Moat 3: Structured RLHF via Explicit Audit Workflows

### The Problem

Your `BiasInstance.userRating` and `Nudge.wasHelpful` fields exist but are passive — users *can* provide feedback, but the workflow doesn't *require* it for high-stakes decisions.

### The Upgrade

Transform the human feedback loop from optional to **structured and workflow-embedded**.

#### Implementation Path

1. **Upgrade `OutcomeReporter` (`src/app/(platform)/documents/[id]/OutcomeReporter.tsx`)**
   - For analyses with `overallScore < 50` (high-risk), make the OutcomeReporter **mandatory** before the document can be marked as "actioned"
   - Add a new field: "What evidence would change your mind?" — captured *before* the user sees the full analysis
   - Add "Show AI's work" expansion: display the causal chain that led to each bias detection, so users can critique the *reasoning*, not just the conclusion

2. **New component: `src/components/audit/DecisionCheckpoint.tsx`**
   - A modal that appears before document analysis begins
   - Captures the decision-maker's **prior beliefs**: "What would you do with no further information?"
   - Records confidence level (0-100) in their default action
   - After analysis completes, shows **belief delta**: how much the analysis shifted their position
   - This prior/posterior comparison is proprietary behavioral data no competitor can replicate

3. **Upgrade `src/lib/agents/nodes.ts` — `riskScorerNode`**
   - Incorporate historical RLHF signals into scoring:
     ```typescript
     // If this org's users have consistently confirmed "Anchoring Bias"
     // detections (high userRating), increase its weight
     // If "Sunk Cost" detections are frequently rated as false positives,
     // reduce its penalty
     const orgCalibration = await loadCalibrationProfile(orgId, 'bias_severity');
     ```

4. **New Prisma model: `DecisionPrior`**
   ```prisma
   model DecisionPrior {
     id              String   @id @default(cuid())
     analysisId      String   @unique
     userId          String
     defaultAction   String   @db.Text  // "What would you do with no info?"
     confidence      Float              // 0-100
     evidenceToChange String? @db.Text  // "What would change your mind?"
     postAnalysisAction String? @db.Text // What they actually decided
     beliefDelta     Float?             // Calculated shift
     createdAt       DateTime @default(now())
     analysis        Analysis @relation(fields: [analysisId], references: [id], onDelete: Cascade)
     @@index([userId])
   }
   ```

#### Why This Is Defensible

- Captures the **cognitive fingerprint** of each organization's decision-making patterns
- Prior/posterior belief tracking is a unique dataset — no public LLM training set contains this
- Forces the AI to "show its work" — builds trust with enterprise buyers who need audit trails
- The structured workflow embeds NeuroAudit into the decision process itself, not just as a post-hoc scanner

---

## Moat 4: Outcomes-First Workflow Restructuring

### The Problem

Your current flow is: **Upload document → Run 10-node pipeline → Show results**. This makes NeuroAudit a *retroactive document scanner*. The user's cognitive biases have already influenced the document by the time it's uploaded.

### The Upgrade

Invert the workflow: **Define decision parameters → Upload document → Analyze against stated objectives**.

#### Implementation Path

1. **New page: `src/app/(platform)/dashboard/decisions/new/page.tsx`**
   - Pre-analysis decision framing form:
     - **Decision statement**: "We are deciding whether to..."
     - **Default action**: "Without further analysis, I would..."
     - **Key uncertainties**: "The things I'm least sure about are..."
     - **Success criteria**: "This decision succeeds if..."
     - **Failure criteria**: "This decision fails if..."
     - **Stakeholders affected**: (maps to boardroom personas)
   - Only *after* this is submitted does the document upload become available

2. **Upgrade `src/lib/agents/graph.ts`**
   - Add `decisionContext` to `AuditState`:
     ```typescript
     decisionStatement: Annotation<string>,
     defaultAction: Annotation<string>,
     successCriteria: Annotation<string[]>,
     failureCriteria: Annotation<string[]>,
     ```
   - Pass decision context to all downstream nodes so analysis is **goal-directed**, not generic

3. **Upgrade `SIMULATION_SUPER_PROMPT` in `src/lib/agents/prompts.ts`**
   - Decision twins should evaluate the document *against the stated success/failure criteria*
   - Pre-mortem scenarios should map to the user's specific failure criteria, not generic failure modes
   - Nudges should fire when the document contradicts the user's stated objectives

4. **New Prisma model: `DecisionFrame`**
   ```prisma
   model DecisionFrame {
     id               String   @id @default(cuid())
     userId           String
     orgId            String?
     decisionStatement String  @db.Text
     defaultAction    String   @db.Text
     successCriteria  String[]
     failureCriteria  String[]
     stakeholders     String[]
     documentId       String?  @unique
     createdAt        DateTime @default(now())
     updatedAt        DateTime @updatedAt
     document         Document? @relation(fields: [documentId], references: [id])
     @@index([userId])
     @@index([orgId])
   }
   ```

#### Why This Is Defensible

- Makes NeuroAudit the **system of record** for decision rationale — not just document analysis
- Captures intent *before* cognitive biases influence interpretation
- Creates organizational decision archives that become more valuable over time
- Competitors analyzing documents in isolation cannot match context-aware analysis
- Enterprise buyers need pre-decision framing for regulatory compliance (MiFID II, FCA Consumer Duty)

---

## Moat 5: Deep Vertical Integration (FCA Consumer Duty / Financial Risk)

### The Problem

Your platform targets a broad audience (Executives, Investors, Compliance Officers, Strategy Teams). This breadth makes you vulnerable to horizontal competitors who specialize in one vertical.

### The Upgrade

Double down on **financial services compliance** — you already have the infrastructure for it.

#### Evidence You're Already Positioned

- `complianceMapper` node in your pipeline already checks regulatory compliance
- `factChecker` uses Finnhub for financial data verification
- `VERIFICATION_SUPER_PROMPT` already references "FCA", "SOX", "Basel III"
- `RegulatoryHorizonWidget` component exists
- `compliance` JSON field on `Analysis` stores regulatory findings

#### Implementation Path

1. **New module: `src/lib/compliance/fca-consumer-duty.ts`**
   - Dedicated FCA Consumer Duty assessment engine with the 4 outcomes:
     - Products & Services
     - Price & Value
     - Consumer Understanding
     - Consumer Support
   - Map each analysis finding to specific FCA outcome categories
   - Generate audit-ready compliance reports in the format FCA expects

2. **Upgrade `complianceMapper` in `src/lib/agents/nodes.ts`**
   - Add deep FCA Consumer Duty scoring (not just mention detection)
   - Cross-reference findings with FCA enforcement actions database
   - Flag decisions that could trigger FCA scrutiny based on historical precedent

3. **New integration: `src/lib/integrations/`**
   - **Salesforce/HubSpot connector**: Pull deal data to contextualize decisions
   - **Board management software** (Diligent, BoardEffect): Import board papers directly
   - **GRC platforms** (ServiceNow, Archer): Push compliance findings for audit trails
   - Each integration creates distribution lock-in and switching costs

4. **New Prisma models for vertical depth:**
   ```prisma
   model ComplianceAssessment {
     id              String   @id @default(cuid())
     analysisId      String
     framework       String   // "FCA_CONSUMER_DUTY" | "SOX" | "BASEL_III"
     outcomeScores   Json     // { "products_services": 85, "price_value": 72, ... }
     findings        Json     // detailed regulatory findings
     riskLevel       String   // "low" | "medium" | "high" | "critical"
     remediationPlan Json?    // suggested remediation steps
     createdAt       DateTime @default(now())
     analysis        Analysis @relation(fields: [analysisId], references: [id], onDelete: Cascade)
     @@index([analysisId])
     @@index([framework])
     @@index([riskLevel])
   }
   ```

#### Why This Is Defensible

- Financial services firms pay premium prices for compliance tooling
- FCA Consumer Duty is a **new regulation** (2023) — incumbents haven't built deep tooling yet
- Vertical depth creates **regulatory switching costs**: once your compliance reports are embedded in a firm's audit trail, switching platforms requires re-validating the entire compliance history
- Deep vertical expertise is 10x harder to replicate than horizontal features

---

## Implementation Priority Matrix

| Moat | Impact | Effort | Priority | Dependencies |
|------|--------|--------|----------|-------------|
| **2. Behavioral Data Flywheel** | High | Low | **P0 — Start Now** | Uses existing schema fields (`DecisionOutcome`, `Nudge.wasHelpful`, `BiasInstance.userRating`) |
| **3. Structured RLHF** | High | Medium | **P1 — Next Sprint** | Requires new `DecisionPrior` model + `DecisionCheckpoint` component |
| **4. Outcomes-First Workflow** | Very High | Medium | **P1 — Next Sprint** | Requires new `DecisionFrame` model + workflow restructuring |
| **5. Vertical Integration** | High | High | **P2 — Quarter Plan** | Requires FCA domain expertise + integration engineering |
| **1. Causal AI Layer** | Very High | Very High | **P3 — Strategic** | Requires sufficient outcome data (Moat 2 must be running first) |

### Recommended Sequence

```
Sprint 1 (Now):     Moat 2 — Wire up feedback loop from existing data
Sprint 2:           Moat 3 — Add DecisionCheckpoint + mandatory outcome reporting
Sprint 3:           Moat 4 — Build DecisionFrame workflow
Quarter 2:          Moat 5 — FCA Consumer Duty deep integration
Quarter 3-4:        Moat 1 — Causal AI (once you have 500+ outcomes with confirmed biases)
```

---

## Key Metrics to Track

| Metric | Target | Source |
|--------|--------|--------|
| Outcome reporting rate | >60% of analyses | `DecisionOutcome` count / `Analysis` count |
| Bias confirmation accuracy | >75% true positive rate | `confirmedBiases.length / (confirmed + falsePositive).length` |
| Nudge helpfulness rate | >50% helpful | `Nudge.wasHelpful = true` / total acknowledged |
| Decision quality trend | Improving over time per org | `TeamCognitiveProfile.avgDecisionQuality` trend |
| Belief delta magnitude | >10% average shift | `DecisionPrior.beliefDelta` average |
| Twin accuracy improvement | >5% quarterly | `DecisionOutcome.mostAccurateTwin` tracking |

---

## Summary

The core insight is: **your existing schema already captures most of the proprietary data you need** — the `DecisionOutcome`, `Nudge`, `BiasInstance.userRating`, and `TeamCognitiveProfile` models are gold mines waiting to be connected into a learning loop. The highest-ROI move is not building new AI capabilities, but **closing the feedback loop** on the data you're already collecting.

Every decision your platform processes should make the next analysis more accurate, more personalized, and harder for competitors to replicate. That's the moat.
