/**
 * Scope Hierarchy Types
 *
 * Defines the four scope levels where configuration can exist:
 * Task > Project > User > System (highest to lowest precedence)
 */

import { z } from 'zod';

/**
 * Scope levels in precedence order (highest to lowest)
 */
export enum ScopeLevel {
  /** Current task/operation context (highest priority) */
  Task = 'task',
  /** Project-level config in .claude/ directory */
  Project = 'project',
  /** User-level config in ~/.claude/ directory */
  User = 'user',
  /** System defaults from Anthropic */
  System = 'system',
}

/**
 * Zod schema for scope level validation
 */
export const ScopeLevelSchema = z.nativeEnum(ScopeLevel);

/**
 * Metadata about where a configuration piece came from
 */
export interface ScopeMetadata {
  /** The scope level this config came from */
  level: ScopeLevel;
  /** Filesystem path to the source file */
  sourcePath: string;
  /** When this config was loaded */
  loadedAt: Date;
  /** Optional description of the scope */
  description?: string;
}

/**
 * Zod schema for scope metadata
 */
export const ScopeMetadataSchema = z.object({
  level: ScopeLevelSchema,
  sourcePath: z.string(),
  loadedAt: z.date(),
  description: z.string().optional(),
});

/**
 * A configuration value with its scope metadata
 */
export interface ScopedValue<T> {
  value: T;
  scope: ScopeMetadata;
}

/**
 * Create a Zod schema for a scoped value
 */
export function scopedValueSchema<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema,
    scope: ScopeMetadataSchema,
  });
}

/**
 * Scope resolution path showing the chain of scopes searched
 */
export interface ScopeResolutionPath {
  /** Scopes checked in order */
  checked: ScopeLevel[];
  /** The scope that provided the final value */
  resolved: ScopeLevel | null;
  /** Any scopes that were skipped or unavailable */
  skipped: ScopeLevel[];
}

/**
 * Zod schema for scope resolution path
 */
export const ScopeResolutionPathSchema = z.object({
  checked: z.array(ScopeLevelSchema),
  resolved: ScopeLevelSchema.nullable(),
  skipped: z.array(ScopeLevelSchema),
});
