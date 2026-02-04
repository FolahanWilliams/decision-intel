---
name: noise-audit
description: Conducts a "Statistical Jury" audit to measure Decision Noise by invoking multiple independent judgments.
---

# Noise Audit Skill

This skill implements the "Statistical Jury" method to quantify Decision Noise. It requires the agent to simulate multiple independent judges evaluating the same material to detect variance.

## Workflow

1.  **Isolate the Input**: Identify the specific decision, report, or text to be audited.
2.  **Spawn Judges**: You must launch **THREE (3)** separate `task` sub-agents (type: `noise_judge`).
    *   **Instruction to Judges**: "Evaluate the following text for Decision Quality on a scale of 1-10. Provide a brief justification."
    *   **Independence**: Ensure each judge runs in isolation (the `task` tool handles this by default).
3.  **Collect Scores**: Retrieve the three numerical scores (e.g., 6, 8, 7).
4.  **Calculate Statistics**:
    *   **Average Quality Score**: (Score1 + Score2 + Score3) / 3
    *   **Noise Score (Variance)**: Calculate the standard deviation or simple range (Max - Min).
        *   *Formula*: sqrt( sum( (x - mean)^2 ) / N )
        *   *Interpretation*: High variance (> 1.5) indicates high Noise (inconsistent judgment).
5.  **Output Artifact**:
    *   Generate a "Noise Variance" table (Confusion Matrix style) showing the divergence.

## Python Script: Variance Calculation (Reference)

```python
import math

def calculate_noise_metrics(scores):
    n = len(scores)
    if n == 0: return 0, 0
    
    mean = sum(scores) / n
    variance = sum([(x - mean) ** 2 for x in scores]) / n
    std_dev = math.sqrt(variance)
    
    return {
        "mean": mean,
        "std_dev": std_dev,
        "range": max(scores) - min(scores)
    }
```
