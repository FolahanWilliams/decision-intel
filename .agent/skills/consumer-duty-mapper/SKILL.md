---
name: consumer-duty-mapper
description: Maps decision audits against FCA Consumer Duty requirements to ensure Fair Value and protection of vulnerable customers.
---

# Consumer Duty Mapper Skill

This skill ensures compliance with the UK FCA Consumer Duty regulations by mapping decision logic to specific "Consumer Outcomes."

## Purpose
To produce an "Evidentiary Record" demonstrating that the firm has acted to deliver good outcomes for retail customers, specifically focusing on **Fair Value** and **Vulnerable Customer Protection**.

## Workflow

1.  **Analyze the Decision/Product**:
    *   Review the audited decision or product proposal.
    *   Identify the target audience and the value exchange.

2.  **Map to Duty Outcomes**:
    *   **Outcome 1: Products & Services**: Is the product designed to meet the needs of the identified target group?
    *   **Outcome 2: Price & Value**: Does the price represent fair value? Are there hidden fees or "sludge"?
    *   **Outcome 3: Consumer Understanding**: Is the communication clear, or does it use "Vague 'their'" or complex jargon (as flagged by Bias Detective)?
    *   **Outcome 4: Consumer Support**: Does the decision hinder the customer's ability to act?

3.  **Vulnerability Scan**:
    *   Explicitly check for impacts on vulnerable groups (e.g., elderly, low financial resilience).
    *   Flag any "Opaque Outcomes" where the decision logic is not transparent to the consumer.

4.  **Output Artifact (Fair Value Assessment)**:
    Produce a structured report:

    ```markdown
    ## FCA Consumer Duty: Fair Value Assessment
    **Decision Ref**: [Ref ID]

    ### 1. Value Assessment
    *   **Price/Benefit Ratio**: [Analysis]
    *   **Status**: [Pass/Flagged]

    ### 2. Vulnerability Impact
    *   **Identified Risks**: [e.g., "Complex language may confuse cognitively impaired users"]
    *   **Mitigation**: [Proposed changes]

    ### 3. Evidentiary Record
    *   "We confirm that this decision has been stress-tested against the 'Sludge' criteria..."
    ```
