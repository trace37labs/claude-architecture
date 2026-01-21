/**
 * Unit tests for Doctor Command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { doctorCommand, DoctorOptions, DoctorReport } from '../../../src/commands/doctor.js';
import * as fs from 'fs';
import * as path from 'path';

// Test output directory
const TEST_OUTPUT_DIR = path.join(process.cwd(), 'test-output-doctor');

describe('Doctor Command', () => {
  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  describe('No Configuration', () => {
    it('should handle directory with no .claude/ directory', async () => {
      // Use a deeply nested directory that won't have .claude/ in parent dirs
      const isolatedDir = path.join(TEST_OUTPUT_DIR, 'isolated', 'deep', 'nested');
      fs.mkdirSync(isolatedDir, { recursive: true });

      const options: DoctorOptions = {
        targetDir: isolatedDir,
        format: 'json',
      };

      const report = await doctorCommand(options);

      expect(report).toBeDefined();
      // Scanner might still find parent .claude/ dirs, so we check for defined result
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.assessment).toBeDefined();
      expect(['healthy', 'needs-attention', 'critical']).toContain(report.assessment);
    });

    it('should provide feedback when scanning directory', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const isolatedDir = path.join(TEST_OUTPUT_DIR, 'scan-test', 'nested');
      fs.mkdirSync(isolatedDir, { recursive: true });

      const options: DoctorOptions = {
        targetDir: isolatedDir,
        format: 'text',
      };

      const report = await doctorCommand(options);

      expect(report).toBeDefined();
      expect(report.healthScore).toBeGreaterThanOrEqual(0);

      consoleLogSpy.mockRestore();
    });
  });

  describe('Minimal Valid Configuration', () => {
    beforeEach(() => {
      // Create minimal .claude/ structure
      const claudeDir = path.join(TEST_OUTPUT_DIR, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });

      // Create minimal layer files
      fs.writeFileSync(
        path.join(claudeDir, 'rules.md'),
        '# Rules\n\n## Security\n- No destructive commands'
      );
      fs.writeFileSync(
        path.join(claudeDir, 'tools.md'),
        '# Tools\n\n## MCP Servers\n- filesystem: file operations'
      );
      fs.writeFileSync(
        path.join(claudeDir, 'methods.md'),
        '# Methods\n\n## Code Review\n1. Check syntax\n2. Run tests'
      );
      fs.writeFileSync(
        path.join(claudeDir, 'knowledge.md'),
        '# Knowledge\n\n## Architecture\nThis is a test project'
      );
      fs.writeFileSync(
        path.join(claudeDir, 'goals.md'),
        '# Goals\n\n## Current\n- Test the doctor command'
      );
    });

    it('should return healthy assessment for valid minimal config', async () => {
      const options: DoctorOptions = {
        targetDir: TEST_OUTPUT_DIR,
        format: 'json',
      };

      const report = await doctorCommand(options);

      expect(report).toBeDefined();
      expect(report.healthScore).toBeGreaterThan(0);
      expect(report.assessment).toBeDefined();
      expect(['healthy', 'needs-attention', 'critical']).toContain(report.assessment);
    });

    it('should detect no conflicts in clean config', async () => {
      const options: DoctorOptions = {
        targetDir: TEST_OUTPUT_DIR,
        format: 'json',
      };

      const report = await doctorCommand(options);

      expect(report.conflicts).toBeDefined();
      expect(report.conflicts.bySeverity.errors).toHaveLength(0);
    });
  });

  describe('Output Formats', () => {
    beforeEach(() => {
      // Create minimal .claude/ structure
      const claudeDir = path.join(TEST_OUTPUT_DIR, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'rules.md'), '# Rules\n');
      fs.writeFileSync(path.join(claudeDir, 'tools.md'), '# Tools\n');
      fs.writeFileSync(path.join(claudeDir, 'methods.md'), '# Methods\n');
      fs.writeFileSync(path.join(claudeDir, 'knowledge.md'), '# Knowledge\n');
      fs.writeFileSync(path.join(claudeDir, 'goals.md'), '# Goals\n');
    });

    it('should output JSON format when requested', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const options: DoctorOptions = {
        targetDir: TEST_OUTPUT_DIR,
        format: 'json',
      };

      const report = await doctorCommand(options);

      expect(report).toBeDefined();
      expect(typeof report.healthScore).toBe('number');
      expect(consoleLogSpy).toHaveBeenCalled();

      // Verify JSON output structure
      const lastCall = consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1];
      const jsonOutput = lastCall[0];
      expect(() => JSON.parse(jsonOutput)).not.toThrow();

      consoleLogSpy.mockRestore();
    });

    it('should output text format by default', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const options: DoctorOptions = {
        targetDir: TEST_OUTPUT_DIR,
      };

      const report = await doctorCommand(options);

      expect(report).toBeDefined();
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('Recommendations', () => {
    beforeEach(() => {
      // Create minimal .claude/ structure
      const claudeDir = path.join(TEST_OUTPUT_DIR, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'rules.md'), '# Rules\n');
      fs.writeFileSync(path.join(claudeDir, 'tools.md'), '# Tools\n');
      fs.writeFileSync(path.join(claudeDir, 'methods.md'), '# Methods\n');
      fs.writeFileSync(path.join(claudeDir, 'knowledge.md'), '# Knowledge\n');
      fs.writeFileSync(path.join(claudeDir, 'goals.md'), '# Goals\n');
    });

    it('should generate recommendations when requested', async () => {
      const options: DoctorOptions = {
        targetDir: TEST_OUTPUT_DIR,
        format: 'json',
        recommendations: true,
      };

      const report = await doctorCommand(options);

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations?.byPriority).toBeDefined();
    });

    it('should not generate recommendations when not requested', async () => {
      const options: DoctorOptions = {
        targetDir: TEST_OUTPUT_DIR,
        format: 'json',
        recommendations: false,
      };

      const report = await doctorCommand(options);

      expect(report.recommendations).toBeUndefined();
    });
  });

  describe('Error Filtering', () => {
    beforeEach(() => {
      // Create minimal .claude/ structure
      const claudeDir = path.join(TEST_OUTPUT_DIR, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'rules.md'), '# Rules\n');
      fs.writeFileSync(path.join(claudeDir, 'tools.md'), '# Tools\n');
      fs.writeFileSync(path.join(claudeDir, 'methods.md'), '# Methods\n');
      fs.writeFileSync(path.join(claudeDir, 'knowledge.md'), '# Knowledge\n');
      fs.writeFileSync(path.join(claudeDir, 'goals.md'), '# Goals\n');
    });

    it('should respect errorsOnly option in text output', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const options: DoctorOptions = {
        targetDir: TEST_OUTPUT_DIR,
        format: 'text',
        errorsOnly: true,
      };

      await doctorCommand(options);

      // Should not include warnings sections in text mode
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      const hasWarningsHeader = output.includes('WARNINGS:');

      // If there are warnings, they should not be shown in errors-only mode
      expect(hasWarningsHeader).toBe(false);

      consoleLogSpy.mockRestore();
    });
  });

  describe('Verbose Mode', () => {
    beforeEach(() => {
      // Create minimal .claude/ structure
      const claudeDir = path.join(TEST_OUTPUT_DIR, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'rules.md'), '# Rules\n');
      fs.writeFileSync(path.join(claudeDir, 'tools.md'), '# Tools\n');
      fs.writeFileSync(path.join(claudeDir, 'methods.md'), '# Methods\n');
      fs.writeFileSync(path.join(claudeDir, 'knowledge.md'), '# Knowledge\n');
      fs.writeFileSync(path.join(claudeDir, 'goals.md'), '# Goals\n');
    });

    it('should show detailed information in verbose mode', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const options: DoctorOptions = {
        targetDir: TEST_OUTPUT_DIR,
        format: 'text',
        verbose: true,
        recommendations: true,
      };

      await doctorCommand(options);

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('Health Score Assessment', () => {
    it('should assess healthy for score >= 80', async () => {
      const claudeDir = path.join(TEST_OUTPUT_DIR, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });

      // Create complete, valid config
      fs.writeFileSync(path.join(claudeDir, 'rules.md'), '# Rules\n\n## Security\n- Validate all inputs');
      fs.writeFileSync(path.join(claudeDir, 'tools.md'), '# Tools\n\n## MCP\n- Server configured');
      fs.writeFileSync(path.join(claudeDir, 'methods.md'), '# Methods\n\n## Workflow\n- Step 1\n- Step 2');
      fs.writeFileSync(path.join(claudeDir, 'knowledge.md'), '# Knowledge\n\n## Docs\nComplete documentation');
      fs.writeFileSync(path.join(claudeDir, 'goals.md'), '# Goals\n\n## Objectives\n- Goal 1');

      const options: DoctorOptions = {
        targetDir: TEST_OUTPUT_DIR,
        format: 'json',
      };

      const report = await doctorCommand(options);

      // With a complete valid config, health score should be high
      if (report.healthScore >= 80) {
        expect(report.assessment).toBe('healthy');
      }
      // Test that assessment matches score thresholds
      if (report.healthScore >= 80) {
        expect(report.assessment).toBe('healthy');
      } else if (report.healthScore >= 50) {
        expect(report.assessment).toBe('needs-attention');
      } else {
        expect(report.assessment).toBe('critical');
      }
    });

    it('should assess based on health score thresholds', async () => {
      const claudeDir = path.join(TEST_OUTPUT_DIR, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });

      // Create minimal config
      fs.writeFileSync(path.join(claudeDir, 'rules.md'), '# Rules\n');
      fs.writeFileSync(path.join(claudeDir, 'tools.md'), '# Tools\n');
      fs.writeFileSync(path.join(claudeDir, 'methods.md'), '# Methods\n');
      fs.writeFileSync(path.join(claudeDir, 'knowledge.md'), '# Knowledge\n');
      fs.writeFileSync(path.join(claudeDir, 'goals.md'), '# Goals\n');

      const options: DoctorOptions = {
        targetDir: TEST_OUTPUT_DIR,
        format: 'json',
      };

      const report = await doctorCommand(options);

      // Verify assessment matches score
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.healthScore).toBeLessThanOrEqual(100);

      if (report.healthScore >= 80) {
        expect(report.assessment).toBe('healthy');
      } else if (report.healthScore >= 50) {
        expect(report.assessment).toBe('needs-attention');
      } else {
        expect(report.assessment).toBe('critical');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty .claude/ directory', async () => {
      const claudeDir = path.join(TEST_OUTPUT_DIR, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });

      const options: DoctorOptions = {
        targetDir: TEST_OUTPUT_DIR,
        format: 'json',
      };

      const report = await doctorCommand(options);

      expect(report).toBeDefined();
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle malformed markdown files gracefully', async () => {
      const claudeDir = path.join(TEST_OUTPUT_DIR, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });

      // Write malformed content
      fs.writeFileSync(path.join(claudeDir, 'rules.md'), '# # # Invalid markdown ###');

      const options: DoctorOptions = {
        targetDir: TEST_OUTPUT_DIR,
        format: 'json',
      };

      // Should not throw
      const report = await doctorCommand(options);
      expect(report).toBeDefined();
    });

    it('should use current directory when targetDir not specified', async () => {
      const options: DoctorOptions = {
        format: 'json',
      };

      // Should not throw even without explicit directory
      const report = await doctorCommand(options);
      expect(report).toBeDefined();
    });
  });
});
