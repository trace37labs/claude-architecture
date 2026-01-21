import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'path';
import {
  scanForClaudeDirectories,
  findProjectClaudeDirectory,
  getClaudeDirectoryForScope,
  discoverLayers,
  isValidClaudeDirectory,
  getValidClaudeDirectories,
} from '../../src/scanner.js';
import { ScopeLevel } from '../../src/types/scope.js';

describe('Scanner', () => {
  const fixturesDir = resolve(process.cwd(), 'tests/fixtures');
  const simpleProjectDir = resolve(fixturesDir, 'simple-project');

  describe('scanForClaudeDirectories', () => {
    it('should scan from a directory with .claude/', () => {
      const result = scanForClaudeDirectories({
        cwd: simpleProjectDir,
        includeNonExistent: false,
      });

      expect(result.workingDirectory).toBe(simpleProjectDir);
      expect(result.directories).toBeDefined();
      expect(result.directories.length).toBeGreaterThan(0);
    });

    it('should include project scope directory', () => {
      const result = scanForClaudeDirectories({
        cwd: simpleProjectDir,
        includeNonExistent: false,
      });

      const projectDir = result.directories.find(
        (d) => d.scope === ScopeLevel.Project
      );
      expect(projectDir).toBeDefined();
      expect(projectDir?.exists).toBe(true);
    });

    it('should include non-existent directories when requested', () => {
      const result = scanForClaudeDirectories({
        cwd: simpleProjectDir,
        includeNonExistent: true,
      });

      // Should include system scope even though it's not a real directory
      const systemDir = result.directories.find(
        (d) => d.scope === ScopeLevel.System
      );
      expect(systemDir).toBeDefined();
    });

    it('should not include task scope by default for non-task directories', () => {
      const result = scanForClaudeDirectories({
        cwd: simpleProjectDir,
        includeNonExistent: false,
        includeTaskScope: true,
      });

      const taskDir = result.directories.find(
        (d) => d.scope === ScopeLevel.Task
      );
      // Should not exist since we don't have .claude-task directory
      expect(taskDir).toBeUndefined();
    });
  });

  describe('findProjectClaudeDirectory', () => {
    it('should find .claude/ in current directory', () => {
      const claudeDir = findProjectClaudeDirectory(simpleProjectDir);
      expect(claudeDir).toBe(resolve(simpleProjectDir, '.claude'));
    });

    it('should walk up to find .claude/ in parent', () => {
      const childDir = resolve(simpleProjectDir, '.claude', 'rules');
      const claudeDir = findProjectClaudeDirectory(childDir);
      expect(claudeDir).toBe(resolve(simpleProjectDir, '.claude'));
    });

    it('should return null if no .claude/ found', () => {
      const tempDir = '/tmp/nonexistent-directory-12345';
      const claudeDir = findProjectClaudeDirectory(tempDir);
      expect(claudeDir).toBeNull();
    });
  });

  describe('getClaudeDirectoryForScope', () => {
    it('should get project scope directory', () => {
      const dir = getClaudeDirectoryForScope(ScopeLevel.Project, {
        cwd: simpleProjectDir,
      });

      expect(dir).toBeDefined();
      expect(dir?.scope).toBe(ScopeLevel.Project);
      expect(dir?.exists).toBe(true);
    });

    it('should return null for non-existent scope', () => {
      const dir = getClaudeDirectoryForScope(ScopeLevel.Task, {
        cwd: simpleProjectDir,
        includeNonExistent: false,
      });

      expect(dir).toBeNull();
    });
  });

  describe('discoverLayers', () => {
    it('should discover all layer directories', () => {
      const claudeDir = resolve(simpleProjectDir, '.claude');
      const layers = discoverLayers(claudeDir);

      expect(layers.rules).toBeDefined();
      expect(layers.tools).toBeDefined();
      expect(layers.methods).toBeDefined();
      expect(layers.knowledge).toBeDefined();
      expect(layers.goals).toBeDefined();
    });

    it('should return paths to layer directories', () => {
      const claudeDir = resolve(simpleProjectDir, '.claude');
      const layers = discoverLayers(claudeDir);

      expect(layers.rules).toBe(resolve(claudeDir, 'rules'));
      expect(layers.tools).toBe(resolve(claudeDir, 'tools'));
    });

    it('should not include non-existent layers', () => {
      // Test with empty directory (will be created by test setup)
      const emptyDir = resolve(fixturesDir, 'empty-project', '.claude');
      const layers = discoverLayers(emptyDir);

      expect(Object.keys(layers).length).toBe(0);
    });
  });

  describe('isValidClaudeDirectory', () => {
    it('should validate directory with layers', () => {
      const claudeDir = resolve(simpleProjectDir, '.claude');
      expect(isValidClaudeDirectory(claudeDir)).toBe(true);
    });

    it('should reject non-existent directory', () => {
      const fakeDir = '/tmp/nonexistent-claude-12345';
      expect(isValidClaudeDirectory(fakeDir)).toBe(false);
    });

    it('should reject directory without layer subdirectories', () => {
      // fixturesDir itself is not a valid .claude directory
      expect(isValidClaudeDirectory(fixturesDir)).toBe(false);
    });
  });

  describe('getValidClaudeDirectories', () => {
    it('should return only valid directories', () => {
      const dirs = getValidClaudeDirectories({
        cwd: simpleProjectDir,
      });

      // Should have at least project scope
      expect(dirs.length).toBeGreaterThan(0);

      // All returned directories should exist and be valid
      for (const dir of dirs) {
        expect(dir.exists).toBe(true);
        expect(isValidClaudeDirectory(dir.path)).toBe(true);
      }
    });

    it('should not include system scope', () => {
      const dirs = getValidClaudeDirectories({
        cwd: simpleProjectDir,
      });

      const systemDir = dirs.find((d) => d.scope === ScopeLevel.System);
      expect(systemDir).toBeUndefined();
    });
  });
});
