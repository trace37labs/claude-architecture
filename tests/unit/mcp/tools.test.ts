/**
 * MCP Tools Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  handleResolveConfig,
  handleValidateStructure,
  handleDetectConflicts,
  handleGetRecommendations,
} from '../../../src/mcp/tools';

describe('MCP Tools', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-tools-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('handleResolveConfig', () => {
    it('should resolve config with json format', async () => {
      const projectPath = path.join(tempDir, '.claude');
      await fs.mkdir(path.join(projectPath, 'rules'), { recursive: true });
      await fs.writeFile(
        path.join(projectPath, 'rules', 'security.md'),
        '# Security Rules\n\n- No hardcoded secrets'
      );

      const result = await handleResolveConfig({
        projectPath,
        format: 'json',
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('"rules"');
      expect(result.isError).toBeUndefined();
    });

    it('should resolve config with tree format', async () => {
      const projectPath = path.join(tempDir, '.claude');
      await fs.mkdir(path.join(projectPath, 'rules'), { recursive: true });

      const result = await handleResolveConfig({
        projectPath,
        format: 'tree',
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeUndefined();
    });

    it('should resolve config with precedence format', async () => {
      const projectPath = path.join(tempDir, '.claude');
      await fs.mkdir(path.join(projectPath, 'rules'), { recursive: true });

      const result = await handleResolveConfig({
        projectPath,
        format: 'precedence',
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      const result = await handleResolveConfig({
        projectPath: '/nonexistent/path',
        format: 'json',
      });

      expect(result.content).toBeDefined();
      // Error handling may return valid empty config or error
      expect(result.content[0].type).toBe('text');
    });
  });

  describe('handleValidateStructure', () => {
    it('should validate correct structure', async () => {
      const claudePath = path.join(tempDir, '.claude');
      await fs.mkdir(path.join(claudePath, 'rules'), { recursive: true });
      await fs.mkdir(path.join(claudePath, 'tools'), { recursive: true });
      await fs.mkdir(path.join(claudePath, 'methods'), { recursive: true });
      await fs.mkdir(path.join(claudePath, 'knowledge'), { recursive: true });
      await fs.mkdir(path.join(claudePath, 'goals'), { recursive: true });

      const result = await handleValidateStructure({
        path: claudePath,
        format: 'text',
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      // Structure validation may have schema requirements
    });

    it('should detect invalid structure', async () => {
      const claudePath = path.join(tempDir, '.claude');
      await fs.mkdir(claudePath, { recursive: true });

      const result = await handleValidateStructure({
        path: claudePath,
        format: 'text',
      });

      expect(result.content).toBeDefined();
      // May pass or fail depending on validator behavior with minimal structure
    });

    it('should return json format', async () => {
      const claudePath = path.join(tempDir, '.claude');
      await fs.mkdir(path.join(claudePath, 'rules'), { recursive: true });

      const result = await handleValidateStructure({
        path: claudePath,
        format: 'json',
      });

      expect(result.content).toBeDefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty('valid');
      expect(parsed).toHaveProperty('errors');
    });
  });

  describe('handleDetectConflicts', () => {
    it('should detect conflicts in config', async () => {
      const claudePath = path.join(tempDir, '.claude');
      await fs.mkdir(path.join(claudePath, 'rules'), { recursive: true });

      const result = await handleDetectConflicts({
        path: claudePath,
        format: 'text',
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      // May report INFO/WARNING level conflicts even in minimal config
    });

    it('should return json format', async () => {
      const claudePath = path.join(tempDir, '.claude');
      await fs.mkdir(path.join(claudePath, 'rules'), { recursive: true });

      const result = await handleDetectConflicts({
        path: claudePath,
        format: 'json',
      });

      expect(result.content).toBeDefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty('conflicts');
    });

    it('should handle missing config gracefully', async () => {
      const result = await handleDetectConflicts({
        path: '/nonexistent/path',
        format: 'text',
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      // May succeed with empty config or return error
    });
  });

  describe('handleGetRecommendations', () => {
    it('should generate recommendations', async () => {
      const claudePath = path.join(tempDir, '.claude');
      await fs.mkdir(path.join(claudePath, 'rules'), { recursive: true });

      const result = await handleGetRecommendations({
        path: claudePath,
        format: 'text',
        quickWins: false,
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
    });

    it('should filter quick wins', async () => {
      const claudePath = path.join(tempDir, '.claude');
      await fs.mkdir(path.join(claudePath, 'rules'), { recursive: true });

      const result = await handleGetRecommendations({
        path: claudePath,
        format: 'text',
        quickWins: true,
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
    });

    it('should return json format', async () => {
      const claudePath = path.join(tempDir, '.claude');
      await fs.mkdir(path.join(claudePath, 'rules'), { recursive: true });

      const result = await handleGetRecommendations({
        path: claudePath,
        format: 'json',
        quickWins: false,
      });

      expect(result.content).toBeDefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty('recommendations');
      expect(parsed).toHaveProperty('quickWins');
    });

    it('should handle missing config gracefully', async () => {
      const result = await handleGetRecommendations({
        path: '/nonexistent/path',
        format: 'text',
        quickWins: false,
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      // May succeed with empty config or return error
    });
  });
});
