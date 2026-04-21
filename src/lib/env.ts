/**
 * Environment Variable Validation
 *
 * Ensures all required environment variables are present and valid at runtime.
 * This prevents silent failures and provides clear error messages.
 */

import { createLogger } from './utils/logger';

const log = createLogger('Env');

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

const REQUIRED_ENV_VARS = ['DATABASE_URL', 'DIRECT_URL', 'GOOGLE_API_KEY'];

const OPTIONAL_ENV_VARS = [
  'EXTENSION_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'FINNHUB_API_KEY',
  'GEMINI_MODEL_NAME',
  'JULES_API_KEY', // CI build-failure debugging via Jules
  'ALLOWED_ORIGIN', // CORS; falls back to production Vercel URL
  'SLACK_CLIENT_ID', // Multi-tenant Slack OAuth app ID
  'SLACK_CLIENT_SECRET', // Multi-tenant Slack OAuth app secret
  'SLACK_SIGNING_SECRET', // Slack event webhook verification
  'SLACK_BOT_TOKEN', // Legacy single-tenant bot token (fallback)
  'SLACK_TOKEN_ENCRYPTION_KEY', // AES-256 key for encrypting per-workspace tokens
  'GOOGLE_CLIENT_ID', // Google OAuth app ID for Drive integration
  'GOOGLE_CLIENT_SECRET', // Google OAuth app secret for Drive integration
  'EMAIL_INBOUND_DOMAIN', // Domain for email forwarding (e.g., in.decision-intel.com)
  'RESEND_WEBHOOK_SECRET', // HMAC secret for verifying inbound email webhooks
  'EMAIL_FROM', // Sender address for outbound emails
];

/**
 * Validates that all required environment variables are present
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    if (!value || value.trim() === '') {
      missing.push(envVar);
    } else if (value.startsWith('placeholder') || value === 'your-key-here') {
      warnings.push(`${envVar} appears to have a placeholder value`);
    }
  }

  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar];
    if (value && (value.startsWith('placeholder') || value === 'your-key-here')) {
      warnings.push(`${envVar} appears to have a placeholder value`);
    }
  }

  // Admin + demo alignment — the ADMIN_USER_IDS env var grants enterprise
  // plan bypass to any listed Supabase UUID. A malformed entry either (a)
  // silently drops a legitimate admin out of the list or (b) grants
  // unintended access if a non-UUID string is loosely matched elsewhere.
  // Validate shape and demo alignment here so misconfigurations surface at
  // startup, not during a live demo or investor call.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const adminIdsRaw = process.env.ADMIN_USER_IDS?.trim();
  const demoUserId = process.env.DEMO_USER_ID?.trim();
  if (adminIdsRaw) {
    const entries = adminIdsRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const invalid = entries.filter(id => !UUID_RE.test(id));
    if (invalid.length > 0) {
      const msg = `ADMIN_USER_IDS contains ${invalid.length} entry/entries that are not valid UUIDs: ${invalid.join(', ')}. Enterprise-plan bypass will not match these.`;
      warnings.push(msg);
      console.error(`[ENV] CRITICAL: ${msg}`);
    }
    if (demoUserId && !entries.includes(demoUserId)) {
      const msg = `DEMO_USER_ID (${demoUserId}) is not present in ADMIN_USER_IDS. The /api/demo/run endpoint will fail for visitors once free-tier quota is exhausted — add the demo UUID to ADMIN_USER_IDS.`;
      warnings.push(msg);
      console.error(`[ENV] CRITICAL: ${msg}`);
    }
  } else if (demoUserId) {
    const msg = `DEMO_USER_ID is set but ADMIN_USER_IDS is empty. The demo endpoint's plan-bypass is inactive — the first 4 audits will succeed, then every subsequent visitor hits a quota error.`;
    warnings.push(msg);
    console.error(`[ENV] CRITICAL: ${msg}`);
  }

  // Security warnings for production deployments
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DOCUMENT_ENCRYPTION_KEY) {
      const msg =
        'DOCUMENT_ENCRYPTION_KEY is not set — uploaded documents will be stored unencrypted. ' +
        'Set this to a 32-byte hex key to enable AES-256-GCM encryption at rest.';
      warnings.push(msg);
      console.error(`[ENV] CRITICAL: ${msg}`);
    }
    if (!process.env.SLACK_TOKEN_ENCRYPTION_KEY && process.env.SLACK_CLIENT_ID) {
      const msg =
        'SLACK_TOKEN_ENCRYPTION_KEY is not set but Slack integration is configured. ' +
        'Slack token operations will crash at runtime.';
      warnings.push(msg);
      console.error(`[ENV] CRITICAL: ${msg}`);
    }
    if (!process.env.RESEND_API_KEY) {
      const msg =
        'RESEND_API_KEY is not set — email notifications (invites, digests, outcome reminders) will be silently skipped.';
      warnings.push(msg);
      console.warn(`[ENV] WARNING: ${msg}`);
    }
    if (!process.env.CRON_SECRET) {
      const msg =
        'CRON_SECRET is not set — scheduled jobs (outcome detection, nudges, digests) will fail with 401.';
      warnings.push(msg);
      console.warn(`[ENV] WARNING: ${msg}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Gets an environment variable with validation
 * Throws an error if the variable is missing or empty
 * During build time, returns a placeholder to allow building without env vars
 */
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    // Allow build to proceed without env vars (they'll be needed at runtime)
    if (process.env.NODE_ENV === 'production' && !process.env.CI) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    // Return placeholder for build time
    log.warn(`Missing environment variable ${name} - using placeholder for build`);
    return `__PLACEHOLDER_${name}__`;
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
export function getOptionalEnvVar(name: string, defaultValue: string = ''): string {
  return process.env[name]?.trim() || defaultValue;
}

/**
 * Asserts that all required environment variables are present
 * Call this at application startup
 */
export function assertEnvValid(): void {
  const result = validateEnv();

  if (!result.valid) {
    log.error(`Missing required environment variables: ${result.missing.join(', ')}`);
    throw new Error(`Missing required environment variables: ${result.missing.join(', ')}`);
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => log.warn(warning));
  }
}
