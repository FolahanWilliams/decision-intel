/**
 * JSON Utilities for Robust Parsing and Serialization
 */

/**
 * Parses JSON from a string, handling balanced braces/brackets and ignoring surrounding text.
 * Robust against LLM output that includes markdown or conversational text.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseJSON = (text: string): any | null => {
    if (!text) return null;
    const start = text.search(/[\{\[]/);
    if (start === -1) {
        console.error("JSON Parse Error: no opening brace/bracket found. Raw (500 chars):", text.slice(0, 500));
        return null;
    }
    const opening = text[start];
    const closing = opening === "{" ? "}" : "]";

    // Optimization: Attempt to parse the substring from the first opening brace to the last closing brace.
    // This covers the common case where the text contains a single valid JSON object/array, optionally surrounded by text.
    // It is significantly faster (native JSON.parse) than the manual state machine loop.
    const end = text.lastIndexOf(closing);
    if (end !== -1 && end > start) {
        const candidate = text.slice(start, end + 1);
        try {
            return JSON.parse(candidate);
        } catch (e) {
            // Fallback to robust parsing if optimistic attempt fails
        }
    }

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeStringify(obj: any): string {
    const safeReplacer = () => {
        const seen = new WeakSet();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
