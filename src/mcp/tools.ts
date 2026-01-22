/**
 * MCP Tool Definitions
 * Exposes Claude Architecture capabilities as MCP tools
 */

import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { resolveForTask } from '../engine/resolver.js';
import { loadScopeConfig } from '../loader.js';
import { ScopeLevel } from '../types/scope.js';
import { formatTreeView } from '../formatters/tree-view.js';
import { formatPrecedenceView } from '../formatters/precedence-view.js';
import { validateStructure } from '../validators/structure.js';
import { validateSchemas } from '../validators/schema.js';
import { detectConflicts } from '../diagnostics/conflict-detector.js';
import { generateRecommendations } from '../diagnostics/recommendations.js';
import { showCommand } from '../commands/show.js';
import { migrateCommand } from '../commands/migrate.js';
import { initCommand } from '../commands/init.js';
import { exportCommand } from '../commands/export.js';
import { gapsCommand } from '../commands/gaps.js';
import { treeCommand } from '../commands/tree.js';

// Schema for resolve-config tool
const resolveConfigSchema = z.object({
  taskPath: z.string().optional().describe('Path to task-specific .claude/ directory'),
  projectPath: z.string().optional().describe('Path to project .claude/ directory'),
  userPath: z.string().optional().describe('Path to user .claude/ directory'),
  systemPath: z.string().optional().describe('Path to system .claude/ directory'),
  taskId: z.string().optional().describe('Optional task identifier'),
  format: z.enum(['json', 'tree', 'precedence']).optional().default('json').describe('Output format'),
});

// Schema for validate-structure tool
const validateStructureSchema = z.object({
  path: z.string().describe('Path to .claude/ directory to validate'),
  format: z.enum(['json', 'text']).optional().default('text').describe('Output format'),
});

// Schema for detect-conflicts tool
const detectConflictsSchema = z.object({
  path: z.string().describe('Path to .claude/ directory to analyze'),
  format: z.enum(['json', 'text']).optional().default('text').describe('Output format'),
});

// Schema for get-recommendations tool
const getRecommendationsSchema = z.object({
  path: z.string().describe('Path to .claude/ directory to analyze'),
  format: z.enum(['json', 'text']).optional().default('text').describe('Output format'),
  quickWins: z.boolean().optional().default(false).describe('Show only quick wins'),
});

/**
 * Resolve configuration for a task
 */
export async function handleResolveConfig(args: z.infer<typeof resolveConfigSchema>): Promise<CallToolResult> {
  try {
    const configs = [];

    // Load configurations from each scope
    if (args.systemPath) {
      const cfg = await loadScopeConfig(args.systemPath, ScopeLevel.System);
      if (cfg) configs.push(cfg);
    }
    if (args.userPath) {
      const cfg = await loadScopeConfig(args.userPath, ScopeLevel.User);
      if (cfg) configs.push(cfg);
    }
    if (args.projectPath) {
      const cfg = await loadScopeConfig(args.projectPath, ScopeLevel.Project);
      if (cfg) configs.push(cfg);
    }
    if (args.taskPath) {
      const cfg = await loadScopeConfig(args.taskPath, ScopeLevel.Task);
      if (cfg) configs.push(cfg);
    }

    // Resolve merged configuration
    const context = resolveForTask(
      configs.find(c => c.scope === ScopeLevel.Task),
      configs.find(c => c.scope === ScopeLevel.Project),
      configs.find(c => c.scope === ScopeLevel.User),
      configs.find(c => c.scope === ScopeLevel.System),
      args.taskId
    );

    // Format output
    let output: string;
    switch (args.format) {
      case 'tree':
        output = formatTreeView(context.config, context.scopes);
        break;
      case 'precedence':
        output = formatPrecedenceView(context.config, context.scopes);
        break;
      case 'json':
      default:
        output = JSON.stringify(context, null, 2);
        break;
    }

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error resolving config: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Validate .claude/ directory structure
 */
export async function handleValidateStructure(args: z.infer<typeof validateStructureSchema>): Promise<CallToolResult> {
  try {
    const structureResult = await validateStructure(args.path);
    const schemaResult = await validateSchemas(args.path);

    const isValid = structureResult.valid && schemaResult.valid;
    const allErrors = [...structureResult.errors, ...schemaResult.errors];

    let output: string;
    if (args.format === 'json') {
      output = JSON.stringify({ valid: isValid, errors: allErrors }, null, 2);
    } else {
      if (isValid) {
        output = '✓ Structure is valid';
      } else {
        output = `✗ Structure validation failed:\n${allErrors.map(e => `  - ${e.message}`).join('\n')}`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
      isError: !isValid,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error validating structure: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Detect conflicts in configuration
 */
export async function handleDetectConflicts(args: z.infer<typeof detectConflictsSchema>): Promise<CallToolResult> {
  try {
    const config = await loadScopeConfig(args.path, ScopeLevel.Project);
    if (!config) {
      return {
        content: [
          {
            type: 'text',
            text: `No configuration found at ${args.path}`,
          },
        ],
        isError: true,
      };
    }

    const context = resolveForTask(undefined, config);
    const result = detectConflicts(context.config, context.scopes);

    let output: string;
    if (args.format === 'json') {
      output = JSON.stringify(result, null, 2);
    } else {
      if (result.conflicts.length === 0) {
        output = '✓ No conflicts detected';
      } else {
        const grouped = result.conflicts.reduce((acc, c) => {
          if (!acc[c.severity]) acc[c.severity] = [];
          acc[c.severity].push(c);
          return acc;
        }, {} as Record<string, typeof result.conflicts>);

        output = Object.entries(grouped)
          .map(([severity, conflicts]) => {
            return `${severity.toUpperCase()} (${conflicts.length}):\n${conflicts.map(c => `  - ${c.message}${c.suggestion ? `\n    Suggestion: ${c.suggestion}` : ''}`).join('\n')}`;
          })
          .join('\n\n');
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error detecting conflicts: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Get recommendations for configuration improvements
 */
export async function handleGetRecommendations(args: z.infer<typeof getRecommendationsSchema>): Promise<CallToolResult> {
  try {
    const config = await loadScopeConfig(args.path, ScopeLevel.Project);
    if (!config) {
      return {
        content: [
          {
            type: 'text',
            text: `No configuration found at ${args.path}`,
          },
        ],
        isError: true,
      };
    }

    const context = resolveForTask(undefined, config);
    const conflictResult = detectConflicts(context.config, context.scopes);
    const result = generateRecommendations(context.config, context.scopes, conflictResult);

    let recommendations = result.recommendations;

    if (args.quickWins) {
      recommendations = result.quickWins;
    }

    let output: string;
    if (args.format === 'json') {
      output = JSON.stringify({ recommendations, quickWins: result.quickWins }, null, 2);
    } else {
      if (recommendations.length === 0) {
        output = '✓ No recommendations';
      } else {
        output = recommendations
          .map(r => {
            const icon = r.priority === 'high' ? '🔴' : r.priority === 'medium' ? '🟡' : '🟢';
            return `${icon} [${r.priority.toUpperCase()}] ${r.title}\n   ${r.description}\n   Action: ${r.action}\n   Impact: ${r.impact} | Effort: ${r.effort}`;
          })
          .join('\n\n');
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error generating recommendations: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

// Schema for show-sources tool
const showSourcesSchema = z.object({
  path: z.string().optional().describe('Project path (default: current directory)'),
  format: z.enum(['unified', 'json']).optional().default('unified').describe('Output format'),
  scope: z.enum(['user', 'project', 'task', 'system']).optional().describe('Filter to specific scope'),
  layer: z.enum(['rules', 'tools', 'methods', 'knowledge', 'goals']).optional().describe('Filter to specific layer'),
});

// Schema for migrate tool
const migrateSchema = z.object({
  path: z.string().optional().describe('Source directory (default: current directory)'),
  dryRun: z.boolean().optional().default(true).describe('Preview changes without applying'),
  all: z.boolean().optional().default(false).describe('Migrate all config sources'),
  source: z.enum(['mcp', 'hooks', 'skills', 'memory']).optional().describe('Specific source to migrate'),
});

// Schema for init tool
const initSchema = z.object({
  path: z.string().optional().describe('Target directory (default: current directory)'),
  minimal: z.boolean().optional().default(false).describe('Create minimal structure'),
  dryRun: z.boolean().optional().default(true).describe('Preview changes without applying'),
});

// Schema for export tool
const exportSchema = z.object({
  path: z.string().optional().describe('Project path (default: current directory)'),
  format: z.enum(['yaml', 'json']).optional().default('yaml').describe('Output format'),
  platform: z.enum(['darwin', 'linux', 'windows']).optional().describe('Target platform'),
});

// Schema for gaps tool
const gapsSchema = z.object({
  manifest: z.string().optional().describe('Path to manifest file'),
  path: z.string().optional().describe('Project path to compare against'),
  format: z.enum(['text', 'json']).optional().default('text').describe('Output format'),
});

// Schema for tree tool
const treeSchema = z.object({
  path: z.string().optional().describe('Path to .claude/ directory'),
  depth: z.number().optional().describe('Maximum depth to display'),
  showSize: z.boolean().optional().default(false).describe('Show file sizes'),
});

/**
 * Show all configuration sources (unified view)
 */
async function handleShowSources(args: z.infer<typeof showSourcesSchema>): Promise<CallToolResult> {
  try {
    // Capture console output
    let output = '';
    const originalLog = console.log;
    console.log = (...msgs: any[]) => { output += msgs.join(' ') + '\n'; };

    await showCommand({
      targetDir: args.path || process.cwd(),
      showSources: true,
      format: args.format === 'json' ? 'json' : 'unified',
      scope: args.scope,
      layer: args.layer as any,
      noColor: true,
    });

    console.log = originalLog;

    return {
      content: [{ type: 'text', text: output || 'No configuration found' }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
}

/**
 * Migrate legacy configuration
 */
async function handleMigrate(args: z.infer<typeof migrateSchema>): Promise<CallToolResult> {
  try {
    let output = '';
    const originalLog = console.log;
    console.log = (...msgs: any[]) => { output += msgs.join(' ') + '\n'; };

    await migrateCommand({
      sourceDir: args.path || process.cwd(),
      dryRun: args.dryRun,
      all: args.all,
      source: args.source,
    });

    console.log = originalLog;

    return {
      content: [{ type: 'text', text: output || 'Migration complete' }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
}

/**
 * Initialize .claude/ structure
 */
async function handleInit(args: z.infer<typeof initSchema>): Promise<CallToolResult> {
  try {
    let output = '';
    const originalLog = console.log;
    console.log = (...msgs: any[]) => { output += msgs.join(' ') + '\n'; };

    await initCommand({
      targetDir: args.path || process.cwd(),
      minimal: args.minimal,
      dryRun: args.dryRun,
    });

    console.log = originalLog;

    return {
      content: [{ type: 'text', text: output || 'Initialization complete' }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
}

/**
 * Export portable manifest
 */
async function handleExport(args: z.infer<typeof exportSchema>): Promise<CallToolResult> {
  try {
    let output = '';
    const originalLog = console.log;
    console.log = (...msgs: any[]) => { output += msgs.join(' ') + '\n'; };

    await exportCommand({
      targetDir: args.path || process.cwd(),
      json: args.format === 'json',
      platform: args.platform,
    });

    console.log = originalLog;

    return {
      content: [{ type: 'text', text: output || 'Export complete' }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
}

/**
 * Analyze environment gaps
 */
async function handleGaps(args: z.infer<typeof gapsSchema>): Promise<CallToolResult> {
  try {
    let output = '';
    const originalLog = console.log;
    console.log = (...msgs: any[]) => { output += msgs.join(' ') + '\n'; };

    await gapsCommand({
      manifest: args.manifest,
      from: args.path,
      json: args.format === 'json',
    });

    console.log = originalLog;

    return {
      content: [{ type: 'text', text: output || 'Gap analysis complete' }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
}

/**
 * Show directory tree
 */
async function handleTree(args: z.infer<typeof treeSchema>): Promise<CallToolResult> {
  try {
    let output = '';
    const originalLog = console.log;
    console.log = (...msgs: any[]) => { output += msgs.join(' ') + '\n'; };

    await treeCommand({
      targetDir: args.path || process.cwd(),
      depth: args.depth,
      size: args.showSize,
      noColor: true,
    });

    console.log = originalLog;

    return {
      content: [{ type: 'text', text: output || 'No .claude/ directory found' }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
}

export const toolSchemas = {
  'resolve-config': resolveConfigSchema,
  'validate-structure': validateStructureSchema,
  'detect-conflicts': detectConflictsSchema,
  'get-recommendations': getRecommendationsSchema,
  'show-sources': showSourcesSchema,
  'migrate': migrateSchema,
  'init': initSchema,
  'export-manifest': exportSchema,
  'analyze-gaps': gapsSchema,
  'show-tree': treeSchema,
};

export const toolHandlers = {
  'resolve-config': handleResolveConfig,
  'validate-structure': handleValidateStructure,
  'detect-conflicts': handleDetectConflicts,
  'get-recommendations': handleGetRecommendations,
  'show-sources': handleShowSources,
  'migrate': handleMigrate,
  'init': handleInit,
  'export-manifest': handleExport,
  'analyze-gaps': handleGaps,
  'show-tree': handleTree,
};
