/**
 * Structured logger with configurable log levels.
 *
 * Controls verbosity via the LOG_LEVEL environment variable:
 *   - 'debug' | 'info' | 'warn' | 'error'  (default: 'info')
 *
 * In production, set LOG_LEVEL=warn to suppress informational messages.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

function getMinLevel(): number {
    const raw = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
    return LOG_LEVELS[raw] ?? LOG_LEVELS.info;
}

function formatMessage(level: string, context: string, message: string): string {
    return `[${level.toUpperCase()}] [${context}] ${message}`;
}

export interface Logger {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
}

/**
 * Create a scoped logger for a specific module/context.
 *
 * @example
 * const log = createLogger('BiasDetective');
 * log.info('Starting analysis');
 * log.error('LLM call failed', error);
 */
/**
 * Create a client-safe scoped logger for 'use client' components.
 *
 * Uses process.env.NODE_ENV (inlined by Next.js at build time) to
 * suppress debug/info in production — no server-only env vars needed.
 *
 * @example
 * const log = createClientLogger('Dashboard');
 * log.error('Delete failed', err);
 */
export function createClientLogger(context: string): Logger {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        debug(message: string, ...args: unknown[]) {
            if (!isProd) console.debug(formatMessage('debug', context, message), ...args);
        },
        info(message: string, ...args: unknown[]) {
            if (!isProd) console.log(formatMessage('info', context, message), ...args);
        },
        warn(message: string, ...args: unknown[]) {
            console.warn(formatMessage('warn', context, message), ...args);
        },
        error(message: string, ...args: unknown[]) {
            console.error(formatMessage('error', context, message), ...args);
        },
    };
}

/**
 * Create a scoped logger for a specific module/context.
 *
 * Uses LOG_LEVEL env var (server-side only). For client components,
 * use createClientLogger() instead.
 *
 * @example
 * const log = createLogger('BiasDetective');
 * log.info('Starting analysis');
 * log.error('LLM call failed', error);
 */
export function createLogger(context: string): Logger {
    return {
        debug(message: string, ...args: unknown[]) {
            if (getMinLevel() <= LOG_LEVELS.debug) {
                console.debug(formatMessage('debug', context, message), ...args);
            }
        },
        info(message: string, ...args: unknown[]) {
            if (getMinLevel() <= LOG_LEVELS.info) {
                console.log(formatMessage('info', context, message), ...args);
            }
        },
        warn(message: string, ...args: unknown[]) {
            if (getMinLevel() <= LOG_LEVELS.warn) {
                console.warn(formatMessage('warn', context, message), ...args);
            }
        },
        error(message: string, ...args: unknown[]) {
            if (getMinLevel() <= LOG_LEVELS.error) {
                console.error(formatMessage('error', context, message), ...args);
            }
        },
    };
}
