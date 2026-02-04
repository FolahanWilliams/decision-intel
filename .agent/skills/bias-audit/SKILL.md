---
name: bias-audit
description: Analyzes decision documents for neurocognitive distortions (Bias) and inconsistency (Noise) using a specialized audit pipeline.
allowed-tools:
  - "run_command"
  - "read_file"
---

# Bias Audit Skill

This skill empowers the agent to perform a comprehensive "Decision Hygiene" audit on text documents, transcripts, or email threads. It detects specific cognitive biases and quantifies decision noise.

## Capabilities

1.  **Bias Detection**: Identifies distortions like Anchoring, Confirmation Bias, Sunk Cost Fallacy, etc.
2.  **Noise Quantification**: Calculates specific noise statistics (MSE, Standard Deviation) from multiple independent judgments.
3.  **Risk Scoring**: Combines bias and noise metrics into an interpretable risk level.

## Usage

When you are asked to "audit" a document or "scan for noise":
1.  **Analyze the Text**: Use the `Psycholinguistic Detective` logic to find bias markers.
2.  **Measure Variance**: Use the `Independent Judges` logic to get multiple scores for the same text.
3.  **Calculate Noise**: Run the `noise_audit.py` script to mathematically derive the noise score.

## Resources

- **Noise Formula**: $MSE = Bias^2 + Noise^2$
- **Severity Levels**:
    - Low (0-20)
    - Medium (21-40)
    - High (41-70)
    - Critical (71-100)
