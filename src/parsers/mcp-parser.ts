/**
 * MCP Configuration Parser
 *
 * Parses ~/.claude.json and .mcp.json files and classifies
 * their content into the TOOLS layer.
 */

import { readFileSync } from 'fs';
import type { MCPConfig } from '../types/sources.js';
import type { ToolsLayer } from '../types/layers.js';

/**
 * Parse MCP configuration file into Tools layer
 *
 * @param mcpPath - Path to ~/.claude.json or .mcp.json
 * @returns Tools layer with MCP servers
 */
export function parseMCPConfig(mcpPath: string): ToolsLayer {
  try {
    const content = readFileSync(mcpPath, 'utf-8');
    const config = JSON.parse(content);

    const mcpServers: MCPConfig[] = [];

    // Handle different MCP config formats
    if (config.mcpServers) {
      // Standard format: { mcpServers: { name: { command, args } } }
      for (const [name, cfg] of Object.entries(config.mcpServers)) {
        const serverCfg = cfg as any;
        mcpServers.push({
          name,
          command: serverCfg.command,
          args: serverCfg.args || [],
          env: serverCfg.env,
          url: serverCfg.url,
        });
      }
    } else if (config.servers) {
      // Alternative format: { servers: [...] }
      for (const server of config.servers) {
        mcpServers.push({
          name: server.name,
          command: server.command,
          args: server.args || [],
          env: server.env,
          url: server.url,
        });
      }
    }

    // Build markdown documentation for MCP servers
    const rawContent = buildMCPMarkdown(mcpServers);

    return {
      rawContent,
      mcpServers,
    };
  } catch (error) {
    throw new Error(`Failed to parse MCP config at ${mcpPath}: ${error}`);
  }
}

/**
 * Build markdown documentation for MCP servers
 */
function buildMCPMarkdown(servers: MCPConfig[]): string {
  if (servers.length === 0) {
    return '';
  }

  const lines = ['## MCP Servers\n'];

  for (const server of servers) {
    lines.push(`### ${server.name}\n`);
    lines.push(`- **Command**: \`${server.command}\``);

    if (server.args && server.args.length > 0) {
      lines.push(`- **Args**: \`${server.args.join(' ')}\``);
    }

    if (server.url) {
      lines.push(`- **URL**: ${server.url}`);
    }

    if (server.env) {
      lines.push(`- **Environment**:`);
      for (const [key, value] of Object.entries(server.env)) {
        lines.push(`  - \`${key}\`: ${value}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Extract MCP server names from config
 */
export function extractMCPServerNames(mcpPath: string): string[] {
  try {
    const layer = parseMCPConfig(mcpPath);
    return layer.mcpServers?.map(s => s.name) || [];
  } catch {
    return [];
  }
}

/**
 * Validate MCP configuration structure
 */
export function validateMCPConfig(mcpPath: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = readFileSync(mcpPath, 'utf-8');
    const config = JSON.parse(content);

    // Check for required fields
    if (!config.mcpServers && !config.servers) {
      errors.push('Missing "mcpServers" or "servers" field');
    }

    const servers = config.mcpServers || config.servers || {};
    const serverList: any[] = Array.isArray(servers)
      ? servers
      : Object.entries(servers).map(([name, cfg]: [string, any]) => ({ name, ...cfg }));

    // Validate each server
    for (const server of serverList) {
      const name = server.name || 'unnamed';

      if (!server.command) {
        errors.push(`Server "${name}": missing "command" field`);
      }

      // Warn about common issues
      if (server.args && !Array.isArray(server.args)) {
        warnings.push(`Server "${name}": "args" should be an array`);
      }

      if (server.env && typeof server.env !== 'object') {
        warnings.push(`Server "${name}": "env" should be an object`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to parse JSON: ${error}`],
      warnings: [],
    };
  }
}
