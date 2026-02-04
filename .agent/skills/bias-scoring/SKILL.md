---
name: bias-scoring
description: Maps qualitative text to a quantitative "Bias Score" (0–5) using Argumentation Mining.
---

# Bias Scoring Skill

This skill uses Argumentation Mining to identify logical structures and flag "System 1" intuition errors, assigning a quantitative Bias Score.

## Workflow

1.  **Argumentation Mining**:
    *   Parse the text to identify **Premises** (evidence) and **Conclusions** (decisions).
    *   Identify logical connectors (therefore, because, thus).
    *   Flag "Orphaned Conclusions" (claims with no linked evidence).

2.  **Bias Detection (The Detective)**:
    *   Scan for specific cognitive markers:
        *   **Confirmation Bias**: Only citing supporting evidence, ignoring contrary data.
        *   **Anchoring**: Over-reliance on the first piece of data presented.
        *   **Halo Effect**: Assuming success in one area implies success in another.
        *   **Sunk Cost Fallacy**: Justifying future investment based on past spend.
    *   **VERMILLION Framework Markers**:
        *   **Vague "their"**: Pronouns that hide accountability (e.g., "They decided" without naming the entity).
        *   **Mechanical Punctuation**: Overuse of em-dashes (—) to bridge ideas instead of logical connectives, masking a lack of causality.
        *   **Inflexible Paragraphing / Hedging**: Overuse of modal verbs like "possibly," "might," or "could" to avoid commitment, signaling low confidence in the underlying data.

3.  **Scoring Model (0-5 Scale)**:
    *   **0 - Clean**: Purely logical, evidence-based, balanced.
    *   **1 - Low**: Minor phrasing issues, but sound logic.
    *   **2 - Moderate**: One unverified premise or mild emotive language.
    *   **3 - Significant**: Clear logical gap or evident "System 1" shortcut (e.g., "I feel that...").
    *   **4 - High**: Multiple logical fallacies, strong emotional driving.
    *   **5 - Critical**: Purely intuitive decision with no data backing, or dangerous groupthink markers.

4.  **Output Artifact**:
    *   **Bias Heatmap**: Return the text with high-bias sections highlighted (or quoted).
    *   **Bias Score**: The calculated integer.
    *   **Primary Bias Type**: The dominant distortion found.
