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
  /** Show specific scope only */
  scope?: 'user' | 'project' | 'task' | 'system';
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

  // Filter scopes if --scope option provided
  let filteredScopeMap = scopeMap;
  if (options.scope) {
    const scopeFilter = options.scope.toLowerCase();
    filteredScopeMap = new Map();

    if (scopeFilter === 'task') {
      const taskScope = scopeMap.get(ScopeLevel.Task);
      if (taskScope) filteredScopeMap.set(ScopeLevel.Task, taskScope);
    } else if (scopeFilter === 'project') {
      const projectScope = scopeMap.get(ScopeLevel.Project);
      if (projectScope) filteredScopeMap.set(ScopeLevel.Project, projectScope);
    } else if (scopeFilter === 'user') {
      const userScope = scopeMap.get(ScopeLevel.User);
      if (userScope) filteredScopeMap.set(ScopeLevel.User, userScope);
    } else if (scopeFilter === 'system') {
      const systemScope = scopeMap.get(ScopeLevel.System);
      if (systemScope) filteredScopeMap.set(ScopeLevel.System, systemScope);
    }
  }

  // Step 3: Resolve merged config
  const context = resolveForTask(
    filteredScopeMap.get(ScopeLevel.Task),
    filteredScopeMap.get(ScopeLevel.Project),
    filteredScopeMap.get(ScopeLevel.User),
    filteredScopeMap.get(ScopeLevel.System)
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
    layer: options.layer,
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

  // Apply scope filter if provided
  const scopeFilter = options.scope?.toLowerCase();
  const showUser = !scopeFilter || scopeFilter === 'user';
  const showProject = !scopeFilter || scopeFilter === 'project';

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

  // Determine which layers to show based on --layer filter
  const showRules = !options.layer || options.layer === 'rules';
  const showTools = !options.layer || options.layer === 'tools';
  const showMethods = !options.layer || options.layer === 'methods';
  const showKnowledge = !options.layer || options.layer === 'knowledge';
  const showGoals = !options.layer || options.layer === 'goals';

  // RULES Layer
  if (showRules) {
    console.log(`${c.green}${c.bright}RULES${c.reset}`);
  const rulesCount = [
    showProject && sources.projectClaude && 'CLAUDE.md',
    showProject && sources.projectAgents && 'AGENTS.md',
    showProject && sources.projectSettings && 'settings.json (permissions)',
    showUser && sources.userClaude && '~/.claude/CLAUDE.md',
    showProject && sources.newStructure?.rules.length && '.claude/rules/',
  ].filter(Boolean).length;

  if (rulesCount > 0) {
    if (showProject && sources.newStructure?.rules.length) {
      console.log(`${c.dim}├─${c.reset} [.claude/rules/] New layered structure`);
    }
    if (showProject && sources.projectSettings) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectSettings}] Permissions enforced`);
    }
    if (showProject && sources.projectClaude) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectClaude}] Project rules`);
    }
    if (showProject && sources.projectAgents) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectAgents}] Agent constraints`);
    }
    if (showUser && sources.userClaude) {
      console.log(`${c.dim}└─${c.reset} [${sources.userClaude}] User-level rules`);
    }
  } else {
    console.log(`${c.dim}└─ (none defined)${c.reset}`);
  }
  }

  // TOOLS Layer
  if (showTools) {
  console.log(`\n${c.cyan}${c.bright}TOOLS${c.reset}`);
  const toolsCount = [
    showUser && sources.userMcpConfig && '~/.claude.json',
    showProject && sources.projectMcp && '.mcp.json',
    showProject && sources.projectSettings && 'settings.json (hooks)',
    showProject && sources.projectSkills.length && 'skills/',
    showProject && sources.projectCommands.length && 'commands/',
    showProject && sources.newStructure?.tools.length && '.claude/tools/',
  ].filter(Boolean).length;

  if (toolsCount > 0) {
    if (showProject && sources.newStructure?.tools.length) {
      console.log(`${c.dim}├─${c.reset} [.claude/tools/] New layered structure`);
    }
    if (showUser && sources.userMcpConfig) {
      console.log(`${c.dim}├─${c.reset} [${sources.userMcpConfig}] MCP servers (global)`);
    }
    if (showProject && sources.projectMcp) {
      console.log(`${c.dim}├─${c.reset} [project/.mcp.json] MCP servers (project)`);
    }
    if (showProject && sources.projectSettings) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectSettings}] Hooks: ${sources.projectHooks.length}`);
    }
    if (showProject && sources.projectSkills.length > 0) {
      console.log(`${c.dim}├─${c.reset} [.claude/skills/] ${sources.projectSkills.length} skill(s)`);
      if (options.verbose) {
        sources.projectSkills.forEach(skill => {
          console.log(`${c.dim}│  └─${c.reset} ${skill.name} (${skill.id})`);
        });
      }
    }
    if (showProject && sources.projectCommands.length > 0) {
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
  }

  // METHODS Layer
  if (showMethods) {
  console.log(`\n${c.magenta}${c.bright}METHODS${c.reset}`);
  const methodsCount = [
    showProject && sources.projectAgents && 'AGENTS.md',
    showProject && sources.projectSkills.length && 'skills/workflows/',
    showProject && sources.newStructure?.methods.length && '.claude/methods/',
  ].filter(Boolean).length;

  if (methodsCount > 0) {
    if (showProject && sources.newStructure?.methods.length) {
      console.log(`${c.dim}├─${c.reset} [.claude/methods/] New layered structure`);
    }
    if (showProject && sources.projectAgents) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectAgents}] Workflows and procedures`);
    }
    if (showProject && sources.projectSkills.length > 0) {
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
  }

  // KNOWLEDGE Layer
  if (showKnowledge) {
  console.log(`\n${c.blue}${c.bright}KNOWLEDGE${c.reset}`);
  const knowledgeCount = [
    showProject && sources.projectClaude && 'CLAUDE.md',
    showProject && sources.projectAgents && 'AGENTS.md',
    showUser && sources.userMemory.length && '~/.claude/memory/',
    showProject && sources.projectSkills.length && 'skills/references/',
    showProject && sources.newStructure?.knowledge.length && '.claude/knowledge/',
  ].filter(Boolean).length;

  if (knowledgeCount > 0) {
    if (showProject && sources.newStructure?.knowledge.length) {
      console.log(`${c.dim}├─${c.reset} [.claude/knowledge/] New layered structure`);
    }
    if (showProject && sources.projectClaude) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectClaude}] Project context`);
    }
    if (showProject && sources.projectAgents) {
      console.log(`${c.dim}├─${c.reset} [${sources.projectAgents}] Architecture details`);
    }
    if (showProject && sources.projectSkills.length > 0) {
      const totalRefs = sources.projectSkills.reduce(
        (sum, s) => sum + (s.references?.length || 0), 0
      );
      if (totalRefs > 0) {
        console.log(`${c.dim}├─${c.reset} [.claude/skills/*/references/] ${totalRefs} reference(s)`);
      }
    }
    if (showUser && sources.userMemory.length > 0) {
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
  }

  // GOALS Layer
  if (showGoals) {
  console.log(`\n${c.yellow}${c.bright}GOALS${c.reset}`);
  if (showProject && sources.newStructure?.goals.length) {
    console.log(`${c.dim}└─${c.reset} [.claude/goals/] New layered structure`);
  } else {
    console.log(`${c.dim}└─ (none defined)${c.reset}`);
  }
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
  if (showUser) {
    console.log(`  ${c.dim}•${c.reset} User-level sources: ${existing.userLevel.length}`);
  }
  if (showProject) {
    console.log(`  ${c.dim}•${c.reset} Project-level sources: ${existing.projectLevel.length}`);
    console.log(`  ${c.dim}•${c.reset} New structure sources: ${existing.newStructure.length}`);
  }

  if (showProject && fragmentation.legacy.length > 0) {
    console.log(`  ${c.yellow}${c.dim}•${c.reset} ${c.yellow}Legacy files: ${fragmentation.legacy.length}${c.reset}`);
  }

  if (scopeFilter) {
    console.log(`  ${c.dim}•${c.reset} Filtered to: ${scopeFilter} scope only`);
  }

  console.log();
}
