/**
 * Tests for config structure types and schemas
 */

import { describe, it, expect } from 'vitest';
import {
  ScopeConfigSchema,
  MergedConfigSchema,
  ConfigContextSchema,
  ConfigFileSchema,
  ValidationResultSchema,
} from '../../../src/types/config.js';
import { ScopeLevel } from '../../../src/types/scope.js';

describe('Config Structure Types', () => {
  describe('ScopeConfigSchema', () => {
    it('should accept valid scope config with all layers', () => {
      const config = {
        scope: ScopeLevel.Project,
        basePath: '/path/to/project/.claude',
        rules: {
          security: ['No secrets in code'],
        },
        tools: {
          mcpServers: [{ name: 'github', command: 'npx' }],
        },
        methods: {
          override: false,
        },
        knowledge: {
          overview: 'Project overview',
        },
        goals: {
          current: 'Build feature X',
        },
      };
      const result = ScopeConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept minimal scope config', () => {
      const config = {
        scope: ScopeLevel.User,
        basePath: '~/.claude',
      };
      const result = ScopeConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const config = {
        scope: ScopeLevel.Project,
      };
      const result = ScopeConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('MergedConfigSchema', () => {
    it('should accept valid merged config', () => {
      const config = {
        rules: { security: ['Rule 1'] },
        tools: { mcpServers: [] },
        methods: { workflows: {} },
        knowledge: { overview: 'Overview' },
        goals: { current: 'Current goal' },
        metadata: {
          mergedAt: new Date(),
          scopesIncluded: [ScopeLevel.Project, ScopeLevel.User],
          layerSources: {
            rules: ['/project/.claude/rules.md'],
            tools: [],
            methods: [],
            knowledge: ['/project/.claude/knowledge.md'],
            goals: [],
          },
        },
      };
      const result = MergedConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept merged config with empty layers', () => {
      const config = {
        rules: {},
        tools: {},
        methods: {},
        knowledge: {},
        goals: {},
        metadata: {
          mergedAt: new Date(),
          scopesIncluded: [],
          layerSources: {},
        },
      };
      const result = MergedConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('ConfigContextSchema', () => {
    it('should accept valid config context', () => {
      const context = {
        config: {
          rules: {},
          tools: {},
          methods: {},
          knowledge: {},
          goals: {},
          metadata: {
            mergedAt: new Date(),
            scopesIncluded: [ScopeLevel.Project],
            layerSources: {},
          },
        },
        scopes: {
          project: {
            scope: ScopeLevel.Project,
            basePath: '/project/.claude',
          },
        },
        createdAt: new Date(),
        taskId: 'task-123',
      };
      const result = ConfigContextSchema.safeParse(context);
      expect(result.success).toBe(true);
    });

    it('should accept context without optional taskId', () => {
      const context = {
        config: {
          rules: {},
          tools: {},
          methods: {},
          knowledge: {},
          goals: {},
          metadata: {
            mergedAt: new Date(),
            scopesIncluded: [],
            layerSources: {},
          },
        },
        scopes: {},
        createdAt: new Date(),
      };
      const result = ConfigContextSchema.safeParse(context);
      expect(result.success).toBe(true);
    });
  });

  describe('ConfigFileSchema', () => {
    it('should accept valid config file', () => {
      const configFile = {
        version: '1.0.0',
        description: 'Project configuration',
        layers: {
          rules: {
            include: ['security.md', 'standards.md'],
            exclude: ['draft.md'],
          },
          methods: {
            include: ['workflows/*.md'],
            override: true,
          },
        },
        legacy: {
          claudeMd: true,
          agentsMd: false,
        },
      };
      const result = ConfigFileSchema.safeParse(configFile);
      expect(result.success).toBe(true);
    });

    it('should accept minimal config file', () => {
      const configFile = {
        version: '1.0.0',
      };
      const result = ConfigFileSchema.safeParse(configFile);
      expect(result.success).toBe(true);
    });

    it('should accept config file with partial layer config', () => {
      const configFile = {
        version: '1.0.0',
        layers: {
          rules: {
            include: ['*.md'],
          },
          goals: {
            override: true,
          },
        },
      };
      const result = ConfigFileSchema.safeParse(configFile);
      expect(result.success).toBe(true);
    });
  });

  describe('ValidationResultSchema', () => {
    it('should accept valid validation result', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
      };
      const validation = ValidationResultSchema.safeParse(result);
      expect(validation.success).toBe(true);
    });

    it('should accept validation result with errors', () => {
      const result = {
        valid: false,
        errors: [
          {
            location: 'rules/security.md',
            message: 'Invalid rule format',
            sourcePath: '/project/.claude/rules/security.md',
            suggestion: 'Use bullet points for rules',
          },
        ],
        warnings: [
          {
            location: 'methods',
            message: 'No workflows defined',
          },
        ],
      };
      const validation = ValidationResultSchema.safeParse(result);
      expect(validation.success).toBe(true);
    });

    it('should accept validation result with minimal errors', () => {
      const result = {
        valid: false,
        errors: [
          {
            location: 'goals',
            message: 'Missing success criteria',
          },
        ],
        warnings: [],
      };
      const validation = ValidationResultSchema.safeParse(result);
      expect(validation.success).toBe(true);
    });
  });
});
