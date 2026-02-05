export function getSafeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        // Allow-list safe error messages
        const msg = error.message;
        if (msg.includes('JSON')) return 'Invalid document format (JSON parse error)';
        if (msg.includes('timeout')) return 'Analysis timed out (try a smaller file)';
        if (msg.includes('fetch')) return 'Failed to connect to AI service';
        if (msg.includes('File too large')) return msg;
        if (msg.includes('Unauthorized')) return msg;

        // Return generic message for unknown errors to prevent PII leak
        // Note: Raw error is NOT logged to avoid contaminating logs with user content
        return 'An unexpected error occurred during analysis';
    }
    return 'An unknown error occurred';
}
