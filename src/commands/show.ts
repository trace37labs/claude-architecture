/**
 * Show Command
 *
 * Displays the active configuration with source attribution,
 * showing which scope/file provided each value.
 */

// import path from 'path'; // Not needed in this file
import { logger } from '../utils/logger.js';
import { scanForClaudeDirectories, scanAllConfigSources } from '../scanner.js';
import { loadAllScopes } from '../loader.js';
import { resolveForTask } from '../engine/resolver.js';
import { formatTreeView } from '../formatters/tree-view.js';
import { formatPrecedenceView } from '../formatters/precedence-view.js';
import { LayerType } from '../types/layers.js';
import { ScopeLevel } from '../types/scope.js';

export interface ShowOptions {
  /** Directory to show config for (default: current directory) */
  targetDir?: string;
  /** Display format: tree, precedence, json, or unified */
  format?: 'tree' | 'precedence' | 'json' | 'unified';
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
  /** Show all configuration sources (new unified view) */
  showSources?: boolean;
}

/**
 * Show active configuration with source attribution
 */
export async function showCommand(options: ShowOptions = {}): Promise<void> {
  const targetDir = options.targetDir || process.cwd();
  const format = options.format || (options.showSources ? 'unified' : 'tree');
  const useColor = !options.noColor;

  // Suppress logger in JSON mode (to keep output parseable)
  const showLog = format !== 'json';

  if (showLog) {
    logger.info(`Loading configuration from ${targetDir}...`);
  }

  // If showing unified sources view, use universal scanner
  if (format === 'unified' || options.showSources) {
    displayUnifiedSources(targetDir, options, useColor);
    return;
  }

  // Step 1: Scan for .claude/ directories (legacy behavior)
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
      logger.info('Available formats: tree, precedence, json, unified');
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

/**
 * Display unified view of ALL configuration sources
 */
function displayUnifiedSources(
  targetDir: string,
  options: ShowOptions,
  useColor: boolean
): void {
  // Scan all config sources
  const scanResult = scanAllConfigSources({ cwd: targetDir });
  const { sources, existing, fragmentation } = scanResult;

  const c = useColor ? {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
  } : {
    reset: '', bright: '', dim: '', red: '', green: '', yellow: '',
    blue: '', magenta: '', cyan: '',
  };

  console.log(`\n${c.bright}=== Active Configuration ===${c.reset}\n`);

  // RULES Layer
  console.log(`${c.green}${c.bright}RULES${c.reset}`);
  const rulesCount = [
    sources.projectClaude && 'CLAUDE.md',
    sources.projectAgents && 'AGENTS.md',
    sources.projectSettings && 'settings.json (permissions)',
    sources.userClaude && '~/.claude/CLAUDE.md',
    sources.newStructure?.rules.length && '.claude/rules/',
  ].filter(Boolean).length;

  if (rulesCount > 0) {
    if (sources.newStructure?.rules.length) {
      console.log(`${c.dim}├─${c.reset} [.claude/rules/] New layered structure`);
    }
    if (sources.projectSettings) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectSettings}] Permissions enforced`);
    }
    if (sources.projectClaude) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectClaude}] Project rules`);
    }
    if (sources.projectAgents) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectAgents}] Agent constraints`);
    }
    if (sources.userClaude) {
      console.log(`${c.dim}└─${c.reset} [${sources.userClaude}] User-level rules`);
    }
  } else {
    console.log(`${c.dim}└─ (none defined)${c.reset}`);
  }

  // TOOLS Layer
  console.log(`\n${c.cyan}${c.bright}TOOLS${c.reset}`);
  const toolsCount = [
    sources.userMcpConfig && '~/.claude.json',
    sources.projectMcp && '.mcp.json',
    sources.projectSettings && 'settings.json (hooks)',
    sources.projectSkills.length && 'skills/',
    sources.projectCommands.length && 'commands/',
    sources.newStructure?.tools.length && '.claude/tools/',
  ].filter(Boolean).length;

  if (toolsCount > 0) {
    if (sources.newStructure?.tools.length) {
      console.log(`${c.dim}├─${c.reset} [.claude/tools/] New layered structure`);
    }
    if (sources.userMcpConfig) {
      console.log(`${c.dim}├─${c.reset} [${sources.userMcpConfig}] MCP servers (global)`);
    }
    if (sources.projectMcp) {
      console.log(`${c.dim}├─${c.reset} [project/.mcp.json] MCP servers (project)`);
    }
    if (sources.projectSettings) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectSettings}] Hooks: ${sources.projectHooks.length}`);
    }
    if (sources.projectSkills.length > 0) {
      console.log(`${c.dim}├─${c.reset} [.claude/skills/] ${sources.projectSkills.length} skill(s)`);
      if (options.verbose) {
        sources.projectSkills.forEach(skill => {
          console.log(`${c.dim}│  └─${c.reset} ${skill.name} (${skill.id})`);
        });
      }
    }
    if (sources.projectCommands.length > 0) {
      console.log(`${c.dim}└─${c.reset} [.claude/commands/] ${sources.projectCommands.length} command(s)`);
      if (options.verbose) {
        sources.projectCommands.forEach(cmd => {
          console.log(`${c.dim}   └─${c.reset} /${cmd.name}`);
        });
      }
    }
  } else {
    console.log(`${c.dim}└─ (none defined)${c.reset}`);
  }

  // METHODS Layer
  console.log(`\n${c.magenta}${c.bright}METHODS${c.reset}`);
  const methodsCount = [
    sources.projectAgents && 'AGENTS.md',
    sources.projectSkills.length && 'skills/workflows/',
    sources.newStructure?.methods.length && '.claude/methods/',
  ].filter(Boolean).length;

  if (methodsCount > 0) {
    if (sources.newStructure?.methods.length) {
      console.log(`${c.dim}├─${c.reset} [.claude/methods/] New layered structure`);
    }
    if (sources.projectAgents) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectAgents}] Workflows and procedures`);
    }
    if (sources.projectSkills.length > 0) {
      const totalWorkflows = sources.projectSkills.reduce(
        (sum, s) => sum + (s.workflows?.length || 0), 0
      );
      console.log(`${c.dim}└─${c.reset} [.claude/skills/*/workflows/] ${totalWorkflows} workflow(s)`);
      if (options.verbose) {
        sources.projectSkills.forEach(skill => {
          if (skill.workflows && skill.workflows.length > 0) {
            console.log(`${c.dim}   └─${c.reset} ${skill.name}: ${skill.workflows.join(', ')}`);
          }
        });
      }
    }
  } else {
    console.log(`${c.dim}└─ (none defined)${c.reset}`);
  }

  // KNOWLEDGE Layer
  console.log(`\n${c.blue}${c.bright}KNOWLEDGE${c.reset}`);
  const knowledgeCount = [
    sources.projectClaude && 'CLAUDE.md',
    sources.projectAgents && 'AGENTS.md',
    sources.userMemory.length && '~/.claude/memory/',
    sources.projectSkills.length && 'skills/references/',
    sources.newStructure?.knowledge.length && '.claude/knowledge/',
  ].filter(Boolean).length;

  if (knowledgeCount > 0) {
    if (sources.newStructure?.knowledge.length) {
      console.log(`${c.dim}├─${c.reset} [.claude/knowledge/] New layered structure`);
    }
    if (sources.projectClaude) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectClaude}] Project context`);
    }
    if (sources.projectAgents) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectAgents}] Architecture details`);
    }
    if (sources.projectSkills.length > 0) {
      const totalRefs = sources.projectSkills.reduce(
        (sum, s) => sum + (s.references?.length || 0), 0
      );
      if (totalRefs > 0) {
        console.log(`${c.dim}├─${c.reset} [.claude/skills/*/references/] ${totalRefs} reference(s)`);
      }
    }
    if (sources.userMemory.length > 0) {
      console.log(`${c.dim}└─${c.reset} [~/.claude/memory/] ${sources.userMemory.length} file(s)`);
      if (options.verbose) {
        sources.userMemory.forEach(mem => {
          console.log(`${c.dim}   └─${c.reset} ${mem.name} (${mem.category || 'general'})`);
        });
      }
    }
  } else {
    console.log(`${c.dim}└─ (none defined)${c.reset}`);
  }

  // GOALS Layer
  console.log(`\n${c.yellow}${c.bright}GOALS${c.reset}`);
  if (sources.newStructure?.goals.length) {
    console.log(`${c.dim}└─${c.reset} [.claude/goals/] New layered structure`);
  } else {
    console.log(`${c.dim}└─ (none defined)${c.reset}`);
  }

  // Project-level fragmentation warnings (user config is normal context)
  if (fragmentation.duplicates.length > 0 || fragmentation.legacy.length > 0) {
    console.log(`\n${c.yellow}${c.bright}⚠ Project Configuration Fragmentation${c.reset}\n`);

    if (fragmentation.duplicates.length > 0) {
      console.log(`${c.yellow}Duplicates within project:${c.reset}`);
      fragmentation.duplicates.forEach(dup => {
        console.log(`  ${c.dim}•${c.reset} "${dup.item}" defined in:`);
        dup.sources.forEach(src => {
          console.log(`    ${c.dim}-${c.reset} ${src}`);
        });
      });
      console.log();
    }

    if (fragmentation.legacy.length > 0) {
      console.log(`${c.yellow}Legacy project files (consider migrating):${c.reset}`);
      fragmentation.legacy.forEach(file => {
        console.log(`  ${c.dim}•${c.reset} ${file}`);
      });
      console.log();
    }

    console.log(`${c.dim}Run 'claude-arch migrate --all' to consolidate project configuration${c.reset}`);
    console.log(`${c.dim}Note: User-level config (~/.claude/) provides context and won't be migrated${c.reset}`);
  }

  // Summary
  console.log(`\n${c.bright}Summary:${c.reset}`);
  console.log(`  ${c.dim}•${c.reset} User-level sources: ${existing.userLevel.length}`);
  console.log(`  ${c.dim}•${c.reset} Project-level sources: ${existing.projectLevel.length}`);
  console.log(`  ${c.dim}•${c.reset} New structure sources: ${existing.newStructure.length}`);

  if (fragmentation.legacy.length > 0) {
    console.log(`  ${c.yellow}${c.dim}•${c.reset} ${c.yellow}Legacy files: ${fragmentation.legacy.length}${c.reset}`);
  }

  console.log();
}
