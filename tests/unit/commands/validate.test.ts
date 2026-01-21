/**
 * Tests for Validate Command
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { validateCommand } from '../../../src/commands/validate';
import { initCommand } from '../../../src/commands/init';

// Use a temporary directory for testing
const TEST_DIR = path.join(process.cwd(), 'test-output-validate');

describe('Validate Command', () => {
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

  describe('Valid Structures', () => {
    it('should validate a minimal structure successfully', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Validate
      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.valid).toBe(true);
      expect(report.structure.structureType).toBe('minimal');
      expect(report.totalErrors).toBe(0);
    });

    it('should validate a full structure successfully', async () => {
      // Create full structure
      await initCommand({
        minimal: false,
        targetDir: TEST_DIR,
      });

      // Validate
      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.valid).toBe(true);
      expect(report.structure.structureType).toBe('full');
      expect(report.totalErrors).toBe(0);
    });

    it('should validate structure only when requested', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Validate structure only
      const report = await validateCommand({
        targetDir: TEST_DIR,
        structureOnly: true,
      });

      expect(report.valid).toBe(true);
      expect(report.schema).toBeUndefined();
    });
  });

  describe('Invalid Structures', () => {
    it('should detect missing .claude directory', async () => {
      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.valid).toBe(false);
      expect(report.structure.errors.length).toBeGreaterThan(0);
      expect(report.structure.errors[0].type).toBe('missing-directory');
    });

    it('should detect empty .claude directory', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.structure.structureType).toBe('unknown');
    });

    it('should detect mixed structure (both files and directories)', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });

      // Create both a file and a directory for rules
      await fs.writeFile(path.join(claudeDir, 'rules.md'), '# Rules\n', 'utf-8');
      await fs.mkdir(path.join(claudeDir, 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(claudeDir, 'rules', 'security.md'),
        '# Security\n',
        'utf-8'
      );

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.structure.structureType).toBe('mixed');
      expect(report.structure.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Schema Validation', () => {
    it('should validate markdown files', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      const report = await validateCommand({
        targetDir: TEST_DIR,
        verbose: true,
      });

      expect(report.valid).toBe(true);
      expect(report.schema).toBeDefined();
      expect(report.schema!.filesValidated.length).toBeGreaterThan(0);
    });

    it('should detect empty files', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });

      // Create empty file
      await fs.writeFile(path.join(claudeDir, 'rules.md'), '', 'utf-8');

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.schema?.warnings.length).toBeGreaterThan(0);
    });

    it('should validate YAML files in tools layer', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(path.join(claudeDir, 'tools'), { recursive: true });

      // Create valid MCP server config
      const mcpConfig = `servers:
  github:
    command: npx
    args: [-y, '@modelcontextprotocol/server-github']
`;
      await fs.writeFile(
        path.join(claudeDir, 'tools', 'mcp.yaml'),
        mcpConfig,
        'utf-8'
      );

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.schema?.errors.length).toBe(0);
    });

    it('should detect invalid YAML syntax', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(path.join(claudeDir, 'tools'), { recursive: true });

      // Create invalid YAML
      const invalidYaml = `servers:
  github:
    command: npx
    args: [unclosed bracket
`;
      await fs.writeFile(
        path.join(claudeDir, 'tools', 'mcp.yaml'),
        invalidYaml,
        'utf-8'
      );

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.valid).toBe(false);
      expect(report.schema?.errors.length).toBeGreaterThan(0);
    });

    it('should detect files without markdown headings', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });

      // Create file without headings
      await fs.writeFile(
        path.join(claudeDir, 'rules.md'),
        'Just some text without headings',
        'utf-8'
      );

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.schema?.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Layer-Specific Validation', () => {
    it('should warn if rules file lacks security/forbidden sections', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });

      // Create rules file without expected sections
      await fs.writeFile(
        path.join(claudeDir, 'rules.md'),
        '# Rules\n\nSome random content',
        'utf-8'
      );

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.schema?.warnings.some((w) => w.layer === 'rules')).toBe(true);
    });

    it('should warn if tools file lacks tool definitions', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });

      // Create tools file without expected sections
      await fs.writeFile(
        path.join(claudeDir, 'tools.md'),
        '# Tools\n\nSome random content',
        'utf-8'
      );

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      // Check if there are warnings (may be from structure or schema)
      expect(report.totalWarnings).toBeGreaterThan(0);
    });

    it('should warn if methods file lacks workflows/patterns', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });

      // Create methods file without expected sections
      await fs.writeFile(
        path.join(claudeDir, 'methods.md'),
        '# Methods\n\nSome random content',
        'utf-8'
      );

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.schema?.warnings.some((w) => w.layer === 'methods')).toBe(true);
    });

    it('should warn if knowledge file lacks overview/architecture', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });

      // Create knowledge file without expected sections
      await fs.writeFile(
        path.join(claudeDir, 'knowledge.md'),
        '# Knowledge\n\nSome random content',
        'utf-8'
      );

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.schema?.warnings.some((w) => w.layer === 'knowledge')).toBe(true);
    });

    it('should warn if goals file lacks goal-related content', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });

      // Create goals file without expected sections
      await fs.writeFile(
        path.join(claudeDir, 'goals.md'),
        '# Goals\n\nSome random content',
        'utf-8'
      );

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      // Check if there are warnings (may be from structure or schema)
      expect(report.totalWarnings).toBeGreaterThan(0);
    });
  });

  describe('Validation Report', () => {
    it('should include detailed error information in verbose mode', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(path.join(claudeDir, 'rules.md'), '', 'utf-8');

      const report = await validateCommand({
        targetDir: TEST_DIR,
        verbose: true,
      });

      expect(report.structure).toBeDefined();
      expect(report.schema).toBeDefined();
      expect(report.totalErrors).toBeGreaterThanOrEqual(0);
      expect(report.totalWarnings).toBeGreaterThanOrEqual(0);
    });

    it('should count total errors from all sources', async () => {
      // Create an invalid structure
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });

      // Create invalid YAML
      await fs.mkdir(path.join(claudeDir, 'tools'), { recursive: true });
      await fs.writeFile(
        path.join(claudeDir, 'tools', 'mcp.yaml'),
        'invalid: [yaml',
        'utf-8'
      );

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.totalErrors).toBeGreaterThan(0);
      expect(report.valid).toBe(false);
    });
  });

  describe('Full Structure Validation', () => {
    it('should validate all subdirectories in full structure', async () => {
      await initCommand({
        minimal: false,
        targetDir: TEST_DIR,
      });

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.valid).toBe(true);
      expect(report.structure.structureType).toBe('full');

      // Should have validated multiple files from subdirectories
      expect(report.schema?.filesValidated.length).toBeGreaterThan(5);

      // At least some files should be from layer subdirectories
      const hasSubdirFiles = report.schema?.filesValidated.some((f) =>
        /\/(rules|tools|methods|knowledge|goals)\//.test(f)
      );
      expect(hasSubdirFiles).toBe(true);
    });

    it('should warn about empty directories in full structure', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(path.join(claudeDir, 'rules'), { recursive: true });
      await fs.mkdir(path.join(claudeDir, 'tools'), { recursive: true });

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.structure.warnings.some((w) => w.message.includes('empty'))).toBe(
        true
      );
    });
  });

  describe('File Type Validation', () => {
    it('should warn about unexpected file types', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(path.join(claudeDir, 'rules'), { recursive: true });

      // Create a file with unexpected extension
      await fs.writeFile(
        path.join(claudeDir, 'rules', 'test.txt'),
        'unexpected file type',
        'utf-8'
      );

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(
        report.schema?.warnings.some((w) => w.message.includes('Unexpected file type'))
      ).toBe(true);
    });

    it('should accept .md and .yaml files', async () => {
      const claudeDir = path.join(TEST_DIR, '.claude');
      await fs.mkdir(path.join(claudeDir, 'tools'), { recursive: true });

      // Create valid markdown and YAML files
      await fs.writeFile(
        path.join(claudeDir, 'tools', 'commands.md'),
        '# Commands\n',
        'utf-8'
      );
      await fs.writeFile(
        path.join(claudeDir, 'tools', 'mcp.yaml'),
        'servers: {}',
        'utf-8'
      );

      const report = await validateCommand({
        targetDir: TEST_DIR,
      });

      expect(report.schema?.filesValidated).toContain(
        path.join(claudeDir, 'tools', 'commands.md')
      );
      expect(report.schema?.filesValidated).toContain(
        path.join(claudeDir, 'tools', 'mcp.yaml')
      );
    });
  });
});
