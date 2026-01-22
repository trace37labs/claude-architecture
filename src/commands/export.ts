/**
 * Export Command
 *
 * Generates portable configuration manifests for cross-environment deployment.
 * Supports platform-aware export with intelligent filtering and path mapping.
 */

import fs from 'fs/promises';
import { stringify as yamlStringify } from 'yaml';
import { logger } from '../utils/logger.js';
import { scanAllConfigSources } from '../scanner.js';
import {
  ConfigManifest,
  MCPServer,
  CLITool,
  EnvironmentVariable,
  PathRequirement,
  SkillDependency,
  HookDefinition,
} from '../types/manifest.js';
import {
  Platform,
  detectPlatform,
  isToolPlatformSpecific,
  getInstallCommand,
  getPlatformConfig,
} from '../utils/platform-utils.js';

export interface ExportOptions {
  /** Output file path */
  output?: string;
  /** Target platform for smart filtering */
  platform?: Platform;
  /** Environment hints (dev, staging, production) */
  env?: string;
  /** Output as JSON instead of YAML */
  json?: boolean;
  /** Generate setup.sh script alongside manifest */
  generateSetup?: boolean;
  /** Directory to export from */
  targetDir?: string;
}

/**
 * Export command - generates portable manifest
 */
export async function exportCommand(options: ExportOptions = {}): Promise<void> {
  const targetDir = options.targetDir || process.cwd();
  const currentPlatform = detectPlatform();
  const targetPlatform = options.platform || currentPlatform;
  const outputPath = options.output || 'manifest.yaml';

  logger.info(`Scanning configuration from ${targetDir}...`);

  // Scan all configuration sources
  const scanResult = scanAllConfigSources({ cwd: targetDir });
  const { sources } = scanResult;

  // Build manifest
  const manifest = await buildManifest(sources, targetDir, currentPlatform, targetPlatform, options.env);

  // Write manifest file
  const manifestContent = options.json
    ? JSON.stringify(manifest, null, 2)
    : yamlStringify(manifest);

  await fs.writeFile(outputPath, manifestContent, 'utf-8');
  logger.success(`✓ Manifest exported to ${outputPath}`);

  // Generate setup script if requested
  if (options.generateSetup) {
    const setupPath = outputPath.replace(/\.(yaml|json)$/, '') + '.sh';
    const setupScript = generateSetupScript(manifest, targetPlatform);
    await fs.writeFile(setupPath, setupScript, 'utf-8');
    await fs.chmod(setupPath, 0o755);
    logger.success(`✓ Setup script generated: ${setupPath}`);
  }

  // Show summary
  console.log('\nManifest Summary:');
  console.log(`  • MCP Servers: ${manifest.required.mcp_servers.length}`);
  console.log(`  • CLI Tools: ${manifest.required.cli_tools.length}`);
  console.log(`  • Environment Variables: ${manifest.required.environment_variables.length}`);
  console.log(`  • Paths: ${manifest.required.paths.length}`);
  console.log(`  • Skills: ${manifest.required.skills.length}`);
  console.log(`  • Hooks: ${manifest.required.hooks.length}`);

  if (targetPlatform !== currentPlatform) {
    console.log(`\n  Platform filter: ${currentPlatform} → ${targetPlatform}`);
    console.log(`  (Platform-specific tools filtered)`);
  }
}

/**
 * Build configuration manifest from scanned sources
 */
async function buildManifest(
  sources: any,
  targetDir: string,
  currentPlatform: Platform,
  targetPlatform: Platform,
  _env?: string
): Promise<ConfigManifest> {
  const manifest: ConfigManifest = {
    metadata: {
      generated_from: targetDir,
      date: new Date().toISOString(),
      platform: currentPlatform,
      target_platform: targetPlatform !== currentPlatform ? targetPlatform : undefined,
    },
    required: {
      mcp_servers: [],
      cli_tools: [],
      environment_variables: [],
      paths: [],
      skills: [],
      hooks: [],
    },
  };

  // Extract MCP servers
  if (sources.userMcpConfig || sources.projectMcp) {
    manifest.required.mcp_servers = await extractMCPServers(sources);
  }

  // Extract CLI tools
  manifest.required.cli_tools = await extractCLITools(sources, targetPlatform);

  // Extract environment variables
  manifest.required.environment_variables = extractEnvironmentVariables(sources);

  // Extract path requirements
  manifest.required.paths = extractPaths(sources, targetDir);

  // Extract skills
  manifest.required.skills = extractSkills(sources, targetPlatform);

  // Extract hooks
  manifest.required.hooks = extractHooks(sources);

  // Add path mappings if cross-platform
  if (targetPlatform !== currentPlatform) {
    manifest.path_mappings = generatePathMappings(currentPlatform, targetPlatform);
  }

  return manifest;
}

/**
 * Extract MCP servers from configuration
 */
async function extractMCPServers(sources: any): Promise<MCPServer[]> {
  const servers: MCPServer[] = [];

  // Parse MCP config if available
  if (sources.userMcpConfig) {
    try {
      const mcpConfigPath = sources.userMcpConfig;
      const content = await fs.readFile(mcpConfigPath, 'utf-8');
      const config = JSON.parse(content);

      if (config.mcpServers) {
        for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
          const server = serverConfig as any;
          servers.push({
            name,
            package: extractPackageFromCommand(server.command, server.args),
            required: true, // Assume MCP servers are required
          });
        }
      }
    } catch (error) {
      // Silently skip if can't parse
    }
  }

  return servers;
}

/**
 * Extract package name from MCP command
 */
function extractPackageFromCommand(command: string, args: string[]): string {
  // Common pattern: npx @org/package or npx package
  if (command === 'npx' && args.length > 0) {
    const pkg = args[0];
    // Remove -y flag if present
    return pkg.replace(/^-y\s+/, '');
  }
  return command;
}

/**
 * Extract CLI tools from configuration
 */
async function extractCLITools(sources: any, targetPlatform: Platform): Promise<CLITool[]> {
  const tools = new Set<string>();
  const toolsList: CLITool[] = [];

  // Always include core tools
  tools.add('git');
  tools.add('npm');

  // Extract from AGENTS.md bash commands
  if (sources.projectAgents) {
    try {
      const content = await fs.readFile(sources.projectAgents, 'utf-8');
      // Look for bash commands in code blocks
      const bashBlocks = content.match(/```(?:bash|sh)\n([\s\S]*?)```/g);
      if (bashBlocks) {
        for (const block of bashBlocks) {
          // Extract command names (first word after $ or without $)
          const commands = block.match(/^\s*(?:\$\s+)?(\w+)/gm);
          if (commands) {
            commands.forEach(cmd => {
              const toolName = cmd.replace(/^\s*\$?\s*/, '').trim();
              if (toolName && !toolName.startsWith('#')) {
                tools.add(toolName);
              }
            });
          }
        }
      }
    } catch (error) {
      // Skip if can't read
    }
  }

  // Convert to tool list with platform filtering
  for (const tool of tools) {
    const platformRestriction = isToolPlatformSpecific(tool);

    // Skip if tool doesn't match target platform
    if (platformRestriction && platformRestriction !== targetPlatform) {
      continue;
    }

    toolsList.push({
      name: tool,
      required: ['git', 'npm'].includes(tool),
      platform: platformRestriction || undefined,
      install_cmd: getInstallCommand(tool, targetPlatform),
    });
  }

  return toolsList;
}

/**
 * Extract environment variables
 */
function extractEnvironmentVariables(_sources: any): EnvironmentVariable[] {
  const vars: EnvironmentVariable[] = [];

  // Common required variables
  vars.push({ name: 'ANTHROPIC_API_KEY', required: true });

  // Add others based on MCP servers
  // TODO: Extract from actual MCP config requirements

  return vars;
}

/**
 * Extract path requirements
 */
function extractPaths(sources: any, _targetDir: string): PathRequirement[] {
  const paths: PathRequirement[] = [];

  // Add project scripts directory if exists
  paths.push({
    source: './scripts',
    description: 'Project scripts',
    required: sources.projectHooks.length > 0,
  });

  return paths;
}

/**
 * Extract skills with dependencies
 */
function extractSkills(sources: any, targetPlatform: Platform): SkillDependency[] {
  const skills: SkillDependency[] = [];

  for (const skill of sources.projectSkills) {
    const platformRestriction = skill.metadata?.platform;

    // Skip if skill doesn't match target platform
    if (platformRestriction && platformRestriction !== targetPlatform) {
      continue;
    }

    skills.push({
      name: skill.name,
      dependencies: skill.metadata?.dependencies || [],
      platform: platformRestriction,
    });
  }

  return skills;
}

/**
 * Extract hooks
 */
function extractHooks(sources: any): HookDefinition[] {
  return sources.projectHooks.map((hook: any) => ({
    event: hook.event,
    script: hook.command,
  }));
}

/**
 * Generate path mappings for cross-platform export
 */
function generatePathMappings(from: Platform, to: Platform): Record<string, any> {
  const fromConfig = getPlatformConfig(from);
  const toConfig = getPlatformConfig(to);

  const mappings: Record<string, any> = {};

  mappings[`${from}_to_${to}`] = {
    [fromConfig.homeDir]: toConfig.homeDir,
    [fromConfig.configDir]: toConfig.configDir,
  };

  return mappings;
}

/**
 * Generate setup.sh script for target platform
 */
function generateSetupScript(manifest: ConfigManifest, platform: Platform): string {
  const platformConfig = getPlatformConfig(platform);
  const scriptExt = platformConfig.shellExt;

  if (scriptExt === 'ps1') {
    return generateWindowsSetupScript(manifest);
  }

  return generateUnixSetupScript(manifest, platform);
}

/**
 * Generate Unix setup script (bash/sh)
 */
function generateUnixSetupScript(manifest: ConfigManifest, _platform: Platform): string {
  const lines: string[] = [];

  lines.push('#!/bin/bash');
  lines.push('# Claude Architecture Environment Setup');
  lines.push(`# Generated from: ${manifest.metadata.generated_from}`);
  lines.push(`# Date: ${new Date().toISOString().split('T')[0]}`);
  lines.push('#');
  lines.push('# Run this script to install missing dependencies for this project.');
  lines.push('# Usage: ./setup.sh [--check-only] [--skip-optional]');
  lines.push('');
  lines.push('set -e');
  lines.push('');
  lines.push('RED=\'\\033[0;31m\'');
  lines.push('GREEN=\'\\033[0;32m\'');
  lines.push('YELLOW=\'\\033[1;33m\'');
  lines.push('NC=\'\\033[0m\' # No Color');
  lines.push('');
  lines.push('CHECK_ONLY=false');
  lines.push('SKIP_OPTIONAL=false');
  lines.push('');
  lines.push('# Parse arguments');
  lines.push('while [[ "$#" -gt 0 ]]; do');
  lines.push('    case $1 in');
  lines.push('        --check-only) CHECK_ONLY=true ;;');
  lines.push('        --skip-optional) SKIP_OPTIONAL=true ;;');
  lines.push('        *) echo "Unknown parameter: $1"; exit 1 ;;');
  lines.push('    esac');
  lines.push('    shift');
  lines.push('done');
  lines.push('');
  lines.push('echo "🔍 Checking environment requirements..."');
  lines.push('echo ""');
  lines.push('');
  lines.push('MISSING_REQUIRED=0');
  lines.push('MISSING_OPTIONAL=0');
  lines.push('');

  // MCP Servers
  if (manifest.required.mcp_servers.length > 0) {
    lines.push('# ============================================');
    lines.push('# MCP Servers');
    lines.push('# ============================================');
    lines.push('echo "📦 MCP Servers"');
    lines.push('');
    lines.push('check_mcp() {');
    lines.push('    local name=$1');
    lines.push('    local package=$2');
    lines.push('    local required=$3');
    lines.push('');
    lines.push('    if grep -q "\\"$name\\"" ~/.claude.json 2>/dev/null; then');
    lines.push('        echo -e "  ${GREEN}✓${NC} $name"');
    lines.push('    else');
    lines.push('        if [ "$required" = "true" ]; then');
    lines.push('            echo -e "  ${RED}✗${NC} $name (required)"');
    lines.push('            MISSING_REQUIRED=$((MISSING_REQUIRED + 1))');
    lines.push('            if [ "$CHECK_ONLY" = false ]; then');
    lines.push('                echo "    → Installing: claude mcp add $name -- npx $package"');
    lines.push('                claude mcp add $name -- npx $package');
    lines.push('            fi');
    lines.push('        else');
    lines.push('            echo -e "  ${YELLOW}○${NC} $name (optional)"');
    lines.push('            MISSING_OPTIONAL=$((MISSING_OPTIONAL + 1))');
    lines.push('        fi');
    lines.push('    fi');
    lines.push('}');
    lines.push('');

    for (const server of manifest.required.mcp_servers) {
      lines.push(`check_mcp "${server.name}" "${server.package}" "${server.required}"`);
    }

    lines.push('echo ""');
    lines.push('');
  }

  // CLI Tools
  if (manifest.required.cli_tools.length > 0) {
    lines.push('# ============================================');
    lines.push('# CLI Tools');
    lines.push('# ============================================');
    lines.push('echo "🔧 CLI Tools"');
    lines.push('');
    lines.push('check_tool() {');
    lines.push('    local name=$1');
    lines.push('    local install_cmd=$2');
    lines.push('    local required=$3');
    lines.push('    local platform=$4');
    lines.push('');
    lines.push('    # Skip platform-specific tools');
    lines.push('    if [ -n "$platform" ] && [ "$(uname -s | tr \'[:upper:]\' \'[:lower:]\')" != "$platform" ]; then');
    lines.push('        echo -e "  ${YELLOW}⊘${NC} $name (skipped - $platform only)"');
    lines.push('        return');
    lines.push('    fi');
    lines.push('');
    lines.push('    if command -v $name &> /dev/null; then');
    lines.push('        local version=$($name --version 2>/dev/null | head -1 || echo "installed")');
    lines.push('        echo -e "  ${GREEN}✓${NC} $name ($version)"');
    lines.push('    else');
    lines.push('        if [ "$required" = "true" ]; then');
    lines.push('            echo -e "  ${RED}✗${NC} $name (required)"');
    lines.push('            MISSING_REQUIRED=$((MISSING_REQUIRED + 1))');
    lines.push('            if [ "$CHECK_ONLY" = false ]; then');
    lines.push('                echo "    → Installing: $install_cmd"');
    lines.push('                eval $install_cmd');
    lines.push('            fi');
    lines.push('        else');
    lines.push('            echo -e "  ${YELLOW}○${NC} $name (optional)"');
    lines.push('            MISSING_OPTIONAL=$((MISSING_OPTIONAL + 1))');
    lines.push('        fi');
    lines.push('    fi');
    lines.push('}');
    lines.push('');

    for (const tool of manifest.required.cli_tools) {
      const platformArg = tool.platform ? `"${tool.platform}"` : '""';
      lines.push(`check_tool "${tool.name}" "${tool.install_cmd || ''}" "${tool.required}" ${platformArg}`);
    }

    lines.push('echo ""');
    lines.push('');
  }

  // Environment Variables
  if (manifest.required.environment_variables.length > 0) {
    lines.push('# ============================================');
    lines.push('# Environment Variables');
    lines.push('# ============================================');
    lines.push('echo "🔑 Environment Variables"');
    lines.push('');
    lines.push('check_env() {');
    lines.push('    local name=$1');
    lines.push('    local required=$2');
    lines.push('');
    lines.push('    if [ -n "${!name}" ]; then');
    lines.push('        echo -e "  ${GREEN}✓${NC} $name (set)"');
    lines.push('    else');
    lines.push('        if [ "$required" = "true" ]; then');
    lines.push('            echo -e "  ${RED}✗${NC} $name (required - NOT SET)"');
    lines.push('            MISSING_REQUIRED=$((MISSING_REQUIRED + 1))');
    lines.push('            echo "    → Add to ~/.bashrc or ~/.zshrc:"');
    lines.push('            echo "      export $name=\\"your-value-here\\""');
    lines.push('        else');
    lines.push('            echo -e "  ${YELLOW}○${NC} $name (optional - not set)"');
    lines.push('            MISSING_OPTIONAL=$((MISSING_OPTIONAL + 1))');
    lines.push('        fi');
    lines.push('    fi');
    lines.push('}');
    lines.push('');

    for (const envVar of manifest.required.environment_variables) {
      lines.push(`check_env "${envVar.name}" "${envVar.required}"`);
    }

    lines.push('echo ""');
    lines.push('');
  }

  // Summary
  lines.push('# ============================================');
  lines.push('# Summary');
  lines.push('# ============================================');
  lines.push('echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"');
  lines.push('if [ $MISSING_REQUIRED -eq 0 ]; then');
  lines.push('    echo -e "${GREEN}✓ All required dependencies satisfied${NC}"');
  lines.push('else');
  lines.push('    echo -e "${RED}✗ Missing $MISSING_REQUIRED required dependencies${NC}"');
  lines.push('fi');
  lines.push('');
  lines.push('if [ $MISSING_OPTIONAL -gt 0 ]; then');
  lines.push('    echo -e "${YELLOW}○ $MISSING_OPTIONAL optional dependencies not installed${NC}"');
  lines.push('fi');
  lines.push('');
  lines.push('echo ""');
  lines.push('if [ $MISSING_REQUIRED -gt 0 ] && [ "$CHECK_ONLY" = true ]; then');
  lines.push('    echo "Run without --check-only to install missing dependencies"');
  lines.push('    exit 1');
  lines.push('fi');

  return lines.join('\n');
}

/**
 * Generate Windows setup script (PowerShell)
 */
function generateWindowsSetupScript(_manifest: ConfigManifest): string {
  // TODO: Implement PowerShell setup script for Windows
  return '# Windows setup script not yet implemented';
}
