/**
 * Tests for Migrate Command
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { migrateCommand } from '../../../src/commands/migrate';

const TEST_DIR = path.join(process.cwd(), 'test-output-migrate');

describe('Migrate Command', () => {
  beforeEach(async () => {
    // Clean up test directory if it exists
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
    // Create fresh test directory
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after tests
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('File Discovery', () => {
    it('should find CLAUDE.md file', async () => {
      const claudeContent = `# Rules
Never commit secrets

# Tools
Use MCP servers

# Knowledge
This is a test project
`;
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), claudeContent, 'utf-8');

      const report = await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
      });

      expect(report.migrated).toContain('CLAUDE.md');
      expect(report.created.length).toBeGreaterThan(0);
    });

    it('should find AGENTS.md file', async () => {
      const agentsContent = `# Workflows
Feature development workflow: Create branch, implement, test, merge

# Best Practices
Use TDD for all features
`;
      await fs.writeFile(path.join(TEST_DIR, 'AGENTS.md'), agentsContent, 'utf-8');

      const report = await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
      });

      expect(report.migrated).toContain('AGENTS.md');
    });

    it('should find both CLAUDE.md and AGENTS.md', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), '# Rules\nTest', 'utf-8');
      await fs.writeFile(path.join(TEST_DIR, 'AGENTS.md'), '# Methods\nTest', 'utf-8');

      const report = await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
      });

      expect(report.migrated).toContain('CLAUDE.md');
      expect(report.migrated).toContain('AGENTS.md');
    });

    it('should handle no legacy files found', async () => {
      const report = await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
      });

      expect(report.migrated.length).toBe(0);
      expect(report.created.length).toBe(0);
    });
  });

  describe('Minimal Structure Migration', () => {
    it('should create minimal structure from CLAUDE.md', async () => {
      const content = `# Security Rules
Never commit API keys
Never expose secrets

# Tools Configuration
MCP server for GitHub
MCP server for filesystem

# Development Workflow
1. Create feature branch
2. Write tests
3. Implement feature
4. Submit PR

# Project Architecture
This is a microservices architecture

# Current Goals
Implement authentication system
`;
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), content, 'utf-8');

      const report = await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
      });

      const claudeDir = path.join(TEST_DIR, '.claude');

      // Check that all layer files were created
      const expectedFiles = ['rules.md', 'tools.md', 'methods.md', 'knowledge.md', 'goals.md'];
      for (const file of expectedFiles) {
        const filepath = path.join(claudeDir, file);
        const stat = await fs.stat(filepath);
        expect(stat.isFile()).toBe(true);
        expect(report.created).toContain(file);
      }
    });

    it('should preserve content in migrated files', async () => {
      const content = `# Security Rules
Never commit secrets
Always validate input

# Project Knowledge
This is a TypeScript project
Uses React for frontend
`;
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), content, 'utf-8');

      await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
      });

      const rulesPath = path.join(TEST_DIR, '.claude', 'rules.md');
      const rulesContent = await fs.readFile(rulesPath, 'utf-8');
      expect(rulesContent).toContain('Rules');
      expect(rulesContent).toContain('secrets');

      const knowledgePath = path.join(TEST_DIR, '.claude', 'knowledge.md');
      const knowledgeContent = await fs.readFile(knowledgePath, 'utf-8');
      expect(knowledgeContent).toContain('TypeScript');
      expect(knowledgeContent).toContain('React');
    });
  });

  describe('Full Structure Migration', () => {
    it('should create full directory structure', async () => {
      const content = `# Security Rules
Never commit secrets

# Tools
MCP servers available

# Methods
Follow TDD

# Architecture
Microservices design

# Current Goals
Deploy to production
`;
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), content, 'utf-8');

      const report = await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: false,
      });

      const claudeDir = path.join(TEST_DIR, '.claude');

      // Check that layer directories exist
      const layerDirs = ['rules', 'tools', 'methods', 'knowledge', 'goals'];
      for (const dir of layerDirs) {
        const dirPath = path.join(claudeDir, dir);
        const stat = await fs.stat(dirPath);
        expect(stat.isDirectory()).toBe(true);
      }

      // Check that files were created
      expect(report.created.length).toBeGreaterThan(0);
    });

    it('should create rules subdirectory files', async () => {
      const content = `# Security
Never expose secrets
Validate all input

# Code Standards
Use TypeScript
Write tests
`;
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), content, 'utf-8');

      await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: false,
      });

      const rulesDir = path.join(TEST_DIR, '.claude', 'rules');
      const files = ['security.md', 'code-standards.md', 'process.md'];

      for (const file of files) {
        const filepath = path.join(rulesDir, file);
        const stat = await fs.stat(filepath);
        expect(stat.isFile()).toBe(true);
      }
    });

    it('should create tools subdirectory files', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), '# Tools\nTest', 'utf-8');

      await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: false,
      });

      const toolsDir = path.join(TEST_DIR, '.claude', 'tools');

      // Check mcp.yaml
      const mcpPath = path.join(toolsDir, 'mcp.yaml');
      const mcpStat = await fs.stat(mcpPath);
      expect(mcpStat.isFile()).toBe(true);

      // Check commands directory
      const commandsDir = path.join(toolsDir, 'commands');
      const commandsStat = await fs.stat(commandsDir);
      expect(commandsStat.isDirectory()).toBe(true);
    });
  });

  describe('Unclassified Content', () => {
    it('should report unclassified sections', async () => {
      const content = `# Random Section
This doesn't match any layer pattern clearly

# Another Unknown Section
Content that is ambiguous
`;
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), content, 'utf-8');

      const report = await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
      });

      // Should have some unclassified content
      expect(report.unclassified.length).toBeGreaterThan(0);
      expect(report.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Force Overwrite', () => {
    it('should fail if .claude/ exists without force flag', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), '# Rules\nTest', 'utf-8');

      // First migration
      await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
      });

      // Second migration without force should fail
      await expect(
        migrateCommand({
          sourceDir: TEST_DIR,
          targetDir: TEST_DIR,
          minimal: true,
        })
      ).rejects.toThrow('already exists');
    });

    it('should overwrite with force flag', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), '# Rules\nOriginal', 'utf-8');

      // First migration
      await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
      });

      // Modify CLAUDE.md
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), '# Rules\nUpdated', 'utf-8');

      // Second migration with force
      const report = await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
        force: true,
      });

      expect(report.migrated.length).toBeGreaterThan(0);

      // Check that content was updated
      const rulesPath = path.join(TEST_DIR, '.claude', 'rules.md');
      const rulesContent = await fs.readFile(rulesPath, 'utf-8');
      expect(rulesContent).toContain('Updated');
    });
  });

  describe('Dry Run', () => {
    it('should not create files in dry run mode (minimal)', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), '# Rules\nTest', 'utf-8');

      const report = await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
        dryRun: true,
      });

      // Should report what would be created
      expect(report.created.length).toBeGreaterThan(0);

      // But .claude/ should not exist
      const claudeDir = path.join(TEST_DIR, '.claude');
      try {
        await fs.access(claudeDir);
        expect.fail('.claude should not exist in dry run');
      } catch (err: any) {
        expect(err.code).toBe('ENOENT');
      }
    });

    it('should not create files in dry run mode (full)', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), '# Rules\nTest', 'utf-8');

      const report = await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: false,
        dryRun: true,
      });

      expect(report.created.length).toBeGreaterThan(0);

      // .claude/ should not exist
      const claudeDir = path.join(TEST_DIR, '.claude');
      try {
        await fs.access(claudeDir);
        expect.fail('.claude should not exist in dry run');
      } catch (err: any) {
        expect(err.code).toBe('ENOENT');
      }
    });
  });

  describe('Backup Option', () => {
    it('should create backup files when backup flag is set', async () => {
      const content = '# Rules\nTest content';
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), content, 'utf-8');

      await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
        backup: true,
      });

      // Check that backup was created
      const backupPath = path.join(TEST_DIR, 'CLAUDE.md.bak');
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      expect(backupContent).toBe(content);
    });

    it('should not create backup files when backup flag is false', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), '# Rules\nTest', 'utf-8');

      await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
        backup: false,
      });

      // Backup should not exist
      const backupPath = path.join(TEST_DIR, 'CLAUDE.md.bak');
      try {
        await fs.access(backupPath);
        expect.fail('Backup file should not exist');
      } catch (err: any) {
        expect(err.code).toBe('ENOENT');
      }
    });

    it('should not create backup in dry run mode', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), '# Rules\nTest', 'utf-8');

      await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
        backup: true,
        dryRun: true,
      });

      // Backup should not exist in dry run
      const backupPath = path.join(TEST_DIR, 'CLAUDE.md.bak');
      try {
        await fs.access(backupPath);
        expect.fail('Backup should not be created in dry run');
      } catch (err: any) {
        expect(err.code).toBe('ENOENT');
      }
    });
  });

  describe('Separate Source and Target Directories', () => {
    it('should support separate source and target directories', async () => {
      const sourceDir = path.join(TEST_DIR, 'source');
      const targetDir = path.join(TEST_DIR, 'target');
      await fs.mkdir(sourceDir, { recursive: true });
      await fs.mkdir(targetDir, { recursive: true });

      await fs.writeFile(path.join(sourceDir, 'CLAUDE.md'), '# Rules\nTest', 'utf-8');

      const report = await migrateCommand({
        sourceDir,
        targetDir,
        minimal: true,
      });

      expect(report.migrated.length).toBeGreaterThan(0);

      // Check that .claude/ was created in target, not source
      const targetClaudeDir = path.join(targetDir, '.claude');
      const targetStat = await fs.stat(targetClaudeDir);
      expect(targetStat.isDirectory()).toBe(true);

      const sourceClaudeDir = path.join(sourceDir, '.claude');
      try {
        await fs.access(sourceClaudeDir);
        expect.fail('.claude should not exist in source directory');
      } catch (err: any) {
        expect(err.code).toBe('ENOENT');
      }
    });
  });

  describe('Migration Report', () => {
    it('should return complete migration report', async () => {
      await fs.writeFile(
        path.join(TEST_DIR, 'CLAUDE.md'),
        '# Security\nNever commit secrets\n\n# Unknown Section\nAmbiguous content',
        'utf-8'
      );

      const report = await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
      });

      // Check report structure
      expect(report).toHaveProperty('migrated');
      expect(report).toHaveProperty('notFound');
      expect(report).toHaveProperty('unclassified');
      expect(report).toHaveProperty('created');
      expect(report).toHaveProperty('warnings');

      // Check report content
      expect(report.migrated).toContain('CLAUDE.md');
      expect(report.created.length).toBeGreaterThan(0);
      expect(Array.isArray(report.warnings)).toBe(true);
    });
  });

  describe('Content Preservation', () => {
    it('should preserve and format rules content correctly', async () => {
      const content = `# Security Rules
- Never commit API keys
- Never expose secrets
- Always validate input

# Code Standards
- Use TypeScript strict mode
- Write tests for all functions
`;
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), content, 'utf-8');

      await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
      });

      const rulesPath = path.join(TEST_DIR, '.claude', 'rules.md');
      const rulesContent = await fs.readFile(rulesPath, 'utf-8');

      expect(rulesContent).toContain('Rules');
      expect(rulesContent).toContain('API keys');
      expect(rulesContent).toContain('Forbidden Actions');
      expect(rulesContent).toContain('Migrated from legacy');
    });

    it('should handle empty layers gracefully', async () => {
      const content = `# Security Rules
Some content here
`;
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), content, 'utf-8');

      await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: true,
      });

      // All layer files should exist even if some have no content
      const files = ['rules.md', 'tools.md', 'methods.md', 'knowledge.md', 'goals.md'];
      for (const file of files) {
        const filepath = path.join(TEST_DIR, '.claude', file);
        const stat = await fs.stat(filepath);
        expect(stat.isFile()).toBe(true);

        const content = await fs.readFile(filepath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('MCP Server Migration', () => {
    it('should extract MCP server configurations', async () => {
      const content = `# Tools
claude mcp add github -- npx -y @modelcontextprotocol/server-github
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /path
`;
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), content, 'utf-8');

      await migrateCommand({
        sourceDir: TEST_DIR,
        targetDir: TEST_DIR,
        minimal: false,
      });

      const mcpPath = path.join(TEST_DIR, '.claude', 'tools', 'mcp.yaml');
      const mcpContent = await fs.readFile(mcpPath, 'utf-8');

      expect(mcpContent).toContain('github');
      expect(mcpContent).toContain('filesystem');
    });
  });
});
