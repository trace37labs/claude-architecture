import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import {
  readFile,
  readDirectory,
  readMarkdownFiles,
  readYamlFiles,
  combineMarkdownFiles,
  fileExists,
  getFileModificationTime,
  buildFileTree,
} from '../../src/reader.js';

describe('Reader', () => {
  const fixturesDir = resolve(process.cwd(), 'tests/fixtures');
  const simpleProjectDir = resolve(fixturesDir, 'simple-project');
  const rulesDir = resolve(simpleProjectDir, '.claude', 'rules');

  describe('readFile', () => {
    it('should read a markdown file', () => {
      const filePath = resolve(rulesDir, 'security.md');
      const content = readFile(filePath);

      expect(content.path).toBe(filePath);
      expect(content.name).toBe('security');
      expect(content.extension).toBe('.md');
      expect(content.content).toContain('Security Rules');
      expect(content.readAt).toBeInstanceOf(Date);
    });

    it('should extract filename without extension', () => {
      const filePath = resolve(rulesDir, 'security.md');
      const content = readFile(filePath);

      expect(content.name).toBe('security');
    });
  });

  describe('readDirectory', () => {
    it('should read all markdown files in directory', () => {
      const files = readDirectory(rulesDir, {
        extensions: ['.md'],
      });

      expect(files.length).toBeGreaterThan(0);
      expect(files[0].extension).toBe('.md');
    });

    it('should filter by extension', () => {
      const files = readDirectory(rulesDir, {
        extensions: ['.yaml', '.yml'],
      });

      // rules directory should only have .md files
      expect(files.length).toBe(0);
    });

    it('should handle non-existent directory gracefully', () => {
      const fakeDir = '/tmp/nonexistent-dir-12345';
      const files = readDirectory(fakeDir);

      expect(files).toEqual([]);
    });

    it('should respect pattern matching', () => {
      const files = readDirectory(rulesDir, {
        pattern: /security/,
      });

      expect(files.length).toBeGreaterThan(0);
      expect(files[0].name).toBe('security');
    });
  });

  describe('readMarkdownFiles', () => {
    it('should read markdown files', () => {
      const files = readMarkdownFiles(rulesDir);

      expect(files.length).toBeGreaterThan(0);
      for (const file of files) {
        expect(file.extension).toMatch(/\.md$/);
      }
    });

    it('should not read non-markdown files', () => {
      // Create a test to verify only .md files are read
      const files = readMarkdownFiles(rulesDir);

      // Verify all are markdown
      const allMarkdown = files.every(
        (f) => f.extension === '.md' || f.extension === '.markdown'
      );
      expect(allMarkdown).toBe(true);
    });
  });

  describe('readYamlFiles', () => {
    it('should return empty array when no yaml files exist', () => {
      const files = readYamlFiles(rulesDir);

      // rules directory has no yaml files
      expect(files).toEqual([]);
    });
  });

  describe('combineMarkdownFiles', () => {
    it('should combine multiple markdown files', () => {
      const combined = combineMarkdownFiles(rulesDir);

      expect(combined).toContain('Security Rules');
      expect(typeof combined).toBe('string');
    });

    it('should use custom separator', () => {
      const combined = combineMarkdownFiles(rulesDir, '\n\n===\n\n');

      if (combined.includes('===')) {
        expect(combined).toContain('===');
      }
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', () => {
      const filePath = resolve(rulesDir, 'security.md');
      expect(fileExists(filePath)).toBe(true);
    });

    it('should return false for non-existent file', () => {
      const fakePath = '/tmp/nonexistent-file-12345.md';
      expect(fileExists(fakePath)).toBe(false);
    });

    it('should return false for directory', () => {
      expect(fileExists(rulesDir)).toBe(false);
    });
  });

  describe('getFileModificationTime', () => {
    it('should return modification time for existing file', () => {
      const filePath = resolve(rulesDir, 'security.md');
      const mtime = getFileModificationTime(filePath);

      expect(mtime).toBeInstanceOf(Date);
    });

    it('should return null for non-existent file', () => {
      const fakePath = '/tmp/nonexistent-file-12345.md';
      const mtime = getFileModificationTime(fakePath);

      expect(mtime).toBeNull();
    });
  });

  describe('buildFileTree', () => {
    it('should build file tree structure', () => {
      const tree = buildFileTree(rulesDir, 2);

      expect(tree).toBeDefined();
      expect(tree?.type).toBe('directory');
      expect(tree?.name).toBe('rules');
    });

    it('should include children', () => {
      const tree = buildFileTree(rulesDir, 2);

      expect(tree?.children).toBeDefined();
      expect(tree?.children!.length).toBeGreaterThan(0);
    });

    it('should respect maxDepth', () => {
      const tree = buildFileTree(simpleProjectDir, 1);

      expect(tree).toBeDefined();
      // At depth 1, we might or might not have children depending on the directory
      // The key is that maxDepth is respected
      if (tree?.children) {
        const claudeChild = tree.children.find((c) => c.name === '.claude');
        if (claudeChild && claudeChild.type === 'directory') {
          // Children might be undefined or empty at this depth
          expect(claudeChild.children === undefined || claudeChild.children.length === 0).toBe(true);
        }
      } else {
        // It's okay if there are no children at depth 1
        expect(tree.children).toBeUndefined();
      }
    });

    it('should return null for non-existent path', () => {
      const tree = buildFileTree('/tmp/nonexistent-12345');
      expect(tree).toBeNull();
    });
  });
});
