/**
 * Structured logger with configurable level and output format.
 *
 * LEVEL — via LOG_LEVEL ('debug' | 'info' | 'warn' | 'error'; default 'info').
 *   In production, set LOG_LEVEL=warn to suppress informational messages.
 *
 * FORMAT — via LOG_FORMAT ('json' | 'pretty'). Defaults to 'json' in production
 *   and 'pretty' in development. JSON is one line per event on stdout/stderr so
 *   ANY log pipeline ingests it unchanged: `docker logs`, CloudWatch, Splunk,
 *   ELK/Logstash, Datadog, Vercel. This is the "customer-owned, accessible
 *   runtime logs" requirement — a self-hosted / single-tenant deploy ships its
 *   logs straight into the customer's SIEM with no vendor lock-in, and the
 *   hosted SaaS gets structured, queryable logs today.
 *
 * Transport stays console.{debug,log,warn,error} (→ stdout/stderr), so
 * Sentry/Vercel console capture keeps working; only the payload shape changes.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogFormat = 'json' | 'pretty';

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

function getFormat(): LogFormat {
  const raw = (process.env.LOG_FORMAT || '').toLowerCase();
  if (raw === 'json') return 'json';
  if (raw === 'pretty') return 'pretty';
  return process.env.NODE_ENV === 'production' ? 'json' : 'pretty';
}

/**
 * Optional deployment identity stamped on every structured record, so a
 * customer running a single-tenant instance can filter their own logs and a
 * multi-tenant operator can tell instances apart. All optional / env-driven.
 */
function deploymentFields(): Record<string, string> {
  const f: Record<string, string> = {};
  if (process.env.SERVICE_NAME) f.service = process.env.SERVICE_NAME;
  if (process.env.DEPLOYMENT_ID) f.deployment = process.env.DEPLOYMENT_ID;
  if (process.env.VERCEL_GIT_COMMIT_SHA) f.commit = process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12);
  return f;
}

/**
 * Per-request correlation fields (requestId / userId / orgId), read through a
 * globalThis bridge that src/lib/observability/request-context.ts registers on
 * the server. Bridged (not statically imported) so this file stays safe to
 * bundle into client components — on the client/edge the getter is undefined
 * and these fields are simply omitted.
 */
function correlationFields(): Record<string, string> {
  try {
    const getter = (globalThis as Record<string, unknown>)['__getDIRequestContext'] as
      | (() => { requestId?: string; userId?: string; orgId?: string } | undefined)
      | undefined;
    const ctx = getter?.();
    if (!ctx) return {};
    const f: Record<string, string> = {};
    if (ctx.requestId) f.requestId = ctx.requestId;
    if (ctx.userId) f.userId = ctx.userId;
    if (ctx.orgId) f.orgId = ctx.orgId;
    return f;
  } catch {
    return {};
  }
}

function formatMessage(level: string, context: string, message: string): string {
  return `[${level.toUpperCase()}] [${context}] ${message}`;
}

/** Turn an arbitrary log arg into something JSON-serializable (Errors → shape). */
function serializeArg(arg: unknown): unknown {
  if (arg instanceof Error) {
    return { name: arg.name, message: arg.message, stack: arg.stack };
  }
  return arg;
}

/** JSON.stringify that never throws (circular refs, BigInt, etc. → safe fallback). */
function safeStringify(record: Record<string, unknown>): string {
  try {
    return JSON.stringify(record, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
  } catch {
    return JSON.stringify({
      ts: record.ts,
      level: record.level,
      ctx: record.ctx,
      msg: String(record.msg),
      serialization_error: true,
    });
  }
}

const consoleFor: Record<LogLevel, (...a: unknown[]) => void> = {
  debug: console.debug,
  info: console.log,
  warn: console.warn,
  error: console.error,
};

function emit(level: LogLevel, context: string, message: string, args: unknown[]): void {
  if (getFormat() === 'json') {
    const record: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      ctx: context,
      msg: message,
      ...deploymentFields(),
      ...correlationFields(),
    };
    if (args.length > 0) record.data = args.map(serializeArg);
    consoleFor[level](safeStringify(record));
  } else {
    consoleFor[level](formatMessage(level, context, message), ...args);
  }
}

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/**
 * Create a client-safe scoped logger for 'use client' components.
 *
 * Browser console only (never reaches the server log pipeline), so it stays
 * human-pretty regardless of LOG_FORMAT. Uses process.env.NODE_ENV (inlined by
 * Next.js at build time) to suppress debug/info in production.
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
 * Create a scoped logger for a specific module/context (server-side).
 *
 * Honors LOG_LEVEL (verbosity) and LOG_FORMAT (json|pretty). For client
 * components, use createClientLogger() instead.
 *
 * @example
 * const log = createLogger('BiasDetective');
 * log.info('Starting analysis');
 * log.error('LLM call failed', error);
 */
export function createLogger(context: string): Logger {
  return {
    debug(message: string, ...args: unknown[]) {
      if (getMinLevel() <= LOG_LEVELS.debug) emit('debug', context, message, args);
    },
    info(message: string, ...args: unknown[]) {
      if (getMinLevel() <= LOG_LEVELS.info) emit('info', context, message, args);
    },
    warn(message: string, ...args: unknown[]) {
      if (getMinLevel() <= LOG_LEVELS.warn) emit('warn', context, message, args);
    },
    error(message: string, ...args: unknown[]) {
      if (getMinLevel() <= LOG_LEVELS.error) emit('error', context, message, args);
    },
  };
}
