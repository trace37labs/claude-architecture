/**
 * Migrate Command
 *
 * Converts existing CLAUDE.md and AGENTS.md files into the 5-layer .claude/ structure.
 * Supports both minimal (single files) and full (subdirectories) output formats.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { parseLegacyFiles } from '../parsers/legacy-parser.js';
import { scanAllConfigSources } from '../scanner.js';
import type { LayerContent } from '../types/layers.js';
import { LayerType } from '../types/layers.js';
import type {
  RulesLayer,
  ToolsLayer,
  MethodsLayer,
  KnowledgeLayer,
  GoalsLayer,
  MCPServerConfig,
} from '../types/layers.js';

export interface MigrateOptions {
  /** Source directory containing CLAUDE.md and/or AGENTS.md (default: current directory) */
  sourceDir?: string;
  /** Target directory for .claude/ output (default: same as source) */
  targetDir?: string;
  /** Create minimal structure (single files) instead of full structure */
  minimal?: boolean;
  /** Force overwrite if .claude/ already exists */
  force?: boolean;
  /** Dry run - show what would be created without creating */
  dryRun?: boolean;
  /** Backup original files before migration */
  backup?: boolean;
  /** Migrate all configuration sources (not just legacy files) */
  all?: boolean;
  /** Specific source to migrate: mcp, hooks, skills, memory */
  source?: 'mcp' | 'hooks' | 'skills' | 'memory';
}

export interface MigrationReport {
  /** Files that were successfully migrated */
  migrated: string[];
  /** Files that were not found */
  notFound: string[];
  /** Sections that could not be classified */
  unclassified: Array<{ heading: string; content: string }>;
  /** Files created in .claude/ */
  created: string[];
  /** Warnings encountered during migration */
  warnings: string[];
}

/**
 * Migrate existing CLAUDE.md/AGENTS.md to new structure
 */
export async function migrateCommand(options: MigrateOptions = {}): Promise<MigrationReport> {
  const sourceDir = options.sourceDir || process.cwd();
  const targetDir = options.targetDir || sourceDir;
  const claudeDir = path.join(targetDir, '.claude');

  const report: MigrationReport = {
    migrated: [],
    notFound: [],
    unclassified: [],
    created: [],
    warnings: [],
  };

  // If --all or --source specified, use universal migration
  if (options.all || options.source) {
    return migrateAllSources(options, report);
  }

  // Find legacy files in source directory
  const legacyFiles = await findLegacyFiles(sourceDir);

  if (legacyFiles.size === 0) {
    logger.warn('No CLAUDE.md or AGENTS.md files found in ' + sourceDir);
    return report;
  }

  // Check if .claude/ already exists and preserve important content
  let existingContent: Map<string, string> | undefined;
  try {
    await fs.access(claudeDir);
    if (!options.force) {
      throw new Error(
        `.claude/ directory already exists at ${claudeDir}\n` +
        'Use --force to overwrite'
      );
    }
    logger.warn('Overwriting existing .claude/ directory (preserving skills/ and *.local.* files)');
    // Preserve existing content before overwriting
    existingContent = await preserveExistingContent(claudeDir);
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  // Backup original files if requested
  if (options.backup && !options.dryRun) {
    await backupLegacyFiles(legacyFiles, sourceDir);
  }

  // Parse legacy files
  logger.info('Parsing legacy files...');
  const parseResult = parseLegacyFiles(legacyFiles);

  // Track what was found
  for (const filename of legacyFiles.keys()) {
    report.migrated.push(filename);
  }

  // Track unclassified sections
  report.unclassified = parseResult.unclassified.map((section) => ({
    heading: section.heading,
    content: section.content,
  }));

  if (report.unclassified.length > 0) {
    report.warnings.push(
      `Found ${report.unclassified.length} sections that could not be automatically classified`
    );
  }

  // Create .claude/ structure
  if (options.minimal) {
    await createMinimalMigration(claudeDir, parseResult.layers, report, options.dryRun);
  } else {
    await createFullMigration(claudeDir, parseResult.layers, report, options.dryRun);
  }

  // Restore preserved content
  if (existingContent && !options.dryRun) {
    await restorePreservedContent(claudeDir, existingContent, report);
  }

  // Log summary
  if (!options.dryRun) {
    logger.success(`Migrated ${report.migrated.length} file(s) to ${claudeDir}`);
    logger.info(`Created ${report.created.length} new file(s)`);

    if (report.unclassified.length > 0) {
      logger.warn(
        `${report.unclassified.length} section(s) could not be classified - review manually`
      );
    }

    if (report.warnings.length > 0) {
      logger.warn('Warnings:');
      report.warnings.forEach((w) => logger.warn(`  - ${w}`));
    }
  } else {
    logger.info('Dry run - no files created');
  }

  return report;
}

/**
 * Find CLAUDE.md and AGENTS.md files in a directory
 * Checks both root and .claude/ subdirectory
 */
async function findLegacyFiles(dir: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();

  const locations = [
    { dir: dir, name: 'CLAUDE.md' },
    { dir: dir, name: 'AGENTS.md' },
    { dir: path.join(dir, '.claude'), name: 'CLAUDE.md' },
    { dir: path.join(dir, '.claude'), name: 'AGENTS.md' },
  ];

  for (const { dir: searchDir, name: filename } of locations) {
    const filepath = path.join(searchDir, filename);
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      // Use a unique key for .claude/ files to avoid conflicts
      const key = searchDir.includes('.claude') ? `.claude/${filename}` : filename;
      if (!files.has(key)) {
        files.set(key, content);
        logger.debug(`Found ${filepath}`);
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      // File doesn't exist - not an error
    }
  }

  return files;
}

/**
 * Backup legacy files to .bak files
 */
async function backupLegacyFiles(files: Map<string, string>, dir: string): Promise<void> {
  logger.info('Backing up original files...');

  for (const filename of files.keys()) {
    const source = path.join(dir, filename);
    const backup = path.join(dir, `${filename}.bak`);

    try {
      await fs.copyFile(source, backup);
      logger.debug(`Backed up ${filename} to ${filename}.bak`);
    } catch (err) {
      logger.warn(`Failed to backup ${filename}: ${err}`);
    }
  }
}

/**
 * Preserve existing .claude/ content that should not be overwritten
 * - skills/ directory (imported packages)
 * - *.local.* files (local settings)
 */
async function preserveExistingContent(claudeDir: string): Promise<Map<string, string>> {
  const preserved = new Map<string, string>();

  // Preserve skills/ directory
  const skillsDir = path.join(claudeDir, 'skills');
  try {
    await fs.access(skillsDir);
    const skillFiles = await fs.readdir(skillsDir, { recursive: true, withFileTypes: true });
    for (const file of skillFiles) {
      if (file.isFile()) {
        const filepath = path.join(file.path, file.name);
        const relPath = path.relative(claudeDir, filepath);
        const content = await fs.readFile(filepath, 'utf-8');
        preserved.set(relPath, content);
        logger.debug(`Preserved ${relPath}`);
      }
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      logger.warn(`Could not preserve skills/: ${err}`);
    }
  }

  // Preserve *.local.* files
  try {
    const allFiles = await fs.readdir(claudeDir, { recursive: true, withFileTypes: true });
    for (const file of allFiles) {
      if (file.isFile() && /\.local\./.test(file.name)) {
        const filepath = path.join(file.path, file.name);
        const relPath = path.relative(claudeDir, filepath);
        const content = await fs.readFile(filepath, 'utf-8');
        preserved.set(relPath, content);
        logger.debug(`Preserved ${relPath}`);
      }
    }
  } catch (err: any) {
    logger.warn(`Could not preserve *.local.* files: ${err}`);
  }

  return preserved;
}

/**
 * Restore preserved content after migration
 */
async function restorePreservedContent(
  claudeDir: string,
  preserved: Map<string, string>,
  report: MigrationReport
): Promise<void> {
  if (preserved.size === 0) return;

  logger.info(`Restoring ${preserved.size} preserved file(s)...`);

  for (const [relPath, content] of preserved.entries()) {
    const fullPath = path.join(claudeDir, relPath);
    const dir = path.dirname(fullPath);

    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
      logger.debug(`Restored ${relPath}`);
    } catch (err) {
      report.warnings.push(`Failed to restore ${relPath}: ${err}`);
    }
  }
}

/**
 * Create minimal migration (single files per layer)
 */
async function createMinimalMigration(
  claudeDir: string,
  layers: any,
  report: MigrationReport,
  dryRun?: boolean
): Promise<void> {
  const layerFiles = [
    { name: 'rules.md', layer: LayerType.Rules, content: layers.rules },
    { name: 'tools.md', layer: LayerType.Tools, content: layers.tools },
    { name: 'methods.md', layer: LayerType.Methods, content: layers.methods },
    { name: 'knowledge.md', layer: LayerType.Knowledge, content: layers.knowledge },
    { name: 'goals.md', layer: LayerType.Goals, content: layers.goals },
  ];

  if (dryRun) {
    logger.info('Would create minimal structure:');
    logger.info(`.claude/`);
    layerFiles.forEach((f) => logger.info(`  ├── ${f.name}`));
    report.created = layerFiles.map((f) => f.name);
    return;
  }

  await fs.mkdir(claudeDir, { recursive: true });

  for (const { name, layer, content } of layerFiles) {
    const filepath = path.join(claudeDir, name);
    const fileContent = formatLayerContent(layer, content);

    await fs.writeFile(filepath, fileContent, 'utf-8');
    report.created.push(name);
    logger.debug(`Created ${name}`);
  }
}

/**
 * Create full migration (subdirectories per layer)
 */
async function createFullMigration(
  claudeDir: string,
  layers: any,
  report: MigrationReport,
  dryRun?: boolean
): Promise<void> {
  const structure = [
    // Rules layer
    {
      path: 'rules/security.md',
      content: extractSecurityRules(layers.rules),
    },
    {
      path: 'rules/code-standards.md',
      content: extractCodeStandards(layers.rules),
    },
    {
      path: 'rules/process.md',
      content: extractProcessRules(layers.rules),
    },

    // Tools layer
    {
      path: 'tools/mcp.yaml',
      content: extractMCPTools(layers.tools),
    },
    {
      path: 'tools/commands/README.md',
      content: extractCommands(layers.tools),
    },

    // Methods layer
    {
      path: 'methods/workflows/README.md',
      content: extractWorkflows(layers.methods),
    },
    {
      path: 'methods/patterns/README.md',
      content: extractPatterns(layers.methods),
    },

    // Knowledge layer
    {
      path: 'knowledge/overview.md',
      content: extractOverview(layers.knowledge),
    },
    {
      path: 'knowledge/architecture.md',
      content: extractArchitecture(layers.knowledge),
    },

    // Goals layer
    {
      path: 'goals/current.md',
      content: extractCurrentGoals(layers.goals),
    },
    {
      path: 'goals/backlog.md',
      content: extractBacklog(layers.goals),
    },
  ];

  if (dryRun) {
    logger.info('Would create full structure:');
    logger.info(`.claude/`);

    // Build a proper tree structure
    interface TreeNode {
      name: string;
      children: Map<string, TreeNode>;
      files: string[];
    }

    const root: TreeNode = { name: '.claude', children: new Map(), files: [] };

    // Build tree from paths
    structure.forEach((f) => {
      const parts = f.path.split('/');
      let current = root;

      // Navigate/create directory structure
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current.children.has(part)) {
          current.children.set(part, { name: part, children: new Map(), files: [] });
        }
        current = current.children.get(part)!;
      }

      // Add file to leaf directory
      current.files.push(parts[parts.length - 1]);
    });

    // Display tree recursively
    // Canonical layer order: rules → tools → methods → knowledge → goals
    const LAYER_ORDER = ['rules', 'tools', 'methods', 'knowledge', 'goals'];

    function displayTree(node: TreeNode, prefix: string = '  ') {
      // Display directories in canonical layer order (non-layers sorted alphabetically after)
      const dirs = Array.from(node.children.entries()).sort(([a], [b]) => {
        const aIdx = LAYER_ORDER.indexOf(a);
        const bIdx = LAYER_ORDER.indexOf(b);
        // Both are layers - sort by layer order
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        // Only a is a layer - it comes first
        if (aIdx !== -1) return -1;
        // Only b is a layer - it comes first
        if (bIdx !== -1) return 1;
        // Neither are layers - alphabetical
        return a.localeCompare(b);
      });
      dirs.forEach(([name, child], idx) => {
        const isLastDir = idx === dirs.length - 1 && node.files.length === 0;
        const branch = isLastDir ? '└──' : '├──';
        logger.info(`${prefix}${branch} ${name}/`);

        const newPrefix = prefix + (isLastDir ? '    ' : '│   ');
        displayTree(child, newPrefix);
      });

      // Display files
      node.files.sort().forEach((file, idx) => {
        const isLastFile = idx === node.files.length - 1;
        const branch = isLastFile ? '└──' : '├──';
        logger.info(`${prefix}${branch} ${file}`);
      });
    }

    displayTree(root);

    report.created = structure.map((f) => f.path);
    return;
  }

  // Create all directories first
  const dirs = new Set<string>();
  structure.forEach((f) => {
    const dir = path.dirname(path.join(claudeDir, f.path));
    dirs.add(dir);
  });

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  // Create all files
  for (const { path: filepath, content } of structure) {
    const fullPath = path.join(claudeDir, filepath);
    await fs.writeFile(fullPath, content, 'utf-8');
    report.created.push(filepath);
    logger.debug(`Created ${filepath}`);
  }
}

/**
 * Format layer content into markdown
 */
function formatLayerContent(layerType: LayerType, content: LayerContent | undefined): string {
  if (!content) {
    return getEmptyLayerTemplate(layerType);
  }

  const sections: string[] = [];

  // Add main heading
  sections.push(`# ${layerType.charAt(0).toUpperCase() + layerType.slice(1)}`);
  sections.push('');

  // Add raw content if present
  if (content.rawContent) {
    sections.push(content.rawContent);
    sections.push('');
  }

  // Add layer-specific structured content
  switch (layerType) {
    case LayerType.Rules: {
      const rulesContent = content as RulesLayer;
      if (rulesContent.forbidden && rulesContent.forbidden.length > 0) {
        sections.push('## Forbidden Actions');
        rulesContent.forbidden.forEach((item: string) => sections.push(`- ${item}`));
        sections.push('');
      }
      if (rulesContent.required && rulesContent.required.length > 0) {
        sections.push('## Required Actions');
        rulesContent.required.forEach((item: string) => sections.push(`- ${item}`));
        sections.push('');
      }
      if (rulesContent.security && rulesContent.security.length > 0) {
        sections.push('## Security');
        rulesContent.security.forEach((item: string) => sections.push(`- ${item}`));
        sections.push('');
      }
      break;
    }

    case LayerType.Tools: {
      const toolsContent = content as ToolsLayer;
      if (toolsContent.mcpServers && toolsContent.mcpServers.length > 0) {
        sections.push('## MCP Servers');
        toolsContent.mcpServers.forEach((server: MCPServerConfig) => {
          sections.push(`### ${server.name}`);
          sections.push(`- Command: ${server.command}`);
          if (server.args) {
            sections.push(`- Args: ${server.args.join(' ')}`);
          }
          sections.push('');
        });
      }
      break;
    }

    case LayerType.Methods: {
      const methodsContent = content as MethodsLayer;
      if (methodsContent.workflows) {
        sections.push('## Workflows');
        for (const [name, workflow] of Object.entries(methodsContent.workflows)) {
          sections.push(`### ${name}`);
          sections.push(JSON.stringify(workflow, null, 2));
          sections.push('');
        }
      }
      if (methodsContent.bestPractices && methodsContent.bestPractices.length > 0) {
        sections.push('## Best Practices');
        methodsContent.bestPractices.forEach((item: string) => sections.push(`- ${item}`));
        sections.push('');
      }
      break;
    }

    case LayerType.Knowledge: {
      const knowledgeContent = content as KnowledgeLayer;
      if (knowledgeContent.overview) {
        sections.push('## Overview');
        sections.push(knowledgeContent.overview);
        sections.push('');
      }
      if (knowledgeContent.architecture) {
        sections.push('## Architecture');
        sections.push(knowledgeContent.architecture);
        sections.push('');
      }
      break;
    }

    case LayerType.Goals: {
      const goalsContent = content as GoalsLayer;
      if (goalsContent.current) {
        sections.push('## Current Goal');
        sections.push(goalsContent.current);
        sections.push('');
      }
      if (goalsContent.priorities && goalsContent.priorities.length > 0) {
        sections.push('## Priorities');
        goalsContent.priorities.forEach((item: string) => sections.push(`- ${item}`));
        sections.push('');
      }
      break;
    }
  }

  sections.push('---');
  sections.push('');
  sections.push(`*Migrated from legacy CLAUDE.md/AGENTS.md*`);

  return sections.join('\n');
}

/**
 * Get empty template for a layer
 */
function getEmptyLayerTemplate(layerType: LayerType): string {
  return `# ${layerType.charAt(0).toUpperCase() + layerType.slice(1)}

No content was found for this layer during migration.

---

*Migrated from legacy CLAUDE.md/AGENTS.md*
`;
}

// Extraction functions for full structure

function extractSecurityRules(rules: LayerContent | undefined): string {
  if (!rules) return '# Security Rules\n\nNo security rules found during migration.\n';

  const sections: string[] = ['# Security Rules', ''];
  const rulesContent = rules as RulesLayer;

  if (rulesContent.security && rulesContent.security.length > 0) {
    sections.push('## Security Requirements');
    rulesContent.security.forEach((item: string) => sections.push(`- ${item}`));
    sections.push('');
  }

  if (rules.rawContent) {
    const securityContent = extractSectionByKeyword(rules.rawContent, /security|auth/i);
    if (securityContent) {
      sections.push(securityContent);
      sections.push('');
    }
  }

  sections.push('---');
  sections.push('*Migrated from legacy configuration*');

  return sections.join('\n');
}

function extractCodeStandards(rules: LayerContent | undefined): string {
  if (!rules) return '# Code Standards\n\nNo code standards found during migration.\n';

  const sections: string[] = ['# Code Standards', ''];

  if (rules.rawContent) {
    const standardsContent = extractSectionByKeyword(rules.rawContent, /code|standard|style/i);
    if (standardsContent) {
      sections.push(standardsContent);
      sections.push('');
    }
  }

  sections.push('---');
  sections.push('*Migrated from legacy configuration*');

  return sections.join('\n');
}

function extractProcessRules(rules: LayerContent | undefined): string {
  if (!rules) return '# Process Rules\n\nNo process rules found during migration.\n';

  const sections: string[] = ['# Process Rules', ''];
  const rulesContent = rules as RulesLayer;

  if (rulesContent.required && rulesContent.required.length > 0) {
    sections.push('## Required Processes');
    rulesContent.required.forEach((item: string) => sections.push(`- ${item}`));
    sections.push('');
  }

  if (rules.rawContent) {
    const processContent = extractSectionByKeyword(rules.rawContent, /process|workflow|review/i);
    if (processContent) {
      sections.push(processContent);
      sections.push('');
    }
  }

  sections.push('---');
  sections.push('*Migrated from legacy configuration*');

  return sections.join('\n');
}

function extractMCPTools(tools: LayerContent | undefined): string {
  const toolsContent = tools as ToolsLayer | undefined;
  if (!toolsContent || !toolsContent.mcpServers || toolsContent.mcpServers.length === 0) {
    return `# MCP Servers Configuration

# No MCP servers found during migration
# Uncomment and configure as needed

# servers:
#   example:
#     command: npx
#     args: [-y, @modelcontextprotocol/server-example]
`;
  }

  const sections: string[] = ['# MCP Servers Configuration', '', 'servers:'];

  toolsContent.mcpServers.forEach((server: MCPServerConfig) => {
    sections.push(`  ${server.name}:`);
    sections.push(`    command: ${server.command}`);
    if (server.args) {
      sections.push(`    args: [${server.args.map((a: string) => `'${a}'`).join(', ')}]`);
    }
  });

  return sections.join('\n');
}

function extractCommands(tools: LayerContent | undefined): string {
  if (!tools) return '# Custom Commands\n\nNo commands found during migration.\n';

  const sections: string[] = ['# Custom Commands', ''];

  if (tools.rawContent) {
    sections.push(tools.rawContent);
    sections.push('');
  }

  sections.push('---');
  sections.push('*Migrated from legacy configuration*');

  return sections.join('\n');
}

function extractWorkflows(methods: LayerContent | undefined): string {
  if (!methods) return '# Workflows\n\nNo workflows found during migration.\n';

  const sections: string[] = ['# Workflows', ''];
  const methodsContent = methods as MethodsLayer;

  if (methodsContent.workflows) {
    for (const [name, workflow] of Object.entries(methodsContent.workflows)) {
      sections.push(`## ${name}`);
      sections.push(JSON.stringify(workflow, null, 2));
      sections.push('');
    }
  }

  if (methods.rawContent) {
    const workflowContent = extractSectionByKeyword(methods.rawContent, /workflow|process/i);
    if (workflowContent) {
      sections.push(workflowContent);
      sections.push('');
    }
  }

  sections.push('---');
  sections.push('*Migrated from legacy configuration*');

  return sections.join('\n');
}

function extractPatterns(methods: LayerContent | undefined): string {
  if (!methods) return '# Patterns\n\nNo patterns found during migration.\n';

  const sections: string[] = ['# Patterns', ''];
  const methodsContent = methods as MethodsLayer;

  if (methodsContent.bestPractices && methodsContent.bestPractices.length > 0) {
    sections.push('## Best Practices');
    methodsContent.bestPractices.forEach((item: string) => sections.push(`- ${item}`));
    sections.push('');
  }

  if (methods.rawContent) {
    const patternContent = extractSectionByKeyword(methods.rawContent, /pattern|practice/i);
    if (patternContent) {
      sections.push(patternContent);
      sections.push('');
    }
  }

  sections.push('---');
  sections.push('*Migrated from legacy configuration*');

  return sections.join('\n');
}

function extractOverview(knowledge: LayerContent | undefined): string {
  if (!knowledge) return '# Project Overview\n\nNo overview found during migration.\n';

  const sections: string[] = ['# Project Overview', ''];
  const knowledgeContent = knowledge as KnowledgeLayer;

  if (knowledgeContent.overview) {
    sections.push(knowledgeContent.overview);
    sections.push('');
  }

  if (knowledge.rawContent) {
    const overviewContent = extractSectionByKeyword(knowledge.rawContent, /overview|introduction/i);
    if (overviewContent) {
      sections.push(overviewContent);
      sections.push('');
    }
  }

  sections.push('---');
  sections.push('*Migrated from legacy configuration*');

  return sections.join('\n');
}

function extractArchitecture(knowledge: LayerContent | undefined): string {
  if (!knowledge) return '# Architecture\n\nNo architecture information found during migration.\n';

  const sections: string[] = ['# Architecture', ''];
  const knowledgeContent = knowledge as KnowledgeLayer;

  if (knowledgeContent.architecture) {
    sections.push(knowledgeContent.architecture);
    sections.push('');
  }

  if (knowledge.rawContent) {
    const archContent = extractSectionByKeyword(knowledge.rawContent, /architecture|design|structure/i);
    if (archContent) {
      sections.push(archContent);
      sections.push('');
    }
  }

  sections.push('---');
  sections.push('*Migrated from legacy configuration*');

  return sections.join('\n');
}

function extractCurrentGoals(goals: LayerContent | undefined): string {
  if (!goals) return '# Current Goals\n\nNo current goals found during migration.\n';

  const sections: string[] = ['# Current Goals', ''];
  const goalsContent = goals as GoalsLayer;

  if (goalsContent.current) {
    sections.push(goalsContent.current);
    sections.push('');
  }

  if (goalsContent.priorities && goalsContent.priorities.length > 0) {
    sections.push('## Priorities');
    goalsContent.priorities.forEach((item: string) => sections.push(`- ${item}`));
    sections.push('');
  }

  if (goals.rawContent) {
    const currentContent = extractSectionByKeyword(goals.rawContent, /current|now|today/i);
    if (currentContent) {
      sections.push(currentContent);
      sections.push('');
    }
  }

  sections.push('---');
  sections.push('*Migrated from legacy configuration*');

  return sections.join('\n');
}

function extractBacklog(goals: LayerContent | undefined): string {
  if (!goals) return '# Backlog\n\nNo backlog found during migration.\n';

  const sections: string[] = ['# Backlog', ''];

  if (goals.rawContent) {
    const backlogContent = extractSectionByKeyword(goals.rawContent, /backlog|future|upcoming/i);
    if (backlogContent) {
      sections.push(backlogContent);
      sections.push('');
    }
  }

  sections.push('---');
  sections.push('*Migrated from legacy configuration*');

  return sections.join('\n');
}

/**
 * Extract a section from content matching a keyword pattern
 */
function extractSectionByKeyword(content: string, pattern: RegExp): string | null {
  const lines = content.split('\n');
  const matchingLines: string[] = [];
  let inMatchingSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line starts a matching section
    if (pattern.test(line)) {
      inMatchingSection = true;
    }

    // If we're in a matching section, collect lines
    if (inMatchingSection) {
      matchingLines.push(line);

      // Check if we've hit the next major section
      if (i > 0 && /^#+ /.test(lines[i]) && !pattern.test(line)) {
        break;
      }
    }
  }

  return matchingLines.length > 0 ? matchingLines.join('\n') : null;
}

/**
 * Migrate ALL configuration sources to new layered structure
 */
async function migrateAllSources(
  options: MigrateOptions,
  report: MigrationReport
): Promise<MigrationReport> {
  const sourceDir = options.sourceDir || process.cwd();
  const targetDir = options.targetDir || sourceDir;
  const claudeDir = path.join(targetDir, '.claude');

  logger.info('Scanning all configuration sources...');
  const scanResult = scanAllConfigSources({ cwd: sourceDir });
  const { sources } = scanResult;

  if (options.dryRun) {
    logger.info('Dry run - would migrate:');
  }

  // Migrate based on --source flag or all sources
  const sourcesToMigrate = options.source ? [options.source] : ['mcp', 'hooks', 'skills', 'memory'];

  for (const sourceType of sourcesToMigrate) {
    switch (sourceType) {
      case 'mcp':
        await migrateMCPConfig(sources, claudeDir, report, options);
        break;
      case 'hooks':
        await migrateHooks(sources, claudeDir, report, options);
        break;
      case 'skills':
        await migrateSkills(sources, claudeDir, report, options);
        break;
      case 'memory':
        await migrateMemory(sources, claudeDir, report, options);
        break;
    }
  }

  // Also migrate legacy files if present
  const legacyFiles = await findLegacyFiles(sourceDir);
  if (legacyFiles.size > 0 && !options.source) {
    logger.info('Also migrating legacy CLAUDE.md/AGENTS.md...');
    const parseResult = parseLegacyFiles(legacyFiles);

    if (options.minimal) {
      await createMinimalMigration(claudeDir, parseResult.layers, report, options.dryRun);
    } else {
      await createFullMigration(claudeDir, parseResult.layers, report, options.dryRun);
    }

    for (const filename of legacyFiles.keys()) {
      report.migrated.push(filename);
    }
  }

  if (!options.dryRun) {
    logger.success(`Migration complete! Created ${report.created.length} file(s) in ${claudeDir}`);
  } else {
    logger.info(`Dry run complete - would create ${report.created.length} file(s)`);
  }

  return report;
}

/**
 * Migrate MCP configuration to .claude/tools/mcp.yaml
 */
async function migrateMCPConfig(
  sources: any,
  claudeDir: string,
  report: MigrationReport,
  options: MigrateOptions
): Promise<void> {
  const mcpServers = sources.projectMcp || [];
  if (mcpServers.length === 0) {
    logger.info('No MCP servers to migrate');
    return;
  }

  const outputPath = path.join(claudeDir, 'tools', 'mcp.yaml');

  if (options.dryRun) {
    logger.info(`Would migrate ${mcpServers.length} MCP server(s) → ${outputPath}`);
    report.created.push('tools/mcp.yaml');
    return;
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const content = [
    '# MCP Servers Configuration',
    '# Migrated from .mcp.json or settings.json',
    '',
    'servers:',
  ];

  for (const server of mcpServers) {
    content.push(`  ${server.name}:`);
    content.push(`    command: ${server.command}`);
    if (server.args && server.args.length > 0) {
      content.push(`    args: [${server.args.map((a: string) => `'${a}'`).join(', ')}]`);
    }
    if (server.env) {
      content.push('    env:');
      for (const [key, value] of Object.entries(server.env)) {
        content.push(`      ${key}: "${value}"`);
      }
    }
  }

  await fs.writeFile(outputPath, content.join('\n'), 'utf-8');
  report.created.push('tools/mcp.yaml');
  report.migrated.push('MCP configuration');
  logger.info(`Migrated ${mcpServers.length} MCP server(s) → tools/mcp.yaml`);
}

/**
 * Migrate hooks to .claude/tools/hooks.yaml
 */
async function migrateHooks(
  sources: any,
  claudeDir: string,
  report: MigrationReport,
  options: MigrateOptions
): Promise<void> {
  const hooks = sources.projectHooks || [];
  if (hooks.length === 0) {
    logger.info('No hooks to migrate');
    return;
  }

  const outputPath = path.join(claudeDir, 'tools', 'hooks.yaml');

  if (options.dryRun) {
    logger.info(`Would migrate ${hooks.length} hook(s) → ${outputPath}`);
    report.created.push('tools/hooks.yaml');
    return;
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const content = [
    '# Hooks Configuration',
    '# Migrated from settings.json',
    '',
    'hooks:',
  ];

  for (const hook of hooks) {
    content.push(`  ${hook.name}:`);
    content.push(`    type: ${hook.type}`);
    content.push(`    command: ${hook.command}`);
    if (hook.cwd) {
      content.push(`    cwd: ${hook.cwd}`);
    }
    content.push(`    enabled: ${hook.enabled}`);
  }

  await fs.writeFile(outputPath, content.join('\n'), 'utf-8');
  report.created.push('tools/hooks.yaml');
  report.migrated.push('Hooks configuration');
  logger.info(`Migrated ${hooks.length} hook(s) → tools/hooks.yaml`);
}

/**
 * Flatten skills into layer directories
 */
async function migrateSkills(
  sources: any,
  claudeDir: string,
  report: MigrationReport,
  options: MigrateOptions
): Promise<void> {
  const skills = sources.projectSkills || [];
  if (skills.length === 0) {
    logger.info('No skills to migrate');
    return;
  }

  logger.info(`Migrating ${skills.length} skill(s) into layers...`);

  for (const skill of skills) {
    // Migrate workflows to methods/
    if (skill.workflows && skill.workflows.length > 0) {
      for (const workflowName of skill.workflows) {
        const workflowPath = path.join(
          path.dirname(skill.path),
          'workflows',
          `${workflowName}.md`
        );

        if (await fileExists(workflowPath)) {
          const content = await fs.readFile(workflowPath, 'utf-8');
          const outputPath = path.join(claudeDir, 'methods', 'workflows', `${skill.id}-${workflowName}.md`);

          if (options.dryRun) {
            logger.info(`Would migrate ${workflowName} → methods/workflows/`);
            report.created.push(`methods/workflows/${skill.id}-${workflowName}.md`);
          } else {
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, content, 'utf-8');
            report.created.push(`methods/workflows/${skill.id}-${workflowName}.md`);
          }
        }
      }
    }

    // Migrate references to knowledge/
    if (skill.references && skill.references.length > 0) {
      for (const refName of skill.references) {
        const refPath = path.join(
          path.dirname(skill.path),
          'references',
          `${refName}.md`
        );

        if (await fileExists(refPath)) {
          const content = await fs.readFile(refPath, 'utf-8');
          const outputPath = path.join(claudeDir, 'knowledge', 'references', `${skill.id}-${refName}.md`);

          if (options.dryRun) {
            logger.info(`Would migrate ${refName} → knowledge/references/`);
            report.created.push(`knowledge/references/${skill.id}-${refName}.md`);
          } else {
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, content, 'utf-8');
            report.created.push(`knowledge/references/${skill.id}-${refName}.md`);
          }
        }
      }
    }
  }

  report.migrated.push(`${skills.length} skill(s)`);
  logger.info(`Migrated ${skills.length} skill(s) into layered structure`);
}

/**
 * Migrate user memory to knowledge/
 */
async function migrateMemory(
  sources: any,
  claudeDir: string,
  report: MigrationReport,
  options: MigrateOptions
): Promise<void> {
  const memoryFiles = sources.userMemory || [];
  if (memoryFiles.length === 0) {
    logger.info('No user memory to migrate');
    return;
  }

  logger.info(`Migrating ${memoryFiles.length} memory file(s)...`);

  for (const mem of memoryFiles) {
    const outputPath = path.join(claudeDir, 'knowledge', 'memory', mem.name);

    if (options.dryRun) {
      logger.info(`Would migrate ${mem.name} → knowledge/memory/`);
      report.created.push(`knowledge/memory/${mem.name}`);
    } else {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, mem.content, 'utf-8');
      report.created.push(`knowledge/memory/${mem.name}`);
    }
  }

  report.migrated.push(`${memoryFiles.length} memory file(s)`);
  logger.info(`Migrated ${memoryFiles.length} memory file(s) → knowledge/memory/`);
}

/**
 * Check if file exists
 */
async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}
