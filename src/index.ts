/**
 * Claude Architecture
 * Programmatic API exports
 */

export const VERSION = '0.1.0';

export function getVersion(): string {
  return VERSION;
}

// Commands
export { initCommand } from './commands/init.js';
export type { InitOptions } from './commands/init.js';
export { migrateCommand } from './commands/migrate.js';
export type { MigrateOptions, MigrationReport } from './commands/migrate.js';
export { validateCommand } from './commands/validate.js';
export type { ValidateOptions, ValidationReport } from './commands/validate.js';
export { showCommand } from './commands/show.js';
export type { ShowOptions } from './commands/show.js';
export { doctorCommand } from './commands/doctor.js';
export type { DoctorOptions, DoctorReport } from './commands/doctor.js';

// Validators
export { validateStructure } from './validators/structure.js';
export type { StructureValidationResult, StructureError } from './validators/structure.js';
export { validateSchemas } from './validators/schema.js';
export type { SchemaValidationResult, SchemaError } from './validators/schema.js';

// Diagnostics
export { detectConflicts } from './diagnostics/conflict-detector.js';
export type {
  Conflict,
  ConflictSeverity,
  ConflictDetectionResult,
} from './diagnostics/conflict-detector.js';
export { generateRecommendations } from './diagnostics/recommendations.js';
export type {
  Recommendation,
  RecommendationPriority,
  RecommendationImpact,
  RecommendationEffort,
  RecommendationResult,
} from './diagnostics/recommendations.js';

// Formatters
export { formatTreeView } from './formatters/tree-view.js';
export type { TreeViewOptions } from './formatters/tree-view.js';
export { formatPrecedenceView } from './formatters/precedence-view.js';
export type { PrecedenceViewOptions } from './formatters/precedence-view.js';

// Engine
export * from './engine/index.js';

// Types
export * from './types/index.js';

// Utilities
export { logger } from './utils/logger.js';

// MCP Server
export { createMcpServer } from './mcp/server.js';
export * from './mcp/tools.js';
