/**
 * Settings.json Parser
 *
 * Parses .claude/settings.json and classifies content into
 * RULES (permissions) and TOOLS (hooks, MCP servers) layers.
 */

import { readFileSync } from 'fs';
import type { SettingsJson, HookConfig } from '../types/sources.js';
import type { RulesLayer, ToolsLayer } from '../types/layers.js';

/**
 * Parse result from settings.json
 */
export interface SettingsParseResult {
  rules?: RulesLayer;
  tools?: ToolsLayer;
}

/**
 * Parse settings.json file and extract layer content
 *
 * @param settingsPath - Path to settings.json
 * @returns Parsed rules and tools layers
 */
export function parseSettingsJson(settingsPath: string): SettingsParseResult {
  try {
    const content = readFileSync(settingsPath, 'utf-8');
    const settings: SettingsJson = JSON.parse(content);

    const result: SettingsParseResult = {};

    // Extract permissions → RULES layer
    if (settings.permissions) {
      result.rules = extractRulesFromPermissions(settings.permissions);
    }

    // Extract hooks and MCP → TOOLS layer
    const hooks = settings.hooks ? extractHooks(settings.hooks) : [];
    const mcp = settings.mcp?.servers || [];

    if (hooks.length > 0 || mcp.length > 0) {
      result.tools = {
        rawContent: buildSettingsToolsMarkdown(hooks, mcp),
        mcpServers: mcp.length > 0 ? mcp : undefined,
        // hooks are tracked separately in HookConfig
      };
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to parse settings.json at ${settingsPath}: ${error}`);
  }
}

/**
 * Extract rules from permissions configuration
 */
function extractRulesFromPermissions(permissions: any): RulesLayer {
  const forbidden: string[] = [];
  const required: string[] = [];

  // Bash permissions
  if (permissions.bash) {
    if (Array.isArray(permissions.bash)) {
      // Whitelist mode - everything else is forbidden
      forbidden.push('Only approved bash commands are allowed');
      required.push(`Bash commands must match patterns: ${permissions.bash.join(', ')}`);
    }
  }

  // File permissions
  if (permissions.files) {
    if (Array.isArray(permissions.files)) {
      forbidden.push('File access restricted to approved paths only');
      required.push(`File operations must target: ${permissions.files.join(', ')}`);
    }
  }

  const rawContent = buildPermissionsMarkdown(permissions);

  return {
    rawContent,
    forbidden,
    required,
    security: ['Permissions enforced via settings.json'],
  };
}

/**
 * Extract hooks configuration
 */
function extractHooks(hooksConfig: Record<string, any>): HookConfig[] {
  const hooks: HookConfig[] = [];

  for (const [name, config] of Object.entries(hooksConfig)) {
    if (typeof config === 'object' && config !== null) {
      hooks.push({
        name,
        type: name.startsWith('pre') ? 'pre' : 'post',
        command: config.command || '',
        cwd: config.cwd,
        enabled: config.enabled !== false,
      });
    }
  }

  return hooks;
}

/**
 * Build markdown for permissions
 */
function buildPermissionsMarkdown(permissions: any): string {
  const lines = ['## Permissions\n'];

  if (permissions.bash) {
    lines.push('### Bash Permissions\n');
    if (Array.isArray(permissions.bash)) {
      lines.push('**Allowed patterns:**\n');
      for (const pattern of permissions.bash) {
        lines.push(`- \`${pattern}\``);
      }
    }
    lines.push('');
  }

  if (permissions.files) {
    lines.push('### File Permissions\n');
    if (Array.isArray(permissions.files)) {
      lines.push('**Allowed paths:**\n');
      for (const path of permissions.files) {
        lines.push(`- \`${path}\``);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Build markdown for hooks and MCP
 */
function buildSettingsToolsMarkdown(hooks: HookConfig[], mcp: any[]): string {
  const lines = [];

  if (hooks.length > 0) {
    lines.push('## Hooks\n');
    for (const hook of hooks) {
      lines.push(`### ${hook.name} (${hook.type})\n`);
      lines.push(`- **Command**: \`${hook.command}\``);
      if (hook.cwd) {
        lines.push(`- **Working Directory**: \`${hook.cwd}\``);
      }
      lines.push(`- **Enabled**: ${hook.enabled ? 'Yes' : 'No'}`);
      lines.push('');
    }
  }

  if (mcp.length > 0) {
    lines.push('## MCP Servers (from settings.json)\n');
    for (const server of mcp) {
      lines.push(`### ${server.name}\n`);
      lines.push(`- **Command**: \`${server.command}\``);
      if (server.args) {
        lines.push(`- **Args**: \`${server.args.join(' ')}\``);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Validate settings.json structure
 */
export function validateSettingsJson(settingsPath: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = readFileSync(settingsPath, 'utf-8');
    const settings: SettingsJson = JSON.parse(content);

    // Validate hooks
    if (settings.hooks) {
      for (const [name, config] of Object.entries(settings.hooks)) {
        if (!config.command) {
          errors.push(`Hook "${name}": missing "command" field`);
        }
      }
    }

    // Validate permissions
    if (settings.permissions) {
      if (settings.permissions.bash && !Array.isArray(settings.permissions.bash)) {
        warnings.push('permissions.bash should be an array of patterns');
      }
      if (settings.permissions.files && !Array.isArray(settings.permissions.files)) {
        warnings.push('permissions.files should be an array of paths');
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
