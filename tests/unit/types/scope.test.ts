/**
 * Tests for scope type definitions and schemas
 */

import { describe, it, expect } from 'vitest';
import {
  ScopeLevel,
  ScopeLevelSchema,
  ScopeMetadataSchema,
  scopedValueSchema,
  ScopeResolutionPathSchema,
} from '../../../src/types/scope.js';
import { z } from 'zod';

describe('Scope Types', () => {
  describe('ScopeLevel enum', () => {
    it('should have all 4 scope levels', () => {
      expect(ScopeLevel.Task).toBe('task');
      expect(ScopeLevel.Project).toBe('project');
      expect(ScopeLevel.User).toBe('user');
      expect(ScopeLevel.System).toBe('system');
    });

    it('should validate correct enum values', () => {
      expect(ScopeLevelSchema.safeParse('task').success).toBe(true);
      expect(ScopeLevelSchema.safeParse('project').success).toBe(true);
      expect(ScopeLevelSchema.safeParse('user').success).toBe(true);
      expect(ScopeLevelSchema.safeParse('system').success).toBe(true);
    });

    it('should reject invalid enum values', () => {
      expect(ScopeLevelSchema.safeParse('invalid').success).toBe(false);
      expect(ScopeLevelSchema.safeParse('global').success).toBe(false);
    });
  });

  describe('ScopeMetadataSchema', () => {
    it('should accept valid scope metadata', () => {
      const metadata = {
        level: ScopeLevel.Project,
        sourcePath: '/path/to/.claude/rules.md',
        loadedAt: new Date(),
        description: 'Project rules',
      };
      const result = ScopeMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });

    it('should accept metadata without optional description', () => {
      const metadata = {
        level: ScopeLevel.User,
        sourcePath: '~/.claude/rules.md',
        loadedAt: new Date(),
      };
      const result = ScopeMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });

    it('should reject invalid level', () => {
      const metadata = {
        level: 'invalid',
        sourcePath: '/path',
        loadedAt: new Date(),
      };
      const result = ScopeMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const metadata = {
        level: ScopeLevel.Project,
      };
      const result = ScopeMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });
  });

  describe('scopedValueSchema', () => {
    it('should create schema for string value', () => {
      const schema = scopedValueSchema(z.string());
      const value = {
        value: 'test',
        scope: {
          level: ScopeLevel.Project,
          sourcePath: '/test.md',
          loadedAt: new Date(),
        },
      };
      const result = schema.safeParse(value);
      expect(result.success).toBe(true);
    });

    it('should create schema for complex object value', () => {
      const schema = scopedValueSchema(
        z.object({
          name: z.string(),
          count: z.number(),
        })
      );
      const value = {
        value: { name: 'test', count: 42 },
        scope: {
          level: ScopeLevel.User,
          sourcePath: '~/.claude/config.md',
          loadedAt: new Date(),
        },
      };
      const result = schema.safeParse(value);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched value type', () => {
      const schema = scopedValueSchema(z.number());
      const value = {
        value: 'not-a-number',
        scope: {
          level: ScopeLevel.Project,
          sourcePath: '/test.md',
          loadedAt: new Date(),
        },
      };
      const result = schema.safeParse(value);
      expect(result.success).toBe(false);
    });
  });

  describe('ScopeResolutionPathSchema', () => {
    it('should accept valid resolution path', () => {
      const path = {
        checked: [
          ScopeLevel.Task,
          ScopeLevel.Project,
          ScopeLevel.User,
        ],
        resolved: ScopeLevel.Project,
        skipped: [ScopeLevel.System],
      };
      const result = ScopeResolutionPathSchema.safeParse(path);
      expect(result.success).toBe(true);
    });

    it('should accept null resolved value', () => {
      const path = {
        checked: [ScopeLevel.Task, ScopeLevel.Project],
        resolved: null,
        skipped: [],
      };
      const result = ScopeResolutionPathSchema.safeParse(path);
      expect(result.success).toBe(true);
    });

    it('should accept empty arrays', () => {
      const path = {
        checked: [],
        resolved: null,
        skipped: [],
      };
      const result = ScopeResolutionPathSchema.safeParse(path);
      expect(result.success).toBe(true);
    });
  });
});
