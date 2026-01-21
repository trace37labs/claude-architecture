/**
 * Claude Architecture
 * Programmatic API exports
 */

export const VERSION = '0.1.0';

export function getVersion(): string {
  return VERSION;
}

// Commands
export { initCommand } from './commands/init';
export type { InitOptions } from './commands/init';
export { migrateCommand } from './commands/migrate';
export type { MigrateOptions, MigrationReport } from './commands/migrate';
export { validateCommand } from './commands/validate';
export type { ValidateOptions, ValidationReport } from './commands/validate';

// Validators
export { validateStructure } from './validators/structure';
export type { StructureValidationResult, StructureError } from './validators/structure';
export { validateSchemas } from './validators/schema';
export type { SchemaValidationResult, SchemaError } from './validators/schema';

// Engine
export * from './engine';

// Types
export * from './types';

// Utilities
export { logger } from './utils/logger';
