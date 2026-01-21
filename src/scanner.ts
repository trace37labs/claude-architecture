/**
 * File System Scanner
 *
 * Discovers .claude/ directories across all scope levels:
 * - Task scope (current working directory context)
 * - Project scope (.claude/ in current project)
 * - User scope (~/.claude/ in home directory)
 * - System scope (Anthropic defaults - not filesystem-based)
 */

import { homedir } from 'os';
import { resolve, join } from 'path';
import { existsSync, statSync } from 'fs';
import { ScopeLevel } from './types/scope.js';

/**
 * Location of a .claude/ directory
 */
export interface ClaudeDirectory {
  /** Scope level this directory belongs to */
  scope: ScopeLevel;
  /** Absolute path to the .claude/ directory */
  path: string;
  /** Whether this directory exists */
  exists: boolean;
  /** Whether this is the default location for this scope */
  isDefault: boolean;
}

/**
 * Result of scanning for .claude/ directories
 */
export interface ScanResult {
  /** All discovered .claude/ directories */
  directories: ClaudeDirectory[];
  /** Working directory used for scanning */
  workingDirectory: string;
  /** User's home directory */
  homeDirectory: string;
}

/**
 * Options for scanning
 */
export interface ScanOptions {
  /** Working directory to start from (default: process.cwd()) */
  cwd?: string;
  /** Whether to include non-existent locations */
  includeNonExistent?: boolean;
  /** Custom home directory path (for testing) */
  homeDir?: string;
  /** Whether to check for task-specific directories */
  includeTaskScope?: boolean;
}

/**
 * Scan for .claude/ directories across all scope levels
 *
 * @param options - Scan configuration options
 * @returns Scan result with discovered directories
 *
 * @example
 * ```typescript
 * const result = scanForClaudeDirectories();
 * console.log(result.directories.filter(d => d.exists));
 * ```
 */
export function scanForClaudeDirectories(
  options: ScanOptions = {}
): ScanResult {
  const cwd = options.cwd ? resolve(options.cwd) : process.cwd();
  const homeDir = options.homeDir || homedir();
  const includeNonExistent = options.includeNonExistent ?? false;
  const includeTaskScope = options.includeTaskScope ?? true;

  const directories: ClaudeDirectory[] = [];

  // Task scope - check for task-specific .claude/ directory
  // (This would be for task-specific overrides in a subdirectory)
  if (includeTaskScope) {
    const taskClaudeDir = join(cwd, '.claude-task');
    const taskExists = existsSync(taskClaudeDir) && isDirectory(taskClaudeDir);
    if (taskExists || includeNonExistent) {
      directories.push({
        scope: ScopeLevel.Task,
        path: taskClaudeDir,
        exists: taskExists,
        isDefault: true,
      });
    }
  }

  // Project scope - check for .claude/ in current directory and parent directories
  const projectClaudeDir = findProjectClaudeDirectory(cwd);
  if (projectClaudeDir || includeNonExistent) {
    const projectPath = projectClaudeDir || join(cwd, '.claude');
    directories.push({
      scope: ScopeLevel.Project,
      path: projectPath,
      exists: projectClaudeDir !== null,
      isDefault: projectPath === join(cwd, '.claude'),
    });
  }

  // User scope - check for ~/.claude/
  const userClaudeDir = join(homeDir, '.claude');
  const userExists = existsSync(userClaudeDir) && isDirectory(userClaudeDir);
  if (userExists || includeNonExistent) {
    directories.push({
      scope: ScopeLevel.User,
      path: userClaudeDir,
      exists: userExists,
      isDefault: true,
    });
  }

  // System scope - not filesystem-based, but we include it for completeness
  // This would represent Anthropic's built-in defaults
  if (includeNonExistent) {
    directories.push({
      scope: ScopeLevel.System,
      path: '<system>', // Sentinel value for system defaults
      exists: true, // System scope always "exists" as defaults
      isDefault: true,
    });
  }

  return {
    directories,
    workingDirectory: cwd,
    homeDirectory: homeDir,
  };
}

/**
 * Find the nearest .claude/ directory by walking up the directory tree
 *
 * @param startPath - Directory to start searching from
 * @returns Absolute path to .claude/ directory, or null if not found
 */
export function findProjectClaudeDirectory(startPath: string): string | null {
  let currentPath = resolve(startPath);
  const root = resolve('/');

  while (true) {
    const claudeDir = join(currentPath, '.claude');
    if (existsSync(claudeDir) && isDirectory(claudeDir)) {
      return claudeDir;
    }

    // Stop at filesystem root
    if (currentPath === root) {
      break;
    }

    // Move up one directory
    const parentPath = resolve(currentPath, '..');
    if (parentPath === currentPath) {
      // Reached root (safety check for Windows)
      break;
    }
    currentPath = parentPath;
  }

  return null;
}

/**
 * Get the .claude/ directory for a specific scope
 *
 * @param scope - The scope level to get directory for
 * @param options - Scan options
 * @returns Claude directory info, or null if not found
 */
export function getClaudeDirectoryForScope(
  scope: ScopeLevel,
  options: ScanOptions = {}
): ClaudeDirectory | null {
  const result = scanForClaudeDirectories(options);
  return result.directories.find((d) => d.scope === scope) || null;
}

/**
 * Check if a path is a directory
 */
function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Discover layer directories within a .claude/ directory
 *
 * @param claudeDir - Path to the .claude/ directory
 * @returns Map of layer names to their paths
 *
 * @example
 * ```typescript
 * const layers = discoverLayers('/path/to/.claude');
 * console.log(layers.rules); // '/path/to/.claude/rules'
 * ```
 */
export interface LayerDirectories {
  rules?: string;
  tools?: string;
  methods?: string;
  knowledge?: string;
  goals?: string;
}

export function discoverLayers(claudeDir: string): LayerDirectories {
  const layers: LayerDirectories = {};
  const layerNames = ['rules', 'tools', 'methods', 'knowledge', 'goals'] as const;

  for (const layerName of layerNames) {
    const layerPath = join(claudeDir, layerName);
    if (existsSync(layerPath) && isDirectory(layerPath)) {
      layers[layerName] = layerPath;
    }
  }

  return layers;
}

/**
 * Check if a directory looks like a valid .claude/ structure
 *
 * @param path - Path to check
 * @returns True if directory has at least one layer subdirectory
 */
export function isValidClaudeDirectory(path: string): boolean {
  if (!existsSync(path) || !isDirectory(path)) {
    return false;
  }

  const layers = discoverLayers(path);
  return Object.keys(layers).length > 0;
}

/**
 * Get all .claude/ directories that exist and are valid
 *
 * @param options - Scan options
 * @returns Array of valid claude directories
 */
export function getValidClaudeDirectories(
  options: ScanOptions = {}
): ClaudeDirectory[] {
  const result = scanForClaudeDirectories(options);
  return result.directories.filter(
    (d) => d.exists && d.scope !== ScopeLevel.System && isValidClaudeDirectory(d.path)
  );
}
