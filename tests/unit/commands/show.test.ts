/**
 * Tests for Show Command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { showCommand } from '../../../src/commands/show';
import { initCommand } from '../../../src/commands/init';

// Use a temporary directory for testing
const TEST_DIR = path.join(process.cwd(), 'test-output-show');

// Capture console output
let consoleOutput: string[] = [];
const originalLog = console.log;

beforeEach(() => {
  consoleOutput = [];
  console.log = vi.fn((...args: any[]) => {
    consoleOutput.push(args.join(' '));
  });
});

afterEach(() => {
  console.log = originalLog;
});

describe('Show Command', () => {
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

  describe('Tree Format', () => {
    it('should display config in tree format by default', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Add some content to rules
      const rulesFile = path.join(TEST_DIR, '.claude', 'rules.md');
      await fs.writeFile(rulesFile, '# Security Rules\n\n- No destructive operations\n- Validate all inputs\n');

      // Clear console output from init
      consoleOutput = [];

      // Clear console output from init
      consoleOutput = [];

      // Show config
      await showCommand({
        targetDir: TEST_DIR,
        noColor: true,
      });

      const output = consoleOutput.join('\n');

      // Should contain tree structure
      expect(output).toContain('Configuration Tree');
      expect(output).toContain('Metadata');
      expect(output).toContain('Merged at:');
      expect(output).toContain('Layer RULES');
    });

    it('should handle empty configuration', async () => {
      // Create minimal structure with no content
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Clear console output from init
      consoleOutput = [];

      // Show config
      await showCommand({
        targetDir: TEST_DIR,
        noColor: true,
      });

      const output = consoleOutput.join('\n');

      // Should still show structure
      expect(output).toContain('Configuration Tree');
      expect(output).toContain('Metadata');
    });

    it('should show verbose output when requested', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Show with verbose
      await showCommand({
        targetDir: TEST_DIR,
        verbose: true,
        noColor: true,
      });

      const output = consoleOutput.join('\n');

      // Should contain additional details
      expect(output).toContain('Configuration Tree');
    });

    it('should show empty layers when requested', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Show with empty layers
      await showCommand({
        targetDir: TEST_DIR,
        showEmpty: true,
        noColor: true,
      });

      const output = consoleOutput.join('\n');

      // Should show all layers even if empty
      expect(output).toContain('Layer RULES');
      expect(output).toContain('Layer TOOLS');
      expect(output).toContain('Layer METHODS');
      expect(output).toContain('Layer KNOWLEDGE');
      expect(output).toContain('Layer GOALS');
    });
  });

  describe('Precedence Format', () => {
    it('should display config in precedence format', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Add content
      const rulesFile = path.join(TEST_DIR, '.claude', 'rules.md');
      await fs.writeFile(rulesFile, '# Security\n\n- Rule 1\n');

      // Show precedence
      await showCommand({
        targetDir: TEST_DIR,
        format: 'precedence',
        noColor: true,
      });

      const output = consoleOutput.join('\n');

      // Should contain precedence chain
      expect(output).toContain('Precedence Chain');
      expect(output).toContain('Scope Precedence');
      expect(output).toContain('Task');
      expect(output).toContain('Project');
      expect(output).toContain('User');
      expect(output).toContain('System');
    });

    it('should show compact precedence format', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Show compact precedence
      await showCommand({
        targetDir: TEST_DIR,
        format: 'precedence',
        compact: true,
        noColor: true,
      });

      const output = consoleOutput.join('\n');

      // Should contain compact view
      expect(output).toContain('Precedence Chain');
    });

    it('should filter by layer in precedence format', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Show specific layer
      await showCommand({
        targetDir: TEST_DIR,
        format: 'precedence',
        layer: 'rules' as any,
        noColor: true,
      });

      const output = consoleOutput.join('\n');

      // Should only show rules layer
      expect(output).toContain('Precedence Chain');
    });
  });

  describe('JSON Format', () => {
    it('should display config in JSON format', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Show JSON
      await showCommand({
        targetDir: TEST_DIR,
        format: 'json',
      });

      const output = consoleOutput.join('\n');

      // Should be valid JSON
      expect(() => JSON.parse(output)).not.toThrow();

      const json = JSON.parse(output);
      expect(json).toHaveProperty('merged');
      expect(json).toHaveProperty('scopes');
      expect(json.merged).toHaveProperty('metadata');
    });

    it('should include verbose scope details in JSON', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Show verbose JSON
      await showCommand({
        targetDir: TEST_DIR,
        format: 'json',
        verbose: true,
      });

      const output = consoleOutput.join('\n');
      const json = JSON.parse(output);

      // Should include detailed scope info
      expect(json.scopes).toBeTypeOf('object');
    });

    it('should filter to specific layer in JSON', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Add content to rules
      const rulesFile = path.join(TEST_DIR, '.claude', 'rules.md');
      await fs.writeFile(rulesFile, '# Rules\n\n- Rule 1\n');

      // Show specific layer as JSON
      await showCommand({
        targetDir: TEST_DIR,
        format: 'json',
        layer: 'rules' as any,
      });

      const output = consoleOutput.join('\n');
      const json = JSON.parse(output);

      // Should only contain rules layer
      expect(json.merged).toHaveProperty('rules');
      expect(json.merged).toHaveProperty('metadata');
      expect(json.merged).not.toHaveProperty('tools');
      expect(json.merged).not.toHaveProperty('methods');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing .claude/ directory gracefully', async () => {
      // Don't create any structure

      // Show should not throw
      await expect(
        showCommand({
          targetDir: TEST_DIR,
          noColor: true,
        })
      ).resolves.not.toThrow();
    });

    it('should handle invalid format gracefully', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Show with invalid format
      await showCommand({
        targetDir: TEST_DIR,
        format: 'invalid' as any,
        noColor: true,
      });

      const output = consoleOutput.join('\n');

      // Should show error message
      expect(output).toContain('Unknown format');
    });
  });

  describe('Full Structure', () => {
    it('should handle full directory structure', async () => {
      // Create full structure
      await initCommand({
        minimal: false,
        targetDir: TEST_DIR,
      });

      // Add content to multiple layers
      const rulesDir = path.join(TEST_DIR, '.claude', 'rules');
      await fs.writeFile(
        path.join(rulesDir, 'security.md'),
        '# Security\n\n- No destructive ops\n'
      );

      const toolsDir = path.join(TEST_DIR, '.claude', 'tools');
      await fs.writeFile(
        path.join(toolsDir, 'mcp-servers.md'),
        '# MCP Servers\n\n- server1\n'
      );

      // Clear console output from init
      consoleOutput = [];

      // Show config
      await showCommand({
        targetDir: TEST_DIR,
        noColor: true,
        showEmpty: true,
      });

      const output = consoleOutput.join('\n');

      // Should show all layers
      expect(output).toContain('Layer RULES');
      expect(output).toContain('Layer TOOLS');
    });
  });

  describe('Color Output', () => {
    it('should use color by default', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Show with color (default)
      await showCommand({
        targetDir: TEST_DIR,
      });

      const output = consoleOutput.join('\n');

      // Should contain ANSI color codes
      expect(output).toMatch(/\x1b\[\d+m/);
    });

    it('should disable color when requested', async () => {
      // Create minimal structure
      await initCommand({
        minimal: true,
        targetDir: TEST_DIR,
      });

      // Show without color
      await showCommand({
        targetDir: TEST_DIR,
        noColor: true,
      });

      const output = consoleOutput.join('\n');

      // Should not contain ANSI color codes
      expect(output).not.toMatch(/\x1b\[\d+m/);
    });
  });
});
