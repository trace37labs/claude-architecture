/**
 * File System Scanner
 *
 * Discovers .claude/ directories across all scope levels:
 * - Task scope (current working directory context)
 * - Project scope (.claude/ in current project)
 * - User scope (~/.claude/ in home directory)
 * - System scope (Anthropic defaults - not filesystem-based)
 */

import { homedir } from 'os';
import { resolve, join } from 'path';
import { existsSync, statSync } from 'fs';
import { ScopeLevel } from './types/scope.js';

/**
 * Location of a .claude/ directory
 */
export interface ClaudeDirectory {
  /** Scope level this directory belongs to */
  scope: ScopeLevel;
  /** Absolute path to the .claude/ directory */
  path: string;
  /** Whether this directory exists */
  exists: boolean;
  /** Whether this is the default location for this scope */
  isDefault: boolean;
}

/**
 * Result of scanning for .claude/ directories
 */
export interface ScanResult {
  /** All discovered .claude/ directories */
  directories: ClaudeDirectory[];
  /** Working directory used for scanning */
  workingDirectory: string;
  /** User's home directory */
  homeDirectory: string;
}

/**
 * Options for scanning
 */
export interface ScanOptions {
  /** Working directory to start from (default: process.cwd()) */
  cwd?: string;
  /** Whether to include non-existent locations */
  includeNonExistent?: boolean;
  /** Custom home directory path (for testing) */
  homeDir?: string;
  /** Whether to check for task-specific directories */
  includeTaskScope?: boolean;
}

/**
 * Scan for .claude/ directories across all scope levels
 *
 * @param options - Scan configuration options
 * @returns Scan result with discovered directories
 *
 * @example
 * ```typescript
 * const result = scanForClaudeDirectories();
 * console.log(result.directories.filter(d => d.exists));
 * ```
 */
export function scanForClaudeDirectories(
  options: ScanOptions = {}
): ScanResult {
  const cwd = options.cwd ? resolve(options.cwd) : process.cwd();
  const homeDir = options.homeDir || homedir();
  const includeNonExistent = options.includeNonExistent ?? false;
  const includeTaskScope = options.includeTaskScope ?? true;

  const directories: ClaudeDirectory[] = [];

  // Task scope - check for task-specific .claude/ directory
  // (This would be for task-specific overrides in a subdirectory)
  if (includeTaskScope) {
    const taskClaudeDir = join(cwd, '.claude-task');
    const taskExists = existsSync(taskClaudeDir) && isDirectory(taskClaudeDir);
    if (taskExists || includeNonExistent) {
      directories.push({
        scope: ScopeLevel.Task,
        path: taskClaudeDir,
        exists: taskExists,
        isDefault: true,
      });
    }
  }

  // Project scope - check for .claude/ in current directory and parent directories
  const projectClaudeDir = findProjectClaudeDirectory(cwd);
  if (projectClaudeDir || includeNonExistent) {
    const projectPath = projectClaudeDir || join(cwd, '.claude');
    directories.push({
      scope: ScopeLevel.Project,
      path: projectPath,
      exists: projectClaudeDir !== null,
      isDefault: projectPath === join(cwd, '.claude'),
    });
  }

  // User scope - check for ~/.claude/
  const userClaudeDir = join(homeDir, '.claude');
  const userExists = existsSync(userClaudeDir) && isDirectory(userClaudeDir);
  if (userExists || includeNonExistent) {
    directories.push({
      scope: ScopeLevel.User,
      path: userClaudeDir,
      exists: userExists,
      isDefault: true,
    });
  }

  // System scope - not filesystem-based, but we include it for completeness
  // This would represent Anthropic's built-in defaults
  if (includeNonExistent) {
    directories.push({
      scope: ScopeLevel.System,
      path: '<system>', // Sentinel value for system defaults
      exists: true, // System scope always "exists" as defaults
      isDefault: true,
    });
  }

  return {
    directories,
    workingDirectory: cwd,
    homeDirectory: homeDir,
  };
}

/**
 * Find the nearest .claude/ directory by walking up the directory tree
 *
 * @param startPath - Directory to start searching from
 * @returns Absolute path to .claude/ directory, or null if not found
 */
export function findProjectClaudeDirectory(startPath: string): string | null {
  let currentPath = resolve(startPath);
  const root = resolve('/');

  while (true) {
    const claudeDir = join(currentPath, '.claude');
    if (existsSync(claudeDir) && isDirectory(claudeDir)) {
      return claudeDir;
    }

    // Stop at filesystem root
    if (currentPath === root) {
      break;
    }

    // Move up one directory
    const parentPath = resolve(currentPath, '..');
    if (parentPath === currentPath) {
      // Reached root (safety check for Windows)
      break;
    }
    currentPath = parentPath;
  }

  return null;
}

/**
 * Get the .claude/ directory for a specific scope
 *
 * @param scope - The scope level to get directory for
 * @param options - Scan options
 * @returns Claude directory info, or null if not found
 */
export function getClaudeDirectoryForScope(
  scope: ScopeLevel,
  options: ScanOptions = {}
): ClaudeDirectory | null {
  const result = scanForClaudeDirectories(options);
  return result.directories.find((d) => d.scope === scope) || null;
}

/**
 * Check if a path is a directory
 */
function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Discover layer directories within a .claude/ directory
 *
 * @param claudeDir - Path to the .claude/ directory
 * @returns Map of layer names to their paths
 *
 * @example
 * ```typescript
 * const layers = discoverLayers('/path/to/.claude');
 * console.log(layers.rules); // '/path/to/.claude/rules'
 * ```
 */
export interface LayerDirectories {
  rules?: string;
  tools?: string;
  methods?: string;
  knowledge?: string;
  goals?: string;
}

export function discoverLayers(claudeDir: string): LayerDirectories {
  const layers: LayerDirectories = {};
  const layerNames = ['rules', 'tools', 'methods', 'knowledge', 'goals'] as const;

  for (const layerName of layerNames) {
    // Check for directory first (full structure)
    const layerDirPath = join(claudeDir, layerName);
    if (existsSync(layerDirPath) && isDirectory(layerDirPath)) {
      layers[layerName] = layerDirPath;
      continue;
    }

    // Check for .md file (minimal structure)
    const layerFilePath = join(claudeDir, `${layerName}.md`);
    if (existsSync(layerFilePath) && !isDirectory(layerFilePath)) {
      layers[layerName] = layerFilePath;
    }
  }

  return layers;
}

/**
 * Check if a directory looks like a valid .claude/ structure
 *
 * @param path - Path to check
 * @returns True if directory has at least one layer subdirectory
 */
export function isValidClaudeDirectory(path: string): boolean {
  if (!existsSync(path) || !isDirectory(path)) {
    return false;
  }

  const layers = discoverLayers(path);
  return Object.keys(layers).length > 0;
}

/**
 * Get all .claude/ directories that exist and are valid
 *
 * @param options - Scan options
 * @returns Array of valid claude directories
 */
export function getValidClaudeDirectories(
  options: ScanOptions = {}
): ClaudeDirectory[] {
  const result = scanForClaudeDirectories(options);
  return result.directories.filter(
    (d) => d.exists && d.scope !== ScopeLevel.System && isValidClaudeDirectory(d.path)
  );
}

// ============================================================================
// Universal Configuration Source Scanner
// ============================================================================

import { readdirSync, readFileSync } from 'fs';
import type {
  ConfigSources,
  UniversalScanResult,
  SkillManifest,
  CommandDefinition,
  HookConfig,
  MCPConfig,
  UserMemoryFile,
  SettingsJson,
} from './types/sources.js';

/**
 * Universal configuration scanner that finds ALL config sources
 * across the entire Claude Code ecosystem.
 *
 * This includes:
 * - Legacy files (CLAUDE.md, AGENTS.md)
 * - MCP configuration (~/.claude.json, .mcp.json)
 * - Settings files (settings.json with hooks)
 * - Skills (.claude/skills/*)
 * - Commands (.claude/commands/*)
 * - User memory (~/.claude/memory/*)
 * - New layered structure (.claude/rules/, etc.)
 *
 * @param options - Scan options
 * @returns Complete scan result with all discovered sources
 */
export function scanAllConfigSources(
  options: ScanOptions = {}
): UniversalScanResult {
  const cwd = options.cwd ? resolve(options.cwd) : process.cwd();
  const homeDir = options.homeDir || homedir();

  const sources: ConfigSources = {
    scope: ScopeLevel.Project, // Primary scope

    // User level
    userMcpConfig: null,
    userSettings: null,
    userMemory: [],
    userClaude: null,

    // Project level
    projectClaude: null,
    projectAgents: null,
    projectSettings: null,
    projectSkills: [],
    projectCommands: [],
    projectHooks: [],
    projectMcp: null,

    // New structure
    newStructure: null,
  };

  const existing = {
    userLevel: [] as string[],
    projectLevel: [] as string[],
    newStructure: [] as string[],
  };

  // ========== USER LEVEL (~/.claude/) ==========
  const userClaudeDir = join(homeDir, '.claude');
  if (existsSync(userClaudeDir)) {
    // ~/.claude.json (global MCP config)
    const userMcpPath = join(homeDir, '.claude.json');
    if (existsSync(userMcpPath)) {
      sources.userMcpConfig = userMcpPath;
      existing.userLevel.push(userMcpPath);
    }

    // ~/.claude/settings.json
    const userSettingsPath = join(userClaudeDir, 'settings.json');
    if (existsSync(userSettingsPath)) {
      sources.userSettings = userSettingsPath;
      existing.userLevel.push(userSettingsPath);
    }

    // ~/.claude/CLAUDE.md
    const userClaudeMd = join(userClaudeDir, 'CLAUDE.md');
    if (existsSync(userClaudeMd)) {
      sources.userClaude = userClaudeMd;
      existing.userLevel.push(userClaudeMd);
    }

    // ~/.claude/memory/*.md
    const userMemoryDir = join(userClaudeDir, 'memory');
    if (existsSync(userMemoryDir) && isDirectory(userMemoryDir)) {
      sources.userMemory = scanMemoryDirectory(userMemoryDir);
      existing.userLevel.push(...sources.userMemory.map(m => m.path));
    }
  }

  // ========== PROJECT LEVEL ==========

  // Find project root (where .claude/ is)
  const projectClaudeDir = findProjectClaudeDirectory(cwd);
  const projectRoot = projectClaudeDir ? resolve(projectClaudeDir, '..') : cwd;

  // ./CLAUDE.md (root level)
  const rootClaudeMd = join(projectRoot, 'CLAUDE.md');
  if (existsSync(rootClaudeMd)) {
    sources.projectClaude = rootClaudeMd;
    existing.projectLevel.push(rootClaudeMd);
  }

  // ./.claude/CLAUDE.md (inside .claude/)
  if (projectClaudeDir) {
    const claudeDirClaudeMd = join(projectClaudeDir, 'CLAUDE.md');
    if (existsSync(claudeDirClaudeMd)) {
      if (!sources.projectClaude) {
        sources.projectClaude = claudeDirClaudeMd;
      }
      existing.projectLevel.push(claudeDirClaudeMd);
    }
  }

  // ./AGENTS.md
  const agentsMd = join(projectRoot, 'AGENTS.md');
  if (existsSync(agentsMd)) {
    sources.projectAgents = agentsMd;
    existing.projectLevel.push(agentsMd);
  }

  if (projectClaudeDir) {
    // ./.claude/settings.json
    const projectSettingsPath = join(projectClaudeDir, 'settings.json');
    if (existsSync(projectSettingsPath)) {
      sources.projectSettings = projectSettingsPath;
      existing.projectLevel.push(projectSettingsPath);

      // Extract hooks from settings
      sources.projectHooks = extractHooksFromSettings(projectSettingsPath);
    }

    // ./.claude/skills/
    const skillsDir = join(projectClaudeDir, 'skills');
    if (existsSync(skillsDir) && isDirectory(skillsDir)) {
      sources.projectSkills = scanSkillsDirectory(skillsDir);
      existing.projectLevel.push(...sources.projectSkills.map(s => s.path));
    }

    // ./.claude/commands/
    const commandsDir = join(projectClaudeDir, 'commands');
    if (existsSync(commandsDir) && isDirectory(commandsDir)) {
      sources.projectCommands = scanCommandsDirectory(commandsDir);
      existing.projectLevel.push(...sources.projectCommands.map(c => c.path));
    }

    // Check for new layered structure
    const layers = discoverLayers(projectClaudeDir);
    if (Object.keys(layers).length > 0) {
      sources.newStructure = {
        rules: layers.rules ? [layers.rules] : [],
        tools: layers.tools ? [layers.tools] : [],
        methods: layers.methods ? [layers.methods] : [],
        knowledge: layers.knowledge ? [layers.knowledge] : [],
        goals: layers.goals ? [layers.goals] : [],
      };
      existing.newStructure = Object.values(layers).filter(Boolean) as string[];
    }
  }

  // ./.mcp.json (project MCP config)
  const projectMcpPath = join(projectRoot, '.mcp.json');
  if (existsSync(projectMcpPath)) {
    sources.projectMcp = parseMCPConfig(projectMcpPath);
    existing.projectLevel.push(projectMcpPath);
  }

  // Detect fragmentation
  const fragmentation = detectFragmentation(sources);

  return {
    sources,
    existing,
    workingDirectory: cwd,
    homeDirectory: homeDir,
    fragmentation,
  };
}

/**
 * Scan a memory directory for .md files
 */
function scanMemoryDirectory(memoryDir: string): UserMemoryFile[] {
  const files: UserMemoryFile[] = [];

  try {
    const entries = readdirSync(memoryDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const path = join(memoryDir, entry.name);
        try {
          const content = readFileSync(path, 'utf-8');
          files.push({
            name: entry.name,
            path,
            content,
            category: extractCategoryFromFilename(entry.name),
          });
        } catch {
          // Skip unreadable files
        }
      }
    }
  } catch {
    // Directory not readable
  }

  return files;
}

/**
 * Scan skills directory for SKILL.md files
 */
function scanSkillsDirectory(skillsDir: string): SkillManifest[] {
  const skills: SkillManifest[] = [];

  try {
    const entries = readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = join(skillsDir, entry.name, 'SKILL.md');
        if (existsSync(skillPath)) {
          const skill = parseSkillManifest(skillPath, entry.name);
          if (skill) {
            skills.push(skill);
          }
        }
      }
    }
  } catch {
    // Directory not readable
  }

  return skills;
}

/**
 * Scan commands directory for *.md files
 */
function scanCommandsDirectory(commandsDir: string): CommandDefinition[] {
  const commands: CommandDefinition[] = [];

  try {
    const entries = readdirSync(commandsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const cmdPath = join(commandsDir, entry.name);
        const command = parseCommandDefinition(cmdPath);
        if (command) {
          commands.push(command);
        }
      }
    }
  } catch {
    // Directory not readable
  }

  return commands;
}

/**
 * Extract hooks configuration from settings.json
 */
function extractHooksFromSettings(settingsPath: string): HookConfig[] {
  const hooks: HookConfig[] = [];

  try {
    const content = readFileSync(settingsPath, 'utf-8');
    const settings: SettingsJson = JSON.parse(content);

    if (settings.hooks) {
      for (const [hookName, config] of Object.entries(settings.hooks)) {
        hooks.push({
          ...config,
          name: hookName,
        });
      }
    }
  } catch {
    // Failed to parse
  }

  return hooks;
}

/**
 * Parse MCP configuration file
 */
function parseMCPConfig(mcpPath: string): MCPConfig[] | null {
  try {
    const content = readFileSync(mcpPath, 'utf-8');
    const config = JSON.parse(content);

    // Handle different MCP config formats
    if (config.mcpServers) {
      return Object.entries(config.mcpServers).map(([name, cfg]: [string, any]) => ({
        name,
        command: cfg.command,
        args: cfg.args,
        env: cfg.env,
        url: cfg.url,
      }));
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse a skill manifest from SKILL.md
 */
function parseSkillManifest(
  skillPath: string,
  skillId: string
): SkillManifest | null {
  try {
    const content = readFileSync(skillPath, 'utf-8');

    // Extract skill name and description from frontmatter or first heading
    const nameMatch = content.match(/^#\s+(.+)$/m);
    const descMatch = content.match(/^>\s+(.+)$/m);

    return {
      id: skillId,
      name: nameMatch ? nameMatch[1] : skillId,
      description: descMatch ? descMatch[1] : '',
      path: skillPath,
      workflows: extractWorkflowsList(skillPath),
      references: extractReferencesList(skillPath),
    };
  } catch {
    return null;
  }
}

/**
 * Parse a command definition from .md file
 */
function parseCommandDefinition(cmdPath: string): CommandDefinition | null {
  try {
    const content = readFileSync(cmdPath, 'utf-8');
    const basename = cmdPath.split('/').pop()?.replace('.md', '') || '';

    const nameMatch = content.match(/^#\s+\/(.+)$/m);
    const descMatch = content.match(/^>\s+(.+)$/m);

    return {
      name: nameMatch ? nameMatch[1] : basename,
      description: descMatch ? descMatch[1] : '',
      path: cmdPath,
    };
  } catch {
    return null;
  }
}

/**
 * Extract category from memory filename
 */
function extractCategoryFromFilename(filename: string): string {
  const name = filename.replace('.md', '');
  const parts = name.split('-');
  return parts[0] || 'general';
}

/**
 * Extract list of workflows from skill directory
 */
function extractWorkflowsList(skillPath: string): string[] {
  const skillDir = resolve(skillPath, '..');
  const workflowsDir = join(skillDir, 'workflows');

  if (!existsSync(workflowsDir) || !isDirectory(workflowsDir)) {
    return [];
  }

  try {
    return readdirSync(workflowsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
  } catch {
    return [];
  }
}

/**
 * Extract list of references from skill directory
 */
function extractReferencesList(skillPath: string): string[] {
  const skillDir = resolve(skillPath, '..');
  const refsDir = join(skillDir, 'references');

  if (!existsSync(refsDir) || !isDirectory(refsDir)) {
    return [];
  }

  try {
    return readdirSync(refsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
  } catch {
    return [];
  }
}

/**
 * Detect configuration fragmentation and conflicts
 *
 * IMPORTANT: User-level config is READ-ONLY context, not fragmentation.
 * Only flag duplicates WITHIN project scope. User vs project is normal precedence.
 */
function detectFragmentation(sources: ConfigSources): {
  duplicates: Array<{ item: string; sources: string[] }>;
  legacy: string[];
} {
  const duplicates: Array<{ item: string; sources: string[] }> = [];
  const legacy: string[] = [];

  // ONLY flag PROJECT-level legacy files (user config is read-only context)
  if (sources.projectClaude) {
    legacy.push(sources.projectClaude);
  }

  // Check for AGENTS.md (always legacy if new structure exists)
  if (sources.projectAgents) {
    legacy.push(sources.projectAgents);
    if (sources.newStructure) {
      duplicates.push({
        item: 'Agent definitions',
        sources: [sources.projectAgents, '.claude/methods/ (new structure)'],
      });
    }
  }

  // User vs project MCP is normal precedence, NOT duplication
  // Only flag if there are multiple definitions WITHIN project scope
  // (This would be rare - e.g., .mcp.json AND settings.json both defining MCP)

  return { duplicates, legacy };
}
