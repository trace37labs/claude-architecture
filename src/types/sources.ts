/**
 * Configuration Source Types
 *
 * Defines all possible configuration sources in the Claude Code ecosystem.
 * This enables the universal scanner to discover and parse all config locations.
 */

import { ScopeLevel } from './scope.js';

/**
 * Skill manifest from .claude/skills/[star]/SKILL.md
 */
export interface SkillManifest {
  /** Skill identifier */
  id: string;
  /** Skill name */
  name: string;
  /** Skill description */
  description: string;
  /** Path to SKILL.md */
  path: string;
  /** Workflow definitions */
  workflows?: string[];
  /** Reference documents */
  references?: string[];
  /** Commands provided by this skill */
  commands?: string[];
}

/**
 * Slash command definition from .claude/commands/*.md
 */
export interface CommandDefinition {
  /** Command name (without /) */
  name: string;
  /** Command description */
  description: string;
  /** Path to command definition file */
  path: string;
  /** Command syntax/usage */
  usage?: string;
  /** Examples */
  examples?: string[];
}

/**
 * Hook configuration from settings.json
 */
export interface HookConfig {
  /** Hook name (e.g., pre-commit, post-task) */
  name: string;
  /** Hook type */
  type: 'pre' | 'post';
  /** Command to execute */
  command: string;
  /** Working directory */
  cwd?: string;
  /** Whether hook is enabled */
  enabled: boolean;
}

/**
 * MCP server configuration from ~/.claude.json or .mcp.json
 */
export interface MCPConfig {
  /** Server name */
  name: string;
  /** Server command */
  command: string;
  /** Server arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Server URL (if remote) */
  url?: string;
}

/**
 * Settings.json structure
 */
export interface SettingsJson {
  /** Hooks configuration */
  hooks?: {
    [hookName: string]: HookConfig;
  };
  /** Permission overrides */
  permissions?: {
    bash?: string[];
    files?: string[];
  };
  /** MCP configuration (if embedded) */
  mcp?: {
    servers?: MCPConfig[];
  };
  /** Other settings */
  [key: string]: any;
}

/**
 * User memory file from ~/.claude/memory/*.md
 */
export interface UserMemoryFile {
  /** File name */
  name: string;
  /** Full path */
  path: string;
  /** File content */
  content: string;
  /** Detected topic/category */
  category?: string;
}

/**
 * Complete set of configuration sources discovered
 */
export interface ConfigSources {
  /** Scope level these sources belong to */
  scope: ScopeLevel;

  // User level (~/.claude/)
  /** ~/.claude.json - Global MCP servers */
  userMcpConfig: string | null;
  /** ~/.claude/settings.json - User preferences */
  userSettings: string | null;
  /** ~/.claude/memory/*.md - User memory files */
  userMemory: UserMemoryFile[];
  /** ~/.claude/CLAUDE.md - User instructions */
  userClaude: string | null;

  // Project level
  /** ./CLAUDE.md or ./.claude/CLAUDE.md - Project instructions */
  projectClaude: string | null;
  /** ./AGENTS.md - Agent definitions */
  projectAgents: string | null;
  /** ./.claude/settings.json - Project settings */
  projectSettings: string | null;
  /** ./.claude/skills/[star]/SKILL.md - Skill packages */
  projectSkills: SkillManifest[];
  /** ./.claude/commands/[star].md - Slash commands */
  projectCommands: CommandDefinition[];
  /** ./.claude/settings.json hooks - Lifecycle hooks */
  projectHooks: HookConfig[];
  /** ./.mcp.json or settings.mcp - Project MCP */
  projectMcp: MCPConfig[] | null;

  // The new layered structure (if exists)
  /** .claude/rules/, .claude/tools/, etc. */
  newStructure: {
    rules: string[];
    tools: string[];
    methods: string[];
    knowledge: string[];
    goals: string[];
  } | null;
}

/**
 * Result of universal configuration scan
 */
export interface UniversalScanResult {
  /** All discovered configuration sources */
  sources: ConfigSources;
  /** Which sources exist and are readable */
  existing: {
    userLevel: string[];
    projectLevel: string[];
    newStructure: string[];
  };
  /** Working directory */
  workingDirectory: string;
  /** User home directory */
  homeDirectory: string;
  /** Detected fragmentation issues */
  fragmentation: {
    /** Multiple sources defining the same thing */
    duplicates: Array<{
      item: string;
      sources: string[];
    }>;
    /** Legacy files that could be migrated */
    legacy: string[];
  };
}

/**
 * Source file with metadata
 */
export interface SourceFile {
  /** File path */
  path: string;
  /** Source type */
  type: 'mcp' | 'settings' | 'skill' | 'command' | 'memory' | 'legacy' | 'layer';
  /** Scope level */
  scope: ScopeLevel;
  /** Whether file exists and is readable */
  exists: boolean;
  /** File size in bytes */
  size?: number;
  /** Last modified timestamp */
  modified?: Date;
}
