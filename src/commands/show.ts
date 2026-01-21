/**
 * Show Command
 *
 * Displays the active configuration with source attribution,
 * showing which scope/file provided each value.
 */

// import path from 'path'; // Not needed in this file
import { logger } from '../utils/logger.js';
import { scanForClaudeDirectories } from '../scanner.js';
import { loadAllScopes } from '../loader.js';
import { resolveForTask } from '../engine/resolver.js';
import { formatTreeView } from '../formatters/tree-view.js';
import { formatPrecedenceView } from '../formatters/precedence-view.js';
import { LayerType } from '../types/layers.js';
import { ScopeLevel } from '../types/scope.js';

export interface ShowOptions {
  /** Directory to show config for (default: current directory) */
  targetDir?: string;
  /** Display format: tree, precedence, or json */
  format?: 'tree' | 'precedence' | 'json';
  /** Show specific layer only */
  layer?: LayerType;
  /** Verbose output with full details */
  verbose?: boolean;
  /** Compact output (minimal) */
  compact?: boolean;
  /** Disable color output */
  noColor?: boolean;
  /** Show empty layers/scopes */
  showEmpty?: boolean;
}

/**
 * Show active configuration with source attribution
 */
export async function showCommand(options: ShowOptions = {}): Promise<void> {
  const targetDir = options.targetDir || process.cwd();
  const format = options.format || 'tree';
  const useColor = !options.noColor;

  // Suppress logger in JSON mode (to keep output parseable)
  const showLog = format !== 'json';

  if (showLog) {
    logger.info(`Loading configuration from ${targetDir}...`);
  }

  // Step 1: Scan for .claude/ directories
  const scanResult = scanForClaudeDirectories({
    cwd: targetDir,
    includeNonExistent: false,
  });

  const existingDirs = scanResult.directories.filter(d => d.exists);

  if (existingDirs.length === 0) {
    if (showLog) {
      logger.warn('No .claude/ directories found');
      logger.info('Run `claude-arch init` to create one');
    }
    return;
  }

  if (showLog) {
    logger.info(`Found ${existingDirs.length} configuration scope(s)`);
  }

  // Step 2: Load configs from all scopes
  const scopeMap = loadAllScopes({ cwd: targetDir });

  // Step 3: Resolve merged config
  const context = resolveForTask(
    scopeMap.get(ScopeLevel.Task),
    scopeMap.get(ScopeLevel.Project),
    scopeMap.get(ScopeLevel.User),
    scopeMap.get(ScopeLevel.System)
  );

  // Step 4: Display based on format
  switch (format) {
    case 'tree':
      displayTree(context, options, useColor);
      break;

    case 'precedence':
      displayPrecedence(context, options, useColor);
      break;

    case 'json':
      displayJson(context, options);
      break;

    default:
      logger.error(`Unknown format: ${format}`);
      logger.info('Available formats: tree, precedence, json');
  }
}

/**
 * Display config as tree view
 */
function displayTree(
  context: any,
  options: ShowOptions,
  useColor: boolean
): void {
  const output = formatTreeView(context.config, context.scopes, {
    verbose: options.verbose,
    showEmpty: options.showEmpty,
    color: useColor,
  });

  console.log(output);
}

/**
 * Display config as precedence chain
 */
function displayPrecedence(
  context: any,
  options: ShowOptions,
  useColor: boolean
): void {
  const output = formatPrecedenceView(context.config, context.scopes, {
    layer: options.layer,
    showEmpty: options.showEmpty,
    color: useColor,
    compact: options.compact,
  });

  console.log(output);
}

/**
 * Display config as JSON
 */
function displayJson(context: any, options: ShowOptions): void {
  const output: any = {
    merged: context.config,
    scopes: {},
  };

  // Include scope details if verbose
  if (options.verbose) {
    for (const [scopeName, scopeConfig] of Object.entries(context.scopes)) {
      if (scopeConfig) {
        output.scopes[scopeName] = scopeConfig;
      }
    }
  } else {
    // Just include which scopes are present
    output.scopes = Object.keys(context.scopes).filter(
      k => context.scopes[k] !== undefined
    );
  }

  // Filter to specific layer if requested
  if (options.layer) {
    output.merged = {
      [options.layer]: context.config[options.layer],
      metadata: context.config.metadata,
    };
  }

  // Custom serializer to handle dates
  console.log(JSON.stringify(output, (_key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }, 2));
}
