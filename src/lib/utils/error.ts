export function getSafeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        // Allow-list safe error messages that don't contain PII
        const msg = error.message;
        // Prisma and pg surface a .code property — check it first so that
        // error messages containing incidental words like "database" don't
        // get misclassified (e.g. P2022 "does not exist in the current
        // database" was previously returned as "Database unreachable").
        const code = (error as { code?: string }).code;
        if (code) {
            if (code.startsWith('P1')) return 'Database unreachable';           // connectivity / TLS
            if (code.startsWith('P2')) return 'Database schema error (run migrations)'; // query / schema
            if (code === 'ENOTFOUND' || code === 'ECONNREFUSED') return 'Database unreachable';
        }

        // Parse errors
        if (msg.includes('JSON')) return 'Invalid document format (JSON parse error)';
        if (msg.includes('PDF')) return 'Failed to parse PDF document';
        if (msg.includes('DOCX')) return 'Failed to parse Word document';

        // Network/API errors
        if (msg.includes('timeout') || msg.includes('TIMEOUT')) return 'Analysis timed out (try a smaller file)';
        if (msg.includes('fetch') || msg.includes('ECONNREFUSED')) return 'Failed to connect to AI service';
        if (msg.includes('rate limit') || msg.includes('429')) return 'AI service rate limit exceeded (try again later)';
        if (msg.includes('quota')) return 'AI service quota exceeded';

        // Storage errors (Supabase)
        if (msg.includes('Storage')) return `Storage error: ${msg.split(':').pop()?.trim() || 'upload failed'}`;
        if (msg.includes('Bucket')) return 'Storage bucket not found or inaccessible';
        if (msg.includes('storage')) return 'File storage error';

        // Database errors — message-level fallbacks (no Prisma code available)
        if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) return 'Database unreachable';
        if (msg.includes('connect')) return 'Failed to connect to database';

        // Auth errors
        if (msg.includes('File too large')) return msg;
        if (msg.includes('Unauthorized')) return msg;
        if (msg.includes('Invalid file type')) return msg;

        // Return generic message for truly unknown errors to prevent PII leak
        // Note: Raw error is NOT logged to avoid contaminating logs with user content
        return 'An unexpected error occurred during analysis';
    }
    return 'An unknown error occurred';
}
