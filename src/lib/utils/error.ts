export function getSafeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        // Allow-list safe error messages that don't contain PII
        const msg = error.message;

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

        // Database errors (Prisma)
        if (msg.includes('Prisma') || msg.includes('P2')) return 'Database connection error';
        if (msg.includes('database') || msg.includes('ENOTFOUND')) return 'Database unreachable';
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
