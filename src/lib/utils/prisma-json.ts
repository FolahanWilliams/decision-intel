/**
 * Safe JSON conversion utilities for Prisma
 * 
 * Provides type-safe conversions to Prisma's InputJsonValue type
 * without using unsafe type assertions.
 */
import { Prisma } from '@prisma/client';

/**
 * Safely converts a value to Prisma's nullable JSON input type
 * Returns Prisma.NullableJsonNullValueInput for null/undefined values
 */
export function toPrismaJson<T>(value: T | null | undefined): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
    if (value === null || value === undefined) {
        return Prisma.NullableJsonNullValueInput.DbNull;
    }
    
    // Convert to JSON and back to ensure it's serializable
    try {
        const serialized = JSON.stringify(value);
        const parsed = JSON.parse(serialized);
        return parsed as Prisma.InputJsonValue;
    } catch (error) {
        // Throw instead of silently returning DbNull to prevent data loss.
        // Callers should handle the error explicitly if they want fallback behavior.
        throw new Error(
            `Failed to serialize value to JSON: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Type guard to check if a value is a valid JSON object
 */
export function isValidJsonObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a valid JSON array
 */
export function isValidJsonArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

/**
 * Safely serializes an array of strings for Prisma
 */
export function toPrismaStringArray(value: string[] | null | undefined): string[] {
    if (!value || !Array.isArray(value)) {
        return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
}
