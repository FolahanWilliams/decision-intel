---
name: map-protocol
description: Implements the Mediating Assessments Protocol (MAP) to break complex decisions into independent sub-assessments.
---

# MAP (Mediating Assessments Protocol) Skill

This skill implements Daniel Kahneman's MAP to reduce bias and noise by forcing independent evaluation of key dimensions before a final holistic judgment.

## Philosophy
To prevent the "Halo Effect" and "WYSIATI" (What You See Is All There Is), complex decisions must be factored into independent sub-questions.

## Workflow

1.  **Decompose the Decision**: Identify the core attributes of the decision. For standard corporate audits, use the **MAP Trio**:
    *   **Evidence Quality**: How robust, verified, and complete is the data? (1-10)
    *   **Market Stability**: How volatile are the external conditions? (1-10)
    *   **Team Capability**: Does the executing team have a track record of success? (1-10)

2.  **Independent Assessment (Simulated)**:
    *   Launch **THREE (3)** `task` sub-agents (judges) to rate these dimensions independently.
    *   **Constraint**: Judges must rate each dimension *without* seeing the ratings of others.

3.  **Generate Decision Scorecard**:
    *   Compile the ratings into a structured artifact.
    *   Calculate **Level Noise** (Variance) for each dimension.

4.  **Output Artifact (Decision Scorecard)**:
    Produce a JSON/Markdown table highlighting agreement vs. divergence.

    ```json
    {
      "artifact_type": "decision_scorecard",
      "dimensions": {
        "evidence_quality": { "scores": [7, 8, 4], "variance": 1.7, "status": "High Noise" },
        "market_stability": { "scores": [9, 9, 8], "variance": 0.47, "status": "Consensus" },
        "team_capability":  { "scores": [6, 5, 6], "variance": 0.47, "status": "Consensus" }
      },
      "holistic_recommendation": "Pause for evidence verification."
    }
    ```

## Usage
Trigger this skill when the user asks for a "Scorecard", "MAP assessment", or "Structured Evaluation" of a proposal.
