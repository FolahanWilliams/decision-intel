/**
 * Shared Utilities for Server-Side Events (SSE)
 * Ensures consistent formatting and parsing across Server and Client.
 */

// ----------------------------------------------------------------------
// Server-Side Utilities
// ----------------------------------------------------------------------

/**
 * Formats a data object into a valid SSE string chunk.
 * Handles JSON serialization safely.
 * @param data The payload to send
 * @returns String format: "data: <json>\n\n"
 */
export function formatSSE(data: any): string {
    try {
        const json = JSON.stringify(data);
        return `data: ${json}\n\n`;
    } catch (e) {
        console.error("SSE Serialization Error:", e);
        // Fallback error message
        return `data: {"type":"error", "message":"Serialization Failed"}\n\n`;
    }
}

// ----------------------------------------------------------------------
// Client-Side Utilities
// ----------------------------------------------------------------------

/**
 * Robust SSE Stream Reader.
 * Handles:
 * - Buffer accumulation (partial chunks)
 * - Double newline splitting
 * - "data: " prefix stripping
 * - JSON Parsing safety
 */
export class SSEReader {
    private buffer: string = "";

    /**
     * Processes a raw text chunk from the stream.
     * Invokes callback for each valid valid JSON message found.
     */
    processChunk(chunk: string, onMessage: (data: any) => void) {
        this.buffer += chunk;

        // Split by double newline (SSE standard delimiter)
        const parts = this.buffer.split("\n\n");

        // Keep the last part in the buffer (it might be incomplete)
        // If the chunk ended with \n\n, the last part is empty string, which is fine.
        this.buffer = parts.pop() || "";

        for (const part of parts) {
            const line = part.trim();
            if (!line) continue;

            if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6);
                try {
                    const data = JSON.parse(jsonStr);
                    onMessage(data);
                } catch (e) {
                    console.warn("SSE Parse Error (JSON):", e, line);
                }
            } else {
                // Handle non-standard lines or legacy clients (optional resilience)
                // Try parsing directly if it looks like JSON
                if (line.startsWith("{") || line.startsWith("[")) {
                    try {
                        const data = JSON.parse(line);
                        onMessage(data);
                    } catch (e) {
                        // Ignore noise
                    }
                }
            }
        }
    }
}
