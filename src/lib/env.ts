/**
 * Environment Variable Validation
 * 
 * Ensures all required environment variables are present and valid at runtime.
 * This prevents silent failures and provides clear error messages.
 */

export interface EnvValidationResult {
    valid: boolean;
    missing: string[];
    warnings: string[];
}

const REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'DIRECT_URL',
    'GOOGLE_API_KEY',
];

const OPTIONAL_ENV_VARS = [
    'EXTENSION_API_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'FINNHUB_API_KEY',
    'GEMINI_MODEL_NAME',
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

    return {
        valid: missing.length === 0,
        missing,
        warnings
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
        console.warn(`⚠️ Missing environment variable ${name} - using placeholder for build`);
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
        console.error('❌ Missing required environment variables:');
        result.missing.forEach(envVar => console.error(`  - ${envVar}`));
        throw new Error(`Missing required environment variables: ${result.missing.join(', ')}`);
    }

    if (result.warnings.length > 0) {
        console.warn('⚠️ Environment variable warnings:');
        result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
}
