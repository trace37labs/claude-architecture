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

// Engine
export * from './engine';

// Types
export * from './types';

// Utilities
export { logger } from './utils/logger';
