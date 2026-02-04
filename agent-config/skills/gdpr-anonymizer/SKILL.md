---
name: gdpr-anonymizer
description: Identifies and masks Personally Identifiable Information (PII) to ensure Data Minimisation under UK GDPR.
---

# GDPR Anonymizer Skill

This skill acts as a pre-processing layer to ensure "Data Minimisation" before content is sent to analysis agents.

## Workflow

1.  **PII Identification**:
    *   Scan input text for:
        *   **Names** (e.g., "John Smith")
        *   **Email Addresses** (e.g., "john@example.com")
        *   **Phone Numbers**
        *   **Specific Locations** (home addresses)
        *   **Financial Account Numbers**
        *   **Protected Characteristics** (if irrelevant to the audit): Age, Gender, Religion.

2.  **Masking / Redaction**:
    *   Replace identified entities with generic tokens:
        *   "John Smith" -> `[PERSON_1]`
        *   "john@example.com" -> `[EMAIL_1]`
        *   "London Office" -> `[LOCATION_OFFICE]`
    *   Maintain consistency (if "John Smith" appears twice, use `[PERSON_1]` both times).

3.  **Verification**:
    *   Ensure no raw PII remains in the "Cleaned Text".

4.  **Handoff**:
    *   Pass the `[Cleaned Text]` to the `bias_detective` or `noise_judge`.
    *   *Note*: The `fact_checker` may need the original text *only* if verifying specific public claims, but internal PII must remain masked.

## Usage Rule
*   **Mandatory Step**: This skill must be applied *immediately* after Ingestion and *before* any Multi-Agent Analysis.
