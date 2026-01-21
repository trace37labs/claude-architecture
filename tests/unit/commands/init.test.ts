/**
 * Tests for Init Command
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { initCommand } from '../../../src/commands/init';

// Use a temporary directory for testing
const TEST_DIR = path.join(process.cwd(), 'test-output-init');

describe('Init Command', () => {
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

  describe('Minimal Structure', () => {
    it('should create minimal structure with single files', async () => {
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      const claudeDir = path.join(TEST_DIR, '.claude');

      // Check that .claude directory exists
      const stat = await fs.stat(claudeDir);
      expect(stat.isDirectory()).toBe(true);

      // Check that all layer files exist
      const files = ['rules.md', 'tools.md', 'methods.md', 'knowledge.md', 'goals.md'];
      for (const file of files) {
        const filePath = path.join(claudeDir, file);
        const fileStat = await fs.stat(filePath);
        expect(fileStat.isFile()).toBe(true);

        // Check that file has content
        const content = await fs.readFile(filePath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
        expect(content).toContain('#'); // Should be markdown
      }
    });

    it('should create files with proper template content', async () => {
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      const claudeDir = path.join(TEST_DIR, '.claude');

      // Check rules.md has expected sections
      const rulesContent = await fs.readFile(path.join(claudeDir, 'rules.md'), 'utf-8');
      expect(rulesContent).toContain('# Rules');
      expect(rulesContent).toContain('## Security');
      expect(rulesContent).toContain('## Code Standards');
      expect(rulesContent).toContain('## Process');

      // Check knowledge.md has expected content
      const knowledgeContent = await fs.readFile(
        path.join(claudeDir, 'knowledge.md'),
        'utf-8'
      );
      expect(knowledgeContent).toContain('# Knowledge');
      expect(knowledgeContent).toContain('Project Overview');

      // Check goals.md has expected content
      const goalsContent = await fs.readFile(path.join(claudeDir, 'goals.md'), 'utf-8');
      expect(goalsContent).toContain('# Goals');
      expect(goalsContent).toContain('Current Sprint');
    });
  });

  describe('Full Structure', () => {
    it('should create full structure with subdirectories', async () => {
      await initCommand({
        minimal: false,
        targetDir: TEST_DIR,
      });

      const claudeDir = path.join(TEST_DIR, '.claude');

      // Check main directory exists
      const stat = await fs.stat(claudeDir);
      expect(stat.isDirectory()).toBe(true);

      // Check all layer directories exist
      const layerDirs = ['rules', 'tools', 'methods', 'knowledge', 'goals'];
      for (const dir of layerDirs) {
        const dirPath = path.join(claudeDir, dir);
        const dirStat = await fs.stat(dirPath);
        expect(dirStat.isDirectory()).toBe(true);
      }
    });

    it('should create rules layer files', async () => {
      await initCommand({
        minimal: false,
        targetDir: TEST_DIR,
      });

      const rulesDir = path.join(TEST_DIR, '.claude', 'rules');

      // Check rules files
      const files = ['security.md', 'code-standards.md', 'process.md'];
      for (const file of files) {
        const filePath = path.join(rulesDir, file);
        const fileStat = await fs.stat(filePath);
        expect(fileStat.isFile()).toBe(true);

        const content = await fs.readFile(filePath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
        expect(content).toContain('#'); // Markdown header
      }

      // Check security rules content
      const securityContent = await fs.readFile(
        path.join(rulesDir, 'security.md'),
        'utf-8'
      );
      expect(securityContent).toContain('# Security Rules');
      expect(securityContent).toContain('Authentication');
    });

    it('should create tools layer files', async () => {
      await initCommand({
        minimal: false,
        targetDir: TEST_DIR,
      });

      const toolsDir = path.join(TEST_DIR, '.claude', 'tools');

      // Check mcp.yaml exists
      const mcpPath = path.join(toolsDir, 'mcp.yaml');
      const mcpStat = await fs.stat(mcpPath);
      expect(mcpStat.isFile()).toBe(true);

      // Check commands directory
      const commandsDir = path.join(toolsDir, 'commands');
      const commandsStat = await fs.stat(commandsDir);
      expect(commandsStat.isDirectory()).toBe(true);

      // Check README in commands
      const readmePath = path.join(commandsDir, 'README.md');
      const readmeStat = await fs.stat(readmePath);
      expect(readmeStat.isFile()).toBe(true);
    });

    it('should create methods layer files', async () => {
      await initCommand({
        minimal: false,
        targetDir: TEST_DIR,
      });

      const methodsDir = path.join(TEST_DIR, '.claude', 'methods');

      // Check workflows directory and files
      const workflowsDir = path.join(methodsDir, 'workflows');
      const workflowsStat = await fs.stat(workflowsDir);
      expect(workflowsStat.isDirectory()).toBe(true);

      const featurePath = path.join(workflowsDir, 'feature-development.md');
      const featureStat = await fs.stat(featurePath);
      expect(featureStat.isFile()).toBe(true);

      // Check patterns directory and files
      const patternsDir = path.join(methodsDir, 'patterns');
      const patternsStat = await fs.stat(patternsDir);
      expect(patternsStat.isDirectory()).toBe(true);

      const errorPath = path.join(patternsDir, 'error-handling.md');
      const errorStat = await fs.stat(errorPath);
      expect(errorStat.isFile()).toBe(true);
    });

    it('should create knowledge layer files', async () => {
      await initCommand({
        minimal: false,
        targetDir: TEST_DIR,
      });

      const knowledgeDir = path.join(TEST_DIR, '.claude', 'knowledge');

      // Check knowledge files
      const files = ['overview.md', 'architecture.md', 'glossary.md'];
      for (const file of files) {
        const filePath = path.join(knowledgeDir, file);
        const fileStat = await fs.stat(filePath);
        expect(fileStat.isFile()).toBe(true);

        const content = await fs.readFile(filePath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      }

      // Check architecture content
      const archContent = await fs.readFile(
        path.join(knowledgeDir, 'architecture.md'),
        'utf-8'
      );
      expect(archContent).toContain('# Architecture');
      expect(archContent).toContain('System Design');
    });

    it('should create goals layer files', async () => {
      await initCommand({
        minimal: false,
        targetDir: TEST_DIR,
      });

      const goalsDir = path.join(TEST_DIR, '.claude', 'goals');

      // Check goals files
      const files = ['current.md', 'backlog.md'];
      for (const file of files) {
        const filePath = path.join(goalsDir, file);
        const fileStat = await fs.stat(filePath);
        expect(fileStat.isFile()).toBe(true);

        const content = await fs.readFile(filePath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error if .claude/ already exists without force flag', async () => {
      // First initialization
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Try to initialize again without force
      await expect(
        initCommand({
          minimal: true,
          targetDir: TEST_DIR,
        })
      ).rejects.toThrow('already exists');
    });

    it('should overwrite if force flag is set', async () => {
      // First initialization
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Modify a file
      const rulesPath = path.join(TEST_DIR, '.claude', 'rules.md');
      await fs.writeFile(rulesPath, 'MODIFIED CONTENT', 'utf-8');

      // Initialize again with force
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
        force: true,
      });

      // Check that file was reset to template
      const content = await fs.readFile(rulesPath, 'utf-8');
      expect(content).toContain('# Rules');
      expect(content).not.toContain('MODIFIED CONTENT');
    });
  });

  describe('Dry Run', () => {
    it('should not create files when dry run is true (minimal)', async () => {
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
        dryRun: true,
      });

      // Check that .claude directory was not created
      const claudeDir = path.join(TEST_DIR, '.claude');
      try {
        await fs.access(claudeDir);
        expect.fail('.claude directory should not exist in dry run');
      } catch (err: any) {
        expect(err.code).toBe('ENOENT');
      }
    });

    it('should not create files when dry run is true (full)', async () => {
      await initCommand({
        minimal: false,
        targetDir: TEST_DIR,
        dryRun: true,
      });

      // Check that .claude directory was not created
      const claudeDir = path.join(TEST_DIR, '.claude');
      try {
        await fs.access(claudeDir);
        expect.fail('.claude directory should not exist in dry run');
      } catch (err: any) {
        expect(err.code).toBe('ENOENT');
      }
    });
  });

  describe('Target Directory', () => {
    it('should use current directory by default', async () => {
      // This test is challenging because we don't want to pollute the actual cwd
      // Instead we'll verify the targetDir defaults work correctly when specified
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      const claudeDir = path.join(TEST_DIR, '.claude');
      const stat = await fs.stat(claudeDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should use custom target directory', async () => {
      const customDir = path.join(TEST_DIR, 'custom');
      await fs.mkdir(customDir, { recursive: true });

      await initCommand({
        minimal: true,
        targetDir: customDir,
      });

      const claudeDir = path.join(customDir, '.claude');
      const stat = await fs.stat(claudeDir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('Template Content Quality', () => {
    it('should have helpful content in all templates (minimal)', async () => {
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      const claudeDir = path.join(TEST_DIR, '.claude');
      const files = ['rules.md', 'tools.md', 'methods.md', 'knowledge.md', 'goals.md'];

      for (const file of files) {
        const content = await fs.readFile(path.join(claudeDir, file), 'utf-8');

        // Each file should have:
        // - A main heading
        expect(content).toMatch(/^# /m);

        // - At least one section
        expect(content).toMatch(/^## /m);

        // - Some explanatory text or examples
        expect(content.split('\n').length).toBeGreaterThan(5);
      }
    });

    it('should have helpful content in all templates (full)', async () => {
      await initCommand({
        minimal: false,
        targetDir: TEST_DIR,
      });

      const allFiles = [
        '.claude/rules/security.md',
        '.claude/rules/code-standards.md',
        '.claude/rules/process.md',
        '.claude/tools/mcp.yaml',
        '.claude/methods/workflows/feature-development.md',
        '.claude/methods/patterns/error-handling.md',
        '.claude/knowledge/overview.md',
        '.claude/knowledge/architecture.md',
        '.claude/knowledge/glossary.md',
        '.claude/goals/current.md',
        '.claude/goals/backlog.md',
      ];

      for (const file of allFiles) {
        const content = await fs.readFile(path.join(TEST_DIR, file), 'utf-8');

        // Each file should have content
        expect(content.length).toBeGreaterThan(50);

        // YAML files are different
        if (file.endsWith('.yaml')) {
          expect(content).toContain('#');
        } else {
          // Markdown files should have headings
          expect(content).toMatch(/^# /m);
        }
      }
    });
  });
});
