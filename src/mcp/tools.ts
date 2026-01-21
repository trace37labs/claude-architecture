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

export const toolSchemas = {
  'resolve-config': resolveConfigSchema,
  'validate-structure': validateStructureSchema,
  'detect-conflicts': detectConflictsSchema,
  'get-recommendations': getRecommendationsSchema,
};

export const toolHandlers = {
  'resolve-config': handleResolveConfig,
  'validate-structure': handleValidateStructure,
  'detect-conflicts': handleDetectConflicts,
  'get-recommendations': handleGetRecommendations,
};
