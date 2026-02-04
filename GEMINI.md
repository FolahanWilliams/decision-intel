# Project Context: Decision Intelligence Platform

## Database Schema (Prisma)
The database uses PostgreSQL managed by Prisma.

### Core Models
1.  **Document** (`Document`): Represents an uploaded file or text input.
    *   `content`: Raw text (potentially sensitive).
    *   `analyses`: One-to-many relation to Analysis.

2.  **Analysis** (`Analysis`): The result of an AI audit managed by LangGraph.
    *   `overallScore` (Float): 0-100 Decision Quality Score.
    *   `noiseScore` (Float): 0-100 derived from `noiseStats.stdDev`.
    *   `biases`: One-to-many relation to `BiasInstance`.
    *   **JSON Fields**:
        *   `noiseStats`: `{ mean: number, stdDev: number, variance: number }`
        *   `factCheck`: `{ score: number, flags: string[] }`
        *   `compliance`: `{ status: string, details: string }`

3.  **BiasInstance** (`BiasInstance`): A specific detected cognitive bias.
    *   `biasType` (e.g., "Confirmation Bias").
    *   `severity` ("low", "medium", "high", "critical").
    *   `excerpt`: The exact text triggering the bias.
    *   `found` (Implicitly true if record exists, useful for filtering).

## Relationships for SQL Queries
*   To find specific biases in a document: Join `Document` -> `Analysis` -> `BiasInstance`.
*   To calculate average scores: Aggregate `Analysis.overallScore`.
*   To find "noisy" documents: Query `Analysis` where `noiseScore > 50`.

## Agent Architecture
See `AGENTS.md` for the breakdown of the LangGraph implementation.
