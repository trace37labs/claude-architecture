#!/usr/bin/env node
/**
 * MCP Server Implementation
 * Exposes Claude Architecture capabilities via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { toolSchemas, toolHandlers } from './tools.js';
import { VERSION } from '../index.js';

/**
 * Tool definitions for MCP protocol
 */
const tools: Tool[] = [
  {
    name: 'resolve-config',
    description: 'Resolve merged configuration across all scopes (Task/Project/User/System) with proper precedence',
    inputSchema: {
      type: 'object',
      properties: {
        taskPath: {
          type: 'string',
          description: 'Path to task-specific .claude/ directory',
        },
        projectPath: {
          type: 'string',
          description: 'Path to project .claude/ directory',
        },
        userPath: {
          type: 'string',
          description: 'Path to user .claude/ directory',
        },
        systemPath: {
          type: 'string',
          description: 'Path to system .claude/ directory',
        },
        taskId: {
          type: 'string',
          description: 'Optional task identifier',
        },
        format: {
          type: 'string',
          enum: ['json', 'tree', 'precedence'],
          default: 'json',
          description: 'Output format (json/tree/precedence)',
        },
      },
    },
  },
  {
    name: 'validate-structure',
    description: 'Validate .claude/ directory structure and schema compliance',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to .claude/ directory to validate',
        },
        format: {
          type: 'string',
          enum: ['json', 'text'],
          default: 'text',
          description: 'Output format (json/text)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'detect-conflicts',
    description: 'Detect conflicts and issues in configuration across all layers',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to .claude/ directory to analyze',
        },
        format: {
          type: 'string',
          enum: ['json', 'text'],
          default: 'text',
          description: 'Output format (json/text)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'get-recommendations',
    description: 'Get recommendations for improving configuration',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to .claude/ directory to analyze',
        },
        format: {
          type: 'string',
          enum: ['json', 'text'],
          default: 'text',
          description: 'Output format (json/text)',
        },
        quickWins: {
          type: 'boolean',
          default: false,
          description: 'Show only quick wins (high impact, low effort)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'show-sources',
    description: 'Show ALL configuration sources (CLAUDE.md, MCP, hooks, skills, memory) in unified view',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Project path (default: current directory)',
        },
        format: {
          type: 'string',
          enum: ['unified', 'json'],
          default: 'unified',
          description: 'Output format',
        },
        scope: {
          type: 'string',
          enum: ['user', 'project', 'task', 'system'],
          description: 'Filter to specific scope',
        },
        layer: {
          type: 'string',
          enum: ['rules', 'tools', 'methods', 'knowledge', 'goals'],
          description: 'Filter to specific layer',
        },
      },
    },
  },
  {
    name: 'migrate',
    description: 'Migrate legacy CLAUDE.md/AGENTS.md to organized .claude/ structure',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Source directory (default: current directory)',
        },
        dryRun: {
          type: 'boolean',
          default: true,
          description: 'Preview changes without applying',
        },
        all: {
          type: 'boolean',
          default: false,
          description: 'Migrate all config sources (MCP, hooks, skills, memory)',
        },
        source: {
          type: 'string',
          enum: ['mcp', 'hooks', 'skills', 'memory'],
          description: 'Specific source to migrate',
        },
      },
    },
  },
  {
    name: 'init',
    description: 'Initialize .claude/ directory structure for a project',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Target directory (default: current directory)',
        },
        minimal: {
          type: 'boolean',
          default: false,
          description: 'Create minimal structure (single files instead of subdirs)',
        },
        dryRun: {
          type: 'boolean',
          default: true,
          description: 'Preview what would be created',
        },
      },
    },
  },
  {
    name: 'export-manifest',
    description: 'Export portable requirements manifest for environment migration (Mac→VPS, team onboarding)',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Project path (default: current directory)',
        },
        format: {
          type: 'string',
          enum: ['yaml', 'json'],
          default: 'yaml',
          description: 'Output format',
        },
        platform: {
          type: 'string',
          enum: ['darwin', 'linux', 'windows'],
          description: 'Target platform for platform-specific filtering',
        },
      },
    },
  },
  {
    name: 'analyze-gaps',
    description: 'Analyze what is missing in current environment compared to manifest',
    inputSchema: {
      type: 'object',
      properties: {
        manifest: {
          type: 'string',
          description: 'Path to manifest file to compare against',
        },
        path: {
          type: 'string',
          description: 'Project path to compare against (alternative to manifest)',
        },
        format: {
          type: 'string',
          enum: ['text', 'json'],
          default: 'text',
          description: 'Output format',
        },
      },
    },
  },
  {
    name: 'show-tree',
    description: 'Display .claude/ directory structure as visual tree',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to project (default: current directory)',
        },
        depth: {
          type: 'number',
          description: 'Maximum depth to display',
        },
        showSize: {
          type: 'boolean',
          default: false,
          description: 'Show file sizes',
        },
      },
    },
  },
];

/**
 * Create and configure MCP server
 */
export function createMcpServer(): Server {
  const server = new Server(
    {
      name: 'claude-arch',
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Validate tool exists
    const schema = toolSchemas[name as keyof typeof toolSchemas];
    const handler = toolHandlers[name as keyof typeof toolHandlers];

    if (!schema || !handler) {
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
    }

    // Validate and parse arguments
    const parseResult = schema.safeParse(args);
    if (!parseResult.success) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid arguments: ${parseResult.error.message}`,
          },
        ],
        isError: true,
      };
    }

    // Execute tool handler
    return await handler(parseResult.data as any);
  });

  return server;
}

/**
 * Start MCP server with stdio transport
 */
async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol)
  console.error('Claude Architecture MCP Server running on stdio');
  console.error(`Version: ${VERSION}`);
  console.error(`Tools: ${tools.map(t => t.name).join(', ')}`);
}

// Run server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
