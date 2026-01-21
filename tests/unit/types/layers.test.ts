/**
 * Tests for layer type definitions and schemas
 */

import { describe, it, expect } from 'vitest';
import {
  LayerType,
  MergeStrategy,
  getMergeStrategy,
  RulesLayerSchema,
  ToolsLayerSchema,
  MethodsLayerSchema,
  KnowledgeLayerSchema,
  GoalsLayerSchema,
  MCPServerConfigSchema,
  SlashCommandSchema,
  PatternSchema,
  ADRSchema,
  SuccessCriteriaSchema,
} from '../../../src/types/layers.js';

describe('Layer Types', () => {
  describe('LayerType enum', () => {
    it('should have all 5 layer types', () => {
      expect(LayerType.Rules).toBe('rules');
      expect(LayerType.Tools).toBe('tools');
      expect(LayerType.Methods).toBe('methods');
      expect(LayerType.Knowledge).toBe('knowledge');
      expect(LayerType.Goals).toBe('goals');
    });
  });

  describe('getMergeStrategy', () => {
    it('should return Additive for Rules', () => {
      expect(getMergeStrategy(LayerType.Rules)).toBe(MergeStrategy.Additive);
    });

    it('should return Additive for Tools', () => {
      expect(getMergeStrategy(LayerType.Tools)).toBe(MergeStrategy.Additive);
    });

    it('should return Override for Methods', () => {
      expect(getMergeStrategy(LayerType.Methods)).toBe(MergeStrategy.Override);
    });

    it('should return Additive for Knowledge', () => {
      expect(getMergeStrategy(LayerType.Knowledge)).toBe(
        MergeStrategy.Additive
      );
    });

    it('should return Override for Goals', () => {
      expect(getMergeStrategy(LayerType.Goals)).toBe(MergeStrategy.Override);
    });
  });

  describe('RulesLayerSchema', () => {
    it('should accept valid rules layer', () => {
      const rules = {
        security: ['Never commit secrets'],
        forbidden: ['No direct DB access'],
        required: ['Always use TypeScript strict mode'],
      };
      const result = RulesLayerSchema.safeParse(rules);
      expect(result.success).toBe(true);
    });

    it('should accept empty rules layer', () => {
      const result = RulesLayerSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject invalid security type', () => {
      const rules = { security: 'not-an-array' };
      const result = RulesLayerSchema.safeParse(rules);
      expect(result.success).toBe(false);
    });
  });

  describe('MCPServerConfigSchema', () => {
    it('should accept valid MCP server config', () => {
      const server = {
        name: 'github',
        command: 'npx',
        args: ['@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'xxx' },
        description: 'GitHub integration',
      };
      const result = MCPServerConfigSchema.safeParse(server);
      expect(result.success).toBe(true);
    });

    it('should accept minimal MCP server config', () => {
      const server = {
        name: 'simple',
        command: '/usr/bin/server',
      };
      const result = MCPServerConfigSchema.safeParse(server);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const server = { name: 'incomplete' };
      const result = MCPServerConfigSchema.safeParse(server);
      expect(result.success).toBe(false);
    });
  });

  describe('ToolsLayerSchema', () => {
    it('should accept valid tools layer', () => {
      const tools = {
        mcpServers: [
          { name: 'github', command: 'npx', args: ['gh-server'] },
        ],
        commands: [
          {
            name: 'deploy',
            description: 'Deploy to staging',
            implementation: './scripts/deploy.sh',
          },
        ],
        scripts: { setup: './setup.sh' },
      };
      const result = ToolsLayerSchema.safeParse(tools);
      expect(result.success).toBe(true);
    });
  });

  describe('PatternSchema', () => {
    it('should accept valid pattern', () => {
      const pattern = {
        name: 'Error Handling',
        when: 'When calling external APIs',
        implementation: 'Use try-catch with proper error types',
        example: 'try { await api.call() } catch (e) { ... }',
      };
      const result = PatternSchema.safeParse(pattern);
      expect(result.success).toBe(true);
    });

    it('should accept pattern without example', () => {
      const pattern = {
        name: 'Simple Pattern',
        when: 'Always',
        implementation: 'Do it this way',
      };
      const result = PatternSchema.safeParse(pattern);
      expect(result.success).toBe(true);
    });
  });

  describe('MethodsLayerSchema', () => {
    it('should accept valid methods layer', () => {
      const methods = {
        workflows: {
          newFeature: [
            { step: 1, description: 'Define types' },
            { step: 2, description: 'Implement' },
          ],
        },
        patterns: [
          {
            name: 'API Pattern',
            when: 'Building APIs',
            implementation: 'Use Hono',
          },
        ],
        override: true,
      };
      const result = MethodsLayerSchema.safeParse(methods);
      expect(result.success).toBe(true);
    });
  });

  describe('ADRSchema', () => {
    it('should accept valid ADR', () => {
      const adr = {
        number: 1,
        title: 'Use Hono for API',
        status: 'accepted',
        context: 'Need fast API framework',
        decision: 'Use Hono instead of Express',
        consequences: 'Better performance, smaller bundle',
      };
      const result = ADRSchema.safeParse(adr);
      expect(result.success).toBe(true);
    });

    it('should accept ADR without consequences', () => {
      const adr = {
        number: 2,
        title: 'Decision',
        status: 'proposed',
        context: 'Context here',
        decision: 'Decision here',
      };
      const result = ADRSchema.safeParse(adr);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const adr = {
        number: 3,
        title: 'Test',
        status: 'invalid',
        context: 'Context',
        decision: 'Decision',
      };
      const result = ADRSchema.safeParse(adr);
      expect(result.success).toBe(false);
    });
  });

  describe('KnowledgeLayerSchema', () => {
    it('should accept valid knowledge layer', () => {
      const knowledge = {
        overview: 'This is a SaaS app',
        architecture: 'Next.js + Hono + PostgreSQL',
        glossary: { invoice: 'A billing document' },
        adrs: [
          {
            number: 1,
            title: 'Framework choice',
            status: 'accepted',
            context: 'Need modern stack',
            decision: 'Use Next.js',
          },
        ],
      };
      const result = KnowledgeLayerSchema.safeParse(knowledge);
      expect(result.success).toBe(true);
    });
  });

  describe('SuccessCriteriaSchema', () => {
    it('should accept valid success criteria', () => {
      const criteria = {
        description: 'Upload PDF works',
        completed: false,
        test: 'POST /api/upload returns 200',
      };
      const result = SuccessCriteriaSchema.safeParse(criteria);
      expect(result.success).toBe(true);
    });
  });

  describe('GoalsLayerSchema', () => {
    it('should accept valid goals layer', () => {
      const goals = {
        current: 'Implement OCR processing',
        successCriteria: [
          { description: 'Upload works', completed: false },
          { description: 'Extraction works', completed: false },
        ],
        nonGoals: ['No UI this sprint'],
        priorities: ['Basic extraction', 'Accuracy', 'Performance'],
        override: true,
      };
      const result = GoalsLayerSchema.safeParse(goals);
      expect(result.success).toBe(true);
    });
  });
});
