# New Feature Implementation Template: LangGraph Node
<!-- Use this template when adding a new Agent Node to the graph -->

## 1. Feature Definition
**Feature Name:** [e.g., SentimentAnalyzer]
**Goal:** [One line objective]
**Input:** `AuditState.[field]`
**Output:** `AuditState.[new_field]`

## 2. Interface Changes (`src/lib/agents/types.ts`)
- [ ] Define the new field in `AuditState` interface.
- [ ] **Constraint:** Must represent an optional field (`?`).

## 3. Node Implementation (`src/lib/agents/nodes.ts`)
```typescript
export async function [nodeName]Node(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- [Node Name] ---");
    // 1. Extract Input
    const content = state.structuredContent || state.originalContent;
    
    // 2. Call Gemini
    // ...
    
    // 3. Resilience: Use parseJSON
    const data = parseJSON(response);
    
    // 4. Return Data (Fail-Open)
    return { 
        [new_field]: data?.result || [Default_Value] 
    };
}
```

## 4. Graph Wiring (`src/lib/agents/graph.ts`)
- [ ] Add Node: `.addNode("[nodeName]", [nodeName]Node)`
- [ ] Add Edge: `.addEdge("structurer", "[nodeName]")`
- [ ] Add Merge/Reducer in `Annotation.Root`.

## 5. Verification
- [ ] Run `npm run jules:test` to generate coverage.
