# Agent Architecture Documentation

This document maps the **LangGraph** multi-agent architecture powering the Decision Intelligence Platform. It serves as the technical source of truth for the system's logic, data flow, and agent personas.

## 1. Architecture Overview

The system uses a directed cyclic graph (DAG) where a single input document moves through sequential preprocessing before branching into parallel analysis streams, finally converging for risk scoring.

### Execution Flow
1.  **Ingestion**: Document text flows into the graph.
2.  **Preprocessing (Sequential)**:
    *   `gdprAnonymizer`: Redacts PII (Names, Emails, Companies).
    *   `structurer`: Cleans formatting and identifies speakers.
3.  **Analysis (Parallel)**:
    *   `biasDetective`: Scans for 15 specific cognitive biases.
    *   `noiseJudge`: Instantiates 3 independent "Judges" to rate decision quality (measuring variance).
    *   `factChecker`: Cross-references claims with real-time financial data (FMP).
    *   `preMortem`: (Placeholder) Generates failure scenarios.
    *   `complianceMapper`: (Placeholder) Checks regulatory alignment.
4.  **Synthesis**:
    *   `riskScorer`: Aggregates all data into a final `overallScore` and JSON report.

---

## 2. State Management (`GraphState`)

The state is managed via **LangGraph Annotations**. Crucially, it uses **Append/Merge Reducers** to handle parallel outputs without race conditions.

| Channel | Type | Reducer Strategy | Purpose |
| :--- | :--- | :--- | :--- |
| `originalContent` | `string` | Overwrite | Raw input text. |
| `structuredContent` | `string` | Overwrite | Cleaned/Redacted text used by all downstream agents. |
| `biasAnalysis` | `Array` | **Append** (`[...x, ...y]`) | Collects findings from multiple bias checks (expandable). |
| `noiseScores` | `Array` | **Append** (`[...x, ...y]`) | Aggregates scores from the 3 parallel noise judges. |
| `factCheckResult` | `Object` | Overwrite | Stores the trust score and verification flags. |
| `finalReport` | `Object` | Overwrite | The final database-ready JSON object. |

---

## 3. Agent Definitions

### A. GDPR Anonymizer (`gdprAnonymizerNode`)
*   **Goal**: Protect user privacy by stripping PII before analysis.
*   **Logic**: Uses a specific "GDPR Anonymizer" persona to replace entities (e.g., "John Smith" -> `[PERSON_1]`).
*   **Fallback**: If the LLM fails or redaction is invalid, it returns `[REDACTION_FAILED]` (fail-safe) to prevent PII leakage.

### B. Data Structurer (`structurerNode`)
*   **Goal**: Prepare messy input for high-quality analysis.
*   **Output**: `structuredContent` (clean text) and `speakers` (array).
*   **Resilience**: Contains a **Critical Fallback**:
    ```typescript
    return { structuredContent: state.structuredContent || state.originalContent };
    ```
    This ensures that if structuring fails, we don't accidentally revert a previous redaction.

### C. Bias Detective (`biasDetectiveNode`)
*   **Goal**: Identify "Neurocognitive Distortions".
*   **Model**: Gemini 3 Pro Preview.
*   **Taxonomy** (15 Biases):
    1.  Confirmation Bias
    2.  Anchoring Bias
    3.  Sunk Cost Fallacy
    4.  Overconfidence Bias
    5.  Groupthink
    6.  Authority Bias
    7.  Bandwagon Effect
    8.  Loss Aversion
    9.  Availability Heuristic
    10. Hindsight Bias
    11. Planning Fallacy
    12. Status Quo Bias
    13. Framing Effect
    14. Selective Perception
    15. Recency Bias
*   **Schema**: Requires `"found": true` in the JSON output to pass the database filter.

### D. Noise Judges (`noiseJudgeNode`)
*   **Goal**: Measure "Noise" (unwanted variance) in decision-making.
*   **Technique**: Spawns **3 concurrent LLM calls** with different random seeds.
*   **Metric**: Calculates the **Standard Deviation** of the 3 scores. High deviation (>10) implies the document is ambiguous or poorly reasoned, resulting in a heavy score penalty.

### E. Fact Checker (`factCheckerNode`)
*   **Goal**: Verify claims against external reality.
*   **Tools**: Uses `getFinancialContext` (FMP API) to fetch real-time stock data.
*   **Process**:
    1.  Extract Tickers (e.g., "AAPL").
    2.  Fetch Market Data.
    3.  Verify text claims against that data.

### F. Risk Scorer (`riskScorerNode`)
*   **Goal**: Quantify the "Decision Quality".
*   **Formula**:
    `Score = Base(100) - BiasPenalties - (NoiseStdDev * 4) - (TrustPenalty * 0.2)`
*   **Output**: Returns the final `AnalysisResult` object matching the Prisma schema.

---

## 4. Data Integrity & Resilience

### JSON Resilience (`parseJSON`)
All nodes use a robust helper that performs regular expression extraction (`/\{[\s\S]*\}/`) to handle "chatty" LLM responses (e.g., "Here is your JSON..."). Defaults to safe empty objects on failure.

### Database Persistence
The `analyzer.ts` layer ensures strict mapping of:
*   `speakers` -> Postgres Array
*   `noiseStats` -> JSON
*   `structuredContent` -> Text (for audit trails)

## 5. Security Measures
*   **Prompt Injection Mitigation**: All user inputs are wrapped in `<input_text>` tags to prevent instruction override.
*   **JSON Resilience**: `parseJSON` uses non-greedy matching to safely extract JSON payloads.
