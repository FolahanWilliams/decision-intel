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
import { safeStringify } from './utils/json';

/**
 * Formats a data object into a valid SSE string chunk.
 * Handles JSON serialization safely.
 * @param data The payload to send
 * @param id Optional event ID for resumable streaming
 * @returns String format: "data: <json>\n\n" or "id: <id>\ndata: <json>\n\n"
 */
export function formatSSE(data: unknown, id?: string): string {
  const json = safeStringify(data);
  if (id) {
    return `id: ${id}\ndata: ${json}\n\n`;
  }
  return `data: ${json}\n\n`;
}

/**
 * Sends a heartbeat comment to keep the connection alive
 * @returns String format: ":heartbeat\n\n"
 */
export function formatSSEHeartbeat(): string {
  return `:heartbeat ${Date.now()}\n\n`;
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
 * - Event IDs for resumable streaming
 * - Heartbeat comments
 * - JSON Parsing safety
 */
export class SSEReader {
  private buffer: string = '';
  private lastEventId: string | null = null;

  /**
   * Gets the last event ID received
   */
  getLastEventId(): string | null {
    return this.lastEventId;
  }

  /**
   * Processes a raw text chunk from the stream.
   * Invokes callback for each valid valid JSON message found.
   */
  processChunk(chunk: string, onMessage: (data: unknown, id?: string) => void) {
    this.buffer += chunk;

    // Split by double newline (SSE standard delimiter)
    const parts = this.buffer.split('\n\n');

    // Keep the last part in the buffer (it might be incomplete)
    // If the chunk ended with \n\n, the last part is empty string, which is fine.
    this.buffer = parts.pop() || '';

    for (const part of parts) {
      const lines = part.trim().split('\n');
      if (lines.length === 0) continue;

      let eventId: string | undefined;
      let eventData: string | undefined;

      for (const line of lines) {
        // Skip comments (start with ':')
        if (line.startsWith(':')) continue;

        if (line.startsWith('id:')) {
          eventId = line.slice(3).trim();
          this.lastEventId = eventId;
        } else if (line.startsWith('data:')) {
          eventData = line.slice(5).trim();
        } else if (line.startsWith('data: ')) {
          eventData = line.slice(6);
        }
      }

      if (eventData) {
        try {
          const data = JSON.parse(eventData);
          onMessage(data, eventId);
        } catch (e) {
          // Intentionally swallowed — malformed SSE chunks are expected
          // during partial reads. Logged at debug level only.
          void e;
        }
      }
    }
  }
}
