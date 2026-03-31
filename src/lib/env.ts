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

  // Security warnings for production deployments
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DOCUMENT_ENCRYPTION_KEY) {
      warnings.push(
        'DOCUMENT_ENCRYPTION_KEY is not set — uploaded documents will be stored unencrypted. ' +
          'Set this to a 32-byte hex key to enable AES-256-GCM encryption at rest.'
      );
    }
    if (!process.env.RESEND_API_KEY) {
      warnings.push(
        'RESEND_API_KEY is not set — email notifications (invites, digests, outcome reminders) will be silently skipped.'
      );
    }
    if (!process.env.CRON_SECRET) {
      warnings.push(
        'CRON_SECRET is not set — scheduled jobs (outcome detection, nudges, digests) will fail with 401.'
      );
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
