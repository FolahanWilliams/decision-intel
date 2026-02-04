/**
 * JSON Utilities for Robust Parsing and Serialization
 */

/**
 * Parses JSON from a string, handling balanced braces/brackets and ignoring surrounding text.
 * Robust against LLM output that includes markdown or conversational text.
 */
export const parseJSON = (text: string): any | null => {
    if (!text) return null;
    const start = text.search(/[\{\[]/);
    if (start === -1) {
        console.error("JSON Parse Error: no opening brace/bracket found");
        return null;
    }
    const opening = text[start];
    const closing = opening === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        const prev = text[i - 1];
        if (ch === '"' && prev !== "\\") inString = !inString;
        if (inString) continue;
        if (ch === opening) depth++;
        if (ch === closing) {
            depth--;
            if (depth === 0) {
                const candidate = text.slice(start, i + 1);
                try {
                    return JSON.parse(candidate);
                } catch (e) {
                    console.error("JSON Parse Error: candidate failed to parse", e, "Raw (500 chars):", text.slice(0, 500));
                    return null;
                }
            }
        }
    }
    console.error("JSON Parse Error: no balanced JSON found. Raw (500 chars):", text.slice(0, 500));
    return null;
};

/**
 * Handles safe JSON serialization with circular reference support.
 */
export function safeStringify(obj: any): string {
    const safeReplacer = () => {
        const seen = new WeakSet();
        return (_key: any, value: any) => {
            if (typeof value === 'bigint') {
                return value.toString();
            }
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return "[Circular]";
                }
                seen.add(value);
            }
            return value;
        };
    };

    try {
        // Try strict first for speed, but BigInt will fail here
        // If we suspect BigInt might be common, we should just use replacer always.
        // Given the use case (Analysis Report), BigInt is rare but possible.
        // Let's safe-guard by using replacer logic if fallback needed.
        // But users wanted "Direct use".
        // Actually, JSON.stringify(obj) is fast. If it throws, we check why.
        return JSON.stringify(obj);
    } catch (e) {
        try {
            return JSON.stringify(obj, safeReplacer());
        } catch (e2) {
            return JSON.stringify({ type: 'error', message: 'Non-serializable payload' });
        }
    }
}

/**
 * Creates a deep clone of the object that is safe for JSON serialization/persistence.
 * Handles BigInt (to string), Dates (to ISO), and Circular references.
 */
export function safeJsonClone<T>(obj: T): T {
    return JSON.parse(safeStringify(obj));
}
