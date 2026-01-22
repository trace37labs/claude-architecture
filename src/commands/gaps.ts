/**
 * Gaps Command
 *
 * Analyzes the current environment against a configuration manifest,
 * identifying missing dependencies, tools, and configuration.
 */

import fs from 'fs/promises';
import { parse as yamlParse } from 'yaml';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';
import { ConfigManifest, GapAnalysisResult } from '../types/manifest.js';
import { detectPlatform } from '../utils/platform-utils.js';

export interface GapsOptions {
  /** Manifest file to check against */
  manifest?: string;
  /** Source project directory to compare against */
  from?: string;
  /** Show install commands for missing items */
  fix?: boolean;
  /** Output as JSON */
  json?: boolean;
}

/**
 * Gaps command - analyze environment gaps
 */
export async function gapsCommand(options: GapsOptions = {}): Promise<GapAnalysisResult> {
  // Load manifest
  let manifest: ConfigManifest;

  if (options.manifest) {
    manifest = await loadManifest(options.manifest);
  } else if (options.from) {
    // TODO: Generate manifest on-the-fly from source project
    throw new Error('--from option not yet implemented');
  } else {
    logger.error('Either --manifest or --from must be specified');
    process.exit(1);
  }

  logger.info('Analyzing environment gaps...\n');

  // Analyze gaps
  const result = await analyzeGaps(manifest);

  // Display results
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    displayGapsReport(result, options.fix || false);
  }

  // Return result for programmatic use
  return result;
}

/**
 * Load manifest from file
 */
async function loadManifest(manifestPath: string): Promise<ConfigManifest> {
  const content = await fs.readFile(manifestPath, 'utf-8');

  if (manifestPath.endsWith('.json')) {
    return JSON.parse(content);
  } else if (manifestPath.endsWith('.yaml') || manifestPath.endsWith('.yml')) {
    return yamlParse(content);
  } else {
    throw new Error('Manifest must be .json or .yaml file');
  }
}

/**
 * Analyze gaps between manifest and current environment
 */
async function analyzeGaps(manifest: ConfigManifest): Promise<GapAnalysisResult> {
  const currentPlatform = detectPlatform();

  const result: GapAnalysisResult = {
    mcp_servers: { installed: [], missing: [] },
    cli_tools: { available: [], missing: [], skipped: [] },
    environment_variables: { set: [], missing: [] },
    paths: { exists: [], missing: [] },
    hooks: { found: [], missing: [] },
    summary: {
      required_missing: 0,
      required_available: 0,
      optional_missing: 0,
      optional_available: 0,
    },
  };

  // Check MCP servers
  for (const server of manifest.required.mcp_servers) {
    if (await checkMCPServer(server.name)) {
      result.mcp_servers.installed.push(server);
      if (server.required) {
        result.summary.required_available++;
      } else {
        result.summary.optional_available++;
      }
    } else {
      result.mcp_servers.missing.push(server);
      if (server.required) {
        result.summary.required_missing++;
      } else {
        result.summary.optional_missing++;
      }
    }
  }

  // Check CLI tools
  for (const tool of manifest.required.cli_tools) {
    // Skip platform-specific tools that don't match current platform
    if (tool.platform && tool.platform !== currentPlatform) {
      result.cli_tools.skipped.push(tool);
      continue;
    }

    const version = await checkCLITool(tool.name);
    if (version) {
      result.cli_tools.available.push({ ...tool, version });
      if (tool.required) {
        result.summary.required_available++;
      } else {
        result.summary.optional_available++;
      }
    } else {
      result.cli_tools.missing.push(tool);
      if (tool.required) {
        result.summary.required_missing++;
      } else {
        result.summary.optional_missing++;
      }
    }
  }

  // Check environment variables
  for (const envVar of manifest.required.environment_variables) {
    if (process.env[envVar.name]) {
      result.environment_variables.set.push(envVar);
      if (envVar.required) {
        result.summary.required_available++;
      } else {
        result.summary.optional_available++;
      }
    } else {
      result.environment_variables.missing.push(envVar);
      if (envVar.required) {
        result.summary.required_missing++;
      } else {
        result.summary.optional_missing++;
      }
    }
  }

  // Check paths
  for (const pathReq of manifest.required.paths) {
    try {
      await fs.access(pathReq.source);
      result.paths.exists.push(pathReq);
      if (pathReq.required) {
        result.summary.required_available++;
      } else {
        result.summary.optional_available++;
      }
    } catch {
      result.paths.missing.push(pathReq);
      if (pathReq.required) {
        result.summary.required_missing++;
      } else {
        result.summary.optional_missing++;
      }
    }
  }

  // Check hooks
  for (const hook of manifest.required.hooks) {
    try {
      await fs.access(hook.script);
      result.hooks.found.push(hook);
      result.summary.required_available++;
    } catch {
      result.hooks.missing.push(hook);
      result.summary.required_missing++;
    }
  }

  return result;
}

/**
 * Check if MCP server is installed/configured
 */
async function checkMCPServer(name: string): Promise<boolean> {
  try {
    const configPath = process.env.HOME + '/.claude.json';
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    return config.mcpServers && config.mcpServers[name] !== undefined;
  } catch {
    return false;
  }
}

/**
 * Check if CLI tool is available
 */
async function checkCLITool(name: string): Promise<string | null> {
  try {
    const result = execSync(`${name} --version 2>&1`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.split('\n')[0].trim();
  } catch {
    // Try alternative version commands
    try {
      const result = execSync(`${name} -v 2>&1`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return result.split('\n')[0].trim();
    } catch {
      return null;
    }
  }
}

/**
 * Display gaps analysis report
 */
function displayGapsReport(result: GapAnalysisResult, showFix: boolean): void {
  const c = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
  };

  console.log(`${c.bright}Environment Gap Analysis${c.reset}`);
  console.log('========================\n');

  // MCP Servers
  if (result.mcp_servers.installed.length > 0 || result.mcp_servers.missing.length > 0) {
    console.log(`${c.bright}MCP Servers${c.reset}`);
    for (const server of result.mcp_servers.missing) {
      const marker = server.required ? `${c.red}✗${c.reset}` : `${c.yellow}○${c.reset}`;
      console.log(`${marker} ${server.name} - NOT INSTALLED`);
      if (showFix) {
        console.log(`  Install: claude mcp add ${server.name} -- npx ${server.package}`);
      }
    }
    for (const server of result.mcp_servers.installed) {
      console.log(`${c.green}✓${c.reset} ${server.name} - installed`);
    }
    console.log();
  }

  // CLI Tools
  if (result.cli_tools.available.length > 0 || result.cli_tools.missing.length > 0 || result.cli_tools.skipped.length > 0) {
    console.log(`${c.bright}CLI Tools${c.reset}`);
    for (const tool of result.cli_tools.missing) {
      const marker = tool.required ? `${c.red}✗${c.reset}` : `${c.yellow}○${c.reset}`;
      console.log(`${marker} ${tool.name} - NOT FOUND`);
      if (showFix && tool.install_cmd) {
        console.log(`  Install: ${tool.install_cmd}`);
      }
    }
    for (const tool of result.cli_tools.available) {
      console.log(`${c.green}✓${c.reset} ${tool.name} - available${tool.version ? ` (${tool.version})` : ''}`);
    }
    for (const tool of result.cli_tools.skipped) {
      console.log(`${c.yellow}⊘${c.reset} ${tool.name} - SKIPPED (${tool.platform} only, current: ${detectPlatform()})`);
    }
    console.log();
  }

  // Environment Variables
  if (result.environment_variables.set.length > 0 || result.environment_variables.missing.length > 0) {
    console.log(`${c.bright}Environment Variables${c.reset}`);
    for (const envVar of result.environment_variables.missing) {
      const marker = envVar.required ? `${c.red}✗${c.reset}` : `${c.yellow}○${c.reset}`;
      console.log(`${marker} ${envVar.name} - NOT SET`);
    }
    for (const envVar of result.environment_variables.set) {
      console.log(`${c.green}✓${c.reset} ${envVar.name} - set`);
    }
    console.log();
  }

  // Paths
  if (result.paths.exists.length > 0 || result.paths.missing.length > 0) {
    console.log(`${c.bright}Paths${c.reset}`);
    for (const path of result.paths.missing) {
      const marker = path.required ? `${c.red}✗${c.reset}` : `${c.yellow}○${c.reset}`;
      console.log(`${marker} ${path.source} - NOT FOUND`);
      if (path.description) {
        console.log(`  ${c.dim}${path.description}${c.reset}`);
      }
    }
    for (const path of result.paths.exists) {
      console.log(`${c.green}✓${c.reset} ${path.source} - exists`);
    }
    console.log();
  }

  // Hooks
  if (result.hooks.found.length > 0 || result.hooks.missing.length > 0) {
    console.log(`${c.bright}Hooks${c.reset}`);
    for (const hook of result.hooks.missing) {
      console.log(`${c.red}✗${c.reset} ${hook.script} - NOT FOUND`);
    }
    for (const hook of result.hooks.found) {
      console.log(`${c.green}✓${c.reset} ${hook.script}`);
    }
    console.log();
  }

  // Summary
  console.log(`${c.bright}Summary${c.reset}`);
  console.log('=======');
  console.log(`Required: ${c.red}${result.summary.required_missing} missing${c.reset}, ${c.green}${result.summary.required_available} available${c.reset}`);
  if (result.summary.optional_missing > 0 || result.summary.optional_available > 0) {
    console.log(`Optional: ${c.yellow}${result.summary.optional_missing} missing${c.reset}, ${c.green}${result.summary.optional_available} available${c.reset}`);
  }
  console.log();

  if (showFix && result.summary.required_missing === 0 && result.summary.optional_missing === 0) {
    console.log(`${c.green}✓ All dependencies satisfied!${c.reset}`);
  } else if (!showFix && result.summary.required_missing > 0) {
    console.log(`${c.dim}Run 'claude-arch gaps --manifest <file> --fix' for install commands${c.reset}`);
  }
}
